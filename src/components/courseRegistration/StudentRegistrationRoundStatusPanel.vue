<script setup>
import { computed, ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  activeCartRoundKey,
  listPriorRoundConfirmedCourses,
  myRegistrationList,
  unselectConfirmedCourse,
  openMyCourseQueueProgress,
  cancelMyCourseQueue,
  isRegistrationPhaseForUnselect,
  formatSelectedAt,
} from '../../data/courseRegistration/studentRegistrationStore.js'
import {
  applyPendingVolunteerOrder,
  isVolunteerListLocked,
  pendingVolunteerRowKey,
  sortedPendingVolunteers,
} from '../../data/courseRegistration/studentVolunteerSheet.js'
import { displayClassTimeVenueLines } from '../../data/courseRegistration/sectionScheduleFields.js'
import { listPendingVolunteerTimeConflicts, listPendingVolunteerMultiSections, volunteerRowHasMultiSection } from '../../data/courseRegistration/volunteerPendingConflict.js'
import { getCourseById } from '../../data/courseRegistration/selectableCourses.js'
import {
  getSectionVolunteerDisplayCount,
  volunteerCourseStates,
} from '../../data/courseRegistration/preselectVolunteerConfirm.js'
import { hydrateSelectedCourseDisplay } from '../../data/courseRegistration/resolveSelectedCourseDisplay.js'
import { formatUnifiedCourseCategoryLabel } from '../../data/courseRegistration/unifiedCourseCategory.js'
import { getActiveBatch } from '../../data/courseRegistration/registrationBatches.js'
import {
  getSelectionGroupsForBatch,
  resolveSelectionGroup,
  getSelectionGroupDisplayLines,
} from '../../data/courseRegistration/courseSelectionGroups.js'
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

/** 待分配可退选；失败行不可；非志愿已选成功可退 */
function rowCanUnselect(item) {
  if (!actionsEnabled.value) return false
  if (isFailedStatus(item?.status)) return false
  if (props.showVolunteerOrder) {
    return (item?.status || 'pendingAssign') === 'pendingAssign'
  }
  return item?.status !== 'queued'
}

/** 历轮已选：窗口期内可退，不受志愿锁约束 */
function rowCanUnselectPrior(item) {
  if (!props.roundOpen || !isRegistrationPhaseForUnselect()) return false
  if (isFailedStatus(item?.status)) return false
  return item?.status !== 'queued'
}

/** 仅待分配可拖；失败行不可拖 */
function rowCanDrag(item) {
  if (!canDrag.value) return false
  return (item?.status || 'pendingAssign') === 'pendingAssign'
}

function hydrateRow(item) {
  return hydrateSelectedCourseDisplay(item, { locale: isZh.value ? 'zh' : 'en' })
}

/** 本轮待分配志愿（按当前轮过滤） */
const allVolunteerRows = computed(() => {
  if (!props.showVolunteerOrder) return []
  return sortedPendingVolunteers(undefined, activeCartRoundKey.value).map((item) =>
    hydrateRow({
      ...item,
      status: item.status || 'pendingAssign',
    }),
  )
})

/** 历轮已选（严格早于当前轮；R1–R3 均可） */
const priorRoundRows = computed(() =>
  listPriorRoundConfirmedCourses({ roundKey: activeCartRoundKey.value }).map(hydrateRow),
)

/** R2/R3 常显历轮块（含 0 门空态）；R1 仅有历轮数据时显示 */
const showPriorSection = computed(() => {
  if (!props.showVolunteerOrder) return true
  return priorRoundRows.value.length > 0
})

const isPriorEmpty = computed(() => !priorRoundRows.value.length)

/** 非志愿：本轮已选（非排队） */
const allPrimaryRows = computed(() => {
  if (props.showVolunteerOrder) return []
  const list = myRegistrationList.value || []
  const filtered = props.roundOpen ? list : list.filter((item) => item.status !== 'queued')
  return filtered.filter((item) => item.status !== 'queued').map(hydrateRow)
})

