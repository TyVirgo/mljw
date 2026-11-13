/**
 * 学生/老师加退申请列表状态展示（增量 y/z/aa）
 * 草稿 / 待审批 / 已驳回（任一驳回行） / 已结束（仅通过与不通过） / 已取消
 */

/**
 * 是否存在驳回行（行操作「驳回」= update_required）
 * @param {object[]|undefined|null} items 课程数据行
 */
export function hasAddDropUpdateRequiredLine(items) {
  return (items || []).some((item) => String(item?.lineDecision || '').trim() === 'update_required')
}

/**
 * 解析 status / items（兼容传申请对象或拆开传）
 * @param {string|object} statusOrApp 内部 status 或申请对象
 * @param {object[]} [items] 课程行（statusOrApp 为 string 时可选）
 * @returns {{ status: string, items: object[] }}
 */
function resolveStatusAndItems(statusOrApp, items) {
  if (statusOrApp && typeof statusOrApp === 'object') {
    return {
      status: String(statusOrApp.status || '').trim(),
      items: Array.isArray(statusOrApp.items) ? statusOrApp.items : items || [],
    }
  }
  return {
    status: String(statusOrApp || '').trim(),
    items: items || [],
  }
}

/** 对外展示键（筛选项文案直接使用，避免与内部 Rejected 二次映射冲突） */
const ADD_DROP_FACING_STATUS_KEYS = new Set([
  'Draft',
  'Pending',
  'Rejected',
  'Ended',
  'Cancelled',
])

/**
 * 内部 status + 行决策 → 对外展示键
 * 增量 aa：终态以全部课程行操作为准——有驳回行→已驳回，否则通过/不通过→已结束
 * @param {string|object} statusOrApp 内部 status 或申请对象
 * @param {object[]} [items] 课程行（传申请对象时可不传；筛选项仅传展示键字符串）
 * @returns {'Draft'|'Pending'|'Rejected'|'Ended'|'Cancelled'|string}
 */
export function resolveAddDropStudentListStatus(statusOrApp, items) {
  // 筛选项等：已是展示键且未附带 items → 原样返回（Rejected 展示键 ≠ 内部 Rejected 无行）
  if (
    typeof statusOrApp === 'string' &&
    ADD_DROP_FACING_STATUS_KEYS.has(statusOrApp) &&
    items === undefined
  ) {
    return statusOrApp
  }
  const parsed = resolveStatusAndItems(statusOrApp, items)
  const raw = parsed.status
  if (raw === 'Draft') return 'Draft'
  if (raw === 'Pending' || raw === 'In Review') return 'Pending'
  if (raw === 'Cancelled') return 'Cancelled'
  // 终态：任一行驳回 → 已驳回
  if (hasAddDropUpdateRequiredLine(parsed.items)) return 'Rejected'
  // 仅通过 / 不通过（含 Approved、PartiallyApproved、无驳回的 Rejected）→ 已结束
  if (raw === 'Approved' || raw === 'PartiallyApproved' || raw === 'Rejected') return 'Ended'
  return raw
}

/**
 * 学生列表四态筛选项
 * @type {string[]}
 */
export const ADD_DROP_STUDENT_LIST_STATUS_OPTIONS = [
  'Draft',
  'Pending',
  'Rejected',
  'Ended',
]

/**
 * 老师历史筛选项：与学生对齐的终态 + 已取消
 * @type {string[]}
 */
export const ADD_DROP_TEACHER_HISTORY_STATUS_OPTIONS = [
  'Rejected',
  'Ended',
  'Cancelled',
]

/**
 * 筛选项是否命中申请
 * @param {string|object} statusOrApp 内部 status 或申请对象
 * @param {string} filterStatus 对外展示键
 * @param {object[]} [items] 课程行
 */
export function matchesAddDropStudentListStatusFilter(statusOrApp, filterStatus, items) {
  const filter = String(filterStatus || '').trim()
  if (!filter) return true
  return resolveAddDropStudentListStatus(statusOrApp, items) === filter
}

/**
 * 展示键 → status-badge class
 * @param {string|object} statusOrApp 内部 status 或申请对象
 * @param {object[]} [items] 课程行
 */
export function addDropStudentListStatusBadgeClass(statusOrApp, items) {
  const key = resolveAddDropStudentListStatus(statusOrApp, items)
  switch (key) {
    case 'Draft':
      return 'status-draft'
    case 'Pending':
      return 'status-pending'
    case 'Rejected':
      return 'status-rejected'
    case 'Ended':
      return 'status-approved'
    case 'Cancelled':
      return 'status-cancelled'
    default:
      return 'status-draft'
  }
}

/**
 * 行决策是否允许学生换课修改（已驳回整单重提）
 * 增量 aa：仅驳回（update_required）可改；通过/不通过只读
 * 增量 ba：换课后 pending 且已标记 resubmitLineModified 时仍可再改/取消
 * 增量 bf：已取消（cancelled）提交前仍可修改
 * @param {string} lineDecision 行决策
 * @param {object|null|undefined} [item] 工作行（可选；用于识别已换课 pending）
 */
export function isAddDropLineEditableForResubmit(lineDecision, item) {
  const decision = String(lineDecision || '').trim()
  if (decision === 'update_required') return true
  // 增量 bf：已取消行提交前仍可改回待审批
  if (decision === 'cancelled') return true
  // 换课成功写 pending 后、整单重提前提交前仍可操作
  if (decision === 'pending' && item && item.resubmitLineModified) return true
  return false
}
