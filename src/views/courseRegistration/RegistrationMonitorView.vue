<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import RegistrationMonitorDetailDrawer from '../../components/courseRegistration/RegistrationMonitorDetailDrawer.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  registrationMonitorQueue,
  getMonitorStats,
  filterMonitorRows,
  monitorStatusOptions,
} from '../../data/courseRegistration/registrationMonitorQueue.js'
import {
  addStudentToSupplementList,
  isStudentInSupplementList,
} from '../../data/courseRegistration/supplementListQueue.js'
import { monitorExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatMonitorExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const emit = defineEmits(['navigate'])

const searchForm = ref({ programme: '', intake: '', status: '', keyword: '' })
const appliedSearch = ref({ programme: '', intake: '', status: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const detailRow = ref(null)
const exportModalVisible = ref(false)

const { t } = useAppI18n()

const stats = computed(() => getMonitorStats(registrationMonitorQueue.value))

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
  searchForm.value = { programme: '', intake: '', status: '', keyword: '' }
  appliedSearch.value = { programme: '', intake: '', status: '', keyword: '' }
  currentPage.value = 1
}

function statusLabel(status) {
  return t(`courseRegistration.monitor.status.${status}`)
}

function statusClass(status) {
  const map = {
    normal: 'tag-green',
    creditLow: 'tag-amber',
    creditHigh: 'tag-red',
    g1CategoryLow: 'tag-amber',
    notRegistered: 'tag-red',
    prerequisiteMissing: 'tag-amber',
  }
  return map[status] || 'tag-gray'
}

function openDetail(row) {
  detailRow.value = row
}

function handleRemind(row) {
  window.alert(t('courseRegistration.monitor.remindSent', { name: row.studentName }))
}

function handleAddSupplement(row) {
  const result = addStudentToSupplementList(row, {
    listType: row.tags?.includes('resumption') ? 'resumption' : 'supplement',
    source: 'registration-monitor',
    remark: t(`courseRegistration.monitor.status.${row.status}`),
  })
  if (!result.ok) {
    window.alert(t(result.errorKey))
    return
  }
  window.alert(t('courseRegistration.supplement.addedSuccess', { name: row.studentName }))
  detailRow.value = null
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
    <ModuleBriefPanel page-id="cr-monitor" />

    <div class="stats-row" style="grid-template-columns: repeat(6, 1fr)">
      <div v-for="card in [
        { key: 'total', label: 'courseRegistration.monitor.statTotal', value: stats.total },
        { key: 'participated', label: 'courseRegistration.monitor.statParticipated', value: stats.participated },
        { key: 'avg', label: 'courseRegistration.monitor.statAvgCredits', value: stats.avgCredits },
        { key: 'below', label: 'courseRegistration.monitor.statBelowMin', value: stats.belowMin },
        { key: 'above', label: 'courseRegistration.monitor.statAboveMax', value: stats.aboveMax },
        { key: 'g1', label: 'courseRegistration.monitor.statG1Risk', value: stats.g1Risk },
      ]" :key="card.key" class="stat-card">
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
              <label>Intake</label>
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
              <label>{{ t('courseRegistration.monitor.student') }}</label>
              <input v-model="searchForm.keyword" type="text" class="search-input" />
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-outline" @click="exportModalVisible = true">
          {{ t('common.export') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.monitor.studentId') }}</th>
              <th>{{ t('courseRegistration.monitor.studentName') }}</th>
              <th>{{ t('courseRegistration.monitor.programme') }}</th>
              <th>Intake</th>
              <th>{{ t('courseRegistration.monitor.credits') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.studentId }}</td>
              <td>{{ row.studentName }}</td>
              <td>{{ row.programme }}</td>
              <td>{{ row.intake }}</td>
              <td>{{ row.credits }}/{{ row.creditMax }}</td>
              <td><span class="status-tag" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span></td>
              <td class="actions-cell">
                <button type="button" class="link-btn" @click="openDetail(row)">{{ t('common.details') }}</button>
                <button type="button" class="link-btn" @click="handleRemind(row)">{{ t('courseRegistration.monitor.remind') }}</button>
              </td>
            </tr>
            <tr v-if="!paginatedRows.length">
              <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
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

    <ExportModal
      :visible="exportModalVisible"
      :fields="monitorExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-green { background: #d1fae5; color: #047857; }
.tag-amber { background: #fef3c7; color: #b45309; }
.tag-red { background: #fee2e2; color: #b91c1c; }
.tag-gray { background: #f3f4f6; color: #6b7280; }

@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(3, 1fr) !important; }
}
</style>
