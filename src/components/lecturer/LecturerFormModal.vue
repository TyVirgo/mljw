<script setup>
import { ref, watch, computed } from 'vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import QualificationSection from './QualificationSection.vue'
import WorkingExperienceSection from './WorkingExperienceSection.vue'
import {
  formSteps,
  createEmptyLecturerForm,
  getLecturerFormData,
  genderOptions,
  categoryOptions,
  titleOptions,
  academicPositionOptions,
  degreeOptions,
  employmentStatusOptions,
  yesNoOptions,
  nationalityOptions,
  foundationOptions,
  getDepartmentOptions,
  formatAttachmentSize,
  formatUploadTimestamp,
} from '../../data/lecturers.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const currentStep = ref(1)
const form = ref(createEmptyLecturerForm())
const errors = ref({})
const fileInputRef = ref(null)
const saveConfirmVisible = ref(false)
const cancelConfirmVisible = ref(false)

const departmentOptions = getDepartmentOptions()
const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() => (isEditMode.value ? 'Edit' : 'Create'))
const isLastStep = computed(() => currentStep.value === formSteps.length)
const saveConfirmMessage = computed(() =>
  isEditMode.value
    ? 'Are you sure you want to save the changes to this lecturer?'
    : 'Are you sure you want to save this lecturer?',
)

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    currentStep.value = 1
    errors.value = {}
    saveConfirmVisible.value = false
    cancelConfirmVisible.value = false
    form.value = isEditMode.value && props.initialData
      ? getLecturerFormData(props.initialData)
      : createEmptyLecturerForm()
  },
)

function stepClass(stepId) {
  return stepId === currentStep.value ? 'active' : ''
}

function goToStep(stepId) {
  currentStep.value = stepId
}

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
}

function validateStep1() {
  const e = {}
  const required = [
    ['name', form.value.name, 'Name'],
    ['gender', form.value.gender, 'Gender'],
    ['mobilePhone', form.value.personal.mobilePhone, 'Mobile Phone'],
    ['degree', form.value.degree, 'Degree'],
    ['staffId', form.value.staffId, 'Staff ID'],
    ['category', form.value.category, 'Category'],
    ['department', form.value.department, 'School/Department'],
    ['foundationUndergraduatePostgraduate', form.value.employment.foundationUndergraduatePostgraduate, 'FOU/UG/PG'],
    ['title', form.value.title, 'Title'],
    ['academicPosition', form.value.academicPosition, 'Academic Position'],
    ['officeExtension', form.value.employment.officeExtension, 'Office Extension'],
    ['xmumEmail', form.value.employment.xmumEmail, 'XMUM Email'],
    ['dateOfJoining', form.value.dateOfJoining, 'Date of Joining'],
    ['currentlyTeaching', form.value.employment.currentlyTeaching, 'Currently Teaching'],
    ['employmentStatus', form.value.employmentStatus, 'Employment Status'],
  ]
  required.forEach(([key, val]) => {
    if (!String(val || '').trim()) e[key] = true
  })
  errors.value = e
  if (Object.keys(e).length) {
    window.alert('Please fill in all required fields.')
    return false
  }
  return true
}

function handleNext() {
  if (currentStep.value === 1 && !validateStep1()) return
  if (currentStep.value < formSteps.length) currentStep.value += 1
}

function handlePrevious() {
  if (currentStep.value > 1) currentStep.value -= 1
}

function triggerFileUpload() {
  fileInputRef.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    window.alert('Supported file extensions: .pdf')
    event.target.value = ''
    return
  }
  form.value.attachment = {
    fileName: file.name,
    size: file.size,
    uploadedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.'),
  }
  event.target.value = ''
}

function handleConfirm() {
  form.value.academicQualificationHighest = form.value.employment.foundationUndergraduatePostgraduate
  emit('save', { ...form.value })
}

function requestSave() {
  if (!validateStep1()) {
    currentStep.value = 1
    return
  }
  saveConfirmVisible.value = true
}

function confirmSave() {
  saveConfirmVisible.value = false
  handleConfirm()
}

function requestClose() {
  cancelConfirmVisible.value = true
}

