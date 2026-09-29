import { ref } from 'vue'
import { initialDepartments } from '../departments.js'
import {
  AUDIENCE_SENIOR,
  cloneRounds,
  defaultAudienceRounds,
  DEMO_FRESHMAN_ROUNDS_202604,
  DEMO_SENIOR_ROUNDS_202604,
  ensureRoundsByAudience,
  setEffectiveAudienceRoundsResolver,
  syncLegacyRoundsFromAudience,
} from './audienceRounds.js'
import {
  defaultRound1Quota,
  defaultSessionRound1Quota,
  normalizeBatchMeQuota,
  normalizeSessionRound1Quota,
  setEffectiveRound1QuotaResolver,
} from './batchRound1Quota.js'
import { DEMO_ADD_DROP_WINDOW_OPEN_LONG } from './batchTermKind.js'

function cloneAddDrop(w = {}) {
  return { start: w?.start || '', end: w?.end || '' }
}

function cloneSessionRound1(q) {
  return normalizeSessionRound1Quota(q)
}

/** Demo：R3 窗内互释默认时刻（相对 2026 模板第三轮） */
export const DEMO_CROSS_RELEASE_AT_202604 = '29-Aug-2026 12:00:00'

function emptySchedule(academicSession = '') {
  return {
    id: '',
    academicSession,
    enabled: true,
    roundsByAudience: {
      senior: { ...defaultAudienceRounds(), resultReleaseAt: '' },
      freshman: defaultAudienceRounds(),
    },
    crossReleaseAt: '',
    round1Quota: defaultSessionRound1Quota(),
    addDropWindow: { start: '', end: '' },
  }
}

function shiftYearInDateValue(value, yearDelta) {
  if (!value || !yearDelta) return value || ''
  return String(value).replace(/\b(\d{4})\b/g, (y) => String(Number(y) + yearDelta))
}

function shiftRoundRange(range, yearDelta) {
  const r = cloneRounds(range)
  if (!yearDelta) return r
  return {
    preselect: {
      start: shiftYearInDateValue(r.preselect.start, yearDelta),
      end: shiftYearInDateValue(r.preselect.end, yearDelta),
    },
    main: {
      start: shiftYearInDateValue(r.main.start, yearDelta),
      end: shiftYearInDateValue(r.main.end, yearDelta),
    },
    supplement: {
      start: shiftYearInDateValue(r.supplement.start, yearDelta),
      end: shiftYearInDateValue(r.supplement.end, yearDelta),
    },
  }
}

function shiftRoundsByAudience(by, yearDelta) {
  const senior = shiftRoundRange(by?.senior, yearDelta)
  return {
    senior: {
      ...senior,
      resultReleaseAt: shiftYearInDateValue(by?.senior?.resultReleaseAt, yearDelta),
    },
    freshman: shiftRoundRange(by?.freshman, yearDelta),
  }
}

function shiftAddDropWindow(window, yearDelta) {
  const w = cloneAddDrop(window)
  if (!yearDelta) return w
  return {
    start: shiftYearInDateValue(w.start, yearDelta),
    end: shiftYearInDateValue(w.end, yearDelta),
  }
}

