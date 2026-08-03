export const LONG_SEMESTER_CREDIT_MIN = 12
export const LONG_SEMESTER_CREDIT_MAX = 20
export const RESUMPTION_CREDIT_MAX = 21
export const SHORT_SEMESTER_CREDIT_MIN = 4
/** @deprecated 已改为选课规则「延迟缴费天数」；保留别名避免旧引用断裂 */
export const DEFAULT_PAYMENT_GRACE_DAYS = 2
export const DEFAULT_BILL_HOURS = DEFAULT_PAYMENT_GRACE_DAYS

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
