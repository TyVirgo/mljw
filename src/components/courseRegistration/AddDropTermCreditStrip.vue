<script setup>
/**
 * 加退课学分条：两行
 * 上行学期（橙底）：GE/ME 学期 + 学期选修/必修 + 学期已选总
 * 下行毕业（蓝底）：GE/ME 毕业 + 毕业选修/必修已选 + 毕业已选总
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  summarizeAddDropStripCreditGaps,
  shouldShowAddDropCreditSituationTip,
} from '../../data/courseRegistration/addDropMultiItems.js'
import {
  getProgrammeCreditProgress,
  sumConfirmedCreditsByKind,
} from '../../data/courseRegistration/studentRegistrationContext.js'
import { summarizeFailedCourseCreditsByCategory } from '../../data/courseRegistration/studentTranscript.js'
import '../../styles/course-registration-student.css'

const props = defineProps({
  /**
   * {
   *   gradGe:{current,max,tone}, gradMe:{...}, gradMandatory?:{...}, gradElective?:{...},
   *   ge:{current,max,tone}, me:{...},
   *   elective:{current,tone}, mandatory:{current,tone},
   *   termTotalSelected?:{current,tone}, gradTotalSelected?:{current,tone},
   *   totalSelected?:{current,tone} // 弃用：兼容旧数据，等同学期总
   * }
   */
  strip: { type: Object, default: null },
  /** 是否显示「学分要求」标题（表格上一行） */
  showLabel: { type: Boolean, default: true },
  /**
   * 申请弹框：GE/ME 毕业标签将「已选/要求」换行；选课器保持单行
   */
  stackGradSelectedRequired: { type: Boolean, default: false },
  /**
   * 申请类型（兼容旧调用；tip 已默认展示，不再依赖此字段）
   * @deprecated tip 门槛已取消
   */
  applicationType: { type: String, default: '' },
  /** 基于学生真实新提交的未审申请估算时，在蓝条内直出说明（含装饰感叹号） */
  showPendingEstimateTip: { type: Boolean, default: false },
})

const { t } = useAppI18n()

/**
 * 从 strip 解析展示用数值
 * @returns {object}
 */
const viewModel = computed(() => {
  const s = props.strip || {}
  const geCur = Number(s.ge?.current) || 0
  const meCur = Number(s.me?.current) || 0
  const electiveCur =
    s.elective?.current != null ? Number(s.elective.current) || 0 : geCur + meCur
  const mandatoryCur = Number(s.mandatory?.current) || 0
  const gradGeCur = Number(s.gradGe?.current) || 0
  const gradGeMax = Number(s.gradGe?.max) || 0
  const gradMeCur = Number(s.gradMe?.current) || 0
  const gradMeMax = Number(s.gradMe?.max) || 0
  const gradElectiveCur =
    s.gradElective?.current != null
      ? Number(s.gradElective.current) || 0
      : gradGeCur + gradMeCur
  const gradMandatoryCur = Number(s.gradMandatory?.current) || 0
  // 学期总：优先 termTotalSelected，否则回退旧 totalSelected / 行内求和
  const termTotalCur =
    s.termTotalSelected?.current != null
      ? Number(s.termTotalSelected.current) || 0
      : s.totalSelected?.current != null
        ? Number(s.totalSelected.current) || 0
        : electiveCur + mandatoryCur
  const gradTotalCur =
    s.gradTotalSelected?.current != null
      ? Number(s.gradTotalSelected.current) || 0
      : gradElectiveCur + gradMandatoryCur
  return {
    ge: {
      value: `${geCur}/${Number(s.ge?.max) || 0}`,
      tone: s.ge?.tone || '',
    },
    me: {
      value: `${meCur}/${Number(s.me?.max) || 0}`,
      tone: s.me?.tone || '',
    },
    elective: {
      value: String(electiveCur),
      tone: s.elective?.tone || 'is-neutral',
    },
    mandatory: {
      value: String(mandatoryCur),
      tone: s.mandatory?.tone || 'is-neutral',
    },
    gradGe: {
      value: `${gradGeCur}/${gradGeMax}`,
      tone: s.gradGe?.tone || '',
    },
    gradMe: {
      value: `${gradMeCur}/${gradMeMax}`,
      tone: s.gradMe?.tone || '',
    },
    gradElective: {
      value: String(gradElectiveCur),
      tone: s.gradElective?.tone || 'is-neutral',
    },
    gradMandatory: {
      value: String(gradMandatoryCur),
      tone: s.gradMandatory?.tone || 'is-neutral',
    },
    termTotal: {
      value: String(termTotalCur),
      tone: s.termTotalSelected?.tone || s.totalSelected?.tone || 'is-neutral',
    },
    gradTotal: {
      value: String(gradTotalCur),
      tone: s.gradTotalSelected?.tone || 'is-neutral',
    },
  }
})

/** 有学分条即展示 tip（不依赖申请类型） */
const showSituationTip = computed(
  () => Boolean(props.strip) && shouldShowAddDropCreditSituationTip(props.applicationType),
)

