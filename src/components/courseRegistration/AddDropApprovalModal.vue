<script setup>
import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import {
  approvalActionOptions,
  commonApprovalComments,
  validateApprovalForm,
} from '../../data/movementApprovalEngine.js'
import { getApprovalActionLabel } from '../../utils/approvalActionLabels.js'
import {
  addDropApprovalLineKey,
  buildApprovalDecisionTermCreditStrip,
  summarizeApprovalStripCreditViolations,
} from '../../data/courseRegistration/addDropMultiItems.js'
import { addDropTypeLabelKey } from '../../data/courseRegistration/addDropTypeDisplay.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { displayClassTimeVenueFromFields } from '../../data/courseRegistration/sectionScheduleFields.js'
import {
  resolveCourseDisplayName,
  getCourseById,
  getCourseByCode,
} from '../../data/courseRegistration/selectableCourses.js'
import { formatUnifiedCourseCategoryFromLine } from '../../data/courseRegistration/unifiedCourseCategory.js'
import AddDropTermCreditStrip from './AddDropTermCreditStrip.vue'

const props = defineProps({
  visible: Boolean,
  approvalStage: { type: String, default: 'Academic Coordinator' },
  targetCount: { type: Number, default: 1 },
  /** 是否展示「生成账单」（有费用场景） */
  showGenerateBill: { type: Boolean, default: true },
  /** 单条审批时传入申请，用于课程汇总与操作列；批量不传 */
  application: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr, isZh } = useAppI18n()
const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const selectedAction = ref('')
const comments = ref('')
const showPresets = ref(false)
const presetBtnRef = ref(null)
const presetListStyle = ref({})
const formError = ref('')
const submitConfirmVisible = ref(false)
const pendingPayload = ref(null)
/** @type {import('vue').Ref<Record<string, 'approved' | 'rejected' | 'update_required' | 'pending'>>} */
const lineDecisionsMap = ref({})
/** 每行评价意见（与 lineDecisionsMap 同 key） */
/** @type {import('vue').Ref<Record<string, string>>} */
const lineCommentsMap = ref({})
/** @type {import('vue').Ref<Record<string, boolean>>} */
const selectedKeysMap = ref({})
/** 行级意见二级弹层 */
const commentEditorVisible = ref(false)
const commentEditorKey = ref('')
const draftLineComment = ref('')

const LINE_ACTION_OPTIONS = [
  { value: 'approved', labelKey: 'approvalModal.action.approved' },
  { value: 'rejected', labelKey: 'approvalModal.action.rejected' },
  { value: 'update_required', labelKey: 'approvalModal.action.updateRequired' },
]

const summaryItems = computed(() => {
  if (props.targetCount > 1) return []
  return props.application?.items || []
})

const showLineOps = computed(() => summaryItems.value.length > 0)

/** 顶部学分要求：通过+待定计入（与详情一致）；驳回/退回不计 */
const liveTermCreditStrip = computed(() => {
  if (!showLineOps.value || !props.application) return null
  return buildApprovalDecisionTermCreditStrip(props.application, lineDecisionsMap.value)
})

/** GE/ME 学期超限 → 确认置灰 + 左侧提示 */
const creditGate = computed(() => summarizeApprovalStripCreditViolations(liveTermCreditStrip.value))

const creditGateBlocked = computed(() => Boolean(showLineOps.value && creditGate.value.blocked))

const creditGateHint = computed(() => {
  if (!creditGateBlocked.value) return ''
  const labelMap = {
    geTerm: t('courseRegistration.approval.creditLabelGeTerm'),
    meTerm: t('courseRegistration.approval.creditLabelMeTerm'),
  }
  const labels = creditGate.value.keys.map((k) => labelMap[k] || k).join('、')
  return t('courseRegistration.approval.creditOverRequirementHint', { labels })
})

const selectedKeyList = computed(() =>
  Object.keys(selectedKeysMap.value).filter((k) => selectedKeysMap.value[k]),
)

const hasSelectedLines = computed(() => selectedKeyList.value.length > 0)

const allSelected = computed(() => {
  const items = summaryItems.value
  if (!items.length) return false
  return items.every((item, idx) => selectedKeysMap.value[itemKey(item, idx)])
})

function resolveI18nLabel(key, fallback) {
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : fallback
}

function actionTypeLabel(action) {
  return resolveI18nLabel(addDropTypeLabelKey(action), action || '—')
}

function itemCourseName(item) {
  return resolveCourseDisplayName(item, isZh.value) || '—'
}

/**
 * 审批明细「课程类型」：统一类别
 * @param {object|null|undefined} item
 */
function itemCourseTypeLabel(item) {
  return formatUnifiedCourseCategoryFromLine(item, t, {
    getCourseById,
    getCourseByCode,
  })
}

/**
 * 审批行唯一键：须含 action，避免退/加同课同组共用 radio 与决策 map
 * @param {object|null|undefined} item
 * @param {number} idx
 */
function itemKey(item, idx) {
  return addDropApprovalLineKey(item, idx)
}

function dash(v) {
  return v != null && String(v).trim() ? String(v).trim() : '—'
}

function itemWeekRange(item) {
  return dash(item?.weekRange)
}

function itemLecturer(item) {
  return dash(item?.lecturer || item?.lecturers)
}

function itemTimeVenueText(item) {
  return displayClassTimeVenueFromFields(
    {
      time: item?.time,
      classTime: item?.classTime || item?.time,
      venue: item?.venue || item?.room,
      room: item?.room || item?.venue,
      weekRange: item?.weekRange,
      meetings: item?.meetings,
    },
    timeLocale.value,
  )
}

function itemTimeVenueLines(item) {
  const text = itemTimeVenueText(item)
  if (!text || text === '—') return []
  return String(text)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 打开弹窗时初始化行决策与行意见
 */
function initLineDecisions() {
  const map = {}
  const commentsMap = {}
  const sel = {}
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    const d = item.lineDecision
    // 无历史决策时默认通过（打开即可与申请投影学分一致）
    map[key] =
      d === 'approved' || d === 'rejected' || d === 'update_required' ? d : 'approved'
    // 回填已有行意见（若有）
    commentsMap[key] = String(item.lineComment || '').trim()
    sel[key] = true
  }
  lineDecisionsMap.value = map
  lineCommentsMap.value = commentsMap
  selectedKeysMap.value = sel
  commentEditorVisible.value = false
  commentEditorKey.value = ''
  draftLineComment.value = ''
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      showPresets.value = false
      return
    }
    selectedAction.value = ''
    comments.value = ''
    showPresets.value = false
    formError.value = ''
    submitConfirmVisible.value = false
    pendingPayload.value = null
    commentEditorVisible.value = false
    commentEditorKey.value = ''
    draftLineComment.value = ''
    initLineDecisions()
  },
)

