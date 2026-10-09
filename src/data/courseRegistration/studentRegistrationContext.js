import { computed } from 'vue'
import { getActiveBatch, getBatchById } from './registrationBatches.js'
import { registrationMonitorQueue } from './registrationMonitorQueue.js'
import {
  cartTotalCredits,
  registrationCart,
  getStudentProfileFields,
  studentConfirmedCourses,
  studentPendingAssignCourses,
  getTermElectiveCreditProgress,
  listLiveTermCreditCourses,
  listRoundStatusCreditCourses,
  activeCartRoundKey,
  normalizeCartRoundKey,
} from './studentRegistrationStore.js'
import { getCourseById, resolveSchoolElectiveCategory } from './selectableCourses.js'
import { getSectionMeetings } from './sectionScheduleFields.js'
import {
  getSelectionGroupsForBatch,
  resolveSelectionGroup,
  computeSelectionGroupMinCredits,
} from './courseSelectionGroups.js'
import {
  buildVolunteerResultRows,
  preferenceOrderConfirmed,
  isVolunteerResultReleased,
  getResultReleaseAt,
  getVolunteerSheet,
  volunteerOrderSnapshot,
  listVolunteerResultBatches,
  seedVolunteerResultSheetsDemo,
} from './studentVolunteerSheet.js'
import { resolveTermCreditMax, resolveTermCreditMin } from './registrationRules.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { getEffectiveAudienceRounds } from './audienceRounds.js'
import { getStudentAudience } from './studentAudience.js'

const DEFAULT_ELECTIVE = {
  ge: 4,
  me: 6,
  // GE 学期整体帽 6 分（与 DEMO_TERM_CREDIT_CAPS 同口径）
  geMax: 6,
  meMax: 22,
}

/** Demo：毕业 GE 类别累计（首次选课：已选≡本学期；要求更大） */
export const DEFAULT_GRADUATION_GE_PROGRESS = {
  humanities: 5,
  business: 5,
  science: 3,
  aiOpen: 0,
  // 四类之和 16 < 毕业总分 18（DEMO_PROGRAMME_CREDIT_TARGETS.geRequired），留出富余学分空间
  required: { humanities: 5, business: 5, science: 4, aiOpen: 2 },
}

/** Demo：毕业 ME 课程组累计（首次选课：已选≡本学期；要求更大；四类之和=48） */
export const DEFAULT_GRADUATION_ME_PROGRESS = {
  group4of3: 7,
  group3of2: 5,
  group2of1: 3,
  ordinary: 3,
  required: { group4of3: 16, group3of2: 12, group2of1: 8, ordinary: 12 },
}

/**
 * Demo：本学期 ME 课程组（字段名历史保留 termGeCategories）
 * 四类 required 之和 = 本学期 ME 局部；默认 8+6+4+4 = 22，与 meMax 对齐
 * 已选默认 7+5+3+3 = 18
 */
export const DEFAULT_TERM_GE_CATEGORIES = {
  group4of3: 7,
  group3of2: 5,
  group2of1: 3,
  ordinary: 3,
  required: { group4of3: 8, group3of2: 6, group2of1: 4, ordinary: 4 },
}

/** ME 课程组进度键 */
export const ME_GROUP_CATEGORY_KEYS = ['group4of3', 'group3of2', 'group2of1', 'ordinary']

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

/** 校选课类型 value → GE 文商理/AI 字段 */
function schoolCatToGeKey(schoolCat) {
  if (schoolCat === 'arts') return 'humanities'
  if (schoolCat === 'business') return 'business'
  if (schoolCat === 'science') return 'science'
  if (schoolCat === 'ai_open') return 'aiOpen'
  return null
}

/**
 * 批次课程组 → ME 四类进度键
 * @param {import('./courseSelectionGroups.js').SelectionGroup | null | undefined} group
 */
