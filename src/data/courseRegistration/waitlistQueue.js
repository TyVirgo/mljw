import { ref } from 'vue'
import { selectableCourses } from './selectableCourses.js'

function formatSubmittedAt(value) {
  if (value == null || value === '') return ''
  const pad = (n) => String(n).padStart(2, '0')
  const formatDate = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : formatDate(value)
  }
  const raw = String(value).trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return formatDate(parsed)
}

function resolveCourseCredits(courseCode) {
  const course = selectableCourses.value.find((item) => item.code === courseCode)
  return course?.credits ?? null
}

const initialWaitlistCourses = [
  {
    id: 'wl-course-it102',
    courseCode: 'IT102',
    courseName: 'Digital Literacy Workshop',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 40,
    enrolled: 40,
    waitlistCount: 2,
    status: 'full',
    registered: [
      { studentId: 'COS2409001', studentName: 'Ahmad bin Ali', programme: 'COS', intake: '2409' },
    ],
    waitlist: [
      { id: 'wl-010', studentId: 'DSA2504002', studentName: 'Lee Wei Ming', programme: 'DSA', intake: '2504', position: 1, status: 'Pending', submittedAt: '01-Sep-2025 09:00:00' },
      { id: 'wl-011', studentId: 'COS2504015', studentName: 'Tan Mei Ling', programme: 'COS', intake: '2504', position: 2, status: 'Pending', submittedAt: '02-Sep-2025 10:30:00' },
    ],
  },
  {
    id: 'wl-course-engl201',
    courseCode: 'ENGL201',
    courseName: 'Academic Writing',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 40,
    enrolled: 40,
    waitlistCount: 1,
    status: 'full',
    registered: [],
    waitlist: [
      { id: 'wl-012', studentId: 'AIT2409010', studentName: 'Siti Nurhaliza', programme: 'AIT', intake: '2409', position: 1, status: 'Pending', submittedAt: '02-Sep-2025 11:00:00' },
    ],
  },
  {
    id: 'wl-course-comp3192',
    courseCode: 'COMP3192',
    courseName: 'Algorithm Design',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 40,
    enrolled: 40,
    waitlistCount: 3,
    status: 'full',
    registered: [
      { studentId: 'COS2409001', studentName: 'Ahmad bin Ali', programme: 'COS', intake: '2409' },
      { studentId: 'AIT2409010', studentName: 'Siti Nurhaliza', programme: 'AIT', intake: '2409' },
    ],
    waitlist: [
      { id: 'wl-001', studentId: 'DSA2504002', studentName: 'Lee Wei Ming', programme: 'DSA', intake: '2504', position: 1, status: 'Pending', submittedAt: '02-Sep-2025 09:15:00' },
      { id: 'wl-002', studentId: 'COS2504015', studentName: 'Tan Mei Ling', programme: 'COS', intake: '2504', position: 2, status: 'Pending', submittedAt: '02-Sep-2025 10:00:00' },
      { id: 'wl-003', studentId: 'DSA2409008', studentName: 'Raj Kumar', programme: 'DSA', intake: '2409', position: 3, status: 'Approved', submittedAt: '01-Sep-2025 14:00:00' },
    ],
  },
  {
    id: 'wl-course-comp201',
    courseCode: 'COMP201',
    courseName: 'Data Structures',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 25,
    enrolled: 22,
    waitlistCount: 1,
    status: 'open',
    registered: [
      { studentId: 'COS2409001', studentName: 'Ahmad bin Ali', programme: 'COS', intake: '2409' },
    ],
    waitlist: [
      { id: 'wl-004', studentId: 'COS2504015', studentName: 'Tan Mei Ling', programme: 'COS', intake: '2504', position: 1, status: 'Pending', submittedAt: '03-Sep-2025 08:30:00' },
    ],
  },
  {
    id: 'wl-course-math201',
    courseCode: 'MATH201',
    courseName: 'Linear Algebra',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 35,
    enrolled: 35,
    waitlistCount: 2,
    status: 'full',
    registered: [],
    waitlist: [
      { id: 'wl-005', studentId: 'AIT2409012', studentName: 'Nurul Aina', programme: 'AIT', intake: '2409', position: 1, status: 'Rejected', submittedAt: '28-Aug-2025 16:00:00' },
      { id: 'wl-006', studentId: 'COS2409018', studentName: 'Lim Jia Hui', programme: 'COS', intake: '2409', position: 2, status: 'Pending', submittedAt: '29-Aug-2025 09:45:00' },
    ],
  },
  {
    id: 'wl-course-mpu318',
    courseCode: 'MPU3183',
    courseName: 'Malaysian Studies',
    section: '01',
    batchId: 'batch-2504-g1',
    capacity: 40,
    enrolled: 25,
    waitlistCount: 0,
    status: 'open',
    registered: [
      { studentId: 'DSA2504002', studentName: 'Lee Wei Ming', programme: 'DSA', intake: '2504' },
    ],
    waitlist: [],
  },
  {
    id: 'wl-course-comp220',
    courseCode: 'COMP220',
    courseName: 'Discrete Mathematics',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 40,
    enrolled: 40,
    waitlistCount: 0,
    status: 'full',
    registered: [],
    waitlist: [],
  },
  {
    id: 'wl-course-stat201',
    courseCode: 'STAT201',
    courseName: 'Probability & Statistics',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 35,
    enrolled: 35,
    waitlistCount: 0,
    status: 'full',
    registered: [],
    waitlist: [],
  },
  {
    id: 'wl-course-hum110',
    courseCode: 'HUM110',
    courseName: 'Introduction to Humanities',
    section: '01',
    batchId: 'batch-2504-m1',
    capacity: 30,
    enrolled: 30,
    waitlistCount: 0,
    status: 'full',
    registered: [],
    waitlist: [],
  },
]

