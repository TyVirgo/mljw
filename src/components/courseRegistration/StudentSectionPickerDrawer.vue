<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseSectionCard from './CourseSectionCard.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  visible: Boolean,
  course: { type: Object, default: null },
})

const emit = defineEmits(['close', 'select'])

const { t } = useAppI18n()

const title = computed(() => props.course?.name || '')
const subtitle = computed(() =>
  props.course ? `${props.course.code} · ${props.course.credits} cr` : '',
)

function handleSelect(section) {
  if (!props.course || section.enrolled >= section.capacity) return
  emit('select', { course: props.course, section })
  emit('close')
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    @close="emit('close')"
  >
    <p class="picker-hint">{{ t('courseRegistration.student.sectionPickerHint') }}</p>
    <div v-if="course" class="section-list">
      <CourseSectionCard
        v-for="section in course.sections"
        :key="section.id"
        :section="section"
        :section-code-label="t('courseRegistration.courses.sectionCode')"
        @select="handleSelect"
      />
    </div>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.picker-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
