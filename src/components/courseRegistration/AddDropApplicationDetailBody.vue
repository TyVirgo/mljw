<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import { downloadAttachmentMock } from '../../utils/attachmentPreview.js'
import {
  getAddDropCourseColumnTexts,
  resolveAddDropCourseParts,
} from '../../utils/addDropCourseDisplay.js'
import {
  getVisibleAddDropSections,
  buildAddDropSectionBars,
  displayPrimaryType,
  needDropFromAction,
} from '../../data/courseRegistration/addDropFormSections.js'
import { getAddDropDeclarationExtraKey } from '../../data/courseRegistration/addDropListColumns.js'
import { addDropStatusBadgeClass } from '../../data/courseRegistration/addDropStatusBadge.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import { displayClassTimeVenueFromFields } from '../../data/courseRegistration/sectionScheduleFields.js'
import {
  formatAmountRmb,
  resolveAddDropExcessCredits,
} from '../../data/courseRegistration/addDropFeeRates.js'
import {
  displayPreviousCourseGrades,
  retakeHistoryFromCourse,
} from '../../data/courseRegistration/studentTranscript.js'
import { addDropLineKey } from '../../data/courseRegistration/addDropMultiItems.js'
import { normalizeRegistrationType } from '../../data/courseRegistration/registrationTypes.js'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import '../../styles/movement-status-badge.css'

const props = defineProps({
  application: { type: Object, default: null },
  /** 是否展示附件导出按钮 */
  showAttachmentExport: { type: Boolean, default: true },
})

const { t, isZh } = useAppI18n()
const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

function snapTimeVenue(kind) {
  const snap = snapFor(kind)
  const item =
    kind === 'drop'
      ? itemByAction('Drop')
      : kind === 'add'
        ? itemByAction('Add')
        : itemByAction('Retake')
  const appVal = app.value || {}
  return displayClassTimeVenueFromFields(
    {
      time: snap?.time || item?.time,
      classTime:
        snap?.classTime ||
        (kind === 'drop'
          ? appVal.dropClassTime
          : kind === 'add'
            ? appVal.addClassTime
            : appVal.classTime) ||
        item?.classTime ||
        item?.time,
      venue:
        snap?.venue ||
        (kind === 'drop' ? appVal.dropVenue : kind === 'add' ? appVal.addVenue : appVal.venue) ||
        item?.room,
      weekRange:
        snap?.weekRange ||
        (kind === 'drop'
          ? appVal.dropWeekRange
          : kind === 'add'
            ? appVal.addWeekRange
            : appVal.weekRange) ||
        item?.weekRange,
      meetings: snap?.meetings || item?.meetings,
    },
    timeLocale.value,
  )
}

const app = computed(() => props.application)
const courseCols = computed(() => getAddDropCourseColumnTexts(app.value))
const sections = computed(() => getVisibleAddDropSections(app.value?.type || 'Add'))
const sectionBars = computed(() => buildAddDropSectionBars(app.value?.type || 'Add', t))
const declarationExtraKey = computed(() => getAddDropDeclarationExtraKey(app.value?.type || 'Add'))

const attachmentFile = computed(() => {
  const file = app.value?.attachments?.[0]
  if (!file?.name) return null
  return { fileName: file.name, size: file.size || 0 }
})

const showDropAttachmentBlock = computed(() => {
  if (!app.value || !sections.value.showIII) return false
  return (
    Boolean(attachmentFile.value) ||
    app.value.dropChannel === 'special' ||
    app.value.type === 'Drop' ||
    app.value.type === 'AddDrop' ||
    app.value.type === 'RetakeDrop'
  )
})

const showStandaloneAttachments = computed(() => {
  if (!app.value || showDropAttachmentBlock.value) return false
  return (
    Boolean(attachmentFile.value) ||
    app.value.dropChannel === 'special'
  )
})

const excessCreditsDisplay = computed(() => {
  const a = app.value
  if (!a || a.type === 'Drop') return ''
  const n = resolveAddDropExcessCredits(a)
  if (
    n <= 0 &&
    (a.excessCredits == null || a.excessCredits === '') &&
    a.billableCredits == null &&
    a.feeEstimate?.billableCredits == null &&
    !(Number(a.billAmount ?? a.feeEstimate?.total) > 0)
  ) {
    return ''
  }
  return String(n)
})

