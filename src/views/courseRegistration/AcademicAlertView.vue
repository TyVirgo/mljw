<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  buildAcademicAlerts,
  filterAcademicAlerts,
  getAcademicAlertStats,
  academicAlertTypeOptions,
} from '../../data/courseRegistration/academicAlertQueue.js'
import { addStudentToSupplementList, isStudentInSupplementList } from '../../data/courseRegistration/supplementListQueue.js'
import { alertExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatAlertExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'

const emit = defineEmits(['navigate'])

const { t } = useAppI18n()

const searchForm = ref({ alertType: '', severity: '', programme: '', keyword: '' })
const appliedSearch = ref({ alertType: '', severity: '', programme: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const exportModalVisible = ref(false)

const allAlerts = computed(() => buildAcademicAlerts())
const stats = computed(() => getAcademicAlertStats(allAlerts.value))
const rows = computed(() => filterAcademicAlerts(allAlerts.value, appliedSearch.value))
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
  searchForm.value = { alertType: '', severity: '', programme: '', keyword: '' }
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function alertTypeLabel(type) {
  const key = `courseRegistration.alert.types.${type}`
  const translated = t(key)
  return translated !== key ? translated : type
}

function severityClass(severity) {
  return severity === 'high' ? 'severity-high' : 'severity-medium'
}

function recommendationText(alert) {
  return t(`courseRegistration.alert.recommend.${alert.recommendation.hint}`)
}

function handleAddSupplement(alert) {
  const result = addStudentToSupplementList(
    {
      studentId: alert.studentId,
      studentName: alert.studentName,
      programme: alert.programme,
      intake: alert.intake,
    },
    { listType: 'supplement', source: 'academic-alert', remark: alertTypeLabel(alert.alertType) },
  )
  if (!result.ok) {
    window.alert(t(result.errorKey))
    return
  }
  window.alert(t('courseRegistration.supplement.addedSuccess', { name: alert.studentName }))
}

function goToSupplementList() {
  emit('navigate', 'cr-supplement')
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = alertExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatAlertExportRow,
    filename: `academic-alerts-${timestamp}.xlsx`,
    sheetName: 'Academic Alerts',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-alert-page">
    <ModuleBriefPanel page-id="cr-alert" />

    <div class="stats-row" style="grid-template-columns: repeat(3, 1fr)">
      <div class="stat-card">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">{{ t('courseRegistration.alert.statTotal') }}</span>
      </div>
      <div class="stat-card high">
        <span class="stat-value">{{ stats.high }}</span>
        <span class="stat-label">{{ t('courseRegistration.alert.statHigh') }}</span>
      </div>
      <div class="stat-card medium">
        <span class="stat-value">{{ stats.medium }}</span>
        <span class="stat-label">{{ t('courseRegistration.alert.statMedium') }}</span>
      </div>
    </div>

    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.alert.type') }}</label>
              <select v-model="searchForm.alertType" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in academicAlertTypeOptions" :key="opt" :value="opt">{{ alertTypeLabel(opt) }}</option>
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
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input v-model="searchForm.programme" type="text" class="search-input" />
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
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.monitor.studentId') }}</th>
              <th>{{ t('courseRegistration.monitor.studentName') }}</th>
              <th>{{ t('courseRegistration.alert.type') }}</th>
              <th>{{ t('courseRegistration.alert.severityLabel') }}</th>
              <th>{{ t('courseRegistration.alert.recommendation') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.studentId }}</td>
              <td>{{ row.studentName }}</td>
              <td>{{ alertTypeLabel(row.alertType) }}</td>
              <td>
                <span class="severity-tag" :class="severityClass(row.severity)">
                  {{ t(`courseRegistration.alert.severity.${row.severity}`) }}
                </span>
              </td>
              <td class="col-recommend">{{ recommendationText(row) }}</td>
              <td>
                <button
                  type="button"
                  class="link-btn"
                  :disabled="isStudentInSupplementList(row.studentId)"
                  @click="handleAddSupplement(row)"
                >
                  {{ t('courseRegistration.monitor.addSupplement') }}
                </button>
              </td>
            </tr>
            <tr v-if="!paginatedRows.length">
              <td colspan="7" class="empty-cell">{{ t('common.noData') }}</td>
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

    <ExportModal
      :visible="exportModalVisible"
      :fields="alertExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.stat-card.high .stat-value { color: #dc2626; }
.stat-card.medium .stat-value { color: #d97706; }
.severity-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.severity-high { background: #fee2e2; color: #b91c1c; }
.severity-medium { background: #fef3c7; color: #b45309; }
.col-recommend { font-size: 12px; color: #6b7280; max-width: 220px; }
.link-btn:disabled { color: #9ca3af; cursor: not-allowed; }
</style>
