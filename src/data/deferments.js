import {
  createEmptyMovementAttachments,
  validateMovementAttachments,
  withMovementAttachments,
} from './movementAttachments.js'
import { validateAcademicSessionOrder } from '../utils/normalizeAcademicSession.js'
import {
  resolveReasonIdByName,
  resolveReasonLabel,
  isValidReasonIdForCategory,
} from './movementCategories.js'
import { findSemesterRecordByKey } from './calendarInfo.js'
import { initialSemesterRecords } from './semesterInfo.js'

const DEF_CATEGORY_CODE = 'DEF001'

const SEMESTER_MONTH_ORDER = { '02': 1, '04': 2, '09': 3 }

export function getDefermentPeriodOptions(records = initialSemesterRecords) {
  return [...records]
    .sort((a, b) => {
      // 新学年学期在前：年降序，同年内 09 → 04 → 02
      const yearDiff = parseInt(b.academicYear, 10) - parseInt(a.academicYear, 10)
      if (yearDiff !== 0) return yearDiff
      return (SEMESTER_MONTH_ORDER[b.semester] || 0) - (SEMESTER_MONTH_ORDER[a.semester] || 0)
    })
    .map((record) => `${record.academicYear}/${record.semester}`)
}

export function resolveDefermentPeriodDates(defermentPeriod, records = initialSemesterRecords) {
  const record = findSemesterRecordByKey(defermentPeriod, records)
  if (!record) {
    return { defermentStartDate: '', defermentEndDate: '' }
  }
  return {
    defermentStartDate: record.startDate || '',
    defermentEndDate: record.endDate || '',
  }
}

export function syncDefermentPeriodDates(deferment) {
  if (!deferment) return deferment
  const dates = resolveDefermentPeriodDates(deferment.defermentPeriod)
  deferment.defermentStartDate = dates.defermentStartDate
  deferment.defermentEndDate = dates.defermentEndDate
  return deferment
}

export const defermentPeriodOptions = getDefermentPeriodOptions()

export const defermentStatusOptions = [
  'Draft',
  'In Progress',
  'Update Required',
  'Approved',
  'Rejected',
  'Cancelled',
]

export const mainReasonOptions = [
  'Personal Reason',
  'Health Issue',
  'Financial Reason',
  'Military Service',
  'Others',
]

export const mainReasonI18nKeys = {
  'Personal Reason': 'personalReason',
  'Health Issue': 'healthIssue',
  'Financial Reason': 'financialReason',
  'Military Service': 'militaryService',
  Others: 'others',
}

export function getMainReasonLabel(reason, t) {
  const key = mainReasonI18nKeys[reason]
  if (!key || !t) return reason || ''
  const translated = t(`deferment.mainReasons.${key}`)
  return translated !== `deferment.mainReasons.${key}` ? translated : reason
}

export function getDefermentReasonDisplay(item, t) {
  const fromConfig = resolveReasonLabel(DEF_CATEGORY_CODE, item?.reasonId)
  if (fromConfig) return fromConfig
  return getMainReasonLabel(item?.mainReason, t) || item?.mainReason || ''
}

function syncDefermentReasonFields(base) {
  let reasonId = base.reasonId
  if (!isValidReasonIdForCategory(DEF_CATEGORY_CODE, reasonId)) {
    reasonId = resolveReasonIdByName(DEF_CATEGORY_CODE, base.mainReason || base.reason) ?? null
  }
  const mainReason =
    resolveReasonLabel(DEF_CATEGORY_CODE, reasonId) || base.mainReason || base.reason || ''
  return { reasonId, mainReason }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

let nextId = 16
let nextAppSeq = 15

export function createDefermentId() {
  return nextId++
}

export function createApplicationId() {
  return `DEF${String(nextAppSeq++).padStart(3, '0')}`
}

export function formatDefermentDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

import { formatMovementDate } from '../utils/formatMovementDate.js'

export function formatDefermentListDate(value) {
  return formatMovementDate(value)
}

export function formatApplicationDateDisplay(value) {
  return formatMovementDate(value)
}

import { isLocalCategory } from './students.js'
import {
  buildParentContactsFromStudentFamily,
  normalizeParentContacts,
  validateParentContacts,
  withSyncedLegacyParentFields,
} from './movementParentContacts.js'
import { resolveApplicationSessionFromStudent, resolveCurrentAcademicSessionFromStudent } from './movementApplicationSession.js'
import { resolveMovementVisaExpiryFromStudent } from '../utils/movementVisaExpiry.js'

export function createEmptyDeferment() {
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
    applicationDeadline: '2026-12-31',
    applicationSession: '',
    currentAcademicSession: '',
    fullName: '',
    intake: '',
    nricPassport: '',
    nationality: '',
    programme: '',
    programmeLevel: '',
    studentCategory: '',
    visaExpiryDate: '—',
    personalEmail: '',
    phoneNumber: '',
    accommodationRoomNo: '',
    defermentPeriod: '',
    defermentStartDate: '',
    defermentEndDate: '',
    reasonId: null,
    mainReason: '',
    detailedReason: '',
    parentContacts: [],
    parentGuardianName: '',
    parentContactNo: '',
    parentNricPassport: '',
    parentRelationship: '',
    parentEmail: '',
    declarationAgreed: false,
    attachment: null,
    attachments: createEmptyMovementAttachments(),
    approvalLog: [],
  }
}

