<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import StudentCourseDetailDrawer from '../../../components/courseRegistration/StudentCourseDetailDrawer.vue'
import StudentRegistrationCartDrawer from '../../../components/courseRegistration/StudentRegistrationCartDrawer.vue'
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
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import {
  getStudentCreditSummary,
  filterStudentCourseList,
  filterCoursesByRound,
  getRoundTimeline,
} from '../../../data/courseRegistration/studentRegistrationContext.js'
import {
  getActiveBatch,
  activeBatchTypePreference,
  formatRoundRange,
  isBatchRoundOpenForRegistration,
  listStudentSelectableBatches,
  ensureStudentBatchSelection,
  setStudentSelectedBatchId,
  studentSelectedBatchId,
  getStudentDefaultRoundKey,
  isRoundTimeConfigured,
} from '../../../data/courseRegistration/registrationBatches.js'
import {
  getVolunteerSectionState,
  volunteerCourseStates,
} from '../../../data/courseRegistration/preselectVolunteerConfirm.js'
import {
  LONG_SEMESTER_CREDIT_MIN,
  LONG_SEMESTER_CREDIT_MAX,
  RESUMPTION_CREDIT_MAX,
} from '../../../data/courseRegistration/registrationRules.js'
import { courseTypeOptions, getRegistrationTypeLabel } from '../../../data/courseRegistration/registrationTypes.js'
import { displayClassTime, displayWeekRange } from '../../../data/courseRegistration/sectionScheduleFields.js'
import { getSchoolElectiveCategoryLabel } from '../../../data/departments.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const emit = defineEmits(['navigate'])

const { t, isZh } = useAppI18n()

function emptySearch() {
  return { keyword: '', type: '', availability: '', credits: '', prerequisites: '' }
}

const creditSummary = computed(() => getStudentCreditSummary())

/** 进页：默认选中可选批次第一条，并落到该批进行中轮次 */
const initialBatch = ensureStudentBatchSelection()
const selectedRound = ref(getStudentDefaultRoundKey(initialBatch))
setActiveCartRound(selectedRound.value)

/** 当前批次类型（由选中批次同步；Tab 仅展示，不再切批次） */
const batchTypeTab = computed(() => activeBatchTypePreference.value)

/** 当前选中批次 */
const activeBatch = computed(() => getActiveBatch())

/** 学生可选进行中批次列表 */
const selectableBatches = computed(() => listStudentSelectableBatches())

/** 当前选中批次 id（绑定下拉） */
const selectedBatchId = computed({
  get() {
    return studentSelectedBatchId.value || activeBatch.value?.id || ''
  },
  set(id) {
    setStudentSelectedBatchId(id)
  },
})

const isRoundRegistrationOpen = computed(() =>
  isBatchRoundOpenForRegistration(activeBatch.value, selectedRound.value),
)

/** 仅在选课窗口内展示操作列（窗外无可操作项） */
const showActionsColumn = computed(() => isRoundRegistrationOpen.value)

/** 空表 colspan：基础 12 列 + ME 校选类别 + 条件操作列 */
const emptyTableColspan = computed(() => {
  let n = 12
  if (batchTypeTab.value === 'ME') n += 1
  if (showActionsColumn.value) n += 1
  return n
})

/**
 * 轮次下拉：仅含已配置起止时间的轮次
 */
