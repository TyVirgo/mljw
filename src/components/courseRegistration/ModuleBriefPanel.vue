<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getModuleBrief } from '../../data/courseRegistration/courseRegistrationModuleBriefs.js'
import { computed } from 'vue'

const props = defineProps({
  pageId: { type: String, required: true },
})

const { t } = useAppI18n()
const brief = computed(() => getModuleBrief(props.pageId))

function lineHasContent(line) {
  const content = line.replace(/^[^:：]+[:：]\s*/, '').trim()
  return content.length > 0
}

const tooltipLines = computed(() => {
  if (!brief.value) return []
  return [
    `${t('courseRegistration.briefs.labelSource')}${t(brief.value.sourceKey)}`,
    `${t('courseRegistration.briefs.labelRequirements')}${t(brief.value.requirementsKey)}`,
    `${t('courseRegistration.briefs.labelFeatures')}${t(brief.value.featuresKey)}`,
  ].filter(lineHasContent)
})

const hasGuide = computed(() => tooltipLines.value.length > 0)
</script>

<template>
  <div v-if="hasGuide" class="hint-popover-wrap module-brief-hint-wrap">
    <button
      type="button"
      class="module-brief-hint-btn hint-popover-trigger"
      :aria-label="t('courseRegistration.briefs.guide')"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path
          d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
        />
      </svg>
      <span>{{ t('courseRegistration.briefs.guide') }}</span>
    </button>
    <div class="hint-popover-content module-brief-popover" role="tooltip">
      <p v-for="(line, index) in tooltipLines" :key="index">{{ line }}</p>
    </div>
  </div>
</template>

<style scoped>
.module-brief-hint-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: middle;
}

.module-brief-hint-wrap::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 8px;
}

.module-brief-hint-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
  cursor: help;
  border-radius: 6px;
}

.module-brief-hint-btn:hover,
.module-brief-hint-wrap:focus-within .module-brief-hint-btn {
  color: #2563eb;
  background: #eff6ff;
}

.module-brief-hint-btn svg {
  width: 14px;
  height: 14px;
}

.module-brief-popover {
  display: none;
  position: absolute;
  z-index: 50;
  top: calc(100% + 4px);
  right: 0;
  left: auto;
  transform: none;
  width: min(420px, 70vw);
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  line-height: 1.55;
  color: #374151;
  text-align: left;
  white-space: normal;
}

.module-brief-hint-wrap:hover .module-brief-popover,
.module-brief-hint-wrap:focus-within .module-brief-popover {
  display: block;
}

.module-brief-popover p {
  margin: 0 0 8px;
}

.module-brief-popover p:last-child {
  margin-bottom: 0;
}
</style>
