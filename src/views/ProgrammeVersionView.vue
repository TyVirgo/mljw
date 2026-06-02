<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import TablePagination from '../components/common/TablePagination.vue'
import ExportModal from '../components/common/ExportModal.vue'
import ProgrammeVersionCreateModal from '../components/programme/ProgrammeVersionCreateModal.vue'
import ProgrammeVersionCreateVersionModal from '../components/programme/ProgrammeVersionCreateVersionModal.vue'
import ProgrammeVersionDetailModal from '../components/programme/ProgrammeVersionDetailModal.vue'
import ProgrammeVersionImportModal from '../components/programme/ProgrammeVersionImportModal.vue'
import ProgrammeVersionHistoryPanel from '../components/programme/ProgrammeVersionHistoryPanel.vue'
import ProgrammeVersionDetailPanel from '../components/programme/ProgrammeVersionDetailPanel.vue'
import {
  organisationTree,
  initialProgrammes,
  programmeLevelOptions,
  createProgrammeId,
  buildVersionFromSave,
  mergeVersionFormWithProgramme,
} from '../data/programmeVersions.js'
import {
  exportProgrammeVersionsToExcel,
  programmeVersionExportFields,
} from '../utils/exportProgrammeVersionExcel.js'

const programmes = ref(initialProgrammes.map((item) => ({ ...item, versions: [...item.versions] })))

const treeKeyword = ref('')
const selectedSchoolId = ref('sob')
const expandedTreeIds = ref(new Set(['xmu']))

const searchForm = ref(createEmptySearch())
const appliedSearch = ref(createEmptySearch())

const selectedIds = ref([])
const expandedProgrammeIds = ref(new Set([1]))
const currentPage = ref(1)
const pageSize = ref(10)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const deleteTarget = ref(null)

const createModalVisible = ref(false)
const createVersionModalVisible = ref(false)
const createVersionProgramme = ref(null)

const versionDetailVisible = ref(false)
const versionDetailProgramme = ref(null)
const versionDetailVersion = ref(null)

const importModalVisible = ref(false)
const exportModalVisible = ref(false)

const detailsProgramme = ref(null)
const detailsVersion = ref(null)
const detailsView = ref(null)

