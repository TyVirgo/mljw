/**
 * 加退重修申请分节表单：demo 枚举、显隐、清空与校验
 */

import { deriveClassTime, displayClassTimeVenue, getSectionMeetings } from './sectionScheduleFields.js'
import { getPreviousAcademicSession, parseIntakeBatch, VALID_INTAKE_MONTHS } from '../intakeSets.js'
import {
  isMandatoryAddDropCourse,
  sumLineCredits,
  computeNetCreditsAfterLines,
  wouldExceedAddDropElectiveTermCap,
  addDropLineKey,
} from './addDropMultiItems.js'
import { getCourseByCode, getCourseById } from './selectableCourses.js'
import {
  whitelistSectionListIncludes,
  normalizeWhitelistSectionRefs,
} from './whitelistSectionRefs.js'
import { resolveTermCreditMin } from './registrationRules.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import {
  buildBaselineSlotsFromCourseLike,
  getSectionMeetingsConflictInfo,
} from './addDropSectionConflict.js'

/**
 * 学年学期排序值（02/04/09）；无法解析返回 null
 * @param {string} academicSession
 * @returns {number|null}
 */
function academicSessionOrdinal(academicSession) {
  const parsed = parseIntakeBatch(academicSession)
  if (!parsed) return null
  const monthIndex = VALID_INTAKE_MONTHS.indexOf(parsed.month)
  if (monthIndex === -1) return null
  return parseInt(parsed.year, 10) * VALID_INTAKE_MONTHS.length + monthIndex
}

/**
 * 原上课学期是否严格早于当前申请学期（早先学期落下可自由换组）
 * @param {string} originalSession 原上课学期
 * @param {string} currentSession 当前申请学期
 * @returns {boolean}
 */
export function isOriginalSessionBeforeCurrent(originalSession, currentSession) {
  const originalOrdinal = academicSessionOrdinal(originalSession)
  const currentOrdinal = academicSessionOrdinal(currentSession)
  if (originalOrdinal == null || currentOrdinal == null) return false
  return originalOrdinal < currentOrdinal
}

/** 学生可选主类型（三选一；关联由「是否退课」推导） */
export const ADD_DROP_PRIMARY_TYPES = ['Add', 'Drop', 'Retake']

/**
 * 由三是否推导的内部 action（含加+重修组合）
 * @typedef {'Add'|'Drop'|'Retake'|'AddDrop'|'RetakeDrop'|'AddRetake'|'AddDropRetake'|''} AddDropDerivedAction
 */

export const ADD_COURSE_TYPE_OPTIONS = [
  { value: 'overload', labelKey: 'courseRegistration.student.addType.overload' },
  { value: 'timetable_clash', labelKey: 'courseRegistration.student.addType.timetableClash' },
  { value: 'prerequisite_waiver', labelKey: 'courseRegistration.student.addType.prerequisiteWaiver' },
  { value: 'other', labelKey: 'courseRegistration.student.addType.other' },
]

