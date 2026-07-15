import { getPreviousLogicalNodeStages, getWorkflowStages } from '../data/movementApprovalWorkflows.js'

export const STAGE_ROLE_MAP = {
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
  Approved: 'Approved',
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

/** 审批阶段展示：stage key → 部门名（经 tr 做中文直译） */
export function formatApprovalStageLabel(stage, tr = (v) => v) {
  const key = String(stage || '').trim()
  if (!key || key === '--') return '—'
  if (key === 'Applicant' || key === 'Submission') return tr('Applicant')
  const department = STAGE_ROLE_MAP[key] || key
  return tr(department)
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

const APPROVER_ACTIONS = new Set(['Approved', 'Rejected', 'Update Required'])

function parseApprovalLogTimestamp(dateTime) {
  const formatted = formatApprovalLogCreatedAt(dateTime)
  if (!formatted || formatted === '—') return 0
  const match = formatted.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return 0
  const [, y, m, d, hh, mm, ss] = match
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)).getTime()
}

function pickLatestLogTime(logs) {
  if (!logs.length) return '—'
  let latest = logs[0]
  let latestTs = parseApprovalLogTimestamp(latest.dateTime)
  for (let i = 1; i < logs.length; i += 1) {
    const ts = parseApprovalLogTimestamp(logs[i].dateTime)
    if (ts >= latestTs) {
      latest = logs[i]
      latestTs = ts
    }
  }
  return formatApprovalLogCreatedAt(latest.dateTime)
}

function resolveSubmittedTime(approvalLog) {
  const submitted = (approvalLog || []).filter((entry) => entry?.action === 'Submitted')
  return pickLatestLogTime(submitted)
}

/**
 * 最近审核时间 = 当前审批人前一逻辑节点操作时间。
 * - 首节点：学生 Submitted
 * - 前一节点为会签组：组内各分支审批动作取最新
 * @param {object} item raw 申请（含 approvalLog / approvalStage）
 * @param {{ sourceKey: string, studentCategory?: string }} ctx
 */
export function resolveLastApprovalActionTime(item, ctx = {}) {
  const approvalLog = Array.isArray(item?.approvalLog)
    ? item.approvalLog
    : Array.isArray(item)
      ? item
      : []

  // 兼容旧调用：仅传 log 数组时退化为整单最新审批动作
  if (Array.isArray(item) && !ctx.sourceKey) {
    return pickLatestLogTime(approvalLog.filter((entry) => APPROVER_ACTIONS.has(entry?.action)))
  }

  const sourceKey = ctx.sourceKey
  const category = ctx.studentCategory || item?.studentCategory || 'Local'
  const stages = sourceKey ? getWorkflowStages(sourceKey, category) : []
  let currentStage = item?.approvalStage

  if (
    sourceKey &&
    (!currentStage || currentStage === '--' || !stages.includes(currentStage))
  ) {
    const submitted = resolveSubmittedTime(approvalLog)
    if (submitted !== '—') return submitted
    return pickLatestLogTime(approvalLog.filter((entry) => APPROVER_ACTIONS.has(entry?.action)))
  }

  if (!sourceKey) {
    return pickLatestLogTime(approvalLog.filter((entry) => APPROVER_ACTIONS.has(entry?.action)))
  }

  const previousStages = getPreviousLogicalNodeStages(sourceKey, currentStage, category)
  if (!previousStages.length) {
    return resolveSubmittedTime(approvalLog)
  }

  const nodeLogs = approvalLog.filter(
    (entry) =>
      previousStages.includes(entry?.stage) && APPROVER_ACTIONS.has(entry?.action),
  )
  const fromNode = pickLatestLogTime(nodeLogs)
  if (fromNode !== '—') return fromNode

  // 会签尚未全部落日志时，再尝试组前/提交时间
  return resolveSubmittedTime(approvalLog)
}
