import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import { studentConfirmedCourses, studentSchedule } from './studentRegistrationStore.js'
import { addDropApprovalQueue } from './addDropApprovalQueue.js'
import { waitlistCourses } from './waitlistQueue.js'
import { DEFAULT_MOCK_CURRENT_STUDENT_ID } from '../mockCurrentStudent.js'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'

const DEMO_STUDENT_ID = DEFAULT_MOCK_CURRENT_STUDENT_ID

let seeded = false

export function seedStudentRegistrationDemo() {
  if (seeded) return
  seeded = true

  const existingMonitor = registrationMonitorQueue.value.find((r) => r.studentId === DEMO_STUDENT_ID)
  if (!existingMonitor) {
    registrationMonitorQueue.value.unshift({
      id: 'mon-xmum-demo',
      studentId: DEMO_STUDENT_ID,
      studentName: 'Tan Wei Ming',
      programme: 'SWE',
      intake: '2409',
      credits: 4,
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      status: 'creditLow',
      tags: ['senior'],
      cgpa: 3.42,
      g1Progress: {
        humanities: 4,
        business: 3,
        required: { humanities: 6, business: 6 },
      },
      schedule: [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }],
      issues: ['creditBelowMin'],
      history: [
        { at: '28-Aug-2025', action: 'Pre-registration: COMP101 sec 01 (random assign)' },
        { at: '29-Aug-2025', action: 'Main round opened — add more M1 courses' },
      ],
    })
  }

  if (!studentConfirmedCourses.value.length) {
    studentConfirmedCourses.value = [
      {
        courseId: 'course-comp101',
        courseCode: 'COMP101',
        courseName: 'Introduction to Programming',
        credits: 4,
        sectionCode: '01',
        time: 'Thu 14:00–16:00',
        room: 'D5-2-101',
        lecturer: 'Dr. Lim',
        batchId: 'batch-2504-m1',
      },
    ]
    studentSchedule.value = [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }]
  }

  const hasWaitlist = waitlistCourses.value.some((course) =>
    course.waitlist.some((entry) => entry.studentId === DEMO_STUDENT_ID),
  )
  if (!hasWaitlist) {
    const itCourse = waitlistCourses.value.find((c) => c.courseCode === 'IT102')
    if (itCourse) {
      itCourse.waitlist.push({
        id: 'wl-xmum-demo',
        studentId: DEMO_STUDENT_ID,
        studentName: 'Tan Wei Ming',
        programme: 'SWE',
        intake: '2409',
        position: itCourse.waitlist.length + 1,
        status: 'Pending',
        submittedAt: '01-Sep-2025',
      })
      itCourse.waitlistCount = itCourse.waitlist.length
    }
  }

  const hasAddDrop = addDropApprovalQueue.value.some((app) => app.studentId === DEMO_STUDENT_ID)
  if (!hasAddDrop) {
    addDropApprovalQueue.value.push({
      id: 'adr-xmum-demo',
      applicationNo: 'ADR2509018',
      studentId: DEMO_STUDENT_ID,
      studentName: 'Tan Wei Ming',
      programme: 'SWE',
      intake: '2409',
      type: 'Add',
      status: 'Pending',
      submittedAt: '10-Sep-2025 11:20',
      currentCredits: 4,
      creditMax: 20,
      billStatus: 'pending',
      billAmount: 320,
      items: [
        {
          action: 'Add',
          courseCode: 'COMP201',
          credits: 4,
          section: '02',
          time: 'Wed 14:00–16:00',
          fee: 320,
        },
      ],
      schedule: [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }],
      approvalLog: [],
    })
  }
}
