<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import CollapsibleTreePanel from '../components/common/CollapsibleTreePanel.vue'
import TablePagination from '../components/common/TablePagination.vue'
import ExportModal from '../components/common/ExportModal.vue'
import ProgrammeVersionCreateModal from '../components/programme/ProgrammeVersionCreateModal.vue'
import ProgrammeVersionCreateVersionModal from '../components/programme/ProgrammeVersionCreateVersionModal.vue'
import ProgrammeVersionDetailModal from '../components/programme/ProgrammeVersionDetailModal.vue'
import ProgrammeVersionImportModal from '../components/programme/ProgrammeVersionImportModal.vue'
import ColumnHeaderConfigModal from '../components/common/ColumnHeaderConfigModal.vue'
import YnSwitch from '../components/common/YnSwitch.vue'
import ProgrammeVersionHistoryPanel from '../components/programme/ProgrammeVersionHistoryPanel.vue'
import ProgrammeVersionDetailPanel from '../components/programme/ProgrammeVersionDetailPanel.vue'
import {
  organisationTree,
  initialProgrammes,
  programmeLevelOptions,
  createProgrammeId,
  buildVersionFromSave,
  mergeVersionFormWithProgramme,
  setProgrammeVersionPublished,
  getSchoolElectiveCategoryLabel,
} from '../data/programmeVersions.js'
import {
  exportProgrammeVersionsToExcel,
  programmeVersionExportFields,
} from '../utils/exportProgrammeVersionExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'
import { useAppI18n } from '../composables/useAppI18n.js'
import { useColumnHeaderConfig } from '../composables/useColumnHeaderConfig.js'
import {
  programmeVersionColumnHeaderStore,
  programmeVersionColumnHeaderSections,
  defaultProgrammeVersionColumnHeaders,
} from '../data/programmeVersionColumnHeaders.js'

const { t, tr, translatedExportFields } = useListPageI18n(programmeVersionExportFields)
const { isZh } = useAppI18n()
const { headerLabel, getEditableRows, save: saveColumnHeaders } = useColumnHeaderConfig(programmeVersionColumnHeaderStore)

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

const programmeFormModalVisible = ref(false)
const programmeFormModalMode = ref('create')
const editingProgramme = ref(null)
const versionFormModalVisible = ref(false)
const versionFormModalMode = ref('create')
const versionFormProgramme = ref(null)
const versionFormEditingVersion = ref(null)

const versionDetailVisible = ref(false)
const versionDetailProgramme = ref(null)
const versionDetailVersion = ref(null)

const importModalVisible = ref(false)
const exportModalVisible = ref(false)
const columnHeaderModalVisible = ref(false)
const columnHeaderModalRows = ref([])

const detailsProgramme = ref(null)
const detailsVersion = ref(null)
const detailsView = ref(null)

function createEmptySearch() {
  return {
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
      matchText(item.code, s.code) &&
      matchText(item.name, s.name) &&
      matchLevel(item.level, s.level),
  )
})

const hasActiveSearch = computed(() => {
  const s = appliedSearch.value
  return !!(s.code?.trim() || s.name?.trim() || s.level)
})

function getCellHighlightTerms(field) {
  const s = appliedSearch.value
  const terms = []
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
      ? t('pages.programmeVersion.deleteOne')
      : t('pages.programmeVersion.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function requestDeleteVersion(programme, version) {
  deleteTarget.value = {
    type: 'version',
    programmeId: programme.id,
    versionId: version.id,
  }
  confirmMessage.value = t('pages.programmeVersion.deleteVersionOne')
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
  programmeFormModalMode.value = 'create'
  editingProgramme.value = null
  programmeFormModalVisible.value = true
}

function openEditModal(programme) {
  programmeFormModalMode.value = 'edit'
  editingProgramme.value = programme
  programmeFormModalVisible.value = true
}

function closeProgrammeFormModal() {
  programmeFormModalVisible.value = false
  editingProgramme.value = null
}

function handleProgrammeFormSave(formData) {
  if (programmeFormModalMode.value === 'edit') {
    handleEditSave(formData)
  } else {
    handleCreateSave(formData)
  }
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
    schoolElectiveCategory: info.schoolElectiveCategory || '',
    versions: [buildVersionFromSave(formData)],
  })
  closeProgrammeFormModal()
  currentPage.value = 1
}

