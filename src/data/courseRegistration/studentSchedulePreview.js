/**
 * 学生课表预览：必修 / 已确认选修（≤当前轮，同类型，R2 起）/ 本轮选择（虚线≡本轮表）
 */

import { getActiveBatch } from './registrationBatches.js'
import {
  buildVolunteerResultRows,
  demoVolunteerReleaseMode,
  isVolunteerResultReleased,
  shouldShowVolunteerSheetPanel,
  sortedPendingVolunteers,
  volunteerOrderSnapshot,
} from './studentVolunteerSheet.js'
import { getSectionMeetings } from './sectionScheduleFields.js'
import { myRegistrationList } from './studentRegistrationStore.js'
import { normalizeRegistrationType } from './registrationTypes.js'

/** 轮次顺序：数字越小越早；无 round / 管理端 / 必修视为 0（任意当前轮都可见） */
const ROUND_ORDER = {
  preselect: 1,
  main: 2,
  supplement: 3,
  addDrop: 4,
}

/** 轮次 → 角标 */
const ROUND_BADGE = {
  preselect: 'R1',
  main: 'R2',
  supplement: 'R3',
  addDrop: 'AD',
}

/**
 * @param {string} roundKey
 * @returns {number}
 */
export function scheduleRoundOrder(roundKey) {
  const key = String(roundKey || '')
  if (!key) return 0
  return ROUND_ORDER[key] ?? 0
}

/**
 * @param {string} roundKey
 * @returns {string}
 */
export function scheduleRoundBadge(roundKey) {
  const key = String(roundKey || '')
  return ROUND_BADGE[key] || ''
}

/**
 * 课在「当前轮」视图下是否可见（不可出现更晚轮次的课）
 * R1：仅必修/方案课 + 本轮志愿（虚线）+ 公示中签；不含管理端代选与更晚轮已确认选修
 * @param {object} course
 * @param {string} [currentRound]
 */
export function isCourseVisibleAtRound(course, currentRound) {
  if (currentRound == null || currentRound === '') return true
  const src = String(course?.sourceType || '')
  if (src === 'required' || src === 'programme') return true
  // 在线选课课表与选课情况主表同源：不含管理端代选
  if (src === 'admin') return false
  if (currentRound === 'preselect') {
    return src === 'preselect'
  }
  const courseRound = String(course?.roundKey || '')
  if (!courseRound) return true
  return scheduleRoundOrder(courseRound) <= scheduleRoundOrder(currentRound)
}

/**
 * 实线「已确认选修」：仅严格更早轮（同轮确认只走本轮表虚线，避免跨批同轮泄漏）
 * 不含管理端代选（与选课情况「历轮已选」同源）
 * @param {object} course
 * @param {string} [currentRound]
 */
export function isEarlierRoundConfirmedForSchedule(course, currentRound) {
  if (currentRound == null || currentRound === '') return true
  const src = String(course?.sourceType || '')
  if (src === 'required' || src === 'programme') return true
  if (src === 'admin') return false
  const courseRound = String(course?.roundKey || '')
  if (!courseRound) return true
  return scheduleRoundOrder(courseRound) < scheduleRoundOrder(currentRound)
}

/**
 * @param {string} time
 * @param {object} course
 * @param {{ layer?: string, preview?: boolean, kind?: string, stroke?: string }} [meta]
 */
export function parseTimeToScheduleSlot(time, course = {}, meta = {}) {
  const match = String(time || '').match(/^(\w+)\s+(\d+):(\d+)[–-](\d+):(\d+)/)
  if (!match) return null
  const code = course.courseCode || course.code || ''
  const section = course.sectionCode || course.section || ''
  const layer = meta.layer || meta.kind || 'confirmed'
  const preview = Boolean(meta.preview) || layer === 'preview'
  const roundKey = course.roundKey || meta.roundKey || ''
  return {
    day: match[1],
    start: Number(match[2]),
    end: Number(match[4]),
    course: code,
    label: section ? `${code}·${section}` : code,
    courseName: course.courseName || course.name || '',
    courseNameEn: course.courseNameEn || '',
    sectionCode: section,
    room: course.room || '',
    lecturer: course.lecturer || '',
    lecturerEn: course.lecturerEn || '',
    credits: course.credits,
    weekRange: course.weekRange || '',
    roundKey,
    roundBadge: scheduleRoundBadge(roundKey),
    preview,
    /** solid=已确认/必修；dashed=本轮选择中 */
    stroke: meta.stroke || (preview ? 'dashed' : 'solid'),
    kind: meta.kind || layer,
    layer: preview ? 'preview' : layer,
  }
}

/**
 * @param {Array<object>} courses
 * @param {{ layer?: string, preview?: boolean, kind?: string, stroke?: string }} [meta]
 */
