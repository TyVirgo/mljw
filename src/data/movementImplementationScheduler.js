import { getStoreList } from './movementStore.js'
import { applyImplementationEffect } from './movementMaintenanceFields.js'
import { extractEffectiveSession } from './movementApprovalQueue.js'
import { getCurrentApplicationSession } from './movementApplicationSession.js'
import { isEffectiveSessionDue } from './movementListSearchOptions.js'

const MOVEMENT_SOURCE_KEYS = ['programme-transfer', 'deferment', 'resumption', 'withdrawal']

/** Mock scheduler: apply profile changes when current session reaches effective session. */
export function processDueImplementations() {
  const current = getCurrentApplicationSession()
  let processed = 0
  for (const sourceKey of MOVEMENT_SOURCE_KEYS) {
    const listRef = getStoreList(sourceKey)
    if (!listRef) continue
    for (const item of listRef.value) {
      if (item.status !== 'Approved' || item.implemented !== 'Scheduled') continue
      const effective = extractEffectiveSession(sourceKey, item)
      if (!isEffectiveSessionDue(current, effective)) continue
      if (applyImplementationEffect(sourceKey, item)) processed += 1
    }
  }
  return processed
}
