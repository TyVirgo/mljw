<script setup>
/**
 * 模拟财务缴费码弹窗：倒计时 / 查询中 / 成功 / 过期重下单
 * 关闭不取消订单；到期由 store 自动作废
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatAmountRmb } from '../../data/courseRegistration/addDropFeeRates.js'
import {
  confirmMockPayment,
  expirePaymentOrderIfNeeded,
  getOrderRemainingMs,
  getPaymentOrderById,
  PAYMENT_ORDER_TTL_MS,
} from '../../data/courseRegistration/studentCoursePaymentStore.js'

const CHECK_DELAY_MS = 1200

const props = defineProps({
  visible: { type: Boolean, default: false },
  order: { type: Object, default: null },
})

const emit = defineEmits(['close', 'paid', 'expired', 'recreate'])

const { t } = useAppI18n()
const remainingMs = ref(0)
/** @type {import('vue').Ref<'code'|'checking'|'success'>} */
const phase = ref('code')
const paidOrderSnapshot = ref(null)
let timer = null
let checkTimer = null

/** 以 store 中的最新订单为准 */
const liveOrder = computed(() => {
  const id = props.order?.id
  if (!id) return props.order
  return getPaymentOrderById(id) || props.order
})

const isOpen = computed(() => liveOrder.value?.status === 'open')
const isExpired = computed(
  () => liveOrder.value?.status === 'expired' || (isOpen.value && remainingMs.value <= 0),
)

const mmss = computed(() => {
  const ms = Math.max(0, remainingMs.value)
  const totalSec = Math.floor(ms / 1000)
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
})

const urgent = computed(() => remainingMs.value > 0 && remainingMs.value <= 2 * 60 * 1000)

const canDismiss = computed(() => phase.value !== 'checking')

function tick() {
  const order = liveOrder.value
  if (!order || order.status !== 'open' || phase.value !== 'code') {
    return
  }
  remainingMs.value = getOrderRemainingMs(order)
  if (remainingMs.value <= 0) {
    const changed = expirePaymentOrderIfNeeded(order.id)
    if (changed) emit('expired')
  }
}

function startTimer() {
  stopTimer()
  tick()
  timer = setInterval(tick, 250)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function clearCheckTimer() {
  if (checkTimer) {
    clearTimeout(checkTimer)
    checkTimer = null
  }
}

function resetPhase() {
  clearCheckTimer()
  phase.value = 'code'
  paidOrderSnapshot.value = null
}

/** 仅跟开关窗：避免订单列表每秒重写触发 watch 干扰查询态 */
watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      stopTimer()
      resetPhase()
      return
    }
    if (phase.value === 'code' && liveOrder.value) startTimer()
  },
  { immediate: true },
)

watch(
  () => props.order?.id,
  () => {
    if (props.visible && phase.value === 'code' && liveOrder.value) startTimer()
  },
)

onMounted(() => {
  if (props.visible && liveOrder.value && phase.value === 'code') startTimer()
})
onBeforeUnmount(() => {
  stopTimer()
  clearCheckTimer()
})

/**
 * 演示：固定转圈 1.2s 后展示成功；落账失败也不阻断成功提示
 */
