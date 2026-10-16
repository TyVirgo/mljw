/** 学生端加退重修申请列表：按类型的主表列配置 */

/** 学生端可见 Tab（含加退关联、重修关联） */
export const ADD_DROP_TYPE_TABS = ['Add', 'Drop', 'Retake', 'AddDrop', 'RetakeDrop']

/** 全部申请类型 */
export const ADD_DROP_ALL_TYPES = ['Add', 'Drop', 'Retake', 'AddDrop', 'RetakeDrop']

/** 当前阶段不在列表/筛选中展示的类型（关联类型已开放） */
export function isShieldedAddDropType(_type) {
  return false
}

/** 是否含退课分节的关联/退课类型 */
export function isDropLinkedType(type) {
  return type === 'Drop' || type === 'AddDrop' || type === 'RetakeDrop'
}

/** 加退关联（退+加） */
export function isAddDropLinkedType(type) {
  return type === 'AddDrop'
}

/** 重修关联（退+重修） */
export function isRetakeDropLinkedType(type) {
  return type === 'RetakeDrop'
}

/**
 * @typedef {'serial'|'applicationNo'|'status'|'type'|'needDrop'|'studentId'|'studentName'|'programme'|'academicSession'|'addCourse'|'dropCourse'|'retakeCourse'|'section'|'weekRange'|'classTimeVenue'|'lecturers'|'excessCredits'|'fee'|'retakeType'|'feeWaiver'|'credits'|'bill'|'paymentRemindCount'|'paymentRemaining'|'submittedAt'|'actions'} AddDropListColumnId
 */

/** @type {Record<string, AddDropListColumnId[]>} */
export const ADD_DROP_LIST_COLUMNS_BY_TYPE = {
  Add: [
    'serial',
    'applicationNo',
    'academicSession',
    'addCourse',
    'section',
    'weekRange',
    'classTimeVenue',
    'lecturers',
    'excessCredits',
    'fee',
    'status',
    'submittedAt',
    'actions',
  ],
  Drop: [
    'serial',
    'applicationNo',
    'academicSession',
    'dropCourse',
    'section',
    'weekRange',
    'classTimeVenue',
    'lecturers',
    'status',
    'submittedAt',
    'actions',
  ],
  Retake: [
    'serial',
    'applicationNo',
    'academicSession',
    'retakeCourse',
    'section',
    'weekRange',
    'classTimeVenue',
    'lecturers',
    'excessCredits',
    'fee',
    'retakeType',
    'status',
    'submittedAt',
    'actions',
  ],
  AddDrop: [
    'serial',
    'applicationNo',
    'academicSession',
    'dropCourse',
    'addCourse',
    'section',
    'weekRange',
    'classTimeVenue',
    'lecturers',
    'excessCredits',
    'fee',
    'status',
    'submittedAt',
    'actions',
  ],
  RetakeDrop: [
    'serial',
    'applicationNo',
    'academicSession',
    'dropCourse',
    'retakeCourse',
    'section',
    'weekRange',
    'classTimeVenue',
    'lecturers',
    'excessCredits',
    'fee',
    'retakeType',
    'status',
    'submittedAt',
    'actions',
  ],
}

/**
 * 审批列表列：固定含状态 + 申请类型；超出学分/预估费用/账单紧挨学号前
 * 不含加/退/重修课名、分组、周次、时间地点、教师（进详情）
 * @param {string} [type]
 * @param {{ showCheck?: boolean, showPaymentRemaining?: boolean }} [opts]
 */
export function getAddDropApprovalListColumns(type = '', opts = {}) {
  const prefix = []
  if (opts.showCheck) prefix.push('check')
  prefix.push('serial', 'applicationNo', 'status', 'type', 'needDrop')

  /** 费用相关：超出学分 → 预估费用 → 账单 [→ 发送邮件次数 → 缴费剩余] */
  const feeBlock = opts.showPaymentRemaining
    ? ['excessCredits', 'fee', 'bill', 'paymentRemindCount', 'paymentRemaining']
    : ['excessCredits', 'fee', 'bill']

  prefix.push(...feeBlock, 'studentId', 'studentName')

  const middle = []
  if (type === 'Retake' || type === 'RetakeDrop') {
    middle.push('retakeType')
  }

  return [...prefix, ...middle, 'programme', 'submittedAt', 'actions']
}

/** 学生端混合列表公共列（个性字段进详情） */
export const ADD_DROP_COMMON_LIST_COLUMNS = [
  'serial',
  'applicationNo',
  'academicSession',
  'type',
  'needDrop',
  'status',
  'submittedAt',
  'actions',
]

/**
 * @param {string} [type] 空则返回公共列
 */
export function getAddDropListColumns(type) {
  if (!type) return [...ADD_DROP_COMMON_LIST_COLUMNS]
  return ADD_DROP_LIST_COLUMNS_BY_TYPE[type] || ADD_DROP_COMMON_LIST_COLUMNS
}

/** 按申请类型返回 Notes i18n key 列表（已按展示顺序；不含分节填写指引与费用长文） */
export function getAddDropFormNoteKeys(action) {
  const one = 'courseRegistration.student.formNotesOneCourse'
  const eligibility = 'courseRegistration.student.formNotesEligibility'
  const conflict = 'courseRegistration.student.formNotesConflict'
  const dropThenAdd = 'courseRegistration.student.formNotesDropThenAdd'
  const dropThenRetake = 'courseRegistration.student.formNotesDropThenRetake'
  const dropOnly = 'courseRegistration.student.formNotesDropOnly'
  switch (action) {
    case 'Drop':
      return [one, dropOnly]
    case 'Retake':
      return [one, conflict]
    case 'AddDrop':
      return [dropThenAdd, one, eligibility, conflict]
    case 'RetakeDrop':
      return [dropThenRetake, one, conflict]
    case 'Add':
      return [one, eligibility, conflict]
    default:
      return [one, eligibility, conflict]
  }
}

/** Notes 区块标题（按类型） */
export function getAddDropFormNotesTitleKey(action) {
  const map = {
    Add: 'courseRegistration.student.formNotesTitleAdd',
    Drop: 'courseRegistration.student.formNotesTitleDrop',
    Retake: 'courseRegistration.student.formNotesTitleRetake',
    AddDrop: 'courseRegistration.student.formNotesTitleAddDrop',
    RetakeDrop: 'courseRegistration.student.formNotesTitleRetakeDrop',
  }
  return map[action] || map.Add
}

/** Section V 其他申请说明（按类型） */
export function getAddDropDeclarationExtraKey(action) {
  const map = {
    Add: 'courseRegistration.student.declarationExtraAdd',
    Drop: 'courseRegistration.student.declarationExtraDrop',
    Retake: 'courseRegistration.student.declarationExtraRetake',
    AddDrop: 'courseRegistration.student.declarationExtraAddDrop',
    RetakeDrop: 'courseRegistration.student.declarationExtraRetakeDrop',
  }
  return map[action] || map.Add
}
