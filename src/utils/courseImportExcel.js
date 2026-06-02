import * as XLSX from 'xlsx'
import {
  courseClassificationOptions,
  mediumOfInstructionOptions,
  getOfferingOptions,
  courseOwnerOptions,
  validateCourseForm,
  buildCoursePayload,
  createEmptySLTData,
} from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'
import { semesterTypeOptions } from '../data/semesterInfo.js'

const TEMPLATE_FILENAME = 'course-import-template.xlsx'
const ERROR_REPORT_PREFIX = 'course-import-error-report'

export const courseImportColumns = [
  { header: 'Course Code', key: 'courseCode', required: true },
  { header: 'Course Name', key: 'courseName', required: true },
  { header: 'Offering Code', key: 'offering', required: true },
  { header: 'Course Owner ID', key: 'courseOwner', required: true },
  { header: 'Course Classification', key: 'courseClassification', required: true },
  { header: 'Credit', key: 'credit', required: true },
  { header: 'Medium of Instruction', key: 'mediumOfInstruction', required: true },
  { header: 'Semester Type', key: 'semesterType', required: true },
  { header: 'Pre-requisite / co-requisite', key: 'prerequisite', required: false },
  { header: 'Synopsis', key: 'synopsis', required: false },
  { header: 'References', key: 'references', required: false },
]

const HEADER_ALIASES = {
  'course code': 'courseCode',
  'course name': 'courseName',
  'offering code': 'offering',
  offering: 'offering',
  'course owner id': 'courseOwner',
  'course owner': 'courseOwner',
  'course classification': 'courseClassification',
  credit: 'credit',
  'medium of instruction': 'mediumOfInstruction',
  'semester type': 'semesterType',
  'pre-requisite / co-requisite': 'prerequisite',
  prerequisite: 'prerequisite',
  synopsis: 'synopsis',
  references: 'references',
  课程编号: 'courseCode',
  课程名字: 'courseName',
  课程名称: 'courseName',
  开课单位编号: 'offering',
  开课单位: 'offering',
  课程负责人编号: 'courseOwner',
  课程负责人: 'courseOwner',
  课程分类: 'courseClassification',
  学分: 'credit',
  授课语种: 'mediumOfInstruction',
  学期类型: 'semesterType',
  先修条件: 'prerequisite',
  简介: 'synopsis',
  参考文献: 'references',
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function resolveHeaderKey(header) {
  const normalized = normalizeHeader(header)
  if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized]
  const column = courseImportColumns.find((item) => normalizeHeader(item.header) === normalized)
  return column?.key || null
}

function findOfferingCode(labelOrCode) {
  const text = String(labelOrCode || '').trim()
  if (!text) return ''
  const options = getOfferingOptions(initialDepartments)
  const byCode = options.find((item) => item.code.toLowerCase() === text.toLowerCase())
  if (byCode) return byCode.code
  const byName = options.find((item) => item.nameEn.toLowerCase() === text.toLowerCase())
  return byName?.code || ''
}

function findCourseOwnerId(labelOrId) {
  const text = String(labelOrId || '').trim()
  if (!text) return ''
  const byId = courseOwnerOptions.find((item) => item.id.toLowerCase() === text.toLowerCase())
  if (byId) return byId.id
  const byName = courseOwnerOptions.find((item) => item.name.toLowerCase() === text.toLowerCase())
  return byName?.id || ''
}

function buildReferenceRows() {
  const offeringCodes = getOfferingOptions(initialDepartments)
    .map((item) => item.code)
    .join(', ')
  const ownerIds = courseOwnerOptions.map((item) => `${item.id} (${item.name})`).join('; ')
  return [
    ['Field', 'Required', 'Format / Valid Values'],
    ['Course Code', 'Yes', 'Letters and numbers only, max 20 characters, must be unique'],
    ['Course Name', 'Yes', 'Max 200 characters'],
    ['Offering Code', 'Yes', offeringCodes],
    ['Course Owner ID', 'Yes', ownerIds],
    ['Course Classification', 'Yes', courseClassificationOptions.join(', ')],
    ['Credit', 'Yes', 'Positive integer'],
    ['Medium of Instruction', 'Yes', mediumOfInstructionOptions.join(', ')],
    ['Semester Type', 'Yes', semesterTypeOptions.join(', ')],
    ['Pre-requisite / co-requisite', 'No', 'Course codes separated by comma'],
    ['Synopsis', 'No', 'Max 500 characters'],
    ['References', 'No', 'Max 500 characters'],
    ['', '', 'Note: Import creates basic information only. CLO and SLT must be entered separately.'],
  ]
}

