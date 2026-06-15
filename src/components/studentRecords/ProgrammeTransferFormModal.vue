<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import DatePickerEn from '../common/DatePickerEn.vue'
import {
  createEmptyTransfer,
  getTransferFormData,
  buildStudentSnapshotFromProfile,
  validateTransferForm,
  programmeOptions,
  intakeOptions,
  semesterOptions,
} from '../../data/programmeTransfers.js'
import { initialStudents } from '../../data/students.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  existingTransfers: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save-draft', 'submit', 'resubmit'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyTransfer())
const errors = ref({})
const studentFilter = ref('')
const fileInputRef = ref(null)

const isEditMode = computed(() => props.mode === 'edit')
const isResubmitMode = computed(() => props.initialData?.status === 'Update Required')
const modalTitle = computed(() =>
  isEditMode.value ? t('programmeTransfer.form.editTitle') : t('programmeTransfer.form.createTitle'),
)

const studentOptions = computed(() => {
  const keyword = studentFilter.value.trim().toLowerCase()
  return initialStudents.filter((item) => {
    if (!keyword) return true
    const id = String(item.studentId || '').toLowerCase()
    const name = String(item.name || '').toLowerCase()
    const nameCn = String(item.nameCn || '').toLowerCase()
    return id.includes(keyword) || name.includes(keyword) || nameCn.includes(keyword)
  })
})

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    studentFilter.value = ''
    form.value =
      isEditMode.value && props.initialData
        ? getTransferFormData(props.initialData)
        : createEmptyTransfer()
  },
)

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
}

function onStudentChange() {
  const student = initialStudents.find((item) => item.studentId === form.value.studentId)
  if (!student) return
  const snapshot = buildStudentSnapshotFromProfile(student)
  form.value = { ...form.value, ...snapshot }
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    form.value.attachment = null
    return
  }
  const allowed = /\.(pdf|jpg|jpeg|png|docx)$/i
  if (!allowed.test(file.name)) {
    errors.value.attachment = 'Supported formats: PDF, JPG, PNG, DOCX.'
    form.value.attachment = null
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errors.value.attachment = 'Max file size is 5MB.'
    form.value.attachment = null
    return
  }
  delete errors.value.attachment
  form.value.attachment = { fileName: file.name, size: file.size }
}

function downloadConsentLetter() {
  window.alert(t('programmeTransfer.consentLetterHint'))
}

function validateAndEmit(mode, emitter) {
  const result = validateTransferForm(
    form.value,
    mode,
    props.existingTransfers,
    props.initialData?.id ?? null,
  )
  errors.value = result.errors
  if (!result.valid) return
  emitter({ ...form.value })
}

function handleSaveDraft() {
  validateAndEmit('draft', (payload) => emit('save-draft', payload))
}

function handleSubmit() {
  validateAndEmit('submit', (payload) => emit('submit', payload))
}

