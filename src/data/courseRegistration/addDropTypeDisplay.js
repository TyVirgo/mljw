/**
 * 加退课申请类型展示：三是否拼接 + 旧主类型兜底；表单/筛选/列表/详情共用
 */
import {
  displayPrimaryType,
  needDropFromAction,
  resolveIntentFlagsFromApp,
} from './addDropFormSections.js'

/** @type {Record<string, string>} */
const PRIMARY_TAG_CLASS = {
  Add: 'type-add',
  Drop: 'type-drop',
  Retake: 'type-retake',
  Replace: 'type-replace',
}

/**
 * 列表/详情申请类型文案 key（主类型三描述，与 primaryOption 同源）
 * @deprecated 优先 formatAddDropApplicationTypeLabel；保留兼容只传 type 的调用
 * @param {string} [type]
 */
export function addDropTypeLabelKey(type) {
  const primary = displayPrimaryType(type) || type || 'Add'
  return `courseRegistration.approval.primaryOption.${primary}`
}

/**
 * 详情/审批/列表：按意图拼「退课/加课/重修」（/ 分隔）
 * @param {object|string|null|undefined} appOrType 申请对象或旧 type 字符串
 * @param {(key: string) => string} t
 */
export function formatAddDropApplicationTypeLabel(appOrType, t) {
  const app =
    appOrType && typeof appOrType === 'object'
      ? appOrType
      : { type: appOrType }
  const flags = resolveIntentFlagsFromApp(app)
  const parts = []
  if (flags.needDrop === 'yes') {
    parts.push(t('courseRegistration.approval.typeFlag.Drop'))
  }
  if (flags.needAdd === 'yes') {
    parts.push(t('courseRegistration.approval.typeFlag.Add'))
  }
  if (flags.needRetake === 'yes') {
    parts.push(t('courseRegistration.approval.typeFlag.Retake'))
  }
  if (parts.length) return parts.join('/')
  const type = app.type || ''
  if (!type) return '—'
  return t(addDropTypeLabelKey(type))
}

/**
 * 列表/详情色标 class（按主导意图）
 * @param {string} [type]
 * @param {object|null} [app]
 */
export function addDropTypeTagClass(type, app = null) {
  if (app) {
    const flags = resolveIntentFlagsFromApp(app)
    if (flags.needDrop === 'yes' && flags.needAdd !== 'yes' && flags.needRetake !== 'yes') {
      return PRIMARY_TAG_CLASS.Drop
    }
    if (flags.needRetake === 'yes' && flags.needAdd !== 'yes') return PRIMARY_TAG_CLASS.Retake
    if (flags.needAdd === 'yes') return PRIMARY_TAG_CLASS.Add
    if (flags.needDrop === 'yes') return PRIMARY_TAG_CLASS.Drop
  }
  const primary = displayPrimaryType(type) || type
  return PRIMARY_TAG_CLASS[primary] || ''
}

/**
 * 课程行申请类型（加课/退课/重修）→ 胶囊 class（增量 bi）
 * @param {string} [action] Add|Drop|Retake
 * @returns {string} type-add|type-drop|type-retake|''
 */
export function addDropLineActionTagClass(action) {
  const raw = String(action || '').trim().toLowerCase()
  if (raw === 'drop') return PRIMARY_TAG_CLASS.Drop
  if (raw === 'retake') return PRIMARY_TAG_CLASS.Retake
  if (raw === 'add') return PRIMARY_TAG_CLASS.Add
  return ''
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
  const flags = resolveIntentFlagsFromApp(app)
  if (flags.needDrop === 'yes' || flags.needDrop === 'no') return flags.needDrop
  const fromType = needDropFromAction(app.type)
  if (fromType === 'yes' || fromType === 'no') return fromType
  if (app.type === 'Drop') return 'yes'
  return 'no'
}
