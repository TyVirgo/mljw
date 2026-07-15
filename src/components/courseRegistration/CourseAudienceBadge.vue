<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  audience: {
    type: String,
    required: true,
    validator: (value) => ['admin', 'student'].includes(value),
  },
})

const { t } = useAppI18n()
</script>

<template>
  <span class="cr-audience-badge" :class="`cr-audience-badge--${audience}`">
    {{ t(`courseRegistration.audience.${audience}`) }}
  </span>
</template>

<style scoped>
.cr-audience-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.cr-audience-badge--admin {
  color: #1e40af;
  background: #dbeafe;
}

.cr-audience-badge--student {
  color: #047857;
  background: #d1fae5;
}
</style>
