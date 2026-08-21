/**
 * 批次第一轮容量细分：
 * - GE：按日 W_i = r^(N-i)
 * - ME：按入学年份额（同年 02/04/09 共用；专业在批次上已绑定）
 */
import { parseIntakeBatch, VALID_INTAKE_MONTHS } from '../intakeSets.js'

/** Demo / 预览用开放天数 */
export const DEMO_ROUND1_OPEN_DAYS = 5

/** GE 默认衰减系数 */
export const DEFAULT_DECAY_R = 3

/** 一年三学期（与 intake 模块一致） */
export const YEAR_INTAKE_MONTHS = [...VALID_INTAKE_MONTHS]

/** 默认三年名额占比（%）：较早入学年更高，合计 100 */
export const DEFAULT_ME_YEAR_SHARE_WEIGHTS = [50, 30, 20]

/**
 * 从学术学期（如 2026/04）解析锚点年
 */
export function anchorYearFromSession(academicSession) {
  const parsed = parseIntakeBatch(academicSession)
  if (parsed?.year) return Number(parsed.year)
  const m = String(academicSession || '').match(/(20\d{2})/)
  return m ? Number(m[1]) : new Date().getFullYear()
}

/** 某入学年对应的三个入学学期展示 */
export function intakeLabelsForYear(year) {
  const y = String(year)
  return YEAR_INTAKE_MONTHS.map((m) => `${y}/${m}`)
}

/**
 * 默认三年入学年名额占比（相对批次学年往前推两年，合计 100%）
 * @returns {Record<string, number>}
 */
export function defaultMeYearShares(academicSession) {
  const anchor = anchorYearFromSession(academicSession)
  const years = [anchor - 2, anchor - 1, anchor]
  const map = {}
  years.forEach((y, i) => {
    map[String(y)] = DEFAULT_ME_YEAR_SHARE_WEIGHTS[i] ?? 2
  })
  return map
}

export function defaultRound1Quota(batchType = 'GE', programme = '', academicSession = '') {
  return {
    decayR: DEFAULT_DECAY_R,
    meYearShares: defaultMeYearShares(academicSession),
  }
}

function normalizeMeYearShares(raw, academicSession) {
  const base = defaultMeYearShares(academicSession)
  if (!raw || typeof raw !== 'object') return base
  // 兼容旧 meGradeRatios：忽略结构，回退默认三年
  if (!('meYearShares' in raw) && raw.meGradeRatios) return base
  const src = raw.meYearShares && typeof raw.meYearShares === 'object' ? raw.meYearShares : raw
  if (!src || typeof src !== 'object' || Array.isArray(src)) return base
  const map = {}
  Object.entries(src).forEach(([year, share]) => {
    const y = String(year || '').trim()
    if (!/^\d{4}$/.test(y)) return
    const n = Math.max(0, Number(share) || 0)
    map[y] = n
  })
  return Object.keys(map).length ? map : base
}

/** ME 入学年名额占比合计 */
export function meYearSharePercentSum(meYearShares = {}) {
  return Object.values(meYearShares || {}).reduce((sum, n) => sum + Math.max(0, Number(n) || 0), 0)
}

export function normalizeRound1Quota(raw, batchType = 'GE', programme = '', academicSession = '') {
  const base = defaultRound1Quota(batchType, programme, academicSession)
  if (!raw || typeof raw !== 'object') return base
  const r = Number(raw.decayR)
  const decayR = Number.isFinite(r) && r > 0 ? r : base.decayR
  return {
    decayR,
    meYearShares: normalizeMeYearShares(raw, academicSession),
  }
}

export function getBatchRound1Quota(batch) {
  return normalizeRound1Quota(
    batch?.round1Quota,
    batch?.type,
    batch?.programme,
    batch?.academicSession,
  )
}

/** 志愿/学生 intake → 入学年 YYYY */
export function intakeYearFromValue(intake) {
  const parsed = parseIntakeBatch(intake)
  if (parsed?.year) return parsed.year
  const digits = String(intake || '').replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(0, 4)
  if (digits.length === 2) return `20${digits}`
  return ''
}

