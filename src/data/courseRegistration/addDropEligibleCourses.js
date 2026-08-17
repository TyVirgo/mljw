/**
 * 加课资格 demo：曾 Drop / 休学落下；排除后续学期开课
 */

import { getCourseById } from './selectableCourses.js'

/** @type {{ courseId: string, source: 'prior_drop'|'deferment_gap', futureSession?: boolean }[]} */
const ELIGIBLE_ADD_SEED = [
  { courseId: 'course-comp201', source: 'prior_drop' },
  { courseId: 'course-stat201', source: 'deferment_gap' },
  { courseId: 'course-hum110', source: 'prior_drop' },
  /** 演示：后续学期课不进可选列表 */
  { courseId: 'course-it102', source: 'prior_drop', futureSession: true },
]

/**
 * @param {string} [_studentId]
 * @returns {object[]} 可选加课（含 eligibilitySource）
 */
export function getEligibleAddCoursesForStudent(_studentId) {
  const rows = []
  for (const seed of ELIGIBLE_ADD_SEED) {
    if (seed.futureSession) continue
    const course = getCourseById(seed.courseId)
    if (!course) continue
    rows.push({
      ...course,
      eligibilitySource: seed.source,
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      type: course.type,
      remainingCapacity: course.remainingCapacity,
      sections: course.sections || [],
    })
  }
  return rows
}

/** Notes / 空态用：列出被排除的后续学期样例（不进选择器） */
export function getExcludedFutureAddCourseHints() {
  return ELIGIBLE_ADD_SEED.filter((s) => s.futureSession).map((s) => {
    const course = getCourseById(s.courseId)
    return {
      code: course?.code || s.courseId,
      name: course?.name || '',
      reason: 'future_session',
    }
  })
}

export function getEligibilitySourceLabelKey(source) {
  if (source === 'prior_drop') return 'courseRegistration.student.eligibilityPriorDrop'
  if (source === 'deferment_gap') return 'courseRegistration.student.eligibilityDefermentGap'
  return ''
}
