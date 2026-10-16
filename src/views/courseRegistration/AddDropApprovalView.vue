<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import AddDropApprovalDetailDrawer from '../../components/courseRegistration/AddDropApprovalDetailDrawer.vue'
import AddDropApprovalModal from '../../components/courseRegistration/AddDropApprovalModal.vue'
import AddDropBillDetailDrawer from '../../components/courseRegistration/AddDropBillDetailDrawer.vue'
import AddDropOrderRegenModal from '../../components/courseRegistration/AddDropOrderRegenModal.vue'
import MonitorRemindModal from '../../components/courseRegistration/MonitorRemindModal.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  addDropApprovalQueue,
  filterAddDropQueue,
  addDropTypeOptions,
  decideAddDropApplication,
  addDropApplicationHasBillableFee,
  incrementPaymentRemindCount,
  ensureApplicationItems,
  canAbortApprovedAddDropBill,
  abortApprovedAddDropApplication,
} from '../../data/courseRegistration/addDropApprovalQueue.js'
import {
  approvalExportFields,
  approvalPaymentExportFields,
  approvalPaymentExportMergeFieldKeys,
} from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatApprovalExportRow,
  formatApprovalPaymentExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { getAddDropCourseColumnTexts } from '../../utils/addDropCourseDisplay.js'
import {
  displayClassTimeVenueLines,
  displayClassTimeVenueFromFields,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import { getAddDropApprovalListColumns, isShieldedAddDropType } from '../../data/courseRegistration/addDropListColumns.js'
import {
  addDropTypeLabelKey,
  addDropTypeTagClass,
  addDropPrimaryOptionLabelKey,
  resolveAppNeedDrop,
} from '../../data/courseRegistration/addDropTypeDisplay.js'
import { addDropStatusBadgeClass } from '../../data/courseRegistration/addDropStatusBadge.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import {
  formatAmountRmb,
  resolveAddDropExcessCredits,
} from '../../data/courseRegistration/addDropFeeRates.js'
import {
  ensureHistoryPaymentDueDemo,
  getPaymentRemainingInfo,
  formatRemainingDuration,
  canShowBillDetail,
  canRemindPayment,
  canRegeneratePaymentOrder,
  buildPaymentRemindDraft,
  collectApprovalPaymentExportLines,
} from '../../data/courseRegistration/adminAddDropPaymentInsight.js'
import {
  ensureDateTimeWithSeconds,
  registrationAcademicSessionOptions,
} from '../../data/courseRegistration/registrationBatchFormUtils.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'
import '../../styles/movement-status-badge.css'

const { t, isZh } = useAppI18n()

const APPROVAL_TABS = [
  { id: 'pending', labelKey: 'courseRegistration.approval.tabs.pending' },
  { id: 'history', labelKey: 'courseRegistration.approval.tabs.history' },
]

const EMPTY_SEARCH = {
  programme: '',
  type: '',
  status: '',
  billStatus: '',
  academicSession: '',
  studentId: '',
  studentName: '',
  keyword: '',
}

const BILL_STATUS_OPTIONS = ['pending', 'paid', 'cancelled', 'none']
const PENDING_STATUS_OPTIONS = ['Pending', 'In Review']
const HISTORY_STATUS_OPTIONS = ['Approved', 'PartiallyApproved', 'Rejected', 'Cancelled']

const activeTab = ref('pending')
const searchExpanded = ref(true)
const searchForm = ref({ ...EMPTY_SEARCH })
const appliedSearch = ref({ ...EMPTY_SEARCH })
const currentPage = ref(1)
const pageSize = ref(20)
const detailApp = ref(null)
const detailMode = ref('readonly')
const exportModalVisible = ref(false)
/** 缴费课行导出弹窗 */
const paymentExportModalVisible = ref(false)
const approvalModalVisible = ref(false)
const pendingApprovalIds = ref([])
const billDetailApp = ref(null)
const remindApp = ref(null)
const regenApp = ref(null)
const pageToast = ref('')
const nowTick = ref(Date.now())
let tickTimer = null

