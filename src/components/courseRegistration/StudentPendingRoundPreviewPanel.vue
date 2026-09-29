<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import CourseCodeSourcePopover from './CourseCodeSourcePopover.vue'
import StudentCourseCatalogDrawer from './StudentCourseCatalogDrawer.vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getSelectableCoursesForStudent, normalizeCartRoundKey } from '../../data/courseRegistration/studentRegistrationStore.js'
import {
  filterStudentCourseList,
  filterCoursesByRound,
} from '../../data/courseRegistration/studentRegistrationContext.js'
import { courseTypeOptions, getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import { displayWeekRange, displayClassTimeVenueLines } from '../../data/courseRegistration/sectionScheduleFields.js'
import { getSchoolElectiveCategoryLabel } from '../../data/departments.js'
import { resolveSchoolElectiveCategory } from '../../data/courseRegistration/selectableCourses.js'
import { getCourseDisplayName } from '../../data/courseRegistration/resolveSelectedCourseDisplay.js'
import { getBatchById } from '../../data/courseRegistration/registrationBatches.js'
import {
  getSelectionGroupsForBatch,
  formatSelectionGroupRemark,
  getSelectionGroupDisplayLines,
  selectionGroupToneIndex,
  sortSectionRowsBySelectionGroup,
} from '../../data/courseRegistration/courseSelectionGroups.js'
import {
  buildSectionRowsFromCourses,
  groupSectionRowsByCourse,
  paginateSectionRowsByCourse,
  sortRowsByCourseThenSection,
} from '../../data/courseRegistration/sectionTableRowSpans.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'
import '../../styles/course-registration-student.css'

const props = defineProps({
  batchId: { type: String, required: true },
  roundKey: { type: String, required: true },
})

const { t, isZh } = useAppI18n()

function emptySearch() {
  return { keyword: '', type: '', credits: '', prerequisites: '' }
}

const searchState = ref({ form: emptySearch(), applied: emptySearch() })
const currentPage = ref(1)
const pageSize = ref(50)
const creditsFilterOpen = ref(false)
const catalogVisible = ref(false)

const previewRoundKey = computed(() => normalizeCartRoundKey(props.roundKey))

const previewBatch = computed(() => getBatchById(props.batchId))

/** ME 展示课程组；GE 扁平表（与正式 R1 一致） */
const showSelectionGroupColumn = computed(() => previewBatch.value?.type === 'ME')

const selectionGroups = computed(() => {
  if (!showSelectionGroupColumn.value) return []
  const batch = previewBatch.value
  let groups = getSelectionGroupsForBatch(batch)
  if (!groups.length && batch?.demoCourseSourceBatchId) {
    groups = getSelectionGroupsForBatch(getBatchById(batch.demoCourseSourceBatchId))
  }
  return groups
})

const allCourses = computed(() => {
  void props.batchId
  void props.roundKey
  return getSelectableCoursesForStudent(previewRoundKey.value, { batchId: props.batchId })
})

const roundFilteredCourses = computed(() =>
  filterCoursesByRound(allCourses.value, previewRoundKey.value),
)

/** 与正式选课「课程一览」同源口径 */
const catalogCourses = computed(() =>
  roundFilteredCourses.value.filter((c) => c.eligibility?.eligible !== false),
)

const courses = computed(() =>
  filterStudentCourseList(roundFilteredCourses.value, searchState.value.applied),
)

/** 与正式 R1 同构只读表：课级 rowspan + ME 组排序；无容量列 */
const sectionRowsAll = computed(() => {
  const groups = selectionGroups.value
  const rows = buildSectionRowsFromCourses(courses.value, groups)
  if (groups.length) {
    return sortSectionRowsBySelectionGroup(rows, groups)
  }
  return sortRowsByCourseThenSection(rows)
})

const totalCourseCount = computed(() => groupSectionRowsByCourse(sectionRowsAll.value).length)

const pagedRows = computed(() =>
  paginateSectionRowsByCourse(sectionRowsAll.value, currentPage.value, pageSize.value, {
    groupAware: showSelectionGroupColumn.value,
  }).rows,
)

/** 基础 11 列（无容量）+ ME 课程组/备注 */
const emptyTableColspan = computed(() => {
  let n = 11
  if (showSelectionGroupColumn.value) n += 2
  return n
})

const creditFilterOptions = computed(() => {
  const set = new Set(
    roundFilteredCourses.value.map((item) => Number(item.credits)).filter((n) => Number.isFinite(n)),
  )
  return [...set].sort((a, b) => a - b)
})

const prerequisiteFilterOptions = computed(() => {
  const set = new Set()
  for (const course of roundFilteredCourses.value) {
    for (const code of course.prerequisites || []) {
      if (code) set.add(String(code))
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
})

const creditsFilterActive = computed(() => Boolean(searchState.value.applied.credits))

watch(
  [() => searchState.value.applied, () => props.batchId, () => props.roundKey, pageSize],
  () => {
    currentPage.value = 1
  },
)

function patchSearchForm(patch) {
  searchState.value = {
    ...searchState.value,
    form: { ...searchState.value.form, ...patch },
  }
}

function handleSearch() {
  searchState.value = {
    ...searchState.value,
    applied: { ...searchState.value.form },
  }
}

function handleReset() {
  searchState.value = { form: emptySearch(), applied: emptySearch() }
}

function toggleCreditsFilter(event) {
  event?.stopPropagation?.()
  creditsFilterOpen.value = !creditsFilterOpen.value
}

function closeCreditsFilter() {
  creditsFilterOpen.value = false
}

function onDocumentClick() {
  if (creditsFilterOpen.value) closeCreditsFilter()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

function applyCreditsFilter(value) {
  const nextForm = { ...searchState.value.form, credits: value }
  searchState.value = {
    form: nextForm,
    applied: { ...searchState.value.applied, credits: value },
  }
  closeCreditsFilter()
}

function sectionGroupName(section) {
  if (!section) return '—'
  return t('courseRegistration.courses.sectionNameDisplay', { code: section.code })
}

function spanCell(row, key) {
  return row._span?.[key]
}

function selectionGroupRemarkText(row) {
  const cell = spanCell(row, 'remark')
  if (!cell?.show) return ''
  if (cell.dash) return '—'
  if (cell.group) return formatSelectionGroupRemark(cell.group, t)
  return '—'
}

function selectionGroupDisplayLines(group) {
  return getSelectionGroupDisplayLines(group, isZh.value)
}

function courseSchoolElectiveLabel(course) {
  return getSchoolElectiveCategoryLabel(resolveSchoolElectiveCategory(course), isZh.value)
}

function selectionGroupRowClass(group) {
  if (!showSelectionGroupColumn.value || !group) return undefined
  return [
    'cr-selection-group-row',
    `cr-selection-group-row--tone-${selectionGroupToneIndex(group, selectionGroups.value)}`,
  ]
}
</script>

<template>
  <div class="cr-pending-preview">
    <CourseRegistrationCallout variant="info">
      <p>{{ t('courseRegistration.student.typeEntry.previewHint') }}</p>
    </CourseRegistrationCallout>

    <div class="search-bar">
      <div class="search-row">
        <div class="search-fields">
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.code') }}</label>
            <input
              :value="searchState.form.keyword"
              type="text"
              class="search-input"
              :placeholder="t('courseRegistration.student.searchPlaceholder')"
              @input="patchSearchForm({ keyword: $event.target.value })"
            />
          </div>
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.type') }}</label>
            <select
              :value="searchState.form.type"
              class="search-select"
              @change="patchSearchForm({ type: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="opt in courseTypeOptions" :key="opt.value" :value="opt.value">
                {{ t(opt.labelKey) }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.credits') }}</label>
            <select
              :value="searchState.form.credits"
              class="search-select"
              @change="patchSearchForm({ credits: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="credit in creditFilterOptions" :key="credit" :value="String(credit)">
                {{ credit }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.prerequisites') }}</label>
            <select
              :value="searchState.form.prerequisites"
              class="search-select"
              @change="patchSearchForm({ prerequisites: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option value="none">{{ t('courseRegistration.student.prerequisiteNone') }}</option>
              <option v-for="code in prerequisiteFilterOptions" :key="code" :value="code">
                {{ code }}
              </option>
            </select>
          </div>
        </div>
        <div class="search-actions">
          <button type="button" class="btn btn-primary btn-primary--vivid" @click="handleSearch">
            {{ t('common.search') }}
          </button>
          <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
        </div>
      </div>
    </div>

    <div class="cr-pending-preview-toolbar">
      <button type="button" class="cr-catalog-trigger" @click="catalogVisible = true">
        {{ t('courseRegistration.student.courseCatalogButton') }}
      </button>
    </div>

    <div class="table-section">
      <div class="table-scroll">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.type') }}</th>
                <th class="th-with-tip">
                  <span class="th-label-with-tip">
                    {{ t('courseRegistration.courses.schoolElectiveCategory') }}
                    <span
                      class="hint-popover-wrap"
                      :title="t('courseRegistration.courses.schoolElectiveCategoryTip')"
                    >
                      <span
                        class="hint-popover-trigger"
                        tabindex="0"
                        role="button"
                        :aria-label="t('courseRegistration.courses.schoolElectiveCategoryTip')"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path
                            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                          />
                        </svg>
                      </span>
                      <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                        {{ t('courseRegistration.courses.schoolElectiveCategoryTip') }}
                      </span>
                    </span>
                  </span>
                </th>
                <th class="th-credits-filter">
                  <span class="th-label-with-tip">
                    <span>{{ t('courseRegistration.courses.credits') }}</span>
                    <span
                      class="hint-popover-wrap th-funnel-wrap"
                      :class="{ 'is-active': creditsFilterActive, 'is-open': creditsFilterOpen }"
                      @click.stop
                    >
                      <button
                        type="button"
                        class="th-funnel-btn"
                        :aria-expanded="creditsFilterOpen"
                        :aria-label="t('courseRegistration.student.creditsFilter')"
                        :title="t('courseRegistration.student.creditsFilter')"
                        @click="toggleCreditsFilter"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path
                            d="M1.5 2h13a.5.5 0 0 1 .4.8L10 8.2V13a.5.5 0 0 1-.8.4l-2-1.5A.5.5 0 0 1 7 11.5V8.2L1.1 2.8A.5.5 0 0 1 1.5 2z"
                          />
                        </svg>
                      </button>
                      <span class="hint-popover-content hint-popover-content--sm th-funnel-panel" role="menu">
                        <button
                          type="button"
                          class="th-funnel-option"
                          :class="{ active: !searchState.applied.credits }"
                          @click="applyCreditsFilter('')"
                        >
                          {{ t('common.all') }}
                        </button>
                        <button
                          v-for="credit in creditFilterOptions"
                          :key="credit"
                          type="button"
                          class="th-funnel-option"
                          :class="{ active: String(searchState.applied.credits) === String(credit) }"
                          @click="applyCreditsFilter(String(credit))"
                        >
                          {{ credit }}
                        </button>
                      </span>
                    </span>
                  </span>
                </th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th v-if="showSelectionGroupColumn" class="th-with-tip">
                  <span class="th-label-with-tip">
                    {{ t('courseRegistration.courses.selectionGroup') }}
                    <span
                      class="hint-popover-wrap"
                      :title="t('courseRegistration.courses.selectionGroupTip')"
                    >
                      <span
                        class="hint-popover-trigger"
                        tabindex="0"
                        role="button"
                        :aria-label="t('courseRegistration.courses.selectionGroupTip')"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path
                            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                          />
                        </svg>
                      </span>
                      <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                        {{ t('courseRegistration.courses.selectionGroupTip') }}
                      </span>
                    </span>
                  </span>
                </th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th class="th-with-tip">
                  <span class="th-label-with-tip">
                    {{ t('courseRegistration.courses.prerequisites') }}
                    <span class="hint-popover-wrap hint-popover--align-end th-prereq-tip">
                      <span
                        class="hint-popover-trigger"
                        tabindex="0"
                        role="button"
                        :aria-label="t('courseRegistration.courses.prerequisitesTip')"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path
                            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                          />
                        </svg>
                      </span>
                      <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                        {{ t('courseRegistration.courses.prerequisitesTip') }}
                      </span>
                    </span>
                  </span>
                </th>
                <th v-if="showSelectionGroupColumn">{{ t('courseRegistration.courses.remark') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedRows"
                :key="`${row.course.id}-${row.section?.id || 'none'}`"
                :class="selectionGroupRowClass(row.selectionGroup)"
              >
                <td v-if="spanCell(row, 'serial')?.show" :rowspan="spanCell(row, 'serial').rowspan">
                  {{ spanCell(row, 'serial').value }}
                </td>
                <td
                  v-if="spanCell(row, 'code')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'code').rowspan"
                >
                  <CourseCodeSourcePopover :code="row.course.code" :course="row.course" />
                </td>
                <td
                  v-if="spanCell(row, 'name')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'name').rowspan"
                >
                  {{ getCourseDisplayName(row.course, isZh) }}
                </td>
                <td
                  v-if="spanCell(row, 'type')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'type').rowspan"
                >
                  {{ getRegistrationTypeLabel(row.course.type, t) }}
                </td>
                <td
                  v-if="spanCell(row, 'schoolCat')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'schoolCat').rowspan"
                >
                  {{ courseSchoolElectiveLabel(row.course) }}
                </td>
                <td v-if="spanCell(row, 'credits')?.show" :rowspan="spanCell(row, 'credits').rowspan">
                  {{ row.course.credits }}
                </td>
                <td class="nowrap">{{ sectionGroupName(row.section) }}</td>
                <td
                  v-if="showSelectionGroupColumn && spanCell(row, 'selectionGroup')?.show"
                  class="cr-selection-group-cell"
                  :rowspan="spanCell(row, 'selectionGroup').rowspan"
                >
                  <template v-if="row.selectionGroup">
                    <div class="cr-selection-group-title">
                      {{ selectionGroupDisplayLines(row.selectionGroup).title }}
                    </div>
                    <div class="cr-selection-group-intake">
                      {{ selectionGroupDisplayLines(row.selectionGroup).intakeLine }}
                    </div>
                  </template>
                  <template v-else>—</template>
                </td>
                <td class="nowrap td-lecturer">{{ row.section?.lecturer || '—' }}</td>
                <td class="nowrap">{{ row.section ? displayWeekRange(row.section) : '—' }}</td>
                <td class="cr-time-venue">
                  <template v-if="row.section">
                    <div
                      v-for="(line, li) in displayClassTimeVenueLines(row.section, isZh ? 'zh' : 'en')"
                      :key="li"
                      class="cr-time-venue-line"
                    >
                      {{ line }}
                    </div>
                  </template>
                  <template v-else>—</template>
                </td>
                <td
                  v-if="spanCell(row, 'prerequisites')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'prerequisites').rowspan"
                >
                  {{ row.course.prerequisites?.join(', ') || '—' }}
                </td>
                <td
                  v-if="showSelectionGroupColumn && spanCell(row, 'remark')?.show"
                  class="cr-selection-group-remark"
                  :rowspan="spanCell(row, 'remark').rowspan"
                >
                  {{ selectionGroupRemarkText(row) }}
                </td>
              </tr>
              <tr v-if="!pagedRows.length">
                <td :colspan="emptyTableColspan" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <TablePagination v-model="currentPage" v-model:page-size="pageSize" :total="totalCourseCount" />
    </div>

    <StudentCourseCatalogDrawer
      :visible="catalogVisible"
      :courses="catalogCourses"
      @close="catalogVisible = false"
    />
  </div>
</template>

<style scoped>
.cr-pending-preview {
  padding: 0;
}

.cr-pending-preview-toolbar {
  display: flex;
  align-items: center;
  margin: 0 0 12px;
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  scrollbar-gutter: stable;
}

.th-label-with-tip .hint-popover-trigger svg {
  width: 14px;
  height: 14px;
  display: block;
}

.th-prereq-tip .hint-popover-content {
  top: calc(100% + 4px);
  left: auto;
  right: 0;
  transform: none;
  min-width: 220px;
  max-width: min(320px, 50vw);
  z-index: 40;
}

.th-label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.table-section .table-wrap {
  overflow: visible;
  border: none;
  border-radius: 0;
}

.table-section .data-table {
  min-width: 1240px;
}

.table-section .data-table th {
  white-space: nowrap;
}

.table-section .data-table th,
.table-section .data-table td {
  padding: 4px 7px;
  line-height: 1.3;
  vertical-align: middle;
}

.table-section .data-table td[rowspan] {
  vertical-align: middle;
}

.table-section .data-table td.cr-selection-group-cell[rowspan] {
  vertical-align: middle;
}

.nowrap {
  white-space: nowrap;
}

.td-lecturer {
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-time-venue {
  min-width: 160px;
  max-width: 228px;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
}

.cr-time-venue-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.cr-selection-group-cell {
  font-weight: 500;
  color: #374151;
  text-align: left;
  vertical-align: middle;
  line-height: 1.3;
  min-width: 132px;
  max-width: 140px;
  padding-left: 4px;
  padding-right: 4px;
}

.cr-selection-group-title {
  width: 100%;
  text-align: left;
  white-space: nowrap;
}

.cr-selection-group-intake {
  font-size: 10px;
  font-weight: 400;
  color: #4b5563;
  margin-top: 2px;
  white-space: nowrap;
  text-align: left;
}

.cr-selection-group-remark {
  min-width: 108px;
  max-width: 132px;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  vertical-align: middle;
  white-space: normal;
  word-break: break-word;
  color: #374151;
}

/* 与正式 R1 一致：浅蓝 / 浅黄 */
.cr-selection-group-row--tone-0 > td {
  background: #dbeafe;
}

.cr-selection-group-row--tone-1 > td {
  background: #fef9c3;
}

.th-credits-filter {
  position: relative;
  z-index: 5;
  white-space: nowrap;
  vertical-align: middle;
}

.th-credits-filter .th-label-with-tip {
  vertical-align: middle;
}

.th-funnel-wrap {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-left: 0;
  z-index: 6;
}

.th-funnel-wrap.is-open {
  z-index: 30;
}

.th-funnel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
}

.th-funnel-wrap.is-active .th-funnel-btn,
.th-funnel-wrap.is-open .th-funnel-btn,
.th-funnel-btn:hover {
  color: #1d4ed8;
  background: #eff6ff;
}

.th-funnel-btn svg {
  width: 14px;
  height: 14px;
}

.th-funnel-panel {
  display: none;
  flex-direction: column;
  gap: 2px;
  min-width: 88px;
  padding: 6px !important;
  top: calc(100% + 4px);
  left: 0;
  transform: none;
  z-index: 40;
}

.th-funnel-wrap.hint-popover-wrap:hover .th-funnel-panel,
.th-funnel-wrap.hint-popover-wrap:focus-within .th-funnel-panel {
  display: none;
}

.th-funnel-wrap.is-open .th-funnel-panel,
.th-funnel-wrap.is-open.hint-popover-wrap:hover .th-funnel-panel,
.th-funnel-wrap.is-open.hint-popover-wrap:focus-within .th-funnel-panel {
  display: flex;
}

.th-funnel-option {
  appearance: none;
  border: none;
  background: transparent;
  text-align: left;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.th-funnel-option:hover,
.th-funnel-option.active {
  background: #eff6ff;
  color: #1d4ed8;
}
</style>
