/**
 * 选课统一「课程类别」：必修课 / GE01–GE04 / ME01–ME04
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
  return code
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
  const catalog =
    (item?.courseId && opts.getCourseById?.(item.courseId)) ||
    opts.getCourseByCode?.(item?.courseCode || item?.code) ||
    null
  const fallback = opts.fallback || null
  const merged = {
    ...(catalog || {}),
    ...(fallback || {}),
    ...(item || {}),
    type: item?.type || fallback?.type || catalog?.type,
    schoolElectiveCategory:
      item?.schoolElectiveCategory ||
      fallback?.schoolElectiveCategory ||
      catalog?.schoolElectiveCategory,
    sourceType: item?.sourceType || fallback?.sourceType || catalog?.sourceType,
  }
  return formatUnifiedCourseCategoryLabel(merged, t)
}

/** 搜索/筛选项（值即统一码） */
export const unifiedCourseCategoryFilterOptions = [
  { value: 'required', labelKey: 'courseRegistration.courses.unifiedCategory.required' },
  { value: 'GE01', label: 'GE01' },
  { value: 'GE02', label: 'GE02' },
  { value: 'GE03', label: 'GE03' },
  { value: 'GE04', label: 'GE04' },
  { value: 'ME01', label: 'ME01' },
  { value: 'ME02', label: 'ME02' },
  { value: 'ME03', label: 'ME03' },
  { value: 'ME04', label: 'ME04' },
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
