import { transferStatusOptions } from './programmeTransfers.js'
import { defermentStatusOptions } from './deferments.js'
import { resumptionStatusOptions } from './resumptions.js'
import { withdrawalStatusOptions } from './withdrawals.js'
import {
  extractCurrentProgrammeCode,
  programmeCodeFromName,
  MAINTENANCE_EMPTY,
} from './movementMaintenanceFields.js'
import { normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'

export const movementApplicationImplementedOptions = ['Pending', 'Implemented', '—']

export function createEmptyApplicationSearch() {
  return {
    keyword: '',
    programmeCode: '',
    applicationSession: '',
    status: '',
    implemented: '',
  }
}

export function getApplicationStatusOptions(sourceKey) {
  switch (sourceKey) {
    case 'programme-transfer':
      return transferStatusOptions
    case 'deferment':
      return defermentStatusOptions
    case 'resumption':
      return resumptionStatusOptions
    case 'withdrawal':
      return withdrawalStatusOptions
    default:
      return []
  }
}

function extractApplicationSession(item) {
  const normalized = normalizeAcademicSession(
    item.applicationSession || item.intake || item.originalIntake,
  )
  return normalized === '—' ? '' : normalized
}

export function resolveApplicationProgrammeCode(sourceKey, item) {
  if (sourceKey === 'programme-transfer') {
    const code = extractCurrentProgrammeCode(sourceKey, item)
    return code === MAINTENANCE_EMPTY ? '' : code
  }
  const programme = item.programme || ''
  return programmeCodeFromName(programme) || programme
}

export function resolveApplicationImplemented(item) {
  return item.implemented || (item.status === 'Approved' ? 'Pending' : '—')
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(String(keyword).trim().toLowerCase())
}

export function filterMovementApplications(sourceKey, items, search) {
  const s = search || {}
  return items.filter((item) => {
    if (s.keyword) {
      const q = s.keyword.trim().toLowerCase()
      const idMatch = String(item.studentId || '')
        .toLowerCase()
        .includes(q)
      const nameMatch = String(item.fullName || item.name || '')
        .toLowerCase()
        .includes(q)
      if (!idMatch && !nameMatch) return false
    }
    if (s.programmeCode && !matchText(resolveApplicationProgrammeCode(sourceKey, item), s.programmeCode)) {
      return false
    }
    if (s.applicationSession && !matchText(extractApplicationSession(item), s.applicationSession)) {
      return false
    }
    if (s.status && item.status !== s.status) return false
    if (s.implemented && resolveApplicationImplemented(item) !== s.implemented) return false
    return true
  })
}
