import { ref } from 'vue'
import { batchDateToPicker } from './registrationBatchFormUtils.js'
import {
  defaultScopeRulesForProgramme,
  scopeLabelsFromRules,
} from './batchScopeRules.js'
import { defaultBatchLocalRules } from './batchLocalRules.js'

const SESSION = '2026/04'
/** 默认仅第一轮；二三轮经「管理轮次」递进配置 */
const R1_ONLY_ROUNDS = {
  preselect: { start: '25-Aug-2025', end: '28-Aug-2025' },
  main: { start: '', end: '' },
  supplement: { start: '', end: '' },
}
const FULL_ROUNDS = {
  preselect: { start: '25-Aug-2025', end: '28-Aug-2025' },
  main: { start: '31-Aug-2025', end: '04-Sep-2025' },
  supplement: { start: '07-Sep-2025', end: '09-Sep-2025' },
}
/** 已配第二轮、结束日未到（相对 2026-07），用于演示 R3 仍锁定 */
const R2_OPEN_ROUNDS = {
  preselect: { start: '25-Aug-2025', end: '28-Aug-2025' },
  main: { start: '01-Aug-2026', end: '20-Aug-2026' },
  supplement: { start: '', end: '' },
}
const DEFAULT_ADD_DROP = { start: '01-Jul-2026', end: '31-Aug-2026' }

function meName(dept, tier) {
  if (tier) {
    return `Major Elective Selection (${tier}) for ${dept} ${SESSION} Academic Session`
  }
  return `Major Elective Selection for ${dept} ${SESSION} Academic Session`
}

/**
 * GE 批次命名：对齐管理端 ME 句式，SCOPE 为 HUM/BUS/MPU
 * @param {'HUM'|'BUS'|'MPU'|string} scope 类别短码
 * @param {string|null} tier 档位如 I/II，可空
 */
function geName(scope, tier = null) {
  if (tier) {
    return `General Elective Selection (${tier}) for ${scope} ${SESSION} Academic Session`
  }
  return `General Elective Selection for ${scope} ${SESSION} Academic Session`
}

/** 公共选修宽口径 scope（多学院 + 演示 intake） */
function geWideScopeRules() {
  return [
    {
      faculties: ['School of Information', 'School of Business', 'School of Energy and Chemical Engineering'],
      intakes: ['2024/09', '2025/04'],
      programmes: [],
      groupName: '',
      round: 'preselect',
    },
    {
      faculties: ['School of Information', 'School of Business', 'School of Energy and Chemical Engineering'],
      intakes: ['2024/09', '2025/04'],
      programmes: [],
      groupName: '',
      round: 'main',
    },
    {
      faculties: ['School of Information', 'School of Business', 'School of Energy and Chemical Engineering'],
      intakes: ['2024/09', '2025/04'],
      programmes: [],
      groupName: '',
      round: 'supplement',
    },
  ]
}

function withScopeRules(rules) {
  return {
    scopeRules: rules,
    scope: scopeLabelsFromRules(rules),
  }
}

function preselectOnlyScopeRules(programme, faculty = '') {
  return defaultScopeRulesForProgramme(programme, faculty).filter((rule) => rule.round === 'preselect')
}

function meBatch({
  id,
  dept,
  tier = null,
  status = 'draft',
  courseCount = 8,
  faculty = '',
  scopeRules,
  ...rest
}) {
  const rules = scopeRules || preselectOnlyScopeRules(dept, faculty)
  return {
    id,
    name: meName(dept, tier),
    academicSession: SESSION,
    type: 'ME',
    status,
    roundsSummary: 'R1 25-Aug–28-Aug',
    ...withScopeRules(rules),
    creditMin: 12,
    creditMax: 20,
    courseCount,
    rounds: { ...R1_ONLY_ROUNDS },
    addDropWindow: { ...DEFAULT_ADD_DROP },
    notifyTemplate: 'default-m1',
    preselectPriority: {
      preferSenior: true,
      minSemestersAbove: 1,
    },
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    volunteerFinalConfirmedAt: null,
    ...rest,
  }
}

