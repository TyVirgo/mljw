/**
 * 我的课程：全量 + 选修课 / 必修课（按课性二分；申请/管理员代选归入对应 Tab）
 * Tab UI：全部 | 选修 | 必修；课表消费方应固定传 all
 */

import { getCurrentStudentId } from '../mockCurrentStudent.js'
import { addDropApprovalQueue } from './addDropApprovalQueue.js'
import {
  studentConfirmedCourses,
  studentRequiredCourses,
} from './studentRegistrationStore.js'
import { getCourseById, selectableCourses } from './selectableCourses.js'
import { deriveClassTime } from './sectionScheduleFields.js'
import { coursesToScheduleSlots } from './studentSchedulePreview.js'
import { hydrateSelectedCourseDisplay } from './resolveSelectedCourseDisplay.js'
import { resolveUnifiedCourseCategoryCode } from './unifiedCourseCategory.js'

function findCatalogByCode(code) {
  const key = String(code || '').toUpperCase()
  if (!key) return null
  return selectableCourses.value.find((c) => String(c.code || '').toUpperCase() === key) || null
}

/** @typedef {'all'|'elective'|'required'} MyResultTypeKey */
/** 行上 resultType 仅 elective|required（课性）；sourceType 可保留 application/admin */

export const MY_RESULT_TYPE_TABS = ['all', 'elective', 'required']

const TYPE_PRIORITY = {
  required: 0,
  elective: 1,
}

function courseDedupeKey(item) {
  const code = String(item?.courseCode || item?.code || '')
  const section = String(item?.sectionCode || item?.section || item?.sectionId || '')
  if (code && section) return `${code}::${section}`
  if (code) return `code:${code}`
  return String(item?.courseId || item?.id || '')
}

/**
 * 按课性归入必修/选修（申请、管理员代选不再单独成类）
 * @param {object} item
 * @returns {'elective'|'required'|''}
 */
export function resolveAcademicResultType(item) {
  if (!item) return ''
  const unified = resolveUnifiedCourseCategoryCode(item)
  if (unified === 'required') return 'required'
  const source = String(item.sourceType || '')
    .trim()
    .toLowerCase()
  if (source === 'required' || source === 'programme') return 'required'
  const raw = String(item.type || '')
    .trim()
    .toUpperCase()
  if (raw === 'CORE' || raw === 'MANDATORY' || raw === 'REQUIRED') return 'required'
  return 'elective'
}

/**
 * @param {object} item
 * @returns {'elective'|'required'|''}
 * @deprecated 请用 resolveAcademicResultType；保留避免旧引用报错
 */
export function classifyMyResultCourse(item) {
  return resolveAcademicResultType(item)
}

/**
 * 已批准申请中「加课/重修」明细 → 已选行；同课号若另有已批准退课则剔除
 * @param {string} [studentId]
 */
