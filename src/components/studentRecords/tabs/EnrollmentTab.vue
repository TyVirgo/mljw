<script setup>
import { computed, watch, onMounted } from 'vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import StudentFormField from '../StudentFormField.vue'
import {
  studentStatusOptions,
  studyModeOptions,
  financialAidOptions,
  recruitedByOptions,
  showsFujianScholarship,
  usesRecruitedByDropdown,
  getTrackCategoriesForProfileStatus,
  syncEnrollmentTrackCategory,
} from '../../../data/students.js'
import {
  getEnrollmentAllProgrammeOptions,
  getEnrollmentIntakeOptions,
  getEnrollmentAcademicSessionOptionsFromIntake,
  resolveEnrollmentByProgrammeIntakeKey,
  inferProgrammeIntakeKeyFromEnrollment,
  normalizeEnrollmentProgrammeLevel,
  syncEnrollmentDerivedScheduleFields,
  syncRegistrationTimeWithIntake,
} from '../../../data/studentEnrollmentOptions.js'
import {
  getStudentProfileFieldHintKey,
  getStudentProfileFieldLabelKey,
} from '../../../data/studentProfileFieldLabels.js'

const programmeOptions = getEnrollmentAllProgrammeOptions()
const intakeOptions = getEnrollmentIntakeOptions()

const props = defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
})
const { tr, t } = useAppI18n()

const category = computed(() => props.form.studentCategory || '')
const recruitedByAsSelect = computed(() => usesRecruitedByDropdown())
const showFujianScholarship = computed(() => showsFujianScholarship(category.value))

const trackCategoryOptions = computed(() =>
  getTrackCategoriesForProfileStatus(props.form.enrollment?.status),
)

function trackCategoryLabel(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const key = `movementCategory.trackCategory.${text}`
  const translated = t(key)
  return translated !== key ? translated : tr(text)
}

const academicSessionOptions = computed(() =>
  getEnrollmentAcademicSessionOptionsFromIntake(props.form.enrollment.intake),
)

function err(field) {
  return props.errors[`enrollment.${field}`] || ''
}

function programmeLevelLabel(level) {
  const normalized = normalizeEnrollmentProgrammeLevel(level)
  if (!normalized) return ''
  const key = `consentForm.programmeLevel.${normalized}`
  const translated = t(key)
  return translated !== key ? translated : normalized
}

function clearProgrammeLinkageFields() {
  props.form.enrollment.programmeIntakeKey = ''
  props.form.enrollment.programmeCode = ''
  props.form.enrollment.programme = ''
  props.form.enrollment.programmeLevel = ''
  props.form.enrollment.faculty = ''
  props.form.enrollment.programmeStructure = ''
  props.form.enrollment.duration = ''
  syncEnrollmentDerivedScheduleFields(props.form.enrollment)
}

function applyProgrammeIntakeLinkage(programmeIntakeKey) {
  const resolved = resolveEnrollmentByProgrammeIntakeKey(programmeIntakeKey)
  if (!resolved) {
    if (!programmeIntakeKey) clearProgrammeLinkageFields()
    return
  }
  const enrollment = props.form.enrollment

  enrollment.programmeIntakeKey = resolved.programmeIntakeKey
  enrollment.programmeCode = resolved.programmeCode
  enrollment.programme = resolved.programme
  enrollment.programmeLevel = resolved.programmeLevel
  enrollment.faculty = resolved.faculty
  enrollment.programmeStructure = resolved.programmeStructure
  enrollment.duration = resolved.duration
  syncEnrollmentDerivedScheduleFields(enrollment)
}

function applyIntakeSelection(intake, prevIntake) {
  if (props.readOnly || intake === prevIntake) return
  syncRegistrationTimeWithIntake(props.form.enrollment)
  syncEnrollmentDerivedScheduleFields(props.form.enrollment)
}

function hydrateCascadeFromStoredEnrollment() {
  if (props.readOnly) return
  const enrollment = props.form.enrollment
  if (enrollment.programmeLevel) {
    enrollment.programmeLevel = normalizeEnrollmentProgrammeLevel(enrollment.programmeLevel)
  }
  if (!enrollment.programmeLevel && !enrollment.faculty && !enrollment.programme) return

  const inferredKey = inferProgrammeIntakeKeyFromEnrollment(enrollment)
  if (inferredKey && !enrollment.programmeIntakeKey) {
    enrollment.programmeIntakeKey = inferredKey
  }
  if (enrollment.programmeIntakeKey) {
    applyProgrammeIntakeLinkage(enrollment.programmeIntakeKey)
    return
  }
  syncEnrollmentDerivedScheduleFields(enrollment)
}

onMounted(() => {
  hydrateCascadeFromStoredEnrollment()
})

watch(
  () => props.form.enrollment.programmeIntakeKey,
  (key) => {
    if (props.readOnly) return
    applyProgrammeIntakeLinkage(key)
  },
)

watch(
  () => props.form.enrollment.intake,
  (intake, prev) => {
    applyIntakeSelection(intake, prev)
  },
)

watch(
  () => props.form.enrollment.academicSession,
  () => {
    if (props.readOnly) return
    syncEnrollmentDerivedScheduleFields(props.form.enrollment)
  },
)

watch(
  () => props.form.enrollment.status,
  () => {
    if (props.readOnly) return
    syncEnrollmentTrackCategory(props.form.enrollment)
  },
)
</script>

