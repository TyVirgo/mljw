/**
 * 加退重修申请分节表单：demo 枚举、显隐、清空与校验
 */

import { deriveClassTime, displayClassTimeVenue, getSectionMeetings } from './sectionScheduleFields.js'
import { getPreviousAcademicSession } from '../intakeSets.js'

export const ADD_COURSE_TYPE_OPTIONS = [
  { value: 'overload', labelKey: 'courseRegistration.student.addType.overload' },
  { value: 'timetable_clash', labelKey: 'courseRegistration.student.addType.timetableClash' },
  { value: 'prerequisite_waiver', labelKey: 'courseRegistration.student.addType.prerequisiteWaiver' },
  { value: 'other', labelKey: 'courseRegistration.student.addType.other' },
]

export const RETAKE_TYPE_OPTIONS = [
  { value: 'improve_grade', labelKey: 'courseRegistration.student.retakeType.improveGrade' },
  { value: 'failed', labelKey: 'courseRegistration.student.retakeType.failed' },
  { value: 'other', labelKey: 'courseRegistration.student.retakeType.other' },
]

export const GRADE_EARNED_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'M']

export const PREVIOUS_SESSION_OPTIONS = [
  '2024/09',
  '2025/02',
  '2025/04',
  '2025/09',
  '2026/02',
  '2026/04',
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

/** @param {string} action */
export function getVisibleAddDropSections(action) {
  const showII = action === 'Add' || action === 'AddDrop'
  const showIII = action === 'Drop' || action === 'AddDrop' || action === 'RetakeDrop'
  const showIV = action === 'Retake' || action === 'RetakeDrop'
  return { showI: true, showII, showIII, showIV, showV: true }
}

/**
 * 按表单可见顺序生成连续 SECTION 标题（与模板：学生 → 退课 → 加课 → 重修 → 声明 一致）
 * @param {string} action
 * @param {(key: string, params?: object) => string} t
 * @returns {{ student: string, drop: string, add: string, retake: string, declaration: string }}
 */
export function buildAddDropSectionBars(action, t) {
  const vis = getVisibleAddDropSections(action)
  let index = 0
  const bar = (labelKey) => {
    const n = ROMAN[index] || String(index + 1)
    index += 1
    return t('courseRegistration.student.sectionBar', {
      n,
      label: t(labelKey),
    })
  }
  return {
    student: bar('courseRegistration.student.sectionLabelStudent'),
    drop: vis.showIII ? bar('courseRegistration.student.sectionLabelDrop') : '',
    add: vis.showII ? bar('courseRegistration.student.sectionLabelAdd') : '',
    retake: vis.showIV ? bar('courseRegistration.student.sectionLabelRetake') : '',
    declaration: vis.showV ? bar('courseRegistration.student.sectionLabelDeclaration') : '',
  }
}

function emptySectionFields(prefix = '') {
  if (!prefix) {
    return {
      sectionId: '',
      sectionCode: '',
      sectionName: '',
      classTime: '',
      weekRange: '',
      venue: '',
      lecturers: '',
    }
  }
  return {
    [`${prefix}SectionId`]: '',
    [`${prefix}SectionCode`]: '',
    [`${prefix}SectionName`]: '',
    [`${prefix}ClassTime`]: '',
    [`${prefix}WeekRange`]: '',
    [`${prefix}Venue`]: '',
    [`${prefix}Lecturers`]: '',
  }
}

/** 切换类型时清空被隐藏节业务字段，保留学年学期、类型、联系电话 */
export function clearHiddenSectionFields(form, action) {
  return {
    ...form,
    courseId: '',
    dropCourseId: '',
    addCourseId: '',
    ...emptySectionFields(),
    ...emptySectionFields('drop'),
    ...emptySectionFields('add'),
    addType: '',
    addNotes: '',
    dropReason: '',
    feeWaiver: '',
    attachmentName: '',
    previouslyTakenCourse: '',
    gradeEarned: '',
    academicSessionTaken:
      action === 'Retake' || action === 'RetakeDrop'
        ? getPreviousAcademicSession(form.academicSession)
        : '',
    retakeType: '',
    transcriptId: '',
    eligibilitySource: '',
    feeEstimate: null,
    declarationAgreed: false,
    action,
  }
}

export function createEmptyAddDropSectionForm(overrides = {}) {
  const next = {
    academicSession: '',
    action: 'Add',
    courseId: '',
    dropCourseId: '',
    addCourseId: '',
    contactPhone: '',
    ...emptySectionFields(),
    ...emptySectionFields('drop'),
    ...emptySectionFields('add'),
    addType: '',
    addNotes: '',
    dropReason: '',
    feeWaiver: '',
    attachmentName: '',
    previouslyTakenCourse: '',
    gradeEarned: '',
    academicSessionTaken: '',
    retakeType: '',
    transcriptId: '',
    eligibilitySource: '',
    feeEstimate: null,
    declarationAgreed: false,
    ...overrides,
  }
  if (next.action === 'Retake' || next.action === 'RetakeDrop') {
    if (!String(next.academicSessionTaken || '').trim()) {
      next.academicSessionTaken = getPreviousAcademicSession(next.academicSession)
    }
  }
  return next
}

/**
 * 从选课 + 分组生成快照（分字段）
 * @param {object|null} course
 * @param {object|null} [section]
 */
export function buildCourseScheduleSnapshot(course, section = null) {
  if (!course) {
    return {
      courseCode: '',
      courseName: '',
      groupNo: '',
      classTime: '',
      weekRange: '',
      venue: '',
      lecturers: '',
      label: '',
      sectionId: '',
      credits: 0,
      feeStream: '',
      type: '',
      eligibilitySource: '',
    }
  }
  const sec = section || {}
  const groupNo = sec.code || course.sectionCode || course.section || ''
  const rawTime = sec.time || course.time || ''
  const classTime = sec.classTime || (rawTime ? deriveClassTime(rawTime) : '')
  const weekRange = sec.weekRange || course.weekRange || '1-18'
  const venue = sec.room || course.room || ''
  const lecturers = sec.lecturer || course.lecturer || ''
  const label = [course.code, course.name].filter(Boolean).join(' — ')
  const meetings = getSectionMeetings({
    ...sec,
    time: rawTime || sec.time,
    room: venue,
    weekRange,
    meetings: sec.meetings || course.meetings,
  })
  const classTimeVenue = displayClassTimeVenue(
    { time: rawTime, room: venue, weekRange, meetings },
    'zh',
  )
  return {
    courseCode: course.code || '',
    courseName: course.name || course.code || '',
    groupNo,
    groupName: sec.name || sec.sectionName || '',
    classTime,
    weekRange,
    venue,
    lecturers,
    meetings,
    classTimeVenue,
    label,
    sectionId: sec.id || course.sectionId || '',
    sectionName: sec.name || sec.sectionName || '',
    credits: course.credits,
    feeStream: course.feeStream || '',
    type: course.type || '',
    eligibilitySource: course.eligibilitySource || '',
    dayTimeVenue: classTimeVenue,
  }
}

/** 将分组写入 form（primary | drop | add） */
export function applySectionToForm(form, target, section, course = null) {
  const next = { ...form }
  const code = section?.code || ''
  const rawTime = section?.time || ''
  const classTime = section?.classTime || (rawTime ? deriveClassTime(rawTime) : '')
  const weekRange = section?.weekRange || '1-18'
  const room = section?.room || ''
  const lecturer = section?.lecturer || ''
  const sid = section?.id || ''
  const meetings = getSectionMeetings(section)
  const classTimeVenue = displayClassTimeVenue(
    { time: rawTime, room, weekRange, meetings },
    'zh',
  )

  if (target === 'drop') {
    Object.assign(next, {
      dropSectionId: sid,
      dropSectionCode: code,
      dropSectionName: section?.name || section?.sectionName || '',
      dropClassTime: classTime,
      dropWeekRange: weekRange,
      dropVenue: room,
      dropLecturers: lecturer,
      dropMeetings: meetings,
      dropClassTimeVenue: classTimeVenue,
      dropTime: rawTime,
    })
  } else if (target === 'add') {
    Object.assign(next, {
      addSectionId: sid,
      addSectionCode: code,
      addSectionName: section?.name || section?.sectionName || '',
      addClassTime: classTime,
      addWeekRange: weekRange,
      addVenue: room,
      addLecturers: lecturer,
      addMeetings: meetings,
      addClassTimeVenue: classTimeVenue,
      addTime: rawTime,
      eligibilitySource: course?.eligibilitySource || next.eligibilitySource || '',
    })
  } else {
    Object.assign(next, {
      sectionId: sid,
      sectionCode: code,
      sectionName: section?.name || section?.sectionName || '',
      classTime,
      weekRange,
      venue: room,
      lecturers: lecturer,
      meetings,
      classTimeVenue,
      time: rawTime,
      eligibilitySource: course?.eligibilitySource || next.eligibilitySource || '',
    })
  }
  return next
}

function hasSection(form, prefix) {
  if (prefix === 'drop') return Boolean(form.dropSectionId || form.dropSectionCode)
  if (prefix === 'add') return Boolean(form.addSectionId || form.addSectionCode)
  return Boolean(form.sectionId || form.sectionCode)
}

/**
 * @param {object} form
 * @returns {{ ok: true } | { ok: false, errorKey: string }}
 */
export function validateAddDropSectionForm(form) {
  if (!form.academicSession) {
    return { ok: false, errorKey: 'courseRegistration.student.academicSessionRequired' }
  }
  if (!form.action) {
    return { ok: false, errorKey: 'courseRegistration.student.applicationTypeRequired' }
  }
  if (!String(form.contactPhone || '').trim()) {
    return { ok: false, errorKey: 'courseRegistration.student.contactPhoneRequired' }
  }

  const { showII, showIII, showIV } = getVisibleAddDropSections(form.action)

  if (showII) {
    const addId = form.action === 'AddDrop' ? form.addCourseId : form.courseId
    if (!addId) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectCourse' }
    }
    if (form.action === 'AddDrop' ? !hasSection(form, 'add') : !hasSection(form, '')) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionRequired' }
    }
  }

  if (showIII) {
    const dropId =
      form.action === 'AddDrop' || form.action === 'RetakeDrop'
        ? form.dropCourseId
        : form.courseId
    if (!dropId) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectCourse' }
    }
    if (
      form.action === 'AddDrop' || form.action === 'RetakeDrop'
        ? !hasSection(form, 'drop')
        : !hasSection(form, '')
    ) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionRequired' }
    }
    if (!String(form.dropReason || '').trim()) {
      return { ok: false, errorKey: 'courseRegistration.student.dropReasonRequired' }
    }
    if (form.feeWaiver !== 'yes' && form.feeWaiver !== 'no') {
      return { ok: false, errorKey: 'courseRegistration.student.feeWaiverRequired' }
    }
  }

  if (showIV) {
    if (!form.courseId) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectCourse' }
    }
    if (!form.gradeEarned) {
      return { ok: false, errorKey: 'courseRegistration.student.gradeEarnedRequired' }
    }
    if (!form.academicSessionTaken) {
      return { ok: false, errorKey: 'courseRegistration.student.sessionTakenRequired' }
    }
    if (!form.retakeType) {
      return { ok: false, errorKey: 'courseRegistration.student.retakeTypeRequired' }
    }
    if (!hasSection(form, '')) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionRequired' }
    }
    const timeVenue = String(form.classTimeVenue || form.classTime || '').replace(/[—–-]/g, '').trim()
    if (!timeVenue) {
      return { ok: false, errorKey: 'courseRegistration.student.classTimeVenueRequired' }
    }
    const lecturers = String(form.lecturers || '').trim()
    if (!lecturers || lecturers === '—') {
      return { ok: false, errorKey: 'courseRegistration.student.lecturersRequired' }
    }
  }

  if (form.action === 'AddDrop') {
    if (!form.dropCourseId || !form.addCourseId) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectBothCourses' }
    }
  }

  if (form.action === 'RetakeDrop') {
    if (!form.dropCourseId || !form.courseId) {
      return { ok: false, errorKey: 'courseRegistration.student.retakeDropSelectBothCourses' }
    }
    if (form.dropCourseId === form.courseId) {
      return { ok: false, errorKey: 'courseRegistration.student.retakeDropSameCourse' }
    }
  }

  if (!form.declarationAgreed) {
    return { ok: false, errorKey: 'courseRegistration.student.declarationRequired' }
  }

  return { ok: true }
}

