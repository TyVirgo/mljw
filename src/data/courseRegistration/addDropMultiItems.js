/**
 * 加退重修多课清单：净学分、学期帽、行键、学分条投影
 */

import { entryHasActivePermission, getSupplementEntry } from './supplementListQueue.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { resolveAddDropFeeCategoryKey } from './studentRegistrationContext.js'

/**
 * @param {object} line
 * @returns {string}
 */
export function addDropLineKey(line) {
  if (!line) return ''
  const courseId = line.courseId || line.course?.id || line.courseCode || ''
  const sectionId = line.sectionId || line.section?.id || line.sectionCode || line.section || ''
  return `${courseId}::${sectionId}`
}

/**
 * @param {object[]} lines
 * @returns {number}
 */
export function sumLineCredits(lines = []) {
  return (lines || []).reduce((sum, line) => sum + (Number(line.credits) || 0), 0)
}

/**
 * 净学分 = 当前 − 拟退 + 拟加/拟重修
 * @param {number} currentCredits
 * @param {object[]} dropLines
 * @param {object[]} addLines
 */
export function computeNetCreditsAfterLines(currentCredits, dropLines = [], addLines = []) {
  return (
    (Number(currentCredits) || 0) - sumLineCredits(dropLines) + sumLineCredits(addLines)
  )
}

/** 单条学分胶囊是否超额（current > max；hideMax/isStat=分类帽停用或灰色统计，永不超额） */
export function creditBarIsOver(bar) {
  if (bar?.hideMax || bar?.isStat) return false
  const current = Number(bar?.current) || 0
  const max = Number(bar?.max) || 0
  return max > 0 && current > max
}

/**
 * GE/ME 本学期行（ge、me）总分或任一类是否超额
 * @param {object[]} groups projectAddDropCreditGroups 结果
 */
export function creditGroupsHaveTermCategoryOver(groups = []) {
  const termKeys = new Set(['ge', 'me'])
  for (const group of groups) {
    const gk = String(group.key || '')
    if (!termKeys.has(gk)) continue
    if (creditBarIsOver(group.total)) return true
    for (const bar of group.categories || []) {
      if (creditBarIsOver(bar)) return true
    }
  }
  return false
}

/**
 * 本学期 GE/ME 类别（或无类别时总分）超额学分合计
 * @param {object[]} groups
 * @returns {number}
 */
export function sumTermCategoryCreditExcess(groups = []) {
  let excess = 0
  const termKeys = new Set(['ge', 'me'])
  for (const group of groups) {
    const gk = String(group.key || '')
    if (!termKeys.has(gk)) continue
    const cats = group.categories || []
    if (cats.length) {
      for (const bar of cats) {
        const cur = Number(bar?.current) || 0
        const max = Number(bar?.max) || 0
        if (max > 0 && cur > max) excess += cur - max
      }
    } else if (group.total) {
      const cur = Number(group.total.current) || 0
      const max = Number(group.total.max) || 0
      if (max > 0 && cur > max) excess += cur - max
    }
  }
  return excess
}

/**
 * 本学期已超限的类别 key 列表（去重，先类别后总分）
 * @param {object[]} groups
 * @returns {string[]}
 */
export function listTermOverCategoryKeys(groups = []) {
  const keys = []
  const seen = new Set()
  const termKeys = new Set(['ge', 'me'])
  for (const group of groups) {
    const gk = String(group.key || '')
    if (!termKeys.has(gk)) continue
    const cats = group.categories || []
    let anyCat = false
    for (const bar of cats) {
      if (!creditBarIsOver(bar)) continue
      anyCat = true
      const k = String(bar.key || '')
      if (!k || seen.has(k)) continue
      seen.add(k)
      keys.push(k)
    }
    if (!anyCat && creditBarIsOver(group.total)) {
      const k = gk === 'ge' ? 'geTotal' : 'meTotal'
      if (!seen.has(k)) {
        seen.add(k)
        keys.push(k)
      }
    }
  }
  return keys
}

/**
 * 净学分超出学期上限的分值
 */
export function computeTermCreditExcess(currentCredits, dropLines = [], addLines = [], creditMax = 0) {
  const max = Number(creditMax) || 0
  if (max <= 0) return 0
  const net = computeNetCreditsAfterLines(currentCredits, dropLines, addLines)
  return Math.max(0, net - max)
}

/**
 * @param {string} studentId
 * @returns {boolean}
 */
export function hasWhitelistCreditMaxBypass(studentId) {
  const entry = getSupplementEntry(studentId)
  return entryHasActivePermission(entry, 'bypassCreditMax')
}

/**
 * 挑选候选课后，若加入 add 侧是否超学期帽
 * @param {object} opts
 * @param {number} opts.currentCredits
 * @param {number} opts.creditMax
 * @param {object[]} opts.dropLines
 * @param {object[]} opts.addLines 已选加/重修（不含候选）
 * @param {number} opts.candidateCredits
 * @param {boolean} opts.bypassCreditMax
 */
