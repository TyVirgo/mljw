<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ProgrammeTransferFormModal from '../../components/studentRecords/ProgrammeTransferFormModal.vue'
import ProgrammeTransferDetailModal from '../../components/studentRecords/ProgrammeTransferDetailModal.vue'
import ApprovalLogModal from '../../components/studentRecords/ApprovalLogModal.vue'
import {
  normalizeTransfer,
  createTransferId,
  saveDraftApplication,
  submitApplication,
  cancelApplication,
  resubmitApplication,
  expireApplication,
  formatTransferListDate,
  canEditTransfer,
  canDeleteTransfer,
  canCancelTransfer,
  isArchivedTransfer,
  statusBadgeClass,
} from '../../data/programmeTransfers.js'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { programmeTransfers as transfers } from '../../data/movementStore.js'

const { t, tr } = useAppI18n()

const searchKeyword = ref('')
const appliedKeyword = ref('')
const listTab = ref('active')

const currentPage = ref(1)
const pageSize = ref(10)

const formVisible = ref(false)
const formMode = ref('create')
const editingItem = ref(null)

const detailVisible = ref(false)
const detailItem = ref(null)

const logVisible = ref(false)
const logItem = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const confirmAction = ref(null)

function matchKeyword(item, keyword) {
  if (!keyword) return true
  const q = keyword.trim().toLowerCase()
  return (
    String(item.studentId || '').toLowerCase().includes(q) ||
    String(item.fullName || item.name || '').toLowerCase().includes(q)
  )
}

const filteredTransfers = computed(() => {
  return transfers.value.filter((item) => {
    const tabMatch = listTab.value === 'archived' ? isArchivedTransfer(item) : !isArchivedTransfer(item)
    return tabMatch && matchKeyword(item, appliedKeyword.value)
  })
})

const totalCount = computed(() => filteredTransfers.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedTransfers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTransfers.value.slice(start, start + pageSize.value)
})

function statusLabel(status) {
  const map = {
    Draft: t('programmeTransfer.status.draft'),
    'In Progress': t('programmeTransfer.status.inProgress'),
    'Update Required': t('programmeTransfer.status.updateRequired'),
    Approved: t('programmeTransfer.status.approved'),
    Rejected: t('programmeTransfer.status.rejected'),
    Cancelled: t('programmeTransfer.status.cancelled'),
    Expired: t('programmeTransfer.status.expired'),
  }
  return map[status] || status
}

function handleSearch() {
  appliedKeyword.value = searchKeyword.value
  currentPage.value = 1
}

function handleReset() {
  searchKeyword.value = ''
  appliedKeyword.value = ''
  currentPage.value = 1
}

function openCreate() {
  formMode.value = 'create'
  editingItem.value = null
  formVisible.value = true
}

function openEdit(item) {
  formMode.value = 'edit'
  editingItem.value = { ...item }
  formVisible.value = true
  detailVisible.value = false
}

function openDetail(item) {
  detailItem.value = { ...item }
  detailVisible.value = true
}

function openLog(item) {
  logItem.value = item
  logVisible.value = true
}

function logSubtitle(item) {
  if (!item) return ''
  const name = item.fullName || item.name || ''
  return [item.applicationId, item.studentId, name].filter(Boolean).join(' · ')
}

function closeForm() {
  formVisible.value = false
  editingItem.value = null
}

function upsertTransfer(record) {
  const normalized = normalizeTransfer(record)
  const index = transfers.value.findIndex((item) => item.id === normalized.id)
  if (index === -1) transfers.value.push(normalized)
  else transfers.value[index] = normalized
  return normalized
}

function handleSaveDraft(payload) {
  if (formMode.value === 'edit' && editingItem.value) {
    upsertTransfer(saveDraftApplication({ ...payload, id: editingItem.value.id, applicationId: editingItem.value.applicationId }))
  } else {
    upsertTransfer(saveDraftApplication({ ...payload, id: createTransferId() }))
  }
  closeForm()
}

function handleSubmit(payload) {
  let record
  if (formMode.value === 'edit' && editingItem.value) {
    record = saveDraftApplication({ ...payload, id: editingItem.value.id, applicationId: editingItem.value.applicationId })
  } else {
    record = saveDraftApplication({ ...payload, id: createTransferId() })
  }
  upsertTransfer(submitApplication(record))
  closeForm()
}

function handleResubmit(payload) {
  if (!editingItem.value) return
  const draft = saveDraftApplication({
    ...payload,
    id: editingItem.value.id,
    applicationId: editingItem.value.applicationId,
    status: editingItem.value.status,
    approvalLog: editingItem.value.approvalLog,
  })
  upsertTransfer(resubmitApplication(draft))
  closeForm()
}

function requestDelete(item) {
  confirmMessage.value = t('programmeTransfer.deleteOne')
  confirmAction.value = () => {
    transfers.value = transfers.value.filter((row) => row.id !== item.id)
    if (detailItem.value?.id === item.id) {
      detailVisible.value = false
      detailItem.value = null
    }
  }
  confirmVisible.value = true
}

function requestCancel(item) {
  confirmMessage.value = t('programmeTransfer.cancelOne')
  confirmAction.value = () => {
    upsertTransfer(cancelApplication(item))
    if (detailItem.value?.id === item.id) detailItem.value = { ...transfers.value.find((r) => r.id === item.id) }
  }
  confirmVisible.value = true
}

