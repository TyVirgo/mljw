<script setup>
import { ref, computed, watch } from 'vue'
import ProgrammeIntakeCopyModal from '../components/programmeIntake/ProgrammeIntakeCopyModal.vue'
import ProgrammeIntakeCreateModal from '../components/programmeIntake/ProgrammeIntakeCreateModal.vue'
import ProgrammeIntakeFormModal from '../components/programmeIntake/ProgrammeIntakeFormModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import {
  initialProgrammeIntakes,
  programmeIntakeSchools,
  yearsOptions,
  activeOptions,
  createProgrammeIntakeId,
  buildProgrammeIntakeTree,
  filterTreeNodes,
} from '../data/programmeIntakes.js'
import {
  exportProgrammeIntakesToExcel,
  programmeIntakeExportFields,
} from '../utils/exportProgrammeIntakeExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(programmeIntakeExportFields)

const programmeIntakes = ref(initialProgrammeIntakes.map((item) => ({ ...item })))

const treeKeyword = ref('')
const expandedTreeIds = ref(new Set(['soc', 'soc-IBU', 'sob', 'stcm']))
const selectedTreeNodeId = ref('')
const selectedTreeFilter = ref(null)

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())
const searchExpanded = ref(false)

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const createModalVisible = ref(false)
const copyModalVisible = ref(false)
const copySourceItems = ref([])
const editModalVisible = ref(false)
const editingItem = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const exportModalVisible = ref(false)

function createEmptySearch() {
  return {
    programmeCode: '',
    programmeIntake: '',
    years: '',
    active: '',
    schoolId: '',
  }
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '').toLowerCase().includes(keyword.trim().toLowerCase())
}

function matchExact(value, selected) {
  if (!selected) return true
  return String(value) === String(selected)
}

const intakeTree = computed(() => buildProgrammeIntakeTree(programmeIntakes.value))
const displayTree = computed(() => filterTreeNodes(intakeTree.value, treeKeyword.value))

const treeFilteredItems = computed(() => {
  if (!selectedTreeFilter.value) return programmeIntakes.value
  const filter = selectedTreeFilter.value
  return programmeIntakes.value.filter((item) => {
    if (filter.type === 'school') return item.schoolId === filter.schoolId
    if (filter.type === 'programme') {
      return item.schoolId === filter.schoolId && item.programmeCode === filter.programmeCode
    }
    if (filter.type === 'year') {
      return (
        item.schoolId === filter.schoolId &&
        item.programmeCode === filter.programmeCode &&
        String(item.intake).startsWith(filter.intakeYear)
      )
    }
    return true
  })
})

const filteredProgrammeIntakes = computed(() => {
  const s = appliedSearch.value
  return treeFilteredItems.value.filter(
    (item) =>
      matchText(item.programmeCode, s.programmeCode) &&
      matchText(item.programmeIntake, s.programmeIntake) &&
      matchExact(item.years, s.years) &&
      matchExact(item.active, s.active) &&
      matchExact(item.schoolId, s.schoolId),
  )
})

const totalCount = computed(() => filteredProgrammeIntakes.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedProgrammeIntakes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProgrammeIntakes.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedProgrammeIntakes.value.length) return false
  return paginatedProgrammeIntakes.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

watch(displayTree, (nodes) => {
  const next = new Set(expandedTreeIds.value)
  nodes.forEach((school) => {
    if (school.children?.length) next.add(school.id)
  })
  expandedTreeIds.value = next
})

function isTreeExpanded(id) {
  return expandedTreeIds.value.has(id)
}

function toggleTreeExpand(id) {
  const next = new Set(expandedTreeIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedTreeIds.value = next
}

function isTreeActive(id) {
  return selectedTreeNodeId.value === id
}

function selectTreeNode(node) {
  selectedTreeNodeId.value = node.id
  selectedTreeFilter.value = {
    type: node.type,
    schoolId: node.schoolId,
    programmeCode: node.programmeCode,
    intakeYear: node.intakeYear,
  }
  currentPage.value = 1
  selectedIds.value = []
}

function clearTreeFilter() {
  selectedTreeNodeId.value = ''
  selectedTreeFilter.value = null
}

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  selectedIds.value = []
}

function handleReset() {
  searchForm.value = createEmptySearch()
  appliedSearch.value = createEmptySearch()
  clearTreeFilter()
  currentPage.value = 1
  selectedIds.value = []
}

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value
}

