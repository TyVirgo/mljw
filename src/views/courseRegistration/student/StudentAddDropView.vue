<script setup>
import { ref, computed } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import AddDropCoursePickerModal from '../../../components/courseRegistration/AddDropCoursePickerModal.vue'
import AddDropApplicationFormSections from '../../../components/courseRegistration/AddDropApplicationFormSections.vue'
import AddDropApplicationDetailDrawer from '../../../components/courseRegistration/AddDropApplicationDetailDrawer.vue'
import MovementStudentCancelAction from '../../../components/studentRecords/MovementStudentCancelAction.vue'
import TablePagination from '../../../components/common/TablePagination.vue'
import ConfirmDialog from '../../../components/common/ConfirmDialog.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { getAddDropCourseColumnTexts } from '../../../utils/addDropCourseDisplay.js'
import {
  displayClassTimeVenueLines,
  displayClassTimeVenueFromFields,
} from '../../../data/courseRegistration/sectionScheduleFields.js'
import { formatCourseSectionName } from '../../../utils/courseSectionDisplay.js'
import { addDropStatusBadgeClass } from '../../../data/courseRegistration/addDropStatusBadge.js'
import '../../../styles/movement-status-badge.css'
import { getActiveBatch, formatRoundRange } from '../../../data/courseRegistration/registrationBatches.js'
import {
  submitStudentAddDropApplication,
  addDropApprovalQueue,
  canCancelAddDropApplication,
  cancelStudentAddDropApplication,
  getAddDropAccess,
} from '../../../data/courseRegistration/addDropApprovalQueue.js'
import {
  ADD_DROP_TYPE_TABS,
  getAddDropListColumns,
  isShieldedAddDropType,
} from '../../../data/courseRegistration/addDropListColumns.js'
import { filterByCurrentStudent } from '../../../data/mockCurrentStudent.js'
import { formatSchedulePersonLine } from '../../../utils/formatSchedulePersonLine.js'
import {
  getSupplementEntry,
  formatSupplementInviteCountdown,
  hasWhitelistPrerequisiteBypass,
  hasWhitelistAllowFutureMandatory,
  hasWhitelistAllowFutureElective,
  getWhitelistFutureElectiveConfig,
  getWhitelistCoreSectionSwitchSections,
  isWhitelistCoreSectionSwitchAllowAll,
  hasWhitelistAllowDropBelowCreditMin,
  getWhitelistDropBelowCreditMinFloor,
} from '../../../data/courseRegistration/supplementListQueue.js'
import { isWithinAddDropApplicationWindow } from '../../../data/courseRegistration/addDropApplicationWindow.js'
import {
  createEmptyAddDropSectionForm,
  validateAddDropSectionForm,
  buildAddDropSectionPayload,
  buildCourseScheduleSnapshot,
  applySectionToForm,
  ADD_DROP_PRIMARY_TYPES,
  primaryTypeFromAction,
  matchesPrimaryTypeFilter,
  mergeCoreLockOriginLines,
} from '../../../data/courseRegistration/addDropFormSections.js'
import {
  formatAddDropApplicationTypeLabel,
  addDropTypeTagClass,
  addDropPrimaryOptionLabelKey,
  resolveAppNeedDrop,
} from '../../../data/courseRegistration/addDropTypeDisplay.js'
import {
  computeNetCreditsAfterLines,
  hasWhitelistCreditMaxBypass,
  getWhitelistCreditBypassExtra,
  buildAddDropTermCreditStrip,
  sumGeMeTermStripExcess,
  wouldExceedAddDropGeTermCap,
  isMandatoryAddDropCourse,
  isAddDropApplicationPending,
  isStudentSubmittedAddDropApplication,
  collectPendingLedgerCourseLines,
  applyPendingLedgerToTermCreditBaseline,
} from '../../../data/courseRegistration/addDropMultiItems.js'
import {
  getEligibleAddCoursesForStudent,
  mergeEligibleAddWithPendingDropCores,
} from '../../../data/courseRegistration/addDropEligibleCourses.js'
import {
  retakeHistoryFromCourse,
  formatGradeToZh,
} from '../../../data/courseRegistration/studentTranscript.js'
import {
  listRetakePickerCourses,
  mergeRetakePickerWithTimetableRequired,
  filterRetakePickerCoursesByOriginal,
} from '../../../data/courseRegistration/retakeSubstitutePool.js'
import {
  estimateCourseFee,
  sumFeeEstimates,
  attachSstToFeeEstimate,
  formatAmountRmb,
  resolveAddDropExcessCredits,
  boostPlanRemainingFromDrops,
  consumePlanRemaining,
} from '../../../data/courseRegistration/addDropFeeRates.js'
import { buildScheduleBaselineFromEnrolled } from '../../../data/courseRegistration/addDropSectionConflict.js'
import { getCourseById, resolveSchoolElectiveCategory } from '../../../data/courseRegistration/selectableCourses.js'
import { getCurrentStudent } from '../../../data/mockCurrentStudent.js'
import {
  getStudentProfileFields,
  getStudentEnrolledCourses,
  studentSchedule,
  studentRequiredCourses,
  getSelectableCoursesForStudent,
  getTermElectiveCreditProgress,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import {
  getStudentCreditSummary,
  getStudentMonitorRow,
  getTermGeCategoryBars,
  getTermGeElectiveCategoryBars,
  getGraduationGeBars,
  getGraduationMeBars,
  getProgrammeCreditProgress,
  buildAddDropPlanRemaining,
} from '../../../data/courseRegistration/studentRegistrationContext.js'
import {
  registrationAcademicSessionOptions,
  normalizeBatchAcademicSession,
} from '../../../data/courseRegistration/registrationBatchFormUtils.js'
import { resolveTermCreditMax } from '../../../data/courseRegistration/registrationRules.js'
import { isFreshmanStudent } from '../../../data/courseRegistration/studentAudience.js'
import {
  listMyResultCourses,
  buildMyResultSchedule,
} from '../../../data/courseRegistration/studentMyResultCourses.js'
import StudentSchedulePreviewPanel from '../../../components/courseRegistration/StudentSchedulePreviewPanel.vue'
import ApplicationDetailDrawer from '../../../components/common/ApplicationDetailDrawer.vue'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const emit = defineEmits(['navigate'])

const { t, isZh } = useAppI18n()

const studentFields = computed(() => getStudentProfileFields())
const activeBatch = computed(() => getActiveBatch())
const creditSummary = computed(() => getStudentCreditSummary())
const enrolled = computed(() => getStudentEnrolledCourses())
const isFreshman = computed(() => isFreshmanStudent(studentFields.value.studentId))

const formVisible = ref(false)
const scheduleDrawerVisible = ref(false)
const coursePickerVisible = ref(false)
const detailApp = ref(null)
const cancelTarget = ref(null)
const form = ref(
  createEmptyAddDropSectionForm({
    needDrop: 'no',
    needAdd: 'no',
    needRetake: 'no',
  }),
)
const message = ref('')
const formError = ref('')
const submitting = ref(false)
const pickingFor = ref('primary')
/** 重修二层：当前选中的挂科/原课行，用于过滤弹框候选 */
const retakeFocusOriginal = ref(null)

/**
 * 重修弹框锁定类别 Tab（与原课程外层 Tab 一致：core|ge|me）
 * @returns {string}
 */
const retakeLockedCourseTypeTab = computed(() => {
  const original = retakeFocusOriginal.value
  if (!original) return ''
  const type = String(original.type || '').toUpperCase()
  const source = String(original.sourceType || '').toLowerCase()
  if (type === 'GE') return 'ge'
  if (type === 'ME') return 'me'
  if (type === 'CORE' || type === 'MANDATORY' || source === 'required') return 'core'
  return 'core'
})

const academicSessionOptions = registrationAcademicSessionOptions
const defaultAcademicSession = computed(() =>
  normalizeBatchAcademicSession(activeBatch.value?.academicSession) || '2026/09',
)

const isApplicationWindowOpen = computed(() =>
  isWithinAddDropApplicationWindow(activeBatch.value),
)
const addDropAccess = computed(() =>
  getAddDropAccess(studentFields.value.studentId, activeBatch.value),
)
const supplementEntry = computed(() => getSupplementEntry(studentFields.value.studentId))
const inviteCountdown = computed(() =>
  formatSupplementInviteCountdown(supplementEntry.value, new Date(), t),
)
const inSupplementList = computed(() => Boolean(supplementEntry.value))
const canApply = computed(() => addDropAccess.value.ok)
const allowedActions = computed(() => addDropAccess.value.allowedActions || [])
const freshmanBlocked = computed(() => Boolean(addDropAccess.value.freshmanBlocked))
const applicationWindowLabel = computed(() => formatRoundRange(activeBatch.value?.addDropWindow))
/**
 * @deprecated 退课底部审批队列提示条已去掉，不再用于模板；保留以免其它逻辑误引用时报找不到
 * （原配合 dropFormApprovalHint callout）
 */
const isDropAction = computed(() => form.value.action === 'Drop')
const isAddDropAction = computed(() => form.value.action === 'AddDrop')
const isRetakeDropAction = computed(() => form.value.action === 'RetakeDrop')

const defaultContactPhone = computed(() => {
  const student = getCurrentStudent()
  return student?.contact?.mobilePhone || student?.mobilePhone || ''
})

const availableActionOptions = computed(() => {
  const raw = allowedActions.value.length ? allowedActions.value : [...ADD_DROP_TYPE_TABS]
  return raw.filter((a) => ADD_DROP_TYPE_TABS.includes(a))
})

/** 主类型三选一（由允许的完整 action 推导） */
const availablePrimaryOptions = computed(() => {
  const set = new Set()
  for (const opt of availableActionOptions.value) {
    if (opt === 'Add' || opt === 'AddDrop') set.add('Add')
    else if (opt === 'Drop') set.add('Drop')
    else if (opt === 'Retake' || opt === 'RetakeDrop') set.add('Retake')
  }
  const list = ADD_DROP_PRIMARY_TYPES.filter((p) => set.has(p))
  return list.length ? list : [...ADD_DROP_PRIMARY_TYPES]
})

const listColumns = computed(() => getAddDropListColumns(''))
const tableColspan = computed(() => listColumns.value.length)

/** 已通过/部分通过且仍有待缴应付 → 不可二次申请（仅真实新提交，不含 demo 种子） */
function hasUnpaidAddDropBill(app) {
  if (!app || !isStudentSubmittedAddDropApplication(app)) return false
  if (app.status !== 'Approved' && app.status !== 'PartiallyApproved') return false
  if (String(app.billStatus || '') !== 'pending') return false
  const amount = Number(app.billAmount ?? app.feeEstimate?.total) || 0
  return amount > 0
}

const unpaidBillBlocked = computed(() =>
  allApplications.value.some((app) => hasUnpaidAddDropBill(app)),
)

/** 窗内禁用操作：真实未审或真实待缴 */
const formOpsDisabled = computed(
  () => primaryTypePendingBlocked.value || unpaidBillBlocked.value,
)

/** 窗内提示文案（开窗可见原因） */
const secondApplicationBlockTip = computed(() => {
  if (primaryTypePendingBlocked.value) {
    return t('courseRegistration.student.secondApplicationBlocked')
  }
  if (unpaidBillBlocked.value) {
    return t('courseRegistration.student.secondApplicationUnpaidBlocked')
  }
  return ''
})

/** 窗口期内可点开发起；门控在窗内提示并禁操作，不拦在门外 */
const canStartApplication = computed(() => {
  if (!canApply.value) return false
  return availablePrimaryOptions.value.length > 0
})

/** 是否允许勾选退课（权限含 Drop / 联合单） */
const canLinkDropForForm = computed(() => {
  const allowed = availableActionOptions.value
  return (
    allowed.includes('Drop') ||
    allowed.includes('AddDrop') ||
    allowed.includes('RetakeDrop') ||
    allowed.includes('AddDropRetake')
  )
})

/** 表单拟退 + 未审底账拟退：冲突基线排除用（课号 + courseId 均收录） */
const pendingDropCodes = computed(() => {
  const keys = []
  const pushKey = (v) => {
    const s = String(v || '').trim()
    if (s && !keys.includes(s)) keys.push(s)
  }
  for (const line of pendingLedgerLines.value.dropCourses || []) {
    pushKey(line.courseId)
    pushKey(line.courseCode)
  }
  for (const line of form.value.dropLines || []) {
    pushKey(line.courseId)
    pushKey(line.courseCode)
  }
  if (keys.length) return keys
  if (form.value.action === 'Drop') {
    pushKey(form.value.courseId)
    pushKey(form.value.courseCode)
    return keys
  }
  if (form.value.action === 'AddDrop' || form.value.action === 'RetakeDrop') {
    pushKey(form.value.dropCourseId)
    pushKey(form.value.dropCourseCode)
    return keys
  }
  return keys
})

const creditMaxBypass = computed(() =>
  hasWhitelistCreditMaxBypass(studentFields.value.studentId),
)

const creditBypassExtra = computed(() =>
  getWhitelistCreditBypassExtra(studentFields.value.studentId),
)

const allowFutureMandatory = computed(() =>
  hasWhitelistAllowFutureMandatory(studentFields.value.studentId),
)

const allowFutureElective = computed(() =>
  hasWhitelistAllowFutureElective(studentFields.value.studentId),
)

const futureElectiveConfig = computed(() =>
  getWhitelistFutureElectiveConfig(studentFields.value.studentId),
)

/** 加课 / 重修各自的换组白名单（课+组）；空+allowAll 表示该生范围内全部 */
const coreSectionSwitchSections = computed(() => {
  const action = form.value.action
  const kind = action === 'Retake' || action === 'RetakeDrop' ? 'retake' : 'add'
  return getWhitelistCoreSectionSwitchSections(studentFields.value.studentId, kind)
})

const coreSectionSwitchAllowAll = computed(() => {
  const action = form.value.action
  const kind = action === 'Retake' || action === 'RetakeDrop' ? 'retake' : 'add'
  return isWhitelistCoreSectionSwitchAllowAll(studentFields.value.studentId, kind)
})

const allowDropBelowCreditMin = computed(() =>
  hasWhitelistAllowDropBelowCreditMin(studentFields.value.studentId),
)

/** 白名单退课学分地板；无权限为 null */
const dropBelowCreditMinFloor = computed(() =>
  getWhitelistDropBelowCreditMinFloor(studentFields.value.studentId),
)

/** 重修无拟退时：课表在读必修作为原分组 */
const originSectionLinesForPicker = computed(() =>
  (studentRequiredCourses.value || []).map((item) => ({
    courseId: item.courseId,
    courseCode: item.courseCode || item.code,
    sectionId: item.sectionId,
    sectionCode: item.sectionCode || item.section,
    type: item.type || 'CORE',
    sourceType: item.sourceType || 'required',
  })),
)

const termCreditMax = computed(() => {
  const session =
    form.value.academicSession ||
    activeBatch.value?.academicSession ||
    defaultAcademicSession.value
  return resolveTermCreditMax(session)
})

const termCreditGate = computed(() => {
  const addOnlyLines = form.value.addLines || []
  const retakeLines = form.value.retakeLines || []
  return {
    // 二次申请：与学分条一致，用未审投影后净学分（非裸 enrolled）
    currentCredits: pendingAdjustedTermCredits.value,
    creditMax: termCreditMax.value,
    dropLines: form.value.dropLines || [],
    /** 仅加课行（弹框三方联动用） */
    addOnlyLines,
    /** 仅重修行 */
    retakeLines,
    /** @deprecated 兼容旧读方：加课∪重修 */
    addLines: [...addOnlyLines, ...retakeLines],
    bypassCreditMax: creditMaxBypass.value,
    creditBypassExtra: creditBypassExtra.value,
  }
})

/** 主页「我的课表」：与我的选课同源（四类已选）；排除表单拟退 */
const schedulePreviewSlots = computed(() => {
  const dropSet = new Set((pendingDropCodes.value || []).map(String).filter(Boolean))
  const courses = listMyResultCourses().filter((item) => {
    if (!dropSet.size) return true
    const code = String(item.courseCode || item.code || '')
    const id = String(item.courseId || '')
    return !dropSet.has(code) && !dropSet.has(id)
  })
  return buildMyResultSchedule(courses, { locale: isZh.value ? 'zh' : 'en' })
})

const scheduleToolbarLabel = computed(() => t('courseRegistration.student.scheduleToolbarButton'))
const schedulePreviewHint = computed(() => t('courseRegistration.student.schedulePreviewAddDropHint'))

/** 课表表头：学号 + 姓名 */
const schedulePersonLine = computed(() => {
  const student = getCurrentStudent()
  const basic = student?.basicInfo || {}
  return formatSchedulePersonLine(
    basic.studentId,
    basic.fullName || basic.chineseName || '',
  )
})

function openScheduleDrawer() {
  scheduleDrawerVisible.value = true
}

const calloutText = computed(() => {
  if (freshmanBlocked.value) {
    return t('courseRegistration.student.freshmanAddDropBlockedHint')
  }
  if (addDropAccess.value.errorKey === 'courseRegistration.supplement.inviteExpired') {
    return t('courseRegistration.supplement.inviteExpiredStudent', {
      range: applicationWindowLabel.value,
    })
  }
  if (addDropAccess.value.errorKey === 'courseRegistration.supplement.inviteNeedsManual') {
    return t('courseRegistration.supplement.inviteNeedsManualStudent')
  }
  if (isApplicationWindowOpen.value && !isFreshman.value) {
    return t('courseRegistration.student.addDropWindowOpen', {
      range: applicationWindowLabel.value,
    })
  }
  if (inSupplementList.value && canApply.value) {
    const cd = inviteCountdown.value
    if (cd && !cd.expired && supplementEntry.value?.inviteAttempt > 0) {
      return t('courseRegistration.student.addDropViaSupplementCountdown', {
        range: applicationWindowLabel.value,
        deadline: supplementEntry.value.deadlineAt,
        remain: cd.label,
      })
    }
    return t('courseRegistration.student.addDropViaSupplement', {
      range: applicationWindowLabel.value,
    })
  }
  return t('courseRegistration.student.addDropWindowClosed', {
    range: applicationWindowLabel.value,
  })
})

function goRegister() {
  emit('navigate', 'crs-register')
}
const EMPTY_SEARCH = {
  type: '',
  status: '',
  academicSession: '',
  applicationNo: '',
  keyword: '',
}

const searchExpanded = ref(true)
const searchForm = ref({ ...EMPTY_SEARCH })
const appliedSearch = ref({ ...EMPTY_SEARCH })
const currentPage = ref(1)
const pageSize = ref(20)

const typeFilterOptions = computed(() => [...ADD_DROP_PRIMARY_TYPES])

const allApplications = computed(() =>
  filterByCurrentStudent(addDropApprovalQueue.value)
    .filter((app) => !isShieldedAddDropType(app.type))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
)

/**
 * 当前生「真实新提交」的未审申请（加/退/重修三类一并进底账）
 * 不含主表/种子 demo 待审行，避免误判第二次申请
 */
const pendingLedgerApps = computed(() =>
  allApplications.value.filter(
    (app) =>
      isAddDropApplicationPending(app) && isStudentSubmittedAddDropApplication(app),
  ),
)

const pendingLedgerLines = computed(() =>
  collectPendingLedgerCourseLines(pendingLedgerApps.value),
)

/**
 * 学期净学分：课表确认态 ⊕ 真实新提交未审加/退（与学分条底账同源；供选课超帽/提交）
 * 注意：已含 pending，gate/提交的 dropLines·addLines 仅用当前表单，避免双扣
 */
const pendingAdjustedTermCredits = computed(() =>
  computeNetCreditsAfterLines(
    creditSummary.value.enrolled,
    pendingLedgerLines.value.dropCourses || [],
    pendingLedgerLines.value.addCourses || [],
  ),
)

/** 是否用真实新提交未审估算底账（蓝条直出估算说明） */
const showPendingEstimateTip = computed(() => pendingLedgerApps.value.length > 0)

/** 已有真实未审单则整单禁再交（非同主类型互斥） */
const primaryTypePendingBlocked = computed(
  () => pendingLedgerApps.value.length > 0,
)

const filteredApplications = computed(() => {
  const { status, keyword, type, academicSession, applicationNo } = appliedSearch.value
  const kw = String(keyword || '').trim().toLowerCase()
  const appNoKw = String(applicationNo || '').trim().toLowerCase()
  const sessionKw = String(academicSession || '').trim().toLowerCase()
  return allApplications.value.filter((app) => {
    if (!matchesPrimaryTypeFilter(app.type, type, app)) return false
    if (status && app.status !== status) return false
    if (sessionKw && String(app.academicSession || '').toLowerCase() !== sessionKw) return false
    if (appNoKw && !String(app.applicationNo || '').toLowerCase().includes(appNoKw)) return false
    if (!kw) return true
    const courseText = (app.items || [])
      .map((item) => `${item.courseCode || ''} ${item.courseName || ''}`)
      .join(' ')
    const haystack = `${app.applicationNo} ${courseText}`.toLowerCase()
    return haystack.includes(kw)
  })
})

const totalCount = computed(() => filteredApplications.value.length)
const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredApplications.value.slice(start, start + pageSize.value)
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

const applicationStatusOptions = [
  'Pending',
  'Approved',
  'PartiallyApproved',
  'Rejected',
  'Cancelled',
]

const selectableCourses = computed(() => getSelectableCoursesForStudent())

/** 可退选修（确认池）；退课池以必修为主，选修较少排后 */
function isDroppableElective(item) {
  if (!item) return false
  if (isMandatoryAddDropCourse(item)) return false
  return true
}

function mapEnrolledToPickerCourse(item) {
  return {
    id: item.courseId || item.courseCode,
    code: item.courseCode,
    name: item.courseName || item.courseCode,
    credits: item.credits,
    sectionId: item.sectionId,
    sectionCode: item.sectionCode,
    sectionName: item.sectionName,
    time: item.time,
    room: item.room,
    lecturer: item.lecturer,
    weekRange: item.weekRange || '1-18',
    fromEnrolled: true,
    type: item.type || 'ME',
    sourceType: item.sourceType || '',
    schoolElectiveCategory: item.schoolElectiveCategory || '',
    meetings: item.meetings,
    batchId: item.batchId || '',
    // 拟退并入加课池时作「原上课学期」
    academicSession: item.academicSession || '',
    originalAcademicSession: item.originalAcademicSession || item.academicSession || '',
  }
}

function mapRequiredToPickerCourse(item) {
  return {
    ...mapEnrolledToPickerCourse(item),
    type: item.type || 'CORE',
    sourceType: item.sourceType || 'required',
  }
}

/** 未审底账已拟退的课号集合（退课池不再列出） */
const pendingLedgerDropCodeSet = computed(() => {
  const set = new Set()
  for (const line of pendingLedgerLines.value.dropCourses || []) {
    const id = String(line.courseId || '').trim()
    const code = String(line.courseCode || '').trim()
    if (id) set.add(id)
    if (code) set.add(code)
  }
  return set
})

function isAlreadyPendingLedgerDrop(item) {
  const id = String(item?.courseId || item?.id || '').trim()
  const code = String(item?.courseCode || item?.code || '').trim()
  return (
    (id && pendingLedgerDropCodeSet.value.has(id)) ||
    (code && pendingLedgerDropCodeSet.value.has(code))
  )
}

/** 重修弹框候选：可选按挂科原课过滤 */
function buildRetakeCourseOptions() {
  const type = form.value.retakeType
  if (!type || (type !== 'failed' && type !== 'improve_grade')) return []
  const pool = listRetakePickerCourses(type, studentFields.value.studentId)
  const merged = mergeRetakePickerWithTimetableRequired(
    pool,
    studentRequiredCourses.value,
    studentFields.value.studentId,
    type,
  )
  if (!retakeFocusOriginal.value) return merged
  return filterRetakePickerCoursesByOriginal(merged, retakeFocusOriginal.value)
}

const courseOptions = computed(() => {
  if (form.value.needDrop === 'yes' && pickingFor.value === 'drop') {
    // 未审已拟退的课不再出现在退课池
    const required = (studentRequiredCourses.value || [])
      .filter((item) => !isAlreadyPendingLedgerDrop(item))
      .map(mapRequiredToPickerCourse)
    const electives = enrolled.value
      .filter(isDroppableElective)
      .filter((item) => !isAlreadyPendingLedgerDrop(item))
      .map(mapEnrolledToPickerCourse)
    return [...required, ...electives]
  }
  if (pickingFor.value === 'retake' || (form.value.needRetake === 'yes' && pickingFor.value !== 'add' && pickingFor.value !== 'drop' && form.value.needAdd !== 'yes')) {
    return buildRetakeCourseOptions()
  }
  if (
    pickingFor.value === 'add' ||
    form.value.needAdd === 'yes' ||
    form.value.action === 'Add' ||
    form.value.action === 'AddDrop' ||
    form.value.action === 'AddRetake' ||
    form.value.action === 'AddDropRetake'
  ) {
    return mergeEligibleAddWithPendingDropCores(
      getEligibleAddCoursesForStudent(studentFields.value.studentId),
      [...(pendingLedgerLines.value.dropCourses || []), ...(form.value.dropLines || [])],
      {
        fallbackAcademicSession:
          form.value.academicSession || defaultAcademicSession.value || '',
      },
    )
  }
  if (form.value.action === 'Retake' || form.value.action === 'RetakeDrop') {
    return buildRetakeCourseOptions()
  }
  const sid = studentFields.value.studentId
  if (hasWhitelistPrerequisiteBypass(sid)) {
    return selectableCourses.value.map((c) => ({
      ...c,
      eligibility: { ...(c.eligibility || {}), eligible: true, prerequisiteBypassed: true },
    }))
  }
  return selectableCourses.value
})

const scheduleBaseline = computed(() =>
  buildScheduleBaselineFromEnrolled(enrolled.value, pendingDropCodes.value),
)

/** 加退选课弹窗：确认课含 admin 代选（与退课表/合计学分对齐） */
const ADD_DROP_PICKER_CREDIT_OPTS = { scope: 'confirmed', includeAdmin: true }

/**
 * GE 学分胶囊色调（达标语义，与入口卡/顶栏同口径）：
 * 未达目标橙 / 达标（含超出）绿 / 无目标中性
 * @param {{ current: number, max: number }} bar
 */
function geCapsuleTone(bar) {
  const current = Number(bar?.current) || 0
  const max = Number(bar?.max) || 0
  if (max <= 0) return 'is-neutral'
  return current >= max ? 'is-achieved' : 'is-pending'
}

function sumCreditBarPair(bars) {
  return (bars || []).reduce(
    (acc, bar) => {
      acc.current += Number(bar.current) || 0
      acc.max += Number(bar.max) || 0
      return acc
    },
    { current: 0, max: 0 },
  )
}

/**
 * 毕业 GE → 本学期 GE → 毕业 ME → 本学期 ME：各总分 + 四类
 * 总分 = Σ 分类；已选不钳制；基线仅确认课
 */
const pickerCreditGroups = computed(() => {
  const row = getStudentMonitorRow()
  const opts = ADD_DROP_PICKER_CREDIT_OPTS
  const geGradCats = getGraduationGeBars(row, opts)
  const geTermCats = getTermGeElectiveCategoryBars(row, opts)
  const meGradCats = getGraduationMeBars(row, opts)
  const meTermCats = getTermGeCategoryBars(row, opts)
  const geGrad = sumCreditBarPair(geGradCats)
  const geTerm = sumCreditBarPair(geTermCats)
  const meGrad = sumCreditBarPair(meGradCats)
  const meTerm = sumCreditBarPair(meTermCats)
  // GE 口径与入口卡/顶栏一致：毕业总分用培养方案 18；学期总分用 geMax，分类只显示已选
  const geGradMax =
    Number(getProgrammeCreditProgress().geRequired) || geGrad.max
  const geTermMax =
    Number(getTermElectiveCreditProgress().geMax) || geTerm.max
  return [
    {
      key: 'ge-grad',
      total: {
        key: 'ge-grad',
        labelKey: 'courseRegistration.student.graduationElectiveProgressGe',
        current: geGrad.current,
        max: geGradMax,
        tone: geCapsuleTone({ current: geGrad.current, max: geGradMax }),
      },
      categories: geGradCats.map((bar) => ({ ...bar, tone: geCapsuleTone(bar), statLabel: true })),
    },
    {
      key: 'ge',
      total: {
        key: 'ge',
        labelKey: 'courseRegistration.student.termElectiveProgressGe',
        current: geTerm.current,
        max: geTermMax,
        tone: geCapsuleTone({ current: geTerm.current, max: geTermMax }),
      },
      categories: geTermCats.map((bar) => ({
        ...bar,
        isStat: true,
        tone: 'is-neutral',
      })),
    },
    {
      key: 'me-grad',
      total: {
        key: 'me-grad',
        labelKey: 'courseRegistration.student.graduationElectiveProgressMe',
        current: meGrad.current,
        max: Number(getProgrammeCreditProgress().meRequired) || meGrad.max,
        tone: geCapsuleTone({
          current: meGrad.current,
          max: Number(getProgrammeCreditProgress().meRequired) || meGrad.max,
        }),
      },
      categories: meGradCats.map((bar) => ({
        ...bar,
        tone: geCapsuleTone(bar),
        statLabel: true,
      })),
    },
    {
      key: 'me',
      total: {
        key: 'me',
        labelKey: 'courseRegistration.student.termElectiveProgressMe',
        current: meTerm.current,
        max: Number(getTermElectiveCreditProgress().meMax) || meTerm.max,
        tone: geCapsuleTone({
          current: meTerm.current,
          max: Number(getTermElectiveCreditProgress().meMax) || meTerm.max,
        }),
      },
      categories: meTermCats.map((bar) => ({
        ...bar,
        tone: geCapsuleTone(bar),
        statLabel: true,
      })),
    },
  ]
})

/** 本学期总分条（弹窗兼容旧 creditBars prop；与 picker 分类同源） */
const termCreditBars = computed(() => {
  const groups = pickerCreditGroups.value
  const ge = groups.find((g) => g.key === 'ge')?.total
  const me = groups.find((g) => g.key === 'me')?.total
  return [ge, me].filter(Boolean)
})

/** 课表确认态基线（未叠未审；由 applyPendingLedger 统一投影） */
const liveTermCreditStripBaseline = computed(() => {
  const groups = pickerCreditGroups.value
  const ge = groups.find((g) => g.key === 'ge')?.total
  const me = groups.find((g) => g.key === 'me')?.total
  const programme = getProgrammeCreditProgress()
  const geCurrent = Number(ge?.current) || 0
  const meCurrent = Number(me?.current) || 0
  const mandatorySelected = (studentRequiredCourses.value || []).reduce(
    (sum, item) => sum + (Number(item.credits) || 0),
    0,
  )
  return {
    geCurrent,
    geMax: Number(ge?.max) || 0,
    meCurrent,
    meMax: Number(me?.max) || 0,
    // 毕业已选与学期已选同源（含 admin 代选），拟退光本学期后归零；分母仍用培养方案要求
    gradGeCurrent: geCurrent,
    gradGeMax: Number(programme.geRequired) || 0,
    gradMeCurrent: meCurrent,
    gradMeMax: Number(programme.meRequired) || 0,
    // 毕业必修已选与学期必修同源（不用 prior 累计）
    gradMandatoryCurrent: mandatorySelected,
    gradMandatoryMax: Number(programme.mandatoryRequired) || 0,
    mandatorySelected,
  }
})

/**
 * 学分条基线：课表确认态 ⊕ 三类未审申请加/退投影
 * （二次申请叠在未审结果上，而非回到首次申请前）
 */
const termCreditStripBaseline = computed(() =>
  applyPendingLedgerToTermCreditBaseline(
    liveTermCreditStripBaseline.value,
    pendingLedgerApps.value,
  ),
)

const formTermCreditStrip = computed(() =>
  buildAddDropTermCreditStrip({
    ...termCreditStripBaseline.value,
    dropCourses: form.value.dropLines || [],
    // 加课 + 重修同单投影
    addCourses: [
      ...(form.value.addLines || []),
      ...(form.value.retakeLines || []),
    ],
  }),
)

/** 学期超出：仅学分条 GE/ME 学期总分（cur > max） */
const formTermCreditExcess = computed(() => sumGeMeTermStripExcess(formTermCreditStrip.value))

/** 本学期文商理类别剩余（超额计费；含 GE/ME 总量兜底） */
const planRemaining = computed(() => buildAddDropPlanRemaining())

const feeEstimate = computed(() => {
  const lines = []
  const addLines = form.value.addLines || []
  const retakeLines = form.value.retakeLines || []
  const dropLines = form.value.dropLines || []
  const action = form.value.action
  const category = studentFields.value.studentCategory || 'Local'
  const billLines = [
    ...addLines.map((line) => ({ line, feeAction: 'Add' })),
    ...retakeLines.map((line) => ({ line, feeAction: 'Retake' })),
  ]
  if (!billLines.length || (form.value.needAdd !== 'yes' && form.value.needRetake !== 'yes')) {
    return attachSstToFeeEstimate(sumFeeEstimates(lines), category)
  }

  // 含退课时先释放拟退课占用的毕业类别，再逐课扣减剩余（无退费抵免）
  let remaining =
    form.value.needDrop === 'yes'
      ? boostPlanRemainingFromDrops(planRemaining.value, dropLines)
      : planRemaining.value

  for (const { line, feeAction } of billLines) {
    const course = {
      id: line.courseId,
      code: line.courseCode,
      name: line.courseName,
      credits: line.credits,
      type: line.type,
      feeStream: line.feeStream,
      schoolElectiveCategory: line.schoolElectiveCategory,
      g1Category: line.g1Category,
      batchId: line.batchId,
      eligibilitySource: line.eligibilitySource || form.value.eligibilitySource,
    }
    const fee = estimateCourseFee({
      action: feeAction,
      course,
      planRemaining: remaining,
      eligibilitySource: course.eligibilitySource,
    })
    lines.push(fee)
    remaining = consumePlanRemaining(remaining, course, fee.billableCredits)
  }
  return attachSstToFeeEstimate(sumFeeEstimates(lines), category)
})

function resolveI18nLabel(key, fallback) {
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : fallback
}

function typeLabel(appOrType) {
  if (appOrType && typeof appOrType === 'object') {
    return formatAddDropApplicationTypeLabel(appOrType, t)
  }
  return formatAddDropApplicationTypeLabel({ type: appOrType }, t)
}

function typeClass(appOrType) {
  if (appOrType && typeof appOrType === 'object') {
    return addDropTypeTagClass(appOrType.type, appOrType)
  }
  return addDropTypeTagClass(appOrType)
}

/** 筛选/表单主类型三选一文案 */
function primaryOptionLabel(primary) {
  return resolveI18nLabel(addDropPrimaryOptionLabelKey(primary), primary || '—')
}

function statusLabel(status) {
  return resolveI18nLabel(`courseRegistration.approval.appStatus.${status}`, status)
}

function courseColumns(app) {
  return getAddDropCourseColumnTexts(app)
}

function listSectionName(app) {
  if (app.sectionName) return app.sectionName
  const item = app.items?.[0]
  if (item?.sectionName) return item.sectionName
  const code =
    app.sectionCode ||
    app.addSectionCode ||
    app.dropSectionCode ||
    item?.section ||
    ''
  return formatCourseSectionName(code, t)
}

function listWeekRange(app) {
  return (
    app.weekRange ||
    app.addWeekRange ||
    app.dropWeekRange ||
    app.items?.[0]?.weekRange ||
    '1-18'
  )
}

function listClassTimeVenueLines(app) {
  const locale = isZh.value ? 'zh' : 'en'
  const item = app.items?.[0] || {}
  const section = {
    time: item.time || app.time,
    room: item.room || app.venue || app.addVenue || app.dropVenue,
    weekRange: item.weekRange || app.weekRange || app.addWeekRange || app.dropWeekRange,
    meetings: item.meetings || app.meetings,
  }
  const lines = displayClassTimeVenueLines(section, locale)
  if (lines.length) return lines
  const one = displayClassTimeVenueFromFields(
    {
      time: section.time,
      classTime: app.classTime || app.addClassTime || app.dropClassTime || item.classTime,
      venue: section.room,
      weekRange: section.weekRange || '1-18',
    },
    locale,
  )
  return one && one !== '—' ? [one] : ['—']
}

function listLecturers(app) {
  return (
    app.lecturers ||
    app.addLecturers ||
    app.dropLecturers ||
    app.items?.[0]?.lecturer ||
    'Dr. Sarah'
  )
}

function listFee(app) {
  const amount = app.billAmount ?? app.feeEstimate?.total
  if (amount == null || amount === '') return '—'
  return formatAmountRmb(amount)
}

function listRetakeType(app) {
  if (app.type !== 'Retake' || !app.retakeType) return '—'
  return t(`courseRegistration.student.retakeType.${app.retakeType === 'improve_grade' ? 'improveGrade' : app.retakeType === 'failed' ? 'failed' : 'other'}`)
}

const COLUMN_HEADER_KEYS = {
  serial: 'common.serialNo',
  applicationNo: 'courseRegistration.approval.applicationNo',
  academicSession: 'courseRegistration.batch.academicSession',
  type: 'courseRegistration.approval.typeLabel',
  needDrop: 'courseRegistration.approval.needDropColumn',
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
  status: 'courseRegistration.approval.status',
  bill: 'courseRegistration.approval.billLabel',
  submittedAt: 'courseRegistration.approval.submittedAt',
  actions: 'common.actions',
}

function billLabel(status) {
  if (!status || status === 'none') return '—'
  return t(`courseRegistration.approval.bill.${status}`)
}

function columnHeader(col) {
  return t(COLUMN_HEADER_KEYS[col] || col)
}

function columnClass(col) {
  if (col === 'status') return 'nowrap col-status'
  if (col === 'classTimeVenue') return 'col-time-venue'
  if (col === 'actions') return 'col-actions nowrap'
  return 'nowrap'
}

function listExcessCredits(app) {
  return resolveAddDropExcessCredits(app)
}

function cellText(col, app, index) {
  if (col === 'serial') return (currentPage.value - 1) * pageSize.value + index + 1
  if (col === 'applicationNo') return app.applicationNo
  if (col === 'academicSession') return app.academicSession || '—'
  if (col === 'type') return typeLabel(app)
  if (col === 'needDrop') {
    return resolveAppNeedDrop(app) === 'yes' ? t('common.yes') : t('common.no')
  }
  if (col === 'addCourse') return courseColumns(app).add
  if (col === 'dropCourse') return courseColumns(app).drop
  if (col === 'retakeCourse') return courseColumns(app).retake
  if (col === 'section') return listSectionName(app)
  if (col === 'weekRange') return listWeekRange(app)
  if (col === 'classTimeVenue') return listClassTimeVenueLines(app).join('\n')
  if (col === 'lecturers') return listLecturers(app)
  if (col === 'excessCredits') return listExcessCredits(app)
  if (col === 'fee') return listFee(app)
  if (col === 'retakeType') return listRetakeType(app)
  if (col === 'status') return statusLabel(app.status)
  if (col === 'bill') return billLabel(app.billStatus)
  if (col === 'submittedAt') return app.submittedAt
  return ''
}

function openDetail(app) {
  detailApp.value = app
}

function closeDetail() {
  detailApp.value = null
}

function requestCancel(app) {
  cancelTarget.value = app
}

function confirmCancel() {
  const target = cancelTarget.value
  cancelTarget.value = null
  if (!target?.id) return
  const result = cancelStudentAddDropApplication(target.id)
  if (!result.ok) {
    message.value = t(result.errorKey || 'courseRegistration.student.cancelNotAllowed')
    return
  }
  if (detailApp.value?.id === target.id) {
    detailApp.value = result.application
  }
  message.value = t('courseRegistration.student.cancelSuccess')
}

function emptyFormState() {
  return createEmptyAddDropSectionForm({
    academicSession: defaultAcademicSession.value,
    needDrop: 'no',
    needAdd: 'no',
    needRetake: 'no',
    action: '',
    contactPhone: defaultContactPhone.value,
  })
}

function onFormUpdate(next) {
  form.value = next
}

function openForm() {
  if (!canApply.value) {
    message.value = t(
      addDropAccess.value.errorKey || 'courseRegistration.student.addDropWindowClosedShort',
    )
    return
  }
  if (!canStartApplication.value) {
    message.value = t('courseRegistration.student.addDropActionNotAllowed')
    return
  }
  // 未审/待缴：仍打开窗口，窗内提示原因并禁用操作
  form.value = emptyFormState()
  formError.value = ''
  message.value = ''
  formVisible.value = true
}

function closeForm() {
  if (submitting.value) return
  formVisible.value = false
  formError.value = ''
}

function resolveCourseById(courseId, fromEnrolled = false) {
  if (!courseId) return null
  if (fromEnrolled) {
    const requiredHit = (studentRequiredCourses.value || []).find(
      (item) =>
        item.courseId === courseId ||
        item.courseCode === courseId ||
        item.code === courseId,
    )
    if (requiredHit) return mapRequiredToPickerCourse(requiredHit)
    const enrolledHit = enrolled.value.find(
      (item) =>
        item.courseId === courseId ||
        item.courseCode === courseId ||
        item.code === courseId,
    )
    if (!enrolledHit) return null
    return mapEnrolledToPickerCourse(enrolledHit)
  }
  const base =
    courseOptions.value.find((item) => item.id === courseId || item.code === courseId) ||
    selectableCourses.value.find((item) => item.id === courseId || item.code === courseId) ||
    getCourseById(courseId)
  if (!base) return null
  return { ...base }
}

function resolveCourse() {
  return resolveCourseById(form.value.courseId, form.value.action === 'Drop')
}

const formPrimaryCourse = computed(() => resolveCourse())
const formDropCourse = computed(() => resolveCourseById(form.value.dropCourseId, true))
const formAddCourse = computed(() => resolveCourseById(form.value.addCourseId, false))

/**
 * 打开选课弹框
 * @param {string|{ target?: string, original?: object }} targetOrPayload
 * @param {object|null} [originalArg] 重修原课（挂科行）
 */
function openCoursePicker(targetOrPayload = 'primary', originalArg = null) {
  // 整单二次禁交：禁止再选课
  if (primaryTypePendingBlocked.value) {
    formError.value = t('courseRegistration.student.secondApplicationBlocked')
    return
  }
  let target = 'primary'
  let original = originalArg
  if (targetOrPayload && typeof targetOrPayload === 'object') {
    target = targetOrPayload.target || 'retake'
    original = targetOrPayload.original || null
  } else {
    target = targetOrPayload || 'primary'
  }
  const isRetakePick =
    target === 'retake' ||
    (target === 'primary' &&
      form.value.needRetake === 'yes' &&
      form.value.needAdd !== 'yes')
  if (isRetakePick) {
    const type = form.value.retakeType
    if (!type || (type !== 'failed' && type !== 'improve_grade')) {
      formError.value = t('courseRegistration.student.retakeTypeRequired')
      return
    }
    // 二层选课须指定原课
    if (!original) {
      formError.value = t('courseRegistration.student.retakePickFromOriginalHint')
      return
    }
    retakeFocusOriginal.value = original
  } else {
    retakeFocusOriginal.value = null
  }
  pickingFor.value = target
  coursePickerVisible.value = true
}

function buildLineFromSelection(course, section) {
  const snap = buildCourseScheduleSnapshot(course, section)
  const replaces = Array.isArray(course?.replacesOriginals) ? course.replacesOriginals : []
  const primaryOriginal = replaces[0] || null
  return {
    courseId: course?.id || course?.code || '',
    courseCode: course?.code || '',
    courseName: course?.name || course?.code || '',
    credits: Number(course?.credits) || 0,
    sectionId: snap.sectionId || section?.id || '',
    sectionCode: snap.groupNo || section?.code || '',
    sectionName: snap.sectionName || section?.name || '',
    classTime: snap.classTime || '',
    weekRange: snap.weekRange || '',
    venue: snap.venue || '',
    lecturers: snap.lecturers || '',
    meetings: snap.meetings || null,
    type: course?.type || primaryOriginal?.type || '',
    sourceType: course?.sourceType || primaryOriginal?.sourceType || '',
    schoolElectiveCategory:
      course?.schoolElectiveCategory || resolveSchoolElectiveCategory(course) || '',
    feeStream: course?.feeStream || '',
    eligibilitySource: course?.eligibilitySource || '',
    time: section?.time || course?.time || '',
    selectionGroupId: course?.selectionGroup?.id || '',
    selectionGroupName: course?.selectionGroup?.name || course?.selectionGroup?.groupLabel || '',
    isSubstituteRetake: Boolean(course?.isSubstituteRetake),
    // 同课重修无 replacesOriginals 时，原课即本课代码/名称
    replacesCourseCode: primaryOriginal?.courseCode || course?.code || '',
    replacesCourseName: primaryOriginal?.courseName || course?.name || '',
    replacesTranscriptId: primaryOriginal?.id || '',
    groupMaxGrade: course?.groupMaxGrade || '',
    groupMaxGradeZh: course?.groupMaxGradeZh || '',
    // 原上课学期：课表/资格行 → 当前申请学期
    academicSession:
      course?.academicSession ||
      course?.originalAcademicSession ||
      form.value.academicSession ||
      defaultAcademicSession.value ||
      '',
    originalAcademicSession:
      course?.originalAcademicSession ||
      course?.academicSession ||
      form.value.academicSession ||
      defaultAcademicSession.value ||
      '',
  }
}

function syncLegacyFieldsFromLines(next, listKey) {
  const lines = next[listKey] || []
  const first = lines[0]
  if (!first) {
    if (listKey === 'dropLines') {
      next.dropCourseId = ''
      if (next.action === 'Drop') next.courseId = ''
    } else {
      next.courseId = ''
      next.addCourseId = ''
    }
    return next
  }
  if (listKey === 'dropLines') {
    next.dropCourseId = first.courseId
    if (next.action === 'Drop') next.courseId = first.courseId
    next = applySectionToForm(
      next,
      next.action === 'Drop' ? 'primary' : 'drop',
      {
        id: first.sectionId,
        code: first.sectionCode,
        name: first.sectionName,
        time: first.time,
        classTime: first.classTime,
        room: first.venue,
        lecturer: first.lecturers,
        weekRange: first.weekRange,
        meetings: first.meetings,
      },
      {
        id: first.courseId,
        code: first.courseCode,
        name: first.courseName,
        credits: first.credits,
        eligibilitySource: first.eligibilitySource,
      },
    )
  } else {
    next.courseId = first.courseId
    if (next.action === 'AddDrop') next.addCourseId = first.courseId
    next = applySectionToForm(
      next,
      next.action === 'AddDrop' ? 'add' : 'primary',
      {
        id: first.sectionId,
        code: first.sectionCode,
        name: first.sectionName,
        time: first.time,
        classTime: first.classTime,
        room: first.venue,
        lecturer: first.lecturers,
        weekRange: first.weekRange,
        meetings: first.meetings,
      },
      {
        id: first.courseId,
        code: first.courseCode,
        name: first.courseName,
        credits: first.credits,
        eligibilitySource: first.eligibilitySource,
      },
    )
  }
  return next
}

function onCoursePickerClose() {
  coursePickerVisible.value = false
  retakeFocusOriginal.value = null
}

/**
 * 重修行是否对应某原课（用于跨 Tab/原课合并时替换同原课旧行）
 * @param {object} line
 * @param {object|null|undefined} original 成绩单原课行
 */
function retakeLineMatchesOriginal(line, original) {
  if (!line || !original) return false
  const oCode = String(original.courseCode || '').trim().toUpperCase()
  const oId = String(original.retakeCourseId || original.id || '').trim()
  const rCode = String(line.replacesCourseCode || '').trim().toUpperCase()
  const rTid = String(line.replacesTranscriptId || '').trim()
  if (oCode && rCode && rCode === oCode) return true
  if (oId && rTid && rTid === oId) return true
  const lineCode = String(line.courseCode || '').trim().toUpperCase()
  const lineCid = String(line.courseId || '').trim()
  // 无替代字段时：同课号或同重修目标课 id
  if (!rCode && oCode && lineCode === oCode) return true
  if (oId && lineCid && lineCid === oId) return true
  return false
}

/**
 * 按当前原课合并重修清单：保留其它原课已选，替换本原课对应行
 * @param {object[]} existing
 * @param {object[]} incoming
 * @param {object|null|undefined} original
 */
function mergeRetakeLinesForOriginal(existing = [], incoming = [], original) {
  if (!original) return [...(incoming || [])]
  const kept = (existing || []).filter((line) => !retakeLineMatchesOriginal(line, original))
  return [...kept, ...(incoming || [])]
}

function handleCoursePicked(payload) {
  const isDropPick =
    pickingFor.value === 'drop' ||
    (pickingFor.value === 'primary' && form.value.action === 'Drop')

  // 退课空确认：显式空 selections → 清空清单（勿回退到单课 payload）
  const explicitEmpty =
    isDropPick && Array.isArray(payload?.selections) && payload.selections.length === 0

  const selections = explicitEmpty
    ? []
    : Array.isArray(payload?.selections) && payload.selections.length
      ? payload.selections
      : [
          {
            courseId: typeof payload === 'string' ? payload : payload?.courseId,
            course: typeof payload === 'object' ? payload?.course : null,
            section: typeof payload === 'object' ? payload?.section : null,
          },
        ].filter((s) => s.courseId || s.course)

  const incoming = selections.map(({ courseId, course, section }) => {
    const resolved =
      course ||
      resolveCourseById(
        courseId,
        pickingFor.value === 'drop' || form.value.action === 'Drop',
      )
    let sec = section
    if (!sec && resolved && (resolved.fromEnrolled || resolved.sectionCode)) {
      sec = {
        id: resolved.sectionId || `enrolled-${resolved.code || courseId}-01`,
        code: resolved.sectionCode || '01',
        name: resolved.sectionName || formatCourseSectionName(resolved.sectionCode || '01', t),
        time: resolved.time || '',
        room: resolved.room || '',
        lecturer: resolved.lecturer || '',
        weekRange: resolved.weekRange || '1-18',
        meetings: resolved.meetings,
      }
    }
    return buildLineFromSelection(resolved || { id: courseId, code: courseId }, sec)
  })

  const isRetakePick = pickingFor.value === 'retake'
  const listKey = isDropPick ? 'dropLines' : isRetakePick ? 'retakeLines' : 'addLines'

  // 重修：按原课合并；本原课至多保留一门开课（与弹窗单课互斥一致）
  const retakeIncoming =
    isRetakePick && incoming.length > 1 ? incoming.slice(0, 1) : incoming
  const mergedRetakeLines = isRetakePick
    ? mergeRetakeLinesForOriginal(
        form.value.retakeLines || [],
        retakeIncoming,
        retakeFocusOriginal.value,
      )
    : incoming

  let next = {
    ...form.value,
    [listKey]: isRetakePick ? mergedRetakeLines : incoming,
  }
  if (listKey !== 'retakeLines') {
    next = syncLegacyFieldsFromLines(next, listKey)
  }

  if (isRetakePick || (!isDropPick && (form.value.needRetake === 'yes' && form.value.needAdd !== 'yes'))) {
    const keptType = form.value.retakeType || ''
    const focusOriginal = retakeFocusOriginal.value
    // 仅给本次重修行补履历；kept 行保留已有字段（重修至多一门）
    const gradeSourceLines = isRetakePick ? retakeIncoming : incoming
    const incomingWithGrade = gradeSourceLines.map((line, idx) => {
      const picked = selections[idx]?.course || resolveCourseById(line.courseId, false)
      const originalCode =
        line.replacesCourseCode ||
        picked?.replacesOriginals?.[0]?.courseCode ||
        focusOriginal?.courseCode ||
        ''
      const historyCourse =
        originalCode && originalCode !== line.courseCode
          ? {
              id:
                picked?.replacesOriginals?.[0]?.retakeCourseId ||
                focusOriginal?.retakeCourseId ||
                originalCode,
              code: originalCode,
              name: line.replacesCourseName || focusOriginal?.courseName || originalCode,
            }
          : picked || resolveCourseById(line.courseId, false)
      if (!historyCourse) {
        return {
          ...line,
          replacesCourseCode: line.replacesCourseCode || focusOriginal?.courseCode || '',
          replacesCourseName: line.replacesCourseName || focusOriginal?.courseName || '',
          replacesTranscriptId: line.replacesTranscriptId || focusOriginal?.id || '',
        }
      }
      const history = retakeHistoryFromCourse(
        historyCourse,
        next.academicSession,
        studentFields.value.studentId,
      )
      const maxGrade = line.groupMaxGrade || picked?.groupMaxGrade || history.latestGrade
      const maxZh =
        line.groupMaxGradeZh ||
        picked?.groupMaxGradeZh ||
        formatGradeToZh(maxGrade || history.gradeEarned)
      return {
        ...line,
        type: line.type || focusOriginal?.type || picked?.type || '',
        sourceType: line.sourceType || focusOriginal?.sourceType || picked?.sourceType || '',
        replacesCourseCode: line.replacesCourseCode || focusOriginal?.courseCode || originalCode || '',
        replacesCourseName:
          line.replacesCourseName || focusOriginal?.courseName || historyCourse.name || '',
        replacesTranscriptId: line.replacesTranscriptId || focusOriginal?.id || '',
        latestGrade: maxGrade || history.latestGrade || history.gradeEarned || '',
        latestGradeZh: maxZh,
        latestGradeSession: history.latestGradeSession || history.academicSessionTaken || '',
        previousCourseGradesText: history.previousCourseGradesText || '',
      }
    })
    const linesWithGrade = isRetakePick
      ? mergeRetakeLinesForOriginal(
          form.value.retakeLines || [],
          incomingWithGrade,
          focusOriginal,
        )
      : incomingWithGrade
    const firstLine = linesWithGrade[0]
    const firstHistory = firstLine
      ? retakeHistoryFromCourse(
          {
            id: firstLine.replacesTranscriptId || firstLine.courseId,
            code: firstLine.replacesCourseCode || firstLine.courseCode,
            name: firstLine.replacesCourseName || firstLine.courseName,
          },
          next.academicSession,
          studentFields.value.studentId,
        )
      : {}
    next = {
      ...next,
      [listKey]: linesWithGrade,
      ...firstHistory,
      gradeEarned: firstLine?.latestGrade || firstHistory.gradeEarned || '',
      retakeType: keptType,
      previousCourseGradesText: firstHistory.previousCourseGradesText || '',
    }
    next = syncLegacyFieldsFromLines(next, listKey)
  }

  form.value = next
  coursePickerVisible.value = false
  retakeFocusOriginal.value = null
  formError.value = ''
}

const MAX_DROP_ATTACHMENTS = 5
const MAX_DROP_ATTACHMENT_BYTES = 5 * 1024 * 1024

function syncAttachmentNameFromList() {
  const list = Array.isArray(form.value.attachments) ? form.value.attachments : []
  form.value.attachmentName = list[0]?.name || ''
}

function onAttachmentsAdd(files) {
  const incoming = Array.isArray(files) ? files : []
  const current = Array.isArray(form.value.attachments) ? [...form.value.attachments] : []
  for (const file of incoming) {
    if (!file?.name) continue
    if (file.size > MAX_DROP_ATTACHMENT_BYTES) continue
    if (current.length >= MAX_DROP_ATTACHMENTS) break
    if (current.some((f) => f.name === file.name && f.size === file.size)) continue
    current.push({ name: file.name, size: Number(file.size) || 0 })
  }
  form.value.attachments = current
  syncAttachmentNameFromList()
}

function removeAttachment(index) {
  const list = Array.isArray(form.value.attachments) ? [...form.value.attachments] : []
  if (index < 0 || index >= list.length) return
  list.splice(index, 1)
  form.value.attachments = list
  syncAttachmentNameFromList()
}

function clearAttachments() {
  form.value.attachments = []
  form.value.attachmentName = ''
}

function buildItemFromLine(action, line) {
  return {
    action,
    courseCode: line.courseCode,
    courseName: line.courseName || line.courseCode,
    credits: Number(line.credits) || 0,
    courseId: line.courseId,
    sectionId: line.sectionId || '',
    section: line.sectionCode || '01',
    sectionCode: line.sectionCode || '01',
    isSubstituteRetake: Boolean(line.isSubstituteRetake),
    replacesCourseCode: line.replacesCourseCode || '',
    replacesCourseName: line.replacesCourseName || '',
    replacesTranscriptId: line.replacesTranscriptId || '',
    selectionGroupId: line.selectionGroupId || '',
    groupMaxGrade: line.groupMaxGrade || '',
    sectionName: line.sectionName || '',
    previousCourseGradesText: line.previousCourseGradesText || '',
    latestGrade: line.latestGrade || '',
    latestGradeZh: line.latestGradeZh || '',
    time: line.time || line.classTime || '',
    classTime: line.classTime || '',
    weekRange: line.weekRange || '',
    room: line.venue || '',
    venue: line.venue || '',
    lecturer: line.lecturers || '',
    lecturers: line.lecturers || '',
    meetings: line.meetings || null,
    type: line.type || '',
    fee: 0,
    lineDecision: 'pending',
    retakeGrade: action === 'Retake' ? form.value.gradeEarned || 'F' : undefined,
  }
}

/**
 * 加课资格种子 → 换组锁原组行（originalSectionCode）
 * @returns {object[]}
 */
function buildEligibleCoreOriginLines() {
  return mergeEligibleAddWithPendingDropCores(
    getEligibleAddCoursesForStudent(studentFields.value.studentId),
    [...(pendingLedgerLines.value.dropCourses || []), ...(form.value.dropLines || [])],
    {
      fallbackAcademicSession:
        form.value.academicSession || defaultAcademicSession.value || '',
    },
  )
    .filter((course) => isMandatoryAddDropCourse(course))
    .map((course) => {
      const sectionCode = String(course.originalSectionCode || '').trim()
      if (!sectionCode) return null
      return {
        courseId: course.id,
        courseCode: course.code,
        sectionCode,
        type: course.type,
        sourceType: course.sourceType || 'required',
      }
    })
    .filter(Boolean)
}

function handleSubmit() {
  if (!canApply.value) {
    formError.value = t('courseRegistration.student.addDropWindowClosedShort')
    return
  }
  if (primaryTypePendingBlocked.value) {
    formError.value = t('courseRegistration.student.secondApplicationBlocked')
    return
  }
  if (unpaidBillBlocked.value) {
    formError.value = t('courseRegistration.student.secondApplicationUnpaidBlocked')
    return
  }

  const validation = validateAddDropSectionForm({
    ...form.value,
    coreSectionSwitchSections: coreSectionSwitchSections.value,
    coreSectionSwitchAllowAll: coreSectionSwitchAllowAll.value,
    allowDropBelowCreditMin: allowDropBelowCreditMin.value,
    dropBelowCreditMinFloor:
      dropBelowCreditMinFloor.value != null ? dropBelowCreditMinFloor.value : 0,
    // 与选课器/学分条一致：含真实未审投影后的学期净学分
    currentCredits: pendingAdjustedTermCredits.value,
    // 与弹窗一致：拟退 ∪ 资格种子
    coreLockOriginLines: mergeCoreLockOriginLines(
      form.value.dropLines || [],
      buildEligibleCoreOriginLines(),
    ),
  })
  if (!validation.ok) {
    formError.value = t(validation.errorKey, validation.errorParams || {})
    return
  }

  const addLines = form.value.addLines || []
  const dropLines = form.value.dropLines || []
  const retakeLines = form.value.retakeLines || []
  const creditAddLines = [...addLines, ...retakeLines]
  const action = form.value.action
  let items = []

  // 按三是否组装同一申请单 items（可组合）
  if (form.value.needDrop === 'yes') {
    items.push(...dropLines.map((line) => buildItemFromLine('Drop', line)))
  }
  if (form.value.needAdd === 'yes') {
    items.push(...addLines.map((line) => buildItemFromLine('Add', line)))
  }
  if (form.value.needRetake === 'yes') {
    items.push(...retakeLines.map((line) => buildItemFromLine('Retake', line)))
  }

  if (!items.length) {
    formError.value = t('courseRegistration.student.addDropSelectCourse')
    return
  }

  const currentCredits = pendingAdjustedTermCredits.value
  const creditMax = termCreditMax.value
  const net = computeNetCreditsAfterLines(currentCredits, dropLines, creditAddLines)
  const termOver = creditMax > 0 && net > creditMax
  if (termOver && !creditMaxBypass.value) {
    formError.value = t('courseRegistration.student.pickerStatusOverCredit')
    return
  }

  // GE 学期帽与 R3/学分条同源：拟加后 current > geMax 硬拦（白名单亦不可超）
  if (
    wouldExceedAddDropGeTermCap(termCreditStripBaseline.value, {
      dropCourses: dropLines,
      addCourses: creditAddLines,
    })
  ) {
    const strip = formTermCreditStrip.value
    formError.value = t('courseRegistration.student.termCreditCapExceeded', {
      type: 'GE',
      used: strip?.ge?.current ?? '—',
      max: strip?.ge?.max ?? '—',
    })
    return
  }

  // attach fee on add/retake items
  const feeTotal = feeEstimate.value.total || 0
  if (feeTotal > 0) {
    const billItem = items.find((i) => i.action === 'Add' || i.action === 'Retake')
    if (billItem) billItem.fee = feeTotal
  }

  submitting.value = true
  formError.value = ''

  const finishOk = () => {
    formVisible.value = false
    form.value = emptyFormState()
  }

  const snapshots = {
    add:
      action === 'Add' || action === 'AddDrop'
        ? addLines[0]
          ? buildCourseScheduleSnapshot(
              {
                id: addLines[0].courseId,
                code: addLines[0].courseCode,
                name: addLines[0].courseName,
                credits: addLines[0].credits,
              },
              {
                id: addLines[0].sectionId,
                code: addLines[0].sectionCode,
                name: addLines[0].sectionName,
                time: addLines[0].time,
                room: addLines[0].venue,
                lecturer: addLines[0].lecturers,
                weekRange: addLines[0].weekRange,
                meetings: addLines[0].meetings,
              },
            )
          : null
        : null,
    drop:
      action === 'Drop' || action === 'AddDrop' || action === 'RetakeDrop'
        ? dropLines[0]
          ? buildCourseScheduleSnapshot(
              {
                id: dropLines[0].courseId,
                code: dropLines[0].courseCode,
                name: dropLines[0].courseName,
                credits: dropLines[0].credits,
              },
              {
                id: dropLines[0].sectionId,
                code: dropLines[0].sectionCode,
                name: dropLines[0].sectionName,
                time: dropLines[0].time,
                room: dropLines[0].venue,
                lecturer: dropLines[0].lecturers,
                weekRange: dropLines[0].weekRange,
                meetings: dropLines[0].meetings,
              },
            )
          : null
        : null,
    retake:
      action === 'Retake' || action === 'RetakeDrop'
        ? addLines[0]
          ? buildCourseScheduleSnapshot(
              {
                id: addLines[0].courseId,
                code: addLines[0].courseCode,
                name: addLines[0].courseName,
                credits: addLines[0].credits,
              },
              {
                id: addLines[0].sectionId,
                code: addLines[0].sectionCode,
                name: addLines[0].sectionName,
                time: addLines[0].time,
                room: addLines[0].venue,
                lecturer: addLines[0].lecturers,
                weekRange: addLines[0].weekRange,
                meetings: addLines[0].meetings,
              },
            )
          : null
        : null,
  }
  const applicationCredits = {
    add:
      form.value.needAdd === 'yes'
        ? addLines.reduce((s, l) => s + (Number(l.credits) || 0), 0)
        : 0,
    retake:
      form.value.needRetake === 'yes'
        ? retakeLines.reduce((s, l) => s + (Number(l.credits) || 0), 0)
        : 0,
    drop: dropLines.reduce((s, l) => s + (Number(l.credits) || 0), 0),
  }
  const sectionPayload = buildAddDropSectionPayload(form.value, snapshots, feeEstimate.value, {
    termCreditExcess: formTermCreditExcess.value,
    termCreditStrip: formTermCreditStrip.value,
    termCreditStripBaseline: termCreditStripBaseline.value,
    applicationCredits,
  })

  const sharedOptions = {
    type: form.value.action,
    academicSession: form.value.academicSession,
    currentCredits,
    creditMax,
    creditMaxBypass: creditMaxBypass.value,
    termCreditOver: termOver,
    schedule: [...studentSchedule.value],
    feeWaiver: null,
    attachments: (Array.isArray(form.value.attachments) ? form.value.attachments : [])
      .filter((f) => f?.name)
      .map((f) => ({ name: f.name, size: Number(f.size) || 0 })),
    ...sectionPayload,
  }

  const result = submitStudentAddDropApplication(studentFields.value, items, sharedOptions)
  if (!result.ok) {
    formError.value = t(result.errorKey)
  } else {
    finishOk()
  }

  submitting.value = false
}
</script>

<template>
  <StudentPageShell>
    <div class="page-card">
      <div
        class="cr-adddrop-callout-row"
        :class="canApply ? 'is-info' : 'is-warning'"
      >
        <CourseRegistrationCallout
          class="cr-adddrop-callout"
          :variant="canApply ? 'info' : 'warning'"
        >
          <p>{{ calloutText }}</p>
          <button
            v-if="freshmanBlocked"
            type="button"
            class="btn btn-primary"
            style="margin-top: 8px"
            @click="goRegister"
          >
            {{ t('courseRegistration.student.goOnlineRegister') }}
          </button>
        </CourseRegistrationCallout>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.approval.typeLabel') }}</label>
              <select v-model="searchForm.type" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in typeFilterOptions" :key="opt" :value="opt">
                  {{ primaryOptionLabel(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('common.status') }}</label>
              <select v-model="searchForm.status" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in applicationStatusOptions" :key="opt" :value="opt">
                  {{ statusLabel(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.batch.academicSession') }}</label>
              <select v-model="searchForm.academicSession" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in academicSessionOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <template v-if="searchExpanded">
              <div class="search-item">
                <label>{{ t('courseRegistration.approval.applicationNo') }}</label>
                <input
                  v-model="searchForm.applicationNo"
                  type="text"
                  class="search-input"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.student.addDropSearchKeyword') }}</label>
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
      </div>

      <div class="toolbar cr-adddrop-toolbar">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!canStartApplication"
          @click="openForm"
        >
          {{ t('courseRegistration.student.startApplication') }}
        </button>
        <button
          type="button"
          class="btn btn-default cr-schedule-trigger"
          :class="{ 'has-slots': schedulePreviewSlots.length > 0 }"
          @click="openScheduleDrawer"
        >
          {{ scheduleToolbarLabel }}
        </button>
        <p
          v-if="message"
          class="cr-student-message cr-adddrop-toolbar-message"
          :class="{ 'cr-student-message--error': (!canApply || !canStartApplication) && message }"
        >
          {{ message }}
        </p>
      </div>

      <div class="table-section">
        <div class="table-wrap table-wrap--scroll">
          <table class="data-table">
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
              <tr v-for="(app, index) in paginatedApplications" :key="app.id">
                <td
                  v-for="col in listColumns"
                  :key="col"
                  :class="columnClass(col)"
                >
                  <template v-if="col === 'actions'">
                    <div class="actions-cell">
                      <button type="button" class="link-btn" @click="openDetail(app)">
                        {{ t('common.details') }}
                      </button>
                      <MovementStudentCancelAction
                        v-if="canCancelAddDropApplication(app)"
                        action-key="courseRegistration.student.cancelAction"
                        tooltip-title-key="courseRegistration.student.cancelTipTitle"
                        tooltip-body-key="courseRegistration.student.cancelTipBody"
                        @cancel="requestCancel(app)"
                      />
                    </div>
                  </template>
                  <template v-else-if="col === 'status'">
                    <span class="status-badge" :class="addDropStatusBadgeClass(app.status)">
                      {{ statusLabel(app.status) }}
                    </span>
                  </template>
                  <template v-else-if="col === 'type'">
                    <span class="type-tag" :class="typeClass(app)">{{ typeLabel(app) }}</span>
                  </template>
                  <template v-else-if="col === 'classTimeVenue'">
                    <div class="cr-time-venue">
                      <div
                        v-for="(line, li) in listClassTimeVenueLines(app)"
                        :key="li"
                        class="cr-time-venue-line"
                      >
                        {{ line }}
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    {{ cellText(col, app, index) }}
                  </template>
                </td>
              </tr>
              <tr v-if="!paginatedApplications.length">
                <td :colspan="tableColspan" class="empty-cell">
                  {{ t('courseRegistration.student.noApplications') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          v-model="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
          :page-size-options="[5, 10, 20]"
        />
      </div>
    </div>

    <div
      v-if="formVisible"
      class="modal-overlay cr-adddrop-modal-overlay"
      @click.self="closeForm"
    >
      <div class="modal-panel cr-adddrop-modal" role="dialog" aria-modal="true">
        <h3>{{ t('courseRegistration.student.applicationModalTitle') }}</h3>

        <div class="cr-adddrop-modal-body">
          <AddDropApplicationFormSections
            :form="form"
            :student-fields="studentFields"
            :academic-session-options="academicSessionOptions"
            :available-action-options="availableActionOptions"
            :available-primary-options="availablePrimaryOptions"
            :can-link-drop="canLinkDropForForm"
            :primary-course="formPrimaryCourse"
            :drop-course="formDropCourse"
            :add-course="formAddCourse"
            :fee-estimate="feeEstimate"
            :term-credit-excess="formTermCreditExcess"
            :term-credit-strip="formTermCreditStrip"
            :term-credit-strip-baseline="termCreditStripBaseline"
            :show-pending-estimate-tip="showPendingEstimateTip"
            :primary-type-pending-blocked="formOpsDisabled"
            :second-application-block-tip="secondApplicationBlockTip"
            :form-ops-disabled="formOpsDisabled"
            @update:form="onFormUpdate"
            @pick-course="openCoursePicker"
            @attachments-add="onAttachmentsAdd"
            @remove-attachment="removeAttachment"
            @clear-attachments="clearAttachments"
          />

          <!-- 退课底部「进入审批队列」提示已去掉（polish-adddrop-second-app-type-switch-and-drop-hint） -->

          <p v-if="formError" class="cr-student-message cr-student-message--error">{{ formError }}</p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-default" :disabled="submitting" @click="closeForm">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="submitting || !canApply || formOpsDisabled"
            @click="handleSubmit"
          >
            {{ t('courseRegistration.student.submitApplication') }}
          </button>
        </div>
      </div>
    </div>

    <AddDropCoursePickerModal
      :visible="coursePickerVisible"
      :action="
        pickingFor === 'drop'
          ? 'Drop'
          : pickingFor === 'retake'
            ? 'Retake'
            : pickingFor === 'add'
              ? 'Add'
              : form.needRetake === 'yes' && form.needAdd !== 'yes'
                ? 'Retake'
                : form.needAdd === 'yes'
                  ? 'Add'
                  : form.action
      "
      :multiple="true"
      :term-credit-gate="termCreditGate"
      :courses="courseOptions"
      :selected-id="
        pickingFor === 'drop'
          ? form.dropCourseId
          : pickingFor === 'add'
            ? form.addCourseId
            : form.courseId
      "
      :selected-section-id="
        pickingFor === 'drop'
          ? form.dropSectionId
          : pickingFor === 'add'
            ? form.addSectionId
            : form.sectionId
      "
      :schedule-baseline="scheduleBaseline"
      :credit-bars="termCreditBars"
      :credit-groups="pickerCreditGroups"
      :term-credit-strip-baseline="termCreditStripBaseline"
      :plan-remaining="planRemaining"
      :preselected-lines="
        pickingFor === 'drop'
          ? form.dropLines || []
          : pickingFor === 'retake'
            ? form.retakeLines || []
            : form.addLines || []
      "
      :allow-future-mandatory="allowFutureMandatory"
      :allow-future-elective="allowFutureElective"
      :future-elective-config="futureElectiveConfig"
      :academic-session="form.academicSession || defaultAcademicSession"
      :core-section-switch-sections="coreSectionSwitchSections"
      :core-section-switch-allow-all="coreSectionSwitchAllowAll"
      :origin-section-lines="originSectionLinesForPicker"
      :locked-course-type-tab="
        pickingFor === 'retake' ||
        (pickingFor === 'primary' && form.needRetake === 'yes' && form.needAdd !== 'yes')
          ? retakeLockedCourseTypeTab
          : ''
      "
      :retake-type="
        pickingFor === 'retake' ||
        (pickingFor === 'primary' && form.needRetake === 'yes' && form.needAdd !== 'yes')
          ? form.retakeType || ''
          : ''
      "
      @close="onCoursePickerClose"
      @confirm="handleCoursePicked"
    />

    <ApplicationDetailDrawer
      :visible="scheduleDrawerVisible"
      :title="t('courseRegistration.student.schedulePreviewTitle')"
      :person-line="schedulePersonLine"
      :subtitle="schedulePreviewHint"
      @close="scheduleDrawerVisible = false"
    >
      <StudentSchedulePreviewPanel
        embedded
        legend-mode="myResult"
        :schedule="schedulePreviewSlots"
      />
      <template #footer>
        <button type="button" class="btn btn-primary" @click="scheduleDrawerVisible = false">
          {{ t('common.close') }}
        </button>
      </template>
    </ApplicationDetailDrawer>

    <AddDropApplicationDetailDrawer
      :visible="!!detailApp"
      :application="detailApp"
      @close="closeDetail"
    />

    <ConfirmDialog
      :visible="!!cancelTarget"
      :title="t('courseRegistration.student.cancelConfirmTitle')"
      :message="t('courseRegistration.student.cancelConfirmMessage')"
      @confirm="confirmCancel"
      @cancel="cancelTarget = null"
    />
  </StudentPageShell>
</template>

<style scoped>
.cr-adddrop-callout-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  margin-bottom: 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.55;
}

.cr-adddrop-callout-row.is-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.cr-adddrop-callout-row.is-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.cr-adddrop-callout {
  flex: 1;
  min-width: 0;
}

.cr-adddrop-callout-row :deep(.cr-callout) {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
}

.cr-adddrop-demo-week {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.cr-adddrop-demo-week label {
  font-size: 13px;
  line-height: 1.55;
  color: inherit;
  white-space: nowrap;
}

.cr-adddrop-demo-week-select {
  height: 28px;
  min-width: 96px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  color: inherit;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid currentColor;
  opacity: 0.85;
  cursor: pointer;
}

.cr-adddrop-callout-row.is-info .cr-adddrop-demo-week-select {
  border-color: #93c5fd;
  color: #1e3a8a;
}

.cr-adddrop-callout-row.is-warning .cr-adddrop-demo-week-select {
  border-color: #fcd34d;
  color: #92400e;
}

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.channel-not-drop {
  font-size: 13px;
  color: #6b7280;
}

.type-add { background: #dbeafe; color: #1d4ed8; }
.type-drop { background: #fee2e2; color: #b91c1c; }
.type-retake { background: #fef3c7; color: #b45309; }
.type-replace { background: #e0e7ff; color: #4338ca; }
.type-adddrop { background: #e0e7ff; color: #3730a3; }
.type-retakedrop { background: #ffedd5; color: #c2410c; }

.cr-adddrop-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;
}

.cr-adddrop-modal {
  background: #fff;
  border-radius: 10px;
  width: min(960px, 96vw);
  max-height: min(92vh, 880px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
}

.cr-adddrop-modal h3 {
  margin: 0;
  padding: 16px 20px 6px;
  font-size: 15px;
  color: #111827;
  flex-shrink: 0;
}

.cr-adddrop-modal-body {
  flex: 1;
  min-height: 0;
  /* 由内部 .adddrop-sections__scroll 承担滚动，避免整页被 overflow:hidden 卡死 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 20px 8px;
}

.cr-adddrop-modal-body > :deep(.adddrop-sections) {
  flex: 1 1 auto;
  min-height: 0;
}

.cr-adddrop-modal-body > .cr-callout,
.cr-adddrop-modal-body > .cr-student-message {
  flex: 0 0 auto;
}

.cr-adddrop-modal :deep(.cr-callout) {
  margin: 10px 0 4px;
  font-size: 12px;
}

.cr-adddrop-modal :deep(.adddrop-sections .notes-title) {
  font-size: 12px;
}

.cr-adddrop-modal :deep(.adddrop-sections .notes-list) {
  font-size: 11px;
}

.cr-adddrop-modal :deep(.adddrop-sections .section-bar) {
  font-size: 13px;
  padding: 6px 10px;
  margin: 12px 0 10px;
}

.cr-adddrop-modal :deep(.adddrop-sections .form-field label) {
  font-size: 12px;
}

.cr-adddrop-modal :deep(.adddrop-sections .form-control) {
  font-size: 13px;
  padding: 6px 9px;
}

.cr-adddrop-modal :deep(.adddrop-sections .btn) {
  font-size: 12px;
  height: 34px;
}

.cr-adddrop-modal :deep(.adddrop-sections .declaration-text),
.cr-adddrop-modal :deep(.adddrop-sections .checkbox-row),
.cr-adddrop-modal :deep(.adddrop-sections .fee-title),
.cr-adddrop-modal :deep(.adddrop-sections .fee-list) {
  font-size: 12px;
}

.cr-adddrop-modal :deep(.adddrop-sections .declaration-extra),
.cr-adddrop-modal :deep(.adddrop-sections .field-hint) {
  font-size: 11px;
}

.cr-adddrop-modal :deep(.adddrop-sections .fee-total) {
  font-size: 13px;
}

.cr-adddrop-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.cr-adddrop-toolbar-message {
  margin: 0 0 0 auto;
  max-width: min(480px, 55%);
  text-align: right;
}

.cr-schedule-trigger.has-slots {
  border-color: #93c5fd;
  color: #1d4ed8;
}

.cr-adddrop-modal .modal-actions {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.cr-adddrop-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.form-field {
  margin-top: 14px;
}

.form-field--span2 {
  grid-column: 1 / -1;
}

.cr-adddrop-course-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cr-adddrop-course-trigger .form-input {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  background: #fff;
}

.cr-adddrop-course-trigger .btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
}

.required-mark {
  color: #dc2626;
  margin-left: 2px;
}

.radio-row {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 32px;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.radio-option input {
  margin: 0;
  cursor: pointer;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  font-family: inherit;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
  min-height: 72px;
}

.attach-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.attach-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
}

.attach-name {
  font-size: 13px;
  color: #6b7280;
}

.attach-input {
  display: none;
}

.optional-mark {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.actions-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  white-space: nowrap;
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

.cr-student-message--error {
  color: #b91c1c;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.cr-adddrop-modal .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.cr-adddrop-modal .btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.cr-adddrop-modal .btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cr-adddrop-modal .btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.cr-adddrop-modal .btn-default:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.nowrap {
  white-space: nowrap;
}

.adddrop-type-tabs {
  display: flex;
  gap: 0;
  margin: 0 0 12px;
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.adddrop-type-tab {
  padding: 12px 20px;
  font-size: 14px;
  color: #6b7280;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  cursor: pointer;
}

.adddrop-type-tab:hover {
  color: #2563eb;
}

.adddrop-type-tab.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
}

.table-wrap--scroll {
  overflow-x: auto;
  max-width: 100%;
}

.data-table thead th {
  white-space: nowrap;
}

.col-actions {
  white-space: nowrap;
  min-width: 0;
  width: 1%;
}
</style>
