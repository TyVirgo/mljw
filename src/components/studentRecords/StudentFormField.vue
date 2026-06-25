<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
  readOnly: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
  displayValue: { type: [String, Number], default: '' },
})

const { tr } = useAppI18n()

function isEmptyValue(value) {
  return value === null || value === undefined || value === ''
}

function showValue(value) {
  if (isEmptyValue(value)) return '—'
  return value
}
</script>

<template>
  <div class="form-field" :class="{ 'full-width': fullWidth, 'has-error': error, 'is-readonly': readOnly }">
    <label class="field-label">
      {{ tr(label) }}
      <span v-if="required && !readOnly" class="required">*</span>
    </label>
    <div
      v-if="readOnly"
      class="field-readonly"
      :class="{ 'is-empty': isEmptyValue(displayValue) }"
    >
      {{ showValue(displayValue) }}
    </div>
    <slot v-else />
    <p v-if="error && !readOnly" class="field-error">{{ tr(error) }}</p>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-field.is-readonly .field-label {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: 0.01em;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.field-readonly {
  min-height: 32px;
  padding: 4px 0 2px;
  font-size: 14px;
  color: #111827;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.form-field.is-readonly .field-readonly {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
}

.field-readonly.is-empty {
  font-size: 13px;
  font-weight: 400;
  color: #9ca3af;
  font-style: italic;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
  margin: 0;
}

.form-field :deep(input:not([type='checkbox']):not([type='radio'])),
.form-field :deep(select),
.form-field :deep(textarea) {
  width: 100%;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
}

.form-field.has-error :deep(input),
.form-field.has-error :deep(select),
.form-field.has-error :deep(textarea) {
  border-color: #ef4444;
}

.form-field :deep(textarea) {
  min-height: 80px;
  resize: vertical;
}
</style>
