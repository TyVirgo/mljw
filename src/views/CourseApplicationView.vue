<script setup>
import { ref, computed } from 'vue'
import CourseApplicationWizard from '../components/courseApplication/CourseApplicationWizard.vue'
import CourseApplicationImportModal from '../components/courseApplication/CourseApplicationImportModal.vue'
import ApprovalLogModal from '../components/courseApplication/ApprovalLogModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import { courseApplications } from '../data/courseStore.js'
import {
  applicationStatusOptions,
  createCourseApplicationId,
  buildApplicationPayload,
  canEditApplication,
  canSubmitApplication,
  canDeleteApplication,
  canViewApprovalLog,
  submitApplications,
  statusBadgeClass,
} from '../data/courseApplications.js'
import {
  courseClassificationOptions,
  getOfferingOptions,
  getOfferingLabel,
} from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'
import {
  exportCourseApplicationsToExcel,
  courseApplicationExportFields,
} from '../utils/exportCourseApplicationExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(courseApplicationExportFields)

const applications = courseApplications

const searchExpanded = ref(false)
const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const viewMode = ref('list')
const editingItem = ref(null)
const detailItem = ref(null)

const approvalLogItem = ref(null)
const exportModalVisible = ref(false)
const importModalVisible = ref(false)
const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])
const submitConfirmVisible = ref(false)

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

const filteredApplications = computed(() => {
  const s = appliedSearch.value
  return applications.value.filter(
    (item) =>
      matchText(item.courseCode, s.courseCode) &&
      matchText(item.courseName, s.courseName) &&
      matchSelect(item.offering, s.offering) &&
      matchSelect(item.courseClassification, s.courseClassification) &&
      matchSelect(item.status, s.status) &&
      matchText(item.applicant, s.applicant),
  )
})

const totalCount = computed(() => filteredApplications.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredApplications.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedApplications.value.length) return false
  return paginatedApplications.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

const canSubmitSelection = computed(() => {
  if (!hasSelection.value) return false
  return selectedIds.value.every((id) => {
    const item = applications.value.find((row) => row.id === id)
    return item && canSubmitApplication(item)
  })
})

const deletableSelection = computed(() => {
  if (!hasSelection.value) return false
  return selectedIds.value.every((id) => {
    const item = applications.value.find((row) => row.id === id)
    return item && canDeleteApplication(item)
  })
})

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
  const pageIds = paginatedApplications.value.map((item) => item.id)
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

function openApply() {
  editingItem.value = null
  viewMode.value = 'apply'
}

function closeWizard() {
  viewMode.value = 'list'
  editingItem.value = null
  detailItem.value = null
}

function openEdit(item) {
  editingItem.value = { ...item }
  viewMode.value = 'edit'
}

function openDetail(item) {
  detailItem.value = { ...item }
  viewMode.value = 'detail'
}

function openApprovalLog(item) {
  approvalLogItem.value = { ...item }
}

function handleSaveFromWizard(payload) {
  const generalForm = {
    courseCode: payload.courseCode,
    courseName: payload.courseName,
    offering: payload.offering,
    courseOwner: payload.courseOwner,
    courseClassification: payload.courseClassification,
    credit: String(payload.credit),
    mediumOfInstruction: payload.mediumOfInstruction,
    semesterType: payload.semesterType,
    prerequisite: payload.prerequisite || '',
    synopsis: payload.synopsis || '',
    references: payload.references || '',
  }

  if (viewMode.value === 'edit' && editingItem.value) {
    const index = applications.value.findIndex((item) => item.id === editingItem.value.id)
    if (index === -1) return
    const prev = applications.value[index]
    applications.value[index] = {
      id: prev.id,
      ...buildApplicationPayload(generalForm, payload.clos, payload.slt, {
        status: 'Temporary saved',
        approvalStage: prev.approvalStage,
        applicant: prev.applicant,
        applicationDateTime: prev.applicationDateTime,
        approvalLog: prev.approvalLog || [],
      }),
    }
  } else {
    applications.value.push({
      id: createCourseApplicationId(),
      ...buildApplicationPayload(generalForm, payload.clos, payload.slt, {
        status: 'Temporary saved',
        approvalStage: '--',
      }),
    })
  }
  closeWizard()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)].filter((id) => {
    const item = applications.value.find((row) => row.id === id)
    return item && canDeleteApplication(item)
  })
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? tr('Are you sure you want to delete this course application?')
      : tr('Are you sure you want to delete the selected course applications?')
  confirmVisible.value = true
}

