<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { displayClassTime, displayWeekRange } from '../../data/courseRegistration/sectionScheduleFields.js'

const props = defineProps({
  visible: Boolean,
  course: { type: Object, default: null },
  confirming: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useAppI18n()

const selectedSectionId = ref('')

watch(
  () => [props.visible, props.course?.id],
  () => {
    selectedSectionId.value = ''
  },
)

const title = computed(() => props.course?.name || '')
const subtitle = computed(() =>
  props.course ? `${props.course.code} · ${props.course.credits} cr` : '',
)

const selectedSection = computed(() =>
  props.course?.sections?.find((item) => item.id === selectedSectionId.value) || null,
)

function isFull(section) {
  return section.enrolled >= section.capacity
}

function groupName(section) {
  return t('courseRegistration.courses.sectionNameDisplay', { code: section.code })
}

function handlePick(section) {
  if (!props.course || isFull(section)) return
  selectedSectionId.value = section.id
}

function handleConfirm() {
  if (!props.course || !selectedSection.value || props.confirming) return
  emit('confirm', { course: props.course, section: selectedSection.value })
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="section-picker-drawer"
    @close="emit('close')"
  >
    <p class="picker-hint">{{ t('courseRegistration.student.sectionPickerHint') }}</p>
    <div v-if="course?.sections?.length" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-radio" aria-label="select" />
            <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
            <th>{{ t('courseRegistration.courses.enrolled') }}</th>
            <th>{{ t('courseRegistration.courses.lecturer') }}</th>
            <th>{{ t('courseRegistration.courses.weekRange') }}</th>
            <th>{{ t('courseRegistration.courses.classTime') }}</th>
            <th>{{ t('courseRegistration.courses.room') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="section in course.sections"
            :key="section.id"
            :class="{
              selected: section.id === selectedSectionId,
              available: !isFull(section),
              full: isFull(section),
            }"
            @click="handlePick(section)"
          >
            <td class="col-radio">
              <input
                type="radio"
                name="section-picker"
                :checked="section.id === selectedSectionId"
                :disabled="isFull(section)"
                @click.stop="handlePick(section)"
                @change="handlePick(section)"
              />
            </td>
            <td class="nowrap">{{ groupName(section) }}</td>
            <td class="nowrap col-capacity" :class="isFull(section) ? 'capacity-full' : 'capacity-open'">
              {{ section.enrolled }}/{{ section.capacity }}
            </td>
            <td class="nowrap">{{ section.lecturer || '—' }}</td>
            <td class="nowrap">{{ displayWeekRange(section) }}</td>
            <td class="nowrap">{{ displayClassTime(section) }}</td>
            <td class="nowrap">{{ section.room || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="picker-empty">{{ t('courseRegistration.student.sectionPickerEmpty') }}</p>

    <template #footer>
      <button type="button" class="btn btn-default" :disabled="confirming" @click="emit('close')">
        {{ t('common.close') }}
      </button>
      <button
        type="button"
        class="btn btn-primary btn-primary--vivid"
        :disabled="!selectedSection || confirming"
        @click="handleConfirm"
      >
        {{ t('courseRegistration.student.confirmRegister') }}
      </button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.section-picker-drawer :deep(.drawer-panel) {
  width: min(960px, 96vw);
}

.picker-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.picker-empty {
  margin: 24px 0;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  background: #f3f4f6;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
}

.data-table td {
  font-size: 13px;
  font-weight: 400;
  color: #374151;
}

.col-radio {
  width: 40px;
  text-align: center;
}

.data-table tbody tr.available {
  cursor: pointer;
}

.data-table tbody tr.available:hover {
  background: #f8fafc;
}

.data-table tbody tr.selected {
  background: #eff6ff;
  box-shadow: inset 3px 0 0 #1d4ed8;
}

.data-table tbody tr.full {
  cursor: not-allowed;
  background: #fafafa;
  color: #9ca3af;
}

.data-table tbody tr.full td {
  color: #9ca3af;
}

.capacity-open {
  color: #047857;
  font-weight: 600;
}

.capacity-full {
  color: #b91c1c;
  font-weight: 600;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.nowrap {
  white-space: nowrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary--vivid {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #fff;
}

.btn-primary--vivid:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
