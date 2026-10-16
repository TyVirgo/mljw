import { ref, computed } from 'vue'
import { getCurrentStudent } from '../mockCurrentStudent.js'
import { getActiveBatch, getBatchById } from './registrationBatches.js'
import { isCrossAudienceReleaseActive } from './registrationRuleSettings.js'
import {
  getCoursesByBatch,
  getCourseById,
  selectableCourses,
  sortCoursesForStudentDemo,
  getRound3EffectiveRemaining,
  isSectionFullForAudience,
  getDefaultStudentSchoolElectiveCategory,
  resolveSchoolElectiveCategory,
} from './selectableCourses.js'
import {
  runRegistrationQueue,
  revealQueueOverlay,
  hideQueueOverlay,
  isRegistrationQueueWaiting,
  cancelRegistrationQueue,
} from '../../composables/useRegistrationQueue.js'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import { resolveTermCreditMax, resolveTermCreditMin } from './registrationRules.js'
import {
  buildEligibilityContext,
  attachEligibilityToCourses,
  evaluateCourseEligibility,
  courseMatchesStudentProgramme,
} from './studentEligibility.js'
import {
  findWaitlistCourseByCode,
  getEstimatedWaitlistPosition,
  joinStudentWaitlist,
} from './waitlistQueue.js'
import {
  hasStudentVolunteeredCourse,
  hasStudentVolunteeredSection,
  submitStudentPreselectVolunteer,
  removeStudentPreselectVolunteer,
} from './preselectVolunteerConfirm.js'
import {
  buildHardConflictBaseline,
  checkHardScheduleConflict,
} from './studentRegistrationScheduleConflict.js'
import {
  getRegistrationSemesterIndex,
  getStudentAudience,
  getTermCreditCaps,
  creditCapForCourseType,
  isGraduateStudent,
} from './studentAudience.js'
import {
  checkTermCategoryCreditCapForCourse,
  checkGraduationGeCapForCourse,
} from './studentRegistrationContext.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { studentPendingAssignCourses } from './studentPendingAssignState.js'
import {
  assertVolunteerListEditable,
  assignNextPreferenceOrder,
  shouldShowVolunteerSheetPanel,
  syncVolunteerOrderAfterPendingChange,
} from './studentVolunteerSheet.js'

export { studentPendingAssignCourses }

/** 在线选课三轮（预选/正选/补选均为真选课时段，对象与时间窗不同） */
export const CART_ROUND_KEYS = ['preselect', 'main', 'supplement']

function emptyCartsByRound() {
  return {
    preselect: [],
    main: [],
    supplement: [],
  }
}

export const registrationCartsByRound = ref(emptyCartsByRound())

/** 当前操作的轮次；切换 tab 时由在线选课页同步；默认第一轮 */
export const activeCartRoundKey = ref('preselect')

/** 一次性请求打开「本轮选课情况」抽屉（跨 overlay / 页面） */
export const shouldOpenRoundStatusDrawer = ref(false)

export function requestOpenRoundStatusDrawer() {
  shouldOpenRoundStatusDrawer.value = true
}

export function normalizeCartRoundKey(roundKey) {
  return CART_ROUND_KEYS.includes(roundKey) ? roundKey : 'preselect'
}

export function setActiveCartRound(roundKey) {
  activeCartRoundKey.value = normalizeCartRoundKey(roundKey)
}

/**
 * 进入 R2/R3：将同类型 R1 pending 复制写入确认半池「选课成功」
 * 不删 pending，便于回 R1 本轮志愿回显；前轮只同步后轮
 * @param {{ roundKey?: string, batch?: object }} [options]
 * @returns {{ ok: boolean, promoted: number }}
 */
export function promoteR1PendingToConfirmed(options = {}) {
  const roundKey = normalizeCartRoundKey(options.roundKey || activeCartRoundKey.value)
  if (roundKey === 'preselect') return { ok: true, promoted: 0 }

  const batch = options.batch || getActiveBatch()
  const batchType = batch?.type === 'GE' ? 'GE' : batch?.type === 'ME' ? 'ME' : ''

  const toPromote = (studentPendingAssignCourses.value || []).filter((item) => {
    if (!item || item.intent === 'waitlist') return false
    const itemRound = normalizeCartRoundKey(item.roundKey || 'preselect')
    if (itemRound !== 'preselect') return false
    if (batchType && item.type && normalizeRegistrationType(item.type) !== batchType) {
      return false
    }
    return true
  })
  if (!toPromote.length) return { ok: true, promoted: 0 }

  const courses = toPromote.map((item) => ({
    ...item,
    roundKey: 'preselect',
    sourceType: item.sourceType || 'preselect',
  }))
  // applyConfirmedRegistration 按 courseId 去重；pending 原样保留
  applyConfirmedRegistration(courses, { holdSeat: true })
  return { ok: true, promoted: toPromote.length }
}

function getActiveRoundCart() {
  const key = normalizeCartRoundKey(activeCartRoundKey.value)
  return registrationCartsByRound.value[key]
}

function setActiveRoundCart(next) {
  const key = normalizeCartRoundKey(activeCartRoundKey.value)
  registrationCartsByRound.value = {
    ...registrationCartsByRound.value,
    [key]: next,
  }
}

/** 当前轮次选课篮（兼容原单一 cart 用法） */
export const registrationCart = computed({
  get() {
    return getActiveRoundCart()
  },
  set(next) {
    setActiveRoundCart(Array.isArray(next) ? next : [])
  },
})

export const studentConfirmedCourses = ref([])

/** Demo 培养方案必修底图（仅课表图层，不进确认半池） */
export const studentRequiredCourses = ref([])

export const studentSchedule = ref([])

/** 当前正在队列中的单课（确认选课后、出队前） */
export const pendingRegistration = ref(null)

/** 高并发未选上的记录 */
export const studentFailedRegistrations = ref([])

/** 学生主动取消排队的记录 */
export const studentCancelledRegistrations = ref([])

