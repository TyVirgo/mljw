<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentReadonly from './MovementAttachmentReadonly.vue'
import {
  formatDefermentListDate,
  formatApplicationDateDisplay,
  canEditDeferment,
  statusBadgeClass,
  getDefermentReasonDisplay,
} from '../../data/deferments.js'
import { resolveApplicationSessionForDisplay } from '../../data/movementApplicationSession.js'
import { maskPassportIc } from '../../utils/maskPassportIc.js'

const props = defineProps({
  visible: Boolean,
  item: { type: Object, default: null },
  showApprovalAction: { type: Boolean, default: false },
  maskSensitiveFields: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'edit', 'approve'])

const { t, tr } = useAppI18n()

const showEditInDetail = computed(() => props.item && canEditDeferment(props.item))

function statusLabel(status) {
  const map = {
    Draft: t('deferment.status.draft'),
    'In Progress': t('deferment.status.inProgress'),
    'Update Required': t('deferment.status.updateRequired'),
    Approved: t('deferment.status.approved'),
    Rejected: t('deferment.status.rejected'),
    Cancelled: t('deferment.status.cancelled'),
  }
  return map[status] || status
}

function displayDate(item) {
  return formatDefermentListDate(item?.submittedAt || item?.applicationDate)
}

function displayPassport(value) {
  if (!value) return '—'
  return props.maskSensitiveFields ? maskPassportIc(value) : value
}
</script>

<template>
  <div v-if="visible && item" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel">
      <header class="modal-header">
        <h2 class="modal-title">{{ t('deferment.form.detailTitle') }}</h2>
        <button type="button" class="close-btn" @click="emit('close')">×</button>
      </header>

      <div class="modal-body">
        <div class="meta-row">
          <span>{{ item.applicationId }}</span>
          <span :class="['status-badge', statusBadgeClass(item.status)]">{{ statusLabel(item.status) }}</span>
        </div>

        <div class="section-bar">{{ t('deferment.sections.studentInfo') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
          <div><dt>{{ t('deferment.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
          <div><dt>{{ t('deferment.fields.name') }}</dt><dd>{{ item.fullName || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.intake') }}</dt><dd>{{ item.intake || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.nricPassport') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
          <div><dt>{{ t('deferment.fields.nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.programme') }}</dt><dd>{{ item.programme || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.programmeLevel') }}</dt><dd>{{ item.programmeLevel || '—' }}</dd></div>
          <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('deferment.sections.studentApplication') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ t('deferment.fields.personalEmail') }}</dt><dd>{{ item.personalEmail || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.phoneNumber') }}</dt><dd>{{ item.phoneNumber || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.accommodationRoomNo') }}</dt><dd>{{ item.accommodationRoomNo || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.defermentPeriod') }}</dt><dd>{{ item.defermentPeriod || '—' }}</dd></div>
          <div class="span-2"><dt>{{ t('deferment.fields.mainReason') }}</dt><dd>{{ getDefermentReasonDisplay(item, t) || '—' }}</dd></div>
          <div class="span-2"><dt>{{ t('deferment.fields.detailedReason') }}</dt><dd class="multiline">{{ item.detailedReason || '—' }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('deferment.sections.parentConsent') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ t('deferment.fields.parentGuardianName') }}</dt><dd>{{ item.parentGuardianName || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.parentContactNo') }}</dt><dd>{{ item.parentContactNo || '—' }}</dd></div>
          <div><dt>{{ t('deferment.fields.parentNricPassport') }}</dt><dd>{{ displayPassport(item.parentNricPassport) }}</dd></div>
          <div><dt>{{ t('deferment.fields.parentRelationship') }}</dt><dd>{{ item.parentRelationship || '—' }}</dd></div>
          <div class="span-2"><dt>{{ t('deferment.fields.parentEmail') }}</dt><dd>{{ item.parentEmail || '—' }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('deferment.sections.documents') }}</div>
        <MovementAttachmentReadonly
          :file-name="item.attachment?.fileName || ''"
          movement-type="deferment"
          :student-id="item.studentId"
          :programme-level="item.programmeLevel"
          :application-session="item.applicationSession"
          label-key="deferment.fields.uploadAttachment"
          download-label-key="deferment.fields.downloadConsent"
        />
      </div>

      <footer class="modal-footer">
        <span class="date-hint">{{ t('deferment.columns.date') }}: {{ displayDate(item) }}</span>
        <div class="footer-actions">
          <button v-if="showEditInDetail" type="button" class="btn btn-primary" @click="emit('edit', item)">
            {{ t('common.edit') }}
          </button>
          <button
            v-if="showApprovalAction"
            type="button"
            class="btn btn-primary"
            @click="emit('approve')"
          >
            {{ t('movementApproval.approve') }}
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
