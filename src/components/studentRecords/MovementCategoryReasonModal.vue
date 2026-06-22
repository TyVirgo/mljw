<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import TablePagination from '../common/TablePagination.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import MovementCategoryReasonEditModal from './MovementCategoryReasonEditModal.vue'
import {
  getMovementCategoryById,
  addReason,
  updateReason,
  deleteReasons,
} from '../../data/movementCategories.js'

const props = defineProps({
  visible: Boolean,
  categoryId: { type: Number, default: null },
})

const emit = defineEmits(['close'])

const { t, tr } = useAppI18n()

const selectedReasonIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const reasonEditVisible = ref(false)
const reasonEditMode = ref('create')
const editingReasonId = ref(null)
const editingReasonName = ref('')
const confirmVisible = ref(false)
const pendingDeleteReasonIds = ref([])

const categoryRow = computed(() =>
  props.categoryId != null ? getMovementCategoryById(props.categoryId) : null,
)
const reasons = computed(() => categoryRow.value?.reasons || [])
const totalCount = computed(() => reasons.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedReasons = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return reasons.value.slice(start, start + pageSize.value)
})
const allPageSelected = computed(() => {
  if (!paginatedReasons.value.length) return false
  return paginatedReasons.value.every((item) => selectedReasonIds.value.includes(item.id))
})
const hasSelection = computed(() => selectedReasonIds.value.length > 0)
const subtitle = computed(() => {
  if (!categoryRow.value) return ''
  return `${categoryRow.value.categoryCode} · ${categoryRow.value.categoryName} · ${formatStudentType(categoryRow.value.studentType)}`
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedReasonIds.value = []
    currentPage.value = 1
    reasonEditVisible.value = false
    confirmVisible.value = false
  },
)

function formatStudentType(type) {
  const key = `movementCategory.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function toggleSelectAll(event) {
  const pageIds = paginatedReasons.value.map((item) => item.id)
  if (event.target.checked) {
    selectedReasonIds.value = [...new Set([...selectedReasonIds.value, ...pageIds])]
  } else {
    selectedReasonIds.value = selectedReasonIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  const index = selectedReasonIds.value.indexOf(id)
  if (index === -1) selectedReasonIds.value.push(id)
  else selectedReasonIds.value.splice(index, 1)
}

function openCreateReason() {
  reasonEditMode.value = 'create'
  editingReasonId.value = null
  editingReasonName.value = ''
  reasonEditVisible.value = true
}

function openEditReason(reason) {
  reasonEditMode.value = 'edit'
  editingReasonId.value = reason.id
  editingReasonName.value = reason.reasonName
  reasonEditVisible.value = true
}

function handleReasonSave(name) {
  if (!props.categoryId) return
  if (reasonEditMode.value === 'edit' && editingReasonId.value != null) {
    updateReason(props.categoryId, editingReasonId.value, name)
  } else {
    addReason(props.categoryId, name)
  }
  reasonEditVisible.value = false
}

function requestDeleteReason(ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return
  pendingDeleteReasonIds.value = uniqueIds
  confirmVisible.value = true
}

function confirmDeleteReasons() {
  if (props.categoryId) deleteReasons(props.categoryId, pendingDeleteReasonIds.value)
  selectedReasonIds.value = selectedReasonIds.value.filter(
    (id) => !pendingDeleteReasonIds.value.includes(id),
  )
  pendingDeleteReasonIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ t('movementCategory.reason.modalTitle') }}</h2>
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>
        <div class="modal-body">
          <div class="toolbar">
            <button type="button" class="btn btn-primary" @click="openCreateReason">+ {{ t('common.create') }}</button>
            <button
              type="button"
              class="btn btn-danger-outline"
              :disabled="!hasSelection"
              @click="requestDeleteReason(selectedReasonIds)"
            >
              {{ t('common.delete') }}
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check"><input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" /></th>
                  <th class="col-no">{{ t('common.serialNo') }}</th>
                  <th>{{ t('movementCategory.reason.nameColumn') }}</th>
                  <th class="col-actions">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedReasons.length">
                  <td colspan="4" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
                <tr v-for="(item, index) in paginatedReasons" :key="item.id">
                  <td class="col-check">
                    <input type="checkbox" :checked="selectedReasonIds.includes(item.id)" @change="toggleSelect(item.id)" />
                  </td>
                  <td class="col-no">{{ getRowNumber(index) }}</td>
                  <td>{{ item.reasonName }}</td>
                  <td class="col-actions">
                    <button type="button" class="link-btn" @click="openEditReason(item)">{{ t('common.edit') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <TablePagination :total="totalCount" v-model="currentPage" v-model:page-size="pageSize" />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <MovementCategoryReasonEditModal
    :visible="reasonEditVisible"
    :mode="reasonEditMode"
    :initial-name="editingReasonName"
    @close="reasonEditVisible = false"
    @save="handleReasonSave"
  />

  <ConfirmDialog
    :visible="confirmVisible"
    :title="t('common.deleteConfirmation')"
    :message="t('movementCategory.reason.deleteConfirm', { count: pendingDeleteReasonIds.length })"
    @cancel="confirmVisible = false"
    @confirm="confirmDeleteReasons"
  />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}
.modal-panel {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title { margin: 0; font-size: 16px; font-weight: 600; }
.modal-subtitle { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
.modal-close { border: none; background: transparent; font-size: 22px; color: #6b7280; cursor: pointer; }
.modal-body { padding: 16px 20px; overflow-y: auto; }
.toolbar { display: flex; gap: 10px; margin-bottom: 12px; }
.table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 12px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
.data-table th { background: #f9fafb; font-weight: 600; }
.col-check { width: 44px; text-align: center; }
.col-no { width: 60px; }
.col-actions { width: 100px; }
.empty-cell { text-align: center; color: #9ca3af; padding: 24px; }
.link-btn { border: none; background: none; color: #2563eb; font-size: 13px; cursor: pointer; padding: 0; }
.modal-footer { display: flex; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid #e5e7eb; }
.btn { height: 34px; padding: 0 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary { border: none; background: #2563eb; color: #fff; }
.btn-danger-outline { border: 1px solid #fca5a5; background: #fff; color: #dc2626; }
.btn-danger-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-default { border: 1px solid #d1d5db; background: #fff; color: #374151; }
</style>
