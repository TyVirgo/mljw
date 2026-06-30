<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentReadonly from './MovementAttachmentReadonly.vue'
import {
  formatApplicationDateDisplay,
  statusBadgeClass as defermentStatusBadge,
  getDefermentReasonDisplay,
} from '../../data/deferments.js'
import {
  statusBadgeClass as transferStatusBadge,
  getTransferReasonDisplay,
} from '../../data/programmeTransfers.js'
import { statusBadgeClass as resumptionStatusBadge } from '../../data/resumptions.js'
import {
  statusBadgeClass as withdrawalStatusBadge,
  getWithdrawalReasonDisplay,
  shouldShowIsaoNote,
} from '../../data/withdrawals.js'
import { resolveApplicationSessionForDisplay } from '../../data/movementApplicationSession.js'
import { maskPassportIc } from '../../utils/maskPassportIc.js'
import { formatMovementDate } from '../../utils/formatMovementDate.js'
import '../../styles/movement-detail-body.css'
import '../../styles/movement-status-badge.css'

const props = defineProps({
  sourceKey: { type: String, required: true },
  item: { type: Object, required: true },
  maskSensitiveFields: { type: Boolean, default: false },
})

const { t, tr } = useAppI18n()

function displayPassport(value) {
  if (!value) return '—'
  return props.maskSensitiveFields ? maskPassportIc(value) : value
}

const statusLabel = computed(() => {
  const status = props.item?.status
  const maps = {
    deferment: {
      Draft: t('deferment.status.draft'),
      'In Progress': t('deferment.status.inProgress'),
      'Update Required': t('deferment.status.updateRequired'),
      Approved: t('deferment.status.approved'),
      Rejected: t('deferment.status.rejected'),
      Cancelled: t('deferment.status.cancelled'),
    },
    'programme-transfer': {
      Draft: t('programmeTransfer.status.draft'),
      'In Progress': t('programmeTransfer.status.inProgress'),
      'Update Required': t('programmeTransfer.status.updateRequired'),
      Approved: t('programmeTransfer.status.approved'),
      Rejected: t('programmeTransfer.status.rejected'),
      Cancelled: t('programmeTransfer.status.cancelled'),
      Expired: t('programmeTransfer.status.expired'),
    },
    resumption: {
      Draft: t('resumption.status.draft'),
      'In Progress': t('resumption.status.inProgress'),
      'Update Required': t('resumption.status.updateRequired'),
      Approved: t('resumption.status.approved'),
      Rejected: t('resumption.status.rejected'),
      Cancelled: t('resumption.status.cancelled'),
    },
    withdrawal: {
      Draft: t('withdrawal.status.draft'),
      'In Progress': t('withdrawal.status.inProgress'),
      'Update Required': t('withdrawal.status.updateRequired'),
      Approved: t('withdrawal.status.approved'),
      Rejected: t('withdrawal.status.rejected'),
      Cancelled: t('withdrawal.status.cancelled'),
    },
  }
  return maps[props.sourceKey]?.[status] || status
})

const statusClass = computed(() => {
  const fn = {
    deferment: defermentStatusBadge,
    'programme-transfer': transferStatusBadge,
    resumption: resumptionStatusBadge,
    withdrawal: withdrawalStatusBadge,
  }[props.sourceKey]
  return fn ? fn(props.item?.status) : ''
})

const showIsaoNote = computed(
  () => props.sourceKey === 'withdrawal' && shouldShowIsaoNote(props.item?.studentCategory),
)
</script>

