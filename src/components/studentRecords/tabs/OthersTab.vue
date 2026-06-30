<script setup>
import { computed } from 'vue'
import StudentFormField from '../StudentFormField.vue'
import DatePickerEn from '../../common/DatePickerEn.vue'
import { showsTaxRegistration } from '../../../data/students.js'

const props = defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
})

const showTaxReg = computed(() => showsTaxRegistration(props.form.studentCategory || ''))
</script>

<template>
  <div class="form-grid">
    <StudentFormField label="Registration Date" :read-only="readOnly" :display-value="form.others.registrationDate">
      <DatePickerEn v-model="form.others.registrationDate" />
    </StudentFormField>
    <StudentFormField
      v-if="showTaxReg"
      label="Tax Registration No"
      :read-only="readOnly"
      :display-value="form.others.taxRegistrationNo"
    >
      <input v-model="form.others.taxRegistrationNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Sponsor" :read-only="readOnly" :display-value="form.others.sponsor">
      <input v-model="form.others.sponsor" type="text" />
    </StudentFormField>
    <StudentFormField label="Remarks" full-width :read-only="readOnly" :display-value="form.others.remarks">
      <textarea v-model="form.others.remarks" rows="3" />
    </StudentFormField>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
@media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }
</style>
