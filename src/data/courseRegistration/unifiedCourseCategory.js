/**
 * 选课统一「课程类别」：必修课 / GE-01–GE-04 / ME-01–ME-04（内部码仍为 GE01）
 * 由原「课程类型 + 校选课类型」合并展示
 */
import { normalizeRegistrationType } from './registrationTypes.js'
import { resolveSchoolElectiveCategory } from './selectableCourses.js'

/** 校选码 → 序号 1–4（文/商/理/AI） */
const SCHOOL_ELECTIVE_INDEX = {
  arts: 1,
  humanities: 1,
  business: 2,
  science: 3,
  ai_open: 4,
  aiOpen: 4,
}

/**
 * 是否必修类（含培养方案底图）
 * @param {object|null|undefined} courseOrItem
 */
function isRequiredCourseType(courseOrItem) {
  if (!courseOrItem) return false
  if (courseOrItem.sourceType === 'required') return true
  const raw = String(courseOrItem.type || '')
    .trim()
    .toUpperCase()
  return raw === 'CORE' || raw === 'MANDATORY' || raw === 'REQUIRED'
}

/**
 * 校选类型序号（缺省按文科=1）
 * @param {string} schoolElective
 * @returns {number}
 */
function schoolElectiveToIndex(schoolElective) {
  const key = String(schoolElective || '').trim()
  return SCHOOL_ELECTIVE_INDEX[key] || 1
}

/**
 * 解析统一课程类别码
 * @param {object|null|undefined} courseOrItem 课库或已选行（含 type / schoolElectiveCategory）
 * @returns {''|'required'|'GE01'|'GE02'|'GE03'|'GE04'|'ME01'|'ME02'|'ME03'|'ME04'}
 */
export function resolveUnifiedCourseCategoryCode(courseOrItem) {
  if (!courseOrItem) return ''
  if (isRequiredCourseType(courseOrItem)) return 'required'
  const kind = normalizeRegistrationType(courseOrItem.type)
  if (kind !== 'GE' && kind !== 'ME') return ''
  const school = resolveSchoolElectiveCategory(courseOrItem)
  const index = schoolElectiveToIndex(school)
  return `${kind}0${index}`
}

/**
 * 内部码 → 展示码（GE01 → GE-01；required 原样）
 * @param {string} code
 * @returns {string}
 */
export function formatUnifiedCategoryCodeForDisplay(code) {
  const raw = String(code || '').trim()
  if (!raw || raw === 'required') return raw
  const matched = raw.match(/^(GE|ME)0*([1-4])$/i)
  if (matched) {
    return `${matched[1].toUpperCase()}-${String(matched[2]).padStart(2, '0')}`
  }
  return raw
}

/**
 * 统一课程类别展示文案
 * @param {object|null|undefined} courseOrItem
 * @param {(key: string) => string} t i18n
 * @returns {string}
 */
export function formatUnifiedCourseCategoryLabel(courseOrItem, t) {
  const code = resolveUnifiedCourseCategoryCode(courseOrItem)
  if (!code) return '—'
  if (code === 'required') {
    return t('courseRegistration.courses.unifiedCategory.required')
  }
  return formatUnifiedCategoryCodeForDisplay(code)
}

/**
 * 加退课行 ∪ 课库合并（展示与学分分桶共用）
 * @param {object|null|undefined} item 申请行
 * @param {{
 *   getCourseById?: (id: string) => object|null|undefined,
 *   getCourseByCode?: (code: string) => object|null|undefined,
 *   fallback?: object|null,
 * }} [opts]
 * @returns {object|null}
 */
export function mergeAddDropLineWithCatalog(item, opts = {}) {
  if (!item) return null
  const catalog =
    (item.courseId && opts.getCourseById?.(item.courseId)) ||
    opts.getCourseByCode?.(item.courseCode || item.code) ||
    null
  const fallback = opts.fallback || null
  const nested = item.course && typeof item.course === 'object' ? item.course : null
  return {
    ...(catalog || {}),
    ...(fallback || {}),
    ...(nested || {}),
    ...item,
    type: item.type || fallback?.type || nested?.type || catalog?.type || '',
    schoolElectiveCategory:
      item.schoolElectiveCategory ||
      fallback?.schoolElectiveCategory ||
      nested?.schoolElectiveCategory ||
      catalog?.schoolElectiveCategory ||
      '',
    sourceType:
      item.sourceType || fallback?.sourceType || nested?.sourceType || catalog?.sourceType || '',
    credits: Number(item.credits ?? nested?.credits ?? catalog?.credits) || 0,
  }
}

/**
 * 统一类别码 → 学分条分桶（与表头必修/GE/ME 列对齐）
 * @param {object|null|undefined} courseOrItem 已合并或原始行
 * @returns {''|'mandatory'|'GE'|'ME'}
 */
export function resolveCreditStripBucketFromCategory(courseOrItem) {
  const code = resolveUnifiedCourseCategoryCode(courseOrItem)
  if (code === 'required') return 'mandatory'
  if (/^GE/i.test(code)) return 'GE'
  if (/^ME/i.test(code)) return 'ME'
  const raw = String(courseOrItem?.type || '')
    .trim()
    .toUpperCase()
  if (raw.startsWith('GE')) return 'GE'
  if (raw.startsWith('ME')) return 'ME'
  if (raw === 'CORE' || raw === 'MANDATORY' || raw === 'REQUIRED') return 'mandatory'
  const kind = normalizeRegistrationType(courseOrItem?.type)
  if (kind === 'GE' || kind === 'ME') return kind
  if (kind === 'Mandatory') return 'mandatory'
  return ''
}

/**
 * 加退课行 ∪ 课库后格式化统一类别（详情/表单/审批明细）
 * @param {object|null|undefined} item 申请行
 * @param {(key: string) => string} t
 * @param {{
 *   getCourseById?: (id: string) => object|null|undefined,
 *   getCourseByCode?: (code: string) => object|null|undefined,
 *   fallback?: object|null,
 * }} [opts]
 * @returns {string}
 */
export function formatUnifiedCourseCategoryFromLine(item, t, opts = {}) {
  const merged = mergeAddDropLineWithCatalog(item, opts)
  return formatUnifiedCourseCategoryLabel(merged, t)
}

/** 搜索/筛选项（value=内部码 GE01；label=展示 GE-01） */
export const unifiedCourseCategoryFilterOptions = [
  { value: 'required', labelKey: 'courseRegistration.courses.unifiedCategory.required' },
  { value: 'GE01', label: 'GE-01' },
  { value: 'GE02', label: 'GE-02' },
  { value: 'GE03', label: 'GE-03' },
  { value: 'GE04', label: 'GE-04' },
  { value: 'ME01', label: 'ME-01' },
  { value: 'ME02', label: 'ME-02' },
  { value: 'ME03', label: 'ME-03' },
  { value: 'ME04', label: 'ME-04' },
]

/**
 * 是否命中统一课程类别筛选
 * @param {object} courseOrItem
 * @param {string} filterValue
 */
export function courseMatchesUnifiedCategoryFilter(courseOrItem, filterValue) {
  const target = String(filterValue || '').trim()
  if (!target) return true
  return resolveUnifiedCourseCategoryCode(courseOrItem) === target
}
