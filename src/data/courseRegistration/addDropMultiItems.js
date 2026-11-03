/**
 * 加退重修多课清单：净学分、学期帽、行键、学分条投影
 */

import { entryHasActivePermission, getSupplementEntry } from './supplementListQueue.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import {
  getProgrammeCreditProgress,
  resolveAddDropFeeCategoryKey,
} from './studentRegistrationContext.js'
import {
  getTermElectiveCreditProgress,
  studentConfirmedCourses,
  studentRequiredCourses,
} from './studentRegistrationStore.js'
import { getCourseByCode, getCourseById } from './selectableCourses.js'

/**
 * 补齐 type/sourceType，便于学分条按 GE/ME/必修投影（表单行与审批行共用）
 * @param {object|null|undefined} item
 */
export function enrichCourseForCreditStrip(item) {
  if (!item) return item
  if (item.type || item.sourceType) return item
  const catalog =
    (item.courseId && getCourseById(item.courseId)) ||
    getCourseByCode(item.courseCode || item.code) ||
    null
  if (!catalog) return item
  return {
    ...item,
    type: catalog.type || item.type,
    sourceType: catalog.sourceType || item.sourceType,
  }
}

/** @deprecated 兼容旧名 */
const enrichItemForCreditStrip = enrichCourseForCreditStrip

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
 * 审批行唯一键：含 action，避免退/加同课同组撞决策与学分投影
 * @param {object|null|undefined} item
 * @param {number} [idx]
 */
