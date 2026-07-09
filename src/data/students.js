import { ref } from 'vue'
import { isValidDdMmYyyy, parseDdMmYyyy } from './universityInfo.js'
import { programmeLevelsMatch } from '../utils/formatProgrammeLevel.js'
import {
  formatEnrollmentProgrammeStructure,
  syncEnrollmentDerivedScheduleFields,
  syncRegistrationTimeWithIntake,
} from './studentEnrollmentOptions.js'
import { buildGraduationStatusLogRemarkLines } from './graduationStatusLog.js'
import { buildWithdrawalStatusLogRemarkLines } from './withdrawalStatusLog.js'
import { buildDefermentStatusLogRemarkLines } from './defermentStatusLog.js'
import { buildProgrammeTransferStatusLogRemarkLines } from './programmeTransferStatusLog.js'
import { studentStatusCategoryMap } from './movementCategories.js'

export const studentCategoryOptions = ['Local', 'China', 'International']
/** @deprecated use studentCategoryOptions */
export const studentTypeOptions = studentCategoryOptions

export const genderOptions = ['Male', 'Female']
export const studentStatusOptions = ['Active', 'Inactive', 'Deferred', 'Withdrawn', 'Graduated']

/** 档案学籍状态 → 参考表学籍状态（不扩充档案状态枚举） */
const PROFILE_STATUS_REFERENCE_KEY = {
  Active: 'Active',
  Deferred: 'Deferment',
  Withdrawn: 'Withdrawal',
  Graduated: 'Graduated',
}

export function getTrackCategoriesForProfileStatus(status) {
  if (status === 'Inactive') return ['Normal']
  const refKey = PROFILE_STATUS_REFERENCE_KEY[status] || status
  return studentStatusCategoryMap[refKey] ? [...studentStatusCategoryMap[refKey]] : []
}

export function syncEnrollmentTrackCategory(enrollment) {
  if (!enrollment) return
  const allowed = getTrackCategoriesForProfileStatus(enrollment.status)
  if (!allowed.length) {
    enrollment.trackCategory = ''
    return
  }
  if (!allowed.includes(enrollment.trackCategory)) {
    enrollment.trackCategory = allowed[0]
  }
}

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

export function resolveCategoryFromNationality(nationality) {
  const value = String(nationality || '').trim()
  if (!value) return ''
  if (value === 'Malaysia') return 'Local'
  if (value === 'China') return 'China'
  return 'International'
}

export function syncStudentCategoryFromNationality(form) {
  if (!form) return
  form.studentCategory = resolveCategoryFromNationality(form.basicInfo?.nationality)
}

