<script setup>
import { ref, computed, watch } from 'vue'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  getMovementDocumentFields,
  getMovementAttachmentHintKey,
  attachmentErrorKey,
  validateMovementAttachmentFile,
  normalizeMovementAttachments,
} from '../../data/movementAttachments.js'
import '../../styles/movement-form.css'

const props = defineProps({
  sourceKey: { type: String, required: true },
  studentCategory: { type: String, default: '' },
  attachments: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:attachments', 'download-consent'])

const { t, tr } = useAppI18n()

const fileInputRefs = ref({})
const pendingLocalFiles = ref({})

const documentFields = computed(() =>
  getMovementDocumentFields(props.sourceKey, props.studentCategory),
)

const hintKey = computed(() => getMovementAttachmentHintKey(props.sourceKey))

const normalizedAttachments = computed(() => normalizeMovementAttachments({ attachments: props.attachments }))

watch(
  () => props.studentCategory,
  () => {
    pendingLocalFiles.value = {}
  },
)

function fieldError(key) {
  return props.errors[attachmentErrorKey(key)] ? 'error' : ''
}

function errorMessage(key) {
  const msg = props.errors[attachmentErrorKey(key)]
  return msg ? tr(msg) : ''
}

function setAttachment(key, value) {
  emit('update:attachments', {
    ...normalizedAttachments.value,
    [key]: value,
  })
}

function onFileChange(key, event) {
  const file = event.target.files?.[0]
  if (!file) {
    pendingLocalFiles.value = { ...pendingLocalFiles.value, [key]: null }
    setAttachment(key, null)
    return
  }
  const result = validateMovementAttachmentFile(file)
  if (!result.valid) {
    pendingLocalFiles.value = { ...pendingLocalFiles.value, [key]: null }
    setAttachment(key, null)
    return
  }
  pendingLocalFiles.value = { ...pendingLocalFiles.value, [key]: file }
  setAttachment(key, result.meta)
}

function triggerFileInput(key) {
  fileInputRefs.value[key]?.click()
}

function setFileInputRef(key, el) {
  if (el) fileInputRefs.value[key] = el
}
</script>

<template>
  <div class="documents-panel movement-documents-upload">
    <div
      v-for="field in documentFields"
      :key="field.key"
      class="movement-documents-upload__row"
    >
      <div class="attachment-header">
        <label class="attachment-label">
          {{ t(field.labelKey) }}
          <span v-if="field.required" class="required">*</span>
          :
        </label>
        <button
          v-if="field.showConsentDownload"
          type="button"
          class="btn btn-outline consent-btn"
          @click="emit('download-consent')"
        >
          {{ t(field.downloadLabelKey) }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
      <div class="file-row">
        <button type="button" class="btn btn-default" @click="triggerFileInput(field.key)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {{ t('movementDocuments.selectFile') }}
        </button>
        <AttachmentPreviewTrigger
          v-if="normalizedAttachments[field.key]?.fileName"
          :file-name="normalizedAttachments[field.key].fileName"
          :file-meta="normalizedAttachments[field.key]"
          :local-file="pendingLocalFiles[field.key]"
          :show-file-icon="false"
        />
        <span v-else class="file-name">{{ t('movementDocuments.noFileSelected') }}</span>
        <input
          :ref="(el) => setFileInputRef(field.key, el)"
          type="file"
          class="hidden-file"
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          @change="onFileChange(field.key, $event)"
        />
      </div>
      <p class="hint-text movement-documents-upload__format-hint">{{ t(hintKey) }}</p>
      <p v-if="errorMessage(field.key)" class="field-error">{{ errorMessage(field.key) }}</p>
    </div>
  </div>
</template>

<style scoped>
.movement-documents-upload__format-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.movement-documents-upload__row + .movement-documents-upload__row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.documents-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fff;
}

.attachment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.attachment-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.required {
  color: #ef4444;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  color: #2563eb;
  background: #fff;
  border: 1px solid #2563eb;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-outline:hover {
  background: #eff6ff;
}

.btn-default {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  color: #374151;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  font-size: 13px;
  color: #6b7280;
}

.hidden-file {
  display: none;
}

.field-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #ef4444;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.consent-btn {
  flex-shrink: 0;
}
</style>
