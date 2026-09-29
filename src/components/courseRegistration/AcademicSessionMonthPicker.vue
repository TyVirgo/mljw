<script setup>
import DatePickerEn from '../common/DatePickerEn.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  hasError: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useAppI18n()

/** 常见学期起月：2 / 4 / 9 */
const SEMESTER_START_MONTHS = [2, 4, 9]

function onPickerUpdate(value) {
  emit('update:modelValue', value || '')
}
</script>

<template>
  <div class="academic-session-month-picker" :class="{ 'has-error': hasError, disabled }">
    <DatePickerEn
      mode="month"
      month-format="yyyy/mm"
      :model-value="modelValue"
      :has-error="hasError"
      :disabled="disabled"
      :month-panel-shortcuts="SEMESTER_START_MONTHS"
      :placeholder="t('courseRegistration.schedule.sessionMonthPlaceholder')"
      @update:model-value="onPickerUpdate"
    />
  </div>
</template>

<style scoped>
.academic-session-month-picker {
  min-width: 0;
}
</style>
