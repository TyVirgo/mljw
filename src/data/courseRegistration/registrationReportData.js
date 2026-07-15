import { registrationMonitorQueue, getMonitorStats } from './registrationMonitorQueue.js'
import { selectableCourses } from './selectableCourses.js'
import { addDropApprovalQueue } from './addDropApprovalQueue.js'
import { buildAcademicAlerts } from './academicAlertQueue.js'

export const reportCardIds = [
  'participation',
  'creditDistribution',
  'capacityUsage',
  'addDropStats',
  'problemStudents',
]

export const reportDetailColumnKeys = {
  participation: ['studentId', 'studentName', 'programme', 'credits', 'participated'],
  creditDistribution: ['studentId', 'studentName', 'credits', 'min', 'max', 'status'],
  capacityUsage: ['courseCode', 'courseName', 'enrolled', 'capacity', 'utilization'],
  addDropStats: ['applicationNo', 'studentId', 'type', 'status', 'submittedAt'],
  problemStudents: ['studentId', 'studentName', 'alertType', 'credits'],
}

export function getReportColumns(cardId) {
  return reportDetailColumnKeys[cardId] || []
}

export function buildReportSummary() {
  const monitorStats = getMonitorStats(registrationMonitorQueue.value)
  const participationRate = monitorStats.total
    ? Math.round((monitorStats.participated / monitorStats.total) * 100)
    : 0
  const courses = selectableCourses.value
  const avgUtilization = courses.length
    ? Math.round(
        courses.reduce((sum, c) => sum + ((c.totalCapacity - c.remainingCapacity) / c.totalCapacity) * 100, 0) /
          courses.length,
      )
    : 0
  const addDropCount = addDropApprovalQueue.value.length
  const problemCount = buildAcademicAlerts().filter((a) => a.severity === 'high').length

  return {
    participation: { rate: participationRate, total: monitorStats.total, participated: monitorStats.participated },
    creditDistribution: {
      belowMin: monitorStats.belowMin,
      aboveMax: monitorStats.aboveMax,
      avgCredits: monitorStats.avgCredits,
    },
    capacityUsage: { avgUtilization, courseCount: courses.length },
    addDropStats: {
      total: addDropCount,
      pending: addDropApprovalQueue.value.filter((a) => a.status === 'Pending').length,
      approved: addDropApprovalQueue.value.filter((a) => a.status === 'Approved').length,
    },
    problemStudents: { count: problemCount },
  }
}

export function getReportDetailRows(cardId) {
  switch (cardId) {
    case 'participation':
      return registrationMonitorQueue.value.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        programme: r.programme,
        credits: r.credits,
        participated: r.credits > 0 ? 'Yes' : 'No',
      }))
    case 'creditDistribution':
      return registrationMonitorQueue.value.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        credits: r.credits,
        min: r.creditMin,
        max: r.creditMax,
        status: r.status,
      }))
    case 'capacityUsage':
      return selectableCourses.value.map((c) => ({
        courseCode: c.code,
        courseName: c.name,
        enrolled: c.totalCapacity - c.remainingCapacity,
        capacity: c.totalCapacity,
        utilization: Math.round(((c.totalCapacity - c.remainingCapacity) / c.totalCapacity) * 100),
      }))
    case 'addDropStats':
      return addDropApprovalQueue.value.map((a) => ({
        applicationNo: a.applicationNo,
        studentId: a.studentId,
        type: a.type,
        status: a.status,
        submittedAt: a.submittedAt,
      }))
    case 'problemStudents':
      return buildAcademicAlerts()
        .filter((a) => a.severity === 'high')
        .map((a) => ({
          studentId: a.studentId,
          studentName: a.studentName,
          alertType: a.alertType,
          credits: a.credits,
        }))
    default:
      return []
  }
}
