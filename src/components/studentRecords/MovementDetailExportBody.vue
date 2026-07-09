<script setup>
import { computed } from 'vue'
import ApprovalTimeline from '../common/ApprovalTimeline.vue'
import MovementDetailContent from './MovementDetailContent.vue'
import ProgrammeTransferOfficeUseSection from './ProgrammeTransferOfficeUseSection.vue'
import { buildMovementTimelineNodes } from '../../utils/buildApprovalTimelineNodes.js'
import { resolveProgrammeTransferOfficeUseDefaults } from '../../data/programmeTransfers.js'

const props = defineProps({
  sourceKey: { type: String, required: true },
  item: { type: Object, required: true },
  maskSensitiveFields: { type: Boolean, default: false },
  useDemoAttachments: { type: Boolean, default: true },
  showAttachmentExport: { type: Boolean, default: true },
  showOfficeUseEditable: { type: Boolean, default: false },
  showOfficeUseReadonly: { type: Boolean, default: false },
})

const officeUseFields = defineModel('officeUseFields', { type: Object, default: null })

const timelineNodes = computed(() => buildMovementTimelineNodes(props.item, props.sourceKey))
</script>

<template>
  <div class="movement-detail-export-root">
    <ApprovalTimeline :nodes="timelineNodes" />
    <MovementDetailContent
      :source-key="sourceKey"
      :item="item"
      :mask-sensitive-fields="maskSensitiveFields"
      :use-demo-attachments="useDemoAttachments"
      :show-attachment-export="showAttachmentExport"
    />
    <ProgrammeTransferOfficeUseSection
      v-if="showOfficeUseEditable"
      v-model="officeUseFields"
      :item="item"
      editable
    />
    <ProgrammeTransferOfficeUseSection
      v-else-if="showOfficeUseReadonly"
      :item="item"
      :model-value="resolveProgrammeTransferOfficeUseDefaults(item)"
    />
  </div>
</template>

<style scoped>
.movement-detail-export-root {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
