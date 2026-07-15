<script setup>
import { computed } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import WeekScheduleGrid from '../../../components/courseRegistration/WeekScheduleGrid.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import {
  studentSchedule,
  getStudentEnrolledCourses,
  studentConfirmedCourses,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { getStudentMonitorRow } from '../../../data/courseRegistration/studentRegistrationContext.js'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t } = useAppI18n()

const monitorRow = computed(() => getStudentMonitorRow())

const schedule = computed(() => {
  if (studentSchedule.value.length) return studentSchedule.value
  return monitorRow.value.schedule || []
})

const enrolledList = computed(() => {
  if (studentConfirmedCourses.value.length) {
    return studentConfirmedCourses.value.map((item) => ({
      courseCode: item.courseCode,
      courseName: item.courseName,
      sectionCode: item.sectionCode,
      time: item.time,
      classTime: item.classTime || item.time,
      weekRange: item.weekRange || '—',
      room: item.room || '—',
      credits: item.credits,
      lecturer: item.lecturer,
    }))
  }
  return getStudentEnrolledCourses().map((item) => ({
    courseCode: item.courseCode,
    courseName: item.courseName || item.courseCode,
    sectionCode: item.sectionCode || '—',
    time: item.time || '—',
    classTime: item.classTime || item.time || '—',
    weekRange: item.weekRange || '—',
    room: item.room || '—',
    credits: item.credits ?? '—',
    lecturer: item.lecturer || '—',
  }))
})
</script>

<template>
  <StudentPageShell page-id="crs-schedule">
    <div class="page-card">
      <h3 class="cr-student-section-title">{{ t('courseRegistration.student.mySchedule') }}</h3>
      <WeekScheduleGrid v-if="schedule.length" :schedule="schedule" />
      <p v-else class="cr-student-empty">{{ t('courseRegistration.student.noSchedule') }}</p>

      <div class="table-section cr-student-table-gap">
        <h4>{{ t('courseRegistration.student.enrolledCourses') }}</h4>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
              <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
              <th>{{ t('courseRegistration.courses.lecturer') }}</th>
              <th>
                {{ t('courseRegistration.courses.weekRange') }}
                <span class="hint-popover-wrap" style="margin-left: 2px">
                  <span class="hint-popover-trigger" tabindex="0" role="button">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z" />
                    </svg>
                  </span>
                  <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                    {{ t('courseRegistration.courses.weekRangeHint') }}
                  </span>
                </span>
              </th>
              <th>
                {{ t('courseRegistration.courses.classTime') }}
                <span class="hint-popover-wrap" style="margin-left: 2px">
                  <span class="hint-popover-trigger" tabindex="0" role="button">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z" />
                    </svg>
                  </span>
                  <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                    {{ t('courseRegistration.courses.classTimeHint') }}
                  </span>
                </span>
              </th>
              <th>{{ t('courseRegistration.courses.room') }}</th>
              <th>{{ t('courseRegistration.courses.credits') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in enrolledList" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.courseCode }}</td>
                <td>{{ item.courseName }}</td>
                <td>{{ item.sectionCode }}</td>
                <td>{{ item.lecturer || '—' }}</td>
                <td>{{ item.weekRange || '—' }}</td>
                <td>{{ item.classTime || item.time }}</td>
                <td>{{ item.room || '—' }}</td>
                <td>{{ item.credits }}</td>
              </tr>
              <tr v-if="!enrolledList.length">
                <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </StudentPageShell>
</template>
