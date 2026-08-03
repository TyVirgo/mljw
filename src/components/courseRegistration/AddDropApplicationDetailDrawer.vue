<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import AddDropApplicationDetailBody from './AddDropApplicationDetailBody.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const app = computed(() => props.application)

const title = computed(() => t('common.details'))
const subtitle = computed(() => {
  if (!app.value) return ''
  const typeKey = `courseRegistration.approval.type.${app.value.type}`
  const typeLabel = t(typeKey)
  const typeText = typeLabel !== typeKey ? typeLabel : app.value.type
  return [app.value.applicationNo, typeText].filter(Boolean).join(' · ')
})
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <AddDropApplicationDetailBody :application="app" :show-attachment-export="true" />

    <template #footer>
      <button type="button" class="btn btn-primary" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>
