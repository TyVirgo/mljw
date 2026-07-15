import { ref } from 'vue'

const STORAGE_KEY = 'movement-rules-v2'
const LEGACY_STORAGE_KEY = 'movement-rules-v1'

/** Stable built-in rule ids; names come from i18n with `{value}` interpolation. */
export const MOVEMENT_RULE_IDS = ['MR001', 'MR002', 'MR003', 'MR004', 'MR005']

const DEFAULT_RULE_VALUES = {
  MR001: 3,
  MR002: 1,
  MR003: 2,
  MR004: 1,
  MR005: 0,
}

const DEFAULT_RULE_CONDITIONS = {
  MR001: {
    semesterType: 'long',
    studentCategory: 'local',
    movementType: 'programme-transfer',
    applicationWeek: null,
  },
  MR002: {
    semesterType: 'short',
    studentCategory: 'local',
    movementType: 'programme-transfer',
    applicationWeek: null,
  },
  MR003: {
    semesterType: null,
    studentCategory: 'international',
    movementType: 'programme-transfer',
    applicationWeek: null,
  },
  MR004: {
    semesterType: 'long',
    studentCategory: 'chinese',
    movementType: 'programme-transfer',
    applicationWeek: { start: 5, end: 7 },
  },
  MR005: {
    semesterType: 'short',
    studentCategory: 'chinese',
    movementType: 'programme-transfer',
    applicationWeek: null,
  },
}

function buildDefaultRules() {
  return MOVEMENT_RULE_IDS.map((id) => ({
    id,
    ruleValue: DEFAULT_RULE_VALUES[id],
    enabled: true,
    condition: DEFAULT_RULE_CONDITIONS[id],
  }))
}

export const movementRules = ref(loadMovementRules())

function normalizeApplicationWeek(rawWeek) {
  if (!rawWeek || typeof rawWeek !== 'object') return null
  const start = Number.parseInt(String(rawWeek.start), 10)
  const end = Number.parseInt(String(rawWeek.end), 10)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) return null
  return { start, end }
}

function normalizeCondition(raw, fallback) {
  const rawCondition = raw?.condition
  if (!rawCondition || typeof rawCondition !== 'object') return fallback.condition

  const fallbackCondition = fallback.condition
  return {
    semesterType: ['long', 'short'].includes(rawCondition.semesterType)
      ? rawCondition.semesterType
      : fallbackCondition.semesterType,
    studentCategory: ['chinese', 'local', 'international'].includes(rawCondition.studentCategory)
      ? rawCondition.studentCategory
      : fallbackCondition.studentCategory,
    movementType: ['programme-transfer', 'deferment', 'resumption', 'withdrawal'].includes(
      rawCondition.movementType,
    )
      ? rawCondition.movementType
      : fallbackCondition.movementType,
    applicationWeek:
      fallbackCondition.applicationWeek == null
        ? null
        : normalizeApplicationWeek(rawCondition.applicationWeek) ??
          fallbackCondition.applicationWeek,
  }
}

function normalizeRule(raw, fallback) {
  const id = String(raw?.id || fallback.id)
  const parsedValue = Number.parseInt(String(raw?.ruleValue ?? fallback.ruleValue), 10)
  return {
    id,
    ruleValue: Number.isFinite(parsedValue) ? parsedValue : fallback.ruleValue,
    enabled: raw?.enabled !== false,
    condition: normalizeCondition(raw, fallback),
  }
}

function readStoredRules(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function migrateLegacyV1Rules(legacyRows) {
  const byId = new Map(legacyRows.map((row) => [row.id, row]))
  const legacy001 = byId.get('MR001')
  const legacy002 = byId.get('MR002')
  const legacy003 = byId.get('MR003')

  const migrated = buildDefaultRules()
  if (legacy001) {
    migrated[0] = normalizeRule(legacy001, migrated[0])
  }
  if (legacy001 || legacy002 || legacy003) {
    migrated[1] = {
      ...migrated[1],
      enabled: legacy001?.enabled !== false,
    }
  }
  if (legacy002) {
    migrated[2] = normalizeRule({ ...legacy002, id: 'MR003' }, migrated[2])
  }
  if (legacy003) {
    migrated[3] = normalizeRule({ ...legacy003, id: 'MR004' }, migrated[3])
  }
  return migrated
}

export function getDefaultMovementRules() {
  return buildDefaultRules()
}

export function loadMovementRules() {
  const defaults = buildDefaultRules()
  const current = readStoredRules(STORAGE_KEY)
  if (current) {
    const byId = new Map(current.map((row) => [row.id, row]))
    return defaults.map((fallback) => normalizeRule(byId.get(fallback.id), fallback))
  }

  const legacy = readStoredRules(LEGACY_STORAGE_KEY)
  if (legacy) {
    const migrated = migrateLegacyV1Rules(legacy)
    saveMovementRules(migrated)
    return migrated
  }

  return defaults
}

export function saveMovementRules(rules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function validateMovementRuleValue(ruleValue, id) {
  const value = Number.parseInt(String(ruleValue ?? '').trim(), 10)
  if (!Number.isFinite(value) || value < 0) {
    return 'movementRules.validation.invalidValue'
  }
  if ((id === 'MR004' || id === 'MR005') && value !== 0 && value !== 1) {
    return 'movementRules.validation.booleanValue'
  }
  return ''
}

export function validateApplicationWeek(start, end) {
  const parsedStart = Number.parseInt(String(start ?? '').trim(), 10)
  const parsedEnd = Number.parseInt(String(end ?? '').trim(), 10)
  if (!Number.isFinite(parsedStart) || !Number.isFinite(parsedEnd) || parsedStart < 1 || parsedEnd < parsedStart) {
    return 'movementRules.validation.invalidApplicationWeek'
  }
  return ''
}

export function updateMovementRuleEnabled(id, enabled) {
  const index = movementRules.value.findIndex((row) => row.id === id)
  if (index === -1) return null
  const next = { ...movementRules.value[index], enabled: Boolean(enabled) }
  movementRules.value[index] = next
  saveMovementRules(movementRules.value)
  return next
}

export function updateMovementRule(id, { ruleValue, applicationWeek } = {}) {
  const errorKey = validateMovementRuleValue(ruleValue, id)
  if (errorKey) return { ok: false, errorKey }

  const index = movementRules.value.findIndex((row) => row.id === id)
  if (index === -1) return { ok: false, errorKey: 'movementRules.validation.notFound' }

  const current = movementRules.value[index]
  let nextCondition = current.condition

  if (applicationWeek !== undefined && current.condition?.applicationWeek != null) {
    const weekError = validateApplicationWeek(applicationWeek.start, applicationWeek.end)
    if (weekError) return { ok: false, errorKey: weekError }
    nextCondition = {
      ...current.condition,
      applicationWeek: {
        start: Number.parseInt(String(applicationWeek.start).trim(), 10),
        end: Number.parseInt(String(applicationWeek.end).trim(), 10),
      },
    }
  }

  const value = Number.parseInt(String(ruleValue).trim(), 10)
  const next = {
    ...current,
    ruleValue: value,
    condition: nextCondition,
  }
  movementRules.value[index] = next
  saveMovementRules(movementRules.value)
  return { ok: true, rule: next }
}

export function updateMovementRuleValue(id, ruleValue) {
  return updateMovementRule(id, { ruleValue })
}
