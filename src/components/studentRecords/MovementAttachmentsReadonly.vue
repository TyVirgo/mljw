<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MovementAttachmentReadonly from './MovementAttachmentReadonly.vue'
import {
  getMovementDocumentFields,
  normalizeMovementAttachments,
  isInternationalMovementApplicant,
} from '../../data/movementAttachments.js'
import { buildMovementAttachmentExportFilename } from '../../utils/movementExportNames.js'

const DEMO_ATTACHMENT_FILES = {
  consentLetter: 'consent-letter.pdf',
  flightTickets: 'flight-tickets.pdf',
  medicalRecovery: 'medical-recovery.pdf',
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

const attachments = computed(() => normalizeMovementAttachments(props.item))

const documentFields = computed(() =>
  getMovementDocumentFields(props.sourceKey, studentCategory.value),
)

function resolveFileName(fieldKey) {
  const actual = attachments.value[fieldKey]?.fileName
  if (actual) return actual
  if (!props.useDemoAttachments) return ''
  if (fieldKey === 'flightTickets' && !isInternationalMovementApplicant(studentCategory.value)) {
    return ''
  }
  return DEMO_ATTACHMENT_FILES[fieldKey] || 'attachment.pdf'
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
</script>

<template>
  <div class="movement-attachments-readonly">
    <MovementAttachmentReadonly
      v-for="field in documentFields"
      :key="field.key"
      :file-name="resolveFileName(field.key)"
      :file-meta="resolveFileMeta(field.key)"
      :label-key="field.labelKey"
      :required="field.required"
      :show-attachment-export="showAttachmentExport && !!resolveFileName(field.key)"
      :attachment-export-name="exportFileName(field.key, resolveFileName(field.key))"
    />
  </div>
</template>

<style scoped>
.movement-attachments-readonly {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
