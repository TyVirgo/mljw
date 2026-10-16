<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import FeeRosterCoursesDrawer from '../../components/courseRegistration/FeeRosterCoursesDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  feeRosterRows,
  feeRosterAcademicSessionOptions,
  filterFeeRosterDetailRows,
  aggregateFeeRosterStudents,
  formatFeeRosterStudentExportRow,
  formatFeeRosterCourseExportRow,
  isFeeRosterRowPaid,
} from '../../data/courseRegistration/feeRosterQueue.js'
import {
  feeRosterStudentExportFields,
  feeRosterCourseExportFields,
} from '../../data/courseRegistration/courseRegistrationExportFields.js'
import { exportCourseRegistrationData } from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const emptyFilters = () => ({
  studentId: '',
  studentName: '',
  programme: '',
  intake: '',
  academicSession: '',
  outstandingFee: '',
  paid: '',
})

const searchExpanded = ref(true)
const searchForm = ref(emptyFilters())
const applied = ref(emptyFilters())
const currentPage = ref(1)
const pageSize = ref(20)
const detailStudent = ref(null)
const exportModalVisible = ref(false)
/** detail | summary */
const exportMode = ref('detail')
const selectedKeys = ref([])

const filteredDetails = computed(() =>
  filterFeeRosterDetailRows(feeRosterRows.value, { ...applied.value }),
)

const students = computed(() =>
  aggregateFeeRosterStudents(filteredDetails.value, filteredDetails.value),
)

const totalCount = computed(() => students.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return students.value.slice(start, start + pageSize.value)
})

function feeStudentKey(row) {
  return `${row.studentId}::${String(row.isPaid || 'N').toUpperCase()}`
}

const hasSelection = computed(() => selectedKeys.value.length > 0)
const allPageSelected = computed(() => {
  if (!paginatedRows.value.length) return false
  return paginatedRows.value.every((row) => selectedKeys.value.includes(feeStudentKey(row)))
})

const exportModes = computed(() => [
  { value: 'detail', label: t('courseRegistration.result.exportDetail') },
  { value: 'summary', label: t('courseRegistration.result.exportSummary') },
])

const exportFields = computed(() => {
  const list = exportMode.value === 'summary' ? feeRosterStudentExportFields : feeRosterCourseExportFields
  return list.map((f) => ({ key: f.key, label: t(f.labelKey) }))
})

function clearSelection() {
  selectedKeys.value = []
}

function handleSearch() {
  applied.value = { ...searchForm.value }
  currentPage.value = 1
  clearSelection()
}

function handleReset() {
  searchForm.value = emptyFilters()
  applied.value = emptyFilters()
  currentPage.value = 1
  clearSelection()
}

function outstandingLabel(value) {
  const fee = String(value || '').toUpperCase()
  if (fee === 'Y') return 'Y'
  if (fee === 'N') return 'N'
  return '—'
}

function isPaidLabel(value) {
  return String(value || '').toUpperCase() === 'Y' ? t('common.yes') : t('common.no')
}

function openCourses(row) {
  detailStudent.value = row
}

function toggleSelectAll(event) {
  const pageKeys = paginatedRows.value.map((row) => feeStudentKey(row))
  if (event.target.checked) {
    selectedKeys.value = [...new Set([...selectedKeys.value, ...pageKeys])]
  } else {
    selectedKeys.value = selectedKeys.value.filter((key) => !pageKeys.includes(key))
  }
}

function toggleSelect(key) {
  const index = selectedKeys.value.indexOf(key)
  if (index === -1) selectedKeys.value.push(key)
  else selectedKeys.value.splice(index, 1)
}

function openExportModal() {
  if (!students.value.length) return
  exportMode.value = 'detail'
  exportModalVisible.value = true
}

/**
 * 按范围取学生汇总行
 * @param {string} exportScope
 */
function resolveStudentRows(exportScope) {
  if (exportScope === 'selectedRows') {
    const keySet = new Set(selectedKeys.value)
    return students.value.filter((row) => keySet.has(feeStudentKey(row)))
  }
  if (exportScope === 'currentPage') return paginatedRows.value
  return students.value
}

