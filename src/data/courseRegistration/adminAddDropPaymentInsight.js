/**
 * 审批历史：课级账单明细、缴费剩余、催缴门槛、重新生成订单（延期截止）
 */
import { addDropApprovalQueue } from './addDropApprovalQueue.js'
import { feeRosterRows } from './feeRosterQueue.js'
import {
  paymentLines,
  paymentOrders,
  ensureStudentCoursePaymentSeeded,
} from './studentCoursePaymentStore.js'
import {
  parseBatchDateTime,
  formatLocalDateTimeWithSeconds,
  addDaysToDateTime,
} from './registrationBatchFormUtils.js'

export const PAYMENT_REMIND_WITHIN_MS = 24 * 60 * 60 * 1000
export const PAYMENT_URGENT_WITHIN_MS = 12 * 60 * 60 * 1000

let demoDueSeeded = false

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 本地 YYYY-MM-DDTHH:mm（供 datetime-local） */
export function toDatetimeLocalValue(value) {
  const d = value instanceof Date ? value : parseBatchDateTime(value)
  if (!d || Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function fromDatetimeLocalValue(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return formatLocalDateTimeWithSeconds(d)
}

function hasBillableFee(app) {
  if (!app) return false
  if (Number(app.billAmount) > 0) return true
  if (Number(app.feeEstimate?.total) > 0) return true
  return (app.items || []).some((i) => Number(i.fee) > 0)
}

function isHistoryBillRow(app) {
  return (
    app &&
    (app.status === 'Approved' || app.status === 'PartiallyApproved') &&
    hasBillableFee(app) &&
    app.billStatus &&
    app.billStatus !== 'none'
  )
}

/**
 * 为历史待缴 demo 行补相对截止（只跑一次）：超时 / &lt;12h / &lt;24h / 尚远
 */
/** 为历史账单明细补多场景课级行（多课待缴 / 部分已缴 / 全缴） */
function ensureRichBillDetailLines() {
  const extras = [
    {
      id: 'admin-bill-hist01-stat',
      studentId: 'COS2409018',
      courseCode: 'STAT201',
      courseName: 'Probability & Statistics',
      credits: 3,
      billableCredits: 1,
      amount: 550,
      sectionName: '01',
      sourceRef: 'adr-hist-01',
      applicationNo: 'ADR2509101',
      paymentDueAt: '',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
      academicSession: '2026/09',
    },
    {
      id: 'admin-bill-hist01-engl',
      studentId: 'COS2409018',
      courseCode: 'ENGL201',
      courseName: 'Academic Writing',
      credits: 3,
      billableCredits: 1,
      amount: 550,
      sectionName: '01',
      sourceRef: 'adr-hist-01',
      applicationNo: 'ADR2509101',
      paymentDueAt: '',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
      academicSession: '2026/09',
    },
    {
      id: 'admin-bill-hist01-sst',
      studentId: 'COS2409018',
      courseCode: 'SST',
      courseName: 'SST',
      credits: 0,
      billableCredits: 0,
      amount: 66,
      sectionName: '—',
      sourceRef: 'adr-hist-01',
      applicationNo: 'ADR2509101',
      paymentDueAt: '',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
      academicSession: '2026/09',
    },
    {
      id: 'admin-bill-hist02-math-paid',
      studentId: 'DSA2409011',
      courseCode: 'MATH201',
      courseName: 'Linear Algebra',
      credits: 4,
      billableCredits: 1,
      amount: 550,
      sectionName: '01',
      sourceRef: 'adr-hist-02',
      applicationNo: 'ADR2509102',
      paymentDueAt: '',
      status: 'paid',
      paidAt: '2026-07-20 10:00',
      orderNo: 'PAY20260720-DEMO1',
      academicSession: '2026/09',
    },
    {
      id: 'admin-bill-hist02-comp-unpaid',
      studentId: 'DSA2409011',
      courseCode: 'COMP201',
      courseName: 'Data Structures',
      credits: 4,
      billableCredits: 2,
      amount: 1100,
      sectionName: '01',
      sourceRef: 'adr-hist-02',
      applicationNo: 'ADR2509102',
      paymentDueAt: '',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
      academicSession: '2026/09',
    },
    {
      id: 'admin-bill-hist03-ai-paid',
      studentId: 'SWE2409008',
      courseCode: 'AI110',
      courseName: 'Introduction to AI',
      credits: 3,
      billableCredits: 1,
      amount: 550,
      sectionName: '01',
      sourceRef: 'adr-hist-03',
      applicationNo: 'ADR2509103',
      paymentDueAt: '2026-07-18 23:59:00',
      status: 'paid',
      paidAt: '2026-07-17 16:20',
      orderNo: 'PAY20260717-DEMO2',
      academicSession: '2026/09',
    },
  ]
  const existing = new Set(paymentLines.value.map((l) => l.id))
  const toAdd = extras.filter((l) => !existing.has(l.id))
  if (toAdd.length) paymentLines.value = [...paymentLines.value, ...toAdd]
}

export function ensureHistoryPaymentDueDemo(now = Date.now()) {
  if (demoDueSeeded) return
  demoDueSeeded = true
  try {
    ensureStudentCoursePaymentSeeded()
  } catch {
    /* ignore */
  }
  ensureRichBillDetailLines()
  const targets = addDropApprovalQueue.value.filter(
    (app) => isHistoryBillRow(app) && app.billStatus === 'pending' && !app.paymentDueAt,
  )
  const offsetsMs = [
    -3 * 60 * 60 * 1000,
    10 * 60 * 60 * 1000,
    20 * 60 * 60 * 1000,
    3 * 24 * 60 * 60 * 1000,
  ]
  const dueByAppId = new Map()
  targets.forEach((app, idx) => {
    const due = new Date(now + (offsetsMs[idx] ?? offsetsMs[offsetsMs.length - 1]))
    const dueStr = formatLocalDateTimeWithSeconds(due)
    dueByAppId.set(app.id, dueStr)
    const i = addDropApprovalQueue.value.findIndex((a) => a.id === app.id)
    if (i < 0) return
    addDropApprovalQueue.value[i] = {
      ...addDropApprovalQueue.value[i],
      paymentDueAt: dueStr,
      paymentGraceDays: addDropApprovalQueue.value[i].paymentGraceDays ?? 2,
    }
  })
  if (!dueByAppId.size) return
  const appNoById = new Map(
    targets.map((a) => [a.id, a.applicationNo || '']),
  )
  paymentLines.value = paymentLines.value.map((line) => {
    if (line.status === 'paid') return line
    let dueStr = dueByAppId.get(line.sourceRef)
    if (!dueStr && line.applicationNo) {
      for (const [id, no] of appNoById) {
        if (no && no === line.applicationNo) {
          dueStr = dueByAppId.get(id)
          break
        }
      }
    }
    if (!dueStr) return line
    return { ...line, paymentDueAt: dueStr }
  })
}

function synthesizeLinesFromApp(app) {
  const feeItems = (app.items || []).filter((i) => Number(i.fee) > 0)
  const items =
    feeItems.length > 0
      ? feeItems
      : Number(app.billAmount) > 0
        ? [
            (app.items || []).find((i) => ['Add', 'Retake'].includes(i.action)) ||
              (app.items || [])[0],
          ].filter(Boolean)
        : []
  const paid = app.billStatus === 'paid'
  return items.map((item, idx) => ({
    id: `admin-bill-${app.id}-${item.courseCode || idx}`,
    studentId: app.studentId,
    courseCode: item.courseCode || '—',
    courseName: item.courseName || item.courseCode || '—',
    credits: item.credits || 0,
    billableCredits: item.billableCredits ?? item.credits ?? 0,
    amount: Number(item.fee) || (idx === 0 ? Number(app.billAmount) || 0 : 0),
    sectionName: item.sectionName || item.section || '01',
    sourceRef: app.id,
    applicationNo: app.applicationNo || '',
    paymentDueAt: app.paymentDueAt || '',
    status: paid ? 'paid' : 'unpaid',
    paidAt: paid ? app.approvalLog?.slice(-1)?.[0]?.at || '' : '',
    orderNo: '',
    academicSession: app.academicSession || '',
  }))
}

function linesFromFeeRoster(app) {
  const codes = new Set(
    (app.items || []).filter((i) => Number(i.fee) > 0).map((i) => i.courseCode),
  )
  if (!codes.size) return []
  return feeRosterRows.value
    .filter((r) => r.studentId === app.studentId && codes.has(r.courseCode))
    .map((r) => ({
      id: r.id,
      studentId: r.studentId,
      courseCode: r.courseCode,
      courseName: r.courseName || r.courseCode,
      credits: r.courseCredits || 0,
      billableCredits: r.courseCredits || 0,
      amount: 0,
      sectionName: r.sectionCode || '01',
      sourceRef: app.id,
      applicationNo: app.applicationNo || '',
      paymentDueAt: r.paymentDueAt || app.paymentDueAt || '',
      status: r.paid === 'Y' ? 'paid' : 'unpaid',
      paidAt: r.paidAt || '',
      orderNo: '',
      academicSession: r.academicSession || app.academicSession || '',
    }))
}

/**
 * @param {object} app
 * @returns {{ unpaid: object[], paid: object[], all: object[], paymentDueAt: string }}
 */
export function getApplicationBillDetail(app) {
  if (!app) return { unpaid: [], paid: [], all: [], paymentDueAt: '' }
  try {
    ensureStudentCoursePaymentSeeded()
  } catch {
    /* ignore */
  }

  let lines = paymentLines.value.filter(
    (l) =>
      l.sourceRef === app.id ||
      (app.applicationNo && l.applicationNo === app.applicationNo),
  )

  if (!lines.length) {
    const roster = linesFromFeeRoster(app)
    if (roster.length && roster.some((r) => Number(r.amount) > 0 || r.courseCode)) {
      lines = roster.filter((r) => r.status === 'paid' || r.status === 'unpaid')
    }
  }

  if (!lines.length && hasBillableFee(app)) {
    lines = synthesizeLinesFromApp(app)
  }

  const unpaid = lines.filter((l) => l.status === 'unpaid' || l.status === 'locked')
  const paid = lines.filter((l) => l.status === 'paid')
  const earliestUnpaidDue = unpaid
    .map((l) => l.paymentDueAt)
    .filter(Boolean)
    .sort()[0]
  return {
    unpaid,
    paid,
    all: lines,
    paymentDueAt: earliestUnpaidDue || app.paymentDueAt || '',
  }
}

/**
 * @param {object} app
 * @param {number} [now]
 */
export function getPaymentRemainingInfo(app, now = Date.now()) {
  if (!isHistoryBillRow(app)) {
    return { kind: 'none', labelKey: null, remainingMs: null, dueAt: '', urgent: false }
  }
  if (app.billStatus === 'paid' || app.billStatus === 'cancelled') {
    return { kind: 'settled', labelKey: null, remainingMs: null, dueAt: app.paymentDueAt || '', urgent: false }
  }

  const detail = getApplicationBillDetail(app)
  if (!detail.unpaid.length && app.billStatus !== 'pending') {
    return { kind: 'settled', labelKey: null, remainingMs: null, dueAt: detail.paymentDueAt, urgent: false }
  }

  const dueAt = detail.paymentDueAt || app.paymentDueAt || ''
  const dueDate = parseBatchDateTime(dueAt)
  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return { kind: 'unknown', labelKey: 'courseRegistration.approval.paymentRemainingUnknown', remainingMs: null, dueAt, urgent: false }
  }

  const remainingMs = dueDate.getTime() - now
  if (remainingMs <= 0) {
    return {
      kind: 'overdue',
      labelKey: 'courseRegistration.approval.paymentOverdue',
      remainingMs,
      dueAt,
      urgent: true,
    }
  }
  return {
    kind: 'remaining',
    labelKey: null,
    remainingMs,
    dueAt,
    urgent: remainingMs < PAYMENT_URGENT_WITHIN_MS,
    warn: remainingMs < PAYMENT_REMIND_WITHIN_MS,
  }
}

export function formatRemainingDuration(ms, t) {
  if (ms == null || ms < 0) return ''
  const totalMin = Math.floor(ms / 60000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const mins = totalMin % 60
  return t('courseRegistration.approval.paymentRemainingDhm', {
    d: days,
    h: hours,
    m: mins,
  })
}

export function canShowBillDetail(app) {
  return isHistoryBillRow(app)
}

export function canRemindPayment(app, now = Date.now()) {
  if (
    !app ||
    (app.status !== 'Approved' && app.status !== 'PartiallyApproved') ||
    app.billStatus !== 'pending'
  ) {
    return false
  }
  const info = getPaymentRemainingInfo(app, now)
  return (
    (info.kind === 'remaining' && info.remainingMs != null && info.remainingMs < PAYMENT_REMIND_WITHIN_MS) ||
    info.kind === 'overdue'
  )
}

export function canRegeneratePaymentOrder(app, now = Date.now()) {
  if (!app || app.status !== 'Approved' || app.billStatus !== 'pending') return false
  const info = getPaymentRemainingInfo(app, now)
  return info.kind === 'overdue'
}

export function buildPaymentRemindDraft(app, t) {
  const info = getPaymentRemainingInfo(app)
  const remainText =
    info.kind === 'remaining'
      ? formatRemainingDuration(info.remainingMs, t)
      : t('courseRegistration.approval.paymentOverdue')
  return {
    subject: t('courseRegistration.approval.paymentRemindDraft.subject', {
      name: app.studentName,
      id: app.studentId,
    }),
    body: [
      t('courseRegistration.approval.paymentRemindDraft.greeting', {
        name: app.studentName,
        id: app.studentId,
      }),
      '',
      t('courseRegistration.approval.paymentRemindDraft.line1', {
        no: app.applicationNo,
        due: info.dueAt || '—',
        remain: remainText,
      }),
      t('courseRegistration.approval.paymentRemindDraft.line2'),
      '',
      t('courseRegistration.approval.paymentRemindDraft.signoff'),
    ].join('\n'),
  }
}

/**
 * 延期该申请下全部未缴课截止；演示语义「重新生成订单」
 * @param {string} appId
 * @param {string} newDueAt 本地 YYYY-MM-DD HH:mm:ss
 */
export function regenerateApplicationPaymentOrder(appId, newDueAt) {
  const due = String(newDueAt || '').trim()
  const dueDate = parseBatchDateTime(due)
  if (!due || !dueDate || Number.isNaN(dueDate.getTime())) {
    return { ok: false, reason: 'invalid_due' }
  }
  if (dueDate.getTime() <= Date.now()) {
    return { ok: false, reason: 'due_not_future' }
  }

  const idx = addDropApprovalQueue.value.findIndex((a) => a.id === appId)
  if (idx < 0) return { ok: false, reason: 'not_found' }
  const app = addDropApprovalQueue.value[idx]
  if (app.status !== 'Approved' || app.billStatus !== 'pending') {
    return { ok: false, reason: 'bad_status' }
  }

  const dueStr = formatLocalDateTimeWithSeconds(dueDate)
  const stamp = formatLocalDateTimeWithSeconds(new Date())

  addDropApprovalQueue.value[idx] = {
    ...app,
    paymentDueAt: dueStr,
    billStatus: 'pending',
    orderRegenLog: [
      ...(app.orderRegenLog || []),
      { at: stamp, previousDueAt: app.paymentDueAt || '', newDueAt: dueStr, actor: 'AC Demo' },
    ],
    approvalLog: [
      ...(app.approvalLog || []),
      {
        at: stamp,
        actor: 'AC Demo',
        action: 'PaymentDueExtended',
        comment: `paymentDueAt → ${dueStr}`,
      },
    ],
  }

  try {
    ensureStudentCoursePaymentSeeded()
  } catch {
    /* ignore */
  }

  const touchLine = (line) =>
    line.sourceRef === appId ||
    (app.applicationNo && line.applicationNo === app.applicationNo)

  const touchedLineIds = new Set()
  paymentLines.value = paymentLines.value.map((line) => {
    if (!touchLine(line)) return line
    if (line.status === 'paid') return line
    touchedLineIds.add(line.id)
    return { ...line, paymentDueAt: dueStr, status: line.status === 'locked' ? 'unpaid' : line.status }
  })

  // 取消仍 open/expired 且含本申请行的订单，便于学生重新结算
  if (touchedLineIds.size) {
    paymentOrders.value = paymentOrders.value.map((order) => {
      if (order.status !== 'open' && order.status !== 'expired') return order
      const hit = (order.lineIds || []).some((id) => touchedLineIds.has(id))
      return hit ? { ...order, status: 'cancelled' } : order
    })
  }

  const codes = new Set(
    (app.items || []).filter((i) => Number(i.fee) > 0).map((i) => i.courseCode),
  )
  feeRosterRows.value = feeRosterRows.value.map((row) => {
    if (row.studentId !== app.studentId) return row
    if (codes.size && !codes.has(row.courseCode)) return row
    if (row.paid === 'Y') return row
    return { ...row, paymentDueAt: dueStr, paid: 'N', outstandingFee: 'Y' }
  })

  return { ok: true, paymentDueAt: dueStr }
}

/** 默认延期建议：当前时刻 + 2 天 */
export function defaultRegenDueAt(days = 2) {
  return addDaysToDateTime(days)
}

export { isHistoryBillRow, hasBillableFee, formatLocalDateTimeWithSeconds }
