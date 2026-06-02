import { initialDepartments } from './departments.js'

export const genderOptions = ['Male', 'Female']
export const categoryOptions = [
  'Full-time Lecturer',
  'China Seconded Lecturer',
  'Student Teaching Assistant',
  'Part-time Lecturer',
]
export const titleOptions = ['Prof. Dr.', 'Dr.', 'Assoc. Prof. Dr.', 'Mr.', 'Ms.']
export const academicPositionOptions = [
  'PROFESSOR',
  'SENIOR LECTURER',
  'LECTURER',
  'ASSOCIATE PROFESSOR',
  'ASSISTANT PROFESSOR',
  'PART-TIME LECTURER',
]
export const degreeOptions = [
  "Doctoral Degree/PhD",
  "Master's Degree",
  "Bachelor's Degree",
  'Foundation',
]
export const employmentStatusOptions = ['Active', 'Inactive']
export const yesNoOptions = ['Yes', 'No']
export const nationalityOptions = ['Malaysia', 'China', 'Singapore', 'Indonesia', 'Other']
export const countryOptions = ['Malaysia', 'China', 'Singapore', 'United Kingdom', 'Australia', 'Other']
export const foundationOptions = ['Degree', 'Foundation', 'Degree, Foundation', 'Postgraduate']

export const formSteps = [
  { id: 1, label: 'Basic Information' },
  { id: 2, label: 'Academic Qualifications' },
  { id: 3, label: 'Working Experience' },
  { id: 4, label: 'Continuous Professional Development (CPD)' },
]

let nextId = 7
let qualSeq = 10
let expSeq = 10
let attachSeq = 10
let cpdSeq = 10

export function createLecturerId() {
  return nextId++
}

export function createQualificationId() {
  return qualSeq++
}

export function createExperienceId() {
  return expSeq++
}

export function createAttachmentId() {
  return attachSeq++
}

export function getDepartmentOptions() {
  return initialDepartments.map((d) => d.nameEn).sort()
}

