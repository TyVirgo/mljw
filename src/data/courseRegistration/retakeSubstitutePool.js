/**
 * 重修候选：同课 + 课程组内替代（GE 虚拟大组 / ME selectionGroups；CORE 仅同课）
 */

import { getCurrentStudentId } from '../mockCurrentStudent.js'
import { registrationBatches } from './registrationBatches.js'
import {
  getSelectionGroupsForBatch,
  resolveSelectionGroup,
} from './courseSelectionGroups.js'
import { getEligibleAddCoursesForStudent } from './addDropEligibleCourses.js'
import { getCourseById, selectableCourses } from './selectableCourses.js'
import {
  formatGradeToZh,
  isFailingGrade,
  listTranscriptLatestByRetakeType,
  listTranscriptForRetakeCourse,
  getStudentTranscript,
} from './studentTranscript.js'

/** GE 虚拟课程组（与在线选课「整包 GE」语义对齐） */
export const GE_VIRTUAL_SELECTION_GROUP = {
  id: 'ge-virtual-all',
  groupLabel: 'GE',
  name: 'GE(公共选修)',
  nameEn: 'GE (General Electives)',
  intakeLineZh: '(全部可选 GE)',
  intakeLineEn: '(All selectable GE)',
  courseCodes: [],
  minPick: 1,
}

const GRADE_RANK = {
  A: 12,
  'A-': 11,
  'B+': 10,
  B: 9,
  'B-': 8,
  'C+': 7,
  C: 6,
  'C-': 5,
  D: 4,
  F: 1,
  M: 0,
}

/**
 * @param {string} grade
 * @returns {number}
 */
export function gradeRank(grade) {
  const g = String(grade || '').trim()
  if (GRADE_RANK[g] != null) return GRADE_RANK[g]
  const upper = g.toUpperCase()
  if (GRADE_RANK[upper] != null) return GRADE_RANK[upper]
  return -1
}

/**
 * @param {object[]} rows transcript rows
 * @returns {{ grade: string, courseCode: string, academicSession: string }|null}
 */
export function pickHighestGradeRow(rows = []) {
  let best = null
  let bestRank = -1
  for (const row of rows) {
    const r = gradeRank(row?.grade)
    if (r > bestRank) {
      bestRank = r
      best = row
    }
  }
  return best
}

function normalizeType(type) {
  return String(type || '').toUpperCase()
}

function isCoreType(type, sourceType) {
  const t = normalizeType(type)
  const s = String(sourceType || '').toLowerCase()
  return t === 'CORE' || s === 'required'
}

/**
 * 查找课号所属 ME 课程组（扫 ME 批次 selectionGroups）
 * @param {string} courseCode
 * @returns {{ group: object, groups: object[] }|null}
 */
export function findMeSelectionGroupForCode(courseCode) {
  const code = String(courseCode || '')
    .trim()
    .toUpperCase()
  if (!code) return null
  const batches = registrationBatches.value || []
  for (const batch of batches) {
    if (String(batch?.type || '').toUpperCase() !== 'ME') continue
    const groups = getSelectionGroupsForBatch(batch)
    const group = resolveSelectionGroup({ code }, groups)
    if (group) return { group, groups }
  }
  return null
}

/**
 * 本学期可选 GE 开课：加课资格 + 成绩单目标 + 课库常用 GE 码（排除专业批量生成课）
 * @returns {object[]}
 */
export function listTermSelectableGeCourses() {
  const byId = new Map()
  for (const c of getEligibleAddCoursesForStudent() || []) {
    if (normalizeType(c.type) === 'GE' && c.id) byId.set(c.id, c)
  }
  for (const row of getStudentTranscript()) {
    if (normalizeType(row.type) !== 'GE') continue
    const c = getCourseById(row.retakeCourseId)
    if (c && normalizeType(c.type) === 'GE') byId.set(c.id, c)
  }
  const allowCode = /^(HUM|SCI|FIN|ENGL|GE|AI|MPU)\d|^BUS2\d{2}$/i
  for (const c of selectableCourses.value || []) {
    if (normalizeType(c.type) !== 'GE' || !c.id) continue
    if (!Array.isArray(c.sections) || !c.sections.length) continue
    if (!allowCode.test(String(c.code || ''))) continue
    if (!c.schoolElectiveCategory && !c.g1Category) continue
    byId.set(c.id, c)
  }
  return [...byId.values()]
}

