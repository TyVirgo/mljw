<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentsReadonly from './MovementAttachmentsReadonly.vue'
import MovementParentConsentReadonly from './MovementParentConsentReadonly.vue'
import MovementInternationalStudentRemarks from './MovementInternationalStudentRemarks.vue'
import MovementDeclarationSection from './MovementDeclarationSection.vue'
import MovementApplicantNotes from './MovementApplicantNotes.vue'
import {
  defermentDeclarationItems,
  programmeTransferDeclarationItems,
  resumptionDeclarationItems,
  withdrawalDeclarationItems,
} from '../../data/movementDeclarationItems.js'
import {
  defermentApplicantNoteKeys,
  programmeTransferApplicantNoteKeys,
  resumptionApplicantNoteKeys,
  withdrawalApplicantNoteKeys,
} from '../../data/movementApplicantNotes.js'
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
} from '../../data/withdrawals.js'
import { resolveApplicationSessionForDisplay, resolveCurrentAcademicSessionForDisplay } from '../../data/movementApplicationSession.js'
import { maskPassportIc } from '../../utils/maskPassportIc.js'
import { formatMovementDate } from '../../utils/formatMovementDate.js'
import {
  displayMovementVisaExpiry,
  resolveMovementStudentCategory,
} from '../../utils/movementVisaExpiry.js'
import '../../styles/movement-detail-body.css'
import '../../styles/movement-status-badge.css'
import '../../styles/movement-form.css'

const props = defineProps({
  sourceKey: { type: String, required: true },
  item: { type: Object, required: true },
  maskSensitiveFields: { type: Boolean, default: false },
  useDemoAttachments: { type: Boolean, default: false },
  showAttachmentExport: { type: Boolean, default: false },
})

const { t, tr } = useAppI18n()

function displayPassport(value) {
  if (!value) return '—'
  return props.maskSensitiveFields ? maskPassportIc(value) : value
}

