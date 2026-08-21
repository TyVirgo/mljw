<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import RegistrationBatchStatusBadge from '../../components/courseRegistration/RegistrationBatchStatusBadge.vue'
import RegistrationBatchFormDrawer from '../../components/courseRegistration/RegistrationBatchFormDrawer.vue'
import BatchRoundManageDrawer from '../../components/courseRegistration/BatchRoundManageDrawer.vue'
import BatchCoursesDrawer from '../../components/courseRegistration/BatchCoursesDrawer.vue'
import BatchScopeRuleRosterDrawer from '../../components/courseRegistration/BatchScopeRuleRosterDrawer.vue'
import YnSwitch from '../../components/common/YnSwitch.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  registrationBatches,
  addRegistrationBatch,
  publishRegistrationBatch,
  revokeRegistrationBatch,
  updateRegistrationBatch,
  formatRoundRange,
  formatRoundRangeDisplay,
  formatRoundRangeTitle,
} from '../../data/courseRegistration/registrationBatches.js'
import { ensureRoundsByAudience } from '../../data/courseRegistration/audienceRounds.js'
import { countCoursesByBatch } from '../../data/courseRegistration/selectableCourses.js'
import { countEligibleStudentsAcrossRounds } from '../../data/courseRegistration/batchStudentRoster.js'
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

const switchOnLabel = computed(() => t('common.yes'))
const switchOffLabel = computed(() => t('common.no'))

