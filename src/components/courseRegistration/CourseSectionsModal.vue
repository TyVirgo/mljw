<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getCourseById } from '../../data/courseRegistration/selectableCourses.js'
import { displayVenue } from '../../data/courseRegistration/sectionScheduleFields.js'

const props = defineProps({
  visible: Boolean,
  course: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const liveCourse = computed(() => {
  if (!props.course?.id) return props.course
  return getCourseById(props.course.id) || props.course
})

const title = computed(() => t('courseRegistration.courses.sectionsDetailTitle'))

const subtitle = computed(() => {
  if (!liveCourse.value) return ''
  return `${liveCourse.value.code} · ${liveCourse.value.name}`
})
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="course-sections-drawer"
    @close="emit('close')"
  >
    <table v-if="liveCourse" class="mini-table">
      <thead>
        <tr>
          <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
          <th>{{ t('courseRegistration.courses.lecturer') }}</th>
          <th>{{ t('courseRegistration.courses.weekRange') }}</th>
          <th>{{ t('courseRegistration.courses.classTime') }}</th>
          <th>{{ t('courseRegistration.courses.room') }}</th>
          <th>{{ t('courseRegistration.courses.enrolled') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sec in liveCourse.sections || []" :key="sec.id">
          <td>{{ sec.code }}</td>
          <td>{{ sec.lecturer || '—' }}</td>
          <td>{{ sec.weekRange || '—' }}</td>
          <td>
            {{ sec.classTime || sec.time }}
            <ExternalDataHint source-key="scheduling" />
          </td>
          <td>{{ displayVenue(sec) }}</td>
          <td>{{ sec.enrolled }}/{{ sec.capacity }}</td>
        </tr>
        <tr v-if="!(liveCourse.sections || []).length">
          <td colspan="6" class="empty">{{ t('common.noData') }}</td>
        </tr>
      </tbody>
    </table>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.course-sections-drawer :deep(.drawer-panel) {
  width: min(900px, 94vw);
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
  font-weight: 600;
  color: #374151;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px 10px !important;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d9d9d9;
}
</style>
