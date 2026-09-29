import {
  buildMenuBreadcrumbKeys,
  findMenuLabelKey,
  findParentId,
} from './menuBreadcrumb.js'

export const courseRegistrationModuleKey = 'menu.courseRegistration'

export const courseRegistrationMenuItems = [
  {
    id: 'cr-student-group',
    labelKey: 'menu.crStudentGroup',
    icon: 'user',
    audience: 'student',
    children: [
      { id: 'crs-register', labelKey: 'menu.crsRegister', audience: 'student' },
      { id: 'crs-result', labelKey: 'menu.crsResult', audience: 'student' },
      { id: 'crs-adddrop', labelKey: 'menu.crsAddDrop', audience: 'student' },
      { id: 'crs-payment', labelKey: 'menu.crsPayment', audience: 'student' },
    ],
  },
  {
    id: 'cr-config-group',
    labelKey: 'menu.crConfigGroup',
    icon: 'grid',
    audience: 'admin',
    children: [
      { id: 'cr-schedule', labelKey: 'menu.crSchedule', audience: 'admin' },
      { id: 'cr-batch', labelKey: 'menu.crBatch', audience: 'admin' },
      { id: 'cr-rules', labelKey: 'menu.crRules', audience: 'admin' },
    ],
  },
  {
    id: 'cr-process-group',
    labelKey: 'menu.crProcessGroup',
    icon: 'transfer',
    audience: 'admin',
    children: [
      { id: 'cr-approval', labelKey: 'menu.crApproval', audience: 'admin' },
      { id: 'cr-fee-roster', labelKey: 'menu.crFeeRoster', audience: 'admin' },
      { id: 'cr-monitor', labelKey: 'menu.crMonitor', audience: 'admin' },
      { id: 'cr-supplement', labelKey: 'menu.crSupplement', audience: 'admin' },
    ],
  },
  {
    id: 'cr-result-group',
    labelKey: 'menu.crResultGroup',
    icon: 'user',
    audience: 'admin',
    children: [
      { id: 'cr-result', labelKey: 'menu.crResult', audience: 'admin' },
      { id: 'cr-log', labelKey: 'menu.crLog', audience: 'admin' },
    ],
  },
  // 模块说明（正式页去掉）：侧栏暂不挂载；页面 cr-flow-guide 仍可直达
]

export const courseRegistrationDevelopedPages = new Set([
  'cr-flow-guide',
  'cr-schedule',
  'cr-batch',
  'cr-rules',
  'cr-monitor',
  'cr-approval',
  'cr-supplement',
  'cr-result',
  'cr-log',
  'cr-fee-roster',
  'crs-register',
  'crs-adddrop',
  'crs-result',
  'crs-payment',
])

export function findCourseRegistrationLabelKey(id) {
  return findMenuLabelKey(id, courseRegistrationMenuItems)
}

export function findCourseRegistrationParentId(id) {
  return findParentId(id, courseRegistrationMenuItems)
}

export function buildCourseRegistrationBreadcrumbKeys(pageId) {
  return buildMenuBreadcrumbKeys(pageId, courseRegistrationModuleKey, courseRegistrationMenuItems)
}
