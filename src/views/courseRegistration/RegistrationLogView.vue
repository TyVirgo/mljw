<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  registrationLogs,
  filterRegistrationLogs,
  formatOperatorDisplay,
  formatQueueStatusLabel,
  formatRegistrationLogResultLabel,
  getRegistrationLogStats,
  normalizeTimeRange,
} from '../../data/courseRegistration/registrationLog.js'
import {
  registrationBatches,
  getBatchById,
  getStudentDefaultRoundKey,
  formatRoundRange,
  isRoundTimeConfigured,
} from '../../data/courseRegistration/registrationBatches.js'
import { getRoundTimeline } from '../../data/courseRegistration/studentRegistrationContext.js'
import { registrationLogExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatRegistrationLogExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const emptyFilters = () => ({
  studentKeyword: '',
  // batchKeyword: '', // 批次改由页顶下拉，搜索区不再提供
  courseKeyword: '',
  operatorKeyword: '',
  result: '',
  timeStart: '',
  timeEnd: '',
})

/**
 * 默认批次：优先 active，否则列表首项
 * @returns {string}
 */
function pickDefaultBatchId() {
  const list = registrationBatches.value
  const active = list.find((b) => b.status === 'active')
  return active?.id || list[0]?.id || ''
}

/** 页顶选中批次（先批次后轮次） */
const selectedBatchId = ref(pickDefaultBatchId())
const selectedRound = ref(getStudentDefaultRoundKey(getBatchById(selectedBatchId.value)))

const searchForm = ref(emptyFilters())
const appliedSearch = ref(emptyFilters())
const currentPage = ref(1)
const pageSize = ref(20)
const exportModalVisible = ref(false)
const searchExpanded = ref(true)

const batchOptions = computed(() => registrationBatches.value)

const activeBatch = computed(() => getBatchById(selectedBatchId.value))

/**
 * 轮次下拉：仅含该批已配置起止时间的轮次
 */
const roundOptions = computed(() => {
  const batch = activeBatch.value
  const session = batch?.academicSession || '—'
  return getRoundTimeline(batch, selectedRound.value)
    .filter((step) => isRoundTimeConfigured(step.range))
    .map((step) => {
      const range = formatRoundRange(step.range)
      return {
        key: step.key,
        label: t('courseRegistration.student.roundOptionLabel', {
          session,
          round: t(step.labelKey),
          range: range === '—' ? '' : range,
        }),
      }
    })
})

/** 按最长选项文案撑开宽度 */
const batchSelectWidth = ref('')
const roundSelectWidth = ref('')

/**
 * 测量 select 文案宽度
 * @param {string[]} labels
 * @returns {string}
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

function measureBatchSelectWidth() {
  batchSelectWidth.value = measureSelectWidth(batchOptions.value.map((b) => b.name || b.id))
}

function measureRoundSelectWidth() {
  roundSelectWidth.value = measureSelectWidth(roundOptions.value.map((opt) => opt.label))
}

const roundStats = computed(() =>
  getRegistrationLogStats(selectedBatchId.value, selectedRound.value),
)

const rows = computed(() =>
  filterRegistrationLogs(registrationLogs.value, {
    ...appliedSearch.value,
    round: selectedRound.value,
    batchId: selectedBatchId.value,
  }),
)
const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

watch(selectedRound, () => {
  currentPage.value = 1
})

watch(selectedBatchId, (id) => {
  const batch = getBatchById(id)
  selectedRound.value = getStudentDefaultRoundKey(batch)
  currentPage.value = 1
  nextTick(() => {
    measureBatchSelectWidth()
    measureRoundSelectWidth()
  })
})

watch(
  roundOptions,
  (opts) => {
    nextTick(measureRoundSelectWidth)
    if (opts.length && !opts.some((opt) => opt.key === selectedRound.value)) {
      selectedRound.value = getStudentDefaultRoundKey(activeBatch.value)
    }
  },
  { immediate: true },
)

onMounted(() => {
  measureBatchSelectWidth()
  measureRoundSelectWidth()
})

function handleSearch() {
  const normalized = normalizeTimeRange(searchForm.value.timeStart, searchForm.value.timeEnd)
  searchForm.value = { ...searchForm.value, ...normalized }
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptyFilters()
  appliedSearch.value = emptyFilters()
  currentPage.value = 1
}

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value
}

function resultLabel(result, round = selectedRound.value) {
  return formatRegistrationLogResultLabel(result, round, t)
}

function sectionLabel(code) {
  if (!code) return '—'
  return t('courseRegistration.courses.sectionNameDisplay', { code })
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = registrationLogExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatRegistrationLogExportRow,
    filename: `registration-log-${timestamp}.xlsx`,
    sheetName: 'Registration Log',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-log-page">
    <!-- 原顶栏三轮 Tab：改为先批次后轮次双下拉
    <div class="round-tab-bar">
      <button
        v-for="tab in registrationLogRoundTabs"
        :key="tab.id"
        type="button"
        class="round-tab-btn"
        :class="{ active: activeRound === tab.id }"
        @click="activeRound = tab.id"
      >
        {{ t(tab.labelKey) }}
      </button>
    </div>
    -->

    <div class="search-bar cr-log-context-bar">
      <div class="search-row">
        <div class="search-fields">
          <div class="search-item">
            <label for="cr-log-batch-select">
              {{ t('courseRegistration.student.batchSelectLabel') }}
            </label>
            <select
              id="cr-log-batch-select"
              v-model="selectedBatchId"
              class="search-select cr-log-batch-select"
              :style="batchSelectWidth ? { width: batchSelectWidth } : undefined"
            >
              <option v-for="batch in batchOptions" :key="batch.id" :value="batch.id">
                {{ batch.name }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label for="cr-log-round-select">
              {{ t('courseRegistration.student.roundSelectLabel') }}
            </label>
            <select
              id="cr-log-round-select"
              v-model="selectedRound"
              class="search-select cr-log-round-select"
              :style="roundSelectWidth ? { width: roundSelectWidth } : undefined"
            >
              <option v-for="opt in roundOptions" :key="opt.key" :value="opt.key">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-row stats-row--seven">
      <div class="stat-card">
        <span class="stat-value">{{ roundStats.loginUsers }}</span>
        <span class="stat-label">{{ t('courseRegistration.log.statLoginUsers') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ roundStats.loginSessions }}</span>
        <span class="stat-label">{{ t('courseRegistration.log.statLoginSessions') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ roundStats.registeredStudents }}</span>
        <span class="stat-label">{{ t('courseRegistration.log.statRegisteredStudents') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ roundStats.unregisteredStudents }}</span>
        <span class="stat-label">{{ t('courseRegistration.log.statUnregisteredStudents') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ roundStats.totalCourses }}</span>
        <span class="stat-label">{{ t('courseRegistration.log.statTotalCourses') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ roundStats.coursesWithCapacity }}</span>
        <span class="stat-label">{{ t('courseRegistration.log.statCoursesWithCapacity') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ roundStats.coursesFull }}</span>
        <span class="stat-label">{{ t('courseRegistration.log.statCoursesFull') }}</span>
      </div>
    </div>

    <div class="page-card">
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.log.hint') }}{{ t('common.prototypeOnlySuffix') }}</p>
      </CourseRegistrationCallout>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.log.studentKeyword') }}</label>
              <input v-model="searchForm.studentKeyword" type="text" class="search-input" />
            </div>
            <!-- 批次改由页顶统一选择，搜索区不再提供批次关键词
            <div class="search-item">
              <label>{{ t('courseRegistration.log.batchKeyword') }}</label>
              <input v-model="searchForm.batchKeyword" type="text" class="search-input" />
            </div>
            -->
            <div class="search-item">
              <label>{{ t('courseRegistration.log.courseKeyword') }}</label>
              <input v-model="searchForm.courseKeyword" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.log.operatorKeyword') }}</label>
              <input v-model="searchForm.operatorKeyword" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.log.resultLabel') }}</label>
              <select v-model="searchForm.result" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="success">{{ resultLabel('success') }}</option>
                <option value="failure">{{ resultLabel('failure') }}</option>
                <option value="queuing">{{ resultLabel('queuing') }}</option>
                <option value="cancelQueue">{{ resultLabel('cancelQueue') }}</option>
              </select>
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
            <button type="button" class="btn-text" @click="toggleSearchExpanded">
              {{ searchExpanded ? t('common.collapse') : t('common.more') }}
              <svg
                :class="{ up: searchExpanded }"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
        <Transition name="search-expand">
          <div v-if="searchExpanded" class="search-row search-row-secondary">
            <div class="search-fields">
              <div class="search-item search-item-range">
                <label>{{ t('courseRegistration.log.operatedAtRange') }}</label>
                <input v-model="searchForm.timeStart" type="date" class="search-input" />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input v-model="searchForm.timeEnd" type="date" class="search-input" />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <button type="button" class="btn btn-primary" @click="exportModalVisible = true">
            {{ t('common.export') }}
          </button>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap log-table-wrap">
          <table class="data-table log-data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.log.batchName') }}</th>
                <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                <th>{{ t('courseRegistration.log.course') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.type') }}</th>
                <th>{{ t('courseRegistration.log.section') }}</th>
                <th>{{ t('courseRegistration.log.operator') }}</th>
                <th>{{ t('courseRegistration.log.operatedAt') }}</th>
                <th>{{ t('courseRegistration.log.remark') }}</th>
                <th class="col-sticky-right col-queue">{{ t('courseRegistration.log.queueStatusLabel') }}</th>
                <th class="col-sticky-right col-result">{{ t('courseRegistration.log.resultLabel') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.batchName }}</td>
                <td>{{ row.studentId }}</td>
                <td>{{ row.studentName }}</td>
                <td>{{ row.courseCode }} {{ row.courseName }}</td>
                <td>{{ row.credits }}</td>
                <td>{{ getRegistrationTypeLabel(row.courseType, t) || row.courseType || '—' }}</td>
                <td>{{ sectionLabel(row.sectionCode) }}</td>
                <td>{{ formatOperatorDisplay(row) }}</td>
                <td>{{ row.operatedAt }}</td>
                <td>{{ row.remark }}</td>
                <td class="col-sticky-right col-queue">
                  {{ formatQueueStatusLabel(row, t) }}
                </td>
                <td class="col-sticky-right col-result">
                  <span class="result-tag" :class="row.result">{{ resultLabel(row.result, row.round) }}</span>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="13" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalCount > 0" class="pagination-bar">
          <TablePagination v-model="currentPage" v-model:page-size="pageSize" :total="totalCount" />
        </div>
      </div>
    </div>

    <ExportModal
      :visible="exportModalVisible"
      :fields="registrationLogExportFields"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.cr-log-context-bar {
  margin-bottom: 12px;
}

.cr-log-batch-select,
.cr-log-round-select {
  max-width: min(100%, 720px);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stats-row--seven {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .stats-row--seven {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .stats-row,
  .stats-row--seven {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

/* 原 round-tab 样式保留注释备查
.round-tab-bar { ... }
.round-tab-btn { ... }
*/

.log-table-wrap {
  overflow-x: auto;
}

.log-data-table th,
.log-data-table td {
  white-space: nowrap;
}

.col-sticky-right {
  position: sticky;
  background: #fff;
  box-sizing: border-box;
}

.log-data-table thead .col-sticky-right {
  background: #f9fafb;
  z-index: 4;
}

.log-data-table tbody .col-sticky-right {
  z-index: 2;
}

/* 操作结果贴右；宽度固定，供左侧排队列 right 对齐，避免两列缝隙露出备注等滚动内容 */
.col-result {
  right: 0;
  width: 112px;
  min-width: 112px;
  max-width: 112px;
  z-index: 3;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.12);
}

/* right = 操作结果列宽，两冻结列紧密相邻 */
.col-queue {
  right: 112px;
  width: 96px;
  min-width: 96px;
  max-width: 96px;
  z-index: 2;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.08);
}

.log-data-table thead .col-result {
  z-index: 5;
}

.log-data-table thead .col-queue {
  z-index: 4;
}

.result-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.result-tag.success {
  background: #ecfdf5;
  color: #059669;
}

.result-tag.failure {
  background: #fef2f2;
  color: #dc2626;
}

.result-tag.queuing {
  background: #eff6ff;
  color: #2563eb;
}

.result-tag.cancelQueue {
  background: #f3f4f6;
  color: #6b7280;
}

.search-item-range {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.range-sep {
  font-size: 13px;
  color: #6b7280;
}

.btn-text {
  appearance: none;
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-text svg.up {
  transform: rotate(180deg);
}

.search-expand-enter-active,
.search-expand-leave-active {
  transition: opacity 0.15s ease;
}

.search-expand-enter-from,
.search-expand-leave-to {
  opacity: 0;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}
</style>