export function listApprovedApplicationCourses(studentId) {
  const id = studentId || getCurrentStudentId() || ''
  const apps = (addDropApprovalQueue.value || []).filter(
    (app) => String(app.studentId || '') === String(id) && app.status === 'Approved',
  )
  const dropped = new Set()
  for (const app of apps) {
    for (const line of app.items || []) {
      if (String(line.action || '') === 'Drop' && line.courseCode) {
        dropped.add(String(line.courseCode))
      }
    }
  }
  const out = []
  const seen = new Set()
  for (const app of apps) {
    for (const line of app.items || []) {
      const action = String(line.action || '')
      if (action !== 'Add' && action !== 'Retake') continue
      const code = String(line.courseCode || '')
      if (!code || dropped.has(code)) continue
      const key = `${code}::${line.section || line.sectionCode || ''}`
      if (seen.has(key)) continue
      seen.add(key)
      const lib = getCourseById(line.courseId) || findCatalogByCode(code)
      const time = line.time || line.classTime || ''
      const room = line.room || line.venue || ''
      const weekRange = line.weekRange || ''
      // 只用申请明细上的单段 time，避免 enrich 演示 meetings 串入冲突时段
      out.push({
        id: `app-${app.id}-${code}-${line.section || '01'}`,
        courseId: line.courseId || lib?.id || `course-app-${code}`,
        courseCode: code,
        courseName: line.courseName || lib?.nameZh || lib?.name || code,
        courseNameEn: line.courseNameEn || lib?.nameEn || lib?.name || code,
        credits: line.credits ?? lib?.credits,
        type: line.type || lib?.type || 'GE',
        sectionId: line.sectionId || '',
        sectionCode: line.section || line.sectionCode || '01',
        time,
        classTime: line.classTime || (time ? deriveClassTime(time) : ''),
        weekRange,
        room,
        lecturer: line.lecturer || '',
        lecturerEn: line.lecturerEn || line.lecturer || '',
        meetings: time ? [{ time, room, weekRange }] : [],
        batchId: app.batchId || '',
        batchName: app.applicationNo ? `申请 ${app.applicationNo}` : '',
        academicSession: app.academicSession || '',
        selectedAt: app.submittedAt || '',
        sourceType: 'application',
        roundKey: 'addDrop',
        isRetake: action === 'Retake' || app.type === 'Retake',
        schoolElectiveCategory: line.schoolElectiveCategory || lib?.schoolElectiveCategory,
      })
    }
  }
  // 按课性打 resultType（保留 sourceType=application）
  return out.map((row) => tagResultType(row, resolveAcademicResultType(row) || 'elective'))
}

/**
 * @param {object} item
 * @param {Exclude<MyResultTypeKey,'all'>} resultType
 */
function tagResultType(item, resultType) {
  return { ...item, resultType, sourceType: item.sourceType || resultType }
}

/**
 * 当前学生全部已选课（未按类型过滤）
 * @param {string} [studentId]
 */
export function listMyResultCourses(studentId) {
  const required = (studentRequiredCourses.value || []).map((item) =>
    tagResultType(item, 'required'),
  )
  const fromConfirmed = []
  for (const item of studentConfirmedCourses.value || []) {
    if (item.intent === 'waitlist') continue
    const kind = resolveAcademicResultType(item) || 'elective'
    fromConfirmed.push(tagResultType(item, kind))
  }
  const applications = listApprovedApplicationCourses(studentId)

  const merged = [...required, ...fromConfirmed, ...applications]
  const best = new Map()
  for (const item of merged) {
    const key = courseDedupeKey(item)
    if (!key) continue
    const prev = best.get(key)
    if (!prev) {
      best.set(key, item)
      continue
    }
    const prevRank = TYPE_PRIORITY[prev.resultType] ?? 99
    const nextRank = TYPE_PRIORITY[item.resultType] ?? 99
    if (nextRank < prevRank) best.set(key, item)
  }
  return [...best.values()]
}

/**
 * 同课号去重（优先级：必修 > 选修）；list 与课表共用
 * @param {object[]} courses
 */
export function dedupeMyResultCoursesByCode(courses = []) {
  const byCode = new Map()
  for (const item of courses || []) {
    const code = String(item?.courseCode || item?.code || '')
    if (!code) continue
    const prev = byCode.get(code)
    if (!prev) {
      byCode.set(code, item)
      continue
    }
    const prevRank = TYPE_PRIORITY[prev.resultType] ?? 99
    const nextRank = TYPE_PRIORITY[item.resultType] ?? 99
    if (nextRank < prevRank) byCode.set(code, item)
  }
  return [...byCode.values()]
}

/**
 * @param {MyResultTypeKey} typeKey
 * @param {string} [studentId]
 */
export function listMyResultCoursesByType(typeKey, studentId) {
  const all = listMyResultCourses(studentId)
  let filtered = all
  // 兼容旧调用 typeKey=other：并入选修（申请/管理员已按课性归类）
  if (typeKey === 'other') {
    filtered = all.filter((item) => item.resultType === 'elective')
  } else if (typeKey && typeKey !== 'all') {
    filtered = all.filter((item) => item.resultType === typeKey)
  }
  return dedupeMyResultCoursesByCode(filtered)
}

