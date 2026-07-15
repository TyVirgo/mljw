import { ref } from 'vue'

export const coursesBatchFilter = ref('')

export function setCoursesBatchFilter(batchId) {
  coursesBatchFilter.value = batchId || ''
}

export function clearCoursesBatchFilter() {
  coursesBatchFilter.value = ''
}
