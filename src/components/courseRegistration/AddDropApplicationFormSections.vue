<script setup>
/**
 * 加退重修申请弹窗分节表单（对齐学籍异动 section-bar）
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import {
  RETAKE_TYPE_OPTIONS,
  ADD_DROP_PRIMARY_TYPES,
  getVisibleAddDropSections,
  buildAddDropSectionBars,
  applyPrimaryTypePatch,
  primaryTypeFromAction,
} from '../../data/courseRegistration/addDropFormSections.js'
import { addDropPrimaryOptionLabelKey } from '../../data/courseRegistration/addDropTypeDisplay.js'
import { retakeHistoryFromCourse, formatGradeToZh } from '../../data/courseRegistration/studentTranscript.js'
import { getPreviousAcademicSession } from '../../data/intakeSets.js'
import {
  getAddDropFormNoteKeys,
  getAddDropFormNotesTitleKey,
  getAddDropDeclarationExtraKey,
} from '../../data/courseRegistration/addDropListColumns.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import {
  CREDIT_FEE_RATES,
  SST_RATE,
  formatAmountRmb,
} from '../../data/courseRegistration/addDropFeeRates.js'
import {
  addDropLineKey,
  buildDropCreditBreakdown,
} from '../../data/courseRegistration/addDropMultiItems.js'
import {
  displayClassTimeVenueFromFields,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import { formatUnifiedCourseCategoryFromLine } from '../../data/courseRegistration/unifiedCourseCategory.js'
import {
  getCourseById,
  getCourseByCode,
} from '../../data/courseRegistration/selectableCourses.js'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import AddDropTermCreditStrip from './AddDropTermCreditStrip.vue'

const MAX_DROP_ATTACHMENTS = 5

function formatAttachSize(bytes) {
  const n = Number(bytes) || 0
  if (n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

const props = defineProps({
  form: { type: Object, required: true },
  studentFields: { type: Object, required: true },
  academicSessionOptions: { type: Array, default: () => [] },
  availableActionOptions: { type: Array, default: () => [] },
  /** 由列表 Tab 锁定类型时只读展示，不可切换（已废弃 Tab；默认 false） */
  actionLocked: { type: Boolean, default: false },
  /** 主类型三选一（加/退/重修）；缺省从 availableActionOptions 推导 */
  availablePrimaryOptions: { type: Array, default: () => [] },
  /** 当前主类型是否允许勾选「同时退课」 */
  canLinkDrop: { type: Boolean, default: true },
  /** 已解析的主课 / 加课 / 退课对象 */
  primaryCourse: { type: Object, default: null },
  dropCourse: { type: Object, default: null },
  addCourse: { type: Object, default: null },
  /** 费用试算汇总 { items, total } */
  feeEstimate: { type: Object, default: null },
  /** 学期三卡学分条 { ge, me, mandatory } */
  termCreditStrip: { type: Object, default: null },
  /** 净学分超出学期上限（当前 − 拟退 + 拟加/重修 − 上限） */
  termCreditExcess: { type: Number, default: 0 },
})

const emit = defineEmits([
  'update:form',
  'pick-course',
  'attachments-add',
  'remove-attachment',
  'clear-attachments',
])

const { t, isZh } = useAppI18n()
const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const formAttachments = computed(() => {
  const list = Array.isArray(props.form.attachments) ? props.form.attachments : []
  if (list.length) return list
  if (props.form.attachmentName) return [{ name: props.form.attachmentName, size: 0 }]
  return []
})

function onAttachInputChange(event) {
  const files = Array.from(event.target.files || [])
  emit('attachments-add', files)
  event.target.value = ''
}

function timeVenueDisplay(fields) {
  return displayClassTimeVenueFromFields(
    {
      time: fields?.time,
      classTime: fields?.classTime,
      venue: fields?.venue,
      room: fields?.venue,
      weekRange: fields?.weekRange,
      meetings: fields?.meetings,
    },
    timeLocale.value,
  )
}

