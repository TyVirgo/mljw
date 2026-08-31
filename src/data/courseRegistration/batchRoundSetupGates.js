import { batchDateToPicker, parsePickerDate } from './registrationBatchFormUtils.js'

/** 第二轮结束日（含当天结束）是否已过（业务判断用；非管理轮次配置闸门） */
export function isBatchMainRoundEnded(batch, now = new Date()) {
  const by = batch?.roundsByAudience?.senior || batch?.rounds
  const endRaw = by?.main?.end
  if (!endRaw) return false
  const picker = batchDateToPicker(endRaw)
  const end = parsePickerDate(picker)
  if (!end) return false
  end.setHours(23, 59, 59, 999)
  return end.getTime() < now.getTime()
}

export function isBatchVolunteerFinallyConfirmed(batch) {
  return Boolean(batch?.volunteerFinalConfirmedAt)
}

/**
 * 批次轮次配置闸门（已废除串行锁定：R1/R2/R3 与加退课均始终可配）
 */
export function getBatchRoundSetupGates(_batch) {
  return {
    preselect: { open: true },
    main: { open: true, lockReasonKey: '' },
    supplement: { open: true, lockReasonKey: '' },
    addDrop: { open: true },
  }
}

export function listUnlockedScopeRounds(gates) {
  const keys = []
  if (gates?.preselect?.open) keys.push('preselect')
  if (gates?.main?.open) keys.push('main')
  if (gates?.supplement?.open) keys.push('supplement')
  return keys
}
