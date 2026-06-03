<script setup>
const props = defineProps({
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle'])

function onClick() {
  if (props.disabled) return
  emit('toggle')
}
</script>

<template>
  <button
    type="button"
    class="change-level-toggle"
    :class="{ active, disabled }"
    @click="onClick"
  >
    <span class="toggle-track">
      <span class="toggle-label">{{ active ? 'Y' : 'N' }}</span>
      <span class="toggle-knob" />
    </span>
  </button>
</template>

<style scoped>
.change-level-toggle {
  display: inline-flex;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.change-level-toggle.disabled {
  cursor: default;
  pointer-events: none;
}

.toggle-track {
  position: relative;
  display: flex;
  align-items: center;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: #e5e7eb;
  transition: background 0.2s;
}

.change-level-toggle.active .toggle-track {
  background: #2563eb;
}

.toggle-label {
  position: absolute;
  left: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  line-height: 1;
  z-index: 1;
  transition: color 0.2s;
}

.change-level-toggle.active .toggle-label {
  left: auto;
  right: 8px;
  color: #fff;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s;
}

.change-level-toggle.active .toggle-knob {
  transform: translateX(20px);
}
</style>