watch(
  () => props.application?.id,
  () => {
    if (props.visible) initLineDecisions()
  },
)

const batchHint = computed(() => {
  if (props.targetCount <= 1) return ''
  const template = tr('Applying the same decision to {count} selected application(s).')
  return template.replace('{count}', String(props.targetCount))
})

const submitConfirmMessage = computed(() => {
  if (props.targetCount <= 1) {
    return tr('Are you sure you want to submit this approval decision?')
  }
  const template = tr(
    'Are you sure you want to submit this approval decision for {count} selected application(s)?',
  )
  return template.replace('{count}', String(props.targetCount))
})

/** 批量无行表：整单 Action + Comments；有行表时意见改到行级，不再显示表下公共 Comments */
const showWholeForm = computed(() => !showLineOps.value)
const showSharedComments = computed(() => showWholeForm.value)

/**
 * 行是否已有评价意见
 * @param {string} key
 */
function hasLineComment(key) {
  return Boolean(String(lineCommentsMap.value[key] || '').trim())
}

/**
 * 行末意见按钮文案
 * @param {string} key
 */
function lineCommentButtonLabel(key) {
  return hasLineComment(key)
    ? t('courseRegistration.approval.editLineComment')
    : t('courseRegistration.approval.addLineComment')
}

/**
 * 打开某行评价意见二级弹层
 * @param {string} key
 */
