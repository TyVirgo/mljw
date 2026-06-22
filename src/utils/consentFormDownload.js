import { resolveConsentTemplate } from '../data/consentForms.js'

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

export function downloadStudentConsentTemplate(movementType, studentCategory, t) {
  const template = resolveConsentTemplate(movementType, studentCategory)
  if (!template?.studentConsentFile) {
    window.alert(t('consentForm.downloadNotConfigured'))
    return false
  }
  downloadMockConsentFile(template.studentConsentFile, template.formName)
  return true
}

export function downloadParentConsentTemplate(movementType, studentCategory, t) {
  const template = resolveConsentTemplate(movementType, studentCategory)
  if (!template?.parentConsentFile) {
    window.alert(t('consentForm.parentDownloadNotConfigured'))
    return false
  }
  downloadMockConsentFile(template.parentConsentFile, `${template.formName} - Parent`)
  return true
}

export function hasParentConsentTemplate(movementType, studentCategory) {
  const template = resolveConsentTemplate(movementType, studentCategory)
  return Boolean(template?.parentConsentFile?.fileName)
}