function visaExpiryDisplay(item) {
  return displayMovementVisaExpiry(item?.visaExpiryDate, resolveMovementStudentCategory(item))
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
</script>

<template>
  <div class="movement-detail-body">
    <div class="meta-row">
      <span>{{ item.applicationId }}</span>
      <span :class="['status-badge', statusClass]">{{ statusLabel }}</span>
    </div>

    <!-- Deferment -->
    <template v-if="sourceKey === 'deferment'">
      <MovementApplicantNotes
        title-key="deferment.notes.title"
        :item-keys="defermentApplicantNoteKeys"
      />
      <MovementInternationalStudentRemarks
        source-key="deferment"
        :student-category="resolveMovementStudentCategory(item)"
      />
      <div class="section-bar">{{ t('deferment.sections.studentInfo') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
        <div><dt>{{ t('deferment.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.currentAcademicSession') }}</dt><dd>{{ resolveCurrentAcademicSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('deferment.fields.name') }}</dt><dd>{{ item.fullName || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.intake') }}</dt><dd>{{ item.intake || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.nricPassport') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
        <div><dt>{{ t('deferment.fields.nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.programme') }}</dt><dd>{{ item.programme || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.programmeLevel') }}</dt><dd>{{ item.programmeLevel || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.visaExpiry') }}</dt><dd>{{ visaExpiryDisplay(item) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.personalEmail') }}</dt><dd>{{ item.personalEmail || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.phoneNumber') }}</dt><dd>{{ item.phoneNumber || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.accommodationRoomNo') }}</dt><dd>{{ item.accommodationRoomNo || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('deferment.sections.studentApplication') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ t('deferment.fields.defermentPeriod') }}</dt><dd>{{ item.defermentPeriod || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.mainReason') }}</dt><dd>{{ getDefermentReasonDisplay(item, t) || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.defermentStartDate') }}</dt><dd>{{ item.defermentStartDate || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.defermentEndDate') }}</dt><dd>{{ item.defermentEndDate || '—' }}</dd></div>
        <div class="span-2"><dt>{{ t('deferment.fields.detailedReason') }}</dt><dd class="multiline">{{ item.detailedReason || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('deferment.sections.parentConsent') }}</div>
      <MovementParentConsentReadonly
        source-key="deferment"
        :item="item"
        :display-passport="displayPassport"
      />
      <div class="section-bar">{{ t('deferment.sections.documents') }}</div>
      <MovementAttachmentsReadonly
        source-key="deferment"
        :item="item"
        :use-demo-attachments="useDemoAttachments"
        :show-attachment-export="showAttachmentExport"
      />
      <MovementDeclarationSection
        read-only
        :section-title="t('deferment.sections.declaration')"
        :items="defermentDeclarationItems"
        :checkboxes="[{ field: 'declarationAgreed' }]"
        :form="item"
      />
    </template>

    <!-- Programme transfer -->
    <template v-else-if="sourceKey === 'programme-transfer'">
      <MovementApplicantNotes
        title-key="programmeTransfer.notes.title"
        :item-keys="programmeTransferApplicantNoteKeys"
      />
      <MovementInternationalStudentRemarks
        source-key="programme-transfer"
        :student-category="resolveMovementStudentCategory(item)"
      />
      <div class="section-bar">{{ t('programmeTransfer.sections.studentDetails') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
        <div><dt>{{ tr('Full Name') }}</dt><dd>{{ item.fullName }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.currentAcademicSession') }}</dt><dd>{{ resolveCurrentAcademicSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
        <div><dt>{{ tr('NRIC/Passport No.') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
        <div><dt>{{ tr('Nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.personalEmail') }}</dt><dd>{{ item.personalEmail || item.email || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.phoneNumber') }}</dt><dd>{{ item.phoneNumber || item.contactNo || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.visaExpiry') }}</dt><dd>{{ visaExpiryDisplay(item) }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.currentProgramme') }}</dt><dd>{{ item.currentProgramme || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.currentIntake') }}</dt><dd>{{ item.currentIntake || '—' }}</dd></div>
        <div class="span-2"><dt>{{ t('programmeTransfer.fields.currentSchool') }}</dt><dd>{{ item.currentSchool || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('programmeTransfer.sections.studentApplication') }}</div>
      <dl class="detail-grid">
        <div class="span-2"><dt>{{ t('programmeTransfer.fields.startSemester') }}</dt><dd>{{ item.startSemester || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.newProgrammeFirst') }}</dt><dd>{{ item.newProgrammeFirstChoice || '—' }}</dd></div>
        <div><dt>{{ t('programmeTransfer.fields.newProgrammeSecond') }}</dt><dd>{{ item.newProgrammeSecondChoice || '—' }}</dd></div>
        <div class="span-2"><dt>{{ t('programmeTransfer.fields.transferReason') }}</dt><dd class="multiline">{{ getTransferReasonDisplay(item) || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('programmeTransfer.sections.documents') }}</div>
      <MovementAttachmentsReadonly
        source-key="programme-transfer"
        :item="item"
        :use-demo-attachments="useDemoAttachments"
        :show-attachment-export="showAttachmentExport"
      />
      <MovementDeclarationSection
        read-only
        :section-title="t('programmeTransfer.sections.declaration')"
        :items="programmeTransferDeclarationItems"
        :checkboxes="[{ field: 'declarationAgreed' }]"
        :form="item"
      />
    </template>

    <!-- Resumption -->
    <template v-else-if="sourceKey === 'resumption'">
      <MovementApplicantNotes
        title-key="resumption.notes.title"
        :item-keys="resumptionApplicantNoteKeys"
      />
      <MovementInternationalStudentRemarks
        source-key="resumption"
        :student-category="resolveMovementStudentCategory(item)"
      />
      <div class="section-bar">{{ t('resumption.sections.studentInfo') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
        <div><dt>{{ t('resumption.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.currentAcademicSession') }}</dt><dd>{{ resolveCurrentAcademicSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('resumption.fields.name') }}</dt><dd>{{ item.fullName || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.originalIntake') }}</dt><dd>{{ item.originalIntake || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.programme') }}</dt><dd>{{ item.programme || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.programmeLevel') }}</dt><dd>{{ item.programmeLevel || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.nricPassport') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
        <div><dt>{{ t('resumption.fields.nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.visaExpiry') }}</dt><dd>{{ visaExpiryDisplay(item) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.personalEmail') }}</dt><dd>{{ item.personalEmail || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.phoneNumber') }}</dt><dd>{{ item.phoneNumber || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('resumption.sections.studentApplication') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ t('resumption.fields.defermentSemester') }}</dt><dd>{{ item.defermentSemester || '—' }}</dd></div>
        <div><dt>{{ t('resumption.fields.resumptionSemester') }}</dt><dd>{{ item.resumptionSemester || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.defermentStartDate') }}</dt><dd>{{ item.defermentStartDate || '—' }}</dd></div>
        <div><dt>{{ t('deferment.fields.defermentEndDate') }}</dt><dd>{{ item.defermentEndDate || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('resumption.sections.documents') }}</div>
      <MovementAttachmentsReadonly
        source-key="resumption"
        :item="item"
        :use-demo-attachments="useDemoAttachments"
        :show-attachment-export="showAttachmentExport"
      />
      <MovementDeclarationSection
        read-only
        :section-title="t('resumption.sections.declaration')"
        :items="resumptionDeclarationItems"
        :checkboxes="[{ field: 'declarationAgreed' }]"
        :form="item"
      />
    </template>

    <!-- Withdrawal -->
    <template v-else-if="sourceKey === 'withdrawal'">
      <MovementApplicantNotes
        title-key="withdrawal.notes.title"
        :item-keys="withdrawalApplicantNoteKeys"
        variant="instructional"
      />
      <MovementInternationalStudentRemarks
        source-key="withdrawal"
        :student-category="resolveMovementStudentCategory(item)"
      />
      <div class="section-bar">{{ t('withdrawal.sections.studentInfo') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ tr('Student ID') }}</dt><dd>{{ item.studentId }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.dateOfApplication') }}</dt><dd>{{ formatApplicationDateDisplay(item.dateOfApplication) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.currentAcademicSession') }}</dt><dd>{{ resolveCurrentAcademicSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.applicationAcademicSession') }}</dt><dd>{{ resolveApplicationSessionForDisplay(item) }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.name') }}</dt><dd>{{ item.fullName || '—' }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.intake') }}</dt><dd>{{ item.intake || '—' }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.nricPassport') }}</dt><dd>{{ displayPassport(item.nricPassport) }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.nationality') }}</dt><dd>{{ item.nationality || '—' }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.programme') }}</dt><dd>{{ item.programme || '—' }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.programmeLevel') }}</dt><dd>{{ item.programmeLevel || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.visaExpiry') }}</dt><dd>{{ visaExpiryDisplay(item) }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.personalEmail') }}</dt><dd>{{ item.personalEmail || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.phoneNumber') }}</dt><dd>{{ item.phoneNumber || '—' }}</dd></div>
        <div><dt>{{ t('movementCommon.fields.accommodationRoomNo') }}</dt><dd>{{ item.accommodationRoomNo || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('withdrawal.sections.studentApplication') }}</div>
      <dl class="detail-grid">
        <div><dt>{{ t('withdrawal.fields.currentWhereabout') }}</dt><dd>{{ item.currentWhereabout || '—' }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.destinationAfterLeaving') }}</dt><dd>{{ item.destinationAfterLeaving || '—' }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.lastDateOfAttendance') }}</dt><dd>{{ formatMovementDate(item.lastDateOfAttendance) }}</dd></div>
        <div><dt>{{ t('withdrawal.fields.mainReason') }}</dt><dd>{{ getWithdrawalReasonDisplay(item, t) || '—' }}</dd></div>
        <div class="span-2"><dt>{{ t('withdrawal.fields.detailedReason') }}</dt><dd class="multiline">{{ item.detailedReason || '—' }}</dd></div>
      </dl>
      <div class="section-bar">{{ t('withdrawal.sections.parentConsent') }}</div>
      <MovementParentConsentReadonly
        source-key="withdrawal"
        :item="item"
        :display-passport="displayPassport"
      />
      <div class="section-bar">{{ t('withdrawal.sections.documents') }}</div>
      <MovementAttachmentsReadonly
        source-key="withdrawal"
        :item="item"
        :use-demo-attachments="useDemoAttachments"
        :show-attachment-export="showAttachmentExport"
      />
      <MovementDeclarationSection
        read-only
        :section-title="t('withdrawal.sections.declaration')"
        :items="withdrawalDeclarationItems"
        :checkboxes="[{ field: 'declarationAccepted' }]"
        :form="item"
      />
    </template>
  </div>
</template>
