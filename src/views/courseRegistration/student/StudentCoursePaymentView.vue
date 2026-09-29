<script setup>
/**
 * 学生课程缴费：待缴费 / 待支付（按订单分组）/ 已缴费
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import StudentPaymentCodeModal from '../../../components/courseRegistration/StudentPaymentCodeModal.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { formatAmountRmb, CREDIT_FEE_RATES } from '../../../data/courseRegistration/addDropFeeRates.js'
import {
  ensureStudentCoursePaymentSeeded,
  cartUnpaidLines,
  pendingPayOrderGroups,
  openPaymentOrders,
  paidPaymentLines,
  createPaymentOrder,
  cancelPaymentOrder,
  getPaymentOrderById,
  getOrderRemainingMs,
  expirePaymentOrderIfNeeded,
  PAYMENT_ORDER_TTL_MS,
} from '../../../data/courseRegistration/studentCoursePaymentStore.js'
import { getStudentProfileFields } from '../../../data/courseRegistration/studentRegistrationStore.js'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t } = useAppI18n()

const studentFields = computed(() => getStudentProfileFields())

const academicSessionLabel = computed(() => {
  const fromLine =
    cartUnpaidLines.value[0]?.academicSession ||
    pendingPayOrderGroups.value[0]?.lines?.[0]?.academicSession ||
    paidPaymentLines.value[0]?.academicSession ||
    ''
  return fromLine || '2026/04'
})

const feeRateTipText = computed(() =>
  t('courseRegistration.student.feeRateTip', {
    arts: CREDIT_FEE_RATES.arts,
    science: CREDIT_FEE_RATES.science,
    business: CREDIT_FEE_RATES.business,
  }),
)

/** @type {import('vue').Ref<'unpaid'|'pendingPay'|'paid'>} */
const activeTab = ref('unpaid')
const selectedIds = ref([])
const codeModalVisible = ref(false)
/** @type {import('vue').Ref<object|null>} */
const modalOrder = ref(null)
const pageMessage = ref('')
/** 驱动待支付倒计时刷新 */
const nowTick = ref(Date.now())
let countdownTimer = null

