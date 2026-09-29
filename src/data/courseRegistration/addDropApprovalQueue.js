import { ref } from 'vue'
import {
  computeCreditsAfterApproval,
  detectScheduleConflict,
  suggestApprovalOrder,
  resolveTermCreditMax,
} from './registrationRules.js'
import {
  confirmCoursesFromAddDropItems,
  dropConfirmedCourseByCode,
  getStudentProfileFields,
  holdAddDropSectionSeat,
  releaseAddDropSectionSeat,
} from './studentRegistrationStore.js'
import { appendFeeRosterFromApproval } from './feeRosterQueue.js'
import { getPaymentGraceDays } from './registrationRuleSettings.js'
import {
  getSupplementEntry,
  getSupplementDoorStatus,
  entryHasActivePermission,
} from './supplementListQueue.js'
import { isWithinAddDropApplicationWindow } from './addDropApplicationWindow.js'
import { getActiveBatch } from './registrationBatches.js'
import { addDaysToDateTime, nowDateTimeWithSeconds } from './registrationBatchFormUtils.js'
import { isFreshmanStudent } from './studentAudience.js'
import { enrichAddDropQueueSchedule, enrichAddDropApplicationSchedule } from './addDropScheduleDemo.js'
import { ADD_DROP_TYPE_TABS, isShieldedAddDropType } from './addDropListColumns.js'
import { matchesPrimaryTypeFilter, ADD_DROP_PRIMARY_TYPES } from './addDropFormSections.js'
import {
  addDropLineKey,
  summarizeLineDecisions,
} from './addDropMultiItems.js'

