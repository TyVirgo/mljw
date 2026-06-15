<script setup>
import StudentFormField from '../StudentFormField.vue'
import DatePickerEn from '../../common/DatePickerEn.vue'
import { hostelStatusOptions } from '../../../data/students.js'
import { useAppI18n } from '../../../composables/useAppI18n.js'

defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
})

const { tr } = useAppI18n()
</script>

<template>
  <div class="form-grid">
    <StudentFormField label="Hostel Status" :read-only="readOnly" :display-value="tr(form.accommodation.hostelStatus) || form.accommodation.hostelStatus">
      <select v-model="form.accommodation.hostelStatus">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in hostelStatusOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Room Type" :read-only="readOnly" :display-value="form.accommodation.roomType">
      <input v-model="form.accommodation.roomType" type="text" />
    </StudentFormField>
    <StudentFormField label="Campus" :read-only="readOnly" :display-value="form.accommodation.campus">
      <input v-model="form.accommodation.campus" type="text" />
    </StudentFormField>
    <StudentFormField label="Block No" :read-only="readOnly" :display-value="form.accommodation.blockNo">
      <input v-model="form.accommodation.blockNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Floor No" :read-only="readOnly" :display-value="form.accommodation.floorNo">
      <input v-model="form.accommodation.floorNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Unit No" :read-only="readOnly" :display-value="form.accommodation.unitNo">
      <input v-model="form.accommodation.unitNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Room No" :read-only="readOnly" :display-value="form.accommodation.roomNo">
      <input v-model="form.accommodation.roomNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Bed No" :read-only="readOnly" :display-value="form.accommodation.bedNo">
      <input v-model="form.accommodation.bedNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Check In Date" :read-only="readOnly" :display-value="form.accommodation.checkInDate">
      <DatePickerEn v-model="form.accommodation.checkInDate" />
    </StudentFormField>
    <StudentFormField label="Expected Check Out" :read-only="readOnly" :display-value="form.accommodation.expectedCheckOut">
      <DatePickerEn v-model="form.accommodation.expectedCheckOut" />
    </StudentFormField>
    <StudentFormField label="Amount Receivable" :read-only="readOnly" :display-value="form.accommodation.amountReceivable">
      <input v-model="form.accommodation.amountReceivable" type="text" />
    </StudentFormField>
    <StudentFormField label="Money Received" :read-only="readOnly" :display-value="form.accommodation.moneyReceived">
      <input v-model="form.accommodation.moneyReceived" type="text" />
    </StudentFormField>
    <StudentFormField label="Outstanding Amount" :read-only="readOnly" :display-value="form.accommodation.outstandingAmount">
      <input v-model="form.accommodation.outstandingAmount" type="text" />
    </StudentFormField>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
@media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
