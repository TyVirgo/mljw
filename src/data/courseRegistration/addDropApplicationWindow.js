import { batchDateToPicker } from './registrationBatchFormUtils.js'
import { getActiveBatch } from './registrationBatches.js'

/** 将批次日期（25-Aug-2025 或 25/08/2025）解析为本地日界 Date；失败返回 null */
export function parseBatchDateToLocalDay(value, endOfDay = false) {
  const picker = batchDateToPicker(value)
  const match = String(picker || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  if (endOfDay) return new Date(year, month, day, 23, 59, 59, 999)
  return new Date(year, month, day, 0, 0, 0, 0)
}

/**
 * 是否处于「加退课申请」窗口内。
 * 起止皆空：视为未配置，允许申请（避免草稿批次误伤）。
 * 仅一端有值：按该端约束。
 */
export function isWithinAddDropApplicationWindow(batch = getActiveBatch(), now = new Date()) {
  const window = batch?.addDropWindow || {}
  const startRaw = String(window.start || '').trim()
  const endRaw = String(window.end || '').trim()
  if (!startRaw && !endRaw) return true

  const start = startRaw ? parseBatchDateToLocalDay(startRaw, false) : null
  const end = endRaw ? parseBatchDateToLocalDay(endRaw, true) : null
  if (startRaw && !start) return false
  if (endRaw && !end) return false
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}
