import * as XLSX from 'xlsx'
import { getOfferingLabel } from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'

export const courseApplicationExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'status', header: 'Status', width: 16 },
  { key: 'approvalStage', header: 'Approval Stage', width: 20 },
  { key: 'courseName', header: 'Course Name', width: 36 },
  { key: 'offering', header: 'Offering', width: 34 },
  { key: 'courseClassification', header: 'Course Classification', width: 22 },
  { key: 'credit', header: 'Credit', width: 10 },
  { key: 'applicant', header: 'Applicant', width: 24 },
  { key: 'applicationDateTime', header: 'Application Date and Time', width: 24 },
]

export const courseApplicationExportFields = courseApplicationExportColumns
  .filter((col) => col.key !== 'no')
  .map((col) => ({ key: col.key, label: col.header }))

function mapRow(item, index) {
  return {
    no: index + 1,
    status: item.status,
    approvalStage: item.approvalStage,
    courseName: item.courseName,
    offering: getOfferingLabel(item.offering, initialDepartments),
    courseClassification: item.courseClassification,
    credit: item.credit,
    applicant: item.applicant,
    applicationDateTime: item.applicationDateTime,
  }
}

export function exportCourseApplicationsToExcel(
  items,
  filename = 'course-application.xlsx',
  selectedFieldKeys = courseApplicationExportFields.map((f) => f.key),
) {
  const columns = courseApplicationExportColumns.filter((col) => selectedFieldKeys.includes(col.key) || col.key === 'no')
  const rows = items.map((item, index) => {
    const mapped = mapRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = mapped[col.key] ?? ''
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Course Application')
  XLSX.writeFile(workbook, filename)
}
