import { resolveReasonLabel } from './movementCategories.js'

const DEF_CATEGORY_CODE = 'DEF001'

export function formatDefermentOrdinal(count) {
  const value = Math.max(1, Number(count) || 1)
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`
  const mod10 = value % 10
  if (mod10 === 1) return `${value}st`
  if (mod10 === 2) return `${value}nd`
  if (mod10 === 3) return `${value}rd`
  return `${value}th`
}

export function buildDefermentStatusLogRemarkLines(student, defermentItem) {
  const lines = []
  const start = String(defermentItem?.defermentStartDate || '').trim()
  const end = String(defermentItem?.defermentEndDate || '').trim()
  const period = String(defermentItem?.defermentPeriod || '').trim()
  const reason =
    resolveReasonLabel(DEF_CATEGORY_CODE, defermentItem?.reasonId) ||
    defermentItem?.mainReason ||
    defermentItem?.reason ||
    ''

  const priorCount = (student?.statusLogs || []).filter(
    (entry) =>
      entry.movementCategoryKey === 'menu.srDeferment' ||
      String(entry.movementCategory || '').trim() === 'Deferment',
  ).length

  if (start && end) {
    lines.push(`${formatDefermentOrdinal(priorCount + 1)} Deferment: ${start}-${end}`)
  }
  if (period) lines.push(`Deferment Period : ${period}`)
  if (reason) lines.push(`Reason : ${reason}`)
  return lines.length ? lines : ['Deferment Period : —']
}
