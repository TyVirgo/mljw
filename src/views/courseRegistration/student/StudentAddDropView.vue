<script setup>
import { ref, computed, watch } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import AddDropCoursePickerModal from '../../../components/courseRegistration/AddDropCoursePickerModal.vue'
import AddDropApplicationDetailDrawer from '../../../components/courseRegistration/AddDropApplicationDetailDrawer.vue'
import MovementStudentCancelAction from '../../../components/studentRecords/MovementStudentCancelAction.vue'
import TablePagination from '../../../components/common/TablePagination.vue'
import ConfirmDialog from '../../../components/common/ConfirmDialog.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { getAddDropCourseColumnTexts } from '../../../utils/addDropCourseDisplay.js'
import { runRegistrationQueue } from '../../../composables/useRegistrationQueue.js'
import { getActiveBatch, formatRoundRange } from '../../../data/courseRegistration/registrationBatches.js'
import {
  submitStudentAddDropApplication,
  addDropApprovalQueue,
  addDropTypeOptions,
  canStudentSubmitAddDrop,
  canCancelAddDropApplication,
  cancelStudentAddDropApplication,
} from '../../../data/courseRegistration/addDropApprovalQueue.js'
import { filterByCurrentStudent } from '../../../data/mockCurrentStudent.js'
import { isStudentInSupplementList } from '../../../data/courseRegistration/supplementListQueue.js'
import { isWithinAddDropApplicationWindow } from '../../../data/courseRegistration/addDropApplicationWindow.js'
import {
  getStudentProfileFields,
  getStudentEnrolledCourses,
  studentSchedule,
  getSelectableCoursesForStudent,
  getCourseWithFirstOpenSection,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { getStudentCreditSummary } from '../../../data/courseRegistration/studentRegistrationContext.js'
import {
  registrationAcademicSessionOptions,
  normalizeBatchAcademicSession,
} from '../../../data/courseRegistration/registrationBatchFormUtils.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t } = useAppI18n()

const studentFields = computed(() => getStudentProfileFields())
const activeBatch = computed(() => getActiveBatch())
const creditSummary = computed(() => getStudentCreditSummary())
const enrolled = computed(() => getStudentEnrolledCourses())

const formVisible = ref(false)
const coursePickerVisible = ref(false)
const detailApp = ref(null)
const cancelTarget = ref(null)
const form = ref({
  academicSession: '',
  action: 'Add',
  courseId: '',
  dropCourseId: '',
  addCourseId: '',
  reason: '',
  feeWaiver: '',
  attachmentName: '',
})
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
const inSupplementList = computed(() =>
  isStudentInSupplementList(studentFields.value.studentId),
)
const canApply = computed(() =>
  canStudentSubmitAddDrop(studentFields.value.studentId, activeBatch.value).ok,
)
const applicationWindowLabel = computed(() => formatRoundRange(activeBatch.value?.addDropWindow))
const isDropAction = computed(() => form.value.action === 'Drop')
const isAddDropAction = computed(() => form.value.action === 'AddDrop')
const needsFeeWaiver = computed(() => isDropAction.value || isAddDropAction.value)

const calloutText = computed(() => {
  if (isApplicationWindowOpen.value) {
    return t('courseRegistration.student.addDropWindowOpen', {
      range: applicationWindowLabel.value,
    })
  }
  if (inSupplementList.value) {
    return t('courseRegistration.student.addDropViaSupplement', {
      range: applicationWindowLabel.value,
    })
  }
  return t('courseRegistration.student.addDropWindowClosed', {
    range: applicationWindowLabel.value,
  })
})

const searchForm = ref({ type: '', status: '', keyword: '' })
const appliedSearch = ref({ type: '', status: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(20)

const allApplications = computed(() =>
  filterByCurrentStudent(addDropApprovalQueue.value).sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  ),
)

const filteredApplications = computed(() => {
  const { type, status, keyword } = appliedSearch.value
  const kw = keyword.trim().toLowerCase()
  return allApplications.value.filter((app) => {
    if (type && app.type !== type) return false
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
  searchForm.value = { type: '', status: '', keyword: '' }
  appliedSearch.value = { type: '', status: '', keyword: '' }
  currentPage.value = 1
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
      sectionCode: item.sectionCode,
      time: item.time,
      room: item.room,
      lecturer: item.lecturer,
      fromEnrolled: true,
    }))
  }
  return selectableCourses.value
})

