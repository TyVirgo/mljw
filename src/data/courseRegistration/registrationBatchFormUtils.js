const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const LEGACY_SEMESTER_MAP = {
  '2504 Long Semester': '2025/04',
  '2502 Long Semester': '2025/02',
  '2506 Short Semester': '2026/02',
}

/** 与学籍/异动模块一致的学年学期选项 */
export const registrationAcademicSessionOptions = [
  '2023/04',
  '2023/09',
  '2024/02',
  '2024/04',
  '2024/09',
  '2025/02',
  '2025/04',
  '2025/09',
  '2026/02',
]

export function normalizeBatchAcademicSession(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return LEGACY_SEMESTER_MAP[raw] || raw
}

/** 批次存储格式 25-Aug-2025 → DatePickerEn 格式 25/08/2025 */
export function batchDateToPicker(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw
  const match = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/)
  if (!match) return raw
  const day = match[1].padStart(2, '0')
  const monthIdx = MONTH_ABBR.findIndex((item) => item.toLowerCase() === match[2].toLowerCase())
  if (monthIdx < 0) return ''
  const month = String(monthIdx + 1).padStart(2, '0')
  return `${day}/${month}/${match[3]}`
}

/** DatePickerEn 格式 → 批次存储格式 */
export function pickerToBatchDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(raw)) return raw
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return raw
  const monthIdx = Number(match[2]) - 1
  if (monthIdx < 0 || monthIdx > 11) return ''
  const abbr = MONTH_ABBR[monthIdx]
  return `${Number(match[1])}-${abbr}-${match[3]}`
}

export function emptyRoundsPicker() {
  return {
    preselect: { start: '', end: '' },
    main: { start: '', end: '' },
    supplement: { start: '', end: '' },
  }
}

export function emptyAddDropWindowPicker() {
  return { start: '', end: '' }
}

export function roundsToPicker(rounds = {}) {
  const keys = ['preselect', 'main', 'supplement']
  const result = emptyRoundsPicker()
  for (const key of keys) {
    result[key] = {
      start: batchDateToPicker(rounds[key]?.start),
      end: batchDateToPicker(rounds[key]?.end),
    }
  }
  return result
}

export function addDropWindowToPicker(window = {}) {
  return {
    start: batchDateToPicker(window.start),
    end: batchDateToPicker(window.end),
  }
}

export function roundsFromPicker(rounds = {}) {
  const keys = ['preselect', 'main', 'supplement']
  const result = {
    preselect: { start: '', end: '' },
    main: { start: '', end: '' },
    supplement: { start: '', end: '' },
  }
  for (const key of keys) {
    result[key] = {
      start: pickerToBatchDate(rounds[key]?.start),
      end: pickerToBatchDate(rounds[key]?.end),
    }
  }
  return result
}

export function addDropWindowFromPicker(window = {}) {
  return {
    start: pickerToBatchDate(window.start),
    end: pickerToBatchDate(window.end),
  }
}

export function validateBatchFormBasics(form) {
  const errors = {}
  if (!String(form.name || '').trim()) errors.name = 'courseRegistration.batch.nameRequired'
  if (!String(form.academicSession || '').trim()) {
    errors.academicSession = 'courseRegistration.batch.academicSessionRequired'
  }
  if (!String(form.type || '').trim()) errors.type = 'courseRegistration.batch.typeRequired'
  return errors
}
