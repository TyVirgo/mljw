<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import RegistrationBatchStatusBadge from '../../components/courseRegistration/RegistrationBatchStatusBadge.vue'
import RegistrationBatchFormDrawer from '../../components/courseRegistration/RegistrationBatchFormDrawer.vue'
import BatchCoursesDrawer from '../../components/courseRegistration/BatchCoursesDrawer.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  registrationBatches,
  addRegistrationBatch,
  publishRegistrationBatch,
  formatRoundRange,
  formatRoundRangeTitle,
} from '../../data/courseRegistration/registrationBatches.js'
import { countCoursesByBatch } from '../../data/courseRegistration/selectableCourses.js'
import { batchExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatBatchExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { registrationAcademicSessionOptions } from '../../data/courseRegistration/registrationBatchFormUtils.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import '../../styles/course-registration-list.css'

const emit = defineEmits(['navigate'])

const { t } = useAppI18n()

const searchForm = ref({ academicSession: '', status: '', keyword: '' })
const appliedSearch = ref({ academicSession: '', status: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const drawerVisible = ref(false)
const editingBatch = ref(null)
const coursesDrawerBatch = ref(null)
const exportModalVisible = ref(false)

const rows = computed(() => {
  let list = registrationBatches.value.map((batch) => ({
    ...batch,
    courseCount: countCoursesByBatch(batch.id),
  }))
  if (appliedSearch.value.academicSession) {
    list = list.filter((r) => (r.academicSession || r.semester || '').includes(appliedSearch.value.academicSession))
  }
  if (appliedSearch.value.status) {
    list = list.filter((r) => r.status === appliedSearch.value.status)
  }
  if (appliedSearch.value.keyword) {
    const kw = appliedSearch.value.keyword.toLowerCase()
    list = list.filter((r) => r.name.toLowerCase().includes(kw))
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
  searchForm.value = { academicSession: '', status: '', keyword: '' }
  appliedSearch.value = { academicSession: '', status: '', keyword: '' }
  currentPage.value = 1
}

function openCreate() {
  editingBatch.value = null
  drawerVisible.value = true
}

function openEdit(batch) {
  editingBatch.value = { ...batch }
  drawerVisible.value = true
}

function handleSave(payload) {
  if (editingBatch.value?.id) {
    const index = registrationBatches.value.findIndex((b) => b.id === editingBatch.value.id)
    if (index !== -1) {
      registrationBatches.value[index] = { ...registrationBatches.value[index], ...payload }
    }
  } else {
    addRegistrationBatch(payload)
  }
  drawerVisible.value = false
}

function handlePublish(batch) {
  publishRegistrationBatch(batch.id)
}

function openManageCourses(batch) {
  coursesDrawerBatch.value = batch
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = batchExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatBatchExportRow,
    filename: `registration-batches-${timestamp}.xlsx`,
    sheetName: 'Registration Batches',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-batch-page">
    <ModuleBriefPanel page-id="cr-batch" />

    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.batch.academicSession') }}</label>
              <select v-model="searchForm.academicSession" class="search-select" :class="{ 'is-empty': !searchForm.academicSession }">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in registrationAcademicSessionOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('common.status') }}</label>
              <select v-model="searchForm.status" class="search-select" :class="{ 'is-empty': !searchForm.status }">
                <option value="">{{ t('common.all') }}</option>
                <option value="draft">{{ t('courseRegistration.batch.status.draft') }}</option>
                <option value="active">{{ t('courseRegistration.batch.status.active') }}</option>
                <option value="closed">{{ t('courseRegistration.batch.status.closed') }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.batch.name') }}</label>
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
        <button type="button" class="btn btn-primary" @click="openCreate">
          + {{ t('courseRegistration.batch.new') }}
        </button>
        <button type="button" class="btn btn-outline" @click="exportModalVisible = true">
          {{ t('common.export') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.batch.name') }}</th>
              <th>{{ t('courseRegistration.batch.academicSession') }}</th>
              <th>{{ t('courseRegistration.batch.type') }}</th>
              <th class="col-round">{{ t('courseRegistration.batch.roundColPreselect') }}</th>
              <th class="col-round">{{ t('courseRegistration.batch.roundColMain') }}</th>
              <th class="col-round">{{ t('courseRegistration.batch.roundColSupplement') }}</th>
              <th class="col-round">{{ t('courseRegistration.batch.roundColAddDrop') }}</th>
              <th>{{ t('courseRegistration.batch.scope') }}</th>
              <th>{{ t('courseRegistration.batch.courseCount') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.academicSession || row.semester }}</td>
              <td>{{ getRegistrationTypeLabel(row.type, t) }}</td>
              <td
                class="col-round"
                :title="formatRoundRangeTitle(row.rounds?.preselect)"
              >
                {{ formatRoundRange(row.rounds?.preselect) }}
              </td>
              <td
                class="col-round"
                :title="formatRoundRangeTitle(row.rounds?.main)"
              >
                {{ formatRoundRange(row.rounds?.main) }}
              </td>
              <td
                class="col-round"
                :title="formatRoundRangeTitle(row.rounds?.supplement)"
              >
                {{ formatRoundRange(row.rounds?.supplement) }}
              </td>
              <td
                class="col-round"
                :title="formatRoundRangeTitle(row.addDropWindow)"
              >
                {{ formatRoundRange(row.addDropWindow) }}
              </td>
              <td>{{ row.scope.join(', ') }}</td>
              <td>
                <button type="button" class="link-btn" @click="openManageCourses(row)">{{ row.courseCount }}</button>
              </td>
              <td><RegistrationBatchStatusBadge :status="row.status" /></td>
              <td class="actions-cell">
                <button type="button" class="link-btn" @click="openEdit(row)">{{ t('common.edit') }}</button>
                <button type="button" class="link-btn" @click="openManageCourses(row)">
                  {{ t('courseRegistration.courses.manageCourses') }}
                </button>
                <button
                  v-if="row.status === 'draft'"
                  type="button"
                  class="link-btn"
                  @click="handlePublish(row)"
                >
                  {{ t('courseRegistration.batch.publish') }}
                </button>
              </td>
            </tr>
            <tr v-if="!paginatedRows.length">
              <td colspan="12" class="empty-cell">{{ t('common.noData') }}</td>
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

    <RegistrationBatchFormDrawer
      :visible="drawerVisible"
      :batch="editingBatch"
      @close="drawerVisible = false"
      @save="handleSave"
    />

    <BatchCoursesDrawer
      :visible="!!coursesDrawerBatch"
      :batch="coursesDrawerBatch"
      @close="coursesDrawerBatch = null"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="batchExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.col-round {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.actions-cell {
  white-space: nowrap;
}
</style>
