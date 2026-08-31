/**
 * 教学分组排课字段：起止周 / 上课时间（展示）/ 地点 / 教师
 * time 保留英文时钟格式供周课表解析；classTime 按语言生成展示文案
 * meetings（1–3）为多时段；展示层派生「上课时间地点」拼接，不替代底层字段
 */

const DAY_LABEL_ZH = {
  Mon: '星期一',
  Tue: '星期二',
  Wed: '星期三',
  Thu: '星期四',
  Fri: '星期五',
  Sat: '星期六',
  Sun: '星期日',
}

const DAY_LABEL_EN = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

const MAX_MEETINGS = 3

function pad2(n) {
  return String(n).padStart(2, '0')
}

function normalizeLocale(locale) {
  if (locale === 'en' || locale === false) return 'en'
  return 'zh'
}

/** 英文时段：9.00am（对齐排课图示 am/pm） */
function formatClockAmPm(hour, minute) {
  const h24 = Number(hour)
  const m = Number(minute) || 0
  const suffix = h24 >= 12 ? 'pm' : 'am'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${h12}.${pad2(m)}${suffix}`
}

function formatClock24(hour, minute) {
  return `${pad2(hour)}:${pad2(minute)}`
}

/**
 * 地点展示：教学楼与教室号之间用 #（末段前替换最后连字符）
 * 例：D5-5-101 → D5-5#101；A3-509 → A3#509；已有 # 则原样
 */
export function formatVenueDisplay(room) {
  const raw = String(room || '').trim()
  if (!raw) return '—'
  if (raw.includes('#')) return raw
  const idx = raw.lastIndexOf('-')
  if (idx <= 0 || idx === raw.length - 1) return raw
  return `${raw.slice(0, idx)}#${raw.slice(idx + 1)}`
}

/**
 * 日 + 时段（无外层括号），供拼接「上课时间地点」
 * zh：星期一 14:00–16:00
 * en：Monday 2.00pm-4.00pm
 */
export function formatDayClock(time, locale = 'zh') {
  const match = String(time || '').match(/^(\w+)\s+(\d+):(\d+)[–-](\d+):(\d+)/)
  if (!match) return String(time || '').trim() || '—'
  const lang = normalizeLocale(locale)
  const dayKey = match[1]
  const startH = Number(match[2])
  const startM = Number(match[3])
  const endH = Number(match[4])
  const endM = Number(match[5])
  if (lang === 'en') {
    const day = DAY_LABEL_EN[dayKey] || dayKey
    const clock = `${formatClockAmPm(startH, startM)}-${formatClockAmPm(endH, endM)}`
    return `${day} ${clock}`
  }
  const day = DAY_LABEL_ZH[dayKey] || dayKey
  const clock = `${formatClock24(startH, startM)}–${formatClock24(endH, endM)}`
  return `${day} ${clock}`
}

/**
 * 由 Mon 10:00–12:00 推导展示文案（不含起止周、不含节次）
 * zh：(星期二 10:00–12:00)
 * en：(Tuesday 10.00am-12.00pm)
 * @param {string} time
 * @param {'zh'|'en'|boolean} [locale='zh'] true/zh → 中文；false/en → 英文
 */
export function deriveClassTime(time, locale = 'zh') {
  const dayClock = formatDayClock(time, locale)
  if (!dayClock || dayClock === '—') return time || '—'
  if (!/^\w+\s+\d+:\d+/.test(String(time || ''))) return dayClock
  return `(${dayClock})`
}

/**
 * 课表左轴时间段标签
 * @param {number} hour 起始整点 8–21
 * @param {'zh'|'en'|boolean} [locale='zh']
 */
export function formatHourRangeLabel(hour, locale = 'zh') {
  const start = Number(hour)
  const end = start + 1
  if (normalizeLocale(locale) === 'en') {
    return `${formatClockAmPm(start, 0)}-${formatClockAmPm(end, 0)}`
  }
  return `${pad2(start)}:00-${pad2(end)}:00`
}

