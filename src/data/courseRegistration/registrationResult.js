import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import { selectableCourses } from './selectableCourses.js'

export function buildStudentRegistrationResults(monitorRows = registrationMonitorQueue.value) {
  return monitorRows
    .filter((row) => row.credits > 0)
    .map((row) => ({
      id: `result-stu-${row.id}`,
      studentId: row.studentId,
      studentName: row.studentName,
      programme: row.programme,
      intake: row.intake,
      credits: row.credits,
      courseCount: row.schedule?.length || 0,
      courses: (row.schedule || []).map((s) => s.course).join(', '),
      status: row.status === 'normal' ? 'confirmed' : 'warning',
    }))
}

export function buildCourseRegistrationResults(courses = selectableCourses.value) {
  return courses.map((course) => {
    const enrolled = course.totalCapacity - course.remainingCapacity
    return {
      id: `result-course-${course.id}`,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      batchId: course.batchId,
      totalCapacity: course.totalCapacity,
      enrolled,
      remaining: course.remainingCapacity,
      utilization: course.totalCapacity
        ? Math.round((enrolled / course.totalCapacity) * 100)
        : 0,
    }
  })
}

export function filterStudentResults(rows, filters = {}) {
  let list = [...rows]
  if (filters.programme) {
    list = list.filter((r) => r.programme.toLowerCase().includes(filters.programme.toLowerCase()))
  }
  if (filters.status) list = list.filter((r) => r.status === filters.status)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.studentId.toLowerCase().includes(kw) || r.studentName.toLowerCase().includes(kw),
    )
  }
  return list
}

export function filterCourseResults(rows, filters = {}) {
  let list = [...rows]
  if (filters.batchId) list = list.filter((r) => r.batchId === filters.batchId)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.courseCode.toLowerCase().includes(kw) || r.courseName.toLowerCase().includes(kw),
    )
  }
  return list
}

export function syncStudyPlanDemo() {
  return { ok: true, messageKey: 'courseRegistration.result.syncSuccess' }
}
