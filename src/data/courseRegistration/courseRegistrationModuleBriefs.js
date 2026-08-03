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
  'cr-rules': {
    sourceKey: 'courseRegistration.briefs.rules.source',
    requirementsKey: 'courseRegistration.briefs.rules.requirements',
    featuresKey: 'courseRegistration.briefs.rules.features',
    variant: 'rule',
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
  'cr-fee-roster': {
    sourceKey: 'courseRegistration.briefs.feeRoster.source',
    requirementsKey: 'courseRegistration.briefs.feeRoster.requirements',
    featuresKey: 'courseRegistration.briefs.feeRoster.features',
    variant: 'info',
  },
  'cr-result': {
    sourceKey: 'courseRegistration.briefs.result.source',
    requirementsKey: 'courseRegistration.briefs.result.requirements',
    featuresKey: 'courseRegistration.briefs.result.features',
    variant: 'info',
  },
  'cr-log': {
    sourceKey: 'courseRegistration.briefs.log.source',
    requirementsKey: 'courseRegistration.briefs.log.requirements',
    featuresKey: 'courseRegistration.briefs.log.features',
    variant: 'info',
  },
  'crs-register': {
    sourceKey: 'courseRegistration.briefs.studentRegister.source',
    requirementsKey: 'courseRegistration.briefs.studentRegister.requirements',
    featuresKey: 'courseRegistration.briefs.studentRegister.features',
    variant: 'info',
  },
  'crs-adddrop': {
    sourceKey: 'courseRegistration.briefs.studentAddDrop.source',
    requirementsKey: 'courseRegistration.briefs.studentAddDrop.requirements',
    featuresKey: 'courseRegistration.briefs.studentAddDrop.features',
    variant: 'rule',
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
