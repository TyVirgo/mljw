/**
 * 加退申请 demo 排课字段样本（对齐排课模块：教师 / 起止周 / 上课时间 / 地点）
 * 上课时间展示走 deriveClassTime；time 保留英文供课表解析。
 * meetings（1–3）供「上课时间地点」多行展示。
 */
import { deriveClassTime, getSectionMeetings } from './sectionScheduleFields.js'
import {
  resolveAddDropExcessCredits,
  attachSstToFeeEstimate,
  CREDIT_FEE_RATES,
} from './addDropFeeRates.js'

/** ME 默认文科单价（与 resolveFeeStream 一致） */
const DEMO_DEFAULT_FEE_RATE = CREDIT_FEE_RATES.arts

/** 审批/详情 demo 缺省课程名（对齐课库常用码） */
const DEMO_COURSE_NAMES = {
  COMP101: 'Introduction to Programming',
  COMP201: 'Data Structures',
  COMP301: 'Database Systems',
  COMP3192: 'Algorithm Design',
  MATH201: 'Linear Algebra',
  MATH301: 'Discrete Mathematics',
  STAT201: 'Probability & Statistics',
  MPU3183: 'Malaysian Studies',
  MPU3193: 'Philosophy and Current Issues',
  ENGL201: 'Academic Writing',
  ENG201: 'Academic Writing',
  AI110: 'Introduction to AI',
  IT102: 'Digital Literacy Workshop',
  HUM110: 'Introduction to Humanities',
}