function toggleSelectAll(event) {
  const pageIds = paginatedProgrammeIntakes.value.map((item) => item.id)
  if (event.target.checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function openCreateModal() {
  createModalVisible.value = true
}

function openEditModal(item) {
  editingItem.value = { ...item }
  editModalVisible.value = true
}

function closeCreateModal() {
  createModalVisible.value = false
}

function closeEditModal() {
  editModalVisible.value = false
  editingItem.value = null
}

function handleCreateConfirm(records) {
  records.forEach((record) => {
    programmeIntakes.value.push({
      id: createProgrammeIntakeId(),
      ...record,
    })
  })
  closeCreateModal()
}

function handleEditSave(formData) {
  if (!editingItem.value) return
  const index = programmeIntakes.value.findIndex((item) => item.id === editingItem.value.id)
  if (index !== -1) {
    programmeIntakes.value[index] = { ...programmeIntakes.value[index], ...formData }
  }
  closeEditModal()
}

function openCopyModal() {
  if (!hasSelection.value) return
  copySourceItems.value = programmeIntakes.value
    .filter((item) => selectedIds.value.includes(item.id))
    .map((item) => ({ ...item }))
  copyModalVisible.value = true
}

function closeCopyModal() {
  copyModalVisible.value = false
  copySourceItems.value = []
}

function handleCopyConfirm(records) {
  records.forEach((record) => {
    programmeIntakes.value.push({
      id: createProgrammeIntakeId(),
      ...record,
    })
  })
  selectedIds.value = []
  closeCopyModal()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('pages.programmeIntake.deleteOne')
      : t('pages.programmeIntake.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function confirmDelete() {
  programmeIntakes.value = programmeIntakes.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function cancelDelete() {
  pendingDeleteIds.value = []
  confirmVisible.value = false
}

function openExportModal() {
  if (!filteredProgrammeIntakes.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedProgrammeIntakes.value
  } else if (exportScope === 'allResults') {
    data = filteredProgrammeIntakes.value
  } else {
    data = filteredProgrammeIntakes.value.filter((item) => selectedIds.value.includes(item.id))
  }

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportProgrammeIntakesToExcel(data, `programme-intake-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}
</script>

<template>
  <div class="programme-intake-page">
    <div class="page-card">
      <div class="programme-layout">
        <aside class="tree-panel">
          <div class="tree-search">
            <input v-model="treeKeyword" type="text" :placeholder="t('common.search')" />
            <button type="button" class="tree-search-btn" aria-label="Search tree">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
          <div class="tree-body">
            <div
              class="tree-node branch root-clear"
              :class="{ active: !selectedTreeNodeId }"
              @click="clearTreeFilter"
            >
              <span class="tree-toggle placeholder"></span>
              <span class="tree-label">{{ tr('All Programmes') }}</span>
            </div>
            <template v-for="school in displayTree" :key="school.id">
              <div
                class="tree-node branch"
                :class="{ active: isTreeActive(school.id) }"
                :style="{ paddingLeft: '12px' }"
                @click="selectTreeNode(school)"
              >
                <button
                  type="button"
                  class="tree-toggle"
                  :aria-label="isTreeExpanded(school.id) ? 'Collapse' : 'Expand'"
                  @click.stop="toggleTreeExpand(school.id)"
                >
                  {{ isTreeExpanded(school.id) ? '−' : '+' }}
                </button>
                <span class="tree-label">{{ school.label }}</span>
              </div>
              <template v-if="school.children?.length && isTreeExpanded(school.id)">
                <template v-for="programme in school.children" :key="programme.id">
                  <div
                    class="tree-node branch"
                    :class="{ active: isTreeActive(programme.id) }"
                    :style="{ paddingLeft: '28px' }"
                    @click.stop="selectTreeNode(programme)"
                  >
                    <button
                      v-if="programme.children?.length"
                      type="button"
                      class="tree-toggle"
                      :aria-label="isTreeExpanded(programme.id) ? 'Collapse' : 'Expand'"
                      @click.stop="toggleTreeExpand(programme.id)"
                    >
                      {{ isTreeExpanded(programme.id) ? '−' : '+' }}
                    </button>
                    <span v-else class="tree-toggle placeholder"></span>
                    <span class="tree-label">{{ programme.label }}</span>
                  </div>
                  <template v-if="programme.children?.length && isTreeExpanded(programme.id)">
                    <div
                      v-for="year in programme.children"
                      :key="year.id"
                      class="tree-node leaf"
                      :class="{ active: isTreeActive(year.id) }"
                      :style="{ paddingLeft: '44px' }"
                      @click.stop="selectTreeNode(year)"
                    >
                      <span class="tree-toggle placeholder"></span>
                      <span class="tree-label">{{ year.label }}</span>
                    </div>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </aside>

        <section class="main-panel">
          <div class="search-bar">
            <div class="search-grid">
              <div class="search-row search-row-main">
                <div class="search-fields">
                  <div class="search-item">
                    <label>{{ tr('Programme Code:') }}</label>
                    <input
                      v-model="searchForm.programmeCode"
                      type="text"
                      :placeholder="t('common.pleaseInput')"
                      @keyup.enter="handleSearch"
                    />
                  </div>
                  <div class="search-item search-item-wide">
                    <label>{{ tr('Programme Intake:') }}</label>
                    <input
                      v-model="searchForm.programmeIntake"
                      type="text"
                      :placeholder="t('common.pleaseInput')"
                      @keyup.enter="handleSearch"
                    />
                  </div>
                  <div class="search-item">
                    <label>{{ tr('Years:') }}</label>
                    <select v-model="searchForm.years">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="opt in yearsOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
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
                  <button type="button" class="toggle-link" @click="toggleSearchExpanded">
                    {{ searchExpanded ? t('common.collapse') : t('common.more') }}
                    <svg :class="{ up: searchExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>

              <div v-if="searchExpanded" class="search-row search-row-2">
                <div class="search-fields">
                  <div class="search-item">
                    <label>{{ tr('Active:') }}</label>
                    <select v-model="searchForm.active">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="opt in activeOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                  </div>
                  <div class="search-item search-item-school">
                    <label>{{ tr('School:') }}</label>
                    <select v-model="searchForm.schoolId">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="school in programmeIntakeSchools" :key="school.id" :value="school.id">
                        {{ school.label }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="toolbar">
            <button type="button" class="btn btn-primary" @click="openCreateModal">{{ t('common.create') }}</button>
            <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="openCopyModal">{{ t('common.copy') }}</button>
            <button type="button" class="btn btn-default" @click="openExportModal">{{ t('common.export') }}</button>
            <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">
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
                    <th>{{ t('common.serialNo') }}</th>
                    <th>{{ tr('Programme Intake') }}</th>
                    <th>{{ tr('Intake') }}</th>
                    <th>{{ tr('Years') }}</th>
                    <th>{{ tr('Programme Code') }}</th>
                    <th>{{ tr('Programme Name') }}</th>
                    <th>{{ tr('School') }}</th>
                    <th>{{ t('common.active') }}</th>
                    <th>{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!paginatedProgrammeIntakes.length">
                    <td colspan="10" class="empty-cell">{{ t('common.noData') }}</td>
                  </tr>
                  <tr v-for="(item, index) in paginatedProgrammeIntakes" :key="item.id">
                    <td class="col-check">
                      <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                    </td>
                    <td>{{ getRowNumber(index) }}</td>
                    <td>{{ item.programmeIntake }}</td>
                    <td>{{ item.intake }}</td>
                    <td>{{ item.years }}</td>
                    <td>{{ item.programmeCode }}</td>
                    <td>{{ item.programmeName }}</td>
                    <td>{{ item.school }}</td>
                    <td>
                      <span :class="item.active === 'Yes' ? 'status-yes' : 'status-no'">{{ item.active }}</span>
                    </td>
                    <td class="actions-cell">
                      <div class="actions-inner">
                        <button type="button" class="link-btn" @click="openEditModal(item)">{{ t('common.edit') }}</button>
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
        </section>
      </div>
    </div>

    <ProgrammeIntakeCopyModal
      :visible="copyModalVisible"
      :source-records="copySourceItems"
      :all-items="programmeIntakes"
      @close="closeCopyModal"
      @confirm="handleCopyConfirm"
    />

    <ProgrammeIntakeCreateModal
      :visible="createModalVisible"
      :all-items="programmeIntakes"
      @close="closeCreateModal"
      @confirm="handleCreateConfirm"
    />

    <ProgrammeIntakeFormModal
      :visible="editModalVisible"
      :initial-data="editingItem"
      @close="closeEditModal"
      @save="handleEditSave"
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
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.programme-intake-page {
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
  overflow: hidden;
}

.programme-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.tree-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f3f4f6;
  background: #fafafa;
}

.tree-search {
  display: flex;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.tree-search input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}

.tree-search-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #6b7280;
}

.tree-search-btn svg {
  width: 14px;
  height: 14px;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding-right: 10px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.tree-node:hover {
  background: #f3f4f6;
}

.tree-node.active {
  background: #eff6ff;
  color: #2563eb;
}

.tree-node.branch .tree-label {
  font-weight: 500;
}

.tree-node.root-clear .tree-label {
  font-weight: 600;
}

.tree-toggle {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #bfbfbf;
  border-radius: 2px;
  background: #fff;
  color: #595959;
  font-size: 12px;
  line-height: 1;
  font-weight: 400;
  padding: 0;
  cursor: pointer;
}

.tree-toggle:hover {
  border-color: #8c8c8c;
  color: #262626;
}

.tree-toggle.placeholder {
  visibility: hidden;
  pointer-events: none;
  border-color: transparent;
  background: transparent;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 16px 20px;
}

.search-bar {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.search-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.search-row-2 .search-fields {
  padding-left: 0;
}

.search-fields {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  min-width: 0;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.search-item label {
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
}

.search-item input,
.search-item select {
  width: 108px;
  min-width: 88px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.search-item-wide input {
  width: 128px;
}

.search-item-school select {
  width: 220px;
  min-width: 180px;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
  align-items: center;
}

.search-actions .btn {
  padding: 0 12px;
  white-space: nowrap;
}

.toggle-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #2563eb;
  padding: 0 4px;
  white-space: nowrap;
}

.toggle-link svg {
  width: 14px;
  height: 14px;
  transition: transform 0.15s;
}

.toggle-link svg.up {
  transform: rotate(180deg);
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
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

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-default:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
  font-size: 14px;
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
  width: 48px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.status-yes {
  color: #2563eb;
  font-weight: 500;
}

.status-no {
  color: #ef4444;
  font-weight: 500;
}

.actions-inner {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0;
}

.link-btn.delete {
  color: #ef4444;
}
</style>
