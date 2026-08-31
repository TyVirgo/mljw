<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  formatHourRangeLabel,
  formatVenueDisplay,
} from '../../data/courseRegistration/sectionScheduleFields.js'

const props = defineProps({
  schedule: { type: Array, default: () => [] },
  /** 展示必修/已确认/本轮选择图例 */
  showLegend: { type: Boolean, default: false },
  /** 撑满父级高度，行高随可用空间放大 */
  stretch: { type: Boolean, default: false },
})

const { t, isZh } = useAppI18n()

const timeLocale = computed(() => (isZh.value ? 'zh' : 'en'))

/** 内部 day key 仍用英文，与 time 解析一致 */
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKEND_KEYS = new Set(['Sat', 'Sun'])
/** 8:00–21:00 行，末格覆盖至 22:00 */
const HOUR_START = 8
const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
const ROW_H = 48
const ROW_H_MIN = 40
const ROW_H_MAX = 72
const HOUR_COUNT = hours.length
const BODY_H = HOUR_COUNT * ROW_H

const bodyRef = ref(null)
const rowH = ref(ROW_H)

function measureRowHeight() {
  if (!props.stretch || !bodyRef.value) {
    rowH.value = ROW_H
    return
  }
  const h = bodyRef.value.clientHeight
  if (h > 0) {
    rowH.value = Math.min(ROW_H_MAX, Math.max(ROW_H_MIN, Math.floor(h / HOUR_COUNT)))
  }
}

let resizeObserver = null

function setupStretchObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (!props.stretch || !bodyRef.value) {
    rowH.value = ROW_H
    return
  }
  resizeObserver = new ResizeObserver(measureRowHeight)
  resizeObserver.observe(bodyRef.value)
  measureRowHeight()
}

