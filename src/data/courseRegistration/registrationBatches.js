import { ref } from 'vue'
import { batchDateToPicker } from './registrationBatchFormUtils.js'

const initialBatches = [
  {
    id: 'batch-2504-m1',
    name: '2504 ME Course Registration',
    academicSession: '2025/04',
    type: 'ME',
    status: 'active',
    roundsSummary: 'Pre 25-Aug–28-Aug · Main 29-Aug–02-Sep · Supp 03-Sep–05-Sep',
    scope: ['COS×2409', 'DSA×2504', 'AIT×2504', 'SWE×2409'],
    autoImportResumption: true,
    creditMin: 12,
    creditMax: 20,
    billHours: 48,
    courseCount: 24,
    rounds: {
      preselect: { start: '25-Aug-2025', end: '28-Aug-2025' },
      main: { start: '29-Aug-2025', end: '02-Sep-2025' },
      supplement: { start: '03-Sep-2025', end: '05-Sep-2025' },
    },
    addDropWindow: { start: '08-Sep-2025', end: '19-Sep-2025' },
    dropDeadlineWeek: 5,
    notifyTemplate: 'default-m1',
  },
  {
    id: 'batch-2504-g1',
    name: '2504 GE General Studies',
    academicSession: '2025/04',
    type: 'GE',
    status: 'draft',
    roundsSummary: 'Pre 01-Sep–03-Sep · Main 04-Sep–06-Sep',
    scope: ['All Programmes×2504'],
    autoImportResumption: false,
    creditMin: 4,
    creditMax: 8,
    billHours: 48,
    courseCount: 12,
    rounds: {
      preselect: { start: '01-Sep-2025', end: '03-Sep-2025' },
      main: { start: '04-Sep-2025', end: '06-Sep-2025' },
      supplement: { start: '07-Sep-2025', end: '08-Sep-2025' },
    },
    addDropWindow: { start: '10-Sep-2025', end: '26-Sep-2025' },
    dropDeadlineWeek: 5,
    notifyTemplate: 'default-g1',
  },
  {
    id: 'batch-2502-mandatory',
    name: '2502 Mandatory Registration',
    academicSession: '2025/02',
    type: 'Mandatory',
    status: 'closed',
    roundsSummary: 'Closed · Main completed 15-Jan–20-Jan',
    scope: ['All Programmes×2409', 'All Programmes×2504'],
    autoImportResumption: true,
    creditMin: 12,
    creditMax: 20,
    billHours: 48,
    courseCount: 8,
    rounds: {
      preselect: { start: '10-Jan-2025', end: '12-Jan-2025' },
      main: { start: '15-Jan-2025', end: '20-Jan-2025' },
      supplement: { start: '21-Jan-2025', end: '22-Jan-2025' },
    },
    addDropWindow: { start: '25-Jan-2025', end: '10-Feb-2025' },
    dropDeadlineWeek: 5,
    notifyTemplate: 'default-mandatory',
  },
  {
    id: 'batch-2506-short',
    name: '2506 Short Semester ME',
    academicSession: '2026/02',
    type: 'ME',
    status: 'draft',
    roundsSummary: 'Pre 02-Jun–03-Jun · Main 04-Jun–06-Jun',
    scope: ['COS×2409', 'DSA×2409'],
    autoImportResumption: false,
    creditMin: 4,
    creditMax: 8,
    billHours: 48,
    courseCount: 6,
    rounds: {
      preselect: { start: '02-Jun-2025', end: '03-Jun-2025' },
      main: { start: '04-Jun-2025', end: '06-Jun-2025' },
      supplement: { start: '07-Jun-2025', end: '08-Jun-2025' },
    },
    addDropWindow: { start: '10-Jun-2025', end: '20-Jun-2025' },
    dropDeadlineWeek: 3,
    notifyTemplate: 'default-short',
  },
]

export const registrationBatches = ref(initialBatches.map((item) => ({ ...item })))

let batchSeq = 3

export function defaultRounds() {
  return {
    preselect: { start: '25-Aug-2025', end: '28-Aug-2025' },
    main: { start: '29-Aug-2025', end: '02-Sep-2025' },
    supplement: { start: '03-Sep-2025', end: '05-Sep-2025' },
  }
}

export function defaultAddDropWindow() {
  return { start: '08-Sep-2025', end: '19-Sep-2025' }
}

export function formatRoundsSummary(rounds, addDropWindow) {
  const parts = [
    formatRoundRange(rounds?.preselect),
    formatRoundRange(rounds?.main),
    formatRoundRange(rounds?.supplement),
    formatRoundRange(addDropWindow),
  ].filter((part) => part && part !== '—')
  return parts.join(' · ')
}

/** 列表/导出：与 DatePickerEn 一致的 DD/MM/YYYY 时间段 */
export function formatRoundRange(range) {
  if (!range?.start) return '—'
  const start = batchDateToPicker(range.start)
  const end = range.end ? batchDateToPicker(range.end) : ''
  if (!start) return '—'
  return end ? `${start} – ${end}` : start
}

/** tooltip：与单元格同格式（已是完整日期） */
export function formatRoundRangeTitle(range) {
  const text = formatRoundRange(range)
  return text === '—' ? '' : text
}

export function createBatchId() {
  return `batch-new-${batchSeq++}`
}

export function getBatchById(id) {
  return registrationBatches.value.find((item) => item.id === id) || null
}

export function getActiveBatch() {
  return registrationBatches.value.find((item) => item.status === 'active') || registrationBatches.value[0] || null
}

export function addRegistrationBatch(payload) {
  const rounds = payload.rounds || {
    preselect: { start: '', end: '' },
    main: { start: '', end: '' },
    supplement: { start: '', end: '' },
  }
  const addDropWindow = payload.addDropWindow || { start: '', end: '' }
  const item = {
    id: createBatchId(),
    status: 'draft',
    courseCount: 0,
    dropDeadlineWeek: 5,
    ...payload,
    rounds,
    addDropWindow,
    roundsSummary: payload.roundsSummary || formatRoundsSummary(rounds, addDropWindow),
  }
  registrationBatches.value.unshift(item)
  return item
}

export function updateRegistrationBatch(id, patch) {
  const index = registrationBatches.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  registrationBatches.value[index] = { ...registrationBatches.value[index], ...patch }
  return { ok: true, item: registrationBatches.value[index] }
}

export function publishRegistrationBatch(id) {
  const batch = getBatchById(id)
  if (!batch) return { ok: false, errorKey: 'courseRegistration.batch.notFound' }
  if (!batch.scope?.length) {
    return { ok: false, errorKey: 'courseRegistration.batch.scopeRequired' }
  }
  return updateRegistrationBatch(id, { status: 'active' })
}
