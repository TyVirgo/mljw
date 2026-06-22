<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { updateMovementNumbers } from '../../data/movementMaintenanceFields.js'

const props = defineProps({
  visible: Boolean,
  rows: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const { t, tr } = useAppI18n()

const entries = ref([])

watch(
  () => [props.visible, props.rows],
  () => {
    if (!props.visible) return
    entries.value = props.rows.map((row) => ({
      sourceKey: row.sourceKey,
      id: row.id,
      studentId: row.studentId,
      fullName: row.fullName,
      movementNumber: row.raw?.movementNumber || row.movementNumber || '',
    }))
  },
)

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  updateMovementNumbers(entries.value)
  emit('saved')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel modal-panel-wide" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ t('movementMaintenance.numberModalTitle') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <table class="number-table">
            <thead>
              <tr>
                <th>{{ tr('Student ID') }}</th>
                <th>{{ tr('Student Name') }}</th>
                <th>{{ t('movementMaintenance.fields.movementNumber') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, index) in entries" :key="`${entry.sourceKey}:${entry.id}`">
                <td>{{ entry.studentId }}</td>
                <td>{{ entry.fullName }}</td>
                <td>
                  <input
                    v-model="entries[index].movementNumber"
                    type="text"
                    class="control-input"
                    :placeholder="t('common.pleaseInput')"
                  />
                </td>
              </tr>
            </tbody>
          </table>
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
.modal-panel-wide {
  max-width: 720px;
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
.number-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.number-table th,
.number-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}
.number-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
}
.control-input {
  width: 100%;
  box-sizing: border-box;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
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
