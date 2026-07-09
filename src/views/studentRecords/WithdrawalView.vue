<script setup>

import { ref, computed } from 'vue'

import ConfirmDialog from '../../components/common/ConfirmDialog.vue'

import TablePagination from '../../components/common/TablePagination.vue'

import WithdrawalFormModal from '../../components/studentRecords/WithdrawalFormModal.vue'

import MovementApplicationDetailDrawer from '../../components/studentRecords/MovementApplicationDetailDrawer.vue'

import MovementApplicationSearchBar from '../../components/studentRecords/MovementApplicationSearchBar.vue'
import MovementStudentCancelAction from '../../components/studentRecords/MovementStudentCancelAction.vue'

import {

  normalizeWithdrawal,

  createWithdrawalId,

  saveDraftApplication,

  submitApplication,

  cancelApplication,

  resubmitApplication,

  formatWithdrawalListDate,

  canEditWithdrawal,

  canDeleteWithdrawal,

  canCancelWithdrawal,

  statusBadgeClass,

  getWithdrawalReasonDisplay,

} from '../../data/withdrawals.js'

import {
  createEmptyApplicationSearch,
  filterMovementApplications,
  getApplicationStatusOptions,
} from '../../data/movementApplicationSearch.js'

import { useAppI18n } from '../../composables/useAppI18n.js'

import { withdrawals } from '../../data/movementStore.js'
import { filterByCurrentStudent } from '../../data/mockCurrentStudent.js'

const props = defineProps({
  applicantMode: {
    type: String,
    default: 'teacher',
    validator: (value) => ['teacher', 'student'].includes(value),
  },
})

const { t } = useAppI18n()

const SOURCE_KEY = 'withdrawal'
const statusOptions = getApplicationStatusOptions(SOURCE_KEY)

const searchForm = ref(createEmptyApplicationSearch())

const appliedSearch = ref(createEmptyApplicationSearch())

const showStudentColumns = computed(() => props.applicantMode === 'teacher')
const tableColspan = computed(() => (showStudentColumns.value ? 9 : 7))

const currentPage = ref(1)

const pageSize = ref(10)



const formVisible = ref(false)

const formMode = ref('create')

const editingItem = ref(null)



const drawerVisible = ref(false)

const detailItem = ref(null)



const confirmVisible = ref(false)

const confirmMessage = ref('')

const confirmAction = ref(null)

const filteredWithdrawals = computed(() => {
  let list = filterMovementApplications(SOURCE_KEY, withdrawals.value, appliedSearch.value)
  if (props.applicantMode === 'student') {
    list = filterByCurrentStudent(list)
  }
  return list
})

const totalCount = computed(() => filteredWithdrawals.value.length)

const paginatedWithdrawals = computed(() => {

  const start = (currentPage.value - 1) * pageSize.value

  return filteredWithdrawals.value.slice(start, start + pageSize.value)

})



function statusLabel(status) {

  const map = {

    Draft: t('withdrawal.status.draft'),

    'In Progress': t('withdrawal.status.inProgress'),

    'Update Required': t('withdrawal.status.updateRequired'),

    Approved: t('withdrawal.status.approved'),

    Rejected: t('withdrawal.status.rejected'),

    Cancelled: t('withdrawal.status.cancelled'),

  }

  return map[status] || status

}



function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = createEmptyApplicationSearch()
  appliedSearch.value = createEmptyApplicationSearch()
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

  drawerVisible.value = false

}



function openDetail(item) {

  detailItem.value = { ...item }

  drawerVisible.value = true

}



function closeDrawer() {

  drawerVisible.value = false

}



function closeForm() {

  formVisible.value = false

  editingItem.value = null

}



function upsertWithdrawal(record) {

  const normalized = normalizeWithdrawal(record)

  const index = withdrawals.value.findIndex((item) => item.id === normalized.id)

  if (index === -1) withdrawals.value.push(normalized)

  else withdrawals.value[index] = normalized

  return normalized

}



function handleSaveDraft(payload) {

  if (formMode.value === 'edit' && editingItem.value) {

    upsertWithdrawal(

      saveDraftApplication({

        ...payload,

        id: editingItem.value.id,

        applicationId: editingItem.value.applicationId,

        approvalLog: editingItem.value.approvalLog,

      }),

    )

  } else {

    upsertWithdrawal(saveDraftApplication({ ...payload, id: createWithdrawalId() }))

  }

  closeForm()

}



function handleSubmit(payload) {

  let record

  if (formMode.value === 'edit' && editingItem.value) {

    record = saveDraftApplication({

      ...payload,

      id: editingItem.value.id,

      applicationId: editingItem.value.applicationId,

      approvalLog: editingItem.value.approvalLog,

    })

  } else {

    record = saveDraftApplication({ ...payload, id: createWithdrawalId() })

  }

  upsertWithdrawal(submitApplication(record))

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

  upsertWithdrawal(resubmitApplication(draft))

  closeForm()

}



