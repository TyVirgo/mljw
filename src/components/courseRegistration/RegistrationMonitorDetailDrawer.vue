<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import WeekScheduleGrid from './WeekScheduleGrid.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import {
  getTermGeCategoryBars,
  getTermGeElectiveCategoryBars,
  getGraduationGeBars,
  getGraduationMeBars,
} from '../../data/courseRegistration/studentRegistrationContext.js'
import {
  getMonitorGraduationInsight,
  getMonitorTermInsight,
  getMonitorMandatoryGraduation,
  getCreditCompletionPct,
  completionToneClass,
  formatCreditCompletion,
  creditCapsuleTone,
} from '../../data/courseRegistration/monitorCreditInsights.js'
import { buildMonitorDetailSchedule } from '../../data/courseRegistration/studentMyResultCourses.js'

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t, isZh } = useAppI18n()

const title = computed(() => t('courseRegistration.monitor.detailTitle'))
const subtitle = computed(() => '')

const profileGrade = computed(() => {
  if (!props.row) return ''
  return formatIntakeBatch(props.row.intake) || props.row.intake || ''
})

/** 本学期 GE / ME：类别细条；总分与主表同源 */
const termGeCategoryBars = computed(() =>
  props.row ? getTermGeElectiveCategoryBars(props.row) : [],
)
const termMeCategoryBars = computed(() => (props.row ? getTermGeCategoryBars(props.row) : []))

/** GE 短标签（GE01-04，与在线选课入口同源） */
const GE_SHORT_KEYS = {
  humanities: 'courseRegistration.student.geDemand.short.humanities',
  business: 'courseRegistration.student.geDemand.short.business',
  science: 'courseRegistration.student.geDemand.short.science',
  aiOpen: 'courseRegistration.student.geDemand.short.aiOpen',
}

function geShortLabel(bar) {
  return t(GE_SHORT_KEYS[bar.key] || bar.labelKey)
}

const termGeTotal = computed(() => {
  const term = getMonitorTermInsight(props.row)
  return { current: term.ge, max: term.geMax }
})

const termMeTotal = computed(() => {
  const term = getMonitorTermInsight(props.row)
  return { current: term.me, max: term.meMax }
})

const showTermSection = computed(
  () =>
    Boolean(props.row?.termElectiveProgress) ||
    termGeCategoryBars.value.length > 0 ||
    termMeCategoryBars.value.length > 0,
)

/** 毕业 GE / ME：类别细条；总分与主表同源（四类和，非培养方案 18） */
const graduationGeBars = computed(() => (props.row ? getGraduationGeBars(props.row) : []))
const graduationMeBars = computed(() => (props.row ? getGraduationMeBars(props.row) : []))

const graduationGeTotal = computed(() => {
  const g = getMonitorGraduationInsight(props.row)
  return { current: g.ge.current, max: g.ge.max }
})
const graduationMeTotal = computed(() => {
  const g = getMonitorGraduationInsight(props.row)
  return { current: g.me.current, max: g.me.max }
})

const mandatoryTotal = computed(() => getMonitorMandatoryGraduation(props.row))

const showGraduationSection = computed(
  () => graduationGeBars.value.length > 0 || graduationMeBars.value.length > 0,
)

const detailSchedule = computed(() =>
  buildMonitorDetailSchedule(props.row, { locale: isZh.value ? 'zh' : 'en' }),
)

function barPct(current, max) {
  return getCreditCompletionPct(current, max)
}

function barToneClass(current, max) {
  return completionToneClass(barPct(current, max))
}

function barWidth(current, max) {
  return `${Math.min(100, barPct(current, max))}%`
}

