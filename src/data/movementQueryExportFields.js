import { movementMaintenanceExportColumnMeta } from './movementMaintenanceExportFields.js'

export const movementQueryOptionalExportColumnMeta = [
  { key: 'currentSchool', labelKey: 'movementMaintenance.columns.currentSchool', width: 20, selectedByDefault: false },
  { key: 'currentProgrammeCode', labelKey: 'movementMaintenance.columns.currentProgrammeCode', width: 18, selectedByDefault: false },
  { key: 'newSchool', labelKey: 'movementMaintenance.columns.newSchool', width: 20, selectedByDefault: false },
  { key: 'newProgrammeCode', labelKey: 'movementMaintenance.columns.newProgrammeCode', width: 18, selectedByDefault: false },
  { key: 'newProgrammeName', labelKey: 'movementMaintenance.columns.newProgrammeName', width: 24, selectedByDefault: false },
  { key: 'englishName', labelKey: 'movementMaintenance.columns.englishName', width: 22, selectedByDefault: false },
  { key: 'cgpa', labelKey: 'movementMaintenance.columns.cgpa', width: 10, selectedByDefault: false },
  { key: 'movementNumber', labelKey: 'movementMaintenance.columns.movementNumber', width: 16, selectedByDefault: false },
  { key: 'remark', labelKey: 'movementMaintenance.columns.remark', width: 24, selectedByDefault: false },
]

export const movementQueryExportColumnMeta = [
  ...movementMaintenanceExportColumnMeta,
  ...movementQueryOptionalExportColumnMeta,
]

export const movementQueryExportFields = movementQueryExportColumnMeta.map((col) => ({
  key: col.key,
  labelKey: col.labelKey,
  selectedByDefault: col.selectedByDefault !== false,
}))
