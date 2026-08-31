import { ref, computed } from 'vue'
import { selectableCourses } from './selectableCourses.js'
import { registrationBatches } from './registrationBatches.js'
import { getCurrentStudent } from '../mockCurrentStudent.js'
import { isGraduateStudent } from './studentAudience.js'
import {
  applyWeightedDrawToSectionState,
  layoutGeRound1Roster,
  layoutMeRound1Roster,
  getSectionSeniorCapacity,
  getBatchRound1Window,
  parseCourseRegTime,
  seededRandomFromKey,
} from './preselectWeightedLottery.js'
import { getBatchRound1Quota, openDaysFromRange, DEFAULT_DECAY_R } from './batchRound1Quota.js'
import { listBatchRosterStudents } from './batchStudentRoster.js'
import { countRelativeSemesters } from '../intakeSets.js'
import { resolveEffectiveAudienceRounds } from './sessionRegistrationSchedules.js'
import { studentPendingAssignCourses } from './studentPendingAssignState.js'

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

function isGeBatch(batch) {
  return String(batch?.type || '').toUpperCase() === 'GE'
}

function isMeBatch(batch) {
  return String(batch?.type || '').toUpperCase() === 'ME'
}

export function usesSelectedRoster(state) {
  return Boolean(state?.isGeRound1 || state?.isMeRound1)
}

