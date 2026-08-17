/**
 * 第一轮加权抽签（老生池 + 毕业生优先 + W_i = r^(N-i)）
 */
import { getPreselectR, dayWeights } from './preselectWeightSettings.js'
import { isGraduateStudent } from './studentAudience.js'
import { getCourseAudienceCapacity } from './selectableCourses.js'

/**
 * 提交日相对 R1 开始的第几天（1-based）；解析失败则落在中间日
 */
export function dayIndexFromSubmittedAt(submittedAt, roundStart, nDays) {
  const N = Math.max(1, Math.floor(nDays) || 1)
  if (!submittedAt || !roundStart) return Math.ceil(N / 2)
  const start = Date.parse(String(roundStart).replace(/-/g, ' '))
  const sub = Date.parse(String(submittedAt).replace(/-/g, ' '))
  if (!Number.isFinite(start) || !Number.isFinite(sub)) return Math.ceil(N / 2)
  const dayMs = 24 * 60 * 60 * 1000
  const idx = Math.floor((sub - start) / dayMs) + 1
  return Math.min(N, Math.max(1, idx))
}

function weightedPickIndex(weights, rand = Math.random) {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return Math.floor(rand() * weights.length)
  let r = rand() * sum
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

/**
 * 从志愿名单中按规则选出不超过 capacity 的中签者（返回新数组，顺序=录取序）
 * @param {object[]} volunteers
 * @param {{ capacity: number, batchType?: string, programme?: string, nDays?: number, roundStart?: string, r?: number }} opts
 */
export function drawWeightedVolunteers(volunteers = [], opts = {}) {
  const capacity = Math.max(0, Math.floor(Number(opts.capacity) || 0))
  if (!capacity || !volunteers.length) return []

  const nDays = Math.max(1, Math.floor(opts.nDays) || 3)
  const r =
    opts.r != null
      ? Number(opts.r)
      : getPreselectR(opts.batchType || 'GE', opts.programme)
  const weightsTable = dayWeights(nDays, r)

  const grads = []
  const others = []
  for (const v of volunteers) {
    if (v.isGraduate || isGraduateStudent(v.studentId)) grads.push(v)
    else others.push(v)
  }

  const selected = []
  const usedCourseKeys = new Set() // studentId|courseCode 同课多组互斥

  function tryAdd(v) {
    const courseKey = `${v.studentId}|${v.courseCode || v.courseId || ''}`
    if (v.courseCode || v.courseId) {
      if (usedCourseKeys.has(courseKey)) return false
    }
    if (selected.length >= capacity) return false
    selected.push(v)
    if (v.courseCode || v.courseId) usedCourseKeys.add(courseKey)
    return true
  }

  // 毕业生 100% 优先
  for (const g of grads) {
    if (selected.length >= capacity) break
    tryAdd(g)
  }

  // 加权随机
  const pool = others.map((v) => {
    const day = dayIndexFromSubmittedAt(v.submittedAt, opts.roundStart, nDays)
    return { v, w: weightsTable[day - 1] || 1 }
  })

  while (selected.length < capacity && pool.length) {
    const idx = weightedPickIndex(pool.map((p) => p.w))
    const [picked] = pool.splice(idx, 1)
    tryAdd(picked.v)
  }

  return selected
}

/**
 * 对某教学分组状态执行抽签，裁剪 volunteers 至老生名额（分组维度）
 */
export function applyWeightedDrawToSectionState(state, course, batch) {
  if (!state || !course) return state
  const audience = getCourseAudienceCapacity(course)
  const sectionCap = Number(state.capacity) || 0
  // 老生池：按分组容量占课总容量比例分摊老生名额
  const totalCap = Number(course.totalCapacity) || sectionCap || 1
  const seniorPool = Math.max(
    0,
    Math.round((audience.seniorCap * sectionCap) / totalCap) || Math.min(sectionCap, audience.seniorCap),
  )
  const volunteers = (state.volunteers || []).map((v) => ({
    ...v,
    courseCode: v.courseCode || course.code,
    courseId: v.courseId || course.id,
  }))
  const drawn = drawWeightedVolunteers(volunteers, {
    capacity: Math.min(sectionCap, seniorPool || sectionCap),
    batchType: batch?.type,
    programme: batch?.programme || '',
    nDays: 3,
    roundStart: batch?.roundsByAudience?.senior?.preselect?.start || batch?.rounds?.preselect?.start,
  })
  return {
    ...state,
    volunteers: drawn,
    dirty: false,
    pendingDraftVolunteers: null,
  }
}
