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
  approvalDecisionCountsTowardCreditStrip,
  buildApprovalDecisionTermCreditStrip,
  buildFixedSituationCatchUpFromApplication,
  hasRejectedOrReturnedDropDecision,
  normalizeAddDropLineAction,
  summarizeApprovalCatchUpSoftExcess,
  summarizeApprovalDropRejectScheduleConflicts,
  summarizeApprovalStripCreditViolations,
  validateApprovalLineDecisionsMap,
} from '../../data/courseRegistration/addDropMultiItems.js'
import { saveAddDropApprovalDraft } from '../../data/courseRegistration/addDropApprovalQueue.js'
import {
  addDropTypeLabelKey,
  addDropLineActionTagClass,
} from '../../data/courseRegistration/addDropTypeDisplay.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { displayClassTimeVenueFromFields } from '../../data/courseRegistration/sectionScheduleFields.js'
import {
  resolveCourseDisplayName,
  getCourseById,
  getCourseByCode,
} from '../../data/courseRegistration/selectableCourses.js'
import { formatUnifiedCourseCategoryFromLine } from '../../data/courseRegistration/unifiedCourseCategory.js'
import {
  buildAddDropApplicationSchedulePreview,
  listMyResultCourses,
} from '../../data/courseRegistration/studentMyResultCourses.js'
import { getCurrentStudent } from '../../data/mockCurrentStudent.js'
import { formatSchedulePersonLine } from '../../utils/formatSchedulePersonLine.js'
import AddDropTermCreditStrip from './AddDropTermCreditStrip.vue'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import StudentSchedulePreviewPanel from './StudentSchedulePreviewPanel.vue'

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
/** 增量 ay：锁定行打开意见时只读 */
const commentEditorReadonly = ref(false)
/** 打开时行决策/意见快照；取消有改动才问存草稿 */
const approvalBaselineSnapshot = ref('')
const draftSavePromptVisible = ref(false)
/** 门控拦截后强制重绑 radio，避免原生选中与 map 不一致 */
const decisionRadioSyncKey = ref(0)
/**
 * 增量 ay：打开时已是通过/不通过的行锁定（key → true）
 * @type {import('vue').Ref<Record<string, boolean>>}
 */
const lockedDecisionKeys = ref({})

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

/**
 * 顶部学分要求：通过+待定计入；不通过/驳回不计
 * 增量 ap：显式读出每个决策值 + 同步键，保证点选后矩阵必刷新
 */
const liveTermCreditStrip = computed(() => {
  if (!showLineOps.value || !props.application) return null
  const decisions = lineDecisionsMap.value
  void decisionRadioSyncKey.value
  // 逐键读取，避免仅依赖对象引用时漏触发
  const snapshot = {}
  for (const key of Object.keys(decisions || {})) {
    snapshot[key] = decisions[key]
  }
  return buildApprovalDecisionTermCreditStrip(props.application, snapshot)
})

/** 蓝底 tip：申请基线固定落下，不随行决策变（增量 ah：矩阵未修行跟 live strip） */
const situationCatchUpDisplay = computed(() =>
  props.application ? buildFixedSituationCatchUpFromApplication(props.application) : null,
)

/** 增量 bf：单条审批展示学生附件材料（空也展示） */
const showAttachmentsSection = computed(
  () => Boolean(props.application) && props.targetCount <= 1,
)

/** 增量 bg：附件节标题仅「附件材料」，无 SECTION 前缀 */
const attachmentSectionTitle = computed(() =>
  t('courseRegistration.student.sectionLabelAttachments'),
)

/** 规范化附件列表（{ fileName, size }） */
const attachmentFiles = computed(() => {
  const list = Array.isArray(props.application?.attachments) ? props.application.attachments : []
  return list
    .filter((f) => f?.name)
    .map((f) => ({ fileName: f.name, size: Number(f.size) || 0 }))
})

/**
 * 格式化附件大小
 * @param {number} bytes
 */
