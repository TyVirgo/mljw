/**
 * 加退课申请类型展示：主类型三描述 + 是否退课；表单/筛选/列表/详情共用
 */
import { displayPrimaryType, needDropFromAction } from './addDropFormSections.js'

/** @type {Record<string, string>} */
const PRIMARY_TAG_CLASS = {
  Add: 'type-add',
  Drop: 'type-drop',
  Retake: 'type-retake',
  Replace: 'type-replace',
}

/**
 * 列表/详情申请类型文案 key（主类型三描述，与 primaryOption 同源）
 * @param {string} [type]
 */
export function addDropTypeLabelKey(type) {
  const primary = displayPrimaryType(type) || type || 'Add'
  return `courseRegistration.approval.primaryOption.${primary}`
}

/**
 * 列表/详情色标 class（按主类型）
 * @param {string} [type]
 */
export function addDropTypeTagClass(type) {
  const primary = displayPrimaryType(type) || type
  return PRIMARY_TAG_CLASS[primary] || ''
}

/**
 * 主类型三选一（Add/Drop/Retake）→ 筛选项/表单选项文案 key
 * @param {'Add'|'Drop'|'Retake'|string} [primary]
 */
export function addDropPrimaryOptionLabelKey(primary) {
  const key = primary || 'Add'
  return `courseRegistration.approval.primaryOption.${key}`
}

/**
 * 是否退课：yes / no（纯退课默认为 yes）
 * @param {object|null|undefined} app
 * @returns {'yes'|'no'}
 */
export function resolveAppNeedDrop(app) {
  if (!app) return 'no'
  if (app.needDrop === 'yes' || app.needDrop === 'no') return app.needDrop
  const fromType = needDropFromAction(app.type)
  if (fromType === 'yes' || fromType === 'no') return fromType
  if (app.type === 'Drop') return 'yes'
  return 'no'
}
