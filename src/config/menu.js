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
  { id: 'programme-info', label: 'Programme Info', icon: 'database' },
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

export const developedPages = new Set(['dashboard', 'block-management', 'classroom-info', 'university-info'])

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
