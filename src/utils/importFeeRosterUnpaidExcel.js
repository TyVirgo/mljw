import * as XLSX from 'xlsx'

const TEMPLATE_FILENAME = 'fee-roster-unpaid-import-template.xlsx'

const STUDENT_ID_HEADERS = new Set([
  'student id',
  'studentid',
  '学号',
  '學生編號',
  '學生学号',
])

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

/** 下载未缴费扩名单导入模板 */
export function downloadFeeRosterUnpaidImportTemplate(t) {
  const translate = typeof t === 'function' ? t : (key) => key
  const headers = [
    translate('courseRegistration.monitor.studentId'),
    translate('courseRegistration.monitor.studentName'),
    translate('courseRegistration.monitor.intake'),
    translate('courseRegistration.feeRoster.academicSession'),
  ]
  const sample = ['FIN2409028', 'Brian Koh', '2024/09', '2025/04']
  const note = [
    translate('courseRegistration.feeRoster.unpaidImportTemplateSampleNote'),
    '',
    '',
    '',
  ]
  const sheet = XLSX.utils.aoa_to_sheet([headers, sample, note])
  sheet['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 14 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Unpaid')
  XLSX.writeFile(workbook, TEMPLATE_FILENAME)
}

/**
 * 解析未缴费扩名单文件（学号列）
 * @param {File} file
 * @returns {Promise<{ studentIds: string[], error?: string }>}
 */
export function parseFeeRosterUnpaidImportFile(file) {
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

        const headerRow = rows[0].map(normalizeHeader)
        let idCol = headerRow.findIndex((h) => isStudentIdHeader(h))
        if (idCol < 0 && rows.length > 1 && String(rows[1][0] || '').trim()) {
          idCol = 0
        }
        if (idCol < 0) {
          resolve({ studentIds: [], error: 'noStudentIdColumn' })
          return
        }

        const dataStart = isStudentIdHeader(headerRow[idCol]) ? 1 : 0
        const ids = []
        for (let i = dataStart; i < rows.length; i += 1) {
          const raw = String(rows[i][idCol] ?? '').trim()
          if (!raw) continue
          if (isStudentIdHeader(raw)) continue
          if (raw.includes('示例') || raw.toLowerCase().includes('sample')) continue
          ids.push(raw)
        }

        resolve({ studentIds: [...new Set(ids)] })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error || new Error('read failed'))
    reader.readAsArrayBuffer(file)
  })
}
