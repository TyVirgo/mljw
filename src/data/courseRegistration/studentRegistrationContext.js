import { computed } from 'vue'
import { getActiveBatch } from './registrationBatches.js'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import {
  cartTotalCredits,
  registrationCart,
  getStudentProfileFields,
  studentConfirmedCourses,
} from './studentRegistrationStore.js'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'
import { normalizeRegistrationType } from './registrationTypes.js'

const DEFAULT_G1 = {
  humanities: 4,
  business: 3,
  required: { humanities: 6, business: 6 },
}

export function getStudentMonitorRow(studentId = getStudentProfileFields().studentId) {
  const existing = registrationMonitorQueue.value.find((row) => row.studentId === studentId)
  if (existing) return existing
  const batch = getActiveBatch()
  const confirmedCredits = studentConfirmedCourses.value.reduce((sum, item) => sum + item.credits, 0)
  return {
    studentId,
    credits: confirmedCredits,
    creditMin: batch?.creditMin ?? LONG_SEMESTER_CREDIT_MIN,
    creditMax: batch?.creditMax ?? LONG_SEMESTER_CREDIT_MAX,
    cgpa: 3.35,
    g1Progress: { ...DEFAULT_G1 },
    schedule: [],
    issues: confirmedCredits ? [] : ['notRegistered'],
    status: confirmedCredits ? 'normal' : 'notRegistered',
  }
}

export function getStudentCreditSummary(studentId = getStudentProfileFields().studentId) {
  const row = getStudentMonitorRow(studentId)
  const pending = cartTotalCredits.value
  return {
    enrolled: row.credits,
    pending,
    total: row.credits + pending,
    min: row.creditMin,
    max: row.creditMax,
    cartCount: registrationCart.value.length,
  }
}

export function getActiveRoundPhase(batch = getActiveBatch()) {
  if (!batch) return { key: 'closed', labelKey: 'courseRegistration.student.roundClosed' }
  // 原型演示：进行中批次默认展示正选轮次
  if (batch.status === 'active') {
    return { key: 'main', labelKey: 'courseRegistration.student.roundMain' }
  }
  if (batch.status === 'draft') {
    return { key: 'preselect', labelKey: 'courseRegistration.student.roundPreselect' }
  }
  return { key: 'closed', labelKey: 'courseRegistration.student.roundClosed' }
}

export function getRoundTimeline(batch = getActiveBatch(), highlightKey) {
  if (!batch?.rounds) return []
  const active = highlightKey || getActiveRoundPhase(batch).key
  const steps = [
    {
      key: 'preselect',
      labelKey: 'courseRegistration.batch.roundPreselect',
      range: batch.rounds.preselect,
    },
    {
      key: 'main',
      labelKey: 'courseRegistration.batch.roundMain',
      range: batch.rounds.main,
    },
    {
      key: 'supplement',
      labelKey: 'courseRegistration.batch.roundSupplement',
      range: batch.rounds.supplement,
    },
  ]
  if (batch.addDropWindow?.start) {
    steps.push({
      key: 'addDrop',
      labelKey: 'courseRegistration.batch.addDropWindow',
      range: batch.addDropWindow,
    })
  }
  return steps.map((step) => ({
    ...step,
    active: step.key === active,
    rangeText: step.range ? `${step.range.start} – ${step.range.end}` : '',
  }))
}

export function filterCoursesByRound(courses, roundKey) {
  if (roundKey === 'supplement') {
    return courses.filter((item) => item.remainingCapacity > 0)
  }
  return [...courses]
}

export function getRoundPanelNoteKey(roundKey) {
  const map = {
    preselect: 'courseRegistration.student.roundPanel.preselect',
    main: 'courseRegistration.student.roundPanel.main',
    supplement: 'courseRegistration.student.roundPanel.supplement',
    addDrop: 'courseRegistration.student.roundPanel.addDrop',
  }
  return map[roundKey] || 'courseRegistration.student.registerHint'
}

export function filterStudentCourseList(courses, filters = {}) {
  let list = [...courses]
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (item) =>
        item.code.toLowerCase().includes(kw) || item.name.toLowerCase().includes(kw),
    )
  }
  if (filters.type) {
    const target = normalizeRegistrationType(filters.type)
    list = list.filter((item) => normalizeRegistrationType(item.type) === target)
  }
  if (filters.availability === 'open') {
    list = list.filter((item) => item.remainingCapacity > 0)
  }
  if (filters.availability === 'full') {
    list = list.filter((item) => item.remainingCapacity <= 0)
  }
  if (filters.eligibility === 'eligible') {
    list = list.filter((item) => item.eligibility?.eligible)
  }
  if (filters.eligibility === 'blocked') {
    list = list.filter((item) => item.eligibility && !item.eligibility.eligible)
  }
  return list
}

export function getStudentG1Bars(row = getStudentMonitorRow()) {
  if (!row?.g1Progress) return []
  const { humanities, business, required } = row.g1Progress
  return [
    { key: 'humanities', current: humanities, required: required.humanities },
    { key: 'business', current: business, required: required.business },
  ]
}

export const studentCreditSummary = computed(() => getStudentCreditSummary())
