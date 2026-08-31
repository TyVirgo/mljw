import {
  buildCourseChangeLogs,
  buildCourseCreatePayload,
  createEmptyCourseForm,
  createEmptySLTData,
  demoCLOs,
  demoSLT,
  enrichCourseForDetail,
  validateCourseForm,
} from './courses.js'
import {
  applicationStatusOptions,
  approvalStageOptions,
  formatApplicationDateTime,
  statusBadgeClass,
  validateCloStep,
} from './courseApplications.js'

export { applicationStatusOptions, approvalStageOptions, statusBadgeClass, formatApplicationDateTime }

export const courseChangeSteps = [
  { id: 1, title: 'Change Description' },
  { id: 2, title: 'Basic Information' },
  { id: 3, title: 'Course Learning Outcome (CLO)' },
  { id: 4, title: 'Student Learning Time (SLT)' },
]

export const changeDescriptionComponents = {
  main: [
    {
      key: 'courseName',
      label: 'Course Name',
      majorCriteria: ['Change course name to reflect the change in course content.'],
      minorCriteria: ['Improve the grammar of the course name.'],
      noneCriteria: ['No change.'],
    },
    {
      key: 'credit',
      label: 'Credit Value',
      majorCriteria: ['Add or reduce the credit value of the course.'],
      minorCriteria: ['Change credit value to meet MQA/EAC standards.'],
      noneCriteria: ['No change.'],
    },
    {
      key: 'courseClassification',
      label: 'Course Classification',
      majorCriteria: ['Change course classification, e.g. from major to elective.'],
      minorCriteria: ['Change course classification to meet MQA/EAC standards.'],
      noneCriteria: ['No change.'],
    },
    {
      key: 'clo',
      label: 'CLO',
      majorCriteria: ['Add or remove CLOs.'],
      minorCriteria: [
        'Improve the grammar of the CLOs.',
        'Rearrange the sequence of the CLOs.',
        'Combine the CLOs.',
      ],
      noneCriteria: ['No change.'],
    },
  ],
  other: [
    {
      key: 'synopsis',
      label: 'Synopsis',
      majorCriteria: ['Revise the synopsis to reflect the change in course content.'],
      minorCriteria: ['Rephrase the synopsis.', 'Improve the grammar of the synopsis.'],
      noneCriteria: ['No change.'],
    },
    {
      key: 'prerequisite',
      label: 'Pre-requisite / co-requisite',
      majorCriteria: ['Add, remove, or revise the pre-requisite / co-requisite of the course.'],
      minorCriteria: [],
      noneCriteria: ['No change.'],
    },
    {
      key: 'teachingMethods',
      label: 'Teaching Methods',
      majorCriteria: [
        'Add or reduce the number of lectures (L), tutorials (T), practical (P).',
        'Revise the teaching strategy, e.g. from classroom delivery (CD) to podcast.',
      ],
      minorCriteria: [],
      noneCriteria: ['No change.'],
    },
    {
      key: 'courseContent',
      label: 'Course Content',
      majorCriteria: ['Add or reduce topic in the course content.'],
      minorCriteria: [
        'Rearrange the topics.',
        'Update the topics.',
        'Add or reduce subtopics in the topics.',
      ],
      noneCriteria: ['No change.'],
    },
    {
      key: 'assessmentMethods',
      label: 'Assessment Methods',
      majorCriteria: ['Change the percentage of continuous assessment and final assessment.'],
      minorCriteria: [
        'Revise the coursework components, e.g. test, assignment, etc.',
        'Revise the exam hours.',
      ],
      noneCriteria: ['No change.'],
    },
    {
      key: 'references',
      label: 'References',
      majorCriteria: ['Add or reduce the main or additional references.'],
      minorCriteria: [
        'Update the publication year or edition of the references.',
        'Revise the referencing system, e.g. from MLA to APA.',
      ],
      noneCriteria: ['No change.'],
    },
  ],
}

export const changeDescriptionLevels = ['major', 'minor', 'none']

export function createEmptyChangeDescription() {
  return {
    courseName: 'none',
    credit: 'none',
    courseClassification: 'none',
    clo: 'none',
    synopsis: 'none',
    prerequisite: 'none',
    teachingMethods: 'none',
    courseContent: 'none',
    assessmentMethods: 'none',
    references: 'none',
  }
}

