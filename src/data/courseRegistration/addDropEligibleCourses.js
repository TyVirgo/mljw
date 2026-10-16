/**
 * 加课资格 demo：曾 Drop / 休学落下；默认排除后续学期开课
 * 白名单 allowFutureMandatory 时可纳入后续学期必修
 * 白名单 allowFutureElective 时可纳入后续学期 GE/ME（按学分配置与 ME 类别）
 * ME 按学生校选类别过滤；GE 覆盖文商理
 */

import { getCurrentStudent } from '../mockCurrentStudent.js'
import {
  getCourseById,
  courseMatchesStudentSchoolElective,
  getDefaultStudentSchoolElectiveCategory,
} from './selectableCourses.js'
import { isMandatoryAddDropCourse } from './addDropMultiItems.js'
import {
  hasWhitelistAllowFutureMandatory,
  getWhitelistFutureMandatorySections,
  getWhitelistFutureElectiveConfig,
} from './supplementListQueue.js'
import {
  normalizeWhitelistSectionRefs,
  whitelistSectionListIncludes,
} from './whitelistSectionRefs.js'
import { getActiveBatch, getBatchById } from './registrationBatches.js'
import {
  getSelectionGroupsForBatch,
  resolveSelectionGroup,
} from './courseSelectionGroups.js'
import { selectionGroupToMeKey } from './studentRegistrationContext.js'
import { normalizeRegistrationType } from './registrationTypes.js'

/**
 * 加课曾退必修与课表 DEMO_REQUIRED 错开（CHEM101 等）；
 * 同课多组：originalSectionCode 供纯加课同组锁；originalAcademicSession 供「原上课学期」列
 * @type {{
 *   courseId: string,
 *   source: 'prior_drop'|'deferment_gap'|'future_session',
 *   futureSession?: boolean,
 *   originalAcademicSession?: string,
 *   originalSectionCode?: string,
 * }[]}
 */
const ELIGIBLE_ADD_SEED = [
  /** 必修：曾退 · 原组 01（02 无换组白名单时置灰） */
  {
    courseId: 'course-chem101',
    source: 'prior_drop',
    originalAcademicSession: '2026/04',
    originalSectionCode: '01',
  },
  {
    courseId: 'course-comp201',
    source: 'prior_drop',
    originalAcademicSession: '2025/09',
    originalSectionCode: '03',
  },
  {
    courseId: 'course-stat201',
    source: 'deferment_gap',
    originalAcademicSession: '2025/09',
    originalSectionCode: '01',
  },
  {
    courseId: 'course-hum110',
    source: 'prior_drop',
    originalAcademicSession: '2025/04',
    originalSectionCode: '02',
  },
  {
    courseId: 'course-sci110',
    source: 'prior_drop',
    originalAcademicSession: '2025/04',
    originalSectionCode: '02',
  },
  {
    courseId: 'course-fin110',
    source: 'deferment_gap',
    originalAcademicSession: '2025/09',
    originalSectionCode: '02',
  },
  /** 后续学期必修（白名单选组后可见；计划开课学期） */
  {
    courseId: 'course-phys101',
    source: 'future_session',
    futureSession: true,
    originalAcademicSession: '2026/09',
    originalSectionCode: '01',
  },
  /** 后续学期选修 */
  {
    courseId: 'course-ge201',
    source: 'future_session',
    futureSession: true,
    originalAcademicSession: '2026/09',
  },
  {
    courseId: 'course-web210',
    source: 'future_session',
    futureSession: true,
    originalAcademicSession: '2026/09',
  },
]

function resolveStudentSchoolElective(studentId) {
  const student = getCurrentStudent()
  const currentId = student?.basicInfo?.studentId
  if (studentId && currentId && studentId !== currentId) {
    return getDefaultStudentSchoolElectiveCategory()
  }
  return student?.enrollment?.schoolElectiveCategory || getDefaultStudentSchoolElectiveCategory()
}

