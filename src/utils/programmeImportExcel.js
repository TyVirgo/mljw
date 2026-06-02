import * as XLSX from 'xlsx'
import {
  createEmptyProgrammeForm,
  createInitialAttachments,
  buildVersionFromSave,
  programmeLevelOptions,
  levelOfStudyOptions,
  fieldOfStudyOptions,
  typeOfProgrammeOptions,
  modeOfStudyOptions,
  methodOfDeliveryOptions,
  modeOfOfferOptions,
  awardingBodyOptions,
  mediumOfInstructionOptions,
  methodOfLearningOptions,
  advertisementCodeOptions,
  accStatusOptions,
  typeOfApprovalOptions,
  FEE_AMOUNT_PATTERN,
  FEE_AMOUNT_VALIDATION_MESSAGE,
  localFeeColumns,
  internationalFeeColumns,
  getDepartmentOptions,
} from '../data/programmeVersions.js'

const TEMPLATE_FILENAME = 'programme-version-import-template.xlsx'
const ERROR_REPORT_PREFIX = 'programme-version-import-error-report'

function buildImportColumns() {
  const columns = [
    { header: 'Programme Name', path: 'programmeInfo.programmeName', required: true, maxLength: 100 },
    { header: 'Programme Name_EN', path: 'programmeInfo.programmeNameEn', required: true, maxLength: 100 },
    { header: 'Programme Name_MAL', path: 'programmeInfo.programmeNameMal', required: true, maxLength: 100 },
    { header: 'Programme Code', path: 'programmeInfo.programmeCode', required: true, maxLength: 20 },
    { header: 'ID Code', path: 'programmeInfo.idCode', required: false, maxLength: 20 },
    { header: 'National Education Code (NEC)', path: 'programmeInfo.nec', required: false, maxLength: 20 },
    { header: 'Study Duration for Chinese Students', path: 'programmeInfo.studyDurationChinese', required: false, numericMaxDigits: 2 },
    { header: 'Years', path: 'programmeInfo.years', required: true, numericMaxDigits: 2 },
    { header: 'Level', path: 'programmeInfo.levelOfStudy', required: true, options: levelOfStudyOptions },
    { header: 'Programme Level', path: 'programmeInfo.level', required: true, options: programmeLevelOptions },
    { header: 'Field of Study', path: 'programmeInfo.fieldOfStudy', required: false, options: fieldOfStudyOptions },
    { header: 'Type of Programme', path: 'programmeInfo.typeOfProgramme', required: true, options: typeOfProgrammeOptions },
    { header: 'Method of Learning and Teaching', path: 'programmeInfo.methodOfLearning', required: true, options: methodOfLearningOptions },
    { header: 'Mode of Study', path: 'programmeInfo.modeOfStudy', required: true, options: modeOfStudyOptions },
    { header: 'Medium of Instruction', path: 'programmeInfo.mediumOfInstruction', required: true, options: mediumOfInstructionOptions },
    { header: 'Method of Delivery', path: 'programmeInfo.methodOfDelivery', required: true, options: methodOfDeliveryOptions },
    { header: 'Mode of Offer', path: 'programmeInfo.modeOfOffer', required: true, options: modeOfOfferOptions },
    { header: 'Awarding body', path: 'programmeInfo.awardingBody', required: false, options: awardingBodyOptions },
    { header: 'Department', path: 'programmeInfo.department', required: false, type: 'department' },
    { header: 'Prog. Commence', path: 'programmeInfo.progCommence', required: false },
    { header: 'Advertisement Code', path: 'programmeInfo.advertisementCode', required: false, options: advertisementCodeOptions },
    { header: 'Acc. Status', path: 'programmeInfo.accStatus', required: true, options: accStatusOptions },
    { header: 'Long Semester Weeks', path: 'programmeInfo.longSemesterWeeks', required: false, numericMaxDigits: 2 },
    { header: 'Long Semester Count', path: 'programmeInfo.longSemesterCount', required: false, numericMaxDigits: 2 },
    { header: 'Short Semester Weeks', path: 'programmeInfo.shortSemesterWeeks', required: false, numericMaxDigits: 2 },
    { header: 'Short Semester Count', path: 'programmeInfo.shortSemesterCount', required: false, numericMaxDigits: 2 },
    { header: 'Industrial Training Weeks', path: 'programmeInfo.industrialTrainingWeeks', required: false, numericMaxDigits: 2 },
    { header: 'Industrial Training Count', path: 'programmeInfo.industrialTrainingCount', required: false, numericMaxDigits: 2 },
    { header: 'MQA Code', path: 'approvalDetails.mqaCode', required: true, maxLength: 50 },
    { header: 'Start Date (MQA)', path: 'approvalDetails.mqaStartDate', required: true },
    { header: 'Expiry Date (MQA)', path: 'approvalDetails.mqaExpiryDate', required: false },
    { header: 'Syor Date(PA)', path: 'approvalDetails.mqaSyorDatePa', required: true },
    { header: 'Syor Reference (PA)', path: 'approvalDetails.mqaSyorReferencePa', required: true, maxLength: 50 },
    { header: 'Syor Date(FA)', path: 'approvalDetails.mqaSyorDateFa', required: true },
    { header: 'Syor Reference (FA)', path: 'approvalDetails.mqaSyorReferenceFa', required: true, maxLength: 50 },
    { header: 'First intake duration as in approval', path: 'approvalDetails.mqaFirstIntakeDuration', required: true, numericMaxDigits: 2 },
    { header: 'MOHE Code', path: 'approvalDetails.moheCode', required: true, maxLength: 50 },
    { header: 'MOHE Approval Reference No.', path: 'approvalDetails.moheApprovalReferenceNo', required: true, maxLength: 50 },
    { header: 'Approval Date (MOHE)', path: 'approvalDetails.moheApprovalDate', required: true },
    { header: 'Start Date (MOHE)', path: 'approvalDetails.moheStartDate', required: true },
    { header: 'Expiry Date (MOHE)', path: 'approvalDetails.moheExpiryDate', required: false },
    { header: 'MUET', path: 'entryRequirements.muet', required: false, numericPattern: /^\d+(\.\d{1,3})?$/, numericMessage: 'must be numeric with at most 3 decimal places' },
    { header: 'IELTS', path: 'entryRequirements.elts', required: false, numericPattern: /^\d+(\.\d{1})?$/, numericMessage: 'must be numeric with at most 1 decimal place' },
    { header: 'TOEFL IBT', path: 'entryRequirements.toeflIbt', required: false, numericPattern: /^\d{1,3}$/, numericMessage: 'must be numeric with at most 3 digits' },
    { header: 'TOEFL Essentials (Online)', path: 'entryRequirements.toeflEssentials', required: false, numericPattern: /^\d{1,3}$/, numericMessage: 'must be numeric with at most 3 digits' },
    { header: 'PEARSON TEST OF ENGLISH', path: 'entryRequirements.pearsonTestOfEnglish', required: false, numericPattern: /^\d+(\.\d{1})?$/, numericMessage: 'must be numeric with at most 1 decimal place' },
    { header: 'CAMBRIDGE ENGLISH(i/ii)', path: 'entryRequirements.cambridgeEnglishIi', required: false, numericPattern: /^\d+(\.\d{1})?$/, numericMessage: 'must be numeric with at most 1 decimal place' },
    { header: 'CAMBRIDGE ENGLISH(iii)', path: 'entryRequirements.cambridgeEnglishIii', required: false, numericPattern: /^\d+(\.\d{1})?$/, numericMessage: 'must be numeric with at most 1 decimal place' },
    { header: 'ELS', path: 'entryRequirements.els', required: false, numericPattern: /^\d{1,3}$/, numericMessage: 'must be numeric with at most 3 digits' },
    { header: 'Total Continuous Assessment', path: 'thresholdMarks.totalContinuousAssessment', required: false, numericPattern: /^\d{1,3}$/, numericMessage: 'must be numeric with at most 3 digits' },
    { header: 'Total Final Assessment', path: 'thresholdMarks.totalFinalAssessment', required: false, numericPattern: /^\d{1,3}$/, numericMessage: 'must be numeric with at most 3 digits' },
    { header: 'Overall Score', path: 'thresholdMarks.overallScore', required: false, numericPattern: /^\d{1,3}$/, numericMessage: 'must be numeric with at most 3 digits' },
    { header: 'Duration (Min. Year)', path: 'feeStructure.durationMinYear', required: true, numericMaxDigits: 2 },
    { header: 'Type of Approval', path: 'feeStructure.typeOfApproval', required: true, options: typeOfApprovalOptions },
  ]

  localFeeColumns.forEach((col) => {
    columns.push({
      header: `Local Student (RM) - ${col.label}`,
      path: `feeStructure.localStudent.${col.key}`,
      required: false,
      numericPattern: FEE_AMOUNT_PATTERN,
      numericMessage: FEE_AMOUNT_VALIDATION_MESSAGE,
    })
  })
  columns.push({
    header: 'Local Student (RM) - Check Total (Local Student)',
    path: 'feeStructure.localStudent.checkTotal',
    required: false,
    type: 'boolean',
  })

  internationalFeeColumns.forEach((col) => {
    columns.push({
      header: `International Student (RM) - ${col.label}`,
      path: `feeStructure.internationalStudent.${col.key}`,
      required: false,
      numericPattern: FEE_AMOUNT_PATTERN,
      numericMessage: FEE_AMOUNT_VALIDATION_MESSAGE,
    })
  })
  columns.push({
    header: 'International Student (RM) - Check Total (International Student)',
    path: 'feeStructure.internationalStudent.checkTotal',
    required: false,
    type: 'boolean',
  })

  return columns
}

