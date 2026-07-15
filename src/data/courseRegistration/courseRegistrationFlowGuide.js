/**
 * 选课模块全局流程说明（原型文档页，非业务编排引擎）
 * 内容对齐调研文档第 7–9 次及需求总结第八章
 */

export const semesterPhases = [
  {
    key: 'A',
    labelKey: 'courseRegistration.flowGuide.phases.A.label',
    descKey: 'courseRegistration.flowGuide.phases.A.desc',
    relatedPageIds: ['cr-batch'],
  },
  {
    key: 'B',
    labelKey: 'courseRegistration.flowGuide.phases.B.label',
    descKey: 'courseRegistration.flowGuide.phases.B.desc',
    relatedPageIds: ['cr-batch', 'crs-register'],
  },
  {
    key: 'C',
    labelKey: 'courseRegistration.flowGuide.phases.C.label',
    descKey: 'courseRegistration.flowGuide.phases.C.desc',
    relatedPageIds: ['crs-register', 'cr-monitor'],
  },
  {
    key: 'D',
    labelKey: 'courseRegistration.flowGuide.phases.D.label',
    descKey: 'courseRegistration.flowGuide.phases.D.desc',
    relatedPageIds: ['crs-register', 'cr-monitor'],
  },
  {
    key: 'E',
    labelKey: 'courseRegistration.flowGuide.phases.E.label',
    descKey: 'courseRegistration.flowGuide.phases.E.desc',
    relatedPageIds: ['crs-adddrop', 'cr-approval'],
  },
  {
    key: 'F',
    labelKey: 'courseRegistration.flowGuide.phases.F.label',
    descKey: 'courseRegistration.flowGuide.phases.F.desc',
    relatedPageIds: ['cr-supplement', 'cr-whitelist'],
  },
  {
    key: 'G',
    labelKey: 'courseRegistration.flowGuide.phases.G.label',
    descKey: 'courseRegistration.flowGuide.phases.G.desc',
    relatedPageIds: ['cr-result', 'crs-result', 'crs-schedule'],
  },
  {
    key: 'H',
    labelKey: 'courseRegistration.flowGuide.phases.H.label',
    descKey: 'courseRegistration.flowGuide.phases.H.desc',
    relatedPageIds: ['cr-alert', 'cr-monitor'],
  },
  {
    key: 'I',
    labelKey: 'courseRegistration.flowGuide.phases.I.label',
    descKey: 'courseRegistration.flowGuide.phases.I.desc',
    relatedPageIds: ['cr-waitlist', 'crs-waitlist'],
  },
  {
    key: 'J',
    labelKey: 'courseRegistration.flowGuide.phases.J.label',
    descKey: 'courseRegistration.flowGuide.phases.J.desc',
    relatedPageIds: ['cr-report'],
  },
  {
    key: 'K',
    labelKey: 'courseRegistration.flowGuide.phases.K.label',
    descKey: 'courseRegistration.flowGuide.phases.K.desc',
    relatedPageIds: ['cr-result'],
  },
]

export const adminFlowNodes = [
  {
    pageId: 'cr-batch',
    order: 1,
    menuKey: 'menu.crBatch',
    descKey: 'courseRegistration.flowGuide.nodes.crBatch',
    phaseKeys: ['A', 'B'],
  },
  {
    pageId: 'cr-monitor',
    order: 2,
    menuKey: 'menu.crMonitor',
    descKey: 'courseRegistration.flowGuide.nodes.crMonitor',
    phaseKeys: ['C', 'D', 'H'],
  },
  {
    pageId: 'cr-supplement',
    order: 3,
    menuKey: 'menu.crSupplement',
    descKey: 'courseRegistration.flowGuide.nodes.crSupplement',
    phaseKeys: ['F'],
  },
  {
    pageId: 'cr-approval',
    order: 4,
    menuKey: 'menu.crApproval',
    descKey: 'courseRegistration.flowGuide.nodes.crApproval',
    phaseKeys: ['E'],
  },
  {
    pageId: 'cr-waitlist',
    order: 5,
    menuKey: 'menu.crWaitlist',
    descKey: 'courseRegistration.flowGuide.nodes.crWaitlist',
    phaseKeys: ['I'],
  },
  {
    pageId: 'cr-result',
    order: 6,
    menuKey: 'menu.crResult',
    descKey: 'courseRegistration.flowGuide.nodes.crResult',
    phaseKeys: ['G', 'K'],
  },
  {
    pageId: 'cr-alert',
    order: 7,
    menuKey: 'menu.crAlert',
    descKey: 'courseRegistration.flowGuide.nodes.crAlert',
    phaseKeys: ['H'],
  },
  {
    pageId: 'cr-whitelist',
    order: 8,
    menuKey: 'menu.crWhitelist',
    descKey: 'courseRegistration.flowGuide.nodes.crWhitelist',
    phaseKeys: ['F'],
  },
  {
    pageId: 'cr-report',
    order: 9,
    menuKey: 'menu.crReport',
    descKey: 'courseRegistration.flowGuide.nodes.crReport',
    phaseKeys: ['J'],
  },
]