function timeVenueLines(fields) {
  const text = timeVenueDisplay(fields)
  if (!text || text === '—') return []
  return String(text)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const sections = computed(() => getVisibleAddDropSections(props.form.action))
const sectionBars = computed(() => buildAddDropSectionBars(props.form.action, t))
const noteKeys = computed(() => getAddDropFormNoteKeys(props.form.action))
const notesTitleKey = computed(() => getAddDropFormNotesTitleKey(props.form.action))
const declarationExtraKey = computed(() => getAddDropDeclarationExtraKey(props.form.action))

const primaryType = computed(
  () => props.form.primaryType || primaryTypeFromAction(props.form.action),
)

const primaryOptions = computed(() => {
  const raw = props.availablePrimaryOptions.length
    ? props.availablePrimaryOptions
    : props.availableActionOptions.length
      ? props.availableActionOptions
      : [...ADD_DROP_PRIMARY_TYPES]
  const set = new Set()
  for (const opt of raw) {
    if (opt === 'Add' || opt === 'AddDrop') set.add('Add')
    else if (opt === 'Drop') set.add('Drop')
    else if (opt === 'Retake' || opt === 'RetakeDrop') set.add('Retake')
  }
  return ADD_DROP_PRIMARY_TYPES.filter((p) => set.has(p))
})

const showNeedDropConfirm = computed(
  () => primaryType.value === 'Add' || primaryType.value === 'Retake',
)

const isAddDropLinked = computed(() => props.form.action === 'AddDrop')
const isRetakeDropLinked = computed(() => props.form.action === 'RetakeDrop')
const usesDropSlot = computed(() => isAddDropLinked.value || isRetakeDropLinked.value)

const addCourseCredits = computed(() => {
  const lines = props.form.addLines || []
  if (lines.length) {
    return String(lines.reduce((s, l) => s + (Number(l.credits) || 0), 0))
  }
  const course =
    isAddDropLinked.value ? props.addCourse : props.primaryCourse
  const n = course?.credits
  return n == null || n === '' ? '' : String(n)
})

const dropCreditBreakdown = computed(() => {
  const raw = buildDropCreditBreakdown(props.form.dropLines || [])
  return {
    total: String(raw.total),
    mandatory: String(raw.mandatory),
    me: String(raw.me),
    ge: String(raw.ge),
  }
})

const hasDropLines = computed(() => (props.form.dropLines || []).length > 0)

/**
 * 明细「课程类型」：统一类别（必修课 / GE01–04 / ME01–04）
 * @param {object|null|undefined} line
 */
function lineTypeLabel(line) {
  return formatUnifiedCourseCategoryFromLine(line, t, {
    getCourseById,
    getCourseByCode,
  })
}

/** 加课/重修节展示的预估费用（未选课为 —；选课后含 0；= 课程费 + SST） */
const sectionFeeAmount = computed(() => {
  const action = props.form.action
  if (action === 'Drop') return ''
  const lines = props.form.addLines || []
  if (!lines.length) {
    const course = isAddDropLinked.value ? props.addCourse : props.primaryCourse
    if (!course) return ''
  }
  const est = props.feeEstimate
  if (est?.payableTotal != null && est.payableTotal !== '') {
    return formatAmountRmb(est.payableTotal)
  }
  if (est?.total != null && est.total !== '') {
    const sst = Number(est.sstAmount) || 0
    return formatAmountRmb(Number(est.total) + sst)
  }
  return formatAmountRmb(0)
})

/** SST：国际生对预估费用加收；无费用或本地生为 0 */
const sectionSstAmount = computed(() => {
  const action = props.form.action
  if (action === 'Drop') return ''
  const lines = props.form.addLines || []
  if (!lines.length) {
    const course = isAddDropLinked.value ? props.addCourse : props.primaryCourse
    if (!course) return ''
  }
  const sst = Number(props.feeEstimate?.sstAmount)
  return formatAmountRmb(Number.isFinite(sst) ? Math.max(0, sst) : 0)
})

function hasAddOrRetakeLines() {
  const lines = props.form.addLines || []
  if (lines.length) return true
  const course = isAddDropLinked.value ? props.addCourse : props.primaryCourse
  return Boolean(course)
}

/** 学期超出：仅学分条 GE/ME 学期总分（由父级传入） */
const sectionTermExcessCredits = computed(() => {
  const action = props.form.action
  if (action === 'Drop') return ''
  if (!hasAddOrRetakeLines() && !(Number(props.termCreditExcess) > 0)) return ''
  return String(Math.max(0, Number(props.termCreditExcess) || 0))
})

/** 毕业超出（计费）：feeEstimate.billableCredits */
const sectionGradExcessCredits = computed(() => {
  const action = props.form.action
  if (action === 'Drop') return ''
  if (!hasAddOrRetakeLines()) return ''
  const fromItems = (props.feeEstimate?.items || []).reduce(
    (s, i) => s + (Number(i.billableCredits) || 0),
    0,
  )
  const billable = Number(props.feeEstimate?.billableCredits)
  const billableN = Number.isFinite(billable) ? Math.max(0, billable) : Math.max(0, fromItems)
  return String(billableN)
})

const feeRateTipText = computed(() =>
  t('courseRegistration.student.feeRateTip', {
    arts: CREDIT_FEE_RATES.arts,
    science: CREDIT_FEE_RATES.science,
    business: CREDIT_FEE_RATES.business,
  }),
)

const sstTipText = computed(() =>
  t('courseRegistration.student.sstTip', { rate: Math.round(SST_RATE * 100) }),
)

const hasFeeBoxContent = computed(
  () =>
    Number(props.feeEstimate?.total) > 0 ||
    Number(props.feeEstimate?.sstAmount) > 0 ||
    (props.feeEstimate?.items || []).length > 0,
)

/** 加课/联合加退：费用块放在补充说明上方 */
const showInlineAddFeeBox = computed(
  () =>
    (props.form.action === 'Add' || isAddDropLinked.value) && hasFeeBoxContent.value,
)

/** 重修 / 重修关联：费用块仍在声明前 */
const showBottomFeeBox = computed(
  () =>
    (props.form.action === 'Retake' || isRetakeDropLinked.value) && hasFeeBoxContent.value,
)

function sectionFields(mode) {
  const f = props.form
  if (mode === 'drop') {
    // 关联退课槽位只用 drop*，避免误显主课（重修）已选分组/课表
    if (usesDropSlot.value) {
      return {
        sectionId: f.dropSectionId || '',
        groupNo: f.dropSectionCode || '',
        groupName: f.dropSectionName || '',
        weekRange: f.dropWeekRange || '',
        classTime: f.dropClassTime || '',
        venue: f.dropVenue || '',
        lecturers: f.dropLecturers || '',
        time: f.dropTime || '',
        meetings: f.dropMeetings || null,
        classTimeVenue: f.dropClassTimeVenue || '',
      }
    }
    return {
      sectionId: f.dropSectionId || f.sectionId,
      groupNo: f.dropSectionCode || f.sectionCode,
      groupName: f.dropSectionName || f.sectionName,
      weekRange: f.dropWeekRange || f.weekRange,
      classTime: f.dropClassTime || f.classTime,
      venue: f.dropVenue || f.venue,
      lecturers: f.dropLecturers || f.lecturers,
      time: f.dropTime || f.time,
      meetings: f.dropMeetings || f.meetings,
      classTimeVenue: f.dropClassTimeVenue || f.classTimeVenue,
    }
  }
  if (mode === 'add') {
    return {
      sectionId: f.addSectionId || f.sectionId,
      groupNo: f.addSectionCode || f.sectionCode,
      groupName: f.addSectionName || f.sectionName,
      weekRange: f.addWeekRange || f.weekRange,
      classTime: f.addClassTime || f.classTime,
      venue: f.addVenue || f.venue,
      lecturers: f.addLecturers || f.lecturers,
      time: f.addTime || f.time,
      meetings: f.addMeetings || f.meetings,
      classTimeVenue: f.addClassTimeVenue || f.classTimeVenue,
    }
  }
  return {
    sectionId: f.sectionId,
    groupNo: f.sectionCode,
    groupName: f.sectionName,
    weekRange: f.weekRange,
    classTime: f.classTime,
    venue: f.venue,
    lecturers: f.lecturers,
    time: f.time,
    meetings: f.meetings,
    classTimeVenue: f.classTimeVenue,
  }
}

const dropFields = computed(() =>
  sectionFields(usesDropSlot.value ? 'drop' : 'primary'),
)
const addFields = computed(() =>
  sectionFields(isAddDropLinked.value ? 'add' : 'primary'),
)
const primaryFields = computed(() => sectionFields('primary'))

const primaryLabel = computed(() => {
  if (!props.primaryCourse) return ''
  return `${props.primaryCourse.code} — ${props.primaryCourse.name}`
})
const dropLabel = computed(() => {
  if (!props.dropCourse) return ''
  return `${props.dropCourse.code} — ${props.dropCourse.name}`
})
const addLabel = computed(() => {
  if (!props.addCourse) return ''
  return `${props.addCourse.code} — ${props.addCourse.name}`
})

function patch(partial) {
  emit('update:form', { ...props.form, ...partial })
}

function onField(key, event) {
  const value = event?.target ? event.target.value : event
  if (key === 'primaryType') {
    emit('update:form', applyPrimaryTypePatch(props.form, { primaryType: value }))
    return
  }
  if (key === 'needDrop') {
    emit('update:form', applyPrimaryTypePatch(props.form, { needDrop: value }))
    return
  }
  if (key === 'retakeType') {
    const prev = props.form.retakeType || ''
    // 候选池不同：仅清空重修课；保留电话 / 是否退课 / 退课清单 / 备注
    const poolChanged = prev && value && prev !== value
    if (poolChanged) {
      patch({
        retakeType: value,
        addLines: [],
        courseId: '',
        sectionId: '',
        sectionCode: '',
        sectionName: '',
        classTime: '',
        weekRange: '',
        venue: '',
        lecturers: '',
        meetings: null,
        transcriptId: '',
        previouslyTakenCourse: '',
        gradeEarned: '',
        academicSessionTaken: getPreviousAcademicSession(props.form.academicSession),
        previousCourseGradesText: '',
      })
      return
    }
    patch({ retakeType: value })
    return
  }
  patch({ [key]: value })
}

const canPickRetakeCourse = computed(() => {
  const tpe = props.form.retakeType
  return tpe === 'failed' || tpe === 'improve_grade'
})

const isRetakeFailedType = computed(() => props.form.retakeType === 'failed')

function lineLatestGradeZh(line) {
  if (line?.latestGradeZh) return line.latestGradeZh
  if (line?.latestGradeScore != null && line.latestGradeScore !== '') {
    return formatGradeToZh({ grade: line.latestGrade, score: line.latestGradeScore }) || '—'
  }
  if (line?.latestGrade) return formatGradeToZh(line.latestGrade) || '—'
  const hist = retakeHistoryFromCourse(
    { id: line?.courseId, code: line?.courseCode, name: line?.courseName },
    props.form.academicSession,
  )
  if (hist.latestGradeZh) return hist.latestGradeZh
  const g = hist.latestGrade || hist.gradeEarned
  return g ? formatGradeToZh({ grade: g, score: hist.latestGradeScore }) || g : '—'
}

/** 行内曾修课程成绩（多学期分行） */
function linePreviousCourseGrades(line) {
  const raw = String(line?.previousCourseGradesText || '').trim()
  if (raw) return raw
  const hist = retakeHistoryFromCourse(
    { id: line?.courseId, code: line?.courseCode, name: line?.courseName },
    props.form.academicSession,
  )
  return String(hist.previousCourseGradesText || '').trim()
}

function onCheckbox(key, event) {
  patch({ [key]: Boolean(event.target.checked) })
}

function dash(v) {
  return v && String(v).trim() ? v : '—'
}

function lineKey(line) {
  return addDropLineKey(line)
}

function lineTimeVenue(line) {
  return (
    displayClassTimeVenueFromFields(
      {
        time: line?.time,
        classTime: line?.classTime,
        venue: line?.venue,
        room: line?.venue,
        weekRange: line?.weekRange,
        meetings: line?.meetings,
      },
      timeLocale.value,
    ) || '—'
  )
}

function lineTimeVenueLines(line) {
  const text = lineTimeVenue(line)
  if (!text || text === '—') return []
  return String(text)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function lineTimeVenueTitle(line) {
  const lines = lineTimeVenueLines(line)
  return lines.length ? lines.join('\n') : ''
}

function removeLine(listKey, line) {
  const key = lineKey(line)
  const nextList = (props.form[listKey] || []).filter((l) => lineKey(l) !== key)
  patch({ [listKey]: nextList })
}

function feeStreamLabel(stream) {
  if (!stream) return ''
  return t(`courseRegistration.student.feeStream.${stream}`)
}
</script>

<template>
  <div class="adddrop-sections">
    <div class="adddrop-sections__pin">
      <CourseRegistrationCallout variant="rule">
        <p class="notes-title">{{ t(notesTitleKey) }}</p>
        <ol class="notes-list">
          <li v-for="key in noteKeys" :key="key">{{ t(key) }}</li>
        </ol>
      </CourseRegistrationCallout>

      <div v-if="termCreditStrip" class="adddrop-form-credit-strip">
        <AddDropTermCreditStrip
          :strip="termCreditStrip"
          :application-type="form.action"
        />
      </div>
    </div>

    <div class="adddrop-sections__scroll">
    <div class="section-bar">{{ t('courseRegistration.student.sectionCommon') }}</div>
    <div class="form-grid">
      <div class="form-field">
        <label>
          {{ t('courseRegistration.batch.academicSession') }}
          <span class="required">*</span>
        </label>
        <input
          type="text"
          class="form-control"
          readonly
          disabled
          :value="form.academicSession || '—'"
        />
      </div>
      <div class="form-field">
        <label>
          {{ t('courseRegistration.approval.typeLabel') }}
          <span class="required">*</span>
        </label>
        <input
          v-if="actionLocked"
          type="text"
          class="form-control"
          readonly
          :value="
            primaryType
              ? t(addDropPrimaryOptionLabelKey(primaryType))
              : t('common.pleaseSelect')
          "
        />
        <select
          v-else
          class="form-control"
          :value="primaryType"
          @change="onField('primaryType', $event)"
        >
          <option value="">{{ t('common.pleaseSelect') }}</option>
          <option v-for="opt in primaryOptions" :key="opt" :value="opt">
            {{ t(addDropPrimaryOptionLabelKey(opt)) }}
          </option>
        </select>
      </div>
      <!-- 重修：类型左 | 是否退课右 -->
      <template v-if="primaryType === 'Retake' && showNeedDropConfirm">
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.retakeTypeLabel') }}
            <span class="required">*</span>
          </label>
          <select
            class="form-control"
            :value="form.retakeType"
            @change="onField('retakeType', $event)"
          >
            <option v-for="opt in RETAKE_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ t(opt.labelKey) }}
            </option>
          </select>
          <p class="field-hint">{{ t('courseRegistration.student.retakeTypeFirstHint') }}</p>
        </div>
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.needDropLabel') }}
            <span class="required">*</span>
          </label>
          <div class="radio-row">
            <label class="radio-option">
              <input
                type="radio"
                name="needDrop"
                value="yes"
                :checked="form.needDrop === 'yes'"
                :disabled="actionLocked || !canLinkDrop"
                @change="onField('needDrop', 'yes')"
              />
              {{ t('common.yes') }}
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="needDrop"
                value="no"
                :checked="form.needDrop === 'no'"
                :disabled="actionLocked"
                @change="onField('needDrop', 'no')"
              />
              {{ t('common.no') }}
            </label>
          </div>
          <p v-if="!canLinkDrop" class="field-hint">
            {{ t('courseRegistration.student.needDropNotAllowed') }}
          </p>
        </div>
      </template>
      <div v-else-if="showNeedDropConfirm" class="form-field span-2">
        <label>
          {{ t('courseRegistration.student.needDropLabel') }}
          <span class="required">*</span>
        </label>
        <div class="radio-row">
          <label class="radio-option">
            <input
              type="radio"
              name="needDrop"
              value="yes"
              :checked="form.needDrop === 'yes'"
              :disabled="actionLocked || !canLinkDrop"
              @change="onField('needDrop', 'yes')"
            />
            {{ t('common.yes') }}
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="needDrop"
              value="no"
              :checked="form.needDrop === 'no'"
              :disabled="actionLocked"
              @change="onField('needDrop', 'no')"
            />
            {{ t('common.no') }}
          </label>
        </div>
        <p v-if="!canLinkDrop" class="field-hint">
          {{ t('courseRegistration.student.needDropNotAllowed') }}
        </p>
      </div>
    </div>

    <div class="section-bar">{{ sectionBars.student }}</div>
    <div class="form-grid">
      <div class="form-field">
        <label>{{ t('courseRegistration.student.fieldStudentId') }}</label>
        <input type="text" class="form-control" readonly :value="studentFields.studentId" />
      </div>
      <div class="form-field">
        <label>{{ t('courseRegistration.student.fieldStudentName') }}</label>
        <input type="text" class="form-control" readonly :value="studentFields.studentName" />
      </div>
      <div class="form-field">
        <label>{{ t('courseRegistration.student.fieldProgramme') }}</label>
        <input type="text" class="form-control" readonly :value="studentFields.programme" />
      </div>
      <div class="form-field">
        <label>
          {{ t('courseRegistration.student.contactPhone') }}
          <span class="required">*</span>
        </label>
        <input
          type="text"
          class="form-control"
          :value="form.contactPhone"
          :placeholder="t('courseRegistration.student.contactPhonePlaceholder')"
          @input="onField('contactPhone', $event)"
        />
      </div>
    </div>

    <!-- Section III Drop（AddDrop / RetakeDrop 时先退课） -->
    <template v-if="sections.showIII">
      <div class="section-bar">{{ sectionBars.drop }}</div>
      <div class="form-grid">
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.dropCourse') }}
            <span class="required">*</span>
          </label>
          <div class="lines-toolbar">
            <button
              type="button"
              class="btn btn-primary"
              @click="emit('pick-course', usesDropSlot ? 'drop' : 'primary')"
            >
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
          </div>
          <div class="lines-table-wrap">
            <table class="lines-table">
              <thead>
                <tr>
                  <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                  <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                  <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                  <th class="col-type">{{ t('courseRegistration.courses.type') }}</th>
                  <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                  <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
                  <th class="col-op">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in form.dropLines || []" :key="lineKey(line)">
                  <td class="col-code" :title="line.courseCode">{{ line.courseCode }}</td>
                  <td class="col-name" :title="line.courseName">{{ line.courseName }}</td>
                  <td
                    class="col-group"
                    :title="formatCourseSectionName(line.sectionCode || line.sectionName, t)"
                  >
                    {{ formatCourseSectionName(line.sectionCode || line.sectionName, t) }}
                  </td>
                  <td class="col-type" :title="lineTypeLabel(line)">{{ lineTypeLabel(line) }}</td>
                  <td class="col-credits">{{ line.credits }}</td>
                  <td class="cr-time-venue col-time" :title="lineTimeVenueTitle(line)">
                    <template v-if="lineTimeVenueLines(line).length">
                      <div
                        v-for="(tv, li) in lineTimeVenueLines(line)"
                        :key="li"
                        class="cr-time-venue-line"
                        :title="tv"
                      >
                        {{ tv }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="col-op op-cell">
                    <button type="button" class="link-btn" @click="removeLine('dropLines', line)">
                      {{ t('common.remove') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!(form.dropLines || []).length">
                  <td colspan="7" class="empty-cell">{{ t('courseRegistration.student.selectCourse') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="hasDropLines" class="form-field span-2 fields-row-2">
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldDropTotalCredits') }}</label>
            <input type="text" class="form-control" readonly :value="dropCreditBreakdown.total" />
          </div>
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldDropMandatoryCredits') }}</label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dropCreditBreakdown.mandatory"
            />
          </div>
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldDropMeCredits') }}</label>
            <input type="text" class="form-control" readonly :value="dropCreditBreakdown.me" />
          </div>
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldDropGeCredits') }}</label>
            <input type="text" class="form-control" readonly :value="dropCreditBreakdown.ge" />
          </div>
        </div>
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.dropReason') }}
            <span class="required">*</span>
          </label>
          <textarea
            class="form-control"
            rows="3"
            :value="form.dropReason"
            :placeholder="t('courseRegistration.student.dropReasonPlaceholder')"
            @input="onField('dropReason', $event)"
          />
        </div>
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.dropAttachment') }}
            <span class="optional">（{{ t('courseRegistration.student.dropAttachmentOptional') }}）</span>
          </label>
          <div class="attach-row">
            <label
              class="btn attach-btn attach-btn--soft"
              :class="{ 'is-disabled': formAttachments.length >= MAX_DROP_ATTACHMENTS }"
            >
              {{ t('courseRegistration.student.chooseFile') }}
              <input
                type="file"
                class="attach-input"
                multiple
                :disabled="formAttachments.length >= MAX_DROP_ATTACHMENTS"
                accept=".pdf,.jpg,.jpeg,.png,.docx,application/pdf,image/*"
                @change="onAttachInputChange"
              />
            </label>
            <span v-if="!formAttachments.length" class="attach-name">
              {{ t('courseRegistration.student.noFileChosen') }}
            </span>
            <button
              v-if="formAttachments.length"
              type="button"
              class="link-btn"
              @click="emit('clear-attachments')"
            >
              {{ t('courseRegistration.student.clearFile') }}
            </button>
          </div>
          <ul v-if="formAttachments.length" class="attach-list">
            <li v-for="(file, idx) in formAttachments" :key="`${file.name}-${idx}`" class="attach-list-item">
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
                @click="emit('remove-attachment', idx)"
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
    </template>

    <!-- Section II Add -->
    <template v-if="sections.showII">
      <div class="section-bar">{{ sectionBars.add }}</div>
      <div class="form-grid">
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.addCourse') }}
            <span class="required">*</span>
          </label>
          <div class="lines-toolbar">
            <button
              type="button"
              class="btn btn-primary"
              @click="emit('pick-course', isAddDropLinked ? 'add' : 'primary')"
            >
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
          </div>
          <div class="lines-table-wrap">
            <table class="lines-table">
              <thead>
                <tr>
                  <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                  <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                  <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                  <th class="col-type">{{ t('courseRegistration.courses.type') }}</th>
                  <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                  <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
                  <th class="col-op">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in form.addLines || []" :key="lineKey(line)">
                  <td class="col-code" :title="line.courseCode">{{ line.courseCode }}</td>
                  <td class="col-name" :title="line.courseName">{{ line.courseName }}</td>
                  <td
                    class="col-group"
                    :title="formatCourseSectionName(line.sectionCode || line.sectionName, t)"
                  >
                    {{ formatCourseSectionName(line.sectionCode || line.sectionName, t) }}
                  </td>
                  <td class="col-type" :title="lineTypeLabel(line)">{{ lineTypeLabel(line) }}</td>
                  <td class="col-credits">{{ line.credits }}</td>
                  <td class="cr-time-venue col-time" :title="lineTimeVenueTitle(line)">
                    <template v-if="lineTimeVenueLines(line).length">
                      <div
                        v-for="(tv, li) in lineTimeVenueLines(line)"
                        :key="li"
                        class="cr-time-venue-line"
                        :title="tv"
                      >
                        {{ tv }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="col-op op-cell">
                    <button type="button" class="link-btn" @click="removeLine('addLines', line)">
                      {{ t('common.remove') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!(form.addLines || []).length">
                  <td colspan="7" class="empty-cell">{{ t('courseRegistration.student.selectCourse') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="form-field span-2 fields-row-2">
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldAddTotalCredits') }}</label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(addCourseCredits)"
            />
          </div>
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldTermExcessCredits') }}</label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(sectionTermExcessCredits)"
            />
          </div>
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldGradExcessCredits') }}</label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(sectionGradExcessCredits)"
            />
          </div>
          <div class="form-field">
            <label class="label-with-tip">
              <span>{{ t('courseRegistration.student.fieldSst') }}</span>
              <span
                class="tip-icon"
                :title="sstTipText"
                :aria-label="sstTipText"
                tabindex="0"
              >?</span>
            </label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(sectionSstAmount)"
            />
          </div>
          <div class="form-field">
            <label class="label-with-tip">
              <span>{{ t('courseRegistration.student.feeEstimateShort') }}</span>
              <span
                class="tip-icon"
                :title="feeRateTipText"
                :aria-label="feeRateTipText"
                tabindex="0"
              >?</span>
            </label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(sectionFeeAmount)"
            />
          </div>
        </div>
        <div v-if="showInlineAddFeeBox" class="form-field span-2 fee-box-wrap">
          <div class="fee-box">
            <div class="fee-title">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
            <ul class="fee-list">
              <li v-for="(line, idx) in feeEstimate.items" :key="idx">
                {{ line.courseCode }} · {{ feeStreamLabel(line.feeStream) }} ·
                {{ t('courseRegistration.student.feeBillableCredits', { n: line.billableCredits }) }}
                × {{ formatAmountRmb(line.rate) }} = {{ formatAmountRmb(line.amount) }}
              </li>
              <li>
                {{ t('courseRegistration.student.fieldSst') }}:
                {{ formatAmountRmb(Number(feeEstimate.sstAmount) || 0) }}
              </li>
            </ul>
            <p class="fee-total">
              {{ t('courseRegistration.student.feeEstimateTotal') }}:
              <strong>{{ formatAmountRmb(feeEstimate.payableTotal ?? feeEstimate.total) }}</strong>
            </p>
          </div>
        </div>
        <div class="form-field span-2">
          <label>{{ t('courseRegistration.student.addNotesLabel') }}</label>
          <textarea
            class="form-control"
            rows="2"
            :value="form.addNotes"
            :placeholder="t('courseRegistration.student.addNotesPlaceholder')"
            @input="onField('addNotes', $event)"
          />
        </div>
      </div>
    </template>

    <!-- Section IV Retake -->
    <template v-if="sections.showIV">
      <div class="section-bar">{{ sectionBars.retake }}</div>
      <div class="form-grid">
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.retakeCourse') }}
            <span class="required">*</span>
          </label>
          <div class="lines-toolbar">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canPickRetakeCourse"
              @click="emit('pick-course', 'primary')"
            >
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
            <span v-if="!canPickRetakeCourse" class="field-hint inline-hint">
              {{ t('courseRegistration.student.retakeTypeRequired') }}
            </span>
          </div>
          <div class="lines-table-wrap">
            <table class="lines-table">
              <thead>
                <tr>
                  <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                  <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                  <th v-if="isRetakeFailedType" class="col-grade">
                    {{ t('courseRegistration.student.retakeLatestGrade') }}
                  </th>
                  <th v-else-if="canPickRetakeCourse" class="col-grade">
                    {{ t('courseRegistration.student.retakeOriginalGrade') }}
                  </th>
                  <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                  <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                  <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
                  <th class="col-type">{{ t('courseRegistration.courses.type') }}</th>
                  <th class="col-prev-grades">{{ t('courseRegistration.student.previousCourseGrades') }}</th>
                  <th class="col-op">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in form.addLines || []" :key="lineKey(line)">
                  <td class="col-code" :title="line.courseCode">{{ line.courseCode }}</td>
                  <td class="col-name" :title="line.courseName">{{ line.courseName }}</td>
                  <td v-if="canPickRetakeCourse" class="col-grade">{{ lineLatestGradeZh(line) }}</td>
                  <td
                    class="col-group"
                    :title="formatCourseSectionName(line.sectionCode || line.sectionName, t)"
                  >
                    {{ formatCourseSectionName(line.sectionCode || line.sectionName, t) }}
                  </td>
                  <td class="col-credits">{{ line.credits }}</td>
                  <td class="cr-time-venue col-time" :title="lineTimeVenueTitle(line)">
                    <template v-if="lineTimeVenueLines(line).length">
                      <div
                        v-for="(tv, li) in lineTimeVenueLines(line)"
                        :key="li"
                        class="cr-time-venue-line"
                        :title="tv"
                      >
                        {{ tv }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="col-type" :title="lineTypeLabel(line)">{{ lineTypeLabel(line) }}</td>
                  <td class="col-prev-grades">
                    <template v-if="linePreviousCourseGrades(line)">
                      <div
                        v-for="(gl, gi) in linePreviousCourseGrades(line).split('\n')"
                        :key="gi"
                        class="prev-grade-line"
                      >
                        {{ gl }}
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="col-op op-cell">
                    <button type="button" class="link-btn" @click="removeLine('addLines', line)">
                      {{ t('common.remove') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!(form.addLines || []).length">
                  <td :colspan="canPickRetakeCourse ? 9 : 8" class="empty-cell">
                    {{ t('courseRegistration.student.retakeCoursePlaceholder') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="field-hint">{{ t('courseRegistration.student.retakeCourseHint') }}</p>
        </div>
        <div class="form-field span-2 fields-row-2">
          <div class="form-field">
            <label>{{ t('courseRegistration.student.fieldRetakeTotalCredits') }}</label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(addCourseCredits)"
            />
          </div>
          <div class="form-field">
            <label class="label-with-tip">
              <span>{{ t('courseRegistration.student.fieldSst') }}</span>
              <span
                class="tip-icon"
                :title="sstTipText"
                :aria-label="sstTipText"
                tabindex="0"
              >?</span>
            </label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(sectionSstAmount)"
            />
          </div>
          <div class="form-field">
            <label class="label-with-tip">
              <span>{{ t('courseRegistration.student.feeEstimateShort') }}</span>
              <span
                class="tip-icon"
                :title="feeRateTipText"
                :aria-label="feeRateTipText"
                tabindex="0"
              >?</span>
            </label>
            <input
              type="text"
              class="form-control"
              readonly
              :value="dash(sectionFeeAmount)"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-if="showBottomFeeBox" class="fee-box">
      <div class="fee-title">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
      <ul class="fee-list">
        <li v-for="(line, idx) in feeEstimate.items" :key="idx">
          {{ line.courseCode }} · {{ feeStreamLabel(line.feeStream) }} ·
          {{ t('courseRegistration.student.feeBillableCredits', { n: line.billableCredits }) }}
          × {{ formatAmountRmb(line.rate) }} = {{ formatAmountRmb(line.amount) }}
        </li>
        <li>
          {{ t('courseRegistration.student.fieldSst') }}:
          {{ formatAmountRmb(Number(feeEstimate.sstAmount) || 0) }}
        </li>
      </ul>
      <p class="fee-total">
        {{ t('courseRegistration.student.feeEstimateTotal') }}:
        <strong>{{ formatAmountRmb(feeEstimate.payableTotal ?? feeEstimate.total) }}</strong>
      </p>
    </div>

    <div
      v-if="form.action === 'Retake' || isRetakeDropLinked"
      class="form-field span-2 retake-notes-field"
    >
      <label>{{ t('courseRegistration.student.addNotesLabel') }}</label>
      <textarea
        class="form-control"
        rows="2"
        :value="form.addNotes"
        :placeholder="t('courseRegistration.student.addNotesPlaceholder')"
        @input="onField('addNotes', $event)"
      />
    </div>

    <div class="section-bar">{{ sectionBars.declaration }}</div>
    <div class="declaration-box">
      <p class="declaration-extra">{{ t(declarationExtraKey) }}</p>
      <p class="declaration-text">{{ t('courseRegistration.student.declarationText') }}</p>
      <label class="checkbox-row">
        <input
          type="checkbox"
          :checked="form.declarationAgreed"
          @change="onCheckbox('declarationAgreed', $event)"
        />
        <span>
          {{ t('courseRegistration.student.declarationAgree') }}
          <span class="required">*</span>
        </span>
      </label>
    </div>
    </div>
  </div>
</template>

<style scoped>
.adddrop-sections {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.adddrop-sections__pin {
  flex: 0 0 auto;
  background: #fff;
  z-index: 2;
  padding-bottom: 4px;
}

.adddrop-sections__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: 4px;
}

.notes-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}

.notes-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  line-height: 1.55;
  color: #4b5563;
}

.notes-list li + li {
  margin-top: 4px;
}

.adddrop-form-credit-strip {
  margin: 12px 0 4px;
}

.adddrop-sections :deep(.cr-callout) {
  font-size: 12px;
}

.section-bar {
  background: #f3f4f6;
  padding: 8px 12px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #1f2937;
  margin: 16px 0 12px;
  border-radius: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.span-2 {
  grid-column: span 2;
}

.fields-row-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 16px;
}

.fields-row-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.fields-row-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-field label {
  font-size: 13px;
  color: #374151;
  font-weight: 600;
}

.label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #9ca3af;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  cursor: help;
  flex-shrink: 0;
}

.required {
  color: #ef4444;
}

.optional {
  font-weight: 400;
  color: #6b7280;
}

.form-control {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  background: #fff;
  color: #111827;
  box-sizing: border-box;
}

select.form-control {
  height: 38px;
  min-height: 38px;
  line-height: 1.25;
}

.form-control[readonly] {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #e5e7eb;
  cursor: default;
}

textarea.form-control {
  resize: vertical;
  min-height: 72px;
}

.cr-time-venue-input {
  white-space: pre-line;
  line-height: 1.4;
  min-height: 64px;
}

.course-trigger {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.course-trigger .form-control {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.lines-toolbar {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.lines-toolbar .inline-hint {
  margin: 0;
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

.lines-table .empty-cell {
  color: #9ca3af;
  text-align: center;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

.lines-table .col-code {
  width: 11%;
}

.lines-table .col-name {
  width: 16%;
}

.lines-table .col-group {
  width: 12%;
}

.lines-table .col-type {
  width: 10%;
  min-width: 5.5em;
  white-space: nowrap;
}

.lines-table .col-grade {
  width: 8%;
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

.lines-table .col-credits {
  width: 6%;
}

.lines-table .col-time {
  width: 28%;
}

.lines-table .col-op {
  width: 7%;
}

.lines-table .op-cell {
  overflow: visible;
  text-overflow: clip;
}

.lines-table .cr-time-venue {
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
}

.lines-table .cr-time-venue-line {
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lines-table .cr-time-venue-line + .cr-time-venue-line {
  margin-top: 1px;
}

.btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-default {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
.btn-primary {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}
.btn-primary:disabled {
  border-color: #93c5fd;
  background: #93c5fd;
  color: #fff;
  cursor: not-allowed;
}

.radio-row {
  display: flex;
  gap: 16px;
  align-items: center;
  min-height: 38px;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
}

.attach-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.attach-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
}

.attach-btn--soft {
  border: 1px solid #93c5fd;
  background: #dbeafe;
  color: #1d4ed8;
}

.attach-btn--soft:hover {
  background: #bfdbfe;
  border-color: #60a5fa;
}

.attach-btn--soft.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.attach-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.attach-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attach-list-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-size: 13px;
  color: #374151;
}

.attach-size {
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.attach-remove {
  color: #b91c1c;
}

.attach-name {
  font-size: 13px;
  color: #4b5563;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
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
  cursor: pointer;
  flex-wrap: nowrap;
}

.checkbox-row input {
  flex-shrink: 0;
  margin: 0;
}

.checkbox-row span {
  font-weight: 600;
  line-height: 1.3;
}

.fee-box-wrap {
  margin: 0;
}

.fee-box-wrap .fee-box {
  margin: 0;
}

.fee-box {
  margin: 16px 0 0;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.retake-notes-field {
  margin: 16px 0 0;
}

.fee-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.fee-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.fee-total {
  margin: 8px 0 0;
  font-size: 14px;
  color: #0f172a;
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.span-2 {
    grid-column: span 1;
  }

  .fields-row-2,
  .fields-row-3,
  .fields-row-4 {
    grid-template-columns: 1fr;
  }
}
</style>
