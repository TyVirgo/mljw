<script setup>
import { ref, computed, watch } from 'vue'
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
import {
  getSupplementEntry,
  formatSupplementInviteCountdown,
  hasWhitelistPrerequisiteBypass,
} from '../../../data/courseRegistration/supplementListQueue.js'
import { isWithinAddDropApplicationWindow } from '../../../data/courseRegistration/addDropApplicationWindow.js'
import {
  createEmptyAddDropSectionForm,
  clearHiddenSectionFields,
  validateAddDropSectionForm,
  buildAddDropSectionPayload,
  buildCourseScheduleSnapshot,
  applySectionToForm,
} from '../../../data/courseRegistration/addDropFormSections.js'
import { getEligibleAddCoursesForStudent } from '../../../data/courseRegistration/addDropEligibleCourses.js'
import {
  getStudentTranscript,
  retakeHistoryFromCourse,
} from '../../../data/courseRegistration/studentTranscript.js'
import { estimateCourseFee, sumFeeEstimates, formatAmountRmb } from '../../../data/courseRegistration/addDropFeeRates.js'
import { buildScheduleBaselineFromEnrolled } from '../../../data/courseRegistration/addDropSectionConflict.js'
import { getCourseById } from '../../../data/courseRegistration/selectableCourses.js'
import { getCurrentStudent } from '../../../data/mockCurrentStudent.js'
import {
  getStudentProfileFields,
  getStudentEnrolledCourses,
  studentSchedule,
  studentConfirmedCourses,
  studentRequiredCourses,
  getSelectableCoursesForStudent,
  getTermElectiveCreditProgress,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import {
  getStudentCreditSummary,
  getTermGeCategoryBars,
  getTermGeElectiveCategoryBars,
  buildAddDropPlanRemaining,
} from '../../../data/courseRegistration/studentRegistrationContext.js'
import {
  registrationAcademicSessionOptions,
  normalizeBatchAcademicSession,
} from '../../../data/courseRegistration/registrationBatchFormUtils.js'
import { isFreshmanStudent } from '../../../data/courseRegistration/studentAudience.js'
import { buildPreviewSchedule } from '../../../data/courseRegistration/studentSchedulePreview.js'
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
const form = ref(createEmptyAddDropSectionForm({ action: 'Add' }))
const message = ref('')
const formError = ref('')
const submitting = ref(false)
const pickingFor = ref('primary')

const academicSessionOptions = registrationAcademicSessionOptions
const defaultAcademicSession = computed(() =>
  normalizeBatchAcademicSession(activeBatch.value?.academicSession) || '2026/04',
)

const isApplicationWindowOpen = computed(() =>
  isWithinAddDropApplicationWindow(activeBatch.value),
)
const addDropAccess = computed(() =>
  getAddDropAccess(studentFields.value.studentId, activeBatch.value),
)
const supplementEntry = computed(() => getSupplementEntry(studentFields.value.studentId))
const inviteCountdown = computed(() =>
  formatSupplementInviteCountdown(supplementEntry.value),
)
const inSupplementList = computed(() => Boolean(supplementEntry.value))
const canApply = computed(() => addDropAccess.value.ok)
const allowedActions = computed(() => addDropAccess.value.allowedActions || [])
const freshmanBlocked = computed(() => Boolean(addDropAccess.value.freshmanBlocked))
const applicationWindowLabel = computed(() => formatRoundRange(activeBatch.value?.addDropWindow))
const isDropAction = computed(() => form.value.action === 'Drop')
const isAddDropAction = computed(() => form.value.action === 'AddDrop')
const needsFeeWaiver = computed(() => isDropAction.value || isAddDropAction.value)

const defaultContactPhone = computed(() => {
  const student = getCurrentStudent()
  return student?.contact?.mobilePhone || student?.mobilePhone || ''
})

const availableActionOptions = computed(() => {
  const raw = allowedActions.value.length ? allowedActions.value : [...ADD_DROP_TYPE_TABS]
  return raw.filter((a) => ADD_DROP_TYPE_TABS.includes(a))
})

const visibleTypeTabs = computed(() => {
  if (!allowedActions.value.length) return [...ADD_DROP_TYPE_TABS]
  const filtered = ADD_DROP_TYPE_TABS.filter((t) => allowedActions.value.includes(t))
  return filtered.length ? filtered : [...ADD_DROP_TYPE_TABS]
})

const activeTypeTab = ref('Add')
const listColumns = computed(() => getAddDropListColumns(activeTypeTab.value))
const tableColspan = computed(() => listColumns.value.length)

const canStartCurrentType = computed(() => {
  if (!canApply.value) return false
  if (!allowedActions.value.length) return true
  return allowedActions.value.includes(activeTypeTab.value)
})

/** 表单拟退课程：冲突基线排除用 */
const pendingDropCodes = computed(() => {
  if (form.value.action === 'Drop') {
    return form.value.courseId ? [form.value.courseId] : []
  }
  if (form.value.action === 'AddDrop') {
    return form.value.dropCourseId ? [form.value.dropCourseId] : []
  }
  return []
})

/** 主页「我的课表」：确认课 + 必修 */
const schedulePreviewSlots = computed(() =>
  buildPreviewSchedule({
    required: studentRequiredCourses.value,
    confirmed: studentConfirmedCourses.value,
    pendingAdd: [],
    pendingDropCodes: [],
  }),
)

const scheduleToolbarLabel = computed(() => t('courseRegistration.student.scheduleToolbarButton'))
const schedulePreviewHint = computed(() => t('courseRegistration.student.schedulePreviewAddDropHint'))

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

const whitelistDoorHint = computed(() =>
  inSupplementList.value ? t('courseRegistration.student.whitelistDoorOnlyHint') : '',
)

function goRegister() {
  emit('navigate', 'crs-register')
}
const searchForm = ref({ status: '', keyword: '' })
const appliedSearch = ref({ status: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(20)

const allApplications = computed(() =>
  filterByCurrentStudent(addDropApprovalQueue.value)
    .filter((app) => !isShieldedAddDropType(app.type))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
)

const filteredApplications = computed(() => {
  const { status, keyword } = appliedSearch.value
  const kw = keyword.trim().toLowerCase()
  const type = activeTypeTab.value
  return allApplications.value.filter((app) => {
    if (app.type !== type) return false
    if (status && app.status !== status) return false
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
  searchForm.value = { status: '', keyword: '' }
  appliedSearch.value = { status: '', keyword: '' }
  currentPage.value = 1
}

function switchTypeTab(type) {
  if (activeTypeTab.value === type) return
  activeTypeTab.value = type
  currentPage.value = 1
  message.value = ''
}

const applicationStatusOptions = ['Pending', 'In Review', 'Approved', 'Rejected', 'Cancelled']

const selectableCourses = computed(() => getSelectableCoursesForStudent())

const courseOptions = computed(() => {
  if (form.value.action === 'Drop' || pickingFor.value === 'drop') {
    return enrolled.value.map((item) => ({
      id: item.courseCode,
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
      schoolElectiveCategory: item.schoolElectiveCategory || '',
      meetings: item.meetings,
    }))
  }
  if (form.value.action === 'Add' || pickingFor.value === 'add') {
    return getEligibleAddCoursesForStudent(studentFields.value.studentId)
  }
  if (form.value.action === 'Retake') {
    const rows = getStudentTranscript(studentFields.value.studentId)
    const ids = new Set(rows.map((r) => r.retakeCourseId).filter(Boolean))
    return [...ids]
      .map((id) => getCourseById(id))
      .filter(Boolean)
      .map((c) => ({ ...c, remainingCapacity: c.remainingCapacity }))
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

/** 本学期 GE/ME 学分胶囊（加课选课弹窗） */
const termCreditBars = computed(() => {
  const p = getTermElectiveCreditProgress()
  return [
    {
      key: 'ge',
      labelKey: 'courseRegistration.student.termElectiveProgressGe',
      current: p.ge,
      max: p.geMax,
    },
    {
      key: 'me',
      labelKey: 'courseRegistration.student.termElectiveProgressMe',
      current: p.me,
      max: p.meMax,
    },
  ]
})

/** 方案 B：GE 文商理 + ME 文商理 */
const pickerCreditGroups = computed(() => {
  const bars = termCreditBars.value
  return [
    { key: 'ge', total: bars.find((b) => b.key === 'ge'), categories: getTermGeElectiveCategoryBars() },
    { key: 'me', total: bars.find((b) => b.key === 'me'), categories: getTermGeCategoryBars() },
  ]
})

/** 本学期文商理类别剩余（超额计费；含 GE/ME 总量兜底） */
const planRemaining = computed(() => buildAddDropPlanRemaining())

const feeEstimate = computed(() => {
  const lines = []
  const rem = planRemaining.value
  if (form.value.action === 'Add' && formPrimaryCourse.value) {
    lines.push(
      estimateCourseFee({
        action: 'Add',
        course: formPrimaryCourse.value,
        planRemaining: rem,
        eligibilitySource: form.value.eligibilitySource || formPrimaryCourse.value.eligibilitySource,
      }),
    )
  } else if (form.value.action === 'Retake' && formPrimaryCourse.value) {
    lines.push(
      estimateCourseFee({
        action: 'Retake',
        course: formPrimaryCourse.value,
        planRemaining: rem,
      }),
    )
  } else if (form.value.action === 'AddDrop' && formAddCourse.value) {
    lines.push(
      estimateCourseFee({
        action: 'Add',
        course: formAddCourse.value,
        planRemaining: rem,
        eligibilitySource: form.value.eligibilitySource || formAddCourse.value.eligibilitySource,
      }),
    )
  }
  return sumFeeEstimates(lines)
})

watch(
  () => form.value.action,
  (action, prev) => {
    if (action === prev) return
    const kept = {
      academicSession: form.value.academicSession,
      action,
      contactPhone: form.value.contactPhone,
    }
    form.value = clearHiddenSectionFields(
      createEmptyAddDropSectionForm(kept),
      action,
    )
    formError.value = ''
  },
)

function resolveI18nLabel(key, fallback) {
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : fallback
}

function typeLabel(type) {
  return resolveI18nLabel(`courseRegistration.approval.type.${type}`, type)
}

function statusLabel(status) {
  return resolveI18nLabel(`courseRegistration.approval.appStatus.${status}`, status)
}

function courseColumns(app) {
  return getAddDropCourseColumnTexts(app)
}

function feeWaiverLabel(app) {
  if (app.type !== 'Drop' && app.type !== 'AddDrop') return '—'
  if (app.feeWaiver === true) return t('courseRegistration.student.feeWaiverYes')
  if (app.feeWaiver === false) return t('courseRegistration.student.feeWaiverNo')
  return '—'
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
  status: 'courseRegistration.approval.status',
  submittedAt: 'courseRegistration.approval.submittedAt',
  actions: 'common.actions',
}

function columnHeader(col) {
  return t(COLUMN_HEADER_KEYS[col] || col)
}

function columnClass(col) {
  if (col === 'serial') return 'sticky-left sticky-idx nowrap'
  if (col === 'applicationNo') return 'sticky-left sticky-no nowrap'
  if (col === 'status') return 'sticky-right sticky-status nowrap col-status'
  if (col === 'classTimeVenue') return 'col-time-venue'
  if (col === 'actions') return 'sticky-right sticky-actions'
  return 'nowrap'
}

function listExcessCredits(app) {
  const n =
    app.excessCredits ??
    app.billableCredits ??
    app.feeEstimate?.billableCredits ??
    (app.feeEstimate?.items || []).reduce((s, i) => s + (Number(i.billableCredits) || 0), 0)
  if (n == null || n === '') return '—'
  return Number(n) || 0
}

function cellText(col, app, index) {
  if (col === 'serial') return (currentPage.value - 1) * pageSize.value + index + 1
  if (col === 'applicationNo') return app.applicationNo
  if (col === 'academicSession') return app.academicSession || '—'
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
  if (col === 'feeWaiver') return feeWaiverLabel(app)
  if (col === 'status') return statusLabel(app.status)
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
    action: activeTypeTab.value,
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
  if (!canStartCurrentType.value) {
    message.value = t('courseRegistration.student.addDropActionNotAllowed')
    return
  }
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
    const enrolledHit = enrolled.value.find((item) => item.courseCode === courseId)
    if (!enrolledHit) return null
    return {
      id: enrolledHit.courseCode,
      code: enrolledHit.courseCode,
      name: enrolledHit.courseName || enrolledHit.courseCode,
      credits: enrolledHit.credits,
      sectionCode: enrolledHit.sectionCode,
      time: enrolledHit.time,
      room: enrolledHit.room,
      lecturer: enrolledHit.lecturer,
      fromEnrolled: true,
    }
  }
  const base =
    courseOptions.value.find((item) => item.id === courseId) ||
    selectableCourses.value.find((item) => item.id === courseId || item.code === courseId)
  if (!base) return null
  return { ...base }
}

function resolveCourse() {
  return resolveCourseById(form.value.courseId, form.value.action === 'Drop')
}

const formPrimaryCourse = computed(() => resolveCourse())
const formDropCourse = computed(() => resolveCourseById(form.value.dropCourseId, true))
const formAddCourse = computed(() => resolveCourseById(form.value.addCourseId, false))

function openCoursePicker(target = 'primary') {
  pickingFor.value = target
  coursePickerVisible.value = true
}

function handleCoursePicked(payload) {
  const courseId = typeof payload === 'string' ? payload : payload?.courseId
  const course = typeof payload === 'object' ? payload?.course : null
  const section = typeof payload === 'object' ? payload?.section : null

  let next = { ...form.value }
  if (pickingFor.value === 'drop') {
    next.dropCourseId = courseId
    next = {
      ...next,
      dropSectionId: '',
      dropSectionCode: '',
      dropSectionName: '',
      dropClassTime: '',
      dropWeekRange: '',
      dropVenue: '',
      dropLecturers: '',
    }
    if (section) {
      next = applySectionToForm(next, 'drop', section, course)
    } else if (course?.fromEnrolled || course?.sectionCode) {
      const sec = {
        id: course.sectionId || `enrolled-${course.code || courseId}-01`,
        code: course.sectionCode || '01',
        name: course.sectionName || formatCourseSectionName(course.sectionCode || '01', t),
        time: course.time || '',
        room: course.room || '',
        lecturer: course.lecturer || '',
        weekRange: course.weekRange || '1-18',
      }
      next = applySectionToForm(next, 'drop', sec, course)
    }
  } else if (pickingFor.value === 'add') {
    next.addCourseId = courseId
    next = {
      ...next,
      addSectionId: '',
      addSectionCode: '',
      addSectionName: '',
      addClassTime: '',
      addWeekRange: '',
      addVenue: '',
      addLecturers: '',
      eligibilitySource: course?.eligibilitySource || '',
    }
    if (section) {
      next = applySectionToForm(next, 'add', section, course)
    }
  } else {
    next.courseId = courseId
    next = {
      ...next,
      sectionId: '',
      sectionCode: '',
      sectionName: '',
      classTime: '',
      weekRange: '',
      venue: '',
      lecturers: '',
      eligibilitySource: course?.eligibilitySource || next.eligibilitySource || '',
    }
    if (section) {
      next = applySectionToForm(next, 'primary', section, course)
    } else if (form.value.action === 'Drop' && (course?.fromEnrolled || course?.sectionCode)) {
      const sec = {
        id: course.sectionId || `enrolled-${course.code || courseId}-01`,
        code: course.sectionCode || '01',
        name: course.sectionName || formatCourseSectionName(course.sectionCode || '01', t),
        time: course.time || '',
        room: course.room || '',
        lecturer: course.lecturer || '',
        weekRange: course.weekRange || '1-18',
      }
      next = applySectionToForm(next, 'primary', sec, course)
    }
    if (form.value.action === 'Retake') {
      const resolved = course || resolveCourseById(courseId, false)
      next = {
        ...next,
        ...retakeHistoryFromCourse(
          resolved,
          next.academicSession,
          studentFields.value.studentId,
        ),
      }
    }
  }
  form.value = next
  coursePickerVisible.value = false
  formError.value = ''
}

function onAttachmentSelected(event) {
  const file = event.target.files?.[0]
  form.value.attachmentName = file ? file.name : ''
}

function clearAttachment() {
  form.value.attachmentName = ''
}

function buildItemFromCourse(action, course, sectionOverride = null) {
  const section = sectionOverride || {
    code: form.value.sectionCode || course.sectionCode || '01',
    time: form.value.classTime || course.time || '',
    room: form.value.venue || course.room || '',
    lecturer: form.value.lecturers || course.lecturer || '',
  }
  if (action === 'Drop' && pickingFor.value) {
    /* use override from form drop fields when AddDrop */
  }
  return {
    action,
    courseCode: course.code,
    courseName: course.name || course.code,
    credits: course.credits,
    courseId: course.id,
    sectionId: sectionOverride?.id || form.value.sectionId || course.sectionId || '',
    section: section?.code || '01',
    time: section?.time || '',
    room: section?.room || '',
    lecturer: section?.lecturer || '',
    fee: 0,
    retakeGrade: action === 'Retake' ? form.value.gradeEarned || 'F' : undefined,
  }
}

function handleSubmit() {
  if (!canApply.value) {
    formError.value = t('courseRegistration.student.addDropWindowClosedShort')
    return
  }

  const validation = validateAddDropSectionForm(form.value)
  if (!validation.ok) {
    formError.value = t(validation.errorKey)
    return
  }

  let items = []
  if (isAddDropAction.value) {
    const dropCourse = resolveCourseById(form.value.dropCourseId, true)
    const addCourse = resolveCourseById(form.value.addCourseId, false)
    if (!dropCourse || !addCourse) {
      formError.value = t('courseRegistration.student.addDropSelectBothCourses')
      return
    }
    items = [
      buildItemFromCourse('Drop', dropCourse, {
        code: form.value.dropSectionCode || dropCourse.sectionCode || '01',
        time: form.value.dropClassTime || dropCourse.time || '',
        room: form.value.dropVenue || dropCourse.room || '',
        lecturer: form.value.dropLecturers || dropCourse.lecturer || '',
      }),
      buildItemFromCourse('Add', addCourse, {
        id: form.value.addSectionId,
        code: form.value.addSectionCode || '01',
        time: form.value.addClassTime || '',
        room: form.value.addVenue || '',
        lecturer: form.value.addLecturers || '',
      }),
    ]
  } else {
    const course = resolveCourse()
    if (!course) {
      formError.value = t('courseRegistration.student.addDropSelectCourse')
      return
    }
    items = [
      buildItemFromCourse(form.value.action, course, {
        id: form.value.sectionId,
        code: form.value.sectionCode || course.sectionCode || '01',
        time: form.value.classTime || course.time || '',
        room: form.value.venue || course.room || '',
        lecturer: form.value.lecturers || course.lecturer || '',
      }),
    ]
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
    message.value = t('courseRegistration.student.addDropSubmitted')
    formVisible.value = false
    form.value = emptyFormState()
  }

  const snapshots = {
    add:
      form.value.action === 'Add'
        ? buildCourseScheduleSnapshot(resolveCourse(), {
            id: form.value.sectionId,
            code: form.value.sectionCode,
            time: form.value.classTime,
            room: form.value.venue,
            lecturer: form.value.lecturers,
          })
        : form.value.action === 'AddDrop'
          ? buildCourseScheduleSnapshot(resolveCourseById(form.value.addCourseId, false), {
              id: form.value.addSectionId,
              code: form.value.addSectionCode,
              time: form.value.addClassTime,
              room: form.value.addVenue,
              lecturer: form.value.addLecturers,
            })
          : null,
    drop:
      form.value.action === 'Drop'
        ? buildCourseScheduleSnapshot(resolveCourse(), {
            id: form.value.sectionId,
            code: form.value.sectionCode,
            time: form.value.classTime,
            room: form.value.venue,
            lecturer: form.value.lecturers,
          })
        : form.value.action === 'AddDrop'
          ? buildCourseScheduleSnapshot(resolveCourseById(form.value.dropCourseId, true), {
              id: form.value.dropSectionId,
              code: form.value.dropSectionCode,
              time: form.value.dropClassTime,
              room: form.value.dropVenue,
              lecturer: form.value.dropLecturers,
            })
          : null,
    retake:
      form.value.action === 'Retake'
        ? buildCourseScheduleSnapshot(resolveCourse(), {
            id: form.value.sectionId,
            code: form.value.sectionCode,
            time: form.value.classTime,
            room: form.value.venue,
            lecturer: form.value.lecturers,
          })
        : null,
  }
  const sectionPayload = buildAddDropSectionPayload(form.value, snapshots, feeEstimate.value)

  const sharedOptions = {
    type: form.value.action,
    academicSession: form.value.academicSession,
    currentCredits: creditSummary.value.enrolled,
    creditMax: activeBatch.value?.creditMax ?? 20,
    schedule: [...studentSchedule.value],
    feeWaiver: needsFeeWaiver.value ? form.value.feeWaiver === 'yes' : null,
    attachments: form.value.attachmentName ? [{ name: form.value.attachmentName }] : [],
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
          <p v-if="whitelistDoorHint" class="cr-adddrop-whitelist-hint">{{ whitelistDoorHint }}</p>
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

      <nav class="adddrop-type-tabs" aria-label="Add drop application type tabs">
        <button
          v-for="tab in visibleTypeTabs"
          :key="tab"
          type="button"
          class="adddrop-type-tab"
          :class="{ active: activeTypeTab === tab }"
          @click="switchTypeTab(tab)"
        >
          {{ typeLabel(tab) }}
        </button>
      </nav>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
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
              <label>{{ t('courseRegistration.student.addDropSearchKeyword') }}</label>
              <input
                v-model="searchForm.keyword"
                type="text"
                class="search-input"
                @keyup.enter="handleSearch"
              />
            </div>
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

      <div class="toolbar cr-adddrop-toolbar">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!canStartCurrentType"
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
          :class="{ 'cr-student-message--error': (!canApply || !canStartCurrentType) && message }"
        >
          {{ message }}
        </p>
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
            action-locked
            :primary-course="formPrimaryCourse"
            :drop-course="formDropCourse"
            :add-course="formAddCourse"
            :fee-estimate="feeEstimate"
            :schedule-baseline="scheduleBaseline"
            @update:form="onFormUpdate"
            @pick-course="openCoursePicker"
            @attachment-change="onAttachmentSelected"
            @clear-attachment="clearAttachment"
          />

          <CourseRegistrationCallout v-if="isAddDropAction" variant="rule">
            <p>{{ t('courseRegistration.student.addDropLinkedHint') }}</p>
          </CourseRegistrationCallout>
          <CourseRegistrationCallout v-else-if="isDropAction" variant="rule">
            <p>{{ t('courseRegistration.student.dropFormApprovalHint') }}</p>
          </CourseRegistrationCallout>

          <p v-if="formError" class="cr-student-message cr-student-message--error">{{ formError }}</p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-default" :disabled="submitting" @click="closeForm">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="submitting || !canApply"
            @click="handleSubmit"
          >
            {{ t('courseRegistration.student.submitApplication') }}
          </button>
        </div>
      </div>
    </div>

    <AddDropCoursePickerModal
      :visible="coursePickerVisible"
      :action="pickingFor === 'drop' ? 'Drop' : pickingFor === 'add' ? 'Add' : form.action"
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
      :plan-remaining="planRemaining"
      @close="coursePickerVisible = false"
      @confirm="handleCoursePicked"
    />

    <ApplicationDetailDrawer
      :visible="scheduleDrawerVisible"
      :title="t('courseRegistration.student.schedulePreviewTitle')"
      :subtitle="schedulePreviewHint"
      @close="scheduleDrawerVisible = false"
    >
      <StudentSchedulePreviewPanel embedded :schedule="schedulePreviewSlots" />
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

.cr-adddrop-whitelist-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #4b5563;
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
.type-adddrop { background: #f3e8ff; color: #7c3aed; }

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
  width: min(720px, 100%);
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
  overflow: auto;
  padding: 0 20px 8px;
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

.data-table--sticky {
  min-width: 960px;
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

.sticky-idx {
  left: 0;
  min-width: 48px;
}

.sticky-no {
  left: 48px;
  min-width: 110px;
  box-shadow: 4px 0 8px -6px rgba(15, 23, 42, 0.25);
}

.sticky-status {
  right: 140px;
  min-width: 72px;
  box-shadow: -4px 0 8px -6px rgba(15, 23, 42, 0.25);
}

.sticky-actions {
  right: 0;
  min-width: 140px;
}

thead .sticky-left,
thead .sticky-right {
  z-index: 3;
  background: #f9fafb;
}
</style>
