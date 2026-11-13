/**
 * 学生学术情况（Study Plan）：类别汇总 + 学年学期明细
 * 必修/GE/ME 未修与加退申请「截止到当前学期」基线同源；其余列 demo
 */

import { getCurrentStudentId } from '../mockCurrentStudent.js'
import {
  getProgrammeCreditProgress,
  getStudentMonitorRow,
  sumConfirmedCreditsByKind,
} from './studentRegistrationContext.js'
import {
  buildAddDropTermCreditStrip,
  buildFixedSituationCatchUpFromBaseline,
  normalizeTermCreditStripBaseline,
  DEMO_TERM_MANDATORY_CREDIT_MAX,
} from './addDropMultiItems.js'
import {
  getStudentTranscript,
  formatGradeToZh,
} from './studentTranscript.js'
import {
  getStudentProfileFields,
  studentRequiredCourses,
  getTermElectiveCreditProgress,
} from './studentRegistrationStore.js'
import { getCourseByCode } from './selectableCourses.js'

/**
 * 打开学术情况页时的学分条基线（对齐申请页 live 基线字段，不含表单拟加拟退）
 * @returns {object}
 */
export function buildStudyPlanTermCreditBaseline() {
  const programme = getProgrammeCreditProgress()
  const caps = getTermElectiveCreditProgress()
  const confirmed = sumConfirmedCreditsByKind()
  const mandatorySelected = (studentRequiredCourses.value || []).reduce(
    (sum, item) => sum + (Number(item.credits) || 0),
    0,
  )
  const geCurrent = Number(confirmed.ge) || 0
  const meCurrent = Number(confirmed.me) || 0
  return normalizeTermCreditStripBaseline({
    geCurrent,
    geMax: Number(caps.geMax) || 0,
    meCurrent,
    meMax: Number(caps.meMax) || 0,
    gradGeCurrent: geCurrent,
    gradGeMax: Number(programme.geRequired) || 0,
    gradMeCurrent: meCurrent,
    gradMeMax: Number(programme.meRequired) || 0,
    gradMandatoryCurrent: mandatorySelected,
    gradMandatoryMax: Number(programme.mandatoryRequired) || 0,
    mandatorySelected,
    mandatoryMax: DEMO_TERM_MANDATORY_CREDIT_MAX,
  })
}

/**
 * 图示1：按课程类别汇总（打开时固定）
 * @param {string} [studentId]
 */
