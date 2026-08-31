import { computed } from 'vue'
import { getActiveBatch } from './registrationBatches.js'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import {
  cartTotalCredits,
  registrationCart,
  getStudentProfileFields,
  studentConfirmedCourses,
  studentPendingAssignCourses,
  getTermElectiveCreditProgress,
  activeCartRoundKey,
  normalizeCartRoundKey,
} from './studentRegistrationStore.js'
import {
  buildVolunteerResultRows,
  preferenceOrderConfirmed,
  isVolunteerResultReleased,
  getResultReleaseAt,
  getVolunteerSheet,
  volunteerOrderSnapshot,
} from './studentVolunteerSheet.js'
import { LONG_SEMESTER_CREDIT_MIN, LONG_SEMESTER_CREDIT_MAX } from './registrationRules.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { getEffectiveAudienceRounds } from './audienceRounds.js'
import { getStudentAudience } from './studentAudience.js'

const DEFAULT_ELECTIVE = {
  ge: 4,
  me: 6,
  geMax: 18,
  meMax: 22,
}

/** Demo：毕业 GE 类别累计（首次选课：已选≡本学期；要求更大） */
export const DEFAULT_GRADUATION_GE_PROGRESS = {
  humanities: 5,
  business: 5,
  science: 3,
  aiOpen: 0,
  required: { humanities: 12, business: 12, science: 12, aiOpen: 12 },
}

/** Demo：毕业 ME 类别累计（首次选课：已选≡本学期；要求更大） */
export const DEFAULT_GRADUATION_ME_PROGRESS = {
  humanities: 6,
  business: 7,
  science: 5,
  required: { humanities: 12, business: 20, science: 16 },
}

/**
 * Demo：本学期 ME 文/商/理（字段名历史保留 termGeCategories）
 * 三类 required 之和 = 本学期 ME 局部；默认 7+8+7 = 22，与 meMax 对齐
 * 已选默认对齐确认半池汇总示意（文6+商7+理5=18）
 */
export const DEFAULT_TERM_GE_CATEGORIES = {
  humanities: 6,
  business: 7,
  science: 5,
  required: { humanities: 7, business: 8, science: 7 },
}

/**
 * Demo：本学期 GE 文/商/理/AI与开放选修
 * 四类 required 之和 = 本学期 GE 局部；默认 5+5+4+4 = 18，与 geMax 对齐
 * 已选默认对齐确认半池汇总示意（文5+商5+理3+AI0=13）
 */
export const DEFAULT_TERM_GE_ELECTIVE_CATEGORIES = {
  humanities: 5,
  business: 5,
  science: 3,
  aiOpen: 0,
  required: { humanities: 5, business: 5, science: 4, aiOpen: 4 },
}

const GE_ELECTIVE_CATEGORY_KEYS = ['humanities', 'business', 'science', 'aiOpen']

/**
 * 规范化类别进度 { current 字段 + required }
 * @param {object|null|undefined} raw
 * @param {object} fallback
 */
function normalizeCategoryProgress(raw, fallback) {
  const hasAiOpen = fallback.required?.aiOpen != null
  const required = {
    humanities: Number(raw?.required?.humanities) || fallback.required.humanities,
    business: Number(raw?.required?.business) || fallback.required.business,
    science: Number(raw?.required?.science) || fallback.required.science,
  }
  if (hasAiOpen) {
    required.aiOpen = Number(raw?.required?.aiOpen) || fallback.required.aiOpen
  }
  const result = {
    humanities: Number(raw?.humanities) || 0,
    business: Number(raw?.business) || 0,
    science: Number(raw?.science) || 0,
    required,
  }
  if (hasAiOpen) {
    result.aiOpen = Number(raw?.aiOpen) || 0
  }
  return result
}

/**
 * 规范化毕业 GE 文商理进度
 * @param {object|null|undefined} raw 原始进度
 */
export function normalizeGraduationGeProgress(raw) {
  return normalizeCategoryProgress(raw, DEFAULT_GRADUATION_GE_PROGRESS)
}

