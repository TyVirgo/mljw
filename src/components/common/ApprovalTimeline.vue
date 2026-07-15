<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatMovementDate } from '../../utils/formatMovementDate.js'
import { formatApprovalStageLabel } from '../../utils/movementApprovalLogDisplay.js'

defineProps({
  nodes: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const { t, tr } = useAppI18n()

function stageTitle(stageLabel) {
  return formatApprovalStageLabel(stageLabel, tr)
}

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

function nodeType(node) {
  return node.type || 'step'
}
</script>

<template>
  <section class="approval-timeline">
    <h3 class="timeline-title">{{ title || t('common.approvalLog') }}</h3>
    <ul v-if="nodes.length" class="timeline-list">
      <li
        v-for="node in nodes"
        :key="node.id"
        class="timeline-item"
        :class="{
          'is-branch-start': nodeType(node) === 'branch-start',
          'is-parallel-item': nodeType(node) === 'parallel-item',
          'is-branch-join': nodeType(node) === 'branch-join',
        }"
      >
        <div class="timeline-track">
          <span class="timeline-icon" :class="`icon-${node.icon}`">
            <template v-if="node.icon === 'completed'">✓</template>
            <template v-else-if="node.icon === 'rejected'">✕</template>
            <template v-else-if="node.icon === 'warning'">!</template>
            <template v-else-if="node.icon === 'pending'">◷</template>
            <template v-else-if="node.icon === 'branch'">⑂</template>
            <template v-else>○</template>
          </span>
          <span class="timeline-line" aria-hidden="true" />
        </div>

        <div v-if="nodeType(node) === 'branch-start'" class="timeline-content timeline-content--marker">
          <p class="branch-marker branch-marker--start">{{ t('approvalTimeline.branchStart') }}</p>
        </div>

        <div v-else-if="nodeType(node) === 'branch-join'" class="timeline-content timeline-content--marker">
          <p
            class="branch-marker"
            :class="node.joinComplete ? 'branch-marker--join-done' : 'branch-marker--join'"
          >
            {{
              node.joinComplete
                ? t('approvalTimeline.branchJoinDone')
                : t('approvalTimeline.branchJoinWaiting')
            }}
          </p>
        </div>

        <div
          v-else
          class="timeline-content"
          :class="{ 'timeline-content--parallel': nodeType(node) === 'parallel-item' }"
        >
          <div class="timeline-head">
            <span class="timeline-stage">{{ stageTitle(node.stageLabel) }}</span>
            <span v-if="node.badgeKey" class="timeline-badge" :class="badgeClass(node.badgeKey)">
              {{ badgeLabel(node.badgeKey) }}
            </span>
          </div>
          <p v-if="node.actor" class="timeline-actor">{{ node.actor }}</p>
          <div v-if="node.comment" class="timeline-comment-box">{{ tr(node.comment) }}</div>
          <p v-if="node.dateTime" class="timeline-time">{{ formatTime(node.dateTime) }}</p>
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
  z-index: 1;
}

.icon-completed {
  background: #16a34a;
  color: #fff;
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
  background: #ede9fe;
  color: #6d28d9;
}

.icon-branch {
  background: #dbeafe;
  color: #1d4ed8;
}

.timeline-line {
  flex: 1;
  width: 2px;
  min-height: 24px;
  background: #bbf7d0;
  margin: 4px 0;
}

.is-branch-start .timeline-line,
.is-parallel-item .timeline-line {
  background: #93c5fd;
}

.timeline-content {
  flex: 1;
  padding-bottom: 20px;
  min-width: 0;
}

.timeline-content--marker {
  padding-bottom: 12px;
}

.timeline-content--parallel {
  margin-left: 4px;
  padding: 10px 12px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
  margin-bottom: 8px;
  padding-bottom: 12px;
}

.branch-marker {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.branch-marker--start {
  color: #1d4ed8;
}

.branch-marker--join {
  color: #15803d;
}

.branch-marker--join-done {
  color: #15803d;
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
  background: #16a34a;
  color: #fff;
}

.badge-pending {
  background: #fbbf24;
  color: #78350f;
}

.badge-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.badge-updateRequired {
  background: #7c3aed;
  color: #fff;
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
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.timeline-comment-box {
  margin: 8px 0 0;
  padding: 8px 10px;
  font-size: 12px;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #93c5fd;
  border-radius: 6px;
}

.timeline-empty {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}
</style>
