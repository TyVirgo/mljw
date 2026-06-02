<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import YnSwitch from '../common/YnSwitch.vue'
import { validateSemesterMasterForm } from '../../data/semesters.js'

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
  isEditMode.value ? t('pages.semester.editSemesterSetting') : t('pages.semester.createSemesterSetting'),
)

function createEmptyForm() {
  return {
    code: '',
    name: '',
    activation: 'No',
  }
}

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        code: props.initialData.code,
        name: props.initialData.name,
        activation: props.initialData.activation,
      }
    } else {
      form.value = createEmptyForm()
    }
  },
)

const activationOn = computed({
  get: () => form.value.activation === 'Yes',
  set: (value) => {
    form.value.activation = value ? 'Yes' : 'No'
  },
})

function buildPayload() {
  return {
    code: form.value.code.trim(),
    name: form.value.name.trim(),
    activation: form.value.activation,
  }
}

function handleSave() {
  const payload = buildPayload()
  const validationErrors = validateSemesterMasterForm(
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
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Semester Code:') }}</label>
            <input
              v-model="form.code"
              type="text"
              class="form-input"
              :class="{ error: errors.code, 'form-input-readonly': isEditMode }"
              maxlength="10"
              :placeholder="t('common.pleaseInput')"
              :disabled="isEditMode"
              :readonly="isEditMode"
            />
          </div>
          <p v-if="errors.code" class="field-error">{{ tr(errors.code) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Semester:') }}</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ error: errors.name }"
              maxlength="20"
              :placeholder="t('common.pleaseInput')"
            />
          </div>
          <p v-if="errors.name" class="field-error">{{ tr(errors.name) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Activation:') }}</label>
            <div class="switch-wrap">
              <YnSwitch v-model="activationOn" />
              <span class="switch-label">{{ activationOn ? tr('Yes') : tr('No') }}</span>
            </div>
          </div>
          <p v-if="errors.activation" class="field-error">{{ tr(errors.activation) }}</p>
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
  padding: 24px 20px 8px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.form-label {
  width: 160px;
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

.form-input-readonly,
.form-input:disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
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

.switch-wrap {
  flex: 1;
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
  margin: 0 0 12px 172px;
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
