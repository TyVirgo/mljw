<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  listBatchRosterStudents,
  filterBatchRosterStudents,
  removeBatchRosterStudent,
  getBatchRosterProgrammeIntakeOptions,
  rosterSourceOptions,
} from '../../data/courseRegistration/batchStudentRoster.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const activeTab = ref('eligible')
const searchForm = ref({ keyword: '', source: '', programmeIntake: '' })
const appliedSearch = ref({ keyword: '', source: '', programmeIntake: '' })
const currentPage = ref(1)
const pageSize = ref(10)

const batchId = computed(() => props.batch?.id || '')

const title = computed(() => t('courseRegistration.batch.rosterTitle'))

const subtitle = computed(() => {
  if (!props.batch) return ''
  const session = props.batch.academicSession || props.batch.semester || ''
  const name = props.batch.name || ''
  return [session, name].filter(Boolean).join(' · ')
})

const scopeSummary = computed(() => {
  const scope = props.batch?.scope || []
  return scope.length ? scope.join(', ') : t('courseRegistration.batch.rosterScopeEmpty')
})

const programmeIntakeOptions = computed(() => getBatchRosterProgrammeIntakeOptions(batchId.value))

const eligibleCount = computed(() => listBatchRosterStudents(batchId.value, 'eligible').length)
const specialCount = computed(() => listBatchRosterStudents(batchId.value, 'special').length)

const allRows = computed(() => listBatchRosterStudents(batchId.value, activeTab.value))

const filteredRows = computed(() =>
  filterBatchRosterStudents(allRows.value, appliedSearch.value),
)

const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch(
  () => [props.visible, props.batch?.id],
  () => {
    if (!props.visible) return
    activeTab.value = 'eligible'
    searchForm.value = { keyword: '', source: '', programmeIntake: '' }
    appliedSearch.value = { keyword: '', source: '', programmeIntake: '' }
    currentPage.value = 1
  },
)

watch(activeTab, () => {
  currentPage.value = 1
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = { keyword: '', source: '', programmeIntake: '' }
  appliedSearch.value = { keyword: '', source: '', programmeIntake: '' }
  currentPage.value = 1
}

function sourceLabel(source) {
  const key = `courseRegistration.batch.rosterSource.${source}`
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : source
}

function programmeIntakeLabel(row) {
  return `${row.programme}×${row.intake}`
}

function handleRemove(row) {
  if (!window.confirm(t('courseRegistration.batch.rosterRemoveConfirm', { id: row.studentId }))) {
    return
  }
  removeBatchRosterStudent(batchId.value, activeTab.value, row.studentId)
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="batch-roster-drawer"
    @close="emit('close')"
  >
    <template v-if="batch">
      <div class="batch-roster-body">
        <p class="roster-scope-line">
          <span class="roster-scope-label">{{ t('courseRegistration.batch.scope') }}</span>
          {{ scopeSummary }}
        </p>

        <div class="tab-bar">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'special' }"
            @click="activeTab = 'special'"
          >
            {{ t('courseRegistration.batch.rosterTabSpecial') }}
            <span class="tab-count">{{ specialCount }}</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'eligible' }"
            @click="activeTab = 'eligible'"
          >
            {{ t('courseRegistration.batch.rosterTabEligible') }}
            <span class="tab-count">{{ eligibleCount }}</span>
          </button>
        </div>

        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ t('courseRegistration.batch.rosterSearchKeyword') }}</label>
                <input
                  v-model="searchForm.keyword"
                  type="text"
                  class="search-input"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.batch.rosterSourceLabel') }}</label>
                <select v-model="searchForm.source" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="opt in rosterSourceOptions" :key="opt" :value="opt">
                    {{ sourceLabel(opt) }}
                  </option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.batch.rosterProgrammeIntake') }}</label>
                <select v-model="searchForm.programmeIntake" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="opt in programmeIntakeOptions" :key="opt" :value="opt">
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

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                  <th>{{ t('courseRegistration.batch.rosterSourceLabel') }}</th>
                  <th>{{ t('courseRegistration.batch.rosterProgrammeIntake') }}</th>
                  <th>{{ t('courseRegistration.batch.rosterFaculty') }}</th>
                  <th>{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in paginatedRows" :key="row.studentId">
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td>{{ row.studentId }}</td>
                  <td>{{ row.studentName }}</td>
                  <td>{{ sourceLabel(row.source) }}</td>
                  <td>{{ programmeIntakeLabel(row) }}</td>
                  <td>{{ row.faculty }}</td>
                  <td>
                    <button type="button" class="link-btn danger" @click="handleRemove(row)">
                      {{ t('common.delete') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="7" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-if="totalCount > 0"
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
            :page-size-options="[5, 10, 20]"
          />
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
.batch-roster-drawer :deep(.drawer-panel) {
  width: min(1100px, 94vw);
}

.batch-roster-drawer :deep(.drawer-scroll) {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: #f3f4f6;
}

.batch-roster-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 16px 20px 20px;
  padding: 16px 20px 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  gap: 12px;
}

.batch-roster-body .search-bar {
  margin-bottom: 0;
  padding-bottom: 12px;
}

.roster-scope-line {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.roster-scope-label {
  font-weight: 600;
  color: #111827;
  margin-right: 6px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  appearance: none;
  border: none;
  background: transparent;
  padding: 10px 14px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
}

.tab-btn.active .tab-count {
  background: #dbeafe;
  color: #1d4ed8;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #fff;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
}

.data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 48px 16px !important;
  border-bottom: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.link-btn:hover {
  text-decoration: underline;
}

.link-btn.danger {
  color: #dc2626;
}
</style>
