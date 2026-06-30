<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { validateConsentFormVersion } from '../../data/consentForms.js'
import { getEnrollmentAcademicSessionOptions } from '../../data/studentEnrollmentOptions.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import YnSwitch from '../common/YnSwitch.vue'

const props = defineProps({
  visible: Boolean,
  configId: { type: Number, default: null },
  existingSessions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref({
  academicSession: '',
  studentConsentFile: null,
  parentConsentFile: null,
  applyImmediately: false,
})
const errors = ref({})
const studentFileInputRef = ref(null)
const parentFileInputRef = ref(null)
const studentLocalFile = ref(null)
const parentLocalFile = ref(null)
const academicSessionOptions = getEnrollmentAcademicSessionOptions()

const availableSessions = ref([])

watch(
  () => [props.visible, props.configId, props.existingSessions],
  () => {
    if (!props.visible) return
    errors.value = {}
    studentLocalFile.value = null
    parentLocalFile.value = null
    form.value = {
      academicSession: '',
      studentConsentFile: null,
      parentConsentFile: null,
      applyImmediately: false,
    }
    const existing = new Set(props.existingSessions || [])
    availableSessions.value = academicSessionOptions.filter((opt) => !existing.has(opt))
  },
)

function fieldError(key) {
  return errors.value[key] ? 'is-error' : ''
}

function onStudentFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  studentLocalFile.value = file
  form.value.studentConsentFile = { fileName: file.name, size: file.size }
  delete errors.value.studentConsentFile
}

function onParentFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    form.value.parentConsentFile = null
    parentLocalFile.value = null
    return
  }
  parentLocalFile.value = file
  form.value.parentConsentFile = { fileName: file.name, size: file.size }
}

function clearParentFile() {
  form.value.parentConsentFile = null
  parentLocalFile.value = null
  if (parentFileInputRef.value) parentFileInputRef.value.value = ''
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  const result = validateConsentFormVersion(form.value, props.configId)
  errors.value = result.errors
  if (!result.valid) return
  emit('save', { ...form.value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay modal-overlay-nested" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ t('consentForm.versionSnapshot.createVersionTitle') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="form-stack">
            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.effectiveAcademicSession') }}</label>
              <select
                v-model="form.academicSession"
                :class="['control-input', fieldError('academicSession'), { 'is-empty': !form.academicSession }]"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in availableSessions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <p v-if="errors.academicSession" class="field-error">{{ tr(errors.academicSession) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.studentConsent') }}</label>
              <div class="upload-row">
                <button type="button" class="btn btn-upload" @click="studentFileInputRef?.click()">
                  ↑ Upload
                </button>
                <AttachmentPreviewTrigger
                  v-if="form.studentConsentFile?.fileName"
                  :file-name="form.studentConsentFile.fileName"
                  :file-meta="form.studentConsentFile"
                  :local-file="studentLocalFile"
                  :show-file-icon="false"
                />
                <span v-else class="file-name">{{ t('consentForm.fields.noFileSelected') }}</span>
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
                <AttachmentPreviewTrigger
                  v-if="form.parentConsentFile?.fileName"
                  :file-name="form.parentConsentFile.fileName"
                  :file-meta="form.parentConsentFile"
                  :local-file="parentLocalFile"
                  :show-file-icon="false"
                />
                <span v-else class="file-name">{{ t('consentForm.fields.noFileSelected') }}</span>
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

            <div class="form-field form-field-switch">
              <label class="field-label">{{ t('consentForm.versionSnapshot.applyImmediately') }}</label>
              <YnSwitch v-model="form.applyImmediately" />
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
.modal-overlay-nested {
  z-index: 1100;
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
.form-field-switch {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.field-label { font-size: 13px; font-weight: 500; color: #374151; }
.field-label.required::before { content: '* '; color: #ef4444; }
.control-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  height: 32px;
  padding: 0 10px;
}
.control-input.is-empty { color: #9ca3af; }
.control-input.is-error { border-color: #ef4444; }
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
