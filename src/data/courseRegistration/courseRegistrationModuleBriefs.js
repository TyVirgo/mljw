/**
 * 各子模块顶部说明：调研文档需求 ↔ 本页功能映射（供开发对照）
 * 来源：马来本科教务选课调研（第 7、8、9 次）
 */
export const courseRegistrationModuleBriefs = {
  'cr-batch': {
    sourceKey: 'courseRegistration.briefs.batch.source',
    requirementsKey: 'courseRegistration.briefs.batch.requirements',
    featuresKey: 'courseRegistration.briefs.batch.features',
    variant: 'info',
  },
  'cr-monitor': {
    sourceKey: 'courseRegistration.briefs.monitor.source',
    requirementsKey: 'courseRegistration.briefs.monitor.requirements',
    featuresKey: 'courseRegistration.briefs.monitor.features',
    variant: 'rule',
  },
  'cr-supplement': {
    sourceKey: 'courseRegistration.briefs.supplement.source',
    requirementsKey: 'courseRegistration.briefs.supplement.requirements',
    featuresKey: 'courseRegistration.briefs.supplement.features',
    variant: 'warning',
  },
  'cr-approval': {
    sourceKey: 'courseRegistration.briefs.approval.source',
    requirementsKey: 'courseRegistration.briefs.approval.requirements',
    featuresKey: 'courseRegistration.briefs.approval.features',
    variant: 'rule',
  },
  'cr-waitlist': {
    sourceKey: 'courseRegistration.briefs.waitlist.source',
    requirementsKey: 'courseRegistration.briefs.waitlist.requirements',
    featuresKey: 'courseRegistration.briefs.waitlist.features',
    variant: 'warning',
  },
  'cr-result': {
    sourceKey: 'courseRegistration.briefs.result.source',
    requirementsKey: 'courseRegistration.briefs.result.requirements',
    featuresKey: 'courseRegistration.briefs.result.features',
    variant: 'info',
  },
  'cr-alert': {
    sourceKey: 'courseRegistration.briefs.alert.source',
    requirementsKey: 'courseRegistration.briefs.alert.requirements',
    featuresKey: 'courseRegistration.briefs.alert.features',
    variant: 'warning',
  },
  'cr-whitelist': {
    sourceKey: 'courseRegistration.briefs.whitelist.source',
    requirementsKey: 'courseRegistration.briefs.whitelist.requirements',
    featuresKey: 'courseRegistration.briefs.whitelist.features',
    variant: 'info',
  },
  'cr-report': {
    sourceKey: 'courseRegistration.briefs.report.source',
    requirementsKey: 'courseRegistration.briefs.report.requirements',
    featuresKey: 'courseRegistration.briefs.report.features',
    variant: 'info',
  },
  'crs-register': {
    sourceKey: 'courseRegistration.briefs.studentRegister.source',
    requirementsKey: 'courseRegistration.briefs.studentRegister.requirements',
    featuresKey: 'courseRegistration.briefs.studentRegister.features',
    variant: 'info',
  },
  'crs-schedule': {
    sourceKey: 'courseRegistration.briefs.studentSchedule.source',
    requirementsKey: 'courseRegistration.briefs.studentSchedule.requirements',
    featuresKey: 'courseRegistration.briefs.studentSchedule.features',
    variant: 'info',
  },
  'crs-adddrop': {
    sourceKey: 'courseRegistration.briefs.studentAddDrop.source',
    requirementsKey: 'courseRegistration.briefs.studentAddDrop.requirements',
    featuresKey: 'courseRegistration.briefs.studentAddDrop.features',
    variant: 'rule',
  },
  'crs-waitlist': {
    sourceKey: 'courseRegistration.briefs.studentWaitlist.source',
    requirementsKey: 'courseRegistration.briefs.studentWaitlist.requirements',
    featuresKey: 'courseRegistration.briefs.studentWaitlist.features',
    variant: 'warning',
  },
  'crs-result': {
    sourceKey: 'courseRegistration.briefs.studentResult.source',
    requirementsKey: 'courseRegistration.briefs.studentResult.requirements',
    featuresKey: 'courseRegistration.briefs.studentResult.features',
    variant: 'info',
  },
}

export function getModuleBrief(pageId) {
  return courseRegistrationModuleBriefs[pageId] || null
}
