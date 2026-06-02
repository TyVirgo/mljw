<script setup>
import { ref, computed } from 'vue'
import CourseChangeWizard from '../components/courseChange/CourseChangeWizard.vue'
import ApprovalLogModal from '../components/courseApplication/ApprovalLogModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import { courseChangeApplications, courses } from '../data/courseStore.js'
import {
  applicationStatusOptions,
  createCourseChangeApplicationId,
  buildChangeApplicationPayload,
  canEditChangeApplication,
  canSubmitChangeApplication,
  canDeleteChangeApplication,
  canWithdrawChangeApplication,
  canViewChangeApprovalLog,
  submitChangeApplications,
  withdrawChangeApplications,
  statusBadgeClass,
} from '../data/courseChangeApplications.js'
import { courseClassificationOptions, getOfferingOptions, getOfferingLabel } from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'
import {
  exportCourseChangeApplicationsToExcel,
  courseChangeExportFields,
} from '../utils/exportCourseChangeApplicationExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(courseChangeExportFields)

const applications = courseChangeApplications
const formalCourses = courses

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
const confirmVisible = ref(false)
const confirmMessage = ref('')
const confirmTitle = ref('')
const confirmText = ref('')
const confirmVariant = ref('danger')
const pendingDeleteIds = ref([])
const submitConfirmVisible = ref(false)
const withdrawConfirmVisible = ref(false)
const pendingConfirmAction = ref(null)

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
      matchText(item.courseCode || item.sourceCourseCode, s.courseCode) &&
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
    return item && canSubmitChangeApplication(item)
  })
})

const canWithdrawSelection = computed(() => {
  if (!hasSelection.value) return false
  return selectedIds.value.every((id) => {
    const item = applications.value.find((row) => row.id === id)
    return item && canWithdrawChangeApplication(item)
  })
})

