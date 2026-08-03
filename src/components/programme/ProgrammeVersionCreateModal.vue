<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { useDeleteConfirm } from '../../composables/useDeleteConfirm.js'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import {
  createFormSteps,
  createEmptyProgrammeForm,
  programmeLevelOptions,
  levelOfStudyOptions,
  fieldOfStudyOptions,
  typeOfProgrammeOptions,
  modeOfStudyOptions,
  methodOfDeliveryOptions,
  modeOfOfferOptions,
  awardingBodyOptions,
  mediumOfInstructionOptions,
  methodOfLearningOptions,
  advertisementCodeOptions,
  accStatusOptions,
  schoolElectiveCategoryOptions,
  getSchoolElectiveCategoryLabel,
  getDepartmentOptions,
  getProgrammeCurrentFormData,
  createAttachmentId,
  formatAttachmentSize,
  formatUploadTimestamp,
  programmePublishTooltip,
  typeOfApprovalOptions,
  localFeeColumns,
  internationalFeeColumns,
} from '../../data/programmeVersions.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  programme: { type: Object, default: null },
  defaultDepartmentId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save', 'publish'])

const { t, tr, isZh } = useAppI18n()
const {
  deleteConfirmVisible,
  deleteConfirmMessage,
  requestDelete: requestDeleteConfirm,
  confirmDelete,
  cancelDelete,
} = useDeleteConfirm()

const currentStep = ref(1)
const form = ref(createEmptyProgrammeForm())
const errors = ref({})

const departmentOptions = getDepartmentOptions()

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() => (isEditMode.value ? t('common.edit') : t('common.create')))
const lockedProgrammeCode = computed(() => props.programme?.code || '')
const isLastStep = computed(() => currentStep.value === createFormSteps.length)

const fileInputRef = ref(null)
const pendingUploadFile = ref(null)
const pendingUploadDescription = ref('')

watch(
  () => [props.visible, props.mode, props.programme],
  () => {
    if (!props.visible) return
    currentStep.value = 1
    errors.value = {}
    pendingUploadFile.value = null
    pendingUploadDescription.value = ''
    if (fileInputRef.value) fileInputRef.value.value = ''

    if (isEditMode.value && props.programme) {
      form.value = getProgrammeCurrentFormData(props.programme)
      if (lockedProgrammeCode.value) {
        form.value.programmeInfo.programmeCode = lockedProgrammeCode.value
      }
    } else {
      form.value = createEmptyProgrammeForm()
      if (props.defaultDepartmentId) {
        form.value.programmeInfo.department = props.defaultDepartmentId
      }
    }
  },
)

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function onFileSelected(event) {
  const file = event.target.files?.[0]
  pendingUploadFile.value = file || null
}

function confirmAttachmentUpload() {
  if (!pendingUploadFile.value) {
    window.alert(tr('Please select a file to upload.'))
    return
  }
  const file = pendingUploadFile.value
  if (file.size > 10 * 1024 * 1024) {
    window.alert(tr('Single file size must not exceed 10MB.'))
    return
  }
  const desc = pendingUploadDescription.value.trim()
  if (desc.length > 100) {
    window.alert(tr('Description must be at most 100 characters.'))
    return
  }
  form.value.attachments.push({
    id: createAttachmentId(),
    fileName: file.name,
    fileSize: file.size,
    fileSizeLabel: formatAttachmentSize(file.size),
    uploadedAt: formatUploadTimestamp(new Date()),
    description: pendingUploadDescription.value.trim(),
  })
  pendingUploadFile.value = null
  pendingUploadDescription.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function removeAttachment(id) {
  requestDeleteConfirm(
    () => {
      form.value.attachments = form.value.attachments.filter((item) => item.id !== id)
    },
    tr('Are you sure you want to delete this record?'),
  )
}

function getFileIconType(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['pdf'].includes(ext)) return 'pdf'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image'
  if (['zip', 'rar'].includes(ext)) return 'archive'
  return 'file'
}

function setError(key, message) {
  if (message) errors.value[key] = message
  else delete errors.value[key]
}

function requireText(value, key, label) {
  if (!String(value || '').trim()) {
    setError(key, `${label} is required`)
    return false
  }
  setError(key, '')
  return true
}

function requireSelect(value, key, label) {
  if (!value) {
    setError(key, `${label} is required`)
    return false
  }
  setError(key, '')
  return true
}

function requireTextMax(value, key, label, maxLength = 100) {
  const text = String(value || '').trim()
  if (!text) {
    setError(key, `${label} is required`)
    return false
  }
  if (text.length > maxLength) {
    setError(key, `${label} must be at most ${maxLength} characters`)
    return false
  }
  setError(key, '')
  return true
}

function requireTextMaxLen(value, key, label, maxLength) {
  const text = String(value || '').trim()
  if (!text) {
    setError(key, `${label} is required`)
    return false
  }
  if (text.length > maxLength) {
    setError(key, `${label} must be at most ${maxLength} characters`)
    return false
  }
  setError(key, '')
  return true
}

function optionalTextMax(value, key, label, maxLength) {
  const text = String(value || '').trim()
  if (!text) {
    setError(key, '')
    return true
  }
  if (text.length > maxLength) {
    setError(key, `${label} must be at most ${maxLength} characters`)
    return false
  }
  setError(key, '')
  return true
}

function requireNumericMaxDigits(value, key, label, maxDigits = 2) {
  const text = String(value || '').trim()
  if (!text) {
    setError(key, `${label} is required`)
    return false
  }
  if (!new RegExp(`^\\d{1,${maxDigits}}$`).test(text)) {
    setError(key, `${label} must be numeric with at most ${maxDigits} digits`)
    return false
  }
  setError(key, '')
  return true
}

function optionalNumericMaxDigits(value, key, label, maxDigits = 2) {
  const text = String(value || '').trim()
  if (!text) {
    setError(key, '')
    return true
  }
  if (!new RegExp(`^\\d{1,${maxDigits}}$`).test(text)) {
    setError(key, `${label} must be numeric with at most ${maxDigits} digits`)
    return false
  }
  setError(key, '')
  return true
}

