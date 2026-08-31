import * as XLSX from 'xlsx'
import { scopeLabelsFromRules } from '../data/courseRegistration/batchScopeRules.js'
import { formatIntakeBatch } from '../data/intakeSets.js'
import { getAddDropCourseColumnTexts } from './addDropCourseDisplay.js'
import { getRegistrationTypeLabel } from '../data/courseRegistration/registrationTypes.js'
import { feeCourseSourceLabel } from '../data/courseRegistration/feeRosterQueue.js'
import { getRegistrationLogResultLabelKey } from '../data/courseRegistration/registrationLog.js'

export function exportRowsToExcel(rows, columns, filename, sheetName = 'Export', i18n = {}) {
  const { t = (key) => key } = i18n
  if (!columns.length || !rows.length) return false

  const workbook = XLSX.utils.book_new()
  const worksheet = buildSheetFromRows(rows, columns, t)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
  return true
}

function buildSheetFromRows(rows, columns, t) {
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
  return XLSX.utils.json_to_sheet(sheetRows)
}

/**
 * 多 sheet 导出
 * @param {{ name: string, rows: object[], columns: object[], formatRow?: Function }[]} sheets
 */
export function exportMultiSheetExcel(sheets, filename, i18n = {}) {
  const { t = (key) => key } = i18n
  if (!sheets?.length) return false
  const workbook = XLSX.utils.book_new()
  let appended = 0
  for (const sheet of sheets) {
    const rawRows = sheet.rows || []
    if (!sheet.columns?.length || !rawRows.length) continue
    const formatted = sheet.formatRow ? rawRows.map((row) => sheet.formatRow(row, t)) : rawRows
    const worksheet = buildSheetFromRows(formatted, sheet.columns, t)
    const name = String(sheet.name || `Sheet${appended + 1}`).slice(0, 31)
    XLSX.utils.book_append_sheet(workbook, worksheet, name)
    appended += 1
  }
  if (!appended) return false
  XLSX.writeFile(workbook, filename)
  return true
}

export function formatBatchExportRow(batch, t) {
  return {
    name: batch.name,
    academicSession: batch.academicSession || batch.semester,
    type: batch.type,
    scope:
      Array.isArray(batch.scopeRules) && batch.scopeRules.length
        ? scopeLabelsFromRules(batch.scopeRules).join(', ')
        : (batch.scope || []).join(', '),
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
  const courses = getAddDropCourseColumnTexts(row)
  return {
    applicationNo: row.applicationNo,
    studentId: row.studentId,
    studentName: row.studentName,
    type: t(`courseRegistration.approval.type.${row.type}`),
    addCourseName: courses.add,
    dropCourseName: courses.drop,
    retakeCourseName: courses.retake,
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
    intake: formatIntakeBatch(row.intake),
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

export function formatResultStudentExportRow(row, t = (key) => key) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme,
    intake: formatIntakeBatch(row.intake),
    batchName: row.batchName || '',
    courseCode: row.courseCode || '',
    courseName: row.courseName || '',
    credits: row.credits,
    courseType: row.courseType || '',
    sectionCode: row.sectionCode || '',
    isRetake: row.isRetake ? t('common.yes') : t('common.no'),
    courseSource: feeCourseSourceLabel(row.courseSource, t),
  }
}

export function formatResultCourseExportRow(row) {
  return {
    batchName: row.batchName || '',
    courseCode: row.courseCode,
    courseName: row.courseName,
    credits: row.credits,
    effectiveCapacity: row.effectiveCapacityLabel,
    enrolledFreshman: row.freshmanCapacityLabel,
    enrolledSenior: row.seniorCapacityLabel,
  }
}

export function formatRegistrationLogExportRow(row, t) {
  const course = [row.courseCode, row.courseName].filter(Boolean).join(' ')
  const operator =
    row.operatorId && row.operatorName
      ? `${row.operatorId}(${row.operatorName})`
      : row.operatorName || row.operatorId || ''
  const queueStatus = formatQueueStatusExport(row, t)
  return {
    batchName: row.batchName,
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme || '',
    intake: formatIntakeBatch(row.intake) || '',
    course,
    sectionCode: row.sectionCode
      ? t('courseRegistration.courses.sectionNameDisplay', { code: row.sectionCode })
      : '',
    credits: row.credits ?? '',
    courseType: getRegistrationTypeLabel(row.courseType, t) || row.courseType || '',
    isRetake: row.isRetake ? t('common.yes') : t('common.no'),
    operator,
    operatedAt: row.operatedAt,
    queueStatus,
    result: t(getRegistrationLogResultLabelKey(row.result, row.round)),
  }
}

function formatQueueStatusExport(row, t) {
  if (row.queueStatus === 'queuing') {
    const rank = row.queueRank != null ? row.queueRank : '—'
    return `#${rank}`
  }
  if (row.queueStatus === 'cancelled') return t('courseRegistration.log.queueStatus.cancelled')
  return ''
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
