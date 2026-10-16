/**
 * 选课监控：本学期 / 毕业学分缺口与提醒要素（与详情字段同源，避免循环依赖）
 */

/** Demo：当前学年学期（长学期步长） */
export const MONITOR_DEMO_CURRENT = { year: 2026, month: 9 }

/** 培养方案默认长学期数（4 年 × 2） */
export const MONITOR_PROGRAMME_LONG_SEMESTERS = 8

/** 临近毕业：剩余长学期 ≤ 此值 */
export const MONITOR_NEAR_GRAD_REMAINING = 2

const GE_KEYS = ['humanities', 'business', 'science', 'aiOpen']
const ME_KEYS = ['group4of3', 'group3of2', 'group2of1', 'ordinary']

const DEFAULT_GRAD_ME = {
  group4of3: 7,
  group3of2: 5,
  group2of1: 3,
  ordinary: 3,
  required: { group4of3: 16, group3of2: 12, group2of1: 8, ordinary: 12 },
}

/** 展示层默认分母（禁止出现「—」） */
export const MONITOR_DEFAULT_TERM_GE_MAX = 6
export const MONITOR_DEFAULT_TERM_ME_MAX = 22
export const MONITOR_DEFAULT_GRAD_GE_MAX = 16
export const MONITOR_DEFAULT_GRAD_ME_MAX = 48
export const MONITOR_DEFAULT_MANDATORY_MAX = 72

/**
 * @param {string|number} intake 2409 | 2024/09 | 202409
 * @returns {{ year: number, month: number }|null}
 */
export function parseMonitorIntake(intake) {
  const raw = String(intake || '').trim()
  if (!raw) return null
  const slash = raw.match(/^(\d{4})\D+(\d{1,2})/)
  if (slash) {
    return { year: Number(slash[1]), month: Number(slash[2]) }
  }
  const compact = raw.replace(/\D/g, '')
  if (compact.length === 6) {
    return { year: Number(compact.slice(0, 4)), month: Number(compact.slice(4, 6)) }
  }
  if (compact.length === 4) {
    const yy = Number(compact.slice(0, 2))
    const mm = Number(compact.slice(2, 4))
    return { year: 2000 + yy, month: mm }
  }
  return null
}

/**
 * 自入学至当前：已用长学期数（含当前学期）
 * @param {string|number} intake
 * @param {{ year: number, month: number }} [now]
 */
export function estimateCompletedLongSemesters(intake, now = MONITOR_DEMO_CURRENT) {
  const start = parseMonitorIntake(intake)
  if (!start) return 0
  let y = start.year
  let m = start.month <= 6 ? 4 : 9
  let count = 0
  const guard = 24
  while (count < guard) {
    count += 1
    if (y > now.year || (y === now.year && m >= now.month)) break
    if (m === 4) {
      m = 9
    } else {
      m = 4
      y += 1
    }
  }
  return count
}

/**
 * @param {string|number} intake
 * @param {{ year: number, month: number }} [now]
 * @param {number} [programmeTotal]
 */
export function estimateRemainingLongSemesters(
  intake,
  now = MONITOR_DEMO_CURRENT,
  programmeTotal = MONITOR_PROGRAMME_LONG_SEMESTERS,
) {
  const done = estimateCompletedLongSemesters(intake, now)
  return Math.max(0, programmeTotal - done)
}

function categoryBars(progress, keys) {
  const p = progress || {}
  const req = p.required || {}
  return keys.map((key) => ({
    key,
    current: Number(p[key]) || 0,
    max: Number(req[key]) || 0,
  }))
}

function sumBars(bars) {
  return {
    current: (bars || []).reduce((s, b) => s + (Number(b.current) || 0), 0),
    max: (bars || []).reduce((s, b) => s + (Number(b.max) || 0), 0),
  }
}

function shortCategoryKeys(bars) {
  return (bars || [])
    .filter((b) => Number(b.max) > 0 && Number(b.current) < Number(b.max))
    .map((b) => b.key)
}

/**
 * @param {object} row
 */
export function getMonitorTermInsight(row) {
  if (!row) {
    return {
      ge: 0,
      geMax: 0,
      me: 0,
      meMax: 0,
      geShort: false,
      meShort: false,
      geCatShort: [],
      meCatShort: [],
    }
  }
  const p = row.termElectiveProgress || {}
  const ge = Number(p.ge) || 0
  const geMax = Number(p.geMax) || MONITOR_DEFAULT_TERM_GE_MAX
  const me = Number(p.me) || 0
  const meMax = Number(p.meMax) || MONITOR_DEFAULT_TERM_ME_MAX
  const geCatShort = shortCategoryKeys(
    categoryBars(row.termGeElectiveCategories || row.graduationGeProgress, GE_KEYS),
  )
  const meCatShort = shortCategoryKeys(categoryBars(row.termGeCategories, ME_KEYS))
  return {
    ge,
    geMax,
    me,
    meMax,
    geShort: geMax > 0 && ge < geMax,
    meShort: meMax > 0 && me < meMax,
    geCatShort,
    meCatShort,
  }
}

