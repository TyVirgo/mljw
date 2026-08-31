<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import TablePagination from '../common/TablePagination.vue'
import BatchSpecialStudentAddModal from './BatchSpecialStudentAddModal.vue'
import BatchSpecialStudentEditModal from './BatchSpecialStudentEditModal.vue'
import BatchSpecialStudentImportModal from './BatchSpecialStudentImportModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import {
  listGlobalBatchParticipants,
  listBatchRosterStudents,
  filterBatchRosterStudents,
  formatRosterIntake,
  removeBatchSpecialStudents,
} from '../../data/courseRegistration/batchStudentRoster.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
  /** 打开时外层 Tab：special | eligible */
  initialOuterTab: { type: String, default: 'eligible' },
  /** @deprecated 已取消内层轮次 Tab，保留 prop 以免调用方报错 */
  initialRound: { type: String, default: 'global' },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const emptyFilters = () => ({ studentId: '', studentName: '' })
const searchForm = ref(emptyFilters())
const appliedSearch = ref(emptyFilters())
const currentPage = ref(1)
const pageSize = ref(20)
const activeOuterTab = ref('eligible')
const selectedIds = ref([])
const addVisible = ref(false)
const editVisible = ref(false)
const importVisible = ref(false)
const specialRefreshKey = ref(0)

const batchId = computed(() => props.batch?.id || '')
const batchName = computed(() => props.batch?.name || '')

const title = computed(() =>
  batchName.value
    ? t('courseRegistration.batch.studentListForBatch', { name: batchName.value })
    : t('courseRegistration.batch.studentList'),
)

const subtitle = computed(() => {
  if (!props.batch) return ''
  const session = props.batch.academicSession || props.batch.semester || ''
  const typeLabel = props.batch.type ? getRegistrationTypeLabel(props.batch.type, t) : ''
  return session ? `${session} · ${typeLabel}` : typeLabel
})

const isEligibleTab = computed(() => activeOuterTab.value === 'eligible')
const isSpecialTab = computed(() => activeOuterTab.value === 'special')
const batchReadOnly = computed(
  () => props.batch?.status === 'active' || props.batch?.status === 'closed',
)
const batchReadOnlyHint = computed(() =>
  props.batch?.status === 'closed'
    ? t('courseRegistration.batch.closedReadOnlyHint')
    : t('courseRegistration.batch.activeReadOnlyHint'),
)
const showSpecialSelection = computed(() => isSpecialTab.value && !batchReadOnly.value)

const eligibleRows = computed(() => listGlobalBatchParticipants(props.batch))

const specialRows = computed(() => {
  void specialRefreshKey.value
  return listBatchRosterStudents(batchId.value, 'special')
})

const allRows = computed(() =>
  isSpecialTab.value ? specialRows.value : eligibleRows.value,
)

const filteredRows = computed(() =>
  filterBatchRosterStudents(allRows.value, appliedSearch.value),
)

const listTotal = computed(() => allRows.value.length)
const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const editSeed = computed(() => {
  if (selectedIds.value.length !== 1) return null
  return specialRows.value.find((row) => row.studentId === selectedIds.value[0]) || null
})

const allPageSelected = computed(() => {
  if (!isSpecialTab.value || !paginatedRows.value.length) return false
  return paginatedRows.value.every((row) => selectedIds.value.includes(row.studentId))
})

watch(
  () => [props.visible, props.batch, props.initialOuterTab],
  () => {
    if (!props.visible) return
    activeOuterTab.value =
      props.initialOuterTab === 'eligible' || props.initialOuterTab === 'special'
        ? props.initialOuterTab
        : 'eligible'
    searchForm.value = emptyFilters()
    appliedSearch.value = emptyFilters()
    currentPage.value = 1
    selectedIds.value = []
    addVisible.value = false
    editVisible.value = false
    importVisible.value = false
  },
)

