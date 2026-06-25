import { ref } from 'vue'

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

export const trackCategoryOptions = [
  ...new Set(Object.values(studentStatusCategoryMap).flat()),
].sort()

/** @deprecated form no longer filters by status; use trackCategoryOptions */
export function getCategoriesForStatus(status) {
  return studentStatusCategoryMap[status] || []
}

let nextCategoryId = 5

const CATEGORY_SEED_REASON_NAMES = {
  DEF001: [
    'Personal Reason',
    'Health Issue',
    'Financial Reason',
    'Military Service',
    'Others',
  ],
  WDR001: [
    'Financial Problem',
    'Personal Reason',
    'Health Issue',
    'Academic Difficulty',
    'Others',
  ],
  PT001: ['Academic Performance', 'Personal Reason', 'Programme Fit', 'Others'],
}

function buildCategorySeedReasons() {
  const byCode = {}
  let id = 1
  for (const [code, names] of Object.entries(CATEGORY_SEED_REASON_NAMES)) {
    byCode[code] = names.map((reasonName) => ({ id: id++, reasonName }))
  }
  return { byCode, nextId: id }
}

const { byCode: seedReasonsByCode, nextId: seedNextReasonId } = buildCategorySeedReasons()
let nextReasonId = seedNextReasonId

export const PT_OTHERS_REASON_ID = seedReasonsByCode.PT001?.find((r) => r.reasonName === 'Others')?.id ?? null

function normalizeRow(raw) {
  return {
    id: raw.id,
    categoryCode: String(raw.categoryCode || '').trim(),
    categoryName: String(raw.categoryName || '').trim(),
    studentStatus: raw.studentStatus || '',
    category: raw.category || '',
    allowStudentApply: raw.allowStudentApply !== false,
    modifyStudentStatus: raw.modifyStudentStatus === true,
    modifyStudentType: raw.modifyStudentType === true,
    autoImplement: raw.autoImplement === true,
    deleteOriginalCourseList: raw.deleteOriginalCourseList === true,
    presetNewProgrammeBatchList: raw.presetNewProgrammeBatchList === true,
    excludeGradedFromPreset: raw.excludeGradedFromPreset === true,
    reasons: Array.isArray(raw.reasons)
      ? raw.reasons.map((r) => ({
          id: r.id,
          reasonName: String(r.reasonName || '').trim(),
        }))
      : [],
  }
}

export const initialMovementCategories = [
  {
    id: 1,
    categoryCode: 'PT001',
    categoryName: 'Programme Transfer',
    studentStatus: 'Active',
    category: 'Programme Transfer',
    allowStudentApply: true,
    modifyStudentStatus: false,
    modifyStudentType: false,
    autoImplement: false,
    deleteOriginalCourseList: true,
    presetNewProgrammeBatchList: true,
    excludeGradedFromPreset: true,
    reasons: [...(seedReasonsByCode.PT001 || [])],
  },
  {
    id: 2,
    categoryCode: 'DEF001',
    categoryName: 'Deferment',
    studentStatus: 'Deferment',
    category: 'Normal',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    deleteOriginalCourseList: false,
    presetNewProgrammeBatchList: false,
    excludeGradedFromPreset: false,
    reasons: [...(seedReasonsByCode.DEF001 || [])],
  },
  {
    id: 3,
    categoryCode: 'WDR001',
    categoryName: 'Withdrawal',
    studentStatus: 'Withdrawal',
    category: 'Normal',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: false,
    deleteOriginalCourseList: false,
    presetNewProgrammeBatchList: false,
    excludeGradedFromPreset: false,
    reasons: [...(seedReasonsByCode.WDR001 || [])],
  },
  {
    id: 4,
    categoryCode: 'RES001',
    categoryName: 'Resumption',
    studentStatus: 'Active',
    category: 'Normal',
    allowStudentApply: true,
    modifyStudentStatus: true,
    modifyStudentType: false,
    autoImplement: true,
    deleteOriginalCourseList: false,
    presetNewProgrammeBatchList: false,
    excludeGradedFromPreset: false,
    reasons: [],
  },
].map(normalizeRow)

export const movementCategories = ref(
  initialMovementCategories.map((r) => ({ ...r, reasons: r.reasons.map((reason) => ({ ...reason })) })),
)

export function getMovementCategoryByCode(categoryCode) {
  return movementCategories.value.find((row) => row.categoryCode === categoryCode) || null
}

export function getReasonOptionsByCategoryCode(categoryCode) {
  const row = getMovementCategoryByCode(categoryCode)
  return row?.reasons ?? []
}

export function getReasonOptionsBySourceKey(sourceKey) {
  const code = MOVEMENT_SOURCE_TO_CATEGORY_CODE[sourceKey]
  return code ? getReasonOptionsByCategoryCode(code) : []
}

export function resolveReasonLabel(categoryCode, reasonId) {
  if (reasonId == null || reasonId === '') return ''
  const row = getMovementCategoryByCode(categoryCode)
  const reason = row?.reasons?.find((r) => r.id === reasonId)
  return reason?.reasonName ?? ''
}

export function resolveReasonIdByName(categoryCode, reasonName) {
  const name = String(reasonName || '').trim()
  if (!name) return null
  const row = getMovementCategoryByCode(categoryCode)
  const reason = row?.reasons?.find((r) => r.reasonName.toLowerCase() === name.toLowerCase())
  return reason?.id ?? null
}

export function isValidReasonIdForCategory(categoryCode, reasonId) {
  if (reasonId == null || reasonId === '') return false
  const row = getMovementCategoryByCode(categoryCode)
  return row?.reasons?.some((r) => r.id === reasonId) ?? false
}

export function resolveMovementCategoryConfig(sourceKey, _studentCategory) {
  const categoryCode = MOVEMENT_SOURCE_TO_CATEGORY_CODE[sourceKey]
  if (!categoryCode) return null
  return movementCategories.value.find((row) => row.categoryCode === categoryCode) || null
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
    allowStudentApply: true,
    modifyStudentStatus: false,
    modifyStudentType: false,
    autoImplement: false,
    deleteOriginalCourseList: false,
    presetNewProgrammeBatchList: false,
    excludeGradedFromPreset: false,
  }
}

function isDuplicateCode(categoryCode, excludeId = null) {
  const code = String(categoryCode || '').trim().toLowerCase()
  return movementCategories.value.some(
    (row) => row.id !== excludeId && row.categoryCode.trim().toLowerCase() === code,
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
  } else if (!trackCategoryOptions.includes(data.category)) {
    requireField('category', 'Category is invalid.')
  }

  if (data.categoryCode && isDuplicateCode(data.categoryCode, excludeId)) {
    requireField('categoryCode', 'Category code already exists.')
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
