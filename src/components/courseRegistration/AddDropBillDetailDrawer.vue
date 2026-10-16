<script setup>
/**
 * 审批历史：学生缴费账单明细（整单；SST 在合计描述，不入课程表）
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatAmountRmb } from '../../data/courseRegistration/addDropFeeRates.js'
import { formatUnifiedCourseCategoryLabel } from '../../data/courseRegistration/unifiedCourseCategory.js'
import {
  getApplicationBillDetail,
  getPaymentRemainingInfo,
  formatRemainingDuration,
  resolveBillLineCourseFee,
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
  // 已缴：剩余时间位展示「已缴费」
  if (info.kind === 'settled' || props.application?.billStatus === 'paid') {
    return t('courseRegistration.approval.paymentRemainingPaid')
  }
  if (info.kind === 'overdue') return t('courseRegistration.approval.paymentOverdue')
  if (info.kind === 'remaining') return formatRemainingDuration(info.remainingMs, t)
  return '—'
})

/** 页眉缴费截止：已缴也必须有值 */
const paymentDueDisplay = computed(() => {
  return (
    detail.value.paymentDueAt ||
    props.application?.paymentDueAt ||
    '—'
  )
})

/** 待缴合计文案：课程费；SST（若有）；一共应付 */
const unpaidSumText = computed(() => {
  const d = detail.value
  const fee = formatAmountRmb(d.courseFeeUnpaid)
  const payable = formatAmountRmb(d.payableUnpaid)
  if (d.sstUnpaid > 0) {
    return t('courseRegistration.approval.billUnpaidTotalWithSst', {
      fee,
      sst: formatAmountRmb(d.sstUnpaid),
      payable,
    })
  }
  return t('courseRegistration.approval.billUnpaidTotalPlain', { payable: fee })
})

/** 已缴合计文案 */
const paidSumText = computed(() => {
  const d = detail.value
  const fee = formatAmountRmb(d.courseFeePaid)
  const payable = formatAmountRmb(d.payablePaid)
  if (d.sstPaid > 0) {
    return t('courseRegistration.approval.billPaidTotalWithSst', {
      fee,
      sst: formatAmountRmb(d.sstPaid),
      payable,
    })
  }
  return t('courseRegistration.approval.billPaidTotalPlain', { payable: fee })
})

/**
 * 课程类型（统一类别）
 * @param {object} row
 */
function courseTypeLabel(row) {
  return formatUnifiedCourseCategoryLabel(row, t)
}

/**
 * 课行费用展示
 * @param {object} row
 */
function lineFeeText(row) {
  return formatAmountRmb(row.displayFee != null ? row.displayFee : resolveBillLineCourseFee(row))
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
              <strong>{{ paymentDueDisplay }}</strong>
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
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.type') }}</th>
                  <th>{{ t('courseRegistration.studentPayment.billableCredits') }}</th>
                  <th>{{ t('courseRegistration.approval.fee') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detail.unpaid" :key="row.id">
                  <td>{{ row.courseCode || '—' }}</td>
                  <td>{{ row.courseName || '—' }}</td>
                  <td>{{ courseTypeLabel(row) }}</td>
                  <td>{{ row.billableCredits || row.credits || '—' }}</td>
                  <td>{{ lineFeeText(row) }}</td>
                </tr>
                <tr v-if="!detail.unpaid.length">
                  <td colspan="5" class="bill-empty">{{ t('courseRegistration.studentPayment.emptyUnpaid') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="bill-sum">{{ unpaidSumText }}</p>

          <h3 class="bill-section-title">
            {{ t('courseRegistration.studentPayment.tabPaid') }}
            <span class="bill-count">({{ detail.paid.length }})</span>
          </h3>
          <div class="bill-table-wrap">
            <table class="bill-table">
              <thead>
                <tr>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.type') }}</th>
                  <th>{{ t('courseRegistration.approval.fee') }}</th>
                  <th>{{ t('courseRegistration.studentPayment.paidAt') }}</th>
                  <th>{{ t('courseRegistration.studentPayment.orderNo') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detail.paid" :key="row.id">
                  <td>{{ row.courseCode || '—' }}</td>
                  <td>{{ row.courseName || '—' }}</td>
                  <td>{{ courseTypeLabel(row) }}</td>
                  <td>{{ lineFeeText(row) }}</td>
                  <td>{{ row.paidAt || '—' }}</td>
                  <td>{{ row.orderNo || '—' }}</td>
                </tr>
                <tr v-if="!detail.paid.length">
                  <td colspan="6" class="bill-empty">{{ t('courseRegistration.studentPayment.emptyPaid') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="bill-sum">{{ paidSumText }}</p>
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
  width: min(720px, 100%);
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
  color: #6b7280;
  cursor: pointer;
}

.bill-body {
  flex: 1;
  overflow: auto;
  padding: 16px 20px 24px;
}

.bill-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin-bottom: 18px;
  font-size: 13px;
}

.bill-meta-label {
  display: block;
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 2px;
}

.is-warn {
  color: #b45309;
}

.is-urgent {
  color: #dc2626;
}

.bill-section-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.bill-count {
  font-weight: 400;
  color: #9ca3af;
}

.bill-table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.bill-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.bill-table th,
.bill-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}

.bill-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.bill-table tbody tr:last-child td {
  border-bottom: none;
}

.bill-empty {
  text-align: center;
  color: #9ca3af;
  padding: 16px !important;
}

.bill-sum {
  margin: 8px 0 0;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.bill-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
</style>
