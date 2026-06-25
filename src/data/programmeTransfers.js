import { isLocalCategory } from './students.js'
import { resolveApplicationSessionFromStudent } from './movementApplicationSession.js'
import { validateAcademicSessionOrder } from '../utils/normalizeAcademicSession.js'
import {
  PT_OTHERS_REASON_ID,
  resolveReasonIdByName,
  resolveReasonLabel,
  isValidReasonIdForCategory,
} from './movementCategories.js'

const PT_CATEGORY_CODE = 'PT001'

export const TRANSFER_TYPE = 'Programme Transfer'

export const transferStatusOptions = [
  'Draft',
  'In Progress',
  'Update Required',
  'Approved',
  'Rejected',
  'Cancelled',
  'Expired',
]

export const programmeOptions = [
  'Bachelor of Software Engineering',
  'Bachelor of Computer Science',
  'Bachelor of Finance',
  'Bachelor of International Business',
  'Bachelor of Accounting',
  'Bachelor of Data Science',
]

export const intakeOptions = ['2023/09', '2024/02', '2024/09', '2025/02', '2025/09']

export const semesterOptions = ['2024/09', '2025/02', '2025/09', '2026/02']

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getTransferReasonDisplay(item) {
  const fromConfig = resolveReasonLabel(PT_CATEGORY_CODE, item?.reasonId)
  if (fromConfig) return fromConfig
  return item?.transferReason || ''
}

function syncTransferReasonFields(base) {
  let reasonId = base.reasonId
  if (!isValidReasonIdForCategory(PT_CATEGORY_CODE, reasonId)) {
    reasonId =
      resolveReasonIdByName(PT_CATEGORY_CODE, base.transferReason) ??
      (String(base.transferReason || '').trim() ? PT_OTHERS_REASON_ID : null)
  }
  const transferReason =
    resolveReasonLabel(PT_CATEGORY_CODE, reasonId) || base.transferReason || ''
  return { reasonId, transferReason }
}

let nextId = 15
let nextAppSeq = 15

export function createTransferId() {
  return nextId++
}

export function createApplicationId() {
  return `TRF${String(nextAppSeq++).padStart(3, '0')}`
}

export function formatTransferDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

import { formatMovementDate } from '../utils/formatMovementDate.js'

export function formatTransferListDate(value) {
  return formatMovementDate(value)
}

export function createEmptyTransfer() {
  return {
    id: null,
    applicationId: '',
    studentId: '',
    type: TRANSFER_TYPE,
    status: 'Draft',
    approvalStage: '--',
    archived: false,
    submittedAt: null,
    cancelledAt: null,
    expiredAt: null,
    applicationDeadline: '2026-12-31',
    applicationSession: '',
    targetSemester: '',
    fullName: '',
    nricPassport: '',
    nationality: '',
    email: '',
    contactNo: '',
    visaExpiryDate: '',
    currentProgramme: '',
    currentIntake: '',
    currentSchool: '',
    newProgrammeFirstChoice: '',
    newProgrammeSecondChoice: '',
    startSemester: '',
    reasonId: null,
    transferReason: '',
    declarationAgreed: false,
    attachment: null,
    adminNewProgramme: '',
    adminNewIntake: '',
    adminDate: '',
    approvalLog: [],
  }
}

export function getTransferFormData(record) {
  if (!record) return createEmptyTransfer()
  return {
    ...createEmptyTransfer(),
    ...record,
    attachment: record.attachment ? { ...record.attachment } : null,
    approvalLog: (record.approvalLog || []).map((entry) => ({ ...entry })),
  }
}

export function normalizeTransfer(raw) {
  const base = { ...createEmptyTransfer(), ...raw }
  const { reasonId, transferReason } = syncTransferReasonFields(base)
  const newProgramme =
    base.adminNewProgramme ||
    base.newProgrammeFirstChoice ||
    base.newProgramme ||
    ''

  return {
    ...base,
    id: base.id ?? createTransferId(),
    applicationId: base.applicationId || createApplicationId(),
    type: TRANSFER_TYPE,
    reasonId,
    name: base.fullName || base.name || '',
    oldProgramme: base.currentProgramme || base.oldProgramme || '',
    newProgramme,
    transferReason,
    applicationDate: base.submittedAt || base.applicationDate || base.createdAt || null,
    archived:
      base.archived === true ||
      ['Approved', 'Rejected', 'Cancelled', 'Expired'].includes(base.status),
  }
}

