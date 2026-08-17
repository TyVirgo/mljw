import { ref } from 'vue'
import {
  listAdminAddStudentCandidates,
  filterAdminAddStudentCandidates,
  getAdminAddStudentFilterOptions,
} from './registrationResult.js'

/** @deprecated 保留兼容；真相源为 permissions */
export const supplementListTypes = ['supplement']

export const SUPPLEMENT_INVITE_HOURS = 24
export const SUPPLEMENT_MAX_INVITE_ATTEMPTS = 2

/** 白名单权限 key */
export const WHITELIST_PERMISSION_KEYS = [
  'supplement',
  'canAdd',
  'canDrop',
  'canRetake',
  'bypassPrerequisite',
  'bypassCreditMax',
  'bypassCreditMin',
]

export const INVITE_GATED_PERMISSION_KEYS = ['supplement', 'canAdd', 'canDrop', 'canRetake']

function formatInviteStamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function parseInviteStamp(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] || 0),
    )
  }
  const t = Date.parse(raw)
  return Number.isNaN(t) ? null : new Date(t)
}

export function createPermission(key, overrides = {}) {
  return {
    key,
    enabled: true,
    validHours: SUPPLEMENT_INVITE_HOURS,
    validUntil: null,
    inviteAttempt: 0,
    inviteSentAt: null,
    deadlineAt: null,
    courseCodes: [],
    ...overrides,
  }
}

function buildPermissionsFromLegacyFlags(item) {
  const perms = []
  const rowAttempt = Number(item.inviteAttempt) || 0
  const rowSent = item.inviteSentAt || null
  const rowDeadline = item.deadlineAt || null

  perms.push(
    createPermission('supplement', {
      enabled: true,
      inviteAttempt: rowAttempt,
      inviteSentAt: rowSent,
      deadlineAt: rowDeadline,
    }),
  )
  if (item.canAdd) {
    perms.push(
      createPermission('canAdd', {
        inviteAttempt: rowAttempt,
        inviteSentAt: rowSent,
        deadlineAt: rowDeadline,
      }),
    )
  }
  if (item.canDrop) {
    perms.push(
      createPermission('canDrop', {
        inviteAttempt: rowAttempt,
        inviteSentAt: rowSent,
        deadlineAt: rowDeadline,
      }),
    )
  }
  if (item.canRetake) {
    perms.push(
      createPermission('canRetake', {
        inviteAttempt: rowAttempt,
        inviteSentAt: rowSent,
        deadlineAt: rowDeadline,
      }),
    )
  }
  if (item.bypassPrerequisite) {
    perms.push(
      createPermission('bypassPrerequisite', {
        validHours: null,
        validUntil: item.prereqValidUntil || null,
        courseCodes: item.prereqCourseCodes || [],
      }),
    )
  }
  if (item.bypassCreditMax) {
    perms.push(createPermission('bypassCreditMax', { validHours: null, validUntil: null }))
  }
  if (item.bypassCreditMin) {
    perms.push(createPermission('bypassCreditMin', { validHours: null, validUntil: null }))
  }
  return perms
}

function syncLegacyFlags(entry) {
  const perms = entry.permissions || []
  const has = (key) => perms.some((p) => p.key === key && p.enabled !== false)
  const supplement = perms.find((p) => p.key === 'supplement')
  return {
    ...entry,
    listType: 'supplement',
    canAdd: has('canAdd'),
    canDrop: has('canDrop'),
    canRetake: has('canRetake'),
    bypassPrerequisite: has('bypassPrerequisite'),
    bypassCreditMax: has('bypassCreditMax'),
    bypassCreditMin: has('bypassCreditMin'),
    inviteAttempt: Number(supplement?.inviteAttempt) || Number(entry.inviteAttempt) || 0,
    inviteSentAt: supplement?.inviteSentAt || entry.inviteSentAt || null,
    deadlineAt: supplement?.deadlineAt || entry.deadlineAt || null,
    lastEmailMockAt: entry.lastEmailMockAt || supplement?.inviteSentAt || null,
  }
}

/** 规范化白名单行（迁移旧字段 → permissions） */
export function normalizeWhitelistEntry(item) {
  const base = {
    inviteAttempt: 0,
    inviteSentAt: null,
    deadlineAt: null,
    lastEmailMockAt: null,
    ...item,
  }
  if (!Array.isArray(base.permissions) || !base.permissions.length) {
    base.permissions = buildPermissionsFromLegacyFlags(base)
  }
  return syncLegacyFlags(base)
}