/**
 * 规范化本学期文商理（挂 ME）；必要时按 meRequired 均分 required
 * @param {object|null|undefined} raw
 * @param {number} [meRequired] 本学期 ME 局部要求
 */
export function normalizeTermGeCategories(raw, meRequired) {
  const base = normalizeCategoryProgress(raw, DEFAULT_TERM_GE_CATEGORIES)
  const target = Number(meRequired)
  if (!Number.isFinite(target) || target <= 0) return base
  const sum =
    base.required.humanities + base.required.business + base.required.science
  if (sum === target) return base
  // 保持比例缩放到 sum=target；无法整除时理补差
  const h = Math.floor((base.required.humanities / sum) * target)
  const b = Math.floor((base.required.business / sum) * target)
  const s = target - h - b
  return {
    ...base,
    required: { humanities: h, business: b, science: s },
  }
}

/**
 * 规范化本学期 GE 文商理；必要时按 geRequired 均分 required
 * @param {object|null|undefined} raw
 * @param {number} [geRequired] 本学期 GE 局部要求
 */
export function normalizeTermGeElectiveCategories(raw, geRequired) {
  const base = normalizeCategoryProgress(raw, DEFAULT_TERM_GE_ELECTIVE_CATEGORIES)
  const target = Number(geRequired)
  if (!Number.isFinite(target) || target <= 0) return base
  const sum = GE_ELECTIVE_CATEGORY_KEYS.reduce((acc, key) => acc + base.required[key], 0)
  if (sum === target) return base
  let allocated = 0
  const scaled = {}
  GE_ELECTIVE_CATEGORY_KEYS.forEach((key, index) => {
    if (index === GE_ELECTIVE_CATEGORY_KEYS.length - 1) {
      scaled[key] = target - allocated
    } else {
      scaled[key] = Math.floor((base.required[key] / sum) * target)
      allocated += scaled[key]
    }
  })
  return {
    ...base,
    required: scaled,
  }
}

/**
 * 管理端选课结果顶栏「预计需修 GE」demo（对齐设计图：总量 + 文/商/理占比）
 * 正式环境可替换为接口数据。
 */