export function buildStudyPlanAcademicStatusSummary(studentId = getCurrentStudentId()) {
  const programme = getProgrammeCreditProgress()
  const baseline = buildStudyPlanTermCreditBaseline()
  const catchUp = buildFixedSituationCatchUpFromBaseline(baseline)
  const strip = buildAddDropTermCreditStrip({
    ...baseline,
    dropCourses: [],
    addCourses: [],
  })

  const completedMandatory = Number(programme.mandatoryEarned) || 0
  const completedGe = Number(programme.geEarned) || 0
  const completedMe = Number(programme.meEarned) || 0
  const pendingMandatory = Math.max(0, Number(catchUp.mandatory) || 0)
  const pendingGe = Math.max(0, Number(catchUp.ge) || 0)
  const pendingMe = Math.max(0, Number(catchUp.me) || 0)

  // GE 文/商子列、其它类别：系统无模型，demo 填表（合计与 GE Pending 对齐）
  // demo 刻度对齐申请侧：个位～低十位，避免虚高（如原 Major Core Pending 44 / 最低 150）
  const geBusinessCompleted = Math.min(5, completedGe)
  const geArtsCompleted = Math.max(0, completedGe - geBusinessCompleted)
  const geBusinessPending = pendingGe > 0 ? 1 : 0
  const geArtsPending = Math.max(0, pendingGe - geBusinessPending)

  const demoCommonCoreCompleted = 6
  const demoCommonCorePending = 3
  const demoMajorCoreCompleted = 4
  const demoMajorCorePending = 6
  const demoIndustrialCompleted = 0
  const demoIndustrialPending = 3

  const creditsAttempted =
    completedMandatory +
    completedGe +
    completedMe +
    demoCommonCoreCompleted +
    demoMajorCoreCompleted +
    demoIndustrialCompleted
  const pendingAttempted =
    pendingMandatory +
    pendingGe +
    pendingMe +
    demoCommonCorePending +
    demoMajorCorePending +
    demoIndustrialPending
  // 培养方案最低学分：必修 + GE + ME 要求之和（与 DEMO_PROGRAMME_CREDIT_TARGETS 一致）
  const minRequired =
    (Number(programme.mandatoryRequired) || 0) +
    (Number(programme.geRequired) || 0) +
    (Number(programme.meRequired) || 0)
  const totalEarned = creditsAttempted
  const completionRate = minRequired > 0 ? (totalEarned / minRequired) * 100 : 0

  return {
    studentId,
    snapshotAt: Date.now(),
    /** 与申请 tip 同源，便于核对 */
    catchUp: {
      mandatory: pendingMandatory,
      ge: pendingGe,
      me: pendingMe,
    },
    strip,
    completed: {
      mandatory: completedMandatory,
      geTotal: completedGe,
      geBusiness: geBusinessCompleted,
      geArts: geArtsCompleted,
      commonCore: demoCommonCoreCompleted,
      majorCore: demoMajorCoreCompleted,
      me: completedMe,
      industrial: demoIndustrialCompleted,
      creditsAttempted,
    },
    /** Pending 存正数；UI 展示为负号 */
    pending: {
      mandatory: pendingMandatory,
      geTotal: pendingGe,
      geBusiness: geBusinessPending,
      geArts: geArtsPending,
      commonCore: demoCommonCorePending,
      majorCore: demoMajorCorePending,
      me: pendingMe,
      industrial: demoIndustrialPending,
      creditsAttempted: pendingAttempted,
    },
    minCreditsRequired: minRequired,
    totalCreditsEarned: totalEarned,
    completionRate,
  }
}

/**
 * 成绩单行 → 明细行
 * @param {object} row
 */
function mapTranscriptRowToDetailLine(row) {
  const catalog = getCourseByCode(row.courseCode) || null
  const courseName =
    catalog?.name || row.courseName || row.courseCode || ''
  const grade = String(row.grade || '').trim()
  const isFail =
    grade.toUpperCase() === 'F' ||
    grade.toUpperCase() === 'M' ||
    String(row.status || '').toLowerCase() === 'fail'
  return {
    courseCode: row.courseCode || '',
    courseName,
    credits: Number(row.credits) || 0,
    grade: grade || '—',
    gradeZh: grade ? formatGradeToZh(grade) : '—',
    gradePoint: row.score != null && Number.isFinite(Number(row.score))
      ? null
      : gradePointFromLetter(grade),
    status: isFail ? 'Fail' : 'Pass',
    attemptTimes: row.attemptTimes || '1st',
    remark: row.remark || (isFail ? '' : 'Keep'),
    academicSession: normalizeSessionKey(row.academicSession),
  }
}

/**
 * @param {string} grade
 * @returns {number|null}
 */
function gradePointFromLetter(grade) {
  const map = {
    A: 4,
    'A-': 3.7,
    'B+': 3.3,
    B: 3,
    'B-': 2.7,
    'C+': 2.3,
    C: 2,
    'C-': 1.7,
    D: 1,
    F: null,
    M: null,
  }
  return map[String(grade || '').trim()] ?? null
}

/**
 * @param {string} session
 */
