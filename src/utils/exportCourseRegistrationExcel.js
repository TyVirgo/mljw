import * as XLSX from 'xlsx'
import { scopeLabelsFromRules } from '../data/courseRegistration/batchScopeRules.js'
import { formatIntakeBatch } from '../data/intakeSets.js'
import { getAddDropCourseColumnTexts } from './addDropCourseDisplay.js'
import { getRegistrationTypeLabel } from '../data/courseRegistration/registrationTypes.js'
import { feeCourseSourceLabel } from '../data/courseRegistration/feeRosterQueue.js'
import { getRegistrationLogResultLabelKey } from '../data/courseRegistration/registrationLog.js'
import {
  formatStudentOperatorDisplay,
  formatStudentOpResultLabel,
  formatCoursePreferenceLabel,
  formatStudentResultPreferenceLabel,
} from '../data/courseRegistration/registrationResult.js'
import {
  formatGraduationGeSummary,
  formatGraduationMeSummary,
  formatGraduationGeCompletion,
  formatGraduationMeCompletion,
  formatTermGeSummary,
  formatTermMeSummary,
  formatTermGeCompletion,
  formatTermMeCompletion,
  formatTermTotalSelectedCredits,
  formatGraduationMandatorySummary,
  formatGraduationMandatoryCompletion,
} from '../data/courseRegistration/monitorCreditInsights.js'
import { formatWhitelistAddedAt } from '../data/courseRegistration/supplementListQueue.js'
import { ensureDateTimeWithSeconds } from '../data/courseRegistration/registrationBatchFormUtils.js'

/**
 * @param {object[]} rows 已格式化行
 * @param {object[]} columns
 * @param {string} filename
 * @param {string} [sheetName]
 * @param {object} [i18n]
 * @param {{ mergeByKey?: string, mergeFieldKeys?: string[] }} [mergeOpts]
 */
export function exportRowsToExcel(
  rows,
  columns,
  filename,
  sheetName = 'Export',
  i18n = {},
  mergeOpts = {},
) {
  const { t = (key) => key } = i18n
  if (!columns.length || !rows.length) return false

  const workbook = XLSX.utils.book_new()
  const worksheet = buildSheetFromRows(rows, columns, t, mergeOpts)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
  return true
}

/**
 * @param {object[]} rows
 * @param {object[]} columns
 * @param {Function} t
 * @param {{ mergeByKey?: string, mergeFieldKeys?: string[] }} [mergeOpts]
 */
