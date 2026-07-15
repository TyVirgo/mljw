import {
  buildMenuBreadcrumbKeys,
  findMenuLabelKey,
  findParentId,
} from './menuBreadcrumb.js'

export const courseRegistrationModuleKey = 'menu.courseRegistration'

export const courseRegistrationMenuItems = [
  {
    id: 'cr-guide-group',
    labelKey: 'menu.crGuideGroup',
    icon: 'book',
    children: [
      { id: 'cr-flow-guide', labelKey: 'menu.crFlowGuide' },
    ],
  },
  {
    id: 'cr-student-group',
    labelKey: 'menu.crStudentGroup',
    icon: 'user',
    audience: 'student',
    children: [
      { id: 'crs-register', labelKey: 'menu.crsRegister', audience: 'student' },
      { id: 'crs-schedule', labelKey: 'menu.crsSchedule', audience: 'student' },
      { id: 'crs-adddrop', labelKey: 'menu.crsAddDrop', audience: 'student' },
      { id: 'crs-waitlist', labelKey: 'menu.crsWaitlist', audience: 'student' },
      { id: 'crs-result', labelKey: 'menu.crsResult', audience: 'student' },
    ],
  },
  {
    id: 'cr-config-group',
    labelKey: 'menu.crConfigGroup',
    icon: 'grid',
    audience: 'admin',
    children: [
      { id: 'cr-batch', labelKey: 'menu.crBatch', audience: 'admin' },
    ],
  },
  {
    id: 'cr-process-group',
    labelKey: 'menu.crProcessGroup',
    icon: 'transfer',
    audience: 'admin',
    children: [
      { id: 'cr-monitor', labelKey: 'menu.crMonitor', audience: 'admin' },
      { id: 'cr-supplement', labelKey: 'menu.crSupplement', audience: 'admin' },
      { id: 'cr-approval', labelKey: 'menu.crApproval', audience: 'admin' },
      { id: 'cr-waitlist', labelKey: 'menu.crWaitlist', audience: 'admin' },
    ],
  },
  {
    id: 'cr-result-group',
    labelKey: 'menu.crResultGroup',
    icon: 'user',
    audience: 'admin',
    children: [
      { id: 'cr-result', labelKey: 'menu.crResult', audience: 'admin' },
      { id: 'cr-alert', labelKey: 'menu.crAlert', audience: 'admin' },
    ],
  },
  {
    id: 'cr-governance-group',
    labelKey: 'menu.crGovernanceGroup',
    icon: 'grid',
    audience: 'admin',
    children: [
      { id: 'cr-whitelist', labelKey: 'menu.crWhitelist', audience: 'admin' },
      { id: 'cr-report', labelKey: 'menu.crReport', audience: 'admin' },
    ],
  },
]

export const courseRegistrationDevelopedPages = new Set([
  'cr-flow-guide',
  'cr-batch',
  'cr-monitor',
  'cr-approval',
  'cr-supplement',
  'cr-result',
  'cr-alert',
  'cr-waitlist',
  'cr-whitelist',
  'cr-report',
  'crs-register',
  'crs-schedule',
  'crs-adddrop',
  'crs-waitlist',
  'crs-result',
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
