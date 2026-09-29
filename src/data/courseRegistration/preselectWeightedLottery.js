/**
 * 第一轮录取：毕业生优先（可封顶）→ GE 按日串行额度（当日志愿序优先 + 往日回补 + 结转）/ ME 按入学年池
 * 池内：人数≤容量全录；超额则按志愿序分层后随机
 */
import { isGraduateStudent } from './studentAudience.js'
import {
  getCourseAudienceCapacity,
  resolveMeQuotaRowsForCourse,
} from './selectableCourses.js'
import {
  getBatchRound1Quota,
  allocateDayQuotas,
  allocateMeQuotaRows,
  intakeYearFromValue,
  normalizeIntakeKey,
  resolveMeQuotaRowForVolunteer,
  dayWeights,
  openDaysFromRange,
  DEMO_ROUND1_OPEN_DAYS,
  DEFAULT_DECAY_R,
  DEFAULT_GRADUATE_CAP_RATIO,
  normalizeGraduateCapRatio,
} from './batchRound1Quota.js'
import { resolveEffectiveAudienceRounds } from './sessionRegistrationSchedules.js'

export { dayWeights }

/** 由 batchStudentRoster 在模块末尾注入，避免与名单模块循环依赖 */
let meSpecialStudentIdsResolver = null

/** @param {(batchId: string) => string[]} fn */
export function setMeSpecialStudentIdsResolver(fn) {
  meSpecialStudentIdsResolver = typeof fn === 'function' ? fn : null
}

function resolveSpecialStudentIds(batchId) {
  if (!batchId || !meSpecialStudentIdsResolver) return []
  try {
    return meSpecialStudentIdsResolver(batchId) || []
  } catch {
    return []
  }
}

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
  const pre =
    resolveEffectiveAudienceRounds(batch)?.senior?.preselect ||
    batch?.roundsByAudience?.senior?.preselect ||
    batch?.rounds?.preselect ||
    {}
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

/** @param {object} v */
export function preferenceRankOf(v) {
  const r = Number(v?.preferenceRank ?? v?.choiceRank)
  if (Number.isFinite(r) && r > 0) return Math.floor(r)
  return 99
}

/**
 * 按志愿序升序分层，同层随机抽满
 * @returns {{ picked: object[], rest: object[] }}
 */
