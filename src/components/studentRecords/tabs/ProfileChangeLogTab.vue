<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { formatStatusLogDate, parseMovementDate } from '../../../utils/formatMovementDate.js'

const props = defineProps({
  form: { type: Object, required: true },
})

const { t, tr } = useAppI18n()

const entries = computed(() => {
  const logs = Array.isArray(props.form.profileChangeLogs) ? [...props.form.profileChangeLogs] : []
  return logs.sort((a, b) => {
    const dateA = parseMovementDate(a.changedAt) || new Date(a.changedAt || 0)
    const dateB = parseMovementDate(b.changedAt) || new Date(b.changedAt || 0)
    const timeA = dateA && !Number.isNaN(dateA.getTime()) ? dateA.getTime() : 0
    const timeB = dateB && !Number.isNaN(dateB.getTime()) ? dateB.getTime() : 0
    if (timeB !== timeA) return timeB - timeA
    return (Number(b.id) || 0) - (Number(a.id) || 0)
  })
})

function formatChangedAt(value) {
  const iso = String(value || '').trim()
  if (!iso) return '—'
  const asDate = new Date(iso)
  if (!Number.isNaN(asDate.getTime()) && iso.includes('T')) {
    const day = String(asDate.getDate()).padStart(2, '0')
    const month = String(asDate.getMonth() + 1).padStart(2, '0')
    const year = asDate.getFullYear()
    const hour = String(asDate.getHours()).padStart(2, '0')
    const minute = String(asDate.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hour}:${minute}`
  }
  return formatStatusLogDate(iso)
}

function sectionLabel(section) {
  if (section === 'accommodation') return t('studentProfile.profileChangeLog.sectionAccommodation')
  return t('studentProfile.profileChangeLog.sectionBasic')
}

function roleLabel(role) {
  if (role === 'student') return t('studentProfile.profileChangeLog.roleStudent')
  return t('studentProfile.profileChangeLog.roleTeacher')
}

function displayValue(value) {
  const text = String(value ?? '').trim()
  return text ? tr(text) || text : '—'
}
</script>

<template>
  <div class="profile-change-log-tab">
    <table v-if="entries.length" class="profile-change-log-table">
      <thead>
        <tr>
          <th>{{ t('studentProfile.profileChangeLog.changedAt') }}</th>
          <th>{{ t('studentProfile.profileChangeLog.section') }}</th>
          <th>{{ t('studentProfile.profileChangeLog.field') }}</th>
          <th>{{ t('studentProfile.profileChangeLog.oldValue') }}</th>
          <th>{{ t('studentProfile.profileChangeLog.newValue') }}</th>
          <th>{{ t('studentProfile.profileChangeLog.changedBy') }}</th>
          <th>{{ t('studentProfile.profileChangeLog.changedByRole') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.id ?? `${entry.fieldKey}-${entry.changedAt}`">
          <td>{{ formatChangedAt(entry.changedAt) }}</td>
          <td>{{ sectionLabel(entry.section) }}</td>
          <td>{{ tr(entry.fieldLabel) || entry.fieldLabel || entry.fieldKey || '—' }}</td>
          <td>{{ displayValue(entry.oldValue) }}</td>
          <td>{{ displayValue(entry.newValue) }}</td>
          <td>{{ entry.changedBy || '—' }}</td>
          <td>{{ roleLabel(entry.changedByRole) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty-hint">{{ t('common.noData') }}</p>
  </div>
</template>

<style scoped>
.profile-change-log-tab {
  min-height: 120px;
  overflow-x: auto;
}

.profile-change-log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.profile-change-log-table th,
.profile-change-log-table td {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}

.profile-change-log-table th {
  background: #e8f5e9;
  color: #374151;
  font-weight: 600;
}

.empty-hint {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}
</style>
