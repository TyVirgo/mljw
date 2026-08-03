<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import {
  getCourseById,
  updateCourseSelectable,
} from '../../data/courseRegistration/selectableCourses.js'

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

const liveCourse = computed(() => {
  if (!props.course?.id) return props.course
  return getCourseById(props.course.id) || props.course
})

const title = computed(() => liveCourse.value?.name || '')
const subtitle = computed(() =>
  liveCourse.value ? `${liveCourse.value.code} · ${liveCourse.value.credits} cr` : '',
)

const selectableDraft = computed({
  get() {
    return liveCourse.value?.isSelectable !== false ? 'yes' : 'no'
  },
  set(value) {
    if (!liveCourse.value?.id) return
    updateCourseSelectable(liveCourse.value.id, value === 'yes')
  },
})
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

    <template v-if="liveCourse">
      <div v-if="activeTab === 'basic'" class="tab-panel">
        <dl class="detail-dl">
          <dt>{{ t('courseRegistration.courses.code') }}</dt>
          <dd>{{ liveCourse.code }} <ExternalDataHint source-key="courseLibrary" /></dd>
          <dt>{{ t('courseRegistration.courses.name') }}</dt>
          <dd>{{ liveCourse.name }}</dd>
          <dt>{{ t('courseRegistration.courses.credits') }}</dt>
          <dd>{{ liveCourse.credits }}</dd>
          <dt>{{ t('courseRegistration.courses.type') }}</dt>
          <dd>{{ getRegistrationTypeLabel(liveCourse.type, t) }}</dd>
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
            <tr v-for="sec in liveCourse.sections" :key="sec.id">
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
            <tr v-if="!liveCourse.sections?.length">
              <td colspan="6" class="empty">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="activeTab === 'quota'" class="tab-panel">
        <dl class="detail-dl">
          <dt>{{ t('courseRegistration.courses.capacity') }}</dt>
          <dd>{{ liveCourse.quota?.total }}</dd>
          <dt>{{ t('courseRegistration.courses.seniorQuota') }}</dt>
          <dd>{{ liveCourse.quota?.senior }}</dd>
          <dt>{{ t('courseRegistration.courses.freshmanQuota') }}</dt>
          <dd>{{ liveCourse.quota?.freshman }}</dd>
          <dt>{{ t('courseRegistration.courses.releaseFreshman') }}</dt>
          <dd>{{ liveCourse.quota?.releaseToFreshman ? t('common.yes') : t('common.no') }}</dd>
        </dl>
      </div>

      <div v-else class="tab-panel">
        <dl class="detail-dl">
          <dt>{{ t('courseRegistration.courses.isSelectable') }}</dt>
          <dd>
            <select v-model="selectableDraft" class="round-select">
              <option value="yes">{{ t('courseRegistration.courses.isSelectableYes') }}</option>
              <option value="no">{{ t('courseRegistration.courses.isSelectableNo') }}</option>
            </select>
          </dd>
          <dt>{{ t('courseRegistration.courses.prerequisites') }}</dt>
          <dd>
            {{ (liveCourse.prerequisites || []).join(', ') || '—' }}
            <ExternalDataHint source-key="programme" />
          </dd>
          <dt>{{ t('courseRegistration.courses.g1Category') }}</dt>
          <dd>{{ liveCourse.g1Category || '—' }}</dd>
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

.round-select {
  min-width: 180px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
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
