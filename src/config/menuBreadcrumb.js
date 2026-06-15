export function findMenuLabelKey(id, menuItems) {
  for (const item of menuItems) {
    if (item.id === id) return item.labelKey
    if (item.children) {
      const child = item.children.find((c) => c.id === id)
      if (child) return child.labelKey
    }
  }
  return menuItems[0]?.labelKey ?? 'menu.dashboard'
}

export function findParentId(id, menuItems) {
  for (const item of menuItems) {
    if (item.children?.some((c) => c.id === id)) return item.id
  }
  return null
}

/** Breadcrumb i18n keys: module → parent group (if any) → current page */
export function buildMenuBreadcrumbKeys(pageId, moduleKey, menuItems) {
  const keys = [moduleKey]
  if (pageId === 'dashboard') {
    keys.push(findMenuLabelKey('dashboard', menuItems))
    return keys
  }
  const parentId = findParentId(pageId, menuItems)
  if (parentId) {
    keys.push(findMenuLabelKey(parentId, menuItems))
  }
  keys.push(findMenuLabelKey(pageId, menuItems))
  return keys
}
