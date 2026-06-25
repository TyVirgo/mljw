import { isLocalCategory } from './students.js'
import { resolveApplicationSessionFromStudent } from './movementApplicationSession.js'
import { validateAcademicSessionOrder, normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'
import {
  resolveReasonIdByName,
  resolveReasonLabel,
  isValidReasonIdForCategory,
} from './movementCategories.js'

const WDR_CATEGORY_CODE = 'WDR001'

export const withdrawalStatusOptions = [
  'Draft',
  'In Progress',
  'Update Required',
  'Approved',
  'Rejected',
  'Cancelled',
]

export const mainReasonOptions = [
  'Financial Problem',
  'Personal Reason',
  'Health Issue',
  'Academic Difficulty',
  'Others',
]

export const mainReasonI18nKeys = {
  'Financial Problem': 'financialProblem',
  'Personal Reason': 'personalReason',
  'Health Issue': 'healthIssue',
  'Academic Difficulty': 'academicDifficulty',
  Others: 'others',
}

export function getMainReasonLabel(reason, t) {
  const key = mainReasonI18nKeys[reason]
  if (!key || !t) return reason || ''
  const translated = t(`withdrawal.mainReasons.${key}`)
  return translated !== `withdrawal.mainReasons.${key}` ? translated : reason
}

export function getWithdrawalReasonDisplay(item, t) {
  const fromConfig = resolveReasonLabel(WDR_CATEGORY_CODE, item?.reasonId)
  if (fromConfig) return fromConfig
  return getMainReasonLabel(item?.mainReason, t) || item?.mainReason || ''
}

function syncWithdrawalReasonFields(base) {
  let reasonId = base.reasonId
  if (!isValidReasonIdForCategory(WDR_CATEGORY_CODE, reasonId)) {
    reasonId = resolveReasonIdByName(WDR_CATEGORY_CODE, base.mainReason || base.reason) ?? null
  }
  const mainReason =
    resolveReasonLabel(WDR_CATEGORY_CODE, reasonId) || base.mainReason || base.reason || ''
  return { reasonId, mainReason }
}

export function shouldShowIsaoNote(category) {
  return category === 'International'
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

let nextId = 15
let nextAppSeq = 15

export function createWithdrawalId() {
  return nextId++
}

export function createApplicationId() {
  return `WDR${String(nextAppSeq++).padStart(3, '0')}`
}

export function formatWithdrawalDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

import { formatMovementDate } from '../utils/formatMovementDate.js'

export function formatWithdrawalListDate(value) {
  return formatMovementDate(value)
}

export function formatApplicationDateDisplay(value) {
  return formatMovementDate(value)
}

export function createEmptyWithdrawal() {
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
    intake: '',
    nricPassport: '',
    nationality: '',
    programme: '',
    programmeLevel: '',
    studentCategory: '',
    personalEmail: '',
    phoneNumber: '',
    lastDateOfAttendance: '',
    destinationAfterLeaving: '',
    reasonId: null,
    mainReason: '',
    currentWhereabout: '',
    detailedReason: '',
    declarationAccepted: false,
    parentGuardianName: '',
    parentContactNo: '',
    parentNricPassport: '',
    parentRelationship: '',
    parentEmail: '',
    attachment: null,
    approvalLog: [],
  }
}

export function getWithdrawalFormData(record) {
  if (!record) return createEmptyWithdrawal()
  return {
    ...createEmptyWithdrawal(),
    ...record,
    attachment: record.attachment ? { ...record.attachment } : null,
    approvalLog: (record.approvalLog || []).map((entry) => ({ ...entry })),
  }
}

export function normalizeWithdrawal(raw) {
  const base = { ...createEmptyWithdrawal(), ...raw }
  const { reasonId, mainReason } = syncWithdrawalReasonFields(base)
  return {
    ...base,
    id: base.id ?? createWithdrawalId(),
    applicationId: base.applicationId || createApplicationId(),
    reasonId,
    name: base.fullName || base.name || '',
    mainReason,
    reason: mainReason,
    applicationDate: base.submittedAt || base.applicationDate || base.dateOfApplication || null,
    archived:
      base.archived === true ||
      ['Approved', 'Rejected', 'Cancelled'].includes(base.status),
  }
}

export function buildStudentSnapshotForWithdrawal(student) {
  if (!student) return {}
  const basic = student.basicInfo || student
  const enrollment = student.enrollment || {}
  const contact = student.contact || {}
  const family = student.family || {}
  const category = student.studentCategory || student.studentType || 'Local'

  const nricPassport = isLocalCategory(category)
    ? basic.icNo || ''
    : basic.passportNo || ''

  return {
    studentId: basic.studentId || student.studentId || '',
    fullName: basic.fullName || student.name || '',
    intake: enrollment.intake || '',
    nricPassport,
    nationality: basic.nationality || '',
    programme: enrollment.programme || '',
    programmeLevel: enrollment.programmeLevel || '',
    studentCategory: category,
    personalEmail: contact.email || '',
    phoneNumber: contact.mobilePhone || '',
    parentGuardianName: family.name || '',
    parentContactNo: family.mobilePhone || '',
    parentNricPassport: family.icPassport || '',
    parentRelationship: family.relationship || '',
    parentEmail: family.email || '',
    applicationSession: resolveApplicationSessionFromStudent(student),
  }
}

const TERMINAL_STATUSES = new Set(['Approved', 'Rejected', 'Cancelled'])
const ACTIVE_STATUSES = new Set(['Draft', 'In Progress', 'Update Required'])

export function isArchivedWithdrawal(item) {
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

export function canEditWithdrawal(item) {
  return item?.status === 'Draft' || item?.status === 'Update Required'
}

export function canDeleteWithdrawal(item) {
  return item?.status === 'Draft'
}

export function canCancelWithdrawal(item) {
  return isPendingReview(item) && !hasApprovalStarted(item)
}

export function canResubmitWithdrawal(item) {
  return item?.status === 'Update Required'
}

export function canApproveWithdrawal(item) {
  if (item?.status !== 'In Progress') return false
  return item.approvalStage !== '--' && item.approvalStage !== 'Approved'
}

export function hasActiveWithdrawalForStudent(studentId, list, excludeId = null) {
  const normalized = String(studentId || '').trim().toLowerCase()
  if (!normalized) return false
  return list.some(
    (item) =>
      item.id !== excludeId &&
      ACTIVE_STATUSES.has(item.status) &&
      String(item.studentId || '').trim().toLowerCase() === normalized,
  )
}

/** @deprecated use hasActiveWithdrawalForStudent */
export function hasPendingWithdrawalForStudent(studentId, list, excludeId = null) {
  return hasActiveWithdrawalForStudent(studentId, list, excludeId)
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

export function validateWithdrawalForm(data, mode = 'submit', existingList = [], editingId = null) {
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

  if (!String(data.personalEmail || '').trim()) {
    requireField('personalEmail', 'Personal Email is required.')
  }
  if (!String(data.phoneNumber || '').trim()) {
    requireField('phoneNumber', 'Phone Number is required.')
  }
  if (!String(data.lastDateOfAttendance || '').trim()) {
    requireField('lastDateOfAttendance', 'Last Date of Attendance is required.')
  }
  if (!String(data.destinationAfterLeaving || '').trim()) {
    requireField('destinationAfterLeaving', 'Destination after Leaving is required.')
  }
  if (!isValidReasonIdForCategory(WDR_CATEGORY_CODE, data.reasonId)) {
    requireField('reasonId', 'Main Reason for Withdrawal is required.')
  }
  if (!String(data.currentWhereabout || '').trim()) {
    requireField('currentWhereabout', 'Current Whereabout is required.')
  }
  if (!String(data.detailedReason || '').trim()) {
    requireField('detailedReason', 'Detailed Reason is required.')
  }
  if (!data.declarationAccepted) {
    requireField('declarationAccepted', 'You must agree to the declaration.')
  }
  if (!String(data.parentGuardianName || '').trim()) {
    requireField('parentGuardianName', 'Parent/Guardian Name is required.')
  }
  if (!String(data.parentContactNo || '').trim()) {
    requireField('parentContactNo', 'Contact No. is required.')
  }
  if (!String(data.parentNricPassport || '').trim()) {
    requireField('parentNricPassport', 'Parent/Guardian NRIC/Passport No. is required.')
  }
  if (!String(data.parentRelationship || '').trim()) {
    requireField('parentRelationship', 'Relationship is required.')
  }
  if (!String(data.parentEmail || '').trim()) {
    requireField('parentEmail', 'Parent/Guardian Email is required.')
  }
  if (!data.attachment?.fileName) {
    requireField('attachment', 'Supporting document is required.')
  }

  if (
    mode === 'submit' &&
    hasActiveWithdrawalForStudent(data.studentId, existingList, editingId)
  ) {
    requireField('studentId', 'This student already has an active withdrawal application.')
  }

  validateAcademicSessionOrder(
    {
      intake: data.intake,
      applicationSession: data.applicationSession,
      effectiveSession: normalizeAcademicSession(data.lastDateOfAttendance),
    },
    requireField,
    { effectiveSession: 'lastDateOfAttendance' },
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
  return normalizeWithdrawal({
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
  const now = formatWithdrawalDateTime(new Date())
  const submittedAt = new Date().toISOString()
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Submitted',
    dateTime: now,
    comment: 'Withdrawal application submitted for review.',
  })
  return normalizeWithdrawal({
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
  const now = formatWithdrawalDateTime(new Date())
  let updated = appendLog(item, {
    stage: item.approvalStage || 'Pending Review',
    actor,
    action: 'Cancelled',
    dateTime: now,
    comment: 'Application cancelled by student.',
  })
  return normalizeWithdrawal({
    ...updated,
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    cancelledAt: new Date().toISOString(),
  })
}

export function resubmitApplication(item, actor = 'Student') {
  const now = formatWithdrawalDateTime(new Date())
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Resubmitted',
    dateTime: now,
    comment: 'Application resubmitted after update.',
  })
  return normalizeWithdrawal({
    ...updated,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    archived: false,
  })
}

/** @deprecated use submitApplication after saveDraftApplication */
export function submitWithdrawalApplication(form, actor = 'Student') {
  const draft = saveDraftApplication(form)
  return submitApplication(draft, actor)
}

function buildRecord(partial) {
  return normalizeWithdrawal(partial)
}

export const initialWithdrawals = [
  // —— Approved ×2 ——
  buildRecord({
    id: 2,
    applicationId: 'WDR002',
    studentId: 'XMUM2309001',
    fullName: 'Tan Wei Ming',
    intake: '2023/09',
    nricPassport: '010101010101',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'tan.weiming@student.xmum.edu.my',
    phoneNumber: '0123456789',
    lastDateOfAttendance: '2025-06-15',
    destinationAfterLeaving: 'Selangor, Malaysia',
    mainReason: 'Personal Reason',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Personal family matters require withdrawal.',
    declarationAccepted: true,
    parentGuardianName: 'Tan Ah Kow',
    parentContactNo: '0131112233',
    parentNricPassport: '750101010101',
    parentRelationship: 'Father',
    parentEmail: 'tan.ahkow@email.com',
    attachment: { fileName: 'consent-letter.pdf', size: 180000 },
    status: 'Approved',
    approvalStage: 'Approved',
    implemented: 'Implemented',
    archived: true,
    submittedAt: '2025-06-20T10:00:00.000Z',
    dateOfApplication: '2025-06-18',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Tan Wei Ming', action: 'Submitted', dateTime: '20.06.2025 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '22.06.2025 14:00', comment: 'Initial review passed.' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', action: 'Approved', dateTime: '25.06.2025 11:00', comment: 'Approved.' },
    ],
  }),
  buildRecord({
    id: 14,
    applicationId: 'WDR014',
    studentId: 'XMUM2309002',
    fullName: 'Li Xiu',
    intake: '2023/09',
    nricPassport: 'E12345678',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    studentCategory: 'China',
    personalEmail: 'li.xiu@student.xmum.edu.my',
    phoneNumber: '0139876543',
    lastDateOfAttendance: '2025-02-10',
    destinationAfterLeaving: 'Fujian, China',
    mainReason: 'Health Issue',
    currentWhereabout: 'China',
    detailedReason: 'Medical treatment requires leaving the programme.',
    declarationAccepted: true,
    parentGuardianName: 'Li Ming',
    parentContactNo: '0145566778',
    parentNricPassport: 'E87654321',
    parentRelationship: 'Father',
    parentEmail: 'li.ming@email.com',
    attachment: { fileName: 'li-withdrawal.pdf', size: 210000 },
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
    applicationId: 'WDR001',
    studentId: 'XMUM2309003',
    fullName: 'John Doe',
    intake: '2023/04',
    nricPassport: 'GB1234567',
    nationality: 'United Kingdom',
    programme: 'Bachelor of International Business',
    programmeLevel: 'Undergraduate',
    studentCategory: 'International',
    personalEmail: 'john.doe@student.xmum.edu.my',
    phoneNumber: '0145566778',
    lastDateOfAttendance: '2025-09-20',
    destinationAfterLeaving: 'United Kingdom',
    mainReason: 'Financial Problem',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Unable to continue due to financial constraints.',
    declarationAccepted: true,
    parentGuardianName: 'Jane Doe',
    parentContactNo: '004412345678',
    parentNricPassport: 'GB7654321',
    parentRelationship: 'Mother',
    parentEmail: 'jane.doe@email.com',
    attachment: { fileName: 'withdrawal-support.pdf', size: 245000 },
    status: 'In Progress',
    approvalStage: 'Pending Review',
    submittedAt: '2025-09-26T08:00:00.000Z',
    dateOfApplication: '2025-09-20',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'John Doe', action: 'Submitted', dateTime: '26.09.2025 08:00', comment: 'Withdrawal application submitted for review.' },
    ],
  }),
  buildRecord({
    id: 7,
    applicationId: 'WDR007',
    studentId: 'XMUM2309012',
    fullName: 'Ahmad Rizal',
    intake: '2023/09',
    nricPassport: '020202020202',
    nationality: 'Malaysia',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'ahmad.rizal@student.xmum.edu.my',
    phoneNumber: '0112233445',
    lastDateOfAttendance: '2025-08-01',
    destinationAfterLeaving: 'Kuala Lumpur, Malaysia',
    mainReason: 'Academic Difficulty',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Academic performance concerns.',
    declarationAccepted: true,
    parentGuardianName: 'Rizal Bin Ahmad',
    parentContactNo: '0123344556',
    parentNricPassport: '700101010101',
    parentRelationship: 'Father',
    parentEmail: 'rizal.ahmad@email.com',
    attachment: { fileName: 'rizal-withdrawal.pdf', size: 185000 },
    status: 'In Progress',
    approvalStage: 'Pending Review',
    submittedAt: '2025-08-05T08:00:00.000Z',
    dateOfApplication: '2025-08-01',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Ahmad Rizal', action: 'Submitted', dateTime: '05.08.2025 08:00', comment: '' },
    ],
  }),
  // —— In Progress (Academic Affairs, 不可 Cancel) ——
  buildRecord({
    id: 8,
    applicationId: 'WDR008',
    studentId: 'XMUM2309010',
    fullName: 'Sarah Chen',
    intake: '2023/09',
    nricPassport: 'E87654321',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    studentCategory: 'China',
    personalEmail: 'sarah.chen@student.xmum.edu.my',
    phoneNumber: '0131112233',
    lastDateOfAttendance: '2025-06-10',
    destinationAfterLeaving: 'Shanghai, China',
    mainReason: 'Personal Reason',
    currentWhereabout: 'China',
    detailedReason: 'Returning home for personal reasons.',
    declarationAccepted: true,
    parentGuardianName: 'Chen Wei',
    parentContactNo: '0145566778',
    parentNricPassport: 'E11223344',
    parentRelationship: 'Father',
    parentEmail: 'chen.wei@email.com',
    attachment: { fileName: 'sarah-withdrawal.pdf', size: 210000 },
    status: 'In Progress',
    approvalStage: 'Academic Affairs',
    submittedAt: '2025-06-15T10:00:00.000Z',
    dateOfApplication: '2025-06-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Sarah Chen', action: 'Submitted', dateTime: '15.06.2025 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '20.06.2025 11:00', comment: 'Passed initial review.' },
    ],
  }),
  // —— Draft ×2 ——
  buildRecord({
    id: 3,
    applicationId: 'WDR003',
    studentId: 'XMUM2309020',
    fullName: 'Wong Mei Ling',
    intake: '2024/09',
    nricPassport: '040404040404',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    status: 'Draft',
    approvalStage: '--',
    approvalLog: [],
  }),
  buildRecord({
    id: 6,
    applicationId: 'WDR006',
    studentId: 'XMUM2309021',
    fullName: 'David Tan',
    intake: '2023/09',
    nricPassport: '090909090909',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'david.tan@student.xmum.edu.my',
    mainReason: 'Others',
    detailedReason: 'Draft in progress.',
    status: 'Draft',
    approvalStage: '--',
    approvalLog: [],
  }),
  // —— Update Required ×2 ——
  buildRecord({
    id: 4,
    applicationId: 'WDR004',
    studentId: 'XMUM2309016',
    fullName: 'Ng Jia Hui',
    intake: '2023/04',
    nricPassport: '050505050505',
    nationality: 'Malaysia',
    programme: 'Bachelor of International Business',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'ng.jiahui@student.xmum.edu.my',
    phoneNumber: '0189900112',
    lastDateOfAttendance: '2025-06-10',
    destinationAfterLeaving: 'Penang, Malaysia',
    mainReason: 'Financial Problem',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Please update parent consent documents.',
    declarationAccepted: true,
    parentGuardianName: 'Ng Siew Leng',
    parentContactNo: '0187788990',
    parentNricPassport: '720101010101',
    parentRelationship: 'Mother',
    parentEmail: 'ng.siewleng@email.com',
    attachment: { fileName: 'ng-consent.pdf', size: 95000 },
    status: 'Update Required',
    approvalStage: '--',
    submittedAt: '2025-06-15T10:00:00.000Z',
    dateOfApplication: '2025-06-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Ng Jia Hui', action: 'Submitted', dateTime: '15.06.2025 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Update Required', dateTime: '20.06.2025 14:00', comment: 'Please attach updated parent consent letter.' },
    ],
  }),
  buildRecord({
    id: 11,
    applicationId: 'WDR011',
    studentId: 'XMUM2309017',
    fullName: 'Raj Kumar',
    intake: '2023/09',
    nricPassport: '070707070707',
    nationality: 'Malaysia',
    programme: 'Bachelor of Accounting',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'raj.kumar@student.xmum.edu.my',
    phoneNumber: '0145566778',
    lastDateOfAttendance: '2025-03-28',
    destinationAfterLeaving: 'Kuala Lumpur, Malaysia',
    mainReason: 'Health Issue',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Incomplete medical documentation.',
    declarationAccepted: true,
    parentGuardianName: 'Kumar Rajan',
    parentContactNo: '0156677889',
    parentNricPassport: '710101010101',
    parentRelationship: 'Father',
    parentEmail: 'kumar.rajan@email.com',
    attachment: { fileName: 'raj-medical.pdf', size: 88000 },
    status: 'Update Required',
    approvalStage: '--',
    submittedAt: '2025-04-01T08:00:00.000Z',
    dateOfApplication: '2025-03-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Raj Kumar', action: 'Submitted', dateTime: '01.04.2025 08:00', comment: '' },
      { id: 2, stage: 'Academic Affairs', actor: 'System Admin', action: 'Update Required', dateTime: '05.04.2025 09:30', comment: 'Please provide complete medical documentation.' },
    ],
  }),
  // —— Cancelled ×2 ——
  buildRecord({
    id: 9,
    applicationId: 'WDR009',
    studentId: 'XMUM2309014',
    fullName: 'Lim Wei Jie',
    intake: '2024/09',
    nricPassport: '060606060606',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'lim.weijie@student.xmum.edu.my',
    phoneNumber: '0190011223',
    lastDateOfAttendance: '2025-08-01',
    destinationAfterLeaving: 'Johor, Malaysia',
    mainReason: 'Personal Reason',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Changed decision.',
    declarationAccepted: true,
    parentGuardianName: 'Lim Ah Beng',
    parentContactNo: '0191122334',
    parentNricPassport: '690101010101',
    parentRelationship: 'Father',
    parentEmail: 'lim.ahbeng@email.com',
    attachment: { fileName: 'lim-consent.pdf', size: 110000 },
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    submittedAt: '2025-08-01T08:00:00.000Z',
    cancelledAt: '2025-08-03T10:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Lim Wei Jie', action: 'Submitted', dateTime: '01.08.2025 08:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'Lim Wei Jie', action: 'Cancelled', dateTime: '03.08.2025 10:00', comment: 'Application cancelled by student.' },
    ],
  }),
  buildRecord({
    id: 10,
    applicationId: 'WDR010',
    studentId: 'XMUM2309015',
    fullName: 'Chen Yu Ting',
    intake: '2023/09',
    nricPassport: 'E11223344',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    studentCategory: 'China',
    personalEmail: 'chen.yuting@student.xmum.edu.my',
    lastDateOfAttendance: '2025-09-10',
    destinationAfterLeaving: 'Beijing, China',
    mainReason: 'Others',
    currentWhereabout: 'China',
    detailedReason: 'Withdrawal request cancelled.',
    declarationAccepted: true,
    parentGuardianName: 'Chen Ming',
    parentContactNo: '0134455667',
    parentNricPassport: 'E99887766',
    parentRelationship: 'Father',
    parentEmail: 'chen.ming@email.com',
    attachment: { fileName: 'chen-consent.pdf', size: 130000 },
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    submittedAt: '2025-09-10T09:00:00.000Z',
    cancelledAt: '2025-09-11T11:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Chen Yu Ting', action: 'Submitted', dateTime: '10.09.2025 09:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'Chen Yu Ting', action: 'Cancelled', dateTime: '11.09.2025 11:00', comment: 'Application cancelled by student.' },
    ],
  }),
  // —— Rejected ×2 ——
  buildRecord({
    id: 12,
    applicationId: 'WDR012',
    studentId: 'XMUM2309018',
    fullName: 'Siti Aminah',
    intake: '2024/09',
    nricPassport: '080808080808',
    nationality: 'Malaysia',
    programme: 'Bachelor of Data Science',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'siti.aminah@student.xmum.edu.my',
    lastDateOfAttendance: '2025-05-10',
    destinationAfterLeaving: 'Selangor, Malaysia',
    mainReason: 'Financial Problem',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Financial withdrawal request.',
    declarationAccepted: true,
    parentGuardianName: 'Aminah Hassan',
    parentContactNo: '0156677889',
    parentNricPassport: '680101010101',
    parentRelationship: 'Mother',
    parentEmail: 'aminah.hassan@email.com',
    attachment: { fileName: 'siti-docs.pdf', size: 102000 },
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2025-05-10T10:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Siti Aminah', action: 'Submitted', dateTime: '10.05.2025 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Rejected', dateTime: '15.05.2025 11:00', comment: 'Insufficient supporting documents provided.' },
    ],
  }),
  buildRecord({
    id: 13,
    applicationId: 'WDR013',
    studentId: 'XMUM2309019',
    fullName: 'Priya Sharma',
    intake: '2024/09',
    nricPassport: '030303030303',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    studentCategory: 'Local',
    personalEmail: 'priya.sharma@student.xmum.edu.my',
    lastDateOfAttendance: '2025-07-01',
    destinationAfterLeaving: 'Kuala Lumpur, Malaysia',
    mainReason: 'Health Issue',
    currentWhereabout: 'Malaysia',
    detailedReason: 'Health-related withdrawal.',
    declarationAccepted: true,
    parentGuardianName: 'Sharma Raj',
    parentContactNo: '0167788990',
    parentNricPassport: '670101010101',
    parentRelationship: 'Father',
    parentEmail: 'sharma.raj@email.com',
    attachment: { fileName: 'priya-medical.pdf', size: 98000 },
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2025-07-01T08:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Priya Sharma', action: 'Submitted', dateTime: '01.07.2025 08:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '05.07.2025 10:00', comment: '' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', action: 'Rejected', dateTime: '12.07.2025 14:00', comment: 'Withdrawal reason does not meet policy requirements.' },
    ],
  }),
]
