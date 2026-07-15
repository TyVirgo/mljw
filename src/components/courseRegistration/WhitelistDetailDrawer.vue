<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { advanceWhitelistApproval, getWhitelistById } from '../../data/courseRegistration/whitelistQueue.js'

const props = defineProps({
  visible: Boolean,
  item: { type: Object, default: null },
})

const emit = defineEmits(['close', 'updated'])

const { t } = useAppI18n()

const liveItem = computed(() => (props.item ? getWhitelistById(props.item.id) || props.item : null))

const title = computed(() => liveItem.value?.studentName || '')
const subtitle = computed(() =>
  liveItem.value ? `${liveItem.value.studentId} · ${t(`courseRegistration.whitelist.types.${liveItem.value.type}`)}` : '',
)

const canApprove = computed(() =>
  liveItem.value && !['boaApproved', 'rejected', 'draft'].includes(liveItem.value.status),
)

function handleApprove() {
  if (!liveItem.value) return
  advanceWhitelistApproval(liveItem.value.id, 'Approved')
  emit('updated')
}

function handleReject() {
  if (!liveItem.value) return
  advanceWhitelistApproval(liveItem.value.id, 'Rejected')
  emit('updated')
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="liveItem">
      <dl class="detail-dl">
        <dt>{{ t('courseRegistration.courses.code') }}</dt>
        <dd>{{ liveItem.courseCode }}</dd>
        <dt>{{ t('courseRegistration.whitelist.reason') }}</dt>
        <dd>{{ liveItem.reason }}</dd>
        <dt>{{ t('courseRegistration.whitelist.stage') }}</dt>
        <dd>{{ t(`courseRegistration.whitelist.stages.${liveItem.currentStage}`) }}</dd>
        <dt>{{ t('common.status') }}</dt>
        <dd>{{ t(`courseRegistration.whitelist.status.${liveItem.status}`) }}</dd>
        <dt>{{ t('courseRegistration.approval.submittedAt') }}</dt>
        <dd>{{ liveItem.submittedAt }}</dd>
      </dl>

      <div v-if="liveItem.approvalLog?.length" class="section">
        <h4>{{ t('courseRegistration.approval.log') }}</h4>
        <ul>
          <li v-for="(log, i) in liveItem.approvalLog" :key="i">
            {{ log.at }} — {{ t(`courseRegistration.whitelist.stages.${log.stage}`) }} — {{ log.actor }} — {{ log.action }}
          </li>
        </ul>
      </div>

      <div class="flow-hint">
        AC {{ t('courseRegistration.whitelist.stages.acReview') }}
        → HOP {{ t('courseRegistration.whitelist.stages.hopReview') }}
        → BOA {{ t('courseRegistration.whitelist.stages.boaApproved') }}
      </div>
    </template>

    <template v-if="canApprove" #footer>
      <button type="button" class="btn btn-default" @click="handleReject">{{ t('courseRegistration.approval.reject') }}</button>
      <button type="button" class="btn btn-primary" @click="handleApprove">{{ t('courseRegistration.whitelist.advance') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.detail-dl { display: grid; grid-template-columns: 120px 1fr; gap: 10px; font-size: 13px; margin-bottom: 16px; }
.detail-dl dt { color: #6b7280; }
.section h4 { margin: 0 0 8px; font-size: 14px; }
.section ul { margin: 0; padding-left: 18px; font-size: 13px; }
.flow-hint { font-size: 12px; color: #6b7280; padding: 10px; background: #f9fafb; border-radius: 6px; }
</style>
