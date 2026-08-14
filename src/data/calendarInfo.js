import { isValidDdMmYyyy, parseDdMmYyyy, formatDateToDdMmYyyy } from './universityInfo.js'
import { initialSemesterRecords, formatAcademicSession } from './semesterInfo.js'

export const CALENDAR_STORAGE_KEY = 'jw-calendar-data'
export const MAX_CALENDAR_REMARKS = 200
export const MAX_EVENT_REMARKS = 100
export const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024

export const holidayNameOptions = [
  'Public Holiday',
  'School Holiday',
  'Examination',
  'Activity',
  'Other',
]

/** 周次设置中的特殊时段（与校历图例对应） */
export const weekPeriodDefinitions = [
  {
    key: 'revisionWeek',
    startField: 'revisionWeekStart',
    endField: 'revisionWeekEnd',
    mode: 'range',
    marker: 'square',
    color: '#ce93d8',
    labelKey: 'Revision Week',
  },
  {
    key: 'examinationWeek',
    startField: 'examinationWeekStart',
    endField: 'examinationWeekEnd',
    mode: 'range',
    marker: 'square',
    color: '#a5d6a7',
    labelKey: 'Examination Week',
  },
  {
    key: 'semesterBreak',
    startField: 'semesterBreakStart',
    endField: 'semesterBreakEnd',
    mode: 'range',
    marker: 'square',
    color: '#bdbdbd',
    labelKey: 'Semester Break',
  },
]

/** 教学周展示样式（校历着色 / 图例）：白色 */
export const teachingWeekPeriodDef = {
  key: 'teachingWeek',
  startField: 'teachingWeekStart',
  endField: 'teachingWeekEnd',
  mode: 'range',
  marker: 'square',
  color: '#ffffff',
  labelKey: 'Teaching Weeks',
}

export function createEmptyWeekSettings() {
  return {
    teachingWeekStart: '',
    teachingWeekEnd: '',
    registrationDaysStart: '',
    registrationDaysEnd: '',
    orientationDayStart: '',
    orientationDayEnd: '',
    revisionWeekStart: '',
    revisionWeekEnd: '',
    examinationWeekStart: '',
    examinationWeekEnd: '',
    semesterBreakStart: '',
    semesterBreakEnd: '',
  }
}

export function normalizeWeekSettings(settings) {
  const empty = createEmptyWeekSettings()
  if (!settings || typeof settings !== 'object') return empty
  const next = { ...empty }
  Object.keys(empty).forEach((key) => {
    next[key] = typeof settings[key] === 'string' ? settings[key] : ''
  })
  // 兼容旧版单日迎新字段
  if (!next.orientationDayStart && typeof settings.orientationDay === 'string' && settings.orientationDay) {
    next.orientationDayStart = settings.orientationDay
    next.orientationDayEnd = settings.orientationDay
  }
  return next
}

export function buildSemesterPeriodKey(academicYear, semester) {
  return formatAcademicSession(academicYear, semester)
}

export function parseSemesterPeriodKey(key) {
  if (!key) return null
  const slashMatch = String(key).match(/^(\d{4})\/(\d{2})$/)
  if (slashMatch) {
    return { academicYear: slashMatch[1], semester: slashMatch[2] }
  }
  const compactMatch = String(key).match(/^(\d{4})(\d{2})$/)
  if (compactMatch) {
    return { academicYear: compactMatch[1], semester: compactMatch[2] }
  }
  return null
}

export function formatSemesterPeriodKey(key) {
  const parsed = parseSemesterPeriodKey(key)
  if (!parsed) return key
  return buildSemesterPeriodKey(parsed.academicYear, parsed.semester)
}

function toLegacySemesterPeriodKey(key) {
  const parsed = parseSemesterPeriodKey(key)
  if (!parsed) return key
  return `${parsed.academicYear}${parsed.semester}`
}

