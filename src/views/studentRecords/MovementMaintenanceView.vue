<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import MovementApplicationDetailDrawer from '../../components/studentRecords/MovementApplicationDetailDrawer.vue'
import MovementDetailPdfPreviewModal from '../../components/studentRecords/MovementDetailPdfPreviewModal.vue'
import MovementArchiveNumberModal from '../../components/studentRecords/MovementArchiveNumberModal.vue'
import MovementListSearchBar from '../../components/studentRecords/MovementListSearchBar.vue'
import ImplementedYnBadge from '../../components/common/ImplementedYnBadge.vue'
import { useListPageI18n } from '../../composables/useListPageI18n.js'
import { DEFAULT_APPROVER_ROLE } from '../../data/movementApprovalEngine.js'
import { MOVEMENT_MAINTENANCE_TABLE_COLUMNS } from '../../data/movementListColumnConfig.js'
import {
  createMovementListSearch,
  getDistinctEffectiveSessions,
} from '../../data/movementListSearchFilters.js'
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

const detailItem = ref(null)
const pdfPreviewItem = ref(null)
const archiveNumberItem = ref(null)

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null)
const exportModalVisible = ref(false)

function createEmptySearch() {
  return createMovementListSearch()
}

const fullQueue = computed(() => mergeMovementMaintenanceQueue(t))

const effectiveSessionOptions = computed(() => getDistinctEffectiveSessions(fullQueue.value))

const tableColumns = MOVEMENT_MAINTENANCE_TABLE_COLUMNS
const tableColspan = 2 + tableColumns.length + 1

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

const selectedImplementableRows = computed(() =>
  selectedRows.value.filter((row) => row.implemented === 'Pending'),
)

const hasSelection = computed(() => selectedRows.value.length > 0)

const canImplement = computed(() => selectedImplementableRows.value.length > 0)

function pruneSelection() {
  selectedKeys.value = selectedKeys.value.filter((key) =>
    fullQueue.value.some((item) => item.queueKey === key),
  )
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

function requestImplement() {
  const eligible = selectedImplementableRows.value
  if (!eligible.length) {
    window.alert(t('movementMaintenance.implementNoneEligible'))
    return
  }
  confirmTitle.value = t('movementMaintenance.implement')
  confirmMessage.value = t('movementMaintenance.implementConfirm', { count: eligible.length })
  confirmAction.value = () => {
    implementMaintenanceRecords(eligible)
    const implementedKeys = new Set(eligible.map((row) => row.queueKey))
    selectedKeys.value = selectedKeys.value.filter((key) => !implementedKeys.has(key))
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  }
  confirmVisible.value = true
}

function openDetails(row) {
  detailItem.value = row
}

function closeDetails() {
  detailItem.value = null
}

function openPdfPreview(row) {
  pdfPreviewItem.value = row
}

function closePdfPreview() {
  pdfPreviewItem.value = null
}

function openArchiveNumberModal(row) {
  archiveNumberItem.value = row
}

function closeArchiveNumberModal() {
  archiveNumberItem.value = null
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

function getCellValue(item, column) {
  switch (column.key) {
    case 'approvalStage':
      return tr(item.approvalStage)
    case 'movementCategory':
      return t(item.movementCategoryKey)
    case 'effectiveDate':
      return displayCell(item.movementDate)
    case 'passportIc':
      return displayPassportIc(item.passportIc)
    case 'studentType':
      return studentTypeLabel(item.studentType)
    case 'nationality':
      return displayCell(item.nationality)
    default:
      return displayCell(item[column.key])
  }
}
</script>

<template>
  <div class="movement-maintenance-page">
    <div class="page-card">
      <MovementListSearchBar
        v-model="searchForm"
        :status-options="movementMaintenanceStatusOptions"
        :effective-session-options="effectiveSessionOptions"
        @search="handleSearch"
        @reset="handleReset"
      />

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
                    :disabled="!paginatedItems.length"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th v-for="col in tableColumns" :key="col.key">{{ t(col.labelKey) }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedItems.length">
                <td :colspan="tableColspan" class="empty-cell">{{ t('common.noData') }}</td>
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
                <td v-for="col in tableColumns" :key="col.key" :class="col.cellClass">
                  <span
                    v-if="col.cellType === 'status'"
                    class="status-badge"
                    :class="movementListStatusBadgeClass(item.status)"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                  <ImplementedYnBadge v-else-if="col.cellType === 'implemented'" :value="item.implemented" />
                  <template v-else>{{ getCellValue(item, col) }}</template>
                </td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openArchiveNumberModal(item)">
                      {{ t('movementMaintenance.editArchiveNumber') }}
                    </button>
                    <button type="button" class="link-btn" @click="openDetails(item)">{{ t('common.details') }}</button>
                    <button type="button" class="link-btn" @click="openPdfPreview(item)">
                      {{ t('movementExport.exportPdf') }}
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

    <MovementApplicationDetailDrawer
      :visible="!!detailItem"
      :queue-item="detailItem"
      mode="readonly"
      :current-role="currentRole"
      :mask-sensitive-fields="true"
      @close="closeDetails"
    />

    <MovementDetailPdfPreviewModal
      :visible="!!pdfPreviewItem"
      :queue-item="pdfPreviewItem"
      :mask-sensitive-fields="true"
      @close="closePdfPreview"
    />

    <MovementArchiveNumberModal
      :visible="!!archiveNumberItem"
      :row="archiveNumberItem"
      @close="closeArchiveNumberModal"
      @saved="closeArchiveNumberModal"
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
  min-width: 340px;
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