export function buildStudentSnapshotFromProfile(student) {
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
    nricPassport,
    nationality: basic.nationality || '',
    email: contact.email || '',
    contactNo: contact.mobilePhone || '',
    visaExpiryDate: basic.passportExpiry || '',
    currentProgramme: enrollment.programme || '',
    currentIntake: enrollment.intake || '',
    currentSchool: enrollment.faculty || '',
    applicationSession: resolveApplicationSessionFromStudent(student),
  }
}

const TERMINAL_STATUSES = new Set(['Approved', 'Rejected', 'Cancelled', 'Expired'])
const ACTIVE_STATUSES = new Set(['Draft', 'In Progress', 'Update Required'])

export function isArchivedTransfer(item) {
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

export function canEditTransfer(item) {
  return item?.status === 'Draft' || item?.status === 'Update Required'
}

export function canDeleteTransfer(item) {
  return item?.status === 'Draft'
}

export function canCancelTransfer(item) {
  return isPendingReview(item) && !hasApprovalStarted(item)
}

export function canResubmitTransfer(item) {
  return item?.status === 'Update Required'
}

export function canApproveTransfer(item) {
  if (item?.status !== 'In Progress') return false
  return item.approvalStage !== '--' && item.approvalStage !== 'Approved'
}

export function canEditSectionSeven(item) {
  return canApproveTransfer(item) && item.approvalStage === 'Academic Affairs'
}

export function hasActiveTransferForStudent(studentId, list, excludeId = null) {
  const normalized = String(studentId || '').trim().toLowerCase()
  if (!normalized) return false
  return list.some(
    (item) =>
      item.id !== excludeId &&
      ACTIVE_STATUSES.has(item.status) &&
      String(item.studentId || '').trim().toLowerCase() === normalized,
  )
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
    case 'Expired':
      return 'status-expired'
    default:
      return ''
  }
}

export function validateTransferForm(data, mode = 'submit', existingList = [], editingId = null) {
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

  if (!String(data.newProgrammeFirstChoice || '').trim()) {
    requireField('newProgrammeFirstChoice', 'New Programme (1st Choice) is required.')
  }
  if (!String(data.startSemester || '').trim()) {
    requireField('startSemester', 'Start Semester is required.')
  }
  if (!isValidReasonIdForCategory(PT_CATEGORY_CODE, data.reasonId)) {
    requireField('reasonId', 'Reasons to transfer are required.')
  }
  if (!data.declarationAgreed) {
    requireField('declarationAgreed', 'You must agree to the declaration.')
  }
  if (!data.attachment?.fileName) {
    requireField('attachment', 'Supporting document is required.')
  }

  if (
    mode === 'submit' &&
    hasActiveTransferForStudent(data.studentId, existingList, editingId)
  ) {
    requireField('studentId', 'This student already has an active transfer application.')
  }

  validateAcademicSessionOrder(
    {
      intake: data.currentIntake,
      applicationSession: data.applicationSession,
      effectiveSession: data.startSemester,
    },
    requireField,
    { effectiveSession: 'startSemester' },
  )

  return { valid: Object.keys(errors).length === 0, errors }
}

function appendLog(item, entry) {
  const nextId = (item.approvalLog?.length || 0) + 1
  return {
    ...item,
    approvalLog: [...(item.approvalLog || []), { id: nextId, ...entry }],
  }
}

export function prepareDraftPayload(form, meta = {}) {
  const now = new Date().toISOString()
  return normalizeTransfer({
    ...form,
    status: 'Draft',
    approvalStage: '--',
    archived: false,
    applicationDate: form.applicationDate || now,
    ...meta,
  })
}

export function saveDraftApplication(form, meta = {}) {
  return prepareDraftPayload(form, meta)
}

