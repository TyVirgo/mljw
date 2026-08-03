import { getCurrentStudent } from '../mockCurrentStudent.js'
import { whitelistQueue } from './whitelistQueue.js'
import { supplementListQueue } from './supplementListQueue.js'
import { studentConfirmedCourses } from './studentRegistrationStore.js'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import { intakeToGrade, matchScopeRules } from './batchScopeRules.js'

const BLOCKING_ENROLLMENT_STATUSES = new Set([
  'Deferred',
  'Suspended',
  'Withdrawn',
  'Dismissed',
  'Graduated',
])

export function normalizeIntake(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(-4)
  return digits || ''
}

export function getEffectiveEnrollmentStatus(student = getCurrentStudent()) {
  const logs = student?.statusLogs || []
  if (!logs.length) return student?.enrollment?.status || 'Active'
  const now = new Date()
  const sorted = [...logs]
    .filter((item) => item.dateEffective)
    .sort((a, b) => new Date(b.dateEffective) - new Date(a.dateEffective))
  for (const log of sorted) {
    if (new Date(log.dateEffective) <= now) return log.status
  }
  return student?.enrollment?.status || 'Active'
}

export function parseScopeEntry(entry) {
  const [programme, intake] = String(entry || '').split('×').map((part) => part.trim())
  return { programme, intake }
}

function intakeMatches(scopeIntake, studentIntake) {
  if (!scopeIntake || scopeIntake === 'All') return true
  if (!studentIntake) return false
  return studentIntake === scopeIntake || studentIntake.endsWith(scopeIntake) || scopeIntake.endsWith(studentIntake)
}

function matchLegacyProgrammeIntakeScope(batch, profileFields) {
  if (!batch?.scope?.length) return true
  return batch.scope.some((entry) => {
    const { programme, intake } = parseScopeEntry(entry)
    const programmeMatch =
      programme === 'All Programmes' ||
      programme === 'All' ||
      programme === profileFields.programme
    return programmeMatch && intakeMatches(intake, profileFields.intake)
  })
}

export function matchBatchScope(batch, profileFields, options = {}) {
  if (options.inSupplementList) return true
  if (Array.isArray(batch?.scopeRules) && batch.scopeRules.length) {
    return matchScopeRules(batch.scopeRules, profileFields, options.roundKey || '')
  }
  if (!batch?.scope?.length) return true
  return matchLegacyProgrammeIntakeScope(batch, profileFields)
}

function academicSessionToIntakeKey(session) {
  const match = String(session || '').match(/^(\d{4})\/(\d{2})$/)
  if (!match) return ''
  return `${match[1].slice(2)}${match[2]}`
}

export function deriveStudentType(profileFields, batch) {
  const batchIntake = academicSessionToIntakeKey(batch?.academicSession || batch?.semester)
  return profileFields.intake === batchIntake ? 'freshman' : 'senior'
}

export function getStudentPassedCourseCodes(studentId, profileFields) {
  const codes = new Set()
  for (const item of studentConfirmedCourses.value) {
    if (item.courseCode) codes.add(item.courseCode)
  }
  const monitorRow = registrationMonitorQueue.value.find((row) => row.studentId === studentId)
  if (monitorRow?.passedCourses?.length) {
    for (const code of monitorRow.passedCourses) codes.add(code)
  }
  if (profileFields?.passedCourses?.length) {
    for (const code of profileFields.passedCourses) codes.add(code)
  }
  return codes
}

export function getStudentFailedCourseCodes(studentId, profileFields) {
  const codes = new Set()
  const monitorRow = registrationMonitorQueue.value.find((row) => row.studentId === studentId)
  if (monitorRow?.failedCourses?.length) {
    for (const code of monitorRow.failedCourses) codes.add(code)
  }
  if (profileFields?.failedCourses?.length) {
    for (const code of profileFields.failedCourses) codes.add(code)
  }
  return codes
}

function hasApprovedPrerequisiteException(studentId, courseCode) {
  return whitelistQueue.value.some(
    (item) =>
      item.studentId === studentId &&
      item.type === 'prerequisiteException' &&
      item.courseCode === courseCode &&
      item.status === 'boaApproved',
  )
}

function getSupplementEntry(studentId) {
  return supplementListQueue.value.find((item) => item.studentId === studentId) || null
}

