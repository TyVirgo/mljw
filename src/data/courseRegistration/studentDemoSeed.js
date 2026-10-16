import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import {
  studentConfirmedCourses,
  studentRequiredCourses,
  studentSchedule,
  studentPendingAssignCourses,
} from './studentRegistrationStore.js'
import { addDropApprovalQueue } from './addDropApprovalQueue.js'
import { waitlistCourses } from './waitlistQueue.js'
import { DEFAULT_MOCK_CURRENT_STUDENT_ID } from '../mockCurrentStudent.js'
import { resolveTermCreditMax, resolveTermCreditMin } from './registrationRules.js'
import { deriveClassTime } from './sectionScheduleFields.js'
import {
  enrichAddDropApplicationSchedule,
} from './addDropScheduleDemo.js'
import {
  seedVolunteerRegisterDemo,
} from './studentVolunteerSheet.js'
import { getCourseById, resolveSchoolElectiveCategory, syncSelectableSectionsFromConfirmed } from './selectableCourses.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { sumLiveMeGroupCredits } from './studentRegistrationContext.js'
import { creditCapForCourseType, getTermCreditCaps } from './studentAudience.js'

const DEMO_STUDENT_ID = DEFAULT_MOCK_CURRENT_STUDENT_ID

/**
 * 轮次自选成功半池 — 按批次分档挂载，历轮按类型+roundKey 跨档同步
 * ME：R1 中签 COMP201+SE201+AI110（preselect/m1）+ R2 CST201（cst-i/main）+ R3 CYS201（cys-i/supplement）
 * GE 学分累计（不含 admin）：R1=HUM201(2)；R2=+BUS301(2)→4；R3=+MPU401(2)→6（≤geMax；超则动态不加）
 * R1 本轮=pending；R2/R3 本轮=当前轮确认、历轮=更早轮确认；课表虚线≡本轮、实线≡历轮+必修
 * 另：GE 代选 BUS201 挂 g2（不进本轮选课/学分累计）
 */
const DEMO_TERM_ACADEMIC_SESSION = '2026/09'

/** 轮次序号：用于增量 demo 按轮写入 */
const DEMO_ROUND_ORDER = { preselect: 0, main: 1, supplement: 2 }

const DEMO_ROUND_CONFIRMED_COURSES = [
  {
    courseId: 'course-hum-demo-1',
    courseCode: 'HUM201',
    courseName: '哲学与当代议题',
    courseNameEn: 'Philosophy and Current Issues',
    credits: 2,
    type: 'GE',
    sectionId: 'sec-hum-demo-1-1',
    sectionCode: '01',
    time: 'Tue 08:00–10:00',
    weekRange: '1-18',
    room: 'B2-2-201',
    lecturer: 'Dr. James Whitfield',
    lecturerEn: 'Dr. James Whitfield',
    batchId: 'batch-2504-g1',
    schoolElectiveCategory: 'business',
    roundKey: 'preselect',
    meetings: [{ time: 'Tue 08:00–10:00', room: 'B2-2-201', weekRange: '1-18' }],
  },
  {
    courseId: 'course-comp201',
    courseCode: 'COMP201',
    courseName: '数据结构',
    courseNameEn: 'Data Structures',
    credits: 4,
    type: 'ME',
    sectionId: 'sec-comp201-3',
    sectionCode: '03',
    time: 'Wed 11:00–13:00',
    weekRange: '1-18',
    room: 'D5-3-203',
    lecturer: 'Dr. Yap',
    lecturerEn: 'Dr. Yap',
    batchId: 'batch-2504-m1',
    schoolElectiveCategory: 'science',
    roundKey: 'preselect',
    meetings: [{ time: 'Wed 11:00–13:00', room: 'D5-3-203', weekRange: '1-18' }],
  },
  {
    courseId: 'course-se201',
    courseCode: 'SE201',
    courseName: '软件工程导论',
    courseNameEn: 'Intro to Software Engineering',
    credits: 3,
    type: 'ME',
    sectionId: 'sec-se201-1',
    sectionCode: '01',
    time: 'Wed 14:00–16:00',
    weekRange: '1-18',
    room: 'D5-1-301',
    lecturer: 'Dr. Lee',
    lecturerEn: 'Dr. Lee',
    batchId: 'batch-2504-m1',
    schoolElectiveCategory: 'arts',
    roundKey: 'preselect',
    meetings: [{ time: 'Wed 14:00–16:00', room: 'D5-1-301', weekRange: '1-18' }],
  },
  {
    courseId: 'course-ai110',
    courseCode: 'AI110',
    courseName: 'Introduction to AI',
    courseNameEn: 'Introduction to AI',
    courseNameZh: '人工智能导论',
    credits: 3,
    type: 'ME',
    sectionId: 'sec-ai110-1',
    sectionCode: '01',
    time: 'Fri 08:00–10:00',
    weekRange: '1-18',
    room: 'D5-4-101',
    lecturer: 'Dr. Foo',
    lecturerEn: 'Dr. Foo',
    batchId: 'batch-2504-m1',
    schoolElectiveCategory: 'science',
    roundKey: 'preselect',
    meetings: [{ time: 'Fri 08:00–10:00', room: 'D5-4-101', weekRange: '1-18' }],
  },
  {
    courseId: 'course-cst-demo-1',
    courseCode: 'CST201',
    courseName: '离散结构',
    courseNameEn: 'Discrete Structures',
    credits: 2,
    type: 'ME',
    sectionId: 'sec-cst-demo-1-1',
    sectionCode: '01',
    time: 'Thu 10:00–12:00',
    weekRange: '1-18',
    room: 'B2-2-201',
    lecturer: 'Dr. James Whitfield',
    lecturerEn: 'Dr. James Whitfield',
    batchId: 'batch-me-cst-i',
    schoolElectiveCategory: 'science',
    roundKey: 'main',
    meetings: [{ time: 'Thu 10:00–12:00', room: 'B2-2-201', weekRange: '1-18' }],
  },
  {
    courseId: 'course-cys-demo-1',
    courseCode: 'CYS201',
    courseName: '网络安全',
    courseNameEn: 'Network Security',
    credits: 2,
    type: 'ME',
    sectionId: 'sec-cys-demo-1-1',
    sectionCode: '01',
    time: 'Mon 14:00–16:00',
    weekRange: '1-18',
    room: 'B2-2-201',
    lecturer: 'Dr. James Whitfield',
    lecturerEn: 'Dr. James Whitfield',
    batchId: 'batch-me-cys-i',
    schoolElectiveCategory: 'science',
    roundKey: 'supplement',
    meetings: [{ time: 'Mon 14:00–16:00', room: 'B2-2-201', weekRange: '1-18' }],
  },
  {
    courseId: 'course-bus-demo-1',
    courseCode: 'BUS301',
    courseName: '管理学原理',
    courseNameEn: 'Principles of Management',
    credits: 2,
    type: 'GE',
    sectionId: 'sec-bus-demo-1-1',
    sectionCode: '01',
    /** 避开 ME R3 CYS201 Mon 14–16，保证「全部课程结果」课表无冲突 */
    time: 'Tue 10:00–12:00',
    weekRange: '1-18',
    room: 'B2-2-201',
    lecturer: 'Dr. James Whitfield',
    lecturerEn: 'Dr. James Whitfield',
    batchId: 'batch-2504-g2',
    schoolElectiveCategory: 'business',
    roundKey: 'main',
    meetings: [{ time: 'Tue 10:00–12:00', room: 'B2-2-201', weekRange: '1-18' }],
  },
  {
    courseId: 'course-mpu-demo-1',
    courseCode: 'MPU401',
    courseName: '廉正与反贪腐',
    courseNameEn: 'Integrity and Anti-Corruption',
    credits: 2,
    type: 'GE',
    sectionId: 'sec-mpu-demo-1-1',
    sectionCode: '01',
    time: 'Wed 16:00–18:00',
    weekRange: '1-18',
    room: 'B2-2-201',
    lecturer: 'Dr. James Whitfield',
    lecturerEn: 'Dr. James Whitfield',
    batchId: 'batch-2504-g3',
    schoolElectiveCategory: 'arts',
    roundKey: 'supplement',
    meetings: [{ time: 'Wed 16:00–18:00', room: 'B2-2-201', weekRange: '1-18' }],
  },
].map((item, index) => ({
  ...item,
  classTime: item.classTime || deriveClassTime(item.time),
  selectedAt: `2026-04-10 ${String(9 + (index % 8)).padStart(2, '0')}:${String((15 + index * 7) % 60).padStart(2, '0')}:${String((8 + index * 11) % 60).padStart(2, '0')}`,
  sourceType: item.roundKey === 'preselect' ? 'preselect' : 'round',
  roundKey: item.roundKey || 'main',
  isRetake: false,
}))