const demoDateTime = '22.02.2025 15:31'

function buildChangeRecord(base) {
  return {
    changeDescription: createEmptyChangeDescription(),
    baselineSnapshot: null,
    baselineLocked: false,
    approvalLog: [],
    clos: [],
    slt: createEmptySLTData(),
    ...base,
  }
}

export const initialCourseChangeApplications = [
  buildChangeRecord({
    id: 1,
    status: 'In Progress',
    approvalStage: 'HoD/HoP Review',
    sourceCourseId: 1,
    sourceCourseCode: 'PHY101',
    courseCode: 'PHY101',
    courseName: 'ASEAN Business Essentials',
    offering: 'STCM',
    affiliatedProgramme: 'IBU',
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
    changeDescription: {
      ...createEmptyChangeDescription(),
      courseClassification: 'major',
      clo: 'major',
    },
    clos: demoCLOs.map((item) => ({ ...item })),
    slt: JSON.parse(JSON.stringify(demoSLT)),
    baselineLocked: true,
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Dr. Tan Mei Ling',
        action: 'Submitted',
        dateTime: demoDateTime,
        comment: 'Change application submitted for HoD/HoP review.',
      },
    ],
  }),
  buildChangeRecord({
    id: 2,
    status: 'Approved',
    approvalStage: 'Approved',
    sourceCourseId: 2,
    sourceCourseCode: 'PHY102',
    courseCode: 'PHY102',
    courseName: 'Data Science Fundamentals',
    offering: 'CASM',
    affiliatedProgramme: 'CSN',
    courseOwner: 'LWM002',
    courseClassification: 'Common Core',
    credit: 2,
    mediumOfInstruction: 'English',
    semesterType: 'Short',
    applicant: 'Prof. Lee Wei Ming',
    applicationDateTime: demoDateTime,
    baselineLocked: true,
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
  buildChangeRecord({
    id: 3,
    status: 'Temporary saved',
    approvalStage: '--',
    sourceCourseId: 3,
    sourceCourseCode: 'CSC201',
    courseCode: 'CSC201',
    courseName: 'Introduction to Programming',
    offering: 'SOC',
    affiliatedProgramme: 'SWE',
    courseOwner: 'CSW003',
    courseClassification: 'Major Core',
    credit: 3,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Dr. Chen Shu Wen',
    applicationDateTime: demoDateTime,
    baselineLocked: true,
  }),
  buildChangeRecord({
    id: 4,
    status: 'Rejected',
    approvalStage: '--',
    sourceCourseId: 4,
    sourceCourseCode: 'ECO301',
    courseCode: 'ECO301',
    courseName: 'Microeconomics',
    offering: 'SOB',
    affiliatedProgramme: 'IBU',
    courseOwner: 'AKR004',
    courseClassification: 'Major Elective',
    credit: 3,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Prof. Ahmad Kamal Rahman',
    applicationDateTime: demoDateTime,
    baselineLocked: true,
    approvalLog: [
      {
        id: 1,
        stage: 'HoD/HoP Review',
        actor: 'HoD Reviewer',
        action: 'Rejected',
        dateTime: demoDateTime,
        comment: 'Insufficient justification for major CLO changes.',
      },
    ],
  }),
  buildChangeRecord({
    id: 5,
    status: 'In Progress',
    approvalStage: 'Senate Review',
    sourceCourseId: 5,
    sourceCourseCode: 'IND401',
    courseCode: 'IND401',
    courseName: 'Industrial Placement',
    offering: 'SOE',
    affiliatedProgramme: 'SWE',
    courseOwner: 'WYL005',
    courseClassification: 'Industrial Training',
    credit: 4,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Dr. Wong Yee Ling',
    applicationDateTime: demoDateTime,
    changeDescription: {
      ...createEmptyChangeDescription(),
      teachingMethods: 'major',
      courseContent: 'major',
    },
    clos: demoCLOs.slice(0, 3).map((item) => ({ ...item })),
    baselineLocked: true,
    approvalLog: [
      {
        id: 1,
        stage: 'Submission',
        actor: 'Dr. Wong Yee Ling',
        action: 'Submitted',
        dateTime: demoDateTime,
        comment: '',
      },
    ],
  }),
  buildChangeRecord({
    id: 6,
    status: 'Temporary saved',
    approvalStage: '--',
    sourceCourseId: 6,
    sourceCourseCode: 'FYP501',
    courseCode: 'FYP501',
    courseName: 'Final Year Project',
    offering: 'SOC',
    affiliatedProgramme: 'CSN',
    courseOwner: 'CSW003',
    courseClassification: 'Final Year Project',
    credit: 6,
    mediumOfInstruction: 'English',
    semesterType: 'Long',
    applicant: 'Dr. Chen Shu Wen',
    applicationDateTime: demoDateTime,
    baselineLocked: true,
  }),
]

let changeApplicationSeq = initialCourseChangeApplications.length

export function createCourseChangeApplicationId() {
  changeApplicationSeq += 1
  return changeApplicationSeq
}

export function canEditChangeApplication(item) {
  return item?.status === 'Temporary saved'
}

export function canSubmitChangeApplication(item) {
  return item?.status === 'Temporary saved'
}

export function canDeleteChangeApplication(item) {
  return item?.status === 'Temporary saved'
}

export function canWithdrawChangeApplication(item) {
  return item?.status === 'In Progress'
}

export function canViewChangeApprovalLog(item) {
  return item?.status !== 'Temporary saved'
}

export function loadBaselineFromCourse(course) {
  const enriched = enrichCourseForDetail(course)
  const references =
    enriched.references ||
    [enriched.requiredReferences, enriched.furtherReadings].filter(Boolean).join('\n\n')

  const form = {
    courseCode: enriched.courseCode || '',
    courseName: enriched.courseName || '',
    courseOwner: enriched.courseOwner || '',
    affiliatedProgramme: enriched.affiliatedProgramme || '',
    offering: enriched.offering || '',
    courseClassification: enriched.courseClassification || '',
    credit: enriched.credit ?? '',
    mediumOfInstruction: enriched.mediumOfInstruction || '',
    semesterType: enriched.semesterType || '',
    prerequisite: enriched.prerequisite || '',
    synopsis: enriched.synopsis || '',
    references,
  }

  return {
    sourceCourseId: enriched.id,
    sourceCourseCode: enriched.courseCode,
    form,
    clos: (enriched.clos || []).map((item) => ({ ...item })),
    slt: enriched.slt ? JSON.parse(JSON.stringify(enriched.slt)) : createEmptySLTData(),
    baselineSnapshot: JSON.parse(JSON.stringify({ ...enriched, references })),
  }
}

export function changeApplicationToWizardState(application) {
  if (!application) {
    return {
      sourceCourseId: null,
      sourceCourseCode: '',
      form: createEmptyCourseForm(),
      changeDescription: createEmptyChangeDescription(),
      clos: [],
      slt: createEmptySLTData(),
      baselineSnapshot: null,
      baselineLocked: false,
    }
  }
  return {
    sourceCourseId: application.sourceCourseId ?? null,
    sourceCourseCode: application.sourceCourseCode || '',
    form: {
      courseCode: application.courseCode || '',
      courseName: application.courseName || '',
      courseOwner: application.courseOwner || '',
      affiliatedProgramme: application.affiliatedProgramme || '',
      offering: application.offering || '',
      courseClassification: application.courseClassification || '',
      credit: application.credit ?? '',
      mediumOfInstruction: application.mediumOfInstruction || '',
      semesterType: application.semesterType || '',
      prerequisite: application.prerequisite || '',
      synopsis: application.synopsis || '',
      references: application.references || '',
    },
    changeDescription: { ...createEmptyChangeDescription(), ...(application.changeDescription || {}) },
    clos: (application.clos || []).map((item) => ({ ...item })),
    slt: application.slt ? JSON.parse(JSON.stringify(application.slt)) : createEmptySLTData(),
    baselineSnapshot: application.baselineSnapshot
      ? JSON.parse(JSON.stringify(application.baselineSnapshot))
      : null,
    baselineLocked: !!application.baselineLocked,
  }
}

export function validateChangeDescriptionStep(sourceCourseId, changeDescription) {
  const errors = {}
  if (!sourceCourseId) {
    errors.baseline = 'Please select a baseline course'
  }
  const allKeys = [...changeDescriptionComponents.main, ...changeDescriptionComponents.other].map((c) => c.key)
  for (const key of allKeys) {
    if (!changeDescriptionLevels.includes(changeDescription?.[key])) {
      errors.changeDescription = 'Please complete all change description selections'
      break
    }
  }
  return errors
}

export function validateChangeGeneralForm(form, baselineSnapshot, allCourses) {
  const errors = validateCourseForm(form, allCourses, baselineSnapshot?.id ?? null)
  if (baselineSnapshot?.courseCode && form.courseCode?.trim() !== baselineSnapshot.courseCode) {
    errors.courseCode = 'Course Code cannot be changed for a change application'
  }
  return errors
}

export function validateChangeCloStep(clos) {
  return validateCloStep(clos)
}

export function buildChangeApplicationPayload({
  form,
  clos,
  slt,
  changeDescription,
  sourceCourseId,
  sourceCourseCode,
  baselineSnapshot,
  baselineLocked,
  meta = {},
}) {
  const coursePayload = buildCourseCreatePayload(form, clos, slt)
  return {
    ...coursePayload,
    sourceCourseId,
    sourceCourseCode,
    changeDescription: { ...changeDescription },
    baselineSnapshot: baselineSnapshot ? JSON.parse(JSON.stringify(baselineSnapshot)) : null,
    baselineLocked,
    status: meta.status ?? 'Temporary saved',
    approvalStage: meta.approvalStage ?? '--',
    applicant: meta.applicant ?? 'System Admin',
    applicationDateTime: meta.applicationDateTime ?? formatApplicationDateTime(new Date()),
    approvalLog: meta.approvalLog ?? [],
  }
}

export function submitChangeApplications(items, allApplications) {
  const targetIds = new Set(items.map((item) => item.id))
  const now = formatApplicationDateTime(new Date())
  return allApplications.map((item) => {
    if (!targetIds.has(item.id) || !canSubmitChangeApplication(item)) return item
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
          comment: 'Change application submitted for HoD/HoP review.',
        },
      ],
    }
  })
}

