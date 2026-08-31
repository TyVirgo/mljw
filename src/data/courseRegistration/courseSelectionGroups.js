/**
 * 选课课程组（跨课程约束包）— 学生端展示用。
 * 开课侧配置挂在批次 selectionGroups；本期仅解析/排序/配色，不校验选满。
 */

/**
 * @typedef {{ id: string, name: string, nameEn: string, courseCodes: string[], minPick: number, intake?: string, groupLabel?: string, intakeLineZh?: string, intakeLineEn?: string }} SelectionGroup
 */

/**
 * @param {unknown} raw
 * @returns {SelectionGroup[]}
 */
export function normalizeSelectionGroups(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const g of raw) {
    if (!g || typeof g !== 'object') continue
    const id = String(g.id || '').trim()
    const codes = Array.isArray(g.courseCodes)
      ? g.courseCodes.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
      : []
    if (!id || !codes.length) continue
    const minRaw = Number(g.minPick)
    const minPick =
      Number.isFinite(minRaw) && minRaw > 0 ? Math.min(Math.floor(minRaw), codes.length) : 1
    out.push({
      id,
      name: String(g.name || id),
      nameEn: String(g.nameEn || g.name || id),
      courseCodes: codes,
      minPick,
      intake: g.intake ? String(g.intake) : undefined,
      groupLabel: g.groupLabel ? String(g.groupLabel) : undefined,
      intakeLineZh: g.intakeLineZh ? String(g.intakeLineZh) : undefined,
      intakeLineEn: g.intakeLineEn ? String(g.intakeLineEn) : undefined,
    })
  }
  return out
}

/**
 * @param {{ selectionGroups?: unknown } | null | undefined} batch
 * @returns {SelectionGroup[]}
 */
export function getSelectionGroupsForBatch(batch) {
  return normalizeSelectionGroups(batch?.selectionGroups)
}

/**
 * @param {{ code?: string } | null | undefined} course
 * @param {SelectionGroup[]} groups
 * @returns {SelectionGroup | null}
 */
export function resolveSelectionGroup(course, groups) {
  if (!course?.code || !groups?.length) return null
  const code = String(course.code).trim().toUpperCase()
  return groups.find((g) => g.courseCodes.includes(code)) || null
}

/**
 * 固定 2 色交替：按组在批次 selectionGroups 中的下标 % 2
 * @param {SelectionGroup | null | undefined} group
 * @param {SelectionGroup[]} groups
 * @returns {number} 0 | 1
 */
export function selectionGroupToneIndex(group, groups = []) {
  if (!group) return 0
  const idx = groups.findIndex((g) => g.id === group.id)
  return (idx < 0 ? 0 : idx) % 2
}

/**
 * Demo 组名：`Group{n}(Intake:{intake}~至今)`；chunks 为 { courseCodes, minPick }[]
 * @param {string} batchKey 批次短码，用于生成稳定 id
 * @param {string} intake 如 2025/09
 * @param {Array<{ courseCodes: string[], minPick: number }>} chunks
 * @returns {SelectionGroup[]}
 */
export function buildDemoSelectionGroups(batchKey, intake, chunks) {
  if (!Array.isArray(chunks)) return []
  const intakeLabel = String(intake || '2025/09').trim()
  return chunks.map((chunk, i) => {
    const n = i + 1
    const codes = Array.isArray(chunk?.courseCodes)
      ? chunk.courseCodes.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
      : []
    const minRaw = Number(chunk?.minPick)
    const minPick =
      Number.isFinite(minRaw) && minRaw > 0 ? Math.min(Math.floor(minRaw), codes.length || 1) : 1
    return {
      id: `${batchKey}-sg-${String(n).padStart(2, '0')}`,
      groupLabel: `Group${n}`,
      intakeLineZh: `(Intake:${intakeLabel}~至今)`,
      intakeLineEn: `(Intake:${intakeLabel}~Present)`,
      name: `Group${n}(Intake:${intakeLabel}~至今)`,
      nameEn: `Group${n}(Intake:${intakeLabel}~Present)`,
      courseCodes: codes,
      minPick,
      intake: intakeLabel,
    }
  })
}

/**
 * 课程组列两行：Group{n} + (Intake:…)
 * @param {SelectionGroup | null | undefined} group
 * @param {boolean} [isZh]
 */
export function getSelectionGroupDisplayLines(group, isZh = true) {
  if (!group) return { title: '', intakeLine: '' }
  if (group.groupLabel) {
    return {
      title: group.groupLabel,
      intakeLine: isZh ? group.intakeLineZh || '' : group.intakeLineEn || group.intakeLineZh || '',
    }
  }
  const source = isZh ? group.name : group.nameEn || group.name
  const match = String(source || '').match(/^(Group\d+)\((Intake:.+\))$/)
  if (match) {
    return { title: match[1], intakeLine: match[2] }
  }
  return { title: source, intakeLine: '' }
}

/**
 * 选课组备注文案（几选几）
 * @param {SelectionGroup | null | undefined} group
 * @param {(key: string, params?: Record<string, unknown>) => string} t
 */
export function formatSelectionGroupRemark(group, t) {
  if (!group?.courseCodes?.length) return '—'
  const total = group.courseCodes.length
  const min = group.minPick
  return t('courseRegistration.courses.selectionGroupRemark', { min, total })
}

/**
 * 有组行按组聚块 → 组内课号 → 分组号；无组行保持相对顺序并排在组块之后
 * @param {Array<{ course: { code?: string }, section?: { code?: string } | null, selectionGroup?: SelectionGroup | null }>} rows
 * @param {SelectionGroup[]} groups
 */
export function sortSectionRowsBySelectionGroup(rows, groups) {
  if (!Array.isArray(rows) || !rows.length || !groups?.length) return rows
  const groupOrder = new Map(groups.map((g, i) => [g.id, i]))
  const withGroup = []
  const without = []
  for (const row of rows) {
    if (row.selectionGroup) withGroup.push(row)
    else without.push(row)
  }
  withGroup.sort((a, b) => {
    const ga = groupOrder.get(a.selectionGroup.id) ?? 999
    const gb = groupOrder.get(b.selectionGroup.id) ?? 999
    if (ga !== gb) return ga - gb
    const ca = String(a.course?.code || '')
    const cb = String(b.course?.code || '')
    if (ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true })
    const ida = String(a.course?.id || ca)
    const idb = String(b.course?.id || cb)
    if (ida !== idb) return ida.localeCompare(idb)
    return String(a.section?.code || '').localeCompare(String(b.section?.code || ''), undefined, {
      numeric: true,
    })
  })
  without.sort((a, b) => {
    const ca = String(a.course?.code || '')
    const cb = String(b.course?.code || '')
    if (ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true })
    const ida = String(a.course?.id || ca)
    const idb = String(b.course?.id || cb)
    if (ida !== idb) return ida.localeCompare(idb)
    return String(a.section?.code || '').localeCompare(String(b.section?.code || ''), undefined, {
      numeric: true,
    })
  })
  return [...withGroup, ...without]
}
