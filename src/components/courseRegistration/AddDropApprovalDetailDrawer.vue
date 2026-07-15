<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { runRegistrationQueue } from '../../composables/useRegistrationQueue.js'
import {
  buildAddDropValidation,
  approveAddDropApplication,
  rejectAddDropApplication,
} from '../../data/courseRegistration/addDropApprovalQueue.js'

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'updated'])

const { t, tr } = useAppI18n()
const comment = ref('')
const generateBill = ref(true)

watch(
  () => props.visible,
  (v) => {
    if (v) {
      comment.value = ''
      generateBill.value = true
    }
  },
)

const validation = computed(() =>
  props.application ? buildAddDropValidation(props.application) : null,
)

const title = computed(() => props.application?.applicationNo || '')
const subtitle = computed(() =>
  props.application
    ? `${props.application.studentId} ${props.application.studentName}`
    : '',
)

async function handleApprove() {
  const app = props.application
  const addItem = app?.items?.find((i) => i.action === 'Add' || i.action === 'Retake')
  if (addItem) {
    try {
      await runRegistrationQueue({
        studentId: app.studentId,
        studentName: app.studentName,
        programme: app.programme,
        intake: app.intake,
        courseCode: addItem.courseCode,
        courseName: addItem.courseCode,
        section: addItem.section || '01',
        credits: addItem.credits,
        batchName: '2504 ME Course Registration',
      }, { showSuccess: false })
    } catch {
      return
    }
  }
  const result = approveAddDropApplication(app.id, comment.value, generateBill.value)
  if (!result.ok) {
    window.alert(tr(result.errorKey))
    return
  }
  emit('updated')
}

function handleReject() {
  rejectAddDropApplication(props.application.id, comment.value)
  emit('updated')
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="application && validation">
      <div class="student-card">
        <p>
          {{ application.programme }}/{{ application.intake }} ·
          {{ t('courseRegistration.monitor.credits') }} {{ application.currentCredits }}/{{ application.creditMax }}
        </p>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.approval.content') }}</h4>
        <table class="mini-table">
          <thead>
            <tr>
              <th>{{ t('courseRegistration.approval.action') }}</th>
              <th>{{ t('courseRegistration.courses.code') }}</th>
              <th>{{ t('courseRegistration.courses.credits') }}</th>
              <th>{{ t('courseRegistration.courses.time') }}</th>
              <th>{{ t('courseRegistration.approval.fee') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in application.items" :key="i">
              <td>
                {{ item.action }}
                <span v-if="item.retakeGrade" class="retake-tag">{{ item.retakeGrade }}</span>
              </td>
              <td>{{ item.courseCode }}</td>
              <td>{{ item.credits }}</td>
              <td>{{ item.time }} <ExternalDataHint source-key="scheduling" /></td>
              <td>{{ item.fee ? `RM ${item.fee}` : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section validation-box">
        <h4>{{ t('courseRegistration.approval.validation') }}</h4>
        <CourseRegistrationCallout v-if="application.items?.some((i) => i.action === 'Add' || i.action === 'Retake')" variant="rule">
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

      <div v-if="!readonly" class="section">
        <h4>{{ t('courseRegistration.approval.decision') }}</h4>
        <label>{{ t('courseRegistration.approval.comment') }}</label>
        <textarea v-model="comment" class="form-textarea" rows="2" />
        <label class="checkbox-row">
          <input v-model="generateBill" type="checkbox" />
          {{ t('courseRegistration.approval.generateBill') }}
          <ExternalDataHint source-key="finance" />
        </label>
      </div>

      <div v-if="application.approvalLog?.length" class="section">
        <h4>{{ t('courseRegistration.approval.log') }}</h4>
        <ul>
          <li v-for="(log, i) in application.approvalLog" :key="i">
            {{ log.at }} — {{ log.actor }} — {{ log.action }}
          </li>
        </ul>
      </div>
    </template>

    <template v-if="!readonly" #footer>
      <button type="button" class="btn btn-default" @click="handleReject">{{ t('courseRegistration.approval.reject') }}</button>
      <button type="button" class="btn btn-primary" @click="handleApprove">{{ t('courseRegistration.approval.approve') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.student-card {
  background: #f9fafb;
  padding: 12px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}

.section {
  margin-bottom: 18px;
}

.section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mini-table th,
.mini-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
}

.mini-table th {
  background: #f9fafb;
}

.retake-tag {
  margin-left: 4px;
  padding: 1px 6px;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 11px;
}

.validation-box p {
  margin: 6px 0;
  font-size: 13px;
}

.ok { color: #047857; }
.fail { color: #b91c1c; }
.hint { color: #6b7280; font-size: 12px; }

.form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin: 8px 0 12px;
  font-size: 13px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
</style>
