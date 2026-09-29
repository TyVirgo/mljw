/**
 * 加退重修费用：应收学分 × 科类单价
 */

import { isLocalCategory } from '../students.js'
import { resolveAddDropFeeCategoryKey } from './studentRegistrationContext.js'

export const CREDIT_FEE_RATES = {
  arts: 500,
  science: 550,
  business: 600,
  aiOpen: 550,
}

/** 国际生（非 Local）超额学费 SST 税率（demo 6%） */
export const SST_RATE = 0.06

/** GE 类别 / 校选文商理 → 收费科类 */
export function resolveFeeStream(course = {}) {
  if (course.feeStream && CREDIT_FEE_RATES[course.feeStream] != null) {
    return course.feeStream
  }
  const g1 = String(course.g1Category || '').toLowerCase()
  if (g1.includes('human')) return 'arts'
  if (g1.includes('business')) return 'business'
  if (g1.includes('science')) return 'science'

  const school = String(course.schoolElectiveCategory || '').toLowerCase()
  if (school === 'humanities' || school === 'arts') return 'arts'
  if (school === 'business') return 'business'
  if (school === 'science') return 'science'
  if (school === 'ai_open') return 'aiOpen'

  // ME 未标注时与选课列表一致：默认文科
  if (String(course.type || '').toUpperCase() === 'ME') return 'arts'

  return 'science'
}

/** 收费科类 → 本学期文商理进度字段 */
export function feeStreamToTermCategoryKey(feeStream) {
  if (feeStream === 'arts') return 'humanities'
  if (feeStream === 'business') return 'business'
  if (feeStream === 'aiOpen') return 'aiOpen'
  return 'science'
}

/** 课程 → 计费类别键（GE 文商理/AI；ME 课程组；兼容旧名） */
export function resolveTermCategoryKey(course = {}) {
  return resolveAddDropFeeCategoryKey(course) || feeStreamToTermCategoryKey(resolveFeeStream(course))
}

/**
 * @param {object} planRemaining
 * @param {'GE'|'ME'} type
 * @param {string} categoryKey humanities|business|science|aiOpen|group*
 */
function remainingForTypeCategory(planRemaining, type, categoryKey) {
  const bucket = type === 'GE' ? planRemaining?.geCategory : planRemaining?.meCategory
  if (bucket && categoryKey != null && bucket[categoryKey] != null && bucket[categoryKey] !== '') {
    return Math.max(0, Number(bucket[categoryKey]) || 0)
  }
  const fallback = type === 'GE' ? planRemaining?.geRemaining : planRemaining?.meRemaining
  return Math.max(0, Number(fallback) || 0)
}

/**
 * @param {object} opts
 * @param {'Add'|'Drop'|'Retake'|'AddDrop'|'RetakeDrop'} opts.action
 * @param {object} opts.course
 * @param {{
 *   geRemaining?: number,
 *   meRemaining?: number,
 *   geCategory?: Record<string, number>,
 *   meCategory?: Record<string, number>,
 * }} [opts.planRemaining] 毕业类别剩余（非学期）
 * @param {string} [opts.eligibilitySource] prior_drop | deferment_gap
 */
export function estimateCourseFee({
  action,
  course,
  planRemaining = {},
  eligibilitySource = '',
}) {
  if (!course || action === 'Drop') {
    return {
      billableCredits: 0,
      rate: 0,
      feeStream: '',
      amount: 0,
      labelKey: '',
    }
  }

  const feeStream = resolveFeeStream(course)
  const rate = CREDIT_FEE_RATES[feeStream] || CREDIT_FEE_RATES.science
  const credits = Number(course.credits) || 0
  const categoryKey = resolveTermCategoryKey(course)
  let billableCredits = 0
  let reason = 'none'

  // 加课 / 重修统一：仅超毕业 GE/ME 类别才计费；超学期帽不收费
  if (
    action === 'Retake' ||
    action === 'RetakeDrop' ||
    action === 'Add' ||
    action === 'AddDrop'
  ) {
    const type = String(course.type || '').toUpperCase()
    if (type === 'GE') {
      const rem = remainingForTypeCategory(planRemaining, 'GE', categoryKey)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'ge_graduation_category_excess' : 'plan_covered'
    } else if (type === 'ME') {
      const rem = remainingForTypeCategory(planRemaining, 'ME', categoryKey)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'me_graduation_category_excess' : 'plan_covered'
    } else if (eligibilitySource === 'prior_drop' || eligibilitySource === 'deferment_gap') {
      billableCredits = 0
      reason = 'plan_covered'
    } else {
      billableCredits = 0
      reason = 'plan_covered'
    }
  }

  return {
    billableCredits,
    rate,
    feeStream,
    categoryKey,
    amount: billableCredits * rate,
    reason,
    credits,
    courseCode: course.code || '',
    courseName: course.name || course.code || '',
  }
}

/** 深拷贝毕业类别剩余（供多课逐课扣减） */
export function clonePlanRemaining(planRemaining = {}) {
  return {
    geRemaining: Number(planRemaining.geRemaining) || 0,
    meRemaining: Number(planRemaining.meRemaining) || 0,
    geCategory: { ...(planRemaining.geCategory || {}) },
    meCategory: { ...(planRemaining.meCategory || {}) },
  }
}

