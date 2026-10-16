<script setup>
/**
 * 学生课程缴费：待缴费按申请整单勾选 / 待支付按订单分组 / 已缴费
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import StudentPaymentCodeModal from '../../../components/courseRegistration/StudentPaymentCodeModal.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import {
  formatAmountRmb,
  CREDIT_FEE_RATES,
  SST_RATE,
} from '../../../data/courseRegistration/addDropFeeRates.js'
import {
  ensureStudentCoursePaymentSeeded,
  cartUnpaidLines,
  cartUnpaidBillGroups,
  pendingPayOrderGroups,
  openPaymentOrders,
  paidPaymentLines,
  paidPaymentBillGroups,
  createPaymentOrderFromBills,
  cancelPaymentOrder,
  getPaymentOrderById,
  getOrderRemainingMs,
  expirePaymentOrderIfNeeded,
  groupPaymentLinesByBill,
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

/** 结算标题旁合并 tip：学分单价 + SST */
const settleCombinedTipText = computed(() =>
  t('courseRegistration.studentPayment.settleCombinedTip', {
    arts: CREDIT_FEE_RATES.arts,
    science: CREDIT_FEE_RATES.science,
    business: CREDIT_FEE_RATES.business,
    rate: Math.round(SST_RATE * 100),
  }),
)

/**
 * 整单左侧标题：申请单号 {no} {n} 门课（金额在右侧「合计费用」）
 * @param {{ applicationNo?: string, billKey?: string, courseCount?: number, lines?: object[] }} bill
 */
function billTitleText(bill) {
  return t('courseRegistration.studentPayment.billTitle', {
    no: bill?.applicationNo || bill?.billKey || '—',
    n: Number(bill?.courseCount) || (bill?.lines?.length ?? 0),
  })
}

/**
 * 整单右侧合计费用文案
 * @param {{ amount?: number }} bill
 */
function billTotalFeeText(bill) {
  return t('courseRegistration.studentPayment.billTotalFee', {
    amount: formatAmountRmb(bill?.amount),
  })
}

/**
 * 待支付订单内按申请整单分块（局部描述，对齐待缴费图示1）
 * @param {object[]} lines
 */
function orderBillGroups(lines) {
  return groupPaymentLinesByBill(lines || [])
}

