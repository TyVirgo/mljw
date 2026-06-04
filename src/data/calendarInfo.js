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

function getWeekDisplayMonthKey(days) {
  const inRangeDays = days.filter((day) => day.inRange)
  if (!inRangeDays.length) return days[0]?.monthKey || ''

  const monthCounts = {}
  inRangeDays.forEach((day) => {
    monthCounts[day.monthKey] = (monthCounts[day.monthKey] || 0) + 1
  })

  return Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0][0]
}

export function buildCalendarWeeks(semesterRecord) {
  if (!semesterRecord) return []
  const start = parseDdMmYyyy(semesterRecord.startDate)
  const end = parseDdMmYyyy(semesterRecord.endDate)
  if (!start || !end) return []

  const weekStartDay = semesterRecord.weekStartDay || 'Sunday'
  let cursor = alignToWeekStart(start, weekStartDay)
  const weeks = []
  let teachingWeek = 1

  while (cursor <= end) {
    const days = []
    for (let i = 0; i < 7; i += 1) {
      const cellDate = new Date(cursor)
      cellDate.setDate(cursor.getDate() + i)
      const inRange = cellDate >= start && cellDate <= end
      days.push({
        date: cellDate,
        day: cellDate.getDate(),
        dateKey: formatDateToDdMmYyyy(cellDate),
        inRange,
        monthKey: `${cellDate.getFullYear()}${String(cellDate.getMonth() + 1).padStart(2, '0')}`,
      })
    }
    const primaryMonthKey = getWeekDisplayMonthKey(days)

    weeks.push({
      id: teachingWeek,
      teachingWeek,
      monthKey: primaryMonthKey,
      days,
    })
    teachingWeek += 1
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
  return stored ? { ...createEmptyCalendarConfig(), ...stored } : createEmptyCalendarConfig()
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
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(all))
}

export function getDefaultCalendarConfig(semesterKey) {
  const normalizedKey = formatSemesterPeriodKey(semesterKey)
  if (normalizedKey === '2025/09') {
    return {
      calendarRemarks: '',
      attachments: [],
      events: [
        {
          id: 1,
          holidayName: 'Public Holiday',
          startDate: '10/09/2025',
          endDate: '10/09/2025',
          remarks: '',
        },
        {
          id: 2,
          holidayName: 'Public Holiday',
          startDate: '19/09/2025',
          endDate: '19/09/2025',
          remarks: 'Participate in academic conference',
        },
      ],
    }
  }
  return createEmptyCalendarConfig()
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
  }
}