export function addDropApprovalLineKey(item, idx = 0) {
  const action = String(item?.action || '').trim() || 'Line'
  const base = addDropLineKey(item)
  if (base) return `${action}::${base}`
  return `${action}::${idx}`
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
 * 学分条 GE/ME 学期总分超额（仅 cur > max；顶格不计）
 * @param {{ ge?: { current?: number, max?: number }, me?: { current?: number, max?: number } }|null|undefined} strip
 * @returns {number}
 */
export function sumGeMeTermStripExcess(strip) {
  let excess = 0
  for (const key of ['ge', 'me']) {
    const bar = strip?.[key]
    const cur = Number(bar?.current) || 0
    const max = Number(bar?.max) || 0
    if (max > 0 && cur > max) excess += cur - max
  }
  return excess
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
/** 白名单学期超上限默认可超学分 */
export const DEFAULT_CREDIT_BYPASS_EXTRA = 3
export const CREDIT_BYPASS_EXTRA_MIN = 1
export const CREDIT_BYPASS_EXTRA_MAX = 3

export function hasWhitelistCreditMaxBypass(studentId) {
  const entry = getSupplementEntry(studentId)
  return entryHasActivePermission(entry, 'bypassCreditMax')
}

/**
 * 白名单允许超学期上限的学分数（1–3）；无权限返回 0
 * @param {string} studentId
 */
export function getWhitelistCreditBypassExtra(studentId) {
  const entry = getSupplementEntry(studentId)
  if (!entry || !entryHasActivePermission(entry, 'bypassCreditMax')) return 0
  const perm = (entry.permissions || []).find((p) => p.key === 'bypassCreditMax' && p.enabled !== false)
  const n = Number(perm?.extraCredits)
  if (Number.isFinite(n) && n >= CREDIT_BYPASS_EXTRA_MIN) {
    return Math.min(CREDIT_BYPASS_EXTRA_MAX, Math.floor(n))
  }
  return DEFAULT_CREDIT_BYPASS_EXTRA
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
 * @param {number} [opts.creditBypassExtra] 可超额度 1–3；bypass 开启且未传时按 3
 */
export function evaluateTermCreditGate({
  currentCredits,
  creditMax,
  dropLines = [],
  addLines = [],
  candidateCredits = 0,
  bypassCreditMax = false,
  creditBypassExtra,
}) {
  const max = Number(creditMax) || 0
  if (max <= 0) {
    return { over: false, blocked: false, net: Number(currentCredits) || 0, excess: 0, allowedExtra: 0 }
  }
  const net = computeNetCreditsAfterLines(currentCredits, dropLines, [
    ...addLines,
    { credits: candidateCredits },
  ])
  const excess = Math.max(0, net - max)
  const over = excess > 0
  const allowedExtra = bypassCreditMax
    ? Math.min(
        CREDIT_BYPASS_EXTRA_MAX,
        Math.max(
          CREDIT_BYPASS_EXTRA_MIN,
          Number.isFinite(Number(creditBypassExtra))
            ? Math.floor(Number(creditBypassExtra))
            : DEFAULT_CREDIT_BYPASS_EXTRA,
        ),
      )
    : 0
  return {
    over,
    blocked: over && (!bypassCreditMax || excess > allowedExtra),
    net,
    excess,
    allowedExtra,
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
 *   gradMandatoryCurrent?: number, gradMandatoryMax?: number,
 *   mandatorySelected?: number,
 *   dropCourses?: object[], addCourses?: object[],
 * }} [opts]
 */
export function buildAddDropTermCreditStrip(opts = {}) {
  let ge = Math.max(0, Number(opts.geCurrent) || 0)
  let me = Math.max(0, Number(opts.meCurrent) || 0)
  let gradGe = Math.max(0, Number(opts.gradGeCurrent) || 0)
  let gradMe = Math.max(0, Number(opts.gradMeCurrent) || 0)
  let gradMandatory = Math.max(0, Number(opts.gradMandatoryCurrent) || 0)
  let mandatory = Math.max(0, Number(opts.mandatorySelected) || 0)
  const geMax = Math.max(0, Number(opts.geMax) || 0)
  const meMax = Math.max(0, Number(opts.meMax) || 0)
  const gradGeMax = Math.max(0, Number(opts.gradGeMax) || 0)
  const gradMeMax = Math.max(0, Number(opts.gradMeMax) || 0)
  const gradMandatoryMax = Math.max(0, Number(opts.gradMandatoryMax) || 0)

  function apply(course, sign) {
    const enriched = enrichCourseForCreditStrip(course)
    if (!enriched) return
    const credits = Number(enriched.credits) || 0
    if (!credits) return
    if (isMandatoryAddDropCourse(enriched)) {
      mandatory = Math.max(0, mandatory + sign * credits)
      gradMandatory = Math.max(0, gradMandatory + sign * credits)
      return
    }
    const kind = normalizeRegistrationType(enriched.type || enriched.course?.type)
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
    /** 毕业必修已选/要求（条上展示已选；tip 仍用 current/max） */
    gradMandatory: {
      current: gradMandatory,
      max: gradMandatoryMax,
      tone: toneForSelectedRequired(gradMandatory, gradMandatoryMax),
    },
    /** 毕业选修已选 = 毕业 GE + 毕业 ME */
    gradElective: { current: gradGe + gradMe, tone: 'is-neutral' },
    ge: { current: ge, max: geMax, tone: toneForSelectedRequired(ge, geMax) },
    me: { current: me, max: meMax, tone: toneForSelectedRequired(me, meMax) },
    /** 学期选修已选 = GE 已选 + ME 已选 */
    elective: { current: ge + me, tone: 'is-neutral' },
    mandatory: { current: mandatory, tone: 'is-neutral' },
    /** 学期已选总学分 = 学期选修 + 学期必修 */
    termTotalSelected: { current: ge + me + mandatory, tone: 'is-neutral' },
    /** 毕业已选总学分 = 毕业选修 + 毕业必修 */
    gradTotalSelected: {
      current: gradGe + gradMe + gradMandatory,
      tone: 'is-neutral',
    },
    /**
     * @deprecated 展示已拆为 termTotalSelected / gradTotalSelected；保留等于学期总以兼容旧读方
     */
    totalSelected: { current: ge + me + mandatory, tone: 'is-neutral' },
  }
}

/**
 * 按学分要求条数据汇总毕业累计未修（要求 − 已选）
 * @param {object|null|undefined} strip
 * @param {{ mandatoryPriorEarned?: number }|null} [opts] 必修 prior：tip 用 prior+条上已选，避免把学期已选当累计
 * @returns {{ mandatory: number, ge: number, me: number, hasDeficit: boolean }}
 */
export function summarizeAddDropStripCreditGaps(strip, opts = null) {
  const geCur = Number(strip?.gradGe?.current) || 0
  const geMax = Number(strip?.gradGe?.max) || 0
  const meCur = Number(strip?.gradMe?.current) || 0
  const meMax = Number(strip?.gradMe?.max) || 0
  const manCur = Number(strip?.gradMandatory?.current) || 0
  const manMax = Number(strip?.gradMandatory?.max) || 0
  const priorMan = Math.max(0, Number(opts?.mandatoryPriorEarned) || 0)
  // 有 prior 时：毕业累计未修 = 要求 − (历史已修 + 条上必修已选)
  const mandatory = Math.max(
    0,
    priorMan > 0 || opts?.mandatoryPriorEarned != null
      ? manMax - priorMan - manCur
      : manMax - manCur,
  )
  const ge = Math.max(0, geMax - geCur)
  const me = Math.max(0, meMax - meCur)
  return {
    mandatory,
    ge,
    me,
    hasDeficit: mandatory > 0 || ge > 0 || me > 0,
  }
}

/**
 * 是否展示学分情况 tip
 * 默认有学分条即展示；applicationType 仅作兼容参数（不再作为门槛）
 * @param {string} [_appType]
 */
export function shouldShowAddDropCreditSituationTip(_appType) {
  return true
}

/**
 * 本次申请按动作汇总学分（加课 / 重修 / 退课）
 * @param {object[]} items
 * @returns {{ add: number, retake: number, drop: number }}
 */
export function sumApplicationActionCredits(items = []) {
  let add = 0
  let retake = 0
  let drop = 0
  for (const item of items || []) {
    const credits = Number(item?.credits) || 0
    if (!credits) continue
    if (item.action === 'Drop') drop += credits
    else if (item.action === 'Retake') retake += credits
    else if (item.action === 'Add') add += credits
  }
  return { add, retake, drop }
}

/** @param {object} [baseline] */
export function normalizeTermCreditStripBaseline(baseline = {}) {
  return {
    geCurrent: Number(baseline.geCurrent) || 0,
    geMax: Number(baseline.geMax) || 0,
    meCurrent: Number(baseline.meCurrent) || 0,
    meMax: Number(baseline.meMax) || 0,
    gradGeCurrent: Number(baseline.gradGeCurrent) || 0,
    gradGeMax: Number(baseline.gradGeMax) || 0,
    gradMeCurrent: Number(baseline.gradMeCurrent) || 0,
    gradMeMax: Number(baseline.gradMeMax) || 0,
    gradMandatoryCurrent: Number(baseline.gradMandatoryCurrent) || 0,
    gradMandatoryMax: Number(baseline.gradMandatoryMax) || 0,
    mandatorySelected: Number(baseline.mandatorySelected) || 0,
  }
}

const DEFAULT_TERM_CREDIT_BASELINE = {
  geCurrent: 3,
  geMax: 6,
  meCurrent: 8,
  meMax: 22,
  gradGeCurrent: 3,
  gradGeMax: 18,
  gradMeCurrent: 8,
  gradMeMax: 24,
  // 毕业必修与学期必修同源（demo 默认本学期 9）
  gradMandatoryCurrent: 9,
  gradMandatoryMax: 72,
  mandatorySelected: 9,
}

/**
 * 由提交时学分条反推申请前基线（将加/退作用反向）
 * @param {object|null} strip
 * @param {object[]} [items]
 */
export function inferTermCreditStripBaseline(strip, items = []) {
  if (!strip) return null
  const enriched = (items || []).map(enrichItemForCreditStrip)
  const drops = enriched.filter((i) => i.action === 'Drop')
  const adds = enriched.filter((i) => i.action === 'Add' || i.action === 'Retake')
  const reversed = buildAddDropTermCreditStrip({
    geCurrent: Number(strip.ge?.current) || 0,
    geMax: Number(strip.ge?.max) || 0,
    meCurrent: Number(strip.me?.current) || 0,
    meMax: Number(strip.me?.max) || 0,
    gradGeCurrent: Number(strip.gradGe?.current) || 0,
    gradGeMax: Number(strip.gradGe?.max) || 0,
    gradMeCurrent: Number(strip.gradMe?.current) || 0,
    gradMeMax: Number(strip.gradMe?.max) || 0,
    gradMandatoryCurrent: Number(strip.gradMandatory?.current) || 0,
    gradMandatoryMax: Number(strip.gradMandatory?.max) || 0,
    mandatorySelected: Number(strip.mandatory?.current) || 0,
    // 反向：把加课当退、退课当加
    dropCourses: adds,
    addCourses: drops,
  })
  return {
    geCurrent: reversed.ge.current,
    geMax: reversed.ge.max,
    meCurrent: reversed.me.current,
    meMax: reversed.me.max,
    gradGeCurrent: reversed.gradGe.current,
    gradGeMax: reversed.gradGe.max,
    gradMeCurrent: reversed.gradMe.current,
    gradMeMax: reversed.gradMe.max,
    gradMandatoryCurrent: reversed.gradMandatory?.current || 0,
    gradMandatoryMax: reversed.gradMandatory?.max || 0,
    mandatorySelected: reversed.mandatory.current,
  }
}

/**
 * 解析申请学分基线：显式 baseline → strip 反推 → demo 默认
 * @param {object|null} app
 */
export function resolveApplicationTermCreditBaseline(app) {
  if (!app) return { ...DEFAULT_TERM_CREDIT_BASELINE }
  if (app.termCreditStripBaseline) {
    return normalizeTermCreditStripBaseline(app.termCreditStripBaseline)
  }
  const inferred = inferTermCreditStripBaseline(app.termCreditStrip, app.items || [])
  if (inferred) return inferred
  return { ...DEFAULT_TERM_CREDIT_BASELINE }
}

/**
 * 审批行是否计入学分投影（与详情快照对齐：pending 仍算，仅驳回/退回不计）
 * @param {string} decision
 */
export function approvalDecisionCountsTowardCreditStrip(decision) {
  const d = String(decision || '').trim()
  if (d === 'rejected' || d === 'update_required') return false
  // approved / pending / 空 → 计入（打开审批即与学生详情一致）
  return true
}

/**
 * 审批弹框动态学分条：通过与待定为计入；驳回/退回不计
 * @param {object|null} app
 * @param {Record<string, string>} [decisionsByKey] lineKey → approved|rejected|update_required|pending
 */
export function buildApprovalDecisionTermCreditStrip(app, decisionsByKey = {}) {
  const items = Array.isArray(app?.items) ? app.items : []
  const baseline = resolveApplicationTermCreditBaseline(app)
  const counted = items
    .filter((item, idx) => {
      const approvalKey = addDropApprovalLineKey(item, idx)
      const bareKey = addDropLineKey(item)
      const fromMap =
        decisionsByKey[approvalKey] ??
        (bareKey ? decisionsByKey[bareKey] : undefined) ??
        decisionsByKey[idx] ??
        decisionsByKey[String(idx)]
      const decision = fromMap || item.lineDecision || 'pending'
      return approvalDecisionCountsTowardCreditStrip(decision)
    })
    .map(enrichItemForCreditStrip)
  return buildAddDropTermCreditStrip({
    ...baseline,
    dropCourses: counted.filter((i) => i.action === 'Drop'),
    addCourses: counted.filter((i) => i.action === 'Add' || i.action === 'Retake'),
  })
}

/**
 * 审批学分条是否超学期 GE/ME 要求（与条上 is-over 同源）
 * @param {object|null|undefined} strip
 * @returns {{ blocked: boolean, keys: ('geTerm'|'meTerm')[] }}
 */
export function summarizeApprovalStripCreditViolations(strip) {
  /** @type {('geTerm'|'meTerm')[]} */
  const keys = []
  if (String(strip?.ge?.tone || '') === 'is-over') keys.push('geTerm')
  if (String(strip?.me?.tone || '') === 'is-over') keys.push('meTerm')
  return { blocked: keys.length > 0, keys }
}

/**
 * 是否未审完（待审 / 审核中）
 * @param {object|null|undefined} app
 */
export function isAddDropApplicationPending(app) {
  const status = String(app?.status || '')
  return status === 'Pending' || status === 'In Review'
}

/**
 * 是否学生端真实新提交的加退课申请（非主表/种子 demo）
 * 约定：submitStudentAddDropApplication 生成 id 前缀 adr-stu-
 * @param {object|null|undefined} app
 */
export function isStudentSubmittedAddDropApplication(app) {
  return String(app?.id || '').startsWith('adr-stu-')
}

/**
 * 当前演示生课表确认态学分条（无拟加/拟退）
 * 与二次申请表单顶栏 live 基线同源，供审结详情对齐
 */
export function buildLiveConfirmedTermCreditStrip() {
  const programme = getProgrammeCreditProgress()
  const term = getTermElectiveCreditProgress()
  let ge = 0
  let me = 0
  for (const item of studentConfirmedCourses.value || []) {
    if (item?.intent === 'waitlist') continue
    const enriched = enrichCourseForCreditStrip(item)
    if (isMandatoryAddDropCourse(enriched)) continue
    const kind = normalizeRegistrationType(enriched?.type || enriched?.course?.type)
    const credits = Number(enriched?.credits ?? item.credits) || 0
    if (kind === 'GE') ge += credits
    else if (kind === 'ME') me += credits
  }
  const mandatorySelected = (studentRequiredCourses.value || []).reduce(
    (sum, item) => sum + (Number(item.credits) || 0),
    0,
  )
  return buildAddDropTermCreditStrip({
    geCurrent: ge,
    geMax: Number(term?.geMax) || 0,
    meCurrent: me,
    meMax: Number(term?.meMax) || 0,
    gradGeCurrent: ge,
    gradGeMax: Number(programme.geRequired) || 0,
    gradMeCurrent: me,
    gradMeMax: Number(programme.meRequired) || 0,
    gradMandatoryCurrent: mandatorySelected,
    gradMandatoryMax: Number(programme.mandatoryRequired) || 0,
    mandatorySelected,
    dropCourses: [],
    addCourses: [],
  })
}

/**
 * 汇总未审申请的加/退行（三类主类型全部并入底账）
 * @param {object[]} pendingApps
 * @returns {{ dropCourses: object[], addCourses: object[] }}
 */
export function collectPendingLedgerCourseLines(pendingApps = []) {
  const dropCourses = []
  const addCourses = []
  for (const app of pendingApps || []) {
    if (!isAddDropApplicationPending(app)) continue
    for (const item of app.items || []) {
      if (!item) continue
      if (item.action === 'Drop') dropCourses.push(item)
      else if (item.action === 'Add' || item.action === 'Retake') addCourses.push(item)
    }
  }
  return { dropCourses, addCourses }
}

/**
 * 将未审加/退投影进基线数值（供二次申请学分条）
 * @param {object} baseline normalizeTermCreditStripBaseline 形态
 * @param {object[]} pendingApps
 * @returns {object} 仍为 baseline 形态
 */
export function applyPendingLedgerToTermCreditBaseline(baseline = {}, pendingApps = []) {
  const { dropCourses, addCourses } = collectPendingLedgerCourseLines(pendingApps)
  if (!dropCourses.length && !addCourses.length) {
    return normalizeTermCreditStripBaseline(baseline)
  }
  const strip = buildAddDropTermCreditStrip({
    ...normalizeTermCreditStripBaseline(baseline),
    dropCourses,
    addCourses,
  })
  return normalizeTermCreditStripBaseline({
    geCurrent: strip.ge?.current,
    geMax: strip.ge?.max,
    meCurrent: strip.me?.current,
    meMax: strip.me?.max,
    gradGeCurrent: strip.gradGe?.current,
    gradGeMax: strip.gradGe?.max,
    gradMeCurrent: strip.gradMe?.current,
    gradMeMax: strip.gradMe?.max,
    gradMandatoryCurrent: strip.gradMandatory?.current,
    gradMandatoryMax: strip.gradMandatory?.max,
    mandatorySelected: strip.mandatory?.current,
  })
}

/**
 * demo / 无快照时：按 items 投影生成学分要求条（固定基线）
 * @param {object[]} items
 * @param {object} [baseline]
 */
export function buildDemoTermCreditStripFromItems(items = [], baseline = {}) {
  const dropCourses = (items || []).filter((i) => i.action === 'Drop')
  const addCourses = (items || []).filter(
    (i) => i.action === 'Add' || i.action === 'Retake',
  )
  const base = normalizeTermCreditStripBaseline({
    ...DEFAULT_TERM_CREDIT_BASELINE,
    ...baseline,
  })
  return buildAddDropTermCreditStrip({
    ...base,
    dropCourses,
    addCourses,
  })
}