const queuedRows = computed(() => {
  if (!props.roundOpen) return []
  return (myRegistrationList.value || [])
    .filter((item) => item.status === 'queued')
    .map(hydrateRow)
})

const primaryRows = computed(() =>
  props.showVolunteerOrder ? allVolunteerRows.value : allPrimaryRows.value,
)

const previewRows = computed(() => primaryRows.value.slice(0, COLLAPSED_PREVIEW))
const extraRows = computed(() => primaryRows.value.slice(COLLAPSED_PREVIEW))

/** 仅「本轮超出预览行」需要展开轨；排队块已默认展示 */
const showDrawerRail = computed(() => extraRows.value.length > 0)

/** 收起前 3 行；展开同一张表追加其余行（不另开表头） */
const visiblePrimaryRows = computed(() => {
  if (isExpanded.value || extraRows.value.length === 0) return primaryRows.value
  return previewRows.value
})

const volunteerTimeConflicts = computed(() =>
  listPendingVolunteerTimeConflicts(allVolunteerRows.value),
)

const volunteerMultiSections = computed(() =>
  listPendingVolunteerMultiSections(allVolunteerRows.value),
)

/** ME 展示课程组列（与主选课表一致） */
const showSelectionGroupColumn = computed(() => getActiveBatch()?.type === 'ME')

const selectionGroups = computed(() =>
  showSelectionGroupColumn.value ? getSelectionGroupsForBatch(getActiveBatch()) : [],
)

const isPrimaryEmpty = computed(() => !visiblePrimaryRows.value.length)

/** 空表 colspan：与当前表头列数一致（占位行撑开高度，文案用浮层居中；类别已合并为一列） */
const emptyColspan = computed(() => {
  let n = props.showVolunteerOrder ? 12 : 11
  if (showSelectionGroupColumn.value) n += 1
  if (showActionsColumn.value) n += 1
  if (props.showVolunteerOrder) n += 1
  return n
})

const panelTitle = computed(() => {
  if (props.showVolunteerOrder || showPriorSection.value) {
    return t('courseRegistration.student.roundStatusPanel.panelTitle')
  }
  return t('courseRegistration.student.roundStatusPanel.titleWithSelected', {
    count: allPrimaryRows.value.length,
  })
})

const currentVolunteerHeading = computed(() =>
  t('courseRegistration.student.roundStatusPanel.currentVolunteerSection'),
)

const pendingCountBesideLabel = computed(() =>
  t('courseRegistration.student.roundStatusPanel.pendingCountBeside', {
    count: allVolunteerRows.value.length,
  }),
)

const currentSelectedHeading = computed(() =>
  t('courseRegistration.student.roundStatusPanel.currentSelectedSection'),
)

const selectedCountBesideLabel = computed(() =>
  t('courseRegistration.student.roundStatusPanel.selectedCountBeside', {
    count: allPrimaryRows.value.length,
  }),
)

const priorRoundHeading = computed(() =>
  t('courseRegistration.student.roundStatusPanel.priorRoundHeading'),
)

const priorCountBesideLabel = computed(() =>
  t('courseRegistration.student.roundStatusPanel.selectedCountBeside', {
    count: priorRoundRows.value.length,
  }),
)

/** R2/R3 展示「本轮已选」分块标题 */
const showCurrentSelectedHeading = computed(() => !props.showVolunteerOrder)

/** 志愿模式保留拖拽说明 */
const panelSubtitle = computed(() => {
  if (!props.showVolunteerOrder) return ''
  return t('courseRegistration.student.volunteerSheet.orderLiveHintDragOnly')
})

function volunteerClashPeers(item) {
  return volunteerTimeConflicts.value.byCourseId[item?.courseId] || []
}

function volunteerHasMultiSection(item) {
  return volunteerRowHasMultiSection(item, volunteerMultiSections.value)
}

