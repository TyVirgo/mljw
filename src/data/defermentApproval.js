import {
  canApproveDeferment,
  formatDefermentDateTime,
} from './deferments.js'

export const approvalActionOptions = ['Approved', 'Rejected', 'Update Required']

export const commonApprovalComments = [
  'Reviewed and approved. No further changes required.',
  'Please revise the supporting documents and resubmit.',
  'Insufficient reason provided. Update required before approval.',
  'Rejected due to policy restrictions on deferment.',
  'Approved with conditions noted in comments.',
]

const STAGE_FLOW = {
  'Pending Review': { next: 'Academic Affairs', final: false },
  'Academic Affairs': { next: 'Approved', final: true },
}

const MOCK_APPROVER = 'System Admin'

function appendApprovalLog(item, { stage, action, comment, actor = MOCK_APPROVER }) {
  const now = formatDefermentDateTime(new Date())
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
  if (!canApproveDeferment(item)) return item

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

export function validateApprovalForm(action, comment) {
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
  return errors
}
