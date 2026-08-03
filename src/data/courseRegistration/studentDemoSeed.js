import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import {
  studentConfirmedCourses,
  studentSchedule,
  pendingRegistration,
  studentFailedRegistrations,
  studentPendingAssignCourses,
} from './studentRegistrationStore.js'
import { addDropApprovalQueue } from './addDropApprovalQueue.js'
import { waitlistCourses } from './waitlistQueue.js'
import { DEFAULT_MOCK_CURRENT_STUDENT_ID } from '../mockCurrentStudent.js'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'
import { deriveClassTime } from './sectionScheduleFields.js'

const DEMO_STUDENT_ID = DEFAULT_MOCK_CURRENT_STUDENT_ID

/**
 * 轮次自选成功半池（与「我的选课」成功叙事一致）
 * 在线选课侧对应课号将显示已选；其余半池保持可选
 */
const DEMO_ROUND_CONFIRMED_COURSES = [
  {
    courseId: 'course-comp101',
    courseCode: 'COMP101',
    courseName: 'Introduction to Programming',
    credits: 4,
    type: 'ME',
    sectionId: 'sec-5',
    sectionCode: '01',
    time: 'Thu 14:00–16:00',
    weekRange: '1-14',
    room: 'D5-2-101',
    lecturer: 'Dr. Lim',
    batchId: 'batch-2504-m1',
  },
  {
    courseId: 'course-comp201',
    courseCode: 'COMP201',
    courseName: 'Data Structures',
    credits: 4,
    type: 'ME',
    sectionId: 'sec-2',
    sectionCode: '02',
    time: 'Wed 14:00–16:00',
    weekRange: '1-14',
    room: 'D5-3-202',
    lecturer: 'Dr. Tan',
    batchId: 'batch-2504-m1',
  },
  {
    courseId: 'course-phys101',
    courseCode: 'PHYS101',
    courseName: 'Physics I',
    credits: 4,
    type: 'ME',
    sectionId: 'sec-14',
    sectionCode: '01',
    time: 'Fri 09:00–11:00',
    weekRange: '1-18',
    room: 'S1-2-101',
    lecturer: 'Dr. Rahman',
    batchId: 'batch-2504-m1',
  },
  {
    courseId: 'course-it102',
    courseCode: 'IT102',
    courseName: 'Digital Literacy Workshop',
    credits: 2,
    type: 'ME',
    sectionId: 'sec-it102-1',
    sectionCode: '01',
    time: 'Mon 09:00–11:00',
    weekRange: '1-7',
    room: 'D5-1-105',
    lecturer: 'Ms. Ong',
    batchId: 'batch-2504-m1',
  },
].map((item, index) => ({
  ...item,
  classTime: item.classTime || deriveClassTime(item.time),
  selectedAt: `2026-04-10 ${String(9 + index).padStart(2, '0')}:${String((15 + index * 7) % 60).padStart(2, '0')}:${String((8 + index * 11) % 60).padStart(2, '0')}`,
  sourceType: 'round',
  roundKey: index % 3 === 0 ? 'preselect' : index % 3 === 1 ? 'main' : 'supplement',
  isRetake: index === 2,
}))

