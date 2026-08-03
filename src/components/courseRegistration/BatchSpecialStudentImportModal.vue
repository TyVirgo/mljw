<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  downloadBatchSpecialRosterImportTemplate,
  parseBatchSpecialRosterImportFile,
} from '../../utils/importBatchSpecialRosterExcel.js'
import { importBatchSpecialStudents } from '../../data/courseRegistration/batchStudentRoster.js'

const props = defineProps({
  visible: Boolean,
  batchId: { type: String, default: '' },
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

function handleDownloadTemplate() {
  downloadBatchSpecialRosterImportTemplate(t)
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
    result.value = { type: 'error', message: t('courseRegistration.batch.specialImportNeedFile') }
    return
  }
  importing.value = true
  result.value = null
  try {
    const parsed = await parseBatchSpecialRosterImportFile(selectedFile.value)
    if (parsed.error === 'empty' || !parsed.studentIds?.length) {
      result.value = { type: 'error', message: t('courseRegistration.batch.specialImportEmpty') }
      return
    }
    const outcome = importBatchSpecialStudents(props.batchId, parsed.studentIds)
    emit('imported', outcome)
    const parts = [
      t('courseRegistration.batch.specialImportAdded', { count: outcome.added }),
      t('courseRegistration.batch.specialImportSkippedExist', { count: outcome.skippedExist }),
    ]
    if (outcome.skippedUnknown.length) {
      parts.push(
        t('courseRegistration.batch.specialImportSkippedUnknown', {
          count: outcome.skippedUnknown.length,
        }),
      )
    }
    result.value = { type: 'ok', message: parts.join('；') }
  } catch {
    result.value = { type: 'error', message: t('courseRegistration.batch.specialImportFailed') }
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ t('courseRegistration.batch.specialImportTitle') }}</h3>
        <button type="button" class="icon-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <p class="hint">{{ t('courseRegistration.batch.specialImportHint') }}</p>
        <div class="actions-row">
          <button type="button" class="btn btn-default" @click="handleDownloadTemplate">
            {{ t('courseRegistration.batch.specialImportTemplate') }}
          </button>
          <button type="button" class="btn btn-default" @click="triggerFileSelect">
            {{ t('courseRegistration.batch.specialImportChooseFile') }}
          </button>
          <input
            ref="fileInputRef"
            type="file"
            class="hidden-input"
            accept=".xlsx,.xls"
            @change="onFileSelected"
          />
        </div>
        <p class="file-name">
          {{ selectedFile?.name || t('courseRegistration.student.noFileChosen') }}
        </p>
        <p v-if="result" class="result" :class="result.type">{{ result.message }}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="importing"
          @click="handleImport"
        >
          {{ t('courseRegistration.batch.specialImportConfirm') }}
        </button>
      </div>
    </div>
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
  width: min(480px, 96vw);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
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
}
.icon-close {
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}
.modal-body {
  padding: 18px;
}
.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}
.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.hidden-input {
  display: none;
}
.file-name {
  margin: 12px 0 0;
  font-size: 13px;
  color: #374151;
}
.result {
  margin: 12px 0 0;
  font-size: 13px;
}
.result.ok {
  color: #047857;
}
.result.error {
  color: #dc2626;
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
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
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
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