/**
 * 图示 Major Elective Selection 命名；batch-2504-m1 = SWE (I) active，供学生课表 demo。
 * 另有多条 ME active 样例（须排在 batch-2504-m1 之后）；GE 另有独立 active，由类型偏好解析。
 */
const initialBatches = [
  meBatch({
    id: 'batch-me-chs-junior',
    dept: 'CHS',
    tier: 'Junior',
    status: 'draft',
    courseCount: 12,
  }),
  meBatch({
    id: 'batch-me-chs-senior-i',
    dept: 'CHS',
    tier: 'Senior I',
    status: 'draft',
    courseCount: 11,
  }),
  meBatch({
    id: 'batch-me-chs-senior-ii',
    dept: 'CHS',
    tier: 'Senior II',
    status: 'closed',
    courseCount: 10,
  }),
  meBatch({
    id: 'batch-me-cst-ii',
    dept: 'CST',
    tier: 'II',
    status: 'draft',
    courseCount: 13,
  }),
  // D：主活跃批 — 三轮齐全，供学生选课 demo
  meBatch({
    id: 'batch-2504-m1',
    dept: 'SWE',
    tier: 'I',
    status: 'active',
    courseCount: 24,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    /** Demo：当前进行第二轮；第一轮已过可看不可立即选课 */
    demoActiveRound: 'main',
    demoClosedRounds: ['preselect'],
    rounds: { ...FULL_ROUNDS },
    roundsSummary: 'R1 25-Aug–28-Aug · R2 31-Aug–04-Sep · R3 07-Sep–09-Sep',
    scopeRules: [
      {
        faculties: ['School of Information'],
        intakes: ['2024/09', '2025/04'],
        programmes: ['SWE'],
        groupName: '',
        round: 'preselect',
      },
      {
        faculties: ['School of Information'],
        intakes: ['2024/09'],
        programmes: ['SWE', 'COS'],
        groupName: '',
        round: 'main',
      },
      {
        faculties: ['School of Information'],
        intakes: ['All'],
        programmes: ['SWE', 'DSA', 'AIT'],
        groupName: '',
        round: 'supplement',
      },
    ],
  }),
  // B：已确认志愿，已配第二轮（结束日未到），第三轮未配置
  meBatch({
    id: 'batch-me-cst-i',
    dept: 'CST',
    tier: 'I',
    status: 'active',
    courseCount: 14,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoActiveRound: 'main',
    demoClosedRounds: ['preselect'],
    rounds: { ...R2_OPEN_ROUNDS },
    roundsSummary: 'R1 25-Aug–28-Aug · R2 01-Aug–20-Aug-2026',
    scopeRules: [
      {
        faculties: ['School of Information'],
        intakes: ['2024/09', '2025/04'],
        programmes: ['CST'],
        groupName: '',
        round: 'preselect',
      },
      {
        faculties: ['School of Information', 'School of Computing'],
        intakes: ['2025/04'],
        programmes: ['CST', 'CSN'],
        groupName: '',
        round: 'main',
      },
    ],
  }),
  // A：进行中但尚未最终确认 — 仅第一轮，管理轮次中二三轮锁定
  meBatch({
    id: 'batch-me-cos',
    dept: 'COS',
    status: 'active',
    courseCount: 18,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: null,
    demoActiveRound: 'preselect',
    scopeRules: [
      {
        faculties: ['School of Information'],
        intakes: ['2024/09'],
        programmes: ['COS', 'SWE'],
        groupName: '',
        round: 'preselect',
      },
    ],
  }),
  // C：二轮已结束，第三轮已配
  meBatch({
    id: 'batch-me-cys-i',
    dept: 'CYS',
    tier: 'I',
    status: 'active',
    courseCount: 12,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoActiveRound: 'supplement',
    demoClosedRounds: ['preselect', 'main'],
    rounds: { ...FULL_ROUNDS },
    roundsSummary: 'R1 25-Aug–28-Aug · R2 31-Aug–04-Sep · R3 07-Sep–09-Sep',
    scopeRules: [
      {
        faculties: ['School of Information'],
        intakes: ['2024/09', '2025/04'],
        programmes: ['CYS'],
        groupName: '',
        round: 'preselect',
      },
      {
        faculties: ['School of Information', 'School of Computing'],
        intakes: ['2024/09'],
        programmes: ['CYS'],
        groupName: '',
        round: 'main',
      },
      {
        faculties: ['School of Information'],
        intakes: ['2025/04'],
        programmes: ['CYS', 'SWE'],
        groupName: '',
        round: 'supplement',
      },
    ],
  }),
  meBatch({
    id: 'batch-me-swe-ii',
    dept: 'SWE',
    tier: 'II',
    status: 'draft',
    courseCount: 16,
  }),
  meBatch({
    id: 'batch-me-cys-ii',
    dept: 'CYS',
    tier: 'II',
    status: 'draft',
    courseCount: 11,
  }),
  meBatch({
    id: 'batch-me-dsc-i',
    dept: 'DSC',
    tier: 'I',
    status: 'draft',
    courseCount: 12,
  }),
  meBatch({
    id: 'batch-me-eee-i',
    dept: 'EEE',
    tier: 'I',
    status: 'draft',
    courseCount: 15,
  }),
  meBatch({
    id: 'batch-me-eee-ii',
    dept: 'EEE',
    tier: 'II',
    status: 'closed',
    courseCount: 14,
  }),
  // GE：HUM / BUS / MPU 三类 active，命名对齐管理端句式；课表与轮次状态错开
  {
    id: 'batch-2504-g1',
    // 原名 GE General Studies Selection… 已改为 HUM 句式
    name: geName('HUM', 'I'),
    academicSession: SESSION,
    type: 'GE',
    status: 'active',
    roundsSummary: 'R1 01-Sep–03-Sep · R2 06-Sep–08-Sep · R3 11-Sep–12-Sep',
    ...withScopeRules(geWideScopeRules()),
    /** Demo：当前第二轮；第一轮已过；第三轮关闭 */
    demoActiveRound: 'main',
    demoClosedRounds: ['preselect', 'supplement'],
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    creditMin: 4,
    creditMax: 8,
    courseCount: 16,
    rounds: {
      preselect: { start: '01-Sep-2025', end: '03-Sep-2025' },
      main: { start: '06-Sep-2025', end: '08-Sep-2025' },
      supplement: { start: '11-Sep-2025', end: '12-Sep-2025' },
    },
    addDropWindow: { start: '15-Sep-2025', end: '26-Sep-2025' },
    notifyTemplate: 'default-g1',
  },
  {
    id: 'batch-2504-g2',
    name: geName('BUS', 'I'),
    academicSession: SESSION,
    type: 'GE',
    status: 'active',
    roundsSummary: 'R1 01-Sep–03-Sep · R2 06-Sep–08-Sep',
    ...withScopeRules(geWideScopeRules().filter((r) => r.round !== 'supplement')),
    /** Demo：当前第一轮；二三轮未配或未开放 */
    demoActiveRound: 'preselect',
    demoClosedRounds: [],
    volunteerFinalConfirmedAt: null,
    creditMin: 3,
    creditMax: 6,
    courseCount: 10,
    rounds: {
      preselect: { start: '01-Sep-2025', end: '03-Sep-2025' },
      main: { start: '06-Sep-2025', end: '08-Sep-2025' },
      supplement: { start: '', end: '' },
    },
    addDropWindow: { start: '15-Sep-2025', end: '26-Sep-2025' },
    notifyTemplate: 'default-g2',
  },
  {
    id: 'batch-2504-g3',
    name: geName('MPU', 'II'),
    academicSession: SESSION,
    type: 'GE',
    status: 'active',
    roundsSummary: 'R1 01-Sep–03-Sep · R2 06-Sep–08-Sep · R3 11-Sep–12-Sep',
    ...withScopeRules(geWideScopeRules()),
    /** Demo：当前第三轮；一二轮已过 */
    demoActiveRound: 'supplement',
    demoClosedRounds: ['preselect', 'main'],
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    creditMin: 2,
    creditMax: 6,
    courseCount: 8,
    rounds: {
      preselect: { start: '01-Sep-2025', end: '03-Sep-2025' },
      main: { start: '06-Sep-2025', end: '08-Sep-2025' },
      supplement: { start: '11-Sep-2025', end: '12-Sep-2025' },
    },
    addDropWindow: { start: '15-Sep-2025', end: '26-Sep-2025' },
    notifyTemplate: 'default-g3',
  },
  {
    id: 'batch-2502-me-closed',
    name: 'Major Elective Selection 2025/02 Academic Session',
    academicSession: '2025/02',
    type: 'ME',
    status: 'closed',
    roundsSummary: 'Closed · Main completed 15-Jan–20-Jan',
    ...withScopeRules([
      {
        faculty: 'School of Information',
        intake: '2024/09',
        programme: 'SWE',
        groupName: '',
      },
      {
        faculty: 'School of Business',
        intake: '2025/04',
        programme: 'ACC',
        groupName: '',
      },
    ]),
    creditMin: 12,
    creditMax: 20,
    courseCount: 8,
    rounds: {
      preselect: { start: '10-Jan-2025', end: '12-Jan-2025' },
      main: { start: '15-Jan-2025', end: '20-Jan-2025' },
      supplement: { start: '21-Jan-2025', end: '22-Jan-2025' },
    },
    addDropWindow: { start: '25-Jan-2025', end: '10-Feb-2025' },
    notifyTemplate: 'default-me',
  },
]

