<script setup>
import { computed, ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  myRegistrationList,
  unselectConfirmedCourse,
  openMyCourseQueueProgress,
  cancelMyCourseQueue,
  isRegistrationPhaseForUnselect,
} from '../../data/courseRegistration/studentRegistrationStore.js'
import {
  applyPendingVolunteerOrder,
  isVolunteerListLocked,
  sortedPendingVolunteers,
} from '../../data/courseRegistration/studentVolunteerSheet.js'
import { displayClassTimeVenueLines } from '../../data/courseRegistration/sectionScheduleFields.js'
import { listPendingVolunteerTimeConflicts } from '../../data/courseRegistration/volunteerPendingConflict.js'
import { getCourseById, resolveSchoolElectiveCategory } from '../../data/courseRegistration/selectableCourses.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import { getSchoolElectiveCategoryLabel } from '../../data/departments.js'
import CourseCodeSourcePopover from './CourseCodeSourcePopover.vue'
import '../../styles/course-registration-list.css'

const COLLAPSED_PREVIEW = 3

const props = defineProps({
  expanded: { type: Boolean, default: false },
  roundOpen: { type: Boolean, default: true },
  showVolunteerOrder: { type: Boolean, default: false },
  message: { type: String, default: '' },
})

const emit = defineEmits(['update:expanded'])

const { t, isZh } = useAppI18n()
const rootEl = ref(null)
const dragFromIndex = ref(-1)
const localMessage = ref('')

const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const isExpanded = computed({
  get: () => props.expanded,
  set: (v) => emit('update:expanded', v),
})

const canDrag = computed(
  () => props.showVolunteerOrder && props.roundOpen && !isVolunteerListLocked(),
)

/** 表级：是否允许操作列出现退选能力（具体行再按状态过滤） */
const actionsEnabled = computed(() => {
  if (!props.roundOpen || !isRegistrationPhaseForUnselect()) return false
  if (props.showVolunteerOrder) return !isVolunteerListLocked()
  return true
})

const showActionsColumn = computed(() => props.roundOpen)

function isFailedStatus(status) {
  return status === 'failed' || status === 'miss'
}

/** 待分配可退选；失败行不可；R2/R3 已选成功可退 */
function rowCanUnselect(item) {
  if (!actionsEnabled.value) return false
  if (isFailedStatus(item?.status)) return false
  if (props.showVolunteerOrder) {
    return (item?.status || 'pendingAssign') === 'pendingAssign'
  }
  return item?.status !== 'queued'
}

/** 仅待分配可拖；失败行不可拖 */
function rowCanDrag(item) {
  if (!canDrag.value) return false
  return (item?.status || 'pendingAssign') === 'pendingAssign'
}

/** R1 待分配志愿 */
const allVolunteerRows = computed(() => {
  if (!props.showVolunteerOrder) return []
  return sortedPendingVolunteers().map((item) => ({
    ...item,
    status: item.status || 'pendingAssign',
  }))
})

/** R2/R3 已选（非排队） */
const allPrimaryRows = computed(() => {
  if (props.showVolunteerOrder) return []
  const list = myRegistrationList.value || []
  const filtered = props.roundOpen ? list : list.filter((item) => item.status !== 'queued')
  return filtered.filter((item) => item.status !== 'queued')
})

const queuedRows = computed(() => {
  if (!props.roundOpen) return []
  return (myRegistrationList.value || []).filter((item) => item.status === 'queued')
})

const primaryRows = computed(() =>
  props.showVolunteerOrder ? allVolunteerRows.value : allPrimaryRows.value,
)

const previewRows = computed(() => primaryRows.value.slice(0, COLLAPSED_PREVIEW))
const extraRows = computed(() => primaryRows.value.slice(COLLAPSED_PREVIEW))

const showDrawerRail = computed(
  () => extraRows.value.length > 0 || queuedRows.value.length > 0,
)

/** 收起前 3 行；展开同一张表追加其余行（不另开表头） */
const visiblePrimaryRows = computed(() => {
  if (isExpanded.value || extraRows.value.length === 0) return primaryRows.value
  return previewRows.value
})

const volunteerTimeConflicts = computed(() =>
  listPendingVolunteerTimeConflicts(allVolunteerRows.value),
)

const hasAnyContent = computed(
  () => primaryRows.value.length > 0 || queuedRows.value.length > 0,
)

const panelTitle = computed(() => {
  if (props.showVolunteerOrder) {
    return t('courseRegistration.student.roundStatusPanel.titleWithPending', {
      count: allVolunteerRows.value.length,
    })
  }
  return t('courseRegistration.student.roundStatusPanel.titleWithSelected', {
    count: allPrimaryRows.value.length,
  })
})

