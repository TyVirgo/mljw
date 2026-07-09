const APPROVAL_ACTION_LABEL_KEYS = {
  Approved: 'approvalModal.action.approved',
  Rejected: 'approvalModal.action.rejected',
  'Update Required': 'approvalModal.action.updateRequired',
}

export function getApprovalActionLabel(action, t) {
  const key = APPROVAL_ACTION_LABEL_KEYS[action]
  return key ? t(key) : action
}
