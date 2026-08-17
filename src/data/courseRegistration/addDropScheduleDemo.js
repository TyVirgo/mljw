/**
 * 加退申请 demo 排课字段样本（对齐排课模块：教师 / 起止周 / 上课时间 / 地点）
 * 上课时间展示走 deriveClassTime；time 保留英文供课表解析。
 * meetings（1–3）供「上课时间地点」多行展示。
 */
import { deriveClassTime, getSectionMeetings } from './sectionScheduleFields.js'

/** 图示样本池（含多段 meetings） */
export const ADD_DROP_SCHEDULE_SAMPLES = [
  {
    lecturer: 'Dr. Sarah',
    weekRange: '1-5',
    time: 'Mon 14:00–16:00',
    room: 'A3-509',
    meetings: [
      { time: 'Mon 14:00–16:00', room: 'A3-509', weekRange: '1-5' },
      { time: 'Tue 10:00–12:00', room: 'A4-105', weekRange: '1-5' },
      { time: 'Thu 15:00–17:00', room: 'A3-602', weekRange: '1-5' },
    ],
  },
  {
    lecturer: 'Dr. Brown',
    weekRange: '1-5',
    time: 'Tue 14:00–16:00',
    room: 'A1-G01',
    meetings: [
      { time: 'Tue 14:00–16:00', room: 'A1-G01', weekRange: '1-5' },
      { time: 'Wed 09:00–11:00', room: 'A4-G01', weekRange: '1-5' },
      { time: 'Thu 09:00–11:00', room: 'A3-602', weekRange: '1-5' },
    ],
  },
  {
    lecturer: 'Ms. Chan',
    weekRange: '1-14',
    time: 'Fri 09:00–12:00',
    room: 'A2-2-105',
    meetings: [
      { time: 'Fri 09:00–12:00', room: 'A2-2-105', weekRange: '1-14' },
      { time: 'Mon 10:00–12:00', room: 'A2-1-101', weekRange: '1-7' },
    ],
  },
  {
    lecturer: 'Dr. Ng',
    weekRange: '1-18',
    time: 'Mon 16:00–18:00',
    room: 'A2-3-101',
  },
  {
    lecturer: 'Ms. Tay',
    weekRange: '1-18',
    time: 'Fri 16:00–18:00',
    room: 'A2-3-102',
    meetings: [
      { time: 'Fri 16:00–18:00', room: 'A2-3-102', weekRange: '1-18' },
      { time: 'Wed 14:00–16:00', room: 'A2-3-201', weekRange: '8-18' },
    ],
  },
]

export function sampleScheduleAt(index) {
  const s = ADD_DROP_SCHEDULE_SAMPLES[index % ADD_DROP_SCHEDULE_SAMPLES.length]
  return {
    ...s,
    classTime: deriveClassTime(s.time),
    meetings: s.meetings ? s.meetings.map((m) => ({ ...m })) : undefined,
  }
}

/** 补齐单条 item 的排课字段；缺省时从样本池取，不留空 */
export function enrichAddDropScheduleItem(item, index = 0) {
  if (!item) return item
  const sample = sampleScheduleAt(index)
  const time = item.time || sample.time
  const weekRange = item.weekRange || sample.weekRange
  const room = item.room || item.venue || sample.room
  const meetings =
    Array.isArray(item.meetings) && item.meetings.length
      ? item.meetings
      : sample.meetings ||
        getSectionMeetings({ time, room, weekRange })
  return {
    ...item,
    section: item.section || item.sectionCode || '01',
    sectionName:
      item.sectionName ||
      item.name ||
      `分组名称${item.section || item.sectionCode || sample.code || '01'}`,
    time,
    classTime: item.classTime || deriveClassTime(time),
    weekRange,
    room,
    lecturer: item.lecturer || item.lecturers || sample.lecturer,
    meetings,
  }
}

function pickPrimaryItem(app) {
  const items = app?.items || []
  if (app?.type === 'Drop') return items.find((i) => i.action === 'Drop') || items[0]
  if (app?.type === 'AddDrop') return items.find((i) => i.action === 'Add') || items[0]
  return items.find((i) => i.action === 'Add' || i.action === 'Retake') || items[0]
}

/** demo / 缺字段时从账单金额反推超出学分 */
function deriveExcessCredits(app) {
  if (app?.excessCredits != null && app.excessCredits !== '') return Number(app.excessCredits) || 0
  if (app?.billableCredits != null && app.billableCredits !== '') return Number(app.billableCredits) || 0
  const fromEst = app?.feeEstimate?.billableCredits
  if (fromEst != null) return Number(fromEst) || 0
  const fromItems = (app?.feeEstimate?.items || []).reduce(
    (s, i) => s + (Number(i.billableCredits) || 0),
    0,
  )
  if (fromItems > 0) return fromItems
  const amount = Number(app?.billAmount) || 0
  if (amount <= 0) return 0
  for (const rate of [500, 550, 600]) {
    if (amount % rate === 0) return amount / rate
  }
  return 0
}

/** 补齐申请顶层与 items 排课字段，供列表/详情直接展示 */
export function enrichAddDropApplicationSchedule(app, seedIndex = 0) {
  if (!app) return app
  const items = (app.items || []).map((item, i) => enrichAddDropScheduleItem(item, seedIndex + i))
  const primary = pickPrimaryItem({ ...app, items }) || sampleScheduleAt(seedIndex)
  const classTime = app.classTime || primary.classTime || deriveClassTime(primary.time)
  const venue = app.venue || primary.room || ''
  const lecturers = app.lecturers || primary.lecturer || ''
  const weekRange = app.weekRange || primary.weekRange || '1-18'
  const sectionCode = app.sectionCode || primary.section || '01'
  const sectionName =
    app.sectionName || primary.sectionName || primary.name || `分组名称${sectionCode}`
  const meetings = primary.meetings || app.meetings
  const excessCredits = deriveExcessCredits(app)
  return {
    ...app,
    items,
    sectionCode,
    sectionName,
    classTime,
    venue,
    lecturers,
    weekRange,
    meetings,
    time: app.time || primary.time,
    excessCredits,
    billableCredits: app.billableCredits ?? excessCredits,
  }
}

export function enrichAddDropQueueSchedule(rows) {
  return (rows || []).map((row, index) => enrichAddDropApplicationSchedule(row, index))
}