export function evaluateTermCreditGate({
  currentCredits,
  creditMax,
  dropLines = [],
  addLines = [],
  candidateCredits = 0,
  bypassCreditMax = false,
}) {
  const max = Number(creditMax) || 0
  if (max <= 0) {
    return { over: false, blocked: false, net: Number(currentCredits) || 0, excess: 0 }
  }
  const net = computeNetCreditsAfterLines(currentCredits, dropLines, [
    ...addLines,
    { credits: candidateCredits },
  ])
  const excess = Math.max(0, net - max)
  const over = excess > 0
  return {
    over,
    blocked: over && !bypassCreditMax,
    net,
    excess,
  }
}

/**
 * 根据行级决策汇总整单状态
 * @param {object[]} items
 * @returns {'Approved'|'Rejected'|'PartiallyApproved'|'Pending'}
 */
export function summarizeLineDecisions(items = []) {
  const decisions = (items || []).map((i) => String(i.lineDecision || i.decision || 'pending'))
  if (!decisions.length) return 'Pending'
  const approved = decisions.filter((d) => d === 'approved').length
  const rejected = decisions.filter((d) => d === 'rejected').length
  const pending = decisions.filter((d) => d === 'pending' || !d).length
  if (pending > 0) return 'Pending'
  if (approved > 0 && rejected > 0) return 'PartiallyApproved'
  if (approved > 0) return 'Approved'
  if (rejected > 0) return 'Rejected'
  return 'Pending'
}

/**
 * 深拷贝学分胶囊组（total / totals / categories）
 * @param {object[]} groups
 */
function cloneCreditGroups(groups = []) {
  return (groups || []).map((g) => ({
    ...g,
    total: g.total ? { ...g.total } : null,
    totals: Array.isArray(g.totals) ? g.totals.map((b) => ({ ...b })) : [],
    categories: Array.isArray(g.categories) ? g.categories.map((b) => ({ ...b })) : [],
  }))
}

/**
 * 选课弹窗学分要求投影：确认基线 − 拟退 + 拟加
 * @param {object[]} baselineGroups pickerCreditGroups 结构
 * @param {{ dropCourses?: object[], addCourses?: object[] }} [opts]
 */
export function projectAddDropCreditGroups(baselineGroups, opts = {}) {
  const groups = cloneCreditGroups(baselineGroups)
  const dropCourses = opts.dropCourses || []
  const addCourses = opts.addCourses || []

  function bumpBar(bar, delta) {
    if (!bar) return
    bar.current = Math.max(0, (Number(bar.current) || 0) + delta)
  }

  function applyCourse(course, sign) {
    if (!course) return
    const credits = Number(course.credits) || 0
    if (!credits) return
    const kind = normalizeRegistrationType(course.type || course.course?.type)
    const isGe = kind === 'GE'
    const isMe = kind === 'ME' || kind === 'Mandatory'
    if (!isGe && !isMe) return
    const catKey =
      resolveAddDropFeeCategoryKey({
        ...course,
        type: course.type || course.course?.type,
        id: course.id || course.courseId || course.course?.id,
        code: course.code || course.courseCode || course.course?.code,
        courseCode: course.courseCode || course.code || course.course?.code,
        batchId: course.batchId || course.course?.batchId,
        schoolElectiveCategory:
          course.schoolElectiveCategory || course.course?.schoolElectiveCategory,
      }) || (isGe ? 'science' : 'ordinary')
    const delta = sign * credits
    for (const group of groups) {
      const gk = String(group.key || '')
      if (gk === 'legacy') {
        for (const bar of group.totals || []) {
          if ((isGe && bar.key === 'ge') || (isMe && bar.key === 'me')) bumpBar(bar, delta)
        }
        continue
      }
      if (
        (isGe && (gk === 'ge' || gk === 'ge-grad')) ||
        (isMe && (gk === 'me' || gk === 'me-grad'))
      ) {
        bumpBar(group.total, delta)
        const cats = group.categories || []
        let hit = false
        for (const bar of cats) {
          if (bar.key === catKey) {
            bumpBar(bar, delta)
            hit = true
            break
          }
        }
        if (!hit && cats.length) {
          const fallbackKey = isGe ? 'science' : 'ordinary'
          const fb = cats.find((b) => b.key === fallbackKey) || cats[0]
          bumpBar(fb, delta)
        }
      }
    }
  }

  for (const c of dropCourses) applyCourse(c, -1)
  for (const c of addCourses) applyCourse(c, 1)

  // 总分与分类对齐（分类已保证命中默认桶）
  for (const group of groups) {
    if (!group?.total || !Array.isArray(group.categories) || !group.categories.length) continue
    group.total.current = group.categories.reduce(
      (sum, bar) => sum + (Number(bar.current) || 0),
      0,
    )
  }
  return groups
}

