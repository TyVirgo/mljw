<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import StudentFormField from '../StudentFormField.vue'
import DatePickerEn from '../../common/DatePickerEn.vue'
import {
  qualificationOptions,
  showsChineseLanguageTests,
  usesQualificationDropdown,
  isLocalCategory,
} from '../../../data/students.js'

const props = defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
})

const { tr } = useAppI18n()

const category = computed(() => props.form.studentCategory || '')
const isLocal = computed(() => isLocalCategory(category.value))
const showChineseTests = computed(() => showsChineseLanguageTests(category.value))
const qualificationAsSelect = computed(() => usesQualificationDropdown())

function err(field) {
  return props.errors[`education.${field}`] || ''
}
</script>

<template>
  <div class="education-tab">
    <div class="form-grid">
      <StudentFormField label="Qualification" :read-only="readOnly" :display-value="qualificationAsSelect ? tr(form.education.qualification) || form.education.qualification : form.education.qualification">
        <select v-if="qualificationAsSelect && !readOnly" v-model="form.education.qualification">
          <option value="">{{ tr('please select') }}</option>
          <option v-for="opt in qualificationOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
        </select>
        <input v-else-if="!readOnly" v-model="form.education.qualification" type="text" />
      </StudentFormField>
      <StudentFormField label="Institution Name" :read-only="readOnly" :display-value="form.education.institutionName">
        <input v-model="form.education.institutionName" type="text" />
      </StudentFormField>
      <StudentFormField label="Institution Location" :read-only="readOnly" :display-value="form.education.institutionLocation">
        <input v-model="form.education.institutionLocation" type="text" />
      </StudentFormField>
      <StudentFormField label="Institution Type" :read-only="readOnly" :display-value="form.education.institutionType">
        <input v-model="form.education.institutionType" type="text" />
      </StudentFormField>
      <StudentFormField label="Year Graduated" :read-only="readOnly" :display-value="form.education.yearGraduated">
        <input v-model="form.education.yearGraduated" type="text" />
      </StudentFormField>
      <StudentFormField label="Grade/Result" :read-only="readOnly" :display-value="form.education.gradeResult">
        <input v-model="form.education.gradeResult" type="text" />
      </StudentFormField>
      <StudentFormField label="Subject" :read-only="readOnly" :display-value="form.education.subject">
        <input v-model="form.education.subject" type="text" />
      </StudentFormField>
      <StudentFormField
        v-if="isLocal"
        label="SPM Malay Score"
        required
        :read-only="readOnly"
        :error="err('spmMalayScore')"
        :display-value="form.education.spmMalayScore"
      >
        <input v-model="form.education.spmMalayScore" type="text" />
      </StudentFormField>
    </div>
    <h4 class="section-title">{{ tr('LANGUAGE PROFICIENCY') }}</h4>
    <div class="form-grid">
      <StudentFormField label="English Test Type" :read-only="readOnly" :display-value="form.education.englishTestType">
        <input v-model="form.education.englishTestType" type="text" />
      </StudentFormField>
      <StudentFormField label="English Result" :read-only="readOnly" :display-value="form.education.englishResult">
        <input v-model="form.education.englishResult" type="text" />
      </StudentFormField>
      <StudentFormField label="English Date" :read-only="readOnly" :display-value="form.education.englishDate">
        <DatePickerEn v-model="form.education.englishDate" />
      </StudentFormField>
      <StudentFormField label="English Expiry" :read-only="readOnly" :display-value="form.education.englishExpiry">
        <DatePickerEn v-model="form.education.englishExpiry" />
      </StudentFormField>
      <template v-if="showChineseTests">
        <StudentFormField label="Chinese Test Result" :read-only="readOnly" :display-value="form.education.chineseTestResult">
          <input v-model="form.education.chineseTestResult" type="text" />
        </StudentFormField>
        <StudentFormField label="Chinese Test Date" :read-only="readOnly" :display-value="form.education.chineseTestDate">
          <DatePickerEn v-model="form.education.chineseTestDate" />
        </StudentFormField>
        <StudentFormField label="Chinese Test Expiry" :read-only="readOnly" :display-value="form.education.chineseTestExpiry">
          <DatePickerEn v-model="form.education.chineseTestExpiry" />
        </StudentFormField>
      </template>
      <StudentFormField label="Credit Transfer?" :read-only="readOnly" :display-value="form.education.creditTransfer">
        <input v-model="form.education.creditTransfer" type="text" />
      </StudentFormField>
      <StudentFormField label="Remarks" full-width :read-only="readOnly" :display-value="form.education.remarks">
        <textarea v-model="form.education.remarks" rows="3" />
      </StudentFormField>
    </div>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
.section-title { margin: 20px 0 12px; font-size: 13px; font-weight: 700; color: #2563eb; letter-spacing: 0.04em; }
@media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
