import * as XLSX from 'xlsx'

export const programmeIntakeExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'programmeIntake', header: 'Programme Intake', width: 18 },
  { key: 'intake', header: 'Intake', width: 12 },
  { key: 'years', header: 'Years', width: 10 },
  { key: 'programmeCode', header: 'Programme Code', width: 16 },
  { key: 'programmeName', header: 'Programme Name', width: 42 },
  { key: 'school', header: 'School', width: 34 },
  { key: 'active', header: 'Active', width: 10 },
]

function formatRow(item, index) {
  return {
    no: index + 1,
    programmeIntake: item.programmeIntake,
    intake: item.intake,
    years: item.years,
    programmeCode: item.programmeCode,
    programmeName: item.programmeName,
    school: item.school,
    active: item.active,
  }
}

export function exportProgrammeIntakesToExcel(
  rows,
  filename = 'programme-intake.xlsx',
  selectedFieldKeys = programmeIntakeExportColumns.map((col) => col.key),
) {
  const columns = programmeIntakeExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Programme Intake')
  XLSX.writeFile(workbook, filename)
}

export const programmeIntakeExportFields = programmeIntakeExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
