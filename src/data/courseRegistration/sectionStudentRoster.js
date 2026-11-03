/**
 * 课程班学生名单查询：一人一行·一课班（演示）
 */

import { ref } from 'vue'
import { selectableCourses } from './selectableCourses.js'
import { listAdminAddStudentCandidates } from './registrationResult.js'
import { getBatchById } from './registrationBatches.js'
import { formatIntakeBatch } from '../intakeSets.js'
import {
  formatClassTimeVenueLine,
  getSectionMeetings,
  displayClassTimeVenueLines,
} from './sectionScheduleFields.js'

/** 名单 demo：每课班最多保留时段数，避免时间地点列过宽 */
const ROSTER_DEMO_MAX_MEETINGS = 2
import { STUDY_MODE_KEYS, studyModeLabel } from './studyMode.js'

/** 负责人 demo：短名，避免名单表被撑出横滑 */
const OWNER_POOL = ['Tan P.Q.', 'Erica Seng', 'Ng K.O.', 'AC Lee', 'Ms. Chan']
/** 修读方式 demo：正常为主，间插两种重修 */
const STUDY_MODES = [
  'normal',
  'normal',
  'normal',
  'retakeSameCourse',
  'normal',
  'retakeSameGroup',
  'normal',
]
/** 学籍异动 demo 取值对齐旧导出参考（以 CHS 为主，间插 ENG） */
const MOVEMENT_STATUSES = [
  'CHS',
  'CHS',
  'CHS',
  'CHS',
  'ENG',
  'ENG',
  'ENG',
  'ENG',
  'CHS',
  'CHS',
  'CHS',
  'CHS',
  'CHS',
  'CHS',
  'ENG',
  'CHS',
]

/**
 * 学年学期 → 紧凑码 YYYYMM
 * @param {string} session
 */
export function toCompactSession(session) {
  const s = String(session || '').trim()
  if (/^\d{6}$/.test(s)) return s
  const m = s.match(/^(20\d{2})[\/\-]?(\d{1,2})/)
  if (m) return `${m[1]}${String(m[2]).padStart(2, '0')}`
  return s || ''
}

/**
 * 入学批次 → 紧凑年级码 YYYYMM（展示用）
 * @param {string} intake
 */
export function toCompactIntake(intake) {
  const formatted = formatIntakeBatch(intake) || String(intake || '')
  const m = formatted.match(/^(20\d{2})[\/\-](\d{1,2})/)
  if (m) return `${m[1]}${String(m[2]).padStart(2, '0')}`
  if (/^\d{4}$/.test(String(intake))) {
    // 2409 → 202409
    const raw = String(intake)
    if (raw.length === 4) return `20${raw}`
  }
  return toCompactSession(formatted) || formatted
}

/**
 * 上课时间地点行列表（表格分行用）
 * @param {{ meetings?: object[] }|object} rowOrSection
 * @param {'zh'|'en'|boolean} [locale='zh']
 * @returns {string[]}
 */
export function rosterClassTimeVenueLines(rowOrSection, locale = 'zh') {
  if (Array.isArray(rowOrSection?.meetings) && rowOrSection.meetings.length) {
    return rowOrSection.meetings.map((m) => formatClassTimeVenueLine(m, locale)).filter(Boolean)
  }
  return displayClassTimeVenueLines(rowOrSection, locale)
}

/**
 * 上课时间地点：与在线选课同一套中英文文案，多时段用「; 」拼单行（导出/title）
 * @param {{ meetings?: object[] }|object} rowOrSection
 * @param {'zh'|'en'|boolean} [locale='zh']
 */
export function formatRosterClassTimeVenue(rowOrSection, locale = 'zh') {
  const lines = rosterClassTimeVenueLines(rowOrSection, locale)
  return lines.length ? lines.join('; ') : ''
}

function buildRosterRows() {
  const students = listAdminAddStudentCandidates()
  const courses = selectableCourses.value || []
  const rows = []
  let rosterId = 1011000
  let sectionIdBase = 26000
  let courseIdBase = 600

  const courseIdMap = new Map()
  courses.forEach((c, idx) => {
    courseIdMap.set(c.id || c.code, courseIdBase + idx)
  })

  let sectionSeq = 0
  for (const course of courses) {
    const sections = course.sections?.length ? course.sections : [{ code: '01', lecturer: '' }]
    const batch = getBatchById(course.batchId)
    const academicSession = toCompactSession(batch?.academicSession || '2026/09')
    for (const section of sections) {
      sectionSeq += 1
      const sectionId = sectionIdBase + sectionSeq
      const sectionCode = section.code || '01'
      const sectionName =
        section.name ||
        section.sectionName ||
        `${course.name || course.code}${sectionCode ? ` (${sectionCode})` : ''}`
      const lecturer = section.lecturer || ''
      // demo：最多 2 个时段，减轻时间地点列宽度
      const meetings = getSectionMeetings(section).slice(0, ROSTER_DEMO_MAX_MEETINGS)
      // 每课班挂 2～4 名学生
      const n = 2 + (sectionSeq % 3)
      for (let i = 0; i < n; i += 1) {
        const stu = students[(rosterId + i) % students.length]
        const rowIndex = rows.length
        rosterId += 1
        rows.push({
          id: `ssr-${rosterId}`,
          rosterId,
          sectionId,
          courseId: courseIdMap.get(course.id || course.code) || courseIdBase,
          academicSession,
          courseCode: course.code,
          sectionCode,
          sectionName,
          courseName: course.name || course.code,
          credits: Number(course.credits) || 0,
          studentId: stu.studentId,
          studentName: stu.studentName,
          intake: stu.intake || '2409',
          intakeCompact: toCompactIntake(stu.intake || '2409'),
          programme: stu.programme || '',
          movementStatus: MOVEMENT_STATUSES[rowIndex % MOVEMENT_STATUSES.length],
          studyMode: STUDY_MODES[rowIndex % STUDY_MODES.length],
          lecturers: lecturer,
          meetings,
          owner: OWNER_POOL[rowIndex % OWNER_POOL.length],
          batchId: course.batchId || '',
          batchName: batch?.name || '',
        })
      }
    }
  }
  return rows
}

