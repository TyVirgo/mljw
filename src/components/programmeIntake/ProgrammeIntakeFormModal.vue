<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  activeOptions,
  programmeIntakeSchools,
  startingSemesterOptions,
  validateProgrammeIntakeEditForm,
  getSchoolLabel,
} from '../../data/programmeIntakes.js'

const props = defineProps({
  visible: Boolean,
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const startingSemester = ref('')
const active = ref('Yes')
const errors = ref({})

const schoolLabel = computed(() => {
  if (!props.initialData?.schoolId) return props.initialData?.school || ''
  return getSchoolLabel(props.initialData.schoolId)
})

watch(
  () => [props.visible, props.initialData],
  () => {
    if (!props.visible || !props.initialData) return
    errors.value = {}
    startingSemester.value = props.initialData.startingSemester || ''
    active.value = props.initialData.active || 'Yes'
  },
)

function buildPayload() {
  const source = props.initialData
  return {
    programmeIntake: source.programmeIntake,
    intake: source.intake,
    years: source.years,
    programmeCode: source.programmeCode,
    programmeName: source.programmeName,
    schoolId: source.schoolId,
    school: source.school,
    startingSemester: startingSemester.value,
    active: active.value,
  }
}

function handleSave() {
  const payload = buildPayload()
  const validationErrors = validateProgrammeIntakeEditForm(payload)
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
    <div v-if="visible && initialData" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('common.edit') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="filter-row">
            <div class="filter-item">
              <label>{{ tr('School:') }}</label>
              <input type="text" class="filter-input filter-input-readonly" :value="schoolLabel" readonly disabled />
            </div>
            <div class="filter-item">
              <label>{{ tr('Programme:') }}</label>
              <input
                type="text"
                class="filter-input filter-input-readonly"
                :value="initialData.programmeCode"
                readonly
                disabled
              />
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ tr('Programme Intake') }}</th>
                  <th>{{ tr('Programme Code') }}</th>
                  <th>{{ tr('Programme') }}</th>
                  <th>{{ tr('Years') }}</th>
                  <th>{{ tr('School') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{{ initialData.programmeIntake }}</td>
                  <td>{{ initialData.programmeCode }}</td>
                  <td>{{ initialData.programmeName }}</td>
                  <td>{{ initialData.years }}</td>
                  <td>{{ initialData.school }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bottom-form">
            <div class="bottom-form-fields">
              <div class="form-field">
                <label class="form-label"><span class="required">*</span> {{ tr('Intake:') }}</label>
                <div class="form-field-control">
                  <input
                    type="text"
                    class="form-input form-input-readonly"
                    :value="initialData.intake"
                    readonly
                    disabled
                  />
                </div>
              </div>

              <div class="form-field">
                <label class="form-label"><span class="required">*</span> {{ tr('Starting Academic Session:') }}</label>
                <div class="form-field-control">
                  <select
                    v-model="startingSemester"
                    class="form-input"
                    :class="{ error: errors.startingSemester, 'is-empty': !startingSemester }"
                  >
                    <option value="">{{ t('common.pleaseSelect') }}</option>
                    <option v-for="opt in startingSemesterOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <p v-if="errors.startingSemester" class="field-error">{{ tr(errors.startingSemester) }}</p>
                  <p class="form-note">{{ t('modal.intakeFormNote') }}</p>
                </div>
              </div>
            </div>

            <div class="form-row">
              <label class="form-label"><span class="required">*</span> {{ tr('Active:') }}</label>
              <div class="radio-group" :class="{ error: errors.active }">
                <label v-for="opt in activeOptions" :key="opt" class="radio-option">
                  <input v-model="active" type="radio" :value="opt" />
                  {{ tr(opt) }}
                </label>
              </div>
            </div>
            <p v-if="errors.active" class="field-error">{{ tr(errors.active) }}</p>

            <p class="remark-note">{{ t('modal.intakeEditNote') }}</p>
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
  max-width: 920px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
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

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 12px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.filter-input {
  width: 220px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  background: #fff;
}

.filter-input-readonly:disabled,
.filter-input-readonly[readonly] {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.table-wrap {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: auto;
}

.data-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
}

.bottom-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.bottom-form-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
  margin-bottom: 8px;
}

.form-field {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 320px;
}

.form-field .form-label {
  width: auto;
  padding-top: 7px;
  line-height: 18px;
}

.form-field-control {
  flex: 1;
  min-width: 0;
  max-width: 240px;
}

.form-field .form-input {
  width: 100%;
}

.form-field .field-error {
  margin: 4px 0 0;
}

.form-field .form-note {
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.form-label {
  width: 180px;
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-input {
  width: 280px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  background: #fff;
}

.form-input.is-empty {
  color: #9ca3af;
}

.form-input.error {
  border-color: #ef4444;
}

.form-input-readonly:disabled,
.form-input-readonly[readonly] {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.radio-group {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 32px;
}

.radio-group.error {
  outline: 1px solid #ef4444;
  outline-offset: 2px;
  border-radius: 4px;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.field-error {
  margin: 0 0 10px 192px;
  font-size: 12px;
  color: #ef4444;
}

.remark-note {
  margin: 12px 0 0 192px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
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

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
