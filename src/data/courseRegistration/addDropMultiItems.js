/**
 * 加退重修多课清单：净学分、学期帽、行键、学分条投影
 */

import { entryHasActivePermission, getSupplementEntry } from './supplementListQueue.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { resolveAddDropFeeCategoryKey } from './studentRegistrationContext.js'
import { getCourseByCode, getCourseById } from './selectableCourses.js'

/** 审批行补齐 type，便于学分条按 GE/ME/必修投影 */
function enrichItemForCreditStrip(item) {
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
    if (!course) return
    const credits = Number(course.credits) || 0
    if (!credits) return
    if (isMandatoryAddDropCourse(course)) {
      mandatory = Math.max(0, mandatory + sign * credits)
      gradMandatory = Math.max(0, gradMandatory + sign * credits)
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
    /** 毕业必修已选/要求（仅供学分情况 tip；七列不展示） */
    gradMandatory: {
      current: gradMandatory,
      max: gradMandatoryMax,
      tone: toneForSelectedRequired(gradMandatory, gradMandatoryMax),
    },
    ge: { current: ge, max: geMax, tone: toneForSelectedRequired(ge, geMax) },
    me: { current: me, max: meMax, tone: toneForSelectedRequired(me, meMax) },
    /** 学期选修已选 = GE 已选 + ME 已选 */
    elective: { current: ge + me, tone: 'is-neutral' },
    mandatory: { current: mandatory, tone: 'is-neutral' },
    /** 已选总学分 = 学期选修 + 学期必修 */
    totalSelected: { current: ge + me + mandatory, tone: 'is-neutral' },
  }
}

/**
 * 按学分要求条数据汇总毕业累计未修（要求 − 已选）
 * @param {object|null|undefined} strip
 * @returns {{ mandatory: number, ge: number, me: number, hasDeficit: boolean }}
 */
export function summarizeAddDropStripCreditGaps(strip) {
  const geCur = Number(strip?.gradGe?.current) || 0
  const geMax = Number(strip?.gradGe?.max) || 0
  const meCur = Number(strip?.gradMe?.current) || 0
  const meMax = Number(strip?.gradMe?.max) || 0
  const manCur = Number(strip?.gradMandatory?.current) || 0
  const manMax = Number(strip?.gradMandatory?.max) || 0
  const mandatory = Math.max(0, manMax - manCur)
  const ge = Math.max(0, geMax - geCur)
  const me = Math.max(0, meMax - meCur)
  return {
    mandatory,
    ge,
    me,
    hasDeficit: mandatory > 0 || ge > 0 || me > 0,
  }
}

/** 有学分要求条的加/退/重修场景均展示学分情况 tip */
export function shouldShowAddDropCreditSituationTip(appType) {
  return (
    appType === 'Add' ||
    appType === 'Drop' ||
    appType === 'Retake' ||
    appType === 'AddDrop' ||
    appType === 'RetakeDrop'
  )
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
  gradMandatoryCurrent: 54,
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
 * 审批弹框动态学分条：仅「通过」行计入
 * @param {object|null} app
 * @param {Record<string, string>} [decisionsByKey] lineKey → approved|rejected|update_required|pending
 */
export function buildApprovalDecisionTermCreditStrip(app, decisionsByKey = {}) {
  const items = Array.isArray(app?.items) ? app.items : []
  const baseline = resolveApplicationTermCreditBaseline(app)
  const approved = items
    .filter((item, idx) => {
      const key = addDropLineKey(item) || String(idx)
      return decisionsByKey[key] === 'approved'
    })
    .map(enrichItemForCreditStrip)
  return buildAddDropTermCreditStrip({
    ...baseline,
    dropCourses: approved.filter((i) => i.action === 'Drop'),
    addCourses: approved.filter((i) => i.action === 'Add' || i.action === 'Retake'),
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
