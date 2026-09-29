<script setup>
/**
 * 白名单先修豁免：多选课程（按课号去重）
 */
import { ref, computed, watch, nextTick } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { selectableCourses } from '../../data/courseRegistration/selectableCourses.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  /** 已选课号 */
  selectedCodes: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useAppI18n()

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const pickedCodes = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const selectAllEl = ref(null)

const courseRows = computed(() => {
  const map = new Map()
  for (const c of selectableCourses.value || []) {
    const code = String(c.code || '').trim()
    if (!code || map.has(code)) continue
    map.set(code, {
      code,
      name: c.name || code,
      credits: c.credits,
      type: c.type || '',
    })
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code))
})

const filteredRows = computed(() => {
  const code = String(appliedSearch.value.courseCode || '')
    .trim()
    .toLowerCase()
  const name = String(appliedSearch.value.courseName || '')
    .trim()
    .toLowerCase()
  return courseRows.value.filter((row) => {
    if (code && !String(row.code).toLowerCase().includes(code)) return false
    if (name && !String(row.name).toLowerCase().includes(name)) return false
    return true
  })
})

const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const pageAllSelected = computed(() => {
  const rows = paginatedRows.value
  if (!rows.length) return false
  return rows.every((row) => pickedCodes.value.includes(row.code))
})

const pageSomeSelected = computed(() => {
  const rows = paginatedRows.value
  if (!rows.length) return false
  const n = rows.filter((row) => pickedCodes.value.includes(row.code)).length
  return n > 0 && n < rows.length
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    searchForm.value = emptySearch()
    appliedSearch.value = emptySearch()
    pickedCodes.value = [...(props.selectedCodes || [])].map((c) => String(c).trim()).filter(Boolean)
    currentPage.value = 1
    pageSize.value = 20
  },
)

function emptySearch() {
  return { courseCode: '', courseName: '' }
}

function isPicked(code) {
  return pickedCodes.value.includes(code)
}

function toggleRow(row) {
  const code = row.code
  const set = new Set(pickedCodes.value)
  if (set.has(code)) set.delete(code)
  else set.add(code)
  pickedCodes.value = [...set]
}

function togglePageSelectAll() {
  const set = new Set(pickedCodes.value)
  const pageCodes = paginatedRows.value.map((row) => row.code)
  if (pageAllSelected.value) {
    for (const code of pageCodes) set.delete(code)
  } else {
    for (const code of pageCodes) set.add(code)
  }
  pickedCodes.value = [...set]
}

watch(
  [pageAllSelected, pageSomeSelected, paginatedRows, pickedCodes],
  async () => {
    await nextTick()
    if (selectAllEl.value) {
      selectAllEl.value.indeterminate = pageSomeSelected.value
    }
  },
)

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleConfirm() {
  emit('confirm', [...pickedCodes.value])
}

function typeLabel(type) {
  return getRegistrationTypeLabel(type, t)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>{{ t('courseRegistration.whitelist.prereqCoursePickTitle') }}</h3>
          <button type="button" class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="search-bar pick-search">
            <div class="search-row">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.code') }}</label>
                  <input
                    v-model="searchForm.courseCode"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.name') }}</label>
                  <input
                    v-model="searchForm.courseName"
                    type="text"
                    class="search-input"
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
          <p class="pick-hint">
            {{ t('courseRegistration.whitelist.prereqCoursePickHint', { n: pickedCodes.length }) }}
          </p>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      ref="selectAllEl"
                      type="checkbox"
                      :checked="pageAllSelected"
                      :disabled="!paginatedRows.length"
                      :aria-label="t('courseRegistration.whitelist.prereqSelectAllPage')"
                      @change="togglePageSelectAll"
                    />
                  </th>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.credits') }}</th>
                  <th>{{ t('courseRegistration.courses.type') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.code"
                  :class="{ selected: isPicked(row.code) }"
                  @click="toggleRow(row)"
                >
                  <td class="col-check" @click.stop>
                    <input
                      type="checkbox"
                      :checked="isPicked(row.code)"
                      @change="toggleRow(row)"
                    />
                  </td>
                  <td>{{ row.code }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.credits }}</td>
                  <td>{{ typeLabel(row.type) }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
          />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal-panel {
  width: min(880px, 100%);
  max-height: min(86vh, 900px);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.modal-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}
.modal-body {
  padding: 14px 18px;
  overflow: auto;
  flex: 1;
}
.pick-search {
  margin: 0 0 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}
.pick-hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: #6b7280;
}
.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th,
.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
}
.data-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
}
.data-table tr {
  cursor: pointer;
}
.data-table tr.selected {
  background: #eff6ff;
}
.col-check {
  width: 36px;
}
.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
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
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
