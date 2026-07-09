import {
  programmeTransfers,
  deferments,
  resumptions,
  withdrawals,
} from './movementStore.js'
import { normalizeMaintenanceItem } from './movementMaintenanceQueue.js'
import { movementApprovalStatusOptions } from './movementApprovalQueue.js'
import { filterMovementListBySearch } from './movementListSearchFilters.js'

export { movementApprovalStatusOptions as movementQueryStatusOptions }

export const movementQueryTypeOptions = [
  'programme-transfer',
  'deferment',
  'resumption',
  'withdrawal',
]

export const movementQueryTypeLabelKeys = {
  'programme-transfer': 'menu.srProgrammeTransfer',
  deferment: 'menu.srDeferment',
  resumption: 'menu.srResumption',
  withdrawal: 'menu.srWithdrawal',
}

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
  return filterMovementListBySearch(items, search)
}