const initialQueue = [
  {
    id: 'adr-001',
    applicationNo: 'ADR2509001',
    studentId: 'COS2409001',
    studentName: 'Ahmad bin Ali',
    programme: 'COS',
    intake: '2409',
    type: 'AddDrop',
    status: 'Pending',
    submittedAt: '2026-07-10 09:15:00',
    currentCredits: 22,
    creditMax: 20,
    billStatus: 'pending',
    billAmount: 480,
    items: [
      { action: 'Drop', courseCode: 'COMP201', credits: 4, section: '01', time: 'Mon 10:00–12:00' },
      {
        action: 'Add',
        courseCode: 'COMP3192',
        credits: 4,
        section: '01',
        time: 'Wed 14:00–16:00',
        retakeGrade: 'F',
        fee: 480,
      },
    ],
    schedule: [{ day: 'Mon', start: 10, end: 12, course: 'COMP201' }],
    approvalLog: [],
  },
  {
    id: 'adr-002',
    applicationNo: 'ADR2509002',
    studentId: 'DSA2504002',
    studentName: 'Lee Wei Ming',
    programme: 'DSA',
    intake: '2504',
    type: 'Add',
    status: 'Pending',
    submittedAt: '2026-07-11 14:20:00',
    currentCredits: 8,
    creditMax: 20,
    billStatus: 'pending',
    billAmount: 320,
    items: [
      { action: 'Add', courseCode: 'COMP201', credits: 4, section: '02', time: 'Wed 14:00–16:00', fee: 320 },
    ],
    schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
    approvalLog: [],
  },
  {
    id: 'adr-003',
    applicationNo: 'ADR2509003',
    studentId: 'AIT2409010',
    studentName: 'Siti Nurhaliza',
    programme: 'AIT',
    intake: '2409',
    type: 'Retake',
    status: 'Pending',
    submittedAt: '2026-07-11 16:45:00',
    currentCredits: 16,
    creditMax: 20,
    billStatus: 'pending',
    billAmount: 320,
    items: [
      {
        action: 'Retake',
        courseCode: 'MATH201',
        credits: 4,
        section: '01',
        time: 'Fri 14:00–16:00',
        retakeGrade: 'M',
        fee: 320,
      },
    ],
    schedule: [
      { day: 'Mon', start: 10, end: 12, course: 'COMP201' },
      { day: 'Wed', start: 14, end: 16, course: 'COMP3192' },
    ],
    approvalLog: [],
  },
  {
    id: 'adr-004',
    applicationNo: 'ADR2508001',
    studentId: 'COS2409005',
    studentName: 'Wong Kah Wai',
    programme: 'COS',
    intake: '2409',
    type: 'Drop',
    status: 'Approved',
    submittedAt: '2026-07-05 11:00:00',
    currentCredits: 16,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [{ action: 'Drop', courseCode: 'MPU3183', credits: 3, section: '01', time: 'Tue 09:00–12:00' }],
    schedule: [],
    approvalLog: [{ at: '2026-07-05 15:30', actor: 'AC COS', action: 'Approved' }],
  },
  {
    id: 'adr-hist-01',
    applicationNo: 'ADR2509101',
    studentId: 'COS2409018',
    studentName: 'Chen Wei',
    programme: 'COS',
    intake: '2409',
    type: 'Add',
    status: 'Approved',
    submittedAt: '2026-07-18 09:00:00',
    currentCredits: 22,
    creditMax: 20,
    billStatus: 'pending',
    billAmount: 1166,
    paymentRemindCount: 1,
    sstAmount: 66,
    feeEstimate: {
      total: 1100,
      sstAmount: 66,
      payableTotal: 1166,
      billableCredits: 2,
      items: [
        { courseCode: 'STAT201', billableCredits: 1, amount: 550, feeStream: 'science', rate: 550 },
        { courseCode: 'ENGL201', billableCredits: 1, amount: 550, feeStream: 'arts', rate: 550 },
      ],
    },
    items: [
      {
        action: 'Add',
        courseCode: 'STAT201',
        courseName: 'Probability & Statistics',
        credits: 3,
        section: '01',
        time: 'Mon 14:00–16:00',
        fee: 550,
        lineDecision: 'approved',
      },
      {
        action: 'Add',
        courseCode: 'ENGL201',
        courseName: 'Academic Writing',
        credits: 3,
        section: '01',
        time: 'Tue 10:00–12:00',
        fee: 550,
        lineDecision: 'approved',
      },
    ],
    schedule: [],
    approvalLog: [{ at: '2026-07-18 15:00', actor: 'AC COS', action: 'Approved' }],
  },
  {
    id: 'adr-hist-02',
    applicationNo: 'ADR2509102',
    studentId: 'DSA2409011',
    studentName: 'Nur Aisyah',
    programme: 'DSA',
    intake: '2409',
    type: 'Retake',
    status: 'PartiallyApproved',
    submittedAt: '2026-07-17 11:20:00',
    currentCredits: 18,
    creditMax: 20,
    billStatus: 'pending',
    billAmount: 550,
    paymentRemindCount: 2,
    items: [
      {
        action: 'Retake',
        courseCode: 'COMP201',
        courseName: 'Data Structures',
        credits: 4,
        section: '01',
        time: 'Wed 14:00–16:00',
        retakeGrade: 'F',
        fee: 1100,
        lineDecision: 'rejected',
      },
      {
        action: 'Retake',
        courseCode: 'MATH201',
        courseName: 'Linear Algebra',
        credits: 4,
        section: '01',
        time: 'Fri 14:00–16:00',
        retakeGrade: 'F',
        fee: 550,
        lineDecision: 'approved',
      },
    ],
    schedule: [],
    approvalLog: [{ at: '2026-07-17 16:40', actor: 'AC DSA', action: 'PartiallyApproved' }],
  },
  {
    id: 'adr-hist-03',
    applicationNo: 'ADR2509103',
    studentId: 'SWE2409008',
    studentName: 'Tan Mei Ling',
    programme: 'SWE',
    intake: '2409',
    type: 'Add',
    status: 'Approved',
    submittedAt: '2026-07-16 10:00:00',
    currentCredits: 20,
    creditMax: 20,
    billStatus: 'paid',
    billAmount: 550,
    paymentRemindCount: 1,
    items: [
      {
        action: 'Add',
        courseCode: 'AI110',
        courseName: 'Introduction to AI',
        credits: 3,
        section: '01',
        time: 'Thu 09:00–11:00',
        fee: 550,
        lineDecision: 'approved',
      },
    ],
    schedule: [],
    approvalLog: [{ at: '2026-07-16 14:00', actor: 'AC SWE', action: 'Approved' }],
  },
  {
    id: 'adr-005',
    applicationNo: 'ADR2509004',
    studentId: 'COS2409022',
    studentName: 'Priya Devi',
    programme: 'COS',
    intake: '2409',
    type: 'AddDrop',
    status: 'Pending',
    submittedAt: '2026-07-12 10:00:00',
    currentCredits: 12,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [
      {
        action: 'Drop',
        courseCode: 'COMP101',
        courseName: '程序设计导论',
        credits: 4,
        section: '01',
        weekRange: '1-18',
        lecturers: 'Dr. Lim',
        meetings: [{ time: 'Thu 14:00–16:00', room: 'A1#101', weekRange: '1-18' }],
      },
      {
        action: 'Add',
        courseCode: 'COMP201',
        courseName: 'Data Structures',
        credits: 4,
        section: '02',
        weekRange: '1-5',
        lecturers: 'Dr. Sarah',
        fee: 0,
        meetings: [
          { time: 'Mon 14:00–16:00', room: 'A3#509', weekRange: '1-5' },
          { time: 'Tue 10:00–12:00', room: 'A4#105', weekRange: '1-5' },
          { time: 'Thu 15:00–17:00', room: 'A3#602', weekRange: '1-5' },
        ],
      },
    ],
    schedule: [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }],
    approvalLog: [],
  },
  {
    id: 'adr-006',
    applicationNo: 'ADR2508002',
    studentId: 'DSA2409008',
    studentName: 'Raj Kumar',
    programme: 'DSA',
    intake: '2409',
    type: 'Add',
    status: 'Rejected',
    submittedAt: '2026-07-04 16:00:00',
    currentCredits: 20,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [{ action: 'Add', courseCode: 'MATH201', credits: 4, section: '01', time: 'Fri 14:00–16:00', fee: 320 }],
    schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
    approvalLog: [{ at: '2026-07-05 09:00', actor: 'AC DSA', action: 'Rejected', comment: 'Credit max exceeded' }],
  },
  {
    id: 'adr-007',
    applicationNo: 'ADR2508003',
    studentId: 'AIT2504003',
    studentName: 'Hassan Ibrahim',
    programme: 'AIT',
    intake: '2504',
    type: 'Retake',
    status: 'Approved',
    submittedAt: '2026-07-03 14:00:00',
    currentCredits: 14,
    creditMax: 20,
    billStatus: 'paid',
    billAmount: 480,
    items: [
      {
        action: 'Retake',
        courseCode: 'COMP101',
        credits: 4,
        section: '01',
        time: 'Mon 08:00–10:00',
        retakeGrade: 'F',
        fee: 480,
      },
    ],
    schedule: [],
    approvalLog: [{ at: '2026-07-04 10:00', actor: 'AC AIT', action: 'Approved' }],
  },
  {
    id: 'adr-008',
    applicationNo: 'ADR2508004',
    studentId: 'COS2504015',
    studentName: 'Tan Mei Ling',
    programme: 'COS',
    intake: '2504',
    type: 'Add',
    status: 'Cancelled',
    submittedAt: '2026-07-02 11:00:00',
    currentCredits: 0,
    creditMax: 20,
    billStatus: 'cancelled',
    billAmount: 320,
    items: [{ action: 'Add', courseCode: 'COMP201', credits: 4, section: '01', time: 'Mon 10:00–12:00', fee: 320 }],
    schedule: [],
    approvalLog: [
      { at: '2026-07-02 15:00', actor: 'AC COS', action: 'Approved' },
      { at: '2026-07-04 15:00', actor: 'System', action: 'Cancelled', comment: 'Bill unpaid 48h' },
    ],
  },
]

