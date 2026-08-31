/**
 * 第一轮容量细分：
 * - GE：按日 W_i = r^(N-i)
 * - ME：按占比行（多入学学期 YYYY/MM 共用一行；另可有「特殊学生」行）
 */
import { parseIntakeBatch, VALID_INTAKE_MONTHS } from '../intakeSets.js'

export const DEMO_ROUND1_OPEN_DAYS = 5
export const DEFAULT_DECAY_R = 3
export const DEFAULT_ME_QUOTA_TOTAL_CAP = 100
export const YEAR_INTAKE_MONTHS = [...VALID_INTAKE_MONTHS]
/** ME 名额表入学学期选项年池（原型暂定） */
export const ME_INTAKE_YEAR_POOL = ['2027', '2026', '2025', '2024']

export const ME_QUOTA_KIND_INTAKE = 'intake'
export const ME_QUOTA_KIND_SPECIAL = 'special'
/** 行内 + 下拉：添加特殊学生行（非 YYYY/MM） */
export const ME_QUOTA_PICKER_SPECIAL = '__special__'

const INTAKE_KEY_RE = /^(20\d{2})\/(02|04|09)$/

let meQuotaRowSeq = 1

export function createMeQuotaRowId(prefix = 'meq') {
  meQuotaRowSeq += 1
  return `${prefix}-${meQuotaRowSeq}-${Date.now().toString(36)}`
}

export function formatIntakeKey(year, month) {
  const y = String(year || '').trim()
  const m = String(month || '').padStart(2, '0')
  if (!/^\d{4}$/.test(y) || !['02', '04', '09'].includes(m)) return ''
  return `${y}/${m}`
}

/** 规范化入学学期为 YYYY/MM（仅 02/04/09） */
export function normalizeIntakeKey(value) {
  const parsed = parseIntakeBatch(value)
  if (parsed?.year && parsed?.month) {
    const m = String(parsed.month).padStart(2, '0')
    if (['02', '04', '09'].includes(m)) return `${parsed.year}/${m}`
  }
  const raw = String(value || '').trim().replace(/-/g, '/')
  const m = raw.match(/^(20\d{2})\/(0?[249]|02|04|09)$/)
  if (!m) return ''
  const month = String(m[2]).padStart(2, '0')
  if (month === '02' || month === '04' || month === '09') return `${m[1]}/${month}`
  if (month === '2') return `${m[1]}/02`
  if (month === '4') return `${m[1]}/04`
  if (month === '9') return `${m[1]}/09`
  return ''
}

export function anchorYearFromSession(academicSession) {
  const parsed = parseIntakeBatch(academicSession)
  if (parsed?.year) return Number(parsed.year)
  const m = String(academicSession || '').match(/(20\d{2})/)
  return m ? Number(m[1]) : new Date().getFullYear()
}

/** @deprecated 旧按年展示；保留空实现以免外部 import 报错 */
export function intakeLabelsForYear(year) {
  const y = String(year)
  return YEAR_INTAKE_MONTHS.map((m) => `${y}/${m}`)
}

/**
 * 默认 ME 占比行（demo / 新建模板）
 */
export function defaultMeQuotaRows(academicSession = '', totalCap = DEFAULT_ME_QUOTA_TOTAL_CAP) {
  const anchor = anchorYearFromSession(academicSession)
  const rows = [
    {
      id: createMeQuotaRowId('def'),
      kind: ME_QUOTA_KIND_INTAKE,
      intakes: [`${anchor - 2}/09`],
      share: 40,
      count: 0,
    },
    {
      id: createMeQuotaRowId('def'),
      kind: ME_QUOTA_KIND_INTAKE,
      intakes: [`${anchor - 1}/04`, `${anchor - 1}/09`],
      share: 30,
      count: 0,
    },
    {
      id: createMeQuotaRowId('def'),
      kind: ME_QUOTA_KIND_INTAKE,
      intakes: [`${anchor}/02`],
      share: 20,
      count: 0,
    },
    {
      id: createMeQuotaRowId('def'),
      kind: ME_QUOTA_KIND_SPECIAL,
      intakes: [],
      share: 10,
      count: 0,
    },
  ]
  return syncMeQuotaRowCounts(rows, totalCap)
}

