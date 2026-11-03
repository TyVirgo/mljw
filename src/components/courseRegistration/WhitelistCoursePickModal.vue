<script setup>
/**
 * 白名单选课：
 * - course：先修豁免（按课号勾选；课级 rowspan）
 * - section：未来必修 / 换组（按课程分组行勾选 section ref；课级字段仍 rowspan）
 */
import { ref, computed, watch, nextTick } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { selectableCourses } from '../../data/courseRegistration/selectableCourses.js'
import { displayClassTimeVenueLines } from '../../data/courseRegistration/sectionScheduleFields.js'
import { isMandatoryAddDropCourse } from '../../data/courseRegistration/addDropMultiItems.js'
import { courseMatchesStudentProgramme } from '../../data/courseRegistration/studentEligibility.js'
import {
  whitelistSectionRefKey,
  normalizeWhitelistSectionRefs,
  parseWhitelistSectionRefKey,
} from '../../data/courseRegistration/whitelistSectionRefs.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  selectedCodes: { type: Array, default: () => [] },
  selectedSections: { type: Array, default: () => [] },
  /** @type {'course'|'section'} */
  selectionUnit: { type: String, default: 'course' },
  coreOnly: { type: Boolean, default: false },
  /**
   * 已选学生专业码列表；有值时课块须匹配其中任一专业（并集）
   * @type {string[]}
   */
  studentProgrammes: { type: Array, default: () => [] },
  titleKey: { type: String, default: 'courseRegistration.whitelist.prereqCoursePickTitle' },
  hintKey: { type: String, default: 'courseRegistration.whitelist.prereqCoursePickHint' },
})

const emit = defineEmits(['close', 'confirm'])

const { t, locale } = useAppI18n()

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const pickedCodes = ref([])
const pickedSectionKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const selectAllEl = ref(null)

const scheduleLocale = computed(() => (locale.value === 'en' ? 'en' : 'zh'))
const isSectionUnit = computed(() => props.selectionUnit === 'section')

/**
 * 课程是否落入已选学生专业范围（无专业过滤则不过滤）
 * @param {object} course
 */
function courseMatchesAnySelectedProgramme(course) {
  const programmes = (props.studentProgrammes || [])
    .map((p) => String(p || '').trim())
    .filter(Boolean)
  if (!programmes.length) return true
  return programmes.some((programme) => courseMatchesStudentProgramme(course, programme))
}

/** 按课聚合（分页单位） */
const courseBlocks = computed(() => {
  const blocks = []
  for (const c of selectableCourses.value || []) {
    const code = String(c.code || '').trim()
    if (!code) continue
    if (props.coreOnly && !isMandatoryAddDropCourse(c)) continue
    if (!courseMatchesAnySelectedProgramme(c)) continue
    const sections = Array.isArray(c.sections) && c.sections.length
      ? c.sections
      : [
          {
            id: `${c.id || code}-01`,
            code: c.sectionCode || '01',
            name: c.sectionName || '',
            time: c.time || c.classTime || '',
            room: c.room || c.venue || '',
            lecturer: c.lecturer || c.lecturers || '',
            weekRange: c.weekRange || '1-18',
            meetings: c.meetings,
          },
        ]
    const sectionLines = []
    for (const section of sections) {
      const secCode = String(section.code || section.id || '01').trim() || '01'
      sectionLines.push({
        sectionKey: whitelistSectionRefKey({ courseCode: code, sectionCode: secCode }),
        sectionCode: secCode,
        groupLabel: groupLabelFor(secCode, section),
        lecturer: String(section.lecturer || section.lecturers || c.lecturer || '').trim() || '—',
        timeLines: displayClassTimeVenueLines(
          {
            ...section,
            time: section.time || section.classTime || '',
            room: section.room || section.venue || '',
            weekRange: section.weekRange || '1-18',
          },
          scheduleLocale.value,
        ),
      })
    }
    sectionLines.sort((a, b) => String(a.sectionCode).localeCompare(String(b.sectionCode)))
    blocks.push({
      code,
      name: c.name || code,
      credits: c.credits,
      sectionKeys: sectionLines.map((s) => s.sectionKey).filter(Boolean),
      sectionLines,
    })
  }
  return blocks.sort((a, b) => a.code.localeCompare(b.code))
})

