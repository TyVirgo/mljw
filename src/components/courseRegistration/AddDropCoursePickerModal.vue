<script setup>
/**
 * 加退选课：按课程分组展平选择（对齐在线选课主表粒度）
 */
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  courseTypeOptions,
  normalizeRegistrationType,
} from '../../data/courseRegistration/registrationTypes.js'
import {
  formatUnifiedCourseCategoryLabel,
  unifiedCourseCategoryFilterOptions,
  courseMatchesUnifiedCategoryFilter,
  resolveUnifiedCourseCategoryCode,
} from '../../data/courseRegistration/unifiedCourseCategory.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import {
  displayClassTimeVenueLines,
  displayWeekRange,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import {
  getSectionMeetingsConflictInfo,
  buildBaselineSlotsFromCourseLike,
} from '../../data/courseRegistration/addDropSectionConflict.js'
import { buildHardScheduleConflictResult } from '../../data/courseRegistration/studentRegistrationScheduleConflict.js'
import { checkTermCategoryCreditCapForCourse } from '../../data/courseRegistration/studentRegistrationContext.js'
import {
  estimateCourseFee,
  boostPlanRemainingFromDrops,
  consumePlanRemaining,
} from '../../data/courseRegistration/addDropFeeRates.js'
import { resolveSchoolElectiveCategory } from '../../data/courseRegistration/selectableCourses.js'
import { studentConfirmedCourses } from '../../data/courseRegistration/studentRegistrationStore.js'
import { formatGradeToZh } from '../../data/courseRegistration/studentTranscript.js'
import {
  evaluateTermCreditGate,
  projectAddDropCreditGroups,
  creditGroupsHaveTermCategoryOver,
  listTermOverCategoryKeys,
  buildAddDropTermCreditStrip,
  buildFixedSituationCatchUpFromBaseline,
  wouldExceedAddDropElectiveTermCap,
  resolveAddDropElectiveTermCapMessageParams,
  resolveAddDropSituationCreditGaps,
  isMandatoryAddDropCourse,
} from '../../data/courseRegistration/addDropMultiItems.js'
import AddDropTermCreditStrip from './AddDropTermCreditStrip.vue'
import {
  attachCourseLevelRowSpans,
  attachSelectionGroupColumnSpans,
  courseRowKey,
  paginateSectionRowsByCourse,
} from '../../data/courseRegistration/sectionTableRowSpans.js'
import {
  isCoreOtherSectionReaddBlocked,
  mergeCoreLockOriginLines,
} from '../../data/courseRegistration/addDropFormSections.js'
import {
  getSelectionGroupDisplayLines,
  selectionGroupToneIndex,
  sortSectionRowsBySelectionGroup,
} from '../../data/courseRegistration/courseSelectionGroups.js'
import {
  GE_VIRTUAL_SELECTION_GROUP,
  ME_ORDINARY_VIRTUAL_SELECTION_GROUP,
  isRetakeCourseBlockedByPassingGrade,
} from '../../data/courseRegistration/retakeSubstitutePool.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  /** 'Add' | 'Drop' | 'Retake' | 'AddDrop' */
  action: { type: String, default: 'Add' },
  courses: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
  selectedSectionId: { type: String, default: '' },
  /** 多选（加/退/重修默认开） */
  multiple: { type: Boolean, default: true },
  /** 覆盖副标题（如重提换课提示） */
  subtitleOverride: { type: String, default: '' },
  /**
   * 学期学分帽闸门
   * { currentCredits, creditMax, dropLines, addOnlyLines, retakeLines, addLines, bypassCreditMax }
   * addOnlyLines/retakeLines 供三方联动；addLines 为两者合并（兼容）
   */
  termCreditGate: { type: Object, default: null },
  scheduleBaseline: { type: Array, default: () => [] },
  creditBars: { type: Array, default: () => [] },
  creditGroups: { type: Array, default: () => [] },
  categoryBars: { type: Array, default: () => [] },
  /** 学分条基线（含毕业 GE/ME + 学期 + 必修） */
  termCreditStripBaseline: { type: Object, default: null },
  planRemaining: { type: Object, default: () => ({}) },
  /** 再次打开时预勾选（表单 dropLines / addLines） */
  preselectedLines: { type: Array, default: () => [] },
  /** 白名单：允许添加未来学期必修课申请 */
  allowFutureMandatory: { type: Boolean, default: false },
  /** 白名单：允许添加未来学期选修课申请 */
  allowFutureElective: { type: Boolean, default: false },
  /** @type {{ geCredits?: number, meCredits?: number } | null} */
  futureElectiveConfig: { type: Object, default: null },
  /** 当前申请学年学期（GE/ME 上课学年学期列兜底） */
  academicSession: { type: String, default: '' },
  /** 本学期必修允许换组的课+教学班白名单 */
  coreSectionSwitchSections: { type: Array, default: () => [] },
  /** 白名单换组空清单：放行该生可选范围内全部换组 */
  coreSectionSwitchAllowAll: { type: Boolean, default: false },
  /** 重修无拟退时：在读必修原分组（课+组） */
  originSectionLines: { type: Array, default: () => [] },
  /**
   * 外层已定类别：锁定内部 tab（core|ge|me），不展示 Tab
   * 空字符串表示不锁定（普通加课仍用手点 Tab；重修/加课重提可锁定）
   */
  lockedCourseTypeTab: { type: String, default: '' },
  /** 重修类型：failed | improve_grade；用于组内已及格禁选 */
  retakeType: { type: String, default: '' },
  /**
   * 因修未修额度（与蓝底 tip 同源）：计入 GE/ME 可选合计上限与学分条分母
   * { ge: number, me: number, mandatory?: number }
   */
  electiveCatchUpCredits: {
    type: Object,
    default: () => ({ ge: 0, me: 0, mandatory: 0 }),
  },
  /**
   * 增量 bl：重提换课 — 隐藏退课红字学分摘要
   */
  hideDropCreditSummary: { type: Boolean, default: false },
  /**
   * 增量 bl：重提外层学分锚点；勾选未变时直接展示
   */
  creditStripAnchor: { type: Object, default: null },
  /**
   * 增量 bl：确认前校验；返回 { ok, errorKey?, errorParams? }
   */
  validateConfirm: { type: Function, default: null },
})

const emit = defineEmits(['close', 'confirm'])

const { t, isZh } = useAppI18n()

const codeDraft = ref('')
const nameDraft = ref('')
const creditsDraft = ref('')
/** @deprecated 已合并为 courseCategory；保留字段避免旧调用报错 */
const schoolElectiveDraft = ref('')
const typeDraft = ref('')
const courseCategoryDraft = ref('')
const codeApplied = ref('')
const nameApplied = ref('')
const creditsApplied = ref('')
const schoolElectiveApplied = ref('')
const typeApplied = ref('')
const courseCategoryApplied = ref('')
/** 搜索筛选区收放；默认展开 */
const searchExpanded = ref(true)
const pickedRowKey = ref('')
const pickedRowKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const excessConfirmVisible = ref(false)
const pendingConfirmPayload = ref(null)
const selectAllEl = ref(null)
/** 增量 bl：选课器内确认错误（避免只写父页无感） */
const confirmErrorText = ref('')

const isDrop = computed(() => props.action === 'Drop')
const isRetakeMode = computed(() => props.action === 'Retake')
const isAddMode = computed(() => props.action === 'Add' || props.action === 'AddDrop')
const useMultiple = computed(() => Boolean(props.multiple))
const showAddEligibilityTip = computed(() => isAddMode.value)
const showRetakeSubstituteTip = computed(() => isRetakeMode.value)
const addEligibilityTipKey = computed(() => {
  if (props.allowFutureMandatory && props.allowFutureElective) {
    return 'courseRegistration.student.pickerAddEligibilityTipWithFutureBoth'
  }
  if (props.allowFutureElective) {
    return 'courseRegistration.student.pickerAddEligibilityTipWithFutureElective'
  }
  if (props.allowFutureMandatory) {
    return 'courseRegistration.student.pickerAddEligibilityTipWithFuture'
  }
  return 'courseRegistration.student.pickerAddEligibilityTip'
})

const addEligibilityTipParams = computed(() => ({
  ge: props.futureElectiveConfig?.geCredits ?? '—',
  me: props.futureElectiveConfig?.meCredits ?? '—',
}))
/** 加课类别 Tab；锁定类别时隐藏（重修/加课重提）；退课不加 */
const showCourseTypeTabs = computed(() => {
  if (!isAddMode.value) return false
  const locked = String(props.lockedCourseTypeTab || '').trim()
  // 增量 ay：加课重提按课性锁定时不展示多 Tab
  if (locked === 'core' || locked === 'ge' || locked === 'me') return false
  return true
})
const COURSE_TYPE_TABS = [
  { key: 'core', type: 'CORE', labelKey: 'courseRegistration.student.retakePickerTab.core' },
  { key: 'ge', type: 'GE', labelKey: 'courseRegistration.student.retakePickerTab.ge' },
  { key: 'me', type: 'ME', labelKey: 'courseRegistration.student.retakePickerTab.me' },
]
const courseTypeTab = ref('core')
/** 有效类别：有锁定则用锁定（重修/加课重提），否则用手选 Tab */
const effectiveCourseTypeTab = computed(() => {
  const locked = String(props.lockedCourseTypeTab || '').trim()
  if (locked === 'core' || locked === 'ge' || locked === 'me') {
    return locked
  }
  return courseTypeTab.value
})
const courseTypeTabs = computed(() =>
  COURSE_TYPE_TABS.map((tab) => ({
    key: tab.key,
    type: tab.type,
    label: t(tab.labelKey),
  })),
)
function selectCourseTypeTab(key) {
  if (courseTypeTab.value === key) return
  courseTypeTab.value = key
  currentPage.value = 1
  // Tab 已按类型分流，清空次级「课程类型」筛选以免空表
  typeDraft.value = ''
  typeApplied.value = ''
}
/**
 * 行是否属于当前类别 Tab
 * 增量 bc：必修含 MANDATORY；ME/GE 用精确前缀，勿误伤 MANDATORY
 * 增量 bf：统一课性兜底，避免 type 缺失时锁 Tab 漏滤
 * @param {object} row
 * @param {string} wantType CORE|GE|ME
 */
function rowMatchesCourseTypeTab(row, wantType) {
  const type = String(row.type || row.course?.type || '').toUpperCase()
  const source = String(row.sourceType || row.course?.sourceType || '').toLowerCase()
  if (wantType === 'CORE') {
    if (
      type === 'CORE' ||
      type === 'MANDATORY' ||
      type === 'REQUIRED' ||
      source === 'required'
    ) {
      return true
    }
  } else if (wantType === 'GE') {
    if (type === 'GE' || /^GE(\d|-)/.test(type)) return true
  } else if (wantType === 'ME') {
    if (type === 'ME' || /^ME(\d|-)/.test(type)) return true
  } else if (type === wantType) {
    return true
  }
  // 统一课性兜底（与 resolveLockedCourseTypeTab 同源）
  const unified = String(
    resolveUnifiedCourseCategoryCode({
      type: row.type || row.course?.type,
      sourceType: row.sourceType || row.course?.sourceType,
      schoolElectiveCategory:
        row.schoolElectiveCategory || row.course?.schoolElectiveCategory,
      code: row.code || row.course?.code,
      id: row.courseId || row.course?.id,
    }) || '',
  ).toUpperCase()
  if (wantType === 'CORE') return unified === 'REQUIRED'
  if (wantType === 'GE') return unified.startsWith('GE')
  if (wantType === 'ME') return unified.startsWith('ME')
  return false
}
/** 学分要求条：加/退/加退/重修/重修关联（同源七列条） */
const showCreditProgress = computed(
  () =>
    (props.action === 'Add' ||
      props.action === 'AddDrop' ||
      props.action === 'Drop' ||
      props.action === 'Retake' ||
      props.action === 'RetakeDrop') &&
    (Boolean(props.termCreditStripBaseline) ||
      Boolean(props.creditStripAnchor) ||
      props.creditGroups.length > 0 ||
      props.creditBars.length > 0),
)

/** 表单拟退（不含本弹框勾选） */
function formDropLinesFromGate() {
  return props.termCreditGate?.dropLines || []
}

