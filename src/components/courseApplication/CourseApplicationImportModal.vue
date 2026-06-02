<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  visible: Boolean,
})

const emit = defineEmits(['close'])

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
  window.alert(tr('Import is not available yet.'))
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function onFileSelected(event) {
  selectedFile.value = event.target.files?.[0] || null
  result.value = null
}

function clearSelectedFile() {
  selectedFile.value = null
  result.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleImport() {
  if (!selectedFile.value) {
    window.alert(tr('Please select an Excel file to import.'))
    return
  }

  importing.value = true
  result.value = null

  await new Promise((resolve) => setTimeout(resolve, 300))

  result.value = {
    type: 'error',
    message: tr('Import is not available yet.'),
  }
  importing.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Import Course Application') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p class="intro-text">
            {{ tr('Download the standard import template, fill in the data according to the template field requirements, then upload the file. The system will validate and import automatically.') }}
          </p>
          <p class="notice-text">
            {{ tr('Import only creates course application records. CLO and SLT data must be entered separately in the application wizard.') }}
          </p>

          <div class="section-card">
            <h3 class="section-title">{{ tr('Step 1: Download Template') }}</h3>
            <p class="section-desc">{{ tr('Template columns must exactly match the system fields. Do not modify column headers.') }}</p>
            <button type="button" class="btn btn-outline" @click="handleDownloadTemplate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {{ tr('Download Import Template') }}
            </button>
          </div>

          <div class="section-card">
            <h3 class="section-title">{{ tr('Step 2: Upload File') }}</h3>
            <p class="section-desc">{{ tr('Supported format: .xlsx') }}</p>
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
                {{ tr('Select File') }}
              </button>
              <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
              <button v-if="selectedFile" type="button" class="link-btn" @click="clearSelectedFile">{{ t('common.remove') }}</button>
            </div>
          </div>

          <div v-if="result" class="result-box" :class="result.type">
            <p class="result-message">{{ result.message }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" :disabled="importing || !selectedFile" @click="handleImport">
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
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
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
  margin: 0 0 8px;
}

.notice-text {
  font-size: 13px;
  color: #2563eb;
  line-height: 1.5;
  margin: 0 0 20px;
  padding: 10px 12px;
  background: #eff6ff;
  border-radius: 6px;
}

.section-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.section-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
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
  padding: 0;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.result-box {
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.result-box.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.result-message {
  margin: 0;
  line-height: 1.5;
  color: #374151;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>
