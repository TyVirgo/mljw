<script setup>
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import {
  listSpecialPickCandidates,
  getSpecialPickFilterOptions,
} from '../../data/courseRegistration/batchStudentRoster.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batchId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'select'])

const { t } = useAppI18n()

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const selectedId = ref('')
const selectedRow = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const errorKey = ref('')

const filterOptions = computed(() => getSpecialPickFilterOptions())

const filteredRows = computed(() =>
  listSpecialPickCandidates(props.batchId, appliedSearch.value),
)
const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch(
  () => [props.visible, props.batchId],
  ([visible]) => {
    if (!visible) return
    searchForm.value = emptySearch()
    appliedSearch.value = emptySearch()
    selectedId.value = ''
    selectedRow.value = null
    currentPage.value = 1
    pageSize.value = 10
    errorKey.value = ''
  },
)

function selectRow(row) {
  selectedId.value = row.studentId
  selectedRow.value = row
  errorKey.value = ''
}

function emptySearch() {
  return {
    studentId: '',
    studentName: '',
    faculty: '',
  }
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function genderLabel(gender) {
  if (gender === 'M') return t('courseRegistration.result.genderMale')
  if (gender === 'F') return t('courseRegistration.result.genderFemale')
  return gender || '—'
}

function handleConfirm() {
  errorKey.value = ''
  if (!selectedRow.value) {
    errorKey.value = 'courseRegistration.batch.specialStudentRequired'
    return
  }
  emit('select', { ...selectedRow.value })
  emit('close')
}

function isSelected(studentId) {
  return selectedId.value === studentId
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="pick-overlay" @click="handleOverlayClick">
      <div class="pick-panel" role="dialog" aria-modal="true">
        <div class="pick-header">
          <h2 class="pick-title">{{ t('courseRegistration.batch.specialPickTitle') }}</h2>
          <button type="button" class="pick-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="pick-body">
          <div class="search-bar pick-search">
            <div class="search-row pick-search-row">
              <div class="search-fields">
                <div class="search-item search-item--compact">
                  <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                  <input
                    v-model="searchForm.studentId"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item search-item--compact">
                  <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                  <input
                    v-model="searchForm.studentName"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item search-item--faculty">
                  <label>{{ t('courseRegistration.batch.scopeFaculty') }}</label>
                  <select v-model="searchForm.faculty" class="search-select">
                    <option value="">{{ t('common.pleaseSelect') }}</option>
                    <option v-for="opt in filterOptions.faculties" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">
                  {{ t('common.search') }}
                </button>
                <button type="button" class="btn btn-default" @click="handleReset">
                  {{ t('common.reset') }}
                </button>
              </div>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check"></th>
                  <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                  <th>{{ t('courseRegistration.result.gender') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeFaculty') }}</th>
                  <th>{{ t('courseRegistration.monitor.intake') }}</th>
                  <th>{{ t('courseRegistration.result.volunteerRelativeSemester') }}</th>
                  <th>{{ t('courseRegistration.result.studentCategory') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.studentId"
                  class="clickable-row"
                  @click="selectRow(row)"
                >
                  <td class="col-check">
                    <input
                      type="radio"
                      name="special-student-pick"
                      :checked="isSelected(row.studentId)"
                      @change="selectRow(row)"
                    />
                  </td>
                  <td>{{ row.studentId }}</td>
                  <td>{{ row.studentName }}</td>
                  <td>{{ genderLabel(row.gender) }}</td>
                  <td>{{ row.faculty }}</td>
                  <td>{{ formatIntakeBatch(row.intake) }}</td>
                  <td>{{ row.relativeSemester ?? '—' }}</td>
                  <td>{{ row.studentCategory }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
          />

          <p v-if="errorKey" class="field-error">{{ t(errorKey) }}</p>
        </div>

        <div class="pick-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pick-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 24px;
}

.pick-panel {
  width: min(1100px, 96vw);
  max-height: min(92vh, 860px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.pick-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.pick-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.pick-close {
  appearance: none;
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}

.pick-body {
  padding: 16px 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.pick-search {
  margin: 0;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.pick-search-row {
  flex-wrap: nowrap;
  gap: 10px;
}

.pick-search :deep(.search-fields) {
  flex-wrap: nowrap;
  min-width: 0;
  flex: 1;
}

.pick-search :deep(.search-item--compact .search-input) {
  width: 120px;
  min-width: 96px;
}

.pick-search :deep(.search-item--faculty .search-select) {
  width: 200px;
  min-width: 140px;
  max-width: 240px;
}

.pick-search :deep(.search-actions) {
  flex-shrink: 0;
}

.table-wrap {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: auto;
  max-height: 360px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #111827;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.4;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  z-index: 1;
}

.data-table td {
  font-weight: 400;
  color: #111827;
}

.col-check {
  width: 36px;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: #f8fafc;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 28px 12px !important;
}

.field-error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}

.pick-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e7eb;
}

.pick-footer .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.pick-footer .btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.pick-footer .btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