export const sectionStudentRosterQueue = ref(buildRosterRows())

export function listSectionRosterSessions(rows = sectionStudentRosterQueue.value) {
  return [...new Set(rows.map((r) => r.academicSession).filter(Boolean))].sort().reverse()
}

export function listSectionRosterIntakes(rows = sectionStudentRosterQueue.value) {
  return [...new Set(rows.map((r) => r.intakeCompact).filter(Boolean))].sort().reverse()
}

export function listSectionRosterOwners(rows = sectionStudentRosterQueue.value) {
  return [...new Set(rows.map((r) => r.owner).filter(Boolean))].sort()
}

export function listSectionRosterProgrammes(rows = sectionStudentRosterQueue.value) {
  return [...new Set(rows.map((r) => r.programme).filter(Boolean))].sort()
}

/**
 * 修读方式筛选项（固定三值，不依赖当前页数据）
 * @returns {string[]}
 */
export function listSectionRosterStudyModes() {
  return [...STUDY_MODE_KEYS]
}

/**
 * @param {object[]} rows
 * @param {object} filters
 */
function includesRosterKw(haystack, needle) {
  if (!needle) return true
  return String(haystack || '')
    .toLowerCase()
    .includes(String(needle).toLowerCase())
}

export function filterSectionStudentRoster(rows, filters = {}) {
  let list = [...rows]
  if (filters.academicSession) {
    list = list.filter((r) => r.academicSession === filters.academicSession)
  }
  const courseCode = String(filters.courseCode || '').trim()
  const sectionName = String(filters.sectionName || '').trim()
  const studentId = String(filters.studentId || '').trim()
  const studentName = String(filters.studentName || '').trim()
  // 兼容旧合并关键词
  const courseKeyword = String(filters.courseKeyword || '').trim()
  const studentKeyword = String(filters.studentKeyword || '').trim()

  if (courseCode) {
    list = list.filter((r) => includesRosterKw(r.courseCode, courseCode))
  }
  if (sectionName) {
    list = list.filter(
      (r) => includesRosterKw(r.sectionName, sectionName) || includesRosterKw(r.courseName, sectionName),
    )
  }
  if (courseKeyword && !courseCode && !sectionName) {
    const kw = courseKeyword.toLowerCase()
    list = list.filter(
      (r) =>
        includesRosterKw(r.courseCode, kw) ||
        includesRosterKw(r.sectionName, kw) ||
        includesRosterKw(r.courseName, kw),
    )
  }
  if (studentId) {
    list = list.filter((r) => includesRosterKw(r.studentId, studentId))
  }
  if (studentName) {
    list = list.filter((r) => includesRosterKw(r.studentName, studentName))
  }
  if (studentKeyword && !studentId && !studentName) {
    const kw = studentKeyword.toLowerCase()
    list = list.filter(
      (r) => includesRosterKw(r.studentId, kw) || includesRosterKw(r.studentName, kw),
    )
  }
  if (filters.intake) {
    list = list.filter((r) => r.intakeCompact === filters.intake)
  }
  const owner = String(filters.owner || '').trim()
  if (owner) {
    list = list.filter((r) => includesRosterKw(r.owner, owner))
  }
  if (filters.programme) {
    list = list.filter((r) => r.programme === filters.programme)
  }
  const studyMode = String(filters.studyMode || '').trim()
  if (studyMode) {
    // 精确匹配枚举键（兼容旧 Normal/Retake 模糊）
    list = list.filter((r) => {
      const mode = String(r.studyMode || '').trim()
      if (mode === studyMode) return true
      if (studyMode === 'normal' && mode === 'Normal') return true
      if (studyMode === 'retakeSameCourse' && mode === 'Retake') return true
      return false
    })
  }
  return list
}

export function sumRosterCredits(rows = []) {
  return rows.reduce((sum, r) => sum + (Number(r.credits) || 0), 0)
}

/**
 * 导出行（图示2：两列课程代码同值不同 key，表头文案相同）
 * @param {object} row
 * @param {(key: string) => string} [_t]
 * @param {'zh'|'en'|boolean} [locale='zh']
 */
export function formatSectionStudentRosterExportRow(row, t, locale = 'zh') {
  const courseCode = row.courseCode || ''
  const modeRaw = row.studyMode || ''
  const modeLabel =
    typeof t === 'function' ? studyModeLabel(modeRaw, t) : modeRaw
  return {
    rosterId: row.rosterId ?? '',
    sectionId: row.sectionId ?? '',
    academicSession: row.academicSession || '',
    courseCode,
    sectionName: row.sectionName || '',
    courseId: row.courseId ?? '',
    courseCodeAgain: courseCode,
    courseName: row.courseName || '',
    credits: row.credits ?? '',
    studentId: row.studentId || '',
    studentName: row.studentName || '',
    grade: row.intakeCompact || toCompactIntake(row.intake) || '',
    movementStatus: row.movementStatus || '',
    programme: row.programme || '',
    studyMode: modeLabel,
    lecturers: row.lecturers || '',
    classTimeVenue: formatRosterClassTimeVenue(row, locale),
    owner: row.owner || '',
  }
}