export function clearCategorySpecificFields(form, oldCategory) {
  if (!form?.basicInfo || !oldCategory) return
  const basicInfo = form.basicInfo
  if (isLocalCategory(oldCategory)) {
    basicInfo.icNo = ''
    basicInfo.stateOfBirth = ''
    if (form.education) form.education.spmMalayScore = ''
  }
  if (isChinaOrInternationalCategory(oldCategory)) {
    basicInfo.passportNo = ''
    basicInfo.passportExpiry = ''
    basicInfo.studentPassExpiryStartDate = ''
    basicInfo.studentPassExpiryEndDate = ''
    basicInfo.placeOfBirth = ''
  }
  if (isChinaCategory(oldCategory)) {
    basicInfo.candidateNo = ''
    basicInfo.politicalOutlook = ''
    basicInfo.identityNoChina = ''
  }
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

export const studentDetailTabs = [
  ...studentFormTabs,
  { id: 'statusLog', labelKey: 'studentProfile.tabs.statusLog' },
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
    studentPassExpiryStartDate: '',
    studentPassExpiryEndDate: '',
    outstandingFee: '',
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
    programmeIntakeKey: '',
    programmeCode: '',
    programme: '',
    faculty: '',
    status: 'Active',
    trackCategory: 'Normal',
    programmeLevel: '',
    programmeStructure: '',
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
    registrationTime: '',
    expectedCompletionBatch: '',
    expectedGraduationBatch: '',
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
    spmMalayScore: '',
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

let nextFamilyMemberId = 1

export function createFamilyMemberId() {
  return nextFamilyMemberId++
}

export function createEmptyFamilyMember(partial = {}) {
  return {
    id: partial.id ?? createFamilyMemberId(),
    name: partial.name ?? '',
    icPassport: partial.icPassport ?? '',
    relationship: partial.relationship ?? '',
    occupation: partial.occupation ?? '',
    race: partial.race ?? '',
    mobilePhone: partial.mobilePhone ?? '',
    officePhone: partial.officePhone ?? '',
    fax: partial.fax ?? '',
    email: partial.email ?? '',
    income: partial.income ?? '',
    totalLiabilities: partial.totalLiabilities ?? '',
    mailingAddress: partial.mailingAddress ?? '',
  }
}

export function normalizeFamilyContacts(family) {
  if (Array.isArray(family)) {
    return family.length
      ? family.map((item) => createEmptyFamilyMember(item))
      : [createEmptyFamilyMember()]
  }
  if (family && typeof family === 'object') {
    return [createEmptyFamilyMember(family)]
  }
  return [createEmptyFamilyMember()]
}

export function getPrimaryFamilyContact(student) {
  const contacts = normalizeFamilyContacts(student?.family)
  return contacts.find((item) => String(item.name || '').trim()) || contacts[0] || createEmptyFamilyMember()
}

export function formatFamilyContactNames(family) {
  return normalizeFamilyContacts(family)
    .map((item) => String(item.name || '').trim())
    .filter(Boolean)
    .join('; ')
}

/** @deprecated use createEmptyFamilyMember / normalizeFamilyContacts */
export function createEmptyFamily() {
  return createEmptyFamilyMember()
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
  }
}

export function createEmptyStatusLogEntry(partial = {}) {
  return {
    id: partial.id ?? null,
    status: partial.status ?? '',
    dateEffective: partial.dateEffective ?? '',
    changedBy: partial.changedBy ?? '',
    movementCategoryKey: partial.movementCategoryKey ?? '',
    movementCategory: partial.movementCategory ?? '',
    remarkTitle: partial.remarkTitle ?? '',
    remarkLines: Array.isArray(partial.remarkLines) ? [...partial.remarkLines] : [],
  }
}

export function createEmptyStudent() {
  return {
    id: null,
    studentCategory: '',
    basicInfo: createEmptyBasicInfo(),
    photo: null,
    enrollment: createEmptyEnrollment(),
    contact: createEmptyContact(),
    education: createEmptyEducation(),
    family: normalizeFamilyContacts([]),
    accommodation: createEmptyAccommodation(),
    others: createEmptyOthers(),
    statusLogs: [],
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
    family: normalizeFamilyContacts(record.family),
    accommodation: cloneSection(record.accommodation, createEmptyAccommodation),
    others: cloneSection(record.others, createEmptyOthers),
    statusLogs: Array.isArray(record.statusLogs)
      ? record.statusLogs.map((entry) => createEmptyStatusLogEntry(entry))
      : [],
  }
}

export function getLatestStatusLogEntry(statusLogs) {
  const logs = (Array.isArray(statusLogs) ? statusLogs : []).filter((entry) =>
    String(entry?.status || '').trim(),
  )
  if (!logs.length) return null

  return [...logs].sort((a, b) => {
    const dateA = normalizeStudentProfileDate(a.dateEffective)
    const dateB = normalizeStudentProfileDate(b.dateEffective)
    if (dateA && dateB) {
      const diff = dateB.getTime() - dateA.getTime()
      if (diff !== 0) return diff
    } else if (dateA && !dateB) return -1
    else if (!dateA && dateB) return 1
    return (Number(b.id) || 0) - (Number(a.id) || 0)
  })[0]
}

export function getLatestStudentStatus(student) {
  const entry = getLatestStatusLogEntry(student?.statusLogs)
  if (entry?.status) return entry.status
  return student?.enrollment?.status || student?.studentStatus || ''
}

function matchFuzzyField(value, keyword) {
  const normalized = String(keyword || '').trim().toLowerCase()
  if (!normalized) return true
  return String(value || '').toLowerCase().includes(normalized)
}

export function matchesStudentTextFilters(item, search) {
  if (!matchFuzzyField(item.studentId, search?.studentId)) return false
  if (!matchFuzzyField(item.name, search?.studentName)) return false
  if (!matchFuzzyField(item.nameCn, search?.chineseName)) return false
  if (!matchFuzzyField(item.icNo ?? item.basicInfo?.icNo, search?.icNo)) return false
  if (!matchFuzzyField(item.mobilePhone ?? item.contact?.mobilePhone, search?.mobilePhone)) {
    return false
  }
  return true
}

export function matchesStudentListFilters(item, search) {
  if (!matchesStudentTextFilters(item, search)) return false
  if (search?.programme && item.programme !== search.programme) return false
  if (search?.intake && item.intake !== search.intake) return false
  if (search?.status && getLatestStudentStatus(item) !== search.status) return false
  if (search?.studentType && item.studentType !== search.studentType) return false
  if (search?.nationality && item.nationality !== search.nationality) return false
  if (search?.registrationTime && item.registrationTime !== search.registrationTime) return false
  if (
    search?.programmeLevel &&
    !programmeLevelsMatch(item.programmeLevel || item.enrollment?.programmeLevel, search.programmeLevel)
  ) {
    return false
  }
  if (search?.programmeStructure && item.programmeStructure !== search.programmeStructure) return false
  if (search?.expectedCompletionBatch && item.expectedCompletionBatch !== search.expectedCompletionBatch) {
    return false
  }
  if (search?.expectedGraduationBatch && item.expectedGraduationBatch !== search.expectedGraduationBatch) {
    return false
  }
  if (search?.outstandingFee && item.outstandingFee !== search.outstandingFee) return false
  if (!matchesStudentPassExpiryDateRange(item, search?.studentPassExpiryFrom, search?.studentPassExpiryTo)) {
    return false
  }
  return true
}

function backfillEnrollmentDerivedFields(enrollment) {
  if (!enrollment?.intake) return

  if (!String(enrollment.registrationTime || '').trim()) {
    syncRegistrationTimeWithIntake(enrollment)
  }

  if (
    !String(enrollment.expectedCompletionBatch || '').trim() ||
    !String(enrollment.expectedGraduationBatch || '').trim()
  ) {
    syncEnrollmentDerivedScheduleFields(enrollment)
  }

  if (!String(enrollment.programmeStructure || '').trim() && enrollment.programmeCode) {
    enrollment.programmeStructure = formatEnrollmentProgrammeStructure(
      enrollment.programmeCode,
      enrollment.intake,
      enrollment.programme,
    )
  }
}

export function normalizeStudent(raw) {
  const basicInfo = cloneSection(raw.basicInfo, createEmptyBasicInfo)
  const enrollment = cloneSection(raw.enrollment, createEmptyEnrollment)
  backfillEnrollmentDerivedFields(enrollment)
  if (!String(enrollment.trackCategory || '').trim()) {
    enrollment.trackCategory = 'Normal'
  }
  syncEnrollmentTrackCategory(enrollment)
  const contact = cloneSection(raw.contact, createEmptyContact)
  const id = raw.id ?? createStudentRecordId()
  const statusLogs = Array.isArray(raw.statusLogs)
    ? raw.statusLogs.map((entry) => createEmptyStatusLogEntry(entry))
    : []
  const latestStatus = getLatestStudentStatus({ statusLogs, enrollment })

  return {
    id,
    studentCategory: raw.studentCategory || 'Local',
    basicInfo,
    photo: raw.photo ? { ...raw.photo } : null,
    enrollment,
    contact,
    education: cloneSection(raw.education, createEmptyEducation),
    family: normalizeFamilyContacts(raw.family),
    accommodation: cloneSection(raw.accommodation, createEmptyAccommodation),
    others: cloneSection(raw.others, createEmptyOthers),
    statusLogs,
    studentId: basicInfo.studentId,
    name: basicInfo.fullName,
    nameCn: basicInfo.chineseName,
    studentType: raw.studentCategory || 'Local',
    gender: basicInfo.gender,
    nationality: basicInfo.nationality,
    icNo: basicInfo.icNo,
    mobilePhone: contact.mobilePhone,
    outstandingFee: basicInfo.outstandingFee,
    programmeCode: enrollment.programmeCode,
    programme: enrollment.programme,
    intake: enrollment.intake,
    trackCategory: enrollment.trackCategory,
    registrationTime: enrollment.registrationTime,
    programmeLevel: enrollment.programmeLevel,
    programmeStructure: enrollment.programmeStructure,
    expectedCompletionBatch: enrollment.expectedCompletionBatch,
    expectedGraduationBatch: enrollment.expectedGraduationBatch,
    studentStatus: latestStatus,
    latestStatus,
    studentPassExpiryStartDate: basicInfo.studentPassExpiryStartDate,
    studentPassExpiryEndDate: basicInfo.studentPassExpiryEndDate,
    studentPassExpiryPeriod: formatStudentPassExpiryEndDate(basicInfo),
  }
}

export function normalizeStudentProfileDate(value) {
  if (!String(value || '').trim()) return null
  const normalized = String(value).trim().replace(/\./g, '/')
  if (!isValidDdMmYyyy(normalized)) return null
  return parseDdMmYyyy(normalized)
}

export function formatStudentPassExpiryDate(value) {
  const parsed = normalizeStudentProfileDate(value)
  if (!parsed) return value || ''
  const dd = String(parsed.getDate()).padStart(2, '0')
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const yyyy = parsed.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function formatStudentPassExpiryPeriod(basicInfo = {}) {
  const start = formatStudentPassExpiryDate(basicInfo.studentPassExpiryStartDate)
  const end = formatStudentPassExpiryDate(basicInfo.studentPassExpiryEndDate)
  if (start && end) return `${start} - ${end}`
  if (end) return end
  if (start) return start
  return ''
}

/** Display Student Pass Expiry Date as end date only (dd/mm/yyyy). */
export function formatStudentPassExpiryEndDate(basicInfo = {}) {
  return formatStudentPassExpiryDate(basicInfo.studentPassExpiryEndDate) || ''
}

/** Normalize stored pass expiry text (object or legacy range string) to end date. */
export function resolveStudentPassExpiryEndDisplay(valueOrBasic) {
  if (valueOrBasic && typeof valueOrBasic === 'object') {
    return formatStudentPassExpiryEndDate(valueOrBasic) || ''
  }
  const text = String(valueOrBasic || '').trim()
  if (!text || text === '—') return ''
  if (text.includes(' - ')) {
    return text.split(' - ').pop().trim()
  }
  return text
}

export function matchesStudentPassExpiryDateRange(item, from, to) {
  const fromValue = String(from || '').trim()
  const toValue = String(to || '').trim()
  if (!fromValue && !toValue) return true

  const basic = item.basicInfo || item
  const date = normalizeStudentProfileDate(basic.studentPassExpiryEndDate)
  if (!date) return false

  const fromDate = fromValue ? normalizeStudentProfileDate(fromValue) : null
  const toDate = toValue ? normalizeStudentProfileDate(toValue) : null
  if (fromValue && !fromDate) return false
  if (toValue && !toDate) return false
  if (fromDate && date < fromDate) return false
  if (toDate && date > toDate) return false
  return true
}

const TAB_FIELD_MAP = {
  basicInfo: ['fullName', 'studentId', 'icNo'],
  contact: ['mobilePhone', 'email'],
  enrollment: ['programmeLevel', 'faculty', 'programmeCode', 'programme', 'intake', 'academicSession'],
  education: ['spmMalayScore'],
}

export function validateStudentForm(form, existingStudents = [], editingId = null) {
  const errors = {}
  let firstErrorTab = null

  function setError(tab, field, message) {
    const key = `${tab}.${field}`
    if (!errors[key]) {
      errors[key] = message
      if (!firstErrorTab) {
        firstErrorTab =
          tab === 'basicInfo' ? 'basic' : tab === 'enrollment' ? 'enrollment' : tab === 'education' ? 'education' : tab
      }
    }
  }

  if (!String(form.basicInfo?.fullName || '').trim()) {
    setError('basicInfo', 'fullName', 'Full Name is required.')
  }
  if (!String(form.basicInfo?.studentId || '').trim()) {
    setError('basicInfo', 'studentId', 'Student ID is required.')
  }

  const nationality = String(form.basicInfo?.nationality || '').trim()
  if (!nationality) {
    setError('basicInfo', 'nationality', 'Nationality is required.')
    return { valid: false, errors, firstErrorTab: null }
  }

  const category = resolveCategoryFromNationality(nationality)
  if (category === 'Local' && !String(form.basicInfo?.icNo || '').trim()) {
    setError('basicInfo', 'icNo', 'IC No. is required.')
  }
  if (category === 'Local' && !String(form.education?.spmMalayScore || '').trim()) {
    setError('education', 'spmMalayScore', 'SPM Malay Score is required.')
  }
  if (!String(form.contact?.mobilePhone || '').trim()) {
    setError('contact', 'mobilePhone', 'Mobile Phone is required.')
  }
  if (!String(form.contact?.email || '').trim()) {
    setError('contact', 'email', 'Email is required.')
  }
  if (!String(form.enrollment?.programmeLevel || '').trim()) {
    setError('enrollment', 'programmeLevel', 'Programme Level is required.')
  }
  if (!String(form.enrollment?.faculty || '').trim()) {
    setError('enrollment', 'faculty', 'Faculty is required.')
  }
  if (!String(form.enrollment?.programme || '').trim()) {
    setError('enrollment', 'programme', 'Programme is required.')
  }
  if (!String(form.enrollment?.programmeCode || '').trim()) {
    setError('enrollment', 'programmeCode', 'Programme Code is required.')
  }
  if (!String(form.enrollment?.intake || '').trim()) {
    setError('enrollment', 'intake', 'Intake is required.')
  }
  if (!String(form.enrollment?.academicSession || '').trim()) {
    setError('enrollment', 'academicSession', 'Current Academic Session is required.')
  }

  const allowedTrackCategories = getTrackCategoriesForProfileStatus(form.enrollment?.status)
  const trackCategory = String(form.enrollment?.trackCategory || '').trim()
  if (!trackCategory) {
    setError('enrollment', 'trackCategory', 'Track category is required.')
  } else if (!allowedTrackCategories.includes(trackCategory)) {
    setError('enrollment', 'trackCategory', 'Track category is invalid.')
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
      outstandingFee: 'N',
    },
    contact: {
      mobilePhone: '0123456789',
      email: 'tan.weiming@student.xmum.edu.my',
      permanentAddress: '123 Jalan University, 43900 Sepang, Selangor',
      mailingAddress: '123 Jalan University, 43900 Sepang, Selangor',
    },
    enrollment: {
      programmeIntakeKey: '202409SWE',
      programmeCode: 'SWE',
      programme: 'Bachelor of Software Engineering (Honours)',
      faculty: 'School of Information',
      status: 'Graduated',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '1',
      intake: '2024/09',
      academicSession: '2024/09',
      registrationTime: '2024/09',
      expectedCompletionBatch: '2027/08',
      expectedGraduationBatch: '2027/08',
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
      spmMalayScore: 'A',
      englishTestType: 'MUET',
      englishResult: 'Band 4',
      englishDate: '15.03.2022',
      chineseTestResult: 'HSK Level 5',
      chineseTestDate: '01.06.2022',
      creditTransfer: 'No',
    },
    family: [
      {
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
      {
        name: 'Tan Bee Lan',
        icPassport: '620202020202',
        relationship: 'Mother',
        occupation: 'Accountant',
        race: 'Chinese',
        mobilePhone: '0124445566',
        email: 'beelan.tan@email.com',
        income: '6500 MYR/month',
        mailingAddress: '123 Jalan University, 43900 Sepang, Selangor',
      },
    ],
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
    },
    statusLogs: [
      {
        id: 1,
        status: 'New',
        dateEffective: '2023-09-01',
        changedBy: 'TAN HUEY YEN',
        remarkTitle: 'New Registration',
        remarkLines: [
          'Program : Bachelor of Software Engineering (Honours)',
          'Intake : 2024/09',
        ],
      },
      {
        id: 2,
        status: 'Active',
        dateEffective: '2023-09-01',
        changedBy: 'LEE LAY TEEN',
        remarkTitle: 'Change Student Status',
        remarkLines: [
          'Old StudentID : SWE2309001',
          'New StudentID : XMUM2309001',
          'Old Intake : 2023/09',
          'New Intake : 2024/09',
        ],
      },
      {
        id: 3,
        status: 'Active',
        dateEffective: '2024-09-01',
        changedBy: 'ADMIN SYSTEM',
        remarkTitle: 'Activated',
        remarkLines: ['Academic Session : 2025/09'],
      },
      {
        id: 4,
        status: 'Active',
        dateEffective: '2025-02-18',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srProgrammeTransfer',
        movementCategory: 'Programme Transfer',
        remarkTitle: 'Programme Transfer Approved',
        remarkLines: [
          'Programme transfer, SWE to DS, approved in 2025/02, effective from 2025/09',
        ],
      },
      {
        id: 5,
        status: 'Deferred',
        dateEffective: '2025-09-29',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srDeferment',
        movementCategory: 'Deferment',
        remarkTitle: 'Deferment Approved',
        remarkLines: [
          '1st Deferment: 01/02/2026-15/03/2026',
          'Deferment Period : 2026/02',
          'Reason : Personal Reason',
        ],
      },
      {
        id: 6,
        status: 'Active',
        dateEffective: '2026-02-01',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srResumption',
        movementCategory: 'Resumption',
        remarkTitle: 'Resumption Approved',
        remarkLines: ['Resumption Semester : 2026/02', 'Application ID : RES002'],
      },
      {
        id: 7,
        status: 'Graduated',
        dateEffective: '2029-06-30',
        changedBy: 'ADMIN SYSTEM',
        remarkTitle: 'Graduation',
        remarkLines: buildGraduationStatusLogRemarkLines(),
      },
    ],
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
      studentPassExpiryStartDate: '15/09/2024',
      studentPassExpiryEndDate: '14/09/2029',
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
      outstandingFee: 'Y',
    },
    contact: {
      mobilePhone: '0139876543',
      email: 'li.xiu@student.xmum.edu.my',
      permanentAddress: 'No. 88 Hubin Road, Fuzhou, Fujian 350001, China',
      mailingAddress: 'Block C-1208, Student Village, XMUM Campus, Sepang',
    },
    enrollment: {
      programmeIntakeKey: '202409ACC',
      programmeCode: 'ACC',
      programme: 'Bachelor in Accounting (Honours)',
      faculty: 'School of Business',
      status: 'Active',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '1',
      intake: '2024/09',
      academicSession: '2024/09',
      registrationTime: '2024/09',
      expectedCompletionBatch: '2027/08',
      expectedGraduationBatch: '2027/08',
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
    },
    statusLogs: [
      {
        id: 1,
        status: 'New',
        dateEffective: '2023-09-01',
        changedBy: 'TAN HUEY YEN',
        remarkTitle: 'New Registration',
        remarkLines: [
          'Program : Bachelor in Accounting (Honours)',
          'Intake : 2024/09',
        ],
      },
      {
        id: 2,
        status: 'Active',
        dateEffective: '2023-09-01',
        changedBy: 'LEE LAY TEEN',
        remarkTitle: 'Change Student Status',
        remarkLines: [
          'Old StudentID : ACC2309002',
          'New StudentID : XMUM2309002',
          'Old Intake : 2023/09',
          'New Intake : 2024/09',
        ],
      },
      {
        id: 3,
        status: 'Active',
        dateEffective: '2024-09-01',
        changedBy: 'WANG MEI LING',
        remarkTitle: 'Scholarship Confirmed',
        remarkLines: [
          'Scholarship Offer No : SCH-CN-2023-088',
          'Financial Aid Amount : 15000',
        ],
      },
      {
        id: 4,
        status: 'Active',
        dateEffective: '2025-03-01',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srProgrammeTransfer',
        movementCategory: 'Programme Transfer',
        remarkTitle: 'Programme Transfer Approved',
        remarkLines: [
          'Programme transfer, ACC to FIN, approved in 2025/02, effective from 2025/09',
        ],
      },
      {
        id: 5,
        status: 'Withdrawn',
        dateEffective: '2024-11-15',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srWithdrawal',
        movementCategory: 'Withdrawal',
        remarkTitle: 'Withdrawal Approved',
        remarkLines: buildWithdrawalStatusLogRemarkLines({
          lastDateOfAttendance: '2024-11-15',
          reasonId: 6,
          note: 'Reinstated via appeal on 01.12.2024',
        }),
      },
    ],
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
      studentPassExpiryStartDate: '01/09/2025',
      studentPassExpiryEndDate: '31/08/2029',
      placeOfBirth: 'London',
      dateOfBirth: '15.06.2002',
      age: '22',
      nationality: 'United Kingdom',
      race: 'Caucasian',
      religion: 'Christianity',
      maritalStatus: 'Single',
      disability: 'No',
      outstandingFee: 'N',
    },
    contact: {
      mobilePhone: '0145566778',
      email: 'john.doe@student.xmum.edu.my',
      permanentAddress: '42 Baker Street, London NW1 6XE, United Kingdom',
      mailingAddress: 'Block B-204, Student Village, XMUM Campus, Sepang',
    },
    enrollment: {
      programmeIntakeKey: '202504IBU',
      programmeCode: 'IBU',
      programme: 'Bachelor of Management in International Business (Honours)',
      faculty: 'School of Business',
      status: 'Active',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '1',
      intake: '2025/04',
      academicSession: '2025/04',
      registrationTime: '2025/04',
      expectedCompletionBatch: '2028/03',
      expectedGraduationBatch: '2028/03',
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
    },
    statusLogs: [
      {
        id: 1,
        status: 'New',
        dateEffective: '2023-04-01',
        changedBy: 'TAN HUEY YEN',
        remarkTitle: 'New Registration',
        remarkLines: [
          'Program : Bachelor of Management in International Business (Honours)',
          'Intake : 2024/04',
        ],
      },
      {
        id: 2,
        status: 'Active',
        dateEffective: '2023-04-01',
        changedBy: 'LEE LAY TEEN',
        remarkTitle: 'Change Student Status',
        remarkLines: [
          'Old StudentID : IBU2309003',
          'New StudentID : XMUM2309003',
          'Old Intake : 2023/04',
          'New Intake : 2024/04',
        ],
      },
      {
        id: 3,
        status: 'Active',
        dateEffective: '2024-04-01',
        changedBy: 'ADMIN SYSTEM',
        remarkTitle: 'Activated',
        remarkLines: ['Academic Session : 2025/04'],
      },
      {
        id: 4,
        status: 'Deferred',
        dateEffective: '2025-09-26',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srDeferment',
        movementCategory: 'Deferment',
        remarkTitle: 'Deferment Approved',
        remarkLines: [
          '1st Deferment: 02/09/2025-15/06/2026',
          'Deferment Period : 2025/09',
          'Reason : Health Issue',
        ],
      },
      {
        id: 5,
        status: 'Active',
        dateEffective: '2026-02-01',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srResumption',
        movementCategory: 'Resumption',
        remarkTitle: 'Resumption Approved',
        remarkLines: ['Resumption Semester : 2026/02', 'Application ID : RES003'],
      },
    ],
  }),
  sampleStudent({
    studentCategory: 'Local',
    basicInfo: {
      fullName: 'Lim Defer Demo',
      chineseName: '林休学演示',
      gender: 'Male',
      studentId: 'XMUM240DEF01',
      applicationNo: 'APP202409901',
      icNo: '020202020202',
      stateOfBirth: 'Johor',
      dateOfBirth: '02.02.2002',
      age: '23',
      nationality: 'Malaysia',
      race: 'Chinese',
      religion: 'Buddhism',
      maritalStatus: 'Single',
      disability: 'No',
      outstandingFee: 'N',
    },
    contact: {
      mobilePhone: '0112233445',
      email: 'lim.defer.demo@student.xmum.edu.my',
      permanentAddress: '88 Jalan Demo, 81300 Johor Bahru, Johor',
      mailingAddress: '88 Jalan Demo, 81300 Johor Bahru, Johor',
    },
    enrollment: {
      programmeCode: 'SWE',
      programme: 'Bachelor of Software Engineering (Honours)',
      faculty: 'School of Information',
      status: 'Deferred',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '4',
      intake: '2023/09',
      academicSession: '2024/02',
      studyMode: 'Full Time',
      recruitedBy: 'Direct Application',
      sourceOfRecruit: 'School Counsellor',
      typeOfFinancialAid: 'None',
      tuitionFeeAnnual: '25000',
    },
    education: {
      qualification: 'STPM',
      institutionName: 'SMK Demo',
      institutionLocation: 'Johor Bahru, Johor',
      institutionType: 'Public',
      yearGraduated: '2021',
      gradeResult: '3.50 CGPA equivalent',
      subject: 'Science Stream',
      spmMalayScore: 'B+',
      englishTestType: 'MUET',
      englishResult: 'Band 4',
      englishDate: '15.03.2021',
      creditTransfer: 'No',
    },
    family: {
      name: 'Lim Ah Demo',
      icPassport: '650202020202',
      relationship: 'Father',
      occupation: 'Teacher',
      race: 'Chinese',
      mobilePhone: '0119988776',
      email: 'lim.demo@email.com',
      income: '7000 MYR/month',
      mailingAddress: '88 Jalan Demo, 81300 Johor Bahru, Johor',
    },
    accommodation: {
      hostelStatus: 'Checked Out',
      roomType: 'Double',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'B08',
      floorNo: '2',
      roomNo: '208',
      bedNo: 'A',
      checkInDate: '01.09.2023',
      expectedCheckOut: '30.06.2024',
      amountReceivable: '0',
      moneyReceived: '0',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.09.2023',
      sponsor: 'Self-funded',
      remarks: 'Demo: Deferred status for resumption eligibility',
    },
    statusLogs: [
      {
        id: 1,
        status: 'Active',
        dateEffective: '2023-09-01',
        changedBy: 'ADMIN SYSTEM',
        remarkTitle: 'New Registration',
        remarkLines: ['Intake : 2023/09'],
      },
      {
        id: 2,
        status: 'Deferred',
        dateEffective: '2024-02-01',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srDeferment',
        movementCategory: 'Deferment',
        remarkTitle: 'Deferment Approved',
        remarkLines: ['Academic Session : 2024/02', 'Status changed to Deferred'],
      },
    ],
  }),
  sampleStudent({
    studentCategory: 'Local',
    basicInfo: {
      fullName: 'Ahmad Rizal',
      chineseName: '阿末·里扎',
      gender: 'Male',
      studentId: 'XMUM240DEF02',
      applicationNo: 'APP202409902',
      icNo: '030303030303',
      stateOfBirth: 'Selangor',
      dateOfBirth: '03.03.2003',
      age: '22',
      nationality: 'Malaysia',
      race: 'Malay',
      religion: 'Islam',
      maritalStatus: 'Single',
      disability: 'No',
      outstandingFee: 'Y',
    },
    contact: {
      mobilePhone: '0135566778',
      email: 'ahmad.rizal@student.xmum.edu.my',
      permanentAddress: '56 Jalan Merdeka, 43000 Kajang, Selangor',
      mailingAddress: '56 Jalan Merdeka, 43000 Kajang, Selangor',
    },
    enrollment: {
      programmeCode: 'CSN',
      programme: 'Bachelor of Computer Science (Honours)',
      faculty: 'School of Information',
      status: 'Deferred',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '3',
      intake: '2024/02',
      academicSession: '2025/02',
      studyMode: 'Full Time',
      recruitedBy: 'Direct Application',
      sourceOfRecruit: 'School Counsellor',
      typeOfFinancialAid: 'None',
      tuitionFeeAnnual: '24000',
    },
    education: {
      qualification: 'STPM',
      institutionName: 'SMK Kajang',
      institutionLocation: 'Kajang, Selangor',
      institutionType: 'Public',
      yearGraduated: '2023',
      gradeResult: '3.40 CGPA equivalent',
      subject: 'Science Stream',
      spmMalayScore: 'A-',
      creditTransfer: 'No',
    },
    family: {
      name: 'Rizal Bin Hassan',
      icPassport: '660606060606',
      relationship: 'Father',
      occupation: 'Engineer',
      race: 'Malay',
      mobilePhone: '0131122334',
      email: 'rizal.hassan@email.com',
      income: '8000 MYR/month',
      mailingAddress: '56 Jalan Merdeka, 43000 Kajang, Selangor',
    },
    accommodation: {
      hostelStatus: 'Checked Out',
      roomType: 'Double',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'A03',
      floorNo: '3',
      roomNo: '312',
      bedNo: 'B',
      checkInDate: '01.02.2024',
      expectedCheckOut: '30.06.2025',
      amountReceivable: '0',
      moneyReceived: '0',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.02.2024',
      sponsor: 'Self-funded',
      remarks: 'Demo: Deferred — military service deferment',
    },
    statusLogs: [
      {
        id: 1,
        status: 'Active',
        dateEffective: '2024-02-01',
        changedBy: 'TAN HUEY YEN',
        remarkTitle: 'New Registration',
        remarkLines: ['Intake : 2024/02'],
      },
      {
        id: 2,
        status: 'Deferred',
        dateEffective: '2025-02-18',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srDeferment',
        movementCategory: 'Deferment',
        remarkTitle: 'Deferment Approved',
        remarkLines: [
          '1st Deferment: 02/09/2025-15/06/2026',
          'Deferment Period : 2025/09',
          'Reason : Military Service',
        ],
      },
    ],
  }),
  sampleStudent({
    studentCategory: 'China',
    basicInfo: {
      fullName: 'Zhang Min',
      chineseName: '张敏',
      gender: 'Female',
      studentId: 'XMUM240DEF03',
      applicationNo: 'APP202409903',
      passportNo: 'E99887766',
      passportExpiry: '31.12.2029',
      studentPassExpiryStartDate: '01/03/2024',
      studentPassExpiryEndDate: '28/02/2027',
      placeOfBirth: 'Guangdong',
      identityNoChina: '440105200205051234',
      candidateNo: 'CN2024003',
      politicalOutlook: 'Mass Member',
      dateOfBirth: '05.05.2002',
      age: '23',
      nationality: 'China',
      race: 'Chinese',
      religion: 'None',
      maritalStatus: 'Single',
      disability: 'No',
      outstandingFee: 'N',
    },
    contact: {
      mobilePhone: '0146677889',
      email: 'zhang.min@student.xmum.edu.my',
      permanentAddress: 'No. 12 Tianhe Road, Guangzhou, Guangdong 510000, China',
      mailingAddress: 'Block D-506, Student Village, XMUM Campus, Sepang',
    },
    enrollment: {
      programmeCode: 'ACC',
      programme: 'Bachelor in Accounting (Honours)',
      faculty: 'School of Business',
      status: 'Deferred',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '5',
      intake: '2023/09',
      academicSession: '2024/09',
      studyMode: 'Full Time',
      recruitedBy: 'Agent B',
      sourceOfRecruit: 'Education Agent CN',
      typeOfFinancialAid: 'Scholarship',
      tuitionFeeAnnual: '28000',
    },
    education: {
      qualification: 'Foundation',
      institutionName: 'XMUM Foundation Centre',
      institutionLocation: 'Sepang, Selangor',
      institutionType: 'Private',
      yearGraduated: '2023',
      gradeResult: '3.80 CGPA',
      subject: 'Business Foundation',
      chineseTestResult: 'HSK Level 5',
      chineseTestDate: '01.06.2023',
      creditTransfer: 'No',
    },
    family: {
      name: 'Zhang Wei',
      icPassport: 'E88776655',
      relationship: 'Father',
      occupation: 'Business Owner',
      race: 'Chinese',
      mobilePhone: '+86 13800138000',
      email: 'zhang.wei@email.cn',
      income: 'CNY 25000/month',
      mailingAddress: 'No. 12 Tianhe Road, Guangzhou, Guangdong 510000, China',
    },
    accommodation: {
      hostelStatus: 'Checked Out',
      roomType: 'Single',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'D12',
      floorNo: '5',
      roomNo: '512',
      bedNo: 'A',
      checkInDate: '01.09.2023',
      expectedCheckOut: '30.06.2025',
      amountReceivable: '0',
      moneyReceived: '0',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.09.2023',
      sponsor: 'Fujian Scholarship Programme',
      remarks: 'Demo: Deferred — health issue',
    },
    statusLogs: [
      {
        id: 1,
        status: 'Active',
        dateEffective: '2023-09-01',
        changedBy: 'WANG MEI LING',
        remarkTitle: 'New Registration',
        remarkLines: ['Intake : 2023/09'],
      },
      {
        id: 2,
        status: 'Deferred',
        dateEffective: '2024-09-01',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srDeferment',
        movementCategory: 'Deferment',
        remarkTitle: 'Deferment Approved',
        remarkLines: [
          '1st Deferment: 02/09/2024-15/06/2025',
          'Deferment Period : 2024/09',
          'Reason : Health Issue',
        ],
      },
    ],
  }),
  sampleStudent({
    studentCategory: 'Local',
    basicInfo: {
      fullName: 'Siti Nurhaliza',
      chineseName: '西蒂',
      gender: 'Female',
      studentId: 'XMUM240WDR01',
      applicationNo: 'APP202409904',
      icNo: '040404040404',
      stateOfBirth: 'Negeri Sembilan',
      dateOfBirth: '04.04.2004',
      age: '21',
      nationality: 'Malaysia',
      race: 'Malay',
      religion: 'Islam',
      maritalStatus: 'Single',
      disability: 'No',
      outstandingFee: 'Y',
    },
    contact: {
      mobilePhone: '0178899001',
      email: 'siti.nurhaliza@student.xmum.edu.my',
      permanentAddress: '22 Jalan Seremban, 70000 Seremban, Negeri Sembilan',
      mailingAddress: '22 Jalan Seremban, 70000 Seremban, Negeri Sembilan',
    },
    enrollment: {
      programmeCode: 'FIN',
      programme: 'Bachelor of Finance',
      faculty: 'School of Business',
      status: 'Withdrawn',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '2',
      intake: '2024/09',
      academicSession: '2024/09',
      studyMode: 'Full Time',
      recruitedBy: 'Direct Application',
      sourceOfRecruit: 'School Counsellor',
      typeOfFinancialAid: 'None',
      tuitionFeeAnnual: '26000',
    },
    education: {
      qualification: 'STPM',
      institutionName: 'SMK Seremban',
      institutionLocation: 'Seremban, Negeri Sembilan',
      institutionType: 'Public',
      yearGraduated: '2023',
      gradeResult: '3.20 CGPA equivalent',
      subject: 'Accounting Stream',
      spmMalayScore: 'B',
      creditTransfer: 'No',
    },
    family: {
      name: 'Nur Aisyah',
      icPassport: '670707070707',
      relationship: 'Mother',
      occupation: 'Clerk',
      race: 'Malay',
      mobilePhone: '0173344556',
      email: 'nur.aisyah@email.com',
      income: '4500 MYR/month',
      mailingAddress: '22 Jalan Seremban, 70000 Seremban, Negeri Sembilan',
    },
    accommodation: {
      hostelStatus: 'Checked Out',
      roomType: 'Double',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'B02',
      floorNo: '1',
      roomNo: '108',
      bedNo: 'A',
      checkInDate: '01.09.2024',
      expectedCheckOut: '26.09.2025',
      amountReceivable: '0',
      moneyReceived: '0',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.09.2024',
      sponsor: 'Self-funded',
      remarks: 'Demo: Withdrawn — financial problem',
    },
    statusLogs: [
      {
        id: 1,
        status: 'Active',
        dateEffective: '2024-09-01',
        changedBy: 'TAN HUEY YEN',
        remarkTitle: 'New Registration',
        remarkLines: ['Intake : 2024/09'],
      },
      {
        id: 2,
        status: 'Withdrawn',
        dateEffective: '2025-09-26',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srWithdrawal',
        movementCategory: 'Withdrawal',
        remarkTitle: 'Withdrawal Approved',
        remarkLines: buildWithdrawalStatusLogRemarkLines({
          lastDateOfAttendance: '2025-09-26',
          reasonId: 6,
        }),
      },
    ],
  }),
  sampleStudent({
    studentCategory: 'International',
    basicInfo: {
      fullName: 'Elson Lai',
      chineseName: '',
      gender: 'Male',
      studentId: 'AIT2402110',
      applicationNo: 'APP202409905',
      passportNo: 'K12345678',
      passportExpiry: '20.08.2028',
      studentPassExpiryStartDate: '10/02/2025',
      studentPassExpiryEndDate: '09/02/2026',
      placeOfBirth: 'Singapore',
      dateOfBirth: '21.02.2004',
      age: '21',
      nationality: 'Singapore',
      race: 'Chinese',
      religion: 'None',
      maritalStatus: 'Single',
      disability: 'No',
      outstandingFee: 'N',
    },
    contact: {
      mobilePhone: '0167788990',
      email: 'elson.lai@student.xmum.edu.my',
      permanentAddress: '88 Orchard Road, Singapore 238874',
      mailingAddress: 'Block E-102, Student Village, XMUM Campus, Sepang',
    },
    enrollment: {
      programmeCode: 'DS',
      programme: 'Bachelor of Data Science',
      faculty: 'School of Information',
      status: 'Withdrawn',
      programmeLevel: 'Undergraduate',
      duration: '3',
      semester: '4',
      intake: '2024/02',
      academicSession: '2025/02',
      studyMode: 'Full Time',
      recruitedBy: 'Agent A',
      sourceOfRecruit: 'Education Agent SG',
      typeOfFinancialAid: 'None',
      tuitionFeeAnnual: '30000',
    },
    education: {
      qualification: 'A-Level',
      institutionName: 'Singapore International School',
      institutionLocation: 'Singapore',
      institutionType: 'Private',
      yearGraduated: '2023',
      gradeResult: 'ABB',
      subject: 'Mathematics, Physics, Economics',
      englishTestType: 'IELTS',
      englishResult: '6.5',
      englishDate: '15.01.2024',
      creditTransfer: 'No',
    },
    family: {
      name: 'Lai Chen',
      icPassport: 'K87654321',
      relationship: 'Father',
      occupation: 'Consultant',
      race: 'Chinese',
      mobilePhone: '+65 9123 4567',
      email: 'lai.chen@email.sg',
      income: 'SGD 8000/month',
      mailingAddress: '88 Orchard Road, Singapore 238874',
    },
    accommodation: {
      hostelStatus: 'Checked Out',
      roomType: 'Single',
      campus: 'Xiamen University Malaysia Campus',
      blockNo: 'C08',
      floorNo: '4',
      roomNo: '402',
      bedNo: 'A',
      checkInDate: '01.02.2024',
      expectedCheckOut: '29.09.2025',
      amountReceivable: '0',
      moneyReceived: '0',
      outstandingAmount: '0',
    },
    others: {
      registrationDate: '01.02.2024',
      sponsor: 'Self-funded',
      remarks: 'Demo: Withdrawn — personal reason',
    },
    statusLogs: [
      {
        id: 1,
        status: 'Active',
        dateEffective: '2024-02-01',
        changedBy: 'TAN HUEY YEN',
        remarkTitle: 'New Registration',
        remarkLines: ['Intake : 2024/02'],
      },
      {
        id: 2,
        status: 'Withdrawn',
        dateEffective: '2025-09-29',
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: 'menu.srWithdrawal',
        movementCategory: 'Withdrawal',
        remarkTitle: 'Withdrawal Approved',
        remarkLines: buildWithdrawalStatusLogRemarkLines({
          lastDateOfAttendance: '2025-09-29',
          reasonId: 7,
        }),
      },
    ],
  }),
]

