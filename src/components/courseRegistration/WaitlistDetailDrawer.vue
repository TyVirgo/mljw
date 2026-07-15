<script setup>
import { ref, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  approveWaitlistEntry,
  rejectWaitlistEntry,
  getWaitlistCourseById,
} from '../../data/courseRegistration/waitlistQueue.js'

const props = defineProps({
  visible: Boolean,
  course: { type: Object, default: null },
})

const emit = defineEmits(['close', 'updated'])

const { t } = useAppI18n()
const activeTab = ref('waitlist')

const liveCourse = computed(() =>
  props.course ? getWaitlistCourseById(props.course.id) || props.course : null,
)

const title = computed(() =>
  liveCourse.value ? `${liveCourse.value.courseCode} · ${liveCourse.value.courseName}` : '',
)
const subtitle = computed(() =>
  liveCourse.value ? `${t('courseRegistration.waitlist.section')} ${liveCourse.value.section}` : '',
)

function handleApprove(entry) {
  approveWaitlistEntry(liveCourse.value.id, entry.id)
  emit('updated')
}

function handleReject(entry) {
  rejectWaitlistEntry(liveCourse.value.id, entry.id)
  emit('updated')
}

function entryStatusLabel(status) {
  return t(`courseRegistration.waitlist.entryStatus.${status}`)
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="liveCourse">
      <div class="capacity-bar">
        {{ t('courseRegistration.waitlist.enrolled') }}: {{ liveCourse.enrolled }}/{{ liveCourse.capacity }}
        · {{ t('courseRegistration.waitlist.waitlistCount') }}: {{ liveCourse.waitlistCount }}
      </div>

      <div class="tab-bar">
        <button type="button" class="tab-btn" :class="{ active: activeTab === 'registered' }" @click="activeTab = 'registered'">
          {{ t('courseRegistration.waitlist.tabRegistered') }} ({{ liveCourse.registered.length }})
        </button>
        <button type="button" class="tab-btn" :class="{ active: activeTab === 'waitlist' }" @click="activeTab = 'waitlist'">
          {{ t('courseRegistration.waitlist.tabWaitlist') }} ({{ liveCourse.waitlist.length }})
        </button>
      </div>

      <table v-if="activeTab === 'registered'" class="mini-table">
        <thead>
          <tr>
            <th>{{ t('courseRegistration.monitor.studentId') }}</th>
            <th>{{ t('courseRegistration.monitor.studentName') }}</th>
            <th>{{ t('courseRegistration.monitor.programme') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in liveCourse.registered" :key="i">
            <td>{{ row.studentId }}</td>
            <td>{{ row.studentName }}</td>
            <td>{{ row.programme }}/{{ row.intake }}</td>
          </tr>
          <tr v-if="!liveCourse.registered.length">
            <td colspan="3" class="empty">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else class="mini-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t('courseRegistration.monitor.studentId') }}</th>
            <th>{{ t('courseRegistration.monitor.studentName') }}</th>
            <th>{{ t('common.status') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in liveCourse.waitlist" :key="entry.id">
            <td>{{ entry.position }}</td>
            <td>{{ entry.studentId }}</td>
            <td>{{ entry.studentName }}</td>
            <td>{{ entryStatusLabel(entry.status) }}</td>
            <td class="actions">
              <template v-if="entry.status === 'Pending'">
                <button type="button" class="link-btn" @click="handleApprove(entry)">{{ t('courseRegistration.waitlist.approve') }}</button>
                <button type="button" class="link-btn danger" @click="handleReject(entry)">{{ t('courseRegistration.waitlist.reject') }}</button>
              </template>
              <span v-else class="muted">—</span>
            </td>
          </tr>
          <tr v-if="!liveCourse.waitlist.length">
            <td colspan="5" class="empty">{{ t('courseRegistration.waitlist.noWaitlist') }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.capacity-bar { font-size: 13px; color: #374151; margin-bottom: 16px; padding: 10px 12px; background: #f9fafb; border-radius: 6px; }
.tab-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.tab-btn { padding: 6px 12px; border: none; background: none; font-size: 13px; color: #6b7280; cursor: pointer; border-radius: 6px; }
.tab-btn.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mini-table th, .mini-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; text-align: left; }
.mini-table th { background: #f9fafb; }
.link-btn { background: none; border: none; color: #2563eb; cursor: pointer; font-size: 12px; padding: 0 4px; }
.link-btn.danger { color: #dc2626; }
.actions { white-space: nowrap; }
.empty, .muted { color: #9ca3af; text-align: center; }
</style>
