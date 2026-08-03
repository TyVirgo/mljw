<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  myRegistrationList,
  myRegistrationCredits,
  unselectConfirmedCourse,
  openMyCourseQueueProgress,
  cancelMyCourseQueue,
  isRegistrationPhaseForUnselect,
  activeCartRoundKey,
  normalizeCartRoundKey,
} from '../../data/courseRegistration/studentRegistrationStore.js'
import '../../styles/course-registration-list.css'

const props = defineProps({
  visible: Boolean,
  creditMin: { type: Number, default: 12 },
  creditMax: { type: Number, default: 20 },
  message: { type: String, default: '' },
  /** 当前轮次是否在选课窗口内；窗外隐藏排队中并去掉操作列 */
  roundOpen: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

/** 窗外过滤排队中；待分配等仍展示 */
const visibleRows = computed(() => {
  const list = myRegistrationList.value
  if (props.roundOpen) return list
  return list.filter((item) => item.status !== 'queued')
})

/** 仅窗口内展示操作列（退选/取消排队等） */
const showActionsColumn = computed(() => props.roundOpen)

const creditStatusHint = computed(() => {
  const current = myRegistrationCredits.value
  const min = props.creditMin
  const max = props.creditMax
  if (current < min) {
    return t('courseRegistration.student.myCoursesCreditHintBelow', {
      gap: min - current,
      min,
    })
  }
  if (current > max) {
    return t('courseRegistration.student.myCoursesCreditHintAbove', { max })
  }
  return t('courseRegistration.student.myCoursesCreditHintOk', { min, max })
})

const canUnselect = computed(() => props.roundOpen && isRegistrationPhaseForUnselect())

const isPreselectRound = computed(
  () => normalizeCartRoundKey(activeCartRoundKey.value) === 'preselect',
)

const drawerSubtitle = computed(() => {
  if (isPreselectRound.value) {
    return t('courseRegistration.student.myCoursesPreselectHint')
  }
  return t('courseRegistration.student.myCoursesCredits', {
    current: myRegistrationCredits.value,
    min: props.creditMin,
    max: props.creditMax,
    statusHint: creditStatusHint.value,
  })
})

function rowKey(item) {
  return `${item.status}-${item.courseId}-${item.id || item.sectionId}`
}

function groupName(item) {
  return t('courseRegistration.courses.sectionNameDisplay', {
    code: item.sectionCode || '—',
  })
}

function statusLabel(status) {
  return t(`courseRegistration.student.myCourseStatus.${status}`)
}

function statusClass(status) {
  if (status === 'success' || status === 'pendingAssign') return 'tag-green'
  if (status === 'queued') return 'tag-blue'
  if (status === 'failed') return 'tag-red'
  return 'tag-gray'
}

function handleUnselect(item) {
  if (
    !window.confirm(
      t('courseRegistration.student.unselectConfirm', {
        code: item.courseCode || item.courseId,
        name: item.courseName || '',
      }),
    )
  ) {
    return
  }
  const result = unselectConfirmedCourse(item.courseId)
  if (!result.ok && result.errorKey) {
    window.alert(t(result.errorKey))
  }
}

function handleViewProgress(item) {
  openMyCourseQueueProgress(item)
}

function handleCancelQueue(item) {
  if (!window.confirm(t('courseRegistration.queue.cancelQueueConfirm'))) return
  const result = cancelMyCourseQueue(item)
  if (!result.ok && result.errorKey) {
    window.alert(t(result.errorKey))
  }
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="t('courseRegistration.student.myCoursesTitle')"
    :subtitle="drawerSubtitle"
    class="student-cart-drawer"
    @close="emit('close')"
  >
    <div class="student-cart-body">
      <div v-if="visibleRows.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-index sticky-left sticky-index">{{ t('common.serialNo') }}</th>
              <th class="sticky-left sticky-code">{{ t('courseRegistration.courses.code') }}</th>
              <th class="sticky-left sticky-name">{{ t('courseRegistration.courses.name') }}</th>
              <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
              <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
              <th>{{ t('courseRegistration.courses.lecturer') }}</th>
              <th>{{ t('courseRegistration.courses.weekRange') }}</th>
              <th>{{ t('courseRegistration.courses.classTime') }}</th>
              <th>{{ t('courseRegistration.courses.room') }}</th>
              <th
                class="sticky-right sticky-status"
                :class="{ 'sticky-status--trailing': !showActionsColumn }"
              >
                {{ t('common.status') }}
              </th>
              <th v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in visibleRows" :key="rowKey(item)">
              <td class="col-index sticky-left sticky-index">{{ index + 1 }}</td>
              <td class="sticky-left sticky-code nowrap">{{ item.courseCode || '—' }}</td>
              <td class="sticky-left sticky-name nowrap">{{ item.courseName || '—' }}</td>
              <td class="col-credits nowrap">{{ item.credits ?? '—' }}</td>
              <td class="nowrap">{{ groupName(item) }}</td>
              <td class="nowrap">{{ item.lecturer || '—' }}</td>
              <td class="nowrap">{{ item.weekRange || '—' }}</td>
              <td class="nowrap">{{ item.classTime || item.time || '—' }}</td>
              <td class="nowrap">{{ item.room || '—' }}</td>
              <td
                class="sticky-right sticky-status"
                :class="{ 'sticky-status--trailing': !showActionsColumn }"
              >
                <span class="status-cell">
                  <span
                    v-if="item.status === 'queued'"
                    class="queue-spinner"
                    :aria-label="t('courseRegistration.student.myCourseStatus.queued')"
                    role="status"
                  />
                  <span class="status-tag" :class="statusClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </span>
              </td>
              <td v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                <template v-if="item.status === 'queued'">
                  <button type="button" class="link-btn" @click="handleViewProgress(item)">
                    {{ t('courseRegistration.student.viewQueueProgress') }}
                  </button>
                  <button type="button" class="link-btn" @click="handleCancelQueue(item)">
                    {{ t('courseRegistration.queue.cancelQueue') }}
                  </button>
                </template>
                <button
                  v-else-if="(item.status === 'success' || item.status === 'pendingAssign') && canUnselect"
                  type="button"
                  class="link-btn danger"
                  @click="handleUnselect(item)"
                >
                  {{ t('courseRegistration.student.unselect') }}
                </button>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="cr-student-empty">{{ t('courseRegistration.student.myCoursesEmpty') }}</p>
      <p v-if="message" class="cr-student-message">{{ message }}</p>
    </div>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">
        {{ t('common.close') }}
      </button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.student-cart-drawer :deep(.drawer-panel) {
  width: min(1120px, 96vw);
}

.student-cart-drawer :deep(.drawer-scroll) {
  padding: 16px 20px 20px;
  background: #f3f4f6;
}

.student-cart-body {
  padding: 0;
  min-height: 160px;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  max-height: min(60vh, 520px);
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  text-align: left;
  vertical-align: middle;
  color: #374151;
  background: #fff;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 3;
}

.nowrap {
  white-space: nowrap;
}

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.queue-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #bfdbfe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: cart-queue-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes cart-queue-spin {
  to {
    transform: rotate(360deg);
  }
}

.col-index,
.col-credits {
  width: 56px;
  text-align: center;
}

.col-actions {
  white-space: nowrap;
  min-width: 140px;
}

.col-actions .link-btn + .link-btn {
  margin-left: 10px;
}

.sticky-left,
.sticky-right {
  position: sticky;
  z-index: 2;
}

th.sticky-left,
th.sticky-right {
  z-index: 4;
}

.sticky-index {
  left: 0;
}
.sticky-code {
  left: 56px;
  min-width: 96px;
}
.sticky-name {
  left: 152px;
  min-width: 140px;
  box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.18);
}

.sticky-actions {
  right: 0;
  min-width: 140px;
}
.sticky-status {
  right: 140px;
  min-width: 110px;
  box-shadow: -4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
/** 无操作列时状态列贴右，避免 right:140px 悬空遮挡 */
.sticky-status--trailing {
  right: 0;
  min-width: 96px;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.tag-green {
  background: #d1fae5;
  color: #047857;
}
.tag-blue {
  background: #dbeafe;
  color: #1d4ed8;
}
.tag-red {
  background: #fee2e2;
  color: #b91c1c;
}
.tag-gray {
  background: #f3f4f6;
  color: #6b7280;
}

.muted {
  font-size: 12px;
  color: #9ca3af;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 13px;
}

.link-btn.danger {
  color: #dc2626;
}

.cr-student-empty {
  margin: 24px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.cr-student-message {
  margin: 12px 0 0;
  font-size: 13px;
  color: #b45309;
}
</style>
