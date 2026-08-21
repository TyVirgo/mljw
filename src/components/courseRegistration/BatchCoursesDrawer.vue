<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import TablePagination from '../common/TablePagination.vue'
import BatchCourseOptionalSettingsModal from './BatchCourseOptionalSettingsModal.vue'
import BatchCourseCapacitySettingsModal from './BatchCourseCapacitySettingsModal.vue'
import BatchCourseQuotaAllocateModal from './BatchCourseQuotaAllocateModal.vue'
import BatchCourseProgrammeScopeModal from './BatchCourseProgrammeScopeModal.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import {
  displayClassTimeVenueLines,
  displayWeekRange,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import {
  getCourseProgrammeScopeCodes,
  getCoursesByBatch,
  selectableCourses,
} from '../../data/courseRegistration/selectableCourses.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t, isZh } = useAppI18n()

const keyword = ref('')
const appliedKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const optionalSettingsVisible = ref(false)
const capacitySettingsVisible = ref(false)
const quotaAllocateVisible = ref(false)
const programmeScopeVisible = ref(false)
/** 勾选的课程分组 id @type {import('vue').Ref<string[]>} */
const selectedIds = ref([])

const batchId = computed(() => props.batch?.id || '')
const batchName = computed(() => props.batch?.name || '')
const batchReadOnly = computed(
  () => props.batch?.status === 'active' || props.batch?.status === 'closed',
)
const showSelection = computed(() => !batchReadOnly.value)

const batchReadOnlyHint = computed(() =>
  props.batch?.status === 'closed'
    ? t('courseRegistration.batch.closedReadOnlyHint')
    : t('courseRegistration.batch.activeReadOnlyHint'),
)

const title = computed(() =>
  batchName.value
    ? t('courseRegistration.courses.manageForBatch', { name: batchName.value })
    : t('courseRegistration.courses.manageCourses'),
)

const subtitle = computed(() => {
  if (!props.batch) return ''
  const session = props.batch.academicSession || props.batch.semester || ''
  const typeLabel = props.batch.type ? getRegistrationTypeLabel(props.batch.type, t) : ''
  return session ? `${session} · ${typeLabel}` : typeLabel
})

const allBatchCourses = computed(() => {
  void selectableCourses.value
  return getCoursesByBatch(batchId.value)
})

/** 按课程分组展平后的行 */
const flattenedRows = computed(() => {
  const list = []
  for (const course of allBatchCourses.value) {
    const sections = course.sections || []
    if (!sections.length) {
      list.push({
        rowKey: `course-${course.id}`,
        sectionId: `course-${course.id}`,
        courseId: course.id,
        course,
        section: null,
        code: course.code,
        name: course.name,
        credits: course.credits,
        type: course.type,
        sectionCode: '—',
        lecturer: '—',
        weekRange: '—',
        enrolled: 0,
        totalCapacity: Number(course.totalCapacity) || 0,
        enrolledFreshman: Number(course.enrolledFreshman) || 0,
        enrolledSenior: Number(course.enrolledSenior) || 0,
        quota: course.quota || { freshman: 0, senior: 0 },
        sourceCapacity: course.sourceCapacity,
        capacityPercent: course.capacityPercent,
        prerequisites: course.prerequisites,
        isSelectable: course.isSelectable,
        audience: course.audience,
      })
      continue
    }
    for (const section of sections) {
      const cap = Number(section.capacity) || 0
      const enrolled =
        Number.isFinite(Number(section.enrolledFreshman)) &&
        Number.isFinite(Number(section.enrolledSenior))
          ? Number(section.enrolledFreshman) + Number(section.enrolledSenior)
          : Number(section.enrolled) || 0
      list.push({
        rowKey: section.id,
        sectionId: section.id,
        courseId: course.id,
        course,
        section,
        code: course.code,
        name: course.name,
        credits: course.credits,
        type: course.type,
        sectionCode: section.code,
        lecturer: section.lecturer || '—',
        weekRange: displayWeekRange(section),
        enrolled,
        totalCapacity: cap,
        enrolledFreshman: Number(section.enrolledFreshman) || 0,
        enrolledSenior: Number(section.enrolledSenior) || 0,
        quota: section.quota || { freshman: 0, senior: 0 },
        sourceCapacity: course.sourceCapacity,
        capacityPercent: course.capacityPercent,
        prerequisites: course.prerequisites,
        isSelectable: course.isSelectable,
        audience: course.audience,
      })
    }
  }
  return list
})

