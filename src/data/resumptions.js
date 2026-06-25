import { isLocalCategory } from './students.js'
import { resolveApplicationSessionFromStudent } from './movementApplicationSession.js'
import { validateAcademicSessionOrder } from '../utils/normalizeAcademicSession.js'

export const resumptionStatusOptions = [
  'Draft',
  'In Progress',
  'Update Required',
  'Approved',
  'Rejected',
  'Cancelled',
]

export const semesterOptions = ['2023/04', '2023/09', '2024/02', '2024/04', '2024/09', '2025/02', '2025/09', '2026/02']

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

let nextId = 15
let nextAppSeq = 15

export function createResumptionId() {
  return nextId++
}

export function createApplicationId() {
  return `RES${String(nextAppSeq++).padStart(3, '0')}`
}

export function formatResumptionDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

import { formatMovementDate } from '../utils/formatMovementDate.js'

export function formatResumptionListDate(value) {
  return formatMovementDate(value)
}

export function formatApplicationDateDisplay(value) {
  return formatMovementDate(value)
}

export function createEmptyResumption() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: null,
    applicationId: '',
    studentId: '',
    status: 'Draft',
    approvalStage: '--',
    archived: false,
    submittedAt: null,
    dateOfApplication: today,
    applicationSession: '',
    fullName: '',
    originalIntake: '',
    programme: '',
    programmeLevel: '',
    nricPassport: '',
    nationality: '',
    personalEmail: '',
    phoneNumber: '',
    defermentSemester: '',
    resumptionSemester: '',
    attachment: null,
    declarationCorrect: false,
    declarationMaxDuration: false,
    approvalLog: [],
  }
}

export function getResumptionFormData(record) {
  if (!record) return createEmptyResumption()
  return {
    ...createEmptyResumption(),
    ...record,
    attachment: record.attachment ? { ...record.attachment } : null,
    approvalLog: (record.approvalLog || []).map((entry) => ({ ...entry })),
  }
}

export function normalizeResumption(raw) {
  const base = { ...createEmptyResumption(), ...raw }
  return {
    ...base,
    id: base.id ?? createResumptionId(),
    applicationId: base.applicationId || createApplicationId(),
    name: base.fullName || base.name || '',
    applicationDate: base.submittedAt || base.applicationDate || base.dateOfApplication || null,
    archived:
      base.archived === true ||
      ['Approved', 'Rejected', 'Cancelled'].includes(base.status),
  }
}

export function buildStudentSnapshotForResumption(student) {
  if (!student) return {}
  const basic = student.basicInfo || student
  const enrollment = student.enrollment || {}
  const contact = student.contact || {}
  const category = student.studentCategory || student.studentType || 'Local'

  const nricPassport = isLocalCategory(category)
    ? basic.icNo || ''
    : basic.passportNo || ''

  return {
    studentId: basic.studentId || student.studentId || '',
    fullName: basic.fullName || student.name || '',
    originalIntake: enrollment.intake || '',
    nricPassport,
    nationality: basic.nationality || '',
    programme: enrollment.programme || '',
    programmeLevel: enrollment.programmeLevel || '',
    personalEmail: contact.email || '',
    phoneNumber: contact.mobilePhone || '',
    applicationSession: resolveApplicationSessionFromStudent(student),
  }
}

const TERMINAL_STATUSES = new Set(['Approved', 'Rejected', 'Cancelled'])
const ACTIVE_STATUSES = new Set(['Draft', 'In Progress', 'Update Required'])

export function isArchivedResumption(item) {
  return item?.archived === true || TERMINAL_STATUSES.has(item?.status)
}

export function isPendingReview(item) {
  return item?.status === 'In Progress' && item?.approvalStage === 'Pending Review'
}

export function hasApprovalStarted(item) {
  return (item?.approvalLog || []).some((log) =>
    ['Approved', 'Rejected', 'Update Required'].includes(log.action),
  )
}

