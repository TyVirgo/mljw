<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import StudentRegistrationRoundStatusPanel from '../../../components/courseRegistration/StudentRegistrationRoundStatusPanel.vue'
import StudentSchedulePreviewPanel from '../../../components/courseRegistration/StudentSchedulePreviewPanel.vue'
import StudentPendingRoundPreviewPanel from '../../../components/courseRegistration/StudentPendingRoundPreviewPanel.vue'
import StudentCourseCatalogDrawer from '../../../components/courseRegistration/StudentCourseCatalogDrawer.vue'
import CourseCodeSourcePopover from '../../../components/courseRegistration/CourseCodeSourcePopover.vue'
import ApplicationDetailDrawer from '../../../components/common/ApplicationDetailDrawer.vue'
import TablePagination from '../../../components/common/TablePagination.vue'
import ConfirmDialog from '../../../components/common/ConfirmDialog.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import {
  myRegistrationList,
  submitSingleCourseRegistration,
  getSelectableCoursesForStudent,
  isCourseOccupied,
  setActiveCartRound,
  normalizeCartRoundKey,
  shouldOpenRoundStatusDrawer,
  studentConfirmedCourses,
  registrationCart,
  studentSchedule,
  studentRequiredCourses,
  getTermElectiveCreditProgress,
  checkTermCreditCapForCourse,
  getStudentProfileFields,
  getHardScheduleConflictGate,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { formatIntakeBatch } from '../../../data/intakeSets.js'
import {
  getStudentCreditSummary,
  filterStudentCourseList,
  filterCoursesByRound,
  getTermGeCategoryBars,
  getTermGeElectiveCategoryBars,
  getGraduationGeBars,
  getGraduationMeBars,
  studentHasGeElectiveRequirement,
} from '../../../data/courseRegistration/studentRegistrationContext.js'
import {
  getActiveBatch,
  getBatchById,
  activeBatchTypePreference,
  formatRoundRange,
  formatResultReleaseAt,
  isBatchRoundOpenForRegistration,
  listStudentSelectableBatchesByType,
  listStudentRoundTimelineStatuses,
  listConfiguredRoundKeys,
  setStudentSelectedBatchId,
  studentSelectedBatchId,
  getStudentDefaultRoundKey,
  getStudentCurrentOpenRoundKey,
  resolveBatchForTypeEntry,
} from '../../../data/courseRegistration/registrationBatches.js'
import { getStudentAudience } from '../../../data/courseRegistration/studentAudience.js'
import { getEffectiveAudienceRounds, AUDIENCE_SENIOR } from '../../../data/courseRegistration/audienceRounds.js'
import {
  getVolunteerSectionState,
  volunteerCourseStates,
} from '../../../data/courseRegistration/preselectVolunteerConfirm.js'
import {
  shouldShowVolunteerSheetPanel,
  isVolunteerListLocked,
  sortedPendingVolunteers,
} from '../../../data/courseRegistration/studentVolunteerSheet.js'
import { courseTypeOptions, getRegistrationTypeLabel } from '../../../data/courseRegistration/registrationTypes.js'
import { displayWeekRange, displayClassTimeVenueLines } from '../../../data/courseRegistration/sectionScheduleFields.js'
import { getSchoolElectiveCategoryLabel } from '../../../data/departments.js'
import { resolveSchoolElectiveCategory } from '../../../data/courseRegistration/selectableCourses.js'
import {
  buildPreviewSchedule,
  listRoundStatusCoursesForSchedule,
} from '../../../data/courseRegistration/studentSchedulePreview.js'
import {
  getSelectionGroupsForBatch,
  formatSelectionGroupRemark,
  getSelectionGroupDisplayLines,
  selectionGroupToneIndex,
  sortSectionRowsBySelectionGroup,
} from '../../../data/courseRegistration/courseSelectionGroups.js'
import {
  buildSectionRowsFromCourses,
  filterCoursesBySectionAvailability,
  groupSectionRowsByCourse,
  paginateSectionRowsByCourse,
  sortRowsByCourseThenSection,
} from '../../../data/courseRegistration/sectionTableRowSpans.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const emit = defineEmits(['navigate', 'list-active', 'breadcrumb-extra'])

const { t, isZh } = useAppI18n()

function emptySearch() {
  return { keyword: '', type: '', availability: '', credits: '', prerequisites: '' }
}

const creditSummary = computed(() => getStudentCreditSummary())

/** 选课入口页学生基础信息（年级展示 YYYY/MM） */
const entryStudentProfile = computed(() => {
  const p = getStudentProfileFields()
  return {
    studentId: p.studentId || '—',
    studentName: p.studentName || '—',
    programme: p.programmeName || p.programme || '—',
    grade: formatIntakeBatch(p.intake) || p.intake || '—',
  }
})

/** 同页三步：目录 → 列表 / 待开放预览 */
const entryStep = ref('catalog')
/** 待开放轮次只读预览上下文 */
const previewContext = ref(null)
/** 目录卡：各类型选中的批次 id（同类型开放批可下拉切换） */
const catalogBatchIdByType = ref({ GE: '', ME: '' })

/** 当前学生专业码（入口批次过滤） */
const studentProgrammeCode = computed(() => getStudentProfileFields().programme || 'SWE')

/** 培养方案 geRequired > 0 时展示 GE 入口卡；否则仅 ME 且左对齐 */
const showGeTypeEntry = computed(() => studentHasGeElectiveRequirement(studentProgrammeCode.value))

const entryTypeOrder = computed(() => (showGeTypeEntry.value ? ['GE', 'ME'] : ['ME']))

/**
 * 截止后提示：一二轮等待下一轮；三轮批次结束
 * @param {string} roundKey
 */
function catalogExpiredHintKey(roundKey) {
  if (roundKey === 'supplement') {
    return 'courseRegistration.student.typeEntry.batchEndedHint'
  }
  return 'courseRegistration.student.typeEntry.waitNextRoundHint'
}

const selectedRound = ref('main')
setActiveCartRound(selectedRound.value)

/** 当前批次类型（由选中批次同步） */
const batchTypeTab = computed(() => activeBatchTypePreference.value)

/** 当前选中批次 */
const activeBatch = computed(() => getActiveBatch())

const studentAudience = computed(() => getStudentAudience())

const currentOpenRoundKey = computed(() =>
  getStudentCurrentOpenRoundKey(activeBatch.value, studentAudience.value),
)

/** 可操作：有批次 + 当前轮开放 + 选中即为该开放轮（开闭只认 demo 标志） */
const canOperateRegistration = computed(() => {
  if (!activeBatch.value) return false
  const openKey = currentOpenRoundKey.value
  if (!openKey) return false
  return (
    selectedRound.value === openKey &&
    isBatchRoundOpenForRegistration(activeBatch.value, openKey)
  )
})

const isRoundRegistrationOpen = canOperateRegistration

/** 仅在可操作时展示操作列 */
const showActionsColumn = computed(() => canOperateRegistration.value)

/** 空表 colspan：基础 12 列 + 校选类别 + ME 课程组/备注 + 条件操作列 */
const emptyTableColspan = computed(() => {
  let n = 12
  if (showSelectionGroupColumn.value) n += 2
  if (showActionsColumn.value) n += 1
  return n
})

const ROUND_LABEL_KEYS = {
  preselect: 'courseRegistration.student.roundPreselect',
  main: 'courseRegistration.student.roundMain',
  supplement: 'courseRegistration.student.roundSupplement',
  addDrop: 'courseRegistration.student.roundAddDrop',
}

/** 列表顶栏：同类型可选批次（与入口一致） */
const listBatchOptions = computed(() => {
  const type = batchTypeTab.value === 'GE' ? 'GE' : 'ME'
  return listCatalogBatchesForType(type, studentAudience.value).map((batch) => ({
    id: batch.id,
    name: batch.name,
  }))
})

/** 列表顶栏：当前开放轮；关窗批展示默认轮文案 */
const listRoundOptions = computed(() => {
  const batch = activeBatch.value
  const audience = studentAudience.value
  if (!batch) return []
  const openKey = currentOpenRoundKey.value
  const displayKey = openKey || getStudentDefaultRoundKey(batch, audience)
  const rounds = getEffectiveAudienceRounds(batch, audience)
  const range = displayKey ? rounds?.[displayKey] : null
  if (!range) return []
  return [
    {
      key: displayKey,
      label: `${t(ROUND_LABEL_KEYS[displayKey] || ROUND_LABEL_KEYS.main)} ${formatRoundRange(range)}`,
    },
  ]
})

