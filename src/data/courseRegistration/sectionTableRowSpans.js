/**
 * 学生在线选课主表：按课程聚块、课级/组级 rowspan、按课程分页（ME 组感知）
 */

import { resolveSelectionGroup } from './courseSelectionGroups.js'
import { isSectionFullForAudience } from './selectableCourses.js'

/** @param {{ id?: string, code?: string }} course */
export function courseRowKey(course) {
  return String(course?.id || course?.code || '').trim()
}

/**
 * 有余量/已满：任一分组符合条件则保留该课全部分组行（R2/R3）
 * @param {object[]} courses
 * @param {'open'|'full'|''} availability
 * @param {{ audience?: 'senior'|'freshman', roundKey?: string, releaseCross?: boolean, useAudienceSeats?: boolean }} [opts]
 */
export function filterCoursesBySectionAvailability(courses, availability, opts = {}) {
  if (!availability || availability === '') return courses
  const useAudience = opts.useAudienceSeats !== false && opts.roundKey && opts.roundKey !== 'preselect'
  return (courses || []).filter((course) => {
    const sections = course.sections?.length ? course.sections : [null]
    if (availability === 'open') {
      return sections.some((section) => {
        if (!section) return false
        if (useAudience) {
          return !isSectionFullForAudience(section, opts.audience || 'senior', {
            roundKey: opts.roundKey,
            releaseCross: opts.releaseCross,
          })
        }
        return Number(section.enrolled) < Number(section.capacity)
      })
    }
    if (availability === 'full') {
      return sections.some((section) => {
        if (!section) return true
        if (useAudience) {
          return isSectionFullForAudience(section, opts.audience || 'senior', {
            roundKey: opts.roundKey,
            releaseCross: opts.releaseCross,
          })
        }
        return Number(section.enrolled) >= Number(section.capacity)
      })
    }
    return true
  })
}

/**
 * R1：按分组行志愿已选百分比过滤（与列表列同源：志愿数/容量）
 * @param {{ course: object, section: object|null }[]} rows
 * @param {'lt100'|'gte100'|''} availability
 * @param {(course: object, section: object) => number} getVolunteerCount
 */
export function filterSectionRowsBySelectedPercent(rows, availability, getVolunteerCount) {
  if (!availability || availability === '') return rows
  if (availability !== 'lt100' && availability !== 'gte100') return rows
  return (rows || []).filter(({ course, section }) => {
    if (!section) return false
    const cap = Number(section.capacity) || 0
    if (cap <= 0) return false
    const volunteers = Number(getVolunteerCount?.(course, section)) || 0
    const ratio = volunteers / cap
    if (availability === 'lt100') return ratio < 1
    return ratio >= 1
  })
}

/**
 * 课程列表 → 分组展平行
 * @param {object[]} courses
 * @param {import('./courseSelectionGroups.js').SelectionGroup[]} groups
 */
export function buildSectionRowsFromCourses(courses, groups = []) {
  const rows = []
  for (const course of courses || []) {
    const sections = course.sections?.length ? course.sections : [null]
    const selectionGroup = resolveSelectionGroup(course, groups)
    for (const section of sections) {
      rows.push({ course, section, selectionGroup })
    }
  }
  return rows
}

/** @param {object[]} rows */
export function sortRowsByCourseThenSection(rows) {
  return [...(rows || [])].sort((a, b) => {
    const ca = String(a.course?.code || '')
    const cb = String(b.course?.code || '')
    if (ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true })
    const ida = courseRowKey(a.course)
    const idb = courseRowKey(b.course)
    if (ida !== idb) return ida.localeCompare(idb)
    return String(a.section?.code || '').localeCompare(String(b.section?.code || ''), undefined, {
      numeric: true,
    })
  })
}

/**
 * 将连续行按课程聚块
 * @param {object[]} rows
 * @returns {object[][]}
 */
export function groupSectionRowsByCourse(rows) {
  const blocks = []
  let currentKey = ''
  let block = []
  for (const row of rows || []) {
    const key = courseRowKey(row.course)
    if (key !== currentKey) {
      if (block.length) blocks.push(block)
      block = [row]
      currentKey = key
    } else {
      block.push(row)
    }
  }
  if (block.length) blocks.push(block)
  return blocks
}

/** @param {object[]} rowSlice */
function countUniqueCoursesInRows(rowSlice) {
  const set = new Set()
  for (const row of rowSlice || []) {
    set.add(courseRowKey(row.course))
  }
  return set.size
}

/**
 * 分页单元：选课组整块 或 无组单课块
 * @param {object[]} rows
 */
export function groupRowsIntoPageUnits(rows) {
  const units = []
  let i = 0
  const list = rows || []
  while (i < list.length) {
    const group = list[i].selectionGroup
    if (group?.id) {
      const gid = group.id
      let j = i + 1
      while (j < list.length && list[j].selectionGroup?.id === gid) j += 1
      const slice = list.slice(i, j)
      units.push({ rows: slice, courseCount: countUniqueCoursesInRows(slice) })
      i = j
    } else {
      const key = courseRowKey(list[i].course)
      let j = i + 1
      while (
        j < list.length &&
        !list[j].selectionGroup &&
        courseRowKey(list[j].course) === key
      ) {
        j += 1
      }
      const slice = list.slice(i, j)
      units.push({ rows: slice, courseCount: 1 })
      i = j
    }
  }
  return units
}

/**
 * 将分页单元打包为页（不拆选课组、不拆单课）
 * @param {ReturnType<typeof groupRowsIntoPageUnits>} units
 * @param {number} pageSize
 */
