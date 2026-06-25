<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createEmptyConsentForm,
  movementTypeKeys,
  consentFormStudentTypes,
  validateConsentFormForm,
} from '../../data/consentForms.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyConsentForm())
const errors = ref({})
const studentFileInputRef = ref(null)
const parentFileInputRef = ref(null)

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() =>
  isEditMode.value ? t('consentForm.form.editTitle') : t('consentForm.form.createTitle'),
)

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        formName: props.initialData.formName || '',
        movementType: props.initialData.movementType || '',
        studentType: props.initialData.studentType || '',
        remark: props.initialData.remark || '',
        studentConsentFile: props.initialData.studentConsentFile
          ? { ...props.initialData.studentConsentFile }
          : null,
        parentConsentFile: props.initialData.parentConsentFile
          ? { ...props.initialData.parentConsentFile }
          : null,
      }
    } else {
      form.value = createEmptyConsentForm()
    }
  },
)

function fieldError(key) {
  return errors.value[key] ? 'is-error' : ''
}

function studentTypeLabel(type) {
  const key = `consentForm.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
}

function onStudentFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  form.value.studentConsentFile = { fileName: file.name, size: file.size }
  delete errors.value.studentConsentFile
}

function onParentFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    form.value.parentConsentFile = null
    return
  }
  form.value.parentConsentFile = { fileName: file.name, size: file.size }
}

function clearParentFile() {
  form.value.parentConsentFile = null
  if (parentFileInputRef.value) parentFileInputRef.value.value = ''
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  const result = validateConsentFormForm(form.value, props.initialData?.id ?? null)
  errors.value = result.errors
  if (!result.valid) return
  emit('save', { ...form.value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="form-stack">
            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.formName') }}</label>
              <input
                v-model="form.formName"
                type="text"
                :class="['control-input', fieldError('formName')]"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.formName" class="field-error">{{ tr(errors.formName) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.movementType') }}</label>
              <select
                v-model="form.movementType"
                :class="['control-input', fieldError('movementType'), { 'is-empty': !form.movementType }]"
                :disabled="isEditMode"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="key in movementTypeKeys" :key="key" :value="key">
                  {{ t(`consentForm.movementType.${key}`) }}
                </option>
              </select>
              <p v-if="errors.movementType" class="field-error">{{ tr(errors.movementType) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.studentType') }}</label>
              <select
                v-model="form.studentType"
                :class="['control-input', fieldError('studentType'), { 'is-empty': !form.studentType }]"
                :disabled="isEditMode"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in consentFormStudentTypes" :key="opt" :value="opt">
                  {{ studentTypeLabel(opt) }}
                </option>
              </select>
              <p v-if="errors.studentType" class="field-error">{{ tr(errors.studentType) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label">{{ t('consentForm.fields.remark') }}</label>
              <textarea v-model="form.remark" rows="3" class="control-textarea" :placeholder="t('common.pleaseInput')" />
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.studentConsent') }}</label>
              <div class="upload-row">
                <button type="button" class="btn btn-upload" @click="studentFileInputRef?.click()">
                  ↑ Upload
                </button>
                <span class="file-name">
                  {{ form.studentConsentFile?.fileName || t('consentForm.fields.noFileSelected') }}
                </span>
                <input ref="studentFileInputRef" type="file" class="hidden-file" @change="onStudentFileChange" />
              </div>
              <p class="hint-text">{{ t('consentForm.fields.uploadHint') }}</p>
              <p v-if="errors.studentConsentFile" class="field-error">{{ tr(errors.studentConsentFile) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label">{{ t('consentForm.fields.parentConsent') }}</label>
              <div class="upload-row">
                <button type="button" class="btn btn-upload" @click="parentFileInputRef?.click()">
                  ↑ Upload
                </button>
                <span class="file-name">
                  {{ form.parentConsentFile?.fileName || t('consentForm.fields.noFileSelected') }}
                </span>
                <button
                  v-if="form.parentConsentFile"
                  type="button"
                  class="link-btn"
                  @click="clearParentFile"
                >
                  {{ t('common.delete') }}
                </button>
                <input ref="parentFileInputRef" type="file" class="hidden-file" @change="onParentFileChange" />
              </div>
              <p class="hint-text">{{ t('consentForm.fields.uploadHint') }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
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
  max-width: 560px;
  max-height: 92vh;
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
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title { margin: 0; font-size: 16px; font-weight: 600; }
.modal-close { border: none; background: transparent; font-size: 22px; color: #6b7280; cursor: pointer; }
.modal-body { padding: 20px; overflow-y: auto; }
.form-stack { display: flex; flex-direction: column; gap: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; font-weight: 500; color: #374151; }
.field-label.required::before { content: '* '; color: #ef4444; }
.control-input, .control-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
}
.control-input { height: 32px; padding: 0 10px; }
.control-input.is-empty { color: #9ca3af; }
.control-input:disabled { background: #f9fafb; color: #6b7280; }
.control-input.is-error { border-color: #ef4444; }
.control-textarea { padding: 8px 10px; resize: vertical; }
.field-error { margin: 0; font-size: 12px; color: #ef4444; }
.upload-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.btn-upload {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
.file-name { font-size: 13px; color: #6b7280; }
.hidden-file { display: none; }
.hint-text { margin: 0; font-size: 12px; color: #9ca3af; }
.link-btn { border: none; background: none; color: #2563eb; font-size: 12px; cursor: pointer; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}
.btn { height: 32px; padding: 0 16px; border-radius: 4px; font-size: 13px; cursor: pointer; }
.btn-default { border: 1px solid #d1d5db; background: #fff; color: #374151; }
.btn-primary { border: none; background: #2563eb; color: #fff; }
</style>
