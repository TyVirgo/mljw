import { ref } from 'vue'

export const studentCategoryOptions = ['Local', 'China', 'International']
/** @deprecated use studentCategoryOptions */
export const studentTypeOptions = studentCategoryOptions

export const genderOptions = ['Male', 'Female']
export const studentStatusOptions = ['Active', 'Inactive', 'Deferred', 'Withdrawn']
export const studyModeOptions = ['Full Time', 'Part Time']
export const financialAidOptions = ['None', 'Scholarship', 'Loan', 'Grant']
export const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed']
export const hostelStatusOptions = ['Not Applicable', 'Checked In', 'Checked Out', 'Reserved']
export const disabilityOptions = ['Yes', 'No']
export const qualificationOptions = ['SPM', 'STPM', 'A-Level', 'Foundation', 'Diploma', 'Bachelor', 'Master', 'Other']
export const recruitedByOptions = ['Agent A', 'Agent B', 'Direct Application', 'University Partner', 'Other']

export function isLocalCategory(category) {
  return (category || 'Local') === 'Local'
}

export function isChinaCategory(category) {
  return category === 'China'
}

export function isChinaOrInternationalCategory(category) {
  return category === 'China' || category === 'International'
}

export function showsChineseLanguageTests(category) {
  return isLocalCategory(category) || category === 'International'
}

export function showsTaxRegistration(category) {
  return isLocalCategory(category)
}

export function showsFujianScholarship(category) {
  return isLocalCategory(category)
}

export function usesRecruitedByDropdown() {
  return true
}

export function usesQualificationDropdown() {
  return true
}

export function usesDisabilityDropdown(category) {
  return isChinaOrInternationalCategory(category)
}

export const studentFormTabs = [
  { id: 'basic', labelKey: 'studentProfile.tabs.basicInfo' },
  { id: 'enrollment', labelKey: 'studentProfile.tabs.enrollment' },
  { id: 'contact', labelKey: 'studentProfile.tabs.contact' },
  { id: 'education', labelKey: 'studentProfile.tabs.education' },
  { id: 'family', labelKey: 'studentProfile.tabs.family' },
  { id: 'accommodation', labelKey: 'studentProfile.tabs.accommodation' },
  { id: 'others', labelKey: 'studentProfile.tabs.others' },
]

let nextId = 4

export function createStudentRecordId() {
  return nextId++
}

export function createEmptyBasicInfo() {
  return {
    fullName: '',
    chineseName: '',
    gender: 'Male',
    studentId: '',
    applicationNo: '',
    icNo: '',
    stateOfBirth: '',
    passportNo: '',
    passportExpiry: '',
    placeOfBirth: '',
    candidateNo: '',
    politicalOutlook: '',
    identityNoChina: '',
    dateOfBirth: '',
    age: '',
    nationality: '',
    race: '',
    religion: '',
    maritalStatus: 'Single',
    disability: 'No',
  }
}

export function createEmptyEnrollment() {
  return {
    programmeCode: '',
    programme: '',
    faculty: '',
    status: 'Active',
    programmeLevel: '',
    duration: '',
    semester: '',
    intake: '',
    academicSession: '',
    studyMode: 'Full Time',
    recruitedBy: '',
    sourceOfRecruit: '',
    typeOfFinancialAid: 'None',
    financialAidAmount: '',
    scholarshipOfferNo: '',
    tuitionFeeAnnual: '',
    fujianScholarshipAmt: '',
  }
}

export function createEmptyContact() {
  return {
    mobilePhone: '',
    housePhone: '',
    email: '',
    permanentAddress: '',
    mailingAddress: '',
  }
}

export function createEmptyEducation() {
  return {
    qualification: '',
    institutionName: '',
    institutionLocation: '',
    institutionType: '',
    yearGraduated: '',
    gradeResult: '',
    subject: '',
    englishTestType: '',
    englishResult: '',
    englishDate: '',
    englishExpiry: '',
    chineseTestResult: '',
    chineseTestDate: '',
    chineseTestExpiry: '',
    creditTransfer: '',
    remarks: '',
  }
}

