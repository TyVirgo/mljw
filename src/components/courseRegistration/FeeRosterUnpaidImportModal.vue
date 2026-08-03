<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  downloadFeeRosterUnpaidImportTemplate,
  parseFeeRosterUnpaidImportFile,
} from '../../utils/importFeeRosterUnpaidExcel.js'
import {
  importUnpaidFeeRosterStudents,
} from '../../data/courseRegistration/feeRosterQueue.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import { listAdminAddStudentCandidates } from '../../data/courseRegistration/registrationResult.js'

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
  downloadFeeRosterUnpaidImportTemplate(t)
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function onFileSelected(event) {
  selectedFile.value = event.target.files?.[0] || null
  result.value = null
}

function resolveProfiles(studentIds) {
  const pool = new Map(listAdminAddStudentCandidates().map((row) => [row.studentId, row]))
  return studentIds.map((studentId) => {
    const profile = pool.get(studentId)
    return {
      studentId,
      studentName: profile?.studentName || studentId,
      programme: profile?.programme || '',
      intake: profile ? formatIntakeBatch(profile.intake) || profile.intake : '',
    }
  })
}

async function handleImport() {
  if (!selectedFile.value) {
    result.value = { type: 'error', message: t('courseRegistration.feeRoster.importNeedFile') }
    return
  }

  importing.value = true
  result.value = null

  try {
    const parsed = await parseFeeRosterUnpaidImportFile(selectedFile.value)
    if (parsed.error === 'empty') {
      result.value = { type: 'error', message: t('courseRegistration.feeRoster.importEmpty') }
      return
    }
    if (parsed.error === 'noStudentIdColumn') {
      result.value = { type: 'error', message: t('courseRegistration.feeRoster.importNoIdColumn') }
      return
    }
    if (!parsed.studentIds.length) {
      result.value = { type: 'error', message: t('courseRegistration.feeRoster.importEmpty') }
      return
    }

    const outcome = importUnpaidFeeRosterStudents(resolveProfiles(parsed.studentIds))
    emit('imported', outcome)

    const parts = []
    if (outcome.added) {
      parts.push(t('courseRegistration.feeRoster.unpaidImportAdded', { count: outcome.added }))
    }
    if (outcome.skippedExist) {
      parts.push(
        t('courseRegistration.feeRoster.unpaidImportSkippedExist', { count: outcome.skippedExist }),
      )
    }
    if (outcome.skippedPaid) {
      parts.push(
        t('courseRegistration.feeRoster.unpaidImportSkippedPaid', { count: outcome.skippedPaid }),
      )
    }

    result.value = {
      type: outcome.added ? 'success' : 'warning',
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
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-panel" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ t('courseRegistration.feeRoster.unpaidImportTitle') }}</h3>
        <button type="button" class="icon-close" :aria-label="t('common.close')" @click="handleClose">
          ×
        </button>
      </div>
      <div class="modal-body">
        <p class="hint">{{ t('courseRegistration.feeRoster.unpaidImportHint') }}</p>
        <p class="hint hint-sample">{{ t('courseRegistration.feeRoster.unpaidImportTemplateSampleNote') }}</p>
        <div class="actions">
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
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="importing"
          @click="handleImport"
        >
          {{ t('common.import') }}
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
  width: min(520px, 96vw);
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
  font-weight: 600;
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
  margin: 0 0 10px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}
.hint-sample {
  color: #6b7280;
  font-size: 12px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
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
}
.result.success {
  color: #047857;
}
.result.warning {
  color: #b45309;
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
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>
