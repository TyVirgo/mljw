<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CreditProgressRing from './CreditProgressRing.vue'
import WeekScheduleGrid from './WeekScheduleGrid.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import {
  getTermGeCategoryBars,
  getTermGeElectiveCategoryBars,
  getGraduationGeBars,
  getGraduationMeBars,
  getProgrammeCreditTargets,
} from '../../data/courseRegistration/studentRegistrationContext.js'

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

/** 本学期 GE / ME：总分（学分帽）+ 类别（对齐毕业学分排版 / 在线选课） */
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

/** 学期 GE 灰色统计行文案：GE01已选：N学分 */
function geStatText(bar) {
  return `${t(GE_SHORT_KEYS[bar.key] || bar.labelKey)}${t(
    'courseRegistration.student.geDemand.termStatSelected',
    { credit: Number(bar.current) || 0 },
  )}`
}

const termGeTotal = computed(() => {
  const p = props.row?.termElectiveProgress
  if (p) {
    return { current: Number(p.ge) || 0, max: Number(p.geMax) || 0 }
  }
  return sumBars(termGeCategoryBars.value)
})

const termMeTotal = computed(() => {
  const p = props.row?.termElectiveProgress
  if (p) {
    return { current: Number(p.me) || 0, max: Number(p.meMax) || 0 }
  }
  return sumBars(termMeCategoryBars.value)
})

const showTermSection = computed(
  () =>
    Boolean(props.row?.termElectiveProgress) ||
    termGeCategoryBars.value.length > 0 ||
    termMeCategoryBars.value.length > 0,
)

/** 毕业 GE / ME：总分 + 类别（对齐在线选课入口；GE 总分用培养方案口径，不按四类求和） */
const graduationGeBars = computed(() => (props.row ? getGraduationGeBars(props.row) : []))
const graduationMeBars = computed(() => (props.row ? getGraduationMeBars(props.row) : []))

function sumBars(bars) {
  return {
    current: bars.reduce((s, b) => s + (Number(b.current) || 0), 0),
    max: bars.reduce((s, b) => s + (Number(b.max) || 0), 0),
  }
}

const graduationGeTotal = computed(() => {
  const sum = sumBars(graduationGeBars.value)
  const target = Number(
    getProgrammeCreditTargets(props.row?.programme)?.geRequired,
  )
  return { current: sum.current, max: target || sum.max }
})
const graduationMeTotal = computed(() => {
  const sum = sumBars(graduationMeBars.value)
  const target = Number(getProgrammeCreditTargets(props.row?.programme)?.meRequired)
  return { current: sum.current, max: target || sum.max }
})

const showGraduationSection = computed(
  () => graduationGeBars.value.length > 0 || graduationMeBars.value.length > 0,
)</script>

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

      <div v-if="showTermSection" class="section">
        <h4>{{ t('courseRegistration.monitor.termCreditRequirements') }}</h4>
        <template v-if="row?.termElectiveProgress || termGeCategoryBars.length">
          <div class="g1-bar">
            <span class="g1-label">{{ t('courseRegistration.student.termElectiveProgressGe') }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :style="{
                  width: `${
                    termGeTotal.max > 0
                      ? Math.min(100, (termGeTotal.current / termGeTotal.max) * 100)
                      : 0
                  }%`,
                }"
              />
            </div>
            <span class="g1-value">{{ termGeTotal.current }}/{{ termGeTotal.max }}</span>
          </div>
          <!-- GE 学期分类帽已停用：改灰色统计行（无分母、无达标语义） -->
          <div
            v-for="bar in termGeCategoryBars"
            :key="`term-ge-${bar.key}`"
            class="g1-bar g1-bar--nested g1-bar--stat"
          >
            <span class="g1-label">{{ geStatText(bar) }}</span>
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
                :class="{
                  'g1-fill--over': termMeTotal.max > 0 && termMeTotal.current > termMeTotal.max,
                }"
                :style="{
                  width: `${
                    termMeTotal.max > 0
                      ? Math.min(100, (termMeTotal.current / termMeTotal.max) * 100)
                      : 0
                  }%`,
                }"
              />
            </div>
            <span class="g1-value">{{ termMeTotal.current }}/{{ termMeTotal.max }}</span>
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
                :style="{
                  width: `${bar.max > 0 ? Math.min(100, (bar.current / bar.max) * 100) : 0}%`,
                }"
              />
            </div>
            <span class="g1-value">{{ bar.current }}/{{ bar.max }}</span>
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
                :style="{
                  width: `${
                    graduationGeTotal.max > 0
                      ? Math.min(100, (graduationGeTotal.current / graduationGeTotal.max) * 100)
                      : 0
                  }%`,
                }"
              />
            </div>
            <span class="g1-value">{{ graduationGeTotal.current }}/{{ graduationGeTotal.max }}</span>
          </div>
          <div v-for="bar in graduationGeBars" :key="`ge-${bar.key}`" class="g1-bar g1-bar--nested">
            <span class="g1-label">{{
              t(bar.labelKey) + t('courseRegistration.student.geDemand.selectedRequired')
            }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :style="{
                  width: `${bar.max > 0 ? Math.min(100, (bar.current / bar.max) * 100) : 0}%`,
                }"
              />
            </div>
            <span class="g1-value">{{ bar.current }}/{{ bar.max }}</span>
          </div>
        </template>
        <template v-if="graduationMeBars.length">
          <div class="g1-bar" :class="{ 'g1-bar--group': graduationGeBars.length }">
            <span class="g1-label">{{ t('courseRegistration.student.graduationElectiveProgressMe') }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :class="{
                  'g1-fill--over':
                    graduationMeTotal.max > 0 && graduationMeTotal.current > graduationMeTotal.max,
                }"
                :style="{
                  width: `${
                    graduationMeTotal.max > 0
                      ? Math.min(100, (graduationMeTotal.current / graduationMeTotal.max) * 100)
                      : 0
                  }%`,
                }"
              />
            </div>
            <span class="g1-value">{{ graduationMeTotal.current }}/{{ graduationMeTotal.max }}</span>
          </div>
          <div v-for="bar in graduationMeBars" :key="`me-${bar.key}`" class="g1-bar g1-bar--nested">
            <span class="g1-label">{{
              t(bar.labelKey) + t('courseRegistration.student.geDemand.selectedRequired')
            }}</span>
            <div class="g1-track">
              <div
                class="g1-fill"
                :style="{
                  width: `${bar.max > 0 ? Math.min(100, (bar.current / bar.max) * 100) : 0}%`,
                }"
              />
            </div>
            <span class="g1-value">{{ bar.current }}/{{ bar.max }}</span>
          </div>
        </template>
      </div>

      <div class="section">
        <h4>{{ t('courseRegistration.monitor.schedule') }}</h4>
        <WeekScheduleGrid :schedule="row.schedule" />
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

.g1-bar--group {
  margin-top: 12px;
}

.g1-bar--nested .g1-label {
  padding-left: 8px;
}

/* GE 学期分类灰色统计行：无进度条，仅文案 */
.g1-bar--stat {
  display: flex;
  justify-content: flex-start;
}

.g1-bar--stat .g1-label {
  color: #9ca3af;
  font-weight: 400;
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
</style>