export function submitApplication(item, actor = 'Student') {
  const now = formatTransferDateTime(new Date())
  const submittedAt = new Date().toISOString()
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Submitted',
    dateTime: now,
    comment: 'Application submitted for review.',
  })
  return normalizeTransfer({
    ...updated,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    archived: false,
    submittedAt,
    applicationDate: submittedAt,
  })
}

export function cancelApplication(item, actor = 'Student') {
  const now = formatTransferDateTime(new Date())
  let updated = appendLog(item, {
    stage: item.approvalStage || 'Pending Review',
    actor,
    action: 'Cancelled',
    dateTime: now,
    comment: 'Application cancelled by student.',
  })
  return normalizeTransfer({
    ...updated,
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    cancelledAt: new Date().toISOString(),
  })
}

export function resubmitApplication(item, actor = 'Student') {
  const now = formatTransferDateTime(new Date())
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Resubmitted',
    dateTime: now,
    comment: 'Application resubmitted after update.',
  })
  return normalizeTransfer({
    ...updated,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    archived: false,
  })
}

export function isTransferExpired(item, referenceDate = new Date()) {
  if (!['Draft', 'Update Required'].includes(item?.status)) return false
  if (!item?.applicationDeadline) return false
  const deadline = new Date(item.applicationDeadline)
  return !Number.isNaN(deadline.getTime()) && referenceDate > deadline
}

function buildRecord(partial) {
  return normalizeTransfer(partial)
}

