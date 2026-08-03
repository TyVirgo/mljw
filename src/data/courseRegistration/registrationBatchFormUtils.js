const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const LEGACY_SEMESTER_MAP = {
  '2504 Long Semester': '2025/04',
  '2502 Long Semester': '2025/02',
  '2506 Short Semester': '2026/02',
}

/** 与学籍/异动模块一致的学年学期选项（新→旧） */
export const registrationAcademicSessionOptions = [
  '2026/04',
  '2026/02',
  '2025/09',
  '2025/04',
  '2025/02',
  '2024/09',
  '2024/04',
  '2024/02',
  '2023/09',
  '2023/04',
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

/** 解析 DatePickerEn 的 DD/MM/YYYY */
export function parsePickerDate(value) {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
}

export function formatPickerDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

export function addDaysToPickerDate(value, days) {
  const date = parsePickerDate(value)
  if (!date) return ''
  date.setDate(date.getDate() + days)
  return formatPickerDate(date)
}

/** 批次时间链字段顺序（picker 值） */
export function getBatchSchedulePickerValues(form) {
  return [
    form?.rounds?.preselect?.start || '',
    form?.rounds?.preselect?.end || '',
    form?.rounds?.main?.start || '',
    form?.rounds?.main?.end || '',
    form?.rounds?.supplement?.start || '',
    form?.rounds?.supplement?.end || '',
    form?.addDropWindow?.start || '',
    form?.addDropWindow?.end || '',
  ]
}

/**
 * 各字段最小可选日（DD/MM/YYYY）。
 * 同窗结束 ≥ 开始；跨窗下一段开始 ≥ 上一段结束+1天（上一段结束空则用上一段开始+1）。
 */
export function getBatchScheduleMinDates(form) {
  const values = getBatchSchedulePickerValues(form)
  const mins = Array(8).fill('')

  function lastBound(beforeIndex) {
    for (let i = beforeIndex - 1; i >= 0; i -= 1) {
      if (values[i]) return values[i]
    }
    return ''
  }

  for (let i = 0; i < 8; i += 1) {
    if (i === 0) {
      mins[i] = ''
      continue
    }
    const prev = lastBound(i)
    if (!prev) {
      mins[i] = ''
      continue
    }
    // 奇数下标=各段 end（0-based：1,3,5,7），与 start 同窗含等；偶数下标=下一段 start，须严格晚一天
    mins[i] = i % 2 === 1 ? prev : addDaysToPickerDate(prev, 1)
  }
  return mins
}

export function isPickerDateOnOrAfter(value, minValue) {
  if (!minValue) return true
  if (!value) return true
  const a = parsePickerDate(value)
  const b = parsePickerDate(minValue)
  if (!a || !b) return true
  return a.getTime() >= b.getTime()
}

/** 从 changedIndex 起，清空不满足最小日约束的后续字段 */
export function clearInvalidBatchScheduleAfter(form, changedIndex) {
  const mins = getBatchScheduleMinDates(form)
  const setters = [
    (v) => {
      form.rounds.preselect.start = v
    },
    (v) => {
      form.rounds.preselect.end = v
    },
    (v) => {
      form.rounds.main.start = v
    },
    (v) => {
      form.rounds.main.end = v
    },
    (v) => {
      form.rounds.supplement.start = v
    },
    (v) => {
      form.rounds.supplement.end = v
    },
    (v) => {
      form.addDropWindow.start = v
    },
    (v) => {
      form.addDropWindow.end = v
    },
  ]
  const values = getBatchSchedulePickerValues(form)
  for (let i = changedIndex + 1; i < 8; i += 1) {
    // mins 依赖前面值，清空后需重算
    const liveMins = getBatchScheduleMinDates(form)
    if (values[i] && !isPickerDateOnOrAfter(values[i], liveMins[i])) {
      setters[i]('')
      values[i] = ''
    }
  }
}