export const addDropApprovalQueue = ref(
  enrichAddDropQueueSchedule(
    initialQueue.map((item) => {
      const academicSession = item.academicSession || '2026/09'
      return {
        ...item,
        academicSession,
        creditMax: item.creditMax ?? resolveTermCreditMax(academicSession),
      }
    }),
  ),
)

export function classifyAddDropBucket(row, tab) {
  // 单级审批：In Review 兼容并入待审批；不再有「已提交」桶
  if (tab === 'pending') {
    return row.status === 'Pending' || row.status === 'In Review' ? 'pending' : null
  }
  if (tab === 'history') {
    return ['Approved', 'Rejected', 'Cancelled', 'PartiallyApproved'].includes(row.status)
      ? 'history'
      : null
  }
  return null
}

export function filterAddDropQueue(rows, tab, filters = {}) {
  let list = rows.filter((row) => !isShieldedAddDropType(row.type) && classifyAddDropBucket(row, tab))
  if (filters.programme) {
    list = list.filter((r) => r.programme.toLowerCase().includes(filters.programme.toLowerCase()))
  }
  if (filters.type) {
    list = list.filter((r) => matchesPrimaryTypeFilter(r.type, filters.type))
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) =>
        r.applicationNo.toLowerCase().includes(kw) ||
        r.studentId.toLowerCase().includes(kw) ||
        r.studentName.toLowerCase().includes(kw),
    )
  }
  return list
}