const filteredBlocks = computed(() => {
  const code = String(appliedSearch.value.courseCode || '')
    .trim()
    .toLowerCase()
  const name = String(appliedSearch.value.courseName || '')
    .trim()
    .toLowerCase()
  return courseBlocks.value.filter((block) => {
    if (code && !String(block.code).toLowerCase().includes(code)) return false
    if (name && !String(block.name).toLowerCase().includes(name)) return false
    return true
  })
})

const totalCount = computed(() => filteredBlocks.value.length)

const paginatedBlocks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredBlocks.value.slice(start, start + pageSize.value)
})

/** 展平为组行 + 课级 rowspan 元数据 */
const paginatedRows = computed(() => {
  const rows = []
  for (const block of paginatedBlocks.value) {
    const span = Math.max(1, block.sectionLines.length)
    block.sectionLines.forEach((line, idx) => {
      rows.push({
        rowKey: `${block.code}::${line.sectionKey}`,
        code: block.code,
        name: block.name,
        credits: block.credits,
        sectionKeys: block.sectionKeys,
        ...line,
        _span: {
          course: idx === 0 ? { show: true, rowspan: span } : { show: false },
        },
      })
    })
  }
  return rows
})

const pageCourseCodes = computed(() => paginatedBlocks.value.map((b) => b.code))

/** 当前页分组键（section 模式全选用） */
const pageSectionKeys = computed(() =>
  paginatedRows.value.map((row) => row.sectionKey).filter(Boolean),
)

const pageAllSelected = computed(() => {
  if (isSectionUnit.value) {
    const keys = pageSectionKeys.value
    if (!keys.length) return false
    const set = new Set(pickedSectionKeys.value)
    return keys.every((k) => set.has(k))
  }
  const codes = pageCourseCodes.value
  if (!codes.length) return false
  return codes.every((code) => isCoursePicked(code))
})

const pageSomeSelected = computed(() => {
  if (isSectionUnit.value) {
    const keys = pageSectionKeys.value
    if (!keys.length) return false
    const set = new Set(pickedSectionKeys.value)
    let hit = 0
    for (const k of keys) {
      if (set.has(k)) hit += 1
    }
    return hit > 0 && hit < keys.length
  }
  const codes = pageCourseCodes.value
  if (!codes.length) return false
  const n = codes.filter((code) => isCoursePicked(code)).length
  return n > 0 && n < codes.length
})

/** 已选数量：course=课号数；section=分组 ref 数 */
const pickedCount = computed(() => {
  if (isSectionUnit.value) return pickedSectionKeys.value.length
  return pickedCodes.value.length
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    searchForm.value = emptySearch()
    appliedSearch.value = emptySearch()
    pickedCodes.value = [...(props.selectedCodes || [])].map((c) => String(c).trim()).filter(Boolean)
    pickedSectionKeys.value = normalizeWhitelistSectionRefs(props.selectedSections || []).map(
      (r) => whitelistSectionRefKey(r),
    )
    currentPage.value = 1
    pageSize.value = 20
  },
)

function emptySearch() {
  return { courseCode: '', courseName: '' }
}

function groupLabelFor(secCode, section) {
  const name = String(section?.name || section?.sectionName || '').trim()
  if (name) return name
  return t('courseRegistration.courses.sectionNameDisplay', { code: secCode })
}

/**
 * @deprecated section 模式改为按分组键勾选后不再使用；保留避免外部误引用断裂
 * @param {string} code
 */
function blockByCode(code) {
  return courseBlocks.value.find((b) => b.code === code) || null
}

/**
 * 课号是否已勾选（仅 course 模式）
 * @param {string} code
 */
