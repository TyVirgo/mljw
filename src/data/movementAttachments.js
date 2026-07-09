/** Shared movement application document slots and validation. */

export function createEmptyMovementAttachments() {
  return {
    consentLetter: null,
    flightTickets: null,
    medicalRecovery: null,
  }
}

export function isInternationalMovementApplicant(category) {
  return category === 'International'
}

const CONSENT_LABEL_KEYS = {
  'programme-transfer': 'programmeTransfer.fields.consentLetter',
  deferment: 'deferment.fields.consentLetter',
  resumption: 'resumption.fields.consentLetter',
  withdrawal: 'withdrawal.fields.consentLetter',
}

const CONSENT_DOWNLOAD_KEYS = {
  'programme-transfer': 'programmeTransfer.fields.downloadConsent',
  deferment: 'deferment.fields.downloadConsent',
  resumption: 'resumption.fields.downloadConsent',
  withdrawal: 'withdrawal.fields.downloadConsent',
}

const ATTACHMENT_HINT_KEYS = {
  'programme-transfer': 'programmeTransfer.fields.attachmentHint',
  deferment: 'deferment.fields.attachmentHint',
  resumption: 'resumption.fields.attachmentHint',
  withdrawal: 'withdrawal.fields.attachmentHint',
}

export function normalizeMovementAttachments(raw) {
  const empty = createEmptyMovementAttachments()
  if (raw?.attachments && typeof raw.attachments === 'object') {
    for (const key of Object.keys(empty)) {
      const slot = raw.attachments[key]
      empty[key] = slot?.fileName ? { fileName: slot.fileName, size: slot.size ?? 0 } : null
    }
    return empty
  }
  if (raw?.attachment?.fileName) {
    empty.consentLetter = { fileName: raw.attachment.fileName, size: raw.attachment.size ?? 0 }
  }
  return empty
}

/** Keep legacy `attachment` in sync with consent letter for older readers. */
export function withMovementAttachments(record) {
  const attachments = normalizeMovementAttachments(record)
  return {
    ...record,
    attachments,
    attachment: attachments.consentLetter,
  }
}

export function getMovementDocumentFields(sourceKey, studentCategory) {
  const fields = []
  if (sourceKey !== 'resumption') {
    fields.push({
      key: 'consentLetter',
      labelKey: CONSENT_LABEL_KEYS[sourceKey] || 'movementDocuments.fields.consentLetter',
      downloadLabelKey: CONSENT_DOWNLOAD_KEYS[sourceKey],
      required: true,
      showConsentDownload: true,
    })
  }
  if (isInternationalMovementApplicant(studentCategory)) {
    fields.push({
      key: 'flightTickets',
      labelKey: 'movementDocuments.fields.flightTickets',
      required: true,
      showConsentDownload: false,
    })
  }
  if (sourceKey === 'resumption') {
    fields.push({
      key: 'medicalRecovery',
      labelKey: 'movementDocuments.fields.medicalRecovery',
      required: false,
      showConsentDownload: false,
    })
  }
  return fields
}

export function getMovementAttachmentHintKey(sourceKey) {
  return ATTACHMENT_HINT_KEYS[sourceKey] || 'movementDocuments.attachmentHint'
}

export function attachmentErrorKey(fieldKey) {
  return `attachments.${fieldKey}`
}

export function validateMovementAttachmentFile(file) {
  if (!file) return { valid: false, error: 'Supporting document is required.' }
  const allowed = /\.(pdf|jpg|jpeg|png|docx)$/i
  if (!allowed.test(file.name)) {
    return { valid: false, error: 'Supported formats: PDF, JPG, PNG, DOCX.' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Max file size is 5MB.' }
  }
  return {
    valid: true,
    meta: { fileName: file.name, size: file.size },
  }
}

export function validateMovementAttachments(sourceKey, data, requireField, mode = 'submit') {
  if (mode === 'draft') return
  const category = data.studentCategory || 'Local'
  const attachments = normalizeMovementAttachments(data)
  const fields = getMovementDocumentFields(sourceKey, category)
  for (const field of fields) {
    if (field.required && !attachments[field.key]?.fileName) {
      requireField(attachmentErrorKey(field.key), 'Supporting document is required.')
    }
  }
}
