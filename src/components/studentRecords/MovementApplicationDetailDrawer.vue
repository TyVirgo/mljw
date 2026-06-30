<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ApprovalTimeline from '../common/ApprovalTimeline.vue'
import MovementDetailContent from './MovementDetailContent.vue'
import MovementApprovalModal from './MovementApprovalModal.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { findInStore } from '../../data/movementStore.js'
import { buildMovementTimelineNodes } from '../../utils/buildApprovalTimelineNodes.js'
import {
  applyMovementDecision,
  canRecallMovement,
  recallMovementDecision,
} from '../../data/movementApprovalEngine.js'

const props = defineProps({
  visible: Boolean,
  /** Admin queue row { sourceKey, id, raw, applicationId, fullName, ... } */
  queueItem: { type: Object, default: null },
  /** Direct open from student list */
  sourceKey: { type: String, default: '' },
  item: { type: Object, default: null },
  mode: { type: String, default: 'readonly' },
  currentRole: { type: String, default: '' },
  maskSensitiveFields: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'decided', 'recalled'])

const { t } = useAppI18n()

const approvalModalVisible = ref(false)
const recallConfirmVisible = ref(false)

const resolvedSourceKey = computed(() => props.queueItem?.sourceKey || props.sourceKey || '')
const liveItem = computed(() => {
  if (props.queueItem) {
    const fresh = findInStore(props.queueItem.sourceKey, props.queueItem.id)
    return fresh || props.queueItem.raw
  }
  return props.item
})

const drawerSubtitle = computed(() => {
  const item = liveItem.value
  if (!item) return ''
  const id = item.applicationId || props.queueItem?.applicationId || ''
  const name = item.fullName || item.name || props.queueItem?.fullName || ''
  return [id, name].filter(Boolean).join(' · ')
})

const timelineNodes = computed(() =>
  buildMovementTimelineNodes(liveItem.value, resolvedSourceKey.value),
)

const showReviewAction = computed(() => props.mode === 'approve')

const canRecall = computed(() =>
  props.mode === 'history' && props.queueItem
    ? canRecallMovement(resolvedSourceKey.value, liveItem.value, props.currentRole)
    : false,
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      approvalModalVisible.value = false
      recallConfirmVisible.value = false
    }
  },
)

function handleClose() {
  emit('close')
}

function openApprovalModal() {
  approvalModalVisible.value = true
}

function handleApprovalConfirm({ action, comment }) {
  if (!props.queueItem) return
  applyMovementDecision(
    resolvedSourceKey.value,
    liveItem.value,
    action,
    comment,
    props.currentRole,
  )
  approvalModalVisible.value = false
  emit('decided')
  emit('close')
}

function confirmRecall() {
  recallConfirmVisible.value = false
  if (!props.queueItem) return
  recallMovementDecision(resolvedSourceKey.value, liveItem.value, props.currentRole)
  emit('recalled')
  emit('close')
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible && !!liveItem && !!resolvedSourceKey"
    :title="t('common.details')"
    :subtitle="drawerSubtitle"
    @close="handleClose"
  >
    <ApprovalTimeline :nodes="timelineNodes" />
    <h3 class="detail-section-title">{{ t('common.details') }}</h3>
    <MovementDetailContent
      :source-key="resolvedSourceKey"
      :item="liveItem"
      :mask-sensitive-fields="maskSensitiveFields"
    />

    <template #footer>
      <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.close') }}</button>
      <button v-if="canRecall" type="button" class="btn btn-outline" @click="recallConfirmVisible = true">
        {{ t('movementApproval.recall') }}
      </button>
      <button v-if="showReviewAction" type="button" class="btn btn-primary" @click="openApprovalModal">
        {{ t('movementApproval.approve') }}
      </button>
    </template>
  </ApplicationDetailDrawer>

  <MovementApprovalModal
    :visible="approvalModalVisible"
    :approval-stage="liveItem?.approvalStage || ''"
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
</template>

<style scoped>
.detail-section-title {
  margin: 0 0 12px;
  padding-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  border-top: 1px solid #e5e7eb;
}
</style>
