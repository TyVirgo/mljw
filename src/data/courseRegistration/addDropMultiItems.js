/**
 * 加退重修多课清单：净学分、学期帽、行键、学分条投影
 */

import { entryHasActivePermission, getSupplementEntry } from './supplementListQueue.js'
import { getCampusCreditBypassExtra } from './registrationRuleSettings.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import {
  getProgrammeCreditProgress,
  resolveAddDropFeeCategoryKey,
  sumConfirmedCreditsByKind,
} from './studentRegistrationContext.js'
import {
  getTermElectiveCreditProgress,
  studentConfirmedCourses,
  studentRequiredCourses,
} from './studentRegistrationStore.js'
import { getCourseByCode, getCourseById } from './selectableCourses.js'
import {
  mergeAddDropLineWithCatalog,
  resolveCreditStripBucketFromCategory,
} from './unifiedCourseCategory.js'
import {
  buildBaselineSlotsFromCourseLike,
  getSectionMeetingsConflictInfo,
} from './addDropSectionConflict.js'
import { buildHardScheduleConflictResult } from './studentRegistrationScheduleConflict.js'

/**
 * 归一加退行 action（避免大小写导致不计入学分投影）
 * @param {string|null|undefined} action
 * @returns {'Drop'|'Add'|'Retake'|string}
 */
export function normalizeAddDropLineAction(action) {
  const raw = String(action || '').trim()
  const lower = raw.toLowerCase()
  if (lower === 'drop') return 'Drop'
  if (lower === 'add') return 'Add'
  if (lower === 'retake') return 'Retake'
  return raw
}

/**
 * 重提行是否计入课表投影 / 冲突拟退（增量 bi，与重提课程预览同源）
 * 已通过：计入；不通过/未改驳回/已取消：不计；驳回或 pending 已换课：计入
 * @param {object|null|undefined} item 申请行
 * @returns {boolean}
 */
export function countsTowardResubmitScheduleEffect(item) {
  const decision = String(item?.lineDecision || '').trim()
  if (decision === 'approved') return true
  if (decision === 'rejected' || decision === 'cancelled') return false
  if (decision === 'update_required' || decision === 'pending') {
    return Boolean(item?.resubmitLineModified)
  }
  return false
}

/**
 * 补齐 type/sourceType/学分，与表头统一类别同源后再投影
 * @param {object|null|undefined} item
 */
export function enrichCourseForCreditStrip(item) {
  if (!item) return item
  const merged = mergeAddDropLineWithCatalog(item, { getCourseById, getCourseByCode })
  if (!merged) return item
  return {
    ...merged,
    action: normalizeAddDropLineAction(item.action),
  }
}

/**
 * 解析学分条分桶（与审批表头课程类型列对齐）
 * @param {object|null|undefined} item
 * @returns {''|'mandatory'|'GE'|'ME'}
 */
