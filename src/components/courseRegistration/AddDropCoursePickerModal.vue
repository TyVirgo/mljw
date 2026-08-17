<script setup>
/**
 * 加退选课：按课程分组展平选择（对齐在线选课主表粒度）
 */
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  courseTypeOptions,
  getRegistrationTypeLabel,
} from '../../data/courseRegistration/registrationTypes.js'
import {
  schoolElectiveCategoryOptions,
  getSchoolElectiveCategoryLabel,
} from '../../data/departments.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import {
  displayClassTimeVenueLines,
  displayWeekRange,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import { getSectionMeetingsConflictInfo } from '../../data/courseRegistration/addDropSectionConflict.js'
import { estimateCourseFee } from '../../data/courseRegistration/addDropFeeRates.js'

const props = defineProps({
  visible: Boolean,
  /** 'Add' | 'Drop' | 'Retake' | 'AddDrop' */
  action: { type: String, default: 'Add' },
  courses: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
  selectedSectionId: { type: String, default: '' },
  scheduleBaseline: { type: Array, default: () => [] },
  /** 本学期学分胶囊 [{ key, labelKey, current, max }] */
  creditBars: { type: Array, default: () => [] },
  /** 文商理短标签胶囊（可选） */
  categoryBars: { type: Array, default: () => [] },
  /** { geRemaining, meRemaining } 供超额计费 */
  planRemaining: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'confirm'])

const { t, isZh } = useAppI18n()

const searchDraft = ref('')
const creditsDraft = ref('')
const schoolElectiveDraft = ref('')
const typeDraft = ref('')
const searchApplied = ref('')
const creditsApplied = ref('')
const schoolElectiveApplied = ref('')
const typeApplied = ref('')
const pickedRowKey = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const excessConfirmVisible = ref(false)
const pendingConfirmPayload = ref(null)

const isDrop = computed(() => props.action === 'Drop')
const showAddEligibilityTip = computed(
  () => props.action === 'Add' || props.action === 'AddDrop',
)
const showCreditProgress = computed(
  () => (props.action === 'Add' || props.action === 'AddDrop') && props.creditBars.length > 0,
)
const scheduleLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const CATEGORY_SHORT_KEYS = {
  humanities: 'courseRegistration.student.geDemand.short.humanities',
  business: 'courseRegistration.student.geDemand.short.business',
  science: 'courseRegistration.student.geDemand.short.science',
}

const creditFilterOptions = computed(() => {
  const set = new Set()
  for (const course of props.courses || []) {
    const c = Number(course.credits)
    if (Number.isFinite(c) && c > 0) set.add(c)
  }
  return [...set].sort((a, b) => a - b)
})

function sectionRowsForCourse(course) {
  const sections = Array.isArray(course.sections) ? course.sections : []
  if (sections.length) {
    return sections.map((section) => ({
      rowKey: section.id || `${course.id || course.code}::${section.code}`,
      course,
      section,
      code: course.code,
      name: course.name,
      credits: course.credits,
      type: course.type,
      schoolElectiveCategory: course.schoolElectiveCategory || '',
      fromEnrolled: course.fromEnrolled,
      remainingCapacity: Number(section.capacity || 0) - Number(section.enrolled || 0),
    }))
  }
  const code = course.sectionCode || '01'
  const section = {
    id: course.sectionId || `enrolled-${course.code || course.id}-${code}`,
    code,
    name: course.sectionName || '',
    time: course.time || course.classTime || '',
    room: course.room || course.venue || '',
    lecturer: course.lecturer || course.lecturers || '',
    weekRange: course.weekRange || '1-18',
    enrolled: 0,
    capacity: Number(course.totalCapacity) || 0,
  }
  return [
    {
      rowKey: section.id,
      course,
      section,
      code: course.code,
      name: course.name,
      credits: course.credits,
      type: course.type,
      schoolElectiveCategory: course.schoolElectiveCategory || '',
      fromEnrolled: course.fromEnrolled,
      remainingCapacity: Number(course.remainingCapacity),
    },
  ]
}

const flattenedRows = computed(() => {
  const list = []
  for (const course of props.courses || []) {
    list.push(...sectionRowsForCourse(course))
  }
  return list
})

