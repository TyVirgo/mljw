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

/** 轮次维度每轮演示行数下限 */
const ROUND_DIM_MIN_ROWS = 25

function emptyRoundMap() {
  return { preselect: {}, main: {}, supplement: {} }
}

function isFreshmanIntake(intake) {
  const s = String(intake || '')
  return s.startsWith('2025') || s.startsWith('2504') || s.includes('2025/')
}

function pickDemoStudents(offset, count, { specialExtra = false } = {}) {
  const pool = listAdminAddStudentCandidates()
  const out = []
  for (let i = 0; i < count; i += 1) {
    const profile = pool[(offset + i) % pool.length]
    out.push({
      id: `round-stu-${profile.studentId}-${offset}-${i}${specialExtra ? '-sx' : ''}`,
      studentId: profile.studentId,
      studentName: profile.studentName,
      programme: profile.programme,
      intake: profile.grade === '2025' ? '2025/04' : '2024/09',
      sectionCode: i % 2 === 0 ? '01' : '02',
      ...(specialExtra ? { specialExtra: true } : {}),
    })
  }
  const seen = new Set()
  return out.filter((row) => {
    if (seen.has(row.studentId)) return false
    seen.add(row.studentId)
    return true
  })
}

/**
 * 批内课不足时补轻量演示课（仅结果页轮次维度用，不写入课库业务流）
 * @param {string} batchId
 * @param {number} minCount
 */
function buildPadCoursesForBatch(batchId, minCount) {
  const real = selectableCourses.value.filter((c) => c.batchId === batchId)
  if (real.length >= minCount) return []
  const templates = real.length ? real : selectableCourses.value.slice(0, 8)
  if (!templates.length) return []
  const pads = []
  let i = real.length
  while (real.length + pads.length < minCount) {
    const t = templates[i % templates.length]
    const audience = getCourseAudienceCapacity(t)
    pads.push({
      id: `round-pad-${batchId}-${i}`,
      code: `${t.code}-D${String(i).padStart(2, '0')}`,
      name: `${t.name}`,
      credits: t.credits,
      batchId,
      totalCapacity: Number(t.totalCapacity) || audience.freshmanCap + audience.seniorCap || 90,
      enrolledFreshman: 0,
      enrolledSenior: 0,
      quota: {
        total: Number(t.totalCapacity) || 90,
        freshman: audience.freshmanCap || 6,
        senior: audience.seniorCap || 84,
      },
      sections: [],
      _roundPad: true,
    })
    i += 1
  }
  return pads
}

/** batchId -> pad course[] */
const roundDimensionPadCourses = ref({})

function ensurePadCourses(batchId) {
  if (!batchId) return []
  if (!roundDimensionPadCourses.value[batchId]) {
    roundDimensionPadCourses.value = {
      ...roundDimensionPadCourses.value,
      [batchId]: buildPadCoursesForBatch(batchId, ROUND_DIM_MIN_ROWS + 20),
    }
  }
  return roundDimensionPadCourses.value[batchId] || []
}

function listCoursesForRoundDimension(batchId) {
  const real = batchId
    ? selectableCourses.value.filter((c) => c.batchId === batchId)
    : [...selectableCourses.value]
  const pads = batchId ? ensurePadCourses(batchId) : []
  return [...real, ...pads]
}

function findCourseForRound(courseId) {
  const real = selectableCourses.value.find((c) => c.id === courseId)
  if (real) return real
  for (const pads of Object.values(roundDimensionPadCourses.value)) {
    const hit = (pads || []).find((c) => c.id === courseId)
    if (hit) return hit
  }
  return null
}

/**
 * 错位切片：三轮课集不完全相同（开头 / 末尾 / 中间步进）
 * @param {object[]} courses
 * @param {'preselect'|'main'|'supplement'} roundKey
 * @param {number} count
 */
function sliceCoursesForRound(courses, roundKey, count) {
  if (!courses.length) return []
  const n = courses.length
  const take = Math.min(count, n)
  if (roundKey === 'preselect') {
    return courses.slice(0, take)
  }
  if (roundKey === 'main') {
    return courses.slice(Math.max(0, n - take))
  }
  // supplement：从中段步进取样，再补齐
  const start = Math.floor(n / 4)
  const out = []
  const seen = new Set()
  for (let step = 0; out.length < take && step < n * 2; step += 1) {
    const c = courses[(start + step * 2) % n]
    if (seen.has(c.id)) continue
    seen.add(c.id)
    out.push(c)
  }
  for (let i = 0; out.length < take && i < n; i += 1) {
    if (seen.has(courses[i].id)) continue
    seen.add(courses[i].id)
    out.push(courses[i])
  }
  return out
}

function seedRosterForCourse(course, roundKey, index) {
  const base = pickDemoStudents(
    index * 5 + (roundKey === 'preselect' ? 0 : roundKey === 'main' ? 11 : 23),
    roundKey === 'preselect' ? 4 + (index % 4) : roundKey === 'main' ? 5 + (index % 3) : 2 + (index % 3),
  )
  // 约 1/3 课程挂 1～2 名特殊新加
  const specialCount = index % 3 === 0 ? 1 + (index % 2) : 0
  const special = specialCount
    ? pickDemoStudents(index * 7 + 40 + RESULT_ROUND_KEYS.indexOf(roundKey) * 3, specialCount, {
        specialExtra: true,
      })
    : []
  // 特殊生学号不与容量内重复
  const capacityIds = new Set(base.map((r) => r.studentId))
  const specialFiltered = special.filter((r) => !capacityIds.has(r.studentId))
  return [...base, ...specialFiltered]
}

