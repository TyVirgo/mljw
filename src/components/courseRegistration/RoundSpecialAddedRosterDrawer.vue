<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRoundSpecialRoster } from '../../data/courseRegistration/registrationResultByRound.js'

const props = defineProps({
  visible: Boolean,
  roundKey: { type: String, default: '' },
  courseId: { type: String, default: '' },
  courseCode: { type: String, default: '' },
  courseName: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const roster = computed(() => {
  if (!props.visible || !props.roundKey || !props.courseId) return []
  return getRoundSpecialRoster(props.roundKey, props.courseId)
})

const title = computed(() => t('courseRegistration.result.specialAddedRosterTitle'))
const subtitle = computed(() => {
  const code = props.courseCode || ''
  const name = props.courseName || ''
  if (!code && !name) return ''
  return name ? `${code} · ${name}` : code
})
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    @close="emit('close')"
  >
    <p class="hint">{{ t('courseRegistration.result.specialAddedRosterHint') }}</p>
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('common.serialNo') }}</th>
          <th>{{ t('courseRegistration.monitor.studentId') }}</th>
          <th>{{ t('courseRegistration.monitor.studentName') }}</th>
          <th>{{ t('courseRegistration.monitor.programme') }}</th>
          <th>{{ t('courseRegistration.monitor.intake') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in roster" :key="row.id || row.studentId">
          <td>{{ index + 1 }}</td>
          <td>{{ row.studentId }}</td>
          <td>{{ row.studentName }}</td>
          <td>{{ row.programme || '—' }}</td>
          <td>{{ row.intake || '—' }}</td>
        </tr>
        <tr v-if="!roster.length">
          <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
        </tr>
      </tbody>
    </table>
    <p class="count-line">
      {{ t('courseRegistration.result.specialAddedRosterCount', { count: roster.length }) }}
    </p>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">
        {{ t('common.close') }}
      </button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.45;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th,
.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}
.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}
.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px 10px;
}
.count-line {
  margin: 12px 0 0;
  font-size: 13px;
  color: #4b5563;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
.btn:hover {
  background: #f9fafb;
}
</style>
