<script setup>
/**
 * 加退课学分要求：二维表
 * 列：必修课 / 公共选修课 / 专业选修课 / 选修课合计 / 总合计
 * 行：学期已选/要求、毕业已选/要求、未修/因修
 * 前三列一级灰底（选满绿/超出红），后两列橙底
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  resolveAddDropSituationCreditGaps,
  shouldShowAddDropCreditSituationTip,
  toneForTermSelectedWithCatchUp,
} from '../../data/courseRegistration/addDropMultiItems.js'
import { summarizeFailedCourseCreditsByCategory } from '../../data/courseRegistration/studentTranscript.js'
import { getEffectiveAudienceRounds } from '../../data/courseRegistration/audienceRounds.js'
import { getActiveBatch } from '../../data/courseRegistration/registrationBatches.js'
import { getStudentAudience } from '../../data/courseRegistration/studentAudience.js'
import '../../styles/course-registration-student.css'

const props = defineProps({
  /**
   * {
   *   gradGe:{current,max,tone}, gradMe:{...}, gradMandatory?:{...}, gradElective?:{...},
   *   ge:{current,max,tone}, me:{...},
   *   elective:{current,tone}, mandatory:{current,tone,max?},
   *   termTotalSelected?:{current,tone}, gradTotalSelected?:{current,tone},
   *   totalSelected?:{current,tone} // 弃用：兼容旧数据，等同学期总
   * }
   */
  strip: { type: Object, default: null },
  /** 是否显示「学分要求」标题（表格上一行） */
  showLabel: { type: Boolean, default: true },
  /**
   * 申请弹框：GE/ME 毕业标签将「已选/要求」换行；选课器保持单行
   * @deprecated 矩阵表行表头已固定换行，不再使用
   */
  stackGradSelectedRequired: { type: Boolean, default: false },
  /**
   * 申请类型（兼容旧调用；tip 已默认展示，不再依赖此字段）
   * @deprecated tip 门槛已取消
   */
  applicationType: { type: String, default: '' },
  /** 基于学生真实新提交的未审申请估算时，在蓝条内直出说明（含装饰感叹号） */
  showPendingEstimateTip: { type: Boolean, default: false },
  /**
   * 蓝底 tip 固定落下（增量 ah：仅 tip；矩阵未修/因修改跟 live strip）
   * null=tip 也回退条上 gaps；对象则 tip 用快照
   * { ge, me, mandatory, geEarned?, meEarned?, mandatoryEarned? }
   */
  termCatchUpCredits: {
    type: Object,
    default: null,
  },
})

const { t } = useAppI18n()

/**
 * 已选/要求文案
 * @param {number} current 已选
 * @param {number} max 要求
 * @returns {string}
 */
function formatSelectedRequired(current, max) {
  return `${Math.max(0, Number(current) || 0)}/${Math.max(0, Number(max) || 0)}`
}

/**
 * 未修/因修文案：左未修（当前落下），右因修（已修+未修）
 * @param {number} unfinishedCredits 未修
 * @param {number} earnedCredits 已修（学期已选）
 * @returns {string}
 */
function formatUnfinishedDue(unfinishedCredits, earnedCredits) {
  const unfinished = Math.max(0, Number(unfinishedCredits) || 0)
  const earned = Math.max(0, Number(earnedCredits) || 0)
  return `${unfinished}/${earned + unfinished}`
}

/**
 * 矩阵各格数值与 tone
 * @returns {object}
 */