function seedRoundCourseRosters() {
  const map = emptyRoundMap()
  roundDimensionPadCourses.value = {}

  const primaryBatchId = 'batch-2504-m1'
  const batchIds = new Set([
    primaryBatchId,
    ...registrationBatches.value.map((b) => b.id),
  ])

  for (const batchId of batchIds) {
    const pool = listCoursesForRoundDimension(batchId)
    if (!pool.length) continue
    // 凑满至少 25 课后，每轮取 25 行错位切片，避免整池全挂导致三轮几乎相同
    const target = Math.min(ROUND_DIM_MIN_ROWS, pool.length)
    if (target < 1) continue
    for (const roundKey of RESULT_ROUND_KEYS) {
      const slice = sliceCoursesForRound(pool, roundKey, target)
      slice.forEach((course, index) => {
        map[roundKey][course.id] = seedRosterForCourse(course, roundKey, index)
      })
    }
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

/** 容量内名单（不含特殊新加） */
export function getRoundCapacityRoster(roundKey, courseId) {
  return getRoundRoster(roundKey, courseId).filter((r) => !r.specialExtra)
}

/** 特殊新加名单 */
export function getRoundSpecialRoster(roundKey, courseId) {
  return getRoundRoster(roundKey, courseId).filter((r) => r.specialExtra)
}

/** 各轮学号并集人数（含特殊） */
export function getCumulativeEnrolledCount(courseId) {
  const ids = new Set()
  for (const roundKey of RESULT_ROUND_KEYS) {
    for (const row of getRoundRoster(roundKey, courseId)) {
      ids.add(row.studentId)
    }
  }
  return ids.size
}

function splitAudienceFromRoster(roster, freshmanCap, seniorCap) {
  let enrolledFreshman = 0
  let enrolledSenior = 0
  for (const row of roster) {
    if (isFreshmanIntake(row.intake)) enrolledFreshman += 1
    else enrolledSenior += 1
  }
  // 若名单未标出新生，按容量比例兜底拆分总量
  if (enrolledFreshman === 0 && enrolledSenior === 0 && roster.length) {
    const splitSum = freshmanCap + seniorCap || 1
    enrolledFreshman = Math.min(freshmanCap, Math.round((roster.length * freshmanCap) / splitSum))
    enrolledSenior = Math.max(0, roster.length - enrolledFreshman)
  }
  return { enrolledFreshman, enrolledSenior }
}

export function listRoundCourseSummaries(roundKey, filters = {}) {
  if (!RESULT_ROUND_KEYS.includes(roundKey)) return []
  let courses = filters.batchId
    ? listCoursesForRoundDimension(filters.batchId)
    : [...selectableCourses.value]

  const courseCode = String(filters.courseCode || '').trim().toLowerCase()
  const courseName = String(filters.courseName || '').trim().toLowerCase()
  const courseType = String(filters.courseType || '').trim()
  const sectionCode = String(filters.sectionCode || '').trim().toLowerCase()
  const credits = String(filters.credits ?? '').trim()
  if (courseCode) {
    courses = courses.filter((c) => String(c.code || '').toLowerCase().includes(courseCode))
  }
  if (courseName) {
    courses = courses.filter((c) => String(c.name || '').toLowerCase().includes(courseName))
  }
  if (courseType) {
    courses = courses.filter((c) => String(c.type || '') === courseType)
  }
  if (credits !== '') {
    courses = courses.filter((c) => String(c.credits) === credits)
  }
  if (sectionCode) {
    courses = courses.filter((c) =>
      (c.sections || []).some((s) => String(s?.code || '').toLowerCase().includes(sectionCode)),
    )
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
      if (!roundRoster.length) return null

      const capacityRoster = roundRoster.filter((r) => !r.specialExtra)
      const specialRoster = roundRoster.filter((r) => r.specialExtra)
      const roundNew = capacityRoster.length
      const cumulative = getCumulativeEnrolledCount(course.id)
      const totalCapacity = Number(course.totalCapacity) || 0
      const audience = getCourseAudienceCapacity(course)
      const freshmanCap = audience.freshmanCap
      const seniorCap = audience.seniorCap
      const { enrolledFreshman, enrolledSenior } = splitAudienceFromRoster(
        capacityRoster,
        freshmanCap,
        seniorCap,
      )
      const enrolledTotal = capacityRoster.length
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
        enrolledFreshman,
        freshmanCap,
        enrolledSenior,
        seniorCap,
        specialAddedCount: specialRoster.length,
        effectiveCapacityLabel: `${enrolledTotal}/${totalCapacity}`,
        // 二/三轮课程维：新老生列仅展示已选分子
        freshmanCapacityLabel: String(enrolledFreshman),
        seniorCapacityLabel: String(enrolledSenior),
      }
    })
    .filter(Boolean)
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

export function addRoundCourseStudents(roundKey, courseId, studentIds = [], options = {}) {
  if (!RESULT_ROUND_KEYS.includes(roundKey) || !courseId) {
    return { ok: false, errorKey: 'courseRegistration.result.addTargetRequired' }
  }
  if (!studentIds.length) {
    return { ok: false, errorKey: 'courseRegistration.result.addStudentRequired' }
  }
  const course = findCourseForRound(courseId)
  if (!course) return { ok: false, errorKey: 'courseRegistration.result.addTargetRequired' }

  const candidates = listAdminAddStudentCandidates()
  const bucket = { ...(roundCourseRosters.value[roundKey] || {}) }
  const list = [...(bucket[courseId] || [])]
  const existing = new Set(list.map((r) => r.studentId))
  let added = 0
  const sectionCode = course.sections?.[0]?.code || '01'
  const specialExtra = Boolean(options.specialExtra)

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
      ...(specialExtra ? { specialExtra: true } : {}),
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
