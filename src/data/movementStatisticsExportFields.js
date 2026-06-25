export const movementStatisticsExportColumnMeta = [
  { key: 'no', labelKey: 'movementStatistics.export.no', width: 8, selectedByDefault: true },
  { key: 'schoolCode', labelKey: 'movementStatistics.columns.schoolCode', width: 14, selectedByDefault: true },
  { key: 'programmeCode', labelKey: 'movementStatistics.columns.programmeCode', width: 14, selectedByDefault: true },
  { key: 'intake', labelKey: 'movementStatistics.columns.intake', width: 12, selectedByDefault: true },
  { key: 'programmeTransfer', labelKey: 'movementStatistics.columns.programmeTransfer', width: 16, selectedByDefault: true },
  { key: 'deferment', labelKey: 'movementStatistics.columns.deferment', width: 12, selectedByDefault: true },
  { key: 'withdrawal', labelKey: 'movementStatistics.columns.withdrawal', width: 12, selectedByDefault: true },
  { key: 'resumption', labelKey: 'movementStatistics.columns.resumption', width: 12, selectedByDefault: true },
  { key: 'outboundMobility', labelKey: 'movementStatistics.columns.outboundMobility', width: 16, selectedByDefault: true },
  { key: 'expel', labelKey: 'movementStatistics.columns.expel', width: 10, selectedByDefault: true },
  { key: 'incomplete', labelKey: 'movementStatistics.columns.incomplete', width: 12, selectedByDefault: true },
  { key: 'completion', labelKey: 'movementStatistics.columns.completion', width: 12, selectedByDefault: true },
  { key: 'completionWithoutGraduation', labelKey: 'movementStatistics.columns.completionWithoutGraduation', width: 22, selectedByDefault: true },
  { key: 'inboundMobility', labelKey: 'movementStatistics.columns.inboundMobility', width: 16, selectedByDefault: true },
  { key: 'iep', labelKey: 'movementStatistics.columns.iep', width: 10, selectedByDefault: true },
]

export const movementStatisticsExportFields = movementStatisticsExportColumnMeta.map((col) => ({
  key: col.key,
  labelKey: col.labelKey,
  selectedByDefault: col.selectedByDefault !== false,
}))
