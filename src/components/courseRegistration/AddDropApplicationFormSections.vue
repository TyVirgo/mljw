<script setup>
/**
 * 加退重修申请弹窗分节表单（对齐学籍异动 section-bar）
 */
import { computed, ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import {
  RETAKE_TYPE_OPTIONS,
  getVisibleAddDropSections,
  buildAddDropSectionBars,
  applyIntentFlagsPatch,
} from '../../data/courseRegistration/addDropFormSections.js'
import {
  retakeHistoryFromCourse,
  formatGradeToZh,
  listTranscriptLatestByRetakeType,
  listTranscriptForRetakeCourse,
  formatPreviousCourseGradesText,
} from '../../data/courseRegistration/studentTranscript.js'
import { getPreviousAcademicSession } from '../../data/intakeSets.js'
import {
  getAddDropFormNoteKeys,
  getAddDropFormNotesTitleKey,
  getAddDropDeclarationExtraKey,
} from '../../data/courseRegistration/addDropListColumns.js'
import { formatCourseSectionName } from '../../utils/courseSectionDisplay.js'
import {
  resolveRetakeStudyModeKey,
  studyModeLabel,
} from '../../data/courseRegistration/studyMode.js'
import {
  CREDIT_FEE_RATES,
  SST_RATE,
  formatAmountRmb,
  sumAddGraduationExcessBillable,
  isAddGraduationExcessFeeLine,
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
  /**
   * 退课前学期基线（未扣本单拟退）：含 geCurrent / meCurrent / mandatorySelected
   * 用于「选择」旁退课学分摘要
   */
  termCreditStripBaseline: { type: Object, default: null },
  /** 净学分超出学期上限（当前 − 拟退 + 拟加/重修 − 上限） */
  termCreditExcess: { type: Number, default: 0 },
  /** 学分条基于未审申请估算时展示感叹号 tip */
  showPendingEstimateTip: { type: Boolean, default: false },
  /** 二次申请门控（未审/待缴）：用于展示拦截提示 */
  primaryTypePendingBlocked: { type: Boolean, default: false },
  /** 窗内拦截提示文案（未审/待缴原因） */
  secondApplicationBlockTip: { type: String, default: '' },
  /** 门控时禁用选课等操作（三是否仍可看） */
  formOpsDisabled: { type: Boolean, default: false },
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

const intentFlags = computed(() => ({
  needDrop: props.form.needDrop === 'yes' ? 'yes' : 'no',
  needAdd: props.form.needAdd === 'yes' ? 'yes' : 'no',
  needRetake: props.form.needRetake === 'yes' ? 'yes' : 'no',
}))

const sections = computed(() =>
  getVisibleAddDropSections(props.form.action, intentFlags.value),
)
const sectionBars = computed(() =>
  buildAddDropSectionBars(props.form.action, t, intentFlags.value),
)
const noteKeys = computed(() => getAddDropFormNoteKeys(props.form.action))
const notesTitleKey = computed(() => getAddDropFormNotesTitleKey(props.form.action))
const declarationExtraKey = computed(() => getAddDropDeclarationExtraKey(props.form.action))

const isAddDropLinked = computed(
  () =>
    props.form.action === 'AddDrop' ||
    props.form.action === 'AddDropRetake' ||
    (props.form.needAdd === 'yes' && props.form.needDrop === 'yes'),
)
/**
 * @deprecated 重修说明已改为 showIV 内独立 retakeNotes，不再依赖该计算属性；保留以免旧模板引用报错
 */
const isRetakeDropLinked = computed(
  () =>
    props.form.action === 'RetakeDrop' ||
    props.form.action === 'AddDropRetake' ||
    (props.form.needRetake === 'yes' && props.form.needDrop === 'yes'),
)
void isRetakeDropLinked
/** 有退课意图即用 drop 槽位选课 */
const usesDropSlot = computed(() => props.form.needDrop === 'yes')

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

/** 重修课学分合计（独立 retakeLines） */
const retakeCourseCredits = computed(() => {
  const lines = props.form.retakeLines || []
  if (!lines.length) return ''
  return String(lines.reduce((s, l) => s + (Number(l.credits) || 0), 0))
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

/** 拟退学分合计 */
const dropCreditsSum = computed(() =>
  (props.form.dropLines || []).reduce((sum, line) => sum + (Number(line.credits) || 0), 0),
)

/**
 * 退课前学期总学分（基线 GE+ME+必修已选）
 * @returns {number}
 */
const dropMetaOriginalTermTotal = computed(() => {
  const baseline = props.termCreditStripBaseline
  if (!baseline) return 0
  const ge = Number(baseline.geCurrent) || 0
  const me = Number(baseline.meCurrent) || 0
  const mandatory = Number(baseline.mandatorySelected) || 0
  return ge + me + mandatory
})

/** 还剩 = 退课前 − 拟退（不小于 0） */
const dropMetaRemainTermTotal = computed(() =>
  Math.max(0, dropMetaOriginalTermTotal.value - dropCreditsSum.value),
)

/** 「选择」旁退课摘要文案 */
const dropToolbarSummaryText = computed(() => {
  if (!hasDropLines.value) {
    return t('courseRegistration.student.coursePickerNone')
  }
  return t('courseRegistration.student.coursePickerSelectedDropCredits', {
    count: (props.form.dropLines || []).length,
    credits: dropCreditsSum.value,
    original: dropMetaOriginalTermTotal.value,
    remain: dropMetaRemainTermTotal.value,
  })
})

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

/**
 * 费用行金额合计（按加课/重修拆分，不含 SST）
 * @param {'Add'|'Retake'} feeAction
 */
function sumFeeAmountByAction(feeAction) {
  const items = props.feeEstimate?.items || []
  return items.reduce((sum, line) => {
    const isRetake =
      line.action === 'Retake' || line.reason === 'retake_full_credits'
    if (feeAction === 'Retake') {
      return isRetake ? sum + (Number(line.amount) || 0) : sum
    }
    if (!isAddGraduationExcessFeeLine(line) || isRetake) return sum
    return sum + (Number(line.amount) || 0)
  }, 0)
}

/** 加课预估费用（仅加课侧，不含 SST） */
const sectionAddFeeAmount = computed(() => {
  if (!(props.form.addLines || []).length && !props.addCourse) return ''
  return formatAmountRmb(sumFeeAmountByAction('Add'))
})

/** 重修预估费用（仅重修侧，不含 SST） */
const sectionRetakeFeeAmount = computed(() => {
  if (!(props.form.retakeLines || []).length) return ''
  return formatAmountRmb(sumFeeAmountByAction('Retake'))
})

/** 费用预估块：加课费用合计 */
const feeBoxAddAmount = computed(() => sumFeeAmountByAction('Add'))

/** 费用预估块：重修费用合计 */
const feeBoxRetakeAmount = computed(() => sumFeeAmountByAction('Retake'))

/** 费用预估块：SST */
const feeBoxSstAmount = computed(() => Math.max(0, Number(props.feeEstimate?.sstAmount) || 0))

/** 费用预估块：课程费合计（不含 SST，供 SST 公式） */
const feeBoxCourseFeeTotal = computed(() => feeBoxAddAmount.value + feeBoxRetakeAmount.value)

/** 费用预估块：应付合计 */
const feeBoxPayableTotal = computed(() => {
  const est = props.feeEstimate
  if (est?.payableTotal != null && est.payableTotal !== '') return Number(est.payableTotal) || 0
  return feeBoxAddAmount.value + feeBoxRetakeAmount.value + feeBoxSstAmount.value
})

/**
 * 按计费动作过滤费用明细行
 * @param {'Add'|'Retake'} feeAction
 */
function feeItemsByAction(feeAction) {
  const items = props.feeEstimate?.items || []
  return items.filter((line) => {
    const isRetake =
      line.action === 'Retake' || line.reason === 'retake_full_credits'
    if (feeAction === 'Retake') return isRetake
    return isAddGraduationExcessFeeLine(line) && !isRetake
  })
}

/** 加课费用逐课过程文案列表 */
const feeBoxAddDetailLines = computed(() =>
  feeItemsByAction('Add').map((line) => formatFeeDetailProcessLine(line)),
)

/** 重修费用逐课过程文案列表 */
const feeBoxRetakeDetailLines = computed(() =>
  feeItemsByAction('Retake').map((line) => formatFeeDetailProcessLine(line)),
)

/**
 * 单条计费过程：课号 · 科类 · 应收学分 × 单价 = 金额
 * @param {object} line feeEstimate item
 */
function formatFeeDetailProcessLine(line) {
  const code = String(line?.courseCode || line?.courseName || '—').trim() || '—'
  const stream = feeStreamLabel(line?.feeStream) || '—'
  const n = Math.max(0, Number(line?.billableCredits) || 0)
  const rate = Math.max(0, Number(line?.rate) || 0)
  const amount = formatAmountRmb(Number(line?.amount) || 0)
  return t('courseRegistration.student.feeDetailProcessLine', {
    code,
    stream,
    n,
    rate,
    amount,
  })
}

/**
 * SST 过程文案：有税则课程费合计 × 税率；否则空（模板显示 0 RMB）
 */
const feeBoxSstProcessText = computed(() => {
  const sst = feeBoxSstAmount.value
  if (!(sst > 0)) return ''
  const ratePct = Math.round(
    (Number(props.feeEstimate?.sstRate) || SST_RATE) * 100,
  )
  return t('courseRegistration.student.feeSstProcessLine', {
    fee: formatAmountRmb(feeBoxCourseFeeTotal.value),
    rate: ratePct,
    sst: formatAmountRmb(sst),
  })
})

function hasAddOrRetakeLines() {
  if ((props.form.addLines || []).length || (props.form.retakeLines || []).length) {
    return true
  }
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

/** 毕业超出（计费）：仅加课侧，不含重修全额 */
const sectionGradExcessCredits = computed(() => {
  const action = props.form.action
  if (action === 'Drop') return ''
  if (!hasAddOrRetakeLines()) return ''
  return String(Math.max(0, sumAddGraduationExcessBillable(props.feeEstimate)))
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

/**
 * 唯一费用预估块：有加课或重修应付时，放在声明前
 * @deprecated showInlineAddFeeBox / showBottomFeeBox 已合并为此
 */
const showUnifiedFeeBox = computed(() => hasFeeBoxContent.value)

/** @deprecated 已合并到 showUnifiedFeeBox */
const showInlineAddFeeBox = computed(() => false)

/** @deprecated 已合并到 showUnifiedFeeBox */
const showBottomFeeBox = computed(() => false)

/** 原课程区外层类别 Tab（必修 / 公选 / 专选）；仅重修用 */
const RETAKE_ORIGINAL_TYPE_TABS = [
  { key: 'core', labelKey: 'courseRegistration.student.retakePickerTab.core' },
  { key: 'ge', labelKey: 'courseRegistration.student.retakePickerTab.ge' },
  { key: 'me', labelKey: 'courseRegistration.student.retakePickerTab.me' },
]
const retakeOriginalCourseTypeTab = ref('core')
const retakeOriginalCourseTypeTabs = computed(() =>
  RETAKE_ORIGINAL_TYPE_TABS.map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey),
  })),
)

/**
 * 成绩单行是否匹配外层类别 Tab
 * @param {object|null|undefined} row
 * @param {string} tabKey core|ge|me
 */
function transcriptMatchesOriginalTypeTab(row, tabKey) {
  const type = String(row?.type || '').toUpperCase()
  const source = String(row?.sourceType || '').toLowerCase()
  if (tabKey === 'core') {
    return type === 'CORE' || type === 'MANDATORY' || source === 'required'
  }
  if (tabKey === 'ge') return type === 'GE'
  if (tabKey === 'me') return type === 'ME'
  return true
}

/**
 * 原课程「课程类型」列文案（与外层 Tab 口径一致）
 * @param {object|null|undefined} row
 */
function originalCourseTypeLabel(row) {
  const type = String(row?.type || '').toUpperCase()
  const source = String(row?.sourceType || '').toLowerCase()
  if (type === 'CORE' || type === 'MANDATORY' || source === 'required') {
    return t('courseRegistration.student.retakePickerTab.core')
  }
  if (type === 'GE') return t('courseRegistration.student.retakePickerTab.ge')
  if (type === 'ME') return t('courseRegistration.student.retakePickerTab.me')
  return formatUnifiedCourseCategoryFromLine(row, t, {
    getCourseById,
    getCourseByCode,
  })
}

/** 原课程区标题键（两侧均带必填星） */
const retakeOriginalListTitleKey = computed(() =>
  props.form.retakeType === 'improve_grade'
    ? 'courseRegistration.student.retakeOriginalListTitleImprove'
    : 'courseRegistration.student.retakeOriginalListTitleFailed',
)

/**
 * 一层：挂科/可提升原课列表（重修类型池 ∩ 外层类别 Tab）
 * 附带多行「学年学期：成绩」文本
 */
const retakeOriginalRows = computed(() => {
  if (!canPickRetakeCourse.value) return []
  const sid = props.studentFields?.studentId
  const tabKey = retakeOriginalCourseTypeTab.value
  return listTranscriptLatestByRetakeType(props.form.retakeType, sid)
    .filter((row) => transcriptMatchesOriginalTypeTab(row, tabKey))
    .map((row) => {
      const history = listTranscriptForRetakeCourse(
        row.retakeCourseId || row.courseCode,
        sid,
        row,
      )
      return {
        ...row,
        sessionGradeText: formatPreviousCourseGradesText(history) || formatGradeToZh(row) || '—',
      }
    })
})

/**
 * @param {string} key core|ge|me
 */
function selectRetakeOriginalCourseTypeTab(key) {
  if (retakeOriginalCourseTypeTab.value === key) return
  retakeOriginalCourseTypeTab.value = key
}

/** @deprecated 已改为 sessionGradeText 多行展示；保留兼容 */
function originalGradeZh(row) {
  return formatGradeToZh(row) || '—'
}

function pickRetakeForOriginal(row) {
  emit('pick-course', { target: 'retake', original: row })
}

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
  // 三是否：同步 action 并清空关掉的分区
  if (key === 'needDrop' || key === 'needAdd' || key === 'needRetake') {
    emit('update:form', applyIntentFlagsPatch(props.form, { [key]: value }))
    return
  }
  if (key === 'retakeType') {
    const prev = props.form.retakeType || ''
    // 候选池不同：仅清空重修课行；外层类别 Tab 回到必修
    const poolChanged = prev && value && prev !== value
    retakeOriginalCourseTypeTab.value = 'core'
    if (poolChanged) {
      patch({
        retakeType: value,
        retakeLines: [],
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

/**
 * 行内曾修课程成绩（多学期分行）
 * @deprecated 汇总表已改为「重修原课程」列；保留供其它入口或回退读取
 */
function linePreviousCourseGrades(line) {
  const raw = String(line?.previousCourseGradesText || '').trim()
  if (raw) return raw
  const hist = retakeHistoryFromCourse(
    { id: line?.courseId, code: line?.courseCode, name: line?.courseName },
    props.form.academicSession,
  )
  return String(hist.previousCourseGradesText || '').trim()
}

/**
 * 重修原课程展示：不及格原课「代码/名称」
 * @param {object} line retakeLines 行
 */
function lineRetakeOriginalCourse(line) {
  const code = String(line?.replacesCourseCode || '').trim()
  let name = String(line?.replacesCourseName || '').trim()
  // 同课重修未写 replaces 名称时回退本行课名
  if (!name && code && code === String(line?.courseCode || '').trim()) {
    name = String(line?.courseName || '').trim()
  }
  if (!code && !name) {
    const fallbackCode = String(line?.courseCode || '').trim()
    const fallbackName = String(line?.courseName || '').trim()
    if (!fallbackCode && !fallbackName) return '—'
    return fallbackName ? `${fallbackCode}/${fallbackName}` : fallbackCode
  }
  if (code && name) return `${code}/${name}`
  return code || name || '—'
}

/**
 * 本学期重修课展示：「代码/名称」
 * @param {object} line retakeLines 行
 * @returns {string}
 */
function lineRetakeCourseDisplay(line) {
  const code = String(line?.courseCode || '').trim()
  const name = String(line?.courseName || '').trim()
  if (!code && !name) return '—'
  if (code && name) return `${code}/${name}`
  return code || name
}

/**
 * 曾修课号（与 lineRetakeOriginalCourse 回退一致，用于同课判定）
 * @param {object} line retakeLines 行
 * @returns {string}
 */
function lineRetakeOriginalCourseCode(line) {
  const replaces = String(line?.replacesCourseCode || '').trim()
  if (replaces) return replaces
  return String(line?.courseCode || '').trim()
}

/**
 * @deprecated 已改为修读方式三值；保留供旧引用，等价于同课号判断文案
 * @param {object} line retakeLines 行
 * @returns {string}
 */
function lineRetakeSameCourseAsOriginal(line) {
  return lineRetakeStudyModeLabel(line)
}

/**
 * 重修汇总表「修读方式」：同课号重修 / 同课程组重修（无「正常」）
 * @param {object} line retakeLines 行
 * @returns {string}
 */
function lineRetakeStudyModeLabel(line) {
  const key = resolveRetakeStudyModeKey(line?.courseCode, lineRetakeOriginalCourseCode(line))
  return studyModeLabel(key, t)
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
          :show-pending-estimate-tip="showPendingEstimateTip"
        />
      </div>
      <!-- 二次申请拦截：紧挨估算提示下一行（钉在顶部，下方仍可滚） -->
      <p
        v-if="primaryTypePendingBlocked || secondApplicationBlockTip"
        class="form-field-error adddrop-second-app-tip"
      >
        {{
          secondApplicationBlockTip ||
          t('courseRegistration.student.secondApplicationBlocked')
        }}
      </p>
    </div>

    <div
      class="adddrop-sections__scroll"
      :class="{ 'adddrop-sections__scroll--ops-disabled': formOpsDisabled }"
    >
    <div class="section-bar">{{ t('courseRegistration.student.sectionCommon') }}</div>
    <!-- 学年学期 + 三是否：宽屏四字段一行 -->
    <div class="form-grid form-grid--intent-row">
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
              :disabled="actionLocked || formOpsDisabled || !canLinkDrop"
              @change="onField('needDrop', 'yes')"
            />
            {{ t('common.yes') }}
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="needDrop"
              value="no"
              :checked="form.needDrop !== 'yes'"
              :disabled="actionLocked || formOpsDisabled"
              @change="onField('needDrop', 'no')"
            />
            {{ t('common.no') }}
          </label>
        </div>
        <p v-if="!canLinkDrop" class="field-hint">
          {{ t('courseRegistration.student.needDropNotAllowed') }}
        </p>
      </div>
      <div class="form-field">
        <label>
          {{ t('courseRegistration.student.needAddLabel') }}
          <span class="required">*</span>
        </label>
        <div class="radio-row">
          <label class="radio-option">
            <input
              type="radio"
              name="needAdd"
              value="yes"
              :checked="form.needAdd === 'yes'"
              :disabled="actionLocked || formOpsDisabled"
              @change="onField('needAdd', 'yes')"
            />
            {{ t('common.yes') }}
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="needAdd"
              value="no"
              :checked="form.needAdd !== 'yes'"
              :disabled="actionLocked || formOpsDisabled"
              @change="onField('needAdd', 'no')"
            />
            {{ t('common.no') }}
          </label>
        </div>
      </div>
      <div class="form-field">
        <label>
          {{ t('courseRegistration.student.needRetakeLabel') }}
          <span class="required">*</span>
        </label>
        <div class="radio-row">
          <label class="radio-option">
            <input
              type="radio"
              name="needRetake"
              value="yes"
              :checked="form.needRetake === 'yes'"
              :disabled="actionLocked || formOpsDisabled"
              @change="onField('needRetake', 'yes')"
            />
            {{ t('common.yes') }}
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="needRetake"
              value="no"
              :checked="form.needRetake !== 'yes'"
              :disabled="actionLocked || formOpsDisabled"
              @change="onField('needRetake', 'no')"
            />
            {{ t('common.no') }}
          </label>
        </div>
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
              :disabled="formOpsDisabled"
              @click="emit('pick-course', usesDropSlot ? 'drop' : 'primary')"
            >
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
            <span
              class="drop-toolbar-summary"
              :class="{ 'drop-toolbar-summary--emphasis': hasDropLines }"
            >
              {{ dropToolbarSummaryText }}
            </span>
          </div>
          <div class="lines-table-wrap">
            <table class="lines-table">
              <thead>
                <tr>
                  <th class="col-index">{{ t('common.serialNo') }}</th>
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
                <tr v-for="(line, di) in form.dropLines || []" :key="lineKey(line)">
                  <td class="col-index">{{ di + 1 }}</td>
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
                  <td colspan="8" class="empty-cell">{{ t('courseRegistration.student.selectCourse') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="hasDropLines" class="form-field span-2 fields-row-4">
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
            <span class="optional">（{{ t('courseRegistration.student.dropReasonOptional') }}）</span>
          </label>
          <textarea
            class="form-control"
            rows="3"
            :value="form.dropReason"
            :placeholder="t('courseRegistration.student.dropReasonPlaceholder')"
            :disabled="formOpsDisabled"
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
              :disabled="formOpsDisabled"
              @click="emit('pick-course', isAddDropLinked ? 'add' : 'primary')"
            >
              {{ t('courseRegistration.student.pickCourse') }}
            </button>
          </div>
          <div class="lines-table-wrap">
            <table class="lines-table">
              <thead>
                <tr>
                  <th class="col-index">{{ t('common.serialNo') }}</th>
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
                <tr v-for="(line, ai) in form.addLines || []" :key="lineKey(line)">
                  <td class="col-index">{{ ai + 1 }}</td>
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
                  <td colspan="8" class="empty-cell">{{ t('courseRegistration.student.selectCourse') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="form-field span-2 fields-row-4">
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
              <span>{{ t('courseRegistration.student.feeEstimateAddShort') }}</span>
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
              :value="dash(sectionAddFeeAmount)"
            />
          </div>
        </div>
        <div class="form-field span-2">
          <label>{{ t('courseRegistration.student.addNotesLabel') }}</label>
          <textarea
            class="form-control"
            rows="2"
            :value="form.addNotes"
            :placeholder="t('courseRegistration.student.addNotesPlaceholder')"
            :disabled="formOpsDisabled"
            @input="onField('addNotes', $event)"
          />
        </div>
      </div>
    </template>

    <!-- Section IV Retake：首行为重修类型 -->
    <template v-if="sections.showIV">
      <div class="section-bar">{{ sectionBars.retake }}</div>
      <div class="form-grid">
        <div class="form-field span-2">
          <label>
            {{ t('courseRegistration.student.retakeTypeLabel') }}
            <span class="required">*</span>
          </label>
          <select
            class="form-control"
            :value="form.retakeType"
            :disabled="formOpsDisabled"
            @change="onField('retakeType', $event)"
          >
            <option v-for="opt in RETAKE_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ t(opt.labelKey) }}
            </option>
          </select>
        </div>
        <!-- 原课程区：Tab 仅切换本块列表 -->
        <div class="form-field span-2 retake-original-block">
          <label>
            {{ t(retakeOriginalListTitleKey) }}
            <span class="required">*</span>
          </label>
          <p v-if="!canPickRetakeCourse" class="field-hint">
            {{ t('courseRegistration.student.retakeTypeRequired') }}
          </p>
          <template v-else>
            <div class="retake-original-type-tabs" role="tablist">
              <button
                v-for="tab in retakeOriginalCourseTypeTabs"
                :key="tab.key"
                type="button"
                role="tab"
                class="retake-original-type-tab"
                :class="{ active: retakeOriginalCourseTypeTab === tab.key }"
                :aria-selected="retakeOriginalCourseTypeTab === tab.key"
                :disabled="formOpsDisabled"
                @click="selectRetakeOriginalCourseTypeTab(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="lines-table-wrap retake-original-table-wrap">
              <table class="lines-table retake-original-table">
                <thead>
                  <tr>
                    <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                    <th class="col-name">{{ t('courseRegistration.courses.name') }}</th>
                    <th class="col-session-grade">
                      {{ t('courseRegistration.student.retakeOriginalSessionGrade') }}
                    </th>
                    <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                    <th class="col-type">{{ t('courseRegistration.courses.type') }}</th>
                    <th class="col-op col-op--retake-original">{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, ri) in retakeOriginalRows"
                    :key="row.retakeCourseId || row.courseCode || ri"
                  >
                    <td class="col-code">{{ row.courseCode || '—' }}</td>
                    <td class="col-name" :title="row.courseName || row.courseCode || ''">
                      {{ row.courseName || row.courseCode || '—' }}
                    </td>
                    <td class="col-session-grade">
                      <template v-if="row.sessionGradeText">
                        <div
                          v-for="(gl, gi) in String(row.sessionGradeText).split('\n')"
                          :key="gi"
                          class="session-grade-line"
                        >
                          {{ gl }}
                        </div>
                      </template>
                      <template v-else>—</template>
                    </td>
                    <td class="col-credits">
                      {{ row.credits != null && row.credits !== '' ? row.credits : '—' }}
                    </td>
                    <td class="col-type" :title="originalCourseTypeLabel(row)">
                      {{ originalCourseTypeLabel(row) }}
                    </td>
                    <td class="col-op col-op--retake-original op-cell">
                      <button
                        type="button"
                        class="link-btn"
                        :disabled="formOpsDisabled"
                        @click="pickRetakeForOriginal(row)"
                      >
                        {{ t('courseRegistration.student.pickRetakeCourseForOriginal') }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!retakeOriginalRows.length">
                    <td colspan="6" class="empty-cell">
                      {{ t('courseRegistration.student.retakeOriginalEmpty') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <p class="field-hint">{{ t('courseRegistration.student.retakeOriginalListHint') }}</p>
        </div>
        <!-- 公共区：本学期重修表 / 学分费用 / 费用明细，不随 Tab 切换 -->
        <div class="form-field span-2 retake-common-block">
          <label>
            {{ t('courseRegistration.student.retakeCourse') }}
            <span class="required">*</span>
          </label>
          <div class="lines-table-wrap">
            <table class="lines-table">
              <thead>
                <tr>
                  <th class="col-index">{{ t('common.serialNo') }}</th>
                  <th class="col-retake-course">{{ t('courseRegistration.student.retakeCourseColumn') }}</th>
                  <th class="col-group">{{ t('courseRegistration.student.fieldGroupNo') }}</th>
                  <th class="col-credits">{{ t('courseRegistration.courses.credits') }}</th>
                  <th class="col-time">{{ t('courseRegistration.student.fieldClassTimeVenue') }}</th>
                  <th class="col-type">{{ t('courseRegistration.courses.type') }}</th>
                  <th class="col-retake-original">{{ t('courseRegistration.student.retakeOriginalCourse') }}</th>
                  <th class="col-retake-same">{{ t('courseRegistration.student.retakeStudyMode') }}</th>
                  <th class="col-op">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, rti) in form.retakeLines || []" :key="lineKey(line)">
                  <td class="col-index">{{ rti + 1 }}</td>
                  <td class="col-retake-course" :title="lineRetakeCourseDisplay(line)">
                    {{ lineRetakeCourseDisplay(line) }}
                  </td>
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
                  <td class="col-retake-original" :title="lineRetakeOriginalCourse(line)">
                    {{ lineRetakeOriginalCourse(line) }}
                  </td>
                  <td class="col-retake-same">{{ lineRetakeStudyModeLabel(line) }}</td>
                  <td class="col-op op-cell">
                    <button type="button" class="link-btn" @click="removeLine('retakeLines', line)">
                      {{ t('common.remove') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!(form.retakeLines || []).length">
                  <td colspan="9" class="empty-cell">
                    {{ t('courseRegistration.student.retakeCoursePlaceholder') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="field-hint">{{ t('courseRegistration.student.retakeCourseHint') }}</p>
          <div class="fields-row-2 retake-common-summary">
            <div class="form-field">
              <label>{{ t('courseRegistration.student.fieldRetakeTotalCreditsBillable') }}</label>
              <input
                type="text"
                class="form-control"
                readonly
                :value="dash(retakeCourseCredits)"
              />
            </div>
            <div class="form-field">
              <label class="label-with-tip">
                <span>{{ t('courseRegistration.student.feeEstimateRetakeShort') }}</span>
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
                :value="dash(sectionRetakeFeeAmount)"
              />
            </div>
          </div>
          <!-- 费用预估在上，重修补充说明在下 -->
          <div v-if="showUnifiedFeeBox" class="fee-box retake-common-fee-box">
            <div class="fee-title">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
            <ul class="fee-list">
              <li class="fee-list-block">
                <div class="fee-list-label">
                  {{ t('courseRegistration.student.feeBoxAddFee') }}:
                  <template v-if="!feeBoxAddDetailLines.length">
                    {{ formatAmountRmb(feeBoxAddAmount) }}
                  </template>
                </div>
                <ul v-if="feeBoxAddDetailLines.length" class="fee-process-list">
                  <li v-for="(text, idx) in feeBoxAddDetailLines" :key="`add-fee-${idx}`">
                    {{ text }}
                  </li>
                </ul>
              </li>
              <li class="fee-list-block">
                <div class="fee-list-label">
                  {{ t('courseRegistration.student.feeBoxRetakeFee') }}:
                  <template v-if="!feeBoxRetakeDetailLines.length">
                    {{ formatAmountRmb(feeBoxRetakeAmount) }}
                  </template>
                </div>
                <ul v-if="feeBoxRetakeDetailLines.length" class="fee-process-list">
                  <li v-for="(text, idx) in feeBoxRetakeDetailLines" :key="`retake-fee-${idx}`">
                    {{ text }}
                  </li>
                </ul>
              </li>
              <li class="fee-list-sst fee-list-block">
                <div class="fee-list-label fee-list-sst-row">
                  <span>{{ t('courseRegistration.student.feeBoxSstFee') }}:</span>
                  <span v-if="!feeBoxSstProcessText">{{ formatAmountRmb(feeBoxSstAmount) }}</span>
                  <span
                    class="tip-icon"
                    :title="sstTipText"
                    :aria-label="sstTipText"
                    tabindex="0"
                  >?</span>
                </div>
                <ul v-if="feeBoxSstProcessText" class="fee-process-list">
                  <li>{{ feeBoxSstProcessText }}</li>
                </ul>
              </li>
            </ul>
            <p class="fee-total">
              {{ t('courseRegistration.student.feeEstimateTotal') }}:
              <strong>{{ formatAmountRmb(feeBoxPayableTotal) }}</strong>
            </p>
          </div>
          <div class="form-field span-2 retake-notes-field">
            <label>{{ t('courseRegistration.student.retakeNotesLabel') }}</label>
            <textarea
              class="form-control"
              rows="2"
              :value="form.retakeNotes"
              :placeholder="t('courseRegistration.student.retakeNotesPlaceholder')"
              :disabled="formOpsDisabled"
              @input="onField('retakeNotes', $event)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 无重修区时：费用框仍在声明前（纯加课等） -->
    <div v-if="showUnifiedFeeBox && !sections.showIV" class="fee-box">
      <div class="fee-title">{{ t('courseRegistration.student.feeEstimateTitle') }}</div>
      <ul class="fee-list">
        <li class="fee-list-block">
          <div class="fee-list-label">
            {{ t('courseRegistration.student.feeBoxAddFee') }}:
            <template v-if="!feeBoxAddDetailLines.length">
              {{ formatAmountRmb(feeBoxAddAmount) }}
            </template>
          </div>
          <ul v-if="feeBoxAddDetailLines.length" class="fee-process-list">
            <li v-for="(text, idx) in feeBoxAddDetailLines" :key="`add-fee-only-${idx}`">
              {{ text }}
            </li>
          </ul>
        </li>
        <li class="fee-list-block">
          <div class="fee-list-label">
            {{ t('courseRegistration.student.feeBoxRetakeFee') }}:
            <template v-if="!feeBoxRetakeDetailLines.length">
              {{ formatAmountRmb(feeBoxRetakeAmount) }}
            </template>
          </div>
          <ul v-if="feeBoxRetakeDetailLines.length" class="fee-process-list">
            <li v-for="(text, idx) in feeBoxRetakeDetailLines" :key="`retake-fee-only-${idx}`">
              {{ text }}
            </li>
          </ul>
        </li>
        <li class="fee-list-sst fee-list-block">
          <div class="fee-list-label fee-list-sst-row">
            <span>{{ t('courseRegistration.student.feeBoxSstFee') }}:</span>
            <span v-if="!feeBoxSstProcessText">{{ formatAmountRmb(feeBoxSstAmount) }}</span>
            <span
              class="tip-icon"
              :title="sstTipText"
              :aria-label="sstTipText"
              tabindex="0"
            >?</span>
          </div>
          <ul v-if="feeBoxSstProcessText" class="fee-process-list">
            <li>{{ feeBoxSstProcessText }}</li>
          </ul>
        </li>
      </ul>
      <p class="fee-total">
        {{ t('courseRegistration.student.feeEstimateTotal') }}:
        <strong>{{ formatAmountRmb(feeBoxPayableTotal) }}</strong>
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

/*
 * 有未审单：不整区 pointer-events:none（会禁掉滚动）；
 * 交互控件已用 disabled，此处仅弱化观感
 */
.adddrop-sections__scroll--ops-disabled {
  opacity: 0.92;
}

.adddrop-second-app-tip {
  margin: 8px 0 0;
  flex-shrink: 0;
}

.form-field-error {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #b91c1c;
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

/**
 * 申请信息：一行四列，列宽与列间距横向均分
 * 双类写在 .form-grid 之后，避免被两列规则覆盖
 */
.form-grid.form-grid--intent-row {
  display: grid;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 24px;
  row-gap: 12px;
  align-items: start;
  justify-content: stretch;
}

.form-grid.form-grid--intent-row > .form-field {
  min-width: 0;
  width: 100%;
}

.form-grid.form-grid--intent-row > .form-grid--intent-row__error {
  grid-column: 1 / -1;
}

.form-grid.form-grid--intent-row .radio-row {
  width: 100%;
}

@media (max-width: 720px) {
  .form-grid.form-grid--intent-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
  }
}

@media (max-width: 480px) {
  .form-grid.form-grid--intent-row {
    grid-template-columns: 1fr;
  }
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

/* 退课「选择」旁摘要：默认灰；有课红字 */
.drop-toolbar-summary {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.drop-toolbar-summary--emphasis {
  color: #dc2626;
  font-weight: 600;
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

.lines-table .col-index {
  width: 3.2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: #6b7280;
}

.lines-table .col-code {
  width: 10%;
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

/* 汇总表：重修课程 / 曾修课程（代码/名称，可换行） */
.lines-table .col-retake-course,
.lines-table .col-retake-original {
  width: 16%;
  white-space: normal;
  line-height: 1.35;
  font-size: 12px;
  color: #374151;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
}

.lines-table .col-retake-same {
  width: 8%;
  white-space: nowrap;
  text-align: center;
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

/* 原课程表：整表水平居中；操作列加宽避免裁切 */
.lines-table.retake-original-table th,
.lines-table.retake-original-table td {
  text-align: center;
}

.lines-table .col-op--retake-original {
  width: 9.5em;
  min-width: 9.5em;
  white-space: nowrap;
}

.lines-table .col-session-grade {
  width: 22%;
  min-width: 8em;
  white-space: normal;
  line-height: 1.35;
}

.session-grade-line + .session-grade-line {
  margin-top: 2px;
}

.retake-common-block .retake-common-summary {
  margin-top: 12px;
}

.retake-common-block .retake-common-fee-box {
  margin-top: 12px;
}

.retake-original-type-tabs {
  display: flex;
  gap: 0;
  margin: 0 0 10px;
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.retake-original-type-tab {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  color: #6b7280;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  cursor: pointer;
}

.retake-original-type-tab:hover:not(:disabled) {
  color: #2563eb;
}

.retake-original-type-tab.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
}

.retake-original-type-tab:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.retake-original-table-wrap {
  overflow-x: auto;
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

.fee-list-block {
  list-style: disc;
  margin-bottom: 4px;
}

.fee-list-label {
  color: #475569;
}

.fee-process-list {
  margin: 4px 0 0;
  padding-left: 0;
  list-style: none;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.fee-list-sst {
  list-style: disc;
}

.fee-list-sst-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.fee-total {
  margin: 8px 0 0;
  font-size: 14px;
  color: #0f172a;
}

@media (max-width: 720px) {
  .form-grid:not(.form-grid--intent-row) {
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