export function getAddDropApplicationById(id) {
  return addDropApprovalQueue.value.find((item) => item.id === id) || null
}

export function buildAddDropValidation(application) {
  const dropCredits = application.items
    .filter((i) => i.action === 'Drop')
    .reduce((sum, i) => sum + i.credits, 0)
  const addCredits = application.items
    .filter((i) => ['Add', 'Retake'].includes(i.action))
    .reduce((sum, i) => sum + i.credits, 0)
  const creditsAfter = computeCreditsAfterApproval(application.currentCredits, dropCredits, addCredits)
  // 仅作展示/核对；超分不拦截审批（见 approveAddDropApplication）
  const creditOk = creditsAfter <= application.creditMax
  const addItem = application.items.find((i) => ['Add', 'Retake'].includes(i.action))
  let conflict = false
  if (addItem?.time) {
    const match = addItem.time.match(/(\w+)\s+(\d+):(\d+)–(\d+):(\d+)/)
    if (match) {
      const dayMap = { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri' }
      const slot = {
        day: dayMap[match[1]] || match[1],
        start: Number(match[2]) + Number(match[3]) / 60,
        end: Number(match[4]) + Number(match[5]) / 60,
      }
      conflict = detectScheduleConflict(slot, application.schedule)
    }
  }
  const order = suggestApprovalOrder(application.items)
  const retakeF = application.items.some((i) => i.retakeGrade === 'F')
  const retakeM = application.items.some((i) => i.retakeGrade === 'M')
  return {
    creditsAfter,
    creditOk,
    conflict,
    suggestedOrder: order.map((i) => `${i.action} ${i.courseCode}`).join(' → '),
    retakePriority: retakeF && retakeM ? 'F' : null,
    dropCredits,
    addCredits,
  }
}

/** 审批应收金额：items.fee → billAmount → feeEstimate.total */
export function resolveAddDropBillAmount(app) {
  if (!app) return 0
  const fromItems = (app.items || []).reduce((sum, i) => sum + (Number(i.fee) || 0), 0)
  if (fromItems > 0) return fromItems
  const fromBill = Number(app.billAmount)
  if (Number.isFinite(fromBill) && fromBill > 0) return fromBill
  const fromEst = Number(app.feeEstimate?.total)
  if (Number.isFinite(fromEst) && fromEst > 0) return fromEst
  return 0
}

export function addDropApplicationHasBillableFee(app) {
  if (resolveAddDropBillAmount(app) > 0) return true
  const excess = Number(app?.excessCredits ?? app?.billableCredits ?? app?.feeEstimate?.billableCredits)
  return Number.isFinite(excess) && excess > 0
}

export function approveAddDropApplication(id, comment = '', generateBill = true, options = {}) {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]

  const lineDecisions = options.lineDecisions || null
  const items = (app.items || []).map((item, idx) => {
    const key = addDropLineKey(item)
    const fromMap =
      lineDecisions?.[idx] ??
      lineDecisions?.[key] ??
      lineDecisions?.[item.courseCode]
    const decision = fromMap || item.lineDecision || 'approved'
    return { ...item, lineDecision: decision === 'rejected' ? 'rejected' : 'approved' }
  })
  const status = summarizeLineDecisions(items)
  const approvedItems = items.filter((i) => i.lineDecision === 'approved')

  // 超分为加课常态：不因学分超限拦截，仅核对信息后可通过
  const patch = {
    items,
    status,
    approvalLog: [
      ...app.approvalLog,
      {
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        actor: 'AC Demo',
        action: status === 'PartiallyApproved' ? 'PartiallyApproved' : 'Approved',
        comment,
        stage: 'Academic Coordinator',
      },
    ],
  }
  const feeBase = { ...app, items: approvedItems }
  const fee = resolveAddDropBillAmount(feeBase)
  if (generateBill && fee > 0 && status !== 'Rejected') {
    const graceDays = getPaymentGraceDays()
    patch.billStatus = 'pending'
    patch.billAmount = fee
    patch.paymentGraceDays = graceDays
    patch.paymentDueAt = addDaysToDateTime(graceDays)
    // 审批通过默认发送一封缴费相关邮件
    patch.paymentRemindCount = Math.max(1, Number(app.paymentRemindCount) || 0)
  }
  addDropApprovalQueue.value[index] = { ...app, ...patch }

  // 写回选课 / 缴费名单失败不回滚已通过状态（原型侧写）；仅生效通过行
  try {
    const currentId = getStudentProfileFields().studentId
    if (app.studentId === currentId && approvedItems.length) {
      for (const item of approvedItems) {
        if (item.action === 'Drop' && item.courseCode) {
          dropConfirmedCourseByCode(item.courseCode)
        }
      }
      confirmCoursesFromAddDropItems(approvedItems, {
        seatAlreadyHeld: Boolean((app.seatHolds || []).length),
      })
    }
    if (generateBill && fee > 0 && status !== 'Rejected') {
      appendFeeRosterFromApproval({ ...app, ...patch, items: approvedItems })
    }
  } catch {
    /* demo：侧写异常不影响审批通过 */
  }

  return { ok: true, status }
}

