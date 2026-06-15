import {
  buildMenuBreadcrumbKeys as buildBreadcrumbKeys,
  findMenuLabelKey as findLabelKey,
  findParentId as findMenuParentId,
} from './menuBreadcrumb.js'

/** Portal / header title for the admin shell (all pages in this app belong to this module). */
export const basicDataModuleKey = 'menu.basicData'

export const menuItems = [
  { id: 'dashboard', labelKey: 'menu.dashboard', icon: 'dashboard' },
  {
    id: 'basic-info',
    labelKey: 'menu.basicInfo',
    icon: 'database',
    children: [
      { id: 'university-info', labelKey: 'menu.universityInfo' },
      { id: 'department-info', labelKey: 'menu.departmentInfo' },
      { id: 'code-set-management', labelKey: 'menu.codeSetManagement' },
    ],
  },
  {
    id: 'programme-info',
    labelKey: 'menu.programmeInfo',
    icon: 'database',
    children: [
      { id: 'programme-version', labelKey: 'menu.programmeVersion' },
      { id: 'intake-set', labelKey: 'menu.intakeSet' },
      { id: 'programme-intake', labelKey: 'menu.programmeIntake' },
    ],
  },
  {
    id: 'site-resources',
    labelKey: 'menu.siteResources',
    icon: 'location',
    children: [
      { id: 'block-management', labelKey: 'menu.blockManagement' },
      { id: 'classroom-info', labelKey: 'menu.classroomInfo' },
    ],
  },
  {
    id: 'course-info',
    labelKey: 'menu.courseInfo',
    icon: 'book',
    children: [
      { id: 'course-information', labelKey: 'menu.courseInformation' },
      { id: 'course-application', labelKey: 'menu.courseApplication' },
      { id: 'course-approval-process', labelKey: 'menu.courseApprovalProcess' },
      { id: 'course-change-application', labelKey: 'menu.courseChangeApplication' },
      { id: 'course-change-review', labelKey: 'menu.courseChangeReview' },
    ],
  },
  {
    id: 'lecturer-info',
    labelKey: 'menu.lecturerInfo',
    icon: 'database',
    children: [
      { id: 'lecturer-information', labelKey: 'menu.lecturerInformation' },
      { id: 'evaluation-settings', labelKey: 'menu.evaluationSettings' },
    ],
  },
  {
    id: 'semester-calendar',
    labelKey: 'menu.semesterCalendar',
    icon: 'calendar',
    children: [
      { id: 'semester-information', labelKey: 'menu.semesterInformation' },
      { id: 'calendar', labelKey: 'menu.calendar' },
    ],
  },
]

export const developedPages = new Set([
  'dashboard',
  'block-management',
  'classroom-info',
  'university-info',
  'department-info',
  'code-set-management',
  'programme-version',
  'intake-set',
  'programme-intake',
  'semester-information',
  'calendar',
  'course-information',
  'course-application',
  'course-approval-process',
  'course-change-application',
  'course-change-review',
  'lecturer-information',
  'evaluation-settings',
  'lecturer-information',
])

export function findMenuLabelKey(id) {
  return findLabelKey(id, menuItems)
}

export function findParentId(id) {
  return findMenuParentId(id, menuItems)
}

/** Breadcrumb i18n keys: module → parent group (if any) → current page */
export function buildMenuBreadcrumbKeys(pageId) {
  return buildBreadcrumbKeys(pageId, basicDataModuleKey, menuItems)
}
