import { ref } from 'vue'
import { normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'
import { getCodeSetOptions } from './codeSets.js'

export const consentProgrammeLevelCodeSetId = 'programme-level'

export const movementTypeKeys = [
  'programme-transfer',
  'deferment',
  'resumption',
  'withdrawal',
]

export const consentFormStudentTypes = ['Local', 'Chinese', 'International']

export const consentStudentScopeOptions = ['firstYear', 'secondYearAndAbove']

const VALID_CONSENT_STUDENT_SCOPES = new Set(consentStudentScopeOptions)

const MOCK_CONSENT_CHANGED_BY = 'ADMIN USER'

let nextConsentFormId = 13
let nextVersionId = 100

export const consentProgrammeLevels = ['Foundation', 'Undergraduate', 'Postgraduate']

const LEGACY_L_CODE_MAP = {
  'L3-Foundation': 'Foundation',
  'L4-Diploma': 'Undergraduate',
  'L5-Associate': 'Undergraduate',
  'L6-Bachelor': 'Undergraduate',
  'L7-Master': 'Postgraduate',
  'L8-Doctorate': 'Postgraduate',
}

export function normalizeConsentProgrammeLevel(programmeLevel) {
  const value = String(programmeLevel || '').trim()
  if (!value) return ''
  if (value in LEGACY_L_CODE_MAP) return LEGACY_L_CODE_MAP[value]
  if (value === 'Foundation' || value === 'Undergraduate' || value === 'Postgraduate') return value
  if (value === 'L3-Foundation') return 'Foundation'
  if (value.startsWith('L7-') || value.startsWith('L8-')) return 'Postgraduate'
  if (value.startsWith('L4-') || value.startsWith('L5-') || value.startsWith('L6-')) return 'Undergraduate'
  return value
}

export function getConsentProgrammeLevelOptions() {
  const allowed = new Set(consentProgrammeLevels)
  return getCodeSetOptions(consentProgrammeLevelCodeSetId).filter((opt) => allowed.has(opt.value))
}

function migrateToProgrammeLevel(raw) {
  const direct = String(raw.programmeLevel || '').trim()
  if (direct) return normalizeConsentProgrammeLevel(direct)
  const legacy = String(raw.educationLevel || '').trim()
  return normalizeConsentProgrammeLevel(legacy)
}

function normalizeFile(raw) {
  if (!raw || !raw.fileName) return null
  return {
    fileName: String(raw.fileName).trim(),
    size: Number(raw.size) || 0,
  }
}

function normalizeVersion(raw) {
  const session = normalizeAcademicSession(raw.academicSession)
  return {
    id: raw.id,
    academicSession: session === '—' ? '' : session,
    changedBy: String(raw.changedBy || MOCK_CONSENT_CHANGED_BY).trim(),
    studentConsentFile: normalizeFile(raw.studentConsentFile),
    parentConsentFile: normalizeFile(raw.parentConsentFile),
    updatedAt: String(raw.updatedAt || '').trim(),
    isApplied: Boolean(raw.isApplied),
  }
}

function normalizeApplicableStudentScope(value) {
  const text = String(value || '').trim()
  return VALID_CONSENT_STUDENT_SCOPES.has(text) ? text : ''
}

function normalizeRow(raw) {
  return {
    id: raw.id,
    formName: String(raw.formName || '').trim(),
    movementType: raw.movementType || '',
    studentType: raw.studentType || 'Local',
    programmeLevel: migrateToProgrammeLevel(raw),
    applicableStudentScope: normalizeApplicableStudentScope(raw.applicableStudentScope),
    remark: String(raw.remark || '').trim(),
    studentConsentFile: normalizeFile(raw.studentConsentFile),
    parentConsentFile: normalizeFile(raw.parentConsentFile),
    versions: Array.isArray(raw.versions) ? raw.versions.map(normalizeVersion) : [],
  }
}

function versionEntry(session, studentFile, parentFile, isApplied, meta = {}) {
  return normalizeVersion({
    id: nextVersionId++,
    academicSession: session,
    studentConsentFile: studentFile,
    parentConsentFile: parentFile,
    changedBy: meta.changedBy || MOCK_CONSENT_CHANGED_BY,
    updatedAt: meta.updatedAt || '2025-06-01T10:00:00.000Z',
    isApplied,
  })
}

function undergradVersions(studentBase, parentBase) {
  const student202409 = studentBase
    ? { fileName: studentBase.replace('.pdf', '-202409.pdf'), size: 175000 }
    : null
  const parent202409 = parentBase
    ? { fileName: parentBase.replace('.pdf', '-202409.pdf'), size: 160000 }
    : null
  const student202504 = studentBase ? { fileName: studentBase, size: 180000 } : null
  const parent202504 = parentBase ? { fileName: parentBase, size: 165000 } : null

  return [
    versionEntry('2024/09', student202409, parent202409, false, {
      updatedAt: '2024-09-02T09:00:00.000Z',
    }),
    versionEntry('2025/04', student202504, parent202504, true, {
      updatedAt: '2025-04-01T10:00:00.000Z',
    }),
  ]
}

export const initialConsentForms = [
  {
    id: 1,
    formName: 'Programme Transfer Consent - Local',
    movementType: 'programme-transfer',
    studentType: 'Local',
    programmeLevel: 'Undergraduate',
    applicableStudentScope: 'secondYearAndAbove',
    remark: 'Default template for local undergraduate programme transfer',
    versions: undergradVersions('pt-consent-local.pdf', null),
  },
  {
    id: 2,
    formName: 'Programme Transfer Consent - Chinese',
    movementType: 'programme-transfer',
    studentType: 'Chinese',
    programmeLevel: 'Undergraduate',
    applicableStudentScope: 'firstYear',
    remark: 'Bilingual footnotes required for mainland Chinese students',
    versions: undergradVersions('pt-consent-chinese.pdf', null),
  },
  {
    id: 3,
    formName: 'Programme Transfer Consent - International',
    movementType: 'programme-transfer',
    studentType: 'International',
    programmeLevel: 'Undergraduate',
    remark: 'ISAO verification checklist attached for international students',
    versions: undergradVersions('pt-consent-intl.pdf', null),
  },
  {
    id: 4,
    formName: 'Deferment Consent - Local',
    movementType: 'deferment',
    studentType: 'Local',
    programmeLevel: 'Undergraduate',
    remark: 'Includes parent consent template',
    versions: undergradVersions('def-consent-local-student.pdf', 'def-consent-local-parent.pdf'),
  },
  {
    id: 5,
    formName: 'Deferment Consent - Chinese',
    movementType: 'deferment',
    studentType: 'Chinese',
    programmeLevel: 'Undergraduate',
    remark: 'Parent template must be notarised for Chinese students',
    versions: undergradVersions('def-consent-chinese-student.pdf', 'def-consent-chinese-parent.pdf'),
  },
  {
    id: 6,
    formName: 'Deferment Consent - International',
    movementType: 'deferment',
    studentType: 'International',
    programmeLevel: 'Undergraduate',
    remark: 'Medical deferment endorsement form referenced in appendix',
    versions: undergradVersions('def-consent-intl-student.pdf', null),
  },
  {
    id: 7,
    formName: 'Withdrawal Consent - International',
    movementType: 'withdrawal',
    studentType: 'International',
    programmeLevel: 'Undergraduate',
    remark: 'ISAO approval may apply',
    versions: undergradVersions('wdr-consent-intl-student.pdf', 'wdr-consent-intl-parent.pdf'),
  },
  {
    id: 8,
    formName: 'Withdrawal Consent - Local',
    movementType: 'withdrawal',
    studentType: 'Local',
    programmeLevel: 'Undergraduate',
    remark: 'Dual signature required from student and guardian',
    versions: undergradVersions('wdr-consent-local-student.pdf', 'wdr-consent-local-parent.pdf'),
  },
  {
    id: 9,
    formName: 'Resumption Consent - Local',
    movementType: 'resumption',
    studentType: 'Local',
    programmeLevel: 'Undergraduate',
    remark: 'Reactivation fee acknowledgement included',
    versions: undergradVersions('res-consent-local.pdf', null),
  },
  {
    id: 10,
    formName: 'Programme Transfer Consent - Local (Foundation)',
    movementType: 'programme-transfer',
    studentType: 'Local',
    programmeLevel: 'Foundation',
    remark: 'Foundation programme variant',
    versions: [
      versionEntry(
        '2024/09',
        { fileName: 'pt-consent-local-fou-202409.pdf', size: 238000 },
        null,
        false,
        { updatedAt: '2024-09-02T09:00:00.000Z' },
      ),
      versionEntry(
        '2025/09',
        { fileName: 'pt-consent-local-fou-202509.pdf', size: 242000 },
        null,
        true,
        { updatedAt: '2025-09-02T10:00:00.000Z' },
      ),
    ],
  },
  {
    id: 11,
    formName: 'Deferment Consent - Local (Postgraduate)',
    movementType: 'deferment',
    studentType: 'Local',
    programmeLevel: 'Postgraduate',
    remark: 'Postgraduate variant with parent template',
    versions: [
      versionEntry(
        '2024/04',
        { fileName: 'def-consent-local-pg-202404-student.pdf', size: 183000 },
        { fileName: 'def-consent-local-pg-202404-parent.pdf', size: 168000 },
        false,
        { updatedAt: '2024-04-01T09:00:00.000Z' },
      ),
      versionEntry(
        '2025/04',
        { fileName: 'def-consent-local-pg-202504-student.pdf', size: 187000 },
        { fileName: 'def-consent-local-pg-202504-parent.pdf', size: 172000 },
        true,
        { updatedAt: '2025-04-01T10:00:00.000Z' },
      ),
    ],
  },
  {
    id: 12,
    formName: 'Resumption Consent - Local (Postgraduate)',
    movementType: 'resumption',
    studentType: 'Local',
    programmeLevel: 'Postgraduate',
    remark: 'Research probation clause referenced for PG resumption',
    versions: [
      versionEntry(
        '2024/09',
        { fileName: 'res-consent-local-pg-202409.pdf', size: 158000 },
        null,
        false,
        { updatedAt: '2024-09-02T09:00:00.000Z' },
      ),
      versionEntry(
        '2025/09',
        { fileName: 'res-consent-local-pg-202509.pdf', size: 164000 },
        null,
        true,
        { updatedAt: '2025-09-02T10:00:00.000Z' },
      ),
    ],
  },
].map(normalizeRow)

export const consentForms = ref(initialConsentForms.map((row) => ({ ...row, versions: [...row.versions] })))

export function normalizeStudentTypeForConsent(studentCategory) {
  if (studentCategory === 'China') return 'Chinese'
  return studentCategory || 'Local'
}

export function getAppliedConsentVersion(row) {
  if (!row) return null
  return (row.versions || []).find((version) => version.isApplied) || null
}

export function resolveConsentTemplate(movementType, studentCategory, programmeLevel) {
  const studentType = normalizeStudentTypeForConsent(studentCategory)
  const level = normalizeConsentProgrammeLevel(programmeLevel)
  if (!movementType || !studentType || !level) return null

  const row = consentForms.value.find(
    (item) =>
      item.movementType === movementType &&
      item.studentType === studentType &&
      item.programmeLevel === level,
  )
  if (!row) return null

  const applied = getAppliedConsentVersion(row)
  if (!applied?.studentConsentFile?.fileName) return null

  return {
    configId: row.id,
    formName: row.formName,
    movementType: row.movementType,
    studentType: row.studentType,
    programmeLevel: row.programmeLevel,
    academicSession: applied.academicSession || '',
    studentConsentFile: applied.studentConsentFile,
    parentConsentFile: applied.parentConsentFile,
    versionId: applied.id,
  }
}

export function createEmptyConsentForm() {
  return {
    formName: '',
    movementType: '',
    studentType: '',
    programmeLevel: '',
    applicableStudentScope: '',
    remark: '',
  }
}

function isDuplicateConfig(movementType, studentType, programmeLevel, excludeId = null) {
  return consentForms.value.some(
    (row) =>
      row.id !== excludeId &&
      row.movementType === movementType &&
      row.studentType === studentType &&
      row.programmeLevel === programmeLevel,
  )
}

function isDuplicateVersionSession(configId, academicSession, excludeVersionId = null) {
  const row = getConsentFormById(configId)
  if (!row) return false
  const normalized = normalizeAcademicSession(academicSession)
  const session = normalized === '—' ? '' : normalized
  return (row.versions || []).some(
    (version) => version.id !== excludeVersionId && version.academicSession === session,
  )
}

export function validateConsentFormForm(data, excludeId = null, mode = 'create') {
  const errors = {}
  const requireField = (key, message) => {
    if (!errors[key]) errors[key] = message
  }

  if (!String(data.formName || '').trim()) {
    requireField('formName', 'Form name is required.')
  }

  if (mode === 'edit') {
    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  if (!data.movementType) {
    requireField('movementType', 'Applicable movement type is required.')
  }
  if (!data.studentType) {
    requireField('studentType', 'Student Type is required.')
  }
  if (!data.programmeLevel) {
    requireField('programmeLevel', 'Programme level is required.')
  }
  if (
    data.movementType &&
    data.studentType &&
    data.programmeLevel &&
    isDuplicateConfig(data.movementType, data.studentType, data.programmeLevel, excludeId)
  ) {
    requireField(
      'movementType',
      'Movement type, Student Type, and Programme Level combination already exists.',
    )
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateConsentFormVersion(data, configId) {
  const errors = {}
  const requireField = (key, message) => {
    if (!errors[key]) errors[key] = message
  }

  const session = normalizeAcademicSession(data.academicSession)
  if (!session || session === '—') {
    requireField('academicSession', 'Effective academic session is required.')
  } else if (isDuplicateVersionSession(configId, session)) {
    requireField('academicSession', 'This academic session already exists for this configuration.')
  }
  if (!data.studentConsentFile?.fileName) {
    requireField('studentConsentFile', 'Student consent file is required.')
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function createConsentForm(form) {
  const row = normalizeRow({
    id: nextConsentFormId++,
    formName: form.formName,
    movementType: form.movementType,
    studentType: form.studentType,
    programmeLevel: form.programmeLevel,
    applicableStudentScope: form.applicableStudentScope,
    remark: form.remark,
    studentConsentFile: null,
    parentConsentFile: null,
    versions: [],
  })
  consentForms.value.push(row)
  return getConsentFormById(row.id)
}

export function addConsentFormVersion(configId, payload) {
  const row = getConsentFormById(configId)
  if (!row) return null

  const session = normalizeAcademicSession(payload.academicSession)
  const applyImmediately = Boolean(payload.applyImmediately)
  const entry = normalizeVersion({
    id: nextVersionId++,
    academicSession: session === '—' ? '' : session,
    changedBy: MOCK_CONSENT_CHANGED_BY,
    studentConsentFile: payload.studentConsentFile,
    parentConsentFile: payload.parentConsentFile || null,
    updatedAt: new Date().toISOString(),
    isApplied: applyImmediately,
  })

  let versions = [...(row.versions || []), entry]
  if (applyImmediately) {
    versions = versions.map((version) => ({
      ...version,
      isApplied: version.id === entry.id,
    }))
  }

  return updateConsentForm(configId, { versions })
}

export function updateConsentForm(id, patch) {
  const index = consentForms.value.findIndex((row) => row.id === id)
  if (index === -1) return null

  const current = consentForms.value[index]
  const next = normalizeRow({
    ...current,
    ...patch,
    id: current.id,
    versions: patch.versions !== undefined ? patch.versions : current.versions,
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

export function setAppliedVersion(configId, versionId, apply = true) {
  const row = getConsentFormById(configId)
  if (!row) return null
  const target = (row.versions || []).find((version) => version.id === versionId)
  if (!target) return null

  const versions = (row.versions || []).map((version) => ({
    ...version,
    isApplied: apply ? version.id === versionId : false,
  }))

  return updateConsentForm(configId, { versions })
}

export function deleteConsentFormVersion(configId, versionId) {
  const row = getConsentFormById(configId)
  if (!row) return null

  const versions = (row.versions || []).filter((version) => version.id !== versionId)
  if (versions.length === (row.versions || []).length) return null

  return updateConsentForm(configId, { versions })
}
