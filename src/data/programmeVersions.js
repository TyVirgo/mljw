export const programmeLevelOptions = [
  'L3-Foundation',
  'L4-Diploma',
  'L5-Associate',
  'L6-Bachelor',
  'L7-Master',
  'L8-Doctorate',
]

export const levelOfStudyOptions = ['Undergraduate', 'Postgraduate', 'Foundation']
export const fieldOfStudyOptions = ['Business', 'Engineering', 'Information Technology', 'Medicine', 'Arts']
export const typeOfProgrammeOptions = ['Full-time', 'Part-time', 'Dual Degree']
export const modeOfStudyOptions = ['On-campus', 'Online', 'Hybrid']
export const methodOfDeliveryOptions = ['Lecture', 'Blended', 'Workshop']
export const modeOfOfferOptions = ['Conventional', 'ODL']
export const awardingBodyOptions = ['XMUM', 'Partner University']
export const mediumOfInstructionOptions = ['English', 'Chinese', 'Bilingual']
export const methodOfLearningOptions = ['Coursework', 'Research', 'Mixed Mode']
export const advertisementCodeOptions = ['ADV-001', 'ADV-002', 'ADV-003']
export const accStatusOptions = ['PA', 'FA']
export const typeOfApprovalOptions = ['PA', 'FA', 'New Programme']

export const FEE_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/
export const FEE_AMOUNT_VALIDATION_MESSAGE = 'must be numeric with at most 2 decimal places'

export const localFeeColumns = [
  { key: 'tuitionFee', label: 'Tuition Fee' },
  { key: 'applicationFee', label: 'Application Fee (Non-Refundable)' },
  { key: 'registrationFee', label: 'Registration Fee (Non-Refundable)' },
  { key: 'tuitionDeposit', label: 'Tuition Deposit (Refundable)' },
  { key: 'resourcesFacilities', label: 'Resources/ Facilities' },
  { key: 'others', label: 'Others' },
  { key: 'totalPerProgramme', label: 'Total per programme' },
  { key: 'jumlahYuran', label: 'Jumlah Yuran Sepanjang Tempoh (Approval Letter)' },
]

export const internationalFeeColumns = [
  ...localFeeColumns.slice(0, 6),
  { key: 'pentadbiranPelajarAntarabangsa', label: 'Pentadbiran Pelajar Antarabangsa' },
  ...localFeeColumns.slice(6),
]

export function createEmptyFeeRow() {
  return {
    tuitionFee: '',
    applicationFee: '',
    registrationFee: '',
    tuitionDeposit: '',
    resourcesFacilities: '',
    others: '',
    pentadbiranPelajarAntarabangsa: '',
    totalPerProgramme: '',
    jumlahYuran: '',
    checkTotal: false,
  }
}

export const createFormSteps = [
  { id: 1, title: 'Programme Info' },
  { id: 2, title: 'Approval Details' },
  { id: 3, title: 'Entry Requirements' },
  { id: 4, title: 'Threshold Marks' },
  { id: 5, title: 'Fee Structure' },
]

export const createVersionFormSteps = [
  { id: 1, title: 'Approval Details' },
  { id: 2, title: 'Entry Requirements' },
  { id: 3, title: 'Threshold Marks' },
  { id: 4, title: 'Fee Structure' },
]

export function getDepartmentOptions() {
  return organisationTree.flatMap((node) => node.children || [])
}

export function getDepartmentLabel(departmentId) {
  if (!departmentId) return '--'
  const dept = getDepartmentOptions().find((item) => item.id === departmentId)
  return dept?.label || departmentId
}

const demoUpdaterPool = [
  { updatedBy: '林萌萌', employeeId: 'XDML12345', department: '教务部-教学运行管理科' },
  { updatedBy: '陈佳怡', employeeId: 'XDML23456', department: '教务部-教学运行管理科' },
  { updatedBy: '王大明', employeeId: 'XDML34567', department: '商学院-教学办' },
  { updatedBy: '李思远', employeeId: 'XDML45678', department: '信息学院-教务科' },
]

function defaultEntryRequirements() {
  return {
    muet: '5.0 —— 5.0',
    toeflIbt: '40',
    pearsonTestOfEnglish: '47',
    cambridgeEnglishIii: '200',
    elts: 'Band 3.5',
    toeflEssentials: '7.5',
    cambridgeEnglishIi: '107',
    els: '154',
  }
}

