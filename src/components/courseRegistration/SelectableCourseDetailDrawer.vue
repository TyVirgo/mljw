<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'

const props = defineProps({
  visible: Boolean,
  course: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()
const activeTab = ref('basic')

const tabs = [
  { id: 'basic', labelKey: 'courseRegistration.courses.tabBasic' },
  { id: 'sections', labelKey: 'courseRegistration.courses.tabSections' },
  { id: 'quota', labelKey: 'courseRegistration.courses.tabQuota' },
  { id: 'limits', labelKey: 'courseRegistration.courses.tabLimits' },
]

watch(
  () => props.visible,
  (v) => {
    if (v) activeTab.value = 'basic'
  },
)

const title = computed(() => props.course?.name || '')
const subtitle = computed(() => (props.course ? `${props.course.code} · ${props.course.credits} cr` : ''))
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    @close="emit('close')"
  >
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ t(tab.labelKey) }}
      </button>
    </div>

    <template v-if="course">
      <div v-if="activeTab === 'basic'" class="tab-panel">
        <dl class="detail-dl">
          <dt>{{ t('courseRegistration.courses.code') }}</dt>
          <dd>{{ course.code }} <ExternalDataHint source-key="courseLibrary" /></dd>
          <dt>{{ t('courseRegistration.courses.name') }}</dt>
          <dd>{{ course.name }}</dd>
          <dt>{{ t('courseRegistration.courses.credits') }}</dt>
          <dd>{{ course.credits }}</dd>
          <dt>{{ t('courseRegistration.courses.type') }}</dt>
          <dd>{{ course ? getRegistrationTypeLabel(course.type, t) : '—' }}</dd>
        </dl>
      </div>

      <div v-else-if="activeTab === 'sections'" class="tab-panel">
        <table class="mini-table">
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
            <tr v-for="sec in course.sections" :key="sec.id">
              <td>{{ sec.code }}</td>
              <td>{{ sec.lecturer || '—' }}</td>
              <td>{{ sec.weekRange || '—' }}</td>
              <td>
                {{ sec.classTime || sec.time }}
                <ExternalDataHint source-key="scheduling" />
              </td>
              <td>{{ sec.room || '—' }}</td>
              <td>{{ sec.enrolled }}/{{ sec.capacity }}</td>
            </tr>
            <tr v-if="!course.sections?.length">
              <td colspan="6" class="empty">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="activeTab === 'quota'" class="tab-panel">
        <dl class="detail-dl">
          <dt>{{ t('courseRegistration.courses.capacity') }}</dt>
          <dd>{{ course.quota?.total }}</dd>
          <dt>{{ t('courseRegistration.courses.seniorQuota') }}</dt>
          <dd>{{ course.quota?.senior }}</dd>
          <dt>{{ t('courseRegistration.courses.freshmanQuota') }}</dt>
          <dd>{{ course.quota?.freshman }}</dd>
          <dt>{{ t('courseRegistration.courses.releaseFreshman') }}</dt>
          <dd>{{ course.quota?.releaseToFreshman ? t('common.yes') : t('common.no') }}</dd>
        </dl>
      </div>

      <div v-else class="tab-panel">
        <dl class="detail-dl">
          <dt>{{ t('courseRegistration.courses.prerequisites') }}</dt>
          <dd>
            {{ (course.prerequisites || []).join(', ') || '—' }}
            <ExternalDataHint source-key="programme" />
          </dd>
          <dt>{{ t('courseRegistration.courses.g1Category') }}</dt>
          <dd>{{ course.g1Category || '—' }}</dd>
        </dl>
      </div>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.tab-btn {
  padding: 6px 12px;
  border: none;
  background: none;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
}

.tab-btn.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.detail-dl {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px 16px;
  font-size: 13px;
}

.detail-dl dt {
  color: #6b7280;
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
}

.empty {
  text-align: center;
  color: #9ca3af;
}
</style>
