/**
 * 学生往期成绩单 demo（重修申请）
 */

import { getCurrentStudentId } from '../mockCurrentStudent.js'
import { getPreviousAcademicSession } from '../intakeSets.js'

const TRANSCRIPT_BY_STUDENT = {
  XMUM2309001: [
    {
      id: 'tr-comp101-f',
      courseCode: 'COMP101',
      courseName: 'Introduction to Programming',
      credits: 4,
      grade: 'F',
      academicSession: '2025/02',
      feeStream: 'science',
      type: 'ME',
      /** 本学期可选重修对应课程 id */
      retakeCourseId: 'course-comp201',
    },
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
      id: 'tr-engl201-b',
      courseCode: 'ENGL201',
      courseName: 'Academic Writing',
      credits: 3,
      grade: 'B-',
      academicSession: '2024/09',
      feeStream: 'arts',
      type: 'GE',
      g1Category: 'Humanities',
      retakeCourseId: 'course-engl201',
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

/** 不及格 → 挂科重修；及格 → 刷分 */
export function defaultRetakeTypeFromGrade(grade) {
  const g = String(grade || '').toUpperCase()
  if (!g || g === 'F' || g === 'M') return 'failed'
  return 'improve_grade'
}

/**
 * 按本学期重修课匹配往期成绩单（一门多记录时取学年学期最新的一条）
 * @param {string} courseId
 * @param {string} [studentId]
 */
export function findTranscriptForRetakeCourse(courseId, studentId = getCurrentStudentId()) {
  if (!courseId) return null
  const hits = getStudentTranscript(studentId).filter((row) => row.retakeCourseId === courseId)
  if (!hits.length) return null
  return hits
    .slice()
    .sort((a, b) => String(b.academicSession || '').localeCompare(String(a.academicSession || '')))[0]
}

/**
 * 选本学期重修课后回填曾修字段：成绩来自成绩单，学年学期为申请学期的上一学期
 * @param {object|null} course
 * @param {string} academicSession
 * @param {string} [studentId]
 */
export function retakeHistoryFromCourse(course, academicSession, studentId = getCurrentStudentId()) {
  const row = findTranscriptForRetakeCourse(course?.id, studentId)
  return {
    transcriptId: row?.id || '',
    previouslyTakenCourse: row
      ? `${row.courseCode} ${row.courseName}`
      : course
        ? `${course.code || ''} ${course.name || ''}`.trim()
        : '',
    gradeEarned: row?.grade || '',
    academicSessionTaken: getPreviousAcademicSession(academicSession),
    retakeType: row ? defaultRetakeTypeFromGrade(row.grade) : '',
  }
}
