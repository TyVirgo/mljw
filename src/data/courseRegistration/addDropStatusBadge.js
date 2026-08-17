import { statusBadgeClass as movementStatusBadgeClass } from '../deferments.js'

/** 加退申请状态 → 学籍风格 status-badge class */
export function addDropStatusBadgeClass(status) {
  switch (status) {
    case 'Pending':
      return 'status-pending'
    case 'In Review':
      return 'status-progress'
    case 'Approved':
      return 'status-approved'
    case 'Rejected':
      return 'status-rejected'
    case 'Cancelled':
      return 'status-cancelled'
    default:
      return movementStatusBadgeClass(status) || 'status-draft'
  }
}
