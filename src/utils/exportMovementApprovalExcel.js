import * as XLSX from 'xlsx'
import { movementApprovalExportColumnMeta } from '../data/movementApprovalExportFields.js'
import { formatImplementedYn } from '../data/movementApprovalQueue.js'
import { formatMovementDate } from './formatMovementDate.js'
import { formatEffectiveSession } from './formatEffectiveSession.js'

function approvalStatusLabel(status, t) {
  const map = {
    Draft: t('deferment.status.draft'),
    'In Progress': t('deferment.status.inProgress'),
    'Update Required': t('deferment.status.updateRequired'),
    Approved: t('deferment.status.approved'),
    Rejected: t('deferment.status.rejected'),
    Cancelled: t('deferment.status.cancelled'),
    Expired: t('programmeTransfer.status.expired'),
  }
  return map[status] || status
}

export function formatApprovalExportRow(row, index, { t, tr } = {}) {
  const effectiveSession = formatEffectiveSession(row.effectiveSession)
  return {
    no: index + 1,
    status: approvalStatusLabel(row.status, t),
    approvalStage: tr(row.approvalStage),
    studentId: row.studentId || '',
    fullName: row.fullName || '',
    applicationSession: row.applicationSession || '',
    effectiveSession: effectiveSession === '—' ? '' : effectiveSession,
    movementCategory: t(row.movementCategoryKey),
    historicalApplicationSequence:
      row.historicalApplicationSequence != null ? String(row.historicalApplicationSequence) : '1',
    applicationDate: formatMovementDate(row.applicationDateDisplay || row.submittedAt || row.dateOfApplication),
    implemented: formatImplementedYn(row.implemented),
  }
}

export function exportMovementApprovalToExcel(
  rows,
  filename = 'movement-approval.xlsx',
  selectedFieldKeys = movementApprovalExportColumnMeta.map((col) => col.key),
  i18n = {},
  sheetName = 'Movement Approval',
  exportOptions = {},
) {
  const { t = (key) => key, tr = (value) => value } = i18n
  const columnMeta = exportOptions.columnMeta || movementApprovalExportColumnMeta
  const formatOptions = { t, tr }
  const columns = columnMeta.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const sheetRows = rows.map((item, index) => {
    const formatted = formatApprovalExportRow(item, index, formatOptions)
    const row = {}
    columns.forEach((col) => {
      const header = col.labelKey ? t(col.labelKey) : col.key
      row[header] = formatted[col.key] ?? ''
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}
