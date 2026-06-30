<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import MovementCategoryFormModal from '../../components/studentRecords/MovementCategoryFormModal.vue'
import MovementCategoryReasonModal from '../../components/studentRecords/MovementCategoryReasonModal.vue'
import {
  movementCategories,
  updateMovementCategory,
  getDistinctCategoryNames,
} from '../../data/movementCategories.js'
import { useAppI18n } from '../../composables/useAppI18n.js'

const { t } = useAppI18n()

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const currentPage = ref(1)
const pageSize = ref(10)

const formVisible = ref(false)
const editingItem = ref(null)

const reasonModalVisible = ref(false)
const reasonCategoryId = ref(null)

function createEmptySearch() {
  return {
    categoryName: '',
    categoryCode: '',
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

const categoryNameOptions = computed(() => getDistinctCategoryNames())

const filteredRows = computed(() => {
  const s = appliedSearch.value
  return movementCategories.value.filter(
    (row) =>
      matchSelect(row.categoryName, s.categoryName) &&
      matchText(row.categoryCode, s.categoryCode),
  )
})

const totalCount = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = createEmptySearch()
  appliedSearch.value = createEmptySearch()
  currentPage.value = 1
}

function openEdit(item) {
  editingItem.value = { ...item }
  formVisible.value = true
}

function closeForm() {
  formVisible.value = false
  editingItem.value = null
}

function handleFormSave(formData) {
  if (editingItem.value) {
    updateMovementCategory(editingItem.value.id, {
      categoryName: formData.categoryName,
      allowStudentApply: formData.allowStudentApply,
      autoImplement: formData.autoImplement,
      deleteOriginalCourseList: formData.deleteOriginalCourseList,
      presetNewProgrammeBatchList: formData.presetNewProgrammeBatchList,
      excludeGradedFromPreset: formData.excludeGradedFromPreset,
    })
  }
  closeForm()
}

function openReasonModal(item) {
  reasonCategoryId.value = item.id
  reasonModalVisible.value = true
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}
</script>

<template>
  <div class="movement-category-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('movementCategory.search.categoryName') }}</label>
              <select
                v-model="searchForm.categoryName"
                class="search-select"
                :class="{ 'is-empty': !searchForm.categoryName }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="name in categoryNameOptions" :key="name" :value="name">{{ name }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('movementCategory.search.categoryCode') }}</label>
              <input
                v-model="searchForm.categoryCode"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-no">{{ t('common.serialNo') }}</th>
                <th>{{ t('movementCategory.columns.categoryCode') }}</th>
                <th>{{ t('movementCategory.columns.categoryName') }}</th>
                <th class="col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedRows.length">
                <td colspan="4" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedRows" :key="item.id">
                <td class="col-no">{{ getRowNumber(index) }}</td>
                <td>{{ item.categoryCode }}</td>
                <td>{{ item.categoryName }}</td>
                <td class="actions-cell col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEdit(item)">{{ t('common.edit') }}</button>
                    <span class="sep">|</span>
                    <button type="button" class="link-btn" @click="openReasonModal(item)">
                      {{ t('movementCategory.setReason') }}
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

    <MovementCategoryFormModal
      :visible="formVisible"
      mode="edit"
      :initial-data="editingItem"
      @close="closeForm"
      @save="handleFormSave"
    />

    <MovementCategoryReasonModal
      :visible="reasonModalVisible"
      :category-id="reasonCategoryId"
      @close="reasonModalVisible = false"
    />
  </div>
</template>

<style scoped>
.movement-category-page {
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

.col-no {
  width: 56px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
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
  min-width: 140px;
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

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}
</style>