function openLineCommentEditor(key) {
  commentEditorKey.value = key
  draftLineComment.value = String(lineCommentsMap.value[key] || '')
  showPresets.value = false
  formError.value = ''
  commentEditorVisible.value = true
}

/** 关闭行意见弹层（不保存） */
function closeLineCommentEditor() {
  commentEditorVisible.value = false
  commentEditorKey.value = ''
  draftLineComment.value = ''
  showPresets.value = false
}

/** 确认写入当前行意见 */
function saveLineCommentEditor() {
  const key = commentEditorKey.value
  if (!key) {
    closeLineCommentEditor()
    return
  }
  lineCommentsMap.value = {
    ...lineCommentsMap.value,
    [key]: String(draftLineComment.value || '').trim().slice(0, 200),
  }
  closeLineCommentEditor()
}

function setLineDecision(key, decision) {
  lineDecisionsMap.value = { ...lineDecisionsMap.value, [key]: decision }
}

function toggleRowSelected(key, checked) {
  selectedKeysMap.value = { ...selectedKeysMap.value, [key]: checked }
}

function toggleSelectAll(checked) {
  if (!summaryItems.value.length) return
  const sel = { ...selectedKeysMap.value }
  for (const [idx, item] of summaryItems.value.entries()) {
    sel[itemKey(item, idx)] = checked
  }
  selectedKeysMap.value = sel
}

function applyDecisionToSelected(decision) {
  if (!hasSelectedLines.value) {
    formError.value = t('courseRegistration.approval.lineSelectRequired')
    return
  }
  formError.value = ''
  const map = { ...lineDecisionsMap.value }
  for (const key of selectedKeyList.value) map[key] = decision
  lineDecisionsMap.value = map
}

function buildLineDecisionsPayload(action) {
  if (!showLineOps.value) return undefined
  const out = {}
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    let resolved
    if (action === 'Rejected' || action === 'Update Required') {
      resolved = 'rejected'
    } else {
      const d = lineDecisionsMap.value[key]
      resolved = d === 'rejected' ? 'rejected' : 'approved'
    }
    out[idx] = resolved
    out[key] = resolved
  }
  return out
}

/**
 * 组装行意见 payload（按 idx / key 双写）
 * @param {Array<{ key: string, idx: number }>} entries
 */
function buildLineCommentsPayload(entries) {
  const out = {}
  for (const e of entries) {
    const text = String(lineCommentsMap.value[e.key] || '').trim()
    out[e.idx] = text
    out[e.key] = text
  }
  return out
}

/**
 * 整单审批日志摘要：课号 + 行意见
 * @param {Array<{ key: string, item: object }>} entries
 */
function buildAggregatedComment(entries) {
  const parts = []
  for (const e of entries) {
    const text = String(lineCommentsMap.value[e.key] || '').trim()
    if (!text) continue
    const code = e.item?.courseCode || e.key
    parts.push(`${code}: ${text}`)
  }
  return parts.join('；')
}

/**
 * 由行决策推导整单 action / lineDecisions / comment / generateBill / lineComments
 * @returns {{ ok: true, payload: object } | { ok: false, errorKey: string }}
 */
