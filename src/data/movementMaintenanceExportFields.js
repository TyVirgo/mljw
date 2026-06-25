export const movementMaintenanceExportColumnMeta = [
  { key: 'no', labelKey: 'movementQuery.export.no', width: 8, selectedByDefault: true },
  { key: 'status', labelKey: 'movementQuery.export.status', width: 14, selectedByDefault: true },
  { key: 'approvalStage', labelKey: 'movementQuery.export.approvalStage', width: 16, selectedByDefault: true },
  { key: 'implemented', labelKey: 'movementQuery.export.implemented', width: 14, selectedByDefault: true },
  { key: 'studentId', labelKey: 'movementQuery.export.studentId', width: 16, selectedByDefault: true },
  { key: 'fullName', labelKey: 'movementQuery.export.studentName', width: 22, selectedByDefault: true },
  { key: 'applicationSession', labelKey: 'movementApproval.columns.applicationSession', width: 16, selectedByDefault: true },
  { key: 'effectiveSession', labelKey: 'movementApproval.columns.effectiveSession', width: 16, selectedByDefault: true },
  { key: 'movementCategory', labelKey: 'movementApproval.columns.movementCategory', width: 18, selectedByDefault: true },
  { key: 'movementReason', labelKey: 'movementApproval.columns.movementReason', width: 24, selectedByDefault: true },
  { key: 'movementDate', labelKey: 'movementMaintenance.columns.movementDate', width: 14, selectedByDefault: true },
  { key: 'passportIc', labelKey: 'movementMaintenance.columns.passportIc', width: 18, selectedByDefault: true },
  { key: 'studentType', labelKey: 'movementMaintenance.columns.studentType', width: 14, selectedByDefault: false },
  { key: 'intake', labelKey: 'movementMaintenance.columns.intake', width: 12, selectedByDefault: false },
]

export const movementMaintenanceExportFields = movementMaintenanceExportColumnMeta.map((col) => ({
  key: col.key,
  labelKey: col.labelKey,
  selectedByDefault: col.selectedByDefault !== false,
}))