function validateStep1() {
  const info = form.value.programmeInfo
  let valid = true
  const checks = [
    () => requireTextMax(info.programmeName, 'programmeName', 'Programme Name', 100),
    () => requireTextMax(info.programmeNameEn, 'programmeNameEn', 'Programme Name_EN', 100),
    () => requireTextMax(info.programmeNameMal, 'programmeNameMal', 'Programme Name_MAL', 100),
    () => requireTextMaxLen(info.programmeCode, 'programmeCode', 'Programme Code', 20),
    () => optionalTextMax(info.idCode, 'idCode', 'ID Code', 20),
    () => optionalTextMax(info.nec, 'nec', 'National Education Code (NEC)', 20),
    () => optionalNumericMaxDigits(info.studyDurationChinese, 'studyDurationChinese', 'Study Duration for Chinese Students'),
    () => requireNumericMaxDigits(info.years, 'years', 'Years'),
    () => requireSelect(info.levelOfStudy, 'levelOfStudy', 'Level'),
    () => requireSelect(info.level, 'level', 'Programme Level'),
    () => requireSelect(info.typeOfProgramme, 'typeOfProgramme', 'Type of Programme'),
    () => requireSelect(info.methodOfLearning, 'methodOfLearning', 'Method of Learning and Teaching'),
    () => requireSelect(info.modeOfStudy, 'modeOfStudy', 'Mode of Study'),
    () => requireSelect(info.mediumOfInstruction, 'mediumOfInstruction', 'Medium of Instruction'),
    () => requireSelect(info.methodOfDelivery, 'methodOfDelivery', 'Method of Delivery'),
    () => requireSelect(info.modeOfOffer, 'modeOfOffer', 'Mode of Offer'),
    () => requireSelect(info.accStatus, 'accStatus', 'Acc. Status'),
    () => requireSelect(info.schoolElectiveCategory, 'schoolElectiveCategory', 'School Elective Category'),
    () => optionalNumericMaxDigits(info.longSemesterWeeks, 'longSemesterWeeks', 'No. of weeks (Long Semester)'),
    () => optionalNumericMaxDigits(info.longSemesterCount, 'longSemesterCount', 'No. of semester (Long Semester)'),
    () => optionalNumericMaxDigits(info.shortSemesterWeeks, 'shortSemesterWeeks', 'No. of weeks (Short Semester)'),
    () => optionalNumericMaxDigits(info.shortSemesterCount, 'shortSemesterCount', 'No. of semester (Short Semester)'),
    () => optionalNumericMaxDigits(info.industrialTrainingWeeks, 'industrialTrainingWeeks', 'No. of weeks (Industrial Training)'),
    () => optionalNumericMaxDigits(info.industrialTrainingCount, 'industrialTrainingCount', 'No. of semester (Industrial Training)'),
  ]
  checks.forEach((check) => {
    if (!check()) valid = false
  })
  return valid
}

function validateStep2() {
  const approval = form.value.approvalDetails
  let valid = true
  const checks = [
    () => requireTextMaxLen(approval.mqaCode, 'mqaCode', 'MQA Code', 50),
    () => requireText(approval.mqaStartDate, 'mqaStartDate', 'Start Date (MQA)'),
    () => requireText(approval.mqaSyorDatePa, 'mqaSyorDatePa', 'Syor Date(PA)'),
    () => requireTextMaxLen(approval.mqaSyorReferencePa, 'mqaSyorReferencePa', 'Syor Reference (PA)', 50),
    () => requireText(approval.mqaSyorDateFa, 'mqaSyorDateFa', 'Syor Date(FA)'),
    () => requireTextMaxLen(approval.mqaSyorReferenceFa, 'mqaSyorReferenceFa', 'Syor Reference (FA)', 50),
    () => requireNumericMaxDigits(approval.mqaFirstIntakeDuration, 'mqaFirstIntakeDuration', 'First intake duration as in approval'),
    () => requireTextMaxLen(approval.moheCode, 'moheCode', 'MOHE Code', 50),
    () => requireTextMaxLen(approval.moheApprovalReferenceNo, 'moheApprovalReferenceNo', 'MOHE Approval Reference No.', 50),
    () => requireText(approval.moheApprovalDate, 'moheApprovalDate', 'Approval Date (MOHE)'),
    () => requireText(approval.moheStartDate, 'moheStartDate', 'Start Date (MOHE)'),
  ]
  checks.forEach((check) => {
    if (!check()) valid = false
  })
  return valid
}

function validateStep3() {
  const entry = form.value.entryRequirements
  let valid = true
  const checks = [
    () => optionalNumericPattern(entry.muet, 'muet', 'MUET', /^\d+(\.\d{1,3})?$/, 'must be numeric with at most 3 decimal places'),
    () => optionalNumericPattern(entry.elts, 'elts', 'IELTS', /^\d+(\.\d{1})?$/, 'must be numeric with at most 1 decimal place'),
    () => optionalNumericPattern(entry.toeflIbt, 'toeflIbt', 'TOEFL IBT', /^\d{1,3}$/, 'must be numeric with at most 3 digits'),
    () => optionalNumericPattern(entry.toeflEssentials, 'toeflEssentials', 'TOEFL Essentials (Online)', /^\d{1,3}$/, 'must be numeric with at most 3 digits'),
    () => optionalNumericPattern(entry.pearsonTestOfEnglish, 'pearsonTestOfEnglish', 'PEARSON TEST OF ENGLISH', /^\d+(\.\d{1})?$/, 'must be numeric with at most 1 decimal place'),
    () => optionalNumericPattern(entry.cambridgeEnglishIi, 'cambridgeEnglishIi', 'CAMBRIDGE ENGLISH(i/ii)', /^\d+(\.\d{1})?$/, 'must be numeric with at most 1 decimal place'),
    () => optionalNumericPattern(entry.cambridgeEnglishIii, 'cambridgeEnglishIii', 'CAMBRIDGE ENGLISH(iii)', /^\d+(\.\d{1})?$/, 'must be numeric with at most 1 decimal place'),
    () => optionalNumericPattern(entry.els, 'els', 'ELS', /^\d{1,3}$/, 'must be numeric with at most 3 digits'),
  ]
  checks.forEach((check) => {
    if (!check()) valid = false
  })
  return valid
}

