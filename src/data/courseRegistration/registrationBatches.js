import { ref } from 'vue'
import { batchDateToPicker } from './registrationBatchFormUtils.js'
import {
  scopeLabelsFromRules,
} from './batchScopeRules.js'
import { defaultBatchLocalRules } from './batchLocalRules.js'
import { defaultRound1Quota } from './batchRound1Quota.js'
import {
  DEMO_FRESHMAN_ROUNDS_202604,
  DEMO_SENIOR_ROUNDS_202604,
  ensureRoundsByAudience,
  syncLegacyRoundsFromAudience,
} from './audienceRounds.js'
import {
  DEMO_ADD_DROP_WINDOW_OPEN_LONG,
  DEMO_ADD_DROP_WINDOW_SHORT,
  TERM_KIND_LONG,
  TERM_KIND_SHORT,
  resolveBatchTermKind,
  resolveDropDeadlineWeek,
} from './batchTermKind.js'

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
/** 长学期演示：窗口保持开放便于联调；截止周=2，结束对齐 17:00 */
const DEFAULT_ADD_DROP = { ...DEMO_ADD_DROP_WINDOW_OPEN_LONG }

function meName(dept, tier) {
  if (tier) {
    return `Major Elective Selection (${tier}) for ${dept} ${SESSION} Academic Session`
  }
  return `Major Elective Selection for ${dept} ${SESSION} Academic Session`
}

/**
 * GE 批次命名：对齐管理端 ME 句式，SCOPE 为 HUM/BUS/MPU/SCI
 * @param {'HUM'|'BUS'|'MPU'|string} scope 类别短码
 * @param {string|null} tier 档位如 I/II，可空
 */
function geName(scope, tier = null) {
  if (tier) {
    return `General Elective Selection (${tier}) for ${scope} ${SESSION} Academic Session`
  }
  return `General Elective Selection for ${scope} ${SESSION} Academic Session`
}

function withScopeRules(rules) {
  return {
    scopeRules: rules,
    scope: scopeLabelsFromRules(rules),
  }
}

function geBatch({
  id,
  scope,
  tier = null,
  status = 'draft',
  courseCount = 8,
  scopeRules,
  ...rest
}) {
  const rules = scopeRules || []
  return {
    id,
    name: geName(scope, tier),
    academicSession: SESSION,
    type: 'GE',
    programme: '',
    status,
    roundsSummary: 'R1 25-Aug–28-Aug',
    ...withScopeRules(rules),
    creditMin: 4,
    creditMax: 8,
    courseCount,
    rounds: { ...R1_ONLY_ROUNDS },
    roundsByAudience: {
      senior: { ...R1_ONLY_ROUNDS, resultReleaseAt: DEMO_SENIOR_ROUNDS_202604.resultReleaseAt },
      freshman: {
        preselect: { start: '', end: '' },
        main: { start: '', end: '' },
        supplement: { start: '', end: '' },
      },
    },
    addDropWindow: { ...DEFAULT_ADD_DROP },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-ge',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('GE', '', SESSION),
    volunteerFinalConfirmedAt: null,
    ...rest,
  }
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
  const rules = scopeRules || []
  return {
    id,
    name: meName(dept, tier),
    academicSession: SESSION,
    type: 'ME',
    programme: dept,
    status,
    roundsSummary: 'R1 25-Aug–28-Aug',
    ...withScopeRules(rules),
    creditMin: 12,
    creditMax: 20,
    courseCount,
    rounds: { ...R1_ONLY_ROUNDS },
    roundsByAudience: {
      senior: { ...R1_ONLY_ROUNDS, resultReleaseAt: DEMO_SENIOR_ROUNDS_202604.resultReleaseAt },
      freshman: {
        preselect: { start: '', end: '' },
        main: { start: '', end: '' },
        supplement: { start: '', end: '' },
      },
    },
    addDropWindow: { ...DEFAULT_ADD_DROP },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-m1',
    preselectPriority: {
      preferSenior: false,
      minSemestersAbove: 1,
    },
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('ME', dept, SESSION),
    volunteerFinalConfirmedAt: null,
    ...rest,
  }
}

export { resolveBatchTermKind, resolveDropDeadlineWeek, TERM_KIND_LONG, TERM_KIND_SHORT }

/**
 * 学生端 demo 矩阵（开闭只认 demoActiveRound / demoClosedRounds）：
 * GE：HUM=R1 进行中、BUS=R2、MPU=R3、SCI=R1 已结束
 * ME：SWE=R1 进行中、CST=R2、CYS=R3、COS=R1 已结束；batch-2504-m1 兼学生课表主批。
 */