function formatAttachSize(bytes) {
  const n = Number(bytes) || 0
  if (n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/** 增量 bg：课程预览抽屉 */
const schedulePreviewVisible = ref(false)

/**
 * 按当前行决策取预览有效行（通过/待定计入；不通过/驳回不计）
 * @param {'Drop'|'Add'|'Retake'} action
 */
function approvalPreviewLinesByAction(action) {
  const items = summaryItems.value || []
  const decisions = lineDecisionsMap.value || {}
  void decisionRadioSyncKey.value
  return items.filter((item, idx) => {
    if (normalizeAddDropLineAction(item?.action) !== action) return false
    const key = itemKey(item, idx)
    const decision = decisions[key] || item?.lineDecision || 'pending'
    return approvalDecisionCountsTowardCreditStrip(decision)
  })
}

/** 审批课程预览：投影跟当前 radio */
const approvalSchedulePreviewSlots = computed(() => {
  if (!props.application) {
    return buildAddDropApplicationSchedulePreview({
      baseCourses: listMyResultCourses(),
      locale: isZh.value ? 'zh' : 'en',
    })
  }
  const dropCourses = approvalPreviewLinesByAction('Drop')
  const addCourses = approvalPreviewLinesByAction('Add')
  const retakeCourses = approvalPreviewLinesByAction('Retake')
  return buildAddDropApplicationSchedulePreview({
    baseCourses: listMyResultCourses(props.application.studentId),
    dropCourses,
    addCourses,
    retakeCourses,
    locale: isZh.value ? 'zh' : 'en',
  })
})

/** 预览抽屉学号姓名（申请学生） */
const approvalSchedulePersonLine = computed(() => {
  const app = props.application
  if (app?.studentId || app?.studentName) {
    return formatSchedulePersonLine(app.studentId || '', app.studentName || '')
  }
  const student = getCurrentStudent()
  const basic = student?.basicInfo || {}
  return formatSchedulePersonLine(
    basic.studentId,
    basic.fullName || basic.chineseName || '',
  )
})

/** 打开课程预览 */
function openSchedulePreview() {
  schedulePreviewVisible.value = true
}

/**
 * GE/ME 超「学期要求+因修未修」→ 确认置灰 + 左侧提示
 * 与学生申请硬拦同源；条上相对学期要求发红不单独阻断
 */
const creditGate = computed(() =>
  summarizeApprovalStripCreditViolations(
    liveTermCreditStrip.value,
    situationCatchUpDisplay.value,
  ),
)

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

/**
 * 增量 ar/bh：否/驳退课后已选 > 学期+因修（含必修）→ 左下角软提示（不禁选）
 * 与冲突提示同源：按 itemKey 快照 live 决策
 */
const dropRejectCatchUpSoftHint = computed(() => {
  if (!showLineOps.value || !props.application) return ''
  void decisionRadioSyncKey.value
  const live = lineDecisionsMap.value || {}
  /** @type {Record<string, string>} */
  const decisions = {}
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    decisions[key] = live[key] || 'pending'
  }
  if (!hasRejectedOrReturnedDropDecision(props.application, decisions)) return ''
  const soft = summarizeApprovalCatchUpSoftExcess(
    liveTermCreditStrip.value,
    situationCatchUpDisplay.value,
  )
  if (!soft.over) return ''
  return t('courseRegistration.approval.dropRejectAffectsAddRetakeHint')
})

/**
 * 增量 bd/bh：不同意退课（仅 rejected）恢复后与加/重修时段冲突 → 左下提示
 * 按当前弹窗 itemKey 快照 live 决策，避免回落申请 items 陈旧 lineDecision
 */
const dropRejectScheduleConflictHint = computed(() => {
  if (!showLineOps.value || !props.application) return ''
  void decisionRadioSyncKey.value
  const live = lineDecisionsMap.value || {}
  /** @type {Record<string, string>} */
  const decisions = {}
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    // 逐键读取，保证跟手
    decisions[key] = live[key] || 'pending'
  }
  // 增量 bj：传入锁定行，退课已锁时话术以加课/重修为问题点
  const result = summarizeApprovalDropRejectScheduleConflicts(props.application, decisions, {
    lockedDecisionKeys: lockedDecisionKeys.value || {},
  })
  if (!result.conflict) return ''
  return t(
    result.errorKey || 'courseRegistration.approval.dropRejectScheduleConflictHint',
    result.errorParams || {},
  )
})