function optionalNumericPattern(value, key, label, pattern, message) {
  const text = String(value ?? '').trim()
  if (!text) {
    setError(key, '')
    return true
  }
  if (!pattern.test(text)) {
    setError(key, `${label} ${message}`)
    return false
  }
  setError(key, '')
  return true
}

function validateStep4() {
  const threshold = form.value.thresholdMarks
  let valid = true
  const checks = [
    () => optionalNumericPattern(threshold.totalContinuousAssessment, 'totalContinuousAssessment', 'Total Continuous Assessment', /^\d{1,3}$/, 'must be numeric with at most 3 digits'),
    () => optionalNumericPattern(threshold.totalFinalAssessment, 'totalFinalAssessment', 'Total Final Assessment', /^\d{1,3}$/, 'must be numeric with at most 3 digits'),
    () => optionalNumericPattern(threshold.overallScore, 'overallScore', 'Overall Score', /^\d{1,3}$/, 'must be numeric with at most 3 digits'),
  ]
  checks.forEach((check) => {
    if (!check()) valid = false
  })
  return valid
}

function validateStep5() {
  const fee = form.value.feeStructure
  let valid = true
  const checks = [
    () => requireNumericMaxDigits(fee.durationMinYear, 'durationMinYear', 'Duration (Min. Year)'),
    () => requireSelect(fee.typeOfApproval, 'typeOfApproval', 'Type of Approval'),
  ]
  localFeeColumns.forEach((col) => {
    checks.push(() =>
      optionalNumericPattern(
        fee.localStudent?.[col.key],
        `local-${col.key}`,
        col.label,
        /^\d+(\.\d{1,2})?$/,
        'must be numeric with at most 2 decimal places',
      ),
    )
  })
  internationalFeeColumns.forEach((col) => {
    checks.push(() =>
      optionalNumericPattern(
        fee.internationalStudent?.[col.key],
        `intl-${col.key}`,
        col.label,
        /^\d+(\.\d{1,2})?$/,
        'must be numeric with at most 2 decimal places',
      ),
    )
  })
  checks.forEach((check) => {
    if (!check()) valid = false
  })
  return valid
}

const stepValidators = {
  1: validateStep1,
  2: validateStep2,
  3: validateStep3,
  4: validateStep4,
  5: validateStep5,
}

function validateCurrentStep() {
  errors.value = {}
  return stepValidators[currentStep.value]?.() ?? true
}

function handleNext() {
  if (!validateCurrentStep()) return
  if (currentStep.value < createFormSteps.length) {
    currentStep.value += 1
    errors.value = {}
  }
}

function handlePrevious() {
  if (currentStep.value > 1) {
    currentStep.value -= 1
    errors.value = {}
  }
}

function handleSubmit() {
  if (!validateCurrentStep()) return
  emit('save', buildSubmitPayload())
}

function buildSubmitPayload() {
  const payload = JSON.parse(JSON.stringify(form.value))
  if (isEditMode.value && props.programme) {
    const current = getProgrammeCurrentFormData(props.programme)
    if (lockedProgrammeCode.value) {
      payload.programmeInfo.programmeCode = lockedProgrammeCode.value
    }
    payload.programmeInfo.idCode = current.programmeInfo.idCode || payload.programmeInfo.idCode
    payload.programmeInfo.nec = current.programmeInfo.nec || payload.programmeInfo.nec
  }
  return payload
}

