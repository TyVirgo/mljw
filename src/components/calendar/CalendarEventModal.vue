<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import DatePickerEn from '../common/DatePickerEn.vue'
import {
  holidayNameOptions,
  MAX_EVENT_REMARKS,
  validateCalendarEventForm,
  formatDisplayDateDot,
} from '../../data/calendarInfo.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  allEvents: { type: Array, default: () => [] },
  semesterRecord: { type: Object, default: null },
  defaultDate: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() => (isEditMode.value ? t('pages.calendar.editEvent') : t('pages.calendar.event')))

function createEmptyForm() {
  return {
    holidayName: '',
    startDate: '',
    endDate: '',
    remarks: '',
  }
}

watch(
  () => [props.visible, props.mode, props.initialData, props.defaultDate],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        holidayName: props.initialData.holidayName,
        startDate: props.initialData.startDate,
        endDate: props.initialData.endDate,
        remarks: props.initialData.remarks || '',
      }
    } else {
      const defaultDate = props.defaultDate || ''
      form.value = {
        holidayName: '',
        startDate: defaultDate,
        endDate: defaultDate,
        remarks: '',
      }
    }
  },
)

const remarksCount = computed(() => form.value.remarks.length)

function buildPayload() {
  return {
    holidayName: form.value.holidayName,
    startDate: form.value.startDate.trim(),
    endDate: form.value.endDate.trim(),
    remarks: form.value.remarks.trim(),
  }
}

function handleSave() {
  const payload = buildPayload()
  const validationErrors = validateCalendarEventForm(
    payload,
    props.semesterRecord,
    props.allEvents,
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
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Holiday Name:') }}</label>
            <select
              v-model="form.holidayName"
              class="form-input"
              :class="{ error: errors.holidayName, 'is-empty': !form.holidayName }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in holidayNameOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
            </select>
          </div>
          <p v-if="errors.holidayName" class="field-error">{{ tr(errors.holidayName) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Start & End Date:') }}</label>
            <div class="date-range">
              <DatePickerEn
                v-model="form.startDate"
                class="date-field"
                :has-error="!!errors.startDate || !!errors.endDate"
                :placeholder="t('common.pleaseSelectDate')"
              />
              <span class="date-separator">~</span>
              <DatePickerEn
                v-model="form.endDate"
                class="date-field"
                :has-error="!!errors.startDate || !!errors.endDate"
                :placeholder="t('common.pleaseSelectDate')"
              />
            </div>
          </div>
          <p v-if="errors.startDate" class="field-error">{{ tr(errors.startDate) }}</p>
          <p v-else-if="errors.endDate" class="field-error">{{ tr(errors.endDate) }}</p>
          <p v-if="form.startDate && form.endDate && !errors.startDate && !errors.endDate" class="date-preview">
            {{ formatDisplayDateDot(form.startDate) }} ~ {{ formatDisplayDateDot(form.endDate) }}
          </p>

          <div class="form-row form-row-top">
            <label class="form-label">{{ tr('Remarks:') }}</label>
            <div class="textarea-wrap">
              <textarea
                v-model="form.remarks"
                class="form-textarea"
                :class="{ error: errors.remarks }"
                rows="4"
                :maxlength="MAX_EVENT_REMARKS"
                :placeholder="t('common.pleaseInput')"
              />
              <span class="char-count">{{ remarksCount }}/{{ MAX_EVENT_REMARKS }}</span>
            </div>
          </div>
          <p v-if="errors.remarks" class="field-error">{{ tr(errors.remarks) }}</p>
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
  max-width: 620px;
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

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.form-row-top {
  align-items: flex-start;
}

.form-label {
  width: 140px;
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
  text-align: right;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-input {
  flex: 1;
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
}

.date-range {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.date-field {
  flex: 1;
  min-width: 0;
}

.date-separator {
  color: #6b7280;
  flex-shrink: 0;
}

.date-preview {
  margin: 0 0 12px 152px;
  font-size: 12px;
  color: #6b7280;
}

.textarea-wrap {
  flex: 1;
  position: relative;
}

.form-textarea {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px 28px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea.error {
  border-color: #ef4444;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.field-error {
  margin: 0 0 12px 152px;
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
</style>
