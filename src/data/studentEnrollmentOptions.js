import {
  programmeCatalogue,
  initialProgrammeIntakes,
  getActiveIntakeOptions,
  startingSemesterOptions,
} from './programmeIntakes.js'
import { normalizeConsentProgrammeLevel } from './consentForms.js'
import { findProgrammeByCode } from './programmeVersions.js'
import { parseIntakeBatch, formatIntakeBatch } from './intakeSets.js'
import { initialSemesterRecords, formatAcademicSession } from './semesterInfo.js'

/** 与培养方案「层次」下拉一致：预科 / 本科 / 研究生 */
export const enrollmentLevelOfStudyOptions = ['Foundation', 'Undergraduate', 'Postgraduate']

function enrichProgrammeIntake(item) {
  const catalogue = programmeCatalogue.find((row) => row.programmeCode === item.programmeCode)
  const catalogueLevel = catalogue?.level || ''
  return {
    ...item,
    catalogueLevel,
    levelOfStudy: normalizeConsentProgrammeLevel(catalogueLevel),
  }
}

function getEnrichedIntakes(activeOnly = true) {
  return initialProgrammeIntakes
    .filter((item) => !activeOnly || item.active === 'Yes')
    .map(enrichProgrammeIntake)
}

function normalizeLevelOfStudy(value) {
  return normalizeConsentProgrammeLevel(value)
}

export function semesterFromStartingSession(startingSemester) {
  const value = String(startingSemester || '').trim()
  const parts = value.split('/')
  if (parts.length >= 2) return parts[1]
  return ''
}

function compareAcademicSessions(a, b) {
  const parsedA = parseIntakeBatch(a)
  const parsedB = parseIntakeBatch(b)
  if (!parsedA || !parsedB) return String(a).localeCompare(String(b))
  const yearDiff = parseInt(parsedA.year, 10) - parseInt(parsedB.year, 10)
  if (yearDiff !== 0) return yearDiff
  return parseInt(parsedA.month, 10) - parseInt(parsedB.month, 10)
}

export function buildAcademicSessionTimeline(records = initialSemesterRecords) {
  const seen = new Set()
  const options = []
  const add = (value) => {
    const formatted = formatIntakeBatch(value)
    if (formatted && !seen.has(formatted)) {
      seen.add(formatted)
      options.push(formatted)
    }
  }
  records.forEach((record) => {
    add(formatAcademicSession(record.academicYear, record.semester))
  })
  getActiveIntakeOptions().forEach(add)
  return options.sort(compareAcademicSessions)
}

const SEMESTER_MONTHS = ['02', '04', '09']

function getSemesterCycleFromIntakeMonth(intakeMonth) {
  const month = String(intakeMonth || '').trim()
  const startIdx = SEMESTER_MONTHS.indexOf(month)
  if (startIdx === -1) return SEMESTER_MONTHS
  return [...SEMESTER_MONTHS.slice(startIdx), ...SEMESTER_MONTHS.slice(0, startIdx)]
}

/**
 * 以入学批次月份为第 1 学期，在 02→04→09 周期内循环（最大 3），
 * 跨年后回到入学批次月则重置为 1。例：入学 04 → 04=1，09=2，02=3，次年 04=1
 */
export function computeEnrollmentSemesterOrdinal(registrationTime, academicSession) {
  const regParsed = parseIntakeBatch(registrationTime)
  const sessionParsed = parseIntakeBatch(academicSession)
  if (!regParsed || !sessionParsed) return ''
  const cycle = getSemesterCycleFromIntakeMonth(regParsed.month)
  const position = cycle.indexOf(sessionParsed.month)
  if (position === -1) return ''
  return String(position + 1)
}

export function isAcademicSessionOnOrAfterIntake(academicSession, intake) {
  const session = formatIntakeBatch(academicSession)
  const minIntake = formatIntakeBatch(intake)
  if (!session || !minIntake) return true
  return compareAcademicSessions(session, minIntake) >= 0
}

export function getEnrollmentAcademicSessionOptionsFromIntake(intake) {
  const minIntake = formatIntakeBatch(intake)
  const options = getEnrollmentAcademicSessionOptions()
  if (!minIntake) return options
  return options.filter((session) => compareAcademicSessions(session, minIntake) >= 0)
}

