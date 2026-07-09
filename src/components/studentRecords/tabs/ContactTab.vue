<script setup>
import StudentFormField from '../StudentFormField.vue'
import { getStudentProfileFieldLabelKey } from '../../../data/studentProfileFieldLabels.js'

const props = defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
})

function err(field) {
  return props.errors[`contact.${field}`] || ''
}
</script>

<template>
  <div class="form-grid">
    <StudentFormField :label="getStudentProfileFieldLabelKey('mobilePhone')" required :read-only="readOnly" :error="err('mobilePhone')" :display-value="form.contact.mobilePhone">
      <input v-model="form.contact.mobilePhone" type="text" />
    </StudentFormField>
    <StudentFormField label="House Phone" :read-only="readOnly" :display-value="form.contact.housePhone">
      <input v-model="form.contact.housePhone" type="text" />
    </StudentFormField>
    <StudentFormField label="Email" required :read-only="readOnly" :error="err('email')" :display-value="form.contact.email">
      <input v-model="form.contact.email" type="email" />
    </StudentFormField>
    <StudentFormField label="Permanent Address" full-width :read-only="readOnly" :display-value="form.contact.permanentAddress">
      <textarea v-model="form.contact.permanentAddress" rows="3" />
    </StudentFormField>
    <StudentFormField label="Mailing Address" full-width :read-only="readOnly" :display-value="form.contact.mailingAddress">
      <textarea v-model="form.contact.mailingAddress" rows="3" />
    </StudentFormField>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
@media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }
</style>