function formatAtRoundDay(roundStart, dayIndex, salt) {
  let startMs = parseCourseRegTime(roundStart)
  if (!Number.isFinite(startMs)) startMs = Date.parse('01 Sep 2025')
  const d = new Date(startMs)
  d.setDate(d.getDate() + Math.max(0, Number(dayIndex) - 1))
  d.setHours(9, (salt * 7) % 60, (salt * 13) % 60, 0)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function spreadGeSubmitDays(list, roundStart, nDays) {
  const n = list.length
  const days = Math.max(1, nDays)
  return list.map((v, i) => {
    let day = 1
    if (days === 1) day = 1
    else if (i < n * 0.5) day = 1
    else if (i < n * 0.8) day = Math.min(2, days)
    else {
      const restDays = Math.max(1, days - 2)
      day = Math.min(days, 3 + (i % restDays))
    }
    return { ...v, submittedAt: formatAtRoundDay(roundStart, day, i) }
  })
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

function volunteerRelativeSemester(intake, academicSession) {
  const session = academicSession || '2026/04'
  return countRelativeSemesters(intake, session) || countRelativeSemesters(intake, '2026/04') || 1
}

const DEMO_NAMES = [
  'Wei Ming',
  'Li Hua',
  'Tan Mei Ling',
  'Ahmad Faiz',
  'Park Ji-ho',
  'Chen Yu',
  'Nur Aisyah',
  'Siti Nurhaliza',
  'Chong Kai Xin',
  'Raj Kumar',
  'Nurul Aina',
  'Wong Jia Wei',
  'Wong Mei Ling',
  'Ahmad bin Ali',
  'Lee Wei Ming',
  'Emily Tan',
  'Koh Wei Jie',
  'Amira Hassan',
  'Daniel Lim',
  'Priya Sharma',
  'Jason Ong',
  'Grace Yap',
  'Farid Ismail',
  'Nicole Chua',
  'Hafiz Rahman',
  'Sophie Ng',
  'Marcus Teo',
]

/**
 * ME demo：按批次专业生成覆盖 2024/2025/2026 入学年的志愿池
 * @param {string} programme
 */
function buildProgrammeVolunteerPool(programme) {
  const p = String(programme || 'SWE')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 3) || 'SWE'
  const bands = [
    { intake: '2409', count: 16, graduates: 2 },
    { intake: '2504', count: 14, graduates: 0 },
    { intake: '2604', count: 12, graduates: 0 },
  ]
  const out = []
  let seq = 1
  for (const band of bands) {
    for (let i = 0; i < band.count; i += 1) {
      out.push({
        studentId: `${p}${band.intake}${String(seq).padStart(3, '0')}`,
        studentName: DEMO_NAMES[(seq - 1) % DEMO_NAMES.length],
        programme: p,
        intake: band.intake,
        isGraduate: i < band.graduates,
      })
      seq += 1
    }
  }
  return out
}

const DEMO_POOL = [
  { studentId: 'SWE2409001', studentName: 'Wei Ming', programme: 'SWE', intake: '2409' },
  { studentId: 'SWE2409002', studentName: 'Li Hua', programme: 'SWE', intake: '2409' },
  { studentId: 'AIT2409005', studentName: 'Tan Mei Ling', programme: 'AIT', intake: '2409' },
  { studentId: 'ACC2409003', studentName: 'Ahmad Faiz', programme: 'ACC', intake: '2409' },
  { studentId: 'FIN2409007', studentName: 'Park Ji-ho', programme: 'FIN', intake: '2409' },
  { studentId: 'MAT2504001', studentName: 'Chen Yu', programme: 'MAT', intake: '2504' },
  { studentId: 'SWE2504002', studentName: 'Nur Aisyah', programme: 'SWE', intake: '2504' },
  { studentId: 'AIT2409010', studentName: 'Siti Nurhaliza', programme: 'AIT', intake: '2409' },
  { studentId: 'ACC2409008', studentName: 'Chong Kai Xin', programme: 'ACC', intake: '2409' },
  { studentId: 'MAT2504003', studentName: 'Raj Kumar', programme: 'MAT', intake: '2504' },
  { studentId: 'FIN2409011', studentName: 'Nurul Aina', programme: 'FIN', intake: '2409' },
  { studentId: 'SWE2409012', studentName: 'Wong Jia Wei', programme: 'SWE', intake: '2409' },
  { studentId: 'BUS2409020', studentName: 'Wong Mei Ling', programme: 'BUS', intake: '2409' },
  { studentId: 'COS2409001', studentName: 'Ahmad bin Ali', programme: 'COS', intake: '2409' },
  { studentId: 'COS2504015', studentName: 'Tan Mei Ling', programme: 'COS', intake: '2504' },
  { studentId: 'DSA2504002', studentName: 'Lee Wei Ming', programme: 'DSA', intake: '2504' },
  { studentId: 'ENG2409018', studentName: 'Emily Tan', programme: 'ENG', intake: '2409' },
  { studentId: 'CHE2409006', studentName: 'Koh Wei Jie', programme: 'CHE', intake: '2409' },
  { studentId: 'PHY2504004', studentName: 'Amira Hassan', programme: 'PHY', intake: '2504' },
  { studentId: 'BIO2409014', studentName: 'Daniel Lim', programme: 'BIO', intake: '2409' },
  { studentId: 'ACC2504009', studentName: 'Priya Sharma', programme: 'ACC', intake: '2504' },
  { studentId: 'FIN2504010', studentName: 'Jason Ong', programme: 'FIN', intake: '2504' },
  { studentId: 'SWE2409025', studentName: 'Grace Yap', programme: 'SWE', intake: '2409' },
  { studentId: 'AIT2504011', studentName: 'Farid Ismail', programme: 'AIT', intake: '2504' },
  { studentId: 'BUS2409030', studentName: 'Nicole Chua', programme: 'BUS', intake: '2409' },
  { studentId: 'MAT2409016', studentName: 'Hafiz Rahman', programme: 'MAT', intake: '2409' },
  { studentId: 'COS2409022', studentName: 'Sophie Ng', programme: 'COS', intake: '2409' },
  { studentId: 'DSA2409008', studentName: 'Marcus Teo', programme: 'DSA', intake: '2409' },
]

function pickVolunteers(seed, count, academicSession, opts = {}) {
  const programme = String(opts.programme || '').trim()
  const pool = programme ? buildProgrammeVolunteerPool(programme) : DEMO_POOL
  const out = []
  for (let i = 0; i < count; i += 1) {
    const idx = programme ? i % pool.length : (seed + i * 3) % pool.length
    const profile = pool[idx]
    const overflow = i >= pool.length
    out.push({
      id: `vol-${profile.studentId}-${seed}-${i}`,
      studentId: overflow ? `${profile.studentId}-x${seed}-${i}` : profile.studentId,
      studentName: profile.studentName,
      programme: profile.programme,
      intake: profile.intake,
      relativeSemester: volunteerRelativeSemester(profile.intake, academicSession),
      submittedAt: formatSubmittedAt(seed * 11 + i * 5),
      isGraduate: Boolean(profile.isGraduate),
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

/** 每批取 13 门（两分组约 26 行），保证第一轮志愿结果可翻页 */
const VOLUNTEER_SEED_COURSE_LIMIT = 13

/**
 * 为全部批次生成第一轮志愿分组状态（每批至少覆盖若干门课）
 * @returns {object[]}
 */
function seedSectionStates() {
  const rows = []
  let seed = 0
  for (const batch of registrationBatches.value) {
    const courses = selectableCourses.value
      .filter((c) => c.batchId === batch.id)
      .slice(0, VOLUNTEER_SEED_COURSE_LIMIT)
    const batchName = batch.name || ''
    for (const course of courses) {
      const sections = course.sections?.length ? course.sections : []
      for (const section of sections) {
        const capacity = Math.max(1, Number(section.capacity) || 20)
        const isGe = isGeBatch(batch)
        const isMe = isMeBatch(batch)
        const seniorCapacity = getSectionSeniorCapacity(course, section.id, capacity)
        let seedCount
        if (isGe || isMe) {
          const cap = seniorCapacity || capacity
          seedCount = Math.max(cap + 10, Math.floor(cap * 1.7) + (seed % 6))
        } else {
          seedCount = Math.max(2, Math.min(8, Math.floor(capacity * 0.25) + (seed % 3)))
        }
        let volunteers = pickVolunteers(seed, seedCount, batch.academicSession, {
          programme: isMe ? batch.programme || '' : '',
        })
        const quota = getBatchRound1Quota(batch)
        const listCap = Math.min(capacity, seniorCapacity)
        const rand = seededRandomFromKey(sectionStateKey(course.id, section.id))
        if (isGe) {
          const { start, end } = getBatchRound1Window(batch)
          const nDays = openDaysFromRange(start, end)
          volunteers = layoutGeRound1Roster(spreadGeSubmitDays(volunteers, start, nDays), {
            capacity: listCap,
            nDays,
            roundStart: start,
            decayR: quota.decayR ?? DEFAULT_DECAY_R,
            rand,
          })
        } else if (isMe) {
          let specialIds = []
          try {
            specialIds = listBatchRosterStudents(batch.id, 'special').map((r) =>
              String(r.studentId),
            )
          } catch {
            specialIds = []
          }
          volunteers = layoutMeRound1Roster(volunteers, {
            capacity: listCap,
            meQuotaRows: quota.meQuotaRows || [],
            specialStudentIds: specialIds,
            rand,
          })
        } else {
          volunteers = sortVolunteers(volunteers)
        }
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
          seniorCapacity,
          isGeRound1: isGe,
          isMeRound1: isMe,
          batchType: batch.type || '',
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

export const volunteerCourseStates = ref([])
export const volunteerFinalConfirmedAt = ref(null)
export const volunteerSecondRoundStarted = ref(false)
export const studentVolunteerCourseIds = ref([])

/** 延迟播种，避开与 batchStudentRoster 的循环初始化 TDZ */
function bootVolunteerCourseStates() {
  volunteerCourseStates.value = seedSectionStates()
}
if (typeof queueMicrotask === 'function') {
  queueMicrotask(bootVolunteerCourseStates)
} else {
  Promise.resolve().then(bootVolunteerCourseStates)
}

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

function volunteerSelectedPercent(count, seniorCap) {
  const cap = Number(seniorCap) || 0
  if (cap <= 0) return null
  return Math.round((Number(count) / cap) * 100)
}

function volunteerCapacityTone(count, seniorCap) {
  const cap = Number(seniorCap) || 0
  const n = Number(count) || 0
  if (cap <= 0) return 'capacity-open'
  if (n < cap) return 'capacity-open'
  if (n <= cap * 2) return 'capacity-warn'
  return 'capacity-full'
}

export function listVolunteerCourseSummaries(filters = {}) {
  let list = volunteerCourseStates.value.map((row) => {
    const count = row.volunteers.length
    const seniorCapacity = row.seniorCapacity ?? row.capacity
    const selectedPercent = volunteerSelectedPercent(count, seniorCapacity)
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
      seniorCapacity,
      isGeRound1: Boolean(row.isGeRound1),
      isMeRound1: Boolean(row.isMeRound1),
      dirty: Boolean(row.dirty),
      capacityLabel: `${count}/${seniorCapacity}`,
      selectedPercent,
      selectedPercentLabel: selectedPercent != null ? `${selectedPercent}%` : '—',
      capacityTone: volunteerCapacityTone(count, seniorCapacity),
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
  if (usesSelectedRoster(state)) {
    const cap = Number(state.seniorCapacity) || Number(state.capacity) || 0
    return list.filter((v) => v.selected).length >= cap
  }
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
  return { ok: true, selectedCount: usesSelectedRoster(state)
    ? list.filter((v) => v.selected).length
    : Math.min(list.length, state.capacity) }
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

/**
 * 第一轮自动发布主路径：加权抽签裁剪名单后写入最终确认（等同开 R2 闸门）
 * @param {string} batchId
 * @param {{ force?: boolean }} [opts] force=true 时忽略发布时间，一键演示
 */
export function autoPublishPreselectResults(batchId, opts = {}) {
  if (!batchId) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerBatchRequired' }
  }
  const batch = registrationBatches.value.find((b) => b.id === batchId)
  if (!batch) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerBatchRequired' }
  }
  if (batch.volunteerFinalConfirmedAt) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerAlreadyFinalized' }
  }
  if (volunteerSecondRoundStarted.value) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerReadonly' }
  }

  const releaseAt =
    resolveEffectiveAudienceRounds(batch)?.senior?.resultReleaseAt ||
    batch.roundsByAudience?.senior?.resultReleaseAt ||
    ''

  if (!opts.force && releaseAt) {
    // 原型：有发布时间但未 force 时仍允许（演示到点）；正式环境再比时钟
  }

  volunteerCourseStates.value = volunteerCourseStates.value.map((state) => {
    if (state.batchId !== batchId) return state
    const course = selectableCourses.value.find((c) => c.id === state.courseId)
    if (!course) return state
    return applyWeightedDrawToSectionState(state, course, batch)
  })

  return finalizeVolunteerConfirm(batchId)
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

/** R1：是否已在指定分组提交志愿/待分配（同课不同组允许重复） */
export function hasStudentVolunteeredSection(courseId, sectionId, studentId) {
  if (!courseId || !sectionId) return false
  const sid = studentId || getCurrentStudent()?.basicInfo?.studentId || ''
  if (
    studentPendingAssignCourses.value.some(
      (item) => item.courseId === courseId && item.sectionId === sectionId,
    )
  ) {
    return true
  }
  if (!sid) return false
  const state = getVolunteerSectionState(courseId, sectionId)
  return Boolean(state?.volunteers?.some((v) => v.studentId === sid))
}

export function buildVolunteerDraftAfterAdd(courseId, sectionId, draftVolunteers, profiles) {
  const state = getVolunteerSectionState(courseId, sectionId)
  if (!state) {
    return { ok: false, errorKey: 'courseRegistration.result.volunteerCourseMissing' }
  }
  const draft = cloneVolunteers(draftVolunteers)
  const existing = new Set(draft.map((v) => v.studentId))
  const onCourse = new Set(listStudentIdsOnCourse(courseId, { includeDraft: true }))
  const lottery = usesSelectedRoster(state)
  const cap = lottery ? Number(state.seniorCapacity) || Number(state.capacity) || 0 : state.capacity
  const used = lottery ? draft.filter((v) => v.selected).length : draft.length
  const remaining = cap - used
  if (remaining <= 0) {
    return {
      ok: false,
      errorKey: 'courseRegistration.result.volunteerFullHint',
      errorParams: { count: cap, cap },
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
      errorParams: { remaining, cap },
    }
  }

  const now = new Date()
  const submittedAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  let selectedEnd = draft.length
  if (lottery) {
    selectedEnd = 0
    while (selectedEnd < draft.length && draft[selectedEnd].selected) selectedEnd += 1
  }
  const batch = registrationBatches.value.find((b) => b.id === state.batchId)
  const academicSession = batch?.academicSession || ''
  incoming.forEach((profile, i) => {
    const intake = profile.intake || (profile.grade === '2025' ? '2504' : '2409')
    const row = {
      id: `vol-${profile.studentId}-${sectionId}-${Date.now()}-${i}`,
      studentId: profile.studentId,
      studentName: profile.studentName || profile.studentId,
      programme: profile.programme || '—',
      intake,
      relativeSemester: volunteerRelativeSemester(intake, academicSession),
      submittedAt,
      sectionCode: state.sectionCode,
      isGraduate: isGraduateStudent(profile.studentId) || Boolean(profile.isGraduate),
      ...(lottery ? { selected: true } : {}),
    }
    if (lottery) draft.splice(selectedEnd + i, 0, row)
    else draft.push(row)
  })
  return { ok: true, draft }
}

export function submitStudentPreselectVolunteer({ course, section, studentFields }) {
  if (!course || !section || !studentFields?.studentId) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSubmitFailed' }
  }
  if (hasStudentVolunteeredSection(course.id, section.id, studentFields.studentId)) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerDuplicate' }
  }

  let index = volunteerCourseStates.value.findIndex(
    (c) => c.key === sectionStateKey(course.id, section.id),
  )
  if (index === -1) {
    const batch = registrationBatches.value.find((b) => b.id === course.batchId)
    const batchName = batch?.name || ''
    const capacity = Math.max(1, Number(section.capacity) || 20)
    const isGe = isGeBatch(batch)
    const isMe = isMeBatch(batch)
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
        seniorCapacity: getSectionSeniorCapacity(course, section.id, capacity),
        isGeRound1: isGe,
        isMeRound1: isMe,
        batchType: batch?.type || '',
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
  const batchForVolunteer = registrationBatches.value.find((b) => b.id === course.batchId)
  const volunteer = {
    id: `vol-${studentFields.studentId}-${section.id}-${Date.now()}`,
    studentId: studentFields.studentId,
    studentName: studentFields.studentName,
    programme: studentFields.programme,
    intake: studentFields.intake,
    relativeSemester: volunteerRelativeSemester(studentFields.intake, batchForVolunteer?.academicSession),
    submittedAt,
    sectionCode: section.code,
    isGraduate: isGraduateStudent(studentFields.studentId),
    ...(usesSelectedRoster(state) ? { selected: false } : {}),
  }

  volunteerCourseStates.value[index] = {
    ...state,
    volunteers: usesSelectedRoster(state)
      ? [...state.volunteers, volunteer]
      : sortVolunteers([...state.volunteers, volunteer]),
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
