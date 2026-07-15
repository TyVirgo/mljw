import { isChinaOrInternationalCategory } from './students.js'

export const MOVEMENT_SOURCE_KEYS = [
  'programme-transfer',
  'deferment',
  'resumption',
  'withdrawal',
]

/** Union of approver-selectable stages (matches mock approvalStage values). */
export const approverRoleOptions = [
  'Pending Review',
  'HOD/HOP',
  'AA HOD',
  'Academic Affairs',
  'Dean/HoP',
  'Finance',
  'International Student Affairs Office',
  'Admissions Office',
  'Library',
  'IT Office',
  'Counselling Center',
  'Accommodation Office',
  'AAO',
]

const TERMINAL_STAGE = 'Approved'

function defermentStages(category) {
  const base = ['Pending Review', 'HOD/HOP', 'AA HOD']
  if (isChinaOrInternationalCategory(category)) {
    base.push('International Student Affairs Office')
  }
  base.push(
    'Admissions Office',
    'Library',
    'IT Office',
    'Accommodation Office',
    'AAO',
    TERMINAL_STAGE,
  )
  return base
}

function resumptionStages(category) {
  const base = ['Pending Review', 'HOD/HOP', 'Finance']
  if (isChinaOrInternationalCategory(category)) {
    base.push('International Student Affairs Office')
  }
  base.push('Admissions Office', 'Accommodation Office', 'AAO', TERMINAL_STAGE)
  return base
}

function withdrawalStages(category) {
  const base = ['Pending Review', 'HOD/HOP', 'AA HOD']
  if (isChinaOrInternationalCategory(category)) {
    base.push('International Student Affairs Office')
  }
  base.push(
    'Finance',
    'Admissions Office',
    'Library',
    'IT Office',
    'Counselling Center',
    'Accommodation Office',
    'AAO',
    TERMINAL_STAGE,
  )
  return base
}

function programmeTransferStages() {
  return ['Pending Review', 'Academic Affairs', 'Dean/HoP', TERMINAL_STAGE]
}

export function getWorkflowStages(sourceKey, studentCategory = 'Local') {
  switch (sourceKey) {
    case 'programme-transfer':
      return programmeTransferStages()
    case 'deferment':
      return defermentStages(studentCategory)
    case 'resumption':
      return resumptionStages(studentCategory)
    case 'withdrawal':
      return withdrawalStages(studentCategory)
    default:
      return []
  }
}

export function isFinalWorkflowStage(sourceKey, stage, category) {
  const stages = getWorkflowStages(sourceKey, category)
  const idx = stages.indexOf(stage)
  if (idx === -1) return false
  return stages[idx + 1] === TERMINAL_STAGE || stage === TERMINAL_STAGE
}

export function getNextStage(sourceKey, currentStage, category) {
  const stages = getWorkflowStages(sourceKey, category)
  const idx = stages.indexOf(currentStage)
  if (idx === -1 || idx >= stages.length - 1) return TERMINAL_STAGE
  const next = stages[idx + 1]
  return next === TERMINAL_STAGE ? TERMINAL_STAGE : next
}

export function getPreviousStage(sourceKey, currentStage, category) {
  const stages = getWorkflowStages(sourceKey, category)
  const idx = stages.indexOf(currentStage)
  if (idx <= 0) return stages[0] || currentStage
  return stages[idx - 1]
}

/**
 * 会签逻辑组（v1 仍串行推进；用于「前一节点」时间取 max）
 * @returns {string[][]}
 */
export function getParallelGroups(sourceKey) {
  switch (sourceKey) {
    case 'deferment':
      return [['Admissions Office', 'Library', 'IT Office', 'Accommodation Office']]
    case 'resumption':
      return [['Admissions Office', 'Accommodation Office']]
    case 'withdrawal':
      return [
        [
          'Admissions Office',
          'Library',
          'IT Office',
          'Counselling Center',
          'Accommodation Office',
        ],
      ]
    default:
      return []
  }
}

function findParallelGroup(sourceKey, stage) {
  return getParallelGroups(sourceKey).find((group) => group.includes(stage)) || null
}

/**
 * 相对当前 stage 的前一逻辑节点所包含的 stage 列表。
 * - 首节点：返回 []（调用方取 Submitted）
 * - 会签组内：返回组前串行节点
 * - 会签组后：返回整组
 * - 其它：返回上一串行 stage
 */
export function getPreviousLogicalNodeStages(sourceKey, currentStage, category) {
  const stages = getWorkflowStages(sourceKey, category).filter((s) => s !== TERMINAL_STAGE)
  if (!stages.length) return []

  let stage = currentStage
  if (stage === TERMINAL_STAGE) {
    stage = stages[stages.length - 1]
    // 「当前」视为 Approved 之后：前一逻辑节点相对末级 stage 的下一跳语义
    // 即末级 stage 本身（或其所在会签组）为前一节点
    const groupAtEnd = findParallelGroup(sourceKey, stage)
    if (groupAtEnd) return [...groupAtEnd]
    return [stage]
  }

  const idx = stages.indexOf(stage)
  if (idx <= 0) return []

  const currentGroup = findParallelGroup(sourceKey, stage)
  if (currentGroup) {
    const firstInGroup = currentGroup[0]
    const groupStartIdx = stages.indexOf(firstInGroup)
    if (groupStartIdx <= 0) return []
    return [stages[groupStartIdx - 1]]
  }

  const prevLinear = stages[idx - 1]
  const prevGroup = findParallelGroup(sourceKey, prevLinear)
  if (prevGroup) return [...prevGroup]
  return [prevLinear]
}

export function stageMatchesRole(stage, role) {
  if (!stage || !role) return false
  return stage === role
}
