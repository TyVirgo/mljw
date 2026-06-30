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
  matchesImplementedYnFilter,
} from './movementApprovalQueue.js'

export const movementMaintenanceStatusOptions = ['Approved']

export function normalizeMaintenanceItem(sourceKey, item, t) {
  const base = normalizeQueueItem(sourceKey, item, t)
  const studentCategory = inferStudentCategory(item)
  return {
    ...base,
    passportIc: extractPassportIc(item),
    studentType: normalizeStudentTypeForMaintenance(studentCategory),
    studentCategory,
    intake: extractIntake(sourceKey, item),
    currentSchool: extractCurrentSchool(sourceKey, item),
    currentProgrammeCode: extractCurrentProgrammeCode(sourceKey, item),
    newSchool: extractNewSchool(sourceKey, item),
    newProgrammeCode: extractNewProgrammeCode(sourceKey, item),
    newProgrammeName: extractNewProgrammeName(sourceKey, item),
    englishName: item.fullName || item.name || MAINTENANCE_EMPTY,
    cgpa: item.cgpa || MAINTENANCE_EMPTY,
    movementNumber: item.movementNumber || MAINTENANCE_EMPTY,
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
  const s = search || {}
  return items.filter((row) => {
    if (s.academicSession && row.applicationSession !== String(s.academicSession).trim()) return false
    if (s.programmeCode && !matchText(row.programmeCode, s.programmeCode)) return false
    if (s.status && row.status !== s.status) return false
    if (s.studentId && !matchText(row.studentId, s.studentId)) return false
    if (s.studentName && !matchText(row.fullName, s.studentName)) return false
    if (!matchesImplementedYnFilter(row.implemented, s.implemented)) return false
    return true
  })
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(String(keyword).trim().toLowerCase())
}
