import { buildCourseCreatePayload, createCourseId } from './courses.js'
import { applicationToWizardState, formatApplicationDateTime } from './courseApplications.js'

export const approvalActionOptions = ['Approved', 'Rejected', 'Update Required']

export const commonApprovalComments = [
  'Reviewed and approved. No further changes required.',
  'Please revise the CLO mapping and resubmit.',
  'Insufficient syllabus detail. Update required before approval.',
  'Rejected due to duplicate course offering in the same semester.',
  'Approved with minor editorial suggestions noted in comments.',
]

const STAGE_FLOW = {
  'HoD/HoP Review': { next: 'Senate Review', final: false },
  'Senate Review': { next: 'Approved', final: true },
}

const MOCK_APPROVER = 'System Admin'

export function getApprovalQueue(allApplications) {
  return allApplications.filter((item) => item.status !== 'Temporary saved')
}

export function canApproveApplication(item) {
  return item?.status === 'In Progress'
}

export function canBatchApproveSelection(items) {
  if (!items.length) return false
  if (!items.every(canApproveApplication)) return false
  const stage = items[0].approvalStage
  return items.every((item) => item.approvalStage === stage)
}

export function getSharedApprovalStage(items) {
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

export function archiveApplicationToCourses(application, courseList) {
  if (!application?.courseCode) return courseList
  if (courseList.some((item) => item.courseCode === application.courseCode)) {
    return courseList
  }
  const { form, clos, slt } = applicationToWizardState(application)
  const payload = buildCourseCreatePayload(form, clos, slt)
  return [
    ...courseList,
    {
      id: createCourseId(),
      ...payload,
      changeRecords: [],
    },
  ]
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

function applyRejectedDecision(item, comment) {
  return {
    ...appendApprovalLog(item, {
      stage: item.approvalStage,
      action: 'Rejected',
      comment,
    }),
    status: 'Rejected',
    approvalStage: '--',
  }
}

function applyUpdateRequiredDecision(item, comment) {
  return {
    ...appendApprovalLog(item, {
      stage: item.approvalStage,
      action: 'Update Required',
      comment,
    }),
    status: 'Temporary saved',
    approvalStage: '--',
  }
}

export function applyApprovalDecisionToItem(item, action, comment) {
  if (!canApproveApplication(item)) return item

  if (action === 'Approved') {
    return applyApprovedDecision({ ...item, approvalLog: item.approvalLog || [] }, comment)
  }
  if (action === 'Rejected') {
    return applyRejectedDecision(item, comment)
  }
  if (action === 'Update Required') {
    return applyUpdateRequiredDecision(item, comment)
  }
  return item
}

export function applyApprovalDecisions(applicationIds, action, comment, allApplications, courseList) {
  const idSet = new Set(applicationIds)
  let nextCourses = courseList

  const nextApplications = allApplications.map((item) => {
    if (!idSet.has(item.id) || !canApproveApplication(item)) return item

    const withComment = applyApprovalDecisionToItem(item, action, comment)

    if (action === 'Approved' && withComment.status === 'Approved' && withComment.approvalStage === 'Approved') {
      nextCourses = archiveApplicationToCourses(withComment, nextCourses)
    }

    return withComment
  })

  return { applications: nextApplications, courses: nextCourses }
}

export function validateApprovalForm(action, comment) {
  if (!action) {
    return { action: 'Please select an approval result.' }
  }
  if ((action === 'Rejected' || action === 'Update Required') && !comment?.trim()) {
    return { comment: 'Comments are required for this approval result.' }
  }
  if (comment && comment.length > 100) {
    return { comment: 'Comments must not exceed 100 characters.' }
  }
  return {}
}