export function canEditResumption(item) {
  return item?.status === 'Draft' || item?.status === 'Update Required'
}

export function canDeleteResumption(item) {
  return item?.status === 'Draft'
}

export function canCancelResumption(item) {
  return isPendingReview(item) && !hasApprovalStarted(item)
}

export function canResubmitResumption(item) {
  return item?.status === 'Update Required'
}

export function canApproveResumption(item) {
  if (item?.status !== 'In Progress') return false
  return item.approvalStage !== '--' && item.approvalStage !== 'Approved'
}

export function hasActiveResumptionForStudent(studentId, list, excludeId = null) {
  const normalized = String(studentId || '').trim().toLowerCase()
  if (!normalized) return false
  return list.some(
    (item) =>
      item.id !== excludeId &&
      ACTIVE_STATUSES.has(item.status) &&
      String(item.studentId || '').trim().toLowerCase() === normalized,
  )
}

/** @deprecated use hasActiveResumptionForStudent */
export function hasPendingResumptionForStudent(studentId, list, excludeId = null) {
  return hasActiveResumptionForStudent(studentId, list, excludeId)
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'Draft':
      return 'status-draft'
    case 'In Progress':
      return 'status-progress'
    case 'Update Required':
      return 'status-update-required'
    case 'Approved':
      return 'status-approved'
    case 'Rejected':
      return 'status-rejected'
    case 'Cancelled':
      return 'status-cancelled'
    default:
      return ''
  }
}

export function validateResumptionForm(data, mode = 'submit', existingList = [], editingId = null) {
  const errors = {}

  function requireField(key, message) {
    if (!errors[key]) errors[key] = message
  }

  if (!String(data.studentId || '').trim()) {
    requireField('studentId', 'Student ID is required.')
  }

  if (mode === 'draft') {
    return { valid: Object.keys(errors).length === 0, errors }
  }

  if (!String(data.defermentSemester || '').trim()) {
    requireField('defermentSemester', 'Deferment Semester is required.')
  }
  if (!String(data.resumptionSemester || '').trim()) {
    requireField('resumptionSemester', 'Resumption Semester is required.')
  }
  if (!data.attachment?.fileName) {
    requireField('attachment', 'Supporting document is required.')
  }
  if (!data.declarationCorrect) {
    requireField('declarationCorrect', 'You must agree to the declaration.')
  }
  if (!data.declarationMaxDuration) {
    requireField('declarationMaxDuration', 'You must acknowledge the maximum study duration.')
  }

  if (
    mode === 'submit' &&
    hasActiveResumptionForStudent(data.studentId, existingList, editingId)
  ) {
    requireField('studentId', 'This student already has an active resumption application.')
  }

  validateAcademicSessionOrder(
    {
      intake: data.originalIntake,
      applicationSession: data.applicationSession,
      effectiveSession: data.resumptionSemester,
    },
    requireField,
    { effectiveSession: 'resumptionSemester' },
  )

  return { valid: Object.keys(errors).length === 0, errors }
}

function appendLog(item, entry) {
  const logId = (item.approvalLog?.length || 0) + 1
  return {
    ...item,
    approvalLog: [...(item.approvalLog || []), { id: logId, ...entry }],
  }
}

export function prepareDraftPayload(form, meta = {}) {
  const now = new Date().toISOString()
  return normalizeResumption({
    ...form,
    status: 'Draft',
    approvalStage: '--',
    archived: false,
    dateOfApplication: form.dateOfApplication || now.slice(0, 10),
    ...meta,
  })
}

export function saveDraftApplication(form, meta = {}) {
  return prepareDraftPayload(form, meta)
}

export function submitApplication(item, actor = 'Student') {
  const now = formatResumptionDateTime(new Date())
  const submittedAt = new Date().toISOString()
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Submitted',
    dateTime: now,
    comment: 'Resumption application submitted for review.',
  })
  return normalizeResumption({
    ...updated,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    archived: false,
    submittedAt,
    applicationDate: submittedAt,
    dateOfApplication: item.dateOfApplication || submittedAt.slice(0, 10),
  })
}

