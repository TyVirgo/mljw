import { ref } from 'vue'
import { formatIntakeBatch } from '../intakeSets.js'
import { registrationBatches } from './registrationBatches.js'
import { getBatchScopeRules, matchScopeRule, resolveEffectiveScopeRulesForRound, deriveGlobalScopeRuleFromProgrammePlan } from './batchScopeRules.js'
import {
  listAdminAddStudentCandidates,
  filterAdminAddStudentCandidates,
  getAdminAddStudentFilterOptions,
} from './registrationResult.js'

/**
 * 批次学生选课名单（原型）
 * - eligible：按参与范围展开的可选学生
 * - special：特殊例外名单
 * - DEMO_STUDENT_POOL：按单条 scopeRule 匹配人数/名单的共享池（单队列 ≥20，规模错开）
 */

/** @param {string} intake */
function toDisplayIntake(intake) {
  return formatIntakeBatch(intake) || String(intake || '')
}

const GIVEN_NAMES = [
  'Wei Ming',
  'Jia Hui',
  'Mei Ling',
  'Kai Xin',
  'Jun Hao',
  'Hui Min',
  'Li Wei',
  'Xiao',
  'Rui',
  'Amani',
  'Nurhaliza',
  'Sharma',
  'Kumar',
  'Ali',
  'Chen',
  'Wong',
  'Tan',
  'Lim',
  'Ng',
  'Goh',
  'Zhang',
  'Wang',
  'Huang',
  'Farah',
  'Priya',
]

const SURNAMES = [
  'Tan',
  'Lim',
  'Wong',
  'Lee',
  'Chong',
  'Ng',
  'Goh',
  'Chen',
  'Zhang',
  'Wang',
  'Huang',
  'Ahmad',
  'Siti',
  'Raj',
  'Li',
]

/**
 * @param {{ faculty: string, programme: string, intake: string, count: number }} opts
 */
function buildCohort({ faculty, programme, intake, count }) {
  const compact = String(intake).replace('/', '')
  const rows = []
  for (let i = 1; i <= count; i += 1) {
    const given = GIVEN_NAMES[(i * 3 + programme.length) % GIVEN_NAMES.length]
    const surname = SURNAMES[(i * 5 + compact.length) % SURNAMES.length]
    rows.push({
      studentId: `${programme}${compact}${String(i).padStart(3, '0')}`,
      studentName: `${surname} ${given}`,
      source: i % 11 === 0 ? 'resumption' : 'scope',
      programme,
      intake,
      faculty,
    })
  }
  return rows
}

/** 共享学生池：各学院×专业×批次规模 ≥20 且规模互不相同 */
export const DEMO_STUDENT_POOL = [
  ...buildCohort({
    faculty: 'School of Energy and Chemical Engineering',
    programme: 'CHS',
    intake: '2024/09',
    count: 22,
  }),
  ...buildCohort({
    faculty: 'School of Energy and Chemical Engineering',
    programme: 'CHS',
    intake: '2025/04',
    count: 25,
  }),
  ...buildCohort({
    faculty: 'School of Energy and Chemical Engineering',
    programme: 'MAT',
    intake: '2024/09',
    count: 21,
  }),
  ...buildCohort({
    faculty: 'School of Energy and Chemical Engineering',
    programme: 'PHY',
    intake: '2025/04',
    count: 24,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'SWE',
    intake: '2024/09',
    count: 28,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'SWE',
    intake: '2025/04',
    count: 31,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'COS',
    intake: '2024/09',
    count: 23,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'COS',
    intake: '2025/04',
    count: 27,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'DSA',
    intake: '2024/09',
    count: 20,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'DSA',
    intake: '2025/04',
    count: 29,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'AIT',
    intake: '2024/09',
    count: 33,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'AIT',
    intake: '2025/04',
    count: 26,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'CST',
    intake: '2024/09',
    count: 34,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'CST',
    intake: '2025/04',
    count: 30,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'CSN',
    intake: '2024/09',
    count: 35,
  }),
  ...buildCohort({
    faculty: 'School of Information',
    programme: 'DS',
    intake: '2025/04',
    count: 32,
  }),
  ...buildCohort({
    faculty: 'School of Computing',
    programme: 'CST',
    intake: '2025/04',
    count: 36,
  }),
  ...buildCohort({
    faculty: 'School of Business',
    programme: 'BUS',
    intake: '2025/04',
    count: 37,
  }),
  ...buildCohort({
    faculty: 'School of Business',
    programme: 'ACC',
    intake: '2025/04',
    count: 38,
  }),
]

const DEMO_ELIGIBLE = DEMO_STUDENT_POOL.filter((row) =>
  ['SWE', 'COS', 'DSA', 'AIT'].includes(row.programme),
)

