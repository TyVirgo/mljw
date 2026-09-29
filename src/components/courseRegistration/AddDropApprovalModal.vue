<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import {
  approvalActionOptions,
  commonApprovalComments,
  validateApprovalForm,
} from '../../data/movementApprovalEngine.js'
import { getApprovalActionLabel } from '../../utils/approvalActionLabels.js'
import { displayPrimaryType } from '../../data/courseRegistration/addDropFormSections.js'
import { addDropLineKey } from '../../data/courseRegistration/addDropMultiItems.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { displayClassTimeVenueFromFields } from '../../data/courseRegistration/sectionScheduleFields.js'

const props = defineProps({
  visible: Boolean,
  approvalStage: { type: String, default: 'Academic Coordinator' },
  targetCount: { type: Number, default: 1 },
  /** 是否展示「生成账单」（有费用场景） */
  showGenerateBill: { type: Boolean, default: true },
  /** 单条审批时传入申请，用于课程汇总与操作列；批量不传 */
  application: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr, isZh } = useAppI18n()
const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const selectedAction = ref('')
const comments = ref('')
const generateBill = ref(true)
const showPresets = ref(false)
const formError = ref('')
const submitConfirmVisible = ref(false)
const pendingPayload = ref(null)
/** @type {import('vue').Ref<Record<string, 'approved' | 'rejected' | 'pending'>>} */
const lineDecisionsMap = ref({})
/** @type {import('vue').Ref<Record<string, boolean>>} */
const selectedKeysMap = ref({})

const summaryItems = computed(() => {
  if (props.targetCount > 1) return []
  return props.application?.items || []
})

const showLineOps = computed(() => summaryItems.value.length > 0)

const selectedKeyList = computed(() =>
  Object.keys(selectedKeysMap.value).filter((k) => selectedKeysMap.value[k]),
)

const hasSelectedLines = computed(() => selectedKeyList.value.length > 0)

const allSelected = computed(() => {
  const items = summaryItems.value
  if (!items.length) return false
  return items.every((item, idx) => selectedKeysMap.value[itemKey(item, idx)])
})

function resolveI18nLabel(key, fallback) {
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : fallback
}

function actionTypeLabel(action) {
  const primary = displayPrimaryType(action) || action
  return resolveI18nLabel(`courseRegistration.approval.type.${primary}`, primary || '—')
}

function itemKey(item, idx) {
  return addDropLineKey(item) || String(idx)
}

function dash(v) {
  return v != null && String(v).trim() ? String(v).trim() : '—'
}

function itemWeekRange(item) {
  return dash(item?.weekRange)
}

function itemLecturer(item) {
  return dash(item?.lecturer || item?.lecturers)
}

function itemTimeVenueText(item) {
  return displayClassTimeVenueFromFields(
    {
      time: item?.time,
      classTime: item?.classTime || item?.time,
      venue: item?.venue || item?.room,
      room: item?.room || item?.venue,
      weekRange: item?.weekRange,
      meetings: item?.meetings,
    },
    timeLocale.value,
  )
}

function itemTimeVenueLines(item) {
  const text = itemTimeVenueText(item)
  if (!text || text === '—') return []
  return String(text)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function initLineDecisions() {
  const map = {}
  const sel = {}
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    const d = item.lineDecision
    map[key] = d === 'approved' || d === 'rejected' ? d : 'pending'
    sel[key] = true
  }
  lineDecisionsMap.value = map
  selectedKeysMap.value = sel
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedAction.value = ''
    comments.value = ''
    generateBill.value = true
    showPresets.value = false
    formError.value = ''
    submitConfirmVisible.value = false
    pendingPayload.value = null
    initLineDecisions()
  },
)

watch(
  () => props.application?.id,
  () => {
    if (props.visible) initLineDecisions()
  },
)

const batchHint = computed(() => {
  if (props.targetCount <= 1) return ''
  const template = tr('Applying the same decision to {count} selected application(s).')
  return template.replace('{count}', String(props.targetCount))
})

const submitConfirmMessage = computed(() => {
  if (props.targetCount <= 1) {
    return tr('Are you sure you want to submit this approval decision?')
  }
  const template = tr(
    'Are you sure you want to submit this approval decision for {count} selected application(s)?',
  )
  return template.replace('{count}', String(props.targetCount))
})

const showBillOption = computed(
  () => props.showGenerateBill && selectedAction.value === 'Approved',
)

function setLineDecision(key, decision) {
  lineDecisionsMap.value = { ...lineDecisionsMap.value, [key]: decision }
}

function toggleRowSelected(key, checked) {
  selectedKeysMap.value = { ...selectedKeysMap.value, [key]: checked }
}

function toggleSelectAll(checked) {
  const sel = { ...selectedKeysMap.value }
  for (const [idx, item] of summaryItems.value.entries()) {
    sel[itemKey(item, idx)] = checked
  }
  selectedKeysMap.value = sel
}

