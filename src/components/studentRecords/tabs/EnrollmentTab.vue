<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import StudentFormField from '../StudentFormField.vue'
import {
  studentStatusOptions,
  studyModeOptions,
  financialAidOptions,
  recruitedByOptions,
  showsFujianScholarship,
  usesRecruitedByDropdown,
} from '../../../data/students.js'

const props = defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
})

const { tr } = useAppI18n()

const category = computed(() => props.form.studentCategory || 'Local')
const recruitedByAsSelect = computed(() => usesRecruitedByDropdown())
const showFujianScholarship = computed(() => showsFujianScholarship(category.value))

function err(field) {
  return props.errors[`enrollment.${field}`] || ''
}
</script>

<template>
  <div class="form-grid">
    <StudentFormField label="Programme Code" required :read-only="readOnly" :error="err('programmeCode')" :display-value="form.enrollment.programmeCode">
      <input v-model="form.enrollment.programmeCode" type="text" />
    </StudentFormField>
    <StudentFormField label="Programme" required :read-only="readOnly" :error="err('programme')" :display-value="form.enrollment.programme">
      <input v-model="form.enrollment.programme" type="text" />
    </StudentFormField>
    <StudentFormField label="Faculty" :read-only="readOnly" :display-value="form.enrollment.faculty">
      <input v-model="form.enrollment.faculty" type="text" />
    </StudentFormField>
    <StudentFormField label="Status" :read-only="readOnly" :display-value="tr(form.enrollment.status)">
      <select v-model="form.enrollment.status">
        <option v-for="opt in studentStatusOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Programme Level" :read-only="readOnly" :display-value="form.enrollment.programmeLevel">
      <input v-model="form.enrollment.programmeLevel" type="text" />
    </StudentFormField>
    <StudentFormField label="Duration" :read-only="readOnly" :display-value="form.enrollment.duration">
      <input v-model="form.enrollment.duration" type="text" />
    </StudentFormField>
    <StudentFormField label="Semester" :read-only="readOnly" :display-value="form.enrollment.semester">
      <input v-model="form.enrollment.semester" type="text" />
    </StudentFormField>
    <StudentFormField label="Intake (YYYY/MM)" :read-only="readOnly" :display-value="form.enrollment.intake">
      <input v-model="form.enrollment.intake" type="text" placeholder="2023/09" />
    </StudentFormField>
    <StudentFormField label="Academic Session" :read-only="readOnly" :display-value="form.enrollment.academicSession">
      <input v-model="form.enrollment.academicSession" type="text" />
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
