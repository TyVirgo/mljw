<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { useRegistrationQueue } from '../../composables/useRegistrationQueue.js'
import {
  cancelMyCourseQueue,
  requestOpenRoundStatusDrawer,
} from '../../data/courseRegistration/studentRegistrationStore.js'

const emit = defineEmits(['view-round-status'])

const { t } = useAppI18n()
const {
  queuePhase,
  queueOverlayVisible,
  queueContext,
  successContext,
  waitSeconds,
  queueSize,
  queuePosition,
  hideQueueOverlay,
  dismissRegistrationSuccess,
} = useRegistrationQueue()

const primaryCourse = computed(() => {
  const ctx = queueContext.value || successContext.value
  if (!ctx) return null
  if (ctx.courses?.length) return ctx.courses[0]
  return {
    courseCode: ctx.courseCode,
    courseName: ctx.courseName,
    sectionCode: ctx.section,
    time: ctx.time,
    room: ctx.room,
    lecturer: ctx.lecturer,
    credits: ctx.credits,
  }
})

const successCourses = computed(() => successContext.value?.registeredCourses || [])

const isPendingAssignResult = computed(
  () => successContext.value?.resultKind === 'pendingAssign',
)

const isResultPhase = computed(
  () => queuePhase.value === 'success' || queuePhase.value === 'failed',
)

function courseNameLabel(name) {
  if (String(name || '').startsWith('courseRegistration.')) return t(name)
  return name
}

function failDetailText() {
  const ctx = successContext.value
  if (!ctx?.errorKey) return t('courseRegistration.student.registerFailedQueue')
  return t(ctx.errorKey, ctx.errorParams || {})
}

function handleViewRoundStatus() {
  dismissRegistrationSuccess()
  requestOpenRoundStatusDrawer()
  emit('view-round-status')
}

function handleResultClose() {
  dismissRegistrationSuccess()
}

function handleCloseOverlay() {
  hideQueueOverlay()
}

function handleCancelQueue() {
  if (!window.confirm(t('courseRegistration.queue.cancelQueueConfirm'))) return
  cancelMyCourseQueue(primaryCourse.value)
}
</script>

