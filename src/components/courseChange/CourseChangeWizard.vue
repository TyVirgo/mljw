<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import ChangeDescriptionStep from './ChangeDescriptionStep.vue'
import CourseSelectModal from './CourseSelectModal.vue'
import CourseCLOFormModal from '../course/CourseCLOFormModal.vue'
import CoursePrerequisiteModal from '../course/CoursePrerequisiteModal.vue'
import CourseSLTStepPanel from '../course/CourseSLTStepPanel.vue'
import CourseGeneralInfoDetail from '../course/CourseGeneralInfoDetail.vue'
import CourseDetailStepper from '../course/CourseDetailStepper.vue'
import TablePagination from '../common/TablePagination.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import {
  courseClassificationOptions,
  mediumOfInstructionOptions,
  getAffiliatedProgrammeOptions,
  getOfferingCodeByProgramme,
  courseOwnerOptions,
  createEmptyCourseForm,
  createEmptySLTData,
  createCLOId,
  formatMethodList,
  MAX_SYNOPSIS_LENGTH,
  MAX_REFERENCES_LENGTH,
} from '../../data/courses.js'
import {
  courseChangeSteps,
  changeApplicationToWizardState,
  createEmptyChangeDescription,
  loadBaselineFromCourse,
  validateChangeDescriptionStep,
  validateChangeGeneralForm,
  validateChangeCloStep,
} from '../../data/courseChangeApplications.js'
import { initialDepartments } from '../../data/departments.js'
import { semesterTypeOptions } from '../../data/semesterInfo.js'

const props = defineProps({
  courses: { type: Array, default: () => [] },
  mode: { type: String, default: 'create' },
  initialApplication: { type: Object, default: null },
  embedded: { type: Boolean, default: false },
})

const emit = defineEmits(['back', 'save'])

const { t, tr } = useAppI18n()

const isReadonly = computed(() => props.mode === 'detail')
const isEditMode = computed(() => props.mode === 'edit')

const currentStep = ref(1)
const sourceCourseId = ref(null)
const sourceCourseCode = ref('')
const form = ref(createEmptyCourseForm())
const changeDescription = ref(createEmptyChangeDescription())
const baselineSnapshot = ref(null)
const baselineLocked = ref(false)
const clos = ref([])
const slt = ref(createEmptySLTData())
const errors = ref({})
const step1Error = ref('')
const cloStepError = ref('')
const cloPage = ref(1)
const cloPageSize = ref(10)

const courseSelectVisible = ref(false)
const prerequisiteModalVisible = ref(false)
const cloModalVisible = ref(false)
const cloModalMode = ref('create')
const editingCLO = ref(null)
const cloSelectedIds = ref([])
const cloDeleteConfirmVisible = ref(false)
const pendingDeleteCLOIds = ref([])
const backConfirmVisible = ref(false)

const programmeOptions = computed(() => getAffiliatedProgrammeOptions())
const synopsisCount = computed(() => form.value.synopsis.length)
const referencesCount = computed(() => form.value.references.length)
const isLastStep = computed(() => currentStep.value === 4)

function syncOfferingFromProgramme() {
  const offeringCode = getOfferingCodeByProgramme(form.value.affiliatedProgramme, initialDepartments)
  form.value.offering = offeringCode || ''
  if (offeringCode && errors.value.offering) {
    const next = { ...errors.value }
    delete next.offering
    errors.value = next
  }
}

const paginatedCLOs = computed(() => {
  if (!isReadonly.value) return clos.value
  const start = (cloPage.value - 1) * cloPageSize.value
  return clos.value.slice(start, start + cloPageSize.value)
})

function getRowNumber(index, page, pageSize) {
  return (page - 1) * pageSize + index + 1
}

function resetWizardState() {
  sourceCourseId.value = null
  sourceCourseCode.value = ''
  form.value = createEmptyCourseForm()
  changeDescription.value = createEmptyChangeDescription()
  baselineSnapshot.value = null
  baselineLocked.value = false
  clos.value = []
  slt.value = createEmptySLTData()
  currentStep.value = 1
  errors.value = {}
  step1Error.value = ''
  cloStepError.value = ''
  cloSelectedIds.value = []
  cloPage.value = 1
}

function loadApplication(application) {
  const state = changeApplicationToWizardState(application)
  sourceCourseId.value = state.sourceCourseId
  sourceCourseCode.value = state.sourceCourseCode
  form.value = state.form
  changeDescription.value = state.changeDescription
  baselineSnapshot.value = state.baselineSnapshot
  baselineLocked.value = state.baselineLocked
  clos.value = state.clos
  slt.value = state.slt
  currentStep.value = 1
  errors.value = {}
  step1Error.value = ''
  cloStepError.value = ''
  cloSelectedIds.value = []
  cloPage.value = 1
}