const CATEGORY_CODE_TO_MENU_KEY = {
  PT001: 'menu.srProgrammeTransfer',
  DEF001: 'menu.srDeferment',
  WDR001: 'menu.srWithdrawal',
  RES001: 'menu.srResumption',
}

const CATEGORY_STATUS_TO_PROFILE = {
  Active: 'Active',
  Deferment: 'Deferred',
  Withdrawal: 'Withdrawn',
  Offered: 'Active',
  Unregistered: 'Inactive',
  'Defer Registration': 'Inactive',
  Completion: 'Active',
  Graduated: 'Graduated',
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

function nextStatusLogId(logs) {
  return Math.max(0, ...(logs || []).map((entry) => Number(entry.id) || 0)) + 1
}

export function applyStudentProfileFromMovement(studentId, categoryConfig, movementContext = null) {
  if (!categoryConfig || !studentId) return false
  const index = studentRecords.value.findIndex(
    (item) =>
      String(item.basicInfo?.studentId || item.studentId || '').trim() ===
      String(studentId || '').trim(),
  )
  if (index === -1) return false

  const current = studentRecords.value[index]
  const patch = {}
  let profileUpdated = false

  if (movementContext?.sourceKey === 'programme-transfer' && movementContext.item) {
    const categoryKey = CATEGORY_CODE_TO_MENU_KEY['PT001'] || 'menu.srProgrammeTransfer'
    const statusLogs = patch.statusLogs || current.statusLogs || []
    patch.statusLogs = [
      ...statusLogs,
      createEmptyStatusLogEntry({
        id: nextStatusLogId(statusLogs),
        status: current.enrollment?.status || 'Active',
        dateEffective: new Date().toISOString().slice(0, 10),
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: categoryKey,
        movementCategory: 'Programme Transfer',
        remarkTitle: 'Programme Transfer Approved',
        remarkLines: buildProgrammeTransferStatusLogRemarkLines(movementContext.item),
      }),
    ]
    profileUpdated = true
  }

  if (categoryConfig.modifyStudentStatus && categoryConfig.studentStatus) {
    const newStatus =
      CATEGORY_STATUS_TO_PROFILE[categoryConfig.studentStatus] || categoryConfig.studentStatus
    patch.enrollment = {
      ...current.enrollment,
      status: newStatus,
    }
    const categoryKey =
      CATEGORY_CODE_TO_MENU_KEY[categoryConfig.categoryCode] || ''
    const statusLogs = patch.statusLogs || current.statusLogs || []

    let remarkTitle = categoryConfig.categoryName
      ? `${categoryConfig.categoryName} Implemented`
      : 'Status Updated'
    let remarkLines = categoryConfig.categoryName
      ? [`Movement Category : ${categoryConfig.categoryName}`]
      : []

    if (movementContext?.sourceKey === 'deferment' && movementContext.item) {
      remarkTitle = 'Deferment Approved'
      remarkLines = buildDefermentStatusLogRemarkLines(current, movementContext.item)
    } else if (movementContext?.sourceKey === 'withdrawal' && movementContext.item) {
      remarkTitle = 'Withdrawal Approved'
      remarkLines = buildWithdrawalStatusLogRemarkLines(movementContext.item)
    }

    patch.statusLogs = [
      ...statusLogs,
      createEmptyStatusLogEntry({
        id: nextStatusLogId(statusLogs),
        status: newStatus,
        dateEffective: new Date().toISOString().slice(0, 10),
        changedBy: 'ADMIN SYSTEM',
        movementCategoryKey: categoryKey,
        movementCategory: categoryConfig.categoryName || '',
        remarkTitle,
        remarkLines,
      }),
    ]
    profileUpdated = true
  }

  if (categoryConfig.modifyStudentType && categoryConfig.category) {
    patch.enrollment = {
      ...(patch.enrollment || current.enrollment),
      trackCategory: categoryConfig.category,
    }
    profileUpdated = true
  }

  if (!profileUpdated) return false

  studentRecords.value[index] = normalizeStudent({ ...current, ...patch })
  return true
}
