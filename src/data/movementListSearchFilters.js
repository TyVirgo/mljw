import { matchesImplementedYnFilter } from './movementApprovalQueue.js'

export function createMovementListSearch() {
  return {
    studentId: '',
    studentName: '',
    movementType: '',
    effectiveSession: '',
    effectiveDate: '',
    status: '',
    implemented: '',
    nationality: '',
    studentCategory: '',
  }
}

export function filterMovementListBySearch(items, search) {
  const s = search || {}
  return items.filter((row) => {
    if (s.studentId && !matchText(row.studentId, s.studentId)) return false
    if (s.studentName && !matchText(row.fullName, s.studentName)) return false
    if (s.movementType && row.sourceKey !== s.movementType) return false
    if (s.effectiveSession && !matchExact(row.effectiveSession, s.effectiveSession)) return false
    if (s.effectiveDate && !matchText(row.movementDate, s.effectiveDate)) return false
    if (s.status && row.status !== s.status) return false
    if (!matchesImplementedYnFilter(row.implemented, s.implemented)) return false
    if (s.nationality && !matchText(row.nationality, s.nationality)) return false
    if (s.studentCategory && row.studentType !== s.studentCategory) return false
    return true
  })
}

function matchExact(value, keyword) {
  if (!keyword) return true
  return String(value ?? '').trim() === String(keyword).trim()
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(String(keyword).trim().toLowerCase())
}

export function getDistinctEffectiveSessions(items) {
  const set = new Set()
  for (const row of items) {
    const session = String(row.effectiveSession || '').trim()
    if (session) set.add(session)
  }
  return [...set].sort()
}

export const movementListStudentCategoryOptions = ['Local', 'Chinese', 'International']
