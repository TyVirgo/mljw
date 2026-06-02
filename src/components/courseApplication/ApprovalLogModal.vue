<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  visible: Boolean,
  logs: { type: Array, default: () => [] },
  courseName: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { t, tr } = useAppI18n()

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Approval Log') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="emit('close')">×</button>
        </div>

        <p v-if="courseName" class="course-name">{{ courseName }}</p>

        <div class="modal-body">
          <table v-if="logs.length" class="log-table">
            <thead>
              <tr>
                <th>{{ tr('Approval Stage') }}</th>
                <th>{{ tr('Actor') }}</th>
                <th>{{ tr('Action') }}</th>
                <th>{{ tr('Date and Time') }}</th>
                <th>{{ tr('Comment') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in logs" :key="item.id">
                <td>{{ item.stage }}</td>
                <td>{{ item.actor }}</td>
                <td>{{ item.action }}</td>
                <td>{{ item.dateTime }}</td>
                <td>{{ item.comment || '--' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty-hint">{{ t('common.noData') }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
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
  max-width: 900px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
}

.course-name {
  margin: 0;
  padding: 12px 24px 0;
  font-size: 14px;
  color: #374151;
}

.modal-body {
  padding: 16px 24px;
  overflow: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.log-table th,
.log-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: top;
}

.log-table th {
  background: #f9fafb;
  color: #6b7280;
}

.empty-hint {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
}
</style>
