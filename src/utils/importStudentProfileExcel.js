import * as XLSX from 'xlsx'
import {
  createEmptyStudent,
  normalizeStudent,
  studentCategoryOptions,
  genderOptions,
  studentStatusOptions,
  validateStudentForm,
} from '../data/students.js'

const TEMPLATE_FILENAME = 'student-profile-import-template.xlsx'

export const studentImportColumns = [
  { header: 'Student ID', key: 'studentId', required: true },
  { header: 'Full Name (English)', key: 'fullName', required: true },
  { header: 'Chinese Name', key: 'chineseName', required: false },
  { header: 'Student Category', key: 'studentCategory', required: false },
  { header: 'Gender', key: 'gender', required: false },
  { header: 'IC No. (No dash)', key: 'icNo', required: false },
  { header: 'Passport No.', key: 'passportNo', required: false },
  { header: 'Passport Expiry', key: 'passportExpiry', required: false },
  { header: 'Place of Birth', key: 'placeOfBirth', required: false },
  { header: 'Candidate No.', key: 'candidateNo', required: false },
  { header: 'Political Outlook', key: 'politicalOutlook', required: false },
  { header: 'Identity No. (China ID)', key: 'identityNoChina', required: false },
  { header: 'Application No', key: 'applicationNo', required: false },
  { header: 'Nationality', key: 'nationality', required: false },
  { header: 'Race', key: 'race', required: false },
  { header: 'Programme Code', key: 'programmeCode', required: true },
  { header: 'Programme', key: 'programme', required: true },
  { header: 'Faculty', key: 'faculty', required: false },
  { header: 'Status', key: 'status', required: false },
  { header: 'Intake (YYYY/MM)', key: 'intake', required: false },
  { header: 'Study Mode', key: 'studyMode', required: false },
  { header: 'Mobile Phone', key: 'mobilePhone', required: true },
  { header: 'Email', key: 'email', required: true },
  { header: 'House Phone', key: 'housePhone', required: false },
  { header: 'Permanent Address', key: 'permanentAddress', required: false },
  { header: 'Programme Level', key: 'programmeLevel', required: false },
  { header: 'Duration', key: 'duration', required: false },
  { header: 'Semester', key: 'semester', required: false },
  { header: 'Academic Session', key: 'academicSession', required: false },
  { header: 'Recruited By', key: 'recruitedBy', required: false },
  { header: 'Source of Recruit', key: 'sourceOfRecruit', required: false },
]

const HEADER_ALIASES = {
  'student id': 'studentId',
  'full name (english)': 'fullName',
  'full name': 'fullName',
  'chinese name': 'chineseName',
  'student category': 'studentCategory',
  'student type': 'studentCategory',
  gender: 'gender',
  'ic no. (no dash)': 'icNo',
  'ic no': 'icNo',
  'passport no.': 'passportNo',
  'passport no': 'passportNo',
  'passport expiry': 'passportExpiry',
  'place of birth': 'placeOfBirth',
  'candidate no.': 'candidateNo',
  'candidate no': 'candidateNo',
  'political outlook': 'politicalOutlook',
  'identity no. (china id)': 'identityNoChina',
  'identity no (china id)': 'identityNoChina',
  'application no': 'applicationNo',
  nationality: 'nationality',
  race: 'race',
  'programme code': 'programmeCode',
  programme: 'programme',
  faculty: 'faculty',
  status: 'status',
  'intake (yyyy/mm)': 'intake',
  intake: 'intake',
  'study mode': 'studyMode',
  'mobile phone': 'mobilePhone',
  email: 'email',
  'house phone': 'housePhone',
  'permanent address': 'permanentAddress',
  'programme level': 'programmeLevel',
  duration: 'duration',
  semester: 'semester',
  'academic session': 'academicSession',
  'recruited by': 'recruitedBy',
  'source of recruit': 'sourceOfRecruit',
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
  const column = studentImportColumns.find((item) => normalizeHeader(item.header) === normalized)
  return column?.key || null
}

function buildReferenceRows() {
  return [
    ['Field', 'Required', 'Format / Valid Values'],
    ['Student ID', 'Yes', 'Must be unique'],
    ['Full Name (English)', 'Yes', 'Max 200 characters'],
    ['Student Category', 'No', studentCategoryOptions.join(', ')],
    ['Gender', 'No', genderOptions.join(', ')],
    ['IC No. (No dash)', 'Local only', 'Required when Student Category is Local'],
    ['Passport No.', 'China/International', 'Optional'],
    ['Identity No. (China ID)', 'China only', 'Optional'],
    ['Programme Code', 'Yes', ''],
    ['Programme', 'Yes', ''],
    ['Status', 'No', studentStatusOptions.join(', ')],
    ['Intake (YYYY/MM)', 'No', 'Example: 2023/09'],
    ['Mobile Phone', 'Yes', ''],
    ['Email', 'Yes', 'Valid email format recommended'],
  ]
}

