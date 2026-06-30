<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  resolvePreviewMode,
  createBlobPreviewUrl,
  revokeBlobPreviewUrl,
  buildMockPreviewHtml,
} from '../../utils/attachmentPreview.js'

const props = defineProps({
  visible: Boolean,
  fileName: { type: String, default: '' },
  fileMeta: { type: Object, default: null },
  localFile: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const blobUrl = ref('')

const previewMode = computed(() => resolvePreviewMode(props.fileName, props.localFile))

const showMockNotice = computed(() => !props.localFile && previewMode.value.startsWith('mock-'))

const mockHtml = computed(() => buildMockPreviewHtml(props.fileName, props.fileMeta))

watch(
  () => [props.visible, props.fileName, props.localFile],
  () => {
    revokeBlobPreviewUrl(blobUrl.value)
    blobUrl.value = ''
    if (!props.visible || !props.fileName) return
    if (props.localFile && (previewMode.value === 'blob-pdf' || previewMode.value === 'blob-image')) {
      blobUrl.value = createBlobPreviewUrl(props.localFile)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  revokeBlobPreviewUrl(blobUrl.value)
})

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && fileName" class="preview-overlay" @click="handleOverlayClick">
      <div class="preview-panel" role="dialog" aria-modal="true" @click.stop>
        <header class="preview-header">
          <div>
            <h2 class="preview-title">{{ t('attachmentPreview.title') }}</h2>
            <p class="preview-subtitle">{{ fileName }}</p>
          </div>
          <button type="button" class="preview-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </header>

        <p v-if="showMockNotice" class="mock-notice">{{ t('attachmentPreview.mockNotice') }}</p>

        <div class="preview-body">
          <iframe
            v-if="previewMode === 'blob-pdf'"
            :src="blobUrl"
            class="preview-frame"
            :title="fileName"
          />
          <img
            v-else-if="previewMode === 'blob-image'"
            :src="blobUrl"
            class="preview-image"
            :alt="fileName"
          />
          <iframe
            v-else-if="previewMode === 'mock-pdf' || previewMode === 'mock-image'"
            :srcdoc="mockHtml"
            class="preview-frame"
            :title="fileName"
          />
          <div v-else-if="previewMode === 'mock-docx'" class="unsupported-panel">
            <p class="unsupported-title">{{ fileName }}</p>
            <p>{{ t('attachmentPreview.docxNotice') }}</p>
            <p class="file-meta" v-if="fileMeta?.size">{{ Math.max(1, Math.round(fileMeta.size / 1024)) }} KB</p>
          </div>
          <div v-else class="unsupported-panel">
            <p class="unsupported-title">{{ fileName }}</p>
            <p>{{ t('common.previewUnsupported') }}</p>
          </div>
        </div>

        <footer class="preview-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.close') }}</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}
.preview-panel {
  width: 100%;
  max-width: 920px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.preview-title { margin: 0; font-size: 16px; font-weight: 600; }
.preview-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; word-break: break-all; }
.preview-close { border: none; background: transparent; font-size: 22px; color: #6b7280; cursor: pointer; }
.mock-notice {
  margin: 0;
  padding: 10px 20px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  border-bottom: 1px solid #dbeafe;
}
.preview-body {
  flex: 1;
  min-height: 360px;
  overflow: auto;
  background: #f3f4f6;
}
.preview-frame {
  width: 100%;
  height: min(70vh, 640px);
  border: none;
  background: #fff;
}
.preview-image {
  display: block;
  max-width: 100%;
  max-height: min(70vh, 640px);
  margin: 0 auto;
  background: #fff;
}
.mock-image-placeholder { height: min(70vh, 640px); }
.mock-frame { height: 100%; }
.unsupported-panel {
  padding: 32px 24px;
  text-align: center;
  color: #374151;
}
.unsupported-title {
  margin: 0 0 8px;
  font-weight: 600;
  word-break: break-all;
}
.file-meta { color: #6b7280; font-size: 13px; }
.preview-footer {
  display: flex;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}
.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.btn-default { border: 1px solid #d1d5db; background: #fff; color: #374151; }
</style>