function requestDelete(item) {

  confirmMessage.value = t('withdrawal.deleteOne')

  confirmAction.value = () => {

    withdrawals.value = withdrawals.value.filter((row) => row.id !== item.id)

    if (detailItem.value?.id === item.id) {

      drawerVisible.value = false

      detailItem.value = null

    }

  }

  confirmVisible.value = true

}



function requestCancel(item) {

  confirmMessage.value = t('movementStudentCancel.confirmMessage')

  confirmAction.value = () => {

    upsertWithdrawal(cancelApplication(item))

    if (detailItem.value?.id === item.id) {

      detailItem.value = { ...withdrawals.value.find((r) => r.id === item.id) }

    }

  }

  confirmVisible.value = true

}



function confirmDialog() {

  confirmAction.value?.()

  confirmAction.value = null

  confirmVisible.value = false

}



function displayDate(item) {

  return formatWithdrawalListDate(item.submittedAt || item.applicationDate || item.dateOfApplication)

}

</script>



<template>

  <div class="withdrawal-page">

    <div class="page-card">

      <MovementApplicationSearchBar
        v-model="searchForm"
        :applicant-mode="applicantMode"
        :status-options="statusOptions"
        :status-label-fn="statusLabel"
        keyword-label-key="withdrawal.searchFieldLabel"
        @search="handleSearch"
        @reset="handleReset"
      />

      <div class="history-header">

        <h2>{{ t('withdrawal.historyTitle') }}</h2>

        <button type="button" class="btn btn-primary" @click="openCreate">

          + {{ t('withdrawal.newWithdrawal') }}

        </button>

      </div>



      <div class="table-section">

        <div class="table-wrap">

          <table class="data-table">

            <thead>

              <tr>

                <th>{{ t('withdrawal.columns.applicationId') }}</th>

                <th v-if="showStudentColumns">{{ t('withdrawal.columns.studentId') }}</th>

                <th v-if="showStudentColumns">{{ t('withdrawal.columns.name') }}</th>

                <th>{{ t('withdrawal.columns.programme') }}</th>

                <th>{{ t('withdrawal.columns.intake') }}</th>

                <th>{{ t('withdrawal.columns.reason') }}</th>

                <th>{{ t('withdrawal.columns.status') }}</th>

                <th>{{ t('withdrawal.columns.date') }}</th>

                <th class="col-actions">{{ t('common.actions') }}</th>

              </tr>

            </thead>

            <tbody>

              <tr v-if="!paginatedWithdrawals.length">

                <td :colspan="tableColspan" class="empty-cell">{{ t('common.noData') }}</td>

              </tr>

              <tr v-for="item in paginatedWithdrawals" :key="item.id">

                <td>{{ item.applicationId }}</td>

                <td v-if="showStudentColumns">{{ item.studentId }}</td>

                <td v-if="showStudentColumns">{{ item.fullName || item.name }}</td>

                <td>{{ item.programme }}</td>

                <td>{{ item.intake }}</td>

                <td>{{ getWithdrawalReasonDisplay(item, t) }}</td>

                <td>

                  <span :class="['status-badge', statusBadgeClass(item.status)]">

                    {{ statusLabel(item.status) }}

                  </span>

                </td>

                <td>{{ displayDate(item) }}</td>

                <td class="actions-cell">

                  <button type="button" class="link-btn" @click="openDetail(item)">

                    {{ t('withdrawal.actions.details') }}

                  </button>

                  <button v-if="canEditWithdrawal(item)" type="button" class="link-btn" @click="openEdit(item)">

                    {{ t('common.edit') }}

                  </button>

                  <button v-if="canDeleteWithdrawal(item)" type="button" class="link-btn delete" @click="requestDelete(item)">

                    {{ t('common.delete') }}

                  </button>

                  <MovementStudentCancelAction
                    v-if="applicantMode === 'student' && canCancelWithdrawal(item)"
                    @cancel="requestCancel(item)"
                  />

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



    <WithdrawalFormModal

      :visible="formVisible"

      :mode="formMode"

      :initial-data="editingItem"

      :existing-withdrawals="withdrawals"
      :applicant-mode="applicantMode"
      @close="closeForm"

      @save-draft="handleSaveDraft"

      @submit="handleSubmit"

      @resubmit="handleResubmit"

    />



    <MovementApplicationDetailDrawer
      :visible="drawerVisible"
      source-key="withdrawal"
      :item="detailItem"
      mode="student"
      :enable-export-pdf="applicantMode === 'teacher'"
      @close="closeDrawer"
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

.withdrawal-page {

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

  min-width: 120px;

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

  padding: 0;

  margin-right: 8px;

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

  color: #6b7280;

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