function capsuleTone(current, max) {
  return creditCapsuleTone(current, max)
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template v-if="row">
      <section class="profile-section">
        <h4>{{ t('courseRegistration.student.typeEntry.studentInfo') }}</h4>
        <table class="cr-type-entry-profile" aria-label="student profile">
          <thead>
            <tr>
              <th>{{ t('courseRegistration.student.fieldStudentId') }}</th>
              <th>{{ t('courseRegistration.student.fieldStudentName') }}</th>
              <th>{{ t('courseRegistration.student.fieldProgramme') }}</th>
              <th>{{ t('courseRegistration.student.typeEntry.grade') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ row.studentId }}</td>
              <td>{{ row.studentName }}</td>
              <td>{{ row.programme }}</td>
              <td class="nowrap">{{ profileGrade }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="showTermSection" class="section">
        <h4>{{ t('courseRegistration.monitor.termCreditRequirements') }}</h4>
        <template v-if="row?.termElectiveProgress || termGeCategoryBars.length">
          <div class="g1-bar">
            <span class="g1-label">{{ t('courseRegistration.student.termElectiveProgressGe') }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="barToneClass(termGeTotal.current, termGeTotal.max)"
                :style="{ width: barWidth(termGeTotal.current, termGeTotal.max) }"
              />
            </div>
            <span
              class="cr-credit-capsule"
              :class="capsuleTone(termGeTotal.current, termGeTotal.max)"
            >
              {{ termGeTotal.current }}/{{ termGeTotal.max }}
            </span>
            <span
              class="g1-pct-badge"
              :class="barToneClass(termGeTotal.current, termGeTotal.max)"
            >
              {{ formatCreditCompletion(termGeTotal.current, termGeTotal.max) }}
            </span>
          </div>
          <div v-if="termGeCategoryBars.length" class="ge-stat-grid">
            <div
              v-for="bar in termGeCategoryBars"
              :key="`term-ge-${bar.key}`"
              class="ge-stat-cell"
            >
              <span class="ge-stat-label">{{ geShortLabel(bar) }}</span>
              <span class="ge-stat-value">
                {{
                  t('courseRegistration.student.geDemand.termStatSelected', {
                    credit: Number(bar.current) || 0,
                  })
                }}
              </span>
            </div>
          </div>
        </template>
        <template v-if="row?.termElectiveProgress || termMeCategoryBars.length">
          <div
            class="g1-bar"
            :class="{
              'g1-bar--group': Boolean(row?.termElectiveProgress) || termGeCategoryBars.length > 0,
            }"
          >
            <span class="g1-label">{{ t('courseRegistration.student.termElectiveProgressMe') }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="barToneClass(termMeTotal.current, termMeTotal.max)"
                :style="{ width: barWidth(termMeTotal.current, termMeTotal.max) }"
              />
            </div>
            <span
              class="cr-credit-capsule"
              :class="capsuleTone(termMeTotal.current, termMeTotal.max)"
            >
              {{ termMeTotal.current }}/{{ termMeTotal.max }}
            </span>
            <span
              class="g1-pct-badge"
              :class="barToneClass(termMeTotal.current, termMeTotal.max)"
            >
              {{ formatCreditCompletion(termMeTotal.current, termMeTotal.max) }}
            </span>
          </div>
          <div
            v-for="bar in termMeCategoryBars"
            :key="`term-me-${bar.key}`"
            class="g1-bar g1-bar--nested"
          >
            <span class="g1-label">{{
              t(bar.labelKey) + t('courseRegistration.student.geDemand.selectedRequired')
            }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="barToneClass(bar.current, bar.max)"
                :style="{ width: barWidth(bar.current, bar.max) }"
              />
            </div>
            <span class="cr-credit-capsule cr-credit-capsule--sm" :class="capsuleTone(bar.current, bar.max)">
              {{ bar.current }}/{{ bar.max }}
            </span>
          </div>
        </template>
      </div>

      <div v-if="showGraduationSection" class="section">
        <h4>{{ t('courseRegistration.monitor.graduationCreditRequirements') }}</h4>
        <template v-if="graduationGeBars.length">
          <div class="g1-bar">
            <span class="g1-label">{{ t('courseRegistration.student.graduationElectiveProgressGe') }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="barToneClass(graduationGeTotal.current, graduationGeTotal.max)"
                :style="{ width: barWidth(graduationGeTotal.current, graduationGeTotal.max) }"
              />
            </div>
            <span
              class="cr-credit-capsule"
              :class="capsuleTone(graduationGeTotal.current, graduationGeTotal.max)"
            >
              {{ graduationGeTotal.current }}/{{ graduationGeTotal.max }}
            </span>
            <span
              class="g1-pct-badge"
              :class="barToneClass(graduationGeTotal.current, graduationGeTotal.max)"
            >
              {{ formatCreditCompletion(graduationGeTotal.current, graduationGeTotal.max) }}
            </span>
          </div>
          <div v-for="bar in graduationGeBars" :key="`ge-${bar.key}`" class="g1-bar g1-bar--nested">
            <span class="g1-label">{{
              t(bar.labelKey) + t('courseRegistration.student.geDemand.selectedRequired')
            }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="barToneClass(bar.current, bar.max)"
                :style="{ width: barWidth(bar.current, bar.max) }"
              />
            </div>
            <span class="cr-credit-capsule cr-credit-capsule--sm" :class="capsuleTone(bar.current, bar.max)">
              {{ bar.current }}/{{ bar.max }}
            </span>
          </div>
        </template>
        <template v-if="graduationMeBars.length">
          <div class="g1-bar" :class="{ 'g1-bar--group': graduationGeBars.length }">
            <span class="g1-label">{{ t('courseRegistration.student.graduationElectiveProgressMe') }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="barToneClass(graduationMeTotal.current, graduationMeTotal.max)"
                :style="{ width: barWidth(graduationMeTotal.current, graduationMeTotal.max) }"
              />
            </div>
            <span
              class="cr-credit-capsule"
              :class="capsuleTone(graduationMeTotal.current, graduationMeTotal.max)"
            >
              {{ graduationMeTotal.current }}/{{ graduationMeTotal.max }}
            </span>
            <span
              class="g1-pct-badge"
              :class="barToneClass(graduationMeTotal.current, graduationMeTotal.max)"
            >
              {{ formatCreditCompletion(graduationMeTotal.current, graduationMeTotal.max) }}
            </span>
          </div>
          <div v-for="bar in graduationMeBars" :key="`me-${bar.key}`" class="g1-bar g1-bar--nested">
            <span class="g1-label">{{
              t(bar.labelKey) + t('courseRegistration.student.geDemand.selectedRequired')
            }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="barToneClass(bar.current, bar.max)"
                :style="{ width: barWidth(bar.current, bar.max) }"
              />
            </div>
            <span class="cr-credit-capsule cr-credit-capsule--sm" :class="capsuleTone(bar.current, bar.max)">
              {{ bar.current }}/{{ bar.max }}
            </span>
          </div>
        </template>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.headerGroupMandatory') }}</h4>
        <div class="g1-bar">
          <span class="g1-label">{{ t('courseRegistration.monitor.colMandatoryGrad') }}</span>
          <div class="g1-track">
            <div
              class="g1-fill"
              :class="barToneClass(mandatoryTotal.current, mandatoryTotal.max)"
              :style="{ width: barWidth(mandatoryTotal.current, mandatoryTotal.max) }"
            />
          </div>
          <span
            class="cr-credit-capsule"
            :class="capsuleTone(mandatoryTotal.current, mandatoryTotal.max)"
          >
            {{ mandatoryTotal.current }}/{{ mandatoryTotal.max }}
          </span>
          <span
            class="g1-pct-badge"
            :class="barToneClass(mandatoryTotal.current, mandatoryTotal.max)"
          >
            {{ formatCreditCompletion(mandatoryTotal.current, mandatoryTotal.max) }}
          </span>
        </div>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.schedule') }}</h4>
        <WeekScheduleGrid
          :schedule="detailSchedule"
          show-legend
          legend-mode="myResult"
        />
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-primary" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.profile-section {
  margin-bottom: 20px;
}

.profile-section h4,
.section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.cr-type-entry-profile {
  width: 100%;
  margin: 0;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.cr-type-entry-profile th,
.cr-type-entry-profile td {
  padding: 8px 12px;
  border: 1px solid #bfdbfe;
  text-align: left;
  vertical-align: middle;
  word-break: break-word;
}

.cr-type-entry-profile thead th {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
  border-color: #bfdbfe;
}

.cr-type-entry-profile tbody td {
  background: #f8fafc;
  color: #1f2937;
}

.cr-type-entry-profile .nowrap {
  white-space: nowrap;
}

.section {
  margin-bottom: 20px;
}

.g1-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}

.g1-bar--group {
  margin-top: 12px;
}

.g1-bar--nested .g1-label {
  padding-left: 8px;
}

.g1-label {
  width: 140px;
  color: #6b7280;
  flex-shrink: 0;
}

.g1-track {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  min-width: 48px;
}

.g1-fill {
  height: 100%;
  background: #2563eb;
}

.g1-fill.completion-tone--high {
  background: #22c55e;
}

.g1-fill.completion-tone--mid {
  background: #f97316;
}

.g1-fill.completion-tone--low {
  background: #eab308;
}

.g1-fill.completion-tone--critical {
  background: #ef4444;
}

.ge-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0 0 12px;
  padding-left: 8px;
}

.ge-stat-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  min-width: 0;
}

.ge-stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.ge-stat-value {
  font-size: 12px;
  color: #9ca3af;
}

.cr-credit-capsule {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  border: 1px solid transparent;
  flex-shrink: 0;
  min-width: 52px;
}

.cr-credit-capsule--sm {
  padding: 1px 8px;
  font-size: 11px;
  min-width: 44px;
}

.cr-credit-capsule.is-short {
  color: #9a3412;
  background: #ffedd5;
  border-color: #fdba74;
}

.cr-credit-capsule.is-met,
.cr-credit-capsule.is-over {
  color: #047857;
  background: #d1fae5;
  border-color: #6ee7b7;
}

.cr-credit-capsule.is-over {
  font-weight: 600;
}

.g1-pct-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  border: 2px solid transparent;
}

.g1-pct-badge.completion-tone--high {
  color: #15803d;
  background: #dcfce7;
  border-color: #86efac;
}

.g1-pct-badge.completion-tone--mid {
  color: #c2410c;
  background: #ffedd5;
  border-color: #fdba74;
}

.g1-pct-badge.completion-tone--low {
  color: #a16207;
  background: #fef9c3;
  border-color: #fde047;
}

.g1-pct-badge.completion-tone--critical {
  color: #b91c1c;
  background: #fee2e2;
  border-color: #fca5a5;
}

@media (max-width: 520px) {
  .ge-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
