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
export function buildScheduleBaselineFromEnrolled(enrolled = [], pendingDropCodes = []) {
  const dropSet = new Set(pendingDropCodes.map(String))
  const slots = []
  for (const item of enrolled) {
    const code = item.courseCode || item.code
    if (dropSet.has(String(code))) continue
    const meetings = getSectionMeetings(item)
    const times = meetings.length
      ? meetings
      : item.time
        ? [{ time: item.time, room: item.room, weekRange: item.weekRange }]
        : []
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
        })
      }
    }
  }
  return slots
}

/**
 * @param {string} sectionTime
 * @param {object[]} baselineSlots
 * @returns {{ conflict: boolean, withCourse?: string, withTime?: string }}
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