function defaultThresholdMarks() {
  return {
    totalContinuousAssessment: '40%',
    totalFinalAssessment: '40%',
    overallScore: '55%',
  }
}

function defaultFeeStructure(localCheckTotal = false, internationalCheckTotal = true) {
  return {
    durationMinYear: '1',
    typeOfApproval: 'Approval',
    localStudent: {
      tuitionFee: '16,000',
      applicationFee: '100',
      registrationFee: '200',
      tuitionDeposit: '1,000',
      resourcesFacilities: '--',
      others: '--',
      pentadbiranPelajarAntarabangsa: '',
      totalPerProgramme: '17,300',
      jumlahYuran: '16,300',
      checkTotal: localCheckTotal,
    },
    internationalStudent: {
      tuitionFee: '18,500',
      applicationFee: '100',
      registrationFee: '200',
      tuitionDeposit: '1,000',
      resourcesFacilities: '--',
      others: '--',
      pentadbiranPelajarAntarabangsa: '--',
      totalPerProgramme: '19,800',
      jumlahYuran: '18,800',
      checkTotal: internationalCheckTotal,
    },
  }
}

function buildApprovalSummary(approval) {
  return {
    mqaCode: approval.mqaCode,
    mqaValidityStart: approval.mqaStartDate,
    mqaValidityExpiry: approval.mqaExpiryDate || '--',
    moheCode: approval.moheCode,
    approvalDate: approval.moheApprovalDate,
    moheValidityStart: approval.moheStartDate,
    moheValidityExpiry: approval.moheExpiryDate,
  }
}

function buildProgrammeFormData(programme, approvalOverrides = {}, infoOverrides = {}) {
  const form = createEmptyProgrammeForm()
  const templates = {
    IBU: {
      programmeInfo: {
        programmeName: 'Bachelor of Management in International Business (Honours)',
        programmeNameEn: 'Bachelor of Management in International Business (Honours)',
        programmeNameMal: 'Sarjana Muda Pengurusan dalam Perniagaan Antarabangsa (Kepujian)',
        programmeCode: 'IBU00012',
        idCode: 'SR213e4',
        studyDurationChinese: '4',
        levelOfStudy: 'Undergraduate',
        fieldOfStudy: 'Business',
        methodOfLearning: 'Coursework',
        mediumOfInstruction: 'English',
        awardingBody: 'XMUM',
        progCommence: '22.02.2016',
        accStatus: 'FA',
        nec: '0414',
        years: '3',
        level: 'L6-Bachelor',
        typeOfProgramme: 'Full-time',
        modeOfStudy: 'On-campus',
        methodOfDelivery: 'Lecture',
        modeOfOffer: 'Conventional',
        department: 'sob',
        advertisementCode: 'ADV-001',
        longSemesterWeeks: '18',
        longSemesterCount: '6',
        shortSemesterWeeks: '6',
        shortSemesterCount: '3',
        industrialTrainingWeeks: '--',
        industrialTrainingCount: '--',
      },
      approvalDetails: {
        mqaCode: 'MQA/FA5302',
        mqaExpiryDate: '18.08.2030',
        mqaSyorReferencePa: 'MQA.600-2/1/6 Jld.17 (25)',
        mqaSyorReferenceFa: 'MQA.600-4/1/1 Jld.193 (14)',
        mqaStartDate: '17.05.2018',
        mqaSyorDatePa: '09.01.2015',
        mqaSyorDateFa: '28.12.2018',
        mqaFirstIntakeDuration: '2',
        moheCode: 'N/345/6/0756',
        moheApprovalDate: '26.05.2015',
        moheExpiryDate: '04.05.2020',
        moheApprovalReferenceNo: 'JPT/BPP(U)1000-801/131/e24/06445',
        moheStartDate: '05.05.2015',
      },
    },
  }

  const template = templates[programme.code] || {
    programmeInfo: {
      programmeName: programme.name,
      programmeNameEn: programme.name,
      programmeNameMal: programme.name,
      programmeCode: `${programme.code}00001`,
      idCode: `SR${programme.id}00`,
      studyDurationChinese: String(programme.years + 1),
      levelOfStudy: 'Undergraduate',
      fieldOfStudy: programme.schoolId === 'soi' ? 'Information Technology' : 'Business',
      methodOfLearning: 'Coursework',
      mediumOfInstruction: 'English',
      awardingBody: 'XMUM',
      progCommence: '01.09.2018',
      accStatus: 'FA',
      nec: '0414',
      years: String(programme.years),
      level: programme.level,
      typeOfProgramme: 'Full-time',
      modeOfStudy: 'On-campus',
      methodOfDelivery: 'Lecture',
      modeOfOffer: 'Conventional',
      department: programme.schoolId,
      advertisementCode: 'ADV-001',
      longSemesterWeeks: '18',
      longSemesterCount: '6',
      shortSemesterWeeks: '6',
      shortSemesterCount: '3',
      industrialTrainingWeeks: '12',
      industrialTrainingCount: '1',
    },
    approvalDetails: {
      mqaCode: 'MQA/FA0000',
      mqaExpiryDate: '31.12.2025',
      mqaSyorReferencePa: 'MQA.600-2/1/6 Jld.10 (12)',
      mqaSyorReferenceFa: 'MQA.600-4/1/1 Jld.100 (8)',
      mqaStartDate: '01.01.2020',
      mqaSyorDatePa: '01.06.2019',
      mqaSyorDateFa: '01.12.2019',
      mqaFirstIntakeDuration: '3',
      moheCode: 'N/000/6/0000',
      moheApprovalDate: '01.01.2020',
      moheExpiryDate: '31.12.2024',
      moheApprovalReferenceNo: 'JPT/BPP(U)1000-801/131/e24/00001',
      moheStartDate: '01.01.2020',
    },
  }

  Object.assign(form.programmeInfo, template.programmeInfo, infoOverrides)
  Object.assign(form.approvalDetails, template.approvalDetails, approvalOverrides)
  form.entryRequirements = defaultEntryRequirements()
  form.thresholdMarks = defaultThresholdMarks()
  form.feeStructure = defaultFeeStructure()
  return form
}

