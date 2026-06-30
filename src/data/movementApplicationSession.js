import {
  formatAcademicSession,
  initialSemesterRecords,
} from './semesterInfo.js'
import { normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'
import { parseDdMmYyyy } from './universityInfo.js'



export function getCurrentApplicationSession(records = initialSemesterRecords) {
  const current = records.find((r) => r.currentSemester === 'Yes')
  if (!current) return ''
  return formatAcademicSession(current.academicYear, current.semester)
}

/** §11：按日历日期推导学年学期（semesterInfo 区间优先，否则 snapCalendarMonth） */
export function resolveAcademicSessionFromDate(date = new Date(), records = initialSemesterRecords) {
  const target = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(target.getTime())) return ''

  for (const record of records) {
    const start = parseDdMmYyyy(record.startDate)
    const end = parseDdMmYyyy(record.endDate)
    if (!start || !end) continue
    const time = target.getTime()
    if (time >= start.getTime() && time <= end.getTime()) {
      return formatAcademicSession(record.academicYear, record.semester)
    }
  }

  const iso = target.toISOString().slice(0, 10)
  const normalized = normalizeAcademicSession(iso)
  return normalized === '—' ? '' : normalized
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


