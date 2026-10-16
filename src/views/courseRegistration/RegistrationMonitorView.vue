<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import RegistrationMonitorDetailDrawer from '../../components/courseRegistration/RegistrationMonitorDetailDrawer.vue'
import MonitorRemindModal from '../../components/courseRegistration/MonitorRemindModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  registrationMonitorQueue,
  getMonitorRiskStats,
  filterMonitorRows,
  incrementMonitorRemindCount,
} from '../../data/courseRegistration/registrationMonitorQueue.js'
import {
  formatGraduationGeSummary,
  formatGraduationMeSummary,
  formatGraduationGeCompletion,
  formatGraduationMeCompletion,
  formatTermGeSummary,
  formatTermMeSummary,
  formatTermGeCompletion,
  formatTermMeCompletion,
  formatTermTotalSelectedCredits,
  formatGraduationMandatorySummary,
  formatGraduationMandatoryCompletion,
  graduationGeCompletionClass,
  graduationMeCompletionClass,
  termGeCompletionClass,
  termMeCompletionClass,
  graduationMandatoryCompletionClass,
  graduationGeCapsuleTone,
  graduationMeCapsuleTone,
  termGeCapsuleTone,
  termMeCapsuleTone,
  graduationMandatoryCapsuleTone,
} from '../../data/courseRegistration/monitorCreditInsights.js'
import { monitorExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatMonitorExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { formatIntakeBatch, intakeOptions } from '../../data/intakeSets.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

function emptySearch() {
  return {
    programme: '',
    intake: '',
    studentName: '',
    geGradCompletionMin: '',
    geGradCompletionMax: '',
    meGradCompletionMin: '',
    meGradCompletionMax: '',
    mandatoryGradCompletionMin: '',
    mandatoryGradCompletionMax: '',
  }
}

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const searchExpanded = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)
const detailRow = ref(null)
const exportModalVisible = ref(false)
const remindRow = ref(null)

const { t } = useAppI18n()

const riskStats = computed(() => getMonitorRiskStats(registrationMonitorQueue.value))

const riskStatCards = computed(() => [
  {
    key: 'geGrad',
    label: 'courseRegistration.monitor.statGeGradBelow',
    value: riskStats.value.geGradBelow,
  },
  {
    key: 'geTerm',
    label: 'courseRegistration.monitor.statGeTermBelow',
    value: riskStats.value.geTermBelow,
  },
  {
    key: 'meGrad',
    label: 'courseRegistration.monitor.statMeGradBelow',
    value: riskStats.value.meGradBelow,
  },
  {
    key: 'meTerm',
    label: 'courseRegistration.monitor.statMeTermBelow',
    value: riskStats.value.meTermBelow,
  },
  {
    key: 'mandatory',
    label: 'courseRegistration.monitor.statMandatoryBelow',
    value: riskStats.value.mandatoryBelow,
  },
])

const monitorIntakeOptions = computed(() => {
  const set = new Set(intakeOptions)
  for (const row of registrationMonitorQueue.value) {
    const formatted = formatIntakeBatch(row.intake)
    if (formatted) set.add(formatted)
  }
  return [...set].sort().reverse()
})

const rows = computed(() => filterMonitorRows(registrationMonitorQueue.value, appliedSearch.value))

const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

