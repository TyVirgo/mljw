/** Portal / header title for the admin shell (all pages in this app belong to this module). */
export const basicDataModuleName = 'Basic Data'

export const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    id: 'basic-info',
    label: 'Basic Info',
    icon: 'database',
    children: [
      { id: 'university-info', label: 'University Info' },
      { id: 'department-info', label: 'Department Info' },
      { id: 'code-set-management', label: 'Code set management' },
    ],
  },
  {
    id: 'programme-info',
    label: 'Programme Info',
    icon: 'database',
    children: [
      { id: 'programme-version', label: 'Programme Version' },
      { id: 'intake-set', label: 'Intake Set' },
      { id: 'programme-intake', label: 'Programme Intake' },
    ],
  },
  {
    id: 'site-resources',
    label: 'Site Resources',
    icon: 'location',
    children: [
      { id: 'block-management', label: 'Block Management' },
      { id: 'classroom-info', label: 'Classroom Info' },
    ],
  },
  {
    id: 'course-info',
    label: 'Course Info',
    icon: 'book',
    children: [
      { id: 'course-information', label: 'Course Info' },
      { id: 'course-application', label: 'Course Application' },
      { id: 'course-approval-process', label: 'Course Approval Process' },
      { id: 'course-change-application', label: 'Course Change Application' },
      { id: 'course-change-review', label: 'Course Change Review' },
    ],
  },
  {
    id: 'lecturer-info',
    label: 'Lecturer Info',
    icon: 'database',
    children: [
      { id: 'lecturer-information', label: 'Lecturer Information' },
      { id: 'evaluation-settings', label: 'Evaluation Settings' },
    ],
  },
  {
    id: 'semester-calendar',
    label: 'Semester & Calendar',
    icon: 'calendar',
    children: [
      { id: 'semester-information', label: 'Semester Information' },
      { id: 'calendar', label: 'Calendar' },
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
])

export function findMenuLabel(id) {
  for (const item of menuItems) {
    if (item.id === id) return item.label
    if (item.children) {
      const child = item.children.find((c) => c.id === id)
      if (child) return child.label
    }
  }
  return 'Dashboard'
}

export function findParentId(id) {
  for (const item of menuItems) {
    if (item.children?.some((c) => c.id === id)) return item.id
  }
  return null
}

/** Breadcrumb labels: module name → parent group (if any) → current page */
export function buildMenuBreadcrumb(pageId) {
  const crumbs = [basicDataModuleName]
  if (pageId === 'dashboard') {
    crumbs.push(findMenuLabel('dashboard'))
    return crumbs
  }
  const parentId = findParentId(pageId)
  if (parentId) {
    crumbs.push(findMenuLabel(parentId))
  }
  crumbs.push(findMenuLabel(pageId))
  return crumbs
}
