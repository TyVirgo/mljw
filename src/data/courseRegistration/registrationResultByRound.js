import { ref } from 'vue'
import {
  selectableCourses,
  getCourseAudienceCapacity,
  getCourseSeniorQuotaTotal,
  resolveMeQuotaRowsForCourse,
} from './selectableCourses.js'
import { registrationBatches, getBatchById } from './registrationBatches.js'
import {
  getSelectionGroupsForBatch,
  resolveSelectionGroup,
  getSelectionGroupDisplayLines,
} from './courseSelectionGroups.js'
import {
  ME_QUOTA_KIND_INTAKE,
  ME_QUOTA_KIND_SPECIAL,
  normalizeIntakeKey,
} from './batchRound1Quota.js'
import {
  listAdminAddStudentCandidates,
  DEMO_ADMIN_OPERATOR_NAME,
} from './registrationResult.js'

/** Demo：轮转入学学期，便于老生名额使用弹窗各层次有已分配 */
const DEMO_ROUND_INTAKE_CYCLE = ['2024/09', '2025/04', '2025/09', '2026/02', '2023/09']

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
    const intake = specialExtra
      ? profile.grade === '2025'
        ? '2025/04'
        : '2024/09'
      : DEMO_ROUND_INTAKE_CYCLE[(offset + i) % DEMO_ROUND_INTAKE_CYCLE.length]
    out.push({
      id: `round-stu-${profile.studentId}-${offset}-${i}${specialExtra ? '-sx' : ''}`,
      studentId: profile.studentId,
      studentName: profile.studentName,
      programme: profile.programme,
      intake,
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

/**
 * 按权重拆分非负整数，加总严格等于 total
 * @param {number} total
 * @param {number[]} weights
 * @returns {number[]}
 */
function distributeIntegersByWeight(total, weights) {
  const n = weights.length
  if (n === 0) return []
  const safeTotal = Math.max(0, Math.floor(Number(total) || 0))
  const safeWeights = weights.map((w) => Math.max(0, Number(w) || 0))
  const weightSum = safeWeights.reduce((sum, w) => sum + w, 0)
  if (safeTotal === 0) return safeWeights.map(() => 0)
  if (weightSum <= 0) {
    const base = Math.floor(safeTotal / n)
    let left = safeTotal - base * n
    return safeWeights.map((_, i) => {
      const extra = left > 0 ? 1 : 0
      left -= extra
      return base + extra
    })
  }
  const raw = safeWeights.map((w) => (safeTotal * w) / weightSum)
  const floors = raw.map((x) => Math.floor(x))
  let left = safeTotal - floors.reduce((sum, v) => sum + v, 0)
  const order = raw
    .map((x, i) => ({ i, frac: x - floors[i] }))
    .sort((a, b) => b.frac - a.frac)
  const out = [...floors]
  for (let k = 0; k < left; k += 1) {
    out[order[k % n].i] += 1
  }
  return out
}

/**
 * 将层次明细的配置/已分配/剩余加总对齐入口三数（演示拆分可随意，合计须贴合）
 * @param {object[]} usageRows
 * @param {number} targetCap
 * @param {number} targetAllocated
 * @param {number} targetRemaining
 */
function alignMeSeniorQuotaRowsToEntry(usageRows, targetCap, targetAllocated, targetRemaining) {
  if (!usageRows.length) return
  const cap = Math.max(0, Math.floor(Number(targetCap) || 0))
  let allocatedTarget = Math.max(0, Math.floor(Number(targetAllocated) || 0))
  let remainingTarget = Math.max(0, Math.floor(Number(targetRemaining) || 0))
  // 入口剩余优先；若与容量/已分配不一致，以容量 − 已分配回填剩余
  if (cap !== allocatedTarget + remainingTarget) {
    remainingTarget = Math.max(0, cap - allocatedTarget)
  }

  const allocParts = distributeIntegersByWeight(
    allocatedTarget,
    usageRows.map((r) => Math.max(r.allocated, 1)),
  )
  const remainParts = distributeIntegersByWeight(
    remainingTarget,
    usageRows.map((r) => Math.max(r.remaining, 1)),
  )
  for (let i = 0; i < usageRows.length; i += 1) {
    const allocated = allocParts[i]
    const remaining = remainParts[i]
    usageRows[i].allocated = allocated
    usageRows[i].remaining = remaining
    usageRows[i].quotaCount = allocated + remaining
  }
}

/**
 * 结果页：按 meQuota 层次汇总配置名额 / 已分配 / 剩余可选
 * @param {object|null|undefined} course
 * @param {object|null|undefined} batch
 * @param {string} roundKey preselect|main|supplement
 * @param {{ seniorCap?: number, enrolledSenior?: number, availableSenior?: number }|null|undefined} entryHints
 *   入口列三数；传入时合计与层次加总对齐入口（剩余合计 = 老生容量可选）
 * @returns {{ rows: object[], seniorCap: number, allocatedTotal: number, remainingTotal: number }}
 */
export function buildMeSeniorQuotaUsageRows(course, batch, roundKey, entryHints) {
  const resolvedBatch = batch || getBatchById(course?.batchId) || null
  let seniorCap = course ? getCourseSeniorQuotaTotal(course) : 0
  const quotaRows = course ? resolveMeQuotaRowsForCourse(course, resolvedBatch) : []
  if (!quotaRows.length) {
    if (entryHints) {
      const hintCap =
        entryHints.seniorCap != null && Number.isFinite(Number(entryHints.seniorCap))
          ? Math.max(0, Math.floor(Number(entryHints.seniorCap)))
          : seniorCap
      const hintAllocated =
        entryHints.enrolledSenior != null && Number.isFinite(Number(entryHints.enrolledSenior))
          ? Math.max(0, Math.floor(Number(entryHints.enrolledSenior)))
          : 0
      const hintRemaining =
        entryHints.availableSenior != null && Number.isFinite(Number(entryHints.availableSenior))
          ? Math.max(0, Math.floor(Number(entryHints.availableSenior)))
          : Math.max(0, hintCap - hintAllocated)
      return {
        rows: [],
        seniorCap: hintCap,
        allocatedTotal: hintAllocated,
        remainingTotal: hintRemaining,
      }
    }
    return { rows: [], seniorCap, allocatedTotal: 0, remainingTotal: 0 }
  }

  const capacityRoster = getRoundCapacityRoster(roundKey, course?.id)
  /** @type {Set<string>} 已归入某层次的名单行 id */
  const matchedRowIds = new Set()

  /**
   * 统计名单中 intake 落在给定集合的人数（每人只计一次）
   * @param {Set<string>} intakeKeys
   */
  function countMatchingRoster(intakeKeys) {
    let n = 0
    for (const stu of capacityRoster) {
      if (matchedRowIds.has(stu.id)) continue
      const key = normalizeIntakeKey(stu.intake) || String(stu.intake || '').trim()
      if (!intakeKeys.has(key)) continue
      matchedRowIds.add(stu.id)
      n += 1
    }
    return n
  }

  const usageRows = []
  // 先归 intake 层次，再归特殊行（收未匹配）
  for (const q of quotaRows) {
    if (q.kind === ME_QUOTA_KIND_SPECIAL) continue
    const keys = new Set(
      (q.intakes || [])
        .map((raw) => normalizeIntakeKey(raw) || String(raw || '').trim())
        .filter(Boolean),
    )
    const quotaCount = Math.max(0, Math.floor(Number(q.count) || 0))
    const allocated = countMatchingRoster(keys)
    usageRows.push({
      id: q.id,
      kind: ME_QUOTA_KIND_INTAKE,
      intakes: [...(q.intakes || [])],
      quotaCount,
      allocated,
      remaining: Math.max(0, quotaCount - allocated),
    })
  }

  for (const q of quotaRows) {
    if (q.kind !== ME_QUOTA_KIND_SPECIAL) continue
    let allocated = 0
    for (const stu of capacityRoster) {
      if (matchedRowIds.has(stu.id)) continue
      // 未落入任何 intake 层次的占用名额学生 → 特殊层次
      matchedRowIds.add(stu.id)
      allocated += 1
    }
    const quotaCount = Math.max(0, Math.floor(Number(q.count) || 0))
    usageRows.push({
      id: q.id,
      kind: ME_QUOTA_KIND_SPECIAL,
      intakes: [],
      quotaCount,
      allocated,
      remaining: Math.max(0, quotaCount - allocated),
    })
  }

  // 保持与 resolve 行顺序一致（特殊行通常在末尾）
  const order = new Map(quotaRows.map((r, index) => [r.id, index]))
  usageRows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))

  let allocatedTotal = usageRows.reduce((sum, r) => sum + r.allocated, 0)
  let remainingTotal = usageRows.reduce((sum, r) => sum + r.remaining, 0)

  if (entryHints) {
    const targetCap =
      entryHints.seniorCap != null && Number.isFinite(Number(entryHints.seniorCap))
        ? Math.max(0, Math.floor(Number(entryHints.seniorCap)))
        : seniorCap
    const targetAllocated =
      entryHints.enrolledSenior != null && Number.isFinite(Number(entryHints.enrolledSenior))
        ? Math.max(0, Math.floor(Number(entryHints.enrolledSenior)))
        : allocatedTotal
    const targetRemaining =
      entryHints.availableSenior != null && Number.isFinite(Number(entryHints.availableSenior))
        ? Math.max(0, Math.floor(Number(entryHints.availableSenior)))
        : Math.max(0, targetCap - targetAllocated)
    alignMeSeniorQuotaRowsToEntry(usageRows, targetCap, targetAllocated, targetRemaining)
    seniorCap = targetCap
    allocatedTotal = targetAllocated
    remainingTotal = targetRemaining
  }

  return { rows: usageRows, seniorCap, allocatedTotal, remainingTotal }
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

/**
 * 解析可选数字筛选项（空/非法 → null）
 * @param {unknown} raw
 * @returns {number|null}
 */
function parseOptionalFilterNumber(raw) {
  if (raw === '' || raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * 数值是否落在闭区间 [min,max]（端点 null 表示不限）
 * @param {number} value
 * @param {number|null} min
 * @param {number|null} max
 */
function inClosedRange(value, min, max) {
  const n = Number(value) || 0
  if (min != null && n < min) return false
  if (max != null && n > max) return false
  return true
}

/**
 * 结果页课程组解析：精确课号；pad 课去掉 -Dxx 再匹配
 * @param {object|null|undefined} course
 * @param {object[]} groups
 */
function resolveResultSelectionGroup(course, groups) {
  const hit = resolveSelectionGroup(course, groups)
  if (hit) return hit
  const code = String(course?.code || '').trim()
  const base = code.replace(/-D\d+$/i, '')
  if (!base || base === code) return null
  return resolveSelectionGroup({ ...course, code: base }, groups)
}

/**
 * 课程组关键字是否命中（组名 / Group / Intake / 课号）
 * @param {object|null|undefined} group
 * @param {string} keywordLower
 */
function selectionGroupMatchesKeyword(group, keywordLower) {
  if (!keywordLower) return true
  if (!group) return false
  const lines = getSelectionGroupDisplayLines(group, true)
  const linesEn = getSelectionGroupDisplayLines(group, false)
  const hay = [
    group.id,
    group.name,
    group.nameEn,
    group.groupLabel,
    lines.title,
    lines.intakeLine,
    linesEn.title,
    linesEn.intakeLine,
    ...(group.courseCodes || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(keywordLower)
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
  const selectionGroupKeyword = String(filters.selectionGroupKeyword || '').trim().toLowerCase()
  // R2/R3：按「可选」筛；兼容旧 enrolled 键名（弃用）
  const effectiveAvailableMin = parseOptionalFilterNumber(
    filters.effectiveAvailableMin ?? filters.effectiveEnrolledMin,
  )
  const effectiveAvailableMax = parseOptionalFilterNumber(
    filters.effectiveAvailableMax ?? filters.effectiveEnrolledMax,
  )
  const freshmanAvailableMin = parseOptionalFilterNumber(
    filters.freshmanAvailableMin ?? filters.freshmanEnrolledMin,
  )
  const freshmanAvailableMax = parseOptionalFilterNumber(
    filters.freshmanAvailableMax ?? filters.freshmanEnrolledMax,
  )
  const seniorAvailableMin = parseOptionalFilterNumber(
    filters.seniorAvailableMin ?? filters.seniorEnrolledMin,
  )
  const seniorAvailableMax = parseOptionalFilterNumber(
    filters.seniorAvailableMax ?? filters.seniorEnrolledMax,
  )
  const specialAddedMin = parseOptionalFilterNumber(filters.specialAddedMin)
  const specialAddedMax = parseOptionalFilterNumber(filters.specialAddedMax)

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
      const specialAddedCount = specialRoster.length
      /** 可选 = 容量 − 已选（下限 0）；R2/R3 表展示用 */
      const availableTotal = Math.max(0, totalCapacity - enrolledTotal)
      const availableFreshman = Math.max(0, freshmanCap - enrolledFreshman)
      const availableSenior = Math.max(0, seniorCap - enrolledSenior)
      const batch = registrationBatches.value.find((b) => b.id === course.batchId)
      const batchName = batch?.name || ''
      const selectionGroup = resolveResultSelectionGroup(
        course,
        getSelectionGroupsForBatch(batch),
      )

      if (selectionGroupKeyword && !selectionGroupMatchesKeyword(selectionGroup, selectionGroupKeyword)) {
        return null
      }
      if (!inClosedRange(availableTotal, effectiveAvailableMin, effectiveAvailableMax)) return null
      if (!inClosedRange(availableFreshman, freshmanAvailableMin, freshmanAvailableMax)) return null
      if (!inClosedRange(availableSenior, seniorAvailableMin, seniorAvailableMax)) return null
      if (!inClosedRange(specialAddedCount, specialAddedMin, specialAddedMax)) return null

      return {
        id: `result-course-${course.id}`,
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        batchId: course.batchId,
        batchName,
        batchType: batch?.type || '',
        selectionGroup,
        totalCapacity,
        roundNew,
        cumulative,
        enrolledFreshman,
        freshmanCap,
        enrolledSenior,
        seniorCap,
        enrolledTotal,
        availableTotal,
        availableFreshman,
        availableSenior,
        specialAddedCount,
        // 有效最大：二/三轮均为可选/总量
        effectiveCapacityLabel: `${availableTotal}/${totalCapacity}`,
        // 第二轮：新老生可选/总量（分母=课级新老容量；不扩充时之和=有效最大总量）
        // 第三轮互释：仅可选分子
        freshmanCapacityLabel:
          roundKey === 'main'
            ? `${availableFreshman}/${freshmanCap}`
            : String(availableFreshman),
        seniorCapacityLabel:
          roundKey === 'main'
            ? `${availableSenior}/${seniorCap}`
            : String(availableSenior),
      }
    })
    .filter(Boolean)
}

/**
 * 默认教学班（无 sections 的课 / pad 课）
 * @param {object} course
 * @returns {{ id: string, code: string }}
 */
function defaultSectionForCourse(course) {
  const code = '01'
  return {
    id: `${course?.id || 'course'}-sec-${code}`,
    code,
  }
}

/**
 * @deprecated 结果页 R2/R3 已改回一门课一行；保留供对照/兼容，新逻辑请用 listRoundCourseSummaries
 * @param {string} roundKey
 * @param {object} [filters]
 * @returns {object[]}
 */
export function listRoundSectionSummaries(roundKey, filters = {}) {
  const courseSummaries = listRoundCourseSummaries(roundKey, filters)
  const out = []
  for (const summary of courseSummaries) {
    const course = findCourseForRound(summary.courseId)
    if (!course) continue
    const batch = registrationBatches.value.find((b) => b.id === summary.batchId)
    const groups = getSelectionGroupsForBatch(batch)
    const selectionGroup =
      summary.selectionGroup || resolveResultSelectionGroup(course, groups)
    const sections =
      Array.isArray(course.sections) && course.sections.length
        ? course.sections
        : [defaultSectionForCourse(course)]
    for (const section of sections) {
      const sectionCode = section?.code || '01'
      out.push({
        ...summary,
        // 勾选/删除仍按课；同课多分组行共享 id
        id: summary.id,
        sectionId: section?.id || `${summary.courseId}-${sectionCode}`,
        sectionCode,
        course: {
          id: course.id,
          code: course.code || summary.courseCode,
          name: course.name || summary.courseName,
          type: course.type,
          credits: course.credits ?? summary.credits,
        },
        section: {
          id: section?.id || `${summary.courseId}-${sectionCode}`,
          code: sectionCode,
        },
        selectionGroup,
        batchType: batch?.type || '',
      })
    }
  }
  return out
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
    const intake = specialExtra
      ? profile.grade === '2025'
        ? '2025/04'
        : '2024/09'
      : DEMO_ROUND_INTAKE_CYCLE[(list.length + added) % DEMO_ROUND_INTAKE_CYCLE.length]
    list.push({
      id: `round-stu-${roundKey}-${courseId}-${studentId}-${Date.now()}`,
      studentId: profile.studentId,
      studentName: profile.studentName,
      programme: profile.programme,
      intake,
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
