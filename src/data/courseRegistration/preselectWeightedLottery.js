/**
 * 第一轮录取：毕业生优先 → GE 按日硬额度 / ME 按入学年池
 * 池内：人数≤容量全录；超额则均匀随机（毕业生超额改为提交时间先到先得）
 */
import { isGraduateStudent } from './studentAudience.js'
import { getCourseAudienceCapacity } from './selectableCourses.js'
import {
  getBatchRound1Quota,
  allocateDayQuotas,
  allocateMeYearQuotas,
  intakeYearFromValue,
  dayWeights,
  openDaysFromRange,
  DEMO_ROUND1_OPEN_DAYS,
  DEFAULT_DECAY_R,
} from './batchRound1Quota.js'

export { dayWeights }

/**
 * 解析批次/志愿时间（ISO、YYYY-MM-DD HH:mm:ss、DD-Mon-YYYY）
 * @param {string} value
 * @returns {number}
 */
export function parseCourseRegTime(value) {
  const s = String(value || '').trim()
  if (!s) return NaN
  const asIso = Date.parse(s.includes('T') ? s : s.replace(' ', 'T'))
  if (Number.isFinite(asIso)) return asIso
  return Date.parse(s.replace(/-/g, ' '))
}

/**
 * 提交日相对 R1 开始的第几天（1-based）
 */
export function dayIndexFromSubmittedAt(submittedAt, roundStart, nDays) {
  const N = Math.max(1, Math.floor(nDays) || 1)
  if (!submittedAt || !roundStart) return Math.ceil(N / 2)
  const start = parseCourseRegTime(roundStart)
  const sub = parseCourseRegTime(submittedAt)
  if (!Number.isFinite(start) || !Number.isFinite(sub)) return Math.ceil(N / 2)
  const dayMs = 24 * 60 * 60 * 1000
  const idx = Math.floor((sub - start) / dayMs) + 1
  return Math.min(N, Math.max(1, idx))
}

export function getBatchRound1Window(batch) {
  const pre = batch?.roundsByAudience?.senior?.preselect || batch?.rounds?.preselect || {}
  return { start: pre.start || '', end: pre.end || '' }
}

/**
 * 分组老生额度：优先 section.quota.senior，否则按课级老生额度比例折到分组
 */
export function getSectionSeniorCapacity(course, sectionId, fallbackCap = 0) {
  const sections = course?.sections || []
  const section = sections.find((s) => s.id === sectionId)
  const fromQuota = Number(section?.quota?.senior)
  if (Number.isFinite(fromQuota) && fromQuota >= 0) return Math.floor(fromQuota)
  const sectionCap = Number(section?.capacity) || fallbackCap
  const audience = getCourseAudienceCapacity(course)
  const totalCap = Number(course?.totalCapacity) || sectionCap || 1
  const scaled = Math.round((audience.seniorCap * sectionCap) / totalCap)
  return Math.max(0, scaled || Math.min(sectionCap, audience.seniorCap || 0))
}