export function downloadCourseImportTemplate() {
  const headers = courseImportColumns.map((col) => col.header)
  const sampleRow = [
    'PHY101',
    'ASEAN Business Essentials',
    'SOF',
    'TML001',
    'Compulsory',
    4,
    'English',
    'Long',
    '',
    'This course teaches the fundamentals of mechanics.',
    'University Physics with Modern Physics, Pearson (2021)',
  ]

  const dataSheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  dataSheet['!cols'] = headers.map(() => ({ wch: 24 }))

  const refSheet = XLSX.utils.aoa_to_sheet(buildReferenceRows())
  refSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 60 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Course Import')
  XLSX.utils.book_append_sheet(workbook, refSheet, 'Field Reference')
  XLSX.writeFile(workbook, TEMPLATE_FILENAME)
}

export function buildCourseImportRecord(form) {
  return {
    ...buildCoursePayload(form),
    clos: [],
    slt: createEmptySLTData(),
    changeRecords: [],
  }
}

function buildColumnIndexMap(headerRow) {
  const indexMap = {}
  headerRow.forEach((header, index) => {
    const key = resolveHeaderKey(header)
    if (key && indexMap[key] == null) indexMap[key] = index
  })
  return indexMap
}

function readRowForm(row, indexMap) {
  const getCell = (key) => String(row[indexMap[key]] ?? '').trim()
  return {
    courseCode: getCell('courseCode'),
    courseName: getCell('courseName'),
    offering: findOfferingCode(row[indexMap.offering]),
    courseOwner: findCourseOwnerId(row[indexMap.courseOwner]),
    courseClassification: getCell('courseClassification'),
    credit: getCell('credit'),
    mediumOfInstruction: getCell('mediumOfInstruction'),
    semesterType: getCell('semesterType'),
    prerequisite: indexMap.prerequisite != null ? getCell('prerequisite') : '',
    synopsis: indexMap.synopsis != null ? getCell('synopsis') : '',
    references: indexMap.references != null ? getCell('references') : '',
  }
}

function isEmptyRow(row) {
  return !row || row.every((cell) => String(cell ?? '').trim() === '')
}

export async function parseCourseImportFile(file, existingCourses = []) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName =
    workbook.SheetNames.find((name) => normalizeHeader(name).includes('course import')) ||
    workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (!rows.length) {
    return {
      successRows: [],
      errorRows: [{ row: 0, courseCode: '', message: 'Import file is empty' }],
      successCount: 0,
      errorCount: 1,
    }
  }

  const indexMap = buildColumnIndexMap(rows[0])
  if (indexMap.courseCode == null || indexMap.courseName == null) {
    return {
      successRows: [],
      errorRows: [{ row: 1, courseCode: '', message: 'Missing required columns: Course Code, Course Name' }],
      successCount: 0,
      errorCount: 1,
    }
  }

  const successRows = []
  const errorRows = []
  const workingCourses = [...existingCourses]
  const seenCodes = new Set()

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (isEmptyRow(row)) continue

    const form = readRowForm(row, indexMap)
    const rowNumber = i + 1

    if (form.courseCode && seenCodes.has(form.courseCode.toLowerCase())) {
      errorRows.push({
        row: rowNumber,
        courseCode: form.courseCode,
        message: 'Duplicate Course Code in import file',
      })
      continue
    }

    const errors = validateCourseForm(form, workingCourses)
    if (Object.keys(errors).length) {
      errorRows.push({
        row: rowNumber,
        courseCode: form.courseCode || '',
        message: Object.values(errors).join('; '),
      })
      continue
    }

    if (form.courseCode) seenCodes.add(form.courseCode.toLowerCase())

    const payload = buildCourseImportRecord(form)
    successRows.push(payload)
    workingCourses.push({ ...payload, id: `import-${rowNumber}` })
  }

  if (!successRows.length && !errorRows.length) {
    errorRows.push({ row: 0, courseCode: '', message: 'Import file is empty' })
  }

  return {
    successRows,
    errorRows,
    successCount: successRows.length,
    errorCount: errorRows.length,
  }
}

export function buildCourseImportErrorReportFilename() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `${ERROR_REPORT_PREFIX}-${timestamp}.xlsx`
}

export function exportCourseImportErrorReport(errorRows, filename = buildCourseImportErrorReportFilename()) {
  const rows = errorRows.map((item) => ({
    Row: item.row,
    'Course Code': item.courseCode || '',
    Message: item.message,
  }))
  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 60 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors')
  XLSX.writeFile(workbook, filename)
}

export const courseImportFieldHints = {
  courseClassificationOptions,
  mediumOfInstructionOptions,
  semesterTypeOptions,
  offeringOptions: getOfferingOptions(initialDepartments),
  courseOwnerOptions,
}
