<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CreditProgressRing from './CreditProgressRing.vue'
import WeekScheduleGrid from './WeekScheduleGrid.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { runRegistrationQueue } from '../../composables/useRegistrationQueue.js'

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
  inSupplementList: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'add-supplement'])

const { t } = useAppI18n()

const title = computed(() => props.row?.studentName || '')
const subtitle = computed(() =>
  props.row ? `${props.row.studentId} · ${props.row.programme}/${props.row.intake}` : '',
)

const g1Bars = computed(() => {
  if (!props.row?.g1Progress) return []
  const { humanities, business, required } = props.row.g1Progress
  return [
    { key: 'humanities', current: humanities, required: required.humanities },
    { key: 'business', current: business, required: required.business },
  ]
})

const pendingCourse = computed(() => {
  const schedule = props.row?.schedule || []
  const slot = schedule[0]
  if (!slot) return { courseCode: 'COMP3192', courseName: 'Advanced Programming', section: '01', credits: 3 }
  return {
    courseCode: slot.course,
    courseName: slot.course,
    section: '01',
    credits: 3,
  }
})

async function handleSimulateSubmit() {
  if (!props.row) return
  try {
    await runRegistrationQueue({
      studentId: props.row.studentId,
      studentName: props.row.studentName,
      programme: props.row.programme,
      intake: props.row.intake,
      courseCode: pendingCourse.value.courseCode,
      courseName: pendingCourse.value.courseName,
      section: pendingCourse.value.section,
      credits: pendingCourse.value.credits,
      batchName: '2504 ME Course Registration',
    }, { showSuccess: false })
    window.alert(t('courseRegistration.queue.success'))
  } catch {
    // cancelled
  }
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="row">
      <div class="summary-row">
        <CreditProgressRing :current="row.credits" :min="row.creditMin" :max="row.creditMax" />
        <div class="summary-meta">
          <p v-if="row.cgpa != null">CGPA: {{ row.cgpa }}</p>
          <p>
            {{ t('common.status') }}:
            {{ t(`courseRegistration.monitor.status.${row.status}`) }}
          </p>
          <p v-for="tag in row.tags" :key="tag" class="tag">{{ tag }}</p>
        </div>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.g1Progress') }}</h4>
        <div v-for="bar in g1Bars" :key="bar.key" class="g1-bar">
          <span class="g1-label">{{ t(`courseRegistration.monitor.g1.${bar.key}`) }}</span>
          <div class="g1-track">
            <div
              class="g1-fill"
              :style="{ width: `${Math.min(100, (bar.current / bar.required) * 100)}%` }"
            />
          </div>
          <span class="g1-value">{{ bar.current }}/{{ bar.required }}</span>
        </div>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.schedule') }}</h4>
        <WeekScheduleGrid :schedule="row.schedule" />
      </div>

      <div v-if="row.issues?.length" class="section">
        <h4>{{ t('courseRegistration.monitor.issues') }}</h4>
        <ul class="issue-list">
          <li v-for="issue in row.issues" :key="issue">
            {{ t(`courseRegistration.monitor.issue.${issue}`) }}
          </li>
        </ul>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.history') }}</h4>
        <ul class="history-list">
          <li v-for="(h, i) in row.history" :key="i">{{ h.at }} — {{ h.action }}</li>
          <li v-if="!row.history?.length" class="muted">{{ t('common.noData') }}</li>
        </ul>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-primary" @click="handleSimulateSubmit">
        {{ t('courseRegistration.queue.simulateSubmit') }}
      </button>
      <button
        type="button"
        class="btn btn-outline"
        :disabled="inSupplementList"
        @click="emit('add-supplement')"
      >
        {{ inSupplementList ? t('courseRegistration.supplement.alreadyInList') : t('courseRegistration.monitor.addSupplement') }}
      </button>
      <button type="button" class="btn btn-primary" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.summary-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.summary-meta {
  font-size: 13px;
  color: #374151;
}

.summary-meta p {
  margin: 0 0 6px;
}

.tag {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 8px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 12px;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.g1-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}

.g1-label {
  width: 72px;
  color: #6b7280;
}

.g1-track {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.g1-fill {
  height: 100%;
  background: #2563eb;
}

.g1-value {
  width: 48px;
  text-align: right;
}

.issue-list,
.history-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
}

.muted {
  color: #9ca3af;
  list-style: none;
  margin-left: -18px;
}
</style>
