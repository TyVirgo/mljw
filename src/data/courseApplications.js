import {
  buildCourseCreatePayload,
  createEmptyCourseForm,
  createEmptySLTData,
  demoCLOs,
  demoSLT,
  validateCourseForm,
} from './courses.js'

export const applicationStatusOptions = [
  'In Progress',
  'Approved',
  'Temporary saved',
  'Rejected',
]

export const approvalStageOptions = [
  'HoD/HoP Review',
  'Senate Review',
  'Approved',
  '--',
]

const demoDateTime = '22.02.2025 15:31'

function buildApplicationRecord(base) {
  return {
    approvalLog: [],
    clos: [],
    slt: createEmptySLTData(),
    ...base,
  }
}

export const initialCourseApplications = [
  buildApplicationRecord({
    id: 1,
    status: 'In Progress',
    approvalStage: 'HoD/HoP Review',
    courseCode: 'PHY101',
    courseName: 'ASEAN Business Essentials',
    offering: 'SOF',
    courseOwner: 'TML001',
    courseClassification: 'Compulsory',
    credit: 4,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    prerequisite: '',
    synopsis: '',
    references: '',
    applicant: 'Dr. Tan Mei Ling',
    applicationDateTime: demoDateTime,
    clos: demoCLOs.map((item) => ({ ...item })),
    slt: JSON.parse(JSON.stringify(demoSLT)),
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Dr. Tan Mei Ling',
        action: 'Submitted',
        dateTime: demoDateTime,
        comment: 'Application submitted for HoD/HoP review.',
      },
    ],
  }),
  buildApplicationRecord({
    id: 2,
    status: 'Approved',
    approvalStage: 'Approved',
    courseCode: 'PHY102',
    courseName: 'Data Science Fundamentals',
    offering: 'CASM',
    courseOwner: 'LWM002',
    courseClassification: 'Common Core',
    credit: 2,
    mediumOfInstruction: 'English',
    semesterType: 'Short',
    applicant: 'Prof. Lee Wei Ming',
    applicationDateTime: demoDateTime,
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Prof. Lee Wei Ming',
        action: 'Submitted',
        dateTime: '15.01.2025 10:20',
        comment: '',
      },
      {
        id: 2,
        stage: 'Senate Review',
        actor: 'Senate Committee',
        action: 'Approved',
        dateTime: demoDateTime,
        comment: 'Approved by Senate.',
      },
    ],
  }),
  buildApplicationRecord({
    id: 3,
    status: 'Temporary saved',
    approvalStage: '--',
    courseCode: 'CSC201',
    courseName: 'Introduction to Programming',
    offering: 'SOC',
    courseOwner: 'CSW003',
    courseClassification: 'Major Core',
    credit: 3,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Dr. Chen Shu Wen',
    applicationDateTime: demoDateTime,
  }),
  buildApplicationRecord({
    id: 4,
    status: 'Rejected',
    approvalStage: '--',
    courseCode: 'ECO301',
    courseName: 'Microeconomics',
    offering: 'SOB',
    courseOwner: 'AKR004',
    courseClassification: 'Major Elective',
    credit: 3,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Prof. Ahmad Kamal Rahman',
    applicationDateTime: demoDateTime,
    approvalLog: [
      {
        id: 1,
        stage: 'HoD/HoP Review',
        actor: 'HoD Reviewer',
        action: 'Rejected',
        dateTime: demoDateTime,
        comment: 'Insufficient CLO coverage.',
      },
    ],
  }),
  buildApplicationRecord({
    id: 5,
    status: 'In Progress',
    approvalStage: 'Senate Review',
    courseCode: 'IND401',
    courseName: 'Industrial Placement',
    offering: 'SOE',
    courseOwner: 'WYL005',
    courseClassification: 'Industrial Training',
    credit: 4,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Dr. Wong Yee Ling',
    applicationDateTime: demoDateTime,
    clos: demoCLOs.slice(0, 3).map((item) => ({ ...item })),
  }),
  buildApplicationRecord({
    id: 6,
    status: 'Temporary saved',
    approvalStage: '--',
    courseCode: 'FYP501',
    courseName: 'Final Year Project',
    offering: 'SOC',
    courseOwner: 'CSW003',
    courseClassification: 'Final Year Project',
    credit: 6,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Dr. Chen Shu Wen',
    applicationDateTime: demoDateTime,
  }),
]

