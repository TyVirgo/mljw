<script setup>
import StudentFormField from '../StudentFormField.vue'
import DatePickerEn from '../../common/DatePickerEn.vue'
import { accommodationCodeSetIds, getCodeSetOptions } from '../../../data/codeSets.js'
import { useAppI18n } from '../../../composables/useAppI18n.js'

defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
})

const { tr } = useAppI18n()

const hostelStatusOptions = getCodeSetOptions(accommodationCodeSetIds.hostelStatus)
const roomTypeOptions = getCodeSetOptions(accommodationCodeSetIds.roomType)
const campusOptions = getCodeSetOptions(accommodationCodeSetIds.campus)
const blockNoOptions = getCodeSetOptions(accommodationCodeSetIds.blockNo)
const roomNoOptions = getCodeSetOptions(accommodationCodeSetIds.roomNo)
</script>

<template>
  <div class="form-grid">
    <StudentFormField label="Hostel Status" :read-only="readOnly" :display-value="tr(form.accommodation.hostelStatus) || form.accommodation.hostelStatus">
      <select v-model="form.accommodation.hostelStatus">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in hostelStatusOptions" :key="opt.value" :value="opt.value">{{ tr(opt.label) }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Room Type" :read-only="readOnly" :display-value="form.accommodation.roomType">
      <select v-model="form.accommodation.roomType">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in roomTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Campus" :read-only="readOnly" :display-value="form.accommodation.campus">
      <select v-model="form.accommodation.campus">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in campusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Block No" :read-only="readOnly" :display-value="form.accommodation.blockNo">
      <select v-model="form.accommodation.blockNo">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in blockNoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </StudentFormField>
    <StudentFormField label="Floor No" :read-only="readOnly" :display-value="form.accommodation.floorNo">
      <input v-model="form.accommodation.floorNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Unit No" :read-only="readOnly" :display-value="form.accommodation.unitNo">
      <input v-model="form.accommodation.unitNo" type="text" />
    </StudentFormField>
    <StudentFormField label="Room No" :read-only="readOnly" :display-value="form.accommodation.roomNo">
      <select v-model="form.accommodation.roomNo">
        <option value="">{{ tr('please select') }}</option>
        <option v-for="opt in roomNoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
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
