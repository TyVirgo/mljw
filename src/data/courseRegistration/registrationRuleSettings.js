import { ref } from 'vue'
import { parseBatchDateTime } from './registrationBatchFormUtils.js'
import { resolveEffectiveCrossReleaseAt } from './sessionRegistrationSchedules.js'

/** 与白名单可超学分同构（避免与 addDropMultiItems 循环依赖，数值须保持一致） */
const CREDIT_BYPASS_EXTRA_MIN = 1
const CREDIT_BYPASS_EXTRA_MAX = 3
const DEFAULT_CREDIT_BYPASS_EXTRA = 3

/**
 * v5：去 CR202；CR204 可超学分 count；CR107 缴费宽限改小时
 * 读库时按 DEFAULT_RULES 合并，缺省 id 用默认值；兼容 v4 存档
 */
const STORAGE_KEY = 'registration-rules-v5'
/** @deprecated v4 键，仅迁移读取 */
const LEGACY_STORAGE_KEY_V4 = 'registration-rules-v4'

/**
 * @deprecated 旧版七条 ID；已由 CR201–CR204 + CR107 + CR205 替代，保留导出仅供对照
 */
export const LEGACY_REGISTRATION_RULE_IDS = [
  'CR101',
  'CR102',
  'CR103',
  'CR104',
  'CR105',
  'CR106',
  'CR107',
]

/**
 * 现行校级规则 ID（增量 af：无 CR202）
 * @deprecated CR202 已从目录移除（不及格可重修改由业务隐式/批次另议）
 */
export const REMOVED_REGISTRATION_RULE_IDS = ['CR202']

export const REGISTRATION_RULE_IDS = [
  'CR201',
  'CR203',
  'CR204',
  'CR107',
  'CR205',
]

/** @typedef {'flag'|'count'} RegistrationRuleType */

/**
 * 默认总规则（顺序与设置页展示一致）
 * CR201 先修；CR203 退自选次数；CR204 可超学分；CR107 缴费小时；CR205 互释
 */
const DEFAULT_RULES = [
  {
    id: 'CR201',
    type: 'flag',
    enabled: true,
    params: { value: 1 },
  },
  {
    id: 'CR203',
    type: 'count',
    enabled: true,
    params: { value: 10 },
  },
  {
    id: 'CR204',
    type: 'count',
    enabled: false,
    params: { value: DEFAULT_CREDIT_BYPASS_EXTRA },
  },
  {
    id: 'CR107',
    type: 'count',
    enabled: true,
    params: { value: 48 },
  },
  {
    id: 'CR205',
    type: 'flag',
    enabled: true,
    params: { value: 1 },
  },
]

/* 原 v2 默认七条（弃用：与批次图示不一致，已由 DEFAULT_RULES v3 替代）
const DEFAULT_RULES_V2 = [
  { id: 'CR101', type: 'flag', enabled: false, params: { value: 1 } },
  { id: 'CR102', type: 'flag', enabled: true, params: { value: 0 } },
  { id: 'CR103', type: 'count', enabled: true, params: { value: 5 } },
  { id: 'CR104', type: 'flag', enabled: true, params: { value: 0 } },
  { id: 'CR105', type: 'flag', enabled: true, params: { value: 0 } },
  { id: 'CR106', type: 'flag', enabled: true, params: { value: 1 } },
  { id: 'CR107', type: 'count', enabled: true, params: { value: 2 } },
]
*/

