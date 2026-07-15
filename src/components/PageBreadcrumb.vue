<script setup>
import { computed } from 'vue'
import { buildMenuBreadcrumbKeys, basicDataModuleKey, menuItems } from '../config/menu.js'
import { buildMenuBreadcrumbKeys as buildKeys } from '../config/menuBreadcrumb.js'
import {
  buildStudentRecordsBreadcrumbKeys,
  studentRecordsModuleKey,
} from '../config/studentRecordsMenu.js'
import {
  buildCourseRegistrationBreadcrumbKeys,
  courseRegistrationModuleKey,
} from '../config/courseRegistrationMenu.js'
import { useAppI18n } from '../composables/useAppI18n.js'

const props = defineProps({
  pageId: {
    type: String,
    required: true,
  },
  moduleKey: {
    type: String,
    default: basicDataModuleKey,
  },
  items: {
    type: Array,
    default: () => menuItems,
  },
})

const { t } = useAppI18n()

const crumbs = computed(() => {
  let keys
  if (props.moduleKey === basicDataModuleKey && props.items === menuItems) {
    keys = buildMenuBreadcrumbKeys(props.pageId)
  } else if (props.moduleKey === studentRecordsModuleKey) {
    keys = buildStudentRecordsBreadcrumbKeys(props.pageId)
  } else if (props.moduleKey === courseRegistrationModuleKey) {
    keys = buildCourseRegistrationBreadcrumbKeys(props.pageId)
  } else {
    keys = buildKeys(props.pageId, props.moduleKey, props.items)
  }
  return keys.map((key) => t(key))
})
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
