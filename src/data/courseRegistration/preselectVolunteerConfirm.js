import { ref, computed } from 'vue'
import { selectableCourses } from './selectableCourses.js'
import { registrationBatches } from './registrationBatches.js'
import { getCurrentStudent } from '../mockCurrentStudent.js'

/**
 * 第一轮志愿名单（按教学分组）
 * key: courseId + sectionId
 * capacity: section.capacity（各组之和 = 课总容量）
 */

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatSubmittedAt(offsetMinutes) {
  const d = new Date(Date.UTC(2025, 7, 25, 9, 0, 0))
  d.setUTCMinutes(d.getUTCMinutes() + offsetMinutes)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
}

function sortVolunteers(list) {
  return [...list].sort((a, b) => {
    const sem = (Number(b.relativeSemester) || 0) - (Number(a.relativeSemester) || 0)
    if (sem !== 0) return sem
    return String(a.submittedAt || '').localeCompare(String(b.submittedAt || ''))
  })
}

function volunteerIdsKey(list) {
  // 原仅比学号集合（排序后），无法感知顺序变化；保留函数名兼容，改为保序键
  return (list || []).map((v) => v.studentId).join(',')
}

/**
 * 名单顺序键（与 volunteerIdsKey 同实现；语义：成员+顺序）
 * @param {object[]} list
 * @returns {string}
 */
function volunteerOrderKey(list) {
  return volunteerIdsKey(list)
}

function cloneVolunteers(list) {
  return (list || []).map((v) => ({ ...v }))
}

/**
 * Fisher–Yates 洗牌，返回新数组
 * @param {object[]} list
 * @returns {object[]}
 */