function handleResubmit() {
  validateAndEmit('submit', (payload) => emit('resubmit', payload))
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-panel">
      <header class="modal-header">
        <div>
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <p class="modal-subtitle">{{ t('programmeTransfer.officeSubtitle') }}</p>
        </div>
        <button type="button" class="close-btn" aria-label="Close" @click="handleClose">×</button>
      </header>

      <div class="modal-body">
        <div class="notes-box">
          <p class="notes-title">{{ t('programmeTransfer.notes.title') }}</p>
          <ol>
            <li>{{ t('programmeTransfer.notes.item1') }}</li>
            <li>{{ t('programmeTransfer.notes.item2') }}</li>
            <li>{{ t('programmeTransfer.notes.item3') }}</li>
          </ol>
        </div>

        <div class="section-bar">{{ t('programmeTransfer.sections.studentDetails') }}</div>
        <div class="form-grid">
          <div class="form-field span-2">
            <label>{{ tr('Student ID') }} <span class="required">*</span></label>
            <div class="student-select-row">
              <input
                v-model="studentFilter"
                type="text"
                class="filter-input"
                :placeholder="tr('Search')"
              />
              <select
                v-model="form.studentId"
                :class="['form-control', fieldError('studentId')]"
                @change="onStudentChange"
              >
                <option value="">{{ t('programmeTransfer.fields.selectStudent') }}</option>
                <option v-for="s in studentOptions" :key="s.studentId" :value="s.studentId">
                  {{ s.studentId }} — {{ s.name }}
                </option>
              </select>
            </div>
            <p v-if="errors.studentId" class="field-error">{{ tr(errors.studentId) }}</p>
          </div>
          <div class="form-field">
            <label>{{ tr('Full Name') }}</label>
            <input v-model="form.fullName" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ tr('NRIC/Passport No.') }}</label>
            <input v-model="form.nricPassport" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ tr('Nationality') }}</label>
            <input v-model="form.nationality" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ tr('Email') }}</label>
            <input v-model="form.email" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ tr('Contact No.') }}</label>
            <input v-model="form.contactNo" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.visaExpiry') }}</label>
            <input v-model="form.visaExpiryDate" type="text" class="form-control" readonly />
          </div>
        </div>

        <div class="section-bar">{{ t('programmeTransfer.sections.transferInfo') }}</div>
        <div class="form-grid">
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.currentProgramme') }}</label>
            <input v-model="form.currentProgramme" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.currentIntake') }}</label>
            <input v-model="form.currentIntake" type="text" class="form-control" readonly />
          </div>
          <div class="form-field span-2">
            <label>{{ t('programmeTransfer.fields.currentSchool') }}</label>
            <input v-model="form.currentSchool" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.newProgrammeFirst') }} <span class="required">*</span></label>
            <select v-model="form.newProgrammeFirstChoice" :class="['form-control', fieldError('newProgrammeFirstChoice')]">
              <option value="">{{ tr('please select') }}</option>
              <option v-for="opt in programmeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <p v-if="errors.newProgrammeFirstChoice" class="field-error">{{ tr(errors.newProgrammeFirstChoice) }}</p>
          </div>
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.newProgrammeSecond') }}</label>
            <select v-model="form.newProgrammeSecondChoice" class="form-control">
              <option value="">{{ tr('please select') }}</option>
              <option v-for="opt in programmeOptions" :key="`2-${opt}`" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.startSemester') }} <span class="required">*</span></label>
            <select v-model="form.startSemester" :class="['form-control', fieldError('startSemester')]">
              <option value="">{{ tr('please select') }}</option>
              <option v-for="opt in semesterOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <p v-if="errors.startSemester" class="field-error">{{ tr(errors.startSemester) }}</p>
          </div>
          <div class="form-field span-2">
            <label>{{ t('programmeTransfer.fields.transferReason') }} <span class="required">*</span></label>
            <textarea
              v-model="form.transferReason"
              rows="4"
              :class="['form-control', fieldError('transferReason')]"
              :placeholder="t('programmeTransfer.fields.transferReasonPlaceholder')"
            />
            <p v-if="errors.transferReason" class="field-error">{{ tr(errors.transferReason) }}</p>
          </div>
        </div>

        <div class="section-bar">{{ t('programmeTransfer.sections.declaration') }}</div>
        <div class="declaration-box">
          <ul>
            <li>{{ t('programmeTransfer.declaration.item1') }}</li>
            <li>{{ t('programmeTransfer.declaration.item2') }}</li>
          </ul>
          <label class="checkbox-row">
            <input v-model="form.declarationAgreed" type="checkbox" />
            <span>{{ t('programmeTransfer.fields.declarationAgree') }} <span class="required">*</span></span>
          </label>
          <p v-if="errors.declarationAgreed" class="field-error">{{ tr(errors.declarationAgreed) }}</p>
        </div>

        <div class="section-bar">{{ t('programmeTransfer.sections.documents') }}</div>
        <div class="documents-panel">
          <div class="attachment-header">
            <label class="attachment-label">
              {{ t('programmeTransfer.fields.uploadAttachment') }}
              <span class="required">*</span>
              :
            </label>
            <button type="button" class="btn btn-outline consent-btn" @click="downloadConsentLetter">
              {{ t('programmeTransfer.fields.downloadConsent') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
          <div class="file-row">
            <button type="button" class="btn btn-default" @click="fileInputRef?.click()">
              {{ t('programmeTransfer.fields.selectFile') }}
            </button>
            <span class="file-name">
              {{ form.attachment?.fileName || t('programmeTransfer.fields.noFileSelected') }}
            </span>
            <input ref="fileInputRef" type="file" class="hidden-file" accept=".pdf,.jpg,.jpeg,.png,.docx" @change="onFileChange" />
          </div>
          <p class="hint-text">{{ t('programmeTransfer.fields.attachmentHint') }}</p>
          <p v-if="errors.attachment" class="field-error">{{ tr(errors.attachment) }}</p>
        </div>

        <div class="section-bar">{{ t('programmeTransfer.sections.officeUse') }}</div>
        <div class="form-grid section-seven-grid">
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.adminNewProgramme') }}</label>
            <select v-model="form.adminNewProgramme" class="form-control">
              <option value="">{{ t('programmeTransfer.fields.selectProgramme') }}</option>
              <option v-for="opt in programmeOptions" :key="`a-${opt}`" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ t('programmeTransfer.fields.adminNewIntake') }}</label>
            <select v-model="form.adminNewIntake" class="form-control">
              <option value="">{{ t('programmeTransfer.fields.selectIntake') }}</option>
              <option v-for="opt in intakeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="form-field section-seven-date">
            <label>{{ t('programmeTransfer.fields.adminDate') }}</label>
            <DatePickerEn v-model="form.adminDate" :placeholder="tr('pleaseSelect')" />
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
        <template v-if="isResubmitMode">
          <button type="button" class="btn btn-primary" @click="handleResubmit">
            {{ t('programmeTransfer.actions.resubmit') }}
          </button>
        </template>
        <template v-else-if="isEditMode && initialData?.status === 'Draft'">
          <button type="button" class="btn btn-default" @click="handleSaveDraft">
            {{ t('programmeTransfer.actions.saveDraft') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleSubmit">
            {{ t('programmeTransfer.actions.submit') }}
          </button>
        </template>
        <template v-else-if="!isEditMode">
          <button type="button" class="btn btn-default" @click="handleSaveDraft">
            {{ t('programmeTransfer.actions.saveDraft') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleSubmit">
            {{ t('programmeTransfer.actions.submit') }}
          </button>
        </template>
        <template v-else>
          <button type="button" class="btn btn-primary" @click="handleSaveDraft">
            {{ t('common.save') }}
          </button>
        </template>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-panel {
  background: #fff;
  border-radius: 12px;
  width: min(920px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.modal-subtitle {
  margin: 4px 0 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 16px 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.notes-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #1e40af;
}

.notes-title {
  margin: 0 0 8px;
  font-weight: 600;
}

.notes-box ol {
  margin: 0;
  padding-left: 20px;
}

.section-bar {
  background: #f3f4f6;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #374151;
  margin: 16px 0 12px;
  border-radius: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.span-2 {
  grid-column: span 2;
}

.section-seven-grid .section-seven-date {
  grid-column: 1 / 2;
}

.form-field label {
  font-size: 13px;
  color: #374151;
}

.form-control {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  background: #f9fafb;
}

.form-control.error {
  border-color: #ef4444;
}

.form-control:not([readonly]) {
  background: #fff;
}

textarea.form-control {
  resize: vertical;
  min-height: 96px;
}

.required {
  color: #ef4444;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #ef4444;
}

.student-select-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px;
}

.filter-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
}

.declaration-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px 16px;
}

.declaration-box ul {
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 13px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.documents-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fff;
}

.attachment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.attachment-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  color: #2563eb;
  background: #fff;
  border: 1px solid #2563eb;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-outline:hover {
  background: #eff6ff;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  font-size: 13px;
  color: #6b7280;
}

.hidden-file {
  display: none;
}

.hint-text {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.consent-btn {
  flex-shrink: 0;
}

.btn {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