export function isCourseOccupied(courseId, sectionId = null) {
  if (!courseId) return false
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  const volunteerMode = shouldShowVolunteerSheetPanel(roundKey, getStudentAudience())

  const pending = pendingRegistration.value
  if (pending?.courseId === courseId) {
    if (!volunteerMode || !sectionId || pending.sectionId === sectionId) return true
  }

  if (volunteerMode && sectionId) {
    if (
      studentPendingAssignCourses.value.some(
        (item) =>
          item.courseId === courseId &&
          item.sectionId === sectionId &&
          normalizeCartRoundKey(item.roundKey || 'preselect') === roundKey,
      )
    ) {
      return true
    }
    if (hasStudentVolunteeredSection(courseId, sectionId)) return true
    // 历轮已确认同课仍占位，避免重复志愿
    if (studentConfirmedCourses.value.some((item) => item.courseId === courseId)) return true
    return false
  }

  if (hasStudentVolunteeredCourse(courseId)) return true
  if (studentPendingAssignCourses.value.some((item) => item.courseId === courseId)) return true
  return studentConfirmedCourses.value.some((item) => item.courseId === courseId)
}

/** 行级/提交前：与必修、已确认课表硬冲突检测 */
export function getHardScheduleConflictGate(course, section) {
  if (!section) return { ok: true }
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  const baseline = buildHardConflictBaseline(
    roundKey,
    studentRequiredCourses.value,
    studentConfirmedCourses.value,
  )
  return checkHardScheduleConflict(section, baseline)
}

/**
 * 本轮选课表（非志愿）：当前批 + 当前轮确认课（排除 admin）
 * 历轮跨档同步见 includeConfirmedInPriorRounds（按类型+roundKey，不锁 batchId）
 */
function includeConfirmedInRoundTable(item, { batchId, batchType, roundKey }) {
  if (!item || item.intent === 'waitlist') return false
  if (item.sourceType === 'admin') return false
  if (batchId && item.batchId && item.batchId !== batchId) return false
  if (batchType && item.type && normalizeRegistrationType(item.type) !== batchType) return false
  if (normalizeCartRoundKey(item.roundKey) !== normalizeCartRoundKey(roundKey)) return false
  return true
}

/**
 * 学分累计：同类型、非 admin、轮次 ≤ 当前轮（可跨批）
 */
function includeConfirmedInCreditProgress(item, { batchType, roundKey }) {
  if (!item || item.intent === 'waitlist') return false
  if (item.sourceType === 'admin') return false
  if (batchType && item.type && normalizeRegistrationType(item.type) !== batchType) return false
  if (roundOrderIndexOf(item.roundKey) > roundOrderIndexOf(roundKey)) return false
  return true
}

/** 历轮已选：同类型、非 admin、轮次严格早于当前轮（可跨批） */
function includeConfirmedInPriorRounds(item, { batchType, roundKey }) {
  if (!item || item.intent === 'waitlist') return false
  if (item.sourceType === 'admin') return false
  if (batchType && item.type && normalizeRegistrationType(item.type) !== batchType) return false
  return roundOrderIndexOf(item.roundKey) < roundOrderIndexOf(roundKey)
}

/**
 * 历轮已选列表（本轮选课情况第二块；不含当前轮确认/待分配）
 * @param {{ roundKey?: string, batch?: object }} [options]
 */
export function listPriorRoundConfirmedCourses(options = {}) {
  const batch = options.batch || getActiveBatch()
  const batchType = batch?.type === 'GE' ? 'GE' : batch?.type === 'ME' ? 'ME' : ''
  const roundKey = normalizeCartRoundKey(options.roundKey || activeCartRoundKey.value)
  return studentConfirmedCourses.value
    .filter((item) => includeConfirmedInPriorRounds(item, { batchType, roundKey }))
    .map((item) => ({ ...item, status: 'success' }))
}

export const myRegistrationList = computed(() => {
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  const batch = getActiveBatch()
  const batchId = batch?.id
  const batchType = batch?.type === 'GE' ? 'GE' : batch?.type === 'ME' ? 'ME' : ''
  const list = []
  if (pendingRegistration.value) {
    list.push({ ...pendingRegistration.value, status: 'queued' })
  }
  // 老生 R1 志愿：本轮表 = 当前批待分配
  if (shouldShowVolunteerSheetPanel(roundKey, getStudentAudience())) {
    for (const item of studentPendingAssignCourses.value) {
      if (batchId && item.batchId && item.batchId !== batchId) continue
      const itemRound = normalizeCartRoundKey(item.roundKey || 'preselect')
      if (itemRound !== roundKey) continue
      list.push({ ...item, status: 'pendingAssign' })
    }
    return list
  }
  // R2/R3（及新生）：本轮表 = 当前批当前轮确认（排队默认成功，失败半池仅兼容历史）
  for (const item of studentConfirmedCourses.value) {
    if (!includeConfirmedInRoundTable(item, { batchId, batchType, roundKey })) continue
    list.push({ ...item, status: 'success' })
  }
  for (const item of studentFailedRegistrations.value) {
    if (batchId && item.batchId && item.batchId !== batchId) continue
    if (!item.batchId && batchType && item.type && item.type !== batchType) continue
    if (item.roundKey && normalizeCartRoundKey(item.roundKey) !== roundKey) continue
    list.push({ ...item, status: 'failed' })
  }
  return list
})

export const myRegistrationCredits = computed(() =>
  studentConfirmedCourses.value.reduce((sum, item) => sum + (item.credits || 0), 0),
)

/** 写入存储用：YYYY-MM-DD HH:mm:ss（便于解析与 R1 按日统计） */
function formatSelectedAtStorage(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * 提交时间展示：DD/MM/YYYY HH:mm:ss
 * @param {string|Date|null|undefined} value
 */
export function formatSelectedAt(value) {
  if (value == null || value === '') return '—'
  const pad = (n) => String(n).padStart(2, '0')
  const formatDate = (date) =>
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '—' : formatDate(value)
  }
  const raw = String(value).trim()
  if (!raw || raw === '—') return '—'
  if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (ymd) {
    const [, y, m, d, hh, mm, ss] = ymd
    return formatDate(new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)))
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return formatDate(parsed)
}

function nowSelectedAt() {
  return formatSelectedAtStorage(new Date())
}

function normalizeIntake(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(-4)
  return digits || '2409'
}

