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
  getRegistrationTypeLabel,
} from '../../data/courseRegistration/registrationTypes.js'
import {
  schoolElectiveCategoryOptions,
  getSchoolElectiveCategoryLabel,
} from '../../data/departments.js'
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
import { formatGradeToZh } from '../../data/courseRegistration/studentTranscript.js'
import {
  evaluateTermCreditGate,
  projectAddDropCreditGroups,
  creditGroupsHaveTermCategoryOver,
  listTermOverCategoryKeys,
} from '../../data/courseRegistration/addDropMultiItems.js'
import {
  attachCourseLevelRowSpans,
  courseRowKey,
} from '../../data/courseRegistration/sectionTableRowSpans.js'

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
  planRemaining: { type: Object, default: () => ({}) },
  /** 再次打开时预勾选（表单 dropLines / addLines） */
  preselectedLines: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'confirm'])

const { t, isZh } = useAppI18n()

const searchDraft = ref('')
const creditsDraft = ref('')
const schoolElectiveDraft = ref('')
const typeDraft = ref('')
const searchApplied = ref('')
const creditsApplied = ref('')
const schoolElectiveApplied = ref('')
const typeApplied = ref('')
const pickedRowKey = ref('')
const pickedRowKeys = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const excessConfirmVisible = ref(false)
const pendingConfirmPayload = ref(null)
const selectAllEl = ref(null)

const isDrop = computed(() => props.action === 'Drop')
const useMultiple = computed(() => Boolean(props.multiple))
const showAddEligibilityTip = computed(
  () => props.action === 'Add' || props.action === 'AddDrop',
)
const showCreditProgress = computed(
  () =>
    (props.action === 'Add' ||
      props.action === 'AddDrop' ||
      props.action === 'Retake' ||
      props.action === 'Drop') &&
    (props.creditGroups.length > 0 || props.creditBars.length > 0),
)

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
  // 弹窗内仅跟当前勾选投影；空勾选 = 纯基线（退）或基线±表单另一侧（加）
  const selectedCourses = selectedRows.value.map((r) => ({
    ...(r.course || {}),
    type: r.type || r.course?.type,
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
  return projectAddDropCreditGroups(baseline, { dropCourses, addCourses })
})

const geCreditGroups = computed(() =>
  creditDisplayGroups.value.filter((g) => g.key === 'ge-grad' || g.key === 'ge'),
)
const meCreditGroups = computed(() =>
  creditDisplayGroups.value.filter((g) => g.key === 'me-grad' || g.key === 'me'),
)
const legacyCreditGroups = computed(() =>
  creditDisplayGroups.value.filter(
    (g) => !['ge-grad', 'ge', 'me-grad', 'me'].includes(String(g.key || '')),
  ),
)

const scheduleLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const CATEGORY_SHORT_KEYS = {
  humanities: 'courseRegistration.student.geDemand.short.humanities',
  business: 'courseRegistration.student.geDemand.short.business',
  science: 'courseRegistration.student.geDemand.short.science',
  aiOpen: 'courseRegistration.student.geDemand.short.aiOpen',
  group4of3: 'courseRegistration.student.meGroup.short.group4of3',
  group3of2: 'courseRegistration.student.meGroup.short.group3of2',
  group2of1: 'courseRegistration.student.meGroup.short.group2of1',
  ordinary: 'courseRegistration.student.meGroup.short.ordinary',
}

const creditFilterOptions = computed(() => {
  const set = new Set()
  for (const course of props.courses || []) {
    const c = Number(course.credits)
    if (Number.isFinite(c) && c > 0) set.add(c)
  }
  return [...set].sort((a, b) => a - b)
})

function sectionRowsForCourse(course) {
  const sections = Array.isArray(course.sections) ? course.sections : []
  // 重修模式：每课只取首段一行，不再展开全部分组
  const pickSections = props.action === 'Retake' ? sections.slice(0, 1) : sections
  if (pickSections.length) {
    return pickSections.map((section) => {
      const capacity =
        Number(section.capacity) ||
        Number(course.totalCapacity) ||
        0
      const enrolled = Number(section.enrolled) || 0
      const remaining = Math.max(0, capacity - enrolled)
      return {
        rowKey: section.id || `${course.id || course.code}::${section.code}`,
        course,
        section: { ...section, capacity, enrolled },
        code: course.code,
        name: course.name,
        credits: course.credits,
        type: course.type,
        schoolElectiveCategory:
          course.schoolElectiveCategory || resolveSchoolElectiveCategory(course) || '',
        fromEnrolled: course.fromEnrolled,
        remainingCapacity: remaining,
      }
    })
  }
  const code = course.sectionCode || '01'
  const remRaw = Number(course.remainingCapacity)
  const totalCap =
    Number(course.totalCapacity) ||
    (Number.isFinite(remRaw) ? remRaw : 0) ||
    0
  const remaining = Number.isFinite(remRaw) ? Math.max(0, remRaw) : totalCap
  const enrolled = Math.max(0, totalCap - remaining)
  const section = {
    id: course.sectionId || `enrolled-${course.code || course.id}-${code}`,
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
      code: course.code,
      name: course.name,
      credits: course.credits,
      type: course.type,
      schoolElectiveCategory:
        course.schoolElectiveCategory || resolveSchoolElectiveCategory(course) || '',
      fromEnrolled: course.fromEnrolled,
      remainingCapacity: remaining,
    },
  ]
}

