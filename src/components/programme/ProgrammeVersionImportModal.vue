<script setup>
import { ref, watch } from 'vue'
import {
  downloadProgrammeImportTemplate,
  parseProgrammeImportFile,
  exportProgrammeImportErrorReport,
  buildImportErrorReportFilename,
} from '../../utils/programmeImportExcel.js'

const props = defineProps({
  visible: Boolean,
  existingProgrammes: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'imported'])

const fileInputRef = ref(null)
const selectedFile = ref(null)
const importing = ref(false)
const result = ref(null)
const lastErrorRows = ref([])

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedFile.value = null
    importing.value = false
    result.value = null
    lastErrorRows.value = []
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
  downloadProgrammeImportTemplate()
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function onFileSelected(event) {
  const file = event.target.files?.[0]
  selectedFile.value = file || null
  result.value = null
  lastErrorRows.value = []
}

function clearSelectedFile() {
  selectedFile.value = null
  result.value = null
  lastErrorRows.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleImport() {
  if (!selectedFile.value) {
    window.alert('Please select an Excel file to import.')
    return
  }

  importing.value = true
  result.value = null
  lastErrorRows.value = []

  try {
    const buffer = await selectedFile.value.arrayBuffer()
    const parsed = parseProgrammeImportFile(buffer, props.existingProgrammes)

    if (parsed.message && !parsed.importedProgrammes?.length && !parsed.errorRows?.length) {
      result.value = {
        type: 'error',
        message: parsed.message,
      }
      return
    }

    if (parsed.success) {
      emit('imported', parsed.importedProgrammes)
      result.value = {
        type: 'success',
        message: `Successfully imported ${parsed.successCount} programme record(s).`,
      }
      return
    }

    lastErrorRows.value = parsed.errorRows || []
    result.value = {
      type: 'error',
      message: `Import failed. ${parsed.errorCount} row(s) contain errors. Please download the error report, fix the data, and import again.`,
      successCount: parsed.successCount,
      errorCount: parsed.errorCount,
    }
  } catch (error) {
    result.value = {
      type: 'error',
      message: error?.message || 'Failed to read the import file.',
    }
  } finally {
    importing.value = false
  }
}

function handleDownloadErrorReport() {
  if (!lastErrorRows.value.length) return
  exportProgrammeImportErrorReport(lastErrorRows.value, buildImportErrorReportFilename())
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">Import</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p class="intro-text">
            Download the standard import template, fill in the data according to the template field requirements, then upload the file. The system will validate and import automatically.
          </p>

          <div class="section-card">
            <h3 class="section-title">Step 1: Download Template</h3>
            <p class="section-desc">Template columns must exactly match the system fields. Do not modify column headers.</p>
            <button type="button" class="btn btn-outline" @click="handleDownloadTemplate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Template
            </button>
          </div>

          <div class="section-card">
            <h3 class="section-title">Step 2: Upload File</h3>
            <p class="section-desc">Supported format: .xlsx</p>
            <div class="upload-box">
              <input
                ref="fileInputRef"
                type="file"
                class="file-input-hidden"
                accept=".xlsx,.xls"
                @change="onFileSelected"
              />
              <button type="button" class="btn btn-default" @click="triggerFileSelect">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Select File
              </button>
              <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
              <button v-if="selectedFile" type="button" class="link-btn" @click="clearSelectedFile">Remove</button>
            </div>
          </div>

          <div v-if="result" class="result-box" :class="result.type">
            <p class="result-message">{{ result.message }}</p>
            <button
              v-if="result.type === 'error' && lastErrorRows.length"
              type="button"
              class="btn btn-outline btn-sm"
              @click="handleDownloadErrorReport"
            >
              Download Error Report
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="importing || !selectedFile" @click="handleImport">
            {{ importing ? 'Importing...' : 'Import' }}
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
  max-width: 640px;
  max-height: 90vh;
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
  padding: 12px 24px;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.intro-text {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
}

.section-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}

.section-desc {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.upload-box {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.file-input-hidden {
  display: none;
}

.file-name {
  font-size: 13px;
  color: #374151;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
}

.result-box {
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.result-box.success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.result-box.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.result-message {
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn svg {
  width: 14px;
  height: 14px;
}

.btn-sm {
  height: 30px;
  padding: 0 12px;
  flex-shrink: 0;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
