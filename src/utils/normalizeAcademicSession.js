import { semesterCodeOptions } from '../data/semesterInfo.js'

export const ACADEMIC_SEMESTER_CODES = semesterCodeOptions

const SESSION_PATTERN = /^(\d{4})\/(\d{2})$/
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function snapCalendarMonth(month) {
  const m = Number(month)
  if (m <= 2) return '02'
  if (m <= 8) return '04'
  return '09'
}

export function isValidAcademicSession(value) {
  const normalized = normalizeAcademicSession(value)
  return normalized !== '—'
}

export function normalizeAcademicSession(value) {
  if (value === '' || value == null) return '—'
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '—') return '—'

  const sessionMatch = trimmed.match(SESSION_PATTERN)
  if (sessionMatch) {
    const [, year, month] = sessionMatch
    if (ACADEMIC_SEMESTER_CODES.includes(month)) return `${year}/${month}`
    return `${year}/${snapCalendarMonth(month)}`
  }

  const isoMatch = trimmed.match(ISO_DATE_PATTERN)
  if (isoMatch) {
    const [, year, , month] = isoMatch
    return `${year}/${snapCalendarMonth(month)}`
  }

  const date = new Date(trimmed)
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear()
    const month = snapCalendarMonth(date.getMonth() + 1)
    return `${year}/${month}`
  }

  return '—'
}

export function compareAcademicSession(a, b) {
  const left = normalizeAcademicSession(a)
  const right = normalizeAcademicSession(b)
  if (left === '—' && right === '—') return 0
  if (left === '—') return -1
  if (right === '—') return 1
  const [ay, am] = left.split('/').map(Number)
  const [by, bm] = right.split('/').map(Number)
  if (ay !== by) return ay - by
  return am - bm
}

export function validateAcademicSessionOrder(
  { intake, applicationSession, effectiveSession },
  requireField,
  fieldKeys = {},
) {
  const intakeKey = fieldKeys.intake || 'intake'
  const applicationKey = fieldKeys.applicationSession || 'applicationSession'
  const effectiveKey = fieldKeys.effectiveSession || 'effectiveSession'

  const normalizedIntake = normalizeAcademicSession(intake)
  const normalizedApplication = normalizeAcademicSession(applicationSession)
  const normalizedEffective = normalizeAcademicSession(effectiveSession)

  if (normalizedIntake !== '—' && normalizedApplication !== '—' && compareAcademicSession(normalizedIntake, normalizedApplication) > 0) {
    requireField(applicationKey, 'Application academic session must not be earlier than intake.')
  }
  if (normalizedApplication !== '—' && normalizedEffective !== '—' && compareAcademicSession(normalizedApplication, normalizedEffective) > 0) {
    requireField(effectiveKey, 'Effective session must not be earlier than application academic session.')
  }
  if (normalizedIntake !== '—' && normalizedEffective !== '—' && compareAcademicSession(normalizedIntake, normalizedEffective) > 0) {
    requireField(effectiveKey, 'Effective session must not be earlier than intake.')
  }
}
