import { ref } from 'vue'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'
import { deriveMonitorIssues, getMonitorGraduationInsight } from './monitorCreditInsights.js'

const DEFAULT_ELECTIVE_CAPS = { geMax: 18, meMax: 22 }

/** Demo：毕业 GE 文/商/理/AI与开放选修（首次选课已选≡本学期） */
const DEFAULT_GRADUATION_GE = {
  humanities: 0,
  business: 3,
  science: 0,
  aiOpen: 0,
  required: { humanities: 12, business: 12, science: 12, aiOpen: 12 },
}

const DEFAULT_GRADUATION_ME = {
  group4of3: 7,
  group3of2: 5,
  group2of1: 3,
  ordinary: 3,
  required: { group4of3: 16, group3of2: 12, group2of1: 8, ordinary: 12 },
}

/** Demo：本学期 ME 课程组（8+6+4+4=22） */
const DEFAULT_TERM_GE_CATEGORIES = {
  group4of3: 2,
  group3of2: 1,
  group2of1: 1,
  ordinary: 1,
  required: { group4of3: 8, group3of2: 6, group2of1: 4, ordinary: 4 },
}

const HIGH_ALERT_TYPES = [
  'notRegistered',
  'creditAtMax',
  'creditAboveMax',
  'graduationCatchUpRisk',
  'graduationNearHalfRisk',
]

function withTermGe(row, overrides = {}) {
  return {
    ...row,
    graduationMeProgress: row.graduationMeProgress || { ...DEFAULT_GRADUATION_ME },
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
    { group4of3: 2, group3of2: 1, group2of1: 0, ordinary: 0 },
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
    { group4of3: 2, group3of2: 2, group2of1: 2, ordinary: 0 },
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
    { group4of3: 0, group3of2: 0, group2of1: 0, ordinary: 0 },
  ),
  withTermGe(
    {
      id: 'mon-005',
      studentId: 'DSA2409008',
      studentName: 'Raj Kumar',
      programme: 'DSA',
      intake: '2209',
      credits: 14,
      creditMin: LONG_SEMESTER_CREDIT_MIN,
      creditMax: LONG_SEMESTER_CREDIT_MAX,
      status: 'g1CategoryLow',
      tags: [],
      cgpa: 3.01,
      termElectiveProgress: { ge: 2, me: 6, ...DEFAULT_ELECTIVE_CAPS },
      graduationGeProgress: {
        humanities: 2,
        business: 4,
        science: 1,
        aiOpen: 0,
        required: { ...DEFAULT_GRADUATION_GE.required },
      },
      graduationMeProgress: {
        group4of3: 4,
        group3of2: 4,
        group2of1: 2,
        ordinary: 0,
        required: { group4of3: 16, group3of2: 12, group2of1: 8, ordinary: 12 },
      },
      schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
      issues: ['g1HumanitiesLow'],
      history: [{ at: '03-Sep-2025', action: 'Warning: GE shortfall' }],
    },
    { group4of3: 1, group3of2: 1, group2of1: 0, ordinary: 0 },
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
    { group4of3: 1, group3of2: 1, group2of1: 1, ordinary: 0 },
  ),
  ...buildExtraMonitorDemoRows(),
]