onMounted(() => {
  watch(
    () => props.stretch,
    async () => {
      await nextTick()
      setupStretchObserver()
    },
    { immediate: true },
  )
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const effectiveRowH = computed(() => (props.stretch ? rowH.value : ROW_H))
const effectiveBodyH = computed(() => HOUR_COUNT * effectiveRowH.value)

const dayHeaders = computed(() =>
  DAY_KEYS.map((key) => ({
    key,
    label: t(`courseRegistration.student.scheduleDay.${key}`),
    weekend: WEEKEND_KEYS.has(key),
  })),
)

function normalizeSlot(slot) {
  const startH = Math.floor(slot.start)
  const endH = Math.ceil(slot.end)
  return {
    ...slot,
    startH,
    endH,
    spanH: Math.max(1, endH - startH),
  }
}

/** 同天并行 lane：支持不同起始时间重叠 */
function placeSlotsForDay(day) {
  const slots = (props.schedule || [])
    .filter((s) => s.day === day)
    .map(normalizeSlot)
    .sort((a, b) => a.startH - b.startH || b.spanH - a.spanH)

  const laneEnds = []
  const placed = []

  for (const slot of slots) {
    let lane = laneEnds.findIndex((end) => end <= slot.startH)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(0)
    }
    laneEnds[lane] = slot.endH
    placed.push({ ...slot, lane })
  }

  for (const slot of placed) {
    const peers = placed.filter(
      (other) => other.startH < slot.endH && other.endH > slot.startH,
    )
    slot.laneCount = Math.max(...peers.map((p) => p.lane), 0) + 1
  }

  return placed
}

const placedByDay = computed(() => {
  const map = {}
  for (const day of DAY_KEYS) {
    map[day] = placeSlotsForDay(day)
  }
  return map
})

function blockStyle(slot) {
  const rh = effectiveRowH.value
  const inset = 1
  const topPx = (slot.startH - HOUR_START) * rh + inset
  const heightPx = slot.spanH * rh - inset * 2
  const laneWidth = 100 / slot.laneCount
  const leftPct = slot.lane * laneWidth
  return {
    top: `${topPx}px`,
    height: `${Math.max(heightPx, rh - inset * 2)}px`,
    left: `calc(${leftPct}% + ${inset}px)`,
    width: `calc(${laneWidth}% - ${inset * 2}px)`,
  }
}

function blockClass(slot) {
  const layer = slot.layer || (slot.preview ? 'preview' : 'confirmed')
  const stroke = slot.stroke === 'dashed' || layer === 'preview' ? 'is-dashed' : 'is-solid'
  const stacked = slot.laneCount > 1 ? 'is-narrow' : ''
  if (layer === 'required') return ['cell-block', 'is-required', stroke, stacked]
  if (layer === 'preview') return ['cell-block', 'is-preview', stroke, stacked]
  return ['cell-block', 'is-confirmed', stroke, stacked]
}

function displayCourseCode(slot) {
  return slot?.course || ''
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

function blockTitle(slot) {
  const parts = [
    displayCourseCode(slot),
    displayName(slot),
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
  return parts.filter(Boolean).join(' · ')
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

function slotKey(slot) {
  return `${slot.course}-${slot.sectionCode || ''}-${slot.startH}-${slot.lane}`
}
</script>

<template>
  <div
    class="week-grid-wrap"
    :class="{ 'is-stretch': stretch }"
    :style="{
      '--week-grid-row-h': `${effectiveRowH}px`,
      '--week-grid-body-h': stretch ? '100%' : `${BODY_H}px`,
      '--week-grid-stretch-h': stretch ? `${effectiveBodyH}px` : undefined,
    }"
  >
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

    <div class="week-grid">
      <div class="week-grid-header">
        <div class="hour-head corner" />
        <div
          v-for="day in dayHeaders"
          :key="`head-${day.key}`"
          class="day-head"
          :class="{ 'is-weekend': day.weekend }"
        >
          {{ day.label }}
        </div>
      </div>

      <div ref="bodyRef" class="week-grid-body">
        <div class="time-gutter">
          <div
            v-for="hour in hours"
            :key="`time-${hour}`"
            class="hour-label"
          >
            {{ hourLabel(hour) }}
          </div>
        </div>

        <div class="days-board">
          <div
            v-for="day in dayHeaders"
            :key="`col-${day.key}`"
            class="day-column"
            :class="{ 'is-weekend': day.weekend }"
          >
            <div
              v-for="hour in hours"
              :key="`${day.key}-cell-${hour}`"
              class="grid-cell"
            />
            <div class="day-blocks">
              <div
                v-for="slot in placedByDay[day.key]"
                :key="slotKey(slot)"
                :class="blockClass(slot)"
                :style="blockStyle(slot)"
                :title="blockTitle(slot)"
              >
                <div class="cell-code">{{ displayCourseCode(slot) }}</div>
                <div v-if="displayName(slot)" class="cell-name">{{ displayName(slot) }}</div>
                <div v-if="displayLecturer(slot)" class="cell-meta">{{ displayLecturer(slot) }}</div>
                <div v-if="displayRoom(slot)" class="cell-meta">{{ displayRoom(slot) }}</div>
                <div v-if="slot.weekRange" class="cell-meta cell-weeks">{{ weekLine(slot) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week-grid-wrap {
  overflow-x: auto;
  flex-shrink: 0;
}

.week-grid-wrap.is-stretch {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.lg-swatch.is-required.is-solid {
  background: #7c3aed;
}

.lg-swatch.is-confirmed.is-solid {
  background: #93c5fd;
}

.lg-swatch.is-preview.is-dashed {
  background: #ecfdf5;
  border: 2px dashed #34d399;
}

.week-grid {
  width: 100%;
  min-width: 704px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  text-align: center;
  flex-shrink: 0;
}

.week-grid-wrap.is-stretch .week-grid {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.week-grid-header {
  display: grid;
  grid-template-columns: 88px repeat(7, minmax(88px, 1fr));
  border-bottom: 1px solid #e5e7eb;
}

.hour-head,
.hour-label {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  color: #6b7280;
  font-weight: 500;
  padding: 2px 4px;
  text-align: center;
  font-size: 10px;
  line-height: 1.25;
  white-space: normal;
  word-break: break-word;
  box-sizing: border-box;
}

.hour-head.corner {
  border-right: 1px solid #e5e7eb;
}

.day-head {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  min-height: 32px;
  text-align: center;
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  border-right: 1px solid #e5e7eb;
  box-sizing: border-box;
}

.day-head.is-weekend {
  background: #fafafa;
  color: #9ca3af;
}

.week-grid-body {
  display: flex;
  align-items: stretch;
  min-height: var(--week-grid-body-h, 672px);
}

.week-grid-wrap.is-stretch .week-grid-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.week-grid-wrap.is-stretch .time-gutter,
.week-grid-wrap.is-stretch .day-column {
  height: var(--week-grid-stretch-h, auto);
  flex-shrink: 0;
}

.week-grid-wrap.is-stretch .day-column {
  min-height: var(--week-grid-stretch-h, auto);
}

.time-gutter {
  width: 88px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
}

.hour-label {
  height: var(--week-grid-row-h, 48px);
  min-height: var(--week-grid-row-h, 48px);
  border-bottom: 1px solid #e5e7eb;
}

.days-board {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, minmax(88px, 1fr));
  min-width: 0;
}

.day-column {
  position: relative;
  border-right: 1px solid #e5e7eb;
  min-height: var(--week-grid-body-h, 672px);
}

.day-column.is-weekend .grid-cell {
  background: #f1f5f9;
}

.grid-cell {
  height: var(--week-grid-row-h, 48px);
  min-height: var(--week-grid-row-h, 48px);
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  box-sizing: border-box;
}

.day-blocks {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.cell-block {
  position: absolute;
  pointer-events: auto;
  padding: 2px 3px;
  border-radius: 4px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  text-align: center;
  line-height: 1.2;
  gap: 0;
  min-width: 0;
}

.cell-block.is-required.is-solid {
  background: #7c3aed;
  color: #fff;
}

.cell-block.is-confirmed.is-solid {
  background: #93c5fd;
  color: #1e3a8a;
}

.cell-block.is-preview.is-dashed,
.cell-block.is-confirmed.is-dashed,
.cell-block.is-required.is-dashed {
  background: #ecfdf5;
  color: #065f46;
  border: 2px dashed #34d399;
}

.cell-code {
  font-weight: 700;
  font-size: clamp(10px, calc(var(--week-grid-row-h, 48px) * 0.24), 14px);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cell-name {
  font-size: clamp(10px, calc(var(--week-grid-row-h, 48px) * 0.22), 13px);
  font-weight: 600;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-meta {
  font-size: clamp(9px, calc(var(--week-grid-row-h, 48px) * 0.2), 12px);
  font-weight: 500;
  line-height: 1.2;
  opacity: 0.92;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-weeks {
  font-weight: 600;
}

.cell-block.is-narrow .cell-code {
  font-size: clamp(9px, calc(var(--week-grid-row-h, 48px) * 0.2), 12px);
}

.cell-block.is-narrow .cell-name {
  font-size: clamp(9px, calc(var(--week-grid-row-h, 48px) * 0.18), 11px);
}

.cell-block.is-narrow .cell-meta {
  font-size: clamp(8px, calc(var(--week-grid-row-h, 48px) * 0.16), 10px);
}
</style>
