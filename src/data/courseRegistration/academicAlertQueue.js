import { registrationMonitorQueue } from './registrationMonitorQueue.js'

const alertTypeMap = {
  creditLow: 'creditBelowMin',
  creditHigh: 'creditAtMax',
  g1CategoryLow: 'g1CategoryShortfall',
  prerequisiteMissing: 'prerequisiteMissing',
  notRegistered: 'notRegistered',
}

export function buildAcademicAlerts(monitorRows = registrationMonitorQueue.value) {
  const alerts = []
  for (const row of monitorRows) {
    if (row.status === 'normal' && !row.issues?.length) continue
    const alertTypes = row.issues?.length
      ? row.issues
      : [alertTypeMap[row.status] || row.status]
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
        severity: ['notRegistered', 'creditBelowMin', 'creditAtMax'].includes(alertType) ? 'high' : 'medium',
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