export function clampEnrollmentAcademicSession(enrollment) {
  if (!enrollment) return
  const intake = formatIntakeBatch(enrollment.intake)
  const session = formatIntakeBatch(enrollment.academicSession)
  if (intake && session && compareAcademicSessions(session, intake) < 0) {
    enrollment.academicSession = intake
  }
}

function programmeShortName(programme) {
  const name = String(programme?.name || '').trim()
  if (!name) return String(programme?.code || '').trim()
  return name
    .replace(/^Bachelor of /i, '')
    .replace(/^Bachelor in /i, '')
    .replace(/ \(Honours\)$/i, '')
    .trim()
}

function formatIntakeBatchPeriod(intake) {
  const parsed = parseIntakeBatch(formatIntakeBatch(intake))
  if (!parsed) return ''
  return `${parsed.year}${parsed.month}`
}

export function formatEnrollmentProgrammeStructure(programmeCode, intake, programmeName) {
  const programme = findProgrammeByCode(programmeCode)
  const shortName = programme
    ? programmeShortName(programme)
    : programmeShortName({ name: programmeName })
  if (!shortName) return ''
  const intakePeriod = formatIntakeBatchPeriod(intake)
  if (!intakePeriod) return `Programme Structure of ${shortName}`
  return `Programme Structure of ${shortName} (${intakePeriod} Version)`
}

/** 预计完成/毕业批次：年 = intake 年 + 学制，月 = intake 月 − 1（如 09→08） */
export function computeExpectedCompletionBatch(intake, years) {
  const parsed = parseIntakeBatch(intake)
  const yearCount = parseInt(String(years ?? '').trim(), 10)
  if (!parsed || !Number.isFinite(yearCount) || yearCount < 0) return ''
  let year = parseInt(parsed.year, 10) + yearCount
  let month = parseInt(parsed.month, 10) - 1
  if (month < 1) {
    month = 12
    year -= 1
  }
  return `${year}/${String(month).padStart(2, '0')}`
}

/** @deprecated use computeExpectedCompletionBatch */
export function computeIntakeBatchAfterYears(intake, years) {
  return computeExpectedCompletionBatch(intake, years)
}

export function resolveExpectedBatches(intake, years) {
  const intakeValue = formatIntakeBatch(intake)
  if (!intakeValue) {
    return { expectedCompletionBatch: '', expectedGraduationBatch: '' }
  }
  const expectedCompletionBatch = computeExpectedCompletionBatch(intakeValue, years)
  return {
    expectedCompletionBatch,
    expectedGraduationBatch: expectedCompletionBatch,
  }
}

export function syncEnrollmentDerivedScheduleFields(enrollment) {
  if (!enrollment) return
  const batches = resolveExpectedBatches(enrollment.intake, enrollment.duration)
  enrollment.expectedCompletionBatch = batches.expectedCompletionBatch
  enrollment.expectedGraduationBatch = batches.expectedGraduationBatch
  clampEnrollmentAcademicSession(enrollment)
  const enrollmentStart = formatIntakeBatch(enrollment.registrationTime || enrollment.intake)
  enrollment.semester = computeEnrollmentSemesterOrdinal(enrollmentStart, enrollment.academicSession)
}

export function syncRegistrationTimeWithIntake(enrollment) {
  if (!enrollment) return
  enrollment.registrationTime = enrollment.intake ? formatIntakeBatch(enrollment.intake) : ''
}

/** @deprecated use resolveExpectedBatches */
export function resolveEnrollmentScheduleFields(intake, years) {
  const intakeValue = formatIntakeBatch(intake)
  return {
    registrationTime: intakeValue,
    ...resolveExpectedBatches(intakeValue, years),
  }
}

export function getEnrollmentProgrammeLevelOptions() {
  return [...enrollmentLevelOfStudyOptions]
}

export function getEnrollmentFacultyOptions(programmeLevel) {
  const level = normalizeLevelOfStudy(programmeLevel)
  if (!level) return []
  const schools = getEnrichedIntakes(true)
    .filter((item) => item.levelOfStudy === level)
    .map((item) => item.school)
  return [...new Set(schools.filter(Boolean))].sort()
}

function programmeOptionLabel(item, showIntakeSuffix) {
  if (showIntakeSuffix) return `${item.programmeName} (${item.intake})`
  return item.programmeName
}