function parseNonNegInt(raw) {
  const n = Number.parseInt(String(raw ?? '').trim(), 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * 钳制可超学分 1–3
 * @param {unknown} raw
 * @param {number} [fallback]
 */
function clampCreditBypassExtra(raw, fallback = DEFAULT_CREDIT_BYPASS_EXTRA) {
  const n = parseNonNegInt(raw)
  if (n == null || n < CREDIT_BYPASS_EXTRA_MIN) {
    return Math.min(CREDIT_BYPASS_EXTRA_MAX, Math.max(CREDIT_BYPASS_EXTRA_MIN, fallback))
  }
  return Math.min(CREDIT_BYPASS_EXTRA_MAX, Math.max(CREDIT_BYPASS_EXTRA_MIN, n))
}

/**
 * CR107：仅从 v4「天」存档迁移为小时（常见 1–14）
 * @param {number|null} n
 * @param {number} fallbackHours
 * @param {boolean} fromLegacyDays
 */
function migratePaymentGraceHours(n, fallbackHours, fromLegacyDays) {
  if (n == null) return fallbackHours
  if (fromLegacyDays && n > 0 && n <= 14) return n * 24
  return n
}

/**
 * @param {'flag'|'count'} type
 * @param {object} rawParams
 * @param {object} fallback
 * @param {string} ruleId
 * @param {{ fromLegacyDays?: boolean }} [opts]
 */
function normalizeParams(type, rawParams, fallback, ruleId, opts = {}) {
  const src = rawParams && typeof rawParams === 'object' ? rawParams : {}
  const fb = fallback.params
  const n = parseNonNegInt(src.value)

  if (type === 'flag') {
    if (n == null) return { value: fb.value === 0 ? 0 : 1 }
    return { value: n === 0 ? 0 : 1 }
  }
  if (type === 'count') {
    if (ruleId === 'CR204') {
      return { value: clampCreditBypassExtra(src.value, fb.value) }
    }
    if (ruleId === 'CR107') {
      return {
        value: migratePaymentGraceHours(n, fb.value, Boolean(opts.fromLegacyDays)),
      }
    }
    return { value: n ?? fb.value }
  }
  return { value: fb.value }
}

/**
 * 单条规则归一；含 CR204 flag→count、CR107 天→小时迁移
 * @param {object|undefined} raw
 * @param {object} fallback
 * @param {{ fromLegacyDays?: boolean }} [opts]
 */
function normalizeRule(raw, fallback, opts = {}) {
  // CR204：旧版 flag 0/1 → count 可超分
  if (fallback.id === 'CR204') {
    const oldType = raw?.type
    const oldVal = parseNonNegInt(raw?.params?.value)
    const oldEnabled =
      typeof raw?.enabled === 'boolean' ? raw.enabled : fallback.enabled
    if (oldType === 'flag' || (oldType == null && (oldVal === 0 || oldVal === 1))) {
      const on = Boolean(oldEnabled) && oldVal !== 0
      return {
        id: 'CR204',
        type: 'count',
        enabled: on,
        params: { value: DEFAULT_CREDIT_BYPASS_EXTRA },
      }
    }
  }

  return {
    id: fallback.id,
    type: fallback.type,
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : fallback.enabled,
    params: normalizeParams(fallback.type, raw?.params, fallback, fallback.id, opts),
  }
}

/**
 * @returns {{ rows: object[]|null, fromLegacyDays: boolean }}
 */
function readStored() {
  try {
    const v5 = localStorage.getItem(STORAGE_KEY)
    if (v5) {
      const parsed = JSON.parse(v5)
      return { rows: Array.isArray(parsed) ? parsed : null, fromLegacyDays: false }
    }
    const v4 = localStorage.getItem(LEGACY_STORAGE_KEY_V4)
    if (!v4) return { rows: null, fromLegacyDays: false }
    const parsed = JSON.parse(v4)
    return { rows: Array.isArray(parsed) ? parsed : null, fromLegacyDays: true }
  } catch {
    return { rows: null, fromLegacyDays: false }
  }
}

export function getDefaultRegistrationRules() {
  return DEFAULT_RULES.map((row) => ({
    ...row,
    params: { ...row.params },
  }))
}

export function loadRegistrationRules() {
  const defaults = getDefaultRegistrationRules()
  const { rows: stored, fromLegacyDays } = readStored()
  if (!stored) return defaults
  const byId = new Map(stored.map((row) => [row.id, row]))
  const opts = { fromLegacyDays }
  return defaults.map((fb) => normalizeRule(byId.get(fb.id) ?? fb, fb, opts))
}

export function saveRegistrationRules(rules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export const registrationRules = ref(loadRegistrationRules())

export function validateRegistrationRuleParams(type, params, ruleId = '') {
  const n = parseNonNegInt(params?.value)
  if (type === 'flag') {
    if (n == null || (n !== 0 && n !== 1)) {
      return 'registrationRules.validation.booleanValue'
    }
    return ''
  }
  if (type === 'count') {
    if (n == null) return 'registrationRules.validation.invalidCount'
    if (ruleId === 'CR204') {
      if (n < CREDIT_BYPASS_EXTRA_MIN || n > CREDIT_BYPASS_EXTRA_MAX) {
        return 'registrationRules.validation.creditBypassExtra'
      }
    }
    return ''
  }
  return 'registrationRules.validation.notFound'
}

export function updateRegistrationRuleEnabled(id, enabled) {
  const index = registrationRules.value.findIndex((row) => row.id === id)
  if (index === -1) return null
  const current = registrationRules.value[index]
  const on = Boolean(enabled)
  const next = {
    ...current,
    enabled: on,
    // flag：启用与规则值 0/1 同步，避免表意分裂
    params:
      current.type === 'flag'
        ? { value: on ? 1 : 0 }
        : { ...current.params },
  }
  // CR204 开启且值为空/0 时回落默认可超
  if (id === 'CR204' && on) {
    next.params = { value: clampCreditBypassExtra(next.params?.value, DEFAULT_CREDIT_BYPASS_EXTRA) }
  }
  registrationRules.value[index] = next
  saveRegistrationRules(registrationRules.value)
  return next
}

export function updateRegistrationRuleValue(id, value) {
  const index = registrationRules.value.findIndex((row) => row.id === id)
  if (index === -1) return { ok: false, errorKey: 'registrationRules.validation.notFound' }

  const current = registrationRules.value[index]
  const params = { value }
  const errorKey = validateRegistrationRuleParams(current.type, params, id)
  if (errorKey) return { ok: false, errorKey }

  const next = {
    ...current,
    params: normalizeParams(current.type, params, current, id, { fromLegacyDays: false }),
  }
  if (current.type === 'flag') {
    next.enabled = next.params.value === 1
  }
  registrationRules.value[index] = next
  saveRegistrationRules(registrationRules.value)
  return { ok: true, rule: next }
}

/** @deprecated 使用 updateRegistrationRuleValue */
export function updateRegistrationRuleParams(id, params) {
  return updateRegistrationRuleValue(id, params?.value)
}

/**
 * 校级全局缴费宽限（小时）；规则关闭时回退默认 48
 * @returns {number}
 */
export function getPaymentGraceHours() {
  const rule = registrationRules.value.find((row) => row.id === 'CR107')
  if (!rule || rule.enabled === false) return 48
  const n = Number.parseInt(String(rule.params?.value ?? ''), 10)
  return Number.isFinite(n) && n >= 0 ? n : 48
}

/**
 * @deprecated 增量 af 起缴费按小时；保留仅作兼容，内部转小时/24 向下取整
 * @returns {number}
 */
export function getPaymentGraceDays() {
  return Math.max(0, Math.floor(getPaymentGraceHours() / 24))
}

/**
 * 校级全局可超学期学分（1–3）；未启用返回 0
 * @returns {number}
 */
export function getCampusCreditBypassExtra() {
  const rule = registrationRules.value.find((row) => row.id === 'CR204')
  if (!rule || rule.enabled === false) return 0
  return clampCreditBypassExtra(rule.params?.value, DEFAULT_CREDIT_BYPASS_EXTRA)
}

/**
 * 校级「第三轮选课新老生名额互释」是否开启（CR205）
 */
export function isCampusReleaseCrossAudienceOnRound3() {
  const rule = registrationRules.value.find((row) => row.id === 'CR205')
  if (!rule) return true
  if (rule.enabled === false) return false
  return Number(rule.params?.value) !== 0
}

/**
 * 是否开启 R3 新老生名额互释：批次 localRules 优先，否则校级 CR205
 * @param {object|null|undefined} batch
 */
export function isReleaseCrossAudienceOnRound3(batch) {
  const local = batch?.localRules
  if (local && typeof local === 'object' && 'releaseCrossAudienceOnRound3' in local) {
    return local.releaseCrossAudienceOnRound3 !== false
  }
  return isCampusReleaseCrossAudienceOnRound3()
}

/**
 * 互释是否已对容量生效：政策开关开，且当前时间已达选课时间配置中的生效时刻
 * @param {object|null|undefined} batch
 * @param {number} [nowMs]
 */
export function isCrossAudienceReleaseActive(batch, nowMs = Date.now()) {
  if (!isReleaseCrossAudienceOnRound3(batch)) return false
  const at = resolveEffectiveCrossReleaseAt(batch)
  if (!at) return false
  const parsed = parseBatchDateTime(at)
  if (!parsed || Number.isNaN(parsed.getTime())) return false
  return nowMs >= parsed.getTime()
}