onMounted(() => {
  ensureStudentCoursePaymentSeeded()
  expirePaymentOrderIfNeeded()
  if (openPaymentOrders.value.length) activeTab.value = 'pendingPay'
  countdownTimer = setInterval(() => {
    nowTick.value = Date.now()
    expirePaymentOrderIfNeeded()
  }, 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

const allSelectableChecked = computed(() => {
  const ids = cartUnpaidLines.value.map((l) => l.id)
  return ids.length > 0 && ids.every((id) => selectedIds.value.includes(id))
})

const selectedLines = computed(() =>
  cartUnpaidLines.value.filter((l) => selectedIds.value.includes(l.id)),
)

const selectedTotal = computed(() =>
  selectedLines.value.reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
)

watch(cartUnpaidLines, (rows) => {
  const valid = new Set(rows.map((r) => r.id))
  selectedIds.value = selectedIds.value.filter((id) => valid.has(id))
})

function toggleAll(checked) {
  selectedIds.value = checked ? cartUnpaidLines.value.map((l) => l.id) : []
}

function toggleLine(id, checked) {
  const line = cartUnpaidLines.value.find((l) => l.id === id)
  if (!line) return
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  }
}

function unitRate(row) {
  const billable = Number(row.billableCredits) || 0
  const amount = Number(row.amount) || 0
  if (billable > 0) return Math.round(amount / billable)
  return CREDIT_FEE_RATES.science
}

function amountBreakdown(row) {
  const billable = Number(row.billableCredits) || 0
  if (billable <= 0) return formatAmountRmb(row.amount)
  return t('courseRegistration.studentPayment.amountBreakdown', {
    n: billable,
    rate: unitRate(row),
    amount: formatAmountRmb(row.amount),
  })
}

function formatCountdown(order) {
  void nowTick.value
  const ms = getOrderRemainingMs(order)
  if (!order || order.status !== 'open' || ms <= 0) return ''
  const totalSec = Math.floor(ms / 1000)
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function openCodeModal(order) {
  modalOrder.value = order
  codeModalVisible.value = true
}

function submitOrder() {
  pageMessage.value = ''
  const result = createPaymentOrder(selectedIds.value)
  if (!result.ok) {
    pageMessage.value = t('courseRegistration.studentPayment.errEmptySelect')
    return
  }
  selectedIds.value = []
  openCodeModal(result.order)
}

function continuePay(order) {
  expirePaymentOrderIfNeeded(order?.id)
  const live = getPaymentOrderById(order?.id)
  if (live?.status === 'open' || live?.status === 'expired') {
    openCodeModal(live)
  }
}

function cancelOrder(order) {
  if (!order?.id) return
  const ok = window.confirm(t('courseRegistration.studentPayment.cancelOrderConfirm'))
  if (!ok) return
  const result = cancelPaymentOrder(order.id)
  if (!result.ok) return
  pageMessage.value = t('courseRegistration.studentPayment.orderCancelledMsg')
  if (modalOrder.value?.id === order.id) {
    codeModalVisible.value = false
    modalOrder.value = null
  }
}

function onPaid() {
  pageMessage.value = t('courseRegistration.studentPayment.paidSuccess')
  selectedIds.value = []
  activeTab.value = 'paid'
  modalOrder.value = null
}

function onExpired() {
  pageMessage.value = t('courseRegistration.studentPayment.orderExpiredMsg')
}

function onRecreate() {
  codeModalVisible.value = false
  modalOrder.value = null
  activeTab.value = 'unpaid'
  pageMessage.value = t('courseRegistration.studentPayment.recreateHint')
}

function onModalClose() {
  codeModalVisible.value = false
}
</script>

<template>
  <StudentPageShell>
    <div class="pay-page">
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.studentPayment.pageHint') }}</p>
      </CourseRegistrationCallout>

      <div class="pay-student-bar">
        <div>
          <span class="pay-student-label">{{ t('courseRegistration.student.fieldStudentId') }}</span>
          <strong>{{ studentFields.studentId }}</strong>
        </div>
        <div>
          <span class="pay-student-label">{{ t('courseRegistration.student.fieldStudentName') }}</span>
          <strong>{{ studentFields.studentName }}</strong>
        </div>
        <div>
          <span class="pay-student-label">{{ t('courseRegistration.student.fieldProgramme') }}</span>
          <strong>{{ studentFields.programme }}</strong>
        </div>
        <div>
          <span class="pay-student-label">{{ t('courseRegistration.batch.academicSession') }}</span>
          <strong>{{ academicSessionLabel }}</strong>
        </div>
      </div>

      <p v-if="pageMessage" class="pay-toast">{{ pageMessage }}</p>

      <div class="pay-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="pay-tab"
          :class="{ active: activeTab === 'unpaid' }"
          @click="activeTab = 'unpaid'"
        >
          {{ t('courseRegistration.studentPayment.tabUnpaid') }}
          <span class="pay-tab-count">({{ cartUnpaidLines.length }})</span>
        </button>
        <button
          type="button"
          role="tab"
          class="pay-tab"
          :class="{ active: activeTab === 'pendingPay' }"
          @click="activeTab = 'pendingPay'"
        >
          {{ t('courseRegistration.studentPayment.tabPendingPay') }}
          <span class="pay-tab-count">({{ openPaymentOrders.length }})</span>
        </button>
        <button
          type="button"
          role="tab"
          class="pay-tab"
          :class="{ active: activeTab === 'paid' }"
          @click="activeTab = 'paid'"
        >
          {{ t('courseRegistration.studentPayment.tabPaid') }}
          <span class="pay-tab-count">({{ paidPaymentLines.length }})</span>
        </button>
      </div>

      <!-- 待缴费：勾选 + 结算 -->
      <div v-if="activeTab === 'unpaid'" class="pay-layout">
        <section class="pay-list-panel">
          <div class="pay-list-toolbar">
            <label class="pay-check">
              <input
                type="checkbox"
                :checked="allSelectableChecked"
                :disabled="!cartUnpaidLines.length"
                @change="toggleAll($event.target.checked)"
              />
              <span>{{ t('courseRegistration.studentPayment.selectAll') }}</span>
            </label>
          </div>

          <div v-if="!cartUnpaidLines.length" class="pay-empty">
            {{ t('courseRegistration.studentPayment.emptyUnpaid') }}
          </div>

          <article v-for="row in cartUnpaidLines" :key="row.id" class="pay-row">
            <label class="pay-check pay-row-check">
              <input
                type="checkbox"
                :checked="selectedIds.includes(row.id)"
                @change="toggleLine(row.id, $event.target.checked)"
              />
            </label>
            <div class="pay-row-main">
              <div class="pay-row-title">
                <strong>{{ row.courseCode }}</strong>
                <span>{{ row.courseName }}</span>
              </div>
              <div class="pay-row-meta">
                <span>{{ row.sectionName || '—' }}</span>
                <span>{{ amountBreakdown(row) }}</span>
                <span v-if="row.applicationNo">
                  {{ t('courseRegistration.studentPayment.applicationNo') }}:
                  {{ row.applicationNo }}
                </span>
                <span v-if="row.paymentDueAt">
                  {{ t('courseRegistration.studentPayment.dueAt') }}: {{ row.paymentDueAt }}
                </span>
              </div>
            </div>
            <div class="pay-row-amount">{{ formatAmountRmb(row.amount) }}</div>
          </article>
        </section>

        <aside class="pay-settle">
          <h3 class="label-with-tip">
            <span>{{ t('courseRegistration.studentPayment.settleTitle') }}</span>
            <span
              class="tip-icon"
              :title="feeRateTipText"
              :aria-label="feeRateTipText"
              tabindex="0"
            >?</span>
          </h3>
          <dl class="pay-settle-dl">
            <div>
              <dt>{{ t('courseRegistration.studentPayment.selectedCount') }}</dt>
              <dd>{{ selectedLines.length }}</dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.studentPayment.selectedTotal') }}</dt>
              <dd class="total">{{ formatAmountRmb(selectedTotal) }}</dd>
            </div>
          </dl>
          <ul v-if="selectedLines.length" class="pay-settle-lines">
            <li v-for="line in selectedLines" :key="line.id">
              <span class="pay-settle-line-text">
                {{ line.courseCode }} · {{ amountBreakdown(line) }}
              </span>
            </li>
          </ul>
          <button
            type="button"
            class="btn btn-primary pay-submit"
            :disabled="!selectedLines.length"
            @click="submitOrder"
          >
            {{ t('courseRegistration.studentPayment.submitOrder') }}
          </button>
        </aside>
      </div>

      <!-- 待支付：按订单分组 -->
      <div v-else-if="activeTab === 'pendingPay'" class="pay-pending-panel">
        <div v-if="!pendingPayOrderGroups.length" class="pay-empty">
          {{ t('courseRegistration.studentPayment.emptyPendingPay') }}
        </div>

        <section
          v-for="group in pendingPayOrderGroups"
          :key="group.order.id"
          class="pay-order-card"
        >
          <header class="pay-order-head">
            <div class="pay-order-head-main">
              <div class="pay-order-no">
                <span class="pay-order-label">{{ t('courseRegistration.studentPayment.orderNo') }}</span>
                <strong>{{ group.order.orderNo }}</strong>
              </div>
              <div class="pay-order-meta-row">
                <span>
                  {{ t('courseRegistration.studentPayment.courseCount') }}:
                  {{ group.order.courseCount }}
                </span>
                <span class="pay-order-total">{{ formatAmountRmb(group.order.total) }}</span>
                <span
                  v-if="formatCountdown(group.order)"
                  class="pay-order-countdown"
                >
                  {{ t('courseRegistration.studentPayment.countdown') }}:
                  {{ formatCountdown(group.order) }}
                </span>
              </div>
            </div>
            <div class="pay-order-actions">
              <button
                type="button"
                class="btn btn-primary"
                @click="continuePay(group.order)"
              >
                {{ t('courseRegistration.studentPayment.continuePay') }}
              </button>
              <button
                type="button"
                class="btn btn-default"
                @click="cancelOrder(group.order)"
              >
                {{ t('courseRegistration.studentPayment.cancelOrder') }}
              </button>
            </div>
          </header>
          <p class="pay-order-hint">
            {{
              t('courseRegistration.studentPayment.codeHint', {
                minutes: Math.round(PAYMENT_ORDER_TTL_MS / 60000),
              })
            }}
          </p>
          <article
            v-for="row in group.lines"
            :key="row.id"
            class="pay-row pending"
          >
            <div class="pay-row-main">
              <div class="pay-row-title">
                <strong>{{ row.courseCode }}</strong>
                <span>{{ row.courseName }}</span>
              </div>
              <div class="pay-row-meta">
                <span>{{ row.sectionName || '—' }}</span>
                <span>{{ amountBreakdown(row) }}</span>
                <span v-if="row.applicationNo">
                  {{ t('courseRegistration.studentPayment.applicationNo') }}:
                  {{ row.applicationNo }}
                </span>
              </div>
            </div>
            <div class="pay-row-amount">{{ formatAmountRmb(row.amount) }}</div>
          </article>
        </section>
      </div>

      <!-- 已缴费 -->
      <div v-else class="pay-paid-panel">
        <div v-if="!paidPaymentLines.length" class="pay-empty">
          {{ t('courseRegistration.studentPayment.emptyPaid') }}
        </div>
        <article v-for="row in paidPaymentLines" :key="row.id" class="pay-row paid">
          <div class="pay-row-main">
            <div class="pay-row-title">
              <strong>{{ row.courseCode }}</strong>
              <span>{{ row.courseName }}</span>
              <span class="pay-badge paid">{{ t('courseRegistration.studentPayment.paidBadge') }}</span>
            </div>
            <div class="pay-row-meta">
              <span v-if="row.applicationNo">
                {{ t('courseRegistration.studentPayment.applicationNo') }}: {{ row.applicationNo }}
              </span>
              <span v-if="row.orderNo">{{ row.orderNo }}</span>
              <span v-if="row.paidAt">
                {{ t('courseRegistration.studentPayment.paidAt') }}: {{ row.paidAt }}
              </span>
            </div>
          </div>
          <div class="pay-row-amount">{{ formatAmountRmb(row.amount) }}</div>
        </article>
      </div>
    </div>

    <StudentPaymentCodeModal
      :visible="codeModalVisible"
      :order="modalOrder"
      @close="onModalClose"
      @paid="onPaid"
      @expired="onExpired"
      @recreate="onRecreate"
    />
  </StudentPageShell>
</template>

<style scoped>
.pay-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pay-student-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 16px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
}
@media (max-width: 900px) {
  .pay-student-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.pay-student-label {
  display: block;
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 2px;
}
.pay-toast {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: #ecfdf5;
  color: #047857;
  font-size: 13px;
}
.pay-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
}
.pay-tab {
  border: none;
  background: transparent;
  padding: 10px 14px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.pay-tab.active {
  color: #1d4ed8;
  font-weight: 600;
  border-bottom-color: #1d4ed8;
}
.pay-tab-count {
  font-weight: 400;
  color: #9ca3af;
}
.pay-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 400px);
  gap: 16px;
  align-items: start;
}
@media (max-width: 960px) {
  .pay-layout {
    grid-template-columns: 1fr;
  }
}
.pay-list-panel,
.pay-settle,
.pay-paid-panel,
.pay-pending-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
}
.pay-pending-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pay-order-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 12px 4px;
  background: #fafafa;
}
.pay-order-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.pay-order-head-main {
  min-width: 0;
  flex: 1 1 220px;
}
.pay-order-no {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  color: #111827;
}
.pay-order-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}
.pay-order-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
  font-size: 13px;
  color: #4b5563;
  align-items: baseline;
}
.pay-order-total {
  font-weight: 700;
  color: #dc2626;
  font-size: 16px;
}
.pay-order-countdown {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #b45309;
}
.pay-order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 0 0 auto;
  align-items: center;
}
.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-sizing: border-box;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-default {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}
.btn-default:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pay-order-hint {
  margin: 0 0 8px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.45;
}
.pay-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}
.pay-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}
.pay-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 12px 4px;
  border-bottom: 1px solid #f3f4f6;
}
.pay-row-check {
  margin-top: 2px;
  height: 1.35em;
  display: inline-flex;
  align-items: center;
}
.pay-row.pending,
.pay-row.paid {
  grid-template-columns: minmax(0, 1fr) auto;
}
.pay-order-card .pay-row.pending:last-child {
  border-bottom: none;
}
.pay-row-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  font-size: 14px;
  line-height: 1.35;
  color: #111827;
}
.pay-row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}
.pay-row-amount {
  font-size: 15px;
  font-weight: 700;
  color: #dc2626;
  white-space: nowrap;
}
.pay-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
}
.pay-badge.paid {
  background: #ecfdf5;
  color: #047857;
}
.pay-settle {
  position: sticky;
  top: 12px;
  min-width: 0;
}
.pay-settle h3,
.pay-settle .label-with-tip {
  margin: 0 0 12px;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tip-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #9ca3af;
  color: #6b7280;
  font-size: 11px;
  align-items: center;
  justify-content: center;
  cursor: help;
  flex-shrink: 0;
}
.pay-settle-dl {
  margin: 0 0 12px;
}
.pay-settle-dl > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}
.pay-settle-dl dt {
  margin: 0;
  color: #6b7280;
}
.pay-settle-dl dd {
  margin: 0;
  font-weight: 600;
}
.pay-settle-dl dd.total {
  color: #dc2626;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.pay-settle-lines {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  max-height: 220px;
  overflow: auto;
  font-size: 12px;
  color: #4b5563;
}
.pay-settle-lines li {
  padding: 6px 0;
  border-bottom: 1px dashed #f3f4f6;
}
.pay-settle-line-text {
  display: block;
  white-space: nowrap;
}
.pay-submit {
  width: 100%;
}
.pay-empty {
  padding: 32px 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
</style>