const DEMO_SPECIAL = [
  {
    studentId: 'BUS2409020',
    studentName: 'Wong Mei Ling',
    source: 'special',
    programme: 'BUS',
    intake: '2024/09',
    faculty: 'School of Business',
    selectable: true,
    remark: 'Cross-faculty elective permit',
  },
  {
    studentId: 'HUM2504003',
    studentName: 'Nurul Aina',
    source: 'special',
    programme: 'HUM',
    intake: '2025/04',
    faculty: 'School of Humanities',
    selectable: true,
    remark: 'BOA approved credit overload cohort',
  },
]

function cloneRows(rows) {
  return rows.map((row) => ({ ...row }))
}

function matchScope(student, scopeEntries) {
  if (!scopeEntries?.length) return true
  return scopeEntries.some((entry) => {
    const raw = String(entry || '')
    if (raw.toLowerCase().startsWith('all programmes')) {
      const intake = raw.split('×')[1]?.trim()
      if (!intake) return true
      return toDisplayIntake(student.intake) === toDisplayIntake(intake)
    }
    const [programme, intake] = raw.split('×').map((part) => part.trim())
    if (programme && student.programme !== programme) return false
    if (intake && toDisplayIntake(student.intake) !== toDisplayIntake(intake)) return false
    return true
  })
}

function buildEligibleForBatch(batch) {
  if (Array.isArray(batch?.scopeRules) && batch.scopeRules.length) {
    return cloneRows(DEMO_STUDENT_POOL).filter((row) =>
      batch.scopeRules.some((rule) =>
        matchScopeRule(rule, {
          faculty: row.faculty,
          intake: row.intake,
          programme: row.programme,
        }),
      ),
    )
  }
  const scope = batch?.scope || []
  return cloneRows(DEMO_ELIGIBLE).filter((row) => matchScope(row, scope))
}

function ensureBatchRoster(batchId) {
  if (!batchStudentRosters.value[batchId]) {
    const batch = registrationBatches.value.find((item) => item.id === batchId)
    batchStudentRosters.value[batchId] = {
      eligible: buildEligibleForBatch(batch),
      special: cloneRows(DEMO_SPECIAL),
    }
  }
  return batchStudentRosters.value[batchId]
}

/** @type {import('vue').Ref<Record<string, { eligible: object[], special: object[] }>>} */
export const batchStudentRosters = ref({})

/** 按单条参与范围规则匹配的学生名单（与其它行独立） */
export function listStudentsForScopeRule(rule) {
  if (!rule) return []
  return cloneRows(DEMO_STUDENT_POOL).filter((row) =>
    matchScopeRule(rule, {
      faculty: row.faculty,
      intake: row.intake,
      programme: row.programme,
    }),
  )
}

export function countStudentsForScopeRule(rule) {
  return listStudentsForScopeRule(rule).length
}

/**
 * 按批次 + 选课轮次聚合可选学生（该轮生效规则并集，按学号去重）。
 * 该轮无专属规则时回退培养方案全局参与范围。
 * @param {object|null} batch
 * @param {'preselect'|'main'|'supplement'} roundKey
 */
export function listStudentsForBatchRound(batch, roundKey) {
  if (!batch || !roundKey) return []
  const roundOverride = getBatchScopeRules(batch).some((rule) => (rule?.round || '') === roundKey)
  const rules = resolveEffectiveScopeRulesForRound(batch, roundKey)
  if (!rules.length) return []
  const byId = new Map()
  for (const rule of rules) {
    for (const row of listStudentsForScopeRule(rule)) {
      byId.set(row.studentId, row)
    }
  }
  let rows = [...byId.values()]
  rows.sort((a, b) => String(a.studentId).localeCompare(String(b.studentId)))
  // 仅轮次特例时拉开观感；走全局时三轮名单一致
  if (!roundOverride) return rows
  if (roundKey === 'main') {
    rows = rows.filter((_, i) => i % 3 !== 2)
  } else if (roundKey === 'supplement') {
    rows = rows.filter((_, i) => i % 2 === 0).reverse()
  } else if (batch.status === 'draft') {
    rows = rows.slice(0, Math.min(rows.length, 12))
  } else if (batch.status === 'closed') {
    rows = rows.slice(0, Math.min(rows.length, Math.max(8, rows.length - 2)))
  }
  return rows
}

/**
 * 批次全局参与名单（培养方案推导，与轮次无关）。
 * @param {object|null} batch
 */
