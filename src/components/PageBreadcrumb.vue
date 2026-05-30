<script setup>
import { computed } from 'vue'
import { buildMenuBreadcrumb } from '../config/menu.js'

const props = defineProps({
  pageId: {
    type: String,
    required: true,
  },
})

const crumbs = computed(() => buildMenuBreadcrumb(props.pageId))
</script>

<template>
  <nav class="page-breadcrumb" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(label, index) in crumbs" :key="`${label}-${index}`" class="breadcrumb-item">
        <span v-if="index > 0" class="breadcrumb-sep" aria-hidden="true">/</span>
        <span :class="{ current: index === crumbs.length - 1 }">{{ label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.page-breadcrumb {
  flex-shrink: 0;
  padding: 10px 28px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.5;
  color: #9ca3af;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
}

.breadcrumb-sep {
  margin: 0 8px;
  color: #d1d5db;
}

.breadcrumb-item .current {
  color: #6b7280;
}
</style>