export const programmeImportColumns = buildImportColumns()

function setByPath(obj, path, value) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

function parseBoolean(value) {
  const text = String(value ?? '').trim().toUpperCase()
  if (!text) return false
  if (['T', 'TRUE', '1', 'YES', 'Y'].includes(text)) return true
  if (['F', 'FALSE', '0', 'NO', 'N'].includes(text)) return false
  return null
}

function resolveDepartment(value) {
  const text = String(value ?? '').trim()
  if (!text) return null
  const options = getDepartmentOptions()
  const byId = options.find((item) => item.id.toLowerCase() === text.toLowerCase())
  if (byId) return byId.id
  const byLabel = options.find((item) => item.label.toLowerCase() === text.toLowerCase())
  if (byLabel) return byLabel.id
  return null
}

function isEmptyRow(row) {
  return !row.some((cell) => String(cell ?? '').trim())
}

function validateHeaders(headers) {
  const expected = programmeImportColumns.map((col) => col.header)
  if (headers.length !== expected.length) {
    return {
      valid: false,
      message: `Template column count mismatch. Expected ${expected.length} columns, got ${headers.length}. Please download the latest template.`,
    }
  }
  for (let i = 0; i < expected.length; i += 1) {
    if (headers[i] !== expected[i]) {
      return {
        valid: false,
        message: `Column ${i + 1} mismatch. Expected "${expected[i]}", got "${headers[i] || ''}". Please download the latest template.`,
      }
    }
  }
  return { valid: true }
}

