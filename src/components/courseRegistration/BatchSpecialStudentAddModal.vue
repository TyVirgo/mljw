<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { addBatchSpecialStudent } from '../../data/courseRegistration/batchStudentRoster.js'
import BatchSpecialStudentPickModal from './BatchSpecialStudentPickModal.vue'

const props = defineProps({
  visible: Boolean,
  batchId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const form = ref(emptyForm())
const formError = ref('')
const pickerOpen = ref(false)

function emptyForm() {
  return {
    studentId: '',
    studentName: '',
    programme: '',
    intake: '',
    faculty: '',
    selectable: true,
    remark: '',
  }
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    form.value = emptyForm()
    formError.value = ''
    pickerOpen.value = false
  },
)

const selectedLabel = computed(() => {
  if (!form.value.studentId) return ''
  return `${form.value.studentName}（${form.value.studentId}）`
})

function openPicker() {
  pickerOpen.value = true
}

function onPickStudent(row) {
  form.value.studentId = row.studentId
  form.value.studentName = row.studentName
  form.value.programme = row.programme
  form.value.intake = row.intake
  form.value.faculty = row.faculty
  formError.value = ''
}

function handleConfirm() {
  if (!form.value.studentId) {
    formError.value = t('courseRegistration.batch.specialStudentRequired')
    return
  }
  const result = addBatchSpecialStudent(props.batchId, {
    studentId: form.value.studentId,
    studentName: form.value.studentName,
    programme: form.value.programme,
    intake: form.value.intake,
    faculty: form.value.faculty,
    selectable: form.value.selectable,
    remark: form.value.remark,
  })
  if (!result.ok) {
    formError.value = t(result.errorKey)
    return
  }
  emit('saved', result.item)
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ t('courseRegistration.batch.specialAddTitle') }}</h3>
        <button type="button" class="icon-close" :aria-label="t('common.close')" @click="emit('close')">
          ×
        </button>
      </div>

      <div class="modal-body">
        <div class="form-row">
          <label class="field-label">
            {{ t('courseRegistration.monitor.studentName') }}
            <span class="req">*</span>
          </label>
          <div class="field-control with-btn">
            <input
              type="text"
              class="form-input"
              readonly
              :value="selectedLabel"
              :placeholder="t('courseRegistration.batch.specialPickPlaceholder')"
            />
            <button type="button" class="btn btn-default" @click="openPicker">
              {{ t('studentSelect.selectButton') }}
            </button>
          </div>
        </div>

        <div class="form-row">
          <label class="field-label">
            {{ t('courseRegistration.batch.specialSelectable') }}
            <span class="req">*</span>
          </label>
          <div class="field-control radio-row">
            <label class="radio-option">
              <input v-model="form.selectable" type="radio" :value="true" />
              <span>{{ t('common.yes') }}</span>
            </label>
            <label class="radio-option">
              <input v-model="form.selectable" type="radio" :value="false" />
              <span>{{ t('common.no') }}</span>
            </label>
          </div>
        </div>

        <div class="form-row">
          <label class="field-label">{{ t('courseRegistration.batch.specialRemark') }}</label>
          <div class="field-control">
            <input v-model="form.remark" type="text" class="form-input" />
          </div>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-default" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-primary" @click="handleConfirm">
          {{ t('common.confirm') }}
        </button>
      </div>
    </div>

    <BatchSpecialStudentPickModal
      :visible="pickerOpen"
      :batch-id="batchId"
      @close="pickerOpen = false"
      @select="onPickStudent"
    />
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal-panel {
  width: min(520px, 96vw);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.icon-close {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}
.modal-body {
  padding: 18px;
  overflow: auto;
}
.form-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 10px 12px;
  align-items: center;
  margin-bottom: 14px;
}
.field-label {
  font-size: 13px;
  color: #374151;
  text-align: right;
}
.req {
  color: #dc2626;
  margin-left: 2px;
}
.field-control.with-btn {
  display: flex;
  gap: 8px;
}
.form-input {
  flex: 1;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
}
.form-input::placeholder {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 400;
}
.form-input[readonly] {
  cursor: pointer;
  background: #fff;
}
.radio-row {
  display: flex;
  gap: 16px;
}
.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}
.form-error {
  margin: 0;
  color: #dc2626;
  font-size: 13px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