export const RETAKE_TYPE_OPTIONS = [
  { value: 'failed', labelKey: 'courseRegistration.student.retakeType.failed' },
  { value: 'improve_grade', labelKey: 'courseRegistration.student.retakeType.improveGrade' },
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

/**
 * 对外展示的主类型（列表/筛选）：关联单归入加课或重修
 * @param {string} action
 * @returns {'Add'|'Drop'|'Retake'|''}
 */
export function displayPrimaryType(action) {
  return primaryTypeFromAction(action)
}

/**
 * 筛选主类型是否匹配申请（含关联 / 组合单按意图）
 * @param {string} appType
 * @param {string} filterPrimary
 * @param {object|null} [app] 传入时按 need 标志或 items 判断是否含该意图
 */
export function matchesPrimaryTypeFilter(appType, filterPrimary, app = null) {
  if (!filterPrimary) return true
  if (app) {
    const flags = resolveIntentFlagsFromApp(app)
    if (filterPrimary === 'Add') return flags.needAdd === 'yes'
    if (filterPrimary === 'Drop') return flags.needDrop === 'yes'
    if (filterPrimary === 'Retake') return flags.needRetake === 'yes'
  }
  const flags = intentFlagsFromAction(appType)
  if (filterPrimary === 'Add') return flags.needAdd === 'yes'
  if (filterPrimary === 'Drop') return flags.needDrop === 'yes'
  if (filterPrimary === 'Retake') return flags.needRetake === 'yes'
  return displayPrimaryType(appType) === filterPrimary
}

/**
 * 主类型 + 是否退课 → 内部 action
 * @deprecated 学生端已改三是否；保留供旧调用。加+重修请用 deriveActionFromFlags
 * @param {'Add'|'Drop'|'Retake'|''} primaryType
 * @param {'yes'|'no'|''} needDrop
 */
export function deriveAddDropAction(primaryType, needDrop = '') {
  if (!ADD_DROP_PRIMARY_TYPES.includes(primaryType)) return ''
  if (primaryType === 'Drop') return 'Drop'
  if (primaryType === 'Add') return needDrop === 'yes' ? 'AddDrop' : 'Add'
  if (primaryType === 'Retake') return needDrop === 'yes' ? 'RetakeDrop' : 'Retake'
  return ''
}

/**
 * 三是否 → 内部 action（允许加+重修同单）
 * @param {'yes'|'no'|''} needDrop
 * @param {'yes'|'no'|''} needAdd
 * @param {'yes'|'no'|''} needRetake
 * @returns {AddDropDerivedAction}
 */
export function deriveActionFromFlags(needDrop = 'no', needAdd = 'no', needRetake = 'no') {
  const d = needDrop === 'yes'
  const a = needAdd === 'yes'
  const r = needRetake === 'yes'
  if (!d && !a && !r) return ''
  if (a && r && d) return 'AddDropRetake'
  if (a && r) return 'AddRetake'
  if (a && d) return 'AddDrop'
  if (r && d) return 'RetakeDrop'
  if (a) return 'Add'
  if (r) return 'Retake'
  if (d) return 'Drop'
  return ''
}

/**
 * action → 三是否（详情回推 / 旧单兼容）
 * @param {string} action
 * @returns {{ needDrop: 'yes'|'no', needAdd: 'yes'|'no', needRetake: 'yes'|'no' }}
 */
export function intentFlagsFromAction(action) {
  switch (String(action || '')) {
    case 'Drop':
      return { needDrop: 'yes', needAdd: 'no', needRetake: 'no' }
    case 'Add':
      return { needDrop: 'no', needAdd: 'yes', needRetake: 'no' }
    case 'Retake':
      return { needDrop: 'no', needAdd: 'no', needRetake: 'yes' }
    case 'AddDrop':
      return { needDrop: 'yes', needAdd: 'yes', needRetake: 'no' }
    case 'RetakeDrop':
      return { needDrop: 'yes', needAdd: 'no', needRetake: 'yes' }
    case 'AddRetake':
      return { needDrop: 'no', needAdd: 'yes', needRetake: 'yes' }
    case 'AddDropRetake':
      return { needDrop: 'yes', needAdd: 'yes', needRetake: 'yes' }
    default:
      return { needDrop: 'no', needAdd: 'no', needRetake: 'no' }
  }
}

/**
 * 从申请对象解析意图（优先存盘 flags，否则 items，再否则 type）
 * @param {object|null|undefined} app
 */
export function resolveIntentFlagsFromApp(app) {
  if (!app) return { needDrop: 'no', needAdd: 'no', needRetake: 'no' }
  const hasStored =
    app.needDrop === 'yes' ||
    app.needDrop === 'no' ||
    app.needAdd === 'yes' ||
    app.needAdd === 'no' ||
    app.needRetake === 'yes' ||
    app.needRetake === 'no'
  if (hasStored && (app.needAdd != null || app.needRetake != null)) {
    return {
      needDrop: app.needDrop === 'yes' ? 'yes' : 'no',
      needAdd: app.needAdd === 'yes' ? 'yes' : 'no',
      needRetake: app.needRetake === 'yes' ? 'yes' : 'no',
    }
  }
  const items = app.items || []
  if (items.length) {
    return {
      needDrop: items.some((i) => i?.action === 'Drop') ? 'yes' : 'no',
      needAdd: items.some((i) => i?.action === 'Add') ? 'yes' : 'no',
      needRetake: items.some((i) => i?.action === 'Retake') ? 'yes' : 'no',
    }
  }
  return intentFlagsFromAction(app.type || app.action)
}

/** @param {string} action */
export function primaryTypeFromAction(action) {
  if (action === 'AddDrop' || action === 'Add' || action === 'AddRetake' || action === 'AddDropRetake') {
    return 'Add'
  }
  if (action === 'RetakeDrop' || action === 'Retake') return 'Retake'
  if (action === 'Drop') return 'Drop'
  return ''
}

/** @param {string} action */
export function needDropFromAction(action) {
  if (
    action === 'AddDrop' ||
    action === 'RetakeDrop' ||
    action === 'Drop' ||
    action === 'AddDropRetake'
  ) {
    return 'yes'
  }
  if (action === 'Add' || action === 'Retake' || action === 'AddRetake') return 'no'
  return ''
}

/**
 * @param {string} action
 * @param {{ needDrop?: string, needAdd?: string, needRetake?: string, primaryType?: string }} [opts]
 */
export function getVisibleAddDropSections(action, opts = {}) {
  // 三是否优先（学生合一单）
  if (opts.needAdd != null || opts.needRetake != null) {
    return {
      showI: true,
      showII: opts.needAdd === 'yes',
      showIII: opts.needDrop === 'yes',
      showIV: opts.needRetake === 'yes',
      showV: true,
    }
  }
  const resolved =
    opts.primaryType != null
      ? deriveAddDropAction(opts.primaryType, opts.needDrop)
      : action
  if (!resolved) {
    return { showI: true, showII: false, showIII: false, showIV: false, showV: true }
  }
  const flags = intentFlagsFromAction(resolved)
  return {
    showI: true,
    showII: flags.needAdd === 'yes',
    showIII: flags.needDrop === 'yes',
    showIV: flags.needRetake === 'yes',
    showV: true,
  }
}

/**
 * 按表单可见顺序生成连续 SECTION 标题
 * （学生 → 退课 → 加课 → 重修 → 附件材料 → 声明；增量 be）
 * @param {string} action
 * @param {(key: string, params?: object) => string} t
 * @param {{ needDrop?: string, needAdd?: string, needRetake?: string }} [flags]
 * @returns {{ student: string, drop: string, add: string, retake: string, attachments: string, declaration: string }}
 */
export function buildAddDropSectionBars(action, t, flags = {}) {
  const vis = getVisibleAddDropSections(action, flags)
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
    // 整单共用，始终在声明前
    attachments: bar('courseRegistration.student.sectionLabelAttachments'),
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

/** 切换类型时清空被隐藏节业务字段，保留学年学期、类型、联系电话、主类型/是否退课 */
export function clearHiddenSectionFields(form, action) {
  const primaryType = form.primaryType || primaryTypeFromAction(action)
  const needDrop =
    form.needDrop != null && form.needDrop !== ''
      ? form.needDrop
      : needDropFromAction(action)
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
    retakeNotes: '',
    dropReason: '',
    attachmentName: '',
    attachments: [],
    previouslyTakenCourse: '',
    gradeEarned: '',
    academicSessionTaken:
      action === 'Retake' || action === 'RetakeDrop'
        ? getPreviousAcademicSession(form.academicSession)
        : '',
    previousCourseGradesText: '',
    retakeType: action === 'Retake' || action === 'RetakeDrop' ? 'failed' : '',
    transcriptId: '',
    eligibilitySource: '',
    feeEstimate: null,
    declarationAgreed: false,
    addLines: [],
    dropLines: [],
    action,
    primaryType,
    needDrop: !primaryType || primaryType === 'Drop' ? '' : needDrop,
  }
}

/**
 * 仅 needDrop 切换：隐藏退课节时清退课字段；展开时保留加/重修侧已填内容
 * @param {object} form
 * @param {'yes'|'no'|''} needDrop
 */
export function clearDropSectionIfHidden(form, needDrop) {
  if (needDrop === 'yes') return form
  return {
    ...form,
    dropCourseId: '',
    ...emptySectionFields('drop'),
    dropReason: '',
    attachmentName: '',
    attachments: [],
    dropLines: [],
  }
}

export function createEmptyAddDropSectionForm(overrides = {}) {
  const fromAction = overrides.action ? intentFlagsFromAction(overrides.action) : null
  const seedNeedDrop =
    overrides.needDrop === 'yes' || overrides.needDrop === 'no'
      ? overrides.needDrop
      : fromAction
        ? fromAction.needDrop
        : 'no'
  const seedNeedAdd =
    overrides.needAdd === 'yes' || overrides.needAdd === 'no'
      ? overrides.needAdd
      : fromAction
        ? fromAction.needAdd
        : 'no'
  const seedNeedRetake =
    overrides.needRetake === 'yes' || overrides.needRetake === 'no'
      ? overrides.needRetake
      : fromAction
        ? fromAction.needRetake
        : 'no'
  const action =
    overrides.action ||
    deriveActionFromFlags(seedNeedDrop, seedNeedAdd, seedNeedRetake)
  const next = {
    academicSession: '',
    /** @deprecated 学生端改三是否；详情仍可能带 primaryType */
    primaryType: primaryTypeFromAction(action) || '',
    needDrop: seedNeedDrop,
    needAdd: seedNeedAdd,
    needRetake: seedNeedRetake,
    action: action || '',
    courseId: '',
    dropCourseId: '',
    addCourseId: '',
    contactPhone: '',
    ...emptySectionFields(),
    ...emptySectionFields('drop'),
    ...emptySectionFields('add'),
    addType: '',
    addNotes: '',
    /** 重修补充说明（与 addNotes 独立） */
    retakeNotes: '',
    dropReason: '',
    attachmentName: '',
    attachments: [],
    previouslyTakenCourse: '',
    gradeEarned: '',
    academicSessionTaken: '',
    previousCourseGradesText: '',
    retakeType: '',
    transcriptId: '',
    eligibilitySource: '',
    feeEstimate: null,
    declarationAgreed: false,
    addLines: [],
    dropLines: [],
    /** 重修课行（与加课 addLines 分离，支持同单加+重修） */
    retakeLines: [],
    ...overrides,
  }
  if (!Array.isArray(next.addLines)) next.addLines = []
  if (!Array.isArray(next.attachments)) {
    next.attachments = next.attachmentName
      ? [{ name: next.attachmentName, size: 0 }]
      : []
  }
  next.attachmentName = next.attachments[0]?.name || ''
  if (!Array.isArray(next.dropLines)) next.dropLines = []
  if (!Array.isArray(next.retakeLines)) next.retakeLines = []
  next.needDrop = next.needDrop === 'yes' ? 'yes' : 'no'
  next.needAdd = next.needAdd === 'yes' ? 'yes' : 'no'
  next.needRetake = next.needRetake === 'yes' ? 'yes' : 'no'
  next.action = deriveActionFromFlags(next.needDrop, next.needAdd, next.needRetake)
  next.primaryType = primaryTypeFromAction(next.action) || ''
  if (next.needRetake === 'yes') {
    if (!String(next.academicSessionTaken || '').trim()) {
      next.academicSessionTaken = getPreviousAcademicSession(next.academicSession)
    }
    if (!String(next.retakeType || '').trim()) {
      next.retakeType = 'failed'
    }
  }
  return next
}

/**
 * 切换三是否：同步 action，并清空被关掉的分区行
 * @param {object} form
 * @param {{ needDrop?: string, needAdd?: string, needRetake?: string }} patch
 */
export function applyIntentFlagsPatch(form, patch = {}) {
  const needDrop =
    patch.needDrop !== undefined ? patch.needDrop : form.needDrop === 'yes' ? 'yes' : 'no'
  const needAdd =
    patch.needAdd !== undefined ? patch.needAdd : form.needAdd === 'yes' ? 'yes' : 'no'
  const needRetake =
    patch.needRetake !== undefined
      ? patch.needRetake
      : form.needRetake === 'yes'
        ? 'yes'
        : 'no'
  const action = deriveActionFromFlags(needDrop, needAdd, needRetake)
  let next = {
    ...form,
    needDrop,
    needAdd,
    needRetake,
    action,
    primaryType: primaryTypeFromAction(action) || '',
  }
  if (needDrop !== 'yes') {
    next = {
      ...next,
      dropCourseId: '',
      ...emptySectionFields('drop'),
      dropReason: '',
      attachmentName: '',
      attachments: [],
      dropLines: [],
    }
  }
  if (needAdd !== 'yes') {
    next = {
      ...next,
      addCourseId: '',
      ...emptySectionFields('add'),
      addType: '',
      addNotes: '',
      addLines: [],
    }
  }
  if (needRetake !== 'yes') {
    next = {
      ...next,
      retakeLines: [],
      retakeNotes: '',
      previouslyTakenCourse: '',
      gradeEarned: '',
      academicSessionTaken: '',
      previousCourseGradesText: '',
      retakeType: '',
      transcriptId: '',
    }
  } else {
    if (!String(next.academicSessionTaken || '').trim()) {
      next.academicSessionTaken = getPreviousAcademicSession(next.academicSession)
    }
    if (!String(next.retakeType || '').trim()) next.retakeType = 'failed'
  }
  return next
}

/**
 * 按主类型 / 是否退课同步内部 action，并在变更时清空隐藏节
 * 同主类型仅切 needDrop 时只清退课节（是→否），保留加/重修已填内容
 * @param {object} form
 * @param {{ primaryType?: string, needDrop?: string }} patch
 */
export function applyPrimaryTypePatch(form, patch = {}) {
  const prevPrimary = form.primaryType ?? primaryTypeFromAction(form.action)
  const primaryType =
    patch.primaryType !== undefined
      ? patch.primaryType
      : prevPrimary
  let needDrop = patch.needDrop !== undefined ? patch.needDrop : form.needDrop
  if (!primaryType || primaryType === 'Drop') needDrop = ''
  else if (needDrop !== 'yes' && needDrop !== 'no') needDrop = 'no'
  const action = deriveAddDropAction(primaryType, needDrop)
  const base = { ...form, primaryType, needDrop, action }
  if (action === form.action && primaryType === form.primaryType && needDrop === form.needDrop) {
    return base
  }
  const onlyNeedDropToggle =
    patch.needDrop !== undefined &&
    patch.primaryType === undefined &&
    primaryType === prevPrimary &&
    (primaryType === 'Add' || primaryType === 'Retake')
  if (onlyNeedDropToggle) {
    return clearDropSectionIfHidden(base, needDrop)
  }
  return clearHiddenSectionFields(base, action)
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
 * 课+分组比对键（加课禁同课同分组用）
 * @param {object|null|undefined} line
 * @returns {string}
 */
export function courseSectionMatchKey(line) {
  if (!line) return ''
  // 优先课号/分组码，便于退课清单与重修课库（sectionId 可能不同）对齐
  const course = String(line.courseCode || line.code || line.courseId || '')
    .trim()
    .toUpperCase()
  if (!course) return ''
  const section = String(
    line.sectionCode ||
      line.section?.code ||
      (typeof line.section === 'string' ? line.section : '') ||
      line.sectionId ||
      line.section?.id ||
      '',
  )
    .trim()
    .toUpperCase()
  return section ? `${course}::${section}` : `${course}::`
}

/**
 * 是否同课且同课程分组
 * @param {object|null|undefined} a
 * @param {object|null|undefined} b
 */
export function isSameCourseSameSection(a, b) {
  const ka = courseSectionMatchKey(a)
  const kb = courseSectionMatchKey(b)
  if (!ka || !kb) return false
  // 两边都有分组码时要求全等；任一侧缺分组则不判为同分组
  if (ka.endsWith('::') || kb.endsWith('::')) return false
  return ka === kb
}

/**
 * 加课行是否与退课行存在「同课同课程分组」
 * @deprecated 提交校验已不再因同组禁加回/重修；保留供排查或其它入口
 * @param {object[]} dropLines
 * @param {object[]} addLines
 */
export function hasSameCourseSameSectionOverlap(dropLines = [], addLines = []) {
  const dropKeys = new Set(
    (dropLines || []).map(courseSectionMatchKey).filter((k) => k && !k.endsWith('::')),
  )
  if (!dropKeys.size) return false
  return (addLines || []).some((line) => {
    const key = courseSectionMatchKey(line)
    return key && !key.endsWith('::') && dropKeys.has(key)
  })
}

function resolveLineAsCourse(line) {
  if (!line) return null
  if (line.course && (line.course.type || line.course.sourceType)) return line.course
  return (
    (line.courseId && getCourseById(line.courseId)) ||
    getCourseByCode(line.courseCode || line.code) ||
    line.course ||
    line
  )
}

function lineIsCoreMandatory(line) {
  return isMandatoryAddDropCourse(resolveLineAsCourse(line) || line)
}

/**
 * 必修换组锁：相对原分组是否禁止换到目标分组
 * 原上课学期均早于当前申请学期 → 不锁（无需白名单可换组）
 * 含当前学期原组 → 默认同组；白名单命中目标组或 allowAllSwitch 可换组
 * @param {object} addLine
 * @param {object[]} originLines 须带 sectionCode；建议带 originalAcademicSession / academicSession
 * @param {import('./whitelistSectionRefs.js').WhitelistSectionRef[]} [allowedSwitchSections]
 * @param {boolean} [allowAllSwitch] 白名单换组空清单=全部
 * @param {string} [currentAcademicSession] 当前申请学期（如 2026/09）
 */
export function isCoreOtherSectionReaddBlocked(
  addLine,
  originLines = [],
  allowedSwitchSections = [],
  allowAllSwitch = false,
  currentAcademicSession = '',
) {
  if (!addLine || !lineIsCoreMandatory(addLine)) return false
  const addCode = courseCodeMatchKey(addLine)
  const addSec = String(addLine.sectionCode || addLine.section?.code || '')
    .trim()
  if (!addCode || !addSec) return false

  const sameCourseOrigins = (originLines || []).filter(
    (d) => courseCodeMatchKey(d) === addCode && lineIsCoreMandatory(d),
  )
  if (!sameCourseOrigins.length) return false

  // 早先学期落下：原上课学期均严格早于当前申请学期 → 不施加换组锁
  const currentSession = String(currentAcademicSession || '').trim()
  if (currentSession) {
    const allOriginsFromPriorSessions = sameCourseOrigins.every((origin) => {
      const originSession = String(
        origin.originalAcademicSession || origin.academicSession || '',
      ).trim()
      return isOriginalSessionBeforeCurrent(originSession, currentSession)
    })
    if (allOriginsFromPriorSessions) return false
  }

  const sameSectionOk = sameCourseOrigins.some((d) => {
    const sec = String(d.sectionCode || d.section?.code || '').trim()
    return sec && sec === addSec
  })
  if (sameSectionOk) return false

  // 白名单「未选手动课组」：放行该生可选范围内全部换组
  if (allowAllSwitch) return false

  const allowed = normalizeWhitelistSectionRefs(allowedSwitchSections)
  if (whitelistSectionListIncludes(allowed, addCode, addSec)) return false
  return true
}

/**
 * 加课清单是否存在「同课异组」违规（无白名单时）
 * @param {object[]} originLines
 * @param {object[]} addLines
 * @param {import('./whitelistSectionRefs.js').WhitelistSectionRef[]} [allowedSwitchSections]
 * @param {boolean} [allowAllSwitch]
 * @param {string} [currentAcademicSession]
 */
export function hasCoreOtherSectionReaddViolation(
  originLines = [],
  addLines = [],
  allowedSwitchSections = [],
  allowAllSwitch = false,
  currentAcademicSession = '',
) {
  return (addLines || []).some((line) =>
    isCoreOtherSectionReaddBlocked(
      line,
      originLines,
      allowedSwitchSections,
      allowAllSwitch,
      currentAcademicSession,
    ),
  )
}

/**
 * 换组锁原组：拟退与资格种子按课号合并（同课拟退优先，其余保留种子）
 * @param {object[]} dropLines 申请内拟退课
 * @param {object[]} seedLines 资格种子 originalSectionCode 转成的原组行
 * @returns {object[]}
 */
export function mergeCoreLockOriginLines(dropLines = [], seedLines = []) {
  const result = []
  const codesFromDrops = new Set()
  for (const drop of dropLines || []) {
    if (!drop) continue
    result.push(drop)
    const code = courseCodeMatchKey(drop)
    if (code) codesFromDrops.add(code)
  }
  for (const seed of seedLines || []) {
    if (!seed) continue
    const code = courseCodeMatchKey(seed)
    // 同课已有拟退原组则不再用种子
    if (code && codesFromDrops.has(code)) continue
    result.push(seed)
  }
  return result
}

/**
 * 拟退行 ↔ 加课/重修行是否时段冲突（依赖腾出时段）
 * @param {object} dropLine
 * @param {object} otherLine
 * @returns {boolean}
 */
function dropLineConflictsWithOtherLine(dropLine, otherLine) {
  const dropSlots = buildBaselineSlotsFromCourseLike(dropLine)
  if (!dropSlots.length) return false
  // 优先按对方行展开 slots；再回退 meetings 检测
  const otherSlots = buildBaselineSlotsFromCourseLike(otherLine)
  if (otherSlots.length) {
    return otherSlots.some((slot) =>
      Boolean(getSectionMeetingsConflictInfo({ time: slot.time }, dropSlots).conflict),
    )
  }
  const section = {
    time: otherLine?.time || otherLine?.classTime || '',
    meetings: otherLine?.meetings || null,
    weekRange: otherLine?.weekRange || '',
    room: otherLine?.venue || otherLine?.room || '',
  }
  return Boolean(getSectionMeetingsConflictInfo(section, dropSlots).conflict)
}

/**
 * 将加课/重修行收成 tooltip 阻塞项
 * @param {'add'|'retake'} kind
 * @param {object} line
 */
function toDropRemoveBlocker(kind, line) {
  return {
    kind,
    courseCode: String(line?.courseCode || line?.code || '').trim(),
    courseName: String(line?.courseName || line?.name || '').trim(),
  }
}

/**
 * 拟退「移除」是否被加课/重修依赖拦住（时段冲突或学分超限）
 * 随表单勾选实时调用；blocked 时须先移 tip 中的加课/重修再移本拟退
 * @param {object} dropLine 拟移除的拟退行
 * @param {{
 *   dropLines?: object[],
 *   addLines?: object[],
 *   retakeLines?: object[],
 *   currentCredits?: number,
 *   creditMax?: number,
 *   bypassCreditMax?: boolean,
 *   termCreditStripBaseline?: object|null,
 *   electiveCatchUpCredits?: { ge?: number, me?: number }|null,
 * }} [opts]
 * @returns {{ blocked: boolean, blockers: { kind: 'add'|'retake', courseCode: string, courseName: string }[] }}
 */
export function getDropLineRemoveBlockInfo(dropLine, opts = {}) {
  const blockers = []
  const seen = new Set()
  /** @param {{ kind: string, courseCode: string, courseName: string }} item */
  function pushBlocker(item) {
    if (!item?.courseCode) return
    const key = `${item.kind}:${item.courseCode}`
    if (seen.has(key)) return
    seen.add(key)
    blockers.push(item)
  }

  const addLines = opts.addLines || []
  const retakeLines = opts.retakeLines || []
  const dropLines = opts.dropLines || []
  const dropKey = addDropLineKey(dropLine)

  // 1) 时段：加课/重修占用本拟退腾出的时间
  for (const line of addLines) {
    if (dropLineConflictsWithOtherLine(dropLine, line)) {
      pushBlocker(toDropRemoveBlocker('add', line))
    }
  }
  for (const line of retakeLines) {
    if (dropLineConflictsWithOtherLine(dropLine, line)) {
      pushBlocker(toDropRemoveBlocker('retake', line))
    }
  }

  // 2) 学期总学分：去掉本拟退后净学分超上限
  const creditMax = Number(opts.creditMax)
  const bypass = Boolean(opts.bypassCreditMax)
  if (!bypass && Number.isFinite(creditMax) && creditMax > 0) {
    const remainingDrops = (dropLines || []).filter(
      (line) => addDropLineKey(line) !== dropKey,
    )
    const creditAddLines = [...addLines, ...retakeLines]
    const netWithout = computeNetCreditsAfterLines(
      opts.currentCredits,
      remainingDrops,
      creditAddLines,
    )
    if (netWithout > creditMax && creditAddLines.length) {
      for (const line of addLines) pushBlocker(toDropRemoveBlocker('add', line))
      for (const line of retakeLines) pushBlocker(toDropRemoveBlocker('retake', line))
    }
  }

  // 3) GE/ME 学期合计帽：去掉本拟退后超限
  const baseline = opts.termCreditStripBaseline
  const catchUp = opts.electiveCatchUpCredits || {}
  if (baseline) {
    const remainingDrops = (dropLines || []).filter(
      (line) => addDropLineKey(line) !== dropKey,
    )
    const creditAddLines = [...addLines, ...retakeLines]
    for (const kind of ['GE', 'ME']) {
      const deficit = kind === 'GE' ? Number(catchUp.ge) || 0 : Number(catchUp.me) || 0
      if (
        wouldExceedAddDropElectiveTermCap(baseline, {
          dropCourses: remainingDrops,
          addCourses: creditAddLines,
          kind,
          deficit,
        })
      ) {
        for (const line of creditAddLines) {
          const lineKindType = normalizeRegistrationType(line?.type || line?.course?.type)
          if (lineKindType !== kind) continue
          const lineKind = addLines.some(
            (addLine) => addDropLineKey(addLine) === addDropLineKey(line),
          )
            ? 'add'
            : 'retake'
          pushBlocker(toDropRemoveBlocker(lineKind, line))
        }
      }
    }
  }

  return { blocked: blockers.length > 0, blockers }
}

/**
 * 课号比对键（重修含退课禁同课号）
 * @param {object|null|undefined} line
 * @returns {string}
 */
export function courseCodeMatchKey(line) {
  if (!line) return ''
  return String(line.courseCode || line.code || '')
    .trim()
    .toUpperCase()
}

/**
 * 拟退与拟重修/拟加是否存在相同课号
 * @param {object[]} dropLines
 * @param {object[]} otherLines
 */
export function hasSameCourseCodeOverlap(dropLines = [], otherLines = []) {
  const dropCodes = new Set((dropLines || []).map(courseCodeMatchKey).filter(Boolean))
  if (!dropCodes.size) return false
  return (otherLines || []).some((line) => {
    const code = courseCodeMatchKey(line)
    return code && dropCodes.has(code)
  })
}

/**
 * @param {object} form
 * @returns {{ ok: true } | { ok: false, errorKey: string }}
 */
export function validateAddDropSectionForm(form) {
  if (!form.academicSession) {
    return { ok: false, errorKey: 'courseRegistration.student.academicSessionRequired' }
  }
  const needDrop = form.needDrop === 'yes' ? 'yes' : 'no'
  const needAdd = form.needAdd === 'yes' ? 'yes' : 'no'
  const needRetake = form.needRetake === 'yes' ? 'yes' : 'no'
  const action =
    deriveActionFromFlags(needDrop, needAdd, needRetake) ||
    form.action ||
    deriveAddDropAction(form.primaryType || primaryTypeFromAction(form.action), form.needDrop)
  if (!action) {
    return { ok: false, errorKey: 'courseRegistration.student.intentFlagsRequired' }
  }
  if (!String(form.contactPhone || '').trim()) {
    return { ok: false, errorKey: 'courseRegistration.student.contactPhoneRequired' }
  }

  const { showII, showIII, showIV } = getVisibleAddDropSections(action, {
    needDrop,
    needAdd,
    needRetake,
  })
  const addLines = Array.isArray(form.addLines) ? form.addLines : []
  const dropLines = Array.isArray(form.dropLines) ? form.dropLines : []
  // 旧单重修写在 addLines：无 retakeLines 时回退
  const retakeLines = Array.isArray(form.retakeLines)
    ? form.retakeLines
    : showIV && !showII
      ? addLines
      : []

  function lineHasSection(line) {
    return Boolean(line?.sectionId || line?.sectionCode)
  }

  if (showII) {
    if (!addLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectCourse' }
    }
    if (!addLines.every(lineHasSection)) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionRequired' }
    }
  }

  if (showIII) {
    if (!dropLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectCourse' }
    }
    if (!dropLines.every(lineHasSection)) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionRequired' }
    }
    // 补充说明（原退课原因）改为非必填，不再校验 dropReason
  }

  if (showIV) {
    if (!retakeLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectCourse' }
    }
    if (!form.retakeType) {
      return { ok: false, errorKey: 'courseRegistration.student.retakeTypeRequired' }
    }
    if (!retakeLines.every(lineHasSection)) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionRequired' }
    }
  }

  const switchSections = normalizeWhitelistSectionRefs(form.coreSectionSwitchSections || [])
  // 换组锁原组：优先显式合并结果，否则拟退 ∪ 资格种子
  const originForCoreLock = Array.isArray(form.coreLockOriginLines)
    ? form.coreLockOriginLines
    : mergeCoreLockOriginLines(dropLines, form.eligibleCoreOriginLines || [])

  // 仅退课：默认不得低于学期最低；白名单可设地板分 X（0–11），净学分须 ≥ X
  if (action === 'Drop') {
    const termMin = resolveTermCreditMin(form.academicSession)
    const floor =
      form.allowDropBelowCreditMin === true
        ? Math.min(
            11,
            Math.max(
              0,
              Math.floor(
                Number(
                  form.dropBelowCreditMinFloor != null
                    ? form.dropBelowCreditMinFloor
                    : 0,
                ) || 0,
              ),
            ),
          )
        : termMin
    const current = Number(form.currentCredits)
    const enrolled = Number.isFinite(current) ? current : 0
    const net = enrolled - sumLineCredits(dropLines)
    if (net < floor) {
      return {
        ok: false,
        errorKey: 'courseRegistration.student.dropBelowCreditMin',
        errorParams: { min: floor, net },
      }
    }
  }

  if (showII) {
    // 含加课：相对资格种子原组拦截异组（重修行不走此校验）；空清单 allow-all 时不拦
    // 早先学期原组不锁；当前学期原组默认同组
    if (
      hasCoreOtherSectionReaddViolation(
        originForCoreLock,
        addLines,
        switchSections,
        Boolean(form.coreSectionSwitchAllowAll),
        String(form.academicSession || '').trim(),
      )
    ) {
      return { ok: false, errorKey: 'courseRegistration.student.coreMustSameSectionReadd' }
    }
  }

  if (action === 'AddDrop' || action === 'AddDropRetake') {
    if (!addLines.length || !dropLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectBothCourses' }
    }
    // 同「课程分组」加回允许；必修异组仍由上方换组锁 + 白名单约束
  }

  if (action === 'RetakeDrop' || action === 'AddDropRetake') {
    if ((!retakeLines.length && action === 'RetakeDrop') || !dropLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.retakeDropSelectBothCourses' }
    }
    // 产品：退课后允许重修同一门课相同分组；不再做同课同组拦截
    // 重修允许换组，不校验 core 同组锁
  }

  if (!form.declarationAgreed) {
    return { ok: false, errorKey: 'courseRegistration.student.declarationRequired' }
  }

  return { ok: true }
}

