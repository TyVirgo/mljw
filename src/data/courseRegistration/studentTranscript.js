/**
 * 学生往期成绩单 demo（重修申请）
 */

import { getCurrentStudentId } from '../mockCurrentStudent.js'
import { getPreviousAcademicSession } from '../intakeSets.js'

/** 字母成绩 → 约定百分制（无 score 字段时回退；60 及格线） */
const LETTER_GRADE_SCORE = {
  A: 95,
  'A-': 90,
  'B+': 85,
  B: 80,
  'B-': 75,
  'C+': 72,
  C: 70,
  'C-': 65,
  D: 60,
  F: 45,
}

/**
 * @param {string|object|null|undefined} gradeOrRow
 * @returns {number|null} 0–100；缺考无分返回 null
 */
export function resolveGradeScore(gradeOrRow) {
  if (gradeOrRow != null && typeof gradeOrRow === 'object') {
    const s = Number(gradeOrRow.score)
    if (Number.isFinite(s)) return Math.min(100, Math.max(0, s))
    return resolveGradeScore(gradeOrRow.grade)
  }
  const raw = String(gradeOrRow || '').trim()
  if (!raw) return null
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Math.min(100, Math.max(0, Number(raw)))
  }
  if (LETTER_GRADE_SCORE[raw] != null) return LETTER_GRADE_SCORE[raw]
  const upper = raw.toUpperCase()
  if (LETTER_GRADE_SCORE[upper] != null) return LETTER_GRADE_SCORE[upper]
  const norm = raw[0].toUpperCase() + raw.slice(1)
  if (LETTER_GRADE_SCORE[norm] != null) return LETTER_GRADE_SCORE[norm]
  if (upper === 'M') return null
  return null
}

/**
 * 展示用成绩：百分制数字加「分」；缺考显示「缺考」
 * @param {string|object|null|undefined} gradeOrRow
 * @returns {string}
 */
export function formatGradeDisplay(gradeOrRow) {
  if (gradeOrRow != null && typeof gradeOrRow === 'object') {
    const letter = String(gradeOrRow.grade || '').trim().toUpperCase()
    if (letter === 'M' && (gradeOrRow.score == null || gradeOrRow.score === '')) {
      return '缺考'
    }
  } else if (String(gradeOrRow || '').trim().toUpperCase() === 'M') {
    return '缺考'
  }
  const score = resolveGradeScore(gradeOrRow)
  if (score != null) return `${Math.round(score)}分`
  return ''
}

/**
 * @param {string|object|null|undefined} grade
 * @returns {string}
 */
export function formatGradeToZh(grade) {
  return formatGradeDisplay(grade)
}

/**
 * §37：挂科池 / 提升池各 ≥3 门本学期重修课（retakeCourseId）
 * 挂科：ALGO / OS / DB；提升：STAT / ENGL / HUM
 */