export function getSemesterPeriodOptions(records = initialSemesterRecords) {
  return records.map((record) => ({
    key: buildSemesterPeriodKey(record.academicYear, record.semester),
    record,
  }))
}

export function findSemesterRecordByKey(key, records = initialSemesterRecords) {
  const parsed = parseSemesterPeriodKey(key)
  if (!parsed) return null
  return (
    records.find(
      (item) => item.academicYear === parsed.academicYear && item.semester === parsed.semester,
    ) || null
  )
}

export function formatDisplayDateDot(value) {
  if (!value) return ''
  return value.replace(/\//g, '.')
}

export function dateKeyFromDdMmYyyy(value) {
  if (!isValidDdMmYyyy(value)) return ''
  const date = parseDdMmYyyy(value)
  return formatDateToDdMmYyyy(date)
}

function alignToWeekStart(date, weekStartDay = 'Sunday') {
  const startIndex = weekStartDay === 'Monday' ? 1 : 0
  const aligned = new Date(date)
  while (aligned.getDay() !== startIndex) {
    aligned.setDate(aligned.getDate() - 1)
  }
  return aligned
}

function alignToWeekEnd(date, weekStartDay = 'Sunday') {
  const start = alignToWeekStart(date, weekStartDay)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

function addCalendarDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

function minCalendarDate(a, b) {
  return a.getTime() <= b.getTime() ? a : b
}

function maxCalendarDate(a, b) {
  return a.getTime() >= b.getTime() ? a : b
}

/**
 * 短学期：仅 02
 * 长学期：04 / 09（及其他非短学期）
 * - 长学期：倒数第 3 周复习周，倒数 1–2 周考试周，其余教学周
 * - 短学期：无复习周，最后 1 周考试周，其余教学周
 */
export function isShortAcademicSemester(semesterRecord) {
  const code = String(semesterRecord?.semester || '').padStart(2, '0')
  if (code === '02') return true
  if (code === '04' || code === '09') return false
  return semesterRecord?.semesterType === 'Short'
}

export function isLongAcademicSemester(semesterRecord) {
  return !!semesterRecord && !isShortAcademicSemester(semesterRecord)
}

/**
 * 按学期代码生成默认时段
 */
export function buildDefaultWeekSettingsFromSemester(semesterRecord) {
  const empty = createEmptyWeekSettings()
  if (!semesterRecord) return empty

  const start = parseDdMmYyyy(semesterRecord.startDate)
  const end = parseDdMmYyyy(semesterRecord.endDate)
  if (!start || !end || end < start) return empty

  const weekStartDay = semesterRecord.weekStartDay || 'Sunday'
  const isLong = isLongAcademicSemester(semesterRecord)
  const examWeekCount = isLong ? 2 : 1
  const revisionWeekCount = isLong ? 1 : 0

  const firstWeekStart = alignToWeekStart(start, weekStartDay)
  const lastWeekStart = alignToWeekStart(end, weekStartDay)
  const weekStarts = []
  const cursor = new Date(firstWeekStart)
  while (cursor <= lastWeekStart) {
    weekStarts.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  const reserved = examWeekCount + revisionWeekCount
  if (weekStarts.length <= reserved) {
    empty.teachingWeekStart = formatDateToDdMmYyyy(start)
    empty.teachingWeekEnd = formatDateToDdMmYyyy(end)
    return empty
  }

  const examWeekStart = weekStarts[weekStarts.length - examWeekCount]
  const examStart = maxCalendarDate(examWeekStart, start)
  const examEnd = end

  let revisionStart = null
  let revisionEnd = null
  if (revisionWeekCount > 0) {
    const revisionWeekStart = weekStarts[weekStarts.length - examWeekCount - 1]
    revisionStart = maxCalendarDate(revisionWeekStart, start)
    revisionEnd = minCalendarDate(
      alignToWeekEnd(revisionWeekStart, weekStartDay),
      addCalendarDays(examStart, -1),
    )
  }

  const teachingEndCandidate = revisionStart
    ? addCalendarDays(revisionStart, -1)
    : addCalendarDays(examStart, -1)
  const teachingStart = start
  const teachingEnd = minCalendarDate(teachingEndCandidate, end)

  empty.teachingWeekStart = formatDateToDdMmYyyy(teachingStart)
  empty.teachingWeekEnd = formatDateToDdMmYyyy(maxCalendarDate(teachingStart, teachingEnd))
  empty.examinationWeekStart = formatDateToDdMmYyyy(examStart)
  empty.examinationWeekEnd = formatDateToDdMmYyyy(examEnd)

  if (revisionStart && revisionEnd && revisionEnd >= revisionStart) {
    empty.revisionWeekStart = formatDateToDdMmYyyy(revisionStart)
    empty.revisionWeekEnd = formatDateToDdMmYyyy(revisionEnd)
  }

  return empty
}

function isSameCalendarDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isDateWithinInclusive(date, start, end) {
  if (!date || !start || !end) return false
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const to = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return day >= from && day <= to
}

function getPeriodKeysForDate(date, weekSettings) {
  if (!weekSettings || !date) return []
  const keys = []

  const teachStart = parseDdMmYyyy(weekSettings.teachingWeekStart)
  const teachEnd = parseDdMmYyyy(weekSettings.teachingWeekEnd)
  if (teachStart && teachEnd && isDateWithinInclusive(date, teachStart, teachEnd)) {
    keys.push(teachingWeekPeriodDef.key)
  }

  weekPeriodDefinitions.forEach((def) => {
    const startValue = weekSettings[def.startField]
    const endValue = weekSettings[def.endField]
    if (!startValue || !endValue) return
    const start = parseDdMmYyyy(startValue)
    const end = parseDdMmYyyy(endValue)
    if (!start || !end) return
    if (isDateWithinInclusive(date, start, end)) keys.push(def.key)
  })
  return keys
}

/** 日单元格图例优先级：考试周 > 复习周 > 学期假 > 教学周 */
const DAY_PERIOD_PRIORITY = [
  'examinationWeek',
  'revisionWeek',
  'semesterBreak',
  'teachingWeek',
]

export function getPrimaryDayPeriod(periodKeys = []) {
  return DAY_PERIOD_PRIORITY.find((key) => periodKeys.includes(key)) || ''
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatLegendDay(date) {
  return `${date.getDate()} ${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`
}

export function formatWeekPeriodLegendText(startValue, endValue) {
  const start = parseDdMmYyyy(startValue)
  const end = parseDdMmYyyy(endValue)
  if (!start || !end) return ''
  if (isSameCalendarDay(start, end)) return formatLegendDay(start)

  const dayDiff = Math.round((end - start) / (24 * 60 * 60 * 1000))
  if (
    dayDiff === 1 &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${start.getDate()} & ${end.getDate()} ${MONTH_ABBR[start.getMonth()]} ${start.getFullYear()}`
  }

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${end.getDate()} ${MONTH_ABBR[start.getMonth()]} ${start.getFullYear()}`
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${MONTH_ABBR[start.getMonth()]} – ${end.getDate()} ${MONTH_ABBR[end.getMonth()]} ${end.getFullYear()}`
  }

  return `${formatLegendDay(start)} – ${formatLegendDay(end)}`
}

export function buildWeekSettingsLegendItems(weekSettings) {
  const settings = normalizeWeekSettings(weekSettings)
  const items = []

  const teachingText = formatWeekPeriodLegendText(
    settings.teachingWeekStart,
    settings.teachingWeekEnd,
  )
  if (teachingText) {
    items.push({
      key: teachingWeekPeriodDef.key,
      labelKey: teachingWeekPeriodDef.labelKey,
      marker: teachingWeekPeriodDef.marker,
      color: teachingWeekPeriodDef.color,
      text: teachingText,
    })
  }

  weekPeriodDefinitions.forEach((def) => {
    const startValue = settings[def.startField]
    const endValue = settings[def.endField]
    const text = formatWeekPeriodLegendText(startValue, endValue)
    if (!text) return
    items.push({
      key: def.key,
      labelKey: def.labelKey,
      marker: def.marker,
      color: def.color,
      text,
    })
  })

  return items
}

function getWeekDisplayMonthKey(days) {
  const inRangeDays = days.filter((day) => day.inRange)
  if (!inRangeDays.length) return days[0]?.monthKey || ''

  const monthCounts = {}
  inRangeDays.forEach((day) => {
    monthCounts[day.monthKey] = (monthCounts[day.monthKey] || 0) + 1
  })

  return Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0][0]
}

export function buildCalendarWeeks(semesterRecord, weekSettings = null) {
  if (!semesterRecord) return []
  const start = parseDdMmYyyy(semesterRecord.startDate)
  const end = parseDdMmYyyy(semesterRecord.endDate)
  if (!start || !end) return []

  const settings = normalizeWeekSettings(weekSettings)
  const weekStartDay = semesterRecord.weekStartDay || 'Sunday'
  let cursor = alignToWeekStart(start, weekStartDay)
  const weeks = []
  const semesterWeekStart = alignToWeekStart(start, weekStartDay)

  while (cursor <= end) {
    const days = []
    for (let i = 0; i < 7; i += 1) {
      const cellDate = new Date(cursor)
      cellDate.setDate(cursor.getDate() + i)
      const inRange = cellDate >= start && cellDate <= end
      const dayOfWeek = cellDate.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const periodKeys = inRange ? getPeriodKeysForDate(cellDate, settings) : []
      const hasRevisionWeekend = periodKeys.includes('revisionWeek')
      // 周末默认灰；仅复习周可覆盖周末颜色（考试周/教学周周末仍置灰）
      const isGrayDay = !inRange || (isWeekend && !hasRevisionWeekend)
      const keysForDisplay = isWeekend
        ? periodKeys.filter((key) => key === 'revisionWeek')
        : periodKeys
      days.push({
        date: cellDate,
        day: cellDate.getDate(),
        dateKey: formatDateToDdMmYyyy(cellDate),
        inRange,
        isWeekend,
        isGrayDay,
        monthKey: `${cellDate.getFullYear()}${String(cellDate.getMonth() + 1).padStart(2, '0')}`,
        periodKeys,
        primaryPeriod: isGrayDay ? '' : getPrimaryDayPeriod(keysForDisplay),
      })
    }
    const primaryMonthKey = getWeekDisplayMonthKey(days)

    // 周次从学期首周连续编号，覆盖教学周 / 复习周 / 考试周
    const hasInRangeDay = days.some((day) => day.inRange)
    let teachingWeek = null
    if (hasInRangeDay) {
      const diffMs = cursor.getTime() - semesterWeekStart.getTime()
      teachingWeek = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
    }

    weeks.push({
      id: `${primaryMonthKey}-${formatDateToDdMmYyyy(cursor)}`,
      teachingWeek,
      monthKey: primaryMonthKey,
      days,
    })
    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

/** 为表格「年月」列计算 rowspan（连续相同年月合并） */
export function buildCalendarTableRows(weeks) {
  const rows = []
  let index = 0
  while (index < weeks.length) {
    const monthKey = weeks[index].monthKey
    let span = 1
    while (index + span < weeks.length && weeks[index + span].monthKey === monthKey) {
      span += 1
    }
    for (let offset = 0; offset < span; offset += 1) {
      rows.push({
        week: weeks[index + offset],
        monthKey,
        monthRowspan: span,
        showMonthCell: offset === 0,
        isLastInMonthGroup: offset === span - 1,
      })
    }
    index += span
  }
  return rows
}

export function getEventDates(event) {
  const start = parseDdMmYyyy(event.startDate)
  const end = parseDdMmYyyy(event.endDate)
  if (!start || !end) return []
  const dates = []
  const cursor = new Date(start)
  while (cursor <= end) {
    dates.push(formatDateToDdMmYyyy(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function buildEventDateMap(events) {
  const map = new Map()
  events.forEach((event) => {
    getEventDates(event).forEach((dateKey) => {
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey).push(event)
    })
  })
  return map
}

export function createCalendarEventId(events = []) {
  const maxId = events.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  return maxId + 1
}

export function createAttachmentId(attachments = []) {
  const maxId = attachments.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  return maxId + 1
}

export function createEmptyCalendarConfig() {
  return {
    calendarRemarks: '',
    attachments: [],
    events: [],
    weekSettings: createEmptyWeekSettings(),
  }
}

export function loadAllCalendarData() {
  try {
    const raw = localStorage.getItem(CALENDAR_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function loadCalendarConfig(semesterKey) {
  const all = loadAllCalendarData()
  const normalizedKey = formatSemesterPeriodKey(semesterKey)
  const legacyKey = toLegacySemesterPeriodKey(semesterKey)
  const stored = all[normalizedKey] || all[legacyKey]
  if (!stored) return createEmptyCalendarConfig()
  return {
    ...createEmptyCalendarConfig(),
    ...stored,
    weekSettings: normalizeWeekSettings(stored.weekSettings),
  }
}

export function saveCalendarConfig(semesterKey, config) {
  const all = loadAllCalendarData()
  const normalizedKey = formatSemesterPeriodKey(semesterKey)
  const legacyKey = toLegacySemesterPeriodKey(semesterKey)
  if (legacyKey !== normalizedKey && all[legacyKey]) {
    delete all[legacyKey]
  }
  all[normalizedKey] = {
    calendarRemarks: config.calendarRemarks || '',
    attachments: config.attachments || [],
    events: config.events || [],
    weekSettings: normalizeWeekSettings(config.weekSettings),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(all))
}

function areWeekSettingsWithinSemester(settings, semesterRecord) {
  const semStart = parseDdMmYyyy(semesterRecord?.startDate)
  const semEnd = parseDdMmYyyy(semesterRecord?.endDate)
  if (!semStart || !semEnd) return false

  const pairs = [
    [settings.teachingWeekStart, settings.teachingWeekEnd],
    [settings.revisionWeekStart, settings.revisionWeekEnd],
    [settings.examinationWeekStart, settings.examinationWeekEnd],
    [settings.semesterBreakStart, settings.semesterBreakEnd],
    [settings.registrationDaysStart, settings.registrationDaysEnd],
    [settings.orientationDayStart, settings.orientationDayEnd],
  ]

  return pairs.every(([startValue, endValue]) => {
    if (!startValue && !endValue) return true
    if (!startValue || !endValue) return false
    const start = parseDdMmYyyy(startValue)
    const end = parseDdMmYyyy(endValue)
    if (!start || !end) return false
    return start >= semStart && end <= semEnd
  })
}

export function needsGeneratedWeekSettings(settings, semesterRecord) {
  const normalized = normalizeWeekSettings(settings)
  if (!semesterRecord) return true
  if (!normalized.examinationWeekStart || !normalized.examinationWeekEnd) return true
  if (
    isLongAcademicSemester(semesterRecord) &&
    (!normalized.revisionWeekStart || !normalized.revisionWeekEnd)
  ) {
    return true
  }
  // 旧缓存日期超出当前学期起止时，按学期校历重新生成
  if (!areWeekSettingsWithinSemester(normalized, semesterRecord)) return true
  return false
}

export function resolveWeekSettingsForSemester(semesterKey, settings = null) {
  const record = findSemesterRecordByKey(semesterKey)
  const normalized = normalizeWeekSettings(settings)
  if (!needsGeneratedWeekSettings(normalized, record)) return normalized
  return buildDefaultWeekSettingsFromSemester(record)
}

export function loadWeekSettingsForSemester(semesterKey) {
  const stored = loadCalendarConfig(semesterKey)
  return resolveWeekSettingsForSemester(semesterKey, stored.weekSettings)
}

/** 为全部学期补齐 / 校正默认时段（与学期起止不一致时重算） */
export function seedDefaultWeekSettingsForAllSemesters(records = initialSemesterRecords) {
  records.forEach((record) => {
    const key = buildSemesterPeriodKey(record.academicYear, record.semester)
    const existing = loadCalendarConfig(key)
    if (!needsGeneratedWeekSettings(existing.weekSettings, record)) return
    const nextSettings = buildDefaultWeekSettingsFromSemester(record)
    saveWeekSettingsForSemester(key, nextSettings)
  })
}

export function saveWeekSettingsForSemester(semesterKey, weekSettings) {
  const existing = loadCalendarConfig(semesterKey)
  saveCalendarConfig(semesterKey, {
    ...existing,
    weekSettings: normalizeWeekSettings(weekSettings),
  })
}

export function getDefaultCalendarConfig(semesterKey) {
  const normalizedKey = formatSemesterPeriodKey(semesterKey)
  const semesterRecord = findSemesterRecordByKey(normalizedKey)
  const weekSettings = buildDefaultWeekSettingsFromSemester(semesterRecord)

  if (normalizedKey === '2025/09') {
    return {
      calendarRemarks: '',
      attachments: [],
      weekSettings,
      events: [
        {
          id: 1,
          holidayName: 'Public Holiday',
          startDate: '25/12/2025',
          endDate: '25/12/2025',
          remarks: '',
        },
        {
          id: 2,
          holidayName: 'Public Holiday',
          startDate: '01/01/2026',
          endDate: '01/01/2026',
          remarks: 'New Year',
        },
      ],
    }
  }

  return {
    ...createEmptyCalendarConfig(),
    weekSettings,
  }
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA
}

export function validateWeekSettingsForm(form, semesterRecord) {
  const errors = {}
  const settings = normalizeWeekSettings(form)

  const requirePair = (startKey, endKey, label) => {
    const startValue = settings[startKey]
    const endValue = settings[endKey]
    if (!startValue && !endValue) return
    if (!startValue) {
      errors[startKey] = `${label} start date is required`
      return
    }
    if (!endValue) {
      errors[endKey] = `${label} end date is required`
      return
    }
    if (!isValidDdMmYyyy(startValue)) {
      errors[startKey] = 'Start Date format must be dd/mm/yyyy'
      return
    }
    if (!isValidDdMmYyyy(endValue)) {
      errors[endKey] = 'End Date format must be dd/mm/yyyy'
      return
    }
    const start = parseDdMmYyyy(startValue)
    const end = parseDdMmYyyy(endValue)
    if (start && end && end < start) {
      errors[endKey] = 'End Date must be on or after Start Date'
    }
  }

  if (!settings.teachingWeekStart?.trim()) {
    errors.teachingWeekStart = 'Teaching week start date is required'
  } else if (!isValidDdMmYyyy(settings.teachingWeekStart)) {
    errors.teachingWeekStart = 'Start Date format must be dd/mm/yyyy'
  }

  if (!settings.teachingWeekEnd?.trim()) {
    errors.teachingWeekEnd = 'Teaching week end date is required'
  } else if (!isValidDdMmYyyy(settings.teachingWeekEnd)) {
    errors.teachingWeekEnd = 'End Date format must be dd/mm/yyyy'
  }

  if (
    !errors.teachingWeekStart &&
    !errors.teachingWeekEnd &&
    settings.teachingWeekStart &&
    settings.teachingWeekEnd
  ) {
    const start = parseDdMmYyyy(settings.teachingWeekStart)
    const end = parseDdMmYyyy(settings.teachingWeekEnd)
    if (start && end && end < start) {
      errors.teachingWeekEnd = 'End Date must be on or after Start Date'
    }
    if (semesterRecord && start && end) {
      const semesterStart = parseDdMmYyyy(semesterRecord.startDate)
      const semesterEnd = parseDdMmYyyy(semesterRecord.endDate)
      if (semesterStart && semesterEnd && (start < semesterStart || end > semesterEnd)) {
        errors.teachingWeekEnd =
          'Teaching weeks must be within the selected Academic Year & Semester range'
      }
    }
  }

  requirePair('revisionWeekStart', 'revisionWeekEnd', 'Revision Week')
  requirePair('examinationWeekStart', 'examinationWeekEnd', 'Examination Week')
  requirePair('semesterBreakStart', 'semesterBreakEnd', 'Semester Break')

  const optionalRanges = [
    ['revisionWeekStart', 'revisionWeekEnd'],
    ['examinationWeekStart', 'examinationWeekEnd'],
    ['semesterBreakStart', 'semesterBreakEnd'],
  ]
  if (semesterRecord) {
    const semesterStart = parseDdMmYyyy(semesterRecord.startDate)
    const semesterEnd = parseDdMmYyyy(semesterRecord.endDate)
    optionalRanges.forEach(([startKey, endKey]) => {
      if (errors[startKey] || errors[endKey]) return
      const startValue = settings[startKey]
      const endValue = settings[endKey]
      if (!startValue || !endValue) return
      const start = parseDdMmYyyy(startValue)
      const end = parseDdMmYyyy(endValue)
      if (semesterStart && semesterEnd && start && end && (start < semesterStart || end > semesterEnd)) {
        errors[endKey] = 'Dates must be within the selected Academic Year & Semester range'
      }
    })
  }

  const periodRanges = [
    {
      key: 'teachingWeeks',
      startKey: 'teachingWeekStart',
      endKey: 'teachingWeekEnd',
      labelKey: 'Teaching Weeks',
    },
    ...weekPeriodDefinitions.map((def) => ({
      key: def.key,
      startKey: def.startField,
      endKey: def.endField,
      labelKey: def.labelKey,
    })),
  ]

  const resolvedRanges = []
  periodRanges.forEach((period) => {
    if (errors[period.startKey] || errors[period.endKey]) return
    const startValue = settings[period.startKey]
    const endValue = settings[period.endKey]
    if (!startValue || !endValue) return
    const start = parseDdMmYyyy(startValue)
    const end = parseDdMmYyyy(endValue)
    if (!start || !end) return
    resolvedRanges.push({ ...period, start, end })
  })

  for (let i = 0; i < resolvedRanges.length; i += 1) {
    for (let j = i + 1; j < resolvedRanges.length; j += 1) {
      const left = resolvedRanges[i]
      const right = resolvedRanges[j]
      if (!rangesOverlap(left.start, left.end, right.start, right.end)) continue
      if (!errors[right.endKey]) {
        errors[right.endKey] = 'Period dates must not overlap with other periods'
      }
      if (!errors[left.endKey]) {
        errors[left.endKey] = 'Period dates must not overlap with other periods'
      }
    }
  }

  return errors
}

export function validateCalendarEventForm(form, semesterRecord, allEvents, excludeId = null) {
  const errors = {}
  if (!form.holidayName) {
    errors.holidayName = 'Holiday Name is required'
  } else if (!holidayNameOptions.includes(form.holidayName)) {
    errors.holidayName = 'Holiday Name is invalid'
  }

  if (!form.startDate?.trim()) {
    errors.startDate = 'Start Date is required'
  } else if (!isValidDdMmYyyy(form.startDate)) {
    errors.startDate = 'Start Date format must be dd/mm/yyyy'
  }

  if (!form.endDate?.trim()) {
    errors.endDate = 'End Date is required'
  } else if (!isValidDdMmYyyy(form.endDate)) {
    errors.endDate = 'End Date format must be dd/mm/yyyy'
  }

  if (
    !errors.startDate &&
    !errors.endDate &&
    form.startDate?.trim() &&
    form.endDate?.trim()
  ) {
    const start = parseDdMmYyyy(form.startDate)
    const end = parseDdMmYyyy(form.endDate)
    if (start && end && end < start) {
      errors.endDate = 'End Date must be on or after Start Date'
    }
    if (semesterRecord && start && end) {
      const semesterStart = parseDdMmYyyy(semesterRecord.startDate)
      const semesterEnd = parseDdMmYyyy(semesterRecord.endDate)
      if (semesterStart && semesterEnd && (start < semesterStart || end > semesterEnd)) {
        errors.endDate = 'Event dates must be within the selected Academic Year & Semester range'
      }
    }
  }

  if (form.remarks && form.remarks.length > MAX_EVENT_REMARKS) {
    errors.remarks = `Remarks must be within ${MAX_EVENT_REMARKS} characters`
  }

  if (
    !errors.startDate &&
    !errors.endDate &&
    form.startDate &&
    form.endDate &&
    semesterRecord
  ) {
    const nextDates = getEventDates({
      startDate: form.startDate,
      endDate: form.endDate,
    })
    const conflict = allEvents.some((event) => {
      if (excludeId != null && event.id === excludeId) return false
      const existingDates = getEventDates(event)
      return nextDates.some((dateKey) => existingDates.includes(dateKey))
    })
    if (conflict) {
      errors.startDate = 'Event dates overlap with an existing activity'
    }
  }

  return errors
}

export function validateCalendarSave(payload) {
  const errors = []

  if (!payload.semesterKey) {
    errors.push('Academic Year & Semester is required')
    return errors
  }

  if (!payload.semesterRecord) {
    errors.push('Selected Academic Year & Semester is not configured')
    return errors
  }

  if ((payload.calendarRemarks || '').length > MAX_CALENDAR_REMARKS) {
    errors.push(`Calendar Remarks must be within ${MAX_CALENDAR_REMARKS} characters`)
  }

  ;(payload.events || []).forEach((event, index) => {
    const eventErrors = validateCalendarEventForm(event, payload.semesterRecord, payload.events, event.id)
    Object.values(eventErrors).forEach((message) => {
      errors.push({ type: 'event', index: index + 1, message })
    })
  })

  ;(payload.attachments || []).forEach((file, index) => {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      errors.push({ type: 'attachment', index: index + 1, message: 'File size must not exceed 50 MB' })
    }
    if (!file.name?.trim()) {
      errors.push({ type: 'attachment', index: index + 1, message: 'File name is required' })
    }
  })

  if (payload.weekSettings) {
    const filled = Object.values(normalizeWeekSettings(payload.weekSettings)).some(Boolean)
    if (filled) {
      const weekErrors = validateWeekSettingsForm(payload.weekSettings, payload.semesterRecord)
      Object.values(weekErrors).forEach((message) => {
        errors.push({ type: 'weekSettings', message })
      })
    }
  }

  return errors
}

export function buildCalendarSavePayload(semesterKey, semesterRecord, draft) {
  return {
    semesterKey,
    semesterRecord,
    calendarRemarks: draft.calendarRemarks?.trim() || '',
    attachments: (draft.attachments || []).map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      type: item.type || '',
      uploadedAt: item.uploadedAt,
    })),
    events: (draft.events || []).map((item) => ({
      id: item.id,
      holidayName: item.holidayName,
      startDate: item.startDate,
      endDate: item.endDate,
      remarks: item.remarks?.trim() || '',
    })),
    weekSettings: normalizeWeekSettings(draft.weekSettings),
  }
}