function rowToRecord(row) {
  const formData = createEmptyProgrammeForm()
  formData.attachments = createInitialAttachments()

  programmeImportColumns.forEach((col, index) => {
    let value = row[index]
    if (col.type === 'boolean') {
      value = parseBoolean(value)
      setByPath(formData, col.path, value === null ? false : value)
      return
    }
    if (col.type === 'department') {
      setByPath(formData, col.path, String(value ?? '').trim())
      return
    }
    setByPath(formData, col.path, String(value ?? '').trim())
  })

  return formData
}

function validateRecord(formData, rowNumber, existingCodes, fileCodes) {
  const errors = []
  const code = formData.programmeInfo.programmeCode.trim()

  programmeImportColumns.forEach((col) => {
    const raw = col.path.split('.').reduce((acc, key) => acc?.[key], formData)
    const value = col.type === 'boolean' ? raw : String(raw ?? '').trim()

    if (col.required && !value && col.type !== 'boolean') {
      errors.push(`Row ${rowNumber}: ${col.header} is required`)
      return
    }

    if (value && col.maxLength && value.length > col.maxLength) {
      errors.push(`Row ${rowNumber}: ${col.header} must be at most ${col.maxLength} characters`)
    }

    if (value && col.numericMaxDigits && !new RegExp(`^\\d{1,${col.numericMaxDigits}}$`).test(value)) {
      errors.push(`Row ${rowNumber}: ${col.header} must be numeric with at most ${col.numericMaxDigits} digits`)
    }

    if (value && col.numericPattern && !col.numericPattern.test(value)) {
      errors.push(`Row ${rowNumber}: ${col.header} ${col.numericMessage || 'format is invalid'}`)
    }

    if (col.options && value && !col.options.includes(value)) {
      errors.push(`Row ${rowNumber}: ${col.header} must be one of: ${col.options.join(', ')}`)
    }

    if (col.type === 'department' && value) {
      const resolved = resolveDepartment(value)
      if (!resolved) {
        errors.push(`Row ${rowNumber}: Department "${value}" is invalid`)
      } else {
        formData.programmeInfo.department = resolved
      }
    }

    if (col.type === 'boolean' && String(raw ?? '').trim()) {
      const parsed = parseBoolean(raw)
      if (parsed === null) {
        errors.push(`Row ${rowNumber}: ${col.header} must be T or F`)
      }
    }
  })

  if (code) {
    const normalized = code.toLowerCase()
    if (existingCodes.has(normalized)) {
      errors.push(`Row ${rowNumber}: Programme Code "${code}" already exists in the system`)
    }
    if (fileCodes.has(normalized)) {
      errors.push(`Row ${rowNumber}: Programme Code "${code}" is duplicated in the import file`)
    }
  }

  return errors
}