export function getStudentProfileFields(student = getCurrentStudent()) {
  const basic = student?.basicInfo || {}
  const enrollment = student?.enrollment || {}
  const studentId = basic.studentId || ''
  const caps = getTermCreditCaps(studentId)
  return {
    studentId,
    studentName: basic.fullName || basic.chineseName || '',
    programme: enrollment.programmeCode || 'SWE',
    programmeName: enrollment.programme || enrollment.programmeCode || 'SWE',
    intake: normalizeIntake(enrollment.intake || enrollment.academicSession),
    registrationSemesterIndex: getRegistrationSemesterIndex(studentId),
    audience: getStudentAudience(studentId),
    isGraduate: isGraduateStudent(studentId),
    studentCategory: student?.studentCategory || 'Local',
    termCreditCaps: caps,
    schoolElectiveCategory:
      enrollment.schoolElectiveCategory || getDefaultStudentSchoolElectiveCategory(),
  }
}

/** 本学期计入进度的课：已确认 + 选课篮 + 待分配（排除 waitlist，去重） */
export function listLiveTermCreditCourses(extraCourse) {
  const items = [
    ...studentConfirmedCourses.value.filter((c) => c.intent !== 'waitlist'),
    ...registrationCart.value.filter((c) => c.intent !== 'waitlist'),
    ...studentPendingAssignCourses.value.filter((c) => c.intent !== 'waitlist'),
  ]
  if (extraCourse) items.push(extraCourse)
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = `${item.courseId || ''}|${item.sectionId || item.sectionCode || ''}`
    if (item.courseId && seen.has(key)) continue
    if (item.courseId) seen.add(key)
    out.push(item)
  }
  return out
}

/** 轮次序：preselect(R1) → main(R2) → supplement(R3)；未知轮次视为当前轮之后（不进累计） */
const ROUND_ORDER_INDEX = { preselect: 0, main: 1, supplement: 2 }

function roundOrderIndexOf(roundKey) {
  return ROUND_ORDER_INDEX[normalizeCartRoundKey(roundKey)] ?? Number.POSITIVE_INFINITY
}

/**
 * 本轮学分统计用课（可与本轮表门数分离）
 * R1 志愿=该批待分配；R2/R3=≤当前轮已确认（同类型、非 admin，含历轮）
 * @param {object} [batch]
 */
export function listRoundStatusCreditCourses(batch = getActiveBatch(), options = {}) {
  const batchId = batch?.id
  const batchType = batch?.type === 'GE' ? 'GE' : batch?.type === 'ME' ? 'ME' : ''
  const roundKey = normalizeCartRoundKey(options.roundKey || activeCartRoundKey.value)
  if (roundKey === 'preselect') {
    return studentPendingAssignCourses.value.filter((item) => {
      if (item.intent === 'waitlist') return false
      if (batchId && item.batchId && item.batchId !== batchId) return false
      return normalizeCartRoundKey(item.roundKey || 'preselect') === 'preselect'
    })
  }
  // R2/R3：≤当前轮已确认（同类型、非 admin）
  return studentConfirmedCourses.value.filter((item) =>
    includeConfirmedInCreditProgress(item, { batchType, roundKey }),
  )
}

function sumCreditsByTypeFromList(items) {
  const seen = new Set()
  return (items || []).reduce(
    (acc, item) => {
      const key = `${item.courseId || ''}|${item.sectionId || item.sectionCode || ''}`
      if (item.courseId && seen.has(key)) return acc
      if (item.courseId) seen.add(key)
      const kind = normalizeRegistrationType(item.type)
      const cr = Number(item.credits) || 0
      if (kind === 'GE') acc.ge += cr
      else if (kind === 'ME' || kind === 'Mandatory') acc.me += cr
      else acc.me += cr
      return acc
    },
    { ge: 0, me: 0 },
  )
}

function sumTermCreditsByType(extraCourse) {
  return sumCreditsByTypeFromList(listLiveTermCreditCourses(extraCourse))
}

/** 本学期 GE/ME 已选与上限；options.scope=round 时与本轮选课情况同源 */
export function getTermElectiveCreditProgress(studentId, options = {}) {
  const caps = getTermCreditCaps(studentId)
  const used =
    options.scope === 'round'
      ? sumCreditsByTypeFromList(listRoundStatusCreditCourses(options.batch, options))
      : sumTermCreditsByType()
  return {
    ge: used.ge,
    me: used.me,
    geMax: caps.geMax,
    meMax: caps.meMax,
  }
}

/** R1 允许提交倍数（相对学期 geMax/meMax）；R2/R3 无此概念 */
export const ME_R1_SUBMIT_CREDIT_MULTIPLIER = 2
export const R1_SUBMIT_CREDIT_MULTIPLIER = ME_R1_SUBMIT_CREDIT_MULTIPLIER

/**
 * 第一轮提交学分三卡：学期要求 / 允许最大(2×) / 本轮已选（按批次 GE|ME）
 * @param {object} [batch]
 */
export function getR1CreditSubmitStats(batch = getActiveBatch()) {
  const caps = getTermCreditCaps()
  const kind = batch?.type === 'GE' ? 'GE' : 'ME'
  const termRequired =
    kind === 'GE' ? Number(caps.geMax) || 0 : Number(caps.meMax) || 0
  const submitMax = termRequired * R1_SUBMIT_CREDIT_MULTIPLIER
  const sums = sumCreditsByTypeFromList(
    listRoundStatusCreditCourses(batch, { roundKey: 'preselect' }),
  )
  const selected = kind === 'GE' ? sums.ge : sums.me
  return { kind, termRequired, submitMax, selected }
}

/** @deprecated 使用 getR1CreditSubmitStats */
export function getMeR1CreditSubmitStats(batch = getActiveBatch()) {
  return getR1CreditSubmitStats(batch)
}

function resolveTermCreditCapForKind(kind, caps, roundKey) {
  let cap = creditCapForCourseType(kind, caps)
  // R1：允许提交最大学分 = 2×学期要求（GE/ME）；R2/R3 仍用原帽
  if (
    (kind === 'ME' || kind === 'GE') &&
    normalizeCartRoundKey(roundKey) === 'preselect'
  ) {
    cap = cap * R1_SUBMIT_CREDIT_MULTIPLIER
  }
  return cap
}

function assertTermCreditCap(course) {
  if (!course) return { ok: true }
  const caps = getTermCreditCaps()
  // 与列表顶栏 / 本轮选课情况同源，避免跨批已确认把「将达」抬高误拦
  const next = sumCreditsByTypeFromList([
    ...listRoundStatusCreditCourses(getActiveBatch()),
    course,
  ])
  const kind = normalizeRegistrationType(course.type)
  const cap = resolveTermCreditCapForKind(kind, caps, activeCartRoundKey.value)
  const used = kind === 'GE' ? next.ge : next.me
  if (used > cap) {
    return {
      ok: false,
      errorKey: 'courseRegistration.student.termCreditCapExceeded',
      errorParams: {
        type: kind,
        used,
        max: cap,
      },
    }
  }
  return { ok: true }
}

