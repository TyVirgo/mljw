<script setup>
import { ref, computed } from 'vue'
import { useAppI18n } from '../composables/useAppI18n.js'
import { translateExportFields } from '../i18n/index.js'
import DepartmentFormModal from '../components/department/DepartmentFormModal.vue'
import DepartmentDetailModal from '../components/department/DepartmentDetailModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import {
  initialDepartments,
  createDepartmentId,
  formatReportTo,
  getReportToOptions,
  yesNoOptions,
  normalizeDepartment,
} from '../data/departments.js'
import { exportDepartmentsToExcel, departmentExportFields } from '../utils/exportDepartmentExcel.js'

const { t, tr } = useAppI18n()
const translatedExportFields = computed(() => translateExportFields(departmentExportFields))

const departments = ref(initialDepartments.map((item) => normalizeDepartment({ ...item })))

const searchExpanded = ref(false)
const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const modalVisible = ref(false)
const modalMode = ref('create')
const editingItem = ref(null)

const detailVisible = ref(false)
const detailItem = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const exportModalVisible = ref(false)

const reportToFilterOptions = computed(() => getReportToOptions(departments.value))
const reportToFormOptions = computed(() => getReportToOptions(departments.value))

function createEmptySearch() {
  return {
    deptId: '',
    code: '',
    category: '',
    reportTo: 'all',
    offering: '',
    teaching: '',
    active: '',
  }
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value).toLowerCase().includes(keyword.trim().toLowerCase())
}

function matchSelect(value, selected) {
  if (!selected || selected === 'all') return true
  return value === selected
}

function matchReportTo(value, selected) {
  if (!selected || selected === 'all') return true
  if (selected === '--') return !value
  return value === selected
}

const filteredDepartments = computed(() => {
  const s = appliedSearch.value
  return departments.value.filter(
    (item) =>
      matchText(item.deptId, s.deptId) &&
      matchText(item.code, s.code) &&
      matchText(item.category, s.category) &&
      matchReportTo(item.reportTo, s.reportTo) &&
      matchSelect(item.offering, s.offering) &&
      matchSelect(item.teaching, s.teaching) &&
      matchSelect(item.active, s.active),
  )
})

const totalCount = computed(() => filteredDepartments.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDepartments.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedDepartments.value.length) return false
  return paginatedDepartments.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  selectedIds.value = []
}

function handleReset() {
  searchForm.value = createEmptySearch()
  appliedSearch.value = createEmptySearch()
  currentPage.value = 1
  selectedIds.value = []
}

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value
}