/**
 * 增量 as/bd：软提示、课表冲突或 GE/ME 硬门控任一成立 → 确定置灰（radio 仍可选）
 */
const confirmBlocked = computed(
  () =>
    creditGateBlocked.value ||
    Boolean(dropRejectCatchUpSoftHint.value) ||
    Boolean(dropRejectScheduleConflictHint.value),
)

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

/** 行申请类型胶囊 class（增量 bi） */
function actionTypeTagClass(action) {
  return addDropLineActionTagClass(action)
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
 * 是否学生驳回后重新提交再审（增量 az：仅此时锁定通过/不通过）
 * @param {object|null|undefined} app
 */
function isPostStudentResubmit(app) {
  return (app?.approvalLog || []).some(
    (entry) => String(entry?.action || '').trim() === 'Resubmitted',
  )
}

/**
 * 行是否锁定（打开时已是通过/不通过/已驳回，且仅学生重提后再审）
 * @param {string} key
 */
function isLineDecisionLocked(key) {
  return Boolean(lockedDecisionKeys.value[key])
}

/**
 * 打开弹窗时初始化行决策与行意见（含已存审批草稿回显）
 */
function initLineDecisions() {
  const map = {}
  const commentsMap = {}
  const sel = {}
  const locked = {}
  // 增量 az：草稿再开不锁；仅 Resubmitted 后再审才锁
  const lockSettledLines = isPostStudentResubmit(props.application)
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    const d = String(item.lineDecision || '').trim()
    // 回显通过/不通过/驳回
    if (d === 'approved' || d === 'rejected' || d === 'update_required') {
      map[key] = d
    } else if (d === 'pending' && lockSettledLines) {
      // 增量 bb：学生重提后的 pending（原驳回换课）默认上次老师操作「驳回」
      map[key] = 'update_required'
    } else {
      // 全新待审或缺省：默认通过
      map[key] = 'approved'
    }
    // 增量 br：学生未改的已驳回行也锁定，老师仍见「已驳回」
    if (lockSettledLines && (d === 'approved' || d === 'rejected' || d === 'update_required')) {
      locked[key] = true
      sel[key] = false
    } else {
      sel[key] = true
    }
    // 回填已有行意见（含原驳回意见）
    commentsMap[key] = String(item.lineComment || '').trim()
  }
  lineDecisionsMap.value = map
  lineCommentsMap.value = commentsMap
  selectedKeysMap.value = sel
  lockedDecisionKeys.value = locked
  commentEditorVisible.value = false
  commentEditorKey.value = ''
  draftLineComment.value = ''
  captureApprovalBaseline()
}

/**
 * 行决策/意见快照（用于取消脏检查）
 */
function snapshotApprovalDraftState() {
  return JSON.stringify({
    decisions: lineDecisionsMap.value,
    lineComments: lineCommentsMap.value,
  })
}

/** 记录打开时 baseline */
function captureApprovalBaseline() {
  approvalBaselineSnapshot.value = snapshotApprovalDraftState()
}

/** 相对打开快照是否有改动 */
function isApprovalDraftDirty() {
  if (!showLineOps.value || !props.application?.id) return false
  return snapshotApprovalDraftState() !== approvalBaselineSnapshot.value
}

/** 关窗（不存草稿） */
function discardAndClose() {
  draftSavePromptVisible.value = false
  approvalBaselineSnapshot.value = ''
  schedulePreviewVisible.value = false
  emit('close')
}

/**
 * 确认存入审批草稿并关窗
 */
function confirmSaveApprovalDraft() {
  const id = props.application?.id
  if (id) {
    saveAddDropApprovalDraft(id, {
      lineDecisions: { ...lineDecisionsMap.value },
      lineComments: { ...lineCommentsMap.value },
    })
  }
  discardAndClose()
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      showPresets.value = false
      draftSavePromptVisible.value = false
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
    draftSavePromptVisible.value = false
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
  // 增量 ay：锁定行可查看意见，不可改
  commentEditorReadonly.value = isLineDecisionLocked(key)
  showPresets.value = false
  formError.value = ''
  commentEditorVisible.value = true
}

/** 关闭行意见弹层（不保存） */
function closeLineCommentEditor() {
  commentEditorVisible.value = false
  commentEditorKey.value = ''
  draftLineComment.value = ''
  commentEditorReadonly.value = false
  showPresets.value = false
}

