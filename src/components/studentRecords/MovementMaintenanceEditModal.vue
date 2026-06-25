<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { updateMaintenanceFields } from '../../data/movementMaintenanceFields.js'

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const form = ref(createEmptyForm())

const isProgrammeTransfer = computed(() => props.row?.sourceKey === 'programme-transfer')

watch(
  () => [props.visible, props.row],
  () => {
    if (!props.visible || !props.row) return
    const raw = props.row.raw || {}
    form.value = {
      movementNumber: raw.movementNumber || '',
      maintenanceRemark: raw.maintenanceRemark || '',
      cgpa: raw.cgpa || '',
      newSchool: raw.newSchool || props.row.newSchool || '',
      newProgrammeCode: raw.newProgrammeCode || props.row.newProgrammeCode || '',
      newProgrammeName: raw.newProgrammeName || props.row.newProgrammeName || '',
    }
  },
)

function createEmptyForm() {
  return {
    movementNumber: '',
    maintenanceRemark: '',
    cgpa: '',
    newSchool: '',
    newProgrammeCode: '',
    newProgrammeName: '',
  }
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  if (!props.row) return
  const patch = {
    movementNumber: String(form.value.movementNumber || '').trim(),
    maintenanceRemark: form.value.maintenanceRemark || '',
    cgpa: form.value.cgpa || '',
  }
  if (isProgrammeTransfer.value) {
    patch.newSchool = form.value.newSchool || ''
    patch.newProgrammeCode = form.value.newProgrammeCode || ''
    patch.newProgrammeName = form.value.newProgrammeName || ''
  }
  updateMaintenanceFields(props.row.sourceKey, props.row.id, patch)
  emit('saved')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ t('movementMaintenance.editTitle') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="form-stack">
            <div class="form-field">
              <label class="field-label">{{ t('movementMaintenance.fields.movementNumber') }}</label>
              <input
                v-model="form.movementNumber"
                type="text"
                class="control-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>

            <div class="form-field">
              <label class="field-label">{{ t('movementMaintenance.fields.remark') }}</label>
              <textarea
                v-model="form.maintenanceRemark"
                rows="3"
                class="control-textarea"
                :placeholder="t('common.pleaseInput')"
              />
            </div>

            <div class="form-field">
              <label class="field-label">{{ t('movementMaintenance.fields.cgpa') }}</label>
              <input
                v-model="form.cgpa"
                type="text"
                class="control-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>

            <template v-if="isProgrammeTransfer">
              <div class="form-field">
                <label class="field-label">{{ t('movementMaintenance.fields.newSchool') }}</label>
                <input
                  v-model="form.newSchool"
                  type="text"
                  class="control-input"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>

              <div class="form-field">
                <label class="field-label">{{ t('movementMaintenance.fields.newProgrammeCode') }}</label>
                <input
                  v-model="form.newProgrammeCode"
                  type="text"
                  class="control-input"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>

              <div class="form-field">
                <label class="field-label">{{ t('movementMaintenance.fields.newProgrammeName') }}</label>
                <input
                  v-model="form.newProgrammeName"
                  type="text"
                  class="control-input"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>
            </template>
          </div>
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
.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
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
  overflow-y: auto;
}
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}
.control-input,
.control-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
}
.control-input {
  height: 32px;
  padding: 0 10px;
}
.control-textarea {
  padding: 8px 10px;
  resize: vertical;
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
