<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { updateExportArchiveNumber } from '../../data/movementMaintenanceFields.js'
import { isValidMovementArchiveNumber, normalizeMovementArchiveNumber } from '../../utils/movementArchiveNumber.js'

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const archiveNumber = ref('')
const errorMessage = ref('')

const subtitle = computed(() => {
  if (!props.row) return ''
  return [props.row.studentId, props.row.fullName].filter(Boolean).join(' · ')
})

watch(
  () => [props.visible, props.row?.queueKey],
  () => {
    if (!props.visible || !props.row) return
    const existing = props.row.raw?.exportArchiveNumber ?? props.row.exportArchiveNumber
    archiveNumber.value =
      existing != null && String(existing).trim() && String(existing).trim() !== 'NA'
        ? String(existing).trim()
        : ''
    errorMessage.value = ''
  },
)

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  const value = normalizeMovementArchiveNumber(archiveNumber.value)
  if (!isValidMovementArchiveNumber(value)) {
    errorMessage.value = t('movementMaintenance.archiveNumberInvalid')
    return
  }
  if (!props.row) return
  updateExportArchiveNumber(props.row.sourceKey, props.row.id, value)
  emit('saved')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && row" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ t('movementMaintenance.editArchiveNumber') }}</h2>
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <label class="field-label" for="movement-archive-number">{{ t('movementMaintenance.columns.archiveNumber') }}</label>
          <input
            id="movement-archive-number"
            v-model="archiveNumber"
            type="text"
            class="control-input"
            maxlength="100"
            :placeholder="t('movementMaintenance.archiveNumberPlaceholder')"
            @input="errorMessage = ''"
          />
          <p class="field-hint">{{ t('movementMaintenance.archiveNumberHint') }}</p>
          <p v-if="errorMessage" class="field-error">{{ errorMessage }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
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
  max-width: 480px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.control-input {
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.field-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.field-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #dc2626;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

.btn-default {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-primary {
  border: none;
  background: #2563eb;
  color: #fff;
}
</style>
