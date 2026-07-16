<script setup>
import { ref, watch, computed } from 'vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { parseDdMmYyyy, formatDateToDdMmYyyy } from '../../data/universityInfo.js'
import { parseMovementDate, formatMovementDateIso } from '../../utils/formatMovementDate.js'
import {
  createEmptyWithdrawal,
  getWithdrawalFormData,
  buildStudentSnapshotForWithdrawal,
  validateWithdrawalForm,
  formatApplicationDateDisplay,
  canResubmitWithdrawal,
  currentWhereaboutOptions,
  completeFinalAssessmentOptions,
  getExamWeekLastDay,
} from '../../data/withdrawals.js'
import { getReasonOptionsBySourceKey } from '../../data/movementCategories.js'
import { initialStudents } from '../../data/students.js'
import {
  downloadStudentConsentTemplate,
} from '../../utils/consentFormDownload.js'
import StudentSelectModal from './StudentSelectModal.vue'
import MovementDeclarationSection from './MovementDeclarationSection.vue'
import MovementApplicantNotes from './MovementApplicantNotes.vue'
import { withdrawalDeclarationItems } from '../../data/movementDeclarationItems.js'
import { withdrawalApplicantNoteKeys } from '../../data/movementApplicantNotes.js'
import { getCurrentStudent } from '../../data/mockCurrentStudent.js'
import { formatApplicationSessionField } from '../../data/movementApplicationSession.js'
import MovementInternationalStudentRemarks from './MovementInternationalStudentRemarks.vue'
import MovementDocumentsUploadSection from './MovementDocumentsUploadSection.vue'
import MovementParentConsentSection from './MovementParentConsentSection.vue'
import { withMovementAttachments } from '../../data/movementAttachments.js'
import { withSyncedLegacyParentFields } from '../../data/movementParentContacts.js'
import '../../styles/movement-form.css'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  existingWithdrawals: { type: Array, default: () => [] },
  applicantMode: {
    type: String,
    default: 'teacher',
    validator: (value) => ['teacher', 'student'].includes(value),
  },
})

const emit = defineEmits(['close', 'save-draft', 'submit', 'resubmit'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyWithdrawal())
const errors = ref({})
const studentSelectVisible = ref(false)

const isEditMode = computed(() => props.mode === 'edit')
const isResubmitMode = computed(() => props.initialData && canResubmitWithdrawal(props.initialData))
const canSelectStudent = computed(() => props.applicantMode === 'teacher' && !isEditMode.value)
const modalTitle = computed(() =>
  isEditMode.value ? t('withdrawal.form.editTitle') : t('withdrawal.form.createTitle'),
)

const dateOfApplicationDisplay = computed(() =>
  formatApplicationDateDisplay(form.value.dateOfApplication),
)

function movementDateToPickerValue(value) {
  const date = parseMovementDate(value)
  if (!date) return ''
  return formatDateToDdMmYyyy(date)
}

function pickerValueToMovementDateIso(value) {
  if (!String(value || '').trim()) return ''
  const parsed = parseDdMmYyyy(value)
  if (parsed) return formatMovementDateIso(parsed)
  const fromStored = parseMovementDate(value)
  return fromStored ? formatMovementDateIso(fromStored) : value
}

const lastDateOfAttendancePicker = computed({
  get: () => movementDateToPickerValue(form.value.lastDateOfAttendance),
  set: (value) => {
    form.value.lastDateOfAttendance = pickerValueToMovementDateIso(value)
  },
})

function onCompleteFinalAssessmentChange() {
  if (form.value.completeFinalAssessment !== 'Yes') return
  const session = form.value.applicationSession || form.value.currentAcademicSession
  form.value.lastDateOfAttendance = getExamWeekLastDay(session)
}

const applicantCategory = computed(
  () => form.value.studentCategory || getSelectedStudentCategory(),
)

const reasonOptions = computed(() => getReasonOptionsBySourceKey('withdrawal', props.applicantMode))

function getSelectedStudentCategory() {
  if (form.value.studentCategory) return form.value.studentCategory
  const student = initialStudents.find((item) => item.studentId === form.value.studentId)
  return student?.studentCategory || 'Local'
}

function getConsentLookup() {
  return {
    programmeLevel: form.value.programmeLevel,
  }
}

function applyStudentProfile(student) {
  if (!student) return
  const snapshot = buildStudentSnapshotForWithdrawal(student)
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
        ? getWithdrawalFormData(props.initialData)
        : createEmptyWithdrawal()
    if (!isEditMode.value && props.applicantMode === 'student') {
      applyStudentProfile(getCurrentStudent())
    }
  },
)

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
}