export function buildVersionRecord(programme, config) {
  const formData = config.formData || buildProgrammeFormData(programme, config.approvalOverrides, config.infoOverrides)
  const updater = demoUpdaterPool[config.updaterIndex ?? 0] || demoUpdaterPool[0]
  return {
    id: config.id,
    isCurrent: config.isCurrent ?? false,
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy || updater.updatedBy,
    employeeId: config.employeeId || updater.employeeId,
    department: config.department || updater.department,
    formData,
    ...buildApprovalSummary(formData.approvalDetails),
  }
}

export function buildVersionFromSave(formData, meta = {}) {
  const updater = demoUpdaterPool[0]
  return {
    id: meta.id || createVersionId(),
    isCurrent: meta.isCurrent ?? true,
    updatedAt: meta.updatedAt || formatUploadTimestamp(new Date()) + ':00',
    updatedBy: meta.updatedBy || updater.updatedBy,
    employeeId: meta.employeeId || updater.employeeId,
    department: meta.department || updater.department,
    formData: JSON.parse(JSON.stringify(formData)),
    ...buildApprovalSummary(formData.approvalDetails),
  }
}

export function getProgrammeCurrentVersion(programme) {
  if (!programme?.versions?.length) return null
  return programme.versions.find((item) => item.isCurrent) || programme.versions[0]
}

export function getProgrammeCurrentFormData(programme) {
  const version = getProgrammeCurrentVersion(programme)
  if (version?.formData) {
    const formData = JSON.parse(JSON.stringify(version.formData))
    if (programme.code) {
      formData.programmeInfo.programmeCode = programme.code
    }
    return formData
  }

  const stub = {
    id: programme.id,
    code: programme.code,
    name: programme.name,
    level: programme.level,
    years: programme.years,
    schoolId: programme.schoolId,
  }
  const approvalOverrides = version
    ? {
        mqaCode: version.mqaCode,
        mqaStartDate: version.mqaValidityStart,
        mqaExpiryDate: version.mqaValidityExpiry,
        moheCode: version.moheCode,
        moheApprovalDate: version.approvalDate,
        moheStartDate: version.moheValidityStart,
        moheExpiryDate: version.moheValidityExpiry,
      }
    : {}

  return buildProgrammeFormData(stub, approvalOverrides, {
    programmeName: programme.name,
    programmeNameEn: programme.name,
    programmeNameMal: programme.name,
    programmeCode: programme.code,
    level: programme.level,
    years: String(programme.years),
    department: programme.schoolId,
  })
}

export function createSampleAttachment() {
  return {
    id: 'sample-attachment-1',
    fileName: 'Introduction to the Chinese Programme.docx',
    fileSize: 1053696,
    fileSizeLabel: '1029kb',
    uploadedAt: '15.06.2025 10:32',
    description:
      'The Chinese Major is designed to provide students with a comprehensive and in-depth understanding of Chinese language, literature, culture, and related interdisciplinary fields.',
  }
}

