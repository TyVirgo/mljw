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
} from '../../data/courseRegistration/unifiedCourseCategory.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import {
  displayClassTimeVenueLines,
  displayWeekRange,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import { getSectionMeetingsConflictInfo } from '../../data/courseRegistration/addDropSectionConflict.js'
import { buildHardScheduleConflictResult } from '../../data/courseRegistration/studentRegistrationScheduleConflict.js'
import { checkTermCategoryCreditCapForCourse } from '../../data/courseRegistration/studentRegistrationContext.js'
import {
  estimateCourseFee,
  boostPlanRemainingFromDrops,
  consumePlanRemaining,
} from '../../data/courseRegistration/addDropFeeRates.js'
import { resolveSchoolElectiveCategory } from '../../data/courseRegistration/selectableCourses.js'
import {
  formatGradeToZh,
  filterTranscriptRowsForSection,
} from '../../data/courseRegistration/studentTranscript.js'
import {
  evaluateTermCreditGate,
  projectAddDropCreditGroups,
  creditGroupsHaveTermCategoryOver,
  listTermOverCategoryKeys,
  buildAddDropTermCreditStrip,
  wouldExceedAddDropGeTermCap,
  isMandatoryAddDropCourse,
} from '../../data/courseRegistration/addDropMultiItems.js'
import AddDropTermCreditStrip from './AddDropTermCreditStrip.vue'
import {
  attachCourseLevelRowSpans,
  courseRowKey,
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
import { GE_VIRTUAL_SELECTION_GROUP } from '../../data/courseRegistration/retakeSubstitutePool.js'
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
  /**
   * 学期学分帽闸门
   * { currentCredits, creditMax, dropLines, addLines, bypassCreditMax }
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
  /** 本学期必修允许换组的课+教学班白名单 */
  coreSectionSwitchSections: { type: Array, default: () => [] },
  /** 重修无拟退时：在读必修原分组（课+组） */
  originSectionLines: { type: Array, default: () => [] },
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
/** 加课/重修：类别 Tab（必修 / 公选 / 专选）；退课不加 */
const showCourseTypeTabs = computed(() => isRetakeMode.value || isAddMode.value)
const COURSE_TYPE_TABS = [
  { key: 'core', type: 'CORE', labelKey: 'courseRegistration.student.retakePickerTab.core' },
  { key: 'ge', type: 'GE', labelKey: 'courseRegistration.student.retakePickerTab.ge' },
  { key: 'me', type: 'ME', labelKey: 'courseRegistration.student.retakePickerTab.me' },
]
const courseTypeTab = ref('core')
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
function rowMatchesCourseTypeTab(row, wantType) {
  const type = String(row.type || row.course?.type || '').toUpperCase()
  const source = String(row.sourceType || row.course?.sourceType || '').toLowerCase()
  if (wantType === 'CORE') {
    return type === 'CORE' || type === 'MANDATORY' || source === 'required'
  }
  return type === wantType
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
      props.creditGroups.length > 0 ||
      props.creditBars.length > 0),
)

/** 弹窗勾选 → 拟退/拟加课程（含 sourceType，供必修投影） */
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
  const dropCourses = isDrop.value
    ? selectedCourses
    : props.termCreditGate?.dropLines || []
  const addCourses = isDrop.value
    ? props.termCreditGate?.addLines || []
    : selectedCourses
  return { dropCourses, addCourses }
})

const termCreditStrip = computed(() => {
  if (!props.termCreditStripBaseline) return null
  const { dropCourses, addCourses } = pickerProjectionCourses.value
  return buildAddDropTermCreditStrip({
    ...props.termCreditStripBaseline,
    dropCourses,
    addCourses,
  })
})

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
/** 加课/重修必修 Tab：末列为「是否可选」（无名额数字） */
const useCoreSelectableColumn = computed(
  () => showSeatOrRetakeColumn.value && courseTypeTab.value === 'core',
)
const showRetakeHistoryColumn = computed(() => isRetakeMode.value)
/** 加课必修 Tab：原上课学期（名额列前） */
const showOriginalSessionColumn = computed(
  () => isAddMode.value && courseTypeTab.value === 'core',
)
/** 重修课程组列：仅专业选修 Tab（公选/必修均隐藏） */
const showSelectionGroupColumn = computed(
  () => isRetakeMode.value && courseTypeTab.value === 'me',
)
const tableColspan = computed(() => {
  let n = 11
  if (showSeatOrRetakeColumn.value) n += 1
  if (showRetakeHistoryColumn.value) n += 1
  if (showOriginalSessionColumn.value) n += 1
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
        fromEnrolled: course.fromEnrolled,
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
      fromEnrolled: course.fromEnrolled,
      remainingCapacity: remaining,
    },
  ]
}

