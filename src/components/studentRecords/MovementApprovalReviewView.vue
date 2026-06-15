<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import DefermentDetailModal from './DefermentDetailModal.vue'
import ResumptionDetailModal from './ResumptionDetailModal.vue'
import WithdrawalDetailModal from './WithdrawalDetailModal.vue'
import ProgrammeTransferDetailModal from './ProgrammeTransferDetailModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { findInStore } from '../../data/movementStore.js'
import {
  applyMovementDecision,
  approvalActionOptions,
  canRecallMovement,
  commonApprovalComments,
  recallMovementDecision,
  validateApprovalForm,
} from '../../data/movementApprovalEngine.js'

const props = defineProps({
  queueItem: { type: Object, required: true },
  mode: { type: String, default: 'readonly' },
  currentRole: { type: String, required: true },
})

const emit = defineEmits(['back', 'decided', 'recalled'])

const { t, tr } = useAppI18n()

const selectedAction = ref('')
const comments = ref('')
const showPresets = ref(false)
const formError = ref('')
const submitConfirmVisible = ref(false)
const recallConfirmVisible = ref(false)

const adminNewProgramme = ref('')
const adminNewIntake = ref('')
const adminDate = ref('')

const liveItem = computed(() => {
  const fresh = findInStore(props.queueItem.sourceKey, props.queueItem.id)
  return fresh || props.queueItem.raw
})

const showAdminSection = computed(
  () =>
    props.mode === 'approve' &&
    props.queueItem.sourceKey === 'programme-transfer' &&
    liveItem.value?.approvalStage === 'Dean/HoP',
)

const canRecall = computed(() =>
  props.mode === 'history'
    ? canRecallMovement(props.queueItem.sourceKey, liveItem.value, props.currentRole)
    : false,
)

function initAdminFields() {
  const item = liveItem.value
  adminNewProgramme.value = item?.adminNewProgramme || item?.newProgrammeFirstChoice || ''
  adminNewIntake.value = item?.adminNewIntake || item?.startSemester || ''
  adminDate.value = item?.adminDate || new Date().toISOString().slice(0, 10)
}

initAdminFields()

function insertPreset(text) {
  comments.value = text.slice(0, 200)
  showPresets.value = false
}

function handleSubmitClick() {
  const itemForValidation = {
    ...liveItem.value,
    sourceKey: props.queueItem.sourceKey,
  }
  const errors = validateApprovalForm(selectedAction.value, comments.value, itemForValidation)
  if (errors.action) {
    formError.value = tr(errors.action)
    return
  }
  if (errors.comment) {
    formError.value = tr(errors.comment)
    return
  }
  if (errors.adminNewProgramme) {
    formError.value = tr(errors.adminNewProgramme)
    return
  }
  formError.value = ''
  submitConfirmVisible.value = true
}

function confirmSubmit() {
  submitConfirmVisible.value = false
  const adminFields = showAdminSection.value
    ? {
        adminNewProgramme: adminNewProgramme.value,
        adminNewIntake: adminNewIntake.value,
        adminDate: adminDate.value,
      }
    : {}
  applyMovementDecision(
    props.queueItem.sourceKey,
    liveItem.value,
    selectedAction.value,
    comments.value.trim(),
    props.currentRole,
    adminFields,
  )
  emit('decided')
}

function confirmRecall() {
  recallConfirmVisible.value = false
  recallMovementDecision(props.queueItem.sourceKey, liveItem.value, props.currentRole)
  emit('recalled')
}
</script>

