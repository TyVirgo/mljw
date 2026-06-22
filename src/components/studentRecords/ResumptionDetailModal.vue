<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentReadonly from './MovementAttachmentReadonly.vue'
import {
  formatResumptionListDate,
  formatApplicationDateDisplay,
  canEditResumption,
  statusBadgeClass,
} from '../../data/resumptions.js'

const props = defineProps({
  visible: Boolean,
  item: { type: Object, default: null },
})

const emit = defineEmits(['close', 'edit'])

const { t, tr } = useAppI18n()

const showEditInDetail = computed(() => props.item && canEditResumption(props.item))

function statusLabel(status) {
  const map = {
    Draft: t('resumption.status.draft'),
    'In Progress': t('resumption.status.inProgress'),
    'Update Required': t('resumption.status.updateRequired'),
    Approved: t('resumption.status.approved'),
    Rejected: t('resumption.status.rejected'),
    Cancelled: t('resumption.status.cancelled'),
  }
  return map[status] || status
}

function displayDate(item) {
  return formatResumptionListDate(item?.submittedAt || item?.applicationDate)
}
</script>

<template>
  <div v-if="visible && item" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel">
      <header class="modal-header">
        <h2 class="modal-title">{{ t('resumption.form.detailTitle') }}</h2>
        <button type="button" class="close-btn" @click="emit('close')">×</button>
      </header>

      <div class="modal-body">
        <div class="meta-row">
          <span>{{ item.applicationId }}</span>
          <span :class="['status-badge', statusBadgeClass(item.status)]">{{ statusLabel(item.status) }}</span>
        </div>

        <div class="section-bar">{{ t('resumption.sections.studentInfo') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
          <div><dt>{{ t('resumption.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
          <div><dt>{{ t('resumption.fields.name') }}</dt><dd>{{ item.fullName || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.originalIntake') }}</dt><dd>{{ item.originalIntake || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.programme') }}</dt><dd>{{ item.programme || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.programmeLevel') }}</dt><dd>{{ item.programmeLevel || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.nricPassport') }}</dt><dd>{{ item.nricPassport || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('resumption.sections.resumptionDetails') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ t('resumption.fields.personalEmail') }}</dt><dd>{{ item.personalEmail || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.phoneNumber') }}</dt><dd>{{ item.phoneNumber || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.defermentSemester') }}</dt><dd>{{ item.defermentSemester || '—' }}</dd></div>
          <div><dt>{{ t('resumption.fields.resumptionSemester') }}</dt><dd>{{ item.resumptionSemester || '—' }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('resumption.sections.documents') }}</div>
        <MovementAttachmentReadonly
          :file-name="item.attachment?.fileName || ''"
          movement-type="resumption"
          :student-id="item.studentId"
          label-key="resumption.fields.uploadAttachment"
          download-label-key="resumption.fields.downloadConsent"
        />

        <div class="section-bar">{{ tr('Declaration') }}</div>
        <p class="readonly-text">{{ item.declarationCorrect ? tr('Yes') : tr('No') }} — {{ t('resumption.declaration.correct') }}</p>
        <p class="readonly-text">{{ item.declarationMaxDuration ? tr('Yes') : tr('No') }} — {{ t('resumption.declaration.maxDuration') }}</p>
      </div>

      <footer class="modal-footer">
        <span class="date-hint">{{ t('resumption.columns.date') }}: {{ displayDate(item) }}</span>
        <div class="footer-actions">
          <button v-if="showEditInDetail" type="button" class="btn btn-primary" @click="emit('edit', item)">
            {{ t('common.edit') }}
          </button>
          <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-panel {
  background: #fff;
  border-radius: 12px;
  width: min(920px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 16px 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.date-hint {
  font-size: 13px;
  color: #6b7280;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.section-bar {
  background: #f3f4f6;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin: 16px 0 12px;
  border-radius: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 0;
}

.detail-grid dt {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.detail-grid dd {
  margin: 0;
  font-size: 14px;
  color: #111827;
}

.readonly-text {
  margin: 0 0 8px;
  font-size: 13px;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-draft {
  background: #f3f4f6;
  color: #4b5563;
}

.status-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-update-required {
  background: #ffedd5;
  color: #c2410c;
}

.status-approved {
  background: #dcfce7;
  color: #15803d;
}

.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.status-cancelled {
  background: #e5e7eb;
  color: #6b7280;
}

.btn {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}
</style>
