<script setup>
import { ref, computed, watch } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import FeeRosterCoursesDrawer from '../../components/courseRegistration/FeeRosterCoursesDrawer.vue'
import FeeRosterPaidImportModal from '../../components/courseRegistration/FeeRosterPaidImportModal.vue'
import FeeRosterUnpaidAddModal from '../../components/courseRegistration/FeeRosterUnpaidAddModal.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  feeRosterRows,
  feeRosterAcademicSessionOptions,
  filterFeeRosterDetailRows,
  aggregateFeeRosterStudents,
  formatFeeRosterStudentExportRow,
  formatFeeRosterCourseExportRow,
  syncUnpaidOverCreditStudents,
} from '../../data/courseRegistration/feeRosterQueue.js'
import {
  feeRosterStudentExportFields,
  feeRosterCourseExportFields,
} from '../../data/courseRegistration/courseRegistrationExportFields.js'
import { exportMultiSheetExcel } from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const emptyUnpaidFilters = () => ({
  studentId: '',
  studentName: '',
  programme: '',
  intake: '',
  academicSession: '',
  outstandingFee: '',
})

const emptyPaidFilters = () => ({
  studentId: '',
  studentName: '',
  programme: '',
  intake: '',
  academicSession: '',
})

const activeTab = ref('unpaid')
const searchExpanded = ref(true)
const unpaidSearchForm = ref(emptyUnpaidFilters())
const unpaidApplied = ref(emptyUnpaidFilters())
const paidSearchForm = ref(emptyPaidFilters())
const paidApplied = ref(emptyPaidFilters())
const currentPage = ref(1)
const pageSize = ref(20)
const detailStudent = ref(null)
const paidImportVisible = ref(false)
const unpaidAddVisible = ref(false)
const syncConfirmVisible = ref(false)
const syncMessage = ref('')
const syncMessageError = ref(false)

/** 未缴费明细（paid=N） */
const unpaidDetails = computed(() =>
  filterFeeRosterDetailRows(feeRosterRows.value, { ...unpaidApplied.value, paid: 'N' }),
)
const unpaidStudents = computed(() =>
  aggregateFeeRosterStudents(unpaidDetails.value, unpaidDetails.value),
)

/** 已缴费明细（paid=Y），搜索不含欠学费条件 */
const paidDetails = computed(() =>
  filterFeeRosterDetailRows(feeRosterRows.value, { ...paidApplied.value, paid: 'Y' }),
)
const paidStudents = computed(() =>
  aggregateFeeRosterStudents(paidDetails.value, paidDetails.value),
)

const currentRows = computed(() =>
  activeTab.value === 'unpaid' ? unpaidStudents.value : paidStudents.value,
)
const totalCount = computed(() => currentRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return currentRows.value.slice(start, start + pageSize.value)
})

watch(activeTab, () => {
  currentPage.value = 1
})

function handleSearch() {
  if (activeTab.value === 'unpaid') {
    unpaidApplied.value = { ...unpaidSearchForm.value }
  } else {
    paidApplied.value = { ...paidSearchForm.value }
  }
  currentPage.value = 1
}

function handleReset() {
  if (activeTab.value === 'unpaid') {
    unpaidSearchForm.value = emptyUnpaidFilters()
    unpaidApplied.value = emptyUnpaidFilters()
  } else {
    paidSearchForm.value = emptyPaidFilters()
    paidApplied.value = emptyPaidFilters()
  }
  currentPage.value = 1
}

function outstandingLabel(value) {
  const fee = String(value || '').toUpperCase()
  if (fee === 'Y') return 'Y'
  if (fee === 'N') return 'N'
  return '—'
}

/** 是否缴费展示：是 / 否 */
function isPaidLabel(value) {
  return String(value || '').toUpperCase() === 'Y' ? t('common.yes') : t('common.no')
}

function openCourses(row) {
  detailStudent.value = row
}

function handleExport() {
  if (!unpaidStudents.value.length) return
  const studentIds = new Set(unpaidStudents.value.map((s) => s.studentId))
  const courseRows = unpaidDetails.value.filter(
    (row) => studentIds.has(row.studentId) && String(row.courseCode || '').trim(),
  )
  const timestamp = new Date().toISOString().slice(0, 10)
  exportMultiSheetExcel(
    [
      {
        name: t('courseRegistration.feeRoster.sheetStudents'),
        rows: unpaidStudents.value,
        columns: feeRosterStudentExportFields,
        formatRow: formatFeeRosterStudentExportRow,
      },
      {
        name: t('courseRegistration.feeRoster.sheetCourses'),
        rows: courseRows,
        columns: feeRosterCourseExportFields,
        formatRow: formatFeeRosterCourseExportRow,
      },
    ],
    `fee-roster-${timestamp}.xlsx`,
    { t },
  )
}

