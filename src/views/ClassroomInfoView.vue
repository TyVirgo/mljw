<script setup>
import { ref, computed } from 'vue'
import ClassroomFormModal from '../components/classroom/ClassroomFormModal.vue'
import ClassroomDetailModal from '../components/classroom/ClassroomDetailModal.vue'
import UserDepartmentModal from '../components/classroom/UserDepartmentModal.vue'
import BatchEditModal from '../components/classroom/BatchEditModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import {
  initialClassrooms,
  createClassroomId,
  classroomTypeOptions,
  deskChairTypeOptions,
  departmentOptions,
  getUserDepartments,
  setUserDepartments,
} from '../data/classrooms.js'
import { exportClassroomsToExcel, classroomExportFields } from '../utils/exportClassroomExcel.js'

const classrooms = ref(initialClassrooms.map((item) => ({ ...item })))

const searchExpanded = ref(false)
const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const formVisible = ref(false)
const formMode = ref('create')
const editingItem = ref(null)

const detailVisible = ref(false)
const detailItem = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const userDeptModalVisible = ref(false)
const userDeptInitial = ref([])

const batchEditVisible = ref(false)

const exportModalVisible = ref(false)

const noticeItems = [
  'Please note whether the venue is a public one or a borrowable one. If the venue is a public one, the time/number conflict of this venue will no longer be considered during the course scheduling process.',
  'If the venue is a borrowable one, the usage permission of this venue will no longer be checked during the course scheduling process.',
]

