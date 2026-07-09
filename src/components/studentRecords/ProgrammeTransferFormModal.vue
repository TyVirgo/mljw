<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createEmptyTransfer,
  getTransferFormData,
  buildStudentSnapshotFromProfile,
  validateTransferForm,
  programmeOptions,
  semesterOptions,
  formatApplicationDateDisplay,
} from '../../data/programmeTransfers.js'
import { initialStudents } from '../../data/students.js'
import { downloadStudentConsentTemplate } from '../../utils/consentFormDownload.js'
import StudentSelectModal from './StudentSelectModal.vue'
import { getCurrentStudent } from '../../data/mockCurrentStudent.js'
import { formatApplicationSessionField } from '../../data/movementApplicationSession.js'
import MovementApplicantNotes from './MovementApplicantNotes.vue'
import MovementInternationalStudentRemarks from './MovementInternationalStudentRemarks.vue'
import MovementDocumentsUploadSection from './MovementDocumentsUploadSection.vue'
import MovementDeclarationSection from './MovementDeclarationSection.vue'
import { programmeTransferDeclarationItems } from '../../data/movementDeclarationItems.js'
import { programmeTransferApplicantNoteKeys } from '../../data/movementApplicantNotes.js'
import { withMovementAttachments } from '../../data/movementAttachments.js'
import '../../styles/movement-form.css'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  existingTransfers: { type: Array, default: () => [] },
  applicantMode: {
    type: String,
    default: 'teacher',
    validator: (value) => ['teacher', 'student'].includes(value),
  },
})

const emit = defineEmits(['close', 'save-draft', 'submit', 'resubmit'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyTransfer())
const errors = ref({})
const studentSelectVisible = ref(false)

const isEditMode = computed(() => props.mode === 'edit')
const isResubmitMode = computed(() => props.initialData?.status === 'Update Required')
const canSelectStudent = computed(() => props.applicantMode === 'teacher' && !isEditMode.value)
const modalTitle = computed(() =>
  isEditMode.value ? t('programmeTransfer.form.editTitle') : t('programmeTransfer.form.createTitle'),
)

const dateOfApplicationDisplay = computed(() =>
  formatApplicationDateDisplay(form.value.dateOfApplication),
)

const applicantCategory = computed(
  () => form.value.studentCategory || getSelectedStudentCategory(),
)

function applyStudentProfile(student) {
  if (!student) return
  const snapshot = buildStudentSnapshotFromProfile(student)
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
        ? getTransferFormData(props.initialData)
        : createEmptyTransfer()
    if (!isEditMode.value && props.applicantMode === 'student') {
      applyStudentProfile(getCurrentStudent())
    }
  },
)

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
}

function getSelectedStudent() {
  return initialStudents.find(
    (item) =>
      item.studentId === form.value.studentId || item.basicInfo?.studentId === form.value.studentId,
  )
}

function getSelectedStudentCategory() {
  return getSelectedStudent()?.studentCategory || 'Local'
}

function getConsentLookup() {
  const student = getSelectedStudent()
  return {
    programmeLevel: student?.enrollment?.programmeLevel || '',
  }
}

function downloadConsentLetter() {
  downloadStudentConsentTemplate('programme-transfer', getSelectedStudentCategory(), t, getConsentLookup())
}

function buildApplicationPayload() {
  const { adminNewProgramme, adminNewIntake, adminDate, ...applicationFields } = form.value
  if (isEditMode.value && props.initialData) {
    return {
      ...applicationFields,
      adminNewProgramme: props.initialData.adminNewProgramme || '',
      adminNewIntake: props.initialData.adminNewIntake || '',
      adminDate: props.initialData.adminDate || '',
    }
  }
  return {
    ...applicationFields,
    adminNewProgramme: '',
    adminNewIntake: '',
    adminDate: '',
  }
}

function validateAndEmit(mode, emitter) {
  const payload = buildApplicationPayload()
  const result = validateTransferForm(
    payload,
    mode,
    props.existingTransfers,
    props.initialData?.id ?? null,
  )
  errors.value = result.errors
  if (!result.valid) return
  emitter(withMovementAttachments(payload))
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
        <MovementApplicantNotes
          title-key="programmeTransfer.notes.title"
          :item-keys="programmeTransferApplicantNoteKeys"
        />

        <MovementInternationalStudentRemarks
          source-key="programme-transfer"
          :student-category="applicantCategory"
        />

        <div class="section-bar">{{ t('programmeTransfer.sections.studentDetails') }}</div>
        <div class="form-grid">
          <div class="form-field span-2">
            <div
              class="student-picker-row"
              :class="{ 'student-picker-row--with-button': canSelectStudent }"
            >
              <div class="picker-field">
                <label>{{ tr('Student ID') }} <span class="required">*</span></label>
                <input
                  :value="form.studentId"
                  type="text"
                  class="form-control"
                  readonly
                  :class="fieldError('studentId')"
                  :placeholder="canSelectStudent ? t('studentSelect.selectPlaceholder') : ''"
                />
                <p v-if="errors.studentId" class="field-error">{{ tr(errors.studentId) }}</p>
              </div>
              <div class="picker-field">
                <label>{{ tr('Full Name') }}</label>
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
            <label>{{ t('programmeTransfer.fields.dateOfApplication') }}</label>
            <input :value="dateOfApplicationDisplay" type="text" class="form-control" readonly />
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
            <label>{{ t('movementCommon.fields.personalEmail') }}</label>
            <input v-model="form.personalEmail" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('movementCommon.fields.phoneNumber') }}</label>
            <input v-model="form.phoneNumber" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('movementCommon.fields.visaExpiry') }}</label>
            <input v-model="form.visaExpiryDate" type="text" class="form-control" readonly />
          </div>
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
        </div>

        <div class="section-bar">{{ t('programmeTransfer.sections.studentApplication') }}</div>
        <div class="form-grid">
          <div class="form-field span-2">
            <label>{{ t('programmeTransfer.fields.startSemester') }} <span class="required">*</span></label>
            <select v-model="form.startSemester" :class="['form-control', fieldError('startSemester')]">
              <option value="">{{ tr('please select') }}</option>
              <option v-for="opt in semesterOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <p v-if="errors.startSemester" class="field-error">{{ tr(errors.startSemester) }}</p>
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

        <div class="section-bar">{{ t('programmeTransfer.sections.documents') }}</div>
        <MovementDocumentsUploadSection
          source-key="programme-transfer"
          :student-category="applicantCategory"
          :attachments="form.attachments"
          :errors="errors"
          @update:attachments="form.attachments = $event"
          @download-consent="downloadConsentLetter"
        />

        <MovementDeclarationSection
          :section-title="t('programmeTransfer.sections.declaration')"
          :items="programmeTransferDeclarationItems"
          :checkboxes="[{ field: 'declarationAgreed' }]"
          :form="form"
          :errors="errors"
        />

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

.form-field label {
  font-size: 13px;
  color: #374151;
}

.required {
  color: #ef4444;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #ef4444;
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
