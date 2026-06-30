import { getWorkflowStages } from '../data/movementApprovalWorkflows.js'
import { inferStudentCategory } from '../data/movementApprovalEngine.js'

const SUBMISSION_ALIASES = new Set(['Submission', 'Applicant', 'Submitted'])

function normalizeStage(stage) {
  return String(stage || '').trim()
}

function logsForStage(logs, stage) {
  const target = normalizeStage(stage)
  return logs.filter((entry) => normalizeStage(entry.stage) === target)
}

function latestLogForStage(logs, stage) {
  const matches = logsForStage(logs, stage)
  return matches.length ? matches[matches.length - 1] : null
}

function actionBadgeKey(action) {
  if (action === 'Submitted') return 'submitted'
  if (action === 'Approved') return 'approved'
  if (action === 'Rejected') return 'rejected'
  if (action === 'Update Required') return 'updateRequired'
  if (action === 'Cancelled') return 'cancelled'
  return null
}

function iconForNode(state) {
  if (state === 'completed') return 'completed'
  if (state === 'rejected') return 'rejected'
  if (state === 'warning') return 'warning'
  if (state === 'pending') return 'pending'
  return 'upcoming'
}

function resolveNodeFromLog(log, fallbackState = 'completed') {
  const badgeKey = actionBadgeKey(log?.action) || fallbackState
  return {
    actor: log?.actor || '',
    badgeKey,
    dateTime: log?.dateTime || '',
    comment: log?.comment || '',
    icon: iconForNode(badgeKey === 'rejected' ? 'rejected' : badgeKey === 'updateRequired' ? 'warning' : fallbackState),
  }
}

function isTerminalStatus(status) {
  return ['Approved', 'Rejected', 'Cancelled', 'Expired'].includes(status)
}

export function buildApprovalTimelineNodes({
  workflowStages = [],
  approvalLog = [],
  currentStage = '',
  status = '',
  applicantLabel = '',
}) {
  const logs = Array.isArray(approvalLog) ? approvalLog : []
  const submitLog = logs.find((entry) => entry.action === 'Submitted')
  const nodes = []

  const applicantResolved = resolveNodeFromLog(submitLog, submitLog ? 'completed' : 'upcoming')
  nodes.push({
    id: 'applicant',
    stageLabel: 'Applicant',
    actor: applicantResolved.actor || applicantLabel,
    badgeKey: submitLog ? 'submitted' : status === 'Draft' ? null : 'submitted',
    dateTime: applicantResolved.dateTime,
    comment: applicantResolved.comment,
    icon: submitLog ? 'completed' : status === 'Draft' ? 'upcoming' : 'pending',
  })

  const stages = workflowStages.filter((stage) => stage && stage !== '--')
  const normalizedCurrent = normalizeStage(currentStage)
  let reachedCurrent = !normalizedCurrent || normalizedCurrent === 'Approved'

  for (const stage of stages) {
    if (stage === 'Approved') continue
    const log = latestLogForStage(logs, stage)
    const isCurrent = normalizedCurrent === stage && status === 'In Progress'

    if (log) {
      const badgeKey = actionBadgeKey(log.action)
      nodes.push({
        id: stage,
        stageLabel: stage,
        actor: log.actor || '',
        badgeKey,
        dateTime: log.dateTime || '',
        comment: log.comment || '',
        icon: iconForNode(
          badgeKey === 'rejected' ? 'rejected' : badgeKey === 'updateRequired' ? 'warning' : 'completed',
        ),
      })
      if (isCurrent) reachedCurrent = true
      continue
    }

    if (isTerminalStatus(status)) {
      nodes.push({
        id: stage,
        stageLabel: stage,
        actor: '',
        badgeKey: null,
        dateTime: '',
        comment: '',
        icon: 'upcoming',
      })
      continue
    }

    if (isCurrent) {
      nodes.push({
        id: stage,
        stageLabel: stage,
        actor: '',
        badgeKey: 'pending',
        dateTime: '',
        comment: '',
        icon: 'pending',
      })
      reachedCurrent = true
      continue
    }

    if (!reachedCurrent && normalizedCurrent && stages.indexOf(stage) < stages.indexOf(normalizedCurrent)) {
      nodes.push({
        id: stage,
        stageLabel: stage,
        actor: '',
        badgeKey: 'pending',
        dateTime: '',
        comment: '',
        icon: 'pending',
      })
      continue
    }

    nodes.push({
      id: stage,
      stageLabel: stage,
      actor: '',
      badgeKey: null,
      dateTime: '',
      comment: '',
      icon: 'upcoming',
    })
  }

  if (status === 'Approved' || currentStage === 'Approved') {
    const approvedLog = latestLogForStage(logs, 'Approved') || logs.find((e) => e.action === 'Approved')
    const resolved = resolveNodeFromLog(approvedLog, 'completed')
    nodes.push({
      id: 'approved',
      stageLabel: 'Approved',
      actor: resolved.actor,
      badgeKey: 'approved',
      dateTime: resolved.dateTime,
      comment: resolved.comment,
      icon: 'completed',
    })
  } else if (status === 'Rejected') {
    const rejectedLog = logs.find((e) => e.action === 'Rejected')
    const resolved = resolveNodeFromLog(rejectedLog, 'rejected')
    nodes.push({
      id: 'rejected',
      stageLabel: currentStage || 'Rejected',
      actor: resolved.actor,
      badgeKey: 'rejected',
      dateTime: resolved.dateTime,
      comment: resolved.comment,
      icon: 'rejected',
    })
  }

  return nodes
}

export function buildMovementTimelineNodes(item, sourceKey) {
  if (!item) return []
  const category = inferStudentCategory(item)
  const workflowStages = getWorkflowStages(sourceKey, category)
  return buildApprovalTimelineNodes({
    workflowStages,
    approvalLog: item.approvalLog || [],
    currentStage: item.approvalStage || '',
    status: item.status || '',
    applicantLabel: item.fullName || item.name || '',
  })
}

export function buildCourseTimelineNodes(item, workflowStages) {
  if (!item) return []
  const stages = workflowStages?.length
    ? workflowStages.filter((s) => s && s !== '--')
    : ['HoD/HoP Review', 'Senate Review', 'Approved']
  return buildApprovalTimelineNodes({
    workflowStages: stages,
    approvalLog: item.approvalLog || [],
    currentStage: item.approvalStage || '',
    status: item.status || '',
    applicantLabel: item.applicant || '',
  })
}

export { SUBMISSION_ALIASES }
