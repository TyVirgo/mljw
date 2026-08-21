/**
 * 加退重修费用：应收学分 × 科类单价
 */

export const CREDIT_FEE_RATES = {
  arts: 500,
  science: 550,
  business: 600,
}

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

  // ME 未标注时与选课列表一致：默认文科
  if (String(course.type || '').toUpperCase() === 'ME') return 'arts'

  return 'science'
}

/** 收费科类 → 本学期文商理进度字段 */
export function feeStreamToTermCategoryKey(feeStream) {
  if (feeStream === 'arts') return 'humanities'
  if (feeStream === 'business') return 'business'
  return 'science'
}

/** 课程 → 本学期文商理类别键 */
export function resolveTermCategoryKey(course = {}) {
  return feeStreamToTermCategoryKey(resolveFeeStream(course))
}

/**
 * @param {object} planRemaining
 * @param {'GE'|'ME'} type
 * @param {string} categoryKey humanities|business|science
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
 * @param {'Add'|'Drop'|'Retake'|'AddDrop'} opts.action
 * @param {object} opts.course
 * @param {{
 *   geRemaining?: number,
 *   meRemaining?: number,
 *   geCategory?: { humanities?: number, business?: number, science?: number },
 *   meCategory?: { humanities?: number, business?: number, science?: number },
 * }} [opts.planRemaining]
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

  if (action === 'Retake') {
    billableCredits = credits
    reason = 'retake'
  } else if (action === 'Add' || action === 'AddDrop') {
    const type = String(course.type || '').toUpperCase()
    if (type === 'GE') {
      const rem = remainingForTypeCategory(planRemaining, 'GE', categoryKey)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'ge_category_excess' : 'plan_covered'
    } else if (type === 'ME') {
      const rem = remainingForTypeCategory(planRemaining, 'ME', categoryKey)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'me_category_excess' : 'plan_covered'
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
  }
}

/** 加退课金额展示：数值 + RMB；空值「—」 */
export function formatAmountRmb(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `${n} RMB`
}
