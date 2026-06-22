<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import StudentProfileFormDrawer from '../../components/studentRecords/StudentProfileFormDrawer.vue'
import StudentProfileDetailDrawer from '../../components/studentRecords/StudentProfileDetailDrawer.vue'
import StudentProfileImportModal from '../../components/studentRecords/StudentProfileImportModal.vue'
import {
  studentCategoryOptions,
  normalizeStudent,
  studentRecords,
} from '../../data/students.js'
import {
  exportStudentProfilesToExcel,
  studentProfileExportFields,
} from '../../utils/exportStudentProfileExcel.js'
import { useListPageI18n } from '../../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(studentProfileExportFields)

const students = studentRecords

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const formDrawerVisible = ref(false)
const formMode = ref('create')
const editingItem = ref(null)

const detailVisible = ref(false)
const detailItem = ref(null)

const importModalVisible = ref(false)
const exportModalVisible = ref(false)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

function createEmptySearch() {
  return {
    studentId: '',
    name: '',
    studentType: '',
  }
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value).toLowerCase().includes(keyword.trim().toLowerCase())
}

function matchSelect(value, selected) {
  if (!selected) return true
  return value === selected
}

const filteredStudents = computed(() => {
  const s = appliedSearch.value
  return students.value.filter(
    (item) =>
      matchText(item.studentId, s.studentId) &&
      (matchText(item.name, s.name) || matchText(item.nameCn, s.name)) &&
      matchSelect(item.studentType, s.studentType),
  )
})

const totalCount = computed(() => filteredStudents.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedStudents.value.length) return false
  return paginatedStudents.value.every((item) => selectedIds.value.includes(item.id))
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

function toggleSelectAll(event) {
  const pageIds = paginatedStudents.value.map((item) => item.id)
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

function openCreateDrawer() {
  formMode.value = 'create'
  editingItem.value = null
  formDrawerVisible.value = true
}

function openEditDrawer(item) {
  formMode.value = 'edit'
  editingItem.value = { ...item }
  formDrawerVisible.value = true
  detailVisible.value = false
}

function closeFormDrawer() {
  formDrawerVisible.value = false
  editingItem.value = null
}

function handleSave(formData) {
  if (formMode.value === 'edit' && editingItem.value) {
    const index = students.value.findIndex((item) => item.id === editingItem.value.id)
    if (index !== -1) {
      students.value[index] = normalizeStudent({ ...formData, id: editingItem.value.id })
      if (detailItem.value?.id === editingItem.value.id) {
        detailItem.value = { ...students.value[index] }
      }
    }
  } else {
    students.value.push(normalizeStudent(formData))
  }
  closeFormDrawer()
}

function openDetailDrawer(item) {
  detailItem.value = { ...item }
  detailVisible.value = true
}

function handleDetailEdit(item) {
  detailVisible.value = false
  openEditDrawer(item)
}

function openImportModal() {
  importModalVisible.value = true
}

function handleImported(importedRows) {
  students.value.push(...importedRows.map((row) => normalizeStudent(row)))
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('studentProfile.deleteOne')
      : t('studentProfile.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function confirmDelete() {
  students.value = students.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
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
  if (!filteredStudents.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') data = paginatedStudents.value
  else if (exportScope === 'allResults') data = filteredStudents.value
  else data = filteredStudents.value.filter((item) => selectedIds.value.includes(item.id))

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  const timestamp = new Date().toISOString().slice(0, 10)
  exportStudentProfilesToExcel(data, `student-profile-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}

function handlePaginationChange() {
  // keep cross-page selection
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function formatStudentStatus(status) {
  const key = `studentProfile.status.${String(status).toLowerCase()}`
  const translated = t(key)
  return translated !== key ? translated : tr(status)
}
</script>

<template>
  <div class="student-profile-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Student ID:') }}</label>
              <input
                v-model="searchForm.studentId"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ tr('Name:') }}</label>
              <input
                v-model="searchForm.name"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ tr('Student Type:') }}</label>
              <select v-model="searchForm.studentType" :class="{ 'is-empty': !searchForm.studentType }">
                <option value="">{{ tr('All Categories') }}</option>
                <option v-for="opt in studentCategoryOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
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
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreateDrawer">+ {{ t('common.create') }}</button>
        <button type="button" class="btn btn-dark" :disabled="!hasSelection" @click="requestDelete(selectedIds)">{{ t('common.delete') }}</button>
        <button type="button" class="btn btn-default" @click="openImportModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          {{ t('common.import') }}
        </button>
        <button type="button" class="btn btn-default" @click="openExportModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {{ t('common.export') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                <th class="col-no">{{ t('common.serialNo') }}</th>
                <th>{{ tr('Student ID') }}</th>
                <th>{{ tr('Student Name') }}</th>
                <th>{{ tr('Chinese Name') }}</th>
                <th>{{ tr('Student Type') }}</th>
                <th>{{ tr('Gender') }}</th>
                <th>{{ tr('Programme Code') }}</th>
                <th>{{ tr('Programme') }}</th>
                <th>{{ tr('Intake') }}</th>
                <th>{{ tr('Student Status') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedStudents.length">
                <td colspan="12" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedStudents" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td class="col-no">{{ getRowNumber(index) }}</td>
                <td>{{ item.studentId }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.nameCn }}</td>
                <td>{{ tr(item.studentType) }}</td>
                <td>{{ tr(item.gender) }}</td>
                <td>{{ item.programmeCode }}</td>
                <td>{{ item.programme }}</td>
                <td>{{ item.intake }}</td>
                <td>{{ formatStudentStatus(item.studentStatus) }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openDetailDrawer(item)">{{ tr('Details') }}</button>
                    <button type="button" class="link-btn" @click="openEditDrawer(item)">{{ t('common.edit') }}</button>
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

    <StudentProfileFormDrawer
      :visible="formDrawerVisible"
      :mode="formMode"
      :initial-data="editingItem"
      :existing-students="students"
      @close="closeFormDrawer"
      @save="handleSave"
    />

    <StudentProfileDetailDrawer
      :visible="detailVisible"
      :data="detailItem"
      @close="detailVisible = false"
      @edit="handleDetailEdit"
    />

    <StudentProfileImportModal
      :visible="importModalVisible"
      :existing-students="students"
      @close="importModalVisible = false"
      @imported="handleImported"
    />

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
.student-profile-page {
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

.btn-dark {
  background: #374151;
  color: #fff;
}

.btn-dark:hover:not(:disabled) {
  background: #1f2937;
}

.btn-dark:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover:not(:disabled) {
  background: #f9fafb;
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
  position: relative;
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  white-space: nowrap;
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
  width: 44px;
  min-width: 44px;
}

.col-no {
  width: 56px;
  min-width: 56px;
}

.actions-inner {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
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
  z-index: 3;
}

.data-table tbody tr:hover .col-sticky-right {
  background: #fafafa;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
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