const DEMO_DATE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDemoDateValue(date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mmm = DEMO_DATE_MONTHS[date.getMonth()]
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${dd}-${mmm}-${yyyy} ${hh}:${mm}:${ss}`
}

function shiftDateValueByDays(value, dayDelta) {
  if (!value || !dayDelta) return value || ''
  const parsed = Date.parse(String(value).replace(/-/g, ' '))
  if (Number.isNaN(parsed)) return value
  return formatDemoDateValue(new Date(parsed + dayDelta * 86400000))
}

function shiftRoundRangeByDays(range, dayDelta) {
  const r = cloneRounds(range)
  if (!dayDelta) return r
  return {
    preselect: {
      start: shiftDateValueByDays(r.preselect.start, dayDelta),
      end: shiftDateValueByDays(r.preselect.end, dayDelta),
    },
    main: {
      start: shiftDateValueByDays(r.main.start, dayDelta),
      end: shiftDateValueByDays(r.main.end, dayDelta),
    },
    supplement: {
      start: shiftDateValueByDays(r.supplement.start, dayDelta),
      end: shiftDateValueByDays(r.supplement.end, dayDelta),
    },
  }
}

function shiftRoundsByAudienceByDays(by, dayDelta) {
  const senior = shiftRoundRangeByDays(by?.senior, dayDelta)
  return {
    senior: {
      ...senior,
      resultReleaseAt: shiftDateValueByDays(by?.senior?.resultReleaseAt, dayDelta),
    },
    freshman: shiftRoundRangeByDays(by?.freshman, dayDelta),
  }
}

const DEMO_TEMPLATE_ROUNDS = {
  senior: { ...DEMO_SENIOR_ROUNDS_202604 },
  freshman: { ...DEMO_FRESHMAN_ROUNDS_202604 },
}

/** 演示：2026/2025/2024 各三学期 */
export const DEMO_SESSION_GRID = [
  '2026/09',
  '2026/04',
  '2026/02',
  '2025/09',
  '2025/04',
  '2025/02',
  '2024/09',
  '2024/04',
  '2024/02',
]

function buildDemoSession(academicSession) {
  const year = Number(String(academicSession).split('/')[0])
  const yearDelta = year - 2026
  const sessionId = `sched-${String(academicSession).replace('/', '')}`
  return {
    id: sessionId,
    academicSession,
    enabled: true,
    roundsByAudience: shiftRoundsByAudience(DEMO_TEMPLATE_ROUNDS, yearDelta),
    crossReleaseAt: shiftYearInDateValue(DEMO_CROSS_RELEASE_AT_202604, yearDelta),
    round1Quota: defaultSessionRound1Quota(),
    addDropWindow: shiftAddDropWindow(DEMO_ADD_DROP_WINDOW_OPEN_LONG, yearDelta),
  }
}

export const sessionRegistrationSchedules = ref(DEMO_SESSION_GRID.map(buildDemoSession))

/** 单位覆盖课程类型：公共选修 / 专业选修 */
export const UNIT_SCHEDULE_COURSE_TYPES = ['GE', 'ME']

export function normalizeUnitCourseType(value) {
  const raw = String(value || '').trim().toUpperCase()
  return UNIT_SCHEDULE_COURSE_TYPES.includes(raw) ? raw : 'GE'
}

const DEMO_UNIT_OVERRIDE_CODES = ['CAMS', 'SASS', 'SCDS', 'SECE', 'SEEAI']
const DEMO_UNIT_OVERRIDE_SESSION = '2026/09'

function buildUnitOverrideDemo(unitCode, academicSession, courseType = 'GE', dayShift = 0) {
  const year = Number(String(academicSession).split('/')[0])
  const yearDelta = year - 2026
  const type = normalizeUnitCourseType(courseType)
  const base = shiftRoundsByAudience(DEMO_TEMPLATE_ROUNDS, yearDelta)
  // ME 相对 GE 再错开一天，便于演示双类型
  const typeShift = type === 'ME' ? (dayShift || 0) + 1 : dayShift
  const roundsByAudience = typeShift ? shiftRoundsByAudienceByDays(base, typeShift) : base
  const sessionCross = shiftYearInDateValue(DEMO_CROSS_RELEASE_AT_202604, yearDelta)
  return {
    id: `ov-unit-${String(unitCode).toLowerCase()}-${type.toLowerCase()}-${String(academicSession).replace('/', '')}`,
    unitCode,
    academicSession,
    courseType: type,
    roundsByAudience,
    crossReleaseAt: typeShift
      ? shiftDateValueByDays(sessionCross, typeShift)
      : sessionCross,
  }
}

/**
 * 学院单位覆盖：三轮包 + 可选互释时刻；按 (session, unit, courseType) 唯一
 * demo：2026/09 五学院 GE；CAMS/SCDS 另有 ME
 */
export const unitScheduleOverrides = ref([
  ...DEMO_UNIT_OVERRIDE_CODES.map((code, index) =>
    buildUnitOverrideDemo(code, DEMO_UNIT_OVERRIDE_SESSION, 'GE', index),
  ),
  buildUnitOverrideDemo('CAMS', DEMO_UNIT_OVERRIDE_SESSION, 'ME', 2),
  buildUnitOverrideDemo('SCDS', DEMO_UNIT_OVERRIDE_SESSION, 'ME', 3),
])

/** Demo：批次 faculty 文案 → 院系 code */
const FACULTY_UNIT_CODE_MAP = {
  'School of Information': 'SEEAI',
  'School of Business': 'SEM',
  'School of Computing': 'SCDS',
  'School of Energy and Chemical Engineering': 'SECE',
}

let schedSeq = 20
let unitOvSeq = 40

export function isSessionScheduleEnabled(sessionOrKey) {
  const session =
    typeof sessionOrKey === 'string' ? getSessionSchedule(sessionOrKey) : sessionOrKey
  if (!session) return false
  return session.enabled !== false
}

export function listUsedAcademicSessions() {
  return sessionRegistrationSchedules.value.map((s) => s.academicSession)
}

export function listUnitScheduleSchoolOptions(isZh = false) {
  return initialDepartments
    .filter((d) => d.category === 'School' && d.offering === 'Yes')
    .map((d) => ({
      code: d.code,
      label: `${d.code} · ${isZh ? d.nameZh : d.nameEn}`,
    }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

export function formatUnitLabel(unitCode, isZh = false) {
  const code = String(unitCode || '').trim()
  if (!code) return '—'
  const dept = initialDepartments.find((d) => d.code === code)
  if (!dept) return code
  return `${dept.code} · ${isZh ? dept.nameZh : dept.nameEn}`
}

export function resolveUnitCodeFromFaculty(faculty) {
  const key = String(faculty || '').trim()
  if (!key) return ''
  if (FACULTY_UNIT_CODE_MAP[key]) return FACULTY_UNIT_CODE_MAP[key]
  const byName = initialDepartments.find(
    (d) => d.nameEn === key || d.nameZh === key || d.code === key,
  )
  return byName?.code || ''
}

export function resolveUnitCodeFromBatch(batch) {
  if (!batch) return ''
  return resolveUnitCodeFromFaculty(batch.faculty || batch.unitCode || '')
}

export function listSessionSchedules() {
  return sessionRegistrationSchedules.value.map((s) => ({ ...s }))
}

export function getSessionSchedule(academicSession) {
  const key = String(academicSession || '').trim()
  if (!key) return null
  return sessionRegistrationSchedules.value.find((s) => s.academicSession === key) || null
}

export function upsertSessionSchedule(payload) {
  const session = String(payload.academicSession || '').trim()
  if (!session) return null
  const idx = sessionRegistrationSchedules.value.findIndex((s) => s.academicSession === session)
  const prev = idx >= 0 ? sessionRegistrationSchedules.value[idx] : null
  const next = {
    id: payload.id || prev?.id || `sched-${schedSeq++}`,
    academicSession: session,
    enabled: payload.enabled !== undefined ? payload.enabled !== false : prev ? prev.enabled !== false : true,
    roundsByAudience: {
      senior: {
        ...cloneRounds(payload.roundsByAudience?.senior),
        resultReleaseAt: payload.roundsByAudience?.senior?.resultReleaseAt || '',
      },
      freshman: cloneRounds(payload.roundsByAudience?.freshman),
    },
    crossReleaseAt: String(payload.crossReleaseAt || '').trim(),
    round1Quota: cloneSessionRound1(payload.round1Quota),
    addDropWindow: cloneAddDrop(payload.addDropWindow),
  }
  if (idx >= 0) {
    sessionRegistrationSchedules.value[idx] = next
  } else {
    sessionRegistrationSchedules.value.push(next)
  }
  return next
}

export function setSessionScheduleEnabled(academicSession, enabled) {
  const row = getSessionSchedule(academicSession)
  if (!row) return null
  return upsertSessionSchedule({ ...row, enabled: Boolean(enabled) })
}

export function removeSessionSchedule(academicSession) {
  const key = String(academicSession || '').trim()
  sessionRegistrationSchedules.value = sessionRegistrationSchedules.value.filter(
    (s) => s.academicSession !== key,
  )
  unitScheduleOverrides.value = unitScheduleOverrides.value.filter((o) => o.academicSession !== key)
}

export function listUnitOverridesForSession(academicSession) {
  const key = String(academicSession || '').trim()
  return unitScheduleOverrides.value
    .filter((o) => o.academicSession === key)
    .map((o) => ({ ...o, courseType: normalizeUnitCourseType(o.courseType) }))
    .sort((a, b) => {
      const u = String(a.unitCode).localeCompare(String(b.unitCode))
      if (u !== 0) return u
      return String(a.courseType).localeCompare(String(b.courseType))
    })
}

/**
 * @param {string} unitCode
 * @param {string} academicSession
 * @param {string} [courseType='GE']
 */
export function getUnitScheduleOverride(unitCode, academicSession, courseType = 'GE') {
  const code = String(unitCode || '').trim()
  const session = String(academicSession || '').trim()
  const type = normalizeUnitCourseType(courseType)
  if (!code || !session) return null
  return (
    unitScheduleOverrides.value.find(
      (o) =>
        o.unitCode === code &&
        o.academicSession === session &&
        normalizeUnitCourseType(o.courseType) === type,
    ) || null
  )
}

export function upsertUnitScheduleOverride(payload) {
  const unitCode = String(payload.unitCode || '').trim()
  const session = String(payload.academicSession || '').trim()
  const courseType = normalizeUnitCourseType(payload.courseType)
  if (!unitCode || !session) return null
  const idx = unitScheduleOverrides.value.findIndex(
    (o) =>
      o.unitCode === unitCode &&
      o.academicSession === session &&
      normalizeUnitCourseType(o.courseType) === courseType,
  )
  const next = {
    id: payload.id || (idx >= 0 ? unitScheduleOverrides.value[idx].id : `uov-${unitOvSeq++}`),
    unitCode,
    academicSession: session,
    courseType,
    roundsByAudience: {
      senior: {
        ...cloneRounds(payload.roundsByAudience?.senior),
        resultReleaseAt: payload.roundsByAudience?.senior?.resultReleaseAt || '',
      },
      freshman: cloneRounds(payload.roundsByAudience?.freshman),
    },
    crossReleaseAt: String(
      payload.crossReleaseAt !== undefined
        ? payload.crossReleaseAt
        : idx >= 0
          ? unitScheduleOverrides.value[idx].crossReleaseAt || ''
          : '',
    ).trim(),
  }
  if (idx >= 0) {
    unitScheduleOverrides.value[idx] = next
  } else {
    unitScheduleOverrides.value.push(next)
  }
  return next
}

export function removeUnitScheduleOverride(unitCode, academicSession, courseType = 'GE') {
  const code = String(unitCode || '').trim()
  const session = String(academicSession || '').trim()
  const type = normalizeUnitCourseType(courseType)
  unitScheduleOverrides.value = unitScheduleOverrides.value.filter(
    (o) =>
      !(
        o.unitCode === code &&
        o.academicSession === session &&
        normalizeUnitCourseType(o.courseType) === type
      ),
  )
}

function hasConfiguredSessionRounds(by) {
  if (!by?.senior) return false
  return Boolean(
    String(by.senior.preselect?.start || '').trim() &&
      String(by.senior.preselect?.end || '').trim() &&
      String(by.senior.resultReleaseAt || '').trim(),
  )
}

function hasConfiguredUnitRounds(by) {
  if (!by?.senior) return false
  return Boolean(
    String(by.senior.preselect?.start || '').trim() &&
      String(by.senior.preselect?.end || '').trim(),
  )
}

/**
 * 生效轮次：学期开启时 单位覆盖 > 学期全局；关闭则跳过学期与单位配置
 */
export function resolveEffectiveAudienceRounds(batch) {
  if (!batch) {
    return {
      senior: { ...defaultAudienceRounds(), resultReleaseAt: '' },
      freshman: defaultAudienceRounds(),
    }
  }
  const sessionKey = batch.academicSession || batch.semester || ''
  const session = getSessionSchedule(sessionKey)
  const sessionActive = isSessionScheduleEnabled(session)

  if (sessionActive) {
    const unitCode = resolveUnitCodeFromBatch(batch)
    const courseType = normalizeUnitCourseType(batch.type)
    const unitOv = unitCode ? getUnitScheduleOverride(unitCode, sessionKey, courseType) : null

    if (unitOv?.roundsByAudience && hasConfiguredUnitRounds(unitOv.roundsByAudience)) {
      const unitRelease = String(unitOv.roundsByAudience.senior?.resultReleaseAt || '').trim()
      const sessionRelease = session?.roundsByAudience?.senior?.resultReleaseAt || ''
      return {
        senior: {
          ...cloneRounds(unitOv.roundsByAudience.senior),
          resultReleaseAt: unitRelease || sessionRelease,
        },
        freshman: cloneRounds(unitOv.roundsByAudience.freshman),
      }
    }

    if (session?.roundsByAudience && hasConfiguredSessionRounds(session.roundsByAudience)) {
      return {
        senior: {
          ...cloneRounds(session.roundsByAudience.senior),
          resultReleaseAt: session.roundsByAudience.senior?.resultReleaseAt || '',
        },
        freshman: cloneRounds(session.roundsByAudience.freshman),
      }
    }
  }

  return ensureRoundsByAudience(batch)
}

export function resolveEffectiveRound1Quota(batch) {
  if (!batch) return { ...defaultSessionRound1Quota(), meQuotaRows: [] }
  const type = String(batch.type || 'GE').toUpperCase()
  const sessionKey = batch.academicSession || batch.semester || ''
  const session = getSessionSchedule(sessionKey)
  const defaults = defaultSessionRound1Quota()
  let decayR = defaults.decayR
  let graduateCapRatio = defaults.graduateCapRatio
  if (session && isSessionScheduleEnabled(session) && session.round1Quota) {
    const sessionQ = normalizeSessionRound1Quota(session.round1Quota)
    decayR = sessionQ.decayR
    graduateCapRatio = sessionQ.graduateCapRatio
  } else if (batch.round1Quota) {
    const batchQ = normalizeSessionRound1Quota(batch.round1Quota)
    if (Number(batch.round1Quota?.decayR) > 0) decayR = batchQ.decayR
    if (batch.round1Quota.graduateCapRatio != null) graduateCapRatio = batchQ.graduateCapRatio
  }
  if (type === 'ME') {
    const batchQuota = normalizeBatchMeQuota(batch.round1Quota, sessionKey)
    return {
      decayR,
      graduateCapRatio,
      totalCap: batchQuota.totalCap,
      meQuotaRows: batchQuota.meQuotaRows,
    }
  }
  return { decayR, graduateCapRatio, meQuotaRows: [] }
}

/**
 * 加退课窗：仅学期全局；关闭或未配置时 fallback 批上旧字段
 */
export function resolveEffectiveAddDropWindow(batchOrSession) {
  if (!batchOrSession) return { start: '', end: '' }
  if (typeof batchOrSession === 'string') {
    const s = getSessionSchedule(batchOrSession)
    if (s && isSessionScheduleEnabled(s)) {
      return cloneAddDrop(s.addDropWindow)
    }
    return { start: '', end: '' }
  }
  const sessionKey = batchOrSession.academicSession || batchOrSession.semester || ''
  const s = getSessionSchedule(sessionKey)
  if (s && isSessionScheduleEnabled(s) && s.addDropWindow && (s.addDropWindow.start || s.addDropWindow.end)) {
    return cloneAddDrop(s.addDropWindow)
  }
  return cloneAddDrop(batchOrSession.addDropWindow)
}

/**
 * R3 名额互释生效时刻：单位覆盖 > 学期全局（学期关闭则空）
 * @param {object|null|undefined} batch
 * @returns {string}
 */
export function resolveEffectiveCrossReleaseAt(batch) {
  if (!batch) return ''
  const sessionKey = batch.academicSession || batch.semester || ''
  const session = getSessionSchedule(sessionKey)
  if (!session || !isSessionScheduleEnabled(session)) return ''

  const unitCode = resolveUnitCodeFromBatch(batch)
  const courseType = normalizeUnitCourseType(batch.type)
  const unitOv = unitCode ? getUnitScheduleOverride(unitCode, sessionKey, courseType) : null
  const unitAt = String(unitOv?.crossReleaseAt || '').trim()
  if (unitAt) return unitAt

  return String(session.crossReleaseAt || '').trim()
}

export function formatSessionRoundsSummary(schedule, t) {
  if (!schedule) return '—'
  const senior = schedule.roundsByAudience?.senior
  const fmt = (r) => {
    if (!r?.start && !r?.end) return '—'
    return `${r.start || '—'} – ${r.end || '—'}`
  }
  void t
  return `R1 ${fmt(senior?.preselect)} · R2 ${fmt(senior?.main)} · R3 ${fmt(senior?.supplement)}`
}

export { emptySchedule, syncLegacyRoundsFromAudience, AUDIENCE_SENIOR }

setEffectiveAudienceRoundsResolver(resolveEffectiveAudienceRounds)
setEffectiveRound1QuotaResolver(resolveEffectiveRound1Quota)
