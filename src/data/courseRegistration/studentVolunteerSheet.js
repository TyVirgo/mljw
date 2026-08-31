/**
 * 老生第一轮志愿：逐次提交进待分配 → 调序 → 我的选课确认锁死至公示
 */
import { computed, ref } from 'vue'
import { getActiveBatch, getBatchById, getStudentCurrentOpenRoundKey } from './registrationBatches.js'
import { getEffectiveAudienceRounds, AUDIENCE_SENIOR, DEMO_SENIOR_ROUNDS_202604 } from './audienceRounds.js'
import { getStudentAudience } from './studentAudience.js'
import { studentPendingAssignCourses } from './studentPendingAssignState.js'

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
 * 按 courseId 顺序重排待分配志愿（拖拽完成时）
 * @param {string[]} courseIds
 */
export function applyPendingVolunteerOrder(courseIds) {
  if (isVolunteerListLocked()) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.orderLocked' }
  }
  const batchId = getActiveBatch()?.id || ''
  const ids = (courseIds || []).filter(Boolean)
  if (!ids.length) return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.empty' }
  const map = new Map(sortedPendingVolunteers(batchId).map((row) => [row.courseId, row]))
  const next = []
  for (const id of ids) {
    const row = map.get(id)
    if (row) {
      next.push({ ...row })
      map.delete(id)
    }
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
export function confirmVolunteerPreferenceOrder() {
  if (preferenceOrderConfirmed.value) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.alreadyConfirmed' }
  }
  const batchId = getActiveBatch()?.id || ''
  const list = sortedPendingVolunteers(batchId)
  if (!list.length) {
    return { ok: false, errorKey: 'courseRegistration.student.volunteerSheet.empty' }
  }
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
 * demo：ME 五门 + GE 四门待分配未确认（ME：COMP201/SE201 周三互撞；NET110/AI110 避开 R2/R3 已确认硬撞）
 * 确认后可再切 demoVolunteerReleaseMode / volunteerReleaseResults 演示公示
 */
export function seedVolunteerSheetDemo() {
  const pending = [
    {
      id: 'pending-vol-course-comp201',
      courseId: 'course-comp201',
      courseCode: 'COMP201',
      courseName: '数据结构',
      courseNameEn: 'Data Structures',
      credits: 4,
      type: 'ME',
      sectionId: 'sec-2',
      sectionCode: '02',
      time: 'Wed 14:00–16:00',
      classTime: 'Wed 14:00–16:00',
      weekRange: '1-14',
      room: 'D5-3-202',
      lecturer: '陈博士',
      lecturerEn: 'Dr. Tan',
      batchId: 'batch-2504-m1',
      preferenceOrder: 1,
      selectedAt: '2026-04-01T09:00:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Wed 14:00–16:00', room: 'D5-3-202', weekRange: '1-14' }],
      schoolElectiveCategory: 'arts',
    },
    {
      id: 'pending-vol-course-net110',
      courseId: 'course-net110',
      courseCode: 'NET110',
      courseName: '计算机网络基础',
      courseNameEn: 'Computer Networks Basics',
      credits: 4,
      type: 'ME',
      sectionId: 'sec-net110-1',
      sectionCode: '01',
      time: 'Mon 13:00–15:00',
      classTime: 'Mon 13:00–15:00',
      weekRange: '1-18',
      room: 'D5-5-101',
      lecturer: '蔡博士',
      lecturerEn: 'Dr. Chai',
      batchId: 'batch-2504-m1',
      preferenceOrder: 2,
      selectedAt: '2026-04-01T09:05:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Mon 13:00–15:00', room: 'D5-5-101', weekRange: '1-18' }],
      schoolElectiveCategory: 'arts',
    },
    {
      id: 'pending-vol-course-se201',
      courseId: 'course-se201',
      courseCode: 'SE201',
      courseName: '软件工程导论',
      courseNameEn: 'Intro to Software Engineering',
      credits: 3,
      type: 'ME',
      sectionId: 'sec-se201-1',
      sectionCode: '01',
      time: 'Wed 14:00–16:00',
      classTime: 'Wed 14:00–16:00',
      weekRange: '1-14',
      room: 'D5-1-301',
      lecturer: '李博士',
      lecturerEn: 'Dr. Lee',
      batchId: 'batch-2504-m1',
      preferenceOrder: 3,
      selectedAt: '2026-04-01T09:10:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Wed 14:00–16:00', room: 'D5-1-301', weekRange: '1-14' }],
      schoolElectiveCategory: 'arts',
    },
    {
      id: 'pending-vol-course-ai110',
      courseId: 'course-ai110',
      courseCode: 'AI110',
      courseName: '人工智能基础',
      courseNameEn: 'Fundamentals of AI',
      credits: 3,
      type: 'ME',
      sectionId: 'sec-ai110-1',
      sectionCode: '01',
      time: 'Fri 14:00–16:00',
      classTime: 'Fri 14:00–16:00',
      weekRange: '1-14',
      room: 'D5-2-210',
      lecturer: '赵博士',
      lecturerEn: 'Dr. Zhao',
      batchId: 'batch-2504-m1',
      preferenceOrder: 4,
      selectedAt: '2026-04-01T09:15:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Fri 14:00–16:00', room: 'D5-2-210', weekRange: '1-14' }],
      schoolElectiveCategory: 'arts',
    },
    {
      id: 'pending-vol-course-web220',
      courseId: 'course-web220',
      courseCode: 'WEB220',
      courseName: 'Web 应用开发',
      courseNameEn: 'Web Application Development',
      credits: 4,
      type: 'ME',
      sectionId: 'sec-web220-2',
      sectionCode: '02',
      time: 'Thu 16:00–18:00',
      classTime: 'Thu 16:00–18:00',
      weekRange: '1-18',
      room: 'D5-3-105',
      lecturer: '黄博士',
      lecturerEn: 'Dr. Huang',
      batchId: 'batch-2504-m1',
      preferenceOrder: 5,
      selectedAt: '2026-04-01T09:20:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Thu 16:00–18:00', room: 'D5-3-105', weekRange: '1-18' }],
      schoolElectiveCategory: 'arts',
    },
  ]
  const gePending = [
    {
      id: 'pending-vol-course-hum-demo-1',
      courseId: 'course-hum-demo-1',
      courseCode: 'HUM201',
      courseName: 'Philosophy and Current Issues',
      courseNameEn: 'Philosophy and Current Issues',
      credits: 2,
      type: 'GE',
      sectionId: 'sec-hum-demo-1-1',
      sectionCode: '01',
      time: 'Thu 10:00–12:00',
      classTime: 'Thu 10:00–12:00',
      weekRange: '1-18',
      room: 'B2-2-201',
      lecturer: 'Dr. James Whitfield',
      lecturerEn: 'Dr. James Whitfield',
      batchId: 'batch-2504-g1',
      preferenceOrder: 1,
      selectedAt: '2026-04-01T09:00:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Thu 10:00–12:00', room: 'B2-2-201', weekRange: '1-18' }],
    },
    {
      id: 'pending-vol-course-hum-demo-2',
      courseId: 'course-hum-demo-2',
      courseCode: 'HUM202',
      courseName: 'Creative Arts Appreciation',
      courseNameEn: 'Creative Arts Appreciation',
      credits: 3,
      type: 'GE',
      sectionId: 'sec-hum-demo-2-1',
      sectionCode: '01',
      time: 'Mon 08:00–10:00',
      classTime: 'Mon 08:00–10:00',
      weekRange: '1-18',
      room: 'B2-2-201',
      lecturer: 'Dr. Emily Harrington',
      lecturerEn: 'Dr. Emily Harrington',
      batchId: 'batch-2504-g1',
      preferenceOrder: 2,
      selectedAt: '2026-04-01T09:05:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Mon 08:00–10:00', room: 'B2-2-201', weekRange: '1-18' }],
    },
    {
      id: 'pending-vol-course-hum-demo-3',
      courseId: 'course-hum-demo-3',
      courseCode: 'HUM203',
      courseName: 'Intercultural Communication',
      courseNameEn: 'Intercultural Communication',
      credits: 4,
      type: 'GE',
      sectionId: 'sec-hum-demo-3-1',
      sectionCode: '01',
      time: 'Fri 14:00–16:00',
      classTime: 'Fri 14:00–16:00',
      weekRange: '1-18',
      room: 'B2-2-201',
      lecturer: "Prof. Michael O'Brien",
      lecturerEn: "Prof. Michael O'Brien",
      batchId: 'batch-2504-g1',
      preferenceOrder: 3,
      selectedAt: '2026-04-01T09:10:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Fri 14:00–16:00', room: 'B2-2-201', weekRange: '1-18' }],
    },
    {
      id: 'pending-vol-course-hum-demo-4',
      courseId: 'course-hum-demo-4',
      courseCode: 'HUM204',
      courseName: 'Media Literacy',
      courseNameEn: 'Media Literacy',
      credits: 2,
      type: 'GE',
      sectionId: 'sec-hum-demo-4-1',
      sectionCode: '01',
      time: 'Thu 10:00–12:00',
      classTime: 'Thu 10:00–12:00',
      weekRange: '1-18',
      room: 'B2-2-201',
      lecturer: 'Dr. James Whitfield',
      lecturerEn: 'Dr. James Whitfield',
      batchId: 'batch-2504-g1',
      preferenceOrder: 4,
      selectedAt: '2026-04-01T09:15:00.000Z',
      sourceType: 'preselect',
      roundKey: 'preselect',
      meetings: [{ time: 'Thu 10:00–12:00', room: 'B2-2-201', weekRange: '1-18' }],
    },
  ]
  volunteerOrderSnapshot.value = null
  volunteerReleaseResults.value = []
  demoVolunteerReleaseMode.value = null
  volunteerSheetsByBatch.value = {}
  studentPendingAssignCourses.value = [...pending, ...gePending]
}

