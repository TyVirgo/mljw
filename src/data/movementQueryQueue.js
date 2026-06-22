import {
  programmeTransfers,
  deferments,
  resumptions,
  withdrawals,
} from './movementStore.js'
import { normalizeMaintenanceItem } from './movementMaintenanceQueue.js'
import { movementApprovalStatusOptions } from './movementApprovalQueue.js'

export { movementApprovalStatusOptions as movementQueryStatusOptions }

export function mergeMovementQueryQueue(t) {
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
      rows.push(normalizeMaintenanceItem(sourceKey, item, t))
    }
  }
  return rows.sort((a, b) => {
    const da = new Date(a.submittedAt || 0).getTime()
    const db = new Date(b.submittedAt || 0).getTime()
    return db - da
  })
}

export function filterQueryBySearch(items, search) {
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
