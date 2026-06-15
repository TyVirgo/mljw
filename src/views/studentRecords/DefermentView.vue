<script setup>

import { ref, computed, watch } from 'vue'

import ConfirmDialog from '../../components/common/ConfirmDialog.vue'

import TablePagination from '../../components/common/TablePagination.vue'

import DefermentFormModal from '../../components/studentRecords/DefermentFormModal.vue'

import DefermentDetailModal from '../../components/studentRecords/DefermentDetailModal.vue'

import ApprovalLogModal from '../../components/studentRecords/ApprovalLogModal.vue'

import {
  normalizeDeferment,
  createDefermentId,

  saveDraftApplication,

  submitApplication,

  cancelApplication,

  resubmitApplication,

  formatDefermentListDate,

  canEditDeferment,

  canDeleteDeferment,

  canCancelDeferment,

  statusBadgeClass,

  getMainReasonLabel,

} from '../../data/deferments.js'

import { useAppI18n } from '../../composables/useAppI18n.js'
import { deferments } from '../../data/movementStore.js'



const { t } = useAppI18n()



const searchKeyword = ref('')

const appliedKeyword = ref('')



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



const filteredDeferments = computed(() =>

  deferments.value.filter((item) => matchKeyword(item, appliedKeyword.value)),

)



const totalCount = computed(() => filteredDeferments.value.length)



const paginatedDeferments = computed(() => {

  const start = (currentPage.value - 1) * pageSize.value

  return filteredDeferments.value.slice(start, start + pageSize.value)

})



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



function upsertDeferment(record) {

  const normalized = normalizeDeferment(record)

  const index = deferments.value.findIndex((item) => item.id === normalized.id)

  if (index === -1) deferments.value.push(normalized)

  else deferments.value[index] = normalized

  return normalized

}



function handleSaveDraft(payload) {

  if (formMode.value === 'edit' && editingItem.value) {

    upsertDeferment(

      saveDraftApplication({

        ...payload,

        id: editingItem.value.id,

        applicationId: editingItem.value.applicationId,

        approvalLog: editingItem.value.approvalLog,

      }),

    )

  } else {

    upsertDeferment(saveDraftApplication({ ...payload, id: createDefermentId() }))

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

    record = saveDraftApplication({ ...payload, id: createDefermentId() })

  }

  upsertDeferment(submitApplication(record))

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

  upsertDeferment(resubmitApplication(draft))

  closeForm()

}



function requestDelete(item) {

  confirmMessage.value = t('deferment.deleteOne')

  confirmAction.value = () => {

    deferments.value = deferments.value.filter((row) => row.id !== item.id)

    if (detailItem.value?.id === item.id) {

      detailVisible.value = false

      detailItem.value = null

    }

  }

  confirmVisible.value = true

}



function requestCancel(item) {

  confirmMessage.value = t('deferment.cancelOne')

  confirmAction.value = () => {

    upsertDeferment(cancelApplication(item))

    if (detailItem.value?.id === item.id) {

      detailItem.value = { ...deferments.value.find((r) => r.id === item.id) }

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

  return formatDefermentListDate(item.submittedAt || item.applicationDate || item.dateOfApplication)

}

</script>



<template>

  <div class="deferment-page">

    <div class="page-card">

      <div class="search-bar">

        <div class="search-row">

          <div class="search-fields">

            <div class="search-item">

              <label>{{ t('deferment.searchFieldLabel') }}</label>

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



      <div class="history-header">

        <h2>{{ t('deferment.historyTitle') }}</h2>

        <button type="button" class="btn btn-primary" @click="openCreate">

          + {{ t('deferment.newDeferment') }}

        </button>

      </div>



      <div class="table-section">

        <div class="table-wrap">

          <table class="data-table">

            <thead>

              <tr>

                <th>{{ t('deferment.columns.applicationId') }}</th>

                <th>{{ t('deferment.columns.studentId') }}</th>

                <th>{{ t('deferment.columns.name') }}</th>

                <th>{{ t('deferment.columns.intake') }}</th>

                <th>{{ t('deferment.columns.programme') }}</th>

                <th>{{ t('deferment.columns.defermentPeriod') }}</th>

                <th>{{ t('deferment.columns.reason') }}</th>

                <th>{{ t('deferment.columns.status') }}</th>

                <th>{{ t('deferment.columns.date') }}</th>

                <th class="col-actions">{{ t('common.actions') }}</th>

              </tr>

            </thead>

            <tbody>

              <tr v-if="!paginatedDeferments.length">

                <td colspan="10" class="empty-cell">{{ t('common.noData') }}</td>

              </tr>

              <tr v-for="item in paginatedDeferments" :key="item.id">

                <td>{{ item.applicationId }}</td>

                <td>{{ item.studentId }}</td>

                <td>{{ item.fullName || item.name }}</td>

                <td>{{ item.intake }}</td>

                <td>{{ item.programme }}</td>

                <td>{{ item.defermentPeriod }}</td>

                <td>{{ getMainReasonLabel(item.mainReason || item.reason, t) }}</td>

                <td>

                  <span :class="['status-badge', statusBadgeClass(item.status)]">

                    {{ statusLabel(item.status) }}

                  </span>

                </td>

                <td>{{ displayDate(item) }}</td>

                <td class="actions-cell">

                  <button type="button" class="link-btn" @click="openDetail(item)">

                    {{ t('deferment.actions.details') }}

                  </button>

                  <button v-if="canEditDeferment(item)" type="button" class="link-btn" @click="openEdit(item)">

                    {{ t('common.edit') }}

                  </button>

                  <button v-if="canDeleteDeferment(item)" type="button" class="link-btn delete" @click="requestDelete(item)">

                    {{ t('common.delete') }}

                  </button>

                  <button v-if="canCancelDeferment(item)" type="button" class="link-btn" @click="requestCancel(item)">

                    {{ t('deferment.actions.cancelApplication') }}

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



    <DefermentFormModal

      :visible="formVisible"

      :mode="formMode"

      :initial-data="editingItem"

      :existing-deferments="deferments"

      @close="closeForm"

      @save-draft="handleSaveDraft"

      @submit="handleSubmit"

      @resubmit="handleResubmit"

    />



    <DefermentDetailModal

      :visible="detailVisible"

      :item="detailItem"

      @close="detailVisible = false"

      @edit="openEdit"

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

.deferment-page {

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


