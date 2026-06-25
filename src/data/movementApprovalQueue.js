import { classifyApprovalBucket } from './movementApprovalEngine.js'
import { inferStudentCategory } from './movementApprovalEngine.js'
import {
  programmeTransfers,
  deferments,
  resumptions,
  withdrawals,
} from './movementStore.js'
import { getMainReasonLabel as getDefermentReasonLabel, formatDefermentListDate } from './deferments.js'
import { getMainReasonLabel as getWithdrawalReasonLabel, formatWithdrawalListDate } from './withdrawals.js'
import { formatTransferListDate } from './programmeTransfers.js'
import { formatResumptionListDate } from './resumptions.js'

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

import {
  MOVEMENT_SOURCE_TO_CATEGORY_CODE,
  resolveReasonLabel,
} from './movementCategories.js'
import { resolveStatDimensions } from './movementStatisticsDimensions.js'
import { normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'

function extractMovementReason(sourceKey, item, t) {
  const categoryCode = MOVEMENT_SOURCE_TO_CATEGORY_CODE[sourceKey]
  switch (sourceKey) {
    case 'programme-transfer':
    case 'deferment':
    case 'withdrawal': {
      const label = resolveReasonLabel(categoryCode, item.reasonId)
      if (label) return label
      if (sourceKey === 'programme-transfer') return item.transferReason || '—'
      if (sourceKey === 'deferment') {
        return getDefermentReasonLabel(item.mainReason, t) || item.detailedReason || '—'
      }
      return getWithdrawalReasonLabel(item.mainReason, t) || item.detailedReason || '—'
    }
    case 'resumption':
      return item.defermentSemester
        ? `${item.defermentSemester} → ${item.resumptionSemester || '—'}`
        : '—'
    default:
      return '—'
  }
}

function extractApplicationSession(item) {
  return normalizeAcademicSession(item.applicationSession || item.intake || item.originalIntake)
}

export function extractEffectiveSession(sourceKey, item) {
  let raw
  if (item.effectiveSession) {
    raw = item.effectiveSession
  } else {
    switch (sourceKey) {
      case 'programme-transfer':
        raw = item.adminNewIntake || item.startSemester || '—'
        break
      case 'deferment':
        raw = item.defermentPeriod || '—'
        break
      case 'resumption':
        raw = item.resumptionSemester || '—'
        break
      case 'withdrawal':
        raw = item.lastDateOfAttendance || '—'
        break
      default:
        raw = '—'
    }
  }
  return normalizeAcademicSession(raw)
}

export { formatEffectiveSession } from '../utils/formatEffectiveSession.js'

export function resolveImplementedStatus(item) {
  return item.implemented || (item.status === 'Approved' ? 'Pending' : '—')
}

export function formatImplementedYn(value) {
  return value === 'Implemented' ? 'Y' : 'N'
}

export function formatApprovalApplicationDate(sourceKey, item) {
  const raw = item.submittedAt || item.applicationDate || item.dateOfApplication
  switch (sourceKey) {
    case 'programme-transfer':
      return formatTransferListDate(raw)
    case 'deferment':
      return formatDefermentListDate(raw)
    case 'resumption':
      return formatResumptionListDate(raw)
    case 'withdrawal':
      return formatWithdrawalListDate(raw)
    default:
      return raw || '—'
  }
}

export function normalizeQueueItem(sourceKey, item, t) {
  const implemented = resolveImplementedStatus(item)
  return {
    queueKey: `${sourceKey}:${item.id}`,
    id: item.id,
    sourceKey,
    applicationId: item.applicationId,
    status: item.status,
    approvalStage: item.approvalStage,
    implemented,
    implementedYn: formatImplementedYn(implemented),
    studentId: item.studentId,
    fullName: item.fullName || item.name || '',
    studentCategory: inferStudentCategory(item),
    applicationSession: extractApplicationSession(item),
    effectiveSession: extractEffectiveSession(sourceKey, item),
    movementCategoryKey: MOVEMENT_CATEGORY_KEYS[sourceKey],
    movementReason: extractMovementReason(sourceKey, item, t),
    programmeCode: resolveStatDimensions(sourceKey, item).programmeCode,
    applicationDateDisplay: formatApprovalApplicationDate(sourceKey, item),
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
    if (s.academicSession && row.applicationSession !== String(s.academicSession).trim()) return false
    if (s.programmeCode && !matchText(row.programmeCode, s.programmeCode)) return false
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
