/**
 * 老生第一轮志愿：逐次提交进待分配 → 调序 → 我的选课确认锁死至公示
 */
import { computed, ref } from 'vue'
import { getActiveBatch, getBatchById, getStudentCurrentOpenRoundKey } from './registrationBatches.js'
import { getEffectiveAudienceRounds, AUDIENCE_SENIOR, DEMO_SENIOR_ROUNDS_202604 } from './audienceRounds.js'
import { getStudentAudience } from './studentAudience.js'
import { studentPendingAssignCourses } from './studentPendingAssignState.js'
import { syncPendingAssignIntoVolunteerStates } from './preselectVolunteerConfirm.js'
import { buildSelectedRowFromCatalog } from './resolveSelectedCourseDisplay.js'
import { getPendingVolunteersHardConflictGate } from './volunteerPendingConflict.js'

/**
 * 已确认的志愿快照（确认后锁死；公示结果挂在此序上）
 * @type {import('vue').Ref<null | { confirmedAt: string, batchId: string, slots: Array<{ slot: number, item: object }> }>}
 */
export const volunteerOrderSnapshot = ref(null)

/** 顺序是否已确认（确认后至公示前不可改） */
export const preferenceOrderConfirmed = computed(() => Boolean(volunteerOrderSnapshot.value))

/**
 * 公示结果：与 snapshot 槽对齐
 * @type {import('vue').Ref<Array<{ slot: number, courseId: string, status: 'hit'|'miss' }>>}
 */
export const volunteerReleaseResults = ref([])

/** demo：强制公示状态 null=按时间 | 'waiting' | 'released'（作用于当前活跃快照批次） */
export const demoVolunteerReleaseMode = ref(null)

/**
 * 按批次缓存的志愿确认 + 公示结果（学生「第一轮志愿结果」切换批次用）
 * @type {import('vue').Ref<Record<string, {
 *   snapshot: { confirmedAt: string, batchId: string, slots: Array<{ slot: number, item: object }> },
 *   results: Array<{ slot: number, courseId: string, status: 'hit'|'miss' }>,
 *   releaseMode: null | 'waiting' | 'released',
 * }>>}
 */
export const volunteerSheetsByBatch = ref({})

/** @deprecated 兼容旧引用；不再限制槽数 */
export const MAX_VOLUNTEER_SLOTS = 99

/**
 * @param {string} batchId
 * @param {{ snapshot?: object, results?: Array, releaseMode?: null|string }} patch
 */
export function upsertVolunteerSheet(batchId, patch = {}) {
  if (!batchId) return
  const prev = volunteerSheetsByBatch.value[batchId] || {
    snapshot: null,
    results: [],
    releaseMode: null,
  }
  volunteerSheetsByBatch.value = {
    ...volunteerSheetsByBatch.value,
    [batchId]: {
      snapshot: patch.snapshot !== undefined ? patch.snapshot : prev.snapshot,
      results: patch.results !== undefined ? patch.results : prev.results,
      releaseMode: patch.releaseMode !== undefined ? patch.releaseMode : prev.releaseMode,
    },
  }
}

/** @param {string} batchId */
export function getVolunteerSheet(batchId) {
  if (!batchId) return null
  return volunteerSheetsByBatch.value[batchId] || null
}

/** 学生结果页可选批次（有确认志愿的批次） */
export function listVolunteerResultBatches() {
  return Object.keys(volunteerSheetsByBatch.value)
    .map((id) => getBatchById(id))
    .filter(Boolean)
}

export function resetVolunteerOrderState() {
  volunteerOrderSnapshot.value = null
  volunteerReleaseResults.value = []
  demoVolunteerReleaseMode.value = null
  volunteerSheetsByBatch.value = {}
}

/**
 * 解析结果发布时间
 * @param {string} raw
 */
export function parseResultReleaseAt(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  const en = text.match(
    /^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  )
  if (en) {
    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    }
    const mon = months[en[2]]
    if (mon == null) return null
    return new Date(
      Number(en[3]),
      mon,
      Number(en[1]),
      Number(en[4] || 0),
      Number(en[5] || 0),
      Number(en[6] || 0),
    )
  }
  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * @param {object} [batch]
 * @param {string} [audience]
 */
export function getResultReleaseAt(batch = getActiveBatch(), audience = getStudentAudience()) {
  const rounds = getEffectiveAudienceRounds(batch, audience)
  return rounds?.resultReleaseAt || batch?.resultReleaseAt || DEMO_SENIOR_ROUNDS_202604.resultReleaseAt || ''
}