/** 行级选课前校验是否会超类型学期学分帽 */
export function checkTermCreditCapForCourse(course) {
  return assertTermCreditCap(course)
}

export { checkTermCategoryCreditCapForCourse, checkGraduationGeCapForCourse }

function assertSectionHasSeat(section) {
  if (!section) return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  if (roundKey === 'preselect') return { ok: true }
  const audience = getStudentAudience()
  const releaseCross = isCrossAudienceReleaseActive(getActiveBatch())
  if (isSectionFullForAudience(section, audience, { roundKey, releaseCross })) {
    return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
  }
  return { ok: true }
}

function assertRound3AudienceCapacity(course) {
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  if (roundKey !== 'supplement' || !course) return { ok: true }
  const audience = getStudentAudience()
  const release = isCrossAudienceReleaseActive(getActiveBatch())
  const { effective } = getRound3EffectiveRemaining(course, audience, release)
  if (effective <= 0) {
    return { ok: false, errorKey: 'courseRegistration.student.round3PoolExhausted' }
  }
  return { ok: true }
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

function assertEligibleAndNotInCart(course, section) {
  if (!course) return { ok: false }
  if (isCourseOccupied(course.id, section?.id)) {
    return { ok: false, errorKey: 'courseRegistration.student.cartDuplicate' }
  }
  const scheduleGate = getHardScheduleConflictGate(course, section)
  if (!scheduleGate.ok) return scheduleGate
  const batch = getActiveBatch()
  const context = buildEligibilityContext(getCurrentStudent(), batch, {
    roundKey: normalizeCartRoundKey(activeCartRoundKey.value),
  })
  const eligibility = course.eligibility || evaluateCourseEligibility(course, context)
  if (!eligibility.eligible) {
    return {
      ok: false,
      errorKey: eligibility.primaryReasonKey || 'courseRegistration.eligibility.notEligible',
      errorParams: eligibility.primaryReasonParams,
    }
  }
  const creditGate = assertTermCreditCap(course)
  if (!creditGate.ok) return creditGate
  // 在线选课：毕业 GE ≤18 硬拦（加退课不走此闸，超 18 仅缴费提醒）
  const gradGeGate = checkGraduationGeCapForCourse(course)
  if (!gradGeGate.ok) return gradGeGate
  const categoryGate = checkTermCategoryCreditCapForCourse(course)
  if (!categoryGate.ok) return categoryGate
  const r3Gate = assertRound3AudienceCapacity(course)
  if (!r3Gate.ok) return r3Gate
  // 第一轮谁可进：由 roundsByAudience 时间窗 + 学生受众决定，不再用 preferSenior 硬挡新生
  return { ok: true }
}

function buildCartCourseItem(course, section) {
  return {
    intent: 'register',
    courseId: course.id,
    sectionId: section.id,
    courseCode: course.code,
    courseName: course.name,
    sectionCode: section.code,
    time: section.time,
    classTime: section.classTime || section.time,
    weekRange: section.weekRange,
    room: section.room,
    lecturer: section.lecturer,
    meetings: section.meetings,
    credits: course.credits,
    batchId: course.batchId,
    type: course.type,
    isHot: course.isHot,
  }
}

/** 单课确认选课：志愿模式（老生 R1–R3）进待分配；否则先到先得确认 */
export function submitSingleCourseRegistration(course, section) {
  if (!course || !section) return { ok: false }
  const gate = assertEligibleAndNotInCart(course, section)
  if (!gate.ok) return gate

  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  const studentFields = getStudentProfileFields()

  if (shouldShowVolunteerSheetPanel(roundKey, getStudentAudience())) {
    const lockGate = assertVolunteerListEditable()
    if (!lockGate.ok) return lockGate

    const volunteerResult = submitStudentPreselectVolunteer({
      course,
      section,
      studentFields: {
        ...studentFields,
        relativeSemester: 3,
      },
    })
    if (!volunteerResult.ok) return volunteerResult

    const batch = getActiveBatch()
    const item = buildCartCourseItem(course, section)
    pendingRegistration.value = item

    const queueContext = {
      ...studentFields,
      batchName: batch?.name,
      academicSession: batch?.academicSession,
      courses: [item],
      courseCode: item.courseCode,
      courseName: item.courseName,
      credits: item.credits,
      section: item.sectionCode,
      time: item.time,
      room: item.room,
      lecturer: item.lecturer,
      resultKind: 'pendingAssign',
    }

    void runRegistrationQueue(queueContext, {
      silent: true,
      showSuccess: true,
      resultKind: 'pendingAssign',
      onComplete: () => {
        pendingRegistration.value = null
        applyPendingAssignRegistration([item])
        return { ok: true }
      },
    }).catch((err) => {
      const reason = err?.message || ''
      if (reason === 'cancelled' || reason === 'superseded') return
      pendingRegistration.value = null
    })

    return { ok: true, queued: true, volunteered: true }
  }

  const seatGate = assertSectionHasSeat(section)
  if (!seatGate.ok) return seatGate

  const batch = getActiveBatch()
  const item = buildCartCourseItem(course, section)
  pendingRegistration.value = item

  const queueContext = {
    ...studentFields,
    batchName: batch?.name,
    academicSession: batch?.academicSession,
    courses: [item],
    courseCode: item.courseCode,
    courseName: item.courseName,
    credits: item.credits,
    section: item.sectionCode,
    time: item.time,
    room: item.room,
    lecturer: item.lecturer,
  }

  void runRegistrationQueue(queueContext, {
    silent: true,
    showSuccess: true,
    onComplete: () => {
      // Demo：排队完成一律选课成功，不再随机写入失败
      pendingRegistration.value = null
      applyConfirmedRegistration([item])
      upsertMonitorRow(
        studentFields,
        batch,
        `Registered ${item.courseCode} via online queue`,
      )
      return { ok: true }
    },
  }).catch((err) => {
    const reason = err?.message || ''
    if (reason === 'cancelled' || reason === 'superseded') return
    pendingRegistration.value = null
  })

  return { ok: true, queued: true }
}

function pushCancelledRegistration(item) {
  if (!item) return
  studentCancelledRegistrations.value = [
    {
      ...item,
      id: item.id || `cancel-${item.courseId}-${Date.now()}`,
      cancelledAt: nowSelectedAt(),
    },
    ...studentCancelledRegistrations.value,
  ]
}

/** 中止排队并记入取消选课（调用方负责确认弹框） */
export function cancelMyCourseQueue(item) {
  const pending = pendingRegistration.value
  const targetId = item?.courseId
  if (pending && (!targetId || pending.courseId === targetId)) {
    pendingRegistration.value = null
    pushCancelledRegistration(pending)
    if (normalizeCartRoundKey(activeCartRoundKey.value) === 'preselect') {
      const studentId = getStudentProfileFields().studentId
      removeStudentPreselectVolunteer(pending.courseId, studentId, pending.sectionId || null)
    }
    if (isRegistrationQueueWaiting()) {
      cancelRegistrationQueue()
    }
    return { ok: true }
  }
  return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
}

export function hideMyCourseQueueProgress() {
  hideQueueOverlay()
}

/** 查看排队进度：静默入队后由用户主动打开全屏进度 */
export function openMyCourseQueueProgress(item) {
  if (!item) return
  if (isRegistrationQueueWaiting()) {
    revealQueueOverlay()
  }
}

export function dismissFailedRegistration(id) {
  studentFailedRegistrations.value = studentFailedRegistrations.value.filter((item) => item.id !== id)
}

export function dismissCancelledRegistration(id) {
  studentCancelledRegistrations.value = studentCancelledRegistrations.value.filter(
    (item) => item.id !== id,
  )
}

/** 批量退选已成功课程 */
export function batchUnselectConfirmedCourses(courseIds) {
  const ids = Array.isArray(courseIds) ? courseIds.filter(Boolean) : []
  if (!ids.length) {
    return { ok: false, errorKey: 'courseRegistration.student.batchUnselectEmpty' }
  }
  if (!isRegistrationPhaseForUnselect()) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotInPhase' }
  }
  let count = 0
  for (const courseId of ids) {
    const result = unselectConfirmedCourse(courseId)
    if (result.ok) count += 1
  }
  if (!count) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
  }
  return { ok: true, count }
}