export function emptyMeIntakeQuotaRow() {
  return {
    id: createMeQuotaRowId(),
    kind: ME_QUOTA_KIND_INTAKE,
    intakes: [],
    share: 0,
    count: 0,
  }
}

export function emptyMeSpecialQuotaRow(share = 10, count = 0) {
  return {
    id: createMeQuotaRowId('special'),
    kind: ME_QUOTA_KIND_SPECIAL,
    intakes: [],
    share: Math.max(0, Number(share) || 0),
    count: Math.max(0, Math.floor(Number(count) || 0)),
  }
}

export function meQuotaCountSum(rows = []) {
  return (rows || []).reduce((sum, r) => sum + Math.max(0, Math.floor(Number(r?.count) || 0)), 0)
}

export function normalizeMeQuotaTotalCap(value) {
  const n = Math.floor(Number(value) || 0)
  return n > 0 ? n : DEFAULT_ME_QUOTA_TOTAL_CAP
}

/** 按占比与总数重算各行名额数（余数按 allocateMeQuotaRows 分配） */
export function syncMeQuotaRowCounts(rows = [], totalCap = DEFAULT_ME_QUOTA_TOTAL_CAP) {
  const cap = normalizeMeQuotaTotalCap(totalCap)
  const quotas = allocateMeQuotaRows(cap, rows)
  return (rows || []).map((r) => ({
    ...r,
    count: quotas[r.id] ?? 0,
  }))
}

export function shareFromMeQuotaCount(count, totalCap) {
  const cap = normalizeMeQuotaTotalCap(totalCap)
  const n = Math.max(0, Math.floor(Number(count) || 0))
  if (!cap) return 0
  return Math.round((n / cap) * 100)
}

export function countFromMeQuotaShare(share, totalCap) {
  const cap = normalizeMeQuotaTotalCap(totalCap)
  const s = Math.max(0, Number(share) || 0)
  if (!cap) return 0
  return Math.floor((cap * s) / 100)
}

export function ensureSpecialMeQuotaRow(rows = [], totalCap = DEFAULT_ME_QUOTA_TOTAL_CAP) {
  const intakeRows = (rows || []).filter((r) => r.kind !== ME_QUOTA_KIND_SPECIAL)
  const special =
    (rows || []).find((r) => r.kind === ME_QUOTA_KIND_SPECIAL) ||
    emptyMeSpecialQuotaRow(10, countFromMeQuotaShare(10, totalCap))
  return [...intakeRows, special]
}

function normalizeOneMeQuotaRow(row, totalCap = DEFAULT_ME_QUOTA_TOTAL_CAP) {
  if (!row || typeof row !== 'object') return null
  const kind =
    row.kind === ME_QUOTA_KIND_SPECIAL ? ME_QUOTA_KIND_SPECIAL : ME_QUOTA_KIND_INTAKE
  const share = Math.max(0, Number(row.share) || 0)
  const count = Math.max(0, Math.floor(Number(row.count) || countFromMeQuotaShare(share, totalCap)))
  const id = String(row.id || '').trim() || createMeQuotaRowId()
  if (kind === ME_QUOTA_KIND_SPECIAL) {
    return { id, kind, intakes: [], share, count }
  }
  const intakes = [
    ...new Set(
      (Array.isArray(row.intakes) ? row.intakes : [])
        .map((v) => normalizeIntakeKey(v))
        .filter(Boolean),
    ),
  ].sort()
  return { id, kind, intakes, share, count }
}