export function listGlobalBatchParticipants(batch) {
  if (!batch) return []
  const rule = deriveGlobalScopeRuleFromProgrammePlan(batch)
  if (!rule) return []
  const rows = listStudentsForScopeRule(rule)
  rows.sort((a, b) => String(a.studentId).localeCompare(String(b.studentId)))
  return rows
}

export function countGlobalBatchParticipants(batch) {
  return listGlobalBatchParticipants(batch).length
}

const BATCH_ROSTER_ROUNDS = ['preselect', 'main', 'supplement']

/**
 * 可选课人数 = 全局名单 ∪ 三轮可选名单 ∪ 特殊名单（按学号去重）。
 * 轮次未设范围时回退全局，并集不会把同一人重复累计。
 * @param {object|null} batch
 */
export function countEligibleStudentsAcrossRounds(batch) {
  if (!batch) return 0
  const ids = new Set()
  for (const row of listGlobalBatchParticipants(batch)) {
    if (row?.studentId) ids.add(String(row.studentId))
  }
  for (const roundKey of BATCH_ROSTER_ROUNDS) {
    for (const row of listStudentsForBatchRound(batch, roundKey)) {
      if (row?.studentId) ids.add(String(row.studentId))
    }
  }
  for (const row of listBatchRosterStudents(batch.id, 'special')) {
    if (row?.studentId) ids.add(String(row.studentId))
  }
  return ids.size
}

export function listBatchRosterStudents(batchId, listType = 'eligible') {
  if (!batchId) return []
  const roster = ensureBatchRoster(batchId)
  return listType === 'special' ? roster.special : roster.eligible
}

export function filterBatchRosterStudents(rows, filters = {}) {
  let list = [...rows]
  const studentId = String(filters.studentId || '').trim().toLowerCase()
  const studentName = String(filters.studentName || '').trim().toLowerCase()
  const keyword = String(filters.keyword || '').trim().toLowerCase()
  if (studentId) {
    list = list.filter((row) => String(row.studentId || '').toLowerCase().includes(studentId))
  }
  if (studentName) {
    list = list.filter((row) => String(row.studentName || '').toLowerCase().includes(studentName))
  }
  if (keyword && !studentId && !studentName) {
    list = list.filter(
      (row) =>
        String(row.studentId || '')
          .toLowerCase()
          .includes(keyword) ||
        String(row.studentName || '')
          .toLowerCase()
          .includes(keyword),
    )
  }
  if (filters.source) {
    list = list.filter((row) => row.source === filters.source)
  }
  if (filters.programmeIntake) {
    const key = String(filters.programmeIntake).toLowerCase()
    list = list.filter((row) => `${row.programme}×${row.intake}`.toLowerCase() === key)
  }
  if (filters.intake) {
    const key = toDisplayIntake(filters.intake)
    list = list.filter((row) => toDisplayIntake(row.intake) === key)
  }
  if (filters.faculty) {
    list = list.filter((row) => row.faculty === filters.faculty)
  }
  if (filters.programme) {
    const key = String(filters.programme).trim().toLowerCase()
    if (key) {
      list = list.filter((row) => String(row.programme || '').toLowerCase().includes(key))
    }
  }
  return list
}

export function removeBatchRosterStudent(batchId, listType, studentId) {
  const roster = ensureBatchRoster(batchId)
  const key = listType === 'special' ? 'special' : 'eligible'
  const before = roster[key].length
  roster[key] = roster[key].filter((row) => row.studentId !== studentId)
  return { ok: roster[key].length < before }
}

/** 按学号在演示池中查找学生 */
export function findDemoStudentById(studentId) {
  const id = String(studentId || '').trim()
  if (!id) return null
  return DEMO_STUDENT_POOL.find((row) => row.studentId === id) || null
}

/** 供新增弹窗选择：排除已在特殊名单中的学生 */
export function listDemoStudentsForSpecialPick(batchId, keyword = '') {
  return listSpecialPickCandidates(batchId, { keyword })
}

/** 特殊名单选择器筛选项（与添加学生选课同源） */
export function getSpecialPickFilterOptions() {
  return getAdminAddStudentFilterOptions()
}

/**
 * 特殊名单学生选择器候选人：与「添加学生选课」同源，排除已在特殊名单者
 * @param {string} batchId
 * @param {{ studentId?: string, studentName?: string, faculty?: string, keyword?: string }} filters
 */
export function listSpecialPickCandidates(batchId, filters = {}) {
  const roster = ensureBatchRoster(batchId)
  const existing = new Set(roster.special.map((row) => row.studentId))
  let list = listAdminAddStudentCandidates().filter((row) => !existing.has(row.studentId))

  const keyword = String(filters.keyword || '').trim().toLowerCase()
  if (keyword && !filters.studentId && !filters.studentName) {
    list = list.filter(
      (row) =>
        String(row.studentId).toLowerCase().includes(keyword) ||
        String(row.studentName).toLowerCase().includes(keyword) ||
        String(row.programme || '').toLowerCase().includes(keyword),
    )
  }

  return filterAdminAddStudentCandidates(list, filters)
}