function resolvePayloadFromLines() {
  const entries = summaryItems.value.map((item, idx) => {
    const key = itemKey(item, idx)
    return {
      key,
      idx,
      item,
      decision: lineDecisionsMap.value[key] || 'pending',
    }
  })
  if (!entries.length) {
    return { ok: false, errorKey: 'courseRegistration.approval.lineDecisionRequired' }
  }
  if (entries.some((e) => e.decision === 'pending')) {
    return { ok: false, errorKey: 'courseRegistration.approval.lineDecisionRequired' }
  }
  const allUpdate = entries.every((e) => e.decision === 'update_required')
  const anyUpdate = entries.some((e) => e.decision === 'update_required')
  if (anyUpdate && !allUpdate) {
    return { ok: false, errorKey: 'courseRegistration.approval.lineUpdateMixed' }
  }
  // 不通过 / 驳回行：该行评价意见必填
  const missingComment = entries.some((e) => {
    if (e.decision !== 'rejected' && e.decision !== 'update_required') return false
    return !String(lineCommentsMap.value[e.key] || '').trim()
  })
  if (missingComment) {
    return { ok: false, errorKey: 'courseRegistration.approval.lineCommentRequired' }
  }
  const comment = buildAggregatedComment(entries)
  const lineComments = buildLineCommentsPayload(entries)
  if (allUpdate) {
    return {
      ok: true,
      payload: {
        action: 'Update Required',
        comment,
        generateBill: false,
        lineDecisions: buildLineDecisionsPayload('Update Required'),
        lineComments,
      },
    }
  }
  const allRejected = entries.every((e) => e.decision === 'rejected')
  if (allRejected) {
    return {
      ok: true,
      payload: {
        action: 'Rejected',
        comment,
        generateBill: false,
        lineDecisions: buildLineDecisionsPayload('Rejected'),
        lineComments,
      },
    }
  }
  // Approved 或部分通过（含通过行）
  const out = {}
  for (const e of entries) {
    const resolved = e.decision === 'rejected' ? 'rejected' : 'approved'
    out[e.idx] = resolved
    out[e.key] = resolved
  }
  const hasApproved = entries.some((e) => e.decision === 'approved')
  return {
    ok: true,
    payload: {
      action: 'Approved',
      comment,
      generateBill: Boolean(props.showGenerateBill && hasApproved),
      lineDecisions: out,
      lineComments,
    },
  }
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function updatePresetListPosition() {
  const el = presetBtnRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  presetListStyle.value = {
    position: 'fixed',
    left: `${Math.max(8, r.left)}px`,
    bottom: `${Math.max(8, window.innerHeight - r.top + 4)}px`,
    zIndex: 3200,
  }
}

function togglePresets() {
  showPresets.value = !showPresets.value
  if (showPresets.value) {
    nextTick(() => updatePresetListPosition())
  }
}

function onPresetReposition() {
  if (showPresets.value) updatePresetListPosition()
}

/**
 * 插入常用意见：行级弹层写 draft，批量整单写 comments
 * @param {string} text
 */
function insertPreset(text) {
  const clipped = text.slice(0, 200)
  if (commentEditorVisible.value) {
    draftLineComment.value = clipped
  } else {
    comments.value = clipped
  }
  showPresets.value = false
}

watch(showPresets, (open) => {
  if (open) {
    window.addEventListener('resize', onPresetReposition)
    window.addEventListener('scroll', onPresetReposition, true)
  } else {
    window.removeEventListener('resize', onPresetReposition)
    window.removeEventListener('scroll', onPresetReposition, true)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onPresetReposition)
  window.removeEventListener('scroll', onPresetReposition, true)
})

function handleConfirm() {
  if (showLineOps.value) {
    if (creditGateBlocked.value) {
      formError.value = creditGateHint.value
      return
    }
    const resolved = resolvePayloadFromLines()
    if (!resolved.ok) {
      formError.value = t(resolved.errorKey)
      return
    }
    formError.value = ''
    pendingPayload.value = resolved.payload
    submitConfirmVisible.value = true
    return
  }
  const errors = validateApprovalForm(selectedAction.value, comments.value)
  if (errors.action) {
    formError.value = tr(errors.action)
    return
  }
  if (errors.comment) {
    formError.value = tr(errors.comment)
    return
  }
  formError.value = ''
  pendingPayload.value = {
    action: selectedAction.value,
    comment: comments.value.trim(),
    generateBill:
      selectedAction.value === 'Approved' ? Boolean(props.showGenerateBill) : false,
    lineDecisions: undefined,
  }
  submitConfirmVisible.value = true
}

function confirmSubmit() {
  if (!pendingPayload.value) return
  submitConfirmVisible.value = false
  emit('confirm', pendingPayload.value)
  pendingPayload.value = null
}

function cancelSubmit() {
  submitConfirmVisible.value = false
  pendingPayload.value = null
}

/**
 * 课程分组展示：优先 sectionName，避免只传 section 码一律变成「分组名称01」
 * @param {object|null|undefined} item
 */
function sectionLabel(item) {
  if (!item) return '—'
  return (
    formatCourseSectionName(
      {
        sectionCode: item.sectionCode || item.section || '',
        sectionName: item.sectionName || '',
        code: item.sectionCode || item.section || '',
        name: item.sectionName || '',
      },
      t,
    ) || '—'
  )
}

/** @returns {{ label: string, tone: '' | 'open' | 'full' }} */
function seatCapacityDisplay(item) {
  const remRaw = Number(item?.remainingCapacity)
  const capRaw = Number(item?.capacity ?? item?.sectionCapacity)
  if (!Number.isFinite(capRaw) || capRaw <= 0) return { label: '—', tone: '' }
  const remaining = Number.isFinite(remRaw) && remRaw >= 0 ? Math.min(remRaw, capRaw) : null
  if (remaining == null) return { label: `—/${capRaw}`, tone: '' }
  return {
    label: `${remaining}/${capRaw}`,
    tone: remaining > 0 ? 'open' : 'full',
  }
}

function seatCapacityLabel(item) {
  return seatCapacityDisplay(item).label
}

function seatCapacityTone(item) {
  return seatCapacityDisplay(item).tone
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" :class="{ 'modal-panel--wide': showLineOps }" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ t('courseRegistration.approval.modalTitle') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p v-if="batchHint" class="batch-hint">{{ batchHint }}</p>

          <div v-if="liveTermCreditStrip" class="approval-credit-strip approval-credit-strip--sticky">
            <AddDropTermCreditStrip
              :strip="liveTermCreditStrip"
              :application-type="application?.type || ''"
            />
          </div>

          <div v-if="showLineOps" class="lines-summary">
            <div class="lines-summary-actions">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                :disabled="!hasSelectedLines"
                @click="applyDecisionToSelected('approved')"
              >
                {{ t('courseRegistration.approval.linePassAll') }}
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                :disabled="!hasSelectedLines"
                @click="applyDecisionToSelected('rejected')"
              >
                {{ t('courseRegistration.approval.lineFailAll') }}
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                :disabled="!hasSelectedLines"
                @click="applyDecisionToSelected('update_required')"
              >
                {{ t('courseRegistration.approval.lineReturnAll') }}
              </button>
            </div>
            <div class="lines-table-wrap">
              <table class="lines-table">
                <thead>
                  <tr>
                    <th class="col-check">
                      <input
                        type="checkbox"
                        :checked="allSelected"
                        :disabled="!summaryItems.length"
                        :aria-label="t('courseRegistration.approval.lineSelectAll')"
                        @change="toggleSelectAll($event.target.checked)"
                      />
                    </th>
                    <th class="col-index">{{ t('common.serialNo') }}</th>
                    <th class="col-app-type">{{ t('courseRegistration.approval.typeLabel') }}</th>
                    <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                    <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                    <th class="col-course-type">{{ t('courseRegistration.courses.type') }}</th>
                    <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                    <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                    <th class="col-week">{{ t('courseRegistration.student.fieldWeekRange') }}</th>
                    <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
                    <th class="col-lecturer">{{ t('courseRegistration.student.fieldLecturers') }}</th>
                    <th class="col-seats">{{ t('courseRegistration.student.pickerSeatCapacityHeader') }}</th>
                    <th class="col-op">{{ t('courseRegistration.approval.lineDecision') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in summaryItems" :key="itemKey(item, idx)">
                    <td class="col-check">
                      <input
                        type="checkbox"
                        :checked="!!selectedKeysMap[itemKey(item, idx)]"
                        @change="toggleRowSelected(itemKey(item, idx), $event.target.checked)"
                      />
                    </td>
                    <td class="col-index">{{ idx + 1 }}</td>
                    <td class="col-app-type" :title="actionTypeLabel(item.action)">{{ actionTypeLabel(item.action) }}</td>
                    <td class="col-code" :title="item.courseCode || ''">{{ item.courseCode || '—' }}</td>
                    <td class="col-name" :title="itemCourseName(item)">{{ itemCourseName(item) }}</td>
                    <td class="col-course-type" :title="itemCourseTypeLabel(item)">{{ itemCourseTypeLabel(item) }}</td>
                    <td class="col-credits">{{ item.credits ?? '—' }}</td>
                    <td class="col-group" :title="sectionLabel(item)">{{ sectionLabel(item) }}</td>
                    <td class="col-week" :title="itemWeekRange(item)">{{ itemWeekRange(item) }}</td>
                    <td class="cr-time-venue" :title="itemTimeVenueText(item)">
                      <template v-if="itemTimeVenueLines(item).length">
                        <div
                          v-for="(tv, li) in itemTimeVenueLines(item)"
                          :key="li"
                          class="cr-time-venue-line"
                          :title="tv"
                        >
                          {{ tv }}
                        </div>
                      </template>
                      <template v-else>—</template>
                    </td>
                    <td class="col-lecturer" :title="itemLecturer(item)">{{ itemLecturer(item) }}</td>
                    <td class="col-seats" :title="seatCapacityLabel(item)">
                      <span class="seat-status" :class="seatCapacityTone(item)">
                        {{ seatCapacityLabel(item) }}
                      </span>
                    </td>
                    <td class="col-op op-cell">
                      <div class="line-op-wrap">
                        <div class="radio-group line-op-radios">
                          <label
                            v-for="opt in LINE_ACTION_OPTIONS"
                            :key="opt.value"
                            class="radio-item"
                          >
                            <input
                              type="radio"
                              :name="'line-op-' + itemKey(item, idx)"
                              :value="opt.value"
                              :checked="lineDecisionsMap[itemKey(item, idx)] === opt.value"
                              @change="setLineDecision(itemKey(item, idx), opt.value)"
                            />
                            <span>{{ t(opt.labelKey) }}</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          class="line-comment-btn"
                          :class="{ 'has-comment': hasLineComment(itemKey(item, idx)) }"
                          @click="openLineCommentEditor(itemKey(item, idx))"
                        >
                          {{ lineCommentButtonLabel(itemKey(item, idx)) }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="showSharedComments" class="form-table" :class="{ 'form-table--after-lines': showLineOps }">
            <div v-if="showWholeForm" class="form-row">
              <div class="form-label">{{ tr('Action') }}</div>
              <div class="form-value">
                <div class="radio-group">
                  <label v-for="opt in approvalActionOptions" :key="opt" class="radio-item">
                    <input v-model="selectedAction" type="radio" :value="opt" />
                    <span>{{ getApprovalActionLabel(opt, t) }}</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">{{ tr('Comments') }}</div>
              <div class="form-value">
                <div class="comments-box">
                  <textarea
                    v-model="comments"
                    class="comments-input"
                    maxlength="200"
                    rows="5"
                    :placeholder="t('common.pleaseInput')"
                  />
                  <div class="comments-footer">
                    <div class="presets-wrap">
                      <button
                        ref="presetBtnRef"
                        type="button"
                        class="preset-btn"
                        @click="togglePresets"
                      >
                        {{ tr('Common Comments') }}
                      </button>
                      <Teleport to="body">
                        <div
                          v-if="showPresets"
                          class="add-drop-approval-preset-list"
                          :style="presetListStyle"
                        >
                          <button
                            v-for="(preset, index) in commonApprovalComments"
                            :key="index"
                            type="button"
                            class="add-drop-approval-preset-item"
                            @click="insertPreset(preset)"
                          >
                            {{ tr(preset) }}
                          </button>
                        </div>
                      </Teleport>
                    </div>
                    <span class="char-count">{{ comments.length }}/200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>
        </div>

        <div class="modal-footer">
          <p v-if="creditGateBlocked" class="credit-gate-hint">{{ creditGateHint }}</p>
          <div class="modal-footer-actions">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="creditGateBlocked"
              @click="handleConfirm"
            >
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 行级评价意见二级弹层（复用 Comments 壳） -->
  <Teleport to="body">
    <div
      v-if="commentEditorVisible"
      class="line-comment-overlay"
      @click.self="closeLineCommentEditor"
    >
      <div class="line-comment-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title">{{ t('courseRegistration.approval.lineCommentModalTitle') }}</h3>
          <button type="button" class="modal-close" @click="closeLineCommentEditor">×</button>
        </div>
        <div class="modal-body">
          <div class="form-table">
            <div class="form-row">
              <div class="form-label">{{ tr('Comments') }}</div>
              <div class="form-value">
                <div class="comments-box">
                  <textarea
                    v-model="draftLineComment"
                    class="comments-input"
                    maxlength="200"
                    rows="5"
                    :placeholder="t('courseRegistration.approval.lineCommentPlaceholder')"
                  />
                  <div class="comments-footer">
                    <div class="presets-wrap">
                      <button
                        ref="presetBtnRef"
                        type="button"
                        class="preset-btn"
                        @click="togglePresets"
                      >
                        {{ tr('Common Comments') }}
                      </button>
                      <Teleport to="body">
                        <div
                          v-if="showPresets && commentEditorVisible"
                          class="add-drop-approval-preset-list"
                          :style="presetListStyle"
                        >
                          <button
                            v-for="(preset, index) in commonApprovalComments"
                            :key="index"
                            type="button"
                            class="add-drop-approval-preset-item"
                            @click="insertPreset(preset)"
                          >
                            {{ tr(preset) }}
                          </button>
                        </div>
                      </Teleport>
                    </div>
                    <span class="char-count">{{ draftLineComment.length }}/200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="closeLineCommentEditor">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="saveLineCommentEditor">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <ConfirmDialog
    :visible="submitConfirmVisible"
    :title="tr('Submit Confirmation')"
    :message="submitConfirmMessage"
    :confirm-text="t('common.confirm')"
    confirm-variant="primary"
    :z-index="1600"
    @confirm="confirmSubmit"
    @cancel="cancelSubmit"
  />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1400;
  padding: 24px;
}

.line-comment-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1550;
  padding: 24px;
}

.line-comment-panel {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-panel {
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-panel--wide {
  max-width: min(1400px, 98vw);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.batch-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #2563eb;
}

.approval-credit-strip {
  margin: 0 0 16px;
}

.approval-credit-strip--sticky {
  position: sticky;
  top: 0;
  z-index: 5;
  margin: -4px 0 16px;
  padding: 8px 0 10px;
  background: #fff;
  box-shadow: 0 6px 10px -8px rgba(15, 23, 42, 0.35);
}

.lines-summary {
  margin-bottom: 16px;
}

.lines-summary-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.lines-table-wrap {
  overflow-x: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.lines-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 11px;
}

.lines-table th,
.lines-table td {
  padding: 5px 6px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lines-table th.col-seats,
.lines-table th.col-course-type,
.lines-table th.col-app-type,
.lines-table th.col-op,
.lines-table td.col-op,
.lines-table td.op-cell {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

.lines-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.lines-table tbody tr:last-child td {
  border-bottom: none;
}

.col-check {
  width: 28px;
  text-align: center;
  padding-left: 4px;
  padding-right: 2px;
}

.col-index {
  width: 2.6em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: #6b7280;
}

.col-app-type {
  width: 7.5em;
  white-space: nowrap;
}

.col-course-type {
  width: 6.5em;
  min-width: 5.5em;
  white-space: nowrap;
}

.col-code {
  width: 6em;
  white-space: nowrap;
}

.col-name {
  width: 10%;
  max-width: none;
  white-space: nowrap;
}

.col-credits {
  width: 3em;
  white-space: nowrap;
  text-align: center;
}

.col-group {
  width: 7em;
  max-width: none;
  white-space: nowrap;
}

.col-week {
  width: 4.5em;
  white-space: nowrap;
}

.col-time {
  width: 22%;
  max-width: none;
}

.col-lecturer {
  width: 9em;
  max-width: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-seats {
  width: 9.5em;
  min-width: 9em;
  white-space: nowrap;
  text-align: center;
  overflow: visible;
  text-overflow: clip;
}

.seat-status {
  display: inline-block;
  white-space: nowrap;
  line-height: 1.3;
}

.seat-status.open {
  color: #15803d;
}

.seat-status.full {
  color: #b91c1c;
}

.col-op,
.op-cell {
  width: 22%;
  min-width: 14em;
  white-space: normal;
  vertical-align: middle;
  overflow: visible;
  text-overflow: clip;
  padding-right: 8px;
}

.line-op-wrap {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

.line-comment-btn {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  color: #2563eb;
  cursor: pointer;
  white-space: nowrap;
}

.line-comment-btn:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.line-comment-btn.has-comment {
  color: #0f766e;
}

.cr-time-venue {
  line-height: 1.3;
  max-width: none;
}

.cr-time-venue-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 1px;
}

.radio-group.line-op-radios {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 4px 8px;
  white-space: normal;
}

.radio-group.line-op-radios .radio-item {
  flex-shrink: 0;
  font-size: 12px;
  gap: 4px;
  white-space: nowrap;
}

.form-table {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.form-table--after-lines {
  margin-top: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  border-bottom: 1px solid #e5e7eb;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  padding: 14px 16px;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  display: flex;
  align-items: flex-start;
}

.form-value {
  padding: 14px 16px;
  background: #fff;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}

.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.bill-option-value {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.bill-option-hint {
  margin: 0;
  max-width: 420px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
}

.comments-box {
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
}

.comments-input {
  width: 100%;
  min-height: 120px;
  padding: 10px 12px 36px;
  border: none;
  resize: vertical;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
}

.comments-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 8px;
}

.presets-wrap {
  position: relative;
}

.preset-btn {
  padding: 2px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
}

.form-error {
  margin: 12px 0 0;
  font-size: 13px;
  color: #dc2626;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.credit-gate-hint {
  margin: 0;
  margin-right: auto;
  font-size: 13px;
  color: #dc2626;
  line-height: 1.35;
}

.modal-footer-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-sm {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.btn-sm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-sm.active {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.btn-outline {
  border-color: #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}
</style>

<style>
/* Teleport 到 body，不受 modal-body / form-table overflow 裁切 */
.add-drop-approval-preset-list {
  min-width: 280px;
  max-width: 420px;
  max-height: min(320px, calc(100vh - 24px));
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  box-sizing: border-box;
}

.add-drop-approval-preset-item {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  text-align: left;
  font-size: 12px;
  line-height: 1.45;
  color: #374151;
  cursor: pointer;
  box-sizing: border-box;
  white-space: normal;
  word-break: break-word;
}

.add-drop-approval-preset-item:hover {
  background: #f3f4f6;
}
</style>
