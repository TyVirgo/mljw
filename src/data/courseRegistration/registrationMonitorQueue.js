import { ref } from 'vue'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'

const DEFAULT_ELECTIVE_CAPS = { geMax: 18, meMax: 22 }

/** Demo：毕业 GE 文/商/理/AI与开放选修（首次选课已选≡本学期） */
const DEFAULT_GRADUATION_GE = {
  humanities: 0,
  business: 3,
  science: 0,
  aiOpen: 0,
  required: { humanities: 12, business: 12, science: 12, aiOpen: 12 },
}

/** Demo：本学期文商理（4+4+4=12） */
const DEFAULT_TERM_GE_CATEGORIES = {
  humanities: 2,
  business: 1,
  science: 1,
  required: { humanities: 4, business: 4, science: 4 },
}

function withTermGe(row, overrides = {}) {
  return {
    ...row,
    termGeCategories: {
      ...DEFAULT_TERM_GE_CATEGORIES,
      required: { ...DEFAULT_TERM_GE_CATEGORIES.required },
      ...overrides,
      required: { ...DEFAULT_TERM_GE_CATEGORIES.required, ...(overrides.required || {}) },
    },
  }
}

const initialMonitorRows = [
  withTermGe({
    id: 'mon-001',
    studentId: 'COS2409001',
    studentName: 'Ahmad bin Ali',
    programme: 'COS',
    intake: '2409',
    credits: 16,
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    status: 'normal',
    tags: [],
    cgpa: 3.42,
    termElectiveProgress: { ge: 4, me: 6, ...DEFAULT_ELECTIVE_CAPS },
    graduationGeProgress: { humanities: 5, business: 2, science: 3, aiOpen: 3, required: { ...DEFAULT_GRADUATION_GE.required } },
    schedule: [
      { day: 'Mon', start: 10, end: 12, course: 'COMP201' },
      { day: 'Wed', start: 14, end: 16, course: 'COMP3192' },
    ],
    issues: [],
    history: [{ at: '02-Sep-2025', action: 'Registered COMP201 sec 01' }],
  }),
  withTermGe(
    {
      id: 'mon-002',
      studentId: 'DSA2504002',
      studentName: 'Lee Wei Ming',
      programme: 'DSA',
      intake: '2504',
      credits: 8,
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      status: 'creditLow',
      tags: ['freshman'],
      cgpa: 2.88,
      termElectiveProgress: { ge: 3, me: 0, ...DEFAULT_ELECTIVE_CAPS },
      graduationGeProgress: { humanities: 3, business: 0, science: 0, aiOpen: 0, required: { ...DEFAULT_GRADUATION_GE.required } },
      schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
      issues: ['creditBelowMin'],
      history: [{ at: '01-Sep-2025', action: 'Registered MPU3183 sec 01' }],
    },
    { humanities: 2, business: 1, science: 0 },
  ),
  withTermGe(
    {
      id: 'mon-003',
      studentId: 'AIT2409010',
      studentName: 'Siti Nurhaliza',
      programme: 'AIT',
      intake: '2409',
      credits: 20,
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      status: 'creditHigh',
      tags: ['resumption'],
      cgpa: 3.15,
      termElectiveProgress: { ge: 6, me: 8, ...DEFAULT_ELECTIVE_CAPS },
      graduationGeProgress: { humanities: 6, business: 5, science: 4, aiOpen: 1, required: { ...DEFAULT_GRADUATION_GE.required } },
      schedule: [
        { day: 'Mon', start: 10, end: 12, course: 'COMP201' },
        { day: 'Wed', start: 14, end: 16, course: 'COMP3192' },
        { day: 'Fri', start: 14, end: 16, course: 'MATH201' },
      ],
      issues: ['creditAtMax'],
      history: [{ at: '28-Aug-2025', action: 'Auto-imported (resumption)' }],
    },
    { humanities: 2, business: 2, science: 2 },
  ),
  withTermGe(
    {
      id: 'mon-004',
      studentId: 'COS2504015',
      studentName: 'Tan Mei Ling',
      programme: 'COS',
      intake: '2504',
      credits: 0,
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      status: 'notRegistered',
      tags: ['freshman'],
      cgpa: null,
      termElectiveProgress: { ge: 0, me: 0, geMax: 12, meMax: 12 },
      graduationGeProgress: { humanities: 0, business: 0, science: 0, aiOpen: 0, required: { ...DEFAULT_GRADUATION_GE.required } },
      schedule: [],
      issues: ['notRegistered'],
      history: [],
    },
    { humanities: 0, business: 0, science: 0 },
  ),
  withTermGe(
    {
      id: 'mon-005',
      studentId: 'DSA2409008',
      studentName: 'Raj Kumar',
      programme: 'DSA',
      intake: '2409',
      credits: 14,
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      status: 'g1CategoryLow',
      tags: [],
      cgpa: 3.01,
      termElectiveProgress: { ge: 2, me: 6, ...DEFAULT_ELECTIVE_CAPS },
      graduationGeProgress: { humanities: 2, business: 4, science: 1, aiOpen: 0, required: { ...DEFAULT_GRADUATION_GE.required } },
      schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
      issues: ['g1HumanitiesLow'],
      history: [{ at: '03-Sep-2025', action: 'Warning: GE shortfall' }],
    },
    { humanities: 1, business: 1, science: 0 },
  ),
  withTermGe({
    id: 'mon-006',
    studentId: 'COS2409022',
    studentName: 'Priya Devi',
    programme: 'COS',
    intake: '2409',
    credits: 12,
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    status: 'prerequisiteMissing',
    tags: ['transferCredit'],
    cgpa: 3.28,
    termElectiveProgress: { ge: 4, me: 4, ...DEFAULT_ELECTIVE_CAPS },
    graduationGeProgress: { ...DEFAULT_GRADUATION_GE },
    schedule: [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }],
    issues: ['prerequisiteMissing'],
    history: [{ at: '04-Sep-2025', action: 'Missing prerequisite for COMP3192' }],
  }),
  withTermGe(
    {
      id: 'mon-007',
      studentId: 'AIT2504003',
      studentName: 'Hassan Ibrahim',
      programme: 'AIT',
      intake: '2504',
      credits: 8,
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      status: 'creditLow',
      tags: ['freshman', 'transferCredit'],
      cgpa: 3.55,
      termElectiveProgress: { ge: 3, me: 5, ...DEFAULT_ELECTIVE_CAPS },
      graduationGeProgress: { humanities: 3, business: 2, science: 2, aiOpen: 1, required: { ...DEFAULT_GRADUATION_GE.required } },
      schedule: [
        { day: 'Mon', start: 10, end: 12, course: 'COMP201' },
        { day: 'Tue', start: 9, end: 12, course: 'MPU3183' },
      ],
      issues: ['creditBelowMin'],
      history: [{ at: '01-Sep-2025', action: 'Transfer credit applied' }],
    },
    { humanities: 1, business: 1, science: 1 },
  ),
]

