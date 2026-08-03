import { ref } from 'vue'
import { selectableCourses, getCourseAudienceCapacity } from './selectableCourses.js'
import { registrationBatches } from './registrationBatches.js'
import {
  listAdminAddStudentCandidates,
  DEMO_ADMIN_OPERATOR_NAME,
} from './registrationResult.js'

/** 与批次三轮对齐（加退课本模块不做） */
export const RESULT_ROUND_KEYS = ['preselect', 'main', 'supplement']

export const RESULT_ROUND_LABEL_KEYS = {
  preselect: 'courseRegistration.batch.roundPreselect',
  main: 'courseRegistration.batch.roundMain',
  supplement: 'courseRegistration.batch.roundSupplement',
}

function emptyRoundMap() {
  return { preselect: {}, main: {}, supplement: {} }
}

function pickDemoStudents(offset, count) {
  const pool = listAdminAddStudentCandidates()
  const out = []
  for (let i = 0; i < count; i += 1) {
    const profile = pool[(offset + i) % pool.length]
    out.push({
      id: `round-stu-${profile.studentId}-${offset}-${i}`,
      studentId: profile.studentId,
      studentName: profile.studentName,
      programme: profile.programme,
      intake: profile.grade === '2025' ? '2025/04' : '2024/09',
      sectionCode: i % 2 === 0 ? '01' : '02',
    })
  }
  const seen = new Set()
  return out.filter((row) => {
    if (seen.has(row.studentId)) return false
    seen.add(row.studentId)
    return true
  })
}

function seedRoundCourseRosters() {
  const map = emptyRoundMap()
  // 原仅主批：const courses = selectableCourses.value.filter((c) => c.batchId === 'batch-2504-m1').slice(0, 12)
  let index = 0
  const primaryBatchId = 'batch-2504-m1'
  for (const batch of registrationBatches.value) {
    const limit = batch.id === primaryBatchId ? 12 : 4
    const courses = selectableCourses.value.filter((c) => c.batchId === batch.id).slice(0, limit)
    courses.forEach((course) => {
      map.preselect[course.id] = pickDemoStudents(index * 2, 3 + (index % 3))
      map.main[course.id] = pickDemoStudents(index * 3 + 5, 4 + (index % 2))
      // 各批第三轮也至少挂 1～2 人，避免切到 supplement 时本批看起来「全空」
      map.supplement[course.id] =
        index % 3 === 0
          ? pickDemoStudents(index + 20, 2)
          : pickDemoStudents(index + 30, 1 + (index % 2))
      index += 1
    })
  }
  return map
}

/** roundKey -> courseId -> student[] */
export const roundCourseRosters = ref(seedRoundCourseRosters())

export function resetRoundCourseRosters() {
  roundCourseRosters.value = seedRoundCourseRosters()
}

export function getRoundRoster(roundKey, courseId) {
  const bucket = roundCourseRosters.value[roundKey] || {}
  return [...(bucket[courseId] || [])]
}

/** 各轮学号并集人数 */
export function getCumulativeEnrolledCount(courseId) {
  const ids = new Set()
  for (const roundKey of RESULT_ROUND_KEYS) {
    for (const row of getRoundRoster(roundKey, courseId)) {
      ids.add(row.studentId)
    }
  }
  return ids.size
}

