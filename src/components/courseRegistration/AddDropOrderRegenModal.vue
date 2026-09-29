<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatAmountRmb } from '../../data/courseRegistration/addDropFeeRates.js'
import {
  getApplicationBillDetail,
  defaultRegenDueAt,
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
  regenerateApplicationPaymentOrder,
} from '../../data/courseRegistration/adminAddDropPaymentInsight.js'

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useAppI18n()
const dueLocal = ref('')
const errorKey = ref('')

const detail = computed(() => getApplicationBillDetail(props.application))
const unpaidTotal = computed(() =>
  detail.value.unpaid.reduce((s, l) => s + (Number(l.amount) || 0), 0),
)

watch(
  () => [props.visible, props.application],
  ([visible]) => {
    if (!visible) return
    errorKey.value = ''
    dueLocal.value = toDatetimeLocalValue(defaultRegenDueAt(2))
  },
  { immediate: true },
)

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleConfirm() {
  errorKey.value = ''
  const due = fromDatetimeLocalValue(dueLocal.value)
  const result = regenerateApplicationPaymentOrder(props.application?.id, due)
  if (!result.ok) {
    if (result.reason === 'due_not_future') {
      errorKey.value = 'courseRegistration.approval.regenDueMustFuture'
    } else {
      errorKey.value = 'courseRegistration.approval.regenFailed'
    }
    return
  }
  emit('confirm', { application: props.application, paymentDueAt: result.paymentDueAt })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && application" class="regen-overlay" @click="handleOverlayClick">
      <div class="regen-panel" role="dialog" aria-modal="true">
        <div class="regen-header">
          <h2 class="regen-title">{{ t('courseRegistration.approval.regenOrderTitle') }}</h2>
          <button type="button" class="regen-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="regen-body">
          <p class="regen-hint">{{ t('courseRegistration.approval.regenOrderHint') }}</p>
          <p class="regen-recipient">
            {{ application.studentName }}（{{ application.studentId }}）· {{ application.applicationNo }}
          </p>
          <p class="regen-old-due">
            {{ t('courseRegistration.approval.regenOldDue') }}：
            {{ application.paymentDueAt || detail.paymentDueAt || '—' }}
          </p>

          <div class="regen-courses" v-if="detail.unpaid.length">
            <div v-for="row in detail.unpaid" :key="row.id" class="regen-course-row">
              <span>{{ row.courseCode }}</span>
              <span>{{ formatAmountRmb(row.amount) }}</span>
            </div>
            <div class="regen-course-row regen-total">
              <span>{{ t('courseRegistration.approval.billUnpaidTotal') }}</span>
              <span>{{ formatAmountRmb(unpaidTotal) }}</span>
            </div>
          </div>

          <label class="regen-field">
            <span>{{ t('courseRegistration.approval.regenNewDue') }}</span>
            <input v-model="dueLocal" type="datetime-local" class="regen-input" />
          </label>
          <p v-if="errorKey" class="regen-error">{{ t(errorKey) }}</p>
        </div>

        <div class="regen-footer">
          <button type="button" class="btn btn-outline" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" :disabled="!dueLocal" @click="handleConfirm">
            {{ t('courseRegistration.approval.regenConfirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.regen-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.regen-panel {
  width: min(480px, 100%);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.regen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}

.regen-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.regen-close {
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: #6b7280;
}

.regen-body {
  padding: 16px 18px;
  overflow: auto;
}

.regen-hint {
  margin: 0 0 10px;
  font-size: 13px;
  color: #64748b;
}

.regen-recipient {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}

.regen-old-due {
  margin: 0 0 12px;
  font-size: 12px;
  color: #475569;
}

.regen-courses {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 14px;
  overflow: hidden;
}

.regen-course-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.regen-course-row:last-child {
  border-bottom: none;
}

.regen-total {
  background: #f8fafc;
  font-weight: 600;
}

.regen-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.regen-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.regen-error {
  margin: 8px 0 0;
  color: #b91c1c;
  font-size: 12px;
}

.regen-footer {
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
}

/* Teleport 后不在 .cr-list-page .page-card 内，需自带按钮样式 */
.regen-footer .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.regen-footer .btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.regen-footer .btn-primary:disabled {
  background: #93c5fd;
  border-color: #93c5fd;
  cursor: not-allowed;
}

.regen-footer .btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
