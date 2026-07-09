import { ref } from 'vue'
import { initialStudents } from './students.js'

/** Default mock student when not in preview mode. Replace when SSO is integrated. */
export const DEFAULT_MOCK_CURRENT_STUDENT_ID = 'XMUM2309001'

/** @deprecated use DEFAULT_MOCK_CURRENT_STUDENT_ID */
export const MOCK_CURRENT_STUDENT_ID = DEFAULT_MOCK_CURRENT_STUDENT_ID

const currentStudentId = ref(DEFAULT_MOCK_CURRENT_STUDENT_ID)

export function getCurrentStudentId() {
  return currentStudentId.value
}

export function getCurrentStudent() {
  return (
    initialStudents.find((item) => item.studentId === currentStudentId.value) ?? initialStudents[0]
  )
}

export function filterByCurrentStudent(items) {
  const studentId = getCurrentStudent()?.studentId
  if (!studentId) return []
  return items.filter((item) => item.studentId === studentId)
}

export function enterStudentPreview(student) {
  const studentId = String(student?.studentId || student?.basicInfo?.studentId || '').trim()
  if (!studentId) return false
  const exists = initialStudents.some((item) => item.studentId === studentId)
  if (!exists) return false
  currentStudentId.value = studentId
  return true
}