export function selectionGroupToMeKey(group) {
  if (!group) return 'ordinary'
  const minPick = Number(group.minPick) || 1
  const size = Array.isArray(group.courseCodes) ? group.courseCodes.length : 0
  if (minPick >= 3) return 'group4of3'
  if (minPick === 2) return 'group3of2'
  if (minPick === 1 && size <= 2) return 'group2of1'
  if (minPick === 1) return 'group2of1'
  return 'ordinary'
}

/**
 * 从批次课程组推导 ME 四类最低学分分母（组内最低 minPick 门学分之和）
 * ordinary = max(0, totalCap - Σ组最低 - 1)，保证四类之和 < 总分帽
 * @param {object|null|undefined} batch
 * @param {number} totalCap 学期 meMax 或毕业 meRequired
 */
export function deriveMeCategoryRequiredFromBatch(batch, totalCap) {
  const required = { group4of3: 0, group3of2: 0, group2of1: 0, ordinary: 0 }
  const groups = getSelectionGroupsForBatch(batch)
  for (const group of groups) {
    const key = selectionGroupToMeKey(group)
    if (key === 'ordinary') continue
    const minCredits = computeSelectionGroupMinCredits(group)
    required[key] = Math.max(Number(required[key]) || 0, minCredits)
  }
  const groupSum =
    (Number(required.group4of3) || 0) +
    (Number(required.group3of2) || 0) +
    (Number(required.group2of1) || 0)
  const cap = Number(totalCap) || 0
  if (cap > 0) {
    required.ordinary = Math.max(0, cap - groupSum - 1)
  } else {
    required.ordinary = Number(DEFAULT_TERM_GE_CATEGORIES.required.ordinary) || 0
  }
  return required
}

/**
 * 从实时课表汇总 GE 文商理已选
 * @param {object[]} courses
 */
function sumLiveGeCategoryCredits(courses) {
  const out = { humanities: 0, business: 0, science: 0, aiOpen: 0 }
  for (const item of courses || []) {
    if (normalizeRegistrationType(item.type) !== 'GE') continue
    const lib = getCourseById(item.courseId)
    const schoolCat = resolveSchoolElectiveCategory({
      id: item.courseId,
      code: item.courseCode,
      type: item.type,
      schoolElectiveCategory: item.schoolElectiveCategory || lib?.schoolElectiveCategory,
    })
    const key = schoolCatToGeKey(schoolCat) || 'science'
    out[key] += Number(item.credits) || 0
  }
  return out
}

/**
 * 从实时课表汇总 ME 课程组已选
 * @param {object[]} courses
 */
export function sumLiveMeGroupCredits(courses) {
  const out = { group4of3: 0, group3of2: 0, group2of1: 0, ordinary: 0 }
  const active = getActiveBatch()
  for (const item of courses || []) {
    const kind = normalizeRegistrationType(item.type)
    if (kind !== 'ME' && kind !== 'Mandatory') continue
    const batch = (item.batchId && getBatchById(item.batchId)) || active
    const groups = getSelectionGroupsForBatch(batch)
    const course =
      getCourseById(item.courseId) ||
      (item.courseCode ? { code: item.courseCode, type: item.type } : null)
    const group = resolveSelectionGroup(course, groups)
    const key = selectionGroupToMeKey(group)
    out[key] += Number(item.credits) || 0
  }
  return out
}

/**
 * 规范化类别进度 { current 字段 + required }（按 fallback.required 的键）
 * @param {object|null|undefined} raw
 * @param {object} fallback
 */
