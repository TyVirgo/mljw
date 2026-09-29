<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import RegistrationMonitorDetailDrawer from '../../components/courseRegistration/RegistrationMonitorDetailDrawer.vue'
import MonitorRemindModal from '../../components/courseRegistration/MonitorRemindModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  registrationMonitorQueue,
  getMonitorStats,
  filterMonitorRows,
  monitorStatusOptions,
} from '../../data/courseRegistration/registrationMonitorQueue.js'
import {
  getRowAlertMeta,
  academicAlertTypeOptions,
} from '../../data/courseRegistration/academicAlertQueue.js'
import {
  formatGraduationGeSummary,
  formatGraduationMeSummary,
  formatTermGeSummary,
  formatTermMeSummary,
} from '../../data/courseRegistration/monitorCreditInsights.js'
import {
  addStudentToSupplementList,
  isStudentInSupplementList,
} from '../../data/courseRegistration/supplementListQueue.js'
import { isFreshmanStudent } from '../../data/courseRegistration/studentAudience.js'
import { monitorExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatMonitorExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const emit = defineEmits(['navigate'])

function emptySearch() {
  return {
    programme: '',
    intake: '',
    status: '',
    keyword: '',
    problemsOnly: false,
    severity: '',
    alertType: '',
  }
}

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const currentPage = ref(1)
const pageSize = ref(20)
const detailRow = ref(null)
const exportModalVisible = ref(false)
const remindRow = ref(null)

const { t } = useAppI18n()

const baseStats = computed(() => getMonitorStats(registrationMonitorQueue.value))

const rows = computed(() => filterMonitorRows(registrationMonitorQueue.value, appliedSearch.value))

const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function statusLabel(status) {
  return t(`courseRegistration.monitor.status.${status}`)
}

function alertTypeLabel(type) {
  const key = `courseRegistration.alert.types.${type}`
  const translated = t(key)
  return translated !== key ? translated : type
}

function termGeCell(row) {
  return formatTermGeSummary(row)
}

function termMeCell(row) {
  return formatTermMeSummary(row)
}

function graduationGeCell(row) {
  return formatGraduationGeSummary(row)
}

function graduationMeCell(row) {
  return formatGraduationMeSummary(row)
}

function openDetail(row) {
  detailRow.value = row
}

function handleRemind(row) {
  remindRow.value = row
}

function handleRemindConfirm() {
  const name = remindRow.value?.studentName || ''
  remindRow.value = null
  window.alert(t('courseRegistration.monitor.remindSent', { name }))
}

function handleAddSupplement(row) {
  if (!row) return
  const meta = getRowAlertMeta(row)
  const isFreshman =
    isFreshmanStudent(row.studentId) ||
    (Array.isArray(row.tags) && row.tags.some((tag) => String(tag).toLowerCase() === 'freshman'))
  const creditLow =
    row.status === 'creditLow' ||
    row.status === 'notRegistered' ||
    (Number(row.credits) > 0 && Number(row.credits) < Number(row.creditMin || 12))

  const confirmKey =
    isFreshman && creditLow && meta.recommendation?.action === 'suggestSupplement'
      ? 'courseRegistration.monitor.suggestSupplementConfirm'
      : 'courseRegistration.monitor.addWhitelistConfirm'
  const ok = window.confirm(t(confirmKey, { name: row.studentName }))
  if (!ok) return

  const remarkParts = meta.alertTypes.length
    ? meta.alertTypes.map(alertTypeLabel)
    : [t(`courseRegistration.monitor.status.${row.status}`)]
  if (isFreshman && creditLow) {
    remarkParts.push(t('courseRegistration.monitor.transferCreditRemark'))
  }

  const result = addStudentToSupplementList(row, {
    listType: 'supplement',
    source: 'registration-monitor',
    remark: remarkParts.join(', '),
    canAdd: true,
    canDrop: isFreshman && creditLow ? false : true,
    canRetake: isFreshman && creditLow ? false : true,
  })
  if (!result.ok) {
    window.alert(t(result.errorKey))
    return
  }
  window.alert(t('courseRegistration.supplement.addedSuccess', { name: row.studentName }))
  detailRow.value = null
}

function supplementActionLabel() {
  return t('courseRegistration.monitor.addSupplement')
}

function goToSupplementList() {
  emit('navigate', 'cr-supplement')
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
      <div
        v-for="card in [
          { key: 'total', label: 'courseRegistration.monitor.statTotal', value: baseStats.total },
          {
            key: 'participated',
            label: 'courseRegistration.monitor.statParticipated',
            value: baseStats.participated,
          },
          {
            key: 'avg',
            label: 'courseRegistration.monitor.statAvgCredits',
            value: baseStats.avgCredits,
          },
        ]"
        :key="card.key"
        class="stat-card"
      >
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
              <input v-model="searchForm.intake" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('common.status') }}</label>
              <select v-model="searchForm.status" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in monitorStatusOptions" :key="opt" :value="opt">
                  {{ statusLabel(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.alert.type') }}</label>
              <select v-model="searchForm.alertType" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in academicAlertTypeOptions" :key="opt" :value="opt">
                  {{ alertTypeLabel(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.alert.severityLabel') }}</label>
              <select v-model="searchForm.severity" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="high">{{ t('courseRegistration.alert.severity.high') }}</option>
                <option value="medium">{{ t('courseRegistration.alert.severity.medium') }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.student') }}</label>
              <input v-model="searchForm.keyword" type="text" class="search-input" />
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              {{ t('common.reset') }}
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-default" @click="goToSupplementList">
          {{ t('courseRegistration.alert.viewSupplementList') }}
        </button>
        <button type="button" class="btn btn-outline" @click="exportModalVisible = true">
          {{ t('common.export') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-nowrap">{{ t('common.serialNo') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.studentId') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.studentName') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.programme') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.intake') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.colGraduationGe') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.colGraduationMe') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.colTermGe') }}</th>
                <th class="th-nowrap">{{ t('courseRegistration.monitor.colTermMe') }}</th>
                <th class="th-nowrap">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.studentId }}</td>
                <td>{{ row.studentName }}</td>
                <td>{{ row.programme }}</td>
                <td>{{ formatIntakeBatch(row.intake) || row.intake }}</td>
                <td class="col-term-credit">{{ graduationGeCell(row) }}</td>
                <td class="col-term-credit">{{ graduationMeCell(row) }}</td>
                <td class="col-term-credit">{{ termGeCell(row) }}</td>
                <td class="col-term-credit">{{ termMeCell(row) }}</td>
                <td class="actions-cell">
                  <button type="button" class="link-btn" @click="openDetail(row)">
                    {{ t('common.details') }}
                  </button>
                  <button type="button" class="link-btn" @click="handleRemind(row)">
                    {{ t('courseRegistration.monitor.remind') }}
                  </button>
                  <button
                    type="button"
                    class="link-btn"
                    :disabled="isStudentInSupplementList(row.studentId)"
                    @click="handleAddSupplement(row)"
                  >
                    {{
                      isStudentInSupplementList(row.studentId)
                        ? t('courseRegistration.supplement.alreadyInList')
                        : supplementActionLabel(row)
                    }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="10" class="empty-cell">{{ t('common.noData') }}</td>
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
      :in-supplement-list="detailRow ? isStudentInSupplementList(detailRow.studentId) : false"
      @close="detailRow = null"
      @add-supplement="handleAddSupplement(detailRow)"
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.col-term-credit {
  font-size: 12px;
  white-space: nowrap;
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
</style>
