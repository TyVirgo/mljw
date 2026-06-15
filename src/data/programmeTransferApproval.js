import {
  canApproveTransfer,
  formatTransferDateTime,
} from './programmeTransfers.js'

export const approvalActionOptions = ['Approved', 'Rejected', 'Update Required']

export const commonApprovalComments = [
  'Reviewed and approved. No further changes required.',
  'Please revise the supporting documents and resubmit.',
  'Insufficient reason provided. Update required before approval.',
  'Rejected due to policy restrictions on programme transfer.',
  'Approved with conditions noted in comments.',
]

const STAGE_FLOW = {
  'Pending Review': { next: 'Academic Affairs', final: false },
  'Academic Affairs': { next: 'Dean/HoP', final: false },
  'Dean/HoP': { next: 'Approved', final: true },
}

const MOCK_APPROVER = 'System Admin'

function appendApprovalLog(item, { stage, action, comment, actor = MOCK_APPROVER }) {
  const now = formatTransferDateTime(new Date())
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
        dateTime: now,
        comment: comment || '',
      },
    ],
  }
}

function applyApprovedDecision(item, comment) {
  const flow = STAGE_FLOW[item.approvalStage]
  if (!flow) return item

  let updated = appendApprovalLog(item, {
    stage: item.approvalStage,
    action: 'Approved',
    comment,
  })

  if (flow.final) {
    return {
      ...updated,
      status: 'Approved',
      approvalStage: 'Approved',
      archived: true,
      adminNewProgramme: item.adminNewProgramme || item.newProgrammeFirstChoice || '',
      adminNewIntake: item.adminNewIntake || item.startSemester || '',
      adminDate: item.adminDate || new Date().toISOString().slice(0, 10),
    }
  }

  return {
    ...updated,
    status: 'In Progress',
    approvalStage: flow.next,
  }
}

function applyRejectedDecision(item, comment) {
  return {
    ...appendApprovalLog(item, {
      stage: item.approvalStage,
      action: 'Rejected',
      comment,
    }),
    status: 'Rejected',
    approvalStage: '--',
    archived: true,
  }
}

function applyUpdateRequiredDecision(item, comment) {
  return {
    ...appendApprovalLog(item, {
      stage: item.approvalStage,
      action: 'Update Required',
      comment,
    }),
    status: 'Update Required',
    approvalStage: '--',
    archived: false,
  }
}

export function applyApprovalDecisionToItem(item, action, comment) {
  if (!canApproveTransfer(item)) return item

  if (action === 'Approved') {
    return applyApprovedDecision({ ...item, approvalLog: item.approvalLog || [] }, comment)
  }
  if (action === 'Rejected') {
    return applyRejectedDecision(item, comment)
  }
  if (action === 'Update Required') {
    return applyUpdateRequiredDecision(item, comment)
  }
  return item
}

export function validateApprovalForm(action, comment, item = null) {
  const errors = {}
  if (!action) {
    errors.action = 'Please select an approval result.'
  }
  if ((action === 'Rejected' || action === 'Update Required') && !comment?.trim()) {
    errors.comment = 'Comments are required for this approval result.'
  }
  if (comment && comment.length > 200) {
    errors.comment = 'Comments must not exceed 200 characters.'
  }
  if (action === 'Approved' && item?.approvalStage === 'Dean/HoP') {
    const programme = item.adminNewProgramme || item.newProgrammeFirstChoice
    if (!programme?.trim()) {
      errors.adminNewProgramme = 'New Programme is required for final approval.'
    }
  }
  return errors
}