export function createInitialAttachments() {
  return [createSampleAttachment()]
}

export function createEmptyProgrammeForm() {
  // Step 1 Programme Info: 30 fields; Step 2 Approval: 13; Step 3 Entry: 8; Step 4 Threshold: 3; Step 5 Fee: 21 fields
  return {
    programmeInfo: {
      programmeName: '',
      programmeNameEn: '',
      programmeNameMal: '',
      programmeCode: '',
      idCode: '',
      studyDurationChinese: '',
      levelOfStudy: '',
      fieldOfStudy: '',
      methodOfLearning: '',
      mediumOfInstruction: '',
      awardingBody: '',
      progCommence: '',
      accStatus: 'FA',
      nec: '',
      years: '',
      level: '',
      typeOfProgramme: '',
      modeOfStudy: '',
      methodOfDelivery: '',
      modeOfOffer: '',
      department: '',
      advertisementCode: '',
      longSemesterWeeks: '',
      longSemesterCount: '',
      shortSemesterWeeks: '',
      shortSemesterCount: '',
      industrialTrainingWeeks: '',
      industrialTrainingCount: '',
    },
    attachments: createInitialAttachments(),
    approvalDetails: {
      mqaCode: '',
      mqaExpiryDate: '',
      mqaSyorReferencePa: '',
      mqaSyorReferenceFa: '',
      mqaStartDate: '',
      mqaSyorDatePa: '',
      mqaSyorDateFa: '',
      mqaFirstIntakeDuration: '',
      moheCode: '',
      moheApprovalDate: '',
      moheExpiryDate: '',
      moheApprovalReferenceNo: '',
      moheStartDate: '',
    },
    entryRequirements: {
      muet: '',
      toeflIbt: '',
      pearsonTestOfEnglish: '',
      cambridgeEnglishIii: '',
      elts: '',
      toeflEssentials: '',
      cambridgeEnglishIi: '',
      els: '',
    },
    thresholdMarks: {
      totalContinuousAssessment: '',
      totalFinalAssessment: '',
      overallScore: '',
    },
    feeStructure: {
      durationMinYear: '',
      typeOfApproval: '',
      localStudent: createEmptyFeeRow(),
      internationalStudent: createEmptyFeeRow(),
    },
  }
}

export function createEmptyVersionForm() {
  const empty = createEmptyProgrammeForm()
  return {
    approvalDetails: { ...empty.approvalDetails },
    entryRequirements: { ...empty.entryRequirements },
    thresholdMarks: { ...empty.thresholdMarks },
    feeStructure: {
      durationMinYear: '',
      typeOfApproval: '',
      localStudent: createEmptyFeeRow(),
      internationalStudent: createEmptyFeeRow(),
    },
  }
}

export function mergeVersionFormWithProgramme(baseFormData, versionForm) {
  const base = baseFormData || createEmptyProgrammeForm()
  return {
    programmeInfo: JSON.parse(JSON.stringify(base.programmeInfo || {})),
    attachments: JSON.parse(JSON.stringify(base.attachments || createInitialAttachments())),
    approvalDetails: JSON.parse(JSON.stringify(versionForm.approvalDetails)),
    entryRequirements: JSON.parse(JSON.stringify(versionForm.entryRequirements)),
    thresholdMarks: JSON.parse(JSON.stringify(versionForm.thresholdMarks)),
    feeStructure: JSON.parse(JSON.stringify(versionForm.feeStructure)),
  }
}

export function extractVersionFormFromFormData(formData) {
  const empty = createEmptyVersionForm()
  if (!formData) return empty
  return {
    approvalDetails: JSON.parse(JSON.stringify(formData.approvalDetails || empty.approvalDetails)),
    entryRequirements: JSON.parse(JSON.stringify(formData.entryRequirements || empty.entryRequirements)),
    thresholdMarks: JSON.parse(JSON.stringify(formData.thresholdMarks || empty.thresholdMarks)),
    feeStructure: JSON.parse(JSON.stringify(formData.feeStructure || empty.feeStructure)),
  }
}

export const programmePublishTooltip =
  'Click to send the Approval letter for the update of professional information to the relevant personnel.'

let attachmentSeq = 1

export function createAttachmentId() {
  attachmentSeq += 1
  return `att-${attachmentSeq}`
}

export function formatAttachmentSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0kb'
  if (bytes < 1024) return `${bytes}b`
  return `${Math.round(bytes / 1024)}kb`
}