/** R1 基线确认课（含 SE201 中签）；不含 R2/R3 增量 */
const DEMO_BASE_ROUND_COURSES = DEMO_ROUND_CONFIRMED_COURSES.filter(
  (item) => item.roundKey === 'preselect',
)

/** 每轮默认增量一门（GE/ME 的 main/supplement）；按学分帽动态纳入 */
const DEMO_INCREMENTAL_ROUND_COURSES = DEMO_ROUND_CONFIRMED_COURSES.filter(
  (item) => item.roundKey === 'main' || item.roundKey === 'supplement',
)

/**
 * 管理端代选样例：BUS201 挂 GE R2 批（sourceType=admin）
 * 不计入 GE「本轮选课」累计（R2=HUM201+BUS301→4；R3=+MPU401→6）
 * credits 用 1 控学期演示帽；课库可为 3，本轮表不展示代选故无双口径
 */
const DEMO_ADMIN_CONFIRMED_COURSES = [
  {
    courseId: 'course-bus201',
    courseCode: 'BUS201',
    courseName: '商业伦理',
    courseNameEn: 'Business Ethics',
    credits: 1,
    type: 'GE',
    sectionId: 'sec-18',
    sectionCode: '01',
    time: 'Tue 14:00–17:00',
    weekRange: '1-14',
    room: 'B3-2-101',
    lecturer: '哈桑博士',
    lecturerEn: 'Dr. Hassan',
    batchId: 'batch-2504-g2',
    operatorName: 'AC Lee',
    schoolElectiveCategory: 'ai_open',
    meetings: [{ time: 'Tue 14:00–17:00', room: 'B3-2-101', weekRange: '1-14' }],
  },
].map((item, index) => ({
  ...item,
  classTime: item.classTime || deriveClassTime(item.time),
  selectedAt: `2026-04-11 ${String(10 + index).padStart(2, '0')}:${String((20 + index * 5) % 60).padStart(2, '0')}:${String((12 + index * 9) % 60).padStart(2, '0')}`,
  sourceType: 'admin',
  roundKey: '',
  isRetake: false,
}))

/** 选课结果 / 我的选课：ME+GE 分批确认课 + 1 管理员代选 */
const DEMO_CONFIRMED_COURSES = [...DEMO_ROUND_CONFIRMED_COURSES, ...DEMO_ADMIN_CONFIRMED_COURSES]

/**
 * Demo 必修底图（字段同选修确认课；不进确认半池、不计选修学分帽）
 * 含周六晚课，验收周末列与 22 点前时段
 */
