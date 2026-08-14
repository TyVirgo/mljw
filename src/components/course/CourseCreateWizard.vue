<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import CourseCLOFormModal from './CourseCLOFormModal.vue'
import CoursePrerequisiteModal from './CoursePrerequisiteModal.vue'
import CourseSLTStepPanel from './CourseSLTStepPanel.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import {
  courseCreateSteps,
  courseClassificationOptions,
  mediumOfInstructionOptions,
  getAffiliatedProgrammeOptions,
  getOfferingCodeByProgramme,
  courseOwnerOptions,
  createEmptyCourseForm,
  createEmptySLTData,
  validateCourseForm,
  buildCourseCreatePayload,
  courseToWizardForm,
  createCLOId,
  formatMethodList,
  MAX_SYNOPSIS_LENGTH,
  MAX_REFERENCES_LENGTH,
} from '../../data/courses.js'
import { validateCloStep } from '../../data/courseApplications.js'
import { initialDepartments } from '../../data/departments.js'
import { semesterTypeOptions } from '../../data/semesterInfo.js'

const props = defineProps({
  allCourses: { type: Array, default: () => [] },
  mode: { type: String, default: 'create' },
  initialCourse: { type: Object, default: null },
})

const emit = defineEmits(['back', 'save'])

const { t, tr } = useAppI18n()

const isEditMode = computed(() => props.mode === 'edit')
const isCopyMode = computed(() => props.mode === 'copy')

const currentStep = ref(1)
const form = ref(createEmptyCourseForm())
const clos = ref([])
const slt = ref(createEmptySLTData())
const errors = ref({})
const cloStepError = ref('')

const prerequisiteModalVisible = ref(false)
const cloModalVisible = ref(false)
const cloModalMode = ref('create')
const editingCLO = ref(null)

const cloSelectedIds = ref([])
const cloDeleteConfirmVisible = ref(false)
const pendingDeleteCLOIds = ref([])
const backConfirmVisible = ref(false)
const saveConfirmVisible = ref(false)

const programmeOptions = computed(() => getAffiliatedProgrammeOptions())
const synopsisCount = computed(() => form.value.synopsis.length)
const referencesCount = computed(() => form.value.references.length)
const isLastStep = computed(() => currentStep.value === 3)

const saveConfirmMessage = computed(() =>
  isEditMode.value
    ? tr('Are you sure you want to save the course changes?')
    : tr('Are you sure you want to save the course?'),
)

function syncOfferingFromProgramme() {
  const offeringCode = getOfferingCodeByProgramme(form.value.affiliatedProgramme, initialDepartments)
  form.value.offering = offeringCode || ''
  if (offeringCode && errors.value.offering) {
    const next = { ...errors.value }
    delete next.offering
    errors.value = next
  }
}

function resetWizardState() {
  form.value = createEmptyCourseForm()
  clos.value = []
  slt.value = createEmptySLTData()
  currentStep.value = 1
  errors.value = {}
  cloStepError.value = ''
  cloSelectedIds.value = []
}

function loadCourseIntoWizard(course) {
  form.value = courseToWizardForm(course)
  clos.value = (course.clos || []).map((item) => ({ ...item }))
  slt.value = course.slt ? JSON.parse(JSON.stringify(course.slt)) : createEmptySLTData()
  currentStep.value = 1
  errors.value = {}
  cloStepError.value = ''
  cloSelectedIds.value = []
}

function loadCopyIntoWizard(draft) {
  form.value = { ...draft.form }
  clos.value = (draft.clos || []).map((item) => ({ ...item }))
  slt.value = draft.slt ? JSON.parse(JSON.stringify(draft.slt)) : createEmptySLTData()
  currentStep.value = 1
  errors.value = {}
  cloStepError.value = ''
  cloSelectedIds.value = []
}

watch(
  () => [props.mode, props.initialCourse],
  ([mode, course]) => {
    if (mode === 'edit' && course) {
      loadCourseIntoWizard(course)
      return
    }
    if (mode === 'copy' && course) {
      loadCopyIntoWizard(course)
      return
    }
    if (mode === 'create') resetWizardState()
  },
  { immediate: true },
)