let applicationSeq = initialCourseApplications.length

export function createCourseApplicationId() {
  applicationSeq += 1
  return applicationSeq
}

export function createEmptyApplication() {
  return {
    status: 'Temporary saved',
    approvalStage: '--',
    applicant: 'System Admin',
    applicationDateTime: formatApplicationDateTime(new Date()),
    ...createEmptyCourseForm(),
    clos: [],
    slt: createEmptySLTData(),
    approvalLog: [],
  }
}

export function formatApplicationDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function canEditApplication(item) {
  return item?.status === 'Temporary saved'
}

export function canSubmitApplication(item) {
  return item?.status === 'Temporary saved'
}

export function canDeleteApplication(item) {
  return item?.status === 'Temporary saved'
}

export function canViewApprovalLog(item) {
  return item?.status !== 'Temporary saved'
}

export function validateApplicationGeneralForm(form, allApplications, excludeId = null) {
  const asCourses = allApplications.map((item) => ({
    id: item.id,
    courseCode: item.courseCode,
  }))
  return validateCourseForm(form, asCourses, excludeId)
}

export function validateCloStep(clos) {
  if (!clos?.length) {
    return { clos: 'At least one CLO is required' }
  }
  return {}
}

export function buildApplicationPayload(generalForm, clos, slt, meta = {}) {
  const coursePayload = buildCourseCreatePayload(generalForm, clos, slt)
  return {
    ...coursePayload,
    status: meta.status ?? 'Temporary saved',
    approvalStage: meta.approvalStage ?? '--',
    applicant: meta.applicant ?? 'System Admin',
    applicationDateTime: meta.applicationDateTime ?? formatApplicationDateTime(new Date()),
    approvalLog: meta.approvalLog ?? [],
  }
}

export function submitApplications(items, allApplications) {
  const targetIds = new Set(items.map((item) => item.id))
  const now = formatApplicationDateTime(new Date())
  return allApplications.map((item) => {
    if (!targetIds.has(item.id) || !canSubmitApplication(item)) return item
    return {
      ...item,
      status: 'In Progress',
      approvalStage: 'HoD/HoP Review',
      approvalLog: [
        ...(item.approvalLog || []),
        {
          id: (item.approvalLog?.length || 0) + 1,
          stage: 'Submission',
          actor: item.applicant || 'System Admin',
          action: 'Submitted',
          dateTime: now,
          comment: 'Application submitted for HoD/HoP review.',
        },
      ],
    }
  })
}

export function applicationToWizardState(application) {
  if (!application) {
    return {
      form: createEmptyCourseForm(),
      clos: [],
      slt: createEmptySLTData(),
    }
  }
  return {
    form: {
      courseCode: application.courseCode || '',
      courseName: application.courseName || '',
      offering: application.offering || '',
      courseOwner: application.courseOwner || '',
      courseClassification: application.courseClassification || '',
      credit: application.credit ?? '',
      mediumOfInstruction: application.mediumOfInstruction || '',
      semesterType: application.semesterType || '',
      prerequisite: application.prerequisite || '',
      synopsis: application.synopsis || '',
      references: application.references || '',
    },
    clos: (application.clos || []).map((item) => ({ ...item })),
    slt: application.slt ? JSON.parse(JSON.stringify(application.slt)) : createEmptySLTData(),
  }
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'In Progress':
      return 'status-progress'
    case 'Approved':
      return 'status-approved'
    case 'Temporary saved':
      return 'status-draft'
    case 'Rejected':
      return 'status-rejected'
    default:
      return ''
  }
}