export function resolveAddDropCreditStripBucket(item) {
  const enriched = enrichCourseForCreditStrip(item)
  if (!enriched) return ''
  const fromUnified = resolveCreditStripBucketFromCategory(enriched)
  if (fromUnified) return fromUnified
  if (isMandatoryAddDropCourse(enriched)) return 'mandatory'
  // type 兜底：避免个别行分桶空导致加减与基线覆盖均跳过
  const kind = normalizeRegistrationType(enriched.type || enriched.course?.type)
  if (kind === 'GE') return 'GE'
  if (kind === 'ME') return 'ME'
  if (kind === 'Mandatory') return 'mandatory'
  return ''
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
 * 学分条 GE/ME 学期超出：仅「扣因修未修后」仍超学期要求的部分
 * 超出 = max(0, cur − (termMax + 因修未修))；因修未修补上的不算超出
 * @param {{ ge?: { current?: number, max?: number }, me?: { current?: number, max?: number } }|null|undefined} strip
 * @param {{ ge?: number, me?: number }|null} [catchUpCredits] 因修未修额度（与 tip 同源）
 * @returns {number}
 */
export function sumGeMeTermStripExcess(strip, catchUpCredits = null) {
  const catchUpGe = Math.max(0, Number(catchUpCredits?.ge) || 0)
  const catchUpMe = Math.max(0, Number(catchUpCredits?.me) || 0)
  let excess = 0
  for (const key of ['ge', 'me']) {
    const bar = strip?.[key]
    const cur = Number(bar?.current) || 0
    const max = Math.max(0, Number(bar?.max) || 0)
    const deficit = key === 'ge' ? catchUpGe : catchUpMe
    const effectiveMax = max + deficit
    if (cur > effectiveMax) excess += cur - effectiveMax
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

/**
 * 是否仅白名单突破学分（不含校级 CR204）
 * @deprecated 闸门请用 {@link hasEffectiveCreditMaxBypass}；保留供白名单 UI/名单逻辑
 * @param {string} studentId
 */
export function hasWhitelistCreditMaxBypass(studentId) {
  const entry = getSupplementEntry(studentId)
  return entryHasActivePermission(entry, 'bypassCreditMax')
}

/**
 * 白名单允许超学期上限的学分数（1–3）；无权限返回 0
 * @deprecated 闸门请用 {@link getEffectiveCreditBypassExtra}
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
 * 有效可超学期学分：校级全局（CR204）与白名单取较大值
 * @param {string} studentId
 * @returns {number} 0 表示不可超；1–3 为可超额度
 */
export function getEffectiveCreditBypassExtra(studentId) {
  const campus = getCampusCreditBypassExtra()
  const whitelist = getWhitelistCreditBypassExtra(studentId)
  return Math.max(campus, whitelist)
}

/**
 * 是否允许突破学期学分上限（校级或白名单任一生效）
 * @param {string} studentId
 */
export function hasEffectiveCreditMaxBypass(studentId) {
  return getEffectiveCreditBypassExtra(studentId) > 0
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
 * 根据行级决策汇总整单内部 status
 * 增量 aa：有驳回行（update_required）→ Rejected（展示已驳回）；
 * 仅通过/不通过 → Approved / PartiallyApproved / Rejected（展示已结束）
 * @param {object[]} items
 * @returns {'Approved'|'Rejected'|'PartiallyApproved'|'Pending'}
 */
export function summarizeLineDecisions(items = []) {
  const decisions = (items || []).map((i) => String(i.lineDecision || i.decision || 'pending'))
  if (!decisions.length) return 'Pending'
  const approved = decisions.filter((d) => d === 'approved').length
  const rejected = decisions.filter((d) => d === 'rejected').length
  const updateRequired = decisions.filter((d) => d === 'update_required').length
  const pending = decisions.filter((d) => d === 'pending' || !d).length
  if (pending > 0) return 'Pending'
  // 任一驳回行 → 内部 Rejected（列表展示已驳回）
  if (updateRequired > 0) return 'Rejected'
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
 * 截止到当前学期落下未修（按给定学分条已选计算）
 * 展示：矩阵未修跟传入 strip（可含拟加/拟退投影，增量 ah）
 * tip 固定落下请用 {@link buildFixedSituationCatchUpFromBaseline}
 * @param {object|null|undefined} strip
 * @returns {{ mandatory: number, ge: number, me: number, hasDeficit: boolean }}
 */
export function resolveAddDropSituationCreditGaps(strip = null) {
  const programme = getProgrammeCreditProgress()
  const confirmed = sumConfirmedCreditsByKind()
  // prior = 培养方案已修 − 确认半池（确认半池已体现在条上 current）
  const priorMandatory = Math.max(
    0,
    (Number(programme.mandatoryEarned) || 0) - (Number(confirmed.mandatory) || 0),
  )
  const priorGe = Math.max(
    0,
    (Number(programme.geEarned) || 0) - (Number(confirmed.ge) || 0),
  )
  const priorMe = Math.max(
    0,
    (Number(programme.meEarned) || 0) - (Number(confirmed.me) || 0),
  )
  return summarizeAddDropStripCreditGaps(strip, {
    mandatoryPriorEarned: priorMandatory,
    gePriorEarned: priorGe,
    mePriorEarned: priorMe,
  })
}

/**
 * 由学分条生成蓝底 tip 固定快照（增量 ah：不再驱动矩阵未修行）
 * @param {object|null|undefined} strip
 * @returns {{
 *   ge: number, me: number, mandatory: number,
 *   geEarned: number, meEarned: number, mandatoryEarned: number,
 * }}
 */
export function buildSituationCatchUpDisplayFromStrip(strip) {
  const gaps = resolveAddDropSituationCreditGaps(strip)
  return {
    ge: gaps.ge,
    me: gaps.me,
    mandatory: gaps.mandatory,
    geEarned: Number(strip?.ge?.current) || 0,
    meEarned: Number(strip?.me?.current) || 0,
    mandatoryEarned: Number(strip?.mandatory?.current) || 0,
  }
}

/**
 * 学期基线 → 蓝底 tip 固定落下（无本单拟加/拟退）
 * @param {object|null|undefined} baseline buildAddDropTermCreditStrip 基线字段
 */
export function buildFixedSituationCatchUpFromBaseline(baseline) {
  const strip = buildAddDropTermCreditStrip({
    ...(baseline || {}),
    dropCourses: [],
    addCourses: [],
  })
  return buildSituationCatchUpDisplayFromStrip(strip)
}

/**
 * 申请对象 → 因修未修固定展示（详情/审批/重提）
 * @param {object|null|undefined} app
 */
export function buildFixedSituationCatchUpFromApplication(app) {
  const baseline = resolveApplicationTermCreditBaseline(app)
  return buildFixedSituationCatchUpFromBaseline(baseline)
}

/**
 * GE/ME 拟加后是否超过「本学期要求 + 因修未修」合计可选上限
 * 学分条学期格分母同合计（固定 base）；本函数供硬拦
 * @param {object|null} baseline
 * @param {{
 *   dropCourses?: object[],
 *   addCourses?: object[],
 *   kind?: 'GE'|'ME',
 *   deficit?: number,
 * }} [opts]
 */
export function wouldExceedAddDropElectiveTermCap(baseline, opts = {}) {
  if (!baseline) return false
  const kind = normalizeRegistrationType(opts.kind || 'GE')
  if (kind !== 'GE' && kind !== 'ME') return false
  const strip = buildAddDropTermCreditStrip({
    ...baseline,
    dropCourses: opts.dropCourses || [],
    addCourses: opts.addCourses || [],
  })
  const bucket = kind === 'GE' ? strip.ge : strip.me
  const termMax = Math.max(0, Number(bucket?.max) || 0)
  const deficit = Math.max(0, Number(opts.deficit) || 0)
  const effectiveMax = termMax + deficit
  const current = Math.max(0, Number(bucket?.current) || 0)
  return current > effectiveMax
}

/**
 * 超限提示参数：合计上限 = 学期要求 + 因修未修
 * @param {object|null} baseline
 * @param {{
 *   dropCourses?: object[],
 *   addCourses?: object[],
 *   kind?: 'GE'|'ME',
 *   deficit?: number,
 * }} [opts]
 * @returns {{ type: string, used: number, max: number, deficit: number, termMax: number }|null}
 */
export function resolveAddDropElectiveTermCapMessageParams(baseline, opts = {}) {
  if (!baseline) return null
  const kind = normalizeRegistrationType(opts.kind || 'GE')
  if (kind !== 'GE' && kind !== 'ME') return null
  const strip = buildAddDropTermCreditStrip({
    ...baseline,
    dropCourses: opts.dropCourses || [],
    addCourses: opts.addCourses || [],
  })
  const bucket = kind === 'GE' ? strip.ge : strip.me
  const termMax = Math.max(0, Number(bucket?.max) || 0)
  const deficit = Math.max(0, Number(opts.deficit) || 0)
  return {
    type: kind,
    used: Math.max(0, Number(bucket?.current) || 0),
    max: termMax + deficit,
    deficit,
    termMax,
  }
}

/**
 * 拟加/拟退后学期 GE 是否超过「学期要求 + 因修未修」
 * @param {object|null} baseline
 * @param {{ dropCourses?: object[], addCourses?: object[], deficit?: number, geDeficit?: number }} [opts]
 * @deprecated 新逻辑请用 wouldExceedAddDropElectiveTermCap；保留此名兼容旧调用
 */
export function wouldExceedAddDropGeTermCap(baseline, opts = {}) {
  return wouldExceedAddDropElectiveTermCap(baseline, {
    ...opts,
    kind: 'GE',
    deficit: opts.geDeficit ?? opts.deficit ?? 0,
  })
}

/**
 * 已选相对要求的色调：超出红 / 选满绿 / 未满灰
 * @param {number} current 已选学分
 * @param {number} max 有效上限（可为学期要求+因修未修）
 * @returns {'is-over'|'is-met'|'is-short'}
 */
function toneForSelectedRequired(current, max) {
  if (max > 0 && current > max) return 'is-over'
  if (max > 0 && current >= max) return 'is-met'
  return 'is-short'
}

/**
 * 学期格展示：已选/总要求（要求+因修未修）
 * 例：4/26（22+4）——分子为学期已选，括号后项为因修未修固定 base
 * @deprecated 学分要求已改为矩阵表，学期格不再把因修未修写进分母括号
 * @param {number} current 学期已选学分
 * @param {number} termMax 本学期要求（无配额时为 0）
 * @param {number} catchUpBase 因修未修固定 base
 * @returns {string}
 */
export function formatTermSelectedTotalRequired(current, termMax, catchUpBase) {
  const selected = Math.max(0, Number(current) || 0)
  const required = Math.max(0, Number(termMax) || 0)
  const catchUp = Math.max(0, Number(catchUpBase) || 0)
  const totalRequired = required + catchUp
  return `${selected}/${totalRequired}（${required}+${catchUp}）`
}

/**
 * 学期格 tone：按「要求 + 因修未修」合计上限着色
 * @param {number} current 学期已选
 * @param {number} termMax 本学期要求
 * @param {number} catchUpBase 因修未修固定 base
 * @returns {'is-over'|'is-met'|'is-short'}
 */
export function toneForTermSelectedWithCatchUp(current, termMax, catchUpBase) {
  const selected = Math.max(0, Number(current) || 0)
  const required = Math.max(0, Number(termMax) || 0)
  const catchUp = Math.max(0, Number(catchUpBase) || 0)
  return toneForSelectedRequired(selected, required + catchUp)
}

/**
 * Demo：培养方案本学期必修学分要求（展示用，不接真接口）
 * 与已选 9、因修未修 base 4 组合可呈 9/13（9+4）
 */
export const DEMO_TERM_MANDATORY_CREDIT_MAX = 9

/**
 * 加退课学分条：毕业 GE/ME + 学期 GE/ME + 学期选修/必修（无分类）
 * @param {{
 *   geCurrent?: number, geMax?: number,
 *   meCurrent?: number, meMax?: number,
 *   gradGeCurrent?: number, gradGeMax?: number,
 *   gradMeCurrent?: number, gradMeMax?: number,
 *   gradMandatoryCurrent?: number, gradMandatoryMax?: number,
 *   mandatorySelected?: number,
 *   mandatoryMax?: number,
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
  // 学期必修要求：缺省用 demo 培养方案学期配额
  const mandatoryMax =
    opts.mandatoryMax != null
      ? Math.max(0, Number(opts.mandatoryMax) || 0)
      : DEMO_TERM_MANDATORY_CREDIT_MAX

  function apply(course, sign) {
    const enriched = enrichCourseForCreditStrip(course)
    if (!enriched) return
    const credits = Number(enriched.credits) || 0
    if (!credits) return
    // 与表头统一类别同源：必修 / GE / ME（resolve 内含 type 兜底）
    const bucket = resolveAddDropCreditStripBucket(enriched)
    if (bucket === 'mandatory') {
      mandatory = Math.max(0, mandatory + sign * credits)
      gradMandatory = Math.max(0, gradMandatory + sign * credits)
      return
    }
    if (bucket === 'GE') {
      ge = Math.max(0, ge + sign * credits)
      gradGe = Math.max(0, gradGe + sign * credits)
      return
    }
    if (bucket === 'ME') {
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
    /** 学期选修已选 = GE 已选 + ME 已选（二级格，色由行决定） */
    elective: { current: ge + me, tone: 'is-neutral' },
    /**
     * 学期必修：一级格；max 为培养方案本学期要求（demo 默认 9）
     * 条上着色可再叠加因修未修 base（见 AddDropTermCreditStrip）
     */
    mandatory: {
      current: mandatory,
      max: mandatoryMax,
      tone: toneForSelectedRequired(mandatory, mandatoryMax),
    },
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
 * 按学分要求条汇总截止到当前学期落下未修
 * 落下 = 要求 − (历史 prior + 条上已选投影)；无 prior 时 = 要求 − 条上已选
 * @param {object|null|undefined} strip
 * @param {{
 *   mandatoryPriorEarned?: number,
 *   gePriorEarned?: number,
 *   mePriorEarned?: number,
 * }|null} [opts]
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
  const priorGe = Math.max(0, Number(opts?.gePriorEarned) || 0)
  const priorMe = Math.max(0, Number(opts?.mePriorEarned) || 0)
  // 落下 = 要求 − (历史已修 + 条上已选)；展示层应传入无本单勾选的基线条
  const mandatory = Math.max(
    0,
    opts?.mandatoryPriorEarned != null ? manMax - priorMan - manCur : manMax - manCur,
  )
  const ge = Math.max(
    0,
    opts?.gePriorEarned != null ? geMax - priorGe - geCur : geMax - geCur,
  )
  const me = Math.max(
    0,
    opts?.mePriorEarned != null ? meMax - priorMe - meCur : meMax - meCur,
  )
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
/**
 * 是否为嵌套学分条形态（含 ge.current），误存为 baseline 时需展开
 * @param {object|null|undefined} value
 */
function isNestedTermCreditStripShape(value) {
  if (!value || typeof value !== 'object') return false
  return value.ge != null || value.me != null || value.mandatory != null
}

/**
 * 嵌套 strip → 扁平 baseline（兼容误把 termCreditStrip 写入 baseline）
 * @param {object} strip
 */
function flattenNestedTermCreditStripToBaseline(strip) {
  return {
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
    mandatoryMax:
      strip.mandatory?.max != null
        ? Number(strip.mandatory.max) || 0
        : DEMO_TERM_MANDATORY_CREDIT_MAX,
  }
}

export function normalizeTermCreditStripBaseline(baseline = {}) {
  // 误存嵌套 strip 时先展开，避免 geCurrent 全落 0 导致投影失真
  const flat = isNestedTermCreditStripShape(baseline)
    ? flattenNestedTermCreditStripToBaseline(baseline)
    : baseline
  return {
    geCurrent: Number(flat.geCurrent) || 0,
    geMax: Number(flat.geMax) || 0,
    meCurrent: Number(flat.meCurrent) || 0,
    meMax: Number(flat.meMax) || 0,
    gradGeCurrent: Number(flat.gradGeCurrent) || 0,
    gradGeMax: Number(flat.gradGeMax) || 0,
    gradMeCurrent: Number(flat.gradMeCurrent) || 0,
    gradMeMax: Number(flat.gradMeMax) || 0,
    gradMandatoryCurrent: Number(flat.gradMandatoryCurrent) || 0,
    gradMandatoryMax: Number(flat.gradMandatoryMax) || 0,
    mandatorySelected: Number(flat.mandatorySelected) || 0,
    // 缺省保留 demo 学期必修要求，避免归一化时掉成 0
    mandatoryMax:
      flat.mandatoryMax != null
        ? Math.max(0, Number(flat.mandatoryMax) || 0)
        : DEMO_TERM_MANDATORY_CREDIT_MAX,
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
  /** 培养方案本学期必修要求（demo） */
  mandatoryMax: DEMO_TERM_MANDATORY_CREDIT_MAX,
}

/**
 * 由提交时学分条反推申请前基线（将加/退作用反向）
 * @param {object|null} strip
 * @param {object[]} [items]
 */
export function inferTermCreditStripBaseline(strip, items = []) {
  if (!strip) return null
  const enriched = (items || []).map(enrichItemForCreditStrip)
  const drops = enriched.filter((i) => normalizeAddDropLineAction(i.action) === 'Drop')
  const adds = enriched.filter((i) => {
    const action = normalizeAddDropLineAction(i.action)
    return action === 'Add' || action === 'Retake'
  })
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
    mandatoryMax:
      strip.mandatory?.max != null
        ? Number(strip.mandatory.max) || 0
        : DEMO_TERM_MANDATORY_CREDIT_MAX,
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
    mandatoryMax: reversed.mandatory?.max ?? DEMO_TERM_MANDATORY_CREDIT_MAX,
  }
}

/**
 * 解析申请学分基线：显式 baseline → strip 反推 → demo 默认
 * @param {object|null} app
 */
export function resolveApplicationTermCreditBaseline(app) {
  if (!app) return { ...DEFAULT_TERM_CREDIT_BASELINE }
  if (app.termCreditStripBaseline) {
    // 误把投影 strip 存进 baseline：先反推再投影，避免双重扣减且行决策无效
    if (isNestedTermCreditStripShape(app.termCreditStripBaseline)) {
      const inferredFromNested = inferTermCreditStripBaseline(
        app.termCreditStripBaseline,
        app.items || [],
      )
      if (inferredFromNested) return inferredFromNested
    }
    return normalizeTermCreditStripBaseline(app.termCreditStripBaseline)
  }
  const inferred = inferTermCreditStripBaseline(app.termCreditStrip, app.items || [])
  if (inferred) return inferred
  return { ...DEFAULT_TERM_CREDIT_BASELINE }
}

/**
 * 按课类汇总本单退课学分（投影分桶同源）
 * @param {object[]} items
 * @returns {{ mandatory: number, ge: number, me: number }}
 */
export function sumDropCreditsByStripBucket(items = []) {
  const out = { mandatory: 0, ge: 0, me: 0 }
  for (const item of items || []) {
    if (normalizeAddDropLineAction(item?.action) !== 'Drop') continue
    const enriched = enrichCourseForCreditStrip(item)
    const credits = Number(enriched?.credits) || 0
    if (!credits) continue
    const bucket = resolveAddDropCreditStripBucket(enriched)
    if (bucket === 'mandatory') out.mandatory += credits
    else if (bucket === 'GE') out.ge += credits
    else if (bucket === 'ME') out.me += credits
  }
  return out
}

/**
 * 基线各桶已选至少覆盖本单全部拟退学分
 * 增量 aq：避免 max(0, 基线−拟退) 触底后，否/驳个别退课看不出已选回升
 * @param {object|null|undefined} baseline
 * @param {object[]} [items]
 * @returns {object} normalize 后的 baseline
 */
export function ensureBaselineCoversDropItems(baseline, items = []) {
  const base = normalizeTermCreditStripBaseline(baseline)
  const dropSums = sumDropCreditsByStripBucket(items)
  return normalizeTermCreditStripBaseline({
    ...base,
    mandatorySelected: Math.max(Number(base.mandatorySelected) || 0, dropSums.mandatory),
    gradMandatoryCurrent: Math.max(Number(base.gradMandatoryCurrent) || 0, dropSums.mandatory),
    geCurrent: Math.max(Number(base.geCurrent) || 0, dropSums.ge),
    gradGeCurrent: Math.max(Number(base.gradGeCurrent) || 0, dropSums.ge),
    meCurrent: Math.max(Number(base.meCurrent) || 0, dropSums.me),
    gradMeCurrent: Math.max(Number(base.gradMeCurrent) || 0, dropSums.me),
  })
}

/**
 * 审批行是否计入学分投影（与详情快照对齐：pending 仍算，仅驳回/退回不计）
 * @param {string} decision
 */
export function approvalDecisionCountsTowardCreditStrip(decision) {
  const d = String(decision || '').trim()
  // 增量 bf：已取消同驳回，不计入学分投影
  if (d === 'rejected' || d === 'update_required' || d === 'cancelled') return false
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
  // 增量 aq：基线至少覆盖全部拟退，否个别退课时已选必能回升
  const baseline = ensureBaselineCoversDropItems(
    resolveApplicationTermCreditBaseline(app),
    items,
  )
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
    dropCourses: counted.filter((i) => normalizeAddDropLineAction(i.action) === 'Drop'),
    addCourses: counted.filter((i) => {
      const action = normalizeAddDropLineAction(i.action)
      return action === 'Add' || action === 'Retake'
    }),
  })
}

/**
 * 审批学分条是否超「学期要求 + 因修未修」（与学生硬拦同源）
 * 增量 an：不再用条上 tone===is-over（相对学期要求发红）单独阻断
 * @param {object|null|undefined} strip
 * @param {{ ge?: number, me?: number }|null} [catchUpCredits] 因修未修（与蓝 tip 同源）
 * @returns {{ blocked: boolean, keys: ('geTerm'|'meTerm')[] }}
 */
export function summarizeApprovalStripCreditViolations(strip, catchUpCredits = null) {
  /** @type {('geTerm'|'meTerm')[]} */
  const keys = []
  if (!strip) return { blocked: false, keys }
  const catchUpGe = Math.max(0, Number(catchUpCredits?.ge) || 0)
  const catchUpMe = Math.max(0, Number(catchUpCredits?.me) || 0)
  const geCur = Number(strip?.ge?.current) || 0
  const geMax = Math.max(0, Number(strip?.ge?.max) || 0)
  const meCur = Number(strip?.me?.current) || 0
  const meMax = Math.max(0, Number(strip?.me?.max) || 0)
  if (geCur > geMax + catchUpGe) keys.push('geTerm')
  if (meCur > meMax + catchUpMe) keys.push('meTerm')
  return { blocked: keys.length > 0, keys }
}

/**
 * 任一桶已选是否超过「学期要求 + 因修未修」（含必修；软提示用，不禁选）
 * @param {object|null|undefined} strip
 * @param {{ ge?: number, me?: number, mandatory?: number }|null} [catchUpCredits]
 * @returns {{ over: boolean, keys: ('mandatoryTerm'|'geTerm'|'meTerm')[] }}
 */
export function summarizeApprovalCatchUpSoftExcess(strip, catchUpCredits = null) {
  /** @type {('mandatoryTerm'|'geTerm'|'meTerm')[]} */
  const keys = []
  if (!strip) return { over: false, keys }
  const catchUpGe = Math.max(0, Number(catchUpCredits?.ge) || 0)
  const catchUpMe = Math.max(0, Number(catchUpCredits?.me) || 0)
  const catchUpMandatory = Math.max(0, Number(catchUpCredits?.mandatory) || 0)
  const geCur = Number(strip?.ge?.current) || 0
  const geMax = Math.max(0, Number(strip?.ge?.max) || 0)
  const meCur = Number(strip?.me?.current) || 0
  const meMax = Math.max(0, Number(strip?.me?.max) || 0)
  const mandatoryCur = Number(strip?.mandatory?.current) || 0
  const mandatoryMax = Math.max(0, Number(strip?.mandatory?.max) || 0)
  if (mandatoryCur > mandatoryMax + catchUpMandatory) keys.push('mandatoryTerm')
  if (geCur > geMax + catchUpGe) keys.push('geTerm')
  if (meCur > meMax + catchUpMe) keys.push('meTerm')
  return { over: keys.length > 0, keys }
}

/**
 * 是否存在不计入学分投影的退课决策（不通过/驳回）
 * @param {object|null|undefined} app
 * @param {Record<string, string>} [decisionsByKey]
 * @returns {boolean}
 */
export function hasRejectedOrReturnedDropDecision(app, decisionsByKey = {}) {
  const items = Array.isArray(app?.items) ? app.items : []
  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx]
    if (normalizeAddDropLineAction(item?.action) !== 'Drop') continue
    const decision = resolveLineDecisionFromMap(item, idx, decisionsByKey)
    if (!approvalDecisionCountsTowardCreditStrip(decision)) return true
  }
  return false
}

/**
 * 不同意退课（仅 rejected）恢复后，是否与仍计入的加课/重修时段冲突（增量 bd / bj）
 * @param {object|null|undefined} app
 * @param {Record<string, string>} [decisionsByKey]
 * @param {{ lockedDecisionKeys?: Record<string, boolean>|Set<string> }} [options]
 *   增量 bj：退课决策已锁定时，提示以加课/重修为问题点
 * @returns {{ conflict: boolean, errorKey?: string, errorParams?: object, dropCourseCode?: string }}
 */
export function summarizeApprovalDropRejectScheduleConflicts(
  app,
  decisionsByKey = {},
  options = {},
) {
  const items = Array.isArray(app?.items) ? app.items : []
  const locked = options?.lockedDecisionKeys || {}
  const isLockedKey = (key) => {
    if (!key) return false
    if (locked instanceof Set) return locked.has(key)
    return Boolean(locked[key])
  }
  /** @type {{ item: object, idx: number }[]} */
  const rejectedDrops = []
  /** @type {object[]} */
  const countingAddRetakes = []
  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx]
    if (!item) continue
    const action = normalizeAddDropLineAction(item.action)
    const decision = resolveLineDecisionFromMap(item, idx, decisionsByKey)
    // 仅「不同意」退课；驳回不触发
    if (action === 'Drop' && String(decision || '').trim() === 'rejected') {
      rejectedDrops.push({ item, idx })
      continue
    }
    if (
      (action === 'Add' || action === 'Retake') &&
      approvalDecisionCountsTowardCreditStrip(decision)
    ) {
      countingAddRetakes.push(item)
    }
  }
  if (!rejectedDrops.length || !countingAddRetakes.length) {
    return { conflict: false }
  }
  const peerSlots = []
  for (const peer of countingAddRetakes) {
    peerSlots.push(...buildBaselineSlotsFromCourseLike(peer))
  }
  for (const { item: drop, idx } of rejectedDrops) {
    const info = getSectionMeetingsConflictInfo(
      {
        time: drop.time || drop.classTime || '',
        meetings: drop.meetings || null,
      },
      peerSlots,
    )
    if (!info.conflict) continue
    const hard = buildHardScheduleConflictResult(info)
    const dropKey = addDropApprovalLineKey(drop, idx)
    const bareKey = addDropLineKey(drop)
    const dropLocked = isLockedKey(dropKey) || isLockedKey(bareKey)
    // 增量 bj：锁定退课 → 以加课/重修为问题点；当场否退仍用原话术
    const errorKey = dropLocked
      ? 'courseRegistration.approval.addRetakeConflictsRetainedDropHint'
      : 'courseRegistration.approval.dropRejectScheduleConflictHint'
    return {
      conflict: true,
      errorKey,
      errorParams: {
        dropCourse: drop.courseCode || drop.courseName || '—',
        course: hard.errorParams?.course || '—',
        time: hard.errorParams?.time || '—',
      },
      dropCourseCode: String(drop.courseCode || '').trim(),
    }
  }
  return { conflict: false }
}

