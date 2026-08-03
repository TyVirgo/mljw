<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import { downloadAttachmentMock } from '../../utils/attachmentPreview.js'
import {
  formatAddDropCourseText,
  getAddDropCourseColumnTexts,
} from '../../utils/addDropCourseDisplay.js'

const props = defineProps({
  application: { type: Object, default: null },
  /** 是否展示附件导出按钮 */
  showAttachmentExport: { type: Boolean, default: true },
})

const { t } = useAppI18n()

const app = computed(() => props.application)
const courseCols = computed(() => getAddDropCourseColumnTexts(app.value))

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
          <div class="field-value">{{ statusLabel(app.status) }}</div>
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
      <div class="section-bar">{{ t('courseRegistration.student.detailCourses') }}</div>
      <div class="field-grid">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.addCourseName') }}</div>
          <div class="field-value">{{ courseCols.add }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.dropCourseName') }}</div>
          <div class="field-value">{{ courseCols.drop }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.retakeCourseName') }}</div>
          <div class="field-value">{{ courseCols.retake }}</div>
        </div>
      </div>
      <table v-if="app.items?.length" class="mini-table">
        <thead>
          <tr>
            <th>{{ t('courseRegistration.approval.action') }}</th>
            <th>{{ t('courseRegistration.courses.code') }}</th>
            <th>{{ t('courseRegistration.courses.credits') }}</th>
            <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
            <th>{{ t('courseRegistration.courses.time') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in app.items" :key="i">
            <td>{{ typeLabel(item.action) }}</td>
            <td>{{ formatAddDropCourseText(item) }}</td>
            <td>{{ item.credits ?? '—' }}</td>
            <td>{{ item.section || '—' }}</td>
            <td>{{ item.time || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="detail-section">
      <div class="section-bar">{{ t('courseRegistration.student.detailExtra') }}</div>
      <div class="field-grid field-grid--single">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.feeWaiverLabel') }}</div>
          <div class="field-value">{{ feeWaiverLabel() }}</div>
        </div>
        <div class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.applicationReason') }}</div>
          <div class="field-value">{{ app.reason || '—' }}</div>
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
  font-size: 13px;
  font-weight: 700;
  color: #111827;
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

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mini-table th,
.mini-table td {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.mini-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
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
