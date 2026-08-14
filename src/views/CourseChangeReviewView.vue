<script setup>
import { ref, computed } from 'vue'
import CourseApplicationDetailDrawer from '../components/courseApplication/CourseApplicationDetailDrawer.vue'
import CourseApprovalModal from '../components/courseApproval/CourseApprovalModal.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import { courseChangeApplications, courses } from '../data/courseStore.js'
import { applicationStatusOptions, statusBadgeClass } from '../data/courseChangeApplications.js'
import {
  getChangeApprovalQueue,
  canBatchApproveChangeSelection,
  canApproveChangeApplication,
  getSharedChangeApprovalStage,
  applyChangeApprovalDecisions,
} from '../data/courseChangeApproval.js'
import { courseClassificationOptions, getOfferingOptions } from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'
import {
  exportCourseChangeReviewsToExcel,
  courseChangeReviewExportFields,
} from '../utils/exportCourseChangeReviewExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(courseChangeReviewExportFields)

const searchExpanded = ref(true)
const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const detailItem = ref(null)
const exportModalVisible = ref(false)
const approvalModalVisible = ref(false)
const pendingApprovalIds = ref([])
const approvalModalStage = ref('')

const offeringOptions = computed(() => getOfferingOptions(initialDepartments))

function createEmptySearch() {
  return {
    courseCode: '',
    courseName: '',
    offering: '',
    courseClassification: '',
    status: '',
    applicant: '',
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

const approvalQueue = computed(() => getChangeApprovalQueue(courseChangeApplications.value))

const filteredItems = computed(() => {
  const s = appliedSearch.value
  return approvalQueue.value.filter(
    (item) =>
      matchText(item.courseCode || item.sourceCourseCode, s.courseCode) &&
      matchText(item.courseName, s.courseName) &&
      matchSelect(item.offering, s.offering) &&
      matchSelect(item.courseClassification, s.courseClassification) &&
      matchSelect(item.status, s.status) &&
      matchText(item.applicant, s.applicant),
  )
})

const totalCount = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedItems.value.length) return false
  return paginatedItems.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

const selectedItems = computed(() =>
  selectedIds.value
    .map((id) => courseChangeApplications.value.find((row) => row.id === id))
    .filter(Boolean),
)

const canApproveSelection = computed(() => canBatchApproveChangeSelection(selectedItems.value))

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
  const pageIds = paginatedItems.value.map((item) => item.id)
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

function openDetail(item) {
  detailItem.value = { ...item }
}

function closeDetail() {
  detailItem.value = null
}

function handleDrawerDecided(result) {
  courseChangeApplications.value = result.applications
  courses.value = result.courses
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function openApprovalModal() {
  if (!canApproveSelection.value) {
    window.alert(tr('Please select one or more applications at the same approval stage that can be approved.'))
    return
  }
  pendingApprovalIds.value = selectedItems.value.map((item) => item.id)
  approvalModalStage.value = getSharedChangeApprovalStage(selectedItems.value) || ''
  approvalModalVisible.value = true
}

function handleApprovalConfirm({ action, comment }) {
  const result = applyChangeApprovalDecisions(
    pendingApprovalIds.value,
    action,
    comment,
    courseChangeApplications.value,
    courses.value,
  )
  courseChangeApplications.value = result.applications
  courses.value = result.courses
  pendingApprovalIds.value = []
  approvalModalVisible.value = false
  selectedIds.value = []
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
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
  if (exportScope === 'currentPage') data = paginatedItems.value
  else if (exportScope === 'allResults') data = filteredItems.value
  else data = filteredItems.value.filter((item) => selectedIds.value.includes(item.id))

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportCourseChangeReviewsToExcel(data, `course-change-review-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function displayCourseCode(item) {
  return item.courseCode || item.sourceCourseCode || '--'
}
</script>

<template>
  <div class="course-change-review-page">
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
                <option v-for="opt in offeringOptions" :key="opt.code" :value="opt.code">{{ tr(opt.nameEn) }}</option>
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

        <Transition name="search-expand">
          <div v-if="searchExpanded" class="search-row search-row-secondary">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Status:') }}</label>
              <select v-model="searchForm.status" class="search-select" :class="{ 'is-empty': !searchForm.status }">
                <option value="">{{ t('common.all') }}</option>
                <option
                  v-for="opt in applicationStatusOptions.filter((s) => s !== 'Temporary saved')"
                  :key="opt"
                  :value="opt"
                >
                  {{ tr(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ tr('Applicant:') }}</label>
              <input v-model="searchForm.applicant" type="text" class="search-input" :placeholder="t('common.pleaseInput')" />
            </div>
          </div>
          </div>
        </Transition>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" :disabled="!canApproveSelection" @click="openApprovalModal">
          {{ tr('Review') }}
        </button>
        <button type="button" class="btn btn-outline" @click="openExportModal">{{ t('common.export') }}</button>
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
                <th>{{ tr('Status') }}</th>
                <th>{{ tr('Approval Stage') }}</th>
                <th>{{ tr('Course Code') }}</th>
                <th>{{ tr('Course Name') }}</th>
                <th>{{ tr('Affiliated Programme') }}</th>
                <th>{{ tr('Offering Unit') }}</th>
                <th>{{ tr('Course Classification') }}</th>
                <th>{{ tr('Credit') }}</th>
                <th>{{ tr('Applicant') }}</th>
                <th>{{ tr('Application Date and Time') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedItems.length">
                <td colspan="13" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedItems" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td>{{ getRowNumber(index) }}</td>
                <td>
                  <span class="status-badge" :class="statusBadgeClass(item.status)">{{ tr(item.status) }}</span>
                </td>
                <td>{{ tr(item.approvalStage) }}</td>
                <td>{{ displayCourseCode(item) }}</td>
                <td>{{ tr(item.courseName) }}</td>
                <td>{{ item.affiliatedProgramme || '--' }}</td>
                <td>{{ item.offering || '--' }}</td>
                <td>{{ tr(item.courseClassification) }}</td>
                <td>{{ item.credit }}</td>
                <td>{{ item.applicant }}</td>
                <td>{{ item.applicationDateTime }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openDetail(item)">{{ t('common.details') }}</button>
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

    <CourseApplicationDetailDrawer
      :visible="!!detailItem"
      :application="detailItem"
      variant="change"
      :all-applications="courseChangeApplications"
      :formal-courses="courses"
      :show-approve-action="detailItem ? canApproveChangeApplication(detailItem) : false"
      @close="closeDetail"
      @decided="handleDrawerDecided"
    />

    <CourseApprovalModal
      :visible="approvalModalVisible"
      :approval-stage="approvalModalStage"
      :target-count="pendingApprovalIds.length"
      @close="approvalModalVisible = false"
      @confirm="handleApprovalConfirm"
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
.course-change-review-page {
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

.data-table th,
.data-table td {
  padding: 16px 14px;
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

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: #fff;
}

.status-progress {
  background: #2563eb;
}

.status-approved {
  background: #16a34a;
}

.status-draft {
  background: #6b7280;
}

.status-rejected {
  background: #dc2626;
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

.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>