/**
 * 从决策 map 取某行决策
 * 增量 bh：已有 live map 时 MUST NOT 回落 items 上陈旧 lineDecision（否则退课改通过后冲突红字不消）
 * @param {object} item
 * @param {number} idx
 * @param {Record<string, string>} decisionsByKey
 */
function resolveLineDecisionFromMap(item, idx, decisionsByKey = {}) {
  const approvalKey = addDropApprovalLineKey(item, idx)
  const bareKey = addDropLineKey(item)
  const map = decisionsByKey || {}
  const hasLiveMap = Object.keys(map).length > 0
  if (Object.prototype.hasOwnProperty.call(map, approvalKey)) return map[approvalKey]
  if (bareKey && Object.prototype.hasOwnProperty.call(map, bareKey)) return map[bareKey]
  if (Object.prototype.hasOwnProperty.call(map, idx)) return map[idx]
  if (Object.prototype.hasOwnProperty.call(map, String(idx))) return map[String(idx)]
  // 有 live map 却未命中键：按待定，禁止读陈旧 item.lineDecision
  if (hasLiveMap) return 'pending'
  return item?.lineDecision ?? 'pending'
}

/**
 * 是否存在「退课行」由计入变为不计入（否退/驳回退课）
 * @param {object|null|undefined} app
 * @param {Record<string, string>} previousDecisionsByKey
 * @param {Record<string, string>} nextDecisionsByKey
 */