export function normalizeMeQuotaRows(raw, academicSession = '', opts = {}) {
  const totalCap = normalizeMeQuotaTotalCap(opts.totalCap)
  const fallbackDefault = opts.fallbackDefault !== false
  const syncCounts = opts.syncCounts !== false
  const ensureSpecial = opts.ensureSpecial === true
  if (Array.isArray(raw) && raw.length) {
    const rows = raw.map((r) => normalizeOneMeQuotaRow(r, totalCap)).filter(Boolean)
    const merged = ensureSpecial ? ensureSpecialMeQuotaRow(rows, totalCap) : rows
    return syncCounts ? syncMeQuotaRowCounts(merged, totalCap) : merged
  }
  if (Array.isArray(raw) && !fallbackDefault) {
    if (ensureSpecial) {
      const merged = ensureSpecialMeQuotaRow([], totalCap)
      return syncCounts ? syncMeQuotaRowCounts(merged, totalCap) : merged
    }
    return []
  }
  return fallbackDefault ? defaultMeQuotaRows(academicSession, totalCap) : []
}

export function meQuotaShareSum(rows = []) {
  return (rows || []).reduce((sum, r) => sum + Math.max(0, Number(r?.share) || 0), 0)
}

/** @deprecated 旧 API 名 */
export function meYearSharePercentSum(meYearSharesOrRows) {
  if (Array.isArray(meYearSharesOrRows)) return meQuotaShareSum(meYearSharesOrRows)
  return Object.values(meYearSharesOrRows || {}).reduce(
    (sum, n) => sum + Math.max(0, Number(n) || 0),
    0,
  )
}

export function listMeQuotaIntakeKeys(rows = []) {
  const keys = []
  for (const row of rows || []) {
    if (row?.kind !== ME_QUOTA_KIND_INTAKE) continue
    for (const k of row.intakes || []) {
      const n = normalizeIntakeKey(k)
      if (n) keys.push(n)
    }
  }
  return keys
}

export function findDuplicateMeQuotaIntakes(rows = []) {
  const seen = new Set()
  const dup = new Set()
  for (const key of listMeQuotaIntakeKeys(rows)) {
    if (seen.has(key)) dup.add(key)
    else seen.add(key)
  }
  return [...dup]
}

/**
 * @param {object[]} rows
 * @param {{ hasSpecialStudents?: boolean, requiredIntakes?: string[] }} [ctx]
 * @returns {{ ok: boolean, errorKey?: string, errorParams?: object }}
 */
export function validateMeQuotaRows(rows = [], ctx = {}, totalCap = DEFAULT_ME_QUOTA_TOTAL_CAP) {
  const cap = normalizeMeQuotaTotalCap(totalCap)
  const list = (Array.isArray(rows) ? rows : [])
    .map((r) => normalizeOneMeQuotaRow(r, cap))
    .filter(Boolean)
  if (!list.length) {
    return { ok: false, errorKey: 'courseRegistration.batch.round1MeNoData' }
  }
  const sum = meQuotaShareSum(list)
  if (sum !== 100) {
    return {
      ok: false,
      errorKey: 'courseRegistration.batch.round1MeShareNeed100',
      errorParams: { sum },
    }
  }
  const countSum = meQuotaCountSum(list)
  if (countSum > cap) {
    return {
      ok: false,
      errorKey: 'courseRegistration.batch.round1MeCountOverCap',
      errorParams: { sum: countSum, total: cap },
    }
  }
  if (countSum !== cap) {
    return {
      ok: false,
      errorKey: 'courseRegistration.batch.round1MeCountNeedTotal',
      errorParams: { sum: countSum, total: cap },
    }
  }
  const dups = findDuplicateMeQuotaIntakes(list)
  if (dups.length) {
    return {
      ok: false,
      errorKey: 'courseRegistration.schedule.meQuotaIntakeDup',
      errorParams: { intakes: dups.join(', ') },
    }
  }
  for (const row of list) {
    if (row.kind === ME_QUOTA_KIND_INTAKE && !row.intakes.length) {
      return { ok: false, errorKey: 'courseRegistration.schedule.meQuotaIntakeRequired' }
    }
  }
  const specialRow = list.find((r) => r.kind === ME_QUOTA_KIND_SPECIAL)
  if (ctx.hasSpecialStudents) {
    if (!specialRow) {
      return { ok: false, errorKey: 'courseRegistration.schedule.meQuotaSpecialRequired' }
    }
    if (!(Number(specialRow?.share) > 0) || !(Number(specialRow?.count) > 0)) {
      return { ok: false, errorKey: 'courseRegistration.schedule.meQuotaSpecialShareRequired' }
    }
  }
  const required = [
    ...new Set((ctx.requiredIntakes || []).map((v) => normalizeIntakeKey(v)).filter(Boolean)),
  ]
  if (required.length) {
    const covered = new Set(listMeQuotaIntakeKeys(list))
    const missing = required.filter((k) => !covered.has(k))
    if (missing.length) {
      return {
        ok: false,
        errorKey: 'courseRegistration.schedule.meQuotaCoverageMissing',
        errorParams: { intakes: missing.join(', ') },
      }
    }
  }
  return { ok: true }
}

