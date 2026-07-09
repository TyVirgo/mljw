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

  isEligibleForResumption,

  syncResumptionDefermentSemesterDates,

} from '../../data/resumptions.js'

import { findStudentByStudentId, initialStudents } from '../../data/students.js'
import { downloadStudentConsentTemplate } from '../../utils/consentFormDownload.js'
import StudentSelectModal from './StudentSelectModal.vue'
import MovementDeclarationSection from './MovementDeclarationSection.vue'
import MovementApplicantNotes from './MovementApplicantNotes.vue'
import { resumptionDeclarationItems } from '../../data/movementDeclarationItems.js'
import { resumptionApplicantNoteKeys } from '../../data/movementApplicantNotes.js'
import { getCurrentStudent } from '../../data/mockCurrentStudent.js'
import { formatApplicationSessionField } from '../../data/movementApplicationSession.js'
import MovementInternationalStudentRemarks from './MovementInternationalStudentRemarks.vue'
import MovementDocumentsUploadSection from './MovementDocumentsUploadSection.vue'
import { withMovementAttachments } from '../../data/movementAttachments.js'
import '../../styles/movement-form.css'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  existingResumptions: { type: Array, default: () => [] },
  applicantMode: {
    type: String,
    default: 'teacher',
    validator: (value) => ['teacher', 'student'].includes(value),
  },
})



const emit = defineEmits(['close', 'save-draft', 'submit', 'resubmit'])



const { t, tr } = useAppI18n()



const form = ref(createEmptyResumption())

const errors = ref({})

const studentSelectVisible = ref(false)

const isEditMode = computed(() => props.mode === 'edit')

const isResubmitMode = computed(() => props.initialData && canResubmitResumption(props.initialData))

const canSelectStudent = computed(() => props.applicantMode === 'teacher' && !isEditMode.value)

const modalTitle = computed(() =>

  isEditMode.value ? t('resumption.form.editTitle') : t('resumption.form.createTitle'),

)

const dateOfApplicationDisplay = computed(() =>

  formatApplicationDateDisplay(form.value.dateOfApplication),

)

const selectedStudentRecord = computed(() =>
  form.value.studentId ? findStudentByStudentId(form.value.studentId) : null,
)

const eligibilityBlocked = computed(
  () =>
    !!form.value.studentId &&
    !!selectedStudentRecord.value &&
    !isEligibleForResumption(selectedStudentRecord.value),
)

const canSubmitResumption = computed(() => !eligibilityBlocked.value)

const applicantCategory = computed(
  () => form.value.studentCategory || getSelectedStudentCategory(),
)

function applyStudentProfile(student) {
  if (!student) return
  const snapshot = buildStudentSnapshotForResumption(student)
  form.value = { ...form.value, ...snapshot }
}

function onStudentSelected(student) {
  applyStudentProfile(student)
  studentSelectVisible.value = false
}

watch(
  () => [props.visible, props.mode, props.initialData, props.applicantMode],
  () => {
    if (!props.visible) return
    errors.value = {}
    form.value =
      isEditMode.value && props.initialData
        ? getResumptionFormData(props.initialData)
        : createEmptyResumption()
    if (!isEditMode.value && props.applicantMode === 'student') {
      applyStudentProfile(getCurrentStudent())
    }
  },
)

watch(
  () => form.value.defermentSemester,
  () => {
    syncResumptionDefermentSemesterDates(form.value)
  },
  { immediate: true },
)

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
}

function getSelectedStudentCategory() {
  const student = initialStudents.find((item) => item.studentId === form.value.studentId)
  return student?.studentCategory || 'Local'
}

function getConsentLookup() {
  return {
    programmeLevel: form.value.programmeLevel,
  }
}

