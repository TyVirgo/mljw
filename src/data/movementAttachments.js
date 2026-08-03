/** Shared movement application document slots and validation. */

/**
 * 创建空附件结构（退学扩展槽位与休学/复学共用空壳，展示由 getMovementDocumentFields 控制）
 */
export function createEmptyMovementAttachments() {
  return {
    consentLetter: null,
    flightTickets: null,
    medicalRecovery: null,
    /** 退学：住宿退宿表（可选） */
    accommodationCheckOut: null,
    /** 退学/休学：病历 Medical Record（可选，与复学 medicalRecovery 分离） */
    medicalRecord: null,
    /** 复学：签证相关材料（中国/其他必填） */
    visaRelatedDocuments: null,
    /** 其他材料，默认一行，可 Add More；第 2 行起可关闭 */
    otherDocuments: [null],
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

/**
 * 将单槽附件规范为 { fileName, size } 或 null
 * @param {unknown} slot 原始槽位
 */
function normalizeFileSlot(slot) {
  return slot?.fileName ? { fileName: slot.fileName, size: slot.size ?? 0 } : null
}

/**
 * 规范化 otherDocuments 数组，至少保留 minSlots 行（缺省 1）
 * @param {unknown} list 原始列表
 * @param {number} [minSlots=1] 最少行数
 */
export function normalizeOtherDocuments(list, minSlots = 1) {
  const source = Array.isArray(list) ? list : []
  const normalized = source.map((slot) => normalizeFileSlot(slot))
  while (normalized.length < minSlots) normalized.push(null)
  return normalized
}

export function normalizeMovementAttachments(raw) {
  const empty = createEmptyMovementAttachments()
  if (raw?.attachments && typeof raw.attachments === 'object') {
    for (const key of Object.keys(empty)) {
      if (key === 'otherDocuments') {
        empty.otherDocuments = normalizeOtherDocuments(raw.attachments.otherDocuments)
        continue
      }
      empty[key] = normalizeFileSlot(raw.attachments[key])
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

/**
 * 将国籍/学生类别归一为附件国家组（与退学图示国家顺序一致）
 * @param {string} [nationality] 国籍英文名
 * @param {string} [studentCategory] Local | China | International
 * @returns {'malaysia'|'china'|'other'}
 */
export function resolveAttachmentNationGroup(nationality, studentCategory) {
  const nat = String(nationality || '').trim()
  const category = String(studentCategory || '').trim()
  if (nat === 'Malaysia' || category === 'Local') return 'malaysia'
  if (nat === 'China' || category === 'China') return 'china'
  return 'other'
}

/**
 * 退学附件字段清单（图示3）：马/中/其他国籍同一套国际生附件包；休学/复学不走此列表
 */
export function getWithdrawalDocumentFields() {
  return [
    {
      key: 'consentLetter',
      labelKey: CONSENT_LABEL_KEYS.withdrawal,
      downloadLabelKey: CONSENT_DOWNLOAD_KEYS.withdrawal,
      required: true,
      showConsentDownload: true,
    },
    {
      key: 'accommodationCheckOut',
      labelKey: 'movementDocuments.fields.accommodationCheckOut',
      required: false,
      showConsentDownload: false,
    },
    {
      key: 'flightTickets',
      labelKey: 'movementDocuments.fields.flightTickets',
      required: true,
      showConsentDownload: false,
    },
    {
      key: 'medicalRecord',
      labelKey: 'movementDocuments.fields.medicalRecord',
      required: false,
      showConsentDownload: false,
    },
    {
      key: 'otherDocuments',
      labelKey: 'movementDocuments.fields.otherDocuments',
      required: false,
      showConsentDownload: false,
      multi: true,
      minSlots: 1,
    },
  ]
}

/**
 * 休学附件字段（图示1–3）：马/中/其他国家不同清单
 * 图1 马来：同意书* + 病历(可选) + 其他
 * 图2 中国 / 图3 其他：同意书* + 病历(可选) + 机票 + 其他
 * @param {string} [nationality] 国籍
 * @param {string} [studentCategory] 学生类别
 */
export function getDefermentDocumentFields(nationality, studentCategory) {
  const group = resolveAttachmentNationGroup(nationality, studentCategory)
  const fields = [
    {
      key: 'consentLetter',
      labelKey: CONSENT_LABEL_KEYS.deferment,
      downloadLabelKey: CONSENT_DOWNLOAD_KEYS.deferment,
      required: true,
      showConsentDownload: true,
    },
    {
      key: 'medicalRecord',
      labelKey: 'movementDocuments.fields.medicalRecordOptional',
      required: false,
      showConsentDownload: false,
    },
  ]
  // 中国 / 其他：增加机票（图示无红星，可选）
  if (group === 'china' || group === 'other') {
    fields.push({
      key: 'flightTickets',
      labelKey: 'movementDocuments.fields.flightTickets',
      required: false,
      showConsentDownload: false,
    })
  }
  fields.push({
    key: 'otherDocuments',
    labelKey: 'movementDocuments.fields.otherDocuments',
    required: false,
    showConsentDownload: false,
    multi: true,
    minSlots: 1,
  })
  return fields
}

/**
 * 复学附件字段（图示1–3）：马/中/其他国家不同清单；无同意书
 * 图1 马来：医疗康复(可选) + 其他
 * 图2 中国 / 图3 其他：签证相关* + 医疗康复(可选) + 其他
 * @param {string} [nationality] 国籍
 * @param {string} [studentCategory] 学生类别
 */
export function getResumptionDocumentFields(nationality, studentCategory) {
  const group = resolveAttachmentNationGroup(nationality, studentCategory)
  const fields = []
  // 中国 / 其他：签证相关材料必填
  if (group === 'china' || group === 'other') {
    fields.push({
      key: 'visaRelatedDocuments',
      labelKey: 'movementDocuments.fields.visaRelatedDocuments',
      required: true,
      showConsentDownload: false,
    })
  }
  fields.push(
    {
      key: 'medicalRecovery',
      labelKey: 'movementDocuments.fields.medicalRecovery',
      required: false,
      showConsentDownload: false,
    },
    {
      key: 'otherDocuments',
      labelKey: 'movementDocuments.fields.otherDocuments',
      required: false,
      showConsentDownload: false,
      multi: true,
      minSlots: 1,
    },
  )
  return fields
}

/**
 * 按异动类型返回附件字段
 * @param {string} sourceKey 异动类型
 * @param {string} studentCategory 学生类别
 * @param {string} [nationality] 国籍（休学/复学按国家分支时使用）
 */
export function getMovementDocumentFields(sourceKey, studentCategory, nationality = '') {
  if (sourceKey === 'withdrawal') {
    return getWithdrawalDocumentFields()
  }
  if (sourceKey === 'deferment') {
    return getDefermentDocumentFields(nationality, studentCategory)
  }
  if (sourceKey === 'resumption') {
    return getResumptionDocumentFields(nationality, studentCategory)
  }

  const fields = []
  fields.push({
    key: 'consentLetter',
    labelKey: CONSENT_LABEL_KEYS[sourceKey] || 'movementDocuments.fields.consentLetter',
    downloadLabelKey: CONSENT_DOWNLOAD_KEYS[sourceKey],
    required: true,
    showConsentDownload: true,
  })
  if (isInternationalMovementApplicant(studentCategory)) {
    fields.push({
      key: 'flightTickets',
      labelKey: 'movementDocuments.fields.flightTickets',
      required: true,
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

/**
 * 提交时校验必填附件；multi 槽位不作为整体必填
 * @param {string} sourceKey 异动类型
 * @param {object} data 表单数据
 * @param {Function} requireField 校验回调
 * @param {string} [mode='submit'] draft 跳过
 */
export function validateMovementAttachments(sourceKey, data, requireField, mode = 'submit') {
  if (mode === 'draft') return
  const category = data.studentCategory || 'Local'
  const nationality = data.nationality || ''
  const attachments = normalizeMovementAttachments(data)
  const fields = getMovementDocumentFields(sourceKey, category, nationality)
  for (const field of fields) {
    if (field.multi) continue
    if (field.required && !attachments[field.key]?.fileName) {
      requireField(attachmentErrorKey(field.key), 'Supporting document is required.')
    }
  }
}