const initialBatches = [
  geBatch({
    id: 'batch-ge-hum-junior',
    scope: 'HUM',
    tier: 'Junior',
    status: 'draft',
    courseCount: 20,
  }),
  meBatch({
    id: 'batch-me-chs-senior-i',
    dept: 'CHS',
    tier: 'Senior I',
    status: 'draft',
    courseCount: 20,
  }),
  meBatch({
    id: 'batch-me-chs-senior-ii',
    dept: 'CHS',
    tier: 'Senior II',
    status: 'closed',
    courseCount: 20,
    /** 已结束：三轮选课已走完，新老生轮次均有完整时间 */
    rounds: { ...FULL_ROUNDS },
    roundsByAudience: {
      senior: { ...FULL_ROUNDS, resultReleaseAt: '10-Sep-2025 19:00:00' },
      freshman: { ...FULL_ROUNDS },
    },
    roundsSummary: 'R1 25-Aug–28-Aug · R2 31-Aug–04-Sep · R3 07-Sep–09-Sep · Closed',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoClosedRounds: ['preselect', 'main', 'supplement'],
  }),
  geBatch({
    id: 'batch-ge-sci-ii',
    scope: 'SCI',
    tier: 'II',
    status: 'draft',
    courseCount: 20,
  }),
  // D：第一轮进行中 — 三轮齐全，兼学生课表主批
  meBatch({
    id: 'batch-2504-m1',
    dept: 'SWE',
    tier: 'I',
    status: 'active',
    courseCount: 24,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    /** Demo：当前第一轮可操作 */
    demoActiveRound: 'preselect',
    demoClosedRounds: [],
    rounds: { ...FULL_ROUNDS },
    roundsByAudience: {
      senior: {
        ...FULL_ROUNDS,
        resultReleaseAt: '01-Apr-2026 19:00:00',
      },
      freshman: {
        preselect: { start: '', end: '' },
        main: { start: '02-Apr-2026 00:00:00', end: '05-Apr-2026 23:59:00' },
        supplement: { start: '06-Apr-2026 00:00:00', end: '12-Apr-2026 23:59:00' },
      },
    },
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
  // B：第二轮进行中
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
  // A：已结束（三轮均关闭，展示钉第一轮）
  meBatch({
    id: 'batch-me-cos',
    dept: 'COS',
    status: 'active',
    courseCount: 18,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoActiveRound: 'preselect',
    demoClosedRounds: ['preselect', 'main', 'supplement'],
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
  // C：第三轮进行中
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
  geBatch({
    id: 'batch-ge-mpu-i-draft',
    scope: 'MPU',
    tier: 'I',
    status: 'draft',
    courseCount: 20,
  }),
  geBatch({
    id: 'batch-ge-sci-i',
    scope: 'SCI',
    tier: 'I',
    status: 'active',
    courseCount: 20,
    /** Demo：已结束，展示钉第一轮 */
    demoActiveRound: 'preselect',
    demoClosedRounds: ['preselect', 'main', 'supplement'],
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
  }),
  geBatch({
    id: 'batch-ge-hum-ii',
    scope: 'HUM',
    tier: 'II',
    status: 'draft',
    courseCount: 20,
  }),
  geBatch({
    id: 'batch-ge-fin-i',
    scope: 'FIN',
    tier: 'I',
    status: 'draft',
    courseCount: 20,
  }),
  meBatch({
    id: 'batch-me-eee-ii',
    dept: 'EEE',
    tier: 'II',
    status: 'closed',
    courseCount: 20,
    rounds: { ...FULL_ROUNDS },
    roundsByAudience: {
      senior: { ...FULL_ROUNDS, resultReleaseAt: '10-Sep-2025 19:00:00' },
      freshman: { ...FULL_ROUNDS },
    },
    roundsSummary: 'R1 25-Aug–28-Aug · R2 31-Aug–04-Sep · R3 07-Sep–09-Sep · Closed',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoClosedRounds: ['preselect', 'main', 'supplement'],
  }),
  // GE：HUM / BUS / MPU 进行中 + SCI 关窗；课表与轮次状态错开
  {
    id: 'batch-2504-g1',
    // 原名 GE General Studies Selection… 已改为 HUM 句式
    name: geName('HUM', 'I'),
    academicSession: SESSION,
    type: 'GE',
    status: 'active',
    roundsSummary: 'R1 01-Sep–03-Sep · R2 06-Sep–08-Sep · R3 11-Sep–12-Sep',
    ...withScopeRules([]),
    /** Demo：当前第一轮可操作 */
    demoActiveRound: 'preselect',
    demoClosedRounds: [],
    volunteerFinalConfirmedAt: null,
    creditMin: 4,
    creditMax: 8,
    courseCount: 16,
    rounds: {
      preselect: { start: '01-Sep-2025', end: '03-Sep-2025' },
      main: { start: '06-Sep-2025', end: '08-Sep-2025' },
      supplement: { start: '11-Sep-2025', end: '12-Sep-2025' },
    },
    addDropWindow: { start: '15-Sep-2025 00:00:00', end: '26-Sep-2025 17:00:00' },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-g1',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('GE', '', SESSION),
  },
  {
    id: 'batch-2504-g2',
    name: geName('BUS', 'I'),
    academicSession: SESSION,
    type: 'GE',
    status: 'active',
    roundsSummary: 'R1 01-Sep–03-Sep · R2 06-Sep–08-Sep',
    ...withScopeRules([]),
    /** Demo：当前第二轮可操作；第一轮关闭 */
    demoActiveRound: 'main',
    demoClosedRounds: ['preselect'],
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    creditMin: 3,
    creditMax: 6,
    courseCount: 10,
    rounds: {
      preselect: { start: '01-Sep-2025', end: '03-Sep-2025' },
      main: { start: '06-Sep-2025', end: '08-Sep-2025' },
      supplement: { start: '', end: '' },
    },
    addDropWindow: { start: '15-Sep-2025 00:00:00', end: '26-Sep-2025 17:00:00' },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-g2',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('GE', '', SESSION),
  },
  {
    id: 'batch-2504-g3',
    name: geName('MPU', 'II'),
    academicSession: SESSION,
    type: 'GE',
    status: 'active',
    roundsSummary: 'R1 01-Sep–03-Sep · R2 06-Sep–08-Sep · R3 11-Sep–12-Sep',
    ...withScopeRules([]),
    /** Demo：当前第三轮可操作；一二轮关闭 */
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
    addDropWindow: { start: '15-Sep-2025 00:00:00', end: '26-Sep-2025 17:00:00' },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-g3',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('GE', '', SESSION),
  },
  {
    id: 'batch-2502-me-closed',
    name: 'Major Elective Selection 2025/02 Academic Session',
    academicSession: '2025/02',
    type: 'ME',
    programme: 'SWE',
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
    courseCount: 20,
    rounds: {
      preselect: { start: '10-Jan-2025', end: '12-Jan-2025' },
      main: { start: '15-Jan-2025', end: '20-Jan-2025' },
      supplement: { start: '21-Jan-2025', end: '22-Jan-2025' },
    },
    roundsByAudience: {
      senior: {
        preselect: { start: '10-Jan-2025', end: '12-Jan-2025' },
        main: { start: '15-Jan-2025', end: '20-Jan-2025' },
        supplement: { start: '21-Jan-2025', end: '22-Jan-2025' },
        resultReleaseAt: '22-Jan-2025 19:00:00',
      },
      freshman: {
        preselect: { start: '10-Jan-2025', end: '12-Jan-2025' },
        main: { start: '15-Jan-2025', end: '20-Jan-2025' },
        supplement: { start: '21-Jan-2025', end: '22-Jan-2025' },
      },
    },
    volunteerFinalConfirmedAt: '2025-01-13T10:00:00',
    demoClosedRounds: ['preselect', 'main', 'supplement'],
    addDropWindow: { ...DEMO_ADD_DROP_WINDOW_SHORT },
    termKind: TERM_KIND_SHORT,
    dropDeadlineWeek: 1,
    notifyTemplate: 'default-me',
  },
]

function withAudienceRounds(item) {
  const empty = {
    preselect: { start: '', end: '' },
    main: { start: '', end: '' },
    supplement: { start: '', end: '' },
  }
  const useMailDemo =
    item.academicSession === SESSION && (item.status === 'active' || item.id?.includes('2504'))
  const senior = useMailDemo
    ? { ...DEMO_SENIOR_ROUNDS_202604 }
    : {
        ...(item.roundsByAudience?.senior || item.rounds || empty),
        resultReleaseAt: item.roundsByAudience?.senior?.resultReleaseAt || DEMO_SENIOR_ROUNDS_202604.resultReleaseAt,
      }
  const freshman = useMailDemo
    ? { ...DEMO_FRESHMAN_ROUNDS_202604 }
    : item.roundsByAudience?.freshman || { ...empty }
  const roundsByAudience = { senior, freshman }
  return {
    ...item,
    rounds: syncLegacyRoundsFromAudience(roundsByAudience),
    roundsByAudience,
  }
}

export const registrationBatches = ref(initialBatches.map((item) => withAudienceRounds({ ...item })))

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

/** 列表：老生/新生两套轮次摘要 */
export function formatDualAudienceRoundsSummary(batch, addDropWindow) {
  const by = ensureRoundsByAudience(batch)
  const senior = [
    formatRoundRange(by.senior.preselect),
    formatRoundRange(by.senior.main),
    formatRoundRange(by.senior.supplement),
  ]
    .filter((p) => p && p !== '—')
    .join(' · ')
  const freshman = [
    formatRoundRange(by.freshman.preselect),
    formatRoundRange(by.freshman.main),
    formatRoundRange(by.freshman.supplement),
  ]
    .filter((p) => p && p !== '—')
    .join(' · ')
  const parts = []
  if (senior) parts.push(`S: ${senior}`)
  if (freshman) parts.push(`F: ${freshman}`)
  const ad = formatRoundRange(addDropWindow || batch?.addDropWindow)
  if (ad && ad !== '—') parts.push(ad)
  return parts.join(' | ') || formatRoundsSummary(batch?.rounds, addDropWindow)
}

/** 列表/导出：DD/MM/YYYY HH:mm:ss 时间段（旧纯日期展示补 00:00:00） */
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
export function listConfiguredRoundKeys(batch, audience) {
  const rounds = audience
    ? ensureRoundsByAudience(batch)[audience === 'freshman' ? 'freshman' : 'senior']
    : batch?.rounds
  if (!rounds) return []
  const keys = ['preselect', 'main', 'supplement']
  return keys.filter((key) => isRoundTimeConfigured(rounds[key]))
}

/**
 * 学生端默认轮次：优先 demoActiveRound（且已配置），否则第一个已配置轮次
 * @param {object|null} batch 批次
 * @returns {string}
 */
export function getStudentDefaultRoundKey(batch, audience) {
  const configured = listConfiguredRoundKeys(batch, audience)
  if (!configured.length) return 'preselect'
  const preferred = batch?.demoActiveRound
  if (preferred && configured.includes(preferred)) return preferred
  return configured[0]
}

/**
 * 学生端「当前开放轮」：优先 demoActiveRound 且未关闭；否则第一个已配置且未关闭的轮
 * @param {object|null} batch 批次
 * @param {string} [audience] 受众
 * @returns {string|null} 无开放轮时 null
 */
export function getStudentCurrentOpenRoundKey(batch, audience) {
  if (!batch) return null
  const configured = listConfiguredRoundKeys(batch, audience)
  if (!configured.length) return null
  const preferred = batch?.demoActiveRound
  if (
    preferred &&
    configured.includes(preferred) &&
    isBatchRoundOpenForRegistration(batch, preferred)
  ) {
    return preferred
  }
  return configured.find((key) => isBatchRoundOpenForRegistration(batch, key)) || null
}

/**
 * 轮次是否允许学生切换选中（仅当前开放轮）
 * @param {object|null} batch 批次
 * @param {string} roundKey 轮次
 * @param {string} [audience] 受众
 */
export function isStudentRoundSelectable(batch, roundKey, audience) {
  const openKey = getStudentCurrentOpenRoundKey(batch, audience)
  if (!openKey) return false
  return openKey === roundKey
}

/**
 * 学生可选进行中批次（按 GE/ME）
 * @param {'GE'|'ME'|string} type 类型
 */
export function listStudentSelectableBatchesByType(type) {
  const kind = type === 'GE' ? 'GE' : 'ME'
  return listStudentSelectableBatches().filter((item) => item.type === kind)
}

/**
 * 按类型取当前开放批：该类型 active 中「存在当前开放轮」的第一条（数据源顺序）
 * @param {'GE'|'ME'|string} type 类型
 * @param {string} [audience] 受众
 * @returns {object|null}
 */
export function getCurrentOpenBatchByType(type, audience) {
  return (
    listStudentSelectableBatchesByType(type).find((batch) =>
      Boolean(getStudentCurrentOpenRoundKey(batch, audience)),
    ) || null
  )
}

/**
 * 目录点选类型：优先当前开放批；无开放则取该类型第一条 active（列表只读预览）
 * @param {'GE'|'ME'|string} type 类型
 * @param {string} [audience] 受众
 * @returns {{ batch: object|null, isOpen: boolean }}
 */
export function resolveBatchForTypeEntry(type, audience) {
  const open = getCurrentOpenBatchByType(type, audience)
  if (open) return { batch: open, isOpen: true }
  const first = listStudentSelectableBatchesByType(type)[0] || null
  return { batch: first, isOpen: false }
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
  const roundsByAudience = payload.roundsByAudience || {
    senior: { ...rounds, resultReleaseAt: DEMO_SENIOR_ROUNDS_202604.resultReleaseAt },
    freshman: {
      preselect: { start: '', end: '' },
      main: { start: '', end: '' },
      supplement: { start: '', end: '' },
    },
  }
  const item = {
    id: createBatchId(),
    status: 'draft',
    courseCount: 0,
    preselectPriority: { preferSenior: false, minSemestersAbove: 1 },
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota(payload.type || 'GE', payload.programme || '', payload.academicSession || ''),
    ...payload,
    rounds,
    roundsByAudience,
    addDropWindow,
    roundsSummary:
      payload.roundsSummary ||
      formatDualAudienceRoundsSummary({ rounds, roundsByAudience, addDropWindow }, addDropWindow),
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
