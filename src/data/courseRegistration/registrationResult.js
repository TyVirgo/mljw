import { ref } from 'vue'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import { selectableCourses } from './selectableCourses.js'
import { batchScopeFacultyOptions } from './batchScopeRules.js'
import { studentConfirmedCourses } from './studentRegistrationStore.js'
import { getBatchById, registrationBatches } from './registrationBatches.js'
import { DEFAULT_MOCK_CURRENT_STUDENT_ID } from '../mockCurrentStudent.js'
import { deriveClassTime } from './sectionScheduleFields.js'
import { formatIntakeBatch } from '../intakeSets.js'
import { resolveSchoolElectiveCategory } from './selectableCourses.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { getLocale } from '../../i18n/index.js'

/** 中文志愿序数（1–10） */
const ZH_PREFERENCE_ORDINALS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

/** Demo：管理端代选操作人 */
export const DEMO_ADMIN_OPERATOR_NAME = 'AC Lee'
export const DEMO_ADMIN_OPERATOR_ID = 'admin01'

/** 学生维操作结果（无排队中） */
export const STUDENT_OP_RESULT_KEYS = [
  'pendingAssign',
  'registerSuccess',
  'registerFailure',
  'cancelQueue',
]

const DEMO_RESULT_SOURCES = ['preselect', 'main', 'supplement', 'admin']

function resolveBatchName(batchId) {
  return batchId ? getBatchById(batchId)?.name || '' : ''
}