export const DEMO_REQUIRED_COURSES = [
  {
    courseId: 'course-math101',
    courseCode: 'MATH101',
    courseName: 'Calculus I',
    courseNameEn: 'Calculus I',
    courseNameZh: '微积分 I',
    credits: 4,
    type: 'CORE',
    sectionId: 'sec-math101-1',
    sectionCode: '01',
    time: 'Wed 09:00–11:00',
    weekRange: '1-14',
    room: 'A1-2-201',
    lecturer: '陈教授',
    lecturerEn: 'Prof. Chen',
    batchId: 'batch-2504-m1',
    classTime: deriveClassTime('Wed 09:00–11:00'),
    selectedAt: '2026-03-01 08:00:00',
    sourceType: 'required',
    roundKey: '',
    isRetake: false,
  },
  {
    courseId: 'course-phys101',
    courseCode: 'PHYS101',
    courseName: 'Physics I',
    courseNameEn: 'Physics I',
    courseNameZh: '工程物理',
    credits: 3,
    type: 'CORE',
    sectionId: 'sec-phys101-1',
    sectionCode: '01',
    time: 'Sat 18:00–20:00',
    weekRange: '1-14',
    room: 'A2-1-105',
    lecturer: '黄博士',
    lecturerEn: 'Dr. Wong',
    batchId: 'batch-2504-m1',
    classTime: deriveClassTime('Sat 18:00–20:00'),
    selectedAt: '2026-03-01 08:00:00',
    sourceType: 'required',
    roundKey: '',
    isRetake: false,
  },
  /**
   * 无排课时段实习课：我的选课 list 有行，课表不画格
   */
  {
    courseId: 'course-int300',
    courseCode: 'INT300',
    courseName: '专业实习',
    courseNameEn: 'Professional Internship',
    credits: 2,
    type: 'CORE',
    sectionId: 'sec-int300-1',
    sectionCode: '01',
    time: '',
    weekRange: '1-18',
    room: '',
    lecturer: '实习指导老师',
    lecturerEn: 'Internship Supervisor',
    batchId: '',
    academicSession: DEMO_TERM_ACADEMIC_SESSION,
    classTime: '',
    meetings: [],
    selectedAt: '2026-03-01 08:00:00',
    sourceType: 'required',
    roundKey: '',
    isRetake: false,
  },
]

const DEMO_CONFIRMED_COUNT = DEMO_CONFIRMED_COURSES.length

/**
 * 是否为 R2/R3 默认增量 demo 课（按学分帽可剔除）
 * @param {object} item
 */
function isIncrementalDemoConfirmed(item) {
  if (!item) return false
  return DEMO_INCREMENTAL_ROUND_COURSES.some(
    (demo) =>
      demo.courseId === item.courseId &&
      demo.batchId === item.batchId &&
      demo.roundKey === item.roundKey,
  )
}

/**
 * 同类型已选学分（不含 admin）
 * @param {object[]} courses
 * @param {string} type
 */
function sumTypeCreditsExcludingAdmin(courses, type) {
  const kind = normalizeRegistrationType(type)
  return (courses || []).reduce((sum, item) => {
    if (!item || item.sourceType === 'admin') return sum
    if (normalizeRegistrationType(item.type) !== kind) return sum
    return sum + (Number(item.credits) || 0)
  }, 0)
}

/**
 * 按 GE/ME 学期学分帽处理每轮默认增量课
 * @param {{ allowAdd?: boolean }} [options] allowAdd=true 仅首次 seed：可写入缺省增量课；
 *   false（运行期）：只保留仍不超帽的已有增量课，退课腾学分也不回填
 */
