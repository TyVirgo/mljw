/**
 * 加退重修申请分节表单：demo 枚举、显隐、清空与校验
 */

import { deriveClassTime, displayClassTimeVenue, getSectionMeetings } from './sectionScheduleFields.js'
import { getPreviousAcademicSession } from '../intakeSets.js'
import { isMandatoryAddDropCourse, sumLineCredits } from './addDropMultiItems.js'
import { getCourseByCode, getCourseById } from './selectableCourses.js'
import {
  whitelistSectionListIncludes,
  normalizeWhitelistSectionRefs,
} from './whitelistSectionRefs.js'
import { resolveTermCreditMin } from './registrationRules.js'

/** 学生可选主类型（三选一；关联由「是否退课」推导） */
export const ADD_DROP_PRIMARY_TYPES = ['Add', 'Drop', 'Retake']

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
 * 筛选主类型是否匹配申请（含关联）
 * @param {string} appType
 * @param {string} filterPrimary
 */
export function matchesPrimaryTypeFilter(appType, filterPrimary) {
  if (!filterPrimary) return true
  return displayPrimaryType(appType) === filterPrimary
}

/**
 * 主类型 + 是否退课 → 内部 action（禁止加+重修）
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

/** @param {string} action */
export function primaryTypeFromAction(action) {
  if (action === 'AddDrop' || action === 'Add') return 'Add'
  if (action === 'RetakeDrop' || action === 'Retake') return 'Retake'
  if (action === 'Drop') return 'Drop'
  return ''
}

/** @param {string} action */
export function needDropFromAction(action) {
  if (action === 'AddDrop' || action === 'RetakeDrop' || action === 'Drop') return 'yes'
  if (action === 'Add' || action === 'Retake') return 'no'
  return ''
}

/**
 * @param {string} action
 * @param {{ needDrop?: string, primaryType?: string }} [opts]
 */