/** 表单拟加（仅加课；无拆分字段时回落空，避免与合并 addLines 双计） */
function formAddOnlyLinesFromGate() {
  const gate = props.termCreditGate
  if (!gate) return []
  if (Array.isArray(gate.addOnlyLines)) return gate.addOnlyLines
  return []
}

/** 表单拟重修 */
function formRetakeLinesFromGate() {
  const gate = props.termCreditGate
  if (!gate) return []
  if (Array.isArray(gate.retakeLines)) return gate.retakeLines
  return []
}

/**
 * 另一侧「加课类」行：加课弹框→表单重修；重修弹框→表单加课；退课弹框→加∪重修
 */
function otherSideAddCreditLines() {
  if (isDrop.value) {
    return [...formAddOnlyLinesFromGate(), ...formRetakeLinesFromGate()]
  }
  if (isRetakeMode.value) return formAddOnlyLinesFromGate()
  return formRetakeLinesFromGate()
}

/**
 * 表单行 → 学分条课程载荷
 * @param {object} line
 */
function coursePayloadFromFormLine(line) {
  if (!line) return null
  return {
    ...line,
    type: line.type || line.course?.type,
    sourceType: line.sourceType || line.course?.sourceType || '',
    credits: line.credits ?? line.course?.credits,
    code: line.courseCode || line.code || line.course?.code,
    courseCode: line.courseCode || line.code || line.course?.courseCode,
    id: line.courseId || line.id || line.course?.id,
    courseId: line.courseId || line.id || line.course?.id,
  }
}

/** 弹窗勾选 → 拟退/拟加课程（含 sourceType；加/退/重修三方联动投影） */
const pickerProjectionCourses = computed(() => {
  const selectedCourses = selectedRows.value.map((r) => ({
    ...(r.course || {}),
    type: r.type || r.course?.type,
    sourceType: r.sourceType || r.course?.sourceType || '',
    credits: r.credits ?? r.course?.credits,
    code: r.code || r.course?.code,
    courseCode: r.code || r.course?.code || r.course?.courseCode,
    id: r.course?.id || r.course?.courseId,
    courseId: r.course?.courseId || r.course?.id,
    batchId: r.course?.batchId,
    schoolElectiveCategory:
      r.schoolElectiveCategory || r.course?.schoolElectiveCategory || '',
  }))
  // 本侧用勾选替换表单同侧；另一侧始终读表单
  if (isDrop.value) {
    return {
      dropCourses: selectedCourses,
      addCourses: otherSideAddCreditLines(),
    }
  }
  // 重修：本窗课表往往按原课锁定，勾选无法覆盖其它 Tab 已选 → 保留匹配不到的表单重修行
  if (isRetakeMode.value) {
    const preservedFormRetakes = formRetakeLinesFromGate()
      .filter((line) => !flattenedRows.value.some((row) => rowMatchesLine(row, line)))
      .map(coursePayloadFromFormLine)
      .filter(Boolean)
    return {
      dropCourses: formDropLinesFromGate(),
      addCourses: [
        ...otherSideAddCreditLines(),
        ...preservedFormRetakes,
        ...selectedCourses,
      ],
    }
  }
  return {
    dropCourses: formDropLinesFromGate(),
    addCourses: [...otherSideAddCreditLines(), ...selectedCourses],
  }
})

/**
 * 勾选是否仍等于预选（重提刚打开、驳回未换成功）
 * 增量 bl
 */
const selectionMatchesPreselected = computed(() => {
  const lines = props.preselectedLines || []
  if (!lines.length) return false
  const selected = selectedRows.value
  if (selected.length !== lines.length) return false
  return lines.every((line) => selected.some((row) => rowMatchesLine(row, line)))
})

const termCreditStrip = computed(() => {
  // 增量 bl：勾选未变时用重提外层锚点，保证一进来与外层一致
  if (props.creditStripAnchor && selectionMatchesPreselected.value) {
    return props.creditStripAnchor
  }
  if (!props.termCreditStripBaseline) return props.creditStripAnchor || null
  const { dropCourses, addCourses } = pickerProjectionCourses.value
  return buildAddDropTermCreditStrip({
    ...props.termCreditStripBaseline,
    dropCourses,
    addCourses,
  })
})

/**
 * 硬拦用因修未修：含拟退、不含本窗拟加（避免与学期 current 双计）
 */
const liveElectiveCatchUpCredits = computed(() => {
  if (!props.termCreditStripBaseline) {
    return {
      ge: Number(props.electiveCatchUpCredits?.ge) || 0,
      me: Number(props.electiveCatchUpCredits?.me) || 0,
      mandatory: Number(props.electiveCatchUpCredits?.mandatory) || 0,
    }
  }
  const dropCourses = isDrop.value
    ? pickerProjectionCourses.value.dropCourses
    : formDropLinesFromGate()
  const stripAfterDrops = buildAddDropTermCreditStrip({
    ...props.termCreditStripBaseline,
    dropCourses,
    addCourses: otherSideAddCreditLines(),
  })
  const gaps = resolveAddDropSituationCreditGaps(stripAfterDrops)
  return { ge: gaps.ge, me: gaps.me, mandatory: gaps.mandatory }
})

/**
 * 蓝底 tip：学期基线快照，不随本窗勾选变（增量 ah：矩阵未修行跟 live strip）
 */
const situationCatchUpDisplay = computed(() => {
  if (!props.termCreditStripBaseline) {
    return {
      ge: Number(props.electiveCatchUpCredits?.ge) || 0,
      me: Number(props.electiveCatchUpCredits?.me) || 0,
      mandatory: Number(props.electiveCatchUpCredits?.mandatory) || 0,
    }
  }
  return buildFixedSituationCatchUpFromBaseline(props.termCreditStripBaseline)
})

/** @param {'GE'|'ME'} kind */
function catchUpDeficitForKind(kind) {
  return kind === 'GE'
    ? Number(liveElectiveCatchUpCredits.value.ge) || 0
    : Number(liveElectiveCatchUpCredits.value.me) || 0
}

const creditDisplayGroups = computed(() => {
  let baseline = []
  if (props.creditGroups.length) {
    baseline = props.creditGroups.filter((g) => g?.total)
  } else if (props.creditBars.length) {
    baseline = [
      {
        key: 'legacy',
        total: null,
        totals: props.creditBars,
        categories: props.categoryBars,
      },
    ]
  }
  if (!baseline.length) return []
  const { dropCourses, addCourses } = pickerProjectionCourses.value
  return projectAddDropCreditGroups(baseline, { dropCourses, addCourses })
})

const scheduleLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const creditFilterOptions = computed(() => {
  const set = new Set()
  for (const course of props.courses || []) {
    const c = Number(course.credits)
    if (Number.isFinite(c) && c > 0) set.add(c)
  }
  return [...set].sort((a, b) => a - b)
})

/** 退课/重修筛选含必修课（CORE） */
const courseTypeFilterOptions = computed(() => {
  if (!isDrop.value && !isRetakeMode.value) return courseTypeOptions
  return [
    ...courseTypeOptions,
    {
      value: 'CORE',
      labelKey: 'courseRegistration.types.CORE.label',
      descKey: 'courseRegistration.types.CORE.courseDesc',
    },
  ]
})

/** 退课不展示名额列；加课（含必修）与重修展示；不可选写明详细原因 */
const showSeatOrRetakeColumn = computed(() => !isDrop.value)
/** 加课/重修必修：末列为「是否可选」（无名额数字） */
const useCoreSelectableColumn = computed(
  () => showSeatOrRetakeColumn.value && effectiveCourseTypeTab.value === 'core',
)
const showRetakeHistoryColumn = computed(() => isRetakeMode.value)
/** 加课必修 Tab：原上课学期（类别后） */
const showOriginalSessionColumn = computed(
  () => isAddMode.value && effectiveCourseTypeTab.value === 'core',
)
/** 加课 GE/ME Tab：上课学年学期（名额列前，始终显示） */
const showOfferingSessionColumn = computed(() => {
  if (!isAddMode.value) return false
  const tab = effectiveCourseTypeTab.value
  return tab === 'ge' || tab === 'me'
})
/**
 * 是否为「虚拟大组」（GE / ME选课）：不占课程组列、不挂蓝黄底
 * @param {object|null|undefined} group
 */
function isVirtualRetakeSelectionGroup(group) {
  const id = group?.id
  return (
    id === GE_VIRTUAL_SELECTION_GROUP.id || id === ME_ORDINARY_VIRTUAL_SELECTION_GROUP.id
  )
}

/**
 * ME 课程组列：加课/重修且存在真实 n 选 m 组时展示（虚拟大组不展示）
 */
const showSelectionGroupColumn = computed(() => {
  if (isDrop.value || effectiveCourseTypeTab.value !== 'me') return false
  return flattenedRows.value.some(
    (row) => row.selectionGroup && !isVirtualRetakeSelectionGroup(row.selectionGroup),
  )
})
const tableColspan = computed(() => {
  let n = 11
  if (showSeatOrRetakeColumn.value) n += 1
  if (showRetakeHistoryColumn.value) n += 1
  if (showOriginalSessionColumn.value) n += 1
  if (showOfferingSessionColumn.value) n += 1
  if (showSelectionGroupColumn.value) n += 1
  return n
})

/** 加退选课器：必修演示名额约 5（不改课库源数据） */
function isCoreLikeCourse(course) {
  const type = normalizeRegistrationType(course?.type) || String(course?.type || '').toUpperCase()
  return type === 'CORE' || course?.sourceType === 'required'
}

function addDropCoreSeatParts(rowKey) {
  const capacity = 5
  let h = 0
  const s = String(rowKey || '')
  for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * (i + 1)) % 6
  const remaining = h
  return { capacity, remaining, enrolled: capacity - remaining }
}

function sectionRowsForCourse(course) {
  const sections = Array.isArray(course.sections) ? course.sections : []
  // 重修展开全部分组（对齐在线选课课程分组列）
  const pickSections = sections
  const selectionGroup = course.selectionGroup || null
  const scaleCore = !isDrop.value && isCoreLikeCourse(course)
  if (pickSections.length) {
    return pickSections.map((section) => {
      const rowKey = section.id || `${course.id || course.code}::${section.code}`
      let capacity =
        Number(section.capacity) ||
        Number(course.totalCapacity) ||
        0
      let enrolled = Number(section.enrolled) || 0
      let remaining = Math.max(0, capacity - enrolled)
      if (scaleCore) {
        const scaled = addDropCoreSeatParts(rowKey)
        capacity = scaled.capacity
        enrolled = scaled.enrolled
        remaining = scaled.remaining
      }
      return {
        rowKey,
        course,
        section: { ...section, capacity, enrolled },
        selectionGroup,
        code: course.code,
        name: course.name,
        credits: course.credits,
        type: course.type,
        sourceType: course.sourceType || '',
        schoolElectiveCategory:
          course.schoolElectiveCategory || resolveSchoolElectiveCategory(course) || '',
        originalAcademicSession: course.originalAcademicSession || '',
        offeringAcademicSession: course.offeringAcademicSession || '',
        futureSession: Boolean(course.futureSession),
        fromEnrolled: course.fromEnrolled,
        groupMemberAlreadyTaken: Boolean(course.groupMemberAlreadyTaken),
        // 重提换课：本单已同意/不通过占用课
        resubmitSiblingLocked: Boolean(course.resubmitSiblingLocked),
        remainingCapacity: remaining,
      }
    })
  }
  const code = course.sectionCode || '01'
  const remRaw = Number(course.remainingCapacity)
  let totalCap =
    Number(course.totalCapacity) ||
    (Number.isFinite(remRaw) ? remRaw : 0) ||
    0
  let remaining = Number.isFinite(remRaw) ? Math.max(0, remRaw) : totalCap
  let enrolled = Math.max(0, totalCap - remaining)
  const rowKey = course.sectionId || `enrolled-${course.code || course.id}-${code}`
  if (scaleCore) {
    const scaled = addDropCoreSeatParts(rowKey)
    totalCap = scaled.capacity
    remaining = scaled.remaining
    enrolled = scaled.enrolled
  }
  const section = {
    id: rowKey,
    code,
    name: course.sectionName || '',
    time: course.time || course.classTime || '',
    room: course.room || course.venue || '',
    lecturer: course.lecturer || course.lecturers || '',
    weekRange: course.weekRange || '1-18',
    enrolled,
    capacity: totalCap,
  }
  return [
    {
      rowKey: section.id,
      course,
      section,
      selectionGroup,
      code: course.code,
      name: course.name,
      credits: course.credits,
      type: course.type,
      sourceType: course.sourceType || '',
      schoolElectiveCategory:
        course.schoolElectiveCategory || resolveSchoolElectiveCategory(course) || '',
      originalAcademicSession: course.originalAcademicSession || '',
      offeringAcademicSession: course.offeringAcademicSession || '',
      futureSession: Boolean(course.futureSession),
      fromEnrolled: course.fromEnrolled,
      groupMemberAlreadyTaken: Boolean(course.groupMemberAlreadyTaken),
      // 重提换课：本单已同意/不通过占用课
      resubmitSiblingLocked: Boolean(course.resubmitSiblingLocked),
      remainingCapacity: remaining,
    },
  ]
}