/**
 * 是否计入「必修」退课/已选（培养方案底图 / CORE / Mandatory）
 * @param {object} course
 */
export function isMandatoryAddDropCourse(course) {
  if (!course) return false
  const source = String(course.sourceType || '')
    .trim()
    .toLowerCase()
  if (source === 'required' || source === 'programme') return true
  const type = String(course.type || course.course?.type || '').toUpperCase()
  if (type === 'CORE' || type === 'MANDATORY') return true
  return normalizeRegistrationType(course.type || course.course?.type) === 'Mandatory'
}

/**
 * 退课学分四分：总 = 必修 + ME + GE
 * @param {object[]} lines
 * @returns {{ total: number, mandatory: number, me: number, ge: number }}
 */
export function buildDropCreditBreakdown(lines = []) {
  let mandatory = 0
  let me = 0
  let ge = 0
  for (const line of lines || []) {
    if (!line) continue
    const credits = Number(line.credits) || 0
    if (!credits) continue
    if (isMandatoryAddDropCourse(line)) {
      mandatory += credits
      continue
    }
    const kind = normalizeRegistrationType(line.type || line.course?.type)
    if (kind === 'GE') ge += credits
    else me += credits
  }
  return {
    total: mandatory + me + ge,
    mandatory,
    me,
    ge,
  }
}

/**
 * 拟加/拟退后学期 GE 是否超过 geMax（与学分条同源）
 * @param {object|null} baseline
 * @param {{ dropCourses?: object[], addCourses?: object[] }} [opts]
 */
export function wouldExceedAddDropGeTermCap(baseline, opts = {}) {
  if (!baseline) return false
  const strip = buildAddDropTermCreditStrip({
    ...baseline,
    dropCourses: opts.dropCourses || [],
    addCourses: opts.addCourses || [],
  })
  const max = Number(strip.ge?.max) || 0
  if (max <= 0) return false
  return (Number(strip.ge?.current) || 0) > max
}

function toneForSelectedRequired(current, max) {
  if (max > 0 && current > max) return 'is-over'
  if (max > 0 && current >= max) return 'is-met'
  return 'is-short'
}

/**
 * 加退课学分条：毕业 GE/ME + 学期 GE/ME + 学期选修/必修（无分类）
 * @param {{
 *   geCurrent?: number, geMax?: number,
 *   meCurrent?: number, meMax?: number,
 *   gradGeCurrent?: number, gradGeMax?: number,
 *   gradMeCurrent?: number, gradMeMax?: number,
 *   mandatorySelected?: number,
 *   dropCourses?: object[], addCourses?: object[],
 * }} [opts]
 */
export function buildAddDropTermCreditStrip(opts = {}) {
  let ge = Math.max(0, Number(opts.geCurrent) || 0)
  let me = Math.max(0, Number(opts.meCurrent) || 0)
  let gradGe = Math.max(0, Number(opts.gradGeCurrent) || 0)
  let gradMe = Math.max(0, Number(opts.gradMeCurrent) || 0)
  let mandatory = Math.max(0, Number(opts.mandatorySelected) || 0)
  const geMax = Math.max(0, Number(opts.geMax) || 0)
  const meMax = Math.max(0, Number(opts.meMax) || 0)
  const gradGeMax = Math.max(0, Number(opts.gradGeMax) || 0)
  const gradMeMax = Math.max(0, Number(opts.gradMeMax) || 0)

  function apply(course, sign) {
    if (!course) return
    const credits = Number(course.credits) || 0
    if (!credits) return
    if (isMandatoryAddDropCourse(course)) {
      mandatory = Math.max(0, mandatory + sign * credits)
      return
    }
    const kind = normalizeRegistrationType(course.type || course.course?.type)
    if (kind === 'GE') {
      ge = Math.max(0, ge + sign * credits)
      gradGe = Math.max(0, gradGe + sign * credits)
    } else if (kind === 'ME') {
      me = Math.max(0, me + sign * credits)
      gradMe = Math.max(0, gradMe + sign * credits)
    }
  }

  for (const c of opts.dropCourses || []) apply(c, -1)
  for (const c of opts.addCourses || []) apply(c, 1)

  return {
    gradGe: {
      current: gradGe,
      max: gradGeMax,
      tone: toneForSelectedRequired(gradGe, gradGeMax),
    },
    gradMe: {
      current: gradMe,
      max: gradMeMax,
      tone: toneForSelectedRequired(gradMe, gradMeMax),
    },
    ge: { current: ge, max: geMax, tone: toneForSelectedRequired(ge, geMax) },
    me: { current: me, max: meMax, tone: toneForSelectedRequired(me, meMax) },
    /** 学期选修已选 = GE 已选 + ME 已选 */
    elective: { current: ge + me, tone: 'is-neutral' },
    mandatory: { current: mandatory, tone: 'is-neutral' },
  }
}
