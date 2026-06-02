export const yesNoOptions = ['Yes', 'No']

export const initialAcademicYears = [
  { id: 1, code: '2021', name: '2021', activation: 'No' },
  { id: 2, code: '2022', name: '2022', activation: 'No' },
  { id: 3, code: '2023', name: '2023', activation: 'Yes' },
  { id: 4, code: '2024', name: '2024', activation: 'Yes' },
  { id: 5, code: '2025', name: '2025', activation: 'Yes' },
  { id: 6, code: '2026', name: '2026', activation: 'No' },
]

let academicYearSeq = initialAcademicYears.length

export function createAcademicYearId() {
  academicYearSeq += 1
  return academicYearSeq
}

export function formatAcademicYearName(name, locale = 'en') {
  if (!name) return ''
  if (/^\d{4}$/.test(name.trim())) {
    const year = name.trim()
    return locale === 'zh' ? `${year}年` : `Year ${year}`
  }
  return name
}

export function validateAcademicYearForm(form, allItems, excludeId = null) {
  const errors = {}
  const code = String(form.code || '').trim()
  const name = String(form.name || '').trim()

  if (!code) {
    errors.code = 'Academic Year Code is required'
  } else if (!/^\d{4}$/.test(code)) {
    errors.code = 'Academic Year Code must be a 4-digit year (e.g. 2025)'
  } else {
    const duplicateCode = allItems.some((item) => item.id !== excludeId && item.code === code)
    if (duplicateCode) errors.code = 'Academic Year Code already exists and must be unique'
  }

  if (!name) {
    errors.name = 'Academic Year is required'
  } else if (name.length > 20) {
    errors.name = 'Academic Year must be within 20 characters'
  }

  if (!form.activation) {
    errors.activation = 'Activation is required'
  } else if (!yesNoOptions.includes(form.activation)) {
    errors.activation = 'Activation must be Yes or No'
  }

  return errors
}
