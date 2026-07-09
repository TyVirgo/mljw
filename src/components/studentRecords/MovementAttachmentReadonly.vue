<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { initialStudents } from '../../data/students.js'
import { downloadStudentConsentTemplate } from '../../utils/consentFormDownload.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import { downloadAttachmentMock } from '../../utils/attachmentPreview.js'

const props = defineProps({
  fileName: {
    type: String,
    default: '',
  },
  fileMeta: {
    type: Object,
    default: null,
  },
  labelKey: {
    type: String,
    required: true,
  },
  downloadLabelKey: {
    type: String,
    default: '',
  },
  consentHintKey: {
    type: String,
    default: '',
  },
  movementType: {
    type: String,
    default: '',
  },
  studentCategory: {
    type: String,
    default: '',
  },
  studentId: {
    type: String,
    default: '',
  },
  programmeLevel: {
    type: String,
    default: '',
  },
  applicationSession: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: true,
  },
  showAttachmentExport: {
    type: Boolean,
    default: false,
  },
  attachmentExportName: {
    type: String,
    default: '',
  },
})

const { t } = useAppI18n()

const resolvedStudentCategory = computed(() => {
  if (props.studentCategory) return props.studentCategory
  if (!props.studentId) return 'Local'
  const student = initialStudents.find(
    (item) =>
      item.studentId === props.studentId || item.basicInfo?.studentId === props.studentId,
  )
  return student?.studentCategory || 'Local'
})

const resolvedStudent = computed(() => {
  if (!props.studentId) return null
  return (
    initialStudents.find(
      (item) =>
        item.studentId === props.studentId || item.basicInfo?.studentId === props.studentId,
    ) || null
  )
})

const resolvedProgrammeLevel = computed(
  () => props.programmeLevel || resolvedStudent.value?.enrollment?.programmeLevel || '',
)

const resolvedFileMeta = computed(() => {
  if (props.fileMeta?.fileName) return props.fileMeta
  if (!props.fileName) return null
  return { fileName: props.fileName, size: 0 }
})

function downloadConsentLetter() {
  if (props.movementType) {
    downloadStudentConsentTemplate(props.movementType, resolvedStudentCategory.value, t, {
      programmeLevel: resolvedProgrammeLevel.value,
    })
    return
  }
  if (props.consentHintKey) {
    window.alert(t(props.consentHintKey))
  }
}

function exportAttachment() {
  if (!props.fileName) return
  downloadAttachmentMock(props.fileName, props.attachmentExportName || props.fileName)
}
</script>

<template>
  <div class="attachment-panel">
    <div class="attachment-header">
      <label class="attachment-label">
        {{ t(labelKey) }}
        <span v-if="required" class="required">*</span>
        :
      </label>
        <button
          v-if="downloadLabelKey"
          type="button"
          class="btn btn-outline"
          @click="downloadConsentLetter"
        >
          {{ t(downloadLabelKey) }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          v-if="showAttachmentExport"
          type="button"
          class="btn btn-outline"
          @click="exportAttachment"
        >
          {{ t('movementExport.exportAttachment') }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
    <div class="attachment-file-row">
      <AttachmentPreviewTrigger
        v-if="fileName"
        :file-name="fileName"
        :file-meta="resolvedFileMeta"
        :download-label="fileName"
      />
      <span v-else class="attachment-empty">—</span>
    </div>
  </div>
</template>

<style scoped>
.attachment-panel {
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

.btn-icon {
  width: 14px;
  height: 14px;
}

.attachment-file-row {
  padding-top: 2px;
}

.attachment-empty {
  font-size: 14px;
  color: #6b7280;
}
</style>
