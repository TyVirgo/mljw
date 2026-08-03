import { ref, computed } from 'vue'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'

const initialMonitorRows = [
  {
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
    g1Progress: { humanities: 4, business: 6, required: { humanities: 6, business: 6 } },
    schedule: [
      { day: 'Mon', start: 10, end: 12, course: 'COMP201' },
      { day: 'Wed', start: 14, end: 16, course: 'COMP3192' },
    ],
    issues: [],
    history: [{ at: '02-Sep-2025', action: 'Registered COMP201 sec 01' }],
  },
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
    g1Progress: { humanities: 0, business: 3, required: { humanities: 6, business: 6 } },
    schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
    issues: ['creditBelowMin'],
    history: [{ at: '01-Sep-2025', action: 'Registered MPU3183 sec 01' }],
  },
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
    g1Progress: { humanities: 6, business: 6, required: { humanities: 6, business: 6 } },
    schedule: [
      { day: 'Mon', start: 10, end: 12, course: 'COMP201' },
      { day: 'Wed', start: 14, end: 16, course: 'COMP3192' },
      { day: 'Fri', start: 14, end: 16, course: 'MATH201' },
    ],
    issues: ['creditAtMax'],
    history: [{ at: '28-Aug-2025', action: 'Auto-imported (resumption)' }],
  },
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
    g1Progress: { humanities: 0, business: 0, required: { humanities: 6, business: 6 } },
    schedule: [],
    issues: ['notRegistered'],
    history: [],
  },
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
    g1Progress: { humanities: 2, business: 6, required: { humanities: 6, business: 6 } },
    schedule: [{ day: 'Tue', start: 9, end: 12, course: 'MPU3183' }],
    issues: ['g1HumanitiesLow'],
    history: [{ at: '03-Sep-2025', action: 'Warning: G1 humanities shortfall' }],
  },
  {
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
    g1Progress: { humanities: 4, business: 4, required: { humanities: 6, business: 6 } },
    schedule: [{ day: 'Thu', start: 14, end: 16, course: 'COMP101' }],
    issues: ['prerequisiteMissing'],
    history: [{ at: '04-Sep-2025', action: 'Missing prerequisite for COMP3192' }],
  },
  {
    id: 'mon-007',
    studentId: 'AIT2504003',
    studentName: 'Hassan Ibrahim',
    programme: 'AIT',
    intake: '2504',
    credits: 14,
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
    status: 'normal',
    tags: ['freshman', 'transferCredit'],
    cgpa: 3.55,
    g1Progress: { humanities: 3, business: 5, required: { humanities: 6, business: 6 } },
    schedule: [
      { day: 'Mon', start: 10, end: 12, course: 'COMP201' },
      { day: 'Tue', start: 9, end: 12, course: 'MPU3183' },
    ],
    issues: [],
    history: [{ at: '01-Sep-2025', action: 'Transfer credit applied' }],
  },
]

export const registrationMonitorQueue = ref(initialMonitorRows.map((item) => ({ ...item })))

export function getMonitorStats(rows = registrationMonitorQueue.value) {
  const total = rows.length
  const participated = rows.filter((r) => r.credits > 0).length
  const avgCredits = participated
    ? (rows.reduce((sum, r) => sum + r.credits, 0) / participated).toFixed(1)
    : '0.0'
  const belowMin = rows.filter((r) => r.credits > 0 && r.credits < r.creditMin).length
  const aboveMax = rows.filter((r) => r.credits > r.creditMax).length
  const g1Risk = rows.filter((r) => r.status === 'g1CategoryLow').length
  return { total, participated, avgCredits, belowMin, aboveMax, g1Risk }
}

export function filterMonitorRows(rows, filters = {}) {
  let list = [...rows]
  if (filters.programme) {
    list = list.filter((r) => r.programme.toLowerCase().includes(filters.programme.toLowerCase()))
  }
  if (filters.intake) {
    list = list.filter((r) => r.intake.includes(filters.intake))
  }
  if (filters.status) {
    list = list.filter((r) => r.status === filters.status)
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.studentId.toLowerCase().includes(kw) || r.studentName.toLowerCase().includes(kw),
    )
  }
  if (filters.problemsOnly || filters.severity || filters.alertType) {
    const statusToAlert = {
      creditLow: 'creditBelowMin',
      creditHigh: 'creditAtMax',
      g1CategoryLow: 'g1CategoryShortfall',
      prerequisiteMissing: 'prerequisiteMissing',
      notRegistered: 'notRegistered',
    }
    const highTypes = ['notRegistered', 'creditBelowMin', 'creditAtMax', 'creditAboveMax']
    list = list.filter((row) => {
      const alertTypes = row.issues?.length
        ? row.issues
        : row.status === 'normal'
          ? []
          : [statusToAlert[row.status] || row.status]
      if (!alertTypes.length) return false
      if (filters.alertType && !alertTypes.includes(filters.alertType)) return false
      if (filters.severity) {
        const severity = alertTypes.some((t) => highTypes.includes(t)) ? 'high' : 'medium'
        if (severity !== filters.severity) return false
      }
      return true
    })
  }
  return list
}

export function getMonitorRowById(id) {
  return registrationMonitorQueue.value.find((item) => item.id === id) || null
}

export const monitorStatusOptions = [
  'normal',
  'creditLow',
  'creditHigh',
  'g1CategoryLow',
  'prerequisiteMissing',
  'notRegistered',
]