const roundOptions = computed(() => {
  const batch = activeBatch.value
  const session = batch?.academicSession || '—'
  return getRoundTimeline(batch, selectedRound.value)
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

/** 按最长选项文案撑开宽度，避免被 search-select 180px 截断 */
const roundSelectWidth = ref('')
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

function measureRoundSelectWidth() {
  roundSelectWidth.value = measureSelectWidth(roundOptions.value.map((opt) => opt.label))
}

function measureBatchSelectWidth() {
  batchSelectWidth.value = measureSelectWidth(
    selectableBatches.value.map((b) => b.name || b.id),
  )
}

watch(
  roundOptions,
  (opts) => {
    nextTick(measureRoundSelectWidth)
    // 当前轮次不在已配置列表时回落到默认进行中轮次
    if (opts.length && !opts.some((opt) => opt.key === selectedRound.value)) {
      selectedRound.value = getStudentDefaultRoundKey(activeBatch.value)
    }
  },
  { immediate: true },
)

watch(
  selectableBatches,
  () => {
    nextTick(measureBatchSelectWidth)
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
const pageSize = ref(20)

/** 一门课多个课程分组 → 多行；无分组仍保留一行（不可立即选课） */
const sectionRows = computed(() => {
  const rows = []
  for (const course of courses.value) {
    const sections = course.sections?.length ? course.sections : [null]
    for (const section of sections) {
      rows.push({ course, section })
    }
  }
  const availability = appliedSearch.value.availability
  if (availability === 'open') {
    return rows.filter((row) => row.section && Number(row.section.enrolled) < Number(row.section.capacity))
  }
  if (availability === 'full') {
    return rows.filter(
      (row) => !row.section || Number(row.section.enrolled) >= Number(row.section.capacity),
    )
  }
  return rows
})

const totalCourseCount = computed(() => sectionRows.value.length)
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sectionRows.value.slice(start, start + pageSize.value)
})

watch(
  [() => appliedSearch.value, selectedRound, () => pageSize.value, selectedBatchId],
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
  nextTick(() => {
    measureRoundSelectWidth()
    measureBatchSelectWidth()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

const myCoursesTip = computed(
  () => `${t('courseRegistration.student.myCoursesTip')}${t('common.prototypeOnlySuffix')}`,
)

const submitting = ref(false)
const message = ref('')
const detailCourse = ref(null)
const cartDrawerVisible = ref(false)
const confirmRegisterVisible = ref(false)
const pendingRegister = ref(null)

watch(
  shouldOpenRoundStatusDrawer,
  (open) => {
    if (!open) return
    cartDrawerVisible.value = true
    shouldOpenRoundStatusDrawer.value = false
  },
  { immediate: true },
)

const regularCreditTip = computed(() =>
  t('registrationRules.creditTips.regular', {
    creditMin: LONG_SEMESTER_CREDIT_MIN,
    creditMax: LONG_SEMESTER_CREDIT_MAX,
  }),
)

const resumptionCreditTip = computed(() =>
  t('registrationRules.creditTips.resumption', {
    creditMax: RESUMPTION_CREDIT_MAX,
  }),
)

const cartVisibleRows = computed(() => {
  const list = myRegistrationList.value
  // 窗外不展示排队中；待分配等仍只读可见
  if (isRoundRegistrationOpen.value) return list
  return list.filter((item) => item.status !== 'queued')
})

const cartButtonLabel = computed(() =>
  t('courseRegistration.student.cartToolbarButton', {
    count: cartVisibleRows.value.length,
  }),
)

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
  if (isCourseOccupied(course.id)) {
    return selectedRound.value === 'preselect'
      ? t('courseRegistration.student.alreadyVolunteeredHint')
      : t('courseRegistration.student.alreadyRegisteredHint')
  }
  if (!section) {
    return t('courseRegistration.student.noSectionToRegister')
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

/** 容量列表头：第一轮为志愿数量/课程容量 */
const capacityColumnLabel = computed(() =>
  isPreselectRound.value
    ? t('courseRegistration.courses.volunteerVsCapacity')
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
    return `${sectionVolunteerCount(course, section)}/${section.capacity}`
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
  if (!section || !course.eligibility?.eligible || isCourseOccupied(course.id)) return false
  // 第一轮志愿可超容量提交，不因教学分组已满拦截
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

function openDetail(course) {
  // 主表已去掉「详情」入口；保留函数与抽屉以便其它入口复用
  detailCourse.value = course
}

function openCartDrawer() {
  cartDrawerVisible.value = true
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
  selectedRound.value === 'preselect'
    ? t('courseRegistration.student.volunteerNow')
    : t('courseRegistration.student.registerNow'),
)

const confirmRegisterTitle = computed(() =>
  selectedRound.value === 'preselect'
    ? t('courseRegistration.student.confirmVolunteer')
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

/**
 * 切换选课轮次
 * @param {string} key 轮次 key
 */
function handleRoundChange(key) {
  message.value = ''
  cartDrawerVisible.value = false
  cancelRegisterConfirm()
  selectedRound.value = normalizeCartRoundKey(key)
}

/**
 * 切换选课批次：同步类型偏好，并自动选中该批进行中轮次
 * @param {string} batchId 批次 id
 */
function handleBatchChange(batchId) {
  message.value = ''
  cartDrawerVisible.value = false
  cancelRegisterConfirm()
  setStudentSelectedBatchId(batchId)
  const batch = getActiveBatch()
  selectedRound.value = getStudentDefaultRoundKey(batch)
}

/**
 * 类型 Tab 点击（仅同类型无操作；异类型已隐藏）
 * @param {'GE'|'ME'} type 课程大类
 */
function handleBatchTypeTab(type) {
  if (batchTypeTab.value === type) return
  // 批次优先后类型由批次决定，不再通过 Tab 切换批次上下文
}
</script>

<template>
  <StudentPageShell>
    <!-- 原页顶学分规则 Callout：按需求移至类型 Tab 与主表之间，故注释保留位置说明
    <div class="cr-student-top-stats">
      <CourseRegistrationCallout variant="rule" class="cr-student-credit-requirement">
        <ol class="cr-student-credit-requirement-list">
          <li>{{ regularCreditTip }}</li>
          <li>{{ resumptionCreditTip }}</li>
        </ol>
      </CourseRegistrationCallout>
    </div>
    -->

    <div class="cr-student-register-context">
      <div class="search-bar cr-student-round-search">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label for="cr-student-batch-select">
                {{ t('courseRegistration.student.batchSelectLabel') }}
              </label>
              <select
                id="cr-student-batch-select"
                class="search-select cr-student-batch-select"
                :style="batchSelectWidth ? { width: batchSelectWidth } : undefined"
                :value="selectedBatchId"
                @change="handleBatchChange($event.target.value)"
              >
                <option v-for="batch in selectableBatches" :key="batch.id" :value="batch.id">
                  {{ batch.name }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label for="cr-student-round-select">
                {{ t('courseRegistration.student.roundSelectLabel') }}
              </label>
              <select
                id="cr-student-round-select"
                class="search-select cr-student-round-select"
                :style="roundSelectWidth ? { width: roundSelectWidth } : undefined"
                :value="selectedRound"
                @change="handleRoundChange($event.target.value)"
              >
                <option v-for="opt in roundOptions" :key="opt.key" :value="opt.key">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 批次已绑定选修类型，去掉公共选修/专业选修 Tab（避免与批次信息重复）
      <div class="cr-student-type-tabs" role="tablist">
        <button
          v-if="batchTypeTab === 'GE'"
          type="button"
          role="tab"
          class="cr-student-type-tab"
          :class="{ active: batchTypeTab === 'GE' }"
          :aria-selected="batchTypeTab === 'GE'"
          @click="handleBatchTypeTab('GE')"
        >
          {{ t('courseRegistration.student.typeTabGe') }}
        </button>
        <button
          v-if="batchTypeTab === 'ME'"
          type="button"
          role="tab"
          class="cr-student-type-tab"
          :class="{ active: batchTypeTab === 'ME' }"
          :aria-selected="batchTypeTab === 'ME'"
          @click="handleBatchTypeTab('ME')"
        >
          {{ t('courseRegistration.student.typeTabMe') }}
        </button>
      </div>
      -->
    </div>

    <!-- 学分规则：位于批次/轮次区与课程主表之间 -->
    <div class="cr-student-top-stats cr-student-credit-between">
      <CourseRegistrationCallout variant="rule" class="cr-student-credit-requirement">
        <ol class="cr-student-credit-requirement-list">
          <li>{{ regularCreditTip }}</li>
          <li>{{ resumptionCreditTip }}</li>
        </ol>
      </CourseRegistrationCallout>
    </div>

    <div class="page-card">
      <div class="cr-student-register-layout">
        <CourseRegistrationCallout v-if="!isRoundRegistrationOpen" variant="warning">
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
            <button
              type="button"
              class="btn btn-default cr-student-cart-trigger"
              :title="myCoursesTip"
              @click="openCartDrawer"
            >
              {{ cartButtonLabel }}
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
            <p v-if="message && !cartDrawerVisible" class="cr-student-message cr-student-toolbar-message">
              {{ message }}
            </p>
          </div>
        </div>

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
                  <th v-if="batchTypeTab === 'ME'" class="th-with-tip">
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
                  <th class="th-capacity">{{ capacityColumnLabel }}</th>
                  <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                  <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                  <th>{{ t('courseRegistration.courses.classTime') }}</th>
                  <th>{{ t('courseRegistration.courses.room') }}</th>
                  <th>{{ t('courseRegistration.courses.prerequisites') }}</th>
                  <th v-if="showActionsColumn">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in pagedRows"
                  :key="`${row.course.id}-${row.section?.id || 'none'}`"
                >
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td class="nowrap">{{ row.course.code }}</td>
                  <td class="nowrap">{{ row.course.name }}</td>
                  <td class="nowrap">{{ getRegistrationTypeLabel(row.course.type, t) }}</td>
                  <td v-if="batchTypeTab === 'ME'" class="nowrap">
                    {{
                      getSchoolElectiveCategoryLabel(row.course.schoolElectiveCategory, isZh)
                    }}
                  </td>
                  <td>{{ row.course.credits }}</td>
                  <td class="nowrap">{{ sectionGroupName(row.section) }}</td>
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
                  <td class="nowrap">{{ row.section?.lecturer || '—' }}</td>
                  <td class="nowrap">{{ row.section ? displayWeekRange(row.section) : '—' }}</td>
                  <td class="nowrap">{{ row.section ? displayClassTime(row.section) : '—' }}</td>
                  <td class="nowrap">{{ row.section?.room || '—' }}</td>
                  <td class="nowrap">{{ row.course.prerequisites?.join(', ') || '—' }}</td>
                  <td v-if="showActionsColumn" class="cr-student-actions">
                    <div class="actions-inner">
                      <!-- 全部轮次去掉「详情」：不再提供 openDetail 入口
                      <button type="button" class="link-btn" @click="openDetail(row.course)">
                        {{ t('common.details') }}
                      </button>
                      -->
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

    <StudentCourseDetailDrawer
      :visible="!!detailCourse"
      :course="detailCourse"
      @close="detailCourse = null"
    />

    <StudentRegistrationCartDrawer
      :visible="cartDrawerVisible"
      :credit-min="creditSummary.min"
      :credit-max="creditSummary.max"
      :message="message"
      :round-open="isRoundRegistrationOpen"
      @close="cartDrawerVisible = false"
    />

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
.cr-student-top-stats {
  margin-bottom: 12px;
}

.cr-student-credit-between {
  margin-top: 4px;
}

.cr-student-credit-requirement {
  width: 100%;
  margin-bottom: 0 !important;
}

.cr-student-credit-requirement :deep(.cr-callout__body) {
  overflow-x: auto;
  min-width: 0;
}

.cr-student-credit-requirement-list {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 1.5rem;
  margin: 0;
  padding-left: 1.25em;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: #1e3a8a;
  list-style: decimal;
}

.cr-student-credit-requirement-list li {
  margin: 0;
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
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
  min-width: 1280px;
}

.nowrap {
  white-space: nowrap;
}

.th-capacity {
  background: #f1f5f9 !important;
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
</style>