function confirmDelete() {
  applications.value = applications.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function cancelDelete() {
  pendingDeleteIds.value = []
  confirmVisible.value = false
}

function requestSubmit() {
  if (!canSubmitSelection.value) return
  submitConfirmVisible.value = true
}

function confirmSubmit() {
  const targets = applications.value.filter((item) => selectedIds.value.includes(item.id))
  applications.value = submitApplications(targets, applications.value)
  selectedIds.value = []
  submitConfirmVisible.value = false
}

function openImportModal() {
  importModalVisible.value = true
}

function openExportModal() {
  if (!filteredApplications.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') data = paginatedApplications.value
  else if (exportScope === 'allResults') data = filteredApplications.value
  else data = filteredApplications.value.filter((item) => selectedIds.value.includes(item.id))

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportCourseApplicationsToExcel(data, `course-application-${timestamp}.xlsx`, selectedFields)
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
  <CourseApplicationWizard
    v-if="viewMode === 'apply'"
    mode="create"
    :all-applications="applications"
    @back="closeWizard"
    @save="handleSaveFromWizard"
  />

  <CourseApplicationWizard
    v-else-if="viewMode === 'edit' && editingItem"
    mode="edit"
    :all-applications="applications"
    :initial-application="editingItem"
    @back="closeWizard"
    @save="handleSaveFromWizard"
  />

  <CourseApplicationWizard
    v-else-if="viewMode === 'detail' && detailItem"
    mode="detail"
    :all-applications="applications"
    :initial-application="detailItem"
    @back="closeWizard"
  />

  <div v-else class="course-application-page">
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
                <option v-for="opt in applicationStatusOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
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
        <button type="button" class="btn btn-primary" @click="openApply">{{ tr('+ Apply') }}</button>
        <button type="button" class="btn btn-default" :disabled="!deletableSelection" @click="requestDelete(selectedIds)">
          {{ t('common.delete') }}
        </button>
        <button type="button" class="btn btn-outline" @click="openImportModal">{{ t('common.import') }}</button>
        <button type="button" class="btn btn-outline" @click="openExportModal">{{ t('common.export') }}</button>
        <button type="button" class="btn btn-outline" :disabled="!canSubmitSelection" @click="requestSubmit">
          {{ tr('Submit') }}
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
                <th>{{ tr('Status') }}</th>
                <th>{{ tr('Approval Stage') }}</th>
                <th>{{ tr('Course Code') }}</th>
                <th>{{ tr('Course Name') }}</th>
                <th>{{ tr('Offering Unit') }}</th>
                <th>{{ tr('Course Classification') }}</th>
                <th>{{ tr('Credit') }}</th>
                <th>{{ tr('Applicant') }}</th>
                <th>{{ tr('Application Date and Time') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedApplications.length">
                <td colspan="12" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedApplications" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td>{{ getRowNumber(index) }}</td>
                <td>
                  <span class="status-badge" :class="statusBadgeClass(item.status)">{{ tr(item.status) }}</span>
                </td>
                <td>{{ tr(item.approvalStage) }}</td>
                <td>{{ item.courseCode }}</td>
                <td>{{ tr(item.courseName) }}</td>
                <td>{{ tr(getOfferingLabel(item.offering, initialDepartments)) }}</td>
                <td>{{ tr(item.courseClassification) }}</td>
                <td>{{ item.credit }}</td>
                <td>{{ item.applicant }}</td>
                <td>{{ item.applicationDateTime }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button v-if="canEditApplication(item)" type="button" class="link-btn" @click="openEdit(item)">
                      {{ t('common.edit') }}
                    </button>
                    <button type="button" class="link-btn" @click="openDetail(item)">{{ tr('Details') }}</button>
                    <button v-if="canViewApprovalLog(item)" type="button" class="link-btn" @click="openApprovalLog(item)">
                      {{ tr('Approval Log') }}
                    </button>
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

    <ApprovalLogModal
      :visible="!!approvalLogItem"
      :logs="approvalLogItem?.approvalLog || []"
      :course-name="approvalLogItem?.courseName || ''"
      @close="approvalLogItem = null"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="confirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <ConfirmDialog
      :visible="submitConfirmVisible"
      :title="tr('Submit Confirmation')"
      :message="tr('Are you sure you want to submit the selected application(s) for review?')"
      :confirm-text="tr('Submit')"
      confirm-variant="primary"
      @confirm="confirmSubmit"
      @cancel="submitConfirmVisible = false"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="translatedExportFields"
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />

    <CourseApplicationImportModal
      :visible="importModalVisible"
      @close="importModalVisible = false"
    />
  </div>
</template>

<style scoped>
.course-application-page {
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
  min-width: 200px;
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

.link-btn.delete {
  color: #ef4444;
}
</style>
