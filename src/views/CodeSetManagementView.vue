<script setup>
import { ref, computed } from 'vue'
import CodeSetFormModal from '../components/codeset/CodeSetFormModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import CollapsibleTreePanel from '../components/common/CollapsibleTreePanel.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import {
  codeSetTree,
  loadCodeEntries,
  saveCodeEntries,
  createCodeEntryId,
  formatParentCode,
} from '../data/codeSets.js'
import { exportCodeSetsToExcel, codeSetExportFields } from '../utils/exportCodeSetExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(codeSetExportFields)

const entries = ref(loadCodeEntries())

const treeKeyword = ref('')
const selectedCodeSetId = ref('ktlx')
const expandedIds = ref(new Set(['public', 'teaching']))

const searchNode = ref('')
const searchCodeName = ref('')
const appliedSearch = ref({ node: '', codeName: '' })

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const modalVisible = ref(false)
const modalMode = ref('create')
const editingItem = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const exportModalVisible = ref(false)
const syncMessage = ref('')

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value).toLowerCase().includes(keyword.trim().toLowerCase())
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

const displayTree = computed(() => filterTreeNodes(codeSetTree))

const scopedEntries = computed(() => {
  if (!selectedCodeSetId.value) return entries.value
  return entries.value.filter((row) => row.codeSetId === selectedCodeSetId.value)
})

const filteredEntries = computed(() => {
  const { node, codeName } = appliedSearch.value
  return scopedEntries.value.filter(
    (row) =>
      matchText(`${row.nodeCode} ${row.nodeName}`, node) &&
      matchText(row.codeName, codeName),
  )
})

