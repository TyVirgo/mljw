<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getGeDemandStats } from '../../data/courseRegistration/studentRegistrationContext.js'

const { t } = useAppI18n()

const geDemandStats = computed(() => getGeDemandStats())

const geDemandTotalLabel = computed(() =>
  t('courseRegistration.student.geDemand.totalPeople', {
    count: geDemandStats.value.total.toLocaleString(),
  }),
)
</script>

<template>
  <aside class="cr-ge-demand" :aria-label="t('courseRegistration.student.geDemand.title')">
    <div class="cr-ge-demand-total">
      <span class="cr-ge-demand-label">{{ t('courseRegistration.student.geDemand.title') }}</span>
      <span class="cr-ge-demand-value">{{ geDemandTotalLabel }}</span>
    </div>
    <div class="cr-ge-demand-cats">
      <div
        v-for="cat in geDemandStats.categories"
        :key="cat.key"
        class="cr-ge-demand-cat"
        :class="`cr-ge-demand-cat--${cat.key}`"
      >
        <div class="cr-ge-demand-cat-head">
          <span class="cr-ge-demand-cat-name">{{ t(cat.shortKey) }}</span>
          <span class="cr-ge-demand-cat-pct">{{ cat.percent }}%</span>
        </div>
        <div class="cr-ge-demand-cat-count">{{ cat.count.toLocaleString() }}</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.cr-ge-demand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.cr-ge-demand-total {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 7.5rem;
  flex-shrink: 0;
}

.cr-ge-demand-label {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  line-height: 1.3;
}

.cr-ge-demand-value {
  font-size: 22px;
  font-weight: 700;
  color: #1d4ed8;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.cr-ge-demand-cats {
  display: flex;
  flex: 1 1 200px;
  gap: 8px;
  min-width: 0;
}

.cr-ge-demand-cat {
  flex: 1 1 0;
  min-width: 4.5rem;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  border-top-width: 3px;
  padding: 8px 10px;
}

.cr-ge-demand-cat--humanities {
  border-top-color: #3b82f6;
}

.cr-ge-demand-cat--business {
  border-top-color: #f59e0b;
}

.cr-ge-demand-cat--science {
  border-top-color: #22c55e;
}

.cr-ge-demand-cat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
}

.cr-ge-demand-cat-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.cr-ge-demand-cat-pct {
  font-size: 11px;
  color: #9ca3af;
}

.cr-ge-demand-cat-count {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

@media (max-width: 720px) {
  .cr-ge-demand-cats {
    width: 100%;
  }
}
</style>
