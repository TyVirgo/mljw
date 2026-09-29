import { ref } from 'vue'
import { getBatchById } from './registrationBatches.js'

/** 与 registrationBatches / selectableCourses 对齐的活跃批次 */
const BATCH_M1_ID = 'batch-2504-m1'
const BATCH_M1_NAME = 'Major Elective Selection (I) for SWE 2026/04 Academic Session'

const COURSES = {
  COMP201: { courseCode: 'COMP201', courseName: 'Data Structures', credits: 4, courseType: 'ME' },
  ENGL201: { courseCode: 'ENGL201', courseName: 'Academic Writing', credits: 3, courseType: 'GE' },
  IT102: { courseCode: 'IT102', courseName: 'Digital Literacy Workshop', credits: 2, courseType: 'ME' },
  PHYS101: { courseCode: 'PHYS101', courseName: 'Physics I', credits: 4, courseType: 'ME' },
  COMP220: { courseCode: 'COMP220', courseName: 'Discrete Mathematics', credits: 3, courseType: 'ME' },
  MATH201: { courseCode: 'MATH201', courseName: 'Linear Algebra', credits: 4, courseType: 'ME' },
  STAT201: { courseCode: 'STAT201', courseName: 'Probability & Statistics', credits: 3, courseType: 'ME' },
  HUM110: { courseCode: 'HUM110', courseName: 'Introduction to Humanities', credits: 3, courseType: 'GE' },
  COS210: { courseCode: 'COS210', courseName: 'Cybersecurity Fundamentals', credits: 3, courseType: 'ME' },
  MPU3183: { courseCode: 'MPU3183', courseName: 'Malaysian Studies', credits: 3, courseType: 'GE' },
}

const STUDENTS = {
  SWE2409001: { studentId: 'SWE2409001', studentName: 'Tan Wei Ming', programme: 'SWE', intake: '2409' },
  SWE2409012: { studentId: 'SWE2409012', studentName: 'Lim Jia Hui', programme: 'SWE', intake: '2409' },
  COS2409001: { studentId: 'COS2409001', studentName: 'Ahmad bin Ali', programme: 'COS', intake: '2409' },
  COS2504015: { studentId: 'COS2504015', studentName: 'Tan Mei Ling', programme: 'COS', intake: '2504' },
  DSA2504002: { studentId: 'DSA2504002', studentName: 'Lee Wei Ming', programme: 'DSA', intake: '2504' },
  AIT2409010: { studentId: 'AIT2409010', studentName: 'Siti Nurhaliza', programme: 'AIT', intake: '2409' },
  BUS2409020: { studentId: 'BUS2409020', studentName: 'Wong Mei Ling', programme: 'BUS', intake: '2409' },
  ACC2409008: { studentId: 'ACC2409008', studentName: 'Chong Kai Xin', programme: 'ACC', intake: '2409' },
  MAT2504003: { studentId: 'MAT2504003', studentName: 'Raj Kumar', programme: 'MAT', intake: '2504' },
  FIN2409011: { studentId: 'FIN2409011', studentName: 'Nurul Aina', programme: 'FIN', intake: '2409' },
}

/**
 * @param {{
 *   id: string,
 *   studentKey: keyof typeof STUDENTS,
 *   courseKey: keyof typeof COURSES,
 *   sectionCode?: string,
 *   operator?: { operatorId: string, operatorName: string },
 *   operatedAt: string,
 *   remark: string,
 *   operation: 'register' | 'drop' | 'adminAdd' | 'joinQueue' | 'cancelQueue',
 *   result: 'success' | 'failure' | 'queuing' | 'cancelQueue',
 *   round: 'preselect' | 'main' | 'supplement',
 *   queueStatus?: '' | 'queuing' | 'cancelled',
 *   queueRank?: number,
 *   isRetake?: boolean,
 * }} row
 */
