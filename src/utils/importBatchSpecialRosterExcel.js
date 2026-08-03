import * as XLSX from 'xlsx'

const TEMPLATE_FILENAME = 'batch-special-roster-import-template.xlsx'

const STUDENT_ID_HEADERS = new Set(['student id', 'studentid', '学号', '學生編號'])

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function isStudentIdHeader(value) {
  const h = normalizeHeader(value)
  if (STUDENT_ID_HEADERS.has(h)) return true
  if (h.includes('学号')) return true
  if (h.includes('student') && h.includes('id')) return true
  return false
}

export function downloadBatchSpecialRosterImportTemplate(t) {
  const translate = typeof t === 'function' ? t : (key) => key
  const headers = [
    translate('courseRegistration.monitor.studentId'),
    translate('courseRegistration.monitor.studentName'),
  ]
  const sample = ['BUS2409021', 'Sample Student']
  const sheet = XLSX.utils.aoa_to_sheet([headers, sample])
  sheet['!cols'] = [{ wch: 14 }, { wch: 18 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Special')
  XLSX.writeFile(workbook, TEMPLATE_FILENAME)
}

/**
 * @param {File} file
 * @returns {Promise<{ studentIds: string[], error?: string }>}
 */
export function parseBatchSpecialRosterImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          resolve({ studentIds: [], error: 'empty' })
          return
        }
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        if (!rows.length) {
          resolve({ studentIds: [], error: 'empty' })
          return
        }
        const headerRow = rows[0].map((cell) => String(cell || ''))
        let idCol = headerRow.findIndex((cell) => isStudentIdHeader(cell))
        if (idCol < 0) idCol = 0
        const studentIds = []
        for (let i = 1; i < rows.length; i += 1) {
          const id = String(rows[i]?.[idCol] || '').trim()
          if (id) studentIds.push(id)
        }
        if (!studentIds.length) {
          resolve({ studentIds: [], error: 'empty' })
          return
        }
        resolve({ studentIds })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
