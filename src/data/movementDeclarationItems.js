/** Section V student declaration bullet items by movement type. */

const COMMON_CORRECT = 'movementCommon.declaration.correct'
const MAX_STUDY_DURATION = 'movementCommon.declaration.maxStudyDuration'
const PT_RULES_UNDERTAKE = 'programmeTransfer.declaration.rulesUndertake'
const PT_VISA_CANCELLATION = 'programmeTransfer.declaration.visaCancellation'

export const commonDeclarationItems = [COMMON_CORRECT]

export const defermentDeclarationItems = [COMMON_CORRECT, MAX_STUDY_DURATION]

export const resumptionDeclarationItems = [COMMON_CORRECT, MAX_STUDY_DURATION]

export const withdrawalDeclarationItems = [COMMON_CORRECT]

export const programmeTransferDeclarationItems = [
  COMMON_CORRECT,
  PT_RULES_UNDERTAKE,
  PT_VISA_CANCELLATION,
]

/** @deprecated use programmeTransferDeclarationItems */
export const movementDeclarationItems = programmeTransferDeclarationItems
