import { ref } from 'vue'
import {
  computeCreditsAfterApproval,
  detectScheduleConflict,
  suggestApprovalOrder,
} from './registrationRules.js'

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
    submittedAt: '10-Sep-2025 09:15',
    currentCredits: 18,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
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
    submittedAt: '11-Sep-2025 14:20',
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
    submittedAt: '11-Sep-2025 16:45',
    currentCredits: 20,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [
      {
        action: 'Retake',
        courseCode: 'MATH201',
        credits: 4,
        section: '01',
        time: 'Fri 14:00–16:00',
        retakeGrade: 'M',
        fee: 0,
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
    submittedAt: '05-Sep-2025 11:00',
    currentCredits: 16,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [{ action: 'Drop', courseCode: 'MPU3183', credits: 3, section: '01', time: 'Tue 09:00–12:00' }],
    schedule: [],
    approvalLog: [{ at: '05-Sep-2025 15:30', actor: 'AC COS', action: 'Approved' }],
  },
  {
    id: 'adr-005',
    applicationNo: 'ADR2509004',
    studentId: 'COS2409022',
    studentName: 'Priya Devi',
    programme: 'COS',
    intake: '2409',
    type: 'Replace',
    status: 'In Review',
    submittedAt: '12-Sep-2025 10:00',
    currentCredits: 12,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [
      { action: 'Drop', courseCode: 'COMP101', credits: 4, section: '01', time: 'Thu 14:00–16:00' },
      { action: 'Replace', courseCode: 'COMP201', credits: 4, section: '02', time: 'Wed 14:00–16:00', fee: 0 },
    ],
    schedule: [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }],
    approvalLog: [{ at: '12-Sep-2025 11:00', actor: 'AC COS', action: 'Forwarded to HOP' }],
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
    submittedAt: '04-Sep-2025 16:00',
    currentCredits: 20,
    creditMax: 20,
    billStatus: 'none',
    billAmount: 0,
    items: [{ action: 'Add', courseCode: 'MATH201', credits: 4, section: '01', time: 'Fri 14:00–16:00', fee: 320 }],
    schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
    approvalLog: [{ at: '05-Sep-2025 09:00', actor: 'AC DSA', action: 'Rejected', comment: 'Credit max exceeded' }],
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
    submittedAt: '03-Sep-2025 14:00',
    currentCredits: 14,
    creditMax: 20,
    billStatus: 'paid',
    billAmount: 480,
    items: [{ action: 'Retake', courseCode: 'COMP101', credits: 4, section: '01', time: 'Mon 08:00–10:00', retakeGrade: 'F', fee: 480 }],
    schedule: [],
    approvalLog: [{ at: '04-Sep-2025 10:00', actor: 'AC AIT', action: 'Approved' }],
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
    submittedAt: '02-Sep-2025 11:00',
    currentCredits: 0,
    creditMax: 20,
    billStatus: 'cancelled',
    billAmount: 320,
    items: [{ action: 'Add', courseCode: 'COMP201', credits: 4, section: '01', time: 'Mon 10:00–12:00', fee: 320 }],
    schedule: [],
    approvalLog: [
      { at: '02-Sep-2025 15:00', actor: 'AC COS', action: 'Approved' },
      { at: '04-Sep-2025 15:00', actor: 'System', action: 'Cancelled', comment: 'Bill unpaid 48h' },
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
    .filter((i) => ['Add', 'Retake', 'Replace'].includes(i.action))
    .reduce((sum, i) => sum + i.credits, 0)
  const creditsAfter = computeCreditsAfterApproval(application.currentCredits, dropCredits, addCredits)
  const creditOk = creditsAfter <= application.creditMax
  const addItem = application.items.find((i) => ['Add', 'Retake', 'Replace'].includes(i.action))
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
      { at: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'AC Demo', action: 'Approved', comment },
    ],
  }
  const fee = app.items.reduce((sum, i) => sum + (i.fee || 0), 0)
  if (generateBill && fee > 0) {
    patch.billStatus = 'pending'
    patch.billAmount = fee
  }
  addDropApprovalQueue.value[index] = { ...app, ...patch }
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
      { at: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'AC Demo', action: 'Rejected', comment },
    ],
  }
  return { ok: true }
}

export const addDropTypeOptions = ['Add', 'Drop', 'Retake', 'Replace', 'AddDrop']

let studentAdrSeq = 9005

export function submitStudentAddDropApplication(studentFields, items, options = {}) {
  if (!items?.length) return { ok: false, errorKey: 'courseRegistration.student.addDropEmpty' }
  studentAdrSeq += 1
  const app = {
    id: `adr-stu-${studentAdrSeq}`,
    applicationNo: `ADR${new Date().getFullYear()}${String(studentAdrSeq).slice(-4)}`,
    studentId: studentFields.studentId,
    studentName: studentFields.studentName,
    programme: studentFields.programme,
    intake: studentFields.intake,
    type: options.type || (items.length > 1 ? 'AddDrop' : items[0].action),
    status: 'Pending',
    submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    currentCredits: options.currentCredits ?? 0,
    creditMax: options.creditMax ?? 20,
    billStatus: 'none',
    billAmount: 0,
    items,
    schedule: options.schedule || [],
    approvalLog: [],
  }
  addDropApprovalQueue.value.unshift(app)
  return { ok: true, application: app }
}
