const STAGE_ROLE_MAP = {
  Submission: 'Student',
  Applicant: 'Student',
  'Pending Review': 'Degree Academic Coordinator',
  'HOD/HOP': 'Degree Head of Department/Head of Programme',
  'AA HOD': 'AA HOD',
  'Academic Affairs': 'UG Academic Coordinator',
  'Dean/HoP': 'Dean/Head of Programme',
  Finance: 'Finance WDR Approver',
  'International Student Affairs Office': 'International Student Affairs Office',
  'Admissions Office': 'Admissions Office',
  Library: 'Library',
  'IT Office': 'IT Office',
  'Counselling Center': 'Counselling Center',
  'Accommodation Office': 'Accommodation Office',
  AAO: 'AAO',
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

/** Format approval log Created At as YYYY-MM-DD HH:mm:ss */
export function formatApprovalLogCreatedAt(value) {
  const raw = String(value || '').trim()
  if (!raw) return '—'

  const dotted = raw.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  if (dotted) {
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = dotted
    return `${year}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}:${pad2(second)}`
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())} ${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}:${pad2(parsed.getSeconds())}`
  }

  return raw
}

export function resolveApprovalLogActorRole(entry) {
  if (entry?.actorRole) return entry.actorRole
  if (entry?.action === 'Submitted') return 'Student'
  const stage = String(entry?.stage || '').trim()
  return STAGE_ROLE_MAP[stage] || stage || '—'
}

export function buildApprovalLogDescription(entry) {
  if (entry?.description) return entry.description
  if (entry?.action === 'Submitted') return 'Application Submitted'
  const role = resolveApprovalLogActorRole(entry)
  const action = String(entry?.action || '').trim()
  if (role && action) return `${role} status: ${action}`
  return action || role || '—'
}

export function buildMovementApprovalLogRows(approvalLog = []) {
  return (Array.isArray(approvalLog) ? approvalLog : []).map((entry, index) => ({
    id: entry.id ?? index + 1,
    description: buildApprovalLogDescription(entry),
    actionBy: entry.actor || '—',
    actionByRole: resolveApprovalLogActorRole(entry),
    createdAt: formatApprovalLogCreatedAt(entry.dateTime),
  }))
}
