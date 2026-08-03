<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentReadonly from './MovementAttachmentReadonly.vue'
import {
  getMovementDocumentFields,
  normalizeMovementAttachments,
  isInternationalMovementApplicant,
  resolveAttachmentNationGroup,
} from '../../data/movementAttachments.js'
import { buildMovementAttachmentExportFilename } from '../../utils/movementExportNames.js'

const DEMO_ATTACHMENT_FILES = {
  consentLetter: 'consent-letter.pdf',
  flightTickets: 'flight-tickets.pdf',
  medicalRecovery: 'medical-recovery.pdf',
  accommodationCheckOut: 'accommodation-checkout.pdf',
  medicalRecord: 'medical-record.pdf',
  visaRelatedDocuments: 'visa-related-documents.pdf',
}

const props = defineProps({
  sourceKey: { type: String, required: true },
  item: { type: Object, required: true },
  useDemoAttachments: { type: Boolean, default: false },
  showAttachmentExport: { type: Boolean, default: false },
})

const { t } = useAppI18n()

const studentCategory = computed(
  () => props.item.studentCategory || props.item.studentType || 'Local',
)

const nationality = computed(() => props.item.nationality || '')

const attachments = computed(() => normalizeMovementAttachments(props.item))

const documentFields = computed(() =>
  getMovementDocumentFields(props.sourceKey, studentCategory.value, nationality.value),
)

/**
 * 解析单槽展示文件名（含 demo 回退）
 * @param {string} fieldKey 槽位键
 */
function resolveFileName(fieldKey) {
  const actual = attachments.value[fieldKey]?.fileName
  if (actual) return actual
  if (!props.useDemoAttachments) return ''
  if (fieldKey === 'flightTickets' && !shouldDemoFlightTickets()) {
    return ''
  }
  if (fieldKey === 'visaRelatedDocuments' && !shouldDemoVisaRelated()) {
    return ''
  }
  return DEMO_ATTACHMENT_FILES[fieldKey] || 'attachment.pdf'
}

/** 机票 demo：退学一律；休学仅中国/其他；其余类型仅 International */
function shouldDemoFlightTickets() {
  if (props.sourceKey === 'withdrawal') return true
  if (props.sourceKey === 'deferment') {
    const group = resolveAttachmentNationGroup(nationality.value, studentCategory.value)
    return group === 'china' || group === 'other'
  }
  if (props.sourceKey === 'resumption') return false
  return isInternationalMovementApplicant(studentCategory.value)
}

/** 签证材料 demo：仅复学且中国/其他 */
function shouldDemoVisaRelated() {
  if (props.sourceKey !== 'resumption') return false
  const group = resolveAttachmentNationGroup(nationality.value, studentCategory.value)
  return group === 'china' || group === 'other'
}

function resolveFileMeta(fieldKey) {
  const actual = attachments.value[fieldKey]
  if (actual?.fileName) return actual
  const fileName = resolveFileName(fieldKey)
  return fileName ? { fileName, size: 0 } : null
}

function exportFileName(fieldKey, fileName) {
  return buildMovementAttachmentExportFilename(props.sourceKey, props.item, fieldKey, fileName)
}

/**
 * Other Documents 只读行：有文件的槽位；无文件且 demo 时给一行占位
 */
const otherDocumentRows = computed(() => {
  const list = attachments.value.otherDocuments || []
  const withFiles = list
    .map((slot, index) => ({ slot, index }))
    .filter((row) => row.slot?.fileName)
  if (withFiles.length) return withFiles
  if (props.useDemoAttachments) {
    return [{ slot: { fileName: 'other-document.pdf', size: 0 }, index: 0 }]
  }
  return []
})
</script>

<template>
  <div class="movement-attachments-readonly">
    <template v-for="field in documentFields" :key="field.key">
      <!-- 多附件只读：逐个已上传文件一行 -->
      <template v-if="field.multi">
        <MovementAttachmentReadonly
          v-for="row in otherDocumentRows"
          :key="`other-${row.index}`"
          :file-name="row.slot.fileName"
          :file-meta="row.slot"
          :label-key="field.labelKey"
          :required="field.required"
          :show-attachment-export="showAttachmentExport && !!row.slot.fileName"
          :attachment-export-name="exportFileName(field.key, row.slot.fileName)"
        />
        <div
          v-if="!otherDocumentRows.length"
          class="movement-attachments-readonly__empty-other"
        >
          <span class="empty-label">{{ t(field.labelKey) }}</span>
          <span class="empty-value">—</span>
        </div>
      </template>
      <MovementAttachmentReadonly
        v-else
        :file-name="resolveFileName(field.key)"
        :file-meta="resolveFileMeta(field.key)"
        :label-key="field.labelKey"
        :required="field.required"
        :show-attachment-export="showAttachmentExport && !!resolveFileName(field.key)"
        :attachment-export-name="exportFileName(field.key, resolveFileName(field.key))"
      />
    </template>
  </div>
</template>

<style scoped>
.movement-attachments-readonly {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.movement-attachments-readonly__empty-other {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.empty-label {
  font-weight: 600;
  color: #111827;
}

.empty-value {
  color: #9ca3af;
}
</style>
