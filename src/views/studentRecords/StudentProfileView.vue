<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import DatePickerEn from '../../components/common/DatePickerEn.vue'
import StudentProfileFormDrawer from '../../components/studentRecords/StudentProfileFormDrawer.vue'
import StudentProfileDetailDrawer from '../../components/studentRecords/StudentProfileDetailDrawer.vue'
import StudentProfileImportModal from '../../components/studentRecords/StudentProfileImportModal.vue'
import StudentProfileTableHeaderLabel from '../../components/studentRecords/StudentProfileTableHeaderLabel.vue'
import {
  studentCategoryOptions,
  studentStatusOptions,
  normalizeStudent,
  studentRecords,
  isChinaOrInternationalCategory,
  formatStudentPassExpiryEndDate,
  matchesStudentListFilters,
  getLatestStudentStatus,
} from '../../data/students.js'
import { getEnrollmentProgrammeNameOptions, getEnrollmentIntakeOptions, getEnrollmentProgrammeLevelOptions } from '../../data/studentEnrollmentOptions.js'
import { formatProgrammeLevelLabel } from '../../utils/formatProgrammeLevel.js'
import { nationalityOptions } from '../../data/nationalityOptions.js'
import {
  exportStudentProfilesToExcel,
  studentProfileExportFields,
} from '../../utils/exportStudentProfileExcel.js'
import { useListPageI18n } from '../../composables/useListPageI18n.js'
import { useStudentProfileFieldLabels } from '../../composables/useStudentProfileFieldLabels.js'
import { enterStudentPreview } from '../../data/mockCurrentStudent.js'
import '../../styles/list-page-search.css'

const emit = defineEmits(['preview-student'])

const { t, tr, translatedExportFields } = useListPageI18n(studentProfileExportFields)
const { fieldSearchLabel } = useStudentProfileFieldLabels()

const students = studentRecords

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())
const searchExpanded = ref(true)

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

const outstandingFeeOptions = ['Y', 'N']

function createEmptySearch() {
  return {
    studentId: '',
    studentName: '',
    chineseName: '',
    icNo: '',
    mobilePhone: '',
    programme: '',
    intake: '',
    status: '',
    studentType: '',
    nationality: '',
    registrationTime: '',
    programmeLevel: '',
    programmeStructure: '',
    expectedCompletionBatch: '',
    expectedGraduationBatch: '',
    outstandingFee: '',
    studentPassExpiryFrom: '',
    studentPassExpiryTo: '',
  }
}

function uniqueValues(getter) {
  return [...new Set(students.value.map(getter).filter(Boolean))].sort()
}

const programmeOptions = computed(() => {
  const fromCatalogue = getEnrollmentProgrammeNameOptions()
  const fromRecords = uniqueValues((item) => item.programme)
  return [...new Set([...fromCatalogue, ...fromRecords])].sort()
})

const intakeOptions = computed(() => {
  const fromCatalogue = getEnrollmentIntakeOptions()
  const fromRecords = uniqueValues((item) => item.intake)
  return [...new Set([...fromCatalogue, ...fromRecords])].sort()
})

const registrationTimeOptions = computed(() => uniqueValues((item) => item.registrationTime))
const programmeStructureOptions = computed(() => uniqueValues((item) => item.programmeStructure))
const expectedCompletionBatchOptions = computed(() => uniqueValues((item) => item.expectedCompletionBatch))
const expectedGraduationBatchOptions = computed(() => uniqueValues((item) => item.expectedGraduationBatch))

const programmeLevelOptions = getEnrollmentProgrammeLevelOptions()

const filteredStudents = computed(() =>
  students.value.filter((item) => matchesStudentListFilters(item, appliedSearch.value)),
)

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

const tableColumnCount = 23

function displayIcNo(item) {
  const category = item.studentType || item.studentCategory
  if (category !== 'Local') return '—'
  const value = String(item.icNo || item.basicInfo?.icNo || '').trim()
  return value || '—'
}

function displayMobilePhone(item) {
  const value = String(item.mobilePhone || item.contact?.mobilePhone || '').trim()
  return value || '—'
}