watch(
  () => [props.mode, props.initialApplication],
  ([mode, application]) => {
    if (mode === 'create') {
      resetWizardState()
      return
    }
    if (application) loadApplication(application)
  },
  { immediate: true },
)

function goToStep(stepId) {
  if (isReadonly.value) {
    currentStep.value = stepId
    if (stepId !== 3) cloPage.value = 1
    return
  }
  if (stepId > currentStep.value && currentStep.value === 1 && !validateStep1()) return
  if (stepId > currentStep.value && currentStep.value === 2 && !validateStep2()) return
  if (stepId > currentStep.value && currentStep.value === 3 && !validateStep3()) return
  currentStep.value = stepId
}

function handleBackClick() {
  if (isReadonly.value) {
    emit('back')
    return
  }
  backConfirmVisible.value = true
}

function handleCancel() {
  if (isReadonly.value) {
    emit('back')
    return
  }
  backConfirmVisible.value = true
}

function handleExportDetail() {
  window.alert(tr('Export is not available in the demo yet.'))
}

function confirmBack() {
  backConfirmVisible.value = false
  emit('back')
}

function validateStep1() {
  const stepErrors = validateChangeDescriptionStep(sourceCourseId.value, changeDescription.value)
  step1Error.value = stepErrors.baseline || stepErrors.changeDescription || ''
  return !step1Error.value
}

function validateStep2() {
  const validationErrors = validateChangeGeneralForm(form.value, baselineSnapshot.value, props.courses)
  errors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}

function validateStep3() {
  const cloErrors = validateChangeCloStep(clos.value)
  cloStepError.value = cloErrors.clos || ''
  return !cloStepError.value
}

function handleNext() {
  if (isReadonly.value) {
    if (currentStep.value < 4) currentStep.value += 1
    return
  }
  if (currentStep.value === 1 && !validateStep1()) return
  if (currentStep.value === 2 && !validateStep2()) return
  if (currentStep.value === 3 && !validateStep3()) return
  if (currentStep.value < 4) currentStep.value += 1
}

function handlePrevious() {
  if (currentStep.value > 1) currentStep.value -= 1
}

function buildSavePayload() {
  return {
    form: { ...form.value },
    clos: clos.value.map((item) => ({ ...item })),
    slt: JSON.parse(JSON.stringify(slt.value)),
    changeDescription: { ...changeDescription.value },
    sourceCourseId: sourceCourseId.value,
    sourceCourseCode: sourceCourseCode.value,
    baselineSnapshot: baselineSnapshot.value ? JSON.parse(JSON.stringify(baselineSnapshot.value)) : null,
    baselineLocked: true,
  }
}

function handleSave() {
  if (isReadonly.value) return
  if (!validateStep1()) {
    currentStep.value = 1
    return
  }
  if (!validateStep2()) {
    currentStep.value = 2
    return
  }
  if (!validateStep3()) {
    currentStep.value = 3
    return
  }
  emit('save', buildSavePayload())
}

function openCourseSelect() {
  if (isReadonly.value || baselineLocked.value) return
  courseSelectVisible.value = true
}

function handleCourseSelect(course) {
  const baseline = loadBaselineFromCourse(course)
  sourceCourseId.value = baseline.sourceCourseId
  sourceCourseCode.value = baseline.sourceCourseCode
  form.value = baseline.form
  clos.value = baseline.clos
  slt.value = baseline.slt
  baselineSnapshot.value = baseline.baselineSnapshot
  step1Error.value = ''
  courseSelectVisible.value = false
}

function openPrerequisiteModal() {
  if (isReadonly.value) return
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
    if (index !== -1) clos.value[index] = { ...clos.value[index], ...data }
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
  cloSelectedIds.value = event.target.checked ? clos.value.map((item) => item.id) : []
}

