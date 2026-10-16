<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ApprovalTimeline from '../common/ApprovalTimeline.vue'
import AddDropApplicationDetailBody from './AddDropApplicationDetailBody.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  getAddDropApplicationById,
  ensureApplicationItems,
} from '../../data/courseRegistration/addDropApprovalQueue.js'
import { buildAddDropTimelineNodes } from '../../utils/buildApprovalTimelineNodes.js'

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
  /** approve | readonly — 审批入口已改列表行内，详情仅只读 */
  mode: { type: String, default: 'readonly' },
})

const emit = defineEmits(['close', 'updated'])

const { t } = useAppI18n()

const liveApp = computed(() => {
  if (!props.application?.id) return ensureApplicationItems(props.application)
  const raw = getAddDropApplicationById(props.application.id) || props.application
  return ensureApplicationItems(raw)
})

const timelineNodes = computed(() => buildAddDropTimelineNodes(liveApp.value))

const title = computed(() => t('common.details'))
const subtitle = computed(() => {
  const app = liveApp.value
  if (!app) return ''
  return [app.applicationNo, app.studentName].filter(Boolean).join(' · ')
})
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="liveApp">
      <ApprovalTimeline :nodes="timelineNodes" />

      <AddDropApplicationDetailBody :application="liveApp" />
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>
