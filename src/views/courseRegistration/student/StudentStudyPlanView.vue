<script setup>
/**
 * 学生端学术情况：类别汇总（图示1）→ 学年学期明细（图示2）
 */
import { ref, computed, onMounted } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import {
  buildStudyPlanAcademicStatusSummary,
  buildStudyPlanAcademicStatusDetail,
} from '../../../data/courseRegistration/studentStudyPlanAcademicStatus.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t, isZh } = useAppI18n()

/** summary | detail */
const viewMode = ref('summary')
/** 打开页时固定汇总快照 */
const summarySnapshot = ref(null)
const detailPayload = ref(null)

onMounted(() => {
  summarySnapshot.value = buildStudyPlanAcademicStatusSummary()
})

const summary = computed(() => summarySnapshot.value)

/**
 * Pending 正数 → 展示负号
 * @param {number} n
 */
function formatPending(n) {
  const v = Math.max(0, Number(n) || 0)
  return v === 0 ? '0' : `-${v}`
}

function openDetail() {
  detailPayload.value = buildStudyPlanAcademicStatusDetail()
  viewMode.value = 'detail'
}

function backToSummary() {
  viewMode.value = 'summary'
}

/**
 * @param {number|null|undefined} rate
 */
function formatCompletionRate(rate) {
  const n = Number(rate)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(2)}%`
}

/**
 * @param {number|null|undefined} gpa
 */
function formatGpa(gpa) {
  if (gpa == null || !Number.isFinite(Number(gpa))) return 'N/A'
  return Number(gpa).toFixed(2)
}
</script>

<template>
  <StudentPageShell>
    <div class="page-card study-plan-page">
      <!-- 图示1：类别汇总 -->
      <template v-if="viewMode === 'summary'">
        <div class="study-plan-title-bar">
          {{ t('courseRegistration.student.studyPlan.academicStatusTitle') }}
        </div>
        <p class="study-plan-hint">{{ t('courseRegistration.student.studyPlan.summaryHint') }}</p>

        <div v-if="summary" class="study-plan-summary-wrap">
          <table class="study-plan-summary-table">
            <thead>
              <tr>
                <th rowspan="2" class="col-status">
                  {{ t('courseRegistration.student.studyPlan.colStatus') }}
                </th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colMandatory') }}</th>
                <th colspan="3">{{ t('courseRegistration.student.studyPlan.colGe') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colCommonCore') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colMajorCore') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colMe') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colIndustrial') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colAttempted') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colMinRequired') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colTotalEarned') }}</th>
                <th rowspan="2">{{ t('courseRegistration.student.studyPlan.colCompletionRate') }}</th>
                <th rowspan="2" class="col-detail">
                  {{ t('courseRegistration.student.studyPlan.colDetail') }}
                </th>
              </tr>
              <tr>
                <th>{{ t('courseRegistration.student.studyPlan.colGeTotal') }}</th>
                <th>{{ t('courseRegistration.student.studyPlan.colGeBusiness') }}</th>
                <th>{{ t('courseRegistration.student.studyPlan.colGeArts') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-completed">
                <td class="col-status">{{ t('courseRegistration.student.studyPlan.rowCompleted') }}</td>
                <td>{{ summary.completed.mandatory }}</td>
                <td>{{ summary.completed.geTotal }}</td>
                <td>{{ summary.completed.geBusiness }}</td>
                <td>{{ summary.completed.geArts }}</td>
                <td>{{ summary.completed.commonCore }}</td>
                <td>{{ summary.completed.majorCore }}</td>
                <td>{{ summary.completed.me }}</td>
                <td>{{ summary.completed.industrial }}</td>
                <td>{{ summary.completed.creditsAttempted }}</td>
                <td rowspan="2">{{ summary.minCreditsRequired }}</td>
                <td rowspan="2">{{ summary.totalCreditsEarned }}</td>
                <td rowspan="2">{{ formatCompletionRate(summary.completionRate) }}</td>
                <td rowspan="2" class="col-detail">
                  <button type="button" class="link-btn" @click="openDetail">
                    {{ t('courseRegistration.student.studyPlan.detailAction') }}
                  </button>
                </td>
              </tr>
              <tr class="row-pending">
                <td class="col-status">{{ t('courseRegistration.student.studyPlan.rowPending') }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.mandatory) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.geTotal) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.geBusiness) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.geArts) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.commonCore) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.majorCore) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.me) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.industrial) }}</td>
                <td class="is-pending">{{ formatPending(summary.pending.creditsAttempted) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- 图示2：学年学期明细 -->
      <template v-else>
        <div v-if="detailPayload" class="study-plan-detail">
          <!-- 顶栏：左标题、右返回，同一行 -->
          <div class="study-plan-detail-toolbar">
            <h2 class="study-plan-detail-title">
              {{ t('courseRegistration.student.studyPlan.detailTitle') }}
            </h2>
            <button type="button" class="btn btn-outline" @click="backToSummary">
              {{ t('courseRegistration.student.studyPlan.backToSummary') }}
            </button>
          </div>
          <!-- 学生信息条：6 字段横向等分、单行不换行 -->
          <div class="study-plan-detail-header">
            <div class="hdr-grid">
              <div class="hdr-cell">
                <span class="hdr-label">{{ t('courseRegistration.student.studyPlan.hdrStudentId') }}</span>
                <span
                  class="hdr-value"
                  :title="detailPayload.header.studentId"
                >{{ detailPayload.header.studentId }}</span>
              </div>
              <div class="hdr-cell">
                <span class="hdr-label">{{ t('courseRegistration.student.studyPlan.hdrName') }}</span>
                <span
                  class="hdr-value"
                  :title="detailPayload.header.studentName"
                >{{ detailPayload.header.studentName }}</span>
              </div>
              <div class="hdr-cell">
                <span class="hdr-label">{{ t('courseRegistration.student.studyPlan.hdrProgramme') }}</span>
                <span
                  class="hdr-value"
                  :title="detailPayload.header.programme"
                >{{ detailPayload.header.programme }}</span>
              </div>
              <div class="hdr-cell">
                <span class="hdr-label">{{ t('courseRegistration.student.studyPlan.hdrAdmission') }}</span>
                <span
                  class="hdr-value"
                  :title="String(detailPayload.header.dateOfAdmission)"
                >{{ detailPayload.header.dateOfAdmission }}</span>
              </div>
              <div class="hdr-cell">
                <span class="hdr-label">{{ t('courseRegistration.student.studyPlan.hdrCgpa') }}</span>
                <span class="hdr-highlight">{{ formatGpa(detailPayload.header.latestCgpa) }}</span>
              </div>
              <div class="hdr-cell">
                <span class="hdr-label">{{ t('courseRegistration.student.studyPlan.hdrCreditsEarned') }}</span>
                <span class="hdr-highlight">{{ detailPayload.header.creditsEarned }}</span>
              </div>
            </div>
          </div>

          <div class="study-plan-detail-wrap">
            <table class="study-plan-detail-table">
              <thead>
                <tr>
                  <th>{{ t('courseRegistration.student.studyPlan.dColYear') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColSession') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColCode') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColName') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColCredits') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColGrade') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColGp') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColStatus') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColAttempt') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColRemark') }}</th>
                  <th>{{ t('courseRegistration.student.studyPlan.dColGpa') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="yearBlock in detailPayload.years" :key="yearBlock.yearLabel">
                  <template
                    v-for="(session, sessionIndex) in yearBlock.sessions"
                    :key="session.academicSession"
                  >
                    <tr class="session-summary">
                      <td
                        v-if="sessionIndex === 0"
                        :rowspan="
                          yearBlock.sessions.reduce((n, s) => n + 1 + s.lines.length, 0)
                        "
                        class="col-year"
                      >
                        {{ yearBlock.yearLabel }}
                      </td>
                      <td>{{ session.academicSession }}</td>
                      <td colspan="2" class="session-credit-sum">
                        {{ t('courseRegistration.student.studyPlan.sessionCredits', { n: session.creditSum }) }}
                      </td>
                      <td colspan="6"></td>
                      <td>{{ formatGpa(session.gpa) }}</td>
                    </tr>
                    <tr
                      v-for="line in session.lines"
                      :key="`${session.academicSession}-${line.courseCode}-${line.grade}`"
                      :class="{ 'is-fail': line.status === 'Fail' }"
                    >
                      <td>{{ session.academicSession }}</td>
                      <td>{{ line.courseCode }}</td>
                      <td class="col-name">{{ line.courseName }}</td>
                      <td>{{ line.credits }}</td>
                      <td>{{ isZh && line.gradeZh ? line.gradeZh : line.grade }}</td>
                      <td>{{ line.gradePoint != null ? line.gradePoint : 'N/A' }}</td>
                      <td :class="{ 'status-fail': line.status === 'Fail', 'status-pass': line.status === 'Pass' }">
                        {{
                          line.status === 'Fail'
                            ? t('courseRegistration.student.studyPlan.statusFail')
                            : t('courseRegistration.student.studyPlan.statusPass')
                        }}
                      </td>
                      <td :class="{ 'attempt-pass': line.status === 'Pass' }">{{ line.attemptTimes }}</td>
                      <td>{{ line.remark || '—' }}</td>
                      <td></td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </StudentPageShell>
</template>

<style scoped>
.study-plan-page {
  padding: 16px 20px 24px;
}

.study-plan-title-bar {
  background: #dcfce7;
  color: #166534;
  font-weight: 700;
  font-size: 15px;
  padding: 10px 14px;
  border-radius: 6px 6px 0 0;
  border: 1px solid #bbf7d0;
  border-bottom: none;
}

.study-plan-hint {
  margin: 0 0 12px;
  padding: 8px 12px;
  font-size: 12px;
  color: #4b5563;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

.study-plan-summary-wrap {
  overflow-x: auto;
}

.study-plan-summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 960px;
}

.study-plan-summary-table th,
.study-plan-summary-table td {
  border: 1px solid #cbd5e1;
  padding: 8px 6px;
  text-align: center;
  vertical-align: middle;
}

.study-plan-summary-table thead th {
  background: #1e3a8a;
  color: #fff;
  font-weight: 600;
}

.study-plan-summary-table .col-status {
  min-width: 112px;
  font-weight: 600;
  white-space: nowrap;
}

.study-plan-summary-table .row-pending {
  background: #f1f5f9;
}

.study-plan-summary-table .is-pending {
  color: #dc2626;
  font-weight: 600;
}

.study-plan-summary-table .col-detail {
  min-width: 72px;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  padding: 0;
}

/* 明细顶栏：标题左、返回右，同一行 */
.study-plan-detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.study-plan-detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e3a8a;
  line-height: 1.3;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.study-plan-detail-toolbar .btn {
  flex-shrink: 0;
}

.study-plan-detail-header {
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
}

/* 信息条：按内容分配宽、不省略全文；单行，条外可横滑 */
.hdr-grid {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0 20px;
  font-size: 13px;
  color: #334155;
  width: max-content;
  min-width: 100%;
}

.hdr-cell {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  white-space: nowrap;
}

.hdr-label {
  color: #64748b;
  margin-right: 6px;
  flex-shrink: 0;
}

.hdr-value {
  white-space: nowrap;
}

.hdr-highlight {
  display: inline-block;
  padding: 1px 8px;
  background: #ffedd5;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
}

.study-plan-detail-wrap {
  overflow-x: auto;
}

.study-plan-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 900px;
}

.study-plan-detail-table th,
.study-plan-detail-table td {
  border: 1px solid #cbd5e1;
  padding: 6px 8px;
  text-align: left;
  vertical-align: middle;
}

.study-plan-detail-table thead th {
  background: #dbeafe;
  color: #1e3a8a;
  font-weight: 600;
  white-space: nowrap;
}

.study-plan-detail-table .session-summary {
  background: #fef9c3;
  font-weight: 600;
}

.study-plan-detail-table .col-year {
  background: #eff6ff;
  font-weight: 700;
  text-align: center;
  vertical-align: top;
}

.study-plan-detail-table .col-name {
  max-width: 220px;
}

.study-plan-detail-table .is-fail td,
.study-plan-detail-table tr.is-fail td {
  background: #fce7f3;
}

.study-plan-detail-table .status-fail {
  color: #be123c;
  font-weight: 600;
}

.study-plan-detail-table .attempt-pass {
  background: #dcfce7;
}

.btn {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-outline {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
