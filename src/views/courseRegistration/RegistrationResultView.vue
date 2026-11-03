<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import PreselectVolunteerRosterDrawer from '../../components/courseRegistration/PreselectVolunteerRosterDrawer.vue'
import RoundSpecialAddedRosterDrawer from '../../components/courseRegistration/RoundSpecialAddedRosterDrawer.vue'
import AdminAddCourseForStudentModal from '../../components/courseRegistration/AdminAddCourseForStudentModal.vue'
import VolunteerPublishLogModal from '../../components/courseRegistration/VolunteerPublishLogModal.vue'
import MeSeniorQuotaReadonlyModal from '../../components/courseRegistration/MeSeniorQuotaReadonlyModal.vue'
import ResultStudentDetailDrawer from '../../components/courseRegistration/ResultStudentDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  listResultDemoBatches,
  registrationBatches,
  getBatchById,
  formatRoundRange,
  isRoundTimeConfigured,
} from '../../data/courseRegistration/registrationBatches.js'
import {
  adminStudentRegistrationResults,
  filterStudentResults,
  removeAdminStudentRegistrations,
  removeAdminCourseRegistrations,
  STUDENT_OP_RESULT_KEYS,
  STUDENT_COURSE_SOURCE_KEYS,
  formatStudentOpResultLabel,
  formatStudentOperatorDisplay,
} from '../../data/courseRegistration/registrationResult.js'
import { resolveEffectiveCrossReleaseAt } from '../../data/courseRegistration/sessionRegistrationSchedules.js'
import { batchDateToPicker } from '../../data/courseRegistration/registrationBatchFormUtils.js'
import { getRoundTimeline } from '../../data/courseRegistration/studentRegistrationContext.js'
import {
  RESULT_ROUND_KEYS,
  RESULT_ROUND_LABEL_KEYS,
  listRoundCourseSummaries,
  roundCourseRosters,
} from '../../data/courseRegistration/registrationResultByRound.js'
import {
  getSelectionGroupDisplayLines,
  formatSelectionGroupRemark,
  getSelectionGroupsForBatch,
  sortSectionRowsBySelectionGroup,
} from '../../data/courseRegistration/courseSelectionGroups.js'
import {
  volunteerCourseStates,
  listVolunteerCourseSummaries,
  listVolunteerDetailRowsForSections,
  getVolunteerSectionState,
  usesSelectedRoster,
  isVolunteerBatchReadonly,
  isVolunteerBatchFinalized,
  getVolunteerBatchFinalizedAt,
} from '../../data/courseRegistration/preselectVolunteerConfirm.js'
import {
  sortRowsByCourseThenSection,
  paginateSectionRowsByCourse,
  attachSelectionGroupColumnSpans,
} from '../../data/courseRegistration/sectionTableRowSpans.js'
import {
  formatResultReleaseDisplay,
  canManualPublishVolunteerBatch,
  manualPublishVolunteerBatch,
  tickVolunteerResultPublish,
  ensureVolunteerPublishLogSeeded,
  volunteerPublishLogs,
} from '../../data/courseRegistration/preselectReleaseSync.js'
import {
  resultStudentExportFields,
  resultCourseExportFields,
  resultR1DetailExportFields,
  resultR1SummaryExportFields,
} from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  getRegistrationTypeLabel,
  courseTypeOptions,
} from '../../data/courseRegistration/registrationTypes.js'
import { feeCourseSourceLabel } from '../../data/courseRegistration/feeRosterQueue.js'
import {
  exportCourseRegistrationData,
  formatResultStudentExportRow,
  formatResultCourseExportRow,
  formatResultR1DetailExportRow,
  formatResultR1SummaryExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { getResultReleaseAt } from '../../data/courseRegistration/studentVolunteerSheet.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t, isZh } = useAppI18n()

const activeTab = ref('round')
const selectedRound = ref('preselect')

const emptyStudentSearch = () => ({
  batchId: '',
  round: '',
  studentKeyword: '',
  courseKeyword: '',
  operatorKeyword: '',
  opResult: '',
  /** 课程来源：空=全部；preselect|main|supplement|admin */
  courseSource: '',
  timeStart: '',
  timeEnd: '',
})
const emptyCourseSearch = () => ({
  batchId: '',
  courseCode: '',
  courseName: '',
  courseType: '',
  /** @deprecated R2/R3 已去掉课程分组搜索；保留键避免旧引用 */
  sectionCode: '',
  credits: '',
  /** ME 课程组关键字 */
  selectionGroupKeyword: '',
  /** 有效最大容量·可选分子区间（R2/R3） */
  effectiveAvailableMin: '',
  effectiveAvailableMax: '',
  freshmanAvailableMin: '',
  freshmanAvailableMax: '',
  seniorAvailableMin: '',
  seniorAvailableMax: '',
  specialAddedMin: '',
  specialAddedMax: '',
  /** @deprecated 已改用 *Available*；保留避免旧引用 */
  effectiveEnrolledMin: '',
  effectiveEnrolledMax: '',
  freshmanEnrolledMin: '',
  freshmanEnrolledMax: '',
  seniorEnrolledMin: '',
  seniorEnrolledMax: '',
})
const studentSearchExpanded = ref(true)
const roundSearchExpanded = ref(true)

/**
 * 页顶默认批次：优先列表中第一个尚未最终确认的 demo 批次
 * @returns {string}
 */
function pickDefaultBatchId() {
  const list = listResultDemoBatches()
  const unconfirmed = list.find((b) => !b.volunteerFinalConfirmedAt)
  if (unconfirmed) return unconfirmed.id
  return list[0]?.id || ''
}

/** 页顶选中批次，同步过滤两 Tab */
const selectedBatchId = ref(pickDefaultBatchId())

const studentSearchForm = ref(emptyStudentSearch())
const studentApplied = ref(emptyStudentSearch())
const roundSearchForm = ref(emptyCourseSearch())
const roundApplied = ref(emptyCourseSearch())

/**
 * 将页顶批次写入两 Tab 的 search/applied，避免搜索区双源
 * @param {string} [batchId]
 */
function syncBatchToFilters(batchId = selectedBatchId.value) {
  const id = batchId || ''
  studentSearchForm.value = { ...studentSearchForm.value, batchId: id }
  studentApplied.value = { ...studentApplied.value, batchId: id }
  roundSearchForm.value = { ...roundSearchForm.value, batchId: id }
  roundApplied.value = { ...roundApplied.value, batchId: id }
}

/** 学生维轮次下拉（与日志一致：已配置时间的轮次） */
const studentRoundOptions = computed(() => {
  const batch = getBatchById(selectedBatchId.value)
  const session = batch?.academicSession || '—'
  return getRoundTimeline(batch, studentSearchForm.value.round)
    .filter((step) => isRoundTimeConfigured(step.range))
    .map((step) => {
      const range = formatRoundRange(step.range)
      return {
        key: step.key,
        label: t('courseRegistration.student.roundOptionLabel', {
          session,
          round: t(step.labelKey),
          range: range === '—' ? '' : range,
        }),
      }
    })
})

function studentOpResultLabel(key) {
  return t(`courseRegistration.log.result.${key}`)
}

/** 是否课程维度·第一轮（志愿融合表） */
const isRound1CourseView = computed(
  () => activeTab.value === 'round' && selectedRound.value === 'preselect',
)

// 进入页即按默认批次过滤
syncBatchToFilters()

const currentPage = ref(1)
const pageSize = ref(20)
const exportModalVisible = ref(false)
/** 第一轮导出类型：detail | summary */
const r1ExportMode = ref('detail')
/** 学生维度「新增」代选弹窗 */
const addCourseModalVisible = ref(false)
const selectedIds = ref([])
const pendingDeleteIds = ref([])
const confirmVisible = ref(false)
const confirmMessage = ref('')
const confirmMode = ref('delete')
const volunteerDrawerVisible = ref(false)
const volunteerCourseId = ref('')
const volunteerSectionId = ref('')
const volunteerTableTick = ref(0)
const specialRosterVisible = ref(false)
const specialRosterCourseId = ref('')
const specialRosterCourseCode = ref('')
const specialRosterCourseName = ref('')
/** ME 老生年级占比只读弹窗 */
const meQuotaVisible = ref(false)
const meQuotaCourseId = ref('')
const meQuotaBatchId = ref('')
const meQuotaCourseCode = ref('')
const meQuotaCourseName = ref('')
/** 入口列三数，弹窗合计须贴合 */
const meQuotaEntrySeniorCap = ref(null)
const meQuotaEntryEnrolledSenior = ref(null)
const meQuotaEntryAvailableSenior = ref(null)
/** 学生维行详情抽屉 */
const studentDetailVisible = ref(false)
const studentDetailRow = ref(null)
/** 结果页 demo 批次公布文案固定，不随真实时间刷新 */
const batchOptions = computed(() => listResultDemoBatches())

/**
 * 打开学生维详情
 * @param {object} row
 */
function openStudentDetail(row) {
  studentDetailRow.value = row || null
  studentDetailVisible.value = true
}

const studentRows = computed(() => adminStudentRegistrationResults.value)

/** 当前结果批次是否为 ME（课程组列 + 老生容量可点） */
const isMeResultBatch = computed(() => getBatchById(selectedBatchId.value)?.type === 'ME')

/**
 * R2/R3：一门课一行；ME 按课程组排序并挂 course stub（供分页/span）
 * @returns {object[]}
 */
const roundCourseRowsAll = computed(() => {
  void roundCourseRosters.value
  if (activeTab.value !== 'round' || selectedRound.value === 'preselect') return []
  const list = listRoundCourseSummaries(selectedRound.value, roundApplied.value).map((row) => ({
    ...row,
    course: {
      id: row.courseId,
      code: row.courseCode,
      name: row.courseName,
      credits: row.credits,
    },
    section: null,
  }))
  if (!isMeResultBatch.value) return list
  const groups = getSelectionGroupsForBatch(getBatchById(selectedBatchId.value))
  if (groups.length) return sortSectionRowsBySelectionGroup(list, groups)
  return list
})

/** ME R2/R3：组感知分页 + 课程组列 rowspan */
const round23MePaged = computed(() => {
  if (
    activeTab.value !== 'round' ||
    selectedRound.value === 'preselect' ||
    !isMeResultBatch.value
  ) {
    return { rows: [], totalCourses: 0, firstCourseIndex: 0 }
  }
  const paged = paginateSectionRowsByCourse(
    roundCourseRowsAll.value,
    currentPage.value,
    pageSize.value,
    { groupAware: true },
  )
  return {
    ...paged,
    rows: attachSelectionGroupColumnSpans(paged.rows),
  }
})

/**
 * 课程组展示文案（对齐在线选课）
 * @param {object|null|undefined} group
 */
function selectionGroupLines(group) {
  return getSelectionGroupDisplayLines(group, isZh.value)
}

/**
 * 课程组须选说明（如 4 门选 3）
 * @param {object|null|undefined} group
 */
function selectionGroupRemarkText(group) {
  if (!group) return ''
  return formatSelectionGroupRemark(group, t)
}

/**
 * 打开 ME 老生年级占比只读弹窗
 * @param {object} row
 */
function openMeSeniorQuota(row) {
  if (!isMeResultBatch.value || !row?.courseId) return
  meQuotaCourseId.value = row.courseId || ''
  meQuotaBatchId.value = row.batchId || selectedBatchId.value || ''
  meQuotaCourseCode.value = row.courseCode || ''
  meQuotaCourseName.value = row.courseName || ''
  // R2/R3 行带 availableSenior（R2 label 为可选/总量）；R1 为已选/总量
  let seniorCap = Number(row.seniorCap)
  let enrolledSenior = Number(row.enrolledSenior)
  let availableSenior = Number(row.availableSenior)
  if (!Number.isFinite(seniorCap)) {
    const label = String(row.seniorCapacityLabel || '')
    const m = label.match(/^(\d+)\s*\/\s*(\d+)$/)
    if (m) {
      seniorCap = Number(m[2])
      // R1：分子=已选；R2：分子=可选 — 优先用行内已选/可选字段
      if (!Number.isFinite(availableSenior) && !Number.isFinite(enrolledSenior)) {
        if (selectedRound.value === 'preselect') {
          enrolledSenior = Number(m[1])
          availableSenior = Math.max(0, seniorCap - enrolledSenior)
        } else {
          availableSenior = Number(m[1])
          enrolledSenior = Math.max(0, seniorCap - availableSenior)
        }
      }
    }
  }
  if (!Number.isFinite(availableSenior) && Number.isFinite(seniorCap) && Number.isFinite(enrolledSenior)) {
    availableSenior = Math.max(0, seniorCap - enrolledSenior)
  }
  if (!Number.isFinite(enrolledSenior) && Number.isFinite(seniorCap) && Number.isFinite(availableSenior)) {
    enrolledSenior = Math.max(0, seniorCap - availableSenior)
  }
  meQuotaEntrySeniorCap.value = Number.isFinite(seniorCap) ? seniorCap : null
  meQuotaEntryEnrolledSenior.value = Number.isFinite(enrolledSenior) ? enrolledSenior : null
  meQuotaEntryAvailableSenior.value = Number.isFinite(availableSenior) ? availableSenior : null
  meQuotaVisible.value = true
}

/**
 * 分组「选上」人数：GE/ME 看 selected；否则容量内人数
 * @param {object} volunteerRow listVolunteerCourseSummaries 行
 */
function sectionSelectedCount(volunteerRow) {
  const state = getVolunteerSectionState(volunteerRow.courseId, volunteerRow.sectionId)
  if (state && usesSelectedRoster(state)) {
    return (state.volunteers || []).filter((v) => v.selected).length
  }
  const count = Number(volunteerRow.volunteerCount) || 0
  const cap = Number(volunteerRow.seniorCapacity) || 0
  return cap > 0 ? Math.min(count, cap) : count
}

/**
 * 第一轮：志愿分组行 + 课级容量（与志愿选上同源，口径 A）
 * @returns {object[]}
 */
function buildRound1MergedSectionRows() {
  void volunteerCourseStates.value
  void volunteerTableTick.value
  void roundCourseRosters.value
  const volunteers = listVolunteerCourseSummaries(roundApplied.value)
  const specialByCourse = new Map(
    listRoundCourseSummaries('preselect', roundApplied.value).map((r) => [
      r.courseId,
      Number(r.specialAddedCount) || 0,
    ]),
  )

  /** @type {Map<string, { selected: number, seniorCap: number }>} */
  const courseAgg = new Map()
  for (const v of volunteers) {
    const selected = sectionSelectedCount(v)
    const seniorCap = Number(v.seniorCapacity) || 0
    const prev = courseAgg.get(v.courseId) || { selected: 0, seniorCap: 0 }
    courseAgg.set(v.courseId, {
      selected: prev.selected + selected,
      seniorCap: prev.seniorCap + seniorCap,
    })
  }

  const rows = volunteers.map((v) => {
    const agg = courseAgg.get(v.courseId) || { selected: 0, seniorCap: 0 }
    const seniorLabel = `${agg.selected}/${agg.seniorCap}`
    return {
      ...v,
      course: {
        id: v.courseId,
        code: v.courseCode,
        name: v.courseName,
        type: v.courseType,
        credits: v.credits,
      },
      section: {
        id: v.sectionId,
        code: v.sectionCode,
      },
      // 口径 A：有效最大 = 老生；无新生列
      effectiveCapacityLabel: seniorLabel,
      seniorCapacityLabel: seniorLabel,
      seniorCap: agg.seniorCap,
      enrolledSenior: agg.selected,
      availableSenior: Math.max(0, agg.seniorCap - agg.selected),
      freshmanCapacityLabel: '',
      specialAddedCount: specialByCourse.get(v.courseId) || 0,
    }
  })
  return sortRowsByCourseThenSection(rows)
}

const round1SectionRowsAll = computed(() => {
  if (!isRound1CourseView.value) return []
  return buildRound1MergedSectionRows()
})

const round1Paged = computed(() => {
  if (!isRound1CourseView.value) {
    return { rows: [], totalCourses: 0, firstCourseIndex: 0 }
  }
  return paginateSectionRowsByCourse(
    round1SectionRowsAll.value,
    currentPage.value,
    pageSize.value,
    { groupAware: false },
  )
})

const rows = computed(() => {
  if (activeTab.value === 'student') {
    return filterStudentResults(studentRows.value, studentApplied.value)
  }
  if (isRound1CourseView.value) return round1SectionRowsAll.value
  return roundCourseRowsAll.value
})

const totalCount = computed(() => {
  if (isRound1CourseView.value) return round1Paged.value.totalCourses
  if (activeTab.value === 'round' && !isRound1CourseView.value && isMeResultBatch.value) {
    return round23MePaged.value.totalCourses
  }
  return rows.value.length
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const paginatedRows = computed(() => {
  if (isRound1CourseView.value) return round1Paged.value.rows
  if (activeTab.value === 'round' && selectedRound.value !== 'preselect' && isMeResultBatch.value) {
    return round23MePaged.value.rows
  }
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

/** R2/R3 空表列数：基础列 +（ME 课程组） */
const round23Colspan = computed(() => (isMeResultBatch.value ? 10 : 9))

function spanCell(row, field) {
  return row?._span?.[field] || null
}

/** 按最长批次名撑开下拉宽度（对齐学生在线选课） */
const batchSelectWidth = ref('')

/**
 * 测量 select 文案宽度
 * @param {string[]} labels 选项文案
 * @returns {string} CSS width 或空
 */
function measureSelectWidth(labels) {
  const list = (labels || []).filter(Boolean)
  if (!list.length) return ''
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:13px;font-family:inherit;padding:0 10px;box-sizing:border-box;'
  document.body.appendChild(probe)
  let max = 0
  for (const label of list) {
    probe.textContent = label
    max = Math.max(max, probe.offsetWidth)
  }
  document.body.removeChild(probe)
  return `${Math.ceil(max + 32)}px`
}

/** 根据当前批次选项更新下拉宽度 */
function measureBatchSelectWidth() {
  batchSelectWidth.value = measureSelectWidth(batchOptions.value.map((b) => b.name || b.id))
}

watch(
  batchOptions,
  () => {
    nextTick(() => measureBatchSelectWidth())
  },
  { deep: true },
)

const r1ExportModes = computed(() => [
  { value: 'detail', label: t('courseRegistration.result.exportDetail') },
  { value: 'summary', label: t('courseRegistration.result.exportSummary') },
])

const exportFields = computed(() => {
  if (activeTab.value === 'student') return resultStudentExportFields
  if (isRound1CourseView.value) {
    return r1ExportMode.value === 'summary' ? resultR1SummaryExportFields : resultR1DetailExportFields
  }
  return resultCourseExportFields
})

const exportModalModes = computed(() => (isRound1CourseView.value ? r1ExportModes.value : []))

const showBulkToolbar = computed(
  () => activeTab.value === 'student' || (activeTab.value === 'round' && !isRound1CourseView.value),
)
const showVolunteerToolbar = computed(() => isRound1CourseView.value)

/** 课程维第二轮：新老生容量展示可选/总量 */
const isRound2CourseView = computed(
  () => activeTab.value === 'round' && selectedRound.value === 'main',
)

/** 课程维第三轮：工具栏展示互释时间 */
const showR3CrossReleaseHint = computed(
  () => activeTab.value === 'round' && selectedRound.value === 'supplement',
)

/**
 * 当前批次解析的 R3 互释时刻，展示为 DD/MM/YYYY HH:mm:ss（空则 —）
 * @returns {string}
 */
const r3CrossReleaseAtDisplay = computed(() => {
  const batch = getBatchById(selectedBatchId.value)
  const at = resolveEffectiveCrossReleaseAt(batch)
  if (!at) return '—'
  return batchDateToPicker(at) || at
})

/** 依赖批次列表，便于定稿后刷新状态 */
const volunteerBatchTick = computed(() =>
  registrationBatches.value
    .map(
      (b) =>
        `${b.id}:${b.volunteerFinalConfirmedAt || ''}:${b.demoResultReleaseFixed?.lockedPending || ''}:${b.demoResultReleaseFixed?.released || ''}`,
    )
    .join('|'),
)

/** 当前批次志愿是否只读（已定稿或第二轮开始） */
const volunteerReadonly = computed(() => {
  void volunteerBatchTick.value
  return isVolunteerBatchReadonly(selectedBatchId.value)
})

/** 当前批次是否已最终确认 */
const volunteerBatchFinalized = computed(() => {
  void volunteerBatchTick.value
  return isVolunteerBatchFinalized(selectedBatchId.value)
})

const canPublish = computed(() => {
  void volunteerBatchTick.value
  return canManualPublishVolunteerBatch(selectedBatchId.value)
})

const selectedBatchName = computed(() => {
  const b = registrationBatches.value.find((x) => x.id === selectedBatchId.value)
  return b?.name || ''
})

/** 有/无最终确认的状态文案（工具行展示；demo 批次固定不随真实时间变） */
const volunteerConfirmStatusLabel = computed(() => {
  void volunteerBatchTick.value
  const batch = registrationBatches.value.find((b) => b.id === selectedBatchId.value)
  const fixed = batch?.demoResultReleaseFixed
  if (fixed) {
    if (fixed.released || (batch.volunteerFinalConfirmedAt && !fixed.lockedPending)) {
      return t('courseRegistration.result.volunteerReleasePublishedFixed', { at: fixed.displayAt })
    }
    if (batch.volunteerFinalConfirmedAt || fixed.lockedPending) {
      return t('courseRegistration.result.volunteerReleaseLockedPendingFixed', {
        at: fixed.displayAt,
        days: fixed.remainingDays ?? 0,
        hours: fixed.remainingHours ?? 0,
      })
    }
    return t('courseRegistration.result.volunteerReleasePendingFixed', {
      at: fixed.displayAt,
      days: fixed.remainingDays ?? 0,
      hours: fixed.remainingHours ?? 0,
    })
  }
  const at = getVolunteerBatchFinalizedAt(selectedBatchId.value)
  if (at) {
    const raw = getResultReleaseAt(batch)
    const display = formatResultReleaseDisplay(raw)
    return t('courseRegistration.result.volunteerReleaseLockedAt', {
      at: display || String(at).slice(0, 19).replace('T', ' '),
    })
  }
  const raw = getResultReleaseAt(batch)
  if (!raw) return t('courseRegistration.result.volunteerReleasePending')
  return t('courseRegistration.result.volunteerReleasePublished', {
    at: formatResultReleaseDisplay(raw),
  })
})

const publishLogVisible = ref(false)
let publishTickTimer = null

onMounted(() => {
  measureBatchSelectWidth()
  if (!batchOptions.value.some((b) => b.id === selectedBatchId.value)) {
    selectedBatchId.value = pickDefaultBatchId()
    syncBatchToFilters(selectedBatchId.value)
  }
  ensureVolunteerPublishLogSeeded()
  tickVolunteerResultPublish()
  publishTickTimer = setInterval(() => tickVolunteerResultPublish(), 15000)
})

onBeforeUnmount(() => {
  if (publishTickTimer) clearInterval(publishTickTimer)
})

function requestManualPublish() {
  if (!canPublish.value) return
  confirmMode.value = 'publish'
  confirmMessage.value = t('courseRegistration.result.publishConfirm')
  confirmVisible.value = true
}

function openPublishLog() {
  ensureVolunteerPublishLogSeeded()
  void volunteerPublishLogs.value
  publishLogVisible.value = true
}

const hasSelection = computed(() => selectedIds.value.length > 0)
const allPageSelected = computed(() => {
  if (!paginatedRows.value.length) return false
  return paginatedRows.value.every((row) => selectedIds.value.includes(row.id))
})

watch(activeTab, () => {
  currentPage.value = 1
  selectedIds.value = []
})

watch(selectedRound, () => {
  if (activeTab.value !== 'round') return
  currentPage.value = 1
  selectedIds.value = []
})

/** 切换页顶批次时同步三 Tab 过滤并重置分页/勾选 */
watch(selectedBatchId, (id) => {
  syncBatchToFilters(id)
  currentPage.value = 1
  clearSelection()
})

function clearSelection() {
  selectedIds.value = []
}

function handleSearch() {
  if (activeTab.value === 'student') {
    studentApplied.value = { ...studentSearchForm.value }
  } else {
    roundApplied.value = { ...roundSearchForm.value }
  }
  currentPage.value = 1
  clearSelection()
}

function handleReset() {
  if (activeTab.value === 'student') {
    studentSearchForm.value = emptyStudentSearch()
    studentApplied.value = emptyStudentSearch()
  } else {
    roundSearchForm.value = emptyCourseSearch()
    roundApplied.value = emptyCourseSearch()
  }
  // 重置搜索条件后仍保留当前选课批次
  syncBatchToFilters(selectedBatchId.value)
  currentPage.value = 1
  clearSelection()
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
  const index = selectedIds.value.indexOf(id)
  if (index === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(index, 1)
}

function requestBatchDelete() {
  if (!selectedIds.value.length) {
    window.alert(t('courseRegistration.result.deleteEmpty'))
    return
  }
  pendingDeleteIds.value = [...selectedIds.value]
  const confirmKey =
    activeTab.value === 'student'
      ? 'courseRegistration.result.deleteConfirm'
      : 'courseRegistration.result.deleteCourseConfirm'
  confirmMode.value = 'delete'
  confirmMessage.value = t(confirmKey, { count: pendingDeleteIds.value.length })
  confirmVisible.value = true
}

function confirmBatchDelete() {
  const removeFn =
    activeTab.value === 'student' ? removeAdminStudentRegistrations : removeAdminCourseRegistrations
  const result = removeFn(pendingDeleteIds.value)
  if (!result.ok) {
    window.alert(t(result.errorKey))
    confirmVisible.value = false
    return
  }
  selectedIds.value = selectedIds.value.filter((id) => !pendingDeleteIds.value.includes(id))
  pendingDeleteIds.value = []
  confirmVisible.value = false
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function confirmManualPublish() {
  const result = manualPublishVolunteerBatch(selectedBatchId.value)
  confirmVisible.value = false
  confirmMode.value = 'delete'
  if (!result.ok) {
    window.alert(t('courseRegistration.result.publishNotAllowed'))
    return
  }
}

function roundLabel(key) {
  return RESULT_ROUND_LABEL_KEYS[key] ? t(RESULT_ROUND_LABEL_KEYS[key]) : key
}

function openVolunteerRoster(row) {
  volunteerCourseId.value = row.courseId || ''
  volunteerSectionId.value = row.sectionId || ''
  volunteerDrawerVisible.value = true
}

function openSpecialAddedRoster(row) {
  if (!row?.specialAddedCount) return
  specialRosterCourseId.value = row.courseId || ''
  specialRosterCourseCode.value = row.courseCode || ''
  specialRosterCourseName.value = row.courseName || ''
  specialRosterVisible.value = true
}

function refreshVolunteerTable() {
  volunteerTableTick.value += 1
}

function handleDialogConfirm() {
  if (confirmMode.value === 'publish') {
    confirmManualPublish()
    return
  }
  confirmBatchDelete()
}

/**
 * 按 ExportModal 范围切片主表行
 * @param {string} exportScope
 * @returns {object[]}
 */
function resolveExportSourceRows(exportScope) {
  if (exportScope === 'selectedRows') {
    const idSet = new Set(selectedIds.value)
    return rows.value.filter((row) => idSet.has(row.id))
  }
  if (exportScope === 'currentPage') return paginatedRows.value
  return rows.value
}

function openExportModal() {
  if (isRound1CourseView.value) r1ExportMode.value = 'detail'
  exportModalVisible.value = true
}

function handleExportConfirm({ selectedFields, exportScope }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = exportFields.value.filter((col) => selectedFields.includes(col.key))
  const sourceRows = resolveExportSourceRows(exportScope)

  if (isRound1CourseView.value) {
    const isSummary = r1ExportMode.value === 'summary'
    const exportRows = isSummary
      ? sourceRows
      : listVolunteerDetailRowsForSections(sourceRows)
    if (!exportRows.length) {
      window.alert(t('common.noData'))
      return
    }
    exportCourseRegistrationData({
      rows: exportRows,
      columns,
      formatRow: isSummary ? formatResultR1SummaryExportRow : formatResultR1DetailExportRow,
      filename: `registration-results-r1-${isSummary ? 'summary' : 'detail'}-${timestamp}.xlsx`,
      sheetName: isSummary ? 'R1 Summary' : 'R1 Detail',
      i18n: { t },
    })
    exportModalVisible.value = false
    return
  }

  if (!sourceRows.length) {
    window.alert(t('common.noData'))
    return
  }
  exportCourseRegistrationData({
    rows: sourceRows,
    columns,
    formatRow: activeTab.value === 'student' ? formatResultStudentExportRow : formatResultCourseExportRow,
    filename: `registration-results-${activeTab.value}-${timestamp}.xlsx`,
    sheetName: activeTab.value === 'student' ? 'By Student' : 'By Round',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-result-page">
    <div class="page-card">
      <div class="tab-bar">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'round' }"
          @click="activeTab = 'round'"
        >
          {{ t('courseRegistration.result.tabCourse') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'student' }"
          @click="activeTab = 'student'"
        >
          {{ t('courseRegistration.result.tabStudent') }}
        </button>
      </div>

      <div v-if="activeTab === 'round'" class="round-tab-bar">
        <button
          v-for="key in RESULT_ROUND_KEYS"
          :key="key"
          type="button"
          class="round-tab-btn"
          :class="{ active: selectedRound === key }"
          @click="selectedRound = key"
        >
          {{ roundLabel(key) }}
        </button>
      </div>

      <CourseRegistrationCallout v-if="isRound1CourseView" variant="info" class="volunteer-hint-callout">
        {{ t('courseRegistration.result.volunteerHint') }}
      </CourseRegistrationCallout>

      <div class="search-bar">
        <!-- 学生维：流式搜索 -->
        <div v-if="activeTab === 'student'" class="search-row">
          <div class="search-fields">
            <div class="search-item cr-result-batch-item">
              <label for="cr-result-batch-select">
                {{ t('courseRegistration.student.batchSelectLabel') }}
              </label>
              <select
                id="cr-result-batch-select"
                v-model="selectedBatchId"
                class="search-select cr-result-batch-select"
                :style="batchSelectWidth ? { width: batchSelectWidth } : undefined"
              >
                <option v-for="batch in batchOptions" :key="batch.id" :value="batch.id">
                  {{ batch.name }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.student.roundSelectLabel') }}</label>
              <select v-model="studentSearchForm.round" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in studentRoundOptions" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.log.studentKeyword') }}</label>
              <input
                v-model="studentSearchForm.studentKeyword"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.log.courseKeyword') }}</label>
              <input
                v-model="studentSearchForm.courseKeyword"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <template v-if="studentSearchExpanded">
              <div class="search-item">
                <label>{{ t('courseRegistration.log.operatorKeyword') }}</label>
                <input
                  v-model="studentSearchForm.operatorKeyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.log.resultLabel') }}</label>
                <select v-model="studentSearchForm.opResult" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="key in STUDENT_OP_RESULT_KEYS" :key="key" :value="key">
                    {{ studentOpResultLabel(key) }}
                  </option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.student.courseSource') }}</label>
                <select v-model="studentSearchForm.courseSource" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="key in STUDENT_COURSE_SOURCE_KEYS" :key="key" :value="key">
                    {{ feeCourseSourceLabel(key, t) }}
                  </option>
                </select>
              </div>
              <div class="search-item search-item-range">
                <label>{{ t('courseRegistration.log.operatedAtRange') }}</label>
                <input v-model="studentSearchForm.timeStart" type="date" class="search-input" />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input v-model="studentSearchForm.timeEnd" type="date" class="search-input" />
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
              type="button"
              class="toggle-link"
              @click="studentSearchExpanded = !studentSearchExpanded"
            >
              {{ studentSearchExpanded ? t('common.collapse') : t('common.more') }}
              <svg
                :class="{ up: studentSearchExpanded }"
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

        <!-- 课程维：流式 + 收放 -->
        <div v-else class="search-row">
          <div class="search-fields">
            <div class="search-item cr-result-batch-item">
              <label for="cr-result-batch-select-round">
                {{ t('courseRegistration.student.batchSelectLabel') }}
              </label>
              <select
                id="cr-result-batch-select-round"
                v-model="selectedBatchId"
                class="search-select cr-result-batch-select"
                :style="batchSelectWidth ? { width: batchSelectWidth } : undefined"
              >
                <option v-for="batch in batchOptions" :key="batch.id" :value="batch.id">
                  {{ batch.name }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.code') }}</label>
              <input
                v-model="roundSearchForm.courseCode"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.name') }}</label>
              <input
                v-model="roundSearchForm.courseName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.type') }}</label>
              <select v-model="roundSearchForm.courseType" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in courseTypeOptions" :key="opt.value" :value="opt.value">
                  {{ t(opt.labelKey) }}
                </option>
              </select>
            </div>
            <template v-if="roundSearchExpanded">
              <div v-if="isMeResultBatch && !isRound1CourseView" class="search-item">
                <label>{{ t('courseRegistration.courses.selectionGroup') }}</label>
                <input
                  v-model="roundSearchForm.selectionGroupKeyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.credits') }}</label>
                <input
                  v-model="roundSearchForm.credits"
                  type="text"
                  class="search-input"
                  :placeholder="t('common.pleaseInput')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div v-if="!isRound1CourseView" class="search-item search-item-range">
                <label>{{ t('courseRegistration.result.effectiveAvailableRange') }}</label>
                <input
                  v-model="roundSearchForm.effectiveAvailableMin"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMinPlaceholder')"
                  @keyup.enter="handleSearch"
                />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input
                  v-model="roundSearchForm.effectiveAvailableMax"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMaxPlaceholder')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div v-if="!isRound1CourseView" class="search-item search-item-range">
                <label>{{ t('courseRegistration.result.freshmanAvailableRange') }}</label>
                <input
                  v-model="roundSearchForm.freshmanAvailableMin"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMinPlaceholder')"
                  @keyup.enter="handleSearch"
                />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input
                  v-model="roundSearchForm.freshmanAvailableMax"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMaxPlaceholder')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div v-if="!isRound1CourseView" class="search-item search-item-range">
                <label>{{ t('courseRegistration.result.seniorAvailableRange') }}</label>
                <input
                  v-model="roundSearchForm.seniorAvailableMin"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMinPlaceholder')"
                  @keyup.enter="handleSearch"
                />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input
                  v-model="roundSearchForm.seniorAvailableMax"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMaxPlaceholder')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div v-if="!isRound1CourseView" class="search-item search-item-range">
                <label>{{ t('courseRegistration.result.specialAddedRange') }}</label>
                <input
                  v-model="roundSearchForm.specialAddedMin"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMinPlaceholder')"
                  @keyup.enter="handleSearch"
                />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input
                  v-model="roundSearchForm.specialAddedMax"
                  type="number"
                  min="0"
                  class="search-input search-input-num"
                  :placeholder="t('courseRegistration.result.rangeMaxPlaceholder')"
                  @keyup.enter="handleSearch"
                />
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
              type="button"
              class="toggle-link"
              @click="roundSearchExpanded = !roundSearchExpanded"
            >
              {{ roundSearchExpanded ? t('common.collapse') : t('common.more') }}
              <svg
                :class="{ up: roundSearchExpanded }"
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

      <div v-if="showBulkToolbar" class="toolbar result-toolbar">
        <div class="toolbar-left">
          <!-- 学生维度：添加特殊学生（代选，一次一名学生） -->
          <button
            v-if="activeTab === 'student'"
            type="button"
            class="btn btn-primary"
            @click="addCourseModalVisible = true"
          >
            {{ t('courseRegistration.result.addSpecialStudent') }}
          </button>
          <button
            type="button"
            class="btn btn-dark"
            :disabled="!hasSelection"
            @click="requestBatchDelete"
          >
            {{ t('common.delete') }}
          </button>
          <button type="button" class="btn btn-default" @click="openExportModal">
            {{ t('common.export') }}
          </button>
          <!-- 第三轮：只读展示学期配置互释时间 -->
          <span
            v-if="showR3CrossReleaseHint"
            class="toolbar-status r3-cross-release-status"
            :title="t('courseRegistration.schedule.crossReleaseAt')"
          >
            {{ t('courseRegistration.schedule.crossReleaseAt') }}：{{ r3CrossReleaseAtDisplay }}
          </span>
        </div>
      </div>

      <div v-if="showVolunteerToolbar" class="toolbar result-toolbar">
        <div class="toolbar-left">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canPublish"
            @click="requestManualPublish"
          >
            {{ t('courseRegistration.result.publishBtn') }}
          </button>
          <button type="button" class="btn btn-default" @click="openPublishLog">
            {{ t('courseRegistration.result.publishLogBtn') }}
          </button>
          <button type="button" class="btn btn-default" @click="openExportModal">
            {{ t('common.export') }}
          </button>
          <span
            class="volunteer-confirm-status toolbar-status"
            :class="volunteerBatchFinalized ? 'is-confirmed' : 'is-pending'"
          >
            {{ volunteerConfirmStatusLabel }}
          </span>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table v-if="activeTab === 'student'" class="data-table student-dim-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
                <th class="col-serial">{{ t('common.serialNo') }}</th>
                <th class="col-sticky-left col-student-id">
                  {{ t('courseRegistration.monitor.studentId') }}
                </th>
                <th class="col-sticky-left col-student-name">
                  {{ t('courseRegistration.monitor.studentName') }}
                </th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th class="col-course-name">{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.student.courseSource') }}</th>
                <th class="col-operator">{{ t('courseRegistration.log.operator') }}</th>
                <th class="col-operated-at">{{ t('courseRegistration.log.operatedAt') }}</th>
                <th class="col-reason">{{ t('courseRegistration.result.adminAddReason') }}</th>
                <th class="col-sticky-right col-op-result">
                  {{ t('courseRegistration.result.selectionResult') }}
                </th>
                <th class="col-sticky-right col-detail">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(row.id)"
                    @change="toggleSelect(row.id)"
                  />
                </td>
                <td class="col-serial">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="col-sticky-left col-student-id">{{ row.studentId }}</td>
                <td class="col-sticky-left col-student-name">{{ row.studentName }}</td>
                <td class="nowrap">{{ row.courseCode }}</td>
                <td class="col-course-name" :title="row.courseName">{{ row.courseName }}</td>
                <td class="nowrap">{{ feeCourseSourceLabel(row.courseSource, t) }}</td>
                <td
                  class="col-operator"
                  :title="formatStudentOperatorDisplay(row)"
                >
                  {{ formatStudentOperatorDisplay(row) }}
                </td>
                <td class="col-operated-at nowrap">{{ row.operatedAt || '—' }}</td>
                <td
                  class="col-reason"
                  :title="row.adminAddReason || ''"
                >
                  {{ row.adminAddReason || '—' }}
                </td>
                <td class="col-sticky-right col-op-result">
                  <span class="result-op-tag" :class="row.opResult">
                    {{ formatStudentOpResultLabel(row, t) }}
                  </span>
                </td>
                <td class="col-sticky-right col-detail">
                  <button type="button" class="link-btn" @click="openStudentDetail(row)">
                    {{ t('common.details') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="12" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 课程维度·第一轮：志愿 + 容量融合，同课多分组 rowspan -->
          <table v-else-if="isRound1CourseView" class="data-table round-dim-table round1-merge-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.batch.name') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.type') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.result.volunteerSectionGroup') }}</th>
                <th>{{ t('courseRegistration.result.volunteerCapacityLabel') }}</th>
                <th>{{ t('courseRegistration.courses.volunteerSelectedPercent') }}</th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.effectiveCapacityWithRatioTipR1')"
                  >
                    {{ t('courseRegistration.result.effectiveCapacityWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.seniorCapacityWithRatioTip')"
                  >
                    {{ t('courseRegistration.result.seniorCapacityWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.specialAddedCountTip')"
                  >
                    {{ t('courseRegistration.result.specialAddedCount') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paginatedRows"
                :key="row.id || `${row.courseId}-${row.sectionId}`"
              >
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(row.id)"
                    @change="toggleSelect(row.id)"
                  />
                </td>
                <td
                  v-if="spanCell(row, 'serial')?.show"
                  :rowspan="spanCell(row, 'serial').rowspan"
                >
                  {{ spanCell(row, 'serial').value }}
                </td>
                <td
                  v-if="spanCell(row, 'batch')?.show"
                  :rowspan="spanCell(row, 'batch').rowspan"
                >
                  {{ row.batchName || '—' }}
                </td>
                <td
                  v-if="spanCell(row, 'code')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'code').rowspan"
                >
                  {{ row.courseCode }}
                </td>
                <td
                  v-if="spanCell(row, 'name')?.show"
                  :rowspan="spanCell(row, 'name').rowspan"
                >
                  {{ row.courseName }}
                </td>
                <td
                  v-if="spanCell(row, 'type')?.show"
                  class="nowrap"
                  :rowspan="spanCell(row, 'type').rowspan"
                >
                  {{ getRegistrationTypeLabel(row.courseType, t) }}
                </td>
                <td
                  v-if="spanCell(row, 'credits')?.show"
                  :rowspan="spanCell(row, 'credits').rowspan"
                >
                  {{ row.credits }}
                </td>
                <td class="nowrap">
                  {{
                    t('courseRegistration.courses.sectionNameDisplay', {
                      code: row.sectionCode || row.section?.code,
                    })
                  }}
                </td>
                <td>{{ row.capacityLabel }}</td>
                <td class="td-capacity">
                  <span
                    v-if="row.selectedPercentLabel && row.selectedPercentLabel !== '—'"
                    class="capacity-pill"
                    :class="row.capacityTone"
                  >
                    {{ row.selectedPercentLabel }}
                  </span>
                  <template v-else>—</template>
                </td>
                <td
                  v-if="spanCell(row, 'effectiveCap')?.show"
                  :rowspan="spanCell(row, 'effectiveCap').rowspan"
                >
                  {{ row.effectiveCapacityLabel }}
                </td>
                <td
                  v-if="spanCell(row, 'seniorCap')?.show"
                  :rowspan="spanCell(row, 'seniorCap').rowspan"
                >
                  <button
                    v-if="isMeResultBatch"
                    type="button"
                    class="link-btn"
                    @click="openMeSeniorQuota(row)"
                  >
                    {{ row.seniorCapacityLabel }}
                  </button>
                  <template v-else>{{ row.seniorCapacityLabel }}</template>
                </td>
                <td
                  v-if="spanCell(row, 'specialAdded')?.show"
                  :rowspan="spanCell(row, 'specialAdded').rowspan"
                >
                  <button
                    v-if="row.specialAddedCount > 0"
                    type="button"
                    class="link-btn"
                    @click="openSpecialAddedRoster(row)"
                  >
                    {{ row.specialAddedCount }}
                  </button>
                  <template v-else>0</template>
                </td>
                <td class="col-actions">
                  <button type="button" class="link-btn" @click="openVolunteerRoster(row)">
                    {{
                      volunteerReadonly
                        ? t('courseRegistration.result.volunteerRosterViewAction')
                        : t('courseRegistration.result.volunteerRosterAction')
                    }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="14" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 课程维度·第二/三轮：一门课一行；ME 课程组为一级列并 rowspan -->
          <table v-else class="data-table round-dim-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th v-if="isMeResultBatch">
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.courses.selectionGroupTip')"
                  >
                    {{ t('courseRegistration.courses.selectionGroup') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>{{ t('courseRegistration.batch.name') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.effectiveCapacityAvailableWithRatioTip')"
                  >
                    {{ t('courseRegistration.result.effectiveCapacityAvailableWithRatio') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="
                      isRound2CourseView
                        ? t('courseRegistration.result.freshmanCapacityAvailableWithRatioTip')
                        : t('courseRegistration.result.freshmanCapacityAvailableTip')
                    "
                  >
                    {{
                      isRound2CourseView
                        ? t('courseRegistration.result.freshmanCapacityAvailableWithRatio')
                        : t('courseRegistration.result.freshmanCapacityAvailable')
                    }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="
                      isRound2CourseView
                        ? t('courseRegistration.result.seniorCapacityAvailableWithRatioTip')
                        : t('courseRegistration.result.seniorCapacityAvailableTip')
                    "
                  >
                    {{
                      isRound2CourseView
                        ? t('courseRegistration.result.seniorCapacityAvailableWithRatio')
                        : t('courseRegistration.result.seniorCapacityAvailable')
                    }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.specialAddedCountTip')"
                  >
                    {{ t('courseRegistration.result.specialAddedCount') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in paginatedRows"
                :key="`${selectedRound}-${row.id}`"
              >
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(row.id)"
                    @change="toggleSelect(row.id)"
                  />
                </td>
                <td>
                  {{
                    isMeResultBatch
                      ? round23MePaged.firstCourseIndex + index + 1
                      : (currentPage - 1) * pageSize + index + 1
                  }}
                </td>
                <td
                  v-if="isMeResultBatch && spanCell(row, 'selectionGroup')?.show"
                  class="td-selection-group"
                  :rowspan="spanCell(row, 'selectionGroup').rowspan"
                >
                  <template v-if="spanCell(row, 'selectionGroup').dash || !row.selectionGroup">
                    —
                  </template>
                  <template v-else>
                    <div class="selection-group-title">
                      {{ selectionGroupLines(row.selectionGroup).title }}
                    </div>
                    <div
                      v-if="selectionGroupLines(row.selectionGroup).intakeLine"
                      class="selection-group-intake"
                    >
                      {{ selectionGroupLines(row.selectionGroup).intakeLine }}
                    </div>
                    <div class="selection-group-remark">
                      {{ selectionGroupRemarkText(row.selectionGroup) }}
                    </div>
                  </template>
                </td>
                <td>{{ row.batchName || '—' }}</td>
                <td class="nowrap">{{ row.courseCode }}</td>
                <td>{{ row.courseName }}</td>
                <td>{{ row.credits }}</td>
                <td>{{ row.effectiveCapacityLabel }}</td>
                <td>{{ row.freshmanCapacityLabel }}</td>
                <td>
                  <button
                    v-if="isMeResultBatch"
                    type="button"
                    class="link-btn"
                    @click="openMeSeniorQuota(row)"
                  >
                    {{ row.seniorCapacityLabel }}
                  </button>
                  <template v-else>{{ row.seniorCapacityLabel }}</template>
                </td>
                <td>
                  <button
                    v-if="row.specialAddedCount > 0"
                    type="button"
                    class="link-btn"
                    @click="openSpecialAddedRoster(row)"
                  >
                    {{ row.specialAddedCount }}
                  </button>
                  <template v-else>0</template>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td :colspan="round23Colspan" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          v-model="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
        />
      </div>
    </div>

    <PreselectVolunteerRosterDrawer
      :visible="volunteerDrawerVisible"
      :course-id="volunteerCourseId"
      :section-id="volunteerSectionId"
      @close="volunteerDrawerVisible = false; refreshVolunteerTable()"
      @saved="refreshVolunteerTable()"
    />

    <RoundSpecialAddedRosterDrawer
      :visible="specialRosterVisible"
      :round-key="selectedRound"
      :course-id="specialRosterCourseId"
      :course-code="specialRosterCourseCode"
      :course-name="specialRosterCourseName"
      @close="specialRosterVisible = false"
    />

    <MeSeniorQuotaReadonlyModal
      :visible="meQuotaVisible"
      :course-id="meQuotaCourseId"
      :batch-id="meQuotaBatchId"
      :course-code="meQuotaCourseCode"
      :course-name="meQuotaCourseName"
      :round-key="selectedRound"
      :entry-senior-cap="meQuotaEntrySeniorCap"
      :entry-enrolled-senior="meQuotaEntryEnrolledSenior"
      :entry-available-senior="meQuotaEntryAvailableSenior"
      @close="meQuotaVisible = false"
    />

    <ResultStudentDetailDrawer
      :visible="studentDetailVisible"
      :row="studentDetailRow"
      @close="studentDetailVisible = false; studentDetailRow = null"
    />

    <AdminAddCourseForStudentModal
      v-if="addCourseModalVisible"
      :visible="addCourseModalVisible"
      :batch-id="selectedBatchId"
      @close="addCourseModalVisible = false"
      @success="currentPage = 1"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="exportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      :has-selected-rows="hasSelection"
      :modes="exportModalModes"
      v-model:mode="r1ExportMode"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="
        confirmMode === 'publish'
          ? t('courseRegistration.result.publishBtn')
          : t('common.deleteConfirmation')
      "
      :message="confirmMessage"
      :confirm-text="
        confirmMode === 'publish' ? t('courseRegistration.result.publishBtn') : t('common.delete')
      "
      :confirm-variant="confirmMode === 'publish' ? 'primary' : 'danger'"
      @confirm="handleDialogConfirm"
      @cancel="confirmVisible = false"
    />

    <VolunteerPublishLogModal
      :visible="publishLogVisible"
      :batch-id="selectedBatchId"
      :batch-name="selectedBatchName"
      @close="publishLogVisible = false"
    />
  </div>
</template>

<style scoped>
.round-tab-bar {
  display: flex;
  gap: 8px;
  margin: 0 0 12px;
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
}

.round-tab-btn {
  padding: 8px 14px;
  border: none;
  background: none;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.round-tab-btn.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
  background: #eff6ff;
}

.result-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.result-toolbar .btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.result-toolbar .btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.result-toolbar .btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}
.result-toolbar .btn-default {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}
.result-toolbar .btn-default:hover:not(:disabled) {
  background: #f9fafb;
}
.result-toolbar .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-dark {
  background: #374151;
  color: #fff;
}

.btn-dark:hover:not(:disabled) {
  background: #1f2937;
}

.btn-dark:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.col-check {
  width: 44px;
  min-width: 44px;
  text-align: center;
}

.col-actions {
  white-space: nowrap;
}

/* 搜索区批次：按最长选项名撑开，避免截断；其余筛选项随 flex-wrap 自适应 */
.cr-result-batch-item {
  flex: 0 0 auto;
}

.cr-result-batch-select {
  max-width: min(100%, 720px);
  min-width: 200px;
}

.volunteer-hint-callout {
  margin-bottom: 12px;
}

.volunteer-confirm-status {
  margin-left: 8px;
  font-weight: 600;
  font-size: 13px;
}

.volunteer-confirm-status.is-confirmed {
  color: #059669;
}

.volunteer-confirm-status.is-pending {
  color: #b45309;
}

.toolbar-status {
  margin-left: 0;
}

/* 对齐「本学期累计学分」强调：加粗 + 浅底色胶囊 */
.r3-cross-release-status {
  margin-left: 12px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  background: #eff6ff;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.link-btn.is-disabled,
.link-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
  pointer-events: none;
}

/* 原 .volunteer-confirmed 已由 .volunteer-confirm-status 替代 */

.dirty-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
}

.muted {
  color: #9ca3af;
}

.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.round-dim-table th {
  white-space: nowrap;
}

/* 同课多分组行叠加时，略紧于全局 data-table（10px 12px） */
.round1-merge-table th,
.round1-merge-table td {
  padding: 6px 10px;
}

.round1-merge-table td[rowspan] {
  vertical-align: middle;
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
}

.selection-group-title {
  font-weight: 500;
  color: #111827;
}

.selection-group-intake {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}

.selection-group-remark {
  margin-top: 2px;
  font-size: 12px;
  color: #4b5563;
}

/* 搜索区对齐 list-page-search：标签与控件同一行（图示 2） */
:deep(.search-bar .search-item) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

:deep(.search-bar .search-item > label) {
  width: auto;
  margin: 0;
  white-space: nowrap;
}

.search-item-range {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.search-item-range > label {
  width: auto;
  flex-shrink: 0;
}

.range-sep {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.search-input-num {
  width: 72px;
  min-width: 64px;
}

.td-selection-group {
  vertical-align: middle;
  min-width: 140px;
  max-width: 200px;
  background: #f8fafc;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.link-btn:hover {
  text-decoration: underline;
}

.td-capacity {
  text-align: center;
}

.capacity-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.capacity-open {
  color: #047857;
  background: #d1fae5;
}

.capacity-warn {
  color: #b45309;
  background: #fef3c7;
}

.capacity-full {
  color: #b91c1c;
  background: #fee2e2;
}

.result-op-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.result-op-tag.pendingAssign {
  background: #eff6ff;
  color: #2563eb;
}

.result-op-tag.registerSuccess {
  background: #ecfdf5;
  color: #059669;
}

.result-op-tag.registerFailure {
  background: #fef2f2;
  color: #dc2626;
}

.result-op-tag.cancelQueue {
  background: #f3f4f6;
  color: #6b7280;
}

/* 学生维主表：列宽自适应；左冻学号姓名，右冻选课结果+详情 */
.student-dim-table {
  width: 100%;
  min-width: 0;
  table-layout: auto;
}

.student-dim-table th,
.student-dim-table td {
  white-space: nowrap;
  vertical-align: middle;
  padding-left: 10px;
  padding-right: 10px;
}

.student-dim-table .col-serial {
  text-align: center;
  width: 48px;
}

.student-dim-table .col-course-name,
.student-dim-table .col-operator,
.student-dim-table .col-reason {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-dim-table .col-operated-at {
  font-variant-numeric: tabular-nums;
}

.student-dim-table .col-sticky-left,
.student-dim-table .col-sticky-right {
  position: sticky;
  background: #fff;
  box-sizing: border-box;
}

.student-dim-table thead .col-sticky-left,
.student-dim-table thead .col-sticky-right {
  background: #f9fafb;
  z-index: 4;
}

.student-dim-table tbody .col-sticky-left,
.student-dim-table tbody .col-sticky-right {
  z-index: 2;
}

.student-dim-table .col-student-id {
  left: 0;
  width: 110px;
}

.student-dim-table .col-student-name {
  left: 110px;
  width: 96px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.1);
}

.student-dim-table .col-detail {
  right: 0;
  width: 72px;
  z-index: 3;
}

.student-dim-table .col-op-result {
  right: 72px;
  width: 104px;
  z-index: 3;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.12);
}

.student-dim-table thead .col-op-result,
.student-dim-table thead .col-detail {
  z-index: 5;
}
</style>
