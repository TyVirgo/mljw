/**
 * 白名单课+教学班引用（未来必修 / 换组清单）
 */

/** @typedef {{ courseCode: string, sectionCode: string }} WhitelistSectionRef */

/**
 * @param {WhitelistSectionRef|object|null|undefined} ref
 * @returns {string}
 */
export function whitelistSectionRefKey(ref) {
  if (!ref) return ''
  const code = String(ref.courseCode || ref.code || '')
    .trim()
    .toUpperCase()
  const sec = String(ref.sectionCode || ref.section || '')
    .trim()
  if (!code || !sec) return ''
  return `${code}::${sec}`
}

/**
 * @param {string} key
 * @returns {WhitelistSectionRef|null}
 */
export function parseWhitelistSectionRefKey(key) {
  const raw = String(key || '')
  const idx = raw.indexOf('::')
  if (idx <= 0) return null
  const courseCode = raw.slice(0, idx).trim().toUpperCase()
  const sectionCode = raw.slice(idx + 2).trim()
  if (!courseCode || !sectionCode) return null
  return { courseCode, sectionCode }
}

/**
 * @param {WhitelistSectionRef[]} list
 * @returns {WhitelistSectionRef[]}
 */
export function normalizeWhitelistSectionRefs(list) {
  const out = []
  const seen = new Set()
  for (const item of list || []) {
    const key = whitelistSectionRefKey(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const parsed = parseWhitelistSectionRefKey(key)
    if (parsed) out.push(parsed)
  }
  return out
}

/**
 * @param {WhitelistSectionRef[]} list
 * @param {string} courseCode
 * @param {string} sectionCode
 */
export function whitelistSectionListIncludes(list, courseCode, sectionCode) {
  const key = whitelistSectionRefKey({ courseCode, sectionCode })
  if (!key) return false
  return normalizeWhitelistSectionRefs(list).some((r) => whitelistSectionRefKey(r) === key)
}

/**
 * @param {WhitelistSectionRef} ref
 * @returns {string}
 */
export function formatWhitelistSectionTag(ref) {
  const code = String(ref?.courseCode || '').trim()
  const sec = String(ref?.sectionCode || '').trim()
  if (!code) return ''
  if (!sec) return code
  return `${code} · ${sec}`
}
