<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { buildMonitorRemindDraft } from '../../data/courseRegistration/monitorCreditInsights.js'

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
  /** 可选：覆盖默认监控催缴草稿 (row, t) => { subject, body } */
  draftBuilder: { type: Function, default: null },
  titleKey: { type: String, default: 'courseRegistration.monitor.remindModalTitle' },
  /** 确认按钮文案 key，默认监控「确认发送」 */
  confirmKey: { type: String, default: 'courseRegistration.monitor.remindConfirmSend' },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useAppI18n()
const subject = ref('')
const body = ref('')

watch(
  () => [props.visible, props.row, props.draftBuilder],
  ([visible, row]) => {
    if (!visible || !row) return
    const draft = props.draftBuilder
      ? props.draftBuilder(row, t)
      : buildMonitorRemindDraft(row, t)
    subject.value = draft.subject
    body.value = draft.body
  },
  { immediate: true },
)

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleConfirm() {
  emit('confirm', {
    row: props.row,
    subject: subject.value.trim(),
    body: body.value.trim(),
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="remind-overlay" @click="handleOverlayClick">
      <div class="remind-panel" role="dialog" aria-modal="true">
        <div class="remind-header">
          <h2 class="remind-title">{{ t(titleKey) }}</h2>
          <button type="button" class="remind-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="remind-body">
          <p v-if="row" class="remind-recipient">
            {{ t('courseRegistration.monitor.remindRecipient') }}：
            {{ row.studentName }}（{{ row.studentId }}）
          </p>
          <label class="remind-field">
            <span>{{ t('courseRegistration.monitor.remindSubject') }}</span>
            <input v-model="subject" type="text" class="remind-input" />
          </label>
          <label class="remind-field">
            <span>{{ t('courseRegistration.monitor.remindBody') }}</span>
            <textarea v-model="body" class="remind-textarea" rows="12" />
          </label>
        </div>

        <div class="remind-footer">
          <button type="button" class="btn btn-outline" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!subject.trim() || !body.trim()"
            @click="handleConfirm"
          >
            {{ t(confirmKey) }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.remind-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}

.remind-panel {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 20px 24px 16px;
}

.remind-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.remind-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.remind-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.remind-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.remind-recipient {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
}

.remind-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.remind-input,
.remind-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
  color: #111827;
}

.remind-textarea {
  resize: vertical;
  min-height: 180px;
  line-height: 1.45;
}

.remind-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* 与 ApplicationDetailDrawer footer 按钮一致（Teleport 后不在 .cr-list-page 内） */
.remind-footer .btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.remind-footer .btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.remind-footer .btn-primary:disabled {
  background: #93c5fd;
  border-color: #93c5fd;
  cursor: not-allowed;
}

.remind-footer .btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