export function shuffleVolunteerList(list) {
  const arr = cloneVolunteers(list)
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

const DEMO_POOL = [
  { studentId: 'SWE2409001', studentName: 'Wei Ming', programme: 'SWE', intake: '2409', relativeSemester: 4 },
  { studentId: 'SWE2409002', studentName: 'Li Hua', programme: 'SWE', intake: '2409', relativeSemester: 3 },
  { studentId: 'AIT2409005', studentName: 'Tan Mei Ling', programme: 'AIT', intake: '2409', relativeSemester: 4 },
  { studentId: 'ACC2409003', studentName: 'Ahmad Faiz', programme: 'ACC', intake: '2409', relativeSemester: 5 },
  { studentId: 'FIN2409007', studentName: 'Park Ji-ho', programme: 'FIN', intake: '2409', relativeSemester: 6 },
  { studentId: 'MAT2504001', studentName: 'Chen Yu', programme: 'MAT', intake: '2504', relativeSemester: 2 },
  { studentId: 'SWE2504002', studentName: 'Nur Aisyah', programme: 'SWE', intake: '2504', relativeSemester: 2 },
  { studentId: 'AIT2409010', studentName: 'Siti Nurhaliza', programme: 'AIT', intake: '2409', relativeSemester: 4 },
  { studentId: 'ACC2409008', studentName: 'Chong Kai Xin', programme: 'ACC', intake: '2409', relativeSemester: 3 },
  { studentId: 'MAT2504003', studentName: 'Raj Kumar', programme: 'MAT', intake: '2504', relativeSemester: 2 },
  { studentId: 'FIN2409011', studentName: 'Nurul Aina', programme: 'FIN', intake: '2409', relativeSemester: 5 },
  { studentId: 'SWE2409012', studentName: 'Wong Jia Wei', programme: 'SWE', intake: '2409', relativeSemester: 3 },
  { studentId: 'BUS2409020', studentName: 'Wong Mei Ling', programme: 'BUS', intake: '2409', relativeSemester: 4 },
  { studentId: 'COS2409001', studentName: 'Ahmad bin Ali', programme: 'COS', intake: '2409', relativeSemester: 4 },
  { studentId: 'COS2504015', studentName: 'Tan Mei Ling', programme: 'COS', intake: '2504', relativeSemester: 2 },
  { studentId: 'DSA2504002', studentName: 'Lee Wei Ming', programme: 'DSA', intake: '2504', relativeSemester: 2 },
  { studentId: 'ENG2409018', studentName: 'Emily Tan', programme: 'ENG', intake: '2409', relativeSemester: 5 },
  { studentId: 'CHE2409006', studentName: 'Koh Wei Jie', programme: 'CHE', intake: '2409', relativeSemester: 3 },
  { studentId: 'PHY2504004', studentName: 'Amira Hassan', programme: 'PHY', intake: '2504', relativeSemester: 2 },
  { studentId: 'BIO2409014', studentName: 'Daniel Lim', programme: 'BIO', intake: '2409', relativeSemester: 4 },
  { studentId: 'ACC2504009', studentName: 'Priya Sharma', programme: 'ACC', intake: '2504', relativeSemester: 2 },
  { studentId: 'FIN2504010', studentName: 'Jason Ong', programme: 'FIN', intake: '2504', relativeSemester: 2 },
  { studentId: 'SWE2409025', studentName: 'Grace Yap', programme: 'SWE', intake: '2409', relativeSemester: 6 },
  { studentId: 'AIT2504011', studentName: 'Farid Ismail', programme: 'AIT', intake: '2504', relativeSemester: 2 },
  { studentId: 'BUS2409030', studentName: 'Nicole Chua', programme: 'BUS', intake: '2409', relativeSemester: 3 },
  { studentId: 'MAT2409016', studentName: 'Hafiz Rahman', programme: 'MAT', intake: '2409', relativeSemester: 5 },
  { studentId: 'COS2409022', studentName: 'Sophie Ng', programme: 'COS', intake: '2409', relativeSemester: 4 },
  { studentId: 'DSA2409008', studentName: 'Marcus Teo', programme: 'DSA', intake: '2409', relativeSemester: 3 },
]

function pickVolunteers(seed, count) {
  const out = []
  for (let i = 0; i < count; i += 1) {
    const profile = DEMO_POOL[(seed + i * 3) % DEMO_POOL.length]
    // 超额演示：超出池大小时学号加后缀保证唯一；姓名保持干净不拼括号序号
    const overflow = i >= DEMO_POOL.length
    out.push({
      id: `vol-${profile.studentId}-${seed}-${i}`,
      studentId: overflow ? `${profile.studentId}-x${seed}-${i}` : profile.studentId,
      // 原：overflow ? `${profile.studentName} (${i + 1})` : profile.studentName
      studentName: profile.studentName,
      programme: profile.programme,
      intake: profile.intake,
      relativeSemester: profile.relativeSemester,
      submittedAt: formatSubmittedAt(seed * 11 + i * 5),
    })
  }
  const seen = new Set()
  return out.filter((row) => {
    if (seen.has(row.studentId)) return false
    seen.add(row.studentId)
    return true
  })
}

function sectionStateKey(courseId, sectionId) {
  return `${courseId}::${sectionId}`
}

/** 主批保留较丰富演示；其它批次每批取前若干门，控制体积 */
const VOLUNTEER_SEED_COURSE_LIMIT_PRIMARY = 10
const VOLUNTEER_SEED_COURSE_LIMIT_OTHER = 4
const VOLUNTEER_PRIMARY_BATCH_ID = 'batch-2504-m1'

/**
 * 为全部批次生成第一轮志愿分组状态（每批至少覆盖若干门课）
 * @returns {object[]}
 */
function seedSectionStates() {
  const rows = []
  let seed = 0
  for (const batch of registrationBatches.value) {
    const limit =
      batch.id === VOLUNTEER_PRIMARY_BATCH_ID
        ? VOLUNTEER_SEED_COURSE_LIMIT_PRIMARY
        : VOLUNTEER_SEED_COURSE_LIMIT_OTHER
    const courses = selectableCourses.value.filter((c) => c.batchId === batch.id).slice(0, limit)
    const batchName = batch.name || ''
    for (const course of courses) {
      const sections = course.sections?.length ? course.sections : []
      for (const section of sections) {
        const capacity = Math.max(1, Number(section.capacity) || 20)
        // 演示绿/黄/红：未满 / 满额～2 倍内 / 超额 1 倍以上（学生提交不受容量限制）
        // 非主批用较轻人数，避免志愿池爆炸
        const mode = seed % 3
        let seedCount
        if (batch.id !== VOLUNTEER_PRIMARY_BATCH_ID) {
          seedCount = Math.max(2, Math.min(8, Math.floor(capacity * 0.25) + (seed % 3)))
        } else if (mode === 0) {
          seedCount = Math.max(1, Math.floor(capacity * 0.55))
        } else if (mode === 1) {
          seedCount = capacity + Math.max(1, Math.floor(capacity * 0.35))
        } else {
          seedCount = capacity * 2 + 2 + (seed % 4)
        }
        const volunteers = sortVolunteers(pickVolunteers(seed, seedCount))
        rows.push({
          key: sectionStateKey(course.id, section.id),
          courseId: course.id,
          sectionId: section.id,
          sectionCode: section.code,
          courseCode: course.code,
          courseName: course.name,
          courseType: course.type || '',
          credits: course.credits,
          batchId: course.batchId,
          batchName,
          capacity,
          volunteers,
          pendingDraftVolunteers: null,
          dirty: false,
        })
        seed += 1
      }
    }
  }
  return rows
}

export const volunteerCourseStates = ref(seedSectionStates())
export const volunteerFinalConfirmedAt = ref(null)
export const volunteerSecondRoundStarted = ref(false)
export const studentVolunteerCourseIds = ref([])

export function resetPreselectVolunteerConfirm() {
  volunteerCourseStates.value = seedSectionStates()
  volunteerFinalConfirmedAt.value = null
  volunteerSecondRoundStarted.value = false
  studentVolunteerCourseIds.value = []
}

/**
 * 指定批次志愿是否只读（已最终确认，或第二轮已开始）
 * @param {string} [batchId]
 * @returns {boolean}
 */
export function isVolunteerBatchReadonly(batchId) {
  if (volunteerSecondRoundStarted.value) return true
  if (!batchId) return false
  const batch = registrationBatches.value.find((b) => b.id === batchId)
  return Boolean(batch?.volunteerFinalConfirmedAt)
}

/**
 * 页面级只读：无 batchId 时仅看第二轮；有 batchId 时按批
 * @param {string} [batchId]
 * @returns {boolean}
 */
export function isVolunteerPageReadonly(batchId) {
  // 原：仅 return Boolean(volunteerSecondRoundStarted.value)
  return isVolunteerBatchReadonly(batchId)
}

/**
 * 当前批次是否已最终确认
 * @param {string} batchId
 * @returns {boolean}
 */
export function isVolunteerBatchFinalized(batchId) {
  if (!batchId) return false
  const batch = registrationBatches.value.find((b) => b.id === batchId)
  return Boolean(batch?.volunteerFinalConfirmedAt)
}

/**
 * 读取批次最终确认时间
 * @param {string} batchId
 * @returns {string|null}
 */
export function getVolunteerBatchFinalizedAt(batchId) {
  if (!batchId) return null
  const batch = registrationBatches.value.find((b) => b.id === batchId)
  return batch?.volunteerFinalConfirmedAt || null
}

export function listVolunteerCourseSummaries(filters = {}) {
  let list = volunteerCourseStates.value.map((row) => {
    const count = row.volunteers.length
    return {
      id: `volunteer-${row.key}`,
      key: row.key,
      courseId: row.courseId,
      sectionId: row.sectionId,
      sectionCode: row.sectionCode,
      courseCode: row.courseCode,
      courseName: row.courseName,
      courseType: row.courseType,
      credits: row.credits,
      batchId: row.batchId,
      batchName: row.batchName,
      volunteerCount: count,
      capacity: row.capacity,
      dirty: Boolean(row.dirty),
      capacityLabel: `${count}/${row.capacity}`,
    }
  })

  if (filters.batchId) {
    list = list.filter((r) => r.batchId === filters.batchId)
  }
  const courseCode = String(filters.courseCode || '').trim().toLowerCase()
  const courseName = String(filters.courseName || '').trim().toLowerCase()
  if (courseCode) {
    list = list.filter((r) => String(r.courseCode || '').toLowerCase().includes(courseCode))
  }
  if (courseName) {
    list = list.filter((r) => String(r.courseName || '').toLowerCase().includes(courseName))
  }
  if (filters.keyword) {
    const kw = String(filters.keyword).toLowerCase()
    list = list.filter(
      (r) =>
        r.courseCode.toLowerCase().includes(kw) ||
        r.courseName.toLowerCase().includes(kw) ||
        String(r.sectionCode || '')
          .toLowerCase()
          .includes(kw) ||
        String(r.batchName || '')
          .toLowerCase()
          .includes(kw),
    )
  }
  return list
}

export function getVolunteerSectionState(courseId, sectionId) {
  const key = sectionStateKey(courseId, sectionId)
  return volunteerCourseStates.value.find((c) => c.key === key) || null
}

/** @deprecated 兼容旧调用：仅 courseId 时取该课第一个分组 */
export function getVolunteerCourseState(courseId) {
  return volunteerCourseStates.value.find((c) => c.courseId === courseId) || null
}

export function getDraftVolunteers(courseId, sectionId) {
  const state = getVolunteerSectionState(courseId, sectionId)
  if (!state) return []
  // 打开抽屉只读已保存名单；未保存草稿不落库、关闭即丢弃，故不再回填 pendingDraft
  // 原：if (state.dirty && pending) return sortVolunteers(pending)
  return cloneVolunteers(state.volunteers)
}

export function getSortedVolunteers(courseId, sectionId) {
  return getDraftVolunteers(courseId, sectionId)
}

export function isVolunteerDraftFull(courseId, sectionId, draftList) {
  const state = getVolunteerSectionState(courseId, sectionId)
  if (!state) return true
  const list = draftList || getDraftVolunteers(courseId, sectionId)
  return list.length >= state.capacity
}

/**
 * 保存名单：保留当前顺序；容量内（前 capacity 名）视为本课选上；允许名单长于容量
 * @param {string} courseId
 * @param {string} sectionId
 * @param {object[]} draftVolunteers
 */
export function saveVolunteerCourseRoster(courseId, sectionId, draftVolunteers) {
  const statePeek = getVolunteerSectionState(courseId, sectionId)
  if (isVolunteerBatchReadonly(statePeek?.batchId)) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerRosterLocked' }
  }
  // 原：if (isVolunteerPageReadonly()) return volunteerReadonly
  const index = volunteerCourseStates.value.findIndex(
    (c) => c.key === sectionStateKey(courseId, sectionId),
  )
  if (index === -1) return { ok: false, errorKey: 'courseRegistration.result.volunteerCourseMissing' }

  const state = volunteerCourseStates.value[index]
  // 保留操作后顺序，不再 sortVolunteers；容量外仍可保留在名单中
  // 原：超容量直接拒绝保存 — 与「容量内外分界 + 随机后低学期进容量内」冲突，故注释
  const list = cloneVolunteers(draftVolunteers)

  volunteerCourseStates.value[index] = {
    ...state,
    volunteers: list,
    pendingDraftVolunteers: null,
    dirty: false,
  }
  return { ok: true, selectedCount: Math.min(list.length, state.capacity) }
}

