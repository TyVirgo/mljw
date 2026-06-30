<script setup>
import { ref, computed, watch } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import MovementApplicationDetailDrawer from '../../components/studentRecords/MovementApplicationDetailDrawer.vue'
import MovementApprovalModal from '../../components/studentRecords/MovementApprovalModal.vue'
import ImplementedYnBadge from '../../components/common/ImplementedYnBadge.vue'
import { useListPageI18n } from '../../composables/useListPageI18n.js'
import {
  applyMovementDecision,
  canBatchApproveSelection,
  classifyApprovalBucket,
  DEFAULT_APPROVER_ROLE,
} from '../../data/movementApprovalEngine.js'
import {
  mergeMovementApprovalQueue,
  filterByBucket,
  filterBySearch,
  movementApprovalStatusOptions,
} from '../../data/movementApprovalQueue.js'
import { getDistinctApplicationSessions } from '../../data/movementListSearchOptions.js'
import {
  movementApprovalExportFields,
  movementApprovalExportColumnMeta,
} from '../../data/movementApprovalExportFields.js'
import { exportMovementApprovalToExcel } from '../../utils/exportMovementApprovalExcel.js'
import { movementListStatusBadgeClass } from '../../utils/movementListStatusBadge.js'
import '../../styles/movement-status-badge.css'

const { t, tr, translatedExportFields } = useListPageI18n(movementApprovalExportFields)

const APPROVAL_TABS = [
  { id: 'pending', labelKey: 'movementApproval.tabs.pending' },
  { id: 'submitted', labelKey: 'movementApproval.tabs.submitted' },
  { id: 'history', labelKey: 'movementApproval.tabs.history' },
]

const currentRole = DEFAULT_APPROVER_ROLE
const activeTab = ref('pending')

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const detailItem = ref(null)
const detailMode = ref('readonly')
const approvalModalVisible = ref(false)
const pendingApprovalRows = ref([])
const approvalModalStage = ref('')
const exportModalVisible = ref(false)

function createEmptySearch() {
  return {
    academicSession: '',
    programmeCode: '',
    status: '',
    studentId: '',
    studentName: '',
  }
}

const fullQueue = computed(() => mergeMovementApprovalQueue(t))

const sessionOptions = computed(() => getDistinctApplicationSessions(fullQueue.value))

const tabCounts = computed(() => {
  const counts = { submitted: 0, pending: 0, history: 0 }
  for (const row of fullQueue.value) {
    const bucket = classifyApprovalBucket(row.raw, currentRole)
    if (bucket) counts[bucket] += 1
  }
  return counts
})

const bucketItems = computed(() => filterByBucket(fullQueue.value, activeTab.value, currentRole))

const filteredItems = computed(() => filterBySearch(bucketItems.value, appliedSearch.value))

const totalCount = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedItems.value.length) return false
  return paginatedItems.value.every((item) => selectedKeys.value.includes(item.queueKey))
})

const selectedRows = computed(() =>
  selectedKeys.value
    .map((key) => fullQueue.value.find((row) => row.queueKey === key))
    .filter(Boolean),
)

const hasSelection = computed(() => selectedRows.value.length > 0)

const canApproveSelection = computed(
  () => activeTab.value === 'pending' && canBatchApproveSelection(selectedRows.value, currentRole),
)

const showApproveToolbar = computed(() => activeTab.value === 'pending')

const showImplementedColumn = computed(() => activeTab.value === 'history')

const tableColspan = computed(() => {
  let cols = 10
  if (showApproveToolbar.value) cols += 1
  if (showImplementedColumn.value) cols += 1
  return cols
})