export function getDefermentFormData(record) {
  if (!record) return createEmptyDeferment()
  return syncDefermentPeriodDates(
    withMovementAttachments(
      withSyncedLegacyParentFields({
        ...createEmptyDeferment(),
        ...record,
        parentContacts: normalizeParentContacts(record),
        approvalLog: (record.approvalLog || []).map((entry) => ({ ...entry })),
      }),
    ),
  )
}

export function normalizeDeferment(raw) {
  const base = { ...createEmptyDeferment(), ...raw }
  const { reasonId, mainReason } = syncDefermentReasonFields(base)
  const normalized = {
    ...base,
    id: base.id ?? createDefermentId(),
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
  return withMovementAttachments(
    syncDefermentPeriodDates(
      withSyncedLegacyParentFields({
        ...normalized,
        parentContacts: normalizeParentContacts(normalized),
      }),
    ),
  )
}

export { buildDefermentStatusLogRemarkLines, formatDefermentOrdinal } from './defermentStatusLog.js'

export function buildStudentSnapshotForDeferment(student) {
  if (!student) return {}
  const basic = student.basicInfo || student
  const enrollment = student.enrollment || {}
  const contact = student.contact || {}
  const accommodation = student.accommodation || {}
  const parentContacts = buildParentContactsFromStudentFamily(student)
  const category = student.studentCategory || student.studentType || 'Local'

  const nricPassport = isLocalCategory(category)
    ? basic.icNo || ''
    : basic.passportNo || ''

  const roomNo = accommodation.roomNo || ''
  const blockNo = accommodation.blockNo || ''
  const accommodationRoomNo = roomNo
    ? [blockNo, roomNo].filter(Boolean).join('-')
    : ''

  return {
    studentId: basic.studentId || student.studentId || '',
    fullName: basic.fullName || student.name || '',
    intake: enrollment.intake || '',
    nricPassport,
    nationality: basic.nationality || '',
    programme: enrollment.programme || '',
    programmeLevel: enrollment.programmeLevel || '',
    studentCategory: category,
    visaExpiryDate: resolveMovementVisaExpiryFromStudent(student),
    personalEmail: contact.email || '',
    phoneNumber: contact.mobilePhone || '',
    accommodationRoomNo,
    applicationSession: resolveApplicationSessionFromStudent(student),
    currentAcademicSession: resolveCurrentAcademicSessionFromStudent(student),
    ...withSyncedLegacyParentFields({ parentContacts }),
  }
}

const TERMINAL_STATUSES = new Set(['Approved', 'Rejected', 'Cancelled'])
const ACTIVE_STATUSES = new Set(['Draft', 'In Progress', 'Update Required'])

export function isArchivedDeferment(item) {
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

export function canEditDeferment(item) {
  return item?.status === 'Draft' || item?.status === 'Update Required'
}

export function canDeleteDeferment(item) {
  return item?.status === 'Draft'
}

export function canCancelDeferment(item) {
  return isPendingReview(item) && !hasApprovalStarted(item)
}

export function canResubmitDeferment(item) {
  return item?.status === 'Update Required'
}

export function canApproveDeferment(item) {
  if (item?.status !== 'In Progress') return false
  return item.approvalStage !== '--' && item.approvalStage !== 'Approved'
}

export function hasActiveDefermentForStudent(studentId, list, excludeId = null) {
  const normalized = String(studentId || '').trim().toLowerCase()
  if (!normalized) return false
  return list.some(
    (item) =>
      item.id !== excludeId &&
      ACTIVE_STATUSES.has(item.status) &&
      String(item.studentId || '').trim().toLowerCase() === normalized,
  )
}

/** @deprecated use hasActiveDefermentForStudent */
export function hasPendingDefermentForStudent(studentId, list, excludeId = null) {
  return hasActiveDefermentForStudent(studentId, list, excludeId)
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

export function validateDefermentForm(data, mode = 'submit', existingList = [], editingId = null) {
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

  if (!String(data.defermentPeriod || '').trim()) {
    requireField('defermentPeriod', 'Deferment Period is required.')
  }
  if (!isValidReasonIdForCategory(DEF_CATEGORY_CODE, data.reasonId)) {
    requireField('reasonId', 'Main Reason for Deferment is required.')
  }
  validateParentContacts(data.parentContacts, requireField, { mode: 'deferment' })
  validateMovementAttachments('deferment', data, requireField, mode)
  if (!data.declarationAgreed) {
    requireField('declarationAgreed', 'You must agree to the declaration.')
  }

  if (
    mode === 'submit' &&
    hasActiveDefermentForStudent(data.studentId, existingList, editingId)
  ) {
    requireField('studentId', 'This student already has an active deferment application.')
  }

  validateAcademicSessionOrder(
    {
      intake: data.intake,
      applicationSession: data.applicationSession,
      effectiveSession: data.defermentPeriod,
    },
    requireField,
    { effectiveSession: 'defermentPeriod' },
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
  return normalizeDeferment({
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
  const now = formatDefermentDateTime(new Date())
  const submittedAt = new Date().toISOString()
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Submitted',
    dateTime: now,
    comment: 'Deferment application submitted for review.',
  })
  return normalizeDeferment({
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
  const now = formatDefermentDateTime(new Date())
  let updated = appendLog(item, {
    stage: item.approvalStage || 'Pending Review',
    actor,
    action: 'Cancelled',
    dateTime: now,
    comment:
      actor === 'Student'
        ? 'Application cancelled by student.'
        : 'Application cancelled by AC.',
  })
  return normalizeDeferment({
    ...updated,
    status: 'Cancelled',
    approvalStage: '--',
    archived: true,
    cancelledAt: new Date().toISOString(),
  })
}

export function resubmitApplication(item, actor = 'Student') {
  const now = formatDefermentDateTime(new Date())
  let updated = appendLog(item, {
    stage: 'Submission',
    actor,
    action: 'Resubmitted',
    dateTime: now,
    comment: 'Application resubmitted after update.',
  })
  return normalizeDeferment({
    ...updated,
    status: 'In Progress',
    approvalStage: 'Pending Review',
    archived: false,
  })
}

/** @deprecated use submitApplication after saveDraftApplication */
export function submitDefermentApplication(form, actor = 'Student') {
  const draft = saveDraftApplication(form)
  return submitApplication(draft, actor)
}

function buildRecord(partial) {
  const declarationAgreed =
    partial.declarationAgreed ?? (partial.status && partial.status !== 'Draft' ? true : false)
  return normalizeDeferment({ ...partial, declarationAgreed })
}

export const initialDeferments = [
  // —— Approved ×2 ——
  buildRecord({
    id: 1,
    applicationId: 'DEF001',
    studentId: 'AIT2402110',
    fullName: 'Elson Lai',
    intake: '2024/02',
    nricPassport: '010101010101',
    nationality: 'Malaysia',
    programme: 'AIT',
    programmeLevel: 'Foundation',
    personalEmail: 'elson.lai@student.xmum.edu.my',
    phoneNumber: '0123456789',
    accommodationRoomNo: 'A-101',
    defermentPeriod: '2025/09',
    mainReason: 'Personal Reason',
    detailedReason: 'Need to attend to personal family matters.',
    parentGuardianName: 'Lai Wei',
    parentContactNo: '0129876543',
    parentNricPassport: '800101010101',
    parentRelationship: 'Father',
    parentEmail: 'lai.wei@email.com',
    attachment: { fileName: 'deferment-support.pdf', size: 198000 },
    status: 'Approved',
    approvalStage: 'Approved',
    exportArchiveNumber: '1482',
    implemented: 'Implemented',
    archived: true,
    submittedAt: '2025-09-29T08:00:00.000Z',
    dateOfApplication: '2025-09-15',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Elson Lai', actorRole: 'Student', action: 'Submitted', dateTime: '15.09.2025 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', actorRole: 'Degree Academic Coordinator', action: 'Approved', dateTime: '20.09.2025 10:00', comment: 'Initial review passed.' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', actorRole: 'UG Academic Coordinator', action: 'Approved', dateTime: '29.09.2025 14:30', comment: 'Approved.' },
    ],
  }),
  buildRecord({
    id: 14,
    applicationId: 'DEF014',
    studentId: 'XMUM2309003',
    fullName: 'John Doe',
    intake: '2023/04',
    nricPassport: 'GB1234567',
    nationality: 'United Kingdom',
    programme: 'Bachelor of International Business',
    programmeLevel: 'Undergraduate',
    personalEmail: 'john.doe@student.xmum.edu.my',
    phoneNumber: '0145566778',
    accommodationRoomNo: 'D-102',
    defermentPeriod: '2025/02',
    mainReason: 'Health Issue',
    detailedReason: 'Medical treatment abroad.',
    parentGuardianName: 'Jane Doe',
    parentContactNo: '004412345678',
    parentNricPassport: 'GB7654321',
    parentRelationship: 'Mother',
    parentEmail: 'jane.doe@email.com',
    attachment: { fileName: 'john-medical.pdf', size: 275000 },
    status: 'Approved',
    approvalStage: 'Approved',
    archived: true,
    submittedAt: '2025-02-18T08:00:00.000Z',
    dateOfApplication: '2025-02-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'John Doe', action: 'Submitted', dateTime: '18.02.2025 08:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '20.02.2025 11:00', comment: '' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', action: 'Approved', dateTime: '25.02.2025 14:00', comment: 'Final approval granted.' },
    ],
  }),
  // —— In Progress ×2 (Pending Review, 可 Cancel) ——
  buildRecord({
    id: 2,
    applicationId: 'DEF002',
    studentId: 'XMUM2309001',
    fullName: 'Tan Wei Ming',
    intake: '2023/09',
    nricPassport: '010101010101',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    personalEmail: 'tan.weiming@student.xmum.edu.my',
    phoneNumber: '0123456789',
    accommodationRoomNo: 'B-205',
    defermentPeriod: '2024/02',
    mainReason: 'Health Issue',
    detailedReason: 'Medical treatment requires deferment for one semester.',
    parentGuardianName: 'Tan Ah Kow',
    parentContactNo: '0131112233',
    parentNricPassport: '750101010101',
    parentRelationship: 'Father',
    parentEmail: 'tan.ahkow@email.com',
    attachment: { fileName: 'medical-cert.pdf', size: 320000 },
    status: 'In Progress',
    approvalStage: 'Pending Review',
    submittedAt: '2023-11-01T09:00:00.000Z',
    dateOfApplication: '2023-10-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Tan Wei Ming', action: 'Submitted', dateTime: '01.11.2023 09:00', comment: '' },
    ],
  }),
  buildRecord({
    id: 7,
    applicationId: 'DEF007',
    studentId: 'XMUM2309012',
    fullName: 'Ahmad Rizal',
    intake: '2023/09',
    nricPassport: '020202020202',
    nationality: 'Malaysia',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    personalEmail: 'ahmad.rizal@student.xmum.edu.my',
    phoneNumber: '0112233445',
    accommodationRoomNo: 'C-110',
    defermentPeriod: '2025/02',
    mainReason: 'Military Service',
    detailedReason: 'National service deferment request.',
    parentGuardianName: 'Rizal Bin Ahmad',
    parentContactNo: '0123344556',
    parentNricPassport: '700101010101',
    parentRelationship: 'Father',
    parentEmail: 'rizal.ahmad@email.com',
    attachment: { fileName: 'rizal-ns.pdf', size: 185000 },
    status: 'In Progress',
    approvalStage: 'Pending Review',
    applicationSession: '2024/09',
    submittedAt: '2024-08-01T08:00:00.000Z',
    dateOfApplication: '2024-07-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Ahmad Rizal', action: 'Submitted', dateTime: '01.08.2024 08:00', comment: '' },
    ],
  }),
  // —— In Progress (Academic Affairs, 不可 Cancel) ——
  buildRecord({
    id: 8,
    applicationId: 'DEF008',
    studentId: 'XMUM2309010',
    fullName: 'Sarah Chen',
    intake: '2023/09',
    nricPassport: 'E87654321',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    personalEmail: 'sarah.chen@student.xmum.edu.my',
    phoneNumber: '0131112233',
    accommodationRoomNo: 'D-401',
    defermentPeriod: '2025/09',
    mainReason: 'Financial Reason',
    detailedReason: 'Temporary financial hardship.',
    parentGuardianName: 'Chen Wei',
    parentContactNo: '0145566778',
    parentNricPassport: 'E11223344',
    parentRelationship: 'Father',
    parentEmail: 'chen.wei@email.com',
    attachment: { fileName: 'sarah-financial.pdf', size: 210000 },
    status: 'In Progress',
    approvalStage: 'International Student Affairs Office',
    applicationSession: '2023/09',
    effectiveSession: '2025/09',
    submittedAt: '2024-06-15T10:00:00.000Z',
    dateOfApplication: '2024-06-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Sarah Chen', action: 'Submitted', dateTime: '15.06.2024 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'Pending Review', action: 'Approved', dateTime: '20.06.2024 11:00', comment: 'Passed initial review.' },
      { id: 3, stage: 'HOD/HOP', actor: 'HOD/HOP', action: 'Approved', dateTime: '22.06.2024 14:00', comment: 'Endorsed.' },
      { id: 4, stage: 'AA HOD', actor: 'AA HOD', action: 'Approved', dateTime: '25.06.2024 09:00', comment: '' },
    ],
  }),
  buildRecord({
    id: 15,
    applicationId: 'DEF015',
    studentId: 'XMUM2401001',
    fullName: 'Lee Recall Demo',
    intake: '2024/09',
    nricPassport: '050505050505',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    personalEmail: 'lee.recall@student.xmum.edu.my',
    phoneNumber: '0198877665',
    accommodationRoomNo: 'E-302',
    defermentPeriod: '2025/02',
    mainReason: 'Health Issue',
    detailedReason: 'Demo record for approval recall.',
    parentGuardianName: 'Lee Parent',
    parentContactNo: '0191122334',
    parentNricPassport: '720101010101',
    parentRelationship: 'Father',
    parentEmail: 'lee.parent@email.com',
    attachment: { fileName: 'recall-demo.pdf', size: 120000 },
    status: 'In Progress',
    approvalStage: 'AA HOD',
    applicationSession: '2024/09',
    effectiveSession: '2025/02',
    submittedAt: '2024-10-01T09:00:00.000Z',
    dateOfApplication: '2024-09-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Lee Recall Demo', action: 'Submitted', dateTime: '01.10.2024 09:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'Pending Review', action: 'Approved', dateTime: '05.10.2024 10:00', comment: '' },
      { id: 3, stage: 'HOD/HOP', actor: 'HOD/HOP', action: 'Approved', dateTime: '08.10.2024 11:00', comment: 'Endorsed for AA HOD review.' },
    ],
  }),
  // —— 会签并行进行中（审批日志演示：通过 / 待审 / 需修改）——
  buildRecord({
    id: 16,
    applicationId: 'DEF016',
    studentId: 'XMUM2309033',
    fullName: 'Parallel Branch Demo',
    intake: '2024/02',
    nricPassport: '060606060606',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    personalEmail: 'parallel.demo@student.xmum.edu.my',
    phoneNumber: '0176655443',
    accommodationRoomNo: 'F-110',
    defermentPeriod: '2025/09',
    mainReason: 'Personal Reason',
    detailedReason: 'Demo for parallel countersignature approval log.',
    parentGuardianName: 'Demo Parent',
    parentContactNo: '0171122334',
    parentNricPassport: '710101010101',
    parentRelationship: 'Father',
    parentEmail: 'demo.parent@email.com',
    attachment: { fileName: 'parallel-demo.pdf', size: 156000 },
    status: 'In Progress',
    approvalStage: 'Library',
    applicationSession: '2024/02',
    effectiveSession: '2025/09',
    submittedAt: '2025-03-01T09:00:00.000Z',
    dateOfApplication: '2025-02-28',
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Parallel Branch Demo',
        action: 'Submitted',
        dateTime: '01.03.2025 09:00',
        comment: '',
      },
      {
        id: 2,
        stage: 'Pending Review',
        actor: 'AC Officer',
        action: 'Approved',
        dateTime: '03.03.2025 10:00',
        comment: '附件材料符合，允许申请',
      },
      {
        id: 3,
        stage: 'HOD/HOP',
        actor: 'HOD Officer',
        action: 'Approved',
        dateTime: '05.03.2025 14:00',
        comment: '',
      },
      {
        id: 4,
        stage: 'AA HOD',
        actor: 'AA HOD Officer',
        action: 'Approved',
        dateTime: '07.03.2025 11:00',
        comment: '',
      },
      {
        id: 5,
        stage: 'Admissions Office',
        actor: 'Admissions Officer',
        action: 'Approved',
        dateTime: '10.03.2025 09:30',
        comment: '录取档案核对无误',
      },
      {
        id: 6,
        stage: 'IT Office',
        actor: 'IT Officer',
        action: 'Update Required',
        dateTime: '11.03.2025 16:00',
        comment: '附件材料缺失',
      },
    ],
  }),
  // —— Draft ×2 ——
  buildRecord({
    id: 3,
    applicationId: 'DEF003',
    studentId: 'XMUM2309020',
    fullName: 'Wong Mei Ling',
    intake: '2024/09',
    nricPassport: '040404040404',
    nationality: 'Malaysia',
    programme: 'Bachelor of Software Engineering',
    programmeLevel: 'Undergraduate',
    defermentPeriod: '',
    mainReason: '',
    status: 'Draft',
    approvalStage: '--',
    approvalLog: [],
  }),
  buildRecord({
    id: 6,
    applicationId: 'DEF006',
    studentId: 'XMUM2309021',
    fullName: 'David Tan',
    intake: '2023/09',
    nricPassport: '090909090909',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'david.tan@student.xmum.edu.my',
    defermentPeriod: '2025/09',
    mainReason: 'Personal Reason',
    detailedReason: 'Draft in progress.',
    status: 'Draft',
    approvalStage: '--',
    approvalLog: [],
  }),
  // —— Update Required ×2 ——
  buildRecord({
    id: 4,
    applicationId: 'DEF004',
    studentId: 'XMUM2309016',
    fullName: 'Ng Jia Hui',
    intake: '2023/04',
    nricPassport: '050505050505',
    nationality: 'Malaysia',
    programme: 'Bachelor of International Business',
    programmeLevel: 'Undergraduate',
    personalEmail: 'ng.jiahui@student.xmum.edu.my',
    phoneNumber: '0189900112',
    accommodationRoomNo: 'E-312',
    defermentPeriod: '2025/02',
    mainReason: 'Personal Reason',
    detailedReason: 'Please update supporting documents.',
    parentGuardianName: 'Ng Siew Leng',
    parentContactNo: '0187788990',
    parentNricPassport: '720101010101',
    parentRelationship: 'Mother',
    parentEmail: 'ng.siewleng@email.com',
    attachment: { fileName: 'ng-draft.pdf', size: 95000 },
    status: 'Update Required',
    approvalStage: '--',
    submittedAt: '2024-06-15T10:00:00.000Z',
    dateOfApplication: '2024-06-10',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Ng Jia Hui', action: 'Submitted', dateTime: '15.06.2024 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Update Required', dateTime: '20.06.2024 14:00', comment: 'Please attach updated parent consent letter.' },
    ],
  }),
  buildRecord({
    id: 11,
    applicationId: 'DEF011',
    studentId: 'XMUM2309017',
    fullName: 'Raj Kumar',
    intake: '2023/09',
    nricPassport: '070707070707',
    nationality: 'Malaysia',
    programme: 'Bachelor of Accounting',
    programmeLevel: 'Undergraduate',
    personalEmail: 'raj.kumar@student.xmum.edu.my',
    phoneNumber: '0145566778',
    accommodationRoomNo: 'F-201',
    defermentPeriod: '2024/09',
    mainReason: 'Health Issue',
    detailedReason: 'Incomplete medical certificate.',
    parentGuardianName: 'Kumar Rajan',
    parentContactNo: '0156677889',
    parentNricPassport: '710101010101',
    parentRelationship: 'Father',
    parentEmail: 'kumar.rajan@email.com',
    attachment: { fileName: 'raj-medical.pdf', size: 88000 },
    status: 'Update Required',
    approvalStage: '--',
    submittedAt: '2024-04-01T08:00:00.000Z',
    dateOfApplication: '2024-03-28',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Raj Kumar', action: 'Submitted', dateTime: '01.04.2024 08:00', comment: '' },
      { id: 2, stage: 'Academic Affairs', actor: 'System Admin', action: 'Update Required', dateTime: '05.04.2024 09:30', comment: 'Please provide complete medical documentation.' },
    ],
  }),
  // —— Cancelled ×2 ——
  buildRecord({
    id: 9,
    applicationId: 'DEF009',
    studentId: 'XMUM2309014',
    fullName: 'Lim Wei Jie',
    intake: '2024/09',
    nricPassport: '060606060606',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'lim.weijie@student.xmum.edu.my',
    phoneNumber: '0190011223',
    defermentPeriod: '2025/09',
    mainReason: 'Personal Reason',
    parentGuardianName: 'Lim Ah Beng',
    parentContactNo: '0191122334',
    attachment: { fileName: 'lim-consent.pdf', size: 110000 },
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
    applicationId: 'DEF010',
    studentId: 'XMUM2309015',
    fullName: 'Chen Yu Ting',
    intake: '2023/09',
    nricPassport: 'E11223344',
    nationality: 'China',
    programme: 'Bachelor of Finance',
    programmeLevel: 'Undergraduate',
    personalEmail: 'chen.yuting@student.xmum.edu.my',
    defermentPeriod: '2025/02',
    mainReason: 'Others',
    parentGuardianName: 'Chen Ming',
    parentContactNo: '0134455667',
    attachment: { fileName: 'chen-consent.pdf', size: 130000 },
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
    applicationId: 'DEF012',
    studentId: 'XMUM2309018',
    fullName: 'Siti Aminah',
    intake: '2024/09',
    nricPassport: '080808080808',
    nationality: 'Malaysia',
    programme: 'Bachelor of Data Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'siti.aminah@student.xmum.edu.my',
    defermentPeriod: '2025/09',
    mainReason: 'Financial Reason',
    parentGuardianName: 'Aminah Hassan',
    parentContactNo: '0156677889',
    attachment: { fileName: 'siti-docs.pdf', size: 102000 },
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-05-10T10:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Siti Aminah', action: 'Submitted', dateTime: '10.05.2024 10:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Rejected', dateTime: '15.05.2024 11:00', comment: 'Insufficient supporting documents.' },
    ],
  }),
  buildRecord({
    id: 13,
    applicationId: 'DEF013',
    studentId: 'XMUM2309019',
    fullName: 'Priya Sharma',
    intake: '2024/09',
    nricPassport: '030303030303',
    nationality: 'Malaysia',
    programme: 'Bachelor of Computer Science',
    programmeLevel: 'Undergraduate',
    personalEmail: 'priya.sharma@student.xmum.edu.my',
    defermentPeriod: '2025/02',
    mainReason: 'Health Issue',
    parentGuardianName: 'Sharma Raj',
    parentContactNo: '0167788990',
    attachment: { fileName: 'priya-medical.pdf', size: 98000 },
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
    submittedAt: '2024-07-01T08:00:00.000Z',
    approvalLog: [
      { id: 1, stage: 'Submission', actor: 'Priya Sharma', action: 'Submitted', dateTime: '01.07.2024 08:00', comment: '' },
      { id: 2, stage: 'Pending Review', actor: 'System Admin', action: 'Approved', dateTime: '05.07.2024 10:00', comment: '' },
      { id: 3, stage: 'Academic Affairs', actor: 'System Admin', action: 'Rejected', dateTime: '12.07.2024 14:00', comment: 'Deferment reason does not meet policy requirements.' },
    ],
  }),
]
