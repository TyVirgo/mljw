import * as XLSX from 'xlsx'

export const blockExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'blockNo', header: 'Block No.', width: 14 },
  { key: 'blockName', header: 'Block Name', width: 28 },
  { key: 'floor', header: 'Floor', width: 24 },
]

function formatBlockRow(item, index) {
  return {
    no: index + 1,
    blockNo: item.blockNo,
    blockName: item.blockName,
    floor: item.floors.join(', '),
  }
}

/**
 * Export block list to Excel (.xlsx)
 * @param {Array} blocks
 * @param {string} filename
 * @param {string[]} selectedFieldKeys
 */
export function exportBlocksToExcel(
  blocks,
  filename = 'block-management.xlsx',
  selectedFieldKeys = blockExportColumns.map((col) => col.key),
) {
  const columns = blockExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const rows = blocks.map((item, index) => {
    const formatted = formatBlockRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key]
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Block Management')
  XLSX.writeFile(workbook, filename)
}

export const blockExportFields = blockExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
