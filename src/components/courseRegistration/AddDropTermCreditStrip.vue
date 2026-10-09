<script setup>
/**
 * 加退课学分条：毕业 GE/ME（已选/要求）+ 学期 GE/ME + 学期选修/必修
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import '../../styles/course-registration-student.css'

const props = defineProps({
  /**
   * {
   *   gradGe:{current,max,tone}, gradMe:{...},
   *   ge:{current,max,tone}, me:{...},
   *   elective:{current,tone}, mandatory:{current,tone}
   * }
   */
  strip: { type: Object, default: null },
  /** 是否显示「学分要求」标题（表格上一行） */
  showLabel: { type: Boolean, default: true },
})

const { t } = useAppI18n()

const cards = computed(() => {
  const s = props.strip || {}
  const geCur = Number(s.ge?.current) || 0
  const meCur = Number(s.me?.current) || 0
  const electiveCur =
    s.elective?.current != null ? Number(s.elective.current) || 0 : geCur + meCur
  const gradGeCur = Number(s.gradGe?.current) || 0
  const gradGeMax = Number(s.gradGe?.max) || 0
  const gradMeCur = Number(s.gradMe?.current) || 0
  const gradMeMax = Number(s.gradMe?.max) || 0
  return [
    {
      key: 'gradGe',
      labelKey: 'courseRegistration.student.addDropTermCredit.gradSelectedRequiredGe',
      // 毕业：已选/要求（与学期列同序）
      value: `${gradGeCur}/${gradGeMax}`,
      tone: s.gradGe?.tone || '',
    },
    {
      key: 'gradMe',
      labelKey: 'courseRegistration.student.addDropTermCredit.gradSelectedRequiredMe',
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
      value: String(Number(s.mandatory?.current) || 0),
      tone: s.mandatory?.tone || 'is-neutral',
    },
  ]
})
</script>

<template>
  <div v-if="strip" class="adddrop-term-credit-strip" aria-label="term credit requirements">
    <div v-if="showLabel" class="adddrop-term-credit-strip__label">
      {{ t('courseRegistration.student.pickerCreditProgress') }}
    </div>
    <div class="cr-r1-credit-panel adddrop-term-credit-strip__panel">
      <div v-for="card in cards" :key="card.key" class="cr-r1-credit-card">
        <div class="cr-r1-credit-card-label">{{ t(card.labelKey) }}</div>
        <div class="cr-r1-credit-card-value" :class="card.tone">{{ card.value }}</div>
      </div>
    </div>
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
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card) {
  width: auto;
  min-width: 0;
}

.adddrop-term-credit-strip__panel :deep(.cr-r1-credit-card-label) {
  white-space: normal;
}
</style>
