<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ApprovalLogModal from '../../components/studentRecords/ApprovalLogModal.vue'
import MovementApprovalReviewView from '../../components/studentRecords/MovementApprovalReviewView.vue'
import { useListPageI18n } from '../../composables/useListPageI18n.js'
import { DEFAULT_APPROVER_ROLE } from '../../data/movementApprovalEngine.js'
import { formatImplementedYn } from '../../data/movementApprovalQueue.js'
import { getCurrentApplicationSession } from '../../data/movementApplicationSession.js'
import { getDistinctApplicationSessions } from '../../data/movementListSearchOptions.js'
import {
  mergeMovementMaintenanceQueue,
  filterMaintenanceBySearch,
  movementMaintenanceStatusOptions,
} from '../../data/movementMaintenanceQueue.js'
import { movementMaintenanceExportFields, movementMaintenanceExportColumnMeta } from '../../data/movementMaintenanceExportFields.js'
import {
  implementMaintenanceRecords,
  deleteMaintenanceRecords,
  MAINTENANCE_EMPTY,
} from '../../data/movementMaintenanceFields.js'
import { exportMovementQueryToExcel } from '../../utils/exportMovementQueryExcel.js'
import { maskPassportIc } from '../../utils/maskPassportIc.js'
import { movementListStatusBadgeClass } from '../../utils/movementListStatusBadge.js'
import '../../styles/movement-status-badge.css'

const { t, tr, translatedExportFields } = useListPageI18n(movementMaintenanceExportFields)

const currentRole = DEFAULT_APPROVER_ROLE

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const viewMode = ref('list')
const reviewItem = ref(null)
const approvalLogItem = ref(null)

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null)
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

const fullQueue = computed(() => mergeMovementMaintenanceQueue(t))

const sessionOptions = computed(() => getDistinctApplicationSessions(fullQueue.value))

const filteredItems = computed(() => filterMaintenanceBySearch(fullQueue.value, appliedSearch.value))

const totalCount = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const selectablePageItems = computed(() =>
  paginatedItems.value.filter((item) => item.implemented === 'Pending'),
)

const allPageSelected = computed(() => {
  const selectable = selectablePageItems.value
  if (!selectable.length) return false
  return selectable.every((item) => selectedKeys.value.includes(item.queueKey))
})

const selectedRows = computed(() =>
  selectedKeys.value
    .map((key) => fullQueue.value.find((row) => row.queueKey === key))
    .filter(Boolean),
)

const hasSelection = computed(() => selectedRows.value.length > 0)

const canImplement = computed(
  () => hasSelection.value && selectedRows.value.some((row) => row.implemented === 'Pending'),
)

function pruneSelection() {
  selectedKeys.value = selectedKeys.value.filter((key) => {
    const row = fullQueue.value.find((item) => item.queueKey === key)
    return row && row.implemented === 'Pending'
  })
}

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  pruneSelection()
}

function handleReset() {
  searchForm.value = createEmptySearch()
  appliedSearch.value = createEmptySearch()
  currentPage.value = 1
  pruneSelection()
}

function toggleSelectAll(event) {
  const pageKeys = selectablePageItems.value.map((item) => item.queueKey)
  if (event.target.checked) {
    selectedKeys.value = [...new Set([...selectedKeys.value, ...pageKeys])]
  } else {
    selectedKeys.value = selectedKeys.value.filter((key) => !pageKeys.includes(key))
  }
}

function toggleSelect(queueKey) {
  const row = fullQueue.value.find((item) => item.queueKey === queueKey)
  if (!row || row.implemented !== 'Pending') return
  if (selectedKeys.value.includes(queueKey)) {
    selectedKeys.value = selectedKeys.value.filter((key) => key !== queueKey)
  } else {
    selectedKeys.value = [...selectedKeys.value, queueKey]
  }
}

function isImmediateImplementRow(row) {
  const current = getCurrentApplicationSession()
  const effective = row.effectiveSession
  return current && effective && effective !== '—' && current === effective
}