/** 提交时写入申请单的分节字段快照 */
export function buildAddDropSectionPayload(form, snapshots = {}, feeEstimate = null) {
  const reason =
    form.action === 'Drop' || form.action === 'AddDrop' || form.action === 'RetakeDrop'
      ? String(form.dropReason || '').trim()
      : String(form.addNotes || form.dropReason || '').trim()

  return {
    contactPhone: String(form.contactPhone || '').trim(),
    addType: form.addType || '',
    addNotes: String(form.addNotes || '').trim(),
    dropReason: String(form.dropReason || '').trim(),
    previouslyTakenCourse: String(form.previouslyTakenCourse || '').trim(),
    gradeEarned: form.gradeEarned || '',
    academicSessionTaken: form.academicSessionTaken || '',
    retakeType: form.retakeType || '',
    transcriptId: form.transcriptId || '',
    eligibilitySource: form.eligibilitySource || '',
    declarationAgreed: Boolean(form.declarationAgreed),
    sectionId: form.sectionId || '',
    sectionCode: form.sectionCode || '',
    classTime: form.classTime || '',
    weekRange: form.weekRange || '',
    venue: form.venue || '',
    lecturers: form.lecturers || '',
    dropSectionCode: form.dropSectionCode || '',
    dropClassTime: form.dropClassTime || '',
    dropWeekRange: form.dropWeekRange || '',
    dropVenue: form.dropVenue || '',
    dropLecturers: form.dropLecturers || '',
    addSectionCode: form.addSectionCode || '',
    addClassTime: form.addClassTime || '',
    addWeekRange: form.addWeekRange || '',
    addVenue: form.addVenue || '',
    addLecturers: form.addLecturers || '',
    courseSnapshots: {
      add: snapshots.add || null,
      drop: snapshots.drop || null,
      retake: snapshots.retake || null,
    },
    feeEstimate: feeEstimate || form.feeEstimate || null,
    billAmount: feeEstimate?.total ?? form.feeEstimate?.total ?? 0,
    billableCredits:
      feeEstimate?.billableCredits ??
      form.feeEstimate?.billableCredits ??
      form.billableCredits ??
      0,
    excessCredits:
      feeEstimate?.billableCredits ??
      form.feeEstimate?.billableCredits ??
      form.excessCredits ??
      0,
    reason,
  }
}
