<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatMovementDate } from '../../utils/formatMovementDate.js'

defineProps({
  nodes: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const { t, tr } = useAppI18n()

function badgeLabel(key) {
  if (!key) return ''
  const i18nKey = `approvalTimeline.status.${key}`
  const translated = t(i18nKey)
  return translated !== i18nKey ? translated : tr(key)
}

function badgeClass(key) {
  return key ? `badge-${key}` : ''
}

function formatTime(value) {
  if (!value) return ''
  return formatMovementDate(value)
}
</script>

<template>
  <section class="approval-timeline">
    <h3 class="timeline-title">{{ title || t('common.approvalLog') }}</h3>
    <ul v-if="nodes.length" class="timeline-list">
      <li v-for="node in nodes" :key="node.id" class="timeline-item">
        <div class="timeline-track">
          <span class="timeline-icon" :class="`icon-${node.icon}`">
            <template v-if="node.icon === 'completed'">✓</template>
            <template v-else-if="node.icon === 'rejected'">✕</template>
            <template v-else-if="node.icon === 'warning'">!</template>
            <template v-else-if="node.icon === 'pending'">◷</template>
            <template v-else>○</template>
          </span>
          <span class="timeline-line" aria-hidden="true" />
        </div>
        <div class="timeline-content">
          <div class="timeline-head">
            <span class="timeline-stage">{{ tr(node.stageLabel) }}</span>
            <span v-if="node.badgeKey" class="timeline-badge" :class="badgeClass(node.badgeKey)">
              {{ badgeLabel(node.badgeKey) }}
            </span>
          </div>
          <p v-if="node.actor" class="timeline-actor">{{ node.actor }}</p>
          <p v-if="node.dateTime" class="timeline-time">{{ formatTime(node.dateTime) }}</p>
          <p v-if="node.comment" class="timeline-comment">{{ tr(node.comment) }}</p>
        </div>
      </li>
    </ul>
    <p v-else class="timeline-empty">{{ t('common.noData') }}</p>
  </section>
</template>

<style scoped>
.approval-timeline {
  margin-bottom: 8px;
}

.timeline-title {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.timeline-item {
  display: flex;
  gap: 14px;
  position: relative;
}

.timeline-item:last-child .timeline-line {
  display: none;
}

.timeline-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.timeline-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.icon-completed {
  background: #dcfce7;
  color: #15803d;
}

.icon-pending {
  background: #fef3c7;
  color: #b45309;
}

.icon-upcoming {
  background: #f3f4f6;
  color: #9ca3af;
}

.icon-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.icon-warning {
  background: #ffedd5;
  color: #c2410c;
}

.timeline-line {
  flex: 1;
  width: 2px;
  min-height: 24px;
  background: #e5e7eb;
  margin: 4px 0;
}

.timeline-content {
  flex: 1;
  padding-bottom: 20px;
  min-width: 0;
}

.timeline-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.timeline-stage {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.timeline-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.badge-submitted,
.badge-approved {
  background: #dcfce7;
  color: #15803d;
}

.badge-pending {
  background: #fef3c7;
  color: #b45309;
}

.badge-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.badge-updateRequired {
  background: #ffedd5;
  color: #c2410c;
}

.badge-cancelled {
  background: #e5e7eb;
  color: #374151;
}

.timeline-actor {
  margin: 4px 0 0;
  font-size: 13px;
  color: #374151;
}

.timeline-time {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.timeline-comment {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.timeline-empty {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}
</style>