function buildImplementConfirmMessage(eligible) {
  const immediate = eligible.filter(isImmediateImplementRow)
  const scheduled = eligible.filter((row) => !isImmediateImplementRow(row))
  if (immediate.length && !scheduled.length) {
    return t('movementMaintenance.implementConfirm', { count: immediate.length })
  }
  if (scheduled.length && !immediate.length) {
    const sessions = [...new Set(scheduled.map((row) => row.effectiveSession).filter(Boolean))]
    if (sessions.length === 1) {
      return t('movementMaintenance.implementConfirmScheduled', {
        count: scheduled.length,
        effectiveSession: sessions[0],
      })
    }
    return t('movementMaintenance.implementConfirmScheduledMulti', { count: scheduled.length })
  }
  return t('movementMaintenance.implementConfirmMixed', {
    immediate: immediate.length,
    scheduled: scheduled.length,
  })
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

function requestImplement() {
  if (!hasSelection.value) return
  const eligible = selectedRows.value.filter((row) => row.implemented === 'Pending')
  if (!eligible.length) {
    window.alert(t('movementMaintenance.implementNoneEligible'))
    return
  }
  confirmTitle.value = t('movementMaintenance.implement')
  confirmMessage.value = buildImplementConfirmMessage(eligible)
  confirmAction.value = () => {
    implementMaintenanceRecords(eligible)
    selectedKeys.value = []
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  }
  confirmVisible.value = true
}

function requestDelete() {
  if (!hasSelection.value) return
  confirmTitle.value = t('common.deleteConfirmation')
  confirmMessage.value = t('movementMaintenance.deleteMany', { count: selectedRows.value.length })
  confirmAction.value = () => {
    deleteMaintenanceRecords(selectedRows.value)
    selectedKeys.value = []
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  }
  confirmVisible.value = true
}

function handleConfirm() {
  confirmAction.value?.()
  confirmVisible.value = false
  confirmAction.value = null
}

function handleCancelConfirm() {
  confirmVisible.value = false
  confirmAction.value = null
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
    `movement-maintenance-${timestamp}.xlsx`,
    selectedFields,
    { t, tr },
    'Movement Maintenance',
    {
      columnMeta: movementMaintenanceExportColumnMeta,
      implementedAsYn: true,
      maskPassport: true,
    },
  )
  exportModalVisible.value = false
}

function handlePaginationChange() {
  pruneSelection()
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function statusLabel(status) {
  const map = {
    Approved: t('deferment.status.approved'),
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

  <div v-else class="movement-maintenance-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('movementMaintenance.search.academicSession') }}</label>
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
              <label>{{ t('movementMaintenance.search.programmeCode') }}</label>
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
                <option v-for="opt in movementMaintenanceStatusOptions" :key="opt" :value="opt">
                  {{ statusLabel(opt) }}
                </option>
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
        <button type="button" class="btn btn-primary" :disabled="!canImplement" @click="requestImplement">
          {{ t('movementMaintenance.implement') }}
        </button>
        <button type="button" class="btn btn-outline" @click="openExportModal">{{ t('common.export') }}</button>
        <button
          type="button"
          class="btn btn-danger-outline"
          :disabled="!hasSelection"
          @click="requestDelete"
        >
          {{ t('common.delete') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input
                    type="checkbox"
                    :checked="allPageSelected"
                    :disabled="!selectablePageItems.length"
                    @change="toggleSelectAll"
                  />
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
                    :disabled="item.implemented !== 'Pending'"
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

    <ExportModal
      :visible="exportModalVisible"
      :fields="translatedExportFields"
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmTitle === t('common.deleteConfirmation') ? t('common.delete') : t('common.confirm')"
      @confirm="handleConfirm"
      @cancel="handleCancelConfirm"
    />
  </div>
</template>

<style scoped>
.movement-maintenance-page {
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-outline {
  background: #fff;
  border: 1px solid #ef4444;
  color: #ef4444;
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  gap: 8px;
  flex-wrap: wrap;
}

.col-sticky-right {
  position: sticky;
  right: 0;
  z-index: 2;
  background: #fff;
  border-left: 1px solid #f3f4f6;
  min-width: 200px;
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