export function addToCart(course, section) {
  if (!course || !section) return { ok: false }
  const gate = assertEligibleAndNotInCart(course)
  if (!gate.ok) return gate
  const seatGate = assertSectionHasSeat(section)
  if (!seatGate.ok) return seatGate
  setActiveRoundCart([
    ...getActiveRoundCart(),
    {
      intent: 'register',
      courseId: course.id,
      sectionId: section.id,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      sectionCode: section.code,
      time: section.time,
      classTime: section.classTime || section.time,
      weekRange: section.weekRange || '',
      room: section.room,
      lecturer: section.lecturer,
      meetings: section.meetings,
      batchId: course.batchId,
      type: course.type,
      isHot: course.isHot,
    },
  ])
  return { ok: true }
}

/** 课程级候补进篮（不绑定教学分组），提交后入队 */
export function addWaitlistToCart(course) {
  const gate = assertEligibleAndNotInCart(course)
  if (!gate.ok) return gate
  const wlCourse = findWaitlistCourseByCode(course.code)
  if (!wlCourse) {
    return { ok: false, errorKey: 'courseRegistration.student.waitlistNotFound' }
  }
  const studentId = getStudentProfileFields().studentId
  if (wlCourse.waitlist.some((entry) => entry.studentId === studentId)) {
    return { ok: false, errorKey: 'courseRegistration.student.waitlistDuplicate' }
  }
  const estimatedPosition = getEstimatedWaitlistPosition(wlCourse.id)
  setActiveRoundCart([
    ...getActiveRoundCart(),
    {
      intent: 'waitlist',
      courseId: course.id,
      waitlistCourseId: wlCourse.id,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      estimatedPosition,
      batchId: course.batchId,
      type: course.type,
      isHot: course.isHot,
    },
  ])
  return { ok: true }
}

export function removeFromCart(courseId) {
  setActiveRoundCart(getActiveRoundCart().filter((item) => item.courseId !== courseId))
}

export function clearActiveRoundCart() {
  setActiveRoundCart([])
}

export const cartTotalCredits = computed(() =>
  registrationCart.value
    .filter((item) => item.intent !== 'waitlist')
    .reduce((sum, item) => sum + (item.credits || 0), 0),
)

/** 选课阶段（未开课）：活跃批次可退选；closed 等状态不可退选 */
export function isRegistrationPhaseForUnselect(batch = getActiveBatch()) {
  return Boolean(batch && batch.status === 'active')
}

function adjustSectionEnrolled(courseId, sectionId, sectionCode, delta) {
  const idx = selectableCourses.value.findIndex((item) => item.id === courseId)
  const course = idx >= 0 ? selectableCourses.value[idx] : getCourseById(courseId)
  if (!course?.sections?.length) return
  const section =
    (sectionId && course.sections.find((item) => item.id === sectionId)) ||
    (sectionCode && course.sections.find((item) => item.code === sectionCode)) ||
    null
  if (!section) return
  const nextEnrolled = Math.max(0, (Number(section.enrolled) || 0) + delta)
  const nextSections = course.sections.map((sec) =>
    sec === section || sec.id === section.id ? { ...sec, enrolled: nextEnrolled } : sec,
  )
  if (idx >= 0) {
    // 替换课库行，保证列表「可选名额」列随历轮/本轮退选即时刷新
    const nextCourse = { ...course, sections: nextSections }
    selectableCourses.value = selectableCourses.value.map((item, i) =>
      i === idx ? nextCourse : item,
    )
  } else {
    section.enrolled = nextEnrolled
  }
}

/**
 * 按课号/分组定位教学组
 * @param {{ courseId?: string, courseCode?: string, sectionId?: string, sectionCode?: string }} ref
 */
function findCourseAndSection(ref = {}) {
  const course =
    (ref.courseId && getCourseById(ref.courseId)) ||
    selectableCourses.value.find((item) => item.code === ref.courseCode) ||
    null
  if (!course) return { course: null, section: null }
  const section =
    (ref.sectionId && course.sections?.find((item) => item.id === ref.sectionId)) ||
    (ref.sectionCode && course.sections?.find((item) => item.code === ref.sectionCode)) ||
    null
  return { course, section }
}