/** 行内 ! tip 文案（时间冲突 / 同课多分组，可并存） */
function volunteerWarningTips(item) {
  const tips = []
  const peers = volunteerClashPeers(item)
  if (peers.length) {
    tips.push(
      t('courseRegistration.student.volunteerSheet.clashRowTip', {
        courses: formatCourseList(peers),
      }),
    )
  }
  if (volunteerHasMultiSection(item)) {
    tips.push(t('courseRegistration.student.volunteerSheet.multiSectionRowTip'))
  }
  return tips
}

function formatCourseList(codes) {
  return (codes || []).filter(Boolean).join(isZh.value ? '、' : ', ')
}

function selectionGroupDisplay(item) {
  if (!showSelectionGroupColumn.value) return null
  const lib = getCourseById(item?.courseId)
  const course = { ...(lib || {}), code: item?.courseCode || lib?.code }
  return resolveSelectionGroup(course, selectionGroups.value)
}

function selectionGroupLines(item) {
  return getSelectionGroupDisplayLines(selectionGroupDisplay(item), isZh.value)
}

function rowKey(item) {
  return `${item.status}-${item.courseId}-${item.id || item.sectionId}`
}

function groupName(item) {
  return t('courseRegistration.courses.sectionNameDisplay', {
    code: item.sectionCode || '—',
  })
}

/**
 * 统一课程类别：必修课 / GE01–04 / ME01–04
 * @param {object} item
 */
