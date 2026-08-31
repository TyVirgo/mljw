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
import { buildDemoSelectionGroups } from './courseSelectionGroups.js'

const SESSION = '2026/04'
/** 默认完整三轮（顺序：R1 → 公布 → R2 → R3）；草稿可空二三轮 */
const R1_ONLY_ROUNDS = {
  preselect: { start: '25-Aug-2025 00:00:00', end: '28-Aug-2025 18:00:00' },
  main: { start: '', end: '' },
  supplement: { start: '', end: '' },
}
const FULL_ROUNDS = {
  preselect: { start: '25-Aug-2025 00:00:00', end: '28-Aug-2025 18:00:00' },
  main: { start: '01-Sep-2025 00:00:00', end: '04-Sep-2025 23:59:00' },
  supplement: { start: '07-Sep-2025 00:00:00', end: '09-Sep-2025 23:59:00' },
}
const FULL_ROUNDS_RELEASE = '30-Aug-2025 19:00:00'
/** 已配满三轮的演示窗（相对 2026 暑期） */
const R2_OPEN_ROUNDS = {
  preselect: { start: '25-Jul-2026 00:00:00', end: '05-Aug-2026 18:00:00' },
  main: { start: '10-Aug-2026 00:00:00', end: '20-Aug-2026 23:59:00' },
  supplement: { start: '21-Aug-2026 00:00:00', end: '28-Aug-2026 23:59:00' },
}
const R2_OPEN_RELEASE = '08-Aug-2026 19:00:00'
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
  programme = '',
  ...rest
}) {
  const rules = scopeRules || []
  return {
    id,
    name: geName(scope, tier),
    academicSession: SESSION,
    type: 'GE',
    programme: programme || (scope === 'HUM' || scope === 'BUS' || scope === 'MPU' || scope === 'SCI' || scope === 'FIN' ? '' : scope),
    status,
    roundsSummary: 'R1 25-Aug–28-Aug',
    ...withScopeRules(rules),
    creditMin: 4,
    creditMax: 8,
    courseCount,
    rounds: { ...R1_ONLY_ROUNDS },
    roundsByAudience: {
      senior: { ...R1_ONLY_ROUNDS, resultReleaseAt: FULL_ROUNDS_RELEASE },
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
      senior: { ...R1_ONLY_ROUNDS, resultReleaseAt: FULL_ROUNDS_RELEASE },
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
 * 学生端 demo 矩阵（开闭只认 demoActiveRound / demoClosedRounds；按 programme 过滤）：
 * 默认演示专业 SWE — GE/ME 各三档：R1 / R2 / R3 进行中
 * （进行中,待开放,待开放）/（已结束,进行中,待开放）/（已结束,已结束,进行中）
 * batch-2504-m1 兼学生课表主批。
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
    volunteerFinalConfirmedAt: null,
    demoResultReleaseFixed: {
      released: false,
      displayAt: '18/08/2026 19:00:00',
      remainingDays: 5,
      remainingHours: 12,
    },
    roundsByAudience: {
      senior: { ...R1_ONLY_ROUNDS, resultReleaseAt: '18-Aug-2026 19:00:00' },
      freshman: {
        preselect: { start: '', end: '' },
        main: { start: '', end: '' },
        supplement: { start: '', end: '' },
      },
    },
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
      senior: { ...FULL_ROUNDS, resultReleaseAt: '18-Aug-2026 19:00:00' },
      freshman: { ...FULL_ROUNDS },
    },
    roundsSummary: 'R1 25-Aug–28-Aug · R2 31-Aug–04-Sep · R3 07-Sep–09-Sep · Closed',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoResultReleaseFixed: {
      released: true,
      displayAt: '18/08/2026 19:00:00',
    },
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
        resultReleaseAt: FULL_ROUNDS_RELEASE,
      },
      freshman: {
        preselect: { start: '26-Aug-2025 00:00:00', end: '29-Aug-2025 12:00:00' },
        main: { start: '01-Sep-2025 00:00:00', end: '04-Sep-2025 23:59:00' },
        supplement: { start: '07-Sep-2025 00:00:00', end: '09-Sep-2025 23:59:00' },
      },
    },
    roundsSummary: 'R1 25-Aug–28-Aug · 公布 30-Aug · R2 01–04-Sep · R3 07–09-Sep',
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
    /** 3 组 demo：4选3 / 3选2 / 2选1，组块排在普通课之前 */
    selectionGroups: buildDemoSelectionGroups('me-m1', '2025/09', [
      { courseCodes: ['IT102', 'COMP220', 'MATH201', 'STAT201'], minPick: 3 },
      { courseCodes: ['AI110', 'WEB210', 'PHYS101'], minPick: 2 },
      { courseCodes: ['EMB210', 'STAT301'], minPick: 1 },
    ]),
  }),
  // SWE 第二轮进行中（同专业 demo 档 II）
  meBatch({
    id: 'batch-me-cst-i',
    dept: 'SWE',
    tier: 'II',
    status: 'active',
    courseCount: 14,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoActiveRound: 'main',
    demoClosedRounds: ['preselect'],
    rounds: { ...R2_OPEN_ROUNDS },
    roundsByAudience: {
      senior: { ...R2_OPEN_ROUNDS, resultReleaseAt: R2_OPEN_RELEASE },
      freshman: { ...R2_OPEN_ROUNDS },
    },
    roundsSummary: 'R1 25-Jul–05-Aug · 公布 08-Aug · R2 10–20-Aug · R3 21–28-Aug',
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
        intakes: ['2024/09', '2025/04'],
        programmes: ['SWE'],
        groupName: '',
        round: 'main',
      },
      {
        faculties: ['School of Information'],
        intakes: ['All'],
        programmes: ['SWE'],
        groupName: '',
        round: 'supplement',
      },
    ],
    selectionGroups: buildDemoSelectionGroups('me-cst', '2025/09', [
      { courseCodes: ['CST201', 'CST202', 'CST203', 'CST204'], minPick: 3 },
      { courseCodes: ['CST205', 'CST206', 'CST207'], minPick: 2 },
      { courseCodes: ['CST208', 'CST209'], minPick: 1 },
    ]),
  }),
  // 其他专业关窗样例（学生端按 programme 过滤，SWE 不可见）
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
        programmes: ['COS'],
        groupName: '',
        round: 'preselect',
      },
    ],
  }),
  // SWE 第三轮进行中（同专业 demo 档 III）
  meBatch({
    id: 'batch-me-cys-i',
    dept: 'SWE',
    tier: 'III',
    status: 'active',
    courseCount: 12,
    faculty: 'School of Information',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoActiveRound: 'supplement',
    demoClosedRounds: ['preselect', 'main'],
    rounds: { ...R2_OPEN_ROUNDS },
    roundsByAudience: {
      senior: { ...R2_OPEN_ROUNDS, resultReleaseAt: R2_OPEN_RELEASE },
      freshman: { ...R2_OPEN_ROUNDS },
    },
    roundsSummary: 'R1 25-Jul–05-Aug · 公布 08-Aug · R2 10–20-Aug · R3 21–28-Aug',
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
        programmes: ['SWE'],
        groupName: '',
        round: 'main',
      },
      {
        faculties: ['School of Information'],
        intakes: ['All'],
        programmes: ['SWE'],
        groupName: '',
        round: 'supplement',
      },
    ],
    selectionGroups: buildDemoSelectionGroups('me-cys', '2025/09', [
      { courseCodes: ['CYS201', 'CYS202', 'CYS203', 'CYS204'], minPick: 3 },
      { courseCodes: ['CYS205', 'CYS206', 'CYS207'], minPick: 2 },
      { courseCodes: ['CYS208', 'CYS209'], minPick: 1 },
    ]),
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
    programme: 'SCI',
    /** 其他专业关窗样例；SWE 学生端不可见 */
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
      senior: { ...FULL_ROUNDS, resultReleaseAt: FULL_ROUNDS_RELEASE },
      freshman: { ...FULL_ROUNDS },
    },
    roundsSummary: 'R1 25-Aug–28-Aug · R2 31-Aug–04-Sep · R3 07-Sep–09-Sep · Closed',
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoClosedRounds: ['preselect', 'main', 'supplement'],
  }),
  // GE：SWE 同专业三档 R1/R2/R3 进行中
  {
    id: 'batch-2504-g1',
    name: geName('SWE', 'I'),
    academicSession: SESSION,
    type: 'GE',
    programme: 'SWE',
    status: 'active',
    roundsSummary: 'R1 25-Jul–05-Aug · R2 10–20-Aug · R3 21–28-Aug',
    ...withScopeRules([
      {
        faculties: ['School of Information'],
        intakes: ['2024/09', '2025/04'],
        programmes: ['SWE'],
        groupName: '',
        round: 'preselect',
      },
    ]),
    /** Demo：第一轮进行中 */
    demoActiveRound: 'preselect',
    demoClosedRounds: [],
    volunteerFinalConfirmedAt: null,
    demoResultReleaseFixed: {
      released: false,
      displayAt: '18/08/2026 19:00:00',
      remainingDays: 5,
      remainingHours: 12,
    },
    creditMin: 4,
    creditMax: 8,
    courseCount: 16,
    rounds: { ...R2_OPEN_ROUNDS },
    roundsByAudience: {
      senior: { ...R2_OPEN_ROUNDS, resultReleaseAt: '18-Aug-2026 19:00:00' },
      freshman: { ...R2_OPEN_ROUNDS },
    },
    addDropWindow: { start: '15-Sep-2025 00:00:00', end: '26-Sep-2025 17:00:00' },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-g1',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('GE', 'SWE', SESSION),
  },
  {
    id: 'batch-2504-g2',
    name: geName('SWE', 'II'),
    academicSession: SESSION,
    type: 'GE',
    programme: 'SWE',
    status: 'active',
    roundsSummary: 'R1 25-Jul–05-Aug · R2 10–20-Aug · R3 21–28-Aug',
    ...withScopeRules([
      {
        faculties: ['School of Information'],
        intakes: ['2024/09', '2025/04'],
        programmes: ['SWE'],
        groupName: '',
        round: 'main',
      },
    ]),
    /** Demo：第二轮进行中；第一轮关闭 */
    demoActiveRound: 'main',
    demoClosedRounds: ['preselect'],
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    demoResultReleaseFixed: {
      released: true,
      displayAt: '18/08/2026 19:00:00',
    },
    creditMin: 3,
    creditMax: 6,
    courseCount: 10,
    rounds: { ...R2_OPEN_ROUNDS },
    roundsByAudience: {
      senior: { ...R2_OPEN_ROUNDS, resultReleaseAt: R2_OPEN_RELEASE },
      freshman: { ...R2_OPEN_ROUNDS },
    },
    addDropWindow: { start: '15-Sep-2025 00:00:00', end: '26-Sep-2025 17:00:00' },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-g2',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('GE', 'SWE', SESSION),
  },
  {
    id: 'batch-2504-g3',
    name: geName('SWE', 'III'),
    academicSession: SESSION,
    type: 'GE',
    programme: 'SWE',
    status: 'active',
    roundsSummary: 'R1 25-Jul–05-Aug · R2 10–20-Aug · R3 21–28-Aug',
    ...withScopeRules([
      {
        faculties: ['School of Information'],
        intakes: ['2024/09', '2025/04'],
        programmes: ['SWE'],
        groupName: '',
        round: 'supplement',
      },
    ]),
    /** Demo：第三轮进行中；一二轮关闭 */
    demoActiveRound: 'supplement',
    demoClosedRounds: ['preselect', 'main'],
    volunteerFinalConfirmedAt: '2025-09-04T10:00:00',
    creditMin: 2,
    creditMax: 6,
    courseCount: 8,
    rounds: { ...R2_OPEN_ROUNDS },
    roundsByAudience: {
      senior: { ...R2_OPEN_ROUNDS, resultReleaseAt: R2_OPEN_RELEASE },
      freshman: { ...R2_OPEN_ROUNDS },
    },
    addDropWindow: { start: '15-Sep-2025 00:00:00', end: '26-Sep-2025 17:00:00' },
    termKind: TERM_KIND_LONG,
    dropDeadlineWeek: 2,
    notifyTemplate: 'default-g3',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    round1Quota: defaultRound1Quota('GE', 'SWE', SESSION),
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
        resultReleaseAt: '13-Jan-2025 19:00:00',
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

/** 选课结果页 demo：2 GE + 2 ME，公布状态固定 */
export const RESULT_DEMO_BATCH_IDS = [
  'batch-2504-g1',
  'batch-2504-g2',
  'batch-me-chs-senior-i',
  'batch-me-chs-senior-ii',
]

const RESULT_DEMO_BATCH_ID_SET = new Set(RESULT_DEMO_BATCH_IDS)

/** @param {string} batchId */
export function isResultDemoBatch(batchId) {
  return RESULT_DEMO_BATCH_ID_SET.has(String(batchId || '').trim())
}

/** @returns {object[]} */
export function listResultDemoBatches() {
  return RESULT_DEMO_BATCH_IDS.map((id) => getBatchById(id)).filter(Boolean)
}

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

/** 紧凑列表：去掉秒（HH:mm） */
export function formatRoundRangeCompact(range) {
  const text = formatRoundRange(range)
  if (text === '—') return text
  return text.replace(/(\d{2}:\d{2}):\d{2}/g, '$1')
}

/** 列表展示：未配置轮次用文案，避免与「—」空数据混淆时可传入 t */
export function formatRoundRangeDisplay(range, t) {
  const text = formatRoundRange(range)
  if (text !== '—') return text
  if (t) return t('courseRegistration.batch.roundNotConfigured')
  return '—'
}

/** 紧凑列表展示（去秒） */
export function formatRoundRangeDisplayCompact(range, t) {
  const text = formatRoundRangeCompact(range)
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
 * 批次是否对学生专业可见（优先 batch.programme；否则看 scopeRules）
 * @param {object|null} batch
 * @param {string} [programmeCode]
 */
export function batchMatchesStudentProgramme(batch, programmeCode) {
  if (!batch) return false
  const code = String(programmeCode || '').trim()
  if (!code) return true
  const batchProg = String(batch.programme || '').trim()
  if (batchProg) return batchProg === code
  const fromRules = []
  for (const rule of batch.scopeRules || []) {
    if (Array.isArray(rule.programmes)) fromRules.push(...rule.programmes)
    if (rule.programme) fromRules.push(rule.programme)
  }
  if (!fromRules.length) return false
  return fromRules.some((p) => String(p).trim() === code)
}

/**
 * 学生可选进行中批次（按 GE/ME，可选按专业过滤）
 * @param {'GE'|'ME'|string} type 类型
 * @param {string} [programmeCode] 学生专业码；缺省不过滤
 */
export function listStudentSelectableBatchesByType(type, programmeCode) {
  const kind = type === 'GE' ? 'GE' : 'ME'
  return listStudentSelectableBatches().filter((item) => {
    if (item.type !== kind) return false
    if (programmeCode == null || programmeCode === '') return true
    return batchMatchesStudentProgramme(item, programmeCode)
  })
}

/**
 * 入口时间轴：三轮状态（仅认 demo 标志，不跟系统时钟）
 * @param {object|null} batch
 * @param {string} [audience]
 * @returns {{ key: string, status: 'active'|'ended'|'pending' }[]}
 */
export function listStudentRoundTimelineStatuses(batch, audience) {
  const keys = ['preselect', 'main', 'supplement']
  if (!batch) {
    return keys.map((key) => ({ key, status: 'pending' }))
  }
  const configured = listConfiguredRoundKeys(batch, audience)
  const closed = new Set(batch.demoClosedRounds || [])
  const openKey = getStudentCurrentOpenRoundKey(batch, audience)
  return keys.map((key) => {
    if (!configured.includes(key)) {
      return { key, status: 'pending' }
    }
    if (closed.has(key)) return { key, status: 'ended' }
    if (openKey === key) return { key, status: 'active' }
    return { key, status: 'pending' }
  })
}

/** 公布时刻展示（单点） */
export function formatResultReleaseAt(at) {
  const text = batchDateToPicker(String(at || '').trim())
  return text || '—'
}

/**
 * 按类型取当前开放批：该类型 active 中「存在当前开放轮」的第一条（数据源顺序）
 * @param {'GE'|'ME'|string} type 类型
 * @param {string} [audience] 受众
 * @param {string} [programmeCode] 专业码
 * @returns {object|null}
 */
export function getCurrentOpenBatchByType(type, audience, programmeCode) {
  return (
    listStudentSelectableBatchesByType(type, programmeCode).find((batch) =>
      Boolean(getStudentCurrentOpenRoundKey(batch, audience)),
    ) || null
  )
}

/**
 * 目录点选类型：优先当前开放批；无开放则取该类型第一条 active（列表只读预览）
 * @param {'GE'|'ME'|string} type 类型
 * @param {string} [audience] 受众
 * @param {string} [programmeCode] 专业码
 * @returns {{ batch: object|null, isOpen: boolean }}
 */
export function resolveBatchForTypeEntry(type, audience, programmeCode) {
  const open = getCurrentOpenBatchByType(type, audience, programmeCode)
  if (open) return { batch: open, isOpen: true }
  const first = listStudentSelectableBatchesByType(type, programmeCode)[0] || null
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
    round1Quota:
      String(payload.type || '').toUpperCase() === 'ME'
        ? defaultRound1Quota('ME', payload.programme || '', payload.academicSession || '')
        : undefined,
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

/** 删除批次（仅 draft / closed；原型仅移除批次行） */
export function removeRegistrationBatch(id) {
  const batch = getBatchById(id)
  if (!batch) return { ok: false, errorKey: 'courseRegistration.batch.notFound' }
  if (batch.status === 'active') {
    return { ok: false, errorKey: 'courseRegistration.batch.deleteOnlyDraftClosed' }
  }
  registrationBatches.value = registrationBatches.value.filter((item) => item.id !== id)
  return { ok: true }
}

/**
 * 批量删除批次
 * @param {string[]} ids
 * @returns {{ ok: boolean, deletedIds?: string[], skippedIds?: string[] }}
 */
export function removeRegistrationBatches(ids) {
  const uniqueIds = [...new Set((ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const deletedIds = []
  const skippedIds = []
  for (const id of uniqueIds) {
    const result = removeRegistrationBatch(id)
    if (result.ok) deletedIds.push(id)
    else skippedIds.push(id)
  }
  return {
    ok: deletedIds.length > 0,
    deletedIds,
    skippedIds,
  }
}
