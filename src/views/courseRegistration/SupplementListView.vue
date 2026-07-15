<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import SupplementEntryDrawer from '../../components/courseRegistration/SupplementEntryDrawer.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  supplementListQueue,
  supplementListTypes,
  filterSupplementList,
  removeSupplementEntry,
} from '../../data/courseRegistration/supplementListQueue.js'
import { supplementExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatSupplementExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const searchForm = ref({ listType: '', programme: '', keyword: '' })
const appliedSearch = ref({ listType: '', programme: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const detailEntry = ref(null)
const exportModalVisible = ref(false)

const rows = computed(() => filterSupplementList(supplementListQueue.value, appliedSearch.value))
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
  searchForm.value = { listType: '', programme: '', keyword: '' }
  appliedSearch.value = { listType: '', programme: '', keyword: '' }
  currentPage.value = 1
}

function typeLabel(type) {
  return t(`courseRegistration.supplement.types.${type}`)
}

function openDetail(row) {
  detailEntry.value = { ...row }
}

function handleRemove(row) {
  if (window.confirm(t('courseRegistration.supplement.removeConfirm'))) {
    removeSupplementEntry(row.id)
  }
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = supplementExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatSupplementExportRow,
    filename: `supplement-list-${timestamp}.xlsx`,
    sheetName: 'Supplement List',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-supplement-page">
    <ModuleBriefPanel page-id="cr-supplement" />

    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.supplement.listType') }}</label>
              <select v-model="searchForm.listType" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in supplementListTypes" :key="opt" :value="opt">{{ typeLabel(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input v-model="searchForm.programme" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.student') }}</label>
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
              <th>{{ t('courseRegistration.monitor.studentId') }}</th>
              <th>{{ t('courseRegistration.monitor.studentName') }}</th>
              <th>{{ t('courseRegistration.monitor.programme') }}</th>
              <th>Intake</th>
              <th>{{ t('courseRegistration.supplement.listType') }}</th>
              <th>{{ t('courseRegistration.supplement.permissions') }}</th>
              <th>{{ t('courseRegistration.supplement.addedAt') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.studentId }}</td>
              <td>{{ row.studentName }}</td>
              <td>{{ row.programme }}</td>
              <td>{{ row.intake }}</td>
              <td><span class="type-tag">{{ typeLabel(row.listType) }}</span></td>
              <td class="perm-cell">
                <span v-if="row.canAdd" class="perm">A</span>
                <span v-if="row.canDrop" class="perm">D</span>
                <span v-if="row.canRetake" class="perm">R</span>
                <span v-if="row.bypassCreditMax" class="perm special">+C</span>
              </td>
              <td>{{ row.addedAt }}</td>
              <td class="actions-cell">
                <button type="button" class="link-btn" @click="openDetail(row)">{{ t('common.edit') }}</button>
                <button type="button" class="link-btn danger" @click="handleRemove(row)">{{ t('common.delete') }}</button>
              </td>
            </tr>
            <tr v-if="!paginatedRows.length">
              <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
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

    <SupplementEntryDrawer
      :visible="!!detailEntry"
      :entry="detailEntry"
      @close="detailEntry = null"
      @saved="detailEntry = null"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="supplementExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.type-tag { padding: 2px 8px; background: #eff6ff; color: #2563eb; border-radius: 4px; font-size: 12px; }
.perm-cell { display: flex; gap: 4px; }
.perm { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 4px; font-size: 11px; font-weight: 600; }
.perm.special { background: #fef3c7; color: #b45309; }
.link-btn.danger { color: #dc2626; }
</style>