function handlePublish() {
  if (!validateCurrentStep()) return
  emit('publish', buildSubmitPayload())
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function stepClass(stepId) {
  if (stepId === currentStep.value) return 'active'
  if (stepId < currentStep.value) return 'completed'
  return ''
}

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
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

        <p v-if="isEditMode" class="modal-subtitle">
          {{ tr('Edit programme information. Programme Code, ID Code and NEC are fixed. Saving will create a new version; view change history via ProgrammeDetails.') }}
        </p>

        <div class="stepper">
          <template v-for="(step, index) in createFormSteps" :key="step.id">
            <div class="step-item" :class="stepClass(step.id)">
              <span class="step-circle">{{ step.id }}</span>
              <span class="step-label">{{ tr(step.title) }}</span>
            </div>
            <div v-if="index < createFormSteps.length - 1" class="step-line" :class="{ completed: step.id < currentStep }" />
          </template>
        </div>

        <div class="modal-body">
          <!-- Step 1: Programme Info -->
          <section v-show="currentStep === 1" class="programme-info-section">
            <h3 class="section-title"><span class="section-bar"></span>{{ tr('Programme Info') }}</h3>
            <div class="programme-info-form">
              <div class="pi-row pi-row-full">
                <label class="pi-label"><span class="required">*</span> {{ tr('Programme Name:') }}</label>
                <input
                  v-model="form.programmeInfo.programmeName"
                  type="text"
                  class="pi-input pi-input-wide"
                  :class="fieldError('programmeName')"
                  maxlength="100"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Programme Name_EN:') }}</label>
                  <input
                    v-model="form.programmeInfo.programmeNameEn"
                    type="text"
                    class="pi-input"
                    :class="fieldError('programmeNameEn')"
                    maxlength="100"
                    :placeholder="t('common.pleaseInput')"
                  />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Programme Name_MAL:') }}</label>
                  <input
                    v-model="form.programmeInfo.programmeNameMal"
                    type="text"
                    class="pi-input"
                    :class="fieldError('programmeNameMal')"
                    maxlength="100"
                    :placeholder="t('common.pleaseInput')"
                  />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Programme Code:') }}</label>
                  <input
                    v-model="form.programmeInfo.programmeCode"
                    type="text"
                    class="pi-input"
                    :class="[fieldError('programmeCode'), { 'pi-input-readonly': isEditMode }]"
                    maxlength="20"
                    :placeholder="t('common.pleaseInput')"
                    :disabled="isEditMode"
                    :readonly="isEditMode"
                  />
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('ID Code:') }}</label>
                  <input
                    v-model="form.programmeInfo.idCode"
                    type="text"
                    class="pi-input"
                    :class="[fieldError('idCode'), { 'pi-input-readonly': isEditMode }]"
                    maxlength="20"
                    :placeholder="t('common.pleaseInput')"
                    :disabled="isEditMode"
                    :readonly="isEditMode"
                  />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('National Education Code (NEC):') }}</label>
                  <input
                    v-model="form.programmeInfo.nec"
                    type="text"
                    class="pi-input"
                    :class="[fieldError('nec'), { 'pi-input-readonly': isEditMode }]"
                    maxlength="20"
                    :placeholder="t('common.pleaseInput')"
                    :disabled="isEditMode"
                    :readonly="isEditMode"
                  />
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Study Duration for Chinese Students:') }}</label>
                  <input
                    v-model="form.programmeInfo.studyDurationChinese"
                    type="text"
                    class="pi-input"
                    :class="fieldError('studyDurationChinese')"
                    maxlength="2"
                    :placeholder="t('common.pleaseInput')"
                  />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Years:') }}</label>
                  <input
                    v-model="form.programmeInfo.years"
                    type="text"
                    class="pi-input"
                    :class="fieldError('years')"
                    maxlength="2"
                    :placeholder="t('common.pleaseInput')"
                  />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Level:') }}</label>
                  <select v-model="form.programmeInfo.levelOfStudy" class="pi-input pi-select" :class="fieldError('levelOfStudy')">
                    <option value="">please select</option>
                    <option v-for="opt in levelOfStudyOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Programme Level:') }}</label>
                  <select v-model="form.programmeInfo.level" class="pi-input pi-select" :class="fieldError('level')">
                    <option value="">please select</option>
                    <option v-for="opt in programmeLevelOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Field of Study:') }}</label>
                  <select v-model="form.programmeInfo.fieldOfStudy" class="pi-input pi-select" :class="fieldError('fieldOfStudy')">
                    <option value="">please select</option>
                    <option v-for="opt in fieldOfStudyOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Type of Programme:') }}</label>
                  <select v-model="form.programmeInfo.typeOfProgramme" class="pi-input pi-select" :class="fieldError('typeOfProgramme')">
                    <option value="">please select</option>
                    <option v-for="opt in typeOfProgrammeOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Method of Learning and Teaching:') }}</label>
                  <select v-model="form.programmeInfo.methodOfLearning" class="pi-input pi-select" :class="fieldError('methodOfLearning')">
                    <option value="">please select</option>
                    <option v-for="opt in methodOfLearningOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Mode of Study:') }}</label>
                  <select v-model="form.programmeInfo.modeOfStudy" class="pi-input pi-select" :class="fieldError('modeOfStudy')">
                    <option value="">please select</option>
                    <option v-for="opt in modeOfStudyOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Medium of Instruction:') }}</label>
                  <select v-model="form.programmeInfo.mediumOfInstruction" class="pi-input pi-select" :class="fieldError('mediumOfInstruction')">
                    <option value="">please select</option>
                    <option v-for="opt in mediumOfInstructionOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Method of Delivery:') }}</label>
                  <select v-model="form.programmeInfo.methodOfDelivery" class="pi-input pi-select" :class="fieldError('methodOfDelivery')">
                    <option value="">please select</option>
                    <option v-for="opt in methodOfDeliveryOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Mode of Offer:') }}</label>
                  <select v-model="form.programmeInfo.modeOfOffer" class="pi-input pi-select" :class="fieldError('modeOfOffer')">
                    <option value="">please select</option>
                    <option v-for="opt in modeOfOfferOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Awarding body:') }}</label>
                  <select v-model="form.programmeInfo.awardingBody" class="pi-input pi-select" :class="fieldError('awardingBody')">
                    <option value="">please select</option>
                    <option v-for="opt in awardingBodyOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Department:') }}</label>
                  <select v-model="form.programmeInfo.department" class="pi-input pi-select" :class="fieldError('department')">
                    <option value="">please select</option>
                    <option v-for="dept in departmentOptions" :key="dept.id" :value="dept.id">{{ dept.label }}</option>
                  </select>
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('School Elective Category:') }}</label>
                  <select
                    v-model="form.programmeInfo.schoolElectiveCategory"
                    class="pi-input pi-select"
                    :class="fieldError('schoolElectiveCategory')"
                  >
                    <option value="">please select</option>
                    <option
                      v-for="opt in schoolElectiveCategoryOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ isZh ? opt.zh : opt.en }}
                    </option>
                  </select>
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Prog. Commence:') }}</label>
                  <DatePickerEn
                    v-model="form.programmeInfo.progCommence"
                    :placeholder="t('common.pleaseSelectDate')"
                    :has-error="!!errors.progCommence"
                  />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Advertisement Code:') }}</label>
                  <select v-model="form.programmeInfo.advertisementCode" class="pi-input pi-select" :class="fieldError('advertisementCode')">
                    <option value="">please select</option>
                    <option v-for="opt in advertisementCodeOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="pi-field"></div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Acc. Status:') }}</label>
                  <div class="pi-radio-group" :class="fieldError('accStatus')">
                    <label v-for="opt in accStatusOptions" :key="opt">
                      <input v-model="form.programmeInfo.accStatus" type="radio" :value="opt" /> {{ opt }}
                    </label>
                  </div>
                </div>
                <div class="pi-field pi-field-empty"></div>
              </div>

              <div class="pi-row pi-row-semester">
                <label class="pi-label">{{ tr('No. of weeks and semester:') }}</label>
                <div class="semester-table-wrap">
                  <table class="semester-table">
                    <thead>
                      <tr>
                        <th colspan="2">Long Semester</th>
                        <th colspan="2">Short Semester</th>
                        <th colspan="2">Industrial Training</th>
                      </tr>
                      <tr>
                        <th>No. of weeks</th>
                        <th>No. of semester</th>
                        <th>No. of weeks</th>
                        <th>No. of semester</th>
                        <th>No. of weeks</th>
                        <th>No. of semester</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <input v-model="form.programmeInfo.longSemesterWeeks" type="text" class="semester-input" :class="fieldError('longSemesterWeeks')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                        </td>
                        <td>
                          <input v-model="form.programmeInfo.longSemesterCount" type="text" class="semester-input" :class="fieldError('longSemesterCount')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                        </td>
                        <td>
                          <input v-model="form.programmeInfo.shortSemesterWeeks" type="text" class="semester-input" :class="fieldError('shortSemesterWeeks')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                        </td>
                        <td>
                          <input v-model="form.programmeInfo.shortSemesterCount" type="text" class="semester-input" :class="fieldError('shortSemesterCount')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                        </td>
                        <td>
                          <input v-model="form.programmeInfo.industrialTrainingWeeks" type="text" class="semester-input" :class="fieldError('industrialTrainingWeeks')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                        </td>
                        <td>
                          <input v-model="form.programmeInfo.industrialTrainingCount" type="text" class="semester-input" :class="fieldError('industrialTrainingCount')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="pi-row pi-row-attachments">
                <label class="pi-label">{{ tr('Attachments:') }}</label>
                <div class="attachments-panel">
                  <div v-if="form.attachments.length" class="attachments-list">
                    <div
                      v-for="item in form.attachments"
                      :key="item.id"
                      class="attachment-card"
                    >
                      <button type="button" class="attachment-delete" aria-label="Delete attachment" @click="removeAttachment(item.id)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <div class="attachment-head">
                        <div class="file-icon" :class="`file-icon-${getFileIconType(item.fileName)}`">
                          <span v-if="getFileIconType(item.fileName) === 'word'" class="file-icon-letter">W</span>
                          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div class="attachment-meta">
                          <p class="attachment-name">{{ item.fileName }}</p>
                          <p class="attachment-info">
                            <span>{{ item.fileSizeLabel || formatAttachmentSize(item.fileSize) }}</span>
                            <span class="attachment-upload-time">Uploaded at: {{ item.uploadedAt }}</span>
                          </p>
                        </div>
                      </div>
                      <div v-if="item.description" class="attachment-desc">
                        <span class="attachment-desc-label">Description:</span>
                        <span class="attachment-desc-text">{{ item.description }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="attachment-upload-box">
                    <div class="upload-toolbar">
                      <input
                        ref="fileInputRef"
                        type="file"
                        class="file-input-hidden"
                        accept=".rar,.zip,.doc,.docx,.pdf,.jpg,.jpeg,.png"
                        @change="onFileSelected"
                      />
                      <div class="upload-toolbar-main">
                        <button type="button" class="upload-btn" @click="triggerFileSelect">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Upload
                        </button>
                        <span class="upload-hint">Supported file formats: .rar, .zip, .doc, .docx, .pdf, .jpg...</span>
                      </div>
                    </div>
                    <div class="upload-desc-wrap">
                      <label class="upload-desc-label">Description:</label>
                      <textarea
                        v-model="pendingUploadDescription"
                        class="upload-desc-input"
                        maxlength="100"
                        :placeholder="t('common.pleaseInput')"
                      />
                      <span class="upload-char-count">{{ pendingUploadDescription.length }}/100</span>
                    </div>
                    <div class="upload-actions">
                      <button type="button" class="btn btn-primary btn-upload-confirm" @click="confirmAttachmentUpload">{{ t('common.confirm') }}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Step 2: Approval Details -->
          <section v-show="currentStep === 2" class="approval-details-section">
            <div class="programme-info-form approval-details-form">
              <h3 class="section-title"><span class="section-bar"></span>{{ tr('MQA Info') }}</h3>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('MQA Code:') }}</label>
                  <input v-model="form.approvalDetails.mqaCode" type="text" class="pi-input" :class="fieldError('mqaCode')" maxlength="50" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Start Date (MQA):') }}</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaStartDate" :placeholder="t('common.pleaseSelectDate')" :has-error="!!errors.mqaStartDate" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Expiry Date (MQA):') }}</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaExpiryDate" :placeholder="t('common.pleaseSelectDate')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Syor Date(PA):') }}</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaSyorDatePa" :placeholder="t('common.pleaseSelectDate')" :has-error="!!errors.mqaSyorDatePa" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Syor Reference (PA):') }}</label>
                  <input v-model="form.approvalDetails.mqaSyorReferencePa" type="text" class="pi-input" :class="fieldError('mqaSyorReferencePa')" maxlength="50" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Syor Date(FA):') }}</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaSyorDateFa" :placeholder="t('common.pleaseSelectDate')" :has-error="!!errors.mqaSyorDateFa" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Syor Reference (FA):') }}</label>
                  <input v-model="form.approvalDetails.mqaSyorReferenceFa" type="text" class="pi-input" :class="fieldError('mqaSyorReferenceFa')" maxlength="50" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('First intake duration as in approval:') }}</label>
                  <input v-model="form.approvalDetails.mqaFirstIntakeDuration" type="text" class="pi-input" :class="fieldError('mqaFirstIntakeDuration')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                </div>
              </div>

              <h3 class="section-title section-title-spaced"><span class="section-bar"></span>{{ tr('MOHE Info') }}</h3>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('MOHE Code:') }}</label>
                  <input v-model="form.approvalDetails.moheCode" type="text" class="pi-input" :class="fieldError('moheCode')" maxlength="50" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('MOHE Approval Reference No.:') }}</label>
                  <input v-model="form.approvalDetails.moheApprovalReferenceNo" type="text" class="pi-input" :class="fieldError('moheApprovalReferenceNo')" maxlength="50" :placeholder="t('common.pleaseInput')" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Approval Date (MOHE):') }}</label>
                  <DatePickerEn v-model="form.approvalDetails.moheApprovalDate" :placeholder="t('common.pleaseSelectDate')" :has-error="!!errors.moheApprovalDate" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Start Date (MOHE):') }}</label>
                  <DatePickerEn v-model="form.approvalDetails.moheStartDate" :placeholder="t('common.pleaseSelectDate')" :has-error="!!errors.moheStartDate" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('Expiry Date (MOHE):') }}</label>
                  <DatePickerEn v-model="form.approvalDetails.moheExpiryDate" :placeholder="t('common.pleaseSelectDate')" />
                </div>
                <div class="pi-field pi-field-empty"></div>
              </div>
            </div>
          </section>

          <!-- Step 3: Entry Requirements -->
          <section v-show="currentStep === 3" class="entry-requirements-section">
            <h3 class="section-title"><span class="section-bar"></span>{{ tr('Entry Requirements') }}</h3>
            <div class="programme-info-form">
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('MUET:') }}</label>
                  <input v-model="form.entryRequirements.muet" type="text" class="pi-input" :class="fieldError('muet')" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('IELTS:') }}</label>
                  <input v-model="form.entryRequirements.elts" type="text" class="pi-input" :class="fieldError('elts')" :placeholder="t('common.pleaseInput')" />
                </div>
              </div>
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('TOEFL IBT:') }}</label>
                  <input v-model="form.entryRequirements.toeflIbt" type="text" class="pi-input" :class="fieldError('toeflIbt')" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('TOEFL Essentials (Online):') }}</label>
                  <input v-model="form.entryRequirements.toeflEssentials" type="text" class="pi-input" :class="fieldError('toeflEssentials')" :placeholder="t('common.pleaseInput')" />
                </div>
              </div>
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('PEARSON TEST OF ENGLISH:') }}</label>
                  <input v-model="form.entryRequirements.pearsonTestOfEnglish" type="text" class="pi-input" :class="fieldError('pearsonTestOfEnglish')" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('CAMBRIDGE ENGLISH(i/ii):') }}</label>
                  <input v-model="form.entryRequirements.cambridgeEnglishIi" type="text" class="pi-input" :class="fieldError('cambridgeEnglishIi')" :placeholder="t('common.pleaseInput')" />
                </div>
              </div>
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">{{ tr('CAMBRIDGE ENGLISH(iii):') }}</label>
                  <input v-model="form.entryRequirements.cambridgeEnglishIii" type="text" class="pi-input" :class="fieldError('cambridgeEnglishIii')" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">{{ tr('ELS:') }}</label>
                  <input v-model="form.entryRequirements.els" type="text" class="pi-input" :class="fieldError('els')" :placeholder="t('common.pleaseInput')" />
                </div>
              </div>
            </div>
          </section>

          <!-- Step 4: Threshold Marks -->
          <section v-show="currentStep === 4" class="threshold-marks-section">
            <h3 class="section-title"><span class="section-bar"></span>{{ tr('Threshold Marks') }}</h3>
            <div class="programme-info-form">
              <div class="threshold-table-wrap">
                <table class="threshold-table">
                  <thead>
                    <tr>
                      <th>Total Continuous Assessment</th>
                      <th>Total Final Assessment</th>
                      <th>Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input v-model="form.thresholdMarks.totalContinuousAssessment" type="text" class="threshold-input" :class="fieldError('totalContinuousAssessment')" maxlength="3" :placeholder="t('common.pleaseInput')" />
                      </td>
                      <td>
                        <input v-model="form.thresholdMarks.totalFinalAssessment" type="text" class="threshold-input" :class="fieldError('totalFinalAssessment')" maxlength="3" :placeholder="t('common.pleaseInput')" />
                      </td>
                      <td>
                        <input v-model="form.thresholdMarks.overallScore" type="text" class="threshold-input" :class="fieldError('overallScore')" maxlength="3" :placeholder="t('common.pleaseInput')" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Step 5: Fee Structure -->
          <section v-show="currentStep === 5" class="fee-structure-section">
            <h3 class="section-title"><span class="section-bar"></span>{{ tr('Fee Structure') }}</h3>
            <div class="programme-info-form fee-structure-form">
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Duration (Min. Year):') }}</label>
                  <input v-model="form.feeStructure.durationMinYear" type="text" class="pi-input" :class="fieldError('durationMinYear')" maxlength="2" :placeholder="t('common.pleaseInput')" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> {{ tr('Type of Approval:') }}</label>
                  <select v-model="form.feeStructure.typeOfApproval" class="pi-input pi-select" :class="fieldError('typeOfApproval')">
                    <option value="">please select</option>
                    <option v-for="opt in typeOfApprovalOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>

              <h3 class="section-title section-title-spaced"><span class="section-bar"></span>{{ tr('Local Student (RM)') }}</h3>
              <div class="fee-table-wrap">
                <table class="fee-table">
                  <thead>
                    <tr>
                      <th v-for="col in localFeeColumns" :key="`local-head-${col.key}`">{{ col.label }}</th>
                      <th class="col-check-total">Check Total (Local Student)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td v-for="col in localFeeColumns" :key="`local-${col.key}`">
                        <input v-model="form.feeStructure.localStudent[col.key]" type="text" class="fee-input" :class="fieldError(`local-${col.key}`)" :placeholder="t('common.pleaseInput')" />
                      </td>
                      <td class="col-check-total">
                        <button
                          type="button"
                          class="tf-switch"
                          :class="{ on: form.feeStructure.localStudent.checkTotal }"
                          :aria-pressed="form.feeStructure.localStudent.checkTotal"
                          @click="form.feeStructure.localStudent.checkTotal = !form.feeStructure.localStudent.checkTotal"
                        >
                          <span class="tf-switch-track">
                            <span class="tf-switch-letter tf-switch-letter-t">T</span>
                            <span class="tf-switch-knob"></span>
                            <span class="tf-switch-letter tf-switch-letter-f">F</span>
                          </span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 class="section-title section-title-spaced"><span class="section-bar"></span>{{ tr('International Student (RM)') }}</h3>
              <div class="fee-table-wrap">
                <table class="fee-table">
                  <thead>
                    <tr>
                      <th v-for="col in internationalFeeColumns" :key="`intl-head-${col.key}`">{{ col.label }}</th>
                      <th class="col-check-total">Check Total (International Student)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td v-for="col in internationalFeeColumns" :key="`intl-${col.key}`">
                        <input v-model="form.feeStructure.internationalStudent[col.key]" type="text" class="fee-input" :class="fieldError(`intl-${col.key}`)" :placeholder="t('common.pleaseInput')" />
                      </td>
                      <td class="col-check-total">
                        <button
                          type="button"
                          class="tf-switch"
                          :class="{ on: form.feeStructure.internationalStudent.checkTotal }"
                          :aria-pressed="form.feeStructure.internationalStudent.checkTotal"
                          @click="
                            form.feeStructure.internationalStudent.checkTotal =
                              !form.feeStructure.internationalStudent.checkTotal
                          "
                        >
                          <span class="tf-switch-track">
                            <span class="tf-switch-letter tf-switch-letter-t">T</span>
                            <span class="tf-switch-knob"></span>
                            <span class="tf-switch-letter tf-switch-letter-f">F</span>
                          </span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div class="modal-footer">
          <div class="modal-footer-left">
            <button
              v-if="isLastStep"
              type="button"
              class="btn btn-outline publish-btn"
              @click="handlePublish"
            >
              {{ tr('Publish') }}
              <span class="info-tip-wrap">
                <span class="info-icon" aria-hidden="true">i</span>
                <span class="info-tooltip">{{ programmePublishTooltip }}</span>
              </span>
            </button>
          </div>
          <div class="modal-footer-right">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="handlePrevious">{{ tr('Previous') }}</button>
            <button v-if="currentStep < createFormSteps.length" type="button" class="btn btn-primary" @click="handleNext">{{ tr('Next') }}</button>
            <button v-else type="button" class="btn btn-primary" @click="handleSubmit">{{ t('common.confirm') }}</button>
          </div>
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
  max-width: 1080px;
  max-height: 92vh;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--modal-pad-x);
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-subtitle {
  margin: 0;
  padding: 10px var(--modal-pad-x) 0;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
  flex-shrink: 0;
}

