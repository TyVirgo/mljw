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

export function stageMatchesRole(stage, role) {
  if (!stage || !role) return false
  return stage === role
}
