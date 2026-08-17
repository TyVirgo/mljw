/**
 * 学生端课号来源：批次名称 + 课程库来源文案（原型 demo）
 */
import { selectableCourses } from './selectableCourses.js'
import { getBatchById } from './registrationBatches.js'

/**
 * 学年学期压成库名用 session 码，如 2026/04 → 202604
 * @param {string} [session]
 */
function sessionCompact(session) {
  return String(session || '').replace(/\//g, '') || '202504'
}

/**
 * 按批次生成课程库来源行（对齐 XMUM 库名句式）
 * @param {object} batch
 */
function libraryLineForBatch(batch) {
  const session = sessionCompact(batch?.academicSession)
  if (batch?.type === 'GE') {
    return `General Elective Course Library for Academic Session ${session}@25.03.2025`
  }
  const dept =
    batch?.programme ||
    (typeof batch?.name === 'string' && batch.name.match(/\bfor\s+([A-Z]{2,})\b/)?.[1]) ||
    'ENG'
  return `${dept} Major Elective & Open Elective Course Library for Academic Session ${session}`
}

/**
 * 某课号所属批次名与课程库来源（去重）
 * @param {string} code 课程代码
 * @returns {string[]}
 */
export function getCourseCodeSourceLines(code) {
  const codeKey = String(code || '').trim()
  if (!codeKey) return []

  const matches = selectableCourses.value.filter((item) => item.code === codeKey)
  const lines = []
  const seen = new Set()

  const push = (line) => {
    const text = String(line || '').trim()
    if (!text || seen.has(text)) return
    seen.add(text)
    lines.push(text)
  }

  for (const course of matches) {
    const batch = getBatchById(course.batchId)
    if (!batch) continue
    push(batch.name)
    push(libraryLineForBatch(batch))
  }

  if (!lines.length) {
    push(`Course Library for ${codeKey}`)
  }
  return lines
}
