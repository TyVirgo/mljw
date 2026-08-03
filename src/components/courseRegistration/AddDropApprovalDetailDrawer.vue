<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ApprovalTimeline from '../common/ApprovalTimeline.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import AddDropApprovalModal from './AddDropApprovalModal.vue'
import AddDropApplicationDetailBody from './AddDropApplicationDetailBody.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { runRegistrationQueue } from '../../composables/useRegistrationQueue.js'
import {
  buildAddDropValidation,
  decideAddDropApplication,
  getAddDropApplicationById,
} from '../../data/courseRegistration/addDropApprovalQueue.js'
import { getActiveBatch } from '../../data/courseRegistration/registrationBatches.js'
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

const validation = computed(() => (liveApp.value ? buildAddDropValidation(liveApp.value) : null))

const timelineNodes = computed(() => buildAddDropTimelineNodes(liveApp.value))

const title = computed(() => t('common.details'))
const subtitle = computed(() => {
  const app = liveApp.value
  if (!app) return ''
  return [app.applicationNo, app.studentName].filter(Boolean).join(' · ')
})

const canReview = computed(() => props.mode === 'approve' && liveApp.value?.status === 'Pending')

const showGenerateBill = computed(() => {
  const fee = (liveApp.value?.items || []).reduce((sum, i) => sum + (i.fee || 0), 0)
  return fee > 0
})

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

  if (action === 'Approved') {
    const addItem = app.items?.find((i) => i.action === 'Add' || i.action === 'Retake')
    if (addItem) {
      try {
        await runRegistrationQueue(
          {
            studentId: app.studentId,
            studentName: app.studentName,
            programme: app.programme,
            intake: app.intake,
            courseCode: addItem.courseCode,
            courseName: addItem.courseName || addItem.courseCode,
            section: addItem.section || '01',
            credits: addItem.credits,
            batchName: getActiveBatch()?.name || '',
          },
          { showSuccess: false },
        )
      } catch {
        return
      }
    }
  }

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
    <template v-if="liveApp && validation">
      <ApprovalTimeline :nodes="timelineNodes" />

      <div class="student-card">
        <p>
          {{ liveApp.programme }}/{{ liveApp.intake }} ·
          {{ t('courseRegistration.monitor.credits') }} {{ liveApp.currentCredits }}/{{ liveApp.creditMax }}
        </p>
      </div>

      <AddDropApplicationDetailBody :application="liveApp" :show-attachment-export="true" />

      <div class="section validation-box">
        <div class="section-bar">{{ t('courseRegistration.approval.validation') }}</div>
        <CourseRegistrationCallout
          v-if="liveApp.items?.some((i) => i.action === 'Add' || i.action === 'Retake')"
          variant="rule"
        >
          <p>{{ t('courseRegistration.queue.tip') }}</p>
        </CourseRegistrationCallout>
        <p :class="validation.creditOk ? 'ok' : 'fail'">
          {{ validation.creditOk ? '✓' : '✗' }}
          {{ t('courseRegistration.approval.creditsAfter', { value: validation.creditsAfter }) }}
        </p>
        <p :class="!validation.conflict ? 'ok' : 'fail'">
          {{ !validation.conflict ? '✓' : '✗' }}
          {{ t('courseRegistration.approval.scheduleCheck') }}
        </p>
        <p v-if="validation.suggestedOrder" class="hint">
          {{ t('courseRegistration.approval.suggestedOrder') }}: {{ validation.suggestedOrder }}
        </p>
        <p v-if="validation.retakePriority" class="hint">
          {{ t('courseRegistration.approval.retakePriority') }}: Retake {{ validation.retakePriority }}
        </p>
      </div>
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

<style scoped>
.student-card {
  margin: 12px 0 16px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
}

.student-card p {
  margin: 0;
}

.section {
  margin-top: 8px;
  margin-bottom: 16px;
}

.section-bar {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.validation-box .ok {
  color: #15803d;
  font-size: 13px;
  margin: 6px 0;
}

.validation-box .fail {
  color: #b91c1c;
  font-size: 13px;
  margin: 6px 0;
}

.validation-box .hint {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0;
}
</style>
