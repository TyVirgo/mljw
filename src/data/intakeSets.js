/** Intake month codes: Feb/Apr short semesters, Sep long semester. */
import { initialSemesterRecords, formatAcademicSession } from './semesterInfo.js'

export const VALID_INTAKE_MONTHS = ['02', '04', '09']

export function parseIntakeBatch(intake) {
  const value = String(intake || '').trim()
  const slashMatch = value.match(/^(\d{4})\/(\d{2})$/)
  if (slashMatch && VALID_INTAKE_MONTHS.includes(slashMatch[2])) {
    return { year: slashMatch[1], month: slashMatch[2] }
  }
  const compactMatch = value.match(/^(\d{4})(\d{2})$/)
  if (compactMatch && VALID_INTAKE_MONTHS.includes(compactMatch[2])) {
    return { year: compactMatch[1], month: compactMatch[2] }
  }
  // demo 常见 YYMM（如 2409 → 2024/09）
  const shortMatch = value.match(/^(\d{2})(\d{2})$/)
  if (shortMatch && VALID_INTAKE_MONTHS.includes(shortMatch[2])) {
    return { year: `20${shortMatch[1]}`, month: shortMatch[2] }
  }
  return null
}

export function formatIntakeBatch(intake) {
  const parsed = parseIntakeBatch(intake)
  if (!parsed) return String(intake || '').trim()
  return `${parsed.year}/${parsed.month}`
}

export function intakeToCompact(intake) {
  const parsed = parseIntakeBatch(intake)
  if (!parsed) return String(intake || '').replace(/\//g, '')
  return `${parsed.year}${parsed.month}`
}

export function getIntakeOptions(records = initialSemesterRecords) {
  const seen = new Set()
  const options = []
  records.forEach((record) => {
    if (!VALID_INTAKE_MONTHS.includes(record.semester)) return
    const value = formatAcademicSession(record.academicYear, record.semester)
    if (value && !seen.has(value)) {
      seen.add(value)
      options.push(value)
    }
  })
  return options.sort().reverse()
}

export const intakeOptions = getIntakeOptions()

export const activeOptions = ['Yes', 'No']

export const initialIntakeSets = [
  { id: 1, code: '01', intake: '2025/09', active: 'Yes' },
  { id: 2, code: '02', intake: '2025/04', active: 'Yes' },
  { id: 3, code: '03', intake: '2025/02', active: 'Yes' },
  { id: 4, code: '04', intake: '2024/09', active: 'Yes' },
  { id: 5, code: '05', intake: '2024/04', active: 'Yes' },
  { id: 6, code: '06', intake: '2024/02', active: 'Yes' },
]

let intakeSeq = initialIntakeSets.length

export function isValidIntakeBatch(intake) {
  return parseIntakeBatch(intake) !== null
}

export function createIntakeSetId() {
  intakeSeq += 1
  return intakeSeq
}

export function validateIntakeSetForm(form, allItems, excludeId = null) {
  const errors = {}
  const code = String(form.code || '').trim()
  const intake = formatIntakeBatch(form.intake)

  if (!code) {
    errors.code = 'Code is required'
  } else if (!/^\d{1,2}$/.test(code)) {
    errors.code = 'Code must be numeric with at most 2 digits'
  } else {
    const duplicate = allItems.some(
      (item) => item.id !== excludeId && item.code.toLowerCase() === code.toLowerCase(),
    )
    if (duplicate) errors.code = 'Code already exists and must be globally unique'
  }

  if (!intake) {
    errors.intake = 'Intake is required'
  } else if (!isValidIntakeBatch(intake)) {
    errors.intake = 'Intake must be in YYYY/MM format with month 02, 04 or 09 (e.g. 2025/09)'
  }

  if (!form.active) {
    errors.active = 'Active is required'
  } else if (!activeOptions.includes(form.active)) {
    errors.active = 'Active must be Yes or No'
  }

  return errors
}
