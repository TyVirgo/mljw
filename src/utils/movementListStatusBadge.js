import { statusBadgeClass } from '../data/deferments.js'

export function movementListStatusBadgeClass(status) {
  if (status === 'Expired') return 'status-expired'
  return statusBadgeClass(status)
}