const TRANSCRIPT_BY_STUDENT = {
  XMUM2309001: [
    // —— 挂科池（最新 F/M）——
    {
      id: 'tr-algo101-f',
      courseCode: 'ALGO101',
      courseName: 'Algorithms Fundamentals',
      credits: 3,
      grade: 'F',
      score: 41,
      academicSession: '2025/02',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-algo210',
    },
    {
      id: 'tr-algo101-m',
      courseCode: 'ALGO101',
      courseName: 'Algorithms Fundamentals',
      credits: 3,
      grade: 'M',
      academicSession: '2024/09',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-algo210',
    },
    {
      id: 'tr-os101-f',
      courseCode: 'OS101',
      courseName: 'Operating Systems Intro',
      credits: 3,
      grade: 'F',
      score: 35,
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-os210',
    },
    {
      id: 'tr-db101-f',
      courseCode: 'DB101',
      courseName: 'Database Basics',
      credits: 3,
      grade: 'F',
      score: 48,
      academicSession: '2025/02',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-db110',
    },
    {
      id: 'tr-se201-m',
      courseCode: 'SE201',
      courseName: 'Intro to Software Engineering',
      credits: 3,
      grade: 'M',
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-se201',
    },
    {
      id: 'tr-web210-f',
      courseCode: 'WEB210',
      courseName: 'Web Development',
      credits: 3,
      grade: 'F',
      score: 42,
      academicSession: '2025/02',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-web210',
    },
    // —— GE 挂科池（不及格重修 · 公共选修）——
    {
      id: 'tr-sci110-f',
      courseCode: 'SCI110',
      courseName: 'Scientific Reasoning',
      credits: 3,
      grade: 'F',
      score: 38,
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'GE',
      g1Category: 'Science',
      schoolElectiveCategory: 'science',
      retakeCourseId: 'course-sci110',
    },
    {
      id: 'tr-sci110-d',
      courseCode: 'SCI110',
      courseName: 'Scientific Reasoning',
      credits: 3,
      grade: 'D',
      score: 58,
      academicSession: '2024/09',
      feeStream: 'science',
      type: 'GE',
      g1Category: 'Science',
      schoolElectiveCategory: 'science',
      retakeCourseId: 'course-sci110',
    },
    {
      id: 'tr-fin110-f',
      courseCode: 'FIN110',
      courseName: 'Personal Finance Literacy',
      credits: 3,
      grade: 'F',
      score: 47,
      academicSession: '2025/02',
      feeStream: 'business',
      type: 'GE',
      g1Category: 'Business',
      schoolElectiveCategory: 'business',
      retakeCourseId: 'course-fin110',
    },
    // —— 必修同课重修（仅同课，无组内替代；与我的课表必修同源）——
    {
      id: 'tr-math101-f',
      courseCode: 'MATH101',
      courseName: 'Calculus I',
      credits: 4,
      grade: 'F',
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'CORE',
      sourceType: 'required',
      retakeCourseId: 'course-math101',
    },
    {
      id: 'tr-phys101-f',
      courseCode: 'PHYS101',
      courseName: 'Physics for Engineers',
      credits: 3,
      grade: 'F',
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'CORE',
      sourceType: 'required',
      retakeCourseId: 'course-phys101',
    },
    {
      id: 'tr-phys101-d',
      courseCode: 'PHYS101',
      courseName: 'Physics for Engineers',
      credits: 3,
      grade: 'D',
      academicSession: '2025/02',
      feeStream: 'science',
      type: 'CORE',
      sourceType: 'required',
      retakeCourseId: 'course-phys101',
    },
    // —— 提升池（及格，含 60；必修 / GE / ME 均有）——
    {
      id: 'tr-int300-b',
      courseCode: 'INT300',
      courseName: 'Professional Internship',
      credits: 2,
      grade: 'B',
      score: 78,
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'CORE',
      sourceType: 'required',
      retakeCourseId: 'course-int300',
    },
    {
      id: 'tr-int300-c',
      courseCode: 'INT300',
      courseName: 'Professional Internship',
      credits: 2,
      grade: 'C',
      score: 68,
      academicSession: '2024/09',
      feeStream: 'science',
      type: 'CORE',
      sourceType: 'required',
      retakeCourseId: 'course-int300',
    },
    {
      id: 'tr-stat201-c',
      courseCode: 'STAT201',
      courseName: 'Probability & Statistics',
      credits: 3,
      grade: 'C',
      score: 70,
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-stat201',
    },
    {
      id: 'tr-stat201-d',
      courseCode: 'STAT201',
      courseName: 'Probability & Statistics',
      credits: 3,
      grade: 'D',
      academicSession: '2024/09',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-stat201',
    },
    {
      id: 'tr-engl201-b',
      courseCode: 'ENGL201',
      courseName: 'Academic Writing',
      credits: 3,
      grade: 'B',
      academicSession: '2025/04',
      feeStream: 'arts',
      type: 'GE',
      g1Category: 'Humanities',
      retakeCourseId: 'course-engl201',
    },
    {
      id: 'tr-engl201-b-',
      courseCode: 'ENGL201',
      courseName: 'Academic Writing',
      credits: 3,
      grade: 'B-',
      academicSession: '2024/04',
      feeStream: 'arts',
      type: 'GE',
      g1Category: 'Humanities',
      retakeCourseId: 'course-engl201',
    },
    {
      id: 'tr-hum110-c',
      courseCode: 'HUM110',
      courseName: 'Introduction to Humanities',
      credits: 3,
      grade: 'C',
      academicSession: '2025/02',
      feeStream: 'arts',
      type: 'GE',
      g1Category: 'Humanities',
      retakeCourseId: 'course-hum110',
    },
    {
      id: 'tr-comp201-b',
      courseCode: 'COMP201',
      courseName: 'Data Structures',
      credits: 4,
      grade: 'B',
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'ME',
      sectionCode: '02',
      retakeCourseId: 'course-comp201',
    },
    {
      id: 'tr-math201-c',
      courseCode: 'MATH201',
      courseName: 'Linear Algebra',
      credits: 4,
      grade: 'C',
      academicSession: '2025/02',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-math201',
    },
    {
      id: 'tr-phys101-d',
      courseCode: 'PHYS101',
      courseName: 'Physics I',
      credits: 4,
      grade: 'D',
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-phys101',
    },
    {
      id: 'tr-bus201-b',
      courseCode: 'BUS201',
      courseName: 'Business Ethics',
      credits: 3,
      grade: 'B',
      academicSession: '2025/02',
      feeStream: 'business',
      type: 'GE',
      g1Category: 'Business',
      retakeCourseId: 'course-bus201',
    },
    {
      id: 'tr-ai110-c',
      courseCode: 'AI110',
      courseName: 'Introduction to AI',
      credits: 3,
      grade: 'C',
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-ai110',
    },
    {
      id: 'tr-ge201-b',
      courseCode: 'GE201',
      courseName: 'Critical Thinking',
      credits: 2,
      grade: 'B',
      academicSession: '2025/02',
      feeStream: 'arts',
      type: 'GE',
      g1Category: 'Humanities',
      retakeCourseId: 'course-ge201',
    },
    {
      id: 'tr-emb210-c',
      courseCode: 'EMB210',
      courseName: 'Embedded Systems',
      credits: 3,
      grade: 'C',
      academicSession: '2025/04',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-emb210',
    },
  ],
}