function confirmClose() {
  cancelConfirmVisible.value = false
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) requestClose()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="requestClose">×</button>
        </div>

        <div class="stepper">
          <div class="stepper-track">
            <div v-for="(step, index) in formSteps" :key="step.id" class="step-unit">
              <button
                type="button"
                class="step-unit-body"
                :class="stepClass(step.id)"
                :aria-current="step.id === currentStep ? 'step' : undefined"
                @click="goToStep(step.id)"
              >
                <div class="step-circle">{{ step.id }}</div>
                <span class="step-label">{{ step.label }}</span>
              </button>
              <div v-if="index < formSteps.length - 1" class="step-connector" aria-hidden="true">
                <span class="step-connector-line" />
                <svg class="step-connector-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-body">
          <!-- Step 1 -->
          <div v-show="currentStep === 1" class="step-content">
            <section class="form-section">
              <h3 class="section-title"><span class="bar" />Personal Information</h3>
              <div class="form-grid">
                <div class="form-item">
                  <label><span class="req">*</span> Name:</label>
                  <input v-model="form.name" type="text" placeholder="please input" :class="fieldError('name')" />
                </div>
                <div class="form-item">
                  <label>Name_CN:</label>
                  <input v-model="form.nameCn" type="text" placeholder="please input" />
                </div>
                <div class="form-item">
                  <label>Name_MAL:</label>
                  <input v-model="form.nameMal" type="text" placeholder="please input" />
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Gender:</label>
                  <select v-model="form.gender" :class="fieldError('gender')">
                    <option value="">please select</option>
                    <option v-for="opt in genderOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label>Date of Birth:</label>
                  <DatePickerEn v-model="form.personal.dateOfBirth" placeholder="please select date" />
                </div>
                <div class="form-item">
                  <label>Nationality:</label>
                  <select v-model="form.personal.nationality">
                    <option value="">please select</option>
                    <option v-for="opt in nationalityOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Mobile Phone:</label>
                  <input v-model="form.personal.mobilePhone" type="text" placeholder="please input" :class="fieldError('mobilePhone')" />
                </div>
                <div class="form-item">
                  <label>Personal Email:</label>
                  <input v-model="form.personal.personalEmail" type="text" placeholder="please input" />
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Degree:</label>
                  <select v-model="form.degree" :class="fieldError('degree')">
                    <option value="">please select</option>
                    <option v-for="opt in degreeOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label>Research Focus Areas:</label>
                  <input v-model="form.personal.researchFocusAreas" type="text" placeholder="please input" />
                </div>
              </div>
            </section>

            <section class="form-section">
              <h3 class="section-title"><span class="bar" />Employment Information</h3>
              <div class="form-grid">
                <div class="form-item">
                  <label><span class="req">*</span> Staff ID:</label>
                  <input v-model="form.staffId" type="text" placeholder="please input" :class="fieldError('staffId')" />
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Category:</label>
                  <select v-model="form.category" :class="fieldError('category')">
                    <option value="">please select</option>
                    <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> School/Department:</label>
                  <select v-model="form.department" :class="fieldError('department')">
                    <option value="">please select</option>
                    <option v-for="opt in departmentOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> FOU/UG/PG:</label>
                  <select v-model="form.employment.foundationUndergraduatePostgraduate" :class="fieldError('foundationUndergraduatePostgraduate')">
                    <option value="">please select</option>
                    <option v-for="opt in foundationOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Title:</label>
                  <select v-model="form.title" :class="fieldError('title')">
                    <option value="">please select</option>
                    <option v-for="opt in titleOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Academic Position:</label>
                  <select v-model="form.academicPosition" :class="fieldError('academicPosition')">
                    <option value="">please select</option>
                    <option v-for="opt in academicPositionOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Office Extension:</label>
                  <input v-model="form.employment.officeExtension" type="text" placeholder="please input" :class="fieldError('officeExtension')" />
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> XMUM Email:</label>
                  <input v-model="form.employment.xmumEmail" type="text" placeholder="please input" :class="fieldError('xmumEmail')" />
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Date of Joining:</label>
                  <DatePickerEn v-model="form.dateOfJoining" placeholder="please select date" :class="fieldError('dateOfJoining')" />
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Employment Status:</label>
                  <div class="radio-group">
                    <label v-for="opt in employmentStatusOptions" :key="opt" class="radio-label">
                      <input v-model="form.employmentStatus" type="radio" :value="opt" /> {{ opt }}
                    </label>
                  </div>
                </div>
                <div class="form-item">
                  <label><span class="req">*</span> Currently Teaching:</label>
                  <div class="radio-group">
                    <label v-for="opt in yesNoOptions" :key="`ct-${opt}`" class="radio-label">
                      <input v-model="form.employment.currentlyTeaching" type="radio" :value="opt" /> {{ opt }}
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section class="form-section">
              <h3 class="section-title"><span class="bar" />Others</h3>
              <div class="form-grid">
                <div class="form-item full">
                  <label>Attachment:</label>
                  <div>
                    <input ref="fileInputRef" type="file" accept=".pdf" hidden @change="handleFileChange" />
                    <button type="button" class="btn-upload" @click="triggerFileUpload">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Upload File
                    </button>
                    <p class="upload-hint">Supported file extensions: .pdf</p>
                    <div v-if="form.attachment" class="file-row">
                      {{ form.attachment.fileName }} ({{ formatAttachmentSize(form.attachment.size) }}, {{ formatUploadTimestamp(form.attachment.uploadedAt) }})
                    </div>
                  </div>
                </div>
                <div class="form-item full">
                  <label>Remarks:</label>
                  <div class="textarea-wrap">
                    <textarea v-model="form.remarks" maxlength="400" rows="3" placeholder="please input" />
                    <span class="char-count">{{ form.remarks.length }}/400</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- Step 2 -->
          <div v-show="currentStep === 2" class="step-content">
            <QualificationSection v-model="form.qualifications" />
          </div>

          <!-- Step 3 -->
          <div v-show="currentStep === 3" class="step-content">
            <WorkingExperienceSection v-model="form.workingExperiences" />
          </div>

          <!-- Step 4 -->
          <div v-show="currentStep === 4" class="step-content cpd-placeholder">
            <div class="cpd-info">
              <h3>Continuous Professional Development (CPD)</h3>
              <p>CPD data is sourced from:</p>
              <ul>
                <li>HR system data synchronization</li>
                <li>Teacher portal submission after approval</li>
              </ul>
              <p class="hint">CPD records cannot be manually entered here. They will appear in the Details view once synced or approved.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="requestClose">Cancel</button>
          <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="handlePrevious">Previous</button>
          <button v-if="!isLastStep" type="button" class="btn btn-primary" @click="handleNext">Next</button>
          <button type="button" class="btn btn-primary" @click="requestSave">Save</button>
        </div>
      </div>
    </div>
  </Teleport>

  <ConfirmDialog
    :visible="saveConfirmVisible"
    title="Save Confirmation"
    :message="saveConfirmMessage"
    confirm-text="Confirm"
    confirm-variant="primary"
    wide
    @confirm="confirmSave"
    @cancel="saveConfirmVisible = false"
  />

  <ConfirmDialog
    :visible="cancelConfirmVisible"
    title="Cancel Confirmation"
    message="Your changes will not be saved. Are you sure you want to exit?"
    confirm-text="Confirm"
    confirm-variant="danger"
    wide
    @confirm="confirmClose"
    @cancel="cancelConfirmVisible = false"
  />
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
  --modal-pad-left: 20px;
  --modal-pad-right: 48px;
  --modal-footer-pad-right: 24px;
  --form-label-w: 168px;
  width: 100%;
  max-width: 1000px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--modal-pad-right) 12px var(--modal-pad-left);
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.modal-title { font-size: 16px; font-weight: 600; color: #111827; }
.modal-close {
  width: 32px; height: 32px; font-size: 22px; color: #6b7280;
  display: flex; align-items: center; justify-content: center; border-radius: 8px;
}
.modal-close:hover { background: #f0f0f0; }
.stepper {
  padding: 20px var(--modal-pad-right) 16px var(--modal-pad-left);
  flex-shrink: 0;
  overflow-x: auto;
}
.stepper-track {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: center;
  min-width: min-content;
  margin: 0 auto;
}
.step-unit {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex: 0 0 auto;
}
.step-unit-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 118px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font: inherit;
  text-align: center;
}
.step-unit-body:hover .step-circle {
  border-color: #93c5fd;
  color: #2563eb;
}
.step-unit-body:hover .step-label {
  color: #2563eb;
}
.step-unit-body.active:hover .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.step-unit-body.active:hover .step-label {
  color: #2563eb;
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
  line-height: 1;
  background: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
  box-sizing: border-box;
  flex-shrink: 0;
}
.step-label {
  margin-top: 8px;
  min-height: 44px;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  width: 100%;
  line-height: 1.35;
}
.step-unit-body.active .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.step-unit-body.active .step-label {
  color: #2563eb;
  font-weight: 500;
}
.step-connector {
  display: flex;
  align-items: center;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
  color: #cbd5e1;
}
.step-connector-line {
  flex: 1;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}
.step-connector-arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-left: -2px;
}
.modal-body { flex: 1; overflow-y: auto; padding: 0 var(--modal-pad-right) 20px var(--modal-pad-left); }
.form-section { margin-bottom: 28px; }
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 16px;
}
.bar { width: 3px; height: 16px; background: #2563eb; border-radius: 2px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 32px; }
.form-item { display: grid; grid-template-columns: var(--form-label-w) minmax(0, 1fr); gap: 8px 12px; align-items: center; }
.form-item.full { grid-column: 1 / -1; align-items: start; }
.form-item label { text-align: right; font-size: 13px; color: #374151; white-space: nowrap; }
.req { color: #ef4444; margin-right: 2px; }
.form-item input,
.form-item select { width: 100%; height: 36px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; padding: 0 10px; }
.form-item input.error,
.form-item select.error { border-color: #ef4444; }
.radio-group { display: flex; gap: 16px; }
.radio-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #374151; }
.btn-upload {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px;
  border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: #fff;
}
.btn-upload svg { width: 14px; height: 14px; }
.upload-hint { font-size: 12px; color: #9ca3af; margin-top: 6px; }
.file-row { font-size: 13px; margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 6px; }
.textarea-wrap { position: relative; }
.textarea-wrap textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; font-size: 13px; resize: vertical; }
.char-count { position: absolute; right: 8px; bottom: 8px; font-size: 12px; color: #9ca3af; }
.cpd-placeholder { padding: 24px 0; }
.cpd-info h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.cpd-info p { font-size: 14px; color: #4b5563; margin-bottom: 8px; }
.cpd-info ul { margin: 0 0 16px 20px; font-size: 14px; color: #4b5563; }
.cpd-info .hint { color: #9ca3af; font-style: italic; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px var(--modal-footer-pad-right) 16px var(--modal-pad-left);
  border-top: 1px solid #f0f0f0; flex-shrink: 0;
}
.btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 36px;
  padding: 0 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-default { background: #fff; border: 1px solid #d1d5db; color: #374151; }
.btn-default:hover { background: #f9fafb; }
</style>