const rows = computed(() => {
  let list = flattenedRows.value
  if (appliedKeyword.value) {
    const kw = appliedKeyword.value.toLowerCase()
    list = list.filter(
      (r) => r.code.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw),
    )
  }
  return list
})

const batchTotal = computed(() => allBatchCourses.value.length)
const batchSectionTotal = computed(() => flattenedRows.value.length)
const totalCount = computed(() => rows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

/** 勾选分组所属课程（去重），供可选/容量/专业范围 */
const selectedCourses = computed(() => {
  const idSet = new Set(selectedIds.value)
  const seen = new Set()
  const list = []
  for (const row of flattenedRows.value) {
    if (!idSet.has(row.sectionId) || seen.has(row.courseId)) continue
    seen.add(row.courseId)
    list.push(row.course)
  }
  return list
})

const pageIds = computed(() => paginatedRows.value.map((r) => r.sectionId))
const allPageSelected = computed(
  () => pageIds.value.length > 0 && pageIds.value.every((id) => selectedIds.value.includes(id)),
)

const emptyColspan = computed(() => (showSelection.value ? 17 : 16))
const scheduleLocale = computed(() => (isZh.value ? 'zh' : 'en'))

watch(
  () => [props.visible, props.batch?.id],
  () => {
    if (!props.visible) return
    keyword.value = ''
    appliedKeyword.value = ''
    currentPage.value = 1
    optionalSettingsVisible.value = false
    capacitySettingsVisible.value = false
    quotaAllocateVisible.value = false
    programmeScopeVisible.value = false
    selectedIds.value = []
  },
)

function handleSearch() {
  appliedKeyword.value = keyword.value
  currentPage.value = 1
}

function handleReset() {
  keyword.value = ''
  appliedKeyword.value = ''
  currentPage.value = 1
}

function openOptionalSettings() {
  if (batchReadOnly.value || !selectedIds.value.length) return
  optionalSettingsVisible.value = true
}

function openCapacitySettings() {
  if (batchReadOnly.value || !selectedIds.value.length) return
  capacitySettingsVisible.value = true
}

function openQuotaAllocate() {
  if (batchReadOnly.value || !selectedIds.value.length) return
  quotaAllocateVisible.value = true
}

function openProgrammeScopeSettings() {
  if (batchReadOnly.value || !selectedIds.value.length) return
  programmeScopeVisible.value = true
}

function selectableLabel(value) {
  return value === false
    ? t('courseRegistration.courses.isSelectableNo')
    : t('courseRegistration.courses.isSelectableYes')
}

function prerequisitesLabel(list) {
  const items = Array.isArray(list) ? list.filter(Boolean) : []
  return items.length ? items.join(', ') : '—'
}

function sectionGroupLabel(row) {
  if (!row.section) return '—'
  return formatCourseSectionName(row.section, t) || row.sectionCode || '—'
}

function audienceCapacityLabel(row, audience) {
  if (audience === 'freshman') {
    const cap = Number(row?.quota?.freshman)
    return Number.isFinite(cap) ? String(cap) : '0'
  }
  const cap = Number(row?.quota?.senior)
  return Number.isFinite(cap) ? String(cap) : '0'
}

/** 分组：有效最大容量（仅容量） */
function effectiveCapacityLabel(row) {
  const total = Number(row?.totalCapacity) || 0
  return String(total)
}

function capacityPercentLabel(row) {
  const p = Number(row?.capacityPercent)
  const percent = Number.isFinite(p) && p > 0 ? Math.round(p) : 100
  return `${percent}%`
}

function programmeScopeLabel(row) {
  const codes = getCourseProgrammeScopeCodes(row.course || row)
  if (!codes.length) return t('courseRegistration.courses.programmeScopeUnlimited')
  return codes.join('、')
}

function classTimeVenueLines(row) {
  if (!row.section) return []
  return displayClassTimeVenueLines(row.section, scheduleLocale.value)
}

function toggleRow(id, checked) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
    return
  }
  selectedIds.value = selectedIds.value.filter((item) => item !== id)
}

