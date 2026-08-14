<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getCourseOwnerLabel } from '../../data/courses.js'

const props = defineProps({
  data: { type: Object, required: true },
})

const { tr } = useAppI18n()

const courseOwnerText = computed(() => {
  if (props.data.courseOwnerDisplay) return props.data.courseOwnerDisplay
  return getCourseOwnerLabel(props.data.courseOwner)
})

function display(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}
</script>

<template>
  <div class="detail-form">
    <div class="detail-grid">
      <div class="detail-col detail-col-left">
        <div class="detail-row">
          <span class="detail-label">{{ tr('Course Code:') }}</span>
          <span class="detail-value">{{ display(data.courseCode) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Course Owner:') }}</span>
          <span class="detail-value">{{ display(courseOwnerText) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Offering Unit:') }}</span>
          <span class="detail-value">{{ display(data.offering) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Course Classification:') }}</span>
          <span class="detail-value">
            {{ data.courseClassification ? tr(data.courseClassification) : '--' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Medium of Instruction:') }}</span>
          <span class="detail-value">
            {{ data.mediumOfInstruction ? tr(data.mediumOfInstruction) : '--' }}
          </span>
        </div>
      </div>

      <div class="detail-col detail-col-right">
        <div class="detail-row">
          <span class="detail-label">{{ tr('Course Name:') }}</span>
          <span class="detail-value">{{ display(data.courseName) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Affiliated Programme:') }}</span>
          <span class="detail-value">{{ display(data.affiliatedProgramme) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Credit:') }}</span>
          <span class="detail-value">{{ display(data.credit) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Semester Type:') }}</span>
          <span class="detail-value">{{ data.semesterType ? tr(data.semesterType) : '--' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ tr('Pre-requisite / co-requisite:') }}</span>
          <span class="detail-value">{{ display(data.prerequisite) }}</span>
        </div>
      </div>
    </div>

    <div class="detail-block detail-row-full">
      <span class="detail-label">{{ tr('Synopsis:') }}</span>
      <p class="detail-text">{{ display(data.synopsis) }}</p>
    </div>

    <div class="detail-block detail-row-full">
      <span class="detail-label">{{ tr('References:') }}</span>
      <div v-if="data.requiredReferences || data.furtherReadings" class="ref-sections">
        <div v-if="data.requiredReferences" class="ref-group">
          <h4 class="ref-subtitle">{{ tr('Required References') }}</h4>
          <p class="detail-text">{{ data.requiredReferences }}</p>
        </div>
        <div v-if="data.furtherReadings" class="ref-group">
          <h4 class="ref-subtitle">{{ tr('Further Readings') }}</h4>
          <p class="detail-text">{{ data.furtherReadings }}</p>
        </div>
      </div>
      <p v-else class="detail-text">{{ display(data.references) }}</p>
    </div>
  </div>
</template>

<style scoped>
.detail-form {
  --detail-label-w-left: 212px;
  --detail-label-w-right: 148px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 48px;
}

.detail-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.detail-col-left .detail-row {
  grid-template-columns: var(--detail-label-w-left) minmax(0, 1fr);
}

.detail-col-right .detail-row {
  grid-template-columns: var(--detail-label-w-right) minmax(0, 1fr);
}

.detail-row {
  display: grid;
  gap: 16px;
  align-items: start;
}

.detail-row .detail-label {
  text-align: right;
  white-space: nowrap;
  justify-self: stretch;
}

.detail-block.detail-row-full {
  margin-top: 28px;
  display: grid;
  grid-template-columns: var(--detail-label-w-left) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.detail-block.detail-row-full .detail-label {
  text-align: right;
  white-space: nowrap;
  justify-self: stretch;
}

.detail-label {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  color: #111827;
  word-break: break-word;
}

.detail-text {
  margin: 0;
  font-size: 13px;
  color: #111827;
  line-height: 1.7;
  white-space: pre-line;
}

.ref-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ref-subtitle {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
</style>