export function packPageUnits(units, pageSize) {
  const size = Math.max(1, Number(pageSize) || 20)
  const pages = []
  let current = []
  let courseCount = 0
  for (const unit of units || []) {
    if (courseCount > 0 && courseCount + unit.courseCount > size) {
      pages.push(current)
      current = [unit]
      courseCount = unit.courseCount
    } else {
      current.push(unit)
      courseCount += unit.courseCount
    }
  }
  if (current.length) pages.push(current)
  return pages
}

/**
 * 按课程分页：同一课程的所有分组行不跨页；groupAware 时选课组整块不跨页
 * @param {object[]} rows 已排序的展平行
 * @param {number} page 1-based
 * @param {number} pageSize 每页课程数
 * @param {{ groupAware?: boolean }} [options]
 */
export function paginateSectionRowsByCourse(rows, page, pageSize, options = {}) {
  const { groupAware = false } = options
  const safePage = Math.max(1, Number(page) || 1)
  const size = Math.max(1, Number(pageSize) || 20)

  if (!groupAware) {
    const blocks = groupSectionRowsByCourse(rows)
    const totalCourses = blocks.length
    const start = (safePage - 1) * size
    const pageBlocks = blocks.slice(start, start + size)
    const flat = pageBlocks.flat()
    const withSpan = attachTableRowSpans(flat, start, { groupRemark: false })
    return {
      rows: withSpan,
      totalCourses,
      firstCourseIndex: start,
    }
  }

  const units = groupRowsIntoPageUnits(rows)
  const totalCourses = units.reduce((sum, unit) => sum + unit.courseCount, 0)
  const pages = packPageUnits(units, size)
  const pageUnits = pages[safePage - 1] || []
  const flat = pageUnits.flatMap((unit) => unit.rows)
  const firstCourseIndex = pages
    .slice(0, safePage - 1)
    .reduce(
      (sum, pageBlock) =>
        sum + pageBlock.reduce((inner, unit) => inner + unit.courseCount, 0),
      0,
    )
  const withSpan = attachTableRowSpans(flat, firstCourseIndex, { groupRemark: true })
  return {
    rows: withSpan,
    totalCourses,
    firstCourseIndex,
  }
}

/**
 * 课级列 rowspan + 可选组级备注 rowspan
 * @param {object[]} rows 单页内连续行
 * @param {number} firstCourseIndex 0-based 全局课程序号起点
 * @param {{ groupRemark?: boolean }} [options]
 */
export function attachTableRowSpans(rows, firstCourseIndex = 0, options = {}) {
  let out = attachCourseLevelRowSpans(rows, firstCourseIndex)
  if (options.groupRemark) {
    out = attachSelectionGroupRemarkSpans(out)
  }
  return out
}

/**
 * 课级列 rowspan：序号/代码/名称/类型/校选课类型/学分/课程组/先修
 * @param {object[]} rows 单页内连续行
 * @param {number} firstCourseIndex 0-based 全局课程序号起点
 */
export function attachCourseLevelRowSpans(rows, firstCourseIndex = 0, opts = {}) {
  const flat = Boolean(opts?.flat)
  const out = (rows || []).map((row) => ({ ...row, _span: { ...(row._span || {}) } }))
  const courseKeys = [
    'serial',
    'code',
    'name',
    'type',
    'schoolCat',
    'credits',
    'selectionGroup',
    'prerequisites',
    'retakeHistory',
    'originalSession',
    // 管理端结果·第一轮融合表课级列
    'batch',
    'effectiveCap',
    'freshmanCap',
    'seniorCap',
    'specialAdded',
  ]
  if (flat) {
    for (let i = 0; i < out.length; i += 1) {
      const cellSpan = { ...(out[i]._span || {}) }
      for (const field of courseKeys) {
        cellSpan[field] = { show: true, rowspan: 1 }
      }
      cellSpan.serial = { show: true, rowspan: 1, value: firstCourseIndex + i + 1 }
      out[i]._span = cellSpan
    }
    return out
  }
  let i = 0
  let courseOffset = 0
  while (i < out.length) {
    const key = courseRowKey(out[i].course)
    let j = i + 1
    while (j < out.length && courseRowKey(out[j].course) === key) j += 1
    const span = j - i
    const serial = firstCourseIndex + courseOffset + 1
    for (let k = i; k < j; k += 1) {
      const cellSpan = { ...(out[k]._span || {}) }
      for (const field of courseKeys) {
        cellSpan[field] = k === i ? { show: true, rowspan: span } : { show: false }
      }
      cellSpan.serial = { ...cellSpan.serial, value: serial }
      out[k]._span = cellSpan
    }
    courseOffset += 1
    i = j
  }
  return out
}

/**
 * 组级备注列 rowspan（跨组内全部课程×分组行；无组按课显示 —）
 * @param {object[]} rows
 */
export function attachSelectionGroupRemarkSpans(rows) {
  const out = rows || []
  let i = 0
  while (i < out.length) {
    const group = out[i].selectionGroup
    if (!group?.id) {
      const key = courseRowKey(out[i].course)
      let j = i + 1
      while (
        j < out.length &&
        !out[j].selectionGroup &&
        courseRowKey(out[j].course) === key
      ) {
        j += 1
      }
      const span = j - i
      for (let k = i; k < j; k += 1) {
        out[k]._span = {
          ...out[k]._span,
          remark: k === i ? { show: true, rowspan: span, dash: true } : { show: false },
        }
      }
      i = j
      continue
    }
    const gid = group.id
    let j = i + 1
    while (j < out.length && out[j].selectionGroup?.id === gid) j += 1
    const span = j - i
    for (let k = i; k < j; k += 1) {
      out[k]._span = {
        ...out[k]._span,
        remark:
          k === i ? { show: true, rowspan: span, group } : { show: false },
      }
    }
    i = j
  }
  return out
}
