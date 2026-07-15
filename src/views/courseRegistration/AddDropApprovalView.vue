<script setup>
import { ref, computed, watch } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import AddDropApprovalDetailDrawer from '../../components/courseRegistration/AddDropApprovalDetailDrawer.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  addDropApprovalQueue,
  filterAddDropQueue,
  addDropTypeOptions,
} from '../../data/courseRegistration/addDropApprovalQueue.js'
import { approvalExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatApprovalExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const APPROVAL_TABS = [
  { id: 'pending', labelKey: 'courseRegistration.approval.tabs.pending' },
  { id: 'submitted', labelKey: 'courseRegistration.approval.tabs.submitted' },
  { id: 'history', labelKey: 'courseRegistration.approval.tabs.history' },
]

const activeTab = ref('pending')
const searchForm = ref({ programme: '', type: '', keyword: '' })
const appliedSearch = ref({ programme: '', type: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const detailApp = ref(null)
const exportModalVisible = ref(false)

const tabCounts = computed(() => {
  const counts = { pending: 0, submitted: 0, history: 0 }
  for (const row of addDropApprovalQueue.value) {
    if (row.status === 'Pending') counts.pending += 1
    else if (row.status === 'In Review') counts.submitted += 1
    else if (['Approved', 'Rejected', 'Cancelled'].includes(row.status)) counts.history += 1
  }
  return counts
})

const rows = computed(() => filterAddDropQueue(addDropApprovalQueue.value, activeTab.value, appliedSearch.value))

const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

watch(activeTab, () => {
  currentPage.value = 1
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = { programme: '', type: '', keyword: '' }
  appliedSearch.value = { programme: '', type: '', keyword: '' }
  currentPage.value = 1
}

function typeLabel(type) {
  return t(`courseRegistration.approval.type.${type}`)
}

function typeClass(type) {
  const map = { Add: 'type-add', Drop: 'type-drop', Retake: 'type-retake', Replace: 'type-replace', AddDrop: 'type-mixed' }
  return map[type] || ''
}

function billLabel(status) {
  if (!status || status === 'none') return '—'
  return t(`courseRegistration.approval.bill.${status}`)
}

function openDetail(row) {
  detailApp.value = row
}

function summarizeItems(row) {
  return row.items.map((i) => `${typeLabel(i.action)} ${i.courseCode}`).join(' · ')
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = approvalExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatApprovalExportRow,
    filename: `add-drop-approval-${timestamp}.xlsx`,
    sheetName: 'Add Drop Approval',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-approval-page">
    <ModuleBriefPanel page-id="cr-approval" />

    <div class="page-card">
      <CourseRegistrationCallout variant="rule">
        <p>{{ t('courseRegistration.approval.suggestedOrder') }} · {{ t('courseRegistration.approval.retakePriority') }}</p>
      </CourseRegistrationCallout>

      <div class="tab-bar">
        <button
          v-for="tab in APPROVAL_TABS"
          :key="tab.id"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ t(tab.labelKey) }}
          <span v-if="tab.id === 'pending'" class="tab-count">{{ tabCounts.pending }}</span>
        </button>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input v-model="searchForm.programme" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.approval.typeLabel') }}</label>
              <select v-model="searchForm.type" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in addDropTypeOptions" :key="opt" :value="opt">{{ typeLabel(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.approval.applicationNo') }}</label>
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
              <th>{{ t('courseRegistration.approval.applicationNo') }}</th>
              <th>{{ t('courseRegistration.monitor.studentId') }}</th>
              <th>{{ t('courseRegistration.monitor.studentName') }}</th>
              <th>{{ t('courseRegistration.approval.typeLabel') }}</th>
              <th>{{ t('courseRegistration.approval.content') }}</th>
              <th>{{ t('courseRegistration.monitor.credits') }}</th>
              <th>{{ t('courseRegistration.approval.billLabel') }}</th>
              <th>{{ t('courseRegistration.approval.submittedAt') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.applicationNo }}</td>
              <td>{{ row.studentId }}</td>
              <td>{{ row.studentName }}</td>
              <td><span class="type-tag" :class="typeClass(row.type)">{{ typeLabel(row.type) }}</span></td>
              <td class="col-content">{{ summarizeItems(row) }}</td>
              <td>{{ row.currentCredits }}/{{ row.creditMax }}</td>
              <td>{{ billLabel(row.billStatus) }}</td>
              <td>{{ row.submittedAt }}</td>
              <td>
                <button type="button" class="link-btn" @click="openDetail(row)">
                  {{ activeTab === 'pending' ? t('courseRegistration.approval.review') : t('common.details') }}
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

    <AddDropApprovalDetailDrawer
      :visible="!!detailApp"
      :application="detailApp"
      :readonly="activeTab !== 'pending'"
      @close="detailApp = null"
      @updated="detailApp = null"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="approvalExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.col-content {
  max-width: 200px;
  font-size: 12px;
  color: #6b7280;
}

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-add { background: #dbeafe; color: #1d4ed8; }
.type-drop { background: #fee2e2; color: #b91c1c; }
.type-retake { background: #fef3c7; color: #b45309; }
.type-replace { background: #e0e7ff; color: #4338ca; }
.type-mixed { background: #f3e8ff; color: #7c3aed; }
</style>
