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

/** ME选课虚拟大组：未入 n 选 m selectionGroups 的本学期 ME 开课互替 */
export const ME_ORDINARY_VIRTUAL_SELECTION_GROUP = {
  id: 'me-virtual-ordinary',
  groupLabel: 'ME',
  name: 'ME选课',
  nameEn: 'ME (ordinary electives)',
  intakeLineZh: '(未入 n 选 m 的专选)',
  intakeLineEn: '(ME not in n-of-m groups)',
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
 * 是否已归属某 ME 批次的 n 选 m 课程组
 * @param {string} courseCode
 */
export function isMeCodeInSelectionGroup(courseCode) {
  return Boolean(findMeSelectionGroupForCode(courseCode))
}

/**
 * 本学期「ME选课」虚拟大组开课：ME 且未入 n 选 m，有教学班
 * @returns {object[]}
 */
export function listTermSelectableMeOrdinaryCourses() {
  const byId = new Map()
  function consider(course) {
    if (!course?.id) return
    if (normalizeType(course.type) !== 'ME') return
    if (isCoreType(course.type, course.sourceType)) return
    if (isMeCodeInSelectionGroup(course.code)) return
    if (!Array.isArray(course.sections) || !course.sections.length) return
    byId.set(course.id, course)
  }
  for (const c of getEligibleAddCoursesForStudent() || []) consider(c)
  for (const row of getStudentTranscript()) {
    if (normalizeType(row.type) !== 'ME') continue
    const c = getCourseById(row.retakeCourseId)
    if (c) consider(c)
  }
  for (const c of selectableCourses.value || []) consider(c)
  return [...byId.values()]
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
  if (group?.id === GE_VIRTUAL_SELECTION_GROUP.id) {
    return listTermSelectableGeCourses()
  }
  if (group?.id === ME_ORDINARY_VIRTUAL_SELECTION_GROUP.id) {
    return listTermSelectableMeOrdinaryCourses()
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
  let codes
  if (group?.id === GE_VIRTUAL_SELECTION_GROUP.id) {
    codes = new Set(listTermSelectableGeCourses().map((c) => String(c.code || '').toUpperCase()))
    for (const row of getStudentTranscript(studentId)) {
      if (normalizeType(row.type) === 'GE' && row.courseCode) {
        codes.add(String(row.courseCode).toUpperCase())
      }
    }
  } else if (group?.id === ME_ORDINARY_VIRTUAL_SELECTION_GROUP.id) {
    codes = new Set(
      listTermSelectableMeOrdinaryCourses().map((c) => String(c.code || '').toUpperCase()),
    )
    for (const row of getStudentTranscript(studentId)) {
      if (normalizeType(row.type) !== 'ME') continue
      if (isMeCodeInSelectionGroup(row.courseCode)) continue
      if (row.courseCode) codes.add(String(row.courseCode).toUpperCase())
    }
  } else {
    codes = new Set((group?.courseCodes || []).map((c) => String(c || '').toUpperCase()))
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

  // ME：先 n 选 m；未命中则进「ME选课」虚拟大组
  const hit =
    findMeSelectionGroupForCode(original.courseCode) ||
    (sameCourse ? findMeSelectionGroupForCode(sameCourse.code) : null)
  if (hit) {
    const substitutes = listTermCoursesInSelectionGroup(hit.group).filter((c) => {
      if (!sameCourse) return true
      return (
        c.id !== sameCourse.id &&
        String(c.code).toUpperCase() !== String(sameCourse.code).toUpperCase()
      )
    })
    return { selectionGroup: hit.group, substituteCourses: substitutes, sameCourse }
  }
  if (type === 'ME') {
    const ordinaryList = listTermSelectableMeOrdinaryCourses()
    const selectionGroup = {
      ...ME_ORDINARY_VIRTUAL_SELECTION_GROUP,
      courseCodes: ordinaryList.map((c) => String(c.code).toUpperCase()),
    }
    const substitutes = ordinaryList.filter((c) => {
      if (!sameCourse) return true
      return (
        c.id !== sameCourse.id &&
        String(c.code).toUpperCase() !== String(sameCourse.code).toUpperCase()
      )
    })
    return { selectionGroup, substituteCourses: substitutes, sameCourse }
  }
  return { selectionGroup: null, substituteCourses: [], sameCourse }
}

/**
 * 候选课是否因「最新成绩已及格」在不及格重修中禁选（组内互替场景）
 * @param {object|null|undefined} course 弹框课行或 course 对象（含 retakeHistory）
 * @returns {boolean}
 */
export function isRetakeCourseBlockedByPassingGrade(course) {
  const history = course?.retakeHistory || []
  const latest = history[0]
  if (!latest) return false
  return !isFailingGrade(latest)
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
 * 按挂科/原课过滤重修候选（二层选课）
 * @param {object[]} pool listRetakePickerCourses 结果
 * @param {object|null|undefined} original 成绩单原课行
 * @returns {object[]}
 */
export function filterRetakePickerCoursesByOriginal(pool = [], original) {
  if (!original) return [...(pool || [])]
  const code = String(original.courseCode || original.code || '')
    .trim()
    .toUpperCase()
  const id = String(original.retakeCourseId || original.courseId || original.id || '').trim()
  return (pool || []).filter((course) => {
    const replaces = course?.replacesOriginals || []
    if (
      replaces.some((o) => {
        const oc = String(o.courseCode || o.code || '')
          .trim()
          .toUpperCase()
        const oid = String(o.retakeCourseId || o.courseId || o.id || '').trim()
        return (code && oc === code) || (id && oid && oid === id)
      })
    ) {
      return true
    }
    const cc = String(course.code || '')
      .trim()
      .toUpperCase()
    const cid = String(course.id || '').trim()
    return (code && cc === code) || (id && cid && cid === id)
  })
}

/**
 * 从行/课多字段推断课性（增量 bi：避免 type 空导致不过滤）
 * @param {object|null|undefined} courseOrLine
 * @returns {''|'core'|'GE'|'ME'}
 */
function inferRetakeScopeElectiveKind(courseOrLine) {
  if (!courseOrLine) return ''
  if (isCoreType(courseOrLine.type, courseOrLine.sourceType)) return 'core'
  const fields = [
    courseOrLine.type,
    courseOrLine.sourceType,
    courseOrLine.schoolElectiveCategory,
    courseOrLine.courseType,
    courseOrLine.category,
  ]
  for (const field of fields) {
    const raw = String(field || '').trim()
    if (!raw) continue
    const upper = raw.toUpperCase()
    if (upper === 'CORE' || upper === 'REQUIRED' || upper === 'MANDATORY') return 'core'
    if (upper === 'GE' || upper.startsWith('GE')) return 'GE'
    if (upper === 'ME' || upper.startsWith('ME')) return 'ME'
  }
  return ''
}

/**
 * 解析重修/换课的课程组范围（增量 bh / bi）
 * - core：仅同课号池（由上层课性锁处理）
 * - ge-virtual：全部可选 GE
 * - me-group：真实 n 选 m 组
 * - me-ordinary：普通 ME（非几选几）
 * @param {object|null|undefined} courseOrLine 原课/驳回行
 * @returns {{ kind: string, groupId: string, group: object|null }}
 */
export function resolveRetakeSelectionGroupScope(courseOrLine) {
  if (!courseOrLine) return { kind: '', groupId: '', group: null }
  const code = String(courseOrLine.courseCode || courseOrLine.code || '').trim()
  const electiveKind = inferRetakeScopeElectiveKind(courseOrLine)
  if (electiveKind === 'core') {
    return { kind: 'core', groupId: '', group: null }
  }
  if (electiveKind === 'GE') {
    return {
      kind: 'ge-virtual',
      groupId: GE_VIRTUAL_SELECTION_GROUP.id,
      group: GE_VIRTUAL_SELECTION_GROUP,
    }
  }
  // 课号落在真实 n 选 m → 仅该组（优先于可能脏的 selectionGroupId）
  const meHit = findMeSelectionGroupForCode(code)
  if (meHit?.group) {
    return { kind: 'me-group', groupId: meHit.group.id, group: meHit.group }
  }
  // 挂载真组（带 courseCodes）且课号未命中批次时仍按挂载组收窄
  const attachedId = String(courseOrLine.selectionGroupId || courseOrLine.selectionGroup?.id || '').trim()
  const attached = courseOrLine.selectionGroup
  const attachedCodes = Array.isArray(attached?.courseCodes) ? attached.courseCodes : []
  if (
    attachedId &&
    attachedCodes.length &&
    attachedId !== GE_VIRTUAL_SELECTION_GROUP.id &&
    attachedId !== ME_ORDINARY_VIRTUAL_SELECTION_GROUP.id
  ) {
    return {
      kind: 'me-group',
      groupId: attachedId,
      group: attached,
    }
  }
  if (electiveKind === 'ME') {
    return {
      kind: 'me-ordinary',
      groupId: ME_ORDINARY_VIRTUAL_SELECTION_GROUP.id,
      group: ME_ORDINARY_VIRTUAL_SELECTION_GROUP,
    }
  }
  return { kind: '', groupId: '', group: null }
}

/**
 * 候选课是否落在指定课程组范围内
 * @param {object} course
 * @param {{ kind: string, groupId: string, group: object|null }} scope
 */
export function courseMatchesRetakeSelectionGroupScope(course, scope) {
  if (!course || !scope?.kind) return true
  if (scope.kind === 'core') return true
  const courseGroupId = String(course.selectionGroup?.id || course.selectionGroupId || '').trim()
  const code = String(course.code || course.courseCode || '').trim()
  if (scope.kind === 'ge-virtual') {
    const t = normalizeType(course.type)
    return t === 'GE' || String(course.type || '').toUpperCase().startsWith('GE')
  }
  if (scope.kind === 'me-group') {
    if (courseGroupId && courseGroupId === scope.groupId) return true
    // 池未挂组时按课号是否属于该组判断
    const hit = findMeSelectionGroupForCode(code)
    return Boolean(hit?.group?.id && hit.group.id === scope.groupId)
  }
  if (scope.kind === 'me-ordinary') {
    const t = normalizeType(course.type)
    if (t !== 'ME' && !String(course.type || '').toUpperCase().startsWith('ME')) return false
    // 真实 n 选 m 组排除（挂载 id / 课号批次 / 组标签 GroupN）
    if (courseGroupId && courseGroupId !== ME_ORDINARY_VIRTUAL_SELECTION_GROUP.id) {
      if (
        courseGroupId !== GE_VIRTUAL_SELECTION_GROUP.id &&
        !isVirtualMeOrdinaryGroupId(courseGroupId)
      ) {
        return false
      }
    }
    if (isMeCodeInSelectionGroup(code)) return false
    const label = String(
      course.selectionGroup?.groupLabel || course.selectionGroup?.name || '',
    ).trim()
    if (/^Group\s*\d+/i.test(label)) return false
    return true
  }
  return true
}

/**
 * @param {string} groupId
 */
function isVirtualMeOrdinaryGroupId(groupId) {
  return groupId === ME_ORDINARY_VIRTUAL_SELECTION_GROUP.id
}

/**
 * 按课程组范围过滤重修/换课候选（增量 bh：普通 ME 不含几选几组）
 * @param {object[]} pool
 * @param {object|null|undefined} focusCourseOrLine 原课或驳回行
 * @returns {object[]}
 */
export function filterRetakePickerCoursesBySelectionGroupScope(pool = [], focusCourseOrLine) {
  const scope = resolveRetakeSelectionGroupScope(focusCourseOrLine)
  if (!scope.kind || scope.kind === 'core') return [...(pool || [])]
  return (pool || []).filter((course) => courseMatchesRetakeSelectionGroupScope(course, scope))
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
