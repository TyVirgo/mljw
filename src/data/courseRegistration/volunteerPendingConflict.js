/**
 * 第一轮待分配志愿：上课时间互撞 + 同课多教学分组（软提示，不挡提交/确认）
 * 另：相对必修的硬冲突扫描（挡确认志愿顺序）
 */
import { detectScheduleConflict } from './registrationRules.js'
import { getSectionMeetings } from './sectionScheduleFields.js'
import {
  buildScheduleBaselineFromEnrolled,
  getSectionMeetingsConflictInfo,
} from './addDropSectionConflict.js'

/**
 * @param {string} time
 * @returns {{ day: string, start: number, end: number }|null}
 */
function parseVolunteerTimeSlot(time) {
  const match = String(time || '').match(/^(\w+)\s+(\d+):(\d+)[–-](\d+):(\d+)/)
  if (!match) return null
  return { day: match[1], start: Number(match[2]), end: Number(match[4]) }
}

/**
 * @param {object} row
 * @returns {{ day: string, start: number, end: number }[]}
 */
function volunteerTimeSlots(row) {
  const meetings = getSectionMeetings(row)
  const times = meetings.length
    ? meetings.map((m) => m.time)
    : [row?.classTime || row?.time].filter(Boolean)
  return times.map((time) => parseVolunteerTimeSlot(time)).filter(Boolean)
}

/**
 * @param {object} a
 * @param {object} b
 */
export function volunteerRowsTimeConflict(a, b) {
  if (!a || !b) return false
  const slotsA = volunteerTimeSlots(a)
  const slotsB = volunteerTimeSlots(b)
  for (const slotA of slotsA) {
    if (detectScheduleConflict(slotA, slotsB)) return true
  }
  return false
}

function rowCourseKey(row) {
  return String(row?.courseId || row?.courseCode || '').trim()
}

function rowSectionKey(row) {
  return String(row?.sectionId || row?.id || row?.sectionCode || '').trim()
}

/**
 * 待分配行互撞分组（连通分量）
 * @param {object[]} rows
 * @returns {{ groups: Array<{ courseIds: string[], codes: string[] }>, byCourseId: Record<string, string[]> }}
 */
export function listPendingVolunteerTimeConflicts(rows = []) {
  const list = (rows || []).filter((row) => row && (row.courseId || row.courseCode))
  const n = list.length
  const parent = list.map((_, i) => i)
  const find = (i) => {
    let x = i
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  const union = (i, j) => {
    const a = find(i)
    const b = find(j)
    if (a !== b) parent[a] = b
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (volunteerRowsTimeConflict(list[i], list[j])) union(i, j)
    }
  }
  const buckets = new Map()
  for (let i = 0; i < n; i += 1) {
    const root = find(i)
    if (!buckets.has(root)) buckets.set(root, [])
    buckets.get(root).push(list[i])
  }
  const groups = []
  const byCourseId = {}
  for (const members of buckets.values()) {
    if (members.length < 2) continue
    const codes = members.map((m) => m.courseCode || m.code || m.courseId)
    const courseIds = members.map((m) => m.courseId).filter(Boolean)
    groups.push({ courseIds, codes })
    for (const member of members) {
      const self = member.courseCode || member.code || member.courseId
      byCourseId[member.courseId] = codes.filter((code) => code !== self)
    }
  }
  return { groups, byCourseId }
}

/**
 * 同一课程下提交了 ≥2 个不同教学分组志愿
 * @param {object[]} rows
 * @returns {{ multiCourseKeys: Set<string>, byCourseKey: Record<string, boolean> }}
 */
export function listPendingVolunteerMultiSections(rows = []) {
  /** @type {Map<string, Set<string>>} */
  const sectionsByCourse = new Map()
  for (const row of rows || []) {
    const courseKey = rowCourseKey(row)
    const sectionKey = rowSectionKey(row)
    if (!courseKey || !sectionKey) continue
    if (!sectionsByCourse.has(courseKey)) sectionsByCourse.set(courseKey, new Set())
    sectionsByCourse.get(courseKey).add(sectionKey)
  }
  const multiCourseKeys = new Set()
  const byCourseKey = {}
  for (const [courseKey, sections] of sectionsByCourse) {
    if (sections.size >= 2) {
      multiCourseKeys.add(courseKey)
      byCourseKey[courseKey] = true
    }
  }
  return { multiCourseKeys, byCourseKey }
}

/**
 * 行是否属于同课多分组志愿
 * @param {object} row
 * @param {{ byCourseKey?: Record<string, boolean> }} multi
 */
export function volunteerRowHasMultiSection(row, multi) {
  if (!row || !multi?.byCourseKey) return false
  return Boolean(multi.byCourseKey[rowCourseKey(row)])
}

/**
 * R1 待分配相对必修（硬基线）：任一门撞必修则不可确认志愿顺序
 * @param {object[]} rows
 * @param {object[]} required
 * @returns {{ ok: boolean, conflict?: boolean, withCourse?: string, withTime?: string, errorKey?: string, errorParams?: object, courseCode?: string }}
 */
export function getPendingVolunteersHardConflictGate(rows = [], required = []) {
  const baseline = buildScheduleBaselineFromEnrolled(
    (required || []).map((item) => ({
      ...item,
      sourceType: item.sourceType || 'required',
    })),
  )
  for (const row of rows || []) {
    const info = getSectionMeetingsConflictInfo(
      {
        time: row.time || row.classTime,
        meetings: row.meetings,
      },
      baseline,
    )
    if (info.conflict) {
      const src = String(info.withSourceType || '')
      const required = src === 'required' || src === 'programme'
      return {
        ok: false,
        conflict: true,
        withCourse: info.withCourse,
        withTime: info.withTime,
        errorKey: required
          ? 'courseRegistration.student.scheduleConflictHardRequired'
          : 'courseRegistration.student.scheduleConflictHardElective',
        errorParams: {
          course: info.withCourse || '—',
          time: info.withTime || '—',
        },
        courseCode: String(row.courseCode || row.code || ''),
      }
    }
  }
  return { ok: true }
}
