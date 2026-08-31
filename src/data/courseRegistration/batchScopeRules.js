import { formatIntakeBatch, intakeOptions, parseIntakeBatch } from '../intakeSets.js'
import { initialProgrammeIntakes, suggestProgrammeIntake } from '../programmeIntakes.js'

function normalizeIntakeLocal(raw) {
  const formatted = formatIntakeBatch(raw)
  if (parseIntakeBatch(formatted)) return formatted
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length >= 4) {
    const compact = digits.slice(-4)
    const year = `20${compact.slice(0, 2)}`
    const month = compact.slice(2)
    return formatIntakeBatch(`${year}/${month}`)
  }
  return ''
}

function parseScopeEntryLocal(entry) {
  const [programme, intake] = String(entry || '').split('×').map((part) => part.trim())
  return { programme, intake }
}

/** 维度「全部」 */
export const SCOPE_DIM_ALL = 'All'

/** Demo：学院选项（与学籍档案 faculty 文案对齐） */
export const batchScopeFacultyOptions = [
  'School of Information',
  'School of Business',
  'School of Computing',
  'School of Energy and Chemical Engineering',
]

/**
 * 入学批次选项（与入学批次模块同格式 YYYY/MM）
 * @deprecated 范围维已改为专业批次；保留供旧数据迁移
 */
export const batchScopeIntakeOptions = [...intakeOptions]

/** @deprecated 使用 batchScopeIntakeOptions */
export const batchScopeGradeOptions = batchScopeIntakeOptions

/**
 * Demo：专业代码
 * @deprecated 范围维已改为专业批次；保留供旧数据迁移
 */
export const batchScopeProgrammeOptions = [
  'SWE',
  'COS',
  'DSA',
  'AIT',
  'CYS',
  'CST',
  'MAT',
  'PHY',
  'MBT',
  'CHS',
  'ACC',
  'FIN',
  'IBU',
  'CSN',
  'DS',
]

/**
 * 专业批次选项（基础数据 programmeIntake 码，如 202509IBU）
 * @returns {string[]}
 */
