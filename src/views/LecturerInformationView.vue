<script setup>
import { ref, computed } from 'vue'
import LecturerFormModal from '../components/lecturer/LecturerFormModal.vue'
import LecturerDetailModal from '../components/lecturer/LecturerDetailModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import {
  initialLecturers,
  createLecturerId,
  normalizeLecturer,
  formatDateDisplay,
  categoryOptions,
  titleOptions,
  academicPositionOptions,
  degreeOptions,
  employmentStatusOptions,
  getDepartmentOptions,
} from '../data/lecturers.js'
import { exportLecturersToExcel, lecturerExportFields } from '../utils/exportLecturerExcel.js'
import { mergeEvaluationOverrides } from '../data/evaluationSettings.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(lecturerExportFields)

const lecturers = ref(
  initialLecturers.map((item) => mergeEvaluationOverrides(normalizeLecturer({ ...item }))),
)

const searchExpanded = ref(true)
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

const noticeVisible = ref(false)
const noticeMessage = ref('')

const departmentOptions = getDepartmentOptions()

function createEmptySearch() {
  return {
    staffId: '',
    name: '',
    department: '',
    category: '',
    title: '',
    academicPosition: '',
    degree: '',
    employmentStatus: '',
    requiresEvaluationOnly: false,
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

const filteredLecturers = computed(() => {
  const s = appliedSearch.value
  return lecturers.value.filter(
    (item) =>
      matchText(item.staffId, s.staffId) &&
      matchText(item.name, s.name) &&
      matchText(item.nameCn, s.name) &&
      matchText(item.nameMal, s.name) &&
      matchSelect(item.department, s.department) &&
      matchSelect(item.category, s.category) &&
      matchSelect(item.title, s.title) &&
      matchSelect(item.academicPosition, s.academicPosition) &&
      matchSelect(item.degree, s.degree) &&
      matchSelect(item.employmentStatus, s.employmentStatus) &&
      (!s.requiresEvaluationOnly || item.requiresEvaluation),
  )
})

const totalCount = computed(() => filteredLecturers.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedLecturers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLecturers.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedLecturers.value.length) return false
  return paginatedLecturers.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)
const evaluationFilterActive = computed(() => appliedSearch.value.requiresEvaluationOnly)

function showEvalTag(item) {
  return item.requiresEvaluation
}

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

function handleEvaluationToggle() {
  handleSearch()
}

function toggleSelectAll(event) {
  const pageIds = paginatedLecturers.value.map((item) => item.id)
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
    const duplicate = lecturers.value.some(
      (item) => item.id !== editingItem.value.id && item.staffId.toLowerCase() === formData.staffId.toLowerCase(),
    )
    if (duplicate) {
      window.alert(tr('Staff ID already exists.'))
      return
    }
    const index = lecturers.value.findIndex((item) => item.id === editingItem.value.id)
    if (index !== -1) {
      lecturers.value[index] = normalizeLecturer({ ...lecturers.value[index], ...formData })
      if (detailItem.value?.id === editingItem.value.id) {
        detailItem.value = { ...lecturers.value[index] }
      }
    }
  } else {
    const duplicate = lecturers.value.some(
      (item) => item.staffId.toLowerCase() === formData.staffId.toLowerCase(),
    )
    if (duplicate) {
      window.alert(tr('Staff ID already exists.'))
      return
    }
    lecturers.value.push(normalizeLecturer({ id: createLecturerId(), ...formData }))
  }
  closeModal()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? tr('Are you sure you want to delete this lecturer? This action cannot be undone.')
      : tr(`Are you sure you want to delete ${uniqueIds.length} selected lecturers? This action cannot be undone.`)
  confirmVisible.value = true
}

