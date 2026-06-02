<script setup>
import { ref, computed, watch } from 'vue'
import {
  activeOptions,
  getActiveIntakeOptions,
  startingSemesterOptions,
  validateProgrammeIntakeCopyForm,
  buildProgrammeIntakeCopyRecords,
  suggestProgrammeIntake,
} from '../../data/programmeIntakes.js'

const props = defineProps({
  visible: Boolean,
  sourceRecords: { type: Array, default: () => [] },
  allItems: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'confirm'])

const intake = ref('')
const startingSemester = ref('')
const active = ref('Yes')
const errors = ref({})

const activeIntakeOptions = getActiveIntakeOptions()

const previewRows = computed(() =>
  props.sourceRecords.map((source) => ({
    ...source,
    newProgrammeIntake: suggestProgrammeIntake(intake.value, source.programmeCode),
  })),
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    errors.value = {}
    const sources = props.sourceRecords
    if (!sources.length) {
      intake.value = ''
      startingSemester.value = ''
      active.value = 'Yes'
      return
    }
    const first = sources[0]
    const sameIntake = sources.every((item) => item.intake === first.intake)
    const sameSemester = sources.every((item) => item.startingSemester === first.startingSemester)
    const sameActive = sources.every((item) => item.active === first.active)
    intake.value = sameIntake ? first.intake : ''
    startingSemester.value = sameSemester ? first.startingSemester || '' : ''
    active.value = sameActive ? first.active : 'Yes'
  },
)

function handleConfirm() {
  const validationErrors = validateProgrammeIntakeCopyForm({
    sourceRecords: props.sourceRecords,
    intake: intake.value,
    startingSemester: startingSemester.value,
    active: active.value,
  })
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return

  const { records, duplicates } = buildProgrammeIntakeCopyRecords(
    props.sourceRecords,
    intake.value,
    startingSemester.value,
    active.value,
    props.allItems,
  )

  if (!records.length) {
    errors.value = {
      intake: duplicates.length
        ? `Programme Intake already exists: ${duplicates.join(', ')}`
        : 'No records can be created',
    }
    return
  }

  if (duplicates.length) {
    window.alert(`Skipped duplicate Programme Intake code(s): ${duplicates.join(', ')}`)
  }

  emit('confirm', records)
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
          <h2 class="modal-title">Copy</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p class="section-title">Selected Records ({{ sourceRecords.length }})</p>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Programme Intake</th>
                  <th>Programme Code</th>
                  <th>Programme</th>
                  <th>Years</th>
                  <th>School</th>
                  <th>New Programme Intake</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in previewRows" :key="item.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.programmeIntake }}</td>
                  <td>{{ item.programmeCode }}</td>
                  <td>{{ item.programmeName }}</td>
                  <td>{{ item.years }}</td>
                  <td>{{ item.school }}</td>
                  <td>{{ item.newProgrammeIntake || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="errors.sources" class="inline-error">{{ errors.sources }}</p>

          <div class="batch-form">
            <p class="section-title">Batch Information</p>
            <p class="section-tip">Programme association will be retained. Update batch fields below.</p>

            <div class="form-row">
              <label class="form-label"><span class="required">*</span> Intake:</label>
              <select v-model="intake" class="form-input" :class="{ error: errors.intake, 'is-empty': !intake }">
                <option value="">please select</option>
                <option v-for="opt in activeIntakeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <p v-if="errors.intake" class="field-error">{{ errors.intake }}</p>

            <div class="form-row">
              <label class="form-label"><span class="required">*</span> Starting Semester:</label>
              <select
                v-model="startingSemester"
                class="form-input"
                :class="{ error: errors.startingSemester, 'is-empty': !startingSemester }"
              >
                <option value="">please select</option>
                <option v-for="opt in startingSemesterOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <p v-if="errors.startingSemester" class="field-error">{{ errors.startingSemester }}</p>
            <p class="form-note">Note: Data is taken from the academic year and semester information table.</p>

            <div class="form-row">
              <label class="form-label"><span class="required">*</span> Active:</label>
              <div class="radio-group" :class="{ error: errors.active }">
                <label v-for="opt in activeOptions" :key="opt" class="radio-option">
                  <input v-model="active" type="radio" :value="opt" />
                  {{ opt }}
                </label>
              </div>
            </div>
            <p v-if="errors.active" class="field-error">{{ errors.active }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">Cancel</button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">Confirm</button>
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

.section-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.section-tip {
  margin: 0 0 12px;
  font-size: 12px;
  color: #6b7280;
}

.table-wrap {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: auto;
  max-height: 220px;
  margin-bottom: 16px;
}

.data-table {
  width: 100%;
  min-width: 820px;
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
  position: sticky;
  top: 0;
  z-index: 1;
}

.inline-error {
  margin: 0 0 8px;
  font-size: 12px;
  color: #ef4444;
}

.batch-form {
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.form-label {
  width: 132px;
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

.field-error {
  margin: 0 0 10px 144px;
  font-size: 12px;
  color: #ef4444;
}

.form-note {
  margin: 0 0 12px 144px;
  font-size: 12px;
  color: #9ca3af;
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
