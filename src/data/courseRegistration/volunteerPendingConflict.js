/**
 * 第一轮待分配志愿之间的上课时间互撞（软提示，不挡提交/确认）
 */
import { detectScheduleConflict } from './registrationRules.js'
import { getSectionMeetings } from './sectionScheduleFields.js'

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
