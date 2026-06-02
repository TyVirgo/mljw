<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    class="yn-switch"
    :class="{ on: modelValue, disabled }"
    :disabled="disabled"
    @click="toggle"
  >
    <span class="yn-switch-track">
      <span class="yn-switch-letter yn-switch-letter-y">Y</span>
      <span class="yn-switch-knob"></span>
      <span class="yn-switch-letter yn-switch-letter-n">N</span>
    </span>
  </button>
</template>

<style scoped>
.yn-switch {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}

.yn-switch.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.yn-switch-track {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 52px;
  height: 24px;
  border-radius: 12px;
  background: #d1d5db;
  transition: background 0.2s;
}

.yn-switch.on .yn-switch-track {
  background: #2563eb;
}

.yn-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.yn-switch.on .yn-switch-knob {
  transform: translateX(28px);
}

.yn-switch-letter {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  z-index: 1;
  user-select: none;
}

.yn-switch-letter-y {
  padding-left: 7px;
  opacity: 0;
}

.yn-switch-letter-n {
  padding-right: 7px;
  text-align: right;
  opacity: 1;
}

.yn-switch.on .yn-switch-letter-y {
  opacity: 1;
}

.yn-switch.on .yn-switch-letter-n {
  opacity: 0;
}
</style>