function isCoursePicked(code) {
  return pickedCodes.value.includes(code)
}

/**
 * 分组 ref 是否已勾选（section 模式）
 * @param {string} sectionKey
 */
function isSectionPicked(sectionKey) {
  if (!sectionKey) return false
  return pickedSectionKeys.value.includes(sectionKey)
}

/**
 * 行是否高亮为已选
 * @param {object} row
 */
function isRowSelected(row) {
  if (isSectionUnit.value) return isSectionPicked(row.sectionKey)
  return isCoursePicked(row.code)
}

function courseSpan(row) {
  return row?._span?.course || { show: true, rowspan: 1 }
}

/**
 * 切换课号勾选（course 模式）
 * @param {string} code
 */
function toggleCourse(code) {
  const set = new Set(pickedCodes.value)
  if (set.has(code)) set.delete(code)
  else set.add(code)
  pickedCodes.value = [...set]
}

/**
 * 切换单个课程分组勾选（section 模式）
 * @param {string} sectionKey
 */
function toggleSection(sectionKey) {
  if (!sectionKey) return
  const set = new Set(pickedSectionKeys.value)
  if (set.has(sectionKey)) set.delete(sectionKey)
  else set.add(sectionKey)
  pickedSectionKeys.value = [...set]
}

/**
 * 点击行：section 切分组，course 切课号
 * @param {object} row
 */
function toggleRow(row) {
  if (isSectionUnit.value) toggleSection(row.sectionKey)
  else toggleCourse(row.code)
}

function togglePageSelectAll() {
  if (isSectionUnit.value) {
    const keys = pageSectionKeys.value
    const set = new Set(pickedSectionKeys.value)
    if (pageAllSelected.value) {
      for (const k of keys) set.delete(k)
    } else {
      for (const k of keys) set.add(k)
    }
    pickedSectionKeys.value = [...set]
    return
  }
  const codes = pageCourseCodes.value
  const set = new Set(pickedCodes.value)
  if (pageAllSelected.value) {
    for (const code of codes) set.delete(code)
  } else {
    for (const code of codes) set.add(code)
  }
  pickedCodes.value = [...set]
}

/** 当前过滤结果是否已全部勾选 */
const filteredAllSelected = computed(() => {
  const blocks = filteredBlocks.value
  if (!blocks.length) return false
  if (isSectionUnit.value) {
    const set = new Set(pickedSectionKeys.value)
    return blocks.every((b) => (b.sectionKeys || []).every((k) => set.has(k)))
  }
  const set = new Set(pickedCodes.value)
  return blocks.every((b) => set.has(b.code))
})

/**
 * 全选 / 取消全选：当前搜索过滤后的全部课或分组（非仅本页）
 */
function toggleFilteredSelectAll() {
  const blocks = filteredBlocks.value
  if (isSectionUnit.value) {
    if (filteredAllSelected.value) {
      pickedSectionKeys.value = []
      return
    }
    const set = new Set()
    for (const block of blocks) {
      for (const k of block.sectionKeys || []) set.add(k)
    }
    pickedSectionKeys.value = [...set]
    return
  }
  if (filteredAllSelected.value) {
    pickedCodes.value = []
    return
  }
  pickedCodes.value = blocks.map((b) => b.code)
}

