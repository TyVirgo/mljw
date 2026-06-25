import {

  formatAcademicSession,

  initialSemesterRecords,

} from './semesterInfo.js'

import { normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'



export function getCurrentApplicationSession(records = initialSemesterRecords) {

  const current = records.find((r) => r.currentSemester === 'Yes')

  if (!current) return ''

  return formatAcademicSession(current.academicYear, current.semester)

}



/** §16：选学生后从 enrollment.intake 写入 applicationSession */

export function resolveApplicationSessionFromStudent(student) {

  if (!student) return ''

  const enrollment = student.enrollment || {}

  const intake = String(enrollment.intake ?? student.intake ?? '').trim()

  const normalized = normalizeAcademicSession(intake)

  return normalized === '—' ? '' : normalized

}



export function resolveApplicationSessionForDisplay(item) {

  const fromField = normalizeAcademicSession(item?.applicationSession)

  if (fromField !== '—') return fromField

  const fromIntake = normalizeAcademicSession(item?.intake || item?.originalIntake || '')

  return fromIntake

}



export function formatApplicationSessionField(value) {

  return normalizeAcademicSession(value)

}