function confirmDelete() {
  lecturers.value = lecturers.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
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
  if (!filteredLecturers.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') data = paginatedLecturers.value
  else if (exportScope === 'allResults') data = filteredLecturers.value
  else data = filteredLecturers.value.filter((item) => selectedIds.value.includes(item.id))

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  const timestamp = new Date().toISOString().slice(0, 10)
  exportLecturersToExcel(data, `lecturer-information-${timestamp}.xlsx`, ['no', ...selectedFields])
  exportModalVisible.value = false
}

function showNotice(message) {
  noticeMessage.value = message
  noticeVisible.value = true
}

function handleSyncCache() {
  showNotice(tr('HR system sync is not yet connected. CPD and lecturer data will be synchronized once the integration is available.'))
}

function handleEmsReference() {
  showNotice(tr('EMS system integration is not yet connected.'))
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}
</script>

<template>
  <div class="lecturer-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Name:') }}</label>
              <input v-model="searchForm.name" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>{{ tr('Staff ID:') }}</label>
              <input v-model="searchForm.staffId" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>{{ tr('School/Department:') }}</label>
              <select v-model="searchForm.department">
                <option value="">{{ tr('please select') }}</option>
                <option v-for="opt in departmentOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ tr('Category:') }}</label>
              <select v-model="searchForm.category">
                <option value="">{{ tr('please select') }}</option>
                <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
            <template v-if="searchExpanded">
              <div class="search-item">
                <label>{{ tr('Title:') }}</label>
                <select v-model="searchForm.title">
                  <option value="">{{ tr('please select') }}</option>
                  <option v-for="opt in titleOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ tr('Academic Position:') }}</label>
                <select v-model="searchForm.academicPosition">
                  <option value="">{{ tr('please select') }}</option>
                  <option v-for="opt in academicPositionOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ tr('Degree:') }}</label>
                <select v-model="searchForm.degree">
                  <option value="">{{ tr('please select') }}</option>
                  <option v-for="opt in degreeOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ tr('Employment Status:') }}</label>
                <select v-model="searchForm.employmentStatus">
                  <option value="">{{ tr('please select') }}</option>
                  <option v-for="opt in employmentStatusOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
                </select>
              </div>
            </template>
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

        <div class="search-row search-row-secondary eval-filter-line">
            <span class="eval-filter-label">{{ tr('Filter lecturers who require teaching observation/lecture evaluation:') }}</span>
            <label class="eval-switch" :class="{ on: searchForm.requiresEvaluationOnly }">
              <input
                v-model="searchForm.requiresEvaluationOnly"
                type="checkbox"
                class="eval-switch-input"
                @change="handleEvaluationToggle"
              />
              <span class="eval-switch-track">
                <span class="eval-switch-letter eval-switch-letter-y">Y</span>
                <span class="eval-switch-knob"></span>
                <span class="eval-switch-letter eval-switch-letter-n">N</span>
              </span>
            </label>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreateModal">+ {{ t('common.create') }}</button>
        <button type="button" class="btn btn-dark" :disabled="!hasSelection" @click="requestDelete(selectedIds)">{{ t('common.delete') }}</button>
        <button type="button" class="btn btn-default" @click="openExportModal">{{ t('common.export') }}</button>
        <button type="button" class="btn btn-default" @click="handleSyncCache">{{ tr('Sync Cache') }}</button>
        <button type="button" class="btn btn-default" @click="handleEmsReference">{{ tr('Refers to EMS system') }}</button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                <th class="col-no">{{ t('common.serialNo') }}</th>
                <th class="col-staff-id">{{ tr('Staff ID') }}</th>
                <th class="col-name">{{ tr('Name') }}</th>
                <th class="col-gender">{{ tr('Gender') }}</th>
                <th>{{ tr('Category') }}</th>
                <th>{{ tr('Affiliated Programme') }}</th>
                <th>{{ tr('Department') }}</th>
                <th>{{ tr('Academic Qualification (Highest)') }}</th>
                <th>{{ tr('Title') }}</th>
                <th>{{ tr('Academic Position') }}</th>
                <th>{{ tr('Degree') }}</th>
                <th>{{ tr('Employment Status') }}</th>
                <th>{{ tr('Date of Joining') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedLecturers.length">
                <td colspan="15" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedLecturers" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td class="col-no">{{ getRowNumber(index) }}</td>
                <td class="col-staff-id">{{ item.staffId }}</td>
                <td class="col-name">
                  <div class="name-cell">
                    <span class="name-text">{{ item.name }}</span>
                    <span v-if="showEvalTag(item)" class="eval-tag">
                      <span class="eval-tag-line">{{ tr('Requires') }}</span>
                      <span class="eval-tag-line">{{ tr('Evaluation') }}</span>
                    </span>
                  </div>
                </td>
                <td class="col-gender">{{ tr(item.gender) }}</td>
                <td>{{ tr(item.category) }}</td>
                <td>{{ item.affiliatedProgramme || '--' }}</td>
                <td>{{ item.department || '--' }}</td>
                <td>{{ tr(item.academicQualificationHighest) }}</td>
                <td>{{ tr(item.title) }}</td>
                <td>{{ tr(item.academicPosition) }}</td>
                <td>{{ tr(item.degree) }}</td>
                <td>{{ tr(item.employmentStatus) }}</td>
                <td>{{ formatDateDisplay(item.dateOfJoining) }}</td>
                <td class="actions-cell col-sticky-right">
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

    <LecturerFormModal
      :visible="modalVisible"
      :mode="modalMode"
      :initial-data="editingItem"
      @close="closeModal"
      @save="handleSave"
    />

    <LecturerDetailModal :visible="detailVisible" :data="detailItem" @close="detailVisible = false" />

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

    <Teleport to="body">
      <div v-if="noticeVisible" class="notice-overlay" @click="noticeVisible = false">
        <div class="notice-panel" @click.stop>
          <div class="notice-header">
            <h2>{{ t('common.notice') }}</h2>
            <button type="button" class="notice-close" @click="noticeVisible = false">×</button>
          </div>
          <p class="notice-body">{{ noticeMessage }}</p>
          <div class="notice-footer">
            <button type="button" class="btn btn-primary" @click="noticeVisible = false">{{ t('common.confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.lecturer-page {
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

.eval-filter-line {
  gap: 12px;
}

.eval-filter-label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.eval-switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.eval-switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.eval-switch-track {
  position: relative;
  width: 52px;
  height: 24px;
  background: #d1d5db;
  border-radius: 999px;
  flex-shrink: 0;
}

.eval-switch.on .eval-switch-track {
  background: #2563eb;
}

.eval-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.15);
  transition: left 0.2s ease;
  z-index: 2;
}

.eval-switch.on .eval-switch-knob {
  left: calc(100% - 22px);
}

.eval-switch-letter {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  z-index: 1;
  user-select: none;
}

.eval-switch-letter-y {
  left: 8px;
}

.eval-switch-letter-n {
  right: 8px;
}

.eval-switch:not(.on) .eval-switch-letter-y {
  opacity: 0;
}

.eval-switch.on .eval-switch-letter-n {
  opacity: 0;
}

.toggle-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #2563eb;
}

.toggle-link svg {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
}

.toggle-link svg.up { transform: rotate(180deg); }

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

.btn svg { width: 14px; height: 14px; }

.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover:not(:disabled) { background: #f9fafb; }

.btn-dark {
  background: #111827;
  color: #fff;
}

.btn-dark:hover:not(:disabled) { background: #1f2937; }

.btn-default:disabled,
.btn-dark:disabled {
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

.data-table thead tr { height: 44px; }

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

.data-table tbody tr:hover { background: #fafafa; }

.col-check { width: 48px; min-width: 48px; }

.col-no { width: 56px; min-width: 56px; }

.col-staff-id { width: 96px; min-width: 96px; }

.col-name {
  min-width: 140px;
}

.name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}

.name-text {
  white-space: nowrap;
}

.col-gender { width: 72px; min-width: 72px; }

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

.name-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.name-text {
  flex-shrink: 0;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.eval-tag {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.15;
  background: #22c55e;
  color: #fff;
  white-space: nowrap;
  box-sizing: border-box;
}

.eval-tag-line {
  display: block;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0;
}

.link-btn.delete { color: #ef4444; }

.notice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}

.notice-panel {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.notice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.notice-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.notice-close {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #6b7280;
  border-radius: 8px;
}

.notice-body {
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
}

.notice-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
