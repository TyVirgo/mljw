<script setup>
import { ref, computed, watch } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import SelectableCourseDetailDrawer from '../../components/courseRegistration/SelectableCourseDetailDrawer.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import ExternalDataHint from '../../components/courseRegistration/ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { coursesBatchFilter } from '../../data/courseRegistration/navigationState.js'
import { registrationBatches } from '../../data/courseRegistration/registrationBatches.js'
import { getCoursesByBatch, importCoursesFromLibrary } from '../../data/courseRegistration/selectableCourses.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const props = defineProps({
  initialBatchId: { type: String, default: '' },
})

const { t } = useAppI18n()

const searchForm = ref({ batchId: '', keyword: '' })
const appliedSearch = ref({ batchId: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const detailCourse = ref(null)
const importVisible = ref(false)
const importCodes = ref('COMP101, MATH201')

watch(
  () => props.initialBatchId || coursesBatchFilter.value,
  (batchId) => {
    if (batchId) {
      searchForm.value.batchId = batchId
      appliedSearch.value.batchId = batchId
    }
  },
  { immediate: true },
)

const batchOptions = computed(() => registrationBatches.value)

const rows = computed(() => {
  let list = getCoursesByBatch(appliedSearch.value.batchId)
  if (appliedSearch.value.keyword) {
    const kw = appliedSearch.value.keyword.toLowerCase()
    list = list.filter(
      (r) => r.code.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw),
    )
  }
  return list
})

const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = { batchId: '', keyword: '' }
  appliedSearch.value = { batchId: '', keyword: '' }
  currentPage.value = 1
}

function openDetail(row) {
  detailCourse.value = row
}

function handleImport() {
  const batchId = appliedSearch.value.batchId || registrationBatches.value[0]?.id
  if (!batchId) return
  const codes = importCodes.value.split(',').map((c) => c.trim()).filter(Boolean)
  importCoursesFromLibrary(batchId, codes)
  importVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-courses-page">
    <ModuleBriefPanel page-id="cr-courses" />

    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.batch.name') }}</label>
              <select v-model="searchForm.batchId" class="search-select" :class="{ 'is-empty': !searchForm.batchId }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="batch in batchOptions" :key="batch.id" :value="batch.id">
                  {{ batch.name }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.code') }}</label>
              <input v-model="searchForm.keyword" type="text" class="search-input" />
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="importVisible = true">
          {{ t('courseRegistration.courses.import') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.courses.code') }}</th>
              <th>{{ t('courseRegistration.courses.name') }}</th>
              <th>{{ t('courseRegistration.courses.credits') }}</th>
              <th>{{ t('courseRegistration.courses.sections') }}</th>
              <th>{{ t('courseRegistration.courses.capacity') }}</th>
              <th>{{ t('courseRegistration.courses.quota') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                {{ row.code }}
                <ExternalDataHint source-key="courseLibrary" />
              </td>
              <td>{{ row.name }}</td>
              <td>{{ row.credits }}</td>
              <td>{{ row.sectionCount }}</td>
              <td>{{ row.remainingCapacity }}/{{ row.totalCapacity }}</td>
              <td class="col-quota">{{ row.quotaSummary }}</td>
              <td>
                <button type="button" class="link-btn" @click="openDetail(row)">{{ t('common.details') }}</button>
              </td>
            </tr>
            <tr v-if="!paginatedRows.length">
              <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <TablePagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
          :total-pages="totalPages"
        />
      </div>
    </div>

    <SelectableCourseDetailDrawer :visible="!!detailCourse" :course="detailCourse" @close="detailCourse = null" />

    <div v-if="importVisible" class="modal-overlay" @click.self="importVisible = false">
      <div class="modal-panel">
        <h3>{{ t('courseRegistration.courses.import') }}</h3>
        <p class="hint">{{ t('courseRegistration.courses.importHint') }}</p>
        <input v-model="importCodes" type="text" class="form-input" />
        <div class="modal-actions">
          <button type="button" class="btn btn-default" @click="importVisible = false">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleImport">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.col-quota {
  font-size: 12px;
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal-panel {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  width: min(480px, 90vw);
}

.modal-panel h3 {
  margin: 0 0 8px;
}

.hint {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