function demoCourseSource(rowIndex) {
  return DEMO_RESULT_SOURCES[rowIndex % DEMO_RESULT_SOURCES.length]
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

/**
 * demo：为结果行补操作人/时间/结果（不含 queuing）
 * @param {number} rowIndex
 * @param {string} courseSource
 * @param {{ studentId?: string, studentName?: string }} [profile]
 */
/** demo：第一轮志愿序 1/2/3 轮转 */
export function demoPreferenceRank(rowIndex, courseSource) {
  if (courseSource !== 'preselect') return null
  return (rowIndex % 3) + 1
}

export function demoStudentOpLogFields(rowIndex, courseSource, profile = {}) {
  let round = 'main'
  let opResult = 'registerSuccess'
  if (courseSource === 'preselect') {
    round = 'preselect'
    opResult = rowIndex % 17 === 0 ? 'registerFailure' : 'pendingAssign'
  } else if (courseSource === 'supplement') {
    round = 'supplement'
    if (rowIndex % 11 === 0) opResult = 'cancelQueue'
    else if (rowIndex % 7 === 0) opResult = 'registerFailure'
    else opResult = 'registerSuccess'
  } else if (courseSource === 'admin') {
    round = 'main'
    opResult = 'registerSuccess'
  } else {
    round = 'main'
    if (rowIndex % 13 === 0) opResult = 'cancelQueue'
    else if (rowIndex % 8 === 0) opResult = 'registerFailure'
    else opResult = 'registerSuccess'
  }

  const isAdmin = courseSource === 'admin' || rowIndex % 15 === 0
  const day = 28 + (rowIndex % 4)
  const hour = 8 + (rowIndex % 10)
  const minute = (rowIndex * 7) % 60
  const sec = (rowIndex * 13) % 60
  return {
    round,
    opResult,
    operatorId: isAdmin ? DEMO_ADMIN_OPERATOR_ID : profile.studentId || '',
    operatorName: isAdmin ? DEMO_ADMIN_OPERATOR_NAME : profile.studentName || '',
    operatedAt: `2026-08-${pad2(day)} ${pad2(hour)}:${pad2(minute)}:${pad2(sec)}`,
  }
}

/**
 * @param {object} row
 * @param {(key: string) => string} t
 */
export function formatStudentOpResultLabel(row, t) {
  const key = row?.opResult
  if (!key || !STUDENT_OP_RESULT_KEYS.includes(key)) return '—'
  return t(`courseRegistration.log.result.${key}`)
}

/**
 * 选课志愿展示：第一志愿 / 第二志愿 / 第三志愿…
 * 中文 ≥3 使用汉字序数（第三志愿），不用阿拉伯数字。
 * @param {number|object|null|undefined} rankOrRow
 * @param {(key: string, params?: object) => string} t
 */
export function formatCoursePreferenceLabel(rankOrRow, t) {
  const rank =
    typeof rankOrRow === 'object' && rankOrRow != null
      ? Number(rankOrRow.preferenceRank ?? rankOrRow.preferenceOrder ?? rankOrRow.choiceRank)
      : Number(rankOrRow)
  if (!Number.isFinite(rank) || rank < 1) return '—'
  const n = Math.floor(rank)
  if (n === 1) return t('courseRegistration.result.preferenceFirst')
  if (n === 2) return t('courseRegistration.result.preferenceSecond')
  const token =
    getLocale() === 'zh' && n >= 1 && n <= 10 ? ZH_PREFERENCE_ORDINALS[n] : String(n)
  return t('courseRegistration.result.preferenceNth', { n: token })
}

/**
 * 学生维选课志愿：仅第一轮（preselect）有值
 * @param {object} row
 * @param {(key: string, params?: object) => string} t
 */
export function formatStudentResultPreferenceLabel(row, t) {
  if (!row || row.courseSource !== 'preselect') return '—'
  return formatCoursePreferenceLabel(row, t)
}

/**
 * @param {object} row
 */
export function formatStudentOperatorDisplay(row) {
  if (!row) return '—'
  if (row.operatorId && row.operatorName) {
    return `${row.operatorId}(${row.operatorName})`
  }
  return row.operatorName || row.operatorId || '—'
}

function findSelectableCourseByCode(code) {
  const key = String(code || '').trim()
  if (!key) return null
  return selectableCourses.value.find((item) => item.code === key) || null
}

/** 按学生×课程展开明细行（一门一行） */
export function buildStudentRegistrationResults(monitorRows = registrationMonitorQueue.value) {
  const rows = []
  let rowIndex = 0
  for (const row of monitorRows) {
    if (!(Number(row.credits) > 0)) continue
    const schedule = row.schedule?.length ? row.schedule : []
    schedule.forEach((slot, index) => {
      const courseCode = String(slot.course || '').trim()
      if (!courseCode) return
      const course = findSelectableCourseByCode(courseCode)
      const section = course?.sections?.[0]
      const courseSource = demoCourseSource(rowIndex)
      rows.push({
        id: `result-stu-${row.id}-${courseCode}-${index}`,
        studentId: row.studentId,
        studentName: row.studentName,
        programme: row.programme,
        intake: row.intake,
        batchId: course?.batchId || '',
        batchName: resolveBatchName(course?.batchId),
        courseSource,
        preferenceRank: demoPreferenceRank(rowIndex, courseSource),
        isRetake: rowIndex % 5 === 2,
        courseCode,
        courseName: course?.name || courseCode,
        credits: Number(course?.credits) || 0,
        courseType: course?.type || '',
        sectionCode: section?.code || '',
        status: row.status === 'normal' ? 'confirmed' : 'warning',
        ...demoStudentOpLogFields(rowIndex, courseSource, row),
      })
      rowIndex += 1
    })
  }
  // 监控队列主要挂在主批；再按批次补齐演示行，保证切换任意批次学生 Tab 非空
  rows.push(...buildBatchCoverageStudentResults(rowIndex))
  return rows
}

/**
 * 为每个选课批次补学生×课程明细（演示用；每批约 25 行，保证学生维切换非空且可翻页）
 * @param {number} startIndex 用于轮转 courseSource / isRetake
 * @returns {object[]}
 */
function buildBatchCoverageStudentResults(startIndex = 0) {
  const candidates = listAdminAddStudentCandidates()
  if (!candidates.length) return []
  const out = []
  let rowIndex = startIndex
  const ROWS_PER_BATCH = 25
  for (const batch of registrationBatches.value) {
    const courses = selectableCourses.value.filter((c) => c.batchId === batch.id)
    if (!courses.length) continue
    for (let i = 0; i < ROWS_PER_BATCH; i += 1) {
      const course = courses[i % courses.length]
      const profile = candidates[(rowIndex + i) % candidates.length]
      const sectionList = course.sections?.length ? course.sections : [null]
      const section = sectionList[i % sectionList.length]
      const courseSource = demoCourseSource(rowIndex + i)
      out.push({
        id: `result-stu-batch-${batch.id}-${course.code}-${profile.studentId}-${i}`,
        studentId: profile.studentId,
        studentName: profile.studentName,
        programme: profile.programme,
        intake: profile.intake || (profile.grade === '2025' ? '2504' : '2409'),
        batchId: batch.id,
        batchName: batch.name || resolveBatchName(batch.id),
        courseSource,
        preferenceRank: demoPreferenceRank(rowIndex + i, courseSource),
        isRetake: (rowIndex + i) % 5 === 2,
        courseCode: course.code,
        courseName: course.name,
        credits: Number(course.credits) || 0,
        courseType: course.type || '',
        sectionCode: section?.code || '',
        status: 'confirmed',
        ...demoStudentOpLogFields(rowIndex + i, courseSource, profile),
      })
    }
    rowIndex += ROWS_PER_BATCH
  }
  return out
}

export function buildCourseRegistrationResults(courses = selectableCourses.value) {
  return courses.map((course) => {
    const enrolled = course.totalCapacity - course.remainingCapacity
    return {
      id: `result-course-${course.id}`,
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      batchId: course.batchId,
      totalCapacity: course.totalCapacity,
      enrolled,
      remaining: course.remainingCapacity,
      utilization: course.totalCapacity
        ? Math.round((enrolled / course.totalCapacity) * 100)
        : 0,
    }
  })
}

/** 管理端按学生结果可变池（在 DEMO_CANDIDATE_STUDENTS 之后初始化，见下方） */
// export const adminStudentRegistrationResults = ref(buildStudentRegistrationResults())

/** 管理端按课程结果可变池（删除仅影响本表，不改可选课库） */
export const adminCourseRegistrationResults = ref(buildCourseRegistrationResults())

export function resetAdminStudentRegistrationResults() {
  adminStudentRegistrationResults.value = buildStudentRegistrationResults()
}

export function resetAdminCourseRegistrationResults() {
  adminCourseRegistrationResults.value = buildCourseRegistrationResults()
}

function includesStudentResultKeyword(haystack, needle) {
  if (!needle) return true
  return String(haystack || '')
    .toLowerCase()
    .includes(String(needle).toLowerCase())
}

function studentResultInTimeRange(operatedAt, start, end) {
  if (!start && !end) return true
  const ts = operatedAt || ''
  if (start && ts < start) return false
  if (end && ts > `${end} 23:59:59`) return false
  return true
}

export function filterStudentResults(rows, filters = {}) {
  let list = [...rows]
  const studentId = String(filters.studentId || '').trim().toLowerCase()
  const studentName = String(filters.studentName || '').trim().toLowerCase()
  const programme = String(filters.programme || '').trim().toLowerCase()
  const courseCode = String(filters.courseCode || '').trim().toLowerCase()
  const studentKeyword = String(filters.studentKeyword || '').trim().toLowerCase()
  const courseKeyword = String(filters.courseKeyword || '').trim().toLowerCase()
  const operatorKeyword = String(filters.operatorKeyword || '').trim().toLowerCase()
  let timeStart = filters.timeStart || ''
  let timeEnd = filters.timeEnd || ''
  if (timeStart && timeEnd && timeStart > timeEnd) {
    const tmp = timeStart
    timeStart = timeEnd
    timeEnd = tmp
  }

  if (programme) {
    list = list.filter((r) => String(r.programme || '').toLowerCase().includes(programme))
  }
  if (filters.batchId) {
    list = list.filter((r) => r.batchId === filters.batchId)
  }
  if (filters.round) {
    list = list.filter((r) => r.round === filters.round)
  }
  if (filters.opResult) {
    list = list.filter((r) => r.opResult === filters.opResult)
  }
  if (studentKeyword) {
    list = list.filter(
      (r) =>
        includesStudentResultKeyword(r.studentId, studentKeyword) ||
        includesStudentResultKeyword(r.studentName, studentKeyword),
    )
  }
  if (courseKeyword) {
    list = list.filter(
      (r) =>
        includesStudentResultKeyword(r.courseCode, courseKeyword) ||
        includesStudentResultKeyword(r.courseName, courseKeyword),
    )
  }
  if (operatorKeyword) {
    list = list.filter(
      (r) =>
        includesStudentResultKeyword(r.operatorId, operatorKeyword) ||
        includesStudentResultKeyword(r.operatorName, operatorKeyword) ||
        includesStudentResultKeyword(formatStudentOperatorDisplay(r), operatorKeyword),
    )
  }
  if (timeStart || timeEnd) {
    list = list.filter((r) => studentResultInTimeRange(r.operatedAt, timeStart, timeEnd))
  }
  // 兼容旧筛：独立学号/姓名/课程代码
  if (studentId) {
    list = list.filter((r) => String(r.studentId || '').toLowerCase().includes(studentId))
  }
  if (studentName) {
    list = list.filter((r) => String(r.studentName || '').toLowerCase().includes(studentName))
  }
  if (courseCode) {
    list = list.filter((r) => String(r.courseCode || '').toLowerCase().includes(courseCode))
  }
  if (filters.status) list = list.filter((r) => r.status === filters.status)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) =>
        r.studentId.toLowerCase().includes(kw) ||
        r.studentName.toLowerCase().includes(kw) ||
        String(r.courseCode || '')
          .toLowerCase()
          .includes(kw) ||
        String(r.courseName || '')
          .toLowerCase()
          .includes(kw),
    )
  }
  return list
}

