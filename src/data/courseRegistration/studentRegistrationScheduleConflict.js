/**
 * 学生选课：硬冲突（必修/已确认）与 R1 志愿软冲突
 */
import {
  buildScheduleBaselineFromEnrolled,
  getSectionMeetingsConflictInfo,
} from './addDropSectionConflict.js'
import { scheduleRoundOrder } from './studentSchedulePreview.js'
import { listPendingVolunteerTimeConflicts } from './volunteerPendingConflict.js'

/**
 * 硬冲突基线：R1 仅必修；其后为必修 + 不晚于当前轮的已确认课
 * @param {string} roundKey
 * @param {object[]} required
 * @param {object[]} confirmed
 */
export function buildHardConflictBaseline(roundKey, required = [], confirmed = []) {
  const enrolled = (required || []).map((item) => ({
    ...item,
    sourceType: item.sourceType || 'required',
  }))
  if (roundKey === 'preselect') {
    return buildScheduleBaselineFromEnrolled(enrolled)
  }
  const currentOrder = scheduleRoundOrder(roundKey)
  const confirmedFiltered = (confirmed || []).filter((item) => {
    const rk = String(item?.roundKey || '').trim()
    if (!rk) return true
    return scheduleRoundOrder(rk) <= currentOrder
  })
  return buildScheduleBaselineFromEnrolled([...enrolled, ...confirmedFiltered])
}

/**
 * @param {object} section
 * @param {object[]} baselineSlots
 * @returns {{ ok: boolean, conflict?: boolean, withCourse?: string, withTime?: string, errorKey?: string, errorParams?: object }}
 */
export function checkHardScheduleConflict(section, baselineSlots = []) {
  const info = getSectionMeetingsConflictInfo(section, baselineSlots)
  if (!info.conflict) return { ok: true }
  return {
    ok: false,
    conflict: true,
    withCourse: info.withCourse,
    withTime: info.withTime,
    errorKey: 'courseRegistration.student.scheduleConflictHard',
    errorParams: {
      course: info.withCourse || '—',
      time: info.withTime || '—',
    },
  }
}

/**
 * R1 待分配志愿互撞：用于课表高亮（软冲突，不挡提交）
 * @param {object[]} rows
 * @returns {string[]} course codes
 */
export function listVolunteerSoftConflictCourseCodes(rows = []) {
  const { groups } = listPendingVolunteerTimeConflicts(rows)
  const codes = new Set()
  for (const group of groups) {
    for (const code of group.codes || []) {
      if (code) codes.add(String(code))
    }
  }
  return [...codes]
}