watch(activeTab, () => {
  currentPage.value = 1
  selectedKeys.value = []
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  selectedKeys.value = []
}

function handleReset() {
  searchForm.value = createEmptySearch()
  appliedSearch.value = createEmptySearch()
  currentPage.value = 1
  selectedKeys.value = []
}

function toggleSelectAll(event) {
  const pageKeys = paginatedItems.value.map((item) => item.queueKey)
  if (event.target.checked) {
    selectedKeys.value = [...new Set([...selectedKeys.value, ...pageKeys])]
  } else {
    selectedKeys.value = selectedKeys.value.filter((key) => !pageKeys.includes(key))
  }
}

function toggleSelect(queueKey) {
  if (selectedKeys.value.includes(queueKey)) {
    selectedKeys.value = selectedKeys.value.filter((key) => key !== queueKey)
  } else {
    selectedKeys.value = [...selectedKeys.value, queueKey]
  }
}

function resolveReviewMode(tab) {
  if (tab === 'pending') return 'approve'
  if (tab === 'history') return 'history'
  return 'readonly'
}

function openDetails(row) {
  detailItem.value = row
  detailMode.value = resolveReviewMode(activeTab.value)
}

function closeDetails() {
  detailItem.value = null
}

function openApprovalModal() {
  if (!canApproveSelection.value) {
    window.alert(
      tr('Please select one or more applications at the same approval stage that can be approved.'),
    )
    return
  }
  pendingApprovalRows.value = [...selectedRows.value]
  approvalModalStage.value = selectedRows.value[0]?.approvalStage || ''
  approvalModalVisible.value = true
}

function handleApprovalConfirm({ action, comment }) {
  for (const row of pendingApprovalRows.value) {
    applyMovementDecision(row.sourceKey, row.raw, action, comment, currentRole)
  }
  pendingApprovalRows.value = []
  approvalModalVisible.value = false
  selectedKeys.value = []
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function openExportModal() {
  if (!filteredItems.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedItems.value
  } else if (exportScope === 'allResults') {
    data = filteredItems.value
  } else {
    data = filteredItems.value.filter((item) => selectedKeys.value.includes(item.queueKey))
  }

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportMovementApprovalToExcel(
    data,
    `movement-approval-${timestamp}.xlsx`,
    selectedFields,
    { t, tr },
    'Movement Approval',
    { columnMeta: movementApprovalExportColumnMeta },
  )
  exportModalVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedKeys.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function statusLabel(status) {
  const map = {
    Draft: t('deferment.status.draft'),
    'In Progress': t('deferment.status.inProgress'),
    'Update Required': t('deferment.status.updateRequired'),
    Approved: t('deferment.status.approved'),
    Rejected: t('deferment.status.rejected'),
    Cancelled: t('deferment.status.cancelled'),
    Expired: t('programmeTransfer.status.expired'),
  }
  return map[status] || status
}
</script>

<template>
  <div class="movement-approval-page">
    <div class="page-card">
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
          <span v-if="tab.id === 'pending'" class="tab-count">{{ tabCounts[tab.id] }}</span>
        </button>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('movementApproval.search.academicSession') }}</label>
              <select
                v-model="searchForm.academicSession"
                class="search-select"
                :class="{ 'is-empty': !searchForm.academicSession }"
              >
                <option value="">{{ t('common.all') }}</option>
                <option v-for="session in sessionOptions" :key="session" :value="session">
                  {{ session }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('movementApproval.search.programmeCode') }}</label>
              <input
                v-model="searchForm.programmeCode"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>
            <div class="search-item">
              <label>{{ tr('Status') }}</label>
              <select v-model="searchForm.status" class="search-select" :class="{ 'is-empty': !searchForm.status }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in movementApprovalStatusOptions" :key="opt" :value="opt">{{ statusLabel(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ tr('Student ID') }}</label>
              <input
                v-model="searchForm.studentId"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>
            <div class="search-item">
              <label>{{ tr('Student Name') }}</label>
              <input
                v-model="searchForm.studentName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
              />
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
        <button
          v-if="showApproveToolbar"
          type="button"
          class="btn btn-primary"
          :disabled="!canApproveSelection"
          @click="openApprovalModal"
        >
          {{ t('movementApproval.approve') }}
        </button>
        <button type="button" class="btn btn-outline" @click="openExportModal">{{ t('common.export') }}</button>
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
                <th>{{ tr('Status') }}</th>
                <th>{{ tr('Approval Stage') }}</th>
                <th v-if="showImplementedColumn">{{ tr('Implemented') }}</th>
                <th>{{ tr('Student ID') }}</th>
                <th>{{ tr('Student Name') }}</th>
                <th>{{ t('movementApproval.columns.applicationSession') }}</th>
                <th>{{ t('movementApproval.columns.effectiveSession') }}</th>
                <th>{{ t('movementApproval.columns.movementCategory') }}</th>
                <th>{{ t('movementApproval.columns.applicationDate') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedItems.length">
                <td :colspan="tableColspan" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedItems" :key="item.queueKey">
                <td v-if="showApproveToolbar" class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedKeys.includes(item.queueKey)"
                    @change="toggleSelect(item.queueKey)"
                  />
                </td>
                <td>{{ getRowNumber(index) }}</td>
                <td>
                  <span class="status-badge" :class="movementListStatusBadgeClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td>{{ tr(item.approvalStage) }}</td>
                <td v-if="showImplementedColumn"><ImplementedYnBadge :value="item.implemented" /></td>
                <td>{{ item.studentId }}</td>
                <td>{{ item.fullName }}</td>
                <td>{{ item.applicationSession }}</td>
                <td>{{ item.effectiveSession }}</td>
                <td>{{ t(item.movementCategoryKey) }}</td>
                <td>{{ item.applicationDateDisplay }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openDetails(item)">{{ t('common.details') }}</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          :total="totalCount"
          v-model="currentPage"
          v-model:page-size="pageSize"
          @change="handlePaginationChange"
        />
      </div>
    </div>

    <MovementApplicationDetailDrawer
      :visible="!!detailItem"
      :queue-item="detailItem"
      :mode="detailMode"
      :current-role="currentRole"
      @close="closeDetails"
      @decided="closeDetails"
      @recalled="closeDetails"
    />

    <MovementApprovalModal
      :visible="approvalModalVisible"
      :approval-stage="approvalModalStage"
      :target-count="pendingApprovalRows.length"
      @close="approvalModalVisible = false"
      @confirm="handleApprovalConfirm"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="translatedExportFields"
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.movement-approval-page {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  box-sizing: border-box;
  overflow: hidden;
}

.page-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 20px 24px 16px;
}

.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
}

.tab-btn.active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.12);
  font-size: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  white-space: nowrap;
}

.data-table th,
.data-table td {
  padding: 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 13px;
}

.col-check {
  width: 48px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.actions-inner {
  display: inline-flex;
  gap: 12px;
}

.col-sticky-right {
  position: sticky;
  right: 0;
  z-index: 2;
  background: #fff;
  border-left: 1px solid #f3f4f6;
  min-width: 160px;
}

.data-table thead .col-sticky-right {
  background: #f9fafb;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>