<template>
  <div class="form-grid">
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('programme')"
      required
      :read-only="readOnly"
      :error="err('programme')"
      :display-value="form.enrollment.programme"
    >
      <select v-model="form.enrollment.programmeIntakeKey">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in programmeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('programmeCode')"
      required
      derived
      :read-only="readOnly"
      :error="err('programmeCode')"
      :display-value="form.enrollment.programmeCode"
    >
      <input v-model="form.enrollment.programmeCode" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('programmeLevel')"
      required
      derived
      :read-only="readOnly"
      :error="err('programmeLevel')"
      :display-value="programmeLevelLabel(form.enrollment.programmeLevel)"
    >
      <input
        :value="programmeLevelLabel(form.enrollment.programmeLevel)"
        type="text"
        readonly
        disabled
      />
    </StudentFormField>
    <StudentFormField
      label="Faculty"
      required
      derived
      :read-only="readOnly"
      :error="err('faculty')"
      :display-value="form.enrollment.faculty"
    >
      <input v-model="form.enrollment.faculty" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('programmeStructure')"
      :label-hint="getStudentProfileFieldHintKey('programmeStructure')"
      derived
      :read-only="readOnly"
      :display-value="form.enrollment.programmeStructure"
    >
      <input v-model="form.enrollment.programmeStructure" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField
      label="Duration"
      derived
      :read-only="readOnly"
      :display-value="form.enrollment.duration"
    >
      <input v-model="form.enrollment.duration" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('intake')"
      :label-hint="getStudentProfileFieldHintKey('intake')"
      required
      :read-only="readOnly"
      :error="err('intake')"
      :display-value="form.enrollment.intake"
    >
      <select v-model="form.enrollment.intake">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in intakeOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </StudentFormField>
    <StudentFormField
      label="Current Academic Session"
      required
      :read-only="readOnly"
      :error="err('academicSession')"
      :display-value="form.enrollment.academicSession"
    >
      <select v-model="form.enrollment.academicSession" :disabled="!form.enrollment.intake">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in academicSessionOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('semester')"
      :label-hint="getStudentProfileFieldHintKey('semester')"
      derived
      :read-only="readOnly"
      :display-value="form.enrollment.semester"
    >
      <input v-model="form.enrollment.semester" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('registrationTime')"
      :label-hint="getStudentProfileFieldHintKey('registrationTime')"
      derived
      :read-only="readOnly"
      :display-value="form.enrollment.registrationTime"
    >
      <input v-model="form.enrollment.registrationTime" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('expectedCompletionBatch')"
      :label-hint="getStudentProfileFieldHintKey('expectedCompletionBatch')"
      derived
      :read-only="readOnly"
      :display-value="form.enrollment.expectedCompletionBatch"
    >
      <input v-model="form.enrollment.expectedCompletionBatch" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('expectedGraduationBatch')"
      derived
      :read-only="readOnly"
      :display-value="form.enrollment.expectedGraduationBatch"
    >
      <input v-model="form.enrollment.expectedGraduationBatch" type="text" readonly disabled />
    </StudentFormField>
    <StudentFormField :label="getStudentProfileFieldLabelKey('status')" :read-only="readOnly" :display-value="tr(form.enrollment.status)">
      <select v-model="form.enrollment.status">
        <option v-for="opt in studentStatusOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
      </select>
    </StudentFormField>
    <StudentFormField
      :label="getStudentProfileFieldLabelKey('trackCategory')"
      required
      :read-only="readOnly"
      :error="err('trackCategory')"
      :display-value="trackCategoryLabel(form.enrollment.trackCategory)"
    >
      <select v-model="form.enrollment.trackCategory">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in trackCategoryOptions" :key="opt" :value="opt">{{ trackCategoryLabel(opt) }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Study Mode" :read-only="readOnly" :display-value="tr(form.enrollment.studyMode)">
      <select v-model="form.enrollment.studyMode">
        <option v-for="opt in studyModeOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Recruited By" :read-only="readOnly" :display-value="recruitedByAsSelect ? tr(form.enrollment.recruitedBy) || form.enrollment.recruitedBy : form.enrollment.recruitedBy">
      <select v-if="recruitedByAsSelect && !readOnly" v-model="form.enrollment.recruitedBy">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in recruitedByOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
      </select>
      <input v-else-if="!readOnly" v-model="form.enrollment.recruitedBy" type="text" />
    </StudentFormField>
    <StudentFormField label="Source of Recruit" :read-only="readOnly" :display-value="form.enrollment.sourceOfRecruit">
      <input v-model="form.enrollment.sourceOfRecruit" type="text" />
    </StudentFormField>
    <StudentFormField label="Type of Financial Aid" :read-only="readOnly" :display-value="tr(form.enrollment.typeOfFinancialAid)">
      <select v-model="form.enrollment.typeOfFinancialAid">
        <option v-for="opt in financialAidOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Financial Aid Amount" :read-only="readOnly" :display-value="form.enrollment.financialAidAmount">
      <input v-model="form.enrollment.financialAidAmount" type="text" />
    </StudentFormField>
    <StudentFormField label="Scholarship Offer No." :read-only="readOnly" :display-value="form.enrollment.scholarshipOfferNo">
      <input v-model="form.enrollment.scholarshipOfferNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Tuition Fee (Annual)" :read-only="readOnly" :display-value="form.enrollment.tuitionFeeAnnual">
      <input v-model="form.enrollment.tuitionFeeAnnual" type="text" />
    </StudentFormField>
    <StudentFormField
      v-if="showFujianScholarship"
      label="Fujian Scholarship Amt"
      :read-only="readOnly"
      :display-value="form.enrollment.fujianScholarshipAmt"
    >
      <input v-model="form.enrollment.fujianScholarshipAmt" type="text" />
    </StudentFormField>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
@media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