/**
 * 学生汇总行 → 课程明细（匹配学号 + 已缴状态）
 * @param {object[]} studentRows
 */
function resolveCourseRowsForStudents(studentRows) {
  const pairs = new Set(
    studentRows.map((s) => `${s.studentId}::${String(s.isPaid || 'N').toUpperCase()}`),
  )
  return filteredDetails.value.filter((row) => {
    if (!String(row.courseCode || '').trim()) return false
    const paid = isFeeRosterRowPaid(row) ? 'Y' : 'N'
    return pairs.has(`${row.studentId}::${paid}`)
  })
}

function handleExportConfirm({ selectedFields, exportScope }) {
  const isSummary = exportMode.value === 'summary'
  const fieldDefs = isSummary ? feeRosterStudentExportFields : feeRosterCourseExportFields
  const columns = fieldDefs.filter((col) => selectedFields.includes(col.key))
  const studentRows = resolveStudentRows(exportScope)
  const exportRows = isSummary ? studentRows : resolveCourseRowsForStudents(studentRows)
  if (!exportRows.length) {
    window.alert(t('common.noData'))
    return
  }
  const timestamp = new Date().toISOString().slice(0, 10)
  exportCourseRegistrationData({
    rows: exportRows,
    columns,
    formatRow: isSummary ? formatFeeRosterStudentExportRow : formatFeeRosterCourseExportRow,
    filename: `fee-roster-${isSummary ? 'summary' : 'detail'}-${timestamp}.xlsx`,
    sheetName: isSummary
      ? t('courseRegistration.feeRoster.sheetStudents')
      : t('courseRegistration.feeRoster.sheetCourses'),
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-fee-roster-page">
    <div class="page-card">
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.feeRoster.hint') }}</p>
      </CourseRegistrationCallout>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.studentId') }}</label>
              <input
                v-model="searchForm.studentId"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.studentName') }}</label>
              <input
                v-model="searchForm.studentName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input
                v-model="searchForm.programme"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.intake') }}</label>
              <input
                v-model="searchForm.intake"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.feeRoster.academicSession') }}</label>
              <select v-model="searchForm.academicSession" class="search-select">
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
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              {{ t('common.reset') }}
            </button>
            <button type="button" class="toggle-link" @click="searchExpanded = !searchExpanded">
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
        <div v-if="searchExpanded" class="search-row search-row-secondary">
          <div class="search-fields">
            <div class="search-item">
              <label class="label-with-tip">
                <span>{{ t('courseRegistration.feeRoster.outstandingFee') }}</span>
                <span
                  class="tip-icon"
                  :title="t('courseRegistration.feeRoster.outstandingFeeTip')"
                  aria-hidden="true"
                  >?</span
                >
              </label>
              <select v-model="searchForm.outstandingFee" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.feeRoster.isPaid') }}</label>
              <select v-model="searchForm.paid" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="Y">{{ t('common.yes') }}</option>
                <option value="N">{{ t('common.no') }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-row">
        <div class="toolbar-actions">
          <button
            type="button"
            class="btn btn-outline"
            :disabled="!students.length"
            @click="openExportModal"
          >
            {{ t('common.export') }}
          </button>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
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
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="feeStudentKey(row)">
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedKeys.includes(feeStudentKey(row))"
                    @change="toggleSelect(feeStudentKey(row))"
                  />
                </td>
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
                  <span
                    class="fee-pill"
                    :class="String(row.isPaid || '').toUpperCase() === 'Y' ? 'n' : 'y'"
                  >
                    {{ isPaidLabel(row.isPaid) }}
                  </span>
                </td>
                <td>
                  <button type="button" class="link-btn" @click="openCourses(row)">
                    {{ t('courseRegistration.feeRoster.viewCourses') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="15" class="empty-cell">{{ t('common.noData') }}</td>
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

    <ExportModal
      :visible="exportModalVisible"
      :fields="exportFields"
      :has-selected-rows="hasSelection"
      :modes="exportModes"
      v-model:mode="exportMode"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
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
