<script setup>
import { ref, computed } from 'vue'
import CourseCreateWizard from '../components/course/CourseCreateWizard.vue'
import CourseDetailPanel from '../components/course/CourseDetailPanel.vue'
import CourseImportModal from '../components/course/CourseImportModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import {
  initialCourses,
  courseClassificationOptions,
  mediumOfInstructionOptions,
  getOfferingOptions,
  getOfferingLabel,
  createCourseId,
  enrichCourseForDetail,
  buildCourseChangeLogs,
  prepareCourseForCopy,
} from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'
import { semesterTypeOptions } from '../data/semesterInfo.js'
import { exportCoursesToExcel, courseExportFields } from '../utils/exportCourseExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(courseExportFields)

const courses = ref(initialCourses.map((item) => ({ ...item })))

const searchExpanded = ref(false)
const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const viewMode = ref('list')

const editingItem = ref(null)
const editingSnapshot = ref(null)
const detailItem = ref(null)
const copyDraft = ref(null)

const importModalVisible = ref(false)
const exportModalVisible = ref(false)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const offeringOptions = computed(() => getOfferingOptions(initialDepartments))

function createEmptySearch() {
  return {
    courseCode: '',
    courseName: '',
    offering: '',
    courseClassification: '',
    mediumOfInstruction: '',
    semesterType: '',
  }
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '').toLowerCase().includes(keyword.trim().toLowerCase())
}

function matchSelect(value, selected) {
  if (!selected) return true
  return value === selected
}

const filteredCourses = computed(() => {
  const s = appliedSearch.value
  return courses.value.filter(
    (item) =>
      matchText(item.courseCode, s.courseCode) &&
      matchText(item.courseName, s.courseName) &&
      matchSelect(item.offering, s.offering) &&
      matchSelect(item.courseClassification, s.courseClassification) &&
      matchSelect(item.mediumOfInstruction, s.mediumOfInstruction) &&
      matchSelect(item.semesterType, s.semesterType),
  )
})

const totalCount = computed(() => filteredCourses.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCourses.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedCourses.value.length) return false
  return paginatedCourses.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)
const canCopy = computed(() => selectedIds.value.length === 1)

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
  const pageIds = paginatedCourses.value.map((item) => item.id)
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
  copyDraft.value = null
  viewMode.value = 'create'
}

function closeCreateWizard() {
  viewMode.value = 'list'
  copyDraft.value = null
}

function handleCreateSave(payload) {
  courses.value.push({
    id: createCourseId(),
    ...payload,
    changeRecords: [],
  })
  closeCreateWizard()
}

function openEditModal(item) {
  const enriched = enrichCourseForDetail({ ...item })
  editingSnapshot.value = JSON.parse(JSON.stringify(enriched))
  editingItem.value = enriched
  viewMode.value = 'edit'
}

function closeEditWizard() {
  viewMode.value = 'list'
  editingItem.value = null
  editingSnapshot.value = null
}

function handleEditSave(payload) {
  if (!editingSnapshot.value) return
  const index = courses.value.findIndex((item) => item.id === editingSnapshot.value.id)
  if (index === -1) return

  const changeLogs = buildCourseChangeLogs(editingSnapshot.value, payload)
  courses.value[index] = {
    ...courses.value[index],
    ...payload,
    requiredReferences: '',
    furtherReadings: '',
    courseOwnerDisplay: '',
    changeRecords: [...(courses.value[index].changeRecords || []), ...changeLogs],
  }
  closeEditWizard()
}

function openDetailModal(item) {
  detailItem.value = enrichCourseForDetail({ ...item })
  viewMode.value = 'detail'
}

