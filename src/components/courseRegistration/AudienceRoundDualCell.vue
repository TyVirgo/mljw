<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  formatRoundRangeDisplay,
  formatRoundRangeDisplayCompact,
  formatRoundRangeTitle,
} from '../../data/courseRegistration/registrationBatches.js'

const props = defineProps({
  /** { senior, freshman } */
  roundsByAudience: { type: Object, default: null },
  roundKey: { type: String, required: true },
  /** 紧凑模式：仅去秒，用于单位批次时间列表 */
  compact: { type: Boolean, default: false },
})

const { t } = useAppI18n()

function line(audience) {
  const range = props.roundsByAudience?.[audience]?.[props.roundKey]
  if (props.compact) return formatRoundRangeDisplayCompact(range, t)
  return formatRoundRangeDisplay(range, t)
}

function title(audience) {
  const range = props.roundsByAudience?.[audience]?.[props.roundKey]
  return formatRoundRangeTitle(range)
}

const cellTitle = computed(
  () => `${title('freshman')} / ${title('senior')}`.trim(),
)
</script>

<template>
  <div class="audience-round-dual" :class="{ compact }" :title="cellTitle">
    <div class="round-dual-line">
      <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceFreshmanLabel') }}</span>
      {{ line('freshman') }}
    </div>
    <div class="round-dual-line">
      <span class="round-aud-tag">{{ t('courseRegistration.batch.audienceSeniorLabel') }}</span>
      {{ line('senior') }}
    </div>
  </div>
</template>

<style scoped>
.audience-round-dual {
  white-space: nowrap;
  line-height: 1.3;
  min-width: 240px;
}

.audience-round-dual.compact {
  min-width: 0;
  max-width: 100%;
  line-height: 1.3;
  font-size: inherit;
}

.audience-round-dual.compact .round-dual-line {
  margin-bottom: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.round-dual-line {
  line-height: 1.3;
  margin-bottom: 1px;
  white-space: nowrap;
}

.round-dual-line:last-child {
  margin-bottom: 0;
}

.round-aud-tag {
  color: #9ca3af;
  margin-right: 4px;
}
</style>
