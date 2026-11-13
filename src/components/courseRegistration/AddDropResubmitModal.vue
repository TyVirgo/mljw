<script setup>
/**
 * 已驳回申请：重新提交弹窗
 * 对标审批行表列序；驳回行可「修改|取消」；课程预览；顶部学分要求
 */
import { computed, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { displayClassTimeVenueFromFields } from '../../data/courseRegistration/sectionScheduleFields.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { formatUnifiedCourseCategoryFromLine } from '../../data/courseRegistration/unifiedCourseCategory.js'
import { isAddDropLineEditableForResubmit } from '../../data/courseRegistration/addDropStudentListStatus.js'
import {
  addDropApprovalLineKey,
  addDropLineKey,
  buildApprovalDecisionTermCreditStrip,
  buildFixedSituationCatchUpFromApplication,
  normalizeAddDropLineAction,
  countsTowardResubmitScheduleEffect,
} from '../../data/courseRegistration/addDropMultiItems.js'
import { addDropLineActionTagClass } from '../../data/courseRegistration/addDropTypeDisplay.js'
import {
  buildAddDropApplicationSchedulePreview,
  listMyResultCourses,
} from '../../data/courseRegistration/studentMyResultCourses.js'
import { getCurrentStudent } from '../../data/mockCurrentStudent.js'
import { formatSchedulePersonLine } from '../../utils/formatSchedulePersonLine.js'
import AddDropTermCreditStrip from './AddDropTermCreditStrip.vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import StudentSchedulePreviewPanel from './StudentSchedulePreviewPanel.vue'

/** 整单附件上限（与申请表同源） */
const MAX_DROP_ATTACHMENTS = 5
/** 单文件最大字节（5MB） */
const MAX_DROP_ATTACHMENT_BYTES = 5 * 1024 * 1024

const props = defineProps({
  visible: Boolean,
  application: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit', 'modify-line'])

const { t, isZh } = useAppI18n()
const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

/** 弹窗内可编辑的全部最新行（含已通过） */
const workingItems = ref([])

/** 意见详情只读查看 */
const lineCommentViewerText = ref('')
const lineCommentViewerVisible = ref(false)

/** 课程预览抽屉 */
const schedulePreviewVisible = ref(false)

/** 取消申请确认：待标已取消行下标 */
const cancelLineIndex = ref(-1)

/** 确认重新提交二次确认可见 */
const submitConfirmVisible = ref(false)

/** 增量 bf：重提窗可调整单附件（{ name, size }[]） */
const workingAttachments = ref([])

watch(
  () => [props.visible, props.application?.id],
  () => {
    if (!props.visible || !props.application) {
      workingItems.value = []
      workingAttachments.value = []
      schedulePreviewVisible.value = false
      cancelLineIndex.value = -1
      submitConfirmVisible.value = false
      closeLineCommentViewer()
      return
    }
    workingItems.value = (props.application.items || []).map((item) => ({ ...item }))
    // 从申请回填附件（兼容 File / {name,size}）
    workingAttachments.value = (props.application.attachments || [])
      .filter((f) => f?.name)
      .map((f) => ({ name: f.name, size: Number(f.size) || 0 }))
  },
  { immediate: true },
)

/** 增量 bg：附件节标题仅「附件材料」，无 SECTION 前缀 */
const attachmentSectionTitle = computed(() =>
  t('courseRegistration.student.sectionLabelAttachments'),
)

/**
 * 顶部学分要求：按当前工作行决策投影（与审批一致）
 */
const liveTermCreditStrip = computed(() => {
  if (!props.application || !workingItems.value.length) return null
  const decisionsByKey = {}
  workingItems.value.forEach((item, idx) => {
    const decision = String(item?.lineDecision || 'pending').trim() || 'pending'
    const approvalKey = addDropApprovalLineKey(item, idx)
    const bareKey = addDropLineKey(item)
    decisionsByKey[approvalKey] = decision
    if (bareKey) decisionsByKey[bareKey] = decision
    decisionsByKey[idx] = decision
  })
  return buildApprovalDecisionTermCreditStrip(
    { ...props.application, items: workingItems.value },
    decisionsByKey,
  )
})

/** 蓝底 tip：申请基线固定落下（增量 ah：矩阵未修行跟 live strip） */
const situationCatchUpDisplay = computed(() =>
  props.application ? buildFixedSituationCatchUpFromApplication(props.application) : null,
)

function itemKey(item, idx) {
  return addDropLineKey(item) || `row-${idx}`
}

function actionTypeLabel(action) {
  const a = String(action || '')
  if (a === 'Add') return t('courseRegistration.approval.type.Add')
  if (a === 'Drop') return t('courseRegistration.approval.type.Drop')
  if (a === 'Retake') return t('courseRegistration.approval.type.Retake')
  return a || '—'
}

/** 行申请类型胶囊 class（增量 bi） */
function actionTypeTagClass(action) {
  return addDropLineActionTagClass(action)
}

function itemCourseName(item) {
  return item?.courseName || item?.courseCode || '—'
}

function itemCourseTypeLabel(item) {
  return formatUnifiedCourseCategoryFromLine(item, t) || '—'
}

function sectionLabel(item) {
  return formatCourseSectionName(item?.sectionCode || item?.section || item?.sectionName, t)
}

function itemWeekRange(item) {
  return item?.weekRange || '—'
}

/** 上课时间地点全量行（悬停 title 用） */
function itemTimeVenueLines(item) {
  const text = displayClassTimeVenueFromFields(
    {
      time: item?.time || item?.classTime,
      classTime: item?.classTime,
      venue: item?.venue || item?.room,
      room: item?.room || item?.venue,
      weekRange: item?.weekRange,
      meetings: item?.meetings,
    },
    timeLocale.value,
  )
  if (!text || text === '—') return []
  return String(text)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 多段时间缩为单行摘要，降低行高
 * @param {object} item
 * @returns {{ text: string, title: string }}
 */
function itemTimeVenueCompact(item) {
  const lines = itemTimeVenueLines(item)
  if (!lines.length) return { text: '—', title: '' }
  const title = lines.join('\n')
  if (lines.length === 1) return { text: lines[0], title }
  return { text: `${lines[0]}…`, title }
}

function itemLecturer(item) {
  return item?.lecturers || item?.lecturer || '—'
}

function lineDecisionLabel(item) {
  const d = String(item?.lineDecision || '').trim()
  if (d === 'approved') return t('courseRegistration.approval.lineApproved')
  if (d === 'rejected') return t('courseRegistration.approval.lineRejected')
  if (d === 'update_required') return t('courseRegistration.approval.lineUpdateRequired')
  // 增量 ba：换课后 pending 展示「待审批」（非审批侧「待定」）
  if (d === 'pending') return t('courseRegistration.student.listStatus.Pending')
  // 增量 bf：取消申请后展示「已取消」
  if (d === 'cancelled') return t('courseRegistration.student.listStatus.Cancelled')
  return '—'
}

/**
 * 行决策彩色胶囊 class（通过绿 / 不通过红 / 驳回橙 / 待审批蓝 / 已取消灰）
 * @param {object|null|undefined} item
 */
function lineDecisionCapsuleClass(item) {
  const d = String(item?.lineDecision || '').trim()
  if (d === 'approved') return 'decision-capsule--approved'
  if (d === 'rejected') return 'decision-capsule--rejected'
  if (d === 'update_required') return 'decision-capsule--update-required'
  if (d === 'pending') return 'decision-capsule--pending'
  if (d === 'cancelled') return 'decision-capsule--cancelled'
  return ''
}

/**
 * 行评价意见正文
 * @param {object|null|undefined} item
 */
function lineCommentText(item) {
  return String(item?.lineComment || '').trim()
}

/**
 * 打开意见详情只读层
 * @param {object|null|undefined} item
 */
function openLineCommentViewer(item) {
  const text = lineCommentText(item)
  if (!text) return
  lineCommentViewerText.value = text
  lineCommentViewerVisible.value = true
}

function closeLineCommentViewer() {
  lineCommentViewerVisible.value = false
  lineCommentViewerText.value = ''
}

/**
 * 是否可修改/取消（驳回行，或已换课 pending）
 * @param {object} item
 */
function canModifyLine(item) {
  return isAddDropLineEditableForResubmit(item?.lineDecision, item)
}

/**
 * 行是否计入重提课程预览（增量 av / ba / bi：与冲突基线同源）
 * @param {object|null|undefined} item
 */
function countsTowardResubmitPreview(item) {
  return countsTowardResubmitScheduleEffect(item)
}

/**
 * 按申请类型筛「预览有效」工作行
 * @param {'Drop'|'Add'|'Retake'} action
 */
function previewLinesByAction(action) {
  return (workingItems.value || []).filter(
    (item) =>
      normalizeAddDropLineAction(item?.action) === action && countsTowardResubmitPreview(item),
  )
}

/**
 * 重提课程预览：仅已通过 + 已换课驳回行（与表内有效内容一致）
 */
const resubmitSchedulePreviewSlots = computed(() => {
  const dropCourses = previewLinesByAction('Drop')
  const addCourses = previewLinesByAction('Add')
  const retakeCourses = previewLinesByAction('Retake')
  if (!dropCourses.length && !addCourses.length && !retakeCourses.length) {
    return buildAddDropApplicationSchedulePreview({
      baseCourses: listMyResultCourses(),
      locale: isZh.value ? 'zh' : 'en',
    })
  }
  return buildAddDropApplicationSchedulePreview({
    baseCourses: listMyResultCourses(),
    dropCourses,
    addCourses,
    retakeCourses,
    locale: isZh.value ? 'zh' : 'en',
  })
})

/** 预览抽屉学号姓名 */
const schedulePersonLine = computed(() => {
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
 * 父级换课确认后写回某一行
 * @param {number} index
 * @param {object} nextItem
 */
function applyModifiedLine(index, nextItem) {
  if (index < 0 || index >= workingItems.value.length || !nextItem) return
  const prev = workingItems.value[index]
  workingItems.value.splice(index, 1, {
    ...prev,
    ...nextItem,
    action: prev.action,
    // 增量 az：换课成功后本行即待审批（pending），意见保留
    lineDecision: 'pending',
    lineComment: prev.lineComment || '',
    // 增量 av：标记已换课，课程预览可投影新课
    resubmitLineModified: true,
  })
}

defineExpose({ applyModifiedLine, workingItems })

function onModify(item, idx) {
  emit('modify-line', { item, index: idx, items: workingItems.value })
}

/**
 * 打开「取消申请」确认（可编辑行）
 * @param {number} idx
 */
function onCancelLine(idx) {
  if (idx < 0 || idx >= workingItems.value.length) return
  const item = workingItems.value[idx]
  if (!canModifyLine(item)) return
  // 已是已取消则无需再确认
  if (String(item?.lineDecision || '').trim() === 'cancelled') return
  cancelLineIndex.value = idx
}

/** 确认取消申请：行决策改为已取消，保留行（增量 bf） */
function confirmCancelLine() {
  const idx = cancelLineIndex.value
  cancelLineIndex.value = -1
  if (idx < 0 || idx >= workingItems.value.length) return
  const item = workingItems.value[idx]
  if (!canModifyLine(item)) return
  workingItems.value.splice(idx, 1, {
    ...item,
    lineDecision: 'cancelled',
    // 取消后不再视为已换课投影
    resubmitLineModified: false,
  })
}

/** 关闭取消申请确认 */
function dismissCancelLine() {
  cancelLineIndex.value = -1
}

/**
 * 格式化附件大小文案
 * @param {number} bytes
 */
function formatAttachSize(bytes) {
  const n = Number(bytes) || 0
  if (n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 选择附件加入工作列表
 * @param {Event} event
 */
function onAttachInputChange(event) {
  const files = Array.from(event?.target?.files || [])
  const current = [...workingAttachments.value]
  for (const file of files) {
    if (!file?.name) continue
    if (file.size > MAX_DROP_ATTACHMENT_BYTES) continue
    if (current.length >= MAX_DROP_ATTACHMENTS) break
    if (current.some((f) => f.name === file.name && f.size === file.size)) continue
    current.push({ name: file.name, size: Number(file.size) || 0 })
  }
  workingAttachments.value = current
  if (event?.target) event.target.value = ''
}

/**
 * 删除某一附件
 * @param {number} index
 */
function removeAttachment(index) {
  const list = [...workingAttachments.value]
  if (index < 0 || index >= list.length) return
  list.splice(index, 1)
  workingAttachments.value = list
}

/** 清空全部附件 */
function clearAttachments() {
  workingAttachments.value = []
}

/**
 * 是否可确认重新提交（增量 br：允许留下已驳回；至少一条非已取消）
 */
const canConfirmResubmit = computed(() => {
  const active = workingItems.value.filter(
    (item) => String(item?.lineDecision || '').trim() !== 'cancelled',
  )
  return active.length > 0
})

/** 打开「确认重新提交」二次确认（增量 ay / bb） */
function onSubmit() {
  if (!canConfirmResubmit.value) return
  submitConfirmVisible.value = true
}

/** 取消二次确认，留在重提窗 */
function dismissSubmitConfirm() {
  submitConfirmVisible.value = false
}

/** 确认后整单提交为待审批（剔除已取消行，写回附件） */
function confirmSubmitResubmit() {
  submitConfirmVisible.value = false
  const items = workingItems.value
    .filter((item) => String(item?.lineDecision || '').trim() !== 'cancelled')
    .map((item) => ({ ...item }))
  emit('submit', {
    application: props.application,
    items,
    attachments: workingAttachments.value.map((f) => ({ ...f })),
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="resubmit-overlay"
      @click.self="emit('close')"
    >
      <div class="resubmit-panel" role="dialog" aria-modal="true">
        <div class="resubmit-header">
          <h3>{{ t('courseRegistration.student.resubmitModalTitle') }}</h3>
          <p class="resubmit-sub">
            {{ application?.applicationNo || '' }}
            ·
            {{ t('courseRegistration.student.resubmitModalHint') }}
          </p>
        </div>

        <div class="resubmit-body">
          <div v-if="liveTermCreditStrip" class="resubmit-credit-strip resubmit-credit-strip--pin">
            <AddDropTermCreditStrip
              :strip="liveTermCreditStrip"
              :term-catch-up-credits="situationCatchUpDisplay"
              :application-type="application?.type || ''"
            />
          </div>

          <div class="resubmit-body__scroll">
          <div class="lines-table-wrap">
            <table class="lines-table">
              <thead>
                <tr>
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
                  <th class="col-decision">{{ t('courseRegistration.approval.lineDecision') }}</th>
                  <th class="col-line-comment">{{ t('courseRegistration.approval.lineCommentColumn') }}</th>
                  <th class="col-op">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in workingItems" :key="itemKey(item, idx)">
                  <td class="col-index">{{ idx + 1 }}</td>
                  <td class="col-app-type" :title="actionTypeLabel(item.action)">
                    <span class="type-tag" :class="actionTypeTagClass(item.action)">
                      {{ actionTypeLabel(item.action) }}
                    </span>
                  </td>
                  <td class="col-code" :title="item.courseCode || ''">{{ item.courseCode || '—' }}</td>
                  <td class="col-name" :title="itemCourseName(item)">{{ itemCourseName(item) }}</td>
                  <td class="col-course-type" :title="itemCourseTypeLabel(item)">
                    {{ itemCourseTypeLabel(item) }}
                  </td>
                  <td class="col-credits">{{ item.credits ?? '—' }}</td>
                  <td class="col-group" :title="sectionLabel(item)">{{ sectionLabel(item) }}</td>
                  <td class="col-week">{{ itemWeekRange(item) }}</td>
                  <td
                    class="cr-time-venue col-time"
                    :title="itemTimeVenueCompact(item).title"
                  >
                    <span class="cr-time-venue-compact">{{ itemTimeVenueCompact(item).text }}</span>
                  </td>
                  <td class="col-lecturer" :title="itemLecturer(item)">{{ itemLecturer(item) }}</td>
                  <td class="col-decision">
                    <span
                      v-if="lineDecisionCapsuleClass(item)"
                      class="decision-capsule"
                      :class="lineDecisionCapsuleClass(item)"
                    >{{ lineDecisionLabel(item) }}</span>
                    <span v-else>{{ lineDecisionLabel(item) }}</span>
                  </td>
                  <td class="col-line-comment">
                    <button
                      v-if="lineCommentText(item)"
                      type="button"
                      class="link-btn"
                      @click="openLineCommentViewer(item)"
                    >
                      {{ t('courseRegistration.approval.lineCommentDetail') }}
                    </button>
                    <span v-else class="decision-comment-empty">{{
                      t('courseRegistration.approval.lineCommentEmpty')
                    }}</span>
                  </td>
                  <td class="col-op">
                    <div v-if="canModifyLine(item)" class="op-actions">
                      <button type="button" class="link-btn" @click="onModify(item, idx)">
                        {{ t('courseRegistration.student.resubmitModifyLine') }}
                      </button>
                      <button
                        v-if="String(item?.lineDecision || '').trim() !== 'cancelled'"
                        type="button"
                        class="link-btn"
                        @click="onCancelLine(idx)"
                      >
                        {{ t('courseRegistration.student.resubmitCancelLine') }}
                      </button>
                    </div>
                    <span v-else class="op-readonly">—</span>
                  </td>
                </tr>
                <tr v-if="!workingItems.length">
                  <td colspan="13" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 增量 bf/bg：课程表下附件材料（可调；标题无 SECTION；样式对齐申请表） -->
          <div class="resubmit-attachments">
            <div class="section-bar">{{ attachmentSectionTitle }}</div>
            <div class="form-field">
              <label>
                {{ t('courseRegistration.student.dropAttachment') }}
                <span class="optional">（{{ t('courseRegistration.student.dropAttachmentOptional') }}）</span>
              </label>
              <div class="attach-row">
                <label
                  class="btn attach-btn attach-btn--soft"
                  :class="{ 'is-disabled': workingAttachments.length >= MAX_DROP_ATTACHMENTS }"
                >
                  {{ t('courseRegistration.student.chooseFile') }}
                  <input
                    type="file"
                    class="attach-input"
                    multiple
                    :disabled="workingAttachments.length >= MAX_DROP_ATTACHMENTS"
                    accept=".pdf,.jpg,.jpeg,.png,.docx,application/pdf,image/*"
                    @change="onAttachInputChange"
                  />
                </label>
                <span v-if="!workingAttachments.length" class="attach-name">
                  {{ t('courseRegistration.student.noFileChosen') }}
                </span>
                <button
                  v-if="workingAttachments.length"
                  type="button"
                  class="link-btn"
                  @click="clearAttachments"
                >
                  {{ t('courseRegistration.student.clearFile') }}
                </button>
              </div>
              <ul v-if="workingAttachments.length" class="attach-list">
                <li
                  v-for="(file, aidx) in workingAttachments"
                  :key="`${file.name}-${aidx}`"
                  class="attach-list-item"
                >
                  <AttachmentPreviewTrigger
                    :file-name="file.name"
                    :file-meta="{ fileName: file.name, size: file.size || 0 }"
                    :download-label="file.name"
                  />
                  <span v-if="formatAttachSize(file.size)" class="attach-size">
                    {{ formatAttachSize(file.size) }}
                  </span>
                  <button
                    type="button"
                    class="link-btn attach-remove"
                    :aria-label="t('common.delete')"
                    @click="removeAttachment(aidx)"
                  >
                    {{ t('common.delete') }}
                  </button>
                </li>
              </ul>
              <p class="field-hint">
                {{ t('courseRegistration.student.dropAttachmentHint') }}
                {{ t('courseRegistration.student.dropAttachmentMaxCount', { n: MAX_DROP_ATTACHMENTS }) }}
              </p>
            </div>
          </div>
          </div>
        </div>

        <div class="resubmit-footer">
          <button
            type="button"
            class="btn btn-default resubmit-preview-btn"
            @click="openSchedulePreview"
          >
            {{ t('courseRegistration.student.applicationSchedulePreviewButton') }}
          </button>
          <div class="resubmit-footer-actions">
            <button type="button" class="btn btn-default" @click="emit('close')">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canConfirmResubmit"
              @click="onSubmit"
            >
              {{ t('courseRegistration.student.resubmitConfirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程预览：与申请弹窗同源 -->
    <ApplicationDetailDrawer
      :visible="schedulePreviewVisible"
      :title="t('courseRegistration.student.applicationSchedulePreviewTitle')"
      :person-line="schedulePersonLine"
      elevate
      @close="schedulePreviewVisible = false"
    >
      <StudentSchedulePreviewPanel
        embedded
        legend-mode="addDropPreview"
        :schedule="resubmitSchedulePreviewSlots"
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

    <!-- 取消申请确认 -->
    <ConfirmDialog
      :visible="cancelLineIndex >= 0"
      :title="t('courseRegistration.student.resubmitCancelLineTitle')"
      :message="t('courseRegistration.student.resubmitCancelLineMessage')"
      :confirm-text="t('courseRegistration.student.resubmitCancelLine')"
      :cancel-text="t('common.cancel')"
      :z-index="1400"
      @confirm="confirmCancelLine"
      @cancel="dismissCancelLine"
    />

    <!-- 确认重新提交二次确认（增量 ay） -->
    <ConfirmDialog
      :visible="submitConfirmVisible"
      :title="t('courseRegistration.student.resubmitConfirmTitle')"
      :message="t('courseRegistration.student.resubmitConfirmMessage')"
      :confirm-text="t('courseRegistration.student.resubmitConfirm')"
      :cancel-text="t('common.cancel')"
      :z-index="1400"
      @confirm="confirmSubmitResubmit"
      @cancel="dismissSubmitConfirm"
    />

    <!-- 意见详情只读（对标详情弹窗） -->
    <div
      v-if="lineCommentViewerVisible"
      class="line-comment-viewer-overlay"
      @click="closeLineCommentViewer"
    >
      <div
        class="line-comment-viewer-panel"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <div class="line-comment-viewer-header">
          <h3 class="line-comment-viewer-title">
            {{ t('courseRegistration.approval.lineCommentModalTitle') }}
          </h3>
          <button
            type="button"
            class="line-comment-viewer-close"
            :aria-label="t('common.close')"
            @click="closeLineCommentViewer"
          >
            ×
          </button>
        </div>
        <div class="line-comment-viewer-body">
          <p class="line-comment-viewer-text">{{ lineCommentViewerText }}</p>
        </div>
        <div class="line-comment-viewer-footer">
          <button type="button" class="btn btn-primary" @click="closeLineCommentViewer">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.resubmit-overlay {
  position: fixed;
  inset: 0;
  /* 低于选课弹窗 1200，便于换课时选课器盖在上方 */
  z-index: 1180;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.resubmit-panel {
  /* 增量 ac：加宽对齐审批弹窗 */
  width: min(1400px, 98vw);
  max-height: min(90vh, 860px);
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.resubmit-header {
  padding: 16px 20px 10px;
  border-bottom: 1px solid #e5e7eb;
}

.resubmit-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.resubmit-sub {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.resubmit-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px 20px 0;
}

/* 增量 bd：学分要求上钉，表格区下滚 */
.resubmit-credit-strip--pin {
  flex-shrink: 0;
  margin: 0 0 12px;
  padding: 0 0 8px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.resubmit-body__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: 12px;
}

.lines-table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.lines-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
}

.lines-table th,
.lines-table td {
  border-bottom: 1px solid #f3f4f6;
  padding: 6px 8px;
  text-align: left;
  vertical-align: middle;
  word-break: break-word;
}

.lines-table td {
  overflow: hidden;
  text-overflow: ellipsis;
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

.col-index {
  width: 3.2em;
  min-width: 3.2em;
  text-align: center;
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

.col-code {
  width: 7em;
  min-width: 6.5em;
  white-space: nowrap;
}

.col-name {
  width: 12%;
  white-space: nowrap;
}

.col-course-type {
  width: 5em;
  min-width: 4.5em;
  white-space: nowrap;
}

.col-credits {
  width: 3.5em;
  min-width: 3.5em;
  text-align: center;
  white-space: nowrap;
}

.col-group {
  width: 7em;
  white-space: nowrap;
}

.col-week {
  width: 4.5em;
  white-space: nowrap;
}

.col-time {
  width: 18%;
}

.col-lecturer {
  width: 8em;
  white-space: nowrap;
}

.col-decision {
  width: 7em;
  min-width: 6em;
  white-space: nowrap;
  padding-right: 14px;
}

.col-line-comment {
  width: 7em;
  min-width: 6em;
  white-space: nowrap;
  /* 与决策列拉开间距 */
  padding-left: 12px;
}

.col-op {
  width: 7.5em;
  min-width: 6.5em;
}

.op-actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

.cr-time-venue {
  line-height: 1.3;
}

.cr-time-venue-compact {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.decision-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

/* 与详情操作列同源：通过绿 / 不通过红 / 驳回橙 */
.decision-capsule {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.decision-capsule--approved {
  background: #dcfce7;
  color: #15803d;
}

.decision-capsule--rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.decision-capsule--update-required {
  background: #ffedd5;
  color: #c2410c;
}

.decision-capsule--pending {
  background: #dbeafe;
  color: #1d4ed8;
}

.decision-capsule--cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.decision-comment-empty {
  color: #9ca3af;
  font-size: 12px;
}

.resubmit-attachments {
  margin-top: 16px;
  padding-top: 4px;
}

.resubmit-attachments .section-bar {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.resubmit-attachments .form-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
}

.resubmit-attachments .optional {
  color: #9ca3af;
  font-weight: 400;
}

.resubmit-attachments .attach-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

/* 增量 bj：提高优先级，避免被 .btn / label 继承盖成深色字 */
.resubmit-attachments label.btn.attach-btn,
.resubmit-attachments .attach-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  line-height: 1;
  box-sizing: border-box;
  cursor: pointer;
  text-align: center;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.resubmit-attachments label.btn.attach-btn.attach-btn--soft,
.resubmit-attachments .attach-btn--soft {
  border: 1px solid #93c5fd;
  background: #dbeafe;
  color: #1d4ed8;
}

.resubmit-attachments label.btn.attach-btn.attach-btn--soft:hover,
.resubmit-attachments .attach-btn--soft:hover {
  background: #bfdbfe;
  border-color: #60a5fa;
  color: #1d4ed8;
}

.resubmit-attachments .attach-btn.is-disabled {
  opacity: 0.55;
  pointer-events: none;
  cursor: not-allowed;
}

.resubmit-attachments .attach-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.resubmit-attachments .attach-name {
  font-size: 13px;
  color: #9ca3af;
}

.resubmit-attachments .attach-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resubmit-attachments .attach-list-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.resubmit-attachments .attach-size {
  font-size: 12px;
  color: #6b7280;
}

.resubmit-attachments .field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.op-readonly {
  color: #9ca3af;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 16px !important;
}

.resubmit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e7eb;
}

.resubmit-preview-btn {
  flex-shrink: 0;
}

.resubmit-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
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

.btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.line-comment-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1190;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.line-comment-viewer-panel {
  width: min(480px, 100%);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  max-height: min(70vh, 480px);
}

.line-comment-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.line-comment-viewer-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.line-comment-viewer-close {
  border: none;
  background: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.line-comment-viewer-body {
  padding: 16px;
  overflow: auto;
  flex: 1 1 auto;
}

.line-comment-viewer-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #111827;
  white-space: pre-wrap;
  word-break: break-word;
}

.line-comment-viewer-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
