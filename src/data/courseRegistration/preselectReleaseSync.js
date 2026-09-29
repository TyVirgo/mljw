/**
 * 第一轮志愿结果：发布锁定 / 到点公示 / 自动调度 / 发布日志
 * 锁定 ≠ 公示：锁定定稿名单；学生端须等到公布时间 T 才展示
 */
import { ref } from 'vue'
import { registrationBatches, isResultDemoBatch, getBatchById, RESULT_DEMO_BATCH_IDS } from './registrationBatches.js'
import {
  demoVolunteerReleaseMode,
  getResultReleaseAt,
  getVolunteerSheet,
  parseResultReleaseAt,
  upsertVolunteerSheet,
  volunteerOrderSnapshot,
  volunteerReleaseResults,
} from './studentVolunteerSheet.js'
import { volunteerCourseStates } from './preselectVolunteerConfirm.js'
import { getCurrentStudent } from '../mockCurrentStudent.js'
import { getEffectiveAudienceRounds } from './audienceRounds.js'

const MS_DAY = 24 * 60 * 60 * 1000
const MS_HOUR = 60 * 60 * 1000
/** 自动发布窗口：公布时间前 1 小时 */
export const AUTO_PUBLISH_LEAD_MS = MS_HOUR

const TASK_NAME = '第一轮志愿结果发布'

/** @type {import('vue').Ref<object[]>} */
export const volunteerPublishLogs = ref([])

/** demo：自动首次失败标记 */
const autoFailedOnce = new Set()

let logSeq = 1

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 格式化 `dd/mm/yyyy hh:mm:ss` */
export function formatResultReleaseDisplay(raw) {
  const at = parseResultReleaseAt(raw)
  if (!at) return ''
  return `${pad2(at.getDate())}/${pad2(at.getMonth() + 1)}/${at.getFullYear()} ${pad2(at.getHours())}:${pad2(at.getMinutes())}:${pad2(at.getSeconds())}`
}

/**
 * @param {string} batchId
 * @param {number} [nowMs]
 */
export function getBatchReleaseCountdown(batchId, nowMs = Date.now()) {
  const batch = registrationBatches.value.find((b) => b.id === batchId)
  const raw = getResultReleaseAt(batch)
  const at = parseResultReleaseAt(raw)
  if (!batch || !raw || !at) {
    return { released: false, atMs: null, remainingMs: 0, days: 0, hours: 0 }
  }
  const atMs = at.getTime()
  const remainingMs = Math.max(0, atMs - nowMs)
  const released = nowMs >= atMs
  return {
    released,
    atMs,
    remainingMs,
    days: Math.floor(remainingMs / MS_DAY),
    hours: Math.floor((remainingMs % MS_DAY) / MS_HOUR),
  }
}

function isVolunteerSelected(row) {
  if (row?.selected != null) return Boolean(row.selected)
  return false
}

/**
 * 按管理端名单同步学生结果；reveal=false 时仅准备 waiting
 * @param {string} batchId
 * @param {{ reveal?: boolean }} [opts]
 */
export function syncStudentVolunteerResultsFromAdminRoster(batchId, opts = {}) {
  if (!batchId) return
  const reveal = Boolean(opts.reveal)

  const studentId = getCurrentStudent()?.studentId || getCurrentStudent()?.basicInfo?.studentId || ''
  const selectedByCourse = new Map()
  for (const state of volunteerCourseStates.value) {
    if (state.batchId !== batchId) continue
    for (const v of state.volunteers || []) {
      if (studentId && String(v.studentId) !== studentId) continue
      selectedByCourse.set(state.courseId, isVolunteerSelected(v))
    }
  }

  const sheet = getVolunteerSheet(batchId)
  const snap =
    sheet?.snapshot ||
    (volunteerOrderSnapshot.value?.batchId === batchId ? volunteerOrderSnapshot.value : null)

  let results = []
  if (snap?.slots?.length) {
    results = snap.slots
      .filter((s) => s.item?.courseId)
      .map((s) => ({
        slot: s.slot,
        courseId: s.item.courseId,
        status: selectedByCourse.get(s.item.courseId) ? 'hit' : 'miss',
      }))
  } else if (studentId) {
    let slot = 1
    for (const state of volunteerCourseStates.value) {
      if (state.batchId !== batchId) continue
      for (const v of state.volunteers || []) {
        if (String(v.studentId) !== studentId) continue
        results.push({
          slot,
          courseId: state.courseId,
          status: isVolunteerSelected(v) ? 'hit' : 'miss',
        })
        slot += 1
      }
    }
  }

  const releaseMode = reveal ? 'released' : 'waiting'
  upsertVolunteerSheet(batchId, {
    results,
    releaseMode,
  })

  if (volunteerOrderSnapshot.value?.batchId === batchId) {
    volunteerReleaseResults.value = results
    demoVolunteerReleaseMode.value = releaseMode
  }
}

/**
 * 老生 R1 结束时刻
 * @param {object} batch
 * @returns {number|null}
 */
