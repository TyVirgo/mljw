import * as XLSX from 'xlsx'
import { formatReportTo } from '../data/departments.js'

export const departmentExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'deptId', header: 'ID', width: 14 },
  { key: 'code', header: 'Code', width: 10 },
  { key: 'nameEn', header: 'Department Name', width: 36 },
  { key: 'nameZh', header: 'Department Name (Chinese)', width: 24 },
  { key: 'category', header: 'Category', width: 14 },
  { key: 'reportTo', header: 'Report to', width: 12 },
  { key: 'offering', header: 'Offering', width: 10 },
  { key: 'teaching', header: 'Teaching', width: 10 },
  { key: 'active', header: 'Active', width: 10 },
]

function formatDepartmentRow(item, index) {
  return {
    no: index + 1,
    deptId: item.deptId,
    code: item.code,
    nameEn: item.nameEn,
    nameZh: item.nameZh,
    category: item.category,
    reportTo: formatReportTo(item.reportTo),
    offering: item.offering,
    teaching: item.teaching,
    active: item.active,
  }
}

export function exportDepartmentsToExcel(
  departments,
  filename = 'department-info.xlsx',
  selectedFieldKeys = departmentExportColumns.map((col) => col.key),
) {
  const columns = departmentExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const rows = departments.map((item, index) => {
    const formatted = formatDepartmentRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key]
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Department Info')
  XLSX.writeFile(workbook, filename)
}

export const departmentExportFields = departmentExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
