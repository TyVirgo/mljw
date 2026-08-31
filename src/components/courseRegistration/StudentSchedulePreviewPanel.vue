<script setup>
import WeekScheduleGrid from './WeekScheduleGrid.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  title: { type: String, default: '' },
  schedule: { type: Array, default: () => [] },
  hint: { type: String, default: '' },
  /** 抽屉/表单内嵌时更紧凑，去掉大块灰底占位感 */
  embedded: { type: Boolean, default: false },
  /** 展示图层图例（学生课表抽屉默认开） */
  showLegend: { type: Boolean, default: true },
})

const { t } = useAppI18n()
</script>

<template>
  <div class="schedule-preview-panel" :class="{ 'is-embedded': embedded }">
    <div v-if="title || hint" class="schedule-preview-head">
      <h4 v-if="title" class="schedule-preview-title">{{ title }}</h4>
      <p v-if="hint" class="schedule-preview-hint">{{ hint }}</p>
    </div>
    <WeekScheduleGrid
      v-if="schedule.length"
      :schedule="schedule"
      :show-legend="showLegend"
      :stretch="embedded"
    />
    <p v-else class="schedule-preview-empty">{{ t('courseRegistration.student.schedulePreviewEmpty') }}</p>
  </div>
</template>

<style scoped>
.schedule-preview-panel {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.schedule-preview-panel.is-embedded {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.schedule-preview-head {
  margin-bottom: 8px;
}

.schedule-preview-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.schedule-preview-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.schedule-preview-empty {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}
</style>
