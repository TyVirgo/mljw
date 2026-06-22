<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createEmptyDeferment,
  getDefermentFormData,
  buildStudentSnapshotForDeferment,
  validateDefermentForm,
  defermentPeriodOptions,
  mainReasonOptions,
  formatApplicationDateDisplay,
  getMainReasonLabel,
  canResubmitDeferment,
} from '../../data/deferments.js'
import { initialStudents } from '../../data/students.js'
import {
  downloadStudentConsentTemplate,
  downloadParentConsentTemplate,
  hasParentConsentTemplate,
} from '../../utils/consentFormDownload.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  existingDeferments: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save-draft', 'submit', 'resubmit'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyDeferment())
const errors = ref({})
const studentFilter = ref('')
const fileInputRef = ref(null)

const isEditMode = computed(() => props.mode === 'edit')
const isResubmitMode = computed(() => props.initialData && canResubmitDeferment(props.initialData))
const modalTitle = computed(() =>
  isEditMode.value ? t('deferment.form.editTitle') : t('deferment.form.createTitle'),
)

const dateOfApplicationDisplay = computed(() =>
  formatApplicationDateDisplay(form.value.dateOfApplication),
)

function getSelectedStudentCategory() {
  const student = initialStudents.find(
    (item) =>
      item.studentId === form.value.studentId || item.basicInfo?.studentId === form.value.studentId,
  )
  return student?.studentCategory || 'Local'
}

const showParentConsentDownload = computed(() =>
  hasParentConsentTemplate('deferment', getSelectedStudentCategory()),
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
        ? getDefermentFormData(props.initialData)
        : createEmptyDeferment()
  },
)

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
}

function onStudentChange() {
  const student = initialStudents.find((item) => item.studentId === form.value.studentId)
  if (!student) return
  const snapshot = buildStudentSnapshotForDeferment(student)
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
  downloadStudentConsentTemplate('deferment', getSelectedStudentCategory(), t)
}

function downloadParentConsentLetter() {
  downloadParentConsentTemplate('deferment', getSelectedStudentCategory(), t)
}