/** 管理端代选样例（计入选课结果 10 行；与轮次自选一并进确认半池） */
const DEMO_ADMIN_CONFIRMED_COURSES = [
  {
    courseId: 'course-bus201',
    courseCode: 'BUS201',
    courseName: 'Business Ethics',
    credits: 3,
    type: 'GE',
    sectionId: 'sec-18',
    sectionCode: '01',
    time: 'Tue 14:00–17:00',
    weekRange: '1-14',
    room: 'B3-2-101',
    lecturer: 'Dr. Hassan',
    batchId: 'batch-2504-m1',
    operatorName: 'AC Lee',
  },
  {
    courseId: 'course-mpu318',
    courseCode: 'MPU3183',
    courseName: 'Malaysian Studies',
    credits: 3,
    type: 'GE',
    sectionId: 'sec-4',
    sectionCode: '01',
    time: 'Tue 09:00–12:00',
    weekRange: '1-12',
    room: '',
    lecturer: 'Dr. Ahmad',
    batchId: 'batch-2504-g1',
    operatorName: 'AC Wong',
  },
  {
    courseId: 'course-ai110',
    courseCode: 'AI110',
    courseName: 'Introduction to AI',
    credits: 3,
    type: 'ME',
    sectionId: 'sec-ai110-1',
    sectionCode: '01',
    time: 'Mon 10:00–12:00',
    weekRange: '1-14',
    room: 'D5-4-101',
    lecturer: 'Dr. Foo',
    batchId: 'batch-2504-m1',
    operatorName: 'AC Lee',
  },
  {
    courseId: 'course-web210',
    courseCode: 'WEB210',
    courseName: 'Web Development',
    credits: 3,
    type: 'ME',
    sectionId: 'sec-web210-1',
    sectionCode: '01',
    time: 'Tue 14:00–16:00',
    weekRange: '1-14',
    room: 'D5-4-201',
    lecturer: 'Ms. Low',
    batchId: 'batch-2504-m1',
    operatorName: 'AC Wong',
  },
  {
    courseId: 'course-db110',
    courseCode: 'DB110',
    courseName: 'Intro to Databases',
    credits: 3,
    type: 'ME',
    sectionId: 'sec-db110-1',
    sectionCode: '01',
    time: 'Wed 14:00–16:00',
    weekRange: '1-14',
    room: 'D5-5-201',
    lecturer: 'Dr. Ong',
    batchId: 'batch-2504-m1',
    operatorName: 'AC Lee',
  },
].map((item, index) => ({
  ...item,
  classTime: item.classTime || deriveClassTime(item.time),
  selectedAt: `2026-04-11 ${String(10 + index).padStart(2, '0')}:${String((20 + index * 5) % 60).padStart(2, '0')}:${String((12 + index * 9) % 60).padStart(2, '0')}`,
  sourceType: 'admin',
  roundKey: '',
  isRetake: index === 1,
}))

/** 选课结果 / 我的选课成功：4 轮次自选 + 5 管理员添加 = 9 */
const DEMO_CONFIRMED_COURSES = [...DEMO_ROUND_CONFIRMED_COURSES, ...DEMO_ADMIN_CONFIRMED_COURSES]

/** 演示：排队中（与成功半池互斥课号） */
const DEMO_QUEUED_COURSE = {
  courseId: 'course-comp220',
  courseCode: 'COMP220',
  courseName: 'Discrete Mathematics',
  credits: 4,
  type: 'ME',
  sectionId: 'sec-12',
  sectionCode: '01',
  time: 'Tue 10:00–12:00',
  weekRange: '1-14',
  room: 'D5-1-301',
  lecturer: 'Dr. Ng',
  batchId: 'batch-2504-m1',
  classTime: deriveClassTime('Tue 10:00–12:00'),
}

/** 演示：选课失败 */
const DEMO_FAILED_COURSE = {
  id: 'fail-demo-engl201',
  courseId: 'course-engl201',
  courseCode: 'ENGL201',
  courseName: 'Academic Writing',
  credits: 3,
  type: 'GE',
  sectionId: 'sec-16',
  sectionCode: '01',
  time: 'Mon 09:00–12:00',
  weekRange: '1-14',
  room: 'A2-1-101',
  lecturer: 'Dr. Sarah',
  batchId: 'batch-2504-m1',
  classTime: deriveClassTime('Mon 09:00–12:00'),
  failedAt: '2026-04-10 11:22:08',
}

function parseSectionSchedule(time, courseCode) {
  const match = String(time || '').match(/^(\w+)\s+(\d+):(\d+)[–-](\d+):(\d+)/)
  if (!match) return null
  return {
    day: match[1],
    start: Number(match[2]),
    end: Number(match[4]),
    course: courseCode,
  }
}

function buildDemoSchedule(courses) {
  return courses.map((item) => parseSectionSchedule(item.time, item.courseCode)).filter(Boolean)
}

