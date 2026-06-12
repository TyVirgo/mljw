import { createColumnHeaderStore } from '../utils/columnHeaderConfig.js'

function h(id, group, nameZh, nameEn, nameMs = nameEn) {
  return { id, group, nameZh, nameEn, nameMs }
}

export const defaultProgrammeIntakeColumnHeaders = [
  h('programmeIntake', 'list', '专业批次', 'Programme Intake', 'Kemasukan Program'),
  h('intake', 'list', '入学批次', 'Intake', 'Kemasukan'),
  h('years', 'list', '学制', 'Years', 'Tempoh Pengajian'),
  h('programmeCode', 'list', '专业代码', 'Programme Code', 'Kod Program'),
  h('programmeName', 'list', '专业名称', 'Programme Name', 'Nama Program'),
  h('school', 'list', '学院', 'School', 'Sekolah'),
  h('active', 'list', '是否启用', 'Active', 'Aktif'),
  h('schoolFilter', 'create', '学院', 'School', 'Sekolah'),
  h('programmeFilter', 'create', '培养方案', 'Programme', 'Program'),
  h('startingSemester', 'form', '起始学年学期', 'Starting Academic Session', 'Sesi Akademik Permulaan'),
  h('newProgrammeIntake', 'copy', '新专业批次', 'New Programme Intake', 'Kemasukan Program Baharu'),
]

export const programmeIntakeColumnHeaderSections = [
  { id: 'list', labelKey: 'pages.programmeIntake.columnHeaderList' },
  { id: 'create', labelKey: 'pages.programmeIntake.columnHeaderCreate' },
  { id: 'form', labelKey: 'pages.programmeIntake.columnHeaderForm' },
  { id: 'copy', labelKey: 'pages.programmeIntake.columnHeaderCopy' },
]

export const programmeIntakeColumnHeaderStore = createColumnHeaderStore(
  'jw-programme-intake-column-headers',
  defaultProgrammeIntakeColumnHeaders,
)

export const {
  load: loadProgrammeIntakeColumnHeaders,
  save: saveProgrammeIntakeColumnHeaders,
  resolve: resolveProgrammeIntakeColumnHeader,
} = programmeIntakeColumnHeaderStore
