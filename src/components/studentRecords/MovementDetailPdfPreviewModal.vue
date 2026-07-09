<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import MovementDetailExportBody from './MovementDetailExportBody.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { findInStore } from '../../data/movementStore.js'
import {
  buildMovementDetailPdfBlob,
  revokeMovementDetailPdfBlob,
  downloadMovementDetailPdfBlob,
} from '../../utils/exportMovementDetailPdf.js'
import { buildMovementFormPdfFilename } from '../../utils/movementExportNames.js'

const props = defineProps({
  visible: Boolean,
  queueItem: { type: Object, default: null },
  maskSensitiveFields: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const exportContentRef = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const pdfUrl = ref('')
const pdfBlob = ref(null)
const pdfFilename = ref('movement-application.pdf')

const resolvedSourceKey = computed(() => props.queueItem?.sourceKey || '')

const liveItem = computed(() => {
  if (!props.queueItem) return null
  const fresh = findInStore(props.queueItem.sourceKey, props.queueItem.id)
  return fresh || props.queueItem.raw
})

const modalSubtitle = computed(() => {
  const item = liveItem.value
  if (!item) return ''
  const id = item.applicationId || props.queueItem?.applicationId || ''
  const name = item.fullName || item.name || props.queueItem?.fullName || ''
  return [id, name].filter(Boolean).join(' · ')
})

const showOfficeUseReadonly = computed(
  () => resolvedSourceKey.value === 'programme-transfer' && liveItem.value?.status === 'Approved',
)

function cleanupPreview() {
  revokeMovementDetailPdfBlob(pdfUrl.value)
  pdfUrl.value = ''
  pdfBlob.value = null
  errorMessage.value = ''
  loading.value = false
}

async function generatePreview() {
  if (!props.visible || !liveItem.value || !resolvedSourceKey.value) return

  cleanupPreview()
  loading.value = true

  try {
    await nextTick()
    await nextTick()

    if (!exportContentRef.value) {
      errorMessage.value = t('movementExport.previewPdfError')
      return
    }

    pdfFilename.value = buildMovementFormPdfFilename(resolvedSourceKey.value, liveItem.value)
    const result = await buildMovementDetailPdfBlob(exportContentRef.value)
    if (!result) {
      errorMessage.value = t('movementExport.previewPdfError')
      return
    }

    pdfBlob.value = result.blob
    pdfUrl.value = result.blobUrl
  } catch {
    errorMessage.value = t('movementExport.previewPdfError')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.queueItem?.queueKey],
  ([visible]) => {
    if (visible) {
      generatePreview()
    } else {
      cleanupPreview()
    }
  },
)

onBeforeUnmount(() => {
  cleanupPreview()
})

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleDownload() {
  if (!pdfBlob.value) return
  downloadMovementDetailPdfBlob(pdfBlob.value, pdfFilename.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && queueItem && resolvedSourceKey && liveItem"
      class="preview-overlay"
      @click="handleOverlayClick"
    >
      <div
        ref="exportContentRef"
        class="pdf-render-host"
        aria-hidden="true"
      >
        <MovementDetailExportBody
          :source-key="resolvedSourceKey"
          :item="liveItem"
          :mask-sensitive-fields="maskSensitiveFields"
          :show-office-use-readonly="showOfficeUseReadonly"
        />
      </div>

      <div class="preview-panel" role="dialog" aria-modal="true" @click.stop>
        <header class="preview-header">
          <div>
            <h2 class="preview-title">{{ t('movementExport.previewPdfTitle') }}</h2>
            <p v-if="modalSubtitle" class="preview-subtitle">{{ modalSubtitle }}</p>
          </div>
          <button type="button" class="preview-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </header>

        <div class="preview-body">
          <p v-if="loading" class="preview-status">{{ t('movementExport.generatingPdf') }}</p>
          <p v-else-if="errorMessage" class="preview-status preview-status--error">{{ errorMessage }}</p>
          <iframe
            v-else-if="pdfUrl"
            :src="pdfUrl"
            class="preview-frame"
            :title="pdfFilename"
          />
        </div>

        <footer class="preview-footer">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="loading || !pdfBlob"
            @click="handleDownload"
          >
            {{ t('movementExport.downloadPdf') }}
          </button>
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.close') }}</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pdf-render-host {
  position: fixed;
  left: -10000px;
  top: 0;
  width: 760px;
  background: #fff;
  pointer-events: none;
}

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

.preview-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.preview-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
  word-break: break-all;
}

.preview-close {
  border: none;
  background: transparent;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}

.preview-body {
  flex: 1;
  min-height: 360px;
  overflow: auto;
  background: #f3f4f6;
}

.preview-status {
  margin: 0;
  padding: 48px 24px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.preview-status--error {
  color: #dc2626;
}

.preview-frame {
  width: 100%;
  height: min(70vh, 640px);
  border: none;
  background: #fff;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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

.btn-primary {
  border: none;
  background: #2563eb;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
</style>
