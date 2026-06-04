import { formatSemesterDisplay, semesterCodeOptions } from './semesterInfo.js'

export const yesNoOptions = ['Yes', 'No']

export const initialSemesters = [
  { id: 1, code: '1', name: '02', activation: 'Yes' },
  { id: 2, code: '2', name: '04', activation: 'Yes' },
  { id: 3, code: '3', name: '09', activation: 'Yes' },
]

let semesterMasterSeq = initialSemesters.length

export function createSemesterMasterId() {
  semesterMasterSeq += 1
  return semesterMasterSeq
}

export function formatSemesterSettingName(name, locale = 'en') {
  if (!name) return ''
  if (/^\d{2}$/.test(String(name).trim())) {
    return formatSemesterDisplay(String(name).trim(), locale)
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
  } else if (!semesterCodeOptions.includes(name)) {
    errors.name = 'Semester must be one of: 02, 04, 09'
  }

  if (!form.activation) {
    errors.activation = 'Activation is required'
  } else if (!yesNoOptions.includes(form.activation)) {
    errors.activation = 'Activation must be Yes or No'
  }

  return errors
}