const totalCount = computed(() => filteredEntries.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredEntries.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedEntries.value.length) return false
  return paginatedEntries.value.every((row) => selectedIds.value.includes(row.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

function persist() {
  saveCodeEntries(entries.value)
}

function toggleExpand(id) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function selectTreeNode(node) {
  if (!node.nodeCode) {
    toggleExpand(node.id)
    return
  }
  selectedCodeSetId.value = node.id
  selectedIds.value = []
  currentPage.value = 1
}

function isExpanded(id) {
  return expandedIds.value.has(id)
}

function isTreeActive(id) {
  return selectedCodeSetId.value === id
}

function handleSearch() {
  appliedSearch.value = { node: searchNode.value, codeName: searchCodeName.value }
  currentPage.value = 1
  selectedIds.value = []
}

function handleReset() {
  searchNode.value = ''
  searchCodeName.value = ''
  appliedSearch.value = { node: '', codeName: '' }
  currentPage.value = 1
  selectedIds.value = []
}

function toggleSelectAll(event) {
  const ids = paginatedEntries.value.map((row) => row.id)
  if (event.target.checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !ids.includes(id))
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
  modalMode.value = 'create'
  editingItem.value = null
  modalVisible.value = true
}

function openEditModal(item) {
  modalMode.value = 'edit'
  editingItem.value = { ...item }
  modalVisible.value = true
}

function handleSave(payload) {
  if (modalMode.value === 'edit' && editingItem.value) {
    const index = entries.value.findIndex((row) => row.id === editingItem.value.id)
    if (index !== -1) {
      entries.value[index] = { ...entries.value[index], ...payload }
    }
  } else {
    entries.value.push({ id: createCodeEntryId(), ...payload })
  }
  persist()
  modalVisible.value = false
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('pages.codeSet.deleteOne')
      : t('pages.codeSet.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function confirmDelete() {
  entries.value = entries.value.filter((row) => !pendingDeleteIds.value.includes(row.id))
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  persist()
}

function openExportModal() {
  if (!filteredEntries.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') data = paginatedEntries.value
  else if (exportScope === 'allResults') data = filteredEntries.value
  else data = filteredEntries.value.filter((row) => selectedIds.value.includes(row.id))

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  const timestamp = new Date().toISOString().slice(0, 10)
  exportCodeSetsToExcel(data, `code-set-${timestamp}.xlsx`, selectedFields)
  exportModalVisible.value = false
}

function handleSyncCache() {
  persist()
  syncMessage.value = tr('Cache synced successfully.')
  setTimeout(() => {
    syncMessage.value = ''
  }, 2500)
}

function handlePaginationChange({ type }) {
  if (type === 'pageSize') selectedIds.value = []
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}
</script>

<template>
  <div class="codeset-page">
    <div class="page-card">
      <div class="codeset-layout">
        <CollapsibleTreePanel>
          <template #search>
            <div class="tree-search">
              <input v-model="treeKeyword" type="text" :placeholder="tr('Please enter keywords')" />
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
                class="tree-node"
                :class="{ active: isTreeActive(node.id), branch: !node.nodeCode }"
                :style="{ paddingLeft: `${12 + 0 * 16}px` }"
                @click="selectTreeNode(node)"
              >
                <span v-if="node.children?.length" class="tree-arrow" :class="{ expanded: isExpanded(node.id) }">▸</span>
                <span v-else class="tree-arrow placeholder"></span>
                <span class="tree-label">{{ tr(node.label) }}</span>
              </div>
              <template v-if="node.children?.length && isExpanded(node.id)">
                <div
                  v-for="child in node.children"
                  :key="child.id"
                  class="tree-node"
                  :class="{ active: isTreeActive(child.id), leaf: true }"
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
          <p v-if="syncMessage" class="sync-toast">{{ syncMessage }}</p>

          <div class="search-bar">
            <div class="search-row">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ tr('Node Code/Name:') }}</label>
                  <input v-model="searchNode" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                </div>
                <div class="search-item">
                  <label>{{ tr('Code Name:') }}</label>
                  <input v-model="searchCodeName" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                </div>
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
                <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
              </div>
            </div>
          </div>

          <div class="toolbar">
            <button type="button" class="btn btn-primary" @click="openCreateModal">{{ t('common.create') }}</button>
            <button type="button" class="btn btn-default" :disabled="!hasSelection" @click="requestDelete(selectedIds)">
              {{ t('common.delete') }}
            </button>
            <button type="button" class="btn btn-outline" @click="openExportModal">{{ t('common.export') }}</button>
            <button type="button" class="btn btn-outline" @click="handleSyncCache">{{ t('common.syncCache') }}</button>
          </div>

          <div class="table-section">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                    <th>{{ t('common.serialNo') }}</th>
                    <th>{{ tr('Node Code') }}</th>
                    <th>{{ tr('Node Name') }}</th>
                    <th>{{ t('common.code') }}</th>
                    <th>{{ tr('Code Name') }}</th>
                    <th>{{ tr('Parent Code') }}</th>
                    <th>{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!paginatedEntries.length">
                    <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
                  </tr>
                  <tr v-for="(item, index) in paginatedEntries" :key="item.id">
                    <td class="col-check">
                      <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                    </td>
                    <td>{{ getRowNumber(index) }}</td>
                    <td>{{ item.nodeCode }}</td>
                    <td>{{ tr(item.nodeName) }}</td>
                    <td>{{ item.code }}</td>
                    <td>{{ tr(item.codeName) }}</td>
                    <td>{{ formatParentCode(item.parentCode) }}</td>
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
              :page-size-options="[10, 20, 50, 100]"
              @change="handlePaginationChange"
            />
          </div>
        </section>
      </div>
    </div>

    <CodeSetFormModal
      :visible="modalVisible"
      :mode="modalMode"
      :initial-data="editingItem"
      :all-entries="entries"
      :default-code-set-id="selectedCodeSetId"
      @close="modalVisible = false"
      @save="handleSave"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="confirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="confirmVisible = false"
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
.codeset-page {
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

.codeset-layout {
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
  position: relative;
}

.sync-toast {
  position: absolute;
  top: 12px;
  right: 20px;
  z-index: 2;
  padding: 8px 12px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 13px;
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
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
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
  min-width: 900px;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
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

.actions-inner {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
}

.link-btn.delete {
  color: #ef4444;
}

</style>