/** R1 仅保留拖拽说明；R2/R3 门数已并入标题，无副标题 */
const panelSubtitle = computed(() => {
  if (!props.showVolunteerOrder) return ''
  return t('courseRegistration.student.volunteerSheet.orderLiveHintDragOnly')
})

function volunteerClashPeers(item) {
  return volunteerTimeConflicts.value.byCourseId[item?.courseId] || []
}

function formatCourseList(codes) {
  return (codes || []).filter(Boolean).join(isZh.value ? '、' : ', ')
}

function rowKey(item) {
  return `${item.status}-${item.courseId}-${item.id || item.sectionId}`
}

function groupName(item) {
  return t('courseRegistration.courses.sectionNameDisplay', {
    code: item.sectionCode || '—',
  })
}

/** 校选类别：行内字段优先，否则回落课库，ME 默认与专业一致（demo 文科） */
function schoolElectiveCategoryLabel(item) {
  const lib = getCourseById(item?.courseId)
  const raw = resolveSchoolElectiveCategory({
    ...(lib || {}),
    ...item,
    type: item?.type || lib?.type,
  })
  return getSchoolElectiveCategoryLabel(raw, isZh.value)
}

/** 课程类别：公共选修 / 专业选修 */
function courseCategoryLabel(item) {
  return getRegistrationTypeLabel(item?.type, t)
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
  const n = Number(item.preferenceOrder) || index + 1
  return t('courseRegistration.student.volunteerSheet.slotLabel', { n })
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
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

function onDragStart(fullIndex, event) {
  const row = primaryRows.value[fullIndex]
  if (!rowCanDrag(row)) {
    event.preventDefault()
    return
  }
  dragFromIndex.value = fullIndex
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(fullIndex))
  }
}

