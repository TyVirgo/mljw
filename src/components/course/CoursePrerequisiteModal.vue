<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import TablePagination from '../common/TablePagination.vue'
import { getOfferingOptions, getOfferingLabel } from '../../data/courses.js'
import { initialDepartments } from '../../data/departments.js'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
  selectedCodes: { type: String, default: '' },
  excludeCode: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr } = useAppI18n()

const checkedCodes = ref([])
const searchDraft = ref(createEmptySearch())
const searchApplied = ref(createEmptySearch())
const currentPage = ref(1)
const pageSize = ref(10)
const headerCheckboxRef = ref(null)

const offeringOptions = computed(() => getOfferingOptions(initialDepartments))

const normalizedCourses = computed(() =>
  props.courses.map((item, index) => ({
    id: item.id ?? item.courseCode ?? `course-${index}`,
    courseCode: item.courseCode ?? '',
    courseName: item.courseName ?? '',
    offering: item.offering ?? '',
    credit: item.credit ?? '',
    courseClassification: item.courseClassification ?? '',
  })),
)

const availableCourses = computed(() => {
  const exclude = props.excludeCode?.trim().toLowerCase()
  if (!exclude) return normalizedCourses.value
  return normalizedCourses.value.filter((item) => item.courseCode.toLowerCase() !== exclude)
})

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '').toLowerCase().includes(keyword.trim().toLowerCase())
}

function matchOffering(value, selected) {
  if (!selected) return true
  return value === selected
}

const filteredCourses = computed(() => {
  const s = searchApplied.value
  return availableCourses.value.filter(
    (item) =>
      matchText(item.courseName, s.courseName) &&
      matchText(item.courseCode, s.courseCode) &&
      matchOffering(item.offering, s.offering),
  )
})

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCourses.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedCourses.value.length) return false
  return paginatedCourses.value.every((item) => checkedCodes.value.includes(item.courseCode))
})

const somePageSelected = computed(() => {
  if (!paginatedCourses.value.length) return false
  const count = paginatedCourses.value.filter((item) => checkedCodes.value.includes(item.courseCode)).length
  return count > 0 && count < paginatedCourses.value.length
})

watch(
  () => [props.visible, props.selectedCodes],
  () => {
    if (!props.visible) return
    checkedCodes.value = props.selectedCodes
      ? props.selectedCodes.split(',').map((item) => item.trim()).filter(Boolean)
      : []
    searchDraft.value = createEmptySearch()
    searchApplied.value = createEmptySearch()
    currentPage.value = 1
    pageSize.value = 10
  },
)

