<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, default: 0 },
  min: { type: Number, default: 12 },
  max: { type: Number, default: 20 },
})

const percent = computed(() => {
  if (!props.max) return 0
  return Math.min(100, Math.round((props.current / props.max) * 100))
})

const ringColor = computed(() => {
  if (props.current < props.min) return '#f59e0b'
  if (props.current > props.max) return '#ef4444'
  return '#10b981'
})
</script>

<template>
  <div class="credit-ring" :style="{ '--ring-color': ringColor, '--ring-percent': percent }">
    <div class="ring-inner">
      <span class="ring-value">{{ current }}</span>
      <span class="ring-label">/ {{ max }}</span>
    </div>
  </div>
</template>

<style scoped>
.credit-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: conic-gradient(var(--ring-color) calc(var(--ring-percent) * 1%), #e5e7eb 0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-inner {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-value {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.ring-label {
  font-size: 11px;
  color: #6b7280;
}
</style>
