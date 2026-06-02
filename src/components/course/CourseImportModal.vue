<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  downloadCourseImportTemplate,
  parseCourseImportFile,
  exportCourseImportErrorReport,
} from '../../utils/courseImportExcel.js'

const props = defineProps({
  visible: Boolean,
  existingCourses: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'imported'])

const { t, tr } = useAppI18n()

const fileInputRef = ref(null)
const selectedFile = ref(null)
const importing = ref(false)
const result = ref(null)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedFile.value = null
    importing.value = false
    result.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  },
)

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleDownloadTemplate() {
  downloadCourseImportTemplate()
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function onFileSelected(event) {
  selectedFile.value = event.target.files?.[0] || null
  result.value = null
}

async function handleImport() {
  if (!selectedFile.value) {
    window.alert(tr('Please select an Excel file to import.'))
    return
  }

  importing.value = true
  result.value = null

  try {
    const parsed = await parseCourseImportFile(selectedFile.value, props.existingCourses)
    result.value = parsed
    if (parsed.successRows.length) {
      emit('imported', parsed.successRows)
    }
  } catch {
    result.value = {
      successRows: [],
      errorRows: [{ row: 0, message: 'Failed to read import file' }],
    }
  } finally {
    importing.value = false
  }
}

function downloadErrorReport() {
  if (!result.value?.errorRows?.length) return
  exportCourseImportErrorReport(result.value.errorRows)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Import Course') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p class="hint">{{ tr('Download the template, fill in course data, then upload the Excel file.') }}</p>
          <button type="button" class="btn btn-outline" @click="handleDownloadTemplate">
            {{ tr('Download Import Template') }}
          </button>

          <div class="upload-row">
            <button type="button" class="btn btn-default" @click="triggerFileSelect">{{ tr('Select File') }}</button>
            <span class="file-name">{{ selectedFile?.name || tr('No file selected') }}</span>
          </div>
          <input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="hidden-input" @change="onFileSelected" />

          <div v-if="result" class="result-box">
            <p class="success">{{ t('pages.course.importSuccessCount', { count: result.successRows.length }) }}</p>
            <p v-if="result.errorRows.length" class="error">
              {{ t('pages.course.importFailedCount', { count: result.errorRows.length }) }}
            </p>
            <button
              v-if="result.errorRows.length"
              type="button"
              class="link-btn"
              @click="downloadErrorReport"
            >
              {{ tr('Download Error Report') }}
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" :disabled="importing" @click="handleImport">
            {{ importing ? tr('Importing...') : t('common.import') }}
          </button>
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
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  border: none;
  background: none;
  font-size: 24px;
  color: #6b7280;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  font-size: 13px;
  color: #374151;
}

.hidden-input {
  display: none;
}

.result-box {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}

.result-box .success {
  margin: 0 0 4px;
  color: #059669;
}

.result-box .error {
  margin: 0;
  color: #ef4444;
}

.link-btn {
  margin-top: 8px;
  padding: 0;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default,
.btn-outline {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline {
  border-color: #2563eb;
  color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
}
</style>