function createEmptySearch() {
  return {
    classroomNo: '',
    classroom: '',
    classroomType: '',
    deskChairType: '',
    capacityFrom: '',
    capacityTo: '',
    availableSeatsFrom: '',
    availableSeatsTo: '',
    examSeatsFrom: '',
    examSeatsTo: '',
    activation: '',
    commonArea: '',
    userDepartment: '',
    borrowingAvailability: '',
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

function matchBool(value, selected) {
  if (!selected) return true
  return String(value) === selected
}

function matchRange(value, from, to) {
  if (from !== '' && value < Number(from)) return false
  if (to !== '' && value > Number(to)) return false
  return true
}

function matchDepartment(item, selected) {
  if (!selected) return true
  return getUserDepartments(item).includes(selected)
}

const filteredClassrooms = computed(() => {
  const s = appliedSearch.value
  return classrooms.value.filter((item) =>
    matchText(item.classroomNo, s.classroomNo) &&
    matchText(item.classroom, s.classroom) &&
    matchSelect(item.classroomType, s.classroomType) &&
    matchSelect(item.deskChairType, s.deskChairType) &&
    matchRange(item.capacity, s.capacityFrom, s.capacityTo) &&
    matchRange(item.availableSeats, s.availableSeatsFrom, s.availableSeatsTo) &&
    matchRange(item.examSeats, s.examSeatsFrom, s.examSeatsTo) &&
    matchBool(item.activation, s.activation) &&
    matchBool(item.commonArea, s.commonArea) &&
    matchDepartment(item, s.userDepartment) &&
    matchBool(item.borrowingAvailability, s.borrowingAvailability),
  )
})

const totalCount = computed(() => filteredClassrooms.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedClassrooms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredClassrooms.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedClassrooms.value.length) return false
  return paginatedClassrooms.value.every((item) => selectedIds.value.includes(item.id))
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
  const pageIds = paginatedClassrooms.value.map((item) => item.id)
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
  formMode.value = 'create'
  editingItem.value = null
  formVisible.value = true
}

function openEditModal(item) {
  formMode.value = 'edit'
  editingItem.value = { ...item }
  formVisible.value = true
  detailVisible.value = false
}

function openDetailModal(item) {
  detailItem.value = { ...item }
  detailVisible.value = true
}

function closeFormModal() {
  formVisible.value = false
  editingItem.value = null
}

function handleSave(formData) {
  const applyFormData = (base) => {
    const updated = { ...base, ...formData }
    if (formData.userDepartment) {
      setUserDepartments(updated, [formData.userDepartment])
    } else {
      updated.userDepartments = []
      updated.userDepartment = ''
    }
    return updated
  }

  if (formMode.value === 'edit' && editingItem.value) {
    const index = classrooms.value.findIndex((item) => item.id === editingItem.value.id)
    if (index !== -1) {
      classrooms.value[index] = applyFormData(classrooms.value[index])
      if (detailItem.value?.id === editingItem.value.id) {
        detailItem.value = { ...classrooms.value[index] }
      }
    }
  } else {
    const duplicate = classrooms.value.some(
      (item) => item.classroomNo.toLowerCase() === formData.classroomNo.toLowerCase(),
    )
    if (duplicate) {
      window.alert('Classroom No. already exists.')
      return
    }
    classrooms.value.push(applyFormData({ id: createClassroomId() }))
  }
  closeFormModal()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? 'Are you sure you want to delete this classroom? This action cannot be undone.'
      : `Are you sure you want to delete ${uniqueIds.length} selected classrooms? This action cannot be undone.`
  confirmVisible.value = true
}

function confirmDelete() {
  classrooms.value = classrooms.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
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
  if (!filteredClassrooms.value.length) {
    window.alert('No data to export.')
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedClassrooms.value
  } else if (exportScope === 'allResults') {
    data = filteredClassrooms.value
  } else {
    data = filteredClassrooms.value.filter((item) => selectedIds.value.includes(item.id))
  }

  if (!data.length) {
    window.alert('No data to export.')
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportClassroomsToExcel(data, `classroom-info-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}

function openUserDepartmentModal() {
  if (!hasSelection.value) {
    window.alert('Please select at least one classroom.')
    return
  }
  const selected = classrooms.value.filter((item) => selectedIds.value.includes(item.id))
  const firstDepts = getUserDepartments(selected[0])
  const sameForAll = selected.every(
    (item) => JSON.stringify(getUserDepartments(item)) === JSON.stringify(firstDepts),
  )
  userDeptInitial.value = sameForAll ? [...firstDepts] : []
  userDeptModalVisible.value = true
}

function handleUserDepartmentSubmit(departments) {
  selectedIds.value.forEach((id) => {
    const index = classrooms.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      setUserDepartments(classrooms.value[index], departments)
      if (detailItem.value?.id === id) {
        detailItem.value = { ...classrooms.value[index] }
      }
    }
  })
  userDeptModalVisible.value = false
}

function openBatchEditModal() {
  if (!hasSelection.value) {
    window.alert('Please select at least one classroom.')
    return
  }
  batchEditVisible.value = true
}

function handleBatchEditSubmit(updates) {
  selectedIds.value.forEach((id) => {
    const index = classrooms.value.findIndex((item) => item.id === id)
    if (index === -1) return

    const updated = { ...classrooms.value[index], ...updates }
    if (updates.userDepartments) {
      setUserDepartments(updated, updates.userDepartments)
      delete updated.userDepartments
    }
    classrooms.value[index] = updated

    if (detailItem.value?.id === id) {
      detailItem.value = { ...classrooms.value[index] }
    }
  })
  batchEditVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}
</script>

<template>
  <div class="classroom-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-grid">
          <div class="search-row search-row-main">
            <div class="search-item">
              <label>Classroom No.:</label>
              <input v-model="searchForm.classroomNo" type="text" placeholder="please input" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>Classroom:</label>
              <input v-model="searchForm.classroom" type="text" placeholder="please input" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>Classroom Type:</label>
              <select v-model="searchForm.classroomType">
                <option value="">All</option>
                <option v-for="opt in classroomTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-actions">
              <button type="button" class="btn btn-primary" @click="handleSearch">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Search
              </button>
              <button type="button" class="btn btn-default" @click="handleReset">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                Reset
              </button>
              <button type="button" class="toggle-link" @click="toggleSearchExpanded">
                {{ searchExpanded ? 'Less' : 'More' }}
                <svg :class="{ up: searchExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>
          </div>

          <template v-if="searchExpanded">
            <div class="search-row">
              <div class="search-item">
                <label>Desk/Chair Type:</label>
                <select v-model="searchForm.deskChairType">
                  <option value="">All</option>
                  <option v-for="opt in deskChairTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>Capacity:</label>
                <div class="range-inputs">
                  <input v-model="searchForm.capacityFrom" type="number" placeholder="" />
                  <span class="range-sep">to</span>
                  <input v-model="searchForm.capacityTo" type="number" placeholder="" />
                </div>
              </div>
              <div class="search-item">
                <label>Available Seats:</label>
                <div class="range-inputs">
                  <input v-model="searchForm.availableSeatsFrom" type="number" placeholder="" />
                  <span class="range-sep">to</span>
                  <input v-model="searchForm.availableSeatsTo" type="number" placeholder="" />
                </div>
              </div>
            </div>
            <div class="search-row">
              <div class="search-item">
                <label>Exam Seats:</label>
                <div class="range-inputs">
                  <input v-model="searchForm.examSeatsFrom" type="number" placeholder="" />
                  <span class="range-sep">to</span>
                  <input v-model="searchForm.examSeatsTo" type="number" placeholder="" />
                </div>
              </div>
              <div class="search-item">
                <label>Activation:</label>
                <select v-model="searchForm.activation">
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div class="search-item">
                <label>Common Area:</label>
                <select v-model="searchForm.commonArea">
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div class="search-row search-row-2">
              <div class="search-item">
                <label>User Department:</label>
                <select v-model="searchForm.userDepartment">
                  <option value="">All</option>
                  <option v-for="opt in departmentOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>Borrowing Availability:</label>
                <select v-model="searchForm.borrowingAvailability">
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreateModal">+ Create</button>
        <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">Delete</button>
        <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="openUserDepartmentModal">User Department</button>
        <button type="button" class="btn btn-default" @click="openExportModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
        <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="openBatchEditModal">Batch Edit</button>
        <div class="notice-wrap">
          <button type="button" class="btn btn-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            Notice
          </button>
          <div class="notice-popover">
            <div class="notice-tags">
              <span v-for="(item, index) in noticeItems" :key="index" class="notice-tag">{{ index + 1 }}. {{ item }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
              <th>No.</th>
              <th>Block</th>
              <th>Floor</th>
              <th>Classroom No.</th>
              <th>Classroom</th>
              <th>Classroom Name</th>
              <th>Classroom Name (Chinese)</th>
              <th>Classroom Name (MAL)</th>
              <th>Classroom Type</th>
              <th>Desk/Chair Type</th>
              <th>Capacity</th>
              <th>Available Seats</th>
              <th>Exam Seats</th>
              <th>Classroom Equipment</th>
              <th>Software</th>
              <th>Activation</th>
              <th>Common Area</th>
              <th>Borrowing Availability</th>
              <th class="col-sticky-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!paginatedClassrooms.length">
              <td colspan="20" class="empty-cell">No data found</td>
            </tr>
            <tr v-for="(item, index) in paginatedClassrooms" :key="item.id">
              <td class="col-check"><input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" /></td>
              <td>{{ getRowNumber(index) }}</td>
              <td>{{ item.block }}</td>
              <td>{{ item.floor }}</td>
              <td>{{ item.classroomNo }}</td>
              <td>{{ item.classroom }}</td>
              <td>{{ item.classroomName }}</td>
              <td>{{ item.classroomNameEn }}</td>
              <td>{{ item.classroomNameMal }}</td>
              <td>{{ item.classroomType }}</td>
              <td>{{ item.deskChairType }}</td>
              <td>{{ item.capacity }}</td>
              <td>{{ item.availableSeats }}</td>
              <td>{{ item.examSeats }}</td>
              <td>{{ item.classroomEquipment }}</td>
              <td>{{ item.software }}</td>
              <td><span class="tag" :class="item.activation ? 'yes' : 'no'">{{ item.activation ? 'Yes' : 'No' }}</span></td>
              <td><span class="tag" :class="item.commonArea ? 'yes' : 'no'">{{ item.commonArea ? 'Yes' : 'No' }}</span></td>
              <td>{{ item.borrowingAvailability ? 'Yes' : 'No' }}</td>
              <td class="actions-cell col-sticky-right">
                <div class="actions-inner">
                  <button type="button" class="link-btn" @click="openEditModal(item)">Edit</button>
                  <button type="button" class="link-btn" @click="openDetailModal(item)">Details</button>
                  <button type="button" class="link-btn delete" @click="requestDelete([item.id])">Delete</button>
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

    <ClassroomFormModal
      :visible="formVisible"
      :mode="formMode"
      :initial-data="editingItem"
      @close="closeFormModal"
      @save="handleSave"
    />

    <ClassroomDetailModal
      :visible="detailVisible"
      :data="detailItem"
      @close="detailVisible = false"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      title="Delete Confirmation"
      :message="confirmMessage"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="confirmVisible = false"
    />

    <UserDepartmentModal
      :visible="userDeptModalVisible"
      :initial-departments="userDeptInitial"
      :selected-count="selectedIds.length"
      @close="userDeptModalVisible = false"
      @submit="handleUserDepartmentSubmit"
    />

    <BatchEditModal
      :visible="batchEditVisible"
      :selected-count="selectedIds.length"
      @close="batchEditVisible = false"
      @submit="handleBatchEditSubmit"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="classroomExportFields"
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.classroom-page {
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

.search-bar {
  margin-bottom: 16px;
  padding: 0 0 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.search-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.search-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 32px;
  align-items: center;
  width: 100%;
}

.search-row-main {
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
}

.search-row-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.search-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.search-item label {
  flex-shrink: 0;
  text-align: left;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.search-item input,
.search-item select {
  flex: 1;
  min-width: 0;
  width: auto;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
}

.search-item input:focus,
.search-item select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.range-inputs {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.range-inputs input {
  flex: 1;
  min-width: 0;
  width: auto;
}

.range-sep {
  flex-shrink: 0;
  font-size: 13px;
  color: #9ca3af;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: end;
  white-space: nowrap;
}

.toggle-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #2563eb;
  padding: 6px 4px;
  white-space: nowrap;
}

.toggle-link svg {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
}

.toggle-link svg.up {
  transform: rotate(180deg);
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
  padding-left: 0;
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

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 36px;
  padding: 0;
  justify-content: center;
  background: #fff;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.btn-notice {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 0 8px;
}

.notice-wrap {
  position: relative;
}

.notice-wrap:hover .notice-popover {
  display: block;
}

.notice-popover {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 420px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  z-index: 20;
}

.notice-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-tag {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  font-size: 12px;
  line-height: 1.5;
}

.btn-notice:hover {
  color: #2563eb;
}

.btn-notice svg {
  width: 16px;
  height: 16px;
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
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
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
  line-height: 1.5;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
}

.col-check {
  width: 40px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag.yes {
  background: #dcfce7;
  color: #16a34a;
}

.tag.no {
  background: #f3f4f6;
  color: #6b7280;
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
}

.data-table thead .col-sticky-right {
  background: #f9fafb;
  z-index: 3;
}

.data-table tbody tr:hover .col-sticky-right {
  background: #fafafa;
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
