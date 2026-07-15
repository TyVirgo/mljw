<script setup>
import { computed } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { listStudentWaitlistEntries } from '../../../data/courseRegistration/waitlistQueue.js'
import { getStudentProfileFields } from '../../../data/courseRegistration/studentRegistrationStore.js'
import { getActiveBatch } from '../../../data/courseRegistration/registrationBatches.js'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t } = useAppI18n()

const studentFields = computed(() => getStudentProfileFields())
const activeBatch = computed(() => getActiveBatch())
const myEntries = computed(() => listStudentWaitlistEntries(studentFields.value.studentId))

function statusLabel(status) {
  const key = `courseRegistration.waitlist.entryStatus.${status}`
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : status
}
</script>

<template>
  <StudentPageShell page-id="crs-waitlist">
    <div class="page-card">
      <div class="cr-waitlist-toolbar">
        <strong v-if="activeBatch">{{ activeBatch.name }}</strong>
      </div>

      <CourseRegistrationCallout variant="info">
        <ul>
          <li>{{ t('courseRegistration.student.waitlistReadonlyHint') }}</li>
          <li>{{ t('courseRegistration.student.waitlistReadonlyJoinHint') }}</li>
        </ul>
      </CourseRegistrationCallout>

      <div class="table-section">
        <div class="cr-student-panel-header">
          <h3 class="cr-student-section-title">{{ t('courseRegistration.student.myWaitlist') }}</h3>
          <span class="cr-student-panel-meta">{{ myEntries.length }}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.waitlist.position') }}</th>
                <th>{{ t('courseRegistration.approval.status') }}</th>
                <th>{{ t('courseRegistration.waitlist.submittedAt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, index) in myEntries" :key="entry.id">
                <td>{{ index + 1 }}</td>
                <td>{{ entry.courseCode }}</td>
                <td>{{ entry.courseName }}</td>
                <td>#{{ entry.position }}</td>
                <td>{{ statusLabel(entry.status) }}</td>
                <td>{{ entry.submittedAt }}</td>
              </tr>
              <tr v-if="!myEntries.length">
                <td colspan="6" class="empty-cell">{{ t('courseRegistration.student.noWaitlist') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </StudentPageShell>
</template>

<style scoped>
.cr-waitlist-toolbar {
  margin-bottom: 12px;
  font-size: 14px;
  color: #111827;
}

.cr-waitlist-toolbar strong {
  font-weight: 600;
}

.cr-student-section-title {
  margin: 0;
}
</style>
