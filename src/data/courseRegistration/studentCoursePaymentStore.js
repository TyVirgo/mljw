/**
 * 学生端课程缴费：购物车行 + 模拟财务订单（缴费码倒计时）
 * 金额：feeAmount（课程费）+ sstAmount（SST）= amount（应付）
 */
import { computed, ref, watch } from 'vue'
import { DEFAULT_MOCK_CURRENT_STUDENT_ID } from '../mockCurrentStudent.js'
import { getStudentProfileFields } from './studentRegistrationStore.js'
import {
  addDropApprovalQueue,
  filterApprovedAddDropItems,
  applyApprovedAddDropScheduleEffects,
} from './addDropApprovalQueue.js'
import { upsertFeeRosterFromPaymentLines } from './feeRosterQueue.js'
import {
  computeSstAmount,
  SST_RATE,
  buildFeeEstimateFromApplicationItems,
} from './addDropFeeRates.js'
import { buildAddDropPlanRemaining } from './studentRegistrationContext.js'

export const PAYMENT_ORDER_TTL_MS = 15 * 60 * 1000
/** 升 v6：待缴行按 feeEstimate 两段规则（重修全额+加课毕业超出）拆行 */
const STORAGE_KEY = 'crs-student-course-payment-v6'

/**
 * 账单键：优先申请单号，否则 sourceRef，再退回行 id
 * @param {object} line
 * @returns {string}
 */
export function paymentBillKey(line) {
  const no = String(line?.applicationNo || '').trim()
  if (no) return no
  const ref = String(line?.sourceRef || '').trim()
  if (ref) return ref
  return String(line?.id || '')
}

/**
 * 已缴费分组键：优先订单号，保证与支付时同一批行一致（增量 bg）
 * @param {object} line
 * @returns {string}
 */
export function paymentPaidGroupKey(line) {
  const orderNo = String(line?.orderNo || '').trim()
  if (orderNo) return `order:${orderNo}`
  return paymentBillKey(line)
}

/**
 * 同整单内按课去重（同 sourceRef+课号+计费学分+课程费只留一条）
 * @param {object[]} billLines
 * @returns {object[]}
 */
function dedupePaymentBillLines(billLines) {
  /** @type {Map<string, object>} */
  const map = new Map()
  for (const line of billLines || []) {
    const id = String(line?.id || '').trim()
    const logical = [
      String(line?.sourceRef || '').trim(),
      String(line?.courseCode || '').trim().toUpperCase(),
      String(Number(line?.billableCredits) || 0),
      String(Number(line?.feeAmount) || 0),
    ].join('|')
    const key = id || logical
    if (!key || map.has(key)) continue
    // 再拦逻辑重复（不同 id 同课同费）
    let dup = false
    for (const existing of map.values()) {
      const exLogical = [
        String(existing?.sourceRef || '').trim(),
        String(existing?.courseCode || '').trim().toUpperCase(),
        String(Number(existing?.billableCredits) || 0),
        String(Number(existing?.feeAmount) || 0),
      ].join('|')
      if (exLogical === logical && logical !== '|||0|0') {
        dup = true
        break
      }
    }
    if (dup) continue
    map.set(key, line)
  }
  return [...map.values()]
}

/**
 * 将课行按账单键聚合成整单
 * @param {object[]} lines
 * @param {{ groupBy?: 'bill'|'paidOrder' }} [options] bill=申请单；paidOrder=已缴按订单
 * @returns {{ billKey: string, applicationNo: string, sourceRef: string, paymentDueAt: string, billGeneratedAt: string, lines: object[], feeTotal: number, sstTotal: number, amount: number, courseCount: number }[]}
 */
export function groupPaymentLinesByBill(lines, options = {}) {
  const groupByPaidOrder = options.groupBy === 'paidOrder'
  /** @type {Map<string, object[]>} */
  const map = new Map()
  for (const line of lines || []) {
    const key = groupByPaidOrder ? paymentPaidGroupKey(line) : paymentBillKey(line)
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(line)
  }
  return [...map.entries()].map(([billKey, rawLines]) => {
    // 增量 bg：去重后再汇总，避免同课重复抬高合计
    const billLines = dedupePaymentBillLines(rawLines)
    const feeTotal = billLines.reduce((s, l) => s + (Number(l.feeAmount) || 0), 0)
    const sstTotal = billLines.reduce((s, l) => s + (Number(l.sstAmount) || 0), 0)
    const amount = billLines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
    const dues = billLines.map((l) => l.paymentDueAt).filter(Boolean).sort()
    // 增量 ay/bb：整单生成时间取最早一条；缺则按截止推算
    const generated = billLines.map((l) => l.billGeneratedAt).filter(Boolean).sort()
    return {
      billKey,
      applicationNo: billLines.find((l) => l.applicationNo)?.applicationNo || billKey,
      sourceRef: billLines.find((l) => l.sourceRef)?.sourceRef || '',
      paymentDueAt: dues[0] || '',
      billGeneratedAt: generated[0] || defaultBillGeneratedAt(dues[0]) || '',
      lines: billLines,
      feeTotal,
      sstTotal,
      amount,
      courseCount: billLines.length,
    }
  })
}

