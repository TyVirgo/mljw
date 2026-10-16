import { ref } from 'vue'
import { formatIntakeBatch } from '../intakeSets.js'
import {
  ensureDateTimeWithSeconds,
  formatLocalDateTimeWithSeconds,
} from './registrationBatchFormUtils.js'
import {
  listAdminAddStudentCandidates,
  filterAdminAddStudentCandidates,
  getAdminAddStudentFilterOptions,
} from './registrationResult.js'
import { normalizeWhitelistSectionRefs } from './whitelistSectionRefs.js'

/** @deprecated 保留兼容；真相源为 permissions */
export const supplementListTypes = ['supplement']

export const SUPPLEMENT_INVITE_HOURS = 48
/** @deprecated 不再限制发送/再次开放次数；保留常量避免外部引用报错 */
export const SUPPLEMENT_MAX_INVITE_ATTEMPTS = Number.POSITIVE_INFINITY

/** 白名单添加时间展示/写入：YYYY-MM-DD HH:mm:ss（与审批提交时间一致） */
export function formatWhitelistAddedAt(value = new Date()) {
  if (value == null || value === '') return ''
  if (value instanceof Date) return formatLocalDateTimeWithSeconds(value)
  const ensured = ensureDateTimeWithSeconds(value)
  return ensured || String(value).trim()
}

/** 白名单权限 key */
export const WHITELIST_PERMISSION_KEYS = [
  'supplement',
  'canAdd',
  'canDrop',
  'canRetake',
  'bypassPrerequisite',
  'bypassCreditMax',
  'bypassCreditMin',
  'allowFutureMandatory',
  'allowFutureElective',
  'allowDropBelowCreditMin',
  'allowCoreSectionSwitchAdd',
  'allowCoreSectionSwitchRetake',
]

/** ME 课程组类别（与学期进度文案键一致） */
export const FUTURE_ELECTIVE_ME_CATEGORY_KEYS = [
  'group4of3',
  'group3of2',
  'group2of1',
  'ordinary',
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
  // 学年学期 YYYY/MM → 该月最后一天 23:59:59
  const session = raw.match(/^(\d{4})\/(\d{2})$/)
  if (session) {
    const y = Number(session[1])
    const mo = Number(session[2])
    if (y > 0 && mo >= 1 && mo <= 12) {
      return new Date(y, mo, 0, 23, 59, 59)
    }
  }
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
    const extra = Number(item.creditBypassExtra ?? item.extraCredits)
    perms.push(
      createPermission('bypassCreditMax', {
        validHours: null,
        validUntil: null,
        extraCredits: Number.isFinite(extra) && extra > 0 ? Math.min(3, Math.floor(extra)) : 3,
      }),
    )
  }
  if (item.bypassCreditMin) {
    perms.push(createPermission('bypassCreditMin', { validHours: null, validUntil: null }))
  }
  if (item.allowFutureMandatory) {
    perms.push(
      createPermission('allowFutureMandatory', {
        validHours: null,
        validUntil: null,
        sections: normalizeWhitelistSectionRefs(
          item.futureMandatorySections || item.sections || [],
        ),
      }),
    )
  }
  if (item.allowCoreSectionSwitchAdd) {
    perms.push(
      createPermission('allowCoreSectionSwitchAdd', {
        validHours: null,
        validUntil: null,
        sections: normalizeWhitelistSectionRefs(item.coreSectionSwitchAddSections || []),
      }),
    )
  }
  if (item.allowCoreSectionSwitchRetake) {
    perms.push(
      createPermission('allowCoreSectionSwitchRetake', {
        validHours: null,
        validUntil: null,
        sections: normalizeWhitelistSectionRefs(item.coreSectionSwitchRetakeSections || []),
      }),
    )
  }
  if (item.allowFutureElective) {
    perms.push(
      createPermission('allowFutureElective', {
        validHours: null,
        validUntil: null,
        geCredits: normalizePositiveCredits(item.futureElectiveGeCredits),
        meCredits: normalizePositiveCredits(item.futureElectiveMeCredits),
        meCategoryKeys: normalizeMeCategoryKeys(item.futureElectiveMeCategoryKeys),
      }),
    )
  }
  if (item.allowDropBelowCreditMin) {
    perms.push(createPermission('allowDropBelowCreditMin', { validHours: null, validUntil: null }))
  }
  return perms
}

function normalizePositiveCredits(raw, fallback = 1) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(30, Math.floor(n))
}

function normalizeMeCategoryKeys(raw) {
  const list = Array.isArray(raw) ? raw : []
  const allowed = new Set(FUTURE_ELECTIVE_ME_CATEGORY_KEYS)
  const out = []
  for (const k of list) {
    const key = String(k || '').trim()
    if (!allowed.has(key) || out.includes(key)) continue
    out.push(key)
  }
  return out
}

