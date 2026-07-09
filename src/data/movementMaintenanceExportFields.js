import { MOVEMENT_LIST_EXPORT_COLUMN_META } from './movementListColumnConfig.js'

export const movementMaintenanceExportColumnMeta = MOVEMENT_LIST_EXPORT_COLUMN_META

export const movementMaintenanceExportFields = movementMaintenanceExportColumnMeta.map((col) => ({
  key: col.key,
  labelKey: col.labelKey,
  selectedByDefault: col.selectedByDefault !== false,
}))
