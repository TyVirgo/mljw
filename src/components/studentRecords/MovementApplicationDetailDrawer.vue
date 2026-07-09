<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import MovementDetailExportBody from './MovementDetailExportBody.vue'
import MovementApprovalModal from './MovementApprovalModal.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { findInStore } from '../../data/movementStore.js'
import {
  applyMovementDecision,
  canRecallMovement,
  recallMovementDecision,
  validateApprovalForm,
} from '../../data/movementApprovalEngine.js'
import { resolveProgrammeTransferOfficeUseDefaults } from '../../data/programmeTransfers.js'
import { exportMovementDetailPdf } from '../../utils/exportMovementDetailPdf.js'
import { buildMovementFormPdfFilename } from '../../utils/movementExportNames.js'

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
  enableExportPdf: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'decided', 'recalled'])

const { t, tr } = useAppI18n()

const approvalModalVisible = ref(false)
const recallConfirmVisible = ref(false)
const exportContentRef = ref(null)
const exportingPdf = ref(false)
const officeUseFields = ref(resolveProgrammeTransferOfficeUseDefaults())

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

const showReviewAction = computed(() => props.mode === 'approve')

const showOfficeUseEditable = computed(
  () => resolvedSourceKey.value === 'programme-transfer' && showReviewAction.value,
)

const showOfficeUseReadonly = computed(() => {
  if (resolvedSourceKey.value !== 'programme-transfer') return false
  if (props.mode === 'student' || showOfficeUseEditable.value) return false
  return liveItem.value?.status === 'Approved'
})

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
      exportingPdf.value = false
    }
  },
)

watch(
  () => [props.visible, liveItem.value?.id],
  () => {
    if (props.visible && liveItem.value) {
      officeUseFields.value = resolveProgrammeTransferOfficeUseDefaults(liveItem.value)
    }
  },
  { immediate: true },
)

function handleClose() {
  emit('close')
}

function openApprovalModal() {
  approvalModalVisible.value = true
}

function handleApprovalConfirm({ action, comment }) {
  if (!props.queueItem) return
  const validationItem = {
    ...liveItem.value,
    sourceKey: resolvedSourceKey.value,
    ...officeUseFields.value,
  }
  const errors = validateApprovalForm(action, comment, validationItem)
  if (errors.adminNewProgramme) {
    window.alert(tr(errors.adminNewProgramme))
    return
  }
  applyMovementDecision(
    resolvedSourceKey.value,
    liveItem.value,
    action,
    comment,
    props.currentRole,
    officeUseFields.value,
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

async function handleExportPdf() {
  if (!exportContentRef.value || !liveItem.value) return
  exportingPdf.value = true
  try {
    const filename = buildMovementFormPdfFilename(resolvedSourceKey.value, liveItem.value)
    await exportMovementDetailPdf(exportContentRef.value, filename)
  } finally {
    exportingPdf.value = false
  }
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible && !!liveItem && !!resolvedSourceKey"
    :title="t('common.details')"
    :subtitle="drawerSubtitle"
    @close="handleClose"
  >
    <div ref="exportContentRef">
      <MovementDetailExportBody
        :source-key="resolvedSourceKey"
        :item="liveItem"
        :mask-sensitive-fields="maskSensitiveFields"
        :show-office-use-editable="showOfficeUseEditable"
        :show-office-use-readonly="showOfficeUseReadonly"
        v-model:office-use-fields="officeUseFields"
      />
    </div>

    <template #footer>
      <button
        v-if="enableExportPdf"
        type="button"
        class="btn btn-outline"
        :disabled="exportingPdf"
        @click="handleExportPdf"
      >
        {{ t('movementExport.exportPdf') }}
      </button>
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
.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
