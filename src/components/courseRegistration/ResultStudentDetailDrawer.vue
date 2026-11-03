<script setup>
/**
 * 选课结果·学生维：行详情（主表隐列 + 原因/附件）
 */
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import { feeCourseSourceLabel } from '../../data/courseRegistration/feeRosterQueue.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import {
  formatStudentOpResultLabel,
  formatStudentResultPreferenceLabel,
  resolveAdminAddAttachments,
} from '../../data/courseRegistration/registrationResult.js'

const props = defineProps({
  visible: Boolean,
  /** 学生维结果行 */
  row: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const title = computed(() => t('courseRegistration.result.studentDetailTitle'))

const subtitle = computed(() => {
  if (!props.row) return ''
  const id = props.row.studentId || ''
  const name = props.row.studentName || ''
  return [id, name].filter(Boolean).join(' · ')
})

/**
 * 空值展示为 —
 * @param {unknown} value
 */
function displayOrDash(value) {
  if (value == null || value === '') return '—'
  return String(value)
}

/** 代选附件列表（兼容旧单字段） */
const attachmentFiles = computed(() => resolveAdminAddAttachments(props.row))

/**
 * 附件大小展示
 * @param {number} bytes
 * @returns {string}
 */
function formatAttachSize(bytes) {
  const n = Number(bytes) || 0
  if (n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

const reasonText = computed(() => {
  const text = String(props.row?.adminAddReason || '').trim()
  return text || '—'
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    @close="handleClose"
  >
    <template v-if="row">
      <section class="detail-section">
        <h4>{{ t('courseRegistration.result.studentDetailSectionCourse') }}</h4>
        <dl class="detail-dl">
          <div class="detail-row">
            <dt>{{ t('courseRegistration.batch.name') }}</dt>
            <dd>{{ displayOrDash(row.batchName) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.courses.code') }}</dt>
            <dd>{{ displayOrDash(row.courseCode) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.courses.name') }}</dt>
            <dd>{{ displayOrDash(row.courseName) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.courses.credits') }}</dt>
            <dd>{{ displayOrDash(row.credits) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.courses.type') }}</dt>
            <dd>{{ getRegistrationTypeLabel(row.courseType, t) || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.courses.sectionCode') }}</dt>
            <dd>
              {{
                row.sectionCode
                  ? t('courseRegistration.courses.sectionNameDisplay', { code: row.sectionCode })
                  : '—'
              }}
            </dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.student.courseSource') }}</dt>
            <dd>{{ feeCourseSourceLabel(row.courseSource, t) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.result.coursePreference') }}</dt>
            <dd>{{ formatStudentResultPreferenceLabel(row, t) }}</dd>
          </div>
        </dl>
      </section>

      <section class="detail-section">
        <h4>{{ t('courseRegistration.result.studentDetailSectionStudent') }}</h4>
        <dl class="detail-dl">
          <div class="detail-row">
            <dt>{{ t('courseRegistration.monitor.programme') }}</dt>
            <dd>{{ displayOrDash(row.programme) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.monitor.intake') }}</dt>
            <dd>{{ formatIntakeBatch(row.intake) || '—' }}</dd>
          </div>
        </dl>
      </section>

      <section class="detail-section">
        <h4>{{ t('courseRegistration.result.studentDetailSectionOp') }}</h4>
        <dl class="detail-dl">
          <div class="detail-row">
            <dt>{{ t('courseRegistration.log.operator') }}</dt>
            <dd>
              <span>{{ displayOrDash(row.operatorId) }}</span>
              <span v-if="row.operatorName" class="op-name">{{ row.operatorName }}</span>
            </dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.log.operatedAt') }}</dt>
            <dd>{{ displayOrDash(row.operatedAt) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.result.selectionResult') }}</dt>
            <dd>
              <span class="result-op-tag" :class="row.opResult">
                {{ formatStudentOpResultLabel(row, t) }}
              </span>
            </dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.result.adminAddReason') }}</dt>
            <dd class="dd-multiline">{{ reasonText }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('courseRegistration.result.adminAddAttachment') }}</dt>
            <dd>
              <ul v-if="attachmentFiles.length" class="detail-attach-list">
                <li
                  v-for="(file, idx) in attachmentFiles"
                  :key="`${file.name}-${idx}`"
                  class="detail-attach-item"
                >
                  <AttachmentPreviewTrigger
                    :file-name="file.name"
                    :file-meta="{ fileName: file.name, size: file.size || 0 }"
                    :download-label="file.name"
                  />
                  <span v-if="formatAttachSize(file.size)" class="detail-attach-size">
                    {{ formatAttachSize(file.size) }}
                  </span>
                </li>
              </ul>
              <template v-else>—</template>
            </dd>
          </div>
        </dl>
      </section>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.detail-section {
  margin: 0 0 20px;
}

.detail-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.detail-dl {
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.detail-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row dt {
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

.detail-row dd {
  margin: 0;
  color: #111827;
  word-break: break-word;
}

.dd-multiline {
  white-space: pre-wrap;
}

.detail-attach-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-attach-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.detail-attach-size {
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}

.op-name {
  margin-left: 8px;
  color: #6b7280;
}

.result-op-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.result-op-tag.registerSuccess {
  background: #ecfdf5;
  color: #047857;
}

.result-op-tag.pendingAssign {
  background: #eff6ff;
  color: #1d4ed8;
}
</style>