/**
 * 课程组内本学期可开课
 * @param {object} group
 * @returns {object[]}
 */
export function listTermCoursesInSelectionGroup(group) {
  const codes = new Set((group?.courseCodes || []).map((c) => String(c).toUpperCase()))
  if (!codes.size && group?.id === GE_VIRTUAL_SELECTION_GROUP.id) {
    return listTermSelectableGeCourses()
  }
  return (selectableCourses.value || []).filter((c) =>
    codes.has(String(c.code || '').toUpperCase()),
  )
}

/**
 * 组内成绩单行（按课号归属）
 * @param {object} group
 * @param {string} [studentId]
 */
export function listTranscriptRowsInGroup(group, studentId = getCurrentStudentId()) {
  const codes = new Set(
    (group?.id === GE_VIRTUAL_SELECTION_GROUP.id
      ? listTermSelectableGeCourses().map((c) => c.code)
      : group?.courseCodes || []
    ).map((c) => String(c || '').toUpperCase()),
  )
  // 成绩单 GE 课号也可能不在本学期目录，一并纳入
  if (group?.id === GE_VIRTUAL_SELECTION_GROUP.id) {
    for (const row of getStudentTranscript(studentId)) {
      if (normalizeType(row.type) === 'GE' && row.courseCode) {
        codes.add(String(row.courseCode).toUpperCase())
      }
    }
  }
  return getStudentTranscript(studentId).filter((row) =>
    codes.has(String(row.courseCode || '').toUpperCase()),
  )
}

/**
 * @param {object} original transcript latest row
 * @returns {{ selectionGroup: object|null, substituteCourses: object[], sameCourse: object|null }}
 */
function resolveGroupAndSubstitutes(original) {
  const type = normalizeType(original.type)
  const sameId = original.retakeCourseId
  const sameCourse = sameId ? getCourseById(sameId) : null

  if (isCoreType(original.type, original.sourceType)) {
    return { selectionGroup: null, substituteCourses: [], sameCourse }
  }

  if (type === 'GE') {
    const selectionGroup = {
      ...GE_VIRTUAL_SELECTION_GROUP,
      courseCodes: listTermSelectableGeCourses().map((c) => String(c.code).toUpperCase()),
    }
    const substitutes = listTermSelectableGeCourses().filter((c) => {
      if (!sameCourse) return true
      return c.id !== sameCourse.id && String(c.code).toUpperCase() !== String(sameCourse.code).toUpperCase()
    })
    return { selectionGroup, substituteCourses: substitutes, sameCourse }
  }

  // ME（及其他按课程组）：先按成绩单课号，再按本学期开课课号
  const hit =
    findMeSelectionGroupForCode(original.courseCode) ||
    (sameCourse ? findMeSelectionGroupForCode(sameCourse.code) : null)
  if (!hit) {
    return { selectionGroup: null, substituteCourses: [], sameCourse }
  }
  const substitutes = listTermCoursesInSelectionGroup(hit.group).filter((c) => {
    if (!sameCourse) return true
    return c.id !== sameCourse.id && String(c.code).toUpperCase() !== String(sameCourse.code).toUpperCase()
  })
  return { selectionGroup: hit.group, substituteCourses: substitutes, sameCourse }
}

/**
 * 重修选择器候选课（去重；附课程组与可替代原课）
 * @param {'failed'|'improve_grade'|string} retakeType
 * @param {string} [studentId]
 * @returns {object[]}
 */