function onImported() {
  currentPage.value = 1
}

function onUnpaidSaved() {
  currentPage.value = 1
}

function requestSyncOverCredit() {
  syncMessage.value = ''
  syncMessageError.value = false
  syncConfirmVisible.value = true
}

function handleSyncOverCredit() {
  syncConfirmVisible.value = false
  try {
    const outcome = syncUnpaidOverCreditStudents()
    const parts = []
    if (outcome.added) {
      parts.push(t('courseRegistration.feeRoster.syncAdded', { count: outcome.added }))
    }
    if (outcome.skippedExist) {
      parts.push(t('courseRegistration.feeRoster.syncSkippedExist', { count: outcome.skippedExist }))
    }
    if (outcome.skippedPaid) {
      parts.push(t('courseRegistration.feeRoster.syncSkippedPaid', { count: outcome.skippedPaid }))
    }
    syncMessage.value = parts.join(' ') || t('courseRegistration.feeRoster.syncNothing')
    syncMessageError.value = false
    currentPage.value = 1
  } catch {
    syncMessage.value = t('courseRegistration.feeRoster.syncFailed')
    syncMessageError.value = true
  }
}
</script>

<template>
  <div class="cr-list-page cr-fee-roster-page">
    <div class="page-card">
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.feeRoster.hint') }}</p>
      </CourseRegistrationCallout>

      <div class="tab-bar">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'unpaid' }"
          @click="activeTab = 'unpaid'"
        >
          {{ t('courseRegistration.feeRoster.tabUnpaid') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'paid' }"
          @click="activeTab = 'paid'"
        >
          {{ t('courseRegistration.feeRoster.tabPaid') }}
        </button>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <template v-if="activeTab === 'unpaid'">
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                <input
                  v-model="unpaidSearchForm.studentId"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                <input
                  v-model="unpaidSearchForm.studentName"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.programme') }}</label>
                <input
                  v-model="unpaidSearchForm.programme"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.intake') }}</label>
                <input
                  v-model="unpaidSearchForm.intake"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.feeRoster.academicSession') }}</label>
                <select v-model="unpaidSearchForm.academicSession" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option
                    v-for="session in feeRosterAcademicSessionOptions"
                    :key="session"
                    :value="session"
                  >
                    {{ session }}
                  </option>
                </select>
              </div>
            </template>
            <template v-else>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                <input
                  v-model="paidSearchForm.studentId"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                <input
                  v-model="paidSearchForm.studentName"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.programme') }}</label>
                <input
                  v-model="paidSearchForm.programme"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.intake') }}</label>
                <input
                  v-model="paidSearchForm.intake"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.feeRoster.academicSession') }}</label>
                <select v-model="paidSearchForm.academicSession" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option
                    v-for="session in feeRosterAcademicSessionOptions"
                    :key="session"
                    :value="session"
                  >
                    {{ session }}
                  </option>
                </select>
              </div>
            </template>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              {{ t('common.reset') }}
            </button>
            <button
              v-if="activeTab === 'unpaid'"
              type="button"
              class="toggle-link"
              @click="searchExpanded = !searchExpanded"
            >
              {{ searchExpanded ? t('common.collapse') : t('common.more') }}
              <svg
                :class="{ up: searchExpanded }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
        <div
          v-if="activeTab === 'unpaid' && searchExpanded"
          class="search-row search-row-secondary"
        >
          <div class="search-fields">
            <div class="search-item">
              <label class="label-with-tip">
                <span>{{ t('courseRegistration.feeRoster.outstandingFee') }}</span>
                <span
                  class="tip-icon"
                  :title="t('courseRegistration.feeRoster.outstandingFeeTip')"
                  aria-hidden="true"
                >?</span>
              </label>
              <select v-model="unpaidSearchForm.outstandingFee" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-row">
        <template v-if="activeTab === 'unpaid'">
          <div class="toolbar-actions">
            <button type="button" class="btn btn-primary" @click="unpaidAddVisible = true">
              {{ t('common.create') }}
            </button>
            <button type="button" class="btn btn-default" @click="requestSyncOverCredit">
              {{ t('courseRegistration.feeRoster.sync') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="!unpaidStudents.length"
              @click="handleExport"
            >
              {{ t('common.export') }}
            </button>
          </div>
          <span class="toolbar-meta">
            {{ t('courseRegistration.feeRoster.metaStudents', { count: totalCount }) }}
          </span>
        </template>
        <template v-else>
          <div class="toolbar-actions">
            <button type="button" class="btn btn-primary" @click="paidImportVisible = true">
              {{ t('common.import') }}
            </button>
          </div>
          <span class="toolbar-meta">
            {{ t('courseRegistration.feeRoster.metaPaidStudents', { count: totalCount }) }}
          </span>
        </template>
      </div>

      <p
        v-if="syncMessage"
        class="sync-message"
        :class="{ 'sync-message--error': syncMessageError }"
      >
        {{ syncMessage }}
      </p>

      <div class="table-section">
        <div class="table-wrap">
          <!-- 未缴费/已缴费共用主表：按是否缴费分页；已缴费多导入名单日期 -->
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                <th>{{ t('courseRegistration.monitor.programme') }}</th>
                <th>{{ t('courseRegistration.monitor.intake') }}</th>
                <th>{{ t('courseRegistration.feeRoster.academicSession') }}</th>
                <th>{{ t('courseRegistration.feeRoster.courseCount') }}</th>
                <th>{{ t('courseRegistration.feeRoster.enrolledCredits') }}</th>
                <th>{{ t('courseRegistration.feeRoster.creditMin') }}</th>
                <th>{{ t('courseRegistration.feeRoster.creditMax') }}</th>
                <th>{{ t('courseRegistration.feeRoster.billableCredits') }}</th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.feeRoster.outstandingFeeTip')"
                  >
                    {{ t('courseRegistration.feeRoster.outstandingFee') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>{{ t('courseRegistration.feeRoster.isPaid') }}</th>
                <th v-if="activeTab === 'paid'">{{ t('courseRegistration.feeRoster.paidAt') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="`${row.studentId}-${row.isPaid}`">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.studentId }}</td>
                <td>{{ row.studentName }}</td>
                <td>{{ row.programme }}</td>
                <td>{{ row.intake }}</td>
                <td>{{ row.academicSession || '—' }}</td>
                <td>{{ row.courseCount }}</td>
                <td>{{ row.enrolledCredits }}</td>
                <td>{{ row.creditMin }}</td>
                <td>{{ row.creditMax }}</td>
                <td>{{ row.billableCredits }}</td>
                <td>
                  <span class="fee-pill" :class="String(row.outstandingFee || '').toLowerCase()">
                    {{ outstandingLabel(row.outstandingFee) }}
                  </span>
                </td>
                <td>
                  <!-- 是否缴费：是=绿、否=红（与欠学费语义相反） -->
                  <span
                    class="fee-pill"
                    :class="String(row.isPaid || '').toUpperCase() === 'Y' ? 'n' : 'y'"
                  >
                    {{ isPaidLabel(row.isPaid) }}
                  </span>
                </td>
                <td v-if="activeTab === 'paid'">{{ row.paidAt || '—' }}</td>
                <td>
                  <button type="button" class="link-btn" @click="openCourses(row)">
                    {{ t('courseRegistration.feeRoster.viewCourses') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td :colspan="activeTab === 'paid' ? 15 : 14" class="empty-cell">
                  {{ t('common.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination v-model="currentPage" v-model:page-size="pageSize" :total="totalCount" />
      </div>
    </div>

    <FeeRosterCoursesDrawer
      :visible="!!detailStudent"
      :student="detailStudent"
      @close="detailStudent = null"
    />
    <FeeRosterUnpaidAddModal
      :visible="unpaidAddVisible"
      @close="unpaidAddVisible = false"
      @saved="onUnpaidSaved"
    />
    <FeeRosterPaidImportModal
      :visible="paidImportVisible"
      @close="paidImportVisible = false"
      @imported="onImported"
    />
    <ConfirmDialog
      :visible="syncConfirmVisible"
      :title="t('courseRegistration.feeRoster.syncConfirmTitle')"
      :message="t('courseRegistration.feeRoster.syncConfirmMessage')"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      confirm-variant="primary"
      @confirm="handleSyncOverCredit"
      @cancel="syncConfirmVisible = false"
    />
  </div>
</template>

<style scoped>
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px 12px;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-meta {
  font-size: 13px;
  color: #6b7280;
  margin-left: auto;
}

.sync-message {
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.sync-message--error {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.label-with-tip,
.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.th-with-tip {
  cursor: help;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #9ca3af;
  font-size: 10px;
  line-height: 1;
  color: #6b7280;
  cursor: help;
}

.fee-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.fee-pill.y {
  background: #fee2e2;
  color: #b91c1c;
}

.fee-pill.n {
  background: #d1fae5;
  color: #047857;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}

.data-table th,
.data-table td {
  white-space: nowrap;
}

.table-wrap {
  overflow: auto;
}

.data-table {
  width: max-content;
  min-width: 100%;
}
</style>