watch(
  [pageAllSelected, pageSomeSelected, paginatedRows, pickedCodes, pickedSectionKeys],
  async () => {
    await nextTick()
    if (selectAllEl.value) {
      selectAllEl.value.indeterminate = pageSomeSelected.value
    }
  },
)

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleConfirm() {
  if (isSectionUnit.value) {
    emit(
      'confirm',
      pickedSectionKeys.value.map(parseWhitelistSectionRefKey).filter(Boolean),
    )
    return
  }
  emit('confirm', [...pickedCodes.value])
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>{{ t(titleKey) }}</h3>
          <button type="button" class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="search-bar pick-search">
            <div class="search-row">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.code') }}</label>
                  <input
                    v-model="searchForm.courseCode"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.name') }}</label>
                  <input
                    v-model="searchForm.courseName"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">
                  {{ t('common.search') }}
                </button>
                <button type="button" class="btn btn-default" @click="handleReset">
                  {{ t('common.reset') }}
                </button>
              </div>
            </div>
          </div>
          <div class="pick-hint-row">
            <p class="pick-hint">
              {{ t(hintKey, { n: pickedCount }) }}
            </p>
            <button
              type="button"
              class="btn btn-default pick-select-all-btn"
              :disabled="!filteredBlocks.length"
              @click="toggleFilteredSelectAll"
            >
              {{
                filteredAllSelected
                  ? t('courseRegistration.whitelist.clearFilteredSelection')
                  : t('courseRegistration.whitelist.selectAllFiltered')
              }}
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      ref="selectAllEl"
                      type="checkbox"
                      :checked="pageAllSelected"
                      :disabled="
                        isSectionUnit ? !pageSectionKeys.length : !pageCourseCodes.length
                      "
                      :aria-label="t('courseRegistration.whitelist.prereqSelectAllPage')"
                      @change="togglePageSelectAll"
                    />
                  </th>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.credits') }}</th>
                  <th>{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                  <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.rowKey"
                  :class="{ selected: isRowSelected(row) }"
                  @click="toggleRow(row)"
                >
                  <!-- section：每行分组勾选；course：课级合并勾选 -->
                  <td
                    v-if="isSectionUnit"
                    class="col-check"
                    @click.stop
                  >
                    <input
                      type="checkbox"
                      :checked="isSectionPicked(row.sectionKey)"
                      @change="toggleSection(row.sectionKey)"
                    />
                  </td>
                  <td
                    v-else-if="courseSpan(row).show"
                    class="col-check cell-course"
                    :rowspan="courseSpan(row).rowspan"
                    @click.stop
                  >
                    <input
                      type="checkbox"
                      :checked="isCoursePicked(row.code)"
                      @change="toggleCourse(row.code)"
                    />
                  </td>
                  <td
                    v-if="courseSpan(row).show"
                    class="cell-course"
                    :rowspan="courseSpan(row).rowspan"
                  >
                    {{ row.code }}
                  </td>
                  <td
                    v-if="courseSpan(row).show"
                    class="cell-course"
                    :rowspan="courseSpan(row).rowspan"
                  >
                    {{ row.name }}
                  </td>
                  <td
                    v-if="courseSpan(row).show"
                    class="cell-course"
                    :rowspan="courseSpan(row).rowspan"
                  >
                    {{ row.credits }}
                  </td>
                  <td>{{ row.groupLabel }}</td>
                  <td>{{ row.lecturer }}</td>
                  <td class="col-time" :title="row.timeLines.join('\n') || undefined">
                    <template v-if="row.timeLines.length">
                      <div v-for="(tl, li) in row.timeLines" :key="li" class="time-line">
                        {{ tl }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="7" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
          />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal-panel {
  width: min(1080px, 100%);
  max-height: min(86vh, 900px);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.modal-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}
.modal-body {
  padding: 14px 18px;
  overflow: auto;
  flex: 1;
}
.pick-search {
  margin: 0 0 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}
.pick-hint-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 8px;
}

.pick-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.pick-select-all-btn {
  flex: 0 0 auto;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}
.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th,
.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: middle;
}
.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}
.data-table tbody tr {
  cursor: pointer;
}
.data-table tbody tr:hover {
  background: #f8fafc;
}
.data-table tbody tr.selected {
  background: #eff6ff;
}
.data-table td.cell-course[rowspan] {
  vertical-align: middle;
}
.col-check {
  width: 40px;
  text-align: center;
}
.col-time {
  min-width: 12em;
  white-space: normal;
  line-height: 1.35;
  vertical-align: top;
}
.time-line + .time-line {
  margin-top: 2px;
}
.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px 10px !important;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
}
.modal-footer .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}
.modal-footer .btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.modal-footer .btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