.pi-input-readonly:disabled,
.pi-input-readonly[readonly] {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
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

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 20px var(--modal-pad-x) 16px;
  flex-shrink: 0;
  gap: 4px 0;
  overflow-x: hidden;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 0 1 auto;
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
  white-space: normal;
  text-align: center;
  max-width: 96px;
  line-height: 1.3;
}

.step-item.active .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.step-item.active .step-label {
  color: #2563eb;
  font-weight: 500;
}

.step-item.completed .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.step-item.completed .step-label {
  color: #2563eb;
}

.step-line {
  flex: 1;
  max-width: 64px;
  min-width: 24px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 4px 24px;
}

.step-line.completed {
  background: #2563eb;
}

.modal-body {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 var(--modal-pad-x) 8px;
}

.modal-body > section {
  min-width: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.section-title-spaced {
  margin-top: 28px;
}

.approval-details-section {
  min-width: 0;
}

.approval-details-form .pi-field :deep(.date-picker-en) {
  width: 100%;
  min-width: 0;
}

.entry-requirements-section,
.threshold-marks-section,
.fee-structure-section {
  min-width: 0;
}

.threshold-table-wrap {
  min-width: 0;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.threshold-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;
}

.threshold-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  line-height: 1.3;
}

.threshold-table td {
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.threshold-input {
  width: 100%;
  height: 32px;
  min-width: 0;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  box-sizing: border-box;
}

.threshold-input::placeholder {
  color: #9ca3af;
}

.threshold-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.threshold-input.error {
  border-color: #ef4444;
}

.fee-structure-form .section-title-spaced:first-of-type {
  margin-top: 8px;
}

.fee-table-wrap {
  min-width: 0;
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 4px;
}

.fee-table {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
  font-size: 12px;
}

.fee-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  line-height: 1.3;
  white-space: normal;
  min-width: 88px;
}

