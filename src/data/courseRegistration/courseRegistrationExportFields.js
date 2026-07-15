export const batchExportFields = [
  { key: 'name', labelKey: 'courseRegistration.batch.name' },
  { key: 'academicSession', labelKey: 'courseRegistration.batch.academicSession' },
  { key: 'type', labelKey: 'courseRegistration.batch.type' },
  { key: 'roundPreselect', labelKey: 'courseRegistration.batch.roundColPreselect' },
  { key: 'roundMain', labelKey: 'courseRegistration.batch.roundColMain' },
  { key: 'roundSupplement', labelKey: 'courseRegistration.batch.roundColSupplement' },
  { key: 'roundAddDrop', labelKey: 'courseRegistration.batch.roundColAddDrop' },
  { key: 'scope', labelKey: 'courseRegistration.batch.scope' },
  { key: 'courseCount', labelKey: 'courseRegistration.batch.courseCount' },
  { key: 'status', labelKey: 'common.status' },
]

export const monitorExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'intake', labelKey: 'courseRegistration.monitor.intake' },
  { key: 'credits', labelKey: 'courseRegistration.monitor.credits' },
  { key: 'status', labelKey: 'common.status' },
]

export const approvalExportFields = [
  { key: 'applicationNo', labelKey: 'courseRegistration.approval.applicationNo' },
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'type', labelKey: 'courseRegistration.approval.typeLabel' },
  { key: 'content', labelKey: 'courseRegistration.approval.content' },
  { key: 'credits', labelKey: 'courseRegistration.monitor.credits' },
  { key: 'billStatus', labelKey: 'courseRegistration.approval.billLabel' },
  { key: 'submittedAt', labelKey: 'courseRegistration.approval.submittedAt' },
  { key: 'status', labelKey: 'common.status' },
]

export const supplementExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'intake', labelKey: 'courseRegistration.monitor.intake' },
  { key: 'listType', labelKey: 'courseRegistration.supplement.listType' },
  { key: 'canAdd', labelKey: 'courseRegistration.supplement.canAdd' },
  { key: 'canDrop', labelKey: 'courseRegistration.supplement.canDrop' },
  { key: 'canRetake', labelKey: 'courseRegistration.supplement.canRetake' },
  { key: 'addedAt', labelKey: 'courseRegistration.supplement.addedAt' },
  { key: 'addedBy', labelKey: 'courseRegistration.supplement.addedBy' },
]

export const alertExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'alertType', labelKey: 'courseRegistration.alert.type' },
  { key: 'severity', labelKey: 'courseRegistration.alert.severity' },
  { key: 'credits', labelKey: 'courseRegistration.monitor.credits' },
  { key: 'createdAt', labelKey: 'courseRegistration.alert.createdAt' },
]
