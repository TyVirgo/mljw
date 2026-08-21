import { ref, computed } from 'vue'
import { getCurrentStudent } from '../mockCurrentStudent.js'
import { getActiveBatch } from './registrationBatches.js'
import { isReleaseCrossAudienceOnRound3 } from './registrationRuleSettings.js'
import {
  getCoursesByBatch,
  getCourseById,
  selectableCourses,
  sortCoursesForStudentDemo,
  getRound3EffectiveRemaining,
  courseMatchesStudentSchoolElective,
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
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'
import {
  buildEligibilityContext,
  attachEligibilityToCourses,
  evaluateCourseEligibility,
} from './studentEligibility.js'
import {
  findWaitlistCourseByCode,
  getEstimatedWaitlistPosition,
  joinStudentWaitlist,
} from './waitlistQueue.js'
import {
  hasStudentVolunteeredCourse,
  submitStudentPreselectVolunteer,
  removeStudentPreselectVolunteer,
} from './preselectVolunteerConfirm.js'
import {
  getRegistrationSemesterIndex,
  getStudentAudience,
  getTermCreditCaps,
  creditCapForCourseType,
  isGraduateStudent,
} from './studentAudience.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { studentPendingAssignCourses } from './studentPendingAssignState.js'
import {
  assertVolunteerListEditable,
  assignNextPreferenceOrder,
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

export function isCourseOccupied(courseId) {
  if (!courseId) return false
  if (pendingRegistration.value?.courseId === courseId) return true
  if (hasStudentVolunteeredCourse(courseId)) return true
  if (studentPendingAssignCourses.value.some((item) => item.courseId === courseId)) return true
  return studentConfirmedCourses.value.some((item) => item.courseId === courseId)
}

export const myRegistrationList = computed(() => {
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  const list = []
  if (pendingRegistration.value) {
    list.push({ ...pendingRegistration.value, status: 'queued' })
  }
  if (roundKey === 'preselect') {
    const batchId = getActiveBatch()?.id
    for (const item of studentPendingAssignCourses.value) {
      if (batchId && item.batchId && item.batchId !== batchId) continue
      list.push({ ...item, status: 'pendingAssign' })
    }
    return list
  }
  for (const item of studentConfirmedCourses.value) {
    list.push({ ...item, status: 'success' })
  }
  for (const item of studentFailedRegistrations.value) {
    list.push({ ...item, status: 'failed' })
  }
  return list
})

export const myRegistrationCredits = computed(() =>
  studentConfirmedCourses.value.reduce((sum, item) => sum + (item.credits || 0), 0),
)

/** 选课提交成功时刻，展示为 YYYY-MM-DD HH:mm:ss */
export function formatSelectedAt(value) {
  if (value == null || value === '') return '—'
  const pad = (n) => String(n).padStart(2, '0')
  const formatDate = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '—' : formatDate(value)
  }
  const raw = String(value).trim()
  if (!raw) return '—'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return formatDate(parsed)
}

function nowSelectedAt() {
  return formatSelectedAt(new Date())
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
    termCreditCaps: caps,
    schoolElectiveCategory:
      enrollment.schoolElectiveCategory || getDefaultStudentSchoolElectiveCategory(),
  }
}