export function getSeniorR1EndMs(batch) {
  if (!batch) return null
  const rounds = getEffectiveAudienceRounds(batch, 'senior')
  const end = rounds?.preselect?.end || ''
  const at = parseResultReleaseAt(end)
  return at ? at.getTime() : null
}

/**
 * 是否允许手动发布：R1 已结束且未锁定（demo 固定待公布批视为 R1 已结束）
 * @param {string} batchId
 * @param {number} [nowMs]
 */
export function canManualPublishVolunteerBatch(batchId, nowMs = Date.now()) {
  const batch = getBatchById(batchId)
  if (!batch) return false
  if (batch.volunteerFinalConfirmedAt) return false
  const fixed = batch.demoResultReleaseFixed
  if (fixed && !fixed.released) return true
  const r1End = getSeniorR1EndMs(batch)
  if (r1End == null) return false
  return nowMs >= r1End
}

function appendPublishLog(entry) {
  const row = {
    id: `vpub-log-${logSeq++}`,
    taskName: TASK_NAME,
    ...entry,
  }
  volunteerPublishLogs.value = [row, ...volunteerPublishLogs.value]
  return row
}

/**
 * @param {string} batchId
 */
export function listPublishLogsForBatch(batchId) {
  return volunteerPublishLogs.value.filter((l) => l.batchId === batchId)
}

/**
 * 发布锁定（手动或自动）
 * @param {string} batchId
 * @param {{ trigger: 'manual'|'auto', operatorId?: string, operatorName?: string, forceFail?: boolean }} opts
 */
export function lockVolunteerBatchPublish(batchId, opts = {}) {
  const trigger = opts.trigger || 'auto'
  const startedAt = nowIso()
  const t0 = Date.now()
  const batch = getBatchById(batchId)
  if (!batch) {
    return { ok: false, reason: 'not_found' }
  }

  const batchName = batch.name || batchId
  const operatorId = opts.operatorId || (trigger === 'manual' ? 'admin' : 'SYSTEM')
  const operatorName = opts.operatorName || (trigger === 'manual' ? 'Administrator' : 'SYSTEM')

  if (batch.volunteerFinalConfirmedAt) {
    appendPublishLog({
      batchId,
      batchName,
      triggerType: trigger,
      startedAt,
      finishedAt: nowIso(),
      durationMs: Date.now() - t0,
      status: 'success',
      operatorId,
      operatorName,
      message: '已锁定，跳过重复发布',
    })
    return { ok: true, already: true }
  }

  // demo：自动首次强制失败一次，便于日志可见
  if (
    trigger === 'auto' &&
    opts.forceFail !== false &&
    isResultDemoBatch(batchId) &&
    !autoFailedOnce.has(batchId)
  ) {
    autoFailedOnce.add(batchId)
    appendPublishLog({
      batchId,
      batchName,
      triggerType: 'auto',
      startedAt,
      finishedAt: nowIso(),
      durationMs: Date.now() - t0,
      status: 'failure',
      operatorId: 'SYSTEM',
      operatorName: 'SYSTEM',
      message: '自动调度暂未获取完整名单锁，将重试',
    })
    return { ok: false, reason: 'demo_retry' }
  }

  const countdown = getBatchReleaseCountdown(batchId)
  const revealNow = Boolean(countdown.released) || Boolean(batch.demoResultReleaseFixed?.released)

  volunteerCourseStates.value = volunteerCourseStates.value.map((state) => {
    if (state.batchId !== batchId) return state
    return {
      ...state,
      pendingDraftVolunteers: null,
      dirty: false,
    }
  })

  const at = new Date().toISOString()
  const index = registrationBatches.value.findIndex((b) => b.id === batchId)
  if (index < 0) return { ok: false, reason: 'not_found' }

  const next = {
    ...registrationBatches.value[index],
    volunteerFinalConfirmedAt: at,
    volunteerPublishTrigger: trigger,
  }
  if (next.demoResultReleaseFixed && !next.demoResultReleaseFixed.released) {
    next.demoResultReleaseFixed = {
      ...next.demoResultReleaseFixed,
      lockedPending: true,
    }
  }
  registrationBatches.value[index] = next

  syncStudentVolunteerResultsFromAdminRoster(batchId, { reveal: revealNow })

  const courseCount = volunteerCourseStates.value.filter((s) => s.batchId === batchId).length
  appendPublishLog({
    batchId,
    batchName,
    triggerType: trigger,
    startedAt,
    finishedAt: nowIso(),
    durationMs: Date.now() - t0,
    status: 'success',
    operatorId,
    operatorName,
    message: revealNow
      ? `锁定并公示成功，课程分组 ${courseCount} 个`
      : `锁定成功（待公示），课程分组 ${courseCount} 个`,
  })

  return { ok: true, already: false, revealNow }
}

/**
 * 手动发布
 * @param {string} batchId
 */
