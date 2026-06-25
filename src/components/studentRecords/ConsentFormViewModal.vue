<script setup>
import { computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { downloadMockConsentFile } from '../../utils/consentFormDownload.js'

const props = defineProps({
  visible: Boolean,
  data: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t, tr } = useAppI18n()

const row = computed(() => props.data)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
  },
)

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function formatMovementType(type) {
  const key = `consentForm.movementType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
}

function formatStudentType(type) {
  const key = `consentForm.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
}

function downloadFile(fileMeta, label) {
  if (!fileMeta?.fileName) return
  downloadMockConsentFile(fileMeta, label)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && row" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ t('consentForm.view.title') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <dl class="detail-list">
            <div class="detail-row">
              <dt>{{ t('consentForm.fields.formName') }}</dt>
              <dd>{{ row.formName || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('consentForm.fields.movementType') }}</dt>
              <dd>{{ formatMovementType(row.movementType) }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('consentForm.fields.studentType') }}</dt>
              <dd>{{ formatStudentType(row.studentType) }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('consentForm.fields.remark') }}</dt>
              <dd class="multiline">{{ row.remark || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('consentForm.fields.studentConsent') }}</dt>
              <dd>
                <button
                  v-if="row.studentConsentFile?.fileName"
                  type="button"
                  class="file-link"
                  @click="downloadFile(row.studentConsentFile, row.formName)"
                >
                  {{ row.studentConsentFile.fileName }}
                </button>
                <span v-else>—</span>
              </dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('consentForm.fields.parentConsent') }}</dt>
              <dd>
                <button
                  v-if="row.parentConsentFile?.fileName"
                  type="button"
                  class="file-link"
                  @click="downloadFile(row.parentConsentFile, `${row.formName} - Parent`)"
                >
                  {{ row.parentConsentFile.fileName }}
                </button>
                <span v-else>—</span>
              </dd>
            </div>
          </dl>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.close') }}</button>
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
  max-height: 92vh;
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
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title { margin: 0; font-size: 16px; font-weight: 600; }
.modal-close { border: none; background: transparent; font-size: 22px; color: #6b7280; cursor: pointer; }
.modal-body { padding: 20px; overflow-y: auto; }
.detail-list { margin: 0; display: flex; flex-direction: column; gap: 14px; }
.detail-row { display: grid; grid-template-columns: 140px 1fr; gap: 12px; font-size: 13px; }
.detail-row dt { margin: 0; color: #6b7280; font-weight: 500; }
.detail-row dd { margin: 0; color: #111827; }
.multiline { white-space: pre-wrap; }
.file-link {
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}
.file-link:hover { text-decoration: underline; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}
.btn { height: 32px; padding: 0 16px; border-radius: 4px; font-size: 13px; cursor: pointer; }
.btn-default { border: 1px solid #d1d5db; background: #fff; color: #374151; }
</style>
