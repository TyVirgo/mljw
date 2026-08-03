import { ref } from 'vue'
import {
  computeCreditsAfterApproval,
  detectScheduleConflict,
  suggestApprovalOrder,
} from './registrationRules.js'
import {
  confirmCoursesFromAddDropItems,
  dropConfirmedCourseByCode,
  getStudentProfileFields,
} from './studentRegistrationStore.js'
import { appendFeeRosterFromApproval } from './feeRosterQueue.js'
import { isStudentInSupplementList } from './supplementListQueue.js'
import { isWithinAddDropApplicationWindow } from './addDropApplicationWindow.js'
import { getActiveBatch } from './registrationBatches.js'

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
    submittedAt: '2026-07-10 09:15',
    currentCredits: 18,
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
    submittedAt: '2026-07-11 14:20',
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
    submittedAt: '2026-07-11 16:45',
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
    submittedAt: '2026-07-05 11:00',
    currentCredits: 16,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [{ action: 'Drop', courseCode: 'MPU3183', credits: 3, section: '01', time: 'Tue 09:00–12:00' }],
    schedule: [],
    approvalLog: [{ at: '2026-07-05 15:30', actor: 'AC COS', action: 'Approved' }],
  },
  {
    id: 'adr-005',
    applicationNo: 'ADR2509004',
    studentId: 'COS2409022',
    studentName: 'Priya Devi',
    programme: 'COS',
    intake: '2409',
    type: 'AddDrop',
    status: 'In Review',
    submittedAt: '2026-07-12 10:00',
    currentCredits: 12,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [
      { action: 'Drop', courseCode: 'COMP101', credits: 4, section: '01', time: 'Thu 14:00–16:00' },
      { action: 'Add', courseCode: 'COMP201', credits: 4, section: '02', time: 'Wed 14:00–16:00', fee: 0 },
    ],
    schedule: [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }],
    approvalLog: [{ at: '2026-07-12 11:00', actor: 'AC COS', action: 'Forwarded' }],
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
    submittedAt: '2026-07-04 16:00',
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
    submittedAt: '2026-07-03 14:00',
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
    submittedAt: '2026-07-02 11:00',
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

export const addDropApprovalQueue = ref(initialQueue.map((item) => ({ ...item })))

export function classifyAddDropBucket(row, tab) {
  if (tab === 'pending') return row.status === 'Pending' ? 'pending' : null
  if (tab === 'submitted') return row.status === 'In Review' ? 'submitted' : null
  if (tab === 'history') return ['Approved', 'Rejected', 'Cancelled'].includes(row.status) ? 'history' : null
  return null
}

export function filterAddDropQueue(rows, tab, filters = {}) {
  let list = rows.filter((row) => classifyAddDropBucket(row, tab))
  if (filters.programme) {
    list = list.filter((r) => r.programme.toLowerCase().includes(filters.programme.toLowerCase()))
  }
  if (filters.type) {
    list = list.filter((r) => r.type === filters.type)
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

export function approveAddDropApplication(id, comment = '', generateBill = true) {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]
  const validation = buildAddDropValidation(app)
  if (!validation.creditOk) return { ok: false, errorKey: 'courseRegistration.approval.creditExceeded' }
  const patch = {
    status: 'Approved',
    approvalLog: [
      ...app.approvalLog,
      {
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        actor: 'AC Demo',
        action: 'Approved',
        comment,
        stage: 'Academic Coordinator',
      },
    ],
  }
  const fee = app.items.reduce((sum, i) => sum + (i.fee || 0), 0)
  if (generateBill && fee > 0) {
    patch.billStatus = 'pending'
    patch.billAmount = fee
  }
  addDropApprovalQueue.value[index] = { ...app, ...patch }

  const currentId = getStudentProfileFields().studentId
  if (app.studentId === currentId) {
    for (const item of app.items || []) {
      if (item.action === 'Drop' && item.courseCode) {
        dropConfirmedCourseByCode(item.courseCode)
      }
    }
    confirmCoursesFromAddDropItems(app.items || [])
  }

  if (generateBill && fee > 0) {
    appendFeeRosterFromApproval({ ...app, ...patch })
  }

  return { ok: true }
}

export function rejectAddDropApplication(id, comment = '') {
  const index = addDropApprovalQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const app = addDropApprovalQueue.value[index]
  addDropApprovalQueue.value[index] = {
    ...app,
    status: 'Rejected',
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
  if (action === 'Approved') return approveAddDropApplication(id, comment, generateBill)
  if (action === 'Rejected') return rejectAddDropApplication(id, comment)
  if (action === 'Update Required') return requestAddDropUpdate(id, comment)
  return { ok: false, errorKey: 'courseRegistration.approval.invalidAction' }
}

/** 本期申请类型（不含 Replace） */
export const addDropTypeOptions = ['Add', 'Drop', 'Retake', 'AddDrop']

let studentAdrSeq = 9005

/** 是否允许学生发起申请：窗口内，或已在补注册名单 */
export function canStudentSubmitAddDrop(studentId, batch = getActiveBatch()) {
  if (isWithinAddDropApplicationWindow(batch)) {
    return { ok: true, via: 'window' }
  }
  if (studentId && isStudentInSupplementList(studentId)) {
    return { ok: true, via: 'supplement' }
  }
  return { ok: false, errorKey: 'courseRegistration.student.addDropWindowClosedShort' }
}

export function submitStudentAddDropApplication(studentFields, items, options = {}) {
  if (!items?.length) return { ok: false, errorKey: 'courseRegistration.student.addDropEmpty' }

  const gate = canStudentSubmitAddDrop(studentFields.studentId, getActiveBatch())
  if (!gate.ok) return gate

  studentAdrSeq += 1
  const dropChannel = options.dropChannel || null
  const autoApproveSelfDrop =
    dropChannel === 'self' &&
    items.every((item) => item.action === 'Drop') &&
    Boolean(options.selfServiceNoApproval)

  const app = {
    id: `adr-stu-${studentAdrSeq}`,
    applicationNo: `ADR${new Date().getFullYear()}${String(studentAdrSeq).slice(-4)}`,
    studentId: studentFields.studentId,
    studentName: studentFields.studentName,
    programme: studentFields.programme,
    intake: studentFields.intake,
    type: options.type || (items.length > 1 ? 'AddDrop' : items[0].action),
    status: autoApproveSelfDrop ? 'Approved' : options.status || 'Pending',
    submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    academicSession: options.academicSession || '',
    currentCredits: options.currentCredits ?? 0,
    creditMax: options.creditMax ?? 20,
    billStatus: 'none',
    billAmount: 0,
    items,
    schedule: options.schedule || [],
    dropChannel,
    reason: options.reason || '',
    feeWaiver: options.feeWaiver ?? null,
    attachments: options.attachments || [],
    teachingWeek: options.teachingWeek,
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
  addDropApprovalQueue.value.unshift(app)

  if (autoApproveSelfDrop) {
    for (const item of items) {
      if (item.action === 'Drop' && item.courseCode) {
        dropConfirmedCourseByCode(item.courseCode)
      }
    }
  }

  return { ok: true, application: app, autoApproved: autoApproveSelfDrop, via: gate.via }
}

/** 是否已有实质审批动作（自助通过也算已开始，不可再取消） */
export function hasAddDropApprovalStarted(app) {
  return (app?.approvalLog || []).some((log) =>
    ['Approved', 'Rejected', 'Update Required'].includes(log.action),
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
  const at = new Date().toISOString().slice(0, 16).replace('T', ' ')
  addDropApprovalQueue.value[index] = {
    ...app,
    status: 'Cancelled',
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
