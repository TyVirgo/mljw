<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentReadonly from './MovementAttachmentReadonly.vue'
import {
  formatTransferListDate,
  statusBadgeClass,
} from '../../data/programmeTransfers.js'

const props = defineProps({
  visible: Boolean,
  item: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t, tr } = useAppI18n()

function statusLabel(status) {
  const map = {
    Draft: t('programmeTransfer.status.draft'),
    'In Progress': t('programmeTransfer.status.inProgress'),
    'Update Required': t('programmeTransfer.status.updateRequired'),
    Approved: t('programmeTransfer.status.approved'),
    Rejected: t('programmeTransfer.status.rejected'),
    Cancelled: t('programmeTransfer.status.cancelled'),
    Expired: t('programmeTransfer.status.expired'),
  }
  return map[status] || status
}

function displayDate(item) {
  return formatTransferListDate(item?.submittedAt || item?.applicationDate)
}
</script>

<template>
  <div v-if="visible && item" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel">
      <header class="modal-header">
        <h2 class="modal-title">{{ t('programmeTransfer.form.detailTitle') }}</h2>
        <button type="button" class="close-btn" @click="emit('close')">×</button>
      </header>

      <div class="modal-body">
        <div class="meta-row">
          <span>{{ item.applicationId }}</span>
          <span :class="['status-badge', statusBadgeClass(item.status)]">{{ statusLabel(item.status) }}</span>
        </div>

        <div class="section-bar">{{ t('programmeTransfer.sections.studentDetails') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
          <div><dt>{{ tr('Full Name') }}</dt><dd>{{ item.fullName }}</dd></div>
          <div><dt>{{ tr('NRIC/Passport No.') }}</dt><dd>{{ item.nricPassport || '—' }}</dd></div>
          <div><dt>{{ tr('Nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
          <div><dt>{{ tr('Email') }}</dt><dd>{{ item.email || '—' }}</dd></div>
          <div><dt>{{ tr('Contact No.') }}</dt><dd>{{ item.contactNo || '—' }}</dd></div>
          <div><dt>{{ t('programmeTransfer.fields.visaExpiry') }}</dt><dd>{{ item.visaExpiryDate || '—' }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('programmeTransfer.sections.transferInfo') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ t('programmeTransfer.fields.currentProgramme') }}</dt><dd>{{ item.currentProgramme || '—' }}</dd></div>
          <div><dt>{{ t('programmeTransfer.fields.currentIntake') }}</dt><dd>{{ item.currentIntake || '—' }}</dd></div>
          <div class="span-2"><dt>{{ t('programmeTransfer.fields.currentSchool') }}</dt><dd>{{ item.currentSchool || '—' }}</dd></div>
          <div><dt>{{ t('programmeTransfer.fields.newProgrammeFirst') }}</dt><dd>{{ item.newProgrammeFirstChoice || '—' }}</dd></div>
          <div><dt>{{ t('programmeTransfer.fields.newProgrammeSecond') }}</dt><dd>{{ item.newProgrammeSecondChoice || '—' }}</dd></div>
          <div><dt>{{ t('programmeTransfer.fields.startSemester') }}</dt><dd>{{ item.startSemester || '—' }}</dd></div>
          <div class="span-2"><dt>{{ t('programmeTransfer.fields.transferReason') }}</dt><dd class="multiline">{{ item.transferReason || '—' }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('programmeTransfer.sections.declaration') }}</div>
        <p class="readonly-text">{{ item.declarationAgreed ? tr('Yes') : tr('No') }}</p>

        <div class="section-bar">{{ t('programmeTransfer.sections.documents') }}</div>
        <MovementAttachmentReadonly
          :file-name="item.attachment?.fileName || ''"
          movement-type="programme-transfer"
          :student-id="item.studentId"
          label-key="programmeTransfer.fields.uploadAttachment"
          download-label-key="programmeTransfer.fields.downloadConsent"
        />
      </div>

      <footer class="modal-footer">
        <span class="date-hint">{{ t('programmeTransfer.columns.date') }}: {{ displayDate(item) }}</span>
        <div class="footer-actions">
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

.detail-grid .span-2 {
  grid-column: span 2;
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

.multiline {
  white-space: pre-wrap;
}

.readonly-text {
  margin: 0;
  font-size: 14px;
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
  color: #374151;
}

.status-expired {
  background: #f3e8ff;
  color: #7e22ce;
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
</style>
