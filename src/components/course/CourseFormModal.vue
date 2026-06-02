<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  courseClassificationOptions,
  mediumOfInstructionOptions,
  getOfferingOptions,
  courseOwnerOptions,
  validateCourseForm,
  buildCoursePayload,
} from '../../data/courses.js'
import { initialDepartments } from '../../data/departments.js'
import { semesterTypeOptions } from '../../data/semesterInfo.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  allCourses: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})
const activeTab = ref('general')

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() =>
  isEditMode.value ? tr('Edit Course') : tr('Create Course'),
)
const offeringOptions = computed(() => getOfferingOptions(initialDepartments))

function createEmptyForm() {
  return {
    courseCode: '',
    courseName: '',
    offering: '',
    courseOwner: '',
    courseClassification: '',
    credit: '',
    mediumOfInstruction: '',
    semesterType: '',
  }
}

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    activeTab.value = 'general'
    if (isEditMode.value && props.initialData) {
      form.value = {
        courseCode: props.initialData.courseCode,
        courseName: props.initialData.courseName,
        offering: props.initialData.offering,
        courseOwner: props.initialData.courseOwner,
        courseClassification: props.initialData.courseClassification,
        credit: String(props.initialData.credit ?? ''),
        mediumOfInstruction: props.initialData.mediumOfInstruction,
        semesterType: props.initialData.semesterType,
      }
    } else {
      form.value = createEmptyForm()
    }
  },
)

function handleSave() {
  const validationErrors = validateCourseForm(
    form.value,
    props.allCourses,
    isEditMode.value ? props.initialData?.id : null,
  )
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return
  emit('save', buildCoursePayload(form.value))
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
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

        <div class="tab-bar">
          <button type="button" class="tab-btn active">{{ tr('General Information') }}</button>
        </div>

        <div v-if="activeTab === 'general'" class="modal-form">
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Course Code:') }}</label>
            <input
              v-model="form.courseCode"
              type="text"
              class="form-input"
              :class="{ error: errors.courseCode, 'form-input-readonly': isEditMode }"
              maxlength="20"
              :placeholder="t('common.pleaseInput')"
              :disabled="isEditMode"
              :readonly="isEditMode"
            />
          </div>
          <p v-if="errors.courseCode" class="field-error">{{ tr(errors.courseCode) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Course Name:') }}</label>
            <input
              v-model="form.courseName"
              type="text"
              class="form-input"
              :class="{ error: errors.courseName }"
              maxlength="200"
              :placeholder="t('common.pleaseInput')"
            />
          </div>
          <p v-if="errors.courseName" class="field-error">{{ tr(errors.courseName) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Offering Unit:') }}</label>
            <select v-model="form.offering" class="form-select" :class="{ error: errors.offering, 'is-empty': !form.offering }">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in offeringOptions" :key="opt.code" :value="opt.code">{{ opt.nameEn }}</option>
            </select>
          </div>
          <p v-if="errors.offering" class="field-error">{{ tr(errors.offering) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Course Owner:') }}</label>
            <select
              v-model="form.courseOwner"
              class="form-select"
              :class="{ error: errors.courseOwner, 'is-empty': !form.courseOwner }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in courseOwnerOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
            </select>
          </div>
          <p v-if="errors.courseOwner" class="field-error">{{ tr(errors.courseOwner) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Course Classification:') }}</label>
            <select
              v-model="form.courseClassification"
              class="form-select"
              :class="{ error: errors.courseClassification, 'is-empty': !form.courseClassification }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in courseClassificationOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
            </select>
          </div>
          <p v-if="errors.courseClassification" class="field-error">{{ tr(errors.courseClassification) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Credit:') }}</label>
            <input
              v-model="form.credit"
              type="number"
              min="1"
              step="1"
              class="form-input form-input-short"
              :class="{ error: errors.credit }"
              :placeholder="t('common.pleaseInput')"
            />
          </div>
          <p v-if="errors.credit" class="field-error">{{ tr(errors.credit) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Medium of Instruction:') }}</label>
            <select
              v-model="form.mediumOfInstruction"
              class="form-select"
              :class="{ error: errors.mediumOfInstruction, 'is-empty': !form.mediumOfInstruction }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in mediumOfInstructionOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
            </select>
          </div>
          <p v-if="errors.mediumOfInstruction" class="field-error">{{ tr(errors.mediumOfInstruction) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Semester Type:') }}</label>
            <select
              v-model="form.semesterType"
              class="form-select"
              :class="{ error: errors.semesterType, 'is-empty': !form.semesterType }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in semesterTypeOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
            </select>
          </div>
          <p v-if="errors.semesterType" class="field-error">{{ tr(errors.semesterType) }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.submit') }}</button>
        </div>
      </div>
    </div>
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
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
}

.tab-bar {
  display: flex;
  gap: 0;
  padding: 0 24px;
  border-bottom: 1px solid #f3f4f6;
}

.tab-btn {
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
}

.modal-form {
  padding: 20px 24px;
  overflow: auto;
}

.form-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.form-label {
  font-size: 13px;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input-short {
  max-width: 160px;
}

.form-input.error,
.form-select.error {
  border-color: #ef4444;
}

.form-input-readonly,
.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
}

.form-select.is-empty {
  color: #9ca3af;
}

.field-error {
  margin: 0 0 12px 192px;
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}
</style>
