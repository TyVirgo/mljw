import { ref } from 'vue'

export const movementTypeKeys = [
  'programme-transfer',
  'deferment',
  'resumption',
  'withdrawal',
]

export const consentFormStudentTypes = ['Local', 'Chinese', 'International']

export const studyDurationRules = ['none', 'afterOneYear', 'withinMaxDuration']

let nextConsentFormId = 10

function normalizeFile(raw) {
  if (!raw || !raw.fileName) return null
  return {
    fileName: String(raw.fileName).trim(),
    size: Number(raw.size) || 0,
  }
}

function normalizeRow(raw) {
  const movementType = raw.movementType || ''
  const isProgrammeTransfer = movementType === 'programme-transfer'
  return {
    id: raw.id,
    formName: String(raw.formName || '').trim(),
    movementType,
    studentType: raw.studentType || 'Local',
    studyDurationRule: isProgrammeTransfer
      ? raw.studyDurationRule || 'afterOneYear'
      : raw.studyDurationRule || 'none',
    remark: String(raw.remark || '').trim(),
    studentConsentFile: normalizeFile(raw.studentConsentFile),
    parentConsentFile: normalizeFile(raw.parentConsentFile),
  }
}

export const initialConsentForms = [
  {
    id: 1,
    formName: 'Programme Transfer Consent - Local',
    movementType: 'programme-transfer',
    studentType: 'Local',
    studyDurationRule: 'afterOneYear',
    remark: '',
    studentConsentFile: { fileName: 'pt-consent-local.pdf', size: 245000 },
    parentConsentFile: null,
  },
  {
    id: 2,
    formName: 'Programme Transfer Consent - Chinese',
    movementType: 'programme-transfer',
    studentType: 'Chinese',
    studyDurationRule: 'afterOneYear',
    remark: '',
    studentConsentFile: { fileName: 'pt-consent-chinese.pdf', size: 248000 },
    parentConsentFile: null,
  },
  {
    id: 3,
    formName: 'Programme Transfer Consent - International',
    movementType: 'programme-transfer',
    studentType: 'International',
    studyDurationRule: 'afterOneYear',
    remark: '',
    studentConsentFile: { fileName: 'pt-consent-intl.pdf', size: 251000 },
    parentConsentFile: null,
  },
  {
    id: 4,
    formName: 'Deferment Consent - Local',
    movementType: 'deferment',
    studentType: 'Local',
    studyDurationRule: 'none',
    remark: 'Includes parent consent template',
    studentConsentFile: { fileName: 'def-consent-local-student.pdf', size: 180000 },
    parentConsentFile: { fileName: 'def-consent-local-parent.pdf', size: 165000 },
  },
  {
    id: 5,
    formName: 'Deferment Consent - Chinese',
    movementType: 'deferment',
    studentType: 'Chinese',
    studyDurationRule: 'none',
    remark: 'Includes parent consent template',
    studentConsentFile: { fileName: 'def-consent-chinese-student.pdf', size: 182000 },
    parentConsentFile: { fileName: 'def-consent-chinese-parent.pdf', size: 168000 },
  },
  {
    id: 6,
    formName: 'Deferment Consent - International',
    movementType: 'deferment',
    studentType: 'International',
    studyDurationRule: 'none',
    remark: '',
    studentConsentFile: { fileName: 'def-consent-intl-student.pdf', size: 175000 },
    parentConsentFile: null,
  },
  {
    id: 7,
    formName: 'Withdrawal Consent - International',
    movementType: 'withdrawal',
    studentType: 'International',
    studyDurationRule: 'none',
    remark: 'ISAO approval may apply',
    studentConsentFile: { fileName: 'wdr-consent-intl-student.pdf', size: 190000 },
    parentConsentFile: { fileName: 'wdr-consent-intl-parent.pdf', size: 172000 },
  },
  {
    id: 8,
    formName: 'Withdrawal Consent - Local',
    movementType: 'withdrawal',
    studentType: 'Local',
    studyDurationRule: 'none',
    remark: '',
    studentConsentFile: { fileName: 'wdr-consent-local-student.pdf', size: 188000 },
    parentConsentFile: { fileName: 'wdr-consent-local-parent.pdf', size: 170000 },
  },
  {
    id: 9,
    formName: 'Resumption Consent - Local',
    movementType: 'resumption',
    studentType: 'Local',
    studyDurationRule: 'none',
    remark: '',
    studentConsentFile: { fileName: 'res-consent-local.pdf', size: 160000 },
    parentConsentFile: null,
  },
].map(normalizeRow)