export function seededRandomFromKey(seed) {
  let a = 2166136261
  const s = String(seed || '')
  for (let i = 0; i < s.length; i += 1) {
    a ^= s.charCodeAt(i)
    a = Math.imul(a, 16777619)
  }
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleInPlace(arr, rand = Math.random) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function partitionPool(candidates, capacity, rand = Math.random) {
  const cap = Math.max(0, Math.floor(Number(capacity) || 0))
  if (!candidates.length) return { picked: [], rest: [] }
  if (!cap) return { picked: [], rest: [...candidates] }
  if (candidates.length <= cap) return { picked: [...candidates], rest: [] }
  const copy = shuffleInPlace([...candidates], rand)
  return { picked: copy.slice(0, cap), rest: copy.slice(cap) }
}

/**
 * 池内录取：≤容量全录；超额随机抽满
 * @returns {object[]}
 */
export function pickFromPool(candidates, capacity, rand = Math.random) {
  return partitionPool(candidates, capacity, rand).picked
}

function markGraduate(v) {
  return Boolean(v.isGraduate || isGraduateStudent(v.studentId))
}

function withResultFlags(list, selected) {
  return list.map((v) => ({
    ...v,
    selected,
    isGraduate: markGraduate(v),
  }))
}

/**
 * GE 第一轮：保留全部志愿，按选上（毕业生→按日）再未选上（按日）排序
 * @returns {object[]}
 */
export function layoutGeRound1Roster(volunteers = [], opts = {}) {
  const capacity = Math.max(0, Math.floor(Number(opts.capacity) || 0))
  const rand = opts.rand || Math.random
  const nDays = Math.max(1, Math.floor(opts.nDays) || 5)
  const decayR = Number(opts.decayR) > 0 ? Number(opts.decayR) : DEFAULT_DECAY_R
  const roundStart = opts.roundStart

  if (!volunteers.length) return []

  const grads = []
  const others = []
  for (const v of volunteers) {
    if (markGraduate(v)) grads.push(v)
    else others.push(v)
  }
  grads.sort((a, b) => String(a.submittedAt || '').localeCompare(String(b.submittedAt || '')))

  const selectedGrads = capacity > 0 ? grads.slice(0, capacity) : []
  const rejectedGrads = capacity > 0 ? grads.slice(capacity) : [...grads]
  const remaining = Math.max(0, capacity - selectedGrads.length)
  const dayQuotas =
    remaining > 0 ? allocateDayQuotas(remaining, nDays, decayR) : Array.from({ length: nDays }, () => 0)

  const byDay = Array.from({ length: nDays }, () => [])
  for (const v of others) {
    const day = dayIndexFromSubmittedAt(v.submittedAt, roundStart, nDays)
    byDay[day - 1].push(v)
  }

  const selectedByDay = []
  const rejectedByDay = []
  byDay.forEach((pool, idx) => {
    const { picked, rest } = partitionPool(pool, dayQuotas[idx] || 0, rand)
    selectedByDay.push(...picked)
    rejectedByDay.push(...rest)
  })

  return [
    ...withResultFlags(selectedGrads, true),
    ...withResultFlags(selectedByDay, true),
    ...withResultFlags(rejectedGrads, false),
    ...withResultFlags(rejectedByDay, false),
  ]
}

function compareIntakeYearAsc(a, b) {
  const ya = intakeYearFromValue(a.intake) || '9999'
  const yb = intakeYearFromValue(b.intake) || '9999'
  return ya.localeCompare(yb)
}

/**
 * ME 第一轮：保留全部志愿，按选上（毕业生→学年早到晚）再未选上排序
 * 年际不结转；入学年不在配置表则未选上
 * @returns {object[]}
 */
export function layoutMeRound1Roster(volunteers = [], opts = {}) {
  const capacity = Math.max(0, Math.floor(Number(opts.capacity) || 0))
  const rand = opts.rand || Math.random
  const meYearShares = opts.meYearShares || opts.meGradeRatios || {}

  if (!volunteers.length) return []

  const grads = []
  const others = []
  for (const v of volunteers) {
    if (markGraduate(v)) grads.push(v)
    else others.push(v)
  }
  grads.sort((a, b) => String(a.submittedAt || '').localeCompare(String(b.submittedAt || '')))

  const selectedGrads = capacity > 0 ? grads.slice(0, capacity) : []
  const rejectedGrads = capacity > 0 ? grads.slice(capacity) : [...grads]
  const remaining = Math.max(0, capacity - selectedGrads.length)
  const quotas = remaining > 0 ? allocateMeYearQuotas(remaining, meYearShares) : {}
  const yearKeys = Object.keys(quotas).sort((a, b) => a.localeCompare(b))
  const configured = new Set(yearKeys)

  const buckets = {}
  const unconfigured = []
  for (const v of others) {
    const year = intakeYearFromValue(v.intake)
    if (year && configured.has(year)) {
      if (!buckets[year]) buckets[year] = []
      buckets[year].push(v)
    } else {
      unconfigured.push(v)
    }
  }
  unconfigured.sort(compareIntakeYearAsc)

  const selectedByYear = []
  const rejectedByYear = []
  yearKeys.forEach((year) => {
    const { picked, rest } = partitionPool(buckets[year] || [], quotas[year] || 0, rand)
    selectedByYear.push(...picked)
    rejectedByYear.push(...rest)
  })
  rejectedByYear.push(...unconfigured)

  return [
    ...withResultFlags(selectedGrads, true),
    ...withResultFlags(selectedByYear, true),
    ...withResultFlags(rejectedGrads, false),
    ...withResultFlags(rejectedByYear, false),
  ]
}

/**
 * @param {object[]} volunteers
 * @param {{
 *   capacity: number,
 *   batchType?: string,
 *   programme?: string,
 *   nDays?: number,
 *   roundStart?: string,
 *   decayR?: number,
 *   meYearShares?: object,
 *   rand?: () => number,
 * }} opts
 */
export function drawWeightedVolunteers(volunteers = [], opts = {}) {
  const capacity = Math.max(0, Math.floor(Number(opts.capacity) || 0))
  if (!capacity || !volunteers.length) return []

  const batchType = String(opts.batchType || 'GE').toUpperCase()
  if (batchType === 'GE') {
    return layoutGeRound1Roster(volunteers, opts).filter((v) => v.selected)
  }
  return layoutMeRound1Roster(volunteers, opts).filter((v) => v.selected)
}

function drawOptsForSection(state, course, batch) {
  const sectionCap = Number(state.capacity) || 0
  const seniorPool = getSectionSeniorCapacity(course, state.sectionId, sectionCap)
  const quota = getBatchRound1Quota(batch)
  const { start, end } = getBatchRound1Window(batch)
  return {
    capacity: Math.min(sectionCap, seniorPool),
    batchType: batch?.type,
    programme: batch?.programme || '',
    nDays: openDaysFromRange(start, end) || DEMO_ROUND1_OPEN_DAYS,
    roundStart: start,
    decayR: quota.decayR ?? DEFAULT_DECAY_R,
    meYearShares: quota.meYearShares,
    rand: seededRandomFromKey(state.key || `${state.courseId}::${state.sectionId}`),
  }
}

/**
 * 对某教学分组执行录取。GE/ME 均保留落选人并打 selected
 */
export function applyWeightedDrawToSectionState(state, course, batch) {
  if (!state || !course) return state
  const volunteers = (state.volunteers || []).map((v) => ({
    ...v,
    courseCode: v.courseCode || course.code,
    courseId: v.courseId || course.id,
  }))
  const opts = drawOptsForSection(state, course, batch)
  const isGe = String(batch?.type || '').toUpperCase() === 'GE'
  const next = isGe
    ? layoutGeRound1Roster(volunteers, opts)
    : layoutMeRound1Roster(volunteers, opts)
  return {
    ...state,
    volunteers: next,
    dirty: false,
    pendingDraftVolunteers: null,
  }
}