/**
 * tip 缺口：GE/ME 跟条；必修 = 要求 − (历史 prior + 条上已选)
 */
const situationGaps = computed(() => {
  const programme = getProgrammeCreditProgress()
  const confirmedMandatory = sumConfirmedCreditsByKind().mandatory
  const priorMandatory = Math.max(
    0,
    (Number(programme.mandatoryEarned) || 0) - confirmedMandatory,
  )
  return summarizeAddDropStripCreditGaps(props.strip, {
    mandatoryPriorEarned: priorMandatory,
  })
})

const situationText = computed(() => {
  if (!showSituationTip.value) return ''
  const gaps = situationGaps.value
  if (gaps.hasDeficit) {
    return t('courseRegistration.student.addDropTermCredit.situationDeficit', {
      mandatory: gaps.mandatory,
      ge: gaps.ge,
      me: gaps.me,
    })
  }
  return t('courseRegistration.student.addDropTermCredit.situationFull')
})

/** 不及格课程学分：成绩单 failed 池按 Tab 求和（有 strip 常显） */
const failedCourseCredits = computed(() => summarizeFailedCourseCreditsByCategory())

const failedCourseCreditsText = computed(() => {
  if (!props.strip) return ''
  const c = failedCourseCredits.value
  return t('courseRegistration.student.addDropTermCredit.failedCourseCredits', {
    mandatory: c.mandatory,
    ge: c.ge,
    me: c.me,
  })
})
</script>

<template>
  <div v-if="strip" class="adddrop-term-credit-strip" aria-label="term credit requirements">
    <div v-if="showLabel" class="adddrop-term-credit-strip__label">
      {{ t('courseRegistration.student.pickerCreditProgress') }}
    </div>
    <div class="cr-r1-credit-panel adddrop-term-credit-strip__panel adddrop-term-credit-strip__panel--two-row">
      <!-- 第一行：学期（橙底） -->
      <div class="cr-r1-credit-card is-term-row area-ge-t">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.r1Credit.termSelectedRequiredGe') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.ge.tone">{{ viewModel.ge.value }}</div>
      </div>
      <div class="cr-r1-credit-card is-term-row area-me-t">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.r1Credit.termSelectedRequiredMe') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.me.tone">{{ viewModel.me.value }}</div>
      </div>
      <div class="cr-r1-credit-card is-term-row area-ele">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.addDropTermCredit.electiveSelected') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.elective.tone">
          {{ viewModel.elective.value }}
        </div>
      </div>
      <div class="cr-r1-credit-card is-term-row area-man">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.addDropTermCredit.mandatorySelected') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.mandatory.tone">
          {{ viewModel.mandatory.value }}
        </div>
      </div>

      <!-- 右侧学期已选总学分（青绿，与毕业总各占一行） -->
      <div class="cr-r1-credit-card is-total-cell is-term-row area-term-total">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.addDropTermCredit.termTotalSelected') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.termTotal.tone">
          {{ viewModel.termTotal.value }}
        </div>
      </div>

      <!-- 第二行：毕业（蓝底） -->
      <div class="cr-r1-credit-card is-grad-row area-ge-g">
        <div
          class="cr-r1-credit-card-label"
          :class="{ 'is-stacked': stackGradSelectedRequired }"
        >
          <template v-if="stackGradSelectedRequired">
            <span class="cr-r1-credit-card-label__title">
              {{ t('courseRegistration.student.addDropTermCredit.gradTitleGe') }}
            </span>
            <span class="cr-r1-credit-card-label__suffix">
              {{ t('courseRegistration.student.addDropTermCredit.selectedRequiredSuffix') }}
            </span>
          </template>
          <template v-else>
            {{ t('courseRegistration.student.addDropTermCredit.gradSelectedRequiredGe') }}
          </template>
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.gradGe.tone">
          {{ viewModel.gradGe.value }}
        </div>
      </div>
      <div class="cr-r1-credit-card is-grad-row area-me-g">
        <div
          class="cr-r1-credit-card-label"
          :class="{ 'is-stacked': stackGradSelectedRequired }"
        >
          <template v-if="stackGradSelectedRequired">
            <span class="cr-r1-credit-card-label__title">
              {{ t('courseRegistration.student.addDropTermCredit.gradTitleMe') }}
            </span>
            <span class="cr-r1-credit-card-label__suffix">
              {{ t('courseRegistration.student.addDropTermCredit.selectedRequiredSuffix') }}
            </span>
          </template>
          <template v-else>
            {{ t('courseRegistration.student.addDropTermCredit.gradSelectedRequiredMe') }}
          </template>
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.gradMe.tone">
          {{ viewModel.gradMe.value }}
        </div>
      </div>
      <div class="cr-r1-credit-card is-grad-row area-g-ele">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.addDropTermCredit.gradElectiveSelected') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.gradElective.tone">
          {{ viewModel.gradElective.value }}
        </div>
      </div>
      <div class="cr-r1-credit-card is-grad-row area-g-man">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.addDropTermCredit.gradMandatorySelected') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.gradMandatory.tone">
          {{ viewModel.gradMandatory.value }}
        </div>
      </div>
      <!-- 右侧毕业已选总学分 -->
      <div class="cr-r1-credit-card is-total-cell is-grad-row area-grad-total">
        <div class="cr-r1-credit-card-label">
          {{ t('courseRegistration.student.addDropTermCredit.gradTotalSelected') }}
        </div>
        <div class="cr-r1-credit-card-value" :class="viewModel.gradTotal.tone">
          {{ viewModel.gradTotal.value }}
        </div>
      </div>
    </div>
    <!-- 毕业未修 + 不及格学分：同一蓝框两行；估算说明可跟在框内 -->
    <p
      v-if="
        (showSituationTip && situationText) ||
        failedCourseCreditsText ||
        showPendingEstimateTip
      "
      class="adddrop-credit-situation-tip"
    >
      <span v-if="showSituationTip && situationText" class="adddrop-credit-situation-line">
        {{ situationText }}
      </span>
      <span v-if="failedCourseCreditsText" class="adddrop-credit-situation-line">
        {{ failedCourseCreditsText }}
      </span>
      <!-- 未审估算：同框内直出文案 -->
      <span v-if="showPendingEstimateTip" class="adddrop-credit-estimate-inline">
        <span
          class="adddrop-credit-estimate-bang"
          aria-hidden="true"
        >!</span>
        <span class="adddrop-credit-estimate-text">{{
          t('courseRegistration.student.addDropTermCredit.pendingEstimateTip')
        }}</span>
      </span>
    </p>
  </div>
