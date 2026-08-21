<script setup>
/**
 * 加退重修申请弹窗分节表单（对齐学籍异动 section-bar）
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import {
  RETAKE_TYPE_OPTIONS,
  GRADE_EARNED_OPTIONS,
  PREVIOUS_SESSION_OPTIONS,
  getVisibleAddDropSections,
  buildAddDropSectionBars,
  applySectionToForm,
} from '../../data/courseRegistration/addDropFormSections.js'
import {
  getAddDropFormNoteKeys,
  getAddDropFormNotesTitleKey,
  getAddDropDeclarationExtraKey,
} from '../../data/courseRegistration/addDropListColumns.js'
import { getSectionMeetingsConflictInfo } from '../../data/courseRegistration/addDropSectionConflict.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import {
  displayClassTimeVenueFromFields,
} from '../../data/courseRegistration/sectionScheduleFields.js'
import { CREDIT_FEE_RATES, formatAmountRmb } from '../../data/courseRegistration/addDropFeeRates.js'

const props = defineProps({
  form: { type: Object, required: true },
  studentFields: { type: Object, required: true },
  academicSessionOptions: { type: Array, default: () => [] },
  availableActionOptions: { type: Array, default: () => [] },
  /** 由列表 Tab 锁定类型时只读展示，不可切换 */
  actionLocked: { type: Boolean, default: false },
  /** 已解析的主课 / 加课 / 退课对象 */
  primaryCourse: { type: Object, default: null },
  dropCourse: { type: Object, default: null },
  addCourse: { type: Object, default: null },
  /** 费用试算汇总 { items, total } */
  feeEstimate: { type: Object, default: null },
  /** 冲突比对课表基线 */
  scheduleBaseline: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:form',
  'pick-course',
  'attachment-change',
  'clear-attachment',
])

const { t, isZh } = useAppI18n()
const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

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

const sections = computed(() => getVisibleAddDropSections(props.form.action))
const sectionBars = computed(() => buildAddDropSectionBars(props.form.action, t))
const noteKeys = computed(() => getAddDropFormNoteKeys(props.form.action))
const notesTitleKey = computed(() => getAddDropFormNotesTitleKey(props.form.action))
const declarationExtraKey = computed(() => getAddDropDeclarationExtraKey(props.form.action))

const addCourseCredits = computed(() => {
  const course =
    props.form.action === 'AddDrop' ? props.addCourse : props.primaryCourse
  const n = course?.credits
  return n == null || n === '' ? '' : String(n)
})

/** 加课/重修节展示的预估费用（未选课为 —；选课后含 0） */
const sectionFeeAmount = computed(() => {
  const action = props.form.action
  if (action === 'Drop') return ''
  const course = action === 'AddDrop' ? props.addCourse : props.primaryCourse
  if (!course) return ''
  const lines = props.feeEstimate?.lines || props.feeEstimate?.items || []
  const hit = lines.find((i) => i.courseCode === course.code)
  if (hit && hit.amount != null) return formatAmountRmb(hit.amount)
  return formatAmountRmb(0)
})

/** 超出学分（应收学分） */
const sectionExcessCredits = computed(() => {
  const action = props.form.action
  if (action === 'Drop') return ''
  const course = action === 'AddDrop' ? props.addCourse : props.primaryCourse
  if (!course) return ''
  const lines = props.feeEstimate?.lines || props.feeEstimate?.items || []
  const hit = lines.find((i) => i.courseCode === course.code)
  if (hit && hit.billableCredits != null) return String(hit.billableCredits)
  if (props.feeEstimate?.billableCredits != null) return String(props.feeEstimate.billableCredits)
  return '0'
})

const feeRateTipText = computed(() =>
  t('courseRegistration.student.feeRateTip', {
    arts: CREDIT_FEE_RATES.arts,
    science: CREDIT_FEE_RATES.science,
    business: CREDIT_FEE_RATES.business,
  }),
)

