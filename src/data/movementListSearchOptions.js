/**
 * Shared helpers for approval / maintenance / inquiry list search.
 */

export function getDistinctApplicationSessions(items) {
  const sessions = new Set()
  for (const row of items || []) {
    const value = String(row.applicationSession || '').trim()
    if (value && value !== '—') sessions.add(value)
  }
  return [...sessions].sort(compareAcademicSessions)
}

/** Parse YYYY/MM to sortable integer YYYYMM */
function sessionSortKey(value) {
  const normalized = String(value || '').trim()
  const match = normalized.match(/^(\d{4})\/(\d{2})$/)
  if (!match) return 0
  return Number(match[1]) * 100 + Number(match[2])
}

export function compareAcademicSessions(a, b) {
  return sessionSortKey(a) - sessionSortKey(b)
}

/** True when current session has reached effective session (inclusive). */
export function isEffectiveSessionDue(currentSession, effectiveSession) {
  const current = String(currentSession || '').trim()
  const effective = String(effectiveSession || '').trim()
  if (!current || !effective || effective === '—') return false
  return compareAcademicSessions(current, effective) >= 0
}