export function stashVolunteerCourseDraft(courseId, sectionId, draftVolunteers) {
  const index = volunteerCourseStates.value.findIndex(
    (c) => c.key === sectionStateKey(courseId, sectionId),
  )
  if (index === -1) return
  const state = volunteerCourseStates.value[index]
  const dirty = volunteerOrderKey(state.volunteers) !== volunteerOrderKey(draftVolunteers)
  volunteerCourseStates.value[index] = {
    ...state,
    // 未保存不落名单；仅用 dirty 标记阻断「最终确认」，不回填 pending 作为已保存替代
    pendingDraftVolunteers: null,
    dirty,
  }
}

/**
 * 关闭未保存：清除 dirty，丢弃草稿痕迹
 * @param {string} courseId
 * @param {string} sectionId
 */
export function discardVolunteerCourseDraft(courseId, sectionId) {
  const index = volunteerCourseStates.value.findIndex(
    (c) => c.key === sectionStateKey(courseId, sectionId),
  )
  if (index === -1) return
  const state = volunteerCourseStates.value[index]
  volunteerCourseStates.value[index] = {
    ...state,
    pendingDraftVolunteers: null,
    dirty: false,
  }
}

export function markVolunteerDraft(courseId, sectionId, draftVolunteers) {
  stashVolunteerCourseDraft(courseId, sectionId, draftVolunteers)
}

