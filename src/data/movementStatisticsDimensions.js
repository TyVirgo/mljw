import {
  programmeCodeFromName,
  schoolFromProgramme,
} from './movementMaintenanceFields.js'

const SCHOOL_NAME_TO_CODE = {
  'School of Computing': 'SOC',
  'School of Business': 'SOB',
  'School of Foundation': 'SOF',
}

const PROGRAMME_ALIASES = {
  AIT: 'AIT',
  JRN: 'JRN',
  SWE: 'SWE',
  CS: 'CS',
  FIN: 'FIN',
  IB: 'IB',
  ACC: 'ACC',
  DS: 'DS',
}

export function schoolCodeFromName(schoolName) {
  if (!schoolName) return ''
  return SCHOOL_NAME_TO_CODE[schoolName] || ''
}

export function resolveProgrammeCode(programme) {
  if (!programme) return ''
  const mapped = programmeCodeFromName(programme)
  if (mapped) return mapped
  const trimmed = String(programme).trim()
  if (PROGRAMME_ALIASES[trimmed.toUpperCase()]) return trimmed.toUpperCase()
  return trimmed.length <= 8 && !trimmed.includes(' ') ? trimmed.toUpperCase() : ''
}

export function resolveStatDimensions(sourceKey, item, normalized = {}) {
  switch (sourceKey) {
    case 'programme-transfer': {
      const schoolName = item.currentSchool || normalized.currentSchool
      const programmeName = item.currentProgramme
      return {
        schoolCode: schoolCodeFromName(schoolName),
        programmeCode:
          programmeCodeFromName(programmeName) ||
          normalized.currentProgrammeCode ||
          resolveProgrammeCode(programmeName),
        intake: item.currentIntake || normalized.intake || '',
      }
    }
    case 'deferment':
    case 'withdrawal': {
      const programme = item.programme || ''
      return {
        schoolCode: schoolCodeFromName(schoolFromProgramme(programme)),
        programmeCode: resolveProgrammeCode(programme),
        intake: item.intake || normalized.intake || '',
      }
    }
    case 'resumption': {
      const programme = item.programme || ''
      return {
        schoolCode: schoolCodeFromName(schoolFromProgramme(programme)),
        programmeCode: resolveProgrammeCode(programme),
        intake: item.originalIntake || normalized.intake || '',
      }
    }
    default:
      return { schoolCode: '', programmeCode: '', intake: '' }
  }
}

export function buildGroupKey(schoolCode, programmeCode, intake) {
  return `${schoolCode}|${programmeCode}|${intake}`
}
