<script setup>
import { ref, computed, watch } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ApprovalLogModal from '../../components/studentRecords/ApprovalLogModal.vue'
import MovementApprovalModal from '../../components/studentRecords/MovementApprovalModal.vue'
import MovementApprovalReviewView from '../../components/studentRecords/MovementApprovalReviewView.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
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
import { statusBadgeClass as defermentStatusBadgeClass } from '../../data/deferments.js'

const { t, tr } = useAppI18n()

const APPROVAL_TABS = [
  { id: 'submitted', labelKey: 'movementApproval.tabs.submitted' },
  { id: 'pending', labelKey: 'movementApproval.tabs.pending' },
  { id: 'history', labelKey: 'movementApproval.tabs.history' },
]

const currentRole = DEFAULT_APPROVER_ROLE
const activeTab = ref('pending')

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const viewMode = ref('list')
const reviewItem = ref(null)
const reviewMode = ref('readonly')
const approvalLogItem = ref(null)
const approvalModalVisible = ref(false)
const pendingApprovalRows = ref([])
const approvalModalStage = ref('')

function createEmptySearch() {
  return {
    academicSession: '',
    movementReason: '',
    status: '',
    studentId: '',
    studentName: '',
  }
}

const fullQueue = computed(() => mergeMovementApprovalQueue(t))

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

const canApproveSelection = computed(
  () => activeTab.value === 'pending' && canBatchApproveSelection(selectedRows.value, currentRole),
)

const showApproveToolbar = computed(() => activeTab.value === 'pending')

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

function openReview(row) {
  reviewItem.value = row
  reviewMode.value = resolveReviewMode(activeTab.value)
  viewMode.value = 'review'
}

function closeReview() {
  viewMode.value = 'list'
  reviewItem.value = null
}

function openApprovalLog(row) {
  approvalLogItem.value = row
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

function handleExport() {
  if (!filteredItems.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  const headers = [
    tr('Status'),
    tr('Approval Stage'),
    tr('Implemented'),
    tr('Student ID'),
    tr('Student Name'),
    tr('Application Session'),
    tr('Effective Session'),
    t('movementApproval.columns.movementCategory'),
    t('movementApproval.columns.movementReason'),
  ]
  const lines = filteredItems.value.map((row) =>
    [
      row.status,
      row.approvalStage,
      row.implemented,
      row.studentId,
      row.fullName,
      row.applicationSession,
      row.effectiveSession,
      t(row.movementCategoryKey),
      row.movementReason,
    ]
      .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
      .join(','),
  )
  const csv = [headers.map((h) => `"${h}"`).join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `movement-approval-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
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
  }
  return map[status] || status
}
</script>

<template>
  <MovementApprovalReviewView
    v-if="viewMode === 'review' && reviewItem"
    :queue-item="reviewItem"
    :mode="reviewMode"
    :current-role="currentRole"
    @back="closeReview"
    @decided="closeReview"
    @recalled="closeReview"
  />

  <div v-else class="movement-approval-page">
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
          <span class="tab-count">{{ tabCounts[tab.id] }}</span>
        </button>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('movementApproval.search.academicSession') }}</label>
              <input
                v-model="searchForm.academicSession"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>
            <div class="search-item">
              <label>{{ t('movementApproval.search.movementReason') }}</label>
              <input
                v-model="searchForm.movementReason"
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
          {{ tr('Review') }}
        </button>
        <button type="button" class="btn btn-outline" @click="handleExport">{{ t('common.export') }}</button>
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
                <th>{{ tr('Implemented') }}</th>
                <th>{{ tr('Student ID') }}</th>
                <th>{{ tr('Student Name') }}</th>
                <th>{{ t('movementApproval.columns.applicationSession') }}</th>
                <th>{{ t('movementApproval.columns.effectiveSession') }}</th>
                <th>{{ t('movementApproval.columns.movementCategory') }}</th>
                <th>{{ t('movementApproval.columns.movementReason') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedItems.length">
                <td :colspan="showApproveToolbar ? 12 : 11" class="empty-cell">{{ t('common.noData') }}</td>
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
                  <span class="status-badge" :class="defermentStatusBadgeClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td>{{ tr(item.approvalStage) }}</td>
                <td>{{ tr(item.implemented) }}</td>
                <td>{{ item.studentId }}</td>
                <td>{{ item.fullName }}</td>
                <td>{{ item.applicationSession }}</td>
                <td>{{ item.effectiveSession }}</td>
                <td>{{ t(item.movementCategoryKey) }}</td>
                <td class="reason-cell">{{ item.movementReason }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openReview(item)">{{ tr('View') }}</button>
                    <button type="button" class="link-btn" @click="openApprovalLog(item)">
                      {{ tr('Approval Log') }}
                    </button>
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

    <ApprovalLogModal
      :visible="!!approvalLogItem"
      :logs="approvalLogItem?.raw?.approvalLog || []"
      :subtitle="approvalLogItem ? `${approvalLogItem.applicationId} — ${approvalLogItem.fullName}` : ''"
      @close="approvalLogItem = null"
    />

    <MovementApprovalModal
      :visible="approvalModalVisible"
      :approval-stage="approvalModalStage"
      :target-count="pendingApprovalRows.length"
      @close="approvalModalVisible = false"
      @confirm="handleApprovalConfirm"
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

.reason-cell {
  max-width: 220px;
  white-space: normal;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
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
