/** 课程分组展示名称：优先 name/sectionName，否则「分组名称{code}」 */
export function formatCourseSectionName(sectionOrCode, t) {
  if (sectionOrCode && typeof sectionOrCode === 'object') {
    const name = sectionOrCode.name || sectionOrCode.sectionName
    if (name) return name
    const code = sectionOrCode.code || sectionOrCode.sectionCode || ''
    if (!code) return '—'
    return t
      ? t('courseRegistration.courses.sectionNameDisplay', { code })
      : `分组名称${code}`
  }
  const code = String(sectionOrCode || '').trim()
  if (!code) return '—'
  return t
    ? t('courseRegistration.courses.sectionNameDisplay', { code })
    : `分组名称${code}`
}
