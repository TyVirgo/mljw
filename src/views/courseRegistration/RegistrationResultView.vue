<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import PreselectVolunteerRosterDrawer from '../../components/courseRegistration/PreselectVolunteerRosterDrawer.vue'
import RoundSpecialAddedRosterDrawer from '../../components/courseRegistration/RoundSpecialAddedRosterDrawer.vue'
import AdminAddCourseForStudentModal from '../../components/courseRegistration/AdminAddCourseForStudentModal.vue'
import VolunteerPublishLogModal from '../../components/courseRegistration/VolunteerPublishLogModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import { listResultDemoBatches, registrationBatches } from '../../data/courseRegistration/registrationBatches.js'
import {
  adminStudentRegistrationResults,
  filterStudentResults,
  removeAdminStudentRegistrations,
  removeAdminCourseRegistrations,
} from '../../data/courseRegistration/registrationResult.js'
import {
  RESULT_ROUND_KEYS,
  RESULT_ROUND_LABEL_KEYS,
  listRoundCourseSummaries,
  roundCourseRosters,
} from '../../data/courseRegistration/registrationResultByRound.js'
import {
  volunteerCourseStates,
  listVolunteerCourseSummaries,
  getVolunteerSectionState,
  usesSelectedRoster,
  isVolunteerBatchReadonly,
  isVolunteerBatchFinalized,
  getVolunteerBatchFinalizedAt,
} from '../../data/courseRegistration/preselectVolunteerConfirm.js'
import {
  sortRowsByCourseThenSection,
  paginateSectionRowsByCourse,
} from '../../data/courseRegistration/sectionTableRowSpans.js'
import {
  formatResultReleaseDisplay,
  canManualPublishVolunteerBatch,
  manualPublishVolunteerBatch,
  tickVolunteerResultPublish,
  ensureVolunteerPublishLogSeeded,
  volunteerPublishLogs,
} from '../../data/courseRegistration/preselectReleaseSync.js'
import {
  resultStudentExportFields,
  resultCourseExportFields,
} from '../../data/courseRegistration/courseRegistrationExportFields.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import { feeCourseSourceLabel } from '../../data/courseRegistration/feeRosterQueue.js'
import {
  exportCourseRegistrationData,
  formatResultStudentExportRow,
  formatResultCourseExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { getResultReleaseAt } from '../../data/courseRegistration/studentVolunteerSheet.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const activeTab = ref('round')
const selectedRound = ref('preselect')

const emptyStudentSearch = () => ({
  studentId: '',
  studentName: '',
  programme: '',
  batchId: '',
  courseCode: '',
})
const emptyCourseSearch = () => ({
  batchId: '',
  courseCode: '',
  courseName: '',
})

/**
 * 页顶默认批次：优先列表中第一个尚未最终确认的 demo 批次
 * @returns {string}
 */
function pickDefaultBatchId() {
  const list = listResultDemoBatches()
  const unconfirmed = list.find((b) => !b.volunteerFinalConfirmedAt)
  if (unconfirmed) return unconfirmed.id
  return list[0]?.id || ''
}

/** 页顶选中批次，同步过滤两 Tab */
const selectedBatchId = ref(pickDefaultBatchId())

const studentSearchForm = ref(emptyStudentSearch())
const studentApplied = ref(emptyStudentSearch())
const roundSearchForm = ref(emptyCourseSearch())
const roundApplied = ref(emptyCourseSearch())

/**
 * 将页顶批次写入两 Tab 的 search/applied，避免搜索区双源
 * @param {string} [batchId]
 */
function syncBatchToFilters(batchId = selectedBatchId.value) {
  const id = batchId || ''
  studentSearchForm.value = { ...studentSearchForm.value, batchId: id }
  studentApplied.value = { ...studentApplied.value, batchId: id }
  roundSearchForm.value = { ...roundSearchForm.value, batchId: id }
  roundApplied.value = { ...roundApplied.value, batchId: id }
}

/** 是否课程维度·第一轮（志愿融合表） */
const isRound1CourseView = computed(
  () => activeTab.value === 'round' && selectedRound.value === 'preselect',
)

// 进入页即按默认批次过滤
syncBatchToFilters()

const currentPage = ref(1)
const pageSize = ref(20)
const exportModalVisible = ref(false)
/** 学生维度「新增」代选弹窗 */
const addCourseModalVisible = ref(false)
const selectedIds = ref([])
const pendingDeleteIds = ref([])
const confirmVisible = ref(false)
const confirmMessage = ref('')
const confirmMode = ref('delete')
const volunteerDrawerVisible = ref(false)
const volunteerCourseId = ref('')
const volunteerSectionId = ref('')
const volunteerTableTick = ref(0)
const specialRosterVisible = ref(false)
const specialRosterCourseId = ref('')
const specialRosterCourseCode = ref('')
const specialRosterCourseName = ref('')
/** 结果页 demo 批次公布文案固定，不随真实时间刷新 */
const batchOptions = computed(() => listResultDemoBatches())

const studentRows = computed(() => adminStudentRegistrationResults.value)

/** R2/R3：一行一课 */
const roundCourseRows = computed(() => {
  void roundCourseRosters.value
  if (activeTab.value !== 'round' || selectedRound.value === 'preselect') return []
  return listRoundCourseSummaries(selectedRound.value, roundApplied.value)
})

/**
 * 分组「选上」人数：GE/ME 看 selected；否则容量内人数
 * @param {object} volunteerRow listVolunteerCourseSummaries 行
 */
function sectionSelectedCount(volunteerRow) {
  const state = getVolunteerSectionState(volunteerRow.courseId, volunteerRow.sectionId)
  if (state && usesSelectedRoster(state)) {
    return (state.volunteers || []).filter((v) => v.selected).length
  }
  const count = Number(volunteerRow.volunteerCount) || 0
  const cap = Number(volunteerRow.seniorCapacity) || 0
  return cap > 0 ? Math.min(count, cap) : count
}

/**
 * 第一轮：志愿分组行 + 课级容量（与志愿选上同源，口径 A）
 * @returns {object[]}
 */
function buildRound1MergedSectionRows() {
  void volunteerCourseStates.value
  void volunteerTableTick.value
  void roundCourseRosters.value
  const volunteers = listVolunteerCourseSummaries(roundApplied.value)
  const specialByCourse = new Map(
    listRoundCourseSummaries('preselect', roundApplied.value).map((r) => [
      r.courseId,
      Number(r.specialAddedCount) || 0,
    ]),
  )

  /** @type {Map<string, { selected: number, seniorCap: number }>} */
  const courseAgg = new Map()
  for (const v of volunteers) {
    const selected = sectionSelectedCount(v)
    const seniorCap = Number(v.seniorCapacity) || 0
    const prev = courseAgg.get(v.courseId) || { selected: 0, seniorCap: 0 }
    courseAgg.set(v.courseId, {
      selected: prev.selected + selected,
      seniorCap: prev.seniorCap + seniorCap,
    })
  }

  const rows = volunteers.map((v) => {
    const agg = courseAgg.get(v.courseId) || { selected: 0, seniorCap: 0 }
    const seniorLabel = `${agg.selected}/${agg.seniorCap}`
    return {
      ...v,
      course: {
        id: v.courseId,
        code: v.courseCode,
        name: v.courseName,
        type: v.courseType,
        credits: v.credits,
      },
      section: {
        id: v.sectionId,
        code: v.sectionCode,
      },
      // 口径 A：有效最大 = 老生；无新生列
      effectiveCapacityLabel: seniorLabel,
      seniorCapacityLabel: seniorLabel,
      freshmanCapacityLabel: '',
      specialAddedCount: specialByCourse.get(v.courseId) || 0,
    }
  })
  return sortRowsByCourseThenSection(rows)
}

const round1SectionRowsAll = computed(() => {
  if (!isRound1CourseView.value) return []
  return buildRound1MergedSectionRows()
})

const round1Paged = computed(() => {
  if (!isRound1CourseView.value) {
    return { rows: [], totalCourses: 0, firstCourseIndex: 0 }
  }
  return paginateSectionRowsByCourse(
    round1SectionRowsAll.value,
    currentPage.value,
    pageSize.value,
    { groupAware: false },
  )
})

const rows = computed(() => {
  if (activeTab.value === 'student') {
    return filterStudentResults(studentRows.value, studentApplied.value)
  }
  if (isRound1CourseView.value) return round1SectionRowsAll.value
  return roundCourseRows.value
})

const totalCount = computed(() => {
  if (isRound1CourseView.value) return round1Paged.value.totalCourses
  return rows.value.length
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedRows = computed(() => {
  if (isRound1CourseView.value) return round1Paged.value.rows
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

function spanCell(row, field) {
  return row?._span?.[field] || null
}

/** 按最长批次名撑开下拉宽度（对齐学生在线选课） */
const batchSelectWidth = ref('')

/**
 * 测量 select 文案宽度
 * @param {string[]} labels 选项文案
 * @returns {string} CSS width 或空
 */
function measureSelectWidth(labels) {
  const list = (labels || []).filter(Boolean)
  if (!list.length) return ''
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:13px;font-family:inherit;padding:0 10px;box-sizing:border-box;'
  document.body.appendChild(probe)
  let max = 0
  for (const label of list) {
    probe.textContent = label
    max = Math.max(max, probe.offsetWidth)
  }
  document.body.removeChild(probe)
  return `${Math.ceil(max + 32)}px`
}

/** 根据当前批次选项更新下拉宽度 */
function measureBatchSelectWidth() {
  batchSelectWidth.value = measureSelectWidth(batchOptions.value.map((b) => b.name || b.id))
}

watch(
  batchOptions,
  () => {
    nextTick(() => measureBatchSelectWidth())
  },
  { deep: true },
)

const exportFields = computed(() =>
  activeTab.value === 'student' ? resultStudentExportFields : resultCourseExportFields,
)

const showBulkToolbar = computed(
  () => activeTab.value === 'student' || (activeTab.value === 'round' && !isRound1CourseView.value),
)
const showVolunteerToolbar = computed(() => isRound1CourseView.value)

/** 依赖批次列表，便于定稿后刷新状态 */
const volunteerBatchTick = computed(() =>
  registrationBatches.value
    .map(
      (b) =>
        `${b.id}:${b.volunteerFinalConfirmedAt || ''}:${b.demoResultReleaseFixed?.lockedPending || ''}:${b.demoResultReleaseFixed?.released || ''}`,
    )
    .join('|'),
)

/** 当前批次志愿是否只读（已定稿或第二轮开始） */
const volunteerReadonly = computed(() => {
  void volunteerBatchTick.value
  return isVolunteerBatchReadonly(selectedBatchId.value)
})

/** 当前批次是否已最终确认 */
const volunteerBatchFinalized = computed(() => {
  void volunteerBatchTick.value
  return isVolunteerBatchFinalized(selectedBatchId.value)
})

const canPublish = computed(() => {
  void volunteerBatchTick.value
  return canManualPublishVolunteerBatch(selectedBatchId.value)
})

const selectedBatchName = computed(() => {
  const b = registrationBatches.value.find((x) => x.id === selectedBatchId.value)
  return b?.name || ''
})

/** 有/无最终确认的状态文案（工具行展示；demo 批次固定不随真实时间变） */
const volunteerConfirmStatusLabel = computed(() => {
  void volunteerBatchTick.value
  const batch = registrationBatches.value.find((b) => b.id === selectedBatchId.value)
  const fixed = batch?.demoResultReleaseFixed
  if (fixed) {
    if (fixed.released || (batch.volunteerFinalConfirmedAt && !fixed.lockedPending)) {
      return t('courseRegistration.result.volunteerReleasePublishedFixed', { at: fixed.displayAt })
    }
    if (batch.volunteerFinalConfirmedAt || fixed.lockedPending) {
      return t('courseRegistration.result.volunteerReleaseLockedPendingFixed', {
        at: fixed.displayAt,
        days: fixed.remainingDays ?? 0,
        hours: fixed.remainingHours ?? 0,
      })
    }
    return t('courseRegistration.result.volunteerReleasePendingFixed', {
      at: fixed.displayAt,
      days: fixed.remainingDays ?? 0,
      hours: fixed.remainingHours ?? 0,
    })
  }
  const at = getVolunteerBatchFinalizedAt(selectedBatchId.value)
  if (at) {
    const raw = getResultReleaseAt(batch)
    const display = formatResultReleaseDisplay(raw)
    return t('courseRegistration.result.volunteerReleaseLockedAt', {
      at: display || String(at).slice(0, 19).replace('T', ' '),
    })
  }
  const raw = getResultReleaseAt(batch)
  if (!raw) return t('courseRegistration.result.volunteerReleasePending')
  return t('courseRegistration.result.volunteerReleasePublished', {
    at: formatResultReleaseDisplay(raw),
  })
})

const publishLogVisible = ref(false)
let publishTickTimer = null

onMounted(() => {
  measureBatchSelectWidth()
  if (!batchOptions.value.some((b) => b.id === selectedBatchId.value)) {
    selectedBatchId.value = pickDefaultBatchId()
    syncBatchToFilters(selectedBatchId.value)
  }
  ensureVolunteerPublishLogSeeded()
  tickVolunteerResultPublish()
  publishTickTimer = setInterval(() => tickVolunteerResultPublish(), 15000)
})

onBeforeUnmount(() => {
  if (publishTickTimer) clearInterval(publishTickTimer)
})

function requestManualPublish() {
  if (!canPublish.value) return
  confirmMode.value = 'publish'
  confirmMessage.value = t('courseRegistration.result.publishConfirm')
  confirmVisible.value = true
}

function openPublishLog() {
  ensureVolunteerPublishLogSeeded()
  void volunteerPublishLogs.value
  publishLogVisible.value = true
}

const hasSelection = computed(() => selectedIds.value.length > 0)
const allPageSelected = computed(() => {
  if (!paginatedRows.value.length) return false
  return paginatedRows.value.every((row) => selectedIds.value.includes(row.id))
})

watch(activeTab, () => {
  currentPage.value = 1
  selectedIds.value = []
})

watch(selectedRound, () => {
  if (activeTab.value !== 'round') return
  currentPage.value = 1
  selectedIds.value = []
})

/** 切换页顶批次时同步三 Tab 过滤并重置分页/勾选 */
watch(selectedBatchId, (id) => {
  syncBatchToFilters(id)
  currentPage.value = 1
  clearSelection()
})

function clearSelection() {
  selectedIds.value = []
}

function handleSearch() {
  if (activeTab.value === 'student') {
    studentApplied.value = { ...studentSearchForm.value }
  } else {
    roundApplied.value = { ...roundSearchForm.value }
  }
  currentPage.value = 1
  clearSelection()
}

function handleReset() {
  if (activeTab.value === 'student') {
    studentSearchForm.value = emptyStudentSearch()
    studentApplied.value = emptyStudentSearch()
  } else {
    roundSearchForm.value = emptyCourseSearch()
    roundApplied.value = emptyCourseSearch()
  }
  // 重置搜索条件后仍保留当前选课批次
  syncBatchToFilters(selectedBatchId.value)
  currentPage.value = 1
  clearSelection()
}

function toggleSelectAll(event) {
  const pageIds = paginatedRows.value.map((row) => row.id)
  if (event.target.checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  const index = selectedIds.value.indexOf(id)
  if (index === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(index, 1)
}

function requestBatchDelete() {
  if (!selectedIds.value.length) {
    window.alert(t('courseRegistration.result.deleteEmpty'))
    return
  }
  pendingDeleteIds.value = [...selectedIds.value]
  const confirmKey =
    activeTab.value === 'student'
      ? 'courseRegistration.result.deleteConfirm'
      : 'courseRegistration.result.deleteCourseConfirm'
  confirmMode.value = 'delete'
  confirmMessage.value = t(confirmKey, { count: pendingDeleteIds.value.length })
  confirmVisible.value = true
}

function confirmBatchDelete() {
  const removeFn =
    activeTab.value === 'student' ? removeAdminStudentRegistrations : removeAdminCourseRegistrations
  const result = removeFn(pendingDeleteIds.value)
  if (!result.ok) {
    window.alert(t(result.errorKey))
    confirmVisible.value = false
    return
  }
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function confirmManualPublish() {
  const result = manualPublishVolunteerBatch(selectedBatchId.value)
  confirmVisible.value = false
  confirmMode.value = 'delete'
  if (!result.ok) {
    window.alert(t('courseRegistration.result.publishNotAllowed'))
    return
  }
}

function roundLabel(key) {
  return RESULT_ROUND_LABEL_KEYS[key] ? t(RESULT_ROUND_LABEL_KEYS[key]) : key
}

function openVolunteerRoster(row) {
  volunteerCourseId.value = row.courseId || ''
  volunteerSectionId.value = row.sectionId || ''
  volunteerDrawerVisible.value = true
}

function openSpecialAddedRoster(row) {
  if (!row?.specialAddedCount) return
  specialRosterCourseId.value = row.courseId || ''
  specialRosterCourseCode.value = row.courseCode || ''
  specialRosterCourseName.value = row.courseName || ''
  specialRosterVisible.value = true
}

function refreshVolunteerTable() {
  volunteerTableTick.value += 1
}

function handleDialogConfirm() {
  if (confirmMode.value === 'publish') {
    confirmManualPublish()
    return
  }
  confirmBatchDelete()
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = exportFields.value.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: activeTab.value === 'student' ? formatResultStudentExportRow : formatResultCourseExportRow,
    filename: `registration-results-${activeTab.value}-${timestamp}.xlsx`,
    sheetName: activeTab.value === 'student' ? 'By Student' : 'By Round',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-result-page">
    <div class="page-card">
      <div class="tab-bar">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'round' }"
          @click="activeTab = 'round'"
        >
          {{ t('courseRegistration.result.tabCourse') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'student' }"
          @click="activeTab = 'student'"
        >
          {{ t('courseRegistration.result.tabStudent') }}
        </button>
      </div>

      <div v-if="activeTab === 'round'" class="round-tab-bar">
        <button
          v-for="key in RESULT_ROUND_KEYS"
          :key="key"
          type="button"
          class="round-tab-btn"
          :class="{ active: selectedRound === key }"
          @click="selectedRound = key"
        >
          {{ roundLabel(key) }}
        </button>
      </div>

      <CourseRegistrationCallout v-if="isRound1CourseView" variant="info" class="volunteer-hint-callout">
        {{ t('courseRegistration.result.volunteerHint') }}
      </CourseRegistrationCallout>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <!-- 页级批次：三 Tab 共用，置于搜索区首位；切换即生效 -->
            <div class="search-item cr-result-batch-item">
              <label for="cr-result-batch-select">
                {{ t('courseRegistration.student.batchSelectLabel') }}
              </label>
              <select
                id="cr-result-batch-select"
                v-model="selectedBatchId"
                class="search-select cr-result-batch-select"
                :style="batchSelectWidth ? { width: batchSelectWidth } : undefined"
              >
                <option v-for="batch in batchOptions" :key="batch.id" :value="batch.id">
                  {{ batch.name }}
                </option>
              </select>
            </div>
            <template v-if="activeTab === 'student'">
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                <input
                  v-model="studentSearchForm.studentId"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                <input
                  v-model="studentSearchForm.studentName"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.programme') }}</label>
                <input
                  v-model="studentSearchForm.programme"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.code') }}</label>
                <input
                  v-model="studentSearchForm.courseCode"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
            </template>
            <template v-else>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.code') }}</label>
                <input
                  v-model="roundSearchForm.courseCode"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.name') }}</label>
                <input
                  v-model="roundSearchForm.courseName"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
            </template>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
          </div>
        </div>
      </div>

      <div v-if="showBulkToolbar" class="toolbar result-toolbar">
        <div class="toolbar-left">
          <!-- 学生维度：添加特殊学生（代选，一次一名学生） -->
          <button
            v-if="activeTab === 'student'"
            type="button"
            class="btn btn-primary"
            @click="addCourseModalVisible = true"
          >
            {{ t('courseRegistration.result.addSpecialStudent') }}
          </button>
          <button
            type="button"
            class="btn btn-dark"
            :disabled="!hasSelection"
            @click="requestBatchDelete"
          >
            {{ t('common.delete') }}
          </button>
          <button type="button" class="btn btn-default" @click="exportModalVisible = true">
            {{ t('common.export') }}
          </button>
        </div>
      </div>

      <div v-if="showVolunteerToolbar" class="toolbar result-toolbar">
        <div class="toolbar-left">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canPublish"
            @click="requestManualPublish"
          >
            {{ t('courseRegistration.result.publishBtn') }}
          </button>
          <button type="button" class="btn btn-default" @click="openPublishLog">
            {{ t('courseRegistration.result.publishLogBtn') }}
          </button>
          <span
            class="volunteer-confirm-status toolbar-status"
            :class="volunteerBatchFinalized ? 'is-confirmed' : 'is-pending'"
          >
            {{ volunteerConfirmStatusLabel }}
          </span>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table v-if="activeTab === 'student'" class="data-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                <th>{{ t('courseRegistration.monitor.programme') }}</th>
                <th>{{ t('courseRegistration.monitor.intake') }}</th>
                <th>{{ t('courseRegistration.batch.name') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.type') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th>{{ t('courseRegistration.student.courseSource') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(row.id)"
                    @change="toggleSelect(row.id)"
                  />
                </td>
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.studentId }}</td>
                <td>{{ row.studentName }}</td>
                <td>{{ row.programme }}</td>
                <td>{{ formatIntakeBatch(row.intake) }}</td>
                <td>{{ row.batchName || '—' }}</td>
                <td class="nowrap">{{ row.courseCode }}</td>
                <td>{{ row.courseName }}</td>
                <td>{{ row.credits }}</td>
                <td class="nowrap">{{ getRegistrationTypeLabel(row.courseType, t) }}</td>
                <td class="nowrap">
                  {{
                    row.sectionCode
                      ? t('courseRegistration.courses.sectionNameDisplay', { code: row.sectionCode })
                      : '—'
                  }}
                </td>
                <td class="nowrap">{{ feeCourseSourceLabel(row.courseSource, t) }}</td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="13" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 课程维度·第一轮：志愿 + 容量融合，同课多分组 rowspan -->
          <table v-else-if="isRound1CourseView" class="data-table round-dim-table round1-merge-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.batch.name') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.type') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.result.volunteerSectionGroup') }}</th>
                <th>{{ t('courseRegistration.result.volunteerCapacityLabel') }}</th>
                <th>{{ t('courseRegistration.courses.volunteerSelectedPercent') }}</th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.effectiveCapacityWithRatioTipR1')"
                  >
                    {{ t('courseRegistration.result.effectiveCapacityWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.seniorCapacityWithRatioTip')"
                  >
                    {{ t('courseRegistration.result.seniorCapacityWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.specialAddedCountTip')"
                  >
                    {{ t('courseRegistration.result.specialAddedCount') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paginatedRows"
                :key="row.id || `${row.courseId}-${row.sectionId}`"
              >
                <td
                  v-if="spanCell(row, 'serial')?.show"
                  :rowspan="spanCell(row, 'serial').rowspan"
                >
                  {{ spanCell(row, 'serial').value }}
                </td>
                <td
                  v-if="spanCell(row, 'batch')?.show"
                  :rowspan="spanCell(row, 'batch').rowspan"
                >
                  {{ row.batchName || '—' }}
                </td>
                <td
                  v-if="spanCell(row, 'code')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'code').rowspan"
                >
                  {{ row.courseCode }}
                </td>
                <td
                  v-if="spanCell(row, 'name')?.show"
                  :rowspan="spanCell(row, 'name').rowspan"
                >
                  {{ row.courseName }}
                </td>
                <td
                  v-if="spanCell(row, 'type')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'type').rowspan"
                >
                  {{ getRegistrationTypeLabel(row.courseType, t) }}
                </td>
                <td
                  v-if="spanCell(row, 'credits')?.show"
                  :rowspan="spanCell(row, 'credits').rowspan"
                >
                  {{ row.credits }}
                </td>
                <td class="nowrap">
                  {{
                    t('courseRegistration.courses.sectionNameDisplay', {
                      code: row.sectionCode || row.section?.code,
                    })
                  }}
                </td>
                <td>{{ row.capacityLabel }}</td>
                <td class="td-capacity">
                  <span
                    v-if="row.selectedPercentLabel && row.selectedPercentLabel !== '—'"
                    class="capacity-pill"
                    :class="row.capacityTone"
                  >
                    {{ row.selectedPercentLabel }}
                  </span>
                  <template v-else>—</template>
                </td>
                <td
                  v-if="spanCell(row, 'effectiveCap')?.show"
                  :rowspan="spanCell(row, 'effectiveCap').rowspan"
                >
                  {{ row.effectiveCapacityLabel }}
                </td>
                <td
                  v-if="spanCell(row, 'seniorCap')?.show"
                  :rowspan="spanCell(row, 'seniorCap').rowspan"
                >
                  {{ row.seniorCapacityLabel }}
                </td>
                <td
                  v-if="spanCell(row, 'specialAdded')?.show"
                  :rowspan="spanCell(row, 'specialAdded').rowspan"
                >
                  <button
                    v-if="row.specialAddedCount > 0"
                    type="button"
                    class="link-btn"
                    @click="openSpecialAddedRoster(row)"
                  >
                    {{ row.specialAddedCount }}
                  </button>
                  <template v-else>0</template>
                </td>
                <td class="col-actions">
                  <button type="button" class="link-btn" @click="openVolunteerRoster(row)">
                    {{
                      volunteerReadonly
                        ? t('courseRegistration.result.volunteerRosterViewAction')
                        : t('courseRegistration.result.volunteerRosterAction')
                    }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="13" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 课程维度·第二/三轮：一行一课 -->
          <table v-else class="data-table round-dim-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.batch.name') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.effectiveCapacityWithRatioTip')"
                  >
                    {{ t('courseRegistration.result.effectiveCapacityWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.freshmanCapacityWithRatioTip')"
                  >
                    {{ t('courseRegistration.result.freshmanCapacityWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.seniorCapacityWithRatioTip')"
                  >
                    {{ t('courseRegistration.result.seniorCapacityWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.specialAddedCountTip')"
                  >
                    {{ t('courseRegistration.result.specialAddedCount') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="`${selectedRound}-${row.id}`">
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(row.id)"
                    @change="toggleSelect(row.id)"
                  />
                </td>
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.batchName || '—' }}</td>
                <td>{{ row.courseCode }}</td>
                <td>{{ row.courseName }}</td>
                <td>{{ row.credits }}</td>
                <td>{{ row.effectiveCapacityLabel }}</td>
                <td>{{ row.freshmanCapacityLabel }}</td>
                <td>{{ row.seniorCapacityLabel }}</td>
                <td>
                  <button
                    v-if="row.specialAddedCount > 0"
                    type="button"
                    class="link-btn"
                    @click="openSpecialAddedRoster(row)"
                  >
                    {{ row.specialAddedCount }}
                  </button>
                  <template v-else>0</template>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="10" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          v-model="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
        />
      </div>
    </div>

    <PreselectVolunteerRosterDrawer
      :visible="volunteerDrawerVisible"
      :course-id="volunteerCourseId"
      :section-id="volunteerSectionId"
      @close="volunteerDrawerVisible = false; refreshVolunteerTable()"
      @saved="refreshVolunteerTable()"
    />

    <RoundSpecialAddedRosterDrawer
      :visible="specialRosterVisible"
      :round-key="selectedRound"
      :course-id="specialRosterCourseId"
      :course-code="specialRosterCourseCode"
      :course-name="specialRosterCourseName"
      @close="specialRosterVisible = false"
    />

    <AdminAddCourseForStudentModal
      v-if="addCourseModalVisible"
      :visible="addCourseModalVisible"
      :batch-id="selectedBatchId"
      @close="addCourseModalVisible = false"
      @success="currentPage = 1"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="exportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="
        confirmMode === 'publish'
          ? t('courseRegistration.result.publishBtn')
          : t('common.deleteConfirmation')
      "
      :message="confirmMessage"
      :confirm-text="
        confirmMode === 'publish' ? t('courseRegistration.result.publishBtn') : t('common.delete')
      "
      :confirm-variant="confirmMode === 'publish' ? 'primary' : 'danger'"
      @confirm="handleDialogConfirm"
      @cancel="confirmVisible = false"
    />

    <VolunteerPublishLogModal
      :visible="publishLogVisible"
      :batch-id="selectedBatchId"
      :batch-name="selectedBatchName"
      @close="publishLogVisible = false"
    />
  </div>
</template>

<style scoped>
.round-tab-bar {
  display: flex;
  gap: 8px;
  margin: 0 0 12px;
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
}

.round-tab-btn {
  padding: 8px 14px;
  border: none;
  background: none;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.round-tab-btn.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
  background: #eff6ff;
}

.result-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.result-toolbar .btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.result-toolbar .btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.result-toolbar .btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}
.result-toolbar .btn-default {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}
.result-toolbar .btn-default:hover:not(:disabled) {
  background: #f9fafb;
}
.result-toolbar .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-dark {
  background: #374151;
  color: #fff;
}

.btn-dark:hover:not(:disabled) {
  background: #1f2937;
}

.btn-dark:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.col-check {
  width: 44px;
  min-width: 44px;
  text-align: center;
}

.col-actions {
  white-space: nowrap;
}

/* 搜索区批次：按最长选项名撑开，避免截断；其余筛选项随 flex-wrap 自适应 */
.cr-result-batch-item {
  flex: 0 0 auto;
}

.cr-result-batch-select {
  max-width: min(100%, 720px);
  min-width: 200px;
}

.volunteer-hint-callout {
  margin-bottom: 12px;
}

.volunteer-confirm-status {
  margin-left: 8px;
  font-weight: 600;
  font-size: 13px;
}

.volunteer-confirm-status.is-confirmed {
  color: #059669;
}

.volunteer-confirm-status.is-pending {
  color: #b45309;
}

.toolbar-status {
  margin-left: 0;
}

.link-btn.is-disabled,
.link-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
  pointer-events: none;
}

/* 原 .volunteer-confirmed 已由 .volunteer-confirm-status 替代 */

.dirty-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
}

.muted {
  color: #9ca3af;
}

.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.round-dim-table th {
  white-space: nowrap;
}

/* 同课多分组行叠加时，略紧于全局 data-table（10px 12px） */
.round1-merge-table th,
.round1-merge-table td {
  padding: 6px 10px;
}

.round1-merge-table td[rowspan] {
  vertical-align: middle;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.link-btn:hover {
  text-decoration: underline;
}

.td-capacity {
  text-align: center;
}

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
</style>