/**
 * 是否有可画进课表的上课时段
 * @param {object} item
 */
export function hasScheduleTime(item) {
  if (Array.isArray(item?.meetings) && item.meetings.some((m) => m?.time)) return true
  return Boolean(String(item?.time || item?.classTime || '').trim())
}

/**
 * 已选但无上课时间的课（如实习）：主表有行、课表不画格
 * @param {string} [studentId]
 * @returns {object[]}
 */
export function listUntimedMyResultCourses(studentId) {
  return listMyResultCoursesByType('all', studentId).filter((item) => !hasScheduleTime(item))
}

/**
 * 课表用：有时段才进预览；必修走 required 槽，其余走 confirmed（兼容旧调用）
 * @param {object[]} courses
 */
export function splitMyResultCoursesForSchedule(courses = []) {
  const withTime = (courses || []).filter(hasScheduleTime)
  const required = withTime.filter((item) => item.resultType === 'required')
  const confirmed = withTime.filter((item) => item.resultType !== 'required')
  return { required, confirmed }
}

/**
 * 课表着色层：仅必修 / 选修（申请、管理员等归选修色，除非课性为必修）
 * @param {object|string} itemOrType
 * @returns {'required'|'elective'}
 */
export function resolveBinaryScheduleLayer(itemOrType) {
  if (itemOrType && typeof itemOrType === 'object') {
    const academic = resolveAcademicResultType(itemOrType)
    if (academic === 'required') return 'required'
    if (academic === 'elective') return 'elective'
  }
  const layer = resolveMyResultScheduleLayer(itemOrType)
  if (layer === 'required') return 'required'
  return 'elective'
}

/**
 * 我的选课课表着色层：必修 / 选修（旧 other 并入选修）
 * @param {object|string} itemOrType
 * @returns {'required'|'elective'}
 */
export function resolveMyResultScheduleLayer(itemOrType) {
  if (itemOrType && typeof itemOrType === 'object') {
    const academic = resolveAcademicResultType(itemOrType)
    if (academic === 'required' || academic === 'elective') return academic
  }
  const raw =
    typeof itemOrType === 'string' || typeof itemOrType === 'number'
      ? itemOrType
      : itemOrType?.resultType ||
        itemOrType?.layer ||
        itemOrType?.kind ||
        itemOrType?.type ||
        itemOrType?.sourceType ||
        ''
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  if (s === 'required' || s === 'mandatory' || s === 'programme') return 'required'
  // 申请/管理员等渠道不再单独着色
  return 'elective'
}

/**
 * 我的选课课表：两色（必修/选修）；不注入本轮志愿虚线
 * 同课号去重（优先级：必修 > 选修）；课名按 locale hydrate
 * @param {object[]} courses
 * @param {{ locale?: 'zh'|'en'|boolean }} [opts]
 */
export function buildMyResultSchedule(courses = [], opts = {}) {
  const locale =
    opts.locale === false || opts.locale === 'en'
      ? 'en'
      : 'zh'
  const deduped = dedupeMyResultCoursesByCode((courses || []).filter(hasScheduleTime))
  const slots = []
  for (const item of deduped) {
    const hydrated = hydrateSelectedCourseDisplay(item, {
      locale,
      preserveSchedule: true,
    })
    const layer = resolveBinaryScheduleLayer(item)
    // 仅同步课名；时段保留结果项，避免 catalog 分组覆盖演示排课
    slots.push(
      ...coursesToScheduleSlots(
        [
          {
            ...item,
            courseName: hydrated.courseName,
            courseNameEn: hydrated.courseNameEn,
            resultType: item.resultType || layer,
          },
        ],
        {
          layer,
          kind: layer,
          stroke: 'solid',
          preview: false,
        },
      ),
    )
  }
  return slots
}

/** 演示课号 → 必修|选修（无 type 时补层） */
const DEMO_COURSE_BINARY_LAYER = {
  COMP201: 'required',
  COMP101: 'required',
  MPU3183: 'required',
  MATH201: 'required',
  STAT100: 'required',
  CST201: 'elective',
  HUM201: 'elective',
  BUS201: 'elective',
  CYS201: 'elective',
  AI110: 'elective',
  COMP3192: 'elective',
}

