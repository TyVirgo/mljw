import { getAttachmentExtension } from './attachmentPreview.js'

export const MOVEMENT_EXPORT_SUFFIX = {
  'programme-transfer': 'Programme Transfer',
  deferment: 'Deferment',
  resumption: 'Resumption',
  withdrawal: 'Withdrawal',
}

export const MOVEMENT_FORM_TITLE = {
  'programme-transfer': 'Programme Transfer Form',
  deferment: 'Deferment Form',
  resumption: 'Resumption Form',
  withdrawal: 'Withdrawal Form',
}

export const ATTACHMENT_EXPORT_TYPE_LABEL = {
  consentLetter: 'Consent Letter',
  flightTickets: 'Flight Tickets',
  medicalRecovery: 'Medical Recovery',
  accommodationCheckOut: 'Accommodation Check Out',
  medicalRecord: 'Medical Record',
  visaRelatedDocuments: 'Visa Related Documents',
  otherDocuments: 'Other Documents',
}

/** Approved with manual archive number; otherwise NA prefix label */
export function resolveMovementExportArchiveNumber(item) {
  if (item?.status !== 'Approved') return 'NA'
  const trimmed = String(item?.exportArchiveNumber ?? '').trim()
  if (trimmed && trimmed !== 'NA') return trimmed
  return 'NA'
}

function formatStudentNameUpper(item) {
  return String(item?.fullName || item?.name || '')
    .trim()
    .toUpperCase()
}

function resolveFormPeriodSuffix(sourceKey, item) {
  if (sourceKey === 'deferment') {
    const period = String(item?.defermentPeriod || '').replace('/', '')
    return period || ''
  }
  if (sourceKey === 'resumption') {
    const period = String(item?.resumptionSemester || item?.defermentSemester || '').replace('/', '')
    return period || ''
  }
  return ''
}

export function buildMovementFormPdfFilename(sourceKey, item) {
  const archiveNo = resolveMovementExportArchiveNumber(item)
  const prefix = archiveNo === 'NA' ? 'NA.' : `${archiveNo}.`
  const studentId = String(item?.studentId || '').trim()
  const name = formatStudentNameUpper(item)
  const formTitle = MOVEMENT_FORM_TITLE[sourceKey] || 'Movement Form'
  const period = resolveFormPeriodSuffix(sourceKey, item)
  const tail = period ? ` ${period}` : ''
  return `${prefix} ${studentId} ${name} - ${formTitle}${tail}.pdf`
}

export function buildMovementAttachmentExportFilename(sourceKey, item, documentTypeKey, fileName) {
  const archiveNo = resolveMovementExportArchiveNumber(item)
  const prefix = archiveNo === 'NA' ? 'NA.' : `${archiveNo}.`
  const studentId = String(item?.studentId || '').trim()
  const name = formatStudentNameUpper(item)
  const docType = ATTACHMENT_EXPORT_TYPE_LABEL[documentTypeKey] || documentTypeKey
  const movementType = MOVEMENT_EXPORT_SUFFIX[sourceKey] || 'Movement'
  const ext = getAttachmentExtension(fileName)
  const base = `${prefix} ${studentId} ${name}_ ${docType}_${movementType}`
  return ext ? `${base}.${ext}` : base
}