const searchForm = ref({ academicSession: '', status: '', keyword: '' })
const appliedSearch = ref({ academicSession: '', status: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(20)
const drawerVisible = ref(false)
const editingBatch = ref(null)
const coursesDrawerBatch = ref(null)
const roundsManageBatch = ref(null)
const studentListBatch = ref(null)
/** 打开学生清单时预选轮次 / 外层 Tab */
const studentListInitialRound = ref('global')
const studentListInitialOuterTab = ref('eligible')
const exportModalVisible = ref(false)

const rows = computed(() => {
  let list = registrationBatches.value.map((batch) => ({
    ...batch,
    courseCount: countCoursesByBatch(batch.id),
    eligibleStudentCount: countEligibleStudentsAcrossRounds(batch),
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

function openManageRounds(batch) {
  roundsManageBatch.value = { ...batch }
}

function handleRoundsSave(payload) {
  if (!roundsManageBatch.value?.id) return
  const index = registrationBatches.value.findIndex((b) => b.id === roundsManageBatch.value.id)
  if (index !== -1) {
    registrationBatches.value[index] = { ...registrationBatches.value[index], ...payload }
  }
  roundsManageBatch.value = null
}

function handlePublish(batch) {
  const name = batch?.name || batch?.id || ''
  if (!window.confirm(t('courseRegistration.batch.publishConfirm', { name }))) return
  publishRegistrationBatch(batch.id)
}

function handleRevoke(batch) {
  const name = batch?.name || batch?.id || ''
  if (!window.confirm(t('courseRegistration.batch.revokeConfirm', { name }))) return
  revokeRegistrationBatch(batch.id)
}

function handleSelectableToggle(batch, value) {
  updateRegistrationBatch(batch.id, { isSelectable: value !== false })
}

function openManageCourses(batch) {
  coursesDrawerBatch.value = batch
}

/**
 * 打开学生清单（可选学生 + 指定内层 Tab）
 * @param {{ batch: object, round?: string }} payload
 */
function handleOpenStudentListFromRounds({ batch, round }) {
  drawerVisible.value = false
  editingBatch.value = null
  roundsManageBatch.value = null
  studentListInitialOuterTab.value = 'eligible'
  studentListInitialRound.value = round || 'preselect'
  studentListBatch.value = batch
}

function openStudentList(batch) {
  studentListInitialOuterTab.value = 'eligible'
  studentListInitialRound.value = 'global'
  studentListBatch.value = batch
}

function audienceRoundDisplay(batch, audience, roundKey) {
  const by = ensureRoundsByAudience(batch)
  const range = by[audience]?.[roundKey]
  return formatRoundRangeDisplay(range, t)
}

function audienceRoundTitle(batch, audience, roundKey) {
  const by = ensureRoundsByAudience(batch)
  return formatRoundRangeTitle(by[audience]?.[roundKey])
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
          <table class="data-table batch-data-table">
            <thead>
              <tr>
                <th class="col-sticky-left col-no">{{ t('common.serialNo') }}</th>
                <th class="col-sticky-left col-name">{{ t('courseRegistration.batch.name') }}</th>
                <th>{{ t('courseRegistration.batch.academicSession') }}</th>
                <th>{{ t('courseRegistration.batch.type') }}</th>
                <th>{{ t('courseRegistration.batch.programme') }}</th>
                <th class="col-round">{{ t('courseRegistration.batch.roundColPreselect') }}</th>
                <th class="col-round">{{ t('courseRegistration.batch.roundColMain') }}</th>
                <th class="col-round">{{ t('courseRegistration.batch.roundColSupplement') }}</th>
                <th class="col-round">{{ t('courseRegistration.batch.roundColAddDrop') }}</th>
                <th class="col-eligible-count">
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.batch.scopeEligibleCountHint')"
                  >
                    {{ t('courseRegistration.batch.scopeEligibleCount') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th class="col-selectable">{{ t('courseRegistration.batch.isSelectable') }}</th>
                <th class="col-sticky-right col-status">{{ t('common.status') }}</th>
                <th class="col-sticky-right col-actions">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td class="col-sticky-left col-no">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>
                <td class="col-sticky-left col-name" :title="row.name">
                  <span class="col-name-text">{{ row.name }}</span>
                </td>
                <td>{{ row.academicSession || row.semester }}</td>
                <td>{{ getRegistrationTypeLabel(row.type, t) }}</td>
                <td>{{ row.type === 'ME' ? row.programme || '—' : '—' }}</td>
                <td
                  class="col-round col-round-dual"
                  :title="`${audienceRoundTitle(row, 'freshman', 'preselect')} / ${audienceRoundTitle(row, 'senior', 'preselect')}`"
                >
                  <div class="round-dual-line">
                    <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceFreshmanLabel') }}</span>
                    {{ audienceRoundDisplay(row, 'freshman', 'preselect') }}
                  </div>
                  <div class="round-dual-line">
                    <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceSeniorLabel') }}</span>
                    {{ audienceRoundDisplay(row, 'senior', 'preselect') }}
                  </div>
                </td>
                <td
                  class="col-round col-round-dual"
                  :title="`${audienceRoundTitle(row, 'freshman', 'main')} / ${audienceRoundTitle(row, 'senior', 'main')}`"
                >
                  <div class="round-dual-line">
                    <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceFreshmanLabel') }}</span>
                    {{ audienceRoundDisplay(row, 'freshman', 'main') }}
                  </div>
                  <div class="round-dual-line">
                    <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceSeniorLabel') }}</span>
                    {{ audienceRoundDisplay(row, 'senior', 'main') }}
                  </div>
                </td>
                <td
                  class="col-round col-round-dual"
                  :title="`${audienceRoundTitle(row, 'freshman', 'supplement')} / ${audienceRoundTitle(row, 'senior', 'supplement')}`"
                >
                  <div class="round-dual-line">
                    <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceFreshmanLabel') }}</span>
                    {{ audienceRoundDisplay(row, 'freshman', 'supplement') }}
                  </div>
                  <div class="round-dual-line">
                    <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceSeniorLabel') }}</span>
                    {{ audienceRoundDisplay(row, 'senior', 'supplement') }}
                  </div>
                </td>
                <td
                  class="col-round"
                  :title="formatRoundRangeTitle(row.addDropWindow)"
                >
                  {{ formatRoundRange(row.addDropWindow) }}
                </td>
                <td class="col-eligible-count">
                  <button type="button" class="link-btn" @click="openStudentList(row)">
                    {{ row.eligibleStudentCount }}
                  </button>
                </td>
                <td class="col-selectable">
                  <YnSwitch
                    :model-value="row.isSelectable !== false"
                    :on-label="switchOnLabel"
                    :off-label="switchOffLabel"
                    @update:model-value="(v) => handleSelectableToggle(row, v)"
                  />
                </td>
                <td class="col-sticky-right col-status">
                  <RegistrationBatchStatusBadge :status="row.status" />
                </td>
                <td class="col-sticky-right col-actions">
                  <button type="button" class="link-btn" @click="openEdit(row)">{{ t('common.edit') }}</button>
                  <button type="button" class="link-btn" @click="openManageRounds(row)">
                    {{ t('courseRegistration.batch.manageRounds') }}
                  </button>
                  <button type="button" class="link-btn" @click="openManageCourses(row)">
                    {{ t('courseRegistration.courses.manageCourses') }}
                  </button>
                  <button type="button" class="link-btn" @click="openStudentList(row)">
                    {{ t('courseRegistration.batch.studentList') }}
                  </button>
                  <button
                    v-if="row.status === 'draft'"
                    type="button"
                    class="link-btn"
                    @click="handlePublish(row)"
                  >
                    {{ t('courseRegistration.batch.publish') }}
                  </button>
                  <button
                    v-if="row.status === 'active'"
                    type="button"
                    class="link-btn"
                    @click="handleRevoke(row)"
                  >
                    {{ t('courseRegistration.batch.revoke') }}
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
      @open-student-list="handleOpenStudentListFromRounds"
    />

    <BatchRoundManageDrawer
      :visible="!!roundsManageBatch"
      :batch="roundsManageBatch"
      @close="roundsManageBatch = null"
      @save="handleRoundsSave"
      @open-student-list="handleOpenStudentListFromRounds"
    />

    <BatchCoursesDrawer
      :visible="!!coursesDrawerBatch"
      :batch="coursesDrawerBatch"
      @close="coursesDrawerBatch = null"
    />

    <BatchScopeRuleRosterDrawer
      :visible="!!studentListBatch"
      :batch="studentListBatch"
      :initial-outer-tab="studentListInitialOuterTab"
      :initial-round="studentListInitialRound"
      @close="studentListBatch = null"
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
.batch-data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.batch-data-table th,
.batch-data-table td {
  white-space: nowrap;
  vertical-align: middle;
  background: #fff;
  padding: 5px 10px;
  line-height: 1.35;
}

.batch-data-table th {
  background: #f9fafb;
  padding-top: 6px;
  padding-bottom: 6px;
}

.batch-data-table .col-no {
  width: 56px;
  min-width: 56px;
}

.batch-data-table .col-name {
  white-space: nowrap;
  max-width: none;
  min-width: 220px;
  width: auto;
}

.batch-data-table .col-name-text {
  display: inline;
  overflow: visible;
  line-height: 1.35;
  white-space: nowrap;
  word-break: normal;
}

.batch-data-table td.col-round {
  font-size: 12px;
  color: #6b7280;
}

.batch-data-table .col-round-dual {
  white-space: nowrap;
  min-width: 260px;
  vertical-align: middle;
  line-height: 1.3;
}

.round-dual-line {
  line-height: 1.3;
  margin-bottom: 1px;
  white-space: nowrap;
}

.round-dual-line:last-child {
  margin-bottom: 0;
}

.round-aud-tag {
  display: inline;
  margin-right: 2px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.batch-data-table .col-eligible-count {
  min-width: 120px;
  text-align: center;
  white-space: nowrap;
}

.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  flex-shrink: 0;
}

.batch-data-table .col-selectable {
  min-width: 88px;
  text-align: center;
}

.batch-data-table .col-actions {
  min-width: 300px;
}

.batch-data-table .col-sticky-left {
  position: sticky;
  z-index: 2;
}

.batch-data-table thead .col-sticky-left {
  z-index: 4;
  background: #f9fafb;
}

.batch-data-table .col-no.col-sticky-left {
  left: 0;
}

.batch-data-table .col-name.col-sticky-left {
  left: 56px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.1);
}

.batch-data-table .col-sticky-right {
  position: sticky;
  z-index: 2;
}

.batch-data-table thead .col-sticky-right {
  z-index: 4;
  background: #f9fafb;
}

.batch-data-table .col-actions.col-sticky-right {
  right: 0;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.1);
}

.batch-data-table .col-status.col-sticky-right {
  right: 300px;
  border-left: 1px solid #f3f4f6;
}

.batch-data-table .empty-cell {
  white-space: normal;
}
</style>
