<script setup>
import { computed, ref, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
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
import {
  applyPendingVolunteerOrder,
  confirmVolunteerPreferenceOrder,
  preferenceOrderConfirmed,
  isVolunteerListLocked,
  sortedPendingVolunteers,
} from '../../data/courseRegistration/studentVolunteerSheet.js'
import { displayClassTimeVenueLines } from '../../data/courseRegistration/sectionScheduleFields.js'
import { listPendingVolunteerTimeConflicts } from '../../data/courseRegistration/volunteerPendingConflict.js'
import '../../styles/course-registration-list.css'

const props = defineProps({
  visible: Boolean,
  creditMin: { type: Number, default: 12 },
  creditMax: { type: Number, default: 20 },
  message: { type: String, default: '' },
  /** 当前轮次是否在选课窗口内；窗外隐藏排队中并去掉操作列 */
  roundOpen: { type: Boolean, default: true },
  /** 老生第一轮：展示志愿次序列 */
  showVolunteerOrder: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { t, isZh } = useAppI18n()

const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const reorderMode = ref(false)
/** @type {import('vue').Ref<object[]>} */
const draftRows = ref([])
const dragFromIndex = ref(-1)
const localMessage = ref('')

watch(
  () => props.visible,
  (open) => {
    if (!open) {
      reorderMode.value = false
      draftRows.value = []
      dragFromIndex.value = -1
      localMessage.value = ''
    }
  },
)

/** R1：排队中（无志愿次序表） */
const queuedRows = computed(() => {
  if (!props.showVolunteerOrder || !props.roundOpen || reorderMode.value) return []
  return (myRegistrationList.value || []).filter((item) => item.status === 'queued')
})

/** R1：待分配志愿（含志愿次序）；调序时用草稿 */
const volunteerRows = computed(() => {
  if (!props.showVolunteerOrder) return []
  if (reorderMode.value) return draftRows.value
  return sortedPendingVolunteers().map((item) => ({
    ...item,
    status: item.status || 'pendingAssign',
  }))
})

const volunteerTimeConflicts = computed(() =>
  listPendingVolunteerTimeConflicts(volunteerRows.value),
)

const showVolunteerClashCallout = computed(
  () => props.showVolunteerOrder && volunteerTimeConflicts.value.groups.length > 0,
)

function volunteerClashPeers(item) {
  return volunteerTimeConflicts.value.byCourseId[item?.courseId] || []
}

function formatCourseList(codes) {
  return (codes || []).filter(Boolean).join(isZh.value ? '、' : ', ')
}

/** 二三轮：平铺表 */
const flatRows = computed(() => {
  if (props.showVolunteerOrder) return []
  const list = myRegistrationList.value
  if (props.roundOpen) return list
  return list.filter((item) => item.status !== 'queued')
})

const hasAnyRows = computed(() => {
  if (props.showVolunteerOrder) {
    return queuedRows.value.length > 0 || volunteerRows.value.length > 0
  }
  return flatRows.value.length > 0
})

const showActionsColumn = computed(() => props.roundOpen && !reorderMode.value)

const showVolunteerToolbar = computed(
  () => props.showVolunteerOrder && (volunteerRows.value.length > 0 || reorderMode.value),
)

const canStartReorder = computed(
  () =>
    props.showVolunteerOrder &&
    props.roundOpen &&
    !preferenceOrderConfirmed.value &&
    !isVolunteerListLocked() &&
    sortedPendingVolunteers().length >= 2,
)

const canConfirmOrder = computed(
  () =>
    props.showVolunteerOrder &&
    props.roundOpen &&
    !preferenceOrderConfirmed.value &&
    !reorderMode.value &&
    sortedPendingVolunteers().length > 0,
)

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

const canUnselect = computed(
  () => props.roundOpen && isRegistrationPhaseForUnselect() && !isVolunteerListLocked(),
)

const isPreselectRound = computed(
  () => normalizeCartRoundKey(activeCartRoundKey.value) === 'preselect',
)

const drawerSubtitle = computed(() => {
  if (props.showVolunteerOrder) {
    if (reorderMode.value) {
      return t('courseRegistration.student.volunteerSheet.reorderModeHint')
    }
    if (preferenceOrderConfirmed.value) {
      return t('courseRegistration.student.volunteerSheet.orderConfirmedHint')
    }
    return t('courseRegistration.student.volunteerSheet.orderDraftHint', {
      count: sortedPendingVolunteers().length,
    })
  }
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

function preferenceLabel(item, index) {
  if (reorderMode.value) {
    return t('courseRegistration.student.volunteerSheet.slotLabel', { n: index + 1 })
  }
  const n = Number(item.preferenceOrder) || index + 1
  return t('courseRegistration.student.volunteerSheet.slotLabel', { n })
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

function startReorder() {
  if (!canStartReorder.value) return
  draftRows.value = sortedPendingVolunteers().map((row) => ({
    ...row,
    status: row.status || 'pendingAssign',
  }))
  reorderMode.value = true
  localMessage.value = ''
}

function cancelReorder() {
  reorderMode.value = false
  draftRows.value = []
  dragFromIndex.value = -1
}

function finishReorder() {
  const ids = draftRows.value.map((row) => row.courseId)
  const result = applyPendingVolunteerOrder(ids)
  if (!result.ok && result.errorKey) {
    localMessage.value = t(result.errorKey, result.errorParams || {})
    return
  }
  reorderMode.value = false
  draftRows.value = []
  dragFromIndex.value = -1
  localMessage.value = t('courseRegistration.student.volunteerSheet.reorderDone')
}

function handleConfirmOrder() {
  if (!canConfirmOrder.value) return
  if (!window.confirm(t('courseRegistration.student.volunteerSheet.confirmOrderConfirm'))) return
  const result = confirmVolunteerPreferenceOrder()
  if (!result.ok && result.errorKey) {
    localMessage.value = t(result.errorKey, result.errorParams || {})
    return
  }
  localMessage.value = t('courseRegistration.student.volunteerSheet.confirmOrderSuccess', {
    count: result.count,
  })
}

function onDragStart(index, event) {
  if (!reorderMode.value) return
  dragFromIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(event) {
  if (!reorderMode.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onDrop(toIndex, event) {
  if (!reorderMode.value) return
  event.preventDefault()
  const from = dragFromIndex.value
  dragFromIndex.value = -1
  if (from < 0 || from === toIndex) return
  const next = draftRows.value.slice()
  const [moved] = next.splice(from, 1)
  next.splice(toIndex, 0, moved)
  draftRows.value = next
}

function onDragEnd() {
  dragFromIndex.value = -1
}

function isDraggableRow() {
  return reorderMode.value
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
      <!-- R1：待分配志愿在上（含志愿次序） -->
      <section v-if="showVolunteerOrder" class="cr-cart-section">
        <div v-if="showVolunteerToolbar" class="cr-volunteer-toolbar">
          <template v-if="reorderMode">
            <button type="button" class="btn btn-primary" @click="finishReorder">
              {{ t('courseRegistration.student.volunteerSheet.reorderDoneBtn') }}
            </button>
            <button type="button" class="btn btn-default" @click="cancelReorder">
              {{ t('common.cancel') }}
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canConfirmOrder"
              @click="handleConfirmOrder"
            >
              {{ t('courseRegistration.student.confirmVolunteer') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="!canStartReorder"
              @click="startReorder"
            >
              {{ t('courseRegistration.student.volunteerSheet.reorderBtn') }}
            </button>
          </template>
        </div>
        <h4 v-if="volunteerRows.length" class="cr-cart-section-title">
          {{ t('courseRegistration.student.volunteerSheet.pendingSection') }}
        </h4>
        <CourseRegistrationCallout v-if="showVolunteerClashCallout" variant="warning">
          <p>{{ t('courseRegistration.student.volunteerSheet.clashTitle') }}</p>
          <ul class="cr-vol-clash-list">
            <li v-for="(group, gi) in volunteerTimeConflicts.groups" :key="gi">
              {{
                t('courseRegistration.student.volunteerSheet.clashGroup', {
                  courses: formatCourseList(group.codes),
                })
              }}
            </li>
          </ul>
          <p>{{ t('courseRegistration.student.volunteerSheet.clashHint') }}</p>
        </CourseRegistrationCallout>
        <div v-if="volunteerRows.length" class="table-wrap">
          <table class="data-table data-table--pref" :class="{ 'is-reorder': reorderMode }">
            <thead>
              <tr>
                <th class="col-pref sticky-left sticky-pref">
                  {{ t('courseRegistration.student.termSummary.preferenceOrder') }}
                </th>
                <th class="sticky-left sticky-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="sticky-left sticky-name">{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th
                  class="sticky-right sticky-status"
                  :class="{ 'sticky-status--flushright': !showActionsColumn }"
                >
                  {{ t('common.status') }}
                </th>
                <th v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                  {{ t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in volunteerRows"
                :key="rowKey(item)"
                :draggable="isDraggableRow()"
                :class="{
                  'is-dragging': reorderMode && dragFromIndex === index,
                  'is-draggable': reorderMode,
                  'is-time-conflict': volunteerClashPeers(item).length > 0,
                }"
                @dragstart="onDragStart(index, $event)"
                @dragover="onDragOver"
                @drop="onDrop(index, $event)"
                @dragend="onDragEnd"
              >
                <td class="col-pref sticky-left sticky-pref nowrap">
                  <span v-if="reorderMode" class="drag-handle" aria-hidden="true">⋮⋮</span>
                  {{ preferenceLabel(item, index) }}
                </td>
                <td class="sticky-left sticky-code nowrap">
                  {{ item.courseCode || '—' }}
                  <span
                    v-if="volunteerClashPeers(item).length"
                    class="hint-popover-wrap cr-vol-clash-mark"
                  >
                    <span
                      class="hint-popover-trigger cr-vol-clash-icon"
                      tabindex="0"
                      role="img"
                      :aria-label="
                        t('courseRegistration.student.volunteerSheet.clashRowTip', {
                          courses: formatCourseList(volunteerClashPeers(item)),
                        })
                      "
                    >
                      !
                    </span>
                    <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                      {{
                        t('courseRegistration.student.volunteerSheet.clashRowTip', {
                          courses: formatCourseList(volunteerClashPeers(item)),
                        })
                      }}
                    </span>
                  </span>
                </td>
                <td class="sticky-left sticky-name nowrap">{{ item.courseName || '—' }}</td>
                <td class="nowrap">{{ groupName(item) }}</td>
                <td class="col-credits nowrap">{{ item.credits ?? '—' }}</td>
                <td class="nowrap">{{ item.lecturer || '—' }}</td>
                <td class="nowrap">{{ item.weekRange || '—' }}</td>
                <td class="cr-time-venue">
                  <div
                    v-for="(line, li) in displayClassTimeVenueLines(item, timeLocale)"
                    :key="li"
                    class="cr-time-venue-line"
                  >
                    {{ line }}
                  </div>
                </td>
                <td
                  class="sticky-right sticky-status"
                  :class="{ 'sticky-status--flushright': !showActionsColumn }"
                >
                  <span class="status-tag" :class="statusClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                  <button
                    v-if="canUnselect"
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
      </section>

      <!-- R1：排队中在下（原表头，无志愿次序） -->
      <section v-if="showVolunteerOrder && queuedRows.length" class="cr-cart-section">
        <h4 class="cr-cart-section-title">
          {{ t('courseRegistration.student.volunteerSheet.queuedSection') }}
        </h4>
        <div class="table-wrap">
          <table class="data-table data-table--flat">
            <thead>
              <tr>
                <th class="col-index sticky-left sticky-index">{{ t('common.serialNo') }}</th>
                <th class="sticky-left sticky-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="sticky-left sticky-name">{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th class="sticky-right sticky-status">{{ t('common.status') }}</th>
                <th v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                  {{ t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in queuedRows" :key="rowKey(item)">
                <td class="col-index sticky-left sticky-index">{{ index + 1 }}</td>
                <td class="sticky-left sticky-code nowrap">{{ item.courseCode || '—' }}</td>
                <td class="sticky-left sticky-name nowrap">{{ item.courseName || '—' }}</td>
                <td class="nowrap">{{ groupName(item) }}</td>
                <td class="col-credits nowrap">{{ item.credits ?? '—' }}</td>
                <td class="nowrap">{{ item.lecturer || '—' }}</td>
                <td class="nowrap">{{ item.weekRange || '—' }}</td>
                <td class="cr-time-venue">
                  <div
                    v-for="(line, li) in displayClassTimeVenueLines(item, timeLocale)"
                    :key="li"
                    class="cr-time-venue-line"
                  >
                    {{ line }}
                  </div>
                </td>
                <td class="sticky-right sticky-status">
                  <span class="status-cell">
                    <span
                      class="queue-spinner"
                      :aria-label="t('courseRegistration.student.myCourseStatus.queued')"
                      role="status"
                    />
                    <span class="status-tag tag-blue">
                      {{ statusLabel('queued') }}
                    </span>
                  </span>
                </td>
                <td v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                  <button type="button" class="link-btn" @click="handleCancelQueue(item)">
                    {{ t('courseRegistration.queue.cancelQueue') }}
                  </button>
                  <button type="button" class="link-btn" @click="handleViewProgress(item)">
                    {{ t('courseRegistration.student.viewQueueProgress') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 二三轮：平铺 -->
      <div v-if="!showVolunteerOrder && flatRows.length" class="table-wrap">
        <table class="data-table data-table--flat">
          <thead>
            <tr>
              <th class="col-index sticky-left sticky-index">{{ t('common.serialNo') }}</th>
              <th class="sticky-left sticky-code">{{ t('courseRegistration.courses.code') }}</th>
              <th class="sticky-left sticky-name">{{ t('courseRegistration.courses.name') }}</th>
              <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
              <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
              <th>{{ t('courseRegistration.courses.lecturer') }}</th>
              <th>{{ t('courseRegistration.courses.weekRange') }}</th>
              <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
              <th
                class="sticky-right sticky-status"
                :class="{ 'sticky-status--flushright': !showActionsColumn }"
              >
                {{ t('common.status') }}
              </th>
              <th v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in flatRows" :key="rowKey(item)">
              <td class="col-index sticky-left sticky-index">{{ index + 1 }}</td>
              <td class="sticky-left sticky-code nowrap">{{ item.courseCode || '—' }}</td>
              <td class="sticky-left sticky-name nowrap">{{ item.courseName || '—' }}</td>
              <td class="nowrap">{{ groupName(item) }}</td>
              <td class="col-credits nowrap">{{ item.credits ?? '—' }}</td>
              <td class="nowrap">{{ item.lecturer || '—' }}</td>
              <td class="nowrap">{{ item.weekRange || '—' }}</td>
              <td class="cr-time-venue">
                <div
                  v-for="(line, li) in displayClassTimeVenueLines(item, timeLocale)"
                  :key="li"
                  class="cr-time-venue-line"
                >
                  {{ line }}
                </div>
              </td>
              <td
                class="sticky-right sticky-status"
                :class="{ 'sticky-status--flushright': !showActionsColumn }"
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
                  <button type="button" class="link-btn" @click="handleCancelQueue(item)">
                    {{ t('courseRegistration.queue.cancelQueue') }}
                  </button>
                  <button type="button" class="link-btn" @click="handleViewProgress(item)">
                    {{ t('courseRegistration.student.viewQueueProgress') }}
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

      <p v-if="!hasAnyRows" class="cr-student-empty">
        {{ t('courseRegistration.student.myCoursesEmpty') }}
      </p>
      <p v-if="localMessage || message" class="cr-student-message">
        {{ localMessage || message }}
      </p>
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

.cr-cart-section {
  margin-bottom: 16px;
}

.cr-cart-section-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.cr-volunteer-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
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
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table.is-reorder tbody tr.is-draggable {
  cursor: grab;
}

.data-table.is-reorder tbody tr.is-dragging {
  opacity: 0.55;
  background: #eff6ff;
}

.drag-handle {
  display: inline-block;
  margin-right: 6px;
  color: #9ca3af;
  letter-spacing: -2px;
  font-size: 12px;
  user-select: none;
}

.col-index {
  width: 56px;
  text-align: center;
}

.col-pref {
  min-width: 96px;
  font-weight: 600;
  color: #1d4ed8;
}

.cr-time-venue {
  min-width: 180px;
  max-width: 300px;
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.col-credits {
  width: 64px;
}

.col-actions {
  min-width: 64px;
  padding-left: 8px;
  padding-right: 8px;
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
  width: 14px;
  height: 14px;
  border: 2px solid #93c5fd;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: cart-spin 0.7s linear infinite;
}

@keyframes cart-spin {
  to {
    transform: rotate(360deg);
  }
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
.sticky-pref {
  left: 0;
  min-width: 96px;
}
.data-table--flat .sticky-code {
  left: 56px;
  min-width: 96px;
}
.data-table--flat .sticky-name {
  left: 152px;
  min-width: 140px;
  box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
.data-table--pref .sticky-code {
  left: 96px;
  min-width: 96px;
}
.data-table--pref .sticky-name {
  left: 192px;
  min-width: 140px;
  box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.18);
}

/* 志愿表：状态/操作仅「待分配」「退选」，收窄 */
.data-table--pref .sticky-actions,
.data-table--pref .col-actions {
  right: 0;
  min-width: 64px;
  width: 64px;
  padding-left: 8px;
  padding-right: 8px;
}
.data-table--pref .sticky-status {
  right: 64px;
  min-width: 72px;
  width: 72px;
  padding-left: 8px;
  padding-right: 8px;
  box-shadow: -4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
.data-table--pref .sticky-status--flushright {
  right: 0;
  min-width: 72px;
  width: 72px;
}

.data-table.data-table--pref tbody tr.is-time-conflict > td {
  background: #fffbeb;
}

.cr-vol-clash-list {
  margin: 6px 0;
  padding-left: 1.2em;
}

.cr-vol-clash-list li {
  margin: 2px 0;
}

.cr-vol-clash-mark {
  margin-left: 4px;
  vertical-align: middle;
}

.cr-vol-clash-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #d97706;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 排队/平铺：操作可能多按钮，略收但仍够用 */
.data-table--flat .sticky-actions,
.data-table--flat .col-actions {
  right: 0;
  min-width: 120px;
  padding-left: 8px;
  padding-right: 8px;
}
.data-table--flat .sticky-status {
  right: 120px;
  min-width: 80px;
  padding-left: 8px;
  padding-right: 8px;
  box-shadow: -4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
.data-table--flat .sticky-status--flushright {
  right: 0;
  min-width: 72px;
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

.btn-primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.btn-primary:disabled,
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 13px;
  margin-right: 8px;
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