function mapSeedToRow(seed, course, sectionFilter = null) {
  let sections = course.sections || []
  if (Array.isArray(sectionFilter)) {
    const allowed = normalizeWhitelistSectionRefs(sectionFilter)
    const code = String(course.code || '').trim().toUpperCase()
    sections = sections.filter((sec) =>
      whitelistSectionListIncludes(allowed, code, String(sec.code || sec.id || '').trim()),
    )
  }
  return {
    ...course,
    eligibilitySource: seed.futureSession ? 'future_session' : seed.source,
    futureSession: Boolean(seed.futureSession),
    originalAcademicSession: seed.originalAcademicSession || '',
    originalSectionCode: seed.originalSectionCode || '',
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.credits,
    type: course.type,
    remainingCapacity: course.remainingCapacity,
    totalCapacity: course.totalCapacity,
    sections,
  }
}

function resolveMeCategoryKeyForCourse(course) {
  const batch = (course?.batchId && getBatchById(course.batchId)) || getActiveBatch()
  const groups = getSelectionGroupsForBatch(batch)
  const group = resolveSelectionGroup(course, groups)
  return selectionGroupToMeKey(group)
}

function matchesFutureElectiveConfig(course, config, studentCat) {
  if (!config) return false
  if (!courseMatchesStudentSchoolElective(course, studentCat)) return false
  const kind = normalizeRegistrationType(course.type)
  if (kind === 'GE') {
    return Number(config.geCredits) > 0
  }
  if (kind === 'ME') {
    if (!(Number(config.meCredits) > 0)) return false
    const keys = config.meCategoryKeys || []
    if (!keys.length) return false
    return keys.includes(resolveMeCategoryKeyForCourse(course))
  }
  return false
}

/**
 * @param {string} [_studentId]
 * @returns {object[]} 可选加课（含 eligibilitySource）
 */
export function getEligibleAddCoursesForStudent(_studentId) {
  const studentCat = resolveStudentSchoolElective(_studentId)
  const allowFutureCore = hasWhitelistAllowFutureMandatory(_studentId)
  const futureMandatorySections = allowFutureCore
    ? getWhitelistFutureMandatorySections(_studentId)
    : []
  const futureElectiveCfg = getWhitelistFutureElectiveConfig(_studentId)
  const rows = []
  for (const seed of ELIGIBLE_ADD_SEED) {
    if (seed.futureSession) {
      const course = getCourseById(seed.courseId)
      if (!course) continue
      if (isMandatoryAddDropCourse(course)) {
        if (!allowFutureCore) continue
        if (!courseMatchesStudentSchoolElective(course, studentCat)) continue
        const code = String(course.code || '')
          .trim()
          .toUpperCase()
        const allowedForCourse = futureMandatorySections.filter(
          (r) => String(r.courseCode || '').toUpperCase() === code,
        )
        if (!allowedForCourse.length) continue
        const row = mapSeedToRow(seed, course, allowedForCourse)
        if ((course.sections || []).length && !(row.sections || []).length) continue
        rows.push(row)
        continue
      }
      if (!matchesFutureElectiveConfig(course, futureElectiveCfg, studentCat)) continue
      rows.push(mapSeedToRow(seed, course))
      continue
    }
    const course = getCourseById(seed.courseId)
    if (!course) continue
    if (!courseMatchesStudentSchoolElective(course, studentCat)) continue
    rows.push(mapSeedToRow(seed, course))
  }
  return rows
}

/** Notes / 空态用：列出被排除的后续学期样例（不进选择器） */
export function getExcludedFutureAddCourseHints(studentId) {
  const allowFutureCore = hasWhitelistAllowFutureMandatory(studentId)
  const futureElectiveCfg = getWhitelistFutureElectiveConfig(studentId)
  const studentCat = resolveStudentSchoolElective(studentId)
  return ELIGIBLE_ADD_SEED.filter((s) => s.futureSession)
    .filter((s) => {
      const course = getCourseById(s.courseId)
      if (!course) return false
      if (isMandatoryAddDropCourse(course)) return !allowFutureCore
      return !matchesFutureElectiveConfig(course, futureElectiveCfg, studentCat)
    })
    .map((s) => {
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
  if (source === 'future_session') return 'courseRegistration.student.eligibilityFutureSession'
  return ''
}