function normalizeSessionKey(session) {
  return String(session || '')
    .trim()
    .replace(/\//g, '')
}

/**
 * 学年标签：按学期码粗分（demo）
 * @param {string} sessionKey 如 202409
 */
function yearLabelForSession(sessionKey) {
  const y = Number(String(sessionKey).slice(0, 4)) || 0
  const m = Number(String(sessionKey).slice(4, 6)) || 0
  if (!y) return 'Year —'
  // 粗略：入学 2022/09 → 2024xx 为 Year 2
  if (y < 2024 || (y === 2024 && m < 9)) return 'Year 1'
  if (y === 2024 || (y === 2025 && m < 9)) return 'Year 2'
  return 'Year 3'
}

/**
 * Demo 补足明细块（图示2 样例学期），避免成绩单过短
 * @returns {object[]}
 */
function buildDemoDetailSupplementLines() {
  return [
    {
      courseCode: 'G0148',
      courseName: 'Car Culture',
      credits: 2,
      grade: 'A',
      gradeZh: formatGradeToZh('A'),
      gradePoint: 4,
      status: 'Pass',
      attemptTimes: '1st',
      remark: 'Keep',
      academicSession: '202402',
    },
    {
      courseCode: 'G0155',
      courseName: 'Cyberpsychology',
      credits: 2,
      grade: 'A-',
      gradeZh: formatGradeToZh('A-'),
      gradePoint: 3.7,
      status: 'Pass',
      attemptTimes: '1st',
      remark: 'Keep',
      academicSession: '202402',
    },
    {
      courseCode: 'FIN206',
      courseName: 'Investment',
      credits: 4,
      grade: 'A-',
      gradeZh: formatGradeToZh('A-'),
      gradePoint: 3.7,
      status: 'Pass',
      attemptTimes: '1st',
      remark: 'Keep',
      academicSession: '202404',
    },
    {
      courseCode: 'IND301',
      courseName: 'Industrial Training',
      credits: 3,
      grade: 'Fail',
      gradeZh: '不及格',
      gradePoint: null,
      status: 'Fail',
      attemptTimes: '1st',
      remark: '',
      academicSession: '202502',
    },
  ]
}

/**
 * 图示2：学年 / 学期课程明细
 * @param {string} [studentId]
 */
export function buildStudyPlanAcademicStatusDetail(studentId = getCurrentStudentId()) {
  const profile = getStudentProfileFields()
  const monitor = getStudentMonitorRow(studentId)
  const transcript = getStudentTranscript(studentId) || []
  const fromTranscript = transcript.map(mapTranscriptRowToDetailLine)
  const codes = new Set(fromTranscript.map((l) => l.courseCode))
  const supplement = buildDemoDetailSupplementLines().filter((l) => !codes.has(l.courseCode))
  const lines = [...fromTranscript, ...supplement]

  /** @type {Map<string, object[]>} */
  const bySession = new Map()
  for (const line of lines) {
    const key = line.academicSession || '—'
    if (!bySession.has(key)) bySession.set(key, [])
    bySession.get(key).push(line)
  }

  const sessions = [...bySession.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([sessionKey, sessionLines]) => {
      const creditSum = sessionLines.reduce((s, l) => s + (Number(l.credits) || 0), 0)
      const points = sessionLines
        .filter((l) => l.gradePoint != null && Number.isFinite(l.gradePoint))
        .map((l) => ({ gp: l.gradePoint, cr: Number(l.credits) || 0 }))
      let gpa = null
      if (points.length) {
        const w = points.reduce((s, p) => s + p.gp * p.cr, 0)
        const c = points.reduce((s, p) => s + p.cr, 0)
        gpa = c > 0 ? Math.round((w / c) * 100) / 100 : null
      }
      return {
        yearLabel: yearLabelForSession(sessionKey),
        academicSession: sessionKey,
        creditSum,
        gpa,
        lines: sessionLines,
      }
    })

  // 按 Year 再分组便于 rowspan
  /** @type {Map<string, object[]>} */
  const byYear = new Map()
  for (const block of sessions) {
    if (!byYear.has(block.yearLabel)) byYear.set(block.yearLabel, [])
    byYear.get(block.yearLabel).push(block)
  }
  const years = [...byYear.entries()].map(([yearLabel, sessionBlocks]) => ({
    yearLabel,
    sessions: sessionBlocks,
  }))

  const creditsEarned = Number(monitor?.credits) || lines
    .filter((l) => l.status === 'Pass')
    .reduce((s, l) => s + (Number(l.credits) || 0), 0)

  return {
    header: {
      studentId: profile.studentId || studentId,
      studentName: profile.studentName || '',
      programme: profile.programmeName || profile.programme || '',
      dateOfAdmission: profile.intake || '202209',
      intake: profile.intake || '',
      latestCgpa: Number(monitor?.cgpa) || 3.56,
      creditsEarned: creditsEarned || 121,
      remark: '—',
    },
    years,
  }
}
