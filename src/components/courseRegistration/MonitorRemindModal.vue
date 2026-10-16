<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { buildMonitorRemindDraft } from '../../data/courseRegistration/monitorCreditInsights.js'
import {
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
} from '../../data/courseRegistration/adminAddDropPaymentInsight.js'

const DEFAULT_DEADLINE_HOURS = 48

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
  /** 可选：覆盖默认监控催缴草稿 (row, t, options?) => { subject, body } */
  draftBuilder: { type: Function, default: null },
  titleKey: { type: String, default: 'courseRegistration.monitor.remindModalTitle' },
  /** 确认按钮文案 key，默认监控「确认发送」 */
  confirmKey: { type: String, default: 'courseRegistration.monitor.remindConfirmSend' },
  /** 白名单再次开放：展示延期截止 datetime-local（对齐重新生成订单） */
  showDeadlinePicker: { type: Boolean, default: false },
  deadlineLabelKey: {
    type: String,
    default: 'courseRegistration.whitelist.reopenNewDeadline',
  },
  /** 打开时默认截止：当前时刻 + N 小时 */
  defaultDeadlineHours: { type: Number, default: DEFAULT_DEADLINE_HOURS },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useAppI18n()
const subject = ref('')
const body = ref('')
const deadlineLocal = ref('')
const deadlineError = ref('')

const confirmDisabled = computed(() => {
  if (!subject.value.trim() || !body.value.trim()) return true
  if (props.showDeadlinePicker && !deadlineLocal.value) return true
  return false
})

function resolvedDefaultHours() {
  const hours = Number(props.defaultDeadlineHours)
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_DEADLINE_HOURS
}

function defaultDeadlineDate() {
  return new Date(Date.now() + resolvedDefaultHours() * 60 * 60 * 1000)
}

function hoursFromDeadlineLocal(localValue) {
  const dueStr = fromDatetimeLocalValue(localValue)
  if (!dueStr) return resolvedDefaultHours()
  const due = new Date(String(dueStr).replace(' ', 'T'))
  if (Number.isNaN(due.getTime())) return resolvedDefaultHours()
  const ms = due.getTime() - Date.now()
  if (ms <= 0) return 1
  return Math.max(1, Math.round(ms / (60 * 60 * 1000)))
}

function buildDraft(hours) {
  const row = props.row
  if (!row) return { subject: '', body: '' }
  if (props.draftBuilder) {
    return props.draftBuilder(row, t, { hours })
  }
  return buildMonitorRemindDraft(row, t)
}

function refreshDraftFromDeadline() {
  const hours = props.showDeadlinePicker
    ? hoursFromDeadlineLocal(deadlineLocal.value)
    : resolvedDefaultHours()
  const draft = buildDraft(hours)
  subject.value = draft.subject
  body.value = draft.body
}

watch(
  () => [props.visible, props.row?.studentId || props.row?.id, props.showDeadlinePicker],
  ([visible]) => {
    if (!visible || !props.row) return
    deadlineError.value = ''
    if (props.showDeadlinePicker) {
      const next = toDatetimeLocalValue(defaultDeadlineDate())
      if (deadlineLocal.value !== next) deadlineLocal.value = next
    } else if (deadlineLocal.value) {
      deadlineLocal.value = ''
    }
    refreshDraftFromDeadline()
  },
  { immediate: true },
)

watch(deadlineLocal, (val, prev) => {
  if (!props.visible || !props.showDeadlinePicker || !props.row) return
  if (!val || val === prev) return
  deadlineError.value = ''
  const hours = hoursFromDeadlineLocal(val)
  const draft = buildDraft(hours)
  body.value = draft.body
})

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleConfirm() {
  deadlineError.value = ''
  let deadlineAt = ''
  if (props.showDeadlinePicker) {
    deadlineAt = fromDatetimeLocalValue(deadlineLocal.value)
    if (!deadlineAt) {
      deadlineError.value = 'courseRegistration.whitelist.reopenDueRequired'
      return
    }
    const due = new Date(String(deadlineAt).replace(' ', 'T'))
    if (Number.isNaN(due.getTime()) || due.getTime() <= Date.now()) {
      deadlineError.value = 'courseRegistration.whitelist.reopenDueMustFuture'
      return
    }
  }
  emit('confirm', {
    row: props.row,
    subject: subject.value.trim(),
    body: body.value.trim(),
    deadlineAt,
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
          <label v-if="showDeadlinePicker" class="remind-field">
            <span>{{ t(deadlineLabelKey) }}</span>
            <input v-model="deadlineLocal" type="datetime-local" class="remind-input" />
          </label>
          <p v-if="deadlineError" class="remind-error">{{ t(deadlineError) }}</p>
        </div>

        <div class="remind-footer">
          <button type="button" class="btn btn-outline" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="confirmDisabled"
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

.remind-input[type='datetime-local'] {
  height: 36px;
  border-radius: 6px;
  padding: 0 10px;
}

.remind-textarea {
  resize: vertical;
  min-height: 180px;
  line-height: 1.45;
}

.remind-error {
  margin: 0;
  color: #b91c1c;
  font-size: 12px;
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
