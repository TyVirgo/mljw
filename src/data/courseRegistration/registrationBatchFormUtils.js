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

function pad2(n) {
  return String(n).padStart(2, '0')
}

function normalizeTimeParts(hh, mm, ss) {
  const h = Math.min(23, Math.max(0, Number(hh) || 0))
  const m = Math.min(59, Math.max(0, Number(mm) || 0))
  const s = Math.min(59, Math.max(0, Number(ss) || 0))
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

/**
 * 解析批次存储或选择器中的日期时间 → Date（本地）
 * 支持：DD/MM/YYYY[ HH:mm:ss]、D-Mon-YYYY[ HH:mm[:ss]]、YYYY-MM-DD[ HH:mm[:ss]]
 */
export function parseBatchDateTime(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  let m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0),
      0,
    )
  }

  m = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (m) {
    const monthIdx = MONTH_ABBR.findIndex((item) => item.toLowerCase() === m[2].toLowerCase())
    if (monthIdx < 0) return null
    return new Date(
      Number(m[3]),
      monthIdx,
      Number(m[1]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0),
      0,
    )
  }

  m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0),
      0,
    )
  }

  return null
}

/**
 * 距截止剩余天/小时（向下取整；进页算一次时传入固定 now）
 * @param {string} endRaw 批次日期字符串
 * @param {Date|number} [now] 基准时间
 * @returns {{ days: number, hours: number, expired: boolean } | null}
 */
export function getRemainingDaysHours(endRaw, now = new Date()) {
  const end = parseBatchDateTime(endRaw)
  if (!end || Number.isNaN(end.getTime())) return null
  const base = now instanceof Date ? now.getTime() : Number(now)
  if (!Number.isFinite(base)) return null
  const ms = end.getTime() - base
  if (ms <= 0) return { days: 0, hours: 0, expired: true }
  const totalHours = Math.floor(ms / (3600 * 1000))
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    expired: false,
  }
}

/** DatePickerEn datetime：DD/MM/YYYY HH:mm:ss（无时间则补 00:00:00） */
export function batchDateToPicker(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}:\d{2})?$/.test(raw)) {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return `${raw} 00:00:00`
    const m = raw.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (m) return `${m[1]} ${normalizeTimeParts(m[2], m[3], m[4] || 0)}`
    return raw
  }
  const date = parseBatchDateTime(raw)
  if (!date || Number.isNaN(date.getTime())) return raw
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${normalizeTimeParts(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  )}`
}

/** DatePickerEn → 批次存储：25-Aug-2025 09:00:00 */
export function pickerToBatchDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/.test(raw)) {
    const date = parseBatchDateTime(raw)
    if (!date) return raw
    return `${date.getDate()}-${MONTH_ABBR[date.getMonth()]}-${date.getFullYear()} ${normalizeTimeParts(
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    )}`
  }
  const date = parseBatchDateTime(raw)
  if (!date || Number.isNaN(date.getTime())) return raw
  return `${date.getDate()}-${MONTH_ABBR[date.getMonth()]}-${date.getFullYear()} ${normalizeTimeParts(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  )}`
}

/** 展示/流水：统一为 YYYY-MM-DD HH:mm:ss 或保留可读；选课模块列表用与 picker 一致的 DD/MM/YYYY HH:mm:ss */
export function formatDateTimeDisplay(value) {
  if (!value) return ''
  return batchDateToPicker(value) || String(value)
}

/** 申请/志愿提交时刻：不足秒则补 :00 */
export function ensureDateTimeWithSeconds(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const date = parseBatchDateTime(raw)
  if (date && !Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${normalizeTimeParts(
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    )}`
  }
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(raw)) return `${raw}:00`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return `${raw.replace('T', ' ')}:00`
  return raw
}

export function nowDateTimeWithSeconds() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${normalizeTimeParts(
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  )}`
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
  const type = String(form.type || '').trim()
  if (type === 'ME' && !String(form.programme || '').trim()) {
    errors.programme = 'courseRegistration.batch.programmeRequired'
  }
  return errors
}

/** 解析 DatePickerEn 值（日期或日期时间）→ Date */
export function parsePickerDate(value) {
  return parseBatchDateTime(value)
}

export function formatPickerDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${normalizeTimeParts(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  )}`
}

export function addDaysToPickerDate(value, days) {
  const date = parsePickerDate(value)
  if (!date) return ''
  date.setDate(date.getDate() + days)
  // 跨窗最小日起点：下一天 00:00:00
  date.setHours(0, 0, 0, 0)
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
 * 各字段最小可选时刻。
 * 同窗结束 ≥ 开始；跨窗下一段开始 ≥ 上一段结束的次日 00:00:00。
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
    const liveMins = getBatchScheduleMinDates(form)
    if (values[i] && !isPickerDateOnOrAfter(values[i], liveMins[i])) {
      setters[i]('')
      values[i] = ''
    }
  }
}