/** 学期全局：仅 GE 衰退因子 */
export function defaultSessionRound1Quota() {
  return { decayR: DEFAULT_DECAY_R }
}

/** ME 批次：新建空表（无默认占比行） */
export function emptyBatchMeQuota() {
  return {
    totalCap: DEFAULT_ME_QUOTA_TOTAL_CAP,
    meQuotaRows: [],
  }
}

/** ME 批次：名额总数 + 占比行 */
export function defaultBatchMeQuota(academicSession = '') {
  const totalCap = DEFAULT_ME_QUOTA_TOTAL_CAP
  return {
    totalCap,
    meQuotaRows: defaultMeQuotaRows(academicSession, totalCap),
  }
}

export function normalizeSessionRound1Quota(raw) {
  const r = Number(raw?.decayR)
  return {
    decayR: Number.isFinite(r) && r > 0 ? r : DEFAULT_DECAY_R,
  }
}

export function normalizeBatchMeQuota(raw, academicSession = '') {
  const totalCap = normalizeMeQuotaTotalCap(raw?.totalCap)
  const rawRows = raw?.meQuotaRows ?? raw?.meIntakeShares
  if (!Array.isArray(rawRows) || !rawRows.length) {
    return { totalCap, meQuotaRows: [] }
  }
  return {
    totalCap,
    meQuotaRows: normalizeMeQuotaRows(rawRows, academicSession, {
      totalCap,
      fallbackDefault: false,
      ensureSpecial: false,
      syncCounts: true,
    }),
  }
}

export function defaultRound1Quota(batchType = 'GE', programme = '', academicSession = '') {
  if (String(batchType || '').toUpperCase() === 'ME') {
    return defaultBatchMeQuota(academicSession)
  }
  return defaultSessionRound1Quota()
}

export function normalizeRound1Quota(raw, batchType = 'GE', programme = '', academicSession = '') {
  const decayR = normalizeSessionRound1Quota(raw).decayR
  if (String(batchType || '').toUpperCase() === 'ME') {
    const batch = normalizeBatchMeQuota(raw, academicSession)
    return { decayR, totalCap: batch.totalCap, meQuotaRows: batch.meQuotaRows }
  }
  return { decayR, meQuotaRows: [] }
}

export function getBatchRound1Quota(batch) {
  if (effectiveRound1QuotaResolver) {
    return effectiveRound1QuotaResolver(batch)
  }
  return normalizeRound1Quota(
    batch?.round1Quota,
    batch?.type,
    batch?.programme,
    batch?.academicSession,
  )
}

let effectiveRound1QuotaResolver = null
export function setEffectiveRound1QuotaResolver(fn) {
  effectiveRound1QuotaResolver = typeof fn === 'function' ? fn : null
}

/** 志愿/学生 intake → 入学年 YYYY（GE/其它兼容） */
export function intakeYearFromValue(intake) {
  const parsed = parseIntakeBatch(intake)
  if (parsed?.year) return parsed.year
  const d = String(intake || '').replace(/\D/g, '')
  if (d.length >= 4) return d.slice(0, 4)
  if (d.length === 2) return `20${d}`
  return ''
}