function courseCategoryLabel(item) {
  const lib = getCourseById(item?.courseId)
  return formatUnifiedCourseCategoryLabel(
    {
      ...(lib || {}),
      ...item,
      type: item?.type || lib?.type,
      schoolElectiveCategory: item?.schoolElectiveCategory || lib?.schoolElectiveCategory,
    },
    t,
  )
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

/** 第一轮：课程已选百分比（志愿人数 / 分组容量） */
function sectionSelectedPercent(item) {
  void volunteerCourseStates.value
  const courseId = item?.courseId
  const sectionId = item?.sectionId
  if (!courseId || !sectionId) return '—'
  const course = getCourseById(courseId)
  const section = course?.sections?.find((s) => s.id === sectionId)
  if (!section) return '—'
  const cap = Number(section.capacity) || 0
  if (cap <= 0) return '—'
  const volunteers = getSectionVolunteerDisplayCount(courseId, sectionId)
  return `${Math.round((volunteers / cap) * 100)}%`
}

/** 容量胶囊色：第一轮按志愿热度绿/黄/红（与选课列表同源） */
function sectionCapacityClass(item) {
  if (!props.showVolunteerOrder) return ''
  const courseId = item?.courseId
  const sectionId = item?.sectionId
  if (!courseId || !sectionId) return ''
  const course = getCourseById(courseId)
  const section = course?.sections?.find((s) => s.id === sectionId)
  if (!section) return ''
  void volunteerCourseStates.value
  const cap = Number(section.capacity) || 0
  if (cap <= 0) return 'capacity-open'
  const volunteers = getSectionVolunteerDisplayCount(courseId, sectionId)
  if (volunteers < cap) return 'capacity-open'
  if (volunteers <= cap * 2) return 'capacity-warn'
  return 'capacity-full'
}

function preferenceLabel(item, index) {
  const n = Number(item.preferenceOrder) || index + 1
  return t('courseRegistration.student.volunteerSheet.slotLabel', { n })
}

/** 提交时间展示：成功用 selectedAt；失败兼容 failedAt */
function submissionTimeLabel(item) {
  return formatSelectedAt(item?.selectedAt || item?.submittedAt || item?.failedAt)
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function handleUnselect(item) {
  if (
    !window.confirm(
      t('courseRegistration.student.unselectConfirm', {
        code: item.courseCode || item.courseId,
        name: hydrateRow(item).courseName || item.courseName || '',
      }),
    )
  ) {
    return
  }
  const result = unselectConfirmedCourse(item.courseId, {
    sectionId: item.sectionId,
    sectionCode: item.sectionCode || item.section,
  })
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
  const result = applyPendingVolunteerOrder(next.map((row) => pendingVolunteerRowKey(row)))
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
  <section ref="rootEl" class="cr-round-status-panel">
    <header class="cr-round-status-header">
      <div>
        <h3 class="cr-round-status-title">
          {{ panelTitle }}
        </h3>
        <p v-if="panelSubtitle" class="cr-round-status-sub">{{ panelSubtitle }}</p>
      </div>
    </header>

    <h4 v-if="showVolunteerOrder" class="cr-round-block-title">
      <span>{{ currentVolunteerHeading }}</span>
      <span class="cr-round-block-meta">{{ pendingCountBesideLabel }}</span>
    </h4>
    <h4 v-else-if="showCurrentSelectedHeading" class="cr-round-block-title">
      <span>{{ currentSelectedHeading }}</span>
      <span class="cr-round-block-meta">{{ selectedCountBesideLabel }}</span>
    </h4>
    <div
      class="table-wrap"
      :class="{ 'is-empty': isPrimaryEmpty }"
    >
      <table
        class="data-table"
        :class="[
          showVolunteerOrder ? 'data-table--pref' : 'data-table--flat',
          { 'has-capacity-col': showVolunteerOrder },
        ]"
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
            <th class="sticky-left sticky-code col-code">{{ t('courseRegistration.courses.code') }}</th>
            <th class="sticky-left sticky-name col-name">{{ t('courseRegistration.courses.name') }}</th>
            <th class="col-section">{{ t('courseRegistration.courses.sectionCode') }}</th>
            <th v-if="showSelectionGroupColumn" class="col-selection-group">
              {{ t('courseRegistration.courses.selectionGroup') }}
            </th>
            <th class="col-category">{{ t('courseRegistration.courses.category') }}</th>
            <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
            <th class="col-lecturer">{{ t('courseRegistration.courses.lecturer') }}</th>
            <th class="col-week">{{ t('courseRegistration.courses.weekRange') }}</th>
            <th class="col-time-venue">{{ t('courseRegistration.courses.classTimeVenue') }}</th>
            <th class="col-submitted-at">{{ t('courseRegistration.student.selectedAt') }}</th>
            <th
              class="sticky-right sticky-status"
              :class="{ 'sticky-status--flushright': !showActionsColumn }"
            >
              {{ t('common.status') }}
            </th>
            <th
              v-if="showVolunteerOrder"
              class="sticky-right sticky-capacity"
              :class="{ 'sticky-capacity--flushright': !showActionsColumn }"
            >
              {{ t('courseRegistration.courses.volunteerSelectedPercent') }}
            </th>
            <th v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
              {{ t('common.actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isPrimaryEmpty">
            <td :colspan="emptyColspan" class="empty-cell-spacer" aria-hidden="true" />
          </tr>
          <tr
            v-for="(item, index) in visiblePrimaryRows"
            :key="rowKey(item)"
            :draggable="rowCanDrag(item)"
            :class="{
              'is-dragging': rowCanDrag(item) && dragFromIndex === index,
              'is-draggable': rowCanDrag(item),
              'is-time-conflict': volunteerWarningTips(item).length > 0,
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
                v-if="volunteerWarningTips(item).length"
                class="hint-popover-wrap cr-vol-clash-mark"
              >
                <span
                  class="hint-popover-trigger cr-vol-clash-icon"
                  tabindex="0"
                  role="img"
                  :aria-label="volunteerWarningTips(item).join(' ')"
                >
                  !
                </span>
                <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                  <span
                    v-for="(tip, tipIdx) in volunteerWarningTips(item)"
                    :key="tipIdx"
                    class="cr-vol-warn-line"
                  >
                    {{ tip }}
                  </span>
                </span>
              </span>
            </td>
            <td class="sticky-left sticky-name col-name nowrap">{{ item.courseName || '—' }}</td>
            <td class="col-section nowrap">{{ groupName(item) }}</td>
            <td v-if="showSelectionGroupColumn" class="col-selection-group cr-selection-group-cell">
              <template v-if="selectionGroupDisplay(item)">
                <div class="cr-selection-group-title">
                  {{ selectionGroupLines(item).title }}
                </div>
                <div class="cr-selection-group-intake">
                  {{ selectionGroupLines(item).intakeLine }}
                </div>
              </template>
              <template v-else>—</template>
            </td>
            <td class="col-category nowrap">{{ courseCategoryLabel(item) }}</td>
            <td class="col-credits nowrap">{{ item.credits ?? '—' }}</td>
            <td class="col-lecturer nowrap">{{ item.lecturer || '—' }}</td>
            <td class="col-week nowrap">{{ item.weekRange || '—' }}</td>
            <td class="col-time-venue cr-time-venue">
              <div
                v-for="(line, li) in displayClassTimeVenueLines(item, timeLocale)"
                :key="li"
                class="cr-time-venue-line"
              >
                {{ line }}
              </div>
            </td>
            <td class="col-submitted-at nowrap">{{ submissionTimeLabel(item) }}</td>
            <td
              class="sticky-right sticky-status"
              :class="{ 'sticky-status--flushright': !showActionsColumn }"
            >
              <span class="status-tag" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td
              v-if="showVolunteerOrder"
              class="sticky-right sticky-capacity"
              :class="{ 'sticky-capacity--flushright': !showActionsColumn }"
            >
              <span class="capacity-pill" :class="sectionCapacityClass(item)">
                {{ sectionSelectedPercent(item) }}
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
      <div
        v-if="isPrimaryEmpty"
        class="table-empty-overlay"
        role="status"
      >
        <p class="table-empty-title">
          {{ t('courseRegistration.student.roundStatusPanel.emptyNoCourses') }}
        </p>
      </div>
    </div>

    <template v-if="showPriorSection">
      <h4 class="cr-round-block-title cr-round-block-title--prior">
        <span>{{ priorRoundHeading }}</span>
        <span class="cr-round-block-meta">{{ priorCountBesideLabel }}</span>
      </h4>
      <div class="table-wrap" :class="{ 'is-empty': isPriorEmpty }">
        <table
          class="data-table data-table--prior"
          :class="[
            showVolunteerOrder ? 'data-table--pref' : 'data-table--flat',
            { 'has-capacity-col': showVolunteerOrder },
          ]"
        >
          <thead>
            <tr>
              <th
                v-if="showVolunteerOrder"
                class="col-drag sticky-left sticky-drag"
                aria-hidden="true"
              />
              <th
                v-if="showVolunteerOrder"
                class="col-pref sticky-left sticky-pref"
              >
                {{ t('common.serialNo') }}
              </th>
              <th v-else class="col-index sticky-left sticky-index">
                {{ t('common.serialNo') }}
              </th>
              <th class="sticky-left sticky-code col-code">{{ t('courseRegistration.courses.code') }}</th>
              <th class="sticky-left sticky-name col-name">{{ t('courseRegistration.courses.name') }}</th>
              <th class="col-section">{{ t('courseRegistration.courses.sectionCode') }}</th>
              <th v-if="showSelectionGroupColumn" class="col-selection-group">
                {{ t('courseRegistration.courses.selectionGroup') }}
              </th>
              <th class="col-category">{{ t('courseRegistration.courses.category') }}</th>
              <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
              <th class="col-lecturer">{{ t('courseRegistration.courses.lecturer') }}</th>
              <th class="col-week">{{ t('courseRegistration.courses.weekRange') }}</th>
              <th class="col-time-venue">{{ t('courseRegistration.courses.classTimeVenue') }}</th>
              <th class="col-submitted-at">{{ t('courseRegistration.student.selectedAt') }}</th>
              <th
                class="sticky-right sticky-status"
                :class="{ 'sticky-status--flushright': !showActionsColumn }"
              >
                {{ t('common.status') }}
              </th>
              <th
                v-if="showVolunteerOrder"
                class="sticky-right sticky-capacity"
                :class="{ 'sticky-capacity--flushright': !showActionsColumn }"
                aria-hidden="true"
              />
              <th v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isPriorEmpty">
              <td :colspan="emptyColspan" class="empty-cell-spacer" aria-hidden="true" />
            </tr>
            <tr v-for="(item, index) in priorRoundRows" :key="`prior-${rowKey(item)}`">
              <td
                v-if="showVolunteerOrder"
                class="col-drag sticky-left sticky-drag"
                aria-hidden="true"
              />
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
              <td class="sticky-left sticky-name col-name nowrap">{{ item.courseName || '—' }}</td>
              <td class="col-section nowrap">{{ groupName(item) }}</td>
              <td v-if="showSelectionGroupColumn" class="col-selection-group cr-selection-group-cell">
                <template v-if="selectionGroupDisplay(item)">
                  <div class="cr-selection-group-title">
                    {{ selectionGroupLines(item).title }}
                  </div>
                  <div class="cr-selection-group-intake">
                    {{ selectionGroupLines(item).intakeLine }}
                  </div>
                </template>
                <template v-else>—</template>
              </td>
              <td class="col-category nowrap">{{ courseCategoryLabel(item) }}</td>
              <td class="col-credits nowrap">{{ item.credits ?? '—' }}</td>
              <td class="col-lecturer nowrap">{{ item.lecturer || '—' }}</td>
              <td class="col-week nowrap">{{ item.weekRange || '—' }}</td>
              <td class="col-time-venue cr-time-venue">
                <div
                  v-for="(line, li) in displayClassTimeVenueLines(item, timeLocale)"
                  :key="li"
                  class="cr-time-venue-line"
                >
                  {{ line }}
                </div>
              </td>
              <td class="col-submitted-at nowrap">{{ submissionTimeLabel(item) }}</td>
              <td
                class="sticky-right sticky-status"
                :class="{ 'sticky-status--flushright': !showActionsColumn }"
              >
                <span class="status-tag" :class="statusClass(item.status)">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td
                v-if="showVolunteerOrder"
                class="sticky-right sticky-capacity"
                :class="{ 'sticky-capacity--flushright': !showActionsColumn }"
                aria-hidden="true"
              />
              <td v-if="showActionsColumn" class="col-actions sticky-right sticky-actions">
                <button
                  v-if="rowCanUnselectPrior(item)"
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
        <div v-if="isPriorEmpty" class="table-empty-overlay" role="status">
          <p class="table-empty-title">
            {{ t('courseRegistration.student.roundStatusPanel.emptyNoCourses') }}
          </p>
        </div>
      </div>
    </template>

    <div v-if="queuedRows.length || showDrawerRail" class="cr-round-drawer">
      <!-- 排队中：有数据即默认展示，不跟「展开更多」 -->
      <div v-if="queuedRows.length" class="cr-round-drawer-body">
        <div class="table-wrap cr-round-drawer-table">
          <h4 class="cr-round-drawer-section-title">
            {{ t('courseRegistration.student.volunteerSheet.queuedSection') }}
            <span class="cr-queue-count">({{ queuedRows.length }})</span>
          </h4>
          <table
            class="data-table"
            :class="[
              showVolunteerOrder ? 'data-table--pref data-table--queue' : 'data-table--flat data-table--queue',
              { 'has-capacity-col': showVolunteerOrder },
            ]"
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
                <th class="sticky-left sticky-code col-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="sticky-left sticky-name col-name">{{ t('courseRegistration.courses.name') }}</th>
                <th class="col-section">{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th class="col-category">{{ t('courseRegistration.courses.category') }}</th>
                <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                <th class="col-lecturer">{{ t('courseRegistration.courses.lecturer') }}</th>
                <th class="col-week">{{ t('courseRegistration.courses.weekRange') }}</th>
                <th class="col-time-venue">{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th class="col-submitted-at">{{ t('courseRegistration.student.selectedAt') }}</th>
                <th
                  class="sticky-right sticky-status"
                  :class="{ 'sticky-status--flushright': !showActionsColumn }"
                >
                  {{ t('common.status') }}
                </th>
                <th
                  v-if="showVolunteerOrder"
                  class="sticky-right sticky-capacity"
                  :class="{ 'sticky-capacity--flushright': !showActionsColumn }"
                >
                  {{ t('courseRegistration.courses.volunteerSelectedPercent') }}
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
                <td class="sticky-left sticky-name col-name nowrap">{{ item.courseName || '—' }}</td>
                <td class="col-section nowrap">{{ groupName(item) }}</td>
                <td class="col-category nowrap">{{ courseCategoryLabel(item) }}</td>
                <td class="col-credits nowrap">{{ item.credits ?? '—' }}</td>
                <td class="col-lecturer nowrap">{{ item.lecturer || '—' }}</td>
                <td class="col-week nowrap">{{ item.weekRange || '—' }}</td>
                <td class="col-time-venue cr-time-venue">
                  <div
                    v-for="(line, li) in displayClassTimeVenueLines(item, timeLocale)"
                    :key="li"
                    class="cr-time-venue-line"
                  >
                    {{ line }}
                  </div>
                </td>
                <td class="col-submitted-at nowrap">{{ submissionTimeLabel(item) }}</td>
                <td
                  class="sticky-right sticky-status"
                  :class="{ 'sticky-status--flushright': !showActionsColumn }"
                >
                  <span class="status-tag tag-blue">
                    <span class="queue-spinner" aria-hidden="true" />
                    {{ statusLabel('queued') }}
                  </span>
                </td>
                <td
                  v-if="showVolunteerOrder"
                  class="sticky-right sticky-capacity"
                  :class="{ 'sticky-capacity--flushright': !showActionsColumn }"
                >
                  <span class="capacity-pill" :class="sectionCapacityClass(item)">
                    {{ sectionSelectedPercent(item) }}
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
        v-if="showDrawerRail"
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

.cr-round-block-title {
  margin: 10px 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 4px;
}

.cr-round-block-meta {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.cr-round-block-title--prior {
  margin-top: 14px;
}

.data-table--prior .col-pref {
  font-weight: 500;
  color: #374151;
  text-align: left;
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

/* 空态：保留表结构，浮层相对可见区域居中（避免 flex+宽表/sticky 布局异常） */
.table-wrap.is-empty {
  position: relative;
}

.empty-cell-spacer {
  height: 72px;
  padding: 0 !important;
  border-bottom: none !important;
  background: #fff;
}

.table-empty-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  pointer-events: none;
  z-index: 2;
}

.table-empty-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.02em;
  text-align: center;
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
  text-align: left;
}

.col-pref {
  width: 88px;
  min-width: 88px;
  font-weight: 600;
  color: #1d4ed8;
  text-align: left;
}

.data-table--queue .col-pref {
  font-weight: 500;
  color: #374151;
  text-align: left;
}

/* 按内容自适应列宽，避免 fixed 均分导致短列留白、长列狂换行 */
.data-table--pref,
.data-table--flat {
  table-layout: auto;
  width: max-content;
  min-width: 100%;
}

.nowrap {
  white-space: nowrap;
}

.col-code {
  width: 1%;
  min-width: 88px;
  white-space: nowrap;
}

.col-name {
  min-width: 168px;
  max-width: 280px;
  white-space: nowrap;
}

.col-section {
  width: 1%;
  min-width: 88px;
  white-space: nowrap;
}

.col-selection-group {
  min-width: 120px;
  max-width: 180px;
}

.col-category {
  width: 1%;
  min-width: 72px;
  white-space: nowrap;
}

/* GE「AI与开放选修」/ ME 同类文案单行展示 */
.col-school-elective {
  width: 1%;
  min-width: 108px;
  white-space: nowrap;
}

.col-credits {
  width: 1%;
  min-width: 40px;
  max-width: 52px;
  text-align: center;
  white-space: nowrap;
}

.col-lecturer {
  min-width: 120px;
  white-space: nowrap;
}

.col-week {
  width: 1%;
  min-width: 52px;
  max-width: 64px;
  white-space: nowrap;
  text-align: center;
}

.col-time-venue,
.cr-time-venue {
  min-width: 220px;
  max-width: 320px;
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.col-submitted-at {
  width: 1%;
  min-width: 136px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.col-actions {
  width: 1%;
  min-width: 64px;
  max-width: 88px;
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
  min-width: 88px;
}
.data-table--flat .sticky-name {
  left: 144px;
  min-width: 168px;
  box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
.data-table--pref .sticky-code {
  left: 116px;
  min-width: 88px;
}
.data-table--pref .sticky-name {
  left: 212px;
  min-width: 168px;
  box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.18);
}

.data-table--pref .sticky-actions,
.data-table--pref .col-actions,
.data-table--flat .sticky-actions,
.data-table--flat .col-actions {
  right: 0;
  min-width: 64px;
  width: 72px;
  white-space: nowrap;
}
.data-table--pref .sticky-status,
.data-table--flat .sticky-status {
  right: 72px;
  min-width: 72px;
  width: 80px;
  white-space: nowrap;
  box-shadow: -4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
.data-table--pref .sticky-status--flushright,
.data-table--flat .sticky-status--flushright {
  right: 0;
}
.data-table--pref .sticky-capacity,
.data-table--flat .sticky-capacity {
  right: 72px;
  min-width: 112px;
  width: 112px;
  padding-left: 8px;
  padding-right: 8px;
  text-align: center;
  white-space: nowrap;
  box-shadow: -4px 0 8px -6px rgba(0, 0, 0, 0.18);
}
.data-table--pref .sticky-capacity--flushright,
.data-table--flat .sticky-capacity--flushright {
  right: 0;
  box-shadow: none;
}
/* 有容量列时，状态列右偏移让位：操作 72 + 百分比 112 */
.data-table--pref.has-capacity-col .sticky-status,
.data-table--flat.has-capacity-col .sticky-status {
  right: 184px;
}
.data-table--pref.has-capacity-col .sticky-status--flushright,
.data-table--flat.has-capacity-col .sticky-status--flushright {
  right: 112px;
}

/* 课程已选百分比胶囊（与选课列表同源） */
.capacity-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.capacity-open {
  color: #047857;
  background: #d1fae5;
}
.capacity-warn {
  color: #b45309;
  background: #fef3c7;
}
.capacity-full {
  color: #b91c1c;
  background: #fee2e2;
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
  display: none;
  flex-direction: column;
  gap: 6px;
  white-space: normal;
}

.cr-vol-clash-mark:hover .hint-popover-content,
.cr-vol-clash-mark:focus-within .hint-popover-content {
  display: flex;
}

.cr-vol-warn-line {
  display: block;
  line-height: 1.4;
}

.cr-selection-group-cell {
  font-weight: 500;
  color: #374151;
  text-align: left;
  vertical-align: middle;
  line-height: 1.3;
  min-width: 120px;
  max-width: 140px;
}

.cr-selection-group-title {
  white-space: nowrap;
  text-align: left;
}

.cr-selection-group-intake {
  font-size: 10px;
  font-weight: 400;
  color: #4b5563;
  margin-top: 2px;
  white-space: nowrap;
  text-align: left;
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
