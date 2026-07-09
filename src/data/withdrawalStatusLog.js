import { resolveReasonLabel } from './movementCategories.js'
import { formatStatusLogDate } from '../utils/formatMovementDate.js'

const WDR_CATEGORY_CODE = 'WDR001'

export function buildWithdrawalStatusLogRemarkLines(withdrawalItem) {
  const lines = []

  const lastDate = String(withdrawalItem?.lastDateOfAttendance || '').trim()
  if (lastDate) {
    lines.push(`Last Date of Attendance : ${formatStatusLogDate(lastDate)}`)
  }

  const reason =
    resolveReasonLabel(WDR_CATEGORY_CODE, withdrawalItem?.reasonId) ||
    withdrawalItem?.mainReason ||
    withdrawalItem?.reason ||
    ''
  if (reason) lines.push(`Reason : ${reason}`)

  const note = String(withdrawalItem?.note || withdrawalItem?.remarks || '').trim()
  if (note) lines.push(`Note : ${note}`)

  return lines.length ? lines : ['Reason : —']
}
