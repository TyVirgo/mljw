/**
 * 已选/志愿展示与选课列表同源：按 courseId + sectionId 回填课库字段
 */
import {
  getCourseById,
  resolveSchoolElectiveCategory,
  selectableCourses,
} from './selectableCourses.js'
import { enrichSectionScheduleFields } from './sectionScheduleFields.js'
import { getCourseLocalizedName } from './courseTeachingBrief.js'

/**
 * 课名：与选课列表同源（有双语简介则跟语言切换）
 * @param {{ code?: string, name?: string, nameZh?: string }|null|undefined} course
 * @param {'zh'|'en'|boolean} locale
 */
export function getCourseDisplayName(course, locale = 'zh') {
  if (!course) return ''
  const loc = locale === true || locale === 'zh' ? 'zh' : 'en'
  return getCourseLocalizedName(course.code, course, loc) || course.name || ''
}

/**
 * @param {object|null|undefined} item 志愿/已选行
 * @returns {{ course: object|null, section: object|null }}
 */
export function resolveCatalogCourseSection(item) {
  if (!item) return { course: null, section: null }
  let course = item.courseId ? getCourseById(item.courseId) : null
  if (!course && item.courseCode) {
    const code = String(item.courseCode).toUpperCase()
    course =
      selectableCourses.value.find((c) => String(c.code || '').toUpperCase() === code) || null
  }
  if (!course) return { course: null, section: null }
  const sections = course.sections || []
  let section =
    (item.sectionId && sections.find((s) => s.id === item.sectionId)) ||
    (item.sectionCode && sections.find((s) => String(s.code) === String(item.sectionCode))) ||
    null
  if (section) section = enrichSectionScheduleFields({ ...section })
  return { course, section }
}

/**
 * 回填展示字段（课名跟语言；教师/周次/上课时间跟课库分组）
 * @param {object} item
 * @param {{ locale?: 'zh'|'en'|boolean }} [opts]
 */
export function hydrateSelectedCourseDisplay(item, opts = {}) {
  if (!item) return item
  const locale =
    opts.locale === true || opts.locale === 'zh'
      ? 'zh'
      : opts.locale === false || opts.locale === 'en'
        ? 'en'
        : 'zh'
  const { course, section } = resolveCatalogCourseSection(item)
  if (!course) {
    const fallbackName =
      getCourseLocalizedName(item.courseCode || item.code, item, locale) ||
      (locale === 'zh'
        ? item.courseName || item.courseNameEn || item.name || ''
        : item.courseNameEn || item.courseName || item.name || '')
    return {
      ...item,
      courseName: fallbackName,
      displaySection: item,
    }
  }
  const courseName = getCourseDisplayName(course, locale)
  if (!section) {
    return {
      ...item,
      courseCode: course.code || item.courseCode,
      courseName,
      credits: course.credits ?? item.credits,
      type: course.type || item.type,
      displaySection: item,
    }
  }
  return {
    ...item,
    courseId: course.id || item.courseId,
    courseCode: course.code || item.courseCode,
    courseName,
    credits: course.credits ?? item.credits,
    type: course.type || item.type,
    sectionId: section.id || item.sectionId,
    sectionCode: section.code || item.sectionCode,
    time: section.time || item.time,
    classTime: section.classTime || section.time || item.classTime,
    weekRange: section.weekRange || item.weekRange,
    room: section.room || item.room,
    lecturer: section.lecturer || item.lecturer,
    meetings: section.meetings || item.meetings,
    schoolElectiveCategory: item.schoolElectiveCategory || resolveSchoolElectiveCategory(course),
    displaySection: section,
  }
}

/**
 * 从课库生成志愿/已选种子行（展示字段与列表一致）
 * @param {{ courseId: string, sectionId: string, preferenceOrder?: number, selectedAt?: string, batchId?: string, id?: string, sourceType?: string, roundKey?: string }} spec
 */
export function buildSelectedRowFromCatalog(spec = {}) {
  const course = getCourseById(spec.courseId)
  if (!course) return null
  const rawSection = (course.sections || []).find((s) => s.id === spec.sectionId)
  if (!rawSection) return null
  const section = enrichSectionScheduleFields({ ...rawSection })
  return {
    id: spec.id || `pending-vol-${course.id}-${section.id}`,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    courseNameEn: course.name,
    credits: course.credits,
    type: course.type,
    sectionId: section.id,
    sectionCode: section.code,
    time: section.time,
    classTime: section.classTime || section.time,
    weekRange: section.weekRange,
    room: section.room,
    lecturer: section.lecturer,
    lecturerEn: section.lecturer,
    batchId: spec.batchId || course.batchId,
    preferenceOrder: spec.preferenceOrder ?? 1,
    selectedAt: spec.selectedAt || '',
    sourceType: spec.sourceType || 'preselect',
    roundKey: spec.roundKey || 'preselect',
    meetings: section.meetings,
    schoolElectiveCategory: resolveSchoolElectiveCategory(course),
  }
}