function validateAndEmit(mode, emitter) {
  const result = validateDefermentForm(
    form.value,
    mode,
    props.existingDeferments,
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
        <h2 class="modal-title">{{ modalTitle }}</h2>
        <button type="button" class="close-btn" aria-label="Close" @click="handleClose">×</button>
      </header>

      <div class="modal-body">
        <div class="section-bar">{{ t('deferment.sections.studentInfo') }}</div>
        <div class="form-grid">
          <div class="form-field">
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
                <option value="">{{ t('deferment.fields.selectStudent') }}</option>
                <option v-for="s in studentOptions" :key="s.studentId" :value="s.studentId">
                  {{ s.studentId }} — {{ s.name }}
                </option>
              </select>
            </div>
            <p v-if="errors.studentId" class="field-error">{{ tr(errors.studentId) }}</p>
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.dateOfApplication') }}</label>
            <input :value="dateOfApplicationDisplay" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.name') }}</label>
            <input v-model="form.fullName" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.intake') }}</label>
            <input v-model="form.intake" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.nricPassport') }}</label>
            <input v-model="form.nricPassport" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.nationality') }}</label>
            <input v-model="form.nationality" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.programme') }}</label>
            <input v-model="form.programme" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.programmeLevel') }}</label>
            <input v-model="form.programmeLevel" type="text" class="form-control" readonly />
          </div>
        </div>

        <div class="section-bar">{{ t('deferment.sections.studentApplication') }}</div>
        <div class="form-grid">
          <div class="form-field">
            <label>{{ t('deferment.fields.personalEmail') }}</label>
            <input v-model="form.personalEmail" type="text" class="form-control" />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.phoneNumber') }}</label>
            <input v-model="form.phoneNumber" type="text" class="form-control" />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.accommodationRoomNo') }}</label>
            <input v-model="form.accommodationRoomNo" type="text" class="form-control" />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.defermentPeriod') }} <span class="required">*</span></label>
            <select v-model="form.defermentPeriod" :class="['form-control', fieldError('defermentPeriod')]">
              <option value="">{{ tr('pleaseSelect') }}</option>
              <option v-for="opt in defermentPeriodOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <p v-if="errors.defermentPeriod" class="field-error">{{ tr(errors.defermentPeriod) }}</p>
          </div>
          <div class="form-field span-2">
            <label>{{ t('deferment.fields.mainReason') }} <span class="required">*</span></label>
            <select v-model="form.mainReason" :class="['form-control', fieldError('mainReason')]">
              <option value="">{{ tr('pleaseSelect') }}</option>
              <option v-for="opt in mainReasonOptions" :key="opt" :value="opt">
                {{ getMainReasonLabel(opt, t) }}
              </option>
            </select>
            <p v-if="errors.mainReason" class="field-error">{{ tr(errors.mainReason) }}</p>
          </div>
          <div class="form-field span-2">
            <label>{{ t('deferment.fields.detailedReason') }}</label>
            <textarea v-model="form.detailedReason" rows="4" class="form-control" />
          </div>
        </div>

        <div class="section-bar">{{ t('deferment.sections.parentConsent') }}</div>
        <div class="form-grid">
          <div class="form-field">
            <label>{{ t('deferment.fields.parentGuardianName') }} <span class="required">*</span></label>
            <input
              v-model="form.parentGuardianName"
              type="text"
              :class="['form-control', fieldError('parentGuardianName')]"
            />
            <p v-if="errors.parentGuardianName" class="field-error">{{ tr(errors.parentGuardianName) }}</p>
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.parentContactNo') }} <span class="required">*</span></label>
            <input
              v-model="form.parentContactNo"
              type="text"
              :class="['form-control', fieldError('parentContactNo')]"
            />
            <p v-if="errors.parentContactNo" class="field-error">{{ tr(errors.parentContactNo) }}</p>
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.parentNricPassport') }}</label>
            <input v-model="form.parentNricPassport" type="text" class="form-control" />
          </div>
          <div class="form-field">
            <label>{{ t('deferment.fields.parentRelationship') }}</label>
            <input v-model="form.parentRelationship" type="text" class="form-control" />
          </div>
          <div class="form-field span-2">
            <label>{{ t('deferment.fields.parentEmail') }}</label>
            <input v-model="form.parentEmail" type="text" class="form-control" />
          </div>
          <div v-if="showParentConsentDownload" class="form-field span-2 parent-download-row">
            <button type="button" class="btn btn-outline consent-btn" @click="downloadParentConsentLetter">
              {{ t('consentForm.downloadParentConsent') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        </div>

        <div class="section-bar">{{ t('deferment.sections.documents') }}</div>
        <div class="documents-panel">
          <div class="attachment-header">
            <label class="attachment-label">
              {{ t('deferment.fields.uploadAttachment') }}
              <span class="required">*</span>
              :
            </label>
            <button type="button" class="btn btn-outline consent-btn" @click="downloadConsentLetter">
              {{ t('deferment.fields.downloadConsent') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
          <div class="file-row">
            <button type="button" class="btn btn-default" @click="fileInputRef?.click()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {{ t('deferment.fields.selectFile') }}
            </button>
            <span class="file-name">
              {{ form.attachment?.fileName || t('deferment.fields.noFileSelected') }}
            </span>
            <input
              ref="fileInputRef"
              type="file"
              class="hidden-file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              @change="onFileChange"
            />
          </div>
          <p class="hint-text">{{ t('deferment.fields.attachmentHint') }}</p>
          <p v-if="errors.attachment" class="field-error">{{ tr(errors.attachment) }}</p>
        </div>

        <div class="info-alert">{{ t('deferment.infoAlert') }}</div>
      </div>

      <footer class="modal-footer">
        <button type="button" class="btn btn-default" @click="handleClose">
          {{ t('deferment.actions.close') }}
        </button>
        <button v-if="!isResubmitMode" type="button" class="btn btn-default" @click="handleSaveDraft">
          {{ t('deferment.actions.saveDraft') }}
        </button>
        <button
          v-if="isResubmitMode"
          type="button"
          class="btn btn-primary"
          @click="handleResubmit"
        >
          {{ t('deferment.actions.resubmit') }}
        </button>
        <button v-else type="button" class="btn btn-primary" @click="handleSubmit">
          {{ t('deferment.actions.submit') }}
        </button>
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
  align-items: center;
  padding: 20px 24px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
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

.form-field label {
  font-size: 13px;
  color: #374151;
  font-weight: 600;
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

.info-alert {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-icon {
  width: 14px;
  height: 14px;
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
