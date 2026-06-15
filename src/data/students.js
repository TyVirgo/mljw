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
      icNo: '010101010101',
      nationality: 'Malaysia',
      race: 'Chinese',
      maritalStatus: 'Single',
      disability: 'No',
    },
    contact: {
      mobilePhone: '0123456789',
      email: 'tan.weiming@student.xmum.edu.my',
      permanentAddress: '123 Jalan University, 43900 Sepang, Selangor',
    },
    enrollment: {
      programmeCode: 'SWE',
      programme: 'Bachelor of Software Engineering',
      faculty: 'School of Computing',
      status: 'Active',
      intake: '2023/09',
      studyMode: 'Full Time',
    },
  }),
  sampleStudent({
    studentCategory: 'China',
    basicInfo: {
      fullName: 'Li Xiu',
      chineseName: '李秀',
      gender: 'Female',
      studentId: 'XMUM2309002',
      passportNo: 'E12345678',
      passportExpiry: '2030-12-31',
      placeOfBirth: 'Fujian',
      identityNoChina: '350102199001011234',
      candidateNo: 'CN2023001',
      nationality: 'China',
      race: 'Chinese',
      disability: 'No',
    },
    contact: {
      mobilePhone: '0139876543',
      email: 'li.xiu@student.xmum.edu.my',
    },
    enrollment: {
      programmeCode: 'FIN',
      programme: 'Bachelor of Finance',
      faculty: 'School of Business',
      status: 'Active',
      intake: '2023/09',
    },
  }),
  sampleStudent({
    studentCategory: 'International',
    basicInfo: {
      fullName: 'John Doe',
      chineseName: '',
      gender: 'Male',
      studentId: 'XMUM2309003',
      passportNo: 'GB1234567',
      passportExpiry: '2029-06-15',
      placeOfBirth: 'London',
      nationality: 'United Kingdom',
      disability: 'No',
    },
    contact: {
      mobilePhone: '0145566778',
      email: 'john.doe@student.xmum.edu.my',
    },
    enrollment: {
      programmeCode: 'IB',
      programme: 'Bachelor of International Business',
      faculty: 'School of Business',
      status: 'Active',
      intake: '2023/04',
    },
  }),
]