function originalSessionLabel(row) {
  const v = String(row?.originalAcademicSession || row?.course?.originalAcademicSession || '').trim()
  return v || '—'
}

const flattenedRows = computed(() => {
  const list = []
  for (const course of props.courses || []) {
    list.push(...sectionRowsForCourse(course))
  }
  if (!isRetakeMode.value) return list
  const groups = []
  const seen = new Set()
  for (const row of list) {
    const g = row.selectionGroup
    if (g?.id && !seen.has(g.id)) {
      seen.add(g.id)
      groups.push(g)
    }
  }
  return groups.length ? sortSectionRowsBySelectionGroup(list, groups) : list
})

const filteredRows = computed(() => {
  let list = [...flattenedRows.value]
  if (showCourseTypeTabs.value) {
    const tab = COURSE_TYPE_TABS.find((x) => x.key === courseTypeTab.value)
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
  return list
})

const paginatedRows = computed(() => {
  const list = filteredRows.value
  const start = (currentPage.value - 1) * pageSize.value
  const slice = list.slice(start, start + pageSize.value)
  const rowsForSpan = slice.map((row) => ({
    ...row,
    course: row.course || row,
  }))
  if (isRetakeMode.value) {
    return mergeRetakeSelectionGroupSpans(attachCourseLevelRowSpans(rowsForSpan, start))
  }
  let firstCourseIndex = 0
  const seen = new Set()
  for (let i = 0; i < start; i += 1) {
    const key = courseRowKey(list[i]?.course || list[i])
    if (!key || seen.has(key)) continue
    seen.add(key)
    firstCourseIndex += 1
  }
  return attachCourseLevelRowSpans(rowsForSpan, firstCourseIndex)
})

function spanCell(row, field) {
  return row?._span?.[field] || { show: true, rowspan: 1 }
}

/** 重修：课程组列跨同组多门课合并（对齐在线选课视觉） */
function mergeRetakeSelectionGroupSpans(rows) {
  const out = (rows || []).map((row) => ({ ...row, _span: { ...(row._span || {}) } }))
  let i = 0
  while (i < out.length) {
    const gid = out[i].selectionGroup?.id
    if (!gid) {
      i += 1
      continue
    }
    let j = i + 1
    while (j < out.length && out[j].selectionGroup?.id === gid) j += 1
    const span = j - i
    for (let k = i; k < j; k += 1) {
      out[k]._span = {
        ...out[k]._span,
        selectionGroup: k === i ? { show: true, rowspan: span } : { show: false },
      }
    }
    i = j
  }
  return out
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

function termGateForRow(row) {
  // 加课 / 重修统一受学期帽约束；非白名单超帽阻断，白名单可超（不收费）
  if (isDrop.value || !props.termCreditGate) {
    return { over: false, blocked: false, net: 0, excess: 0 }
  }
  const gate = props.termCreditGate
  // 勾选集合即本侧 working set，不再叠加表单 addLines（预勾回填时避免双计）
  const alreadyPicked = selectedRows.value
    .filter((r) => r.rowKey !== row.rowKey)
    .map((r) => ({ credits: Number(r.credits) || 0 }))
  return evaluateTermCreditGate({
    currentCredits: gate.currentCredits,
    creditMax: gate.creditMax,
    dropLines: gate.dropLines || [],
    addLines: alreadyPicked,
    candidateCredits: Number(row.credits) || 0,
    bypassCreditMax: Boolean(gate.bypassCreditMax),
    creditBypassExtra: gate.creditBypassExtra,
  })
}

function feeActionForEstimate() {
  if (props.action === 'AddDrop') return 'Add'
  if (props.action === 'RetakeDrop') return 'Retake'
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

/** 无一可选行且无已勾选时，表头全选置灰 */
const selectAllEnabled = computed(() => selectAllCandidates.value.length > 0)

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
    // GE 学期帽：按累计 next 投影（勿用 selectedRows，全选过程中尚未写入）
    if (
      !isDrop.value &&
      props.termCreditStripBaseline &&
      normalizeRegistrationType(row.type || row.course?.type) === 'GE'
    ) {
      const addCourses = [
        ...next.map((k) => rowByKey.get(k)).filter(Boolean).map(coursePayloadFromRow),
        coursePayloadFromRow(row),
      ]
      if (
        wouldExceedAddDropGeTermCap(props.termCreditStripBaseline, {
          dropCourses: props.termCreditGate?.dropLines || [],
          addCourses,
        })
      ) {
        continue
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
      dropLines: gate.dropLines || [],
      addLines: already,
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
    courseTypeTab.value = 'core'
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

watch(filteredRows, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value))
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

function conflictInfo(row) {
  if (isDrop.value || row.fromEnrolled) return { conflict: false }
  return getSectionMeetingsConflictInfo(row.section, props.scheduleBaseline)
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

/** GE 学期帽（与 R3/学分条同源）：拟加后 current > geMax 则硬拦 */
function isRowGeTermCapBlocked(row) {
  if (isDrop.value || row.fromEnrolled) return false
  if (!props.termCreditStripBaseline) return false
  const kind = normalizeRegistrationType(row.type || row.course?.type)
  if (kind !== 'GE') return false
  const others = selectedRows.value
    .filter((r) => r.rowKey !== row.rowKey)
    .map(coursePayloadFromRow)
  return wouldExceedAddDropGeTermCap(props.termCreditStripBaseline, {
    dropCourses: props.termCreditGate?.dropLines || [],
    addCourses: [...others, coursePayloadFromRow(row)],
  })
}

function isRowCreditBlocked(row) {
  return Boolean(termGateForRow(row).blocked) || isRowGeTermCapBlocked(row)
}

function isRowDisabledBySibling(row) {
  // 加课/重修：同一课程只允许选一个课程分组；同课程组内不同课程仍可多选
  if (isDrop.value || row.fromEnrolled) return false
  if (isRowChecked(row)) return false
  const code = String(row.code || row.course?.code || '')
  if (!code) return false
  return flattenedRows.value.some(
    (r) =>
      r.rowKey !== row.rowKey &&
      String(r.code || r.course?.code || '') === code &&
      isRowChecked(r),
  )
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
    lines.push({
      courseId: course.id,
      courseCode: course.code,
      sectionCode,
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
  )
}

function isRowDisabled(row) {
  return (
    conflictInfo(row).conflict ||
    isRowFull(row) ||
    isRowCreditBlocked(row) ||
    isRowDisabledBySibling(row) ||
    isRowBlockedByCoreSectionLock(row)
  )
}

function isRowChecked(row) {
  if (useMultiple.value) return pickedRowKeys.value.includes(row.rowKey)
  return pickedRowKey.value === row.rowKey
}

function pickRow(row) {
  if (isRowDisabled(row)) return
  if (useMultiple.value) {
    const set = new Set(pickedRowKeys.value)
    if (set.has(row.rowKey)) set.delete(row.rowKey)
    else set.add(row.rowKey)
    pickedRowKeys.value = [...set]
    pickedRowKey.value = pickedRowKeys.value[pickedRowKeys.value.length - 1] || ''
    return
  }
  pickedRowKey.value = row.rowKey
  pickedRowKeys.value = [row.rowKey]
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

/** 曾修列：仅匹配本教学班的履历；无则空（模板展示「-」） */
function retakeHistoryLines(row) {
  const course = row?.course || row
  const lines = []
  const all = course?.retakeHistory || row?.retakeHistory || []
  const rows = filterTranscriptRowsForSection(all, row?.section)
  for (const r of rows) {
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
  // 重修选课器：虚拟 GE 组整表同色 → 不挂底色
  if (group.id === GE_VIRTUAL_SELECTION_GROUP.id) return undefined
  const groups = []
  const seen = new Set()
  for (const row of flattenedRows.value) {
    const g = row.selectionGroup
    if (g?.id && !seen.has(g.id)) {
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
  if (isDrop.value || row.fromEnrolled) return t('courseRegistration.student.pickerStatusEnrolled')
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
  if (isDrop.value || row.fromEnrolled) return ''
  if (isRowDisabledBySibling(row)) {
    return t('courseRegistration.student.pickerSameCourseSectionPicked')
  }
  if (isRowBlockedByCoreSectionLock(row)) {
    return t('courseRegistration.student.coreMustSameSectionReadd')
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
    if (isRowGeTermCapBlocked(row) && props.termCreditStripBaseline) {
      const others = selectedRows.value
        .filter((r) => r.rowKey !== row.rowKey)
        .map(coursePayloadFromRow)
      const strip = buildAddDropTermCreditStrip({
        ...props.termCreditStripBaseline,
        dropCourses: props.termCreditGate?.dropLines || [],
        addCourses: [...others, coursePayloadFromRow(row)],
      })
      return t('courseRegistration.student.termCreditCapExceeded', {
        type: 'GE',
        used: strip.ge?.current ?? '—',
        max: strip.ge?.max ?? '—',
      })
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
  if (isRowDisabledBySibling(row)) return 'conflict'
  if (isRowBlockedByCoreSectionLock(row)) return 'conflict'
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

function handleConfirm() {
  if (!canConfirm.value) return
  if (!selectedRows.value.length) {
    if (!isDrop.value) return
    emitConfirm({ selections: [] })
    return
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
              {{ t('courseRegistration.student.coursePickerSubtitle', { type: actionTypeLabel }) }}
              ·
              {{ t('courseRegistration.student.pickerStepCourse') }}
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
              {{ tab.label }}
            </button>
          </div>

          <p class="selection-meta">
            {{
              selectedRows.length
                ? t('courseRegistration.student.coursePickerSelected', { count: selectedRows.length })
                : t('courseRegistration.student.coursePickerNone')
            }}
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
                  <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                  <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                  <th class="col-category">{{ t('courseRegistration.courses.category') }}</th>
                  <th class="col-lecturer">{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th class="col-week">{{ t('courseRegistration.courses.weekRange') }}</th>
                  <th class="col-time">{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                  <th
                    v-if="showRetakeHistoryColumn"
                    class="col-retake-history sticky-retake-history"
                  >
                    {{ t('courseRegistration.student.pickerRetakeHistoryHeader') }}
                  </th>
                  <th
                    v-if="showOriginalSessionColumn"
                    class="col-original-session"
                  >
                    {{ t('courseRegistration.student.pickerOriginalSessionHeader') }}
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
                      disabled: isRowDisabled(row),
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
                      :disabled="isRowDisabled(row) && !isRowChecked(row)"
                      @click.stop
                      @change="pickRow(row)"
                    />
                    <input
                      v-else
                      type="radio"
                      name="adddrop-course-pick"
                      :checked="isRowChecked(row)"
                      :disabled="isRowDisabled(row)"
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
                    <template v-if="row.selectionGroup">
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
                  <td>{{ sectionLabel(row) }}</td>
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
                    v-if="showRetakeHistoryColumn"
                    class="cr-retake-history sticky-retake-history"
                  >
                    <div
                      v-for="(line, hi) in retakeHistoryLines(row)"
                      :key="hi"
                      class="cr-retake-history-line"
                      :title="line"
                    >
                      {{ line }}
                    </div>
                    <span v-if="!retakeHistoryLines(row).length">—</span>
                  </td>
                  <td
                    v-if="showOriginalSessionColumn && spanCell(row, 'originalSession')?.show"
                    class="cell-course col-original-session"
                    :rowspan="spanCell(row, 'originalSession').rowspan"
                  >
                    {{ originalSessionLabel(row) }}
                  </td>
                  <td
                    v-if="showSeatOrRetakeColumn"
                    class="col-status sticky-status"
                  >
                    <span
                      class="seat-status"
                      :class="seatStatusClass(row)"
                      :title="seatStatusTip(row) || undefined"
                    >
                      {{ seatStatusLabel(row) }}
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
            :total="filteredRows.length"
            :page-size-options="[5, 10, 20]"
          />
        </div>

        <div class="modal-footer">
          <p v-if="showFooterTermOverBypassHint" class="footer-excess-hint footer-excess-hint--whitelist">
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
      :z-index="1300"
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
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
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
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
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
  border-left: 1px solid #d1d5db;
  border-right: 1px solid #d1d5db;
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

.data-table tbody tr.disabled:hover {
  background: #f9fafb;
}

.col-check {
  width: 32px;
  overflow: visible;
  text-overflow: clip;
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

.th-label-with-tip .tip-icon {
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