export const consentForms = ref(initialConsentForms.map((row) => ({ ...row })))

export function normalizeStudentTypeForConsent(studentCategory) {
  if (studentCategory === 'China') return 'Chinese'
  return studentCategory || 'Local'
}

export function resolveConsentTemplate(movementType, studentCategory) {
  const studentType = normalizeStudentTypeForConsent(studentCategory)
  return (
    consentForms.value.find(
      (row) => row.movementType === movementType && row.studentType === studentType,
    ) || null
  )
}

export function createEmptyConsentForm() {
  return {
    formName: '',
    movementType: '',
    studentType: '',
    studyDurationRule: 'none',
    remark: '',
    studentConsentFile: null,
    parentConsentFile: null,
  }
}

function isDuplicateMovementAndType(movementType, studentType, excludeId = null) {
  return consentForms.value.some(
    (row) =>
      row.id !== excludeId &&
      row.movementType === movementType &&
      row.studentType === studentType,
  )
}

export function validateConsentFormForm(data, excludeId = null) {
  const errors = {}
  const requireField = (key, message) => {
    if (!errors[key]) errors[key] = message
  }

  if (!String(data.formName || '').trim()) {
    requireField('formName', 'Form name is required.')
  }
  if (!data.movementType) {
    requireField('movementType', 'Applicable movement type is required.')
  }
  if (!data.studentType) {
    requireField('studentType', 'Student Type is required.')
  }
  if (data.movementType === 'programme-transfer') {
    if (!data.studyDurationRule || data.studyDurationRule === 'none') {
      requireField('studyDurationRule', 'Study duration rule is required for programme transfer.')
    }
  }
  if (!data.studentConsentFile?.fileName) {
    requireField('studentConsentFile', 'Student consent file is required.')
  }
  if (
    data.movementType &&
    data.studentType &&
    isDuplicateMovementAndType(data.movementType, data.studentType, excludeId)
  ) {
    requireField('movementType', 'Movement type and Student Type combination already exists.')
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function createConsentForm(form) {
  const row = normalizeRow({
    id: nextConsentFormId++,
    ...form,
  })
  consentForms.value.push(row)
  return row
}

export function updateConsentForm(id, patch) {
  const index = consentForms.value.findIndex((row) => row.id === id)
  if (index === -1) return null
  const current = consentForms.value[index]
  const next = normalizeRow({
    ...current,
    ...patch,
    id: current.id,
  })
  consentForms.value[index] = next
  return next
}

export function deleteConsentForms(ids) {
  const idSet = new Set(ids)
  consentForms.value = consentForms.value.filter((row) => !idSet.has(row.id))
}

export function getConsentFormById(id) {
  return consentForms.value.find((row) => row.id === id) || null
}

export function getDistinctFormNames() {
  const names = new Set()
  for (const row of consentForms.value) {
    if (row.formName) names.add(row.formName)
  }
  return [...names].sort()
}

function parseIntakeDate(intake) {
  const match = String(intake || '').match(/^(\d{4})\/(\d{2})$/)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, 1)
}

export function checkProgrammeTransferStudyDurationEligibility(student, template) {
  if (!template || !template.studyDurationRule || template.studyDurationRule === 'none') {
    return { valid: true, error: '' }
  }
  if (template.studyDurationRule === 'withinMaxDuration') {
    return { valid: true, error: '' }
  }
  if (template.studyDurationRule === 'afterOneYear') {
    const start = parseIntakeDate(student?.enrollment?.intake)
    if (!start) return { valid: true, error: '' }
    const elapsedMs = Date.now() - start.getTime()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    if (elapsedMs < oneYearMs) {
      return { valid: false, error: 'Programme transfer requires at least one academic year since intake.' }
    }
  }
  return { valid: true, error: '' }
}
