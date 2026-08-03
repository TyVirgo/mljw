/** 选课批次/课程类型：ME · GE（选修） */

export const LEGACY_REGISTRATION_TYPE_MAP = {
  M1: 'ME',
  G1: 'GE',
  Mandatory: 'ME',
}

export const registrationBatchTypeOptions = [
  { value: 'ME', labelKey: 'courseRegistration.types.ME.label', descKey: 'courseRegistration.types.ME.batchDesc' },
  { value: 'GE', labelKey: 'courseRegistration.types.GE.label', descKey: 'courseRegistration.types.GE.batchDesc' },
]

export const courseTypeOptions = [
  { value: 'ME', labelKey: 'courseRegistration.types.ME.label', descKey: 'courseRegistration.types.ME.courseDesc' },
  { value: 'GE', labelKey: 'courseRegistration.types.GE.label', descKey: 'courseRegistration.types.GE.courseDesc' },
]

export function normalizeRegistrationType(value) {
  const raw = String(value || '').trim()
  return LEGACY_REGISTRATION_TYPE_MAP[raw] || raw
}

export function getRegistrationTypeLabel(value, t) {
  const normalized = normalizeRegistrationType(value)
  const key = `courseRegistration.types.${normalized}.label`
  const label = t(key)
  return label !== key ? label : normalized || '—'
}

export function getRegistrationTypeShort(value) {
  return normalizeRegistrationType(value) || '—'
}

export function getBatchTypeFieldTooltip(t) {
  return t('courseRegistration.types.fieldTooltip')
}
