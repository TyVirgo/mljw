export const batchExportFields = [
  { key: 'name', labelKey: 'courseRegistration.batch.name' },
  { key: 'academicSession', labelKey: 'courseRegistration.batch.academicSession' },
  { key: 'type', labelKey: 'courseRegistration.batch.type' },
  { key: 'scope', labelKey: 'courseRegistration.batch.scope' },
  { key: 'courseCount', labelKey: 'courseRegistration.batch.courseCount' },
  { key: 'status', labelKey: 'common.status' },
]

export const monitorExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'intake', labelKey: 'courseRegistration.monitor.intake' },
  { key: 'termTotalCredits', labelKey: 'courseRegistration.monitor.colTermTotalCredits' },
  { key: 'graduationGe', labelKey: 'courseRegistration.monitor.exportGraduationGe' },
  { key: 'graduationGeCompletion', labelKey: 'courseRegistration.monitor.exportGraduationGeCompletion' },
  { key: 'termGe', labelKey: 'courseRegistration.monitor.exportTermGe' },
  { key: 'termGeCompletion', labelKey: 'courseRegistration.monitor.exportTermGeCompletion' },
  { key: 'graduationMe', labelKey: 'courseRegistration.monitor.exportGraduationMe' },
  { key: 'graduationMeCompletion', labelKey: 'courseRegistration.monitor.exportGraduationMeCompletion' },
  { key: 'termMe', labelKey: 'courseRegistration.monitor.exportTermMe' },
  { key: 'termMeCompletion', labelKey: 'courseRegistration.monitor.exportTermMeCompletion' },
  { key: 'graduationMandatory', labelKey: 'courseRegistration.monitor.colMandatoryGrad' },
  {
    key: 'graduationMandatoryCompletion',
    labelKey: 'courseRegistration.monitor.colMandatoryCompletion',
  },
  { key: 'remindCount', labelKey: 'courseRegistration.monitor.colRemindCount' },
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

/**
 * 审批历史「导出缴费」：一行一课；同申请身份/SST/总费用列导出时纵向合并
 * 不含欠学费
 */
export const approvalPaymentExportFields = [
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'applicationNo', labelKey: 'courseRegistration.approval.applicationNo' },
  { key: 'billStatus', labelKey: 'courseRegistration.approval.billLabel' },
  { key: 'paymentStatus', labelKey: 'courseRegistration.approval.exportPaymentStatus' },
  { key: 'sstFee', labelKey: 'courseRegistration.approval.exportSstFee' },
  { key: 'totalFee', labelKey: 'courseRegistration.approval.exportTotalFee' },
  { key: 'courseCode', labelKey: 'courseRegistration.courses.code' },
  { key: 'courseName', labelKey: 'courseRegistration.courses.name' },
  { key: 'credits', labelKey: 'courseRegistration.courses.credits' },
  { key: 'courseFee', labelKey: 'courseRegistration.approval.exportCourseFee' },
]

/** 同申请多课行时纵向合并的列（整单身份与费用） */
export const approvalPaymentExportMergeFieldKeys = [
  'studentId',
  'studentName',
  'applicationNo',
  'billStatus',
  'paymentStatus',
  'sstFee',
  'totalFee',
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
  { key: 'courseSource', labelKey: 'courseRegistration.student.courseSource' },
  { key: 'preferenceRank', labelKey: 'courseRegistration.result.coursePreference' },
  { key: 'operator', labelKey: 'courseRegistration.log.operator' },
  { key: 'operatedAt', labelKey: 'courseRegistration.log.operatedAt' },
  { key: 'opResult', labelKey: 'courseRegistration.log.resultLabel' },
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

/** 第一轮主表 / 志愿名单：学生明细 */
export const resultR1DetailExportFields = [
  { key: 'batchName', labelKey: 'courseRegistration.batch.name' },
  { key: 'courseCode', labelKey: 'courseRegistration.courses.code' },
  { key: 'courseName', labelKey: 'courseRegistration.courses.name' },
  { key: 'sectionCode', labelKey: 'courseRegistration.result.volunteerSectionGroup' },
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'intake', labelKey: 'courseRegistration.monitor.intake' },
  { key: 'relativeSemester', labelKey: 'courseRegistration.result.volunteerRelativeSemester' },
  { key: 'preferenceRank', labelKey: 'courseRegistration.result.coursePreference' },
  { key: 'submittedAt', labelKey: 'courseRegistration.result.volunteerSubmittedAt' },
  { key: 'isGraduate', labelKey: 'courseRegistration.result.volunteerIsGraduate' },
  { key: 'selected', labelKey: 'courseRegistration.result.exportSelected' },
]