/**
 * @param {object} row
 */
export function getMonitorGraduationInsight(row) {
  const geBars = categoryBars(row?.graduationGeProgress, GE_KEYS)
  const meBars = categoryBars(row?.graduationMeProgress || DEFAULT_GRAD_ME, ME_KEYS)
  const ge = sumBars(geBars)
  const me = sumBars(meBars)
  if (!ge.max) ge.max = MONITOR_DEFAULT_GRAD_GE_MAX
  if (!me.max) me.max = MONITOR_DEFAULT_GRAD_ME_MAX
  const earned = ge.current + me.current
  const required = ge.max + me.max
  const gap = Math.max(0, required - earned)
  const ratio = required > 0 ? earned / required : 1
  const remaining = estimateRemainingLongSemesters(row?.intake)
  const nearGrad = remaining <= MONITOR_NEAR_GRAD_REMAINING
  const belowHalf = required > 0 && ratio < 0.5
  const term = getMonitorTermInsight(row)
  const termCap = Math.max(
    1,
    (Number(term.geMax) || 0) + (Number(term.meMax) || 0) || Number(row?.creditMax) || 20,
  )
  const catchUpCapacity = remaining * termCap
  const cannotCatchUp = gap > 0 && gap > catchUpCapacity
  return {
    ge,
    me,
    earned,
    required,
    gap,
    ratio,
    remaining,
    nearGrad,
    belowHalf,
    cannotCatchUp,
    nearAndBelowHalf: nearGrad && belowHalf,
    hasGap: gap > 0,
    geCatShort: shortCategoryKeys(geBars),
    meCatShort: shortCategoryKeys(meBars),
    termCap,
    catchUpCapacity,
  }
}

/**
 * 派生监控预警类型（与种子 issues 合并；结构性问题保留）
 * @param {object} row
 * @returns {string[]}
 */
export function deriveMonitorIssues(row) {
  if (!row) return []
  const issues = new Set()
  const keep = new Set([
    'prerequisiteMissing',
    'notRegistered',
    'creditAtMax',
    'creditAboveMax',
  ])
  for (const issue of row.issues || []) {
    if (keep.has(issue)) issues.add(issue)
  }

  const credits = Number(row.credits) || 0
  const creditMin = Number(row.creditMin) || 0
  const creditMax = Number(row.creditMax) || 0
  if (credits <= 0) issues.add('notRegistered')
  if (creditMax > 0 && credits > creditMax) issues.add('creditAboveMax')
  else if (creditMax > 0 && credits >= creditMax) issues.add('creditAtMax')
  if (credits > 0 && creditMin > 0 && credits < creditMin) issues.add('creditBelowMin')

  const term = getMonitorTermInsight(row)
  if (term.geShort) issues.add('termGeShort')
  if (term.meShort) issues.add('termMeShort')
  if (term.geCatShort.length || term.meCatShort.length) issues.add('termCatShort')

  const grad = getMonitorGraduationInsight(row)
  if (grad.cannotCatchUp) issues.add('graduationCatchUpRisk')
  else if (grad.nearAndBelowHalf) issues.add('graduationNearHalfRisk')
  else if (grad.hasGap) issues.add('graduationGap')

  return [...issues]
}

/**
 * 主表「毕业学分（已选/要求）」合计摘要（导出/兼容）
 * @param {object} row
 */
export function formatGraduationCreditsSummary(row) {
  const grad = getMonitorGraduationInsight(row)
  return `${grad.earned}/${grad.required}`
}

/**
 * 主表「GE毕业学分（已选/要求）」
 * @param {object} row
 */
export function formatGraduationGeSummary(row) {
  const grad = getMonitorGraduationInsight(row)
  return `${grad.ge.current}/${grad.ge.max}`
}

/**
 * 主表「ME毕业学分（已选/要求）」
 * @param {object} row
 */
export function formatGraduationMeSummary(row) {
  const grad = getMonitorGraduationInsight(row)
  return `${grad.me.current}/${grad.me.max}`
}

/**
 * 主表「学期总学分」：本学期 GE 已选 + ME 已选（不含必修、不含要求分母）
 * @param {object} row
 * @returns {number}
 */
export function getTermTotalSelectedCredits(row) {
  const term = getMonitorTermInsight(row)
  return (Number(term.ge) || 0) + (Number(term.me) || 0)
}