export const waitlistCourses = ref(initialWaitlistCourses.map((c) => ({ ...c, waitlist: [...c.waitlist], registered: [...c.registered] })))

export function getWaitlistCourseById(id) {
  return waitlistCourses.value.find((c) => c.id === id) || null
}

export function filterWaitlistCourses(rows, filters = {}) {
  let list = [...rows]
  if (filters.status) list = list.filter((r) => r.status === filters.status)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.courseCode.toLowerCase().includes(kw) || r.courseName.toLowerCase().includes(kw),
    )
  }
  return list
}

export function approveWaitlistEntry(courseId, waitlistId) {
  const course = getWaitlistCourseById(courseId)
  if (!course) return { ok: false }
  const entry = course.waitlist.find((w) => w.id === waitlistId)
  if (!entry || entry.status !== 'Pending') return { ok: false }
  entry.status = 'Approved'
  if (course.enrolled < course.capacity) course.enrolled += 1
  return { ok: true }
}

export function rejectWaitlistEntry(courseId, waitlistId) {
  const course = getWaitlistCourseById(courseId)
  if (!course) return { ok: false }
  const entry = course.waitlist.find((w) => w.id === waitlistId)
  if (!entry || entry.status !== 'Pending') return { ok: false }
  entry.status = 'Rejected'
  return { ok: true }
}

/** 预计候补位（当前队列长度 + 1，未入队） */
export function getEstimatedWaitlistPosition(courseId) {
  const course = getWaitlistCourseById(courseId)
  if (!course) return null
  return course.waitlist.length + 1
}

export function findWaitlistCourseByCode(courseCode) {
  return waitlistCourses.value.find((item) => item.courseCode === courseCode) || null
}

export function joinStudentWaitlist(courseId, studentFields) {
  const course = getWaitlistCourseById(courseId)
  if (!course) return { ok: false, errorKey: 'courseRegistration.student.waitlistNotFound' }
  const exists = course.waitlist.some((entry) => entry.studentId === studentFields.studentId)
  if (exists) return { ok: false, errorKey: 'courseRegistration.student.waitlistDuplicate' }
  const entry = {
    id: `wl-stu-${Date.now()}`,
    studentId: studentFields.studentId,
    studentName: studentFields.studentName,
    programme: studentFields.programme,
    intake: studentFields.intake,
    position: course.waitlist.length + 1,
    status: 'Pending',
    submittedAt: formatSubmittedAt(new Date()),
  }
  course.waitlist.push(entry)
  course.waitlistCount = course.waitlist.length
  return { ok: true, entry }
}

export function listStudentWaitlistEntries(studentId) {
  const rows = []
  for (const course of waitlistCourses.value) {
    for (const entry of course.waitlist) {
      if (entry.studentId === studentId) {
        rows.push({
          ...entry,
          courseId: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          section: course.section,
          courseStatus: course.status,
          credits: resolveCourseCredits(course.courseCode),
          capacity: course.capacity,
          enrolled: course.enrolled,
          submittedAtDisplay: formatSubmittedAt(entry.submittedAt),
        })
      }
    }
  }
  return rows.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')))
}