/** W_i = r^(N-i)，i = 1..N */
export function dayWeights(nDays, r) {
  const N = Math.max(1, Math.floor(nDays) || 1)
  const ratio = Number(r) > 0 ? Number(r) : DEFAULT_DECAY_R
  const weights = []
  for (let i = 1; i <= N; i += 1) {
    weights.push(ratio ** (N - i))
  }
  return weights
}

/**
 * 将剩余容量按权重切成整数日额度（尾差补第 1 天）
 * @returns {number[]}
 */
export function allocateDayQuotas(remaining, nDays, r) {
  const cap = Math.max(0, Math.floor(Number(remaining) || 0))
  const weights = dayWeights(nDays, r)
  const N = weights.length
  if (!cap || !N) return Array.from({ length: N }, () => 0)
  const sumW = weights.reduce((a, b) => a + b, 0) || 1
  const quotas = weights.map((w) => Math.floor((cap * w) / sumW))
  let used = quotas.reduce((a, b) => a + b, 0)
  let rest = cap - used
  let i = 0
  while (rest > 0 && N > 0) {
    quotas[i % N] += 1
    rest -= 1
    i += 1
  }
  return quotas
}

/** 开放天数：按起止日历日差；无效时回退 demo 默认 5 天 */
export function openDaysFromRange(start, end) {
  if (!start || !end) return DEMO_ROUND1_OPEN_DAYS
  const a = Date.parse(String(start).replace(/-/g, ' '))
  const b = Date.parse(String(end).replace(/-/g, ' '))
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return DEMO_ROUND1_OPEN_DAYS
  const dayMs = 24 * 60 * 60 * 1000
  return Math.max(1, Math.floor((b - a) / dayMs) + 1)
}

/**
 * 按入学年份额切分剩余容量
 * @returns {Record<string, number>} key = 入学年 YYYY
 */
export function allocateMeYearQuotas(remaining, meYearShares = {}) {
  const cap = Math.max(0, Math.floor(Number(remaining) || 0))
  const entries = Object.entries(meYearShares || {})
    .map(([year, share]) => ({
      key: String(year),
      share: Math.max(0, Number(share) || 0),
    }))
    .filter((e) => /^\d{4}$/.test(e.key) && e.share > 0)
    .sort((a, b) => a.key.localeCompare(b.key))

  if (!cap || !entries.length) {
    return Object.fromEntries(entries.map((e) => [e.key, 0]))
  }
  const sum = entries.reduce((a, e) => a + e.share, 0) || 1
  const quotas = {}
  let used = 0
  entries.forEach((e) => {
    const q = Math.floor((cap * e.share) / sum)
    quotas[e.key] = q
    used += q
  })
  let rest = cap - used
  let i = 0
  while (rest > 0 && entries.length) {
    quotas[entries[i % entries.length].key] += 1
    rest -= 1
    i += 1
  }
  return quotas
}

/** @deprecated 兼容旧名 */
export function allocateMeGradeQuotas(remaining, meYearShares) {
  return allocateMeYearQuotas(remaining, meYearShares)
}

/** 日份额预览（百分比，用于 UI） */
export function previewDaySharePercents(nDays, r) {
  const weights = dayWeights(nDays, r)
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  return weights.map((w) => Math.round((1000 * w) / sum) / 10)
}

/** 默认入学年下拉：未到的下一年起往前共 6 年（2026 → 2027–2022），新年在前 */
export function meYearDefaultPool(academicSession) {
  const anchor = anchorYearFromSession(academicSession)
  const opts = []
  for (let y = anchor + 1; y >= anchor - 4; y -= 1) {
    opts.push(String(y))
  }
  return opts
}

/** 可添加入学年：默认池中尚未占用的年（新年在前） */
export function meYearAddOptions(academicSession, existingYears = []) {
  const taken = new Set((existingYears || []).map(String))
  return meYearDefaultPool(academicSession).filter((s) => !taken.has(s))
}