function applyDecisionToSelected(decision) {
  if (!hasSelectedLines.value) {
    formError.value = t('courseRegistration.approval.lineSelectRequired')
    return
  }
  formError.value = ''
  const map = { ...lineDecisionsMap.value }
  for (const key of selectedKeyList.value) map[key] = decision
  lineDecisionsMap.value = map
}

function approveAllLines() {
  applyDecisionToSelected('approved')
}

function rejectAllLines() {
  applyDecisionToSelected('rejected')
}

function buildLineDecisionsPayload(action) {
  if (!showLineOps.value) return undefined
  const out = {}
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    let resolved
    if (action === 'Rejected') {
      resolved = 'rejected'
    } else {
      const d = lineDecisionsMap.value[key]
      resolved = d === 'rejected' ? 'rejected' : 'approved'
    }
    out[idx] = resolved
    out[key] = resolved
  }
  return out
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function insertPreset(text) {
  comments.value = text.slice(0, 200)
  showPresets.value = false
}

function handleConfirm() {
  const errors = validateApprovalForm(selectedAction.value, comments.value)
  if (errors.action) {
    formError.value = tr(errors.action)
    return
  }
  if (errors.comment) {
    formError.value = tr(errors.comment)
    return
  }
  formError.value = ''
  pendingPayload.value = {
    action: selectedAction.value,
    comment: comments.value.trim(),
    generateBill: selectedAction.value === 'Approved' ? generateBill.value : false,
    lineDecisions: buildLineDecisionsPayload(selectedAction.value),
  }
  submitConfirmVisible.value = true
}

function confirmSubmit() {
  if (!pendingPayload.value) return
  submitConfirmVisible.value = false
  emit('confirm', pendingPayload.value)
  pendingPayload.value = null
}

function cancelSubmit() {
  submitConfirmVisible.value = false
  pendingPayload.value = null
}