export function formatUploadTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

let versionSeq = 1000

export function createVersionId() {
  versionSeq += 1
  return `v-new-${versionSeq}`
}

export const organisationTree = [
  {
    id: 'xmu',
    label: 'Xiamen University Malaysia',
    children: [
      { id: 'soi', label: 'School of Information' },
      { id: 'sob', label: 'School of Business' },
      { id: 'some', label: 'School of Mechanical Engineering' },
      { id: 'sbe', label: 'School of Basic Education' },
      { id: 'seem', label: 'School of Economics and Management' },
    ],
  },
]

export const initialProgrammes = [
  {
    id: 1,
    schoolId: 'sob',
    code: 'IBU',
    name: 'Bachelor of Management in International Business (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 1, code: 'IBU', name: 'Bachelor of Management in International Business (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        { id: 'v1-2', isCurrent: true, updatedAt: '15.01.2025 14:30:46', updaterIndex: 0 },
      ),
      buildVersionRecord(
        { id: 1, code: 'IBU', name: 'Bachelor of Management in International Business (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        {
          id: 'v1-1',
          isCurrent: false,
          updatedAt: '27.11.2024 10:55:06',
          updaterIndex: 1,
          approvalOverrides: {
            mqaCode: 'MQA/FA5302',
            mqaExpiryDate: '16.05.2023',
            mqaStartDate: '17.05.2018',
            moheExpiryDate: '04.05.2020',
            moheStartDate: '26.05.2015',
          },
        },
      ),
    ],
  },
  {
    id: 2,
    schoolId: 'sob',
    code: 'CHS',
    name: 'Bachelor in Chinese Studies (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 2, code: 'CHS', name: 'Bachelor in Chinese Studies (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        {
          id: 'v2-1',
          isCurrent: true,
          updatedAt: '12.03.2025 09:18:22',
          updaterIndex: 0,
          approvalOverrides: {
            mqaCode: 'MQA/FA4821',
            mqaStartDate: '01.09.2019',
            mqaExpiryDate: '31.08.2024',
            moheCode: 'N/222/6/0124',
            moheApprovalDate: '18.07.2019',
            moheStartDate: '18.07.2019',
            moheExpiryDate: '17.07.2024',
          },
          infoOverrides: {
            programmeCode: 'CHS00008',
            fieldOfStudy: 'Arts',
            mediumOfInstruction: 'Chinese',
          },
        },
      ),
    ],
  },
  {
    id: 3,
    schoolId: 'sob',
    code: 'JRN',
    name: 'Bachelor of Communication (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 3, code: 'JRN', name: 'Bachelor of Communication (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        {
          id: 'v3-1',
          isCurrent: true,
          updatedAt: '08.02.2025 16:42:11',
          updaterIndex: 2,
          approvalOverrides: {
            mqaCode: 'MQA/FA5103',
            mqaStartDate: '15.03.2020',
            mqaExpiryDate: '14.03.2025',
            moheCode: 'N/321/6/0089',
            moheApprovalDate: '22.01.2020',
            moheStartDate: '22.01.2020',
            moheExpiryDate: '21.01.2025',
          },
          infoOverrides: { programmeCode: 'JRN00003', fieldOfStudy: 'Arts' },
        },
      ),
    ],
  },
  {
    id: 4,
    schoolId: 'sob',
    code: 'HRM',
    name: 'Bachelor in Human Resources Management (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 4, code: 'HRM', name: 'Bachelor in Human Resources Management (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        { id: 'v4-2', isCurrent: true, updatedAt: '20.12.2024 11:20:33', updaterIndex: 0, approvalOverrides: {
          mqaCode: 'MQA/PA4967', mqaStartDate: '10.06.2023', mqaExpiryDate: '09.06.2028',
          moheCode: 'N/345/6/0412', moheApprovalDate: '28.02.2023', moheStartDate: '28.02.2023', moheExpiryDate: '27.02.2028',
        }, infoOverrides: { programmeCode: 'HRM00004' } },
      ),
      buildVersionRecord(
        { id: 4, code: 'HRM', name: 'Bachelor in Human Resources Management (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        { id: 'v4-1', isCurrent: false, updatedAt: '05.06.2023 08:15:47', updaterIndex: 1, approvalOverrides: {
          mqaCode: 'MQA/FA4967', mqaStartDate: '10.06.2018', mqaExpiryDate: '09.06.2023',
          moheCode: 'N/345/6/0412', moheApprovalDate: '05.04.2018', moheStartDate: '05.04.2018', moheExpiryDate: '04.04.2023',
        }, infoOverrides: { programmeCode: 'HRM00004' } },
      ),
    ],
  },
  {
    id: 5,
    schoolId: 'sob',
    code: 'MAR',
    name: 'Bachelor in Marketing (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 5, code: 'MAR', name: 'Bachelor in Marketing (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        {
          id: 'v5-1',
          isCurrent: true,
          updatedAt: '03.01.2025 13:05:58',
          updaterIndex: 2,
          approvalOverrides: {
            mqaCode: 'MQA/FA5088',
            mqaStartDate: '20.11.2019',
            mqaExpiryDate: '19.11.2024',
            moheCode: 'N/345/6/0298',
            moheApprovalDate: '14.09.2019',
            moheStartDate: '14.09.2019',
            moheExpiryDate: '13.09.2024',
          },
          infoOverrides: { programmeCode: 'MAR00005' },
        },
      ),
    ],
  },
  {
    id: 6,
    schoolId: 'sob',
    code: 'ACC',
    name: 'Bachelor in Accounting (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 6, code: 'ACC', name: 'Bachelor in Accounting (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        { id: 'v6-2', isCurrent: true, updatedAt: '18.11.2024 15:48:09', updaterIndex: 0, approvalOverrides: {
          mqaCode: 'MQA/PA4755', mqaStartDate: '08.04.2022', mqaExpiryDate: '07.04.2027',
          moheCode: 'N/344/6/0187', moheApprovalDate: '19.01.2022', moheStartDate: '19.01.2022', moheExpiryDate: '18.01.2027',
        }, infoOverrides: { programmeCode: 'ACC00006' } },
      ),
      buildVersionRecord(
        { id: 6, code: 'ACC', name: 'Bachelor in Accounting (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'sob' },
        { id: 'v6-1', isCurrent: false, updatedAt: '10.04.2022 09:30:15', updaterIndex: 1, approvalOverrides: {
          mqaCode: 'MQA/FA4755', mqaStartDate: '08.04.2017', mqaExpiryDate: '07.04.2022',
          moheCode: 'N/344/6/0187', moheApprovalDate: '11.02.2017', moheStartDate: '11.02.2017', moheExpiryDate: '10.02.2022',
        }, infoOverrides: { programmeCode: 'ACC00006' } },
      ),
    ],
  },
  {
    id: 7,
    schoolId: 'soi',
    code: 'CSN',
    name: 'Bachelor of Computer Science (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 7, code: 'CSN', name: 'Bachelor of Computer Science (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'soi' },
        {
          id: 'v7-1',
          isCurrent: true,
          updatedAt: '22.10.2024 10:12:44',
          updaterIndex: 3,
          approvalOverrides: {
            mqaCode: 'MQA/FA1234',
            mqaStartDate: '01.01.2020',
            mqaExpiryDate: '31.12.2024',
            moheCode: 'N/481/6/0123',
            moheApprovalDate: '15.06.2019',
            moheStartDate: '15.06.2019',
            moheExpiryDate: '14.06.2024',
          },
          infoOverrides: { programmeCode: 'CSN00007', fieldOfStudy: 'Information Technology' },
        },
      ),
    ],
  },
  {
    id: 8,
    schoolId: 'soi',
    code: 'SWE',
    name: 'Bachelor of Software Engineering (Honours)',
    level: 'L6-Bachelor',
    years: 3,
    versions: [
      buildVersionRecord(
        { id: 8, code: 'SWE', name: 'Bachelor of Software Engineering (Honours)', level: 'L6-Bachelor', years: 3, schoolId: 'soi' },
        {
          id: 'v8-1',
          isCurrent: true,
          updatedAt: '06.09.2024 14:27:51',
          updaterIndex: 3,
          approvalOverrides: {
            mqaCode: 'MQA/FA1345',
            mqaStartDate: '05.08.2021',
            mqaExpiryDate: '04.08.2026',
            moheCode: 'N/481/6/0156',
            moheApprovalDate: '30.06.2021',
            moheStartDate: '30.06.2021',
            moheExpiryDate: '29.06.2026',
          },
          infoOverrides: { programmeCode: 'SWE00008', fieldOfStudy: 'Information Technology' },
        },
      ),
    ],
  },
]

let programmeSeq = initialProgrammes.length

export function createProgrammeId() {
  programmeSeq += 1
  return programmeSeq
}
