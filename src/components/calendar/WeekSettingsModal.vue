<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import DatePickerEn from '../common/DatePickerEn.vue'
import {
  createEmptyWeekSettings,
  normalizeWeekSettings,
  validateWeekSettingsForm,
  formatDisplayDateDot,
  weekPeriodDefinitions,
  findSemesterRecordByKey,
  loadWeekSettingsForSemester,
  resolveWeekSettingsForSemester,
} from '../../data/calendarInfo.js'
import { initialSemesterRecords } from '../../data/semesterInfo.js'

const props = defineProps({
  visible: Boolean,
  /** 当前校历页已选中的学期 */
  currentSemesterKey: { type: String, default: '' },
  /** 当前校历页草稿中的时段设置 */
  initialData: { type: Object, default: null },
  semesterOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const selectedSemesterKey = ref('')
const form = ref(createEmptyWeekSettings())
const errors = ref({})

const selectedSemesterRecord = computed(() =>
  findSemesterRecordByKey(selectedSemesterKey.value, initialSemesterRecords),
)

const teachingPreview = computed(() => {
  if (!form.value.teachingWeekStart || !form.value.teachingWeekEnd) return ''
  if (errors.value.teachingWeekStart || errors.value.teachingWeekEnd) return ''
  return `${formatDisplayDateDot(form.value.teachingWeekStart)} ~ ${formatDisplayDateDot(form.value.teachingWeekEnd)}`
})

function fillTeachingDefaults(settings, semesterRecord) {
  const key = semesterRecord
    ? `${semesterRecord.academicYear}/${semesterRecord.semester}`
    : ''
  return resolveWeekSettingsForSemester(key, settings)
}

function loadFormForSemester(semesterKey) {
  errors.value = {}
  if (!semesterKey) {
    form.value = createEmptyWeekSettings()
    return
  }

  const record = findSemesterRecordByKey(semesterKey, initialSemesterRecords)
  if (semesterKey === props.currentSemesterKey) {
    form.value = fillTeachingDefaults(props.initialData, record)
    return
  }

  form.value = fillTeachingDefaults(loadWeekSettingsForSemester(semesterKey), record)
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedSemesterKey.value = props.currentSemesterKey || props.semesterOptions[0]?.key || ''
    loadFormForSemester(selectedSemesterKey.value)
  },
)

function handleSemesterChange() {
  loadFormForSemester(selectedSemesterKey.value)
}

function fieldError(...keys) {
  return keys.some((key) => errors.value[key])
}

function handleSave() {
  if (!selectedSemesterKey.value) {
    errors.value = { semesterKey: 'Academic Year & Semester is required' }
    return
  }
  const payload = normalizeWeekSettings(form.value)
  const validationErrors = validateWeekSettingsForm(payload, selectedSemesterRecord.value)
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return
  emit('save', {
    semesterKey: selectedSemesterKey.value,
    weekSettings: payload,
  })
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
          <h2 class="modal-title">{{ t('pages.calendar.weekSettings') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-form">
          <p class="form-hint">{{ t('pages.calendar.weekSettingsHint') }}</p>

          <div class="semester-section">
            <div class="form-row">
              <label class="form-label">
                <span class="required">*</span> {{ tr('Academic Session:') }}
              </label>
              <select
                v-model="selectedSemesterKey"
                class="form-input"
                :class="{
                  error: !!errors.semesterKey,
                  'is-empty': !selectedSemesterKey,
                }"
                @change="handleSemesterChange"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in semesterOptions" :key="opt.key" :value="opt.key">
                  {{ opt.key }}
                </option>
              </select>
            </div>
            <p v-if="errors.semesterKey" class="field-error">{{ tr(errors.semesterKey) }}</p>
          </div>

          <div class="periods-section">
            <div class="form-row">
              <label class="form-label">
                <span class="required">*</span> {{ tr('Teaching Weeks:') }}
              </label>
              <div class="date-range">
                <DatePickerEn
                  v-model="form.teachingWeekStart"
                  class="date-field"
                  :has-error="fieldError('teachingWeekStart', 'teachingWeekEnd')"
                  :placeholder="t('common.pleaseSelectDate')"
                />
                <span class="date-separator">~</span>
                <DatePickerEn
                  v-model="form.teachingWeekEnd"
                  class="date-field"
                  :has-error="fieldError('teachingWeekStart', 'teachingWeekEnd')"
                  :placeholder="t('common.pleaseSelectDate')"
                />
              </div>
            </div>
            <p v-if="errors.teachingWeekStart" class="field-error">{{ tr(errors.teachingWeekStart) }}</p>
            <p v-else-if="errors.teachingWeekEnd" class="field-error">{{ tr(errors.teachingWeekEnd) }}</p>
            <p v-else-if="teachingPreview" class="date-preview">{{ teachingPreview }}</p>
            <p class="field-tip">{{ t('pages.calendar.teachingWeekAlignTip') }}</p>

            <div
              v-for="def in weekPeriodDefinitions"
              :key="def.key"
              class="period-block"
            >
              <div class="form-row">
                <label class="form-label period-label">
                  <span
                    class="period-swatch"
                    :class="`marker-${def.marker}`"
                    :style="{ '--swatch-color': def.color }"
                  />
                  {{ tr(def.labelKey) }}:
                </label>

                <div class="date-range">
                  <DatePickerEn
                    v-model="form[def.startField]"
                    class="date-field"
                    :has-error="fieldError(def.startField, def.endField)"
                    :placeholder="t('common.pleaseSelectDate')"
                  />
                  <span class="date-separator">~</span>
                  <DatePickerEn
                    v-model="form[def.endField]"
                    class="date-field"
                    :has-error="fieldError(def.startField, def.endField)"
                    :placeholder="t('common.pleaseSelectDate')"
                  />
                </div>
              </div>
              <p v-if="errors[def.startField]" class="field-error">{{ tr(errors[def.startField]) }}</p>
              <p v-else-if="errors[def.endField]" class="field-error">{{ tr(errors[def.endField]) }}</p>
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
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  overflow-y: auto;
  box-sizing: border-box;
}

.modal-panel {
  width: 100%;
  max-width: 680px;
  margin: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: visible;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 8px 8px 0 0;
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
  background: none;
  border: none;
  cursor: pointer;
}

.modal-form {
  padding: 20px 20px 24px;
  overflow: visible;
  position: relative;
  z-index: 2;
}

.form-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.semester-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.semester-section .form-row {
  margin-bottom: 0;
}

.semester-section .field-error {
  margin-top: 8px;
  margin-bottom: 0;
}

.periods-section :deep(.date-picker-en.open) {
  z-index: 5;
}

.periods-section :deep(.date-picker-panel) {
  z-index: 6;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.form-label {
  width: 148px;
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
  text-align: right;
}

.period-label {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
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
  margin: -4px 0 8px 160px;
  font-size: 12px;
  color: #6b7280;
}

.field-tip {
  margin: -4px 0 12px 160px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.45;
}

.field-error {
  margin: -4px 0 12px 160px;
  font-size: 12px;
  color: #ef4444;
}

.period-block {
  margin-bottom: 0;
}

.period-swatch {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.period-swatch.marker-circle-outline {
  border-radius: 50%;
  border: 2px solid var(--swatch-color);
  background: #fff;
}

.period-swatch.marker-circle-solid {
  border-radius: 50%;
  background: var(--swatch-color);
}

.period-swatch.marker-square {
  border-radius: 2px;
  background: var(--swatch-color);
  border: 1px solid #d1d5db;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px 20px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  border-radius: 0 0 8px 8px;
  position: relative;
  z-index: 1;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
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
