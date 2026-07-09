import { upsertInStore, getStoreList } from './movementStore.js'
import { normalizeTransfer } from './programmeTransfers.js'
import { inferStudentCategory } from './movementApprovalEngine.js'
import { resolveMovementCategoryConfig } from './movementCategories.js'
import { applyStudentProfileFromMovement } from './students.js'

export const MAINTENANCE_EMPTY = '—'

const PROGRAMME_CODE_MAP = {
  'Bachelor of Software Engineering': 'SWE',
  'Bachelor of Computer Science': 'CS',
  'Bachelor of Finance': 'FIN',
  'Bachelor of International Business': 'IB',
  'Bachelor of Accounting': 'ACC',
  'Bachelor of Data Science': 'DS',
}

const PROGRAMME_SCHOOL_MAP = {
  'Bachelor of Software Engineering': 'School of Computing',
  'Bachelor of Computer Science': 'School of Computing',
  'Bachelor of Finance': 'School of Business',
  'Bachelor of International Business': 'School of Business',
  'Bachelor of Accounting': 'School of Business',
  'Bachelor of Data Science': 'School of Computing',
}

export function createMaintenanceFieldDefaults() {
  return {
    movementNumber: '',
    cgpa: '',
    expectedGraduationTime: '',
    maintenanceRemark: '',
    movementDate: '',
    implemented: 'Pending',
    newSchool: '',
    newProgrammeCode: '',
    newProgrammeName: '',
  }
}

export function normalizeStudentTypeForMaintenance(studentCategory) {
  if (studentCategory === 'China') return 'Chinese'
  return studentCategory || 'Local'
}

export function programmeCodeFromName(name) {
  if (!name) return ''
  return PROGRAMME_CODE_MAP[name] || ''
}

export function schoolFromProgramme(name) {
  if (!name) return ''
  return PROGRAMME_SCHOOL_MAP[name] || ''
}

export function extractPassportIc(item) {
  return item.nricPassport || item.passportNo || MAINTENANCE_EMPTY
}

export function extractIntake(sourceKey, item) {
  let raw = ''
  switch (sourceKey) {
    case 'programme-transfer':
      raw = item.currentIntake || ''
      break
    case 'deferment':
    case 'withdrawal':
      raw = item.intake || ''
      break
    case 'resumption':
      raw = item.originalIntake || ''
      break
    default:
      raw = ''
  }
  const normalized = normalizeAcademicSession(raw)
  return normalized === '—' ? MAINTENANCE_EMPTY : normalized
}

export function extractCurrentSchool(sourceKey, item) {
  if (sourceKey === 'programme-transfer') return item.currentSchool || MAINTENANCE_EMPTY
  return MAINTENANCE_EMPTY
}

export function extractCurrentProgrammeCode(sourceKey, item) {
  if (sourceKey !== 'programme-transfer') return MAINTENANCE_EMPTY
  return programmeCodeFromName(item.currentProgramme) || MAINTENANCE_EMPTY
}

export function extractNewSchool(sourceKey, item) {
  if (sourceKey !== 'programme-transfer') return MAINTENANCE_EMPTY
  return item.newSchool || schoolFromProgramme(item.adminNewProgramme || item.newProgrammeFirstChoice) || MAINTENANCE_EMPTY
}

export function extractNewProgrammeCode(sourceKey, item) {
  if (sourceKey !== 'programme-transfer') return MAINTENANCE_EMPTY
  return item.newProgrammeCode || programmeCodeFromName(item.adminNewProgramme || item.newProgrammeFirstChoice) || MAINTENANCE_EMPTY
}

export function extractNewProgrammeName(sourceKey, item) {
  if (sourceKey !== 'programme-transfer') return MAINTENANCE_EMPTY
  return item.adminNewProgramme || item.newProgrammeFirstChoice || MAINTENANCE_EMPTY
}

import { formatMovementDate } from '../utils/formatMovementDate.js'
import { normalizeAcademicSession } from '../utils/normalizeAcademicSession.js'
import { getCurrentApplicationSession } from './movementApplicationSession.js'
import { extractEffectiveSession } from './movementApprovalQueue.js'

export function formatMovementDateDisplay(item) {
  if (item.movementDate) return formatMovementDate(item.movementDate)
  if (!item.submittedAt) return '—'
  return formatMovementDate(item.submittedAt)
}

export function updateMaintenanceFields(sourceKey, id, patch) {
  const listRef = getStoreList(sourceKey)
  if (!listRef) return null
  const current = listRef.value.find((row) => row.id === id)
  if (!current) return null
  const updated = { ...current, ...patch }
  upsertInStore(sourceKey, updated)
  return updated
}

export function applyImplementationEffect(sourceKey, item) {
  if (!item) return null
  const config = resolveMovementCategoryConfig(sourceKey, inferStudentCategory(item))
  if (config) {
    applyStudentProfileFromMovement(item.studentId, config, { sourceKey, item })
  }
  return updateMaintenanceFields(sourceKey, item.id, { implemented: 'Implemented' })
}

export function requestImplementation(sourceKey, item) {
  if (!item || item.implemented !== 'Pending') return null
  const current = getCurrentApplicationSession()
  const effective = extractEffectiveSession(sourceKey, item)
  if (current && effective && current === effective) {
    return applyImplementationEffect(sourceKey, item)
  }
  return updateMaintenanceFields(sourceKey, item.id, { implemented: 'Scheduled' })
}

