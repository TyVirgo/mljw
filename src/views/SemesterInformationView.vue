<script setup>
import { ref, computed } from 'vue'
import SemesterInfoFormModal from '../components/semester/SemesterInfoFormModal.vue'
import AcademicYearFormModal from '../components/semester/AcademicYearFormModal.vue'
import SemesterFormModal from '../components/semester/SemesterFormModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import YnSwitch from '../components/common/YnSwitch.vue'
import {
  initialSemesterRecords,
  createSemesterRecordId,
  getAcademicYearOptions,
  getSemesterOptions,
  formatDisplayDate,
  formatAcademicYearDisplay,
  formatSemesterDisplay,
  normalizeCurrentSemester,
} from '../data/semesterInfo.js'
import {
  initialAcademicYears,
  createAcademicYearId,
  formatAcademicYearName,
} from '../data/academicYears.js'
import {
  initialSemesters,
  createSemesterMasterId,
  formatSemesterSettingName,
} from '../data/semesters.js'
import { exportSemesterRecordsToExcel, semesterRecordExportFields } from '../utils/exportSemesterRecordExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, locale, translatedExportFields } = useListPageI18n(semesterRecordExportFields)

const activeTab = ref('year-semester')
const records = ref(initialSemesterRecords.map((item) => ({ ...item })))
const academicYears = ref(initialAcademicYears.map((item) => ({ ...item })))
const semesterMasters = ref(initialSemesters.map((item) => ({ ...item })))

const searchAcademicYear = ref('')
const searchSemester = ref('')
const searchCurrentOnly = ref(false)
const searchYearKeyword = ref('')
const searchSemesterKeyword = ref('')

const appliedSearch = ref({
  academicYear: '',
  semester: '',
  currentOnly: false,
})
const appliedYearSearch = ref('')
const appliedSemesterSearch = ref('')

const currentPage = ref(1)
const yearCurrentPage = ref(1)
const semesterCurrentPage = ref(1)
const pageSize = ref(10)

const modalVisible = ref(false)
const yearModalVisible = ref(false)
const semesterModalVisible = ref(false)
const modalMode = ref('create')
const yearModalMode = ref('create')
const semesterModalMode = ref('create')
const editingItem = ref(null)
const editingYearItem = ref(null)
const editingSemesterItem = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteId = ref(null)
const deleteTarget = ref('year-semester')

const exportModalVisible = ref(false)

const academicYearOptions = computed(() => getAcademicYearOptions(records.value))
const semesterOptions = computed(() => getSemesterOptions(records.value))

const filteredRecords = computed(() => {
  const { academicYear, semester, currentOnly } = appliedSearch.value
  return records.value.filter((item) => {
    if (academicYear && item.academicYear !== academicYear) return false
    if (semester && item.semester !== semester) return false
    if (currentOnly && item.currentSemester !== 'Yes') return false
    return true
  })
})

