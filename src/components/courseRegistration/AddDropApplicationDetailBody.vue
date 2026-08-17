<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import { downloadAttachmentMock } from '../../utils/attachmentPreview.js'
import {
  formatAddDropCourseText,
  getAddDropCourseColumnTexts,
} from '../../utils/addDropCourseDisplay.js'
import { getVisibleAddDropSections, buildAddDropSectionBars } from '../../data/courseRegistration/addDropFormSections.js'
import { addDropStatusBadgeClass } from '../../data/courseRegistration/addDropStatusBadge.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { displayClassTimeVenueFromFields } from '../../data/courseRegistration/sectionScheduleFields.js'
import '../../styles/movement-status-badge.css'

const props = defineProps({
  application: { type: Object, default: null },
  /** 是否展示附件导出按钮 */
  showAttachmentExport: { type: Boolean, default: true },
})

const { t, isZh } = useAppI18n()
const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

function snapTimeVenue(kind) {
  const snap = snapFor(kind)
  const item =
    kind === 'drop'
      ? itemByAction('Drop')
      : kind === 'add'
        ? itemByAction('Add')
        : itemByAction('Retake')
  const appVal = app.value || {}
  return displayClassTimeVenueFromFields(
    {
      time: snap?.time || item?.time,
      classTime:
        snap?.classTime ||
        (kind === 'drop'
          ? appVal.dropClassTime
          : kind === 'add'
            ? appVal.addClassTime
            : appVal.classTime) ||
        item?.classTime ||
        item?.time,
      venue:
        snap?.venue ||
        (kind === 'drop' ? appVal.dropVenue : kind === 'add' ? appVal.addVenue : appVal.venue) ||
        item?.room,
      weekRange:
        snap?.weekRange ||
        (kind === 'drop'
          ? appVal.dropWeekRange
          : kind === 'add'
            ? appVal.addWeekRange
            : appVal.weekRange) ||
        item?.weekRange,
      meetings: snap?.meetings || item?.meetings,
    },
    timeLocale.value,
  )
}
const app = computed(() => props.application)
const courseCols = computed(() => getAddDropCourseColumnTexts(app.value))
const sections = computed(() => getVisibleAddDropSections(app.value?.type || 'Add'))
const sectionBars = computed(() => buildAddDropSectionBars(app.value?.type || 'Add', t))

const attachmentFile = computed(() => {
  const file = app.value?.attachments?.[0]
  if (!file?.name) return null
  return { fileName: file.name, size: file.size || 0 }
})

const showAttachmentsSection = computed(() => {
  if (!app.value) return false
  return (
    Boolean(attachmentFile.value) ||
    app.value.dropChannel === 'special' ||
    app.value.type === 'Drop' ||
    app.value.type === 'AddDrop'
  )
})

const excessCreditsDisplay = computed(() => {
  const a = app.value
  if (!a) return ''
  const n =
    a.excessCredits ??
    a.billableCredits ??
    a.feeEstimate?.billableCredits ??
    (a.feeEstimate?.items || []).reduce((s, i) => s + (Number(i.billableCredits) || 0), 0)
  if (n == null || n === '') return ''
  return String(n)
})

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

function feeWaiverLabel() {
  const row = app.value
  if (!row) return '—'
  if (row.type !== 'Drop' && row.type !== 'AddDrop') return '—'
  if (row.feeWaiver === true) return t('courseRegistration.student.feeWaiverYes')
  if (row.feeWaiver === false) return t('courseRegistration.student.feeWaiverNo')
  return '—'
}

function dash(v) {
  if (v === true) return t('courseRegistration.student.feeWaiverYes')
  if (v === false) return t('courseRegistration.student.feeWaiverNo')
  return v && String(v).trim() ? v : '—'
}

function retakeTypeLabel(value) {
  if (!value) return '—'
  const mapped = {
    improve_grade: 'improveGrade',
    failed: 'failed',
    other: 'other',
  }
  const k = mapped[value] || value
  return resolveI18nLabel(`courseRegistration.student.retakeType.${k}`, value)
}

function snapFor(kind) {
  return app.value?.courseSnapshots?.[kind] || null
}

function itemByAction(action) {
  return (app.value?.items || []).find((i) => i.action === action) || null
}

function courseText(item) {
  if (!item) return ''
  return formatAddDropCourseText(item)
}

function exportAttachment() {
  if (!attachmentFile.value?.fileName) return
  downloadAttachmentMock(attachmentFile.value.fileName, attachmentFile.value.fileName)
}
</script>