/** 学生加退课 demo：覆盖类型/状态/退课通道；学分按单覆盖，仅少量超限样本 */
function buildDemoAddDropApplications(credits, schedule) {
  const creditMax = LONG_SEMESTER_CREDIT_MAX
  const normalCredits = Math.min(Math.max(credits || 16, 12), 18)
  const baseStudent = {
    studentId: DEMO_STUDENT_ID,
    studentName: 'Tan Wei Ming',
    programme: 'SWE',
    intake: '2409',
    academicSession: '2026/04',
    currentCredits: normalCredits,
    creditMax,
    schedule: schedule.slice(0, 4),
  }

  return [
    {
      id: 'adr-xmum-01',
      applicationNo: 'ADR2509010',
      ...baseStudent,
      currentCredits: 22,
      type: 'Add',
      status: 'Pending',
      submittedAt: '2026-07-15 09:30',
      billStatus: 'pending',
      billAmount: 320,
      reason: 'Need STAT201 for programme progression (over credit max)',
      items: [{ action: 'Add', courseCode: 'STAT201', credits: 3, section: '01', time: 'Mon 14:00–16:00', fee: 320 }],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-02',
      applicationNo: 'ADR2509008',
      ...baseStudent,
      currentCredits: 14,
      type: 'Add',
      status: 'Approved',
      submittedAt: '2026-07-08 14:20',
      billStatus: 'paid',
      billAmount: 480,
      reason: 'Complete GE writing requirement',
      items: [{ action: 'Add', courseCode: 'ENGL201', credits: 3, section: '01', time: 'Wed 09:00–12:00', fee: 480 }],
      approvalLog: [{ at: '2026-07-09 10:00', actor: 'AC SWE', action: 'Approved' }],
    },
    {
      id: 'adr-xmum-03',
      applicationNo: 'ADR2509012',
      ...baseStudent,
      currentCredits: 16,
      type: 'Drop',
      status: 'Approved',
      submittedAt: '2026-07-12 16:05',
      billStatus: 'none',
      billAmount: 0,
      dropChannel: 'self',
      teachingWeek: 3,
      feeWaiver: true,
      reason: 'Workload adjustment within regular window',
      items: [{ action: 'Drop', courseCode: 'IT102', credits: 2, section: '01', time: 'Mon 09:00–11:00' }],
      approvalLog: [{ at: '2026-07-12 16:05', actor: 'Self-service', action: 'Approved' }],
    },
    {
      id: 'adr-xmum-04',
      applicationNo: 'ADR2509013',
      ...baseStudent,
      currentCredits: 16,
      type: 'Drop',
      status: 'Pending',
      submittedAt: '2026-07-13 11:40',
      billStatus: 'none',
      billAmount: 0,
      dropChannel: 'self',
      teachingWeek: 3,
      feeWaiver: false,
      reason: 'Clash with internship schedule',
      items: [{ action: 'Drop', courseCode: 'BUS201', credits: 3, section: '01', time: 'Tue 14:00–17:00' }],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-05',
      applicationNo: 'ADR2509014',
      ...baseStudent,
      currentCredits: 18,
      type: 'Drop',
      status: 'Pending',
      submittedAt: '2026-07-14 09:15',
      billStatus: 'none',
      billAmount: 0,
      dropChannel: 'special',
      teachingWeek: 8,
      feeWaiver: true,
      reason: 'Medical leave after deadline week',
      attachments: [{ name: 'medical-certificate.pdf' }],
      items: [{ action: 'Drop', courseCode: 'PHYS101', credits: 4, section: '01', time: 'Fri 09:00–11:00' }],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-06',
      applicationNo: 'ADR2509005',
      ...baseStudent,
      currentCredits: 15,
      type: 'Drop',
      status: 'Rejected',
      submittedAt: '2026-07-06 15:20',
      billStatus: 'none',
      billAmount: 0,
      dropChannel: 'special',
      teachingWeek: 9,
      feeWaiver: false,
      reason: 'Schedule conflict after add/drop deadline',
      attachments: [{ name: 'conflict-proof.pdf' }],
      items: [{ action: 'Drop', courseCode: 'MPU3183', credits: 3, section: '01', time: 'Tue 09:00–12:00' }],
      approvalLog: [{ at: '2026-07-07 09:00', actor: 'AC SWE', action: 'Rejected', comment: 'Insufficient evidence' }],
    },
    {
      id: 'adr-xmum-07',
      applicationNo: 'ADR2509015',
      ...baseStudent,
      currentCredits: 16,
      type: 'Retake',
      status: 'Pending',
      submittedAt: '2026-07-14 13:50',
      billStatus: 'pending',
      billAmount: 320,
      reason: 'Retake after failed attempt',
      items: [
        {
          action: 'Retake',
          courseCode: 'MATH201',
          credits: 4,
          section: '01',
          time: 'Thu 10:00–12:00',
          retakeGrade: 'F',
          fee: 320,
        },
      ],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-08',
      applicationNo: 'ADR2509011',
      ...baseStudent,
      currentCredits: 14,
      type: 'Retake',
      status: 'In Review',
      submittedAt: '2026-07-11 10:25',
      billStatus: 'pending',
      billAmount: 480,
      reason: 'Improve major core grade',
      items: [
        {
          action: 'Retake',
          courseCode: 'COMP201',
          credits: 4,
          section: '02',
          time: 'Wed 14:00–16:00',
          retakeGrade: 'M',
          fee: 480,
        },
      ],
      approvalLog: [{ at: '2026-07-12 08:30', actor: 'AC SWE', action: 'In Review' }],
    },
    {
      id: 'adr-xmum-09',
      applicationNo: 'ADR2509016',
      ...baseStudent,
      currentCredits: 16,
      type: 'AddDrop',
      status: 'Pending',
      submittedAt: '2026-07-14 17:00',
      billStatus: 'pending',
      billAmount: 320,
      dropChannel: 'self',
      teachingWeek: 3,
      feeWaiver: true,
      reason: 'Swap COMP101 for HUM110 in G1 humanities',
      items: [
        { action: 'Drop', courseCode: 'COMP101', credits: 4, section: '01', time: 'Thu 14:00–16:00' },
        { action: 'Add', courseCode: 'HUM110', credits: 3, section: '01', time: 'Fri 14:00–17:00', fee: 320 },
      ],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-10',
      applicationNo: 'ADR2509003',
      ...baseStudent,
      currentCredits: 15,
      type: 'AddDrop',
      status: 'Approved',
      submittedAt: '2026-07-05 11:00',
      billStatus: 'paid',
      billAmount: 480,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: false,
      reason: 'Drop MPU then add advanced algorithm elective',
      items: [
        { action: 'Drop', courseCode: 'MPU3183', credits: 3, section: '01', time: 'Tue 09:00–12:00' },
        {
          action: 'Add',
          courseCode: 'COMP3192',
          credits: 4,
          section: '01',
          time: 'Wed 14:00–16:00',
          retakeGrade: 'F',
          fee: 480,
        },
      ],
      approvalLog: [{ at: '2026-07-06 09:30', actor: 'AC SWE', action: 'Approved' }],
    },
    {
      id: 'adr-xmum-11',
      applicationNo: 'ADR2509017',
      ...baseStudent,
      currentCredits: 29,
      type: 'AddDrop',
      status: 'In Review',
      submittedAt: '2026-07-15 08:45',
      billStatus: 'pending',
      billAmount: 320,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: true,
      reason: 'Drop COMP201 then add STAT201 (over credit — second over-limit sample)',
      items: [
        { action: 'Drop', courseCode: 'COMP201', credits: 4, section: '02', time: 'Wed 14:00–16:00' },
        { action: 'Add', courseCode: 'STAT201', credits: 3, section: '01', time: 'Mon 14:00–16:00', fee: 320 },
      ],
      approvalLog: [{ at: '2026-07-15 10:00', actor: 'AC SWE', action: 'In Review' }],
    },
    {
      id: 'adr-xmum-12',
      applicationNo: 'ADR2509002',
      ...baseStudent,
      currentCredits: 16,
      type: 'Drop',
      status: 'Cancelled',
      submittedAt: '2026-07-04 16:30',
      billStatus: 'cancelled',
      billAmount: 0,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: false,
      reason: 'Cancelled after schedule reconfirmed',
      items: [{ action: 'Drop', courseCode: 'COMP101', credits: 4, section: '01', time: 'Thu 14:00–16:00' }],
      approvalLog: [{ at: '2026-07-04 17:00', actor: 'Student', action: 'Cancelled' }],
    },
  ]
}