export const DEMO_GE_DEMAND_STATS = {
  total: 1215,
  categories: [
    { key: 'humanities', shortKey: 'courseRegistration.student.geDemand.short.humanities', count: 220, percent: 18 },
    { key: 'business', shortKey: 'courseRegistration.student.geDemand.short.business', count: 240, percent: 20 },
    { key: 'science', shortKey: 'courseRegistration.student.geDemand.short.science', count: 590, percent: 49 },
    { key: 'aiOpen', shortKey: 'courseRegistration.student.geDemand.short.aiOpen', count: 165, percent: 13 },
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

/** 按专业码覆盖培养方案学分要求；未配置则回落 DEMO_PROGRAMME_CREDIT_TARGETS */
const PROGRAMME_CREDIT_TARGETS_BY_CODE = {
  SWE: DEMO_PROGRAMME_CREDIT_TARGETS,
}

/**
 * 读取专业培养方案学分要求（demo；正式环境对接方案接口）
 * @param {string} [programmeCode]
 */
export function getProgrammeCreditTargets(programmeCode) {
  const code = String(programmeCode || '').trim()
  return PROGRAMME_CREDIT_TARGETS_BY_CODE[code] || DEMO_PROGRAMME_CREDIT_TARGETS
}

/**
 * 该专业是否需修 GE（geRequired > 0）；无 GE 要求时入口仅展示 ME 卡
 * @param {string} [programmeCode]
 */
export function studentHasGeElectiveRequirement(programmeCode) {
  return (Number(getProgrammeCreditTargets(programmeCode).geRequired) || 0) > 0
}

/**
 * Demo：入学以来、当前确认课之外的已修学分。
 * 与 DEMO_CONFIRMED（约 ME6 + GE3）合计后故意未满：
 * ME ≈14/24、GE ≈5/12、选修合计 ≈19/36，便于工具栏展示「还差」。
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
    termElectiveProgress: { ...DEFAULT_ELECTIVE },
    termGeCategories: { ...DEFAULT_TERM_GE_CATEGORIES, required: { ...DEFAULT_TERM_GE_CATEGORIES.required } },
    termGeElectiveCategories: {
      ...DEFAULT_TERM_GE_ELECTIVE_CATEGORIES,
      required: { ...DEFAULT_TERM_GE_ELECTIVE_CATEGORIES.required },
    },
    graduationGeProgress: { ...DEFAULT_GRADUATION_GE_PROGRESS },
    schedule: [],
    issues: confirmedCredits ? [] : ['notRegistered'],
    status: confirmedCredits ? 'normal' : 'notRegistered',
  }
}

/**
 * 三层学分模型（汇总灰条 / 在线选课顶栏共用）
 * 层1 专业学期总负荷；层2 类型学期局部 + 毕业累计；层3 本学期文商理
 * @param {string} [studentId]
 */
export function getStudentCreditLayers(studentId = getStudentProfileFields().studentId) {
  const row = getStudentMonitorRow(studentId)
  const programme = getProgrammeCreditProgress()
  const live = getTermElectiveCreditProgress(studentId)
  const geRequired = Number(live.geMax) || Number(row.termElectiveProgress?.geMax) || DEFAULT_ELECTIVE.geMax
  const meRequired = Number(live.meMax) || Number(row.termElectiveProgress?.meMax) || DEFAULT_ELECTIVE.meMax
  const termGeCategories = normalizeTermGeCategories(
    row.termGeCategories || deriveTermGeFromGraduation(row.graduationGeProgress, meRequired),
    meRequired,
  )
  const termGeElectiveCategories = normalizeTermGeElectiveCategories(
    row.termGeElectiveCategories || deriveTermGeElectiveFromGraduation(row.graduationGeProgress, geRequired),
    geRequired,
  )
  const graduationGe = normalizeGraduationGeProgress(row.graduationGeProgress || row.g1Progress)

  const loadMin = Number(row.creditMin) || LONG_SEMESTER_CREDIT_MIN
  const loadMax = Number(row.creditMax) || LONG_SEMESTER_CREDIT_MAX
  const confirmedCredits = Number(row.credits) || 0
  const pending = cartTotalCredits.value

  return {
    programmeTermLoad: {
      current: confirmedCredits + pending,
      min: loadMin,
      max: loadMax,
    },
    termElective: {
      ge: { current: live.ge, required: geRequired },
      me: { current: live.me, required: meRequired },
    },
    graduationElective: {
      ge: { current: programme.geEarned, required: programme.geRequired },
      me: { current: programme.meEarned, required: programme.meRequired },
    },
    termGeCategories,
    termGeElectiveCategories,
    graduationGeCategories: graduationGe,
  }
}

/**
 * 无本学期类别字段时，用毕业进度按比例折到本学期 ME 局部（兼容旧数据）
 * @param {object|null|undefined} graduation
 * @param {number} meRequired
 */
function deriveTermGeFromGraduation(graduation, meRequired) {
  const g = normalizeGraduationGeProgress(graduation)
  const target = Number(meRequired) || DEFAULT_ELECTIVE.meMax
  return normalizeTermGeCategories(
    {
      humanities: Math.min(g.humanities, g.required.humanities),
      business: Math.min(g.business, g.required.business),
      science: Math.min(g.science, g.required.science),
      required: DEFAULT_TERM_GE_CATEGORIES.required,
    },
    target,
  )
}

/**
 * 无本学期 GE 类别字段时，用毕业进度折到本学期 GE 局部
 * @param {object|null|undefined} graduation
 * @param {number} geRequired
 */
function deriveTermGeElectiveFromGraduation(graduation, geRequired) {
  const g = normalizeGraduationGeProgress(graduation)
  const target = Number(geRequired) || DEFAULT_ELECTIVE.geMax
  return normalizeTermGeElectiveCategories(
    {
      humanities: Math.min(g.humanities, g.required.humanities),
      business: Math.min(g.business, g.required.business),
      science: Math.min(g.science, g.required.science),
      aiOpen: Math.min(g.aiOpen || 0, g.required.aiOpen || 0),
      required: DEFAULT_TERM_GE_ELECTIVE_CATEGORIES.required,
    },
    target,
  )
}

/** @param {object} progress 含 humanities/business/science + required */
function categoryBarsFromProgress(progress, { includeAiOpen = false } = {}) {
  const bars = [
    {
      key: 'humanities',
      labelKey: 'courseRegistration.student.graduationGe.humanities',
      current: progress.humanities,
      max: progress.required.humanities,
    },
    {
      key: 'business',
      labelKey: 'courseRegistration.student.graduationGe.business',
      current: progress.business,
      max: progress.required.business,
    },
    {
      key: 'science',
      labelKey: 'courseRegistration.student.graduationGe.science',
      current: progress.science,
      max: progress.required.science,
    },
  ]
  if (includeAiOpen && progress.required?.aiOpen != null) {
    bars.push({
      key: 'aiOpen',
      labelKey: 'courseRegistration.student.graduationGe.aiOpen',
      current: progress.aiOpen || 0,
      max: progress.required.aiOpen,
    })
  }
  return bars
}

/**
 * 本学期文/商/理进度（ME 细分；顶栏主闸）
 * @param {object} [row] 监控行；缺省取当前学生 layers
 */
export function getTermGeCategoryBars(row) {
  const layers = row
    ? {
        termGeCategories: normalizeTermGeCategories(
          row.termGeCategories ||
            deriveTermGeFromGraduation(row.graduationGeProgress, row.termElectiveProgress?.meMax),
          row.termElectiveProgress?.meMax,
        ),
      }
    : getStudentCreditLayers()
  return categoryBarsFromProgress(layers.termGeCategories)
}

/**
 * 本学期 GE 文/商/理进度（GE 批入口/列表）
 * @param {object} [row] 监控行；缺省取当前学生 layers
 */
export function getTermGeElectiveCategoryBars(row) {
  const layers = row
    ? {
        termGeElectiveCategories: normalizeTermGeElectiveCategories(
          row.termGeElectiveCategories ||
            deriveTermGeElectiveFromGraduation(
              row.graduationGeProgress,
              row.termElectiveProgress?.geMax,
            ),
          row.termElectiveProgress?.geMax,
        ),
      }
    : getStudentCreditLayers()
  return categoryBarsFromProgress(layers.termGeElectiveCategories, { includeAiOpen: true })
}

/**
 * 类型学分是否将超过学期局部（可少不可超）
 * @param {'GE'|'ME'} type
 * @param {number} addCredits
 * @param {string} [studentId]
 */
export function wouldExceedTermElectiveCap(type, addCredits = 0, studentId) {
  const layers = getStudentCreditLayers(studentId)
  const kind = normalizeRegistrationType(type)
  const bucket = kind === 'GE' ? layers.termElective.ge : layers.termElective.me
  return bucket.current + (Number(addCredits) || 0) > bucket.required
}

/**
 * 加退课费用：本学期 GE/ME 文商理类别剩余（供 estimateCourseFee）
 * @param {string} [studentId]
 */
export function buildAddDropPlanRemaining(studentId = getStudentProfileFields().studentId) {
  const layers = getStudentCreditLayers(studentId)
  const remCat = (cat, includeAiOpen = false) => {
    const out = {
      humanities: Math.max(0, (Number(cat?.required?.humanities) || 0) - (Number(cat?.humanities) || 0)),
      business: Math.max(0, (Number(cat?.required?.business) || 0) - (Number(cat?.business) || 0)),
      science: Math.max(0, (Number(cat?.required?.science) || 0) - (Number(cat?.science) || 0)),
    }
    if (includeAiOpen && cat?.required?.aiOpen != null) {
      out.aiOpen = Math.max(0, (Number(cat.required.aiOpen) || 0) - (Number(cat.aiOpen) || 0))
    }
    return out
  }
  const p = getTermElectiveCreditProgress(studentId)
  return {
    geRemaining: Math.max(0, (p.geMax || 0) - (p.ge || 0)),
    meRemaining: Math.max(0, (p.meMax || 0) - (p.me || 0)),
    geCategory: remCat(layers.termGeElectiveCategories, true),
    meCategory: remCat(layers.termGeCategories),
  }
}

/**
 * 本学期某文商理类别是否将超配额
 * @param {'humanities'|'business'|'science'|'aiOpen'} categoryKey
 * @param {number} addCredits
 * @param {string} [studentId]
 */
export function wouldExceedTermGeCategory(categoryKey, addCredits = 0, studentId) {
  const layers = getStudentCreditLayers(studentId)
  const cat = layers.termGeCategories
  const required = cat.required?.[categoryKey]
  const current = cat[categoryKey]
  if (required == null) return false
  return Number(current) + (Number(addCredits) || 0) > Number(required)
}

/**
 * 毕业 GE 文/商/理进度（优先 graduationGeProgress，兼容旧 g1Progress）
 * @param {string} [studentId] 学号
 */
export function getGraduationGeProgress(studentId = getStudentProfileFields().studentId) {
  const row = getStudentMonitorRow(studentId)
  if (row?.graduationGeProgress) {
    return normalizeGraduationGeProgress(row.graduationGeProgress)
  }
  if (row?.g1Progress) {
    return normalizeGraduationGeProgress({
      humanities: row.g1Progress.humanities,
      business: row.g1Progress.business,
      science: row.g1Progress.science,
      aiOpen: row.g1Progress.aiOpen,
      required: {
        humanities: row.g1Progress.required?.humanities,
        business: row.g1Progress.required?.business,
        science: row.g1Progress.required?.science,
        aiOpen: row.g1Progress.required?.aiOpen,
      },
    })
  }
  return normalizeGraduationGeProgress(DEFAULT_GRADUATION_GE_PROGRESS)
}

/**
 * 毕业 GE 类别累计：首次选课叙事下已选取本学期 GE 分类，要求用毕业配额
 * @param {object} [row] 监控行；缺省取当前学生
 */
export function getGraduationGeBars(row) {
  const termBars = getTermGeElectiveCategoryBars(row)
  const required = (row
    ? normalizeGraduationGeProgress(row.graduationGeProgress || row.g1Progress)
    : getGraduationGeProgress()
  ).required
  return termBars.map((bar) => ({
    ...bar,
    max: Number(required[bar.key]) || bar.max,
  }))
}

/**
 * 毕业 ME 类别累计：已选取本学期 ME 分类，要求用毕业配额
 * @param {object} [row] 监控行；缺省取当前学生
 */
export function getGraduationMeBars(row) {
  const termBars = getTermGeCategoryBars(row)
  const live = row || getStudentMonitorRow()
  const required = normalizeGraduationGeProgress(
    live?.graduationMeProgress || DEFAULT_GRADUATION_ME_PROGRESS,
  ).required
  return termBars.map((bar) => ({
    ...bar,
    max: Number(required[bar.key]) || bar.max,
  }))
}

/**
 * 本学期选课情况：上下文灰条
 * @param {object} [batch]
 */
export function getStudentTermSummaryContext(batch = getActiveBatch()) {
  const audience = getStudentAudience()
  const phase = getActiveRoundPhase(batch, audience)
  const timeline = getRoundTimeline(batch, phase.key, audience)
  const activeStep = timeline.find((s) => s.active) || timeline[0]
  const layers = getStudentCreditLayers()
  const roundKey = normalizeCartRoundKey(activeCartRoundKey.value || phase.key)
  const publishStatus = resolveTermSummaryPublishStatus(batch, phase.key)
  return {
    batchId: batch?.id || '',
    batchName: batch?.name || '',
    academicSession: batch?.academicSession || '',
    roundKey,
    roundLabelKey: activeStep?.labelKey || phase.labelKey,
    roundRangeText: activeStep?.rangeText || '',
    phaseKey: phase.key,
    phaseLabelKey: phase.labelKey,
    ruleTipKey: getRoundPanelNoteKey(phase.key),
    permissionKey:
      phase.key === 'preselect'
        ? 'courseRegistration.student.termSummary.permissionVolunteer'
        : 'courseRegistration.student.termSummary.permissionSelect',
    layers,
    publishStatus,
    audience,
  }
}

/**
 * @param {object|null} batch
 * @param {string} phaseKey
 */
function resolveTermSummaryPublishStatus(batch, phaseKey) {
  const hasConfirmedOrder = preferenceOrderConfirmed.value
  const hasPending = (studentPendingAssignCourses.value || []).length > 0
  const releaseAt = getResultReleaseAt(batch)
  if (hasConfirmedOrder || (phaseKey === 'preselect' && hasPending)) {
    if (!isVolunteerResultReleased(batch)) {
      return { key: 'waitingRelease', releaseAt }
    }
    const rows = buildVolunteerResultRows(batch)
    const hasMiss = rows.some((r) => r.status === 'miss')
    if (hasMiss) {
      return { key: 'releasedWithMiss', releaseAt }
    }
    return { key: 'releasedAllHit', releaseAt }
  }
  if (phaseKey === 'preselect') {
    return { key: 'volunteerOpen', releaseAt: '' }
  }
  if (phaseKey === 'main' || phaseKey === 'supplement') {
    return { key: 'canEnterRound', releaseAt: '' }
  }
  return { key: 'normal', releaseAt: '' }
}

/**
 * 本学期汇总行：仅第一轮已确认志愿；公示后显示选课成功/失败
 */
export function buildTermSummaryCourseRows() {
  syncVolunteerHitsToHistory()
  return buildVolunteerResultRows()
}

/**
 * 公示后：选课成功的志愿写入历史半池（来源第一轮），幂等
 * @param {object} [batch]
 * @returns {number} 新写入条数
 */
export function syncVolunteerHitsToHistory(batch = getActiveBatch()) {
  if (!isVolunteerResultReleased(batch)) return 0
  const sheet = getVolunteerSheet(batch?.id)
  const live = volunteerOrderSnapshot.value
  const snap =
    sheet?.snapshot ||
    (live?.batchId === batch?.id ? live : null) ||
    (!batch?.id && live ? live : null)
  if (!snap?.slots?.length) return 0
  const hitRows = buildVolunteerResultRows(batch).filter((row) => row.status === 'hit')
  if (!hitRows.length) return 0

  let added = 0
  const next = [...(studentConfirmedCourses.value || [])]
  for (const row of hitRows) {
    const slot = snap.slots.find(
      (s) => s.item?.courseId === row.courseId || Number(s.slot) === Number(row.preferenceOrder),
    )
    const src = slot?.item || {}
    const existingIdx = next.findIndex(
      (c) => c.courseId === row.courseId || c.courseCode === row.code,
    )
    const payload = {
      ...(existingIdx >= 0 ? next[existingIdx] : {}),
      ...src,
      courseId: row.courseId || src.courseId,
      courseCode: row.code || src.courseCode,
      courseName: row.name || src.courseName,
      credits: row.credits ?? src.credits,
      sectionCode: row.section === '—' ? src.sectionCode || '' : row.section,
      sectionId: src.sectionId,
      time: src.time || (row.time !== '—' ? row.time : ''),
      classTime: src.classTime || src.time || (row.time !== '—' ? row.time : ''),
      weekRange: src.weekRange || (row.weekRange !== '—' ? row.weekRange : ''),
      room: src.room || (row.room !== '—' ? row.room : ''),
      lecturer: src.lecturer || (row.lecturer !== '—' ? row.lecturer : ''),
      meetings: src.meetings,
      type: row.type || src.type,
      batchId: src.batchId || snap.batchId || batch?.id || '',
      preferenceOrder: row.preferenceOrder,
      sourceType: 'round',
      roundKey: 'preselect',
      isRetake: Boolean(src.isRetake),
      selectedAt: src.selectedAt || snap.confirmedAt || new Date().toISOString(),
    }
    if (existingIdx >= 0) {
      next[existingIdx] = payload
    } else {
      next.push(payload)
      added += 1
    }
  }
  studentConfirmedCourses.value = next
  return added
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

export function getActiveRoundPhase(batch = getActiveBatch(), audience = getStudentAudience()) {
  if (!batch) return { key: 'closed', labelKey: 'courseRegistration.student.roundClosed' }
  // 轻量 demo：优先使用批次标记的进行中轮次
  if (batch.demoActiveRound) {
    const key = batch.demoActiveRound
    const labelMap = {
      preselect: 'courseRegistration.student.roundPreselect',
      main: 'courseRegistration.student.roundMain',
      supplement: 'courseRegistration.student.roundSupplement',
    }
    return {
      key,
      labelKey: labelMap[key] || 'courseRegistration.student.roundMain',
      audience,
    }
  }
  // 原型演示：进行中批次默认展示正选轮次
  if (batch.status === 'active') {
    return { key: 'main', labelKey: 'courseRegistration.student.roundMain', audience }
  }
  if (batch.status === 'draft') {
    return { key: 'preselect', labelKey: 'courseRegistration.student.roundPreselect', audience }
  }
  return { key: 'closed', labelKey: 'courseRegistration.student.roundClosed', audience }
}

export function getRoundTimeline(batch = getActiveBatch(), highlightKey, audience = getStudentAudience()) {
  const rounds = getEffectiveAudienceRounds(batch, audience)
  if (!rounds) return []
  const active = highlightKey || getActiveRoundPhase(batch, audience).key
  const steps = [
    {
      key: 'preselect',
      labelKey: 'courseRegistration.batch.roundPreselect',
      range: rounds.preselect,
    },
    {
      key: 'main',
      labelKey: 'courseRegistration.batch.roundMain',
      range: rounds.main,
    },
    {
      key: 'supplement',
      labelKey: 'courseRegistration.batch.roundSupplement',
      range: rounds.supplement,
    },
  ]
  return steps.map((step) => ({
    ...step,
    active: step.key === active,
    audience,
    rangeText: step.range?.start ? `${step.range.start} – ${step.range.end || ''}` : '',
  }))
}

/** 学生身份条展示 */
export function getStudentAudienceBanner(studentId) {
  const profile = getStudentProfileFields()
  const id = studentId || profile.studentId
  const audience = getStudentAudience(id)
  const caps = profile.termCreditCaps || { geMax: 18, meMax: 22 }
  return {
    audience,
    registrationSemesterIndex: profile.registrationSemesterIndex,
    isGraduate: profile.isGraduate,
    geMax: caps.geMax,
    meMax: caps.meMax,
    labelKey:
      audience === 'freshman'
        ? 'courseRegistration.student.audienceFreshman'
        : 'courseRegistration.student.audienceSenior',
  }
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

/** @deprecated 学期帽请用 termElective；毕业类别请用 getGraduationGeBars */
export function getStudentG1Bars(row = getStudentMonitorRow()) {
  if (row?.termElectiveProgress) {
    const p = row.termElectiveProgress
    return [
      { key: 'ge', current: p.ge, required: p.geMax },
      { key: 'me', current: p.me, required: p.meMax },
    ]
  }
  return getGraduationGeBars(row).map((bar) => ({
    key: bar.key,
    current: bar.current,
    required: bar.max,
  }))
}

export const studentCreditSummary = computed(() => getStudentCreditSummary())