export function manualPublishVolunteerBatch(batchId) {
  if (!canManualPublishVolunteerBatch(batchId)) {
    return { ok: false, reason: 'not_allowed' }
  }
  return lockVolunteerBatchPublish(batchId, {
    trigger: 'manual',
    operatorId: 'admin',
    operatorName: 'Administrator',
  })
}

/**
 * 到点公示已锁定批次
 * @param {number} [nowMs]
 */
export function revealVolunteerBatchesIfDue(nowMs = Date.now()) {
  const revealed = []
  for (const batch of registrationBatches.value) {
    if (!batch.volunteerFinalConfirmedAt) continue
    const fixed = batch.demoResultReleaseFixed
    // demo 固定待公示：不按真实时钟强制 reveal
    if (fixed && fixed.lockedPending && !fixed.released) continue
    const cd = getBatchReleaseCountdown(batch.id, nowMs)
    if (!cd.atMs || !cd.released) continue
    const sheet = getVolunteerSheet(batch.id)
    if (sheet?.releaseMode === 'released') continue
    syncStudentVolunteerResultsFromAdminRoster(batch.id, { reveal: true })
    if (fixed) {
      const idx = registrationBatches.value.findIndex((b) => b.id === batch.id)
      if (idx >= 0) {
        registrationBatches.value[idx] = {
          ...registrationBatches.value[idx],
          demoResultReleaseFixed: {
            ...fixed,
            released: true,
            lockedPending: false,
          },
        }
      }
    }
    revealed.push(batch.id)
  }
  return revealed
}

/**
 * 自动调度：T−1h 起尝试锁定（已锁定则跳过，含手动优先）
 * @param {number} [nowMs]
 */
export function tickAutoPublishVolunteerBatches(nowMs = Date.now()) {
  const locked = []
  for (const batch of registrationBatches.value) {
    if (batch.volunteerFinalConfirmedAt) continue
    // demo 固定待公布：留给手动演示，不自动锁
    if (batch.demoResultReleaseFixed && !batch.demoResultReleaseFixed.released) continue
    const cd = getBatchReleaseCountdown(batch.id, nowMs)
    if (!cd.atMs) continue
    const windowOpenMs = cd.atMs - AUTO_PUBLISH_LEAD_MS
    if (nowMs < windowOpenMs) continue
    const result = lockVolunteerBatchPublish(batch.id, { trigger: 'auto' })
    if (result.ok && !result.already) locked.push(batch.id)
  }
  return locked
}

/**
 * 结果页轮询入口：先公示，再自动发布
 * @param {number} [nowMs]
 */
export function tickVolunteerResultPublish(nowMs = Date.now()) {
  revealVolunteerBatchesIfDue(nowMs)
  return tickAutoPublishVolunteerBatches(nowMs)
}

/** @deprecated 兼容旧名 */
export function autoLockVolunteerBatchAtRelease(batchId, opts = {}) {
  if (opts.force) {
    return lockVolunteerBatchPublish(batchId, { trigger: 'auto', forceFail: false })
  }
  const cd = getBatchReleaseCountdown(batchId)
  if (!cd.released) return { ok: false }
  return lockVolunteerBatchPublish(batchId, { trigger: 'auto', forceFail: false })
}

/** @deprecated 兼容旧名 */
export function tickAutoLockVolunteerBatchesAtRelease(nowMs = Date.now()) {
  return tickVolunteerResultPublish(nowMs)
}

/**
 * 灌种演示日志：结果页每个 demo 批次至少有记录（含 batch-2504-g2）
 */
export function ensureVolunteerPublishLogSeeded() {
  for (const batchId of RESULT_DEMO_BATCH_IDS) {
    if (volunteerPublishLogs.value.some((l) => l.batchId === batchId)) continue
    const batch = getBatchById(batchId)
    if (!batch) continue
    const batchName = batch.name || batchId
    const released =
      Boolean(batch.demoResultReleaseFixed?.released) || Boolean(batch.volunteerFinalConfirmedAt)

    if (released) {
      appendPublishLog({
        batchId,
        batchName,
        triggerType: 'auto',
        startedAt: '2026-08-18 18:05:12',
        finishedAt: '2026-08-18 18:05:14',
        durationMs: 2100,
        status: 'failure',
        operatorId: 'SYSTEM',
        operatorName: 'SYSTEM',
        message: '自动调度暂未获取完整名单锁，将重试',
      })
      appendPublishLog({
        batchId,
        batchName,
        triggerType: 'auto',
        startedAt: '2026-08-18 18:12:01',
        finishedAt: '2026-08-18 18:12:03',
        durationMs: 1800,
        status: 'success',
        operatorId: 'SYSTEM',
        operatorName: 'SYSTEM',
        message: '锁定并公示成功',
      })
    } else {
      appendPublishLog({
        batchId,
        batchName,
        triggerType: 'auto',
        startedAt: '2026-08-17 18:02:00',
        finishedAt: '2026-08-17 18:02:01',
        durationMs: 900,
        status: 'failure',
        operatorId: 'SYSTEM',
        operatorName: 'SYSTEM',
        message: '未到自动窗口或名单未就绪（演示）',
      })
    }
  }
}
