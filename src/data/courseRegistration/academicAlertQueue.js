import { registrationMonitorQueue } from './registrationMonitorQueue.js'

const alertTypeMap = {
  creditLow: 'creditBelowMin',
  creditHigh: 'creditAtMax',
  g1CategoryLow: 'g1CategoryShortfall',
  prerequisiteMissing: 'prerequisiteMissing',
  notRegistered: 'notRegistered',
}

const HIGH_ALERT_TYPES = ['notRegistered', 'creditBelowMin', 'creditAtMax', 'creditAboveMax']

export function resolveAlertTypesForRow(row) {
  if (!row) return []
  if (row.issues?.length) return [...row.issues]
  if (row.status === 'normal') return []
  return [alertTypeMap[row.status] || row.status]
}

export function severityForAlertType(alertType) {
  return HIGH_ALERT_TYPES.includes(alertType) ? 'high' : 'medium'
}

/** 监控行 → 预警摘要（一人一行，多类型并列） */
export function getRowAlertMeta(row) {
  const alertTypes = resolveAlertTypesForRow(row)
  if (!alertTypes.length) {
    return { alertTypes: [], severity: '', recommendation: null, hasProblem: false }
  }
  const severity = alertTypes.some((type) => severityForAlertType(type) === 'high')
    ? 'high'
    : 'medium'
  const primaryType =
    alertTypes.find((type) => severityForAlertType(type) === 'high') || alertTypes[0]
  return {
    alertTypes,
    severity,
    recommendation: buildRecommendation(primaryType, row),
    hasProblem: true,
  }
}

export function buildAcademicAlerts(monitorRows = registrationMonitorQueue.value) {
  const alerts = []
  for (const row of monitorRows) {
    const alertTypes = resolveAlertTypesForRow(row)
    for (const alertType of alertTypes) {
      alerts.push({
        id: `alert-${row.id}-${alertType}`,
        studentId: row.studentId,
        studentName: row.studentName,
        programme: row.programme,
        intake: row.intake,
        credits: row.credits,
        creditMax: row.creditMax,
        alertType,
        severity: severityForAlertType(alertType),
        recommendation: buildRecommendation(alertType, row),
        createdAt: row.history?.[0]?.at || '—',
      })
    }
  }
  return alerts
}

function buildRecommendation(alertType, row) {
  switch (alertType) {
    case 'creditBelowMin':
      return { action: 'add', hint: 'recommendAddCredits' }
    case 'creditAtMax':
    case 'creditAboveMax':
      return { action: 'drop', hint: 'recommendDropCredits' }
    case 'g1HumanitiesLow':
    case 'g1CategoryShortfall':
      return { action: 'add', hint: 'recommendG1Humanities' }
    case 'notRegistered':
      return { action: 'supplement', hint: 'recommendSupplement' }
    case 'prerequisiteMissing':
      return { action: 'review', hint: 'recommendPrerequisite' }
    default:
      return { action: 'review', hint: 'recommendReview' }
  }
}

export function filterAcademicAlerts(alerts, filters = {}) {
  let list = [...alerts]
  if (filters.alertType) list = list.filter((r) => r.alertType === filters.alertType)
  if (filters.severity) list = list.filter((r) => r.severity === filters.severity)
  if (filters.programme) {
    list = list.filter((r) => r.programme.toLowerCase().includes(filters.programme.toLowerCase()))
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.studentId.toLowerCase().includes(kw) || r.studentName.toLowerCase().includes(kw),
    )
  }
  return list
}

export const academicAlertTypeOptions = [
  'creditBelowMin',
  'creditAtMax',
  'creditAboveMax',
  'g1CategoryShortfall',
  'g1HumanitiesLow',
  'prerequisiteMissing',
  'notRegistered',
]

export function getAcademicAlertStats(alerts) {
  return {
    total: alerts.length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
  }
}

/** 按学生行统计高/中（一人算一次严重度） */
export function getMonitorAlertStats(rows = registrationMonitorQueue.value) {
  let high = 0
  let medium = 0
  for (const row of rows) {
    const meta = getRowAlertMeta(row)
    if (meta.severity === 'high') high += 1
    else if (meta.severity === 'medium') medium += 1
  }
  return { high, medium, problem: high + medium }
}
