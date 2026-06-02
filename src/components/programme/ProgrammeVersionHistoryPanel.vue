<script setup>
import { computed } from 'vue'

const props = defineProps({
  programme: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['back', 'select'])

const sortedVersions = computed(() => {
  const list = [...(props.programme.versions || [])]
  return list.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1
    if (!a.isCurrent && b.isCurrent) return 1
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
  })
})

function handleSelect(version) {
  emit('select', version)
}
</script>

<template>
  <div class="history-panel">
    <div class="history-header">
      <button type="button" class="back-btn" aria-label="Back" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h2 class="history-title">{{ programme.name }}</h2>
    </div>

    <div v-if="!sortedVersions.length" class="history-empty">No version data</div>

    <ul v-else class="version-list">
      <li v-for="version in sortedVersions" :key="version.id">
        <button type="button" class="version-item" @click="handleSelect(version)">
          <span class="version-badge" :class="version.isCurrent ? 'current' : 'history'">
            {{ version.isCurrent ? 'Current Version' : 'Historical Version' }}
          </span>
          <div class="version-main">
            <p class="version-time">{{ version.updatedAt || '--' }}</p>
            <p class="version-meta">
              <span>Updated By: {{ version.updatedBy || '--' }}</span>
              <span>Employee ID: {{ version.employeeId || '--' }}</span>
              <span>Department: {{ version.department || '--' }}</span>
            </p>
          </div>
          <span class="version-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.history-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 8px 4px 0;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #374151;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #f3f4f6;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.history-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.history-empty {
  padding: 48px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.version-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.version-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
  background: #fff;
  transition: background 0.15s;
}

.version-item:hover {
  background: #fafafa;
}

.version-badge {
  flex-shrink: 0;
  min-width: 120px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.version-badge.current {
  background: #eff6ff;
  color: #2563eb;
}

.version-badge.history {
  background: #f3f4f6;
  color: #6b7280;
}

.version-main {
  flex: 1;
  min-width: 0;
}

.version-time {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.version-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  font-size: 13px;
  color: #9ca3af;
}

.version-arrow {
  flex-shrink: 0;
  color: #d1d5db;
}

.version-arrow svg {
  width: 18px;
  height: 18px;
}

.version-item:hover .version-arrow {
  color: #2563eb;
}
</style>