export function implementMaintenanceRecords(rows) {
  const updated = []
  for (const row of rows) {
    if (row.implemented !== 'Pending') continue
    const raw = row.raw || row
    const next = applyImplementationEffect(row.sourceKey, raw)
    if (next) updated.push(next)
  }
  return updated
}

export function deleteMaintenanceRecords(rows) {
  for (const row of rows) {
    const listRef = getStoreList(row.sourceKey)
    if (!listRef) continue
    listRef.value = listRef.value.filter((item) => item.id !== row.id)
  }
}

export function updateMovementNumbers(entries) {
  for (const entry of entries) {
    updateMaintenanceFields(entry.sourceKey, entry.id, {
      movementNumber: String(entry.movementNumber || '').trim(),
    })
  }
}

export function updateExportArchiveNumber(sourceKey, id, exportArchiveNumber) {
  return updateMaintenanceFields(sourceKey, id, {
    exportArchiveNumber: String(exportArchiveNumber || '').trim(),
  })
}

function patchRecord(sourceKey, id, patch) {
  updateMaintenanceFields(sourceKey, id, patch)
}

export function seedMaintenanceShowcaseRecords() {
  patchRecord('programme-transfer', 14, {
    studentCategory: 'Local',
    implemented: 'Pending',
    movementNumber: 'MV2025001',
    cgpa: '3.72',
    expectedGraduationTime: '2027-06',
    maintenanceRemark: 'PT Local showcase',
    movementDate: '2025-02-18',
    newSchool: 'School of Computing',
    newProgrammeCode: 'DS',
    newProgrammeName: 'Bachelor of Data Science',
  })

  patchRecord('programme-transfer', 2, {
    studentCategory: 'International',
    implemented: 'Pending',
    movementNumber: 'MV2025002',
    cgpa: '3.45',
    expectedGraduationTime: '2026-12',
    maintenanceRemark: 'PT International showcase',
    movementDate: '2023-09-20',
    newSchool: 'School of Business',
    newProgrammeCode: 'FIN',
    newProgrammeName: 'Bachelor of Finance',
  })

  const ptList = getStoreList('programme-transfer')
  if (ptList && !ptList.value.some((row) => row.id === 15)) {
    ptList.value.push(
      normalizeTransfer({
        id: 15,
        applicationId: 'TRF015',
        studentId: 'XMUM2309002',
        fullName: 'Li Xiu',
        nricPassport: 'E12345678',
        nationality: 'China',
        studentCategory: 'China',
        email: 'li.xiu@student.xmum.edu.my',
        contactNo: '0139876543',
        currentProgramme: 'Bachelor of Finance',
        currentIntake: '2023/09',
        currentSchool: 'School of Business',
        newProgrammeFirstChoice: 'Bachelor of Accounting',
        startSemester: '2025/09',
        transferReason: 'Career path toward professional accounting.',
        declarationAgreed: true,
        attachment: { fileName: 'li-pt-consent.pdf', size: 220000 },
        adminNewProgramme: 'Bachelor of Accounting',
        adminNewIntake: '2025/09',
        adminDate: '2025-03-01',
        status: 'Approved',
        approvalStage: 'Approved',
        archived: true,
        submittedAt: '2025-03-01T08:00:00.000Z',
        implemented: 'Pending',
        movementNumber: 'MV2025003',
        cgpa: '3.68',
        expectedGraduationTime: '2027-06',
        maintenanceRemark: 'PT Chinese showcase',
        movementDate: '2025-03-01',
        newSchool: 'School of Business',
        newProgrammeCode: 'ACC',
        newProgrammeName: 'Bachelor of Accounting',
        approvalLog: [
          {
            id: 1,
            stage: 'Submission',
            actor: 'Li Xiu',
            action: 'Submitted',
            dateTime: '01.03.2025 08:00',
            comment: '',
          },
          {
            id: 2,
            stage: 'Dean/HoP',
            actor: 'System Admin',
            action: 'Approved',
            dateTime: '05.03.2025 10:00',
            comment: 'Approved.',
          },
        ],
      }),
    )
  }

  patchRecord('deferment', 1, {
    studentCategory: 'Local',
    implemented: 'Pending',
    defermentPeriod: '2026/02',
    movementNumber: 'MV2025004',
    cgpa: '3.10',
    expectedGraduationTime: '2028-06',
    maintenanceRemark: 'Deferment Local showcase',
    movementDate: '2025-09-29',
  })

  patchRecord('deferment', 14, {
    studentCategory: 'International',
    implemented: 'Implemented',
    movementNumber: 'MV2025005',
    cgpa: '3.55',
    expectedGraduationTime: '2026-12',
    maintenanceRemark: 'Deferment International implemented',
    movementDate: '2025-02-18',
  })

  patchRecord('withdrawal', 14, {
    implemented: 'Pending',
    movementNumber: 'MV2025006',
    cgpa: '3.40',
    expectedGraduationTime: '2026-06',
    maintenanceRemark: 'Withdrawal Chinese showcase',
    movementDate: '2025-02-18',
  })

  patchRecord('resumption', 2, {
    studentCategory: 'Local',
    implemented: 'Implemented',
    movementNumber: 'MV2025007',
    cgpa: '3.65',
    expectedGraduationTime: '2027-06',
    maintenanceRemark: 'Resumption Local implemented',
    movementDate: '2024-06-01',
  })
}

export function getStudentTypeLabelKey(studentCategory) {
  const type = normalizeStudentTypeForMaintenance(inferStudentCategory({ studentCategory }))
  return `movementMaintenance.studentType.${type}`
}