watch(activeOuterTab, () => {
  currentPage.value = 1
  selectedIds.value = []
  searchForm.value = emptyFilters()
  appliedSearch.value = emptyFilters()
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptyFilters()
  appliedSearch.value = emptyFilters()
  currentPage.value = 1
}

function bumpSpecial() {
  specialRefreshKey.value += 1
}

function toggleSelectAll(event) {
  const checked = event.target.checked
  const pageIds = paginatedRows.value.map((row) => row.studentId)
  if (checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleRow(studentId, event) {
  if (event.target.checked) {
    if (!selectedIds.value.includes(studentId)) selectedIds.value = [...selectedIds.value, studentId]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => id !== studentId)
  }
}

function handleDeleteSelected() {
  if (batchReadOnly.value) return
  if (!selectedIds.value.length) {
    window.alert(t('courseRegistration.batch.specialSelectFirst'))
    return
  }
  if (!window.confirm(t('courseRegistration.batch.specialDeleteConfirm', { count: selectedIds.value.length }))) {
    return
  }
  removeBatchSpecialStudents(batchId.value, selectedIds.value)
  selectedIds.value = []
  bumpSpecial()
}

function openEditSelectable() {
  if (batchReadOnly.value) return
  if (!selectedIds.value.length) {
    window.alert(t('courseRegistration.batch.specialSelectFirst'))
    return
  }
  editVisible.value = true
}

function selectableLabel(row) {
  return row.selectable === false
    ? t('common.no')
    : t('common.yes')
}

function onSpecialSaved() {
  bumpSpecial()
}

function onSpecialEdited() {
  bumpSpecial()
  selectedIds.value = []
}

function onSpecialImported() {
  bumpSpecial()
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="scope-rule-roster-drawer"
    @close="emit('close')"
  >
    <template v-if="batch">
      <div class="scope-rule-roster-body">
        <div class="tab-bar outer-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: isEligibleTab }"
            @click="activeOuterTab = 'eligible'"
          >
            {{ t('courseRegistration.batch.rosterTabEligible') }}
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: isSpecialTab }"
            @click="activeOuterTab = 'special'"
          >
            {{ t('courseRegistration.batch.rosterTabSpecial') }}
          </button>
        </div>

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
          <div v-if="isSpecialTab" class="toolbar-actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="batchReadOnly"
              :title="batchReadOnly ? batchReadOnlyHint : undefined"
              @click="addVisible = true"
            >
              {{ t('common.create') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly"
              :title="batchReadOnly ? batchReadOnlyHint : undefined"
              @click="handleDeleteSelected"
            >
              {{ t('common.delete') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly"
              :title="batchReadOnly ? batchReadOnlyHint : undefined"
              @click="openEditSelectable"
            >
              {{ t('courseRegistration.batch.specialSelectable') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly"
              :title="batchReadOnly ? batchReadOnlyHint : undefined"
              @click="importVisible = true"
            >
              {{ t('common.import') }}
            </button>
          </div>
          <span v-else class="toolbar-spacer" aria-hidden="true" />
          <span class="drawer-meta">
            <template v-if="isEligibleTab">
              {{ t('courseRegistration.batch.globalScopeRosterMeta', { count: listTotal }) }}
            </template>
            <template v-else>
              {{ t('courseRegistration.batch.specialRosterMeta', { count: listTotal }) }}
            </template>
          </span>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-if="showSpecialSelection" class="col-check">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                  <th>{{ t('courseRegistration.monitor.programme') }}</th>
                  <th>{{ t('courseRegistration.batch.rosterIntake') }}</th>
                  <th>{{ t('courseRegistration.batch.rosterFaculty') }}</th>
                  <template v-if="isSpecialTab">
                    <th>{{ t('courseRegistration.batch.specialSelectable') }}</th>
                    <th>{{ t('courseRegistration.batch.specialRemark') }}</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in paginatedRows" :key="row.studentId">
                  <td v-if="showSpecialSelection" class="col-check">
                    <input
                      type="checkbox"
                      :checked="selectedIds.includes(row.studentId)"
                      @change="toggleRow(row.studentId, $event)"
                    />
                  </td>
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td>{{ row.studentId }}</td>
                  <td>{{ row.studentName }}</td>
                  <td>{{ row.programme || '—' }}</td>
                  <td>{{ formatRosterIntake(row.intake) }}</td>
                  <td>{{ row.faculty || '—' }}</td>
                  <template v-if="isSpecialTab">
                    <td>{{ selectableLabel(row) }}</td>
                    <td>{{ row.remark || '—' }}</td>
                  </template>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td :colspan="isSpecialTab ? (showSpecialSelection ? 9 : 8) : 6" class="empty-cell">
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

  <BatchSpecialStudentAddModal
    :visible="addVisible"
    :batch-id="batchId"
    @close="addVisible = false"
    @saved="onSpecialSaved"
  />

  <BatchSpecialStudentEditModal
    :visible="editVisible"
    :batch-id="batchId"
    :student-ids="selectedIds"
    :seed="editSeed"
    @close="editVisible = false"
    @saved="onSpecialEdited"
  />

  <BatchSpecialStudentImportModal
    :visible="importVisible"
    :batch-id="batchId"
    @close="importVisible = false"
    @imported="onSpecialImported"
  />
</template>

<style scoped>
.scope-rule-roster-drawer :deep(.drawer-panel) {
  width: min(1200px, 96vw);
}

.scope-rule-roster-drawer :deep(.drawer-scroll) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.scope-rule-roster-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  gap: 0;
}

.tab-bar {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  padding: 8px 16px 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.round-tabs {
  background: #fff;
  padding-top: 0;
}

.tab-btn {
  padding: 10px 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: #2563eb;
}

.tab-btn.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
  background: #eff6ff;
}

.tab-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-btn.active .tab-count {
  background: #dbeafe;
  color: #1d4ed8;
}

.scope-rule-roster-body .search-bar {
  flex-shrink: 0;
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.scope-rule-roster-body .search-bar :deep(.search-item),
.scope-rule-roster-body .search-bar .search-item {
  gap: 4px;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: nowrap;
  background: #fff;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  margin-left: 0;
  margin-right: 0;
  order: 1;
}

.toolbar-spacer {
  flex: 1 1 auto;
  order: 1;
  min-width: 0;
}

.drawer-meta {
  flex: 0 0 auto;
  margin-left: auto;
  margin-right: 0;
  text-align: right;
  white-space: nowrap;
  font-size: 13px;
  color: #6b7280;
  order: 2;
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

.col-check {
  width: 40px;
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

.btn:disabled,
.btn:disabled:hover {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
