<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  steps: { type: Array, required: true },
  modelValue: { type: Number, required: true },
})

const emit = defineEmits(['update:modelValue'])

const { tr } = useAppI18n()

function stepClass(stepId, currentStep) {
  return stepId === currentStep ? 'active' : ''
}

function handleStepClick(stepId) {
  emit('update:modelValue', stepId)
}
</script>

<template>
  <div class="stepper">
    <template v-for="(step, index) in steps" :key="step.id">
      <button
        type="button"
        class="step-item"
        :class="stepClass(step.id, modelValue)"
        :aria-current="step.id === modelValue ? 'step' : undefined"
        @click="handleStepClick(step.id)"
      >
        <span class="step-circle">{{ step.id }}</span>
        <span class="step-label">{{ tr(step.title) }}</span>
      </button>
      <div v-if="index < steps.length - 1" class="step-line" />
    </template>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 12px 0 20px;
  flex-shrink: 0;
  gap: 4px 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.step-item:not(.active):hover .step-circle {
  border-color: #93c5fd;
  color: #2563eb;
}

.step-item:not(.active):hover .step-label {
  color: #2563eb;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
}

.step-label {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  max-width: 120px;
  line-height: 1.3;
}

.step-item.active .step-circle {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.step-item.active .step-label {
  color: #2563eb;
  font-weight: 600;
}

.step-line {
  width: 48px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px 20px;
}
</style>