/**
 * 权限是否在有效期内
 * - 未发过邀请且无 validUntil：视为未激活邀请门（invite-gated）或长期有效（非 gated）
 */
export function isPermissionActive(perm, now = new Date()) {
  if (!perm || perm.enabled === false) return false

  if (perm.validUntil) {
    const until = parseInviteStamp(perm.validUntil)
    if (until && now > until) return false
    // 有截止日且未过期：若从未邀请，对非邀请门权限仍有效；邀请门需已发送
    if (INVITE_GATED_PERMISSION_KEYS.includes(perm.key)) {
      const attempt = Number(perm.inviteAttempt) || 0
      if (attempt <= 0) return true // 兼容旧数据：未邀请前仍开门
      if (perm.deadlineAt) {
        const deadline = parseInviteStamp(perm.deadlineAt)
        if (deadline && now > deadline) return false
      }
    }
    return true
  }

  const attempt = Number(perm.inviteAttempt) || 0
  if (attempt <= 0 || !perm.deadlineAt) {
    // 未邀请：邀请门兼容旧「在名单即开门」；其它同
    return true
  }
  const deadline = parseInviteStamp(perm.deadlineAt)
  if (!deadline) return true
  return now <= deadline
}

export function getPermission(entry, key) {
  if (!entry) return null
  const normalized = normalizeWhitelistEntry(entry)
  return (normalized.permissions || []).find((p) => p.key === key) || null
}

export function entryHasActivePermission(entry, key, now = new Date()) {
  const perm = getPermission(entry, key)
  return isPermissionActive(perm, now)
}

/** 先修豁免：仅加课申请路径使用 */
export function hasWhitelistPrerequisiteBypass(studentId, courseCode = '', now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return false
  const perm = getPermission(entry, 'bypassPrerequisite')
  if (!isPermissionActive(perm, now)) return false
  const codes = perm.courseCodes || []
  if (!codes.length) return true
  if (!courseCode) return true
  return codes.map((c) => String(c).toUpperCase()).includes(String(courseCode).toUpperCase())
}

const initialSupplementList = [
  {
    id: 'sup-001',
    studentId: 'COS2504015',
    studentName: 'Tan Mei Ling',
    programme: 'COS',
    intake: '2025/04',
    addedAt: '10-Sep-2025',
    addedBy: 'AC COS',
    source: 'registration-monitor',
    remark: '新生学分不足例外：补注册+加课',
    permissions: [
      createPermission('supplement'),
      createPermission('canAdd'),
    ],
  },
  {
    id: 'sup-002',
    studentId: 'DSA2504002',
    studentName: 'Lee Wei Ming',
    programme: 'DSA',
    intake: '2025/04',
    addedAt: '09-Sep-2025',
    addedBy: 'AC DSA',
    source: 'manual',
    remark: '学分不足，开放加退课申请',
    permissions: [
      createPermission('supplement'),
      createPermission('canAdd'),
      createPermission('canDrop'),
      createPermission('canRetake'),
    ],
  },
  {
    id: 'sup-003',
    studentId: 'XMUM2309001',
    studentName: 'Tan Wei Ming',
    programme: 'SWE',
    intake: '2023/09',
    addedAt: '12-Sep-2025',
    addedBy: 'AC Demo',
    source: 'manual',
    remark: '演示学生：窗口外也可申请',
    permissions: [
      createPermission('supplement'),
      createPermission('canAdd'),
      createPermission('canDrop'),
      createPermission('canRetake'),
    ],
  },
  {
    id: 'sup-004',
    studentId: 'DSA2409008',
    studentName: 'Raj Kumar',
    programme: 'DSA',
    intake: '2024/09',
    addedAt: '08-Sep-2025',
    addedBy: 'AC DSA',
    source: 'manual',
    remark: '末学期先修豁免加课（至学期末）',
    permissions: [
      createPermission('supplement'),
      createPermission('canAdd'),
      createPermission('bypassPrerequisite', {
        validHours: null,
        validUntil: '2026-01-31 17:00:00',
        courseCodes: ['COMP3192'],
      }),
    ],
  },
  {
    id: 'sup-005',
    studentId: 'AIT2409010',
    studentName: 'Siti Nurhaliza',
    programme: 'AIT',
    intake: '2024/09',
    addedAt: '05-Sep-2025',
    addedBy: 'AC AIT',
    source: 'manual',
    remark: '突破最高学分（演示）',
    permissions: [
      createPermission('supplement'),
      createPermission('canAdd'),
      createPermission('bypassCreditMax', { validHours: null, validUntil: '2026-01-31 17:00:00' }),
    ],
  },
].map((item) => normalizeWhitelistEntry(item))