const viewModel = computed(() => {
  const s = props.strip || {}
  const geCur = Number(s.ge?.current) || 0
  const geMax = Math.max(0, Number(s.ge?.max) || 0)
  const meCur = Number(s.me?.current) || 0
  const meMax = Math.max(0, Number(s.me?.max) || 0)
  const electiveCur =
    s.elective?.current != null ? Number(s.elective.current) || 0 : geCur + meCur
  const electiveMax = geMax + meMax
  const mandatoryCur = Number(s.mandatory?.current) || 0
  const mandatoryMax = Math.max(0, Number(s.mandatory?.max) || 0)
  const gradGeCur = Number(s.gradGe?.current) || 0
  const gradGeMax = Number(s.gradGe?.max) || 0
  const gradMeCur = Number(s.gradMe?.current) || 0
  const gradMeMax = Number(s.gradMe?.max) || 0
  const gradElectiveCur =
    s.gradElective?.current != null
      ? Number(s.gradElective.current) || 0
      : gradGeCur + gradMeCur
  const gradElectiveMax = gradGeMax + gradMeMax
  const gradMandatoryCur = Number(s.gradMandatory?.current) || 0
  const gradMandatoryMax = Math.max(0, Number(s.gradMandatory?.max) || 0)
  const termTotalCur =
    s.termTotalSelected?.current != null
      ? Number(s.termTotalSelected.current) || 0
      : s.totalSelected?.current != null
        ? Number(s.totalSelected.current) || 0
        : electiveCur + mandatoryCur
  const termTotalMax = electiveMax + mandatoryMax
  const gradTotalCur =
    s.gradTotalSelected?.current != null
      ? Number(s.gradTotalSelected.current) || 0
      : gradElectiveCur + gradMandatoryCur
  const gradTotalMax = gradElectiveMax + gradMandatoryMax
  // 增量 ah：矩阵未修/因修始终跟 live strip（含拟加/拟退/重修投影）
  const gaps = resolveAddDropSituationCreditGaps(s)
  const unfinishedMandatory = Math.max(0, Number(gaps.mandatory) || 0)
  const unfinishedGe = Math.max(0, Number(gaps.ge) || 0)
  const unfinishedMe = Math.max(0, Number(gaps.me) || 0)
  const unfinishedElective = unfinishedGe + unfinishedMe
  const unfinishedTotal = unfinishedMandatory + unfinishedElective
  // 因修右项 = live 学期已选（已修）+ 未修
  const earnedMandatory = mandatoryCur
  const earnedGe = geCur
  const earnedMe = meCur
  const earnedElective = earnedGe + earnedMe
  const earnedTotal = earnedMandatory + earnedElective
  return {
    termMandatory: {
      value: formatSelectedRequired(mandatoryCur, mandatoryMax),
      tone: toneForTermSelectedWithCatchUp(mandatoryCur, mandatoryMax, 0),
    },
    termGe: {
      value: formatSelectedRequired(geCur, geMax),
      tone: toneForTermSelectedWithCatchUp(geCur, geMax, 0),
    },
    termMe: {
      value: formatSelectedRequired(meCur, meMax),
      tone: toneForTermSelectedWithCatchUp(meCur, meMax, 0),
    },
    termElective: {
      value: formatSelectedRequired(electiveCur, electiveMax),
    },
    termTotal: {
      value: formatSelectedRequired(termTotalCur, termTotalMax),
    },
    gradMandatory: {
      value: formatSelectedRequired(gradMandatoryCur, gradMandatoryMax),
      tone: s.gradMandatory?.tone || '',
    },
    gradGe: {
      value: formatSelectedRequired(gradGeCur, gradGeMax),
      tone: s.gradGe?.tone || '',
    },
    gradMe: {
      value: formatSelectedRequired(gradMeCur, gradMeMax),
      tone: s.gradMe?.tone || '',
    },
    gradElective: {
      value: formatSelectedRequired(gradElectiveCur, gradElectiveMax),
    },
    gradTotal: {
      value: formatSelectedRequired(gradTotalCur, gradTotalMax),
    },
    unfinishedMandatory: {
      value: formatUnfinishedDue(unfinishedMandatory, earnedMandatory),
    },
    unfinishedGe: {
      value: formatUnfinishedDue(unfinishedGe, earnedGe),
    },
    unfinishedMe: {
      value: formatUnfinishedDue(unfinishedMe, earnedMe),
    },
    unfinishedElective: {
      value: formatUnfinishedDue(unfinishedElective, earnedElective),
    },
    unfinishedTotal: {
      value: formatUnfinishedDue(unfinishedTotal, earnedTotal),
    },
  }
})

