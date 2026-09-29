<script setup>
/**
 * 学生维度「新增」· 学生选择器（可搜，多选）
 */
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import {
  listAdminAddStudentCandidates,
  getAdminAddStudentFilterOptions,
  filterAdminAddStudentCandidates,
} from '../../data/courseRegistration/registrationResult.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  /** 打开时预勾选（主弹窗已选） */
  initialSelected: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'select'])

const { t } = useAppI18n()

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
/** @type {import('vue').Ref<Map<string, object>>} */
const selectedMap = ref(new Map())
const currentPage = ref(1)
const pageSize = ref(10)
const errorKey = ref('')

const filterOptions = computed(() => getAdminAddStudentFilterOptions())
const allCandidates = computed(() => listAdminAddStudentCandidates())
const filteredRows = computed(() =>
  filterAdminAddStudentCandidates(allCandidates.value, appliedSearch.value),
)
const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const selectedCount = computed(() => selectedMap.value.size)
const selectedHint = computed(() => {
  if (!selectedCount.value) return ''
  return t('courseRegistration.result.selectedStudents', { count: selectedCount.value })
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    searchForm.value = emptySearch()
    appliedSearch.value = emptySearch()
    const map = new Map()
    for (const row of props.initialSelected || []) {
      if (row?.studentId) map.set(row.studentId, { ...row })
    }
    selectedMap.value = map
    currentPage.value = 1
    pageSize.value = 10
    errorKey.value = ''
  },
)

function emptySearch() {
  return { studentId: '', studentName: '', faculty: '' }
}

function isSelected(studentId) {
  return selectedMap.value.has(studentId)
}

function toggleRow(row) {
  const next = new Map(selectedMap.value)
  if (next.has(row.studentId)) next.delete(row.studentId)
  else next.set(row.studentId, { ...row })
  selectedMap.value = next
  errorKey.value = ''
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
  if (!selectedCount.value) {
    errorKey.value = 'courseRegistration.result.addStudentRequired'
    return
  }
  emit(
    'select',
    [...selectedMap.value.values()].map((row) => ({ ...row })),
  )
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="pick-overlay" @click="handleOverlayClick">
      <div class="pick-panel" role="dialog" aria-modal="true">
        <div class="pick-header">
          <h2 class="pick-title">{{ t('courseRegistration.result.pickStudentTitle') }}</h2>
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

          <p class="pick-hint">{{ t('courseRegistration.result.addStudentMultiHint') }}</p>

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
                  <th>{{ t('courseRegistration.result.studentCategory') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.studentId"
                  class="clickable-row"
                  @click="toggleRow(row)"
                >
                  <td class="col-check" @click.stop>
                    <input
                      type="checkbox"
                      :checked="isSelected(row.studentId)"
                      @change="toggleRow(row)"
                    />
                  </td>
                  <td>{{ row.studentId }}</td>
                  <td>{{ row.studentName }}</td>
                  <td>{{ genderLabel(row.gender) }}</td>
                  <td>{{ row.faculty || '—' }}</td>
                  <td>{{ formatIntakeBatch(row.intake) }}</td>
                  <td>{{ row.studentCategory || '—' }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="7" class="empty-cell">{{ t('common.noData') }}</td>
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
          <p v-if="selectedHint" class="selected-hint">{{ selectedHint }}</p>
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
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 24px;
}
.pick-panel {
  width: min(1000px, 96vw);
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
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.pick-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.pick-close {
  border: none;
  background: transparent;
  font-size: 22px;
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
.pick-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}
.pick-search-row {
  align-items: end;
}
.search-item--compact {
  min-width: 140px;
}
.search-item--faculty {
  min-width: 180px;
}
.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
  max-height: 360px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th,
.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}
.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}
.col-check {
  width: 40px;
  text-align: center;
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
  padding: 24px !important;
}
.field-error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}
.selected-hint {
  margin: 0;
  font-size: 13px;
  color: #2563eb;
}
.pick-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}
.btn {
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
.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
