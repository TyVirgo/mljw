/** 学生基本信息：表头 / 搜索 / 详情共用字段 label 与 hint（英文 key，经 tr 翻译） */
export const studentProfileFieldDefs = {
  studentId: { label: 'Student ID' },
  studentName: { label: 'Student Name' },
  chineseName: { label: 'Chinese Name' },
  icNo: { label: 'IC No. (No dash)' },
  mobilePhone: { label: 'Mobile Phone' },
  status: { label: 'Status' },
  trackCategory: { label: 'Track Category' },
  intake: {
    label: 'Intake',
    hint: 'Enrollment Intake Hint',
  },
  programmeCode: { label: 'Programme Code' },
  nationality: { label: 'Nationality' },
  studentType: { label: 'Student Type' },
  programme: { label: 'Programme' },
  programmeLevel: { label: 'Programme Level' },
  programmeStructure: {
    label: 'Programme Structure',
    hint: 'Programme Version Name',
  },
  registrationTime: {
    label: 'Registration Time',
    hint: 'Enrollment Registration Time Hint',
  },
  expectedCompletionBatch: {
    label: 'Expected Completion Batch',
    hint: 'Expected Completion Batch Hint',
  },
  expectedGraduationBatch: { label: 'Expected Graduation Batch' },
  semester: {
    label: 'Semester',
    hint: 'Enrollment Semester Hint',
  },
  outstandingFee: {
    label: 'Outstanding Fee',
    hint: 'Maintained by Finance and read-only here. Not editable in student records.',
  },
  studentPassExpiryDate: {
    label: 'Student Pass Expiry Date',
    hint:
      'Maintained by IO (International Office) and read-only here. Applicable to China and International students only; not used for Local students.',
  },
  gender: { label: 'Gender' },
}

export function getStudentProfileFieldLabelKey(fieldId) {
  return studentProfileFieldDefs[fieldId]?.label ?? fieldId
}

export function getStudentProfileFieldHintKey(fieldId) {
  return studentProfileFieldDefs[fieldId]?.hint ?? ''
}
