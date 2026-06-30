import {
  resolveConsentTemplate,
} from '../data/consentForms.js'

export function downloadMockConsentFile(fileMeta, label = 'Consent Form') {
  if (!fileMeta?.fileName) return
  const content = `Mock consent template: ${label}\nFile: ${fileMeta.fileName}\n`
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileMeta.fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function resolveForDownload(movementType, studentCategory, lookup = {}) {
  const programmeLevel = lookup.programmeLevel ?? ''
  return resolveConsentTemplate(movementType, studentCategory, programmeLevel)
}

export function downloadStudentConsentTemplate(
  movementType,
  studentCategory,
  t,
  lookup = {},
) {
  const template = resolveForDownload(movementType, studentCategory, lookup)
  if (!template?.studentConsentFile) {
    window.alert(t('consentForm.downloadNoMatchContactAdmin'))
    return false
  }
  downloadMockConsentFile(template.studentConsentFile, template.formName)
  return true
}

export function downloadParentConsentTemplate(
  movementType,
  studentCategory,
  t,
  lookup = {},
) {
  const template = resolveForDownload(movementType, studentCategory, lookup)
  if (!template?.parentConsentFile) {
    window.alert(t('consentForm.downloadNoMatchContactAdmin'))
    return false
  }
  downloadMockConsentFile(template.parentConsentFile, `${template.formName} - Parent`)
  return true
}

export function hasParentConsentTemplate(movementType, studentCategory, lookup = {}) {
  const template = resolveForDownload(movementType, studentCategory, lookup)
  return Boolean(template?.parentConsentFile?.fileName)
}