<template>
  <div class="movement-detail-body">
    <div class="meta-row">
      <span>{{ item.applicationId }}</span>
      <span :class="['status-badge', statusClass]">{{ statusLabel }}</span>
    </div>

    <!-- Deferment -->
    <template v-if="sourceKey === 'deferment'">
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
    </template>

    <!-- Programme transfer -->
    <template v-else-if="sourceKey === 'programme-transfer'">
      <div class="section-bar">{{ t('programmeTransfer.sections.studentDetails') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
        <div><dt>{{ tr('Full Name') }}</dt><dd>{{ item.fullName }}</dd></div>
        <div><dt>{{ tr('NRIC/Passport No.') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
        <div><dt>{{ tr('Nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
        <div><dt>{{ tr('Email') }}</dt><dd>{{ item.email || '—' }}</dd></div>
        <div><dt>{{ tr('Contact No.') }}</dt><dd>{{ item.contactNo || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.visaExpiry') }}</dt><dd>{{ formatMovementDate(item.visaExpiryDate) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('programmeTransfer.sections.transferInfo') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ t('programmeTransfer.fields.currentProgramme') }}</dt><dd>{{ item.currentProgramme || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.currentIntake') }}</dt><dd>{{ item.currentIntake || '—' }}</dd></div>
        <div class="span-2"><dt>{{ t('programmeTransfer.fields.currentSchool') }}</dt><dd>{{ item.currentSchool || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.newProgrammeFirst') }}</dt><dd>{{ item.newProgrammeFirstChoice || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.newProgrammeSecond') }}</dt><dd>{{ item.newProgrammeSecondChoice || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.startSemester') }}</dt><dd>{{ item.startSemester || '—' }}</dd></div>
        <div class="span-2"><dt>{{ t('programmeTransfer.fields.transferReason') }}</dt><dd>{{ getTransferReasonDisplay(item) || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('programmeTransfer.sections.declaration') }}</div>
      <p class="readonly-text">{{ item.declarationAgreed ? tr('Yes') : tr('No') }}</p>
      <div class="section-bar">{{ t('programmeTransfer.sections.documents') }}</div>
      <MovementAttachmentReadonly
        :file-name="item.attachment?.fileName || ''"
        movement-type="programme-transfer"
        :student-id="item.studentId"
        :programme-level="item.programmeLevel"
        :application-session="item.applicationSession"
        label-key="programmeTransfer.fields.uploadAttachment"
        download-label-key="programmeTransfer.fields.downloadConsent"
      />
    </template>

    <!-- Resumption -->
    <template v-else-if="sourceKey === 'resumption'">
      <div class="section-bar">{{ t('resumption.sections.studentInfo') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
        <div><dt>{{ t('resumption.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
        <div><dt>{{ t('resumption.fields.name') }}</dt><dd>{{ item.fullName || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.originalIntake') }}</dt><dd>{{ item.originalIntake || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.programme') }}</dt><dd>{{ item.programme || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.programmeLevel') }}</dt><dd>{{ item.programmeLevel || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.nricPassport') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
        <div><dt>{{ t('resumption.fields.nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
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
        :programme-level="item.programmeLevel"
        :application-session="item.applicationSession"
        label-key="resumption.fields.uploadAttachment"
        download-label-key="resumption.fields.downloadConsent"
      />
      <div class="section-bar">{{ tr('Declaration') }}</div>
      <p class="readonly-text">{{ item.declarationCorrect ? tr('Yes') : tr('No') }} — {{ t('resumption.declaration.correct') }}</p>
      <p class="readonly-text">{{ item.declarationMaxDuration ? tr('Yes') : tr('No') }} — {{ t('resumption.declaration.maxDuration') }}</p>
    </template>

    <!-- Withdrawal -->
    <template v-else-if="sourceKey === 'withdrawal'">
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
        <div><dt>{{ t('withdrawal.fields.lastDateOfAttendance') }}</dt><dd>{{ formatMovementDate(item.lastDateOfAttendance) }}</dd></div>
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
        :programme-level="item.programmeLevel"
        :application-session="item.applicationSession"
        label-key="withdrawal.fields.uploadAttachment"
        download-label-key="withdrawal.fields.downloadConsent"
      />
    </template>
  </div>
</template>
