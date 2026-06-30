<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getConsentFormById, setAppliedVersion, addConsentFormVersion, deleteConsentFormVersion } from '../../data/consentForms.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import ConsentFormVersionFormModal from './ConsentFormVersionFormModal.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import YnSwitch from '../common/YnSwitch.vue'

const props = defineProps({
  visible: Boolean,
  configId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'updated'])

const { t, tr } = useAppI18n()

const configRow = ref(null)
const versionFormVisible = ref(false)
const confirmVisible = ref(false)
const pendingDeleteVersion = ref(null)

const sortedVersions = computed(() => {
  const list = [...(configRow.value?.versions || [])]
  return list.sort((a, b) => {
    const left = new Date(a.updatedAt || 0).getTime()
    const right = new Date(b.updatedAt || 0).getTime()
    return right - left
  })
})

const existingSessions = computed(() =>
  (configRow.value?.versions || []).map((version) => version.academicSession).filter(Boolean),
)

const subtitle = computed(() => {
  if (!configRow.value) return ''
  const parts = [
    t(`consentForm.movementType.${configRow.value.movementType}`),
    t(`consentForm.studentType.${configRow.value.studentType}`),
    programmeLevelLabel(configRow.value.programmeLevel),
  ]
  return parts.join(' · ')
})

watch(
  () => [props.visible, props.configId],
  () => {
    if (!props.visible || props.configId == null) return
    refreshRow()
  },
)

function refreshRow() {
  configRow.value = getConsentFormById(props.configId)
}

function programmeLevelLabel(level) {
  const key = `consentForm.programmeLevel.${level}`
  const translated = t(key)
  return translated !== key ? translated : tr(level)
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function toggleApplied(version, value) {
  if (!configRow.value) return
  setAppliedVersion(configRow.value.id, version.id, value)
  refreshRow()
  emit('updated')
}

function openAddVersion() {
  versionFormVisible.value = true
}

function closeAddVersion() {
  versionFormVisible.value = false
}

function handleVersionSave(formData) {
  if (!configRow.value) return
  addConsentFormVersion(configRow.value.id, formData)
  refreshRow()
  closeAddVersion()
  emit('updated')
}

function formatUpdatedAt(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function requestDeleteVersion(version) {
  pendingDeleteVersion.value = version
  confirmVisible.value = true
}

function confirmDeleteVersion() {
  if (!configRow.value || !pendingDeleteVersion.value) return
  deleteConsentFormVersion(configRow.value.id, pendingDeleteVersion.value.id)
  pendingDeleteVersion.value = null
  confirmVisible.value = false
  refreshRow()
  emit('updated')
}

function cancelDeleteVersion() {
  pendingDeleteVersion.value = null
  confirmVisible.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && configRow" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel modal-panel-wide" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ t('consentForm.versionSnapshot.title') }}</h2>
            <p class="modal-subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="table-toolbar">
            <button type="button" class="btn btn-primary btn-sm" @click="openAddVersion">
              {{ t('consentForm.versionSnapshot.addVersion') }}
            </button>
          </div>
          <table v-if="sortedVersions.length" class="version-log-table">
            <thead>
              <tr>
                <th>{{ t('consentForm.versionSnapshot.academicSession') }}</th>
                <th>{{ t('consentForm.versionSnapshot.changedBy') }}</th>
                <th>{{ t('consentForm.versionSnapshot.attachments') }}</th>
                <th>{{ t('consentForm.versionSnapshot.updatedAt') }}</th>
                <th>{{ t('consentForm.versionSnapshot.apply') }}</th>
                <th class="actions-col">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="version in sortedVersions" :key="version.id">
                <td>{{ version.academicSession || '—' }}</td>
                <td>{{ version.changedBy || '—' }}</td>
                <td class="attachments-cell">
                  <div class="attachment-line">
                    <span class="attachment-label">{{ t('consentForm.fields.studentConsent') }}:</span>
                    <AttachmentPreviewTrigger
                      v-if="version.studentConsentFile?.fileName"
                      :file-name="version.studentConsentFile.fileName"
                      :file-meta="version.studentConsentFile"
                      :show-file-icon="false"
                    />
                    <span v-else class="empty-file">—</span>
                  </div>
                  <div class="attachment-line">
                    <span class="attachment-label">{{ t('consentForm.fields.parentConsent') }}:</span>
                    <AttachmentPreviewTrigger
                      v-if="version.parentConsentFile?.fileName"
                      :file-name="version.parentConsentFile.fileName"
                      :file-meta="version.parentConsentFile"
                      :show-file-icon="false"
                    />
                    <span v-else class="empty-file">—</span>
                  </div>
                </td>
                <td>{{ formatUpdatedAt(version.updatedAt) }}</td>
                <td class="apply-cell">
                  <YnSwitch
                    :model-value="version.isApplied"
                    @update:model-value="(value) => toggleApplied(version, value)"
                  />
                </td>
                <td class="actions-cell">
                  <button type="button" class="link-btn link-btn-danger" @click="requestDeleteVersion(version)">
                    {{ t('common.delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty-hint">{{ t('common.noData') }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.close') }}</button>
        </div>
      </div>
    </div>

    <ConsentFormVersionFormModal
      :visible="versionFormVisible"
      :config-id="configId"
      :existing-sessions="existingSessions"
      @close="closeAddVersion"
      @save="handleVersionSave"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="t('consentForm.versionSnapshot.deleteOne')"
      :confirm-text="t('common.delete')"
      @confirm="confirmDeleteVersion"
      @cancel="cancelDeleteVersion"
    />
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
.modal-panel-wide { max-width: 960px; }
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title { margin: 0; font-size: 16px; font-weight: 600; }
.modal-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
.modal-close { border: none; background: transparent; font-size: 22px; color: #6b7280; cursor: pointer; }
.modal-body { padding: 20px; overflow-y: auto; }
.table-toolbar {
  margin-bottom: 12px;
}
.apply-cell {
  vertical-align: middle;
}
.actions-col {
  width: 72px;
  white-space: nowrap;
}
.actions-cell {
  vertical-align: middle;
  white-space: nowrap;
}
.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.link-btn-danger {
  color: #dc2626;
}
.link-btn:hover {
  text-decoration: underline;
}
.version-log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.version-log-table th,
.version-log-table td {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
}
.version-log-table th {
  background: #e8f5e9;
  color: #374151;
  font-weight: 600;
}
.attachments-cell { min-width: 260px; }
.attachment-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.attachment-line + .attachment-line { margin-top: 6px; }
.attachment-label {
  color: #6b7280;
  font-size: 12px;
  white-space: nowrap;
}
.empty-file { color: #9ca3af; }
.empty-hint {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}
.modal-footer {
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
.btn-sm {
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
}
.btn-primary { border: none; background: #2563eb; color: #fff; }
.btn-default { border: 1px solid #d1d5db; background: #fff; color: #374151; }
</style>
