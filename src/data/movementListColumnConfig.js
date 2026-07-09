export const MOVEMENT_LIST_TABLE_COLUMNS = [
  { key: 'status', labelKey: 'movementQuery.export.status', cellType: 'status' },
  { key: 'approvalStage', labelKey: 'movementQuery.export.approvalStage', cellType: 'approvalStage' },
  { key: 'implemented', labelKey: 'movementQuery.export.implemented', cellType: 'implemented' },
  { key: 'studentId', labelKey: 'movementQuery.export.studentId' },
  { key: 'fullName', labelKey: 'movementQuery.export.studentName' },
  { key: 'nationality', labelKey: 'movementList.columns.nationality' },
  { key: 'movementCategory', labelKey: 'movementApproval.columns.movementCategory', cellType: 'movementCategory' },
  { key: 'effectiveSession', labelKey: 'movementApproval.columns.effectiveSession' },
  { key: 'effectiveDate', labelKey: 'movementMaintenance.columns.effectiveDate', cellType: 'effectiveDate' },
  { key: 'passportIc', labelKey: 'movementMaintenance.columns.passportIc', cellType: 'passportIc' },
  { key: 'studentType', labelKey: 'movementList.columns.studentCategory', cellType: 'studentType' },
  { key: 'intake', labelKey: 'movementMaintenance.columns.intake' },
  { key: 'applicationSession', labelKey: 'movementApproval.columns.applicationSession' },
  { key: 'movementReason', labelKey: 'movementApproval.columns.movementReason', cellClass: 'reason-cell' },
]

const ARCHIVE_NUMBER_COLUMN = {
  key: 'exportArchiveNumber',
  labelKey: 'movementMaintenance.columns.archiveNumber',
}

export const MOVEMENT_MAINTENANCE_TABLE_COLUMNS = (() => {
  const columns = [...MOVEMENT_LIST_TABLE_COLUMNS]
  const studentIdIndex = columns.findIndex((col) => col.key === 'studentId')
  columns.splice(studentIdIndex, 0, ARCHIVE_NUMBER_COLUMN)
  return columns
})()

export const MOVEMENT_LIST_EXPORT_COLUMN_META = [
  { key: 'no', labelKey: 'movementQuery.export.no', width: 8, selectedByDefault: true },
  ...MOVEMENT_LIST_TABLE_COLUMNS.map((col) => ({
    key: col.key,
    labelKey: col.labelKey,
    width: col.key === 'movementReason' ? 24 : col.key === 'fullName' ? 22 : 16,
    selectedByDefault: true,
  })),
]