function syncLegacyFlags(entry) {
  const perms = entry.permissions || []
  const has = (key) => perms.some((p) => p.key === key && p.enabled !== false)
  const supplement = perms.find((p) => p.key === 'supplement')
  const maxPerm = perms.find((p) => p.key === 'bypassCreditMax' && p.enabled !== false)
  const extraRaw = Number(maxPerm?.extraCredits)
  const creditBypassExtra =
    Number.isFinite(extraRaw) && extraRaw > 0 ? Math.min(3, Math.floor(extraRaw)) : has('bypassCreditMax') ? 3 : 0
  return {
    ...entry,
    listType: 'supplement',
    supplement: has('supplement'),
    canAdd: has('canAdd'),
    canDrop: has('canDrop'),
    canRetake: has('canRetake'),
    bypassPrerequisite: has('bypassPrerequisite'),
    bypassCreditMax: has('bypassCreditMax'),
    bypassCreditMin: has('bypassCreditMin'),
    creditBypassExtra,
    allowFutureMandatory: has('allowFutureMandatory'),
    futureMandatorySections: normalizeWhitelistSectionRefs(
      perms.find((p) => p.key === 'allowFutureMandatory')?.sections,
    ),
    allowCoreSectionSwitchAdd: has('allowCoreSectionSwitchAdd'),
    coreSectionSwitchAddSections: normalizeWhitelistSectionRefs(
      perms.find((p) => p.key === 'allowCoreSectionSwitchAdd')?.sections,
    ),
    allowCoreSectionSwitchRetake: has('allowCoreSectionSwitchRetake'),
    coreSectionSwitchRetakeSections: normalizeWhitelistSectionRefs(
      perms.find((p) => p.key === 'allowCoreSectionSwitchRetake')?.sections,
    ),
    allowFutureElective: has('allowFutureElective'),
    allowDropBelowCreditMin: has('allowDropBelowCreditMin'),
    futureElectiveGeCredits: Number(
      perms.find((p) => p.key === 'allowFutureElective')?.geCredits,
    ) || 0,
    futureElectiveMeCredits: Number(
      perms.find((p) => p.key === 'allowFutureElective')?.meCredits,
    ) || 0,
    futureElectiveMeCategoryKeys: normalizeMeCategoryKeys(
      perms.find((p) => p.key === 'allowFutureElective')?.meCategoryKeys,
    ),
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

/** 课程豁免先修课：仅加课申请路径使用（须配置课号） */
export function hasWhitelistPrerequisiteBypass(studentId, courseCode = '', now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return false
  const perm = getPermission(entry, 'bypassPrerequisite')
  if (!isPermissionActive(perm, now)) return false
  const codes = perm.courseCodes || []
  if (!codes.length) return false
  if (!courseCode) return true
  return codes.map((c) => String(c).toUpperCase()).includes(String(courseCode).toUpperCase())
}

/** 允许添加未来学期必修课申请：仅加课申请选课池 */
export function hasWhitelistAllowFutureMandatory(studentId, now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return false
  return entryHasActivePermission(entry, 'allowFutureMandatory', now)
}

/** @returns {import('./whitelistSectionRefs.js').WhitelistSectionRef[]} */
export function getWhitelistFutureMandatorySections(studentId, now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return []
  const perm = getPermission(entry, 'allowFutureMandatory')
  if (!isPermissionActive(perm, now)) return []
  return normalizeWhitelistSectionRefs(perm.sections)
}

/**
 * @param {'add'|'retake'} kind
 * @returns {import('./whitelistSectionRefs.js').WhitelistSectionRef[]}
 */
export function getWhitelistCoreSectionSwitchSections(studentId, kind = 'add', now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return []
  const key =
    kind === 'retake' ? 'allowCoreSectionSwitchRetake' : 'allowCoreSectionSwitchAdd'
  const perm = getPermission(entry, key)
  if (!isPermissionActive(perm, now)) return []
  return normalizeWhitelistSectionRefs(perm.sections)
}

export function hasWhitelistCoreSectionSwitch(studentId, kind = 'add', now = new Date()) {
  return getWhitelistCoreSectionSwitchSections(studentId, kind, now).length > 0
}

/** 允许添加未来学期选修课申请 */
export function hasWhitelistAllowFutureElective(studentId, now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return false
  return entryHasActivePermission(entry, 'allowFutureElective', now)
}

/** 仅退课：允许退课后学期学分低于学期最低 */
export function hasWhitelistAllowDropBelowCreditMin(studentId, now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return false
  return entryHasActivePermission(entry, 'allowDropBelowCreditMin', now)
}

/**
 * @returns {{ geCredits: number, meCredits: number, meCategoryKeys: string[] } | null}
 */
export function getWhitelistFutureElectiveConfig(studentId, now = new Date()) {
  const entry = getSupplementEntry(studentId)
  if (!entry) return null
  const perm = getPermission(entry, 'allowFutureElective')
  if (!isPermissionActive(perm, now)) return null
  return {
    geCredits: normalizePositiveCredits(perm.geCredits),
    meCredits: normalizePositiveCredits(perm.meCredits),
    meCategoryKeys: normalizeMeCategoryKeys(perm.meCategoryKeys),
  }
}

/**
 * 给邀请门权限打上发送次数与截止（相对当前时刻，保证初始页可见有效/逾期）
 * @param {object[]} perms
 * @param {{ attempt?: number, remainMs?: number | null }} opts
 *   remainMs>0 有效剩余；remainMs<=0 或 null 且 attempt>0 则逾期；attempt=0 未发送
 */
function stampInviteOnGated(perms, { attempt = 0, remainMs = null } = {}) {
  if (attempt <= 0) return perms
  const now = Date.now()
  const deadlineMs = remainMs == null || remainMs <= 0 ? now - 60 * 1000 : now + remainMs
  const sentMs = remainMs != null && remainMs > 0 ? now - (48 * 60 * 60 * 1000 - remainMs) : now - 49 * 60 * 60 * 1000
  const deadlineAt = formatInviteStamp(new Date(deadlineMs))
  const inviteSentAt = formatInviteStamp(new Date(Math.max(0, sentMs)))
  return perms.map((perm) => {
    if (!INVITE_GATED_PERMISSION_KEYS.includes(perm.key)) return perm
    return {
      ...perm,
      inviteAttempt: attempt,
      inviteSentAt,
      deadlineAt,
    }
  })
}

/** 演示名单：覆盖未发 / 有效内可再发 / 已逾期（再次开放）+ 多种权限组合，共 25 行 */
function buildDemoWhitelistSeed() {
  const activeRemain = 47 * 60 * 60 * 1000 + 30 * 60 * 1000 // ~47h30m
  const rows = [
    {
      id: 'sup-001',
      studentId: 'COS2504015',
      studentName: 'Tan Mei Ling',
      programme: 'COS',
      intake: '2025/04',
      addedAt: '2025-09-10 10:00:00',
      addedBy: 'AC COS',
      source: 'registration-monitor',
      remark: '未发通知 · 仅可加课',
      permissions: stampInviteOnGated(
        [createPermission('supplement'), createPermission('canAdd')],
        { attempt: 0 },
      ),
    },
    {
      id: 'sup-002',
      studentId: 'DSA2504002',
      studentName: 'Lee Wei Ming',
      programme: 'DSA',
      intake: '2025/04',
      addedAt: '2025-09-09 10:00:00',
      addedBy: 'AC DSA',
      source: 'manual',
      remark: '有效期内 · 加退重修全开（可再发通知）',
      permissions: stampInviteOnGated(
        [
          createPermission('supplement'),
          createPermission('canAdd'),
          createPermission('canDrop'),
          createPermission('canRetake'),
        ],
        { attempt: 1, remainMs: activeRemain },
      ),
    },
    {
      id: 'sup-003',
      studentId: 'XMUM2309001',
      studentName: 'Tan Wei Ming',
      programme: 'SWE',
      intake: '2023/09',
      addedAt: '2025-09-12 10:00:00',
      addedBy: 'AC Demo',
      source: 'manual',
      remark:
        '有效白名单 · 演示学生窗外可申请；可加课换组含 MATH101-02；可低于最低学分退课',
      permissions: stampInviteOnGated(
        [
          createPermission('supplement'),
          createPermission('canAdd'),
          createPermission('canDrop'),
          createPermission('canRetake'),
          createPermission('bypassCreditMin', { validHours: null, validUntil: '2026/02' }),
          createPermission('allowCoreSectionSwitchAdd', {
            validHours: null,
            validUntil: null,
            sections: [{ courseCode: 'MATH101', sectionCode: '02' }],
          }),
          createPermission('allowFutureMandatory', {
            validHours: null,
            validUntil: null,
            sections: [{ courseCode: 'PHYS101', sectionCode: '01' }],
          }),
          createPermission('allowDropBelowCreditMin', {
            validHours: null,
            validUntil: null,
          }),
        ],
        { attempt: 1, remainMs: activeRemain },
      ),
    },
    {
      id: 'sup-004',
      studentId: 'DSA2409008',
      studentName: 'Raj Kumar',
      programme: 'DSA',
      intake: '2024/09',
      addedAt: '2025-09-08 10:00:00',
      addedBy: 'AC DSA',
      source: 'manual',
      remark: '有效期内 · 课程豁免先修课',
      permissions: stampInviteOnGated(
        [
          createPermission('supplement'),
          createPermission('canAdd'),
          createPermission('bypassPrerequisite', {
            validHours: null,
            validUntil: '2026/02',
            courseCodes: ['COMP3192'],
          }),
        ],
        { attempt: 2, remainMs: 12 * 60 * 60 * 1000 },
      ),
    },
    {
      id: 'sup-005',
      studentId: 'AIT2409010',
      studentName: 'Siti Nurhaliza',
      programme: 'AIT',
      intake: '2024/09',
      addedAt: '2025-09-05 10:00:00',
      addedBy: 'AC AIT',
      source: 'manual',
      remark: '已逾期 · 突破本学期学分要求',
      permissions: stampInviteOnGated(
        [
          createPermission('supplement'),
          createPermission('canAdd'),
          createPermission('bypassCreditMin', { validHours: null, validUntil: '2026/02' }),
        ],
        { attempt: 2, remainMs: -2 * 60 * 60 * 1000 },
      ),
    },
    {
      id: 'sup-006',
      studentId: 'BUS2409020',
      studentName: 'Wong Mei Ling',
      programme: 'BUS',
      intake: '2024/09',
      addedAt: '2025-09-04 10:00:00',
      addedBy: 'AC Demo',
      source: 'manual',
      remark: '未发通知 · 院系特批',
      permissions: [
        createPermission('supplement'),
        createPermission('canAdd'),
        createPermission('canDrop'),
      ],
    },
    {
      id: 'sup-007',
      studentId: 'COS2409001',
      studentName: 'Ahmad bin Ali',
      programme: 'COS',
      intake: '2024/09',
      addedAt: '2025-09-03 10:00:00',
      addedBy: 'AC Demo',
      source: 'manual',
      remark: '已逾期 · 演示再次开放（非演示学号）',
      permissions: stampInviteOnGated(
        [
          createPermission('supplement'),
          createPermission('canAdd'),
          createPermission('canDrop'),
          createPermission('canRetake'),
        ],
        { attempt: 1, remainMs: -30 * 60 * 1000 },
      ),
    },
    {
      id: 'sup-008',
      studentId: 'SWE2409001',
      studentName: 'Lim Wei Jie',
      programme: 'SWE',
      intake: '2024/09',
      addedAt: '2025-09-02 10:00:00',
      addedBy: 'AC Demo',
      source: 'registration-monitor',
      remark: '有效期内 · 监控转入',
      permissions: stampInviteOnGated(
        [createPermission('supplement'), createPermission('canAdd'), createPermission('canRetake')],
        { attempt: 1, remainMs: 6 * 60 * 60 * 1000 },
      ),
    },
    {
      id: 'sup-009',
      studentId: 'SWE2409012',
      studentName: 'Lim Jia Hui',
      programme: 'SWE',
      intake: '2024/09',
      addedAt: '2025-09-01 10:00:00',
      addedBy: 'AC Demo',
      source: 'manual',
      remark: '未发通知 · 仅可重修',
      permissions: [createPermission('supplement'), createPermission('canRetake')],
    },
    {
      id: 'sup-010',
      studentId: 'ACC2409008',
      studentName: 'Chong Kai Xin',
      programme: 'ACC',
      intake: '2024/09',
      addedAt: '2025-08-31 10:00:00',
      addedBy: 'AC Demo',
      source: 'manual',
      remark: '已逾期 · 学分例外+先修豁免',
      permissions: stampInviteOnGated(
        [
          createPermission('supplement'),
          createPermission('canAdd'),
          createPermission('canDrop'),
          createPermission('canRetake'),
          createPermission('bypassPrerequisite', {
            validHours: null,
            validUntil: '2026/02',
            courseCodes: ['AI101', 'BUS301'],
          }),
          createPermission('bypassCreditMin', { validHours: null, validUntil: '2026/02' }),
        ],
        { attempt: 3, remainMs: -24 * 60 * 60 * 1000 },
      ),
    },
  ]

  const more = [
    { studentId: 'MAT2504003', studentName: 'Raj Kumar', programme: 'MAT', intake: '2025/04', remark: '未发 · 新生加课', invite: { attempt: 0 } },
    { studentId: 'FIN2409011', studentName: 'Nurul Aina', programme: 'FIN', intake: '2024/09', remark: '有效 · 监控转入', invite: { attempt: 1, remainMs: activeRemain } },
    { studentId: 'ENG2409018', studentName: 'Emily Tan', programme: 'ENG', intake: '2024/09', remark: '已逾期 · 人文院特批', invite: { attempt: 1, remainMs: -60 * 1000 } },
    { studentId: 'CHE2409006', studentName: 'Koh Wei Jie', programme: 'CHE', intake: '2024/09', remark: '有效 · 可加可退', invite: { attempt: 2, remainMs: 3 * 60 * 60 * 1000 }, drop: true },
    { studentId: 'PHY2504004', studentName: 'Amira Hassan', programme: 'PHY', intake: '2025/04', remark: '未发 · 国际生', invite: { attempt: 0 }, creditMin: true },
    { studentId: 'BIO2409014', studentName: 'Daniel Lim', programme: 'BIO', intake: '2024/09', remark: '有效 · 先修豁免', invite: { attempt: 1, remainMs: 20 * 60 * 60 * 1000 }, prereq: true },
    { studentId: 'ACC2504009', studentName: 'Priya Sharma', programme: 'ACC', intake: '2025/04', remark: '已逾期 · 新生补选', invite: { attempt: 2, remainMs: -10 * 60 * 1000 } },
    { studentId: 'FIN2504010', studentName: 'Jason Ong', programme: 'FIN', intake: '2025/04', remark: '未发 · 学分不足', invite: { attempt: 0 } },
    { studentId: 'SWE2409025', studentName: 'Grace Yap', programme: 'SWE', intake: '2024/09', remark: '有效 · 毕业班重修', invite: { attempt: 1, remainMs: 1 * 60 * 60 * 1000 }, retake: true },
    { studentId: 'AIT2504011', studentName: 'Farid Ismail', programme: 'AIT', intake: '2025/04', remark: '已逾期 · 可加课', invite: { attempt: 1, remainMs: -5 * 60 * 1000 } },
    { studentId: 'BUS2409030', studentName: 'Nicole Chua', programme: 'BUS', intake: '2024/09', remark: '未发 · 国际生特批', invite: { attempt: 0 }, drop: true, retake: true },
    { studentId: 'MAT2409016', studentName: 'Hafiz Rahman', programme: 'MAT', intake: '2024/09', remark: '有效 · 可退课', invite: { attempt: 1, remainMs: 30 * 60 * 60 * 1000 }, drop: true },
    { studentId: 'COS2409022', studentName: 'Sophie Ng', programme: 'COS', intake: '2024/09', remark: '已逾期 · 先修演示', invite: { attempt: 2, remainMs: -48 * 60 * 60 * 1000 }, prereq: true },
    { studentId: 'SWE2504019', studentName: 'Aisha Rahman', programme: 'SWE', intake: '2025/04', remark: '未发 · 新生加退课', invite: { attempt: 0 }, drop: true, retake: true },
    { studentId: 'FIN2409028', studentName: 'Brian Koh', programme: 'FIN', intake: '2024/09', remark: '有效 · 院系备注', invite: { attempt: 3, remainMs: 8 * 60 * 60 * 1000 } },
  ]

  const dayLabels = [
    '2025-08-30 10:00:00',
    '2025-08-29 10:00:00',
    '2025-08-28 10:00:00',
    '2025-08-27 10:00:00',
    '2025-08-26 10:00:00',
    '2025-08-25 10:00:00',
    '2025-08-24 10:00:00',
    '2025-08-23 10:00:00',
    '2025-08-22 10:00:00',
    '2025-08-21 10:00:00',
  ]

  more.forEach((row, index) => {
    const perms = [createPermission('supplement'), createPermission('canAdd')]
    if (row.drop) perms.push(createPermission('canDrop'))
    if (row.retake) perms.push(createPermission('canRetake'))
    if (row.prereq) {
      perms.push(
        createPermission('bypassPrerequisite', {
          validHours: null,
          validUntil: '2026/02',
          courseCodes: ['AI101'],
        }),
      )
    }
    if (row.creditMin) {
      perms.push(createPermission('bypassCreditMin', { validHours: null, validUntil: '2026/02' }))
    }
    rows.push({
      id: `sup-${String(index + 11).padStart(3, '0')}`,
      studentId: row.studentId,
      studentName: row.studentName,
      programme: row.programme,
      intake: row.intake,
      addedAt: dayLabels[index % dayLabels.length],
      addedBy: 'AC Demo',
      source: 'manual',
      remark: row.remark,
      permissions: stampInviteOnGated(perms, row.invite || { attempt: 0 }),
    })
  })

  return rows.map((item) => normalizeWhitelistEntry(item))
}

const initialSupplementList = buildDemoWhitelistSeed()

export const supplementListQueue = ref(initialSupplementList.map((item) => ({ ...item })))

/** 别名：白名单队列 */
export const whitelistDoorQueue = supplementListQueue

let supplementSeq = initialSupplementList.length + 1

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
    return {
      ok: false,
      entry,
      expired: true,
      needsManual: false,
      errorKey: 'courseRegistration.supplement.inviteExpired',
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
    const parentOn = options.supplement !== false
    permissions = [
      ...(parentOn ? [createPermission('supplement')] : []),
      ...(parentOn && options.canAdd !== false ? [createPermission('canAdd')] : []),
      ...(parentOn && options.canDrop ? [createPermission('canDrop')] : []),
      ...(parentOn && options.canRetake ? [createPermission('canRetake')] : []),
      ...(options.bypassPrerequisite ? [createPermission('bypassPrerequisite')] : []),
      ...(options.bypassCreditMax
        ? [
            createPermission('bypassCreditMax', {
              validHours: null,
              validUntil: null,
              extraCredits: (() => {
                const n = Number(options.creditBypassExtra)
                return Number.isFinite(n) && n > 0 ? Math.min(3, Math.max(1, Math.floor(n))) : 3
              })(),
            }),
          ]
        : []),
      ...(options.bypassCreditMin
        ? [createPermission('bypassCreditMin', { validHours: null, validUntil: null })]
        : []),
      ...(options.allowFutureMandatory
        ? [
            createPermission('allowFutureMandatory', {
              validHours: null,
              validUntil: null,
              sections: normalizeWhitelistSectionRefs(options.futureMandatorySections || []),
            }),
          ]
        : []),
      ...(options.allowCoreSectionSwitchAdd
        ? [
            createPermission('allowCoreSectionSwitchAdd', {
              validHours: null,
              validUntil: null,
              sections: normalizeWhitelistSectionRefs(options.coreSectionSwitchAddSections || []),
            }),
          ]
        : []),
      ...(options.allowCoreSectionSwitchRetake
        ? [
            createPermission('allowCoreSectionSwitchRetake', {
              validHours: null,
              validUntil: null,
              sections: normalizeWhitelistSectionRefs(
                options.coreSectionSwitchRetakeSections || [],
              ),
            }),
          ]
        : []),
      ...(options.allowFutureElective
        ? [
            createPermission('allowFutureElective', {
              validHours: null,
              validUntil: null,
              geCredits: normalizePositiveCredits(options.futureElectiveGeCredits),
              meCredits: normalizePositiveCredits(options.futureElectiveMeCredits),
              meCategoryKeys: normalizeMeCategoryKeys(options.futureElectiveMeCategoryKeys),
            }),
          ]
        : []),
      ...(options.allowDropBelowCreditMin
        ? [createPermission('allowDropBelowCreditMin', { validHours: null, validUntil: null })]
        : []),
    ]
  }

  const item = normalizeWhitelistEntry({
    id: createSupplementId(),
    studentId: student.studentId,
    studentName: student.studentName,
    programme: student.programme,
    intake: student.intake,
    addedAt: formatWhitelistAddedAt(new Date()),
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

/**
 * 列表筛选用：未发送 / 有效 / 已逾期
 * @param {object} row
 * @param {Date} [now]
 * @returns {'notSent'|'active'|'expired'}
 */
export function getWhitelistDoorFilterStatus(row, now = new Date()) {
  const entry = normalizeWhitelistEntry(row || {})
  const attempt = Number(getPermission(entry, 'supplement')?.inviteAttempt) || 0
  if (attempt <= 0) return 'notSent'
  const door = getSupplementDoorStatus(entry.studentId, now)
  return door.ok ? 'active' : 'expired'
}

export function filterSupplementList(rows, filters = {}, now = new Date()) {
  let list = rows.map((r) => normalizeWhitelistEntry(r))
  if (filters.programme) {
    const p = String(filters.programme).trim().toLowerCase()
    list = list.filter((r) => String(r.programme || '').toLowerCase().includes(p))
  }
  if (filters.intake) {
    const want = formatIntakeBatch(filters.intake)
    list = list.filter((r) => formatIntakeBatch(r.intake) === want)
  }
  if (filters.studentId) {
    const kw = String(filters.studentId).trim().toLowerCase()
    list = list.filter((r) => String(r.studentId || '').toLowerCase().includes(kw))
  }
  if (filters.studentName) {
    const kw = String(filters.studentName).trim().toLowerCase()
    list = list.filter((r) => String(r.studentName || '').toLowerCase().includes(kw))
  }
  if (filters.keyword) {
    const kw = String(filters.keyword).trim().toLowerCase()
    list = list.filter(
      (r) =>
        String(r.studentId || '')
          .toLowerCase()
          .includes(kw) ||
        String(r.studentName || '')
          .toLowerCase()
          .includes(kw),
    )
  }
  if (filters.permission) {
    list = list.filter((r) =>
      (r.permissions || []).some((p) => p.key === filters.permission && p.enabled !== false),
    )
  }
  if (filters.doorStatus) {
    const want = String(filters.doorStatus)
    list = list.filter((r) => getWhitelistDoorFilterStatus(r, now) === want)
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
    patch.supplement !== undefined ||
    patch.canAdd !== undefined ||
    patch.canDrop !== undefined ||
    patch.canRetake !== undefined ||
    patch.bypassPrerequisite !== undefined ||
    patch.bypassCreditMax !== undefined ||
    patch.bypassCreditMin !== undefined ||
    patch.allowFutureMandatory !== undefined ||
    patch.futureMandatorySections !== undefined ||
    patch.allowCoreSectionSwitchAdd !== undefined ||
    patch.coreSectionSwitchAddSections !== undefined ||
    patch.allowCoreSectionSwitchRetake !== undefined ||
    patch.coreSectionSwitchRetakeSections !== undefined ||
    patch.allowFutureElective !== undefined ||
    patch.allowDropBelowCreditMin !== undefined ||
    patch.futureElectiveGeCredits !== undefined ||
    patch.futureElectiveMeCredits !== undefined ||
    patch.futureElectiveMeCategoryKeys !== undefined ||
    patch.prereqValidUntil !== undefined ||
    patch.prereqCourseCodes !== undefined ||
    patch.permissionHours !== undefined ||
    patch.permissionUntil !== undefined ||
    patch.creditBypassExtra !== undefined
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
  const parentOn =
    patch.supplement !== undefined ? Boolean(patch.supplement) : Boolean(current.supplement)
  const canAdd = parentOn && (patch.canAdd ?? current.canAdd)
  const canRetake = parentOn && (patch.canRetake ?? current.canRetake)
  const flags = {
    supplement: parentOn,
    canAdd,
    canDrop: parentOn && (patch.canDrop ?? current.canDrop),
    canRetake,
    bypassPrerequisite: patch.bypassPrerequisite ?? current.bypassPrerequisite,
    bypassCreditMax: patch.bypassCreditMax ?? current.bypassCreditMax,
    bypassCreditMin: patch.bypassCreditMin ?? current.bypassCreditMin,
    allowFutureMandatory: patch.allowFutureMandatory ?? current.allowFutureMandatory,
    allowCoreSectionSwitchAdd:
      canAdd && (patch.allowCoreSectionSwitchAdd ?? current.allowCoreSectionSwitchAdd),
    allowCoreSectionSwitchRetake:
      canRetake &&
      (patch.allowCoreSectionSwitchRetake ?? current.allowCoreSectionSwitchRetake),
    allowFutureElective: patch.allowFutureElective ?? current.allowFutureElective,
    allowDropBelowCreditMin:
      patch.allowDropBelowCreditMin ?? current.allowDropBelowCreditMin,
  }
  const extraRaw = Number(patch.creditBypassExtra ?? current.creditBypassExtra)
  const creditBypassExtra =
    Number.isFinite(extraRaw) && extraRaw > 0 ? Math.min(3, Math.max(1, Math.floor(extraRaw))) : 3
  const geCredits = normalizePositiveCredits(
    patch.futureElectiveGeCredits ?? current.futureElectiveGeCredits,
  )
  const meCredits = normalizePositiveCredits(
    patch.futureElectiveMeCredits ?? current.futureElectiveMeCredits,
  )
  const meCategoryKeys = normalizeMeCategoryKeys(
    patch.futureElectiveMeCategoryKeys ?? current.futureElectiveMeCategoryKeys,
  )
  const futureMandatorySections = normalizeWhitelistSectionRefs(
    patch.futureMandatorySections ?? current.futureMandatorySections,
  )
  const coreSectionSwitchAddSections = normalizeWhitelistSectionRefs(
    patch.coreSectionSwitchAddSections ?? current.coreSectionSwitchAddSections,
  )
  const coreSectionSwitchRetakeSections = normalizeWhitelistSectionRefs(
    patch.coreSectionSwitchRetakeSections ?? current.coreSectionSwitchRetakeSections,
  )
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
        validUntil: until !== undefined ? until || null : prev.validUntil || null,
        courseCodes:
          key === 'bypassPrerequisite'
            ? patch.prereqCourseCodes ?? prev.courseCodes ?? []
            : prev.courseCodes || [],
        ...(key === 'bypassCreditMax' ? { extraCredits: creditBypassExtra, validHours: null } : {}),
        ...(key === 'allowFutureMandatory'
          ? { sections: futureMandatorySections, validHours: null }
          : {}),
        ...(key === 'allowCoreSectionSwitchAdd'
          ? { sections: coreSectionSwitchAddSections, validHours: null }
          : {}),
        ...(key === 'allowCoreSectionSwitchRetake'
          ? { sections: coreSectionSwitchRetakeSections, validHours: null }
          : {}),
        ...(key === 'allowFutureElective'
          ? {
              geCredits,
              meCredits,
              meCategoryKeys,
              validHours: null,
            }
          : {}),
      }),
    )
  }
  return list
}

/**
 * @param {object} perm
 * @param {number} attempt
 * @param {Date} [now]
 * @param {Date|null} [deadlineOverride] 指定绝对截止（再次开放选时）
 */
function applyInviteToPermission(perm, attempt, now = new Date(), deadlineOverride = null) {
  const hours =
    perm.validHours != null && perm.validHours !== ''
      ? Number(perm.validHours)
      : SUPPLEMENT_INVITE_HOURS
  const sentAt = formatInviteStamp(now)
  let deadlineAt = null
  if (deadlineOverride instanceof Date && !Number.isNaN(deadlineOverride.getTime())) {
    deadlineAt = formatInviteStamp(deadlineOverride)
  } else if (perm.validUntil) {
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

function applyInviteWindow(entry, attempt, now = new Date(), deadlineOverride = null) {
  const normalized = normalizeWhitelistEntry(entry)
  const permissions = (normalized.permissions || []).map((perm) => {
    if (!INVITE_GATED_PERMISSION_KEYS.includes(perm.key)) return perm
    if (perm.enabled === false) return perm
    return applyInviteToPermission(perm, attempt, now, deadlineOverride)
  })
  const next = normalizeWhitelistEntry({
    ...normalized,
    permissions,
    lastEmailMockAt: formatInviteStamp(now),
  })
  return next
}

/**
 * 发送/再次发送通知（有效期内可多次；逾期须走 reopen）
 */
export function sendSupplementInvite(id, now = new Date()) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const entry = normalizeWhitelistEntry(supplementListQueue.value[index])
  const attempt = Number(getPermission(entry, 'supplement')?.inviteAttempt) || 0
  if (attempt >= 1) {
    const door = getSupplementDoorStatus(entry.studentId, now)
    if (!door.ok) {
      return { ok: false, errorKey: 'courseRegistration.supplement.inviteExpiredUseReopen' }
    }
  }
  const next = applyInviteWindow(entry, attempt + 1, now)
  supplementListQueue.value[index] = next
  return { ok: true, item: next, emailMock: true }
}

/**
 * 逾期后再次开放（与发送通知分开，不限次数）
 * @param {string} id
 * @param {Date} [now]
 * @param {{ deadlineAt?: string|Date }} [options] deadlineAt 为「YYYY-MM-DD HH:mm:ss」或 Date
 */
export function reopenSupplementInvite(id, now = new Date(), options = {}) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const entry = normalizeWhitelistEntry(supplementListQueue.value[index])
  const attempt = Number(getPermission(entry, 'supplement')?.inviteAttempt) || 0
  if (attempt < 1) {
    return { ok: false, errorKey: 'courseRegistration.supplement.inviteSendFirst' }
  }
  const door = getSupplementDoorStatus(entry.studentId, now)
  if (door.ok) {
    return { ok: false, errorKey: 'courseRegistration.supplement.inviteStillActive' }
  }
  let deadlineOverride = null
  if (options?.deadlineAt != null && options.deadlineAt !== '') {
    deadlineOverride =
      options.deadlineAt instanceof Date
        ? options.deadlineAt
        : parseInviteStamp(options.deadlineAt)
    if (!deadlineOverride || Number.isNaN(deadlineOverride.getTime())) {
      return { ok: false, errorKey: 'courseRegistration.whitelist.reopenDueRequired' }
    }
    const nowMs = now instanceof Date ? now.getTime() : Date.now()
    if (deadlineOverride.getTime() <= nowMs) {
      return { ok: false, errorKey: 'courseRegistration.whitelist.reopenDueMustFuture' }
    }
  }
  const next = applyInviteWindow(entry, attempt + 1, now, deadlineOverride)
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

/**
 * 邀请倒计时（展示对齐缴费剩余：天/小时/分钟）
 * @param {object} entry
 * @param {Date|number} [now]
 * @param {(key: string, params?: object) => string} [t] 传入则 label 用 i18n 天时分
 */
export function formatSupplementInviteCountdown(entry, now = new Date(), t = null) {
  const normalized = entry ? normalizeWhitelistEntry(entry) : null
  const deadlineRaw =
    getPermission(normalized, 'supplement')?.deadlineAt || normalized?.deadlineAt
  if (!deadlineRaw) return null
  const deadline = parseInviteStamp(deadlineRaw)
  if (!deadline) return null
  const nowMs = now instanceof Date ? now.getTime() : Number(now) || Date.now()
  const ms = deadline.getTime() - nowMs
  if (ms <= 0) {
    return { expired: true, remainingMs: ms, deadlineAt: deadlineRaw, label: '0h' }
  }
  const totalMin = Math.floor(ms / 60000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const mins = totalMin % 60
  const label = t
    ? t('courseRegistration.approval.paymentRemainingDhm', { d: days, h: hours, m: mins })
    : `${days}d ${hours}h ${mins}m`
  return {
    expired: false,
    remainingMs: ms,
    days,
    hours,
    mins,
    deadlineAt: deadlineRaw,
    label,
  }
}

/** 列表展示：权限摘要（超学期学分额度用 bypassCreditMin 文案 + 可超分） */
export function formatPermissionSummary(entry, t) {
  const normalized = normalizeWhitelistEntry(entry)
  const labels = []
  for (const perm of normalized.permissions || []) {
    if (perm.enabled === false) continue
    if (perm.key === 'bypassCreditMax') {
      const extra =
        Number(perm.extraCredits) > 0
          ? Math.min(3, Math.floor(Number(perm.extraCredits)))
          : normalized.creditBypassExtra || 3
      const baseKey = 'courseRegistration.whitelist.perm.bypassCreditMin'
      const base = t ? t(baseKey) : baseKey
      const unit = t ? t('courseRegistration.whitelist.creditBypassExtraUnit') : 'cr'
      labels.push(`${base}(+${extra}${unit})`)
      continue
    }
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

/**
 * 白名单「发送通知」邮件草稿（MonitorRemindModal）
 * @param {object} row
 * @param {(key: string, params?: object) => string} t
 */
export function buildWhitelistNotifyDraft(row, t, options = {}) {
  const name = row?.studentName || ''
  const id = row?.studentId || ''
  const hours = Number(options?.hours)
  const hoursText = Number.isFinite(hours) && hours > 0 ? hours : SUPPLEMENT_INVITE_HOURS
  return {
    subject: t('courseRegistration.whitelist.notifyDraft.subject', { name }),
    body: [
      t('courseRegistration.whitelist.notifyDraft.greeting', { name, id }),
      '',
      t('courseRegistration.whitelist.notifyDraft.lineOpen'),
      t('courseRegistration.whitelist.notifyDraft.lineHours', {
        hours: hoursText,
      }),
      t('courseRegistration.whitelist.notifyDraft.lineAction'),
      '',
      t('courseRegistration.whitelist.notifyDraft.signoff'),
    ].join('\n'),
  }
}

/**
 * 白名单「再次开放并发送通知」邮件草稿
 * @param {object} row
 * @param {(key: string, params?: object) => string} t
 * @param {{ hours?: number }} [options]
 */
export function buildWhitelistReopenDraft(row, t, options = {}) {
  const name = row?.studentName || ''
  const id = row?.studentId || ''
  const hours = Number(options?.hours)
  const hoursText = Number.isFinite(hours) && hours > 0 ? hours : SUPPLEMENT_INVITE_HOURS
  return {
    subject: t('courseRegistration.whitelist.reopenDraft.subject', { name }),
    body: [
      t('courseRegistration.whitelist.reopenDraft.greeting', { name, id }),
      '',
      t('courseRegistration.whitelist.reopenDraft.lineReopen'),
      t('courseRegistration.whitelist.reopenDraft.lineHours', {
        hours: hoursText,
      }),
      t('courseRegistration.whitelist.reopenDraft.lineAction'),
      '',
      t('courseRegistration.whitelist.reopenDraft.signoff'),
    ].join('\n'),
  }
}