export function pickByPreferenceRank(candidates, capacity, rand = Math.random) {
  const cap = Math.max(0, Math.floor(Number(capacity) || 0))
  if (!candidates.length) return { picked: [], rest: [] }
  if (!cap) return { picked: [], rest: [...candidates] }
  if (candidates.length <= cap) return { picked: [...candidates], rest: [] }

  /** @type {Map<number, object[]>} */
  const byRank = new Map()
  for (const v of candidates) {
    const rank = preferenceRankOf(v)
    if (!byRank.has(rank)) byRank.set(rank, [])
    byRank.get(rank).push(v)
  }
  const ranks = [...byRank.keys()].sort((a, b) => a - b)
  const picked = []
  const rest = []
  let need = cap
  for (const rank of ranks) {
    const pool = byRank.get(rank) || []
    if (need <= 0) {
      rest.push(...pool)
      continue
    }
    if (pool.length <= need) {
      picked.push(...pool)
      need -= pool.length
    } else {
      const part = partitionPool(pool, need, rand)
      picked.push(...part.picked)
      rest.push(...part.rest)
      need = 0
    }
  }
  return { picked, rest }
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
 * GE 第一轮：毕业生封顶 → 非毕业生按日额度；当日志愿序优先，余量回补往日 waitlist，未用额度结转。
 * 输出顺序：选上(毕业生→老生)→未选上。
 * @returns {object[]}
 */
export function layoutGeRound1Roster(volunteers = [], opts = {}) {
  const capacity = Math.max(0, Math.floor(Number(opts.capacity) || 0))
  const rand = opts.rand || Math.random
  const nDays = Math.max(1, Math.floor(opts.nDays) || 5)
  const decayR = Number(opts.decayR) > 0 ? Number(opts.decayR) : DEFAULT_DECAY_R
  const graduateCapRatio = normalizeGraduateCapRatio(
    opts.graduateCapRatio ?? DEFAULT_GRADUATE_CAP_RATIO,
  )
  const roundStart = opts.roundStart

  if (!volunteers.length) return []

  const grads = []
  const others = []
  for (const v of volunteers) {
    if (markGraduate(v)) grads.push(v)
    else others.push(v)
  }
  grads.sort((a, b) => String(a.submittedAt || '').localeCompare(String(b.submittedAt || '')))

  const gradCap = Math.floor(capacity * graduateCapRatio)
  let selectedGrads = []
  let rejectedGrads = []
  let remaining = capacity

  if (capacity <= 0) {
    rejectedGrads = [...grads]
    remaining = 0
  } else if (grads.length <= gradCap) {
    selectedGrads = [...grads]
    remaining = capacity - grads.length
  } else {
    const gradPick = partitionPool(grads, gradCap, rand)
    selectedGrads = gradPick.picked
    rejectedGrads = gradPick.rest
    remaining = capacity - selectedGrads.length
  }

  const byDay = Array.from({ length: nDays }, () => [])
  for (const v of others) {
    const day = dayIndexFromSubmittedAt(v.submittedAt, roundStart, nDays)
    byDay[day - 1].push(v)
  }

  let selectedOthers = []
  /** @type {object[]} */
  let waitlist = []

  if (remaining <= 0 || !others.length) {
    // no-op
  } else if (others.length <= remaining) {
    selectedOthers = [...others]
  } else {
    const dayQuotas = allocateDayQuotas(remaining, nDays, decayR)
    let carry = 0

    for (let day = 1; day <= nDays; day += 1) {
      let budget = (dayQuotas[day - 1] || 0) + carry
      carry = 0
      const today = byDay[day - 1] || []

      if (budget > 0 && today.length) {
        const todayPick = pickByPreferenceRank(today, budget, rand)
        selectedOthers.push(...todayPick.picked)
        waitlist.push(...todayPick.rest)
        budget -= todayPick.picked.length
      } else if (today.length) {
        waitlist.push(...today)
      }

      if (budget > 0 && waitlist.length) {
        const fill = pickByPreferenceRank(waitlist, budget, rand)
        selectedOthers.push(...fill.picked)
        waitlist = fill.rest
        budget -= fill.picked.length
      }

      carry = Math.max(0, budget)
      if (selectedOthers.length >= remaining) break
    }

    if (selectedOthers.length > remaining) {
      selectedOthers = selectedOthers.slice(0, remaining)
    }
  }

  const selectedIds = new Set(selectedOthers.map((v) => v.studentId))
  const rejectedOthers = others.filter((v) => !selectedIds.has(v.studentId))

  return [
    ...withResultFlags(selectedGrads, true),
    ...withResultFlags(selectedOthers, true),
    ...withResultFlags(rejectedGrads, false),
    ...withResultFlags(rejectedOthers, false),
  ]
}

/**
 * ME 第一轮：毕业生优先 → 按占比行（多入学学期 / 特殊学生）分桶
 * 行际不结转；未命中任何占比行则未选上
 * @returns {object[]}
 */
export function layoutMeRound1Roster(volunteers = [], opts = {}) {
  const capacity = Math.max(0, Math.floor(Number(opts.capacity) || 0))
  const rand = opts.rand || Math.random
  const meQuotaRows = opts.meQuotaRows || opts.meYearShares || []
  const specialIdSet =
    opts.specialStudentIds instanceof Set
      ? opts.specialStudentIds
      : new Set((opts.specialStudentIds || []).map(String))

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
  const quotas = remaining > 0 ? allocateMeQuotaRows(remaining, meQuotaRows) : {}
  const rowIds = Object.keys(quotas)

  const buckets = {}
  const unconfigured = []
  for (const v of others) {
    const row = resolveMeQuotaRowForVolunteer(v, meQuotaRows, specialIdSet)
    if (row?.id && quotas[row.id] != null) {
      if (!buckets[row.id]) buckets[row.id] = []
      buckets[row.id].push(v)
    } else {
      unconfigured.push(v)
    }
  }
  unconfigured.sort((a, b) => {
    const ia = normalizeIntakeKey(a.intake) || intakeYearFromValue(a.intake)
    const ib = normalizeIntakeKey(b.intake) || intakeYearFromValue(b.intake)
    return String(ia).localeCompare(String(ib))
  })

  const selectedByRow = []
  const rejectedByRow = []
  rowIds.forEach((rowId) => {
    const { picked, rest } = partitionPool(buckets[rowId] || [], quotas[rowId] || 0, rand)
    selectedByRow.push(...picked)
    rejectedByRow.push(...rest)
  })
  rejectedByRow.push(...unconfigured)

  return [
    ...withResultFlags(selectedGrads, true),
    ...withResultFlags(selectedByRow, true),
    ...withResultFlags(rejectedGrads, false),
    ...withResultFlags(rejectedByRow, false),
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
  const specialIds = resolveSpecialStudentIds(batch?.id)
  const meQuotaRows =
    String(batch?.type || '').toUpperCase() === 'ME'
      ? resolveMeQuotaRowsForCourse(course, batch)
      : quota.meQuotaRows || []
  return {
    capacity: Math.min(sectionCap, seniorPool),
    batchType: batch?.type,
    programme: batch?.programme || '',
    nDays: openDaysFromRange(start, end) || DEMO_ROUND1_OPEN_DAYS,
    roundStart: start,
    decayR: quota.decayR ?? DEFAULT_DECAY_R,
    graduateCapRatio: quota.graduateCapRatio ?? DEFAULT_GRADUATE_CAP_RATIO,
    meQuotaRows,
    specialStudentIds: specialIds,
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
