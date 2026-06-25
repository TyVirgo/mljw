<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import { useListPageI18n } from '../../composables/useListPageI18n.js'
import {
  buildStatisticsRows,
  movementStatisticsStatusOptions,
} from '../../data/movementStatisticsQueue.js'
import { movementStatisticsExportFields } from '../../data/movementStatisticsExportFields.js'
import { exportMovementStatisticsToExcel } from '../../utils/exportMovementStatisticsExcel.js'

const { t, tr, translatedExportFields } = useListPageI18n(movementStatisticsExportFields)

const searchExpanded = ref(true)
const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const exportModalVisible = ref(false)

const countColumns = [
  'programmeTransfer',
  'deferment',
  'withdrawal',
  'resumption',
  'outboundMobility',
  'expel',
  'incomplete',
  'completion',
  'completionWithoutGraduation',
  'inboundMobility',
  'iep',
]

function createEmptySearch() {
  return {
    academicSession: '',
    programmeCode: '',
    status: '',
    studentId: '',
    studentName: '',
  }
}

const fullRows = computed(() => buildStatisticsRows(t, appliedSearch.value))

const totalCount = computed(() => fullRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return fullRows.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedItems.value.length) return false
  return paginatedItems.value.every((item) => selectedKeys.value.includes(item.groupKey))
})

const hasSelection = computed(() => selectedKeys.value.length > 0)

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  selectedKeys.value = []
}

function handleReset() {
  searchForm.value = createEmptySearch()
  appliedSearch.value = createEmptySearch()
  currentPage.value = 1
  selectedKeys.value = []
}

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value
}

function toggleSelectAll(event) {
  const pageKeys = paginatedItems.value.map((item) => item.groupKey)
  if (event.target.checked) {
    selectedKeys.value = [...new Set([...selectedKeys.value, ...pageKeys])]
  } else {
    selectedKeys.value = selectedKeys.value.filter((key) => !pageKeys.includes(key))
  }
}

function toggleSelect(groupKey) {
  if (selectedKeys.value.includes(groupKey)) {
    selectedKeys.value = selectedKeys.value.filter((key) => key !== groupKey)
  } else {
    selectedKeys.value = [...selectedKeys.value, groupKey]
  }
}

function openExportModal() {
  if (!fullRows.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedItems.value
  } else if (exportScope === 'allResults') {
    data = fullRows.value
  } else {
    data = fullRows.value.filter((item) => selectedKeys.value.includes(item.groupKey))
  }

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportMovementStatisticsToExcel(
    data,
    `movement-statistics-${timestamp}.xlsx`,
    selectedFields,
    { t, tr },
  )
  exportModalVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedKeys.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function statusLabel(status) {
  const map = {
    Draft: t('deferment.status.draft'),
    'In Progress': t('deferment.status.inProgress'),
    'Update Required': t('deferment.status.updateRequired'),
    Approved: t('deferment.status.approved'),
    Rejected: t('deferment.status.rejected'),
    Cancelled: t('deferment.status.cancelled'),
  }
  return map[status] || status
}
</script>

<template>
  <div class="movement-statistics-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('movementStatistics.search.academicSession') }}</label>
              <input
                v-model="searchForm.academicSession"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>
            <div class="search-item">
              <label>{{ t('movementStatistics.search.programmeCode') }}</label>
              <input
                v-model="searchForm.programmeCode"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
              />
            </div>
            <div class="search-item">
              <label>{{ tr('Status') }}</label>
              <select v-model="searchForm.status" class="search-select" :class="{ 'is-empty': !searchForm.status }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in movementStatisticsStatusOptions" :key="opt" :value="opt">
                  {{ statusLabel(opt) }}
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
                <label>{{ tr('Student ID') }}</label>
                <input
                  v-model="searchForm.studentId"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>
              <div class="search-item">
                <label>{{ tr('Student Name') }}</label>
                <input
                  v-model="searchForm.studentName"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-outline" @click="openExportModal">
          {{ t('common.export') }}
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
                <th>{{ t('movementStatistics.columns.schoolCode') }}</th>
                <th>{{ t('movementStatistics.columns.programmeCode') }}</th>
                <th>{{ t('movementStatistics.columns.intake') }}</th>
                <th v-for="col in countColumns" :key="col">{{ t(`movementStatistics.columns.${col}`) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedItems.length">
                <td colspan="16" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedItems" :key="item.groupKey">
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedKeys.includes(item.groupKey)"
                    @change="toggleSelect(item.groupKey)"
                  />
                </td>
                <td>{{ getRowNumber(index) }}</td>
                <td>{{ item.schoolCode }}</td>
                <td>{{ item.programmeCode }}</td>
                <td>{{ item.intake }}</td>
                <td v-for="col in countColumns" :key="col" class="count-cell">{{ item[col] }}</td>
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
.movement-statistics-page {
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
  padding: 14px;
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

.col-no {
  width: 56px;
}

.count-cell {
  text-align: center;
  min-width: 72px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.search-expand-enter-active,
.search-expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.search-expand-enter-from,
.search-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.btn-text svg {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.btn-text svg.up {
  transform: rotate(180deg);
}
</style>