export function coursesToScheduleSlots(courses = [], meta = {}) {
  const slots = []
  for (const item of courses || []) {
    const meetings = getSectionMeetings(item)
    if (!meetings.length) {
      const one = parseTimeToScheduleSlot(item.time || item.classTime, item, meta)
      if (one) slots.push(one)
      continue
    }
    for (const meeting of meetings) {
      const slot = parseTimeToScheduleSlot(meeting.time, {
        ...item,
        time: meeting.time,
        room: meeting.room,
        weekRange: meeting.weekRange,
      }, meta)
      if (slot) slots.push(slot)
    }
  }
  return slots
}

/**
 * R1 公示后中签课（未进确认半池时仍可上表；仅全局公示或结果页场景）
 * @param {object} [batch]
 * @param {{ onlinePreview?: boolean }} [opts]
 */
export function listVolunteerHitCoursesForSchedule(batch = getActiveBatch(), opts = {}) {
  const { onlinePreview = false } = opts
  if (onlinePreview) {
    if (demoVolunteerReleaseMode.value !== 'released') return []
  } else if (!isVolunteerResultReleased(batch)) {
    return []
  }
  return buildVolunteerResultRows(batch)
    .filter((row) => row.status === 'hit')
    .map((row) => ({
      courseId: row.courseId,
      courseCode: row.code,
      courseName: row.name,
      credits: row.credits,
      type: row.type,
      sectionCode: row.section === '—' ? '' : row.section,
      time: row.time === '—' ? '' : row.time,
      classTime: row.time === '—' ? '' : row.time,
      weekRange: row.weekRange === '—' ? '' : row.weekRange,
      room: row.room === '—' ? '' : row.room,
      lecturer: row.lecturer === '—' ? '' : row.lecturer,
      sourceType: 'preselect',
      roundKey: 'preselect',
    }))
    .filter((row) => row.time)
}

/**
 * 志愿预览（本轮选择，虚线）；R1–R3 老生志愿同源
 * @param {object} [batch]
 * @param {string} [currentRound]
 */
export function listVolunteerWishCoursesForSchedule(batch = getActiveBatch(), currentRound) {
  const batchId = batch?.id || ''
  const roundKey = currentRound || 'preselect'
  // 在线预览只认全局 demo 公示；不认结果页 sheet.releaseMode
  if (demoVolunteerReleaseMode.value === 'released') return []
  const snap = volunteerOrderSnapshot.value
  if (snap?.slots?.length && (!currentRound || currentRound === 'preselect')) {
    if (batchId && snap.batchId && snap.batchId !== batchId) return []
    return snap.slots
      .filter((s) => s.item)
      .filter((s) => !batchId || !s.item?.batchId || s.item.batchId === batchId)
      .map((s) => ({
        ...s.item,
        roundKey: s.item.roundKey || 'preselect',
        sourceType: s.item.sourceType || 'preselect',
      }))
  }
  return sortedPendingVolunteers(batchId, roundKey)
    .filter((item) => item.status !== 'failed' && item.status !== 'miss')
    .map((item) => ({
      ...item,
      roundKey: item.roundKey || roundKey,
    }))
}

/**
 * 与「本轮选课情况」本轮志愿块同源的预览课（虚线）
 * @param {string} [currentRound]
 * @param {object} [batch]
 */
export function listRoundStatusCoursesForSchedule(currentRound, batch = getActiveBatch()) {
  const round = String(currentRound || '')
  if (!round || shouldShowVolunteerSheetPanel(round)) {
    return listVolunteerWishCoursesForSchedule(batch, round || 'preselect')
  }
  // 非志愿：虚线 ≡ 本轮表成功行
  return (myRegistrationList.value || [])
    .filter((item) => {
      const status = String(item.status || '')
      return status !== 'queued' && status !== 'failed' && status !== 'miss'
    })
    .map((item) => ({
      ...item,
      courseCode: item.courseCode || item.code,
      roundKey: item.roundKey || round,
    }))
}

/** 课表实线层：只保留与当前批类型一致的确认/中签课（去异类型杂课） */
function matchesBatchType(course, batch) {
  const batchType = batch?.type === 'GE' ? 'GE' : batch?.type === 'ME' ? 'ME' : ''
  if (!batchType) return true
  const courseType = normalizeRegistrationType(course?.type)
  if (!courseType) return true
  return courseType === batchType
}

function courseKey(item) {
  return String(item?.courseId || item?.courseCode || item?.code || '')
}

/** 预览层去重：同课不同教学分组均保留 */
function courseSectionDedupeKey(item) {
  const code = String(item?.courseCode || item?.code || '')
  const section = String(item?.sectionCode || item?.section || item?.sectionId || '')
  const id = String(item?.courseId || item?.id || '')
  if (code && section) return `${code}::${section}`
  if (id && section) return `${id}::${section}`
  if (code) return `code:${code}`
  if (id) return `id:${id}`
  return ''
}

/**
 * 合并必修 + 已确认（≤当前轮，实线）+ 本轮选择（虚线）
 * @param {object} opts
 * @param {string} [opts.currentRound] 当前选课轮；空则不过滤轮次（结果页）
 */
