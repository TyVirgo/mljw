const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DISPLAY_PATTERN = /^\d{2}\.[A-Za-z]{3}\.\d{4}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const EURO_DATE_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+\d{1,2}:\d{2})?$/
const ENGLISH_DATE_PATTERN = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/

function parseMonthAbbr(value) {
  const index = MONTH_ABBR.findIndex((item) => item.toLowerCase() === String(value).toLowerCase())
  return index >= 0 ? index : null
}

export function parseMovementDate(value) {
  if (value === '' || value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '—') return null

  if (DISPLAY_PATTERN.test(trimmed)) {
    const [day, monthAbbr, year] = trimmed.split('.')
    const monthIndex = parseMonthAbbr(monthAbbr)
    if (monthIndex == null) return null
    return new Date(Number(year), monthIndex, Number(day))
  }

  if (ISO_DATE_PATTERN.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const euroMatch = trimmed.match(EURO_DATE_PATTERN)
  if (euroMatch) {
    const [, day, month, year] = euroMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const englishMatch = trimmed.match(ENGLISH_DATE_PATTERN)
  if (englishMatch) {
    const [, day, monthAbbr, year] = englishMatch
    const monthIndex = parseMonthAbbr(monthAbbr)
    if (monthIndex == null) return null
    return new Date(Number(year), monthIndex, Number(day))
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function formatDateToMovementDisplay(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTH_ABBR[date.getMonth()]
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

/** §19：展示 dd.Mmm.YYYY（如 29.Sep.2025） */
export function formatMovementDate(value) {
  const date = parseMovementDate(value)
  if (!date) {
    const trimmed = String(value ?? '').trim()
    return trimmed || '—'
  }
  return formatDateToMovementDisplay(date)
}

/** 存储 / 比较用 ISO YYYY-MM-DD */
export function formatMovementDateIso(value = new Date()) {
  const date = value instanceof Date ? value : parseMovementDate(value)
  if (!date || Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatMovementDateOrEmpty(value) {
  const formatted = formatMovementDate(value)
  return formatted === '—' ? '' : formatted
}

/** Status Log 展示 DD/MM/YYYY */
export function formatStatusLogDate(value) {
  const date = parseMovementDate(value)
  if (!date || Number.isNaN(date.getTime())) {
    const trimmed = String(value ?? '').trim()
    return trimmed || '—'
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
