<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  formatDdMmYyyyInput,
  parseDdMmYyyy,
  formatDateToDdMmYyyy,
  isValidDdMmYyyy,
  formatMmYyyyInput,
  parseMmYyyy,
  formatDateToMmYyyy,
  isValidMmYyyy,
} from '../../data/universityInfo.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  hasError: { type: Boolean, default: false },
  /** DD/MM/YYYY 或带时间；可选日不得早于此日（含当日） */
  minDate: { type: String, default: '' },
  /** DD/MM/YYYY 或带时间；可选日不得晚于此日（含当日） */
  maxDate: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'date',
    validator: (value) => ['date', 'month', 'datetime'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const panelRef = ref(null)
const open = ref(false)
const draft = ref(props.modelValue || '')
const timeHour = ref('00')
const timeMinute = ref('00')
const timeSecond = ref('00')
/** datetime：已点选的日历日，确认前暂存 */
const pendingDay = ref(null)
const panelStyle = ref({})
const placement = ref('bottom')

const PANEL_GAP = 6
const PANEL_EST_HEIGHT = 360
const VIEWPORT_PADDING = 8

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

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const viewDate = ref(new Date())

const isMonthMode = computed(() => props.mode === 'month')
const isDatetimeMode = computed(() => props.mode === 'datetime')

const effectivePlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  if (isMonthMode.value) return 'mm/yyyy'
  if (isDatetimeMode.value) return 'dd/mm/yyyy hh:mm:ss'
  return 'dd/mm/yyyy'
})

function pad2(n) {
  return String(n).padStart(2, '0')
}

function clampTimePart(value, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(max, Math.max(0, Math.floor(n)))
}

function parseDatetimeValue(value) {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!match) return null
  const date = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    Number(match[4] || 0),
    Number(match[5] || 0),
    Number(match[6] || 0),
    0,
  )
  if (Number.isNaN(date.getTime())) return null
  return date
}

function isValidDatetimeValue(value) {
  return Boolean(parseDatetimeValue(value))
}

