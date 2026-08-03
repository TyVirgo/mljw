import { ref } from 'vue'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import { selectableCourses } from './selectableCourses.js'
import { batchScopeFacultyOptions } from './batchScopeRules.js'
import { studentConfirmedCourses } from './studentRegistrationStore.js'
import { getBatchById, registrationBatches } from './registrationBatches.js'
import { DEFAULT_MOCK_CURRENT_STUDENT_ID } from '../mockCurrentStudent.js'
import { deriveClassTime } from './sectionScheduleFields.js'
import { formatIntakeBatch } from '../intakeSets.js'

/** Demo：管理端代选操作人 */
export const DEMO_ADMIN_OPERATOR_NAME = 'AC Lee'

const DEMO_RESULT_SOURCES = ['preselect', 'main', 'supplement', 'admin']

function resolveBatchName(batchId) {
  return batchId ? getBatchById(batchId)?.name || '' : ''
}

function demoCourseSource(rowIndex) {
  return DEMO_RESULT_SOURCES[rowIndex % DEMO_RESULT_SOURCES.length]
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
      rows.push({
        id: `result-stu-${row.id}-${courseCode}-${index}`,
        studentId: row.studentId,
        studentName: row.studentName,
        programme: row.programme,
        intake: row.intake,
        batchId: course?.batchId || '',
        batchName: resolveBatchName(course?.batchId),
        courseSource: demoCourseSource(rowIndex),
        isRetake: rowIndex % 5 === 2,
        courseCode,
        courseName: course?.name || courseCode,
        credits: Number(course?.credits) || 0,
        courseType: course?.type || '',
        sectionCode: section?.code || '',
        status: row.status === 'normal' ? 'confirmed' : 'warning',
      })
      rowIndex += 1
    })
  }
  // 监控队列主要挂在主批；再按批次补齐演示行，保证切换任意批次学生 Tab 非空
  rows.push(...buildBatchCoverageStudentResults(rowIndex))
  return rows
}

/**
 * 为每个选课批次补若干学生×课程明细（演示用）
 * @param {number} startIndex 用于轮转 courseSource / isRetake
 * @returns {object[]}
 */
function buildBatchCoverageStudentResults(startIndex = 0) {
  const candidates = listAdminAddStudentCandidates()
  if (!candidates.length) return []
  const out = []
  let rowIndex = startIndex
  const primaryBatchId = 'batch-2504-m1'
  for (const batch of registrationBatches.value) {
    const limit = batch.id === primaryBatchId ? 6 : 4
    const courses = selectableCourses.value.filter((c) => c.batchId === batch.id).slice(0, limit)
    courses.forEach((course, courseIndex) => {
      const profile = candidates[(rowIndex + courseIndex) % candidates.length]
      const section = course.sections?.[courseIndex % (course.sections?.length || 1)] || course.sections?.[0]
      out.push({
        id: `result-stu-batch-${batch.id}-${course.code}-${profile.studentId}`,
        studentId: profile.studentId,
        studentName: profile.studentName,
        programme: profile.programme,
        intake: profile.intake || (profile.grade === '2025' ? '2504' : '2409'),
        batchId: batch.id,
        batchName: batch.name || resolveBatchName(batch.id),
        courseSource: demoCourseSource(rowIndex),
        isRetake: rowIndex % 5 === 2,
        courseCode: course.code,
        courseName: course.name,
        credits: Number(course.credits) || 0,
        courseType: course.type || '',
        sectionCode: section?.code || '',
        status: 'confirmed',
      })
      rowIndex += 1
    })
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

export function filterStudentResults(rows, filters = {}) {
  let list = [...rows]
  const studentId = String(filters.studentId || '').trim().toLowerCase()
  const studentName = String(filters.studentName || '').trim().toLowerCase()
  const programme = String(filters.programme || '').trim().toLowerCase()
  const courseCode = String(filters.courseCode || '').trim().toLowerCase()
  if (programme) {
    list = list.filter((r) => String(r.programme || '').toLowerCase().includes(programme))
  }
  if (filters.batchId) {
    list = list.filter((r) => r.batchId === filters.batchId)
  }
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
        sectionCode: section.code,
        batchId: course.batchId || '',
        enrolled,
        capacity,
        remaining,
        isFull,
        label: `${course.code} ${course.name} · ${section.code}（${enrolled}/${capacity || '—'}）`,
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
 * @param {{ targetValue: string, studentIds: string[] }} payload targetValue=courseId::sectionId；studentIds 学号列表
 * @returns {{ ok: boolean, added?: number, errorKey?: string }}
 */
export function addAdminStudentRegistrations({ targetValue, studentIds }) {
  const target = findTargetSection(targetValue)
  if (!target) return { ok: false, errorKey: 'courseRegistration.result.addTargetRequired' }
  if (!studentIds?.length) return { ok: false, errorKey: 'courseRegistration.result.addStudentRequired' }
  // 提交时再校验满员：满员不可代选
  if (target.isFull || !isTargetSectionAvailable(targetValue)) {
    return { ok: false, errorKey: 'courseRegistration.result.addCourseFull' }
  }

  const candidates = listAdminAddStudentCandidates()
  const course = selectableCourses.value.find((c) => c.id === target.courseId)
  const section = course?.sections?.find((s) => s.id === target.sectionId)
  let added = 0

  for (const studentId of studentIds) {
    // 多人代选时按人次复核容量，避免超额
    if (!isTargetSectionAvailable(targetValue)) {
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
  return { ok: true, added }
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
