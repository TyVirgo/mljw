import { getWorkflowStages, getParallelGroups } from '../data/movementApprovalWorkflows.js'
import { inferStudentCategory } from '../data/movementApprovalEngine.js'

export const SUBMISSION_ALIASES = new Set(['Submission', 'Applicant', 'Submitted'])

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
  if (state === 'branch') return 'branch'
  return 'upcoming'
}

function resolveNodeFromLog(log, fallbackState = 'completed') {
  const badgeKey = actionBadgeKey(log?.action) || fallbackState
  return {
    actor: log?.actor || '',
    badgeKey,
    dateTime: log?.dateTime || '',
    comment: log?.comment || '',
    icon: iconForNode(
      badgeKey === 'rejected' ? 'rejected' : badgeKey === 'updateRequired' ? 'warning' : fallbackState,
    ),
  }
}

function isTerminalStatus(status) {
  return ['Approved', 'Rejected', 'Cancelled', 'Expired'].includes(status)
}

function findGroupContaining(parallelGroups, stage) {
  return parallelGroups.find((group) => group.includes(stage)) || null
}

function groupStartIndex(stages, group) {
  return Math.min(...group.map((s) => stages.indexOf(s)).filter((i) => i >= 0))
}

/**
 * Resolve a single workflow stage into a timeline step/parallel-item node fields.
 */
function resolveStageFields(stage, { logs, currentStage, status, stages }) {
  const log = latestLogForStage(logs, stage)
  const normalizedCurrent = normalizeStage(currentStage)
  const isCurrent = normalizedCurrent === stage && status === 'In Progress'
  const currentIdx = stages.indexOf(normalizedCurrent)
  const stageIdx = stages.indexOf(stage)

  if (log) {
    const badgeKey = actionBadgeKey(log.action)
    return {
      stageLabel: stage,
      actor: log.actor || '',
      badgeKey,
      dateTime: log.dateTime || '',
      comment: log.comment || '',
      icon: iconForNode(
        badgeKey === 'rejected' ? 'rejected' : badgeKey === 'updateRequired' ? 'warning' : 'completed',
      ),
      isCurrent,
    }
  }

  if (isTerminalStatus(status)) {
    return {
      stageLabel: stage,
      actor: '',
      badgeKey: null,
      dateTime: '',
      comment: '',
      icon: 'upcoming',
      isCurrent: false,
    }
  }

  if (isCurrent) {
    return {
      stageLabel: stage,
      actor: '',
      badgeKey: 'pending',
      dateTime: '',
      comment: '',
      icon: 'pending',
      isCurrent: true,
    }
  }

  if (normalizedCurrent && currentIdx >= 0 && stageIdx >= 0 && stageIdx < currentIdx) {
    return {
      stageLabel: stage,
      actor: '',
      badgeKey: 'pending',
      dateTime: '',
      comment: '',
      icon: 'pending',
      isCurrent: false,
    }
  }

  return {
    stageLabel: stage,
    actor: '',
    badgeKey: null,
    dateTime: '',
    comment: '',
    icon: 'upcoming',
    isCurrent: false,
  }
}

function isBranchComplete(group, logs) {
  return group.every((stage) => {
    const log = latestLogForStage(logs, stage)
    return log && log.action === 'Approved'
  })
}

