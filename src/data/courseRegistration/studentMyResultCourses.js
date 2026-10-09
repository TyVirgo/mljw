/**
 * 我的选课：全部 / 选修 / 必修 / 申请 / 管理员 分层数据源
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

function findCatalogByCode(code) {
  const key = String(code || '').toUpperCase()
  if (!key) return null
  return selectableCourses.value.find((c) => String(c.code || '').toUpperCase() === key) || null
}

/** @typedef {'all'|'elective'|'required'|'application'|'admin'} MyResultTypeKey */

export const MY_RESULT_TYPE_TABS = [
  'all',
  'elective',
  'required',
  'application',
  'admin',
]

const TYPE_PRIORITY = {
  required: 0,
  elective: 1,
  admin: 2,
  application: 3,
}

function courseDedupeKey(item) {
  const code = String(item?.courseCode || item?.code || '')
  const section = String(item?.sectionCode || item?.section || item?.sectionId || '')
  if (code && section) return `${code}::${section}`
  if (code) return `code:${code}`
  return String(item?.courseId || item?.id || '')
}

/**
 * @param {object} item
 * @returns {Exclude<MyResultTypeKey,'all'>|''}
 */
export function classifyMyResultCourse(item) {
  if (!item) return ''
  const source = String(item.sourceType || '')
    .trim()
    .toLowerCase()
  if (source === 'required' || source === 'programme') return 'required'
  if (source === 'admin') return 'admin'
  if (source === 'application' || source === 'adddrop' || source === 'add_drop') return 'application'
  if (source === 'round' || source === 'preselect' || !source) return 'elective'
  return 'elective'
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
        resultType: 'application',
      })
    }
  }
  return out
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
    const kind = classifyMyResultCourse(item)
    if (kind === 'application') {
      fromConfirmed.push(tagResultType(item, 'application'))
      continue
    }
    if (kind === 'admin') {
      fromConfirmed.push(tagResultType(item, 'admin'))
      continue
    }
    if (kind === 'required') {
      fromConfirmed.push(tagResultType(item, 'required'))
      continue
    }
    fromConfirmed.push(tagResultType(item, 'elective'))
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
 * 同课号去重（优先级：必修 > 选修 > 管理员 > 申请）；list 与课表共用
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
  const filtered =
    !typeKey || typeKey === 'all' ? all : all.filter((item) => item.resultType === typeKey)
  return dedupeMyResultCoursesByCode(filtered)
}

function hasScheduleTime(item) {
  if (Array.isArray(item?.meetings) && item.meetings.some((m) => m?.time)) return true
  return Boolean(String(item?.time || item?.classTime || '').trim())
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
 * 我的选课课表：按 resultType 着色；不按批次类型裁剪；不注入本轮志愿虚线
 * 同课号去重（优先级：必修 > 选修 > 管理员 > 申请）；课名按 locale hydrate
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
    const layer =
      item.resultType === 'required'
        ? 'required'
        : item.resultType === 'application'
          ? 'application'
          : item.resultType === 'admin'
            ? 'admin'
            : 'elective'
    // 仅同步课名；时段保留结果项，避免 catalog 分组覆盖演示排课
    slots.push(
      ...coursesToScheduleSlots(
        [
          {
            ...item,
            courseName: hydrated.courseName,
            courseNameEn: hydrated.courseNameEn,
            resultType: item.resultType,
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
