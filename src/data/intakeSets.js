/** Intake month codes: Feb/Apr short semesters, Sep long semester. */
export const VALID_INTAKE_MONTHS = ['02', '04', '09']

export const intakeOptions = [
  '202509',
  '202504',
  '202502',
  '202409',
  '202404',
  '202402',
  '202309',
  '202304',
  '202302',
]

export const activeOptions = ['Yes', 'No']

export const initialIntakeSets = [
  { id: 1, code: '01', intake: '202509', active: 'Yes' },
  { id: 2, code: '02', intake: '202504', active: 'Yes' },
  { id: 3, code: '03', intake: '202502', active: 'Yes' },
  { id: 4, code: '04', intake: '202409', active: 'Yes' },
  { id: 5, code: '05', intake: '202404', active: 'Yes' },
  { id: 6, code: '06', intake: '202402', active: 'Yes' },
]

let intakeSeq = initialIntakeSets.length

export function isValidIntakeBatch(intake) {
  const value = String(intake || '').trim()
  if (!/^\d{6}$/.test(value)) return false
  if (!/^(19|20)\d{2}(0[1-9]|1[0-2])$/.test(value)) return false
  return VALID_INTAKE_MONTHS.includes(value.slice(4, 6))
}

export function createIntakeSetId() {
  intakeSeq += 1
  return intakeSeq
}

export function validateIntakeSetForm(form, allItems, excludeId = null) {
  const errors = {}
  const code = String(form.code || '').trim()
  const intake = String(form.intake || '').trim()

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
    errors.intake = 'Intake must be Year+Month in 02, 04 or 09 format (e.g. 202409)'
  }

  if (!form.active) {
    errors.active = 'Active is required'
  } else if (!activeOptions.includes(form.active)) {
    errors.active = 'Active must be Yes or No'
  }

  return errors
}
