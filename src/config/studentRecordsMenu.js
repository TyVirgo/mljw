import {
  buildMenuBreadcrumbKeys,
  findMenuLabelKey,
  findParentId,
} from './menuBreadcrumb.js'

export const studentRecordsModuleKey = 'menu.studentRecords'

export const studentRecordsMenuItems = [
  {
    id: 'sr-mgmt-group',
    labelKey: 'menu.srManagementGroup',
    icon: 'user',
    children: [
      { id: 'sr-student-profile', labelKey: 'menu.srStudentBasicInfo' },
    ],
  },
  {
    id: 'sr-movement-group',
    labelKey: 'menu.srMovementGroup',
    icon: 'transfer',
    children: [
      { id: 'sr-movement-category', labelKey: 'menu.srMovementCategory' },
      { id: 'sr-consent-form', labelKey: 'menu.srConsentForm' },
      { id: 'sr-movement-application', labelKey: 'menu.srMovementApplication' },
      { id: 'sr-movement-approval', labelKey: 'menu.srMovementApproval' },
      { id: 'sr-movement-maintenance', labelKey: 'menu.srMovementMaintenance' },
      { id: 'sr-movement-query', labelKey: 'menu.srMovementQuery' },
      { id: 'sr-movement-statistics', labelKey: 'menu.srMovementStatistics' },
    ],
  },
  {
    id: 'sr-study-plan-group',
    labelKey: 'menu.srStudyPlanGroup',
    icon: 'book',
    children: [
      { id: 'sr-personal-curriculum', labelKey: 'menu.srPersonalCurriculum' },
    ],
  },
]

export const studentRecordsDevelopedPages = new Set([
  'sr-student-profile',
  'sr-movement-category',
  'sr-consent-form',
  'sr-movement-application',
  'sr-movement-approval',
  'sr-movement-maintenance',
  'sr-movement-query',
])

export function findStudentRecordsLabelKey(id) {
  return findMenuLabelKey(id, studentRecordsMenuItems)
}

export function findStudentRecordsParentId(id) {
  return findParentId(id, studentRecordsMenuItems)
}

export function buildStudentRecordsBreadcrumbKeys(pageId) {
  const parentId = findParentId(pageId, studentRecordsMenuItems)

  if (parentId === 'sr-movement-group') {
    return ['menu.srMovementGroup', findStudentRecordsLabelKey(pageId)]
  }

  if (parentId === 'sr-study-plan-group') {
    return ['menu.srStudyPlanGroup', findStudentRecordsLabelKey(pageId)]
  }

  if (pageId === 'sr-student-profile') {
    return [studentRecordsModuleKey, 'menu.srStudentBasicInfo']
  }

  return buildMenuBreadcrumbKeys(pageId, studentRecordsModuleKey, studentRecordsMenuItems)
}
