<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatReportTo, formatEstablished } from '../../data/departments.js'

const { t, tr } = useAppI18n()

defineProps({
  visible: Boolean,
  data: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

function display(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function formatRecordYears(row) {
  const from = row.yearFrom || '--'
  const to = row.yearTo || '--'
  return from === to ? from : `${from}~${to}`
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

        <div class="detail-body">
          <div class="detail-grid">
            <div class="detail-col">
              <div class="detail-item">
                <span class="detail-label">{{ tr('ID:') }}</span>
                <span class="detail-value">{{ data.deptId }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Department Name:') }}</span>
                <span class="detail-value">{{ data.nameEn }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Code:') }}</span>
                <span class="detail-value">{{ data.code }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Report to:') }}</span>
                <span class="detail-value">{{ formatReportTo(data.reportTo) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Office No.:') }}</span>
                <span class="detail-value">{{ display(data.officeNo) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Established:') }}</span>
                <span class="detail-value">{{ formatEstablished(data.established) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Teaching:') }}</span>
                <span class="detail-value">{{ tr(data.teaching) }}</span>
              </div>
            </div>

            <div class="detail-col">
              <div class="detail-item">
                <span class="detail-label">{{ tr('Category:') }}</span>
                <span class="detail-value">{{ data.category }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Department Name (Chinese):') }}</span>
                <span class="detail-value">{{ data.nameZh }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Unit Head:') }}</span>
                <span class="detail-value">{{ display(data.departmentHead) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Office Extension:') }}</span>
                <span class="detail-value">{{ display(data.officeExtension) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Email:') }}</span>
                <span class="detail-value">{{ display(data.email) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Active:') }}</span>
                <span class="detail-value">{{ tr(data.active) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ tr('Offering:') }}</span>
                <span class="detail-value">{{ tr(data.offering) }}</span>
              </div>
            </div>

            <div v-if="data.previousRecords?.length" class="detail-item detail-item-full">
              <span class="detail-label">{{ tr('Previous Record:') }}</span>
              <ul class="record-list detail-content">
                <li v-for="(row, index) in data.previousRecords" :key="row.id || index">
                  <span class="record-year">{{ tr('Year:') }} {{ formatRecordYears(row) }}</span>
                  <span class="record-name">{{ row.departmentName }}</span>
                </li>
              </ul>
            </div>

            <div class="detail-item detail-item-full">
              <span class="detail-label">{{ tr('Remarks:') }}</span>
              <p class="remarks-text detail-content">{{ display(data.remarks) }}</p>
            </div>
          </div>
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
  --modal-pad-x: 28px;
  --detail-label-w-left: 172px;
  --detail-label-w-right: 200px;
  width: 100%;
  max-width: 1040px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding-bottom: 28px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--modal-pad-x);
  margin-bottom: 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.modal-close:hover {
  background: #f0f0f0;
}

.detail-body {
  width: 100%;
  padding: 0 var(--modal-pad-x);
  box-sizing: border-box;
}

.detail-grid {
  display: grid;
  grid-template-columns: var(--detail-label-w-left) minmax(0, 1fr) var(--detail-label-w-right) minmax(0, 1fr);
  column-gap: 10px 56px 12px;
  row-gap: 14px;
  width: 100%;
  align-items: start;
}

.detail-col {
  display: grid;
  grid-template-columns: subgrid;
  gap: 14px 10px;
  align-items: start;
}

.detail-col:first-of-type {
  grid-column: 1 / 3;
}

.detail-col:nth-of-type(2) {
  grid-column: 3 / 5;
}

.detail-item {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: start;
  font-size: 14px;
  line-height: 1.5;
}

.detail-item-full {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  margin-top: 16px;
  align-items: start;
}

.detail-item-full + .detail-item-full {
  margin-top: 8px;
}

.detail-item-full .detail-label {
  grid-column: 1;
  align-self: start;
  padding-top: 1px;
}

.detail-item-full .detail-content {
  grid-column: 2 / -1;
  min-width: 0;
}

.detail-label {
  color: #6b7280;
  text-align: right;
  line-height: 1.5;
}

.detail-col:first-of-type .detail-label,
.detail-item-full .detail-label {
  width: var(--detail-label-w-left);
  min-width: var(--detail-label-w-left);
}

.detail-col:nth-of-type(2) .detail-label {
  width: var(--detail-label-w-right);
  min-width: var(--detail-label-w-right);
}

.detail-value {
  color: #111827;
  min-width: 0;
  word-break: break-word;
}

.record-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.record-list li {
  font-size: 14px;
  color: #111827;
  line-height: 1.6;
  margin-bottom: 6px;
}

.record-list li:last-child {
  margin-bottom: 0;
}

.record-year {
  margin-right: 8px;
}

.remarks-text {
  font-size: 14px;
  color: #111827;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 1023px) {
  .detail-grid {
    grid-template-columns: var(--detail-label-w-left) minmax(0, 1fr);
    column-gap: 10px;
  }

  .detail-col:first-of-type,
  .detail-col:nth-of-type(2) {
    grid-column: 1 / -1;
  }

  .detail-col:nth-of-type(2) .detail-label {
    width: var(--detail-label-w-left);
    min-width: var(--detail-label-w-left);
  }

  .detail-item-full .detail-content {
    grid-column: 2;
  }
}
</style>