export const registrationMonitorQueue = ref(initialMonitorRows.map((item) => ({ ...item })))

export const monitorStatusOptions = [
  'normal',
  'creditLow',
  'creditHigh',
  'g1CategoryLow',
  'prerequisiteMissing',
  'notRegistered',
]

export function getMonitorStats(rows = registrationMonitorQueue.value) {
  const total = rows.length
  const participated = rows.filter((r) => r.credits > 0).length
  const avgCredits =
    participated === 0
      ? 0
      : Math.round((rows.reduce((sum, r) => sum + (r.credits || 0), 0) / participated) * 10) / 10
  const belowMin = rows.filter(
    (r) => r.status === 'creditLow' || r.issues?.includes('creditBelowMin'),
  ).length
  const aboveMax = rows.filter(
    (r) =>
      r.status === 'creditHigh' ||
      r.issues?.includes('creditAtMax') ||
      r.issues?.includes('creditAboveMax'),
  ).length
  const g1Risk = rows.filter(
    (r) => r.status === 'g1CategoryLow' || r.issues?.includes('g1HumanitiesLow'),
  ).length
  return { total, participated, avgCredits, belowMin, aboveMax, g1Risk }
}

/**
 * @param {object[]} rows
 * @param {{ programme?: string, intake?: string, status?: string, keyword?: string, problemsOnly?: boolean, severity?: string, alertType?: string }} filters
 */
export function filterMonitorRows(rows, filters = {}) {
  let list = [...rows]
  if (filters.programme) {
    list = list.filter((r) => r.programme === filters.programme)
  }
  if (filters.intake) {
    list = list.filter((r) => String(r.intake) === String(filters.intake))
  }
  if (filters.status) {
    list = list.filter((r) => r.status === filters.status)
  }
  if (filters.keyword) {
    const kw = String(filters.keyword).toLowerCase()
    list = list.filter(
      (r) =>
        String(r.studentId || '')
          .toLowerCase()
          .includes(kw) ||
        String(r.studentName || '')
          .toLowerCase()
          .includes(kw),
    )
  }
  if (filters.problemsOnly || filters.severity || filters.alertType) {
    list = list.filter((r) => {
      if (r.status === 'normal' && !(r.issues && r.issues.length)) return false
      const issues = r.issues?.length
        ? r.issues
        : r.status && r.status !== 'normal'
          ? [r.status]
          : []
      if (filters.alertType && !issues.includes(filters.alertType)) return false
      if (filters.severity) {
        const highTypes = ['notRegistered', 'creditBelowMin', 'creditAtMax', 'creditAboveMax']
        const isHigh =
          highTypes.some((t) => issues.includes(t)) ||
          r.status === 'notRegistered' ||
          r.status === 'creditLow' ||
          r.status === 'creditHigh'
        if (filters.severity === 'high' && !isHigh) return false
        if (filters.severity === 'medium' && isHigh) return false
      }
      return true
    })
  }
  return list
}
