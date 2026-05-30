import * as XLSX from 'xlsx'

export const codeSetExportFields = [
  { key: 'nodeCode', label: 'Node Code' },
  { key: 'nodeName', label: 'Node Name' },
  { key: 'code', label: 'Code' },
  { key: 'codeName', label: 'Code Name' },
  { key: 'parentCode', label: 'Parent Code' },
]

export function exportCodeSetsToExcel(rows, filename = 'code-set-export.xlsx', fields = codeSetExportFields) {
  const exportFields = fields?.length ? fields : codeSetExportFields
  const header = exportFields.map((field) => field.label)
  const body = rows.map((row) =>
    exportFields.map((field) => {
      const value = row[field.key]
      if (field.key === 'parentCode') return value?.trim() ? value : '--'
      return value ?? ''
    }),
  )
  const sheet = XLSX.utils.aoa_to_sheet([header, ...body])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Code Sets')
  XLSX.writeFile(workbook, filename)
}
