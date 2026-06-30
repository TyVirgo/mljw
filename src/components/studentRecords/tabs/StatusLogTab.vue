<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { formatStatusLogDate } from '../../../utils/formatMovementDate.js'

const props = defineProps({
  form: { type: Object, required: true },
})

const { t, tr } = useAppI18n()

const entries = computed(() =>
  Array.isArray(props.form.statusLogs) ? props.form.statusLogs : [],
)

function formatMovementCategory(entry) {
  if (entry.movementCategoryKey) {
    const translated = t(entry.movementCategoryKey)
    if (translated !== entry.movementCategoryKey) return translated
  }
  if (entry.movementCategory) return tr(entry.movementCategory)
  return '—'
}
</script>

<template>
  <div class="status-log-tab">
    <table v-if="entries.length" class="status-log-table">
      <thead>
        <tr>
          <th>{{ t('studentProfile.statusLog.status') }}</th>
          <th>{{ t('studentProfile.statusLog.dateEffective') }}</th>
          <th>{{ t('studentProfile.statusLog.movementCategory') }}</th>
          <th>{{ t('studentProfile.statusLog.changedBy') }}</th>
          <th>{{ t('studentProfile.statusLog.remarks') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.id ?? `${entry.status}-${entry.dateEffective}`">
          <td>{{ tr(entry.status) }}</td>
          <td>{{ formatStatusLogDate(entry.dateEffective) }}</td>
          <td>{{ formatMovementCategory(entry) }}</td>
          <td>{{ entry.changedBy || '—' }}</td>
          <td class="remarks-cell">
            <div v-if="entry.remarkTitle" class="remark-title">{{ entry.remarkTitle }}</div>
            <div v-for="(line, index) in entry.remarkLines || []" :key="index" class="remark-line">
              {{ line }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty-hint">{{ t('common.noData') }}</p>
  </div>
</template>

<style scoped>
.status-log-tab {
  min-height: 120px;
}

.status-log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.status-log-table th,
.status-log-table td {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
}

.status-log-table th {
  background: #e8f5e9;
  color: #374151;
  font-weight: 600;
}

.remarks-cell {
  min-width: 220px;
}

.remark-title {
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.remark-line + .remark-line {
  margin-top: 2px;
}

.empty-hint {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}
</style>