function onDragOver(event) {
  if (!canDrag.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onDropAtFullIndex(toFullIndex, event) {
  if (!canDrag.value) return
  event.preventDefault()
  const fromFull = dragFromIndex.value
  dragFromIndex.value = -1
  if (fromFull < 0 || fromFull === toFullIndex) return

  const next = primaryRows.value.slice()
  if (fromFull >= next.length || toFullIndex >= next.length) return
  if (!rowCanDrag(next[fromFull]) || !rowCanDrag(next[toFullIndex])) return
  const [moved] = next.splice(fromFull, 1)
  next.splice(toFullIndex, 0, moved)
  const result = applyPendingVolunteerOrder(next.map((row) => row.courseId))
  if (!result.ok && result.errorKey) {
    localMessage.value = t(result.errorKey, result.errorParams || {})
  } else {
    localMessage.value = ''
  }
}

function onDragEnd() {
  dragFromIndex.value = -1
}

function scrollIntoView() {
  rootEl.value?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
}

defineExpose({ scrollIntoView })
</script>

<template>
  <section v-if="hasAnyContent" ref="rootEl" class="cr-round-status-panel">
    <header class="cr-round-status-header">
      <div>
        <h3 class="cr-round-status-title">
          {{ panelTitle }}
        </h3>
        <p v-if="panelSubtitle" class="cr-round-status-sub">{{ panelSubtitle }}</p>
      </div>
    </header>

    <div v-if="visiblePrimaryRows.length" class="table-wrap">
      <table
        class="data-table"
        :class="showVolunteerOrder ? 'data-table--pref' : 'data-table--flat'"
      >
        <thead>
          <tr>
            <th v-if="showVolunteerOrder" class="col-drag sticky-left sticky-drag" />
            <th
              v-if="showVolunteerOrder"
              class="col-pref sticky-left"
              :class="canDrag ? 'sticky-pref-drag' : 'sticky-pref'"
            >
              {{ t('courseRegistration.student.termSummary.preferenceOrder') }}
            </th>
            <th v-else class="col-index sticky-left sticky-index">{{ t('common.serialNo') }}</th>
            <th class="sticky-left sticky-code">{{ t('courseRegistration.courses.code') }}</th>
            <th class="sticky-left sticky-name">{{ t('courseRegistration.courses.name') }}</th>
            <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
            <th>{{ t('courseRegistration.courses.category') }}</th>
            <th>{{ t('courseRegistration.courses.schoolElectiveCategory') }}</th>
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
            v-for="(item, index) in visiblePrimaryRows"
            :key="rowKey(item)"
            :draggable="rowCanDrag(item)"
            :class="{
              'is-dragging': rowCanDrag(item) && dragFromIndex === index,
              'is-draggable': rowCanDrag(item),
              'is-time-conflict': volunteerClashPeers(item).length > 0,
            }"
            @dragstart="onDragStart(index, $event)"
            @dragover="onDragOver"
            @drop="onDropAtFullIndex(index, $event)"
            @dragend="onDragEnd"
          >
            <td v-if="showVolunteerOrder" class="col-drag sticky-left sticky-drag">
              <span v-if="rowCanDrag(item)" class="drag-handle" aria-hidden="true">⋮⋮</span>
            </td>
            <td
              v-if="showVolunteerOrder"
              class="col-pref sticky-left nowrap"
              :class="canDrag ? 'sticky-pref-drag' : 'sticky-pref'"
            >
              {{ preferenceLabel(item, index) }}
            </td>
            <td v-else class="col-index sticky-left sticky-index">{{ index + 1 }}</td>
            <td class="sticky-left sticky-code nowrap">
              <CourseCodeSourcePopover
                v-if="item.courseCode"
                :code="item.courseCode"
                :course="item"
              />
              <template v-else>—</template>
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
            <td class="nowrap">{{ courseCategoryLabel(item) }}</td>
            <td class="nowrap">{{ schoolElectiveCategoryLabel(item) }}</td>
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
                v-if="rowCanUnselect(item)"
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

    <div v-if="showDrawerRail" class="cr-round-drawer">
      <div v-if="queuedRows.length" v-show="isExpanded" class="cr-round-drawer-body">
        <div class="table-wrap cr-round-drawer-table">
          <h4 class="cr-round-drawer-section-title">
            {{ t('courseRegistration.student.volunteerSheet.queuedSection') }}
            <span class="cr-queue-count">({{ queuedRows.length }})</span>
          </h4>
          <table
            class="data-table"
            :class="showVolunteerOrder ? 'data-table--pref data-table--queue' : 'data-table--flat data-table--queue'"
          >
            <thead>
              <tr>
                <th v-if="showVolunteerOrder" class="col-drag sticky-left sticky-drag" aria-hidden="true" />
                <th
                  v-if="showVolunteerOrder"
                  class="col-pref sticky-left sticky-pref"
                >
                  {{ t('common.serialNo') }}
                </th>
                <th v-else class="col-index sticky-left sticky-index">{{ t('common.serialNo') }}</th>
                <th class="sticky-left sticky-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="sticky-left sticky-name">{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th>{{ t('courseRegistration.courses.category') }}</th>
                <th>{{ t('courseRegistration.courses.schoolElectiveCategory') }}</th>
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
              <tr v-for="(item, index) in queuedRows" :key="rowKey(item)">
                <td v-if="showVolunteerOrder" class="col-drag sticky-left sticky-drag" aria-hidden="true" />
                <td
                  v-if="showVolunteerOrder"
                  class="col-pref sticky-left sticky-pref nowrap"
                >
                  {{ index + 1 }}
                </td>
                <td v-else class="col-index sticky-left sticky-index">{{ index + 1 }}</td>
                <td class="sticky-left sticky-code nowrap">
                  <CourseCodeSourcePopover
                    v-if="item.courseCode"
                    :code="item.courseCode"
                    :course="item"
                  />
                  <template v-else>—</template>
                </td>
                <td class="sticky-left sticky-name nowrap">{{ item.courseName || '—' }}</td>
                <td class="nowrap">{{ groupName(item) }}</td>
                <td class="nowrap">{{ courseCategoryLabel(item) }}</td>
                <td class="nowrap">{{ schoolElectiveCategoryLabel(item) }}</td>
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
                  <span class="status-tag tag-blue">
                    <span class="queue-spinner" aria-hidden="true" />
                    {{ statusLabel('queued') }}
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
      </div>

      <div
        class="cr-round-drawer-rail"
        role="button"
        tabindex="0"
        :aria-expanded="isExpanded ? 'true' : 'false'"
        @click="toggleExpanded"
        @keydown.enter.prevent="toggleExpanded"
        @keydown.space.prevent="toggleExpanded"
      >
        <span class="cr-round-drawer-rail-action">
          <span class="cr-round-drawer-rail-action-text">
            {{
              isExpanded
                ? t('courseRegistration.student.roundStatusPanel.drawerActionCollapse')
                : t('courseRegistration.student.roundStatusPanel.drawerActionExpand')
            }}
          </span>
          <span class="cr-round-drawer-chevron" :class="{ 'is-open': isExpanded }" aria-hidden="true">
            ▾
          </span>
        </span>
      </div>
    </div>

    <p v-if="localMessage || message" class="cr-student-message">
      {{ localMessage || message }}
    </p>
  </section>
</template>

<style scoped>
.cr-round-status-panel {
  margin: 0 0 12px;
  padding: 12px 14px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  position: relative;
  z-index: 2;
}

.cr-round-status-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.cr-round-status-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.cr-round-status-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.table-wrap {
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  position: relative;
  z-index: 1;
}

/* hover tip 时放开裁切（overflow-x:auto 会连带裁切纵向弹出层） */
.table-wrap:has(.cr-vol-clash-mark:hover),
.table-wrap:has(.cr-vol-clash-mark:focus-within) {
  overflow: visible;
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th,
.data-table td {
  padding: 8px 10px;
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

.data-table tbody tr.is-draggable {
  cursor: grab;
}

.data-table tbody tr.is-dragging {
  opacity: 0.55;
  background: #eff6ff;
}

.col-drag {
  width: 28px;
  min-width: 28px;
  max-width: 28px;
  padding-left: 6px;
  padding-right: 4px;
}

.drag-handle {
  display: inline-block;
  color: #9ca3af;
  letter-spacing: -2px;
  font-size: 12px;
  user-select: none;
}

.col-index {
  width: 56px;
  min-width: 56px;
  text-align: center;
}

.col-pref {
  width: 88px;
  min-width: 88px;
  font-weight: 600;
  color: #1d4ed8;
}

.data-table--queue .col-pref {
  font-weight: 500;
  color: #374151;
  text-align: center;
}

.data-table--pref {
  table-layout: fixed;
  width: 100%;
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
  min-width: 64px;
}

.col-actions {
  width: 148px;
  min-width: 148px;
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

td.sticky-code:has(.hint-popover-wrap:hover),
td.sticky-code:has(.hint-popover-wrap:focus-within) {
  z-index: 230;
}

.sticky-drag {
  left: 0;
}
.sticky-index {
  left: 0;
}
.sticky-pref {
  left: 0;
}
.sticky-pref-drag {
  left: 28px;
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
  left: 116px;
  min-width: 96px;
}
.data-table--pref .sticky-name {
  left: 212px;
  min-width: 140px;
  box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.18);
}

.data-table--pref .sticky-actions,
.data-table--pref .col-actions,
.data-table--flat .sticky-actions,
.data-table--flat .col-actions {
  right: 0;
  min-width: 148px;
  width: 148px;
}
.data-table--pref .sticky-status,
.data-table--flat .sticky-status {
  right: 148px;
  min-width: 72px;
  box-shadow: -4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
.data-table--pref .sticky-status--flushright,
.data-table--flat .sticky-status--flushright {
  right: 0;
}

.data-table.data-table--pref tbody tr.is-time-conflict > td {
  background: #fffbeb;
}

.cr-round-drawer {
  margin-top: 8px;
}

.cr-round-drawer-rail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.cr-round-drawer-rail:hover {
  border-color: #93c5fd;
  background: #f8fafc;
  color: #1d4ed8;
}

.cr-round-drawer-rail-label {
  display: none;
}

.cr-round-drawer-rail-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: inherit;
}

.cr-round-drawer-rail-action-text {
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.cr-round-drawer-chevron {
  display: inline-flex;
  transition: transform 0.15s ease;
  font-size: 14px;
  line-height: 1;
}

.cr-round-drawer-chevron.is-open {
  transform: rotate(180deg);
}

.cr-round-drawer-body {
  margin-top: 0;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cr-round-drawer-table {
  margin-top: 0;
}

.cr-round-drawer-section-title {
  margin: 0;
  padding: 8px 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.cr-queue-count {
  font-weight: 500;
  color: #6b7280;
}

.queue-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 4px;
  vertical-align: -1px;
  border: 2px solid #93c5fd;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: panel-spin 0.7s linear infinite;
}

@keyframes panel-spin {
  to {
    transform: rotate(360deg);
  }
}

.status-tag {
  display: inline-flex;
  align-items: center;
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

.cr-vol-clash-mark {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  position: relative;
  z-index: 20;
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
}

/* 末行冲突 tip 向上展开，避免被表底 / overflow 裁切 */
.cr-vol-clash-mark .hint-popover-content {
  top: auto;
  bottom: calc(100% + 6px);
  left: 0;
  transform: none;
  z-index: 50;
  min-width: 200px;
  max-width: min(320px, 70vw);
}

.cr-vol-clash-mark::after {
  top: auto;
  bottom: 100%;
  height: 8px;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  margin-right: 8px;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 13px;
}

.link-btn.danger {
  color: #dc2626;
}

.muted {
  font-size: 12px;
  color: #9ca3af;
}

.cr-student-message {
  margin: 10px 0 0;
  font-size: 13px;
  color: #b45309;
}
</style>