export function downloadStudentProfileImportTemplate() {
  const headers = studentImportColumns.map((col) => col.header)
  const sampleRow = [
    'XMUM2401001',
    'Sample Student',
    '示例学生',
    'Local',
    'Male',
    '010101010101',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Malaysia',
    'Chinese',
    'SWE',
    'Bachelor of Software Engineering',
    'School of Computing',
    'Active',
    '2024/09',
    'Full Time',
    '0123456789',
    'sample@student.xmum.edu.my',
    '',
    '123 Jalan University',
    'Undergraduate',
    '4 years',
    '1',
    '2024/2025',
    '',
    '',
  ]

  const dataSheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  dataSheet['!cols'] = headers.map(() => ({ wch: 22 }))

  const refSheet = XLSX.utils.aoa_to_sheet(buildReferenceRows())
  refSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 50 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Student Import')
  XLSX.utils.book_append_sheet(workbook, refSheet, 'Field Reference')
  XLSX.writeFile(workbook, TEMPLATE_FILENAME)
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
  const getCell = (key) => (indexMap[key] != null ? String(row[indexMap[key]] ?? '').trim() : '')
  return {
    studentId: getCell('studentId'),
    fullName: getCell('fullName'),
    chineseName: getCell('chineseName'),
    studentCategory: getCell('studentCategory') || 'Local',
    gender: getCell('gender') || 'Male',
    icNo: getCell('icNo'),
    passportNo: getCell('passportNo'),
    passportExpiry: getCell('passportExpiry'),
    placeOfBirth: getCell('placeOfBirth'),
    candidateNo: getCell('candidateNo'),
    politicalOutlook: getCell('politicalOutlook'),
    identityNoChina: getCell('identityNoChina'),
    applicationNo: getCell('applicationNo'),
    nationality: getCell('nationality'),
    race: getCell('race'),
    programmeCode: getCell('programmeCode'),
    programme: getCell('programme'),
    faculty: getCell('faculty'),
    status: getCell('status') || 'Active',
    intake: getCell('intake'),
    studyMode: getCell('studyMode') || 'Full Time',
    mobilePhone: getCell('mobilePhone'),
    email: getCell('email'),
    housePhone: getCell('housePhone'),
    permanentAddress: getCell('permanentAddress'),
    programmeLevel: getCell('programmeLevel'),
    duration: getCell('duration'),
    semester: getCell('semester'),
    academicSession: getCell('academicSession'),
    recruitedBy: getCell('recruitedBy'),
    sourceOfRecruit: getCell('sourceOfRecruit'),
  }
}

function isEmptyRow(row) {
  return !row || row.every((cell) => String(cell ?? '').trim() === '')
}

function buildStudentFromImportRow(rowForm) {
  const empty = createEmptyStudent()
  return normalizeStudent({
    studentCategory: rowForm.studentCategory,
    basicInfo: {
      ...empty.basicInfo,
      studentId: rowForm.studentId,
      fullName: rowForm.fullName,
      chineseName: rowForm.chineseName,
      gender: rowForm.gender,
      icNo: rowForm.icNo,
      passportNo: rowForm.passportNo,
      passportExpiry: rowForm.passportExpiry,
      placeOfBirth: rowForm.placeOfBirth,
      candidateNo: rowForm.candidateNo,
      politicalOutlook: rowForm.politicalOutlook,
      identityNoChina: rowForm.identityNoChina,
      applicationNo: rowForm.applicationNo,
      nationality: rowForm.nationality,
      race: rowForm.race,
    },
    enrollment: {
      ...empty.enrollment,
      programmeCode: rowForm.programmeCode,
      programme: rowForm.programme,
      faculty: rowForm.faculty,
      status: rowForm.status,
      intake: rowForm.intake,
      studyMode: rowForm.studyMode,
      programmeLevel: rowForm.programmeLevel,
      duration: rowForm.duration,
      semester: rowForm.semester,
      academicSession: rowForm.academicSession,
      recruitedBy: rowForm.recruitedBy,
      sourceOfRecruit: rowForm.sourceOfRecruit,
    },
    contact: {
      ...empty.contact,
      mobilePhone: rowForm.mobilePhone,
      email: rowForm.email,
      housePhone: rowForm.housePhone,
      permanentAddress: rowForm.permanentAddress,
    },
  })
}

export async function parseStudentProfileImportFile(file, existingStudents = []) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName =
    workbook.SheetNames.find((name) => normalizeHeader(name).includes('student import')) ||
    workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (!rows.length) {
    return { successRows: [], errorRows: [], successCount: 0, errorCount: 0 }
  }

  const headerRow = rows[0]
  const indexMap = buildColumnIndexMap(headerRow)
  const requiredKeys = studentImportColumns
    .filter((col) => col.required)
    .map((col) => col.key)
  const missingRequired = requiredKeys.filter((key) => indexMap[key] == null)

  if (missingRequired.length) {
    return {
      successRows: [],
      errorRows: [{ row: 1, reason: `Missing required columns: ${missingRequired.join(', ')}` }],
      successCount: 0,
      errorCount: 1,
    }
  }

  const successRows = []
  const errorRows = []
  const seenIds = new Set(
    existingStudents.map((item) =>
      String(item.basicInfo?.studentId || item.studentId || '')
        .trim()
        .toLowerCase(),
    ),
  )

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (isEmptyRow(row)) continue

    const rowNumber = i + 1
    const rowForm = readRowForm(row, indexMap)
    const studentIdKey = rowForm.studentId.toLowerCase()

    if (seenIds.has(studentIdKey)) {
      errorRows.push({ row: rowNumber, reason: 'Duplicate Student ID' })
      continue
    }

    const candidate = buildStudentFromImportRow(rowForm)
    const validation = validateStudentForm(candidate, [...existingStudents, ...successRows])

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] || 'Validation failed'
      errorRows.push({ row: rowNumber, reason: firstError })
      continue
    }

    seenIds.add(studentIdKey)
    successRows.push(candidate)
  }

  return {
    successRows,
    errorRows,
    successCount: successRows.length,
    errorCount: errorRows.length,
  }
}

export function exportStudentImportErrorReport(errorRows, filename = 'student-import-error-report.xlsx') {
  const rows = [['Row', 'Reason'], ...errorRows.map((item) => [item.row, item.reason])]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [{ wch: 8 }, { wch: 48 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors')
  XLSX.writeFile(workbook, filename)
}

export function buildStudentImportErrorReportFilename() {
  const timestamp = new Date().toISOString().slice(0, 10)
  return `student-import-error-report-${timestamp}.xlsx`
}
