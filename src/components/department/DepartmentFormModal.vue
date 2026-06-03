<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { useDeleteConfirm } from '../../composables/useDeleteConfirm.js'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import {
  categoryOptions,
  yesNoOptions,
  yearOptions,
  createEmptyPreviousRecord,
} from '../../data/departments.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  reportToOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()
const {
  deleteConfirmVisible,
  deleteConfirmMessage,
  requestDelete: requestDeleteConfirm,
  confirmDelete,
  cancelDelete,
} = useDeleteConfirm()

const form = ref(createEmptyForm())
const errors = ref({})

const modalTitle = computed(() => (props.mode === 'edit' ? t('common.edit') : t('common.create')))

const parentOptions = computed(() => {
  const exclude = props.mode === 'edit' && props.initialData ? props.initialData.code : ''
  return props.reportToOptions.filter((item) => item !== exclude)
})

function createEmptyForm() {
  return {
    deptId: '',
    category: '',
    nameEn: '',
    nameZh: '',
    code: '',
    departmentHead: '',
    reportTo: '',
    officeExtension: '',
    officeNo: '',
    email: '',
    established: '',
    active: 'No',
    teaching: 'No',
    offering: 'Yes',
    previousRecords: [],
    remarks: '',
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    errors.value = {}
    if (props.mode === 'edit' && props.initialData) {
      form.value = {
        deptId: props.initialData.deptId,
        category: props.initialData.category,
        nameEn: props.initialData.nameEn,
        nameZh: props.initialData.nameZh,
        code: props.initialData.code,
        departmentHead: props.initialData.departmentHead || '',
        reportTo: props.initialData.reportTo || '',
        officeExtension: props.initialData.officeExtension || '',
        officeNo: props.initialData.officeNo || '',
        email: props.initialData.email || '',
        established: props.initialData.established || '',
        active: props.initialData.active,
        teaching: props.initialData.teaching,
        offering: props.initialData.offering,
        previousRecords: (props.initialData.previousRecords || []).map((row) => normalizePreviousRecordRow({ ...row })),
        remarks: props.initialData.remarks || '',
      }
    } else {
      form.value = createEmptyForm()
    }
  },
)