function toggleSelectAll(event) {
  const pageIds = paginatedDepartments.value.map((item) => item.id)
  if (event.target.checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  const index = selectedIds.value.indexOf(id)
  if (index === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(index, 1)
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
  detailVisible.value = false
}

function openDetailModal(item) {
  detailItem.value = { ...item }
  detailVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingItem.value = null
}

function handleSave(formData) {
  if (modalMode.value === 'edit' && editingItem.value) {
    const duplicate = departments.value.some(
      (item) =>
        item.id !== editingItem.value.id &&
        (item.deptId.toLowerCase() === formData.deptId.toLowerCase() ||
          item.code.toLowerCase() === formData.code.toLowerCase()),
    )
    if (duplicate) {
      window.alert(tr('ID or Code already exists.'))
      return
    }
    const index = departments.value.findIndex((item) => item.id === editingItem.value.id)
    if (index !== -1) {
      departments.value[index] = normalizeDepartment({ ...departments.value[index], ...formData })
      if (detailItem.value?.id === editingItem.value.id) {
        detailItem.value = { ...departments.value[index] }
      }
    }
  } else {
    const duplicate = departments.value.some(
      (item) =>
        item.deptId.toLowerCase() === formData.deptId.toLowerCase() ||
        item.code.toLowerCase() === formData.code.toLowerCase(),
    )
    if (duplicate) {
      window.alert(tr('ID or Code already exists.'))
      return
    }
    departments.value.push(normalizeDepartment({ id: createDepartmentId(), ...formData }))
  }
  closeModal()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('pages.department.deleteOne')
      : t('pages.department.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function confirmDelete() {
  departments.value = departments.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  if (detailItem.value && pendingDeleteIds.value.includes(detailItem.value.id)) {
    detailVisible.value = false
    detailItem.value = null
  }
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function openExportModal() {
  if (!filteredDepartments.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') data = paginatedDepartments.value
  else if (exportScope === 'allResults') data = filteredDepartments.value
  else data = filteredDepartments.value.filter((item) => selectedIds.value.includes(item.id))

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  const timestamp = new Date().toISOString().slice(0, 10)
  exportDepartmentsToExcel(data, `department-info-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}
</script>

<template>
  <div class="department-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('ID:') }}</label>
              <input v-model="searchForm.deptId" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>{{ tr('Code:') }}</label>
              <input v-model="searchForm.code" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>{{ tr('Category:') }}</label>
              <input v-model="searchForm.category" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>{{ tr('Report to:') }}</label>
              <select v-model="searchForm.reportTo">
                <option value="all">{{ t('common.allLower') }}</option>
                <option value="--">--</option>
                <option v-for="opt in reportToFilterOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              {{ t('common.reset') }}
            </button>
            <button type="button" class="toggle-link" @click="toggleSearchExpanded">
              {{ searchExpanded ? t('common.collapse') : t('common.more') }}
              <svg :class="{ up: searchExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          </div>
        </div>

        <div v-if="searchExpanded" class="search-row search-row-secondary">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Offering:') }}</label>
              <select v-model="searchForm.offering">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in yesNoOptions" :key="`o-${opt}`" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ tr('Teaching:') }}</label>
              <select v-model="searchForm.teaching">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in yesNoOptions" :key="`t-${opt}`" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ tr('Active:') }}</label>
              <select v-model="searchForm.active">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in yesNoOptions" :key="`a-${opt}`" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreateModal">{{ t('common.create') }}</button>
        <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">{{ t('common.delete') }}</button>
        <button type="button" class="btn btn-default" @click="openExportModal">{{ t('common.export') }}</button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                <th>{{ t('common.serialNo') }}</th>
                <th>ID</th>
                <th>{{ tr('Code') }}</th>
                <th>{{ tr('Department Name') }}</th>
                <th>{{ tr('Department Name (Chinese)') }}</th>
                <th>{{ tr('Category') }}</th>
                <th>{{ tr('Report to') }}</th>
                <th>{{ tr('Offering') }}</th>
                <th>{{ tr('Teaching') }}</th>
                <th>{{ tr('Active') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedDepartments.length">
                <td colspan="12" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedDepartments" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td>{{ getRowNumber(index) }}</td>
                <td>{{ item.deptId }}</td>
                <td>{{ item.code }}</td>
                <td>{{ tr(item.nameEn) }}</td>
                <td>{{ item.nameZh }}</td>
                <td>{{ tr(item.category) }}</td>
                <td>{{ formatReportTo(item.reportTo) }}</td>
                <td>{{ tr(item.offering) }}</td>
                <td>{{ tr(item.teaching) }}</td>
                <td>{{ tr(item.active) }}</td>
                <td class="actions-cell">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEditModal(item)">{{ t('common.edit') }}</button>
                    <button type="button" class="link-btn" @click="openDetailModal(item)">{{ tr('Details') }}</button>
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

    <DepartmentFormModal
      :visible="modalVisible"
      :mode="modalMode"
      :initial-data="editingItem"
      :report-to-options="reportToFormOptions"
      @close="closeModal"
      @save="handleSave"
    />

    <DepartmentDetailModal :visible="detailVisible" :data="detailItem" @close="detailVisible = false" />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="confirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="confirmVisible = false"
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
.department-page {
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
}

.data-table {
  width: 100%;
  min-width: 1100px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.data-table thead tr {
  height: 44px;
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
