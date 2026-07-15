<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  sourceKey: { type: String, default: '' },
  text: { type: String, default: '' },
})

const { t } = useAppI18n()

const sourceLabels = {
  courseLibrary: 'courseRegistration.external.courseLibrary',
  programme: 'courseRegistration.external.programme',
  scheduling: 'courseRegistration.external.scheduling',
  studyPlan: 'courseRegistration.external.studyPlan',
  finance: 'courseRegistration.external.finance',
}

const tooltip = computed(() => {
  if (props.text?.trim()) return props.text.trim()
  if (!props.sourceKey) return ''
  const key = sourceLabels[props.sourceKey]
  if (!key) return ''
  const translated = t(key)
  if (!translated || translated === key) return ''
  return translated
})

const hasTooltip = computed(() => !!tooltip.value)
</script>

<template>
  <span v-if="hasTooltip" class="hint-popover-wrap external-hint">
    <span class="hint-popover-trigger" tabindex="0" role="button" :aria-label="tooltip">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path
          d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
        />
      </svg>
    </span>
    <span class="hint-popover-content hint-popover-content--sm" role="tooltip">{{ tooltip }}</span>
  </span>
</template>

<style scoped>
.external-hint .hint-popover-trigger svg {
  width: 14px;
  height: 14px;
}
</style>