function buildEnrollmentProgrammePickerOptions(items) {
  const sorted = [...items].sort((a, b) => {
    const nameCmp = a.programmeName.localeCompare(b.programmeName)
    if (nameCmp !== 0) return nameCmp
    return String(b.intake).localeCompare(String(a.intake))
  })

  const nameCounts = sorted.reduce((acc, item) => {
    acc[item.programmeName] = (acc[item.programmeName] || 0) + 1
    return acc
  }, {})

  return sorted.map((item) => ({
    value: item.programmeIntake,
    label: programmeOptionLabel(item, nameCounts[item.programmeName] > 1),
    record: item,
  }))
}

/** 学籍 Tab 专业优先：全部活跃 programme intake，不按层次/学院过滤 */
export function getEnrollmentAllProgrammeOptions() {
  return buildEnrollmentProgrammePickerOptions(getEnrichedIntakes(true))
}

export function getEnrollmentProgrammeOptions(programmeLevel, faculty) {
  const level = normalizeLevelOfStudy(programmeLevel)
  const school = String(faculty || '').trim()
  if (!level || !school) return []

  const filtered = getEnrichedIntakes(true).filter(
    (item) => item.levelOfStudy === level && item.school === school,
  )

  return buildEnrollmentProgrammePickerOptions(filtered)
}

export function resolveEnrollmentByProgrammeIntakeKey(programmeIntakeKey) {
  const key = String(programmeIntakeKey || '').trim()
  if (!key) return null

  const item = getEnrichedIntakes(false).find((row) => row.programmeIntake === key)
  if (!item) return null

  return {
    programmeIntakeKey: item.programmeIntake,
    programmeCode: item.programmeCode,
    programme: item.programmeName,
    faculty: item.school,
    programmeLevel: item.levelOfStudy,
    programmeStructure: formatEnrollmentProgrammeStructure(
      item.programmeCode,
      item.intake,
      item.programmeName,
    ),
    duration: item.years != null ? String(item.years) : '',
    defaultIntake: formatIntakeBatch(item.intake),
    defaultAcademicSession: item.startingSemester || '',
  }
}

export function inferProgrammeIntakeKeyFromEnrollment(enrollment) {
  if (!enrollment) return ''

  const storedKey = String(enrollment.programmeIntakeKey || '').trim()
  if (storedKey && getEnrichedIntakes(false).some((item) => item.programmeIntake === storedKey)) {
    return storedKey
  }

  const programmeCode = String(enrollment.programmeCode || '').trim()
  const intake = String(enrollment.intake || '').trim()
  const faculty = String(enrollment.faculty || '').trim()
  const programmeLevel = normalizeLevelOfStudy(enrollment.programmeLevel)
  const programme = String(enrollment.programme || '').trim()

  const candidates = getEnrichedIntakes(false).filter((item) => {
    if (programmeCode && item.programmeCode !== programmeCode) return false
    if (intake && item.intake !== intake) return false
    if (faculty && item.school !== faculty) return false
    if (programmeLevel && item.levelOfStudy !== programmeLevel) return false
    if (programme && item.programmeName !== programme) return false
    return true
  })

  if (candidates.length === 1) return candidates[0].programmeIntake

  const activeMatch = candidates.find((item) => item.active === 'Yes')
  if (activeMatch) return activeMatch.programmeIntake

  return candidates[0]?.programmeIntake || ''
}

export function normalizeEnrollmentProgrammeLevel(value) {
  return normalizeLevelOfStudy(value)
}

/** @deprecated use resolveEnrollmentByProgrammeIntakeKey */
export function getEnrollmentProgrammeNameOptions() {
  return [...new Set(programmeCatalogue.map((item) => item.programmeName))].sort()
}

/** @deprecated cascade uses programme intake batches */
export function getEnrollmentIntakeOptions() {
  return getActiveIntakeOptions().sort(compareAcademicSessions)
}

export function getEnrollmentAcademicSessionOptions() {
  return [...startingSemesterOptions].sort(compareAcademicSessions)
}

/** @deprecated use resolveEnrollmentByProgrammeIntakeKey */
export function resolveEnrollmentByProgrammeName(programmeName) {
  const name = String(programmeName || '').trim()
  if (!name) return null
  const item = programmeCatalogue.find((row) => row.programmeName === name)
  if (!item) return null
  return {
    programmeCode: item.programmeCode,
    programme: item.programmeName,
    faculty: item.school,
    programmeLevel: normalizeConsentProgrammeLevel(item.level || ''),
    duration: item.years != null ? String(item.years) : '',
  }
}