/**
 * 归一 meetings：优先 section.meetings（最多 3），否则回退主字段 time/room/weekRange
 * @param {object} section
 * @returns {Array<{ time: string, room: string, weekRange: string }>}
 */
export function getSectionMeetings(section) {
  if (!section) return []
  const fallbackWeek = section.weekRange || '1-18'
  const fallbackRoom = section.room || section.venue || ''
  const rawList = Array.isArray(section.meetings) ? section.meetings : []
  const fromArr = rawList
    .filter((m) => m && String(m.time || '').trim())
    .slice(0, MAX_MEETINGS)
    .map((m) => ({
      time: String(m.time).trim(),
      room: m.room || m.venue || fallbackRoom,
      weekRange: m.weekRange || fallbackWeek,
    }))
  if (fromArr.length) return fromArr
  const time = String(section.time || '').trim()
  if (!time) return []
  return [
    {
      time,
      room: fallbackRoom,
      weekRange: fallbackWeek,
    },
  ]
}

/**
 * 单行：Monday 2.00pm-4.00pm(A3#509)(Week 1-5)
 * 中文：星期一 14:00–16:00(A3#509)(1-5周)
 * @param {{ time?: string, room?: string, weekRange?: string }} meeting
 * @param {'zh'|'en'|boolean} [locale='zh']
 */
export function formatClassTimeVenueLine(meeting, locale = 'zh') {
  if (!meeting) return '—'
  const dayClock = formatDayClock(meeting.time, locale)
  const venue = formatVenueDisplay(meeting.room)
  const weeks = String(meeting.weekRange || '1-18').replace(/\s*周\s*$/, '')
  if (normalizeLocale(locale) === 'en') {
    return `${dayClock}(${venue})(Week ${weeks})`
  }
  return `${dayClock}(${venue})(${weeks}周)`
}

/**
 * @param {object} section
 * @param {'zh'|'en'|boolean} [locale='zh']
 * @returns {string[]}
 */
export function displayClassTimeVenueLines(section, locale = 'zh') {
  return getSectionMeetings(section).map((m) => formatClassTimeVenueLine(m, locale))
}

/**
 * 多行文本（用于只读 input/textarea 或 title）
 * @param {object} section
 * @param {'zh'|'en'|boolean} [locale='zh']
 */
export function displayClassTimeVenue(section, locale = 'zh') {
  const lines = displayClassTimeVenueLines(section, locale)
  return lines.length ? lines.join('\n') : '—'
}

/**
 * 由已存独立字段拼一段（加退只读回退；无 meetings 时）
 * @param {{ time?: string, classTime?: string, room?: string, venue?: string, weekRange?: string, meetings?: object[] }} fields
 * @param {'zh'|'en'|boolean} [locale='zh']
 */
export function displayClassTimeVenueFromFields(fields, locale = 'zh') {
  if (!fields) return '—'
  if (Array.isArray(fields.meetings) && fields.meetings.length) {
    return displayClassTimeVenue(fields, locale)
  }
  const time =
    String(fields.time || '').trim() ||
    (/^\w+\s+\d+:\d+/.test(String(fields.classTime || ''))
      ? String(fields.classTime).trim()
      : '')
  if (time) {
    return displayClassTimeVenue(
      {
        time,
        room: fields.room || fields.venue || '',
        weekRange: fields.weekRange || '1-18',
      },
      locale,
    )
  }
  // 仅有展示态 classTime + venue：尽力拼接
  const clock = String(fields.classTime || '')
    .replace(/^\(/, '')
    .replace(/\)$/, '')
    .trim()
  const venue = formatVenueDisplay(fields.room || fields.venue || '')
  const weeks = String(fields.weekRange || '').replace(/\s*周\s*$/, '')
  if (!clock && venue === '—' && !weeks) return '—'
  if (normalizeLocale(locale) === 'en') {
    return `${clock || '—'}(${venue})${weeks ? `(Week ${weeks})` : ''}`
  }
  return `${clock || '—'}(${venue})${weeks ? `(${weeks}周)` : ''}`
}

