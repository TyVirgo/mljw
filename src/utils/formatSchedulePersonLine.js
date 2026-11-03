/**
 * 课表表头身份行：编号 + 姓名（空值容错）
 * @param {string|null|undefined} idPart 学号或 Staff ID
 * @param {string|null|undefined} namePart 姓名
 * @returns {string}
 */
export function formatSchedulePersonLine(idPart, namePart) {
  const idText = String(idPart || '').trim()
  const nameText = String(namePart || '').trim()
  if (idText && nameText) return `${idText} ${nameText}`
  return idText || nameText || ''
}
