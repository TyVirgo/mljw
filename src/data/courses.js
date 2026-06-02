import { initialDepartments } from './departments.js'
import { semesterTypeOptions } from './semesterInfo.js'

export const COURSE_CODE_PATTERN = /^[A-Za-z0-9]+$/
export const MAX_COURSE_NAME_LENGTH = 200
export const MAX_SYNOPSIS_LENGTH = 500
export const MAX_REFERENCES_LENGTH = 500
export const MAX_CLO_OUTCOME_LENGTH = 100

export const courseCreateSteps = [
  { id: 1, title: 'General Information' },
  { id: 2, title: 'Course Learning Outcome (CLO)' },
  { id: 3, title: 'Student Learning Time (SLT)' },
]

export const courseDetailSteps = [
  { id: 1, title: 'General Information' },
  { id: 2, title: 'Course Learning Outcome (CLO)' },
  { id: 3, title: 'Student Learning Time (SLT)' },
  { id: 4, title: 'Course Changes Record' },
]

function buildBloomTaxonomyOptions() {
  const groups = [
    { prefix: 'A', count: 5 },
    { prefix: 'C', count: 6 },
    { prefix: 'P', count: 7 },
  ]
  return groups.flatMap(({ prefix, count }) =>
    Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`),
  )
}

export const bloomTaxonomyOptions = buildBloomTaxonomyOptions()

export const cloTeachingMethodOptions = ['Lecture', 'Practical', 'Others']

export const cloAssessmentMethodOptions = [
  'Assignments',
  'Quiz',
  'Mid-term Examination',
  'Practical Test',
  'Lab Report',
  'Presentation',
  'Project',
  'Final Examination',
]

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
    prerequisite: '',
    synopsis: '',
    references: '',
  }
}

export function createEmptyCLO() {
  return {
    cloCode: '',
    outcome: '',
    bloomLevel: '',
    teachingMethods: [],
    assessmentMethods: [],
  }
}

let nextCLOId = 1

export function createCLOId(clos = []) {
  const maxId = clos.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  return Math.max(maxId + 1, nextCLOId++)
}

export function generateNextCLOCode(allClos = []) {
  const maxNumber = allClos.reduce((max, item) => {
    const match = String(item.cloCode || '').match(/^CLO(\d+)$/i)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `CLO${maxNumber + 1}`
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

  if ((form.synopsis || '').length > MAX_SYNOPSIS_LENGTH) {
    errors.synopsis = `Synopsis must be within ${MAX_SYNOPSIS_LENGTH} characters`
  }

  if ((form.references || '').length > MAX_REFERENCES_LENGTH) {
    errors.references = `References must be within ${MAX_REFERENCES_LENGTH} characters`
  }

  return errors
}

export function validateCLOForm(form, allClos, excludeId = null) {
  const errors = {}
  const cloCode = form.cloCode?.trim() || ''
  const outcome = form.outcome?.trim() || ''

  if (!cloCode) {
    errors.cloCode = 'CLO is required'
  } else if (!/^CLO\d+$/i.test(cloCode)) {
    errors.cloCode = 'CLO format must be like CLO1, CLO2'
  } else {
    const duplicate = allClos.some(
      (item) =>
        item.cloCode.toLowerCase() === cloCode.toLowerCase() &&
        (excludeId == null || item.id !== excludeId),
    )
    if (duplicate) errors.cloCode = 'CLO already exists'
  }

  if (!outcome) {
    errors.outcome = 'Outcome is required'
  } else if (outcome.length > MAX_CLO_OUTCOME_LENGTH) {
    errors.outcome = `Outcome must be within ${MAX_CLO_OUTCOME_LENGTH} characters`
  }

  if (!form.bloomLevel) {
    errors.bloomLevel = "Bloom's Taxonomy Level is required"
  } else if (!bloomTaxonomyOptions.includes(form.bloomLevel)) {
    errors.bloomLevel = "Bloom's Taxonomy Level is invalid"
  }

  if (!form.teachingMethods?.length) {
    errors.teachingMethods = 'Teaching Methods is required'
  }

  if (!form.assessmentMethods?.length) {
    errors.assessmentMethods = 'Assessment Methods is required'
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
    prerequisite: form.prerequisite?.trim() || '',
    synopsis: form.synopsis?.trim() || '',
    references: form.references?.trim() || '',
  }
}

export function formatMethodList(methods, trFn) {
  if (!methods?.length) return '--'
  return methods.map((item) => (trFn ? trFn(item) : item)).join(', ')
}

export const MAX_OUTLINE_CONTENT_LENGTH = 100
export const sltHourKeys = ['L', 'T', 'P', 'O']

export const continuousAssessmentOptions = ['Coursework', 'Midterm Examination']
export const finalAssessmentOptions = ['Final examination']

export function createEmptySLTHours() {
  return { L: 0, T: 0, P: 0, O: 0 }
}

export function createEmptySLTData() {
  return {
    contentOutlines: [],
    continuousAssessments: [],
    finalAssessments: [],
  }
}

let nextOutlineId = 1
let nextContinuousId = 1
let nextFinalId = 1

export function createOutlineId(items = []) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  return Math.max(maxId + 1, nextOutlineId++)
}

export function createContinuousAssessmentId(items = []) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  return Math.max(maxId + 1, nextContinuousId++)
}

export function createFinalAssessmentId(items = []) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  return Math.max(maxId + 1, nextFinalId++)
}

export function sumSLTHours(hours = {}) {
  return sltHourKeys.reduce((sum, key) => sum + (Number(hours[key]) || 0), 0)
}

export function sumOutlineRowSLT(row) {
  return sumSLTHours(row.physical) + sumSLTHours(row.online) + (Number(row.nf2f) || 0)
}

export function sumSimpleAssessmentSLT(row) {
  return (Number(row.physical) || 0) + (Number(row.online) || 0) + (Number(row.nf2f) || 0)
}

export function computeSLTStats(slt = createEmptySLTData()) {
  const outlineTotal = (slt.contentOutlines || []).reduce((sum, row) => sum + sumOutlineRowSLT(row), 0)
  const continuousTotal = (slt.continuousAssessments || []).reduce(
    (sum, row) => sum + sumSimpleAssessmentSLT(row),
    0,
  )
  const finalTotal = (slt.finalAssessments || []).reduce((sum, row) => sum + sumSimpleAssessmentSLT(row), 0)
  const assessmentSLT = continuousTotal + finalTotal
  const totalSLT = outlineTotal + assessmentSLT

  let physicalHours = 0
  let onlineHours = 0
  let nf2fHours = 0

  ;(slt.contentOutlines || []).forEach((row) => {
    physicalHours += sumSLTHours(row.physical)
    onlineHours += sumSLTHours(row.online)
    nf2fHours += Number(row.nf2f) || 0
  })
  ;[...(slt.continuousAssessments || []), ...(slt.finalAssessments || [])].forEach((row) => {
    physicalHours += Number(row.physical) || 0
    onlineHours += Number(row.online) || 0
    nf2fHours += Number(row.nf2f) || 0
  })

  const onlineIndep = onlineHours + nf2fHours
  const physicalPct = totalSLT ? Math.round((physicalHours / totalSLT) * 100) : 0
  const onlineIndepPct = totalSLT ? Math.round((onlineIndep / totalSLT) * 100) : 0

  return { totalSLT, assessmentSLT, physicalPct, onlineIndepPct }
}

export function sumOutlineColumnTotals(rows = []) {
  const totals = {
    physical: createEmptySLTHours(),
    online: createEmptySLTHours(),
    nf2f: 0,
    rowTotal: 0,
  }
  rows.forEach((row) => {
    sltHourKeys.forEach((key) => {
      totals.physical[key] += Number(row.physical?.[key]) || 0
      totals.online[key] += Number(row.online?.[key]) || 0
    })
    totals.nf2f += Number(row.nf2f) || 0
    totals.rowTotal += sumOutlineRowSLT(row)
  })
  return totals
}

export function sumAssessmentColumnTotals(rows = []) {
  return rows.reduce(
    (acc, row) => ({
      percentage: acc.percentage + (Number(row.percentage) || 0),
      physical: acc.physical + (Number(row.physical) || 0),
      online: acc.online + (Number(row.online) || 0),
      nf2f: acc.nf2f + (Number(row.nf2f) || 0),
      slt: acc.slt + sumSimpleAssessmentSLT(row),
    }),
    { percentage: 0, physical: 0, online: 0, nf2f: 0, slt: 0 },
  )
}

export function validateOutlineForm(form, clos = []) {
  const errors = {}
  const content = form.courseContent?.trim() || ''
  if (!content) errors.courseContent = 'Course Content is required'
  else if (content.length > MAX_OUTLINE_CONTENT_LENGTH) {
    errors.courseContent = `Course Content must be within ${MAX_OUTLINE_CONTENT_LENGTH} characters`
  }
  if (!form.cloCodes?.length) errors.cloCodes = 'CLO is required'
  else if (form.cloCodes.some((code) => !clos.find((item) => item.cloCode === code))) {
    errors.cloCodes = 'CLO selection is invalid'
  }
  const allHours = [
    ...sltHourKeys.map((key) => form.physical?.[key]),
    ...sltHourKeys.map((key) => form.online?.[key]),
    form.nf2f,
  ]
  if (allHours.some((value) => value !== '' && value != null && (!/^\d+$/.test(String(value)) || Number(value) < 0))) {
    errors.sltHours = 'SLT hours must be non-negative integers'
  }
  return errors
}

export function validateContinuousAssessmentForm(form) {
  const errors = {}
  if (!form.assessmentType) errors.assessmentType = 'Continuous Assessment is required'
  else if (!continuousAssessmentOptions.includes(form.assessmentType)) {
    errors.assessmentType = 'Continuous Assessment is invalid'
  }
  validateAssessmentCommon(form, errors)
  return errors
}

export function validateFinalAssessmentForm(form) {
  const errors = {}
  if (!form.assessmentType) errors.assessmentType = 'Final Assessment is required'
  else if (!finalAssessmentOptions.includes(form.assessmentType)) {
    errors.assessmentType = 'Final Assessment is invalid'
  }
  validateAssessmentCommon(form, errors)
  return errors
}

function validateAssessmentCommon(form, errors) {
  const pct = String(form.percentage ?? '').trim()
  if (!pct) errors.percentage = 'Percentage is required'
  else if (!/^\d+$/.test(pct) || Number(pct) < 0 || Number(pct) > 100) {
    errors.percentage = 'Percentage must be between 0 and 100'
  }
  ;['physical', 'online', 'nf2f'].forEach((key) => {
    const value = String(form[key] ?? '').trim()
    if (value && (!/^\d+$/.test(value) || Number(value) < 0)) {
      errors[key] = 'SLT hours must be non-negative integers'
    }
  })
}

export function buildCourseCreatePayload(generalForm, clos = [], slt = createEmptySLTData()) {
  return {
    ...buildCoursePayload(generalForm),
    clos: clos.map((item) => ({
      id: item.id,
      cloCode: item.cloCode,
      outcome: item.outcome,
      bloomLevel: item.bloomLevel,
      teachingMethods: [...(item.teachingMethods || [])],
      assessmentMethods: [...(item.assessmentMethods || [])],
    })),
    slt: {
      contentOutlines: (slt.contentOutlines || []).map((item) => ({
        id: item.id,
        courseContent: item.courseContent,
        cloCodes: [...(item.cloCodes || [])],
        physical: { ...createEmptySLTHours(), ...(item.physical || {}) },
        online: { ...createEmptySLTHours(), ...(item.online || {}) },
        nf2f: Number(item.nf2f) || 0,
      })),
      continuousAssessments: (slt.continuousAssessments || []).map((item) => ({
        id: item.id,
        assessmentType: item.assessmentType,
        percentage: Number(item.percentage) || 0,
        physical: Number(item.physical) || 0,
        online: Number(item.online) || 0,
        nf2f: Number(item.nf2f) || 0,
      })),
      finalAssessments: (slt.finalAssessments || []).map((item) => ({
        id: item.id,
        assessmentType: item.assessmentType,
        percentage: Number(item.percentage) || 0,
        physical: Number(item.physical) || 0,
        online: Number(item.online) || 0,
        nf2f: Number(item.nf2f) || 0,
      })),
    },
  }
}

export function courseToWizardForm(course = {}) {
  let references = course.references || ''
  if (!references && (course.requiredReferences || course.furtherReadings)) {
    references = [course.requiredReferences, course.furtherReadings].filter(Boolean).join('\n\n')
  }
  return {
    courseCode: course.courseCode || '',
    courseName: course.courseName || '',
    offering: course.offering || '',
    courseOwner: course.courseOwner || '',
    courseClassification: course.courseClassification || '',
    credit: course.credit ?? '',
    mediumOfInstruction: course.mediumOfInstruction || '',
    semesterType: course.semesterType || '',
    prerequisite: course.prerequisite || '',
    synopsis: course.synopsis || '',
    references,
  }
}

export function normalizeCourseState(course = {}) {
  return buildCourseCreatePayload(
    courseToWizardForm(course),
    course.clos || [],
    course.slt || createEmptySLTData(),
  )
}

export const DEFAULT_CHANGE_MODIFIER = 'System Admin'

let nextChangeRecordId = 1000

export function createChangeRecordId(existingRecords = []) {
  const maxId = existingRecords.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  return Math.max(maxId + 1, nextChangeRecordId++)
}

export function formatChangeRecordTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const CHANGE_LOG_FIELDS = [
  { key: 'courseCode', label: 'Course Code' },
  { key: 'courseName', label: 'Course Name' },
  { key: 'offering', label: 'Offering Unit', format: (value) => getOfferingLabel(value, initialDepartments) },
  { key: 'courseOwner', label: 'Course Owner', format: (value) => getCourseOwnerLabel(value) },
  { key: 'courseClassification', label: 'Course Classification' },
  { key: 'credit', label: 'Credit Value' },
  { key: 'mediumOfInstruction', label: 'Medium of Instruction' },
  { key: 'semesterType', label: 'Semester Type' },
  { key: 'prerequisite', label: 'Pre-requisite / co-requisite' },
  { key: 'synopsis', label: 'Synopsis' },
  { key: 'references', label: 'References' },
]

function displayChangeValue(value) {
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

function normalizeCLOForCompare(clo) {
  return {
    cloCode: clo.cloCode,
    outcome: clo.outcome,
    bloomLevel: clo.bloomLevel,
    teachingMethods: [...(clo.teachingMethods || [])].sort(),
    assessmentMethods: [...(clo.assessmentMethods || [])].sort(),
  }
}

function buildCLOChangeLogs(beforeClos = [], afterClos = []) {
  const logs = []
  const beforeMap = new Map(beforeClos.map((item) => [item.id, item]))
  const afterMap = new Map(afterClos.map((item) => [item.id, item]))

  afterClos.forEach((item) => {
    if (!beforeMap.has(item.id)) {
      logs.push(`Added CLO ${item.cloCode}`)
    }
  })

  beforeClos.forEach((item) => {
    if (!afterMap.has(item.id)) {
      logs.push(`Deleted CLO ${item.cloCode}`)
    } else {
      const before = normalizeCLOForCompare(beforeMap.get(item.id))
      const after = normalizeCLOForCompare(afterMap.get(item.id))
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        logs.push(`Updated CLO ${item.cloCode}`)
      }
    }
  })

  return logs
}

export function buildCourseChangeLogs(beforeCourse, afterPayload, modifier = DEFAULT_CHANGE_MODIFIER) {
  const before = normalizeCourseState(beforeCourse)
  const after = afterPayload
  const modifiedAt = formatChangeRecordTime()
  const existingRecords = beforeCourse.changeRecords || []
  const logs = []

  CHANGE_LOG_FIELDS.forEach(({ key, label, format }) => {
    const oldValue = format ? format(before[key]) : before[key]
    const newValue = format ? format(after[key]) : after[key]
    if (displayChangeValue(oldValue) !== displayChangeValue(newValue)) {
      logs.push({
        id: createChangeRecordId([...existingRecords, ...logs]),
        modifiedAt,
        modifiedBy: modifier,
        detail: `Changed ${label} from ${displayChangeValue(oldValue)} to ${displayChangeValue(newValue)}`,
      })
    }
  })

  buildCLOChangeLogs(before.clos, after.clos).forEach((detail) => {
    logs.push({
      id: createChangeRecordId([...existingRecords, ...logs]),
      modifiedAt,
      modifiedBy: modifier,
      detail,
    })
  })

  if (JSON.stringify(before.slt) !== JSON.stringify(after.slt)) {
    logs.push({
      id: createChangeRecordId([...existingRecords, ...logs]),
      modifiedAt,
      modifiedBy: modifier,
      detail: 'Updated Student Learning Time (SLT) configuration',
    })
  }

  return logs
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

export function cloneCLOsForCopy(clos = []) {
  const result = []
  clos.forEach((item) => {
    result.push({
      ...item,
      id: createCLOId(result),
      teachingMethods: [...(item.teachingMethods || [])],
      assessmentMethods: [...(item.assessmentMethods || [])],
    })
  })
  return result
}

export function cloneSLTForCopy(slt = createEmptySLTData()) {
  const contentOutlines = []
  ;(slt.contentOutlines || []).forEach((item) => {
    contentOutlines.push({
      id: createOutlineId(contentOutlines),
      courseContent: item.courseContent,
      cloCodes: [...(item.cloCodes || [])],
      physical: { ...createEmptySLTHours(), ...(item.physical || {}) },
      online: { ...createEmptySLTHours(), ...(item.online || {}) },
      nf2f: Number(item.nf2f) || 0,
    })
  })

  const continuousAssessments = []
  ;(slt.continuousAssessments || []).forEach((item) => {
    continuousAssessments.push({
      id: createContinuousAssessmentId(continuousAssessments),
      assessmentType: item.assessmentType,
      percentage: Number(item.percentage) || 0,
      physical: Number(item.physical) || 0,
      online: Number(item.online) || 0,
      nf2f: Number(item.nf2f) || 0,
    })
  })

  const finalAssessments = []
  ;(slt.finalAssessments || []).forEach((item) => {
    finalAssessments.push({
      id: createFinalAssessmentId(finalAssessments),
      assessmentType: item.assessmentType,
      percentage: Number(item.percentage) || 0,
      physical: Number(item.physical) || 0,
      online: Number(item.online) || 0,
      nf2f: Number(item.nf2f) || 0,
    })
  })

  return { contentOutlines, continuousAssessments, finalAssessments }
}

export function prepareCourseForCopy(source, allCourses) {
  const form = courseToWizardForm(source)
  form.courseCode = generateCopyCourseCode(source.courseCode, allCourses)
  return {
    form,
    clos: cloneCLOsForCopy(source.clos || []),
    slt: cloneSLTForCopy(source.slt || createEmptySLTData()),
    sourceCourseName: source.courseName,
    sourceCourseCode: source.courseCode,
  }
}

export const demoCLOs = [
  {
    id: 1,
    cloCode: 'CLO1',
    outcome: 'Explain the basic theories and laws of mechanics.',
    bloomLevel: 'C1',
    teachingMethods: ['Lecture', 'Tutorial'],
    assessmentMethods: ['Coursework', 'Examination'],
  },
  {
    id: 2,
    cloCode: 'CLO2',
    outcome: 'Apply Newton\'s laws of motion to solve problems quantitatively using mathematical techniques.',
    bloomLevel: 'C2',
    teachingMethods: ['Lecture', 'Tutorial'],
    assessmentMethods: ['Coursework', 'Examination'],
  },
  {
    id: 3,
    cloCode: 'CLO3',
    outcome: 'Analyze conservation of energy and momentum in physical systems.',
    bloomLevel: 'A3',
    teachingMethods: ['Lecture', 'Tutorial'],
    assessmentMethods: ['Coursework', 'Examination'],
  },
  {
    id: 4,
    cloCode: 'CLO4',
    outcome: 'Evaluate rotational dynamics and gravitation concepts.',
    bloomLevel: 'C2',
    teachingMethods: ['Lecture', 'Tutorial'],
    assessmentMethods: ['Coursework', 'Examination'],
  },
  {
    id: 5,
    cloCode: 'CLO5',
    outcome: 'Design experiments to investigate wave phenomena and oscillations.',
    bloomLevel: 'P2',
    teachingMethods: ['Lecture', 'Tutorial'],
    assessmentMethods: ['Coursework', 'Examination'],
  },
  {
    id: 6,
    cloCode: 'CLO6',
    outcome: 'Compare classical mechanics with an introduction to special relativity.',
    bloomLevel: 'C2',
    teachingMethods: ['Lecture', 'Tutorial'],
    assessmentMethods: ['Coursework', 'Examination'],
  },
]

export const demoSLT = {
  contentOutlines: [
    {
      id: 1,
      courseContent:
        '1. Kinematics\n• Displacement and vectors\n• Circular motion\n• Relative velocity',
      cloCodes: ['CLO1', 'CLO2', 'CLO3', 'CLO4'],
      physical: { L: 5, T: 1, P: 1, O: 0 },
      online: { L: 0, T: 0, P: 0, O: 0 },
      nf2f: 8,
    },
    {
      id: 2,
      courseContent:
        '2. Newton\'s laws of motion\n• Force and acceleration\n• Friction\n• Circular motion applications',
      cloCodes: ['CLO1', 'CLO2'],
      physical: { L: 5, T: 1, P: 0, O: 0 },
      online: { L: 0, T: 0, P: 0, O: 0 },
      nf2f: 6,
    },
    {
      id: 3,
      courseContent:
        '3. Work and energy\n• Work-energy theorem\n• Conservation of energy\n• Potential energy',
      cloCodes: ['CLO2', 'CLO3'],
      physical: { L: 4, T: 1, P: 1, O: 0 },
      online: { L: 0, T: 0, P: 0, O: 0 },
      nf2f: 5,
    },
    {
      id: 4,
      courseContent:
        '4. Momentum\n• Impulse and momentum\n• Collisions\n• Center of mass',
      cloCodes: ['CLO3', 'CLO4'],
      physical: { L: 3, T: 1, P: 0, O: 0 },
      online: { L: 0, T: 0, P: 0, O: 0 },
      nf2f: 4,
    },
  ],
  continuousAssessments: [
    { id: 1, assessmentType: 'Coursework', percentage: 30, physical: 0, online: 0, nf2f: 20 },
    { id: 2, assessmentType: 'Midterm Examination', percentage: 30, physical: 2, online: 0, nf2f: 8 },
  ],
  finalAssessments: [
    { id: 1, assessmentType: 'Final examination', percentage: 40, physical: 2, online: 0, nf2f: 8 },
  ],
}

const demoChangeRecords = [
  {
    id: 1,
    modifiedAt: '09.09.2024 15:03',
    modifiedBy: 'Mohd Arif Bin Abdullah',
    detail: 'Changed Course Classification from Compulsory to Common Core',
  },
  {
    id: 2,
    modifiedAt: '09.09.2024 15:03',
    modifiedBy: 'Mohd Arif Bin Abdullah',
    detail: 'Added Name(s) of academic staff: Lim Yen Kheng',
  },
  {
    id: 3,
    modifiedAt: '09.09.2024 15:03',
    modifiedBy: 'Mohd Arif Bin Abdullah',
    detail: 'Changed Credit Value from 4 to 3',
  },
  {
    id: 4,
    modifiedAt: '09.09.2024 15:03',
    modifiedBy: 'Mohd Arif Bin Abdullah',
    detail: 'Changed Medium of Instruction from English to Bilingual',
  },
  {
    id: 5,
    modifiedAt: '09.09.2024 15:03',
    modifiedBy: 'Mohd Arif Bin Abdullah',
    detail: 'Updated Synopsis content',
  },
  {
    id: 6,
    modifiedAt: '09.09.2024 15:03',
    modifiedBy: 'Mohd Arif Bin Abdullah',
    detail: 'Added Required References entry',
  },
]

const demoGeneralExtras = {
  prerequisite: '',
  synopsis:
    'This course teaches the fundamentals of mechanics. Topics include kinematics, Newton\'s laws of motion, conservation of energy and momentum, rigid body rotation, gravitation, waves, oscillations and an introduction to special relativity.',
  requiredReferences:
    'H. D. Young and R. A. Freedman, "University Physics with Modern Physics 15ed," Pearson, (2021)\nS. T. Thornton and J. B. Marion, "Classical dynamics of particles and systems" Cengage Learning (2012)',
  furtherReadings: 'R Shankar, "Fundamental of Physics" Yale University Press (2014)',
  courseOwnerDisplay: 'Lim Yen Kheng, Dr. Sarah Williams',
}

export function enrichCourseForDetail(course) {
  if (!course) return null
  const isDemo = course.courseCode === 'PHY101'
  return {
    ...course,
    prerequisite: course.prerequisite ?? (isDemo ? demoGeneralExtras.prerequisite : ''),
    synopsis: course.synopsis ?? (isDemo ? demoGeneralExtras.synopsis : ''),
    requiredReferences: course.requiredReferences ?? (isDemo ? demoGeneralExtras.requiredReferences : ''),
    furtherReadings: course.furtherReadings ?? (isDemo ? demoGeneralExtras.furtherReadings : ''),
    courseOwnerDisplay:
      course.courseOwnerDisplay ??
      (isDemo ? demoGeneralExtras.courseOwnerDisplay : getCourseOwnerLabel(course.courseOwner)),
    clos: course.clos?.length ? course.clos : isDemo ? demoCLOs.map((item) => ({ ...item })) : [],
    slt: course.slt?.contentOutlines?.length
      ? course.slt
      : isDemo
        ? JSON.parse(JSON.stringify(demoSLT))
        : createEmptySLTData(),
    changeRecords: course.changeRecords?.length
      ? course.changeRecords
      : isDemo
        ? demoChangeRecords.map((item) => ({ ...item }))
        : [],
  }
}