function handleEditSave(formData) {
  const programme = programmes.value.find((item) => item.id === editingProgramme.value?.id)
  if (!programme) return

  const info = formData.programmeInfo
  programme.schoolId = info.department || programme.schoolId
  programme.name = info.programmeName.trim()
  programme.level = info.level
  programme.years = Number(info.years) || info.years
  programme.schoolElectiveCategory = info.schoolElectiveCategory || ''

  programme.versions.forEach((item) => {
    item.isCurrent = false
  })
  programme.versions.unshift(buildVersionFromSave(formData, { isCurrent: true }))

  closeProgrammeFormModal()
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
  versionFormModalMode.value = 'create'
  versionFormProgramme.value = programme
  versionFormEditingVersion.value = null
  versionFormModalVisible.value = true
}

function openEditVersionModal(programme, version) {
  versionFormModalMode.value = 'edit'
  versionFormProgramme.value = programme
  versionFormEditingVersion.value = version
  versionFormModalVisible.value = true
}

function closeVersionFormModal() {
  versionFormModalVisible.value = false
  versionFormProgramme.value = null
  versionFormEditingVersion.value = null
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

function handleVersionFormSave(versionForm) {
  const programme = programmes.value.find((item) => item.id === versionFormProgramme.value?.id)
  if (!programme) return

  const baseVersion =
    versionFormModalMode.value === 'edit'
      ? versionFormEditingVersion.value
      : programme.versions.find((item) => item.isCurrent) || programme.versions[0]

  const fullFormData = mergeVersionFormWithProgramme(baseVersion?.formData, versionForm)

  programme.versions.forEach((item) => {
    item.isCurrent = false
  })
  programme.versions.unshift(buildVersionFromSave(fullFormData, { isCurrent: true }))

  closeVersionFormModal()
}

function handleProgrammePublish() {
  window.alert(
    tr('The Approval letter for the update of professional information has been sent to the relevant personnel.'),
  )
}

function handleVersionPublish() {
  window.alert(
    tr('The Approval letter for the update of professional information has been sent to the relevant personnel.'),
  )
}

function toggleVersionPublish(programme, version, published) {
  setProgrammeVersionPublished(programme, version.id, published)
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
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function openColumnHeaderModal() {
  columnHeaderModalRows.value = getEditableRows()
  columnHeaderModalVisible.value = true
}

function handleColumnHeaderSave(rows) {
  saveColumnHeaders(rows)
  columnHeaderModalVisible.value = false
  window.alert(t('pages.programmeVersion.columnHeaderSaveSuccess'))
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
    window.alert(t('common.noDataExport'))
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
        <CollapsibleTreePanel>
          <template #search>
            <div class="tree-search">
              <input v-model="treeKeyword" type="text" :placeholder="tr('please input the keywords')" />
              <button type="button" class="tree-search-btn" :aria-label="tr('Search tree')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </template>
            <template v-for="node in displayTree" :key="node.id">
              <div
                class="tree-node branch"
                :style="{ paddingLeft: '12px' }"
                @click="selectTreeNode(node)"
              >
                <span class="tree-arrow" :class="{ expanded: isTreeExpanded(node.id) }">▸</span>
                <span class="tree-label">{{ tr(node.label) }}</span>
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
                  <span class="tree-label">{{ tr(child.label) }}</span>
                </div>
              </template>
            </template>
        </CollapsibleTreePanel>

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
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ tr('Programme Code:') }}</label>
                  <input v-model="searchForm.code" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                </div>
                <div class="search-item search-item-name">
                  <label>{{ tr('Programme Name:') }}</label>
                  <input v-model="searchForm.name" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                </div>
                <div class="search-item search-item-level">
                  <label>{{ tr('Programme Level:') }}</label>
                  <select v-model="searchForm.level">
                    <option value="">{{ t('common.all') }}</option>
                    <option v-for="level in programmeLevelOptions" :key="level" :value="level">{{ level }}</option>
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
              </div>
            </div>
            <p v-if="hasActiveSearch" class="search-result-tip">
              {{ t('common.foundRecords', { count: totalCount }) }}
            </p>
          </div>

          <div class="toolbar">
            <div class="toolbar-left">
              <button type="button" class="btn btn-primary" @click="openCreateModal">{{ t('common.create') }}</button>
              <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">
                {{ t('common.delete') }}
              </button>
              <button type="button" class="btn btn-outline" @click="openImportModal">{{ t('common.import') }}</button>
              <button type="button" class="btn btn-default" @click="openExportModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {{ t('common.export') }}
              </button>
            </div>
            <button type="button" class="btn btn-outline toolbar-config-btn" @click="openColumnHeaderModal">
              {{ t('pages.programmeVersion.columnHeaderConfig') }}
            </button>
          </div>

          <div class="table-section">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                    <th class="col-expand"></th>
                    <th>{{ t('common.serialNo') }}</th>
                    <th>{{ headerLabel('programmeCode') }}</th>
                    <th>{{ headerLabel('programmeName') }}</th>
                    <th>{{ headerLabel('programmeLevel') }}</th>
                    <th>{{ headerLabel('years') }}</th>
                    <th>{{ headerLabel('schoolElectiveCategory') }}</th>
                    <th>{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!paginatedProgrammes.length">
                    <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
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
                          :aria-label="isProgrammeExpanded(item.id) ? tr('Collapse row') : tr('Expand row')"
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
                        <span v-else>{{ tr(item.name) }}</span>
                      </td>
                      <td>
                        <span v-if="hasActiveSearch" v-html="highlightText(item.level, getCellHighlightTerms('level'))"></span>
                        <span v-else>{{ tr(item.level) }}</span>
                      </td>
                      <td>{{ item.years }}</td>
                      <td>{{ getSchoolElectiveCategoryLabel(item.schoolElectiveCategory, isZh) }}</td>
                      <td class="actions-cell">
                        <div class="actions-inner">
                          <button type="button" class="link-btn" @click="openProgrammeDetails(item)">{{ tr('ProgrammeDetails') }}</button>
                          <button type="button" class="link-btn" @click="openEditModal(item)">{{ t('common.edit') }}</button>
                          <button type="button" class="link-btn" @click="openCreateVersionModal(item)">{{ tr('CreateVersion') }}</button>
                          <button type="button" class="link-btn delete" @click="requestDelete([item.id])">{{ t('common.delete') }}</button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="isProgrammeExpanded(item.id)" class="nested-row">
                      <td colspan="9" class="nested-cell">
                        <table v-if="item.versions.length" class="nested-table">
                          <thead>
                            <tr>
                              <th>{{ headerLabel('mqaCode') }}</th>
                              <th>{{ headerLabel('mqaValidityStart') }}</th>
                              <th>{{ headerLabel('mqaValidityExpiry') }}</th>
                              <th>{{ headerLabel('moheCode') }}</th>
                              <th>{{ headerLabel('approvalDate') }}</th>
                              <th>{{ headerLabel('moheValidityStart') }}</th>
                              <th>{{ headerLabel('moheValidityExpiry') }}</th>
                              <th class="col-version-publish">{{ headerLabel('versionPublish') }}</th>
                              <th>{{ t('common.actions') }}</th>
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
                              <td class="col-version-publish">
                                <YnSwitch
                                  :model-value="version.isCurrent"
                                  @update:model-value="toggleVersionPublish(item, version, $event)"
                                />
                              </td>
                              <td class="actions-cell">
                                <div class="actions-inner">
                                  <button type="button" class="link-btn" @click="openVersionDetail(item, version)">{{ tr('VersionDetail') }}</button>
                                  <button type="button" class="link-btn" @click="openEditVersionModal(item, version)">{{ t('common.edit') }}</button>
                                  <button type="button" class="link-btn delete" @click="requestDeleteVersion(item, version)">{{ t('common.delete') }}</button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div v-else class="nested-empty">{{ tr('No version data') }}</div>
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
      :title="t('common.deleteConfirmation')"
      :message="confirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <ProgrammeVersionCreateModal
      :visible="programmeFormModalVisible"
      :mode="programmeFormModalMode"
      :programme="editingProgramme"
      :default-department-id="selectedSchoolId"
      @close="closeProgrammeFormModal"
      @save="handleProgrammeFormSave"
      @publish="handleProgrammePublish"
    />

    <ProgrammeVersionCreateVersionModal
      :visible="versionFormModalVisible"
      :mode="versionFormModalMode"
      :programme-name="versionFormProgramme?.name || ''"
      :version="versionFormEditingVersion"
      @close="closeVersionFormModal"
      @save="handleVersionFormSave"
      @publish="handleVersionPublish"
    />

    <ProgrammeVersionImportModal
      :visible="importModalVisible"
      :existing-programmes="programmes"
      @close="importModalVisible = false"
      @imported="handleImportSuccess"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="translatedExportFields"
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

    <ColumnHeaderConfigModal
      :visible="columnHeaderModalVisible"
      :rows="columnHeaderModalRows"
      :sections="programmeVersionColumnHeaderSections"
      :default-rows="defaultProgrammeVersionColumnHeaders"
      title-key="pages.programmeVersion.columnHeaderConfigTitle"
      hint-key="pages.programmeVersion.columnHeaderConfigHint"
      @close="columnHeaderModalVisible = false"
      @save="handleColumnHeaderSave"
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

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-config-btn {
  flex-shrink: 0;
  margin-left: auto;
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
  vertical-align: middle;
}

.col-version-publish {
  width: 96px;
  text-align: center;
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