function parseBound(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function validateCompletionRanges(form) {
  const pairs = [
    [form.geGradCompletionMin, form.geGradCompletionMax, 'filterGeGradCompletion'],
    [form.meGradCompletionMin, form.meGradCompletionMax, 'filterMeGradCompletion'],
    [form.mandatoryGradCompletionMin, form.mandatoryGradCompletionMax, 'filterMandatoryGradCompletion'],
  ]
  for (const [minRaw, maxRaw, labelKey] of pairs) {
    const min = parseBound(minRaw)
    const max = parseBound(maxRaw)
    if (min != null && max != null && min > max) {
      return t('courseRegistration.monitor.rangeInvalid', {
        field: t(`courseRegistration.monitor.${labelKey}`),
      })
    }
  }
  return ''
}

function handleSearch() {
  const err = validateCompletionRanges(searchForm.value)
  if (err) {
    window.alert(err)
    return
  }
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function openDetail(row) {
  detailRow.value = row
}

function handleRemind(row) {
  remindRow.value = row
}

function handleRemindConfirm() {
  const row = remindRow.value
  const name = row?.studentName || ''
  if (row?.id) incrementMonitorRemindCount(row.id)
  remindRow.value = null
  window.alert(t('courseRegistration.monitor.remindSent', { name }))
}

function remindCountOf(row) {
  return Number(row?.remindCount) || 0
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = monitorExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatMonitorExportRow,
    filename: `registration-monitor-${timestamp}.xlsx`,
    sheetName: 'Registration Monitor',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-monitor-page">
    <div class="stats-row stats-row--monitor">
      <div v-for="card in riskStatCards" :key="card.key" class="stat-card">
        <span class="stat-value">{{ card.value }}</span>
        <span class="stat-label">{{ t(card.label) }}</span>
      </div>
    </div>

    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input v-model="searchForm.programme" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.intake') }}</label>
              <select v-model="searchForm.intake" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in monitorIntakeOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.studentName') }}</label>
              <input
                v-model="searchForm.studentName"
                type="text"
                class="search-input"
                :placeholder="t('courseRegistration.monitor.studentNamePlaceholder')"
              />
            </div>
            <template v-if="searchExpanded">
              <div class="search-item search-item-range">
                <label>{{ t('courseRegistration.monitor.filterGeGradCompletion') }}</label>
                <div class="range-inputs">
                  <input
                    v-model="searchForm.geGradCompletionMin"
                    type="number"
                    class="search-input"
                    min="0"
                  />
                  <span class="range-sep">{{ t('courseRegistration.monitor.rangeTo') }}</span>
                  <input
                    v-model="searchForm.geGradCompletionMax"
                    type="number"
                    class="search-input"
                    min="0"
                  />
                  <span class="range-unit">%</span>
                </div>
              </div>
              <div class="search-item search-item-range">
                <label>{{ t('courseRegistration.monitor.filterMeGradCompletion') }}</label>
                <div class="range-inputs">
                  <input
                    v-model="searchForm.meGradCompletionMin"
                    type="number"
                    class="search-input"
                    min="0"
                  />
                  <span class="range-sep">{{ t('courseRegistration.monitor.rangeTo') }}</span>
                  <input
                    v-model="searchForm.meGradCompletionMax"
                    type="number"
                    class="search-input"
                    min="0"
                  />
                  <span class="range-unit">%</span>
                </div>
              </div>
              <div class="search-item search-item-range">
                <label>{{ t('courseRegistration.monitor.filterMandatoryGradCompletion') }}</label>
                <div class="range-inputs">
                  <input
                    v-model="searchForm.mandatoryGradCompletionMin"
                    type="number"
                    class="search-input"
                    min="0"
                  />
                  <span class="range-sep">{{ t('courseRegistration.monitor.rangeTo') }}</span>
                  <input
                    v-model="searchForm.mandatoryGradCompletionMax"
                    type="number"
                    class="search-input"
                    min="0"
                  />
                  <span class="range-unit">%</span>
                </div>
              </div>
            </template>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              {{ t('common.reset') }}
            </button>
            <button type="button" class="toggle-link" @click="searchExpanded = !searchExpanded">
              {{ searchExpanded ? t('common.collapse') : t('common.more') }}
              <svg
                :class="{ up: searchExpanded }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-outline" @click="exportModalVisible = true">
          {{ t('common.export') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap monitor-table-wrap">
          <table class="data-table data-table--credit-groups">
            <thead>
              <tr>
                <th rowspan="2" class="th-nowrap col-id">{{ t('common.serialNo') }}</th>
                <th rowspan="2" class="th-nowrap col-sid">{{ t('courseRegistration.monitor.studentId') }}</th>
                <th rowspan="2" class="th-nowrap col-name">{{ t('courseRegistration.monitor.studentName') }}</th>
                <th rowspan="2" class="th-nowrap col-prog">{{ t('courseRegistration.monitor.programme') }}</th>
                <th rowspan="2" class="th-nowrap col-intake th-group-start">
                  {{ t('courseRegistration.monitor.intake') }}
                </th>
                <th rowspan="2" class="th-nowrap col-term-total">
                  {{ t('courseRegistration.monitor.colTermTotalCredits') }}
                </th>
                <th colspan="4" class="th-group th-group--ge th-group-start">
                  {{ t('courseRegistration.monitor.headerGroupGe') }}
                </th>
                <th colspan="4" class="th-group th-group--me th-group-start">
                  {{ t('courseRegistration.monitor.headerGroupMe') }}
                </th>
                <th colspan="2" class="th-group th-group--mandatory th-group-start">
                  {{ t('courseRegistration.monitor.headerGroupMandatory') }}
                </th>
                <th
                  rowspan="2"
                  class="th-nowrap col-sticky-right col-sticky-remind col-remind th-group-start"
                >
                  {{ t('courseRegistration.monitor.colRemindCount') }}
                </th>
                <th rowspan="2" class="th-nowrap col-sticky-right col-actions">
                  {{ t('common.actions') }}
                </th>
              </tr>
              <tr>
                <th class="th-nowrap col-credit th-group-start th-sub--ge">
                  {{ t('courseRegistration.monitor.colGradReq') }}
                </th>
                <th class="th-nowrap col-pct th-sub--ge">
                  {{ t('courseRegistration.monitor.colGradCompletion') }}
                </th>
                <th class="th-nowrap col-credit th-sub--ge">
                  {{ t('courseRegistration.monitor.colTermReq') }}
                </th>
                <th class="th-nowrap col-pct th-sub--ge">
                  {{ t('courseRegistration.monitor.colTermCompletion') }}
                </th>
                <th class="th-nowrap col-credit th-group-start th-sub--me">
                  {{ t('courseRegistration.monitor.colGradReq') }}
                </th>
                <th class="th-nowrap col-pct th-sub--me">
                  {{ t('courseRegistration.monitor.colGradCompletion') }}
                </th>
                <th class="th-nowrap col-credit th-sub--me">
                  {{ t('courseRegistration.monitor.colTermReq') }}
                </th>
                <th class="th-nowrap col-pct th-sub--me">
                  {{ t('courseRegistration.monitor.colTermCompletion') }}
                </th>
                <th class="th-nowrap col-credit th-group-start th-sub--mandatory">
                  {{ t('courseRegistration.monitor.colMandatoryGrad') }}
                </th>
                <th class="th-nowrap col-pct th-sub--mandatory">
                  {{ t('courseRegistration.monitor.colMandatoryCompletion') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td class="col-id">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="col-sid">{{ row.studentId }}</td>
                <td class="col-name">{{ row.studentName }}</td>
                <td class="col-prog">{{ row.programme }}</td>
                <td class="col-intake td-group-start">{{ formatIntakeBatch(row.intake) || row.intake }}</td>
                <td class="col-term-total">{{ formatTermTotalSelectedCredits(row) }}</td>
                <td class="col-term-credit col-credit td-group-start">
                  <span class="cr-credit-capsule" :class="graduationGeCapsuleTone(row)">
                    {{ formatGraduationGeSummary(row) }}
                  </span>
                </td>
                <td class="col-term-credit col-pct" :class="graduationGeCompletionClass(row)">
                  {{ formatGraduationGeCompletion(row) }}
                </td>
                <td class="col-term-credit col-credit">
                  <span class="cr-credit-capsule" :class="termGeCapsuleTone(row)">
                    {{ formatTermGeSummary(row) }}
                  </span>
                </td>
                <td class="col-term-credit col-pct" :class="termGeCompletionClass(row)">
                  {{ formatTermGeCompletion(row) }}
                </td>
                <td class="col-term-credit col-credit td-group-start">
                  <span class="cr-credit-capsule" :class="graduationMeCapsuleTone(row)">
                    {{ formatGraduationMeSummary(row) }}
                  </span>
                </td>
                <td class="col-term-credit col-pct" :class="graduationMeCompletionClass(row)">
                  {{ formatGraduationMeCompletion(row) }}
                </td>
                <td class="col-term-credit col-credit">
                  <span class="cr-credit-capsule" :class="termMeCapsuleTone(row)">
                    {{ formatTermMeSummary(row) }}
                  </span>
                </td>
                <td class="col-term-credit col-pct" :class="termMeCompletionClass(row)">
                  {{ formatTermMeCompletion(row) }}
                </td>
                <td class="col-term-credit col-credit td-group-start">
                  <span class="cr-credit-capsule" :class="graduationMandatoryCapsuleTone(row)">
                    {{ formatGraduationMandatorySummary(row) }}
                  </span>
                </td>
                <td
                  class="col-term-credit col-pct"
                  :class="graduationMandatoryCompletionClass(row)"
                >
                  {{ formatGraduationMandatoryCompletion(row) }}
                </td>
                <td class="col-sticky-right col-sticky-remind col-remind td-group-start">
                  {{ remindCountOf(row) }}
                </td>
                <td class="actions-cell col-sticky-right col-actions">
                  <button type="button" class="link-btn" @click="openDetail(row)">
                    {{ t('common.details') }}
                  </button>
                  <button type="button" class="link-btn" @click="handleRemind(row)">
                    {{ t('courseRegistration.monitor.remind') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="17" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
          :total-pages="totalPages"
        />
      </div>
    </div>

    <RegistrationMonitorDetailDrawer
      :visible="!!detailRow"
      :row="detailRow"
      @close="detailRow = null"
    />

    <MonitorRemindModal
      :visible="!!remindRow"
      :row="remindRow"
      @close="remindRow = null"
      @confirm="handleRemindConfirm"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="monitorExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.stats-row--monitor {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.stat-card--click {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font: inherit;
}

.stat-card--click:hover {
  border-color: #93c5fd;
}

.stat-card.high .stat-value {
  color: #dc2626;
}

.stat-card.medium .stat-value {
  color: #d97706;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-green {
  background: #d1fae5;
  color: #047857;
}
.tag-amber {
  background: #fef3c7;
  color: #b45309;
}
.tag-red {
  background: #fee2e2;
  color: #b91c1c;
}
.tag-gray {
  background: #f3f4f6;
  color: #6b7280;
}

.issue-tag {
  display: inline-block;
  margin: 0 4px 4px 0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: #eff6ff;
  color: #1d4ed8;
}

.th-nowrap {
  white-space: nowrap;
}

.monitor-table-wrap {
  overflow-x: auto;
}

.cr-monitor-page .data-table--credit-groups {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}

.cr-monitor-page .data-table--credit-groups th,
.cr-monitor-page .data-table--credit-groups td {
  padding: 4px 6px;
  line-height: 1.3;
  font-size: 12px;
  vertical-align: middle;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #f3f4f6;
}

.cr-monitor-page .data-table--credit-groups th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.cr-monitor-page .data-table--credit-groups thead th {
  text-align: center;
  font-size: 11px;
}

.cr-monitor-page .data-table--credit-groups .col-term-credit {
  text-align: center;
  white-space: nowrap;
  font-size: 12px;
}

.cr-monitor-page .data-table--credit-groups .col-id {
  width: 40px;
  min-width: 40px;
  text-align: center;
}

.cr-monitor-page .data-table--credit-groups .col-sid {
  width: 96px;
  min-width: 96px;
}

.cr-monitor-page .data-table--credit-groups .col-name {
  width: 96px;
  min-width: 96px;
}

.cr-monitor-page .data-table--credit-groups .col-prog {
  width: 48px;
  min-width: 48px;
  text-align: center;
}

.cr-monitor-page .data-table--credit-groups .col-intake {
  width: 64px;
  min-width: 64px;
  text-align: center;
}

.cr-monitor-page .data-table--credit-groups .col-term-total {
  width: 72px;
  min-width: 72px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.cr-monitor-page .data-table--credit-groups .col-credit {
  width: 64px;
  min-width: 64px;
}

.cr-monitor-page .data-table--credit-groups .col-pct {
  width: 44px;
  min-width: 44px;
}

.cr-monitor-page .data-table--credit-groups .col-remind {
  width: 64px;
  min-width: 64px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.cr-monitor-page .data-table--credit-groups .col-actions {
  width: 112px;
  min-width: 112px;
  white-space: nowrap;
  text-align: left;
}

.cr-monitor-page .data-table--credit-groups .th-group {
  font-weight: 600;
  font-size: 11px;
}

.cr-monitor-page .data-table--credit-groups .th-group--ge,
.cr-monitor-page .data-table--credit-groups .th-sub--ge {
  background: #eff6ff;
}

.cr-monitor-page .data-table--credit-groups .th-group--me,
.cr-monitor-page .data-table--credit-groups .th-sub--me {
  background: #f0fdf4;
}

.cr-monitor-page .data-table--credit-groups .th-group--mandatory,
.cr-monitor-page .data-table--credit-groups .th-sub--mandatory {
  background: #fff7ed;
}

.cr-monitor-page .data-table--credit-groups .th-group-start,
.cr-monitor-page .data-table--credit-groups .td-group-start {
  border-left: 2px solid #cbd5e1;
}

.cr-monitor-page .data-table--credit-groups .col-sticky-right {
  position: sticky;
  z-index: 2;
}

.cr-monitor-page .data-table--credit-groups .col-actions.col-sticky-right {
  right: 0;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.12);
}

.cr-monitor-page .data-table--credit-groups .col-sticky-remind {
  right: 112px;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.08);
}

.cr-monitor-page .data-table--credit-groups thead .col-sticky-right {
  z-index: 4;
  background: #f9fafb;
}

.cr-monitor-page .data-table--credit-groups tbody .col-sticky-right {
  background: #fff;
}

.cr-monitor-page .data-table--credit-groups tbody tr:hover .col-sticky-right {
  background: #f9fafb;
}

.cr-monitor-page .data-table--credit-groups .col-actions .link-btn {
  font-size: 12px;
  padding: 0 2px;
}

.cr-monitor-page .data-table--credit-groups .completion-tone {
  font-weight: 600;
}

.cr-monitor-page .data-table--credit-groups .completion-tone--high {
  color: #15803d;
}

.cr-monitor-page .data-table--credit-groups .completion-tone--mid {
  color: #c2410c;
}

.cr-monitor-page .data-table--credit-groups .completion-tone--low {
  color: #ca8a04;
}

.cr-monitor-page .data-table--credit-groups .completion-tone--critical {
  color: #b91c1c;
}

/* 完成度区间：对齐 list-page-search 的 range-inputs */
.cr-monitor-page .search-item-range {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.cr-monitor-page .search-item-range > label {
  white-space: nowrap;
  flex-shrink: 0;
}

.cr-monitor-page .search-item-range .range-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cr-monitor-page .search-item-range .range-inputs .search-input {
  width: 72px;
  min-width: 72px;
}

.cr-monitor-page .range-sep,
.cr-monitor-page .range-unit {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.cr-monitor-page .cr-credit-capsule {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  border: 1px solid transparent;
}

.cr-monitor-page .cr-credit-capsule.is-short {
  color: #9a3412;
  background: #ffedd5;
  border-color: #fdba74;
}

.cr-monitor-page .cr-credit-capsule.is-met {
  color: #047857;
  background: #d1fae5;
  border-color: #6ee7b7;
}

/* 监控页超分与达标同为绿色（在线选课仍用红警示） */
.cr-monitor-page .cr-credit-capsule.is-over {
  color: #047857;
  background: #d1fae5;
  border-color: #6ee7b7;
  font-weight: 600;
}

.severity-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.severity-high {
  background: #fee2e2;
  color: #b91c1c;
}

.severity-medium {
  background: #fef3c7;
  color: #b45309;
}

.muted {
  color: #9ca3af;
}

.search-item--check {
  display: flex;
  align-items: flex-end;
}

.check-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.link-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 1400px) {
  .stats-row--monitor {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 900px) {
  .stats-row--monitor {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
</style>