watch(filteredCourses, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

watch([somePageSelected, allPageSelected, paginatedCourses], () => {
  nextTick(updateHeaderIndeterminate)
})

function createEmptySearch() {
  return {
    courseName: '',
    courseCode: '',
    offering: '',
  }
}

function updateHeaderIndeterminate() {
  if (headerCheckboxRef.value) {
    headerCheckboxRef.value.indeterminate = somePageSelected.value
  }
}

function handleSearch() {
  searchApplied.value = { ...searchDraft.value }
  currentPage.value = 1
}

function handleReset() {
  searchDraft.value = createEmptySearch()
  searchApplied.value = createEmptySearch()
  currentPage.value = 1
}

function toggleCode(code) {
  if (checkedCodes.value.includes(code)) {
    checkedCodes.value = checkedCodes.value.filter((item) => item !== code)
  } else {
    checkedCodes.value = [...checkedCodes.value, code]
  }
}

function toggleSelectAllPage(event) {
  const codesOnPage = paginatedCourses.value.map((item) => item.courseCode)
  if (event.target.checked) {
    const merged = new Set([...checkedCodes.value, ...codesOnPage])
    checkedCodes.value = [...merged]
  } else {
    checkedCodes.value = checkedCodes.value.filter((code) => !codesOnPage.includes(code))
  }
}

function getOfferingDisplay(code) {
  if (!code) return '--'
  return getOfferingLabel(code, initialDepartments) || code
}

function getClassificationDisplay(value) {
  if (!value) return '--'
  return tr(value)
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function handleConfirm() {
  emit('confirm', checkedCodes.value.join(', '))
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Add') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="search-bar">
            <div class="search-row search-row-1">
              <div class="search-fields">
                <div class="search-field">
                  <label class="search-label">{{ tr('Course Name:') }}</label>
                  <input
                    v-model="searchDraft.courseName"
                    type="text"
                    class="search-input"
                    :placeholder="t('common.pleaseInput')"
                  />
                </div>
                <div class="search-field">
                  <label class="search-label">{{ tr('Course Code:') }}</label>
                  <input
                    v-model="searchDraft.courseCode"
                    type="text"
                    class="search-input"
                    :placeholder="t('common.pleaseInput')"
                  />
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

            <div class="search-row search-row-2">
              <div class="search-field">
                <label class="search-label">{{ tr('Offering:') }}</label>
                <select
                  v-model="searchDraft.offering"
                  class="search-select"
                  :class="{ 'is-empty': !searchDraft.offering }"
                >
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in offeringOptions" :key="opt.code" :value="opt.code">{{ opt.nameEn }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="table-section">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-check">
                      <input
                        ref="headerCheckboxRef"
                        type="checkbox"
                        :checked="allPageSelected"
                        @change="toggleSelectAllPage"
                      />
                    </th>
                    <th class="col-no">{{ t('common.serialNo') }}</th>
                    <th>{{ tr('Course Code') }}</th>
                    <th>{{ tr('Course Name') }}</th>
                    <th>{{ tr('Offering Unit') }}</th>
                    <th>{{ tr('Credit Value') }}</th>
                    <th>{{ tr('Course Classification') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!paginatedCourses.length">
                    <td colspan="7" class="empty-cell">{{ t('common.noData') }}</td>
                  </tr>
                  <tr v-for="(item, index) in paginatedCourses" :key="item.id">
                    <td class="col-check">
                      <input
                        type="checkbox"
                        :checked="checkedCodes.includes(item.courseCode)"
                        @change="toggleCode(item.courseCode)"
                      />
                    </td>
                    <td class="col-no">{{ getRowNumber(index) }}</td>
                    <td>{{ item.courseCode || '--' }}</td>
                    <td>{{ item.courseName || '--' }}</td>
                    <td>{{ getOfferingDisplay(item.offering) }}</td>
                    <td>{{ item.credit === '' || item.credit == null ? '--' : item.credit }}</td>
                    <td>{{ getClassificationDisplay(item.courseClassification) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-pagination">
            <TablePagination
              :total="filteredCourses.length"
              v-model="currentPage"
              v-model:page-size="pageSize"
            />
          </div>
          <div class="footer-actions">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-primary" @click="handleConfirm">{{ t('common.confirm') }}</button>
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
  z-index: 1100;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: min(1140px, calc(100vw - 48px));
  min-height: 620px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  line-height: 1;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 28px 16px;
  overflow: hidden;
}

.search-bar {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-row-1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-width: 0;
}

.search-row-1 .search-fields {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 16px 36px;
}

.search-row-2 {
  min-width: 0;
}

.search-field {
  display: grid;
  grid-template-columns: var(--search-label-width, 120px) 220px;
  gap: 8px;
  align-items: center;
}

.search-label {
  font-size: 13px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
}

.search-input,
.search-select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  box-sizing: border-box;
}

.search-select.is-empty {
  color: #9ca3af;
}

.search-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.search-actions svg {
  width: 14px;
  height: 14px;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-wrap {
  flex: 1;
  min-height: 360px;
  overflow: auto;
  border: 1px solid #f3f4f6;
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  white-space: nowrap;
}

.col-check {
  width: 48px;
}

.col-no {
  width: 56px;
  white-space: nowrap;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
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
  gap: 6px;
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

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d9d9d9;
}
</style>