/**
 * 拟退课释放毕业类别占用（非「退费抵免」；与加退课同源）
 * @param {object} planRemaining
 * @param {object[]} dropLines
 */
export function boostPlanRemainingFromDrops(planRemaining = {}, dropLines = []) {
  const next = clonePlanRemaining(planRemaining)
  for (const drop of dropLines || []) {
    const dropCr = Number(drop.credits) || 0
    const dropCat = resolveTermCategoryKey(drop)
    const dropType = String(drop.type || '').toUpperCase()
    if (!(dropCr > 0 && dropCat && (dropType === 'GE' || dropType === 'ME'))) continue
    const bucketKey = dropType === 'GE' ? 'geCategory' : 'meCategory'
    const totalKey = dropType === 'GE' ? 'geRemaining' : 'meRemaining'
    const bucket = { ...(next[bucketKey] || {}) }
    bucket[dropCat] = Math.max(0, (Number(bucket[dropCat]) || 0) + dropCr)
    next[bucketKey] = bucket
    next[totalKey] = Math.max(0, (Number(next[totalKey]) || 0) + dropCr)
  }
  return next
}

/**
 * 计费后扣减毕业剩余中已被计划覆盖的学分（credits - billable）
 * @param {object} planRemaining
 * @param {object} course
 * @param {number} billableCredits
 */
export function consumePlanRemaining(planRemaining, course, billableCredits = 0) {
  const next = clonePlanRemaining(planRemaining)
  const credits = Number(course?.credits) || 0
  const covered = Math.max(0, credits - (Number(billableCredits) || 0))
  if (covered <= 0 || !course) return next
  const type = String(course.type || '').toUpperCase()
  if (type !== 'GE' && type !== 'ME') return next
  const categoryKey = resolveTermCategoryKey(course)
  const bucketKey = type === 'GE' ? 'geCategory' : 'meCategory'
  const totalKey = type === 'GE' ? 'geRemaining' : 'meRemaining'
  if (categoryKey) {
    const bucket = { ...(next[bucketKey] || {}) }
    bucket[categoryKey] = Math.max(0, (Number(bucket[categoryKey]) || 0) - covered)
    next[bucketKey] = bucket
  }
  next[totalKey] = Math.max(0, (Number(next[totalKey]) || 0) - covered)
  return next
}

/**
 * 重修计费：与加课同一套毕业类别剩余算法（已废除退费抵免冲抵）
 * @param {object} opts
 * @param {object} opts.course
 * @param {object} [opts.planRemaining]
 * @param {string} [opts.eligibilitySource]
 */
export function estimateRetakeFee({ course, planRemaining = {}, eligibilitySource = '' }) {
  return estimateCourseFee({
    action: 'Retake',
    course,
    planRemaining,
    eligibilitySource,
  })
}

/**
 * 汇总多条费用行
 * @param {ReturnType<typeof estimateCourseFee>[]} lines
 */
export function sumFeeEstimates(lines = []) {
  const all = lines.filter(Boolean)
  const items = all.filter((l) => l && l.amount > 0)
  return {
    items,
    /** 含 0 费用行，供超出学分展示 */
    lines: all,
    total: items.reduce((sum, l) => sum + l.amount, 0),
    billableCredits: all.reduce((sum, l) => sum + (Number(l.billableCredits) || 0), 0),
    sstAmount: 0,
    sstRate: SST_RATE,
    payableTotal: items.reduce((sum, l) => sum + l.amount, 0),
  }
}

/**
 * 非本地生对超出学分费用加收 SST；本地或费用为 0 时为 0
 * @param {number} feeTotal 预估费用（不含税）
 * @param {string} [studentCategory]
 * @returns {number} 整数 RMB
 */
export function computeSstAmount(feeTotal, studentCategory = 'Local') {
  const fee = Number(feeTotal) || 0
  if (fee <= 0 || isLocalCategory(studentCategory)) return 0
  return Math.round(fee * SST_RATE)
}

/**
 * 在费用汇总上附加 SST / 应付总额（不改写 total=不含税预估费用）
 * @param {ReturnType<typeof sumFeeEstimates>} feeEstimate
 * @param {string} [studentCategory]
 */
export function attachSstToFeeEstimate(feeEstimate, studentCategory = 'Local') {
  const base = feeEstimate || sumFeeEstimates([])
  const total = Number(base.total) || 0
  const sstAmount = computeSstAmount(total, studentCategory)
  return {
    ...base,
    sstAmount,
    sstRate: SST_RATE,
    payableTotal: total + sstAmount,
  }
}

/**
 * 「超出学分」取学期超额与计费学分的较大值（学期超可 >0 且费用为 0）。
 * @param {object|null|undefined} app
 * @returns {number}
 */
export function resolveAddDropExcessCredits(app) {
  if (!app || app.type === 'Drop') return 0
  const fromItems = (app.feeEstimate?.items || []).reduce(
    (s, i) => s + (Number(i.billableCredits) || 0),
    0,
  )
  const candidates = [
    Number(app.excessCredits),
    Number(app.billableCredits),
    Number(app.feeEstimate?.billableCredits),
    fromItems,
  ].filter((n) => Number.isFinite(n) && n >= 0)
  if (!candidates.length) return 0
  return Math.max(0, ...candidates)
}

/** 加退课金额展示：数值 + RMB；空值「—」 */
export function formatAmountRmb(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `${n} RMB`
}
