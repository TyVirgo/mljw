<script setup>
import { ref, computed, watch } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import AddDropApprovalDetailDrawer from '../../components/courseRegistration/AddDropApprovalDetailDrawer.vue'
import AddDropApprovalModal from '../../components/courseRegistration/AddDropApprovalModal.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  addDropApprovalQueue,
  filterAddDropQueue,
  addDropTypeOptions,
  decideAddDropApplication,
  addDropApplicationHasBillableFee,
} from '../../data/courseRegistration/addDropApprovalQueue.js'
import { approvalExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatApprovalExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { getAddDropCourseColumnTexts } from '../../utils/addDropCourseDisplay.js'
import {
  displayClassTimeVenueLines,
  displayClassTimeVenueFromFields,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import { getAddDropApprovalListColumns, isShieldedAddDropType } from '../../data/courseRegistration/addDropListColumns.js'
import { addDropStatusBadgeClass } from '../../data/courseRegistration/addDropStatusBadge.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { formatAmountRmb } from '../../data/courseRegistration/addDropFeeRates.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'
import '../../styles/movement-status-badge.css'

const { t, tr, isZh } = useAppI18n()

const APPROVAL_TABS = [
  { id: 'pending', labelKey: 'courseRegistration.approval.tabs.pending' },
  { id: 'submitted', labelKey: 'courseRegistration.approval.tabs.submitted' },
  { id: 'history', labelKey: 'courseRegistration.approval.tabs.history' },
]

const activeTab = ref('pending')
const searchForm = ref({ programme: '', type: '', keyword: '' })
const appliedSearch = ref({ programme: '', type: '', keyword: '' })
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const detailApp = ref(null)
const detailMode = ref('readonly')
const exportModalVisible = ref(false)
const approvalModalVisible = ref(false)
const pendingApprovalIds = ref([])

const tabCounts = computed(() => {
  const counts = { pending: 0, submitted: 0, history: 0 }
  for (const row of addDropApprovalQueue.value) {
    if (isShieldedAddDropType(row.type)) continue
    if (row.status === 'Pending') counts.pending += 1
    else if (row.status === 'In Review') counts.submitted += 1
    else if (['Approved', 'Rejected', 'Cancelled'].includes(row.status)) counts.history += 1
  }
  return counts
})

const rows = computed(() => filterAddDropQueue(addDropApprovalQueue.value, activeTab.value, appliedSearch.value))

const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

const showApproveToolbar = computed(() => activeTab.value === 'pending')

const allPageSelected = computed(() => {
  if (!paginatedRows.value.length) return false
  return paginatedRows.value.every((row) => selectedIds.value.includes(row.id))
})

const selectedRows = computed(() =>
  selectedIds.value
    .map((id) => addDropApprovalQueue.value.find((row) => row.id === id))
    .filter((row) => row && row.status === 'Pending' && !isShieldedAddDropType(row.type)),
)

const canApproveSelection = computed(
  () => showApproveToolbar.value && selectedRows.value.length > 0,
)

const listColumns = computed(() =>
  getAddDropApprovalListColumns(appliedSearch.value.type || '', {
    showCheck: showApproveToolbar.value,
  }),
)
const tableColspan = computed(() => listColumns.value.length)

const batchShowGenerateBill = computed(() =>
  pendingApprovalIds.value.some((id) => {
    const row = addDropApprovalQueue.value.find((r) => r.id === id)
    return addDropApplicationHasBillableFee(row)
  }),
)

watch(activeTab, () => {
  currentPage.value = 1
  selectedIds.value = []
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  selectedIds.value = []
}

function handleReset() {
  searchForm.value = { programme: '', type: '', keyword: '' }
  appliedSearch.value = { programme: '', type: '', keyword: '' }
  currentPage.value = 1
  selectedIds.value = []
}

function typeLabel(type) {
  return t(`courseRegistration.approval.type.${type}`)
}

function typeClass(type) {
  const map = {
    Add: 'type-add',
    Drop: 'type-drop',
    Retake: 'type-retake',
    Replace: 'type-replace',
    AddDrop: 'type-mixed',
    RetakeDrop: 'type-mixed',
  }
  return map[type] || ''
}

function billLabel(status) {
  if (!status || status === 'none') return '—'
  return t(`courseRegistration.approval.bill.${status}`)
}

function courseColumns(row) {
  return getAddDropCourseColumnTexts(row)
}

function listSectionCode(row) {
  if (row.sectionName) return row.sectionName
  const item = row.items?.[0]
  if (item?.sectionName) return item.sectionName
  const code =
    row.sectionCode || row.addSectionCode || row.dropSectionCode || item?.section || ''
  return formatCourseSectionName(code, t)
}

function listWeekRange(row) {
  return row.weekRange || row.addWeekRange || row.dropWeekRange || row.items?.[0]?.weekRange || '1-18'
}

function listClassTimeVenueLines(row) {
  const locale = isZh.value ? 'zh' : 'en'
  const item = row.items?.[0] || {}
  const section = {
    time: item.time || row.time,
    room: item.room || row.venue || row.addVenue || row.dropVenue,
    weekRange: item.weekRange || row.weekRange || row.addWeekRange || row.dropWeekRange,
    meetings: item.meetings || row.meetings,
  }
  const lines = displayClassTimeVenueLines(section, locale)
  if (lines.length) return lines
  const one = displayClassTimeVenueFromFields(
    {
      time: section.time,
      classTime: row.classTime || row.addClassTime || row.dropClassTime || item.classTime,
      venue: section.room,
      weekRange: section.weekRange || '1-18',
    },
    locale,
  )
  return one && one !== '—' ? [one] : ['—']
}

function listLecturers(row) {
  return row.lecturers || row.addLecturers || row.dropLecturers || row.items?.[0]?.lecturer || 'Dr. Sarah'
}

function listFee(row) {
  const amount = row.billAmount ?? row.feeEstimate?.total
  if (amount == null || amount === '') return '—'
  return formatAmountRmb(amount)
}

function listExcessCredits(row) {
  const n =
    row.excessCredits ??
    row.billableCredits ??
    row.feeEstimate?.billableCredits ??
    (row.feeEstimate?.items || []).reduce((s, i) => s + (Number(i.billableCredits) || 0), 0)
  if (n == null || n === '') return '—'
  return Number(n) || 0
}

function listRetakeType(row) {
  const key = row.retakeType || ''
  if (!key) return '—'
  return t(
    `courseRegistration.student.retakeType.${
      key === 'improve_grade' ? 'improveGrade' : key === 'failed' ? 'failed' : 'other'
    }`,
  )
}

function feeWaiverLabel(row) {
  if (row.type !== 'Drop' && row.type !== 'AddDrop' && row.type !== 'RetakeDrop') return '—'
  if (row.feeWaiver === true) return t('courseRegistration.student.feeWaiverYes')
  if (row.feeWaiver === false) return t('courseRegistration.student.feeWaiverNo')
  return '—'
}

const COLUMN_HEADER_KEYS = {
  check: '',
  serial: 'common.serialNo',
  applicationNo: 'courseRegistration.approval.applicationNo',
  status: 'courseRegistration.approval.status',
  type: 'courseRegistration.approval.typeLabel',
  studentId: 'courseRegistration.monitor.studentId',
  studentName: 'courseRegistration.monitor.studentName',
  academicSession: 'courseRegistration.batch.academicSession',
  addCourse: 'courseRegistration.approval.addCourseName',
  dropCourse: 'courseRegistration.approval.dropCourseName',
  retakeCourse: 'courseRegistration.approval.retakeCourseName',
  section: 'courseRegistration.student.fieldGroupNo',
  weekRange: 'courseRegistration.student.fieldWeekRange',
  classTimeVenue: 'courseRegistration.student.fieldClassTimeVenue',
  classTime: 'courseRegistration.student.fieldClassTime',
  venue: 'courseRegistration.student.fieldVenue',
  lecturers: 'courseRegistration.student.fieldLecturers',
  excessCredits: 'courseRegistration.student.fieldExcessCredits',
  fee: 'courseRegistration.student.feeEstimateShort',
  retakeType: 'courseRegistration.student.retakeTypeLabel',
  feeWaiver: 'courseRegistration.student.feeWaiverLabel',
  credits: 'courseRegistration.monitor.credits',
  bill: 'courseRegistration.approval.billLabel',
  submittedAt: 'courseRegistration.approval.submittedAt',
  actions: 'common.actions',
}

function columnHeader(col) {
  if (col === 'check') return ''
  return t(COLUMN_HEADER_KEYS[col] || col)
}

function columnClass(col) {
  if (col === 'check') return 'col-check sticky-left sticky-check'
  if (col === 'serial') return 'sticky-left sticky-idx nowrap'
  if (col === 'applicationNo') return 'sticky-left sticky-no nowrap'
  if (col === 'status') return 'col-status nowrap'
  if (col === 'classTimeVenue') return 'col-time-venue'
  if (col === 'actions') return 'sticky-right sticky-actions'
  if (col === 'addCourse' || col === 'dropCourse' || col === 'retakeCourse') return 'col-course nowrap'
  return 'nowrap'
}

function cellText(col, row, index) {
  if (col === 'serial') return (currentPage.value - 1) * pageSize.value + index + 1
  if (col === 'applicationNo') return row.applicationNo
  if (col === 'studentId') return row.studentId
  if (col === 'studentName') return row.studentName
  if (col === 'academicSession') return row.academicSession || '—'
  if (col === 'addCourse') return courseColumns(row).add
  if (col === 'dropCourse') return courseColumns(row).drop
  if (col === 'retakeCourse') return courseColumns(row).retake
  if (col === 'section') return listSectionCode(row)
  if (col === 'weekRange') return listWeekRange(row)
  if (col === 'classTimeVenue') return listClassTimeVenueLines(row).join('\n')
  if (col === 'lecturers') return listLecturers(row)
  if (col === 'excessCredits') return listExcessCredits(row)
  if (col === 'fee') return listFee(row)
  if (col === 'retakeType') return listRetakeType(row)
  if (col === 'feeWaiver') return feeWaiverLabel(row)
  if (col === 'credits') return `${row.currentCredits}/${row.creditMax}`
  if (col === 'bill') return billLabel(row.billStatus)
  if (col === 'submittedAt') return row.submittedAt
  return ''
}

function resolveDetailMode(tab) {
  return tab === 'pending' ? 'approve' : 'readonly'
}

function openDetail(row) {
  detailApp.value = row
  detailMode.value = resolveDetailMode(activeTab.value)
}

function toggleSelectAll(event) {
  const pageIds = paginatedRows.value.map((row) => row.id)
  if (event.target.checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function openBatchApproval() {
  if (!canApproveSelection.value) {
    window.alert(tr('Please select one or more applications that can be approved.'))
    return
  }
  pendingApprovalIds.value = selectedRows.value.map((r) => r.id)
  approvalModalVisible.value = true
}

function handleBatchApprovalConfirm({ action, comment, generateBill }) {
  let failed = 0
  for (const id of pendingApprovalIds.value) {
    const row = addDropApprovalQueue.value.find((r) => r.id === id)
    if (!row || row.status !== 'Pending') continue
    const result = decideAddDropApplication(id, action, comment, { generateBill })
    if (!result.ok) failed += 1
  }
  pendingApprovalIds.value = []
  approvalModalVisible.value = false
  selectedIds.value = []
  if (failed > 0) {
    window.alert(t('courseRegistration.approval.batchPartialFail', { count: failed }))
  }
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = approvalExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatApprovalExportRow,
    filename: `add-drop-approval-${timestamp}.xlsx`,
    sheetName: 'Add Drop Approval',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-approval-page">
    <div class="page-card">
      <CourseRegistrationCallout variant="rule">
        <p>{{ t('courseRegistration.approval.mainFlowHint') }}</p>
      </CourseRegistrationCallout>

      <div class="tab-bar">
        <button
          v-for="tab in APPROVAL_TABS"
          :key="tab.id"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ t(tab.labelKey) }}
          <span v-if="tab.id === 'pending'" class="tab-count">{{ tabCounts.pending }}</span>
        </button>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input v-model="searchForm.programme" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.approval.typeLabel') }}</label>
              <select v-model="searchForm.type" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in addDropTypeOptions" :key="opt" :value="opt">{{ typeLabel(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.approval.applicationNo') }}</label>
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
        <button
          v-if="showApproveToolbar"
          type="button"
          class="btn btn-primary"
          :disabled="!canApproveSelection"
          @click="openBatchApproval"
        >
          {{ t('courseRegistration.approval.approve') }}
        </button>
        <button type="button" class="btn btn-outline" @click="exportModalVisible = true">
          {{ t('common.export') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap table-wrap--scroll">
          <table
            class="data-table data-table--sticky"
            :class="{ 'data-table--with-check': showApproveToolbar }"
          >
            <thead>
              <tr>
                <th
                  v-for="col in listColumns"
                  :key="col"
                  class="nowrap"
                  :class="columnClass(col)"
                >
                  <input
                    v-if="col === 'check'"
                    type="checkbox"
                    :checked="allPageSelected"
                    @change="toggleSelectAll"
                  />
                  <template v-else>{{ columnHeader(col) }}</template>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td
                  v-for="col in listColumns"
                  :key="col"
                  :class="columnClass(col)"
                >
                  <template v-if="col === 'check'">
                    <input
                      type="checkbox"
                      :checked="selectedIds.includes(row.id)"
                      @change="toggleSelect(row.id)"
                    />
                  </template>
                  <template v-else-if="col === 'status'">
                    <span class="status-badge" :class="addDropStatusBadgeClass(row.status)">
                      {{ t(`courseRegistration.approval.appStatus.${row.status}`) }}
                    </span>
                  </template>
                  <template v-else-if="col === 'type'">
                    <span class="type-tag" :class="typeClass(row.type)">{{ typeLabel(row.type) }}</span>
                  </template>
                  <template v-else-if="col === 'classTimeVenue'">
                    <div class="cr-time-venue">
                      <div
                        v-for="(line, li) in listClassTimeVenueLines(row)"
                        :key="li"
                        class="cr-time-venue-line"
                      >
                        {{ line }}
                      </div>
                    </div>
                  </template>
                  <template v-else-if="col === 'actions'">
                    <button type="button" class="link-btn" @click="openDetail(row)">
                      {{ t('common.details') }}
                    </button>
                  </template>
                  <template v-else>
                    {{ cellText(col, row, index) }}
                  </template>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td :colspan="tableColspan" class="empty-cell">{{ t('common.noData') }}</td>
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

    <AddDropApprovalDetailDrawer
      :visible="!!detailApp"
      :application="detailApp"
      :mode="detailMode"
      @close="detailApp = null"
      @updated="detailApp = null"
    />

    <AddDropApprovalModal
      :visible="approvalModalVisible"
      approval-stage="Academic Coordinator"
      :target-count="pendingApprovalIds.length"
      :show-generate-bill="batchShowGenerateBill"
      @close="approvalModalVisible = false"
      @confirm="handleBatchApprovalConfirm"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="approvalExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.col-check {
  width: 40px;
  text-align: center;
}

.col-course {
  max-width: 220px;
  font-size: 12px;
  color: #374151;
}

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.cr-time-venue {
  min-width: 220px;
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
}

.cr-time-venue-line {
  white-space: nowrap;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.col-time-venue {
  white-space: normal;
}

.col-status {
  min-width: 108px;
}

.type-add { background: #dbeafe; color: #1d4ed8; }
.type-drop { background: #fee2e2; color: #b91c1c; }
.type-retake { background: #fef3c7; color: #b45309; }
.type-replace { background: #e0e7ff; color: #4338ca; }
.type-mixed { background: #f3e8ff; color: #7c3aed; }

.nowrap {
  white-space: nowrap;
}

.table-wrap--scroll {
  overflow-x: auto;
  max-width: 100%;
}

.data-table--sticky {
  min-width: 1400px;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table--sticky th,
.data-table--sticky td {
  background: #fff;
}

.data-table--sticky thead th {
  background: #f9fafb;
  white-space: nowrap;
}

.sticky-left,
.sticky-right {
  position: sticky;
  z-index: 2;
}

.sticky-check {
  left: 0;
  min-width: 40px;
}

.sticky-idx {
  left: 0;
  min-width: 48px;
}

.sticky-no {
  left: 48px;
  min-width: 128px;
}

.data-table--with-check .sticky-idx {
  left: 40px;
}

.data-table--with-check .sticky-no {
  left: 88px;
}

.sticky-type {
  left: 198px;
  min-width: 88px;
  box-shadow: 4px 0 8px -6px rgba(15, 23, 42, 0.25);
}

.sticky-actions {
  right: 0;
  min-width: 72px;
  box-shadow: -4px 0 8px -6px rgba(15, 23, 42, 0.25);
}

thead .sticky-left,
thead .sticky-right {
  z-index: 3;
  background: #f9fafb;
}
</style>
