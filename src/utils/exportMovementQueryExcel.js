import * as XLSX from 'xlsx'
import { movementQueryExportColumnMeta } from '../data/movementQueryExportFields.js'
import { MAINTENANCE_EMPTY } from '../data/movementMaintenanceFields.js'
import { formatImplementedYn } from '../data/movementApprovalQueue.js'
import { maskPassportIc } from './maskPassportIc.js'
import { formatMovementDate } from './formatMovementDate.js'
import { formatEffectiveSession } from './formatEffectiveSession.js'

function displayCell(value) {
  if (value === '' || value == null) return MAINTENANCE_EMPTY
  return value
}

function statusLabel(status, t) {
  const map = {
    Draft: t('deferment.status.draft'),
    'In Progress': t('deferment.status.inProgress'),
    'Update Required': t('deferment.status.updateRequired'),
    Approved: t('deferment.status.approved'),
    Rejected: t('deferment.status.rejected'),
    Cancelled: t('deferment.status.cancelled'),
  }
  return map[status] || status
}

function implementedLabel(value, t) {
  const key = `movementMaintenance.implemented.${value}`
  const translated = t(key)
  return translated !== key ? translated : displayCell(value)
}

function studentTypeLabel(type, t) {
  const key = `movementMaintenance.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : type
}

function formatExportDate(value) {
  const formatted = formatMovementDate(value)
  return formatted === '—' ? MAINTENANCE_EMPTY : formatted
}

function formatExportEffectiveSession(value) {
  const formatted = formatEffectiveSession(value)
  return formatted === '—' ? MAINTENANCE_EMPTY : formatted
}

export function formatQueryExportRow(row, index, { t, tr, implementedAsYn = false, maskPassport = false } = {}) {
  const passportRaw = displayCell(row.passportIc)
  return {
    no: index + 1,
    status: statusLabel(row.status, t),
    approvalStage: tr(row.approvalStage),
    implemented: implementedAsYn
      ? formatImplementedYn(row.implemented)
      : implementedLabel(row.implemented, t),
    studentId: row.studentId || '',
    fullName: row.fullName || '',
    applicationSession: row.applicationSession || '',
    effectiveSession: formatExportEffectiveSession(row.effectiveSession),
    movementCategory: t(row.movementCategoryKey),
    movementReason: row.movementReason || '',
    movementDate: formatExportDate(row.movementDate),
    passportIc:
      maskPassport && passportRaw !== MAINTENANCE_EMPTY
        ? maskPassportIc(passportRaw)
        : passportRaw,
    studentType: studentTypeLabel(row.studentType, t),
    intake: displayCell(row.intake),
    currentSchool: displayCell(row.currentSchool),
    currentProgrammeCode: displayCell(row.currentProgrammeCode),
    newSchool: displayCell(row.newSchool),
    newProgrammeCode: displayCell(row.newProgrammeCode),
    newProgrammeName: displayCell(row.newProgrammeName),
    englishName: displayCell(row.englishName),
    cgpa: displayCell(row.cgpa),
    movementNumber: displayCell(row.movementNumber),
    remark: displayCell(row.remark),
  }
}

export function exportMovementQueryToExcel(
  rows,
  filename = 'movement-query.xlsx',
  selectedFieldKeys = movementQueryExportColumnMeta.map((col) => col.key),
  i18n = {},
  sheetName = 'Movement Query',
  exportOptions = {},
) {
  const { t = (key) => key, tr = (value) => value } = i18n
  const columnMeta = exportOptions.columnMeta || movementQueryExportColumnMeta
  const formatOptions = {
    t,
    tr,
    implementedAsYn: exportOptions.implementedAsYn === true,
    maskPassport: exportOptions.maskPassport === true,
  }
  const columns = columnMeta.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const sheetRows = rows.map((item, index) => {
    const formatted = formatQueryExportRow(item, index, formatOptions)
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