function formatDatetimeInput(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 14)
  let out = ''
  if (digits.length <= 2) out = digits
  else if (digits.length <= 4) out = `${digits.slice(0, 2)}/${digits.slice(2)}`
  else if (digits.length <= 8) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  else if (digits.length <= 10) {
    out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8)}`
  } else if (digits.length <= 12) {
    out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8, 10)}:${digits.slice(10)}`
  } else {
    out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12)}`
  }
  return out
}

function formatDateToDatetime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${formatDateToDdMmYyyy(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function composeDatetimeFromParts(dayDate) {
  if (!dayDate) return ''
  const h = clampTimePart(timeHour.value, 23)
  const m = clampTimePart(timeMinute.value, 59)
  const s = clampTimePart(timeSecond.value, 59)
  const d = new Date(
    dayDate.getFullYear(),
    dayDate.getMonth(),
    dayDate.getDate(),
    h,
    m,
    s,
    0,
  )
  return formatDateToDatetime(d)
}

function syncTimeFromValue(value) {
  const parsed = isDatetimeMode.value ? parseDatetimeValue(value) : null
  if (!parsed) {
    timeHour.value = '00'
    timeMinute.value = '00'
    timeSecond.value = '00'
    return
  }
  timeHour.value = pad2(parsed.getHours())
  timeMinute.value = pad2(parsed.getMinutes())
  timeSecond.value = pad2(parsed.getSeconds())
}

function parseValue(value) {
  if (isMonthMode.value) return parseMmYyyy(value)
  if (isDatetimeMode.value) return parseDatetimeValue(value)
  return parseDdMmYyyy(value)
}

function isValidValue(value) {
  if (isMonthMode.value) return isValidMmYyyy(value)
  if (isDatetimeMode.value) return isValidDatetimeValue(value)
  return isValidDdMmYyyy(value)
}

function formatInput(raw) {
  if (isMonthMode.value) return formatMmYyyyInput(raw)
  if (isDatetimeMode.value) return formatDatetimeInput(raw)
  return formatDdMmYyyyInput(raw)
}

function formatDateValue(date) {
  if (isMonthMode.value) return formatDateToMmYyyy(date)
  if (isDatetimeMode.value) return formatDateToDatetime(date)
  return formatDateToDdMmYyyy(date)
}

watch(
  () => [props.modelValue, props.mode],
  ([value]) => {
    draft.value = value || ''
    syncTimeFromValue(value)
    const parsed = parseValue(value)
    if (parsed) {
      viewDate.value = new Date(parsed.getFullYear(), parsed.getMonth(), 1)
      if (isDatetimeMode.value) pendingDay.value = parsed
    }
  },
  { immediate: true },
)

const panelTitle = computed(() => {
  if (isMonthMode.value) return String(viewDate.value.getFullYear())
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

const selectedDate = computed(() => {
  if (isDatetimeMode.value && pendingDay.value) return pendingDay.value
  return parseValue(props.modelValue)
})

const selectedMonthYear = computed(() => {
  if (!isMonthMode.value || !isValidMmYyyy(props.modelValue)) return null
  const [, mm, yyyy] = props.modelValue.trim().match(/^(\d{2})\/(\d{4})$/)
  return { month: Number(mm) - 1, year: Number(yyyy) }
})

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseBoundDate(value) {
  if (!value) return null
  return parseDatetimeValue(value) || parseDdMmYyyy(value)
}

function isDateDisabled(date) {
  if (!date || isMonthMode.value) return false
  const day = startOfDay(date)
  const min = props.minDate ? parseBoundDate(props.minDate) : null
  const max = props.maxDate ? parseBoundDate(props.maxDate) : null
  if (min && day < startOfDay(min)) return true
  if (max && day > startOfDay(max)) return true
  return false
}

function isValueInRange(value) {
  if (!value || !isValidValue(value)) return false
  if (isMonthMode.value) return true
  const parsed = parseValue(value)
  return parsed ? !isDateDisabled(parsed) : false
}

function emitValue(value) {
  emit('update:modelValue', value)
}

function onInput(event) {
  draft.value = formatInput(event.target.value)
  event.target.value = draft.value
}

function onBlur() {
  const trimmed = draft.value.trim()
  if (!trimmed) {
    emitValue('')
    return
  }
  if (isDatetimeMode.value) {
    const parsed = parseDatetimeValue(trimmed)
    if (parsed && isValueInRange(formatDateToDatetime(parsed))) {
      const normalized = formatDateToDatetime(parsed)
      draft.value = normalized
      emitValue(normalized)
      syncTimeFromValue(normalized)
      return
    }
    draft.value = props.modelValue || ''
    return
  }
  if (isValidValue(trimmed) && isValueInRange(trimmed)) {
    emitValue(trimmed)
    return
  }
  draft.value = props.modelValue || ''
}

function panelWidth() {
  return isDatetimeMode.value ? 300 : 280
}

function updatePanelPosition() {
  if (!open.value || !rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const panelHeight = panelRef.value?.offsetHeight || PANEL_EST_HEIGHT
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING
  const openAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow
  placement.value = openAbove ? 'top' : 'bottom'

  const width = panelWidth()
  let left = rect.left
  if (left + width > window.innerWidth - VIEWPORT_PADDING) {
    left = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)
  }
  left = Math.max(VIEWPORT_PADDING, left)

  if (openAbove) {
    const bottom = window.innerHeight - rect.top + PANEL_GAP
    panelStyle.value = {
      top: 'auto',
      bottom: `${bottom}px`,
      left: `${left}px`,
      width: `${width}px`,
    }
  } else {
    let top = rect.bottom + PANEL_GAP
    if (top + panelHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = Math.max(VIEWPORT_PADDING, window.innerHeight - panelHeight - VIEWPORT_PADDING)
    }
    panelStyle.value = {
      top: `${top}px`,
      bottom: 'auto',
      left: `${left}px`,
      width: `${width}px`,
    }
  }
}

function syncViewDate() {
  const parsed = parseValue(props.modelValue) || new Date()
  viewDate.value = new Date(parsed.getFullYear(), parsed.getMonth(), 1)
  if (isDatetimeMode.value) {
    syncTimeFromValue(props.modelValue)
    pendingDay.value = parsed
  }
}

async function openPanel() {
  if (props.disabled) return
  syncViewDate()
  open.value = true
  await nextTick()
  updatePanelPosition()
  await nextTick()
  updatePanelPosition()
}

function togglePanel() {
  if (props.disabled) return
  if (open.value) {
    open.value = false
    return
  }
  openPanel()
}

function onInputClick() {
  if (props.disabled) return
  if (!isMonthMode.value) return
  openPanel()
}

function prevPeriod() {
  if (isMonthMode.value) {
    viewDate.value = new Date(viewDate.value.getFullYear() - 1, viewDate.value.getMonth(), 1)
    return
  }
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

function nextPeriod() {
  if (isMonthMode.value) {
    viewDate.value = new Date(viewDate.value.getFullYear() + 1, viewDate.value.getMonth(), 1)
    return
  }
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

function selectDay(date) {
  if (isDateDisabled(date)) return
  if (isDatetimeMode.value) {
    pendingDay.value = date
    draft.value = composeDatetimeFromParts(date)
    return
  }
  emitValue(formatDateValue(date))
  open.value = false
}

function confirmDatetime() {
  const day = pendingDay.value || parseDatetimeValue(draft.value) || parseDatetimeValue(props.modelValue)
  if (!day || isDateDisabled(day)) return
  const next = composeDatetimeFromParts(day)
  if (!isValueInRange(next)) return
  draft.value = next
  emitValue(next)
  open.value = false
}

function onTimePartChange() {
  timeHour.value = pad2(clampTimePart(timeHour.value, 23))
  timeMinute.value = pad2(clampTimePart(timeMinute.value, 59))
  timeSecond.value = pad2(clampTimePart(timeSecond.value, 59))
  if (pendingDay.value) {
    draft.value = composeDatetimeFromParts(pendingDay.value)
  }
}

function selectMonth(monthIndex) {
  const mm = String(monthIndex + 1).padStart(2, '0')
  const yyyy = viewDate.value.getFullYear()
  emitValue(`${mm}/${yyyy}`)
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

function isSelectedMonth(monthIndex) {
  const selected = selectedMonthYear.value
  if (!selected) return false
  return selected.month === monthIndex && selected.year === viewDate.value.getFullYear()
}

function isCurrentMonth(monthIndex) {
  const today = new Date()
  return today.getMonth() === monthIndex && today.getFullYear() === viewDate.value.getFullYear()
}

function setToday() {
  const today = new Date()
  if (isDateDisabled(today)) return
  if (isDatetimeMode.value) {
    pendingDay.value = today
    timeHour.value = pad2(today.getHours())
    timeMinute.value = pad2(today.getMinutes())
    timeSecond.value = pad2(today.getSeconds())
    draft.value = composeDatetimeFromParts(today)
    return
  }
  emitValue(formatDateValue(today))
  viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
  open.value = false
}

function clearValue() {
  draft.value = ''
  pendingDay.value = null
  timeHour.value = '00'
  timeMinute.value = '00'
  timeSecond.value = '00'
  emitValue('')
  open.value = false
}

function onDocumentClick(event) {
  if (!open.value) return
  if (rootRef.value && rootRef.value.contains(event.target)) return
  if (panelRef.value && panelRef.value.contains(event.target)) return
  open.value = false
  if (!isMonthMode.value) onBlur()
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    open.value = false
    draft.value = props.modelValue || ''
  }
}

function onViewportChange() {
  if (!open.value) return
  updatePanelPosition()
}

watch(open, (isOpen) => {
  if (!isOpen) return
  nextTick(() => updatePanelPosition())
})

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
</script>

<template>
  <div
    ref="rootRef"
    class="date-picker-en"
    :class="{
      'has-error': hasError,
      open,
      'mode-month': isMonthMode,
      'mode-datetime': isDatetimeMode,
      'is-disabled': disabled,
    }"
  >
    <div class="date-picker-input-wrap" @click="onInputClick">
      <input
        type="text"
        class="date-picker-input"
        :value="draft"
        :placeholder="effectivePlaceholder"
        :readonly="isMonthMode || disabled"
        :disabled="disabled"
        inputmode="numeric"
        autocomplete="off"
        @input="onInput"
        @blur="onBlur"
        @focus="draft = modelValue || draft"
      />
      <button
        type="button"
        class="date-picker-trigger"
        aria-label="Open calendar"
        :disabled="disabled"
        @click.stop="togglePanel"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="date-picker-panel"
        :class="[`placement-${placement}`, { 'mode-datetime': isDatetimeMode }]"
        :style="panelStyle"
        @click.stop
      >
        <div class="date-picker-header">
          <button type="button" class="nav-btn" :aria-label="isMonthMode ? 'Previous year' : 'Previous month'" @click="prevPeriod">‹</button>
          <span class="date-picker-title">{{ panelTitle }}</span>
          <button type="button" class="nav-btn" :aria-label="isMonthMode ? 'Next year' : 'Next month'" @click="nextPeriod">›</button>
        </div>

        <div v-if="isMonthMode" class="month-picker-grid">
          <button
            v-for="(label, index) in MONTH_ABBR"
            :key="label"
            type="button"
            class="month-btn"
            :class="{ selected: isSelectedMonth(index), current: isCurrentMonth(index) }"
            @click="selectMonth(index)"
          >
            {{ label }}
          </button>
        </div>

        <template v-else>
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
                  disabled: isDateDisabled(cell),
                }"
                :disabled="isDateDisabled(cell)"
                @click="selectDay(cell)"
              >
                {{ cell.getDate() }}
              </button>
            </span>
          </div>

          <div v-if="isDatetimeMode" class="time-row">
            <label class="time-label">Time</label>
            <div class="time-inputs">
              <input v-model="timeHour" type="number" min="0" max="23" class="time-input" @change="onTimePartChange" />
              <span>:</span>
              <input v-model="timeMinute" type="number" min="0" max="59" class="time-input" @change="onTimePartChange" />
              <span>:</span>
              <input v-model="timeSecond" type="number" min="0" max="59" class="time-input" @change="onTimePartChange" />
            </div>
          </div>
        </template>

        <div v-if="!isMonthMode" class="date-picker-footer">
          <button type="button" class="footer-btn" @click="clearValue">Clear</button>
          <button type="button" class="footer-btn" @click="setToday">Today</button>
          <button v-if="isDatetimeMode" type="button" class="footer-btn primary" @click="confirmDatetime">OK</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.date-picker-en {
  position: relative;
  width: 100%;
}

.date-picker-en.is-disabled .date-picker-input-wrap {
  opacity: 0.65;
  cursor: not-allowed;
}

.date-picker-en.is-disabled .date-picker-input,
.date-picker-en.is-disabled .date-picker-trigger {
  cursor: not-allowed;
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

.date-picker-en.mode-datetime .date-picker-input {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.date-picker-input::placeholder {
  color: #9ca3af;
}

.date-picker-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.date-picker-en.mode-month .date-picker-input-wrap {
  cursor: pointer;
}

.date-picker-en.mode-month .date-picker-input {
  cursor: pointer;
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
  position: fixed;
  z-index: 2000;
  width: 280px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
}

.date-picker-panel.mode-datetime {
  width: 300px;
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

.month-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 2px;
}

.month-btn {
  height: 36px;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
}

.month-btn:hover {
  background: #eff6ff;
  color: #2563eb;
}

.month-btn.current {
  border: 1px solid #93c5fd;
}

.month-btn.selected {
  background: #2563eb;
  color: #fff;
}

.month-btn.selected:hover {
  background: #1d4ed8;
  color: #fff;
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

.day-btn.disabled,
.day-btn:disabled {
  color: #d1d5db;
  cursor: not-allowed;
  background: transparent;
}

.day-btn.disabled:hover,
.day-btn:disabled:hover {
  background: transparent;
  color: #d1d5db;
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

.time-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.time-label {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.time-inputs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.time-input {
  width: 44px;
  height: 30px;
  padding: 0 4px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  color: #111827;
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
