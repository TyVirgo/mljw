/** Section V student declaration bullet items by movement type. */

const COMMON_CORRECT = 'movementCommon.declaration.correct'
const PARENT_EMAIL_NOTICE = 'movementCommon.declaration.parentEmailNotice'
const MAX_STUDY_DURATION = 'movementCommon.declaration.maxStudyDuration'
const PT_RULES_UNDERTAKE = 'programmeTransfer.declaration.rulesUndertake'
const PT_VISA_CANCELLATION = 'programmeTransfer.declaration.visaCancellation'

export const commonDeclarationItems = [COMMON_CORRECT, PARENT_EMAIL_NOTICE]

export const defermentDeclarationItems = [...commonDeclarationItems, MAX_STUDY_DURATION]

export const resumptionDeclarationItems = [...commonDeclarationItems, MAX_STUDY_DURATION]

export const withdrawalDeclarationItems = [...commonDeclarationItems]

export const programmeTransferDeclarationItems = [
  ...commonDeclarationItems,
  PT_RULES_UNDERTAKE,
  PT_VISA_CANCELLATION,
]

/** @deprecated use programmeTransferDeclarationItems */
export const movementDeclarationItems = programmeTransferDeclarationItems
