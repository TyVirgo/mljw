<script setup>
/**
 * 学生维度「新增」· 课程选择器（可搜，单选课×分组；分组展示为「分组名称{code}」）
 */
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { listTargetCourseSectionOptions } from '../../data/courseRegistration/registrationResult.js'
import { formatUnifiedCourseCategoryLabel } from '../../data/courseRegistration/unifiedCourseCategory.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batchId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'select'])

const { t } = useAppI18n()

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const selectedValue = ref('')
const selectedRow = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const errorKey = ref('')

const allOptions = computed(() =>
  listTargetCourseSectionOptions('', {
    batchId: props.batchId || '',
    onlyAvailable: false,
  }),
)

const filteredRows = computed(() => {
  const code = String(appliedSearch.value.courseCode || '')
    .trim()
    .toLowerCase()
  const name = String(appliedSearch.value.courseName || '')
    .trim()
    .toLowerCase()
  const section = String(appliedSearch.value.sectionCode || '')
    .trim()
    .toLowerCase()
  return allOptions.value.filter((row) => {
    if (code && !String(row.courseCode || '').toLowerCase().includes(code)) return false
    if (name && !String(row.courseName || '').toLowerCase().includes(name)) return false
    if (section) {
      const sectionCode = String(row.sectionCode || '').toLowerCase()
      const sectionName = String(sectionDisplayName(row) || '').toLowerCase()
      if (!sectionCode.includes(section) && !sectionName.includes(section)) return false
    }
    return true
  })
})

const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch(
  () => [props.visible, props.batchId],
  ([visible]) => {
    if (!visible) return
    searchForm.value = emptySearch()
    appliedSearch.value = emptySearch()
    selectedValue.value = ''
    selectedRow.value = null
    currentPage.value = 1
    pageSize.value = 10
    errorKey.value = ''
  },
)

function emptySearch() {
  return { courseCode: '', courseName: '', sectionCode: '' }
}

function sectionDisplayName(row) {
  return row.sectionName || formatCourseSectionName(row.sectionCode || row, t)
}

/**
 * 统一课程类别（合并原类型 + 校选）
 * @param {object} row
 */
function courseCategoryLabel(row) {
  return formatUnifiedCourseCategoryLabel(
    {
      type: row.courseType || row.type,
      schoolElectiveCategory: row.schoolElectiveCategory,
      code: row.courseCode,
      id: row.courseId,
    },
    t,
  )
}

function selectRow(row) {
  selectedValue.value = row.value
  selectedRow.value = row
  errorKey.value = ''
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function handleConfirm() {
  if (!selectedRow.value) {
    errorKey.value = 'courseRegistration.result.addSectionRequired'
    return
  }
  emit('select', { ...selectedRow.value })
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="pick-overlay" @click="handleOverlayClick">
      <div class="pick-panel" role="dialog" aria-modal="true">
        <div class="pick-header">
          <h2 class="pick-title">{{ t('courseRegistration.result.pickSectionTitle') }}</h2>
          <button type="button" class="pick-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="pick-body">
          <div class="search-bar pick-search">
            <div class="search-row pick-search-row">
              <div class="search-fields">
                <div class="search-item search-item--compact">
                  <label>{{ t('courseRegistration.courses.code') }}</label>
                  <input
                    v-model="searchForm.courseCode"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item search-item--compact">
                  <label>{{ t('courseRegistration.courses.name') }}</label>
                  <input
                    v-model="searchForm.courseName"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item search-item--compact">
                  <label>{{ t('courseRegistration.courses.sectionCode') }}</label>
                  <input
                    v-model="searchForm.sectionCode"
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

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check"></th>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                  <th>{{ t('courseRegistration.courses.category') }}</th>
                  <th>{{ t('courseRegistration.courses.credits') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.value"
                  class="clickable-row"
                  @click="selectRow(row)"
                >
                  <td class="col-check">
                    <input
                      type="radio"
                      name="admin-add-section-pick"
                      :checked="selectedValue === row.value"
                      @change="selectRow(row)"
                    />
                  </td>
                  <td>{{ row.courseCode }}</td>
                  <td>{{ row.courseName }}</td>
                  <td>{{ sectionDisplayName(row) }}</td>
                  <td>{{ courseCategoryLabel(row) }}</td>
                  <td>{{ row.credits ?? '—' }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="6" class="empty-cell">
                    {{
                      batchId
                        ? t('common.noData')
                        : t('courseRegistration.result.addNoSectionInBatch')
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
          />

          <p v-if="errorKey" class="field-error">{{ t(errorKey) }}</p>
          <p v-if="selectedRow" class="selected-hint">{{ selectedRow.label }}</p>
        </div>

        <div class="pick-footer">
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
.pick-overlay {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 24px;
}
.pick-panel {
  width: min(960px, 96vw);
  max-height: min(92vh, 860px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}
.pick-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.pick-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.pick-close {
  border: none;
  background: transparent;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}
.pick-body {
  padding: 16px 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}
.pick-search-row {
  align-items: end;
}
.search-item--compact {
  min-width: 140px;
}
.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
  max-height: 360px;
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
  white-space: nowrap;
}
.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}
.col-check {
  width: 40px;
  text-align: center;
}
.clickable-row {
  cursor: pointer;
}
.clickable-row:hover {
  background: #f8fafc;
}
.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}
.field-error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}
.selected-hint {
  margin: 0;
  font-size: 13px;
  color: #2563eb;
}
.pick-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
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