export function formatDateDisplay(value) {
  if (!value) return '--'
  const trimmed = String(value).trim()
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[2]}.${iso[3]}.${iso[1]}`
  const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slash) return `${slash[1]}.${slash[2]}.${slash[3]}`
  return trimmed
}

export function formatAttachmentSize(bytes) {
  if (!bytes) return '0kb'
  const kb = Math.round(bytes / 1024)
  return `${kb}kb`
}

export function formatUploadTimestamp(value) {
  if (!value) return '--'
  return value
}

export function createEmptyQualification() {
  return {
    id: createQualificationId(),
    name: '',
    institution: '',
    country: '',
    year: '',
    remarks: '',
    attachments: [],
  }
}

export function createEmptyExperience() {
  return {
    id: createExperienceId(),
    academicPosition: '',
    employer: '',
    startDate: '',
    endDate: '',
    educationYears: '',
    industryYears: '',
  }
}

export function createEmptyLecturerForm() {
  return {
    staffId: '',
    name: '',
    nameCn: '',
    nameMal: '',
    gender: '',
    category: '',
    department: '',
    academicQualificationHighest: '',
    title: '',
    academicPosition: '',
    degree: '',
    employmentStatus: 'Active',
    dateOfJoining: '',
    requiresEvaluation: false,
    personal: {
      dateOfBirth: '',
      nationality: '',
      mobilePhone: '',
      personalEmail: '',
      researchFocusAreas: '',
    },
    employment: {
      foundationUndergraduatePostgraduate: '',
      officeExtension: '',
      xmumEmail: '',
      currentlyTeaching: 'Yes',
    },
    attachment: null,
    remarks: '',
    qualifications: [],
    workingExperiences: [],
    cpdByYear: [],
  }
}

export function normalizeLecturer(item) {
  return {
    requiresEvaluation: false,
    nameCn: '',
    nameMal: '',
    personal: {},
    employment: { currentlyTeaching: 'Yes' },
    attachment: null,
    remarks: '',
    qualifications: [],
    workingExperiences: [],
    cpdByYear: [],
    ...item,
    personal: {
      dateOfBirth: '',
      nationality: '',
      mobilePhone: '',
      personalEmail: '',
      researchFocusAreas: '',
      ...(item.personal || {}),
    },
    employment: {
      foundationUndergraduatePostgraduate: '',
      officeExtension: '',
      xmumEmail: '',
      currentlyTeaching: 'Yes',
      ...(item.employment || {}),
    },
    qualifications: (item.qualifications || []).map((q) => ({
      id: q.id ?? createQualificationId(),
      name: q.name || '',
      institution: q.institution || '',
      country: q.country || '',
      year: q.year || '',
      remarks: q.remarks || '',
      attachments: (q.attachments || []).map((a) => ({ ...a })),
    })),
    workingExperiences: (item.workingExperiences || []).map((e) => ({
      id: e.id ?? createExperienceId(),
      academicPosition: e.academicPosition || '',
      employer: e.employer || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      educationYears: e.educationYears || '',
      industryYears: e.industryYears || '',
    })),
    cpdByYear: (item.cpdByYear || []).map((y) => ({
      year: y.year,
      activityCount: y.activityCount,
      hoursEarned: y.hoursEarned,
      expanded: y.expanded ?? true,
      activities: (y.activities || []).map((a) => ({ ...a })),
    })),
  }
}

const lohQualifications = [
  {
    id: 1,
    name: 'PhD in Animal Cell Technology',
    institution: 'Universiti Putra Malaysia',
    country: 'Malaysia',
    year: '2010',
    remarks: 'Malaysia',
    attachments: [
      {
        id: 1,
        fileName: 'Loh Yoong Keong -Scroll_v1.1.doc',
        size: 1053696,
        uploadedAt: '06.15.2020',
      },
      {
        id: 2,
        fileName: 'Loh Yoong Keong -Transcript_v1.1.doc',
        size: 1053696,
        uploadedAt: '06.15.2020',
      },
    ],
  },
]

const lohExperiences = [
  {
    id: 1,
    academicPosition: 'Associate Professor',
    employer: 'Xiamen University Malaysia',
    startDate: '01/09/2016',
    endDate: '01/12/2023',
    educationYears: '7',
    industryYears: '7',
  },
]

const lohCpd = [
  {
    year: 2025,
    activityCount: 2,
    hoursEarned: 16,
    expanded: true,
    activities: [
      {
        id: 1,
        name: '高等教育研讨会',
        provider: '厦大马来学院',
        type: '研讨会',
        category: '内部',
        deliveryMode: '线下',
        datesAttended: '11/Dec./2025',
        hoursEarned: 8,
        evidence: '会议签到结果.jpg',
      },
      {
        id: 2,
        name: '教学创新工作坊',
        provider: 'XMUM Academic Affairs',
        type: '工作坊',
        category: '内部',
        deliveryMode: '混合式',
        datesAttended: '05/Nov./2025',
        hoursEarned: 8,
        evidence: 'workshop_certificate.pdf',
      },
    ],
  },
  {
    year: 2024,
    activityCount: 1,
    hoursEarned: 6,
    expanded: true,
    activities: [
      {
        id: 3,
        name: 'International Education Conference',
        provider: 'ASEAN Education Forum',
        type: '会议',
        category: '外部',
        deliveryMode: '线下',
        datesAttended: '20/Mar./2024',
        hoursEarned: 6,
        evidence: 'conference_badge.jpg',
      },
    ],
  },
]

export const initialLecturers = [
  {
    id: 1,
    staffId: '2215014',
    name: 'Loh Yoong Keong',
    nameCn: '卢永强',
    nameMal: 'Loh Yoong Keong',
    gender: 'Male',
    category: 'Full-time Lecturer',
    department: 'School of Traditional Chinese Medicine',
    academicQualificationHighest: 'Degree, Foundation',
    title: 'Prof. Dr.',
    academicPosition: 'PROFESSOR',
    degree: "Doctoral Degree/PhD",
    employmentStatus: 'Active',
    dateOfJoining: '23/08/2019',
    requiresEvaluation: false,
    personal: {
      dateOfBirth: '04/05/1984',
      nationality: 'Malaysia',
      mobilePhone: '(60)17-2774498',
      personalEmail: '',
      researchFocusAreas: 'Immunology; molecular biology; phycology',
    },
    employment: {
      foundationUndergraduatePostgraduate: 'Degree, Foundation',
      officeExtension: '03 8800 2021',
      xmumEmail: 'ykloh@xmu.edu.my',
      currentlyTeaching: 'Yes',
    },
    attachment: {
      fileName: "Loh Yoong Keong - Academic Staff's CV_v1.1.doc",
      size: 1053696,
      uploadedAt: '06.15.2020',
    },
    remarks: 'NIL',
    qualifications: lohQualifications,
    workingExperiences: lohExperiences,
    cpdByYear: lohCpd,
  },
  {
    id: 2,
    staffId: '2215015',
    name: 'Linda Tan Poh Gaik',
    gender: 'Female',
    category: 'China Seconded Lecturer',
    department: 'China-ASEAN College of Marine Sciences',
    academicQualificationHighest: 'Degree',
    title: 'Dr.',
    academicPosition: 'SENIOR LECTURER',
    degree: "Master's Degree",
    employmentStatus: 'Active',
    dateOfJoining: '15/03/2020',
    requiresEvaluation: false,
    personal: {
      dateOfBirth: '20/11/1988',
      nationality: 'Malaysia',
      mobilePhone: '(60)12-3456789',
      personalEmail: 'linda.tan@email.com',
      researchFocusAreas: 'Marine biology',
    },
    employment: {
      foundationUndergraduatePostgraduate: 'Degree',
      officeExtension: '03 8800 3012',
      xmumEmail: 'ltan@xmu.edu.my',
      currentlyTeaching: 'Yes',
    },
    attachment: null,
    remarks: '',
    qualifications: [],
    workingExperiences: [],
    cpdByYear: [],
  },
  {
    id: 3,
    staffId: '2215016',
    name: 'Chen Wei Ming',
    gender: 'Male',
    category: 'Full-time Lecturer',
    department: 'School of Artificial Intelligence and Robotics',
    academicQualificationHighest: 'Degree',
    title: 'Assoc. Prof. Dr.',
    academicPosition: 'ASSOCIATE PROFESSOR',
    degree: "Doctoral Degree/PhD",
    employmentStatus: 'Active',
    dateOfJoining: '10/01/2018',
    requiresEvaluation: true,
    personal: {
      dateOfBirth: '12/07/1982',
      nationality: 'China',
      mobilePhone: '(60)16-9876543',
      personalEmail: '',
      researchFocusAreas: 'Machine learning; robotics',
    },
    employment: {
      foundationUndergraduatePostgraduate: 'Postgraduate',
      officeExtension: '03 8800 4100',
      xmumEmail: 'cwm@xmu.edu.my',
      currentlyTeaching: 'Yes',
    },
    attachment: null,
    remarks: '',
    qualifications: [],
    workingExperiences: [],
    cpdByYear: [],
  },
  {
    id: 4,
    staffId: '2215017',
    name: 'Sarah Lim Mei Yee',
    gender: 'Female',
    category: 'Student Teaching Assistant',
    department: 'School of Arts',
    academicQualificationHighest: 'Foundation',
    title: 'Ms.',
    academicPosition: 'LECTURER',
    degree: "Bachelor's Degree",
    employmentStatus: 'Active',
    dateOfJoining: '01/09/2023',
    requiresEvaluation: false,
    personal: {
      dateOfBirth: '28/02/2000',
      nationality: 'Malaysia',
      mobilePhone: '(60)11-2233445',
      personalEmail: 'sarah.lim@student.xmu.edu.my',
      researchFocusAreas: 'Visual arts',
    },
    employment: {
      foundationUndergraduatePostgraduate: 'Foundation',
      officeExtension: '03 8800 5200',
      xmumEmail: 'slim@xmu.edu.my',
      currentlyTeaching: 'No',
    },
    attachment: null,
    remarks: '',
    qualifications: [],
    workingExperiences: [],
    cpdByYear: [],
  },
  {
    id: 5,
    staffId: '2215018',
    name: 'Ahmad bin Hassan',
    gender: 'Male',
    category: 'Part-time Lecturer',
    department: 'College of Accounting',
    academicQualificationHighest: 'Degree',
    title: 'Mr.',
    academicPosition: 'PART-TIME LECTURER',
    degree: "Master's Degree",
    employmentStatus: 'Active',
    dateOfJoining: '01/06/2021',
    requiresEvaluation: false,
    personal: {
      dateOfBirth: '15/09/1975',
      nationality: 'Malaysia',
      mobilePhone: '(60)19-5566778',
      personalEmail: 'ahmad.h@email.com',
      researchFocusAreas: 'Accounting standards',
    },
    employment: {
      foundationUndergraduatePostgraduate: 'Degree',
      officeExtension: '03 8800 6100',
      xmumEmail: 'ahmad@xmu.edu.my',
      currentlyTeaching: 'Yes',
    },
    attachment: null,
    remarks: '',
    qualifications: [],
    workingExperiences: [],
    cpdByYear: [],
  },
  {
    id: 6,
    staffId: '2215019',
    name: 'Wong Siew Ling',
    gender: 'Female',
    category: 'Full-time Lecturer',
    department: 'Department of Clinical Medicine',
    academicQualificationHighest: 'Degree, Foundation',
    title: 'Dr.',
    academicPosition: 'LECTURER',
    degree: "Doctoral Degree/PhD",
    employmentStatus: 'Inactive',
    dateOfJoining: '20/04/2017',
    requiresEvaluation: true,
    personal: {
      dateOfBirth: '03/12/1980',
      nationality: 'Malaysia',
      mobilePhone: '(60)17-8899001',
      personalEmail: '',
      researchFocusAreas: 'Clinical medicine; public health',
    },
    employment: {
      foundationUndergraduatePostgraduate: 'Degree, Foundation',
      officeExtension: '03 8800 7200',
      xmumEmail: 'wsl@xmu.edu.my',
      currentlyTeaching: 'No',
    },
    attachment: null,
    remarks: 'On sabbatical leave',
    qualifications: [],
    workingExperiences: [],
    cpdByYear: [],
  },
].map(normalizeLecturer)

export function getLecturerFormData(lecturer) {
  if (!lecturer) return createEmptyLecturerForm()
  return {
    staffId: lecturer.staffId,
    name: lecturer.name,
    nameCn: lecturer.nameCn || '',
    nameMal: lecturer.nameMal || '',
    gender: lecturer.gender,
    category: lecturer.category,
    department: lecturer.department,
    academicQualificationHighest: lecturer.academicQualificationHighest,
    title: lecturer.title,
    academicPosition: lecturer.academicPosition,
    degree: lecturer.degree,
    employmentStatus: lecturer.employmentStatus,
    dateOfJoining: lecturer.dateOfJoining,
    requiresEvaluation: lecturer.requiresEvaluation,
    personal: { ...lecturer.personal },
    employment: { ...lecturer.employment },
    attachment: lecturer.attachment ? { ...lecturer.attachment } : null,
    remarks: lecturer.remarks || '',
    qualifications: lecturer.qualifications.map((q) => ({
      ...q,
      attachments: (q.attachments || []).map((a) => ({ ...a })),
    })),
    workingExperiences: lecturer.workingExperiences.map((e) => ({ ...e })),
    cpdByYear: lecturer.cpdByYear.map((y) => ({
      ...y,
      activities: (y.activities || []).map((a) => ({ ...a })),
    })),
  }
}
