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
  { id: 'panel-info', label: 'Panel Info', icon: 'database' },
  {
    id: 'site-resources',
    label: 'Site Resources',
    icon: 'location',
    children: [
      { id: 'block-management', label: 'Block Management' },
      { id: 'classroom-info', label: 'Classroom Info' },
    ],
  },
  { id: 'course-information', label: 'Course Information', icon: 'database' },
  {
    id: 'lecturer-info',
    label: 'Lecturer Info',
    icon: 'database',
    children: [
      { id: 'lecturer-information', label: 'Lecturer Information' },
      { id: 'evaluation-settings', label: 'Evaluation Settings' },
    ],
  },
  { id: 'semester-calendar', label: 'Semester & Calendar', icon: 'database' },
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