onMounted(() => {
  ensureHistoryPaymentDueDemo()
  tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 30_000)
})

onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
})

const tabCounts = computed(() => {
  const counts = { pending: 0, history: 0 }
  for (const row of addDropApprovalQueue.value) {
    if (isShieldedAddDropType(row.type)) continue
    if (row.status === 'Pending' || row.status === 'In Review') counts.pending += 1
    else if (['Approved', 'Rejected', 'Cancelled', 'PartiallyApproved'].includes(row.status)) counts.history += 1
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

const isPendingTab = computed(() => activeTab.value === 'pending')
const isHistoryTab = computed(() => activeTab.value === 'history')

const statusFilterOptions = computed(() =>
  isHistoryTab.value ? HISTORY_STATUS_OPTIONS : PENDING_STATUS_OPTIONS,
)

const academicSessionOptions = registrationAcademicSessionOptions

const listColumns = computed(() =>
  getAddDropApprovalListColumns(appliedSearch.value.type || '', {
    showCheck: false,
    showPaymentRemaining: isHistoryTab.value,
  }),
)
const tableColspan = computed(() => listColumns.value.length)

const approvalShowGenerateBill = computed(() => {
  const id = pendingApprovalIds.value[0]
  if (!id) return false
  const row = addDropApprovalQueue.value.find((r) => r.id === id)
  return addDropApplicationHasBillableFee(row)
})

watch(activeTab, (tab) => {
  currentPage.value = 1
  if (tab === 'history') ensureHistoryPaymentDueDemo()
  // Tab 切换时清空不适用的状态筛选
  if (searchForm.value.status && !statusFilterOptions.value.includes(searchForm.value.status)) {
    searchForm.value = { ...searchForm.value, status: '' }
    appliedSearch.value = { ...appliedSearch.value, status: '' }
  }
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = { ...EMPTY_SEARCH }
  appliedSearch.value = { ...EMPTY_SEARCH }
  currentPage.value = 1
}

function statusFilterLabel(status) {
  return t(`courseRegistration.approval.appStatus.${status}`)
}

function billStatusFilterLabel(status) {
  return t(`courseRegistration.approval.bill.${status}`)
}

function canApproveRow(row) {
  if (!row) return false
  if (isShieldedAddDropType(row.type)) return false
  return row.status === 'Pending' || row.status === 'In Review'
}

function typeLabel(type) {
  return t(addDropTypeLabelKey(type))
}

function typeClass(type) {
  return addDropTypeTagClass(type)
}

/** 筛选主类型三选一文案 */
function primaryOptionLabel(primary) {
  return t(addDropPrimaryOptionLabelKey(primary))
}

function billLabel(status) {
  if (!status || status === 'none') return '—'
  return t(`courseRegistration.approval.bill.${status}`)
}

function paymentRemainingText(row) {
  void nowTick.value
  const info = getPaymentRemainingInfo(row, nowTick.value)
  // 已缴账单：剩余时间列展示「已缴费」
  if (info.kind === 'settled' || row?.billStatus === 'paid') {
    return t('courseRegistration.approval.paymentRemainingPaid')
  }
  if (info.kind === 'none') return '—'
  if (info.kind === 'overdue') return t('courseRegistration.approval.paymentOverdue')
  if (info.kind === 'unknown') return t(info.labelKey)
  if (info.kind === 'remaining') return formatRemainingDuration(info.remainingMs, t)
  return '—'
}

function paymentRemainingClass(row) {
  void nowTick.value
  const info = getPaymentRemainingInfo(row, nowTick.value)
  if (info.kind === 'overdue') return 'pay-remain is-overdue'
  if (info.urgent) return 'pay-remain is-urgent'
  if (info.warn) return 'pay-remain is-warn'
  return 'pay-remain'
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
  return resolveAddDropExcessCredits(row)
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

function feeWaiverLabel(_row) {
  return '—'
}

const COLUMN_HEADER_KEYS = {
  check: '',
  serial: 'common.serialNo',
  applicationNo: 'courseRegistration.approval.applicationNo',
  status: 'courseRegistration.approval.status',
  type: 'courseRegistration.approval.typeLabel',
  needDrop: 'courseRegistration.approval.needDropColumn',
  studentId: 'courseRegistration.monitor.studentId',
  studentName: 'courseRegistration.monitor.studentName',
  programme: 'courseRegistration.monitor.programme',
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
  paymentRemindCount: 'courseRegistration.approval.paymentRemindCount',
  paymentRemaining: 'courseRegistration.approval.paymentRemainingLabel',
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
  if (col === 'needDrop') return 'col-compact col-need-drop'
  if (col === 'excessCredits') return 'col-compact col-excess'
  if (col === 'fee') return 'col-compact col-fee'
  if (col === 'bill') return 'col-compact col-bill'
  if (col === 'paymentRemindCount') return 'col-compact col-remind-count'
  if (col === 'paymentRemaining') return 'col-remaining'
  if (col === 'actions') {
    return isHistoryTab.value
      ? 'sticky-right sticky-actions sticky-actions--history nowrap'
      : 'sticky-right sticky-actions sticky-actions--simple nowrap'
  }
  if (col === 'addCourse' || col === 'dropCourse' || col === 'retakeCourse') return 'col-course nowrap'
  return 'nowrap'
}

function cellText(col, row, index) {
  if (col === 'serial') return (currentPage.value - 1) * pageSize.value + index + 1
  if (col === 'applicationNo') return row.applicationNo
  if (col === 'studentId') return row.studentId
  if (col === 'studentName') return row.studentName
  if (col === 'programme') return row.programmeName || row.programme || row.programmeCode || '—'
  if (col === 'academicSession') return row.academicSession || '—'
  if (col === 'needDrop') {
    return resolveAppNeedDrop(row) === 'yes' ? t('common.yes') : t('common.no')
  }
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
  if (col === 'paymentRemindCount') {
    if (row.billStatus === 'none' || row.billStatus == null) return '—'
    const n = Number(row.paymentRemindCount) || 0
    if (n <= 0) return t('courseRegistration.approval.paymentRemindCountZero')
    return t('courseRegistration.approval.paymentRemindCountTimes', { n })
  }
  if (col === 'paymentRemaining') return paymentRemainingText(row)
  if (col === 'submittedAt') return ensureDateTimeWithSeconds(row.submittedAt) || row.submittedAt || ''
  return ''
}

function resolveDetailMode(tab) {
  return tab === 'pending' ? 'approve' : 'readonly'
}

function openDetail(row) {
  detailApp.value = ensureApplicationItems(row) || row
  detailMode.value = resolveDetailMode(activeTab.value)
}

function openBillDetail(row) {
  billDetailApp.value = row
}

function openPaymentRemind(row) {
  remindApp.value = row
}

function openOrderRegen(row) {
  regenApp.value = row
}

function handlePaymentRemindConfirm({ row }) {
  if (row?.id) incrementPaymentRemindCount(row.id)
  remindApp.value = null
  pageToast.value = t('courseRegistration.approval.paymentRemindSent', {
    name: row?.studentName || '',
  })
  window.setTimeout(() => {
    if (pageToast.value) pageToast.value = ''
  }, 3200)
}

function handleOrderRegenConfirm() {
  regenApp.value = null
  nowTick.value = Date.now()
  pageToast.value = t('courseRegistration.approval.regenSuccess')
  window.setTimeout(() => {
    if (pageToast.value) pageToast.value = ''
  }, 3200)
}

function handleAbortApplication(row) {
  if (!row?.id || !canAbortApprovedAddDropBill(row)) return
  const ok = window.confirm(
    t('courseRegistration.approval.abortConfirm', { name: row.studentName || row.applicationNo }),
  )
  if (!ok) return
  const result = abortApprovedAddDropApplication(row.id)
  if (!result.ok) {
    window.alert(t(result.errorKey || 'courseRegistration.approval.abortNotAllowed'))
    return
  }
  nowTick.value = Date.now()
  pageToast.value = t('courseRegistration.approval.abortSuccess', {
    name: row.studentName || '',
  })
  window.setTimeout(() => {
    if (pageToast.value) pageToast.value = ''
  }, 3200)
}

const singleApprovalApp = computed(() => {
  const id = pendingApprovalIds.value[0]
  if (!id) return null
  const row = addDropApprovalQueue.value.find((r) => r.id === id)
  return ensureApplicationItems(row)
})

function openRowApproval(row) {
  if (!canApproveRow(row)) return
  ensureApplicationItems(row)
  pendingApprovalIds.value = [row.id]
  approvalModalVisible.value = true
}

function handleApprovalConfirm({ action, comment, generateBill, lineDecisions }) {
  const id = pendingApprovalIds.value[0]
  pendingApprovalIds.value = []
  approvalModalVisible.value = false
  if (!id) return
  const row = addDropApprovalQueue.value.find((r) => r.id === id)
  if (!row || (row.status !== 'Pending' && row.status !== 'In Review')) return
  const result = decideAddDropApplication(id, action, comment, {
    generateBill,
    lineDecisions,
  })
  if (!result.ok) {
    window.alert(t(result.errorKey || 'courseRegistration.approval.invalidAction'))
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

/**
 * 打开缴费导出：无课行则提示
 */
function openPaymentExportModal() {
  const lines = collectApprovalPaymentExportLines(rows.value)
  if (!lines.length) {
    window.alert(t('common.noData'))
    return
  }
  paymentExportModalVisible.value = true
}

/**
 * 确认导出缴费课行明细
 * @param {{ selectedFields: string[] }} payload
 */
function handlePaymentExportConfirm({ selectedFields }) {
  const lines = collectApprovalPaymentExportLines(rows.value)
  if (!lines.length) {
    window.alert(t('common.noData'))
    paymentExportModalVisible.value = false
    return
  }
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = approvalPaymentExportFields.filter((col) => selectedFields.includes(col.key))
  // 仅合并当前勾选中的整单列
  const mergeFieldKeys = approvalPaymentExportMergeFieldKeys.filter((key) =>
    selectedFields.includes(key),
  )
  exportCourseRegistrationData({
    rows: lines,
    columns,
    formatRow: formatApprovalPaymentExportRow,
    filename: `add-drop-payment-${timestamp}.xlsx`,
    sheetName: t('courseRegistration.approval.exportPaymentSheet'),
    i18n: { t },
    mergeByKey: 'mergeKey',
    mergeFieldKeys,
  })
  paymentExportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-approval-page">
    <div class="page-card">
      <CourseRegistrationCallout variant="rule">
        <p>{{ t('courseRegistration.approval.mainFlowHint') }}</p>
      </CourseRegistrationCallout>
      <p v-if="pageToast" class="approval-toast">{{ pageToast }}</p>

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
                <option v-for="opt in addDropTypeOptions" :key="opt" :value="opt">{{
                  primaryOptionLabel(opt)
                }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('common.status') }}</label>
              <select v-model="searchForm.status" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in statusFilterOptions" :key="opt" :value="opt">
                  {{ statusFilterLabel(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.approval.billLabel') }}</label>
              <select v-model="searchForm.billStatus" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in BILL_STATUS_OPTIONS" :key="opt" :value="opt">
                  {{ billStatusFilterLabel(opt) }}
                </option>
              </select>
            </div>
            <template v-if="searchExpanded">
              <div class="search-item">
                <label>{{ t('courseRegistration.batch.academicSession') }}</label>
                <select v-model="searchForm.academicSession" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="opt in academicSessionOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                <input v-model="searchForm.studentId" type="text" class="search-input" />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                <input v-model="searchForm.studentName" type="text" class="search-input" />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.approval.applicationNo') }}</label>
                <input
                  v-model="searchForm.keyword"
                  type="text"
                  class="search-input"
                  @keyup.enter="handleSearch"
                />
              </div>
            </template>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
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
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-outline" @click="exportModalVisible = true">
          {{ t('common.export') }}
        </button>
        <button
          v-if="isHistoryTab"
          type="button"
          class="btn btn-outline"
          @click="openPaymentExportModal"
        >
          {{ t('courseRegistration.approval.exportPayment') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap table-wrap--scroll">
          <table class="data-table data-table--sticky">
            <thead>
              <tr>
                <th
                  v-for="col in listColumns"
                  :key="col"
                  class="nowrap"
                  :class="columnClass(col)"
                >
                  {{ columnHeader(col) }}
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
                  <template v-if="col === 'status'">
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
                  <template v-else-if="col === 'paymentRemaining'">
                    <span :class="paymentRemainingClass(row)">{{ paymentRemainingText(row) }}</span>
                  </template>
                  <template v-else-if="col === 'actions'">
                    <div class="action-links">
                      <button
                        v-if="isPendingTab && canApproveRow(row)"
                        type="button"
                        class="link-btn"
                        @click="openRowApproval(row)"
                      >
                        {{ t('courseRegistration.approval.approve') }}
                      </button>
                      <button type="button" class="link-btn" @click="openDetail(row)">
                        {{ t('common.details') }}
                      </button>
                      <button
                        v-if="isHistoryTab && canShowBillDetail(row)"
                        type="button"
                        class="link-btn"
                        @click="openBillDetail(row)"
                      >
                        {{ t('courseRegistration.approval.billDetail') }}
                      </button>
                      <button
                        v-if="isHistoryTab && canRemindPayment(row, nowTick)"
                        type="button"
                        class="btn btn-primary btn-sm"
                        @click="openPaymentRemind(row)"
                      >
                        {{ t('courseRegistration.approval.sendPaymentRemind') }}
                      </button>
                      <button
                        v-if="isHistoryTab && canRegeneratePaymentOrder(row, nowTick)"
                        type="button"
                        class="btn btn-outline btn-sm"
                        @click="openOrderRegen(row)"
                      >
                        {{ t('courseRegistration.approval.regenOrder') }}
                      </button>
                      <button
                        v-if="isHistoryTab && canAbortApprovedAddDropBill(row)"
                        type="button"
                        class="btn btn-sm btn-danger-outline"
                        @click="handleAbortApplication(row)"
                      >
                        {{ t('courseRegistration.approval.abortApplication') }}
                      </button>
                    </div>
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

    <AddDropBillDetailDrawer
      :visible="!!billDetailApp"
      :application="billDetailApp"
      @close="billDetailApp = null"
    />

    <MonitorRemindModal
      :visible="!!remindApp"
      :row="remindApp"
      :draft-builder="buildPaymentRemindDraft"
      title-key="courseRegistration.approval.paymentRemindModalTitle"
      @close="remindApp = null"
      @confirm="handlePaymentRemindConfirm"
    />

    <AddDropOrderRegenModal
      :visible="!!regenApp"
      :application="regenApp"
      @close="regenApp = null"
      @confirm="handleOrderRegenConfirm"
    />

    <AddDropApprovalModal
      :visible="approvalModalVisible"
      approval-stage="Academic Coordinator"
      :target-count="1"
      :show-generate-bill="approvalShowGenerateBill"
      :application="singleApprovalApp"
      @close="approvalModalVisible = false"
      @confirm="handleApprovalConfirm"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="approvalExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
    <ExportModal
      :visible="paymentExportModalVisible"
      :fields="approvalPaymentExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="paymentExportModalVisible = false"
      @confirm="handlePaymentExportConfirm"
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
  min-width: 88px;
}

.col-compact {
  padding-left: 6px;
  padding-right: 6px;
}

.col-need-drop {
  min-width: 4.5em;
  text-align: center;
}

.col-excess {
  min-width: 4.5em;
  text-align: center;
}

.col-fee {
  min-width: 5.5em;
}

.col-bill {
  min-width: 3.5em;
}

.col-remind-count {
  min-width: 5.5em;
  text-align: center;
}

.col-remaining {
  min-width: 6.5em;
  max-width: 118px;
  white-space: normal;
  line-height: 1.3;
  font-size: 12px;
}

/* 数据格不换行；表头单独允许最多约两行 */
.data-table--sticky tbody td.col-need-drop,
.data-table--sticky tbody td.col-excess,
.data-table--sticky tbody td.col-fee,
.data-table--sticky tbody td.col-bill,
.data-table--sticky tbody td.col-remind-count,
.data-table--sticky tbody td.col-compact {
  white-space: nowrap;
}

.type-add { background: #dbeafe; color: #1d4ed8; }
.type-drop { background: #fee2e2; color: #b91c1c; }
.type-retake { background: #fef3c7; color: #b45309; }
.type-replace { background: #e0e7ff; color: #4338ca; }
.type-adddrop { background: #e0e7ff; color: #3730a3; }
.type-retakedrop { background: #ffedd5; color: #c2410c; }
.type-mixed { background: #f3e8ff; color: #7c3aed; }

.nowrap {
  white-space: nowrap;
}

.table-wrap--scroll {
  overflow-x: auto;
  max-width: 100%;
}

.data-table--sticky {
  width: 100%;
  min-width: 0;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: auto;
}

.cr-approval-page .data-table--sticky th,
.cr-approval-page .data-table--sticky td {
  background: #fff;
  padding: 8px 8px;
}

.cr-approval-page .data-table--sticky thead th {
  background: #f9fafb;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: normal;
  line-height: 1.35;
  vertical-align: bottom;
}

.cr-approval-page .data-table--sticky thead th.col-need-drop,
.cr-approval-page .data-table--sticky thead th.col-excess,
.cr-approval-page .data-table--sticky thead th.col-remind-count,
.cr-approval-page .data-table--sticky thead th.col-fee,
.cr-approval-page .data-table--sticky thead th.col-bill,
.cr-approval-page .data-table--sticky thead th.col-remaining {
  white-space: normal;
  word-break: keep-all;
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
  min-width: 40px;
  padding-left: 6px;
  padding-right: 6px;
}

.sticky-no {
  left: 40px;
  min-width: 112px;
  padding-left: 6px;
  padding-right: 6px;
}

.data-table--with-check .sticky-idx {
  left: 40px;
}

.data-table--with-check .sticky-no {
  left: 80px;
}

.sticky-type {
  left: 168px;
  min-width: 72px;
  box-shadow: 4px 0 8px -6px rgba(15, 23, 42, 0.25);
}

.sticky-actions {
  right: 0;
  width: 1%;
  white-space: nowrap;
  vertical-align: middle;
  box-shadow: -4px 0 8px -6px rgba(15, 23, 42, 0.25);
}

/* 待审批：仅「详情」，按内容收缩 */
.sticky-actions--simple {
  min-width: 0;
  padding-left: 10px;
  padding-right: 10px;
}

/* 历史：按行内操作内容自适应，不强制过宽 */
.sticky-actions--history {
  min-width: 0;
  padding-left: 8px;
  padding-right: 8px;
}

.action-links {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 4px 6px;
  align-items: center;
  white-space: nowrap;
  width: max-content;
  max-width: none;
}

.action-links .btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.action-links .btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.action-links .btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
.action-links .btn-danger-outline {
  background: #fff;
  border: 1px solid #dc2626;
  color: #dc2626;
}
.action-links .btn-danger-outline:hover {
  background: #fef2f2;
}

.pay-remain.is-warn {
  color: #b45309;
  font-weight: 600;
}

.pay-remain.is-urgent,
.pay-remain.is-overdue {
  color: #b91c1c;
  font-weight: 600;
}

.approval-toast {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #ecfdf5;
  color: #047857;
  border-radius: 6px;
  font-size: 13px;
}

thead .sticky-left,
thead .sticky-right {
  z-index: 3;
  background: #f9fafb;
}
</style>
