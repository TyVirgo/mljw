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

function netCreditDelta(app) {
  return (app?.items || []).reduce((sum, item) => {
    const cr = Number(item.credits) || 0
    if (item.action === 'Drop') return sum - cr
    if (item.action === 'Add' || item.action === 'Retake') return sum + cr
    return sum
  }, 0)
}

/** 超出学分：显式字段或「当前 + 净加 − 上限」；不得用账单金额反推 */
function deriveExcessCredits(app) {
  if (app?.type === 'Drop') return 0
  if (app?.excessCredits != null && app.excessCredits !== '') {
    return Math.max(0, Number(app.excessCredits) || 0)
  }
  if (app?.billableCredits != null && app.billableCredits !== '') {
    return Math.max(0, Number(app.billableCredits) || 0)
  }
  const fromEst = app?.feeEstimate?.billableCredits
  if (fromEst != null && fromEst !== '') return Math.max(0, Number(fromEst) || 0)
  const fromItems = (app?.feeEstimate?.items || []).reduce(
    (s, i) => s + (Number(i.billableCredits) || 0),
    0,
  )
  if (fromItems > 0) return fromItems
  const current = Number(app?.currentCredits) || 0
  const max = Number(app?.creditMax) || 20
  return Math.max(0, current + netCreditDelta(app) - max)
}

function reconcileExcessFeeBill(app, excessCredits) {
  if (excessCredits <= 0) {
    return {
      excessCredits: 0,
      billableCredits: 0,
      billAmount: 0,
      billStatus: 'none',
    }
  }
  const seededAmount = Number(app?.billAmount)
  return {
    excessCredits,
    billableCredits: app?.billableCredits ?? excessCredits,
    billAmount: Number.isFinite(seededAmount) && seededAmount > 0 ? seededAmount : excessCredits * 500,
    billStatus: !app?.billStatus || app.billStatus === 'none' ? 'pending' : app.billStatus,
  }
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
  const feeBill = reconcileExcessFeeBill(app, excessCredits)
  const phone = String(app.contactPhone || '').trim()
  const session = String(app.academicSession || '').trim()
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
    academicSession: session || '2026/04',
    contactPhone: phone && phone !== '—' ? phone : demoContactPhone(app.studentId),
    declarationAgreed: app.declarationAgreed !== false,
    ...feeBill,
  }
}

function demoContactPhone(studentId) {
  if (studentId === 'XMUM2309001') return '0123456789'
  const digits = String(studentId || '').replace(/\D/g, '')
  const tail = (digits.slice(-8) || '87654321').padStart(8, '8')
  return `01${tail}`
}

export function enrichAddDropQueueSchedule(rows) {
  return (rows || []).map((row, index) => enrichAddDropApplicationSchedule(row, index))
}