export const initialProgrammeTransfers = [
  // —— In Progress ×2 ——
  buildRecord({
    id: 1,
    applicationId: 'TRF001',
    studentId: 'XMUM2309001',
    fullName: 'Tan Wei Ming',
    nricPassport: '010101010101',
    nationality: 'Malaysia',
    email: 'tan.weiming@student.xmum.edu.my',
    contactNo: '0123456789',
    currentProgramme: 'Bachelor of Software Engineering',
    currentIntake: '2023/09',
    currentSchool: 'School of Computing',
    newProgrammeFirstChoice: 'Bachelor of Computer Science',
    newProgrammeSecondChoice: 'Bachelor of Data Science',
    startSemester: '2025/09',
    transferReason: 'I wish to pursue computer science specialisation aligned with my career goals.',
    declarationAgreed: true,
    attachment: { fileName: 'consent-letter.pdf', size: 245000 },
    status: 'In Progress',
    approvalStage: 'Pending Review',
    submittedAt: '2023-10-15T08:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Tan Wei Ming',
        action: 'Submitted',
        dateTime: '15.10.2023 08:00',
        comment: 'Application submitted for review.',
      },
    ],
  }),
  buildRecord({
    id: 7,
    applicationId: 'TRF007',
    studentId: 'XMUM2309012',
    fullName: 'Ahmad Rizal',
    nricPassport: '020202020202',
    nationality: 'Malaysia',
    email: 'ahmad.rizal@student.xmum.edu.my',
    contactNo: '0112233445',
    currentProgramme: 'Bachelor of Finance',
    currentIntake: '2023/09',
    currentSchool: 'School of Business',
    newProgrammeFirstChoice: 'Bachelor of Accounting',
    newProgrammeSecondChoice: 'Bachelor of Data Science',
    startSemester: '2025/02',
    transferReason: 'Seeking accounting accreditation for professional certification.',
    declarationAgreed: true,
    attachment: { fileName: 'rizal-consent.pdf', size: 198000 },
    status: 'In Progress',
    approvalStage: 'Academic Affairs',
    submittedAt: '2024-03-01T09:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Ahmad Rizal',
        action: 'Submitted',
        dateTime: '01.03.2024 09:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Pending Review',
        actor: 'System Admin',
        action: 'Approved',
        dateTime: '05.03.2024 10:30',
        comment: 'Initial review passed.',
      },
    ],
  }),
  // —— Approved ×2 ——
  buildRecord({
    id: 2,
    applicationId: 'TRF002',
    studentId: 'XMUM2309003',
    fullName: 'John Doe',
    nricPassport: 'GB1234567',
    nationality: 'United Kingdom',
    email: 'john.doe@student.xmum.edu.my',
    contactNo: '0145566778',
    currentProgramme: 'Bachelor of International Business',
    currentIntake: '2023/04',
    currentSchool: 'School of Business',
    newProgrammeFirstChoice: 'Bachelor of Finance',
    startSemester: '2024/09',
    transferReason: 'Career interest in finance and banking sector.',
    declarationAgreed: true,
    attachment: { fileName: 'supporting-docs.pdf', size: 512000 },
    adminNewProgramme: 'Bachelor of Finance',
    adminNewIntake: '2024/09',
    adminDate: '2023-09-20',
    status: 'Approved',
    approvalStage: 'Approved',
    implemented: 'Implemented',
    archived: true,
    submittedAt: '2023-09-01T10:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'John Doe',
        action: 'Submitted',
        dateTime: '01.09.2023 10:00',
        comment: '',
      },
      {
        id: 2,
        stage: 'Dean/HoP',
        actor: 'System Admin',
        action: 'Approved',
        dateTime: '20.09.2023 14:30',
        comment: 'Final approval granted.',
      },
    ],
  }),
  buildRecord({
    id: 14,
    applicationId: 'TRF014',
    studentId: 'XMUM2309019',
    fullName: 'Priya Sharma',
    nricPassport: '030303030303',
    nationality: 'Malaysia',
    email: 'priya.sharma@student.xmum.edu.my',
    contactNo: '0167788990',
    currentProgramme: 'Bachelor of Computer Science',
    currentIntake: '2024/09',
    currentSchool: 'School of Computing',
    newProgrammeFirstChoice: 'Bachelor of Data Science',
    startSemester: '2025/09',
    transferReason: 'Interest in data analytics and machine learning career path.',
    declarationAgreed: true,
    attachment: { fileName: 'priya-support.pdf', size: 275000 },
    adminNewProgramme: 'Bachelor of Data Science',
    adminNewIntake: '2025/09',
    adminDate: '2025-02-18',
    status: 'Approved',
    approvalStage: 'Approved',
    archived: true,
    submittedAt: '2025-01-20T08:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Priya Sharma',
        action: 'Submitted',
        dateTime: '20.01.2025 08:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Pending Review',
        actor: 'System Admin',
        action: 'Approved',
        dateTime: '25.01.2025 11:00',
        comment: 'Documents verified.',
      },
      {
        id: 3,
        stage: 'Dean/HoP',
        actor: 'System Admin',
        action: 'Approved',
        dateTime: '18.02.2025 15:00',
        comment: 'Final approval granted.',
      },
    ],
  }),
  // —— Draft ×2 ——
  buildRecord({
    id: 3,
    applicationId: 'TRF003',
    studentId: 'XMUM2309002',
    fullName: 'Li Xiu',
    nricPassport: 'E12345678',
    nationality: 'China',
    email: 'li.xiu@student.xmum.edu.my',
    contactNo: '0139876543',
    currentProgramme: 'Bachelor of Finance',
    currentIntake: '2023/09',
    currentSchool: 'School of Business',
    newProgrammeFirstChoice: '',
    startSemester: '',
    transferReason: '',
    status: 'Draft',
    approvalStage: '--',
    applicationDeadline: '2026-12-31',
    approvalLog: [],
  }),
  buildRecord({
    id: 6,
    applicationId: 'TRF006',
    studentId: 'XMUM2309011',
    fullName: 'Wong Mei Ling',
    nricPassport: '040404040404',
    nationality: 'Malaysia',
    email: 'wong.meiling@student.xmum.edu.my',
    contactNo: '0178899001',
    currentProgramme: 'Bachelor of Software Engineering',
    currentIntake: '2024/09',
    currentSchool: 'School of Computing',
    newProgrammeFirstChoice: 'Bachelor of Data Science',
    newProgrammeSecondChoice: 'Bachelor of Computer Science',
    startSemester: '2025/09',
    transferReason: 'Draft in progress — reasons to be finalised.',
    declarationAgreed: false,
    status: 'Draft',
    approvalStage: '--',
    applicationDeadline: '2026-12-31',
    approvalLog: [],
  }),
  // —— Update Required ×2 ——
  buildRecord({
    id: 4,
    applicationId: 'TRF004',
    studentId: 'XMUM2309010',
    fullName: 'Sarah Chen',
    nricPassport: 'E87654321',
    nationality: 'China',
    email: 'sarah.chen@student.xmum.edu.my',
    contactNo: '0131112233',
    currentProgramme: 'Bachelor of Finance',
    currentIntake: '2023/09',
    currentSchool: 'School of Business',
    newProgrammeFirstChoice: 'Bachelor of Accounting',
    startSemester: '2025/02',
    transferReason: 'Please update the supporting documents and reason details.',
    declarationAgreed: true,
    attachment: { fileName: 'draft-letter.pdf', size: 120000 },
    status: 'Update Required',
    approvalStage: '--',
    applicationDeadline: '2026-12-31',
    submittedAt: '2024-01-10T09:00:00.000Z',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Sarah Chen',
        action: 'Submitted',
        dateTime: '10.01.2024 09:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Academic Affairs',
        actor: 'System Admin',
        action: 'Update Required',
        dateTime: '12.01.2024 11:00',
        comment: 'Please provide more detailed reasons and updated consent letter.',
      },
    ],
  }),
  buildRecord({
    id: 11,
    applicationId: 'TRF011',
    studentId: 'XMUM2309016',
    fullName: 'Ng Jia Hui',
    nricPassport: '050505050505',
    nationality: 'Malaysia',
    email: 'ng.jiahui@student.xmum.edu.my',
    contactNo: '0189900112',
    currentProgramme: 'Bachelor of International Business',
    currentIntake: '2023/04',
    currentSchool: 'School of Business',
    newProgrammeFirstChoice: 'Bachelor of Finance',
    startSemester: '2025/02',
    transferReason: 'Incomplete financial supporting documents attached.',
    declarationAgreed: true,
    attachment: { fileName: 'ng-support.pdf', size: 95000 },
    status: 'Update Required',
    approvalStage: '--',
    applicationDeadline: '2026-12-31',
    submittedAt: '2024-06-15T10:00:00.000Z',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Ng Jia Hui',
        action: 'Submitted',
        dateTime: '15.06.2024 10:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Dean/HoP',
        actor: 'System Admin',
        action: 'Update Required',
        dateTime: '20.06.2024 14:00',
        comment: 'Please attach updated parent consent letter.',
      },
    ],
  }),
  // —— Cancelled ×2 ——
  buildRecord({
    id: 9,
    applicationId: 'TRF009',
    studentId: 'XMUM2309014',
    fullName: 'Lim Wei Jie',
    nricPassport: '060606060606',
    nationality: 'Malaysia',
    email: 'lim.weijie@student.xmum.edu.my',
    contactNo: '0190011223',
    currentProgramme: 'Bachelor of Computer Science',
    currentIntake: '2024/09',
    currentSchool: 'School of Computing',
    newProgrammeFirstChoice: 'Bachelor of Software Engineering',
    startSemester: '2025/09',
    transferReason: 'Changed mind before review started.',
    declarationAgreed: true,
    attachment: { fileName: 'lim-consent.pdf', size: 110000 },
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-08-01T08:00:00.000Z',
    cancelledAt: '2024-08-03T10:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Lim Wei Jie',
        action: 'Submitted',
        dateTime: '01.08.2024 08:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Pending Review',
        actor: 'Lim Wei Jie',
        action: 'Cancelled',
        dateTime: '03.08.2024 10:00',
        comment: 'Application cancelled by student.',
      },
    ],
  }),
  buildRecord({
    id: 10,
    applicationId: 'TRF010',
    studentId: 'XMUM2309015',
    fullName: 'Chen Yu Ting',
    nricPassport: 'E11223344',
    nationality: 'China',
    email: 'chen.yuting@student.xmum.edu.my',
    contactNo: '0134455667',
    currentProgramme: 'Bachelor of Finance',
    currentIntake: '2023/09',
    currentSchool: 'School of Business',
    newProgrammeFirstChoice: 'Bachelor of International Business',
    startSemester: '2025/02',
    transferReason: 'Decided to remain in current programme.',
    declarationAgreed: true,
    attachment: { fileName: 'chen-consent.pdf', size: 130000 },
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-09-10T09:00:00.000Z',
    cancelledAt: '2024-09-11T11:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Chen Yu Ting',
        action: 'Submitted',
        dateTime: '10.09.2024 09:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Pending Review',
        actor: 'Chen Yu Ting',
        action: 'Cancelled',
        dateTime: '11.09.2024 11:00',
        comment: 'Application cancelled by student.',
      },
    ],
  }),
  // —— Rejected ×2 ——
  buildRecord({
    id: 12,
    applicationId: 'TRF012',
    studentId: 'XMUM2309017',
    fullName: 'Raj Kumar',
    nricPassport: '070707070707',
    nationality: 'Malaysia',
    email: 'raj.kumar@student.xmum.edu.my',
    contactNo: '0145566778',
    currentProgramme: 'Bachelor of Accounting',
    currentIntake: '2023/09',
    currentSchool: 'School of Business',
    newProgrammeFirstChoice: 'Bachelor of Finance',
    startSemester: '2025/02',
    transferReason: 'Seeking finance specialisation.',
    declarationAgreed: true,
    attachment: { fileName: 'raj-docs.pdf', size: 88000 },
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-04-01T08:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Raj Kumar',
        action: 'Submitted',
        dateTime: '01.04.2024 08:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Pending Review',
        actor: 'System Admin',
        action: 'Rejected',
        dateTime: '05.04.2024 09:30',
        comment: 'Insufficient supporting documents provided.',
      },
    ],
  }),
  buildRecord({
    id: 13,
    applicationId: 'TRF013',
    studentId: 'XMUM2309018',
    fullName: 'Siti Aminah',
    nricPassport: '080808080808',
    nationality: 'Malaysia',
    email: 'siti.aminah@student.xmum.edu.my',
    contactNo: '0156677889',
    currentProgramme: 'Bachelor of Data Science',
    currentIntake: '2024/09',
    currentSchool: 'School of Computing',
    newProgrammeFirstChoice: 'Bachelor of Software Engineering',
    startSemester: '2025/09',
    transferReason: 'Prefer software development track.',
    declarationAgreed: true,
    attachment: { fileName: 'siti-support.pdf', size: 102000 },
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-05-10T10:00:00.000Z',
    applicationDeadline: '2026-12-31',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Siti Aminah',
        action: 'Submitted',
        dateTime: '10.05.2024 10:00',
        comment: 'Application submitted for review.',
      },
      {
        id: 2,
        stage: 'Pending Review',
        actor: 'System Admin',
        action: 'Approved',
        dateTime: '15.05.2024 11:00',
        comment: 'Passed initial review.',
      },
      {
        id: 3,
        stage: 'Academic Affairs',
        actor: 'System Admin',
        action: 'Rejected',
        dateTime: '22.05.2024 14:00',
        comment: 'Transfer reason does not meet policy requirements.',
      },
    ],
  }),
  // —— Expired（Phase 1 演示，保留 1 条）——
  buildRecord({
    id: 5,
    applicationId: 'TRF005',
    studentId: 'AIT2402110',
    fullName: 'Elson Lai',
    nricPassport: '010101010101',
    nationality: 'Malaysia',
    email: 'elson.lai@student.xmum.edu.my',
    contactNo: '0123456789',
    currentProgramme: 'AIT',
    currentIntake: '2024/02',
    currentSchool: 'School of Foundation',
    newProgrammeFirstChoice: 'Bachelor of Data Science',
    startSemester: '2024/09',
    transferReason: 'Previous draft application.',
    status: 'Expired',
    approvalStage: '--',
    archived: true,
    applicationDeadline: '2024-06-30',
    expiredAt: '2024-07-01T00:00:00.000Z',
    approvalLog: [
      {
        id: 1,
        stage: '--',
        actor: 'System',
        action: 'Expired',
        dateTime: '01.07.2024 00:00',
        comment: 'Application expired due to deadline.',
      },
    ],
  }),
]
