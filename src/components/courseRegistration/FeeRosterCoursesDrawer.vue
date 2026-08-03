<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import {
  getFeeRosterCoursesByStudent,
  feeCourseSourceLabel,
  sumStudentCourseCredits,
} from '../../data/courseRegistration/feeRosterQueue.js'

const props = defineProps({
  visible: Boolean,
  student: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const courses = computed(() =>
  props.student ? getFeeRosterCoursesByStudent(props.student.studentId) : [],
)

const enrolledSum = computed(() =>
  props.student ? sumStudentCourseCredits(props.student.studentId) : 0,
)

const title = computed(() =>
  props.student
    ? t('courseRegistration.feeRoster.coursesDrawerTitle', {
        name: props.student.studentName,
        id: props.student.studentId,
      })
    : '',
)

const subtitle = computed(() => {
  if (!props.student) return ''
  const session = props.student.academicSession
    ? `${props.student.academicSession} · `
    : ''
  return `${session}${props.student.programme} · ${props.student.intake} · ${t(
    'courseRegistration.feeRoster.enrolledCredits',
  )} ${enrolledSum.value}`
})

function sectionLabel(code) {
  if (!code) return '—'
  return t('courseRegistration.courses.sectionNameDisplay', { code })
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="student">
      <div class="table-wrap">
        <table class="mini-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.courses.code') }}</th>
              <th>{{ t('courseRegistration.courses.name') }}</th>
              <th>{{ t('courseRegistration.courses.credits') }}</th>
              <th>{{ t('courseRegistration.courses.type') }}</th>
              <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
              <th>{{ t('courseRegistration.student.courseSource') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in courses" :key="row.id">
              <td>{{ index + 1 }}</td>
              <td>{{ row.courseCode }}</td>
              <td>{{ row.courseName }}</td>
              <td>{{ row.courseCredits }}</td>
              <td>{{ getRegistrationTypeLabel(row.courseType, t) }}</td>
              <td>{{ sectionLabel(row.sectionCode) }}</td>
              <td>{{ feeCourseSourceLabel(row.courseSource, t) }}</td>
            </tr>
            <tr v-if="!courses.length">
              <td colspan="7" class="empty">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.table-wrap {
  overflow: auto;
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
  white-space: nowrap;
}

.mini-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
</style>
