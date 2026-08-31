/**
 * 第一轮结果发布时间：倒计时、自动锁定、学生端公示同步
 */
import { registrationBatches, isResultDemoBatch } from './registrationBatches.js'
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

const MS_DAY = 24 * 60 * 60 * 1000
const MS_HOUR = 60 * 60 * 1000

/** 格式化 `dd/mm/yyyy hh:mm:ss` */
export function formatResultReleaseDisplay(raw) {
  const at = parseResultReleaseAt(raw)
  if (!at) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(at.getDate())}/${pad(at.getMonth() + 1)}/${at.getFullYear()} ${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`
}

/**
 * @param {string} batchId
 * @param {number} [nowMs]
 * @returns {{ released: boolean, atMs: number|null, remainingMs: number, days: number, hours: number }}
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
 * 按管理端已保存名单的选上/未选上标记，同步 demo 学生公示结果
 * @param {string} batchId
 */
export function syncStudentVolunteerResultsFromAdminRoster(batchId) {
  if (!batchId) return

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

  upsertVolunteerSheet(batchId, {
    results,
    releaseMode: 'released',
  })

  if (volunteerOrderSnapshot.value?.batchId === batchId) {
    volunteerReleaseResults.value = results
    demoVolunteerReleaseMode.value = 'released'
  }
}

/**
 * 到点自动锁定：写 volunteerFinalConfirmedAt + 同步学生端
 * @param {string} batchId
 * @param {{ force?: boolean }} [opts]
 * @returns {{ ok: boolean, already?: boolean }}
 */
export function autoLockVolunteerBatchAtRelease(batchId, opts = {}) {
  if (!batchId) return { ok: false }
  const index = registrationBatches.value.findIndex((b) => b.id === batchId)
  if (index === -1) return { ok: false }
  const batch = registrationBatches.value[index]
  if (batch.volunteerFinalConfirmedAt) return { ok: true, already: true }
  if (isResultDemoBatch(batchId) && batch.demoResultReleaseFixed && !batch.demoResultReleaseFixed.released) {
    return { ok: false }
  }

  const countdown = getBatchReleaseCountdown(batchId)
  if (!opts.force && !countdown.released) return { ok: false }

  // 丢弃未保存草稿，避免锁定后仍显示 dirty
  volunteerCourseStates.value = volunteerCourseStates.value.map((state) => {
    if (state.batchId !== batchId) return state
    return {
      ...state,
      pendingDraftVolunteers: null,
      dirty: false,
    }
  })

  const at = new Date().toISOString()
  registrationBatches.value[index] = {
    ...batch,
    volunteerFinalConfirmedAt: at,
  }

  syncStudentVolunteerResultsFromAdminRoster(batchId)
  return { ok: true, already: false }
}

/**
 * 扫描全部批次，对已到公布时间且未锁定的批次执行自动锁定
 * @returns {string[]} 本次锁定的 batchId 列表
 */
export function tickAutoLockVolunteerBatchesAtRelease(nowMs = Date.now()) {
  const locked = []
  for (const batch of registrationBatches.value) {
    if (batch.volunteerFinalConfirmedAt) continue
    if (isResultDemoBatch(batch.id) && batch.demoResultReleaseFixed && !batch.demoResultReleaseFixed.released) {
      continue
    }
    const cd = getBatchReleaseCountdown(batch.id, nowMs)
    if (!cd.atMs || !cd.released) continue
    const result = autoLockVolunteerBatchAtRelease(batch.id, { force: true })
    if (result.ok && !result.already) locked.push(batch.id)
  }
  return locked
}
