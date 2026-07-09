import * as XLSX from 'xlsx'
import { formatFamilyContactNames, formatStudentPassExpiryEndDate, getLatestStudentStatus } from '../data/students.js'
import { getNormalizedProgrammeLevel } from './formatProgrammeLevel.js'

export const studentProfileListExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'studentId', header: 'Student ID', width: 16 },
  { key: 'name', header: 'Student Name', width: 24 },
  { key: 'nameCn', header: 'Chinese Name', width: 16 },
  { key: 'icNo', header: 'IC No.', width: 16 },
  { key: 'mobilePhone', header: 'Mobile Phone', width: 16 },
  { key: 'studentStatus', header: 'Status', width: 16 },
  { key: 'trackCategory', header: 'Track Category', width: 20 },
  { key: 'intake', header: 'Intake', width: 10 },
  { key: 'programmeCode', header: 'Programme Code', width: 16 },
  { key: 'nationality', header: 'Nationality', width: 14 },
  { key: 'studentType', header: 'Student Type', width: 18 },
  { key: 'programme', header: 'Programme', width: 32 },
  { key: 'programmeLevel', header: 'Programme Level', width: 16 },
  { key: 'programmeStructure', header: 'Programme Structure', width: 20 },
  { key: 'registrationTime', header: 'Registration Time', width: 18 },
  { key: 'expectedCompletionBatch', header: 'Expected Completion Batch', width: 22 },
  { key: 'expectedGraduationBatch', header: 'Expected Graduation Batch', width: 22 },
  { key: 'outstandingFee', header: 'Outstanding Fee', width: 16 },
  { key: 'studentPassExpiryDate', header: 'Student Pass Expiry Date', width: 22 },
  { key: 'gender', header: 'Gender', width: 10 },
]

export const studentProfileFullExportColumns = [
  { key: 'applicationNo', header: 'Application No', width: 16 },
  { key: 'passportNo', header: 'Passport No.', width: 16 },
  { key: 'passportExpiry', header: 'Passport Expiry', width: 14 },
  { key: 'placeOfBirth', header: 'Place of Birth', width: 16 },
  { key: 'identityNoChina', header: 'Identity No. (China ID)', width: 20 },
  { key: 'candidateNo', header: 'Candidate No.', width: 14 },
  { key: 'race', header: 'Race', width: 12 },
  { key: 'email', header: 'Email', width: 28 },
  { key: 'faculty', header: 'Faculty', width: 24 },
  { key: 'studyMode', header: 'Study Mode', width: 14 },
  { key: 'qualification', header: 'Qualification', width: 18 },
  { key: 'institutionName', header: 'Institution Name', width: 24 },
  { key: 'familyName', header: 'Family Contact Name', width: 20 },
  { key: 'hostelStatus', header: 'Hostel Status', width: 16 },
  { key: 'sponsor', header: 'Sponsor', width: 18 },
]

export const studentProfileExportColumns = [
  ...studentProfileListExportColumns,
  ...studentProfileFullExportColumns,
]

function formatListIcNo(item, basic) {
  const category = item.studentType ?? item.studentCategory
  if (category !== 'Local') return ''
  return basic.icNo || item.icNo || ''
}

function formatStudentRow(item, index) {
  const basic = item.basicInfo || {}
  const enrollment = item.enrollment || {}
  const contact = item.contact || {}
  const education = item.education || {}
  const accommodation = item.accommodation || {}
  const others = item.others || {}

  return {
    no: index + 1,
    studentId: item.studentId ?? basic.studentId,
    name: item.name ?? basic.fullName,
    nameCn: item.nameCn ?? basic.chineseName,
    icNo: formatListIcNo(item, basic),
    mobilePhone: item.mobilePhone ?? contact.mobilePhone,
    studentType: item.studentType ?? item.studentCategory,
    studentPassExpiryDate: formatStudentPassExpiryEndDate(basic) || '',
    gender: item.gender ?? basic.gender,
    programmeCode: item.programmeCode ?? enrollment.programmeCode,
    programme: item.programme ?? enrollment.programme,
    intake: item.intake ?? enrollment.intake,
    studentStatus: getLatestStudentStatus(item),
    trackCategory: enrollment.trackCategory || 'Normal',
    outstandingFee: item.outstandingFee ?? basic.outstandingFee,
    programmeLevel: getNormalizedProgrammeLevel(item.programmeLevel ?? enrollment.programmeLevel),
    programmeStructure: item.programmeStructure ?? enrollment.programmeStructure,
    registrationTime: item.registrationTime ?? enrollment.registrationTime,
    expectedCompletionBatch: item.expectedCompletionBatch ?? enrollment.expectedCompletionBatch,
    expectedGraduationBatch: item.expectedGraduationBatch ?? enrollment.expectedGraduationBatch,
    applicationNo: basic.applicationNo,
    passportNo: basic.passportNo,
    passportExpiry: basic.passportExpiry,
    placeOfBirth: basic.placeOfBirth,
    identityNoChina: basic.identityNoChina,
    candidateNo: basic.candidateNo,
    nationality: item.nationality ?? basic.nationality,
    race: basic.race,
    email: contact.email,
    faculty: enrollment.faculty,
    studyMode: enrollment.studyMode,
    qualification: education.qualification,
    institutionName: education.institutionName,
    familyName: formatFamilyContactNames(item.family),
    hostelStatus: accommodation.hostelStatus,
    sponsor: others.sponsor,
  }
}

export function exportStudentProfilesToExcel(
  students,
  filename = 'student-profile.xlsx',
  selectedFieldKeys = studentProfileListExportColumns.map((col) => col.key),
) {
  const columns = studentProfileExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const rows = students.map((item, index) => {
    const formatted = formatStudentRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key] ?? ''
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Profile')
  XLSX.writeFile(workbook, filename)
}

export const studentProfileListExportFields = studentProfileListExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
  selectedByDefault: true,
}))

export const studentProfileFullExportFields = studentProfileFullExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
  selectedByDefault: false,
}))

export const studentProfileExportFields = [
  ...studentProfileListExportFields,
  ...studentProfileFullExportFields,
]