export function filterCourseResults(rows, filters = {}) {
  let list = [...rows]
  if (filters.batchId) list = list.filter((r) => r.batchId === filters.batchId)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.courseCode.toLowerCase().includes(kw) || r.courseName.toLowerCase().includes(kw),
    )
  }
  return list
}

export function syncStudyPlanDemo() {
  return { ok: true, messageKey: 'courseRegistration.result.syncSuccess' }
}

/** 目标课程班选项（课 + 教学分组）；可按 courseId / batchId 过滤，可仅返回未满员 */
export function listTargetCourseSectionOptions(courseId = '', options = {}) {
  const batchId = options.batchId || ''
  const onlyAvailable = Boolean(options.onlyAvailable)
  const list = []
  for (const course of selectableCourses.value) {
    if (courseId && course.id !== courseId) continue
    if (batchId && course.batchId !== batchId) continue
    for (const section of course.sections || []) {
      const enrolled = Math.max(0, Number(section.enrolled) || 0)
      const capacity = Math.max(0, Number(section.capacity) || 0)
      const remaining = capacity > 0 ? Math.max(0, capacity - enrolled) : Number(course.remainingCapacity) || 0
      const isFull =
        capacity > 0 ? enrolled >= capacity : Number(course.remainingCapacity ?? 0) <= 0
      if (onlyAvailable && isFull) continue
      list.push({
        value: `${course.id}::${section.id}`,
        courseId: course.id,
        sectionId: section.id,
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        courseType: course.type || '',
        schoolElectiveCategory: resolveSchoolElectiveCategory(course),
        sectionCode: section.code,
        sectionName: formatCourseSectionName(section),
        batchId: course.batchId || '',
        enrolled,
        capacity,
        remaining,
        isFull,
        // 不限额代选：不展示已选/容量；分组展示用「分组名称{code}」
        label: `${course.code} ${course.name} · ${formatCourseSectionName(section)}`,
      })
    }
  }
  return list
}