/** @param {string} timeStr Mon 14:00–16:00 */
function parseTimeSlot(timeStr) {
  const match = String(timeStr || '').match(/^(\w+)\s+(\d+):(\d+)[–-](\d+):(\d+)/)
  if (!match) return null
  return {
    day: match[1],
    start: Number(match[2]) * 60 + Number(match[3]),
    end: Number(match[4]) * 60 + Number(match[5]),
  }
}

/** 同周几时段是否重叠 */
function timeSlotsOverlap(a, b) {
  if (!a || !b || a.day !== b.day) return false
  return a.start < b.end && b.start < a.end
}

/**
 * demo：无 meetings 时按分组 id 合成 1–3 段，便于 GE/ME 列表展示多行「上课时间地点」
 * 同分组内追加段须与已有段同周几不重叠
 * 已有 meetings 的分组不受影响
 */
function synthesizeDemoMeetings(section) {
  const time = String(section?.time || '').trim()
  if (!time) return null
  const id = String(section.id || section.code || time)
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const count = (h % 3) + 1
  const weekRange = section.weekRange || '1-18'
  const room = section.room || section.venue || 'A1-101'
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const slots = [
    [8, 10],
    [9, 11],
    [10, 12],
    [13, 15],
    [14, 16],
    [16, 18],
  ]
  const meetings = [{ time, room, weekRange }]
  const parsedSlots = [parseTimeSlot(time)].filter(Boolean)
  for (let i = 1; i < count; i += 1) {
    let added = false
    const maxAttempts = days.length * slots.length
    for (let attempt = 0; attempt < maxAttempts && !added; attempt += 1) {
      const day = days[(h + i * 2 + attempt) % days.length]
      const [sh, eh] = slots[(h + i + attempt) % slots.length]
      const candidateTime = `${day} ${pad2(sh)}:00–${pad2(eh)}:00`
      const candidate = parseTimeSlot(candidateTime)
      if (!candidate) continue
      if (parsedSlots.some((existing) => timeSlotsOverlap(existing, candidate))) continue
      const roomNum = 100 + ((h + i * 7 + attempt) % 80)
      const roomBase = String(room).replace(/#?\d+$/, '') || 'D5-1'
      meetings.push({
        time: candidateTime,
        room: `${roomBase}${room.includes('#') ? '' : '-'}${roomNum}`.replace(/--+/g, '-'),
        weekRange,
      })
      parsedSlots.push(candidate)
      added = true
    }
  }
  return meetings
}

export function enrichSectionScheduleFields(section) {
  if (!section) return section
  const weekRange = section.weekRange || '1-18'
  const hasExplicit = Array.isArray(section.meetings) && section.meetings.length > 0
  const meetingsSource = hasExplicit
    ? section.meetings
    : synthesizeDemoMeetings({ ...section, weekRange }) || undefined
  const meetings = getSectionMeetings({
    ...section,
    weekRange,
    meetings: meetingsSource,
  })
  const primary = meetings[0]
  return {
    ...section,
    weekRange,
    time: section.time || primary?.time || '',
    classTime: section.classTime || deriveClassTime(section.time || primary?.time),
    lecturer: section.lecturer || '',
    room: section.room || primary?.room || '',
    meetings,
  }
}

/** 优先用 time 重算，避免种子里旧的「1-9周」/节次文案残留 */
export function displayClassTime(section, locale = 'zh') {
  if (!section) return '—'
  if (section.time) return deriveClassTime(section.time, locale)
  const raw = String(section.classTime || '').trim()
  if (/^\w+\s+\d+:\d+/.test(raw)) return deriveClassTime(raw, locale)
  if (/第\d/.test(raw)) {
    return raw.replace(/第\d+(?:\s*-\s*\d+)?节\s*/g, ' ').replace(/\s+/g, ' ').trim() || '—'
  }
  return raw || '—'
}

export function displayWeekRange(section) {
  return section?.weekRange || '—'
}

export function displayVenue(sectionOrRoom) {
  if (sectionOrRoom && typeof sectionOrRoom === 'object') {
    return formatVenueDisplay(sectionOrRoom.room || sectionOrRoom.venue || '')
  }
  return formatVenueDisplay(sectionOrRoom)
}
