import * as XLSX from 'xlsx'
import { formatDateDisplay } from '../data/lecturers.js'

export const lecturerExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'staffId', header: 'Staff ID', width: 14 },
  { key: 'name', header: 'Name', width: 24 },
  { key: 'gender', header: 'Gender', width: 10 },
  { key: 'category', header: 'Category', width: 22 },
  { key: 'department', header: 'Department', width: 36 },
  { key: 'academicQualificationHighest', header: 'Academic Qualification (Highest)', width: 28 },
  { key: 'title', header: 'Title', width: 14 },
  { key: 'academicPosition', header: 'Academic Position', width: 22 },
  { key: 'degree', header: 'Degree', width: 22 },
  { key: 'employmentStatus', header: 'Employment Status', width: 18 },
  { key: 'dateOfJoining', header: 'Date of Joining', width: 16 },
]

function formatLecturerRow(item, index) {
  return {
    no: index + 1,
    staffId: item.staffId,
    name: item.name,
    gender: item.gender,
    category: item.category,
    department: item.department,
    academicQualificationHighest: item.academicQualificationHighest,
    title: item.title,
    academicPosition: item.academicPosition,
    degree: item.degree,
    employmentStatus: item.employmentStatus,
    dateOfJoining: formatDateDisplay(item.dateOfJoining),
  }
}

export function exportLecturersToExcel(
  lecturers,
  filename = 'lecturer-information.xlsx',
  selectedFieldKeys = lecturerExportColumns.map((col) => col.key),
) {
  const columns = lecturerExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const rows = lecturers.map((item, index) => {
    const formatted = formatLecturerRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key]
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lecturer Info')
  XLSX.writeFile(workbook, filename)
}

export const lecturerExportFields = lecturerExportColumns
  .filter((col) => col.key !== 'no')
  .map((col) => ({
    key: col.key,
    label: col.header,
  }))