export function listRoundCourseSummaries(roundKey, filters = {}) {
  if (!RESULT_ROUND_KEYS.includes(roundKey)) return []
  let courses = [...selectableCourses.value]
  if (filters.batchId) {
    courses = courses.filter((c) => c.batchId === filters.batchId)
  }
  const courseCode = String(filters.courseCode || '').trim().toLowerCase()
  const courseName = String(filters.courseName || '').trim().toLowerCase()
  if (courseCode) {
    courses = courses.filter((c) => String(c.code || '').toLowerCase().includes(courseCode))
  }
  if (courseName) {
    courses = courses.filter((c) => String(c.name || '').toLowerCase().includes(courseName))
  }
  if (filters.keyword) {
    const kw = String(filters.keyword).toLowerCase()
    courses = courses.filter(
      (c) => c.code.toLowerCase().includes(kw) || c.name.toLowerCase().includes(kw),
    )
  }

  return courses
    .map((course) => {
      const roundRoster = getRoundRoster(roundKey, course.id)
      const roundNew = roundRoster.length
      const cumulative = getCumulativeEnrolledCount(course.id)
      const totalCapacity = Number(course.totalCapacity) || 0
      const audience = getCourseAudienceCapacity(course)
      const enrolledTotal = audience.enrolledFreshman + audience.enrolledSenior
      const batchName =
        registrationBatches.value.find((b) => b.id === course.batchId)?.name || ''
      return {
        id: `result-course-${course.id}`,
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        batchId: course.batchId,
        batchName,
        totalCapacity,
        roundNew,
        cumulative,
        enrolledFreshman: audience.enrolledFreshman,
        freshmanCap: audience.freshmanCap,
        enrolledSenior: audience.enrolledSenior,
        seniorCap: audience.seniorCap,
        effectiveCapacityLabel: `${enrolledTotal}/${totalCapacity}`,
        freshmanCapacityLabel: `${audience.enrolledFreshman}/${audience.freshmanCap}`,
        seniorCapacityLabel: `${audience.enrolledSenior}/${audience.seniorCap}`,
      }
    })
    .filter((row) => row.roundNew > 0 || row.cumulative > 0)
}

export function removeRoundCourseStudents(roundKey, courseId, studentIds = []) {
  if (!RESULT_ROUND_KEYS.includes(roundKey) || !courseId || !studentIds.length) {
    return { ok: false, errorKey: 'courseRegistration.result.deleteEmpty' }
  }
  const idSet = new Set(studentIds)
  const bucket = { ...(roundCourseRosters.value[roundKey] || {}) }
  const list = [...(bucket[courseId] || [])]
  const next = list.filter((row) => !idSet.has(row.studentId))
  bucket[courseId] = next
  roundCourseRosters.value = {
    ...roundCourseRosters.value,
    [roundKey]: bucket,
  }
  return { ok: true, removed: list.length - next.length }
}

export function addRoundCourseStudents(roundKey, courseId, studentIds = []) {
  if (!RESULT_ROUND_KEYS.includes(roundKey) || !courseId) {
    return { ok: false, errorKey: 'courseRegistration.result.addTargetRequired' }
  }
  if (!studentIds.length) {
    return { ok: false, errorKey: 'courseRegistration.result.addStudentRequired' }
  }
  const course = selectableCourses.value.find((c) => c.id === courseId)
  if (!course) return { ok: false, errorKey: 'courseRegistration.result.addTargetRequired' }

  const candidates = listAdminAddStudentCandidates()
  const bucket = { ...(roundCourseRosters.value[roundKey] || {}) }
  const list = [...(bucket[courseId] || [])]
  const existing = new Set(list.map((r) => r.studentId))
  let added = 0
  const sectionCode = course.sections?.[0]?.code || '01'

  for (const studentId of studentIds) {
    if (existing.has(studentId)) continue
    const profile = candidates.find((s) => s.studentId === studentId)
    if (!profile) continue
    list.push({
      id: `round-stu-${roundKey}-${courseId}-${studentId}-${Date.now()}`,
      studentId: profile.studentId,
      studentName: profile.studentName,
      programme: profile.programme,
      intake: profile.grade === '2025' ? '2025/04' : '2024/09',
      sectionCode,
      operatorName: DEMO_ADMIN_OPERATOR_NAME,
    })
    existing.add(studentId)
    added += 1
  }

  bucket[courseId] = list
  roundCourseRosters.value = {
    ...roundCourseRosters.value,
    [roundKey]: bucket,
  }
  return { ok: true, added }
}