function stepClass(stepId) {
  return stepId === currentStep.value ? 'active' : ''
}

function goToStep(stepId) {
  if (stepId > currentStep.value && currentStep.value === 1 && !validateStep1()) return
  if (stepId > currentStep.value && currentStep.value === 2 && !validateStep2()) return
  currentStep.value = stepId
}

function requestBack() {
  backConfirmVisible.value = true
}

function confirmBack() {
  backConfirmVisible.value = false
  emit('back')
}

function validateStep1() {
  const excludeId = isEditMode.value ? props.initialCourse?.id : null
  const validationErrors = validateCourseForm(form.value, props.allCourses, excludeId)
  errors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}

function validateStep2() {
  const cloErrors = validateCloStep(clos.value)
  cloStepError.value = cloErrors.clos || ''
  return !cloStepError.value
}

function handleNext() {
  if (currentStep.value === 1) {
    if (!validateStep1()) return
    currentStep.value = 2
    return
  }
  if (currentStep.value === 2) {
    if (!validateStep2()) return
    currentStep.value = 3
  }
}

function handlePrevious() {
  if (currentStep.value > 1) currentStep.value -= 1
}

function handleSave() {
  if (!validateStep1()) {
    currentStep.value = 1
    return
  }
  if (currentStep.value >= 2 && !validateStep2()) {
    currentStep.value = 2
    return
  }
  saveConfirmVisible.value = true
}

function confirmSave() {
  emit('save', buildCourseCreatePayload(form.value, clos.value, slt.value))
  saveConfirmVisible.value = false
}

function openPrerequisiteModal() {
  prerequisiteModalVisible.value = true
}

function handlePrerequisiteConfirm(value) {
  form.value.prerequisite = value
  prerequisiteModalVisible.value = false
}

function openCreateCLO() {
  cloModalMode.value = 'create'
  editingCLO.value = null
  cloModalVisible.value = true
}

function openEditCLO(item) {
  cloModalMode.value = 'edit'
  editingCLO.value = { ...item }
  cloModalVisible.value = true
}

function handleCLOSave(data) {
  if (cloModalMode.value === 'edit' && editingCLO.value) {
    const index = clos.value.findIndex((item) => item.id === editingCLO.value.id)
    if (index !== -1) {
      clos.value[index] = { ...clos.value[index], ...data }
    }
  } else {
    clos.value.push({ id: createCLOId(clos.value), ...data })
  }
  cloModalVisible.value = false
  editingCLO.value = null
  cloStepError.value = ''
}

function toggleCLOSelect(id) {
  if (cloSelectedIds.value.includes(id)) {
    cloSelectedIds.value = cloSelectedIds.value.filter((item) => item !== id)
  } else {
    cloSelectedIds.value = [...cloSelectedIds.value, id]
  }
}

function toggleCLOSelectAll(event) {
  if (event.target.checked) {
    cloSelectedIds.value = clos.value.map((item) => item.id)
  } else {
    cloSelectedIds.value = []
  }
}

const allCLOSelected = computed(() => {
  if (!clos.value.length) return false
  return clos.value.every((item) => cloSelectedIds.value.includes(item.id))
})

function requestDeleteCLO(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteCLOIds.value = uniqueIds
  cloDeleteConfirmVisible.value = true
}

function confirmDeleteCLO() {
  clos.value = clos.value.filter((item) => !pendingDeleteCLOIds.value.includes(item.id))
  cloSelectedIds.value = cloSelectedIds.value.filter((id) => !pendingDeleteCLOIds.value.includes(id))
  pendingDeleteCLOIds.value = []
  cloDeleteConfirmVisible.value = false
}
</script>