export function listBatchScopeProgrammeIntakeOptions() {
  const seen = new Set()
  const out = []
  for (const row of initialProgrammeIntakes) {
    const code = String(row?.programmeIntake || '').trim()
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out.sort((a, b) => a.localeCompare(b))
}

/** @type {string[]} 缓存选项（静态 demo） */
export const batchScopeProgrammeIntakeOptions = listBatchScopeProgrammeIntakeOptions()

/** 课程专业范围：图示样例优先，再并入批次专业选项 */
export const COURSE_PROGRAMME_SCOPE_SAMPLE = ['ADT', 'CHS', 'COS', 'ENG', 'JRN']

export const courseProgrammeScopeOptions = (() => {
  const seen = new Set()
  const out = []
  for (const code of [...COURSE_PROGRAMME_SCOPE_SAMPLE, ...batchScopeProgrammeOptions]) {
    if (seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out
})()

/** UI 哨兵：不限（落库为空 programmes，不写入 audience） */
export const COURSE_PROGRAMME_UNLIMITED = '__unlimited__'

/** Demo：分组名称（原行政班维度，空=不限） */
export const batchScopeGroupOptions = [
  'SWE2409-G1',
  'SWE2409-G2',
  'SWE2504-G1',
  'COS2409-G1',
  'COS2504-G1',
  'DSA2409-G1',
  'DSA2504-G1',
  'AIT2504-G1',
  'BUS2409-G1',
  'MAT2409-G1',
  'MAT2504-G1',
  'PHY2409-G1',
  'PHY2504-G1',
  'MBT2409-G1',
  'MBT2504-G1',
  'CHS2409-G1',
  'CHS2504-G1',
  'CST2409-G1',
  'CST2504-G1',
  'CYS2409-G1',
  'CYS2504-G1',
]

/** 专业代码 → 默认学院（demo） */
export const programmeFacultyMap = {
  SWE: 'School of Information',
  COS: 'School of Information',
  DSA: 'School of Information',
  AIT: 'School of Information',
  CYS: 'School of Information',
  CST: 'School of Information',
  CSN: 'School of Information',
  DS: 'School of Information',
  ACC: 'School of Business',
  FIN: 'School of Business',
  IBU: 'School of Business',
  MAT: 'School of Energy and Chemical Engineering',
  PHY: 'School of Energy and Chemical Engineering',
  MBT: 'School of Energy and Chemical Engineering',
  CHS: 'School of Energy and Chemical Engineering',
}

export function resolveProgrammeFaculty(programme, faculty = '') {
  if (faculty) return faculty
  return programmeFacultyMap[programme] || 'School of Information'
}

/**
 * 旧「年级」日历年 → 入学批次；已是 YYYY/MM 则规范化。
 * 2024 → 2024/09；2025/2026 → YYYY/04
 */
export function migrateGradeYearToIntake(gradeOrIntake) {
  const raw = String(gradeOrIntake || '').trim()
  if (!raw || raw === SCOPE_DIM_ALL) return raw === SCOPE_DIM_ALL ? SCOPE_DIM_ALL : ''
  if (parseIntakeBatch(raw)) return formatIntakeBatch(raw)
  if (/^\d{4}$/.test(raw)) {
    const year = Number(raw)
    if (year >= 2025) return `${raw}/04`
    return `${raw}/09`
  }
  const normalized = normalizeIntakeLocal(raw)
  return normalized || ''
}

/** 空范围：学院/专业批次默认「全部」 */
export function emptyScopeRule() {
  return {
    faculties: [SCOPE_DIM_ALL],
    programmeIntakes: [SCOPE_DIM_ALL],
    // 以下两维仅兼容旧数据读写，新 UI 不再编辑
    programmes: [],
    intakes: [],
    groupName: '',
    round: '',
  }
}

export const batchScopeRoundOptions = [
  { value: 'preselect', labelKey: 'courseRegistration.batch.roundPreselect' },
  { value: 'main', labelKey: 'courseRegistration.batch.roundMain' },
  { value: 'supplement', labelKey: 'courseRegistration.batch.roundSupplement' },
]

function normalizeDimValue(value, { intake = false } = {}) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw === SCOPE_DIM_ALL || raw === 'All' || raw === '全部') return SCOPE_DIM_ALL
  if (intake) return migrateGradeYearToIntake(raw) || raw
  return raw
}

function toDimArray(value, options = {}) {
  const list = Array.isArray(value) ? value : value ? [value] : []
  const out = []
  const seen = new Set()
  for (const item of list) {
    const normalized = normalizeDimValue(item, options)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  if (out.includes(SCOPE_DIM_ALL)) return [SCOPE_DIM_ALL]
  return out
}

/**
 * 旧 programmes × intakes → programmeIntakes；任维为全部则整维全部
 * @param {string[]} programmes
 * @param {string[]} intakes
 * @returns {string[]}
 */
function migrateProgrammeIntakesFromLegacy(programmes = [], intakes = []) {
  const progs = toDimArray(programmes)
  const ints = toDimArray(intakes, { intake: true })
  if (!progs.length && !ints.length) return [SCOPE_DIM_ALL]
  if (progs.includes(SCOPE_DIM_ALL) || ints.includes(SCOPE_DIM_ALL) || !progs.length || !ints.length) {
    return [SCOPE_DIM_ALL]
  }
  const out = []
  const seen = new Set()
  for (const programme of progs) {
    for (const intake of ints) {
      const code = suggestProgrammeIntake(intake, programme)
      if (!code || seen.has(code)) continue
      seen.add(code)
      out.push(code)
    }
  }
  return out.length ? out : [SCOPE_DIM_ALL]
}

export function normalizeScopeRule(rule = {}) {
  const faculties = toDimArray(rule.faculties ?? rule.faculty)
  const programmes = toDimArray(rule.programmes ?? rule.programme)
  const intakes = toDimArray(rule.intakes ?? rule.intake ?? rule.grade, { intake: true })
  let programmeIntakes = toDimArray(rule.programmeIntakes ?? rule.programmeIntake)
  if (!programmeIntakes.length) {
    programmeIntakes = migrateProgrammeIntakesFromLegacy(programmes, intakes)
  }
  // 空维视为全部（非必填）
  const facultiesNorm = faculties.length ? faculties : [SCOPE_DIM_ALL]
  const programmeIntakesNorm = programmeIntakes.length ? programmeIntakes : [SCOPE_DIM_ALL]
  return {
    faculties: facultiesNorm,
    programmeIntakes: programmeIntakesNorm,
    programmes,
    intakes,
    /** 兼容旧单值读取 */
    faculty: facultiesNorm[0] || '',
    programme: programmes[0] || '',
    programmeIntake: programmeIntakesNorm[0] || '',
    intake: intakes[0] || '',
    grade: intakes[0] || '',
    groupName: rule.groupName || '',
    round: rule.round || '',
  }
}

/**
 * 同轮多条时仅保留第一条（每轮至多一条）
 * @param {object[]} rules
 * @returns {object[]}
 */
export function collapseScopeRulesOnePerRound(rules = []) {
  const seen = new Set()
  const out = []
  for (const rule of cloneScopeRules(rules)) {
    const key = rule.round || ''
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(rule)
  }
  return out
}

export function cloneScopeRules(rules = []) {
  return (rules || []).map((rule) => normalizeScopeRule(rule))
}

/** intake `2409` / `2024/09` → 年级 `2024`（供其他模块展示） */
export function intakeToGrade(intake) {
  const normalized = normalizeIntakeLocal(intake)
  if (normalized.length >= 4) return normalized.slice(0, 4)
  const digits = String(intake || '').replace(/\D/g, '')
  if (digits.length >= 2) return `20${digits.slice(0, 2)}`
  return ''
}

function dimDisplay(value, t) {
  if (!value) return ''
  if (value === SCOPE_DIM_ALL) {
    return t ? t('courseRegistration.batch.scopeDimAll') : '全部'
  }
  return value
}

export function formatDimList(values = [], t) {
  const list = Array.isArray(values) ? values : values ? [values] : []
  if (!list.length) return '—'
  const labels = list.map((value) => dimDisplay(value, t)).filter(Boolean)
  if (!labels.length) return '—'
  // 数组多选展示：单值也始终 [值]，多值 [A,B]（逗号无空格）
  return `[${labels.join(',')}]`
}

export function formatScopeRuleLabel(rule, t) {
  if (!rule) return '—'
  const normalized = normalizeScopeRule(rule)
  const parts = [
    formatDimList(normalized.faculties, t),
    formatDimList(normalized.programmeIntakes, t),
  ].filter((part) => part && part !== '—')
  const base = parts.length ? parts.join(' / ') : '—'
  if (!normalized.round) {
    return base
  }
  if (t) {
    const opt = batchScopeRoundOptions.find((item) => item.value === normalized.round)
    const roundLabel = opt ? t(opt.labelKey) : normalized.round
    return `${base} · ${roundLabel}`
  }
  return `${base} · ${normalized.round}`
}

export function scopeLabelsFromRules(rules = [], t) {
  return collapseScopeRulesOnePerRound(rules)
    .map((rule) => formatScopeRuleLabel(rule, t))
    .filter((label) => label && label !== '—')
}

/**
 * 旧 Program×Intake → scopeRules
 */
export function migrateLegacyScopeToRules(scopeEntries = []) {
  return (scopeEntries || [])
    .map((entry) => {
      const { programme, intake } = parseScopeEntryLocal(entry)
      const isAll = !programme || programme === 'All' || programme === 'All Programmes'
      return normalizeScopeRule({
        faculties: [SCOPE_DIM_ALL],
        intakes: [migrateGradeYearToIntake(intake) || SCOPE_DIM_ALL],
        programmes: [isAll ? SCOPE_DIM_ALL : programme],
        groupName: '',
        round: 'main',
      })
    })
    .filter((rule) => rule.programmeIntakes.length)
}

export function getBatchScopeRules(batch) {
  if (!batch) return []
  if (Array.isArray(batch.scopeRules) && batch.scopeRules.length) {
    return collapseScopeRulesOnePerRound(batch.scopeRules)
  }
  if (Array.isArray(batch.scope) && batch.scope.length) {
    return collapseScopeRulesOnePerRound(migrateLegacyScopeToRules(batch.scope))
  }
  return []
}

function dimArrayMatch(ruleValues, studentValue) {
  if (!ruleValues?.length) return true
  if (ruleValues.includes(SCOPE_DIM_ALL)) return true
  return ruleValues.some((value) => String(value) === String(studentValue || ''))
}

/**
 * 解析学生专业批次码
 * @param {{ programmeIntake?: string, intake?: string, programme?: string }} profileFields
 */
export function resolveStudentProgrammeIntake(profileFields = {}) {
  const direct = String(profileFields.programmeIntake || '').trim()
  if (direct) return direct
  return suggestProgrammeIntake(profileFields.intake, profileFields.programme)
}

export function matchScopeRule(rule, profileFields = {}) {
  if (!rule) return false
  const normalized = normalizeScopeRule(rule)
  const studentPi = resolveStudentProgrammeIntake(profileFields)
  return (
    dimArrayMatch(normalized.faculties, profileFields.faculty) &&
    dimArrayMatch(normalized.programmeIntakes, studentPi)
  )
}

/** 某轮有效规则：仅该轮专属（须指定具体轮次） */
export function filterScopeRulesForRound(rules = [], roundKey = '') {
  const key = roundKey === 'addDrop' ? '' : roundKey || ''
  if (!key) return []
  return collapseScopeRulesOnePerRound(rules || []).filter((rule) => (rule?.round || '') === key)
}

export function matchScopeRules(rules, profileFields, roundKey = '') {
  if (!rules?.length) return true
  const effective = filterScopeRulesForRound(rules, roundKey)
  if (!effective.length) return false
  return effective.some((rule) => matchScopeRule(rule, profileFields))
}

/** 培养方案 demo：按专业带出的默认入学批次维 */
const PROGRAMME_PLAN_INTAKES = ['2024/09', '2025/04']

/**
 * 从培养方案推导批次「全局」参与范围（无 round，只读口径）。
 * ME：学年学期语境下按所属专业 + 默认入学批次；GE 等：学院/专业批次均为全部，保证编辑态非空。
 * @param {object|null} batch
 * @returns {object|null}
 */
export function deriveGlobalScopeRuleFromProgrammePlan(batch) {
  if (!batch) return null
  const session = String(batch.academicSession || batch.semester || '').trim()
  if (!session) return null

  const type = String(batch.type || '').toUpperCase()
  if (type === 'ME') {
    const programme = String(batch.programme || '').trim()
    if (!programme) return null
    return normalizeScopeRule({
      faculties: [resolveProgrammeFaculty(programme)],
      programmeIntakes: migrateProgrammeIntakesFromLegacy([programme], PROGRAMME_PLAN_INTAKES),
      programmes: [],
      intakes: [],
      groupName: '',
      round: '',
    })
  }

  return normalizeScopeRule({
    faculties: [SCOPE_DIM_ALL],
    programmeIntakes: [SCOPE_DIM_ALL],
    programmes: [],
    intakes: [],
    groupName: '',
    round: '',
  })
}

/**
 * 某轮生效规则：三轮统一使用培养方案全局名单（忽略分轮 scope 覆盖）。
 * @param {object|null} batch
 * @param {string} [_roundKey]
 * @returns {object[]}
 */
export function resolveEffectiveScopeRulesForRound(batch, _roundKey = '') {
  const global = deriveGlobalScopeRuleFromProgrammePlan(batch)
  if (global) return [global]
  const shared = getBatchScopeRules(batch).filter((rule) => !(rule?.round || ''))
  return shared.length ? shared : []
}

/** 按专业生成三轮各一条（双入学批次多选，便于 demo） */
export function defaultScopeRulesForProgramme(programme, faculty = '') {
  const resolvedFaculty = resolveProgrammeFaculty(programme, faculty)
  const programmeIntakes = migrateProgrammeIntakesFromLegacy([programme], PROGRAMME_PLAN_INTAKES)
  return batchScopeRoundOptions.map((opt) => ({
    faculties: [resolvedFaculty],
    programmeIntakes,
    programmes: [],
    intakes: [],
    groupName: '',
    round: opt.value,
  }))
}