export const registrationBatches = ref(initialBatches.map((item) => ({ ...item })))

let batchSeq = 3

export function defaultRounds() {
  return {
    preselect: { start: '', end: '' },
    main: { start: '', end: '' },
    supplement: { start: '', end: '' },
  }
}

export function defaultAddDropWindow() {
  return { ...DEFAULT_ADD_DROP }
}

export function formatRoundsSummary(rounds, addDropWindow) {
  const parts = [
    formatRoundRange(rounds?.preselect),
    formatRoundRange(rounds?.main),
    formatRoundRange(rounds?.supplement),
    formatRoundRange(addDropWindow),
  ].filter((part) => part && part !== '—')
  return parts.join(' · ')
}

/** 列表/导出：与 DatePickerEn 一致的 DD/MM/YYYY 时间段 */
export function formatRoundRange(range) {
  if (!range?.start) return '—'
  const start = batchDateToPicker(range.start)
  const end = range.end ? batchDateToPicker(range.end) : ''
  if (!start) return '—'
  return end ? `${start} – ${end}` : start
}

/** 列表展示：未配置轮次用文案，避免与「—」空数据混淆时可传入 t */
export function formatRoundRangeDisplay(range, t) {
  const text = formatRoundRange(range)
  if (text !== '—') return text
  if (t) return t('courseRegistration.batch.roundNotConfigured')
  return '—'
}