function displayCell(value) {
  const text = String(value ?? '').trim()
  return text || '—'
}

function displayProgrammeLevel(item) {
  const raw = item.programmeLevel || item.enrollment?.programmeLevel
  const label = formatProgrammeLevelLabel(raw, t)
  return label || '—'
}

function handlePreviewStudent(item) {
  if (enterStudentPreview(item)) {
    emit('preview-student')
  }
}

const previewTooltipVisible = ref(false)
const previewTooltipStyle = ref({ top: '0px', left: '0px' })

function showPreviewTooltip(event) {
  const target = event.currentTarget?.querySelector('button') ?? event.currentTarget
  if (!target?.getBoundingClientRect) return
  const rect = target.getBoundingClientRect()
  previewTooltipStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left + rect.width / 2}px`,
  }
  previewTooltipVisible.value = true
}

function hidePreviewTooltip() {
  previewTooltipVisible.value = false
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

function displayStudentStatus(item) {
  return formatStudentStatus(getLatestStudentStatus(item))
}

function formatTrackCategory(value) {
  const text = String(value || '').trim()
  if (!text) return '—'
  const key = `movementCategory.trackCategory.${text}`
  const translated = t(key)
  return translated !== key ? translated : tr(text)
}

function displayTrackCategory(item) {
  return formatTrackCategory(item.trackCategory || item.enrollment?.trackCategory)
}

function displayOutstandingFee(item) {
  const value = String(item.outstandingFee || item.basicInfo?.outstandingFee || '').trim().toUpperCase()
  return value === 'Y' || value === 'N' ? value : '—'
}

function displayStudentPassExpiry(item) {
  if (!isChinaOrInternationalCategory(item.studentType || item.studentCategory)) return '—'
  return formatStudentPassExpiryEndDate(item.basicInfo || item) || '—'
}
</script>

<template>
  <div class="student-profile-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ fieldSearchLabel('studentId') }}</label>
              <input
                v-model="searchForm.studentId"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('studentName') }}</label>
              <input
                v-model="searchForm.studentName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('chineseName') }}</label>
              <input
                v-model="searchForm.chineseName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('icNo') }}</label>
              <input
                v-model="searchForm.icNo"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('mobilePhone') }}</label>
              <input
                v-model="searchForm.mobilePhone"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('programme') }}</label>
              <select v-model="searchForm.programme" :class="{ 'is-empty': !searchForm.programme }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in programmeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('intake') }}</label>
              <select v-model="searchForm.intake" :class="{ 'is-empty': !searchForm.intake }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in intakeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('status') }}</label>
              <select v-model="searchForm.status" :class="{ 'is-empty': !searchForm.status }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in studentStatusOptions" :key="opt" :value="opt">{{ formatStudentStatus(opt) }}</option>
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
              <svg :class="{ up: searchExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="searchExpanded" class="search-row search-row-secondary">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ fieldSearchLabel('studentType') }}</label>
              <select v-model="searchForm.studentType" :class="{ 'is-empty': !searchForm.studentType }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in studentCategoryOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('nationality') }}</label>
              <select v-model="searchForm.nationality" :class="{ 'is-empty': !searchForm.nationality }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in nationalityOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('registrationTime') }}</label>
              <select v-model="searchForm.registrationTime" :class="{ 'is-empty': !searchForm.registrationTime }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in registrationTimeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('programmeLevel') }}</label>
              <select v-model="searchForm.programmeLevel" :class="{ 'is-empty': !searchForm.programmeLevel }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in programmeLevelOptions" :key="opt" :value="opt">
                  {{ formatProgrammeLevelLabel(opt, t) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('programmeStructure') }}</label>
              <select v-model="searchForm.programmeStructure" :class="{ 'is-empty': !searchForm.programmeStructure }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in programmeStructureOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('expectedCompletionBatch') }}</label>
              <select v-model="searchForm.expectedCompletionBatch" :class="{ 'is-empty': !searchForm.expectedCompletionBatch }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in expectedCompletionBatchOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('expectedGraduationBatch') }}</label>
              <select v-model="searchForm.expectedGraduationBatch" :class="{ 'is-empty': !searchForm.expectedGraduationBatch }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in expectedGraduationBatchOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ fieldSearchLabel('outstandingFee') }}</label>
              <select v-model="searchForm.outstandingFee" :class="{ 'is-empty': !searchForm.outstandingFee }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in outstandingFeeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item search-item-date-range">
              <label class="search-date-range-label">{{ fieldSearchLabel('studentPassExpiryDate') }}</label>
              <div class="search-date-range">
                <DatePickerEn v-model="searchForm.studentPassExpiryFrom" class="search-date-picker" />
                <span class="search-date-range-sep">{{ t('common.to') }}</span>
                <DatePickerEn v-model="searchForm.studentPassExpiryTo" class="search-date-picker search-date-picker-end" />
              </div>
            </div>
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
                <th class="col-check col-sticky-left col-sticky-left-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                <th class="col-no col-sticky-left col-sticky-left-no">{{ t('common.serialNo') }}</th>
                <th class="col-student-id col-sticky-left col-sticky-left-id"><StudentProfileTableHeaderLabel field="studentId" /></th>
                <th class="col-student-name col-sticky-left col-sticky-left-name"><StudentProfileTableHeaderLabel field="studentName" /></th>
                <th><StudentProfileTableHeaderLabel field="chineseName" /></th>
                <th><StudentProfileTableHeaderLabel field="icNo" /></th>
                <th><StudentProfileTableHeaderLabel field="mobilePhone" /></th>
                <th><StudentProfileTableHeaderLabel field="status" /></th>
                <th><StudentProfileTableHeaderLabel field="trackCategory" /></th>
                <th><StudentProfileTableHeaderLabel field="intake" /></th>
                <th><StudentProfileTableHeaderLabel field="programmeCode" /></th>
                <th><StudentProfileTableHeaderLabel field="nationality" /></th>
                <th><StudentProfileTableHeaderLabel field="studentType" /></th>
                <th><StudentProfileTableHeaderLabel field="programme" /></th>
                <th><StudentProfileTableHeaderLabel field="programmeLevel" /></th>
                <th><StudentProfileTableHeaderLabel field="programmeStructure" /></th>
                <th><StudentProfileTableHeaderLabel field="registrationTime" /></th>
                <th><StudentProfileTableHeaderLabel field="expectedCompletionBatch" /></th>
                <th><StudentProfileTableHeaderLabel field="expectedGraduationBatch" /></th>
                <th><StudentProfileTableHeaderLabel field="outstandingFee" /></th>
                <th class="col-pass-expiry"><StudentProfileTableHeaderLabel field="studentPassExpiryDate" /></th>
                <th><StudentProfileTableHeaderLabel field="gender" /></th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedStudents.length">
                <td :colspan="tableColumnCount" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedStudents" :key="item.id">
                <td class="col-check col-sticky-left col-sticky-left-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td class="col-no col-sticky-left col-sticky-left-no">{{ getRowNumber(index) }}</td>
                <td class="col-student-id col-sticky-left col-sticky-left-id">{{ item.studentId }}</td>
                <td class="col-student-name col-sticky-left col-sticky-left-name">{{ item.name }}</td>
                <td>{{ item.nameCn }}</td>
                <td>{{ displayIcNo(item) }}</td>
                <td>{{ displayMobilePhone(item) }}</td>
                <td>{{ displayStudentStatus(item) }}</td>
                <td>{{ displayTrackCategory(item) }}</td>
                <td>{{ item.intake }}</td>
                <td>{{ item.programmeCode }}</td>
                <td>{{ item.nationality || item.basicInfo?.nationality }}</td>
                <td>{{ tr(item.studentType) }}</td>
                <td>{{ item.programme }}</td>
                <td>{{ displayProgrammeLevel(item) }}</td>
                <td>{{ displayCell(item.programmeStructure || item.enrollment?.programmeStructure) }}</td>
                <td>{{ displayCell(item.registrationTime || item.enrollment?.registrationTime) }}</td>
                <td>{{ displayCell(item.expectedCompletionBatch || item.enrollment?.expectedCompletionBatch) }}</td>
                <td>{{ displayCell(item.expectedGraduationBatch || item.enrollment?.expectedGraduationBatch) }}</td>
                <td>{{ displayOutstandingFee(item) }}</td>
                <td class="col-pass-expiry">{{ displayStudentPassExpiry(item) }}</td>
                <td>{{ tr(item.gender) }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openDetailDrawer(item)">{{ tr('Details') }}</button>
                    <button type="button" class="link-btn" @click="openEditDrawer(item)">{{ t('common.edit') }}</button>
                    <span
                      class="preview-action-wrap"
                      @mouseenter="showPreviewTooltip"
                      @mouseleave="hidePreviewTooltip"
                      @focusin="showPreviewTooltip"
                      @focusout="hidePreviewTooltip"
                    >
                      <button type="button" class="link-btn" @click="handlePreviewStudent(item)">
                        {{ t('studentProfile.previewAsStudent') }}
                      </button>
                    </span>
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

    <Teleport to="body">
      <span
        v-if="previewTooltipVisible"
        class="preview-action-tooltip-fixed"
        role="tooltip"
        :style="previewTooltipStyle"
      >
        {{ t('studentProfile.previewAsStudentHint') }}
      </span>
    </Teleport>
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

.col-student-id {
  min-width: 120px;
}

.col-student-name {
  min-width: 140px;
}

.col-sticky-left {
  position: sticky;
  z-index: 2;
  background: #fff;
}

.data-table thead .col-sticky-left {
  background: #f9fafb;
  z-index: 4;
}

.data-table tbody tr:hover .col-sticky-left {
  background: #fafafa;
}

.col-sticky-left-check {
  left: 0;
  border-right: 1px solid #f3f4f6;
}

.col-sticky-left-no {
  left: 44px;
  border-right: 1px solid #f3f4f6;
}

.col-sticky-left-id {
  left: 100px;
  border-right: 1px solid #f3f4f6;
}

.col-sticky-left-name {
  left: 220px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.08);
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
  min-width: 240px;
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

.preview-action-wrap {
  display: inline-flex;
}

.preview-action-tooltip-fixed {
  position: fixed;
  transform: translateX(-50%);
  width: max-content;
  max-width: min(280px, calc(100vw - 24px));
  padding: 8px 10px;
  border-radius: 6px;
  background: #1f2937;
  color: #fff;
  font-size: 12px;
  line-height: 1.45;
  text-align: center;
  white-space: normal;
  pointer-events: none;
  z-index: 2000;
}

.preview-action-tooltip-fixed::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: #1f2937;
}

.student-profile-page .search-item-date-range {
  flex: 0 0 auto;
  flex-wrap: nowrap;
  max-width: 100%;
  gap: 8px;
}

.student-profile-page .search-date-range-label {
  flex-shrink: 0;
}

.student-profile-page .search-date-range {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  width: fit-content;
  max-width: 100%;
}

.student-profile-page .search-date-range-sep {
  flex: 0 0 auto;
  font-size: 13px;
  color: #6b7280;
  line-height: 1;
  padding: 0 2px;
  user-select: none;
}

.student-profile-page .search-date-range :deep(.search-date-picker.date-picker-en) {
  position: relative;
  width: 124px;
  min-width: 124px;
  max-width: 124px;
  flex: 0 0 124px;
}

.student-profile-page .search-date-range :deep(.date-picker-input-wrap) {
  width: 124px;
  height: 32px;
}

.student-profile-page .search-date-range :deep(.date-picker-input) {
  width: 124px;
  min-width: 124px;
  max-width: 124px;
  height: 32px;
  padding: 0 30px 0 10px;
  font-size: 13px;
}

.student-profile-page .search-date-range :deep(.date-picker-trigger) {
  width: 30px;
  height: 32px;
}

.student-profile-page .search-date-range :deep(.date-picker-panel) {
  z-index: 120;
}

.student-profile-page .search-date-range :deep(.search-date-picker-end .date-picker-panel) {
  left: auto;
  right: 0;
}

.col-pass-expiry {
  min-width: 200px;
}
</style>
