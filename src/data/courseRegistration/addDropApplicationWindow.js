import { batchDateToPicker, parseBatchDateTime } from './registrationBatchFormUtils.js'
import { getActiveBatch } from './registrationBatches.js'
import { resolveEffectiveAddDropWindow } from './sessionRegistrationSchedules.js'

/**
 * 是否处于「加退课申请」窗口内（学期全局申请窗）。
 * 起止皆空：视为未配置，允许申请（避免草稿批次误伤）。
 */
export function isWithinAddDropApplicationWindow(batch = getActiveBatch(), now = new Date()) {
  const window = resolveEffectiveAddDropWindow(batch)
  const startRaw = String(window.start || '').trim()
  const endRaw = String(window.end || '').trim()
  if (!startRaw && !endRaw) return true

  let start = startRaw ? parseBatchDateTime(startRaw) : null
  let end = endRaw ? parseBatchDateTime(endRaw) : null

  if (startRaw && start && !/\d{1,2}:\d{2}/.test(startRaw)) {
    start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0)
  }
  if (endRaw && end && !/\d{1,2}:\d{2}/.test(endRaw)) {
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
  }

  if (startRaw && !start) return false
  if (endRaw && !end) return false
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

/** @deprecated 保留兼容：日界解析 */
export function parseBatchDateToLocalDay(value, endOfDay = false) {
  const picker = batchDateToPicker(value)
  const match = String(picker || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  if (endOfDay) return new Date(year, month, day, 23, 59, 59, 999)
  return new Date(year, month, day, 0, 0, 0, 0)
}
