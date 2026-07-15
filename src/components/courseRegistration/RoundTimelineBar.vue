<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getActiveBatch } from '../../data/courseRegistration/registrationBatches.js'
import { getRoundTimeline } from '../../data/courseRegistration/studentRegistrationContext.js'

const props = defineProps({
  /** 高亮轮次：preselect | main | supplement | addDrop；空则按批次当前阶段 */
  highlightKey: { type: String, default: '' },
  /** 在线选课页：可点击切换轮次 */
  interactive: { type: Boolean, default: false },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useAppI18n()

const selectedKey = computed({
  get() {
    if (props.modelValue) return props.modelValue
    if (props.highlightKey) return props.highlightKey
    const batch = getActiveBatch()
    const steps = getRoundTimeline(batch, props.highlightKey || undefined)
    return steps.find((s) => s.active)?.key || steps[0]?.key || ''
  },
  set(value) {
    emit('update:modelValue', value)
  },
})

const steps = computed(() => {
  const batch = getActiveBatch()
  return getRoundTimeline(batch, props.interactive ? selectedKey.value : props.highlightKey || undefined)
})

function selectRound(key) {
  if (!props.interactive) return
  selectedKey.value = key
}

function tooltipFor(step) {
  const key = `courseRegistration.student.roundTooltip.${step.key}`
  const text = t(key)
  return text && text !== key ? text : ''
}
</script>

<template>
  <div v-if="steps.length" class="cr-round-timeline" :class="{ 'cr-round-timeline--interactive': interactive }">
    <div
      v-for="step in steps"
      :key="step.key"
      class="cr-round-step"
      :class="{
        active: step.active,
        'is-clickable': interactive,
        'cr-round-step--navigate': interactive && step.key === 'addDrop',
      }"
      :role="interactive ? 'button' : undefined"
      :tabindex="interactive ? 0 : undefined"
      @click="selectRound(step.key)"
      @keydown.enter.prevent="selectRound(step.key)"
      @keydown.space.prevent="selectRound(step.key)"
    >
      <div class="cr-round-step-head">
        <span class="cr-round-step-label">{{ t(step.labelKey) }}</span>
        <span
          v-if="tooltipFor(step)"
          class="hint-popover-wrap cr-round-step-hint"
          @click.stop
        >
          <span class="hint-popover-trigger" tabindex="0" role="button" :aria-label="tooltipFor(step)">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
              />
            </svg>
          </span>
          <span class="hint-popover-content hint-popover-content--sm" role="tooltip">{{ tooltipFor(step) }}</span>
        </span>
      </div>
      <span class="cr-round-step-range">{{ step.rangeText }}</span>
    </div>
  </div>
</template>

<style scoped>
.cr-round-step-head {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cr-round-step-hint {
  flex-shrink: 0;
}

.cr-round-step-hint .hint-popover-trigger svg {
  width: 12px;
  height: 12px;
}

.cr-round-timeline--interactive .cr-round-step.is-clickable {
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.cr-round-timeline--interactive .cr-round-step.is-clickable:hover {
  border-color: #93c5fd;
}

.cr-round-timeline--interactive .cr-round-step.cr-round-step--navigate::after {
  content: '→';
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 12px;
  color: #9ca3af;
}

.cr-round-timeline--interactive .cr-round-step {
  position: relative;
}

.cr-round-timeline--interactive .cr-round-step.cr-round-step--navigate:hover::after {
  color: #2563eb;
}

.cr-round-timeline--interactive .cr-round-step.is-clickable:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