export function downloadProgrammeImportTemplate(filename = TEMPLATE_FILENAME) {
  const headers = programmeImportColumns.map((col) => col.header)
  const sampleRow = programmeImportColumns.map((col) => {
    if (col.type === 'boolean') return 'F'
    if (col.header === 'Department') return 'School of Business'
    if (col.options?.length) return col.options[0]
    return ''
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  worksheet['!cols'] = programmeImportColumns.map((col) => ({
    wch: Math.min(Math.max(col.header.length + 2, 14), 42),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Programme Version')
  XLSX.writeFile(workbook, filename)
}

export function exportProgrammeImportErrorReport(errorRows, filename) {
  if (!errorRows.length) return
  const headers = [...programmeImportColumns.map((col) => col.header), 'Error Message']
  const rows = errorRows.map((item) => [...item.row, item.message])
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.min(Math.max(header.length + 2, 14), 48) }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors')
  XLSX.writeFile(workbook, filename || `${ERROR_REPORT_PREFIX}.xlsx`)
}

export function parseProgrammeImportFile(arrayBuffer, existingProgrammes = []) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { success: false, message: 'The file does not contain any worksheet.' }
  }

  const sheet = workbook.Sheets[sheetName]
  const table = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!table.length) {
    return { success: false, message: 'The import file is empty.' }
  }

  const headers = table[0].map((cell) => String(cell ?? '').trim())
  const headerCheck = validateHeaders(headers)
  if (!headerCheck.valid) {
    return { success: false, message: headerCheck.message }
  }

  const existingCodes = new Set(
    existingProgrammes.map((item) => String(item.code || item.programmeInfo?.programmeCode || '').trim().toLowerCase()).filter(Boolean),
  )

  const importedProgrammes = []
  const errorRows = []
  const fileCodes = new Set()

  table.slice(1).forEach((row, index) => {
    if (isEmptyRow(row)) return
    const rowNumber = index + 2
    const normalizedRow = programmeImportColumns.map((_, colIndex) => row[colIndex] ?? '')
    const formData = rowToRecord(normalizedRow)
    const rowErrors = validateRecord(formData, rowNumber, existingCodes, fileCodes)

    if (rowErrors.length) {
      errorRows.push({
        row: normalizedRow,
        message: rowErrors.join('; '),
      })
      return
    }

    const info = formData.programmeInfo
    fileCodes.add(info.programmeCode.trim().toLowerCase())
    importedProgrammes.push({
      schoolId: info.department,
      code: info.programmeCode.trim(),
      name: info.programmeName.trim(),
      level: info.level,
      years: Number(info.years) || info.years,
      formData,
      version: buildVersionFromSave(formData),
    })
    existingCodes.add(info.programmeCode.trim().toLowerCase())
  })

  if (!importedProgrammes.length && !errorRows.length) {
    return { success: false, message: 'No data rows found in the import file.' }
  }

  return {
    success: errorRows.length === 0,
    importedProgrammes,
    errorRows,
    successCount: importedProgrammes.length,
    errorCount: errorRows.length,
  }
}

export function buildImportErrorReportFilename() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${ERROR_REPORT_PREFIX}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.xlsx`
}
