import { ref, computed } from 'vue'
import { getCurrentStudent } from '../mockCurrentStudent.js'
import { getActiveBatch } from './registrationBatches.js'
import { getCoursesByBatch, getCourseById, sortCoursesForStudentDemo } from './selectableCourses.js'
import { runRegistrationQueue } from '../../composables/useRegistrationQueue.js'
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

export const registrationCart = ref([])

export const studentConfirmedCourses = ref([])

export const studentSchedule = ref([])

function normalizeIntake(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(-4)
  return digits || '2409'
}

export function getStudentProfileFields(student = getCurrentStudent()) {
  const basic = student?.basicInfo || {}
  const enrollment = student?.enrollment || {}
  return {
    studentId: basic.studentId || '',
    studentName: basic.fullName || basic.chineseName || '',
    programme: enrollment.programmeCode || 'SWE',
    intake: normalizeIntake(enrollment.intake || enrollment.academicSession),
  }
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
  const batch = getActiveBatch()
  const context = buildEligibilityContext(getCurrentStudent(), batch)
  const eligibility = course.eligibility || evaluateCourseEligibility(course, context)
  if (!eligibility.eligible) {
    return {
      ok: false,
      errorKey: eligibility.primaryReasonKey || 'courseRegistration.eligibility.notEligible',
      errorParams: eligibility.primaryReasonParams,
    }
  }
  if (registrationCart.value.some((item) => item.courseId === course.id)) {
    return { ok: false, errorKey: 'courseRegistration.student.cartDuplicate' }
  }
  return { ok: true }
}

export function addToCart(course, section) {
  if (!course || !section) return { ok: false }
  const gate = assertEligibleAndNotInCart(course)
  if (!gate.ok) return gate
  if (section.enrolled >= section.capacity) {
    return { ok: false, errorKey: 'courseRegistration.student.sectionFull' }
  }
  registrationCart.value.push({
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
    batchId: course.batchId,
    type: course.type,
    isHot: course.isHot,
  })
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
  registrationCart.value.push({
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
  })
  return { ok: true }
}

export function removeFromCart(courseId) {
  registrationCart.value = registrationCart.value.filter((item) => item.courseId !== courseId)
}

export const cartTotalCredits = computed(() =>
  registrationCart.value
    .filter((item) => item.intent !== 'waitlist')
    .reduce((sum, item) => sum + (item.credits || 0), 0),
)

function upsertMonitorRow(studentFields, courses, batch) {
  const newCredits = courses.reduce((sum, item) => sum + (item.credits || 0), 0)
  const existingIndex = registrationMonitorQueue.value.findIndex(
    (row) => row.studentId === studentFields.studentId,
  )
  const existing = existingIndex >= 0 ? registrationMonitorQueue.value[existingIndex] : null
  const mergedCourses = [...(studentConfirmedCourses.value)]
  const credits = mergedCourses.reduce((sum, item) => sum + (item.credits || 0), 0)
  const schedule = mergedCourses
    .map((item) => parseSectionSchedule(item.time, item.courseCode))
    .filter(Boolean)
  const creditMin = batch?.creditMin ?? LONG_SEMESTER_CREDIT_MIN
  const creditMax = batch?.creditMax ?? LONG_SEMESTER_CREDIT_MAX
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
    g1Progress: existing?.g1Progress ?? {
      humanities: 4,
      business: 3,
      required: { humanities: 6, business: 6 },
    },
    schedule,
    issues: credits === 0 ? ['notRegistered'] : credits < creditMin ? ['creditBelowMin'] : [],
    history: [
      ...(existing?.history || []),
      {
        at: new Date().toLocaleDateString('en-GB'),
        action: `Registered ${newCredits} credit(s) via online queue`,
      },
    ],
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

function applyConfirmedRegistration(courses) {
  const merged = [...studentConfirmedCourses.value]
  for (const course of courses) {
    if (!merged.some((item) => item.courseId === course.courseId)) {
      merged.push({ ...course })
    }
  }
  studentConfirmedCourses.value = merged
  studentSchedule.value = merged
    .map((item) => parseSectionSchedule(item.time, item.courseCode))
    .filter(Boolean)
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
  if (!registrationCart.value.length) {
    return { ok: false, errorKey: 'courseRegistration.student.cartEmpty' }
  }
  const studentFields = getStudentProfileFields()
  const batch = getActiveBatch()
  const snapshot = [...registrationCart.value]
  const waitlistItems = snapshot.filter((item) => item.intent === 'waitlist')
  const courses = snapshot.filter((item) => item.intent !== 'waitlist')

  if (!courses.length) {
    const errors = commitWaitlistItems(waitlistItems, studentFields)
    registrationCart.value = []
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
        applyConfirmedRegistration(courses)
        upsertMonitorRow(studentFields, courses, batch)
        registrationCart.value = []
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
    return studentConfirmedCourses.value.map((item) => ({
      courseCode: item.courseCode,
      courseName: item.courseName,
      sectionCode: item.sectionCode,
      time: item.time,
      classTime: item.classTime || item.time,
      weekRange: item.weekRange || '—',
      room: item.room || '—',
      credits: item.credits,
      lecturer: item.lecturer,
    }))
  }
  const monitorRow = registrationMonitorQueue.value.find((row) => row.studentId === studentId)
  if (monitorRow?.schedule?.length) {
    return monitorRow.schedule.map((slot) => {
      const time = `${slot.day} ${slot.start}:00–${slot.end}:00`
      return {
        courseCode: slot.course,
        courseName: slot.courseName || slot.course || '—',
        sectionCode: slot.section || '—',
        time,
        classTime: slot.classTime || time,
        weekRange: slot.weekRange || '—',
        room: slot.room || '—',
        credits: slot.credits,
        lecturer: slot.lecturer || '—',
      }
    })
  }
  return []
}

export function getSelectableCoursesForStudent() {
  const batch = getActiveBatch()
  const courses = getCoursesByBatch(batch?.id)
  const context = buildEligibilityContext(getCurrentStudent(), batch)
  return sortCoursesForStudentDemo(attachEligibilityToCourses(courses, context))
}

export function getCourseWithFirstOpenSection(courseId) {
  const course = getCourseById(courseId)
  if (!course) return null
  const section = course.sections?.find((item) => item.enrolled < item.capacity) || course.sections?.[0]
  return section ? { course, section } : null
}

export function isCourseInCart(courseId) {
  return registrationCart.value.some((item) => item.courseId === courseId)
}
