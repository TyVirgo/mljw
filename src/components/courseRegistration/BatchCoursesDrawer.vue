<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import TablePagination from '../common/TablePagination.vue'
import SelectableCourseDetailDrawer from './SelectableCourseDetailDrawer.vue'
import CourseLibraryImportModal from './CourseLibraryImportModal.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  getCoursesByBatch,
  importCoursesFromLibrary,
} from '../../data/courseRegistration/selectableCourses.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const keyword = ref('')
const appliedKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const detailCourse = ref(null)
const importVisible = ref(false)

const batchId = computed(() => props.batch?.id || '')
const batchName = computed(() => props.batch?.name || '')

const title = computed(() =>
  batchName.value
    ? t('courseRegistration.courses.manageForBatch', { name: batchName.value })
    : t('courseRegistration.courses.manageCourses'),
)

const subtitle = computed(() => {
  if (!props.batch) return ''
  const session = props.batch.academicSession || props.batch.semester || ''
  return session ? `${session} · ${props.batch.type || ''}` : String(props.batch.type || '')
})

const allBatchCourses = computed(() => getCoursesByBatch(batchId.value))

const rows = computed(() => {
  let list = allBatchCourses.value
  if (appliedKeyword.value) {
    const kw = appliedKeyword.value.toLowerCase()
    list = list.filter(
      (r) => r.code.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw),
    )
  }
  return list
})

const importedCodes = computed(() => allBatchCourses.value.map((c) => c.code))
const batchTotal = computed(() => allBatchCourses.value.length)
const totalCount = computed(() => rows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

watch(
  () => [props.visible, props.batch?.id],
  () => {
    if (!props.visible) return
    keyword.value = ''
    appliedKeyword.value = ''
    currentPage.value = 1
    detailCourse.value = null
    importVisible.value = false
  },
)

function handleSearch() {
  appliedKeyword.value = keyword.value
  currentPage.value = 1
}

function handleReset() {
  keyword.value = ''
  appliedKeyword.value = ''
  currentPage.value = 1
}

function openDetail(row) {
  detailCourse.value = row
}

function openImport() {
  importVisible.value = true
}

function handleImportConfirm(codes) {
  if (!batchId.value) return
  importCoursesFromLibrary(batchId.value, codes)
  importVisible.value = false
  currentPage.value = 1
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="batch-courses-drawer"
    @close="emit('close')"
  >
    <template v-if="batch">
      <div class="batch-courses-body">
        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.filterLabel') }}</label>
                <input
                  v-model="keyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.courses.librarySearchPlaceholder')"
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

        <div class="drawer-toolbar">
          <button type="button" class="btn btn-primary" @click="openImport">
            + {{ t('courseRegistration.courses.import') }}
          </button>
          <span class="drawer-meta">
            {{ t('courseRegistration.courses.batchCourseMeta', { count: batchTotal }) }}
            <ExternalDataHint source-key="courseLibrary" />
          </span>
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
                  <td>{{ row.code }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.credits }}</td>
                  <td>{{ row.sectionCount }}</td>
                  <td>{{ row.remainingCapacity }}/{{ row.totalCapacity }}</td>
                  <td class="col-quota">{{ row.quotaSummary }}</td>
                  <td>
                    <button type="button" class="link-btn" @click="openDetail(row)">
                      {{ t('common.details') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="8" class="empty-cell">
                    <div class="empty-block">
                      <p class="empty-title">
                        {{
                          batchTotal === 0
                            ? t('courseRegistration.courses.emptyBatch')
                            : t('common.noData')
                        }}
                      </p>
                      <p v-if="batchTotal === 0" class="empty-desc">
                        {{ t('courseRegistration.courses.emptyBatchHint') }}
                      </p>
                      <button
                        v-if="batchTotal === 0"
                        type="button"
                        class="btn btn-primary"
                        @click="openImport"
                      >
                        + {{ t('courseRegistration.courses.import') }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-if="totalCount > 0"
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>

  <SelectableCourseDetailDrawer
    :visible="!!detailCourse"
    :course="detailCourse"
    @close="detailCourse = null"
  />

  <CourseLibraryImportModal
    :visible="importVisible"
    :batch-name="batchName"
    :imported-codes="importedCodes"
    @close="importVisible = false"
    @confirm="handleImportConfirm"
  />
</template>

<style scoped>
.batch-courses-drawer :deep(.drawer-panel) {
  width: min(1100px, 94vw);
}

.batch-courses-drawer :deep(.drawer-scroll) {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: #f3f4f6;
}

.batch-courses-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 16px 20px 20px;
  padding: 16px 20px 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.batch-courses-body .search-bar {
  margin-bottom: 12px;
  padding-bottom: 12px;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.drawer-meta {
  font-size: 13px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #fff;
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
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.col-quota {
  font-size: 12px;
  color: #6b7280;
}

.empty-cell {
  text-align: center;
  padding: 48px 16px !important;
  border-bottom: none;
}

.empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-title {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.empty-desc {
  margin: 0 0 8px;
  font-size: 13px;
  color: #9ca3af;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-default:hover {
  border-color: #9ca3af;
  color: #111827;
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
