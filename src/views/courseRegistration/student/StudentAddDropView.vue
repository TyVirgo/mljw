<script setup>
import { ref, computed, watch } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import CourseRegistrationCallout from '../../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { runRegistrationQueue } from '../../../composables/useRegistrationQueue.js'
import { getActiveBatch } from '../../../data/courseRegistration/registrationBatches.js'
import { submitStudentAddDropApplication, addDropApprovalQueue } from '../../../data/courseRegistration/addDropApprovalQueue.js'
import { filterByCurrentStudent } from '../../../data/mockCurrentStudent.js'
import {
  getStudentProfileFields,
  getStudentEnrolledCourses,
  studentSchedule,
  getSelectableCoursesForStudent,
  getCourseWithFirstOpenSection,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { getStudentCreditSummary } from '../../../data/courseRegistration/studentRegistrationContext.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t } = useAppI18n()

const studentFields = computed(() => getStudentProfileFields())
const activeBatch = computed(() => getActiveBatch())
const creditSummary = computed(() => getStudentCreditSummary())
const enrolled = computed(() => getStudentEnrolledCourses())

const formVisible = ref(false)
const form = ref({ action: 'Add', courseId: '' })
const message = ref('')
const formError = ref('')
const submitting = ref(false)

const myApplications = computed(() =>
  filterByCurrentStudent(addDropApprovalQueue.value).sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  ),
)

const selectableCourses = computed(() => getSelectableCoursesForStudent())

