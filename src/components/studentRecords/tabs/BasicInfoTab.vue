<script setup>
import { computed, ref } from 'vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import StudentFormField from '../StudentFormField.vue'
import DatePickerEn from '../../common/DatePickerEn.vue'
import {
  genderOptions,
  maritalStatusOptions,
  disabilityOptions,
  usesDisabilityDropdown,
  formatStudentPassExpiryEndDate,
} from '../../../data/students.js'
import {
  getStudentProfileFieldHintKey,
  getStudentProfileFieldLabelKey,
} from '../../../data/studentProfileFieldLabels.js'

const props = defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
  showStudentPassExpiryDetail: { type: Boolean, default: false },
})

const { tr } = useAppI18n()
const fileInputRef = ref(null)
const photoError = ref('')
const MAX_PHOTO_BYTES = 2 * 1024 * 1024

const category = computed(() => props.form.studentCategory || '')
const isLocal = computed(() => category.value === 'Local')
const isChina = computed(() => category.value === 'China')
const isChinaOrIntl = computed(() => category.value === 'China' || category.value === 'International')
const disabilityAsSelect = computed(() => usesDisabilityDropdown(category.value))

const studentPassExpiryDetailDisplay = computed(() => {
  if (isLocal.value) return ''
  return formatStudentPassExpiryEndDate(props.form.basicInfo) || ''
})

const outstandingFeeDisplay = computed(() => {
  const value = String(props.form.basicInfo?.outstandingFee || '').trim().toUpperCase()
  return value === 'Y' || value === 'N' ? value : ''
})

function err(field) {
  return props.errors[`basicInfo.${field}`] || ''
}

function disabilityDisplay() {
  const value = props.form.basicInfo.disability
  return disabilityAsSelect.value ? tr(value) || value : value
}

