import { applyApprovedChangeToCourse, formatApplicationDateTime } from './courseChangeApplications.js'
import { validateApprovalForm } from './courseApproval.js'

export { validateApprovalForm }

const STAGE_FLOW = {
  'HoD/HoP Review': { next: 'Senate Review', final: false },
  'Senate Review': { next: 'Approved', final: true },
}

const MOCK_APPROVER = 'System Admin'

/** 已送审单据：排除草稿 */
export function getChangeApprovalQueue(allApplications) {
  return allApplications.filter((item) => item.status !== 'Temporary saved')
}

export function canApproveChangeApplication(item) {
  return item?.status === 'In Progress'
}

export function canBatchApproveChangeSelection(items) {
  if (!items.length) return false
  if (!items.every(canApproveChangeApplication)) return false
  const stage = items[0].approvalStage
  return items.every((item) => item.approvalStage === stage)
}

export function getSharedChangeApprovalStage(items) {
  if (!items.length) return null
  const stage = items[0].approvalStage
  return items.every((item) => item.approvalStage === stage) ? stage : null
}

function appendApprovalLog(item, { stage, action, comment, actor = MOCK_APPROVER }) {
  const now = formatApplicationDateTime(new Date())
  const nextId = (item.approvalLog?.length || 0) + 1
  return {
    ...item,
    approvalLog: [
      ...(item.approvalLog || []),
      {
        id: nextId,
        stage,
        actor,
        action,
        dateTime: now,
        comment: comment || '',
      },
    ],
  }
}

function applyApprovedDecision(item, comment) {
  const flow = STAGE_FLOW[item.approvalStage]
  if (!flow) return item

  let updated = appendApprovalLog(item, {
    stage: item.approvalStage,
    action: 'Approved',
    comment,
  })

  if (flow.final) {
    return {
      ...updated,
      status: 'Approved',
      approvalStage: 'Approved',
    }
  }

  return {
    ...updated,
    status: 'In Progress',
    approvalStage: flow.next,
  }
}

/** 驳回或要求修改：退回课程变更申请草稿 */
function returnToChangeDraft(item, action, comment) {
  return {
    ...appendApprovalLog(item, {
      stage: item.approvalStage,
      action,
      comment,
    }),
    status: 'Temporary saved',
    approvalStage: '--',
  }
}

export function applyChangeApprovalDecisionToItem(item, action, comment) {
  if (!canApproveChangeApplication(item)) return item

  if (action === 'Approved') {
    return applyApprovedDecision({ ...item, approvalLog: item.approvalLog || [] }, comment)
  }
  if (action === 'Rejected') {
    return returnToChangeDraft(item, 'Rejected', comment)
  }
  if (action === 'Update Required') {
    return returnToChangeDraft(item, 'Update Required', comment)
  }
  return item
}

/**
 * 批量审批课程变更申请；终审通过后回写课程信息管理。
 */
export function applyChangeApprovalDecisions(applicationIds, action, comment, allApplications, courseList) {
  const idSet = new Set(applicationIds)
  let nextCourses = courseList

  const nextApplications = allApplications.map((item) => {
    if (!idSet.has(item.id) || !canApproveChangeApplication(item)) return item

    const decided = applyChangeApprovalDecisionToItem(item, action, comment)

    if (
      action === 'Approved' &&
      decided.status === 'Approved' &&
      decided.approvalStage === 'Approved'
    ) {
      const result = applyApprovedChangeToCourse(decided, nextCourses)
      nextCourses = result.courses
      return result.changeApp
    }

    return decided
  })

  return { applications: nextApplications, courses: nextCourses }
}
