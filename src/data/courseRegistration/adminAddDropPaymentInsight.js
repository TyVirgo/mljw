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
/**
 * 为历史账单明细补整单课级行（多课整单待缴 / 整单已缴；不再演示同申请部分已缴）
 */
function ensureRichBillDetailLines() {
  const extras = [
    // ADR2509101：整单待缴（多课）
    {
      id: 'admin-bill-hist01-stat',
      studentId: 'COS2409018',
      courseCode: 'STAT201',
      courseName: 'Probability & Statistics',
      credits: 3,
      billableCredits: 1,
      feeAmount: 550,
      amount: 550,
      type: 'GE',
      schoolElectiveCategory: 'science',
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
      feeAmount: 550,
      amount: 550,
      type: 'GE',
      schoolElectiveCategory: 'arts',
      sectionName: '01',
      sourceRef: 'adr-hist-01',
      applicationNo: 'ADR2509101',
      paymentDueAt: '',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
      academicSession: '2026/09',
    },
    // SST 仅用于合计口径；明细表不再展示 SST 行（保留 id 供旧缓存清理）
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
    // ADR2509102：整单待缴（仅审批通过的课；不再混入已缴行）
    {
      id: 'admin-bill-hist02-comp-unpaid',
      studentId: 'DSA2409011',
      courseCode: 'COMP201',
      courseName: 'Data Structures',
      credits: 4,
      billableCredits: 1,
      feeAmount: 550,
      amount: 550,
      type: 'CORE',
      sectionName: '01',
      sourceRef: 'adr-hist-02',
      applicationNo: 'ADR2509102',
      paymentDueAt: '2026-07-25 23:59:00',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
      academicSession: '2026/09',
    },
    // ADR2509103：整单已缴
    {
      id: 'admin-bill-hist03-ai-paid',
      studentId: 'SWE2409008',
      courseCode: 'AI110',
      courseName: 'Introduction to AI',
      credits: 3,
      billableCredits: 1,
      feeAmount: 550,
      amount: 550,
      type: 'GE',
      schoolElectiveCategory: 'ai_open',
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
  // 去掉历史「部分已缴」残留行（同申请 MATH 已缴 + COMP 待缴）
  const dropIds = new Set(['admin-bill-hist02-math-paid'])
  let next = paymentLines.value.filter((l) => !dropIds.has(l.id))
  const existing = new Set(next.map((l) => l.id))
  const toAdd = extras.filter((l) => !existing.has(l.id))
  if (toAdd.length || next.length !== paymentLines.value.length) {
    paymentLines.value = [...next, ...toAdd]
  }
}

/**
 * 为历史账单补缴费截止：pending 与 paid 缺值均补；已缴用过去截止日
 */
export function ensureHistoryPaymentDueDemo(now = Date.now()) {
  if (demoDueSeeded) return
  demoDueSeeded = true
  try {
    ensureStudentCoursePaymentSeeded()
  } catch {
    /* ignore */
  }
  ensureRichBillDetailLines()
  const pendingTargets = addDropApprovalQueue.value.filter(
    (app) => isHistoryBillRow(app) && app.billStatus === 'pending' && !app.paymentDueAt,
  )
  const paidTargets = addDropApprovalQueue.value.filter(
    (app) => isHistoryBillRow(app) && app.billStatus === 'paid' && !app.paymentDueAt,
  )
  const pendingOffsetsMs = [
    -3 * 60 * 60 * 1000,
    10 * 60 * 60 * 1000,
    20 * 60 * 60 * 1000,
    3 * 24 * 60 * 60 * 1000,
  ]
  const dueByAppId = new Map()
  pendingTargets.forEach((app, idx) => {
    const due = new Date(now + (pendingOffsetsMs[idx] ?? pendingOffsetsMs[pendingOffsetsMs.length - 1]))
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
  // 已缴：补「缴前」截止（相对已付时间或固定 demo 截止）
  paidTargets.forEach((app, idx) => {
    const paidLine = paymentLines.value.find(
      (l) =>
        (l.sourceRef === app.id || l.applicationNo === app.applicationNo) && l.paidAt,
    )
    let dueStr = ''
    if (paidLine?.paymentDueAt) {
      dueStr = paidLine.paymentDueAt
    } else if (paidLine?.paidAt) {
      const paidAt = parseBatchDateTime(paidLine.paidAt)
      if (paidAt && !Number.isNaN(paidAt.getTime())) {
        dueStr = formatLocalDateTimeWithSeconds(new Date(paidAt.getTime() + 24 * 60 * 60 * 1000))
      }
    }
    if (!dueStr) {
      const due = new Date(now - (2 + idx) * 24 * 60 * 60 * 1000)
      dueStr = formatLocalDateTimeWithSeconds(due)
    }
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
  const allTargets = [...pendingTargets, ...paidTargets]
  const appNoById = new Map(allTargets.map((a) => [a.id, a.applicationNo || '']))
  paymentLines.value = paymentLines.value.map((line) => {
    if (line.paymentDueAt) return line
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

function resolveAppSstAmount(app) {
  const n = Number(app?.sstAmount ?? app?.feeEstimate?.sstAmount)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
}

/**
 * 课程费行之外补 SST 行（与学生缴费含税应付对齐）；已有 SST 行则去重
 * @param {object} app
 * @param {object[]} lines
 */
function appendSstBillLine(app, lines) {
  const list = Array.isArray(lines) ? [...lines] : []
  const sst = resolveAppSstAmount(app)
  if (!sst || !list.length) return list
  if (list.some((l) => String(l.courseCode || '').toUpperCase() === 'SST')) return list

  const anyUnpaid = list.some((l) => l.status === 'unpaid' || l.status === 'locked')
  const allPaid = list.length > 0 && list.every((l) => l.status === 'paid')
  const status = allPaid && !anyUnpaid ? 'paid' : anyUnpaid || app.billStatus === 'pending' ? 'unpaid' : 'paid'
  const paidSample = list.find((l) => l.paidAt)

  list.push({
    id: `admin-bill-${app.id}-sst`,
    studentId: app.studentId,
    courseCode: 'SST',
    courseName: 'SST',
    credits: 0,
    billableCredits: 0,
    amount: sst,
    sectionName: '—',
    sourceRef: app.id,
    applicationNo: app.applicationNo || '',
    paymentDueAt: app.paymentDueAt || list[0]?.paymentDueAt || '',
    status,
    paidAt: status === 'paid' ? paidSample?.paidAt || '' : '',
    orderNo: status === 'paid' ? paidSample?.orderNo || '' : '',
    academicSession: app.academicSession || '',
  })
  return list
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
  const courseFeeTotal = feeItems.reduce((s, i) => s + (Number(i.fee) || 0), 0)
  const sst = resolveAppSstAmount(app)
  /** billAmount 若已含税且无逐课 fee，首行只取不含税部分，避免与 SST 行双计 */
  const payableBill = Number(app.billAmount) || 0
  const firstLineFee =
    courseFeeTotal > 0
      ? 0
      : sst > 0 && payableBill > sst
        ? payableBill - sst
        : payableBill

  const lines = items.map((item, idx) => ({
    id: `admin-bill-${app.id}-${item.courseCode || idx}`,
    studentId: app.studentId,
    courseCode: item.courseCode || '—',
    courseName: item.courseName || item.courseCode || '—',
    credits: item.credits || 0,
    billableCredits: item.billableCredits ?? item.credits ?? 0,
    amount:
      Number(item.fee) ||
      (idx === 0 ? (courseFeeTotal > 0 ? 0 : firstLineFee) : 0),
    sectionName: item.sectionName || item.section || '01',
    sourceRef: app.id,
    applicationNo: app.applicationNo || '',
    paymentDueAt: app.paymentDueAt || '',
    status: paid ? 'paid' : 'unpaid',
    paidAt: paid ? app.approvalLog?.slice(-1)?.[0]?.at || '' : '',
    orderNo: '',
    academicSession: app.academicSession || '',
  }))
  return appendSstBillLine(app, lines)
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

/** 是否为 SST 占位课行（不入课程表） */
function isSstBillLine(line) {
  return String(line?.courseCode || '').trim().toUpperCase() === 'SST'
}

/**
 * 课行展示用课程费（优先 feeAmount，避免含税 amount 与合计 SST 双计）
 * @param {object} line
 */
export function resolveBillLineCourseFee(line) {
  if (!line || isSstBillLine(line)) return 0
  if (line.feeAmount != null && line.feeAmount !== '') return Number(line.feeAmount) || 0
  const amount = Number(line.amount) || 0
  const sst = Number(line.sstAmount) || 0
  if (sst > 0 && amount >= sst) return amount - sst
  return amount
}

/**
 * 同申请课行去重：优先 sourceRef===app.id，再按 courseCode 保留一行
 * @param {object[]} lines
 * @param {object} app
 */
function dedupeBillCourseLines(lines, app) {
  const courseLines = (lines || []).filter((l) => !isSstBillLine(l))
  const preferred = courseLines.filter((l) => l.sourceRef === app.id)
  const pool = preferred.length ? preferred : courseLines
  /** @type {Map<string, object>} */
  const byCode = new Map()
  for (const line of pool) {
    const code = String(line.courseCode || '').trim() || line.id
    const existing = byCode.get(code)
    if (!existing) {
      byCode.set(code, line)
      continue
    }
    // 优先带 feeAmount 的行（课程费口径更清晰）
    const preferNew =
      (line.feeAmount != null && line.feeAmount !== '' && (existing.feeAmount == null || existing.feeAmount === '')) ||
      (line.sourceRef === app.id && existing.sourceRef !== app.id)
    if (preferNew) byCode.set(code, line)
  }
  return [...byCode.values()]
}

/**
 * 保证课行有可解析的统一类别字段（禁止明细落成「—」）
 * @param {object} row
 */
function ensureCourseTypeFields(row) {
  const next = { ...row }
  let type = String(next.type || '').trim()
  let school =
    next.schoolElectiveCategory ||
    next.feeStream ||
    ''
  if (!type) {
    // 无类型时：有 feeStream 按 GE；否则默认必修（重修/加课 demo 常见）
    if (school) type = 'GE'
    else type = 'CORE'
  }
  if ((type === 'GE' || type === 'ME') && !school) {
    school = 'arts'
  }
  next.type = type
  if (school) next.schoolElectiveCategory = school
  return next
}

/**
 * 从申请 items 补齐课行类型字段，供统一类别展示
 * @param {object[]} lines
 * @param {object} app
 */
function enrichBillLinesWithCourseType(lines, app) {
  const itemByCode = new Map()
  for (const item of app?.items || []) {
    const code = String(item.courseCode || '').trim()
    if (code) itemByCode.set(code, item)
  }
  return (lines || []).map((line) => {
    const item = itemByCode.get(String(line.courseCode || '').trim())
    const merged = item
      ? {
          ...line,
          courseName: line.courseName || item.courseName || line.courseCode,
          type: line.type || item.type || '',
          schoolElectiveCategory:
            line.schoolElectiveCategory || item.schoolElectiveCategory || item.feeStream || '',
          feeStream: line.feeStream || item.feeStream || '',
        }
      : { ...line }
    const withType = ensureCourseTypeFields(merged)
    return {
      ...withType,
      displayFee: resolveBillLineCourseFee(withType),
    }
  })
}

/**
 * 解析整单 SST：申请字段 / SST 行 / 课行 sstAmount
 * @param {object} app
 * @param {object[]} rawLines
 * @param {object[]} courseLines
 */
function resolveBillSstAmount(app, rawLines, courseLines) {
  const fromApp = resolveAppSstAmount(app)
  if (fromApp > 0) return fromApp
  const fromSstRows = (rawLines || [])
    .filter(isSstBillLine)
    .reduce((s, l) => s + (Number(l.amount) || 0), 0)
  if (fromSstRows > 0) return fromSstRows
  return (courseLines || []).reduce((s, l) => s + (Number(l.sstAmount) || 0), 0)
}

/**
 * @param {object} app
 * @returns {{
 *   unpaid: object[],
 *   paid: object[],
 *   all: object[],
 *   paymentDueAt: string,
 *   sstUnpaid: number,
 *   sstPaid: number,
 *   courseFeeUnpaid: number,
 *   courseFeePaid: number,
 *   payableUnpaid: number,
 *   payablePaid: number,
 * }}
 */
export function getApplicationBillDetail(app) {
  const empty = {
    unpaid: [],
    paid: [],
    all: [],
    paymentDueAt: '',
    sstUnpaid: 0,
    sstPaid: 0,
    courseFeeUnpaid: 0,
    courseFeePaid: 0,
    payableUnpaid: 0,
    payablePaid: 0,
  }
  if (!app) return empty
  try {
    ensureStudentCoursePaymentSeeded()
  } catch {
    /* ignore */
  }

  let rawLines = paymentLines.value.filter(
    (l) =>
      l.sourceRef === app.id ||
      (app.applicationNo && l.applicationNo === app.applicationNo),
  )

  if (!rawLines.length) {
    const roster = linesFromFeeRoster(app).filter(
      (r) => r.status === 'paid' || r.status === 'unpaid',
    )
    if (roster.some((r) => Number(r.amount) > 0)) {
      rawLines = roster
    }
  }

  if (!rawLines.length && hasBillableFee(app)) {
    // synthesize 会带 SST 行，后面统一剥离
    rawLines = synthesizeLinesFromApp(app)
  }

  // 整单语义：以申请 billStatus 为准
  const appBill = String(app.billStatus || '')
  if (appBill === 'paid') {
    rawLines = rawLines.map((l) =>
      l.status === 'paid'
        ? l
        : { ...l, status: 'paid', paidAt: l.paidAt || '', orderNo: l.orderNo || '' },
    )
  } else if (appBill === 'pending' || appBill === 'cancelled') {
    rawLines = rawLines.map((l) =>
      l.status === 'unpaid' || l.status === 'locked'
        ? l
        : { ...l, status: 'unpaid', paidAt: '', orderNo: '' },
    )
  }

  let courseLines = enrichBillLinesWithCourseType(dedupeBillCourseLines(rawLines, app), app)
  const sstTotal = resolveBillSstAmount(app, rawLines, courseLines)

  const unpaid = courseLines.filter((l) => l.status === 'unpaid' || l.status === 'locked')
  const paid = courseLines.filter((l) => l.status === 'paid')
  const courseFeeUnpaid = unpaid.reduce((s, l) => s + resolveBillLineCourseFee(l), 0)
  const courseFeePaid = paid.reduce((s, l) => s + resolveBillLineCourseFee(l), 0)
  // 整单：待缴 SST 进待缴合计；已缴整单 SST 进已缴合计
  const sstUnpaid = appBill === 'paid' ? 0 : sstTotal
  const sstPaid = appBill === 'paid' ? sstTotal : 0

  // 页眉截止：优先申请级（已缴也必须有），再取课行最早截止
  const lineDues = courseLines
    .map((l) => l.paymentDueAt)
    .filter(Boolean)
    .sort()
  return {
    unpaid,
    paid,
    all: courseLines,
    paymentDueAt: app.paymentDueAt || lineDues[0] || '',
    sstUnpaid,
    sstPaid,
    courseFeeUnpaid,
    courseFeePaid,
    payableUnpaid: courseFeeUnpaid + sstUnpaid,
    payablePaid: courseFeePaid + sstPaid,
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

/**
 * 将历史申请列表展开为「导出缴费」课行（一行一课；整单 SST/总费用挂在每行供合并）
 * @param {object[]} applications 当前筛选的历史行
 * @returns {object[]}
 */
export function collectApprovalPaymentExportLines(applications = []) {
  const out = []
  for (const app of applications) {
    if (!app || !isHistoryBillRow(app)) continue
    const billStatus = String(app.billStatus || '')
    if (!billStatus || billStatus === 'none') continue
    const detail = getApplicationBillDetail(app)
    const lines = detail.all || []
    if (!lines.length) continue
    // 整单 SST / 总费用（与账单明细合计一致）
    const sstFee =
      billStatus === 'paid'
        ? Number(detail.sstPaid) || 0
        : Number(detail.sstUnpaid) || 0
    const totalFee =
      billStatus === 'paid'
        ? Number(detail.payablePaid) || 0
        : Number(detail.payableUnpaid) || 0
    const billPaid = billStatus === 'paid'
    const applicationNo = app.applicationNo || ''
    for (const line of lines) {
      const credits =
        line.billableCredits != null && line.billableCredits !== ''
          ? Number(line.billableCredits)
          : Number(line.credits) || 0
      out.push({
        mergeKey: applicationNo || app.id || '',
        studentId: app.studentId || line.studentId || '',
        studentName: app.studentName || line.studentName || '',
        applicationNo,
        billStatus,
        paymentStatus: billPaid ? 'paid' : 'unpaid',
        sstFee,
        totalFee,
        courseCode: line.courseCode || '',
        courseName: line.courseName || '',
        credits: Number.isFinite(credits) ? credits : 0,
        courseFee: resolveBillLineCourseFee(line),
      })
    }
  }
  return out
}

export function canRemindPayment(app, _now = Date.now()) {
  if (
    !app ||
    (app.status !== 'Approved' && app.status !== 'PartiallyApproved') ||
    app.billStatus !== 'pending'
  ) {
    return false
  }
  // 历史已生成待缴账单即可催缴（不限剩余不足 24h）
  return true
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

/** 默认延期建议：当前时刻 + 3 天 */
export function defaultRegenDueAt(days = 3) {
  return addDaysToDateTime(days)
}

export { isHistoryBillRow, hasBillableFee, formatLocalDateTimeWithSeconds }