function downloadConsentLetter() {
  downloadStudentConsentTemplate('withdrawal', getSelectedStudentCategory(), t, getConsentLookup())
}

function validateAndEmit(mode, emitter) {
  const result = validateWithdrawalForm(
    form.value,
    mode,
    props.existingWithdrawals,
    props.initialData?.id ?? null,
  )
  errors.value = result.errors
  if (!result.valid) return
  emitter(withMovementAttachments(withSyncedLegacyParentFields({ ...form.value })))
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
          title-key="withdrawal.notes.title"
          :item-keys="withdrawalApplicantNoteKeys"
          variant="instructional"
        />

        <MovementInternationalStudentRemarks
          source-key="withdrawal"
          :student-category="applicantCategory"
        />

        <div class="section-bar">{{ t('withdrawal.sections.studentInfo') }}</div>
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
                <label>{{ t('withdrawal.fields.name') }}</label>
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
            <label>{{ t('withdrawal.fields.dateOfApplication') }}</label>
            <input :value="dateOfApplicationDisplay" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('withdrawal.fields.intake') }}</label>
            <input v-model="form.intake" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('withdrawal.fields.nricPassport') }}</label>
            <input v-model="form.nricPassport" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('withdrawal.fields.nationality') }}</label>
            <input v-model="form.nationality" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('withdrawal.fields.programme') }}</label>
            <input v-model="form.programme" type="text" class="form-control" readonly />
          </div>
          <div class="form-field">
            <label>{{ t('withdrawal.fields.programmeLevel') }}</label>
            <input v-model="form.programmeLevel" type="text" class="form-control" readonly />
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
          <div class="form-field">
            <label>{{ t('movementCommon.fields.accommodationRoomNo') }}</label>
            <input v-model="form.accommodationRoomNo" type="text" class="form-control" />
          </div>
        </div>

        <div class="section-bar">{{ t('withdrawal.sections.studentApplication') }}</div>
        <div class="form-grid">
          <div class="form-field">
            <label>{{ t('withdrawal.fields.currentWhereabout') }} <span class="required">*</span></label>
            <select
              v-model="form.currentWhereabout"
              :class="['form-control', fieldError('currentWhereabout'), { 'is-empty': !form.currentWhereabout }]"
            >
              <option value="">{{ t('withdrawal.fields.selectCurrentWhereabout') }}</option>
              <option v-for="opt in currentWhereaboutOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
            </select>
            <p v-if="errors.currentWhereabout" class="field-error">{{ tr(errors.currentWhereabout) }}</p>
          </div>
          <div class="form-field">
            <label>{{ t('withdrawal.fields.destinationAfterLeaving') }} <span class="required">*</span></label>
            <input
              v-model="form.destinationAfterLeaving"
              type="text"
              :class="['form-control', fieldError('destinationAfterLeaving')]"
            />
            <p v-if="errors.destinationAfterLeaving" class="field-error">{{ tr(errors.destinationAfterLeaving) }}</p>
          </div>
          <div class="form-field">
            <label>
              {{ t('withdrawal.fields.completeFinalAssessment') }}
              <span class="required">*</span>
              <span
                class="field-hint-tip-wrap"
                tabindex="0"
                :aria-label="t('withdrawal.fields.completeFinalAssessmentHint')"
              >
                <span class="field-hint-icon" aria-hidden="true">?</span>
                <span class="field-hint-tooltip" role="tooltip">
                  {{ t('withdrawal.fields.completeFinalAssessmentHint') }}
                </span>
              </span>
            </label>
            <select
              v-model="form.completeFinalAssessment"
              :class="['form-control', fieldError('completeFinalAssessment'), { 'is-empty': !form.completeFinalAssessment }]"
              @change="onCompleteFinalAssessmentChange"
            >
              <option value="">{{ t('withdrawal.fields.selectCompleteFinalAssessment') }}</option>
              <option v-for="opt in completeFinalAssessmentOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <p v-if="errors.completeFinalAssessment" class="field-error">{{ tr(errors.completeFinalAssessment) }}</p>
          </div>
          <div class="form-field">
            <label>
              {{ t('withdrawal.fields.lastDateOfAttendance') }}
              <span class="required">*</span>
              <span
                class="field-hint-tip-wrap"
                tabindex="0"
                :aria-label="t('withdrawal.fields.lastDateOfAttendanceHint')"
              >
                <span class="field-hint-icon" aria-hidden="true">?</span>
                <span class="field-hint-tooltip" role="tooltip">
                  {{ t('withdrawal.fields.lastDateOfAttendanceHint') }}
                </span>
              </span>
            </label>
            <DatePickerEn
              v-model="lastDateOfAttendancePicker"
              :has-error="!!errors.lastDateOfAttendance"
            />
            <p v-if="errors.lastDateOfAttendance" class="field-error">{{ tr(errors.lastDateOfAttendance) }}</p>
          </div>
          <div class="form-field">
            <label>{{ t('withdrawal.fields.mainReason') }} <span class="required">*</span></label>
            <select v-model="form.reasonId" :class="['form-control', fieldError('reasonId')]">
              <option :value="null">{{ tr('pleaseSelect') }}</option>
              <option v-for="opt in reasonOptions" :key="opt.id" :value="opt.id">
                {{ opt.reasonName }}
              </option>
            </select>
            <p v-if="errors.reasonId" class="field-error">{{ tr(errors.reasonId) }}</p>
          </div>
          <div class="form-field span-2">
            <label>{{ t('withdrawal.fields.detailedReason') }} <span class="required">*</span></label>
            <textarea
              v-model="form.detailedReason"
              rows="4"
              :class="['form-control', fieldError('detailedReason')]"
            />
            <p v-if="errors.detailedReason" class="field-error">{{ tr(errors.detailedReason) }}</p>
          </div>
        </div>

        <div class="section-bar section-bar--with-hint">
          <span>{{ t('withdrawal.sections.parentConsent') }}</span>
          <span
            class="field-hint-tip-wrap"
            tabindex="0"
            :aria-label="t('movementCommon.parentConsent.fromProfileHint')"
          >
            <span class="field-hint-icon" aria-hidden="true">?</span>
            <span class="field-hint-tooltip" role="tooltip">
              {{ t('movementCommon.parentConsent.fromProfileHint') }}
            </span>
          </span>
        </div>
        <MovementParentConsentSection
          source-key="withdrawal"
          :contacts="form.parentContacts"
          :errors="errors"
        />

        <div class="section-bar">{{ t('withdrawal.sections.documents') }}</div>
        <MovementDocumentsUploadSection
          source-key="withdrawal"
          :student-category="applicantCategory"
          :attachments="form.attachments"
          :errors="errors"
          @update:attachments="form.attachments = $event"
          @download-consent="downloadConsentLetter"
        />

        <MovementDeclarationSection
          :section-title="t('withdrawal.sections.declaration')"
          :items="withdrawalDeclarationItems"
          :checkboxes="[{ field: 'declarationAccepted' }]"
          :form="form"
          :errors="errors"
        />

      </div>

      <footer class="modal-footer">
        <button type="button" class="btn btn-default" @click="handleClose">
          {{ t('withdrawal.actions.close') }}
        </button>
        <button v-if="!isResubmitMode" type="button" class="btn btn-default" @click="handleSaveDraft">
          {{ t('withdrawal.actions.saveDraft') }}
        </button>
        <button
          v-if="isResubmitMode"
          type="button"
          class="btn btn-primary"
          @click="handleResubmit"
        >
          {{ t('withdrawal.actions.resubmit') }}
        </button>
        <button v-else type="button" class="btn btn-primary" @click="handleSubmit">
          {{ t('withdrawal.actions.submit') }}
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

.isao-note-alert {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  font-size: 13px;
  color: #5b21b6;
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