const totalCount = computed(() => filteredRecords.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const filteredAcademicYears = computed(() => {
  const keyword = appliedYearSearch.value.trim().toLowerCase()
  if (!keyword) return academicYears.value
  return academicYears.value.filter((item) => {
    const nameDisplay = formatAcademicYearName(item.name, locale.value).toLowerCase()
    return (
      item.code.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      nameDisplay.includes(keyword)
    )
  })
})

const yearTotalCount = computed(() => filteredAcademicYears.value.length)
const yearTotalPages = computed(() => Math.max(1, Math.ceil(yearTotalCount.value / pageSize.value)))

const paginatedAcademicYears = computed(() => {
  const start = (yearCurrentPage.value - 1) * pageSize.value
  return filteredAcademicYears.value.slice(start, start + pageSize.value)
})

const filteredSemesterMasters = computed(() => {
  const keyword = appliedSemesterSearch.value.trim().toLowerCase()
  if (!keyword) return semesterMasters.value
  return semesterMasters.value.filter((item) => {
    const nameDisplay = formatSemesterSettingName(item.name, locale.value).toLowerCase()
    return (
      item.code.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      nameDisplay.includes(keyword)
    )
  })
})

const semesterTotalCount = computed(() => filteredSemesterMasters.value.length)
const semesterTotalPages = computed(() =>
  Math.max(1, Math.ceil(semesterTotalCount.value / pageSize.value)),
)

const paginatedSemesterMasters = computed(() => {
  const start = (semesterCurrentPage.value - 1) * pageSize.value
  return filteredSemesterMasters.value.slice(start, start + pageSize.value)
})

const tabs = computed(() => [
  { id: 'year-semester', label: t('pages.semester.tabYearSemester') },
  { id: 'academic-year', label: t('pages.semester.tabAcademicYear') },
  { id: 'semester', label: t('pages.semester.tabSemester') },
])

function handleSearch() {
  appliedSearch.value = {
    academicYear: searchAcademicYear.value,
    semester: searchSemester.value,
    currentOnly: searchCurrentOnly.value,
  }
  currentPage.value = 1
}

function handleReset() {
  searchAcademicYear.value = ''
  searchSemester.value = ''
  searchCurrentOnly.value = false
  appliedSearch.value = { academicYear: '', semester: '', currentOnly: false }
  currentPage.value = 1
}

function handleYearSearch() {
  appliedYearSearch.value = searchYearKeyword.value
  yearCurrentPage.value = 1
}

function handleYearReset() {
  searchYearKeyword.value = ''
  appliedYearSearch.value = ''
  yearCurrentPage.value = 1
}

function handleSemesterSearch() {
  appliedSemesterSearch.value = searchSemesterKeyword.value
  semesterCurrentPage.value = 1
}

function handleSemesterReset() {
  searchSemesterKeyword.value = ''
  appliedSemesterSearch.value = ''
  semesterCurrentPage.value = 1
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

function openYearCreateModal() {
  yearModalMode.value = 'create'
  editingYearItem.value = null
  yearModalVisible.value = true
}

function openYearEditModal(item) {
  yearModalMode.value = 'edit'
  editingYearItem.value = { ...item }
  yearModalVisible.value = true
}

function closeYearModal() {
  yearModalVisible.value = false
  editingYearItem.value = null
}

function openSemesterCreateModal() {
  semesterModalMode.value = 'create'
  editingSemesterItem.value = null
  semesterModalVisible.value = true
}

function openSemesterEditModal(item) {
  semesterModalMode.value = 'edit'
  editingSemesterItem.value = { ...item }
  semesterModalVisible.value = true
}

function closeSemesterModal() {
  semesterModalVisible.value = false
  editingSemesterItem.value = null
}

function handleSave(formData) {
  if (modalMode.value === 'edit' && editingItem.value) {
    const index = records.value.findIndex((item) => item.id === editingItem.value.id)
    if (index !== -1) {
      const updated = { ...records.value[index], ...formData }
      records.value[index] = updated
      if (formData.currentSemester === 'Yes') {
        records.value = normalizeCurrentSemester(records.value, updated.id, 'Yes')
      }
    }
  } else {
    const id = createSemesterRecordId()
    records.value.push({ id, ...formData })
    if (formData.currentSemester === 'Yes') {
      records.value = normalizeCurrentSemester(records.value, id, 'Yes')
    }
  }
  closeModal()
}

function handleYearSave(formData) {
  if (yearModalMode.value === 'edit' && editingYearItem.value) {
    const index = academicYears.value.findIndex((item) => item.id === editingYearItem.value.id)
    if (index !== -1) {
      academicYears.value[index] = { ...academicYears.value[index], ...formData }
    }
  } else {
    academicYears.value.push({ id: createAcademicYearId(), ...formData })
  }
  closeYearModal()
}

function handleSemesterSave(formData) {
  if (semesterModalMode.value === 'edit' && editingSemesterItem.value) {
    const index = semesterMasters.value.findIndex((item) => item.id === editingSemesterItem.value.id)
    if (index !== -1) {
      semesterMasters.value[index] = { ...semesterMasters.value[index], ...formData }
    }
  } else {
    semesterMasters.value.push({ id: createSemesterMasterId(), ...formData })
  }
  closeSemesterModal()
}

function requestDelete(id) {
  pendingDeleteId.value = id
  deleteTarget.value = 'year-semester'
  confirmMessage.value = t('pages.semester.deleteOne')
  confirmVisible.value = true
}

function requestYearDelete(id) {
  pendingDeleteId.value = id
  deleteTarget.value = 'academic-year'
  confirmMessage.value = t('pages.semester.deleteAcademicYearOne')
  confirmVisible.value = true
}

function requestSemesterDelete(id) {
  pendingDeleteId.value = id
  deleteTarget.value = 'semester'
  confirmMessage.value = t('pages.semester.deleteSemesterOne')
  confirmVisible.value = true
}

function confirmDelete() {
  if (pendingDeleteId.value != null) {
    if (deleteTarget.value === 'academic-year') {
      academicYears.value = academicYears.value.filter((item) => item.id !== pendingDeleteId.value)
      if (yearCurrentPage.value > yearTotalPages.value) yearCurrentPage.value = yearTotalPages.value
    } else if (deleteTarget.value === 'semester') {
      semesterMasters.value = semesterMasters.value.filter((item) => item.id !== pendingDeleteId.value)
      if (semesterCurrentPage.value > semesterTotalPages.value) {
        semesterCurrentPage.value = semesterTotalPages.value
      }
    } else {
      records.value = records.value.filter((item) => item.id !== pendingDeleteId.value)
      if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
    }
  }
  pendingDeleteId.value = null
  confirmVisible.value = false
}

function cancelDelete() {
  pendingDeleteId.value = null
  confirmVisible.value = false
}

function toggleCurrentSemester(item, value) {
  const nextValue = value ? 'Yes' : 'No'
  const index = records.value.findIndex((row) => row.id === item.id)
  if (index === -1) return
  records.value[index] = { ...records.value[index], currentSemester: nextValue }
  if (nextValue === 'Yes') {
    records.value = normalizeCurrentSemester(records.value, item.id, 'Yes')
  }
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function getYearRowNumber(index) {
  return (yearCurrentPage.value - 1) * pageSize.value + index + 1
}

function getSemesterRowNumber(index) {
  return (semesterCurrentPage.value - 1) * pageSize.value + index + 1
}

function displayYear(year) {
  return formatAcademicYearDisplay(year, locale.value)
}

function displayYearName(name) {
  return formatAcademicYearName(name, locale.value)
}

function displaySemester(semester) {
  return formatSemesterDisplay(semester, locale.value)
}

function displaySemesterSettingName(name) {
  return formatSemesterSettingName(name, locale.value)
}

function toggleYearActivation(item, value) {
  const index = academicYears.value.findIndex((row) => row.id === item.id)
  if (index === -1) return
  academicYears.value[index] = {
    ...academicYears.value[index],
    activation: value ? 'Yes' : 'No',
  }
}

function toggleSemesterActivation(item, value) {
  const index = semesterMasters.value.findIndex((row) => row.id === item.id)
  if (index === -1) return
  semesterMasters.value[index] = {
    ...semesterMasters.value[index],
    activation: value ? 'Yes' : 'No',
  }
}

function openExportModal() {
  if (!filteredRecords.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedRecords.value
  } else if (exportScope === 'allResults') {
    data = filteredRecords.value
  } else {
    data = []
  }

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportSemesterRecordsToExcel(data, `academic-year-semester-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}
</script>

<template>
  <div class="semester-page">
    <div class="page-card">
      <div class="page-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tr(tab.label) }}
        </button>
      </div>

      <template v-if="activeTab === 'year-semester'">
        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ tr('Academic Year:') }}</label>
                <select
                  v-model="searchAcademicYear"
                  class="search-select"
                  :class="{ 'is-empty': !searchAcademicYear }"
                >
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in academicYearOptions" :key="opt" :value="opt">
                    {{ displayYear(opt) }}
                  </option>
                </select>
              </div>

              <div class="search-item">
                <label>{{ tr('Semester:') }}</label>
                <select v-model="searchSemester" class="search-select" :class="{ 'is-empty': !searchSemester }">
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in semesterOptions" :key="opt" :value="opt">
                    {{ displaySemester(opt) }}
                  </option>
                </select>
              </div>

              <div class="search-item search-item-switch">
                <label>{{ tr('Current Semester:') }}</label>
                <YnSwitch v-model="searchCurrentOnly" />
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
          <button type="button" class="btn btn-primary" @click="openCreateModal">{{ t('common.create') }}</button>
          <button type="button" class="btn btn-default" @click="openExportModal">{{ t('common.export') }}</button>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ tr('Academic Year') }}</th>
                  <th>{{ tr('Semester') }}</th>
                  <th>{{ tr('Semester Type') }}</th>
                  <th>{{ tr('Start Date') }}</th>
                  <th>{{ tr('End Date') }}</th>
                  <th>{{ tr('Current Semester') }}</th>
                  <th>{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedRecords.length">
                  <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
                <tr v-for="(item, index) in paginatedRecords" :key="item.id">
                  <td>{{ getRowNumber(index) }}</td>
                  <td>{{ displayYear(item.academicYear) }}</td>
                  <td>{{ displaySemester(item.semester) }}</td>
                  <td>{{ tr(item.semesterType) }}</td>
                  <td>{{ formatDisplayDate(item.startDate) }}</td>
                  <td>{{ formatDisplayDate(item.endDate) }}</td>
                  <td class="switch-cell">
                    <YnSwitch
                      :model-value="item.currentSemester === 'Yes'"
                      @update:model-value="(value) => toggleCurrentSemester(item, value)"
                    />
                  </td>
                  <td class="actions-cell">
                    <div class="actions-inner">
                      <button type="button" class="link-btn" @click="openEditModal(item)">{{ t('common.edit') }}</button>
                      <button type="button" class="link-btn delete" @click="requestDelete(item.id)">
                        {{ t('common.delete') }}
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
          />
        </div>
      </template>

      <template v-else-if="activeTab === 'academic-year'">
        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ tr('Academic Year:') }}</label>
                <input
                  v-model="searchYearKeyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>
            </div>

            <div class="search-actions">
              <button type="button" class="btn btn-primary" @click="handleYearSearch">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {{ t('common.search') }}
              </button>
              <button type="button" class="btn btn-default" @click="handleYearReset">
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
          <button type="button" class="btn btn-primary" @click="openYearCreateModal">
            {{ t('pages.semester.createAcademicYear') }}
          </button>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ tr('Academic Year Code') }}</th>
                  <th>{{ tr('Academic Year') }}</th>
                  <th>{{ tr('Activation') }}</th>
                  <th>{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedAcademicYears.length">
                  <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
                <tr v-for="(item, index) in paginatedAcademicYears" :key="item.id">
                  <td>{{ getYearRowNumber(index) }}</td>
                  <td>{{ item.code }}</td>
                  <td>{{ displayYearName(item.name) }}</td>
                  <td class="switch-cell">
                    <YnSwitch
                      :model-value="item.activation === 'Yes'"
                      @update:model-value="(value) => toggleYearActivation(item, value)"
                    />
                  </td>
                  <td class="actions-cell">
                    <div class="actions-inner">
                      <button type="button" class="link-btn" @click="openYearEditModal(item)">
                        {{ t('common.edit') }}
                      </button>
                      <button type="button" class="link-btn delete" @click="requestYearDelete(item.id)">
                        {{ t('common.delete') }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            :total="yearTotalCount"
            v-model="yearCurrentPage"
            v-model:page-size="pageSize"
          />
        </div>
      </template>

      <template v-else-if="activeTab === 'semester'">
        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ tr('Semester:') }}</label>
                <input
                  v-model="searchSemesterKeyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>
            </div>

            <div class="search-actions">
              <button type="button" class="btn btn-primary" @click="handleSemesterSearch">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {{ t('common.search') }}
              </button>
              <button type="button" class="btn btn-default" @click="handleSemesterReset">
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
          <button type="button" class="btn btn-primary" @click="openSemesterCreateModal">
            {{ t('pages.semester.createSemesterSetting') }}
          </button>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ tr('Semester Code') }}</th>
                  <th>{{ tr('Semester') }}</th>
                  <th>{{ tr('Activation') }}</th>
                  <th>{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedSemesterMasters.length">
                  <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
                <tr v-for="(item, index) in paginatedSemesterMasters" :key="item.id">
                  <td>{{ getSemesterRowNumber(index) }}</td>
                  <td>{{ item.code }}</td>
                  <td>{{ displaySemesterSettingName(item.name) }}</td>
                  <td class="switch-cell">
                    <YnSwitch
                      :model-value="item.activation === 'Yes'"
                      @update:model-value="(value) => toggleSemesterActivation(item, value)"
                    />
                  </td>
                  <td class="actions-cell">
                    <div class="actions-inner">
                      <button type="button" class="link-btn" @click="openSemesterEditModal(item)">
                        {{ t('common.edit') }}
                      </button>
                      <button type="button" class="link-btn delete" @click="requestSemesterDelete(item.id)">
                        {{ t('common.delete') }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            :total="semesterTotalCount"
            v-model="semesterCurrentPage"
            v-model:page-size="pageSize"
          />
        </div>
      </template>
    </div>

    <SemesterInfoFormModal
      :visible="modalVisible"
      :mode="modalMode"
      :initial-data="editingItem"
      :all-items="records"
      @close="closeModal"
      @save="handleSave"
    />

    <AcademicYearFormModal
      :visible="yearModalVisible"
      :mode="yearModalMode"
      :initial-data="editingYearItem"
      :all-items="academicYears"
      @close="closeYearModal"
      @save="handleYearSave"
    />

    <SemesterFormModal
      :visible="semesterModalVisible"
      :mode="semesterModalMode"
      :initial-data="editingSemesterItem"
      :all-items="semesterMasters"
      @close="closeSemesterModal"
      @save="handleSemesterSave"
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
      :has-selected-rows="false"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.semester-page {
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

.page-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.tab-btn {
  padding: 10px 20px;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
}

.tab-btn:hover {
  color: #2563eb;
}

.tab-btn.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
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
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f9fafb;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 10px 12px;
  color: #111827;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 32px 12px !important;
}

.switch-cell {
  width: 80px;
}

.actions-cell {
  white-space: nowrap;
}

.actions-inner {
  display: flex;
  gap: 12px;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.link-btn.delete {
  color: #ef4444;
}

.tab-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  gap: 8px;
}

.tab-placeholder-sub {
  font-size: 13px;
  color: #9ca3af;
}
</style>
