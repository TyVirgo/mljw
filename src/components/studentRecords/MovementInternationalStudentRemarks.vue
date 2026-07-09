<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { isInternationalMovementApplicant } from '../../data/movementAttachments.js'
import { internationalRemarkKeysBySource } from '../../data/movementInternationalRemarks.js'
import '../../styles/movement-form.css'

const props = defineProps({
  sourceKey: { type: String, required: true },
  studentCategory: { type: String, default: '' },
})

const { t } = useAppI18n()

const visible = computed(() => isInternationalMovementApplicant(props.studentCategory))

const keys = computed(() => internationalRemarkKeysBySource[props.sourceKey])
</script>

<template>
  <div v-if="visible && keys" class="movement-international-remarks">
    <div class="movement-international-remarks__icon" aria-hidden="true">!</div>
    <div class="movement-international-remarks__body">
      <p class="movement-international-remarks__title">{{ t(keys.title) }}</p>
      <p class="movement-international-remarks__intro">{{ t(keys.intro) }}</p>
      <ul>
        <li v-for="bulletKey in keys.bullets" :key="bulletKey">{{ t(bulletKey) }}</li>
      </ul>
      <p class="movement-international-remarks__attention-title">{{ t(keys.attentionTitle) }}</p>
      <p class="movement-international-remarks__attention">{{ t(keys.attention) }}</p>
    </div>
  </div>
</template>
