<script setup>
import { computed, ref } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import RoundTimelineBar from '../../../components/courseRegistration/RoundTimelineBar.vue'
import ExternalDataHint from '../../../components/courseRegistration/ExternalDataHint.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { buildStudentRegistrationResults } from '../../../data/courseRegistration/registrationResult.js'
import { registrationMonitorQueue } from '../../../data/courseRegistration/registrationMonitorQueue.js'
import {
  getStudentProfileFields,
  studentConfirmedCourses,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { getActiveBatch } from '../../../data/courseRegistration/registrationBatches.js'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t } = useAppI18n()
const syncMessage = ref('')

const studentFields = computed(() => getStudentProfileFields())
const activeBatch = computed(() => getActiveBatch())

const resultRow = computed(() => {
  const all = buildStudentRegistrationResults(registrationMonitorQueue.value)
  const fromMonitor = all.find((row) => row.studentId === studentFields.value.studentId)
  if (fromMonitor) return fromMonitor
  if (studentConfirmedCourses.value.length) {
    const credits = studentConfirmedCourses.value.reduce((sum, item) => sum + item.credits, 0)
    return {
      studentId: studentFields.value.studentId,
      studentName: studentFields.value.studentName,
      programme: studentFields.value.programme,
      intake: studentFields.value.intake,
      credits,
      courseCount: studentConfirmedCourses.value.length,
      courses: studentConfirmedCourses.value.map((item) => item.courseCode).join(', '),
      status: 'confirmed',
    }
  }
  return null
})

const courseRows = computed(() => {
  if (studentConfirmedCourses.value.length) {
    return studentConfirmedCourses.value.map((item, index) => ({
      id: index,
      code: item.courseCode,
      name: item.courseName,
      section: item.sectionCode,
      lecturer: item.lecturer || '—',
      weekRange: item.weekRange || '—',
      time: item.classTime || item.time,
      room: item.room || '—',
      credits: item.credits,
    }))
  }
  if (!resultRow.value?.courses) return []
  return resultRow.value.courses.split(',').map((code, index) => ({
    id: index,
    code: code.trim(),
    name: code.trim(),
    section: '—',
    lecturer: '—',
    weekRange: '—',
    time: '—',
    room: '—',
    credits: '—',
  }))
})

function handleSyncStudyPlan() {
  if (!resultRow.value) return
  if (!window.confirm(t('courseRegistration.result.syncConfirm'))) return
  syncMessage.value = t('courseRegistration.result.syncSuccess')
}
</script>

<template>
  <StudentPageShell page-id="crs-result">
    <RoundTimelineBar highlight-key="main" />

    <div class="page-card">
      <p v-if="activeBatch" class="page-note">
        <strong>{{ activeBatch.name }}</strong> — {{ t('courseRegistration.student.resultHint') }}
        <ExternalDataHint source-key="studyPlan" />
      </p>
      <p class="page-note page-note--secondary">{{ t('courseRegistration.student.resultRoundNote') }}</p>

      <div v-if="resultRow" class="toolbar">
        <button type="button" class="btn btn-outline" @click="handleSyncStudyPlan">
          {{ t('courseRegistration.result.syncStudyPlan') }}
        </button>
      </div>
      <p v-if="syncMessage" class="cr-student-message">{{ syncMessage }}</p>

      <div v-if="courseRows.length" class="table-section">
        <h3 class="cr-student-section-title">{{ t('courseRegistration.student.enrolledCourses') }}</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTime') }}</th>
                <th>{{ t('courseRegistration.courses.room') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in courseRows" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td>{{ row.code }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.section }}</td>
                <td>{{ row.lecturer }}</td>
                <td>{{ row.weekRange }}</td>
                <td>{{ row.time }}</td>
                <td>{{ row.room }}</td>
                <td>{{ row.credits }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p v-else class="cr-student-empty">{{ t('courseRegistration.student.noResult') }}</p>
    </div>
  </StudentPageShell>
</template>
