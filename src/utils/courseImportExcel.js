import * as XLSX from 'xlsx'
import {
  courseClassificationOptions,
  mediumOfInstructionOptions,
  getOfferingOptions,
  courseOwnerOptions,
  validateCourseForm,
  buildCoursePayload,
  createCourseId,
} from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'
import { semesterTypeOptions } from '../data/semesterInfo.js'

const TEMPLATE_HEADERS = [
  'Course Code',
  'Course Name',
  'Offering Code',
  'Course Owner ID',
  'Course Classification',
  'Credit',
  'Medium of Instruction',
  'Semester Type',
]

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
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

export function downloadCourseImportTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    [
      'PHY101',
      'ASEAN Business Essentials',
      'SOF',
      'TML001',
      'Compulsory',
      4,
      'English',
      'Long',
    ],
  ])
  worksheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Course Import')
  XLSX.writeFile(workbook, 'course-import-template.xlsx')
}

export async function parseCourseImportFile(file, existingCourses = []) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (!rows.length) {
    return { successRows: [], errorRows: [{ row: 0, message: 'Import file is empty' }] }
  }

  const headerRow = rows[0].map(normalizeHeader)
  const indexMap = {
    courseCode: headerRow.findIndex((h) => h === 'course code'),
    courseName: headerRow.findIndex((h) => h === 'course name'),
    offering: headerRow.findIndex((h) => h.includes('offering')),
    courseOwner: headerRow.findIndex((h) => h.includes('course owner')),
    courseClassification: headerRow.findIndex((h) => h === 'course classification'),
    credit: headerRow.findIndex((h) => h === 'credit'),
    mediumOfInstruction: headerRow.findIndex((h) => h === 'medium of instruction'),
    semesterType: headerRow.findIndex((h) => h === 'semester type'),
  }

  if (indexMap.courseCode === -1 || indexMap.courseName === -1) {
    return {
      successRows: [],
      errorRows: [{ row: 1, message: 'Missing required columns: Course Code, Course Name' }],
    }
  }

  const successRows = []
  const errorRows = []
  const workingCourses = [...existingCourses]

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) continue

    const form = {
      courseCode: String(row[indexMap.courseCode] ?? '').trim(),
      courseName: String(row[indexMap.courseName] ?? '').trim(),
      offering: findOfferingCode(row[indexMap.offering]),
      courseOwner: findCourseOwnerId(row[indexMap.courseOwner]),
      courseClassification: String(row[indexMap.courseClassification] ?? '').trim(),
      credit: String(row[indexMap.credit] ?? '').trim(),
      mediumOfInstruction: String(row[indexMap.mediumOfInstruction] ?? '').trim(),
      semesterType: String(row[indexMap.semesterType] ?? '').trim(),
    }

    const errors = validateCourseForm(form, workingCourses)
    if (Object.keys(errors).length) {
      errorRows.push({
        row: i + 1,
        message: Object.values(errors).join('; '),
      })
      continue
    }

    const payload = {
      id: createCourseId(),
      ...buildCoursePayload(form),
    }
    successRows.push(payload)
    workingCourses.push(payload)
  }

  return { successRows, errorRows }
}

export function exportCourseImportErrorReport(errorRows, filename = 'course-import-errors.xlsx') {
  const rows = errorRows.map((item) => ({
    Row: item.row,
    Message: item.message,
  }))
  const worksheet = XLSX.utils.json_to_sheet(rows)
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