<template>
  <div class="review-page">
    <header class="review-header">
      <button type="button" class="back-btn" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ t('common.back') }}
      </button>
      <span class="review-title">{{ t(`movementApproval.viewModes.${mode}`) }}</span>
    </header>

    <div class="review-detail-host">
      <ProgrammeTransferDetailModal
        v-if="queueItem.sourceKey === 'programme-transfer'"
        :visible="true"
        :item="liveItem"
        @close="emit('back')"
      />
      <DefermentDetailModal
        v-else-if="queueItem.sourceKey === 'deferment'"
        :visible="true"
        :item="liveItem"
        @close="emit('back')"
      />
      <ResumptionDetailModal
        v-else-if="queueItem.sourceKey === 'resumption'"
        :visible="true"
        :item="liveItem"
        @close="emit('back')"
      />
      <WithdrawalDetailModal
        v-else-if="queueItem.sourceKey === 'withdrawal'"
        :visible="true"
        :item="liveItem"
        @close="emit('back')"
      />
    </div>

    <section v-if="mode === 'approve'" class="approval-section">
      <h3 class="section-title">{{ tr('Approval') }}</h3>
      <p class="stage-hint">
        {{ tr('Please fill in the following information before submitting (Current {stage}) :').replace('{stage}', liveItem.approvalStage || '--') }}
      </p>

      <div v-if="showAdminSection" class="admin-block">
        <h4 class="admin-title">{{ t('programmeTransfer.sections.officeUse') }}</h4>
        <div class="admin-grid">
          <label>
            <span>{{ t('programmeTransfer.fields.adminNewProgramme') }}</span>
            <input v-model="adminNewProgramme" type="text" class="form-input" />
          </label>
          <label>
            <span>{{ t('programmeTransfer.fields.adminNewIntake') }}</span>
            <input v-model="adminNewIntake" type="text" class="form-input" />
          </label>
          <label>
            <span>{{ t('programmeTransfer.fields.adminDate') }}</span>
            <input v-model="adminDate" type="date" class="form-input" />
          </label>
        </div>
      </div>

      <div class="form-table">
        <div class="form-row">
          <div class="form-label">{{ tr('Action') }}</div>
          <div class="form-value">
            <div class="radio-group">
              <label v-for="opt in approvalActionOptions" :key="opt" class="radio-item">
                <input v-model="selectedAction" type="radio" :value="opt" />
                <span>{{ tr(opt) }}</span>
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
                rows="4"
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
      </div>

      <p v-if="formError" class="form-error">{{ formError }}</p>

      <div class="approval-actions">
        <button type="button" class="btn btn-primary" @click="handleSubmitClick">
          {{ t('movementApproval.submitDecision') }}
        </button>
      </div>
    </section>

    <section v-if="mode === 'history' && canRecall" class="recall-section">
      <button type="button" class="btn btn-outline" @click="recallConfirmVisible = true">
        {{ t('movementApproval.recall') }}
      </button>
      <p class="recall-hint">{{ t('movementApproval.recallHint') }}</p>
    </section>

    <ConfirmDialog
      :visible="submitConfirmVisible"
      :title="tr('Submit Confirmation')"
      :message="tr('Are you sure you want to submit this approval decision?')"
      :confirm-text="t('common.confirm')"
      confirm-variant="primary"
      @confirm="confirmSubmit"
      @cancel="submitConfirmVisible = false"
    />

    <ConfirmDialog
      :visible="recallConfirmVisible"
      :title="t('movementApproval.recallConfirmTitle')"
      :message="t('movementApproval.recallConfirmMessage')"
      :confirm-text="t('movementApproval.recall')"
      confirm-variant="primary"
      @confirm="confirmRecall"
      @cancel="recallConfirmVisible = false"
    />
  </div>
</template>

<style scoped>
.review-page {
  height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 16px 28px 32px;
  box-sizing: border-box;
  background: #f3f4f6;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.review-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.review-detail-host :deep(.modal-overlay) {
  position: static;
  inset: auto;
  background: transparent;
  padding: 0;
  z-index: auto;
  display: block;
}

.review-detail-host :deep(.modal-panel) {
  max-height: none;
  width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.approval-section,
.recall-section {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.stage-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b7280;
}

.admin-block {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.admin-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.admin-grid label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #374151;
}

.form-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
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
}

.form-value {
  padding: 14px 16px;
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
  cursor: pointer;
}

.comments-box {
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.comments-input {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: none;
  resize: vertical;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
}

.comments-footer {
  display: flex;
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
  cursor: pointer;
}

.preset-list {
  position: absolute;
  left: 0;
  bottom: calc(100% + 4px);
  z-index: 2;
  min-width: 260px;
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

.approval-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.recall-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
