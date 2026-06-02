export const intakeOptions = [
  '202509',
  '202504',
  '202503',
  '202410',
  '202409',
  '202404',
  '202403',
  '202309',
]

export const activeOptions = ['Yes', 'No']

export const initialIntakeSets = [
  { id: 1, code: '01', intake: '202509', active: 'Yes' },
  { id: 2, code: '02', intake: '202504', active: 'Yes' },
  { id: 3, code: '03', intake: '202503', active: 'Yes' },
  { id: 4, code: '04', intake: '202410', active: 'Yes' },
  { id: 5, code: '05', intake: '202409', active: 'Yes' },
  { id: 6, code: '06', intake: '202404', active: 'Yes' },
]

let intakeSeq = initialIntakeSets.length

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
  } else if (!/^\d{6}$/.test(intake)) {
    errors.intake = 'Intake must be 6 digits in Year+Month format (e.g. 202509)'
  } else if (!/^(19|20)\d{2}(0[1-9]|1[0-2])$/.test(intake)) {
    errors.intake = 'Intake must follow Year+Month format (e.g. 202509)'
  }

  if (!form.active) {
    errors.active = 'Active is required'
  } else if (!activeOptions.includes(form.active)) {
    errors.active = 'Active must be Yes or No'
  }

  return errors
}
