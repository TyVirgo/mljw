const ARCHIVE_NUMBER_PATTERN = /^[A-Za-z0-9]{1,100}$/

export function isValidMovementArchiveNumber(value) {
  const trimmed = String(value || '').trim()
  return ARCHIVE_NUMBER_PATTERN.test(trimmed)
}

export function normalizeMovementArchiveNumber(value) {
  return String(value || '').trim()
}

export function displayMovementArchiveNumber(value) {
  const trimmed = normalizeMovementArchiveNumber(value)
  return trimmed || 'NA'
}