/** 主类型 Add/Retake（含关联）时回显「是否需要退课」 */
const needDropValue = computed(() => {
  const a = app.value
  if (!a) return ''
  if (a.needDrop === 'yes' || a.needDrop === 'no') return a.needDrop
  return needDropFromAction(a.type)
})

const showNeedDropField = computed(() => {
  const primary = displayPrimaryType(app.value?.type)
  return primary === 'Add' || primary === 'Retake'
})

/** 退课学分汇总（与表单 dropCreditBreakdown 同源） */
const dropCreditBreakdown = computed(() => {
  let me = 0
  let ge = 0
  const items = dropItems.value
  if (items.length) {
    for (const item of items) {
      if (!item) continue
      const credits = Number(item.credits) || 0
      if (normalizeRegistrationType(item.type) === 'GE') ge += credits
      else me += credits
    }
  } else if (sections.value.showIII) {
    const snap = snapFor('drop')
    const item = itemByAction('Drop')
    const credits = Number(item?.credits ?? snap?.credits) || 0
    const type = item?.type || snap?.type || ''
    if (credits > 0) {
      if (normalizeRegistrationType(type) === 'GE') ge = credits
      else me = credits
    }
  }
  return {
    total: String(me + ge),
    me: String(me),
    ge: String(ge),
  }
})

const showDropCreditSummary = computed(() => {
  if (!sections.value.showIII) return false
  if (dropItems.value.length > 0) return true
  return Number(dropCreditBreakdown.value.total) > 0
})

function resolveI18nLabel(key, fallback) {
  const label = t(key)
  return typeof label === 'string' && label !== key ? label : fallback
}

function typeLabel(type) {
  const primary = displayPrimaryType(type) || type
  return resolveI18nLabel(`courseRegistration.approval.type.${primary}`, primary)
}

function statusLabel(status) {
  return resolveI18nLabel(`courseRegistration.approval.appStatus.${status}`, status)
}

function dash(v) {
  return v && String(v).trim() ? v : '—'
}

function retakeTypeLabel(value) {
  if (!value) return '—'
  const mapped = {
    improve_grade: 'improveGrade',
    failed: 'failed',
    other: 'other',
  }
  const k = mapped[value] || value
  return resolveI18nLabel(`courseRegistration.student.retakeType.${k}`, value)
}

function snapFor(kind) {
  return app.value?.courseSnapshots?.[kind] || null
}

function itemByAction(action) {
  return (app.value?.items || []).find((i) => i.action === action) || null
}

function courseParts(kind) {
  const action = kind === 'drop' ? 'Drop' : kind === 'retake' ? 'Retake' : 'Add'
  const item = itemByAction(action)
  const snap = snapFor(kind)
  const parts = resolveAddDropCourseParts(item, snap)
  if (!parts.name && !parts.code) {
    const cols = courseCols.value
    const combined = kind === 'drop' ? cols.drop : kind === 'retake' ? cols.retake : cols.add
    if (combined && combined !== '—') {
      const [code, ...rest] = String(combined).split(' ')
      return { code: code || '', name: rest.join(' ') || combined }
    }
  }
  return parts
}

function academicSessionText() {
  const v = String(app.value?.academicSession || '').trim()
  return v && v !== '—' ? v : '2026/04'
}

function contactPhoneText() {
  const v = String(app.value?.contactPhone || '').trim()
  return v && v !== '—' ? v : '0123456789'
}

function feeBaseAmountText() {
  const base = app.value?.feeEstimate?.total
  if (base != null && base !== '') return formatAmountRmb(base)
  const bill = Number(app.value?.billAmount)
  const sst = Number(app.value?.sstAmount ?? app.value?.feeEstimate?.sstAmount) || 0
  if (Number.isFinite(bill) && bill > 0) return formatAmountRmb(Math.max(0, bill - sst))
  return formatAmountRmb(0)
}

function sstAmountText() {
  const sst = app.value?.sstAmount ?? app.value?.feeEstimate?.sstAmount
  return formatAmountRmb(sst != null && sst !== '' ? sst : 0)
}

function feeAmountText() {
  return formatAmountRmb(
    app.value?.billAmount ??
      app.value?.feeEstimate?.payableTotal ??
      app.value?.feeEstimate?.total ??
      0,
  )
}

function exportAttachment() {
  if (!attachmentFile.value?.fileName) return
  downloadAttachmentMock(attachmentFile.value.fileName, attachmentFile.value.fileName)
}