<template>
  <div class="course-create-wizard">
    <div class="wizard-top">
      <button type="button" class="back-btn" @click="requestBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ t('common.back') }}
      </button>

      <div class="wizard-actions">
        <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="handlePrevious">
          {{ tr('Previous') }}
        </button>
        <button v-if="!isLastStep" type="button" class="btn btn-outline" @click="handleNext">
          {{ tr('Next') }}
        </button>
        <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
      </div>
    </div>

    <h1 v-if="isEditMode && initialCourse?.courseName" class="wizard-title">{{ initialCourse.courseName }}</h1>
    <h1 v-else-if="isCopyMode && initialCourse?.sourceCourseName" class="wizard-title">
      {{ tr('Copy Course') }}: {{ initialCourse.sourceCourseName }}
    </h1>

    <p v-if="isCopyMode" class="copy-notice">
      {{
        t('pages.course.copyHint', {
          name: initialCourse?.sourceCourseName || '',
          code: initialCourse?.sourceCourseCode || '',
        })
      }}
    </p>

    <div class="stepper">
      <template v-for="(step, index) in courseCreateSteps" :key="step.id">
        <button type="button" class="step-item" :class="stepClass(step.id)" @click="goToStep(step.id)">
          <span class="step-circle">{{ step.id }}</span>
          <span class="step-label">{{ tr(step.title) }}</span>
        </button>
        <div v-if="index < courseCreateSteps.length - 1" class="step-line" />
      </template>
    </div>

    <div class="wizard-body">
      <section v-show="currentStep === 1" class="step-section">
        <div class="form-grid">
          <div class="form-col">
            <div class="field">
              <label><span class="required">*</span> {{ tr('Course Code:') }}</label>
              <input
                v-model="form.courseCode"
                type="text"
                class="input"
                :class="{ error: errors.courseCode }"
                maxlength="20"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.courseCode" class="error-text">{{ tr(errors.courseCode) }}</p>
              <p v-if="isCopyMode" class="field-hint">{{ tr('Update the Course Code to ensure it is unique before saving.') }}</p>
            </div>
            <div class="field">
              <label><span class="required">*</span> {{ tr('Course Owner:') }}</label>
              <select v-model="form.courseOwner" class="select" :class="{ error: errors.courseOwner, 'is-empty': !form.courseOwner }">
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in courseOwnerOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
              </select>
              <p v-if="errors.courseOwner" class="error-text">{{ tr(errors.courseOwner) }}</p>
            </div>
            <div class="field">
              <label><span class="required">*</span> {{ tr('Offering Unit:') }}</label>
              <input
                :value="form.offering"
                type="text"
                class="input"
                :class="{ error: errors.offering, 'is-empty': !form.offering }"
                readonly
                :placeholder="t('common.pleaseSelect')"
              />
              <p v-if="errors.offering" class="error-text">{{ tr(errors.offering) }}</p>
            </div>
            <div class="field">
              <label><span class="required">*</span> {{ tr('Course Classification:') }}</label>
              <select
                v-model="form.courseClassification"
                class="select"
                :class="{ error: errors.courseClassification, 'is-empty': !form.courseClassification }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in courseClassificationOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
              <p v-if="errors.courseClassification" class="error-text">{{ tr(errors.courseClassification) }}</p>
            </div>
            <div class="field">
              <label><span class="required">*</span> {{ tr('Medium of Instruction:') }}</label>
              <select
                v-model="form.mediumOfInstruction"
                class="select"
                :class="{ error: errors.mediumOfInstruction, 'is-empty': !form.mediumOfInstruction }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in mediumOfInstructionOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
              <p v-if="errors.mediumOfInstruction" class="error-text">{{ tr(errors.mediumOfInstruction) }}</p>
            </div>
          </div>

          <div class="form-col">
            <div class="field">
              <label><span class="required">*</span> {{ tr('Course Name:') }}</label>
              <input
                v-model="form.courseName"
                type="text"
                class="input"
                :class="{ error: errors.courseName }"
                maxlength="200"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.courseName" class="error-text">{{ tr(errors.courseName) }}</p>
            </div>
            <div class="field">
              <label><span class="required">*</span> {{ tr('Affiliated Programme:') }}</label>
              <select
                v-model="form.affiliatedProgramme"
                class="select"
                :class="{ error: errors.affiliatedProgramme, 'is-empty': !form.affiliatedProgramme }"
                @change="syncOfferingFromProgramme"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in programmeOptions" :key="opt.code" :value="opt.code">{{ opt.code }}</option>
              </select>
              <p v-if="errors.affiliatedProgramme" class="error-text">{{ tr(errors.affiliatedProgramme) }}</p>
            </div>
            <div class="field">
              <label><span class="required">*</span> {{ tr('Credit:') }}</label>
              <input
                v-model="form.credit"
                type="number"
                min="1"
                step="1"
                class="input"
                :class="{ error: errors.credit }"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.credit" class="error-text">{{ tr(errors.credit) }}</p>
            </div>
            <div class="field">
              <label><span class="required">*</span> {{ tr('Semester Type:') }}</label>
              <select v-model="form.semesterType" class="select" :class="{ error: errors.semesterType, 'is-empty': !form.semesterType }">
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in semesterTypeOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
              <p v-if="errors.semesterType" class="error-text">{{ tr(errors.semesterType) }}</p>
            </div>
            <div class="field">
              <label>{{ tr('Pre-requisite / co-requisite:') }}</label>
              <div class="input-with-btn">
                <input v-model="form.prerequisite" type="text" class="input" readonly :placeholder="t('common.pleaseSelect')" />
                <button type="button" class="btn btn-outline" @click="openPrerequisiteModal">{{ tr('Choose') }}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="field field-full">
          <label>{{ tr('Synopsis:') }}</label>
          <div class="textarea-wrap">
            <textarea
              v-model="form.synopsis"
              class="textarea"
              :class="{ error: errors.synopsis }"
              rows="4"
              :maxlength="MAX_SYNOPSIS_LENGTH"
              :placeholder="t('common.pleaseInput')"
            />
            <span class="char-count">{{ synopsisCount }}/{{ MAX_SYNOPSIS_LENGTH }}</span>
          </div>
          <p v-if="errors.synopsis" class="error-text">{{ tr(errors.synopsis) }}</p>
        </div>

        <div class="field field-full">
          <label>{{ tr('References:') }}</label>
          <div class="textarea-wrap">
            <textarea
              v-model="form.references"
              class="textarea"
              :class="{ error: errors.references }"
              rows="4"
              :maxlength="MAX_REFERENCES_LENGTH"
              :placeholder="t('common.pleaseInput')"
            />
            <span class="char-count">{{ referencesCount }}/{{ MAX_REFERENCES_LENGTH }}</span>
          </div>
          <p v-if="errors.references" class="error-text">{{ tr(errors.references) }}</p>
        </div>
      </section>

      <section v-show="currentStep === 2" class="step-section">
        <div class="toolbar">
          <button type="button" class="btn btn-primary" @click="openCreateCLO">{{ t('common.create') }}</button>
          <button
            type="button"
            class="btn btn-default"
            :disabled="!cloSelectedIds.length"
            @click="requestDeleteCLO(cloSelectedIds)"
          >
            {{ t('common.delete') }}
          </button>
        </div>
        <p v-if="cloStepError" class="error-text step-error">{{ tr(cloStepError) }}</p>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allCLOSelected" @change="toggleCLOSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ tr('CLO') }}</th>
                <th>{{ tr('Outcome') }}</th>
                <th>{{ tr("Bloom's Taxonomy Level") }}</th>
                <th>{{ tr('Teaching Methods') }}</th>
                <th>{{ tr('Assessment Methods') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!clos.length">
                <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in clos" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="cloSelectedIds.includes(item.id)" @change="toggleCLOSelect(item.id)" />
                </td>
                <td>{{ index + 1 }}</td>
                <td>{{ item.cloCode }}</td>
                <td class="col-outcome">{{ item.outcome }}</td>
                <td>{{ item.bloomLevel }}</td>
                <td>{{ formatMethodList(item.teachingMethods, tr) }}</td>
                <td>{{ formatMethodList(item.assessmentMethods, tr) }}</td>
                <td class="actions-cell">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEditCLO(item)">{{ t('common.edit') }}</button>
                    <button type="button" class="link-btn delete" @click="requestDeleteCLO([item.id])">{{ t('common.delete') }}</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <CourseSLTStepPanel v-show="currentStep === 3" v-model:slt="slt" :clos="clos" />
    </div>

    <CoursePrerequisiteModal
      :visible="prerequisiteModalVisible"
      :courses="allCourses"
      :selected-codes="form.prerequisite"
      :exclude-code="form.courseCode"
      @close="prerequisiteModalVisible = false"
      @confirm="handlePrerequisiteConfirm"
    />

    <CourseCLOFormModal
      :visible="cloModalVisible"
      :mode="cloModalMode"
      :initial-data="editingCLO"
      :all-clos="clos"
      @close="cloModalVisible = false"
      @save="handleCLOSave"
    />

    <ConfirmDialog
      :visible="cloDeleteConfirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="tr('Are you sure you want to delete the selected CLO record(s)?')"
      :confirm-text="t('common.delete')"
      @confirm="confirmDeleteCLO"
      @cancel="cloDeleteConfirmVisible = false"
    />

    <ConfirmDialog
      :visible="saveConfirmVisible"
      :title="t('common.saveConfirmation')"
      :message="saveConfirmMessage"
      :confirm-text="t('common.confirm')"
      confirm-variant="primary"
      @confirm="confirmSave"
      @cancel="saveConfirmVisible = false"
    />

    <ConfirmDialog
      :visible="backConfirmVisible"
      :title="tr('Leave Confirmation')"
      :message="tr('Are you sure you want to leave? Unsaved changes may be lost.')"
      :confirm-text="t('common.confirm')"
      confirm-variant="primary"
      @confirm="confirmBack"
      @cancel="backConfirmVisible = false"
    />
  </div>
</template>

<style scoped>
.course-create-wizard {
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  box-sizing: border-box;
  background: #fff;
  min-height: 100%;
}

.wizard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.wizard-title {
  margin: 0 0 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  flex-shrink: 0;
}

.copy-notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 8px;
  flex-shrink: 0;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  color: #374151;
  font-size: 14px;
  padding: 0;
  cursor: pointer;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.wizard-actions {
  display: flex;
  gap: 8px;
}

.wizard-actions .btn {
  min-width: 92px;
  justify-content: center;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 12px 0 20px;
  flex-shrink: 0;
  gap: 4px 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
}

.step-label {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  max-width: 120px;
  line-height: 1.3;
}

.step-item.active .step-circle {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.step-item.active .step-label {
  color: #2563eb;
  font-weight: 600;
}

.step-line {
  width: 48px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px 20px;
}

.wizard-body {
  padding: 8px 0 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 32px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-full {
  margin-top: 16px;
}

.field label {
  font-size: 13px;
  color: #374151;
}

.required {
  color: #ef4444;
}

.input,
.select,
.textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.input,
.select {
  height: 36px;
  padding: 0 12px;
}

.textarea {
  min-height: 96px;
  padding: 10px 12px 28px;
  resize: vertical;
}

.input.error,
.select.error,
.textarea.error {
  border-color: #ef4444;
}

.select.is-empty {
  color: #9ca3af;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .input {
  flex: 1;
}

.textarea-wrap {
  position: relative;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.error-text {
  margin: 0;
  font-size: 12px;
  color: #ef4444;
}

.step-error {
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.table-wrap {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 13px;
}

.col-check {
  width: 48px;
}

.col-outcome {
  max-width: 280px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.actions-inner {
  display: inline-flex;
  gap: 12px;
  white-space: nowrap;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0;
  border: none;
  background: none;
}

.link-btn.delete {
  color: #ef4444;
}

.btn {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
