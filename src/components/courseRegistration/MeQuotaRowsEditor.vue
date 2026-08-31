<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  meQuotaShareSum,
  meQuotaCountSum,
  meIntakeOptionPool,
  emptyMeIntakeQuotaRow,
  emptyMeSpecialQuotaRow,
  ME_QUOTA_KIND_INTAKE,
  ME_QUOTA_KIND_SPECIAL,
  ME_QUOTA_PICKER_SPECIAL,
  normalizeIntakeKey,
  validateMeQuotaRows,
  shareFromMeQuotaCount,
  countFromMeQuotaShare,
} from '../../data/courseRegistration/batchRound1Quota.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  totalCap: {
    type: Number,
    default: 100,
  },
  academicSession: { type: String, default: '' },
  programme: { type: String, default: '' },
  validationContext: {
    type: Object,
    default: () => ({ hasSpecialStudents: false, requiredIntakes: [] }),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useAppI18n()

const meShareError = ref('')
const openIntakePickerRowId = ref('')

const rows = computed(() => props.modelValue || [])
const meShareSum = computed(() => meQuotaShareSum(rows.value))
const meCountSum = computed(() => meQuotaCountSum(rows.value))
const meCountOverCap = computed(() => meCountSum.value > Math.max(0, Math.floor(Number(props.totalCap) || 0)))
const meIntakeOptions = computed(() => meIntakeOptionPool())
const hasSpecialRow = computed(() => rows.value.some((r) => r.kind === ME_QUOTA_KIND_SPECIAL))
const showTotalCapLabel = computed(() => String(props.programme || '').trim())

function patchRows(nextRows) {
  emit('update:modelValue', nextRows)
}

function takenMeIntakes(exceptRowId = '') {
  const taken = new Set()
  for (const row of rows.value) {
    if (row.id === exceptRowId) continue
    if (row.kind !== ME_QUOTA_KIND_INTAKE) continue
    for (const k of row.intakes || []) taken.add(normalizeIntakeKey(k) || k)
  }
  return taken
}

function isIntakeUnavailable(rowId, intakeKey) {
  const key = normalizeIntakeKey(intakeKey) || intakeKey
  const row = rows.value.find((r) => r.id === rowId)
  if ((row?.intakes || []).some((k) => (normalizeIntakeKey(k) || k) === key)) return true
  return takenMeIntakes(rowId).has(key)
}

function pickerOptionsForRow(rowId) {
  const opts = [
    {
      key: ME_QUOTA_PICKER_SPECIAL,
      label: t('courseRegistration.schedule.meQuotaSpecial'),
      disabled: hasSpecialRow.value,
      isSpecial: true,
    },
  ]
  for (const key of meIntakeOptions.value) {
    opts.push({
      key,
      label: key,
      disabled: isIntakeUnavailable(rowId, key),
      isSpecial: false,
    })
  }
  return opts
}

function toggleIntakePicker(rowId) {
  openIntakePickerRowId.value = openIntakePickerRowId.value === rowId ? '' : rowId
}

function closeIntakePicker() {
  openIntakePickerRowId.value = ''
}

function onDocumentClick() {
  closeIntakePicker()
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

function setMeRowShare(rowId, event) {
  const el = event?.target
  const raw = el ? el.value : event
  const n = Math.max(0, Number(raw))
  if (!Number.isFinite(n)) {
    const prev = rows.value.find((r) => r.id === rowId)?.share ?? 0
    if (el) el.value = String(prev)
    return
  }
  if (n > 100) {
    meShareError.value = t('courseRegistration.batch.round1MeShareRowMax')
    const prev = rows.value.find((r) => r.id === rowId)?.share ?? 0
    if (el) el.value = String(prev)
    return
  }
  const sum = meQuotaShareSum(
    rows.value.map((r) => (r.id === rowId ? { ...r, share: n } : r)),
  )
  if (sum > 100) {
    meShareError.value = t('courseRegistration.batch.round1MeShareOver', { sum })
    const prev = rows.value.find((r) => r.id === rowId)?.share ?? 0
    if (el) el.value = String(prev)
    return
  }
  meShareError.value = ''
  const cap = Math.max(0, Math.floor(Number(props.totalCap) || 0))
  const next = rows.value.map((r) => {
    if (r.id !== rowId) return r
    const share = n
    const count = countFromMeQuotaShare(share, cap)
    return { ...r, share, count }
  })
  patchRows(next)
}

function setMeRowCount(rowId, event) {
  const el = event?.target
  const raw = el ? el.value : event
  const n = Math.max(0, Math.floor(Number(raw)))
  if (!Number.isFinite(n)) {
    const prev = rows.value.find((r) => r.id === rowId)?.count ?? 0
    if (el) el.value = String(prev)
    return
  }
  const cap = Math.max(0, Math.floor(Number(props.totalCap) || 0))
  if (n > cap) {
    meShareError.value = t('courseRegistration.batch.round1MeCountOverTotal', { total: cap })
    const prev = rows.value.find((r) => r.id === rowId)?.count ?? 0
    if (el) el.value = String(prev)
    return
  }
  const share = shareFromMeQuotaCount(n, cap)
  if (share > 100) {
    meShareError.value = t('courseRegistration.batch.round1MeShareRowMax')
    const prev = rows.value.find((r) => r.id === rowId)?.count ?? 0
    if (el) el.value = String(prev)
    return
  }
  const next = rows.value.map((r) => (r.id === rowId ? { ...r, count: n, share } : r))
  const sum = meQuotaShareSum(next)
  if (sum > 100) {
    meShareError.value = t('courseRegistration.batch.round1MeShareOver', { sum })
    const prev = rows.value.find((r) => r.id === rowId)?.count ?? 0
    if (el) el.value = String(prev)
    return
  }
  meShareError.value = ''
  patchRows(next)
}

function addMeIntakeRow() {
  meShareError.value = ''
  patchRows([...rows.value, emptyMeIntakeQuotaRow()])
}

function addSpecialRow() {
  if (hasSpecialRow.value) return
  meShareError.value = ''
  patchRows([...rows.value, emptyMeSpecialQuotaRow(0, 0)])
}

function removeMeQuotaRow(rowId) {
  meShareError.value = ''
  if (openIntakePickerRowId.value === rowId) closeIntakePicker()
  patchRows(rows.value.filter((r) => r.id !== rowId))
}

function addIntakeToRow(rowId, intakeKey) {
  const key = normalizeIntakeKey(intakeKey) || intakeKey
  if (!key || isIntakeUnavailable(rowId, key)) return
  if (takenMeIntakes(rowId).has(key)) {
    meShareError.value = t('courseRegistration.schedule.meQuotaIntakeDup', { intakes: key })
    return
  }
  meShareError.value = ''
  patchRows(
    rows.value.map((r) => {
      if (r.id !== rowId || r.kind !== ME_QUOTA_KIND_INTAKE) return r
      if ((r.intakes || []).includes(key)) return r
      return { ...r, intakes: [...(r.intakes || []), key].sort() }
    }),
  )
}

function selectPickerOption(rowId, opt) {
  if (opt.disabled) return
  if (opt.key === ME_QUOTA_PICKER_SPECIAL) {
    addSpecialRow()
    closeIntakePicker()
    return
  }
  addIntakeToRow(rowId, opt.key)
  closeIntakePicker()
}

function removeIntakeFromRow(rowId, intakeKey) {
  meShareError.value = ''
  patchRows(
    rows.value.map((r) => {
      if (r.id !== rowId) return r
      return {
        ...r,
        intakes: (r.intakes || []).filter((k) => k !== intakeKey),
      }
    }),
  )
}

function validate() {
  const check = validateMeQuotaRows(rows.value, props.validationContext, props.totalCap)
  if (!check.ok) {
    meShareError.value = t(check.errorKey, check.errorParams || {})
    return false
  }
  meShareError.value = ''
  return true
}

function clearError() {
  meShareError.value = ''
}

defineExpose({ validate, clearError })
</script>

<template>
  <div class="me-quota-editor">
    <div class="scope-toolbar round1-me-toolbar">
      <div class="round1-me-actions">
        <button type="button" class="btn btn-primary" @click="addMeIntakeRow">
          + {{ t('common.create') }}
        </button>
        <div v-if="showTotalCapLabel" class="total-cap-field">
          <span class="total-cap-value">{{
            t('courseRegistration.batch.round1MeTotalCapByProgramme', {
              programme: programme,
              count: totalCap,
            })
          }}</span>
        </div>
      </div>
      <div class="round1-me-sums">
        <span
          class="round1-me-sum"
          :class="{ 'round1-me-sum--over': meCountOverCap }"
          :title="meCountOverCap ? t('courseRegistration.batch.round1MeCountOverCap', { sum: meCountSum, total: totalCap }) : undefined"
        >
          {{ t('courseRegistration.batch.round1MeCountSum', { sum: meCountSum }) }}
        </span>
        <span class="round1-me-sum">
          {{ t('courseRegistration.batch.round1MeShareSum', { sum: meShareSum }) }}
        </span>
      </div>
      <p v-if="meCountOverCap" class="round1-me-over-hint">
        {{ t('courseRegistration.batch.round1MeCountOverCap', { sum: meCountSum, total: totalCap }) }}
      </p>
    </div>
    <div
      class="scope-rules-table-wrap"
      :class="{ 'is-picker-open': !!openIntakePickerRowId }"
    >
      <table class="data-table scope-rules-table">
        <thead>
          <tr>
            <th>{{ t('courseRegistration.schedule.meQuotaBucket') }}</th>
            <th>
              <span class="req">*</span> {{ t('courseRegistration.batch.round1MeShare') }}
            </th>
            <th>
              <span class="req">*</span> {{ t('courseRegistration.batch.round1MeCount') }}
            </th>
            <th class="col-actions">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ 'me-quota-row-picker-open': openIntakePickerRowId === row.id }"
          >
            <td>
              <template v-if="row.kind === ME_QUOTA_KIND_SPECIAL">
                <span class="me-special-label">{{
                  t('courseRegistration.schedule.meQuotaSpecial')
                }}</span>
              </template>
              <template v-else>
                <div class="me-intake-chips">
                  <span v-for="ik in row.intakes" :key="ik" class="me-chip">
                    {{ ik }}
                    <button
                      type="button"
                      class="me-chip-x"
                      :aria-label="t('common.delete')"
                      @click="removeIntakeFromRow(row.id, ik)"
                    >
                      ×
                    </button>
                  </span>
                  <span v-if="!row.intakes?.length" class="me-intake-empty">{{
                    t('courseRegistration.schedule.meQuotaIntakeEmpty')
                  }}</span>
                  <div class="me-intake-picker-wrap" @click.stop>
                    <button
                      type="button"
                      class="me-intake-add-btn"
                      :aria-label="t('courseRegistration.schedule.meQuotaAddIntake')"
                      :aria-expanded="openIntakePickerRowId === row.id"
                      @click="toggleIntakePicker(row.id)"
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                    <div
                      v-if="openIntakePickerRowId === row.id"
                      class="me-intake-dropdown"
                      role="listbox"
                    >
                      <button
                        v-for="opt in pickerOptionsForRow(row.id)"
                        :key="opt.key"
                        type="button"
                        class="me-intake-option"
                        :class="{
                          'me-intake-option--disabled': opt.disabled,
                          'me-intake-option--special': opt.isSpecial,
                        }"
                        :disabled="opt.disabled"
                        role="option"
                        @click="selectPickerOption(row.id, opt)"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </td>
            <td>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                class="inline-number"
                :value="row.share"
                @change="setMeRowShare(row.id, $event)"
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                :max="totalCap"
                step="1"
                class="inline-number"
                :value="row.count"
                @change="setMeRowCount(row.id, $event)"
              />
            </td>
            <td class="col-actions">
              <button type="button" class="link-btn" @click="removeMeQuotaRow(row.id)">
                {{ t('common.delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="4" class="empty-cell">
              {{ t('courseRegistration.batch.round1MeNoData') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="meShareError" class="error-text">{{ meShareError }}</p>
  </div>
</template>

<style scoped>
.scope-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 0 8px;
}

.scope-rules-table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: auto;
  background: #fff;
}

.scope-rules-table-wrap.is-picker-open {
  overflow: visible;
}

.scope-rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.scope-rules-table th,
.scope-rules-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.scope-rules-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.scope-rules-table tbody tr:last-child td {
  border-bottom: none;
}

.scope-rules-table tbody tr.me-quota-row-picker-open {
  position: relative;
  z-index: 40;
}

.scope-rules-table .col-actions {
  width: 88px;
  text-align: center;
  white-space: nowrap;
}

.scope-rules-table .empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px 12px !important;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.round1-me-toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
}

.round1-me-over-hint {
  flex: 1 1 100%;
  margin: 0;
  font-size: 12px;
  color: #dc2626;
  text-align: right;
}

.round1-me-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.total-cap-field {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: #374151;
}

.total-cap-value {
  font-size: 13px;
  color: #111827;
  white-space: nowrap;
}

.round1-me-sums {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-left: auto;
}

.round1-me-sum {
  font-size: 13px;
  color: #6b7280;
}

.round1-me-sum--over {
  color: #dc2626;
  font-weight: 600;
}

.me-special-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.me-intake-chips {
  display: grid;
  grid-template-columns: repeat(6, max-content);
  gap: 6px;
  align-items: center;
  min-height: 24px;
}

.me-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12px;
}

.me-chip-x {
  border: none;
  background: transparent;
  color: #6366f1;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}

.me-intake-empty {
  font-size: 12px;
  color: #9ca3af;
}

.me-intake-picker-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.me-intake-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  color: #2563eb;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.me-intake-add-btn:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.me-intake-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  min-width: 200px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.me-intake-option {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: none;
  text-align: left;
  font-size: 13px;
  color: #111827;
  cursor: pointer;
  white-space: nowrap;
}

.me-intake-option--special {
  font-weight: 600;
  border-bottom: 1px solid #f3f4f6;
}

.me-intake-option:hover:not(:disabled) {
  background: #f3f4f6;
}

.me-intake-option--disabled,
.me-intake-option:disabled {
  color: #d1d5db;
  cursor: not-allowed;
}

.error-text {
  margin: 8px 0 0;
  font-size: 13px;
  color: #b91c1c;
}

.req {
  color: #ef4444;
}

.inline-number {
  width: 72px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}
</style>