/**
 * 加退课提交时预占名额（不进选课排队）
 * @param {{ courseId?: string, courseCode?: string, sectionId?: string, sectionCode?: string }} ref
 */
export function holdAddDropSectionSeat(ref) {
  const { course, section } = findCourseAndSection(ref)
  if (!course) {
    return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
  }
  if (section) {
    if (Number(section.enrolled) >= Number(section.capacity)) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
    }
    section.enrolled = Number(section.enrolled) + 1
  } else if (Number(course.remainingCapacity) <= 0) {
    return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
  }
  if (course.remainingCapacity != null) {
    course.remainingCapacity = Math.max(0, Number(course.remainingCapacity) - 1)
  }
  return {
    ok: true,
    hold: {
      courseId: course.id,
      courseCode: course.code,
      sectionId: section?.id || '',
      sectionCode: section?.code || ref.sectionCode || '',
    },
  }
}

/**
 * 取消/拒绝加退课时释放预占名额
 * @param {{ courseId?: string, courseCode?: string, sectionId?: string, sectionCode?: string }|null} hold
 */
export function releaseAddDropSectionSeat(hold) {
  if (!hold) return { ok: false }
  const { course, section } = findCourseAndSection(hold)
  if (!course) return { ok: false }
  if (section) {
    section.enrolled = Math.max(0, Number(section.enrolled) - 1)
  }
  if (course.remainingCapacity != null) {
    const cap = course.sections?.length
      ? course.sections.reduce((sum, item) => sum + (Number(item.capacity) || 0), 0)
      : Number(course.totalCapacity) || Number(course.remainingCapacity) + 1
    course.remainingCapacity = Math.min(cap, Number(course.remainingCapacity) + 1)
  }
  return { ok: true }
}

function refreshStudentScheduleFromConfirmed() {
  studentSchedule.value = studentConfirmedCourses.value
    .map((item) => parseSectionSchedule(item.time || item.classTime, item.courseCode))
    .filter(Boolean)
}

function upsertMonitorRow(studentFields, batch, historyAction) {
  const existingIndex = registrationMonitorQueue.value.findIndex(
    (row) => row.studentId === studentFields.studentId,
  )
  const existing = existingIndex >= 0 ? registrationMonitorQueue.value[existingIndex] : null
  const mergedCourses = [...studentConfirmedCourses.value]
  const credits = mergedCourses.reduce((sum, item) => sum + (item.credits || 0), 0)
  const schedule = mergedCourses
    .map((item) => parseSectionSchedule(item.time || item.classTime, item.courseCode))
    .filter(Boolean)
  const creditMin = batch?.creditMin ?? resolveTermCreditMin(batch?.academicSession)
  const creditMax = batch?.creditMax ?? resolveTermCreditMax(batch?.academicSession)
  const history = [...(existing?.history || [])]
  if (historyAction) {
    history.push({
      at: new Date().toLocaleDateString('en-GB'),
      action: historyAction,
    })
  }
  const base = {
    studentId: studentFields.studentId,
    studentName: studentFields.studentName,
    programme: studentFields.programme,
    intake: studentFields.intake,
    credits,
    creditMin,
    creditMax,
    status:
      credits === 0
        ? 'notRegistered'
        : credits < creditMin
          ? 'creditLow'
          : credits > creditMax
            ? 'creditHigh'
            : 'normal',
    tags: existing?.tags || [],
    cgpa: existing?.cgpa ?? 3.35,
    termElectiveProgress: existing?.termElectiveProgress ?? {
      ge: 4,
      me: 6,
      geMax: 6,
      meMax: 22,
    },
    termGeCategories: existing?.termGeCategories ?? {
      group4of3: 7,
      group3of2: 5,
      group2of1: 3,
      ordinary: 3,
      required: { group4of3: 8, group3of2: 6, group2of1: 4, ordinary: 4 },
    },
    graduationGeProgress: existing?.graduationGeProgress ?? {
      humanities: 5,
      business: 2,
      science: 3,
      aiOpen: 3,
      required: { humanities: 5, business: 5, science: 4, aiOpen: 2 },
    },
    g1Progress: existing?.g1Progress ?? {
      humanities: 5,
      business: 2,
      science: 3,
      aiOpen: 3,
      required: { humanities: 5, business: 5, science: 4, aiOpen: 2 },
    },
    schedule,
    issues: credits === 0 ? ['notRegistered'] : credits < creditMin ? ['creditBelowMin'] : [],
    history,
  }
  if (existingIndex === -1) {
    registrationMonitorQueue.value.unshift({ id: `mon-stu-${studentFields.studentId}`, ...base })
  } else {
    registrationMonitorQueue.value[existingIndex] = {
      ...registrationMonitorQueue.value[existingIndex],
      ...base,
    }
  }
}

function applyConfirmedRegistration(courses, options = {}) {
  const holdSeat = options.holdSeat !== false
  const merged = [...studentConfirmedCourses.value]
  const selectedAt = nowSelectedAt()
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  for (const course of courses) {
    if (!merged.some((item) => item.courseId === course.courseId)) {
      merged.push({
        ...course,
        selectedAt: course.selectedAt || selectedAt,
        sourceType: course.sourceType || 'round',
        roundKey: course.roundKey || roundKey,
      })
      if (holdSeat) {
        adjustSectionEnrolled(course.courseId, course.sectionId, course.sectionCode, 1)
      }
    }
  }
  studentConfirmedCourses.value = merged
  refreshStudentScheduleFromConfirmed()
  scheduleDemoIncrementalReconcile()
}

/**
 * 加选/退选后按学分帽剔除超限的 R2/R3 默认增量 demo 课（不回填；动态 import 避免与 seed 循环依赖）
 */
function scheduleDemoIncrementalReconcile() {
  import('./studentDemoSeed.js')
    .then((mod) => {
      mod.reconcileIncrementalDemoConfirmedCourses?.({ allowAdd: false })
    })
    .catch(() => {})
}