function syncDemoAddDropApplications(credits, schedule) {
  const studentApps = addDropApprovalQueue.value.filter((app) => app.studentId === DEMO_STUDENT_ID)
  const needsReseed =
    studentApps.length < 10 ||
    studentApps.some((app) => !app.academicSession) ||
    studentApps.some((app) => app.type === 'Replace') ||
    studentApps.some((app) => String(app.submittedAt || '').includes('2025-09'))
  if (!needsReseed) return
  addDropApprovalQueue.value = addDropApprovalQueue.value.filter((app) => app.studentId !== DEMO_STUDENT_ID)
  for (const app of buildDemoAddDropApplications(credits, schedule)) {
    addDropApprovalQueue.value.push(app)
  }
}

const DEMO_WAITLIST_SPECS = [
  { courseCode: 'ENGL201', id: 'wl-xmum-01', status: 'Pending', submittedAt: '2026-04-11 10:22:15' },
  { courseCode: 'COMP3192', id: 'wl-xmum-02', status: 'Pending', submittedAt: '2026-04-12 09:18:33' },
  { courseCode: 'MATH201', id: 'wl-xmum-03', status: 'Rejected', submittedAt: '2026-04-08 14:30:00' },
  { courseCode: 'COMP201', id: 'wl-xmum-04', status: 'Approved', submittedAt: '2026-04-09 16:45:22' },
  { courseCode: 'IT102', id: 'wl-xmum-05', status: 'Pending', submittedAt: '2026-04-11 11:05:40' },
  { courseCode: 'COMP220', id: 'wl-xmum-06', status: 'Pending', submittedAt: '2026-04-13 08:40:18' },
  { courseCode: 'STAT201', id: 'wl-xmum-07', status: 'Pending', submittedAt: '2026-04-13 15:12:05' },
  { courseCode: 'HUM110', id: 'wl-xmum-08', status: 'Approved', submittedAt: '2026-04-07 13:20:44' },
]

