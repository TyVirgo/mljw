/**
 * 学生往期成绩单 demo（重修申请）
 */

import { getCurrentStudentId } from '../mockCurrentStudent.js'
import { getPreviousAcademicSession } from '../intakeSets.js'

/** 字母成绩 → 中文等级（展示用） */
const LETTER_GRADE_ZH = {
  A: '优秀',
  'A-': '优秀',
  'B+': '良好',
  B: '良好',
  'B-': '良好',
  'C+': '中等',
  C: '中等',
  'C-': '中等',
  D: '及格',
  F: '不及格',
  M: '缺考',
}

/**
 * @param {string} grade
 * @returns {string}
 */
export function formatGradeToZh(grade) {
  const raw = String(grade || '').trim()
  if (!raw) return ''
  if (LETTER_GRADE_ZH[raw]) return LETTER_GRADE_ZH[raw]
  const upper = raw.toUpperCase()
  if (LETTER_GRADE_ZH[upper]) return LETTER_GRADE_ZH[upper]
  // B- / A+ 等：首字母大写
  const norm = raw[0].toUpperCase() + raw.slice(1)
  return LETTER_GRADE_ZH[norm] || raw
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
      academicSession: '2025/02',
      feeStream: 'science',
      type: 'ME',
      retakeCourseId: 'course-web210',
    },
    // —— 提升池（及格）——
    {
      id: 'tr-stat201-c',
      courseCode: 'STAT201',
      courseName: 'Probability & Statistics',
      credits: 3,
      grade: 'C',
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
  return TRANSCRIPT_BY_STUDENT[studentId] || DEFAULT_TRANSCRIPT
}

/** 不及格 / 缺考 → 挂科重修；及格 → 刷分 */
export function defaultRetakeTypeFromGrade(grade) {
  return isFailingGrade(grade) ? 'failed' : 'improve_grade'
}

/**
 * @param {string} grade
 * @returns {boolean}
 */
export function isFailingGrade(grade) {
  const g = String(grade || '').toUpperCase()
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
    const failing = isFailingGrade(row.grade)
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
 * 多行「学年学期 中文等级」展示文本
 * @param {object[]} rows
 */
export function formatPreviousCourseGradesText(rows) {
  return (rows || [])
    .map((row) => {
      const session = String(row.academicSession || '').trim()
      const gradeZh = formatGradeToZh(row.grade)
      if (!session && !gradeZh) return ''
      return [session, gradeZh].filter(Boolean).join(' ')
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
  const gradeZh = formatGradeToZh(app?.gradeEarned)
  if (!session && !gradeZh) return ''
  return [session, gradeZh].filter(Boolean).join(' ')
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
    academicSessionTaken: row?.academicSession || getPreviousAcademicSession(academicSession),
    previousCourseGradesText: formatPreviousCourseGradesText(rows),
    /** 最新一条成绩（供表单列展示；不覆盖用户已选 retakeType） */
    latestGrade: row?.grade || '',
    latestGradeSession: row?.academicSession || '',
  }
}
