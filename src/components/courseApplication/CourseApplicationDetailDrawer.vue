<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ApprovalTimeline from '../common/ApprovalTimeline.vue'
import CourseApplicationWizard from '../courseApplication/CourseApplicationWizard.vue'
import CourseChangeWizard from '../courseChange/CourseChangeWizard.vue'
import CourseApprovalModal from '../courseApproval/CourseApprovalModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { buildCourseTimelineNodes } from '../../utils/buildApprovalTimelineNodes.js'
import { approvalStageOptions } from '../../data/courseApplications.js'
import { applyApprovalDecisions } from '../../data/courseApproval.js'
import { applyChangeApprovalDecisions } from '../../data/courseChangeApproval.js'

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
  variant: { type: String, default: 'course' },
  allApplications: { type: Array, default: () => [] },
  formalCourses: { type: Array, default: () => [] },
  showApproveAction: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'decided'])

const { t } = useAppI18n()

const approvalModalVisible = ref(false)

const liveApplication = computed(() => {
  if (!props.application) return null
  const fresh = props.allApplications.find((row) => row.id === props.application.id)
  return fresh || props.application
})

const timelineNodes = computed(() =>
  buildCourseTimelineNodes(liveApplication.value, approvalStageOptions),
)

const drawerSubtitle = computed(() => {
  const item = liveApplication.value
  if (!item) return ''
  const code = item.courseCode || item.sourceCourseCode || ''
  const name = item.courseName || item.applicant || ''
  return [code, name].filter(Boolean).join(' · ')
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) approvalModalVisible.value = false
  },
)

function handleClose() {
  emit('close')
}

function openApprovalModal() {
  approvalModalVisible.value = true
}

function handleApprovalConfirm({ action, comment }) {
  const item = liveApplication.value
  if (!item) return

  const result =
    props.variant === 'change'
      ? applyChangeApprovalDecisions(
          [item.id],
          action,
          comment,
          props.allApplications,
          props.formalCourses,
        )
      : applyApprovalDecisions(
          [item.id],
          action,
          comment,
          props.allApplications,
          props.formalCourses,
        )

  approvalModalVisible.value = false
  emit('decided', result)
  emit('close')
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible && !!liveApplication"
    :title="t('common.details')"
    :subtitle="drawerSubtitle"
    @close="handleClose"
  >
    <ApprovalTimeline :nodes="timelineNodes" />
    <h3 class="detail-section-title">{{ t('common.details') }}</h3>
    <div class="embedded-wizard">
      <CourseApplicationWizard
        v-if="variant === 'course'"
        mode="detail"
        embedded
        :all-applications="allApplications"
        :initial-application="liveApplication"
      />
      <CourseChangeWizard
        v-else
        mode="detail"
        embedded
        :courses="formalCourses"
        :initial-application="liveApplication"
      />
    </div>

    <template #footer>
      <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.close') }}</button>
      <button v-if="showApproveAction" type="button" class="btn btn-primary" @click="openApprovalModal">
        {{ t('movementApproval.approve') }}
      </button>
    </template>
  </ApplicationDetailDrawer>

  <CourseApprovalModal
    :visible="approvalModalVisible"
    :approval-stage="liveApplication?.approvalStage || ''"
    :target-count="1"
    @close="approvalModalVisible = false"
    @confirm="handleApprovalConfirm"
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

.embedded-wizard :deep(.course-application-wizard),
.embedded-wizard :deep(.course-change-wizard) {
  min-height: auto;
  padding: 0;
  background: transparent;
}

.embedded-wizard :deep(.wizard-top) {
  display: none;
}
</style>
