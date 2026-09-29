/**
 * 学生端课程缴费：购物车行 + 模拟财务订单（缴费码倒计时）
 */
import { computed, ref, watch } from 'vue'
import { DEFAULT_MOCK_CURRENT_STUDENT_ID } from '../mockCurrentStudent.js'
import { getStudentProfileFields } from './studentRegistrationStore.js'
import { addDropApprovalQueue } from './addDropApprovalQueue.js'
import { upsertFeeRosterFromPaymentLines } from './feeRosterQueue.js'

export const PAYMENT_ORDER_TTL_MS = 15 * 60 * 1000
const STORAGE_KEY = 'crs-student-course-payment-v2'

/** @typedef {'addDrop'|'retakeDrop'|'overCredit'|'retake'} PaymentSourceType */
/** @typedef {'unpaid'|'locked'|'paid'} PaymentLineStatus */
/** @typedef {'open'|'paid'|'cancelled'|'expired'} PaymentOrderStatus */

function nowIsoMinute() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function genOrderNo() {
  const d = new Date()
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '-',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
    String(d.getMilliseconds()).padStart(3, '0'),
  ].join('')
  return `PAY${stamp}`
}

function buildDemoSeedLines(studentId) {
  const profile = getStudentProfileFields()
  const sid = studentId || profile.studentId || DEFAULT_MOCK_CURRENT_STUDENT_ID
  const base = {
    studentId: sid,
    studentName: profile.studentName || 'Demo Student',
    programme: profile.programme || 'COS',
    academicSession: '2026/04',
  }
  return [
    {
      ...base,
      id: 'pay-demo-u1',
      courseCode: 'MATH201',
      courseName: 'Linear Algebra',
      credits: 4,
      billableCredits: 2,
      amount: 1100,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-01',
      applicationNo: 'ADR2509010',
      paymentDueAt: '2026-08-20 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u2',
      courseCode: 'COMP201',
      courseName: 'Data Structures',
      credits: 4,
      billableCredits: 1,
      amount: 550,
      sectionName: '分组名称02',
      sourceType: 'retakeDrop',
      sourceRef: 'adr-xmum-retakedrop-02',
      applicationNo: 'ADR2509030',
      paymentDueAt: '2026-08-18 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u3',
      courseCode: 'ENGL201',
      courseName: 'Academic Writing',
      credits: 3,
      billableCredits: 3,
      amount: 1650,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-15',
      applicationNo: 'ADR2509018',
      paymentDueAt: '2026-08-25 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u4',
      courseCode: 'STAT201',
      courseName: 'Statistics',
      credits: 3,
      billableCredits: 2,
      amount: 1100,
      sectionName: '分组名称02',
      sourceType: 'retake',
      sourceRef: 'adr-xmum-24',
      applicationNo: 'ADR2509031',
      paymentDueAt: '2026-08-22 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u5',
      courseCode: 'PHYS101',
      courseName: 'Physics I',
      credits: 4,
      billableCredits: 4,
      amount: 2200,
      sectionName: '分组名称01',
      sourceType: 'retake',
      sourceRef: 'adr-xmum-23',
      applicationNo: 'ADR2509029',
      paymentDueAt: '2026-08-28 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u6',
      courseCode: 'HUM110',
      courseName: 'Introduction to Humanities',
      credits: 3,
      billableCredits: 1,
      amount: 500,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-09',
      applicationNo: 'ADR2509016',
      paymentDueAt: '2026-08-15 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-p1',
      courseCode: 'BUS201',
      courseName: 'Business Fundamentals',
      credits: 3,
      billableCredits: 3,
      amount: 1800,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-paid-demo-2',
      applicationNo: 'ADR2509009',
      paymentDueAt: '',
      status: 'paid',
      paidAt: '2026-07-12 14:30',
      orderNo: 'PAY20260712-1430',
    },
    {
      ...base,
      id: 'pay-demo-p2',
      courseCode: 'SCI110',
      courseName: 'Scientific Reasoning',
      credits: 3,
      billableCredits: 2,
      amount: 1100,
      sectionName: '分组名称02',
      sourceType: 'addDrop',
      sourceRef: 'adr-paid-demo',
      applicationNo: 'ADR2509008',
      paymentDueAt: '',
      status: 'paid',
      paidAt: '2026-07-18 09:15',
      orderNo: 'PAY20260718-0915',
    },
  ]
}

