<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  formatHourRangeLabel,
  formatVenueDisplay,
} from '../../data/courseRegistration/sectionScheduleFields.js'

const props = defineProps({
  schedule: { type: Array, default: () => [] },
  conflictCourses: { type: Array, default: () => [] },
  /** 展示必修/已确认/本轮选择图例 */
  showLegend: { type: Boolean, default: false },
})

const { t, isZh } = useAppI18n()

const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

/** 内部 day key 仍用英文，与 time 解析一致 */
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKEND_KEYS = new Set(['Sat', 'Sun'])
/** 8:00–21:00 行，末格覆盖至 22:00 */
const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

const dayHeaders = computed(() =>
  DAY_KEYS.map((key) => ({
    key,
    label: t(`courseRegistration.student.scheduleDay.${key}`),
    weekend: WEEKEND_KEYS.has(key),
  })),
)

function findSlot(day, hour) {
  return props.schedule.find(
    (s) => s.day === day && hour >= Math.floor(s.start) && hour < Math.ceil(s.end),
  )
}

function isSlotStart(slot, hour) {
  return Boolean(slot) && hour === Math.floor(slot.start)
}

function isSlotContinuation(day, hour) {
  const slot = findSlot(day, hour)
  return Boolean(slot) && !isSlotStart(slot, hour)
}

function slotRowSpan(slot) {
  if (!slot) return 1
  return Math.max(1, Math.ceil(slot.end) - Math.floor(slot.start))
}

function cellClass(slot, dayKey) {
  const weekend = WEEKEND_KEYS.has(dayKey) ? 'is-weekend' : ''
  if (!slot) return weekend
  if (props.conflictCourses.includes(slot.course)) return ['cell-conflict', weekend]
  const layer = slot.layer || (slot.preview ? 'preview' : 'confirmed')
  const stroke = slot.stroke === 'dashed' || layer === 'preview' ? 'is-dashed' : 'is-solid'
  if (layer === 'required') return ['cell-required', stroke, weekend]
  if (layer === 'preview') return ['cell-preview', stroke, weekend]
  return ['cell-confirmed', stroke, weekend]
}

function displayName(slot) {
  if (!slot) return ''
  if (isZh.value) return slot.courseName || slot.courseNameEn || ''
  return slot.courseNameEn || slot.courseName || ''
}

function displayLecturer(slot) {
  if (!slot) return ''
  if (isZh.value) return slot.lecturer || slot.lecturerEn || ''
  return slot.lecturerEn || slot.lecturer || ''
}

function displayRoom(slot) {
  if (!slot?.room) return ''
  return formatVenueDisplay(slot.room)
}

function cellTitle(slot) {
  if (!slot) return ''
  const parts = [
    displayName(slot)
      ? `${slot.label || slot.course} ${displayName(slot)}`
      : slot.label || slot.course,
    displayLecturer(slot)
      ? `${t('courseRegistration.student.scheduleCellLecturer')}: ${displayLecturer(slot)}`
      : '',
    displayRoom(slot)
      ? `${t('courseRegistration.student.scheduleCellRoom')}: ${displayRoom(slot)}`
      : '',
    slot.weekRange
      ? `${t('courseRegistration.student.scheduleCellWeeks')}: ${slot.weekRange}`
      : '',
    layerLabel(slot),
  ]
  return parts.filter(Boolean).join('\n')
}

function layerLabel(slot) {
  const layer = slot.layer || (slot.preview ? 'preview' : 'confirmed')
  if (layer === 'required') return t('courseRegistration.student.scheduleLegendRequired')
  if (layer === 'preview') return t('courseRegistration.student.scheduleLegendPreview')
  return t('courseRegistration.student.scheduleLegendConfirmed')
}

function weekLine(slot) {
  if (!slot?.weekRange) return ''
  return t('courseRegistration.student.scheduleCellWeeksValue', { range: slot.weekRange })
}

function hourLabel(hour) {
  return formatHourRangeLabel(hour, timeLocale.value)
}
</script>