/** tooltip：与单元格同格式（已是完整日期） */
export function formatRoundRangeTitle(range) {
  const text = formatRoundRange(range)
  return text === '—' ? '' : text
}

export function createBatchId() {
  return `batch-new-${batchSeq++}`
}

export function getBatchById(id) {
  return registrationBatches.value.find((item) => item.id === id) || null
}

/** 学生在线选课：按课程类型大类切换当前批次上下文（ME / GE）
 * 批次优先导航后：由选中批次同步，Tab 不再反向切换批次。
 */
export const activeBatchTypePreference = ref('ME')

/** 学生端当前选中的选课批次 id（仅 active 可选） */
export const studentSelectedBatchId = ref('')

/**
 * 设置学生端选课类型偏好
 * @param {'ME'|'GE'|string} type 批次/课程大类
 */
export function setActiveBatchTypePreference(type) {
  activeBatchTypePreference.value = type === 'GE' ? 'GE' : 'ME'
}

/**
 * 学生可选批次：仅进行中（active），不含 draft/closed
 * @returns {Array} active 批次列表（保持数据源顺序）
 */
export function listStudentSelectableBatches() {
  return registrationBatches.value.filter((item) => item.status === 'active')
}

/**
 * 轮次是否已配置起止时间（未设则不下拉展示）
 * @param {{ start?: string, end?: string }|null|undefined} range 轮次时间
 */
export function isRoundTimeConfigured(range) {
  return Boolean(range?.start && range?.end)
}

/**
 * 批次下已配置时间的轮次 key 列表（预选→正选→补选顺序）
 * @param {object|null} batch 批次
 * @returns {string[]}
 */
