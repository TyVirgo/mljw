<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CreditProgressRing from './CreditProgressRing.vue'
import WeekScheduleGrid from './WeekScheduleGrid.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import { getTermGeCategoryBars, getGraduationGeBars } from '../../data/courseRegistration/studentRegistrationContext.js'

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
  inSupplementList: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'add-supplement'])

const { t } = useAppI18n()

const title = computed(() => props.row?.studentName || '')
const subtitle = computed(() => {
  if (!props.row) return ''
  const intake = formatIntakeBatch(props.row.intake) || props.row.intake
  return `${props.row.studentId} · ${props.row.programme}/${intake}`
})

/** 本学期 GE/ME 学分帽 */
const termElectiveBars = computed(() => {
  const row = props.row
  if (!row?.termElectiveProgress) return []
  const p = row.termElectiveProgress
  return [
    { key: 'ge', current: Number(p.ge) || 0, required: Number(p.geMax) || 12 },
    { key: 'me', current: Number(p.me) || 0, required: Number(p.meMax) || 16 },
  ]
})

/** 本学期 ME 文/商/理（主闸；字段名历史保留） */
const termGeBars = computed(() => (props.row ? getTermGeCategoryBars(props.row) : []))
/** 毕业累计（次要） */
const graduationBars = computed(() => (props.row ? getGraduationGeBars(props.row) : []))
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="row">
      <div class="summary-row">
        <CreditProgressRing :current="row.credits" :min="row.creditMin" :max="row.creditMax" />
        <div class="summary-meta">
          <p v-if="row.cgpa != null">CGPA: {{ row.cgpa }}</p>
          <p>
            {{ t('common.status') }}:
            {{ t(`courseRegistration.monitor.status.${row.status}`) }}
          </p>
          <p v-for="tag in row.tags" :key="tag" class="tag">{{ tag }}</p>
        </div>
      </div>

      <div v-if="termElectiveBars.length" class="section">
        <h4>{{ t('courseRegistration.monitor.termElectiveProgress') }}</h4>
        <div v-for="bar in termElectiveBars" :key="bar.key" class="g1-bar">
          <span class="g1-label">{{ t(`courseRegistration.monitor.g1.${bar.key}`) }}</span>
          <div class="g1-track">
            <div
              class="g1-fill"
              :class="{ 'g1-fill--over': bar.required > 0 && bar.current > bar.required }"
              :style="{
                width: `${bar.required > 0 ? Math.min(100, (bar.current / bar.required) * 100) : 0}%`,
              }"
            />
          </div>
          <span class="g1-value">{{ bar.current }}/{{ bar.required }}</span>
        </div>
      </div>

      <div v-if="termGeBars.length" class="section">
        <h4>{{ t('courseRegistration.monitor.termGeCategoryProgress') }}</h4>
        <div v-for="bar in termGeBars" :key="bar.key" class="g1-bar">
          <span class="g1-label">{{ t(bar.labelKey) }}</span>
          <div class="g1-track">
            <div
              class="g1-fill"
              :class="{ 'g1-fill--over': bar.max > 0 && bar.current > bar.max }"
              :style="{
                width: `${bar.max > 0 ? Math.min(100, (bar.current / bar.max) * 100) : 0}%`,
              }"
            />
          </div>
          <span class="g1-value">{{ bar.current }}/{{ bar.max }}</span>
        </div>
      </div>

      <div v-if="graduationBars.length" class="section">
        <h4>{{ t('courseRegistration.monitor.graduationGeProgress') }}</h4>
        <div v-for="bar in graduationBars" :key="bar.key" class="g1-bar">
          <span class="g1-label">{{ t(bar.labelKey) }}</span>
          <div class="g1-track">
            <div
              class="g1-fill"
              :class="{ 'g1-fill--over': bar.max > 0 && bar.current > bar.max }"
              :style="{
                width: `${bar.max > 0 ? Math.min(100, (bar.current / bar.max) * 100) : 0}%`,
              }"
            />
          </div>
          <span class="g1-value">{{ bar.current }}/{{ bar.max }}</span>
        </div>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.schedule') }}</h4>
        <WeekScheduleGrid :schedule="row.schedule" />
      </div>

      <div v-if="row.issues?.length" class="section">
        <h4>{{ t('courseRegistration.monitor.issues') }}</h4>
        <ul class="issue-list">
          <li v-for="issue in row.issues" :key="issue">
            {{ t(`courseRegistration.monitor.issue.${issue}`) }}
          </li>
        </ul>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.history') }}</h4>
        <ul class="history-list">
          <li v-for="(h, i) in row.history" :key="i">{{ h.at }} — {{ h.action }}</li>
          <li v-if="!row.history?.length" class="muted">{{ t('common.noData') }}</li>
        </ul>
      </div>
    </template>

    <template #footer>
      <button
        type="button"
        class="btn btn-outline"
        :disabled="inSupplementList"
        @click="emit('add-supplement')"
      >
        {{
          inSupplementList
            ? t('courseRegistration.supplement.alreadyInList')
            : row && Array.isArray(row.tags) && row.tags.some((tag) => String(tag).toLowerCase() === 'freshman') &&
              (row.status === 'creditLow' || row.status === 'notRegistered')
              ? t('courseRegistration.monitor.suggestSupplement')
              : t('courseRegistration.monitor.addSupplement')
        }}
      </button>
      <button type="button" class="btn btn-primary" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.summary-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.summary-meta {
  font-size: 13px;
  color: #374151;
}

.summary-meta p {
  margin: 0 0 6px;
}

.tag {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 8px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 12px;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.g1-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}

.g1-label {
  width: 120px;
  color: #6b7280;
  flex-shrink: 0;
}

.g1-track {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.g1-fill {
  height: 100%;
  background: #2563eb;
}

.g1-fill--over {
  background: #dc2626;
}

.g1-value {
  width: 56px;
  text-align: right;
  flex-shrink: 0;
}

.issue-list,
.history-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
}

.muted {
  color: #9ca3af;
  list-style: none;
  margin-left: -18px;
}
</style>