const DEFAULT_TRANSCRIPT = TRANSCRIPT_BY_STUDENT.XMUM2309001

/**
 * @param {string} [studentId]
 */
export function getStudentTranscript(studentId = getCurrentStudentId()) {
  const rows = TRANSCRIPT_BY_STUDENT[studentId] || DEFAULT_TRANSCRIPT
  // 未标注教学班的 demo 履历默认挂 01，避免曾修列按课复用到全部分组
  return rows.map((row) => ({
    ...row,
    sectionCode: String(row.sectionCode || '01').trim(),
  }))
}

/**
 * 曾修履历按教学班过滤：无分组码则不展示
 * @param {object[]} rows
 * @param {object} [section]
 * @returns {object[]}
 */
export function filterTranscriptRowsForSection(rows, section) {
  const code = String(section?.code || '').trim()
  const id = String(section?.id || '').trim()
  if (!code && !id) return []
  return (rows || []).filter((row) => {
    const sc = String(row.sectionCode || '').trim()
    const sid = String(row.sectionId || '').trim()
    if (!sc && !sid) return false
    return (sc && sc === code) || (sid && sid === id)
  })
}

/** 不及格 / 缺考 → 挂科重修；及格 → 刷分 */
export function defaultRetakeTypeFromGrade(grade) {
  return isFailingGrade(grade) ? 'failed' : 'improve_grade'
}

/**
 * @param {string|object|null|undefined} gradeOrRow
 * @returns {boolean}
 */
export function isFailingGrade(gradeOrRow) {
  const score = resolveGradeScore(gradeOrRow)
  if (score != null) return score < 60
  const g =
    gradeOrRow != null && typeof gradeOrRow === 'object'
      ? String(gradeOrRow.grade || '').toUpperCase()
      : String(gradeOrRow || '').toUpperCase()
  return g === 'F' || g === 'M'
}

/**
 * 按课取成绩单最新一条，再按重修类型分池
 * @param {'failed'|'improve_grade'|string} retakeType
 * @param {string} [studentId]
 * @returns {object[]} transcript rows（每门课一条最新）
 */
export function listTranscriptLatestByRetakeType(
  retakeType,
  studentId = getCurrentStudentId(),
) {
  const wantFailed = retakeType === 'failed'
  if (retakeType !== 'failed' && retakeType !== 'improve_grade') return []

  const latestByKey = new Map()
  for (const row of getStudentTranscript(studentId)) {
    const key = row.retakeCourseId || row.courseCode
    if (!key) continue
    const prev = latestByKey.get(key)
    if (
      !prev ||
      String(row.academicSession || '').localeCompare(String(prev.academicSession || '')) > 0
    ) {
      latestByKey.set(key, row)
    }
  }

  return [...latestByKey.values()].filter((row) => {
    const failing = isFailingGrade(row)
    return wantFailed ? failing : !failing
  })
}

