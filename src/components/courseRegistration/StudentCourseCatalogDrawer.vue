<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseCodeSourcePopover from './CourseCodeSourcePopover.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import { getSchoolElectiveCategoryLabel } from '../../data/departments.js'
import '../../styles/course-registration-list.css'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

const { t, isZh } = useAppI18n()

/** 默认按课程代码字典序（课号首字母 → 整码） */
const sortedCourses = computed(() =>
  [...props.courses].sort((a, b) =>
    String(a.code || '').localeCompare(String(b.code || ''), undefined, { sensitivity: 'base' }),
  ),
)
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="t('courseRegistration.student.courseCatalogTitle')"
    :subtitle="t('courseRegistration.student.courseCatalogSubtitle', { count: sortedCourses.length })"
    @close="emit('close')"
  >
    <div class="cr-list-page cr-catalog-drawer">
      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.schoolElectiveCategory') }}</th>
                <th>{{ t('courseRegistration.courses.type') }}</th>
                <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in sortedCourses" :key="course.id || course.code">
                <td class="nowrap">
                  <CourseCodeSourcePopover :code="course.code" :course="course" />
                </td>
                <td>{{ course.name }}</td>
                <td class="nowrap">
                  {{ getSchoolElectiveCategoryLabel(course.schoolElectiveCategory, isZh) }}
                </td>
                <td class="nowrap">{{ getRegistrationTypeLabel(course.type, t) }}</td>
                <td class="col-credits">{{ course.credits }}</td>
              </tr>
              <tr v-if="!sortedCourses.length">
                <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-primary" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.cr-catalog-drawer {
  padding: 0;
  min-height: 0;
}

.cr-catalog-drawer :deep(.table-section) {
  margin: 0;
}

.cr-catalog-drawer :deep(.table-wrap) {
  margin: 0;
}

.col-credits {
  text-align: right;
  width: 72px;
}

.nowrap {
  white-space: nowrap;
}
</style>
