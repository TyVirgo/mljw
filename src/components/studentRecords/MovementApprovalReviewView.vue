<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import MovementApprovalModal from './MovementApprovalModal.vue'
import DefermentDetailModal from './DefermentDetailModal.vue'
import ResumptionDetailModal from './ResumptionDetailModal.vue'
import WithdrawalDetailModal from './WithdrawalDetailModal.vue'
import ProgrammeTransferDetailModal from './ProgrammeTransferDetailModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { findInStore } from '../../data/movementStore.js'
import {
  applyMovementDecision,
  canRecallMovement,
  recallMovementDecision,
  validateApprovalForm,
} from '../../data/movementApprovalEngine.js'

const props = defineProps({
  queueItem: { type: Object, required: true },
  mode: { type: String, default: 'readonly' },
  currentRole: { type: String, required: true },
  maskSensitiveFields: { type: Boolean, default: false },
})

const emit = defineEmits(['back', 'decided', 'recalled'])

const { t, tr } = useAppI18n()

const approvalModalVisible = ref(false)
const recallConfirmVisible = ref(false)
const pendingOfficeUse = ref({})

const liveItem = computed(() => {
  const fresh = findInStore(props.queueItem.sourceKey, props.queueItem.id)
  return fresh || props.queueItem.raw
})

const showApprovalAction = computed(() => props.mode === 'approve')

const canRecall = computed(() =>
  props.mode === 'history'
    ? canRecallMovement(props.queueItem.sourceKey, liveItem.value, props.currentRole)
    : false,
)

function openApprovalModal(officeUse = {}) {
  pendingOfficeUse.value = officeUse
  approvalModalVisible.value = true
}

function handleApprovalConfirm({ action, comment }) {
  const validationItem = {
    ...liveItem.value,
    sourceKey: props.queueItem.sourceKey,
    ...pendingOfficeUse.value,
  }
  const errors = validateApprovalForm(action, comment, validationItem)
  if (errors.adminNewProgramme) {
    window.alert(tr(errors.adminNewProgramme))
    approvalModalVisible.value = false
    return
  }
  applyMovementDecision(
    props.queueItem.sourceKey,
    liveItem.value,
    action,
    comment,
    props.currentRole,
    pendingOfficeUse.value,
  )
  approvalModalVisible.value = false
  pendingOfficeUse.value = {}
  emit('decided')
}

function confirmRecall() {
  recallConfirmVisible.value = false
  recallMovementDecision(props.queueItem.sourceKey, liveItem.value, props.currentRole)
  emit('recalled')
}
</script>

<template>
  <div class="review-page">
    <header class="review-header">
      <button type="button" class="back-btn" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ t('common.back') }}
      </button>
      <span class="review-title">{{ t(`movementApproval.viewModes.${mode}`) }}</span>
    </header>

    <div class="review-detail-host">
      <ProgrammeTransferDetailModal
        v-if="queueItem.sourceKey === 'programme-transfer'"
        :visible="true"
        :item="liveItem"
        :show-approval-action="showApprovalAction"
        :mask-sensitive-fields="maskSensitiveFields"
        @close="emit('back')"
        @approve="openApprovalModal"
      />
      <DefermentDetailModal
        v-else-if="queueItem.sourceKey === 'deferment'"
        :visible="true"
        :item="liveItem"
        :show-approval-action="showApprovalAction"
        :mask-sensitive-fields="maskSensitiveFields"
        @close="emit('back')"
        @approve="openApprovalModal"
      />
      <ResumptionDetailModal
        v-else-if="queueItem.sourceKey === 'resumption'"
        :visible="true"
        :item="liveItem"
        :show-approval-action="showApprovalAction"
        :mask-sensitive-fields="maskSensitiveFields"
        @close="emit('back')"
        @approve="openApprovalModal"
      />
      <WithdrawalDetailModal
        v-else-if="queueItem.sourceKey === 'withdrawal'"
        :visible="true"
        :item="liveItem"
        :show-approval-action="showApprovalAction"
        :mask-sensitive-fields="maskSensitiveFields"
        @close="emit('back')"
        @approve="openApprovalModal"
      />
    </div>

    <section v-if="mode === 'history' && canRecall" class="recall-section">
      <button type="button" class="btn btn-outline" @click="recallConfirmVisible = true">
        {{ t('movementApproval.recall') }}
      </button>
      <p class="recall-hint">{{ t('movementApproval.recallHint') }}</p>
    </section>

    <MovementApprovalModal
      :visible="approvalModalVisible"
      :approval-stage="liveItem.approvalStage || ''"
      :target-count="1"
      @close="approvalModalVisible = false"
      @confirm="handleApprovalConfirm"
    />

    <ConfirmDialog
      :visible="recallConfirmVisible"
      :title="t('movementApproval.recallConfirmTitle')"
      :message="t('movementApproval.recallConfirmMessage')"
      :confirm-text="t('movementApproval.recall')"
      confirm-variant="primary"
      @confirm="confirmRecall"
      @cancel="recallConfirmVisible = false"
    />
  </div>
</template>

<style scoped>
.review-page {
  height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 16px 28px 32px;
  box-sizing: border-box;
  background: #f3f4f6;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.review-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.review-detail-host :deep(.modal-overlay) {
  position: static;
  inset: auto;
  background: transparent;
  padding: 0;
  z-index: auto;
  display: block;
}

.review-detail-host :deep(.modal-panel) {
  max-height: none;
  width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.recall-section {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px 24px;
}

.recall-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