const hasFeeBoxContent = computed(
  () =>
    Number(props.feeEstimate?.total) > 0 || (props.feeEstimate?.items || []).length > 0,
)

/** 加课/联合加退：费用块放在补充说明上方 */
const showInlineAddFeeBox = computed(
  () =>
    (props.form.action === 'Add' || props.form.action === 'AddDrop') && hasFeeBoxContent.value,
)

/** 重修：费用块仍在声明前（位置不调整） */
const showBottomFeeBox = computed(
  () => props.form.action === 'Retake' && hasFeeBoxContent.value,
)

function sectionFields(mode) {
  const f = props.form
  if (mode === 'drop') {
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
  sectionFields(props.form.action === 'AddDrop' ? 'drop' : 'primary'),
)
const addFields = computed(() =>
  sectionFields(props.form.action === 'AddDrop' ? 'add' : 'primary'),
)
const primaryFields = computed(() => sectionFields('primary'))

function buildSectionOptions(course, forDrop = false) {
  if (!course) return []
  if (forDrop || course.fromEnrolled) {
    const sec = {
      id: course.sectionId || `enrolled-${course.code || course.id}-01`,
      code: course.sectionCode || '01',
      name: course.sectionName || formatCourseSectionName(course.sectionCode || '01', t),
      time: course.time || '',
      room: course.room || '',
      lecturer: course.lecturer || '',
      weekRange: course.weekRange || '1-18',
      fromEnrolled: true,
      disabled: false,
    }
    return [sec]
  }
  return (course.sections || []).map((sec) => {
    const remaining = Number(sec.capacity) - Number(sec.enrolled)
    const full = Number.isFinite(remaining) && remaining <= 0
    const conflictInfo = getSectionMeetingsConflictInfo(sec, props.scheduleBaseline)
    const disabled = Boolean(full || conflictInfo.conflict)
    let disableReason = ''
    if (conflictInfo.conflict) {
      disableReason = t('courseRegistration.student.sectionConflictReason', {
        course: conflictInfo.withCourse || '—',
        time: conflictInfo.withTime || '—',
      })
    } else if (full) {
      disableReason = t('courseRegistration.student.pickerStatusFull')
    }
    return {
      ...sec,
      name: sec.name || formatCourseSectionName(sec, t),
      weekRange: sec.weekRange || '1-18',
      disabled,
      disableReason,
    }
  })
}

const dropSectionOptions = computed(() =>
  buildSectionOptions(
    props.form.action === 'AddDrop' ? props.dropCourse : props.primaryCourse,
    props.form.action === 'Drop' || props.form.action === 'AddDrop',
  ),
)
const addSectionOptions = computed(() =>
  buildSectionOptions(
    props.form.action === 'AddDrop' ? props.addCourse : props.primaryCourse,
    false,
  ),
)
const primarySectionOptions = computed(() =>
  buildSectionOptions(props.primaryCourse, props.form.action === 'Drop'),
)

function onSelectSection(target, event) {
  const sectionId = event?.target ? event.target.value : event
  const options =
    target === 'drop'
      ? dropSectionOptions.value
      : target === 'add'
        ? addSectionOptions.value
        : primarySectionOptions.value
  const section = options.find((s) => s.id === sectionId)
  if (!section || section.disabled) return
  const course =
    target === 'drop'
      ? props.form.action === 'AddDrop'
        ? props.dropCourse
        : props.primaryCourse
      : target === 'add'
        ? props.form.action === 'AddDrop'
          ? props.addCourse
          : props.primaryCourse
        : props.primaryCourse
  emit('update:form', applySectionToForm(props.form, target, section, course))
}

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

const retakeSessionOptions = computed(() => {
  const values = [
    ...(props.academicSessionOptions || []),
    ...PREVIOUS_SESSION_OPTIONS,
    props.form.academicSessionTaken,
  ].filter(Boolean)
  return [...new Set(values)]
})

const retakeGradeOptions = computed(() => {
  const values = [...GRADE_EARNED_OPTIONS, props.form.gradeEarned].filter(Boolean)
  return [...new Set(values)]
})

function patch(partial) {
  emit('update:form', { ...props.form, ...partial })
}

function onField(key, event) {
  const value = event?.target ? event.target.value : event
  patch({ [key]: value })
}

function onCheckbox(key, event) {
  patch({ [key]: Boolean(event.target.checked) })
}

function dash(v) {
  return v && String(v).trim() ? v : '—'
}

function feeStreamLabel(stream) {
  if (!stream) return ''
  return t(`courseRegistration.student.feeStream.${stream}`)
}
</script>

<template>
  <div class="adddrop-sections">
    <CourseRegistrationCallout variant="rule">
      <p class="notes-title">{{ t(notesTitleKey) }}</p>
      <ol class="notes-list">
        <li v-for="key in noteKeys" :key="key">{{ t(key) }}</li>
      </ol>
    </CourseRegistrationCallout>

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
          :value="t(`courseRegistration.approval.type.${form.action}`)"
        />
        <select
          v-else
          class="form-control"
          :value="form.action"
          @change="onField('action', $event)"
        >
          <option v-for="opt in availableActionOptions" :key="opt" :value="opt">
            {{ t(`courseRegistration.approval.type.${opt}`) }}
          </option>
        </select>
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

    <!-- Section III Drop（AddDrop 时先退课后加课） -->
    <template v-if="sections.showIII">
      <div class="section-bar">{{ sectionBars.drop }}</div>
      <div class="form-grid">
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.dropCourse') }}
            <span class="required">*</span>
          </label>
          <div class="course-trigger">
            <input
              type="text"
              class="form-control"
              readonly
              :value="form.action === 'AddDrop' ? dropLabel : primaryLabel"
              :placeholder="t('courseRegistration.student.selectCourse')"
              @click="emit('pick-course', form.action === 'AddDrop' ? 'drop' : 'primary')"
            />
            <button
              type="button"
              class="btn btn-default"
              @click="emit('pick-course', form.action === 'AddDrop' ? 'drop' : 'primary')"
            >
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
          </div>
        </div>
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.fieldGroupNo') }}
            <span class="required">*</span>
          </label>
          <input
            type="text"
            class="form-control"
            readonly
            :value="
              dropFields.groupName ||
              (dropFields.groupNo ? formatCourseSectionName(dropFields.groupNo, t) : '—')
            "
          />
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldWeekRange') }}</label>
          <input type="text" class="form-control" readonly :value="dash(dropFields.weekRange)" />
        </div>
        <div class="form-field span-2">
          <label>{{ t('courseRegistration.student.fieldClassTimeVenue') }}</label>
          <textarea
            class="form-control cr-time-venue-input"
            readonly
            rows="3"
            :value="dash(timeVenueDisplay(dropFields))"
          />
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldLecturers') }}</label>
          <input type="text" class="form-control" readonly :value="dash(dropFields.lecturers)" />
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
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.feeWaiverLabel') }}
            <span class="required">*</span>
          </label>
          <div class="radio-row" role="radiogroup">
            <label class="radio-option">
              <input
                type="radio"
                value="yes"
                :checked="form.feeWaiver === 'yes'"
                @change="onField('feeWaiver', 'yes')"
              />
              <span>{{ t('courseRegistration.student.feeWaiverYes') }}</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                value="no"
                :checked="form.feeWaiver === 'no'"
                @change="onField('feeWaiver', 'no')"
              />
              <span>{{ t('courseRegistration.student.feeWaiverNo') }}</span>
            </label>
          </div>
        </div>
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.dropAttachment') }}
            <span class="optional">（{{ t('courseRegistration.student.dropAttachmentOptional') }}）</span>
          </label>
          <div class="attach-row">
            <label class="btn btn-default attach-btn">
              {{ t('courseRegistration.student.chooseFile') }}
              <input
                type="file"
                class="attach-input"
                accept=".pdf,.jpg,.jpeg,.png,.docx,application/pdf,image/*"
                @change="emit('attachment-change', $event)"
              />
            </label>
            <span class="attach-name">
              {{ form.attachmentName || t('courseRegistration.student.noFileChosen') }}
            </span>
            <button
              v-if="form.attachmentName"
              type="button"
              class="link-btn"
              @click="emit('clear-attachment')"
            >
              {{ t('courseRegistration.student.clearFile') }}
            </button>
          </div>
          <p class="field-hint">{{ t('courseRegistration.student.dropAttachmentHint') }}</p>
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
          <div class="course-trigger">
            <input
              type="text"
              class="form-control"
              readonly
              :value="form.action === 'AddDrop' ? addLabel : primaryLabel"
              :placeholder="t('courseRegistration.student.selectCourse')"
              @click="emit('pick-course', form.action === 'AddDrop' ? 'add' : 'primary')"
            />
            <button
              type="button"
              class="btn btn-default"
              @click="emit('pick-course', form.action === 'AddDrop' ? 'add' : 'primary')"
            >
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
          </div>
        </div>
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.fieldGroupNo') }}
            <span class="required">*</span>
          </label>
          <select
            class="form-control"
            :value="addFields.sectionId"
            :disabled="!addSectionOptions.length"
            @change="onSelectSection(form.action === 'AddDrop' ? 'add' : 'primary', $event)"
          >
            <option value="">{{ t('courseRegistration.student.sectionSelectPlaceholder') }}</option>
            <option
              v-for="opt in addSectionOptions"
              :key="opt.id"
              :value="opt.id"
              :disabled="opt.disabled"
            >
              {{ opt.name || formatCourseSectionName(opt, t) }}
              {{ opt.disabled ? t('courseRegistration.student.sectionConflictOption') : '' }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldWeekRange') }}</label>
          <input type="text" class="form-control" readonly :value="dash(addFields.weekRange)" />
        </div>
        <div class="form-field span-2">
          <label>{{ t('courseRegistration.student.fieldClassTimeVenue') }}</label>
          <textarea
            class="form-control cr-time-venue-input"
            readonly
            rows="3"
            :value="dash(timeVenueDisplay(addFields))"
          />
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldLecturers') }}</label>
          <input type="text" class="form-control" readonly :value="dash(addFields.lecturers)" />
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldCredits') }}</label>
          <input
            type="text"
            class="form-control"
            readonly
            :value="dash(addCourseCredits)"
          />
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldExcessCredits') }}</label>
          <input
            type="text"
            class="form-control"
            readonly
            :value="dash(sectionExcessCredits)"
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
        <div v-if="showInlineAddFeeBox" class="form-field span-2 fee-box-wrap">
          <div class="fee-box">
            <div class="fee-title">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
            <ul class="fee-list">
              <li v-for="(line, idx) in feeEstimate.items" :key="idx">
                {{ line.courseCode }} · {{ feeStreamLabel(line.feeStream) }} ·
                {{ t('courseRegistration.student.feeBillableCredits', { n: line.billableCredits }) }}
                × {{ formatAmountRmb(line.rate) }} = {{ formatAmountRmb(line.amount) }}
              </li>
            </ul>
            <p class="fee-total">
              {{ t('courseRegistration.student.feeEstimateTotal') }}:
              <strong>{{ formatAmountRmb(feeEstimate.total) }}</strong>
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
          <div class="course-trigger">
            <input
              type="text"
              class="form-control"
              readonly
              :value="primaryLabel"
              :placeholder="t('courseRegistration.student.retakeCoursePlaceholder')"
              @click="emit('pick-course', 'primary')"
            />
            <button type="button" class="btn btn-default" @click="emit('pick-course', 'primary')">
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
          </div>
          <p class="field-hint">{{ t('courseRegistration.student.retakeCourseHint') }}</p>
        </div>
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.gradeEarned') }}
            <span class="required">*</span>
          </label>
          <select
            class="form-control"
            :value="form.gradeEarned"
            @change="onField('gradeEarned', $event)"
          >
            <option value="">{{ t('common.pleaseSelect') }}</option>
            <option v-for="g in retakeGradeOptions" :key="g" :value="g">{{ g }}</option>
          </select>
          <p class="field-hint">{{ t('courseRegistration.student.gradeEarnedHint') }}</p>
        </div>
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.academicSessionTaken') }}
            <span class="required">*</span>
          </label>
          <select
            class="form-control"
            :value="form.academicSessionTaken"
            @change="onField('academicSessionTaken', $event)"
          >
            <option value="">{{ t('common.pleaseSelect') }}</option>
            <option v-for="s in retakeSessionOptions" :key="s" :value="s">{{ s }}</option>
          </select>
          <p class="field-hint">{{ t('courseRegistration.student.academicSessionTakenHint') }}</p>
        </div>
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
            <option value="">{{ t('common.pleaseSelect') }}</option>
            <option v-for="opt in RETAKE_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ t(opt.labelKey) }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.fieldGroupNo') }}
            <span class="required">*</span>
          </label>
          <select
            class="form-control"
            :value="primaryFields.sectionId"
            :disabled="!primarySectionOptions.length"
            @change="onSelectSection('primary', $event)"
          >
            <option value="">{{ t('courseRegistration.student.sectionSelectPlaceholder') }}</option>
            <option
              v-for="opt in primarySectionOptions"
              :key="opt.id"
              :value="opt.id"
              :disabled="opt.disabled"
            >
              {{ opt.name || formatCourseSectionName(opt, t) }}
              {{ opt.disabled ? t('courseRegistration.student.sectionConflictOption') : '' }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldWeekRange') }}</label>
          <input type="text" class="form-control" readonly :value="dash(primaryFields.weekRange)" />
        </div>
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.fieldClassTimeVenue') }}
            <span class="required">*</span>
          </label>
          <textarea
            class="form-control cr-time-venue-input"
            rows="3"
            :value="form.classTimeVenue === '—' ? '' : form.classTimeVenue"
            :placeholder="t('courseRegistration.student.retakeTimeVenuePlaceholder')"
            @input="onField('classTimeVenue', $event)"
          />
          <p class="field-hint">{{ t('courseRegistration.student.retakeTimeVenueHint') }}</p>
        </div>
        <div class="form-field">
          <label>
            {{ t('courseRegistration.student.fieldLecturers') }}
            <span class="required">*</span>
          </label>
          <input
            type="text"
            class="form-control"
            :value="form.lecturers === '—' ? '' : form.lecturers"
            :placeholder="t('courseRegistration.student.retakeLecturersPlaceholder')"
            @input="onField('lecturers', $event)"
          />
          <p class="field-hint">{{ t('courseRegistration.student.retakeLecturersHint') }}</p>
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldCredits') }}</label>
          <input
            type="text"
            class="form-control"
            readonly
            :value="dash(addCourseCredits)"
          />
        </div>
        <div class="form-field">
          <label>{{ t('courseRegistration.student.fieldExcessCredits') }}</label>
          <input
            type="text"
            class="form-control"
            readonly
            :value="dash(sectionExcessCredits)"
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
    </template>

    <div v-if="showBottomFeeBox" class="fee-box">
      <div class="fee-title">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
      <ul class="fee-list">
        <li v-for="(line, idx) in feeEstimate.items" :key="idx">
          {{ line.courseCode }} · {{ feeStreamLabel(line.feeStream) }} ·
          {{ t('courseRegistration.student.feeBillableCredits', { n: line.billableCredits }) }}
          × {{ formatAmountRmb(line.rate) }} = {{ formatAmountRmb(line.amount) }}
        </li>
      </ul>
      <p class="fee-total">
        {{ t('courseRegistration.student.feeEstimateTotal') }}:
        <strong>{{ formatAmountRmb(feeEstimate.total) }}</strong>
      </p>
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
</template>

<style scoped>
.adddrop-sections {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.attach-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
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
}
</style>
