<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ApprovalLogModal from '../../components/studentRecords/ApprovalLogModal.vue'
import MovementApprovalReviewView from '../../components/studentRecords/MovementApprovalReviewView.vue'
import { useListPageI18n } from '../../composables/useListPageI18n.js'
import { DEFAULT_APPROVER_ROLE } from '../../data/movementApprovalEngine.js'
import {
  mergeMovementQueryQueue,
  filterQueryBySearch,
  movementQueryStatusOptions,
  movementQueryTypeOptions,
  movementQueryTypeLabelKeys,
} from '../../data/movementQueryQueue.js'
import { getDistinctApplicationSessions } from '../../data/movementListSearchOptions.js'
import { movementQueryExportFields, movementQueryExportColumnMeta } from '../../data/movementQueryExportFields.js'
import { MAINTENANCE_EMPTY } from '../../data/movementMaintenanceFields.js'
import { formatImplementedYn } from '../../data/movementApprovalQueue.js'
import { exportMovementQueryToExcel } from '../../utils/exportMovementQueryExcel.js'
import { maskPassportIc } from '../../utils/maskPassportIc.js'
import { movementListStatusBadgeClass } from '../../utils/movementListStatusBadge.js'
import '../../styles/movement-status-badge.css'

const { t, tr, translatedExportFields } = useListPageI18n(movementQueryExportFields)

const currentRole = DEFAULT_APPROVER_ROLE

const searchExpanded = ref(true)
const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const viewMode = ref('list')
const reviewItem = ref(null)
const approvalLogItem = ref(null)
const exportModalVisible = ref(false)

function createEmptySearch() {
  return {
    academicSession: '',
    programmeCode: '',
    status: '',
    movementType: '',
    studentId: '',
    studentName: '',
  }
}

const fullQueue = computed(() => mergeMovementQueryQueue(t))

const sessionOptions = computed(() => getDistinctApplicationSessions(fullQueue.value))

const filteredItems = computed(() => filterQueryBySearch(fullQueue.value, appliedSearch.value))

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

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value
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

function openDetails(row) {
  reviewItem.value = row
  viewMode.value = 'review'
}

function closeReview() {
  viewMode.value = 'list'
  reviewItem.value = null
}

function openApprovalLog(row) {
  approvalLogItem.value = row
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
  exportMovementQueryToExcel(
    data,
    `movement-query-${timestamp}.xlsx`,
    selectedFields,
    { t, tr },
    'Movement Query',
    {
      columnMeta: movementQueryExportColumnMeta,
      implementedAsYn: true,
      maskPassport: true,
    },
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

function implementedDisplay(value) {
  return formatImplementedYn(value)
}

function studentTypeLabel(type) {
  const key = `movementMaintenance.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : type
}

function displayCell(value) {
  if (value === '' || value == null) return MAINTENANCE_EMPTY
  return value
}

function displayPassportIc(value) {
  const raw = displayCell(value)
  if (raw === MAINTENANCE_EMPTY) return raw
  return maskPassportIc(raw)
}
</script>

<template>
  <MovementApprovalReviewView
    v-if="viewMode === 'review' && reviewItem"
    :queue-item="reviewItem"
    mode="readonly"
    :current-role="currentRole"
    :mask-sensitive-fields="true"
    @back="closeReview"
  />

  <div v-else class="movement-query-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('movementQuery.search.academicSession') }}</label>
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
              <label>{{ t('movementQuery.search.programmeCode') }}</label>
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
                <option v-for="opt in movementQueryStatusOptions" :key="opt" :value="opt">
                  {{ statusLabel(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('movementQuery.search.movementType') }}</label>
              <select
                v-model="searchForm.movementType"
                class="search-select"
                :class="{ 'is-empty': !searchForm.movementType }"
              >
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in movementQueryTypeOptions" :key="opt" :value="opt">
                  {{ t(movementQueryTypeLabelKeys[opt]) }}
                </option>
              </select>
            </div>
          </div>

          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              {{ t('common.reset') }}
            </button>
            <button type="button" class="btn btn-text" @click="toggleSearchExpanded">
              {{ searchExpanded ? t('common.collapse') : t('common.more') }}
              <svg :class="{ up: searchExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        <Transition name="search-expand">
          <div v-if="searchExpanded" class="search-row search-row-secondary">
            <div class="search-fields">
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
          </div>
        </Transition>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-outline" @click="openExportModal">
          {{ t('common.export') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ tr('Status') }}</th>
                <th>{{ tr('Approval Stage') }}</th>
                <th>{{ tr('Implemented') }}</th>
                <th>{{ tr('Student ID') }}</th>
                <th>{{ tr('Student Name') }}</th>
                <th>{{ t('movementMaintenance.columns.movementDate') }}</th>
                <th>{{ t('movementMaintenance.columns.passportIc') }}</th>
                <th>{{ t('movementMaintenance.columns.studentType') }}</th>
                <th>{{ t('movementMaintenance.columns.intake') }}</th>
                <th>{{ t('movementApproval.columns.applicationSession') }}</th>
                <th>{{ t('movementApproval.columns.effectiveSession') }}</th>
                <th>{{ t('movementApproval.columns.movementCategory') }}</th>
                <th>{{ t('movementApproval.columns.movementReason') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedItems.length">
                <td colspan="16" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedItems" :key="item.queueKey">
                <td class="col-check">
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
                <td>{{ implementedDisplay(item.implemented) }}</td>
                <td>{{ item.studentId }}</td>
                <td>{{ item.fullName }}</td>
                <td>{{ displayCell(item.movementDate) }}</td>
                <td>{{ displayPassportIc(item.passportIc) }}</td>
                <td>{{ studentTypeLabel(item.studentType) }}</td>
                <td>{{ displayCell(item.intake) }}</td>
                <td>{{ item.applicationSession }}</td>
                <td>{{ item.effectiveSession }}</td>
                <td>{{ t(item.movementCategoryKey) }}</td>
                <td class="reason-cell">{{ item.movementReason }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openDetails(item)">{{ tr('Details') }}</button>
                    <span class="action-sep">|</span>
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

    <ExportModal
      :visible="exportModalVisible"
      :fields="translatedExportFields"
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />

    <ApprovalLogModal
      :visible="!!approvalLogItem"
      :logs="approvalLogItem?.raw?.approvalLog || []"
      :subtitle="approvalLogItem ? `${approvalLogItem.applicationId} — ${approvalLogItem.fullName}` : ''"
      @close="approvalLogItem = null"
    />
  </div>
</template>

<style scoped>
.movement-query-page {
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

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
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
  max-width: 180px;
  white-space: normal;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.actions-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-sep {
  color: #d1d5db;
  font-size: 12px;
}

.col-sticky-right {
  position: sticky;
  right: 0;
  z-index: 2;
  background: #fff;
  border-left: 1px solid #f3f4f6;
  min-width: 180px;
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

.search-expand-enter-active,
.search-expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.search-expand-enter-from,
.search-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.btn-text svg {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.btn-text svg.up {
  transform: rotate(180deg);
}
</style>