/**
 * 新增整批特殊学生
 * @returns {{ ok: boolean, errorKey?: string, item?: object }}
 */
export function addBatchSpecialStudent(batchId, payload = {}) {
  if (!batchId) return { ok: false, errorKey: 'courseRegistration.batch.specialInvalidBatch' }
  const studentId = String(payload.studentId || '').trim()
  if (!studentId) return { ok: false, errorKey: 'courseRegistration.batch.specialStudentRequired' }

  const roster = ensureBatchRoster(batchId)
  if (roster.special.some((row) => row.studentId === studentId)) {
    return { ok: false, errorKey: 'courseRegistration.batch.specialAlreadyExists' }
  }

  const fromPool = findDemoStudentById(studentId)
  const item = {
    studentId,
    studentName: payload.studentName || fromPool?.studentName || studentId,
    source: 'special',
    programme: payload.programme || fromPool?.programme || '',
    intake: payload.intake || fromPool?.intake || '',
    faculty: payload.faculty || fromPool?.faculty || '',
    selectable: payload.selectable !== false,
    remark: String(payload.remark || '').trim(),
  }
  roster.special = [item, ...roster.special]
  return { ok: true, item }
}

/** 批量删除特殊学生 */
export function removeBatchSpecialStudents(batchId, studentIds = []) {
  const ids = new Set(
    (Array.isArray(studentIds) ? studentIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  )
  if (!batchId || !ids.size) return { ok: false, removed: 0 }
  const roster = ensureBatchRoster(batchId)
  const before = roster.special.length
  roster.special = roster.special.filter((row) => !ids.has(row.studentId))
  return { ok: true, removed: before - roster.special.length }
}

/**
 * 批量更新特殊学生的是否可选与备注（覆盖）
 * @returns {{ ok: boolean, errorKey?: string, updated?: number }}
 */
export function updateBatchSpecialStudents(batchId, studentIds = [], payload = {}) {
  if (!batchId) return { ok: false, errorKey: 'courseRegistration.batch.specialInvalidBatch' }
  const ids = new Set(
    (Array.isArray(studentIds) ? studentIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  )
  if (!ids.size) return { ok: false, errorKey: 'courseRegistration.batch.specialSelectFirst' }

  const roster = ensureBatchRoster(batchId)
  const remark = String(payload.remark ?? '').trim()
  const selectable = payload.selectable !== false
  let updated = 0
  roster.special = roster.special.map((row) => {
    if (!ids.has(row.studentId)) return row
    updated += 1
    return { ...row, selectable, remark }
  })
  return { ok: true, updated }
}

/**
 * 按学号导入特殊名单（演示：仅匹配学生池）
 * @returns {{ ok: boolean, added: number, skippedExist: number, skippedUnknown: string[] }}
 */
export function importBatchSpecialStudents(batchId, studentIds = []) {
  const ids = [...new Set((studentIds || []).map((id) => String(id || '').trim()).filter(Boolean))]
  let added = 0
  let skippedExist = 0
  const skippedUnknown = []
  for (const studentId of ids) {
    const fromPool = findDemoStudentById(studentId)
    if (!fromPool) {
      skippedUnknown.push(studentId)
      continue
    }
    const result = addBatchSpecialStudent(batchId, {
      ...fromPool,
      selectable: true,
      remark: '',
    })
    if (result.ok) added += 1
    else if (result.errorKey === 'courseRegistration.batch.specialAlreadyExists') skippedExist += 1
  }
  return { ok: true, added, skippedExist, skippedUnknown }
}

export function getBatchRosterProgrammeIntakeOptions(batchId) {
  const roster = ensureBatchRoster(batchId)
  const keys = new Set()
  for (const row of [...roster.eligible, ...roster.special]) {
    keys.add(`${row.programme}×${row.intake}`)
  }
  return [...keys].sort()
}

export function getScopeRuleRosterFilterOptions(rows = []) {
  const intakes = new Set()
  const faculties = new Set()
  for (const row of rows) {
    if (row.intake) intakes.add(toDisplayIntake(row.intake))
    if (row.faculty) faculties.add(row.faculty)
  }
  return {
    intakes: [...intakes].sort().reverse(),
    faculties: [...faculties].sort(),
  }
}

export function formatRosterIntake(intake) {
  return toDisplayIntake(intake)
}

export const rosterSourceOptions = ['scope', 'resumption', 'special']