export function hasDropLineBecomingExcludedFromCredit(
  app,
  previousDecisionsByKey = {},
  nextDecisionsByKey = {},
) {
  const items = Array.isArray(app?.items) ? app.items : []
  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx]
    if (normalizeAddDropLineAction(item?.action) !== 'Drop') continue
    const prevDecision = resolveLineDecisionFromMap(item, idx, previousDecisionsByKey)
    const nextDecision = resolveLineDecisionFromMap(item, idx, nextDecisionsByKey)
    const prevCounts = approvalDecisionCountsTowardCreditStrip(prevDecision)
    const nextCounts = approvalDecisionCountsTowardCreditStrip(nextDecision)
    if (prevCounts && !nextCounts) return true
  }
  return false
}

/**
 * 拟议决策下是否仍有计入学分条的加课/重修行（门控 B 前提）
 * 纯退课单或加/重修均已否/驳时返回 false，否退回升学分不应被拦
 * @param {object|null|undefined} app
 * @param {Record<string, string>} decisionsByKey 拟议决策 map
 * @returns {boolean}
 */
export function hasApprovedAddOrRetakeCountingTowardCredit(app, decisionsByKey = {}) {
  const items = Array.isArray(app?.items) ? app.items : []
  for (let idx = 0; idx < items.length; idx += 1) {
    const action = normalizeAddDropLineAction(items[idx]?.action)
    // 仅加课/重修计入；退课行不构成「依赖加课超限」前提
    if (action !== 'Add' && action !== 'Retake') continue
    const decision = resolveLineDecisionFromMap(items[idx], idx, decisionsByKey)
    if (approvalDecisionCountsTowardCreditStrip(decision)) return true
  }
  return false
}