function downloadConsentLetter() {
  downloadStudentConsentTemplate('resumption', getSelectedStudentCategory(), t, getConsentLookup())
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

  emitter(withMovementAttachments(form.value))

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
        <MovementApplicantNotes
          title-key="resumption.notes.title"
          :item-keys="resumptionApplicantNoteKeys"
        />

        <MovementInternationalStudentRemarks
          source-key="resumption"
          :student-category="applicantCategory"
        />

        <div class="section-bar">{{ t('resumption.sections.studentInfo') }}</div>

        <div class="form-grid">

          <div class="form-field span-2">
            <div
              class="student-picker-row"
              :class="{ 'student-picker-row--with-button': canSelectStudent }"
            >
              <div class="picker-field">
                <label class="picker-label">
                  {{ tr('Student ID') }} <span class="required">*</span>
                  <span
                    v-if="eligibilityBlocked"
                    class="field-warning-tip-wrap"
                    tabindex="0"
                    :aria-label="t('resumption.errors.notDeferredStudent')"
                  >
                    <span class="field-warning-icon" aria-hidden="true">!</span>
                    <span class="field-warning-tooltip" role="tooltip">
                      {{ t('resumption.errors.notDeferredStudent') }}
                    </span>
                  </span>
                </label>
                <input
                  :value="form.studentId"
                  type="text"
                  class="form-control"
                  readonly
                  :class="fieldError('studentId') || (eligibilityBlocked ? 'error' : '')"
                  :placeholder="canSelectStudent ? t('studentSelect.selectPlaceholder') : ''"
                />
                <p v-if="!eligibilityBlocked && errors.studentId" class="field-error">
                  {{ tr(errors.studentId) }}
                </p>
              </div>
              <div class="picker-field">
                <label>{{ t('resumption.fields.name') }}</label>
                <input v-model="form.fullName" type="text" class="form-control" readonly />
              </div>
              <button
                v-if="canSelectStudent"
                type="button"
                class="btn-select-student"
                @click="studentSelectVisible = true"
              >
                {{ t('studentSelect.selectButton') }}
              </button>
            </div>
          </div>

          <div class="form-field">

            <label>{{ t('movementCommon.fields.currentAcademicSession') }}</label>

            <input :value="formatApplicationSessionField(form.currentAcademicSession)" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('movementCommon.fields.applicationAcademicSession') }}</label>

            <input :value="formatApplicationSessionField(form.applicationSession)" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('resumption.fields.dateOfApplication') }}</label>

            <input :value="dateOfApplicationDisplay" type="text" class="form-control" readonly />

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

          <div class="form-field">

            <label>{{ t('movementCommon.fields.visaExpiry') }}</label>

            <input v-model="form.visaExpiryDate" type="text" class="form-control" readonly />

          </div>

          <div class="form-field">

            <label>{{ t('movementCommon.fields.personalEmail') }}</label>

            <input v-model="form.personalEmail" type="text" class="form-control" />

          </div>

          <div class="form-field">

            <label>{{ t('movementCommon.fields.phoneNumber') }}</label>

            <input v-model="form.phoneNumber" type="text" class="form-control" />

          </div>

        </div>



        <div class="section-bar">{{ t('resumption.sections.studentApplication') }}</div>

        <div class="form-grid">

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

          <div class="form-field">

            <label>{{ t('deferment.fields.defermentStartDate') }}</label>

            <input

              :value="form.defermentStartDate"

              type="text"

              class="form-control"

              readonly

            />

          </div>

          <div class="form-field">

            <label>{{ t('deferment.fields.defermentEndDate') }}</label>

            <input

              :value="form.defermentEndDate"

              type="text"

              class="form-control"

              readonly

            />

          </div>

        </div>



        <div class="section-bar">{{ t('resumption.sections.documents') }}</div>

        <MovementDocumentsUploadSection
          source-key="resumption"
          :student-category="applicantCategory"
          :attachments="form.attachments"
          :errors="errors"
          @update:attachments="form.attachments = $event"
          @download-consent="downloadConsentLetter"
        />

        <MovementDeclarationSection
          :section-title="t('resumption.sections.declaration')"
          :items="resumptionDeclarationItems"
          :checkboxes="[{ field: 'declarationAgreed' }]"
          :form="form"
          :errors="errors"
        />

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
          :disabled="!canSubmitResumption"
          @click="handleResubmit"
        >

          {{ t('resumption.actions.resubmit') }}

        </button>

        <button
          v-else
          type="button"
          class="btn btn-primary"
          :disabled="!canSubmitResumption"
          @click="handleSubmit"
        >

          {{ t('resumption.actions.submit') }}

        </button>

      </footer>

    </div>

    <StudentSelectModal
      :visible="studentSelectVisible"
      :selected-student-id="form.studentId"
      @close="studentSelectVisible = false"
      @confirm="onStudentSelected"
    />

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



.required {

  color: #ef4444;

}



.field-error {

  margin: 0;

  font-size: 12px;

  color: #ef4444;

}

.picker-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.field-warning-tip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  outline: none;
}

.field-warning-icon {
  width: 16px;
  height: 16px;
  border: 1px solid #f59e0b;
  border-radius: 50%;
  background: #fef3c7;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #b45309;
  cursor: help;
}

.field-warning-tooltip {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  width: 288px;
  max-width: min(288px, calc(100vw - 48px));
  padding: 8px 10px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  color: #92400e;
  text-align: left;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  z-index: 20;
}

.field-warning-tip-wrap:hover .field-warning-tooltip,
.field-warning-tip-wrap:focus-within .field-warning-tooltip {
  opacity: 1;
  visibility: visible;
}

.student-picker-row {
  overflow: visible;
}

.picker-field {
  overflow: visible;
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:disabled:hover {
  background: #2563eb;
}

</style>