watch(
  () => form.value.action,
  () => {
    form.value.courseId = ''
    form.value.dropCourseId = ''
    form.value.addCourseId = ''
    form.value.reason = ''
    form.value.feeWaiver = ''
    form.value.attachmentName = ''
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
  return {
    academicSession: defaultAcademicSession.value,
    action: 'Add',
    courseId: '',
    dropCourseId: '',
    addCourseId: '',
    reason: '',
    feeWaiver: '',
    attachmentName: '',
  }
}

function openForm() {
  if (!canApply.value) {
    message.value = t('courseRegistration.student.addDropWindowClosedShort')
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
  return courseOptions.value.find((item) => item.id === courseId) ||
    selectableCourses.value.find((item) => item.id === courseId || item.code === courseId)
}

function resolveCourse() {
  return resolveCourseById(form.value.courseId, form.value.action === 'Drop')
}

const selectedCourseLabel = computed(() => {
  const course = resolveCourse()
  if (!course) return ''
  return `${course.code} — ${course.name}`
})

const selectedDropCourseLabel = computed(() => {
  const course = resolveCourseById(form.value.dropCourseId, true)
  if (!course) return ''
  return `${course.code} — ${course.name}`
})

const selectedAddCourseLabel = computed(() => {
  const course = resolveCourseById(form.value.addCourseId, false)
  if (!course) return ''
  return `${course.code} — ${course.name}`
})

function openCoursePicker(target = 'primary') {
  pickingFor.value = target
  coursePickerVisible.value = true
}

function handleCoursePicked(courseId) {
  if (pickingFor.value === 'drop') form.value.dropCourseId = courseId
  else if (pickingFor.value === 'add') form.value.addCourseId = courseId
  else form.value.courseId = courseId
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

function buildItemFromCourse(action, course) {
  let section = null
  if (action === 'Drop' && course.fromEnrolled) {
    section = {
      code: course.sectionCode || '01',
      time: course.time || '',
      room: course.room,
      lecturer: course.lecturer,
    }
  } else {
    const pair = getCourseWithFirstOpenSection(course.id)
    section = pair?.section
  }
  return {
    action,
    courseCode: course.code,
    courseName: course.name || course.code,
    credits: course.credits,
    section: section?.code || course.sectionCode || '01',
    time: section?.time || course.time || '',
    fee: action === 'Add' || action === 'Retake' ? 320 : 0,
    retakeGrade: action === 'Retake' ? 'F' : undefined,
  }
}

async function handleSubmit() {
  if (!canApply.value) {
    formError.value = t('courseRegistration.student.addDropWindowClosedShort')
    return
  }
  if (!form.value.academicSession) {
    formError.value = t('courseRegistration.student.academicSessionRequired')
    return
  }
  if (!form.value.action) {
    formError.value = t('courseRegistration.student.applicationTypeRequired')
    return
  }

  if (!form.value.reason.trim()) {
    formError.value = t('courseRegistration.student.applicationReasonRequired')
    return
  }

  if (needsFeeWaiver.value && form.value.feeWaiver !== 'yes' && form.value.feeWaiver !== 'no') {
    formError.value = t('courseRegistration.student.feeWaiverRequired')
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
    const addPair = getCourseWithFirstOpenSection(addCourse.id)
    if (!addPair) {
      formError.value = t('courseRegistration.student.sectionFull')
      return
    }
    items = [
      buildItemFromCourse('Drop', dropCourse),
      {
        ...buildItemFromCourse('Add', addCourse),
        section: addPair.section?.code || '01',
        time: addPair.section?.time || '',
      },
    ]
  } else {
    const course = resolveCourse()
    if (!course) {
      formError.value = t('courseRegistration.student.addDropSelectCourse')
      return
    }
    if (
      (form.value.action === 'Add' || form.value.action === 'Retake') &&
      !getCourseWithFirstOpenSection(course.id)
    ) {
      formError.value = t('courseRegistration.student.sectionFull')
      return
    }
    items = [buildItemFromCourse(form.value.action, course)]
  }

  submitting.value = true
  formError.value = ''

  const finishOk = () => {
    message.value = t('courseRegistration.student.addDropSubmitted')
    formVisible.value = false
    form.value = emptyFormState()
  }

  const sharedOptions = {
    type: form.value.action,
    academicSession: form.value.academicSession,
    reason: form.value.reason.trim(),
    currentCredits: creditSummary.value.enrolled,
    creditMax: activeBatch.value?.creditMax ?? 20,
    schedule: [...studentSchedule.value],
    feeWaiver: needsFeeWaiver.value ? form.value.feeWaiver === 'yes' : null,
    attachments: form.value.attachmentName ? [{ name: form.value.attachmentName }] : [],
  }

  const needsQueue = items.some((item) => item.action === 'Add' || item.action === 'Retake')
  if (needsQueue) {
    const addItem = items.find((item) => item.action === 'Add' || item.action === 'Retake')
    try {
      await runRegistrationQueue(
        {
          ...studentFields.value,
          batchName: activeBatch.value?.name,
          courseCode: addItem.courseCode,
          courseName: addItem.courseCode,
          credits: addItem.credits,
          section: addItem.section,
          time: addItem.time,
        },
        {
          showSuccess: true,
          onComplete: () => {
            const result = submitStudentAddDropApplication(studentFields.value, items, sharedOptions)
            if (!result.ok) {
              formError.value = t(result.errorKey)
              return { ok: false }
            }
            return { ok: true }
          },
        },
      )
      if (!formError.value) finishOk()
    } catch {
      /* cancelled */
    }
  } else {
    const result = submitStudentAddDropApplication(studentFields.value, items, sharedOptions)
    if (!result.ok) {
      formError.value = t(result.errorKey)
    } else {
      finishOk()
    }
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
        </CourseRegistrationCallout>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.approval.typeLabel') }}</label>
              <select v-model="searchForm.type" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in addDropTypeOptions" :key="opt" :value="opt">
                  {{ typeLabel(opt) }}
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

      <div class="toolbar">
        <button type="button" class="btn btn-primary" :disabled="!canApply" @click="openForm">
          {{ t('courseRegistration.student.startApplication') }}
        </button>
      </div>

      <p
        v-if="message"
        class="cr-student-message"
        :class="{ 'cr-student-message--error': !canApply && message }"
      >{{ message }}</p>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.approval.applicationNo') }}</th>
                <th>{{ t('courseRegistration.batch.academicSession') }}</th>
                <th>{{ t('courseRegistration.approval.typeLabel') }}</th>
                <th>{{ t('courseRegistration.approval.addCourseName') }}</th>
                <th>{{ t('courseRegistration.approval.dropCourseName') }}</th>
                <th>{{ t('courseRegistration.approval.retakeCourseName') }}</th>
                <th>{{ t('courseRegistration.student.feeWaiverLabel') }}</th>
                <th>{{ t('courseRegistration.approval.status') }}</th>
                <th>{{ t('courseRegistration.approval.submittedAt') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(app, index) in paginatedApplications" :key="app.id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ app.applicationNo }}</td>
                <td>{{ app.academicSession || '—' }}</td>
                <td>
                  <span class="type-tag" :class="`type-${String(app.type || '').toLowerCase()}`">
                    {{ typeLabel(app.type) }}
                  </span>
                </td>
                <td class="nowrap">{{ courseColumns(app).add }}</td>
                <td class="nowrap">{{ courseColumns(app).drop }}</td>
                <td class="nowrap">{{ courseColumns(app).retake }}</td>
                <td>{{ feeWaiverLabel(app) }}</td>
                <td>{{ statusLabel(app.status) }}</td>
                <td>{{ app.submittedAt }}</td>
                <td>
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
                </td>
              </tr>
              <tr v-if="!paginatedApplications.length">
                <td colspan="11" class="empty-cell">{{ t('courseRegistration.student.noApplications') }}</td>
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

        <div class="cr-adddrop-form-grid">
          <div class="form-field">
            <label class="field-label">
              {{ t('courseRegistration.batch.academicSession') }}
              <span class="required-mark">*</span>
            </label>
            <select v-model="form.academicSession" class="form-input">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="session in academicSessionOptions" :key="session" :value="session">
                {{ session }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label class="field-label">
              {{ t('courseRegistration.approval.typeLabel') }}
              <span class="required-mark">*</span>
            </label>
            <select v-model="form.action" class="form-input">
              <option value="Add">{{ t('courseRegistration.approval.type.Add') }}</option>
              <option value="Drop">{{ t('courseRegistration.approval.type.Drop') }}</option>
              <option value="Retake">{{ t('courseRegistration.approval.type.Retake') }}</option>
              <option value="AddDrop">{{ t('courseRegistration.approval.type.AddDrop') }}</option>
            </select>
          </div>

          <template v-if="isAddDropAction">
            <div class="form-field form-field--span2">
              <label class="field-label">
                {{ t('courseRegistration.student.dropCourse') }}
                <span class="required-mark">*</span>
              </label>
              <div class="cr-adddrop-course-trigger">
                <input
                  type="text"
                  class="form-input"
                  readonly
                  :value="selectedDropCourseLabel"
                  :placeholder="t('courseRegistration.student.selectCourse')"
                  @click="openCoursePicker('drop')"
                />
                <button type="button" class="btn btn-default" @click="openCoursePicker('drop')">
                  {{ t('courseRegistration.student.pickCourse') }}
                </button>
              </div>
            </div>
            <div class="form-field form-field--span2">
              <label class="field-label">
                {{ t('courseRegistration.student.addCourse') }}
                <span class="required-mark">*</span>
              </label>
              <div class="cr-adddrop-course-trigger">
                <input
                  type="text"
                  class="form-input"
                  readonly
                  :value="selectedAddCourseLabel"
                  :placeholder="t('courseRegistration.student.selectCourse')"
                  @click="openCoursePicker('add')"
                />
                <button type="button" class="btn btn-default" @click="openCoursePicker('add')">
                  {{ t('courseRegistration.student.pickCourse') }}
                </button>
              </div>
            </div>
          </template>

          <div v-else class="form-field" :class="{ 'form-field--span2': !isDropAction }">
            <label class="field-label">
              {{ t('courseRegistration.courses.name') }}
              <span class="required-mark">*</span>
            </label>
            <div class="cr-adddrop-course-trigger">
              <input
                type="text"
                class="form-input"
                readonly
                :value="selectedCourseLabel"
                :placeholder="t('courseRegistration.student.selectCourse')"
                @click="openCoursePicker('primary')"
              />
              <button type="button" class="btn btn-default" @click="openCoursePicker('primary')">
                {{ t('courseRegistration.student.pickCourse') }}
              </button>
            </div>
          </div>

          <div v-if="needsFeeWaiver" class="form-field">
            <label class="field-label">
              {{ t('courseRegistration.student.feeWaiverLabel') }}
              <span class="required-mark">*</span>
            </label>
            <div class="radio-row" role="radiogroup">
              <label class="radio-option">
                <input v-model="form.feeWaiver" type="radio" value="yes" />
                <span>{{ t('courseRegistration.student.feeWaiverYes') }}</span>
              </label>
              <label class="radio-option">
                <input v-model="form.feeWaiver" type="radio" value="no" />
                <span>{{ t('courseRegistration.student.feeWaiverNo') }}</span>
              </label>
            </div>
          </div>

          <div v-if="needsFeeWaiver" class="form-field form-field--span2">
            <label class="field-label">
              {{ t('courseRegistration.student.dropAttachment') }}
              <span class="optional-mark">（{{ t('courseRegistration.student.dropAttachmentOptional') }}）</span>
            </label>
            <div class="attach-row">
              <label class="btn btn-default attach-btn">
                {{ t('courseRegistration.student.chooseFile') }}
                <input
                  type="file"
                  class="attach-input"
                  accept=".pdf,.jpg,.jpeg,.png,.docx,application/pdf,image/*"
                  @change="onAttachmentSelected"
                />
              </label>
              <span class="attach-name">
                {{ form.attachmentName || t('courseRegistration.student.noFileChosen') }}
              </span>
              <button
                v-if="form.attachmentName"
                type="button"
                class="link-btn"
                @click="clearAttachment"
              >
                {{ t('courseRegistration.student.clearFile') }}
              </button>
            </div>
            <p class="field-hint">{{ t('courseRegistration.student.dropAttachmentHint') }}</p>
          </div>

          <div class="form-field form-field--span2">
            <label class="field-label">
              {{ t('courseRegistration.student.applicationReason') }}
              <span class="required-mark">*</span>
            </label>
            <textarea
              v-model="form.reason"
              class="form-textarea"
              rows="3"
              :placeholder="t('courseRegistration.student.applicationReasonPlaceholder')"
            />
          </div>
        </div>

        <CourseRegistrationCallout v-if="isAddDropAction" variant="rule">
          <p>{{ t('courseRegistration.student.addDropLinkedHint') }}</p>
        </CourseRegistrationCallout>
        <CourseRegistrationCallout v-else-if="isDropAction" variant="rule">
          <p>{{ t('courseRegistration.student.dropFormApprovalHint') }}</p>
        </CourseRegistrationCallout>

        <p v-if="formError" class="cr-student-message cr-student-message--error">{{ formError }}</p>

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
      @close="coursePickerVisible = false"
      @confirm="handleCoursePicked"
    />

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
  padding: 24px;
  border-radius: 10px;
  width: min(640px, 100%);
  max-height: min(90vh, 720px);
  overflow: auto;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
}

.cr-adddrop-modal h3 {
  margin: 0 0 16px;
  font-size: 17px;
  color: #111827;
}

.cr-adddrop-modal :deep(.cr-callout) {
  margin: 12px 0 4px;
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
  flex-wrap: wrap;
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
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
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
</style>
