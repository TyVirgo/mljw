<script setup>
import { ref, watch, computed } from 'vue'
import { activeOptions, validateIntakeSetForm } from '../../data/intakeSets.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  allItems: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  code: '',
  intake: '',
  active: 'Yes',
})
const errors = ref({})

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() => (isEditMode.value ? 'Edit' : 'Create'))

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        code: props.initialData.code,
        intake: props.initialData.intake,
        active: props.initialData.active,
      }
    } else {
      form.value = {
        code: '',
        intake: '',
        active: 'Yes',
      }
    }
  },
)

function buildPayload() {
  const payload = {
    code: form.value.code.trim(),
    intake: form.value.intake.trim(),
    active: form.value.active,
  }
  if (isEditMode.value && props.initialData?.code) {
    payload.code = props.initialData.code
  }
  return payload
}

function handleSave() {
  const payload = buildPayload()
  const validationErrors = validateIntakeSetForm(
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
          <button type="button" class="modal-close" aria-label="Close" @click="handleClose">×</button>
        </div>

        <div class="modal-form">
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> Code:</label>
            <input
              v-model="form.code"
              type="text"
              class="form-input"
              :class="{ error: errors.code, 'form-input-readonly': isEditMode }"
              maxlength="2"
              placeholder="please input"
              :disabled="isEditMode"
              :readonly="isEditMode"
            />
          </div>
          <p v-if="errors.code" class="field-error">{{ errors.code }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> Intake:</label>
            <input
              v-model="form.intake"
              type="text"
              class="form-input"
              :class="{ error: errors.intake }"
              maxlength="6"
              placeholder="please input"
            />
          </div>
          <p v-if="errors.intake" class="field-error">{{ errors.intake }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> Active:</label>
            <div class="radio-group" :class="{ error: errors.active }">
              <label v-for="opt in activeOptions" :key="opt" class="radio-option">
                <input v-model="form.active" type="radio" :value="opt" />
                {{ opt }}
              </label>
            </div>
          </div>
          <p v-if="errors.active" class="field-error">{{ errors.active }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">Cancel</button>
          <button type="button" class="btn btn-primary" @click="handleSave">Submit</button>
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
  max-width: 520px;
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
  padding: 24px 20px 28px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.form-label {
  width: 72px;
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
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
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
  flex: 1;
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
  margin: 0 0 12px 84px;
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #f0f0f0;
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