.fee-table td {
  padding: 8px 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  vertical-align: middle;
}

.fee-input {
  width: 100%;
  min-width: 72px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 12px;
  box-sizing: border-box;
}

.fee-input::placeholder {
  color: #9ca3af;
}

.fee-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.fee-input.error {
  border-color: #ef4444;
}

.col-check-total {
  width: 96px;
  min-width: 96px;
  text-align: center;
}

.tf-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}

.tf-switch:focus-visible .tf-switch-track {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.tf-switch-track {
  position: relative;
  width: 54px;
  height: 26px;
  background: #cbd5e1;
  border-radius: 999px;
  flex-shrink: 0;
}

.tf-switch.on .tf-switch-track {
  background: #2563eb;
}

.tf-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
  transition: left 0.2s ease;
  z-index: 2;
}

.tf-switch.on .tf-switch-knob {
  left: calc(100% - 24px);
}

.tf-switch-letter {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  z-index: 1;
  user-select: none;
}

.tf-switch-letter-t {
  left: 9px;
}

.tf-switch-letter-f {
  right: 9px;
}

.tf-switch:not(.on) .tf-switch-letter-t {
  opacity: 0;
}

.tf-switch.on .tf-switch-letter-f {
  opacity: 0;
}

.section-bar {
  width: 4px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
}