export function listDirtyVolunteerCourses(batchId) {
  let list = volunteerCourseStates.value.filter((c) => c.dirty)
  if (batchId) list = list.filter((c) => c.batchId === batchId)
  return list
}

export const dirtyVolunteerCourseCount = computed(() => listDirtyVolunteerCourses().length)

/**
 * 对指定批次最终确认（每批仅一次）
 * @param {string} batchId
 */
export function finalizeVolunteerConfirm(batchId) {
  if (!batchId) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerBatchRequired' }
  }
  if (volunteerSecondRoundStarted.value) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerReadonly' }
  }
  const batch = registrationBatches.value.find((b) => b.id === batchId)
  if (!batch) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerBatchRequired' }
  }
  // 每批只允许最终确认一次
  if (batch.volunteerFinalConfirmedAt) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerAlreadyFinalized' }
  }
  const dirty = listDirtyVolunteerCourses(batchId)
  if (dirty.length) {
    return {
      ok: false,
      errorKey: 'courseRegistration.result.volunteerUnsavedBlock',
      errorParams: {
        count: dirty.length,
        courses: dirty.map((c) => `${c.courseCode}-${c.sectionCode}`).join(', '),
      },
    }
  }
  const at = new Date().toISOString()
  const index = registrationBatches.value.findIndex((b) => b.id === batchId)
  if (index === -1) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerBatchRequired' }
  }
  // 替换项以触发依赖 registrationBatches 的计算属性更新
  registrationBatches.value[index] = {
    ...registrationBatches.value[index],
    volunteerFinalConfirmedAt: at,
  }
  // 兼容旧全局字段：记录最近一次定稿时间（不再用于按批只读）
  volunteerFinalConfirmedAt.value = at
  // 原：for (const batch of active) batch.volunteerFinalConfirmedAt = at
  return { ok: true, confirmedAt: at }
}