/**
 * demo：由缴费截止推一版更早的生成时间（约早 7 天 10:00）
 * @param {string} paymentDueAt
 */
function defaultBillGeneratedAt(paymentDueAt) {
  const due = String(paymentDueAt || '').trim()
  const m = due.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return nowIsoMinute()
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 10, 0, 0)
  d.setDate(d.getDate() - 7)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day} 10:00`
}

/** Demo 待缴行固定按 China 计 SST，保证界面能明显看到税费 */
export const PAYMENT_DEMO_SST_CATEGORY = 'China'

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

/**
 * 行级附加 SST：feeAmount 为不含税课程费，amount 为应付（含税）
 * @param {object} line
 * @param {string} [studentCategory]
 */
export function withPaymentSst(line, studentCategory = 'Local') {
  const feeAmount = Number(
    line?.feeAmount != null && line.feeAmount !== ''
      ? line.feeAmount
      : line?.amount,
  ) || 0
  const sstAmount = computeSstAmount(feeAmount, studentCategory)
  return {
    ...line,
    feeAmount,
    sstAmount,
    sstRate: SST_RATE,
    amount: feeAmount + sstAmount,
    studentCategory,
  }
}

/**
 * Demo 待缴：按申请整单灌种（含多课整单）；已缴为整单历史
 * @param {string} studentId
 */
function buildDemoSeedLines(studentId) {
  const profile = getStudentProfileFields()
  const sid = studentId || profile.studentId || DEFAULT_MOCK_CURRENT_STUDENT_ID
  const base = {
    studentId: sid,
    studentName: profile.studentName || 'Demo Student',
    programme: profile.programme || 'COS',
    intake: profile.intake || '',
    academicSession: '2026/04',
  }
  const raw = [
    // —— 3 门整单 ——
    {
      ...base,
      id: 'pay-demo-u3a',
      courseCode: 'STAT201',
      courseName: 'Probability & Statistics',
      credits: 3,
      billableCredits: 1,
      feeAmount: 550,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-triple-01',
      applicationNo: 'ADR2509101',
      paymentDueAt: '2026-08-20 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u3b',
      courseCode: 'ENGL201',
      courseName: 'Academic Writing',
      credits: 3,
      billableCredits: 1,
      feeAmount: 550,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-triple-01',
      applicationNo: 'ADR2509101',
      paymentDueAt: '2026-08-20 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u3c',
      courseCode: 'HUM110',
      courseName: 'Introduction to Humanities',
      credits: 3,
      billableCredits: 1,
      feeAmount: 500,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-triple-01',
      applicationNo: 'ADR2509101',
      paymentDueAt: '2026-08-20 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    // —— 2 门整单 A ——
    {
      ...base,
      id: 'pay-demo-u2a-a',
      courseCode: 'COMP201',
      courseName: 'Data Structures',
      credits: 4,
      billableCredits: 1,
      feeAmount: 550,
      sectionName: '分组名称01',
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
      id: 'pay-demo-u2a-b',
      courseCode: 'PHYS101',
      courseName: 'Physics I',
      credits: 4,
      billableCredits: 1,
      feeAmount: 550,
      sectionName: '分组名称02',
      sourceType: 'retakeDrop',
      sourceRef: 'adr-xmum-retakedrop-02',
      applicationNo: 'ADR2509030',
      paymentDueAt: '2026-08-18 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    // —— 2 门整单 B ——
    {
      ...base,
      id: 'pay-demo-u2b-a',
      courseCode: 'BUS201',
      courseName: 'Business Fundamentals',
      credits: 3,
      billableCredits: 1,
      feeAmount: 550,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-pair-02',
      applicationNo: 'ADR2509018',
      paymentDueAt: '2026-08-25 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u2b-b',
      courseCode: 'SCI110',
      courseName: 'Scientific Reasoning',
      credits: 3,
      billableCredits: 1,
      feeAmount: 550,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-pair-02',
      applicationNo: 'ADR2509018',
      paymentDueAt: '2026-08-25 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    // —— 1 门整单（保留少量）——
    {
      ...base,
      id: 'pay-demo-u1-math',
      courseCode: 'MATH201',
      courseName: 'Linear Algebra',
      credits: 4,
      billableCredits: 2,
      feeAmount: 1100,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-xmum-01',
      applicationNo: 'ADR2509010',
      paymentDueAt: '2026-08-22 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    {
      ...base,
      id: 'pay-demo-u1-chem',
      courseCode: 'CHEM101',
      courseName: 'General Chemistry',
      credits: 3,
      billableCredits: 1,
      feeAmount: 550,
      sectionName: '分组名称01',
      sourceType: 'retake',
      sourceRef: 'adr-xmum-chem-01',
      applicationNo: 'ADR2509029',
      paymentDueAt: '2026-08-28 23:59',
      status: 'unpaid',
      paidAt: '',
      orderNo: '',
    },
    // 已缴整单历史
    {
      ...base,
      id: 'pay-demo-p1',
      courseCode: 'HIST101',
      courseName: 'World History',
      credits: 3,
      billableCredits: 3,
      feeAmount: 1800,
      sectionName: '分组名称01',
      sourceType: 'addDrop',
      sourceRef: 'adr-paid-demo-2',
      applicationNo: 'ADR2509009',
      paymentDueAt: '2026-07-10 23:59',
      status: 'paid',
      paidAt: '2026-07-12 14:30',
      orderNo: 'PAY20260712-1430',
    },
    {
      ...base,
      id: 'pay-demo-p2',
      courseCode: 'PHIL110',
      courseName: 'Critical Thinking',
      credits: 3,
      billableCredits: 2,
      feeAmount: 1100,
      sectionName: '分组名称02',
      sourceType: 'addDrop',
      sourceRef: 'adr-paid-demo',
      applicationNo: 'ADR2509008',
      paymentDueAt: '2026-07-16 23:59',
      status: 'paid',
      paidAt: '2026-07-18 09:15',
      orderNo: 'PAY20260718-0915',
    },
  ]
  // 增量 ay：demo 待缴/已缴行补齐账单生成时间
  return raw.map((line) =>
    withPaymentSst(
      {
        ...line,
        billGeneratedAt: line.billGeneratedAt || defaultBillGeneratedAt(line.paymentDueAt),
      },
      PAYMENT_DEMO_SST_CATEGORY,
    ),
  )
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

/**
 * 缴费来源类型（含加+重修组合）
 * @param {object} app
 */
function paymentSourceTypeFromApp(app) {
  const type = String(app?.type || '')
  if (type === 'RetakeDrop') return 'retakeDrop'
  if (type === 'Retake' || type === 'AddRetake') return 'retake'
  return 'addDrop'
}

/**
 * 将 feeEstimate.items 映射为待缴课行（仅 amount>0）
 * @param {object[]} estimateItems
 */
function mapEstimateItemsToPaymentLines(estimateItems) {
  return (estimateItems || [])
    .filter((i) => Number(i.amount) > 0)
    .map((item, index) => ({
      courseCode: item.courseCode || `fee-${index}`,
      courseName: item.courseName || item.courseCode || '',
      credits: item.credits || item.billableCredits || 0,
      billableCredits: Number(item.billableCredits) || 0,
      feeAmount: Number(item.amount) || 0,
      sectionName: item.sectionName || item.section || '01',
    }))
}

/**
 * 解析申请待缴费用行：以通过行重建/存盘 feeEstimate 为真源（amount>0）
 * 加课应收 0、不通过/驳回课均不进入
 * @param {object} app
 * @returns {object[]}
 */
function resolvePaymentFeeLinesFromApp(app) {
  const approvedItems = filterApprovedAddDropItems(app)
  // 审结后优先按通过行重算，避免存盘预估落后于行决策
  const rebuilt = buildFeeEstimateFromApplicationItems(
    { ...app, items: approvedItems },
    buildAddDropPlanRemaining(app.studentId),
    app.studentCategory || 'Local',
  )
  const fromRebuilt = mapEstimateItemsToPaymentLines(rebuilt?.items || [])
  if (fromRebuilt.length) return fromRebuilt

  const fromStored = mapEstimateItemsToPaymentLines(app?.feeEstimate?.items || [])
  if (fromStored.length) return fromStored

  // 旧数据：按通过行 items.fee > 0
  const feeItems = approvedItems.filter((it) => Number(it.fee) > 0)
  if (feeItems.length) {
    return feeItems.map((item) => ({
      courseCode: item.courseCode,
      courseName: item.courseName || item.courseCode,
      credits: item.credits || 0,
      billableCredits: item.credits || 0,
      feeAmount: Number(item.fee) || 0,
      sectionName: item.sectionName || item.section || '01',
    }))
  }
  return []
}

function collectLiveUnpaidLines(studentId) {
  const lines = []
  for (const app of addDropApprovalQueue.value || []) {
    if (app.studentId !== studentId) continue
    if (app.status !== 'Approved' && app.status !== 'PartiallyApproved') continue
    if (app.billStatus !== 'pending') continue
    const bill = Number(app.billAmount) || 0
    if (bill <= 0) continue
    const sourceType = paymentSourceTypeFromApp(app)
    const identity = {
      studentName: app.studentName || '',
      programme: app.programme || app.programmeCode || '',
      intake: app.intake || '',
      academicSession: app.academicSession || '',
    }
    const feeLines = resolvePaymentFeeLinesFromApp(app)
    if (feeLines.length) {
      /** @type {Map<string, object>} 增量 bg：同课同计费学分去重 */
      const byId = new Map()
      for (const item of feeLines) {
        const lineId = `pay-live-${app.id}-${item.courseCode}-${item.billableCredits}`
        if (byId.has(lineId)) continue
        byId.set(
          lineId,
          withPaymentSst(
            {
              id: lineId,
              studentId,
              ...identity,
              courseCode: item.courseCode,
              courseName: item.courseName || item.courseCode,
              credits: item.credits || 0,
              billableCredits: item.billableCredits || 0,
              feeAmount: Number(item.feeAmount) || 0,
              sectionName: item.sectionName || '01',
              sourceType,
              sourceRef: app.id,
              applicationNo: app.applicationNo || '',
              paymentDueAt: app.paymentDueAt || '',
              billGeneratedAt:
                app.billGeneratedAt || defaultBillGeneratedAt(app.paymentDueAt) || nowIsoMinute(),
              status: 'unpaid',
              paidAt: '',
              orderNo: '',
            },
            PAYMENT_DEMO_SST_CATEGORY,
          ),
        )
      }
      lines.push(...byId.values())
      continue
    }
    // 无明细：整单挂到第一门加/重修课（兼容旧单）
    const fallback =
      (app.items || []).find((i) => ['Add', 'Retake'].includes(i.action)) ||
      (app.items || [])[0]
    if (!fallback) continue
    lines.push(
      withPaymentSst(
        {
          id: `pay-live-${app.id}-${fallback.courseCode}`,
          studentId,
          ...identity,
          courseCode: fallback.courseCode,
          courseName: fallback.courseName || fallback.courseCode,
          credits: fallback.credits || 0,
          billableCredits: Number(app.excessCredits) || fallback.credits || 0,
          feeAmount: bill,
          sectionName: fallback.sectionName || fallback.section || '01',
          sourceType,
          sourceRef: app.id,
          applicationNo: app.applicationNo || '',
          paymentDueAt: app.paymentDueAt || '',
          billGeneratedAt:
            app.billGeneratedAt || defaultBillGeneratedAt(app.paymentDueAt) || nowIsoMinute(),
          status: 'unpaid',
          paidAt: '',
          orderNo: '',
        },
        PAYMENT_DEMO_SST_CATEGORY,
      ),
    )
  }
  return lines
}

/**
 * 待缴课目签名：用于判断是否需要写 paymentLines（避免渲染路径死循环）
 * @param {object[]} lines
 */
function unpaidLinesSignature(lines) {
  return (lines || [])
    .map(
      (l) =>
        `${l.sourceRef || ''}|${String(l.courseCode || '').trim()}|${Number(l.feeAmount) || 0}|${Number(l.billableCredits) || 0}|${String(l.billGeneratedAt || '').trim()}`,
    )
    .sort()
    .join(';')
}

/**
 * 将审批队列待缴课行与课程缴费对齐（按申请 reconcile：增/改/删）
 * 本单课目与金额以审批后 feeEstimate 为准；保留其它申请与 demo / 已缴行
 * 签名未变时不写 paymentLines（可安全重复调用）
 */
export function mergeLiveUnpaidFromApproval(studentId) {
  const sid =
    studentId || getStudentProfileFields().studentId || DEFAULT_MOCK_CURRENT_STUDENT_ID
  const pendingApps = (addDropApprovalQueue.value || []).filter(
    (app) =>
      app.studentId === sid &&
      (app.status === 'Approved' || app.status === 'PartiallyApproved') &&
      app.billStatus === 'pending',
  )
  const appIds = new Set(pendingApps.map((a) => a.id))
  const appNos = new Set(pendingApps.map((a) => a.applicationNo).filter(Boolean))

  const belongsToPendingApp = (line) =>
    appIds.has(line.sourceRef) ||
    (line.applicationNo && appNos.has(line.applicationNo))

  const live = collectLiveUnpaidLines(sid).map((l) => normalizePaymentLine(l))
  const currentOwned = paymentLines.value.filter(
    (line) => line.status !== 'paid' && belongsToPendingApp(line),
  )

  // 课目与金额未变：禁止赋值，避免 computed/列表渲染反复触发卡死
  if (unpaidLinesSignature(live) === unpaidLinesSignature(currentOwned)) {
    return { ok: true, added: 0, removed: 0 }
  }

  const kept = paymentLines.value.filter((line) => {
    if (line.status === 'paid') return true
    return !belongsToPendingApp(line)
  })

  const next = [...kept, ...live]
  const removed = paymentLines.value.length - kept.length
  paymentLines.value = next
  try {
    upsertFeeRosterFromPaymentLines(paymentLines.value)
  } catch {
    /* ignore */
  }
  if (hydrated) persist()
  return { ok: true, added: live.length, removed }
}

/**
 * 补齐账单生成时间（增量 bb：旧 localStorage / 缺字段 demo 行）
 * @param {object} line
 */
function withBillGeneratedAt(line) {
  if (!line) return line
  const existing = String(line.billGeneratedAt || '').trim()
  if (existing) return line
  return {
    ...line,
    billGeneratedAt: defaultBillGeneratedAt(line.paymentDueAt) || nowIsoMinute(),
  }
}

/** 持久化行补齐 fee/sst/应付（兼容旧 amount-only；纠正 fee+sst≠amount） */
function normalizePaymentLine(line) {
  if (!line) return line
  const category = line.studentCategory || PAYMENT_DEMO_SST_CATEGORY
  if (line.feeAmount != null && line.feeAmount !== '') {
    const feeAmount = Number(line.feeAmount) || 0
    const sstAmount =
      line.sstAmount != null && line.sstAmount !== ''
        ? Number(line.sstAmount) || 0
        : computeSstAmount(feeAmount, category)
    const payable = feeAmount + sstAmount
    if (Number(line.amount) === payable && Number(line.sstAmount) === sstAmount) {
      return withBillGeneratedAt({
        ...line,
        feeAmount,
        sstAmount,
        amount: payable,
        studentCategory: category,
      })
    }
    return withBillGeneratedAt({
      ...line,
      feeAmount,
      sstAmount,
      sstRate: SST_RATE,
      amount: payable,
      studentCategory: category,
    })
  }
  return withBillGeneratedAt(withPaymentSst(line, category))
}

/**
 * 按当前行重算订单金额（含税应付），修复 SST 上线前快照
 * @param {object} order
 * @param {object[]} [lines]
 */
export function syncOrderMoneyFromLines(order, lines = paymentLines.value) {
  if (!order) return order
  const byId = new Map((lines || []).map((l) => [l.id, l]))
  const selected = (order.lineIds || []).map((id) => byId.get(id)).filter(Boolean)
  if (!selected.length) return order
  const feeTotal = selected.reduce((s, l) => s + (Number(l.feeAmount) || 0), 0)
  const sstTotal = selected.reduce((s, l) => s + (Number(l.sstAmount) || 0), 0)
  const total = selected.reduce((s, l) => s + (Number(l.amount) || 0), 0)
  return {
    ...order,
    feeTotal,
    sstTotal,
    total,
    courseCount: selected.length,
  }
}

function syncAllOrderMoney() {
  paymentOrders.value = paymentOrders.value.map((o) => syncOrderMoneyFromLines(o))
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
    mergeLiveUnpaidFromApproval()
    // 增量 bb：再次进入仍补齐缺失生成时间
    paymentLines.value = paymentLines.value.map(normalizePaymentLine)
    return
  }
  const studentId = getStudentProfileFields().studentId || DEFAULT_MOCK_CURRENT_STUDENT_ID
  const saved = loadPersisted()
  const seed = buildDemoSeedLines(studentId)
  const live = collectLiveUnpaidLines(studentId)

  if (saved?.lines?.length) {
    // 保留用户已付状态与订单绑定字段；补齐 SST 字段
    const restored = saved.lines.map((l) => normalizePaymentLine(l))
    const restoredIds = new Set(restored.map((l) => l.id))
    for (const s of seed) {
      if (!restoredIds.has(s.id)) restored.push({ ...s })
    }
    for (const l of live) {
      if (!restoredIds.has(l.id) && !restored.some((x) => x.id === l.id)) {
        restored.push(normalizePaymentLine(l))
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
    paymentLines.value = restored.map(normalizePaymentLine)
    paymentOrders.value = restoreOrdersFromSaved(saved)
  } else {
    paymentLines.value = mergeLines(seed, live, null).map(normalizePaymentLine)
    paymentOrders.value = []
  }

  syncAllOrderMoney()
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

/** 待缴费按申请整单分组 */
export const cartUnpaidBillGroups = computed(() =>
  groupPaymentLinesByBill(cartUnpaidLines.value),
)

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

/** 已缴费按支付订单分组（增量 bg：与支付时同一批行一致） */
export const paidPaymentBillGroups = computed(() =>
  groupPaymentLinesByBill(paidPaymentLines.value, { groupBy: 'paidOrder' }),
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
 * 扩齐账单键下全部待缴课行（禁止同申请拆付）
 * @param {string[]} lineIds
 * @returns {object[]}
 */
function expandUnpaidLinesToFullBills(lineIds) {
  const ids = [...new Set(lineIds || [])]
  const seed = paymentLines.value.filter(
    (l) => ids.includes(l.id) && l.status === 'unpaid' && Number(l.amount) > 0,
  )
  if (!seed.length) return []
  const keys = new Set(seed.map((l) => paymentBillKey(l)))
  return paymentLines.value.filter(
    (l) =>
      l.status === 'unpaid' &&
      Number(l.amount) > 0 &&
      keys.has(paymentBillKey(l)),
  )
}

/**
 * 按申请整单键创建支付订单（可多张整单 → 一笔订单）
 * @param {string[]} billKeys
 */
export function createPaymentOrderFromBills(billKeys) {
  expirePaymentOrderIfNeeded()
  const keySet = new Set((billKeys || []).map((k) => String(k || '').trim()).filter(Boolean))
  if (!keySet.size) return { ok: false, reason: 'empty' }
  const ids = paymentLines.value
    .filter((l) => l.status === 'unpaid' && Number(l.amount) > 0 && keySet.has(paymentBillKey(l)))
    .map((l) => l.id)
  return createPaymentOrder(ids)
}

/**
 * @param {string[]} lineIds 传入部分行时也会自动扩齐同整单全部待缴行
 */
export function createPaymentOrder(lineIds) {
  expirePaymentOrderIfNeeded()
  const selected = expandUnpaidLinesToFullBills(lineIds)
  if (!selected.length) return { ok: false, reason: 'empty' }

  const createdAt = Date.now()
  const feeTotal = selected.reduce((s, l) => s + (Number(l.feeAmount) || 0), 0)
  const sstTotal = selected.reduce((s, l) => s + (Number(l.sstAmount) || 0), 0)
  const total = selected.reduce((s, l) => s + (Number(l.amount) || 0), 0)
  const billKeys = [...new Set(selected.map((l) => paymentBillKey(l)))]
  const order = {
    id: `order-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    orderNo: genOrderNo(),
    lineIds: selected.map((l) => l.id),
    billKeys,
    feeTotal,
    sstTotal,
    total,
    courseCount: selected.length,
    billCount: billKeys.length,
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
  /** @type {Set<string>} */
  const paidAppIds = new Set()
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
          paidAppIds.add(app.id)
        }
      }
    } catch {
      /* demo：回写失败不阻断 */
    }
  }
  // 有应付时审批未落课：缴费成功后再写入课表（学分随之更新）
  for (const appId of paidAppIds) {
    try {
      const app = addDropApprovalQueue.value.find((a) => a.id === appId)
      if (app) applyApprovedAddDropScheduleEffects(app)
    } catch {
      /* demo：落课失败不阻断缴费回写 */
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
  const paidOrder = syncOrderMoneyFromLines(
    { ...order, status: 'paid', paidAt, lineIds },
    paymentLines.value,
  )
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
