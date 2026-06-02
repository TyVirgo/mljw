<script setup>
import { ref, watch } from 'vue'
import { menuItems, findParentId } from '../config/menu.js'

const props = defineProps({
  activeId: {
    type: String,
    default: 'dashboard',
  },
})

const emit = defineEmits(['select'])

const expandedGroups = ref(['basic-info', 'programme-info', 'site-resources', 'course-info', 'lecturer-info', 'semester-calendar'])

watch(
  () => props.activeId,
  (id) => {
    const parentId = findParentId(id)
    if (parentId && !expandedGroups.value.includes(parentId)) {
      expandedGroups.value.push(parentId)
    }
  },
  { immediate: true },
)

function isExpanded(id) {
  return expandedGroups.value.includes(id)
}

function toggleGroup(id) {
  const index = expandedGroups.value.indexOf(id)
  if (index === -1) {
    expandedGroups.value.push(id)
  } else {
    expandedGroups.value.splice(index, 1)
  }
}

function selectItem(id) {
  emit('select', id)
}

function handleParentClick(item) {
  toggleGroup(item.id)
}

function isActive(id) {
  return props.activeId === id
}

function isChildActive(item) {
  return item.children?.some((child) => child.id === props.activeId)
}
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <template v-for="item in menuItems" :key="item.id">
        <div v-if="item.children" class="nav-group">
          <button
            type="button"
            class="nav-item"
            :class="{ 'parent-active': isChildActive(item) }"
            @click="handleParentClick(item)"
          >
            <span class="nav-icon">
              <svg v-if="item.icon === 'location'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <svg v-else-if="item.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <svg v-else-if="item.icon === 'calendar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </span>
            <span class="nav-label">{{ item.label }}</span>
            <svg
              class="nav-chevron"
              :class="{ expanded: isExpanded(item.id) }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div v-show="isExpanded(item.id)" class="submenu">
            <button
              v-for="child in item.children"
              :key="child.id"
              type="button"
              class="submenu-item"
              :class="{ active: isActive(child.id) }"
              @click="selectItem(child.id)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>

        <button
          v-else
          type="button"
          class="nav-item"
          :class="{ active: isActive(item.id) }"
          @click="selectItem(item.id)"
        >
          <span class="nav-icon">
            <svg v-if="item.icon === 'dashboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 2px;
  transition: background 0.15s, color 0.15s;
  text-align: left;
}

.nav-item:hover {
  background: #eff6ff;
  color: #2563eb;
}

.nav-item.active {
  background: #dbeafe;
  color: #2563eb;
  font-weight: 500;
}

.nav-item.parent-active {
  color: #2563eb;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg {
  width: 18px;
  height: 18px;
}

.nav-label {
  flex: 1;
}

.nav-chevron {
  width: 14px;
  height: 14px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.nav-chevron.expanded {
  transform: rotate(180deg);
}

.submenu {
  padding: 2px 0 4px 12px;
  margin-bottom: 4px;
}

.submenu-item {
  display: block;
  width: 100%;
  padding: 8px 12px 8px 28px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  color: #6b7280;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s, color 0.15s;
}

.submenu-item:hover {
  background: #eff6ff;
  color: #2563eb;
}

.submenu-item.active {
  background: #dbeafe;
  color: #2563eb;
  font-weight: 500;
}
</style>