export function buildPreviewSchedule({
  required = [],
  confirmed = [],
  cart = [],
  pendingAdd = [],
  pendingDropCodes = [],
  wishPreview = [],
  currentRound,
  batch = getActiveBatch(),
} = {}) {
  const dropSet = new Set((pendingDropCodes || []).map(String))
  const isR1Round = currentRound === 'preselect'

  const wish =
    wishPreview != null
      ? wishPreview
      : listRoundStatusCoursesForSchedule(currentRound, batch)
  /** 虚线层 = 本轮选择中（非排队）；排队中不进预览 */
  const previewCourses = [...(cart || []), ...(wish || []), ...(pendingAdd || [])].filter((c) => {
    if (String(c.status || '') === 'queued') return false
    if (String(c.status || '') === 'failed' || String(c.status || '') === 'miss') return false
    return isCourseVisibleAtRound(
      { ...c, roundKey: c.roundKey || currentRound || '' },
      currentRound,
    )
  })
  const currentRoundKeys = new Set()
  for (const c of previewCourses) {
    const code = String(c.courseCode || c.code || '')
    const id = String(c.courseId || c.id || '')
    if (code) currentRoundKeys.add(code)
    if (id) currentRoundKeys.add(id)
  }

  let confirmedMerged = []
  if (!isR1Round) {
    const hitExtra = listVolunteerHitCoursesForSchedule(batch).filter(
      (c) =>
        matchesBatchType(c, batch) && isEarlierRoundConfirmedForSchedule(c, currentRound),
    )
    confirmedMerged = [...(confirmed || [])].filter((c) => {
      if (String(c?.sourceType || '') === 'admin') return false
      if (!matchesBatchType(c, batch)) return false
      // 实线仅更早轮；同轮确认由本轮表虚线承载
      if (!isEarlierRoundConfirmedForSchedule(c, currentRound)) return false
      // 本轮表已有的课只留虚线一层，不在实线层重复
      const code = String(c.courseCode || c.code || '')
      const id = String(c.courseId || c.id || '')
      if (code && currentRoundKeys.has(code)) return false
      if (id && currentRoundKeys.has(id)) return false
      return true
    })
    const seen = new Set(confirmedMerged.map(courseKey).filter(Boolean))
    for (const hit of hitExtra) {
      const key = courseKey(hit)
      const code = String(hit.courseCode || hit.code || '')
      if (code && currentRoundKeys.has(code)) continue
      if (key && currentRoundKeys.has(key)) continue
      if (key && !seen.has(key)) {
        confirmedMerged.push(hit)
        seen.add(key)
      }
    }
  }

  const requiredSlots = coursesToScheduleSlots(required, {
    layer: 'required',
    kind: 'required',
    stroke: 'solid',
  })
  const confirmedSlots = coursesToScheduleSlots(
    confirmedMerged.filter((c) => !dropSet.has(String(c.courseCode || c.code || ''))),
    { layer: 'confirmed', kind: 'confirmed', stroke: 'solid' },
  )

  const previewSeen = new Set([
    ...requiredSlots.map((s) => (s.sectionCode ? `${s.course}::${s.sectionCode}` : `code:${s.course}`)),
    ...confirmedSlots.map((s) => (s.sectionCode ? `${s.course}::${s.sectionCode}` : `code:${s.course}`)),
  ])
  // 必修/已确认已占的课号：预览层同课号不再叠一层（同分组键已进 previewSeen）
  const requiredOrConfirmedCodes = new Set([
    ...requiredSlots.map((s) => String(s.course || '')).filter(Boolean),
    ...confirmedSlots.map((s) => String(s.course || '')).filter(Boolean),
  ])
  const previewSlots = coursesToScheduleSlots(
    previewCourses.filter((c) => {
      const code = String(c.courseCode || c.code || '')
      const courseId = String(c.courseId || c.id || '')
      const key = courseSectionDedupeKey(c)
      if (!code && !courseId) return false
      if (dropSet.has(code)) return false
      // 必修/更早确认已有该课号时，本轮同课不再虚线叠显
      if (code && requiredOrConfirmedCodes.has(code)) return false
      if (key && previewSeen.has(key)) return false
      if (key) previewSeen.add(key)
      return true
    }),
    { layer: 'preview', preview: true, kind: 'cart', stroke: 'dashed' },
  )

  return [...requiredSlots, ...confirmedSlots, ...previewSlots]
}

/** 学生侧课程库文档 demo（挂在线选课顶栏） */
export const STUDENT_LIBRARY_DOCS_DEMO = [
  {
    id: 'me-lib',
    title: 'ME Open Elective Library',
    session: '2026/04',
    versionDate: '01-Aug-2025',
    url: '',
  },
  {
    id: 'ge-lib',
    title: 'GE Course Library',
    session: '2026/04',
    versionDate: '01-Aug-2025',
    url: '',
  },
]
