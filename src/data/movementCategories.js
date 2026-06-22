import { ref } from 'vue'

/** 异动类别配置专用 Student Type（与学籍档案 China 区分，此处用 Chinese） */
export const movementCategoryStudentTypes = ['Local', 'Chinese', 'International']

export const MOVEMENT_SOURCE_TO_CATEGORY_CODE = {
  'programme-transfer': 'PT001',
  deferment: 'DEF001',
  withdrawal: 'WDR001',
  resumption: 'RES001',
}

export const studentStatusOptions = [
  'Offered',
  'Unregistered',
  'Defer Registration',
  'Active',
  'Deferment',
  'Withdrawal',
  'Completion',
  'Graduated',
  'Completion without Graduation',
  'Incomplete',
  'Expel',
]

export const studentStatusCategoryMap = {
  Offered: ['Normal', 'Inbound Mobility'],
  Unregistered: ['Normal', 'Inbound Mobility'],
  'Defer Registration': ['Normal', 'Inbound Mobility'],
  Active: [
    'Normal',
    'Programme Transfer',
    'Inbound Mobility',
    'Outbound Mobility',
    'IEP',
    'Completion without Graduation*',
  ],
  Deferment: [
    'Normal',
    'Programme Transfer',
    'Inbound Mobility',
    'IEP',
    'Completion without Graduation*',
  ],
  Withdrawal: ['Normal', 'Programme Transfer', 'Inbound Mobility', 'IEP'],
  Completion: ['Normal', 'Programme Transfer', 'Inbound Mobility', 'Completion without Graduation*'],
  Graduated: ['Normal', 'Programme Transfer', 'Completion without Graduation*'],
  'Completion without Graduation': ['Normal', 'Programme Transfer'],
  Incomplete: ['Normal', 'Programme Transfer'],
  Expel: ['Normal', 'Programme Transfer', 'Inbound Mobility'],
}

export function getCategoriesForStatus(status) {
  return studentStatusCategoryMap[status] || []
}

let nextCategoryId = 13
let nextReasonId = 1

function normalizeRow(raw) {
  return {
    id: raw.id,
    categoryCode: String(raw.categoryCode || '').trim(),
    categoryName: String(raw.categoryName || '').trim(),
    studentStatus: raw.studentStatus || '',
    category: raw.category || '',
    studentType: raw.studentType || 'Local',
    allowStudentApply: raw.allowStudentApply !== false,
    modifyStudentStatus: raw.modifyStudentStatus === true,
    modifyStudentType: raw.modifyStudentType === true,
    autoImplement: raw.autoImplement === true,
    reasons: Array.isArray(raw.reasons)
      ? raw.reasons.map((r) => ({
          id: r.id,
          reasonName: String(r.reasonName || '').trim(),
        }))
      : [],
  }
}