function originalSessionLabel(row) {
  const v = String(row?.originalAcademicSession || row?.course?.originalAcademicSession || '').trim()
  return v || '—'
}

/**
 * GE/ME 上课学年学期：开课学期 → 未来计划学期 → 当前申请学期
 * @param {object} row
 * @returns {string}
 */
function offeringSessionOf(row) {
  const direct = String(
    row?.offeringAcademicSession || row?.course?.offeringAcademicSession || '',
  ).trim()
  if (direct) return direct
  if (row?.futureSession || row?.course?.futureSession) {
    const planned = String(
      row?.originalAcademicSession || row?.course?.originalAcademicSession || '',
    ).trim()
    if (planned) return planned
  }
  return String(props.academicSession || '').trim()
}

/** @param {object} row */
function offeringSessionLabel(row) {
  return offeringSessionOf(row) || '—'
}

const flattenedRows = computed(() => {
  const list = []
  for (const course of props.courses || []) {
    list.push(...sectionRowsForCourse(course))
  }
  // 加课/重修：有真实课程组时按组排序，便于组视图连排
  const groups = []
  const seen = new Set()
  for (const row of list) {
    const g = row.selectionGroup
    if (g?.id && !isVirtualRetakeSelectionGroup(g) && !seen.has(g.id)) {
      seen.add(g.id)
      groups.push(g)
    }
  }
  return groups.length ? sortSectionRowsBySelectionGroup(list, groups) : list
})

const filteredRows = computed(() => {
  let list = [...flattenedRows.value]
  // 增量 bf：有锁定或展示 Tab 时均按课性过滤（重修锁 Tab 时 showCourseTypeTabs=false 也要滤）
  const locked = String(props.lockedCourseTypeTab || '').trim()
  const filterByType =
    locked === 'core' ||
    locked === 'ge' ||
    locked === 'me' ||
    showCourseTypeTabs.value
  if (filterByType) {
    const tab = COURSE_TYPE_TABS.find((x) => x.key === effectiveCourseTypeTab.value)
    const want = tab?.type || 'CORE'
    list = list.filter((row) => rowMatchesCourseTypeTab(row, want))
  }
  const codeKw = codeApplied.value.trim().toLowerCase()
  const nameKw = nameApplied.value.trim().toLowerCase()
  if (codeKw) {
    list = list.filter((row) =>
      String(row.code || '')
        .toLowerCase()
        .includes(codeKw),
    )
  }
  if (nameKw) {
    list = list.filter((row) =>
      String(row.name || '')
        .toLowerCase()
        .includes(nameKw),
    )
  }
  if (creditsApplied.value) {
    const target = Number(creditsApplied.value)
    list = list.filter((row) => Number(row.credits) === target)
  }
  if (courseCategoryApplied.value) {
    list = list.filter((row) =>
      courseMatchesUnifiedCategoryFilter(
        {
          type: row.type || row.course?.type,
          schoolElectiveCategory:
            row.schoolElectiveCategory || row.course?.schoolElectiveCategory,
          code: row.code || row.course?.code,
          id: row.courseId || row.course?.id,
        },
        courseCategoryApplied.value,
      ),
    )
  }
  // 有真实课程组：筛后仍按组连排，避免上课学期/rowKey 重排把同组拆散
  if (showSelectionGroupColumn.value) {
    const groups = []
    const seen = new Set()
    for (const row of list) {
      const g = row.selectionGroup
      if (g?.id && !isVirtualRetakeSelectionGroup(g) && !seen.has(g.id)) {
        seen.add(g.id)
        groups.push(g)
      }
    }
    if (groups.length) return sortSectionRowsBySelectionGroup(list, groups)
    return list
  }
  // GE/ME 无组：按上课学年学期字符串升序（同学期内保持原相对顺序）
  if (showOfferingSessionColumn.value) {
    list.sort((a, b) => {
      const sessionCompare = offeringSessionOf(a).localeCompare(offeringSessionOf(b))
      if (sessionCompare !== 0) return sessionCompare
      return String(a.rowKey || '').localeCompare(String(b.rowKey || ''))
    })
  }
  return list
})

/**
 * 分页 + 课级/课程组列合并
 * 有 ME 课程组时：groupAware 分页不拆组；课程组列跨组内多课 rowspan（对齐在线选课）
 */
const pagedTableResult = computed(() => {
  const list = filteredRows.value
  if (showSelectionGroupColumn.value) {
    const result = paginateSectionRowsByCourse(list, currentPage.value, pageSize.value, {
      groupAware: true,
    })
    return {
      rows: attachSelectionGroupColumnSpans(result.rows),
      total: result.totalCourses,
    }
  }
  const start = (currentPage.value - 1) * pageSize.value
  const slice = list.slice(start, start + pageSize.value)
  const rowsForSpan = slice.map((row) => ({
    ...row,
    course: row.course || row,
  }))
  let firstCourseIndex = 0
  const seen = new Set()
  for (let i = 0; i < start; i += 1) {
    const key = courseRowKey(list[i]?.course || list[i])
    if (!key || seen.has(key)) continue
    seen.add(key)
    firstCourseIndex += 1
  }
  return {
    rows: attachCourseLevelRowSpans(rowsForSpan, firstCourseIndex),
    total: list.length,
  }
})

const paginatedRows = computed(() => pagedTableResult.value.rows)

/** 分页器 total：有课程组时按课程门数（与 groupAware 分页一致） */
const tablePageTotal = computed(() => pagedTableResult.value.total)

function spanCell(row, field) {
  return row?._span?.[field] || { show: true, rowspan: 1 }
}

/**
 * @deprecated 加课/重修统一走 attachSelectionGroupColumnSpans；保留兼容旧调用
 * @param {object[]} rows
 */
function mergeRetakeSelectionGroupSpans(rows) {
  return attachSelectionGroupColumnSpans(rows)
}

/** 全局已选行（跨 Tab；学分条 / 已选门数 / 确认均同源） */
const selectedRow = computed(
  () => flattenedRows.value.find((r) => r.rowKey === pickedRowKey.value) || null,
)

const selectedRows = computed(() => {
  if (!useMultiple.value) return selectedRow.value ? [selectedRow.value] : []
  const byKey = new Map(flattenedRows.value.map((r) => [r.rowKey, r]))
  return pickedRowKeys.value.map((k) => byKey.get(k)).filter(Boolean)
})

/** 退课勾选行学分合计（选择说明用；学分条仍为退后剩余） */
const selectedDropCreditsSum = computed(() =>
  selectedRows.value.reduce((sum, row) => sum + (Number(row.credits) || 0), 0),
)

/**
 * 退课前学分 = 当前可退池全部课程学分总和（与表内可勾选行学分列之和一致）
 * 不再用学分条 termCreditStripBaseline（GE+ME+必修已选），避免池大于条时「退课合计>退课前」
 * @returns {number}
 */
const dropMetaOriginalTermTotal = computed(() => {
  if (!isDrop.value) return 0
  return (props.courses || []).reduce((sum, course) => sum + (Number(course.credits) || 0), 0)
})

/*
 * @deprecated 旧「退课前」=学分条学期基线总分（geCurrent+meCurrent+mandatorySelected）；
 * 增量 al 改为可退池 courses 学分总和后不再参与摘要，保留对照排查，勿删。
 * function dropMetaOriginalFromTermStripBaseline() {
 *   const baseline = props.termCreditStripBaseline
 *   if (!baseline) return 0
 *   return (Number(baseline.geCurrent)||0)+(Number(baseline.meCurrent)||0)+(Number(baseline.mandatorySelected)||0)
 * }
 */

/** 还剩合计 = 可退池总 − 拟退合计（不小于 0） */
const dropMetaRemainTermTotal = computed(() =>
  Math.max(0, dropMetaOriginalTermTotal.value - selectedDropCreditsSum.value),
)

function termGateForRow(row) {
  // 加课 / 重修统一受学期帽约束；非白名单超帽阻断，白名单可超（不收费）
  if (isDrop.value || !props.termCreditGate) {
    return { over: false, blocked: false, net: 0, excess: 0 }
  }
  const gate = props.termCreditGate
  // 本侧：勾选集合（预勾即表单同侧，避免双计）；另一侧：表单加/重修
  const alreadyPicked = selectedRows.value
    .filter((r) => r.rowKey !== row.rowKey)
    .map((r) => ({ credits: Number(r.credits) || 0 }))
  return evaluateTermCreditGate({
    currentCredits: gate.currentCredits,
    creditMax: gate.creditMax,
    dropLines: formDropLinesFromGate(),
    addLines: [...otherSideAddCreditLines(), ...alreadyPicked],
    candidateCredits: Number(row.credits) || 0,
    bypassCreditMax: Boolean(gate.bypassCreditMax),
    creditBypassExtra: gate.creditBypassExtra,
  })
}

/** 选课弹窗计费动作：组合类型归并为 Add / Retake */
function feeActionForEstimate() {
  if (props.action === 'Retake' || props.action === 'RetakeDrop') return 'Retake'
  if (props.action === 'Add' || props.action === 'AddDrop' || props.action === 'AddDropRetake') {
    return 'Add'
  }
  if (props.action === 'AddRetake') return 'Add'
  return props.action
}

/** 毕业剩余：有拟退课即先释放占用再计费（加退表单打开加课槽时 action 可能为 Add） */
function planRemainingForFee() {
  const drops = props.termCreditGate?.dropLines || []
  if (!isDrop.value && drops.length) {
    return boostPlanRemainingFromDrops(props.planRemaining, drops)
  }
  return props.planRemaining
}

const selectedFeeEstimate = computed(() => {
  const rows = selectedRows.value
  if (!rows.length) return null
  if (isDrop.value) return null
  // 加课依赖学分条上下文；重修整门计费不依赖学分条
  if (!isRetakeMode.value && !showCreditProgress.value) return null
  const feeAction = feeActionForEstimate()
  if (feeAction !== 'Add' && feeAction !== 'Retake') return null
  let remaining = planRemainingForFee()
  let billable = 0
  for (const row of rows) {
    const fee = estimateCourseFee({
      action: feeAction,
      course: row.course,
      planRemaining: remaining,
      eligibilitySource: row.course?.eligibilitySource || '',
    })
    billable += Number(fee?.billableCredits) || 0
    remaining = consumePlanRemaining(remaining, row.course, fee.billableCredits)
  }
  return { billableCredits: billable }
})

const showFooterExcessHint = computed(() => {
  // 加课：毕业类别超额提示；重修走整门计费文案
  if (isRetakeMode.value) return false
  return Number(selectedFeeEstimate.value?.billableCredits) > 0
})

const showFooterRetakeFeeHint = computed(() => {
  if (!isRetakeMode.value) return false
  return Number(selectedFeeEstimate.value?.billableCredits) > 0
})

const showFooterTermOverBypassHint = computed(() => {
  if (isDrop.value || !props.termCreditGate?.bypassCreditMax) return false
  if (!selectedRows.value.length) return false
  return creditGroupsHaveTermCategoryOver(creditDisplayGroups.value)
})

const TERM_OVER_CATEGORY_LABEL_KEYS = {
  humanities: 'courseRegistration.student.pickerTermOverCategory.humanities',
  business: 'courseRegistration.student.pickerTermOverCategory.business',
  science: 'courseRegistration.student.pickerTermOverCategory.science',
  aiOpen: 'courseRegistration.student.pickerTermOverCategory.aiOpen',
  group4of3: 'courseRegistration.student.pickerTermOverCategory.group4of3',
  group3of2: 'courseRegistration.student.pickerTermOverCategory.group3of2',
  group2of1: 'courseRegistration.student.pickerTermOverCategory.group2of1',
  ordinary: 'courseRegistration.student.pickerTermOverCategory.ordinary',
  geTotal: 'courseRegistration.student.pickerTermOverCategory.geTotal',
  meTotal: 'courseRegistration.student.pickerTermOverCategory.meTotal',
}