export function buildApprovalTimelineNodes({
  workflowStages = [],
  approvalLog = [],
  currentStage = '',
  status = '',
  applicantLabel = '',
  parallelGroups = [],
}) {
  const logs = Array.isArray(approvalLog) ? approvalLog : []
  const nodes = []

  const submitLog = logs.find((entry) => entry.action === 'Submitted')
  const applicantResolved = resolveNodeFromLog(submitLog, submitLog ? 'completed' : 'upcoming')
  nodes.push({
    id: 'applicant',
    type: 'step',
    stageLabel: 'Applicant',
    actor: applicantResolved.actor || applicantLabel,
    badgeKey: submitLog ? 'submitted' : status === 'Draft' ? null : 'submitted',
    dateTime: applicantResolved.dateTime,
    comment: applicantResolved.comment,
    icon: submitLog ? 'completed' : status === 'Draft' ? 'upcoming' : 'pending',
  })

  const stages = workflowStages.filter((stage) => stage && stage !== '--')
  const normalizedCurrent = normalizeStage(currentStage)
  const emittedGroups = new Set()

  for (const stage of stages) {
    if (stage === 'Approved') continue

    const group = findGroupContaining(parallelGroups, stage)
    if (group) {
      const groupKey = group.join('|')
      if (emittedGroups.has(groupKey)) continue
      emittedGroups.add(groupKey)

      const startIdx = groupStartIndex(stages, group)
      const currentIdx = stages.indexOf(normalizedCurrent)
      const anyLog = group.some((s) => latestLogForStage(logs, s))
      const reachedGroup =
        isTerminalStatus(status) ||
        anyLog ||
        (currentIdx >= 0 && currentIdx >= startIdx) ||
        !normalizedCurrent

      nodes.push({
        id: `branch-start:${groupKey}`,
        type: 'branch-start',
        stageLabel: '',
        actor: '',
        badgeKey: null,
        dateTime: '',
        comment: '',
        icon: reachedGroup ? 'branch' : 'upcoming',
      })

      for (const branchStage of group) {
        const fields = resolveStageFields(branchStage, {
          logs,
          currentStage,
          status,
          stages,
        })
        // 会签语义：已进入该组、某分支尚无 log 时视为待审（非 upcoming）
        if (
          reachedGroup &&
          !latestLogForStage(logs, branchStage) &&
          !isTerminalStatus(status) &&
          fields.icon === 'upcoming'
        ) {
          fields.badgeKey = 'pending'
          fields.icon = 'pending'
        }
        nodes.push({
          id: `parallel:${branchStage}`,
          type: 'parallel-item',
          ...fields,
        })
      }

      const complete = isBranchComplete(group, logs)
      nodes.push({
        id: `branch-join:${groupKey}`,
        type: 'branch-join',
        stageLabel: '',
        actor: '',
        badgeKey: null,
        dateTime: '',
        comment: '',
        icon: complete ? 'completed' : reachedGroup ? 'pending' : 'upcoming',
        joinComplete: complete,
      })
      continue
    }

    const fields = resolveStageFields(stage, { logs, currentStage, status, stages })
    nodes.push({
      id: stage,
      type: 'step',
      ...fields,
    })
  }

  if (status === 'Approved' || currentStage === 'Approved') {
    const approvedLog = latestLogForStage(logs, 'Approved') || logs.find((e) => e.action === 'Approved')
    const resolved = resolveNodeFromLog(approvedLog, 'completed')
    nodes.push({
      id: 'approved',
      type: 'step',
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
      type: 'step',
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
    parallelGroups: getParallelGroups(sourceKey),
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
    parallelGroups: [],
  })
}

/** 加退课审批：提交 → 教务协调员（单级） */
export function buildAddDropTimelineNodes(application) {
  if (!application) return []
  const logs = Array.isArray(application.approvalLog) ? application.approvalLog : []
  const normalizedLogs = logs.map((entry) => ({
    ...entry,
    dateTime: entry.dateTime || entry.at || '',
  }))

  return buildApprovalTimelineNodes({
    workflowStages: ['Academic Coordinator', 'Approved'],
    approvalLog: [
      {
        action: 'Submitted',
        actor: application.studentName || '',
        dateTime: application.submittedAt || '',
        stage: 'Applicant',
      },
      ...normalizedLogs.map((entry) => ({
        ...entry,
        stage: entry.stage || 'Academic Coordinator',
      })),
    ],
    currentStage: application.status === 'Pending' ? 'Academic Coordinator' : '',
    status:
      application.status === 'Pending'
        ? 'In Progress'
        : application.status === 'Approved'
          ? 'Approved'
          : application.status === 'Rejected'
            ? 'Rejected'
            : application.status || '',
    applicantLabel: application.studentName || '',
    parallelGroups: [],
  })
}