function syncDemoWaitlistEntries() {
  const baseStudent = {
    studentId: DEMO_STUDENT_ID,
    studentName: 'Tan Wei Ming',
    programme: 'SWE',
    intake: '2409',
  }

  for (const course of waitlistCourses.value) {
    course.waitlist = course.waitlist.filter((entry) => entry.studentId !== DEMO_STUDENT_ID)
    course.waitlistCount = course.waitlist.length
  }

  for (const spec of DEMO_WAITLIST_SPECS) {
    const course = waitlistCourses.value.find((item) => item.courseCode === spec.courseCode)
    if (!course) continue
    course.waitlist.push({
      id: spec.id,
      ...baseStudent,
      position: course.waitlist.length + 1,
      status: spec.status,
      submittedAt: spec.submittedAt,
    })
    course.waitlistCount = course.waitlist.length
  }
}

function syncDemoMonitor(courses) {
  const credits = courses.reduce((sum, item) => sum + (item.credits || 0), 0)
  const schedule = buildDemoSchedule(courses)
  const status =
    credits === 0
      ? 'notRegistered'
      : credits < LONG_SEMESTER_CREDIT_MIN
        ? 'creditLow'
        : credits > LONG_SEMESTER_CREDIT_MAX
          ? 'creditHigh'
          : 'normal'
  const issues =
    credits === 0
      ? ['notRegistered']
      : credits < LONG_SEMESTER_CREDIT_MIN
        ? ['creditBelowMin']
        : credits > LONG_SEMESTER_CREDIT_MAX
          ? ['creditAboveMax']
          : []

  const existingIndex = registrationMonitorQueue.value.findIndex((r) => r.studentId === DEMO_STUDENT_ID)
  const base = {
    id: 'mon-xmum-demo',
    studentId: DEMO_STUDENT_ID,
    studentName: 'Tan Wei Ming',
    programme: 'SWE',
    intake: '2409',
    credits,
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    status,
    tags: ['senior'],
    // 历史先修：MATH101 已通过；STAT100 曾修但不及格（演示「成绩不及格」）
    passedCourses: ['MATH101'],
    failedCourses: ['STAT100'],
    cgpa: 3.42,
    g1Progress: {
      humanities: 4,
      business: 3,
      required: { humanities: 6, business: 6 },
    },
    schedule,
    issues,
    history: [
      { at: '28-Aug-2025', action: 'Pre-registration: COMP101 sec 01 (random assign)' },
      { at: '29-Aug-2025', action: 'Main round — half pool confirmed (demo seed)' },
    ],
  }
  if (existingIndex === -1) {
    registrationMonitorQueue.value.unshift(base)
  } else {
    registrationMonitorQueue.value[existingIndex] = {
      ...registrationMonitorQueue.value[existingIndex],
      ...base,
    }
  }
}

