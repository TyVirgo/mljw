<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getOfferingLabel, getCourseOwnerLabel } from '../../data/courses.js'
import { initialDepartments } from '../../data/departments.js'

defineProps({
  visible: Boolean,
  data: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t, tr } = useAppI18n()

function display(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && data" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Details') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="emit('close')">×</button>
        </div>

        <div class="tab-bar">
          <button type="button" class="tab-btn active">{{ tr('General Information') }}</button>
        </div>

        <div class="detail-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">{{ tr('Course Code:') }}</span>
              <span class="detail-value">{{ display(data.courseCode) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ tr('Course Name:') }}</span>
              <span class="detail-value">{{ display(data.courseName) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ tr('Offering Unit:') }}</span>
              <span class="detail-value">{{ getOfferingLabel(data.offering, initialDepartments) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ tr('Course Owner:') }}</span>
              <span class="detail-value">{{ getCourseOwnerLabel(data.courseOwner) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ tr('Course Classification:') }}</span>
              <span class="detail-value">{{ data.courseClassification ? tr(data.courseClassification) : '--' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ tr('Credit:') }}</span>
              <span class="detail-value">{{ display(data.credit) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ tr('Medium of Instruction:') }}</span>
              <span class="detail-value">{{ data.mediumOfInstruction ? tr(data.mediumOfInstruction) : '--' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ tr('Semester Type:') }}</span>
              <span class="detail-value">{{ data.semesterType ? tr(data.semesterType) : '--' }}</span>
            </div>
          </div>
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
  max-width: 640px;
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
  color: #111827;
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

.tab-bar {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #f3f4f6;
}

.tab-btn {
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: #2563eb;
  font-weight: 600;
  border-bottom: 2px solid #2563eb;
  margin-bottom: -1px;
}

.detail-body {
  padding: 20px 24px;
  overflow: auto;
}

.detail-grid {
  display: grid;
  gap: 16px;
}

.detail-item {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  align-items: start;
}

.detail-label {
  font-size: 13px;
  color: #6b7280;
}

.detail-value {
  font-size: 13px;
  color: #111827;
  word-break: break-word;
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
  font-weight: 500;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}
</style>