function togglePage(checked) {
  if (checked) {
    const merged = new Set([...selectedIds.value, ...pageIds.value])
    selectedIds.value = [...merged]
    return
  }
  const drop = new Set(pageIds.value)
  selectedIds.value = selectedIds.value.filter((id) => !drop.has(id))
}

function handleOptionalSaved() {
  selectedIds.value = []
}

function handleCapacitySaved() {
  selectedIds.value = []
}

function handleProgrammeScopeSaved() {
  selectedIds.value = []
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="batch-courses-drawer"
    @close="emit('close')"
  >
    <template v-if="batch">
      <div class="batch-courses-body">
        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.filterLabel') }}</label>
                <input
                  v-model="keyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.courses.librarySearchPlaceholder')"
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

        <div class="drawer-toolbar">
          <div class="toolbar-left">
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly || selectedIds.length === 0"
              :title="
                batchReadOnly
                  ? batchReadOnlyHint
                  : selectedIds.length === 0
                    ? t('courseRegistration.courses.optionalSettingsNeedSelect')
                    : undefined
              "
              @click="openOptionalSettings"
            >
              {{ t('courseRegistration.courses.optionalSettings') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly || selectedIds.length === 0"
              :title="
                batchReadOnly
                  ? batchReadOnlyHint
                  : selectedIds.length === 0
                    ? t('courseRegistration.courses.optionalSettingsNeedSelect')
                    : undefined
              "
              @click="openCapacitySettings"
            >
              {{ t('courseRegistration.courses.capacitySettings') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly || selectedIds.length === 0"
              :title="
                batchReadOnly
                  ? batchReadOnlyHint
                  : selectedIds.length === 0
                    ? t('courseRegistration.courses.optionalSettingsNeedSelect')
                    : undefined
              "
              @click="openQuotaAllocate"
            >
              {{ t('courseRegistration.courses.quotaAllocate') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly || selectedIds.length === 0"
              :title="
                batchReadOnly
                  ? batchReadOnlyHint
                  : selectedIds.length === 0
                    ? t('courseRegistration.courses.optionalSettingsNeedSelect')
                    : undefined
              "
              @click="openProgrammeScopeSettings"
            >
              {{ t('courseRegistration.courses.programmeScopeSettings') }}
            </button>
          </div>
          <span class="drawer-meta">
            {{
              t('courseRegistration.courses.batchCourseMeta', {
                courseCount: batchTotal,
                sectionCount: batchSectionTotal,
              })
            }}
            <ExternalDataHint source-key="courseLibrary" />
          </span>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table" :class="{ 'no-selection': !showSelection }">
              <thead>
                <tr>
                  <th v-if="showSelection" class="col-check col-sticky-left col-sticky-check">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      :disabled="paginatedRows.length === 0"
                      @change="togglePage($event.target.checked)"
                    />
                  </th>
                  <th class="col-no col-sticky-left col-sticky-no">{{ t('common.serialNo') }}</th>
                  <th class="col-code col-sticky-left col-sticky-code">{{ t('courseRegistration.courses.code') }}</th>
                  <th class="col-name col-sticky-left col-sticky-name">{{ t('courseRegistration.courses.name') }}</th>
                  <th class="col-section col-sticky-left col-sticky-section">
                    {{ t('courseRegistration.courses.sectionCode') }}
                  </th>
                  <th>{{ t('courseRegistration.courses.credits') }}</th>
                  <th>{{ t('courseRegistration.courses.category') }}</th>
                  <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                  <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                  <th>{{ t('courseRegistration.courses.capacityPercentCol') }}</th>
                  <th>{{ t('courseRegistration.courses.programmeScope') }}</th>
                  <th>{{ t('courseRegistration.courses.prerequisites') }}</th>
                  <th>{{ t('courseRegistration.courses.isSelectable') }}</th>
                  <th class="col-cap col-sticky-right col-sticky-cap-eff">
                    <span
                      class="th-with-tip"
                      :title="t('courseRegistration.courses.effectiveCapacityTip')"
                    >
                      {{ t('courseRegistration.courses.effectiveCapacity') }}
                      <span class="tip-icon" aria-hidden="true">?</span>
                    </span>
                  </th>
                  <th class="col-cap col-sticky-right col-sticky-cap-fresh">
                    <span
                      class="th-with-tip"
                      :title="t('courseRegistration.courses.enrolledFreshmanTip')"
                    >
                      {{ t('courseRegistration.courses.enrolledFreshman') }}
                      <span class="tip-icon" aria-hidden="true">?</span>
                    </span>
                  </th>
                  <th class="col-cap col-sticky-right col-sticky-cap-senior">
                    {{ t('courseRegistration.courses.enrolledSenior') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in paginatedRows"
                  :key="`${row.rowKey}-${row.totalCapacity}-${row.capacityPercent}`"
                >
                  <td v-if="showSelection" class="col-check col-sticky-left col-sticky-check">
                    <input
                      type="checkbox"
                      :checked="selectedIds.includes(row.sectionId)"
                      @change="toggleRow(row.sectionId, $event.target.checked)"
                    />
                  </td>
                  <td class="col-no col-sticky-left col-sticky-no">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="col-code col-sticky-left col-sticky-code">{{ row.code }}</td>
                  <td class="col-name col-sticky-left col-sticky-name">{{ row.name }}</td>
                  <td class="col-section col-sticky-left col-sticky-section">
                    {{ sectionGroupLabel(row) }}
                  </td>
                  <td>{{ row.credits }}</td>
                  <td>{{ getRegistrationTypeLabel(row.type, t) }}</td>
                  <td>{{ row.lecturer }}</td>
                  <td>{{ row.weekRange }}</td>
                  <td class="cr-time-venue">
                    <template v-if="classTimeVenueLines(row).length">
                      <div
                        v-for="(line, li) in classTimeVenueLines(row)"
                        :key="li"
                        class="cr-time-venue-line"
                      >
                        {{ line }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td>{{ capacityPercentLabel(row) }}</td>
                  <td>{{ programmeScopeLabel(row) }}</td>
                  <td class="col-prereq">{{ prerequisitesLabel(row.prerequisites) }}</td>
                  <td>{{ selectableLabel(row.isSelectable) }}</td>
                  <td class="col-cap col-sticky-right col-sticky-cap-eff">
                    {{ effectiveCapacityLabel(row) }}
                  </td>
                  <td class="col-cap col-sticky-right col-sticky-cap-fresh">
                    {{ audienceCapacityLabel(row, 'freshman') }}
                  </td>
                  <td class="col-cap col-sticky-right col-sticky-cap-senior">
                    {{ audienceCapacityLabel(row, 'senior') }}
                  </td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td :colspan="emptyColspan" class="empty-cell">
                    <div class="empty-block">
                      <p class="empty-title">
                        {{
                          batchTotal === 0
                            ? t('courseRegistration.courses.emptyBatch')
                            : t('common.noData')
                        }}
                      </p>
                      <p v-if="batchTotal === 0" class="empty-desc">
                        {{ t('courseRegistration.courses.emptyBatchHint') }}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="totalCount > 0" class="pagination-bar">
            <TablePagination
              v-model="currentPage"
              v-model:page-size="pageSize"
              :total="totalCount"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>

  <BatchCourseOptionalSettingsModal
    :visible="optionalSettingsVisible"
    :courses="selectedCourses"
    @close="optionalSettingsVisible = false"
    @saved="handleOptionalSaved"
  />

  <BatchCourseCapacitySettingsModal
    :visible="capacitySettingsVisible"
    :courses="selectedCourses"
    @close="capacitySettingsVisible = false"
    @saved="handleCapacitySaved"
  />

  <BatchCourseQuotaAllocateModal
    :visible="quotaAllocateVisible"
    :section-ids="selectedIds"
    :courses="selectedCourses"
    @close="quotaAllocateVisible = false"
    @saved="handleCapacitySaved"
  />

  <BatchCourseProgrammeScopeModal
    :visible="programmeScopeVisible"
    :courses="selectedCourses"
    @close="programmeScopeVisible = false"
    @saved="handleProgrammeScopeSaved"
  />
</template>

<style scoped>
.batch-courses-drawer :deep(.drawer-panel) {
  width: min(1200px, 96vw);
}

.batch-courses-drawer :deep(.drawer-scroll) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.batch-courses-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  gap: 0;
}

.batch-courses-body .search-bar {
  flex-shrink: 0;
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.batch-courses-body .search-bar .search-item {
  gap: 4px;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  background: #fff;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: help;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #9ca3af;
  font-size: 10px;
  line-height: 1;
  color: #6b7280;
}

.btn:disabled,
.btn:disabled:hover {
  opacity: 0.5;
  cursor: not-allowed;
}

.drawer-meta {
  font-size: 13px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fff;
}

.pagination-bar {
  flex-shrink: 0;
  padding: 8px 16px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.3;
}

.data-table th,
.data-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f9fafb;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.col-prereq {
  font-size: 11px;
  color: #6b7280;
}

.col-check {
  width: 36px;
  min-width: 36px;
  text-align: center;
}

.col-no {
  width: 44px;
  min-width: 44px;
}

.col-code {
  min-width: 88px;
}

.col-name {
  min-width: 140px;
}

.col-section {
  min-width: 88px;
}

.col-cap {
  min-width: 72px;
  width: 72px;
  text-align: right;
}

.col-cap.col-sticky-cap-eff {
  min-width: 88px;
  width: 88px;
}

.col-sticky-left,
.col-sticky-right {
  position: sticky;
  z-index: 2;
  background: #fff;
}

.data-table thead .col-sticky-left,
.data-table thead .col-sticky-right {
  z-index: 4;
  background: #f9fafb;
}

.data-table tbody tr:hover .col-sticky-left,
.data-table tbody tr:hover .col-sticky-right {
  background: #fafafa;
}

.col-sticky-check {
  left: 0;
}

.col-sticky-no {
  left: 36px;
}

.col-sticky-code {
  left: 80px;
}

.col-sticky-name {
  left: 168px;
}

.col-sticky-section {
  left: 308px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.1);
}

/* 右冻结：老生 → 新生 → 有效（自右向左） */
.col-sticky-cap-senior {
  right: 0;
}

.col-sticky-cap-fresh {
  right: 72px;
}

.col-sticky-cap-eff {
  right: 144px;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.1);
}

/* 进行中隐藏勾选列后，冻结列贴左对齐原勾选位置 */
.data-table.no-selection .col-sticky-no {
  left: 0;
}

.data-table.no-selection .col-sticky-code {
  left: 44px;
}

.data-table.no-selection .col-sticky-name {
  left: 132px;
}

.data-table.no-selection .col-sticky-section {
  left: 272px;
}

.empty-cell {
  text-align: center;
  padding: 48px 16px !important;
  border-bottom: none;
}

.empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-title {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.empty-desc {
  margin: 0 0 8px;
  font-size: 13px;
  color: #9ca3af;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-default:hover {
  border-color: #9ca3af;
  color: #111827;
}

.cr-time-venue {
  min-width: 160px;
  line-height: 1.4;
  white-space: normal;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
