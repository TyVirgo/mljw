import { classifyApprovalBucket } from './movementApprovalEngine.js'
import { inferStudentCategory } from './movementApprovalEngine.js'
import {
  programmeTransfers,
  deferments,
  resumptions,
  withdrawals,
} from './movementStore.js'
import { getMainReasonLabel as getDefermentReasonLabel } from './deferments.js'
import { getMainReasonLabel as getWithdrawalReasonLabel } from './withdrawals.js'

export const movementApprovalStatusOptions = [
  'In Progress',
  'Update Required',
  'Approved',
  'Rejected',
  'Cancelled',
]

const MOVEMENT_CATEGORY_KEYS = {
  'programme-transfer': 'menu.srProgrammeTransfer',
  deferment: 'menu.srDeferment',
  resumption: 'menu.srResumption',
  withdrawal: 'menu.srWithdrawal',
}

function extractMovementReason(sourceKey, item, t) {
  switch (sourceKey) {
    case 'programme-transfer':
      return item.transferReason || '—'
    case 'deferment':
      return getDefermentReasonLabel(item.mainReason, t) || item.detailedReason || '—'
    case 'resumption':
      return item.defermentSemester
        ? `${item.defermentSemester} → ${item.resumptionSemester || '—'}`
        : '—'
    case 'withdrawal':
      return getWithdrawalReasonLabel(item.mainReason, t) || item.detailedReason || '—'
    default:
      return '—'
  }
}

function extractApplicationSession(item) {
  return (
    item.applicationSession ||
    item.intake ||
    item.dateOfApplication ||
    item.startSemester ||
    '—'
  )
}

function extractEffectiveSession(sourceKey, item) {
  if (item.effectiveSession) return item.effectiveSession
  switch (sourceKey) {
    case 'programme-transfer':
      return item.adminNewIntake || item.startSemester || '—'
    case 'deferment':
      return item.defermentPeriod || '—'
    case 'resumption':
      return item.resumptionSemester || '—'
    case 'withdrawal':
      return item.lastDateOfAttendance || '—'
    default:
      return '—'
  }
}

export function normalizeQueueItem(sourceKey, item, t) {
  return {
    queueKey: `${sourceKey}:${item.id}`,
    id: item.id,
    sourceKey,
    applicationId: item.applicationId,
    status: item.status,
    approvalStage: item.approvalStage,
    implemented: item.implemented || (item.status === 'Approved' ? 'Pending' : '—'),
    studentId: item.studentId,
    fullName: item.fullName || item.name || '',
    studentCategory: inferStudentCategory(item),
    applicationSession: extractApplicationSession(item),
    effectiveSession: extractEffectiveSession(sourceKey, item),
    movementCategoryKey: MOVEMENT_CATEGORY_KEYS[sourceKey],
    movementReason: extractMovementReason(sourceKey, item, t),
    submittedAt: item.submittedAt || item.applicationDate,
    raw: item,
  }
}

export function mergeMovementApprovalQueue(t) {
  const sources = [
    ['programme-transfer', programmeTransfers.value],
    ['deferment', deferments.value],
    ['resumption', resumptions.value],
    ['withdrawal', withdrawals.value],
  ]
  const rows = []
  for (const [sourceKey, list] of sources) {
    for (const item of list) {
      if (item.status === 'Draft') continue
      rows.push(normalizeQueueItem(sourceKey, item, t))
    }
  }
  return rows.sort((a, b) => {
    const da = new Date(a.submittedAt || 0).getTime()
    const db = new Date(b.submittedAt || 0).getTime()
    return db - da
  })
}

export function filterByBucket(items, bucket, currentRole) {
  return items.filter((row) => classifyApprovalBucket(row.raw, currentRole) === bucket)
}

export function filterBySearch(items, search) {
  const s = search || {}
  return items.filter((row) => {
    if (s.academicSession && !matchText(row.applicationSession, s.academicSession)) return false
    if (s.movementReason && !matchText(row.movementReason, s.movementReason)) return false
    if (s.status && row.status !== s.status) return false
    if (s.studentId && !matchText(row.studentId, s.studentId)) return false
    if (s.studentName && !matchText(row.fullName, s.studentName)) return false
    return true
  })
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(String(keyword).trim().toLowerCase())
}