let seeded = false

export function seedStudentRegistrationDemo() {
  // 固定 9 条已确认：4 轮次自选 + 5 管理员添加；缺来源字段则重灌
  const needsReseed =
    studentConfirmedCourses.value.length !== 9 ||
    studentConfirmedCourses.value.some((item) => !item.selectedAt || !item.sourceType) ||
    !studentConfirmedCourses.value.some((item) => item.courseCode === 'BUS201' && item.sourceType === 'admin')
  if (needsReseed) {
    studentConfirmedCourses.value = DEMO_CONFIRMED_COURSES.map((item) => ({ ...item }))
    studentSchedule.value = buildDemoSchedule(studentConfirmedCourses.value)
    syncDemoMonitor(studentConfirmedCourses.value)
  }

  // 第一轮「本轮选课情况」demo：排队中 + 待分配（不计学分）；不灌失败态
  if (!pendingRegistration.value) {
    pendingRegistration.value = { ...DEMO_QUEUED_COURSE }
  }
  if (!studentPendingAssignCourses.value.length) {
    studentPendingAssignCourses.value = DEMO_ROUND_CONFIRMED_COURSES.map((item, index) => ({
      ...item,
      id: `pending-demo-${item.courseId}`,
      classTime: item.classTime || deriveClassTime(item.time),
      selectedAt: `2026-04-10 ${String(9 + index).padStart(2, '0')}:15:00`,
      sourceType: 'preselect',
      roundKey: 'preselect',
    }))
  }
  if (!studentFailedRegistrations.value.length) {
    studentFailedRegistrations.value = [{ ...DEMO_FAILED_COURSE }]
  }

  syncDemoAddDropApplications(
    studentConfirmedCourses.value.reduce((sum, item) => sum + (item.credits || 0), 0),
    buildDemoSchedule(studentConfirmedCourses.value),
  )
  syncDemoWaitlistEntries()

  if (seeded) return
  seeded = true

  if (!registrationMonitorQueue.value.some((r) => r.studentId === DEMO_STUDENT_ID)) {
    syncDemoMonitor(studentConfirmedCourses.value)
  } else {
    // 确保已有监控行带上 passedCourses
    const idx = registrationMonitorQueue.value.findIndex((r) => r.studentId === DEMO_STUDENT_ID)
    if (idx >= 0) {
      const row = registrationMonitorQueue.value[idx]
      registrationMonitorQueue.value[idx] = {
        ...row,
        passedCourses: row.passedCourses?.length ? row.passedCourses : ['MATH101'],
        failedCourses: row.failedCourses?.length ? row.failedCourses : ['STAT100'],
      }
    }
  }
}