function closeDetailModal() {
  viewMode.value = 'list'
  detailItem.value = null
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('pages.course.deleteOne')
      : t('pages.course.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function confirmDelete() {
  courses.value = courses.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function cancelDelete() {
  pendingDeleteIds.value = []
  confirmVisible.value = false
}

function handleCopy() {
  if (selectedIds.value.length !== 1) {
    window.alert(t('pages.course.copySelectOne'))
    return
  }
  const source = courses.value.find((item) => item.id === selectedIds.value[0])
  if (!source) return
  copyDraft.value = prepareCourseForCopy(enrichCourseForDetail({ ...source }), courses.value)
  viewMode.value = 'create'
  selectedIds.value = []
}

function openImportModal() {
  importModalVisible.value = true
}

function handleImportSuccess(importedRows) {
  importedRows.forEach((row) => {
    courses.value.push({
      id: createCourseId(),
      ...row,
      clos: row.clos || [],
      slt: row.slt || { contentOutlines: [], continuousAssessments: [], finalAssessments: [] },
      changeRecords: row.changeRecords || [],
    })
  })
  if (importedRows.length) {
    currentPage.value = 1
  }
}

function openExportModal() {
  if (!filteredCourses.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedCourses.value
  } else if (exportScope === 'allResults') {
    data = filteredCourses.value
  } else {
    data = filteredCourses.value.filter((item) => selectedIds.value.includes(item.id))
  }

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportCoursesToExcel(data, `course-information-${timestamp}.xlsx`, selectedFields)
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
  <CourseCreateWizard
    v-if="viewMode === 'create'"
    :mode="copyDraft ? 'copy' : 'create'"
    :all-courses="courses"
    :initial-course="copyDraft"
    @back="closeCreateWizard"
    @save="handleCreateSave"
  />

  <CourseCreateWizard
    v-else-if="viewMode === 'edit' && editingItem"
    mode="edit"
    :all-courses="courses"
    :initial-course="editingItem"
    @back="closeEditWizard"
    @save="handleEditSave"
  />

  <CourseDetailPanel v-else-if="viewMode === 'detail' && detailItem" :course="detailItem" @back="closeDetailModal" />

  <div v-else-if="viewMode === 'list'" class="course-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Course Code:') }}</label>
              <input v-model="searchForm.courseCode" type="text" class="search-input" :placeholder="t('common.pleaseInput')" />
            </div>
            <div class="search-item">
              <label>{{ tr('Course Name:') }}</label>
              <input v-model="searchForm.courseName" type="text" class="search-input" :placeholder="t('common.pleaseInput')" />
            </div>
            <div class="search-item">
              <label>{{ tr('Offering Unit:') }}</label>
              <select v-model="searchForm.offering" class="search-select" :class="{ 'is-empty': !searchForm.offering }">
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in offeringOptions" :key="opt.code" :value="opt.code">{{ opt.nameEn }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ tr('Course Classification:') }}</label>
              <select
                v-model="searchForm.courseClassification"
                class="search-select"
                :class="{ 'is-empty': !searchForm.courseClassification }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in courseClassificationOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
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
            <button type="button" class="btn btn-text" @click="toggleSearchExpanded">
              {{ searchExpanded ? t('common.collapse') : t('common.more') }}
              <svg :class="{ up: searchExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="searchExpanded" class="search-row search-row-2">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Medium of Instruction:') }}</label>
              <select
                v-model="searchForm.mediumOfInstruction"
                class="search-select"
                :class="{ 'is-empty': !searchForm.mediumOfInstruction }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in mediumOfInstructionOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ tr('Semester Type:') }}</label>
              <select v-model="searchForm.semesterType" class="search-select" :class="{ 'is-empty': !searchForm.semesterType }">
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in semesterTypeOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreateModal">{{ tr('Create Course') }}</button>
        <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">
          {{ t('common.delete') }}
        </button>
        <button type="button" class="btn btn-outline" @click="openImportModal">{{ t('common.import') }}</button>
        <button type="button" class="btn btn-outline" @click="openExportModal">{{ t('common.export') }}</button>
        <button type="button" class="btn btn-outline" :disabled="!canCopy" @click="handleCopy">{{ t('common.copy') }}</button>
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
                <th>{{ tr('Course Code') }}</th>
                <th>{{ tr('Course Name') }}</th>
                <th>{{ tr('Offering Unit') }}</th>
                <th>{{ tr('Course Classification') }}</th>
                <th>{{ tr('Credit') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedCourses.length">
                <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedCourses" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td>{{ getRowNumber(index) }}</td>
                <td>{{ item.courseCode }}</td>
                <td>{{ item.courseName }}</td>
                <td>{{ getOfferingLabel(item.offering, initialDepartments) }}</td>
                <td>{{ tr(item.courseClassification) }}</td>
                <td>{{ item.credit }}</td>
                <td class="actions-cell">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openDetailModal(item)">{{ tr('Details') }}</button>
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

    <CourseImportModal
      :visible="importModalVisible"
      :existing-courses="courses"
      @close="importModalVisible = false"
      @imported="handleImportSuccess"
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
  </div>
</template>

<style scoped>
.course-page {
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
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.search-row-2 {
  margin-top: 12px;
}

.search-fields {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  min-width: 0;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.search-item label {
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
}

.search-input,
.search-select {
  width: 180px;
  min-width: 140px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  box-sizing: border-box;
}

.search-select.is-empty {
  color: #9ca3af;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.search-actions svg {
  width: 14px;
  height: 14px;
}

.search-actions svg.up {
  transform: rotate(180deg);
}

.btn-text {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 32px;
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

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
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

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-outline:disabled {
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
  border: none;
  background: none;
}

.link-btn.delete {
  color: #ef4444;
}
</style>