/** @type {import('vue').Ref<object[]>} */
export const paymentLines = ref([])

/** 全部订单（含 open / paid / expired / cancelled） */
/** @type {import('vue').Ref<object[]>} */
export const paymentOrders = ref([])

/** @deprecated 取最近一笔 open；多订单请用 paymentOrders / getPaymentOrderById */
export const activeOrder = computed(() => {
  const opens = paymentOrders.value.filter((o) => o.status === 'open')
  if (opens.length) {
    return opens.slice().sort((a, b) => Number(b.createdAt) - Number(a.createdAt))[0]
  }
  return paymentOrders.value[0] || null
})

let hydrated = false

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lines: paymentLines.value,
        paymentOrders: paymentOrders.value,
        // 兼容旧字段
        activeOrder: activeOrder.value,
      }),
    )
  } catch {
    /* ignore */
  }
}

/** 从持久化恢复订单列表（兼容旧单例 activeOrder） */
function restoreOrdersFromSaved(saved) {
  if (Array.isArray(saved?.paymentOrders) && saved.paymentOrders.length) {
    return saved.paymentOrders.map((o) => ({ ...o }))
  }
  if (saved?.activeOrder) {
    return [{ ...saved.activeOrder }]
  }
  return []
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function collectLiveUnpaidLines(studentId) {
  const lines = []
  for (const app of addDropApprovalQueue.value || []) {
    if (app.studentId !== studentId) continue
    if (app.status !== 'Approved') continue
    if (app.billStatus !== 'pending') continue
    const bill = Number(app.billAmount) || 0
    if (bill <= 0) continue
    const feeItems = (app.items || []).filter((it) => Number(it.fee) > 0)
    const items =
      feeItems.length > 0
        ? feeItems
        : [
            (app.items || []).find((i) => ['Add', 'Retake'].includes(i.action)) ||
              (app.items || [])[0],
          ].filter(Boolean)
    const sourceType =
      app.type === 'RetakeDrop' ? 'retakeDrop' : app.type === 'Retake' ? 'retake' : 'addDrop'
    if (feeItems.length) {
      for (const item of feeItems) {
        lines.push({
          id: `pay-live-${app.id}-${item.courseCode}`,
          studentId,
          courseCode: item.courseCode,
          courseName: item.courseCode,
          credits: item.credits || 0,
          billableCredits: item.credits || 0,
          amount: Number(item.fee) || 0,
          sectionName: item.sectionName || item.section || '01',
          sourceType,
          sourceRef: app.id,
          applicationNo: app.applicationNo || '',
          paymentDueAt: app.paymentDueAt || '',
          status: 'unpaid',
          paidAt: '',
          orderNo: '',
          academicSession: app.academicSession || '',
        })
      }
    } else if (items[0]) {
      const item = items[0]
      lines.push({
        id: `pay-live-${app.id}-${item.courseCode}`,
        studentId,
        courseCode: item.courseCode,
        courseName: item.courseCode,
        credits: item.credits || 0,
        billableCredits: Number(app.excessCredits) || item.credits || 0,
        amount: bill,
        sectionName: item.sectionName || item.section || '01',
        sourceType,
        sourceRef: app.id,
        applicationNo: app.applicationNo || '',
        paymentDueAt: app.paymentDueAt || '',
        status: 'unpaid',
        paidAt: '',
        orderNo: '',
        academicSession: app.academicSession || '',
      })
    }
  }
  return lines
}

function mergeLines(seed, live, persistedPaidIds) {
  const byKey = new Map()
  for (const line of seed) {
    byKey.set(line.id, { ...line })
  }
  for (const line of live) {
    if (byKey.has(line.id)) continue
    const dup = [...byKey.values()].some(
      (x) =>
        x.courseCode === line.courseCode &&
        x.sourceRef === line.sourceRef &&
        x.status !== 'paid',
    )
    if (dup) continue
    byKey.set(line.id, { ...line })
  }
  if (persistedPaidIds?.size) {
    for (const line of byKey.values()) {
      if (persistedPaidIds.has(line.id) && line.status !== 'paid') {
        line.status = 'paid'
      }
    }
  }
  return [...byKey.values()]
}

/**
 * 首次/进入页时灌种：保证待缴≥5、已缴≥2；合并 live 来源；恢复 localStorage 订单
 */
export function ensureStudentCoursePaymentSeeded() {
  if (hydrated) {
    expirePaymentOrderIfNeeded()
    return
  }
  const studentId = getStudentProfileFields().studentId || DEFAULT_MOCK_CURRENT_STUDENT_ID
  const saved = loadPersisted()
  const seed = buildDemoSeedLines(studentId)
  const live = collectLiveUnpaidLines(studentId)

  if (saved?.lines?.length) {
    const paidIds = new Set(
      saved.lines.filter((l) => l.status === 'paid').map((l) => l.id),
    )
    // 保留用户已付状态与订单绑定字段
    const restored = saved.lines.map((l) => ({ ...l }))
    const restoredIds = new Set(restored.map((l) => l.id))
    for (const s of seed) {
      if (!restoredIds.has(s.id)) restored.push({ ...s })
    }
    for (const l of live) {
      if (!restoredIds.has(l.id) && !restored.some((x) => x.id === l.id)) {
        restored.push({ ...l })
      }
    }
    // 若待缴不足 5，用 seed 未付补齐
    let unpaid = restored.filter((l) => l.status === 'unpaid')
    if (unpaid.length < 5) {
      for (const s of seed.filter((x) => x.status === 'unpaid')) {
        if (restored.some((x) => x.id === s.id)) continue
        restored.push({ ...s })
        unpaid = restored.filter((l) => l.status === 'unpaid')
        if (unpaid.length >= 5) break
      }
    }
    paymentLines.value = restored
    paymentOrders.value = restoreOrdersFromSaved(saved)
  } else {
    paymentLines.value = mergeLines(seed, live, null)
    paymentOrders.value = []
  }

  expirePaymentOrderIfNeeded()
  reapplyOrderLocks()
  hydrated = true
  try {
    upsertFeeRosterFromPaymentLines(paymentLines.value)
  } catch {
    /* ignore */
  }
  persist()
}

function reapplyOrderLocks() {
  const lockedIds = new Set()
  for (const order of paymentOrders.value) {
    if (order.status !== 'open') continue
    for (const id of order.lineIds || []) lockedIds.add(id)
  }
  paymentLines.value = paymentLines.value.map((line) => {
    if (line.status === 'paid') return line
    if (lockedIds.has(line.id)) return { ...line, status: 'locked' }
    if (line.status === 'locked') return { ...line, status: 'unpaid' }
    return line
  })
}

/**
 * 过期所有到期的 open 订单；可传入 orderId 只检查该单。
 * @param {string} [orderId]
 */
export function expirePaymentOrderIfNeeded(orderId) {
  const now = Date.now()
  let changed = false
  const next = paymentOrders.value.map((order) => {
    if (order.status !== 'open') return order
    if (orderId && order.id !== orderId) return order
    if (now < Number(order.expiresAt)) return order
    changed = true
    return { ...order, status: 'expired' }
  })
  if (!changed) return false
  paymentOrders.value = next
  reapplyOrderLocks()
  persist()
  return true
}

export const cartUnpaidLines = computed(() => {
  expirePaymentOrderIfNeeded()
  return paymentLines.value.filter((l) => l.status === 'unpaid')
})

/** 已下单、订单锁定中的行 */
export const pendingPayLines = computed(() => {
  expirePaymentOrderIfNeeded()
  return paymentLines.value.filter((l) => l.status === 'locked')
})

/** 进行中的 open 订单（新→旧） */
export const openPaymentOrders = computed(() => {
  expirePaymentOrderIfNeeded()
  return paymentOrders.value
    .filter((o) => o.status === 'open')
    .slice()
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
})

/**
 * 待支付分组：订单 + 对应课程行
 * @returns {{ order: object, lines: object[] }[]}
 */
export const pendingPayOrderGroups = computed(() => {
  const lineById = new Map(paymentLines.value.map((l) => [l.id, l]))
  return openPaymentOrders.value.map((order) => ({
    order,
    lines: (order.lineIds || []).map((id) => lineById.get(id)).filter(Boolean),
  }))
})

/** @deprecated 使用 cartUnpaidLines / pendingPayLines */
export const unpaidPaymentLines = cartUnpaidLines

export const paidPaymentLines = computed(() =>
  paymentLines.value
    .filter((l) => l.status === 'paid')
    .slice()
    .sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt))),
)