/**
 * 是否已到公示时间（固定 demo：只认显式 releaseMode，不跟系统时钟）
 * @param {object} [batch]
 */
export function isVolunteerResultReleased(batch = getActiveBatch()) {
  const batchId = batch?.id || ''
  const sheet = getVolunteerSheet(batchId)
  if (sheet?.releaseMode === 'waiting') return false
  if (sheet?.releaseMode === 'released') return true
  const liveBatchId = volunteerOrderSnapshot.value?.batchId || ''
  if (!batchId || batchId === liveBatchId) {
    if (demoVolunteerReleaseMode.value === 'waiting') return false
    if (demoVolunteerReleaseMode.value === 'released') return true
  }
  // 不按 resultReleaseAt / Date.now 自动公示，避免固定 demo 日期把 R1 误锁
  return false
}

/** 确认后且未公示：列表锁死（已改为按轮次窗口 + 公示判定） */
export function isVolunteerListLocked(batch = getActiveBatch()) {
  // 在线选课锁只认全局 demo 公示；不认结果页按批 sheet.releaseMode（否则 m1 公示 demo 会误锁 R1 待分配）
  if (demoVolunteerReleaseMode.value === 'released') return true
  const audience = getStudentAudience()
  const openKey = getStudentCurrentOpenRoundKey(batch, audience)
  return openKey !== 'preselect'
}

function syncVolunteerOrderSnapshotFromPending(batchId = getActiveBatch()?.id || '') {
  const list = sortedPendingVolunteers(batchId)
  if (!list.length) {
    if (volunteerOrderSnapshot.value?.batchId === batchId) {
      volunteerOrderSnapshot.value = null
    }
    if (batchId) {
      const sheet = getVolunteerSheet(batchId)
      upsertVolunteerSheet(batchId, {
        snapshot: null,
        results: sheet?.results || [],
        releaseMode: sheet?.releaseMode ?? null,
      })
    }
    return
  }
  const renumbered = renumberPreferenceOrders(list)
  replacePendingForBatch(batchId, renumbered)
  const snapshot = {
    confirmedAt: volunteerOrderSnapshot.value?.confirmedAt || new Date().toISOString(),
    batchId,
    slots: renumbered.map((item, index) => ({
      slot: index + 1,
      item: { ...item },
    })),
  }
  volunteerOrderSnapshot.value = snapshot
  const sheet = getVolunteerSheet(batchId)
  upsertVolunteerSheet(batchId, {
    snapshot,
    results: sheet?.results || [],
    releaseMode: sheet?.releaseMode ?? null,
  })
}

function pendingMatchesBatch(row, batchId) {
  if (!batchId) return true
  return String(row?.batchId || '') === String(batchId)
}

/**
 * 当前批次待分配志愿（按志愿次序）
 * @param {string} [batchId]
 */
export function sortedPendingVolunteers(batchId = getActiveBatch()?.id) {
  const list = (studentPendingAssignCourses.value || []).filter((row) =>
    pendingMatchesBatch(row, batchId),
  )
  return [...list].sort(
    (a, b) => (Number(a.preferenceOrder) || 0) - (Number(b.preferenceOrder) || 0),
  )
}

function replacePendingForBatch(batchId, nextForBatch) {
  const others = (studentPendingAssignCourses.value || []).filter(
    (row) => !pendingMatchesBatch(row, batchId),
  )
  studentPendingAssignCourses.value = [...others, ...nextForBatch]
}

export function renumberPreferenceOrders(list) {
  return list.map((item, index) => ({
    ...item,
    preferenceOrder: index + 1,
  }))
}

/**
 * 待分配追加时写入末尾次序（由 store 调用）
 * @param {object} item
 */
export function assignNextPreferenceOrder(item) {
  const batchId = item?.batchId || getActiveBatch()?.id || ''
  const max = sortedPendingVolunteers(batchId).reduce(
    (m, row) => Math.max(m, Number(row.preferenceOrder) || 0),
    0,
  )
  return { ...item, batchId: item?.batchId || batchId, preferenceOrder: max + 1 }
}

/**
 * 调序（仅未确认时）
 * @param {string} courseId
 * @param {'up'|'down'} direction
 */
