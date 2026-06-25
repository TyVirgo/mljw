import { initialStudents } from './students.js'

/** Mock logged-in student for the student self-service portal. Replace when SSO is integrated. */
export const MOCK_CURRENT_STUDENT_ID = 'XMUM2309001'

export function getCurrentStudent() {
  return (
    initialStudents.find((item) => item.studentId === MOCK_CURRENT_STUDENT_ID) ?? initialStudents[0]
  )
}

export function filterByCurrentStudent(items) {
  const studentId = getCurrentStudent()?.studentId
  if (!studentId) return []
  return items.filter((item) => item.studentId === studentId)
}