/**
 * 提交时写入申请单的分节字段快照
 * @param {object} form
 * @param {object} [snapshots]
 * @param {object|null} [feeEstimate]
 * @param {{ termCreditExcess?: number, termCreditStrip?: object|null, termCreditStripBaseline?: object|null, applicationCredits?: object|null }} [opts]
 */
export function buildAddDropSectionPayload(form, snapshots = {}, feeEstimate = null, opts = {}) {
  const reason =
    form.action === 'Drop' || form.action === 'AddDrop' || form.action === 'RetakeDrop'
      ? String(form.dropReason || '').trim()
      : String(form.addNotes || form.dropReason || '').trim()

  const billableCredits =
    feeEstimate?.billableCredits ??
    form.feeEstimate?.billableCredits ??
    form.billableCredits ??
    0
  const termCreditExcess = Math.max(
    0,
    Number.isFinite(Number(opts.termCreditExcess))
      ? Number(opts.termCreditExcess)
      : Number(form.termCreditExcess) || 0,
  )
  /** 列表综合列：学期超出与毕业计费超出取较大值 */
  const excessCredits = Math.max(
    0,
    termCreditExcess,
    Number(billableCredits) || 0,
    Number(form.excessCredits) || 0,
  )

  return {
    contactPhone: String(form.contactPhone || '').trim(),
    primaryType: form.primaryType || displayPrimaryType(form.action) || '',
    needDrop:
      form.needDrop === 'yes' || form.needDrop === 'no'
        ? form.needDrop
        : needDropFromAction(form.action),
    needAdd: form.needAdd === 'yes' || form.needAdd === 'no' ? form.needAdd : 'no',
    needRetake:
      form.needRetake === 'yes' || form.needRetake === 'no' ? form.needRetake : 'no',
    addType: form.addType || '',
    addNotes: String(form.addNotes || '').trim(),
    /** 重修补充说明；与加课说明分存 */
    retakeNotes: String(form.retakeNotes || '').trim(),
    dropReason: String(form.dropReason || '').trim(),
    previouslyTakenCourse: String(form.previouslyTakenCourse || '').trim(),
    gradeEarned: form.gradeEarned || '',
    academicSessionTaken: form.academicSessionTaken || '',
    previousCourseGradesText: String(form.previousCourseGradesText || '').trim(),
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
    sstAmount: feeEstimate?.sstAmount ?? form.feeEstimate?.sstAmount ?? form.sstAmount ?? 0,
    billAmount:
      feeEstimate?.payableTotal ??
      form.feeEstimate?.payableTotal ??
      (Number(feeEstimate?.total || form.feeEstimate?.total || 0) +
        Number(feeEstimate?.sstAmount || form.feeEstimate?.sstAmount || 0)),
    billableCredits,
    termCreditExcess,
    excessCredits,
    termCreditStrip: opts.termCreditStrip ?? null,
    termCreditStripBaseline: opts.termCreditStripBaseline ?? null,
    applicationCredits: opts.applicationCredits ?? null,
    reason,
  }
}