<template>
  <div v-if="app" class="adddrop-detail-body">
    <section class="detail-section">
      <div class="section-bar">{{ t('courseRegistration.student.detailBasic') }}</div>
      <div class="field-grid">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.applicationNo') }}</div>
          <div class="field-value">{{ app.applicationNo }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.batch.academicSession') }}</div>
          <div class="field-value">{{ app.academicSession || '—' }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.typeLabel') }}</div>
          <div class="field-value">{{ typeLabel(app.type) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.status') }}</div>
          <div class="field-value">
            <span class="status-badge" :class="addDropStatusBadgeClass(app.status)">
              {{ statusLabel(app.status) }}
            </span>
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.submittedAt') }}</div>
          <div class="field-value">{{ app.submittedAt || '—' }}</div>
        </div>
        <div v-if="app.dropChannel" class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.dropChannelLabel') }}</div>
          <div class="field-value">
            {{ t(`courseRegistration.student.dropChannel.${app.dropChannel}`) }}
            <template v-if="app.teachingWeek">
              · {{ t('courseRegistration.student.teachingWeekOption', { week: app.teachingWeek }) }}
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <div class="section-bar">{{ sectionBars.student }}</div>
      <div class="field-grid">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldStudentId') }}</div>
          <div class="field-value">{{ dash(app.studentId) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldStudentName') }}</div>
          <div class="field-value">{{ dash(app.studentName) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldProgramme') }}</div>
          <div class="field-value">{{ dash(app.programme) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.contactPhone') }}</div>
          <div class="field-value">{{ dash(app.contactPhone) }}</div>
        </div>
      </div>
    </section>

    <section v-if="sections.showIII" class="detail-section">
      <div class="section-bar">{{ sectionBars.drop }}</div>
      <div class="field-grid">
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.approval.dropCourseName') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('drop')?.label ||
                  courseText(itemByAction('Drop')) ||
                  courseCols.drop,
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldGroupNo') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('drop')?.groupName ||
                  app.dropSectionName ||
                  formatCourseSectionName(
                    snapFor('drop')?.groupNo || app.dropSectionCode || itemByAction('Drop')?.section,
                    t,
                  ),
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldWeekRange') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('drop')?.weekRange ||
                  app.dropWeekRange ||
                  app.weekRange ||
                  itemByAction('Drop')?.weekRange,
              )
            }}
          </div>
        </div>
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</div>
          <div class="field-value field-value--pre">{{ dash(snapTimeVenue('drop')) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldLecturers') }}</div>
          <div class="field-value">
            {{ dash(snapFor('drop')?.lecturers || app.dropLecturers || itemByAction('Drop')?.lecturer) }}
          </div>
        </div>
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.dropReason') }}</div>
          <div class="field-value">{{ dash(app.dropReason || app.reason) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.feeWaiverLabel') }}</div>
          <div class="field-value">{{ feeWaiverLabel() }}</div>
        </div>
      </div>
    </section>

    <section v-if="sections.showII" class="detail-section">
      <div class="section-bar">{{ sectionBars.add }}</div>
      <div class="field-grid">
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.approval.addCourseName') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('add')?.label ||
                  courseText(itemByAction('Add')) ||
                  courseCols.add,
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldGroupNo') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('add')?.groupName ||
                  app.addSectionName ||
                  app.sectionName ||
                  formatCourseSectionName(
                    snapFor('add')?.groupNo ||
                      app.addSectionCode ||
                      app.sectionCode ||
                      itemByAction('Add')?.section,
                    t,
                  ),
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldWeekRange') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('add')?.weekRange ||
                  app.addWeekRange ||
                  app.weekRange ||
                  itemByAction('Add')?.weekRange,
              )
            }}
          </div>
        </div>
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</div>
          <div class="field-value field-value--pre">{{ dash(snapTimeVenue('add')) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldLecturers') }}</div>
          <div class="field-value">
            {{ dash(snapFor('add')?.lecturers || app.addLecturers || app.lecturers || itemByAction('Add')?.lecturer) }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldCredits') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('add')?.credits ??
                  app.addCredits ??
                  app.credits ??
                  itemByAction('Add')?.credits,
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldExcessCredits') }}</div>
          <div class="field-value">{{ dash(excessCreditsDisplay) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.feeEstimateShort') }}</div>
          <div class="field-value">{{ dash(app.billAmount ?? app.feeEstimate?.total) }}</div>
        </div>
        <div v-if="app.addNotes" class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.addNotesLabel') }}</div>
          <div class="field-value">{{ dash(app.addNotes) }}</div>
        </div>
      </div>
    </section>

    <section v-if="sections.showIV" class="detail-section">
      <div class="section-bar">{{ sectionBars.retake }}</div>
      <div class="field-grid">
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.previouslyTakenCourse') }}</div>
          <div class="field-value">{{ dash(app.previouslyTakenCourse) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.gradeEarned') }}</div>
          <div class="field-value">
            {{ dash(app.gradeEarned || itemByAction('Retake')?.retakeGrade) }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.academicSessionTaken') }}</div>
          <div class="field-value">{{ dash(app.academicSessionTaken) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.retakeTypeLabel') }}</div>
          <div class="field-value">{{ retakeTypeLabel(app.retakeType) }}</div>
        </div>
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.approval.retakeCourseName') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('retake')?.label ||
                  courseText(itemByAction('Retake')) ||
                  courseCols.retake,
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldGroupNo') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('retake')?.groupName ||
                  app.sectionName ||
                  formatCourseSectionName(
                    snapFor('retake')?.groupNo || app.sectionCode || itemByAction('Retake')?.section,
                    t,
                  ),
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldWeekRange') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('retake')?.weekRange || app.weekRange || itemByAction('Retake')?.weekRange,
              )
            }}
          </div>
        </div>
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</div>
          <div class="field-value field-value--pre">{{ dash(snapTimeVenue('retake')) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldLecturers') }}</div>
          <div class="field-value">
            {{ dash(snapFor('retake')?.lecturers || app.lecturers || itemByAction('Retake')?.lecturer) }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldCredits') }}</div>
          <div class="field-value">
            {{
              dash(
                snapFor('retake')?.credits ??
                  app.credits ??
                  itemByAction('Retake')?.credits,
              )
            }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldExcessCredits') }}</div>
          <div class="field-value">{{ dash(excessCreditsDisplay) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.feeEstimateShort') }}</div>
          <div class="field-value">{{ dash(app.billAmount ?? app.feeEstimate?.total) }}</div>
        </div>
      </div>
    </section>

    <section
      v-if="(app.billAmount != null && app.billAmount !== '') || app.feeEstimate"
      class="detail-section"
    >
      <div class="section-bar">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
      <div class="field-grid field-grid--single">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.feeEstimateTotal') }}</div>
          <div class="field-value">{{ dash(app.billAmount ?? app.feeEstimate?.total) }}</div>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <div class="section-bar">{{ sectionBars.declaration }}</div>
      <div class="field-grid field-grid--single">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.declarationAgree') }}</div>
          <div class="field-value">
            {{
              app.declarationAgreed
                ? t('courseRegistration.student.declarationAgreedYes')
                : '—'
            }}
          </div>
        </div>
      </div>
    </section>

    <section v-if="showAttachmentsSection" class="detail-section">
      <div class="section-bar">{{ t('courseRegistration.student.detailAttachments') }}</div>
      <div class="attachment-panel">
        <div class="attachment-header">
          <label class="attachment-label">
            {{ t('courseRegistration.student.dropAttachment') }}
            <span v-if="app.dropChannel === 'special'" class="required">*</span>
            :
          </label>
          <button
            v-if="showAttachmentExport && attachmentFile"
            type="button"
            class="btn btn-outline"
            @click="exportAttachment"
          >
            {{ t('movementExport.exportAttachment') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
        <div class="attachment-file-row">
          <AttachmentPreviewTrigger
            v-if="attachmentFile"
            :file-name="attachmentFile.fileName"
            :file-meta="attachmentFile"
            :download-label="attachmentFile.fileName"
          />
          <span v-else class="attachment-empty">—</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.adddrop-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  margin: 0;
}

.section-bar {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  margin-bottom: 12px;
}

.field-grid--single {
  grid-template-columns: 1fr;
}

.field-item--full {
  grid-column: 1 / -1;
}

.field-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #6b7280;
}

.field-value {
  font-size: 14px;
  color: #111827;
  word-break: break-word;
  line-height: 1.45;
}

.field-value--pre {
  white-space: pre-line;
}

.attachment-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fff;
}

.attachment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.attachment-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.required {
  color: #dc2626;
  margin-left: 2px;
}

.attachment-file-row {
  min-height: 28px;
}

.attachment-empty {
  color: #9ca3af;
  font-size: 13px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  background: #fff;
}

.btn-outline {
  border-color: #d1d5db;
  color: #374151;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

@media (max-width: 720px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