export function reconcileIncrementalDemoConfirmedCourses(options = {}) {
  const allowAdd = options.allowAdd === true
  const caps = getTermCreditCaps()
  const kept = studentConfirmedCourses.value.filter((item) => !isIncrementalDemoConfirmed(item))
  const sortIncremental = (a, b) =>
    (DEMO_ROUND_ORDER[a.roundKey] ?? 99) - (DEMO_ROUND_ORDER[b.roundKey] ?? 99) ||
    String(a.type).localeCompare(String(b.type))

  const candidates = allowAdd
    ? [...DEMO_INCREMENTAL_ROUND_COURSES].sort(sortIncremental)
    : studentConfirmedCourses.value
        .filter((item) => isIncrementalDemoConfirmed(item))
        .slice()
        .sort(sortIncremental)

  const next = [...kept]
  for (const demo of candidates) {
    const cap = Number(creditCapForCourseType(demo.type, caps)) || 0
    const current = sumTypeCreditsExcludingAdmin(next, demo.type)
    if (current + (Number(demo.credits) || 0) <= cap) {
      next.push({ ...demo })
    }
  }
  const prevKey = studentConfirmedCourses.value
    .map((item) => `${item.courseId}|${item.sectionId}|${item.roundKey}`)
    .join(';')
  const nextKey = next.map((item) => `${item.courseId}|${item.sectionId}|${item.roundKey}`).join(';')
  if (prevKey === nextKey) return
  studentConfirmedCourses.value = next
  studentSchedule.value = buildDemoSchedule(next)
  syncSelectableSectionsFromConfirmed(next)
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

/** 学生加退课 demo：覆盖类型/状态；dropChannel 仍供业务逻辑，详情不再展示；学分按单覆盖，仅少量超限样本 */
function buildDemoAddDropApplications(credits, schedule) {
  const creditMax = resolveTermCreditMax(DEMO_TERM_ACADEMIC_SESSION)
  const creditMin = resolveTermCreditMin(DEMO_TERM_ACADEMIC_SESSION)
  const normalCredits = Math.min(Math.max(credits || 16, creditMin), Math.max(creditMax - 2, creditMin))
  const baseStudent = {
    studentId: DEMO_STUDENT_ID,
    studentName: 'Tan Wei Ming',
    programme: 'SWE',
    programmeName: 'Software Engineering',
    intake: '2409',
    academicSession: DEMO_TERM_ACADEMIC_SESSION,
    contactPhone: '0123456789',
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
      submittedAt: '2026-07-15 09:30:00',
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
      submittedAt: '2026-07-08 14:20:00',
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
      submittedAt: '2026-07-12 16:05:00',
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
      submittedAt: '2026-07-13 11:40:00',
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
      submittedAt: '2026-07-14 09:15:00',
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
      submittedAt: '2026-07-06 15:20:00',
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
      submittedAt: '2026-07-14 13:50:00',
      currentCredits: 22,
      billStatus: 'pending',
      billAmount: 320,
      reason: 'Retake after failed attempt',
      addNotes: '希望安排在上午时段，方便兼顾实习。',
      retakeType: 'failed',
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
      currentCredits: 22,
      type: 'Retake',
      status: 'Approved',
      submittedAt: '2026-07-11 10:25:00',
      billStatus: 'pending',
      billAmount: 480,
      reason: 'Improve major core grade',
      addNotes: '提升成绩重修，无额外说明。',
      retakeType: 'improve_grade',
      items: [
        {
          action: 'Retake',
          courseCode: 'COMP201',
          credits: 4,
          section: '02',
          /** 避开 COMP3192 Wed 14–16，保证「申请」Tab 课表无冲突 */
          time: 'Tue 12:00–14:00',
          room: 'A1-2-201',
          weekRange: '1-16',
          retakeGrade: 'M',
          fee: 480,
        },
      ],
      approvalLog: [{ at: '2026-07-12 09:00', actor: 'AC SWE', action: 'Approved' }],
    },
    {
      id: 'adr-xmum-retakedrop-01',
      applicationNo: 'ADR2509028',
      ...baseStudent,
      currentCredits: 22,
      type: 'RetakeDrop',
      status: 'Pending',
      submittedAt: '2026-07-16 11:20:00',
      billStatus: 'pending',
      billAmount: 1100,
      excessCredits: 2,
      dropChannel: 'self',
      teachingWeek: 3,
      feeWaiver: true,
      reason: 'Credit load full — drop IT102 then retake MATH201',
      addNotes: '退 IT102 腾学分后重修线性代数。',
      gradeEarned: 'F',
      academicSessionTaken: '2025/09',
      previousCourseGradesText: '2025/09 45分\n2024/09 缺考',
      retakeType: 'failed',
      items: [
        { action: 'Drop', courseCode: 'IT102', credits: 2, section: '01', time: 'Mon 09:00–11:00' },
        {
          action: 'Retake',
          courseCode: 'MATH201',
          credits: 4,
          section: '01',
          sectionName: '分组名称01',
          time: 'Thu 10:00–12:00',
          retakeGrade: 'F',
          fee: 1100,
        },
      ],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-retakedrop-02',
      applicationNo: 'ADR2509030',
      ...baseStudent,
      currentCredits: 22,
      type: 'RetakeDrop',
      status: 'Approved',
      submittedAt: '2026-07-14 10:05:00',
      billStatus: 'pending',
      billAmount: 550,
      excessCredits: 1,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: true,
      reason: 'Retake COMP201 with elective drop (non-clash slot)',
      gradeEarned: 'F',
      academicSessionTaken: '2024/09',
      previousCourseGradesText: '2024/09 42分',
      retakeType: 'failed',
      items: [
        { action: 'Drop', courseCode: 'ENGL201', credits: 3, section: '01', time: 'Wed 09:00–12:00' },
        {
          action: 'Retake',
          courseCode: 'COMP201',
          credits: 4,
          section: '02',
          sectionName: '分组名称02',
          time: 'Tue 12:00–14:00',
          room: 'A1-2-201',
          weekRange: '1-16',
          retakeGrade: 'F',
          fee: 550,
        },
      ],
      approvalLog: [{ at: '2026-07-14 16:00', actor: 'AC SWE', action: 'Approved' }],
    },
    {
      id: 'adr-xmum-retakedrop-03',
      applicationNo: 'ADR2509031',
      ...baseStudent,
      currentCredits: 21,
      type: 'RetakeDrop',
      status: 'Approved',
      submittedAt: '2026-07-10 09:30:00',
      billStatus: 'none',
      billAmount: 0,
      excessCredits: 0,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: true,
      reason: 'Full credit offset after linked drop',
      gradeEarned: 'D',
      academicSessionTaken: '2024/09',
      previousCourseGradesText: '2024/09 60分',
      retakeType: 'improve_grade',
      items: [
        { action: 'Drop', courseCode: 'HUM110', credits: 3, section: '01', time: 'Fri 09:00–12:00' },
        {
          action: 'Retake',
          courseCode: 'STAT201',
          credits: 3,
          section: '02',
          sectionName: '分组名称02',
          time: 'Thu 16:00–18:00',
          room: 'B2-1-105',
          weekRange: '1-16',
          retakeGrade: 'D',
          fee: 0,
        },
      ],
      approvalLog: [{ at: '2026-07-10 16:40', actor: 'AC SWE', action: 'Approved' }],
    },
    {
      id: 'adr-xmum-retakedrop-04',
      applicationNo: 'ADR2509032',
      ...baseStudent,
      currentCredits: 22,
      type: 'RetakeDrop',
      status: 'Rejected',
      submittedAt: '2026-07-09 14:20:00',
      billStatus: 'none',
      billAmount: 0,
      /** 已驳回：不计毕业计费/账单，避免详情「超出>0 费用=0」 */
      excessCredits: 0,
      billableCredits: 0,
      dropChannel: 'self',
      teachingWeek: 3,
      feeWaiver: false,
      reason: 'No fee waiver; clash unresolved',
      dropReason: 'No fee waiver; clash unresolved',
      gradeEarned: 'F',
      academicSessionTaken: '2023/09',
      previousCourseGradesText: '2023/09 45分',
      retakeType: 'failed',
      items: [
        { action: 'Drop', courseCode: 'BUS201', credits: 3, section: '01', time: 'Tue 14:00–17:00' },
        {
          action: 'Retake',
          courseCode: 'PHYS101',
          credits: 4,
          section: '01',
          sectionName: '分组名称01',
          time: 'Tue 14:00–17:00',
          retakeGrade: 'F',
          fee: 2200,
        },
      ],
      approvalLog: [
        { at: '2026-07-09 18:00', actor: 'AC SWE', action: 'Rejected', comment: 'Timetable clash' },
      ],
    },
    {
      id: 'adr-xmum-retakedrop-05',
      applicationNo: 'ADR2509033',
      ...baseStudent,
      currentCredits: 22,
      type: 'RetakeDrop',
      status: 'Cancelled',
      submittedAt: '2026-07-08 11:00:00',
      billStatus: 'cancelled',
      billAmount: 550,
      excessCredits: 1,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: true,
      reason: 'Cancelled retake-drop before review',
      gradeEarned: 'F',
      academicSessionTaken: '2025/09',
      previousCourseGradesText: '2025/09 45分\n2024/09 60分',
      retakeType: 'failed',
      items: [
        { action: 'Drop', courseCode: 'SCI110', credits: 3, section: '01', time: 'Wed 14:00–17:00' },
        {
          action: 'Retake',
          courseCode: 'MATH201',
          credits: 4,
          section: '01',
          sectionName: '分组名称01',
          time: 'Mon 09:00–11:00',
          retakeGrade: 'F',
          fee: 550,
        },
      ],
      approvalLog: [{ at: '2026-07-08 20:00', actor: 'Student', action: 'Cancelled' }],
    },
    {
      id: 'adr-xmum-retakedrop-06',
      applicationNo: 'ADR2509034',
      ...baseStudent,
      currentCredits: 20,
      type: 'RetakeDrop',
      status: 'Pending',
      submittedAt: '2026-07-15 16:45:00',
      billStatus: 'pending',
      billAmount: 0,
      excessCredits: 0,
      dropChannel: 'self',
      teachingWeek: 4,
      feeWaiver: true,
      reason: 'Retake ENGL201 with full credit offset from SCI110',
      gradeEarned: 'D',
      academicSessionTaken: '2024/09',
      previousCourseGradesText: '2024/09 60分',
      retakeType: 'improve_grade',
      items: [
        { action: 'Drop', courseCode: 'SCI110', credits: 3, section: '02', time: 'Fri 14:00–16:00' },
        {
          action: 'Retake',
          courseCode: 'ENGL201',
          credits: 3,
          section: '02',
          sectionName: '分组名称02',
          time: 'Wed 09:00–12:00',
          room: 'C1-3-102',
          weekRange: '1-16',
          retakeGrade: 'D',
          fee: 0,
        },
      ],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-09',
      applicationNo: 'ADR2509016',
      ...baseStudent,
      currentCredits: 16,
      type: 'AddDrop',
      status: 'Pending',
      submittedAt: '2026-07-14 17:00:00',
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
      submittedAt: '2026-07-05 11:00:00',
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
          /** 课库 sec03：避开 SE201 Wed14–16、CST201 Thu10–12（与课库一致） */
          section: '03',
          time: 'Mon 08:00–10:00',
          room: 'D5-3-303',
          weekRange: '1-18',
          lecturer: 'Dr. Lim',
          type: 'ME',
          schoolElectiveCategory: 'arts',
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
      status: 'Pending',
      submittedAt: '2026-07-15 08:45:00',
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
      approvalLog: [],
    },
    {
      id: 'adr-xmum-12',
      applicationNo: 'ADR2509002',
      ...baseStudent,
      currentCredits: 16,
      type: 'Drop',
      status: 'Cancelled',
      submittedAt: '2026-07-04 16:30:00',
      billStatus: 'cancelled',
      billAmount: 0,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: false,
      reason: 'Cancelled after schedule reconfirmed',
      items: [{ action: 'Drop', courseCode: 'COMP101', credits: 4, section: '01', time: 'Thu 14:00–16:00' }],
      approvalLog: [{ at: '2026-07-04 17:00', actor: 'Student', action: 'Cancelled' }],
    },
    {
      id: 'adr-xmum-13',
      applicationNo: 'ADR2509018',
      ...baseStudent,
      type: 'Add',
      status: 'Pending',
      submittedAt: '2026-07-16 10:00:00',
      currentCredits: 22,
      billStatus: 'pending',
      billAmount: 1500,
      reason: 'Add HUM110 GE overload sample',
      items: [{ action: 'Add', courseCode: 'HUM110', credits: 3, section: '01', time: 'Fri 09:00–12:00', fee: 1500 }],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-14',
      applicationNo: 'ADR2509019',
      ...baseStudent,
      type: 'Add',
      status: 'Rejected',
      submittedAt: '2026-07-03 09:20:00',
      billStatus: 'none',
      billAmount: 0,
      reason: 'Rejected overload request',
      items: [{ action: 'Add', courseCode: 'COMP220', credits: 3, section: '01', time: 'Tue 10:00–12:00', fee: 1650 }],
      approvalLog: [{ at: '2026-07-03 15:00', actor: 'AC SWE', action: 'Rejected', comment: 'Credit max' }],
    },
    {
      id: 'adr-xmum-15',
      applicationNo: 'ADR2509020',
      ...baseStudent,
      type: 'Add',
      status: 'Cancelled',
      submittedAt: '2026-07-02 08:10:00',
      currentCredits: 22,
      billStatus: 'cancelled',
      billAmount: 1600,
      reason: 'Student cancelled add before payment',
      items: [{ action: 'Add', courseCode: 'WEB210', credits: 3, section: '01', time: 'Wed 14:00–17:00', fee: 1600 }],
      approvalLog: [{ at: '2026-07-02 18:00', actor: 'Student', action: 'Cancelled' }],
    },
    {
      id: 'adr-xmum-16',
      applicationNo: 'ADR2509021',
      ...baseStudent,
      type: 'Drop',
      status: 'Pending',
      submittedAt: '2026-07-16 14:30:00',
      billStatus: 'none',
      billAmount: 0,
      dropChannel: 'special',
      teachingWeek: 7,
      feeWaiver: true,
      reason: 'Special drop awaiting Academic Coordinator review',
      attachments: [{ name: 'advisor-note.pdf' }],
      items: [{ action: 'Drop', courseCode: 'ENGL201', credits: 3, section: '01', time: 'Wed 09:00–12:00' }],
      approvalLog: [],
    },
    {
      id: 'adr-xmum-17',
      applicationNo: 'ADR2509022',
      ...baseStudent,
      type: 'Drop',
      status: 'Rejected',
      submittedAt: '2026-07-01 11:00:00',
      billStatus: 'none',
      billAmount: 0,
      dropChannel: 'special',
      teachingWeek: 10,
      feeWaiver: false,
      reason: 'Second rejected special drop sample',
      items: [{ action: 'Drop', courseCode: 'STAT201', credits: 3, section: '01', time: 'Mon 14:00–16:00' }],
      approvalLog: [{ at: '2026-07-01 16:00', actor: 'AC SWE', action: 'Rejected', comment: 'Late evidence' }],
    },
    {
      id: 'adr-xmum-18',
      applicationNo: 'ADR2509023',
      ...baseStudent,
      type: 'Retake',
      status: 'Approved',
      submittedAt: '2026-07-05 13:00:00',
      currentCredits: 22,
      billStatus: 'paid',
      billAmount: 2200,
      reason: 'Approved retake MATH201',
      items: [
        {
          action: 'Retake',
          courseCode: 'MATH201',
          credits: 4,
          section: '02',
          time: 'Fri 14:00–16:00',
          room: 'D5-1-111',
          weekRange: '1-18',
          lecturer: 'Dr. Ng',
          retakeGrade: 'F',
          fee: 2200,
        },
      ],
      retakeType: 'failed',
      approvalLog: [{ at: '2026-07-06 09:00', actor: 'AC SWE', action: 'Approved' }],
    },
    {
      id: 'adr-xmum-19',
      applicationNo: 'ADR2509024',
      ...baseStudent,
      type: 'Retake',
      status: 'Rejected',
      submittedAt: '2026-07-04 10:40:00',
      billStatus: 'none',
      billAmount: 0,
      reason: 'Rejected grade-improve retake',
      items: [
        {
          action: 'Retake',
          courseCode: 'COMP101',
          credits: 4,
          section: '01',
          time: 'Mon 09:00–12:00',
          retakeGrade: 'C',
          fee: 2000,
        },
      ],
      retakeType: 'improve_grade',
      approvalLog: [{ at: '2026-07-04 17:30', actor: 'AC SWE', action: 'Rejected', comment: 'Seat full' }],
    },
    {
      id: 'adr-xmum-20',
      applicationNo: 'ADR2509025',
      ...baseStudent,
      type: 'Retake',
      status: 'Cancelled',
      submittedAt: '2026-07-03 12:00:00',
      currentCredits: 22,
      billStatus: 'cancelled',
      billAmount: 2200,
      reason: 'Cancelled retake before bill paid',
      items: [
        {
          action: 'Retake',
          courseCode: 'PHYS101',
          credits: 4,
          section: '01',
          time: 'Tue 14:00–17:00',
          retakeGrade: 'F',
          fee: 2200,
        },
      ],
      retakeType: 'failed',
      approvalLog: [{ at: '2026-07-03 19:00', actor: 'Student', action: 'Cancelled' }],
    },
    {
      id: 'adr-xmum-21',
      applicationNo: 'ADR2509026',
      ...baseStudent,
      type: 'AddDrop',
      status: 'Rejected',
      submittedAt: '2026-07-07 09:50:00',
      billStatus: 'none',
      billAmount: 0,
      dropChannel: 'self',
      teachingWeek: 3,
      feeWaiver: false,
      reason: 'Rejected linked swap',
      items: [
        { action: 'Drop', courseCode: 'IT102', credits: 2, section: '01', time: 'Mon 09:00–11:00' },
        { action: 'Add', courseCode: 'STAT201', credits: 3, section: '01', time: 'Mon 14:00–16:00', fee: 1650 },
      ],
      approvalLog: [{ at: '2026-07-07 14:00', actor: 'AC SWE', action: 'Rejected', comment: 'Clash unresolved' }],
    },
    {
      id: 'adr-xmum-22',
      applicationNo: 'ADR2509027',
      ...baseStudent,
      type: 'AddDrop',
      status: 'Cancelled',
      submittedAt: '2026-07-06 08:20:00',
      currentCredits: 22,
      billStatus: 'cancelled',
      billAmount: 1500,
      dropChannel: 'self',
      teachingWeek: 2,
      feeWaiver: true,
      reason: 'Cancelled linked add/drop',
      items: [
        { action: 'Drop', courseCode: 'BUS201', credits: 3, section: '01', time: 'Tue 14:00–17:00' },
        { action: 'Add', courseCode: 'HUM110', credits: 3, section: '01', time: 'Fri 09:00–12:00', fee: 1500 },
      ],
      approvalLog: [{ at: '2026-07-06 20:00', actor: 'Student', action: 'Cancelled' }],
    },
    {
      id: 'adr-xmum-23',
      applicationNo: 'ADR2509029',
      ...baseStudent,
      type: 'Retake',
      status: 'Pending',
      submittedAt: '2026-07-17 09:00:00',
      currentCredits: 22,
      billStatus: 'pending',
      billAmount: 2200,
      reason: 'Second pending retake sample',
      items: [
        {
          action: 'Retake',
          courseCode: 'COMP201',
          credits: 4,
          section: '01',
          time: 'Thu 10:00–12:00',
          retakeGrade: 'F',
          fee: 2200,
        },
      ],
      retakeType: 'failed',
      approvalLog: [],
    },
  ].map((app, index) => enrichAddDropApplicationSchedule(app, index))
}