/** 再次发送缴费提醒邮件：次数 +1 */
export function incrementPaymentRemindCount(id) {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]
  const next = Math.max(1, (Number(app.paymentRemindCount) || 0) + 1)
  addDropApprovalQueue.value[index] = { ...app, paymentRemindCount: next }
  return { ok: true, paymentRemindCount: next }
}

/**
 * 保证申请含 items（详情审批弹窗逐课操作依赖）
 * @param {object|null} app
 * @returns {object|null}
 */
export function ensureApplicationItems(app) {
  if (!app) return app
  if (Array.isArray(app.items) && app.items.length) return app
  const items = []
  const snap = app.courseSnapshots || {}
  const pushFromSnap = (action, s) => {
    if (!s?.courseCode && !s?.code) return
    items.push({
      action,
      courseCode: s.courseCode || s.code || '',
      courseName: s.courseName || s.name || '',
      credits: Number(s.credits) || 0,
      section: s.sectionCode || s.section || s.groupNo || '01',
      sectionCode: s.sectionCode || s.section || '',
      sectionName: s.sectionName || '',
      weekRange: s.weekRange || '',
      time: s.classTime || s.time || '',
      classTime: s.classTime || s.time || '',
      venue: s.venue || s.room || '',
      lecturers: s.lecturers || s.lecturer || '',
      meetings: s.meetings || null,
      lineDecision: 'pending',
      fee: Number(s.fee) || 0,
    })
  }
  if (snap.drop) pushFromSnap('Drop', snap.drop)
  if (snap.add) pushFromSnap('Add', snap.add)
  if (snap.retake) pushFromSnap('Retake', snap.retake)
  if (!items.length && app.courseCode) {
    const action =
      app.type === 'Drop' ? 'Drop' : app.type === 'Retake' || app.type === 'RetakeDrop' ? 'Retake' : 'Add'
    items.push({
      action,
      courseCode: app.courseCode,
      courseName: app.courseName || app.courseCode,
      credits: Number(app.credits) || 0,
      section: app.sectionCode || '01',
      lineDecision: 'pending',
      fee: Number(app.billAmount) || 0,
    })
  }
  if (!items.length) return app
  const next = { ...app, items }
  const index = addDropApprovalQueue.value.findIndex((a) => a.id === app.id)
  if (index >= 0) addDropApprovalQueue.value[index] = next
  return next
}

export function rejectAddDropApplication(id, comment = '') {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]
  if (app.status === 'Pending' || app.status === 'In Review') {
    releaseSeatsForApplication(app)
  }
  const items = (app.items || []).map((item) => ({ ...item, lineDecision: 'rejected' }))
  addDropApprovalQueue.value[index] = {
    ...app,
    items,
    status: 'Rejected',
    seatHolds: [],
    approvalLog: [
      ...app.approvalLog,
      {
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        actor: 'AC Demo',
        action: 'Rejected',
        comment,
        stage: 'Academic Coordinator',
      },
    ],
  }
  return { ok: true }
}

