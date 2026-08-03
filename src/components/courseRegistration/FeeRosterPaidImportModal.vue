<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  downloadFeeRosterPaidImportTemplate,
  parseFeeRosterPaidImportFile,
} from '../../utils/importFeeRosterPaidExcel.js'
import { markFeeRosterStudentsPaid } from '../../data/courseRegistration/feeRosterQueue.js'

const props = defineProps({
  visible: Boolean,
})

const emit = defineEmits(['close', 'imported'])

const { t } = useAppI18n()

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

function handleDownloadTemplate() {
  downloadFeeRosterPaidImportTemplate(t)
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
    result.value = { type: 'error', message: t('courseRegistration.feeRoster.importNeedFile') }
    return
  }

  importing.value = true
  result.value = null

  try {
    const parsed = await parseFeeRosterPaidImportFile(selectedFile.value)
    if (parsed.error === 'empty') {
      result.value = { type: 'error', message: t('courseRegistration.feeRoster.importEmpty') }
      return
    }
    if (parsed.error === 'noStudentIdColumn') {
      result.value = { type: 'error', message: t('courseRegistration.feeRoster.importNoIdColumn') }
      return
    }
    if (parsed.error === 'noStudentNameColumn') {
      result.value = { type: 'error', message: t('courseRegistration.feeRoster.importNoNameColumn') }
      return
    }
    if (!parsed.entries?.length) {
      result.value = { type: 'error', message: t('courseRegistration.feeRoster.importEmpty') }
      return
    }

    const outcome = markFeeRosterStudentsPaid(parsed.entries)
    emit('imported', outcome)

    const parts = []
    if (outcome.moved.length) {
      parts.push(t('courseRegistration.feeRoster.importMoved', { count: outcome.moved.length }))
    }
    if (outcome.skippedNotFound.length) {
      parts.push(
        t('courseRegistration.feeRoster.importNotFound', { count: outcome.skippedNotFound.length }),
      )
    }
    if (outcome.skippedNameMismatch?.length) {
      parts.push(
        t('courseRegistration.feeRoster.importNameMismatch', {
          count: outcome.skippedNameMismatch.length,
        }),
      )
    }
    if (outcome.skippedAlreadyPaid.length) {
      parts.push(
        t('courseRegistration.feeRoster.importAlreadyPaid', {
          count: outcome.skippedAlreadyPaid.length,
        }),
      )
    }

    result.value = {
      type: outcome.moved.length ? 'success' : 'warning',
      message: parts.join(' ') || t('courseRegistration.feeRoster.importEmpty'),
    }
  } catch {
    result.value = { type: 'error', message: t('courseRegistration.feeRoster.importFailed') }
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h3>{{ t('courseRegistration.feeRoster.importTitle') }}</h3>
          <button type="button" class="close-btn" @click="handleClose">×</button>
        </div>
        <div class="modal-body">
          <p class="hint">{{ t('courseRegistration.feeRoster.importHint') }}</p>
          <p class="hint hint-sample">{{ t('courseRegistration.feeRoster.importTemplateSampleNote') }}</p>
          <div class="actions-row">
            <button type="button" class="btn btn-default" @click="handleDownloadTemplate">
              {{ t('courseRegistration.feeRoster.downloadTemplate') }}
            </button>
            <button type="button" class="btn btn-default" @click="triggerFileSelect">
              {{ t('courseRegistration.feeRoster.selectFile') }}
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              class="file-input"
              @change="onFileSelected"
            />
          </div>
          <p v-if="selectedFile" class="file-name">{{ selectedFile.name }}</p>
          <p v-if="result" class="result" :class="result.type">{{ result.message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">
            {{ t('common.close') }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="importing || !selectedFile"
            @click="handleImport"
          >
            {{ t('common.import') }}
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
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal-panel {
  width: min(480px, calc(100vw - 32px));
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 16px;
}

.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.hint-sample {
  margin-top: -4px;
  color: #b45309;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-input {
  display: none;
}

.file-name {
  margin: 10px 0 0;
  font-size: 13px;
  color: #374151;
}

.result {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.5;
}

.result.success {
  color: #047857;
}

.result.warning {
  color: #b45309;
}

.result.error {
  color: #b91c1c;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
</style>