/**
 * 审批行决策变更校验（依赖门控 B）
 * 仅「否退课」且仍有计入的加/重修时，新引入或加重学期 GE/ME 超限才禁止；
 * 纯退课 / 加重修均已否驳 / 否加课等合理操作一律放行（确认门控再拦终态超限）
 * @param {object|null|undefined} app
 * @param {Record<string, string>} decisionsByKey 拟议决策
 * @param {Record<string, string>|null|undefined} [previousDecisionsByKey] 变更前决策
 * @returns {{ ok: boolean, keys: ('geTerm'|'meTerm')[] }}
 */
export function validateApprovalLineDecisionsMap(
  app,
  decisionsByKey = {},
  previousDecisionsByKey = null,
) {
  // 与确认门控同源：超限 = 已选 > 学期要求 + 因修未修（GE/ME）
  const catchUp = buildFixedSituationCatchUpFromApplication(app)
  const nextStrip = buildApprovalDecisionTermCreditStrip(app, decisionsByKey)
  const nextViolations = summarizeApprovalStripCreditViolations(nextStrip, catchUp)
  if (!nextViolations.blocked) {
    return { ok: true, keys: [] }
  }
  // 无仍计入的加/重修：纯退课或加重修已否/驳 → 否退回升学分放行
  if (!hasApprovedAddOrRetakeCountingTowardCredit(app, decisionsByKey)) {
    return { ok: true, keys: [] }
  }
  // 增量 ar：否/驳退课导致超限 → 行级放行（条上如实显示 + footer 软提示）；确认仍由 creditGate 置灰
  if (
    previousDecisionsByKey &&
    typeof previousDecisionsByKey === 'object' &&
    hasDropLineBecomingExcludedFromCredit(app, previousDecisionsByKey, decisionsByKey)
  ) {
    return { ok: true, keys: [] }
  }
  // 非「否退课」引起的超限（如勾选通过加课）→ 行级放行，确认时再门控
  if (previousDecisionsByKey && typeof previousDecisionsByKey === 'object') {
    return { ok: true, keys: [] }
  }
  // 无上一决策上下文且已超限且仍有计入加/重修：保守拦（打开后首次批量等）
  return { ok: false, keys: nextViolations.keys }
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
    /** 本学期必修要求：demo 培养方案配额，不接真接口 */
    mandatoryMax: DEMO_TERM_MANDATORY_CREDIT_MAX,
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
    mandatoryMax: strip.mandatory?.max,
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