export function movePendingVolunteerOrder(courseId, direction) {
  if (isVolunteerListLocked()) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.orderLocked' }
  }
  const batchId = getActiveBatch()?.id || ''
  const list = sortedPendingVolunteers(batchId)
  const idx = list.findIndex((row) => row.courseId === courseId)
  if (idx < 0) return { ok: false }
  const target = direction === 'up' ? idx - 1 : idx + 1
  if (target < 0 || target >= list.length) return { ok: false }
  const next = list.map((row) => ({ ...row }))
  const tmp = next[idx]
  next[idx] = next[target]
  next[target] = tmp
  replacePendingForBatch(batchId, renumberPreferenceOrders(next))
  return { ok: true }
}

/**
 * 待分配志愿行键（同课多分组可并存）
 * @param {{ courseId?: string, sectionId?: string, sectionCode?: string, section?: string }} row
 */
export function pendingVolunteerRowKey(row) {
  const courseId = String(row?.courseId || '')
  const section = String(row?.sectionId || row?.sectionCode || row?.section || '')
  return section ? `${courseId}::${section}` : courseId
}

/**
 * 按行键顺序重排待分配志愿（拖拽完成时）
 * @param {string[]} orderedKeys pendingVolunteerRowKey 列表（兼容旧版仅 courseId）
 */
export function applyPendingVolunteerOrder(orderedKeys) {
  if (isVolunteerListLocked()) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.orderLocked' }
  }
  const batchId = getActiveBatch()?.id || ''
  const keys = (orderedKeys || []).filter(Boolean)
  if (!keys.length) return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.empty' }
  const map = new Map(
    sortedPendingVolunteers(batchId).map((row) => [pendingVolunteerRowKey(row), row]),
  )
  const next = []
  for (const key of keys) {
    let row = map.get(key)
    if (!row && !String(key).includes('::')) {
      // 兼容旧调用：仅 courseId 时取该课剩余第一行
      for (const [k, v] of map.entries()) {
        if (k === key || k.startsWith(`${key}::`)) {
          row = v
          map.delete(k)
          break
        }
      }
    } else if (row) {
      map.delete(key)
    }
    if (row) next.push({ ...row })
  }
  // 未出现在排序列表中的（异常）追加末尾
  for (const row of map.values()) {
    next.push({ ...row })
  }
  replacePendingForBatch(batchId, renumberPreferenceOrders(next))
  syncVolunteerOrderSnapshotFromPending(batchId)
  return { ok: true, count: next.length }
}

/**
 * 本轮选课情况：确认当前志愿顺序（锁死至公示）
 */
/**
 * @param {{ required?: object[] }} [opts] required=必修底图；撞必修则不可确认
 */
export function confirmVolunteerPreferenceOrder(opts = {}) {
  if (preferenceOrderConfirmed.value) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.alreadyConfirmed' }
  }
  const batchId = getActiveBatch()?.id || ''
  const list = sortedPendingVolunteers(batchId)
  if (!list.length) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.empty' }
  }
  const hardGate = getPendingVolunteersHardConflictGate(list, opts.required || [])
  if (!hardGate.ok) return hardGate
  const renumbered = renumberPreferenceOrders(list)
  replacePendingForBatch(batchId, renumbered)
  const snapshot = {
    confirmedAt: new Date().toISOString(),
    batchId,
    slots: renumbered.map((item, index) => ({
      slot: index + 1,
      item: { ...item },
    })),
  }
  volunteerOrderSnapshot.value = snapshot
  // 确认后进入等待公示演示态（覆盖 released demo）
  if (demoVolunteerReleaseMode.value === 'released') {
    demoVolunteerReleaseMode.value = 'waiting'
  }
  volunteerReleaseResults.value = []
  upsertVolunteerSheet(batchId, {
    snapshot,
    results: [],
    releaseMode: demoVolunteerReleaseMode.value === 'waiting' ? 'waiting' : null,
  })
  return { ok: true, count: renumbered.length }
}

/** 待分配变更后同步快照（顺序即确认） */
export function syncVolunteerOrderAfterPendingChange(batchId) {
  syncVolunteerOrderSnapshotFromPending(batchId || getActiveBatch()?.id || '')
}

/**
 * 锁定期拦截追加/撤出
 */
export function assertVolunteerListEditable() {
  if (isVolunteerListLocked()) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.orderLocked' }
  }
  return { ok: true }
}

/**
 * 汇总/结果页：志愿行（含公示态）
 * @param {object} [batch]
 */