function sumTermCreditsByType(extraCourse) {
  const items = [
    ...studentConfirmedCourses.value.filter((c) => c.intent !== 'waitlist'),
    ...registrationCart.value.filter((c) => c.intent !== 'waitlist'),
  ]
  if (extraCourse) items.push(extraCourse)
  return items.reduce(
    (acc, item) => {
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

/** 本学期 GE/ME 已选（含篮）与上限，供顶栏进度条 */
export function getTermElectiveCreditProgress(studentId) {
  const caps = getTermCreditCaps(studentId)
  const used = sumTermCreditsByType()
  return {
    ge: used.ge,
    me: used.me,
    geMax: caps.geMax,
    meMax: caps.meMax,
  }
}

function assertTermCreditCap(course) {
  if (!course) return { ok: true }
  const caps = getTermCreditCaps()
  const next = sumTermCreditsByType(course)
  const kind = normalizeRegistrationType(course.type)
  const cap = creditCapForCourseType(kind, caps)
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

function assertRound3AudienceCapacity(course) {
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  if (roundKey !== 'supplement' || !course) return { ok: true }
  const audience = getStudentAudience()
  const release = isReleaseCrossAudienceOnRound3(getActiveBatch())
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

function assertEligibleAndNotInCart(course) {
  if (!course) return { ok: false }
  if (isCourseOccupied(course.id)) {
    return { ok: false, errorKey: 'courseRegistration.student.cartDuplicate' }
  }
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

/** 单课确认选课：第二/三轮进队列；第一轮提交志愿并进队列，结束后为待分配 */
export function submitSingleCourseRegistration(course, section) {
  if (!course || !section) return { ok: false }
  const gate = assertEligibleAndNotInCart(course)
  if (!gate.ok) return gate

  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value)
  const studentFields = getStudentProfileFields()

  if (roundKey === 'preselect') {
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
      silent: false,
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

  if (section.enrolled >= section.capacity) {
    return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
  }

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
    silent: false,
    showSuccess: true,
    onComplete: () => {
      const failed = Math.random() < 0.15
      pendingRegistration.value = null
      if (failed) {
        studentFailedRegistrations.value = [
          {
            ...item,
            id: `fail-${item.courseId}-${Date.now()}`,
            failedAt: nowSelectedAt(),
          },
          ...studentFailedRegistrations.value,
        ]
        return { ok: false, errorKey: 'courseRegistration.student.registerFailedQueue' }
      }
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
      removeStudentPreselectVolunteer(pending.courseId, studentId)
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

/** 查看排队进度：若已有静默队列则揭开展示，否则演示进度界面 */
export function openMyCourseQueueProgress(item) {
  if (!item) return
  if (isRegistrationQueueWaiting()) {
    revealQueueOverlay()
    return
  }

  const studentFields = getStudentProfileFields()
  const batch = getActiveBatch()
  void runRegistrationQueue(
    {
      ...studentFields,
      batchName: batch?.name,
      academicSession: batch?.academicSession,
      courses: [item],
      courseCode: item.courseCode,
      courseName: item.courseName,
      credits: item.credits,
      section: item.sectionCode,
      time: item.time || item.classTime,
      room: item.room,
      lecturer: item.lecturer,
    },
    {
      silent: false,
      showSuccess: false,
      onComplete: () => ({ ok: true }),
    },
  ).catch(() => {})
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
  if (section.enrolled >= section.capacity) {
    return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
  }
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
  const course = getCourseById(courseId)
  if (!course?.sections?.length) return
  const section =
    (sectionId && course.sections.find((item) => item.id === sectionId)) ||
    (sectionCode && course.sections.find((item) => item.code === sectionCode)) ||
    null
  if (!section) return
  section.enrolled = Math.max(0, (Number(section.enrolled) || 0) + delta)
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
  const creditMin = batch?.creditMin ?? LONG_SEMESTER_CREDIT_MIN
  const creditMax = batch?.creditMax ?? LONG_SEMESTER_CREDIT_MAX
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
      geMax: 12,
      meMax: 16,
    },
    termGeCategories: existing?.termGeCategories ?? {
      humanities: 0,
      business: 4,
      science: 2,
      required: { humanities: 6, business: 5, science: 5 },
    },
    graduationGeProgress: existing?.graduationGeProgress ?? {
      humanities: 4,
      business: 3,
      science: 2,
      required: { humanities: 6, business: 6, science: 6 },
    },
    g1Progress: existing?.g1Progress ?? {
      humanities: 4,
      business: 3,
      science: 2,
      required: { humanities: 6, business: 6, science: 6 },
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
}

/** 第一轮志愿队列结束：写入待分配，不占已选学分、不占教学分组 enrolled */
function applyPendingAssignRegistration(courses) {
  const merged = [...studentPendingAssignCourses.value]
  const selectedAt = nowSelectedAt()
  for (const course of courses) {
    if (!merged.some((item) => item.courseId === course.courseId)) {
      const next = assignNextPreferenceOrder({
        ...course,
        id: course.id || `pending-${course.courseId}-${Date.now()}`,
        selectedAt: course.selectedAt || selectedAt,
        sourceType: 'preselect',
        roundKey: 'preselect',
      })
      // assignNextPreferenceOrder 基于当前 ref；循环内先写入再算下一门
      merged.push(next)
      studentPendingAssignCourses.value = merged
    }
  }
  studentPendingAssignCourses.value = merged
}

function removeConfirmedCourseRecord(removed, historyAction) {
  studentConfirmedCourses.value = studentConfirmedCourses.value.filter(
    (item) => item.courseId !== removed.courseId,
  )
  adjustSectionEnrolled(removed.courseId, removed.sectionId, removed.sectionCode, -1)
  refreshStudentScheduleFromConfirmed()
  const studentFields = getStudentProfileFields()
  const batch = getActiveBatch()
  upsertMonitorRow(studentFields, batch, historyAction)
}

/** 选课阶段退选：从已确认结果移除并释放教学分组名额 */
export function unselectConfirmedCourse(courseId) {
  if (!courseId) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
  }
  if (!isRegistrationPhaseForUnselect()) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotInPhase' }
  }

  const pending = studentPendingAssignCourses.value.find((item) => item.courseId === courseId)
  if (pending) {
    const lockGate = assertVolunteerListEditable()
    if (!lockGate.ok) return lockGate
    studentPendingAssignCourses.value = studentPendingAssignCourses.value.filter(
      (item) => item.courseId !== courseId,
    )
    const studentId = getStudentProfileFields().studentId
    removeStudentPreselectVolunteer(courseId, studentId)
    const batchId = pending.batchId || getActiveBatch()?.id || ''
    const keptOther = studentPendingAssignCourses.value.filter(
      (item) => String(item.batchId || '') !== String(batchId),
    )
    const remaining = studentPendingAssignCourses.value
      .filter((item) => String(item.batchId || '') === String(batchId))
      .slice()
      .sort((a, b) => (Number(a.preferenceOrder) || 0) - (Number(b.preferenceOrder) || 0))
      .map((item, index) => ({ ...item, preferenceOrder: index + 1 }))
    studentPendingAssignCourses.value = [...keptOther, ...remaining]
    return { ok: true }
  }

  const removed = studentConfirmedCourses.value.find((item) => item.courseId === courseId)
  if (!removed) {
    return { ok: false, errorKey: 'courseRegistration.student.unselectNotFound' }
  }
  removeConfirmedCourseRecord(removed, `Unselected ${removed.courseCode} (released seat)`)
  return { ok: true }
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

export function getSelectableCoursesForStudent(roundKey) {
  const batch = getActiveBatch()
  const preferredType = batch?.type === 'GE' ? 'GE' : 'ME'
  const studentCat =
    getStudentProfileFields().schoolElectiveCategory || getDefaultStudentSchoolElectiveCategory()
  const courses = getCoursesByBatch(batch?.id).filter(
    (course) =>
      course.type === preferredType && courseMatchesStudentSchoolElective(course, studentCat),
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