export function createEmptyFamily() {
  return {
    name: '',
    icPassport: '',
    relationship: '',
    occupation: '',
    race: '',
    mobilePhone: '',
    officePhone: '',
    fax: '',
    email: '',
    income: '',
    totalLiabilities: '',
    mailingAddress: '',
  }
}

export function createEmptyAccommodation() {
  return {
    hostelStatus: '',
    roomType: '',
    campus: '',
    blockNo: '',
    floorNo: '',
    unitNo: '',
    roomNo: '',
    bedNo: '',
    checkInDate: '',
    expectedCheckOut: '',
    amountReceivable: '',
    moneyReceived: '',
    outstandingAmount: '',
  }
}

export function createEmptyOthers() {
  return {
    registrationDate: '',
    taxRegistrationNo: '',
    sponsor: '',
    remarks: '',
    statusChangeLog: '',
  }
}

export function createEmptyStudent() {
  return {
    id: null,
    studentCategory: 'Local',
    basicInfo: createEmptyBasicInfo(),
    photo: null,
    enrollment: createEmptyEnrollment(),
    contact: createEmptyContact(),
    education: createEmptyEducation(),
    family: createEmptyFamily(),
    accommodation: createEmptyAccommodation(),
    others: createEmptyOthers(),
  }
}

function cloneSection(section, factory) {
  return { ...factory(), ...section }
}

export function getStudentFormData(record) {
  if (!record) return createEmptyStudent()
  return {
    id: record.id,
    studentCategory: record.studentCategory || 'Local',
    basicInfo: cloneSection(record.basicInfo, createEmptyBasicInfo),
    photo: record.photo ? { ...record.photo } : null,
    enrollment: cloneSection(record.enrollment, createEmptyEnrollment),
    contact: cloneSection(record.contact, createEmptyContact),
    education: cloneSection(record.education, createEmptyEducation),
    family: cloneSection(record.family, createEmptyFamily),
    accommodation: cloneSection(record.accommodation, createEmptyAccommodation),
    others: cloneSection(record.others, createEmptyOthers),
  }
}

export function normalizeStudent(raw) {
  const basicInfo = cloneSection(raw.basicInfo, createEmptyBasicInfo)
  const enrollment = cloneSection(raw.enrollment, createEmptyEnrollment)
  const id = raw.id ?? createStudentRecordId()

  return {
    id,
    studentCategory: raw.studentCategory || 'Local',
    basicInfo,
    photo: raw.photo ? { ...raw.photo } : null,
    enrollment,
    contact: cloneSection(raw.contact, createEmptyContact),
    education: cloneSection(raw.education, createEmptyEducation),
    family: cloneSection(raw.family, createEmptyFamily),
    accommodation: cloneSection(raw.accommodation, createEmptyAccommodation),
    others: cloneSection(raw.others, createEmptyOthers),
    studentId: basicInfo.studentId,
    name: basicInfo.fullName,
    nameCn: basicInfo.chineseName,
    studentType: raw.studentCategory || 'Local',
    gender: basicInfo.gender,
    programmeCode: enrollment.programmeCode,
    programme: enrollment.programme,
    intake: enrollment.intake,
    studentStatus: enrollment.status,
  }
}

const TAB_FIELD_MAP = {
  basicInfo: ['fullName', 'studentId', 'icNo'],
  contact: ['mobilePhone', 'email'],
  enrollment: ['programmeCode', 'programme'],
}