const whitelistTermOverFooterText = computed(() => {
  const keys = listTermOverCategoryKeys(creditDisplayGroups.value)
  const labels = keys.map((k) => {
    const i18nKey = TERM_OVER_CATEGORY_LABEL_KEYS[k]
    if (!i18nKey) return k
    const label = t(i18nKey)
    return typeof label === 'string' && label !== i18nKey ? label : k
  }).filter(Boolean)
  if (!labels.length) {
    return t('courseRegistration.student.pickerWhitelistTermOverFooter')
  }
  if (labels.length === 1) {
    return t('courseRegistration.student.pickerWhitelistTermOverCategory', {
      category: labels[0],
    })
  }
  return t('courseRegistration.student.pickerWhitelistTermOverCategories', {
    categories: labels.join(isZh.value ? '、' : ', '),
  })
})

const actionTypeLabel = computed(() => {
  const key = `courseRegistration.approval.type.${props.action}`
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : props.action
})

const canConfirm = computed(() => {
  const rows = selectedRows.value
  // 退课允许空确认 → 清空清单
  if (!rows.length) return isDrop.value
  // 增量 bp：无外部校验时禁用行不可确认；有 validateConfirm 时交由外部裁决
  if (typeof props.validateConfirm === 'function') return rows.length > 0
  return rows.every((row) => !isRowDisabled(row))
})

function rowMatchesLine(row, line) {
  if (!row || !line) return false
  const sid = line.sectionId || ''
  if (sid && (row.section?.id === sid || row.rowKey === sid)) return true
  const courseOk =
    (line.courseId &&
      (row.course?.id === line.courseId ||
        row.course?.code === line.courseId ||
        row.code === line.courseId)) ||
    (line.courseCode && (row.course?.code === line.courseCode || row.code === line.courseCode))
  if (!courseOk) return false
  const secCode = line.sectionCode || ''
  if (!secCode) return true
  return String(row.section?.code || '') === String(secCode)
}

function resolvePreselectedKeys() {
  const lines = props.preselectedLines || []
  if (!lines.length) return []
  const keys = []
  for (const line of lines) {
    const hit = flattenedRows.value.find((row) => rowMatchesLine(row, line))
    if (hit && !keys.includes(hit.rowKey)) keys.push(hit.rowKey)
  }
  return keys
}

/** 全选候选：当前筛选下可选，或已勾选（便于半选态） */
const selectAllCandidates = computed(() => {
  if (!useMultiple.value) return []
  return filteredRows.value.filter((row) => !isRowDisabled(row) || isRowChecked(row))
})

/** 无一可选行且无已勾选时，表头全选置灰；重修本窗单课，禁用全选 */
const selectAllEnabled = computed(() => {
  if (isRetakeMode.value) return false
  return selectAllCandidates.value.length > 0
})

const allSelected = computed(() => {
  const list = selectAllCandidates.value
  if (!list.length) return false
  return list.every((row) => isRowChecked(row))
})

const someSelected = computed(() => {
  const list = selectAllCandidates.value
  if (!list.length) return false
  const n = list.filter((row) => isRowChecked(row)).length
  return n > 0 && n < list.length
})

watch(someSelected, (v) => {
  if (selectAllEl.value) selectAllEl.value.indeterminate = v
})

watch(allSelected, () => {
  if (selectAllEl.value) selectAllEl.value.indeterminate = someSelected.value
})

function toggleSelectAll(checked) {
  if (!useMultiple.value || !selectAllEnabled.value) return
  const filteredKeySet = new Set(filteredRows.value.map((r) => r.rowKey))
  if (!checked) {
    pickedRowKeys.value = pickedRowKeys.value.filter((k) => !filteredKeySet.has(k))
    pickedRowKey.value = pickedRowKeys.value[pickedRowKeys.value.length - 1] || ''
    return
  }
  const next = pickedRowKeys.value.filter((k) => !filteredKeySet.has(k))
  const gate = props.termCreditGate
  const rowByKey = new Map(flattenedRows.value.map((r) => [r.rowKey, r]))
  for (const row of filteredRows.value) {
    if (
      conflictInfo(row).conflict ||
      isRowFull(row) ||
      isRowBlockedByCoreSectionLock(row)
    ) {
      continue
    }
    // 同课单分组：next 已含同课号则跳过
    if (!isDrop.value && !row.fromEnrolled) {
      const code = String(row.code || row.course?.code || '')
      if (
        code &&
        next.some((k) => {
          const r = rowByKey.get(k)
          return r && String(r.code || r.course?.code || '') === code
        })
      ) {
        continue
      }
    }
    // GE/ME：学期要求 + 因修未修合计上限（全选累计投影）
    if (!isDrop.value && props.termCreditStripBaseline) {
      const kind = normalizeRegistrationType(row.type || row.course?.type)
      if (kind === 'GE' || kind === 'ME') {
        const addCourses = [
          ...otherSideAddCreditLines(),
          ...next.map((k) => rowByKey.get(k)).filter(Boolean).map(coursePayloadFromRow),
          coursePayloadFromRow(row),
        ]
        const deficit = catchUpDeficitForKind(kind)
        if (
          wouldExceedAddDropElectiveTermCap(props.termCreditStripBaseline, {
            dropCourses: formDropLinesFromGate(),
            addCourses,
            kind,
            deficit,
          })
        ) {
          continue
        }
      }
    }
    if (isDrop.value || !gate) {
      next.push(row.rowKey)
      continue
    }
    const already = next
      .map((k) => rowByKey.get(k))
      .filter(Boolean)
      .map((r) => ({ credits: Number(r.credits) || 0 }))
    const g = evaluateTermCreditGate({
      currentCredits: gate.currentCredits,
      creditMax: gate.creditMax,
      dropLines: formDropLinesFromGate(),
      addLines: [...otherSideAddCreditLines(), ...already],
      candidateCredits: Number(row.credits) || 0,
      bypassCreditMax: Boolean(gate.bypassCreditMax),
      creditBypassExtra: gate.creditBypassExtra,
    })
    if (!g.blocked) next.push(row.rowKey)
  }
  pickedRowKeys.value = [...new Set(next)]
  pickedRowKey.value = pickedRowKeys.value[pickedRowKeys.value.length - 1] || ''
}

const excessConfirmMessage = computed(() => {
  const payload = pendingConfirmPayload.value
  if (!payload?.fee?.billableCredits) return ''
  const selections = Array.isArray(payload.selections) ? payload.selections : []
  if (isRetakeMode.value) {
    return t('courseRegistration.student.pickerRetakeFeeConfirm', {
      count: selections.length || 1,
      billable: payload.fee.billableCredits,
    })
  }
  const first = selections[0] || payload
  return t('courseRegistration.student.pickerExcessCreditConfirm', {
    excess: payload.fee.billableCredits,
    course: first.course?.code || '',
    credits: first.course?.credits || 0,
  })
})

const feeConfirmTitle = computed(() =>
  isRetakeMode.value
    ? t('courseRegistration.student.pickerRetakeFeeTitle')
    : t('courseRegistration.student.pickerExcessCreditTitle'),
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    codeDraft.value = ''
    nameDraft.value = ''
    creditsDraft.value = ''
    schoolElectiveDraft.value = ''
    typeDraft.value = ''
    courseCategoryDraft.value = ''
    courseCategoryApplied.value = ''
    codeApplied.value = ''
    nameApplied.value = ''
    creditsApplied.value = ''
    schoolElectiveApplied.value = ''
    typeApplied.value = ''
    // 有锁定（重修/加课重提）用锁定；普通加课默认必修 Tab
    const locked = String(props.lockedCourseTypeTab || '').trim()
    courseTypeTab.value =
      locked === 'core' || locked === 'ge' || locked === 'me' ? locked : 'core'
    searchExpanded.value = true
    currentPage.value = 1
    pageSize.value = 20
    excessConfirmVisible.value = false
    pendingConfirmPayload.value = null
    pickedRowKeys.value = []
    pickedRowKey.value = ''

    const preKeys = resolvePreselectedKeys()
    if (preKeys.length) {
      pickedRowKeys.value = preKeys
      pickedRowKey.value = preKeys[preKeys.length - 1] || ''
      return
    }
    if (props.selectedSectionId) {
      const hit = flattenedRows.value.find((r) => r.section?.id === props.selectedSectionId)
      if (hit) {
        pickedRowKey.value = hit.rowKey
        pickedRowKeys.value = [hit.rowKey]
      }
      return
    }
    if (props.selectedId) {
      const hit = flattenedRows.value.find(
        (r) => r.course?.id === props.selectedId || r.course?.code === props.selectedId,
      )
      if (hit) {
        pickedRowKey.value = hit.rowKey
        pickedRowKeys.value = [hit.rowKey]
      }
    }
  },
)