export function buildVolunteerResultRows(batch = getActiveBatch()) {
  const batchId = batch?.id || ''
  const sheet = getVolunteerSheet(batchId)
  const live = volunteerOrderSnapshot.value
  const snap =
    sheet?.snapshot ||
    (live?.batchId === batchId ? live : null) ||
    (!batchId && live ? live : null)
  if (!snap?.slots?.length) return []
  const released = isVolunteerResultReleased(batch)
  const resultList =
    sheet?.results ||
    (live?.batchId === batchId || (!batchId && live) ? volunteerReleaseResults.value : []) ||
    []
  const resultMap = new Map(
    (resultList || []).map((r) => [r.courseId || `slot-${r.slot}`, r.status]),
  )
  const academicSession = String(getBatchById(snap.batchId || batchId)?.academicSession || '').trim()
  return snap.slots
    .filter((s) => s.item?.courseId)
    .map((s) => {
      let status = 'waiting'
      if (released) {
        status =
          resultMap.get(s.item.courseId) ||
          resultMap.get(`slot-${s.slot}`) ||
          'miss'
      }
      return {
        courseId: s.item.courseId,
        code: s.item.courseCode || s.item.code,
        name: s.item.courseName || s.item.name,
        credits: s.item.credits,
        section: s.item.sectionCode || s.item.section || '—',
        lecturer: s.item.lecturer || '—',
        weekRange: s.item.weekRange || '—',
        time: s.item.classTime || s.item.time || '—',
        room: s.item.room || '—',
        meetings: s.item.meetings,
        batchId: snap.batchId || batchId,
        academicSession: academicSession || s.item.academicSession || '',
        preferenceOrder: s.slot,
        status,
        type: s.item.type,
        selectedAt: snap.confirmedAt || '—',
      }
    })
}

/**
 * demo：ME 三门 + GE 一门待分配未确认
 * ME：COMP201（4选3 未满）+ SE201/AI110（3选2 刚好满）
 * GE：仅 hum-demo-1（商 2 分）= R1 待分配；公布后同课进 DEMO 确认半池（preselect）
 * ME：志愿三门；中签 COMP201/AI110 同步写入确认半池；R2/R3 增量见 DEMO_ROUND_CONFIRMED_COURSES
 */
export function seedVolunteerSheetDemo() {
  const meSpecs = [
    {
      courseId: 'course-comp201',
      sectionId: 'sec-comp201-3',
      preferenceOrder: 1,
      selectedAt: '2026-04-01T09:00:00.000Z',
      batchId: 'batch-2504-m1',
    },
    {
      courseId: 'course-se201',
      sectionId: 'sec-se201-1',
      preferenceOrder: 2,
      selectedAt: '2026-04-01T09:10:00.000Z',
      batchId: 'batch-2504-m1',
    },
    {
      courseId: 'course-ai110',
      sectionId: 'sec-ai110-1',
      preferenceOrder: 3,
      selectedAt: '2026-04-01T09:15:00.000Z',
      batchId: 'batch-2504-m1',
    },
  ]
  const pending = meSpecs.map((spec) => buildSelectedRowFromCatalog(spec)).filter(Boolean)

  /**
   * GE：R1 默认只选一门（hum-demo-1 商 2 分），入口/顶栏学期 2/6 不满员
   */
  const geSpecs = [
    {
      courseId: 'course-hum-demo-1',
      sectionId: 'sec-hum-demo-1-1',
      preferenceOrder: 1,
      selectedAt: '2026-04-01T09:00:00.000Z',
      batchId: 'batch-2504-g1',
    },
  ]
  const gePending = geSpecs.map((spec) => buildSelectedRowFromCatalog(spec)).filter(Boolean)

  volunteerOrderSnapshot.value = null
  volunteerReleaseResults.value = []
  demoVolunteerReleaseMode.value = null
  volunteerSheetsByBatch.value = {}
  studentPendingAssignCourses.value = [...pending, ...gePending]
}

/**
 * demo：仅写入「结果页」按批快照（不锁死在线选课志愿）
 * - 主批：已公示三门成败（releaseMode 仅结果页认；在线课表 R1 不认）
 * - 另批：未到公布时间
 */
