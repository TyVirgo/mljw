<script setup>
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { courseLibraryDemo } from '../../data/courseRegistration/selectableCourses.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'

const props = defineProps({
  visible: Boolean,
  batchName: { type: String, default: '' },
  /** 本批次已有课程代码，不可再选 */
  importedCodes: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useAppI18n()

const searchDraft = ref('')
const searchApplied = ref('')
const selectedCodes = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const importedSet = computed(() => new Set(props.importedCodes))

const filteredCourses = computed(() => {
  let list = courseLibraryDemo
  const kw = searchApplied.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (item) =>
        item.code.toLowerCase().includes(kw) ||
        item.name.toLowerCase().includes(kw),
    )
  }
  return list
})

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCourses.value.slice(start, start + pageSize.value)
})

const selectableOnPage = computed(() =>
  paginatedCourses.value.filter((item) => !importedSet.value.has(item.code)),
)

const allPageSelected = computed(() => {
  if (!selectableOnPage.value.length) return false
  return selectableOnPage.value.every((item) => selectedCodes.value.includes(item.code))
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    searchDraft.value = ''
    searchApplied.value = ''
    selectedCodes.value = []
    currentPage.value = 1
    pageSize.value = 10
  },
)

watch(filteredCourses, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

function handleSearch() {
  searchApplied.value = searchDraft.value
  currentPage.value = 1
}

function handleReset() {
  searchDraft.value = ''
  searchApplied.value = ''
  currentPage.value = 1
}

function isImported(code) {
  return importedSet.value.has(code)
}

function toggleCode(code) {
  if (isImported(code)) return
  const idx = selectedCodes.value.indexOf(code)
  if (idx === -1) selectedCodes.value.push(code)
  else selectedCodes.value.splice(idx, 1)
}

function togglePageAll() {
  if (allPageSelected.value) {
    const pageCodes = new Set(selectableOnPage.value.map((item) => item.code))
    selectedCodes.value = selectedCodes.value.filter((code) => !pageCodes.has(code))
    return
  }
  for (const item of selectableOnPage.value) {
    if (!selectedCodes.value.includes(item.code)) selectedCodes.value.push(item.code)
  }
}

function handleConfirm() {
  if (!selectedCodes.value.length) return
  emit('confirm', [...selectedCodes.value])
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ t('courseRegistration.courses.import') }}</h2>
            <p v-if="batchName" class="modal-subtitle">
              {{ t('courseRegistration.courses.importForBatch', { name: batchName }) }}
              <ExternalDataHint source-key="courseLibrary" />
            </p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="search-bar">
            <div class="search-row">
              <div class="search-field">
                <label class="search-label">{{ t('courseRegistration.courses.code') }}</label>
                <input
                  v-model="searchDraft"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.courses.librarySearchPlaceholder')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
                <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
              </div>
            </div>
          </div>

          <p class="selection-meta">
            {{ t('courseRegistration.courses.importSelectedCount', { count: selectedCodes.length }) }}
          </p>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      :disabled="!selectableOnPage.length"
                      @change="togglePageAll"
                    />
                  </th>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.credits') }}</th>
                  <th>{{ t('courseRegistration.courses.type') }}</th>
                  <th>{{ t('common.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in paginatedCourses"
                  :key="item.code"
                  :class="{
                    disabled: isImported(item.code),
                    selected: selectedCodes.includes(item.code),
                  }"
                  @click="toggleCode(item.code)"
                >
                  <td class="col-check" @click.stop>
                    <input
                      type="checkbox"
                      :checked="selectedCodes.includes(item.code)"
                      :disabled="isImported(item.code)"
                      @change="toggleCode(item.code)"
                    />
                  </td>
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td>{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.credits }}</td>
                  <td>{{ getRegistrationTypeLabel(item.type, t) }}</td>
                  <td>
                    <span v-if="isImported(item.code)" class="tag-muted">
                      {{ t('courseRegistration.courses.alreadyInBatch') }}
                    </span>
                    <span v-else class="tag-ok">{{ t('courseRegistration.courses.availableToImport') }}</span>
                  </td>
                </tr>
                <tr v-if="!paginatedCourses.length">
                  <td colspan="7" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-pagination">
            <TablePagination
              v-model="currentPage"
              v-model:page-size="pageSize"
              :total="filteredCourses.length"
            />
          </div>
          <div class="footer-actions">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!selectedCodes.length"
              @click="handleConfirm"
            >
              {{ t('courseRegistration.courses.importConfirm', { count: selectedCodes.length }) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: min(960px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 16px 24px;
  overflow: auto;
}

.search-bar {
  margin-bottom: 12px;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.search-input {
  width: 260px;
  max-width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.selection-meta {
  margin: 0 0 10px;
  font-size: 13px;
  color: #4b5563;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
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
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.data-table tbody tr {
  cursor: pointer;
}

.data-table tbody tr.selected {
  background: #eff6ff;
}

.data-table tbody tr.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.col-check {
  width: 40px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}

.tag-muted,
.tag-ok {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.tag-muted {
  background: #f3f4f6;
  color: #6b7280;
}

.tag-ok {
  background: #d1fae5;
  color: #047857;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 28px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.footer-pagination {
  flex: 1;
  min-width: 0;
}

.footer-pagination :deep(.table-pagination) {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.footer-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d9d9d9;
}
</style>
