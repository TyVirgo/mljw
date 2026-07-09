<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ConsentFormFormModal from '../../components/studentRecords/ConsentFormFormModal.vue'
import ConsentFormVersionHistoryModal from '../../components/studentRecords/ConsentFormVersionHistoryModal.vue'
import {
  consentForms,
  movementTypeKeys,
  consentFormStudentTypes,
  getConsentProgrammeLevelOptions,
  createConsentForm,
  updateConsentForm,
  deleteConsentForms,
} from '../../data/consentForms.js'
import { useAppI18n } from '../../composables/useAppI18n.js'

const { t, tr } = useAppI18n()

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const formVisible = ref(false)
const formMode = ref('create')
const editingItem = ref(null)

const historyVisible = ref(false)
const historyConfigId = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const programmeLevelOptions = getConsentProgrammeLevelOptions()

function createEmptySearch() {
  return {
    movementType: '',
    formName: '',
    studentType: '',
    programmeLevel: '',
  }
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(keyword.trim().toLowerCase())
}

function matchSelect(value, selected) {
  if (!selected) return true
  return value === selected
}

const filteredRows = computed(() => {
  const s = appliedSearch.value
  return consentForms.value.filter(
    (row) =>
      matchSelect(row.movementType, s.movementType) &&
      matchText(row.formName, s.formName) &&
      matchSelect(row.studentType, s.studentType) &&
      matchSelect(row.programmeLevel, s.programmeLevel),
  )
})

const totalCount = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedRows.value.length) return false
  return paginatedRows.value.every((item) => selectedIds.value.includes(item.id))
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
  const pageIds = paginatedRows.value.map((item) => item.id)
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

function openCreate() {
  formMode.value = 'create'
  editingItem.value = null
  formVisible.value = true
}

function openEdit(item) {
  formMode.value = 'edit'
  editingItem.value = { ...item }
  formVisible.value = true
}

function openHistory(item) {
  historyConfigId.value = item.id
  historyVisible.value = true
}

function closeHistory() {
  historyVisible.value = false
  historyConfigId.value = null
}

function closeForm() {
  formVisible.value = false
  editingItem.value = null
}

function handleFormSave(formData) {
  if (formMode.value === 'edit' && editingItem.value) {
    updateConsentForm(editingItem.value.id, {
      formName: formData.formName,
      applicableStudentScope: formData.applicableStudentScope,
      remark: formData.remark,
    })
  } else {
    createConsentForm(formData)
  }
  closeForm()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('consentForm.deleteOne')
      : t('consentForm.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function confirmDelete() {
  deleteConsentForms(pendingDeleteIds.value)
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function formatMovementType(type) {
  const key = `consentForm.movementType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
}

function formatStudentType(type) {
  const key = `consentForm.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
}

function formatProgrammeLevel(level) {
  const key = `consentForm.programmeLevel.${level}`
  const translated = t(key)
  return translated !== key ? translated : tr(level)
}

function formatApplicableStudentScope(scope) {
  if (!scope) return '—'
  const key = `consentForm.applicableStudentScope.${scope}`
  const translated = t(key)
  return translated !== key ? translated : scope
}
</script>

<template>
  <div class="consent-form-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('consentForm.search.movementType') }}</label>
              <select
                v-model="searchForm.movementType"
                class="search-select"
                :class="{ 'is-empty': !searchForm.movementType }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="key in movementTypeKeys" :key="key" :value="key">
                  {{ t(`consentForm.movementType.${key}`) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('consentForm.search.formName') }}</label>
              <input
                v-model="searchForm.formName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('consentForm.search.studentType') }}</label>
              <select
                v-model="searchForm.studentType"
                class="search-select"
                :class="{ 'is-empty': !searchForm.studentType }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in consentFormStudentTypes" :key="opt" :value="opt">
                  {{ t(`consentForm.studentType.${opt}`) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('consentForm.search.programmeLevel') }}</label>
              <select
                v-model="searchForm.programmeLevel"
                class="search-select"
                :class="{ 'is-empty': !searchForm.programmeLevel }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in programmeLevelOptions" :key="opt.value" :value="opt.value">
                  {{ formatProgrammeLevel(opt.label) }}
                </option>
              </select>
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreate">{{ t('common.create') }}</button>
        <button
          type="button"
          class="btn btn-danger-outline"
          :disabled="!hasSelection"
          @click="requestDelete(selectedIds)"
        >
          {{ t('common.delete') }}
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
                <th class="col-no">{{ t('common.serialNo') }}</th>
                <th>{{ t('consentForm.columns.formName') }}</th>
                <th>{{ t('consentForm.columns.movementType') }}</th>
                <th>{{ t('consentForm.columns.studentType') }}</th>
                <th>{{ t('consentForm.columns.programmeLevel') }}</th>
                <th>{{ t('consentForm.columns.applicableStudentScope') }}</th>
                <th>{{ t('consentForm.columns.remark') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in paginatedRows" :key="item.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                </td>
                <td class="col-no">{{ getRowNumber(index) }}</td>
                <td>{{ item.formName }}</td>
                <td>{{ formatMovementType(item.movementType) }}</td>
                <td>{{ formatStudentType(item.studentType) }}</td>
                <td>{{ formatProgrammeLevel(item.programmeLevel) }}</td>
                <td>{{ formatApplicableStudentScope(item.applicableStudentScope) }}</td>
                <td>{{ item.remark || '—' }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEdit(item)">{{ t('common.edit') }}</button>
                    <span class="sep">|</span>
                    <button type="button" class="link-btn" @click="openHistory(item)">
                      {{ t('consentForm.versionSnapshot.action') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination :total="totalCount" v-model="currentPage" v-model:page-size="pageSize" />
      </div>
    </div>

    <ConsentFormFormModal
      :visible="formVisible"
      :mode="formMode"
      :initial-data="editingItem"
      @close="closeForm"
      @save="handleFormSave"
    />

    <ConsentFormVersionHistoryModal
      :visible="historyVisible"
      :config-id="historyConfigId"
      @close="closeHistory"
      @updated="() => {}"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="confirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="confirmVisible = false"
    />
  </div>
</template>

<style scoped>
.consent-form-page {
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
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  border: none;
  background: #2563eb;
  color: #fff;
}

.btn-danger-outline {
  border: 1px solid #fca5a5;
  background: #fff;
  color: #dc2626;
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.col-check {
  width: 44px;
  text-align: center;
}

.col-no {
  width: 56px;
}

.col-sticky-right {
  position: sticky;
  right: 0;
  background: #fff;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.04);
  z-index: 1;
}

.data-table thead .col-sticky-right {
  background: #f9fafb;
  z-index: 2;
}

.actions-cell {
  min-width: 220px;
}

.actions-inner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.sep {
  color: #d1d5db;
}
</style>
