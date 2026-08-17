<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import {
  listGlobalBatchParticipants,
  filterBatchRosterStudents,
  formatRosterIntake,
} from '../../data/courseRegistration/batchStudentRoster.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const emptyFilters = () => ({ studentId: '', studentName: '' })
const searchForm = ref(emptyFilters())
const appliedSearch = ref(emptyFilters())
const currentPage = ref(1)
const pageSize = ref(20)

const title = computed(() =>
  props.batch?.name
    ? t('courseRegistration.batch.globalScopeRosterForBatch', { name: props.batch.name })
    : t('courseRegistration.batch.globalScopeRosterTitle'),
)

const subtitle = computed(() => {
  if (!props.batch) return ''
  const session = props.batch.academicSession || props.batch.semester || ''
  const typeLabel = props.batch.type ? getRegistrationTypeLabel(props.batch.type, t) : ''
  const source = t('courseRegistration.batch.globalScopeSourceHint')
  return [session, typeLabel, source].filter(Boolean).join(' · ')
})

const allRows = computed(() => listGlobalBatchParticipants(props.batch))

const filteredRows = computed(() =>
  filterBatchRosterStudents(allRows.value, appliedSearch.value),
)

const listTotal = computed(() => allRows.value.length)
const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch(
  () => [props.visible, props.batch],
  () => {
    if (!props.visible) return
    searchForm.value = emptyFilters()
    appliedSearch.value = emptyFilters()
    currentPage.value = 1
  },
)

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptyFilters()
  appliedSearch.value = emptyFilters()
  currentPage.value = 1
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="global-scope-roster-drawer"
    @close="emit('close')"
  >
    <template v-if="batch">
      <div class="global-scope-roster-body">
        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                <input
                  v-model="searchForm.studentId"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                <input
                  v-model="searchForm.studentName"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
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

        <div class="drawer-toolbar">
          <span class="drawer-meta">
            {{ t('courseRegistration.batch.globalScopeRosterMeta', { count: listTotal }) }}
          </span>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                  <th>{{ t('courseRegistration.monitor.programme') }}</th>
                  <th>{{ t('courseRegistration.batch.rosterIntake') }}</th>
                  <th>{{ t('courseRegistration.batch.rosterFaculty') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in paginatedRows" :key="row.studentId">
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td>{{ row.studentId }}</td>
                  <td>{{ row.studentName }}</td>
                  <td>{{ row.programme || '—' }}</td>
                  <td>{{ formatRosterIntake(row.intake) }}</td>
                  <td>{{ row.faculty || '—' }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="6" class="empty-cell">
                    <div class="empty-block">
                      <p class="empty-title">{{ t('common.noData') }}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="totalCount > 0" class="pagination-bar">
            <TablePagination
              v-model="currentPage"
              v-model:page-size="pageSize"
              :total="totalCount"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">
        {{ t('common.close') }}
      </button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.global-scope-roster-drawer :deep(.drawer-panel) {
  width: min(1200px, 96vw);
}

.global-scope-roster-drawer :deep(.drawer-scroll) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.global-scope-roster-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  gap: 0;
}

.global-scope-roster-body .search-bar {
  flex-shrink: 0;
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.global-scope-roster-body .search-bar .search-item {
  gap: 4px;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  background: #fff;
}

.drawer-meta {
  margin-left: auto;
  font-size: 13px;
  color: #6b7280;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fff;
}

.pagination-bar {
  flex-shrink: 0;
  padding: 8px 16px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 4px 10px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f9fafb;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.empty-cell {
  text-align: center;
  padding: 48px 16px !important;
  border-bottom: none;
}

.empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-title {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
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
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-default:hover {
  border-color: #9ca3af;
  color: #111827;
}
</style>