</template>

<style scoped>
.adddrop-term-credit-strip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.adddrop-term-credit-strip__label {
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  line-height: 1.3;
}

.adddrop-term-credit-strip__panel {
  margin-left: 0;
  flex: 0 0 auto;
  width: 100%;
  max-width: 100%;
}

/* 两行：学期 / 毕业 + 右侧学期总 / 毕业总各一行 */
.adddrop-term-credit-strip__panel--two-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(88px, 0.95fr);
  grid-template-areas:
    'ge-t me-t ele man term-total'
    'ge-g me-g g-ele g-man grad-total';
  grid-template-rows: auto auto;
}

.area-ge-t {
  grid-area: ge-t;
}
.area-me-t {
  grid-area: me-t;
}
.area-ele {
  grid-area: ele;
}
.area-man {
  grid-area: man;
}
.area-ge-g {
  grid-area: ge-g;
}
.area-me-g {
  grid-area: me-g;
}
.area-g-ele {
  grid-area: g-ele;
}
.area-g-man {
  grid-area: g-man;
}
.area-term-total {
  grid-area: term-total;
}
.area-grad-total {
  grid-area: grad-total;
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card) {
  width: auto;
  min-width: 0;
  border-right: 1px solid #93c5fd;
}

/* 学期行底边，与毕业行分隔 */
.adddrop-term-credit-strip__panel--two-row :deep(.is-term-row) {
  border-bottom: 1px solid #93c5fd;
}

.adddrop-term-credit-strip__panel--two-row :deep(.area-term-total),
.adddrop-term-credit-strip__panel--two-row :deep(.area-grad-total) {
  border-right: none;
  border-left: 1px solid #93c5fd;
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card-label) {
  white-space: nowrap;
  /* 尽量大且单行：最长「GE学期学分 已选/要求」不换行 */
  font-size: 12px;
  line-height: 1.35;
  overflow: visible;
  text-overflow: clip;
  padding-top: 5px;
  padding-bottom: 5px;
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card-label.is-stacked) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  line-height: 1.25;
  white-space: normal;
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card-label__title),
.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card-label__suffix) {
  display: block;
}

/* 学期行：橙色底（数值色仍跟 tone：未满/满/超） */
.adddrop-term-credit-strip__panel--two-row :deep(.is-term-row .cr-r1-credit-card-label) {
  background: #fed7aa;
  color: #9a3412;
}

.adddrop-term-credit-strip__panel--two-row :deep(.is-term-row .cr-r1-credit-card-value) {
  background: #ffedd5;
}

/* 学期/毕业已选总学分：跟同行橙/蓝（不再单独青绿） */
.adddrop-term-credit-strip__panel--two-row :deep(.is-total-cell .cr-r1-credit-card-value) {
  flex: 1 1 auto;
  min-height: 2.5em;
}

.adddrop-credit-situation-tip {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
  border-left: 3px solid #2563eb;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 13px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.adddrop-credit-situation-line {
  display: block;
}

.adddrop-credit-estimate-inline {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 0;
}

.adddrop-credit-estimate-bang {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 50%;
  border: 1px solid #f59e0b;
  background: #fffbeb;
  color: #b45309;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.adddrop-credit-estimate-text {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