/**
 * 判断目标分组是否仍可加课（未满员）
 * @param {string} targetValue courseId::sectionId
 * @returns {boolean}
 */
export function isTargetSectionAvailable(targetValue) {
  const opt = listTargetCourseSectionOptions().find((o) => o.value === targetValue)
  return Boolean(opt && !opt.isFull)
}

const DEMO_CANDIDATE_STUDENTS = [
  {
    studentId: 'BUS2409020',
    studentName: 'Wong Mei Ling',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2024',
    programme: 'BUS',
    intake: '2409',
    groupName: 'BUS2409-G1',
    studentCategory: 'Local',
    relativeSemester: 4,
  },
  {
    studentId: 'COS2409001',
    studentName: 'Ahmad bin Ali',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2024',
    programme: 'COS',
    intake: '2409',
    groupName: 'COS2409-G1',
    studentCategory: 'Local',
    relativeSemester: 4,
  },
  {
    studentId: 'COS2504015',
    studentName: 'Tan Mei Ling',
    gender: 'F',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'COS',
    intake: '2504',
    groupName: 'COS2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'DSA2504002',
    studentName: 'Lee Wei Ming',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'DSA',
    intake: '2504',
    groupName: 'DSA2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'SWE2409001',
    studentName: 'Tan Wei Ming',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2024',
    programme: 'SWE',
    intake: '2409',
    groupName: 'SWE2409-G1',
    studentCategory: 'Local',
    relativeSemester: 4,
  },
  {
    studentId: 'SWE2409012',
    studentName: 'Lim Jia Hui',
    gender: 'F',
    faculty: 'School of Information',
    grade: '2024',
    programme: 'SWE',
    intake: '2409',
    groupName: 'SWE2409-G2',
    studentCategory: 'Local',
    relativeSemester: 3,
  },
  {
    studentId: 'AIT2409010',
    studentName: 'Siti Nurhaliza',
    gender: 'F',
    faculty: 'School of Information',
    grade: '2024',
    programme: 'AIT',
    intake: '2409',
    groupName: 'SWE2409-G1',
    studentCategory: 'Local',
    relativeSemester: 4,
  },
  {
    studentId: 'ACC2409008',
    studentName: 'Chong Kai Xin',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2024',
    programme: 'ACC',
    intake: '2409',
    groupName: 'BUS2409-G1',
    studentCategory: 'International',
    relativeSemester: 3,
  },
  {
    studentId: 'MAT2504003',
    studentName: 'Raj Kumar',
    gender: 'M',
    faculty: 'School of Energy and Chemical Engineering',
    grade: '2025',
    programme: 'MAT',
    intake: '2504',
    groupName: 'MAT2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'FIN2409011',
    studentName: 'Nurul Aina',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2024',
    programme: 'FIN',
    intake: '2409',
    groupName: 'BUS2409-G1',
    studentCategory: 'Local',
    relativeSemester: 5,
  },
  {
    studentId: 'ENG2409018',
    studentName: 'Emily Tan',
    gender: 'F',
    faculty: 'School of Humanities',
    grade: '2024',
    programme: 'ENG',
    intake: '2409',
    groupName: 'ENG2409-G1',
    studentCategory: 'Local',
    relativeSemester: 5,
  },
  {
    studentId: 'CHE2409006',
    studentName: 'Koh Wei Jie',
    gender: 'M',
    faculty: 'School of Energy and Chemical Engineering',
    grade: '2024',
    programme: 'CHE',
    intake: '2409',
    groupName: 'CHE2409-G1',
    studentCategory: 'Local',
    relativeSemester: 3,
  },
  {
    studentId: 'PHY2504004',
    studentName: 'Amira Hassan',
    gender: 'F',
    faculty: 'School of Energy and Chemical Engineering',
    grade: '2025',
    programme: 'PHY',
    intake: '2504',
    groupName: 'PHY2504-G1',
    studentCategory: 'International',
    relativeSemester: 2,
  },
  {
    studentId: 'BIO2409014',
    studentName: 'Daniel Lim',
    gender: 'M',
    faculty: 'School of Energy and Chemical Engineering',
    grade: '2024',
    programme: 'BIO',
    intake: '2409',
    groupName: 'BIO2409-G1',
    studentCategory: 'Local',
    relativeSemester: 4,
  },
  {
    studentId: 'ACC2504009',
    studentName: 'Priya Sharma',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2025',
    programme: 'ACC',
    intake: '2504',
    groupName: 'BUS2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'FIN2504010',
    studentName: 'Jason Ong',
    gender: 'M',
    faculty: 'School of Business',
    grade: '2025',
    programme: 'FIN',
    intake: '2504',
    groupName: 'BUS2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'SWE2409025',
    studentName: 'Grace Yap',
    gender: 'F',
    faculty: 'School of Information',
    grade: '2024',
    programme: 'SWE',
    intake: '2409',
    groupName: 'SWE2409-G1',
    studentCategory: 'Local',
    relativeSemester: 6,
  },
  {
    studentId: 'AIT2504011',
    studentName: 'Farid Ismail',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'AIT',
    intake: '2504',
    groupName: 'AIT2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'BUS2409030',
    studentName: 'Nicole Chua',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2024',
    programme: 'BUS',
    intake: '2409',
    groupName: 'BUS2409-G2',
    studentCategory: 'International',
    relativeSemester: 3,
  },
  {
    studentId: 'MAT2409016',
    studentName: 'Hafiz Rahman',
    gender: 'M',
    faculty: 'School of Energy and Chemical Engineering',
    grade: '2024',
    programme: 'MAT',
    intake: '2409',
    groupName: 'MAT2409-G1',
    studentCategory: 'Local',
    relativeSemester: 5,
  },
  {
    studentId: 'COS2409022',
    studentName: 'Sophie Ng',
    gender: 'F',
    faculty: 'School of Information',
    grade: '2024',
    programme: 'COS',
    intake: '2409',
    groupName: 'COS2409-G2',
    studentCategory: 'Local',
    relativeSemester: 4,
  },
  {
    studentId: 'DSA2409008',
    studentName: 'Marcus Teo',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2024',
    programme: 'DSA',
    intake: '2409',
    groupName: 'DSA2409-G1',
    studentCategory: 'Local',
    relativeSemester: 3,
  },
  {
    studentId: 'SWE2504019',
    studentName: 'Aisha Rahman',
    gender: 'F',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'SWE',
    intake: '2504',
    groupName: 'SWE2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'FIN2409028',
    studentName: 'Brian Koh',
    gender: 'M',
    faculty: 'School of Business',
    grade: '2024',
    programme: 'FIN',
    intake: '2409',
    groupName: 'BUS2409-G1',
    studentCategory: 'Local',
    relativeSemester: 4,
  },
  {
    studentId: 'ACC2409033',
    studentName: 'Cathy Wong',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2024',
    programme: 'ACC',
    intake: '2409',
    groupName: 'BUS2409-G2',
    studentCategory: 'International',
    relativeSemester: 5,
  },
  // 白名单选人池扩容（未入初始白名单，保证可选 ≥10）
  {
    studentId: 'COS2504021',
    studentName: 'Kevin Lim',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'COS',
    intake: '2504',
    groupName: 'COS2504-G2',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'DSA2504018',
    studentName: 'Maya Chen',
    gender: 'F',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'DSA',
    intake: '2504',
    groupName: 'DSA2504-G2',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'SWE2504022',
    studentName: 'Owen Park',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'SWE',
    intake: '2504',
    groupName: 'SWE2504-G2',
    studentCategory: 'International',
    relativeSemester: 2,
  },
  {
    studentId: 'BUS2504015',
    studentName: 'Rachel Teo',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2025',
    programme: 'BUS',
    intake: '2504',
    groupName: 'BUS2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'ACC2504016',
    studentName: 'Samuel Goh',
    gender: 'M',
    faculty: 'School of Business',
    grade: '2025',
    programme: 'ACC',
    intake: '2504',
    groupName: 'BUS2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'FIN2504017',
    studentName: 'Tina Ng',
    gender: 'F',
    faculty: 'School of Business',
    grade: '2025',
    programme: 'FIN',
    intake: '2504',
    groupName: 'BUS2504-G2',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'AIT2504020',
    studentName: 'Victor Tan',
    gender: 'M',
    faculty: 'School of Information',
    grade: '2025',
    programme: 'AIT',
    intake: '2504',
    groupName: 'AIT2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'ENG2504007',
    studentName: 'Wendy Loh',
    gender: 'F',
    faculty: 'School of Humanities',
    grade: '2025',
    programme: 'ENG',
    intake: '2504',
    groupName: 'ENG2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
  {
    studentId: 'CHE2504005',
    studentName: 'Xavier Ong',
    gender: 'M',
    faculty: 'School of Energy and Chemical Engineering',
    grade: '2025',
    programme: 'CHE',
    intake: '2504',
    groupName: 'CHE2504-G1',
    studentCategory: 'International',
    relativeSemester: 2,
  },
  {
    studentId: 'MAT2504012',
    studentName: 'Yvonne Koh',
    gender: 'F',
    faculty: 'School of Energy and Chemical Engineering',
    grade: '2025',
    programme: 'MAT',
    intake: '2504',
    groupName: 'MAT2504-G1',
    studentCategory: 'Local',
    relativeSemester: 2,
  },
]

export function listAdminAddStudentCandidates() {
  return DEMO_CANDIDATE_STUDENTS.map((row) => ({ ...row }))
}

/** 管理端按学生结果可变池（依赖候选人池，须在 DEMO_CANDIDATE_STUDENTS 之后初始化） */
export const adminStudentRegistrationResults = ref(buildStudentRegistrationResults())

export function getAdminAddStudentFilterOptions() {
  return {
    faculties: batchScopeFacultyOptions,
  }
}

export function filterAdminAddStudentCandidates(rows, filters = {}) {
  let list = [...rows]
  const studentId = String(filters.studentId || '').trim().toLowerCase()
  const studentName = String(filters.studentName || '').trim().toLowerCase()
  if (studentId) list = list.filter((r) => r.studentId.toLowerCase().includes(studentId))
  if (studentName) list = list.filter((r) => r.studentName.toLowerCase().includes(studentName))
  if (filters.faculty) list = list.filter((r) => r.faculty === filters.faculty)
  if (filters.intake) {
    const target = formatIntakeBatch(filters.intake) || String(filters.intake).trim()
    list = list.filter((r) => {
      const formatted = formatIntakeBatch(r.intake) || String(r.intake || '')
      return formatted === target || String(r.intake || '').includes(String(filters.intake).trim())
    })
  }
  return list
}

function findTargetSection(targetValue) {
  return listTargetCourseSectionOptions().find((opt) => opt.value === targetValue) || null
}

/**
 * 管理端代选：为多名学生挂上目标课程班
 * @param {{ targetValue: string, studentIds: string[], allowOverCapacity?: boolean }} payload
 *   targetValue=courseId::sectionId；studentIds 学号列表；
 *   allowOverCapacity=true 时跳过满员校验（仅学生维度「新增」）
 * @returns {{ ok: boolean, added?: number, errorKey?: string, overCapacity?: boolean }}
 */
export function addAdminStudentRegistrations({ targetValue, studentIds, allowOverCapacity = false }) {
  const target = findTargetSection(targetValue)
  if (!target) return { ok: false, errorKey: 'courseRegistration.result.addTargetRequired' }
  if (!studentIds?.length) return { ok: false, errorKey: 'courseRegistration.result.addStudentRequired' }
  const overCapacity = Boolean(target.isFull)
  // 默认满员不可代选；学生维度不限额入口传 allowOverCapacity
  if (!allowOverCapacity && (target.isFull || !isTargetSectionAvailable(targetValue))) {
    return { ok: false, errorKey: 'courseRegistration.result.addCourseFull' }
  }

  const candidates = listAdminAddStudentCandidates()
  const course = selectableCourses.value.find((c) => c.id === target.courseId)
  const section = course?.sections?.find((s) => s.id === target.sectionId)
  let added = 0

  for (const studentId of studentIds) {
    if (!allowOverCapacity && !isTargetSectionAvailable(targetValue)) {
      if (!added) return { ok: false, errorKey: 'courseRegistration.result.addCourseFull' }
      break
    }

    const profile = candidates.find((s) => s.studentId === studentId)
    if (!profile) continue

    const existing = adminStudentRegistrationResults.value.find(
      (r) => r.studentId === studentId && r.courseCode === target.courseCode,
    )
    // 原逻辑：已有同课记录则跳过；改为明确报错，避免静默失败
    // if (existing) continue
    if (existing) {
      return { ok: false, errorKey: 'courseRegistration.result.addCourseDuplicate' }
    }

    const now = new Date()
    const operatedAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
    adminStudentRegistrationResults.value.unshift({
      id: `result-stu-manual-${studentId}-${target.courseCode}-${Date.now()}`,
      studentId: profile.studentId,
      studentName: profile.studentName,
      programme: profile.programme,
      intake: profile.intake || (profile.grade === '2025' ? '2504' : '2409'),
      batchId: course?.batchId || '',
      batchName: resolveBatchName(course?.batchId),
      courseSource: 'admin',
      isRetake: false,
      courseCode: target.courseCode,
      courseName: course?.name || target.courseCode,
      credits: Number(target.credits) || Number(course?.credits) || 0,
      courseType: course?.type || '',
      sectionCode: section?.code || target.sectionCode || '',
      status: 'confirmed',
      round: 'main',
      opResult: 'registerSuccess',
      operatorId: DEMO_ADMIN_OPERATOR_ID,
      operatorName: DEMO_ADMIN_OPERATOR_NAME,
      operatedAt,
    })
    added += 1

    // demo：分组已选人数 +1，便于后续满员判断与选项刷新
    if (section) {
      section.enrolled = Math.max(0, Number(section.enrolled) || 0) + 1
      if (course && Number(course.remainingCapacity) > 0) {
        course.remainingCapacity = Math.max(0, Number(course.remainingCapacity) - 1)
      }
    }

    const monitor = registrationMonitorQueue.value.find((r) => r.studentId === studentId)
    if (monitor) {
      const schedule = monitor.schedule || []
      if (!schedule.some((s) => s.course === target.courseCode)) {
        schedule.push({ day: 'Mon', start: 10, end: 12, course: target.courseCode })
        monitor.schedule = schedule
        monitor.credits = (Number(monitor.credits) || 0) + Number(target.credits || 0)
      }
    }

    // 当前演示生：同步写入学生端确认课，并标记管理端操作人
    if (studentId === DEFAULT_MOCK_CURRENT_STUDENT_ID && course) {
      const already = studentConfirmedCourses.value.some((item) => item.courseId === course.id)
      if (!already) {
        const time = section?.time || ''
        studentConfirmedCourses.value = [
          ...studentConfirmedCourses.value,
          {
            courseId: course.id,
            courseCode: course.code,
            courseName: course.name,
            credits: course.credits,
            type: course.type,
            sectionId: section?.id || target.sectionId,
            sectionCode: section?.code || target.sectionCode,
            time,
            classTime: deriveClassTime(time),
            weekRange: '1-14',
            room: section?.room || '',
            lecturer: section?.lecturer || '',
            batchId: course.batchId,
            selectedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            operatorName: DEMO_ADMIN_OPERATOR_NAME,
            sourceType: 'admin',
            roundKey: '',
          },
        ]
      } else {
        studentConfirmedCourses.value = studentConfirmedCourses.value.map((item) =>
          item.courseId === course.id
            ? {
                ...item,
                operatorName: item.operatorName || DEMO_ADMIN_OPERATOR_NAME,
                sourceType: 'admin',
                roundKey: '',
              }
            : item,
        )
      }
    }
  }

  if (!added) {
    return { ok: false, errorKey: 'courseRegistration.result.addStudentRequired' }
  }
  return { ok: true, added, overCapacity }
}

export function removeAdminStudentRegistrations(ids = []) {
  if (!ids.length) return { ok: false, errorKey: 'courseRegistration.result.deleteEmpty' }
  const idSet = new Set(ids)
  const before = adminStudentRegistrationResults.value.length
  adminStudentRegistrationResults.value = adminStudentRegistrationResults.value.filter(
    (row) => !idSet.has(row.id),
  )
  return { ok: true, removed: before - adminStudentRegistrationResults.value.length }
}

export function removeAdminCourseRegistrations(ids = []) {
  if (!ids.length) return { ok: false, errorKey: 'courseRegistration.result.deleteEmpty' }
  const idSet = new Set(ids)
  const before = adminCourseRegistrationResults.value.length
  adminCourseRegistrationResults.value = adminCourseRegistrationResults.value.filter(
    (row) => !idSet.has(row.id),
  )
  return { ok: true, removed: before - adminCourseRegistrationResults.value.length }
}