export const supplementListQueue = ref(initialSupplementList.map((item) => ({ ...item })))

/** 别名：白名单队列 */
export const whitelistDoorQueue = supplementListQueue

let supplementSeq = 6

export function createSupplementId() {
  return `sup-${String(supplementSeq++).padStart(3, '0')}`
}

export function isStudentInSupplementList(studentId) {
  return supplementListQueue.value.some((item) => item.studentId === studentId)
}

export function getSupplementEntry(studentId) {
  const raw = supplementListQueue.value.find((item) => item.studentId === studentId)
  return raw ? normalizeWhitelistEntry(raw) : null
}

/**
 * 补注册/窗外门：依赖 supplement 权限时效
 */
export function getSupplementDoorStatus(studentId, now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return { ok: false, errorKey: 'courseRegistration.student.addDropWindowClosedShort' }

  const perm = getPermission(entry, 'supplement')
  if (!perm || perm.enabled === false) {
    return { ok: false, entry, errorKey: 'courseRegistration.student.addDropWindowClosedShort' }
  }

  const attempt = Number(perm.inviteAttempt) || 0
  if (attempt <= 0 || (!perm.deadlineAt && !perm.validUntil)) {
    return { ok: true, entry, via: 'whitelist-legacy' }
  }

  if (!isPermissionActive(perm, now)) {
    const needsManual = attempt >= SUPPLEMENT_MAX_INVITE_ATTEMPTS
    return {
      ok: false,
      entry,
      expired: true,
      needsManual,
      errorKey: needsManual
        ? 'courseRegistration.supplement.inviteNeedsManual'
        : 'courseRegistration.supplement.inviteExpired',
    }
  }
  return {
    ok: true,
    entry,
    via: 'whitelist-invite',
    deadlineAt: perm.deadlineAt || perm.validUntil,
  }
}

export function addStudentToSupplementList(student, options = {}) {
  if (!student?.studentId) return { ok: false, errorKey: 'courseRegistration.supplement.invalidStudent' }
  if (isStudentInSupplementList(student.studentId)) {
    return { ok: false, errorKey: 'courseRegistration.supplement.alreadyExists' }
  }

  let permissions = []
  if (options.permissions?.length) {
    permissions = options.permissions.map((p) =>
      createPermission(typeof p === 'string' ? p : p.key, typeof p === 'object' ? p : {}),
    )
  } else if (options.source === 'registration-monitor') {
    permissions = [
      createPermission('supplement'),
      createPermission('canAdd'),
      ...(options.canDrop ? [createPermission('canDrop')] : []),
      ...(options.canRetake ? [createPermission('canRetake')] : []),
    ]
  } else {
    permissions = [
      createPermission('supplement'),
      ...(options.canAdd !== false ? [createPermission('canAdd')] : []),
      ...(options.canDrop !== false ? [createPermission('canDrop')] : []),
      ...(options.canRetake !== false ? [createPermission('canRetake')] : []),
      ...(options.bypassPrerequisite ? [createPermission('bypassPrerequisite')] : []),
      ...(options.bypassCreditMax
        ? [createPermission('bypassCreditMax', { validHours: null, validUntil: null })]
        : []),
      ...(options.bypassCreditMin
        ? [createPermission('bypassCreditMin', { validHours: null, validUntil: null })]
        : []),
    ]
  }

  const item = normalizeWhitelistEntry({
    id: createSupplementId(),
    studentId: student.studentId,
    studentName: student.studentName,
    programme: student.programme,
    intake: student.intake,
    addedAt: new Date().toISOString().slice(0, 10),
    addedBy: options.addedBy || 'AC Demo',
    source: options.source || 'manual',
    remark: options.remark || '',
    permissions,
  })
  supplementListQueue.value.unshift(item)
  return { ok: true, item }
}

export function removeSupplementEntry(id) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  supplementListQueue.value.splice(index, 1)
  return { ok: true }
}