function buildSheetFromRows(rows, columns, t, mergeOpts = {}) {
  // aoa：允许重复表头（如课程班名单导出两列「课程代码」）
  const headers = columns.map((col) => (col.labelKey ? t(col.labelKey) : col.key))
  const mergeByKey = mergeOpts.mergeByKey || ''
  const mergeFieldKeys = Array.isArray(mergeOpts.mergeFieldKeys) ? mergeOpts.mergeFieldKeys : []
  const mergeColIndexes = columns
    .map((col, idx) => (mergeFieldKeys.includes(col.key) ? idx : -1))
    .filter((idx) => idx >= 0)

  const data = rows.map((item, index) => {
    const prev = index > 0 ? rows[index - 1] : null
    const sameGroup =
      mergeByKey &&
      prev &&
      String(item[mergeByKey] || '') !== '' &&
      String(item[mergeByKey]) === String(prev[mergeByKey])
    return columns.map((col) => {
      // 同组合并行：仅首行保留合并列值，其余留空便于单元格合并
      if (sameGroup && mergeFieldKeys.includes(col.key)) return ''
      let value = item[col.key]
      if (col.key === 'no') value = index + 1
      if (Array.isArray(value)) value = value.join(', ')
      if (typeof value === 'boolean') value = value ? t('common.yes') : t('common.no')
      return value ?? ''
    })
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
  if (mergeByKey && mergeColIndexes.length) {
    worksheet['!merges'] = buildVerticalMerges(rows, mergeByKey, mergeColIndexes)
  }
  return worksheet
}

/**
 * 按 mergeByKey 连续相同值生成纵向合并区域（数据行从 sheet 第 1 行起，0 为表头）
 * @param {object[]} rows
 * @param {string} mergeByKey
 * @param {number[]} mergeColIndexes
 * @returns {{ s: { r: number, c: number }, e: { r: number, c: number } }[]}
 */
function buildVerticalMerges(rows, mergeByKey, mergeColIndexes) {
  const merges = []
  let groupStart = 0
  while (groupStart < rows.length) {
    const key = String(rows[groupStart][mergeByKey] || '')
    let groupEnd = groupStart
    while (
      groupEnd + 1 < rows.length &&
      key !== '' &&
      String(rows[groupEnd + 1][mergeByKey] || '') === key
    ) {
      groupEnd += 1
    }
    if (groupEnd > groupStart && key) {
      // sheet 行号：表头占 r=0，数据从 r=1
      const startR = groupStart + 1
      const endR = groupEnd + 1
      for (const c of mergeColIndexes) {
        merges.push({ s: { r: startR, c }, e: { r: endR, c } })
      }
    }
    groupStart = groupEnd + 1
  }
  return merges
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

export function formatMonitorExportRow(row) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme,
    intake: row.intake,
    termTotalCredits: formatTermTotalSelectedCredits(row),
    graduationGe: formatGraduationGeSummary(row),
    graduationGeCompletion: formatGraduationGeCompletion(row),
    termGe: formatTermGeSummary(row),
    termGeCompletion: formatTermGeCompletion(row),
    graduationMe: formatGraduationMeSummary(row),
    graduationMeCompletion: formatGraduationMeCompletion(row),
    termMe: formatTermMeSummary(row),
    termMeCompletion: formatTermMeCompletion(row),
    graduationMandatory: formatGraduationMandatorySummary(row),
    graduationMandatoryCompletion: formatGraduationMandatoryCompletion(row),
    remindCount: Number(row.remindCount) || 0,
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
    submittedAt: ensureDateTimeWithSeconds(row.submittedAt) || row.submittedAt || '',
    status: row.status,
  }
}

/**
 * 审批历史「导出缴费」课行格式化（含整单 SST/总费用；保留 mergeKey）
 * @param {object} row collectApprovalPaymentExportLines 产物
 * @param {Function} t
 */
export function formatApprovalPaymentExportRow(row, t) {
  const bill =
    !row.billStatus || row.billStatus === 'none'
      ? '—'
      : t(`courseRegistration.approval.bill.${row.billStatus}`)
  const paymentStatus =
    row.paymentStatus === 'paid'
      ? t('courseRegistration.approval.exportPaymentPaid')
      : t('courseRegistration.approval.exportPaymentUnpaid')
  return {
    mergeKey: row.mergeKey || row.applicationNo || '',
    studentId: row.studentId || '',
    studentName: row.studentName || '',
    applicationNo: row.applicationNo || '',
    billStatus: bill,
    paymentStatus,
    sstFee: row.sstFee != null && row.sstFee !== '' ? row.sstFee : 0,
    totalFee: row.totalFee != null && row.totalFee !== '' ? row.totalFee : 0,
    courseCode: row.courseCode || '',
    courseName: row.courseName || '',
    credits: row.credits ?? '',
    courseFee: row.courseFee != null && row.courseFee !== '' ? row.courseFee : '',
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
    addedAt: formatWhitelistAddedAt(row.addedAt) || row.addedAt,
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
    courseSource: feeCourseSourceLabel(row.courseSource, t),
    preferenceRank: formatStudentResultPreferenceLabel(row, t),
    operator: formatStudentOperatorDisplay(row),
    operatedAt: row.operatedAt || '',
    opResult: formatStudentOpResultLabel(row, t),
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

export function formatResultR1DetailExportRow(row, t = (key) => key) {
  return {
    batchName: row.batchName || '',
    courseCode: row.courseCode || '',
    courseName: row.courseName || '',
    sectionCode: row.sectionCode
      ? t('courseRegistration.courses.sectionNameDisplay', { code: row.sectionCode })
      : '',
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme || '',
    intake: formatIntakeBatch(row.intake),
    relativeSemester: row.relativeSemester ?? '',
    preferenceRank: formatCoursePreferenceLabel(row, t),
    submittedAt: row.submittedAt || '',
    isGraduate: row.isGraduate ? t('common.yes') : t('common.no'),
    selected: row.selected ? t('common.yes') : t('common.no'),
  }
}

export function formatResultR1SummaryExportRow(row, t = (key) => key) {
  return {
    batchName: row.batchName || '',
    courseCode: row.courseCode || '',
    courseName: row.courseName || '',
    courseType: row.courseType ? getRegistrationTypeLabel(row.courseType, t) : '',
    credits: row.credits,
    sectionCode: row.sectionCode
      ? t('courseRegistration.courses.sectionNameDisplay', { code: row.sectionCode })
      : '',
    capacityLabel: row.capacityLabel || '',
    selectedPercentLabel: row.selectedPercentLabel || '',
    effectiveCapacityLabel: row.effectiveCapacityLabel || '',
    seniorCapacityLabel: row.seniorCapacityLabel || '',
    specialAddedCount: row.specialAddedCount ?? 0,
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
/**
 * @param {object} opts
 * @param {object[]} opts.rows
 * @param {object[]} opts.columns
 * @param {Function} opts.formatRow
 * @param {string} opts.filename
 * @param {string} [opts.sheetName]
 * @param {object} [opts.i18n]
 * @param {string} [opts.mergeByKey] 格式化后行上的合并分组键
 * @param {string[]} [opts.mergeFieldKeys] 需要纵向合并的列 key
 */
export function exportCourseRegistrationData({
  rows,
  columns,
  formatRow,
  filename,
  sheetName,
  i18n,
  mergeByKey,
  mergeFieldKeys,
}) {
  const { t = (key) => key } = i18n
  const formatted = rows.map((row) => formatRow(row, t))
  return exportRowsToExcel(formatted, columns, filename, sheetName, i18n, {
    mergeByKey,
    mergeFieldKeys,
  })
}
