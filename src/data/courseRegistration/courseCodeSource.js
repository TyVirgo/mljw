/**
 * 学生端课号来源：批次名称 + 课程库来源文案（原型 demo；中英双语）
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
 * @param {'en'|'zh'} locale
 */
function libraryLineForBatch(batch, locale = 'en') {
  const session = sessionCompact(batch?.academicSession)
  const sessionLabel = batch?.academicSession || session
  if (batch?.type === 'GE') {
    return locale === 'zh'
      ? `学年学期 ${sessionLabel} 公共选修课程库@25.03.2025`
      : `General Elective Course Library for Academic Session ${session}@25.03.2025`
  }
  const dept =
    batch?.programme ||
    (typeof batch?.name === 'string' && batch.name.match(/\bfor\s+([A-Z]{2,})\b/)?.[1]) ||
    'ENG'
  return locale === 'zh'
    ? `学年学期 ${sessionLabel} ${dept} 专业选修与开放选修课程库`
    : `${dept} Major Elective & Open Elective Course Library for Academic Session ${session}`
}

/**
 * 某课号：批次名与课程库来源分行（去重）
 * @param {string} code 课程代码
 * @param {'en'|'zh'} [locale]
 * @returns {{ batchNames: string[], libraryLines: string[], course?: object }}
 */
export function getCourseCodeSourceParts(code, locale = 'en') {
  const codeKey = String(code || '').trim()
  const loc = locale === 'zh' ? 'zh' : 'en'
  if (!codeKey) return { batchNames: [], libraryLines: [] }

  const matches = selectableCourses.value.filter((item) => item.code === codeKey)
  const batchNames = []
  const libraryLines = []
  const seenBatch = new Set()
  const seenLib = new Set()

  const push = (list, seen, line) => {
    const text = String(line || '').trim()
    if (!text || seen.has(text)) return
    seen.add(text)
    list.push(text)
  }

  for (const course of matches) {
    const batch = getBatchById(course.batchId)
    if (!batch) continue
    push(batchNames, seenBatch, batch.name)
    push(libraryLines, seenLib, libraryLineForBatch(batch, loc))
  }

  if (!libraryLines.length) {
    push(
      libraryLines,
      seenLib,
      loc === 'zh' ? `${codeKey} 课程库` : `Course Library for ${codeKey}`,
    )
  }

  return {
    batchNames,
    libraryLines,
    course: matches[0] || null,
  }
}

/**
 * 某课号所属批次名与课程库来源（去重；兼容旧调用）
 * @param {string} code 课程代码
 * @param {'en'|'zh'} [locale]
 * @returns {string[]}
 */
export function getCourseCodeSourceLines(code, locale = 'en') {
  const { batchNames, libraryLines } = getCourseCodeSourceParts(code, locale)
  const lines = []
  const n = Math.max(batchNames.length, libraryLines.length)
  for (let i = 0; i < n; i += 1) {
    if (batchNames[i]) lines.push(batchNames[i])
    if (libraryLines[i]) lines.push(libraryLines[i])
  }
  return lines
}