/**
 * 重修选课候选课程 id（本学期开课 id）
 * @param {'failed'|'improve_grade'|string} retakeType
 * @param {string} [studentId]
 * @returns {string[]}
 */
export function listRetakeCourseIdsByType(retakeType, studentId = getCurrentStudentId()) {
  return listTranscriptLatestByRetakeType(retakeType, studentId)
    .map((r) => r.retakeCourseId)
    .filter(Boolean)
}

/**
 * 按本学期重修课匹配往期成绩单全部记录（学年学期从新到旧）
 * @param {string} courseIdOrCode 课程 id 或课号
 * @param {string} [studentId]
 * @param {object|null} [course] 可选，用于课号兜底匹配
 * @returns {object[]}
 */
export function listTranscriptForRetakeCourse(
  courseIdOrCode,
  studentId = getCurrentStudentId(),
  course = null,
) {
  if (!courseIdOrCode && !course) return []
  const id = String(courseIdOrCode || course?.id || '').trim()
  const code = String(course?.code || '').trim()
  return getStudentTranscript(studentId)
    .filter((row) => {
      if (id && row.retakeCourseId === id) return true
      if (id && row.courseCode === id) return true
      if (code && row.courseCode === code) return true
      if (code && row.retakeCourseId === course?.id) return true
      return false
    })
    .slice()
    .sort((a, b) => String(b.academicSession || '').localeCompare(String(a.academicSession || '')))
}

/**
 * 按本学期重修课匹配往期成绩单（一门多记录时取学年学期最新的一条）
 * @param {string} courseId
 * @param {string} [studentId]
 * @param {object|null} [course]
 */
export function findTranscriptForRetakeCourse(
  courseId,
  studentId = getCurrentStudentId(),
  course = null,
) {
  return listTranscriptForRetakeCourse(courseId, studentId, course)[0] || null
}

/**
 * 多行「学年学期 分数」展示文本
 * @param {object[]} rows
 */
export function formatPreviousCourseGradesText(rows) {
  return (rows || [])
    .map((row) => {
      const session = String(row.academicSession || '').trim()
      const gradeText = formatGradeDisplay(row)
      if (!session && !gradeText) return ''
      return [session, gradeText].filter(Boolean).join(' ')
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * 详情/列表回退：无历史文本时用单值字段拼接
 * @param {object} app
 */
export function displayPreviousCourseGrades(app) {
  const text = String(app?.previousCourseGradesText || '').trim()
  if (text) return text
  const session = String(app?.academicSessionTaken || '').trim()
  const gradeText = formatGradeDisplay({
    grade: app?.gradeEarned,
    score: app?.gradeScore ?? app?.score,
  })
  if (!session && !gradeText) return ''
  return [session, gradeText].filter(Boolean).join(' ')
}

/**
 * 选本学期重修课后回填曾修字段：全部历史只读文本 + 最新条供展示
 * @param {object|null} course
 * @param {string} academicSession
 * @param {string} [studentId]
 */
export function retakeHistoryFromCourse(course, academicSession, studentId = getCurrentStudentId()) {
  const rows = listTranscriptForRetakeCourse(course?.id || course?.code, studentId, course)
  const row = rows[0] || null
  return {
    transcriptId: row?.id || '',
    previouslyTakenCourse: row
      ? `${row.courseCode} ${row.courseName}`
      : course
        ? `${course.code || ''} ${course.name || ''}`.trim()
        : '',
    gradeEarned: row?.grade || '',
    gradeScore: resolveGradeScore(row),
    academicSessionTaken: row?.academicSession || getPreviousAcademicSession(academicSession),
    previousCourseGradesText: formatPreviousCourseGradesText(rows),
    /** 最新一条成绩（供表单列展示；不覆盖用户已选 retakeType） */
    latestGrade: row?.grade || '',
    latestGradeScore: resolveGradeScore(row),
    latestGradeZh: formatGradeDisplay(row),
    latestGradeSession: row?.academicSession || '',
  }
}
