/**
 * 加退选组：课表冲突检测
 */

import { detectScheduleConflict } from './registrationRules.js'
import { parseTimeToScheduleSlot } from './studentSchedulePreview.js'
import { getSectionMeetings } from './sectionScheduleFields.js'

/**
 * @param {string} time
 * @returns {{ day: string, start: number, end: number }|null}
 */
export function parseSectionTimeToConflictSlot(time) {
  const slot = parseTimeToScheduleSlot(time, {})
  if (!slot) return null
  return { day: slot.day, start: slot.start, end: slot.end }
}

/**
 * 从已选课构建冲突基线（可排除拟退课号；展开 meetings）
 * @param {object[]} enrolled
 * @param {string[]} [pendingDropCodes]
 */
/**
 * 拟退键是否命中课号/课 id（大小写不敏感）
 * @param {Set<string>} dropSet
 * @param {unknown} value
 */
function dropSetHas(dropSet, value) {
  const s = String(value || '').trim()
  if (!s) return false
  return dropSet.has(s) || dropSet.has(s.toUpperCase())
}

/**
 * 单门课/行 → 冲突基线 slots（分组 meetings 展开）
 * @param {object} item 已选课或表单行（含 time/meetings/section）
 * @returns {object[]}
 */
export function buildBaselineSlotsFromCourseLike(item) {
  if (!item) return []
  const code = item.courseCode || item.code || item.course || ''
  const section = item.section || null
  const source = section || item
  const meetings = getSectionMeetings(source)
  const times = meetings.length
    ? meetings
    : item.time || item.classTime
      ? [{ time: item.time || item.classTime, room: item.room, weekRange: item.weekRange }]
      : []
  const slots = []
  for (const meeting of times) {
    const slot = parseTimeToScheduleSlot(meeting.time, {
      ...item,
      time: meeting.time,
      room: meeting.room,
    })
    if (slot) {
      slots.push({
        day: slot.day,
        start: slot.start,
        end: slot.end,
        course: code,
        label: slot.label,
        time: meeting.time,
        sourceType: item.sourceType || '',
      })
    }
  }
  return slots
}

export function buildScheduleBaselineFromEnrolled(enrolled = [], pendingDropCodes = []) {
  const dropSet = new Set()
  for (const raw of pendingDropCodes || []) {
    const s = String(raw || '').trim()
    if (!s) continue
    dropSet.add(s)
    dropSet.add(s.toUpperCase())
  }
  const slots = []
  for (const item of enrolled) {
    const code = item.courseCode || item.code
    const id = item.courseId || item.id
    if (dropSetHas(dropSet, code) || dropSetHas(dropSet, id)) continue
    slots.push(...buildBaselineSlotsFromCourseLike(item))
  }
  return slots
}

/**
 * @param {string} sectionTime
 * @param {object[]} baselineSlots
 * @returns {{ conflict: boolean, withCourse?: string, withTime?: string, withSourceType?: string }}
 */
export function getSectionConflictInfo(sectionTime, baselineSlots = []) {
  const addSlot = parseSectionTimeToConflictSlot(sectionTime)
  if (!addSlot) return { conflict: false }
  for (const slot of baselineSlots) {
    if (detectScheduleConflict(addSlot, [slot])) {
      return {
        conflict: true,
        withCourse: slot.course || slot.label || '',
        withTime: slot.time || `${slot.day} ${slot.start}:00`,
        withSourceType: slot.sourceType || '',
      }
    }
  }
  return { conflict: false }
}

/**
 * 按分组（含 meetings）检测与基线是否冲突
 * @param {object} section
 * @param {object[]} baselineSlots
 */
export function getSectionMeetingsConflictInfo(section, baselineSlots = []) {
  const meetings = getSectionMeetings(section)
  for (const meeting of meetings) {
    const info = getSectionConflictInfo(meeting.time, baselineSlots)
    if (info.conflict) return info
  }
  return { conflict: false }
}
