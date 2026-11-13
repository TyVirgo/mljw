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
import '../../../styles/movement-status-badge.css'
import { getActiveBatch, formatRoundRange } from '../../../data/courseRegistration/registrationBatches.js'
import {
  submitStudentAddDropApplication,
  saveStudentAddDropDraft,
  resubmitStudentAddDropApplication,
  addDropApprovalQueue,
  canCancelAddDropApplication,
  cancelStudentAddDropApplication,
  getAddDropAccess,
} from '../../../data/courseRegistration/addDropApprovalQueue.js'
import {
  ADD_DROP_STUDENT_LIST_STATUS_OPTIONS,
  resolveAddDropStudentListStatus,
  matchesAddDropStudentListStatusFilter,
  addDropStudentListStatusBadgeClass,
} from '../../../data/courseRegistration/addDropStudentListStatus.js'
import AddDropResubmitModal from '../../../components/courseRegistration/AddDropResubmitModal.vue'
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
  hasEffectiveCreditMaxBypass,
  getEffectiveCreditBypassExtra,
  buildAddDropTermCreditStrip,
  sumGeMeTermStripExcess,
  wouldExceedAddDropElectiveTermCap,
  resolveAddDropElectiveTermCapMessageParams,
  resolveAddDropSituationCreditGaps,
  buildFixedSituationCatchUpFromBaseline,
  isMandatoryAddDropCourse,
  isAddDropApplicationPending,
  isStudentSubmittedAddDropApplication,
  collectPendingLedgerCourseLines,
  applyPendingLedgerToTermCreditBaseline,
  DEMO_TERM_MANDATORY_CREDIT_MAX,
  countsTowardResubmitScheduleEffect,
  normalizeAddDropLineAction,
  resolveApplicationTermCreditBaseline,
  buildApprovalDecisionTermCreditStrip,
  addDropApprovalLineKey,
  addDropLineKey,
} from '../../../data/courseRegistration/addDropMultiItems.js'
import {
  getEligibleAddCoursesForStudent,
  mergeEligibleAddWithPendingDropCores,
  expandEligibleAddWithIncompleteMeGroups,
} from '../../../data/courseRegistration/addDropEligibleCourses.js'
import {
  retakeHistoryFromCourse,
  formatGradeToZh,
} from '../../../data/courseRegistration/studentTranscript.js'
import {
  listRetakePickerCourses,
  mergeRetakePickerWithTimetableRequired,
  filterRetakePickerCoursesByOriginal,
  filterRetakePickerCoursesBySelectionGroupScope,
  findMeSelectionGroupForCode,
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
import {
  buildScheduleBaselineFromEnrolled,
  buildBaselineSlotsFromCourseLike,
  getSectionMeetingsConflictInfo,
} from '../../../data/courseRegistration/addDropSectionConflict.js'
import { getCourseById, resolveSchoolElectiveCategory } from '../../../data/courseRegistration/selectableCourses.js'
import { resolveUnifiedCourseCategoryCode } from '../../../data/courseRegistration/unifiedCourseCategory.js'
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
  buildAddDropApplicationSchedulePreview,
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
/** 申请窗取消：是否存草稿确认 */
const draftSavePromptVisible = ref(false)
/** 正在编辑的草稿 id（提交转正时覆盖） */
const editingDraftId = ref('')
/** 打开申请窗时的表单快照（增量 z：无改动取消不提示） */
const formBaselineSnapshot = ref('')
/** 已驳回重新提交中的申请 */
const resubmitApp = ref(null)
const resubmitModalRef = ref(null)
/** 重新提交弹窗内正在换课的行下标 */
const resubmitModifyIndex = ref(-1)
/** 选课器服务于重新提交换课 */
const resubmitPicking = ref(false)
/** 重提重修类型（不写主表单 retakeType） */
const resubmitRetakeType = ref('')
/** 重提当前换课行快照（预填 selected） */
const resubmitModifyItem = ref(null)
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
 * 按课性得到选课器锁定 Tab：core|ge|me
 * 增量 bc：优先统一课性；必修（含 MANDATORY）MUST 先于 ME 前缀，避免误进 ME
 * @param {object|null|undefined} courseOrLine
 * @returns {string}
 */
function resolveLockedCourseTypeTab(courseOrLine) {
  if (!courseOrLine) return ''
  // 与行展示课性同源（required / GE01 / ME02 …）
  const unified = String(resolveUnifiedCourseCategoryCode(courseOrLine) || '').toUpperCase()
  if (unified === 'REQUIRED') return 'core'
  if (unified.startsWith('GE')) return 'ge'
  if (unified.startsWith('ME')) return 'me'

  const type = String(courseOrLine.type || '').toUpperCase()
  const source = String(courseOrLine.sourceType || '').toLowerCase()
  // 必修先于 ME：禁止 MANDATORY.startsWith('ME') 误判
  if (type === 'CORE' || type === 'MANDATORY' || type === 'REQUIRED' || source === 'required') {
    return 'core'
  }
  if (type === 'GE' || /^GE(\d|-)/.test(type)) return 'ge'
  if (type === 'ME' || /^ME(\d|-)/.test(type)) return 'me'
  return 'core'
}

/**
 * 重修弹框锁定类别 Tab（与原课程外层 Tab 一致：core|ge|me）
 * @returns {string}
 */
const retakeLockedCourseTypeTab = computed(() =>
  resolveLockedCourseTypeTab(retakeFocusOriginal.value),
)

/**
 * 选课器锁定类别：重修原课 / 加课重提按驳回行课性（增量 ay）
 * @returns {string}
 */
const pickerLockedCourseTypeTab = computed(() => {
  if (
    pickingFor.value === 'retake' ||
    (pickingFor.value === 'primary' && form.needRetake === 'yes' && form.needAdd !== 'yes')
  ) {
    // 增量 bf：重提重修优先原课焦点，缺则用当前修改行课性
    return (
      retakeLockedCourseTypeTab.value ||
      (resubmitPicking.value ? resolveLockedCourseTypeTab(resubmitModifyItem.value) : '')
    )
  }
  // 加课重提：只展示该驳回行所属类别
  if (resubmitPicking.value && pickingFor.value === 'add' && resubmitModifyItem.value) {
    return resolveLockedCourseTypeTab(resubmitModifyItem.value)
  }
  return ''
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

/**
 * 是否存在学生真实提交且展示为「已驳回」的申请（须走重新提交，禁新发起）
 */
const rejectedApplicationBlocked = computed(() =>
  allApplications.value.some(
    (app) =>
      isStudentSubmittedAddDropApplication(app) &&
      resolveAddDropStudentListStatus(app) === 'Rejected',
  ),
)

/** 窗内禁用操作：真实未审、已驳回或真实待缴 */
const formOpsDisabled = computed(
  () =>
    primaryTypePendingBlocked.value ||
    rejectedApplicationBlocked.value ||
    unpaidBillBlocked.value,
)

/** 窗内提示文案（开窗可见原因） */
const secondApplicationBlockTip = computed(() => {
  if (primaryTypePendingBlocked.value) {
    return t('courseRegistration.student.secondApplicationBlocked')
  }
  if (rejectedApplicationBlocked.value) {
    return t('courseRegistration.student.secondApplicationRejectedBlocked')
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

/**
 * 重提弹窗当前工作行
 * @returns {object[]}
 */
function getResubmitWorkingItems() {
  const fromRef = resubmitModalRef.value?.workingItems
  if (Array.isArray(fromRef) && fromRef.length) return fromRef
  return resubmitApp.value?.items || []
}

/**
 * 重提工作行 → 表单 line（按 action 过滤，可排除正在换课的下标）
 * @param {string} action Drop|Add|Retake
 * @param {number} [excludeIndex]
 */
function linesFromResubmitItems(action, excludeIndex = -1) {
  return getResubmitWorkingItems()
    .map((item, index) => (index === excludeIndex ? null : item))
    .filter((item) => item && String(item.action || '') === action)
    .map((item) => lineFromApplicationItem(item))
    .filter(Boolean)
}

/**
 * 重提有效行（计入课表投影/冲突）：已通过或已换课（增量 bi）
 * @param {'Drop'|'Add'|'Retake'|string} action
 * @param {number} [excludeIndex]
 */
function effectiveLinesFromResubmitItems(action, excludeIndex = -1) {
  return getResubmitWorkingItems()
    .map((item, index) => (index === excludeIndex ? null : item))
    .filter(
      (item) =>
        item &&
        normalizeAddDropLineAction(item.action) === action &&
        countsTowardResubmitScheduleEffect(item),
    )
    .map((item) => lineFromApplicationItem(item))
    .filter(Boolean)
}

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
  // 增量 ae/bi：重提换课仅并入「有效拟退」（已通过或已换课计入预览），不含不通过/未改驳回/已取消
  if (resubmitPicking.value) {
    const exclude =
      pickingFor.value === 'drop' ? resubmitModifyIndex.value : -1
    for (const [index, item] of getResubmitWorkingItems().entries()) {
      if (index === exclude || !item) continue
      if (normalizeAddDropLineAction(item.action) !== 'Drop') continue
      if (!countsTowardResubmitScheduleEffect(item)) continue
      pushKey(item.courseId)
      pushKey(item.courseCode)
    }
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

/** 可超学分：校级 CR204 ∪ 白名单，取较大额度 */
const creditMaxBypass = computed(() =>
  hasEffectiveCreditMaxBypass(studentFields.value.studentId),
)

const creditBypassExtra = computed(() =>
  getEffectiveCreditBypassExtra(studentFields.value.studentId),
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
  // 重提按当前换课意图选白名单，不依赖主表单 action
  const kind =
    resubmitPicking.value
      ? pickingFor.value === 'retake'
        ? 'retake'
        : 'add'
      : form.value.action === 'Retake' || form.value.action === 'RetakeDrop'
        ? 'retake'
        : 'add'
  return getWhitelistCoreSectionSwitchSections(studentFields.value.studentId, kind)
})

const coreSectionSwitchAllowAll = computed(() => {
  const kind =
    resubmitPicking.value
      ? pickingFor.value === 'retake'
        ? 'retake'
        : 'add'
      : form.value.action === 'Retake' || form.value.action === 'RetakeDrop'
        ? 'retake'
        : 'add'
  return isWhitelistCoreSectionSwitchAllowAll(studentFields.value.studentId, kind)
})

const allowDropBelowCreditMin = computed(() =>
  hasWhitelistAllowDropBelowCreditMin(studentFields.value.studentId),
)

/** 白名单退课学分地板；无权限为 null */
const dropBelowCreditMinFloor = computed(() =>
  getWhitelistDropBelowCreditMinFloor(studentFields.value.studentId),
)

/** 重修无拟退时：课表在读必修作为原分组（含学期供换组锁） */
const originSectionLinesForPicker = computed(() =>
  (studentRequiredCourses.value || []).map((item) => ({
    courseId: item.courseId,
    courseCode: item.courseCode || item.code,
    sectionId: item.sectionId,
    sectionCode: item.sectionCode || item.section,
    type: item.type || 'CORE',
    sourceType: item.sourceType || 'required',
    // 换组锁按学期：原上课学期
    academicSession: item.academicSession || '',
    originalAcademicSession: item.originalAcademicSession || item.academicSession || '',
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

/**
 * 选课器学分门控：重提时用本单「有效」工作行（排除正在换课行），不读主表单 lines
 * 增量 bk：与重提顶栏同源——仅已通过/已换课计入，不通过/未改驳回/已取消不计
 */
const activeTermCreditGate = computed(() => {
  if (!resubmitPicking.value) return termCreditGate.value
  const idx = resubmitModifyIndex.value
  const dropLines = effectiveLinesFromResubmitItems(
    'Drop',
    pickingFor.value === 'drop' ? idx : -1,
  )
  const addOnlyLines = effectiveLinesFromResubmitItems(
    'Add',
    pickingFor.value === 'add' ? idx : -1,
  )
  const retakeLines = effectiveLinesFromResubmitItems(
    'Retake',
    pickingFor.value === 'retake' ? idx : -1,
  )
  return {
    ...termCreditGate.value,
    dropLines,
    addOnlyLines,
    retakeLines,
    addLines: [...addOnlyLines, ...retakeLines],
  }
})

/**
 * 选课器学分条基线：重提用申请基线（与重提/详情决策投影同源）；否则课表⊕未审账本
 * 增量 bk
 */
const activeTermCreditStripBaseline = computed(() => {
  if (resubmitPicking.value && resubmitApp.value) {
    return resolveApplicationTermCreditBaseline(resubmitApp.value)
  }
  return termCreditStripBaseline.value
})

/**
 * 重提外层学分锚点（与 AddDropResubmitModal.liveTermCreditStrip 同源）
 * 增量 bl：选课器勾选未变时直接展示，保证一进来与外层一致
 */
const resubmitCreditStripAnchor = computed(() => {
  if (!resubmitPicking.value || !resubmitApp.value) return null
  const items = getResubmitWorkingItems()
  if (!items.length) return null
  /** @type {Record<string, string>} */
  const decisionsByKey = {}
  items.forEach((item, idx) => {
    const decision = String(item?.lineDecision || 'pending').trim() || 'pending'
    const approvalKey = addDropApprovalLineKey(item, idx)
    const bareKey = addDropLineKey(item)
    decisionsByKey[approvalKey] = decision
    if (bareKey) decisionsByKey[bareKey] = decision
    decisionsByKey[idx] = decision
  })
  return buildApprovalDecisionTermCreditStrip(
    { ...resubmitApp.value, items },
    decisionsByKey,
  )
})

/**
 * 选课器确认前校验（重提换课）：失败由选课器内展示
 * @param {{ selections?: object[] }} payload
 * @returns {{ ok: boolean, errorKey?: string, errorParams?: object }}
 */
function validateCoursePickerConfirm(payload) {
  if (!resubmitPicking.value) return { ok: true }
  const first = payload?.selections?.[0]
  if (!first && pickingFor.value !== 'drop') {
    return { ok: false, errorKey: 'courseRegistration.student.resubmitPickRequired' }
  }
  const action =
    pickingFor.value === 'drop' ? 'Drop' : pickingFor.value === 'retake' ? 'Retake' : 'Add'
  if (action === 'Drop' && !first) return { ok: true }
  const course = first?.course || {}
  const section = first?.section || {}
  const line = {
    courseId: first?.courseId || course.id || course.courseId || '',
    courseCode: course.code || course.courseCode || '',
    courseName: course.name || course.courseName || '',
    credits: Number(course.credits) || 0,
    sectionId: section.id || '',
    sectionCode: section.code || '',
    time: section.time || '',
    classTime: section.time || '',
    meetings: section.meetings || null,
    type: course.type || '',
    sourceType: course.sourceType || '',
  }
  return validateResubmitReplacementLine(line, action)
}

/** 重提换课选课器副标题（强调单选 + 行类型） */
const resubmitPickerSubtitle = computed(() => {
  if (!resubmitPicking.value) return ''
  const actionKey =
    pickingFor.value === 'drop'
      ? 'actionDrop'
      : pickingFor.value === 'retake'
        ? 'actionRetake'
        : 'actionAdd'
  return t('courseRegistration.student.resubmitPickerSubtitle', {
    type: t(`courseRegistration.student.${actionKey}`),
  })
})

/** 重提换课时预填选中行（单课） */
const resubmitPickerPreselectedLines = computed(() => {
  if (!resubmitPicking.value || !resubmitModifyItem.value) return []
  const line = lineFromApplicationItem(resubmitModifyItem.value)
  return line ? [line] : []
})

/**
 * 选课器申请类型（与原先模板三元同源）
 * @returns {'Add'|'Drop'|'Retake'|string}
 */
const coursePickerAction = computed(() => {
  if (pickingFor.value === 'drop') return 'Drop'
  if (pickingFor.value === 'retake') return 'Retake'
  if (pickingFor.value === 'add') return 'Add'
  if (form.value.needRetake === 'yes' && form.value.needAdd !== 'yes') return 'Retake'
  if (form.value.needAdd === 'yes') return 'Add'
  return form.value.action
})

/**
 * 重修与重提换课：单选 radio；加课/退课：多选
 * 增量 am：正常「选择重修课程」也走 multiple=false（不再仅重提单选）
 */
const coursePickerMultiple = computed(
  () => !resubmitPicking.value && coursePickerAction.value !== 'Retake',
)

/**
 * 主页「我的课表」：仅实课表（listMyResultCourses / 已 schedule-effective）
 * 增量 am：MUST NOT 扣表单拟退或未审拟退；申请内「课程预览」才做本单投影
 */
const schedulePreviewSlots = computed(() =>
  buildMyResultSchedule(listMyResultCourses(), { locale: isZh.value ? 'zh' : 'en' }),
)

/*
 * @deprecated 增量 am 前「我的课表」会排除 pendingDropCodes（表单+未审拟退），导致审批/缴费前课表已变；
 * 保留逻辑对照，勿再接入 schedulePreviewSlots。
 * const schedulePreviewSlotsExcludePendingDrops = ...
 */

/** 本单是否已勾选加/退/重修（预览图例是否展示虚线分色） */
const applicationScheduleHasFormOps = computed(() => {
  const dropCourses = form.value.dropLines || []
  const addCourses = form.value.addLines || []
  const retakeCourses = form.value.retakeLines || []
  return Boolean(dropCourses.length || addCourses.length || retakeCourses.length)
})

/**
 * 申请弹窗「课程预览」：拟退生效后课表（非上次申请）
 * 无本单行时与外面「我的课表」同源；有行时保留实线 + 加/重修虚线（不画退课）
 */
const applicationSchedulePreviewSlots = computed(() => {
  if (!applicationScheduleHasFormOps.value) {
    // 尚未勾选本单课程：与工具栏「我的课表」一致（实课表）
    return schedulePreviewSlots.value
  }
  return buildAddDropApplicationSchedulePreview({
    baseCourses: listMyResultCourses(),
    dropCourses: form.value.dropLines || [],
    // 与选课 scheduleBaseline 同源，避免全退后仍残留实线
    dropKeys: pendingDropCodes.value,
    addCourses: form.value.addLines || [],
    retakeCourses: form.value.retakeLines || [],
    locale: isZh.value ? 'zh' : 'en',
  })
})

const scheduleToolbarLabel = computed(() => t('courseRegistration.student.scheduleToolbarButton'))
// 增量 aw：我的课表抽屉不再传 subtitle（原 schedulePreviewHint / schedulePreviewAddDropHint 已弃用）

const applicationScheduleDrawerVisible = ref(false)

/** 打开本单课程预览抽屉 */
function openApplicationSchedulePreview() {
  applicationScheduleDrawerVisible.value = true
}

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
/**
 * @deprecated 估算说明已并入二次申请红字；蓝底不再展示
 * 保留计算避免其它引用断裂，恒为 false
 */
const showPendingEstimateTip = computed(() => false)

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
    if (status && !matchesAddDropStudentListStatusFilter(app, status)) return false
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

/** 学生列表四态筛选：草稿 / 待审批 / 已驳回 / 已结束 */
const applicationStatusOptions = ADD_DROP_STUDENT_LIST_STATUS_OPTIONS

const selectableCourses = computed(() => getSelectableCoursesForStudent())

/**
 * 可退选修（确认池）
 * @deprecated 增量 u 起退课池改用 listMyResultCourses，不再按「必修∪确认选修」拆分；保留供旧调用
 */
function isDroppableElective(item) {
  if (!item) return false
  if (isMandatoryAddDropCourse(item)) return false
  return true
}

/**
 * 我的选课行 → 退课弹窗课程行（含申请来源课）
 * @param {object} item listMyResultCourses 行
 */
function mapMyResultToDropPickerCourse(item) {
  if (isMandatoryAddDropCourse(item) || item?.resultType === 'required') {
    return mapRequiredToPickerCourse(item)
  }
  return mapEnrolledToPickerCourse(item)
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

/**
 * 重提换课：本单其它「同申请类型 + 已通过/不通过」行占用的课号与课 id
 * 仅同 Drop/Add/Retake 才锁，避免退课已同意误伤加课/重修池
 * 正在修改的驳回行不计入，以便保留原课可选
 * @returns {Set<string>}
 */
function buildResubmitOccupiedCourseKeySet() {
  const occupied = new Set()
  if (!resubmitPicking.value) return occupied
  const modifyIndex = resubmitModifyIndex.value
  // 当前换课类型：与 pickingFor / 行 action 对齐
  const currentAction =
    pickingFor.value === 'drop'
      ? 'Drop'
      : pickingFor.value === 'retake'
        ? 'Retake'
        : pickingFor.value === 'add'
          ? 'Add'
          : String(resubmitModifyItem.value?.action || '').trim()
  for (const [index, item] of getResubmitWorkingItems().entries()) {
    if (index === modifyIndex || !item) continue
    const decision = String(item.lineDecision || '').trim()
    // 增量 bf：已取消行不占同课号锁
    if (decision === 'cancelled') continue
    const itemAction = String(item.action || '').trim()
    // 增量 ba/bb：退课/加课与确认校验对齐——其它任意行同课号置灰（只锁冲突课）
    if (currentAction === 'Drop' || currentAction === 'Add') {
      const courseId = String(item.courseId || '').trim()
      const courseCode = String(item.courseCode || '').trim()
      if (courseId) occupied.add(courseId)
      if (courseCode) {
        occupied.add(courseCode)
        occupied.add(courseCode.toUpperCase())
      }
      continue
    }
    // 重修：仅锁定已同意/不同意占用课；其它驳回行仍可后续各自修改
    if (decision !== 'approved' && decision !== 'rejected') continue
    // 增量 ak：跨类型不占用锁
    if (currentAction && itemAction && itemAction !== currentAction) continue
    const courseId = String(item.courseId || '').trim()
    const courseCode = String(item.courseCode || '').trim()
    if (courseId) occupied.add(courseId)
    if (courseCode) {
      occupied.add(courseCode)
      occupied.add(courseCode.toUpperCase())
    }
  }
  return occupied
}

/**
 * 是否为正在换课的本行原课（保持可选/预勾选）
 * @param {object} course 选课器课程
 * @returns {boolean}
 */
function isResubmitModifyOriginalCourse(course) {
  const current = resubmitModifyItem.value
  if (!current) return false
  const courseId = String(course?.courseId || course?.id || '').trim()
  const courseCode = String(course?.courseCode || course?.code || '')
    .trim()
    .toUpperCase()
  const currentId = String(current.courseId || '').trim()
  const currentCode = String(current.courseCode || '').trim().toUpperCase()
  return (
    (courseId && currentId && courseId === currentId) ||
    (courseCode && currentCode && courseCode === currentCode)
  )
}

/**
 * 给重提换课候选打标：本单已同意/不通过占用课置灰（本行原课除外）
 * @param {object[]} courses 候选课列表
 * @returns {object[]}
 */
function markResubmitSiblingLockedCourses(courses) {
  if (!resubmitPicking.value) return courses || []
  const occupied = buildResubmitOccupiedCourseKeySet()
  if (!occupied.size) return courses || []
  return (courses || []).map((course) => {
    if (isResubmitModifyOriginalCourse(course)) return course
    const courseId = String(course?.courseId || course?.id || '').trim()
    const courseCode = String(course?.courseCode || course?.code || '').trim()
    const codeUpper = courseCode.toUpperCase()
    const locked =
      (courseId && occupied.has(courseId)) ||
      (courseCode && occupied.has(courseCode)) ||
      (codeUpper && occupied.has(codeUpper))
    if (!locked) return course
    return { ...course, resubmitSiblingLocked: true }
  })
}

/** 重修类型：重提优先用独立值，不依赖主表单 */
function effectiveRetakeType() {
  if (resubmitPicking.value) {
    const raw = String(resubmitRetakeType.value || resubmitApp.value?.retakeType || '').trim()
    if (raw === 'failed' || raw === 'improve_grade') return raw
    return 'failed'
  }
  return form.value.retakeType
}

/**
 * 补齐焦点课性，避免 type 空导致课程组范围不过滤（增量 bi）
 * @param {object|null|undefined} focus
 */
function focusForSelectionGroupScope(focus) {
  if (!focus) return focus
  if (focus.type || focus.sourceType || focus.schoolElectiveCategory) return focus
  const tab = pickerLockedCourseTypeTab.value
  if (tab === 'me') return { ...focus, type: 'ME' }
  if (tab === 'ge') return { ...focus, type: 'GE' }
  if (tab === 'core') return { ...focus, type: 'CORE', sourceType: 'required' }
  return focus
}

/**
 * 重修弹框候选
 * 首次申请：可按挂科原课焦点过滤；重提换课：不按同课号收窄，但按课程组范围过滤（增量 bh）
 */
function buildRetakeCourseOptions() {
  const type = effectiveRetakeType()
  if (!type || (type !== 'failed' && type !== 'improve_grade')) return []
  const pool = listRetakePickerCourses(type, studentFields.value.studentId)
  const merged = mergeRetakePickerWithTimetableRequired(
    pool,
    studentRequiredCourses.value,
    studentFields.value.studentId,
    type,
  )
  // 增量 bh/bi：重提/有焦点时按课程组范围（真实 n 选 m vs 普通 GE/ME）过滤
  const focus = focusForSelectionGroupScope(
    resubmitPicking.value
      ? resubmitModifyItem.value || retakeFocusOriginal.value
      : retakeFocusOriginal.value,
  )
  const scoped = filterRetakePickerCoursesBySelectionGroupScope(merged, focus)
  // 增量 bj：必修重修重提仍仅原课号；ME/GE 重提不按同课号收窄（ak）
  if (resubmitPicking.value) {
    const focusCourse = focus || retakeFocusOriginal.value
    if (resolveLockedCourseTypeTab(focusCourse) === 'core') {
      return filterRetakePickerCoursesByOriginal(
        scoped,
        focusCourse || retakeFocusOriginal.value,
      )
    }
    return scoped
  }
  if (!retakeFocusOriginal.value) return scoped
  return filterRetakePickerCoursesByOriginal(scoped, retakeFocusOriginal.value)
}

/**
 * 加课池拟退合并源：重提用本单退课行，否则表单+底账
 */
function dropLinesForAddPoolMerge() {
  if (resubmitPicking.value) {
    return [
      ...(pendingLedgerLines.value.dropCourses || []),
      ...effectiveLinesFromResubmitItems('Drop'),
    ]
  }
  return [
    ...(pendingLedgerLines.value.dropCourses || []),
    ...(form.value.dropLines || []),
  ]
}

/**
 * 可退池：我的选课 − 未审底账已拟退（与退课选课器 / 摘要「退课前」同源）
 * @returns {object[]}
 */
function listDropPoolMyResultCourses() {
  return listMyResultCourses(studentFields.value.studentId).filter(
    (item) => !isAlreadyPendingLedgerDrop(item),
  )
}

/**
 * 可退池学分总和（申请表退课红字「退课前」；弹窗内由 courses 自行汇总）
 */
const dropPoolCreditsTotal = computed(() =>
  listDropPoolMyResultCourses().reduce((sum, item) => sum + (Number(item.credits) || 0), 0),
)

const courseOptions = computed(() => {
  // 增量 ae/aj：重提换课只按 pickingFor 进各自池（退=在读、加=可加、重修=重修池），不搬用、不读主表单 need*
  if (resubmitPicking.value && pickingFor.value === 'drop') {
    // 退课池：在读确认课 − 未审拟退；再标本单已同意/不通过占用
    return markResubmitSiblingLockedCourses(
      listDropPoolMyResultCourses().map(mapMyResultToDropPickerCourse),
    )
  }
  if (resubmitPicking.value && pickingFor.value === 'retake') {
    // 重修池：挂科/提分候选（可带原课焦点），禁止用退课课表
    return markResubmitSiblingLockedCourses(buildRetakeCourseOptions())
  }
  if (resubmitPicking.value && pickingFor.value === 'add') {
    // 加课池：可加资格 ∪ 拟退后可加必修；增量 bh 再按课程组范围收窄
    const addPool = expandEligibleAddWithIncompleteMeGroups(
      mergeEligibleAddWithPendingDropCores(
        getEligibleAddCoursesForStudent(studentFields.value.studentId),
        dropLinesForAddPoolMerge(),
        {
          fallbackAcademicSession:
            resubmitApp.value?.academicSession ||
            form.value.academicSession ||
            defaultAcademicSession.value ||
            '',
        },
      ),
    )
    return markResubmitSiblingLockedCourses(
      filterRetakePickerCoursesBySelectionGroupScope(
        addPool,
        focusForSelectionGroupScope(resubmitModifyItem.value),
      ),
    )
  }
  if (form.value.needDrop === 'yes' && pickingFor.value === 'drop') {
    // 与预览/冲突基线同源：必修∪确认∪已批准申请加/重修；未审已拟退不再列出
    return listDropPoolMyResultCourses().map(mapMyResultToDropPickerCourse)
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
    return expandEligibleAddWithIncompleteMeGroups(
      mergeEligibleAddWithPendingDropCores(
        getEligibleAddCoursesForStudent(studentFields.value.studentId),
        dropLinesForAddPoolMerge(),
        {
          fallbackAcademicSession:
            form.value.academicSession || defaultAcademicSession.value || '',
        },
      ),
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

/** 冲突基线与课程预览同源：我的选课 − 拟退（大小写不敏感） */
const scheduleBaseline = computed(() =>
  buildScheduleBaselineFromEnrolled(listMyResultCourses(), pendingDropCodes.value),
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
    /** 本学期必修要求：demo 培养方案配额（展示 9/13（9+4）），不接真接口 */
    mandatoryMax: DEMO_TERM_MANDATORY_CREDIT_MAX,
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

/**
 * 硬拦用因修未修：含拟退、不含拟加（加课不双计）
 * 重提换课时拟退取自本单 workingItems
 */
const electiveCatchUpCredits = computed(() => {
  const dropCourses = resubmitPicking.value
    ? effectiveLinesFromResubmitItems(
        'Drop',
        pickingFor.value === 'drop' ? resubmitModifyIndex.value : -1,
      )
    : form.value.dropLines || []
  const stripAfterDrops = buildAddDropTermCreditStrip({
    ...termCreditStripBaseline.value,
    dropCourses,
    addCourses: [],
  })
  const gaps = resolveAddDropSituationCreditGaps(stripAfterDrops)
  return {
    ge: gaps.ge,
    me: gaps.me,
    /** 必修学期格分母：无独立学期配额时要求按 0，仅加因修未修 */
    mandatory: gaps.mandatory,
  }
})

/**
 * 蓝底 tip：截止到当前学期基线落下快照，不随本单拟加拟退变（增量 ah：矩阵未修行改跟 strip）
 */
const situationCatchUpDisplay = computed(() =>
  buildFixedSituationCatchUpFromBaseline(termCreditStripBaseline.value),
)

/**
 * 学期超出：扣因修未修后仍超学期要求的 GE/ME 学分
 * （因修未修补上的不算超出）
 */
const formTermCreditExcess = computed(() =>
  sumGeMeTermStripExcess(formTermCreditStrip.value, electiveCatchUpCredits.value),
)

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

/**
 * 学生列表四态文案（按申请行决策映射后再取 i18n）
 * @param {string|object} statusOrApp 内部 status 或申请对象
 */
function statusLabel(statusOrApp) {
  const key = resolveAddDropStudentListStatus(statusOrApp)
  return resolveI18nLabel(`courseRegistration.student.listStatus.${key}`, key)
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
  if (col === 'status') return statusLabel(app)
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
  editingDraftId.value = ''
  form.value = emptyFormState()
  formBaselineSnapshot.value = snapshotFormForDirtyCheck(form.value)
  formError.value = ''
  message.value = ''
  formVisible.value = true
}

/**
 * 表单脏检查快照（相对打开时）
 * @param {object} formObj
 */
function snapshotFormForDirtyCheck(formObj) {
  try {
    return JSON.stringify(formObj || {})
  } catch {
    return ''
  }
}

/**
 * 相对打开快照是否有改动（增量 z）
 */
function isApplicationFormDirty() {
  return snapshotFormForDirtyCheck(form.value) !== formBaselineSnapshot.value
}

/** 关窗并清空表单（不存草稿） */
function discardFormAndClose() {
  draftSavePromptVisible.value = false
  formVisible.value = false
  formError.value = ''
  editingDraftId.value = ''
  formBaselineSnapshot.value = ''
  form.value = emptyFormState()
}

function closeForm() {
  if (submitting.value) return
  // 仅有改动才询问存草稿；无改动直接关
  if (isApplicationFormDirty()) {
    draftSavePromptVisible.value = true
    return
  }
  discardFormAndClose()
}

/**
 * 是否已驳回（可重新提交）：须至少一条驳回行（update_required）
 * @param {object} app
 */
function canResubmitAddDropApplication(app) {
  return (app?.items || []).some(
    (item) => String(item?.lineDecision || '').trim() === 'update_required',
  )
}

/**
 * 打开已驳回重新提交弹窗
 * @param {object} app
 */
function openResubmit(app) {
  if (!canResubmitAddDropApplication(app)) return
  resubmitApp.value = app
}

function closeResubmit() {
  resubmitApp.value = null
  resubmitModifyIndex.value = -1
  resubmitPicking.value = false
  resubmitRetakeType.value = ''
  resubmitModifyItem.value = null
  retakeFocusOriginal.value = null
}

/**
 * 从重提驳回行构造重修原课焦点（供候选过滤与履历回填）
 * @param {object} item 申请行
 * @returns {object|null}
 */
function buildRetakeFocusFromResubmitItem(item) {
  if (!item) return null
  const courseCode = String(item.replacesCourseCode || item.courseCode || '').trim()
  if (!courseCode && !item.replacesTranscriptId) return null
  return {
    courseCode,
    code: courseCode,
    courseName: item.replacesCourseName || item.courseName || courseCode,
    id: item.replacesTranscriptId || '',
    retakeCourseId: item.replacesTranscriptId || item.courseId || '',
    type: item.type || '',
    sourceType: item.sourceType || '',
  }
}

/**
 * 重新提交弹窗：对驳回行点「修改」→ 打开选课器（不写主表单 need*）
 * @param {{ item: object, index: number }} payload
 */
function onResubmitModifyLine(payload) {
  const item = payload?.item
  const index = Number(payload?.index)
  if (!item || !Number.isFinite(index) || index < 0) return
  resubmitModifyIndex.value = index
  // 补齐课性，供加课重提锁定类别 Tab（增量 ay/bc：与展示课性同源）
  const lib = getCourseById(item.courseId) || getCourseById(item.courseCode) || null
  const codeForGroup = String(item.courseCode || lib?.code || '').trim()
  const meGroupHit = findMeSelectionGroupForCode(codeForGroup)
  const merged = {
    ...item,
    type: item.type || lib?.type || '',
    sourceType: item.sourceType || lib?.sourceType || '',
    schoolElectiveCategory:
      item.schoolElectiveCategory || lib?.schoolElectiveCategory || '',
    // 增量 bi：补齐真实课程组，供同组过滤
    selectionGroupId:
      item.selectionGroupId ||
      lib?.selectionGroupId ||
      lib?.selectionGroup?.id ||
      meGroupHit?.group?.id ||
      '',
    selectionGroup:
      item.selectionGroup || lib?.selectionGroup || meGroupHit?.group || null,
  }
  // 若仍缺课性，用统一课性反推 type/sourceType，避免必修误锁 ME
  if (!merged.type && !merged.sourceType) {
    const unified = String(resolveUnifiedCourseCategoryCode({ ...merged, ...lib }) || '')
    if (unified === 'required') {
      merged.type = 'CORE'
      merged.sourceType = 'required'
    } else if (/^GE/i.test(unified)) {
      merged.type = 'GE'
    } else if (/^ME/i.test(unified)) {
      merged.type = 'ME'
    }
  }
  resubmitModifyItem.value = merged
  resubmitPicking.value = true
  const action = String(item.action || 'Add')
  pickingFor.value =
    action === 'Drop' ? 'drop' : action === 'Retake' ? 'retake' : 'add'
  // 重修：独立类型 + 原课焦点，禁止污染 form.needRetake / form.retakeType
  if (action === 'Retake') {
    const raw = String(resubmitApp.value?.retakeType || item.retakeType || '').trim()
    resubmitRetakeType.value =
      raw === 'failed' || raw === 'improve_grade' ? raw : 'failed'
    retakeFocusOriginal.value = buildRetakeFocusFromResubmitItem(item)
  } else {
    resubmitRetakeType.value = ''
    retakeFocusOriginal.value = null
  }
  coursePickerVisible.value = true
}

/**
 * 重提换课确认前：相对整单其它行做同课号/学分/选修帽/课表冲突校验
 * @param {object} line 新选课行
 * @param {string} action Drop|Add|Retake
 * @returns {{ ok: boolean, errorKey?: string, errorParams?: object }}
 */
function validateResubmitReplacementLine(line, action) {
  if (!line || !(line.courseId || line.courseCode)) {
    return { ok: false, errorKey: 'courseRegistration.student.resubmitPickRequired' }
  }
  const idx = resubmitModifyIndex.value
  const code = String(line.courseCode || '').trim().toUpperCase()
  const courseId = String(line.courseId || '').trim()
  // 与本单其它行同课号冲突
  for (const [i, other] of getResubmitWorkingItems().entries()) {
    if (i === idx || !other) continue
    const otherCode = String(other.courseCode || '').trim().toUpperCase()
    const otherId = String(other.courseId || '').trim()
    if ((code && otherCode && code === otherCode) || (courseId && otherId && courseId === otherId)) {
      return { ok: false, errorKey: 'courseRegistration.student.resubmitDuplicateCourse' }
    }
  }
  if (action === 'Drop') return { ok: true }

  // 增量 bi：学分与冲突均只用「有效」行（退课不通过等不得腾时段/扣学分）
  const dropLines = effectiveLinesFromResubmitItems('Drop', -1)
  const addOnlyLines = effectiveLinesFromResubmitItems('Add', action === 'Add' ? idx : -1)
  const retakeLines = effectiveLinesFromResubmitItems(
    'Retake',
    action === 'Retake' ? idx : -1,
  )
  const creditAddLines = [
    ...addOnlyLines,
    ...retakeLines,
    ...(action === 'Add' || action === 'Retake' ? [line] : []),
  ]
  const creditMax = termCreditMax.value
  const net = computeNetCreditsAfterLines(
    pendingAdjustedTermCredits.value,
    dropLines,
    creditAddLines,
  )
  if (creditMax > 0 && net > creditMax && !creditMaxBypass.value) {
    return { ok: false, errorKey: 'courseRegistration.student.pickerStatusOverCredit' }
  }

  // 增量 bl/bk：重提用申请基线，与选课器学分条同源，避免 GE 误拦静默失败
  const stripBaseline =
    resubmitApp.value != null
      ? resolveApplicationTermCreditBaseline(resubmitApp.value)
      : termCreditStripBaseline.value
  const catchUp = electiveCatchUpCredits.value
  for (const kind of ['GE', 'ME']) {
    const deficit = kind === 'GE' ? catchUp.ge : catchUp.me
    if (
      wouldExceedAddDropElectiveTermCap(stripBaseline, {
        dropCourses: dropLines,
        addCourses: creditAddLines,
        kind,
        deficit,
      })
    ) {
      const params = resolveAddDropElectiveTermCapMessageParams(stripBaseline, {
        dropCourses: dropLines,
        addCourses: creditAddLines,
        kind,
        deficit,
      })
      return {
        ok: false,
        errorKey: 'courseRegistration.student.termCreditCapExceeded',
        errorParams: params || { type: kind },
      }
    }
  }

  // 课表冲突：已选基线（仅剔有效拟退）∪ 本单其它有效加/重修
  const peerSlots = []
  for (const peer of [...addOnlyLines, ...retakeLines]) {
    peerSlots.push(...buildBaselineSlotsFromCourseLike(peer))
  }
  const baseline = [...(scheduleBaseline.value || []), ...peerSlots]
  const conflict = getSectionMeetingsConflictInfo(
    {
      time: line.time || line.classTime || '',
      meetings: line.meetings || null,
    },
    baseline,
  )
  if (conflict.conflict) {
    return { ok: false, errorKey: 'courseRegistration.student.resubmitModifyFailed' }
  }
  return { ok: true }
}

/**
 * 确认重提前整单时段冲突（增量 bi：有效退课腾位 ∪ 有效加/重修互检）
 * @param {object[]} items 即将提交的工作行
 * @returns {{ ok: boolean, errorKey?: string }}
 */
function validateResubmitItemsScheduleConflicts(items = []) {
  const list = Array.isArray(items) ? items : []
  const effective = list.filter((item) => countsTowardResubmitScheduleEffect(item))
  const dropKeys = []
  const pushKey = (v) => {
    const s = String(v || '').trim()
    if (s && !dropKeys.includes(s)) dropKeys.push(s)
  }
  for (const item of effective) {
    if (normalizeAddDropLineAction(item?.action) !== 'Drop') continue
    pushKey(item.courseId)
    pushKey(item.courseCode)
  }
  const baseline = buildScheduleBaselineFromEnrolled(listMyResultCourses(), dropKeys)
  const peerSlots = []
  const addRetake = effective.filter((item) => {
    const action = normalizeAddDropLineAction(item?.action)
    return action === 'Add' || action === 'Retake'
  })
  for (let i = 0; i < addRetake.length; i += 1) {
    const line = lineFromApplicationItem(addRetake[i])
    if (!line) continue
    const peersBefore = peerSlots.slice()
    const conflict = getSectionMeetingsConflictInfo(
      {
        time: line.time || line.classTime || '',
        meetings: line.meetings || null,
      },
      [...baseline, ...peersBefore],
    )
    if (conflict.conflict) {
      return { ok: false, errorKey: 'courseRegistration.student.resubmitModifyFailed' }
    }
    peerSlots.push(...buildBaselineSlotsFromCourseLike(line))
  }
  return { ok: true }
}

/**
 * 确认重新提交：全部最新行回待审批（增量 bf：可写回附件）
 * @param {{ application: object, items: object[], attachments?: object[] }} payload
 */
function onResubmitSubmit(payload) {
  const app = payload?.application || resubmitApp.value
  const items = payload?.items || []
  if (!app?.id || !items.length) return
  // 增量 bi：整单再拦时段冲突（防换课漏检或未改行互撞）
  const scheduleCheck = validateResubmitItemsScheduleConflicts(items)
  if (!scheduleCheck.ok) {
    message.value = t(
      scheduleCheck.errorKey || 'courseRegistration.student.resubmitModifyFailed',
    )
    return
  }
  const attachments = Array.isArray(payload?.attachments)
    ? payload.attachments.map((f) => ({
        name: f.name,
        size: Number(f.size) || 0,
      }))
    : Array.isArray(app.attachments)
      ? [...app.attachments]
      : []
  const result = resubmitStudentAddDropApplication(app.id, items, {
    type: app.type,
    academicSession: app.academicSession,
    attachments,
  })
  if (!result.ok) {
    message.value = t(result.errorKey || 'courseRegistration.student.resubmitNotAllowed')
    return
  }
  message.value = t('courseRegistration.student.resubmitSuccess')
  closeResubmit()
}

/**
 * 申请行 item → 表单 line
 * @param {object} item
 */
function lineFromApplicationItem(item) {
  if (!item) return null
  return {
    courseId: item.courseId || '',
    courseCode: item.courseCode || '',
    courseName: item.courseName || item.courseCode || '',
    credits: Number(item.credits) || 0,
    sectionId: item.sectionId || '',
    sectionCode: item.sectionCode || item.section || '',
    sectionName: item.sectionName || '',
    classTime: item.classTime || item.time || '',
    time: item.time || item.classTime || '',
    weekRange: item.weekRange || '',
    venue: item.venue || item.room || '',
    lecturers: item.lecturers || item.lecturer || '',
    meetings: item.meetings || null,
    type: item.type || '',
    isSubstituteRetake: Boolean(item.isSubstituteRetake),
    replacesCourseCode: item.replacesCourseCode || '',
    replacesCourseName: item.replacesCourseName || '',
    replacesTranscriptId: item.replacesTranscriptId || '',
    selectionGroupId: item.selectionGroupId || '',
    groupMaxGrade: item.groupMaxGrade || '',
    previousCourseGradesText: item.previousCourseGradesText || '',
    latestGrade: item.latestGrade || '',
    latestGradeZh: item.latestGradeZh || '',
  }
}

/**
 * 从草稿/申请回填表单
 * @param {object} app
 */
function formStateFromApplication(app) {
  const items = app?.items || []
  const dropLines = items
    .filter((i) => i.action === 'Drop')
    .map(lineFromApplicationItem)
    .filter(Boolean)
  const addLines = items
    .filter((i) => i.action === 'Add')
    .map(lineFromApplicationItem)
    .filter(Boolean)
  const retakeLines = items
    .filter((i) => i.action === 'Retake')
    .map(lineFromApplicationItem)
    .filter(Boolean)
  const needDrop =
    app.needDrop === 'yes' || app.needDrop === 'no'
      ? app.needDrop
      : dropLines.length
        ? 'yes'
        : 'no'
  const needAdd =
    app.needAdd === 'yes' || app.needAdd === 'no'
      ? app.needAdd
      : addLines.length
        ? 'yes'
        : 'no'
  const needRetake =
    app.needRetake === 'yes' || app.needRetake === 'no'
      ? app.needRetake
      : retakeLines.length
        ? 'yes'
        : 'no'
  return createEmptyAddDropSectionForm({
    academicSession: app.academicSession || defaultAcademicSession.value,
    needDrop,
    needAdd,
    needRetake,
    action: app.type || '',
    contactPhone: app.contactPhone || defaultContactPhone.value,
    addNotes: app.addNotes || '',
    retakeNotes: app.retakeNotes || '',
    dropReason: app.dropReason || app.reason || '',
    addType: app.addType || '',
    retakeType: app.retakeType || '',
    previouslyTakenCourse: app.previouslyTakenCourse || '',
    gradeEarned: app.gradeEarned || '',
    academicSessionTaken: app.academicSessionTaken || '',
    previousCourseGradesText: app.previousCourseGradesText || '',
    declarationAgreed: Boolean(app.declarationAgreed),
    attachments: Array.isArray(app.attachments) ? [...app.attachments] : [],
    dropLines,
    addLines,
    retakeLines,
  })
}

/**
 * 编辑草稿
 * @param {object} app
 */
function openDraftForEdit(app) {
  if (!app || app.status !== 'Draft') return
  editingDraftId.value = app.id
  if (app.formSnapshot && typeof app.formSnapshot === 'object') {
    // 优先整表快照回填（含未选完课程的中间态）
    form.value = createEmptyAddDropSectionForm({
      ...app.formSnapshot,
      addLines: Array.isArray(app.formSnapshot.addLines) ? [...app.formSnapshot.addLines] : [],
      dropLines: Array.isArray(app.formSnapshot.dropLines) ? [...app.formSnapshot.dropLines] : [],
      retakeLines: Array.isArray(app.formSnapshot.retakeLines)
        ? [...app.formSnapshot.retakeLines]
        : [],
      attachments: Array.isArray(app.formSnapshot.attachments)
        ? [...app.formSnapshot.attachments]
        : [],
    })
  } else {
    form.value = formStateFromApplication(app)
  }
  formBaselineSnapshot.value = snapshotFormForDirtyCheck(form.value)
  formError.value = ''
  message.value = ''
  formVisible.value = true
}

/**
 * 组装当前表单的 items（草稿可空）
 */
function collectFormItemsForSave() {
  const items = []
  if (form.value.needDrop === 'yes') {
    items.push(...(form.value.dropLines || []).map((line) => buildItemFromLine('Drop', line)))
  }
  if (form.value.needAdd === 'yes') {
    items.push(...(form.value.addLines || []).map((line) => buildItemFromLine('Add', line)))
  }
  if (form.value.needRetake === 'yes') {
    items.push(...(form.value.retakeLines || []).map((line) => buildItemFromLine('Retake', line)))
  }
  return items
}

/**
 * 确认存入草稿
 */
function confirmSaveDraft() {
  const items = collectFormItemsForSave()
  const snapshots = {}
  const sectionPayload = buildAddDropSectionPayload(form.value, snapshots, feeEstimate.value, {
    termCreditExcess: formTermCreditExcess.value,
    termCreditStrip: formTermCreditStrip.value,
    termCreditStripBaseline: termCreditStripBaseline.value,
  })
  const result = saveStudentAddDropDraft(studentFields.value, items, {
    draftId: editingDraftId.value || undefined,
    type: form.value.action,
    academicSession: form.value.academicSession,
    currentCredits: pendingAdjustedTermCredits.value,
    creditMax: termCreditMax.value,
    creditMaxBypass: creditMaxBypass.value,
    schedule: [...studentSchedule.value],
    attachments: (Array.isArray(form.value.attachments) ? form.value.attachments : [])
      .filter((f) => f?.name)
      .map((f) => ({ name: f.name, size: Number(f.size) || 0 })),
    formSnapshot: { ...form.value },
    ...sectionPayload,
  })
  draftSavePromptVisible.value = false
  if (!result.ok) {
    formError.value = t(result.errorKey || 'courseRegistration.student.addDropEmpty')
    return
  }
  message.value = t('courseRegistration.student.draftSaveSuccess')
  discardFormAndClose()
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
  if (rejectedApplicationBlocked.value) {
    formError.value = t('courseRegistration.student.secondApplicationRejectedBlocked')
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
  if (resubmitPicking.value) {
    resubmitPicking.value = false
    resubmitModifyIndex.value = -1
    resubmitRetakeType.value = ''
    resubmitModifyItem.value = null
  }
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

  // 已驳回重新提交换课：单选替换目标行，并相对整单校验
  if (resubmitPicking.value && resubmitModifyIndex.value >= 0) {
    if (!selections.length) {
      message.value = t('courseRegistration.student.resubmitPickRequired')
      return
    }
    const first = selections[0]
    const resolved =
      first?.course ||
      resolveCourseById(
        first?.courseId,
        pickingFor.value === 'drop',
      )
    let sec = first?.section
    if (!sec && resolved && (resolved.fromEnrolled || resolved.sectionCode)) {
      sec = {
        id: resolved.sectionId || `enrolled-${resolved.code || first?.courseId}-01`,
        code: resolved.sectionCode || '01',
        name: resolved.sectionName || formatCourseSectionName(resolved.sectionCode || '01', t),
        time: resolved.time || '',
        room: resolved.room || '',
        lecturer: resolved.lecturer || '',
        weekRange: resolved.weekRange || '1-18',
        meetings: resolved.meetings,
      }
    }
    let line = buildLineFromSelection(resolved || { id: first?.courseId }, sec)
    const prevAction =
      resubmitModifyItem.value?.action ||
      resubmitApp.value?.items?.[resubmitModifyIndex.value]?.action ||
      (pickingFor.value === 'drop' ? 'Drop' : pickingFor.value === 'retake' ? 'Retake' : 'Add')
    // 重修换课：保留原课焦点与履历字段（申请 retakeType 仍挂在整单上）
    if (prevAction === 'Retake') {
      const focusOriginal = retakeFocusOriginal.value
      const picked = resolved || first?.course
      const session =
        resubmitApp.value?.academicSession ||
        form.value.academicSession ||
        defaultAcademicSession.value ||
        ''
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
          : picked
      if (historyCourse) {
        const history = retakeHistoryFromCourse(
          historyCourse,
          session,
          studentFields.value.studentId,
        )
        const maxGrade = line.groupMaxGrade || picked?.groupMaxGrade || history.latestGrade
        const maxZh =
          line.groupMaxGradeZh ||
          picked?.groupMaxGradeZh ||
          formatGradeToZh(maxGrade || history.gradeEarned)
        line = {
          ...line,
          type: line.type || focusOriginal?.type || picked?.type || '',
          sourceType: line.sourceType || focusOriginal?.sourceType || picked?.sourceType || '',
          replacesCourseCode:
            line.replacesCourseCode || focusOriginal?.courseCode || originalCode || '',
          replacesCourseName:
            line.replacesCourseName || focusOriginal?.courseName || historyCourse.name || '',
          replacesTranscriptId: line.replacesTranscriptId || focusOriginal?.id || '',
          latestGrade: maxGrade || history.latestGrade || history.gradeEarned || '',
          latestGradeZh: maxZh,
          latestGradeSession: history.latestGradeSession || history.academicSessionTaken || '',
          previousCourseGradesText: history.previousCourseGradesText || '',
        }
      } else {
        line = {
          ...line,
          replacesCourseCode: line.replacesCourseCode || focusOriginal?.courseCode || '',
          replacesCourseName: line.replacesCourseName || focusOriginal?.courseName || '',
          replacesTranscriptId: line.replacesTranscriptId || focusOriginal?.id || '',
        }
      }
    }
    const check = validateResubmitReplacementLine(line, prevAction)
    if (!check.ok) {
      message.value = t(check.errorKey || 'courseRegistration.student.resubmitModifyFailed', check.errorParams || {})
      return
    }
    resubmitModalRef.value?.applyModifiedLine(resubmitModifyIndex.value, {
      ...line,
      action: prevAction,
      section: line.sectionCode,
      room: line.venue,
      lecturer: line.lecturers,
    })
    resubmitPicking.value = false
    resubmitModifyIndex.value = -1
    resubmitRetakeType.value = ''
    resubmitModifyItem.value = null
    coursePickerVisible.value = false
    retakeFocusOriginal.value = null
    return
  }

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

/**
 * 表单行 → 申请 items 行（保留 sourceType 供学分投影识别必修）
 * @param {'Drop'|'Add'|'Retake'} action 申请类型
 * @param {object} line 表单课行
 */
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
    /** 必修识别：与课表 required 同源，勿丢 */
    sourceType: line.sourceType || '',
    schoolElectiveCategory: line.schoolElectiveCategory || '',
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
      // 换组锁按学期：原上课学期须随原组行传入
      const originalAcademicSession = String(
        course.originalAcademicSession || course.academicSession || '',
      ).trim()
      return {
        courseId: course.id,
        courseCode: course.code,
        sectionCode,
        originalAcademicSession,
        academicSession: originalAcademicSession,
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
  if (rejectedApplicationBlocked.value) {
    formError.value = t('courseRegistration.student.secondApplicationRejectedBlocked')
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

  // GE/ME：学期要求 + 因修未修合计上限（学分条分母同合计，base 固定）
  const catchUp = electiveCatchUpCredits.value
  for (const kind of ['GE', 'ME']) {
    const deficit = kind === 'GE' ? catchUp.ge : catchUp.me
    if (
      wouldExceedAddDropElectiveTermCap(termCreditStripBaseline.value, {
        dropCourses: dropLines,
        addCourses: creditAddLines,
        kind,
        deficit,
      })
    ) {
      const params = resolveAddDropElectiveTermCapMessageParams(
        termCreditStripBaseline.value,
        {
          dropCourses: dropLines,
          addCourses: creditAddLines,
          kind,
          deficit,
        },
      )
      formError.value = t(
        'courseRegistration.student.termCreditCapExceeded',
        params || { type: kind },
      )
      return
    }
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
    editingDraftId.value = ''
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
    // 草稿编辑提交：转正并移除原草稿
    draftId: editingDraftId.value || undefined,
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
                      <button
                        v-if="app.status === 'Draft'"
                        type="button"
                        class="link-btn"
                        @click="openDraftForEdit(app)"
                      >
                        {{ t('courseRegistration.student.editDraftAction') }}
                      </button>
                      <template v-else>
                        <button type="button" class="link-btn" @click="openDetail(app)">
                          {{ t('common.details') }}
                        </button>
                        <button
                          v-if="canResubmitAddDropApplication(app)"
                          type="button"
                          class="link-btn"
                          @click="openResubmit(app)"
                        >
                          {{ t('courseRegistration.student.resubmitAction') }}
                        </button>
                      </template>
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
                    <span
                      class="status-badge"
                      :class="addDropStudentListStatusBadgeClass(app)"
                    >
                      {{ statusLabel(app) }}
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
            :term-catch-up-credits="electiveCatchUpCredits"
            :situation-catch-up-credits="situationCatchUpDisplay"
            :term-credit-strip-baseline="termCreditStripBaseline"
            :drop-pool-credits-total="dropPoolCreditsTotal"
            :term-credit-max="termCreditMax"
            :term-current-credits="pendingAdjustedTermCredits"
            :bypass-credit-max="creditMaxBypass"
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
          <!-- 增量 x：课程预览在底栏左侧，与取消/提交同一行 -->
          <button
            type="button"
            class="btn btn-default adddrop-modal-preview-btn"
            :disabled="submitting"
            @click="openApplicationSchedulePreview"
          >
            {{ t('courseRegistration.student.applicationSchedulePreviewButton') }}
          </button>
          <div class="modal-actions__right">
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
    </div>

    <AddDropCoursePickerModal
      :visible="coursePickerVisible"
      :action="coursePickerAction"
      :multiple="coursePickerMultiple"
      :subtitle-override="resubmitPickerSubtitle"
      :term-credit-gate="activeTermCreditGate"
      :courses="courseOptions"
      :selected-id="
        resubmitPicking
          ? resubmitModifyItem?.courseId || resubmitModifyItem?.courseCode || ''
          : pickingFor === 'drop'
            ? form.dropCourseId
            : pickingFor === 'add'
              ? form.addCourseId
              : form.courseId
      "
      :selected-section-id="
        resubmitPicking
          ? resubmitModifyItem?.sectionId || ''
          : pickingFor === 'drop'
            ? form.dropSectionId
            : pickingFor === 'add'
              ? form.addSectionId
              : form.sectionId
      "
      :schedule-baseline="scheduleBaseline"
      :credit-bars="termCreditBars"
      :credit-groups="pickerCreditGroups"
      :term-credit-strip-baseline="activeTermCreditStripBaseline"
      :credit-strip-anchor="resubmitCreditStripAnchor"
      :hide-drop-credit-summary="resubmitPicking && pickingFor === 'drop'"
      :validate-confirm="resubmitPicking ? validateCoursePickerConfirm : null"
      :plan-remaining="planRemaining"
      :preselected-lines="
        resubmitPicking
          ? resubmitPickerPreselectedLines
          : pickingFor === 'drop'
            ? form.dropLines || []
            : pickingFor === 'retake'
              ? form.retakeLines || []
              : form.addLines || []
      "
      :allow-future-mandatory="allowFutureMandatory"
      :allow-future-elective="allowFutureElective"
      :future-elective-config="futureElectiveConfig"
      :academic-session="
        resubmitPicking
          ? resubmitApp?.academicSession || form.academicSession || defaultAcademicSession
          : form.academicSession || defaultAcademicSession
      "
      :core-section-switch-sections="coreSectionSwitchSections"
      :core-section-switch-allow-all="coreSectionSwitchAllowAll"
      :elective-catch-up-credits="electiveCatchUpCredits"
      :origin-section-lines="originSectionLinesForPicker"
      :locked-course-type-tab="pickerLockedCourseTypeTab"
      :retake-type="
        resubmitPicking && pickingFor === 'retake'
          ? resubmitRetakeType || resubmitApp?.retakeType || ''
          : pickingFor === 'retake' ||
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

    <ApplicationDetailDrawer
      :visible="applicationScheduleDrawerVisible"
      :title="t('courseRegistration.student.applicationSchedulePreviewTitle')"
      :person-line="schedulePersonLine"
      elevate
      @close="applicationScheduleDrawerVisible = false"
    >
      <StudentSchedulePreviewPanel
        embedded
        legend-mode="addDropPreview"
        :schedule="applicationSchedulePreviewSlots"
      />
      <template #footer>
        <!-- 增量 ai：左 tip 条（徽章+蓝底加粗），右关闭 -->
        <div class="application-schedule-preview-footer">
          <p class="application-schedule-preview-footer__tip" role="note">
            <span class="application-schedule-preview-footer__badge">{{
              t('courseRegistration.student.scheduleUntimedTipBadge')
            }}</span>
            <span class="application-schedule-preview-footer__text">{{
              t('courseRegistration.student.applicationSchedulePreviewFooterHint')
            }}</span>
          </p>
          <button
            type="button"
            class="btn btn-primary"
            @click="applicationScheduleDrawerVisible = false"
          >
            {{ t('common.close') }}
          </button>
        </div>
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

    <!-- 申请窗取消：是否存入草稿 -->
    <ConfirmDialog
      :visible="draftSavePromptVisible"
      :title="t('courseRegistration.student.draftSaveConfirmTitle')"
      :message="t('courseRegistration.student.draftSaveConfirmMessage')"
      :confirm-text="t('courseRegistration.student.draftSaveConfirmYes')"
      :cancel-text="t('courseRegistration.student.draftSaveConfirmNo')"
      confirm-variant="primary"
      :z-index="1300"
      @confirm="confirmSaveDraft"
      @cancel="discardFormAndClose"
    />

    <AddDropResubmitModal
      ref="resubmitModalRef"
      :visible="!!resubmitApp"
      :application="resubmitApp"
      @close="closeResubmit"
      @modify-line="onResubmitModifyLine"
      @submit="onResubmitSubmit"
    />
  </StudentPageShell>
</template>

<style scoped>
/* 增量 ai：申请课程预览底栏 tip 条 + 右关闭（对齐 schedule-untimed-tip） */
.application-schedule-preview-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.application-schedule-preview-footer__tip {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 8px 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  font-size: 12px;
  line-height: 1.5;
  color: #1e40af;
  text-align: left;
}

.application-schedule-preview-footer__badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.application-schedule-preview-footer__text {
  flex: 1;
  min-width: 0;
  font-weight: 600;
}

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

/* 与表单内说明块紧凑口径一致（增量 w） */
.cr-adddrop-modal :deep(.cr-callout) {
  margin: 0 0 8px;
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
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 24px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.cr-adddrop-modal .modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.cr-adddrop-modal .adddrop-modal-preview-btn {
  flex: 0 0 auto;
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