.programme-info-section {
  min-width: 0;
}

.programme-info-form {
  --pi-label-left: clamp(148px, 24%, 240px);
  --pi-label-right: clamp(148px, 24%, 240px);
  --pi-row-gap: 14px;
  --pi-field-gap: clamp(8px, 1.2vw, 12px);
  --pi-col-gap: clamp(16px, 4vw, 48px);
  min-width: 0;
  width: 100%;
}

.programme-info-form .pi-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: var(--pi-col-gap);
  row-gap: var(--pi-row-gap);
  margin-bottom: var(--pi-row-gap);
  align-items: center;
}

.programme-info-form .pi-row-full {
  grid-template-columns: minmax(0, var(--pi-label-left)) minmax(0, 1fr);
  column-gap: var(--pi-field-gap);
}

.programme-info-form .pi-row-semester,
.programme-info-form .pi-row-attachments {
  grid-template-columns: minmax(0, var(--pi-label-left)) minmax(0, 1fr);
  column-gap: var(--pi-field-gap);
}

.programme-info-form .pi-row-semester {
  align-items: center;
  margin-top: 4px;
}

.programme-info-form .pi-field {
  display: grid;
  grid-template-columns: minmax(0, var(--pi-label-left)) minmax(0, 1fr);
  column-gap: var(--pi-field-gap);
  align-items: center;
  min-width: 0;
}

.programme-info-form .pi-field:nth-child(2) {
  grid-template-columns: minmax(0, var(--pi-label-right)) minmax(0, 1fr);
}

.programme-info-form .pi-field-empty {
  visibility: hidden;
}

.programme-info-form .pi-label {
  font-size: clamp(12px, 1.2vw, 14px);
  color: #374151;
  text-align: right;
  line-height: 1.35;
  white-space: normal;
  padding-right: 2px;
  min-width: 0;
}

.programme-info-form .pi-input {
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
}

.programme-info-form .pi-input::placeholder {
  color: #9ca3af;
}

.programme-info-form .pi-input-wide {
  width: 100%;
}

