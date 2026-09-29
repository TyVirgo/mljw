export const LONG_SEMESTER_CREDIT_MIN = 12
export const LONG_SEMESTER_CREDIT_MAX = 20
export const RESUMPTION_CREDIT_MAX = 21
export const SHORT_SEMESTER_CREDIT_MIN = 4
/** 短学期（学年学期月码 02、04）本学期学分上限 */
export const SHORT_SEMESTER_CREDIT_MAX = 7
/** @deprecated 已改为选课规则「延迟缴费天数」；保留别名避免旧引用断裂 */
export const DEFAULT_PAYMENT_GRACE_DAYS = 2
export const DEFAULT_BILL_HOURS = DEFAULT_PAYMENT_GRACE_DAYS

/**
 * 从学年学期解析月码（02/04/09）
 * @param {string} [academicSession] 如 2026/09、2026/04
 * @returns {number|null} 2 | 4 | 9 | null
 */
export function academicSessionMonth(academicSession) {
  const s = String(academicSession || '').trim()
  if (!s) return null
  const slash = s.match(/\/(\d{1,2})\s*$/)
  if (slash) {
    const m = Number(slash[1])
    if (m === 2 || m === 4 || m === 9) return m
  }
  const compact = s.match(/(20\d{2})[\/\-]?(\d{1,2})/)
  if (compact) {
    const m = Number(compact[2])
    if (m === 2 || m === 4 || m === 9) return m
  }
  return null
}

/** 短学期：月码 02、04 */
export function isShortAcademicSession(academicSession) {
  const m = academicSessionMonth(academicSession)
  return m === 2 || m === 4
}

/** 长学期：月码 09；无法解析时默认长学期（与既有 demo/常量口径一致） */
export function isLongAcademicSession(academicSession) {
  return !isShortAcademicSession(academicSession)
}

/**
 * 本学期学分上限：长学期 09→20，短学期 02/04→7
 * @param {string} [academicSession]
 */
export function resolveTermCreditMax(academicSession) {
  return isShortAcademicSession(academicSession)
    ? SHORT_SEMESTER_CREDIT_MAX
    : LONG_SEMESTER_CREDIT_MAX
}

/**
 * 本学期学分最低：长学期 12，短学期 4
 * @param {string} [academicSession]
 */
export function resolveTermCreditMin(academicSession) {
  return isShortAcademicSession(academicSession)
    ? SHORT_SEMESTER_CREDIT_MIN
    : LONG_SEMESTER_CREDIT_MIN
}

export function computeCreditsAfterApproval(currentCredits, dropCredits = 0, addCredits = 0) {
  return currentCredits - dropCredits + addCredits
}

export function isCreditWithinLimit(credits, min = LONG_SEMESTER_CREDIT_MIN, max = LONG_SEMESTER_CREDIT_MAX) {
  return credits >= min && credits <= max
}

export function detectScheduleConflict(addSlot, currentSchedule = []) {
  if (!addSlot) return false
  return currentSchedule.some(
    (slot) =>
      slot.day === addSlot.day &&
      slot.start < addSlot.end &&
      slot.end > addSlot.start,
  )
}

export function suggestApprovalOrder(items = []) {
  const drops = items.filter((item) => item.action === 'Drop')
  const others = items.filter((item) => item.action !== 'Drop')
  return [...drops, ...others]
}

export function compareRetakePriority(a, b) {
  const rank = { F: 0, M: 1 }
  return (rank[a.retakeGrade] ?? 2) - (rank[b.retakeGrade] ?? 2)
}
