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
  { key: 'addCourseName', labelKey: 'courseRegistration.approval.addCourseName' },
  { key: 'dropCourseName', labelKey: 'courseRegistration.approval.dropCourseName' },
  { key: 'retakeCourseName', labelKey: 'courseRegistration.approval.retakeCourseName' },
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

export const resultStudentExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'intake', labelKey: 'courseRegistration.monitor.intake' },
  { key: 'batchName', labelKey: 'courseRegistration.batch.name' },
  { key: 'courseCode', labelKey: 'courseRegistration.courses.code' },
  { key: 'courseName', labelKey: 'courseRegistration.courses.name' },
  { key: 'credits', labelKey: 'courseRegistration.courses.credits' },
  { key: 'courseType', labelKey: 'courseRegistration.courses.type' },
  { key: 'sectionCode', labelKey: 'courseRegistration.courses.sectionCode' },
  { key: 'isRetake', labelKey: 'courseRegistration.student.isRetake' },
  { key: 'courseSource', labelKey: 'courseRegistration.student.courseSource' },
]

export const resultCourseExportFields = [
  { key: 'batchName', labelKey: 'courseRegistration.batch.name' },
  { key: 'courseCode', labelKey: 'courseRegistration.courses.code' },
  { key: 'courseName', labelKey: 'courseRegistration.courses.name' },
  { key: 'credits', labelKey: 'courseRegistration.courses.credits' },
  { key: 'effectiveCapacity', labelKey: 'courseRegistration.courses.effectiveCapacity' },
  { key: 'enrolledFreshman', labelKey: 'courseRegistration.courses.enrolledFreshman' },
  { key: 'enrolledSenior', labelKey: 'courseRegistration.courses.enrolledSenior' },
]

export const registrationLogExportFields = [
  { key: 'batchName', labelKey: 'courseRegistration.log.batchName' },
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'course', labelKey: 'courseRegistration.log.course' },
  { key: 'sectionCode', labelKey: 'courseRegistration.log.section' },
  { key: 'credits', labelKey: 'courseRegistration.courses.credits' },
  { key: 'courseType', labelKey: 'courseRegistration.courses.type' },
  { key: 'operator', labelKey: 'courseRegistration.log.operator' },
  { key: 'operatedAt', labelKey: 'courseRegistration.log.operatedAt' },
  { key: 'queueStatus', labelKey: 'courseRegistration.log.queueStatusLabel' },
  { key: 'result', labelKey: 'courseRegistration.log.resultLabel' },
]

export const feeRosterStudentExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'intake', labelKey: 'courseRegistration.monitor.intake' },
  { key: 'academicSession', labelKey: 'courseRegistration.feeRoster.academicSession' },
  { key: 'courseCount', labelKey: 'courseRegistration.feeRoster.courseCount' },
  { key: 'enrolledCredits', labelKey: 'courseRegistration.feeRoster.enrolledCredits' },
  { key: 'creditMin', labelKey: 'courseRegistration.feeRoster.creditMin' },
  { key: 'creditMax', labelKey: 'courseRegistration.feeRoster.creditMax' },
  { key: 'billableCredits', labelKey: 'courseRegistration.feeRoster.billableCredits' },
  { key: 'outstandingFee', labelKey: 'courseRegistration.feeRoster.outstandingFee' },
  { key: 'isPaid', labelKey: 'courseRegistration.feeRoster.isPaid' },
]

export const feeRosterCourseExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'courseCode', labelKey: 'courseRegistration.courses.code' },
  { key: 'courseName', labelKey: 'courseRegistration.courses.name' },
  { key: 'courseCredits', labelKey: 'courseRegistration.courses.credits' },
  { key: 'courseType', labelKey: 'courseRegistration.courses.type' },
  { key: 'sectionCode', labelKey: 'courseRegistration.courses.sectionCode' },
  { key: 'courseSource', labelKey: 'courseRegistration.student.courseSource' },
]

/** @deprecated 使用 feeRosterStudentExportFields */
export const feeRosterExportFields = feeRosterStudentExportFields