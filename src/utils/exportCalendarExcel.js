import * as XLSX from 'xlsx'
import { buildCalendarTableRows, buildEventDateMap } from '../data/calendarInfo.js'

const SHEET_NAME_MAX = 31

function truncateSheetName(name) {
  const text = String(name || 'Sheet')
  return text.length > SHEET_NAME_MAX ? text.slice(0, SHEET_NAME_MAX) : text
}

function formatFileSize(size) {
  if (size == null || Number.isNaN(Number(size))) return ''
  const n = Number(size)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatUploadedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDayCell(day, eventDateMap, tr) {
  if (!day.inRange) return String(day.day)
  const dayEvents = eventDateMap.get(day.dateKey) || []
  if (!dayEvents.length) return String(day.day)
  const eventText = dayEvents
    .map((event) => {
      let text = tr(event.holidayName)
      if (event.remarks) text += ` (${event.remarks})`
      return text
    })
    .join('; ')
  return `${day.day} | ${eventText}`
}

function buildSummarySheet(semesterKey, semesterRecord, calendarRemarks, tr) {
  const rows = [
    [tr('Academic Year & Semester'), semesterKey],
    [tr('Semester Type'), semesterRecord?.semesterType ? tr(semesterRecord.semesterType) : ''],
    [tr('Start Date'), semesterRecord?.startDate || ''],
    [tr('End Date'), semesterRecord?.endDate || ''],
    [tr('Week Start Day'), semesterRecord?.weekStartDay ? tr(semesterRecord.weekStartDay) : ''],
    [tr('Calendar Remarks'), calendarRemarks || ''],
    [tr('Exported At'), formatUploadedAt(new Date().toISOString())],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [{ wch: 28 }, { wch: 64 }]
  return worksheet
}

function buildCalendarGridSheet(weeks, weekdayLabels, eventDateMap, tr) {
  const yearMonthLabel = tr('Year/Month')
  const teachingWeekLabel = tr('Teaching Week')
  const tableRows = buildCalendarTableRows(weeks)

  const rows = tableRows.map((row) => {
    const record = {
      [yearMonthLabel]: row.showMonthCell ? row.monthKey : '',
      [teachingWeekLabel]: row.week.teachingWeek,
    }
    row.week.days.forEach((day, index) => {
      record[weekdayLabels[index]] = formatDayCell(day, eventDateMap, tr)
    })
    return record
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const colWidths = [{ wch: 14 }, { wch: 12 }, ...weekdayLabels.map(() => ({ wch: 22 }))]
  worksheet['!cols'] = colWidths
  return worksheet
}

function buildEventsSheet(events, tr) {
  const rows = (events || []).map((event, index) => ({
    [tr('No.')]: index + 1,
    [tr('Holiday Name')]: tr(event.holidayName),
    [tr('Start Date')]: event.startDate || '',
    [tr('End Date')]: event.endDate || '',
    [tr('Remarks')]: event.remarks || '',
  }))

  if (!rows.length) {
    rows.push({
      [tr('No.')]: '',
      [tr('Holiday Name')]: '',
      [tr('Start Date')]: '',
      [tr('End Date')]: '',
      [tr('Remarks')]: '',
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 40 }]
  return worksheet
}

function buildAttachmentsSheet(attachments, tr) {
  const rows = (attachments || []).map((file, index) => ({
    [tr('No.')]: index + 1,
    [tr('File Name')]: file.name || '',
    [tr('File Size')]: formatFileSize(file.size),
    [tr('File Type')]: file.type || '',
    [tr('Uploaded At')]: formatUploadedAt(file.uploadedAt),
  }))

  if (!rows.length) {
    rows.push({
      [tr('No.')]: '',
      [tr('File Name')]: '',
      [tr('File Size')]: '',
      [tr('File Type')]: '',
      [tr('Uploaded At')]: '',
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 12 }, { wch: 24 }, { wch: 20 }]
  return worksheet
}

/**
 * 导出当前学年学期校历（教学周、节假日/活动、备注、附件元数据）
 * @returns {boolean} 是否成功触发下载
 */
export function exportCalendarToExcel({
  semesterKey,
  semesterRecord,
  calendarRemarks = '',
  attachments = [],
  events = [],
  weeks = [],
  weekdayLabels = [],
  tr,
  filename,
}) {
  if (!semesterKey || !weeks.length || typeof tr !== 'function') {
    return false
  }

  const eventDateMap = buildEventDateMap(events)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    buildSummarySheet(semesterKey, semesterRecord, calendarRemarks, tr),
    truncateSheetName(tr('Calendar Summary')),
  )
  XLSX.utils.book_append_sheet(
    workbook,
    buildCalendarGridSheet(weeks, weekdayLabels, eventDateMap, tr),
    truncateSheetName(tr('Calendar Grid')),
  )
  XLSX.utils.book_append_sheet(
    workbook,
    buildEventsSheet(events, tr),
    truncateSheetName(tr('Activities & Holidays')),
  )
  XLSX.utils.book_append_sheet(
    workbook,
    buildAttachmentsSheet(attachments, tr),
    truncateSheetName(tr('Attachment List')),
  )

  const safeName =
    filename ||
    `calendar-${String(semesterKey).replace('/', '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, safeName)
  return true
}
