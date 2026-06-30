import {
  programmeCatalogue,
  getActiveIntakeOptions,
  startingSemesterOptions,
} from './programmeIntakes.js'

export function getEnrollmentProgrammeNameOptions() {
  return [...new Set(programmeCatalogue.map((item) => item.programmeName))].sort()
}

export function getEnrollmentIntakeOptions() {
  return getActiveIntakeOptions().sort()
}

export function getEnrollmentAcademicSessionOptions() {
  return [...startingSemesterOptions].sort()
}

export function resolveEnrollmentByProgrammeName(programmeName) {
  const name = String(programmeName || '').trim()
  if (!name) return null
  const item = programmeCatalogue.find((row) => row.programmeName === name)
  if (!item) return null
  return {
    programmeCode: item.programmeCode,
    programme: item.programmeName,
    faculty: item.school,
    programmeLevel: item.level || '',
    duration: item.years != null ? String(item.years) : '',
  }
}
