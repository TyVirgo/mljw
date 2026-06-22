import * as XLSX from 'xlsx'
import { movementQueryExportColumnMeta } from '../data/movementQueryExportFields.js'
import { MAINTENANCE_EMPTY } from '../data/movementMaintenanceFields.js'

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

export function formatQueryExportRow(row, index, { t, tr }) {
  return {
    no: index + 1,
    status: statusLabel(row.status, t),
    approvalStage: tr(row.approvalStage),
    implemented: implementedLabel(row.implemented, t),
    studentId: row.studentId || '',
    fullName: row.fullName || '',
    applicationSession: row.applicationSession || '',
    effectiveSession: row.effectiveSession || '',
    movementCategory: t(row.movementCategoryKey),
    movementReason: row.movementReason || '',
    movementDate: displayCell(row.movementDate),
    passportIc: displayCell(row.passportIc),
    studentType: studentTypeLabel(row.studentType, t),
    intake: displayCell(row.intake),
    currentSchool: displayCell(row.currentSchool),
    currentProgrammeCode: displayCell(row.currentProgrammeCode),
    newSchool: displayCell(row.newSchool),
    newProgrammeCode: displayCell(row.newProgrammeCode),
    newProgrammeName: displayCell(row.newProgrammeName),
    englishName: displayCell(row.englishName),
    cgpa: displayCell(row.cgpa),
    expectedGraduationTime: displayCell(row.expectedGraduationTime),
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
) {
  const { t = (key) => key, tr = (value) => value } = i18n
  const columns = movementQueryExportColumnMeta.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const sheetRows = rows.map((item, index) => {
    const formatted = formatQueryExportRow(item, index, { t, tr })
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