const showWhitelistCreditOverHint = computed(
  () => Boolean(app.value?.creditMaxBypass && app.value?.termCreditOver),
)

const allItems = computed(() => app.value?.items || [])
const dropItems = computed(() => allItems.value.filter((i) => i.action === 'Drop'))
const addItems = computed(() => allItems.value.filter((i) => i.action === 'Add'))
const retakeItems = computed(() => allItems.value.filter((i) => i.action === 'Retake'))

/** 有行决策或已审结时在课程表展示同意/不同意 */
const showLineDecisionColumn = computed(() => {
  const st = app.value?.status
  if (['Approved', 'Rejected', 'PartiallyApproved'].includes(st)) return true
  return (app.value?.items || []).some(
    (i) => i.lineDecision === 'approved' || i.lineDecision === 'rejected',
  )
})

function lineDecisionLabel(item) {
  const d = item?.lineDecision
  if (d === 'approved') return t('courseRegistration.approval.lineApproved')
  if (d === 'rejected') return t('courseRegistration.approval.lineRejected')
  if (showLineDecisionColumn.value) return t('courseRegistration.approval.linePending')
  return '—'
}

/** 无 items 时回落单课快照，与旧详情一致 */
const dropRows = computed(() => {
  if (dropItems.value.length) return dropItems.value
  if (!allItems.value.length && sections.value.showIII) return [null]
  return []
})

const addRows = computed(() => {
  if (addItems.value.length) return addItems.value
  if (!allItems.value.length && sections.value.showII) return [null]
  return []
})

const retakeRows = computed(() => {
  if (retakeItems.value.length) return retakeItems.value
  if (!allItems.value.length && sections.value.showIV) return [null]
  return []
})