const allCLOSelected = computed(
  () => clos.value.length > 0 && clos.value.every((item) => cloSelectedIds.value.includes(item.id)),
)

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
  <div class="course-change-wizard" :class="{ 'is-detail': isReadonly }">
    <div class="wizard-top">
      <button type="button" class="back-btn" @click="handleBackClick">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ t('common.back') }}
      </button>

      <div v-if="isReadonly" class="wizard-actions">
        <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="handlePrevious">
          {{ tr('Previous') }}
        </button>
        <button v-if="!isLastStep" type="button" class="btn btn-default" @click="handleNext">
          {{ tr('Next') }}
        </button>
        <button type="button" class="btn btn-primary" @click="handleExportDetail">{{ t('common.export') }}</button>
      </div>
      <div v-else class="wizard-actions">
        <button type="button" class="btn btn-default" @click="handleCancel">{{ t('common.cancel') }}</button>
        <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="handlePrevious">
          {{ tr('Previous') }}
        </button>
        <button v-if="!isLastStep" type="button" class="btn btn-outline" @click="handleNext">
          {{ tr('Next') }}
        </button>
        <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
      </div>
    </div>

    <CourseDetailStepper :model-value="currentStep" :steps="courseChangeSteps" @update:model-value="goToStep" />

    <div class="wizard-body">
      <section v-show="currentStep === 1" class="step-section">
        <ChangeDescriptionStep
          :course-name="form.courseName"
          :change-description="changeDescription"
          :readonly="isReadonly"
          :choose-disabled="baselineLocked"
          :error="step1Error"
          @choose="openCourseSelect"
          @update:change-description="changeDescription = $event"
        />
      </section>

      <section v-show="currentStep === 2" class="step-section">
        <CourseGeneralInfoDetail v-if="isReadonly" :data="form" />
        <template v-else>
          <div class="form-grid">
            <div class="form-col">
              <div class="field">
                <label><span class="required">*</span> {{ tr('Course Code:') }}</label>
                <input v-model="form.courseCode" type="text" class="input readonly" readonly />
              </div>
              <div class="field">
                <label><span class="required">*</span> {{ tr('Course Owner:') }}</label>
                <select
                  v-model="form.courseOwner"
                  class="select"
                  :class="{ error: errors.courseOwner, 'is-empty': !form.courseOwner }"
                >
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
                <select
                  v-model="form.semesterType"
                  class="select"
                  :class="{ error: errors.semesterType, 'is-empty': !form.semesterType }"
                >
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
        </template>
      </section>

      <section v-show="currentStep === 3" class="step-section">
        <div v-if="!isReadonly" class="toolbar">
          <button type="button" class="btn btn-primary" @click="openCreateCLO">{{ t('common.create') }}</button>
          <button type="button" class="btn btn-default" :disabled="!cloSelectedIds.length" @click="requestDeleteCLO(cloSelectedIds)">
            {{ t('common.delete') }}
          </button>
        </div>
        <p v-if="cloStepError" class="error-text step-error">{{ tr(cloStepError) }}</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th v-if="!isReadonly" class="col-check">
                  <input type="checkbox" :checked="allCLOSelected" @change="toggleCLOSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ tr('CLO') }}</th>
                <th>{{ tr('Outcome') }}</th>
                <th>{{ tr("Bloom's Taxonomy Level") }}</th>
                <th>{{ tr('Teaching Methods') }}</th>
                <th>{{ tr('Assessment Methods') }}</th>
                <th v-if="!isReadonly">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!clos.length">
                <td :colspan="isReadonly ? 7 : 8" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedCLOs" :key="item.id">
                <td v-if="!isReadonly" class="col-check">
                  <input type="checkbox" :checked="cloSelectedIds.includes(item.id)" @change="toggleCLOSelect(item.id)" />
                </td>
                <td>{{ isReadonly ? getRowNumber(index, cloPage, cloPageSize) : index + 1 }}</td>
                <td>{{ item.cloCode }}</td>
                <td class="col-outcome">{{ item.outcome }}</td>
                <td>{{ item.bloomLevel }}</td>
                <td>{{ formatMethodList(item.teachingMethods, tr) }}</td>
                <td>{{ formatMethodList(item.assessmentMethods, tr) }}</td>
                <td v-if="!isReadonly" class="actions-cell">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEditCLO(item)">{{ t('common.edit') }}</button>
                    <button type="button" class="link-btn delete" @click="requestDeleteCLO([item.id])">{{ t('common.delete') }}</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-if="isReadonly && clos.length"
          v-model="cloPage"
          v-model:page-size="cloPageSize"
          :total="clos.length"
        />
      </section>

      <CourseSLTStepPanel v-show="currentStep === 4" v-model:slt="slt" :clos="clos" :readonly="isReadonly" />
    </div>

    <CourseSelectModal
      :visible="courseSelectVisible"
      :courses="courses"
      :selected-id="sourceCourseId"
      @close="courseSelectVisible = false"
      @confirm="handleCourseSelect"
    />

    <CoursePrerequisiteModal
      :visible="prerequisiteModalVisible"
      :courses="courses"
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
.course-change-wizard.is-detail {
  height: calc(100vh - 56px);
  min-height: 0;
  padding: 16px 24px 24px;
}

.is-detail .wizard-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 24px 28px;
  margin-top: 0;
}

.is-detail .wizard-actions .btn {
  height: 36px;
  padding: 0 16px;
}

.course-change-wizard {
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

.input.readonly {
  background: #f9fafb;
  color: #6b7280;
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
  max-width: 320px;
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
  cursor: pointer;
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
