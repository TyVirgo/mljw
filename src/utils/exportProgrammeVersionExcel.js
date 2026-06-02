import * as XLSX from 'xlsx'

export const programmeVersionExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'code', header: 'Programme Code', width: 18 },
  { key: 'name', header: 'Programme Name', width: 42 },
  { key: 'level', header: 'Programme Level', width: 16 },
  { key: 'years', header: 'Years', width: 10 },
  { key: 'mqaCode', header: 'MQA Code', width: 18 },
  { key: 'mqaValidityStart', header: 'MQA Validity Start Date', width: 22 },
  { key: 'mqaValidityExpiry', header: 'MQA Validity Expiry Date', width: 22 },
  { key: 'moheCode', header: 'MOHE Code', width: 18 },
  { key: 'approvalDate', header: 'Approval Date', width: 18 },
  { key: 'moheValidityStart', header: 'MOHE Validity Start Date', width: 22 },
  { key: 'moheValidityExpiry', header: 'MOHE Validity Expiry Date', width: 22 },
]

function getCurrentVersion(programme) {
  if (!programme.versions?.length) return {}
  return programme.versions.find((item) => item.isCurrent) || programme.versions[0]
}

function formatRow(item, index) {
  const version = getCurrentVersion(item)
  return {
    no: index + 1,
    code: item.code,
    name: item.name,
    level: item.level,
    years: item.years,
    mqaCode: version.mqaCode || '',
    mqaValidityStart: version.mqaValidityStart || '',
    mqaValidityExpiry: version.mqaValidityExpiry || '',
    moheCode: version.moheCode || '',
    approvalDate: version.approvalDate || '',
    moheValidityStart: version.moheValidityStart || '',
    moheValidityExpiry: version.moheValidityExpiry || '',
  }
}

/**
 * Export programme version list to Excel (.xlsx)
 * @param {Array} programmes
 * @param {string} filename
 * @param {string[]} selectedFieldKeys
 */
export function exportProgrammeVersionsToExcel(
  programmes,
  filename = 'programme-version.xlsx',
  selectedFieldKeys = programmeVersionExportColumns.map((col) => col.key),
) {
  const columns = programmeVersionExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const rows = programmes.map((item, index) => {
    const formatted = formatRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key]
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Programme Version')
  XLSX.writeFile(workbook, filename)
}

export const programmeVersionExportFields = programmeVersionExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
