import * as XLSX from 'xlsx'

export const intakeSetExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'code', header: 'Code', width: 12 },
  { key: 'intake', header: 'Intake', width: 14 },
  { key: 'active', header: 'Active', width: 12 },
]

function formatRow(item, index) {
  return {
    no: index + 1,
    code: item.code,
    intake: item.intake,
    active: item.active,
  }
}

export function exportIntakeSetsToExcel(
  rows,
  filename = 'intake-set.xlsx',
  selectedFieldKeys = intakeSetExportColumns.map((col) => col.key),
) {
  const columns = intakeSetExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Intake Set')
  XLSX.writeFile(workbook, filename)
}

export const intakeSetExportFields = intakeSetExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
