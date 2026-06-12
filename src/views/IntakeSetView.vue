<script setup>
import { ref, computed } from 'vue'
import IntakeSetFormModal from '../components/intake/IntakeSetFormModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import {
  initialIntakeSets,
  intakeOptions,
  createIntakeSetId,
} from '../data/intakeSets.js'
import { exportIntakeSetsToExcel, intakeSetExportFields } from '../utils/exportIntakeSetExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'
import { useColumnHeaderConfig } from '../composables/useColumnHeaderConfig.js'
import ColumnHeaderConfigModal from '../components/common/ColumnHeaderConfigModal.vue'
import {
  intakeSetColumnHeaderStore,
  intakeSetColumnHeaderSections,
  defaultIntakeSetColumnHeaders,
} from '../data/intakeSetColumnHeaders.js'

const { t, tr, translatedExportFields } = useListPageI18n(intakeSetExportFields)
const { headerLabel, getEditableRows, save: saveColumnHeaders } = useColumnHeaderConfig(intakeSetColumnHeaderStore)

const intakeSets = ref(initialIntakeSets.map((item) => ({ ...item })))

const searchIntake = ref('')
const appliedIntake = ref('')

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const modalVisible = ref(false)
const modalMode = ref('create')
const editingItem = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const exportModalVisible = ref(false)
const columnHeaderModalVisible = ref(false)
const columnHeaderModalRows = ref([])

const filteredIntakeSets = computed(() => {
  if (!appliedIntake.value) return intakeSets.value
  return intakeSets.value.filter((item) => item.intake === appliedIntake.value)
})

const totalCount = computed(() => filteredIntakeSets.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedIntakeSets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredIntakeSets.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedIntakeSets.value.length) return false
  return paginatedIntakeSets.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

function handleSearch() {
  appliedIntake.value = searchIntake.value
  currentPage.value = 1
  selectedIds.value = []
}

function handleReset() {
  searchIntake.value = ''
  appliedIntake.value = ''
  currentPage.value = 1
  selectedIds.value = []
}

function toggleSelectAll(event) {
  const pageIds = paginatedIntakeSets.value.map((item) => item.id)
  if (event.target.checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingItem.value = null
  modalVisible.value = true
}

function openEditModal(item) {
  modalMode.value = 'edit'
  editingItem.value = { ...item }
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingItem.value = null
}

function handleSave(formData) {
  if (modalMode.value === 'edit' && editingItem.value) {
    const index = intakeSets.value.findIndex((item) => item.id === editingItem.value.id)
    if (index !== -1) {
      intakeSets.value[index] = { ...intakeSets.value[index], ...formData }
    }
  } else {
    intakeSets.value.push({
      id: createIntakeSetId(),
      ...formData,
    })
  }
  closeModal()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('pages.intake.deleteOne')
      : t('pages.intake.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function confirmDelete() {
  intakeSets.value = intakeSets.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function cancelDelete() {
  pendingDeleteIds.value = []
  confirmVisible.value = false
}

function openExportModal() {
  if (!filteredIntakeSets.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedIntakeSets.value
  } else if (exportScope === 'allResults') {
    data = filteredIntakeSets.value
  } else {
    data = filteredIntakeSets.value.filter((item) => selectedIds.value.includes(item.id))
  }

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportIntakeSetsToExcel(data, `intake-set-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function openColumnHeaderModal() {
  columnHeaderModalRows.value = getEditableRows()
  columnHeaderModalVisible.value = true
}

function handleColumnHeaderSave(rows) {
  saveColumnHeaders(rows)
  columnHeaderModalVisible.value = false
  window.alert(t('pages.intakeSet.columnHeaderSaveSuccess'))
}
</script>

<template>
  <div class="intake-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Intake :') }}</label>
              <select v-model="searchIntake" class="search-select" :class="{ 'is-empty': !searchIntake }">
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in intakeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
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

      <div class="toolbar">
        <div class="toolbar-left">
          <button type="button" class="btn btn-primary" @click="openCreateModal">{{ t('common.create') }}</button>
          <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">
            {{ t('common.delete') }}
          </button>
          <button type="button" class="btn btn-default" @click="openExportModal">{{ t('common.export') }}</button>
        </div>
        <button type="button" class="btn btn-outline toolbar-config-btn" @click="openColumnHeaderModal">
          {{ t('pages.intakeSet.columnHeaderConfig') }}
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
                <th>{{ headerLabel('code') }}</th>
                <th>{{ headerLabel('intake') }}</th>
                <th>{{ headerLabel('active') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedIntakeSets.length">
                <td colspan="6" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedIntakeSets" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td>{{ getRowNumber(index) }}</td>
                <td>{{ item.code }}</td>
                <td>{{ item.intake }}</td>
                <td>{{ tr(item.active) }}</td>
                <td class="actions-cell">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEditModal(item)">{{ t('common.edit') }}</button>
                    <button type="button" class="link-btn delete" @click="requestDelete([item.id])">{{ t('common.delete') }}</button>
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

    <IntakeSetFormModal
      :visible="modalVisible"
      :mode="modalMode"
      :initial-data="editingItem"
      :all-items="intakeSets"
      @close="closeModal"
      @save="handleSave"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="confirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="translatedExportFields"
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />

    <ColumnHeaderConfigModal
      :visible="columnHeaderModalVisible"
      :rows="columnHeaderModalRows"
      :sections="intakeSetColumnHeaderSections"
      :default-rows="defaultIntakeSetColumnHeaders"
      title-key="pages.common.columnHeaderConfigTitle"
      hint-key="pages.common.columnHeaderConfigHint"
      @close="columnHeaderModalVisible = false"
      @save="handleColumnHeaderSave"
    />
  </div>
</template>

<style scoped>
.intake-page {
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
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-config-btn {
  flex-shrink: 0;
  margin-left: auto;
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
}

.btn svg {
  width: 14px;
  height: 14px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-default:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-outline:hover {
  background: #eff6ff;
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
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
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

.data-table tbody tr:hover {
  background: #fafafa;
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
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0;
}

.link-btn.delete {
  color: #ef4444;
}
</style>
