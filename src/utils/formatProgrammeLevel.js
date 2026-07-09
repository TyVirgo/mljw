import { normalizeConsentProgrammeLevel } from '../data/consentForms.js'

export function getNormalizedProgrammeLevel(value) {
  return normalizeConsentProgrammeLevel(value)
}

export function programmeLevelsMatch(storedValue, filterValue) {
  if (!String(filterValue || '').trim()) return true
  return getNormalizedProgrammeLevel(storedValue) === getNormalizedProgrammeLevel(filterValue)
}

export function formatProgrammeLevelLabel(value, translate) {
  const normalized = getNormalizedProgrammeLevel(value)
  if (!normalized) return ''
  const key = `consentForm.programmeLevel.${normalized}`
  const translated = translate(key)
  return translated !== key ? translated : normalized
}