/** 志愿队列结束：写入待分配，不占已选学分、不占教学分组 enrolled */
function applyPendingAssignRegistration(courses) {
  const merged = [...studentPendingAssignCourses.value]
  const selectedAt = nowSelectedAt()
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  for (const course of courses) {
    const isDup = (item) =>
      item.courseId === course.courseId && item.sectionId === course.sectionId
    if (!merged.some(isDup)) {
      const next = assignNextPreferenceOrder({
        ...course,
        id: course.id || `pending-${course.courseId}-${Date.now()}`,
        selectedAt: course.selectedAt || selectedAt,
        sourceType: roundKey === 'preselect' ? 'preselect' : 'round',
        roundKey,
      })
      // assignNextPreferenceOrder 基于当前 ref；循环内先写入再算下一门
      merged.push(next)
      studentPendingAssignCourses.value = merged
    }
  }
  studentPendingAssignCourses.value = merged
  syncVolunteerOrderAfterPendingChange(getActiveBatch()?.id)
}

function removeConfirmedCourseRecord(removed, historyAction) {
  studentConfirmedCourses.value = studentConfirmedCourses.value.filter((item) => {
    if (item.courseId !== removed.courseId) return true
    if (removed.sectionId && item.sectionId) return item.sectionId !== removed.sectionId
    if (removed.sectionCode != null && item.sectionCode != null) {
      return String(item.sectionCode) !== String(removed.sectionCode)
    }
    return false
  })
  adjustSectionEnrolled(removed.courseId, removed.sectionId, removed.sectionCode, -1)
  refreshStudentScheduleFromConfirmed()
  scheduleDemoIncrementalReconcile()
  const studentFields = getStudentProfileFields()
  const batch = getActiveBatch()
  upsertMonitorRow(studentFields, batch, historyAction)
}

/**
 * 选课阶段退选：只移除该行教学分组（同课其它分组保留）
 * @param {string} courseId
 * @param {{ sectionId?: string, sectionCode?: string }|string|null} [section]
 */
export function unselectConfirmedCourse(courseId, section = null) {
  if (!courseId) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
  }
  if (!isRegistrationPhaseForUnselect()) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotInPhase' }
  }

  const sectionId =
    typeof section === 'string' ? section : section?.sectionId || section?.section || null
  const sectionCode =
    typeof section === 'object' && section
      ? section.sectionCode || (typeof section.section === 'string' ? section.section : null)
      : null

  const matchSection = (item) => {
    if (!item || item.courseId !== courseId) return false
    if (sectionId) return item.sectionId === sectionId
    if (sectionCode != null && sectionCode !== '') {
      return String(item.sectionCode || item.section || '') === String(sectionCode)
    }
    return true
  }

  const pending = studentPendingAssignCourses.value.find(matchSection)
  const removed = studentConfirmedCourses.value.find(matchSection)

  const clearMatchingPending = (row) => {
    const pendingSectionId = row.sectionId || sectionId || null
    studentPendingAssignCourses.value = studentPendingAssignCourses.value.filter(
      (item) => !matchSection(item),
    )
    const studentId = getStudentProfileFields().studentId
    removeStudentPreselectVolunteer(courseId, studentId, pendingSectionId)
    const batchId = row.batchId || getActiveBatch()?.id || ''
    const keptOther = studentPendingAssignCourses.value.filter(
      (item) => String(item.batchId || '') !== String(batchId),
    )
    const remaining = studentPendingAssignCourses.value
      .filter((item) => String(item.batchId || '') === String(batchId))
      .slice()
      .sort((a, b) => (Number(a.preferenceOrder) || 0) - (Number(b.preferenceOrder) || 0))
      .map((item, index) => ({ ...item, preferenceOrder: index + 1 }))
    studentPendingAssignCourses.value = [...keptOther, ...remaining]
    syncVolunteerOrderAfterPendingChange(batchId)
  }

  // 确认课优先：R2/R3 退选不因 R1 残留 pending + 志愿锁误拦
  if (removed) {
    if (pending) clearMatchingPending(pending)
    removeConfirmedCourseRecord(removed, `Unselected ${removed.courseCode} (released seat)`)
    return { ok: true }
  }

  if (pending) {
    const lockGate = assertVolunteerListEditable()
    if (!lockGate.ok) return lockGate
    clearMatchingPending(pending)
    return { ok: true }
  }

  return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
}

/** 开课后退课生效：按课号移除已确认结果（不校验选课阶段） */
export function dropConfirmedCourseByCode(courseCode) {
  if (!courseCode) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
  }
  const removed = studentConfirmedCourses.value.find((item) => item.courseCode === courseCode)
  if (!removed) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
  }
  removeConfirmedCourseRecord(removed, `Dropped ${removed.courseCode} (post-start)`)
  return { ok: true }
}

/**
 * 加退课审批通过后：将 Add/Retake 项写入当前演示学生已选结果（演示级）
 * @param {object[]} items
 * @param {{ seatAlreadyHeld?: boolean }} [options]
 */
export function confirmCoursesFromAddDropItems(items = [], options = {}) {
  const addItems = (items || []).filter((item) => item.action === 'Add' || item.action === 'Retake')
  if (!addItems.length) return { ok: true, count: 0 }

  const courses = []
  for (const item of addItems) {
    const course =
      (item.courseId && getCourseById(item.courseId)) ||
      selectableCourses.value.find((c) => c.code === item.courseCode) ||
      getCoursesByBatch(getActiveBatch()?.id).find((c) => c.code === item.courseCode)
    if (!course) continue
    const section =
      (item.sectionId && course.sections?.find((s) => s.id === item.sectionId)) ||
      (item.section && course.sections?.find((s) => s.code === item.section)) ||
      course.sections?.find((s) => s.enrolled < s.capacity) ||
      course.sections?.[0]
    courses.push({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      credits: item.credits || course.credits,
      type: course.type,
      sectionId: section?.id,
      sectionCode: item.section || section?.code || '01',
      time: item.time || section?.time || '',
      weekRange: section?.weekRange || '',
      room: section?.room || '',
      lecturer: section?.lecturer || '',
      batchId: course.batchId || getActiveBatch()?.id,
      sourceType: 'addDrop',
      roundKey: 'addDrop',
      isRetake: item.action === 'Retake',
    })
  }
  if (!courses.length) return { ok: false, count: 0 }
  applyConfirmedRegistration(courses, { holdSeat: !options.seatAlreadyHeld })
  const studentFields = getStudentProfileFields()
  const batch = getActiveBatch()
  const codes = courses.map((c) => c.courseCode).join(', ')
  upsertMonitorRow(studentFields, batch, `Add/Drop approved: ${codes}`)
  return { ok: true, count: courses.length }
}