/**
 * demo：仅写入「结果页」按批快照（不锁死在线选课志愿）
 * - 主批：已公示五门成败（releaseMode 仅结果页认；在线课表 R1 不认）
 * - 另批：未到公布时间
 */
export function seedVolunteerResultSheetsDemo() {
  const releasedBatchId = 'batch-2504-m1'
  const releasedSnapshot = {
    confirmedAt: '2026-04-01T10:00:00.000Z',
    batchId: releasedBatchId,
    slots: [
      {
        slot: 1,
        item: {
          courseId: 'course-comp201',
          courseCode: 'COMP201',
          courseName: '数据结构',
          credits: 4,
          type: 'ME',
          sectionCode: '02',
          classTime: 'Wed 14:00–16:00',
          time: 'Wed 14:00–16:00',
          weekRange: '1-14',
          room: 'D5-3-202',
          lecturer: '陈博士',
          meetings: [{ time: 'Wed 14:00–16:00', room: 'D5-3-202', weekRange: '1-14' }],
        },
      },
      {
        slot: 2,
        item: {
          courseId: 'course-net110',
          courseCode: 'NET110',
          courseName: '计算机网络基础',
          credits: 4,
          type: 'ME',
          sectionCode: '01',
          classTime: 'Mon 10:00–12:00',
          time: 'Mon 10:00–12:00',
          weekRange: '1-18',
          room: 'D5-5-101',
          lecturer: '蔡博士',
          meetings: [{ time: 'Mon 10:00–12:00', room: 'D5-5-101', weekRange: '1-18' }],
        },
      },
      {
        slot: 3,
        item: {
          courseId: 'course-se201',
          courseCode: 'SE201',
          courseName: '软件工程导论',
          credits: 3,
          type: 'ME',
          sectionCode: '01',
          classTime: 'Wed 14:00–16:00',
          time: 'Wed 14:00–16:00',
          weekRange: '1-14',
          room: 'D5-1-301',
          lecturer: '李博士',
          meetings: [{ time: 'Wed 14:00–16:00', room: 'D5-1-301', weekRange: '1-14' }],
        },
      },
      {
        slot: 4,
        item: {
          courseId: 'course-ai110',
          courseCode: 'AI110',
          courseName: '人工智能基础',
          credits: 3,
          type: 'ME',
          sectionCode: '01',
          classTime: 'Fri 10:00–12:00',
          time: 'Fri 10:00–12:00',
          weekRange: '1-14',
          room: 'D5-2-210',
          lecturer: '赵博士',
          meetings: [{ time: 'Fri 10:00–12:00', room: 'D5-2-210', weekRange: '1-14' }],
        },
      },
      {
        slot: 5,
        item: {
          courseId: 'course-web220',
          courseCode: 'WEB220',
          courseName: 'Web 应用开发',
          credits: 4,
          type: 'ME',
          sectionCode: '02',
          classTime: 'Thu 16:00–18:00',
          time: 'Thu 16:00–18:00',
          weekRange: '1-18',
          room: 'D5-3-105',
          lecturer: '黄博士',
          meetings: [{ time: 'Thu 16:00–18:00', room: 'D5-3-105', weekRange: '1-18' }],
        },
      },
    ],
  }
  upsertVolunteerSheet(releasedBatchId, {
    snapshot: releasedSnapshot,
    results: [
      { slot: 1, courseId: 'course-comp201', status: 'hit' },
      { slot: 2, courseId: 'course-net110', status: 'miss' },
      { slot: 3, courseId: 'course-se201', status: 'miss' },
      { slot: 4, courseId: 'course-ai110', status: 'miss' },
      { slot: 5, courseId: 'course-web220', status: 'hit' },
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
}

/**
 * demo：已确认 + 五门公示结果（会锁死在线选课志愿；验收完整确认→公示链路时用）
 */
export function seedVolunteerReleasedDemo() {
  seedVolunteerSheetDemo()
  const result = confirmVolunteerPreferenceOrder()
  if (!result.ok) return
  const results = [
    { slot: 1, courseId: 'course-comp201', status: 'hit' },
    { slot: 2, courseId: 'course-net110', status: 'miss' },
    { slot: 3, courseId: 'course-se201', status: 'miss' },
    { slot: 4, courseId: 'course-ai110', status: 'miss' },
    { slot: 5, courseId: 'course-web220', status: 'hit' },
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
