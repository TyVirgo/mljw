/**
 * 学生往期成绩单 demo（重修申请）
 */

import { getCurrentStudentId } from '../mockCurrentStudent.js'

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