export function filterSupplementList(rows, filters = {}) {
  let list = rows.map((r) => normalizeWhitelistEntry(r))
  if (filters.programme) {
    list = list.filter((r) => r.programme.toLowerCase().includes(filters.programme.toLowerCase()))
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.studentId.toLowerCase().includes(kw) || r.studentName.toLowerCase().includes(kw),
    )
  }
  if (filters.permission) {
    list = list.filter((r) => (r.permissions || []).some((p) => p.key === filters.permission && p.enabled !== false))
  }
  return list
}

export function updateSupplementEntry(id, patch) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const current = normalizeWhitelistEntry(supplementListQueue.value[index])
  let next = { ...current, ...patch }

  if (patch.permissions) {
    next.permissions = patch.permissions.map((p) => createPermission(p.key, p))
  } else if (
    patch.canAdd !== undefined ||
    patch.canDrop !== undefined ||
    patch.canRetake !== undefined ||
    patch.bypassPrerequisite !== undefined ||
    patch.bypassCreditMax !== undefined ||
    patch.bypassCreditMin !== undefined ||
    patch.prereqValidUntil !== undefined ||
    patch.prereqCourseCodes !== undefined ||
    patch.permissionHours !== undefined
  ) {
    next.permissions = rebuildPermissionsFromForm(current, patch)
  }

  next = normalizeWhitelistEntry(next)
  supplementListQueue.value[index] = next
  return { ok: true, item: next }
}

function rebuildPermissionsFromForm(current, patch) {
  const hoursMap = patch.permissionHours || {}
  const untilMap = patch.permissionUntil || {}
  const flags = {
    supplement: true,
    canAdd: patch.canAdd ?? current.canAdd,
    canDrop: patch.canDrop ?? current.canDrop,
    canRetake: patch.canRetake ?? current.canRetake,
    bypassPrerequisite: patch.bypassPrerequisite ?? current.bypassPrerequisite,
    bypassCreditMax: patch.bypassCreditMax ?? current.bypassCreditMax,
    bypassCreditMin: patch.bypassCreditMin ?? current.bypassCreditMin,
  }
  const prevByKey = Object.fromEntries((current.permissions || []).map((p) => [p.key, p]))
  const list = []
  for (const key of WHITELIST_PERMISSION_KEYS) {
    if (!flags[key]) continue
    const prev = prevByKey[key] || {}
    const hours = hoursMap[key]
    const until = untilMap[key]
    list.push(
      createPermission(key, {
        ...prev,
        key,
        enabled: true,
        validHours: until ? null : hours != null ? Number(hours) : prev.validHours ?? SUPPLEMENT_INVITE_HOURS,
        validUntil: until || prev.validUntil || null,
        courseCodes:
          key === 'bypassPrerequisite'
            ? patch.prereqCourseCodes ?? prev.courseCodes ?? []
            : prev.courseCodes || [],
      }),
    )
  }
  if (!list.some((p) => p.key === 'supplement')) {
    list.unshift(createPermission('supplement', prevByKey.supplement || {}))
  }
  return list
}

function applyInviteToPermission(perm, attempt, now = new Date()) {
  const hours =
    perm.validHours != null && perm.validHours !== ''
      ? Number(perm.validHours)
      : SUPPLEMENT_INVITE_HOURS
  const sentAt = formatInviteStamp(now)
  let deadlineAt = null
  if (perm.validUntil) {
    deadlineAt = perm.validUntil
  } else {
    const deadline = new Date(now.getTime() + (Number.isFinite(hours) ? hours : 24) * 60 * 60 * 1000)
    deadlineAt = formatInviteStamp(deadline)
  }
  return {
    ...perm,
    inviteAttempt: attempt,
    inviteSentAt: sentAt,
    deadlineAt,
  }
}

function applyInviteWindow(entry, attempt, now = new Date()) {
  const normalized = normalizeWhitelistEntry(entry)
  const permissions = (normalized.permissions || []).map((perm) => {
    if (!INVITE_GATED_PERMISSION_KEYS.includes(perm.key)) return perm
    if (perm.enabled === false) return perm
    return applyInviteToPermission(perm, attempt, now)
  })
  const next = normalizeWhitelistEntry({
    ...normalized,
    permissions,
    lastEmailMockAt: formatInviteStamp(now),
  })
  return next
}

