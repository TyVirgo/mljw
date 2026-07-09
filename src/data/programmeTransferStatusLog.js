import { programmeCodeFromName } from './movementMaintenanceFields.js'
import { normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'

const PROGRAMME_CODE_ALIASES = {
  'Bachelor of Software Engineering (Honours)': 'SWE',
  'Bachelor in Accounting (Honours)': 'ACC',
  'Bachelor of Management in International Business (Honours)': 'IBU',
  'Bachelor of Data Science (Honours)': 'DS',
  'Bachelor of Finance (Honours)': 'FIN',
  'Bachelor of International Business (Honours)': 'IB',
  'Bachelor of Computer Science (Honours)': 'CS',
}

function resolveProgrammeTransferCode(programmeName) {
  const name = String(programmeName || '').trim()
  if (!name) return ''
  if (PROGRAMME_CODE_ALIASES[name]) return PROGRAMME_CODE_ALIASES[name]
  const fromMap = programmeCodeFromName(name)
  if (fromMap) return fromMap
  const withoutHonours = name.replace(/\s*\(Honours\)\s*$/i, '').trim()
  if (PROGRAMME_CODE_ALIASES[withoutHonours]) return PROGRAMME_CODE_ALIASES[withoutHonours]
  return programmeCodeFromName(withoutHonours) || name
}

export function resolveProgrammeTransferEffectiveSession(transferItem) {
  const raw = transferItem?.adminNewIntake || transferItem?.startSemester || ''
  const normalized = normalizeAcademicSession(raw)
  return normalized === '—' ? '' : normalized
}

export function resolveProgrammeTransferApprovedSession(transferItem) {
  const normalized = normalizeAcademicSession(transferItem?.applicationSession || '')
  return normalized === '—' ? '' : normalized
}

export function buildProgrammeTransferStatusLogRemarkLines(transferItem) {
  const oldName = transferItem?.currentProgramme || transferItem?.oldProgramme || ''
  const newName =
    transferItem?.adminNewProgramme ||
    transferItem?.newProgrammeFirstChoice ||
    transferItem?.newProgramme ||
    ''
  const oldCode = resolveProgrammeTransferCode(oldName)
  const newCode = resolveProgrammeTransferCode(newName)
  const approvedSession = resolveProgrammeTransferApprovedSession(transferItem)
  const effectiveSession = resolveProgrammeTransferEffectiveSession(transferItem)

  const segments = [`Programme transfer, ${oldCode} to ${newCode}`]
  if (approvedSession) segments.push(`approved in ${approvedSession}`)
  if (effectiveSession) segments.push(`effective from ${effectiveSession}`)
  return [segments.join(', ')]
}
