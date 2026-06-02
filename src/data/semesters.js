export const yesNoOptions = ['Yes', 'No']

export const initialSemesters = [
  { id: 1, code: '1', name: '02', activation: 'Yes' },
  { id: 2, code: '2', name: '04', activation: 'Yes' },
  { id: 3, code: '3', name: '09', activation: 'Yes' },
  { id: 4, code: '4', name: '01', activation: 'Yes' },
  { id: 5, code: '5', name: '03', activation: 'No' },
  { id: 6, code: '6', name: '05', activation: 'No' },
]

let semesterMasterSeq = initialSemesters.length

export function createSemesterMasterId() {
  semesterMasterSeq += 1
  return semesterMasterSeq
}

export function formatSemesterSettingName(name, locale = 'en') {
  if (!name) return ''
  if (/^\d{2}$/.test(name.trim())) {
    const semester = name.trim()
    return locale === 'zh' ? `${semester}学期` : `Semester ${semester}`
  }
  return name
}

export function validateSemesterMasterForm(form, allItems, excludeId = null) {
  const errors = {}
  const code = String(form.code || '').trim()
  const name = String(form.name || '').trim()

  if (!code) {
    errors.code = 'Semester Code is required'
  } else if (!/^[a-zA-Z0-9]+$/.test(code)) {
    errors.code = 'Semester Code must contain letters or numbers only (e.g. 1, 02)'
  } else {
    const duplicateCode = allItems.some((item) => item.id !== excludeId && item.code === code)
    if (duplicateCode) errors.code = 'Semester Code already exists and must be unique'
  }

  if (!name) {
    errors.name = 'Semester is required'
  } else if (name.length > 20) {
    errors.name = 'Semester must be within 20 characters'
  }

  if (!form.activation) {
    errors.activation = 'Activation is required'
  } else if (!yesNoOptions.includes(form.activation)) {
    errors.activation = 'Activation must be Yes or No'
  }

  return errors
}