export const studentFlowNodes = [
  {
    pageId: 'crs-register',
    order: 1,
    menuKey: 'menu.crsRegister',
    descKey: 'courseRegistration.flowGuide.nodes.crsRegister',
    phaseKeys: ['B', 'C', 'D'],
    badges: ['prerequisite', 'scope', 'enrollment'],
  },
  {
    pageId: 'crs-schedule',
    order: 2,
    menuKey: 'menu.crsSchedule',
    descKey: 'courseRegistration.flowGuide.nodes.crsSchedule',
    phaseKeys: ['G'],
  },
  {
    pageId: 'crs-adddrop',
    order: 3,
    menuKey: 'menu.crsAddDrop',
    descKey: 'courseRegistration.flowGuide.nodes.crsAddDrop',
    phaseKeys: ['E'],
  },
  {
    pageId: 'crs-waitlist',
    order: 4,
    menuKey: 'menu.crsWaitlist',
    descKey: 'courseRegistration.flowGuide.nodes.crsWaitlist',
    phaseKeys: ['I'],
  },
  {
    pageId: 'crs-result',
    order: 5,
    menuKey: 'menu.crsResult',
    descKey: 'courseRegistration.flowGuide.nodes.crsResult',
    phaseKeys: ['G'],
  },
]

export const crossLinks = [
  {
    fromKey: 'menu.crMonitor',
    toKey: 'menu.crSupplement',
    descKey: 'courseRegistration.flowGuide.links.monitorToSupplement',
    fromPageId: 'cr-monitor',
    toPageId: 'cr-supplement',
  },
  {
    fromKey: 'menu.crMonitor',
    toKey: 'menu.crAlert',
    descKey: 'courseRegistration.flowGuide.links.monitorToAlert',
    fromPageId: 'cr-monitor',
    toPageId: 'cr-alert',
  },
  {
    fromKey: 'menu.crWhitelist',
    toKey: 'menu.crsRegister',
    descKey: 'courseRegistration.flowGuide.links.whitelistToRegister',
    fromPageId: 'cr-whitelist',
    toPageId: 'crs-register',
  },
  {
    fromKey: 'menu.crsRegister',
    toKey: 'menu.crMonitor',
    descKey: 'courseRegistration.flowGuide.links.registerToMonitor',
    fromPageId: 'crs-register',
    toPageId: 'cr-monitor',
  },
  {
    fromKey: 'menu.crsAddDrop',
    toKey: 'menu.crApproval',
    descKey: 'courseRegistration.flowGuide.links.addDropToApproval',
    fromPageId: 'crs-adddrop',
    toPageId: 'cr-approval',
  },
  {
    fromKey: 'menu.crsWaitlist',
    toKey: 'menu.crWaitlist',
    descKey: 'courseRegistration.flowGuide.links.studentWaitlistToAdmin',
    fromPageId: 'crs-waitlist',
    toPageId: 'cr-waitlist',
  },
  {
    fromKey: 'menu.crApproval',
    toKey: 'menu.crsSchedule',
    descKey: 'courseRegistration.flowGuide.links.approvalToSchedule',
    fromPageId: 'cr-approval',
    toPageId: 'crs-schedule',
  },
  {
    fromKey: 'menu.crResult',
    toKey: 'menu.crsResult',
    descKey: 'courseRegistration.flowGuide.links.resultSync',
    fromPageId: 'cr-result',
    toPageId: 'crs-result',
  },
]

export const sequenceConstraints = [
  'courseRegistration.flowGuide.constraints.c1',
  'courseRegistration.flowGuide.constraints.c2',
  'courseRegistration.flowGuide.constraints.c3',
  'courseRegistration.flowGuide.constraints.c4',
  'courseRegistration.flowGuide.constraints.c5',
  'courseRegistration.flowGuide.constraints.c6',
  'courseRegistration.flowGuide.constraints.c7',
  'courseRegistration.flowGuide.constraints.c8',
]

export const dimensionBadges = {
  prerequisite: 'courseRegistration.flowGuide.badges.prerequisite',
  scope: 'courseRegistration.flowGuide.badges.scope',
  enrollment: 'courseRegistration.flowGuide.badges.enrollment',
}
