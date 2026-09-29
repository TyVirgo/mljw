<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatAmountRmb } from '../../data/courseRegistration/addDropFeeRates.js'
import {
  getApplicationBillDetail,
  getPaymentRemainingInfo,
  formatRemainingDuration,
} from '../../data/courseRegistration/adminAddDropPaymentInsight.js'

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const detail = computed(() => getApplicationBillDetail(props.application))
const remaining = computed(() => getPaymentRemainingInfo(props.application))

const remainingText = computed(() => {
  const info = remaining.value
  if (info.kind === 'overdue') return t('courseRegistration.approval.paymentOverdue')
  if (info.kind === 'remaining') return formatRemainingDuration(info.remainingMs, t)
  return '—'
})

const unpaidTotal = computed(() =>
  detail.value.unpaid.reduce((s, l) => s + (Number(l.amount) || 0), 0),
)
const paidTotal = computed(() =>
  detail.value.paid.reduce((s, l) => s + (Number(l.amount) || 0), 0),
)

function courseLabel(row) {
  if (row.courseName && row.courseName !== row.courseCode) {
    return `${row.courseCode} ${row.courseName}`
  }
  return row.courseCode || '—'
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && application" class="bill-overlay" @click="handleOverlayClick">
      <div class="bill-panel" role="dialog" aria-modal="true">
        <div class="bill-header">
          <h2 class="bill-title">{{ t('courseRegistration.approval.billDetailTitle') }}</h2>
          <button type="button" class="bill-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="bill-body">
          <div class="bill-meta">
            <div>
              <span class="bill-meta-label">{{ t('courseRegistration.monitor.student') }}</span>
              <strong>{{ application.studentName }}（{{ application.studentId }}）</strong>
            </div>
            <div>
              <span class="bill-meta-label">{{ t('courseRegistration.approval.applicationNo') }}</span>
              <strong>{{ application.applicationNo }}</strong>
            </div>
            <div>
              <span class="bill-meta-label">{{ t('courseRegistration.studentPayment.dueAt') }}</span>
              <strong>{{ detail.paymentDueAt || application.paymentDueAt || '—' }}</strong>
            </div>
            <div>
              <span class="bill-meta-label">{{ t('courseRegistration.approval.paymentRemainingLabel') }}</span>
              <strong
                :class="{
                  'is-warn': remaining.warn,
                  'is-urgent': remaining.urgent || remaining.kind === 'overdue',
                }"
              >
                {{ remainingText }}
              </strong>
            </div>
          </div>

          <h3 class="bill-section-title">
            {{ t('courseRegistration.studentPayment.tabUnpaid') }}
            <span class="bill-count">({{ detail.unpaid.length }})</span>
          </h3>
          <div class="bill-table-wrap">
            <table class="bill-table">
              <thead>
                <tr>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.studentPayment.billableCredits') }}</th>
                  <th>{{ t('courseRegistration.approval.fee') }}</th>
                  <th>{{ t('courseRegistration.studentPayment.dueAt') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detail.unpaid" :key="row.id">
                  <td>{{ courseLabel(row) }}</td>
                  <td>{{ row.billableCredits || row.credits || '—' }}</td>
                  <td>{{ formatAmountRmb(row.amount) }}</td>
                  <td>{{ row.paymentDueAt || '—' }}</td>
                </tr>
                <tr v-if="!detail.unpaid.length">
                  <td colspan="4" class="bill-empty">{{ t('courseRegistration.studentPayment.emptyUnpaid') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="bill-sum">
            {{ t('courseRegistration.approval.billUnpaidTotal') }}：{{ formatAmountRmb(unpaidTotal) }}
          </p>

          <h3 class="bill-section-title">
            {{ t('courseRegistration.studentPayment.tabPaid') }}
            <span class="bill-count">({{ detail.paid.length }})</span>
          </h3>
          <div class="bill-table-wrap">
            <table class="bill-table">
              <thead>
                <tr>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.approval.fee') }}</th>
                  <th>{{ t('courseRegistration.studentPayment.paidAt') }}</th>
                  <th>{{ t('courseRegistration.studentPayment.orderNo') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detail.paid" :key="row.id">
                  <td>{{ courseLabel(row) }}</td>
                  <td>{{ formatAmountRmb(row.amount) }}</td>
                  <td>{{ row.paidAt || '—' }}</td>
                  <td>{{ row.orderNo || '—' }}</td>
                </tr>
                <tr v-if="!detail.paid.length">
                  <td colspan="4" class="bill-empty">{{ t('courseRegistration.studentPayment.emptyPaid') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="bill-sum">
            {{ t('courseRegistration.approval.billPaidTotal') }}：{{ formatAmountRmb(paidTotal) }}
          </p>
        </div>

        <div class="bill-footer">
          <button type="button" class="btn btn-primary" @click="emit('close')">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.bill-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: flex-end;
}

.bill-panel {
  width: min(640px, 100%);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.12);
}

.bill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.bill-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.bill-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.bill-body {
  flex: 1;
  overflow: auto;
  padding: 16px 20px 24px;
}

.bill-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin-bottom: 18px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
}

.bill-meta-label {
  display: block;
  color: #6b7280;
  margin-bottom: 2px;
  font-size: 12px;
}

.is-warn {
  color: #b45309;
}

.is-urgent {
  color: #b91c1c;
}

.bill-section-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.bill-count {
  color: #6b7280;
  font-weight: 500;
}

.bill-table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.bill-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.bill-table th,
.bill-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  white-space: nowrap;
}

.bill-table th {
  background: #f9fafb;
  color: #475569;
  font-weight: 600;
}

.bill-empty {
  text-align: center;
  color: #94a3b8;
}

.bill-sum {
  margin: 8px 0 0;
  font-size: 13px;
  color: #334155;
  text-align: right;
}

.bill-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
}

.bill-footer .btn {
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

.bill-footer .btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.bill-footer .btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