function createEmptySearch() {
  return {
    keyword: '',
    code: '',
    name: '',
    level: '',
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightText(text, terms) {
  const value = String(text ?? '')
  const activeTerms = [...new Set(terms.filter((term) => String(term || '').trim()).map((term) => String(term).trim()))]
  if (!activeTerms.length || !value) return escapeHtml(value)

  const regex = new RegExp(`(${activeTerms.map(escapeRegex).join('|')})`, 'gi')
  return value
    .split(regex)
    .map((part, index) => (index % 2 === 1 ? `<mark class="search-highlight">${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join('')
}

function getCurrentVersion(item) {
  if (!item.versions?.length) return {}
  return item.versions.find((version) => version.isCurrent) || item.versions[0]
}

function matchKeyword(item, keyword) {
  if (!keyword) return true
  const target = keyword.trim().toLowerCase()
  const version = getCurrentVersion(item)
  const fields = [
    item.code,
    item.name,
    item.level,
    item.years,
    version.mqaCode,
    version.moheCode,
  ]
  return fields.some((field) => String(field ?? '').toLowerCase().includes(target))
}

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value).toLowerCase().includes(keyword.trim().toLowerCase())
}

function matchLevel(value, selected) {
  if (!selected) return true
  return value === selected
}

function filterTreeNodes(nodes) {
  const keyword = treeKeyword.value.trim().toLowerCase()
  if (!keyword) return nodes
  return nodes
    .map((node) => {
      const children = node.children ? filterTreeNodes(node.children) : []
      const selfMatch = node.label.toLowerCase().includes(keyword)
      if (selfMatch || children.length) {
        return { ...node, children }
      }
      return null
    })
    .filter(Boolean)
}

const displayTree = computed(() => filterTreeNodes(organisationTree))

const scopedProgrammes = computed(() =>
  programmes.value.filter((item) => item.schoolId === selectedSchoolId.value),
)

const filteredProgrammes = computed(() => {
  const s = appliedSearch.value
  return scopedProgrammes.value.filter(
    (item) =>
      matchKeyword(item, s.keyword) &&
      matchText(item.code, s.code) &&
      matchText(item.name, s.name) &&
      matchLevel(item.level, s.level),
  )
})

const hasActiveSearch = computed(() => {
  const s = appliedSearch.value
  return !!(s.keyword?.trim() || s.code?.trim() || s.name?.trim() || s.level)
})

function getCellHighlightTerms(field) {
  const s = appliedSearch.value
  const terms = []
  if (s.keyword?.trim()) terms.push(s.keyword.trim())
  if (field === 'code' && s.code?.trim()) terms.push(s.code.trim())
  if (field === 'name' && s.name?.trim()) terms.push(s.name.trim())
  if (field === 'level' && s.level) terms.push(s.level)
  return terms
}

const totalCount = computed(() => filteredProgrammes.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedProgrammes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProgrammes.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedProgrammes.value.length) return false
  return paginatedProgrammes.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

function toggleTreeExpand(id) {
  const next = new Set(expandedTreeIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedTreeIds.value = next
}

function selectTreeNode(node) {
  if (node.children?.length) {
    toggleTreeExpand(node.id)
    return
  }
  selectedSchoolId.value = node.id
  selectedIds.value = []
  currentPage.value = 1
}

function isTreeExpanded(id) {
  return expandedTreeIds.value.has(id)
}

function isTreeActive(id) {
  return selectedSchoolId.value === id
}

function toggleProgrammeExpand(id) {
  const next = new Set(expandedProgrammeIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedProgrammeIds.value = next
}

function isProgrammeExpanded(id) {
  return expandedProgrammeIds.value.has(id)
}

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
  const pageIds = paginatedProgrammes.value.map((item) => item.id)
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

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  deleteTarget.value = { type: 'programme', ids: uniqueIds }
  confirmMessage.value =
    uniqueIds.length === 1
      ? 'Are you sure you want to delete this programme?'
      : `Are you sure you want to delete ${uniqueIds.length} selected programmes?`
  confirmVisible.value = true
}

function requestDeleteVersion(programme, version) {
  deleteTarget.value = {
    type: 'version',
    programmeId: programme.id,
    versionId: version.id,
  }
  confirmMessage.value = 'Are you sure you want to delete this version?'
  confirmVisible.value = true
}

function cancelDelete() {
  deleteTarget.value = null
  confirmVisible.value = false
}

function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return

  if (target.type === 'programme') {
    programmes.value = programmes.value.filter((item) => !target.ids.includes(item.id))
    selectedIds.value = selectedIds.value.filter((id) => !target.ids.includes(id))
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  } else if (target.type === 'version') {
    const programme = programmes.value.find((item) => item.id === target.programmeId)
    if (programme) {
      programme.versions = programme.versions.filter((item) => item.id !== target.versionId)
    }
    if (versionDetailVersion.value?.id === target.versionId) {
      closeVersionDetail()
    }
    if (detailsVersion.value?.id === target.versionId) {
      detailsVersion.value = null
      if (detailsView.value === 'detail') detailsView.value = 'history'
    }
  }

  deleteTarget.value = null
  confirmVisible.value = false
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function openCreateModal() {
  createModalVisible.value = true
}

function handleCreateSave(formData) {
  const info = formData.programmeInfo
  programmes.value.push({
    id: createProgrammeId(),
    schoolId: info.department || selectedSchoolId.value,
    code: info.programmeCode.trim(),
    name: info.programmeName.trim(),
    level: info.level,
    years: Number(info.years) || info.years,
    versions: [buildVersionFromSave(formData)],
  })
  createModalVisible.value = false
  currentPage.value = 1
}

function openProgrammeDetails(programme) {
  detailsProgramme.value = programme
  detailsVersion.value = null
  detailsView.value = 'history'
}

function handleVersionSelect(version) {
  detailsVersion.value = version
  detailsView.value = 'detail'
}

function backToHistory() {
  detailsVersion.value = null
  detailsView.value = 'history'
}

function closeProgrammeDetails() {
  detailsProgramme.value = null
  detailsVersion.value = null
  detailsView.value = null
}

function openCreateVersionModal(programme) {
  createVersionProgramme.value = programme
  createVersionModalVisible.value = true
}

function closeCreateVersionModal() {
  createVersionModalVisible.value = false
  createVersionProgramme.value = null
}

function openVersionDetail(programme, version) {
  versionDetailProgramme.value = programme
  versionDetailVersion.value = version
  versionDetailVisible.value = true
}

function closeVersionDetail() {
  versionDetailVisible.value = false
  versionDetailProgramme.value = null
  versionDetailVersion.value = null
}

function handleCreateVersionSave(versionForm) {
  const programme = programmes.value.find((item) => item.id === createVersionProgramme.value?.id)
  if (!programme) return

  const currentVersion = programme.versions.find((item) => item.isCurrent) || programme.versions[0]
  const fullFormData = mergeVersionFormWithProgramme(currentVersion?.formData, versionForm)

  programme.versions.forEach((item) => {
    item.isCurrent = false
  })
  programme.versions.unshift(buildVersionFromSave(fullFormData, { isCurrent: true }))

  createVersionModalVisible.value = false
  createVersionProgramme.value = null
}

function showComingSoon(action) {
  window.alert(`${action} is under development.`)
}

function openImportModal() {
  importModalVisible.value = true
}

function handleImportSuccess(importedProgrammes) {
  importedProgrammes.forEach((item) => {
    programmes.value.push({
      id: createProgrammeId(),
      schoolId: item.schoolId,
      code: item.code,
      name: item.name,
      level: item.level,
      years: item.years,
      versions: [item.version],
    })
  })
  importModalVisible.value = false
  currentPage.value = 1
}

function openExportModal() {
  if (!filteredProgrammes.value.length) {
    window.alert('No data to export.')
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedProgrammes.value
  } else if (exportScope === 'allResults') {
    data = filteredProgrammes.value
  } else {
    data = filteredProgrammes.value.filter((item) => selectedIds.value.includes(item.id))
  }

  if (!data.length) {
    window.alert('No data to export.')
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportProgrammeVersionsToExcel(data, `programme-version-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}
</script>

<template>
  <div class="programme-page">
    <div class="page-card">
      <div class="programme-layout">
        <aside class="tree-panel">
          <div class="tree-search">
            <input v-model="treeKeyword" type="text" placeholder="please input the keywords" />
            <button type="button" class="tree-search-btn" aria-label="Search tree">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
          <div class="tree-body">
            <template v-for="node in displayTree" :key="node.id">
              <div
                class="tree-node branch"
                :style="{ paddingLeft: '12px' }"
                @click="selectTreeNode(node)"
              >
                <span class="tree-arrow" :class="{ expanded: isTreeExpanded(node.id) }">▸</span>
                <span class="tree-label">{{ node.label }}</span>
              </div>
              <template v-if="node.children?.length && isTreeExpanded(node.id)">
                <div
                  v-for="child in node.children"
                  :key="child.id"
                  class="tree-node leaf"
                  :class="{ active: isTreeActive(child.id) }"
                  :style="{ paddingLeft: '28px' }"
                  @click.stop="selectTreeNode(child)"
                >
                  <span class="tree-arrow placeholder"></span>
                  <span class="tree-label">{{ child.label }}</span>
                </div>
              </template>
            </template>
          </div>
        </aside>

        <section class="main-panel">
          <ProgrammeVersionDetailPanel
            v-if="detailsView === 'detail' && detailsProgramme && detailsVersion"
            :programme="detailsProgramme"
            :version="detailsVersion"
            @back="backToHistory"
          />

          <ProgrammeVersionHistoryPanel
            v-else-if="detailsView === 'history' && detailsProgramme"
            :programme="detailsProgramme"
            @back="closeProgrammeDetails"
            @select="handleVersionSelect"
          />

          <template v-else>
          <div class="search-bar">
            <div class="search-row">
              <div class="search-item">
                <label>Keywords:</label>
                <input v-model="searchForm.keyword" type="text" placeholder="please input" @keyup.enter="handleSearch" />
              </div>
              <div class="search-item">
                <label>Programme Code:</label>
                <input v-model="searchForm.code" type="text" placeholder="please input" @keyup.enter="handleSearch" />
              </div>
              <div class="search-item">
                <label>Programme Name:</label>
                <input v-model="searchForm.name" type="text" placeholder="please input" @keyup.enter="handleSearch" />
              </div>
              <div class="search-item">
                <label>Programme Level:</label>
                <select v-model="searchForm.level">
                  <option value="">All</option>
                  <option v-for="level in programmeLevelOptions" :key="level" :value="level">{{ level }}</option>
                </select>
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Search
                </button>
                <button type="button" class="btn btn-default" @click="handleReset">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>
            <p v-if="hasActiveSearch" class="search-result-tip">
              Found <strong>{{ totalCount }}</strong> matching record(s). Matched text is highlighted below.
            </p>
          </div>

          <div class="toolbar">
            <button type="button" class="btn btn-primary" @click="openCreateModal">Create</button>
            <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">
              Delete
            </button>
            <button type="button" class="btn btn-outline" @click="openImportModal">Import</button>
            <button type="button" class="btn btn-default" @click="openExportModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>

          <div class="table-section">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                    <th class="col-expand"></th>
                    <th>No.</th>
                    <th>Programme Code</th>
                    <th>Programme Name</th>
                    <th>Programme Level</th>
                    <th>Years</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!paginatedProgrammes.length">
                    <td colspan="8" class="empty-cell">No data found</td>
                  </tr>
                  <template v-for="(item, index) in paginatedProgrammes" :key="item.id">
                    <tr :class="{ 'search-result-row': hasActiveSearch }">
                      <td class="col-check">
                        <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                      </td>
                      <td class="col-expand">
                        <button
                          type="button"
                          class="expand-btn"
                          :aria-expanded="isProgrammeExpanded(item.id)"
                          :aria-label="isProgrammeExpanded(item.id) ? 'Collapse row' : 'Expand row'"
                          @click="toggleProgrammeExpand(item.id)"
                        >
                          {{ isProgrammeExpanded(item.id) ? '−' : '+' }}
                        </button>
                      </td>
                      <td>{{ getRowNumber(index) }}</td>
                      <td>
                        <span v-if="hasActiveSearch" v-html="highlightText(item.code, getCellHighlightTerms('code'))"></span>
                        <span v-else>{{ item.code }}</span>
                      </td>
                      <td>
                        <span v-if="hasActiveSearch" v-html="highlightText(item.name, getCellHighlightTerms('name'))"></span>
                        <span v-else>{{ item.name }}</span>
                      </td>
                      <td>
                        <span v-if="hasActiveSearch" v-html="highlightText(item.level, getCellHighlightTerms('level'))"></span>
                        <span v-else>{{ item.level }}</span>
                      </td>
                      <td>{{ item.years }}</td>
                      <td class="actions-cell">
                        <div class="actions-inner">
                          <button type="button" class="link-btn" @click="openProgrammeDetails(item)">ProgrammeDetails</button>
                          <button type="button" class="link-btn" @click="showComingSoon('Edit')">Edit</button>
                          <button type="button" class="link-btn" @click="openCreateVersionModal(item)">CreateVersion</button>
                          <button type="button" class="link-btn delete" @click="requestDelete([item.id])">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="isProgrammeExpanded(item.id)" class="nested-row">
                      <td colspan="8" class="nested-cell">
                        <table v-if="item.versions.length" class="nested-table">
                          <thead>
                            <tr>
                              <th>MQA Code</th>
                              <th>MQA Validity Start Date</th>
                              <th>MQA Validity Expiry Date</th>
                              <th>MOHE Code</th>
                              <th>Approval Date</th>
                              <th>MOHE Validity Start Date</th>
                              <th>MOHE Validity Expiry Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="version in item.versions" :key="version.id">
                              <td>{{ version.mqaCode }}</td>
                              <td>{{ version.mqaValidityStart }}</td>
                              <td>{{ version.mqaValidityExpiry }}</td>
                              <td>{{ version.moheCode }}</td>
                              <td>{{ version.approvalDate }}</td>
                              <td>{{ version.moheValidityStart }}</td>
                              <td>{{ version.moheValidityExpiry }}</td>
                              <td class="actions-cell">
                                <div class="actions-inner">
                                  <button type="button" class="link-btn" @click="openVersionDetail(item, version)">VersionDetail</button>
                                  <button type="button" class="link-btn" @click="showComingSoon('Edit')">Edit</button>
                                  <button type="button" class="link-btn delete" @click="requestDeleteVersion(item, version)">Delete</button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div v-else class="nested-empty">No version data</div>
                      </td>
                    </tr>
                  </template>
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
          </template>
        </section>
      </div>
    </div>

    <ConfirmDialog
      :visible="confirmVisible"
      title="Delete Confirmation"
      :message="confirmMessage"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <ProgrammeVersionCreateModal
      :visible="createModalVisible"
      :default-department-id="selectedSchoolId"
      @close="createModalVisible = false"
      @save="handleCreateSave"
    />

    <ProgrammeVersionCreateVersionModal
      :visible="createVersionModalVisible"
      :programme-name="createVersionProgramme?.name || ''"
      @close="closeCreateVersionModal"
      @save="handleCreateVersionSave"
    />

    <ProgrammeVersionImportModal
      :visible="importModalVisible"
      :existing-programmes="programmes"
      @close="importModalVisible = false"
      @imported="handleImportSuccess"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="programmeVersionExportFields"
      :has-selected-rows="hasSelection"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />

    <ProgrammeVersionDetailModal
      :visible="versionDetailVisible"
      :programme-name="versionDetailProgramme?.name || ''"
      :version="versionDetailVersion"
      @close="closeVersionDetail"
    />
  </div>
</template>

<style scoped>
.programme-page {
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
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.tree-search {
  display: flex;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.tree-search input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.tree-search-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
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

.tree-arrow {
  width: 14px;
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.15s;
}

.tree-arrow.expanded {
  transform: rotate(90deg);
}

.tree-arrow.placeholder {
  visibility: hidden;
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

.search-result-tip {
  margin-top: 10px;
  font-size: 13px;
  color: #6b7280;
}

.search-result-tip strong {
  color: #2563eb;
  font-weight: 600;
}

.data-table :deep(.search-highlight) {
  background: #fef08a;
  color: #854d0e;
  padding: 0 2px;
  border-radius: 2px;
}

.data-table tbody tr.search-result-row {
  background: #fffbeb;
}

.data-table tbody tr.search-result-row:hover {
  background: #fef3c7;
}

.search-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px 10px;
  min-width: 0;
  overflow-x: auto;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 0;
}

.search-item label {
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
  flex-shrink: 0;
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

.search-item:nth-child(3) input {
  width: 128px;
  min-width: 100px;
}

.search-item:nth-child(4) select {
  width: 118px;
  min-width: 96px;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 4px;
}

.search-actions .btn {
  padding: 0 12px;
  white-space: nowrap;
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

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}

.btn-outline:hover {
  background: #eff6ff;
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
  min-width: 1100px;
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

.data-table tbody tr:not(.nested-row):hover {
  background: #fafafa;
}

.col-check {
  width: 48px;
}

.col-expand {
  width: 40px;
}

.expand-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1;
  color: #6b7280;
  background: #fff;
}

.expand-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.nested-row {
  background: #f8fafc;
}

.nested-cell {
  padding: 0 14px 12px 48px !important;
}

.nested-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.nested-table th {
  background: #eff6ff;
  color: #374151;
  font-weight: 600;
  font-size: 12px;
  padding: 10px 12px;
  white-space: nowrap;
}

.nested-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}

.nested-table tbody tr:last-child td {
  border-bottom: none;
}

.nested-empty {
  padding: 16px 12px;
  font-size: 13px;
  color: #9ca3af;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
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
