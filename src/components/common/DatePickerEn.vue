<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  formatDdMmYyyyInput,
  parseDdMmYyyy,
  formatDateToDdMmYyyy,
  isValidDdMmYyyy,
} from '../../data/universityInfo.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'dd/mm/yyyy' },
  hasError: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const open = ref(false)
const draft = ref(props.modelValue || '')

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const viewDate = ref(new Date())

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value || ''
    const parsed = parseDdMmYyyy(value)
    if (parsed) viewDate.value = new Date(parsed.getFullYear(), parsed.getMonth(), 1)
  },
  { immediate: true },
)

const panelTitle = computed(() => {
  return `${MONTHS[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`
})

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  return cells
})

const selectedDate = computed(() => parseDdMmYyyy(props.modelValue))

function emitValue(value) {
  emit('update:modelValue', value)
}

function onInput(event) {
  draft.value = formatDdMmYyyyInput(event.target.value)
  event.target.value = draft.value
}

function onBlur() {
  const trimmed = draft.value.trim()
  if (!trimmed) {
    emitValue('')
    return
  }
  if (isValidDdMmYyyy(trimmed)) {
    emitValue(trimmed)
    return
  }
  draft.value = props.modelValue || ''
}

function togglePanel() {
  open.value = !open.value
  if (open.value) {
    const parsed = parseDdMmYyyy(props.modelValue) || new Date()
    viewDate.value = new Date(parsed.getFullYear(), parsed.getMonth(), 1)
  }
}

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

function selectDay(date) {
  emitValue(formatDateToDdMmYyyy(date))
  open.value = false
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(date) {
  const today = new Date()
  return isSameDay(date, today)
}

function setToday() {
  const today = new Date()
  emitValue(formatDateToDdMmYyyy(today))
  viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
  open.value = false
}

function clearValue() {
  draft.value = ''
  emitValue('')
  open.value = false
}

function onDocumentClick(event) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(event.target)) {
    open.value = false
    onBlur()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    open.value = false
    draft.value = props.modelValue || ''
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootRef" class="date-picker-en" :class="{ 'has-error': hasError, open }">
    <div class="date-picker-input-wrap">
      <input
        type="text"
        class="date-picker-input"
        :value="draft"
        :placeholder="placeholder"
        inputmode="numeric"
        autocomplete="off"
        @input="onInput"
        @blur="onBlur"
        @focus="draft = modelValue || draft"
      />
      <button type="button" class="date-picker-trigger" aria-label="Open calendar" @click.stop="togglePanel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>

    <div v-if="open" class="date-picker-panel" @click.stop>
      <div class="date-picker-header">
        <button type="button" class="nav-btn" aria-label="Previous month" @click="prevMonth">‹</button>
        <span class="date-picker-title">{{ panelTitle }}</span>
        <button type="button" class="nav-btn" aria-label="Next month" @click="nextMonth">›</button>
      </div>

      <div class="date-picker-weekdays">
        <span v-for="day in WEEKDAYS" :key="day">{{ day }}</span>
      </div>

      <div class="date-picker-grid">
        <span v-for="(cell, index) in calendarDays" :key="index" class="day-cell" :class="{ empty: !cell }">
          <button
            v-if="cell"
            type="button"
            class="day-btn"
            :class="{
              selected: isSameDay(cell, selectedDate),
              today: isToday(cell),
            }"
            @click="selectDay(cell)"
          >
            {{ cell.getDate() }}
          </button>
        </span>
      </div>

      <div class="date-picker-footer">
        <button type="button" class="footer-btn" @click="clearValue">Clear</button>
        <button type="button" class="footer-btn primary" @click="setToday">Today</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-picker-en {
  position: relative;
  width: 100%;
}

.date-picker-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.date-picker-input {
  width: 100%;
  height: 36px;
  padding: 0 40px 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
}

.date-picker-input::placeholder {
  color: #9ca3af;
}

.date-picker-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.date-picker-en.has-error .date-picker-input {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.12);
}

.date-picker-en.open .date-picker-input,
.date-picker-en.open .date-picker-trigger {
  border-color: #2563eb;
}

.date-picker-trigger {
  position: absolute;
  right: 0;
  top: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
}

.date-picker-trigger svg {
  width: 16px;
  height: 16px;
}

.date-picker-en.open .date-picker-trigger {
  color: #2563eb;
}

.date-picker-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  width: 280px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.date-picker-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 18px;
  line-height: 1;
  color: #374151;
}

.nav-btn:hover {
  background: #f3f4f6;
}

.date-picker-weekdays,
.date-picker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}

.date-picker-weekdays {
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.day-cell {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell.empty {
  pointer-events: none;
}

.day-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
}

.day-btn:hover {
  background: #eff6ff;
  color: #2563eb;
}

.day-btn.today {
  border: 1px solid #93c5fd;
}

.day-btn.selected {
  background: #2563eb;
  color: #fff;
}

.day-btn.selected:hover {
  background: #1d4ed8;
  color: #fff;
}

.date-picker-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.footer-btn {
  flex: 1;
  height: 32px;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.footer-btn:hover {
  background: #f3f4f6;
}

.footer-btn.primary {
  color: #fff;
  background: #2563eb;
  border-color: #2563eb;
}

.footer-btn.primary:hover {
  background: #1d4ed8;
}
</style>