function onConfirmPaid() {
  if (phase.value !== 'code') return
  const snap = liveOrder.value
  if (!snap?.id || snap.status !== 'open') return

  stopTimer()
  phase.value = 'checking'
  clearCheckTimer()

  const orderId = snap.id
  const snapshot = {
    id: snap.id,
    orderNo: snap.orderNo,
    total: snap.total,
    courseCount: snap.courseCount,
    paymentCode: snap.paymentCode,
    lineIds: Array.isArray(snap.lineIds) ? [...snap.lineIds] : [],
  }

  checkTimer = window.setTimeout(() => {
    checkTimer = null
    if (phase.value !== 'checking') return

    let paid = null
    try {
      const result = confirmMockPayment(orderId)
      if (result?.ok) paid = result.order
    } catch {
      /* 演示容错：落账异常仍展示成功 */
    }

    paidOrderSnapshot.value = paid || {
      ...snapshot,
      status: 'paid',
      paidAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    phase.value = 'success'
  }, CHECK_DELAY_MS)
}

function onSuccessOk() {
  const order = paidOrderSnapshot.value
  emit('paid', order)
  emit('close')
  resetPhase()
}

function onCloseOnly() {
  if (!canDismiss.value) return
  emit('close')
}
</script>

<template>
  <div
    v-if="visible"
    class="pay-modal-mask"
    @click.self="canDismiss && onCloseOnly()"
  >
    <div class="pay-modal" role="dialog" aria-modal="true">
      <header class="pay-modal-head">
        <h3>
          {{
            phase === 'success'
              ? t('courseRegistration.studentPayment.paySuccessTitle')
              : phase === 'checking'
                ? t('courseRegistration.studentPayment.payCheckingTitle')
                : t('courseRegistration.studentPayment.codeTitle')
          }}
        </h3>
        <button
          type="button"
          class="pay-modal-x"
          :disabled="!canDismiss"
          @click="onCloseOnly"
        >
          ×
        </button>
      </header>

      <div v-if="liveOrder || phase === 'success'" class="pay-modal-body">
        <!-- 查询中 -->
        <div v-if="phase === 'checking'" class="pay-phase-checking">
          <div class="pay-spinner" aria-hidden="true" />
          <p class="pay-phase-text">{{ t('courseRegistration.studentPayment.payCheckingHint') }}</p>
        </div>

        <!-- 成功 -->
        <div v-else-if="phase === 'success'" class="pay-phase-success">
          <div class="pay-success-icon" aria-hidden="true">✓</div>
          <p class="pay-phase-title">{{ t('courseRegistration.studentPayment.paySuccessTitle') }}</p>
          <p class="pay-phase-text">{{ t('courseRegistration.studentPayment.paySuccessHint') }}</p>
          <dl v-if="paidOrderSnapshot" class="pay-meta">
            <div>
              <dt>{{ t('courseRegistration.studentPayment.orderNo') }}</dt>
              <dd>{{ paidOrderSnapshot.orderNo }}</dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.studentPayment.payAmount') }}</dt>
              <dd class="amount">{{ formatAmountRmb(paidOrderSnapshot.total) }}</dd>
            </div>
          </dl>
          <div class="pay-actions">
            <button type="button" class="btn btn-primary" @click="onSuccessOk">
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>

        <!-- 缴费码 -->
        <template v-else-if="liveOrder">
          <div class="pay-qr-block" :class="{ expired: isExpired }">
            <div class="pay-qr-fake" aria-hidden="true">
              <span class="pay-qr-grid" />
            </div>
            <p class="pay-code-text">{{ liveOrder.paymentCode }}</p>
          </div>

          <dl class="pay-meta">
            <div>
              <dt>{{ t('courseRegistration.studentPayment.orderNo') }}</dt>
              <dd>{{ liveOrder.orderNo }}</dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.studentPayment.payAmount') }}</dt>
              <dd class="amount">{{ formatAmountRmb(liveOrder.total) }}</dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.studentPayment.courseCount') }}</dt>
              <dd>{{ liveOrder.courseCount }}</dd>
            </div>
            <div v-if="isOpen && !isExpired">
              <dt>{{ t('courseRegistration.studentPayment.countdown') }}</dt>
              <dd :class="['countdown', { urgent }]">{{ mmss }}</dd>
            </div>
          </dl>

          <p v-if="isOpen && !isExpired" class="pay-hint">
            {{
              t('courseRegistration.studentPayment.codeHint', {
                minutes: Math.round(PAYMENT_ORDER_TTL_MS / 60000),
              })
            }}
          </p>
          <p v-else class="pay-hint expired-hint">
            {{ t('courseRegistration.studentPayment.codeExpiredHint') }}
          </p>

          <div class="pay-actions">
            <template v-if="isOpen && !isExpired">
              <button type="button" class="btn btn-primary" @click="onConfirmPaid">
                {{ t('courseRegistration.studentPayment.confirmPaid') }}
              </button>
              <button type="button" class="btn btn-default" @click="onCloseOnly">
                {{ t('common.close') }}
              </button>
            </template>
            <template v-else>
              <button type="button" class="btn btn-primary" @click="emit('recreate')">
                {{ t('courseRegistration.studentPayment.recreateOrder') }}
              </button>
              <button type="button" class="btn btn-default" @click="onCloseOnly">
                {{ t('common.close') }}
              </button>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pay-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
.pay-modal {
  width: min(480px, 100%);
  max-height: min(90vh, 720px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.pay-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.pay-modal-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: #111827;
}
.pay-modal-x {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}
.pay-modal-x:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pay-modal-body {
  padding: 20px 18px 18px;
  box-sizing: border-box;
}
.pay-qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.pay-qr-block.expired {
  opacity: 0.45;
  filter: grayscale(1);
}
.pay-qr-fake {
  width: min(160px, 42vw);
  height: min(160px, 42vw);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  display: grid;
  place-items: center;
}
.pay-qr-grid {
  display: block;
  width: 75%;
  height: 75%;
  background:
    repeating-linear-gradient(0deg, #111827 0 4px, transparent 4px 8px),
    repeating-linear-gradient(90deg, #111827 0 4px, transparent 4px 8px);
  opacity: 0.85;
}
.pay-code-text {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  word-break: break-all;
  text-align: center;
}
.pay-meta {
  margin: 0 0 12px;
  display: grid;
  gap: 10px;
}
.pay-meta > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
  min-height: 1.5em;
}
.pay-meta dt {
  margin: 0;
  color: #6b7280;
  flex-shrink: 0;
}
.pay-meta dd {
  margin: 0;
  color: #111827;
  font-weight: 500;
  text-align: right;
  line-height: 1.5;
  padding-block: 2px;
}
.pay-meta dd.amount,
.pay-meta dd.countdown {
  color: #dc2626;
  font-weight: 700;
  font-size: 15px;
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
}
.pay-meta dd.countdown.urgent {
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% {
    opacity: 0.4;
  }
}
.pay-hint {
  margin: 0 0 16px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.55;
}
.expired-hint {
  color: #b45309;
}
.pay-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: stretch;
  gap: 12px;
}
.pay-actions .btn {
  flex: 1 1 140px;
  min-width: 0;
  white-space: normal;
  line-height: 1.35;
  padding-top: 10px;
  padding-bottom: 10px;
}
.pay-phase-checking,
.pay-phase-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 8px 8px;
  gap: 12px;
  min-height: 200px;
  justify-content: center;
}
.pay-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1d4ed8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.pay-success-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #047857;
  font-size: 24px;
  font-weight: 700;
  line-height: 48px;
}
.pay-phase-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: #111827;
}
.pay-phase-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
}
.pay-phase-success .pay-meta {
  width: 100%;
  margin-top: 8px;
  text-align: left;
}
.pay-phase-success .pay-actions {
  width: 100%;
  margin-top: 8px;
}
</style>