function resolveDemoCourseName(courseCode) {
  const code = String(courseCode || '').trim()
  return code ? DEMO_COURSE_NAMES[code] || '' : ''
}

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
  const courseName =
    item.courseName ||
    item.name ||
    resolveDemoCourseName(item.courseCode || item.code) ||
    ''

  /** demo 名额：已有字段优先；否则按 index 给稳定样本 */
  const capacityRaw = Number(item.capacity ?? item.sectionCapacity)
  const remainingRaw = Number(item.remainingCapacity)
  const capacity =
    Number.isFinite(capacityRaw) && capacityRaw > 0
      ? capacityRaw
      : [40, 35, 30, 40, 25][index % 5]
  const remaining =
    Number.isFinite(remainingRaw) && remainingRaw >= 0
      ? Math.min(remainingRaw, capacity)
      : Math.max(0, capacity - ([5, 12, 0, 8, 3][index % 5]))

  return {
    ...item,
    courseName,
    capacity,
    remainingCapacity: remaining,
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
  if (app?.type === 'RetakeDrop') return items.find((i) => i.action === 'Retake') || items[0]
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

/** 超出学分：与费用计费学分同源；有计费/账单时不以显式 excessCredits:0 覆盖 */
function deriveExcessCredits(app) {
  if (app?.type === 'Drop') return 0
  const fromBillable = resolveAddDropExcessCredits(app)
  if (fromBillable > 0) return fromBillable
  if (app?.excessCredits != null && app.excessCredits !== '') {
    return Math.max(0, Number(app.excessCredits) || 0)
  }
  const current = Number(app?.currentCredits) || 0
  const max = Number(app?.creditMax) || 20
  return Math.max(0, current + netCreditDelta(app) - max)
}

function appHasDropLine(app) {
  const type = String(app?.type || '')
  if (type === 'Drop' || type === 'AddDrop' || type === 'RetakeDrop') return true
  return (app?.items || []).some((i) => i.action === 'Drop')
}

/** demo：退课原因必填口径；缺文案时回落 reason / 默认说明 */
function resolveDemoDropReason(app) {
  const existing = String(app?.dropReason || app?.reason || '').trim()
  if (existing) return existing
  if (!appHasDropLine(app)) return ''
  return '课程安排调整'
}

/**
 * 毕业计费 >0 时合成 feeEstimate（缺有效 total 才补）；已有非零 total 则保留。
 * @returns {{ feeEstimate: object|null, synthesized: boolean }}
 */
function ensureFeeEstimateForBillable(app, billable) {
  if (billable <= 0) {
    return { feeEstimate: app?.feeEstimate || null, synthesized: false }
  }
  const existingTotal = Number(app?.feeEstimate?.total)
  if (Number.isFinite(existingTotal) && existingTotal > 0) {
    return { feeEstimate: app.feeEstimate, synthesized: false }
  }
  const rate = DEMO_DEFAULT_FEE_RATE
  const total = billable * rate
  const addItem = (app?.items || []).find(
    (i) => i.action === 'Add' || i.action === 'Retake',
  )
  const courseCode = addItem?.courseCode || ''
  const base = {
    total,
    billableCredits: billable,
    items: courseCode
      ? [
          {
            courseCode,
            billableCredits: billable,
            amount: total,
            feeStream: 'arts',
            rate,
          },
        ]
      : [],
  }
  return {
    feeEstimate: attachSstToFeeEstimate(base, app?.studentCategory || 'Local'),
    synthesized: true,
  }
}

function reconcileExcessFeeBill(app, excessCredits) {
  const dropReason = resolveDemoDropReason(app)
  const reason = String(app?.reason || dropReason || '').trim()
  const seededAmount = Number(app?.billAmount)
  const hasSeededBill = Number.isFinite(seededAmount) && seededAmount > 0
  if (excessCredits <= 0 && !hasSeededBill) {
    return {
      excessCredits: 0,
      billableCredits: 0,
      billAmount: 0,
      billStatus: 'none',
      feeEstimate: app?.feeEstimate || null,
      sstAmount: app?.sstAmount ?? app?.feeEstimate?.sstAmount ?? 0,
      dropReason,
      reason,
    }
  }
  const billable =
    excessCredits > 0
      ? excessCredits
      : Math.max(0, Number(app?.billableCredits) || Number(app?.feeEstimate?.billableCredits) || 0)
  const { feeEstimate, synthesized } = ensureFeeEstimateForBillable(app, billable)
  const payable =
    Number(feeEstimate?.payableTotal) ||
    Number(feeEstimate?.total) ||
    billable * DEMO_DEFAULT_FEE_RATE
  // 新合成 feeEstimate 时账单与应付对齐；否则保留已有非零 billAmount
  const billAmount =
    synthesized || !hasSeededBill
      ? payable > 0
        ? payable
        : billable * DEMO_DEFAULT_FEE_RATE
      : seededAmount
  const status = String(app?.status || '')
  const terminalNoBill = status === 'Rejected' || status === 'Cancelled'
  let billStatus = app?.billStatus
  if (!billStatus || billStatus === 'none') {
    billStatus = terminalNoBill || billAmount <= 0 ? 'none' : 'pending'
  }
  return {
    excessCredits: billable,
    billableCredits: app?.billableCredits ?? billable,
    billAmount,
    billStatus,
    feeEstimate: feeEstimate || app?.feeEstimate || null,
    sstAmount: feeEstimate?.sstAmount ?? app?.sstAmount ?? 0,
    dropReason,
    reason,
  }
}

/** 审批列表专业码 demo 对照（展示用） */
const DEMO_PROGRAMME_NAMES = {
  SWE: 'Software Engineering',
  COS: 'Computer Science',
  DSA: 'Data Science',
  AIT: 'Artificial Intelligence',
  ACC: 'Accounting',
  FIN: 'Finance',
  BUS: 'Business',
  MAT: 'Mathematics',
}

/** 从学号前缀或已有字段解析专业码 */
export function resolveDemoProgrammeCode(app) {
  const existing = String(app?.programme || app?.programmeCode || '').trim()
  if (existing) return existing
  const sid = String(app?.studentId || '').trim()
  const prefix = sid.match(/^([A-Za-z]+)/)?.[1]
  if (prefix) return prefix.toUpperCase()
  return 'SWE'
}

function resolveDemoProgrammeName(app, code) {
  const named = String(app?.programmeName || '').trim()
  if (named) return named
  return DEMO_PROGRAMME_NAMES[code] || code
}

/** 合法重修类型；别名/缺省按成绩兜底 */
function resolveDemoRetakeType(app) {
  const type = String(app?.type || '')
  if (type !== 'Retake' && type !== 'RetakeDrop') return app?.retakeType || ''
  const raw = String(app?.retakeType || '').trim()
  if (raw === 'failed' || raw === 'improve_grade') return raw
  if (raw === 'improve' || raw === 'improveGrade') return 'improve_grade'
  const grades = (app?.items || [])
    .filter((i) => i.action === 'Retake')
    .map((i) => String(i.retakeGrade || i.gradeEarned || '').toUpperCase())
  if (grades.some((g) => g === 'F' || g === 'M' || g === 'FAIL')) return 'failed'
  return 'improve_grade'
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
  const retakeType = resolveDemoRetakeType(app)
  const phone = String(app.contactPhone || '').trim()
  const session = String(app.academicSession || '').trim()
  const programme = resolveDemoProgrammeCode(app)
  const programmeName = resolveDemoProgrammeName(app, programme)
  return {
    ...app,
    items,
    ...(retakeType ? { retakeType } : {}),
    programme,
    programmeName,
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
