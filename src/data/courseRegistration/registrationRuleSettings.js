import { ref } from 'vue'

/**
 * v3：与批次「②选课规则」图示对齐的总规则目录（+ 保留延迟缴费天数）
 * 原 v2 key 不再读取，避免旧 7 条污染
 */
// const STORAGE_KEY = 'registration-rules-v2' // 弃用：v2 为 CR101–CR107 七条目录
const STORAGE_KEY = 'registration-rules-v3'

/**
 * @deprecated 旧版七条 ID；已由 CR201–CR204 + CR107 替代，保留导出仅供对照
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

export const REGISTRATION_RULE_IDS = [
  'CR201',
  'CR202',
  'CR203',
  'CR204',
  'CR107',
]

/** @typedef {'flag'|'count'} RegistrationRuleType */

/**
 * 默认总规则（顺序与设置页展示一致）
 * CR201–CR204 对齐 batchLocalRules；CR107 延迟缴费保留
 */
const DEFAULT_RULES = [
  {
    id: 'CR201',
    type: 'flag',
    enabled: true,
    params: { value: 1 },
  },
  {
    id: 'CR202',
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
    type: 'flag',
    enabled: false,
    params: { value: 0 },
  },
  {
    id: 'CR107',
    type: 'count',
    enabled: true,
    params: { value: 2 },
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

function normalizeParams(type, rawParams, fallback) {
  const src = rawParams && typeof rawParams === 'object' ? rawParams : {}
  const fb = fallback.params
  const n = parseNonNegInt(src.value)

  if (type === 'flag') {
    if (n == null) return { value: fb.value === 0 ? 0 : 1 }
    return { value: n === 0 ? 0 : 1 }
  }
  if (type === 'count') {
    return { value: n ?? fb.value }
  }
  return { value: fb.value }
}

function normalizeRule(raw, fallback) {
  return {
    id: fallback.id,
    type: fallback.type,
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : fallback.enabled,
    params: normalizeParams(fallback.type, raw?.params, fallback),
  }
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
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
  const stored = readStored()
  if (!stored) return defaults
  const byId = new Map(stored.map((row) => [row.id, row]))
  return defaults.map((fb) => normalizeRule(byId.get(fb.id) ?? fb, fb))
}

export function saveRegistrationRules(rules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export const registrationRules = ref(loadRegistrationRules())

export function validateRegistrationRuleParams(type, params) {
  const n = parseNonNegInt(params?.value)
  if (type === 'flag') {
    if (n == null || (n !== 0 && n !== 1)) {
      return 'registrationRules.validation.booleanValue'
    }
    return ''
  }
  if (type === 'count') {
    if (n == null) return 'registrationRules.validation.invalidCount'
    return ''
  }
  return 'registrationRules.validation.notFound'
}

export function updateRegistrationRuleEnabled(id, enabled) {
  const index = registrationRules.value.findIndex((row) => row.id === id)
  if (index === -1) return null
  const next = { ...registrationRules.value[index], enabled: Boolean(enabled) }
  registrationRules.value[index] = next
  saveRegistrationRules(registrationRules.value)
  return next
}

export function updateRegistrationRuleValue(id, value) {
  const index = registrationRules.value.findIndex((row) => row.id === id)
  if (index === -1) return { ok: false, errorKey: 'registrationRules.validation.notFound' }

  const current = registrationRules.value[index]
  const params = { value }
  const errorKey = validateRegistrationRuleParams(current.type, params)
  if (errorKey) return { ok: false, errorKey }

  const next = {
    ...current,
    params: normalizeParams(current.type, params, current),
  }
  registrationRules.value[index] = next
  saveRegistrationRules(registrationRules.value)
  return { ok: true, rule: next }
}

/** @deprecated 使用 updateRegistrationRuleValue */
export function updateRegistrationRuleParams(id, params) {
  return updateRegistrationRuleValue(id, params?.value)
}

/** 需缴费场景下允许的最大延迟缴费天数（规则关闭时回退默认 2） */
export function getPaymentGraceDays() {
  const rule = registrationRules.value.find((row) => row.id === 'CR107')
  if (!rule || rule.enabled === false) return 2
  const n = Number.parseInt(String(rule.params?.value ?? ''), 10)
  return Number.isFinite(n) && n >= 0 ? n : 2
}
