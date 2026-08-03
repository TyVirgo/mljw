import { ref } from 'vue'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'
import { getRegistrationTypeLabel } from './registrationTypes.js'
import { registrationAcademicSessionOptions } from './registrationBatchFormUtils.js'
import { listAdminAddStudentCandidates } from './registrationResult.js'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import { formatIntakeBatch } from '../intakeSets.js'

/** @typedef {'preselect' | 'main' | 'supplement' | 'admin'} FeeCourseSource */

export { registrationAcademicSessionOptions as feeRosterAcademicSessionOptions }

/**
 * 未缴费课程明细（扁平）
 * academicSession：选课学年学期
 * outstandingFee：Y=欠学费，N=未欠
 * courseSource：与学生端一致 — preselect/main/supplement/admin
 */
const initialUnpaidRows = [
  // COS2409001 — 4+3+3+4 = 14 · 2025/04
  {
    id: 'fee-1',
    studentId: 'COS2409001',
    studentName: 'Ahmad bin Ali',
    programme: 'COS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'COMP201',
    courseName: 'Data Structures',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'preselect',
  },
  {
    id: 'fee-2',
    studentId: 'COS2409001',
    studentName: 'Ahmad bin Ali',
    programme: 'COS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ENGL201',
    courseName: 'Academic Writing',
    courseCredits: 3,
    courseType: 'GE',
    sectionCode: '02',
    courseSource: 'main',
  },
  {
    id: 'fee-3',
    studentId: 'COS2409001',
    studentName: 'Ahmad bin Ali',
    programme: 'COS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'STAT201',
    courseName: 'Probability & Statistics',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'supplement',
  },
  {
    id: 'fee-3b',
    studentId: 'COS2409001',
    studentName: 'Ahmad bin Ali',
    programme: 'COS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'COMP301',
    courseName: 'Database Systems',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'admin',
  },
  // SWE2409012 — 3+4+3+4 = 14 · 2025/04
  {
    id: 'fee-4',
    studentId: 'SWE2409012',
    studentName: 'Lim Wei Jie',
    programme: 'SWE',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'SWE302',
    courseName: 'Software Engineering Practices',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'preselect',
  },
  {
    id: 'fee-5',
    studentId: 'SWE2409012',
    studentName: 'Lim Wei Jie',
    programme: 'SWE',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'COMP301',
    courseName: 'Database Systems',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'supplement',
  },
  {
    id: 'fee-6',
    studentId: 'SWE2409012',
    studentName: 'Lim Wei Jie',
    programme: 'SWE',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'MATH301',
    courseName: 'Discrete Mathematics',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'admin',
  },
  {
    id: 'fee-6b',
    studentId: 'SWE2409012',
    studentName: 'Lim Wei Jie',
    programme: 'SWE',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'COMP3192',
    courseName: 'Algorithm Design',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  // CHS2409020 — 3+3+3+4 = 13 · 2025/04
  {
    id: 'fee-9',
    studentId: 'CHS2409020',
    studentName: 'Wong Mei Ling',
    programme: 'CHS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'HUM110',
    courseName: 'Introduction to Humanities',
    courseCredits: 3,
    courseType: 'GE',
    sectionCode: '01',
    courseSource: 'main',
  },
  {
    id: 'fee-10',
    studentId: 'CHS2409020',
    studentName: 'Wong Mei Ling',
    programme: 'CHS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'BUS101',
    courseName: 'Principles of Management',
    courseCredits: 3,
    courseType: 'GE',
    sectionCode: '02',
    courseSource: 'main',
  },
  {
    id: 'fee-10b',
    studentId: 'CHS2409020',
    studentName: 'Wong Mei Ling',
    programme: 'CHS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'ENGL201',
    courseName: 'Academic Writing',
    courseCredits: 3,
    courseType: 'GE',
    sectionCode: '01',
    courseSource: 'admin',
  },
  {
    id: 'fee-10c',
    studentId: 'CHS2409020',
    studentName: 'Wong Mei Ling',
    programme: 'CHS',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'CSC110',
    courseName: 'Computer Organization',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  // AIT2409015 — 2+3+4+4 = 13 · 2025/02（异学期，便于筛选演示）
  {
    id: 'fee-11',
    studentId: 'AIT2409015',
    studentName: 'Rajesh Kumar',
    programme: 'AIT',
    intake: '2024/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'IT102',
    courseName: 'Digital Literacy Workshop',
    courseCredits: 2,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  {
    id: 'fee-12',
    studentId: 'AIT2409015',
    studentName: 'Rajesh Kumar',
    programme: 'AIT',
    intake: '2024/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'CSC110',
    courseName: 'Computer Organization',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  {
    id: 'fee-12b',
    studentId: 'AIT2409015',
    studentName: 'Rajesh Kumar',
    programme: 'AIT',
    intake: '2024/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'COMP201',
    courseName: 'Data Structures',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'admin',
  },
  {
    id: 'fee-12c',
    studentId: 'AIT2409015',
    studentName: 'Rajesh Kumar',
    programme: 'AIT',
    intake: '2024/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'MATH301',
    courseName: 'Discrete Mathematics',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  // FIN2409011 — 3+4+4+4 = 15 · 2025/04 · 欠学费 N
  {
    id: 'fee-13',
    studentId: 'FIN2409011',
    studentName: 'Chen Yu',
    programme: 'FIN',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'FIN201',
    courseName: 'Corporate Finance',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'preselect',
  },
  {
    id: 'fee-14',
    studentId: 'FIN2409011',
    studentName: 'Chen Yu',
    programme: 'FIN',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ACC201',
    courseName: 'Financial Accounting',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'main',
  },
  {
    id: 'fee-15',
    studentId: 'FIN2409011',
    studentName: 'Chen Yu',
    programme: 'FIN',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ECON201',
    courseName: 'Microeconomics',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  {
    id: 'fee-16',
    studentId: 'FIN2409011',
    studentName: 'Chen Yu',
    programme: 'FIN',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'STAT201',
    courseName: 'Probability & Statistics',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '03',
    courseSource: 'admin',
  },
  // NET2504003 — 3+3+3+4 = 13 · 2025/04 · 欠学费 Y
  {
    id: 'fee-17',
    studentId: 'NET2504003',
    studentName: 'Priya Sharma',
    programme: 'NET',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'NET201',
    courseName: 'Computer Networks',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  {
    id: 'fee-18',
    studentId: 'NET2504003',
    studentName: 'Priya Sharma',
    programme: 'NET',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'COMP201',
    courseName: 'Data Structures',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'preselect',
  },
  {
    id: 'fee-19',
    studentId: 'NET2504003',
    studentName: 'Priya Sharma',
    programme: 'NET',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'ENGL201',
    courseName: 'Academic Writing',
    courseCredits: 3,
    courseType: 'GE',
    sectionCode: '01',
    courseSource: 'supplement',
  },
  {
    id: 'fee-20',
    studentId: 'NET2504003',
    studentName: 'Priya Sharma',
    programme: 'NET',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'MATH301',
    courseName: 'Discrete Mathematics',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  // BIZ2309018 — 4+4+4+4 = 16 · 2025/02 · 欠学费 N
  {
    id: 'fee-21',
    studentId: 'BIZ2309018',
    studentName: 'Ong Kah Wai',
    programme: 'BIZ',
    intake: '2023/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'MKT201',
    courseName: 'Principles of Marketing',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  {
    id: 'fee-22',
    studentId: 'BIZ2309018',
    studentName: 'Ong Kah Wai',
    programme: 'BIZ',
    intake: '2023/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'MGT201',
    courseName: 'Organizational Behavior',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'main',
  },
  {
    id: 'fee-23',
    studentId: 'BIZ2309018',
    studentName: 'Ong Kah Wai',
    programme: 'BIZ',
    intake: '2023/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ACC201',
    courseName: 'Financial Accounting',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'preselect',
  },
  {
    id: 'fee-24',
    studentId: 'BIZ2309018',
    studentName: 'Ong Kah Wai',
    programme: 'BIZ',
    intake: '2023/09',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ECON201',
    courseName: 'Microeconomics',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '03',
    courseSource: 'admin',
  },
  // EDU2409025 — 3+3+4+4 = 14 · 2025/04 · 欠学费 Y
  {
    id: 'fee-25',
    studentId: 'EDU2409025',
    studentName: 'Siti Nurhaliza',
    programme: 'EDU',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'EDU201',
    courseName: 'Educational Psychology',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
  },
  {
    id: 'fee-26',
    studentId: 'EDU2409025',
    studentName: 'Siti Nurhaliza',
    programme: 'EDU',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'EDU210',
    courseName: 'Curriculum Design',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'preselect',
  },
  {
    id: 'fee-27',
    studentId: 'EDU2409025',
    studentName: 'Siti Nurhaliza',
    programme: 'EDU',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'ENGL201',
    courseName: 'Academic Writing',
    courseCredits: 4,
    courseType: 'GE',
    sectionCode: '02',
    courseSource: 'supplement',
  },
  {
    id: 'fee-28',
    studentId: 'EDU2409025',
    studentName: 'Siti Nurhaliza',
    programme: 'EDU',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'HUM110',
    courseName: 'Introduction to Humanities',
    courseCredits: 4,
    courseType: 'GE',
    sectionCode: '01',
    courseSource: 'main',
  },
]

/**
 * 明细行是否已缴费
 * @param {object} row
 * @returns {boolean}
 */
export function isFeeRosterRowPaid(row) {
  return String(row?.paid || '').toUpperCase() === 'Y'
}

/** 已缴费 demo 明细（与未缴费同结构，paid=Y + paidAt） */
const initialPaidRows = [
  {
    id: 'fee-paid-1',
    studentId: 'DSA2504008',
    studentName: 'Nur Aisyah',
    programme: 'DSA',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'DSA201',
    courseName: 'Data Science Fundamentals',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
    paid: 'Y',
    paidAt: '2025-09-12',
  },
  {
    id: 'fee-paid-2',
    studentId: 'DSA2504008',
    studentName: 'Nur Aisyah',
    programme: 'DSA',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'STAT201',
    courseName: 'Probability & Statistics',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'preselect',
    paid: 'Y',
    paidAt: '2025-09-12',
  },
  {
    id: 'fee-paid-3',
    studentId: 'DSA2504008',
    studentName: 'Nur Aisyah',
    programme: 'DSA',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'COMP301',
    courseName: 'Database Systems',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'supplement',
    paid: 'Y',
    paidAt: '2025-09-12',
  },
  {
    id: 'fee-paid-4',
    studentId: 'DSA2504008',
    studentName: 'Nur Aisyah',
    programme: 'DSA',
    intake: '2025/04',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ENGL201',
    courseName: 'Academic Writing',
    courseCredits: 3,
    courseType: 'GE',
    sectionCode: '01',
    courseSource: 'admin',
    paid: 'Y',
    paidAt: '2025-09-12',
  },
  // ACC2409007 — 3+3+4+4 = 14 · 已缴费 · 导入 2025-09-15
  {
    id: 'fee-paid-5',
    studentId: 'ACC2409007',
    studentName: 'Jason Tan',
    programme: 'ACC',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ACC201',
    courseName: 'Financial Accounting',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
    paid: 'Y',
    paidAt: '2025-09-15',
  },
  {
    id: 'fee-paid-6',
    studentId: 'ACC2409007',
    studentName: 'Jason Tan',
    programme: 'ACC',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'ACC301',
    courseName: 'Auditing',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'preselect',
    paid: 'Y',
    paidAt: '2025-09-15',
  },
  {
    id: 'fee-paid-7',
    studentId: 'ACC2409007',
    studentName: 'Jason Tan',
    programme: 'ACC',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'FIN201',
    courseName: 'Corporate Finance',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
    paid: 'Y',
    paidAt: '2025-09-15',
  },
  {
    id: 'fee-paid-8',
    studentId: 'ACC2409007',
    studentName: 'Jason Tan',
    programme: 'ACC',
    intake: '2024/09',
    academicSession: '2025/04',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'N',
    courseCode: 'STAT201',
    courseName: 'Probability & Statistics',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'admin',
    paid: 'Y',
    paidAt: '2025-09-15',
  },
  // PSY2504010 — 3+3+3+4 = 13 · 已缴费 · 欠学费 Y · 导入 2025-09-18 · 2025/02
  {
    id: 'fee-paid-9',
    studentId: 'PSY2504010',
    studentName: 'Emily Wong',
    programme: 'PSY',
    intake: '2025/04',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'PSY201',
    courseName: 'Introduction to Psychology',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
    paid: 'Y',
    paidAt: '2025-09-18',
  },
  {
    id: 'fee-paid-10',
    studentId: 'PSY2504010',
    studentName: 'Emily Wong',
    programme: 'PSY',
    intake: '2025/04',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'PSY210',
    courseName: 'Developmental Psychology',
    courseCredits: 3,
    courseType: 'ME',
    sectionCode: '02',
    courseSource: 'preselect',
    paid: 'Y',
    paidAt: '2025-09-18',
  },
  {
    id: 'fee-paid-11',
    studentId: 'PSY2504010',
    studentName: 'Emily Wong',
    programme: 'PSY',
    intake: '2025/04',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'ENGL201',
    courseName: 'Academic Writing',
    courseCredits: 3,
    courseType: 'GE',
    sectionCode: '01',
    courseSource: 'supplement',
    paid: 'Y',
    paidAt: '2025-09-18',
  },
  {
    id: 'fee-paid-12',
    studentId: 'PSY2504010',
    studentName: 'Emily Wong',
    programme: 'PSY',
    intake: '2025/04',
    academicSession: '2025/02',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: 'Y',
    courseCode: 'STAT201',
    courseName: 'Probability & Statistics',
    courseCredits: 4,
    courseType: 'ME',
    sectionCode: '01',
    courseSource: 'main',
    paid: 'Y',
    paidAt: '2025-09-18',
  },
]

/** 缴费名单课程明细（含未缴费 paid=N 与已缴费 paid=Y） */
export const feeRosterRows = ref([
  ...initialUnpaidRows.map((row) => ({ ...row, paid: 'N', paidAt: '' })),
  ...initialPaidRows.map((row) => ({ ...row })),
])

/**
 * @deprecated 已缴费改由 feeRosterRows.paid==='Y' 聚合；保留空数组避免旧引用报错
 * 原因：统一主表后不再单独维护已缴费学生列表
 */
export const feeRosterPaidStudents = ref([])

export function sumStudentCourseCredits(studentId, detailRows = feeRosterRows.value) {
  return detailRows
    .filter((row) => row.studentId === studentId)
    .reduce((sum, row) => sum + (Number(row.courseCredits) || 0), 0)
}

/**
 * @param {object[]} list
 * @param {{ studentId?: string, studentName?: string, programme?: string, intake?: string, academicSession?: string, outstandingFee?: string, paid?: string }} filters
 */
export function filterFeeRosterDetailRows(list, filters = {}) {
  const studentId = String(filters.studentId || '')
    .trim()
    .toLowerCase()
  const studentName = String(filters.studentName || '')
    .trim()
    .toLowerCase()
  const programme = String(filters.programme || '')
    .trim()
    .toLowerCase()
  const intake = String(filters.intake || '')
    .trim()
    .toLowerCase()
  const academicSession = String(filters.academicSession || '').trim()
  const fee = String(filters.outstandingFee || '')
    .trim()
    .toUpperCase()
  const paid = String(filters.paid || '')
    .trim()
    .toUpperCase()

  return list.filter((row) => {
    if (paid === 'Y' && !isFeeRosterRowPaid(row)) return false
    if (paid === 'N' && isFeeRosterRowPaid(row)) return false
    if (fee && String(row.outstandingFee || '').toUpperCase() !== fee) return false
    if (academicSession && String(row.academicSession || '') !== academicSession) return false
    if (studentId && !String(row.studentId || '').toLowerCase().includes(studentId)) return false
    if (studentName && !String(row.studentName || '').toLowerCase().includes(studentName)) return false
    if (programme && !String(row.programme || '').toLowerCase().includes(programme)) return false
    if (intake && !String(row.intake || '').toLowerCase().includes(intake)) return false
    return true
  })
}

/**
 * @deprecated 已缴费学生请用 filterFeeRosterDetailRows(..., { paid: 'Y' }) + aggregateFeeRosterStudents
 * @param {object[]} list 学生聚合行或旧 paid 列表
 * @param {{ studentId?: string, studentName?: string, programme?: string, intake?: string, academicSession?: string }} filters
 */
export function filterFeeRosterPaidStudents(list, filters = {}) {
  const studentId = String(filters.studentId || '')
    .trim()
    .toLowerCase()
  const studentName = String(filters.studentName || '')
    .trim()
    .toLowerCase()
  const programme = String(filters.programme || '')
    .trim()
    .toLowerCase()
  const intake = String(filters.intake || '')
    .trim()
    .toLowerCase()
  const academicSession = String(filters.academicSession || '').trim()

  return list.filter((row) => {
    if (academicSession && String(row.academicSession || '') !== academicSession) return false
    if (studentId && !String(row.studentId || '').toLowerCase().includes(studentId)) return false
    if (studentName && !String(row.studentName || '').toLowerCase().includes(studentName)) return false
    if (programme && !String(row.programme || '').toLowerCase().includes(programme)) return false
    if (intake && !String(row.intake || '').toLowerCase().includes(intake)) return false
    return true
  })
}

/**
 * 需要缴费学分 = 已选 − 最低（小于 0 记 0）
 * @param {number} enrolledCredits
 * @param {number} creditMin
 * @returns {number}
 */
export function calcBillableCredits(enrolledCredits, creditMin) {
  const enrolled = Number(enrolledCredits) || 0
  const min = Number(creditMin) || 0
  return Math.max(0, enrolled - min)
}

/**
 * 按学生聚合；已选学分 = 同缴费状态下该生课程学分之和
 * 超最低学分，或人工补录（manual/import）均展示；已缴费行不过滤超学分
 * @param {object[]} detailRows 已按 paid 等条件过滤的明细
 * @param {object[]} allRows 同状态全集（默认用 detailRows）
 */
export function aggregateFeeRosterStudents(detailRows = [], allRows = detailRows) {
  const map = new Map()
  for (const row of detailRows) {
    if (map.has(row.studentId)) continue
    const courses = allRows.filter((item) => item.studentId === row.studentId)
    const realCourses = courses.filter((item) => String(item.courseCode || '').trim())
    const enrolledCredits = courses.reduce((sum, item) => sum + (Number(item.courseCredits) || 0), 0)
    const creditMin = Number(row.creditMin) || LONG_SEMESTER_CREDIT_MIN
    const paid = isFeeRosterRowPaid(row)
    const forceInclude = courses.some(
      (item) =>
        item.entrySource === 'manual' ||
        item.entrySource === 'import' ||
        item.entrySource === 'sync',
    )
    map.set(row.studentId, {
      studentId: row.studentId,
      studentName: row.studentName,
      programme: row.programme,
      intake: row.intake,
      academicSession: row.academicSession,
      enrolledCredits,
      creditMin,
      creditMax: Number(row.creditMax) || LONG_SEMESTER_CREDIT_MAX,
      billableCredits: calcBillableCredits(enrolledCredits, creditMin),
      outstandingFee: row.outstandingFee,
      isPaid: paid ? 'Y' : 'N',
      paidAt: row.paidAt || '',
      courseCount: realCourses.length,
      forceInclude,
    })
  }
  return [...map.values()].filter(
    (s) => s.isPaid === 'Y' || s.forceInclude || s.enrolledCredits > s.creditMin,
  )
}

export function getFeeRosterCoursesByStudent(studentId, detailRows = feeRosterRows.value) {
  return detailRows.filter(
    (row) => row.studentId === studentId && String(row.courseCode || '').trim(),
  )
}

export function feeCourseSourceLabel(source, t) {
  if (source === 'admin') return t('courseRegistration.student.courseSourceAdmin')
  const map = {
    preselect: 'courseRegistration.batch.roundPreselect',
    main: 'courseRegistration.batch.roundMain',
    supplement: 'courseRegistration.batch.roundSupplement',
    // 兼容旧 demo 值
    student: 'courseRegistration.batch.roundMain',
  }
  const key = map[source]
  return key ? t(key) : '—'
}

/**
 * 将匹配的未缴费学生标为已缴费（保留课程明细）
 * @param {Array<{ studentId: string, studentName?: string }|string>} entries 学号，或学号+姓名
 * @returns {{ moved: object[], skippedNotFound: string[], skippedAlreadyPaid: string[], skippedNameMismatch: string[] }}
 */
export function markFeeRosterStudentsPaid(entries = []) {
  const list = (Array.isArray(entries) ? entries : []).map((item) =>
    typeof item === 'string' ? { studentId: item, studentName: '' } : item,
  )
  const unpaidById = new Map()
  const paidIdSet = new Set()
  for (const row of feeRosterRows.value) {
    if (isFeeRosterRowPaid(row)) {
      paidIdSet.add(row.studentId)
      continue
    }
    if (!unpaidById.has(row.studentId)) {
      unpaidById.set(row.studentId, {
        studentId: row.studentId,
        studentName: row.studentName,
        programme: row.programme,
        intake: row.intake,
        academicSession: row.academicSession,
      })
    }
  }

  const moved = []
  const skippedNotFound = []
  const skippedAlreadyPaid = []
  const skippedNameMismatch = []
  const today = new Date().toISOString().slice(0, 10)
  const moveIds = new Set()

  for (const entry of list) {
    const id = String(entry.studentId || '').trim()
    if (!id) continue
    if (moveIds.has(id)) continue
    if (paidIdSet.has(id)) {
      skippedAlreadyPaid.push(id)
      continue
    }
    const snapshot = unpaidById.get(id)
    if (!snapshot) {
      skippedNotFound.push(id)
      continue
    }
    const importName = String(entry.studentName || '').trim()
    // 必须同时匹配学号与姓名（忽略大小写）
    if (
      !importName ||
      importName.toLowerCase() !== String(snapshot.studentName || '').trim().toLowerCase()
    ) {
      skippedNameMismatch.push(id)
      continue
    }
    moved.push({ ...snapshot, paidAt: today, isPaid: 'Y' })
    moveIds.add(id)
    paidIdSet.add(id)
  }

  if (moved.length) {
    feeRosterRows.value = feeRosterRows.value.map((row) => {
      if (!moveIds.has(row.studentId) || isFeeRosterRowPaid(row)) return row
      return { ...row, paid: 'Y', paidAt: today }
    })
  }

  return { moved, skippedNotFound, skippedAlreadyPaid, skippedNameMismatch }
}

let feeAdrSeq = 100

function unpaidStudentIdSet() {
  return new Set(
    feeRosterRows.value.filter((row) => !isFeeRosterRowPaid(row)).map((row) => row.studentId),
  )
}

function paidStudentIdSet() {
  return new Set(
    feeRosterRows.value.filter((row) => isFeeRosterRowPaid(row)).map((row) => row.studentId),
  )
}

function buildManualPlaceholderRow(profile, entrySource) {
  feeAdrSeq += 1
  return {
    id: `fee-${entrySource}-${feeAdrSeq}`,
    studentId: profile.studentId,
    studentName: profile.studentName || profile.studentId,
    programme: profile.programme || '',
    intake: profile.intake || '',
    academicSession: profile.academicSession || feeRosterAcademicSessionOptions[0] || '',
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    outstandingFee: profile.outstandingFee === 'Y' ? 'Y' : 'N',
    courseCode: '',
    courseName: '',
    courseCredits: 0,
    courseType: '',
    sectionCode: '',
    courseSource: 'admin',
    entrySource,
    paid: 'N',
    paidAt: '',
  }
}

/**
 * 手工新增未缴费学生（占位明细，可不超学分）
 * @returns {{ ok: boolean, errorKey?: string, item?: object }}
 */
export function addUnpaidFeeRosterStudent(payload = {}) {
  const studentId = String(payload.studentId || '').trim()
  if (!studentId) {
    return { ok: false, errorKey: 'courseRegistration.feeRoster.unpaidAddStudentRequired' }
  }
  if (paidStudentIdSet().has(studentId)) {
    return { ok: false, errorKey: 'courseRegistration.feeRoster.unpaidAddAlreadyPaid' }
  }
  if (unpaidStudentIdSet().has(studentId)) {
    return { ok: false, errorKey: 'courseRegistration.feeRoster.unpaidAddAlreadyExists' }
  }
  const row = buildManualPlaceholderRow(
    {
      studentId,
      studentName: payload.studentName,
      programme: payload.programme,
      intake: payload.intake,
      academicSession: payload.academicSession,
      outstandingFee: payload.outstandingFee,
    },
    'manual',
  )
  feeRosterRows.value = [row, ...feeRosterRows.value]
  return { ok: true, item: row }
}

/**
 * 批量导入扩未缴费名单
 * @param {Array<{ studentId: string, studentName?: string, programme?: string, intake?: string, academicSession?: string }|string>} entries
 * @returns {{ ok: boolean, added: number, skippedExist: number, skippedPaid: number }}
 */
export function importUnpaidFeeRosterStudents(entries = []) {
  const list = (Array.isArray(entries) ? entries : []).map((item) =>
    typeof item === 'string' ? { studentId: item } : item,
  )
  let added = 0
  let skippedExist = 0
  let skippedPaid = 0
  const unpaid = unpaidStudentIdSet()
  const paid = paidStudentIdSet()
  const toAdd = []

  for (const entry of list) {
    const studentId = String(entry.studentId || '').trim()
    if (!studentId) continue
    if (paid.has(studentId)) {
      skippedPaid += 1
      continue
    }
    if (unpaid.has(studentId)) {
      skippedExist += 1
      continue
    }
    unpaid.add(studentId)
    toAdd.push(
      buildManualPlaceholderRow(
        {
          studentId,
          studentName: entry.studentName,
          programme: entry.programme,
          intake: entry.intake,
          academicSession: entry.academicSession,
        },
        'import',
      ),
    )
    added += 1
  }

  if (toAdd.length) {
    feeRosterRows.value = [...toAdd, ...feeRosterRows.value]
  }
  return { ok: true, added, skippedExist, skippedPaid }
}

/**
 * 一键同步超学分学生进未缴费（来源：选课监控演示池）
 * @returns {{ ok: boolean, added: number, skippedExist: number, skippedPaid: number, skippedBelowMin: number }}
 */
export function syncUnpaidOverCreditStudents() {
  const unpaid = unpaidStudentIdSet()
  const paid = paidStudentIdSet()
  let added = 0
  let skippedExist = 0
  let skippedPaid = 0
  let skippedBelowMin = 0
  const toAdd = []
  const session = feeRosterAcademicSessionOptions[0] || ''

  for (const mon of registrationMonitorQueue.value) {
    const studentId = String(mon.studentId || '').trim()
    if (!studentId) continue
    const creditMin = Number(mon.creditMin) || LONG_SEMESTER_CREDIT_MIN
    const credits = Number(mon.credits) || 0
    if (credits <= creditMin) {
      skippedBelowMin += 1
      continue
    }
    if (paid.has(studentId)) {
      skippedPaid += 1
      continue
    }
    if (unpaid.has(studentId)) {
      skippedExist += 1
      continue
    }
    unpaid.add(studentId)
    feeAdrSeq += 1
    toAdd.push({
      id: `fee-sync-${feeAdrSeq}`,
      studentId,
      studentName: mon.studentName || studentId,
      programme: mon.programme || '',
      intake: formatIntakeBatch(mon.intake) || mon.intake || '',
      academicSession: session,
      creditMin,
      creditMax: Number(mon.creditMax) || LONG_SEMESTER_CREDIT_MAX,
      outstandingFee: 'N',
      courseCode: 'SYNC',
      courseName: 'Synced enrollment',
      courseCredits: credits,
      courseType: 'ME',
      sectionCode: '01',
      courseSource: 'admin',
      entrySource: 'sync',
      paid: 'N',
      paidAt: '',
    })
    added += 1
  }

  if (toAdd.length) {
    feeRosterRows.value = [...toAdd, ...feeRosterRows.value]
  }
  return { ok: true, added, skippedExist, skippedPaid, skippedBelowMin }
}

/**
 * 未缴费新增/导入可选候选人（排除已在未缴费与已缴费）
 */
export function listFeeRosterUnpaidAddCandidates() {
  const blocked = new Set([...unpaidStudentIdSet(), ...paidStudentIdSet()])
  return listAdminAddStudentCandidates().filter((row) => !blocked.has(row.studentId))
}

export function formatFeeRosterStudentExportRow(row, t) {
  const fee = String(row.outstandingFee || '').toUpperCase()
  const paid = String(row.isPaid || '').toUpperCase() === 'Y'
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme,
    intake: row.intake,
    academicSession: row.academicSession || '',
    courseCount: row.courseCount,
    enrolledCredits: row.enrolledCredits,
    creditMin: row.creditMin,
    creditMax: row.creditMax,
    billableCredits:
      row.billableCredits != null
        ? row.billableCredits
        : calcBillableCredits(row.enrolledCredits, row.creditMin),
    outstandingFee:
      fee === 'Y'
        ? t('courseRegistration.feeRoster.outstandingYes')
        : fee === 'N'
          ? t('courseRegistration.feeRoster.outstandingNo')
          : fee || '—',
    isPaid: paid ? t('common.yes') : t('common.no'),
  }
}

export function formatFeeRosterCourseExportRow(row, t) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    courseCode: row.courseCode,
    courseName: row.courseName,
    courseCredits: row.courseCredits,
    courseType: getRegistrationTypeLabel(row.courseType, t) || row.courseType || '',
    sectionCode: row.sectionCode
      ? t('courseRegistration.courses.sectionNameDisplay', { code: row.sectionCode })
      : '',
    courseSource: feeCourseSourceLabel(row.courseSource, t),
  }
}

/** @deprecated */
export const filterFeeRosterRows = filterFeeRosterDetailRows

/** 审批生成账单时写入缴费名单占位行（演示） */
export function appendFeeRosterFromApproval(app) {
  if (!app) return { ok: false, count: 0 }
  const feeItems = (app.items || []).filter((item) => Number(item.fee) > 0)
  if (!feeItems.length) return { ok: true, count: 0 }
  let count = 0
  for (const item of feeItems) {
    feeAdrSeq += 1
    feeRosterRows.value.unshift({
      id: `fee-adr-${feeAdrSeq}`,
      studentId: app.studentId,
      studentName: app.studentName,
      programme: app.programme,
      intake: app.intake,
      academicSession: app.academicSession || '',
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      outstandingFee: 'Y',
      courseCode: item.courseCode,
      courseName: item.courseCode,
      courseCredits: item.credits || 0,
      courseType: 'ME',
      sectionCode: item.section || '01',
      courseSource: 'admin',
      paid: 'N',
      paidAt: '',
    })
    count += 1
  }
  return { ok: true, count }
}