function normalizeCategoryProgress(raw, fallback) {
  const keys = Object.keys(fallback.required || {})
  const required = {}
  const result = { required }
  for (const key of keys) {
    required[key] = Number(raw?.required?.[key]) || fallback.required[key]
    result[key] = Number(raw?.[key]) || 0
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
 * 规范化毕业 ME 课程组进度
 * @param {object|null|undefined} raw
 */
export function normalizeGraduationMeProgress(raw) {
  return normalizeCategoryProgress(raw, DEFAULT_GRADUATION_ME_PROGRESS)
}

/**
 * 规范化本学期 ME 课程组；必要时按 meRequired 比例缩放 required
 * @param {object|null|undefined} raw
 * @param {number} [meRequired] 本学期 ME 局部要求
 */
export function normalizeTermGeCategories(raw, meRequired) {
  const base = normalizeCategoryProgress(raw, DEFAULT_TERM_GE_CATEGORIES)
  const target = Number(meRequired)
  if (!Number.isFinite(target) || target <= 0) return base
  const sum = ME_GROUP_CATEGORY_KEYS.reduce((acc, key) => acc + base.required[key], 0)
  if (sum === target) return base
  let allocated = 0
  const scaled = {}
  ME_GROUP_CATEGORY_KEYS.forEach((key, index) => {
    if (index === ME_GROUP_CATEGORY_KEYS.length - 1) {
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
  // GE 毕业总分：入口卡毕业行独立口径，不按 GE01-04 分类求和（分类和 16 < 18）
  geRequired: 18,
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
    creditMin: batch?.creditMin ?? resolveTermCreditMin(batch?.academicSession),
    creditMax: batch?.creditMax ?? resolveTermCreditMax(batch?.academicSession),
    cgpa: 3.35,
    termElectiveProgress: { ...DEFAULT_ELECTIVE },
    termGeCategories: { ...DEFAULT_TERM_GE_CATEGORIES, required: { ...DEFAULT_TERM_GE_CATEGORIES.required } },
    termGeElectiveCategories: {
      ...DEFAULT_TERM_GE_ELECTIVE_CATEGORIES,
      required: { ...DEFAULT_TERM_GE_ELECTIVE_CATEGORIES.required },
    },
    graduationGeProgress: { ...DEFAULT_GRADUATION_GE_PROGRESS },
    graduationMeProgress: {
      ...DEFAULT_GRADUATION_ME_PROGRESS,
      required: { ...DEFAULT_GRADUATION_ME_PROGRESS.required },
    },
    schedule: [],
    issues: confirmedCredits ? [] : ['notRegistered'],
    status: confirmedCredits ? 'normal' : 'notRegistered',
  }
}

/**
 * 三层学分模型（汇总灰条 / 在线选课顶栏 / 加退弹窗共用）
 * 层1 专业学期总负荷；层2 类型学期局部 + 毕业累计；层3 本学期文商理
 * @param {string} [studentId]
 * @param {{ scope?: 'term'|'round'|'confirmed', batch?: object, roundKey?: string }} [options]
 *   round=与本轮选课情况同源；confirmed=仅确认课（加退弹窗，不含篮/待分配）
 */
export function getStudentCreditLayers(studentId = getStudentProfileFields().studentId, options = {}) {
  const scope =
    options.scope === 'round' ? 'round' : options.scope === 'confirmed' ? 'confirmed' : 'term'
  const row = getStudentMonitorRow(studentId)
  const programme = getProgrammeCreditProgress()
  const caps = getTermElectiveCreditProgress(studentId, scope === 'round' ? options : {})
  const geRequired = Number(caps.geMax) || Number(row.termElectiveProgress?.geMax) || DEFAULT_ELECTIVE.geMax
  const meRequired = Number(caps.meMax) || Number(row.termElectiveProgress?.meMax) || DEFAULT_ELECTIVE.meMax
  const liveCourses =
    scope === 'confirmed'
      ? // 与 R3 学分累计同源：排除管理员代选，避免加退 GE 已选被 admin 抬高
        studentConfirmedCourses.value.filter(
          (c) => c.intent !== 'waitlist' && c.sourceType !== 'admin',
        )
      : scope === 'round'
        ? listRoundStatusCreditCourses(options.batch, options)
        : listLiveTermCreditCourses()
  const typeUsed = liveCourses.reduce(
    (acc, item) => {
      const kind = normalizeRegistrationType(item.type)
      const cr = Number(item.credits) || 0
      if (kind === 'GE') acc.ge += cr
      else if (kind === 'ME' || kind === 'Mandatory') acc.me += cr
      return acc
    },
    { ge: 0, me: 0 },
  )
  const liveGeCats = sumLiveGeCategoryCredits(liveCourses)
  const liveMeCats = sumLiveMeGroupCredits(liveCourses)
  const termGeCategories = normalizeTermGeCategories(
    {
      ...liveMeCats,
      required:
        row.termGeCategories?.required ||
        deriveTermGeFromGraduation(row.graduationMeProgress, meRequired).required,
    },
    meRequired,
  )
  const termGeElectiveCategories = normalizeTermGeElectiveCategories(
    {
      ...liveGeCats,
      required:
        row.termGeElectiveCategories?.required ||
        deriveTermGeElectiveFromGraduation(row.graduationGeProgress, geRequired).required,
    },
    geRequired,
  )
  const graduationGe = normalizeGraduationGeProgress(row.graduationGeProgress || row.g1Progress)

  const session =
    options.batch?.academicSession || getActiveBatch()?.academicSession || ''
  const loadMin = Number(row.creditMin) || resolveTermCreditMin(session)
  const loadMax = Number(row.creditMax) || resolveTermCreditMax(session)
  const confirmedCredits = Number(row.credits) || 0
  const pending = cartTotalCredits.value

  return {
    programmeTermLoad: {
      current: confirmedCredits + pending,
      min: loadMin,
      max: loadMax,
    },
    termElective: {
      ge: { current: typeUsed.ge, required: geRequired },
      me: { current: typeUsed.me, required: meRequired },
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
 * 无本学期 ME 课程组字段时，用毕业 ME 进度折到本学期局部
 * @param {object|null|undefined} graduation
 * @param {number} meRequired
 */
function deriveTermGeFromGraduation(graduation, meRequired) {
  const g = normalizeGraduationMeProgress(graduation)
  const target = Number(meRequired) || DEFAULT_ELECTIVE.meMax
  const snapshot = { required: DEFAULT_TERM_GE_CATEGORIES.required }
  for (const key of ME_GROUP_CATEGORY_KEYS) {
    snapshot[key] = Math.min(Number(g[key]) || 0, Number(g.required?.[key]) || 0)
  }
  return normalizeTermGeCategories(snapshot, target)
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

/** @param {object} progress GE 文商理进度 */
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

/** @param {object} progress ME 课程组进度 */
function meGroupBarsFromProgress(progress) {
  return ME_GROUP_CATEGORY_KEYS.map((key) => ({
    key,
    labelKey: `courseRegistration.student.meGroup.${key}`,
    current: Number(progress?.[key]) || 0,
    max: Number(progress?.required?.[key]) || 0,
  }))
}

/**
 * 本学期 ME 课程组进度（顶栏 / 入口卡 / 加退弹窗）
 * 已选走 layers；分母按批次课程组最低学分之和动态覆盖
 * @param {object} [row] 监控行；仅用于解析 studentId
 * @param {{ scope?: 'term'|'round', batch?: object }} [options]
 */
export function getTermGeCategoryBars(row, options) {
  const layers = getStudentCreditLayers(row?.studentId, options)
  const batch = options?.batch || getActiveBatch()
  const meMax =
    Number(layers.termElective?.me?.required) ||
    Number(getTermElectiveCreditProgress(row?.studentId).meMax) ||
    DEFAULT_ELECTIVE.meMax
  const derived = deriveMeCategoryRequiredFromBatch(batch, meMax)
  return meGroupBarsFromProgress({
    ...layers.termGeCategories,
    required: derived,
  })
}

/**
 * 本学期 GE 文/商/理进度（GE 批入口/列表 / 加退弹窗）
 * @param {object} [row] 监控行；仅用于解析 studentId
 * @param {{ scope?: 'term'|'round' }} [options]
 */
export function getTermGeElectiveCategoryBars(row, options) {
  const layers = getStudentCreditLayers(row?.studentId, options)
  return categoryBarsFromProgress(layers.termGeElectiveCategories, { includeAiOpen: true })
}

/**
 * 类型学分是否将超过学期局部（可少不可超）
 * @param {'GE'|'ME'} type
 * @param {number} addCredits
 * @param {string} [studentId]
 */
export function wouldExceedTermElectiveCap(type, addCredits = 0, studentId) {
  const layers = getStudentCreditLayers(studentId, { scope: 'round' })
  const kind = normalizeRegistrationType(type)
  const bucket = kind === 'GE' ? layers.termElective.ge : layers.termElective.me
  return bucket.current + (Number(addCredits) || 0) > bucket.required
}

/**
 * 加退课费用：按**毕业** GE/ME 总分剩余（供 estimateCourseFee）
 * 只超学期要求不收费；仅超毕业总分才产生应收学分（子类不驱动计费）
 * @param {string} [studentId]
 */
export function buildAddDropPlanRemaining(studentId = getStudentProfileFields().studentId) {
  const row = getStudentMonitorRow(studentId)
  const programme = getProgrammeCreditProgress()
  const remFromBars = (bars) => {
    const out = {}
    let total = 0
    for (const bar of bars || []) {
      const rem = Math.max(0, (Number(bar.max) || 0) - (Number(bar.current) || 0))
      out[bar.key] = rem
      total += rem
    }
    return { categories: out, total }
  }
  const geBars = getGraduationGeBars(row)
  const meBars = remFromBars(getGraduationMeBars(row))
  // GE/ME 毕业免费额度均按培养方案总分：required − earned（子类剩余仅兼容 boost/consume）
  const geCurrent = geBars.reduce((sum, bar) => sum + (Number(bar.current) || 0), 0)
  const geRequiredTotal =
    Number(programme.geRequired) || remFromBars(geBars).total + geCurrent
  const geRemaining = Math.max(0, geRequiredTotal - geCurrent)
  const meRemaining =
    programme.meRemaining != null
      ? Math.max(0, Number(programme.meRemaining) || 0)
      : Math.max(0, (Number(programme.meRequired) || 0) - (Number(programme.meEarned) || 0))
  return {
    geRemaining,
    meRemaining,
    geCategory: remFromBars(geBars).categories,
    meCategory: meBars.categories,
  }
}

/**
 * 加课计费类别键：GE→文商理/AI；ME→课程组四类
 * @param {object} course
 * @returns {string}
 */
export function resolveAddDropFeeCategoryKey(course) {
  if (!course) return ''
  const kind = normalizeRegistrationType(course.type)
  if (kind === 'GE') {
    const schoolCat = resolveSchoolElectiveCategory(course)
    return schoolCatToGeKey(schoolCat) || 'science'
  }
  if (kind === 'ME' || kind === 'Mandatory') {
    const batch = (course.batchId && getBatchById(course.batchId)) || getActiveBatch()
    const groups = getSelectionGroupsForBatch(batch)
    const group = resolveSelectionGroup(course, groups)
    return selectionGroupToMeKey(group)
  }
  return ''
}

/**
 * 本学期某 GE 校选类别是否将超配额（本轮口径）
 * 分类学期帽已停用：GE 只保留整体学期帽（geMax），不再按 GE01-04 分类限制
 * @param {'humanities'|'business'|'science'|'aiOpen'} categoryKey
 * @param {number} addCredits
 * @param {string} [studentId]
 */
export function wouldExceedTermGeCategory(categoryKey, addCredits = 0, studentId) {
  void categoryKey
  void addCredits
  void studentId
  return false
}

/**
 * @deprecated ME 分类学分不再作上限；保留兼容，恒 false
 */
export function wouldExceedTermMeGroupCategory(categoryKey, addCredits = 0, studentId) {
  void categoryKey
  void addCredits
  void studentId
  return false
}

/**
 * 在线选课：ME 课程组门数将超过 minPick（如 3选2 最多 2 门）
 * @param {object|null|undefined} course
 * @param {{ batch?: object, roundKey?: string }} [options]
 */
export function wouldExceedMeGroupCourseCount(course, options = {}) {
  if (!course) return false
  const kind = normalizeRegistrationType(course.type)
  if (kind !== 'ME' && kind !== 'Mandatory') return false
  const batch = options.batch || (course.batchId && getBatchById(course.batchId)) || getActiveBatch()
  const groups = getSelectionGroupsForBatch(batch)
  const group = resolveSelectionGroup(course, groups)
  if (!group) return false
  const minPick = Number(group.minPick) || 1
  const codeSet = new Set(
    (group.courseCodes || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean),
  )
  const live = listRoundStatusCreditCourses(batch, {
    roundKey: options.roundKey || activeCartRoundKey.value,
  })
  const seen = new Set()
  for (const item of live) {
    const code = String(item.courseCode || '').trim().toUpperCase()
    if (!code || !codeSet.has(code)) continue
    seen.add(code)
  }
  const nextCode = String(course.code || course.courseCode || '').trim().toUpperCase()
  if (nextCode && seen.has(nextCode)) return false
  return seen.size + (nextCode ? 1 : 0) > minPick
}

/**
 * 行级/提交：GE 分类学分闸已停用；ME 改为组内门数上限
 * @param {object|null|undefined} course
 * @returns {{ ok: true } | { ok: false, errorKey: string, categoryKey?: string, errorParams?: object }}
 */
export function checkTermCategoryCreditCapForCourse(course) {
  if (!course) return { ok: true }
  const kind = normalizeRegistrationType(course.type)
  if (kind === 'GE') {
    return { ok: true }
  }
  if (kind === 'ME' || kind === 'Mandatory') {
    const batch = (course.batchId && getBatchById(course.batchId)) || getActiveBatch()
    const groups = getSelectionGroupsForBatch(batch)
    const group = resolveSelectionGroup(course, groups)
    if (!group) return { ok: true }
    if (wouldExceedMeGroupCourseCount(course, { batch })) {
      const total = Array.isArray(group.courseCodes) ? group.courseCodes.length : 0
      const min = Number(group.minPick) || 1
      return {
        ok: false,
        categoryKey: selectionGroupToMeKey(group),
        errorKey: 'courseRegistration.student.meGroupCourseCountExceeded',
        errorParams: { min, total },
      }
    }
    return { ok: true }
  }
  return { ok: true }
}

/**
 * 在线选课硬拦：GE 毕业总分将超过培养方案上限（默认 18）则禁提交。
 * 口径与列表顶栏毕业行同源（scope=round）；加退课勿调用本函数（超 18 走缴费提醒）。
 * @param {object|null|undefined} course
 * @param {{ batch?: object, roundKey?: string }} [options]
 * @returns {{ ok: true } | { ok: false, errorKey: string, errorParams?: object }}
 */
export function checkGraduationGeCapForCourse(course, options = {}) {
  if (!course) return { ok: true }
  const kind = normalizeRegistrationType(course.type)
  if (kind !== 'GE') return { ok: true }
  const add = Number(course.credits) || 0
  if (add <= 0) return { ok: true }
  const max = Number(getProgrammeCreditProgress().geRequired) || 0
  if (max <= 0) return { ok: true }
  const bars = getGraduationGeBars(undefined, {
    scope: 'round',
    batch: options.batch || getActiveBatch(),
    roundKey: options.roundKey || activeCartRoundKey.value,
  })
  const current = (bars || []).reduce((sum, bar) => sum + (Number(bar.current) || 0), 0)
  const used = current + add
  if (used > max) {
    return {
      ok: false,
      errorKey: 'courseRegistration.student.graduationGeCapExceeded',
      errorParams: { used, max },
    }
  }
  return { ok: true }
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
 * @param {{ scope?: 'term'|'round' }} [options]
 */
export function getGraduationGeBars(row, options) {
  const termBars = getTermGeElectiveCategoryBars(row, options)
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
 * 毕业 ME 课程组累计：已选取本学期 ME 组进度；分母与学期同源（组内最低学分之和）
 * @param {object} [row] 监控行；缺省取当前学生
 * @param {{ scope?: 'term'|'round', batch?: object }} [options]
 */
export function getGraduationMeBars(row, options) {
  const termBars = getTermGeCategoryBars(row, options)
  const batch = options?.batch || getActiveBatch()
  const meRequired =
    Number(getProgrammeCreditProgress().meRequired) ||
    Number(DEMO_PROGRAMME_CREDIT_TARGETS.meRequired) ||
    0
  const derived = deriveMeCategoryRequiredFromBatch(batch, meRequired)
  return termBars.map((bar) => ({
    ...bar,
    max: Number(derived[bar.key]) || bar.max,
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
      sourceType: 'preselect',
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

/**
 * 将各批已公示的第一轮志愿成功课写入确认池（我的选课进页用）
 * @returns {number} 新写入总条数
 */
export function syncAllVolunteerHitsToHistory() {
  if (!listVolunteerResultBatches().length) {
    seedVolunteerResultSheetsDemo()
  }
  let total = 0
  for (const batch of listVolunteerResultBatches()) {
    total += syncVolunteerHitsToHistory(batch)
  }
  return total
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
  const caps = profile.termCreditCaps || { geMax: 6, meMax: 22 }
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

function extractWeekdayFromTime(time) {
  const match = String(time || '').match(/^(\w+)\s+/)
  return match ? match[1] : ''
}

/** 课级：自身或任一分组的 time/meetings 是否含指定星期（Mon…Fri） */
export function courseMatchesWeekday(course, weekday) {
  if (!weekday) return true
  const target = String(weekday).trim()
  if (!target) return true
  const days = new Set()
  const collect = (node) => {
    if (!node) return
    const d0 = extractWeekdayFromTime(node.time || node.classTime)
    if (d0) days.add(d0)
    for (const meeting of getSectionMeetings(node)) {
      const d = extractWeekdayFromTime(meeting.time)
      if (d) days.add(d)
    }
  }
  collect(course)
  for (const section of course.sections || []) collect(section)
  return days.has(target)
}

export function filterStudentCourseList(courses, filters = {}) {
  let list = [...courses]
  if (filters.code) {
    const kw = String(filters.code).trim().toLowerCase()
    list = list.filter((item) => String(item.code || '').toLowerCase().includes(kw))
  }
  if (filters.name) {
    const kw = String(filters.name).trim().toLowerCase()
    list = list.filter((item) => {
      const zh = String(item.name || '').toLowerCase()
      const en = String(item.nameEn || '').toLowerCase()
      return zh.includes(kw) || en.includes(kw)
    })
  }
  // 兼容旧 keyword（代码或名称）
  if (filters.keyword) {
    const kw = String(filters.keyword).toLowerCase()
    list = list.filter(
      (item) =>
        String(item.code || '')
          .toLowerCase()
          .includes(kw) ||
        String(item.name || '')
          .toLowerCase()
          .includes(kw),
    )
  }
  if (filters.type) {
    const target = normalizeRegistrationType(filters.type)
    list = list.filter((item) => normalizeRegistrationType(item.type) === target)
  }
  if (filters.schoolElectiveCategory) {
    const cat = String(filters.schoolElectiveCategory)
    list = list.filter((item) => resolveSchoolElectiveCategory(item) === cat)
  }
  if (filters.weekday) {
    list = list.filter((item) => courseMatchesWeekday(item, filters.weekday))
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