<template>
  <Teleport to="body">
    <!-- 排队中 -->
    <div
      v-if="queueOverlayVisible && queuePhase === 'waiting' && queueContext"
      class="reg-queue-overlay"
    >
      <div class="reg-queue-panel">
        <div class="reg-queue-header">
          <div class="reg-queue-header-inner">
            <span class="reg-queue-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <div class="reg-queue-status">
              <p class="reg-queue-title">{{ t('courseRegistration.queue.title') }}</p>
              <p class="reg-queue-subtitle">{{ t('courseRegistration.queue.locking') }}</p>
              <p class="reg-queue-wait">
                {{ t('courseRegistration.queue.elapsedWait', { seconds: waitSeconds }) }}
              </p>
            </div>
          </div>
        </div>

        <div class="reg-queue-body">
          <div class="reg-queue-card">
            <template v-if="queueContext.courses?.length > 1">
              <p class="reg-queue-multi-title">
                {{ t('courseRegistration.student.queueCourseCount', { count: queueContext.courses.length }) }}
              </p>
              <ul class="reg-queue-course-list">
                <li v-for="(course, index) in queueContext.courses" :key="index">
                  <span class="reg-queue-code">{{ course.courseCode }}</span>
                  <span class="reg-queue-name">{{ course.courseName }}</span>
                  <span class="reg-queue-meta-inline">
                    {{ course.sectionCode }} · {{ course.time }} · {{ course.lecturer }}
                  </span>
                </li>
              </ul>
            </template>
            <template v-else-if="primaryCourse">
              <div class="reg-queue-route">
                <div class="reg-queue-route-main">
                  <span class="reg-queue-code">{{ primaryCourse.courseCode }}</span>
                  <span class="reg-queue-name">{{ primaryCourse.courseName }}</span>
                </div>
              </div>
              <dl class="reg-queue-dl">
                <div><dt>{{ t('courseRegistration.courses.lecturer') }}</dt><dd>{{ primaryCourse.lecturer || '—' }}</dd></div>
                <div><dt>{{ t('courseRegistration.courses.time') }}</dt><dd>{{ primaryCourse.time || '—' }}</dd></div>
                <div><dt>{{ t('courseRegistration.courses.sectionCode') }}</dt><dd>{{ primaryCourse.sectionCode || queueContext.section || '—' }}</dd></div>
                <div><dt>{{ t('courseRegistration.courses.credits') }}</dt><dd>{{ primaryCourse.credits }}</dd></div>
              </dl>
            </template>
          </div>

          <div class="reg-queue-stats">
            <div class="reg-queue-stat">
              <span class="reg-queue-stat-value">{{ queueSize }}</span>
              <span class="reg-queue-stat-label">{{ t('courseRegistration.queue.queueSize') }}</span>
            </div>
            <div class="reg-queue-stat highlight">
              <span class="reg-queue-stat-value">#{{ queuePosition }}</span>
              <span class="reg-queue-stat-label">{{ t('courseRegistration.queue.yourPosition') }}</span>
            </div>
          </div>

          <div class="reg-queue-progress">
            <div class="reg-queue-progress-bar" />
          </div>
          <p class="reg-queue-tip">{{ t('courseRegistration.queue.tip') }}</p>
        </div>

        <div class="reg-queue-footer-actions">
          <button type="button" class="reg-queue-close" @click="handleCloseOverlay">
            {{ t('common.close') }}
          </button>
          <button type="button" class="reg-queue-cancel" @click="handleCancelQueue">
            {{ t('courseRegistration.queue.cancelQueue') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 选课成功 / 失败（仅队列未关闭时进入） -->
    <div
      v-else-if="queueOverlayVisible && isResultPhase && successContext"
      class="reg-queue-overlay reg-success-overlay"
      :class="{ 'reg-failed-overlay': queuePhase === 'failed' }"
    >
      <div class="reg-queue-panel">
        <div class="reg-success-body">
          <div
            class="reg-success-icon"
            :class="{ 'reg-failed-icon': queuePhase === 'failed' }"
            aria-hidden="true"
          >
            {{ queuePhase === 'failed' ? '!' : '✓' }}
          </div>
          <h2 class="reg-success-title">
            {{
              queuePhase === 'failed'
                ? t('courseRegistration.queue.failTitle')
                : isPendingAssignResult
                  ? t('courseRegistration.queue.pendingAssignTitle')
                  : t('courseRegistration.queue.successTitle')
            }}
          </h2>
          <p class="reg-success-sub">
            {{
              queuePhase === 'failed'
                ? t('courseRegistration.queue.failSub')
                : isPendingAssignResult
                  ? t('courseRegistration.queue.pendingAssignSub')
                  : t('courseRegistration.queue.successSub')
            }}
          </p>

          <div class="reg-queue-card reg-success-card">
            <ul v-if="successCourses.length > 1" class="reg-queue-course-list">
              <li v-for="(course, index) in successCourses" :key="index">
                <span class="reg-queue-code">{{ course.courseCode }}</span>
                <span class="reg-queue-name">{{ courseNameLabel(course.courseName) }}</span>
                <span class="reg-queue-meta-inline">
                  {{ course.sectionCode }} · {{ course.lecturer }} · {{ course.credits }} cr
                </span>
              </li>
            </ul>
            <template v-else-if="successCourses[0]">
              <p class="reg-success-course-label">{{ t('courseRegistration.courses.name') }}</p>
              <p class="reg-success-course-name">
                {{ successCourses[0].courseCode }} {{ courseNameLabel(successCourses[0].courseName) }}
              </p>
              <p class="reg-success-course-meta">
                {{ t('courseRegistration.courses.lecturer') }}: {{ successCourses[0].lecturer }}
              </p>
              <p class="reg-success-course-meta">
                {{ successCourses[0].time }} · {{ t('courseRegistration.courses.sectionCode') }} {{ successCourses[0].sectionCode }}
              </p>
            </template>
            <p
              class="reg-success-added"
              :class="{ 'reg-failed-note': queuePhase === 'failed' }"
            >
              {{
                queuePhase === 'failed'
                  ? failDetailText()
                  : isPendingAssignResult
                    ? t('courseRegistration.queue.pendingAssignAdded')
                    : t('courseRegistration.queue.addedToSemester')
              }}
            </p>
          </div>

          <button type="button" class="reg-success-primary" @click="handleViewRoundStatus">
            {{ t('courseRegistration.queue.viewRoundStatus') }}
          </button>
          <button type="button" class="reg-queue-cancel" @click="handleResultClose">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.reg-queue-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.reg-queue-panel {
  width: min(520px, 100%);
  max-height: min(90vh, 720px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f3f4f6;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
}

.reg-queue-header {
  background: linear-gradient(180deg, #1d4ed8 0%, #2563eb 100%);
  padding: 32px 24px 64px;
  color: #fff;
  flex-shrink: 0;
}

.reg-queue-header-inner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.reg-queue-logo {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reg-queue-logo svg {
  width: 22px;
  height: 22px;
}

.reg-queue-status {
  min-width: 0;
  flex: 1;
}

.reg-queue-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
}

.reg-queue-subtitle {
  margin: 0 0 8px;
  font-size: 14px;
  opacity: 0.92;
}

.reg-queue-wait {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.reg-queue-body {
  flex: 1;
  margin: -48px 16px 0;
  padding-bottom: 16px;
  overflow-y: auto;
  min-height: 0;
}

.reg-queue-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.reg-queue-route {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.reg-queue-code {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.reg-queue-name {
  display: block;
  font-size: 14px;
  color: #374151;
  margin-top: 4px;
}

.reg-queue-credits {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.reg-queue-dl {
  margin: 0;
  display: grid;
  gap: 8px;
}

.reg-queue-dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  border-top: 1px solid #f3f4f6;
  padding-top: 8px;
}

.reg-queue-dl dt {
  color: #9ca3af;
}

.reg-queue-dl dd {
  margin: 0;
  color: #374151;
  text-align: right;
}

.reg-queue-batch,
.reg-queue-student {
  margin: 12px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.reg-queue-multi-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}

.reg-queue-course-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.reg-queue-course-list li {
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.reg-queue-course-list li:last-child {
  border-bottom: none;
}

.reg-queue-meta-inline {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.reg-queue-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 16px 4px;
}

.reg-queue-stat {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.reg-queue-stat.highlight {
  border-color: #93c5fd;
  background: #eff6ff;
}

.reg-queue-stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.reg-queue-stat-label {
  font-size: 11px;
  color: #6b7280;
}

.reg-queue-progress {
  margin: 8px 8px 12px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.reg-queue-progress-bar {
  height: 100%;
  width: 40%;
  background: #2563eb;
  border-radius: 2px;
  animation: queue-progress 1.2s ease-in-out infinite alternate;
}

@keyframes queue-progress {
  from { width: 25%; margin-left: 0; }
  to { width: 55%; margin-left: 45%; }
}

.reg-queue-tip {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.reg-queue-footer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 16px 28px;
  flex-shrink: 0;
}

.reg-queue-close {
  min-width: 88px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #e5e7eb;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.reg-queue-cancel {
  margin: 0;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #2563eb;
  font-size: 15px;
  cursor: pointer;
}

.reg-success-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px 24px;
  overflow-y: auto;
  min-height: 0;
}

.reg-success-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #10b981;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.reg-failed-icon {
  background: #dc2626;
  font-size: 32px;
}

.reg-failed-note {
  color: #b91c1c !important;
}

.reg-success-title {
  margin: 0 0 8px;
  font-size: 22px;
  color: #111827;
}

.reg-success-sub {
  margin: 0 0 24px;
  font-size: 14px;
  color: #6b7280;
}

.reg-success-card {
  width: 100%;
  margin-bottom: 24px;
}

.reg-success-course-label {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.reg-success-course-name {
  margin: 6px 0;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.reg-success-course-meta {
  margin: 4px 0;
  font-size: 13px;
  color: #6b7280;
}

.reg-success-added {
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  font-size: 13px;
  color: #047857;
  font-weight: 500;
}

.reg-success-primary {
  width: 100%;
  max-width: 320px;
  padding: 12px 20px;
  margin-bottom: 12px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
</style>