export function getVisibleAddDropSections(action, opts = {}) {
  const resolved =
    opts.primaryType != null
      ? deriveAddDropAction(opts.primaryType, opts.needDrop)
      : action
  if (!resolved) {
    return { showI: true, showII: false, showIII: false, showIV: false, showV: true }
  }
  const showII = resolved === 'Add' || resolved === 'AddDrop'
  const showIII = resolved === 'Drop' || resolved === 'AddDrop' || resolved === 'RetakeDrop'
  const showIV = resolved === 'Retake' || resolved === 'RetakeDrop'
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
  const hasPrimaryOverride = Object.prototype.hasOwnProperty.call(overrides, 'primaryType')
  const seedPrimary = hasPrimaryOverride
    ? overrides.primaryType || ''
    : overrides.action
      ? primaryTypeFromAction(overrides.action)
      : ''
  const seedNeedDrop =
    overrides.needDrop != null
      ? overrides.needDrop
      : overrides.action
        ? needDropFromAction(overrides.action)
        : seedPrimary === 'Add' || seedPrimary === 'Retake'
          ? 'no'
          : ''
  const action =
    overrides.action && !hasPrimaryOverride
      ? overrides.action
      : deriveAddDropAction(seedPrimary, seedNeedDrop)
  const next = {
    academicSession: '',
    primaryType: seedPrimary,
    needDrop: seedPrimary === 'Drop' || !seedPrimary ? '' : seedNeedDrop || 'no',
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
  if (hasPrimaryOverride) {
    next.primaryType = overrides.primaryType || ''
  } else if (!next.primaryType) {
    next.primaryType = primaryTypeFromAction(next.action)
  }
  if (!next.primaryType || next.primaryType === 'Drop') {
    next.needDrop = ''
  } else if (next.needDrop !== 'yes' && next.needDrop !== 'no') {
    next.needDrop = 'no'
  }
  next.action = deriveAddDropAction(next.primaryType, next.needDrop)
  if (next.action === 'Retake' || next.action === 'RetakeDrop') {
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
 * 加课行是否与退课行存在「同课同分组」
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
 * 本学期必修：相对原分组（退课/在读）是否禁止换到目标分组
 * 默认只许同组；白名单命中目标课+组时可换组
 * @param {object} addLine
 * @param {object[]} originLines
 * @param {import('./whitelistSectionRefs.js').WhitelistSectionRef[]} [allowedSwitchSections]
 */
export function isCoreOtherSectionReaddBlocked(
  addLine,
  originLines = [],
  allowedSwitchSections = [],
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

  const sameSectionOk = sameCourseOrigins.some((d) => {
    const sec = String(d.sectionCode || d.section?.code || '').trim()
    return sec && sec === addSec
  })
  if (sameSectionOk) return false

  const allowed = normalizeWhitelistSectionRefs(allowedSwitchSections)
  if (whitelistSectionListIncludes(allowed, addCode, addSec)) return false
  return true
}

/**
 * 加课清单是否存在「同课异组」违规（无白名单时）
 * @param {object[]} originLines
 * @param {object[]} addLines
 * @param {import('./whitelistSectionRefs.js').WhitelistSectionRef[]} [allowedSwitchSections]
 */
export function hasCoreOtherSectionReaddViolation(
  originLines = [],
  addLines = [],
  allowedSwitchSections = [],
) {
  return (addLines || []).some((line) =>
    isCoreOtherSectionReaddBlocked(line, originLines, allowedSwitchSections),
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
  const primaryType = form.primaryType || primaryTypeFromAction(form.action)
  if (!ADD_DROP_PRIMARY_TYPES.includes(primaryType)) {
    return { ok: false, errorKey: 'courseRegistration.student.applicationTypeRequired' }
  }
  if (primaryType === 'Add' || primaryType === 'Retake') {
    if (form.needDrop !== 'yes' && form.needDrop !== 'no') {
      return { ok: false, errorKey: 'courseRegistration.student.needDropRequired' }
    }
  }
  const action = deriveAddDropAction(primaryType, form.needDrop)
  if (!action) {
    return { ok: false, errorKey: 'courseRegistration.student.applicationTypeRequired' }
  }
  if (!String(form.contactPhone || '').trim()) {
    return { ok: false, errorKey: 'courseRegistration.student.contactPhoneRequired' }
  }

  const { showII, showIII, showIV } = getVisibleAddDropSections(action)
  const addLines = Array.isArray(form.addLines) ? form.addLines : []
  const dropLines = Array.isArray(form.dropLines) ? form.dropLines : []

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
    if (!String(form.dropReason || '').trim()) {
      return { ok: false, errorKey: 'courseRegistration.student.dropReasonRequired' }
    }
  }

  if (showIV) {
    if (!addLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectCourse' }
    }
    if (!form.retakeType) {
      return { ok: false, errorKey: 'courseRegistration.student.retakeTypeRequired' }
    }
    if (!addLines.every(lineHasSection)) {
      return { ok: false, errorKey: 'courseRegistration.student.sectionRequired' }
    }
  }

  const switchSections = normalizeWhitelistSectionRefs(form.coreSectionSwitchSections || [])
  // 换组锁原组：优先显式合并结果，否则拟退 ∪ 资格种子
  const originForCoreLock = Array.isArray(form.coreLockOriginLines)
    ? form.coreLockOriginLines
    : mergeCoreLockOriginLines(dropLines, form.eligibleCoreOriginLines || [])

  // 仅退课：默认不得低于学期最低学分；白名单 allowDropBelowCreditMin 可放行
  if (action === 'Drop' && !form.allowDropBelowCreditMin) {
    const min = resolveTermCreditMin(form.academicSession)
    const current = Number(form.currentCredits)
    const enrolled = Number.isFinite(current) ? current : 0
    const net = enrolled - sumLineCredits(dropLines)
    if (net < min) {
      return {
        ok: false,
        errorKey: 'courseRegistration.student.dropBelowCreditMin',
        errorParams: { min, net },
      }
    }
  }

  if (action === 'Add') {
    // 纯加课：相对资格种子原组拦截异组（与弹窗一致）
    if (hasCoreOtherSectionReaddViolation(originForCoreLock, addLines, switchSections)) {
      return { ok: false, errorKey: 'courseRegistration.student.coreMustSameSectionReadd' }
    }
  }

  if (action === 'AddDrop') {
    if (!addLines.length || !dropLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.addDropSelectBothCourses' }
    }
    // 本学期必修：拟退 ∪ 种子合并后校验；白名单可放行异组（重修不校验）
    if (hasCoreOtherSectionReaddViolation(originForCoreLock, addLines, switchSections)) {
      return { ok: false, errorKey: 'courseRegistration.student.coreMustSameSectionReadd' }
    }
  }

  if (action === 'RetakeDrop') {
    if (!addLines.length || !dropLines.length) {
      return { ok: false, errorKey: 'courseRegistration.student.retakeDropSelectBothCourses' }
    }
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
    addType: form.addType || '',
    addNotes: String(form.addNotes || '').trim(),
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
