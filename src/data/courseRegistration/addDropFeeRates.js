/**
 * 加退重修费用：应收学分 × 科类单价
 * 规则：重修全部学分计费；加课仅毕业 GE/ME 总分超出部分计费；合计为两者之和
 */

import { isLocalCategory } from '../students.js'
import { resolveAddDropFeeCategoryKey } from './studentRegistrationContext.js'
import { getCourseByCode, getCourseById } from './selectableCourses.js'

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
 * GE/ME 免费额度均按毕业总分剩余（子类不参与计费）
 * @param {object} planRemaining
 * @param {'GE'|'ME'} type
 * @param {string} [_categoryKey] 保留参数兼容调用方；计费忽略
 */
function remainingForTypeCategory(planRemaining, type, _categoryKey) {
  void _categoryKey
  if (type === 'GE') {
    return Math.max(0, Number(planRemaining?.geRemaining) || 0)
  }
  if (type === 'ME') {
    return Math.max(0, Number(planRemaining?.meRemaining) || 0)
  }
  return 0
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
 * }} [opts.planRemaining] 毕业总分剩余（非学期；子类桶仅兼容）
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

  // 重修：所选学分一律计费（无「超出毕业」概念）
  if (action === 'Retake' || action === 'RetakeDrop') {
    billableCredits = Math.max(0, credits)
    reason = billableCredits > 0 ? 'retake_full_credits' : 'none'
  } else if (action === 'Add' || action === 'AddDrop') {
    // 加课：仅超毕业 GE/ME 总分才计费；子类超额不收费；超学期帽不收费
    const type = String(course.type || '').toUpperCase()
    if (type === 'GE') {
      const rem = remainingForTypeCategory(planRemaining, 'GE', categoryKey)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'ge_graduation_total_excess' : 'plan_covered'
    } else if (type === 'ME') {
      const rem = remainingForTypeCategory(planRemaining, 'ME', categoryKey)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'me_graduation_total_excess' : 'plan_covered'
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
    /** 计费动作：Add=毕业超出；Retake=全额；供展示过滤 */
    action: action === 'Retake' || action === 'RetakeDrop' ? 'Retake' : 'Add',
    credits,
    courseCode: course.code || '',
    courseName: course.name || course.code || '',
  }
}

/**
 * 从申请行拼 course（缺 type 时回课库）
 * @param {object} line
 */
function courseFromApplicationLine(line) {
  if (!line) return null
  const catalog =
    (line.courseId && getCourseById(line.courseId)) ||
    getCourseByCode(line.courseCode || line.code) ||
    null
  return {
    id: line.courseId || catalog?.id || '',
    code: line.courseCode || line.code || catalog?.code || '',
    name: line.courseName || line.name || catalog?.name || '',
    credits: Number(line.credits) || Number(catalog?.credits) || 0,
    type: line.type || catalog?.type || '',
    feeStream: line.feeStream || catalog?.feeStream,
    schoolElectiveCategory: line.schoolElectiveCategory || catalog?.schoolElectiveCategory,
    g1Category: line.g1Category || catalog?.g1Category,
    batchId: line.batchId || catalog?.batchId,
    eligibilitySource: line.eligibilitySource || '',
  }
}

/**
 * 从申请 items 重建费用预估：重修全额 + 加课毕业超出，求和
 * @param {object|null|undefined} app
 * @param {object} [planRemaining] 毕业 GE/ME 剩余
 * @param {string} [studentCategory]
 */
export function buildFeeEstimateFromApplicationItems(
  app,
  planRemaining = {},
  studentCategory = 'Local',
) {
  const items = app?.items || []
  const dropLines = items.filter((i) => i?.action === 'Drop')
  const billLines = [
    ...items.filter((i) => i?.action === 'Add').map((line) => ({ line, feeAction: 'Add' })),
    ...items
      .filter((i) => i?.action === 'Retake')
      .map((line) => ({ line, feeAction: 'Retake' })),
  ]
  if (!billLines.length) {
    return attachSstToFeeEstimate(sumFeeEstimates([]), studentCategory || app?.studentCategory || 'Local')
  }
  let remaining = dropLines.length
    ? boostPlanRemainingFromDrops(planRemaining, dropLines.map(courseFromApplicationLine).filter(Boolean))
    : clonePlanRemaining(planRemaining)
  const lines = []
  for (const { line, feeAction } of billLines) {
    const course = courseFromApplicationLine(line)
    if (!course) continue
    const fee = estimateCourseFee({
      action: feeAction,
      course,
      planRemaining: remaining,
      eligibilitySource: course.eligibilitySource || app?.eligibilitySource || '',
    })
    lines.push(fee)
    if (feeAction === 'Add') {
      remaining = consumePlanRemaining(remaining, course, fee.billableCredits)
    }
  }
  return attachSstToFeeEstimate(
    sumFeeEstimates(lines),
    studentCategory || app?.studentCategory || 'Local',
  )
}

