import * as XLSX from 'xlsx'
import { formatRoundRange } from '../data/courseRegistration/registrationBatches.js'

export function exportRowsToExcel(rows, columns, filename, sheetName = 'Export', i18n = {}) {
  const { t = (key) => key } = i18n
  if (!columns.length || !rows.length) return false

  const sheetRows = rows.map((item, index) => {
    const row = {}
    columns.forEach((col) => {
      const header = col.labelKey ? t(col.labelKey) : col.key
      let value = item[col.key]
      if (col.key === 'no') value = index + 1
      if (Array.isArray(value)) value = value.join(', ')
      if (typeof value === 'boolean') value = value ? t('common.yes') : t('common.no')
      row[header] = value ?? ''
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
  return true
}

export function formatBatchExportRow(batch, t) {
  return {
    name: batch.name,
    academicSession: batch.academicSession || batch.semester,
    type: batch.type,
    roundPreselect: formatRoundRange(batch.rounds?.preselect),
    roundMain: formatRoundRange(batch.rounds?.main),
    roundSupplement: formatRoundRange(batch.rounds?.supplement),
    roundAddDrop: formatRoundRange(batch.addDropWindow),
    scope: (batch.scope || []).join(', '),
    courseCount: batch.courseCount,
    status: t(`courseRegistration.batch.status.${batch.status}`),
  }
}

export function formatMonitorExportRow(row, t) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme,
    intake: row.intake,
    credits: `${row.credits}/${row.creditMax}`,
    status: t(`courseRegistration.monitor.status.${row.status}`),
  }
}

export function formatApprovalExportRow(row, t) {
  return {
    applicationNo: row.applicationNo,
    studentId: row.studentId,
    studentName: row.studentName,
    type: t(`courseRegistration.approval.type.${row.type}`),
    content: row.items?.map((i) => `${i.action} ${i.courseCode}`).join(' · ') || '',
    credits: `${row.currentCredits}/${row.creditMax}`,
    billStatus:
      !row.billStatus || row.billStatus === 'none'
        ? '—'
        : t(`courseRegistration.approval.bill.${row.billStatus}`),
    submittedAt: row.submittedAt,
    status: row.status,
  }
}

export function formatSupplementExportRow(row, t) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme,
    intake: row.intake,
    listType: t(`courseRegistration.supplement.types.${row.listType}`),
    canAdd: row.canAdd,
    canDrop: row.canDrop,
    canRetake: row.canRetake,
    addedAt: row.addedAt,
    addedBy: row.addedBy,
  }
}

export function formatAlertExportRow(row, t) {
  const typeKey = `courseRegistration.alert.types.${row.alertType}`
  const translated = t(typeKey)
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme,
    alertType: translated !== typeKey ? translated : row.alertType,
    severity: t(`courseRegistration.alert.severity.${row.severity}`),
    credits: `${row.credits}/${row.creditMax}`,
    createdAt: row.createdAt,
  }
}

export function exportCourseRegistrationData({
  rows,
  columns,
  formatRow,
  filename,
  sheetName,
  i18n,
}) {
  const { t = (key) => key } = i18n
  const formatted = rows.map((row) => formatRow(row, t))
  return exportRowsToExcel(formatted, columns, filename, sheetName, i18n)
}