/**
 * 主表/导出「学期总学分」展示
 * @param {object} row
 * @returns {string|number}
 */
export function formatTermTotalSelectedCredits(row) {
  return getTermTotalSelectedCredits(row)
}

/**
 * 主表「本学期 GE」摘要（已选/要求）
 * @param {object} row
 */
export function formatTermGeSummary(row) {
  const term = getMonitorTermInsight(row)
  return `${term.ge}/${term.geMax}`
}

/**
 * 主表「本学期 ME」摘要（已选/要求）
 * @param {object} row
 */
export function formatTermMeSummary(row) {
  const term = getMonitorTermInsight(row)
  return `${term.me}/${term.meMax}`
}

/**
 * 完成度整数百分比（可 >100%；分母缺省时按 0% 展示，不出现「—」）
 * @param {number} current
 * @param {number} max
 */
export function getCreditCompletionPct(current, max) {
  const m = Number(max) || 0
  if (m <= 0) return 0
  const c = Number(current) || 0
  return Math.floor((c / m) * 100)
}

/**
 * @param {number} current
 * @param {number} max
 */
export function formatCreditCompletion(current, max) {
  return `${getCreditCompletionPct(current, max)}%`
}

/**
 * 完成度色阶：≥75 绿（含 >100%）、50–74 橙、25–49 黄、0–24 红
 * @param {number} pct
 * @returns {'high'|'mid'|'low'|'critical'}
 */
export function getCompletionTone(pct) {
  const p = Number(pct) || 0
  if (p >= 75) return 'high'
  if (p >= 50) return 'mid'
  if (p >= 25) return 'low'
  return 'critical'
}

/**
 * @param {number} pct
 */
export function completionToneClass(pct) {
  return `completion-tone completion-tone--${getCompletionTone(pct)}`
}

export function formatGraduationGeCompletion(row) {
  const grad = getMonitorGraduationInsight(row)
  return formatCreditCompletion(grad.ge.current, grad.ge.max)
}

export function formatGraduationMeCompletion(row) {
  const grad = getMonitorGraduationInsight(row)
  return formatCreditCompletion(grad.me.current, grad.me.max)
}

export function formatTermGeCompletion(row) {
  const term = getMonitorTermInsight(row)
  return formatCreditCompletion(term.ge, term.geMax)
}

export function formatTermMeCompletion(row) {
  const term = getMonitorTermInsight(row)
  return formatCreditCompletion(term.me, term.meMax)
}

export function graduationGeCompletionClass(row) {
  const grad = getMonitorGraduationInsight(row)
  return completionToneClass(getCreditCompletionPct(grad.ge.current, grad.ge.max))
}

export function graduationMeCompletionClass(row) {
  const grad = getMonitorGraduationInsight(row)
  return completionToneClass(getCreditCompletionPct(grad.me.current, grad.me.max))
}

export function termGeCompletionClass(row) {
  const term = getMonitorTermInsight(row)
  return completionToneClass(getCreditCompletionPct(term.ge, term.geMax))
}

export function termMeCompletionClass(row) {
  const term = getMonitorTermInsight(row)
  return completionToneClass(getCreditCompletionPct(term.me, term.meMax))
}

export function graduationMandatoryCompletionClass(row) {
  const m = getMonitorMandatoryGraduation(row)
  return completionToneClass(getCreditCompletionPct(m.current, m.max))
}

/**
 * 已选/要求胶囊色（对齐在线选课 is-short / is-met / is-over）
 * @param {number} current
 * @param {number} max
 */
export function creditCapsuleTone(current, max) {
  const c = Number(current) || 0
  const m = Number(max) || 0
  if (m > 0 && c > m) return 'is-over'
  if (m > 0 && c >= m) return 'is-met'
  return 'is-short'
}

export function graduationGeCapsuleTone(row) {
  const g = getMonitorGraduationInsight(row)
  return creditCapsuleTone(g.ge.current, g.ge.max)
}

export function graduationMeCapsuleTone(row) {
  const g = getMonitorGraduationInsight(row)
  return creditCapsuleTone(g.me.current, g.me.max)
}

export function termGeCapsuleTone(row) {
  const term = getMonitorTermInsight(row)
  return creditCapsuleTone(term.ge, term.geMax)
}

export function termMeCapsuleTone(row) {
  const term = getMonitorTermInsight(row)
  return creditCapsuleTone(term.me, term.meMax)
}

export function graduationMandatoryCapsuleTone(row) {
  const m = getMonitorMandatoryGraduation(row)
  return creditCapsuleTone(m.current, m.max)
}