export function validateStudentForm(form, existingStudents = [], editingId = null) {
  const errors = {}
  let firstErrorTab = null

  function setError(tab, field, message) {
    const key = `${tab}.${field}`
    if (!errors[key]) {
      errors[key] = message
      if (!firstErrorTab) firstErrorTab = tab === 'basicInfo' ? 'basic' : tab === 'enrollment' ? 'enrollment' : tab
    }
  }

  if (!String(form.basicInfo?.fullName || '').trim()) {
    setError('basicInfo', 'fullName', 'Full Name is required.')
  }
  if (!String(form.basicInfo?.studentId || '').trim()) {
    setError('basicInfo', 'studentId', 'Student ID is required.')
  }
  const category = form.studentCategory || 'Local'
  if (isLocalCategory(category) && !String(form.basicInfo?.icNo || '').trim()) {
    setError('basicInfo', 'icNo', 'IC No. is required.')
  }
  if (!String(form.contact?.mobilePhone || '').trim()) {
    setError('contact', 'mobilePhone', 'Mobile Phone is required.')
  }
  if (!String(form.contact?.email || '').trim()) {
    setError('contact', 'email', 'Email is required.')
  }
  if (!String(form.enrollment?.programmeCode || '').trim()) {
    setError('enrollment', 'programmeCode', 'Programme Code is required.')
  }
  if (!String(form.enrollment?.programme || '').trim()) {
    setError('enrollment', 'programme', 'Programme is required.')
  }

  const studentId = String(form.basicInfo?.studentId || '').trim().toLowerCase()
  if (studentId) {
    const duplicate = existingStudents.some(
      (item) =>
        item.id !== editingId &&
        String(item.basicInfo?.studentId || item.studentId || '')
          .trim()
          .toLowerCase() === studentId,
    )
    if (duplicate) {
      setError('basicInfo', 'studentId', 'Student ID already exists.')
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstErrorTab,
    tabFields: TAB_FIELD_MAP,
  }
}

export function isDuplicateStudentId(studentId, existingStudents, editingId = null) {
  const normalized = String(studentId || '').trim().toLowerCase()
  if (!normalized) return false
  return existingStudents.some(
    (item) =>
      item.id !== editingId &&
      String(item.basicInfo?.studentId || item.studentId || '')
        .trim()
        .toLowerCase() === normalized,
  )
}

function sampleStudent(partial) {
  return normalizeStudent({
    id: createStudentRecordId(),
    ...partial,
  })
}

export const initialStudents = [
  sampleStudent({
    studentCategory: 'Local',
    basicInfo: {
      fullName: 'Tan Wei Ming',
      chineseName: '陈伟明',
      gender: 'Male',
      studentId: 'XMUM2309001',
      applicationNo: 'APP202309001',
      icNo: '010101010101',
      stateOfBirth: 'Selangor',
      dateOfBirth: '01.01.2001',
      age: '24',
      nationality: 'Malaysia',
      race: 'Chinese',
      religion: 'Buddhism',
      maritalStatus: 'Single',
      disability: 'No',
    },
    contact: {
      mobilePhone: '0123456789',
      email: 'tan.weiming@student.xmum.edu.my',
      permanentAddress: '123 Jalan University, 43900 Sepang, Selangor',
      mailingAddress: '123 Jalan University, 43900 Sepang, Selangor',
    },
    enrollment: {
      programmeCode: 'SWE',
      programme: 'Bachelor of Software Engineering (Honours)',
      faculty: 'School of Information',
      status: 'Active',
      programmeLevel: 'Undergraduate',
      duration: '4 years',
      semester: '6',
      intake: '2024/09',
      academicSession: '2025/09',
      studyMode: 'Full Time',
      recruitedBy: 'Direct Application',
      sourceOfRecruit: 'School Counsellor',
      typeOfFinancialAid: 'None',
      tuitionFeeAnnual: '25000',
      fujianScholarshipAmt: '5000',
    },
    education: {
      qualification: 'STPM',
      institutionName: 'SMJK Yu Hua',
      institutionLocation: 'Kajang, Selangor',
      institutionType: 'Public',
      yearGraduated: '2022',
      gradeResult: '3.67 CGPA equivalent',
      subject: 'Science Stream',
      englishTestType: 'MUET',
      englishResult: 'Band 4',
      englishDate: '15.03.2022',
      chineseTestResult: 'HSK Level 5',
      chineseTestDate: '01.06.2022',
      creditTransfer: 'No',
    },
    family: {
      name: 'Tan Ah Kow',
      icPassport: '600101010102',
      relationship: 'Father',
      occupation: 'Engineer',
      race: 'Chinese',
      mobilePhone: '0123334455',
      officePhone: '03-87654321',
      email: 'ahkow.tan@email.com',
      income: '8500 MYR/month',
      totalLiabilities: '120000',
      mailingAddress: '123 Jalan University, 43900 Sepang, Selangor',
    },
    accommodation: {
      hostelStatus: 'Checked In',
      roomType: 'Double',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'B12',
      floorNo: '3',
      unitNo: 'A',
      roomNo: '305',
      bedNo: 'B',
      checkInDate: '01.09.2023',
      expectedCheckOut: '30.06.2027',
      amountReceivable: '1200',
      moneyReceived: '1200',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.09.2023',
      taxRegistrationNo: 'IG12345678901',
      sponsor: 'Self-funded',
      remarks: "Dean's list Year 1",
      statusChangeLog: '2023-09-01 Enrolled as Active',
    },
  }),
  sampleStudent({
    studentCategory: 'China',
    basicInfo: {
      fullName: 'Li Xiu',
      chineseName: '李秀',
      gender: 'Female',
      studentId: 'XMUM2309002',
      applicationNo: 'APP202309002',
      passportNo: 'E12345678',
      passportExpiry: '31.12.2030',
      placeOfBirth: 'Fujian',
      identityNoChina: '350102199001011234',
      candidateNo: 'CN2023001',
      politicalOutlook: 'Mass Member',
      dateOfBirth: '01.01.1990',
      age: '35',
      nationality: 'China',
      race: 'Chinese',
      religion: 'None',
      maritalStatus: 'Single',
      disability: 'No',
    },
    contact: {
      mobilePhone: '0139876543',
      email: 'li.xiu@student.xmum.edu.my',
      permanentAddress: 'No. 88 Hubin Road, Fuzhou, Fujian 350001, China',
      mailingAddress: 'Block C-1208, Student Village, XMUM Campus, Sepang',
    },
    enrollment: {
      programmeCode: 'ACC',
      programme: 'Bachelor in Accounting (Honours)',
      faculty: 'School of Business',
      status: 'Active',
      programmeLevel: 'Undergraduate',
      duration: '4 years',
      semester: '6',
      intake: '2024/09',
      academicSession: '2025/09',
      studyMode: 'Full Time',
      recruitedBy: 'University Partner',
      sourceOfRecruit: 'XMUM China Office',
      typeOfFinancialAid: 'Scholarship',
      financialAidAmount: '15000',
      scholarshipOfferNo: 'SCH-CN-2023-088',
      tuitionFeeAnnual: '28000',
    },
    education: {
      qualification: 'Bachelor',
      institutionName: 'Fujian Normal University',
      institutionLocation: 'Fuzhou, China',
      institutionType: 'Public',
      yearGraduated: '2012',
      gradeResult: 'GPA 3.5/4.0',
      subject: 'Economics',
      englishTestType: 'IELTS',
      englishResult: '6.5',
      englishDate: '20.05.2023',
      englishExpiry: '20.05.2025',
      creditTransfer: 'No',
      remarks: 'Prior bachelor degree for postgraduate pathway review',
    },
    family: {
      name: 'Li Ming',
      icPassport: '350102196501011234',
      relationship: 'Father',
      occupation: 'Business Owner',
      race: 'Chinese',
      mobilePhone: '+86 13800001111',
      email: 'li.ming@example.cn',
      income: 'RMB 18000/month',
      mailingAddress: 'No. 88 Hubin Road, Fuzhou, Fujian 350001, China',
    },
    accommodation: {
      hostelStatus: 'Checked In',
      roomType: 'Single',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'A08',
      floorNo: '5',
      roomNo: '512',
      bedNo: 'A',
      checkInDate: '01.09.2023',
      expectedCheckOut: '30.06.2027',
      amountReceivable: '1800',
      moneyReceived: '1800',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.09.2023',
      sponsor: 'Fujian Scholarship Programme',
      remarks: 'Scholarship recipient',
      statusChangeLog: '2023-09-01 Enrolled as Active',
    },
  }),
  sampleStudent({
    studentCategory: 'International',
    basicInfo: {
      fullName: 'John Doe',
      chineseName: '',
      gender: 'Male',
      studentId: 'XMUM2309003',
      applicationNo: 'APP202304003',
      passportNo: 'GB1234567',
      passportExpiry: '15.06.2029',
      placeOfBirth: 'London',
      dateOfBirth: '15.06.2002',
      age: '22',
      nationality: 'United Kingdom',
      race: 'Caucasian',
      religion: 'Christianity',
      maritalStatus: 'Single',
      disability: 'No',
    },
    contact: {
      mobilePhone: '0145566778',
      email: 'john.doe@student.xmum.edu.my',
      permanentAddress: '42 Baker Street, London NW1 6XE, United Kingdom',
      mailingAddress: 'Block B-204, Student Village, XMUM Campus, Sepang',
    },
    enrollment: {
      programmeCode: 'IBU',
      programme: 'Bachelor of Management in International Business (Honours)',
      faculty: 'School of Business',
      status: 'Active',
      programmeLevel: 'Undergraduate',
      duration: '4 years',
      semester: '4',
      intake: '2024/04',
      academicSession: '2025/04',
      studyMode: 'Full Time',
      recruitedBy: 'Agent A',
      sourceOfRecruit: 'Education Agent UK',
      typeOfFinancialAid: 'None',
      tuitionFeeAnnual: '32000',
    },
    education: {
      qualification: 'A-Level',
      institutionName: 'Westminster Sixth Form College',
      institutionLocation: 'London, UK',
      institutionType: 'Private',
      yearGraduated: '2022',
      gradeResult: 'AAB',
      subject: 'Economics, Business, Mathematics',
      englishTestType: 'IELTS',
      englishResult: '7.0',
      englishDate: '10.01.2023',
      englishExpiry: '10.01.2025',
      chineseTestResult: 'HSK Level 3',
      chineseTestDate: '05.08.2023',
      creditTransfer: 'No',
    },
    family: {
      name: 'Jane Doe',
      icPassport: 'GB9876543',
      relationship: 'Mother',
      occupation: 'Accountant',
      race: 'Caucasian',
      mobilePhone: '+44 7700 900123',
      email: 'jane.doe@email.co.uk',
      income: 'GBP 4500/month',
      mailingAddress: '42 Baker Street, London NW1 6XE, United Kingdom',
    },
    accommodation: {
      hostelStatus: 'Checked In',
      roomType: 'Double',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'C05',
      floorNo: '2',
      unitNo: 'B',
      roomNo: '218',
      bedNo: 'A',
      checkInDate: '01.04.2023',
      expectedCheckOut: '30.06.2027',
      amountReceivable: '1200',
      moneyReceived: '1200',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.04.2023',
      sponsor: 'Self-funded',
      remarks: 'Exchange programme interest noted',
      statusChangeLog: '2023-04-01 Enrolled as Active',
    },
  }),
]

const CATEGORY_STATUS_TO_PROFILE = {
  Active: 'Active',
  Deferment: 'Deferred',
  Withdrawal: 'Withdrawn',
  Offered: 'Active',
  Unregistered: 'Inactive',
  'Defer Registration': 'Inactive',
  Completion: 'Active',
  Graduated: 'Active',
  'Completion without Graduation': 'Active',
  Incomplete: 'Inactive',
  Expel: 'Withdrawn',
}

export const studentRecords = ref(initialStudents.map((item) => normalizeStudent({ ...item })))

export function findStudentByStudentId(studentId) {
  const normalized = String(studentId || '').trim()
  if (!normalized) return null
  return (
    studentRecords.value.find(
      (item) => String(item.basicInfo?.studentId || item.studentId || '').trim() === normalized,
    ) || null
  )
}

export function applyStudentProfileFromMovement(studentId, categoryConfig) {
  if (!categoryConfig || !studentId) return false
  const index = studentRecords.value.findIndex(
    (item) =>
      String(item.basicInfo?.studentId || item.studentId || '').trim() ===
      String(studentId || '').trim(),
  )
  if (index === -1) return false

  const current = studentRecords.value[index]
  const patch = {}

  if (categoryConfig.modifyStudentStatus && categoryConfig.studentStatus) {
    patch.enrollment = {
      ...current.enrollment,
      status:
        CATEGORY_STATUS_TO_PROFILE[categoryConfig.studentStatus] || categoryConfig.studentStatus,
    }
  }

  if (categoryConfig.modifyStudentType && categoryConfig.category) {
    patch.enrollment = {
      ...(patch.enrollment || current.enrollment),
      trackCategory: categoryConfig.category,
    }
  }

  if (!patch.enrollment) return false

  studentRecords.value[index] = normalizeStudent({ ...current, ...patch })
  return true
}
