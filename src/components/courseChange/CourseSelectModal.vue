<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getOfferingLabel } from '../../data/courses.js'
import { initialDepartments } from '../../data/departments.js'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
  selectedId: { type: [Number, null], default: null },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr } = useAppI18n()
const pickedId = ref(null)

watch(
  () => props.visible,
  (visible) => {
    if (visible) pickedId.value = props.selectedId
  },
)

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleConfirm() {
  if (pickedId.value == null) return
  const course = props.courses.find((item) => item.id === pickedId.value)
  if (!course) return
  emit('confirm', course)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Select Course') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="emit('close')">×</button>
        </div>

        <div class="modal-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-radio" />
                  <th>{{ tr('Course Code') }}</th>
                  <th>{{ tr('Course Name') }}</th>
                  <th>{{ tr('Offering Unit') }}</th>
                  <th>{{ tr('Course Classification') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!courses.length">
                  <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
                <tr v-for="item in courses" :key="item.id" @click="pickedId = item.id">
                  <td class="col-radio">
                    <input v-model="pickedId" type="radio" :value="item.id" @click.stop />
                  </td>
                  <td>{{ item.courseCode }}</td>
                  <td>{{ item.courseName }}</td>
                  <td>{{ getOfferingLabel(item.offering, initialDepartments) }}</td>
                  <td>{{ tr(item.courseClassification) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" :disabled="pickedId == null" @click="handleConfirm">
            {{ t('common.confirm') }}
          </button>
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
  max-width: 880px;
  max-height: 90vh;
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
  padding: 12px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 16px 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.table-wrap {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table tbody tr {
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 13px;
}

.col-radio {
  width: 48px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}
</style>
