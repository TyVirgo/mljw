<script setup>
import { ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { downloadAttachmentMock } from '../../utils/attachmentPreview.js'
import AttachmentPreviewModal from './AttachmentPreviewModal.vue'

const props = defineProps({
  fileName: { type: String, default: '' },
  fileMeta: { type: Object, default: null },
  localFile: { type: Object, default: null },
  downloadLabel: { type: String, default: '' },
  showFileIcon: { type: Boolean, default: true },
})

const { t } = useAppI18n()

const previewVisible = ref(false)

function openPreview() {
  if (!props.fileName) return
  previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}

function downloadFile() {
  if (!props.fileName) return
  downloadAttachmentMock(props.fileName, props.downloadLabel || props.fileName)
}
</script>

<template>
  <span v-if="fileName" class="attachment-preview-trigger">
    <button type="button" class="file-link" @click="downloadFile">
      <svg
        v-if="showFileIcon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="file-icon"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      {{ fileName }}
    </button>
    <button
      type="button"
      class="eye-btn"
      :aria-label="t('common.previewAttachment')"
      :title="t('common.previewAttachment')"
      @click="openPreview"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>

    <AttachmentPreviewModal
      :visible="previewVisible"
      :file-name="fileName"
      :file-meta="fileMeta || { fileName, size: 0 }"
      :local-file="localFile"
      @close="closePreview"
    />
  </span>
</template>

<style scoped>
.attachment-preview-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.file-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
}
.file-link:hover { text-decoration: underline; }
.file-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.eye-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}
.eye-btn svg {
  width: 18px;
  height: 18px;
}
.eye-btn:hover {
  color: #2563eb;
  background: #eff6ff;
}
</style>
