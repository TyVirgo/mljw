import { inferStudentCategory } from './movementApprovalEngine.js'
import {
  programmeTransfers,
  deferments,
  resumptions,
  withdrawals,
} from './movementStore.js'
import {
  extractPassportIc,
  extractIntake,
  extractCurrentSchool,
  extractCurrentProgrammeCode,
  extractNewSchool,
  extractNewProgrammeCode,
  extractNewProgrammeName,
  formatMovementDateDisplay,
  normalizeStudentTypeForMaintenance,
  MAINTENANCE_EMPTY,
} from './movementMaintenanceFields.js'
import {
  normalizeQueueItem,
} from './movementApprovalQueue.js'
import { filterMovementListBySearch } from './movementListSearchFilters.js'
import { displayMovementArchiveNumber } from '../utils/movementArchiveNumber.js'

export const movementMaintenanceStatusOptions = ['Approved']

export function normalizeMaintenanceItem(sourceKey, item, t) {
  const base = normalizeQueueItem(sourceKey, item, t)
  const studentCategory = inferStudentCategory(item)
  return {
    ...base,
    passportIc: extractPassportIc(item),
    studentType: normalizeStudentTypeForMaintenance(studentCategory),
    studentCategory,
    nationality: item.nationality || MAINTENANCE_EMPTY,
    intake: extractIntake(sourceKey, item),
    currentSchool: extractCurrentSchool(sourceKey, item),
    currentProgrammeCode: extractCurrentProgrammeCode(sourceKey, item),
    newSchool: extractNewSchool(sourceKey, item),
    newProgrammeCode: extractNewProgrammeCode(sourceKey, item),
    newProgrammeName: extractNewProgrammeName(sourceKey, item),
    englishName: item.fullName || item.name || MAINTENANCE_EMPTY,
    cgpa: item.cgpa || MAINTENANCE_EMPTY,
    movementNumber: item.movementNumber || MAINTENANCE_EMPTY,
    exportArchiveNumber: displayMovementArchiveNumber(item.exportArchiveNumber),
    remark: item.maintenanceRemark || MAINTENANCE_EMPTY,
    movementDate: formatMovementDateDisplay(item),
    implemented: item.implemented || 'Pending',
  }
}

export function mergeMovementMaintenanceQueue(t) {
  const sources = [
    ['programme-transfer', programmeTransfers.value],
    ['deferment', deferments.value],
    ['resumption', resumptions.value],
    ['withdrawal', withdrawals.value],
  ]
  const rows = []
  for (const [sourceKey, list] of sources) {
    for (const item of list) {
      if (item.status !== 'Approved') continue
      rows.push(normalizeMaintenanceItem(sourceKey, item, t))
    }
  }
  return rows.sort((a, b) => {
    const da = new Date(a.submittedAt || 0).getTime()
    const db = new Date(b.submittedAt || 0).getTime()
    return db - da
  })
}

export function filterMaintenanceBySearch(items, search) {
  return filterMovementListBySearch(items, search)
}
