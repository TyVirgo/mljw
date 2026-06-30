<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { filterNationalityOptions } from '../../data/nationalityOptions.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const inputRef = ref(null)
const open = ref(false)
const query = ref('')
const hasTyped = ref(false)

const displayValue = computed(() => props.modelValue || '')

const inputValue = computed(() => {
  if (!open.value) return displayValue.value
  return hasTyped.value ? query.value : displayValue.value
})

const filteredOptions = computed(() =>
  filterNationalityOptions(open.value && !hasTyped.value ? '' : query.value),
)

watch(
  () => props.modelValue,
  (value) => {
    if (!open.value) query.value = value || ''
  },
)

function openDropdown() {
  if (props.disabled) return
  open.value = true
  query.value = ''
  hasTyped.value = false
}

function closeDropdown() {
  open.value = false
  query.value = props.modelValue || ''
  hasTyped.value = false
}

function selectOption(option) {
  emit('update:modelValue', option)
  query.value = option
  closeDropdown()
  nextTick(() => inputRef.value?.blur())
}

function onInput(event) {
  hasTyped.value = true
  query.value = event.target.value
  open.value = true
}

function onKeydown(event) {
  if (event.key === 'Enter' && filteredOptions.value.length) {
    event.preventDefault()
    selectOption(filteredOptions.value[0])
  }
  if (event.key === 'Escape') {
    closeDropdown()
  }
}

function onBlur() {
  window.setTimeout(() => {
    if (!rootRef.value?.contains(document.activeElement)) closeDropdown()
  }, 120)
}

function onDocumentClick(event) {
  if (!rootRef.value?.contains(event.target)) closeDropdown()
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="rootRef" class="searchable-select" :class="{ 'is-open': open, 'is-disabled': disabled, 'has-error': hasError }">
    <input
      ref="inputRef"
      type="text"
      class="searchable-input"
      :value="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      autocomplete="off"
      @focus="openDropdown"
      @blur="onBlur"
      @input="onInput"
      @keydown="onKeydown"
    />
    <span class="searchable-chevron" aria-hidden="true">▾</span>
    <ul v-if="open && filteredOptions.length" class="searchable-list" role="listbox">
      <li
        v-for="option in filteredOptions"
        :key="option"
        role="option"
        class="searchable-option"
        :class="{ selected: option === modelValue }"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option }}
      </li>
    </ul>
    <p v-else-if="open && query.trim()" class="searchable-empty">—</p>
  </div>
</template>

<style scoped>
.searchable-select {
  position: relative;
  width: 100%;
}

.searchable-input {
  width: 100%;
  height: 36px;
  padding: 0 28px 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
}

.searchable-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.searchable-select.has-error .searchable-input {
  border-color: #ef4444;
}

.searchable-select.is-disabled .searchable-input {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.searchable-chevron {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #6b7280;
  pointer-events: none;
}

.searchable-list {
  position: absolute;
  z-index: 40;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.searchable-option {
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.searchable-option:hover,
.searchable-option.selected {
  background: #eff6ff;
  color: #1d4ed8;
}

.searchable-empty {
  position: absolute;
  z-index: 40;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  color: #9ca3af;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
</style>
