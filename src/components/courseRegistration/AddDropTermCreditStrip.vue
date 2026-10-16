<script setup>
/**
 * 加退课学分条：毕业 GE/ME（已选/要求）+ 学期 GE/ME + 学期选修/必修 + 已选总学分
 * 条下：加课/加退课学分情况 tip（按条内数据汇总未修）
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  summarizeAddDropStripCreditGaps,
  shouldShowAddDropCreditSituationTip,
} from '../../data/courseRegistration/addDropMultiItems.js'
import '../../styles/course-registration-student.css'

const props = defineProps({
  /**
   * {
   *   gradGe:{current,max,tone}, gradMe:{...}, gradMandatory?:{...},
   *   ge:{current,max,tone}, me:{...},
   *   elective:{current,tone}, mandatory:{current,tone},
   *   totalSelected:{current,tone}
   * }
   */
  strip: { type: Object, default: null },
  /** 是否显示「学分要求」标题（表格上一行） */
  showLabel: { type: Boolean, default: true },
  /**
   * 申请弹框：GE/ME 毕业标签将「已选/要求」换行；选课器保持单行
   */
  stackGradSelectedRequired: { type: Boolean, default: false },
  /** 申请类型：Add / Drop / Retake / AddDrop / RetakeDrop 时展示学分情况 tip */
  applicationType: { type: String, default: '' },
})

const { t } = useAppI18n()

const cards = computed(() => {
  const s = props.strip || {}
  const geCur = Number(s.ge?.current) || 0
  const meCur = Number(s.me?.current) || 0
  const electiveCur =
    s.elective?.current != null ? Number(s.elective.current) || 0 : geCur + meCur
  const mandatoryCur = Number(s.mandatory?.current) || 0
  const totalCur =
    s.totalSelected?.current != null
      ? Number(s.totalSelected.current) || 0
      : electiveCur + mandatoryCur
  const gradGeCur = Number(s.gradGe?.current) || 0
  const gradGeMax = Number(s.gradGe?.max) || 0
  const gradMeCur = Number(s.gradMe?.current) || 0
  const gradMeMax = Number(s.gradMe?.max) || 0
  return [
    {
      key: 'gradGe',
      labelKey: 'courseRegistration.student.addDropTermCredit.gradSelectedRequiredGe',
      titleKey: 'courseRegistration.student.addDropTermCredit.gradTitleGe',
      suffixKey: 'courseRegistration.student.addDropTermCredit.selectedRequiredSuffix',
      stackable: true,
      value: `${gradGeCur}/${gradGeMax}`,
      tone: s.gradGe?.tone || '',
    },
    {
      key: 'gradMe',
      labelKey: 'courseRegistration.student.addDropTermCredit.gradSelectedRequiredMe',
      titleKey: 'courseRegistration.student.addDropTermCredit.gradTitleMe',
      suffixKey: 'courseRegistration.student.addDropTermCredit.selectedRequiredSuffix',
      stackable: true,
      value: `${gradMeCur}/${gradMeMax}`,
      tone: s.gradMe?.tone || '',
    },
    {
      key: 'ge',
      labelKey: 'courseRegistration.student.r1Credit.termSelectedRequiredGe',
      value: `${geCur}/${Number(s.ge?.max) || 0}`,
      tone: s.ge?.tone || '',
    },
    {
      key: 'me',
      labelKey: 'courseRegistration.student.r1Credit.termSelectedRequiredMe',
      value: `${meCur}/${Number(s.me?.max) || 0}`,
      tone: s.me?.tone || '',
    },
    {
      key: 'elective',
      labelKey: 'courseRegistration.student.addDropTermCredit.electiveSelected',
      value: String(electiveCur),
      tone: s.elective?.tone || 'is-neutral',
    },
    {
      key: 'mandatory',
      labelKey: 'courseRegistration.student.addDropTermCredit.mandatorySelected',
      value: String(mandatoryCur),
      tone: s.mandatory?.tone || 'is-neutral',
    },
    {
      key: 'total',
      labelKey: 'courseRegistration.student.addDropTermCredit.totalSelected',
      value: String(totalCur),
      tone: s.totalSelected?.tone || 'is-neutral',
    },
  ]
})

const showSituationTip = computed(() =>
  Boolean(props.strip) && shouldShowAddDropCreditSituationTip(props.applicationType),
)

const situationGaps = computed(() => summarizeAddDropStripCreditGaps(props.strip))

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
</script>

<template>
  <div v-if="strip" class="adddrop-term-credit-strip" aria-label="term credit requirements">
    <div v-if="showLabel" class="adddrop-term-credit-strip__label">
      {{ t('courseRegistration.student.pickerCreditProgress') }}
    </div>
    <div class="cr-r1-credit-panel adddrop-term-credit-strip__panel">
      <div v-for="card in cards" :key="card.key" class="cr-r1-credit-card">
        <div
          class="cr-r1-credit-card-label"
          :class="{ 'is-stacked': stackGradSelectedRequired && card.stackable }"
        >
          <template v-if="stackGradSelectedRequired && card.stackable">
            <span class="cr-r1-credit-card-label__title">{{ t(card.titleKey) }}</span>
            <span class="cr-r1-credit-card-label__suffix">{{ t(card.suffixKey) }}</span>
          </template>
          <template v-else>{{ t(card.labelKey) }}</template>
        </div>
        <div class="cr-r1-credit-card-value" :class="card.tone">{{ card.value }}</div>
      </div>
    </div>
    <p v-if="showSituationTip && situationText" class="adddrop-credit-situation-tip">
      {{ situationText }}
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
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card) {
  width: auto;
  min-width: 0;
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card-label) {
  white-space: nowrap;
  font-size: 10px;
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
}
</style>
