<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import { approvalActionOptions, commonApprovalComments, validateApprovalForm } from '../../data/courseApproval.js'
import { getApprovalActionLabel } from '../../utils/approvalActionLabels.js'

const props = defineProps({
  visible: Boolean,
  approvalStage: { type: String, default: '' },
  targetCount: { type: Number, default: 1 },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr } = useAppI18n()

const selectedAction = ref('')
const comments = ref('')
const showPresets = ref(false)
const formError = ref('')
const submitConfirmVisible = ref(false)
const pendingPayload = ref(null)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedAction.value = ''
    comments.value = ''
    showPresets.value = false
    formError.value = ''
    submitConfirmVisible.value = false
    pendingPayload.value = null
  },
)

const introText = computed(() => {
  const template = tr('Please fill in the following information before submitting (Current {stage}) :')
  return template.replace('{stage}', props.approvalStage || '--')
})

const batchHint = computed(() => {
  if (props.targetCount <= 1) return ''
  const template = tr('Applying the same decision to {count} selected application(s).')
  return template.replace('{count}', String(props.targetCount))
})

const submitConfirmMessage = computed(() => {
  if (props.targetCount <= 1) {
    return tr('Are you sure you want to submit this approval decision?')
  }
  const template = tr('Are you sure you want to submit this approval decision for {count} selected application(s)?')
  return template.replace('{count}', String(props.targetCount))
})

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function insertPreset(text) {
  comments.value = text.slice(0, 100)
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
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Approval') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p class="intro-text">{{ introText }}</p>
          <p v-if="batchHint" class="batch-hint">{{ batchHint }}</p>

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
                    maxlength="100"
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
                    <span class="char-count">{{ comments.length }}/100</span>
                  </div>
                </div>
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
  z-index: 1000;
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

.intro-text {
  margin: 0 0 8px;
  font-size: 14px;
  color: #374151;
}

.batch-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #2563eb;
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

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}
</style>