const flattenedRows = computed(() => {
  const list = []
  for (const course of props.courses || []) {
    list.push(...sectionRowsForCourse(course))
  }
  return list
})

const filteredRows = computed(() => {
  let list = [...flattenedRows.value]
  const kw = searchApplied.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (row) =>
        String(row.code || '')
          .toLowerCase()
          .includes(kw) ||
        String(row.name || '')
          .toLowerCase()
          .includes(kw),
    )
  }
  if (creditsApplied.value) {
    const target = Number(creditsApplied.value)
    list = list.filter((row) => Number(row.credits) === target)
  }
  if (schoolElectiveApplied.value) {
    list = list.filter(
      (row) =>
        String(row.schoolElectiveCategory || row.course?.schoolElectiveCategory || '') ===
        String(schoolElectiveApplied.value),
    )
  }
  if (typeApplied.value) {
    list = list.filter(
      (row) => String(row.type || '').toUpperCase() === String(typeApplied.value).toUpperCase(),
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
    return attachCourseLevelRowSpans(rowsForSpan, start, { flat: true })
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

const selectedRow = computed(
  () => filteredRows.value.find((r) => r.rowKey === pickedRowKey.value) || null,
)

const selectedRows = computed(() => {
  if (!useMultiple.value) return selectedRow.value ? [selectedRow.value] : []
  const set = new Set(pickedRowKeys.value)
  return filteredRows.value.filter((r) => set.has(r.rowKey))
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
  })
}

function feeActionForEstimate() {
  if (props.action === 'AddDrop') return 'Add'
  if (props.action === 'RetakeDrop') return 'Retake'
  return props.action
}

/** 毕业剩余：含退课时先释放拟退课占用，再供逐课计费 */
function planRemainingForFee() {
  const drops = props.termCreditGate?.dropLines || []
  if (
    (props.action === 'AddDrop' || props.action === 'Retake' || props.action === 'RetakeDrop') &&
    drops.length
  ) {
    return boostPlanRemainingFromDrops(props.planRemaining, drops)
  }
  return props.planRemaining
}

const selectedFeeEstimate = computed(() => {
  const rows = selectedRows.value
  if (!rows.length) return null
  if (isDrop.value || !showCreditProgress.value) return null
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
  // 缴费类提示：仅毕业类别超额（billableCredits > 0）；学期超限走白名单提示
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
  if (!useMultiple.value) return
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
    if (conflictInfo(row).conflict || isRowFull(row)) continue
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
    })
    if (!g.blocked) next.push(row.rowKey)
  }
  pickedRowKeys.value = [...new Set(next)]
  pickedRowKey.value = pickedRowKeys.value[pickedRowKeys.value.length - 1] || ''
}