/** 第一轮主表：课程×分组汇总 */
export const resultR1SummaryExportFields = [
  { key: 'batchName', labelKey: 'courseRegistration.batch.name' },
  { key: 'courseCode', labelKey: 'courseRegistration.courses.code' },
  { key: 'courseName', labelKey: 'courseRegistration.courses.name' },
  { key: 'courseType', labelKey: 'courseRegistration.courses.type' },
  { key: 'credits', labelKey: 'courseRegistration.courses.credits' },
  { key: 'sectionCode', labelKey: 'courseRegistration.result.volunteerSectionGroup' },
  { key: 'capacityLabel', labelKey: 'courseRegistration.result.volunteerCapacityLabel' },
  { key: 'selectedPercentLabel', labelKey: 'courseRegistration.courses.volunteerSelectedPercent' },
  { key: 'effectiveCapacityLabel', labelKey: 'courseRegistration.result.effectiveCapacityWithRatio' },
  { key: 'seniorCapacityLabel', labelKey: 'courseRegistration.result.seniorCapacityEnrolled' },
  { key: 'specialAddedCount', labelKey: 'courseRegistration.result.specialAddedCount' },
]

export const registrationLogExportFields = [
  { key: 'batchName', labelKey: 'courseRegistration.log.batchName' },
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'intake', labelKey: 'courseRegistration.monitor.intake' },
  { key: 'course', labelKey: 'courseRegistration.log.course' },
  { key: 'sectionCode', labelKey: 'courseRegistration.log.section' },
  { key: 'credits', labelKey: 'courseRegistration.courses.credits' },
  { key: 'courseType', labelKey: 'courseRegistration.courses.type' },
  { key: 'isRetake', labelKey: 'courseRegistration.student.isRetake' },
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

/** 课程班学生名单导出（图示2；courseCode / courseCodeAgain 表头同为「课程代码」） */
export const sectionStudentRosterExportFields = [
  { key: 'rosterId', labelKey: 'courseRegistration.sectionRoster.rosterId' },
  { key: 'sectionId', labelKey: 'courseRegistration.sectionRoster.sectionId' },
  { key: 'academicSession', labelKey: 'courseRegistration.sectionRoster.term' },
  { key: 'courseCode', labelKey: 'courseRegistration.courses.code' },
  { key: 'sectionName', labelKey: 'courseRegistration.sectionRoster.sectionName' },
  { key: 'courseId', labelKey: 'courseRegistration.sectionRoster.courseId' },
  { key: 'courseCodeAgain', labelKey: 'courseRegistration.courses.code' },
  { key: 'courseName', labelKey: 'courseRegistration.courses.name' },
  { key: 'credits', labelKey: 'courseRegistration.monitor.credits' },
  { key: 'studentId', labelKey: 'courseRegistration.monitor.studentId' },
  { key: 'studentName', labelKey: 'courseRegistration.monitor.studentName' },
  { key: 'grade', labelKey: 'courseRegistration.sectionRoster.grade' },
  { key: 'movementStatus', labelKey: 'courseRegistration.sectionRoster.movementStatus' },
  { key: 'programme', labelKey: 'courseRegistration.monitor.programme' },
  { key: 'studyMode', labelKey: 'courseRegistration.sectionRoster.studyMode' },
  { key: 'lecturers', labelKey: 'courseRegistration.courses.lecturer' },
  { key: 'classTimeVenue', labelKey: 'courseRegistration.courses.classTime' },
  { key: 'owner', labelKey: 'courseRegistration.sectionRoster.owner' },
]