/** 补足演示至 25 行（mon-008 … mon-025） */
function buildExtraMonitorDemoRows() {
  const seeds = [
    { n: 8, studentId: 'SWE2309001', studentName: 'Tan Wei Ming', programme: 'SWE', intake: '2309', credits: 17, status: 'normal', ge: [6, 5, 4, 3], meTerm: { group4of3: 2, group3of2: 2, group2of1: 1, ordinary: 1 }, termGe: 11, termMe: 6 },
    { n: 9, studentId: 'COS2409012', studentName: 'Wong Mei Hua', programme: 'COS', intake: '2409', credits: 14, status: 'creditLow', ge: [4, 3, 2, 1], meTerm: { group4of3: 1, group3of2: 1, group2of1: 0, ordinary: 0 }, termGe: 5, termMe: 4 },
    { n: 10, studentId: 'DSA2409015', studentName: 'Lim Jun Hao', programme: 'DSA', intake: '2409', credits: 18, status: 'normal', ge: [8, 6, 5, 4], meTerm: { group4of3: 2, group3of2: 2, group2of1: 2, ordinary: 1 }, termGe: 10, termMe: 8 },
    { n: 11, studentId: 'AIT2309018', studentName: 'Nurul Afiqah', programme: 'AIT', intake: '2309', credits: 12, status: 'g1CategoryLow', ge: [2, 2, 1, 0], meTerm: { group4of3: 1, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 3, termMe: 2 },
    { n: 12, studentId: 'SWE2409005', studentName: 'Chong Wei Jie', programme: 'SWE', intake: '2409', credits: 20, status: 'creditHigh', ge: [9, 8, 7, 6], meTerm: { group4of3: 3, group3of2: 2, group2of1: 2, ordinary: 1 }, termGe: 12, termMe: 10 },
    { n: 13, studentId: 'COS2504008', studentName: 'Emily Tan', programme: 'COS', intake: '2504', credits: 6, status: 'creditLow', tags: ['freshman'], ge: [2, 0, 0, 0], meTerm: { group4of3: 1, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 2, termMe: 2 },
    { n: 14, studentId: 'DSA2309020', studentName: 'Kumar Rajesh', programme: 'DSA', intake: '2309', credits: 15, status: 'normal', ge: [7, 6, 5, 4], meTerm: { group4of3: 2, group3of2: 1, group2of1: 1, ordinary: 1 }, termGe: 8, termMe: 7 },
    { n: 15, studentId: 'AIT2409025', studentName: 'Sarah Abdullah', programme: 'AIT', intake: '2409', credits: 0, status: 'notRegistered', tags: ['freshman'], ge: [0, 0, 0, 0], meTerm: { group4of3: 0, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 0, termMe: 0 },
    { n: 16, studentId: 'SWE2209011', studentName: 'Jason Ong', programme: 'SWE', intake: '2209', credits: 16, status: 'g1CategoryLow', ge: [3, 3, 2, 1], meTerm: { group4of3: 1, group3of2: 1, group2of1: 1, ordinary: 0 }, termGe: 4, termMe: 5 },
    { n: 17, studentId: 'COS2409030', studentName: 'Amira Zulkifli', programme: 'COS', intake: '2409', credits: 13, status: 'normal', ge: [5, 4, 4, 3], meTerm: { group4of3: 2, group3of2: 1, group2of1: 1, ordinary: 0 }, termGe: 7, termMe: 6 },
    { n: 18, studentId: 'DSA2504010', studentName: 'Benjamin Chua', programme: 'DSA', intake: '2504', credits: 9, status: 'creditLow', tags: ['freshman'], ge: [3, 1, 0, 0], meTerm: { group4of3: 1, group3of2: 1, group2of1: 0, ordinary: 0 }, termGe: 3, termMe: 3 },
    { n: 19, studentId: 'AIT2309022', studentName: 'Fatimah Yusof', programme: 'AIT', intake: '2309', credits: 19, status: 'creditHigh', ge: [10, 9, 8, 5], meTerm: { group4of3: 3, group3of2: 2, group2of1: 2, ordinary: 2 }, termGe: 14, termMe: 11 },
    { n: 20, studentId: 'SWE2409019', studentName: 'Daniel Lim', programme: 'SWE', intake: '2409', credits: 14, status: 'prerequisiteMissing', ge: [4, 4, 3, 2], meTerm: { group4of3: 1, group3of2: 1, group2of1: 1, ordinary: 1 }, termGe: 6, termMe: 5 },
    { n: 21, studentId: 'COS2309014', studentName: 'Goh Hui Min', programme: 'COS', intake: '2309', credits: 18, status: 'normal', ge: [8, 7, 6, 5], meTerm: { group4of3: 2, group3of2: 2, group2of1: 1, ordinary: 1 }, termGe: 9, termMe: 8 },
    { n: 22, studentId: 'DSA2409028', studentName: 'Muhammad Faiz', programme: 'DSA', intake: '2409', credits: 11, status: 'creditLow', ge: [3, 2, 2, 1], meTerm: { group4of3: 1, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 4, termMe: 3 },
    { n: 23, studentId: 'AIT2504016', studentName: 'Chloe Ng', programme: 'AIT', intake: '2504', credits: 7, status: 'creditLow', tags: ['freshman'], ge: [2, 1, 0, 0], meTerm: { group4of3: 0, group3of2: 1, group2of1: 0, ordinary: 0 }, termGe: 2, termMe: 2 },
    { n: 24, studentId: 'SWE2309027', studentName: 'Arjun Patel', programme: 'SWE', intake: '2309', credits: 16, status: 'normal', ge: [6, 6, 5, 4], meTerm: { group4of3: 2, group3of2: 2, group2of1: 1, ordinary: 1 }, termGe: 8, termMe: 7 },
    { n: 25, studentId: 'COS2409035', studentName: 'Yap Xin Yi', programme: 'COS', intake: '2409', credits: 15, status: 'normal', ge: [5, 5, 4, 3], meTerm: { group4of3: 2, group3of2: 1, group2of1: 1, ordinary: 1 }, termGe: 7, termMe: 6 },
  ]
  return seeds.map((s) =>
    withTermGe(
      {
        id: `mon-${String(s.n).padStart(3, '0')}`,
        studentId: s.studentId,
        studentName: s.studentName,
        programme: s.programme,
        intake: s.intake,
        credits: s.credits,
        creditMin: LONG_SEMESTER_CREDIT_MIN,
        creditMax: LONG_SEMESTER_CREDIT_MAX,
        status: s.status,
        tags: s.tags || [],
        cgpa: s.credits > 0 ? 2.8 + (s.n % 10) * 0.07 : null,
        termElectiveProgress: {
          ge: s.termGe,
          me: s.termMe,
          ...DEFAULT_ELECTIVE_CAPS,
        },
        graduationGeProgress: {
          humanities: s.ge[0],
          business: s.ge[1],
          science: s.ge[2],
          aiOpen: s.ge[3],
          required: { ...DEFAULT_GRADUATION_GE.required },
        },
        schedule:
          s.credits > 0
            ? [{ day: 'Mon', start: 10, end: 12, course: 'COMP201' }]
            : [],
        issues: s.status === 'notRegistered' ? ['notRegistered'] : [],
        history: [],
      },
      s.meTerm,
    ),
  )
}

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
  const earnedSum = rows.reduce((sum, r) => sum + (getMonitorGraduationInsight(r).earned || 0), 0)
  const avgCredits =
    total === 0 ? 0 : Math.round((earnedSum / total) * 10) / 10
  const electiveRisk = rows.filter((r) => {
    const issues = deriveMonitorIssues(r)
    return (
      issues.includes('termGeShort') ||
      issues.includes('termMeShort') ||
      issues.includes('termCatShort') ||
      issues.includes('graduationGap') ||
      issues.includes('graduationNearHalfRisk') ||
      issues.includes('graduationCatchUpRisk')
    )
  }).length
  return { total, participated, avgCredits, electiveRisk, g1Risk: electiveRisk }
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
      const issues = deriveMonitorIssues(r)
      if (!issues.length) return false
      if (filters.alertType && !issues.includes(filters.alertType)) return false
      if (filters.severity) {
        const isHigh = issues.some((t) => HIGH_ALERT_TYPES.includes(t))
        if (filters.severity === 'high' && !isHigh) return false
        if (filters.severity === 'medium' && isHigh) return false
      }
      return true
    })
  }
  return list
}
