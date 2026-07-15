<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  status: { type: String, required: true },
})

const { t } = useAppI18n()

const label = computed(() => t(`courseRegistration.batch.status.${props.status}`))

const badgeClass = computed(() => {
  const map = {
    draft: 'status-draft',
    active: 'status-active',
    closed: 'status-closed',
  }
  return map[props.status] || 'status-draft'
})
</script>

<template>
  <span class="batch-status-badge" :class="badgeClass">{{ label }}</span>
</template>

<style scoped>
.batch-status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-draft {
  color: #6b7280;
  background: #f3f4f6;
}

.status-active {
  color: #047857;
  background: #d1fae5;
}

.status-closed {
  color: #1e40af;
  background: #dbeafe;
}
</style>