const listRoundDisplayKey = computed(() => listRoundOptions.value[0]?.key || '')

/**
 * 列表顶栏切换同类型批次（方案 A：进入后锁定该批当前开放轮）
 * @param {Event} event
 */
function handleListBatchChange(event) {
  const id = event?.target?.value || ''
  const batch = id ? getBatchById(id) : null
  if (!batch) return
  const audience = studentAudience.value
  const type = batch.type === 'GE' ? 'GE' : 'ME'
  const openKey = getStudentCurrentOpenRoundKey(batch, audience)
  catalogBatchIdByType.value = { ...catalogBatchIdByType.value, [type]: batch.id }
  setStudentSelectedBatchId(batch.id)
  selectedRound.value = openKey || getStudentDefaultRoundKey(batch, audience)
  setActiveCartRound(selectedRound.value)
  message.value = ''
}

/** 锁定到当前开放轮（无开放则默认轮，整表只读） */
watch(
  [activeBatch, currentOpenRoundKey, studentAudience],
  () => {
    if (entryStep.value === 'preview') return
    const openKey = currentOpenRoundKey.value
    if (openKey) {
      selectedRound.value = openKey
      return
    }
    selectedRound.value = getStudentDefaultRoundKey(activeBatch.value, studentAudience.value)
  },
  { immediate: true },
)

const searchByRound = ref({
  preselect: { form: emptySearch(), applied: emptySearch() },
  main: { form: emptySearch(), applied: emptySearch() },
  supplement: { form: emptySearch(), applied: emptySearch() },
})

const searchForm = computed({
  get() {
    return searchByRound.value[normalizeCartRoundKey(selectedRound.value)].form
  },
  set(next) {
    const key = normalizeCartRoundKey(selectedRound.value)
    searchByRound.value = {
      ...searchByRound.value,
      [key]: { ...searchByRound.value[key], form: next },
    }
  },
})

const appliedSearch = computed(() =>
  searchByRound.value[normalizeCartRoundKey(selectedRound.value)].applied,
)

watch(
  selectedRound,
  (key) => {
    setActiveCartRound(key)
  },
  { immediate: true },
)

const allCourses = computed(() => {
  // 依赖选中批次，切换后刷新课表
  void studentSelectedBatchId.value
  void activeBatchTypePreference.value
  return getSelectableCoursesForStudent(selectedRound.value)
})
const roundFilteredCourses = computed(() =>
  filterCoursesByRound(allCourses.value, selectedRound.value),
)
const courses = computed(() =>
  filterStudentCourseList(roundFilteredCourses.value, appliedSearch.value),
)

const currentPage = ref(1)
const pageSize = ref(50)

/** 选课课程组（跨课程约束包）仅 ME 批次展示；GE 为普通扁平选课表 */
const showSelectionGroupColumn = computed(() => batchTypeTab.value === 'ME')

/** 当前批次选课课程组（跨课程约束包） */
const selectionGroups = computed(() =>
  showSelectionGroupColumn.value ? getSelectionGroupsForBatch(activeBatch.value) : [],
)

/** 课级筛选后展平、排序（同课分组行相邻） */
const sectionRowsAll = computed(() => {
  const groups = selectionGroups.value
  const availabilityFiltered = filterCoursesBySectionAvailability(
    courses.value,
    appliedSearch.value.availability,
  )
  const rows = buildSectionRowsFromCourses(availabilityFiltered, groups)
  if (groups.length) {
    return sortSectionRowsBySelectionGroup(rows, groups)
  }
  return sortRowsByCourseThenSection(rows)
})

const totalCourseCount = computed(() => groupSectionRowsByCourse(sectionRowsAll.value).length)

const pagedRows = computed(() =>
  paginateSectionRowsByCourse(sectionRowsAll.value, currentPage.value, pageSize.value, {
    groupAware: showSelectionGroupColumn.value,
  }).rows,
)

function selectionGroupRemarkText(row) {
  const cell = spanCell(row, 'remark')
  if (!cell?.show) return ''
  if (cell.dash) return '—'
  if (cell.group) return formatSelectionGroupRemark(cell.group, t)
  return '—'
}

function selectionGroupDisplayLines(group) {
  return getSelectionGroupDisplayLines(group, isZh.value)
}

function courseSchoolElectiveLabel(course) {
  return getSchoolElectiveCategoryLabel(resolveSchoolElectiveCategory(course), isZh.value)
}

function selectionGroupRowClass(group) {
  if (!showSelectionGroupColumn.value || !group) return undefined
  return [
    'cr-selection-group-row',
    `cr-selection-group-row--tone-${selectionGroupToneIndex(group, selectionGroups.value)}`,
  ]
}

function spanCell(row, key) {
  return row._span?.[key]
}

watch(
  [() => appliedSearch.value, selectedRound, () => pageSize.value, studentSelectedBatchId],
  () => {
    currentPage.value = 1
  },
)

const creditFilterOptions = computed(() => {
  const set = new Set(
    roundFilteredCourses.value.map((item) => Number(item.credits)).filter((n) => Number.isFinite(n)),
  )
  return [...set].sort((a, b) => a - b)
})

