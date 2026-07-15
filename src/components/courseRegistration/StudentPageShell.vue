<script setup>
import ModuleBriefPanel from './ModuleBriefPanel.vue'

defineProps({
  pageId: { type: String, required: true },
})
</script>

<template>
  <div class="cr-list-page cr-student-page">
    <ModuleBriefPanel :page-id="pageId" />
    <slot />
  </div>
</template>
