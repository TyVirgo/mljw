<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { displayClassTime, displayWeekRange } from '../../data/courseRegistration/sectionScheduleFields.js'

const props = defineProps({
  section: { type: Object, required: true },
  sectionCodeLabel: { type: String, default: 'Group No.' },
  selected: { type: Boolean, default: false },
  selectable: { type: Boolean, default: true },
  /** 展示字段标签与说明（详情抽屉） */
  showFieldLabels: { type: Boolean, default: true },
})

const emit = defineEmits(['select'])

const { t } = useAppI18n()

const isFull = computed(() => props.section.enrolled >= props.section.capacity)

const fields = computed(() => [
  {
    key: 'lecturer',
    labelKey: 'courseRegistration.courses.lecturer',
    value: props.section.lecturer || '—',
    hintKey: '',
  },
  {
    key: 'weekRange',
    labelKey: 'courseRegistration.courses.weekRange',
    value: displayWeekRange(props.section),
    hintKey: 'courseRegistration.courses.weekRangeHint',
  },
  {
    key: 'classTime',
    labelKey: 'courseRegistration.courses.classTime',
    value: displayClassTime(props.section),
    hintKey: 'courseRegistration.courses.classTimeHint',
  },
  {
    key: 'room',
    labelKey: 'courseRegistration.courses.room',
    value: props.section.room || '—',
    hintKey: '',
  },
])

function handleClick() {
  if (!props.selectable || isFull.value) return
  emit('select', props.section)
}
</script>

<template>
  <button
    type="button"
    class="section-card"
    :class="{
      disabled: selectable && isFull,
      selected: selectable && selected,
      readonly: !selectable,
    }"
    :disabled="selectable && isFull"
    @click="handleClick"
  >
    <div class="section-head">
      <strong>{{ t('courseRegistration.courses.sectionNameDisplay', { code: section.code }) }}</strong>
      <span>{{ section.enrolled }}/{{ section.capacity }}</span>
    </div>

    <div v-if="showFieldLabels" class="section-fields">
      <div v-for="field in fields" :key="field.key" class="section-field">
        <span class="field-label-row">
          <span class="field-label">{{ t(field.labelKey) }}</span>
          <span
            v-if="field.hintKey"
            class="hint-popover-wrap field-hint"
            @click.stop
          >
            <span
              class="hint-popover-trigger"
              tabindex="0"
              role="button"
              :aria-label="t(field.hintKey)"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path
                  d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                />
              </svg>
            </span>
            <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
              {{ t(field.hintKey) }}
            </span>
          </span>
        </span>
        <span class="field-value">{{ field.value }}</span>
      </div>
    </div>

    <template v-else>
      <p>{{ displayClassTime(section) }}</p>
      <p>
        {{ displayWeekRange(section) }} · {{ section.room || '—' }} · {{ section.lecturer || '—' }}
      </p>
    </template>
  </button>
</template>

<style scoped>
.section-card {
  text-align: left;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.section-card:hover:not(.disabled):not(.readonly) {
  border-color: #2563eb;
  background: #eff6ff;
}

.section-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}

.section-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.section-card.readonly {
  cursor: default;
}

.section-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.section-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.section-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.field-label-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  color: #9ca3af;
}

.field-value {
  font-size: 13px;
  color: #374151;
  word-break: break-word;
}

.field-hint .hint-popover-trigger svg {
  width: 12px;
  height: 12px;
}

.section-card > p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

@media (max-width: 560px) {
  .section-fields {
    grid-template-columns: 1fr;
  }
}
</style>
