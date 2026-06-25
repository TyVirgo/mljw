<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentReadonly from './MovementAttachmentReadonly.vue'
import {
  formatWithdrawalListDate,
  formatApplicationDateDisplay,
  canEditWithdrawal,
  statusBadgeClass,
  getWithdrawalReasonDisplay,
  shouldShowIsaoNote,
} from '../../data/withdrawals.js'
import { resolveApplicationSessionForDisplay } from '../../data/movementApplicationSession.js'
import { maskPassportIc } from '../../utils/maskPassportIc.js'
import { formatMovementDate } from '../../utils/formatMovementDate.js'

const props = defineProps({
  visible: Boolean,
  item: { type: Object, default: null },
  showApprovalAction: { type: Boolean, default: false },
  maskSensitiveFields: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'edit', 'approve'])

const { t, tr } = useAppI18n()

const showEditInDetail = computed(() => props.item && canEditWithdrawal(props.item))
const showIsaoNote = computed(() => props.item && shouldShowIsaoNote(props.item.studentCategory))

function statusLabel(status) {
  const map = {
    Draft: t('withdrawal.status.draft'),
    'In Progress': t('withdrawal.status.inProgress'),
    'Update Required': t('withdrawal.status.updateRequired'),
    Approved: t('withdrawal.status.approved'),
    Rejected: t('withdrawal.status.rejected'),
    Cancelled: t('withdrawal.status.cancelled'),
  }
  return map[status] || status
}

function displayDate(item) {
  return formatWithdrawalListDate(item?.submittedAt || item?.applicationDate)
}

function formatAttendanceDate(value) {
  return formatMovementDate(value)
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
        <h2 class="modal-title">{{ t('withdrawal.form.detailTitle') }}</h2>
        <button type="button" class="close-btn" @click="emit('close')">×</button>
      </header>

      <div class="modal-body">
        <div class="meta-row">
          <span>{{ item.applicationId }}</span>
          <span :class="['status-badge', statusBadgeClass(item.status)]">{{ statusLabel(item.status) }}</span>
        </div>

        <div class="section-bar">{{ t('withdrawal.sections.studentInfo') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.name') }}</dt><dd>{{ item.fullName || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.intake') }}</dt><dd>{{ item.intake || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.nricPassport') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.programme') }}</dt><dd>{{ item.programme || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.programmeLevel') }}</dt><dd>{{ item.programmeLevel || '—' }}</dd></div>
          <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
        </dl>

        <div class="section-bar">{{ t('withdrawal.sections.studentApplication') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ t('withdrawal.fields.personalEmail') }}</dt><dd>{{ item.personalEmail || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.phoneNumber') }}</dt><dd>{{ item.phoneNumber || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.lastDateOfAttendance') }}</dt><dd>{{ formatAttendanceDate(item.lastDateOfAttendance) }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.destinationAfterLeaving') }}</dt><dd>{{ item.destinationAfterLeaving || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.mainReason') }}</dt><dd>{{ getWithdrawalReasonDisplay(item, t) || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.currentWhereabout') }}</dt><dd>{{ item.currentWhereabout || '—' }}</dd></div>
          <div class="span-2"><dt>{{ t('withdrawal.fields.detailedReason') }}</dt><dd class="multiline">{{ item.detailedReason || '—' }}</dd></div>
        </dl>

        <div class="declaration-readonly">
          <span>{{ t('withdrawal.declaration.correct') }}</span>
          <strong>{{ item.declarationAccepted ? tr('Yes') : tr('No') }}</strong>
        </div>

        <div class="section-bar">{{ t('withdrawal.sections.parentConsent') }}</div>
        <dl class="detail-grid">
          <div><dt>{{ t('withdrawal.fields.parentGuardianName') }}</dt><dd>{{ item.parentGuardianName || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.parentContactNo') }}</dt><dd>{{ item.parentContactNo || '—' }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.parentNricPassport') }}</dt><dd>{{ displayPassport(item.parentNricPassport) }}</dd></div>
          <div><dt>{{ t('withdrawal.fields.parentRelationship') }}</dt><dd>{{ item.parentRelationship || '—' }}</dd></div>
          <div class="span-2"><dt>{{ t('withdrawal.fields.parentEmail') }}</dt><dd>{{ item.parentEmail || '—' }}</dd></div>
        </dl>

        <div v-if="showIsaoNote" class="isao-note-alert">{{ t('withdrawal.isaoNoteAlert') }}</div>

        <div class="section-bar">{{ t('withdrawal.sections.documents') }}</div>
        <MovementAttachmentReadonly
          :file-name="item.attachment?.fileName || ''"
          movement-type="withdrawal"
          :student-category="item.studentCategory"
          :student-id="item.studentId"
          label-key="withdrawal.fields.uploadAttachment"
          download-label-key="withdrawal.fields.downloadConsent"
        />
      </div>

      <footer class="modal-footer">
        <span class="date-hint">{{ t('withdrawal.columns.date') }}: {{ displayDate(item) }}</span>
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

.declaration-readonly {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.isao-note-alert {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  font-size: 13px;
  color: #5b21b6;
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