/** 有学分条即展示 tip（不依赖申请类型） */
const showSituationTip = computed(
  () => Boolean(props.strip) && shouldShowAddDropCreditSituationTip(props.applicationType),
)

/**
 * tip 落下：仅 tip 用固定 catchUp；未传入则回退条上 gaps
 * （矩阵未修行已改走 live strip，与 tip 解耦）
 */
const situationGaps = computed(() => {
  const catchUp = props.termCatchUpCredits
  if (catchUp && typeof catchUp === 'object') {
    return {
      mandatory: Math.max(0, Number(catchUp.mandatory) || 0),
      ge: Math.max(0, Number(catchUp.ge) || 0),
      me: Math.max(0, Number(catchUp.me) || 0),
    }
  }
  return resolveAddDropSituationCreditGaps(props.strip)
})

/** 始终按落下句式展示；无落下时各类别为 0 */
const situationText = computed(() => {
  if (!showSituationTip.value) return ''
  const gaps = situationGaps.value
  return t('courseRegistration.student.addDropTermCredit.situationDeficit', {
    mandatory: gaps.mandatory,
    ge: gaps.ge,
    me: gaps.me,
  })
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

/**
 * 增量 br：第三轮在线选课窗文案（选修加/退说明；读 supplement，≠ 加退课窗）
 */
const round3ElectiveWindowText = computed(() => {
  if (!props.strip) return ''
  const batch = getActiveBatch()
  const audience = getStudentAudience()
  const rounds = getEffectiveAudienceRounds(batch, audience)
  const range = rounds?.supplement || null
  const start = String(range?.start || '').trim()
  const end = String(range?.end || '').trim()
  if (!start && !end) {
    return t('courseRegistration.student.addDropTermCredit.round3ElectiveWindowUnset')
  }
  return t('courseRegistration.student.addDropTermCredit.round3ElectiveWindow', {
    start: start || '—',
    end: end || '—',
  })
})
</script>

<template>
  <div v-if="strip" class="adddrop-term-credit-strip" aria-label="term credit requirements">
    <div v-if="showLabel" class="adddrop-term-credit-strip__label">
      {{ t('courseRegistration.student.pickerCreditProgress') }}
    </div>
    <!-- 不用 cr-r1-credit-panel：其 5 列 Grid 会把整表挤进第一格，列与数值不可见 -->
    <div class="adddrop-term-credit-strip__panel">
      <table class="adddrop-credit-matrix">
        <thead>
          <tr>
            <th class="adddrop-credit-matrix__corner" scope="col"></th>
            <th class="is-level1-head" scope="col">
              {{ t('courseRegistration.student.addDropTermCredit.matrixColMandatory') }}
            </th>
            <th class="is-level1-head" scope="col">
              {{ t('courseRegistration.student.addDropTermCredit.matrixColGe') }}
            </th>
            <th class="is-level1-head" scope="col">
              {{ t('courseRegistration.student.addDropTermCredit.matrixColMe') }}
            </th>
            <th class="is-summary-head" scope="col">
              {{ t('courseRegistration.student.addDropTermCredit.matrixColElectiveSum') }}
            </th>
            <th class="is-summary-head" scope="col">
              {{ t('courseRegistration.student.addDropTermCredit.matrixColGrandTotal') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class="adddrop-credit-matrix__row-head is-level1-head" scope="row">
              <span>{{ t('courseRegistration.student.addDropTermCredit.matrixRowTerm') }}</span>
              <span>{{ t('courseRegistration.student.addDropTermCredit.matrixRowSelectedRequired') }}</span>
            </th>
            <td class="is-level1-cell" :class="viewModel.termMandatory.tone">
              {{ viewModel.termMandatory.value }}
            </td>
            <td class="is-level1-cell" :class="viewModel.termGe.tone">
              {{ viewModel.termGe.value }}
            </td>
            <td class="is-level1-cell" :class="viewModel.termMe.tone">
              {{ viewModel.termMe.value }}
            </td>
            <td class="is-summary-cell">{{ viewModel.termElective.value }}</td>
            <td class="is-summary-cell">{{ viewModel.termTotal.value }}</td>
          </tr>
          <tr>
            <th class="adddrop-credit-matrix__row-head is-level1-head" scope="row">
              <span>{{ t('courseRegistration.student.addDropTermCredit.matrixRowGrad') }}</span>
              <span>{{ t('courseRegistration.student.addDropTermCredit.matrixRowSelectedRequired') }}</span>
            </th>
            <td class="is-level1-cell" :class="viewModel.gradMandatory.tone">
              {{ viewModel.gradMandatory.value }}
            </td>
            <td class="is-level1-cell" :class="viewModel.gradGe.tone">
              {{ viewModel.gradGe.value }}
            </td>
            <td class="is-level1-cell" :class="viewModel.gradMe.tone">
              {{ viewModel.gradMe.value }}
            </td>
            <td class="is-summary-cell">{{ viewModel.gradElective.value }}</td>
            <td class="is-summary-cell">{{ viewModel.gradTotal.value }}</td>
          </tr>
          <tr>
            <th class="adddrop-credit-matrix__row-head is-level1-head" scope="row">
              {{ t('courseRegistration.student.addDropTermCredit.matrixRowUnfinishedDue') }}
            </th>
            <td class="is-level1-cell">{{ viewModel.unfinishedMandatory.value }}</td>
            <td class="is-level1-cell">{{ viewModel.unfinishedGe.value }}</td>
            <td class="is-level1-cell">{{ viewModel.unfinishedMe.value }}</td>
            <td class="is-summary-cell">{{ viewModel.unfinishedElective.value }}</td>
            <td class="is-summary-cell">{{ viewModel.unfinishedTotal.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 落下未修 + 不及格 + 第三轮选修窗：同一蓝框；估算说明已并入二次申请红字 -->
    <p
      v-if="(showSituationTip && situationText) || failedCourseCreditsText || round3ElectiveWindowText"
      class="adddrop-credit-situation-tip"
    >
      <span v-if="showSituationTip && situationText" class="adddrop-credit-situation-line">
        {{ situationText }}
      </span>
      <span v-if="failedCourseCreditsText" class="adddrop-credit-situation-line">
        {{ failedCourseCreditsText }}
      </span>
      <span v-if="round3ElectiveWindowText" class="adddrop-credit-situation-line">
        {{ round3ElectiveWindowText }}
      </span>
      <!-- showPendingEstimateTip / pendingEstimateTip 已弃用：并入二次申请红字 -->
    </p>
  </div>
</template>

<style scoped>
.adddrop-term-credit-strip {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
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
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  background: #eff6ff;
}

.adddrop-credit-matrix {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
  color: #111827;
}

.adddrop-credit-matrix th,
.adddrop-credit-matrix td {
  border: 1px solid #93c5fd;
  text-align: center;
  padding: 6px 4px;
  word-break: break-word;
}

.adddrop-credit-matrix thead th {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.adddrop-credit-matrix__corner {
  width: 72px;
  background: #e5e7eb;
}

.adddrop-credit-matrix__row-head {
  width: 72px;
  font-weight: 600;
  font-size: 11px;
  line-height: 1.25;
}

.adddrop-credit-matrix__row-head span {
  display: block;
}

.adddrop-credit-matrix td {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.adddrop-credit-matrix .is-level1-head {
  background: #e5e7eb;
  color: #111827;
}

.adddrop-credit-matrix .is-level1-cell {
  background: #f3f4f6;
  color: #111827;
}

.adddrop-credit-matrix .is-level1-cell.is-met {
  color: #047857;
}

.adddrop-credit-matrix .is-level1-cell.is-over {
  color: #b91c1c;
}

.adddrop-credit-matrix .is-summary-head {
  background: #fed7aa;
  color: #111827;
}

.adddrop-credit-matrix .is-summary-cell {
  background: #ffedd5;
  color: #111827;
  font-weight: 700;
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