function withInferredBinaryType(slot) {
  if (!slot || typeof slot !== 'object') return slot
  if (slot.resultType || slot.layer || slot.kind || slot.type || slot.sourceType) return slot
  const code = String(slot.course || slot.courseCode || '')
    .trim()
    .toUpperCase()
  const hinted = DEMO_COURSE_BINARY_LAYER[code]
  if (hinted) {
    return {
      ...slot,
      type: hinted === 'required' ? 'Mandatory' : 'Elective',
      layer: hinted,
    }
  }
  if (/^MPU/i.test(code)) {
    return { ...slot, type: 'Mandatory', layer: 'required' }
  }
  return slot
}

/**
 * 规范化监控/详情课表槽：补齐 layer 为必修|选修
 * @param {object[]} slots
 */
export function normalizeBinaryScheduleSlots(slots = []) {
  return (slots || []).map((slot) => {
    const enriched = withInferredBinaryType(slot)
    const layer = resolveBinaryScheduleLayer(enriched)
    return {
      ...enriched,
      layer,
      kind: layer,
      stroke: enriched.stroke || 'solid',
      preview: false,
    }
  })
}

/** 监控非当前生：按学分拼一版含必修+选修的演示课表 */
const MONITOR_DEMO_SCHEDULE_POOL = [
  { day: 'Mon', start: 10, end: 12, course: 'COMP201', type: 'Mandatory', credits: 3 },
  { day: 'Tue', start: 9, end: 11, course: 'MPU3183', type: 'Mandatory', credits: 2 },
  { day: 'Wed', start: 14, end: 16, course: 'MATH201', type: 'Mandatory', credits: 3 },
  { day: 'Thu', start: 10, end: 12, course: 'CST201', type: 'ME', credits: 3 },
  { day: 'Fri', start: 8, end: 10, course: 'HUM201', type: 'GE', credits: 2 },
  { day: 'Tue', start: 14, end: 16, course: 'BUS201', type: 'GE', credits: 3 },
  { day: 'Wed', start: 10, end: 12, course: 'CYS201', type: 'ME', credits: 3 },
  { day: 'Mon', start: 14, end: 16, course: 'AI110', type: 'GE', credits: 2 },
  { day: 'Thu', start: 14, end: 16, course: 'COMP3192', type: 'ME', credits: 3 },
  { day: 'Fri', start: 14, end: 16, course: 'STAT100', type: 'Mandatory', credits: 3 },
]

/**
 * 监控详情课表：当前生走「我的选课」全量；其余行用 row.schedule 或按学分拼演示全量
 * @param {object|null} row
 * @param {{ locale?: 'zh'|'en'|boolean }} [opts]
 */
export function buildMonitorDetailSchedule(row, opts = {}) {
  if (!row) return []
  const studentId = String(row.studentId || '')
  const currentId = String(getCurrentStudentId() || '')
  if (studentId && currentId && studentId === currentId) {
    const live = listMyResultCourses(studentId)
    if (live.some(hasScheduleTime)) {
      return buildMyResultSchedule(live, opts)
    }
  }
  const raw = Array.isArray(row.schedule) ? row.schedule : []
  if (raw.length >= 4) {
    return normalizeBinaryScheduleSlots(raw)
  }
  const targetCredits = Number(row.credits) || 0
  if (targetCredits <= 0 && !raw.length) return []
  const picked = []
  let sum = 0
  for (const slot of MONITOR_DEMO_SCHEDULE_POOL) {
    if (targetCredits > 0 && sum >= targetCredits && picked.length >= 4) break
    picked.push(slot)
    sum += Number(slot.credits) || 0
  }
  if (!picked.length && raw.length) {
    return normalizeBinaryScheduleSlots(raw)
  }
  return normalizeBinaryScheduleSlots(picked.length ? picked : raw)
}