export function listRetakePickerCourses(retakeType, studentId = getCurrentStudentId()) {
  const originals = listTranscriptLatestByRetakeType(retakeType, studentId)
  /** @type {Map<string, object>} */
  const byCourseId = new Map()

  function upsert(course, meta) {
    if (!course?.id) return
    const prev = byCourseId.get(course.id)
    const type = meta.type || course.type
    const sourceType = meta.sourceType || course.sourceType || ''
    if (!prev) {
      byCourseId.set(course.id, {
        ...course,
        type,
        sourceType,
        remainingCapacity: course.remainingCapacity,
        selectionGroup: meta.selectionGroup,
        replacesOriginals: [...meta.replacesOriginals],
        isSubstituteRetake: meta.isSubstituteRetake,
        retakeHistory: meta.retakeHistory,
        groupMaxGrade: meta.groupMaxGrade,
        groupMaxGradeZh: meta.groupMaxGradeZh,
        groupMaxGradeCode: meta.groupMaxGradeCode,
      })
      return
    }
    const codes = new Set(prev.replacesOriginals.map((o) => o.courseCode))
    for (const o of meta.replacesOriginals) {
      if (!codes.has(o.courseCode)) prev.replacesOriginals.push(o)
    }
    if (!prev.selectionGroup && meta.selectionGroup) prev.selectionGroup = meta.selectionGroup
    // 成绩单 CORE / required 覆盖课库误标
    if (meta.type) prev.type = meta.type
    if (meta.sourceType) prev.sourceType = meta.sourceType
    // 同课履历优先于替代挂载，避免先写空替代再覆盖本课成绩
    if (!meta.isSubstituteRetake) {
      prev.isSubstituteRetake = false
      prev.retakeHistory = meta.retakeHistory
    } else if (!prev.retakeHistory?.length && meta.retakeHistory?.length) {
      prev.retakeHistory = meta.retakeHistory
    }
    if (meta.groupMaxGrade && gradeRank(meta.groupMaxGrade) > gradeRank(prev.groupMaxGrade)) {
      prev.groupMaxGrade = meta.groupMaxGrade
      prev.groupMaxGradeZh = meta.groupMaxGradeZh
      prev.groupMaxGradeCode = meta.groupMaxGradeCode
    }
  }

  for (const original of originals) {
    const { selectionGroup, substituteCourses, sameCourse } = resolveGroupAndSubstitutes(original)
    const groupRows = selectionGroup
      ? listTranscriptRowsInGroup(selectionGroup, studentId)
      : listTranscriptForRetakeCourse(original.retakeCourseId, studentId)
    const maxRow = pickHighestGradeRow(groupRows)
    const groupMaxGrade = maxRow?.grade || original.grade || ''
    const groupMaxMeta = {
      groupMaxGrade,
      groupMaxGradeZh: formatGradeToZh(maxRow || groupMaxGrade),
      groupMaxGradeCode: maxRow?.courseCode || original.courseCode || '',
    }
    const historyForOriginal = listTranscriptForRetakeCourse(
      original.retakeCourseId || original.courseCode,
      studentId,
    )

    const typeMeta = {
      type: isCoreType(original.type, original.sourceType)
        ? 'CORE'
        : normalizeType(original.type) || undefined,
      sourceType: original.sourceType || (isCoreType(original.type, original.sourceType) ? 'required' : ''),
    }

    if (sameCourse) {
      upsert(sameCourse, {
        selectionGroup,
        replacesOriginals: [original],
        isSubstituteRetake: false,
        retakeHistory: historyForOriginal,
        ...typeMeta,
        ...groupMaxMeta,
      })
    } else if (isCoreType(original.type, original.sourceType)) {
      // 无本学期开课的必修：跳过（或合成壳，此处跳过）
      continue
    }

    if (isCoreType(original.type, original.sourceType)) continue

    for (const sub of substituteCourses) {
      // 选课器曾修列按「本课号是否考过」展示；替代课挂本课履历（常为空 →「-」）
      const historyForSub = listTranscriptForRetakeCourse(sub.id || sub.code, studentId, sub)
      upsert(sub, {
        selectionGroup,
        replacesOriginals: [original],
        isSubstituteRetake: true,
        retakeHistory: historyForSub,
        type: normalizeType(sub.type) || typeMeta.type,
        sourceType: sub.sourceType || '',
        ...groupMaxMeta,
      })
    }
  }

  return sortRetakePickerCourses([...byCourseId.values()])
}

