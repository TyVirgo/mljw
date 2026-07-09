<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  titleKey: { type: String, required: true },
  itemKeys: { type: Array, required: true },
  /** default: blue box (transfer/deferment/resumption); instructional: yellow box (withdrawal) */
  variant: { type: String, default: 'default' },
})

const { t } = useAppI18n()
</script>

<template>
  <div
    class="movement-applicant-notes"
    :class="{ 'movement-applicant-notes--instructional': variant === 'instructional' }"
  >
    <p class="movement-applicant-notes__title">{{ t(titleKey) }}</p>
    <ol>
      <li v-for="key in itemKeys" :key="key">{{ t(key) }}</li>
    </ol>
  </div>
</template>