const excessConfirmMessage = computed(() => {
  const payload = pendingConfirmPayload.value
  if (!payload?.fee?.billableCredits) return ''
  const first = payload.selections?.[0] || payload
  return t('courseRegistration.student.pickerExcessCreditConfirm', {
    excess: payload.fee.billableCredits,
    course: first.course?.code || '',
    credits: first.course?.credits || 0,
  })
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    searchDraft.value = ''
    creditsDraft.value = ''
    schoolElectiveDraft.value = ''
    typeDraft.value = ''
    searchApplied.value = ''
    creditsApplied.value = ''
    schoolElectiveApplied.value = ''
    typeApplied.value = ''
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
  searchApplied.value = searchDraft.value
  creditsApplied.value = creditsDraft.value
  schoolElectiveApplied.value = schoolElectiveDraft.value
  typeApplied.value = typeDraft.value
  currentPage.value = 1
}

function handleReset() {
  searchDraft.value = ''
  creditsDraft.value = ''
  schoolElectiveDraft.value = ''
  typeDraft.value = ''
  searchApplied.value = ''
  creditsApplied.value = ''
  schoolElectiveApplied.value = ''
  typeApplied.value = ''
  currentPage.value = 1
}

function conflictInfo(row) {
  if (isDrop.value || row.fromEnrolled) return { conflict: false }
  return getSectionMeetingsConflictInfo(row.section, props.scheduleBaseline)
}

function isRowFull(row) {
  if (isDrop.value || row.fromEnrolled) return false
  const rem = Number(row.remainingCapacity)
  return Number.isFinite(rem) && rem <= 0
}

function isRowCreditBlocked(row) {
  return Boolean(termGateForRow(row).blocked)
}

function isRowDisabledBySibling(row) {
  // 加课/重修：同一课程只允许选一个分组，选了其一后其余置灰
  // 重修模式每课只展一行，且不启用此锁
  if (isDrop.value || row.fromEnrolled) return false
  if (props.action === 'Retake') return false
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

function isRowDisabled(row) {
  return (
    conflictInfo(row).conflict ||
    isRowFull(row) ||
    isRowCreditBlocked(row) ||
    isRowDisabledBySibling(row)
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

function typeLabel(item) {
  return getRegistrationTypeLabel(item.type, t)
}

function schoolElectiveLabel(row) {
  const course = row.course || row
  const value =
    row.schoolElectiveCategory ||
    course.schoolElectiveCategory ||
    resolveSchoolElectiveCategory(course)
  return getSchoolElectiveCategoryLabel(value, isZh.value)
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

const isRetakeMode = computed(() => props.action === 'Retake')

function retakeHistoryLines(row) {
  const rows = row?.course?.retakeHistory || row?.retakeHistory || []
  if (!Array.isArray(rows) || !rows.length) return []
  return rows.map((r) => {
    const session = String(r.academicSession || '').trim()
    const gradeZh = formatGradeToZh(r.grade)
    return [session, gradeZh].filter(Boolean).join(' ')
  }).filter(Boolean)
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

function seatStatusLabel(row) {
  if (isDrop.value || row.fromEnrolled) return t('courseRegistration.student.pickerStatusEnrolled')
  if (conflictInfo(row).conflict) return t('courseRegistration.student.pickerStatusConflict')
  if (isRowFull(row)) return t('courseRegistration.student.pickerStatusFull')
  if (isRowCreditBlocked(row)) return t('courseRegistration.student.pickerStatusOverCredit')
  if (termGateForRow(row).over && props.termCreditGate?.bypassCreditMax) {
    return t('courseRegistration.student.pickerOverCreditBypassHint')
  }
  const { remaining, total } = seatCapacityParts(row)
  if (remaining != null && total != null) return `${remaining}/${total}`
  return t('courseRegistration.student.pickerStatusOpen')
}

/** 不可选状态完整说明（有余量/名额数字不返回 tip） */
function seatStatusTip(row) {
  if (isDrop.value || row.fromEnrolled) return ''
  const conflict = conflictInfo(row)
  if (conflict.conflict) {
    const hard = buildHardScheduleConflictResult(conflict)
    return t(hard.errorKey, hard.errorParams || {})
  }
  if (isRowFull(row)) return t('courseRegistration.student.pickerStatusFull')
  if (isRowCreditBlocked(row)) {
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
  if (isRowCreditBlocked(row)) return 'conflict'
  if (conflictInfo(row).conflict) return 'conflict'
  if (isRowFull(row)) return 'full'
  if (termGateForRow(row).over) return 'full'
  return 'open'
}

function creditCapsuleTone(bar) {
  const current = Number(bar?.current) || 0
  const max = Number(bar?.max) || 0
  if (max <= 0) return 'is-neutral'
  if (current > max) return 'is-over'
  if (current === max) return 'is-met'
  return 'is-short'
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
            <p>{{ t('courseRegistration.student.pickerAddEligibilityTip') }}</p>
          </CourseRegistrationCallout>

          <div class="search-bar">
            <div class="search-row search-row--filters">
              <div class="search-item">
                <label class="search-label">{{ t('courseRegistration.courses.code') }}</label>
                <input
                  v-model="searchDraft"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.courses.librarySearchPlaceholder')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item search-item--sm">
                <label class="search-label">{{ t('courseRegistration.courses.credits') }}</label>
                <select v-model="creditsDraft" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="credit in creditFilterOptions" :key="credit" :value="String(credit)">
                    {{ credit }}
                  </option>
                </select>
              </div>
              <div class="search-item search-item--sm">
                <label class="search-label">{{ t('courseRegistration.courses.schoolElectiveCategory') }}</label>
                <select v-model="schoolElectiveDraft" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option
                    v-for="opt in schoolElectiveCategoryOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ isZh ? opt.zh : opt.en }}
                  </option>
                </select>
              </div>
              <div class="search-item search-item--sm">
                <label class="search-label">{{ t('courseRegistration.courses.type') }}</label>
                <select v-model="typeDraft" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="opt in courseTypeOptions" :key="opt.value" :value="opt.value">
                    {{ t(opt.labelKey) }}
                  </option>
                </select>
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">
                  {{ t('common.search') }}
                </button>
                <button type="button" class="btn btn-default" @click="handleReset">
                  {{ t('common.reset') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="showCreditProgress" class="picker-credit-progress">
            <span class="picker-credit-label">
              {{ t('courseRegistration.student.pickerCreditProgress') }}
            </span>
            <div class="picker-credit-groups">
              <div
                v-if="geCreditGroups.length"
                class="picker-credit-band picker-credit-band--ge"
              >
                <template v-for="group in geCreditGroups" :key="group.key">
                  <span
                    v-if="group.total"
                    class="cr-credit-capsule cr-credit-capsule--total"
                    :class="creditCapsuleTone(group.total)"
                    :title="`${t(group.total.labelKey)} ${group.total.current}/${group.total.max}`"
                  >
                    {{ t(group.total.labelKey) }} {{ group.total.current }}/{{ group.total.max }}
                  </span>
                  <span
                    v-for="bar in group.categories || []"
                    :key="`${group.key}-${bar.key}`"
                    class="cr-credit-capsule"
                    :class="creditCapsuleTone(bar)"
                    :title="`${t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey)} ${bar.current}/${bar.max}`"
                  >
                    {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }}
                    {{ bar.current }}/{{ bar.max }}
                  </span>
                </template>
              </div>
              <div
                v-if="meCreditGroups.length"
                class="picker-credit-band picker-credit-band--me"
              >
                <template v-for="group in meCreditGroups" :key="group.key">
                  <span
                    v-if="group.total"
                    class="cr-credit-capsule cr-credit-capsule--total"
                    :class="creditCapsuleTone(group.total)"
                    :title="`${t(group.total.labelKey)} ${group.total.current}/${group.total.max}`"
                  >
                    {{ t(group.total.labelKey) }} {{ group.total.current }}/{{ group.total.max }}
                  </span>
                  <span
                    v-for="bar in group.categories || []"
                    :key="`${group.key}-${bar.key}`"
                    class="cr-credit-capsule"
                    :class="creditCapsuleTone(bar)"
                    :title="`${t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey)} ${bar.current}/${bar.max}`"
                  >
                    {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }}
                    {{ bar.current }}/{{ bar.max }}
                  </span>
                </template>
              </div>
              <div
                v-for="(group, gi) in legacyCreditGroups"
                :key="group.key || gi"
                class="picker-credit-capsules picker-credit-capsules--legacy"
              >
                <span
                  v-if="group.total"
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(group.total)"
                >
                  {{ t(group.total.labelKey) }} {{ group.total.current }}/{{ group.total.max }}
                </span>
                <span
                  v-for="bar in group.totals || []"
                  :key="bar.key"
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(bar)"
                >
                  {{ t(bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
                </span>
                <span
                  v-for="bar in group.categories || []"
                  :key="`${group.key}-${bar.key}`"
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(bar)"
                >
                  {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }}
                  {{ bar.current }}/{{ bar.max }}
                </span>
              </div>
            </div>
          </div>

          <p class="selection-meta">
            {{
              selectedRows.length
                ? t('courseRegistration.student.coursePickerSelected', { count: selectedRows.length })
                : t('courseRegistration.student.coursePickerNone')
            }}
          </p>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      v-if="useMultiple"
                      ref="selectAllEl"
                      type="checkbox"
                      :checked="allSelected"
                      :aria-label="t('courseRegistration.student.pickerSelectAll')"
                      @change="toggleSelectAll($event.target.checked)"
                      @click.stop
                    />
                  </th>
                  <th class="col-serial">{{ t('common.serialNo') }}</th>
                  <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                  <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                  <th class="col-group">{{ t('courseRegistration.courses.sectionCode') }}</th>
                  <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                  <th class="col-category">{{ t('courseRegistration.courses.schoolElectiveCategory') }}</th>
                  <th class="col-type">{{ t('courseRegistration.courses.type') }}</th>
                  <th class="col-lecturer">{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th class="col-week">{{ t('courseRegistration.courses.weekRange') }}</th>
                  <th class="col-time">{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                  <th class="sticky-status col-status">{{
                    isRetakeMode
                      ? t('courseRegistration.student.pickerRetakeHistoryHeader')
                      : t('courseRegistration.student.pickerSeatCapacityHeader')
                  }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.rowKey"
                  :class="{
                    selected: isRowChecked(row),
                    disabled: isRowDisabled(row),
                  }"
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
                  <td>{{ sectionLabel(row) }}</td>
                  <td
                    v-if="spanCell(row, 'credits')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'credits').rowspan"
                  >
                    {{ row.credits }}
                  </td>
                  <td
                    v-if="spanCell(row, 'schoolCat')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'schoolCat').rowspan"
                  >
                    {{ schoolElectiveLabel(row) }}
                  </td>
                  <td
                    v-if="spanCell(row, 'type')?.show"
                    class="cell-course"
                    :rowspan="spanCell(row, 'type').rowspan"
                  >
                    {{ typeLabel(row) }}
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
                    v-if="isRetakeMode"
                    class="sticky-status cr-retake-history"
                    :rowspan="spanCell(row, 'retakeHistory')?.rowspan || 1"
                  >
                    <template v-if="spanCell(row, 'retakeHistory')?.show">
                      <div
                        v-for="(line, hi) in retakeHistoryLines(row)"
                        :key="hi"
                        class="cr-retake-history-line"
                        :title="line"
                      >
                        {{ line }}
                      </div>
                      <span v-if="!retakeHistoryLines(row).length">—</span>
                    </template>
                  </td>
                  <td v-else class="sticky-status">
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
                  <td colspan="12" class="empty-cell">{{ t('common.noData') }}</td>
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
      :title="t('courseRegistration.student.pickerExcessCreditTitle')"
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
  width: min(1100px, 100%);
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

.search-bar {
  margin-bottom: 12px;
}

.search-row--filters {
  display: flex;
  align-items: center;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 0 1 auto;
  min-width: 0;
}

.search-item--sm {
  flex: 0 0 auto;
}

.search-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.search-input,
.search-select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  width: 180px;
  min-width: 120px;
  background: #fff;
}

.search-item--sm .search-select {
  width: 100px;
  min-width: 88px;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
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

/* 未满：绿 */
.cr-credit-capsule.is-short {
  background: #ecfdf5;
  color: #047857;
}

/* 刚好满：橙 */
.cr-credit-capsule.is-met {
  background: #fff7ed;
  color: #c2410c;
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
  overflow-x: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}

.data-table th,
.data-table td {
  padding: 5px 6px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table thead th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  white-space: nowrap;
}

.data-table td.cell-course[rowspan] {
  vertical-align: middle;
}

.data-table tbody tr {
  cursor: pointer;
}

.data-table tbody tr:hover,
.data-table tbody tr.selected {
  background: #eff6ff;
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
  width: 22%;
}

.col-status {
  width: 10%;
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

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}

.seat-status.open {
  color: #15803d;
}

.seat-status.full,
.seat-status.conflict {
  color: #b91c1c;
}

.sticky-status {
  position: sticky;
  right: 0;
  z-index: 2;
  background: #fff;
}

thead .sticky-status {
  z-index: 3;
  background: #f9fafb;
}

.data-table tbody tr:hover .sticky-status,
.data-table tbody tr.selected .sticky-status {
  background: #eff6ff;
}

.data-table tbody tr.disabled .sticky-status {
  background: #f9fafb;
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
