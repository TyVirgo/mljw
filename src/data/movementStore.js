import { ref } from 'vue'
import { initialProgrammeTransfers, normalizeTransfer } from './programmeTransfers.js'
import { initialDeferments, normalizeDeferment } from './deferments.js'
import { initialResumptions, normalizeResumption } from './resumptions.js'
import { initialWithdrawals, normalizeWithdrawal } from './withdrawals.js'
import { seedMaintenanceShowcaseRecords } from './movementMaintenanceFields.js'

function cloneList(initial, normalize) {
  return initial.map((item) => normalize({ ...item }))
}

export const programmeTransfers = ref(cloneList(initialProgrammeTransfers, normalizeTransfer))
export const deferments = ref(cloneList(initialDeferments, normalizeDeferment))
export const resumptions = ref(cloneList(initialResumptions, normalizeResumption))
export const withdrawals = ref(cloneList(initialWithdrawals, normalizeWithdrawal))

seedMaintenanceShowcaseRecords()

export function upsertInStore(sourceKey, updated) {
  const listRef = getStoreList(sourceKey)
  if (!listRef) return
  const index = listRef.value.findIndex((row) => row.id === updated.id)
  if (index === -1) {
    listRef.value.push(updated)
  } else {
    listRef.value[index] = updated
  }
}

export function getStoreList(sourceKey) {
  switch (sourceKey) {
    case 'programme-transfer':
      return programmeTransfers
    case 'deferment':
      return deferments
    case 'resumption':
      return resumptions
    case 'withdrawal':
      return withdrawals
    default:
      return null
  }
}

export function findInStore(sourceKey, id) {
  const listRef = getStoreList(sourceKey)
  return listRef?.value.find((row) => row.id === id) ?? null
}