export function getPaymentOrderById(orderId) {
  if (!orderId) return null
  return paymentOrders.value.find((o) => o.id === orderId) || null
}

/** @param {string} [orderId] 不传则返回最近一笔 open */
export function getOpenPaymentOrder(orderId) {
  expirePaymentOrderIfNeeded(orderId)
  if (orderId) {
    const order = getPaymentOrderById(orderId)
    return order?.status === 'open' ? order : null
  }
  return openPaymentOrders.value[0] || null
}

export function getOrderRemainingMs(order = getOpenPaymentOrder()) {
  if (!order || order.status !== 'open') return 0
  return Math.max(0, Number(order.expiresAt) - Date.now())
}

/**
 * @param {string[]} lineIds
 */
export function createPaymentOrder(lineIds) {
  expirePaymentOrderIfNeeded()
  const ids = [...new Set(lineIds || [])]
  const selected = paymentLines.value.filter(
    (l) => ids.includes(l.id) && l.status === 'unpaid' && Number(l.amount) > 0,
  )
  if (!selected.length) return { ok: false, reason: 'empty' }

  const createdAt = Date.now()
  const order = {
    id: `order-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    orderNo: genOrderNo(),
    lineIds: selected.map((l) => l.id),
    total: selected.reduce((s, l) => s + (Number(l.amount) || 0), 0),
    courseCount: selected.length,
    createdAt,
    expiresAt: createdAt + PAYMENT_ORDER_TTL_MS,
    status: 'open',
    paymentCode: `XMUM-FEE-${String(createdAt).slice(-8)}`,
  }
  paymentOrders.value = [order, ...paymentOrders.value]
  reapplyOrderLocks()
  persist()
  return { ok: true, order }
}

/** @param {string} [orderId] */
export function cancelPaymentOrder(orderId) {
  const targetId = orderId || getOpenPaymentOrder()?.id
  if (!targetId) return { ok: false }
  const order = getPaymentOrderById(targetId)
  if (!order || order.status !== 'open') return { ok: false }
  paymentOrders.value = paymentOrders.value.map((o) =>
    o.id === targetId ? { ...o, status: 'cancelled' } : o,
  )
  reapplyOrderLocks()
  persist()
  return { ok: true }
}

function writeBackPaid(lines) {
  for (const line of lines) {
    try {
      if (line.sourceRef && ['addDrop', 'retakeDrop', 'retake'].includes(line.sourceType)) {
        const idx = addDropApprovalQueue.value.findIndex((a) => a.id === line.sourceRef)
        if (idx >= 0) {
          const app = addDropApprovalQueue.value[idx]
          addDropApprovalQueue.value[idx] = {
            ...app,
            billStatus: 'paid',
            billAmount: app.billAmount,
          }
        }
      }
    } catch {
      /* demo：回写失败不阻断 */
    }
  }
}

/**
 * @param {string} [orderId] 不传则结清最近一笔 open
 */
/**
 * @param {string} [orderId] 不传则结清最近一笔 open
 */
export function confirmMockPayment(orderId) {
  expirePaymentOrderIfNeeded(orderId)
  let order = orderId ? getPaymentOrderById(orderId) : getOpenPaymentOrder()
  if (!order) return { ok: false, reason: 'no_order' }
  if (order.status === 'paid') return { ok: true, order }
  if (order.status !== 'open') {
    // 过期单演示仍允许完成缴费，避免卡在查询态
    if (order.status !== 'expired') return { ok: false, reason: 'bad_status' }
  }
  const lineIds = Array.isArray(order.lineIds) ? order.lineIds : []
  const paidAt = nowIsoMinute()
  const paidLines = []
  paymentLines.value = paymentLines.value.map((line) => {
    if (!lineIds.includes(line.id)) return line
    const next = {
      ...line,
      status: 'paid',
      paidAt,
      orderNo: order.orderNo,
    }
    paidLines.push(next)
    return next
  })
  const paidOrder = { ...order, status: 'paid', paidAt, lineIds }
  paymentOrders.value = paymentOrders.value.map((o) =>
    o.id === order.id ? paidOrder : o,
  )
  writeBackPaid(paidLines)
  try {
    upsertFeeRosterFromPaymentLines(paymentLines.value)
  } catch {
    /* ignore */
  }
  persist()
  return { ok: true, order: paidOrder }
}

watch([paymentLines, paymentOrders], () => {
  if (hydrated) persist()
}, { deep: true })
