/** 学生端加退重修申请列表：按类型的主表列配置 */

/** 学生端可见 Tab（加退关联先屏蔽） */
export const ADD_DROP_TYPE_TABS = ['Add', 'Drop', 'Retake']

/** 含重修与加退关联的完整类型（内部/历史数据仍可能出现 AddDrop） */
export const ADD_DROP_ALL_TYPES = ['Add', 'Drop', 'Retake', 'AddDrop']

/** 当前阶段不在列表/筛选中展示的类型 */
export function isShieldedAddDropType(type) {
  return type === 'AddDrop'
}

/**
 * @typedef {'serial'|'applicationNo'|'status'|'type'|'studentId'|'studentName'|'academicSession'|'addCourse'|'dropCourse'|'retakeCourse'|'section'|'weekRange'|'classTime'|'venue'|'classTimeVenue'|'lecturers'|'excessCredits'|'fee'|'retakeType'|'feeWaiver'|'credits'|'bill'|'submittedAt'|'actions'} AddDropListColumnId
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
    'feeWaiver',
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
    'feeWaiver',
    'status',
    'submittedAt',
    'actions',
  ],
}

/** 审批端：未筛类型时的宽列（含三科名） */
const APPROVAL_WIDE_MIDDLE = [
  'addCourse',
  'dropCourse',
  'retakeCourse',
  'section',
  'weekRange',
  'classTimeVenue',
  'lecturers',
  'excessCredits',
  'fee',
]

/**
 * 审批列表列：固定含状态 + 申请类型；类型筛时与学生该类型业务列对齐
 * @param {string} [type]
 * @param {{ showCheck?: boolean }} [opts]
 */
export function getAddDropApprovalListColumns(type = '', opts = {}) {
  const prefix = []
  if (opts.showCheck) prefix.push('check')
  prefix.push('serial', 'applicationNo', 'status', 'type', 'studentId', 'studentName')

  let middle
  if (type && ADD_DROP_LIST_COLUMNS_BY_TYPE[type]) {
    const skip = new Set(['serial', 'applicationNo', 'status', 'submittedAt', 'actions'])
    middle = ADD_DROP_LIST_COLUMNS_BY_TYPE[type].filter((c) => !skip.has(c))
  } else {
    middle = [...APPROVAL_WIDE_MIDDLE]
  }

  return [...prefix, ...middle, 'bill', 'submittedAt', 'actions']
}

export function getAddDropListColumns(type) {
  return ADD_DROP_LIST_COLUMNS_BY_TYPE[type] || ADD_DROP_LIST_COLUMNS_BY_TYPE.Add
}

/** 按申请类型返回 Notes i18n key 列表（已按展示顺序；不含分节填写指引与费用长文） */
export function getAddDropFormNoteKeys(action) {
  const one = 'courseRegistration.student.formNotesOneCourse'
  const eligibility = 'courseRegistration.student.formNotesEligibility'
  const conflict = 'courseRegistration.student.formNotesConflict'
  const dropThenAdd = 'courseRegistration.student.formNotesDropThenAdd'
  const dropOnly = 'courseRegistration.student.formNotesDropOnly'
  switch (action) {
    case 'Drop':
      return [one, dropOnly]
    case 'Retake':
      return [one, conflict]
    case 'AddDrop':
      return [dropThenAdd, one, eligibility, conflict]
    case 'Add':
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
  }
  return map[action] || map.Add
}