function commitWaitlistItems(waitlistItems, studentFields) {
  const errors = []
  for (const item of waitlistItems) {
    const result = joinStudentWaitlist(item.waitlistCourseId, studentFields)
    if (!result.ok) {
      errors.push(result.errorKey || 'courseRegistration.student.waitlistNotFound')
    }
  }
  return errors
}

export async function submitRegistrationCart() {
  const cart = getActiveRoundCart()
  if (!cart.length) {
    return { ok: false, errorKey: 'courseRegistration.student.cartEmpty' }
  }
  const studentFields = getStudentProfileFields()
  const batch = getActiveBatch()
  const snapshot = [...cart]
  const waitlistItems = snapshot.filter((item) => item.intent === 'waitlist')
  const courses = snapshot.filter((item) => item.intent !== 'waitlist')

  if (!courses.length) {
    const errors = commitWaitlistItems(waitlistItems, studentFields)
    clearActiveRoundCart()
    if (errors.length) {
      return { ok: false, errorKey: errors[0], waitlistSubmitted: waitlistItems.length - errors.length }
    }
    return { ok: true, waitlistOnly: true, waitlistCount: waitlistItems.length }
  }

  const queueContext = {
    ...studentFields,
    batchName: batch?.name,
    academicSession: batch?.academicSession,
    courses,
    courseCode: courses.length === 1 ? courses[0].courseCode : `${courses.length}`,
    courseName: courses.length === 1 ? courses[0].courseName : 'courseRegistration.student.multiCourseSummary',
    credits: courses.reduce((sum, item) => sum + item.credits, 0),
    section: courses.length === 1 ? courses[0].sectionCode : undefined,
    time: courses.length === 1 ? courses[0].time : undefined,
    room: courses.length === 1 ? courses[0].room : undefined,
    lecturer: courses.length === 1 ? courses[0].lecturer : undefined,
  }

  try {
    await runRegistrationQueue(queueContext, {
      onComplete: () => {
        const wlErrors = commitWaitlistItems(waitlistItems, studentFields)
        const newCredits = courses.reduce((sum, item) => sum + (item.credits || 0), 0)
        applyConfirmedRegistration(courses)
        upsertMonitorRow(
          studentFields,
          batch,
          `Registered ${newCredits} credit(s) via online queue`,
        )
        clearActiveRoundCart()
        return { ok: !wlErrors.length, errorKey: wlErrors[0] }
      },
    })
    return { ok: true, waitlistCount: waitlistItems.length }
  } catch {
    return { ok: false, cancelled: true }
  }
}

export function getStudentEnrolledCourses(studentId = getStudentProfileFields().studentId) {
  if (studentConfirmedCourses.value.length) {
    return studentConfirmedCourses.value.map((item) => {
      const lib =
        (item.courseId && getCourseById(item.courseId)) ||
        selectableCourses.value.find((c) => c.code === item.courseCode) ||
        null
      const type = item.type || lib?.type || 'ME'
      const schoolElectiveCategory = resolveSchoolElectiveCategory({
        type,
        code: item.courseCode,
        id: item.courseId || item.courseCode,
        schoolElectiveCategory: item.schoolElectiveCategory || lib?.schoolElectiveCategory,
      })
      return {
        courseId: item.courseId || '',
        courseCode: item.courseCode,
        courseName: item.courseName,
        sectionId: item.sectionId,
        sectionCode: item.sectionCode,
        sectionName: item.sectionName,
        time: item.time,
        classTime: item.classTime || item.time,
        weekRange: item.weekRange || '—',
        room: item.room || '—',
        credits: item.credits,
        lecturer: item.lecturer,
        type,
        schoolElectiveCategory,
        meetings: item.meetings,
        sourceType: item.sourceType || '',
        batchId: item.batchId || lib?.batchId || '',
      }
    })
  }
  const monitorRow = registrationMonitorQueue.value.find((row) => row.studentId === studentId)
  if (monitorRow?.schedule?.length) {
    return monitorRow.schedule.map((slot) => {
      const time = `${slot.day} ${slot.start}:00–${slot.end}:00`
      const type = slot.type || 'ME'
      return {
        courseId: '',
        courseCode: slot.course,
        courseName: slot.courseName || slot.course || '—',
        sectionId: slot.sectionId,
        sectionCode: slot.section || '—',
        sectionName: slot.sectionName,
        time,
        classTime: slot.classTime || time,
        weekRange: slot.weekRange || '—',
        room: slot.room || '—',
        credits: slot.credits,
        lecturer: slot.lecturer || '—',
        type,
        schoolElectiveCategory: resolveSchoolElectiveCategory({
          type,
          code: slot.course,
          id: slot.course,
          schoolElectiveCategory: slot.schoolElectiveCategory,
        }),
      }
    })
  }
  return []
}

/**
 * @param {string} [roundKey] 轮次
 * @param {{ batchId?: string }} [options] 可选指定批次（待开放预览等）
 */
export function getSelectableCoursesForStudent(roundKey, options = {}) {
  const batch = options.batchId ? getBatchById(options.batchId) : getActiveBatch()
  const preferredType = batch?.type === 'GE' ? 'GE' : 'ME'
  // 校选类别改由列表搜索驱动（默认学生本人类别），此处不再硬滤
  const courseBatchId = batch?.demoCourseSourceBatchId || batch?.id
  const studentProgramme = getStudentProfileFields().programme || ''
  const courses = getCoursesByBatch(courseBatchId).filter(
    (course) =>
      course.type === preferredType &&
      courseMatchesStudentProgramme(course, studentProgramme),
  )
  const resolvedRound =
    roundKey != null && roundKey !== ''
      ? normalizeCartRoundKey(roundKey)
      : normalizeCartRoundKey(activeCartRoundKey.value)
  const context = buildEligibilityContext(getCurrentStudent(), batch, {
    roundKey: resolvedRound,
  })
  return sortCoursesForStudentDemo(attachEligibilityToCourses(courses, context))
}

export function getCourseWithFirstOpenSection(courseId) {
  const course = getCourseById(courseId)
  if (!course) return null
  const section = course.sections?.find((item) => item.enrolled < item.capacity) || course.sections?.[0]
  return section ? { course, section } : null
}

export function isCourseInCart(courseId) {
  return isCourseOccupied(courseId)
}