function sortRetakePickerCourses(list) {
  return [...(list || [])].sort((a, b) => {
    const ga = a.selectionGroup?.id || ''
    const gb = b.selectionGroup?.id || ''
    if (ga !== gb) return ga.localeCompare(gb)
    return String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true })
  })
}

/**
 * 课表必修行是否匹配当前重修类型（最新成绩：提升≥60；不及格&lt;60 或缺考）
 * @param {object[]} history
 * @param {'failed'|'improve_grade'|string} retakeType
 */
function historyMatchesRetakeType(history, retakeType) {
  const latest = (history || [])[0]
  if (!latest) return false
  const failing = isFailingGrade(latest)
  if (retakeType === 'failed') return failing
  if (retakeType === 'improve_grade') return !failing
  return false
}

/**
 * 将「我的课表」必修并入重修候选：仅成绩单已匹配该重修类型的课；禁止无履历硬塞
 * @param {object[]} pool listRetakePickerCourses 结果
 * @param {object[]} requiredCourses studentRequiredCourses
 * @param {string} [studentId]
 * @param {'failed'|'improve_grade'|string} [retakeType]
 * @returns {object[]}
 */
export function mergeRetakePickerWithTimetableRequired(
  pool = [],
  requiredCourses = [],
  studentId = getCurrentStudentId(),
  retakeType = '',
) {
  /** @type {Map<string, object>} */
  const byId = new Map()
  for (const c of pool || []) {
    if (c?.id) byId.set(c.id, { ...c })
  }

  for (const item of requiredCourses || []) {
    const courseId = item.courseId || item.id || ''
    const code = String(item.courseCode || item.code || '')
      .trim()
      .toUpperCase()
    let hit =
      (courseId && byId.get(courseId)) ||
      [...byId.values()].find((c) => String(c.code || '').toUpperCase() === code)
    if (hit) {
      hit.type = 'CORE'
      hit.sourceType = 'required'
      byId.set(hit.id, hit)
      continue
    }
    const catalog = courseId ? getCourseById(courseId) : null
    const course = catalog
      ? { ...catalog }
      : {
          id: courseId || `required-${code}`,
          code: item.courseCode || item.code,
          name: item.courseName || item.name || item.courseNameEn || '',
          credits: item.credits,
          type: 'CORE',
          sourceType: 'required',
          remainingCapacity: item.remainingCapacity,
          totalCapacity: item.totalCapacity,
          sections: item.sectionId
            ? [
                {
                  id: item.sectionId,
                  code: item.sectionCode || '01',
                  time: item.time || '',
                  room: item.room || '',
                  lecturer: item.lecturer || item.lecturerEn || '',
                  enrolled: 0,
                  capacity: Number(item.totalCapacity) || 40,
                },
              ]
            : [],
          batchId: item.batchId || '',
        }
    const history = listTranscriptForRetakeCourse(
      course.id || course.code,
      studentId,
      course,
    )
    if (!historyMatchesRetakeType(history, retakeType)) continue
    const id = course.id || `required-${code}`
    byId.set(id, {
      ...course,
      id,
      type: 'CORE',
      sourceType: 'required',
      selectionGroup: null,
      replacesOriginals: [],
      isSubstituteRetake: false,
      retakeHistory: history,
    })
  }

  return sortRetakePickerCourses([...byId.values()])
}
