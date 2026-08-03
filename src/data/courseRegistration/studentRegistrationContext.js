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

/**
 * 管理端选课结果顶栏「预计需修 GE」demo（对齐设计图：总量 + 文/商/理占比）
 * 正式环境可替换为接口数据。
 */
export const DEMO_GE_DEMAND_STATS = {
  total: 1215,
  categories: [
    { key: 'humanities', shortKey: 'courseRegistration.student.geDemand.short.humanities', count: 255, percent: 21 },
    { key: 'business', shortKey: 'courseRegistration.student.geDemand.short.business', count: 277, percent: 23 },
    { key: 'science', shortKey: 'courseRegistration.student.geDemand.short.science', count: 683, percent: 56 },
  ],
}

export function getGeDemandStats() {
  return DEMO_GE_DEMAND_STATS
}

/** Demo：培养方案学分要求（累计） */
export const DEMO_PROGRAMME_CREDIT_TARGETS = {
  mandatoryRequired: 72,
  electiveRequired: 36,
  meRequired: 24,
  geRequired: 12,
}

/**
 * Demo：入学以来、当前确认课之外的已修学分。
 * 与 DEMO_CONFIRMED（约 ME14 + GE6）合计后故意未满：
 * ME ≈22/24、GE ≈8/12、选修合计 ≈30/36，便于工具栏展示「还差」。
 */
export const DEMO_PRIOR_EARNED_CREDITS = {
  mandatory: 54,
  me: 8,
  ge: 2,
}

export function creditBucketForType(type) {
  return normalizeRegistrationType(type) === 'Mandatory' ? 'mandatory' : 'elective'
}

export function sumConfirmedCreditsByKind(courses = studentConfirmedCourses.value) {
  return (courses || []).reduce(
    (acc, item) => {
      const kind = normalizeRegistrationType(item.type)
      const credits = Number(item.credits) || 0
      if (kind === 'Mandatory') acc.mandatory += credits
      else if (kind === 'GE') acc.ge += credits
      else acc.me += credits
      return acc
    },
    { mandatory: 0, me: 0, ge: 0 },
  )
}

export function sumConfirmedCreditsByBucket(courses = studentConfirmedCourses.value) {
  const byKind = sumConfirmedCreditsByKind(courses)
  return {
    mandatory: byKind.mandatory,
    elective: byKind.me + byKind.ge,
  }
}

/**
 * 培养方案向：必修/选修/ME/GE 已修 vs 要求
 * 已修 = 历史累计 + 当前已确认课
 */
export function getProgrammeCreditProgress() {
  const confirmed = sumConfirmedCreditsByKind()
  const mandatoryEarned = DEMO_PRIOR_EARNED_CREDITS.mandatory + confirmed.mandatory
  const meEarned = DEMO_PRIOR_EARNED_CREDITS.me + confirmed.me
  const geEarned = DEMO_PRIOR_EARNED_CREDITS.ge + confirmed.ge
  const electiveEarned = meEarned + geEarned
  const {
    mandatoryRequired,
    electiveRequired,
    meRequired,
    geRequired,
  } = DEMO_PROGRAMME_CREDIT_TARGETS
  return {
    mandatoryRequired,
    electiveRequired,
    meRequired,
    geRequired,
    mandatoryEarned,
    electiveEarned,
    meEarned,
    geEarned,
    mandatoryRemaining: Math.max(0, mandatoryRequired - mandatoryEarned),
    electiveRemaining: Math.max(0, electiveRequired - electiveEarned),
    meRemaining: Math.max(0, meRequired - meEarned),
    geRemaining: Math.max(0, geRequired - geEarned),
    mandatoryMet: mandatoryEarned >= mandatoryRequired,
    electiveMet: electiveEarned >= electiveRequired,
    meMet: meEarned >= meRequired,
    geMet: geEarned >= geRequired,
  }
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
  const programme = getProgrammeCreditProgress()
  return {
    enrolled: row.credits,
    pending,
    total: row.credits + pending,
    min: row.creditMin,
    max: row.creditMax,
    cartCount: registrationCart.value.length,
    ...programme,
  }
}

export function getActiveRoundPhase(batch = getActiveBatch()) {
  if (!batch) return { key: 'closed', labelKey: 'courseRegistration.student.roundClosed' }
  // 轻量 demo：优先使用批次标记的进行中轮次
  if (batch.demoActiveRound) {
    const key = batch.demoActiveRound
    const labelMap = {
      preselect: 'courseRegistration.student.roundPreselect',
      main: 'courseRegistration.student.roundMain',
      supplement: 'courseRegistration.student.roundSupplement',
    }
    return { key, labelKey: labelMap[key] || 'courseRegistration.student.roundMain' }
  }
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
  return steps.map((step) => ({
    ...step,
    active: step.key === active,
    rangeText: step.range ? `${step.range.start} – ${step.range.end}` : '',
  }))
}

export function filterCoursesByRound(courses, roundKey) {
  let list = [...courses].filter((item) => item.isSelectable !== false)

  if (roundKey === 'supplement') {
    list = list.filter((item) => item.remainingCapacity > 0)
  }
  return list
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
  if (filters.credits !== '' && filters.credits != null) {
    const credit = Number(filters.credits)
    if (Number.isFinite(credit)) {
      list = list.filter((item) => Number(item.credits) === credit)
    }
  }
  if (filters.prerequisites === 'none') {
    list = list.filter((item) => !item.prerequisites?.length)
  } else if (filters.prerequisites) {
    const target = String(filters.prerequisites).trim().toLowerCase()
    list = list.filter((item) =>
      (item.prerequisites || []).some((code) => String(code).toLowerCase() === target),
    )
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
