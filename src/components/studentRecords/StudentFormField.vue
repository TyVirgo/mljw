<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  label: { type: String, required: true },
  labelHint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  derived: { type: Boolean, default: false },
  error: { type: String, default: '' },
  readOnly: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
  emptyDisplay: { type: String, default: '—' },
  displayValue: { type: [String, Number], default: '' },
})

const { tr } = useAppI18n()

function isEmptyValue(value) {
  return value === null || value === undefined || value === ''
}

function showValue(value) {
  if (isEmptyValue(value)) return props.emptyDisplay
  return value
}
</script>

<template>
  <div class="form-field" :class="{ 'full-width': fullWidth, 'has-error': error, 'is-readonly': readOnly, 'is-derived': derived && !readOnly }">
    <label class="field-label">
      {{ tr(label) }}
      <span v-if="labelHint" class="field-hint-tip-wrap" tabindex="0">
        <span class="field-hint-icon" aria-hidden="true">?</span>
        <span class="field-hint-tooltip" role="tooltip">{{ tr(labelHint) }}</span>
      </span>
      <span v-if="required && !readOnly" class="required">*</span>
    </label>
    <div
      v-if="readOnly"
      class="field-readonly"
      :class="{ 'is-empty': isEmptyValue(displayValue) && props.emptyDisplay }"
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
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

.field-hint-tip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  outline: none;
}

.field-hint-icon {
  width: 14px;
  height: 14px;
  border: 1px solid #9ca3af;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: help;
}

.field-hint-tooltip {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  width: max-content;
  max-width: min(240px, calc(100vw - 48px));
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  color: #374151;
  text-align: left;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  z-index: 10;
}

.field-hint-tip-wrap:hover .field-hint-tooltip,
.field-hint-tip-wrap:focus-within .field-hint-tooltip {
  opacity: 1;
  visibility: visible;
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

.form-field.is-derived :deep(input:not([type='checkbox']):not([type='radio'])),
.form-field.is-derived :deep(select) {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}
</style>