function log(row) {
  const student = STUDENTS[row.studentKey]
  const course = COURSES[row.courseKey]
  const operator = row.operator || {
    operatorId: student.studentId,
    operatorName: student.studentName,
  }
  const queueStatus =
    row.queueStatus !== undefined
      ? row.queueStatus
      : row.result === 'queuing'
        ? 'queuing'
        : row.result === 'cancelQueue'
          ? 'cancelled'
          : ''
  const bid = row.batchId || BATCH_M1_ID
  return {
    id: row.id,
    batchId: bid,
    batchName: row.batchName || getBatchById(bid)?.name || BATCH_M1_NAME,
    round: row.round,
    ...student,
    ...course,
    sectionCode: row.sectionCode || '01',
    ...operator,
    operatedAt: row.operatedAt,
    remark: row.remark,
    operation: row.operation,
    result: row.result,
    queueStatus,
    queueRank: row.queueRank ?? null,
    isRetake: Boolean(row.isRetake),
  }
}

/**
 * 选课操作审计日志（demo）
 * 覆盖三轮 × 成功/失败/排队中/取消排队
 */
export const registrationLogs = ref([
  log({
    id: 'log-001',
    round: 'preselect',
    studentKey: 'SWE2409001',
    courseKey: 'COMP201',
    sectionCode: '01',
    operatedAt: '2026-08-29 09:12:33',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-002',
    round: 'preselect',
    studentKey: 'SWE2409001',
    courseKey: 'ENGL201',
    operatedAt: '2026-08-29 09:15:02',
    remark: '选课失败：先到先选超出一门限制',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-003',
    round: 'preselect',
    studentKey: 'SWE2409012',
    courseKey: 'COMP201',
    sectionCode: '02',
    operatedAt: '2026-08-29 10:01:18',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-004',
    round: 'preselect',
    studentKey: 'COS2409001',
    courseKey: 'COMP220',
    operatedAt: '2026-08-29 11:20:05',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-005',
    round: 'preselect',
    studentKey: 'COS2504015',
    courseKey: 'ENGL201',
    operatedAt: '2026-08-30 08:45:11',
    remark: '进入排队，当前顺位 3',
    operation: 'joinQueue',
    result: 'queuing',
    queueRank: 3,
  }),
  log({
    id: 'log-006',
    round: 'preselect',
    studentKey: 'DSA2504002',
    courseKey: 'PHYS101',
    operatedAt: '2026-08-30 10:12:00',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
    isRetake: true,
  }),
  log({
    id: 'log-007',
    round: 'preselect',
    studentKey: 'AIT2409010',
    courseKey: 'IT102',
    operatedAt: '2026-08-30 16:20:00',
    remark: '选课失败：课程已满',
    operation: 'register',
    result: 'failure',
    isRetake: true,
  }),
  log({
    id: 'log-008',
    round: 'preselect',
    studentKey: 'BUS2409020',
    courseKey: 'HUM110',
    operatedAt: '2026-08-31 09:05:27',
    remark: '取消排队',
    operation: 'cancelQueue',
    result: 'cancelQueue',
  }),
  log({
    id: 'log-009',
    round: 'preselect',
    studentKey: 'ACC2409008',
    courseKey: 'MATH201',
    operatedAt: '2026-08-31 14:33:19',
    remark: '选课失败：原因：选课时间已截止',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-010',
    round: 'preselect',
    studentKey: 'MAT2504003',
    courseKey: 'STAT201',
    operatedAt: '2026-09-01 08:10:44',
    remark: '进入排队，当前顺位 1',
    operation: 'joinQueue',
    result: 'queuing',
    queueRank: 1,
    isRetake: true,
  }),
  log({
    id: 'log-029',
    round: 'preselect',
    studentKey: 'FIN2409011',
    courseKey: 'COMP201',
    sectionCode: '02',
    operatedAt: '2026-09-01 08:22:10',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-030',
    round: 'preselect',
    studentKey: 'SWE2409001',
    courseKey: 'IT102',
    sectionCode: '01',
    operatedAt: '2026-09-01 08:35:41',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-031',
    round: 'preselect',
    studentKey: 'SWE2409012',
    courseKey: 'PHYS101',
    sectionCode: '01',
    operatedAt: '2026-09-01 09:02:18',
    remark: '选课失败：课程已满',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-032',
    round: 'preselect',
    studentKey: 'COS2409001',
    courseKey: 'ENGL201',
    sectionCode: '02',
    operatedAt: '2026-09-01 09:18:55',
    remark: '进入排队，当前顺位 2',
    operation: 'joinQueue',
    result: 'queuing',
    queueRank: 2,
  }),
  log({
    id: 'log-033',
    round: 'preselect',
    studentKey: 'COS2504015',
    courseKey: 'COMP220',
    operatedAt: '2026-09-01 09:40:03',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-034',
    round: 'preselect',
    studentKey: 'DSA2504002',
    courseKey: 'MATH201',
    sectionCode: '02',
    operatedAt: '2026-09-01 10:05:27',
    remark: '选课失败：先到先选超出一门限制',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-035',
    round: 'preselect',
    studentKey: 'AIT2409010',
    courseKey: 'HUM110',
    operatedAt: '2026-09-01 10:21:14',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-036',
    round: 'preselect',
    studentKey: 'BUS2409020',
    courseKey: 'STAT201',
    sectionCode: '01',
    operatedAt: '2026-09-01 10:44:50',
    remark: '取消排队',
    operation: 'cancelQueue',
    result: 'cancelQueue',
  }),
  log({
    id: 'log-037',
    round: 'preselect',
    studentKey: 'ACC2409008',
    courseKey: 'COS210',
    operatedAt: '2026-09-01 11:08:33',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-038',
    round: 'preselect',
    studentKey: 'MAT2504003',
    courseKey: 'MPU3183',
    operatedAt: '2026-09-01 11:30:02',
    remark: '进入排队，当前顺位 4',
    operation: 'joinQueue',
    result: 'queuing',
    queueRank: 4,
  }),
  log({
    id: 'log-039',
    round: 'preselect',
    studentKey: 'FIN2409011',
    courseKey: 'IT102',
    sectionCode: '02',
    operator: { operatorId: 'admin01', operatorName: 'AC Lee' },
    operatedAt: '2026-09-01 13:12:40',
    remark: '管理端代选成功',
    operation: 'adminAdd',
    result: 'success',
  }),
  log({
    id: 'log-040',
    round: 'preselect',
    studentKey: 'SWE2409012',
    courseKey: 'MATH201',
    operatedAt: '2026-09-01 13:28:19',
    remark: '选课失败：原因：选课时间已截止',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-041',
    round: 'preselect',
    studentKey: 'COS2409001',
    courseKey: 'PHYS101',
    sectionCode: '02',
    operatedAt: '2026-09-01 14:05:08',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-042',
    round: 'preselect',
    studentKey: 'DSA2504002',
    courseKey: 'ENGL201',
    operatedAt: '2026-09-01 14:22:51',
    remark: '取消排队',
    operation: 'cancelQueue',
    result: 'cancelQueue',
  }),
  log({
    id: 'log-043',
    round: 'preselect',
    studentKey: 'AIT2409010',
    courseKey: 'COMP201',
    sectionCode: '01',
    operatedAt: '2026-09-01 15:01:16',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),

  log({
    id: 'log-011',
    round: 'main',
    studentKey: 'FIN2409011',
    courseKey: 'MPU3183',
    operatedAt: '2026-09-01 09:40:12',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-012',
    round: 'main',
    studentKey: 'SWE2409012',
    courseKey: 'COS210',
    operatedAt: '2026-09-01 11:05:01',
    remark: '选课失败：先到先选超出一门限制',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-013',
    round: 'main',
    studentKey: 'COS2409001',
    courseKey: 'COMP201',
    sectionCode: '01',
    operator: { operatorId: 'admin01', operatorName: 'AC Lee' },
    operatedAt: '2026-09-02 14:22:05',
    remark: '管理端代选成功',
    operation: 'adminAdd',
    result: 'success',
  }),
  log({
    id: 'log-014',
    round: 'main',
    studentKey: 'SWE2409012',
    courseKey: 'IT102',
    operator: { operatorId: 'admin02', operatorName: 'AC Wong' },
    operatedAt: '2026-09-02 15:08:41',
    remark: '管理端代选失败：课程已满',
    operation: 'adminAdd',
    result: 'failure',
  }),
  log({
    id: 'log-015',
    round: 'main',
    studentKey: 'DSA2504002',
    courseKey: 'COMP220',
    operator: { operatorId: 'admin01', operatorName: 'AC Lee' },
    operatedAt: '2026-09-03 09:05:27',
    remark: '管理端代选成功',
    operation: 'adminAdd',
    result: 'success',
  }),
  log({
    id: 'log-016',
    round: 'main',
    studentKey: 'AIT2409010',
    courseKey: 'COS210',
    operatedAt: '2026-09-03 10:18:55',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-017',
    round: 'main',
    studentKey: 'COS2504015',
    courseKey: 'COMP201',
    sectionCode: '02',
    operatedAt: '2026-09-03 13:42:08',
    remark: '进入排队，当前顺位 5',
    operation: 'joinQueue',
    result: 'queuing',
    queueRank: 5,
  }),
  log({
    id: 'log-018',
    round: 'main',
    studentKey: 'BUS2409020',
    courseKey: 'ENGL201',
    operatedAt: '2026-09-04 09:11:30',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-019',
    round: 'main',
    studentKey: 'SWE2409001',
    courseKey: 'STAT201',
    operatedAt: '2026-09-04 16:05:22',
    remark: '选课失败：原因：选课时间已截止',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-020',
    round: 'main',
    studentKey: 'ACC2409008',
    courseKey: 'HUM110',
    operatedAt: '2026-09-05 11:27:14',
    remark: '取消排队',
    operation: 'cancelQueue',
    result: 'cancelQueue',
  }),

  log({
    id: 'log-021',
    round: 'supplement',
    studentKey: 'DSA2504002',
    courseKey: 'PHYS101',
    operatedAt: '2026-09-08 11:30:44',
    remark: '退课成功',
    operation: 'drop',
    result: 'success',
  }),
  log({
    id: 'log-022',
    round: 'supplement',
    studentKey: 'COS2409001',
    courseKey: 'COMP220',
    operatedAt: '2026-09-08 14:02:19',
    remark: '退课成功',
    operation: 'drop',
    result: 'success',
  }),
  log({
    id: 'log-023',
    round: 'supplement',
    studentKey: 'FIN2409011',
    courseKey: 'MPU3183',
    operatedAt: '2026-09-09 09:18:06',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-024',
    round: 'supplement',
    studentKey: 'MAT2504003',
    courseKey: 'MATH201',
    operator: { operatorId: 'admin01', operatorName: 'AC Lee' },
    operatedAt: '2026-09-09 15:44:50',
    remark: '管理端代选失败：超出学分上限',
    operation: 'adminAdd',
    result: 'failure',
  }),
  log({
    id: 'log-025',
    round: 'supplement',
    studentKey: 'SWE2409001',
    courseKey: 'MATH201',
    operatedAt: '2026-09-10 08:55:33',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-026',
    round: 'supplement',
    studentKey: 'SWE2409012',
    courseKey: 'COMP201',
    operatedAt: '2026-09-10 09:20:11',
    remark: '进入排队，当前顺位 2',
    operation: 'joinQueue',
    result: 'queuing',
    queueRank: 2,
  }),
  log({
    id: 'log-027',
    round: 'supplement',
    studentKey: 'AIT2409010',
    courseKey: 'IT102',
    operatedAt: '2026-09-10 10:05:40',
    remark: '取消排队',
    operation: 'cancelQueue',
    result: 'cancelQueue',
  }),
  log({
    id: 'log-028',
    round: 'supplement',
    studentKey: 'COS2504015',
    courseKey: 'ENGL201',
    operatedAt: '2026-09-10 11:18:22',
    remark: '选课失败：课程已满',
    operation: 'register',
    result: 'failure',
  }),
  // —— GE 批 batch-2504-g1：默认轮（第一轮）25 条；另两轮保留若干便于切轮 ——
  ...buildGeBatchPreselectLogs(25),
  log({
    id: 'log-g1-main-001',
    batchId: 'batch-2504-g1',
    round: 'main',
    studentKey: 'AIT2409010',
    courseKey: 'HUM110',
    operatedAt: '2026-09-02 14:08:33',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-g1-main-002',
    batchId: 'batch-2504-g1',
    round: 'main',
    studentKey: 'BUS2409020',
    courseKey: 'ENGL201',
    sectionCode: '02',
    operatedAt: '2026-09-02 16:22:10',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-g1-main-003',
    batchId: 'batch-2504-g1',
    round: 'main',
    studentKey: 'MAT2504003',
    courseKey: 'MPU3183',
    operatedAt: '2026-09-03 10:05:44',
    remark: '选课失败：时间冲突',
    operation: 'register',
    result: 'failure',
  }),
  log({
    id: 'log-g1-main-004',
    batchId: 'batch-2504-g1',
    round: 'main',
    studentKey: 'FIN2409011',
    courseKey: 'HUM110',
    operatedAt: '2026-09-03 11:30:18',
    remark: '取消排队',
    operation: 'cancelQueue',
    result: 'cancelQueue',
  }),
  log({
    id: 'log-g1-sup-001',
    batchId: 'batch-2504-g1',
    round: 'supplement',
    studentKey: 'BUS2409020',
    courseKey: 'MPU3183',
    operatedAt: '2026-09-10 09:12:05',
    remark: '选课成功',
    operation: 'register',
    result: 'success',
  }),
  log({
    id: 'log-g1-sup-002',
    batchId: 'batch-2504-g1',
    round: 'supplement',
    studentKey: 'AIT2409010',
    courseKey: 'ENGL201',
    sectionCode: '02',
    operatedAt: '2026-09-10 10:40:33',
    remark: '进入排队，当前顺位 1',
    operation: 'joinQueue',
    result: 'queuing',
    queueRank: 1,
  }),
  log({
    id: 'log-g1-sup-003',
    batchId: 'batch-2504-g1',
    round: 'supplement',
    studentKey: 'ACC2409008',
    courseKey: 'HUM110',
    operatedAt: '2026-09-10 14:55:01',
    remark: '选课失败：课程已满',
    operation: 'register',
    result: 'failure',
  }),
])

/**
 * GE 批第一轮演示日志（默认展示轮，凑满 count 条）
 * @param {number} count
 * @returns {object[]}
 */
function buildGeBatchPreselectLogs(count = 25) {
  const studentKeys = Object.keys(STUDENTS)
  const courseKeys = ['HUM110', 'ENGL201', 'MPU3183']
  const patterns = [
    { operation: 'register', result: 'success', remark: '选课成功' },
    { operation: 'register', result: 'success', remark: '选课成功' },
    { operation: 'register', result: 'failure', remark: '选课失败：课程已满' },
    { operation: 'joinQueue', result: 'queuing', remark: '进入排队', withRank: true },
    { operation: 'cancelQueue', result: 'cancelQueue', remark: '取消排队' },
    { operation: 'register', result: 'failure', remark: '选课失败：时间冲突' },
    { operation: 'register', result: 'success', remark: '选课成功' },
    { operation: 'adminAdd', result: 'success', remark: '管理员代选成功' },
  ]
  const rows = []
  for (let i = 0; i < count; i += 1) {
    const pattern = patterns[i % patterns.length]
    const day = 29 + Math.floor(i / 8)
    const hour = 9 + (i % 8)
    const minute = (i * 7) % 60
    const sec = (i * 13) % 60
    const pad = (n) => String(n).padStart(2, '0')
    const row = {
      id: `log-g1-pre-${String(i + 1).padStart(3, '0')}`,
      batchId: 'batch-2504-g1',
      round: 'preselect',
      studentKey: studentKeys[i % studentKeys.length],
      courseKey: courseKeys[i % courseKeys.length],
      sectionCode: i % 3 === 2 ? '02' : '01',
      operatedAt: `2026-08-${pad(Math.min(day, 31))} ${pad(hour)}:${pad(minute)}:${pad(sec)}`,
      remark: pattern.withRank ? `${pattern.remark}，当前顺位 ${(i % 5) + 1}` : pattern.remark,
      operation: pattern.operation,
      result: pattern.result,
    }
    if (pattern.withRank) row.queueRank = (i % 5) + 1
    if (i % 11 === 10) row.isRetake = true
    rows.push(log(row))
  }
  return rows
}

/** 选课日志页演示批次：仅保留有日志行的 GE + ME */
export const REGISTRATION_LOG_DEMO_BATCH_IDS = [BATCH_M1_ID, 'batch-2504-g1']

/**
 * 日志页批次下拉选项（有数据的 GE/ME）
 * @returns {object[]}
 */
export function listRegistrationLogBatches() {
  return REGISTRATION_LOG_DEMO_BATCH_IDS.map((id) => getBatchById(id)).filter(Boolean)
}

/**
 * 日志页默认批次：优先 ME 主批
 * @returns {string}
 */
export function pickRegistrationLogDefaultBatchId() {
  const list = listRegistrationLogBatches()
  const preferred = list.find((b) => b.id === BATCH_M1_ID)
  return preferred?.id || list[0]?.id || ''
}

/**
 * 切批时选一轮：优先 preferred，否则该批日志里最早有数据的轮次
 * @param {string} batchId
 * @param {string} [preferred]
 * @returns {string}
 */
export function pickRegistrationLogRoundKey(batchId, preferred = '') {
  const roundsInBatch = new Set(
    registrationLogs.value.filter((row) => row.batchId === batchId).map((row) => row.round),
  )
  if (preferred && roundsInBatch.has(preferred)) return preferred
  for (const key of ['preselect', 'main', 'supplement']) {
    if (roundsInBatch.has(key)) return key
  }
  return preferred || 'preselect'
}

/** 按轮次的监控统计（demo，不从日志推导） */
export const registrationLogRoundStats = {
  preselect: {
    loginUsers: 1280,
    loginSessions: 2146,
    registeredStudents: 962,
    unregisteredStudents: 318,
    totalCourses: 86,
    coursesWithCapacity: 62,
    coursesFull: 24,
  },
  main: {
    loginUsers: 1456,
    loginSessions: 2688,
    registeredStudents: 1104,
    unregisteredStudents: 352,
    totalCourses: 92,
    coursesWithCapacity: 61,
    coursesFull: 31,
  },
  supplement: {
    loginUsers: 986,
    loginSessions: 1520,
    registeredStudents: 640,
    unregisteredStudents: 346,
    totalCourses: 64,
    coursesWithCapacity: 45,
    coursesFull: 19,
  },
}

export const registrationLogRoundTabs = [
  { id: 'preselect', labelKey: 'courseRegistration.batch.roundPreselect' },
  { id: 'main', labelKey: 'courseRegistration.batch.roundMain' },
  { id: 'supplement', labelKey: 'courseRegistration.batch.roundSupplement' },
]

export function getRegistrationLogRoundStats(roundKey) {
  return registrationLogRoundStats[roundKey] || registrationLogRoundStats.preselect
}

/**
 * 按批次×轮次取统计（非主批 demo 缩放，避免各批数字雷同又全空）
 * @param {string} batchId
 * @param {string} roundKey
 */
export function getRegistrationLogStats(batchId, roundKey) {
  const base = getRegistrationLogRoundStats(roundKey)
  if (!batchId || batchId === BATCH_M1_ID) return { ...base }
  let hash = 0
  for (let i = 0; i < batchId.length; i += 1) hash = (hash + batchId.charCodeAt(i) * (i + 1)) % 97
  const factor = 0.28 + (hash % 35) / 100
  const scale = (n) => Math.max(1, Math.round(Number(n) * factor))
  return {
    loginUsers: scale(base.loginUsers),
    loginSessions: scale(base.loginSessions),
    registeredStudents: scale(base.registeredStudents),
    unregisteredStudents: scale(base.unregisteredStudents),
    totalCourses: scale(base.totalCourses),
    coursesWithCapacity: scale(base.coursesWithCapacity),
    coursesFull: scale(base.coursesFull),
  }
}

function includesKeyword(haystack, needle) {
  if (!needle) return true
  return String(haystack || '').toLowerCase().includes(String(needle).toLowerCase())
}

function inTimeRange(operatedAt, start, end) {
  if (!start && !end) return true
  const ts = operatedAt || ''
  if (start && ts < start) return false
  if (end && ts > `${end} 23:59:59`) return false
  return true
}

/** 开始晚于结束时对调，返回规范化区间 */
export function normalizeTimeRange(timeStart = '', timeEnd = '') {
  if (timeStart && timeEnd && timeStart > timeEnd) {
    return { timeStart: timeEnd, timeEnd: timeStart }
  }
  return { timeStart, timeEnd }
}

/**
 * @param {Array} list
 * @param {{
 *   round?: string,
 *   batchId?: string,
 *   studentKeyword?: string,
 *   batchKeyword?: string,
 *   courseKeyword?: string,
 *   operatorKeyword?: string,
 *   result?: string,
 *   timeStart?: string,
 *   timeEnd?: string,
 * }} filters
 */
export function filterRegistrationLogs(list, filters = {}) {
  const {
    round = '',
    batchId = '',
    studentKeyword = '',
    batchKeyword = '',
    courseKeyword = '',
    operatorKeyword = '',
    result = '',
  } = filters
  const { timeStart, timeEnd } = normalizeTimeRange(filters.timeStart, filters.timeEnd)

  return list.filter((row) => {
    if (round && row.round !== round) return false
    // 页顶批次精确过滤（优先于关键词）
    if (batchId && row.batchId !== batchId) return false
    if (result && row.result !== result) return false
    if (!inTimeRange(row.operatedAt, timeStart, timeEnd)) return false

    if (studentKeyword) {
      const hit =
        includesKeyword(row.studentId, studentKeyword) ||
        includesKeyword(row.studentName, studentKeyword)
      if (!hit) return false
    }

    // 搜索区批次关键词已去掉；保留参数兼容旧调用
    if (batchKeyword) {
      const hit =
        includesKeyword(row.batchName, batchKeyword) ||
        includesKeyword(row.batchId, batchKeyword)
      if (!hit) return false
    }

    if (courseKeyword) {
      const hit =
        includesKeyword(row.courseCode, courseKeyword) ||
        includesKeyword(row.courseName, courseKeyword)
      if (!hit) return false
    }

    if (operatorKeyword) {
      const hit =
        includesKeyword(row.operatorId, operatorKeyword) ||
        includesKeyword(row.operatorName, operatorKeyword)
      if (!hit) return false
    }

    return true
  })
}

export function formatOperatorDisplay(row) {
  if (!row) return '—'
  if (row.operatorId && row.operatorName) {
    return `${row.operatorId}(${row.operatorName})`
  }
  return row.operatorName || row.operatorId || '—'
}

/** @param {{ queueStatus?: string, queueRank?: number|null }} row */
export function formatQueueStatusLabel(row, t) {
  if (row?.queueStatus === 'queuing') {
    const rank = row.queueRank != null ? row.queueRank : '—'
    return `#${rank}`
  }
  if (row?.queueStatus === 'cancelled') return t('courseRegistration.log.queueStatus.cancelled')
  return '—'
}

/**
 * 操作结果展示文案 i18n key（与在线选课状态对齐；码值仍为 success/failure/…）
 * @param {string} result
 * @param {string} [round] preselect | main | supplement
 */
export function getRegistrationLogResultLabelKey(result, round = '') {
  if (result === 'success') {
    return round === 'preselect'
      ? 'courseRegistration.log.result.pendingAssign'
      : 'courseRegistration.log.result.registerSuccess'
  }
  if (result === 'failure') {
    return 'courseRegistration.log.result.registerFailure'
  }
  return `courseRegistration.log.result.${result}`
}

export function formatRegistrationLogResultLabel(result, round, t) {
  return t(getRegistrationLogResultLabelKey(result, round))
}