const filteredRows = computed(() => {
  let list = [...flattenedRows.value]
  const kw = searchApplied.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (row) =>
        String(row.code || '')
          .toLowerCase()
          .includes(kw) ||
        String(row.name || '')
          .toLowerCase()
          .includes(kw),
    )
  }
  if (creditsApplied.value) {
    const target = Number(creditsApplied.value)
    list = list.filter((row) => Number(row.credits) === target)
  }
  if (schoolElectiveApplied.value) {
    list = list.filter(
      (row) =>
        String(row.schoolElectiveCategory || row.course?.schoolElectiveCategory || '') ===
        String(schoolElectiveApplied.value),
    )
  }
  if (typeApplied.value) {
    list = list.filter(
      (row) => String(row.type || '').toUpperCase() === String(typeApplied.value).toUpperCase(),
    )
  }
  return list
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const selectedRow = computed(
  () => filteredRows.value.find((r) => r.rowKey === pickedRowKey.value) || null,
)

const selectedFeeEstimate = computed(() => {
  const row = selectedRow.value
  if (!row || !showCreditProgress.value) return null
  return estimateCourseFee({
    action: props.action === 'AddDrop' ? 'Add' : props.action,
    course: row.course,
    planRemaining: props.planRemaining,
    eligibilitySource: row.course?.eligibilitySource || '',
  })
})

const showFooterExcessHint = computed(
  () => Number(selectedFeeEstimate.value?.billableCredits) > 0,
)

const actionTypeLabel = computed(() => {
  const key = `courseRegistration.approval.type.${props.action}`
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : props.action
})

const canConfirm = computed(() => {
  const row = selectedRow.value
  if (!row) return false
  return !isRowDisabled(row)
})

const excessConfirmMessage = computed(() => {
  const payload = pendingConfirmPayload.value
  if (!payload?.fee?.billableCredits) return ''
  return t('courseRegistration.student.pickerExcessCreditConfirm', {
    excess: payload.fee.billableCredits,
    course: payload.course?.code || '',
    credits: payload.course?.credits || 0,
  })
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    searchDraft.value = ''
    creditsDraft.value = ''
    schoolElectiveDraft.value = ''
    typeDraft.value = ''
    searchApplied.value = ''
    creditsApplied.value = ''
    schoolElectiveApplied.value = ''
    typeApplied.value = ''
    currentPage.value = 1
    pageSize.value = 10
    excessConfirmVisible.value = false
    pendingConfirmPayload.value = null
    if (props.selectedSectionId) {
      const hit = flattenedRows.value.find((r) => r.section?.id === props.selectedSectionId)
      pickedRowKey.value = hit?.rowKey || ''
      return
    }
    if (props.selectedId) {
      const hit = flattenedRows.value.find(
        (r) => r.course?.id === props.selectedId || r.course?.code === props.selectedId,
      )
      pickedRowKey.value = hit?.rowKey || ''
      return
    }
    pickedRowKey.value = ''
  },
)

