import * as XLSX from 'xlsx'
import { movementStatisticsExportColumnMeta } from '../data/movementStatisticsExportFields.js'

export function formatStatisticsExportRow(row, index) {
  return {
    no: index + 1,
    schoolCode: row.schoolCode || '',
    programmeCode: row.programmeCode || '',
    intake: row.intake || '',
    programmeTransfer: row.programmeTransfer ?? 0,
    deferment: row.deferment ?? 0,
    withdrawal: row.withdrawal ?? 0,
    resumption: row.resumption ?? 0,
    outboundMobility: row.outboundMobility ?? 0,
    expel: row.expel ?? 0,
    incomplete: row.incomplete ?? 0,
    completion: row.completion ?? 0,
    completionWithoutGraduation: row.completionWithoutGraduation ?? 0,
    inboundMobility: row.inboundMobility ?? 0,
    iep: row.iep ?? 0,
  }
}

export function exportMovementStatisticsToExcel(
  rows,
  filename = 'movement-statistics.xlsx',
  selectedFieldKeys = movementStatisticsExportColumnMeta.map((col) => col.key),
  i18n = {},
  sheetName = 'Movement Statistics',
) {
  const { t = (key) => key } = i18n
  const columns = movementStatisticsExportColumnMeta.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const sheetRows = rows.map((item, index) => {
    const formatted = formatStatisticsExportRow(item, index)
    const row = {}
    columns.forEach((col) => {
      const header = col.labelKey ? t(col.labelKey) : col.key
      row[header] = formatted[col.key] ?? ''
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}