/**
 * 是否加课侧毕业超出计费行（不含重修全额）
 * @param {object} line feeEstimate item
 */
export function isAddGraduationExcessFeeLine(line) {
  if (!line) return false
  if (line.action === 'Retake' || line.reason === 'retake_full_credits') return false
  return true
}

/**
 * 加课毕业超出计费学分合计（不含重修）
 * @param {object|null|undefined} feeEstimate
 */
export function sumAddGraduationExcessBillable(feeEstimate) {
  return (feeEstimate?.items || []).reduce((sum, line) => {
    if (!isAddGraduationExcessFeeLine(line)) return sum
    return sum + (Math.max(0, Number(line.billableCredits) || 0))
  }, 0)
}

/**
 * 是否重修全额计费行
 * @param {object|null|undefined} line feeEstimate item
 */
export function isRetakeFullBillableFeeLine(line) {
  if (!line) return false
  if (line.action === 'Retake' || line.reason === 'retake_full_credits') return true
  return false
}

/**
 * 重修缴费学分合计（重修全额计费，不含加课毕业超出）
 * @param {object|null|undefined} feeEstimate
 */
export function sumRetakeFullBillableCredits(feeEstimate) {
  return (feeEstimate?.items || []).reduce((sum, line) => {
    if (!isRetakeFullBillableFeeLine(line)) return sum
    return sum + (Math.max(0, Number(line.billableCredits) || 0))
  }, 0)
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
    const dropType = String(drop.type || '').toUpperCase()
    if (!(dropCr > 0 && (dropType === 'GE' || dropType === 'ME'))) continue
    const totalKey = dropType === 'GE' ? 'geRemaining' : 'meRemaining'
    // 计费只看总分：拟退一律释放总分剩余
    next[totalKey] = Math.max(0, (Number(next[totalKey]) || 0) + dropCr)
    const dropCat = resolveTermCategoryKey(drop)
    if (dropCat) {
      const bucketKey = dropType === 'GE' ? 'geCategory' : 'meCategory'
      const bucket = { ...(next[bucketKey] || {}) }
      bucket[dropCat] = Math.max(0, (Number(bucket[dropCat]) || 0) + dropCr)
      next[bucketKey] = bucket
    }
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
 * 重修计费：整门学分 × 科类单价（不读毕业剩余）
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
    Number(app.termCreditExcess),
    Number(app.excessCredits),
    Number(app.billableCredits),
    Number(app.feeEstimate?.billableCredits),
    fromItems,
  ].filter((n) => Number.isFinite(n) && n >= 0)
  if (!candidates.length) return 0
  return Math.max(0, ...candidates)
}

/**
 * 毕业超出（计费学分）：仅加课侧毕业超出，不含重修全额
 * @param {object|null|undefined} app
 */
export function resolveAddDropGradExcessCredits(app) {
  if (!app || app.type === 'Drop') return 0
  const fromFee = sumAddGraduationExcessBillable(app.feeEstimate)
  if (fromFee > 0) return fromFee
  const n = Number(app.gradExcessCredits)
  if (Number.isFinite(n) && n > 0) return n
  // 无重修时：历史 excessCredits 可视为加课毕业超出
  const type = String(app.type || '')
  const hasRetake =
    type.includes('Retake') ||
    (app.items || []).some((i) => i?.action === 'Retake' || i?.reason === 'retake_full_credits')
  if (!hasRetake) {
    const legacy = Number(app.excessCredits)
    if (Number.isFinite(legacy) && legacy > 0) return legacy
  }
  return 0
}

/**
 * 重修缴费学分：重修全额计费合计
 * @param {object|null|undefined} app
 */
export function resolveAddDropRetakeBillableCredits(app) {
  if (!app || app.type === 'Drop') return 0
  const fromFee = sumRetakeFullBillableCredits(app.feeEstimate)
  if (fromFee > 0) return fromFee
  const fromAppCredits = Number(app.applicationCredits?.retake)
  if (Number.isFinite(fromAppCredits) && fromAppCredits > 0) return fromAppCredits
  const n = Number(app.retakeCredits)
  if (Number.isFinite(n) && n > 0) return n
  // 无费用明细时：按重修课行学分合计（与「重修总学分（计费）」同源）
  return (app.items || []).reduce((sum, item) => {
    if (item?.action !== 'Retake' && item?.reason !== 'retake_full_credits') return sum
    return sum + (Math.max(0, Number(item.credits) || 0))
  }, 0)
}

/** 学期超出（学分条 GE/ME 总分口径落库值） */
export function resolveAddDropTermExcessCredits(app) {
  if (!app || app.type === 'Drop') return 0
  const n = Number(app.termCreditExcess)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** 加退课金额展示：数值 + RMB；空值「—」 */
export function formatAmountRmb(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `${n} RMB`
}