.programme-info-form .pi-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.programme-info-form .pi-input.error {
  border-color: #ef4444;
}

.programme-info-form .pi-select {
  padding-right: 32px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
}

.programme-info-form .pi-field :deep(.date-picker-en) {
  width: 100%;
  min-width: 0;
}

.programme-info-form .pi-field :deep(.date-picker-input) {
  height: 36px;
  border-radius: 8px;
  border-color: #d9d9d9;
  font-size: 14px;
}

.programme-info-form .pi-radio-group {
  display: flex;
  gap: 20px;
  min-height: 36px;
  align-items: center;
  font-size: 14px;
  color: #374151;
}

.programme-info-form .pi-radio-group label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.programme-info-form .pi-radio-group input {
  accent-color: #2563eb;
}

.programme-info-form .semester-table-wrap {
  min-width: 0;
  width: 100%;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.programme-info-form .semester-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;
}

.programme-info-form .semester-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 8px 6px;
  border: 1px solid #e5e7eb;
  text-align: center;
  line-height: 1.3;
}

.programme-info-form .semester-table td {
  padding: 8px 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  text-align: center;
}

.programme-info-form .semester-input {
  width: 100%;
  height: 32px;
  min-width: 0;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  text-align: center;
  box-sizing: border-box;
  background: #fff;
}

.programme-info-form .semester-input::placeholder {
  color: #9ca3af;
}

.programme-info-form .semester-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.programme-info-form .semester-input.error {
  border-color: #ef4444;
}

.programme-info-form .pi-row-attachments {
  align-items: start;
  margin-top: 8px;
}

.programme-info-form .attachments-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.programme-info-form .attachments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.programme-info-form .attachment-card,
.programme-info-form .attachment-upload-box {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 16px 18px;
}

.programme-info-form .attachment-upload-box {
  padding-bottom: 14px;
}

.programme-info-form .attachment-delete {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  border-radius: 6px;
}

.programme-info-form .attachment-delete:hover {
  color: #ef4444;
  background: #fef2f2;
}

.programme-info-form .attachment-delete svg {
  width: 16px;
  height: 16px;
}

.programme-info-form .attachment-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-right: 36px;
}

.programme-info-form .file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.programme-info-form .file-icon-word {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

.programme-info-form .file-icon-letter {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.programme-info-form .file-icon-pdf {
  background: #fee2e2;
  color: #dc2626;
}

.programme-info-form .file-icon-image {
  background: #dcfce7;
  color: #16a34a;
}

.programme-info-form .file-icon-archive,
.programme-info-form .file-icon-file {
  background: #f3f4f6;
  color: #6b7280;
}

.programme-info-form .file-icon svg {
  width: 18px;
  height: 18px;
}

.programme-info-form .attachment-meta {
  min-width: 0;
}

.programme-info-form .attachment-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
  word-break: break-word;
  line-height: 1.4;
}

.programme-info-form .attachment-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.programme-info-form .attachment-upload-time {
  color: #9ca3af;
}

.programme-info-form .attachment-desc {
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.6;
}

.programme-info-form .attachment-desc-label {
  color: #6b7280;
  font-weight: 500;
  margin-right: 4px;
}

.programme-info-form .attachment-desc-text {
  color: #9ca3af;
}

.programme-info-form .upload-toolbar {
  margin-bottom: 12px;
}

.programme-info-form .upload-toolbar-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.programme-info-form .file-input-hidden {
  display: none;
}

.programme-info-form .upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #374151;
  flex-shrink: 0;
}

.programme-info-form .upload-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.programme-info-form .upload-btn svg {
  width: 14px;
  height: 14px;
}

.programme-info-form .upload-hint {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.programme-info-form .upload-desc-wrap {
  position: relative;
  margin-bottom: 14px;
}

.programme-info-form .upload-desc-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
}

.programme-info-form .upload-desc-input {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px 28px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  color: #374151;
}

.programme-info-form .upload-desc-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.programme-info-form .upload-char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.programme-info-form .upload-actions {
  display: flex;
  justify-content: flex-end;
}

.programme-info-form .btn-upload-confirm {
  min-width: 88px;
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
}

.form-grid {
  --form-label-w-left: clamp(148px, 24%, 240px);
  --form-label-w-right: clamp(148px, 24%, 240px);
  display: grid;
  grid-template-columns: var(--form-label-w-left) minmax(0, 1fr) var(--form-label-w-right) minmax(0, 1fr);
  column-gap: clamp(16px, 4vw, 48px);
  row-gap: 14px;
  align-items: center;
  min-width: 0;
  width: 100%;
}

.form-grid.single-col {
  grid-template-columns: minmax(0, clamp(148px, 24%, 240px)) minmax(0, 1fr);
  max-width: 100%;
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

.form-row.full {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
}

.form-row.full .form-label {
  grid-column: 1;
}

.form-row.full .full-width,
.form-row.full .semester-table-wrap {
  grid-column: 2 / -1;
}

.form-label {
  font-size: 14px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
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
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-textarea {
  width: 100%;
  min-height: 88px;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
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

.form-grid .semester-table-wrap {
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.semester-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;
}

.semester-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 8px 6px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.semester-table td {
  padding: 8px 6px;
  border: 1px solid #e5e7eb;
}

.textarea-row {
  align-items: start;
}

.textarea-row .form-label {
  padding-top: 8px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px var(--modal-pad-x) 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-footer-left,
.modal-footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-footer-left {
  min-width: 0;
}

.modal-footer-right {
  margin-left: auto;
  flex-shrink: 0;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-outline:hover {
  background: #eff6ff;
}

.publish-btn {
  gap: 8px;
  min-width: auto;
  padding: 0 14px;
}

.info-tip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.info-icon {
  width: 16px;
  height: 16px;
  border: 1px solid #2563eb;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  cursor: help;
}

.info-tooltip {
  position: absolute;
  left: calc(100% + 8px);
  bottom: calc(100% + 8px);
  width: 280px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  color: #374151;
  text-align: left;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  z-index: 2;
}

.info-tip-wrap:hover .info-tooltip,
.info-tip-wrap:focus-within .info-tooltip {
  opacity: 1;
  visibility: visible;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