/** @type {import('vue').Ref<'unpaid'|'pendingPay'|'paid'>} */
const activeTab = ref('unpaid')
/** 已选申请整单键 */
const selectedBillKeys = ref([])
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
  // 默认始终进入「待缴费」
  activeTab.value = 'unpaid'
  countdownTimer = setInterval(() => {
    nowTick.value = Date.now()
    expirePaymentOrderIfNeeded()
  }, 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

const allSelectableChecked = computed(() => {
  const keys = cartUnpaidBillGroups.value.map((b) => b.billKey)
  return keys.length > 0 && keys.every((k) => selectedBillKeys.value.includes(k))
})

const selectedBills = computed(() =>
  cartUnpaidBillGroups.value.filter((b) => selectedBillKeys.value.includes(b.billKey)),
)

const selectedLines = computed(() => selectedBills.value.flatMap((b) => b.lines))

const selectedFeeTotal = computed(() =>
  selectedLines.value.reduce((sum, l) => sum + (Number(l.feeAmount) || 0), 0),
)

const selectedSstTotal = computed(() =>
  selectedLines.value.reduce((sum, l) => sum + (Number(l.sstAmount) || 0), 0),
)

const selectedTotal = computed(() =>
  selectedLines.value.reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
)

watch(cartUnpaidBillGroups, (groups) => {
  const valid = new Set(groups.map((g) => g.billKey))
  selectedBillKeys.value = selectedBillKeys.value.filter((k) => valid.has(k))
})

/** @param {boolean} checked */
function toggleAll(checked) {
  selectedBillKeys.value = checked ? cartUnpaidBillGroups.value.map((b) => b.billKey) : []
}

/**
 * 整单勾选（同申请不可拆）
 * @param {string} billKey
 * @param {boolean} checked
 */
function toggleBill(billKey, checked) {
  if (!billKey) return
  if (checked) {
    if (!selectedBillKeys.value.includes(billKey)) {
      selectedBillKeys.value = [...selectedBillKeys.value, billKey]
    }
  } else {
    selectedBillKeys.value = selectedBillKeys.value.filter((k) => k !== billKey)
  }
}

function lineFeeAmount(row) {
  if (row?.feeAmount != null && row.feeAmount !== '') return Number(row.feeAmount) || 0
  return Number(row?.amount) || 0
}

function lineSstAmount(row) {
  return Number(row?.sstAmount) || 0
}

function unitRate(row) {
  const billable = Number(row.billableCredits) || 0
  const fee = lineFeeAmount(row)
  if (billable > 0) return Math.round(fee / billable)
  return CREDIT_FEE_RATES.science
}

/** 课程费一行文案：学分×单价 = 课程费 */
function feeBreakdownText(row) {
  const billable = Number(row.billableCredits) || 0
  const fee = lineFeeAmount(row)
  if (billable > 0) {
    return t('courseRegistration.studentPayment.amountBreakdown', {
      n: billable,
      rate: unitRate(row),
      amount: formatAmountRmb(fee),
    })
  }
  return formatAmountRmb(fee)
}

/**
 * 课行构成：仅课程费（SST 按勾选/整单总额计，不在逐课展示）
 * @param {object} row
 * @deprecated 保留别名，等价 feeBreakdownText；勿再拼逐课 SST
 */
function amountBreakdown(row) {
  return feeBreakdownText(row)
}

/** 订单展示应付：优先行合计（含税），回退快照 */
function orderPayableTotal(order, lines) {
  if (lines?.length) {
    return lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
  }
  return Number(order?.total) || 0
}

/**
 * 订单课程费合计（不含 SST）
 * @param {object} order
 * @param {object[]} lines
 */
function orderCourseFeeTotal(order, lines) {
  if (order?.feeTotal != null && order.feeTotal !== '') {
    const n = Number(order.feeTotal)
    if (Number.isFinite(n)) return n
  }
  return (lines || []).reduce((s, l) => s + lineFeeAmount(l), 0)
}

/**
 * 订单 SST 合计
 * @param {object} order
 * @param {object[]} lines
 */
function orderSstTotal(order, lines) {
  if (order?.sstTotal != null && order.sstTotal !== '') {
    const n = Number(order.sstTotal)
    if (Number.isFinite(n)) return n
  }
  return (lines || []).reduce((s, l) => s + lineSstAmount(l), 0)
}

/**
 * 待支付订单总结行：课程费 + SST + 应付（仅订单级，不含申请块）
 * @param {object} order
 * @param {object[]} lines
 */
function orderFeeSummaryText(order, lines) {
  return t('courseRegistration.studentPayment.pendingOrderFeeSummary', {
    fee: formatAmountRmb(orderCourseFeeTotal(order, lines)),
    sst: formatAmountRmb(orderSstTotal(order, lines)),
    payable: formatAmountRmb(orderPayableTotal(order, lines)),
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
  const result = createPaymentOrderFromBills(selectedBillKeys.value)
  if (!result.ok) {
    pageMessage.value = t('courseRegistration.studentPayment.errEmptySelect')
    return
  }
  selectedBillKeys.value = []
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
  selectedBillKeys.value = []
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
          <span class="pay-tab-count">({{ cartUnpaidBillGroups.length }})</span>
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
          <span class="pay-tab-count">({{ paidPaymentBillGroups.length }})</span>
        </button>
      </div>

      <!-- 待缴费：按申请整单勾选 + 结算 -->
      <div v-if="activeTab === 'unpaid'" class="pay-layout">
        <section class="pay-list-panel">
          <div class="pay-list-toolbar">
            <label class="pay-check">
              <input
                type="checkbox"
                :checked="allSelectableChecked"
                :disabled="!cartUnpaidBillGroups.length"
                @change="toggleAll($event.target.checked)"
              />
              <span>{{ t('courseRegistration.studentPayment.selectAll') }}</span>
            </label>
          </div>

          <div v-if="!cartUnpaidBillGroups.length" class="pay-empty">
            {{ t('courseRegistration.studentPayment.emptyUnpaid') }}
          </div>

          <article
            v-for="bill in cartUnpaidBillGroups"
            :key="bill.billKey"
            class="pay-bill-card"
            :class="{ selected: selectedBillKeys.includes(bill.billKey) }"
          >
            <header class="pay-bill-head">
              <label class="pay-check pay-bill-check">
                <input
                  type="checkbox"
                  :checked="selectedBillKeys.includes(bill.billKey)"
                  @change="toggleBill(bill.billKey, $event.target.checked)"
                />
              </label>
              <div class="pay-bill-head-main pay-bill-head-inline">
                <strong class="pay-bill-title">{{ billTitleText(bill) }}</strong>
                <span v-if="bill.paymentDueAt" class="pay-bill-due">
                  {{ t('courseRegistration.studentPayment.dueAt') }}: {{ bill.paymentDueAt }}
                </span>
                <span class="pay-bill-total">{{ billTotalFeeText(bill) }}</span>
              </div>
            </header>
            <div class="pay-bill-lines">
              <div v-for="row in bill.lines" :key="row.id" class="pay-bill-line">
                <div class="pay-row-main">
                  <div class="pay-row-title">
                    <strong>{{ row.courseCode }}</strong>
                    <span>{{ row.courseName }}</span>
                  </div>
                  <div class="pay-row-meta">
                    <span>{{ amountBreakdown(row) }}</span>
                  </div>
                </div>
                <div class="pay-row-amount">{{ formatAmountRmb(lineFeeAmount(row)) }}</div>
              </div>
            </div>
          </article>
        </section>

        <aside class="pay-settle">
          <h3 class="label-with-tip">
            <span>{{ t('courseRegistration.studentPayment.settleTitle') }}</span>
            <span
              class="tip-icon"
              :title="settleCombinedTipText"
              :aria-label="settleCombinedTipText"
              tabindex="0"
            >?</span>
          </h3>
          <!-- 订单明细在上；多选往上累加 -->
          <ul v-if="selectedBills.length" class="pay-settle-lines">
            <li v-for="bill in selectedBills" :key="bill.billKey" class="pay-settle-bill">
              <div class="pay-settle-line-head">
                <strong>{{ billTitleText(bill) }}</strong>
                <span class="pay-settle-line-pay">{{ billTotalFeeText(bill) }}</span>
              </div>
              <ul class="pay-settle-bill-courses">
                <li v-for="line in bill.lines" :key="line.id">
                  <span>{{ line.courseCode }}</span>
                  <span>{{ formatAmountRmb(lineFeeAmount(line)) }}</span>
                </li>
              </ul>
            </li>
          </ul>
          <!-- 汇总钉在结算按钮上方 -->
          <dl class="pay-settle-dl">
            <div>
              <dt>{{ t('courseRegistration.studentPayment.selectedBillCount') }}</dt>
              <dd>{{ selectedBills.length }}</dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.studentPayment.selectedCount') }}</dt>
              <dd>{{ selectedLines.length }}</dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.studentPayment.selectedFeeTotal') }}</dt>
              <dd>{{ formatAmountRmb(selectedFeeTotal) }}</dd>
            </div>
            <div v-if="selectedSstTotal > 0">
              <dt>{{ t('courseRegistration.studentPayment.selectedSstTotal') }}</dt>
              <dd>{{ formatAmountRmb(selectedSstTotal) }}</dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.studentPayment.selectedTotal') }}</dt>
              <dd class="total">{{ formatAmountRmb(selectedTotal) }}</dd>
            </div>
          </dl>
          <button
            type="button"
            class="btn btn-primary pay-submit"
            :disabled="!selectedBills.length"
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
            <div class="pay-order-top">
              <div class="pay-order-no">
                <span class="pay-order-label">{{ t('courseRegistration.studentPayment.orderNo') }}</span>
                <strong>{{ group.order.orderNo }}</strong>
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
            </div>
            <!-- 与下方申请/课行金额列同右缘对齐；含 SST 说明 -->
            <div class="pay-order-meta-row">
              <span class="pay-order-course-count">
                {{ t('courseRegistration.studentPayment.courseCount') }}:
                {{ group.order.courseCount }}
              </span>
              <span v-if="formatCountdown(group.order)" class="pay-order-deadline-inline">
                {{
                  t('courseRegistration.studentPayment.pendingPayDeadlineLine', {
                    minutes: Math.round(PAYMENT_ORDER_TTL_MS / 60000),
                    time: formatCountdown(group.order),
                  })
                }}
              </span>
              <span class="pay-order-total">{{
                orderFeeSummaryText(group.order, group.lines)
              }}</span>
            </div>
          </header>
          <!-- 按申请整单分块：各申请含哪些课、各自合计 -->
          <div
            v-for="bill in orderBillGroups(group.lines)"
            :key="`${group.order.id}-${bill.billKey}`"
            class="pay-order-bill"
          >
            <div class="pay-order-bill-head">
              <strong class="pay-bill-title">{{ billTitleText(bill) }}</strong>
              <span class="pay-bill-total">{{ billTotalFeeText(bill) }}</span>
            </div>
            <div
              v-for="row in bill.lines"
              :key="row.id"
              class="pay-bill-line"
            >
              <div class="pay-row-main">
                <div class="pay-row-title">
                  <strong>{{ row.courseCode }}</strong>
                  <span>{{ row.courseName }}</span>
                </div>
                <div class="pay-row-meta">
                  <span>{{ amountBreakdown(row) }}</span>
                </div>
              </div>
              <div class="pay-row-amount">{{ formatAmountRmb(lineFeeAmount(row)) }}</div>
            </div>
          </div>
        </section>
      </div>

      <!-- 已缴费：按申请整单展示明细 -->
      <div v-else class="pay-paid-panel">
        <div v-if="!paidPaymentBillGroups.length" class="pay-empty">
          {{ t('courseRegistration.studentPayment.emptyPaid') }}
        </div>
        <article
          v-for="bill in paidPaymentBillGroups"
          :key="bill.billKey"
          class="pay-bill-card paid"
        >
          <header class="pay-bill-head paid-head">
            <div class="pay-bill-head-main">
              <div class="pay-bill-title-row">
                <strong class="pay-bill-title">
                  {{ billTitleText(bill) }}
                  <span class="pay-badge paid">{{ t('courseRegistration.studentPayment.paidBadge') }}</span>
                </strong>
                <span class="pay-bill-total">{{ billTotalFeeText(bill) }}</span>
              </div>
              <div class="pay-bill-meta">
                <span v-if="bill.lines[0]?.orderNo">{{ bill.lines[0].orderNo }}</span>
                <span v-if="bill.lines[0]?.paidAt">
                  {{ t('courseRegistration.studentPayment.paidAt') }}: {{ bill.lines[0].paidAt }}
                </span>
              </div>
            </div>
          </header>
          <div class="pay-bill-lines">
            <div v-for="row in bill.lines" :key="row.id" class="pay-bill-line">
              <div class="pay-row-main">
                <div class="pay-row-title">
                  <strong>{{ row.courseCode }}</strong>
                  <span>{{ row.courseName }}</span>
                </div>
              </div>
              <div class="pay-row-amount">{{ formatAmountRmb(lineFeeAmount(row)) }}</div>
            </div>
          </div>
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
  flex-direction: column;
  gap: 10px;
  margin-bottom: 6px;
}
.pay-order-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
}
.pay-order-no {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  color: #111827;
  min-width: 0;
}
.pay-order-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}
/* 与 pay-order-bill 同左右内边距，保证合计与课列右对齐 */
.pay-order-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 14px;
  margin: 0 4px;
  padding: 0 10px;
  font-size: 13px;
  color: #4b5563;
}
.pay-order-course-count {
  flex: 0 0 auto;
  white-space: nowrap;
}
.pay-order-deadline-inline {
  flex: 1 1 180px;
  min-width: 0;
  color: #b45309;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.45;
}
.pay-order-total {
  font-weight: 700;
  color: #dc2626;
  font-size: 12px;
  text-align: right;
  margin-left: auto;
  flex: 0 0 auto;
  white-space: nowrap;
  line-height: 1.4;
}
.pay-order-bill {
  margin: 10px 4px 4px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.pay-order-bill-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 12px;
  margin-bottom: 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
}
.pay-order-bill .pay-bill-line:last-child {
  border-bottom: none;
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
/* 待支付关窗长提示已移除；倒计时与「请在 N 分钟内」合并为 pay-order-deadline-line */
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
.pay-bill-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 12px;
  background: #fafafa;
  overflow: hidden;
}
.pay-bill-card.selected {
  border-color: #93c5fd;
  background: #f8fbff;
}
.pay-bill-card.paid {
  background: #fff;
}
.pay-bill-head {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #eef2f7;
}
.pay-bill-head.paid-head {
  grid-template-columns: minmax(0, 1fr);
}
.pay-bill-check {
  display: inline-flex;
  align-items: center;
  margin: 0;
}
.pay-bill-head-main {
  min-width: 0;
}
.pay-bill-head-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
}
.pay-bill-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
}
.pay-bill-title {
  font-size: 14px;
  color: #111827;
  min-width: 0;
  flex: 0 1 auto;
}
.pay-bill-due {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
  white-space: nowrap;
}
.pay-bill-total {
  font-size: 15px;
  font-weight: 700;
  color: #dc2626;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
}
.pay-bill-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}
.pay-bill-lines {
  padding: 4px 12px 8px;
  background: #fff;
}
.pay-bill-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}
.pay-bill-line:last-child {
  border-bottom: none;
}
.pay-settle-bill {
  margin-bottom: 8px;
}
.pay-settle-bill-courses {
  list-style: none;
  margin: 4px 0 0;
  padding: 0 0 0 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #6b7280;
}
.pay-settle-bill-courses li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
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
  gap: 6px 10px;
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.45;
  color: #6b7280;
}
.pay-row-meta > span {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
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
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
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
  max-height: 280px;
  overflow-x: hidden;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.45;
  color: #4b5563;
  flex: 1 1 auto;
  min-height: 0;
}
.pay-settle-lines li {
  padding: 8px 0;
  border-bottom: 1px dashed #f3f4f6;
  min-width: 0;
}
.pay-settle-line-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #111827;
}
.pay-settle-line-head strong {
  font-weight: 600;
  overflow-wrap: anywhere;
  min-width: 0;
}
.pay-settle-line-pay {
  flex-shrink: 0;
  font-weight: 700;
  color: #dc2626;
  font-variant-numeric: tabular-nums;
}
.pay-settle-line-fee,
.pay-settle-line-sst {
  margin-top: 2px;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: #6b7280;
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