export function listConfiguredRoundKeys(batch) {
  if (!batch?.rounds) return []
  const keys = ['preselect', 'main', 'supplement']
  return keys.filter((key) => isRoundTimeConfigured(batch.rounds[key]))
}

/**
 * 学生端默认轮次：优先 demoActiveRound（且已配置），否则第一个已配置轮次
 * @param {object|null} batch 批次
 * @returns {string}
 */
export function getStudentDefaultRoundKey(batch) {
  const configured = listConfiguredRoundKeys(batch)
  if (!configured.length) return 'preselect'
  const preferred = batch?.demoActiveRound
  if (preferred && configured.includes(preferred)) return preferred
  return configured[0]
}

/**
 * 选择学生端批次，并同步类型偏好
 * @param {string} id 批次 id
 */
export function setStudentSelectedBatchId(id) {
  studentSelectedBatchId.value = id || ''
  const batch = id ? getBatchById(id) : null
  if (batch?.type) {
    setActiveBatchTypePreference(batch.type)
  }
}

/**
 * 确保学生端有合法选中批次；缺省取可选列表第一条
 * @returns {object|null} 当前选中批次
 */
export function ensureStudentBatchSelection() {
  const list = listStudentSelectableBatches()
  if (!list.length) {
    studentSelectedBatchId.value = ''
    return null
  }
  const current = list.find((item) => item.id === studentSelectedBatchId.value)
  if (current) {
    setActiveBatchTypePreference(current.type)
    return current
  }
  const first = list[0]
  setStudentSelectedBatchId(first.id)
  return first
}

/**
 * 解析当前学生/全局活跃批次：优先学生选中且仍为 active，否则按类型偏好，再否则第一条 active
 * @returns {object|null}
 */
export function getActiveBatch() {
  if (studentSelectedBatchId.value) {
    const selected = registrationBatches.value.find(
      (item) => item.id === studentSelectedBatchId.value && item.status === 'active',
    )
    if (selected) return selected
  }
  const preferred = activeBatchTypePreference.value
  const ofType = registrationBatches.value.find(
    (item) => item.status === 'active' && item.type === preferred,
  )
  if (ofType) return ofType
  return (
    registrationBatches.value.find((item) => item.status === 'active') ||
    registrationBatches.value[0] ||
    null
  )
}

/** Demo：批次是否将某轮标为关闭（非整页日历校验）；关闭时仅禁立即选课 */
export function isBatchRoundOpenForRegistration(batch, roundKey) {
  if (!batch) return false
  const key = roundKey || ''
  const closed = Array.isArray(batch.demoClosedRounds) ? batch.demoClosedRounds : []
  return !closed.includes(key)
}

export function addRegistrationBatch(payload) {
  const rounds = payload.rounds || {
    preselect: { start: '', end: '' },
    main: { start: '', end: '' },
    supplement: { start: '', end: '' },
  }
  const addDropWindow = payload.addDropWindow || { start: '', end: '' }
  const item = {
    id: createBatchId(),
    status: 'draft',
    courseCount: 0,
    preselectPriority: { preferSenior: true, minSemestersAbove: 1 },
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    ...payload,
    rounds,
    addDropWindow,
    roundsSummary: payload.roundsSummary || formatRoundsSummary(rounds, addDropWindow),
  }
  registrationBatches.value.unshift(item)
  return item
}

export function updateRegistrationBatch(id, patch) {
  const index = registrationBatches.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  registrationBatches.value[index] = { ...registrationBatches.value[index], ...patch }
  return { ok: true, item: registrationBatches.value[index] }
}

export function publishRegistrationBatch(id) {
  const batch = getBatchById(id)
  if (!batch) return { ok: false, errorKey: 'courseRegistration.batch.notFound' }
  return updateRegistrationBatch(id, { status: 'active' })
}

/** 撤销发布：进行中 → 草稿 */
export function revokeRegistrationBatch(id) {
  const batch = getBatchById(id)
  if (!batch) return { ok: false, errorKey: 'courseRegistration.batch.notFound' }
  if (batch.status !== 'active') {
    return { ok: false, errorKey: 'courseRegistration.batch.revokeOnlyActive' }
  }
  return updateRegistrationBatch(id, { status: 'draft' })
}