/** Update Required：记日志，保持 Pending */
export function requestAddDropUpdate(id, comment = '') {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]
  addDropApprovalQueue.value[index] = {
    ...app,
    status: 'Pending',
    approvalLog: [
      ...app.approvalLog,
      {
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        actor: 'AC Demo',
        action: 'Update Required',
        comment,
        stage: 'Academic Coordinator',
      },
    ],
  }
  return { ok: true }
}

/**
 * 统一决策入口（单条/批量）
 * @param {'Approved'|'Rejected'|'Update Required'} action
 */
export function decideAddDropApplication(id, action, comment = '', options = {}) {
  const generateBill = options.generateBill !== false
  if (action === 'Approved') {
    return approveAddDropApplication(id, comment, generateBill, {
      lineDecisions: options.lineDecisions,
    })
  }
  if (action === 'Rejected') return rejectAddDropApplication(id, comment)
  if (action === 'Update Required') return requestAddDropUpdate(id, comment)
  return { ok: false, errorKey: 'courseRegistration.approval.invalidAction' }
}

/** 行级决策写入（审批详情内点选） */
export function setAddDropLineDecision(id, itemKeyOrIndex, decision) {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]
  const items = (app.items || []).map((item, idx) => {
    const key = addDropLineKey(item)
    const match =
      itemKeyOrIndex === idx ||
      itemKeyOrIndex === key ||
      itemKeyOrIndex === item.courseCode
    if (!match) return item
    return { ...item, lineDecision: decision }
  })
  addDropApprovalQueue.value[index] = { ...app, items }
  return { ok: true, items }
}

/** 本期申请类型（筛选/展示用主类型三选一；关联归入加课/重修） */
export const addDropTypeOptions = [...ADD_DROP_PRIMARY_TYPES]
export const ALL_ADD_DROP_ACTIONS = [...ADD_DROP_TYPE_TABS]

let studentAdrSeq = 9005

function actionsFromSupplementEntry(entry, now = new Date()) {
  if (!entry) return []
  // 窗外/新生：须补注册门有效；动作看各权限是否有效
  const doorOk = entryHasActivePermission(entry, 'supplement', now)
  if (!doorOk) return []
  const actions = []
  const canAdd = entryHasActivePermission(entry, 'canAdd', now)
  const canDrop = entryHasActivePermission(entry, 'canDrop', now)
  const canRetake = entryHasActivePermission(entry, 'canRetake', now)
  if (canAdd) actions.push('Add')
  if (canDrop) actions.push('Drop')
  if (canRetake) actions.push('Retake')
  if (canAdd && canDrop) actions.push('AddDrop')
  if (canRetake && canDrop) actions.push('RetakeDrop')
  return actions
}

/**
 * 加退课访问闸门（含新生默认禁止、补注册权限与邀请时效）
 */
export function getAddDropAccess(studentId, batch = getActiveBatch(), now = new Date()) {
  const freshman = Boolean(studentId && isFreshmanStudent(studentId))
  const inWindow = isWithinAddDropApplicationWindow(batch, now)
  const entry = studentId ? getSupplementEntry(studentId) : null

  if (freshman) {
    if (!entry) {
      return {
        ok: false,
        freshmanBlocked: true,
        allowedActions: [],
        errorKey: 'courseRegistration.student.freshmanAddDropBlocked',
      }
    }
    const door = getSupplementDoorStatus(studentId, now)
    if (!door.ok) {
      return {
        ok: false,
        via: 'whitelist',
        allowedActions: [],
        errorKey: door.errorKey,
        invite: door,
        entry,
      }
    }
    const allowedActions = actionsFromSupplementEntry(entry, now)
    return {
      ok: allowedActions.length > 0,
      via: 'whitelist',
      allowedActions,
      entry,
      invite: door,
      errorKey: allowedActions.length ? undefined : 'courseRegistration.student.freshmanAddDropBlocked',
    }
  }

  if (inWindow) {
    return { ok: true, via: 'window', allowedActions: [...ALL_ADD_DROP_ACTIONS] }
  }

  if (entry) {
    const door = getSupplementDoorStatus(studentId, now)
    if (!door.ok) {
      return {
        ok: false,
        via: 'whitelist',
        allowedActions: [],
        errorKey: door.errorKey,
        invite: door,
        entry,
      }
    }
    const allowedActions = actionsFromSupplementEntry(entry, now)
    return {
      ok: allowedActions.length > 0,
      via: 'whitelist',
      allowedActions,
      entry,
      invite: door,
      errorKey: allowedActions.length
        ? undefined
        : 'courseRegistration.student.addDropWindowClosedShort',
    }
  }

  return {
    ok: false,
    allowedActions: [],
    errorKey: 'courseRegistration.student.addDropWindowClosedShort',
  }
}