export function seedVolunteerResultSheetsDemo() {
  const releasedBatchId = 'batch-2504-m1'
  const releasedSpecs = [
    { courseId: 'course-comp201', sectionId: 'sec-comp201-3' },
    { courseId: 'course-se201', sectionId: 'sec-se201-1' },
    { courseId: 'course-ai110', sectionId: 'sec-ai110-1' },
  ]
  const releasedSlots = releasedSpecs
    .map((spec, i) => {
      const item = buildSelectedRowFromCatalog(spec)
      return item ? { slot: i + 1, item } : null
    })
    .filter(Boolean)
  const releasedSnapshot = {
    confirmedAt: '2026-04-01T10:00:00.000Z',
    batchId: releasedBatchId,
    slots: releasedSlots,
  }
  upsertVolunteerSheet(releasedBatchId, {
    snapshot: releasedSnapshot,
    results: [
      { slot: 1, courseId: 'course-comp201', status: 'hit' },
      { slot: 2, courseId: 'course-se201', status: 'miss' },
      { slot: 3, courseId: 'course-ai110', status: 'hit' },
    ],
    releaseMode: 'released',
  })

  const waitingBatchId = 'batch-me-cst-i'
  upsertVolunteerSheet(waitingBatchId, {
    snapshot: {
      confirmedAt: '2026-03-28T10:00:00.000Z',
      batchId: waitingBatchId,
      slots: [
        {
          slot: 1,
          item: {
            courseId: 'course-db101',
            courseCode: 'DB101',
            courseName: '数据库原理',
            courseNameEn: 'Database Principles',
            credits: 3,
            type: 'ME',
            sectionCode: '01',
            classTime: 'Tue 09:00–11:00',
            time: 'Tue 09:00–11:00',
            weekRange: '1-14',
            room: 'D5-2-201',
            lecturer: '林博士',
            lecturerEn: 'Dr. Lim',
            meetings: [{ time: 'Tue 09:00–11:00', room: 'D5-2-201', weekRange: '1-14' }],
          },
        },
        {
          slot: 2,
          item: {
            courseId: 'course-os201',
            courseCode: 'OS201',
            courseName: '操作系统',
            courseNameEn: 'Operating Systems',
            credits: 4,
            type: 'ME',
            sectionCode: '02',
            classTime: 'Thu 14:00–16:00',
            time: 'Thu 14:00–16:00',
            weekRange: '1-18',
            room: 'D5-4-105',
            lecturer: '王博士',
            lecturerEn: 'Dr. Wong',
            meetings: [{ time: 'Thu 14:00–16:00', room: 'D5-4-105', weekRange: '1-18' }],
          },
        },
      ],
    },
    results: [],
    releaseMode: 'waiting',
  })
}

/**
 * demo：在线选课可提交志愿（待分配未确认、未锁死）
 */
export function seedVolunteerRegisterDemo() {
  seedVolunteerSheetDemo()
  // 结果页按批快照与在线选课状态解耦，避免公示锁死提交
  seedVolunteerResultSheetsDemo()
  // 待分配志愿写入名单，退选时已选百分比可降
  syncPendingAssignIntoVolunteerStates()
}

/**
 * demo：已确认 + 三门公示结果（会锁死在线选课志愿；验收完整确认→公示链路时用）
 */
export function seedVolunteerReleasedDemo() {
  seedVolunteerSheetDemo()
  const result = confirmVolunteerPreferenceOrder()
  if (!result.ok) return
  const results = [
    { slot: 1, courseId: 'course-comp201', status: 'hit' },
    { slot: 2, courseId: 'course-se201', status: 'miss' },
    { slot: 3, courseId: 'course-ai110', status: 'hit' },
  ]
  volunteerReleaseResults.value = results
  demoVolunteerReleaseMode.value = 'released'
  studentPendingAssignCourses.value = []
  const liveBatchId = volunteerOrderSnapshot.value?.batchId || 'batch-2504-m1'
  upsertVolunteerSheet(liveBatchId, {
    snapshot: volunteerOrderSnapshot.value,
    results,
    releaseMode: 'released',
  })
  seedVolunteerResultSheetsDemo()
}

/** 是否 R1 志愿模式（老生 + 第一轮） */
export function shouldShowVolunteerSheetPanel(roundKey, audience = getStudentAudience()) {
  return audience === AUDIENCE_SENIOR && String(roundKey) === 'preselect'
}

// —— 兼容旧导出名（避免残留引用炸裂）——
/** @deprecated 使用 volunteerOrderSnapshot */
export const volunteerSubmittedSheet = volunteerOrderSnapshot

export function resetVolunteerDraft() {
  resetVolunteerOrderState()
}
