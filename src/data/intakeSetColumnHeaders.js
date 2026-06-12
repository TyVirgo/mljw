import { createColumnHeaderStore } from '../utils/columnHeaderConfig.js'

function h(id, group, nameZh, nameEn, nameMs = nameEn) {
  return { id, group, nameZh, nameEn, nameMs }
}

export const defaultIntakeSetColumnHeaders = [
  h('code', 'list', '批次代码', 'Code', 'Kod'),
  h('intake', 'list', '入学批次', 'Intake', 'Kemasukan'),
  h('active', 'form', '是否启用', 'Active', 'Aktif'),
]

export const intakeSetColumnHeaderSections = [
  { id: 'list', labelKey: 'pages.intakeSet.columnHeaderList' },
  { id: 'form', labelKey: 'pages.intakeSet.columnHeaderForm' },
]

export const intakeSetColumnHeaderStore = createColumnHeaderStore(
  'jw-intake-set-column-headers',
  defaultIntakeSetColumnHeaders,
)

export const {
  load: loadIntakeSetColumnHeaders,
  save: saveIntakeSetColumnHeaders,
  resolve: resolveIntakeSetColumnHeader,
} = intakeSetColumnHeaderStore
