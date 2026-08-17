/**
 * 批次长短学期与退课截止周默认值（演示口径）
 * 长学期：开课第 2 周周五 17:00；短学期：开课第 1 周周五 17:00
 */

export const TERM_KIND_LONG = 'long'
export const TERM_KIND_SHORT = 'short'

/**
 * @param {{ termKind?: string, academicSession?: string }|null|undefined} batch
 * @returns {'long'|'short'}
 */
export function resolveBatchTermKind(batch) {
  if (batch?.termKind === TERM_KIND_SHORT || batch?.termKind === TERM_KIND_LONG) {
    return batch.termKind
  }
  const session = String(batch?.academicSession || '')
  // /02 短学期；/04、/09 等视为长学期
  if (/\/02(?:\b|$)/.test(session)) return TERM_KIND_SHORT
  return TERM_KIND_LONG
}

/**
 * @param {{ dropDeadlineWeek?: number, termKind?: string, academicSession?: string }|null|undefined} batch
 */
export function resolveDropDeadlineWeek(batch) {
  const raw = Number(batch?.dropDeadlineWeek)
  if (Number.isFinite(raw) && raw > 0) return raw
  return resolveBatchTermKind(batch) === TERM_KIND_SHORT ? 1 : 2
}

/** 演示用：长短学期申请窗结束对齐周五 17:00:00 的样例区间 */
export const DEMO_ADD_DROP_WINDOW_LONG = {
  start: '01-Sep-2025 00:00:00',
  end: '12-Sep-2025 17:00:00', // 第 2 周周五
}

export const DEMO_ADD_DROP_WINDOW_SHORT = {
  start: '20-Jan-2025 00:00:00',
  end: '24-Jan-2025 17:00:00', // 第 1 周周五
}

/** 原型演示：保持窗口开放便于加退课联调（结束仍对齐 17:00） */
export const DEMO_ADD_DROP_WINDOW_OPEN_LONG = {
  start: '01-Jul-2026 00:00:00',
  end: '31-Aug-2026 17:00:00',
}
