/**
 * 选课模块全局流程说明（原型文档页，非业务编排引擎）
 * 仅映射菜单已开发页与现行 demo 逻辑
 */

export const semesterPhases = [
  {
    key: 'A',
    labelKey: 'courseRegistration.flowGuide.phases.A.label',
    descKey: 'courseRegistration.flowGuide.phases.A.desc',
    relatedPageIds: ['cr-batch', 'cr-rules'],
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
    relatedPageIds: ['crs-register', 'cr-result'],
  },
  {
    key: 'D',
    labelKey: 'courseRegistration.flowGuide.phases.D.label',
    descKey: 'courseRegistration.flowGuide.phases.D.desc',
    relatedPageIds: ['crs-register', 'cr-monitor', 'cr-log'],
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
    relatedPageIds: ['cr-supplement', 'cr-monitor', 'crs-adddrop'],
  },
  {
    key: 'G',
    labelKey: 'courseRegistration.flowGuide.phases.G.label',
    descKey: 'courseRegistration.flowGuide.phases.G.desc',
    relatedPageIds: ['cr-fee-roster'],
  },
  {
    key: 'H',
    labelKey: 'courseRegistration.flowGuide.phases.H.label',
    descKey: 'courseRegistration.flowGuide.phases.H.desc',
    relatedPageIds: ['cr-result', 'crs-result', 'cr-log', 'cr-monitor'],
  },
]

/** 管理端：与 courseRegistrationMenu 已开发页一致 */
export const adminFlowNodes = [
  {
    pageId: 'cr-batch',
    order: 1,
    menuKey: 'menu.crBatch',
    descKey: 'courseRegistration.flowGuide.nodes.crBatch',
    phaseKeys: ['A', 'B'],
  },
  {
    pageId: 'cr-rules',
    order: 2,
    menuKey: 'menu.crRules',
    descKey: 'courseRegistration.flowGuide.nodes.crRules',
    phaseKeys: ['A'],
  },
  {
    pageId: 'cr-monitor',
    order: 3,
    menuKey: 'menu.crMonitor',
    descKey: 'courseRegistration.flowGuide.nodes.crMonitor',
    phaseKeys: ['D', 'F', 'H'],
  },
  {
    pageId: 'cr-approval',
    order: 4,
    menuKey: 'menu.crApproval',
    descKey: 'courseRegistration.flowGuide.nodes.crApproval',
    phaseKeys: ['E'],
  },
  {
    pageId: 'cr-fee-roster',
    order: 5,
    menuKey: 'menu.crFeeRoster',
    descKey: 'courseRegistration.flowGuide.nodes.crFeeRoster',
    phaseKeys: ['G'],
  },
  {
    pageId: 'cr-supplement',
    order: 6,
    menuKey: 'menu.crSupplement',
    descKey: 'courseRegistration.flowGuide.nodes.crSupplement',
    phaseKeys: ['F'],
  },
  {
    pageId: 'cr-result',
    order: 7,
    menuKey: 'menu.crResult',
    descKey: 'courseRegistration.flowGuide.nodes.crResult',
    phaseKeys: ['C', 'H'],
  },
  {
    pageId: 'cr-log',
    order: 8,
    menuKey: 'menu.crLog',
    descKey: 'courseRegistration.flowGuide.nodes.crLog',
    phaseKeys: ['D', 'H'],
  },
]

/** 学生端：与菜单已开发页一致 */
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
    pageId: 'crs-result',
    order: 2,
    menuKey: 'menu.crsResult',
    descKey: 'courseRegistration.flowGuide.nodes.crsResult',
    phaseKeys: ['H'],
  },
  {
    pageId: 'crs-adddrop',
    order: 3,
    menuKey: 'menu.crsAddDrop',
    descKey: 'courseRegistration.flowGuide.nodes.crsAddDrop',
    phaseKeys: ['E', 'F'],
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
    fromKey: 'menu.crApproval',
    toKey: 'menu.crsResult',
    descKey: 'courseRegistration.flowGuide.links.approvalToResult',
    fromPageId: 'cr-approval',
    toPageId: 'crs-result',
  },
  {
    fromKey: 'menu.crResult',
    toKey: 'menu.crsResult',
    descKey: 'courseRegistration.flowGuide.links.resultSync',
    fromPageId: 'cr-result',
    toPageId: 'crs-result',
  },
  {
    fromKey: 'menu.crMonitor',
    toKey: 'menu.crFeeRoster',
    descKey: 'courseRegistration.flowGuide.links.monitorToFeeRoster',
    fromPageId: 'cr-monitor',
    toPageId: 'cr-fee-roster',
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
]

export const dimensionBadges = {
  prerequisite: 'courseRegistration.flowGuide.badges.prerequisite',
  scope: 'courseRegistration.flowGuide.badges.scope',
  enrollment: 'courseRegistration.flowGuide.badges.enrollment',
}
