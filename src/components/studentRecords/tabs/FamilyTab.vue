<script setup>
import StudentFormField from '../StudentFormField.vue'

defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
})
</script>

<template>
  <div class="form-grid">
    <StudentFormField label="Name" :read-only="readOnly" :display-value="form.family.name">
      <input v-model="form.family.name" type="text" />
    </StudentFormField>
    <StudentFormField label="IC / Passport" :read-only="readOnly" :display-value="form.family.icPassport">
      <input v-model="form.family.icPassport" type="text" />
    </StudentFormField>
    <StudentFormField label="Relationship" :read-only="readOnly" :display-value="form.family.relationship">
      <input v-model="form.family.relationship" type="text" />
    </StudentFormField>
    <StudentFormField label="Occupation" :read-only="readOnly" :display-value="form.family.occupation">
      <input v-model="form.family.occupation" type="text" />
    </StudentFormField>
    <StudentFormField label="Race" :read-only="readOnly" :display-value="form.family.race">
      <input v-model="form.family.race" type="text" />
    </StudentFormField>
    <StudentFormField label="Mobile Phone" :read-only="readOnly" :display-value="form.family.mobilePhone">
      <input v-model="form.family.mobilePhone" type="text" />
    </StudentFormField>
    <StudentFormField label="Office Phone" :read-only="readOnly" :display-value="form.family.officePhone">
      <input v-model="form.family.officePhone" type="text" />
    </StudentFormField>
    <StudentFormField label="Fax" :read-only="readOnly" :display-value="form.family.fax">
      <input v-model="form.family.fax" type="text" />
    </StudentFormField>
    <StudentFormField label="Email" :read-only="readOnly" :display-value="form.family.email">
      <input v-model="form.family.email" type="email" />
    </StudentFormField>
    <StudentFormField label="Income" :read-only="readOnly" :display-value="form.family.income">
      <input v-model="form.family.income" type="text" />
    </StudentFormField>
    <StudentFormField label="Total Liabilities" :read-only="readOnly" :display-value="form.family.totalLiabilities">
      <input v-model="form.family.totalLiabilities" type="text" />
    </StudentFormField>
    <StudentFormField label="Mailing Address" full-width :read-only="readOnly" :display-value="form.family.mailingAddress">
      <textarea v-model="form.family.mailingAddress" rows="3" />
    </StudentFormField>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
@media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
