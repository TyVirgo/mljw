import {
  formatStudentPassExpiryEndDate,
  isChinaOrInternationalCategory,
  resolveCategoryFromNationality,
  resolveStudentPassExpiryEndDisplay,
} from '../data/students.js'

export function resolveMovementStudentCategory(itemOrStudent) {
  if (!itemOrStudent) return 'Local'
  return (
    itemOrStudent.studentCategory ||
    itemOrStudent.studentType ||
    resolveCategoryFromNationality(itemOrStudent.nationality) ||
    'Local'
  )
}

export function resolveMovementVisaExpiryFromStudent(student) {
  if (!student) return '—'
  const category = resolveMovementStudentCategory(student)
  if (!isChinaOrInternationalCategory(category)) return '—'
  const basic = student.basicInfo || student
  return formatStudentPassExpiryEndDate(basic) || '—'
}

export function displayMovementVisaExpiry(storedValue, category) {
  if (!isChinaOrInternationalCategory(category)) return '—'
  const text = resolveStudentPassExpiryEndDisplay(storedValue)
  if (!text) return '—'
  return text
}