export function dayWeights(nDays, r) {
  const N = Math.max(1, Math.floor(nDays) || 1)
  const ratio = Number(r) > 0 ? Number(r) : DEFAULT_DECAY_R
  const weights = []
  for (let i = 1; i <= N; i += 1) {
    weights.push(ratio ** (N - i))
  }
  return weights
}

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

export function openDaysFromRange(start, end) {
  if (!start || !end) return DEMO_ROUND1_OPEN_DAYS
  const a = Date.parse(String(start).replace(/-/g, ' '))
  const b = Date.parse(String(end).replace(/-/g, ' '))
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return DEMO_ROUND1_OPEN_DAYS
  const dayMs = 24 * 60 * 60 * 1000
  return Math.max(1, Math.floor((b - a) / dayMs) + 1)
}

/**
 * 按占比行切分剩余容量
 * @returns {Record<string, number>} key = row.id
 */
export function allocateMeQuotaRows(remaining, meQuotaRows = []) {
  const cap = Math.max(0, Math.floor(Number(remaining) || 0))
  const rows = normalizeMeQuotaRows(meQuotaRows, '', { fallbackDefault: false, syncCounts: false }).filter(
    (r) => Number(r.share) > 0,
  )
  if (!cap || !rows.length) {
    return Object.fromEntries(rows.map((r) => [r.id, 0]))
  }
  const sum = rows.reduce((a, r) => a + Number(r.share), 0) || 1
  const quotas = {}
  let used = 0
  rows.forEach((r) => {
    const q = Math.floor((cap * Number(r.share)) / sum)
    quotas[r.id] = q
    used += q
  })
  let rest = cap - used
  let i = 0
  while (rest > 0 && rows.length) {
    quotas[rows[i % rows.length].id] += 1
    rest -= 1
    i += 1
  }
  return quotas
}

/** @deprecated 旧按年分配；若传入年 map 则忽略，返回空 */
export function allocateMeYearQuotas(remaining, meYearShares = {}) {
  if (Array.isArray(meYearShares)) return allocateMeQuotaRows(remaining, meYearShares)
  return {}
}

export function allocateMeGradeQuotas(remaining, meQuotaRows) {
  return allocateMeQuotaRows(remaining, meQuotaRows)
}

export function previewDaySharePercents(nDays, r) {
  const weights = dayWeights(nDays, r)
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  return weights.map((w) => Math.round((1000 * w) / sum) / 10)
}

export function meYearDefaultPool(academicSession) {
  const anchor = anchorYearFromSession(academicSession)
  const opts = []
  for (let y = anchor + 1; y >= anchor - 4; y -= 1) {
    opts.push(String(y))
  }
  return opts
}

export function meSemesterOptions() {
  return [...YEAR_INTAKE_MONTHS]
}

/** 合并 YYYY/MM 入学学期选项（年池 × 02/04/09） */
export function meIntakeOptionPool() {
  const opts = []
  for (const y of ME_INTAKE_YEAR_POOL) {
    for (const m of YEAR_INTAKE_MONTHS) {
      opts.push(`${y}/${m}`)
    }
  }
  return opts
}

/** @deprecated */
export function meYearAddOptions(academicSession, existingYears = []) {
  const taken = new Set((existingYears || []).map(String))
  return meYearDefaultPool(academicSession).filter((y) => !taken.has(y))
}

export function resolveMeQuotaRowForVolunteer(volunteer, rows = [], specialIdSet = null) {
  const list = normalizeMeQuotaRows(rows, '', { fallbackDefault: false })
  const sid = String(volunteer?.studentId || '').trim()
  if (specialIdSet && sid && specialIdSet.has(sid)) {
    return list.find((r) => r.kind === ME_QUOTA_KIND_SPECIAL) || null
  }
  const intake = normalizeIntakeKey(volunteer?.intake)
  if (!intake) return null
  return (
    list.find(
      (r) => r.kind === ME_QUOTA_KIND_INTAKE && (r.intakes || []).includes(intake),
    ) || null
  )
}

void INTAKE_KEY_RE