/** Drop：已选课程；Add/Retake：可选课程 */
const courseOptions = computed(() => {
  if (form.value.action === 'Drop') {
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

/** 仅课号，类型已有独立列 */
function formatApplicationCourses(app) {
  const codes = (app.items || []).map((item) => item.courseCode).filter(Boolean)
  return codes.length ? codes.join(' · ') : '—'
}

function openForm() {
  form.value = { action: 'Add', courseId: '' }
  formError.value = ''
  message.value = ''
  formVisible.value = true
}

function closeForm() {
  if (submitting.value) return
  formVisible.value = false
  formError.value = ''
}

function resolveCourse() {
  return courseOptions.value.find((item) => item.id === form.value.courseId)
}

async function handleSubmit() {
  const course = resolveCourse()
  if (!course) {
    formError.value = t('courseRegistration.student.addDropSelectCourse')
    return
  }

  let section = null
  if (form.value.action === 'Drop' && course.fromEnrolled) {
    section = {
      code: course.sectionCode || '01',
      time: course.time || '',
      room: course.room,
      lecturer: course.lecturer,
    }
  } else {
    const pair = getCourseWithFirstOpenSection(course.id)
    if (!pair && (form.value.action === 'Add' || form.value.action === 'Retake')) {
      formError.value = t('courseRegistration.student.sectionFull')
      return
    }
    section = pair?.section
  }

  const item = {
    action: form.value.action,
    courseCode: course.code,
    credits: course.credits,
    section: section?.code || '01',
    time: section?.time || '',
    fee: form.value.action === 'Add' ? 320 : 0,
    retakeGrade: form.value.action === 'Retake' ? 'F' : undefined,
  }

  submitting.value = true
  formError.value = ''

  const finishOk = () => {
    message.value = t('courseRegistration.student.addDropSubmitted')
    formVisible.value = false
    form.value = { action: 'Add', courseId: '' }
  }

  const needsQueue = form.value.action === 'Add' || form.value.action === 'Retake'
  if (needsQueue) {
    try {
      await runRegistrationQueue(
        {
          ...studentFields.value,
          batchName: activeBatch.value?.name,
          courseCode: course.code,
          courseName: course.name,
          credits: course.credits,
          section: section?.code,
          time: section?.time,
          room: section?.room,
          lecturer: section?.lecturer,
        },
        {
          showSuccess: true,
          onComplete: () => {
            submitStudentAddDropApplication(studentFields.value, [item], {
              currentCredits: creditSummary.value.enrolled,
              creditMax: activeBatch.value?.creditMax ?? 20,
              schedule: [...studentSchedule.value],
            })
            return { ok: true }
          },
        },
      )
      finishOk()
    } catch {
      /* cancelled */
    }
  } else {
    submitStudentAddDropApplication(studentFields.value, [item], {
      currentCredits: creditSummary.value.enrolled,
      creditMax: activeBatch.value?.creditMax ?? 20,
      schedule: [...studentSchedule.value],
    })
    finishOk()
  }

  submitting.value = false
}
</script>

<template>
  <StudentPageShell page-id="crs-adddrop">
    <div class="page-card">
      <div class="toolbar cr-adddrop-toolbar">
        <div class="cr-adddrop-context">
          <strong v-if="activeBatch">{{ activeBatch.name }}</strong>
        </div>
        <button type="button" class="btn btn-primary" @click="openForm">
          {{ t('courseRegistration.student.startApplication') }}
        </button>
      </div>

      <CourseRegistrationCallout variant="info">
        <ul>
          <li>{{ t('courseRegistration.student.addDropBulletWindow') }}</li>
          <li>{{ t('courseRegistration.student.addDropBulletOrder') }}</li>
          <li v-if="activeBatch?.dropDeadlineWeek">
            {{
              t('courseRegistration.student.addDropBulletDeadline', {
                week: activeBatch.dropDeadlineWeek,
              })
            }}
          </li>
        </ul>
      </CourseRegistrationCallout>

      <p v-if="message" class="cr-student-message">{{ message }}</p>

      <div class="table-section">
        <div class="cr-student-panel-header">
          <h3 class="cr-student-section-title">{{ t('courseRegistration.student.myApplications') }}</h3>
          <span class="cr-student-panel-meta">{{ myApplications.length }}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.approval.applicationNo') }}</th>
                <th>{{ t('courseRegistration.approval.typeLabel') }}</th>
                <th>{{ t('courseRegistration.approval.applicationCourse') }}</th>
                <th>{{ t('courseRegistration.approval.status') }}</th>
                <th>{{ t('courseRegistration.approval.submittedAt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(app, index) in myApplications" :key="app.id">
                <td>{{ index + 1 }}</td>
                <td>{{ app.applicationNo }}</td>
                <td>
                  <span class="cr-adddrop-type">{{ typeLabel(app.type) }}</span>
                </td>
                <td>{{ formatApplicationCourses(app) }}</td>
                <td>{{ statusLabel(app.status) }}</td>
                <td>{{ app.submittedAt }}</td>
              </tr>
              <tr v-if="!myApplications.length">
                <td colspan="6" class="empty-cell">{{ t('courseRegistration.student.noApplications') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="formVisible"
      class="modal-overlay cr-adddrop-modal-overlay"
      @click.self="closeForm"
    >
      <div class="modal-panel cr-adddrop-modal" role="dialog" aria-modal="true">
        <h3>{{ t('courseRegistration.student.applicationModalTitle') }}</h3>

        <label class="cr-adddrop-field">
          {{ t('courseRegistration.student.action') }}
          <select v-model="form.action">
            <option value="Add">{{ t('courseRegistration.student.actionAdd') }}</option>
            <option value="Drop">{{ t('courseRegistration.student.actionDrop') }}</option>
            <option value="Retake">{{ t('courseRegistration.student.actionRetake') }}</option>
          </select>
        </label>

        <label class="cr-adddrop-field">
          {{ t('courseRegistration.courses.name') }}
          <select v-model="form.courseId">
            <option value="">{{ t('courseRegistration.student.selectCourse') }}</option>
            <option v-for="course in courseOptions" :key="course.id" :value="course.id">
              {{ course.code }} — {{ course.name }}
            </option>
          </select>
        </label>

        <p v-if="formError" class="cr-student-message cr-student-message--error">{{ formError }}</p>

        <div class="modal-actions">
          <button type="button" class="btn btn-default" :disabled="submitting" @click="closeForm">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" :disabled="submitting" @click="handleSubmit">
            {{ t('courseRegistration.student.submitApplication') }}
          </button>
        </div>
      </div>
    </div>
  </StudentPageShell>
</template>

<style scoped>
.cr-adddrop-toolbar {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.cr-adddrop-context {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #111827;
  line-height: 1.5;
}

.cr-adddrop-context strong {
  font-weight: 600;
}

.cr-adddrop-type {
  font-weight: 500;
  color: #1f2937;
}

.cr-student-section-title {
  margin: 0;
}

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
  width: min(440px, 100%);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
}

.cr-adddrop-modal h3 {
  margin: 0 0 12px;
  font-size: 17px;
  color: #111827;
}

.cr-adddrop-modal :deep(.cr-callout) {
  margin-bottom: 4px;
}

.cr-adddrop-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
  font-size: 13px;
  color: #374151;
}

.cr-adddrop-field select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
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

/* modal 不在 .page-card 内，补齐与列表页一致的按钮底色 */
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
