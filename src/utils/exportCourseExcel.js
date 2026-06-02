import * as XLSX from 'xlsx'
import {
  getOfferingLabel,
  getCourseOwnerLabel,
} from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'

export const courseExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'courseCode', header: 'Course Code', width: 14 },
  { key: 'courseName', header: 'Course Name', width: 36 },
  { key: 'offering', header: 'Offering Unit', width: 34 },
  { key: 'courseOwner', header: 'Course Owner', width: 24 },
  { key: 'courseClassification', header: 'Course Classification', width: 22 },
  { key: 'credit', header: 'Credit', width: 10 },
  { key: 'mediumOfInstruction', header: 'Medium of Instruction', width: 22 },
  { key: 'semesterType', header: 'Semester Type', width: 14 },
]

function formatRow(item, index) {
  return {
    no: index + 1,
    courseCode: item.courseCode,
    courseName: item.courseName,
    offering: getOfferingLabel(item.offering, initialDepartments),
    courseOwner: getCourseOwnerLabel(item.courseOwner),
    courseClassification: item.courseClassification,
    credit: item.credit,
    mediumOfInstruction: item.mediumOfInstruction,
    semesterType: item.semesterType,
  }
}

export function exportCoursesToExcel(
  rows,
  filename = 'course-information.xlsx',
  selectedFieldKeys = courseExportColumns.map((col) => col.key),
) {
  const columns = courseExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Course Info')
  XLSX.writeFile(workbook, filename)
}

export const courseExportFields = courseExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
