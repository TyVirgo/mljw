import { initialDepartments } from './departments.js'
import { semesterTypeOptions } from './semesterInfo.js'

export const COURSE_CODE_PATTERN = /^[A-Za-z0-9]+$/
export const MAX_COURSE_NAME_LENGTH = 200

export const courseClassificationOptions = [
  'Compulsory',
  'Common Core',
  'Major Core',
  'Major Elective',
  'Industrial Training',
  'Final Year Project',
]

export const mediumOfInstructionOptions = ['English', 'Chinese', 'Bilingual']

export const extraOfferingOptions = [
  { code: 'CASM', nameEn: 'China-ASEAN College of Marine Sciences' },
  { code: 'SOC', nameEn: 'School of Computing' },
  { code: 'SOB', nameEn: 'School of Business' },
  { code: 'SOE', nameEn: 'School of Engineering' },
]

export const courseOwnerOptions = [
  { id: 'TML001', name: 'Dr. Tan Mei Ling' },
  { id: 'LWM002', name: 'Prof. Lee Wei Ming' },
  { id: 'CSW003', name: 'Dr. Chen Shu Wen' },
  { id: 'AKR004', name: 'Prof. Ahmad Kamal Rahman' },
  { id: 'WYL005', name: 'Dr. Wong Yee Ling' },
]

export function getOfferingOptions(departments = initialDepartments) {
  const fromDepartments = departments
    .filter((item) => item.offering === 'Yes')
    .map((item) => ({ code: item.code, nameEn: item.nameEn }))

  const codes = new Set(fromDepartments.map((item) => item.code))
  const merged = [...fromDepartments]
  extraOfferingOptions.forEach((item) => {
    if (!codes.has(item.code)) merged.push(item)
  })
  return merged.sort((a, b) => a.nameEn.localeCompare(b.nameEn))
}

export function getOfferingLabel(code, departments = initialDepartments) {
  if (!code) return '--'
  const option = getOfferingOptions(departments).find((item) => item.code === code)
  return option?.nameEn || code
}

export function getCourseOwnerLabel(ownerId) {
  if (!ownerId) return '--'
  const owner = courseOwnerOptions.find((item) => item.id === ownerId)
  return owner?.name || ownerId
}

export const initialCourses = [
  {
    id: 1,
    courseCode: 'PHY101',
    courseName: 'ASEAN Business Essentials',
    offering: 'SOF',
    courseOwner: 'TML001',
    courseClassification: 'Compulsory',
    credit: 4,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
  },
  {
    id: 2,
    courseCode: 'PHY102',
    courseName: 'Data Science Fundamentals',
    offering: 'CASM',
    courseOwner: 'LWM002',
    courseClassification: 'Common Core',
    credit: 2,
    mediumOfInstruction: 'English',
    semesterType: 'Short',
  },
  {
    id: 3,
    courseCode: 'CSC201',
    courseName: 'Introduction to Programming',
    offering: 'SOC',
    courseOwner: 'CSW003',
    courseClassification: 'Major Core',
    credit: 3,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
  },
  {
    id: 4,
    courseCode: 'ECO301',
    courseName: 'Microeconomics',
    offering: 'SOB',
    courseOwner: 'AKR004',
    courseClassification: 'Major Elective',
    credit: 3,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
  },
  {
    id: 5,
    courseCode: 'IND401',
    courseName: 'Industrial Placement',
    offering: 'SOE',
    courseOwner: 'WYL005',
    courseClassification: 'Industrial Training',
    credit: 4,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
  },
  {
    id: 6,
    courseCode: 'FYP501',
    courseName: 'Final Year Project',
    offering: 'SOC',
    courseOwner: 'CSW003',
    courseClassification: 'Final Year Project',
    credit: 6,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
  },
]

let nextCourseId = initialCourses.length + 1

export function createCourseId() {
  return nextCourseId++
}

export function createEmptyCourseForm() {
  return {
    courseCode: '',
    courseName: '',
    offering: '',
    courseOwner: '',
    courseClassification: '',
    credit: '',
    mediumOfInstruction: '',
    semesterType: '',
  }
}

export function validateCourseForm(form, allCourses, excludeId = null) {
  const errors = {}
  const courseCode = form.courseCode?.trim() || ''
  const courseName = form.courseName?.trim() || ''

  if (!courseCode) {
    errors.courseCode = 'Course Code is required'
  } else if (!COURSE_CODE_PATTERN.test(courseCode)) {
    errors.courseCode = 'Course Code must contain letters and numbers only'
  } else {
    const duplicate = allCourses.some(
      (item) =>
        item.courseCode.toLowerCase() === courseCode.toLowerCase() &&
        (excludeId == null || item.id !== excludeId),
    )
    if (duplicate) errors.courseCode = 'Course Code already exists'
  }

  if (!courseName) {
    errors.courseName = 'Course Name is required'
  } else if (courseName.length > MAX_COURSE_NAME_LENGTH) {
    errors.courseName = `Course Name must be within ${MAX_COURSE_NAME_LENGTH} characters`
  }

  if (!form.offering) errors.offering = 'Offering Unit is required'

  if (!form.courseOwner) errors.courseOwner = 'Course Owner is required'

  if (!form.courseClassification) {
    errors.courseClassification = 'Course Classification is required'
  } else if (!courseClassificationOptions.includes(form.courseClassification)) {
    errors.courseClassification = 'Course Classification is invalid'
  }

  const creditText = String(form.credit ?? '').trim()
  if (!creditText) {
    errors.credit = 'Credit is required'
  } else if (!/^\d+$/.test(creditText) || Number(creditText) <= 0) {
    errors.credit = 'Credit must be a positive integer'
  }

  if (!form.mediumOfInstruction) {
    errors.mediumOfInstruction = 'Medium of Instruction is required'
  } else if (!mediumOfInstructionOptions.includes(form.mediumOfInstruction)) {
    errors.mediumOfInstruction = 'Medium of Instruction is invalid'
  }

  if (!form.semesterType) {
    errors.semesterType = 'Semester Type is required'
  } else if (!semesterTypeOptions.includes(form.semesterType)) {
    errors.semesterType = 'Semester Type is invalid'
  }

  return errors
}

export function buildCoursePayload(form) {
  return {
    courseCode: form.courseCode.trim(),
    courseName: form.courseName.trim(),
    offering: form.offering,
    courseOwner: form.courseOwner,
    courseClassification: form.courseClassification,
    credit: Number(String(form.credit).trim()),
    mediumOfInstruction: form.mediumOfInstruction,
    semesterType: form.semesterType,
  }
}

export function generateCopyCourseCode(baseCode, allCourses) {
  const codes = new Set(allCourses.map((item) => item.courseCode.toLowerCase()))
  let suffix = 1
  let candidate = `${baseCode}-C${suffix}`
  while (codes.has(candidate.toLowerCase())) {
    suffix += 1
    candidate = `${baseCode}-C${suffix}`
  }
  return candidate
}