function validate() {
  const nextErrors = {}
  if (!form.value.deptId.trim()) nextErrors.deptId = 'ID is required'
  if (!form.value.category) nextErrors.category = 'Category is required'
  if (!form.value.nameEn.trim()) nextErrors.nameEn = 'Department Name is required'
  if (!form.value.nameZh.trim()) nextErrors.nameZh = 'Department Name (Chinese) is required'
  if (!form.value.code.trim()) nextErrors.code = 'Code is required'
  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

function addPreviousRecord() {
  form.value.previousRecords.push(createEmptyPreviousRecord())
}

function removePreviousRecord(id) {
  requestDeleteConfirm(
    () => {
      form.value.previousRecords = form.value.previousRecords.filter((row) => row.id !== id)
    },
    tr('Are you sure you want to delete this record?'),
  )
}

/** 结束年份必须晚于开始年份 */
function getYearToOptions(yearFrom) {
  if (!yearFrom) return []
  const from = Number(yearFrom)
  return yearOptions.filter((y) => Number(y) > from)
}

function normalizePreviousRecordRow(row) {
  if (row.yearFrom && row.yearTo && Number(row.yearTo) <= Number(row.yearFrom)) {
    row.yearTo = ''
  }
  return row
}

function onYearFromChange(row) {
  if (row.yearTo && row.yearFrom && Number(row.yearTo) <= Number(row.yearFrom)) {
    row.yearTo = ''
  }
}

function buildPayload() {
  return {
    deptId: form.value.deptId.trim(),
    category: form.value.category,
    nameEn: form.value.nameEn.trim(),
    nameZh: form.value.nameZh.trim(),
    code: form.value.code.trim(),
    departmentHead: form.value.departmentHead.trim(),
    reportTo: form.value.reportTo,
    officeExtension: form.value.officeExtension.trim(),
    officeNo: form.value.officeNo.trim(),
    email: form.value.email.trim(),
    established: form.value.established.trim(),
    active: form.value.active,
    teaching: form.value.teaching,
    offering: form.value.offering,
    previousRecords: form.value.previousRecords
      .filter((row) => row.yearFrom || row.yearTo || row.departmentName.trim())
      .map((row) => ({
        id: row.id,
        yearFrom: row.yearFrom,
        yearTo: row.yearTo,
        departmentName: row.departmentName.trim(),
      })),
    remarks: form.value.remarks.slice(0, 100),
  }
}

function handleSave() {
  if (!validate()) return
  emit('save', buildPayload())
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-form">
          <div class="form-grid">
            <div class="form-col">
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('ID:') }}</label>
                <input v-model="form.deptId" type="text" class="form-input" :class="{ error: errors.deptId }" :placeholder="t('common.pleaseInput')" />
                <p v-if="errors.deptId" class="field-error">{{ tr(errors.deptId) }}</p>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Department Name:') }}</label>
                <input v-model="form.nameEn" type="text" class="form-input" :class="{ error: errors.nameEn }" :placeholder="t('common.pleaseInput')" />
                <p v-if="errors.nameEn" class="field-error">{{ tr(errors.nameEn) }}</p>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Code:') }}</label>
                <input v-model="form.code" type="text" class="form-input" :class="{ error: errors.code }" :placeholder="t('common.pleaseInput')" />
                <p v-if="errors.code" class="field-error">{{ tr(errors.code) }}</p>
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Report to:') }}</label>
                <select v-model="form.reportTo" class="form-input">
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in parentOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Office No.:') }}</label>
                <input v-model="form.officeNo" type="text" class="form-input" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Established:') }}</label>
                <input v-model="form.established" type="text" class="form-input" :placeholder="t('common.pleaseSelectDate')" />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Teaching:') }}</label>
                <div class="radio-group">
                  <label v-for="opt in yesNoOptions" :key="`t-${opt}`">
                    <input v-model="form.teaching" type="radio" :value="opt" /> {{ tr(opt) }}
                  </label>
                </div>
              </div>
            </div>

            <div class="form-col">
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Category:') }}</label>
                <select v-model="form.category" class="form-input" :class="{ error: errors.category }">
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
                </select>
                <p v-if="errors.category" class="field-error">{{ tr(errors.category) }}</p>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Department Name (Chinese):') }}</label>
                <input v-model="form.nameZh" type="text" class="form-input" :class="{ error: errors.nameZh }" :placeholder="t('common.pleaseInput')" />
                <p v-if="errors.nameZh" class="field-error">{{ tr(errors.nameZh) }}</p>
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Department Head:') }}</label>
                <input v-model="form.departmentHead" type="text" class="form-input" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Office Extension:') }}</label>
                <input v-model="form.officeExtension" type="text" class="form-input" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Email:') }}</label>
                <input v-model="form.email" type="text" class="form-input" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Active:') }}</label>
                <div class="radio-group">
                  <label v-for="opt in yesNoOptions" :key="`a-${opt}`">
                    <input v-model="form.active" type="radio" :value="opt" /> {{ tr(opt) }}
                  </label>
                </div>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Offering:') }}</label>
                <div class="radio-group">
                  <label v-for="opt in yesNoOptions" :key="`o-${opt}`">
                    <input v-model="form.offering" type="radio" :value="opt" /> {{ tr(opt) }}
                  </label>
                </div>
              </div>
            </div>

            <div class="form-row full previous-section">
              <label class="form-label">{{ tr('Previous Record:') }}</label>
              <div class="previous-wrap">
                <div v-for="row in form.previousRecords" :key="row.id" class="previous-row">
                  <span class="previous-label">{{ tr('Year:') }}</span>
                  <select v-model="row.yearFrom" class="year-select" @change="onYearFromChange(row)">
                    <option value=""></option>
                    <option v-for="y in yearOptions" :key="`f-${row.id}-${y}`" :value="y">{{ y }}</option>
                  </select>
                  <span class="year-sep">~</span>
                  <select v-model="row.yearTo" class="year-select" :disabled="!row.yearFrom">
                    <option value=""></option>
                    <option v-for="y in getYearToOptions(row.yearFrom)" :key="`t-${row.id}-${y}`" :value="y">{{ y }}</option>
                  </select>
                  <input v-model="row.departmentName" type="text" class="previous-name" :placeholder="tr('please input department name')" />
                  <button type="button" class="row-remove" :aria-label="t('common.remove')" @click="removePreviousRecord(row.id)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
                <button type="button" class="add-record-btn" @click="addPreviousRecord">{{ t('common.addRecord') }}</button>
              </div>
            </div>

            <div class="form-row full textarea-row">
              <label class="form-label">{{ tr('Remarks:') }}</label>
              <div class="textarea-wrap">
                <textarea v-model="form.remarks" class="form-textarea" maxlength="100" :placeholder="t('common.pleaseInput')" />
                <span class="char-count">{{ form.remarks.length }}/100</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
    <ConfirmDialog
      :visible="deleteConfirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="deleteConfirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-panel {
  --modal-pad-x: 28px;
  width: 100%;
  max-width: 1040px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding-bottom: 20px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--modal-pad-x);
  margin-bottom: 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f0f0f0;
}