function requestExpire(item) {
  confirmMessage.value = t('programmeTransfer.expireOne')
  confirmAction.value = () => {
    upsertTransfer(expireApplication(item))
  }
  confirmVisible.value = true
}

function confirmDialog() {
  confirmAction.value?.()
  confirmAction.value = null
  confirmVisible.value = false
}

function displayDate(item) {
  return formatTransferListDate(item.submittedAt || item.applicationDate)
}

function canSimulateExpire(item) {
  return item.status === 'Draft' || item.status === 'Update Required'
}
</script>

<template>
  <div class="programme-transfer-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('programmeTransfer.searchFieldLabel') }}</label>
              <input
                v-model="searchKeyword"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {{ t('common.reset') }}
            </button>
          </div>
        </div>
      </div>

      <div class="filter-tabs">
        <button
          type="button"
          :class="['tab-btn', { active: listTab === 'active' }]"
          @click="listTab = 'active'; currentPage = 1"
        >
          {{ t('programmeTransfer.tabActive') }}
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: listTab === 'archived' }]"
          @click="listTab = 'archived'; currentPage = 1"
        >
          {{ t('programmeTransfer.tabArchived') }}
        </button>
      </div>

      <div class="history-header">
        <h2>{{ t('programmeTransfer.historyTitle') }}</h2>
        <button type="button" class="btn btn-primary" @click="openCreate">
          + {{ t('programmeTransfer.newApplication') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('programmeTransfer.columns.applicationId') }}</th>
                <th>{{ t('programmeTransfer.columns.studentId') }}</th>
                <th>{{ t('programmeTransfer.columns.name') }}</th>
                <th>{{ t('programmeTransfer.columns.type') }}</th>
                <th>{{ t('programmeTransfer.columns.oldProgramme') }}</th>
                <th>{{ t('programmeTransfer.columns.newProgramme') }}</th>
                <th>{{ t('programmeTransfer.columns.status') }}</th>
                <th>{{ t('programmeTransfer.columns.date') }}</th>
                <th class="col-actions">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedTransfers.length">
                <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="item in paginatedTransfers" :key="item.id">
                <td>{{ item.applicationId }}</td>
                <td>{{ item.studentId }}</td>
                <td>{{ item.fullName || item.name }}</td>
                <td>{{ t('programmeTransfer.typeLabel') }}</td>
                <td>{{ item.oldProgramme || item.currentProgramme }}</td>
                <td>{{ item.newProgramme }}</td>
                <td>
                  <span :class="['status-badge', statusBadgeClass(item.status)]">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td>{{ displayDate(item) }}</td>
                <td class="actions-cell">
                  <button type="button" class="link-btn" @click="openDetail(item)">
                    {{ t('programmeTransfer.actions.details') }}
                  </button>
                  <button v-if="canEditTransfer(item)" type="button" class="link-btn" @click="openEdit(item)">
                    {{ t('common.edit') }}
                  </button>
                  <button v-if="canDeleteTransfer(item)" type="button" class="link-btn delete" @click="requestDelete(item)">
                    {{ t('common.delete') }}
                  </button>
                  <button v-if="canCancelTransfer(item)" type="button" class="link-btn" @click="requestCancel(item)">
                    {{ t('programmeTransfer.actions.cancelApplication') }}
                  </button>
                  <button v-if="canSimulateExpire(item)" type="button" class="link-btn" @click="requestExpire(item)">
                    {{ t('programmeTransfer.actions.simulateExpire') }}
                  </button>
                  <button type="button" class="link-btn" @click="openLog(item)">
                    {{ t('common.workflowLog') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          :total="totalCount"
          v-model="currentPage"
          v-model:page-size="pageSize"
        />
      </div>
    </div>

    <ProgrammeTransferFormModal
      :visible="formVisible"
      :mode="formMode"
      :initial-data="editingItem"
      :existing-transfers="transfers"
      @close="closeForm"
      @save-draft="handleSaveDraft"
      @submit="handleSubmit"
      @resubmit="handleResubmit"
    />

    <ProgrammeTransferDetailModal
      :visible="detailVisible"
      :item="detailItem"
      @close="detailVisible = false"
    />

    <ApprovalLogModal
      :visible="logVisible"
      :logs="logItem?.approvalLog || []"
      :subtitle="logSubtitle(logItem)"
      @close="logVisible = false"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :message="confirmMessage"
      @confirm="confirmDialog"
      @cancel="confirmVisible = false"
    />
  </div>
</template>

<style scoped>
.programme-transfer-page {
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
  overflow: hidden;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  color: #374151;
}

.tab-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.empty-cell {
  text-align: center;
  color: #6b7280;
  padding: 32px;
}

.col-actions {
  min-width: 220px;
}

.actions-cell {
  white-space: nowrap;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  padding: 0 6px 0 0;
}

.link-btn.delete {
  color: #dc2626;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-draft {
  background: #f3f4f6;
  color: #4b5563;
}

.status-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-update-required {
  background: #ffedd5;
  color: #c2410c;
}

.status-approved {
  background: #dcfce7;
  color: #15803d;
}

.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.status-cancelled {
  background: #e5e7eb;
  color: #374151;
}

.status-expired {
  background: #f3e8ff;
  color: #7e22ce;
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
  border: 1px solid transparent;
}

.btn svg {
  width: 14px;
  height: 14px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