watch([filteredRows, tablePageTotal, pageSize], () => {
  const maxPage = Math.max(1, Math.ceil(tablePageTotal.value / pageSize.value))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

function handleSearch() {
  codeApplied.value = codeDraft.value
  nameApplied.value = nameDraft.value
  creditsApplied.value = creditsDraft.value
  courseCategoryApplied.value = courseCategoryDraft.value
  schoolElectiveApplied.value = ''
  typeApplied.value = ''
  currentPage.value = 1
}

function handleReset() {
  codeDraft.value = ''
  nameDraft.value = ''
  creditsDraft.value = ''
  schoolElectiveDraft.value = ''
  typeDraft.value = ''
  courseCategoryDraft.value = ''
  courseCategoryApplied.value = ''
  codeApplied.value = ''
  nameApplied.value = ''
  creditsApplied.value = ''
  schoolElectiveApplied.value = ''
  typeApplied.value = ''
  currentPage.value = 1
}

/**
 * 表单同侧已确认行（重修弹窗→retakeLines；加课弹窗→addOnlyLines）
 * 二次打开同意图时用于互检，避免仅预览才暴露冲突
 * @returns {object[]}
 */
function sameSideFormLinesForConflict() {
  if (isDrop.value) return []
  if (isRetakeMode.value) return formRetakeLinesFromGate()
  return formAddOnlyLinesFromGate()
}

/**
 * 本窗其它已勾选 + 表单另一侧 + 表单同侧已确认 → 冲突基线（与预览占用组一致）
 * @param {object} excludeRow 当前行不参与
 * @returns {object[]}
 */
function peerAddRetakeBaselineSlots(excludeRow) {
  const excludeRowKey = excludeRow?.rowKey || ''
  const slots = []
  for (const peer of selectedRows.value) {
    if (!peer || peer.rowKey === excludeRowKey) continue
    const courseCode = peer.code || peer.course?.code || peer.course?.courseCode || ''
    slots.push(
      ...buildBaselineSlotsFromCourseLike({
        ...(peer.course || {}),
        courseCode,
        code: courseCode,
        section: peer.section,
        time: peer.section?.time || peer.time,
        meetings: peer.section?.meetings || peer.meetings,
        sourceType: peer.sourceType || peer.course?.sourceType || '',
      }),
    )
  }
  for (const line of otherSideAddCreditLines()) {
    slots.push(...buildBaselineSlotsFromCourseLike(line))
  }
  // 同侧已确认：重修₂ 须与重修₁ 比；加课二次勾选同理
  for (const line of sameSideFormLinesForConflict()) {
    if (excludeRow && rowMatchesLine(excludeRow, line)) continue
    slots.push(...buildBaselineSlotsFromCourseLike(line))
  }
  return slots
}

/**
 * 加课/重修时间冲突：已选基线（已排除拟退）∪ 本单其它加/重修（含表单同侧已确认）
 * @param {object} row
 */
function conflictInfo(row) {
  if (isDrop.value || row.fromEnrolled) return { conflict: false }
  const baseline = [
    ...(props.scheduleBaseline || []),
    ...peerAddRetakeBaselineSlots(row),
  ]
  return getSectionMeetingsConflictInfo(row.section, baseline)
}

/**
 * 学生端必修不因名额已满拦截（可超额申请；审批仍可见名额）
 * @param {object} row
 */
function isCoreSeatExempt(row) {
  if (isDrop.value) return false
  return isCoreLikeCourse(row.course || row)
}

function isRowFull(row) {
  if (isDrop.value || row.fromEnrolled) return false
  // 必修：学生申请不拦名额
  if (isCoreSeatExempt(row)) return false
  const rem = Number(row.remainingCapacity)
  return Number.isFinite(rem) && rem <= 0
}

/** 行 → 学分条投影用课程载荷 */
function coursePayloadFromRow(row) {
  return {
    ...(row.course || {}),
    type: row.type || row.course?.type,
    sourceType: row.sourceType || row.course?.sourceType || '',
    credits: row.credits ?? row.course?.credits,
    code: row.code || row.course?.code,
    courseCode: row.code || row.course?.code || row.course?.courseCode,
    id: row.course?.id || row.course?.courseId,
    courseId: row.course?.courseId || row.course?.id,
    batchId: row.course?.batchId,
    schoolElectiveCategory:
      row.schoolElectiveCategory || row.course?.schoolElectiveCategory || '',
  }
}

/**
 * GE/ME 合计上限硬拦：projected > 学期要求 + 因修未修
 * @param {object} row
 */
function isRowElectiveTermCapBlocked(row) {
  if (isDrop.value || row.fromEnrolled || row.groupMemberAlreadyTaken) return false
  if (!props.termCreditStripBaseline) return false
  const kind = normalizeRegistrationType(row.type || row.course?.type)
  if (kind !== 'GE' && kind !== 'ME') return false
  const others = selectedRows.value
    .filter((r) => r.rowKey !== row.rowKey)
    .map(coursePayloadFromRow)
  const deficit = catchUpDeficitForKind(kind)
  return wouldExceedAddDropElectiveTermCap(props.termCreditStripBaseline, {
    dropCourses: formDropLinesFromGate(),
    addCourses: [...otherSideAddCreditLines(), ...others, coursePayloadFromRow(row)],
    kind,
    deficit,
  })
}

/** @deprecated 改用 isRowElectiveTermCapBlocked */
function isRowGeTermCapBlocked(row) {
  return isRowElectiveTermCapBlocked(row)
}

function isRowCreditBlocked(row) {
  return Boolean(termGateForRow(row).blocked) || isRowElectiveTermCapBlocked(row)
}

/**
 * 是否因「已选兄弟行」置灰
 * - 重修（不及格/提分）：已选任一门后，其余课与分组全部置灰（一门原课只修一门）
 * - 加课：同一课程只允许选一个课程分组
 * @param {object} row
 */
function isRowDisabledBySibling(row) {
  if (isDrop.value || row.fromEnrolled) return false
  if (isRowChecked(row)) return false
  if (isRetakeMode.value) {
    // 增量 ba：单选（radio）可点换——已选一门时不禁选其它行
    if (!useMultiple.value) return false
    return pickedRowKeys.value.some((key) => key && key !== row.rowKey)
  }
  const code = String(row.code || row.course?.code || '')
  if (!code) return false
  return flattenedRows.value.some(
    (r) =>
      r.rowKey !== row.rowKey &&
      String(r.code || r.course?.code || '') === code &&
      isRowChecked(r),
  )
}

/**
 * 加课 ME 课程组门数帽（3选2 / 4选3 / 2选1）：
 * 已确认 ∪ 本窗已勾选 达 minPick 后，组内其它未选课置灰
 * @param {object} row
 */
function isRowBlockedByMeGroupPickCap(row) {
  if (isDrop.value || isRetakeMode.value) return false
  if (row.fromEnrolled || row.groupMemberAlreadyTaken || isRowChecked(row)) return false
  const group = row.selectionGroup
  if (!group?.id || isVirtualRetakeSelectionGroup(group)) return false
  const minPick = Number(group.minPick) || 1
  const codeSet = new Set(
    (group.courseCodes || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean),
  )
  if (codeSet.size < 2) return false

  const taken = new Set()
  for (const item of studentConfirmedCourses.value || []) {
    const code = String(item.courseCode || item.code || '')
      .trim()
      .toUpperCase()
    if (code && codeSet.has(code)) taken.add(code)
  }
  for (const r of flattenedRows.value) {
    if (!r.groupMemberAlreadyTaken) continue
    const code = String(r.code || r.course?.code || '')
      .trim()
      .toUpperCase()
    if (code && codeSet.has(code)) taken.add(code)
  }
  for (const r of selectedRows.value) {
    const code = String(r.code || r.course?.code || '')
      .trim()
      .toUpperCase()
    if (code && codeSet.has(code)) taken.add(code)
  }
  const nextCode = String(row.code || row.course?.code || '')
    .trim()
    .toUpperCase()
  if (nextCode && taken.has(nextCode)) return false
  return taken.size >= minPick
}

/**
 * 重修：是否因已选「另一门课」而置灰（用于 tip；同课其它分组仍用同课文案）
 * @param {object} row
 */
function isRowDisabledByOtherRetakeCourse(row) {
  if (!isRetakeMode.value || isRowChecked(row)) return false
  // 增量 ba：单选模式不因预勾/已选一门而判定「已选其它课」
  if (!useMultiple.value) return false
  if (!pickedRowKeys.value.some((key) => key && key !== row.rowKey)) return false
  const code = String(row.code || row.course?.code || '')
  const picked = flattenedRows.value.find((r) => pickedRowKeys.value.includes(r.rowKey))
  const pickedCode = String(picked?.code || picked?.course?.code || '')
  if (!code || !pickedCode) return true
  return code !== pickedCode
}

/** 加课行 → 课+组线 */
function rowAsCourseSectionLine(row) {
  return {
    courseId: row.course?.id || row.id,
    courseCode: row.code || row.course?.code,
    sectionId: row.section?.id,
    sectionCode: row.section?.code,
    type: row.course?.type || row.type,
    sourceType: row.course?.sourceType || row.sourceType,
    course: row.course,
  }
}

function originLinesFromEligibleCourses() {
  const lines = []
  for (const course of props.courses || []) {
    if (!isMandatoryAddDropCourse(course)) continue
    const sectionCode = String(course.originalSectionCode || '').trim()
    if (!sectionCode) continue
    // originalAcademicSession：换组锁按早先/当前学期区分
    const originalAcademicSession = String(
      course.originalAcademicSession || course.academicSession || '',
    ).trim()
    lines.push({
      courseId: course.id,
      courseCode: course.code,
      sectionCode,
      originalAcademicSession,
      academicSession: originalAcademicSession,
      type: course.type,
      sourceType: course.sourceType || 'required',
    })
  }
  return lines
}

/**
 * 换组锁原组：拟退 ∪ 资格种子（同课拟退优先）
 * 曾：有任意拟退则整表只用 dropLines，导致 CHEM 等种子原组丢失
 */
function originLinesForCoreLock() {
  const drops = props.termCreditGate?.dropLines || []
  // 重修已不加换组锁；保留 enrolled 回退供旧调用路径
  if (isRetakeMode.value || props.action === 'Retake' || props.action === 'RetakeDrop') {
    const enrolled = props.originSectionLines || []
    if (enrolled.length) return enrolled
    return originLinesFromEligibleCourses()
  }
  if (props.action === 'Add' || props.action === 'AddDrop') {
    return mergeCoreLockOriginLines(drops, originLinesFromEligibleCourses())
  }
  return []
}

/**
 * 本学期必修换组锁：仅加课 / 加退课；重修不限制
 * 默认只许同组加回；白名单命中目标组可换组
 */
/**
 * 不及格重修：同组内最新成绩已及格的课，全部分组不可选
 * @param {object} row
 */
function isRowBlockedByPassedRetakeCourse(row) {
  if (!isRetakeMode.value) return false
  if (props.retakeType !== 'failed') return false
  const course = row?.course || row
  return isRetakeCourseBlockedByPassingGrade({
    ...course,
    retakeHistory: course?.retakeHistory || row?.retakeHistory || [],
  })
}

function isRowBlockedByCoreSectionLock(row) {
  if (isDrop.value || row.fromEnrolled) return false
  // 重修 / 重修（退课）不施加换组锁
  if (props.action !== 'Add' && props.action !== 'AddDrop') {
    return false
  }
  return isCoreOtherSectionReaddBlocked(
    rowAsCourseSectionLine(row),
    originLinesForCoreLock(),
    props.coreSectionSwitchSections,
    Boolean(props.coreSectionSwitchAllowAll),
    String(props.academicSession || '').trim(),
  )
}

/**
 * 重提换课：是否本单其它已同意/不通过行占用
 * @param {object} row
 * @returns {boolean}
 */
function isRowBlockedByResubmitSibling(row) {
  return Boolean(row?.resubmitSiblingLocked || row?.course?.resubmitSiblingLocked)
}

function isRowDisabled(row) {
  // 课程组内已选课：加课池仅展示置灰，不可勾选
  if (row.groupMemberAlreadyTaken) return true
  // 重提：本单已同意/不通过占用课不可再选
  if (isRowBlockedByResubmitSibling(row)) return true
  return (
    conflictInfo(row).conflict ||
    isRowFull(row) ||
    isRowCreditBlocked(row) ||
    isRowDisabledBySibling(row) ||
    isRowBlockedByMeGroupPickCap(row) ||
    isRowBlockedByCoreSectionLock(row) ||
    isRowBlockedByPassedRetakeCourse(row)
  )
}

function isRowChecked(row) {
  if (useMultiple.value) return pickedRowKeys.value.includes(row.rowKey)
  return pickedRowKey.value === row.rowKey
}

/**
 * 是否匹配打开时的预选行（修改/重提换课）
 * @param {object} row
 */
function isPreselectedRow(row) {
  return (props.preselectedLines || []).some((line) => rowMatchesLine(row, line))
}

/**
 * 是否允许与该行交互（增量 bp：置灰默认不可新选）
 * - 已勾选：可取消
 * - 未禁用：可选
 * - 禁用：仅预选行可再勾回
 * @param {object} row
 */
function canInteractRow(row) {
  if (isRowChecked(row)) return true
  if (!isRowDisabled(row)) return true
  return isPreselectedRow(row)
}

/**
 * 勾选/取消一行
 * 增量 bp：收窄 bl 软选——置灰不可新选；预选行可取消/勾回
 * @param {object} row
 */
function pickRow(row) {
  const checked = isRowChecked(row)
  confirmErrorText.value = ''
  if (!canInteractRow(row)) return
  if (!useMultiple.value) {
    if (checked) {
      pickedRowKeys.value = []
      pickedRowKey.value = ''
    } else {
      pickedRowKeys.value = [row.rowKey]
      pickedRowKey.value = row.rowKey
    }
    return
  }
  if (isRowDisabled(row) && !checked) return
  const set = new Set(pickedRowKeys.value)
  if (set.has(row.rowKey)) set.delete(row.rowKey)
  else set.add(row.rowKey)
  pickedRowKeys.value = [...set]
  pickedRowKey.value = pickedRowKeys.value[pickedRowKeys.value.length - 1] || ''
}

/**
 * radio/checkbox 点击：单选再点已选项时 native 不触发 change，需在 click 清空
 * @param {object} row
 * @param {Event} event
 */
function onPickControlClick(row, event) {
  if (!canInteractRow(row) && !isRowChecked(row)) {
    event?.preventDefault?.()
    return
  }
  if (!useMultiple.value && isRowChecked(row)) {
    event?.preventDefault?.()
    pickedRowKeys.value = []
    pickedRowKey.value = ''
    confirmErrorText.value = ''
  }
}

/**
 * 统一课程类别
 * @param {object} row
 */
function courseCategoryLabel(row) {
  const course = row.course || row
  return formatUnifiedCourseCategoryLabel(
    {
      type: row.type || course.type,
      schoolElectiveCategory:
        row.schoolElectiveCategory || course.schoolElectiveCategory,
      code: row.code || course.code,
      id: row.courseId || course.id,
    },
    t,
  )
}

function sectionLabel(row) {
  return formatCourseSectionName(row.section, t)
}

function weekLabel(row) {
  return displayWeekRange(row.section) || '—'
}

function lecturerLabel(row) {
  return row.section?.lecturer || row.course?.lecturer || '—'
}

function timeVenueLines(row) {
  return displayClassTimeVenueLines(row.section, scheduleLocale.value)
}

/**
 * 曾修列：课级履历（不跟教学班）；有成绩只出成绩文案，无履历时模板才显示「—」
 * @param {object} row
 * @returns {string[]}
 */
function retakeHistoryLines(row) {
  const course = row?.course || row
  const lines = []
  const all = course?.retakeHistory || row?.retakeHistory || []
  for (const r of all) {
    const session = String(r.academicSession || '').trim()
    const gradeZh = formatGradeToZh(r)
    const line = [session, gradeZh].filter(Boolean).join(' ')
    if (line) lines.push(line)
  }
  return lines
}

function selectionGroupDisplayLines(group) {
  return getSelectionGroupDisplayLines(group, isZh.value)
}

function selectionGroupRowClass(group) {
  if (!showSelectionGroupColumn.value || !group) return undefined
  // GE / ME选课虚拟大组：无课程组底色（对齐在线「未入 n 选 m」扁平行）
  if (isVirtualRetakeSelectionGroup(group)) return undefined
  const groups = []
  const seen = new Set()
  for (const row of flattenedRows.value) {
    const g = row.selectionGroup
    if (g?.id && !seen.has(g.id) && !isVirtualRetakeSelectionGroup(g)) {
      seen.add(g.id)
      groups.push(g)
    }
  }
  return [
    'cr-selection-group-row',
    `cr-selection-group-row--tone-${selectionGroupToneIndex(group, groups)}`,
  ]
}

function seatCapacityParts(row) {
  const remRaw = Number(row.remainingCapacity)
  const remaining = Number.isFinite(remRaw) ? Math.max(0, remRaw) : null
  let total = Number(row.section?.capacity)
  if (!Number.isFinite(total) || total <= 0) {
    total = Number(row.course?.totalCapacity)
  }
  if ((!Number.isFinite(total) || total <= 0) && remaining != null) {
    const enrolled = Number(row.section?.enrolled)
    if (Number.isFinite(enrolled) && enrolled >= 0) total = remaining + enrolled
  }
  return {
    remaining,
    total: Number.isFinite(total) && total > 0 ? total : null,
  }
}

/** 末列表头：必修「是否可选」；公选/专选「可选名额/总名额」 */
function seatColumnHeaderLabel() {
  if (useCoreSelectableColumn.value) {
    return t('courseRegistration.student.pickerSelectableHeader')
  }
  return t('courseRegistration.student.pickerSeatCapacityHeader')
}

/**
 * 末列文案：必修可选→「是」；公选/专选可选→余量/总量；不可选→原因
 * @param {object} row
 */
function seatStatusLabel(row) {
  // 增量 bk：该课已在组内选定
  if (row.groupMemberAlreadyTaken) {
    return t('courseRegistration.student.pickerStatusGroupAlreadyTaken')
  }
  if (isRowBlockedByResubmitSibling(row)) {
    return t('courseRegistration.student.pickerStatusResubmitSiblingLocked')
  }
  if (isDrop.value || row.fromEnrolled) return t('courseRegistration.student.pickerStatusEnrolled')
  // 增量 bk：组门数帽在列上用短述（含 n 选 m）
  if (isRowBlockedByMeGroupPickCap(row)) {
    const group = row.selectionGroup
    const total = Array.isArray(group?.courseCodes) ? group.courseCodes.length : 0
    const min = Number(group?.minPick) || 1
    return t('courseRegistration.student.pickerStatusGroupPickCapFull', { min, total })
  }
  if (isRowDisabled(row)) {
    return (
      seatStatusTip(row) ||
      t('courseRegistration.student.pickerStatusConflict')
    )
  }
  if (termGateForRow(row).over && props.termCreditGate?.bypassCreditMax) {
    return t('courseRegistration.student.pickerOverCreditBypassHint')
  }
  // 必修 Tab / 必修行：绿色「是」（不展示名额比）
  if (useCoreSelectableColumn.value || isCoreSeatExempt(row)) {
    return t('courseRegistration.student.pickerSelectableYes')
  }
  const { remaining, total } = seatCapacityParts(row)
  if (remaining != null && total != null) return `${remaining}/${total}`
  return t('courseRegistration.student.pickerStatusOpen')
}

/** 不可选状态完整说明（有余量/名额数字不返回 tip） */
function seatStatusTip(row) {
  if (row.groupMemberAlreadyTaken) {
    return t('courseRegistration.student.pickerStatusGroupAlreadyTaken')
  }
  if (isRowBlockedByResubmitSibling(row)) {
    return t('courseRegistration.student.pickerStatusResubmitSiblingLocked')
  }
  if (isDrop.value || row.fromEnrolled) return ''
  if (isRowDisabledByOtherRetakeCourse(row)) {
    return t('courseRegistration.student.pickerRetakeSingleCourseOnly')
  }
  if (isRowDisabledBySibling(row)) {
    return t('courseRegistration.student.pickerSameCourseSectionPicked')
  }
  if (isRowBlockedByMeGroupPickCap(row)) {
    const group = row.selectionGroup
    const total = Array.isArray(group?.courseCodes) ? group.courseCodes.length : 0
    const min = Number(group?.minPick) || 1
    return t('courseRegistration.student.meGroupPickCapReached', { min, total })
  }
  if (isRowBlockedByCoreSectionLock(row)) {
    return t('courseRegistration.student.coreMustSameSectionReadd')
  }
  if (isRowBlockedByPassedRetakeCourse(row)) {
    return t('courseRegistration.student.retakeCourseAlreadyPassed')
  }
  const conflict = conflictInfo(row)
  if (conflict.conflict) {
    const hard = buildHardScheduleConflictResult(conflict)
    return t(hard.errorKey, hard.errorParams || {})
  }
  if (isRowFull(row)) {
    const { remaining, total } = seatCapacityParts(row)
    if (remaining != null && total != null) {
      return t('courseRegistration.student.pickerStatusFullTip', {
        remaining,
        total,
      })
    }
    return t('courseRegistration.student.pickerStatusFullTipPlain')
  }
  if (isRowCreditBlocked(row)) {
    if (isRowElectiveTermCapBlocked(row) && props.termCreditStripBaseline) {
      const kind = normalizeRegistrationType(row.type || row.course?.type)
      const deficit = catchUpDeficitForKind(kind)
      const others = selectedRows.value
        .filter((r) => r.rowKey !== row.rowKey)
        .map(coursePayloadFromRow)
      const params = resolveAddDropElectiveTermCapMessageParams(
        props.termCreditStripBaseline,
        {
          dropCourses: formDropLinesFromGate(),
          addCourses: [
            ...otherSideAddCreditLines(),
            ...others,
            coursePayloadFromRow(row),
          ],
          kind,
          deficit,
        },
      )
      return t('courseRegistration.student.termCreditCapExceeded', params || {})
    }
    const categoryGate = checkTermCategoryCreditCapForCourse(row.course || row)
    if (!categoryGate.ok && categoryGate.errorKey) {
      return t(categoryGate.errorKey, categoryGate.errorParams || {})
    }
    const gate = termGateForRow(row)
    return t('courseRegistration.student.pickerStatusOverCreditTip', {
      max: props.termCreditGate?.creditMax ?? '—',
      net: gate.net ?? '—',
    })
  }
  if (termGateForRow(row).over && props.termCreditGate?.bypassCreditMax) {
    return t('courseRegistration.student.pickerOverCreditBypassHint')
  }
  return ''
}

function seatStatusClass(row) {
  if (isDrop.value || row.fromEnrolled) return ''
  // 增量 bi：「课程组内已选」与其它不可选同用红色 conflict
  if (row.groupMemberAlreadyTaken) return 'conflict'
  if (isRowBlockedByResubmitSibling(row)) return 'conflict'
  if (isRowDisabledBySibling(row)) return 'conflict'
  if (isRowBlockedByMeGroupPickCap(row)) return 'conflict'
  if (isRowBlockedByCoreSectionLock(row)) return 'conflict'
  if (isRowBlockedByPassedRetakeCourse(row)) return 'conflict'
  if (isRowCreditBlocked(row)) return 'conflict'
  if (conflictInfo(row).conflict) return 'conflict'
  if (isRowFull(row)) return 'full'
  if (termGateForRow(row).over) return 'full'
  return 'open'
}

function buildConfirmPayload(row) {
  const fee = estimateCourseFee({
    action: feeActionForEstimate(),
    course: row.course,
    planRemaining: planRemainingForFee(),
    eligibilitySource: row.course?.eligibilitySource || '',
  })
  return {
    courseId: row.course.id || row.course.code,
    course: row.course,
    section: row.section,
    fee,
  }
}

function emitConfirm(payload) {
  const selections = payload.selections || [
    { courseId: payload.courseId, course: payload.course, section: payload.section },
  ]
  const first = selections[0] || {}
  emit('confirm', {
    selections,
    courseId: first.courseId,
    course: first.course,
    section: first.section,
  })
}

/**
 * 本地确认前检查：禁用行不可提交
 * @param {object[]} selections
 * @returns {boolean}
 */
function assertSelectedRowsConfirmable(selections) {
  const rows = selectedRows.value
  const blocked = rows.find((row) => isRowDisabled(row))
  if (!blocked) return true
  confirmErrorText.value =
    seatStatusTip(blocked) ||
    seatStatusLabel(blocked) ||
    t('courseRegistration.student.pickerStatusConflict')
  return false
}

/**
 * 跑外部 validateConfirm（重提换课）
 * @param {object} payload
 * @returns {boolean}
 */
function runValidateConfirm(payload) {
  if (typeof props.validateConfirm !== 'function') return true
  const result = props.validateConfirm(payload)
  if (result?.ok !== false) return true
  const key = result.errorKey || 'courseRegistration.student.resubmitModifyFailed'
  confirmErrorText.value = t(key, result.errorParams || {})
  return false
}

function handleConfirm() {
  if (!canConfirm.value) return
  confirmErrorText.value = ''
  if (!selectedRows.value.length) {
    if (!isDrop.value) return
    const emptyPayload = { selections: [] }
    if (!runValidateConfirm(emptyPayload)) return
    emitConfirm(emptyPayload)
    return
  }
  // 无外部校验：禁用行不可提交；有 validateConfirm 时交由外部（预选勾回等）
  if (typeof props.validateConfirm !== 'function') {
    if (!assertSelectedRowsConfirmable()) return
  }
  const selections = selectedRows.value.map((row) => {
    const p = buildConfirmPayload(row)
    return { courseId: p.courseId, course: p.course, section: p.section }
  })
  const fee = selectedFeeEstimate.value
  const payload = {
    selections,
    courseId: selections[0]?.courseId,
    course: selections[0]?.course,
    section: selections[0]?.section,
    fee,
  }
  if (!runValidateConfirm(payload)) return
  const needWarn =
    props.action !== 'Drop' && Number(fee?.billableCredits) > 0
  if (needWarn) {
    pendingConfirmPayload.value = payload
    excessConfirmVisible.value = true
    return
  }
  emitConfirm(payload)
}
function handleExcessConfirm() {
  const payload = pendingConfirmPayload.value
  excessConfirmVisible.value = false
  pendingConfirmPayload.value = null
  if (payload) emitConfirm(payload)
}

function handleExcessCancel() {
  excessConfirmVisible.value = false
  pendingConfirmPayload.value = null
}

function handleClose() {
  confirmErrorText.value = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ t('courseRegistration.student.coursePickerTitle') }}</h2>
            <p class="modal-subtitle">
              <template v-if="subtitleOverride">{{ subtitleOverride }}</template>
              <template v-else>
                {{ t('courseRegistration.student.coursePickerSubtitle', { type: actionTypeLabel }) }}
                ·
                {{ t('courseRegistration.student.pickerStepCourse') }}
              </template>
            </p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <CourseRegistrationCallout v-if="showAddEligibilityTip" variant="info" class="picker-tip">
            <p>{{ t(addEligibilityTipKey, addEligibilityTipParams) }}</p>
          </CourseRegistrationCallout>
          <CourseRegistrationCallout v-else-if="showRetakeSubstituteTip" variant="info" class="picker-tip">
            <p>{{ t('courseRegistration.student.pickerRetakeSubstituteTip') }}</p>
          </CourseRegistrationCallout>

          <div class="search-bar picker-search-bar">
            <div class="search-row">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.code') }}</label>
                  <input
                    v-model="codeDraft"
                    type="text"
                    class="search-input"
                    :placeholder="t('common.pleaseInput')"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.name') }}</label>
                  <input
                    v-model="nameDraft"
                    type="text"
                    class="search-input"
                    :placeholder="t('common.pleaseInput')"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.credits') }}</label>
                  <select v-model="creditsDraft" class="search-select">
                    <option value="">{{ t('common.all') }}</option>
                    <option
                      v-for="credit in creditFilterOptions"
                      :key="credit"
                      :value="String(credit)"
                    >
                      {{ credit }}
                    </option>
                  </select>
                </div>
                <div
                  v-if="showCourseTypeTabs || searchExpanded"
                  class="search-item"
                >
                  <label>{{ t('courseRegistration.courses.category') }}</label>
                  <select v-model="courseCategoryDraft" class="search-select">
                    <option value="">{{ t('common.all') }}</option>
                    <option
                      v-for="opt in unifiedCourseCategoryFilterOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.labelKey ? t(opt.labelKey) : opt.label }}
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
                <button
                  v-if="!showCourseTypeTabs"
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
          </div>

          <div v-if="showCreditProgress" class="picker-credit-progress">
            <AddDropTermCreditStrip
              :strip="termCreditStrip"
              :term-catch-up-credits="situationCatchUpDisplay"
              :application-type="action"
            />
          </div>

          <div
            v-if="showCourseTypeTabs"
            class="picker-retake-type-tabs"
            role="tablist"
          >
            <button
              v-for="tab in courseTypeTabs"
              :key="tab.key"
              type="button"
              role="tab"
              class="picker-retake-type-tab"
              :class="{ active: courseTypeTab === tab.key }"
              :aria-selected="courseTypeTab === tab.key"
              @click="selectCourseTypeTab(tab.key)"
            >
              <span class="picker-retake-type-tab__label">{{ tab.label }}</span>
              <!-- 加课选修 Tab：第三轮规则说明（仅提示，不禁选） -->
              <span
                v-if="isAddMode && (tab.key === 'ge' || tab.key === 'me')"
                class="tip-icon"
                :title="t('courseRegistration.student.pickerElectiveTabRound3Tip')"
                :aria-label="t('courseRegistration.student.pickerElectiveTabRound3Tip')"
                tabindex="0"
                @click.stop
              >?</span>
            </button>
          </div>

          <p
            class="selection-meta"
            :class="{
              'selection-meta--drop-emphasis':
                isDrop && selectedRows.length && !hideDropCreditSummary,
            }"
          >
            <span class="selection-meta__text">
              {{
                !selectedRows.length
                  ? t('courseRegistration.student.coursePickerNone')
                  : isDrop && !hideDropCreditSummary
                    ? t('courseRegistration.student.coursePickerSelectedDropCredits', {
                        count: selectedRows.length,
                        credits: selectedDropCreditsSum,
                        original: dropMetaOriginalTermTotal,
                        remain: dropMetaRemainTermTotal,
                      })
                    : t('courseRegistration.student.coursePickerSelected', {
                        count: selectedRows.length,
                      })
              }}
            </span>
            <!-- 退课：选修退课规则 tip（仅说明；demo 仍可选选修）；重提换课隐藏红字时仍保留 tip -->
            <span
              v-if="isDrop"
              class="tip-icon tip-icon--selection-meta"
              :title="t('courseRegistration.student.coursePickerDropElectiveTip')"
              :aria-label="t('courseRegistration.student.coursePickerDropElectiveTip')"
              tabindex="0"
              @click.stop
            >?</span>
          </p>

          <div class="table-wrap" :class="{ 'table-wrap--hscroll': isRetakeMode }">
            <table
              class="data-table"
              :class="{
                'data-table--drop': isDrop,
                'data-table--fill': !isDrop && !isRetakeMode,
                'data-table--retake-hscroll': isRetakeMode,
                'data-table--has-seat': showSeatOrRetakeColumn,
              }"
            >
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      v-if="useMultiple"
                      ref="selectAllEl"
                      type="checkbox"
                      :checked="allSelected"
                      :disabled="!selectAllEnabled"
                      :aria-label="t('courseRegistration.student.pickerSelectAll')"
                      @change="toggleSelectAll($event.target.checked)"
                      @click.stop
                    />
                  </th>
                  <th class="col-serial">{{ t('common.serialNo') }}</th>
                  <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                  <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                  <th v-if="showSelectionGroupColumn" class="col-selection-group">
                    <span class="th-label-with-tip">
                      {{ t('courseRegistration.courses.selectionGroup') }}
                      <span
                        class="tip-icon"
                        :title="t('courseRegistration.courses.selectionGroupTip')"
                        :aria-label="t('courseRegistration.courses.selectionGroupTip')"
                        tabindex="0"
                      >?</span>
                    </span>
                  </th>
                  <!-- 一级（课级合并）在前 -->
                  <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                  <th class="col-category">{{ t('courseRegistration.courses.category') }}</th>
                  <th
                    v-if="showOriginalSessionColumn"
                    class="col-original-session"
                  >
                    {{ t('courseRegistration.student.pickerOriginalSessionHeader') }}
                  </th>
                  <!-- 曾修：一级（课级）末列，在课程分组等二级字段之前 -->
                  <th
                    v-if="showRetakeHistoryColumn"
                    class="col-retake-history"
                  >
                    {{ t('courseRegistration.student.pickerRetakeHistoryHeader') }}
                  </th>
                  <!-- 二级（分组分行）在后 -->
                  <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                  <th class="col-lecturer">{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th class="col-week">{{ t('courseRegistration.courses.weekRange') }}</th>
                  <th class="col-time">{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                  <th
                    v-if="showOfferingSessionColumn"
                    class="col-offering-session"
                  >
                    <span class="th-label-with-tip">
                      {{ t('courseRegistration.student.pickerOfferingSessionHeader') }}
                      <span
                        class="tip-icon"
                        :title="t('courseRegistration.student.pickerOfferingSessionTip')"
                        :aria-label="t('courseRegistration.student.pickerOfferingSessionTip')"
                        tabindex="0"
                      >?</span>
                    </span>
                  </th>
                  <th
                    v-if="showSeatOrRetakeColumn"
                    class="col-status sticky-status"
                  >
                    {{ seatColumnHeaderLabel() }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.rowKey"
                  :class="[
                    {
                      selected: isRowChecked(row),
                      // 增量 bp：不可交互 → hard disabled；可取消/勾回的预选冲突行 → soft 灰显仍可点
                      disabled: isRowDisabled(row) && !canInteractRow(row),
                      'is-soft-blocked': isRowDisabled(row) && canInteractRow(row),
                    },
                    selectionGroupRowClass(row.selectionGroup),
                  ]"
                  @click="pickRow(row)"
                >
                  <td class="col-check">
                    <input
                      v-if="useMultiple"
                      type="checkbox"
                      :checked="isRowChecked(row)"
                      :disabled="!canInteractRow(row)"
                      @click.stop="onPickControlClick(row, $event)"
                      @change="pickRow(row)"
                    />
                    <input
                      v-else
                      type="radio"
                      name="adddrop-course-pick"
                      class="pick-radio"
                      :checked="isRowChecked(row)"
                      :disabled="!canInteractRow(row)"
                      @click.stop="onPickControlClick(row, $event)"
                      @change="pickRow(row)"
                    />
                  </td>
                  <td
                    v-if="spanCell(row, 'serial')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'serial').rowspan"
                  >
                    {{ spanCell(row, 'serial').value }}
                  </td>
                  <td
                    v-if="spanCell(row, 'code')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'code').rowspan"
                  >
                    {{ row.code }}
                  </td>
                  <td
                    v-if="spanCell(row, 'name')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'name').rowspan"
                  >
                    {{ row.name }}
                  </td>
                  <td
                    v-if="showSelectionGroupColumn && spanCell(row, 'selectionGroup')?.show"
                    class="cell-selection-group"
                    :rowspan="spanCell(row, 'selectionGroup').rowspan"
                  >
                    <template
                      v-if="
                        row.selectionGroup &&
                        !isVirtualRetakeSelectionGroup(row.selectionGroup)
                      "
                    >
                      <div class="sg-title">
                        {{ selectionGroupDisplayLines(row.selectionGroup).title }}
                      </div>
                      <div
                        v-if="selectionGroupDisplayLines(row.selectionGroup).intakeLine"
                        class="sg-intake"
                      >
                        {{ selectionGroupDisplayLines(row.selectionGroup).intakeLine }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td
                    v-if="spanCell(row, 'credits')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'credits').rowspan"
                  >
                    {{ row.credits }}
                  </td>
                  <td
                    v-if="spanCell(row, 'type')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'type').rowspan"
                  >
                    {{ courseCategoryLabel(row) }}
                  </td>
                  <td
                    v-if="showOriginalSessionColumn && spanCell(row, 'originalSession')?.show"
                    class="cell-course col-original-session"
                    :rowspan="spanCell(row, 'originalSession').rowspan"
                  >
                    {{ originalSessionLabel(row) }}
                  </td>
                  <td
                    v-if="showRetakeHistoryColumn && spanCell(row, 'retakeHistory')?.show"
                    class="cell-course col-retake-history"
                    :rowspan="spanCell(row, 'retakeHistory').rowspan"
                  >
                    <template v-if="retakeHistoryLines(row).length">
                      <div
                        v-for="(line, hi) in retakeHistoryLines(row)"
                        :key="hi"
                        class="cr-retake-history-line"
                        :title="line"
                      >
                        {{ line }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td>{{ sectionLabel(row) }}</td>
                  <td>{{ lecturerLabel(row) }}</td>
                  <td>{{ weekLabel(row) }}</td>
                  <td class="cr-time-venue" :title="timeVenueLines(row).join('\n') || undefined">
                    <template v-if="timeVenueLines(row).length">
                      <div
                        v-for="(line, li) in timeVenueLines(row)"
                        :key="li"
                        class="cr-time-venue-line"
                        :title="line"
                      >
                        {{ line }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td
                    v-if="showOfferingSessionColumn"
                    class="col-offering-session"
                  >
                    {{ offeringSessionLabel(row) }}
                  </td>
                  <td
                    v-if="showSeatOrRetakeColumn"
                    class="col-status sticky-status"
                  >
                    <span
                      class="seat-status"
                      :class="seatStatusClass(row)"
                      :title="
                        isRowBlockedByCoreSectionLock(row)
                          ? undefined
                          : seatStatusTip(row) || undefined
                      "
                    >
                      <!-- 换组锁：文案与「？」同一内联流，贴句号后不独立换行 -->
                      <span
                        v-if="isRowBlockedByCoreSectionLock(row)"
                        class="seat-status-lock-inline"
                      >
                        {{ seatStatusLabel(row) }}<span
                          class="tip-icon tip-icon--inline"
                          :title="
                            t('courseRegistration.student.coreSameSectionReaddWhitelistTip')
                          "
                          :aria-label="
                            t('courseRegistration.student.coreSameSectionReaddWhitelistTip')
                          "
                          tabindex="0"
                          @click.stop
                        >?</span>
                      </span>
                      <template v-else>{{ seatStatusLabel(row) }}</template>
                    </span>
                  </td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td :colspan="tableColspan" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="tablePageTotal"
            :page-size-options="[5, 10, 20]"
          />
        </div>

        <div class="modal-footer">
          <p v-if="confirmErrorText" class="footer-confirm-error">
            {{ confirmErrorText }}
          </p>
          <p v-else-if="showFooterTermOverBypassHint" class="footer-excess-hint footer-excess-hint--whitelist">
            {{ whitelistTermOverFooterText }}
          </p>
          <p v-else-if="showFooterRetakeFeeHint" class="footer-excess-hint">
            {{ t('courseRegistration.student.pickerFooterRetakeFeeHint') }}
          </p>
          <p v-else-if="showFooterExcessHint" class="footer-excess-hint">
            {{ t('courseRegistration.student.pickerFooterExcessHint') }}
          </p>
          <button type="button" class="btn btn-default" @click="handleClose">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" :disabled="!canConfirm" @click="handleConfirm">
            {{ t('courseRegistration.student.pickerConfirm') }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="excessConfirmVisible"
      :title="feeConfirmTitle"
      :message="excessConfirmMessage"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      confirm-variant="primary"
      :z-index="1400"
      @confirm="handleExcessConfirm"
      @cancel="handleExcessCancel"
    />
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-panel {
  width: min(1320px, 100%);
  max-height: min(86vh, 900px);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
}

.modal-body {
  padding: 16px 20px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.picker-tip {
  margin-bottom: 12px;
}

.picker-tip :deep(.cr-callout) {
  font-size: 12px;
}

/* 搜索区：流式填满，放不下再换行；控件略收以减少右侧空白 */
.picker-search-bar .search-item input:not([type='checkbox']):not([type='radio']),
.picker-search-bar .search-item select,
.picker-search-bar .search-input,
.picker-search-bar .search-select {
  width: 120px;
  min-width: 96px;
}

.picker-retake-type-tabs {
  display: flex;
  gap: 0;
  margin: 0 0 12px;
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.picker-retake-type-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 14px;
  color: #6b7280;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  cursor: pointer;
}

.picker-retake-type-tab:hover {
  color: #2563eb;
}

.picker-retake-type-tab.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
}

.picker-credit-progress {
  margin: 0 0 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
}

.picker-credit-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  line-height: 1.3;
}

.picker-credit-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.picker-credit-band--ge,
.picker-credit-band--me {
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(4, minmax(0, 1fr));
  column-gap: 8px;
  row-gap: 6px;
  width: 100%;
  align-items: stretch;
}

.picker-credit-capsules--legacy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  width: 100%;
}

.cr-credit-capsule {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
  box-sizing: border-box;
  min-height: 30px;
}

.picker-credit-band--ge .cr-credit-capsule,
.picker-credit-band--me .cr-credit-capsule {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-credit-band--ge .cr-credit-capsule--total,
.picker-credit-band--me .cr-credit-capsule--total {
  justify-content: flex-start;
}

/* 兼容旧 class：未满橙 / 选满绿（与 is-pending / is-achieved 对齐） */
.cr-credit-capsule.is-short,
.cr-credit-capsule.is-pending {
  background: #fff7ed;
  color: #c2410c;
}

.cr-credit-capsule.is-met,
.cr-credit-capsule.is-achieved {
  background: #ecfdf5;
  color: #047857;
}

.cr-credit-capsule.is-over {
  background: #fef2f2;
  color: #b91c1c;
}

.cr-credit-capsule.is-neutral {
  background: #f3f4f6;
  color: #4b5563;
}

.selection-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
}

.selection-meta__text {
  min-width: 0;
}

/* 退课已勾选：整句红字强调 */
.selection-meta--drop-emphasis {
  color: #dc2626;
  font-weight: 600;
}

.selection-meta .tip-icon--selection-meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #9ca3af;
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  cursor: help;
  flex-shrink: 0;
  line-height: 1;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.table-wrap--hscroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}

/* 重修：铺满内容区；时间列吃剩余；右侧曾修/名额冻结，过窄时可横滑 */
.data-table--retake-hscroll {
  width: 100%;
  min-width: 100%;
  table-layout: fixed;
}

.data-table th,
.data-table td {
  padding: 5px 6px;
  /* 增量 bk/bl：横线加粗加深，课程组色底上仍清晰 */
  border-bottom: 1.5px solid #94a3b8;
  border-right: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table th:last-child,
.data-table td:last-child {
  border-right: none;
}

.data-table thead th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  white-space: nowrap;
}

.data-table td.cell-course[rowspan],
.data-table td.cell-selection-group[rowspan] {
  vertical-align: middle;
  border-left: 1px solid #94a3b8;
  border-right: 1px solid #94a3b8;
  border-bottom: 1.5px solid #94a3b8;
}

/* 增量 bk/bl：非合并列每行横线保证可见（组色底上） */
.data-table tbody tr.cr-selection-group-row > td:not([rowspan]) {
  border-bottom: 1.5px solid #64748b;
}

.data-table tbody tr {
  cursor: pointer;
}

/* 不叠加悬停/选中浅蓝；课程组 tone 底色保留 */
.data-table tbody tr:hover,
.data-table tbody tr.selected {
  background: transparent;
}

.data-table tbody tr.disabled {
  cursor: not-allowed;
  color: #9ca3af;
  background: #f9fafb;
}

/* 单选软禁用：灰显提示冲突/满员，仍可点选再确认校验（增量 bl） */
.data-table tbody tr.is-soft-blocked {
  color: #9ca3af;
  background: #f9fafb;
  cursor: pointer;
}

.footer-confirm-error {
  flex: 1 1 100%;
  width: 100%;
  margin: 0 0 4px;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
}

.data-table tbody tr.disabled:hover {
  background: #f9fafb;
}

.col-check {
  width: 32px;
  overflow: visible;
  text-overflow: clip;
  vertical-align: middle;
  text-align: center;
}

/* 重修/单选：与行垂直居中，避免高行内点偏下方才命中 */
.col-check .pick-radio,
.col-check input[type='radio'],
.col-check input[type='checkbox'] {
  display: inline-block;
  margin: 0;
  vertical-align: middle;
  position: relative;
  z-index: 1;
}

.col-serial {
  width: 4%;
}

.col-code {
  width: 8%;
}

.col-name {
  width: 11%;
}

.col-group {
  width: 8%;
}

.col-credits {
  width: 4%;
}

.col-category {
  width: 7%;
}

.col-type {
  width: 6%;
}

.col-lecturer {
  width: 8%;
}

.col-week {
  width: 6%;
}

.col-time {
  width: auto;
}

.col-original-session {
  width: 7%;
  white-space: nowrap;
  text-align: center;
}

.col-offering-session {
  width: 8%;
  white-space: nowrap;
  text-align: center;
}

.col-status {
  width: 10%;
  text-align: center;
  vertical-align: middle;
  white-space: normal;
}

.col-retake-history {
  width: 10%;
}

.col-selection-group {
  width: 8%;
}

/* 加课：铺满内容区，时间列吃剩余宽度 */
.data-table--fill .col-time {
  width: auto;
  min-width: 0;
}

.data-table--fill .col-name {
  width: 12%;
}

.data-table--fill .col-lecturer {
  width: 9%;
}

/* 重修：列宽重分配，消除右侧留白 */
.data-table--retake-hscroll .col-check {
  width: 2.25rem;
}

.data-table--retake-hscroll .col-serial {
  width: 3%;
}

.data-table--retake-hscroll .col-code {
  width: 7%;
}

.data-table--retake-hscroll .col-name {
  width: 11%;
}

.data-table--retake-hscroll .col-selection-group {
  width: 7%;
}

.data-table--retake-hscroll .col-group {
  width: 7%;
}

.data-table--retake-hscroll .col-credits {
  width: 3.5%;
}

.data-table--retake-hscroll .col-category {
  width: 7%;
}

.data-table--retake-hscroll .col-type {
  width: 6%;
}

.data-table--retake-hscroll .col-lecturer {
  width: 8%;
}

.data-table--retake-hscroll .col-week {
  width: 5%;
}

.data-table--retake-hscroll .col-time {
  width: auto;
  min-width: 0;
}

/* 退课无余量列：列宽自适应重分配 */
.data-table--drop {
  table-layout: fixed;
}

.data-table--drop .col-check {
  width: 2.25rem;
}

.data-table--drop .col-serial {
  width: 3%;
}

.data-table--drop .col-code {
  width: 8%;
}

.data-table--drop .col-name {
  width: 12%;
}

.data-table--drop .col-group {
  width: 9%;
}

.data-table--drop .col-credits {
  width: 4%;
}

.data-table--drop .col-category {
  width: 8%;
}

.data-table--drop .col-type {
  width: 7%;
}

.data-table--drop .col-lecturer {
  width: 9%;
}

.data-table--drop .col-week {
  width: 6%;
}

.data-table--drop .col-time {
  width: auto;
  min-width: 0;
}

.nowrap {
  white-space: nowrap;
}

.cr-time-venue {
  line-height: 1.3;
  white-space: nowrap !important;
  overflow: hidden;
}

.cr-time-venue-line {
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 1px;
}

.cr-retake-history {
  line-height: 1.3;
  white-space: nowrap;
  text-align: left;
  vertical-align: middle;
}

.cr-retake-history-line {
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-retake-history-line + .cr-retake-history-line {
  margin-top: 1px;
}

.th-label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.th-label-with-tip .tip-icon,
.picker-retake-type-tab .tip-icon,
.seat-status .tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #9ca3af;
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  cursor: help;
  flex-shrink: 0;
}

.col-selection-group {
  min-width: 7em;
}

.cell-selection-group {
  vertical-align: middle;
  line-height: 1.25;
}

.sg-title {
  font-weight: 600;
  color: #111827;
}

.sg-intake {
  font-size: 11px;
  color: #6b7280;
}

.cr-selection-group-row--tone-0 > td {
  background: #dbeafe;
}

.cr-selection-group-row--tone-1 > td {
  background: #fef9c3;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}

.seat-status {
  display: inline-block;
  text-align: center;
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
  max-width: 100%;
}

/* 锁文案 +「？」同一内联流，避免 tip 单独换行 */
.seat-status-lock-inline {
  display: inline;
}

.seat-status .tip-icon--inline {
  display: inline-flex;
  vertical-align: text-top;
  margin-left: 2px;
}

.seat-status.open {
  color: #15803d;
}

.seat-status.full,
.seat-status.conflict {
  color: #b91c1c;
}

/* 右侧冻结：名额(16em) | 曾修… */
.col-status.sticky-status,
td.sticky-status {
  position: sticky;
  right: 0;
  z-index: 2;
  width: 16em;
  min-width: 16em;
  max-width: 16em;
  background: #fff;
  text-align: center;
  vertical-align: middle;
  box-shadow: -2px 0 0 #e5e7eb;
  white-space: normal;
  padding-left: 8px;
  padding-right: 8px;
}

.col-retake-history.sticky-retake-history,
td.sticky-retake-history {
  position: sticky;
  right: 16em;
  z-index: 2;
  width: 8.5em;
  min-width: 8.5em;
  max-width: 8.5em;
  background: #fff;
  vertical-align: middle;
  box-shadow: -4px 0 8px rgba(15, 23, 42, 0.06);
}

thead .sticky-status,
thead .sticky-retake-history {
  z-index: 3;
  background: #f9fafb;
}

thead .sticky-status {
  text-align: center;
}

/* 悬停不改 sticky 底色，避免与名额列错位感 */
.data-table tbody tr:hover .sticky-status,
.data-table tbody tr.selected .sticky-status,
.data-table tbody tr:hover .sticky-retake-history,
.data-table tbody tr.selected .sticky-retake-history {
  background: #fff;
}

.data-table tbody tr.disabled .sticky-status,
.data-table tbody tr.disabled .sticky-retake-history {
  background: #f9fafb;
}

.data-table tbody tr.cr-selection-group-row--tone-0 > .sticky-status,
.data-table tbody tr.cr-selection-group-row--tone-0 > .sticky-retake-history,
.data-table tbody tr.cr-selection-group-row--tone-0:hover .sticky-status,
.data-table tbody tr.cr-selection-group-row--tone-0.selected .sticky-status,
.data-table tbody tr.cr-selection-group-row--tone-0:hover .sticky-retake-history,
.data-table tbody tr.cr-selection-group-row--tone-0.selected .sticky-retake-history {
  background: #dbeafe;
}

.data-table tbody tr.cr-selection-group-row--tone-1 > .sticky-status,
.data-table tbody tr.cr-selection-group-row--tone-1 > .sticky-retake-history,
.data-table tbody tr.cr-selection-group-row--tone-1:hover .sticky-status,
.data-table tbody tr.cr-selection-group-row--tone-1.selected .sticky-status,
.data-table tbody tr.cr-selection-group-row--tone-1:hover .sticky-retake-history,
.data-table tbody tr.cr-selection-group-row--tone-1.selected .sticky-retake-history {
  background: #fef9c3;
}

.modal-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e7eb;
}

.footer-excess-hint {
  margin: 0 auto 0 0;
  font-size: 12px;
  color: #b45309;
  line-height: 1.4;
}

.footer-excess-hint--whitelist {
  flex: 1 1 100%;
  width: 100%;
  margin: 0 0 4px;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 6px;
  font-size: 13px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}
</style>
