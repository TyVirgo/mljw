import { batchDateToPicker, parsePickerDate } from './registrationBatchFormUtils.js'

/** 第二轮结束日（含当天结束）是否已过 */
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
 * 批次轮次配置闸门（新建 batch=null / 无确认 时仅 R1 / AddDrop 开放）
 * batch.rounds.main.end 可为批次存储或 picker 日期
 */
export function getBatchRoundSetupGates(batch) {
  const confirmed = batch ? isBatchVolunteerFinallyConfirmed(batch) : false
  const mainEnded = batch ? isBatchMainRoundEnded(batch) : false

  return {
    preselect: { open: true },
    main: {
      open: confirmed,
      lockReasonKey: confirmed ? '' : 'courseRegistration.batch.roundLockNeedVolunteerConfirm',
    },
    supplement: {
      open: mainEnded,
      lockReasonKey: mainEnded ? '' : 'courseRegistration.batch.roundLockNeedMainEnded',
    },
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