/** 确认写入当前行意见 */
function saveLineCommentEditor() {
  if (commentEditorReadonly.value) {
    closeLineCommentEditor()
    return
  }
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

/**
 * 学分超限门控提示文案（GE/ME 学期学分标签）
 * @param {('geTerm'|'meTerm')[]} keys
 */
function formatCreditViolationLabels(keys) {
  const labelMap = {
    geTerm: t('courseRegistration.approval.creditLabelGeTerm'),
    meTerm: t('courseRegistration.approval.creditLabelMeTerm'),
  }
  return (keys || []).map((k) => labelMap[k] || k).join('、')
}

/**
 * 依赖门控 B：拟议决策若相对当前决策新引入/加重 GE/ME 超限则禁止
 * @param {Record<string, string>} nextMap
 * @returns {boolean} true=已应用；false=被拦
 */
function tryApplyLineDecisionsMap(nextMap) {
  const previousMap = { ...lineDecisionsMap.value }
  const check = validateApprovalLineDecisionsMap(props.application, nextMap, previousMap)
  if (!check.ok) {
    const labels = formatCreditViolationLabels(check.keys)
    formError.value = t('courseRegistration.approval.dropRejectBlockedByAddCredit', { labels })
    // 强制重渲染 radio，回滚到 map 中的选中态
    decisionRadioSyncKey.value += 1
    return false
  }
  formError.value = ''
  lineDecisionsMap.value = { ...nextMap }
  // 成功也递增：驱动学分条 computed 与受控 radio 同步
  decisionRadioSyncKey.value += 1
  return true
}

/**
 * 单行决策变更（含门控 B）
 * 增量 ap：由受控 radio click 调用；退课否/驳→已选回升，加/重修否/驳→已选不加
 * @param {string} key
 * @param {string} decision approved|rejected|update_required
 */
function setLineDecision(key, decision) {
  if (!key || !decision) return
  // 增量 ay：锁定行不可改
  if (isLineDecisionLocked(key)) return
  if (lineDecisionsMap.value[key] === decision) return
  const next = { ...lineDecisionsMap.value, [key]: decision }
  tryApplyLineDecisionsMap(next)
}

function toggleRowSelected(key, checked) {
  if (isLineDecisionLocked(key)) return
  selectedKeysMap.value = { ...selectedKeysMap.value, [key]: checked }
}

function toggleSelectAll(checked) {
  if (!summaryItems.value.length) return
  const sel = { ...selectedKeysMap.value }
  for (const [idx, item] of summaryItems.value.entries()) {
    const key = itemKey(item, idx)
    // 锁定行不参与批量勾选
    if (isLineDecisionLocked(key)) {
      sel[key] = false
      continue
    }
    sel[key] = checked
  }
  selectedKeysMap.value = sel
}

/**
 * 批量写入勾选行决策（含门控 B）
 * @param {string} decision approved|rejected|update_required
 */
function applyDecisionToSelected(decision) {
  if (!hasSelectedLines.value) {
    formError.value = t('courseRegistration.approval.lineSelectRequired')
    return
  }
  const map = { ...lineDecisionsMap.value }
  for (const key of selectedKeyList.value) {
    if (isLineDecisionLocked(key)) continue
    map[key] = decision
  }
  tryApplyLineDecisionsMap(map)
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
  // 增量 aa：允许驳回与通过/不通过混选；有驳回行则整单走 Update Required → 已驳回
  const anyUpdate = entries.some((e) => e.decision === 'update_required')
  // 增量：评价意见选填；不通过/驳回意见为空不拦提交（有填仍写回 lineComment）
  const comment = buildAggregatedComment(entries)
  const lineComments = buildLineCommentsPayload(entries)
  if (anyUpdate) {
    // 写回各行真实决策（通过 / 不通过 / 驳回）
    const out = {}
    for (const e of entries) {
      out[e.idx] = e.decision
      out[e.key] = e.decision
    }
    return {
      ok: true,
      payload: {
        action: 'Update Required',
        comment,
        generateBill: false,
        lineDecisions: out,
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
  // 仅通过 / 不通过 → 已结束（Approved 或部分通过）
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

/**
 * 取消/关闭：有行决策改动才问存草稿；无改动直接关
 */
function handleClose() {
  if (isApprovalDraftDirty()) {
    draftSavePromptVisible.value = true
    return
  }
  discardAndClose()
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
    // 硬门控优先；否则软提示阻断（必修等超学期+因修）
    if (creditGateBlocked.value) {
      formError.value = creditGateHint.value
      return
    }
    if (dropRejectCatchUpSoftHint.value) {
      formError.value = dropRejectCatchUpSoftHint.value
      return
    }
    if (dropRejectScheduleConflictHint.value) {
      formError.value = dropRejectScheduleConflictHint.value
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

          <!-- 学分要求钉在上方，不随课程表滚动 -->
          <div v-if="liveTermCreditStrip" class="approval-credit-strip approval-credit-strip--pin">
            <AddDropTermCreditStrip
              :key="'approval-strip-' + decisionRadioSyncKey"
              :strip="liveTermCreditStrip"
              :term-catch-up-credits="situationCatchUpDisplay"
              :application-type="application?.type || ''"
            />
          </div>

          <div class="modal-body__scroll">
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
                    <th class="col-line-comment">{{ t('courseRegistration.approval.lineCommentColumn') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, idx) in summaryItems"
                    :key="itemKey(item, idx)"
                    :class="{ 'is-decision-locked': isLineDecisionLocked(itemKey(item, idx)) }"
                  >
                    <td class="col-check">
                      <input
                        type="checkbox"
                        :checked="!!selectedKeysMap[itemKey(item, idx)]"
                        :disabled="isLineDecisionLocked(itemKey(item, idx))"
                        @change="toggleRowSelected(itemKey(item, idx), $event.target.checked)"
                      />
                    </td>
                    <td class="col-index">{{ idx + 1 }}</td>
                    <td class="col-app-type" :title="actionTypeLabel(item.action)">
                      <span class="type-tag" :class="actionTypeTagClass(item.action)">
                        {{ actionTypeLabel(item.action) }}
                      </span>
                    </td>
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
                      <div
                        class="radio-group line-op-radios"
                        :key="'ops-' + decisionRadioSyncKey + '-' + itemKey(item, idx)"
                      >
                        <label
                          v-for="opt in LINE_ACTION_OPTIONS"
                          :key="opt.value"
                          class="radio-item"
                          :class="{ 'is-locked': isLineDecisionLocked(itemKey(item, idx)) }"
                        >
                          <input
                            type="radio"
                            :name="'line-op-' + decisionRadioSyncKey + '-' + itemKey(item, idx)"
                            :value="opt.value"
                            :checked="lineDecisionsMap[itemKey(item, idx)] === opt.value"
                            :disabled="isLineDecisionLocked(itemKey(item, idx))"
                            @click.stop.prevent="setLineDecision(itemKey(item, idx), opt.value)"
                          />
                          <span>{{ t(opt.labelKey) }}</span>
                        </label>
                      </div>
                    </td>
                    <td class="col-line-comment">
                      <button
                        type="button"
                        class="line-comment-btn"
                        :class="{ 'has-comment': hasLineComment(itemKey(item, idx)) }"
                        @click="openLineCommentEditor(itemKey(item, idx))"
                      >
                        {{
                          isLineDecisionLocked(itemKey(item, idx))
                            ? hasLineComment(itemKey(item, idx))
                              ? t('courseRegistration.approval.lineCommentDetail')
                              : '—'
                            : lineCommentButtonLabel(itemKey(item, idx))
                        }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 增量 bf：课程表下学生附件材料（只读） -->
          <section v-if="showAttachmentsSection" class="approval-attachments">
            <div class="section-bar">{{ attachmentSectionTitle }}</div>
            <div class="attachment-panel">
              <div class="attachment-header">
                <label class="attachment-label">
                  {{ t('courseRegistration.student.dropAttachment') }}
                  <span class="optional">（{{ t('courseRegistration.student.dropAttachmentOptional') }}）</span>
                </label>
              </div>
              <ul v-if="attachmentFiles.length" class="detail-attach-list">
                <li
                  v-for="(file, idx) in attachmentFiles"
                  :key="`approval-att-${file.fileName}-${idx}`"
                  class="detail-attach-item"
                >
                  <AttachmentPreviewTrigger
                    :file-name="file.fileName"
                    :file-meta="file"
                    :download-label="file.fileName"
                    :show-download="true"
                  />
                  <span v-if="formatAttachSize(file.size)" class="detail-attach-size">
                    {{ formatAttachSize(file.size) }}
                  </span>
                </li>
              </ul>
              <div v-else class="attachment-file-row">
                <span>{{ t('courseRegistration.approval.attachmentNone') }}</span>
              </div>
            </div>
          </section>

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
        </div>

        <div class="modal-footer">
          <button
            v-if="showLineOps"
            type="button"
            class="btn btn-default approval-preview-btn"
            @click="openSchedulePreview"
          >
            {{ t('courseRegistration.student.applicationSchedulePreviewButton') }}
          </button>
          <div class="modal-footer-hints">
            <p v-if="dropRejectScheduleConflictHint" class="credit-soft-hint">
              {{ dropRejectScheduleConflictHint }}
            </p>
            <p v-if="dropRejectCatchUpSoftHint" class="credit-soft-hint">{{ dropRejectCatchUpSoftHint }}</p>
            <p v-if="creditGateBlocked" class="credit-gate-hint">{{ creditGateHint }}</p>
          </div>
          <div class="modal-footer-actions">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="confirmBlocked"
              @click="handleConfirm"
            >
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 增量 bg：课程预览（投影跟当前行决策） -->
    <ApplicationDetailDrawer
      :visible="schedulePreviewVisible"
      :title="t('courseRegistration.student.applicationSchedulePreviewTitle')"
      :person-line="approvalSchedulePersonLine"
      elevate
      :overlay-z-index="1500"
      @close="schedulePreviewVisible = false"
    >
      <StudentSchedulePreviewPanel
        embedded
        legend-mode="addDropPreview"
        :schedule="approvalSchedulePreviewSlots"
      />
      <template #footer>
        <div class="application-schedule-preview-footer">
          <p class="application-schedule-preview-footer__tip" role="note">
            <span class="application-schedule-preview-footer__badge">{{
              t('courseRegistration.student.scheduleUntimedTipBadge')
            }}</span>
            <span class="application-schedule-preview-footer__text">{{
              t('courseRegistration.student.applicationSchedulePreviewFooterHint')
            }}</span>
          </p>
          <button
            type="button"
            class="btn btn-primary"
            @click="schedulePreviewVisible = false"
          >
            {{ t('common.close') }}
          </button>
        </div>
      </template>
    </ApplicationDetailDrawer>
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
                    :readonly="commentEditorReadonly"
                    :placeholder="t('courseRegistration.approval.lineCommentPlaceholder')"
                  />
                  <div v-if="!commentEditorReadonly" class="comments-footer">
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
            {{ commentEditorReadonly ? t('common.close') : t('common.cancel') }}
          </button>
          <button
            v-if="!commentEditorReadonly"
            type="button"
            class="btn btn-primary"
            @click="saveLineCommentEditor"
          >
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

  <!-- 审批取消：有改动才问是否存草稿 -->
  <ConfirmDialog
    :visible="draftSavePromptVisible"
    :title="t('courseRegistration.approval.draftSaveConfirmTitle')"
    :message="t('courseRegistration.approval.draftSaveConfirmMessage')"
    :confirm-text="t('courseRegistration.approval.draftSaveConfirmYes')"
    :cancel-text="t('courseRegistration.approval.draftSaveConfirmNo')"
    confirm-variant="primary"
    :z-index="1650"
    @confirm="confirmSaveApprovalDraft"
    @cancel="discardAndClose"
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
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 24px;
}

.batch-hint {
  flex-shrink: 0;
  margin: 0 0 12px;
  font-size: 13px;
  color: #2563eb;
}

.approval-credit-strip {
  margin: 0 0 12px;
}

/* 学分要求上钉：不滚，避免 sticky 透出操作钮 */
.approval-credit-strip--pin {
  flex-shrink: 0;
  margin: 0 0 12px;
  padding: 0 0 8px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.modal-body__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
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
  /* 增量 ac：短列表头完整优先，不足时横滚，勿裁表头 */
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.lines-table {
  width: 100%;
  min-width: 1100px;
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
}

/* 单元格内容可省略；表头禁止 ellipsis 缩写 */
.lines-table td {
  overflow: hidden;
  text-overflow: ellipsis;
}

.lines-table th.col-seats,
.lines-table th.col-course-type,
.lines-table th.col-app-type,
.lines-table th.col-op,
.lines-table td.col-op,
.lines-table td.op-cell,
.lines-table th.col-line-comment,
.lines-table td.col-line-comment {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
  /* 低于 sticky 学分条，避免滚动时操作钮透出 */
  position: relative;
  z-index: 0;
}

.lines-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
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
  width: 3.2em;
  min-width: 3.2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: #6b7280;
}

.col-app-type {
  width: 5.5em;
  min-width: 5em;
  white-space: nowrap;
}

/* 增量 bi：申请类型三色胶囊（与详情同源） */
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.type-add { background: #dbeafe; color: #1d4ed8; }
.type-drop { background: #fee2e2; color: #b91c1c; }
.type-retake { background: #fef3c7; color: #b45309; }

.col-course-type {
  width: 5em;
  min-width: 4.5em;
  white-space: nowrap;
}

.col-code {
  width: 7em;
  min-width: 6.5em;
  white-space: nowrap;
}

.col-name {
  width: 10%;
  max-width: none;
  white-space: nowrap;
}

.col-credits {
  width: 3.5em;
  min-width: 3.5em;
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
  min-width: 4em;
  white-space: nowrap;
}

.col-time {
  width: 22%;
  max-width: none;
}

/* 任课教师：加宽左移，尽量全文少缩写（与详情对齐） */
.col-lecturer {
  width: 12em;
  min-width: 10em;
  max-width: none;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  text-align: left;
  word-break: break-word;
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
  /* 增量 as：加宽操作列，容纳三 radio 单行 */
  width: 18em;
  min-width: 16em;
  white-space: nowrap;
  vertical-align: middle;
  overflow: visible;
  text-overflow: clip;
  padding-right: 16px;
}

.col-line-comment {
  width: 8em;
  min-width: 7em;
  white-space: nowrap;
  vertical-align: middle;
  overflow: visible;
  text-overflow: clip;
  /* 与操作列拉开间距 */
  padding-left: 12px;
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
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px 10px;
  white-space: nowrap;
}

.radio-group.line-op-radios .radio-item {
  flex-shrink: 0;
  font-size: 12px;
  gap: 4px;
  white-space: nowrap;
}

.radio-group.line-op-radios .radio-item.is-locked {
  opacity: 0.55;
  cursor: not-allowed;
}

.lines-table tbody tr.is-decision-locked td {
  background: #f3f4f6;
  color: #6b7280;
}

.lines-table tbody tr.is-decision-locked .line-comment-btn:disabled,
.lines-table tbody tr.is-decision-locked input:disabled {
  cursor: not-allowed;
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

.approval-attachments {
  margin: 16px 0 8px;
}

.approval-attachments .section-bar {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.approval-attachments .attachment-panel {
  padding: 0 4px;
}

.approval-attachments .attachment-label {
  font-size: 13px;
  color: #374151;
}

.approval-attachments .optional {
  color: #9ca3af;
  font-weight: 400;
}

.approval-attachments .detail-attach-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.approval-attachments .detail-attach-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.approval-attachments .detail-attach-size {
  font-size: 12px;
  color: #6b7280;
}

.approval-attachments .attachment-file-row {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
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

.approval-preview-btn {
  flex-shrink: 0;
}

.modal-footer-hints {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.application-schedule-preview-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.application-schedule-preview-footer__tip {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 8px 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  font-size: 12px;
  line-height: 1.5;
  color: #1e40af;
  text-align: left;
}

.application-schedule-preview-footer__badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.application-schedule-preview-footer__text {
  flex: 1;
  min-width: 0;
  font-weight: 600;
}

.credit-soft-hint {
  margin: 0;
  font-size: 13px;
  color: #b45309;
  line-height: 1.35;
}

.credit-gate-hint {
  margin: 0;
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
