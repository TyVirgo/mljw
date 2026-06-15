import {
  getNextStage,
  getPreviousStage,
  isFinalWorkflowStage,
  stageMatchesRole,
} from './movementApprovalWorkflows.js'
import { upsertInStore } from './movementStore.js'
import { formatTransferDateTime } from './programmeTransfers.js'
import { formatDefermentDateTime } from './deferments.js'
import { formatResumptionDateTime } from './resumptions.js'
import { formatWithdrawalDateTime } from './withdrawals.js'

export const DEFAULT_APPROVER_ROLE = 'Pending Review'

export const approvalActionOptions = ['Approved', 'Rejected', 'Update Required']

export const commonApprovalComments = [
  'Reviewed and approved. No further changes required.',
  'Please revise the supporting documents and resubmit.',
  'Insufficient reason provided. Update required before approval.',
  'Rejected due to policy restrictions.',
  'Approved with conditions noted in comments.',
]

function formatDateTime(sourceKey) {
  switch (sourceKey) {
    case 'programme-transfer':
      return formatTransferDateTime(new Date())
    case 'deferment':
      return formatDefermentDateTime(new Date())
    case 'resumption':
      return formatResumptionDateTime(new Date())
    case 'withdrawal':
      return formatWithdrawalDateTime(new Date())
    default:
      return new Date().toISOString()
  }
}

export function inferStudentCategory(item) {
  if (item.studentCategory) return item.studentCategory
  if (item.nationality === 'China') return 'China'
  if (item.nationality && item.nationality !== 'Malaysia') return 'International'
  return 'Local'
}

function getSubmissionCycleStart(item) {
  const logs = item.approvalLog || []
  const submit = logs.find((e) => e.action === 'Submitted')
  return submit?.dateTime || item.submittedAt || ''
}

export function hasRoleActedInCycle(item, role) {
  const cycleStart = getSubmissionCycleStart(item)
  return (item.approvalLog || []).some(
    (entry) =>
      entry.actor === role &&
      ['Approved', 'Rejected', 'Update Required'].includes(entry.action) &&
      (!cycleStart || entry.dateTime >= cycleStart || entry.stage === item.approvalStage),
  )
}

export function classifyApprovalBucket(item, currentRole) {
  const status = item.status

  if (status === 'Cancelled') return 'history'
  if (['Approved', 'Rejected', 'Expired'].includes(status)) {
    return hasRoleActedInCycle(item, currentRole) ? 'history' : null
  }
  if (status === 'Update Required') return 'submitted'
  if (status === 'Draft') return null

  if (status === 'In Progress') {
    if (stageMatchesRole(item.approvalStage, currentRole)) return 'pending'
    if (hasRoleActedInCycle(item, currentRole)) return 'history'
    return 'submitted'
  }

  return null
}

function appendLog(item, sourceKey, { stage, action, comment, actor }) {
  const nextId = (item.approvalLog?.length || 0) + 1
  return {
    ...item,
    approvalLog: [
      ...(item.approvalLog || []),
      {
        id: nextId,
        stage,
        actor,
        action,
        dateTime: formatDateTime(sourceKey),
        comment: comment || '',
      },
    ],
  }
}

export function validateApprovalForm(action, comment, item = null) {
  const errors = {}
  if (!action) errors.action = 'Please select an approval result.'
  if ((action === 'Rejected' || action === 'Update Required') && !comment?.trim()) {
    errors.comment = 'Comments are required for this approval result.'
  }
  if (comment && comment.length > 200) {
    errors.comment = 'Comments must not exceed 200 characters.'
  }
  if (
    action === 'Approved' &&
    item?.sourceKey === 'programme-transfer' &&
    item.approvalStage === 'Dean/HoP'
  ) {
    const programme = item.adminNewProgramme || item.newProgrammeFirstChoice
    if (!programme?.trim()) {
      errors.adminNewProgramme = 'New Programme is required for final approval.'
    }
  }
  return errors
}

export function applyMovementDecision(sourceKey, item, action, comment, actor, adminFields = {}) {
  if (!item || item.status !== 'In Progress') return item
  if (!stageMatchesRole(item.approvalStage, actor)) return item

  const category = inferStudentCategory(item)
  const merged = { ...item, ...adminFields }

  if (action === 'Rejected') {
    const updated = {
      ...appendLog(merged, sourceKey, {
        stage: merged.approvalStage,
        action: 'Rejected',
        comment,
        actor,
      }),
      status: 'Rejected',
      approvalStage: '--',
      archived: true,
    }
    upsertInStore(sourceKey, updated)
    return updated
  }

  if (action === 'Update Required') {
    const updated = {
      ...appendLog(merged, sourceKey, {
        stage: merged.approvalStage,
        action: 'Update Required',
        comment,
        actor,
      }),
      status: 'Update Required',
      approvalStage: '--',
      archived: false,
    }
    upsertInStore(sourceKey, updated)
    return updated
  }

  if (action === 'Approved') {
    let updated = appendLog(merged, sourceKey, {
      stage: merged.approvalStage,
      action: 'Approved',
      comment,
      actor,
    })

    if (isFinalWorkflowStage(sourceKey, merged.approvalStage, category)) {
      updated = {
        ...updated,
        status: 'Approved',
        approvalStage: 'Approved',
        archived: true,
        implemented: updated.implemented || 'Pending',
        adminNewProgramme:
          updated.adminNewProgramme || updated.newProgrammeFirstChoice || '',
        adminNewIntake: updated.adminNewIntake || updated.startSemester || '',
        adminDate: updated.adminDate || new Date().toISOString().slice(0, 10),
      }
    } else {
      const next = getNextStage(sourceKey, merged.approvalStage, category)
      updated = {
        ...updated,
        status: 'In Progress',
        approvalStage: next === 'Approved' ? 'Approved' : next,
      }
      if (next === 'Approved') {
        updated.status = 'Approved'
        updated.archived = true
        updated.implemented = updated.implemented || 'Pending'
      }
    }
    upsertInStore(sourceKey, updated)
    return updated
  }

  return item
}

export function canRecallMovement(sourceKey, item, currentRole) {
  if (!item || item.status !== 'In Progress') return false
  const logs = item.approvalLog || []
  if (logs.length < 1) return false
  const last = logs[logs.length - 1]
  if (last.actor !== currentRole || last.action !== 'Approved') return false

  const category = inferStudentCategory(item)
  const nextStage = item.approvalStage
  const nextStageLogs = logs.filter(
    (e) => e.stage === nextStage && e.id !== last.id && ['Approved', 'Rejected'].includes(e.action),
  )
  return nextStageLogs.length === 0 && !stageMatchesRole(nextStage, currentRole)
}

export function recallMovementDecision(sourceKey, item, currentRole) {
  if (!canRecallMovement(sourceKey, item, currentRole)) return item

  const category = inferStudentCategory(item)
  const prevStage = getPreviousStage(sourceKey, item.approvalStage, category)
  const logs = [...(item.approvalLog || [])]
  logs.pop()

  const updated = {
    ...item,
    approvalLog: logs,
    approvalStage: prevStage,
    status: 'In Progress',
    archived: false,
  }
  upsertInStore(sourceKey, updated)
  return updated
}

export function canBatchApproveSelection(items, currentRole) {
  if (!items.length) return false
  const first = items[0]
  return items.every(
    (row) =>
      row.sourceKey === first.sourceKey &&
      row.approvalStage === first.approvalStage &&
      stageMatchesRole(row.approvalStage, currentRole) &&
      row.status === 'In Progress',
  )
}