function syncDemoAddDropApplications(credits, schedule) {
  const studentApps = addDropApprovalQueue.value.filter((app) => app.studentId === DEMO_STUDENT_ID)
  const statusCounts = {}
  for (const app of studentApps) {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1
  }
  const requiredStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled']
  const statusCoverageOk = requiredStatuses.every((s) => (statusCounts[s] || 0) >= 2)
  const typeCoverageOk = ['Add', 'Drop', 'Retake', 'AddDrop', 'RetakeDrop'].every((type) =>
    studentApps.some((app) => app.type === type),
  )
  const retakeDropCount = studentApps.filter((app) => app.type === 'RetakeDrop').length
  const needsReseed =
    studentApps.length < 16 ||
    !statusCoverageOk ||
    !typeCoverageOk ||
    retakeDropCount < 5 ||
    studentApps.some((app) => !app.academicSession) ||
    studentApps.some((app) => !String(app.programme || '').trim()) ||
    studentApps.some((app) => app.type === 'Replace') ||
    studentApps.some((app) => String(app.submittedAt || '').includes('2025-09')) ||
    // 旧 seed：COMP201 重修 Wed 14–16 与 COMP3192 冲突 → 强制重种
    studentApps.some((app) =>
      (app.items || []).some(
        (line) =>
          String(line.courseCode || '') === 'COMP201' &&
          String(line.action || '') === 'Retake' &&
          String(line.time || '').includes('Wed 14:00'),
      ),
    ) ||
    // 旧 seed：COMP3192 Add 仍为 Wed 14 / Thu 10（撞 SE201 / CST201）→ 强制重种为课库 sec03
    studentApps.some((app) =>
      (app.items || []).some((line) => {
        if (String(line.courseCode || '') !== 'COMP3192') return false
        if (String(line.action || '') !== 'Add') return false
        const time = String(line.time || '')
        return time.includes('Wed 14:00') || time.includes('Thu 10:00')
      }),
    ) ||
    studentApps.some(
      (app) =>
        !app.weekRange ||
        !app.lecturers ||
        !app.venue ||
        !app.classTime ||
        !app.sectionName ||
        String(app.classTime).startsWith('Mon') ||
        String(app.classTime).startsWith('Tue') ||
        String(app.classTime).startsWith('Wed') ||
        String(app.classTime).startsWith('Thu') ||
        String(app.classTime).startsWith('Fri'),
    )
  if (!needsReseed) {
    addDropApprovalQueue.value = addDropApprovalQueue.value.map((app, index) =>
      app.studentId === DEMO_STUDENT_ID ? enrichAddDropApplicationSchedule(app, index) : app,
    )
    return
  }
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

/** 校选课类型 value → 文商理/AI与开放选修字段 */
function schoolCatToTermKey(schoolCat) {
  if (schoolCat === 'arts') return 'humanities'
  if (schoolCat === 'business') return 'business'
  if (schoolCat === 'science') return 'science'
  if (schoolCat === 'ai_open') return 'aiOpen'
  return null
}

/**
 * 按确认课汇总本学期文商理（与 GE/ME 总分同源，保证相加一致）
 * @param {object[]} courses
 * @param {'GE'|'ME'} typeFilter
 */
function sumTermCategoryCreditsFromCourses(courses, typeFilter) {
  const out = { humanities: 0, business: 0, science: 0, aiOpen: 0 }
  for (const item of courses || []) {
    const kind = normalizeRegistrationType(item.type)
    const matched =
      typeFilter === 'GE'
        ? kind === 'GE'
        : kind === 'ME' || kind === 'Mandatory'
    if (!matched) continue
    const lib = getCourseById(item.courseId)
    const schoolCat = resolveSchoolElectiveCategory({
      id: item.courseId,
      code: item.courseCode,
      type: item.type,
      schoolElectiveCategory:
        item.schoolElectiveCategory || lib?.schoolElectiveCategory,
    })
    const key = schoolCatToTermKey(schoolCat)
    if (!key) continue
    out[key] += Number(item.credits) || 0
  }
  return out
}

function syncDemoMonitor(courses) {
  const credits = courses.reduce((sum, item) => sum + (item.credits || 0), 0)
  const schedule = buildDemoSchedule(courses)
  const creditMin = resolveTermCreditMin(DEMO_TERM_ACADEMIC_SESSION)
  const creditMax = resolveTermCreditMax(DEMO_TERM_ACADEMIC_SESSION)
  const status =
    credits === 0
      ? 'notRegistered'
      : credits < creditMin
        ? 'creditLow'
        : credits > creditMax
          ? 'creditHigh'
          : 'normal'
  const issues =
    credits === 0
      ? ['notRegistered']
      : credits < creditMin
        ? ['creditBelowMin']
        : credits > creditMax
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
    creditMin,
    creditMax,
    status,
    tags: ['senior'],
    // 历史先修：MATH101 已通过；STAT100 曾修但不及格（演示「成绩不及格」）
    passedCourses: ['MATH101'],
    failedCourses: ['STAT100'],
    cgpa: 3.42,
    termElectiveProgress: {
      ge: courses.reduce((sum, item) => sum + (item.type === 'GE' ? item.credits || 0 : 0), 0),
      me: courses.reduce(
        (sum, item) => sum + (item.type === 'ME' || item.type === 'Mandatory' ? item.credits || 0 : 0),
        0,
      ),
      // GE 学期整体帽 6 分（不再按 GE01-04 分类限制）
      geMax: 6,
      /** 演示生学期帽：GE 已选约 6/6，ME 允许继续提交选课 */
      meMax: 22,
    },
    // ME 课程组 / GE 文商理已选均按确认课汇总，与学期总分同源
    termGeCategories: {
      ...sumLiveMeGroupCredits(courses),
      required: { group4of3: 8, group3of2: 6, group2of1: 4, ordinary: 4 },
    },
    termGeElectiveCategories: {
      ...sumTermCategoryCreditsFromCourses(courses, 'GE'),
      required: { humanities: 5, business: 5, science: 4, aiOpen: 4 },
    },
    // 毕业进度：首次选课叙事下已选≡本学期；四类和 16 < 毕业总分 18（留富余）
    graduationGeProgress: {
      ...sumTermCategoryCreditsFromCourses(courses, 'GE'),
      required: { humanities: 5, business: 5, science: 4, aiOpen: 2 },
    },
    graduationMeProgress: {
      ...sumLiveMeGroupCredits(courses),
      required: { group4of3: 16, group3of2: 12, group2of1: 8, ordinary: 12 },
    },
    graduationMandatoryProgress: { current: 54, required: 72 },
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
  // 分批确认课：缺种子 / 校选类别 / 旧冲突时段则重灌
  const needsReseed =
    studentConfirmedCourses.value.some((item) => !item.selectedAt || !item.sourceType) ||
    studentConfirmedCourses.value.some((item) => !item.schoolElectiveCategory) ||
    !studentConfirmedCourses.value.some(
      (item) => item.courseCode === 'BUS201' && item.schoolElectiveCategory === 'ai_open',
    ) ||
    !studentConfirmedCourses.value.some(
      (item) => item.courseCode === 'HUM201' && item.roundKey === 'preselect',
    ) ||
    !studentConfirmedCourses.value.some(
      (item) => item.courseCode === 'COMP201' && item.roundKey === 'preselect',
    ) ||
    !studentConfirmedCourses.value.some(
      (item) => item.courseCode === 'SE201' && item.roundKey === 'preselect',
    ) ||
    !studentConfirmedCourses.value.some(
      (item) => item.courseCode === 'AI110' && item.roundKey === 'preselect',
    ) ||
    studentConfirmedCourses.value.some((item) => item.courseCode === 'MPU402') ||
    studentConfirmedCourses.value.some((item) => item.courseCode === 'COMP101') ||
    studentConfirmedCourses.value.some((item) => item.courseCode === 'IT102') ||
    studentConfirmedCourses.value.some(
      (item) =>
        item.courseCode === 'BUS301' && String(item.time || '').includes('Mon 14:00'),
    ) ||
    studentConfirmedCourses.value.some(
      (item) =>
        (item.courseCode === 'CST201' || item.courseCode === 'BUS301') &&
        String(item.time || '').includes('Wed 10:00'),
    ) ||
    studentConfirmedCourses.value.some(
      (item) =>
        (item.courseCode === 'CST202' || item.courseCode === 'BUS302' || item.courseCode === 'MPU401') &&
        String(item.time || '').includes('Mon 08:00'),
    ) ||
    studentConfirmedCourses.value.length <
      DEMO_BASE_ROUND_COURSES.length + DEMO_ADMIN_CONFIRMED_COURSES.length
  if (needsReseed) {
    // 先写入全量（含增量），再按学分帽 reconcile
    studentConfirmedCourses.value = DEMO_CONFIRMED_COURSES.map((item) => ({ ...item }))
    studentRequiredCourses.value = DEMO_REQUIRED_COURSES.map((item) => ({ ...item }))
    studentSchedule.value = buildDemoSchedule(studentConfirmedCourses.value)
    // 随确认半池缩减一并重置待分配示意
    studentPendingAssignCourses.value = []
  }
  // R2/R3 默认增量课：仅首次 seed 可写入；超帽不写
  reconcileIncrementalDemoConfirmedCourses({ allowAdd: true })
  // 课库分组时间与确认半池对齐（目录/预览同源）
  syncSelectableSectionsFromConfirmed(studentConfirmedCourses.value)
  // 学分分类与毕业进度每次启动对齐（首次选课叙事）
  if (studentConfirmedCourses.value.length) {
    syncDemoMonitor(studentConfirmedCourses.value)
  }

  if (
    !studentRequiredCourses.value.length ||
    !studentRequiredCourses.value.some((item) => item.courseCode === 'INT300') ||
    studentRequiredCourses.value.some(
      (item) => item.courseCode === 'INT300' && !item.academicSession,
    ) ||
    studentRequiredCourses.value.some(
      (item) =>
        item.courseCode === 'MATH101' &&
        (item.courseName === 'Calculus I' || item.time?.includes('Fri')),
    )
  ) {
    studentRequiredCourses.value = DEMO_REQUIRED_COURSES.map((item) => ({ ...item }))
  }

  // 在线选课：R1 待分配未确认，可提交志愿；R2/R3 本轮课留确认半池；结果页快照另存
  seedVolunteerRegisterDemo()

  syncDemoAddDropApplications(
    studentConfirmedCourses.value.reduce((sum, item) => sum + (item.credits || 0), 0),
    buildDemoSchedule(studentConfirmedCourses.value),
  )
  syncDemoWaitlistEntries()

  // 刷新演示生学期帽与文商理（与确认课汇总保持一致）
  const monitorIdx = registrationMonitorQueue.value.findIndex((r) => r.studentId === DEMO_STUDENT_ID)
  if (monitorIdx >= 0) {
    const row = registrationMonitorQueue.value[monitorIdx]
    const geCats = sumTermCategoryCreditsFromCourses(studentConfirmedCourses.value, 'GE')
    const meCats = sumLiveMeGroupCredits(studentConfirmedCourses.value)
    const geCredits = studentConfirmedCourses.value.reduce(
      (sum, item) => sum + (item.type === 'GE' ? item.credits || 0 : 0),
      0,
    )
    const meCredits = studentConfirmedCourses.value.reduce(
      (sum, item) =>
        sum + (item.type === 'ME' || item.type === 'Mandatory' ? item.credits || 0 : 0),
      0,
    )
    registrationMonitorQueue.value[monitorIdx] = {
      ...row,
      passedCourses: row.passedCourses?.length ? row.passedCourses : ['MATH101'],
      failedCourses: row.failedCourses?.length ? row.failedCourses : ['STAT100'],
      termElectiveProgress: {
        ...(row.termElectiveProgress || {}),
        ge: geCredits,
        me: meCredits,
        geMax: 6,
        meMax: 22,
      },
      termGeCategories: {
        ...meCats,
        required: { group4of3: 8, group3of2: 6, group2of1: 4, ordinary: 4 },
      },
      termGeElectiveCategories: {
        ...geCats,
        required: { humanities: 5, business: 5, science: 4, aiOpen: 4 },
      },
      graduationGeProgress: {
        ...geCats,
        required: { humanities: 5, business: 5, science: 4, aiOpen: 2 },
      },
      graduationMeProgress: {
        ...meCats,
        required: { group4of3: 16, group3of2: 12, group2of1: 8, ordinary: 12 },
      },
      graduationMandatoryProgress: row.graduationMandatoryProgress || {
        current: 54,
        required: 72,
      },
    }
  } else {
    syncDemoMonitor(studentConfirmedCourses.value)
  }

  if (seeded) return
  seeded = true
}
