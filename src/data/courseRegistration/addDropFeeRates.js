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

  return 'science'
}

/**
 * @param {object} opts
 * @param {'Add'|'Drop'|'Retake'|'AddDrop'} opts.action
 * @param {object} opts.course
 * @param {{ geRemaining?: number, meRemaining?: number }} [opts.planRemaining]
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
  let billableCredits = 0
  let reason = 'none'

  if (action === 'Retake') {
    billableCredits = credits
    reason = 'retake'
  } else if (action === 'Add' || action === 'AddDrop') {
    const type = String(course.type || '').toUpperCase()
    if (type === 'GE') {
      const rem = Math.max(0, Number(planRemaining.geRemaining) || 0)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'ge_excess' : 'plan_covered'
    } else if (type === 'ME') {
      const rem = Math.max(0, Number(planRemaining.meRemaining) || 0)
      billableCredits = Math.max(0, credits - rem)
      reason = billableCredits > 0 ? 'me_excess' : 'plan_covered'
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
