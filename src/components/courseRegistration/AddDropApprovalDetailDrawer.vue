<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ApprovalTimeline from '../common/ApprovalTimeline.vue'
import AddDropApprovalModal from './AddDropApprovalModal.vue'
import AddDropApplicationDetailBody from './AddDropApplicationDetailBody.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  decideAddDropApplication,
  getAddDropApplicationById,
  addDropApplicationHasBillableFee,
} from '../../data/courseRegistration/addDropApprovalQueue.js'
import { buildAddDropTimelineNodes } from '../../utils/buildApprovalTimelineNodes.js'

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
  /** approve | readonly */
  mode: { type: String, default: 'readonly' },
})

const emit = defineEmits(['close', 'updated'])

const { t, tr } = useAppI18n()
const approvalModalVisible = ref(false)

const liveApp = computed(() => {
  if (!props.application?.id) return props.application
  return getAddDropApplicationById(props.application.id) || props.application
})

const timelineNodes = computed(() => buildAddDropTimelineNodes(liveApp.value))

const title = computed(() => t('common.details'))
const subtitle = computed(() => {
  const app = liveApp.value
  if (!app) return ''
  return [app.applicationNo, app.studentName].filter(Boolean).join(' · ')
})

const canReview = computed(() => props.mode === 'approve' && liveApp.value?.status === 'Pending')

const showGenerateBill = computed(() => addDropApplicationHasBillableFee(liveApp.value))

watch(
  () => props.visible,
  (v) => {
    if (!v) approvalModalVisible.value = false
  },
)

function openApprovalModal() {
  approvalModalVisible.value = true
}

async function handleApprovalConfirm({ action, comment, generateBill }) {
  const app = liveApp.value
  if (!app) return

  const result = decideAddDropApplication(app.id, action, comment, { generateBill })
  if (!result.ok) {
    window.alert(tr(result.errorKey || 'common.error'))
    return
  }
  approvalModalVisible.value = false
  emit('updated')
  emit('close')
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="liveApp">
      <ApprovalTimeline :nodes="timelineNodes" />

      <AddDropApplicationDetailBody :application="liveApp" :show-attachment-export="true" />
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
      <button v-if="canReview" type="button" class="btn btn-primary" @click="openApprovalModal">
        {{ t('courseRegistration.approval.approve') }}
      </button>
    </template>
  </ApplicationDetailDrawer>

  <AddDropApprovalModal
    :visible="approvalModalVisible"
    approval-stage="Academic Coordinator"
    :target-count="1"
    :show-generate-bill="showGenerateBill"
    @close="approvalModalVisible = false"
    @confirm="handleApprovalConfirm"
  />
</template>