/** 4 组 × 3 Student Type，共 12 条 mock */
export const initialMovementCategories = [
  {
    id: 1,
    categoryCode: 'PT001',
    categoryName: 'Programme Transfer',
    studentStatus: 'Active',
    category: 'Programme Transfer',
    studentType: 'Local',
    allowStudentApply: true,
    modifyStudentStatus: false,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 2,
    categoryCode: 'PT001',
    categoryName: 'Programme Transfer',
    studentStatus: 'Active',
    category: 'Programme Transfer',
    studentType: 'International',
    allowStudentApply: true,
    modifyStudentStatus: false,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 3,
    categoryCode: 'PT001',
    categoryName: 'Programme Transfer',
    studentStatus: 'Active',
    category: 'Programme Transfer',
    studentType: 'Chinese',
    allowStudentApply: true,
    modifyStudentStatus: false,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 4,
    categoryCode: 'DEF001',
    categoryName: 'Deferment',
    studentStatus: 'Deferment',
    category: 'Normal',
    studentType: 'Local',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 5,
    categoryCode: 'DEF001',
    categoryName: 'Deferment',
    studentStatus: 'Deferment',
    category: 'Normal',
    studentType: 'International',
    allowStudentApply: false,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 6,
    categoryCode: 'DEF001',
    categoryName: 'Deferment',
    studentStatus: 'Deferment',
    category: 'Normal',
    studentType: 'Chinese',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 7,
    categoryCode: 'WDR001',
    categoryName: 'Withdrawal',
    studentStatus: 'Withdrawal',
    category: 'Normal',
    studentType: 'Local',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 8,
    categoryCode: 'WDR001',
    categoryName: 'Withdrawal',
    studentStatus: 'Withdrawal',
    category: 'Normal',
    studentType: 'International',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 9,
    categoryCode: 'WDR001',
    categoryName: 'Withdrawal',
    studentStatus: 'Withdrawal',
    category: 'Normal',
    studentType: 'Chinese',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 10,
    categoryCode: 'RES001',
    categoryName: 'Resumption',
    studentStatus: 'Active',
    category: 'Normal',
    studentType: 'Local',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: true,
    reasons: [],
  },
  {
    id: 11,
    categoryCode: 'RES001',
    categoryName: 'Resumption',
    studentStatus: 'Active',
    category: 'Normal',
    studentType: 'International',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
  {
    id: 12,
    categoryCode: 'RES001',
    categoryName: 'Resumption',
    studentStatus: 'Active',
    category: 'Normal',
    studentType: 'Chinese',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    reasons: [],
  },
].map(normalizeRow)

export const movementCategories = ref(initialMovementCategories.map((r) => ({ ...r, reasons: [...r.reasons] })))

export function mapStudentCategoryToConfigType(studentCategory) {
  if (studentCategory === 'China') return 'Chinese'
  return studentCategory || 'Local'
}

export function resolveMovementCategoryConfig(sourceKey, studentCategory) {
  const categoryCode = MOVEMENT_SOURCE_TO_CATEGORY_CODE[sourceKey]
  if (!categoryCode) return null
  const studentType = mapStudentCategoryToConfigType(studentCategory)
  return (
    movementCategories.value.find(
      (row) => row.categoryCode === categoryCode && row.studentType === studentType,
    ) || null
  )
}

export function getInitialImplementedStatus(sourceKey, studentCategory) {
  const config = resolveMovementCategoryConfig(sourceKey, studentCategory)
  return config?.autoImplement === true ? 'Implemented' : 'Pending'
}

export function createEmptyMovementCategoryForm() {
  return {
    categoryCode: '',
    categoryName: '',
    studentStatus: '',
    category: '',
    studentType: '',
    allowStudentApply: true,
    modifyStudentStatus: false,
    modifyStudentType: false,
    autoImplement: false,
  }
}

function isDuplicateCodeAndType(categoryCode, studentType, excludeId = null) {
  const code = String(categoryCode || '').trim().toLowerCase()
  return movementCategories.value.some(
    (row) =>
      row.id !== excludeId &&
      row.categoryCode.trim().toLowerCase() === code &&
      row.studentType === studentType,
  )
}

export function validateMovementCategoryForm(data, mode = 'create', excludeId = null) {
  const errors = {}
  const requireField = (key, message) => {
    if (!errors[key]) errors[key] = message
  }

  if (!String(data.categoryCode || '').trim()) {
    requireField('categoryCode', 'Category code is required.')
  }
  if (!String(data.categoryName || '').trim()) {
    requireField('categoryName', 'Category name is required.')
  }
  if (!data.studentStatus) {
    requireField('studentStatus', 'Student Status is required.')
  }
  if (!data.category) {
    requireField('category', 'Category is required.')
  } else if (data.studentStatus) {
    const allowed = getCategoriesForStatus(data.studentStatus)
    if (!allowed.includes(data.category)) {
      requireField('category', 'Category is not allowed for the selected Student Status.')
    }
  }
  if (!data.studentType) {
    requireField('studentType', 'Student Type is required.')
  }

  if (
    data.categoryCode &&
    data.studentType &&
    isDuplicateCodeAndType(data.categoryCode, data.studentType, excludeId)
  ) {
    requireField('categoryCode', 'Category code and Student Type combination already exists.')
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function createMovementCategory(form) {
  const row = normalizeRow({
    id: nextCategoryId++,
    ...form,
    categoryCode: form.categoryCode.trim(),
    categoryName: form.categoryName.trim(),
    reasons: [],
  })
  movementCategories.value.push(row)
  return row
}

export function updateMovementCategory(id, patch) {
  const index = movementCategories.value.findIndex((row) => row.id === id)
  if (index === -1) return null
  const current = movementCategories.value[index]
  const next = normalizeRow({
    ...current,
    ...patch,
    id: current.id,
    reasons: current.reasons,
  })
  movementCategories.value[index] = next
  return next
}

export function deleteMovementCategories(ids) {
  const idSet = new Set(ids)
  movementCategories.value = movementCategories.value.filter((row) => !idSet.has(row.id))
}

export function getMovementCategoryById(id) {
  return movementCategories.value.find((row) => row.id === id) || null
}

export function addReason(categoryId, reasonName) {
  const row = getMovementCategoryById(categoryId)
  if (!row) return null
  const name = String(reasonName || '').trim()
  if (!name) return null
  const reason = { id: nextReasonId++, reasonName: name }
  row.reasons.push(reason)
  return reason
}

export function updateReason(categoryId, reasonId, reasonName) {
  const row = getMovementCategoryById(categoryId)
  if (!row) return null
  const name = String(reasonName || '').trim()
  if (!name) return null
  const reason = row.reasons.find((r) => r.id === reasonId)
  if (!reason) return null
  reason.reasonName = name
  return reason
}

export function deleteReasons(categoryId, reasonIds) {
  const row = getMovementCategoryById(categoryId)
  if (!row) return
  const idSet = new Set(reasonIds)
  row.reasons = row.reasons.filter((r) => !idSet.has(r.id))
}

export function validateReasonName(reasonName) {
  const name = String(reasonName || '').trim()
  if (!name) return { valid: false, error: 'Reason name is required.' }
  return { valid: true, error: '' }
}

export function getDistinctCategoryNames() {
  const names = new Set()
  for (const row of movementCategories.value) {
    if (row.categoryName) names.add(row.categoryName)
  }
  return [...names].sort()
}
