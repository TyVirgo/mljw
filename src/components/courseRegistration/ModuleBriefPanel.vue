<script setup>
import CourseAudienceBadge from './CourseAudienceBadge.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getModuleBrief } from '../../data/courseRegistration/courseRegistrationModuleBriefs.js'
import { getStudentProfileFields } from '../../data/courseRegistration/studentRegistrationStore.js'
import { computed } from 'vue'

const props = defineProps({
  pageId: { type: String, required: true },
})

const { t } = useAppI18n()
const brief = getModuleBrief(props.pageId)
const isStudentPage = computed(() => props.pageId.startsWith('crs-'))
const showAudienceBadge = computed(() => !isStudentPage.value)
const studentFields = computed(() => getStudentProfileFields())

function lineHasContent(line) {
  const content = line.replace(/^[^:：]+[:：]/, '').trim()
  return content.length > 0
}

const tooltipLines = computed(() => {
  if (!brief) return []
  return [
    `${t('courseRegistration.briefs.labelSource')}${t(brief.sourceKey)}`,
    `${t('courseRegistration.briefs.labelRequirements')}${t(brief.requirementsKey)}`,
    `${t('courseRegistration.briefs.labelFeatures')}${t(brief.featuresKey)}`,
  ].filter(lineHasContent)
})

const hasGuide = computed(() => tooltipLines.value.length > 0)
</script>

<template>
  <div v-if="brief" class="module-brief-bar">
    <div class="module-brief-meta">
      <CourseAudienceBadge v-if="showAudienceBadge" :audience="'admin'" />
      <span v-if="isStudentPage" class="module-brief-student">
        {{ studentFields.studentName }}
        <span class="module-brief-student-sub">
          {{ studentFields.studentId }} · {{ studentFields.programme }}/{{ studentFields.intake }}
        </span>
      </span>
    </div>

    <div v-if="hasGuide" class="hint-popover-wrap module-brief-hint-wrap">
      <button type="button" class="module-brief-hint-btn hint-popover-trigger" :aria-label="t('courseRegistration.briefs.guide')">
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
  </div>
</template>

<style scoped>
.module-brief-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  min-height: 28px;
}

.module-brief-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.module-brief-student {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-brief-student-sub {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
}

.module-brief-hint-wrap {
  flex-shrink: 0;
}

.module-brief-hint-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
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
  right: 0;
  left: auto;
  transform: none;
  width: min(420px, 70vw);
}

.module-brief-popover p {
  margin: 0 0 8px;
}

.module-brief-popover p:last-child {
  margin-bottom: 0;
}

</style>