const prerequisiteFilterOptions = computed(() => {
  const set = new Set()
  for (const course of roundFilteredCourses.value) {
    for (const code of course.prerequisites || []) {
      if (code) set.add(String(code))
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
})

const creditsFilterActive = computed(() => Boolean(appliedSearch.value.credits))
const creditsFilterOpen = ref(false)

function toggleCreditsFilter(event) {
  event?.stopPropagation?.()
  creditsFilterOpen.value = !creditsFilterOpen.value
}

function closeCreditsFilter() {
  creditsFilterOpen.value = false
}

function onDocumentClick() {
  if (creditsFilterOpen.value) closeCreditsFilter()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

const myCoursesTip = computed(
  () => `${t('courseRegistration.student.myCoursesTip')}${t('common.prototypeOnlySuffix')}`,
)

const submitting = ref(false)
const message = ref('')
const catalogVisible = ref(false)
const scheduleDrawerVisible = ref(false)
const roundStatusExpanded = ref(false)
const roundStatusPanelRef = ref(null)
const confirmRegisterVisible = ref(false)
const pendingRegister = ref(null)

/**
 * 学分胶囊色调：未满 / 达标 / 超额
 * @param {{ current: number, max: number }} bar
 */
function creditCapsuleTone(bar) {
  const current = Number(bar?.current) || 0
  const max = Number(bar?.max) || 0
  if (max <= 0) return 'is-neutral'
  if (current > max) return 'is-over'
  if (current >= max) return 'is-met'
  return 'is-short'
}

/** 列表顶栏：仅当前类型学分帽（GE 批不露 ME，反之亦然） */
const termElectiveBars = computed(() => {
  const p = getTermElectiveCreditProgress()
  if (batchTypeTab.value === 'GE') {
    return [
      {
        key: 'ge',
        labelKey: 'courseRegistration.student.termElectiveProgressGe',
        current: p.ge,
        max: p.geMax,
      },
    ]
  }
  return [
    {
      key: 'me',
      labelKey: 'courseRegistration.student.termElectiveProgressMe',
      current: p.me,
      max: p.meMax,
    },
  ]
})

/** 顶栏本学期文/商/理（GE / ME 均展示；配额分别对齐 geMax / meMax） */
const termCategoryBars = computed(() =>
  batchTypeTab.value === 'GE' ? getTermGeElectiveCategoryBars() : getTermGeCategoryBars(),
)

/** 列表工具条：毕业学分文/商/理整组 */
const graduationCategoryBars = computed(() =>
  batchTypeTab.value === 'GE' ? getGraduationGeBars() : getGraduationMeBars(),
)

/** 列表工具条：毕业学分类型总分（在本学期公共/专业选修左侧） */
const graduationElectiveBars = computed(() => {
  const cats = graduationCategoryBars.value
  const current = cats.reduce((sum, bar) => sum + (Number(bar.current) || 0), 0)
  const max = cats.reduce((sum, bar) => sum + (Number(bar.max) || 0), 0)
  if (batchTypeTab.value === 'GE') {
    return [
      {
        key: 'ge-grad',
        labelKey: 'courseRegistration.student.graduationElectiveProgressGe',
        current,
        max,
      },
    ]
  }
  return [
    {
      key: 'me-grad',
      labelKey: 'courseRegistration.student.graduationElectiveProgressMe',
      current,
      max,
    },
  ]
})

const CATEGORY_SHORT_KEYS = {
  humanities: 'courseRegistration.student.geDemand.short.humanities',
  business: 'courseRegistration.student.geDemand.short.business',
  science: 'courseRegistration.student.geDemand.short.science',
  aiOpen: 'courseRegistration.student.geDemand.short.aiOpen',
}

const ROUND_STATUS_LABEL_KEYS = {
  active: 'courseRegistration.student.typeEntry.roundStatusActive',
  ended: 'courseRegistration.student.typeEntry.roundStatusEnded',
  pending: 'courseRegistration.student.typeEntry.roundStatusPending',
}

/** 毕业累计文商理（次要 tip，挂在 ME 列表） */
const graduationGeTip = computed(() => {
  const bars = getGraduationGeBars()
  return bars.map((b) => `${b.current}/${b.max}`).join(' · ')
})

/**
 * 批次当前 demo 是否进行中（不看日历 end）
 * @param {object|null} batch
 * @param {string} audience
 */
function isCatalogBatchLive(batch, audience) {
  return Boolean(getStudentCurrentOpenRoundKey(batch, audience))
}

/**
 * 同类型本专业可选批：进行中排前
 * @param {'GE'|'ME'} type
 * @param {string} audience
 */
function listCatalogBatchesForType(type, audience) {
  const all = listStudentSelectableBatchesByType(type, studentProgrammeCode.value)
  return [...all].sort((a, b) => {
    const liveA = isCatalogBatchLive(a, audience) ? 0 : 1
    const liveB = isCatalogBatchLive(b, audience) ? 0 : 1
    return liveA - liveB
  })
}

/** 目录卡默认选中各类型当前开放批（优先进行中） */
watch(
  [studentAudience, studentProgrammeCode, entryTypeOrder],
  ([audience]) => {
    const next = { ...catalogBatchIdByType.value }
    let changed = false
    for (const type of entryTypeOrder.value) {
      const options = listCatalogBatchesForType(type, audience)
      if (!options.length) {
        if (next[type]) {
          next[type] = ''
          changed = true
        }
        continue
      }
      const live = options.find((batch) => isCatalogBatchLive(batch, audience))
      const preferredId = (live || options[0]).id
      const currentOk = next[type] && options.some((batch) => batch.id === next[type])
      const currentLive =
        currentOk && isCatalogBatchLive(getBatchById(next[type]), audience)
      // 无选中 / 选中已不在列表 / 选中已结束但存在进行中 → 落到进行中
      if (!currentOk || (!currentLive && live)) {
        if (next[type] !== preferredId) {
          next[type] = preferredId
          changed = true
        }
      }
    }
    if (changed) catalogBatchIdByType.value = next
  },
  { immediate: true },
)

/**
 * 目录入口卡：毕业/本学期学分 + 本专业批次 + 三轮时间轴
 */
const typeEntryCards = computed(() => {
  const audience = studentAudience.value
  const term = getTermElectiveCreditProgress()
  const meCategoryBars = getTermGeCategoryBars()
  const geCategoryBars = getTermGeElectiveCategoryBars()
  const gradGeBars = getGraduationGeBars()
  const gradMeBars = getGraduationMeBars()
  return entryTypeOrder.value.map((type) => {
    const batchOptions = listCatalogBatchesForType(type, audience).map((batch) => ({
      id: batch.id,
      name: batch.name,
      isOpen: Boolean(getStudentCurrentOpenRoundKey(batch, audience)),
    }))
    const selectedId = catalogBatchIdByType.value[type] || batchOptions[0]?.id || ''
    const batch = selectedId ? getBatchById(selectedId) : null
    const demoOpenKey = batch ? getStudentCurrentOpenRoundKey(batch, audience) : null
    const isOpen = Boolean(demoOpenKey)
    const rounds = batch ? getEffectiveAudienceRounds(batch, audience) : null
    const configured = batch ? listConfiguredRoundKeys(batch, audience) : []
    const timeline = listStudentRoundTimelineStatuses(batch, audience).map((item) => {
      const range = rounds?.[item.key]
      const releaseAt =
        item.key === 'preselect' && audience === AUDIENCE_SENIOR
          ? String(rounds?.resultReleaseAt || '').trim()
          : ''
      const releaseFormatted = releaseAt ? formatResultReleaseAt(releaseAt) : ''
      return {
        key: item.key,
        status: item.status,
        statusLabelKey: ROUND_STATUS_LABEL_KEYS[item.status] || ROUND_STATUS_LABEL_KEYS.pending,
        labelKey: ROUND_LABEL_KEYS[item.key] || ROUND_LABEL_KEYS.main,
        rangeText: formatRoundRange(range) || '—',
        releaseSubline:
          releaseFormatted && releaseFormatted !== '—'
            ? t('courseRegistration.student.typeEntry.volunteerResultRelease', {
                at: releaseFormatted,
              })
            : '',
        canEnter: item.status === 'active',
        canPreview: item.status === 'pending' && configured.includes(item.key),
      }
    })
    const graduationCategoryBars = type === 'GE' ? gradGeBars : gradMeBars
    const graduationCurrent = graduationCategoryBars.reduce((sum, bar) => sum + (Number(bar.current) || 0), 0)
    const graduationMax = graduationCategoryBars.reduce((sum, bar) => sum + (Number(bar.max) || 0), 0)
    return {
      type,
      titleKey:
        type === 'GE'
          ? 'courseRegistration.student.typeEntry.geTitle'
          : 'courseRegistration.student.typeEntry.meTitle',
      batchOptions,
      selectedBatchId: selectedId,
      isOpen,
      hasBatch: Boolean(batch) || batchOptions.length > 0,
      canEnter: isOpen,
      timeline,
      graduationCreditBar:
        type === 'GE'
          ? {
              key: 'ge-grad',
              labelKey: 'courseRegistration.student.termElectiveProgressGe',
              current: graduationCurrent,
              max: graduationMax,
            }
          : {
              key: 'me-grad',
              labelKey: 'courseRegistration.student.termElectiveProgressMe',
              current: graduationCurrent,
              max: graduationMax,
            },
      graduationCategoryBars,
      creditBar:
        type === 'GE'
          ? {
              key: 'ge',
              labelKey: 'courseRegistration.student.termElectiveProgressGe',
              current: term.ge,
              max: term.geMax,
            }
          : {
              key: 'me',
              labelKey: 'courseRegistration.student.termElectiveProgressMe',
              current: term.me,
              max: term.meMax,
            },
      categoryBars: type === 'GE' ? geCategoryBars : meCategoryBars,
    }
  })
})

/**
 * 目录卡切换同类型批次（不进入列表）
 * @param {'GE'|'ME'} type
 * @param {Event} event
 */
function handleCatalogBatchChange(type, event) {
  const id = event?.target?.value || ''
  catalogBatchIdByType.value = { ...catalogBatchIdByType.value, [type]: id }
}

/**
 * 从目录进入某类型列表（使用卡上选中的批次）
 * @param {'GE'|'ME'} type 类型
 */
function handleEnterType(type) {
  const audience = studentAudience.value
  const programmeCode = studentProgrammeCode.value
  const selectedId = catalogBatchIdByType.value[type]
  let batch = selectedId ? getBatchById(selectedId) : null
  if (!batch) {
    batch = resolveBatchForTypeEntry(type, audience, programmeCode).batch
  }
  if (!batch) {
    message.value = t('courseRegistration.student.typeEntry.noBatch')
    return
  }
  const openKey = getStudentCurrentOpenRoundKey(batch, audience)
  const displayKey = openKey || getStudentDefaultRoundKey(batch, audience)
  if (!openKey) {
    message.value = t(catalogExpiredHintKey(displayKey))
    return
  }
  message.value = ''
  catalogBatchIdByType.value = { ...catalogBatchIdByType.value, [type]: batch.id }
  setStudentSelectedBatchId(batch.id)
  selectedRound.value = openKey || getStudentDefaultRoundKey(batch, audience)
  setActiveCartRound(selectedRound.value)
  entryStep.value = 'list'
}

/** 返回 GE/ME 目录 */
function handleBackToCatalog() {
  entryStep.value = 'catalog'
  previewContext.value = null
  message.value = ''
  cancelRegisterConfirm()
}

/**
 * 待开放轮次：只读预览该轮可选课程
 * @param {'GE'|'ME'} type
 * @param {string} batchId
 * @param {string} roundKey
 */
function handlePreviewRound(type, batchId, roundKey) {
  if (!batchId || !roundKey) return
  const batch = getBatchById(batchId)
  if (!batch) return
  message.value = ''
  catalogBatchIdByType.value = { ...catalogBatchIdByType.value, [type]: batchId }
  previewContext.value = { type, batchId, roundKey }
  entryStep.value = 'preview'
}

/** 列表/预览：面包屑追加批次名 */
const breadcrumbBatchName = computed(() => {
  if (entryStep.value === 'list') return activeBatch.value?.name || ''
  if (entryStep.value === 'preview' && previewContext.value?.batchId) {
    return getBatchById(previewContext.value.batchId)?.name || ''
  }
  return ''
})

watch(
  [entryStep, breadcrumbBatchName],
  () => {
    const name = breadcrumbBatchName.value
    emit('breadcrumb-extra', name ? [name] : [])
  },
  { immediate: true },
)

watch(
  entryStep,
  (step) => {
    emit('list-active', step === 'list' || step === 'preview')
  },
  { immediate: true },
)

defineExpose({
  backToCatalog: handleBackToCatalog,
})

const schedulePreviewSlots = computed(() =>
  buildPreviewSchedule({
    required: studentRequiredCourses.value,
    confirmed: studentConfirmedCourses.value,
    cart: registrationCart.value || [],
    wishPreview: listRoundStatusCoursesForSchedule(selectedRound.value, activeBatch.value),
    currentRound: selectedRound.value,
    batch: activeBatch.value,
  }),
)

const resolvedScheduleSlots = computed(() =>
  schedulePreviewSlots.value.length ? schedulePreviewSlots.value : studentSchedule.value,
)

const scheduleSlotCount = computed(() => resolvedScheduleSlots.value.length)

const catalogCourses = computed(() =>
  allCourses.value.filter((c) => c.eligibility?.eligible !== false),
)

const schedulePreviewHint = computed(() => {
  if (selectedRound.value === 'preselect') {
    return t('courseRegistration.student.schedulePreviewPreselectHint')
  }
  return t('courseRegistration.student.schedulePreviewRegisterHint')
})

const scheduleToolbarLabel = computed(() => t('courseRegistration.student.scheduleToolbarButton'))

watch(
  shouldOpenRoundStatusDrawer,
  (open) => {
    if (!open) return
    roundStatusExpanded.value = true
    shouldOpenRoundStatusDrawer.value = false
    nextTick(() => roundStatusPanelRef.value?.scrollIntoView?.())
  },
  { immediate: true },
)

function openCatalog() {
  catalogVisible.value = true
}

function openScheduleDrawer() {
  scheduleDrawerVisible.value = true
}

const cartVisibleRows = computed(() => {
  const list = myRegistrationList.value
  // 窗外不展示排队中；待分配等仍只读可见
  if (isRoundRegistrationOpen.value) return list
  return list.filter((item) => item.status !== 'queued')
})

function patchSearchForm(patch) {
  const key = normalizeCartRoundKey(selectedRound.value)
  const current = searchByRound.value[key]
  searchByRound.value = {
    ...searchByRound.value,
    [key]: { ...current, form: { ...current.form, ...patch } },
  }
}

function handleSearch() {
  const key = normalizeCartRoundKey(selectedRound.value)
  const current = searchByRound.value[key]
  searchByRound.value = {
    ...searchByRound.value,
    [key]: { ...current, applied: { ...current.form } },
  }
}

function handleReset() {
  const key = normalizeCartRoundKey(selectedRound.value)
  searchByRound.value = {
    ...searchByRound.value,
    [key]: { form: emptySearch(), applied: emptySearch() },
  }
}

function isSectionFull(section) {
  if (!section) return true
  return Number(section.enrolled) >= Number(section.capacity)
}

function eligibilityDetailLabel(course, section) {
  if (showVolunteerSheet.value && isVolunteerListLocked()) {
    return t('courseRegistration.student.volunteerSheet.orderLocked')
  }
  if (isCourseOccupied(course.id, section?.id)) {
    return selectedRound.value === 'preselect'
      ? t('courseRegistration.student.alreadyVolunteeredHint')
      : t('courseRegistration.student.alreadyRegisteredHint')
  }
  if (!section) {
    return t('courseRegistration.student.noSectionToRegister')
  }
  const scheduleGate = getHardScheduleConflictGate(course, section)
  if (!scheduleGate.ok && scheduleGate.errorKey) {
    return t(scheduleGate.errorKey, scheduleGate.errorParams || {})
  }
  if (!course.eligibility) return '—'
  if (!course.eligibility.eligible) {
    const reason = course.eligibility.reasons[0]
    if (!reason) return t('courseRegistration.eligibility.notEligible')
    if (course.eligibility.reasons.length === 1) {
      return t(reason.key, reason.params || {})
    }
    return course.eligibility.reasons.map((item) => t(item.key, item.params || {})).join('；')
  }
  const creditGate = checkTermCreditCapForCourse(course)
  if (!creditGate.ok) {
    return t(creditGate.errorKey, creditGate.errorParams || {})
  }
  if (selectedRound.value !== 'preselect' && isSectionFull(section)) {
    return t('courseRegistration.student.sectionFull')
  }
  if (course.eligibility.prerequisiteBypassed) {
    return t('courseRegistration.eligibility.eligibleWithBypass')
  }
  return t('courseRegistration.eligibility.eligible')
}

const isPreselectRound = computed(
  () => normalizeCartRoundKey(selectedRound.value) === 'preselect',
)

const showVolunteerSheet = computed(() =>
  shouldShowVolunteerSheetPanel(selectedRound.value, studentAudience.value),
)

/** 容量列表头：第一轮为课程已选百分比 */
const capacityColumnLabel = computed(() =>
  isPreselectRound.value
    ? t('courseRegistration.courses.volunteerSelectedPercent')
    : t('courseRegistration.courses.enrolled'),
)

/**
 * 分组志愿人数（依赖 volunteerCourseStates 以便提交后刷新）
 * @param {object} course 课程
 * @param {object|null} section 分组
 */
function sectionVolunteerCount(course, section) {
  void volunteerCourseStates.value
  if (!course?.id || !section?.id) return 0
  const state = getVolunteerSectionState(course.id, section.id)
  return state?.volunteers?.length || 0
}

function sectionCapacityLabel(course, section) {
  if (!section) return '—'
  if (isPreselectRound.value) {
    const volunteers = sectionVolunteerCount(course, section)
    const cap = Number(section.capacity) || 0
    if (cap <= 0) return '—'
    return `${Math.round((volunteers / cap) * 100)}%`
  }
  return `${section.enrolled}/${section.capacity}`
}

/**
 * 容量胶囊色：第一轮按志愿热度绿/黄/红；其它轮次仍绿/红
 * @param {object} course 课程
 * @param {object|null} section 分组
 */
function sectionCapacityClass(course, section) {
  if (!section) return ''
  if (isPreselectRound.value) {
    const volunteers = sectionVolunteerCount(course, section)
    const cap = Number(section.capacity) || 0
    if (cap <= 0) return 'capacity-open'
    if (volunteers < cap) return 'capacity-open'
    if (volunteers <= cap * 2) return 'capacity-warn'
    return 'capacity-full'
  }
  return isSectionFull(section) ? 'capacity-full' : 'capacity-open'
}

function sectionGroupName(section) {
  if (!section) return '—'
  return t('courseRegistration.courses.sectionNameDisplay', { code: section.code })
}

function canRegisterRow(course, section) {
  if (!isRoundRegistrationOpen.value) return false
  if (!section || !course.eligibility?.eligible) return false
  if (showVolunteerSheet.value) {
    if (isVolunteerListLocked()) return false
    if (isCourseOccupied(course.id, section.id)) return false
    if (!getHardScheduleConflictGate(course, section).ok) return false
    return checkTermCreditCapForCourse(course).ok
  }
  if (isCourseOccupied(course.id, section.id)) return false
  if (!getHardScheduleConflictGate(course, section).ok) return false
  if (!checkTermCreditCapForCourse(course).ok) return false
  if (selectedRound.value === 'preselect') return true
  return !isSectionFull(section)
}

/**
 * 不可提交时是否展示左侧感叹号 tip（窗口内凡不可提交的行均展示）
 * @param {object} course 课程
 * @param {object|null} section 分组
 */
function showRegisterBlockedTip(course, section) {
  return showActionsColumn.value && !canRegisterRow(course, section)
}

/** @deprecated 已由「每行提交按钮 + showRegisterBlockedTip」替代；保留避免外部误引用断裂 */
function hasIndividualBlockedReason(course, section) {
  if (!course.eligibility?.eligible) return true
  if (selectedRound.value !== 'preselect' && isSectionFull(section)) return true
  return false
}

/** @deprecated 见 showRegisterBlockedTip */
function showBlockedReasonAction(course, section) {
  return showRegisterBlockedTip(course, section)
}

function applyCreditsFilter(value) {
  const key = normalizeCartRoundKey(selectedRound.value)
  const current = searchByRound.value[key]
  const nextForm = { ...current.form, credits: value }
  searchByRound.value = {
    ...searchByRound.value,
    [key]: {
      form: nextForm,
      applied: { ...current.applied, credits: value },
    },
  }
  closeCreditsFilter()
}

const confirmRegisterMessage = computed(() => {
  const course = pendingRegister.value?.course
  const section = pendingRegister.value?.section
  const isVolunteer = selectedRound.value === 'preselect'
  if (!course || !section) {
    return t(
      isVolunteer
        ? 'courseRegistration.student.volunteerConfirmMessage'
        : 'courseRegistration.student.registerConfirmMessage',
    )
  }
  return t(
    isVolunteer
      ? 'courseRegistration.student.volunteerConfirmMessageDetail'
      : 'courseRegistration.student.registerConfirmMessageDetail',
    {
      course: `${course.code} ${course.name}`,
      section: t('courseRegistration.courses.sectionNameDisplay', { code: section.code }),
    },
  )
})

const registerActionLabel = computed(() =>
  showVolunteerSheet.value || selectedRound.value === 'preselect'
    ? t('courseRegistration.student.volunteerNow')
    : t('courseRegistration.student.registerNow'),
)

const confirmRegisterTitle = computed(() =>
  showVolunteerSheet.value || selectedRound.value === 'preselect'
    ? t('courseRegistration.student.submitVolunteerTitle')
    : t('courseRegistration.student.confirmRegister'),
)

function handleRegisterRow(course, section) {
  if (!canRegisterRow(course, section) || submitting.value) return
  pendingRegister.value = { course, section }
  confirmRegisterVisible.value = true
  message.value = ''
}

function cancelRegisterConfirm() {
  confirmRegisterVisible.value = false
  pendingRegister.value = null
}

function confirmRegisterSubmit() {
  const course = pendingRegister.value?.course
  const section = pendingRegister.value?.section
  confirmRegisterVisible.value = false
  pendingRegister.value = null
  if (!course || !section || !canRegisterRow(course, section) || submitting.value) return
  submitting.value = true
  message.value = ''
  const result = submitSingleCourseRegistration(course, section)
  submitting.value = false
  if (!result.ok && result.errorKey) {
    message.value = t(result.errorKey, result.errorParams || {})
    return
  }
  if (result.volunteered) {
    message.value = ''
    return
  }
  message.value = ''
}
</script>

<template>
  <StudentPageShell>
    <!-- A2：GE / ME 分入口目录 -->
    <div v-if="entryStep === 'catalog'" class="page-card cr-type-entry">
      <section class="cr-type-entry-section">
        <h3 class="cr-type-entry-title">{{ t('courseRegistration.student.typeEntry.studentInfo') }}</h3>
        <table class="cr-type-entry-profile" aria-label="student profile">
          <thead>
            <tr>
              <th>{{ t('courseRegistration.student.fieldStudentId') }}</th>
              <th>{{ t('courseRegistration.student.fieldStudentName') }}</th>
              <th>{{ t('courseRegistration.student.fieldProgramme') }}</th>
              <th>{{ t('courseRegistration.student.typeEntry.grade') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ entryStudentProfile.studentId }}</td>
              <td>{{ entryStudentProfile.studentName }}</td>
              <td>{{ entryStudentProfile.programme }}</td>
              <td class="nowrap">{{ entryStudentProfile.grade }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="cr-type-entry-section">
        <h3 class="cr-type-entry-title">{{ t('courseRegistration.student.typeEntry.title') }}</h3>
        <p class="cr-type-entry-hint">{{ t('courseRegistration.student.typeEntry.hint') }}</p>
        <div class="cr-type-entry-grid" :class="{ 'is-single': !showGeTypeEntry }">
        <div
          v-for="card in typeEntryCards"
          :key="card.type"
          class="cr-type-entry-card"
        >
          <div class="cr-type-entry-card-head">
            <span class="cr-type-entry-card-title">{{ t(card.titleKey) }}</span>
          </div>
          <dl class="cr-type-entry-meta">
            <div>
              <dt>{{ t('courseRegistration.student.typeEntry.graduationCredits') }}</dt>
              <dd class="cr-type-entry-credits">
                <span
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(card.graduationCreditBar)"
                >
                  {{ t(card.graduationCreditBar.labelKey) }}
                  {{ card.graduationCreditBar.current }}/{{ card.graduationCreditBar.max }}
                </span>
                <span
                  v-for="bar in card.graduationCategoryBars"
                  :key="`grad-${bar.key}`"
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(bar)"
                >
                  {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
                </span>
              </dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.student.typeEntry.credits') }}</dt>
              <dd class="cr-type-entry-credits">
                <span
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(card.creditBar)"
                >
                  {{ t(card.creditBar.labelKey) }} {{ card.creditBar.current }}/{{ card.creditBar.max }}
                </span>
                <span
                  v-for="bar in card.categoryBars"
                  :key="bar.key"
                  class="cr-credit-capsule"
                  :class="creditCapsuleTone(bar)"
                >
                  {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
                </span>
              </dd>
            </div>
            <div v-if="card.batchOptions.length">
              <dt>{{ t('courseRegistration.student.typeEntry.batchLabel') }}</dt>
              <dd>
                <select
                  class="cr-type-entry-batch-select"
                  :value="card.selectedBatchId"
                  :aria-label="t('courseRegistration.student.typeEntry.batchLabel')"
                  @click.stop
                  @change="handleCatalogBatchChange(card.type, $event)"
                >
                  <option v-for="opt in card.batchOptions" :key="opt.id" :value="opt.id">
                    {{ opt.name }}
                  </option>
                </select>
              </dd>
            </div>
            <div>
              <dt>{{ t('courseRegistration.student.typeEntry.roundLabel') }}</dt>
              <dd>
                <ol class="cr-type-entry-timeline" aria-label="registration rounds">
                  <li
                    v-for="(round, idx) in card.timeline"
                    :key="round.key"
                    class="cr-type-entry-timeline-item"
                    :class="`is-${round.status}`"
                  >
                    <span class="cr-type-entry-timeline-rail" aria-hidden="true">
                      <span class="cr-type-entry-timeline-dot" />
                      <span
                        v-if="idx < card.timeline.length - 1"
                        class="cr-type-entry-timeline-line"
                      />
                    </span>
                    <div class="cr-type-entry-timeline-body">
                      <div class="cr-type-entry-timeline-content">
                        <div class="cr-type-entry-timeline-main">
                          <span class="cr-type-entry-timeline-title">{{ t(round.labelKey) }}</span>
                          <span class="cr-type-entry-timeline-range">{{ round.rangeText }}</span>
                          <span class="cr-type-entry-round-badge" :class="`is-${round.status}`">
                            {{ t(round.statusLabelKey) }}
                          </span>
                        </div>
                        <p v-if="round.releaseSubline" class="cr-type-entry-timeline-sub">
                          {{ round.releaseSubline }}
                        </p>
                      </div>
                      <div
                        v-if="round.canEnter || round.canPreview"
                        class="cr-type-entry-timeline-actions"
                      >
                        <button
                          v-if="round.canPreview"
                          type="button"
                          class="btn btn-default cr-type-entry-row-cta"
                          @click="handlePreviewRound(card.type, card.selectedBatchId, round.key)"
                        >
                          {{ t('courseRegistration.student.typeEntry.viewCourses') }}
                        </button>
                        <button
                          v-if="round.canEnter"
                          type="button"
                          class="btn btn-primary cr-type-entry-row-cta"
                          @click="handleEnterType(card.type)"
                        >
                          {{ t('courseRegistration.student.typeEntry.enter') }}
                        </button>
                      </div>
                    </div>
                  </li>
                </ol>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      </section>
    </div>

    <div v-else-if="entryStep === 'preview' && previewContext" class="page-card">
      <StudentPendingRoundPreviewPanel
        :batch-id="previewContext.batchId"
        :round-key="previewContext.roundKey"
      />
    </div>

    <template v-else>
    <!-- 学分规则 Callout 已按密度需求移除；校验仍走规则数据 -->

    <div class="page-card">
      <div class="cr-student-register-layout">
        <CourseRegistrationCallout v-if="!activeBatch" variant="warning">
          <p>{{ t('courseRegistration.student.typeEntry.noOpenBatch') }}</p>
        </CourseRegistrationCallout>
        <CourseRegistrationCallout v-else-if="!canOperateRegistration" variant="warning">
          <p>{{ t('courseRegistration.student.roundOutsideWindow') }}</p>
        </CourseRegistrationCallout>

        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.code') }}</label>
                <input
                  :value="searchForm.keyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.student.searchPlaceholder')"
                  @input="patchSearchForm({ keyword: $event.target.value })"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.type') }}</label>
                <select
                  :value="searchForm.type"
                  class="search-select"
                  @change="patchSearchForm({ type: $event.target.value })"
                >
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="opt in courseTypeOptions" :key="opt.value" :value="opt.value">
                    {{ t(opt.labelKey) }}
                  </option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.enrolled') }}</label>
                <select
                  :value="searchForm.availability"
                  class="search-select"
                  @change="patchSearchForm({ availability: $event.target.value })"
                >
                  <option value="">{{ t('common.all') }}</option>
                  <option value="open">{{ t('courseRegistration.waitlist.courseStatus.open') }}</option>
                  <option value="full">{{ t('courseRegistration.waitlist.courseStatus.full') }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.credits') }}</label>
                <select
                  :value="searchForm.credits"
                  class="search-select"
                  @change="patchSearchForm({ credits: $event.target.value })"
                >
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="credit in creditFilterOptions" :key="credit" :value="String(credit)">
                    {{ credit }}
                  </option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.prerequisites') }}</label>
                <select
                  :value="searchForm.prerequisites"
                  class="search-select"
                  @change="patchSearchForm({ prerequisites: $event.target.value })"
                >
                  <option value="">{{ t('common.all') }}</option>
                  <option value="none">{{ t('courseRegistration.student.prerequisiteNone') }}</option>
                  <option v-for="code in prerequisiteFilterOptions" :key="code" :value="code">
                    {{ code }}
                  </option>
                </select>
              </div>
            </div>
            <div class="search-actions">
              <button type="button" class="btn btn-primary btn-primary--vivid" @click="handleSearch">
                {{ t('common.search') }}
              </button>
              <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
            </div>
          </div>
        </div>

        <div class="cr-student-cart-toolbar">
          <div class="cr-student-cart-toolbar-actions">
            <button type="button" class="cr-catalog-trigger" @click="openCatalog">
              {{ t('courseRegistration.student.courseCatalogButton') }}
            </button>
            <button
              type="button"
              class="btn btn-default cr-schedule-trigger"
              :class="{ 'has-slots': scheduleSlotCount > 0 }"
              @click="openScheduleDrawer"
            >
              {{ scheduleToolbarLabel }}
            </button>
            <span class="hint-popover-wrap cr-cart-round-hint" :title="myCoursesTip">
              <span
                class="hint-popover-trigger"
                tabindex="0"
                role="button"
                :aria-label="myCoursesTip"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                  />
                </svg>
              </span>
              <span class="hint-popover-content hint-popover-content--sm cr-cart-round-tip" role="tooltip">
                {{ myCoursesTip }}
              </span>
            </span>
            <p v-if="message" class="cr-student-message cr-student-toolbar-message">
              {{ message }}
            </p>
          </div>
          <div
            class="cr-list-context-progress"
            aria-label="credit progress"
            :title="
              batchTypeTab === 'ME'
                ? t('courseRegistration.student.graduationGe.tipCumulative', {
                    detail: graduationGeTip,
                  })
                : undefined
            "
          >
            <span
              v-for="bar in graduationElectiveBars"
              :key="bar.key"
              class="cr-credit-capsule"
              :class="creditCapsuleTone(bar)"
            >
              {{ t(bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
            </span>
            <template v-if="graduationCategoryBars.length">
              <span class="cr-list-context-sep" aria-hidden="true">|</span>
              <span
                v-for="bar in graduationCategoryBars"
                :key="`grad-${bar.key}`"
                class="cr-credit-capsule"
                :class="creditCapsuleTone(bar)"
              >
                {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
              </span>
            </template>
            <span class="cr-list-context-sep" aria-hidden="true">|</span>
            <span
              v-for="bar in termElectiveBars"
              :key="bar.key"
              class="cr-credit-capsule"
              :class="creditCapsuleTone(bar)"
            >
              {{ t(bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
            </span>
            <template v-if="termCategoryBars.length">
              <span class="cr-list-context-sep" aria-hidden="true">|</span>
              <span
                v-for="bar in termCategoryBars"
                :key="bar.key"
                class="cr-credit-capsule"
                :class="creditCapsuleTone(bar)"
              >
                {{ t(CATEGORY_SHORT_KEYS[bar.key] || bar.labelKey) }} {{ bar.current }}/{{ bar.max }}
              </span>
            </template>
          </div>
        </div>

        <StudentRegistrationRoundStatusPanel
          ref="roundStatusPanelRef"
          v-model:expanded="roundStatusExpanded"
          :round-open="isRoundRegistrationOpen"
          :show-volunteer-order="showVolunteerSheet"
          :message="message"
        />

        <div class="table-section">
          <div class="table-scroll">
            <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.courses.code') }}</th>
                  <th>{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.type') }}</th>
                  <th class="th-with-tip">
                    <span class="th-label-with-tip">
                      {{ t('courseRegistration.courses.schoolElectiveCategory') }}
                      <span
                        class="hint-popover-wrap"
                        :title="t('courseRegistration.courses.schoolElectiveCategoryTip')"
                      >
                        <span
                          class="hint-popover-trigger"
                          tabindex="0"
                          role="button"
                          :aria-label="t('courseRegistration.courses.schoolElectiveCategoryTip')"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path
                              d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                            />
                          </svg>
                        </span>
                        <span
                          class="hint-popover-content hint-popover-content--sm"
                          role="tooltip"
                        >
                          {{ t('courseRegistration.courses.schoolElectiveCategoryTip') }}
                        </span>
                      </span>
                    </span>
                  </th>
                  <th class="th-credits-filter">
                    <span>{{ t('courseRegistration.courses.credits') }}</span>
                    <span
                      class="hint-popover-wrap th-funnel-wrap"
                      :class="{ 'is-active': creditsFilterActive, 'is-open': creditsFilterOpen }"
                      @click.stop
                    >
                      <button
                        type="button"
                        class="th-funnel-btn"
                        :aria-expanded="creditsFilterOpen"
                        :aria-label="t('courseRegistration.student.creditsFilter')"
                        :title="t('courseRegistration.student.creditsFilter')"
                        @click="toggleCreditsFilter"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path
                            d="M1.5 2h13a.5.5 0 0 1 .4.8L10 8.2V13a.5.5 0 0 1-.8.4l-2-1.5A.5.5 0 0 1 7 11.5V8.2L1.1 2.8A.5.5 0 0 1 1.5 2z"
                          />
                        </svg>
                      </button>
                      <span
                        class="hint-popover-content hint-popover-content--sm th-funnel-panel"
                        role="menu"
                      >
                        <button
                          type="button"
                          class="th-funnel-option"
                          :class="{ active: !appliedSearch.credits }"
                          @click="applyCreditsFilter('')"
                        >
                          {{ t('common.all') }}
                        </button>
                        <button
                          v-for="credit in creditFilterOptions"
                          :key="credit"
                          type="button"
                          class="th-funnel-option"
                          :class="{ active: String(appliedSearch.credits) === String(credit) }"
                          @click="applyCreditsFilter(String(credit))"
                        >
                          {{ credit }}
                        </button>
                      </span>
                    </span>
                  </th>
                  <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                  <th v-if="showSelectionGroupColumn" class="th-with-tip">
                    <span class="th-label-with-tip">
                      {{ t('courseRegistration.courses.selectionGroup') }}
                      <span
                        class="hint-popover-wrap"
                        :title="t('courseRegistration.courses.selectionGroupTip')"
                      >
                        <span
                          class="hint-popover-trigger"
                          tabindex="0"
                          role="button"
                          :aria-label="t('courseRegistration.courses.selectionGroupTip')"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path
                              d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                            />
                          </svg>
                        </span>
                        <span
                          class="hint-popover-content hint-popover-content--sm"
                          role="tooltip"
                        >
                          {{ t('courseRegistration.courses.selectionGroupTip') }}
                        </span>
                      </span>
                    </span>
                  </th>
                  <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                  <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                  <th>{{ t('courseRegistration.courses.prerequisites') }}</th>
                  <th class="th-capacity">{{ capacityColumnLabel }}</th>
                  <th v-if="showSelectionGroupColumn">{{ t('courseRegistration.courses.remark') }}</th>
                  <th v-if="showActionsColumn">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in pagedRows"
                  :key="`${row.course.id}-${row.section?.id || 'none'}`"
                  :class="selectionGroupRowClass(row.selectionGroup)"
                >
                  <td v-if="spanCell(row, 'serial')?.show" :rowspan="spanCell(row, 'serial').rowspan">
                    {{ spanCell(row, 'serial').value }}
                  </td>
                  <td
                    v-if="spanCell(row, 'code')?.show"
                    class="nowrap"
                    :rowspan="spanCell(row, 'code').rowspan"
                  >
                    <CourseCodeSourcePopover :code="row.course.code" :course="row.course" />
                  </td>
                  <td
                    v-if="spanCell(row, 'name')?.show"
                    class="nowrap"
                    :rowspan="spanCell(row, 'name').rowspan"
                  >
                    {{ row.course.name }}
                  </td>
                  <td
                    v-if="spanCell(row, 'type')?.show"
                    class="nowrap"
                    :rowspan="spanCell(row, 'type').rowspan"
                  >
                    {{ getRegistrationTypeLabel(row.course.type, t) }}
                  </td>
                  <td
                    v-if="spanCell(row, 'schoolCat')?.show"
                    class="nowrap"
                    :rowspan="spanCell(row, 'schoolCat').rowspan"
                  >
                    {{ courseSchoolElectiveLabel(row.course) }}
                  </td>
                  <td v-if="spanCell(row, 'credits')?.show" :rowspan="spanCell(row, 'credits').rowspan">
                    {{ row.course.credits }}
                  </td>
                  <td class="nowrap">{{ sectionGroupName(row.section) }}</td>
                  <td
                    v-if="showSelectionGroupColumn && spanCell(row, 'selectionGroup')?.show"
                    class="cr-selection-group-cell"
                    :rowspan="spanCell(row, 'selectionGroup').rowspan"
                  >
                    <template v-if="row.selectionGroup">
                      <div class="cr-selection-group-title">
                        {{ selectionGroupDisplayLines(row.selectionGroup).title }}
                      </div>
                      <div class="cr-selection-group-intake">
                        {{ selectionGroupDisplayLines(row.selectionGroup).intakeLine }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="nowrap td-lecturer">{{ row.section?.lecturer || '—' }}</td>
                  <td class="nowrap">{{ row.section ? displayWeekRange(row.section) : '—' }}</td>
                  <td class="cr-time-venue">
                    <template v-if="row.section">
                      <div
                        v-for="(line, li) in displayClassTimeVenueLines(row.section, isZh ? 'zh' : 'en')"
                        :key="li"
                        class="cr-time-venue-line"
                      >
                        {{ line }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td
                    v-if="spanCell(row, 'prerequisites')?.show"
                    class="nowrap"
                    :rowspan="spanCell(row, 'prerequisites').rowspan"
                  >
                    {{ row.course.prerequisites?.join(', ') || '—' }}
                  </td>
                  <td class="nowrap td-capacity">
                    <span
                      v-if="row.section"
                      class="capacity-pill"
                      :class="sectionCapacityClass(row.course, row.section)"
                    >
                      {{ sectionCapacityLabel(row.course, row.section) }}
                    </span>
                    <template v-else>—</template>
                  </td>
                  <td
                    v-if="showSelectionGroupColumn && spanCell(row, 'remark')?.show"
                    class="cr-selection-group-remark"
                    :rowspan="spanCell(row, 'remark').rowspan"
                  >
                    {{ selectionGroupRemarkText(row) }}
                  </td>
                  <td v-if="showActionsColumn" class="cr-student-actions">
                    <div class="actions-inner">
                      <!-- 课号点开来源小弹层；操作列保留选课按钮 -->
                      <!-- 左侧 tip 槽固定占位，保证提交按钮纵向对齐 -->
                      <span class="cr-action-tip-slot">
                        <span
                          v-if="showRegisterBlockedTip(row.course, row.section)"
                          class="hint-popover-wrap cr-blocked-warn"
                        >
                          <span
                            class="hint-popover-trigger cr-blocked-warn-icon"
                            tabindex="0"
                            role="img"
                            :aria-label="eligibilityDetailLabel(row.course, row.section)"
                          >
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                              <path
                                d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM7.25 4.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4zm.75 7.25a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z"
                              />
                            </svg>
                          </span>
                          <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                            {{ eligibilityDetailLabel(row.course, row.section) }}
                          </span>
                        </span>
                      </span>
                      <button
                        type="button"
                        class="btn-register-now"
                        :class="{
                          'btn-register-now--disabled': !canRegisterRow(row.course, row.section),
                        }"
                        :disabled="submitting || !canRegisterRow(row.course, row.section)"
                        @click="handleRegisterRow(row.course, row.section)"
                      >
                        {{ registerActionLabel }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!pagedRows.length">
                  <td :colspan="emptyTableColspan" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCourseCount"
          />
        </div>
      </div>
    </div>
    </template>

    <StudentCourseCatalogDrawer
      :visible="catalogVisible"
      :courses="catalogCourses"
      @close="catalogVisible = false"
    />

    <ApplicationDetailDrawer
      :visible="scheduleDrawerVisible"
      :title="t('courseRegistration.student.schedulePreviewTitle')"
      :subtitle="schedulePreviewHint"
      dense
      fill-body
      @close="scheduleDrawerVisible = false"
    >
      <StudentSchedulePreviewPanel
        embedded
        :schedule="resolvedScheduleSlots"
      />
      <template #footer>
        <button type="button" class="btn btn-primary" @click="scheduleDrawerVisible = false">
          {{ t('common.close') }}
        </button>
      </template>
    </ApplicationDetailDrawer>

    <ConfirmDialog
      :visible="confirmRegisterVisible"
      :title="confirmRegisterTitle"
      :message="confirmRegisterMessage"
      :confirm-text="confirmRegisterTitle"
      :cancel-text="t('common.cancel')"
      confirm-variant="primary"
      @confirm="confirmRegisterSubmit"
      @cancel="cancelRegisterConfirm"
    />
  </StudentPageShell>
</template>

<style scoped>
.table-scroll {
  overflow: auto;
  max-height: min(70vh, 720px);
  border: 1px solid #f3f4f6;
  border-radius: 8px;
}

.table-section .data-table td[rowspan] {
  vertical-align: middle;
}

.th-label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.table-section .table-wrap {
  overflow: visible;
  border: none;
  border-radius: 0;
}

.table-section .data-table {
  min-width: 1240px;
}

.table-section .data-table th,
.table-section .data-table td {
  padding: 4px 7px;
  line-height: 1.3;
  vertical-align: middle;
}

.table-section .data-table .nowrap {
  white-space: nowrap;
}

.cr-selection-group-cell {
  font-weight: 500;
  color: #374151;
  text-align: center;
  line-height: 1.3;
  min-width: 132px;
  max-width: 140px;
  padding-left: 4px;
  padding-right: 4px;
}

.cr-selection-group-title {
  width: 100%;
  text-align: center;
  white-space: nowrap;
}

.cr-selection-group-intake {
  font-size: 10px;
  font-weight: 400;
  color: #4b5563;
  margin-top: 2px;
  white-space: nowrap;
}

.td-lecturer {
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-selection-group-remark {
  min-width: 108px;
  max-width: 132px;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  vertical-align: middle;
  white-space: normal;
  word-break: break-word;
  color: #374151;
}

.cr-time-venue {
  min-width: 160px;
  max-width: 228px;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
}

.cr-time-venue-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
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

/* 选课课程组：浅蓝 / 浅黄交替底色；无左边条 */
.cr-selection-group-row--tone-0 > td {
  background: #dbeafe;
}

.cr-selection-group-row--tone-1 > td {
  background: #fef9c3;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.table-section .data-table th {
  padding-top: 5px;
  padding-bottom: 5px;
  white-space: nowrap;
}

.th-capacity {
  background: #f1f5f9 !important;
  min-width: 7.5em;
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

.th-credits-filter {
  position: relative;
  z-index: 5;
  white-space: nowrap;
}

.th-funnel-wrap {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 4px;
  z-index: 6;
}

.th-funnel-wrap.is-open {
  z-index: 30;
}

.th-funnel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
}

.th-funnel-wrap.is-active .th-funnel-btn,
.th-funnel-wrap.is-open .th-funnel-btn,
.th-funnel-btn:hover {
  color: #1d4ed8;
  background: #eff6ff;
}

.th-funnel-btn svg {
  width: 14px;
  height: 14px;
}

.th-funnel-panel {
  display: none;
  flex-direction: column;
  gap: 2px;
  min-width: 88px;
  padding: 6px !important;
  top: calc(100% + 4px);
  left: 0;
  transform: none;
  z-index: 40;
}

.th-funnel-wrap.hint-popover-wrap:hover .th-funnel-panel,
.th-funnel-wrap.hint-popover-wrap:focus-within .th-funnel-panel {
  display: none;
}

.th-funnel-wrap.is-open .th-funnel-panel,
.th-funnel-wrap.is-open.hint-popover-wrap:hover .th-funnel-panel,
.th-funnel-wrap.is-open.hint-popover-wrap:focus-within .th-funnel-panel {
  display: flex;
}

.th-funnel-option {
  appearance: none;
  border: none;
  background: transparent;
  text-align: left;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.th-funnel-option:hover,
.th-funnel-option.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.cr-blocked-warn {
  display: inline-flex;
  align-items: center;
  position: relative;
  z-index: 20;
}

.cr-blocked-warn-icon {
  display: inline-flex;
  color: #dc2626;
}

.cr-blocked-warn-icon svg {
  width: 16px;
  height: 16px;
}

.cr-blocked-warn .hint-popover-content {
  top: auto;
  bottom: calc(100% + 6px);
  left: auto;
  right: 0;
  transform: none;
  z-index: 50;
}

.cr-blocked-warn::after {
  top: auto;
  bottom: 100%;
  height: 8px;
}

.btn-primary--vivid {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  color: #fff !important;
  font-weight: 600;
}

.btn-register-now {
  appearance: none;
  border: none;
  background: #1d4ed8;
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1.4;
}

.btn-register-now:disabled,
.btn-register-now--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background: #9ca3af;
}

.cr-cart-round-hint {
  display: inline-flex;
  align-items: center;
}

.cr-cart-round-hint .hint-popover-trigger svg {
  width: 14px;
  height: 14px;
  color: #9ca3af;
}

.cr-cart-round-hint :deep(.cr-cart-round-tip) {
  left: 0;
  right: auto;
  transform: none;
  min-width: 220px;
  max-width: min(420px, 92vw);
  white-space: normal;
  word-break: break-word;
}

.col-teaching-groups {
  max-width: 220px;
  font-size: 12px;
  color: #4b5563;
  white-space: normal;
  word-break: break-word;
}

.cr-list-context-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px 10px;
  padding: 6px 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.cr-list-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 2px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  border-radius: 6px;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.cr-list-back-btn:hover {
  color: #2563eb;
}

.cr-list-back-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.cr-list-context-selects {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px 16px;
  min-width: 0;
  flex: 0 0 auto;
  margin-left: 0;
}

.cr-list-context-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin: 0;
  cursor: pointer;
}

.cr-list-context-field-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.cr-list-context-select {
  flex: 0 0 auto;
  width: 460px;
  max-width: 460px;
  box-sizing: border-box;
}

.cr-list-context-select.cr-list-context-select--round {
  width: 380px;
  max-width: 380px;
}

.cr-list-context-progress {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px 10px;
  margin-left: auto;
  font-size: 12px;
  color: #4b5563;
  font-variant-numeric: tabular-nums;
}

.cr-list-context-sep {
  color: #d1d5db;
}

.cr-catalog-trigger {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 32px;
  padding: 0 14px;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  background: #eff6ff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: #1d4ed8;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.cr-catalog-trigger:hover {
  background: #dbeafe;
  border-color: #60a5fa;
}

.cr-credit-capsule {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  border: 1px solid transparent;
}

.cr-credit-capsule.is-short {
  color: #9a3412;
  background: #ffedd5;
  border-color: #fdba74;
}

.cr-credit-capsule.is-met {
  color: #065f46;
  background: #d1fae5;
  border-color: #6ee7b7;
}

.cr-credit-capsule.is-over {
  color: #991b1b;
  background: #fee2e2;
  border-color: #fca5a5;
  font-weight: 600;
}

.cr-credit-capsule.is-neutral {
  color: #4b5563;
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.cr-type-entry {
  padding: 16px 20px 20px;
}

.cr-type-entry-section + .cr-type-entry-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.cr-type-entry-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.cr-type-entry-profile {
  width: 100%;
  margin: 0;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.cr-type-entry-profile th,
.cr-type-entry-profile td {
  padding: 8px 12px;
  border: 1px solid #bfdbfe;
  text-align: left;
  vertical-align: middle;
  word-break: break-word;
}

.cr-type-entry-profile thead th {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
  border-color: #bfdbfe;
}

.cr-type-entry-profile tbody td {
  background: #f8fafc;
  color: #1f2937;
}

.cr-type-entry-profile .nowrap {
  white-space: nowrap;
}

.cr-type-entry-hint {
  margin: 0 0 13px;
  font-size: 13px;
  color: #6b7280;
}

.cr-type-entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.cr-type-entry-grid.is-single {
  grid-template-columns: minmax(0, 1fr);
  max-width: calc(50% - 8px);
}

.cr-type-entry-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  min-height: 310px;
  padding: 15px 15px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.cr-type-entry-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.12);
}

.cr-type-entry-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cr-type-entry-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.cr-type-entry-meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 12px;
  flex: 1 1 auto;
}

.cr-type-entry-meta dt {
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 1px;
}

.cr-type-entry-meta dd {
  margin: 2px 0 0;
  color: #374151;
  line-height: 1.4;
}

.cr-type-entry-hint-text {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.cr-type-entry-credits {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cr-type-entry-batch-select {
  width: 100%;
  max-width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #374151;
}

/* 列表顶栏：覆盖入口卡 100% 宽，固定同行宽度 */
.cr-list-context-bar .cr-list-context-select {
  width: 460px;
  max-width: 460px;
  flex: 0 0 auto;
}

.cr-list-context-bar .cr-list-context-select--round {
  width: 380px;
  max-width: 380px;
}

.cr-type-entry-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.cr-type-entry-timeline-item {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 8px;
  align-items: stretch;
  min-height: 44px;
}

.cr-type-entry-timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  min-height: 100%;
  padding-top: 0;
}

.cr-type-entry-timeline-dot {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  margin-bottom: 0;
  border-radius: 50%;
  background: #9ca3af;
  flex-shrink: 0;
}

.cr-type-entry-timeline-item.is-active .cr-type-entry-timeline-dot {
  background: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.16);
}

.cr-type-entry-timeline-item.is-ended .cr-type-entry-timeline-dot {
  background: #9ca3af;
}

.cr-type-entry-timeline-item.is-pending .cr-type-entry-timeline-dot {
  background: #3b82f6;
}

.cr-type-entry-timeline-line {
  flex: 1;
  width: 2px;
  margin-top: 4px;
  margin-bottom: 0;
  background: #e5e7eb;
  min-height: 12px;
}

.cr-type-entry-timeline-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 12px;
  min-width: 0;
}

.cr-type-entry-timeline-content {
  flex: 1;
  min-width: 0;
}

.cr-type-entry-timeline-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  min-width: 0;
}

.cr-type-entry-timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
}

.cr-type-entry-timeline-range {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
}

.cr-type-entry-timeline-sub {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  line-height: 1.45;
}

.cr-type-entry-row-cta {
  margin-top: 2px;
}

.cr-type-entry-timeline-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.cr-type-entry-round-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.cr-type-entry-round-badge.is-active {
  color: #047857;
  background: #d1fae5;
}

.cr-type-entry-round-badge.is-ended {
  color: #4b5563;
  background: #e5e7eb;
}

.cr-type-entry-round-badge.is-pending {
  color: #1d4ed8;
  background: #dbeafe;
}

.cr-type-entry-row-cta {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 860px) {
  .cr-type-entry-grid {
    grid-template-columns: 1fr;
  }

  .cr-type-entry-grid.is-single {
    max-width: none;
  }

  .cr-type-entry-card {
    min-height: 0;
  }

  .cr-type-entry-timeline-body {
    flex-wrap: wrap;
  }

  .cr-list-context-bar {
    flex-wrap: wrap;
  }

  .cr-list-context-selects {
    flex-wrap: wrap;
    width: 100%;
    margin-left: 0;
  }

  .cr-list-context-field {
    width: 100%;
  }

  .cr-list-back-btn {
    margin-left: 0;
  }

  .cr-list-context-bar .cr-list-context-select,
  .cr-list-context-bar .cr-list-context-select--round {
    width: 100%;
    max-width: none;
    flex: 1 1 auto;
  }

  .cr-list-context-progress {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.cr-schedule-trigger.has-slots {
  border-color: #93c5fd;
  color: #1d4ed8;
}
</style>