/** 同课任一分组（含草稿）已有该学生 */
export function listStudentIdsOnCourse(courseId, { includeDraft = true } = {}) {
  const ids = new Set()
  for (const state of volunteerCourseStates.value) {
    if (state.courseId !== courseId) continue
    const list =
      includeDraft && state.dirty && Array.isArray(state.pendingDraftVolunteers)
        ? state.pendingDraftVolunteers
        : state.volunteers
    for (const v of list) ids.add(v.studentId)
  }
  return [...ids]
}

export function hasStudentVolunteeredCourse(courseId, studentId) {
  if (!courseId) return false
  const sid = studentId || getCurrentStudent()?.basicInfo?.studentId || ''
  if (sid && studentVolunteerCourseIds.value.includes(courseId)) return true
  if (!sid) return false
  return listStudentIdsOnCourse(courseId, { includeDraft: false }).includes(sid)
}

export function buildVolunteerDraftAfterAdd(courseId, sectionId, draftVolunteers, profiles) {
  const state = getVolunteerSectionState(courseId, sectionId)
  if (!state) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerCourseMissing' }
  }
  const draft = cloneVolunteers(draftVolunteers)
  const existing = new Set(draft.map((v) => v.studentId))
  const onCourse = new Set(listStudentIdsOnCourse(courseId, { includeDraft: true }))
  const remaining = state.capacity - draft.length
  if (remaining <= 0) {
    return {
      ok: false,
      errorKey: 'courseRegistration.result.volunteerFullHint',
      errorParams: { count: state.capacity, cap: state.capacity },
    }
  }

  const incoming = (profiles || []).filter(
    (p) => p?.studentId && !existing.has(p.studentId) && !onCourse.has(p.studentId),
  )
  if (!incoming.length) {
    return { ok: false, errorKey: 'courseRegistration.result.addStudentRequired' }
  }
  if (incoming.length > remaining) {
    return {
      ok: false,
      errorKey: 'courseRegistration.result.volunteerAddExceed',
      errorParams: { remaining, cap: state.capacity },
    }
  }

  const now = new Date()
  const submittedAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  incoming.forEach((profile, i) => {
    draft.push({
      id: `vol-${profile.studentId}-${sectionId}-${Date.now()}-${i}`,
      studentId: profile.studentId,
      studentName: profile.studentName || profile.studentId,
      programme: profile.programme || '—',
      intake: profile.intake || (profile.grade === '2025' ? '2504' : '2409'),
      relativeSemester: Number(profile.relativeSemester) || (profile.grade === '2025' ? 2 : 4),
      submittedAt,
      sectionCode: state.sectionCode,
    })
  })
  // 手动添加追加到名单末尾（未满时即容量内末位），不再按学期重排
  // return { ok: true, draft: sortVolunteers(draft) }
  return { ok: true, draft }
}

