<script setup>
import { ref, computed } from 'vue'
import BlockFormModal from '../components/block/BlockFormModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ExportModal from '../components/common/ExportModal.vue'
import TablePagination from '../components/common/TablePagination.vue'
import { initialBlocks, createBlockId } from '../data/blocks.js'
import { exportBlocksToExcel, blockExportFields } from '../utils/exportExcel.js'
import { useListPageI18n } from '../composables/useListPageI18n.js'

const { t, tr, translatedExportFields } = useListPageI18n(blockExportFields)

const blocks = ref(initialBlocks.map((item) => ({ ...item, floors: [...item.floors] })))

const searchBlockNo = ref('')
const searchBlockName = ref('')
const appliedSearch = ref({ blockNo: '', blockName: '' })

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const modalVisible = ref(false)
const modalMode = ref('create')
const editingBlock = ref(null)

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteIds = ref([])

const exportModalVisible = ref(false)

function matchField(value, keyword) {
  if (!keyword) return true
  const source = value.toLowerCase()
  const target = keyword.trim().toLowerCase()
  if (!target) return true
  return source.includes(target)
}

const filteredBlocks = computed(() => {
  const { blockNo, blockName } = appliedSearch.value
  return blocks.value.filter((item) => {
    const noMatched = matchField(item.blockNo, blockNo)
    const nameMatched = matchField(item.blockName, blockName)
    return noMatched && nameMatched
  })
})

const totalCount = computed(() => filteredBlocks.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedBlocks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredBlocks.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedBlocks.value.length) return false
  return paginatedBlocks.value.every((item) => selectedIds.value.includes(item.id))
})

const hasSelection = computed(() => selectedIds.value.length > 0)

function handleSearch() {
  appliedSearch.value = {
    blockNo: searchBlockNo.value,
    blockName: searchBlockName.value,
  }
  currentPage.value = 1
  selectedIds.value = []
}

function handleReset() {
  searchBlockNo.value = ''
  searchBlockName.value = ''
  appliedSearch.value = { blockNo: '', blockName: '' }
  currentPage.value = 1
  selectedIds.value = []
}

function toggleSelectAll(event) {
  const pageIds = paginatedBlocks.value.map((item) => item.id)
  if (event.target.checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  const index = selectedIds.value.indexOf(id)
  if (index === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(index, 1)
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingBlock.value = null
  modalVisible.value = true
}

function openEditModal(block) {
  modalMode.value = 'edit'
  editingBlock.value = { ...block, floors: [...block.floors] }
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingBlock.value = null
}

function handleSave(formData) {
  if (modalMode.value === 'edit' && editingBlock.value) {
    const index = blocks.value.findIndex((item) => item.id === editingBlock.value.id)
    if (index !== -1) {
      blocks.value[index] = {
        ...blocks.value[index],
        blockNo: formData.blockNo,
        blockName: formData.blockName,
        floors: [...formData.floors],
      }
    }
  } else {
    const duplicate = blocks.value.some(
      (item) => item.blockNo.toLowerCase() === formData.blockNo.toLowerCase(),
    )
    if (duplicate) {
      window.alert(tr('Block No. already exists.'))
      return
    }
    blocks.value.push({
      id: createBlockId(),
      blockNo: formData.blockNo,
      blockName: formData.blockName,
      floors: [...formData.floors],
    })
  }
  closeModal()
}

function requestDelete(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return

  pendingDeleteIds.value = uniqueIds
  confirmMessage.value =
    uniqueIds.length === 1
      ? t('pages.block.deleteOne')
      : t('pages.block.deleteMany', { count: uniqueIds.length })
  confirmVisible.value = true
}

function handleRowDelete(id) {
  requestDelete([id])
}

function handleBatchDelete() {
  requestDelete(selectedIds.value)
}

function confirmDelete() {
  blocks.value = blocks.value.filter((item) => !pendingDeleteIds.value.includes(item.id))
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false

  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
}

function cancelDelete() {
  pendingDeleteIds.value = []
  confirmVisible.value = false
}

function openExportModal() {
  if (!filteredBlocks.value.length) {
    window.alert(t('common.noDataExport'))
    return
  }
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') {
    data = paginatedBlocks.value
  } else if (exportScope === 'allResults') {
    data = filteredBlocks.value
  } else {
    data = filteredBlocks.value.filter((item) => selectedIds.value.includes(item.id))
  }

  if (!data.length) {
    window.alert(t('common.noDataExport'))
    return
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  exportBlocksToExcel(data, `block-management-${timestamp}.xlsx`, selectedFields)
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
  <div class="block-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Block No.:') }}</label>
              <input v-model="searchBlockNo" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </div>
            <div class="search-item">
              <label>{{ tr('Block Name:') }}</label>
              <input v-model="searchBlockName" type="text" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
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
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreateModal">{{ t('common.create') }}</button>
        <button
          type="button"
          class="btn btn-default"
          :disabled="!hasSelection"
          @click="handleBatchDelete"
        >
          {{ t('common.delete') }}
        </button>
        <button type="button" class="btn btn-default" @click="openExportModal">{{ t('common.export') }}</button>
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
              <th>{{ tr('Block No.') }}</th>
              <th>{{ tr('Block Name') }}</th>
              <th>{{ tr('Floor') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!paginatedBlocks.length">
              <td colspan="6" class="empty-cell">{{ t('common.noData') }}</td>
            </tr>
            <tr v-for="(block, index) in paginatedBlocks" :key="block.id">
              <td class="col-check">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(block.id)"
                  @change="toggleSelect(block.id)"
                />
              </td>
              <td>{{ getRowNumber(index) }}</td>
              <td>{{ block.blockNo }}</td>
              <td>{{ block.blockName }}</td>
              <td>
                <span v-for="floor in block.floors" :key="floor" class="floor-tag">{{ floor }}</span>
              </td>
              <td class="actions-cell">
                <div class="actions-inner">
                  <button type="button" class="link-btn" @click="openEditModal(block)">{{ t('common.edit') }}</button>
                  <button type="button" class="link-btn delete" @click="handleRowDelete(block.id)">{{ t('common.delete') }}</button>
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
    </div>

    <BlockFormModal
      :visible="modalVisible"
      :mode="modalMode"
      :initial-data="editingBlock"
      @close="closeModal"
      @save="handleSave"
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
.block-page {
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
  padding-left: 0;
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
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
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
  border-color: #9ca3af;
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
  overflow-x: auto;
  overflow-y: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead tr {
  height: 44px;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  line-height: 1.5;
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
  padding: 40px 14px !important;
}

.floor-tag {
  display: inline-block;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #4b5563;
}

.actions-inner {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.link-btn {
  font-size: 14px;
  padding: 0;
  color: #2563eb;
}

.link-btn:hover {
  color: #1d4ed8;
}

.link-btn.delete {
  color: #ef4444;
}

.link-btn.delete:hover {
  color: #dc2626;
}

</style>
