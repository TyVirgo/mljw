import * as XLSX from 'xlsx'
import { feeRosterStudentExportFields } from '../data/courseRegistration/courseRegistrationExportFields.js'

const TEMPLATE_FILENAME = 'fee-roster-paid-import-template.xlsx'

/** 学号列头别名（含导出回传） */
const STUDENT_ID_HEADERS = new Set([
  'student id',
  'studentid',
  '学号',
  '學生編號',
  '學生学号',
])

/** 姓名列头别名 */
const STUDENT_NAME_HEADERS = new Set([
  'student name',
  'studentname',
  'name',
  '姓名',
  '学生姓名',
  '學生姓名',
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

function isStudentNameHeader(value) {
  const h = normalizeHeader(value)
  if (STUDENT_NAME_HEADERS.has(h)) return true
  if (h.includes('姓名') || h === 'name') return true
  if (h.includes('student') && h.includes('name')) return true
  return false
}

/**
 * 下载已缴费导入模板（列与未缴费导出学生字段一致，不含导入时间）
 * @param {(key: string) => string} t
 */
export function downloadFeeRosterPaidImportTemplate(t) {
  const translate = typeof t === 'function' ? t : (key) => key
  const headers = feeRosterStudentExportFields.map((col) => translate(col.labelKey))
  const sample = [
    'COS2409001',
    'Ahmad bin Ali',
    'COS',
    '2024/09',
    '2025/04',
    4,
    14,
    12,
    20,
    2,
    'N',
    translate('common.yes'),
  ]
  const note = [
    translate('courseRegistration.feeRoster.importTemplateSampleNote'),
    ...Array(headers.length - 1).fill(''),
  ]
  const sheet = XLSX.utils.aoa_to_sheet([headers, sample, note])
  sheet['!cols'] = headers.map(() => ({ wch: 14 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Paid')
  XLSX.writeFile(workbook, TEMPLATE_FILENAME)
}

/**
 * 解析已缴费导入文件：学号 + 姓名（可回传导出 Sheet1 或模板）
 * @param {File} file
 * @returns {Promise<{ entries: Array<{ studentId: string, studentName: string }>, studentIds: string[], error?: string }>}
 */
export function parseFeeRosterPaidImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          resolve({ entries: [], studentIds: [], error: 'empty' })
          return
        }
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        if (!rows.length) {
          resolve({ entries: [], studentIds: [], error: 'empty' })
          return
        }

        const headerRow = rows[0].map(normalizeHeader)
        let idCol = headerRow.findIndex((h) => isStudentIdHeader(h))
        let nameCol = headerRow.findIndex((h) => isStudentNameHeader(h))
        if (idCol < 0 && rows.length > 1 && String(rows[1][0] || '').trim()) {
          idCol = 0
        }
        if (nameCol < 0 && idCol === 0) {
          nameCol = 1
        }
        if (idCol < 0) {
          resolve({ entries: [], studentIds: [], error: 'noStudentIdColumn' })
          return
        }
        if (nameCol < 0) {
          resolve({ entries: [], studentIds: [], error: 'noStudentNameColumn' })
          return
        }

        const dataStart = isStudentIdHeader(headerRow[idCol]) ? 1 : 0
        const entries = []
        const seen = new Set()
        for (let i = dataStart; i < rows.length; i += 1) {
          const rawId = String(rows[i][idCol] ?? '').trim()
          const rawName = String(rows[i][nameCol] ?? '').trim()
          if (!rawId) continue
          if (isStudentIdHeader(rawId)) continue
          // 跳过模板说明行（非学号形态）
          if (rawId.includes('示例') || rawId.toLowerCase().includes('sample')) continue
          if (!rawName) continue
          const key = `${rawId.toLowerCase()}|${rawName.toLowerCase()}`
          if (seen.has(key)) continue
          seen.add(key)
          entries.push({ studentId: rawId, studentName: rawName })
        }

        resolve({
          entries,
          // 兼容旧调用方仅读 studentIds
          studentIds: [...new Set(entries.map((e) => e.studentId))],
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error || new Error('read failed'))
    reader.readAsArrayBuffer(file)
  })
}