export function sendSupplementInvite(id, now = new Date()) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const entry = normalizeWhitelistEntry(supplementListQueue.value[index])
  const attempt = Number(getPermission(entry, 'supplement')?.inviteAttempt) || 0
  if (attempt >= 1) {
    return { ok: false, errorKey: 'courseRegistration.supplement.inviteAlreadySent' }
  }
  const next = applyInviteWindow(entry, 1, now)
  supplementListQueue.value[index] = next
  return { ok: true, item: next, emailMock: true }
}

export function reopenSupplementInvite(id, now = new Date()) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const entry = normalizeWhitelistEntry(supplementListQueue.value[index])
  const attempt = Number(getPermission(entry, 'supplement')?.inviteAttempt) || 0
  if (attempt < 1) {
    return { ok: false, errorKey: 'courseRegistration.supplement.inviteSendFirst' }
  }
  if (attempt >= SUPPLEMENT_MAX_INVITE_ATTEMPTS) {
    return { ok: false, errorKey: 'courseRegistration.supplement.inviteNeedsManual' }
  }
  const door = getSupplementDoorStatus(entry.studentId, now)
  if (door.ok) {
    return { ok: false, errorKey: 'courseRegistration.supplement.inviteStillActive' }
  }
  const next = applyInviteWindow(entry, attempt + 1, now)
  supplementListQueue.value[index] = next
  return { ok: true, item: next, emailMock: true }
}

export function markSupplementInviteExpired(id, now = new Date()) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const entry = normalizeWhitelistEntry(supplementListQueue.value[index])
  const attempt = Number(getPermission(entry, 'supplement')?.inviteAttempt) || 0
  if (attempt < 1) {
    return { ok: false, errorKey: 'courseRegistration.supplement.inviteSendFirst' }
  }
  const past = formatInviteStamp(new Date(now.getTime() - 60 * 1000))
  const permissions = (entry.permissions || []).map((perm) => {
    if (!INVITE_GATED_PERMISSION_KEYS.includes(perm.key)) return perm
    return { ...perm, deadlineAt: past }
  })
  const next = normalizeWhitelistEntry({ ...entry, permissions, deadlineAt: past })
  supplementListQueue.value[index] = next
  return { ok: true, item: next }
}

export function formatSupplementInviteCountdown(entry, now = new Date()) {
  const normalized = entry ? normalizeWhitelistEntry(entry) : null
  const deadlineRaw =
    getPermission(normalized, 'supplement')?.deadlineAt || normalized?.deadlineAt
  if (!deadlineRaw) return null
  const deadline = parseInviteStamp(deadlineRaw)
  if (!deadline) return null
  const ms = deadline.getTime() - now.getTime()
  if (ms <= 0) return { expired: true, label: '0h' }
  const hours = Math.floor(ms / (60 * 60 * 1000))
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  return { expired: false, hours, mins, deadlineAt: deadlineRaw, label: `${hours}h ${mins}m` }
}

/** 列表展示：权限摘要 */
export function formatPermissionSummary(entry, t) {
  const normalized = normalizeWhitelistEntry(entry)
  const labels = []
  for (const perm of normalized.permissions || []) {
    if (perm.enabled === false) continue
    const key = `courseRegistration.whitelist.perm.${perm.key}`
    const label = t ? t(key) : perm.key
    labels.push(typeof label === 'string' && label !== key ? label : perm.key)
  }
  return labels.join(' · ') || '—'
}

export function getEarliestPermissionDeadline(entry) {
  const normalized = normalizeWhitelistEntry(entry)
  let earliest = null
  for (const perm of normalized.permissions || []) {
    if (perm.enabled === false) continue
    const raw = perm.deadlineAt || perm.validUntil
    if (!raw) continue
    const d = parseInviteStamp(raw)
    if (!d) continue
    if (!earliest || d < earliest) earliest = d
  }
  return earliest ? formatInviteStamp(earliest) : null
}

/** 白名单新增选人：演示候选人池，排除已在名单者 */
export function listWhitelistPickCandidates(filters = {}) {
  const onList = new Set(supplementListQueue.value.map((r) => r.studentId))
  const all = listAdminAddStudentCandidates().filter((r) => !onList.has(r.studentId))
  return filterAdminAddStudentCandidates(all, filters)
}

export function getWhitelistPickFilterOptions() {
  return getAdminAddStudentFilterOptions()
}

export function formatWhitelistSourceLabel(source, t) {
  if (source === 'registration-monitor') {
    return t('courseRegistration.whitelist.sourceMonitor')
  }
  return t('courseRegistration.whitelist.sourceManual')
}