/** 是否允许学生发起申请；可选校验具体 action 类型 */
export function canStudentSubmitAddDrop(studentId, batch = getActiveBatch(), action = null) {
  const access = getAddDropAccess(studentId, batch)
  if (!access.ok) return access
  if (action && (isShieldedAddDropType(action) || !access.allowedActions.includes(action))) {
    return {
      ok: false,
      errorKey: 'courseRegistration.student.addDropActionNotAllowed',
      allowedActions: access.allowedActions,
      via: access.via,
    }
  }
  return access
}

function holdSeatsForAddDropItems(items = []) {
  const holds = []
  for (const item of items) {
    if (item.action !== 'Add' && item.action !== 'Retake') continue
    const result = holdAddDropSectionSeat({
      courseId: item.courseId,
      courseCode: item.courseCode,
      sectionId: item.sectionId,
      sectionCode: item.section || item.sectionCode,
    })
    if (!result.ok) {
      for (const hold of holds) releaseAddDropSectionSeat(hold)
      return result
    }
    holds.push(result.hold)
  }
  return { ok: true, holds }
}

function releaseSeatsForApplication(app) {
  const holds = app?.seatHolds || []
  for (const hold of holds) releaseAddDropSectionSeat(hold)
}

export function submitStudentAddDropApplication(studentFields, items, options = {}) {
  if (!items?.length) return { ok: false, errorKey: 'courseRegistration.student.addDropEmpty' }

  const inferredType =
    options.type ||
    (items.some((i) => i.action === 'Retake') && items.some((i) => i.action === 'Drop')
      ? 'RetakeDrop'
      : items.length > 1
        ? 'AddDrop'
        : items[0]?.action)

  const gate = canStudentSubmitAddDrop(studentFields.studentId, getActiveBatch(), inferredType)
  if (!gate.ok) return gate

  const seatResult = holdSeatsForAddDropItems(items)
  if (!seatResult.ok) return seatResult

  const normalizedItems = items.map((item) => ({
    ...item,
    lineDecision: item.lineDecision || 'pending',
  }))

  studentAdrSeq += 1
  const dropChannel = options.dropChannel || null
  const autoApproveSelfDrop =
    dropChannel === 'self' &&
    normalizedItems.every((item) => item.action === 'Drop') &&
    Boolean(options.selfServiceNoApproval)

  const app = {
    id: `adr-stu-${studentAdrSeq}`,
    applicationNo: `ADR${new Date().getFullYear()}${String(studentAdrSeq).slice(-4)}`,
    studentId: studentFields.studentId,
    studentName: studentFields.studentName,
    programme: studentFields.programme,
    intake: studentFields.intake,
    type: inferredType,
    status: autoApproveSelfDrop ? 'Approved' : options.status || 'Pending',
    submittedAt: nowDateTimeWithSeconds(),
    academicSession: options.academicSession || '',
    currentCredits: options.currentCredits ?? 0,
    creditMax: options.creditMax ?? resolveTermCreditMax(options.academicSession),
    creditMaxBypass: Boolean(options.creditMaxBypass),
    termCreditOver: Boolean(options.termCreditOver),
    billStatus: 'none',
    billAmount: options.billAmount ?? options.feeEstimate?.total ?? 0,
    items: autoApproveSelfDrop
      ? normalizedItems.map((i) => ({ ...i, lineDecision: 'approved' }))
      : normalizedItems,
    schedule: options.schedule || [],
    dropChannel,
    reason: options.reason || '',
    feeWaiver: options.feeWaiver ?? null,
    attachments: options.attachments || [],
    teachingWeek: options.teachingWeek,
    contactPhone: options.contactPhone || '',
    primaryType: options.primaryType || '',
    needDrop: options.needDrop === 'yes' || options.needDrop === 'no' ? options.needDrop : '',
    addType: options.addType || '',
    addNotes: options.addNotes || '',
    dropReason: options.dropReason || options.reason || '',
    previouslyTakenCourse: options.previouslyTakenCourse || '',
    gradeEarned: options.gradeEarned || '',
    academicSessionTaken: options.academicSessionTaken || '',
    previousCourseGradesText: options.previousCourseGradesText || '',
    retakeType: options.retakeType || '',
    declarationAgreed: Boolean(options.declarationAgreed),
    courseSnapshots: options.courseSnapshots || null,
    sectionId: options.sectionId || '',
    sectionCode: options.sectionCode || '',
    classTime: options.classTime || '',
    venue: options.venue || '',
    lecturers: options.lecturers || '',
    weekRange: options.weekRange || '',
    dropSectionCode: options.dropSectionCode || '',
    dropClassTime: options.dropClassTime || '',
    dropVenue: options.dropVenue || '',
    dropLecturers: options.dropLecturers || '',
    dropWeekRange: options.dropWeekRange || '',
    addSectionCode: options.addSectionCode || '',
    addClassTime: options.addClassTime || '',
    addVenue: options.addVenue || '',
    addLecturers: options.addLecturers || '',
    addWeekRange: options.addWeekRange || '',
    transcriptId: options.transcriptId || '',
    eligibilitySource: options.eligibilitySource || '',
    feeEstimate: options.feeEstimate || null,
    billableCredits: options.billableCredits ?? options.feeEstimate?.billableCredits ?? 0,
    excessCredits:
      options.excessCredits ??
      options.billableCredits ??
      options.feeEstimate?.billableCredits ??
      0,
    seatHolds: seatResult.holds || [],
    paymentDueAt: '',
    paymentGraceDays: getPaymentGraceDays(),
    paymentRemindCount: 0,
    sstAmount: options.sstAmount ?? options.feeEstimate?.sstAmount ?? 0,
    approvalLog: autoApproveSelfDrop
      ? [
          {
            at: new Date().toISOString().slice(0, 16).replace('T', ' '),
            actor: 'Self-service',
            action: 'Approved',
            comment: 'Self-service drop within deadline (no multi-level approval)',
          },
        ]
      : [],
  }
  const enriched = enrichAddDropApplicationSchedule(app, studentAdrSeq)
  addDropApprovalQueue.value.unshift(enriched)

  if (autoApproveSelfDrop) {
    for (const item of items) {
      if (item.action === 'Drop' && item.courseCode) {
        dropConfirmedCourseByCode(item.courseCode)
      }
    }
  }

  return { ok: true, application: enriched, autoApproved: autoApproveSelfDrop, via: gate.via }
}

/** 是否已有实质审批动作（自助通过也算已开始，不可再取消） */
export function hasAddDropApprovalStarted(app) {
  return (app?.approvalLog || []).some((log) =>
    ['Approved', 'Rejected', 'Update Required', 'PartiallyApproved'].includes(log.action),
  )
}

/** 审批开始前学生可取消（待审批且尚无实质审批记录） */
export function canCancelAddDropApplication(app) {
  if (!app) return false
  if (app.status !== 'Pending') return false
  return !hasAddDropApprovalStarted(app)
}

export function cancelStudentAddDropApplication(id, actor = 'Student') {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]
  if (!canCancelAddDropApplication(app)) {
    return { ok: false, errorKey: 'courseRegistration.student.cancelNotAllowed' }
  }
  releaseSeatsForApplication(app)
  const at = new Date().toISOString().slice(0, 16).replace('T', ' ')
  addDropApprovalQueue.value[index] = {
    ...app,
    status: 'Cancelled',
    seatHolds: [],
    approvalLog: [
      ...(app.approvalLog || []),
      {
        at,
        actor,
        action: 'Cancelled',
        comment: 'Cancelled by student before review',
      },
    ],
  }
  return { ok: true, application: addDropApprovalQueue.value[index] }
}