<template>
  <div class="week-grid-wrap">
    <ul v-if="showLegend" class="week-grid-legend" aria-label="schedule legend">
      <li>
        <span class="lg-swatch is-required is-solid" />{{
          t('courseRegistration.student.scheduleLegendRequired')
        }}
      </li>
      <li>
        <span class="lg-swatch is-confirmed is-solid" />{{
          t('courseRegistration.student.scheduleLegendConfirmed')
        }}
      </li>
      <li>
        <span class="lg-swatch is-preview is-dashed" />{{
          t('courseRegistration.student.scheduleLegendPreview')
        }}
      </li>
    </ul>
    <table class="week-grid">
      <thead>
        <tr>
          <th class="hour-head"></th>
          <th
            v-for="day in dayHeaders"
            :key="day.key"
            :class="{ 'is-weekend': day.weekend }"
          >
            {{ day.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hour in hours" :key="hour">
          <td class="hour-label">{{ hourLabel(hour) }}</td>
          <template v-for="day in dayHeaders" :key="`${day.key}-${hour}`">
            <td
              v-if="!isSlotContinuation(day.key, hour)"
              class="grid-cell"
              :class="cellClass(findSlot(day.key, hour), day.key)"
              :rowspan="findSlot(day.key, hour) ? slotRowSpan(findSlot(day.key, hour)) : 1"
              :title="cellTitle(findSlot(day.key, hour))"
            >
              <div v-if="findSlot(day.key, hour)" class="cell-block">
                <div class="cell-code">
                  {{ findSlot(day.key, hour).label || findSlot(day.key, hour).course }}
                </div>
                <div v-if="displayName(findSlot(day.key, hour))" class="cell-name">
                  {{ displayName(findSlot(day.key, hour)) }}
                </div>
                <div v-if="displayLecturer(findSlot(day.key, hour))" class="cell-meta">
                  {{ displayLecturer(findSlot(day.key, hour)) }}
                </div>
                <div v-if="displayRoom(findSlot(day.key, hour))" class="cell-meta">
                  {{ displayRoom(findSlot(day.key, hour)) }}
                </div>
                <div v-if="findSlot(day.key, hour).weekRange" class="cell-meta cell-weeks">
                  {{ weekLine(findSlot(day.key, hour)) }}
                </div>
              </div>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.week-grid-wrap {
  overflow-x: auto;
}

.week-grid-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin: 0 0 6px;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: #4b5563;
}

.week-grid-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lg-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  box-sizing: border-box;
}

.lg-swatch.is-required {
  background: #ede9fe;
  border: 1px solid #7c3aed;
}

.lg-swatch.is-confirmed {
  background: #dbeafe;
  border: 1px solid #2563eb;
}

.lg-swatch.is-preview {
  background: #ecfeff;
  border: 2px dashed #0891b2;
}

.week-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

.week-grid th,
.week-grid td {
  border: 1px solid #e5e7eb;
  padding: 2px 3px;
  text-align: center;
  min-width: 88px;
  vertical-align: middle;
}

.week-grid th.is-weekend,
.grid-cell.is-weekend:not(.cell-required):not(.cell-confirmed):not(.cell-preview):not(
    .cell-conflict
  ) {
  background: #f1f5f9;
}

.hour-head,
.hour-label {
  color: #6b7280;
  background: #f9fafb;
  width: 72px;
  min-width: 72px;
  max-width: 88px;
  text-align: center;
  vertical-align: middle;
  font-size: 10px;
  line-height: 1.25;
  white-space: normal;
  word-break: break-word;
}

.grid-cell {
  position: relative;
  height: 48px;
  background: #fff;
}

.cell-required {
  background: #ede9fe;
  color: #5b21b6;
}

.cell-confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.cell-preview {
  background: #ecfeff;
  color: #0e7490;
}

.cell-required.is-solid,
.cell-confirmed.is-solid {
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.22);
}

.cell-required.is-solid {
  box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.28);
}

/* 长虚线 + 大间隙，本轮选择更醒目 */
.cell-preview.is-dashed,
.cell-confirmed.is-dashed,
.cell-required.is-dashed {
  border: 2px dashed #0891b2;
  box-shadow: none;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 6px,
    rgba(8, 145, 178, 0.06) 6px,
    rgba(8, 145, 178, 0.06) 12px
  );
}

.cell-conflict {
  background: #fee2e2;
  color: #b91c1c;
}

.cell-block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2px 3px;
  line-height: 1.2;
  text-align: center;
  box-sizing: border-box;
  gap: 0;
}

.cell-code {
  font-size: 11px;
  font-weight: 700;
}

.cell-name {
  font-size: 11px;
  font-weight: 600;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-meta {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.92;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-weeks {
  font-weight: 600;
}
</style>
