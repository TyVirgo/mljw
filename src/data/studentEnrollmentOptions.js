import {
  programmeCatalogue,
  programmeIntakeSchools,
  getActiveIntakeOptions,
  startingSemesterOptions,
} from './programmeIntakes.js'

export function getEnrollmentProgrammeCodeOptions() {
  return [...new Set(programmeCatalogue.map((item) => item.programmeCode))].sort()
}

export function getEnrollmentProgrammeNameOptions() {
  return [...new Set(programmeCatalogue.map((item) => item.programmeName))].sort()
}

export function getEnrollmentFacultyOptions() {
  return programmeIntakeSchools.map((school) => school.label).sort()
}

export function getEnrollmentIntakeOptions() {
  return getActiveIntakeOptions().sort()
}

export function getEnrollmentAcademicSessionOptions() {
  return [...startingSemesterOptions].sort()
}