export function withdrawChangeApplications(items, allApplications) {
  const targetIds = new Set(items.map((item) => item.id))
  const now = formatApplicationDateTime(new Date())
  return allApplications.map((item) => {
    if (!targetIds.has(item.id) || !canWithdrawChangeApplication(item)) return item
    return {
      ...item,
      status: 'Temporary saved',
      approvalStage: '--',
      approvalLog: [
        ...(item.approvalLog || []),
        {
          id: (item.approvalLog?.length || 0) + 1,
          stage: item.approvalStage || 'In Progress',
          actor: item.applicant || 'System Admin',
          action: 'Withdrawn',
          dateTime: now,
          comment: 'Application withdrawn to draft.',
        },
      ],
    }
  })
}

/** Called by Course Change Review on final Approved (not from Application UI in v1). */
export function applyApprovedChangeToCourse(changeApp, courses) {
  const index = courses.findIndex((c) => c.id === changeApp.sourceCourseId)
  if (index === -1) return courses

  const before = enrichCourseForDetail(courses[index])
  const afterPayload = buildCourseCreatePayload(
    {
      courseCode: changeApp.courseCode,
      courseName: changeApp.courseName,
      courseOwner: changeApp.courseOwner,
      affiliatedProgramme: changeApp.affiliatedProgramme,
      offering: changeApp.offering,
      courseClassification: changeApp.courseClassification,
      credit: changeApp.credit,
      mediumOfInstruction: changeApp.mediumOfInstruction,
      semesterType: changeApp.semesterType,
      prerequisite: changeApp.prerequisite,
      synopsis: changeApp.synopsis,
      references: changeApp.references,
    },
    changeApp.clos || [],
    changeApp.slt || createEmptySLTData(),
  )

  const newLogs = buildCourseChangeLogs(before, afterPayload)
  const updatedCourse = {
    ...before,
    ...afterPayload,
    changeRecords: [...(before.changeRecords || []), ...newLogs],
  }

  const nextCourses = courses.map((c, i) => (i === index ? updatedCourse : c))
  return {
    courses: nextCourses,
    changeApp: {
      ...changeApp,
      status: 'Approved',
      approvalStage: 'Approved',
    },
  }
}