/** 毕业 GE 完成度（整数%） */
export function getGraduationGeCompletionPct(row) {
  const g = getMonitorGraduationInsight(row)
  return getCreditCompletionPct(g.ge.current, g.ge.max)
}

export function getGraduationMeCompletionPct(row) {
  const g = getMonitorGraduationInsight(row)
  return getCreditCompletionPct(g.me.current, g.me.max)
}

export function getTermGeCompletionPct(row) {
  const term = getMonitorTermInsight(row)
  return getCreditCompletionPct(term.ge, term.geMax)
}

export function getTermMeCompletionPct(row) {
  const term = getMonitorTermInsight(row)
  return getCreditCompletionPct(term.me, term.meMax)
}

export function getGraduationMandatoryCompletionPct(row) {
  const m = getMonitorMandatoryGraduation(row)
  return getCreditCompletionPct(m.current, m.max)
}

/**
 * 必修毕业进度（行字段 graduationMandatoryProgress）
 * @param {object} row
 */
export function getMonitorMandatoryGraduation(row) {
  const p = row?.graduationMandatoryProgress || {}
  return {
    current: Number(p.current) || 0,
    max: Number(p.required ?? p.max) || MONITOR_DEFAULT_MANDATORY_MAX,
  }
}

export function formatGraduationMandatorySummary(row) {
  const m = getMonitorMandatoryGraduation(row)
  return `${m.current}/${m.max}`
}

export function formatGraduationMandatoryCompletion(row) {
  const m = getMonitorMandatoryGraduation(row)
  return formatCreditCompletion(m.current, m.max)
}

/**
 * 主表「毕业缺口」摘要（详情/提醒仍可用；主表已不再展示）
 * @param {object} row
 * @param {(key: string) => string} [tCat]
 */
export function formatGraduationGapSummary(row, tCat) {
  const grad = getMonitorGraduationInsight(row)
  if (!grad.required) return '—'
  if (!grad.hasGap) return `0/${grad.required}`
  const parts = [`−${grad.gap}`]
  if (grad.cannotCatchUp) parts.push('赶不上')
  else if (grad.nearAndBelowHalf) parts.push('临近不足半')
  const cats = [...grad.geCatShort, ...grad.meCatShort].slice(0, 2)
  if (cats.length && typeof tCat === 'function') {
    parts.push(cats.map((k) => tCat(k)).join('/'))
  }
  return parts.join(' · ')
}

/**
 * 提醒默认正文要素（供弹框）
 * @param {object} row
 * @param {(key: string, params?: object) => string} t
 */
export function buildMonitorRemindDraft(row, t) {
  const term = getMonitorTermInsight(row)
  const grad = getMonitorGraduationInsight(row)
  const lines = []
  lines.push(
    t('courseRegistration.monitor.remindDraft.greeting', {
      name: row.studentName || '',
      id: row.studentId || '',
    }),
  )

  const termBits = []
  if (term.geShort) {
    termBits.push(
      t('courseRegistration.monitor.remindDraft.termGe', { cur: term.ge, max: term.geMax }),
    )
  }
  if (term.meShort) {
    termBits.push(
      t('courseRegistration.monitor.remindDraft.termMe', { cur: term.me, max: term.meMax }),
    )
  }
  if (term.geCatShort.length || term.meCatShort.length) {
    const labels = [...term.geCatShort, ...term.meCatShort]
      .map((k) => t(`courseRegistration.monitor.g1.${k}`))
      .join('、')
    termBits.push(t('courseRegistration.monitor.remindDraft.termCat', { cats: labels }))
  }
  if (termBits.length) {
    lines.push(t('courseRegistration.monitor.remindDraft.termHeader'))
    termBits.forEach((b) => lines.push(`· ${b}`))
    lines.push(t('courseRegistration.monitor.remindDraft.termNote'))
  }

  if (grad.hasGap) {
    lines.push(t('courseRegistration.monitor.remindDraft.gradHeader'))
    lines.push(
      `· ${t('courseRegistration.monitor.remindDraft.gradGap', {
        gap: grad.gap,
        earned: grad.earned,
        required: grad.required,
        remaining: grad.remaining,
      })}`,
    )
    if (grad.cannotCatchUp) {
      lines.push(`· ${t('courseRegistration.monitor.remindDraft.gradCatchUp')}`)
    } else if (grad.nearAndBelowHalf) {
      lines.push(`· ${t('courseRegistration.monitor.remindDraft.gradNearHalf')}`)
    }
  }

  lines.push(t('courseRegistration.monitor.remindDraft.closing'))
  return {
    subject: t('courseRegistration.monitor.remindDraft.subject', {
      name: row.studentName || '',
      id: row.studentId || '',
    }),
    body: lines.join('\n'),
  }
}
