export const movementApprovalExportColumnMeta = [
  { key: 'no', labelKey: 'movementQuery.export.no', width: 8, selectedByDefault: true },
  { key: 'status', labelKey: 'movementQuery.export.status', width: 14, selectedByDefault: true },
  { key: 'approvalStage', labelKey: 'movementQuery.export.approvalStage', width: 16, selectedByDefault: true },
  { key: 'studentId', labelKey: 'movementQuery.export.studentId', width: 16, selectedByDefault: true },
  { key: 'fullName', labelKey: 'movementQuery.export.studentName', width: 22, selectedByDefault: true },
  { key: 'applicationSession', labelKey: 'movementApproval.columns.applicationSession', width: 16, selectedByDefault: true },
  { key: 'effectiveSession', labelKey: 'movementApproval.columns.effectiveSession', width: 16, selectedByDefault: true },
  { key: 'movementCategory', labelKey: 'movementApproval.columns.movementCategory', width: 18, selectedByDefault: true },
  { key: 'historicalApplicationSequence', labelKey: 'movementApproval.columns.applicationSequence', width: 14, selectedByDefault: true },
  { key: 'lastApprovalActionTime', labelKey: 'movementApproval.columns.lastActionTime', width: 20, selectedByDefault: true },
  { key: 'applicationDate', labelKey: 'movementApproval.columns.applicationDate', width: 14, selectedByDefault: true },
  { key: 'implemented', labelKey: 'movementQuery.export.implemented', width: 14, selectedByDefault: false },
]

export const movementApprovalExportFields = movementApprovalExportColumnMeta.map((col) => ({
  key: col.key,
  labelKey: col.labelKey,
  selectedByDefault: col.selectedByDefault !== false,
}))
