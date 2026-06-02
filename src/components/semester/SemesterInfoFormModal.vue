<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import DatePickerEn from '../common/DatePickerEn.vue'
import YnSwitch from '../common/YnSwitch.vue'
import {
  semesterTypeOptions,
  weekStartDayOptions,
  validateSemesterForm,
} from '../../data/semesterInfo.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  allItems: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() =>
  isEditMode.value ? t('pages.semester.editTitle') : t('pages.semester.createTitle'),
)

function createEmptyForm() {
  return {
    academicYear: '',
    semester: '',
    semesterType: '',
    startDate: '',
    endDate: '',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  }
}

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        academicYear: props.initialData.academicYear,
        semester: props.initialData.semester,
        semesterType: props.initialData.semesterType,
        startDate: props.initialData.startDate,
        endDate: props.initialData.endDate,
        currentSemester: props.initialData.currentSemester,
        generateCalendar: props.initialData.generateCalendar || 'No',
        weekStartDay: props.initialData.weekStartDay || 'Sunday',
      }
    } else {
      form.value = createEmptyForm()
    }
  },
)

const currentSemesterOn = computed({
  get: () => form.value.currentSemester === 'Yes',
  set: (value) => {
    form.value.currentSemester = value ? 'Yes' : 'No'
  },
})

const generateCalendarOn = computed({
  get: () => form.value.generateCalendar === 'Yes',
  set: (value) => {
    form.value.generateCalendar = value ? 'Yes' : 'No'
  },
})

function buildPayload() {
  return {
    academicYear: form.value.academicYear.trim(),
    semester: form.value.semester.trim(),
    semesterType: form.value.semesterType,
    startDate: form.value.startDate.trim(),
    endDate: form.value.endDate.trim(),
    currentSemester: form.value.currentSemester,
    generateCalendar: form.value.generateCalendar,
    weekStartDay: form.value.weekStartDay,
  }
}

function handleSave() {
  const payload = buildPayload()
  const validationErrors = validateSemesterForm(
    payload,
    props.allItems,
    isEditMode.value ? props.initialData?.id : null,
  )
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return
  emit('save', payload)
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

        <div class="modal-form">
          <div class="form-grid">
            <div class="form-item">
              <label class="form-label"><span class="required">*</span> {{ tr('Academic Year:') }}</label>
              <input
                v-model="form.academicYear"
                type="text"
                class="form-input"
                :class="{ error: errors.academicYear }"
                maxlength="4"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.academicYear" class="field-error">{{ tr(errors.academicYear) }}</p>
            </div>

            <div class="form-item">
              <label class="form-label"><span class="required">*</span> {{ tr('Semester:') }}</label>
              <input
                v-model="form.semester"
                type="text"
                class="form-input"
                :class="{ error: errors.semester }"
                maxlength="2"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.semester" class="field-error">{{ tr(errors.semester) }}</p>
            </div>

            <div class="form-item">
              <label class="form-label"><span class="required">*</span> {{ tr('Semester Type:') }}</label>
              <select
                v-model="form.semesterType"
                class="form-input"
                :class="{ error: errors.semesterType, 'is-empty': !form.semesterType }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in semesterTypeOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
              <p v-if="errors.semesterType" class="field-error">{{ tr(errors.semesterType) }}</p>
            </div>

            <div class="form-item">
              <label class="form-label"><span class="required">*</span> {{ tr('Start Date:') }}</label>
              <DatePickerEn
                v-model="form.startDate"
                class="date-field"
                :has-error="!!errors.startDate"
                :placeholder="t('common.pleaseSelectDate')"
              />
              <p v-if="errors.startDate" class="field-error">{{ tr(errors.startDate) }}</p>
            </div>

            <div class="form-item">
              <label class="form-label"><span class="required">*</span> {{ tr('End Date:') }}</label>
              <DatePickerEn
                v-model="form.endDate"
                class="date-field"
                :has-error="!!errors.endDate"
                :placeholder="t('common.pleaseSelectDate')"
              />
              <p v-if="errors.endDate" class="field-error">{{ tr(errors.endDate) }}</p>
            </div>

            <div class="form-item">
              <label class="form-label"><span class="required">*</span> {{ tr('Current Semester:') }}</label>
              <div class="switch-wrap">
                <YnSwitch v-model="currentSemesterOn" />
                <span class="switch-label">{{ currentSemesterOn ? tr('Yes') : tr('No') }}</span>
              </div>
              <p v-if="errors.currentSemester" class="field-error">{{ tr(errors.currentSemester) }}</p>
            </div>

            <div class="form-item">
              <label class="form-label">{{ tr('Generate Academic Calendar:') }}</label>
              <div class="switch-wrap">
                <YnSwitch v-model="generateCalendarOn" />
                <span class="switch-label">{{ generateCalendarOn ? tr('Yes') : tr('No') }}</span>
              </div>
              <p v-if="errors.generateCalendar" class="field-error">{{ tr(errors.generateCalendar) }}</p>
            </div>

            <div class="form-item">
              <label class="form-label"><span class="required">*</span> {{ tr('Week Start Day:') }}</label>
              <select
                v-model="form.weekStartDay"
                class="form-input"
                :class="{ error: errors.weekStartDay, 'is-empty': !form.weekStartDay }"
              >
                <option v-for="opt in weekStartDayOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
              <p v-if="errors.weekStartDay" class="field-error">{{ tr(errors.weekStartDay) }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.confirm') }}</button>
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
  max-width: 760px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #6b7280;
}

.modal-form {
  padding: 24px 20px 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;
}

.form-item {
  min-width: 0;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
}

.form-input.is-empty {
  color: #9ca3af;
}

.form-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.12);
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.date-field {
  width: 100%;
}

.switch-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
}

.switch-label {
  font-size: 13px;
  color: #374151;
}

.field-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px 20px;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #fff;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