export function submitStudentPreselectVolunteer({ course, section, studentFields }) {
  if (!course || !section || !studentFields?.studentId) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSubmitFailed' }
  }
  if (hasStudentVolunteeredCourse(course.id, studentFields.studentId)) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerDuplicate' }
  }

  let index = volunteerCourseStates.value.findIndex(
    (c) => c.key === sectionStateKey(course.id, section.id),
  )
  if (index === -1) {
    const batchName = registrationBatches.value.find((b) => b.id === course.batchId)?.name || ''
    const capacity = Math.max(1, Number(section.capacity) || 20)
    volunteerCourseStates.value = [
      ...volunteerCourseStates.value,
      {
        key: sectionStateKey(course.id, section.id),
        courseId: course.id,
        sectionId: section.id,
        sectionCode: section.code,
        courseCode: course.code,
        courseName: course.name,
        courseType: course.type || '',
        credits: course.credits,
        batchId: course.batchId,
        batchName,
        capacity,
        volunteers: [],
        pendingDraftVolunteers: null,
        dirty: false,
      },
    ]
    index = volunteerCourseStates.value.length - 1
  }

  const state = volunteerCourseStates.value[index]
  if (state.volunteers.some((v) => v.studentId === studentFields.studentId)) {
    studentVolunteerCourseIds.value = [...new Set([...studentVolunteerCourseIds.value, course.id])]
    return { ok: true, volunteered: true }
  }
  // 第一轮志愿不受容量限制（仍排队）；原满员拒绝逻辑保留注释备查
  // if (state.volunteers.length >= state.capacity) {
  //   return {
  //     ok: false,
  //     errorKey: 'courseRegistration.student.volunteerCourseFull',
  //     errorParams: { cap: state.capacity },
  //   }
  // }

  const now = new Date()
  const submittedAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  const volunteer = {
    id: `vol-${studentFields.studentId}-${section.id}-${Date.now()}`,
    studentId: studentFields.studentId,
    studentName: studentFields.studentName,
    programme: studentFields.programme,
    intake: studentFields.intake,
    relativeSemester: Number(studentFields.relativeSemester) || 3,
    submittedAt,
    sectionCode: section.code,
  }

  volunteerCourseStates.value[index] = {
    ...state,
    volunteers: sortVolunteers([...state.volunteers, volunteer]),
  }
  studentVolunteerCourseIds.value = [...new Set([...studentVolunteerCourseIds.value, course.id])]
  return { ok: true, volunteered: true }
}

/** 学生撤销某课志愿（任意分组） */
export function removeStudentPreselectVolunteer(courseId, studentId) {
  if (!courseId || !studentId) return { ok: false }
  let changed = false
  volunteerCourseStates.value = volunteerCourseStates.value.map((state) => {
    if (state.courseId !== courseId) return state
    const next = state.volunteers.filter((v) => v.studentId !== studentId)
    if (next.length === state.volunteers.length) return state
    changed = true
    return { ...state, volunteers: next, dirty: false }
  })
  if (changed) {
    studentVolunteerCourseIds.value = studentVolunteerCourseIds.value.filter((id) => id !== courseId)
  }
  return { ok: changed }
}

export function computeDraftDirty(courseId, sectionId, draftVolunteers) {
  const state = getVolunteerSectionState(courseId, sectionId)
  if (!state) return false
  return volunteerOrderKey(state.volunteers) !== volunteerOrderKey(draftVolunteers)
}