export function buildEligibilityContext(student = getCurrentStudent(), batch = null, options = {}) {
  const basic = student?.basicInfo || {}
  const enrollment = student?.enrollment || {}
  const studentId = basic.studentId || ''
  const profileFields = {
    studentId,
    studentName: basic.fullName || basic.chineseName || '',
    programme: enrollment.programmeCode || 'SWE',
    intake: normalizeIntake(enrollment.intake || enrollment.academicSession),
    faculty: enrollment.faculty || '',
    grade: intakeToGrade(enrollment.intake || enrollment.academicSession),
    groupName: enrollment.groupName || enrollment.adminClass || '',
    nationality: basic.nationality || '',
    passedCourses: [],
  }
  const enrollmentStatus = getEffectiveEnrollmentStatus(student)
  const supplementEntry = getSupplementEntry(studentId)
  const monitorRow = registrationMonitorQueue.value.find((row) => row.studentId === studentId)
  const studentType = monitorRow?.tags?.includes('freshman')
    ? 'freshman'
    : monitorRow?.tags?.includes('senior')
      ? 'senior'
      : deriveStudentType(profileFields, batch)

  return {
    studentId,
    profileFields,
    enrollmentStatus,
    studentType,
    passedCodes: getStudentPassedCourseCodes(studentId, profileFields),
    failedCodes: getStudentFailedCourseCodes(studentId, profileFields),
    inSupplementList: Boolean(supplementEntry),
    bypassPrerequisite: Boolean(supplementEntry?.bypassPrerequisite),
    batch,
    roundKey: options.roundKey || '',
  }
}

function checkPrerequisites(course, context) {
  const required = course.prerequisites || []
  if (!required.length) return { ok: true, missing: [], failed: [] }
  if (context.bypassPrerequisite) return { ok: true, missing: [], failed: [], bypassed: true }
  if (hasApprovedPrerequisiteException(context.studentId, course.code)) {
    return { ok: true, missing: [], failed: [], bypassed: true }
  }
  const failedCodes = context.failedCodes || new Set()
  const passedCodes = context.passedCodes || new Set()
  const failed = required.filter((code) => failedCodes.has(code))
  const missing = required.filter((code) => !passedCodes.has(code) && !failedCodes.has(code))
  return { ok: missing.length === 0 && failed.length === 0, missing, failed }
}

function checkAudience(course, context) {
  const audience = course.audience
  if (!audience) return { ok: true }
  const { programmes, intakes, studentTypes, nationalities } = audience
  if (programmes?.length && !programmes.includes(context.profileFields.programme)) {
    return { ok: false, reasonKey: 'courseRegistration.eligibility.programmeRestricted' }
  }
  if (intakes?.length && !intakes.includes(context.profileFields.intake)) {
    return { ok: false, reasonKey: 'courseRegistration.eligibility.intakeRestricted' }
  }
  if (studentTypes?.length && !studentTypes.includes(context.studentType)) {
    return { ok: false, reasonKey: 'courseRegistration.eligibility.studentTypeRestricted' }
  }
  if (nationalities?.length && !nationalities.includes(context.profileFields.nationality)) {
    return { ok: false, reasonKey: 'courseRegistration.eligibility.nationalityRestricted' }
  }
  return { ok: true }
}

export function evaluateCourseEligibility(course, context) {
  const reasons = []
  let eligible = true

  if (BLOCKING_ENROLLMENT_STATUSES.has(context.enrollmentStatus)) {
    if (!(context.inSupplementList && context.enrollmentStatus === 'Deferred')) {
      eligible = false
      reasons.push({
        key: 'courseRegistration.eligibility.enrollmentInactive',
        params: { status: context.enrollmentStatus },
      })
    }
  }

  if (context.batch && !matchBatchScope(context.batch, context.profileFields, context)) {
    eligible = false
    reasons.push({ key: 'courseRegistration.eligibility.outOfBatchScope' })
  }

  const audience = checkAudience(course, context)
  if (!audience.ok) {
    eligible = false
    reasons.push({ key: audience.reasonKey })
  }

  if (context.passedCodes.has(course.code)) {
    eligible = false
    reasons.push({ key: 'courseRegistration.eligibility.alreadyCompleted' })
  }

  const prereq = checkPrerequisites(course, context)
  if (!prereq.ok) {
    eligible = false
    if (prereq.failed?.length) {
      reasons.push({
        key: 'courseRegistration.eligibility.prerequisiteFailed',
        params: { courses: prereq.failed.join(', ') },
      })
    }
    if (prereq.missing?.length) {
      reasons.push({
        key: 'courseRegistration.eligibility.prerequisiteNotTaken',
        params: { courses: prereq.missing.join(', ') },
      })
    }
  }

  return {
    eligible,
    reasons,
    primaryReasonKey: reasons[0]?.key,
    primaryReasonParams: reasons[0]?.params,
    prerequisiteBypassed: Boolean(prereq.bypassed),
  }
}

export function attachEligibilityToCourses(courses, context) {
  return courses.map((course) => {
    const eligibility = evaluateCourseEligibility(course, context)
    return { ...course, eligibility }
  })
}

export function filterCoursesByEligibility(courses, { eligibleOnly = false } = {}) {
  if (!eligibleOnly) return courses
  return courses.filter((item) => item.eligibility?.eligible)
}
