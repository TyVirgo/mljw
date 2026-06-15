<script setup>

import { ref, watch, computed } from 'vue'

import { useAppI18n } from '../../composables/useAppI18n.js'

import {

  createEmptyResumption,

  getResumptionFormData,

  buildStudentSnapshotForResumption,

  validateResumptionForm,

  semesterOptions,

  formatApplicationDateDisplay,

  canResubmitResumption,

} from '../../data/resumptions.js'

import { initialStudents } from '../../data/students.js'



const props = defineProps({

  visible: Boolean,

  mode: { type: String, default: 'create' },

  initialData: { type: Object, default: null },

  existingResumptions: { type: Array, default: () => [] },

})



const emit = defineEmits(['close', 'save-draft', 'submit', 'resubmit'])



const { t, tr } = useAppI18n()



const form = ref(createEmptyResumption())

const errors = ref({})

const studentFilter = ref('')

const fileInputRef = ref(null)



const isEditMode = computed(() => props.mode === 'edit')

const isResubmitMode = computed(() => props.initialData && canResubmitResumption(props.initialData))

const modalTitle = computed(() =>

  isEditMode.value ? t('resumption.form.editTitle') : t('resumption.form.createTitle'),

)



const dateOfApplicationDisplay = computed(() =>

  formatApplicationDateDisplay(form.value.dateOfApplication),

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

        ? getResumptionFormData(props.initialData)

        : createEmptyResumption()

  },

)



function fieldError(key) {

  return errors.value[key] ? 'error' : ''

}



function onStudentChange() {

  const student = initialStudents.find((item) => item.studentId === form.value.studentId)

  if (!student) return

  const snapshot = buildStudentSnapshotForResumption(student)

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

  window.alert(t('resumption.consentLetterHint'))

}



function validateAndEmit(mode, emitter) {

  const result = validateResumptionForm(

    form.value,

    mode,

    props.existingResumptions,

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

        <div class="section-bar">{{ t('resumption.sections.studentInfo') }}</div>

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

                <option value="">{{ t('resumption.fields.selectStudent') }}</option>

                <option v-for="s in studentOptions" :key="s.studentId" :value="s.studentId">

                  {{ s.studentId }} — {{ s.name }}

                </option>

              </select>

            </div>

            <p v-if="errors.studentId" class="field-error">{{ tr(errors.studentId) }}</p>

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.dateOfApplication') }}</label>

            <input :value="dateOfApplicationDisplay" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.name') }}</label>

            <input v-model="form.fullName" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.originalIntake') }}</label>

            <input v-model="form.originalIntake" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.programme') }}</label>

            <input v-model="form.programme" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.programmeLevel') }}</label>

            <input v-model="form.programmeLevel" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.nricPassport') }}</label>

            <input v-model="form.nricPassport" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.nationality') }}</label>

            <input v-model="form.nationality" type="text" class="form-control" readonly />

          </div>

        </div>



        <div class="section-bar">{{ t('resumption.sections.resumptionDetails') }}</div>

        <div class="form-grid">

          <div class="form-field">

            <label>{{ t('resumption.fields.personalEmail') }}</label>

            <input v-model="form.personalEmail" type="text" class="form-control" />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.phoneNumber') }}</label>

            <input v-model="form.phoneNumber" type="text" class="form-control" />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.defermentSemester') }} <span class="required">*</span></label>

            <select v-model="form.defermentSemester" :class="['form-control', fieldError('defermentSemester')]">

              <option value="">{{ tr('pleaseSelect') }}</option>

              <option v-for="opt in semesterOptions" :key="`d-${opt}`" :value="opt">{{ opt }}</option>

            </select>

            <p v-if="errors.defermentSemester" class="field-error">{{ tr(errors.defermentSemester) }}</p>

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.resumptionSemester') }} <span class="required">*</span></label>

            <select v-model="form.resumptionSemester" :class="['form-control', fieldError('resumptionSemester')]">

              <option value="">{{ tr('pleaseSelect') }}</option>

              <option v-for="opt in semesterOptions" :key="`r-${opt}`" :value="opt">{{ opt }}</option>

            </select>

            <p v-if="errors.resumptionSemester" class="field-error">{{ tr(errors.resumptionSemester) }}</p>

          </div>

        </div>



        <div class="section-bar">{{ t('resumption.sections.documents') }}</div>

        <div class="documents-panel">

          <div class="attachment-header">

            <label class="attachment-label">

              {{ t('resumption.fields.uploadAttachment') }}

              <span class="required">*</span>

              :

            </label>

            <button type="button" class="btn btn-outline consent-btn" @click="downloadConsentLetter">

              {{ t('resumption.fields.downloadConsent') }}

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

              {{ t('resumption.fields.selectFile') }}

            </button>

            <span class="file-name">

              {{ form.attachment?.fileName || t('resumption.fields.noFileSelected') }}

            </span>

            <input

              ref="fileInputRef"

              type="file"

              class="hidden-file"

              accept=".pdf,.jpg,.jpeg,.png,.docx"

              @change="onFileChange"

            />

          </div>

          <p class="hint-text">{{ t('resumption.fields.attachmentHint') }}</p>

          <p v-if="errors.attachment" class="field-error">{{ tr(errors.attachment) }}</p>

        </div>



        <div class="declaration-box">

          <label class="checkbox-row">

            <input v-model="form.declarationCorrect" type="checkbox" />

            <span>{{ t('resumption.declaration.correct') }} <span class="required">*</span></span>

          </label>

          <p v-if="errors.declarationCorrect" class="field-error">{{ tr(errors.declarationCorrect) }}</p>

          <label class="checkbox-row">

            <input v-model="form.declarationMaxDuration" type="checkbox" />

            <span>{{ t('resumption.declaration.maxDuration') }} <span class="required">*</span></span>

          </label>

          <p v-if="errors.declarationMaxDuration" class="field-error">{{ tr(errors.declarationMaxDuration) }}</p>

        </div>



        <div class="note-alert">{{ t('resumption.noteAlert') }}</div>

      </div>



      <footer class="modal-footer">

        <button type="button" class="btn btn-default" @click="handleClose">

          {{ t('resumption.actions.close') }}

        </button>

        <button v-if="!isResubmitMode" type="button" class="btn btn-default" @click="handleSaveDraft">

          {{ t('resumption.actions.saveDraft') }}

        </button>

        <button

          v-if="isResubmitMode"

          type="button"

          class="btn btn-primary"

          @click="handleResubmit"

        >

          {{ t('resumption.actions.resubmit') }}

        </button>

        <button v-else type="button" class="btn btn-primary" @click="handleSubmit">

          {{ t('resumption.actions.submit') }}

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



.declaration-box {

  margin-top: 16px;

  padding: 12px 16px;

  border: 1px solid #e5e7eb;

  border-radius: 8px;

  background: #fafafa;

}



.checkbox-row {

  display: flex;

  align-items: flex-start;

  gap: 8px;

  font-size: 13px;

  margin-bottom: 10px;

}



.checkbox-row:last-of-type {

  margin-bottom: 0;

}



.note-alert {

  margin-top: 16px;

  padding: 12px 16px;

  background: #eff6ff;

  border: 1px solid #bfdbfe;

  border-radius: 8px;

  font-size: 13px;

  color: #1e40af;

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


