<script setup>
import { ref, computed, watch } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import AddDropApprovalDetailDrawer from '../../components/courseRegistration/AddDropApprovalDetailDrawer.vue'
import AddDropApprovalModal from '../../components/courseRegistration/AddDropApprovalModal.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  addDropApprovalQueue,
  filterAddDropQueue,
  addDropTypeOptions,
  decideAddDropApplication,
  buildAddDropValidation,
} from '../../data/courseRegistration/addDropApprovalQueue.js'
import { approvalExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatApprovalExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { getAddDropCourseColumnTexts } from '../../utils/addDropCourseDisplay.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t, tr } = useAppI18n()

const APPROVAL_TABS = [
  { id: 'pending', labelKey: 'courseRegistration.approval.tabs.pending' },
  { id: 'submitted', labelKey: 'courseRegistration.approval.tabs.submitted' },
  { id: 'history', labelKey: 'courseRegistration.approval.tabs.history' },
]

const activeTab = ref('pending')
const searchForm = ref({ programme: '', type: '', keyword: '' })
const appliedSearch = ref({ programme: '', type: '', keyword: '' })
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const detailApp = ref(null)
const detailMode = ref('readonly')
const exportModalVisible = ref(false)
const approvalModalVisible = ref(false)
const pendingApprovalIds = ref([])

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

const showApproveToolbar = computed(() => activeTab.value === 'pending')

const allPageSelected = computed(() => {
  if (!paginatedRows.value.length) return false
  return paginatedRows.value.every((row) => selectedIds.value.includes(row.id))
})

const selectedRows = computed(() =>
  selectedIds.value
    .map((id) => addDropApprovalQueue.value.find((row) => row.id === id))
    .filter((row) => row && row.status === 'Pending'),
)

const canApproveSelection = computed(
  () => showApproveToolbar.value && selectedRows.value.length > 0,
)

const tableColspan = computed(() => (showApproveToolbar.value ? 13 : 12))

const batchShowGenerateBill = computed(() =>
  pendingApprovalIds.value.some((id) => {
    const row = addDropApprovalQueue.value.find((r) => r.id === id)
    if (!row) return false
    return (row.items || []).some((i) => (i.fee || 0) > 0)
  }),
)

watch(activeTab, () => {
  currentPage.value = 1
  selectedIds.value = []
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  selectedIds.value = []
}

function handleReset() {
  searchForm.value = { programme: '', type: '', keyword: '' }
  appliedSearch.value = { programme: '', type: '', keyword: '' }
  currentPage.value = 1
  selectedIds.value = []
}

function typeLabel(type) {
  return t(`courseRegistration.approval.type.${type}`)
}

function typeClass(type) {
  const map = {
    Add: 'type-add',
    Drop: 'type-drop',
    Retake: 'type-retake',
    Replace: 'type-replace',
    AddDrop: 'type-mixed',
  }
  return map[type] || ''
}

function billLabel(status) {
  if (!status || status === 'none') return '—'
  return t(`courseRegistration.approval.bill.${status}`)
}

function courseColumns(row) {
  return getAddDropCourseColumnTexts(row)
}

function resolveDetailMode(tab) {
  return tab === 'pending' ? 'approve' : 'readonly'
}

function openDetail(row) {
  detailApp.value = row
  detailMode.value = resolveDetailMode(activeTab.value)
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
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function openBatchApproval() {
  if (!canApproveSelection.value) {
    window.alert(tr('Please select one or more applications that can be approved.'))
    return
  }
  pendingApprovalIds.value = selectedRows.value.map((r) => r.id)
  approvalModalVisible.value = true
}

function handleBatchApprovalConfirm({ action, comment, generateBill }) {
  let failed = 0
  for (const id of pendingApprovalIds.value) {
    const row = addDropApprovalQueue.value.find((r) => r.id === id)
    if (!row || row.status !== 'Pending') continue
    if (action === 'Approved') {
      const validation = buildAddDropValidation(row)
      if (!validation.creditOk) {
        failed += 1
        continue
      }
    }
    const result = decideAddDropApplication(id, action, comment, { generateBill })
    if (!result.ok) failed += 1
  }
  pendingApprovalIds.value = []
  approvalModalVisible.value = false
  selectedIds.value = []
  if (failed > 0) {
    window.alert(t('courseRegistration.approval.batchPartialFail', { count: failed }))
  }
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
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
    <div class="page-card">
      <CourseRegistrationCallout variant="rule">
        <p>{{ t('courseRegistration.approval.mainFlowHint') }}</p>
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
        <button
          v-if="showApproveToolbar"
          type="button"
          class="btn btn-primary"
          :disabled="!canApproveSelection"
          @click="openBatchApproval"
        >
          {{ t('courseRegistration.approval.approve') }}
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
                <th v-if="showApproveToolbar" class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.approval.applicationNo') }}</th>
                <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                <th>{{ t('courseRegistration.approval.typeLabel') }}</th>
                <th>{{ t('courseRegistration.approval.addCourseName') }}</th>
                <th>{{ t('courseRegistration.approval.dropCourseName') }}</th>
                <th>{{ t('courseRegistration.approval.retakeCourseName') }}</th>
                <th>{{ t('courseRegistration.monitor.credits') }}</th>
                <th>{{ t('courseRegistration.approval.billLabel') }}</th>
                <th>{{ t('courseRegistration.approval.submittedAt') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td v-if="showApproveToolbar" class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(row.id)"
                    @change="toggleSelect(row.id)"
                  />
                </td>
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.applicationNo }}</td>
                <td>{{ row.studentId }}</td>
                <td>{{ row.studentName }}</td>
                <td>
                  <span class="type-tag" :class="typeClass(row.type)">{{ typeLabel(row.type) }}</span>
                </td>
                <td class="col-course nowrap">{{ courseColumns(row).add }}</td>
                <td class="col-course nowrap">{{ courseColumns(row).drop }}</td>
                <td class="col-course nowrap">{{ courseColumns(row).retake }}</td>
                <td>{{ row.currentCredits }}/{{ row.creditMax }}</td>
                <td>{{ billLabel(row.billStatus) }}</td>
                <td>{{ row.submittedAt }}</td>
                <td>
                  <button type="button" class="link-btn" @click="openDetail(row)">
                    {{ t('common.details') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td :colspan="tableColspan" class="empty-cell">{{ t('common.noData') }}</td>
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
      :mode="detailMode"
      @close="detailApp = null"
      @updated="detailApp = null"
    />

    <AddDropApprovalModal
      :visible="approvalModalVisible"
      approval-stage="Academic Coordinator"
      :target-count="pendingApprovalIds.length"
      :show-generate-bill="batchShowGenerateBill"
      @close="approvalModalVisible = false"
      @confirm="handleBatchApprovalConfirm"
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
.col-check {
  width: 40px;
  text-align: center;
}

.col-course {
  max-width: 220px;
  font-size: 12px;
  color: #374151;
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