function sectionLabel(item) {
  return formatCourseSectionName(item?.section || item?.sectionCode || item?.sectionName, t) || '—'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" :class="{ 'modal-panel--wide': showLineOps }" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Approval') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p v-if="batchHint" class="batch-hint">{{ batchHint }}</p>

          <div v-if="showLineOps" class="lines-summary">
            <div class="section-bar">{{ t('courseRegistration.approval.itemsSummary') }}</div>
            <div class="lines-summary-actions">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                :disabled="!hasSelectedLines"
                @click="approveAllLines"
              >
                {{ t('courseRegistration.approval.lineApproveAll') }}
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                :disabled="!hasSelectedLines"
                @click="rejectAllLines"
              >
                {{ t('courseRegistration.approval.lineRejectAll') }}
              </button>
            </div>
            <div class="lines-table-wrap">
              <table class="lines-table">
                <thead>
                  <tr>
                    <th class="col-check">
                      <input
                        type="checkbox"
                        :checked="allSelected"
                        :aria-label="t('courseRegistration.approval.lineSelectAll')"
                        @change="toggleSelectAll($event.target.checked)"
                      />
                    </th>
                    <th class="col-type">{{ t('courseRegistration.approval.typeLabel') }}</th>
                    <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                    <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                    <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                    <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                    <th class="col-week">{{ t('courseRegistration.student.fieldWeekRange') }}</th>
                    <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
                    <th class="col-lecturer">{{ t('courseRegistration.student.fieldLecturers') }}</th>
                    <th class="col-op">{{ t('courseRegistration.approval.lineDecision') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in summaryItems" :key="itemKey(item, idx)">
                    <td class="col-check">
                      <input
                        type="checkbox"
                        :checked="!!selectedKeysMap[itemKey(item, idx)]"
                        @change="toggleRowSelected(itemKey(item, idx), $event.target.checked)"
                      />
                    </td>
                    <td class="col-type" :title="actionTypeLabel(item.action)">{{ actionTypeLabel(item.action) }}</td>
                    <td class="col-code" :title="item.courseCode || ''">{{ item.courseCode || '—' }}</td>
                    <td class="col-name" :title="item.courseName || ''">{{ item.courseName || '—' }}</td>
                    <td class="col-credits">{{ item.credits ?? '—' }}</td>
                    <td class="col-group" :title="sectionLabel(item)">{{ sectionLabel(item) }}</td>
                    <td class="col-week" :title="itemWeekRange(item)">{{ itemWeekRange(item) }}</td>
                    <td class="cr-time-venue" :title="itemTimeVenueText(item)">
                      <template v-if="itemTimeVenueLines(item).length">
                        <div
                          v-for="(tv, li) in itemTimeVenueLines(item)"
                          :key="li"
                          class="cr-time-venue-line"
                          :title="tv"
                        >
                          {{ tv }}
                        </div>
                      </template>
                      <template v-else>—</template>
                    </td>
                    <td class="col-lecturer" :title="itemLecturer(item)">{{ itemLecturer(item) }}</td>
                    <td class="op-cell">
                      <button
                        type="button"
                        class="btn btn-sm"
                        :class="{ active: lineDecisionsMap[itemKey(item, idx)] === 'approved' }"
                        @click="setLineDecision(itemKey(item, idx), 'approved')"
                      >
                        {{ t('courseRegistration.approval.lineApprove') }}
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm"
                        :class="{ active: lineDecisionsMap[itemKey(item, idx)] === 'rejected' }"
                        @click="setLineDecision(itemKey(item, idx), 'rejected')"
                      >
                        {{ t('courseRegistration.approval.lineReject') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="form-table">
            <div class="form-row">
              <div class="form-label">{{ tr('Action') }}</div>
              <div class="form-value">
                <div class="radio-group">
                  <label v-for="opt in approvalActionOptions" :key="opt" class="radio-item">
                    <input v-model="selectedAction" type="radio" :value="opt" />
                    <span>{{ getApprovalActionLabel(opt, t) }}</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">{{ tr('Comments') }}</div>
              <div class="form-value">
                <div class="comments-box">
                  <textarea
                    v-model="comments"
                    class="comments-input"
                    maxlength="200"
                    rows="5"
                    :placeholder="t('common.pleaseInput')"
                  />
                  <div class="comments-footer">
                    <div class="presets-wrap">
                      <button type="button" class="preset-btn" @click="showPresets = !showPresets">
                        {{ tr('Common Comments') }}
                      </button>
                      <div v-if="showPresets" class="preset-list">
                        <button
                          v-for="(preset, index) in commonApprovalComments"
                          :key="index"
                          type="button"
                          class="preset-item"
                          @click="insertPreset(preset)"
                        >
                          {{ tr(preset) }}
                        </button>
                      </div>
                    </div>
                    <span class="char-count">{{ comments.length }}/200</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="showBillOption" class="form-row">
              <div class="form-label">{{ t('courseRegistration.approval.billLabel') }}</div>
              <div class="form-value bill-option-value">
                <label class="checkbox-row">
                  <input v-model="generateBill" type="checkbox" />
                  {{ t('courseRegistration.approval.generateBill') }}
                </label>
                <p class="bill-option-hint">{{ t('courseRegistration.approval.generateBillHint') }}</p>
              </div>
            </div>
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <ConfirmDialog
    :visible="submitConfirmVisible"
    :title="tr('Submit Confirmation')"
    :message="submitConfirmMessage"
    :confirm-text="t('common.confirm')"
    confirm-variant="primary"
    :z-index="1500"
    @confirm="confirmSubmit"
    @cancel="cancelSubmit"
  />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1400;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-panel--wide {
  max-width: min(1280px, 96vw);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.batch-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #2563eb;
}

.lines-summary {
  margin-bottom: 16px;
}

.section-bar {
  margin: 0 0 10px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.lines-summary-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.lines-table-wrap {
  overflow-x: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.lines-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12px;
}

.lines-table th,
.lines-table td {
  padding: 5px 6px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lines-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.lines-table tbody tr:last-child td {
  border-bottom: none;
}

.col-check {
  width: 32px;
  text-align: center;
  padding-left: 6px;
  padding-right: 2px;
  overflow: visible;
}

.col-type {
  width: 7%;
}

.col-code {
  width: 8%;
}

.col-name {
  width: 12%;
}

.col-credits {
  width: 5%;
}

.col-group {
  width: 9%;
}

.col-week {
  width: 6%;
}

.col-time {
  width: 22%;
}

.col-lecturer {
  width: 9%;
}

.col-op {
  width: 14%;
}

.cr-time-venue {
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
}

.cr-time-venue-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 1px;
}

.op-cell {
  white-space: nowrap;
  overflow: visible;
}

.op-cell .btn-sm + .btn-sm {
  margin-left: 4px;
}

.form-table {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.form-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  border-bottom: 1px solid #e5e7eb;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  padding: 14px 16px;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  display: flex;
  align-items: flex-start;
}

.form-value {
  padding: 14px 16px;
  background: #fff;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}

.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.bill-option-value {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.bill-option-hint {
  margin: 0;
  max-width: 420px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
}

.comments-box {
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
}

.comments-input {
  width: 100%;
  min-height: 120px;
  padding: 10px 12px 36px;
  border: none;
  resize: vertical;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
}

.comments-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 8px;
}

.presets-wrap {
  position: relative;
}

.preset-btn {
  padding: 2px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.preset-list {
  position: absolute;
  left: 0;
  bottom: calc(100% + 4px);
  z-index: 2;
  min-width: 280px;
  max-width: 360px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
}

.preset-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.preset-item:hover {
  background: #f3f4f6;
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
}

.form-error {
  margin: 12px 0 0;
  font-size: 13px;
  color: #dc2626;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-sm {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.btn-sm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-sm.active {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.btn-outline {
  border-color: #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}
</style>