watch(filteredRows, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

function handleSearch() {
  searchApplied.value = searchDraft.value
  creditsApplied.value = creditsDraft.value
  schoolElectiveApplied.value = schoolElectiveDraft.value
  typeApplied.value = typeDraft.value
  currentPage.value = 1
}

function handleReset() {
  searchDraft.value = ''
  creditsDraft.value = ''
  schoolElectiveDraft.value = ''
  typeDraft.value = ''
  searchApplied.value = ''
  creditsApplied.value = ''
  schoolElectiveApplied.value = ''
  typeApplied.value = ''
  currentPage.value = 1
}

function conflictInfo(row) {
  if (isDrop.value || row.fromEnrolled) return { conflict: false }
  return getSectionMeetingsConflictInfo(row.section, props.scheduleBaseline)
}

function isRowFull(row) {
  if (isDrop.value || row.fromEnrolled) return false
  const rem = Number(row.remainingCapacity)
  return Number.isFinite(rem) && rem <= 0
}

function isRowDisabled(row) {
  return conflictInfo(row).conflict || isRowFull(row)
}

function pickRow(row) {
  if (isRowDisabled(row)) return
  pickedRowKey.value = row.rowKey
}

function typeLabel(item) {
  return getRegistrationTypeLabel(item.type, t)
}

function schoolElectiveLabel(row) {
  const value = row.schoolElectiveCategory || row.course?.schoolElectiveCategory || ''
  return getSchoolElectiveCategoryLabel(value, isZh.value)
}

function sectionLabel(row) {
  return formatCourseSectionName(row.section, t)
}

function weekLabel(row) {
  return displayWeekRange(row.section) || '—'
}

function lecturerLabel(row) {
  return row.section?.lecturer || row.course?.lecturer || '—'
}

function timeVenueLines(row) {
  return displayClassTimeVenueLines(row.section, scheduleLocale.value)
}

function seatStatusLabel(row) {
  if (isDrop.value || row.fromEnrolled) return t('courseRegistration.student.pickerStatusEnrolled')
  if (conflictInfo(row).conflict) return t('courseRegistration.student.pickerStatusConflict')
  if (isRowFull(row)) return t('courseRegistration.student.pickerStatusFull')
  return t('courseRegistration.student.pickerStatusOpen')
}

function seatStatusClass(row) {
  const label = seatStatusLabel(row)
  if (label === t('courseRegistration.student.pickerStatusOpen')) return 'open'
  if (label === t('courseRegistration.student.pickerStatusFull')) return 'full'
  if (label === t('courseRegistration.student.pickerStatusConflict')) return 'conflict'
  return ''
}

function creditCapsuleTone(bar) {
  const current = Number(bar?.current) || 0
  const max = Number(bar?.max) || 0
  if (max <= 0) return 'is-neutral'
  if (current > max) return 'is-over'
  if (current >= max) return 'is-met'
  return 'is-short'
}

function buildConfirmPayload(row) {
  return {
    courseId: row.course.id || row.course.code,
    course: row.course,
    section: row.section,
    fee: estimateCourseFee({
      action: props.action === 'AddDrop' ? 'Add' : props.action,
      course: row.course,
      planRemaining: props.planRemaining,
      eligibilitySource: row.course?.eligibilitySource || '',
    }),
  }
}

function emitConfirm(payload) {
  emit('confirm', {
    courseId: payload.courseId,
    course: payload.course,
    section: payload.section,
  })
}

function handleConfirm() {
  if (!canConfirm.value || !selectedRow.value) return
  const payload = buildConfirmPayload(selectedRow.value)
  const needWarn =
    showCreditProgress.value && Number(payload.fee?.billableCredits) > 0
  if (needWarn) {
    pendingConfirmPayload.value = payload
    excessConfirmVisible.value = true
    return
  }
  emitConfirm(payload)
}

function handleExcessConfirm() {
  const payload = pendingConfirmPayload.value
  excessConfirmVisible.value = false
  pendingConfirmPayload.value = null
  if (payload) emitConfirm(payload)
}

function handleExcessCancel() {
  excessConfirmVisible.value = false
  pendingConfirmPayload.value = null
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ t('courseRegistration.student.coursePickerTitle') }}</h2>
            <p class="modal-subtitle">
              {{ t('courseRegistration.student.coursePickerSubtitle', { type: actionTypeLabel }) }}
              ·
              {{ t('courseRegistration.student.pickerStepCourse') }}
            </p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <CourseRegistrationCallout v-if="showAddEligibilityTip" variant="info" class="picker-tip">
            <p>{{ t('courseRegistration.student.pickerAddEligibilityTip') }}</p>
          </CourseRegistrationCallout>

          <div class="search-bar">
            <div class="search-row search-row--filters">
              <div class="search-item">
                <label class="search-label">{{ t('courseRegistration.courses.code') }}</label>
                <input
                  v-model="searchDraft"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.courses.librarySearchPlaceholder')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item search-item--sm">
                <label class="search-label">{{ t('courseRegistration.courses.credits') }}</label>
                <select v-model="creditsDraft" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="credit in creditFilterOptions" :key="credit" :value="String(credit)">
                    {{ credit }}
                  </option>
                </select>
              </div>
              <div class="search-item search-item--sm">
                <label class="search-label">{{ t('courseRegistration.courses.schoolElectiveCategory') }}</label>
                <select v-model="schoolElectiveDraft" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option
                    v-for="opt in schoolElectiveCategoryOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ isZh ? opt.zh : opt.en }}
                  </option>
                </select>
              </div>
              <div class="search-item search-item--sm">
                <label class="search-label">{{ t('courseRegistration.courses.type') }}</label>
                <select v-model="typeDraft" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="opt in courseTypeOptions" :key="opt.value" :value="opt.value">
                    {{ t(opt.labelKey) }}
                  </option>
                </select>
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

          <div v-if="showCreditProgress" class="picker-credit-progress">
            <span class="picker-credit-label">
              {{ t('courseRegistration.student.typeEntry.credits') }}
            </span>
            <div class="picker-credit-capsules">
              <span
                v-for="bar in creditBars"
                :key="bar.key"
                class="cr-credit-capsule"
                :class="creditCapsuleTone(bar)"
              >
                {{ t(bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
              </span>
              <template v-if="categoryBars.length">
                <span class="picker-credit-sep" aria-hidden="true">|</span>
                <span
                  v-for="bar in categoryBars"
                  :key="bar.key"
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(bar)"
                >
                  {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
                </span>
              </template>
            </div>
          </div>

          <p class="selection-meta">
            {{
              pickedRowKey
                ? t('courseRegistration.student.coursePickerSelected')
                : t('courseRegistration.student.coursePickerNone')
            }}
          </p>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check" />
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                  <th>{{ t('courseRegistration.courses.credits') }}</th>
                  <th>{{ t('courseRegistration.courses.schoolElectiveCategory') }}</th>
                  <th>{{ t('courseRegistration.courses.type') }}</th>
                  <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                  <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                  <th>{{ t('common.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in paginatedRows"
                  :key="row.rowKey"
                  :class="{
                    selected: pickedRowKey === row.rowKey,
                    disabled: isRowDisabled(row),
                  }"
                  @click="pickRow(row)"
                >
                  <td class="col-check">
                    <input
                      type="radio"
                      name="adddrop-course-pick"
                      :checked="pickedRowKey === row.rowKey"
                      :disabled="isRowDisabled(row)"
                      @change="pickRow(row)"
                    />
                  </td>
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td class="nowrap">{{ row.code }}</td>
                  <td>{{ row.name }}</td>
                  <td class="nowrap">{{ sectionLabel(row) }}</td>
                  <td>{{ row.credits }}</td>
                  <td class="nowrap">{{ schoolElectiveLabel(row) }}</td>
                  <td>{{ typeLabel(row) }}</td>
                  <td class="nowrap">{{ lecturerLabel(row) }}</td>
                  <td class="nowrap">{{ weekLabel(row) }}</td>
                  <td class="cr-time-venue">
                    <template v-if="timeVenueLines(row).length">
                      <div
                        v-for="(line, li) in timeVenueLines(row)"
                        :key="li"
                        class="cr-time-venue-line"
                      >
                        {{ line }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td>
                    <span class="seat-status" :class="seatStatusClass(row)">
                      {{ seatStatusLabel(row) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="12" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="filteredRows.length"
            :page-size-options="[5, 10, 20]"
          />
        </div>

        <div class="modal-footer">
          <p v-if="showFooterExcessHint" class="footer-excess-hint">
            {{ t('courseRegistration.student.pickerFooterExcessHint') }}
          </p>
          <button type="button" class="btn btn-default" @click="handleClose">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" :disabled="!canConfirm" @click="handleConfirm">
            {{ t('courseRegistration.student.pickerConfirm') }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="excessConfirmVisible"
      :title="t('courseRegistration.student.pickerExcessCreditTitle')"
      :message="excessConfirmMessage"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      confirm-variant="primary"
      :z-index="1300"
      @confirm="handleExcessConfirm"
      @cancel="handleExcessCancel"
    />
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-panel {
  width: min(1100px, 100%);
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
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
}

.modal-body {
  padding: 16px 20px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.picker-tip {
  margin-bottom: 12px;
}

.picker-tip :deep(.cr-callout) {
  font-size: 12px;
}

.search-bar {
  margin-bottom: 12px;
}

.search-row--filters {
  display: flex;
  align-items: center;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 0 1 auto;
  min-width: 0;
}

.search-item--sm {
  flex: 0 0 auto;
}

.search-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.search-input,
.search-select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  width: 180px;
  min-width: 120px;
  background: #fff;
}

.search-item--sm .search-select {
  width: 100px;
  min-width: 88px;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.picker-credit-progress {
  margin: 0 0 10px;
  padding: 6px 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.picker-credit-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
}

.picker-credit-capsules {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.picker-credit-sep {
  color: #d1d5db;
}

.cr-credit-capsule {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cr-credit-capsule.is-short {
  background: #fff7ed;
  color: #c2410c;
}

.cr-credit-capsule.is-met {
  background: #ecfdf5;
  color: #047857;
}

.cr-credit-capsule.is-over {
  background: #fef2f2;
  color: #b91c1c;
}

.cr-credit-capsule.is-neutral {
  background: #f3f4f6;
  color: #4b5563;
}

.selection-meta {
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.data-table thead th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
}

.data-table tbody tr {
  cursor: pointer;
}

.data-table tbody tr:hover,
.data-table tbody tr.selected {
  background: #eff6ff;
}

.data-table tbody tr.disabled {
  cursor: not-allowed;
  color: #9ca3af;
  background: #f9fafb;
}

.data-table tbody tr.disabled:hover {
  background: #f9fafb;
}

.col-check {
  width: 40px;
}

.nowrap {
  white-space: nowrap;
}

.cr-time-venue {
  min-width: 160px;
  max-width: 280px;
  line-height: 1.2;
  white-space: normal !important;
}

.cr-time-venue-line {
  line-height: 1.2;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 0;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}

.seat-status.open {
  color: #15803d;
}

.seat-status.full,
.seat-status.conflict {
  color: #b91c1c;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e7eb;
}

.footer-excess-hint {
  margin: 0 auto 0 0;
  font-size: 12px;
  color: #b45309;
  line-height: 1.4;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
