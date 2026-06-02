import * as XLSX from 'xlsx'
import { formatDisplayDate } from '../data/semesterInfo.js'

export const semesterRecordExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'academicYear', header: 'Academic Year', width: 14 },
  { key: 'semester', header: 'Semester', width: 12 },
  { key: 'semesterType', header: 'Semester Type', width: 16 },
  { key: 'startDate', header: 'Start Date', width: 14 },
  { key: 'endDate', header: 'End Date', width: 14 },
  { key: 'currentSemester', header: 'Current Semester', width: 18 },
  { key: 'generateCalendar', header: 'Generate Academic Calendar', width: 26 },
  { key: 'weekStartDay', header: 'Week Start Day', width: 16 },
]

function formatRow(item, index) {
  return {
    no: index + 1,
    academicYear: item.academicYear,
    semester: item.semester,
    semesterType: item.semesterType,
    startDate: formatDisplayDate(item.startDate),
    endDate: formatDisplayDate(item.endDate),
    currentSemester: item.currentSemester,
    generateCalendar: item.generateCalendar,
    weekStartDay: item.weekStartDay,
  }
}

export function exportSemesterRecordsToExcel(
  rows,
  filename = 'academic-year-semester.xlsx',
  selectedFieldKeys = semesterRecordExportColumns.map((col) => col.key),
) {
  const columns = semesterRecordExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const sheetRows = rows.map((item, index) => {
    const formatted = formatRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key]
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Academic Year & Semester')
  XLSX.writeFile(workbook, filename)
}

export const semesterRecordExportFields = semesterRecordExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