const deletableSelection = computed(() => {
  if (!hasSelection.value) return false
  return selectedIds.value.every((id) => {
    const item = applications.value.find((row) => row.id === id)
    return item && canDeleteChangeApplication(item)
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

function openCreate() {
  editingItem.value = null
  viewMode.value = 'create'
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
  const record = buildChangeApplicationPayload({
    ...payload,
    meta:
      viewMode.value === 'edit' && editingItem.value
        ? {
            status: 'Temporary saved',
            approvalStage: editingItem.value.approvalStage,
            applicant: editingItem.value.applicant,
            applicationDateTime: editingItem.value.applicationDateTime,
            approvalLog: editingItem.value.approvalLog || [],
          }
        : {
            status: 'Temporary saved',
            approvalStage: '--',
          },
  })

  if (viewMode.value === 'edit' && editingItem.value) {
    const index = applications.value.findIndex((item) => item.id === editingItem.value.id)
    if (index === -1) return
    applications.value[index] = { id: editingItem.value.id, ...record }
  } else {
    applications.value.push({
      id: createCourseChangeApplicationId(),
      ...record,
    })
  }
  closeWizard()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)].filter((id) => {
    const item = applications.value.find((row) => row.id === id)
    return item && canDeleteChangeApplication(item)
  })
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmTitle.value = t('common.deleteConfirmation')
  confirmMessage.value =
    uniqueIds.length === 1
      ? tr('Are you sure you want to delete this course change application?')
      : tr('Are you sure you want to delete the selected course change applications?')
  confirmText.value = t('common.delete')
  confirmVariant.value = 'danger'
  pendingConfirmAction.value = 'delete'
  confirmVisible.value = true
}

function requestSubmit() {
  if (!canSubmitSelection.value) return
  submitConfirmVisible.value = true
}

function requestWithdraw() {
  if (!canWithdrawSelection.value) return
  withdrawConfirmVisible.value = true
}

function confirmSubmit() {
  const targets = applications.value.filter((item) => selectedIds.value.includes(item.id))
  applications.value = submitChangeApplications(targets, applications.value)
  selectedIds.value = []
  submitConfirmVisible.value = false
}

function confirmWithdraw() {
  const targets = applications.value.filter((item) => selectedIds.value.includes(item.id))
  applications.value = withdrawChangeApplications(targets, applications.value)
  selectedIds.value = []
  withdrawConfirmVisible.value = false
}

function confirmDialogAction() {
  if (pendingConfirmAction.value === 'delete') {
    applications.value = applications.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
    selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
    pendingDeleteIds.value = []
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  }
  pendingConfirmAction.value = null
  confirmVisible.value = false
}

function cancelDialogAction() {
  pendingDeleteIds.value = []
  pendingConfirmAction.value = null
  confirmVisible.value = false
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
  exportCourseChangeApplicationsToExcel(data, `course-change-application-${timestamp}.xlsx`, selectedFields)
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
  <CourseChangeWizard
    v-if="viewMode === 'create'"
    mode="create"
    :courses="formalCourses"
    @back="closeWizard"
    @save="handleSaveFromWizard"
  />

  <CourseChangeWizard
    v-else-if="viewMode === 'edit' && editingItem"
    mode="edit"
    :courses="formalCourses"
    :initial-application="editingItem"
    @back="closeWizard"
    @save="handleSaveFromWizard"
  />

  <CourseChangeWizard
    v-else-if="viewMode === 'detail' && detailItem"
    mode="detail"
    :courses="formalCourses"
    :initial-application="detailItem"
    @back="closeWizard"
  />

  <div v-else class="course-change-page">
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
        <div class="search-row search-row-2">
          <div class="search-fields">
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
            <template v-if="searchExpanded">
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
            </template>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreate">{{ tr('+ Create') }}</button>
        <button type="button" class="btn btn-default" :disabled="!deletableSelection" @click="requestDelete(selectedIds)">
          {{ t('common.delete') }}
        </button>
        <button type="button" class="btn btn-outline" @click="openExportModal">{{ t('common.export') }}</button>
        <button type="button" class="btn btn-outline" :disabled="!canSubmitSelection" @click="requestSubmit">
          {{ tr('Submit') }}
        </button>
        <button type="button" class="btn btn-outline btn-withdraw" :disabled="!canWithdrawSelection" @click="requestWithdraw">
          {{ tr('Withdraw') }}
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
                <td colspan="11" class="empty-cell">{{ t('common.noData') }}</td>
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
                <td>{{ item.courseName }}</td>
                <td>{{ getOfferingLabel(item.offering, initialDepartments) }}</td>
                <td>{{ tr(item.courseClassification) }}</td>
                <td>{{ item.credit }}</td>
                <td>{{ item.applicant }}</td>
                <td>{{ item.applicationDateTime }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button v-if="canEditChangeApplication(item)" type="button" class="link-btn" @click="openEdit(item)">
                      {{ t('common.edit') }}
                    </button>
                    <button v-if="!canEditChangeApplication(item)" type="button" class="link-btn" @click="openDetail(item)">
                      {{ tr('Details') }}
                    </button>
                    <button v-if="canViewChangeApprovalLog(item)" type="button" class="link-btn" @click="openApprovalLog(item)">
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
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmText"
      :confirm-variant="confirmVariant"
      @confirm="confirmDialogAction"
      @cancel="cancelDialogAction"
    />

    <ConfirmDialog
      :visible="submitConfirmVisible"
      :title="tr('Submit Confirmation')"
      :message="tr('Are you sure you want to submit the selected change application(s) for review?')"
      :confirm-text="tr('Submit')"
      confirm-variant="primary"
      @confirm="confirmSubmit"
      @cancel="submitConfirmVisible = false"
    />

    <ConfirmDialog
      :visible="withdrawConfirmVisible"
      :title="tr('Withdraw Confirmation')"
      :message="tr('Are you sure you want to withdraw the selected change application(s) to draft?')"
      :confirm-text="tr('Withdraw')"
      confirm-variant="primary"
      @confirm="confirmWithdraw"
      @cancel="withdrawConfirmVisible = false"
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
.course-change-page {
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
  --search-label-w: 148px;
  --search-input-w: 180px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
  width: 100%;
}

.search-row-2 {
  margin-top: 12px;
  justify-content: flex-start;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.search-row-2 .search-fields {
  flex: 0 1 auto;
}

.search-item {
  display: grid;
  grid-template-columns: var(--search-label-w) var(--search-input-w);
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.search-item label {
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
  text-align: right;
}

.search-input,
.search-select {
  width: var(--search-input-w);
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.search-select.is-empty {
  color: #9ca3af;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
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
  cursor: pointer;
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

.btn-default:disabled,
.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-withdraw {
  border-color: #ef4444;
  color: #ef4444;
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
</style>
