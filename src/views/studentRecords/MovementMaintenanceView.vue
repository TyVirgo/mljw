<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ApprovalLogModal from '../../components/studentRecords/ApprovalLogModal.vue'
import MovementApprovalReviewView from '../../components/studentRecords/MovementApprovalReviewView.vue'
import MovementMaintenanceEditModal from '../../components/studentRecords/MovementMaintenanceEditModal.vue'
import MovementMaintenanceNumberModal from '../../components/studentRecords/MovementMaintenanceNumberModal.vue'
import { useListPageI18n } from '../../composables/useListPageI18n.js'
import { DEFAULT_APPROVER_ROLE } from '../../data/movementApprovalEngine.js'
import {
  mergeMovementMaintenanceQueue,
  filterMaintenanceBySearch,
  movementMaintenanceStatusOptions,
} from '../../data/movementMaintenanceQueue.js'
import { movementQueryExportFields } from '../../data/movementQueryExportFields.js'
import {
  implementMaintenanceRecords,
  deleteMaintenanceRecords,
  MAINTENANCE_EMPTY,
} from '../../data/movementMaintenanceFields.js'
import { statusBadgeClass as defermentStatusBadgeClass } from '../../data/deferments.js'
import { exportMovementQueryToExcel } from '../../utils/exportMovementQueryExcel.js'

const { t, tr, translatedExportFields } = useListPageI18n(movementQueryExportFields)

const currentRole = DEFAULT_APPROVER_ROLE

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const viewMode = ref('list')
const reviewItem = ref(null)
const approvalLogItem = ref(null)
const editRow = ref(null)
const numberModalVisible = ref(false)

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null)
const exportModalVisible = ref(false)

function createEmptySearch() {
  return {
    academicSession: '',
    movementReason: '',
    status: '',
    studentId: '',
    studentName: '',
  }
}

const fullQueue = computed(() => mergeMovementMaintenanceQueue(t))

const filteredItems = computed(() => filterMaintenanceBySearch(fullQueue.value, appliedSearch.value))

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

const canImplement = computed(
  () => hasSelection.value && selectedRows.value.some((row) => row.implemented === 'Pending'),
)

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

function openEdit(row) {
  editRow.value = row
}

function closeEdit() {
  editRow.value = null
}

function openNumberModal() {
  if (!hasSelection.value) return
  numberModalVisible.value = true
}

function closeNumberModal() {
  numberModalVisible.value = false
}

function handleNumberSaved() {
  selectedKeys.value = []
}

function requestImplement() {
  if (!hasSelection.value) return
  const eligible = selectedRows.value.filter((row) => row.implemented === 'Pending')
  if (!eligible.length) {
    window.alert(t('movementMaintenance.implementNoneEligible'))
    return
  }
  confirmTitle.value = t('movementMaintenance.implement')
  confirmMessage.value = t('movementMaintenance.implementConfirm', { count: eligible.length })
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
    Approved: t('deferment.status.approved'),
  }
  return map[status] || status
}

function implementedLabel(value) {
  const key = `movementMaintenance.implemented.${value}`
  const translated = t(key)
  return translated !== key ? translated : value
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
</script>

<template>
  <MovementApprovalReviewView
    v-if="viewMode === 'review' && reviewItem"
    :queue-item="reviewItem"
    mode="readonly"
    :current-role="currentRole"
    @back="closeReview"
  />

  <div v-else class="movement-maintenance-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('movementMaintenance.search.academicSession') }}</label>
              <input
                v-model="searchForm.academicSession"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>
            <div class="search-item">
              <label>{{ t('movementMaintenance.search.movementReason') }}</label>
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
        <button
          type="button"
          class="btn btn-outline"
          :disabled="!hasSelection"
          @click="openNumberModal"
        >
          {{ t('movementMaintenance.modifyMovementNumber') }}
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
                <th>{{ t('movementMaintenance.columns.currentSchool') }}</th>
                <th>{{ t('movementMaintenance.columns.currentProgrammeCode') }}</th>
                <th>{{ t('movementMaintenance.columns.newSchool') }}</th>
                <th>{{ t('movementMaintenance.columns.newProgrammeCode') }}</th>
                <th>{{ t('movementMaintenance.columns.newProgrammeName') }}</th>
                <th>{{ t('movementMaintenance.columns.englishName') }}</th>
                <th>{{ t('movementMaintenance.columns.cgpa') }}</th>
                <th>{{ t('movementMaintenance.columns.expectedGraduationTime') }}</th>
                <th>{{ t('movementMaintenance.columns.movementNumber') }}</th>
                <th>{{ t('movementMaintenance.columns.remark') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedItems.length">
                <td colspan="26" class="empty-cell">{{ t('common.noData') }}</td>
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
                  <span class="status-badge" :class="defermentStatusBadgeClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td>{{ tr(item.approvalStage) }}</td>
                <td>{{ implementedLabel(item.implemented) }}</td>
                <td>{{ item.studentId }}</td>
                <td>{{ item.fullName }}</td>
                <td>{{ displayCell(item.movementDate) }}</td>
                <td>{{ displayCell(item.passportIc) }}</td>
                <td>{{ studentTypeLabel(item.studentType) }}</td>
                <td>{{ displayCell(item.intake) }}</td>
                <td>{{ item.applicationSession }}</td>
                <td>{{ item.effectiveSession }}</td>
                <td>{{ t(item.movementCategoryKey) }}</td>
                <td class="reason-cell">{{ item.movementReason }}</td>
                <td>{{ displayCell(item.currentSchool) }}</td>
                <td>{{ displayCell(item.currentProgrammeCode) }}</td>
                <td>{{ displayCell(item.newSchool) }}</td>
                <td>{{ displayCell(item.newProgrammeCode) }}</td>
                <td>{{ displayCell(item.newProgrammeName) }}</td>
                <td>{{ displayCell(item.englishName) }}</td>
                <td>{{ displayCell(item.cgpa) }}</td>
                <td>{{ displayCell(item.expectedGraduationTime) }}</td>
                <td>{{ displayCell(item.movementNumber) }}</td>
                <td class="remark-cell">{{ displayCell(item.remark) }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEdit(item)">{{ tr('Edit') }}</button>
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

    <MovementMaintenanceEditModal
      :visible="!!editRow"
      :row="editRow"
      @close="closeEdit"
      @saved="closeEdit"
    />

    <MovementMaintenanceNumberModal
      :visible="numberModalVisible"
      :rows="selectedRows"
      @close="closeNumberModal"
      @saved="handleNumberSaved"
    />

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

.reason-cell,
.remark-cell {
  max-width: 180px;
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