function itemTimeVenue(item) {
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

function timeVenueLines(text) {
  if (!text || text === '—') return []
  return String(text)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function timeVenueTitle(text) {
  const lines = timeVenueLines(text)
  return lines.length ? lines.join('\n') : String(text || '')
}

function itemSectionLabel(item) {
  return formatCourseSectionName(item?.section || item?.sectionCode || item?.sectionName, t)
}

function dropRowCode(item) {
  return dash(item?.courseCode || courseParts('drop').code)
}

function dropRowName(item) {
  return dash(item?.courseName || courseParts('drop').name)
}

function dropRowSection(item) {
  return dash(
    item
      ? itemSectionLabel(item)
      : snapFor('drop')?.groupName ||
        app.value?.dropSectionName ||
        formatCourseSectionName(
          snapFor('drop')?.groupNo || app.value?.dropSectionCode || itemByAction('Drop')?.section,
          t,
        ),
  )
}

function dropRowWeek(item) {
  return dash(
    item?.weekRange ||
      snapFor('drop')?.weekRange ||
      app.value?.dropWeekRange ||
      app.value?.weekRange ||
      itemByAction('Drop')?.weekRange,
  )
}

function dropRowTime(item) {
  return dash(item ? itemTimeVenue(item) : snapTimeVenue('drop'))
}

function dropRowLecturer(item) {
  return dash(
    item?.lecturer ||
      item?.lecturers ||
      snapFor('drop')?.lecturers ||
      app.value?.dropLecturers ||
      itemByAction('Drop')?.lecturer,
  )
}

function dropRowCredits(item) {
  return dash(item?.credits ?? itemByAction('Drop')?.credits)
}

function addRowCode(item) {
  return dash(item?.courseCode || courseParts('add').code)
}

function addRowName(item) {
  return dash(item?.courseName || courseParts('add').name)
}

function addRowSection(item) {
  return dash(
    item
      ? itemSectionLabel(item)
      : snapFor('add')?.groupName ||
        app.value?.addSectionName ||
        app.value?.sectionName ||
        formatCourseSectionName(
          snapFor('add')?.groupNo ||
            app.value?.addSectionCode ||
            app.value?.sectionCode ||
            itemByAction('Add')?.section,
          t,
        ),
  )
}

function addRowWeek(item) {
  return dash(
    item?.weekRange ||
      snapFor('add')?.weekRange ||
      app.value?.addWeekRange ||
      app.value?.weekRange ||
      itemByAction('Add')?.weekRange,
  )
}

function addRowTime(item) {
  return dash(item ? itemTimeVenue(item) : snapTimeVenue('add'))
}

function addRowLecturer(item) {
  return dash(
    item?.lecturer ||
      item?.lecturers ||
      snapFor('add')?.lecturers ||
      app.value?.addLecturers ||
      app.value?.lecturers ||
      itemByAction('Add')?.lecturer,
  )
}

function addRowCredits(item) {
  return dash(
    item?.credits ??
      snapFor('add')?.credits ??
      app.value?.addCredits ??
      app.value?.credits ??
      itemByAction('Add')?.credits,
  )
}

function retakeRowCode(item) {
  return dash(item?.courseCode || courseParts('retake').code)
}

function retakeRowName(item) {
  return dash(item?.courseName || courseParts('retake').name)
}

function retakeRowWeek(item) {
  return dash(
    item?.weekRange ||
      snapFor('retake')?.weekRange ||
      app.value?.weekRange ||
      itemByAction('Retake')?.weekRange,
  )
}

function retakeRowTime(item) {
  return dash(item ? itemTimeVenue(item) : snapTimeVenue('retake'))
}

function retakeRowLecturer(item) {
  return dash(
    item?.lecturer ||
      item?.lecturers ||
      snapFor('retake')?.lecturers ||
      app.value?.lecturers ||
      itemByAction('Retake')?.lecturer,
  )
}

function retakeRowCredits(item) {
  return dash(
    item?.credits ??
      snapFor('retake')?.credits ??
      app.value?.credits ??
      itemByAction('Retake')?.credits,
  )
}

function retakeRowPreviousGrades(item) {
  const raw = String(item?.previousCourseGradesText || '').trim()
  if (raw) return raw
  if (item?.courseId || item?.courseCode) {
    const hist = retakeHistoryFromCourse(
      { id: item.courseId, code: item.courseCode, name: item.courseName },
      app.value?.academicSession,
      app.value?.studentId,
    )
    if (hist.previousCourseGradesText) return hist.previousCourseGradesText
  }
  // 单课旧数据回落申请级摘要
  if ((app.value?.items || []).filter((i) => i.action === 'Retake').length <= 1) {
    return displayPreviousCourseGrades(app.value) || ''
  }
  return ''
}
</script>

<template>
  <div v-if="app" class="adddrop-detail-body">
    <CourseRegistrationCallout
      v-if="showWhitelistCreditOverHint"
      variant="warning"
      class="whitelist-credit-hint"
    >
      <p>{{ t('courseRegistration.approval.approvalWhitelistCreditOverHint') }}</p>
    </CourseRegistrationCallout>

    <section class="detail-section">
      <div class="section-bar">{{ t('courseRegistration.student.detailBasic') }}</div>
      <div class="field-grid">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.applicationNo') }}</div>
          <div class="field-value">{{ app.applicationNo }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.batch.academicSession') }}</div>
          <div class="field-value">{{ academicSessionText() }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.typeLabel') }}</div>
          <div class="field-value">{{ typeLabel(app.type) }}</div>
        </div>
        <div v-if="showNeedDropField" class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.needDropLabel') }}</div>
          <div class="field-value">
            {{ needDropValue === 'yes' ? t('common.yes') : t('common.no') }}
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.status') }}</div>
          <div class="field-value">
            <span class="status-badge" :class="addDropStatusBadgeClass(app.status)">
              {{ statusLabel(app.status) }}
            </span>
          </div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.approval.submittedAt') }}</div>
          <div class="field-value">{{ app.submittedAt || '—' }}</div>
        </div>
        <div v-if="app.dropChannel" class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.dropChannelLabel') }}</div>
          <div class="field-value">
            {{ t(`courseRegistration.student.dropChannel.${app.dropChannel}`) }}
            <template v-if="app.teachingWeek">
              · {{ t('courseRegistration.student.teachingWeekOption', { week: app.teachingWeek }) }}
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <div class="section-bar">{{ sectionBars.student }}</div>
      <div class="field-grid">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldStudentId') }}</div>
          <div class="field-value">{{ dash(app.studentId) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldStudentName') }}</div>
          <div class="field-value">{{ dash(app.studentName) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldProgramme') }}</div>
          <div class="field-value">{{ dash(app.programme) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.contactPhone') }}</div>
          <div class="field-value">{{ contactPhoneText() }}</div>
        </div>
      </div>
    </section>

    <section v-if="sections.showIII && dropRows.length" class="detail-section">
      <div class="section-bar">{{ sectionBars.drop }}</div>
      <div class="lines-table-wrap">
        <table class="lines-table">
          <thead>
            <tr>
              <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
              <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
              <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
              <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
              <th class="col-week">{{ t('courseRegistration.student.fieldWeekRange') }}</th>
              <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
              <th class="col-lecturer">{{ t('courseRegistration.student.fieldLecturers') }}</th>
              <th v-if="showLineDecisionColumn" class="col-decision">
                {{ t('courseRegistration.approval.lineDecision') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, di) in dropRows" :key="addDropLineKey(item) || 'drop-' + di">
              <td class="col-code" :title="dropRowCode(item)">{{ dropRowCode(item) }}</td>
              <td class="col-name" :title="dropRowName(item)">{{ dropRowName(item) }}</td>
              <td class="col-group" :title="dropRowSection(item)">{{ dropRowSection(item) }}</td>
              <td class="col-credits">{{ dropRowCredits(item) }}</td>
              <td class="col-week" :title="dropRowWeek(item)">{{ dropRowWeek(item) }}</td>
              <td class="cr-time-venue col-time" :title="timeVenueTitle(dropRowTime(item))">
                <template v-if="timeVenueLines(dropRowTime(item)).length">
                  <div
                    v-for="(tv, li) in timeVenueLines(dropRowTime(item))"
                    :key="li"
                    class="cr-time-venue-line"
                    :title="tv"
                  >
                    {{ tv }}
                  </div>
                </template>
                <template v-else>{{ dropRowTime(item) }}</template>
              </td>
              <td class="col-lecturer" :title="dropRowLecturer(item)">{{ dropRowLecturer(item) }}</td>
              <td v-if="showLineDecisionColumn" class="col-decision">{{ lineDecisionLabel(item) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="field-grid field-grid--after-table">
        <template v-if="showDropCreditSummary">
          <div class="field-item">
            <div class="field-label">{{ t('courseRegistration.student.fieldDropTotalCredits') }}</div>
            <div class="field-value">{{ dropCreditBreakdown.total }}</div>
          </div>
          <div class="field-item">
            <div class="field-label">{{ t('courseRegistration.student.fieldDropMeCredits') }}</div>
            <div class="field-value">{{ dropCreditBreakdown.me }}</div>
          </div>
          <div class="field-item">
            <div class="field-label">{{ t('courseRegistration.student.fieldDropGeCredits') }}</div>
            <div class="field-value">{{ dropCreditBreakdown.ge }}</div>
          </div>
        </template>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.dropReason') }}</div>
          <div class="field-value">{{ dash(app.dropReason || app.reason) }}</div>
        </div>
        <div v-if="showDropAttachmentBlock" class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.dropAttachment') }}</div>
          <div class="field-value">
            <AttachmentPreviewTrigger
              v-if="attachmentFile"
              :file-name="attachmentFile.fileName"
              :file-meta="attachmentFile"
              :download-label="attachmentFile.fileName"
            />
            <span v-else>{{ t('courseRegistration.approval.attachmentNone') }}</span>
            <button
              v-if="showAttachmentExport && attachmentFile"
              type="button"
              class="btn btn-outline attachment-export-btn"
              @click="exportAttachment"
            >
              {{ t('movementExport.exportAttachment') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="sections.showII && addRows.length" class="detail-section">
      <div class="section-bar">{{ sectionBars.add }}</div>
      <div class="lines-table-wrap">
        <table class="lines-table">
          <thead>
            <tr>
              <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
              <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
              <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
              <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
              <th class="col-week">{{ t('courseRegistration.student.fieldWeekRange') }}</th>
              <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
              <th class="col-lecturer">{{ t('courseRegistration.student.fieldLecturers') }}</th>
              <th v-if="showLineDecisionColumn" class="col-decision">
                {{ t('courseRegistration.approval.lineDecision') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, ai) in addRows" :key="addDropLineKey(item) || 'add-' + ai">
              <td class="col-code" :title="addRowCode(item)">{{ addRowCode(item) }}</td>
              <td class="col-name" :title="addRowName(item)">{{ addRowName(item) }}</td>
              <td class="col-group" :title="addRowSection(item)">{{ addRowSection(item) }}</td>
              <td class="col-credits">{{ addRowCredits(item) }}</td>
              <td class="col-week" :title="addRowWeek(item)">{{ addRowWeek(item) }}</td>
              <td class="cr-time-venue col-time" :title="timeVenueTitle(addRowTime(item))">
                <template v-if="timeVenueLines(addRowTime(item)).length">
                  <div
                    v-for="(tv, li) in timeVenueLines(addRowTime(item))"
                    :key="li"
                    class="cr-time-venue-line"
                    :title="tv"
                  >
                    {{ tv }}
                  </div>
                </template>
                <template v-else>{{ addRowTime(item) }}</template>
              </td>
              <td class="col-lecturer" :title="addRowLecturer(item)">{{ addRowLecturer(item) }}</td>
              <td v-if="showLineDecisionColumn" class="col-decision">{{ lineDecisionLabel(item) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="field-grid field-grid--after-table">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldExcessCredits') }}</div>
          <div class="field-value">{{ dash(excessCreditsDisplay) }}</div>
        </div>
        <div v-if="app.addNotes" class="field-item field-item--full">
          <div class="field-label">{{ t('courseRegistration.student.addNotesLabel') }}</div>
          <div class="field-value">{{ dash(app.addNotes) }}</div>
        </div>
      </div>
    </section>

    <section v-if="sections.showIV && retakeRows.length" class="detail-section">
      <div class="section-bar">{{ sectionBars.retake }}</div>
      <div class="lines-table-wrap">
        <table class="lines-table">
          <thead>
            <tr>
              <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
              <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
              <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
              <th class="col-week">{{ t('courseRegistration.student.fieldWeekRange') }}</th>
              <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
              <th class="col-lecturer">{{ t('courseRegistration.student.fieldLecturers') }}</th>
              <th class="col-prev-grades">{{ t('courseRegistration.student.previousCourseGrades') }}</th>
              <th v-if="showLineDecisionColumn" class="col-decision">
                {{ t('courseRegistration.approval.lineDecision') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, ri) in retakeRows" :key="addDropLineKey(item) || 'retake-' + ri">
              <td class="col-code" :title="retakeRowCode(item)">{{ retakeRowCode(item) }}</td>
              <td class="col-name" :title="retakeRowName(item)">{{ retakeRowName(item) }}</td>
              <td class="col-credits">{{ retakeRowCredits(item) }}</td>
              <td class="col-week" :title="retakeRowWeek(item)">{{ retakeRowWeek(item) }}</td>
              <td class="cr-time-venue col-time" :title="timeVenueTitle(retakeRowTime(item))">
                <template v-if="timeVenueLines(retakeRowTime(item)).length">
                  <div
                    v-for="(tv, li) in timeVenueLines(retakeRowTime(item))"
                    :key="li"
                    class="cr-time-venue-line"
                    :title="tv"
                  >
                    {{ tv }}
                  </div>
                </template>
                <template v-else>{{ retakeRowTime(item) }}</template>
              </td>
              <td class="col-lecturer" :title="retakeRowLecturer(item)">{{ retakeRowLecturer(item) }}</td>
              <td class="col-prev-grades">
                <template v-if="retakeRowPreviousGrades(item)">
                  <div
                    v-for="(gl, gi) in retakeRowPreviousGrades(item).split('\n')"
                    :key="gi"
                    class="prev-grade-line"
                  >
                    {{ gl }}
                  </div>
                </template>
                <template v-else>—</template>
              </td>
              <td v-if="showLineDecisionColumn" class="col-decision">{{ lineDecisionLabel(item) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="field-grid field-grid--after-table">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.retakeTypeLabel') }}</div>
          <div class="field-value">{{ retakeTypeLabel(app.retakeType) }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldExcessCredits') }}</div>
          <div class="field-value">{{ dash(excessCreditsDisplay) }}</div>
        </div>
      </div>
    </section>

    <section
      v-if="(app.billAmount != null && app.billAmount !== '') || app.feeEstimate"
      class="detail-section"
    >
      <div class="section-bar">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
      <div class="field-grid">
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.feeEstimateShort') }}</div>
          <div class="field-value">{{ feeBaseAmountText() }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.fieldSst') }}</div>
          <div class="field-value">{{ sstAmountText() }}</div>
        </div>
        <div class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.feeEstimateTotal') }}</div>
          <div class="field-value">{{ feeAmountText() }}</div>
        </div>
        <div v-if="app.paymentDueAt" class="field-item">
          <div class="field-label">{{ t('courseRegistration.student.paymentDueAt') }}</div>
          <div class="field-value">{{ app.paymentDueAt }}</div>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <div class="section-bar">{{ sectionBars.declaration }}</div>
      <div class="declaration-box">
        <p class="declaration-extra">{{ t(declarationExtraKey) }}</p>
        <p class="declaration-text">{{ t('courseRegistration.student.declarationText') }}</p>
        <label class="checkbox-row">
          <input type="checkbox" :checked="app.declarationAgreed !== false" disabled />
          <span>{{ t('courseRegistration.student.declarationAgree') }}</span>
        </label>
      </div>
    </section>

    <section v-if="showStandaloneAttachments" class="detail-section">
      <div class="section-bar">{{ t('courseRegistration.student.detailAttachments') }}</div>
      <div class="attachment-panel">
        <div class="attachment-header">
          <label class="attachment-label">
            {{ t('courseRegistration.student.dropAttachment') }}
            <span v-if="app.dropChannel === 'special'" class="required">*</span>
            :
          </label>
          <button
            v-if="showAttachmentExport && attachmentFile"
            type="button"
            class="btn btn-outline"
            @click="exportAttachment"
          >
            {{ t('movementExport.exportAttachment') }}
          </button>
        </div>
        <div class="attachment-file-row">
          <AttachmentPreviewTrigger
            v-if="attachmentFile"
            :file-name="attachmentFile.fileName"
            :file-meta="attachmentFile"
            :download-label="attachmentFile.fileName"
          />
          <span v-else>{{ t('courseRegistration.approval.attachmentNone') }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.adddrop-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  margin: 0;
}

.section-bar {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  margin-bottom: 12px;
}

.field-grid--after-table {
  margin-top: 14px;
  margin-bottom: 0;
}

.field-grid--single {
  grid-template-columns: 1fr;
}

.field-item--full {
  grid-column: 1 / -1;
}

.field-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #6b7280;
}

.field-value {
  font-size: 14px;
  color: #111827;
  word-break: break-word;
  line-height: 1.45;
}

.field-value--pre {
  white-space: pre-line;
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
  font-size: 12px;
}

.lines-table th,
.lines-table td {
  padding: 5px 6px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lines-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.lines-table tbody tr:last-child td {
  border-bottom: none;
}

.lines-table .col-code {
  width: 10%;
}

.lines-table .col-name {
  width: 14%;
}

.lines-table .col-group {
  width: 11%;
}

.lines-table .col-credits {
  width: 6%;
}

.lines-table .col-week {
  width: 8%;
}

.lines-table .col-time {
  width: 32%;
}

.lines-table .col-prev-grades {
  width: 14%;
  white-space: normal;
  line-height: 1.35;
  font-size: 12px;
  color: #374151;
}

.lines-table .prev-grade-line + .prev-grade-line {
  margin-top: 2px;
}

.lines-table .col-lecturer {
  width: 11%;
}

.lines-table .col-decision {
  width: 9%;
  white-space: nowrap;
}

.cr-time-venue {
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
}

.cr-time-venue-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 1px;
}

.declaration-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px 16px;
}

.declaration-text {
  margin: 0 0 12px;
  font-size: 13px;
  color: #111827;
  line-height: 1.5;
}

.declaration-extra {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.55;
  color: #92400e;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #111827;
  flex-wrap: nowrap;
}

.checkbox-row input {
  flex-shrink: 0;
  margin: 0;
  width: 14px;
  height: 14px;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  background: #fff;
  cursor: default;
  opacity: 1;
  position: relative;
  flex-shrink: 0;
}

.checkbox-row input:checked {
  background: #2563eb;
  border-color: #2563eb;
}

.checkbox-row input:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 3px;
  height: 7px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-row span {
  font-weight: 600;
  line-height: 1.3;
}

.attachment-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fff;
}

.attachment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.attachment-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.required {
  color: #dc2626;
  margin-left: 2px;
}

.attachment-file-row {
  min-height: 28px;
}

.attachment-export-btn {
  margin-left: 12px;
  vertical-align: middle;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  background: #fff;
}

.btn-outline {
  border-color: #d1d5db;
  color: #374151;
}

.whitelist-credit-hint {
  margin-bottom: 12px;
}

@media (max-width: 720px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