export function cancelApplication(item, actor = 'Student') {
  const now = formatResumptionDateTime(new Date())
  let updated = appendLog(item, {
    stage: item.approvalStage || 'Pending Review',
    actor,
    action: 'Cancelled',
    dateTime: now,
    comment: 'Application cancelled by student.',
  })
  return normalizeResumption({
    ...updated,
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    cancelledAt: new Date().toISOString(),
  })
}

export function resubmitApplication(item, actor = 'Student') {
  const now = formatResumptionDateTime(new Date())
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Resubmitted',
    dateTime: now,
    comment: 'Application resubmitted after update.',
  })
  return normalizeResumption({
    ...updated,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    archived: false,
  })
}

/** @deprecated use submitApplication after saveDraftApplication */
export function submitResumptionApplication(form, actor = 'Student') {
  const draft = saveDraftApplication(form)
  return submitApplication(draft, actor)
}

function buildRecord(partial) {
  return normalizeResumption(partial)
}

export const initialResumptions = [
  // —— Approved ×2 ——
  buildRecord({
    id: 2,
    applicationId: 'RES002',
    studentId: 'XMUM2309001',
    fullName: 'Tan Wei Ming',
    originalIntake: '2023/09',
    nricPassport: '010101010101',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    personalEmail: 'tan.weiming@student.xmum.edu.my',
    phoneNumber: '0123456789',
    defermentSemester: '2024/02',
    resumptionSemester: '2025/02',
    attachment: { fileName: 'payment-receipt.pdf', size: 180000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Approved',
    approvalStage: 'Approved',
    implemented: 'Implemented',
    archived: true,
    submittedAt: '2024-06-01T10:00:00.000Z',
    dateOfApplication: '2024-05-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Tan Wei Ming', action: 'Submitted', dateTime: '01.06.2024 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '05.06.2024 14:00', comment: 'Initial review passed.' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', action: 'Approved', dateTime: '10.06.2024 11:00', comment: 'Approved.' },
    ],
  }),
  buildRecord({
    id: 14,
    applicationId: 'RES014',
    studentId: 'XMUM2309002',
    fullName: 'Li Xiu',
    originalIntake: '2023/09',
    nricPassport: 'E12345678',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    personalEmail: 'li.xiu@student.xmum.edu.my',
    phoneNumber: '0139876543',
    defermentSemester: '2024/09',
    resumptionSemester: '2025/09',
    attachment: { fileName: 'li-clearance.pdf', size: 210000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Approved',
    approvalStage: 'Approved',
    archived: true,
    submittedAt: '2025-02-18T08:00:00.000Z',
    dateOfApplication: '2025-02-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Li Xiu', action: 'Submitted', dateTime: '18.02.2025 08:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '20.02.2025 11:00', comment: '' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', action: 'Approved', dateTime: '25.02.2025 14:00', comment: 'Final approval granted.' },
    ],
  }),
  // —— In Progress ×2 (Pending Review, 可 Cancel) ——
  buildRecord({
    id: 1,
    applicationId: 'RES001',
    studentId: 'XMUM2309003',
    fullName: 'John Doe',
    originalIntake: '2023/04',
    nricPassport: 'GB1234567',
    nationality: 'United Kingdom',
    programme: 'Bachelor of International Business',
    programmeLevel: 'Undergraduate',
    personalEmail: 'john.doe@student.xmum.edu.my',
    phoneNumber: '0145566778',
    defermentSemester: '2023/09',
    resumptionSemester: '2024/04',
    attachment: { fileName: 'medical-clearance.pdf', size: 245000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    submittedAt: '2024-01-15T08:00:00.000Z',
    dateOfApplication: '2024-01-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'John Doe', action: 'Submitted', dateTime: '15.01.2024 08:00', comment: 'Resumption application submitted for review.' },
    ],
  }),
  buildRecord({
    id: 7,
    applicationId: 'RES007',
    studentId: 'XMUM2309012',
    fullName: 'Ahmad Rizal',
    originalIntake: '2023/09',
    nricPassport: '020202020202',
    nationality: 'Malaysia',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    personalEmail: 'ahmad.rizal@student.xmum.edu.my',
    phoneNumber: '0112233445',
    defermentSemester: '2025/02',
    resumptionSemester: '2025/09',
    attachment: { fileName: 'rizal-payment.pdf', size: 185000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    submittedAt: '2024-08-01T08:00:00.000Z',
    dateOfApplication: '2024-07-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Ahmad Rizal', action: 'Submitted', dateTime: '01.08.2024 08:00', comment: '' },
    ],
  }),
  // —— In Progress (Academic Affairs, 不可 Cancel) ——
  buildRecord({
    id: 8,
    applicationId: 'RES008',
    studentId: 'XMUM2309010',
    fullName: 'Sarah Chen',
    originalIntake: '2023/09',
    nricPassport: 'E87654321',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    personalEmail: 'sarah.chen@student.xmum.edu.my',
    phoneNumber: '0131112233',
    defermentSemester: '2024/09',
    resumptionSemester: '2025/02',
    attachment: { fileName: 'sarah-clearance.pdf', size: 210000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'In Progress',
    approvalStage: 'Academic Affairs',
    submittedAt: '2024-06-15T10:00:00.000Z',
    dateOfApplication: '2024-06-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Sarah Chen', action: 'Submitted', dateTime: '15.06.2024 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '20.06.2024 11:00', comment: 'Passed initial review.' },
    ],
  }),
  // —— Draft ×2 ——
  buildRecord({
    id: 3,
    applicationId: 'RES003',
    studentId: 'XMUM2309020',
    fullName: 'Wong Mei Ling',
    originalIntake: '2024/09',
    nricPassport: '040404040404',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    status: 'Draft',
    approvalStage: '--',
    approvalLog: [],
  }),
  buildRecord({
    id: 6,
    applicationId: 'RES006',
    studentId: 'XMUM2309021',
    fullName: 'David Tan',
    originalIntake: '2023/09',
    nricPassport: '090909090909',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'david.tan@student.xmum.edu.my',
    defermentSemester: '2025/09',
    resumptionSemester: '2026/02',
    status: 'Draft',
    approvalStage: '--',
    approvalLog: [],
  }),
  // —— Update Required ×2 ——
  buildRecord({
    id: 4,
    applicationId: 'RES004',
    studentId: 'XMUM2309016',
    fullName: 'Ng Jia Hui',
    originalIntake: '2023/04',
    nricPassport: '050505050505',
    nationality: 'Malaysia',
    programme: 'Bachelor of International Business',
    programmeLevel: 'Undergraduate',
    personalEmail: 'ng.jiahui@student.xmum.edu.my',
    phoneNumber: '0189900112',
    defermentSemester: '2025/02',
    resumptionSemester: '2025/09',
    attachment: { fileName: 'ng-medical.pdf', size: 95000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Update Required',
    approvalStage: '--',
    submittedAt: '2024-06-15T10:00:00.000Z',
    dateOfApplication: '2024-06-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Ng Jia Hui', action: 'Submitted', dateTime: '15.06.2024 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Update Required', dateTime: '20.06.2024 14:00', comment: 'Please attach updated medical clearance.' },
    ],
  }),
  buildRecord({
    id: 11,
    applicationId: 'RES011',
    studentId: 'XMUM2309017',
    fullName: 'Raj Kumar',
    originalIntake: '2023/09',
    nricPassport: '070707070707',
    nationality: 'Malaysia',
    programme: 'Bachelor of Accounting',
    programmeLevel: 'Undergraduate',
    personalEmail: 'raj.kumar@student.xmum.edu.my',
    phoneNumber: '0145566778',
    defermentSemester: '2024/09',
    resumptionSemester: '2025/02',
    attachment: { fileName: 'raj-medical.pdf', size: 88000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Update Required',
    approvalStage: '--',
    submittedAt: '2024-04-01T08:00:00.000Z',
    dateOfApplication: '2024-03-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Raj Kumar', action: 'Submitted', dateTime: '01.04.2024 08:00', comment: '' },
      { id: 2, stage: 'Academic Affairs', actor: 'System Admin', action: 'Update Required', dateTime: '05.04.2024 09:30', comment: 'Please provide complete payment receipt.' },
    ],
  }),
  // —— Cancelled ×2 ——
  buildRecord({
    id: 9,
    applicationId: 'RES009',
    studentId: 'XMUM2309014',
    fullName: 'Lim Wei Jie',
    originalIntake: '2024/09',
    nricPassport: '060606060606',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'lim.weijie@student.xmum.edu.my',
    phoneNumber: '0190011223',
    defermentSemester: '2025/09',
    resumptionSemester: '2026/02',
    attachment: { fileName: 'lim-consent.pdf', size: 110000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-08-01T08:00:00.000Z',
    cancelledAt: '2024-08-03T10:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Lim Wei Jie', action: 'Submitted', dateTime: '01.08.2024 08:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'Lim Wei Jie', action: 'Cancelled', dateTime: '03.08.2024 10:00', comment: 'Application cancelled by student.' },
    ],
  }),
  buildRecord({
    id: 10,
    applicationId: 'RES010',
    studentId: 'XMUM2309015',
    fullName: 'Chen Yu Ting',
    originalIntake: '2023/09',
    nricPassport: 'E11223344',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    personalEmail: 'chen.yuting@student.xmum.edu.my',
    defermentSemester: '2025/02',
    resumptionSemester: '2025/09',
    attachment: { fileName: 'chen-consent.pdf', size: 130000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-09-10T09:00:00.000Z',
    cancelledAt: '2024-09-11T11:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Chen Yu Ting', action: 'Submitted', dateTime: '10.09.2024 09:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'Chen Yu Ting', action: 'Cancelled', dateTime: '11.09.2024 11:00', comment: 'Application cancelled by student.' },
    ],
  }),
  // —— Rejected ×2 ——
  buildRecord({
    id: 12,
    applicationId: 'RES012',
    studentId: 'XMUM2309018',
    fullName: 'Siti Aminah',
    originalIntake: '2024/09',
    nricPassport: '080808080808',
    nationality: 'Malaysia',
    programme: 'Bachelor of Data Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'siti.aminah@student.xmum.edu.my',
    defermentSemester: '2025/09',
    resumptionSemester: '2026/02',
    attachment: { fileName: 'siti-docs.pdf', size: 102000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-05-10T10:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Siti Aminah', action: 'Submitted', dateTime: '10.05.2024 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Rejected', dateTime: '15.05.2024 11:00', comment: 'Outstanding dues not cleared.' },
    ],
  }),
  buildRecord({
    id: 13,
    applicationId: 'RES013',
    studentId: 'XMUM2309019',
    fullName: 'Priya Sharma',
    originalIntake: '2024/09',
    nricPassport: '030303030303',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'priya.sharma@student.xmum.edu.my',
    defermentSemester: '2025/02',
    resumptionSemester: '2025/09',
    attachment: { fileName: 'priya-medical.pdf', size: 98000 },
    declarationCorrect: true,
    declarationMaxDuration: true,
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-07-01T08:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Priya Sharma', action: 'Submitted', dateTime: '01.07.2024 08:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '05.07.2024 10:00', comment: '' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', action: 'Rejected', dateTime: '12.07.2024 14:00', comment: 'Programme intake is not available for the requested semester.' },
    ],
  }),
]
