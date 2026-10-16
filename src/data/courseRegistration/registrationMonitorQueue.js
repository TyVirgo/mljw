import { ref } from 'vue'
import { formatIntakeBatch } from '../intakeSets.js'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'
import {
  deriveMonitorIssues,
  getMonitorGraduationInsight,
  getGraduationGeCompletionPct,
  getGraduationMeCompletionPct,
  getTermGeCompletionPct,
  getTermMeCompletionPct,
  getGraduationMandatoryCompletionPct,
} from './monitorCreditInsights.js'

const DEFAULT_ELECTIVE_CAPS = { geMax: 6, meMax: 22 }

/** Demo：必修毕业学分默认要求 */
const DEFAULT_MANDATORY_GRADUATION = { current: 48, required: 72 }

/** Demo：毕业 GE 文/商/理/AI与开放选修（首次选课已选≡本学期；四类和 16 < 毕业总分 18） */
const DEFAULT_GRADUATION_GE = {
  humanities: 0,
  business: 3,
  science: 0,
  aiOpen: 0,
  required: { humanities: 5, business: 5, science: 4, aiOpen: 2 },
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

function withTermGe(row, overrides = {}) {
  return {
    ...row,
    remindCount: Number(row.remindCount) || 0,
    graduationMeProgress: row.graduationMeProgress || { ...DEFAULT_GRADUATION_ME },
    graduationMandatoryProgress: row.graduationMandatoryProgress || {
      ...DEFAULT_MANDATORY_GRADUATION,
    },
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
    graduationMandatoryProgress: { current: 48, required: 72 },
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
      graduationMandatoryProgress: { current: 12, required: 72 },
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
      // 少数突破：学期 GE 7/6
      termElectiveProgress: { ge: 7, me: 8, ...DEFAULT_ELECTIVE_CAPS },
      graduationGeProgress: {
        humanities: 5,
        business: 5,
        science: 4,
        aiOpen: 2,
        required: { ...DEFAULT_GRADUATION_GE.required },
      },
      graduationMandatoryProgress: { current: 60, required: 72 },
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
      graduationMandatoryProgress: { current: 0, required: 72 },
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
      graduationMandatoryProgress: { current: 68, required: 72 },
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
    graduationMandatoryProgress: { current: 40, required: 72 },
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
      graduationMandatoryProgress: { current: 18, required: 72 },
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

/** 补足演示至 25 行（mon-008 … mon-025）；多数完成度 ≤100%，仅少数突破 */
function buildExtraMonitorDemoRows() {
  const seeds = [
    { n: 8, studentId: 'SWE2309001', studentName: 'Tan Wei Ming', programme: 'SWE', intake: '2309', credits: 17, status: 'normal', ge: [5, 4, 3, 2], meTerm: { group4of3: 2, group3of2: 2, group2of1: 1, ordinary: 1 }, termGe: 5, termMe: 6 },
    { n: 9, studentId: 'COS2409012', studentName: 'Wong Mei Hua', programme: 'COS', intake: '2409', credits: 14, status: 'creditLow', ge: [4, 3, 2, 1], meTerm: { group4of3: 1, group3of2: 1, group2of1: 0, ordinary: 0 }, termGe: 5, termMe: 4 },
    { n: 10, studentId: 'DSA2409015', studentName: 'Lim Jun Hao', programme: 'DSA', intake: '2409', credits: 18, status: 'normal', ge: [5, 5, 4, 2], meTerm: { group4of3: 2, group3of2: 2, group2of1: 2, ordinary: 1 }, termGe: 6, termMe: 8 },
    { n: 11, studentId: 'AIT2309018', studentName: 'Nurul Afiqah', programme: 'AIT', intake: '2309', credits: 12, status: 'g1CategoryLow', ge: [2, 2, 1, 0], meTerm: { group4of3: 1, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 3, termMe: 2 },
    // 少数突破：毕业 GE 17/16 + 学期 GE 7/6
    { n: 12, studentId: 'SWE2409005', studentName: 'Chong Wei Jie', programme: 'SWE', intake: '2409', credits: 20, status: 'creditHigh', ge: [5, 5, 4, 3], meTerm: { group4of3: 3, group3of2: 2, group2of1: 2, ordinary: 1 }, termGe: 7, termMe: 10 },
    { n: 13, studentId: 'COS2504008', studentName: 'Emily Tan', programme: 'COS', intake: '2504', credits: 6, status: 'creditLow', tags: ['freshman'], ge: [2, 0, 0, 0], meTerm: { group4of3: 1, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 2, termMe: 2 },
    { n: 14, studentId: 'DSA2309020', studentName: 'Kumar Rajesh', programme: 'DSA', intake: '2309', credits: 15, status: 'normal', ge: [5, 4, 3, 2], meTerm: { group4of3: 2, group3of2: 1, group2of1: 1, ordinary: 1 }, termGe: 5, termMe: 7 },
    { n: 15, studentId: 'AIT2409025', studentName: 'Sarah Abdullah', programme: 'AIT', intake: '2409', credits: 0, status: 'notRegistered', tags: ['freshman'], ge: [0, 0, 0, 0], meTerm: { group4of3: 0, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 0, termMe: 0 },
    { n: 16, studentId: 'SWE2209011', studentName: 'Jason Ong', programme: 'SWE', intake: '2209', credits: 16, status: 'g1CategoryLow', ge: [3, 3, 2, 1], meTerm: { group4of3: 1, group3of2: 1, group2of1: 1, ordinary: 0 }, termGe: 4, termMe: 5 },
    { n: 17, studentId: 'COS2409030', studentName: 'Amira Zulkifli', programme: 'COS', intake: '2409', credits: 13, status: 'normal', ge: [5, 4, 3, 2], meTerm: { group4of3: 2, group3of2: 1, group2of1: 1, ordinary: 0 }, termGe: 5, termMe: 6 },
    { n: 18, studentId: 'DSA2504010', studentName: 'Benjamin Chua', programme: 'DSA', intake: '2504', credits: 9, status: 'creditLow', tags: ['freshman'], ge: [3, 1, 0, 0], meTerm: { group4of3: 1, group3of2: 1, group2of1: 0, ordinary: 0 }, termGe: 3, termMe: 3 },
    { n: 19, studentId: 'AIT2309022', studentName: 'Fatimah Yusof', programme: 'AIT', intake: '2309', credits: 19, status: 'creditHigh', ge: [5, 5, 4, 2], meTerm: { group4of3: 3, group3of2: 2, group2of1: 2, ordinary: 2 }, termGe: 6, termMe: 11 },
    { n: 20, studentId: 'SWE2409019', studentName: 'Daniel Lim', programme: 'SWE', intake: '2409', credits: 14, status: 'prerequisiteMissing', ge: [4, 4, 3, 2], meTerm: { group4of3: 1, group3of2: 1, group2of1: 1, ordinary: 1 }, termGe: 6, termMe: 5 },
    { n: 21, studentId: 'COS2309014', studentName: 'Goh Hui Min', programme: 'COS', intake: '2309', credits: 18, status: 'normal', ge: [5, 5, 4, 2], meTerm: { group4of3: 2, group3of2: 2, group2of1: 1, ordinary: 1 }, termGe: 6, termMe: 8 },
    { n: 22, studentId: 'DSA2409028', studentName: 'Muhammad Faiz', programme: 'DSA', intake: '2409', credits: 11, status: 'creditLow', ge: [3, 2, 2, 1], meTerm: { group4of3: 1, group3of2: 0, group2of1: 0, ordinary: 0 }, termGe: 4, termMe: 3 },
    { n: 23, studentId: 'AIT2504016', studentName: 'Chloe Ng', programme: 'AIT', intake: '2504', credits: 7, status: 'creditLow', tags: ['freshman'], ge: [2, 1, 0, 0], meTerm: { group4of3: 0, group3of2: 1, group2of1: 0, ordinary: 0 }, termGe: 2, termMe: 2 },
    { n: 24, studentId: 'SWE2309027', studentName: 'Arjun Patel', programme: 'SWE', intake: '2309', credits: 16, status: 'normal', ge: [5, 4, 4, 2], meTerm: { group4of3: 2, group3of2: 2, group2of1: 1, ordinary: 1 }, termGe: 5, termMe: 7 },
    { n: 25, studentId: 'COS2409035', studentName: 'Yap Xin Yi', programme: 'COS', intake: '2409', credits: 15, status: 'normal', ge: [5, 4, 3, 2], meTerm: { group4of3: 2, group3of2: 1, group2of1: 1, ordinary: 1 }, termGe: 5, termMe: 6 },
  ]
  return seeds.map((s) => {
    const freshman = (s.tags || []).includes('freshman')
    let mandatoryCurrent = 36 + (s.n % 7) * 4
    if (freshman || s.status === 'notRegistered') mandatoryCurrent = Math.min(s.credits * 2, 18)
    if (s.intake === '2209') mandatoryCurrent = 70
    if (s.status === 'creditHigh') mandatoryCurrent = 72
    if (s.n === 12) mandatoryCurrent = 72
    return withTermGe(
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
          me: Math.min(s.termMe, DEFAULT_ELECTIVE_CAPS.meMax),
          ...DEFAULT_ELECTIVE_CAPS,
        },
        graduationGeProgress: {
          humanities: s.ge[0],
          business: s.ge[1],
          science: s.ge[2],
          aiOpen: s.ge[3],
          required: { ...DEFAULT_GRADUATION_GE.required },
        },
        graduationMandatoryProgress: { current: mandatoryCurrent, required: 72 },
        schedule:
          s.credits > 0
            ? [{ day: 'Mon', start: 10, end: 12, course: 'COMP201' }]
            : [],
        issues: s.status === 'notRegistered' ? ['notRegistered'] : [],
        history: [],
      },
      s.meTerm,
    )
  })
}

export const registrationMonitorQueue = ref(
  initialMonitorRows.map((item) => ({ ...item, remindCount: Number(item.remindCount) || 0 })),
)

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

const RISK_PCT_THRESHOLD = 50

/**
 * 监控顶部风险人数：各完成度严格 &lt;50%（默认全量队列）
 * @param {object[]} [rows]
 */
export function getMonitorRiskStats(rows = registrationMonitorQueue.value) {
  const list = rows || []
  let geGradBelow = 0
  let geTermBelow = 0
  let meGradBelow = 0
  let meTermBelow = 0
  let mandatoryBelow = 0
  for (const row of list) {
    if (getGraduationGeCompletionPct(row) < RISK_PCT_THRESHOLD) geGradBelow += 1
    if (getTermGeCompletionPct(row) < RISK_PCT_THRESHOLD) geTermBelow += 1
    if (getGraduationMeCompletionPct(row) < RISK_PCT_THRESHOLD) meGradBelow += 1
    if (getTermMeCompletionPct(row) < RISK_PCT_THRESHOLD) meTermBelow += 1
    if (getGraduationMandatoryCompletionPct(row) < RISK_PCT_THRESHOLD) mandatoryBelow += 1
  }
  return { geGradBelow, geTermBelow, meGradBelow, meTermBelow, mandatoryBelow }
}

/**
 * 确认发送提醒后累计次数
 * @param {string} rowId
 * @returns {number} 新次数；未找到返回 -1
 */
export function incrementMonitorRemindCount(rowId) {
  const idx = registrationMonitorQueue.value.findIndex((r) => r.id === rowId)
  if (idx < 0) return -1
  const row = registrationMonitorQueue.value[idx]
  const next = (Number(row.remindCount) || 0) + 1
  registrationMonitorQueue.value[idx] = { ...row, remindCount: next }
  return next
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function parseOptionalPctBound(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * @param {number} pct
 * @param {number|null} min
 * @param {number|null} max
 */
function pctInRange(pct, min, max) {
  if (min != null && pct < min) return false
  if (max != null && pct > max) return false
  return true
}

/**
 * @param {object[]} rows
 * @param {{
 *   programme?: string,
 *   intake?: string,
 *   studentName?: string,
 *   geGradCompletionMin?: string|number,
 *   geGradCompletionMax?: string|number,
 *   meGradCompletionMin?: string|number,
 *   meGradCompletionMax?: string|number,
 *   mandatoryGradCompletionMin?: string|number,
 *   mandatoryGradCompletionMax?: string|number,
 * }} filters
 */
export function filterMonitorRows(rows, filters = {}) {
  let list = [...rows]
  if (filters.programme) {
    const p = String(filters.programme).trim().toLowerCase()
    list = list.filter((r) => String(r.programme || '').toLowerCase().includes(p))
  }
  if (filters.intake) {
    const want = formatIntakeBatch(filters.intake)
    list = list.filter((r) => formatIntakeBatch(r.intake) === want)
  }
  if (filters.studentName) {
    const kw = String(filters.studentName).trim().toLowerCase()
    list = list.filter((r) => String(r.studentName || '').toLowerCase().includes(kw))
  }
  const geMin = parseOptionalPctBound(filters.geGradCompletionMin)
  const geMax = parseOptionalPctBound(filters.geGradCompletionMax)
  const meMin = parseOptionalPctBound(filters.meGradCompletionMin)
  const meMax = parseOptionalPctBound(filters.meGradCompletionMax)
  const mandMin = parseOptionalPctBound(filters.mandatoryGradCompletionMin)
  const mandMax = parseOptionalPctBound(filters.mandatoryGradCompletionMax)
  if (geMin != null || geMax != null) {
    list = list.filter((r) => pctInRange(getGraduationGeCompletionPct(r), geMin, geMax))
  }
  if (meMin != null || meMax != null) {
    list = list.filter((r) => pctInRange(getGraduationMeCompletionPct(r), meMin, meMax))
  }
  if (mandMin != null || mandMax != null) {
    list = list.filter((r) => pctInRange(getGraduationMandatoryCompletionPct(r), mandMin, mandMax))
  }
  return list
}