function onPhotoSelect(event) {
  photoError.value = ''
  const file = event.target.files?.[0]
  if (!file) return
  if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) {
    photoError.value = 'Please select a JPG or PNG image.'
    return
  }
  if (file.size > MAX_PHOTO_BYTES) {
    photoError.value = 'Image must be 2MB or smaller.'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    props.form.photo = { fileName: file.name, dataUrl: reader.result }
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="basic-info-tab">
    <div class="form-grid">
      <StudentFormField label="Full Name (English)" required :read-only="readOnly" :error="err('fullName')" :display-value="form.basicInfo.fullName">
        <input v-model="form.basicInfo.fullName" type="text" />
      </StudentFormField>
      <StudentFormField :label="getStudentProfileFieldLabelKey('chineseName')" :read-only="readOnly" :display-value="form.basicInfo.chineseName">
        <input v-model="form.basicInfo.chineseName" type="text" />
      </StudentFormField>
      <StudentFormField :label="getStudentProfileFieldLabelKey('gender')" :read-only="readOnly" :display-value="tr(form.basicInfo.gender)">
        <select v-model="form.basicInfo.gender">
          <option v-for="opt in genderOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
        </select>
      </StudentFormField>
      <StudentFormField :label="getStudentProfileFieldLabelKey('studentId')" required :read-only="readOnly" :error="err('studentId')" :display-value="form.basicInfo.studentId">
        <input v-model="form.basicInfo.studentId" type="text" />
      </StudentFormField>
      <StudentFormField label="Application No" :read-only="readOnly" :display-value="form.basicInfo.applicationNo">
        <input v-model="form.basicInfo.applicationNo" type="text" />
      </StudentFormField>

      <template v-if="isLocal">
        <StudentFormField :label="getStudentProfileFieldLabelKey('icNo')" required :read-only="readOnly" :error="err('icNo')" :display-value="form.basicInfo.icNo">
          <input v-model="form.basicInfo.icNo" type="text" />
        </StudentFormField>
        <StudentFormField label="State of Birth" :read-only="readOnly" :display-value="form.basicInfo.stateOfBirth">
          <input v-model="form.basicInfo.stateOfBirth" type="text" />
        </StudentFormField>
      </template>

      <template v-if="isChinaOrIntl">
        <StudentFormField label="Passport No." :read-only="readOnly" :display-value="form.basicInfo.passportNo">
          <input v-model="form.basicInfo.passportNo" type="text" />
        </StudentFormField>
        <StudentFormField label="Passport Expiry" :read-only="readOnly" :display-value="form.basicInfo.passportExpiry">
          <DatePickerEn v-model="form.basicInfo.passportExpiry" />
        </StudentFormField>
        <StudentFormField label="Place of Birth" :read-only="readOnly" :display-value="form.basicInfo.placeOfBirth">
          <input v-model="form.basicInfo.placeOfBirth" type="text" />
        </StudentFormField>
      </template>

      <template v-if="isChina">
        <StudentFormField label="Candidate No." :read-only="readOnly" :display-value="form.basicInfo.candidateNo">
          <input v-model="form.basicInfo.candidateNo" type="text" />
        </StudentFormField>
        <StudentFormField label="Political Outlook" :read-only="readOnly" :display-value="form.basicInfo.politicalOutlook">
          <input v-model="form.basicInfo.politicalOutlook" type="text" />
        </StudentFormField>
        <StudentFormField label="Identity No. (China ID)" :read-only="readOnly" :display-value="form.basicInfo.identityNoChina">
          <input v-model="form.basicInfo.identityNoChina" type="text" />
        </StudentFormField>
      </template>

      <StudentFormField label="Date of Birth" :read-only="readOnly" :display-value="form.basicInfo.dateOfBirth">
        <DatePickerEn v-model="form.basicInfo.dateOfBirth" />
      </StudentFormField>
      <StudentFormField label="Age" :read-only="readOnly" :display-value="form.basicInfo.age">
        <input v-model="form.basicInfo.age" type="text" />
      </StudentFormField>
      <StudentFormField label="Race" :read-only="readOnly" :display-value="form.basicInfo.race">
        <input v-model="form.basicInfo.race" type="text" />
      </StudentFormField>
      <StudentFormField label="Religion" :read-only="readOnly" :display-value="form.basicInfo.religion">
        <input v-model="form.basicInfo.religion" type="text" />
      </StudentFormField>
      <StudentFormField label="Marital Status" :read-only="readOnly" :display-value="tr(form.basicInfo.maritalStatus)">
        <select v-model="form.basicInfo.maritalStatus">
          <option v-for="opt in maritalStatusOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
        </select>
      </StudentFormField>
      <StudentFormField label="Disability" :read-only="readOnly" :display-value="disabilityDisplay()">
        <select v-if="disabilityAsSelect && !readOnly" v-model="form.basicInfo.disability">
          <option v-for="opt in disabilityOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
        </select>
        <input v-else-if="!readOnly" v-model="form.basicInfo.disability" type="text" />
      </StudentFormField>

      <template v-if="showStudentPassExpiryDetail">
        <StudentFormField
          :label="getStudentProfileFieldLabelKey('studentPassExpiryDate')"
          :label-hint="getStudentProfileFieldHintKey('studentPassExpiryDate')"
          :read-only="true"
          :empty-display="isLocal ? '—' : ''"
          :display-value="studentPassExpiryDetailDisplay"
        />
        <StudentFormField
          :label="getStudentProfileFieldLabelKey('outstandingFee')"
          :label-hint="getStudentProfileFieldHintKey('outstandingFee')"
          :read-only="true"
          empty-display="—"
          :display-value="outstandingFeeDisplay"
        />
      </template>
    </div>
    <div class="photo-panel">
      <div class="photo-title">{{ tr('Student Photo') }}</div>
      <div class="photo-box">
        <img v-if="form.photo?.dataUrl" :src="form.photo.dataUrl" alt="" class="photo-preview" />
        <div v-else class="photo-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
      </div>
      <input ref="fileInputRef" type="file" accept="image/jpeg,image/png" class="hidden-input" @change="onPhotoSelect" />
      <button v-if="!readOnly" type="button" class="upload-btn" @click="fileInputRef?.click()">{{ tr('Upload') }}</button>
      <p v-if="photoError" class="photo-error">{{ tr(photoError) }}</p>
    </div>
  </div>
</template>

<style scoped>
.basic-info-tab { display: grid; grid-template-columns: 1fr 180px; gap: 24px; align-items: start; }
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
.photo-panel { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.photo-title { font-size: 13px; font-weight: 600; color: #374151; }
.photo-box { width: 140px; height: 160px; border: 1px dashed #d1d5db; border-radius: 8px; background: #f9fafb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.photo-preview { width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { color: #9ca3af; }
.photo-placeholder svg { width: 48px; height: 48px; }
.hidden-input { display: none; }
.upload-btn { height: 32px; padding: 0 16px; border-radius: 6px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 500; }
.photo-error { font-size: 12px; color: #ef4444; text-align: center; margin: 0; }
@media (max-width: 900px) { .basic-info-tab { grid-template-columns: 1fr; } .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