.modal-form {
  --form-label-w-left: 172px;
  --form-label-w-right: 200px;
  width: 100%;
  padding: 0 var(--modal-pad-x);
  box-sizing: border-box;
}

.form-grid {
  display: grid;
  grid-template-columns: var(--form-label-w-left) minmax(0, 1fr) var(--form-label-w-right) minmax(0, 1fr);
  column-gap: 10px 56px 12px;
  row-gap: 14px;
  width: 100%;
  align-items: center;
}

.form-col {
  display: grid;
  grid-template-columns: subgrid;
  gap: 14px 12px;
  align-items: center;
  min-width: 0;
}

.form-col:first-of-type {
  grid-column: 1 / 3;
}

.form-col:nth-of-type(2) {
  grid-column: 3 / 5;
}

.form-row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
}

.form-grid > .form-row.full {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  margin-top: 16px;
  align-items: center;
}

.form-grid > .form-row.full .form-label {
  grid-column: 1;
  align-self: center;
}

.form-grid > .form-row.full .previous-wrap,
.form-grid > .form-row.full .textarea-wrap {
  grid-column: 2 / -1;
  align-self: center;
}

.form-label {
  font-size: 14px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}

.form-col:first-of-type .form-label,
.form-grid > .form-row.full .form-label {
  width: var(--form-label-w-left);
  min-width: var(--form-label-w-left);
}

.form-col:nth-of-type(2) .form-label {
  width: var(--form-label-w-right);
  min-width: var(--form-label-w-right);
}

.form-col .form-input,
.form-col .radio-group,
.form-grid > .form-row.full .previous-wrap,
.form-grid > .form-row.full .textarea-wrap {
  width: 100%;
  min-width: 0;
}

.form-col:first-of-type .form-input,
.form-col:first-of-type .radio-group {
  justify-self: start;
  max-width: min(100%, 268px);
}

.required {
  color: #ef4444;
}

.form-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.radio-group {
  display: flex;
  gap: 20px;
  min-height: 36px;
  align-items: center;
  font-size: 14px;
}

.radio-group label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-group input {
  accent-color: #2563eb;
}

.previous-wrap {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  padding: 12px;
}

.previous-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.previous-label,
.year-sep {
  font-size: 14px;
  color: #374151;
}

.year-select {
  width: 108px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 13px;
  padding: 0 8px;
  background: #fff;
}

.year-select:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.previous-name {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 13px;
}

.row-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
}

.row-remove:hover {
  color: #ef4444;
  background: #fee2e2;
  border-radius: 4px;
}

.row-remove svg {
  width: 16px;
  height: 16px;
}

.add-record-btn {
  width: 100%;
  height: 36px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #374151;
}

.add-record-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.textarea-wrap {
  position: relative;
}

.form-textarea {
  width: 100%;
  min-height: 88px;
  padding: 10px 12px 28px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding: 0 var(--modal-pad-x);
  box-sizing: border-box;
}

.btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  width: 96px;
  height: 38px;
  padding: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}
</style>
