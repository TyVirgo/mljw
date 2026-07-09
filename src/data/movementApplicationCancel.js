import { cancelApplication as cancelProgrammeTransfer } from './programmeTransfers.js'
import { cancelApplication as cancelDeferment } from './deferments.js'
import { cancelApplication as cancelResumption } from './resumptions.js'
import { cancelApplication as cancelWithdrawal } from './withdrawals.js'
import { upsertInStore } from './movementStore.js'

export const ADMIN_CANCEL_ACTOR = 'AC'

const CANCEL_BY_SOURCE = {
  'programme-transfer': cancelProgrammeTransfer,
  deferment: cancelDeferment,
  resumption: cancelResumption,
  withdrawal: cancelWithdrawal,
}

/** Admin list: any In Progress application (student Early Cancel rules unchanged). */
export function canAdminCancelMovement(item) {
  return item?.status === 'In Progress'
}

export function adminCancelMovement(sourceKey, item, actor = ADMIN_CANCEL_ACTOR) {
  const cancelFn = CANCEL_BY_SOURCE[sourceKey]
  if (!cancelFn || !item) return item
  return cancelFn(item, actor)
}

export function applyAdminCancelInStore(sourceKey, item, actor = ADMIN_CANCEL_ACTOR) {
  const updated = adminCancelMovement(sourceKey, item, actor)
  if (updated && updated !== item) {
    upsertInStore(sourceKey, updated)
  }
  return updated
}
