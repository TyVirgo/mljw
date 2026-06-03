<script setup>
import { ref, computed, watch } from 'vue'
import CalendarEventModal from '../components/calendar/CalendarEventModal.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import {
  getSemesterPeriodOptions,
  findSemesterRecordByKey,
  buildCalendarWeeks,
  buildCalendarTableRows,
  buildEventDateMap,
  createCalendarEventId,
  createAttachmentId,
  loadCalendarConfig,
  saveCalendarConfig,
  getDefaultCalendarConfig,
  validateCalendarSave,
  buildCalendarSavePayload,
  MAX_CALENDAR_REMARKS,
  MAX_ATTACHMENT_SIZE,
} from '../data/calendarInfo.js'
import { initialSemesterRecords } from '../data/semesterInfo.js'
import { useAppI18n } from '../composables/useAppI18n.js'
import { useDeleteConfirm } from '../composables/useDeleteConfirm.js'
import { exportCalendarToExcel } from '../utils/exportCalendarExcel.js'

const { t, tr } = useAppI18n()
const {
  deleteConfirmVisible,
  deleteConfirmMessage,
  requestDelete: requestDeleteConfirm,
  confirmDelete,
  cancelDelete,
} = useDeleteConfirm()

const semesterOptions = getSemesterPeriodOptions(initialSemesterRecords)

const searchSemesterKey = ref('202509')
const appliedSemesterKey = ref('202509')

const calendarRemarks = ref('')
const attachments = ref([])
const events = ref([])

const selectedDateKey = ref('')
const hoveredDateKey = ref('')
const eventModalVisible = ref(false)
const eventModalMode = ref('create')
const editingEvent = ref(null)
const saveMessage = ref('')
const saveError = ref('')

const fileInputRef = ref(null)

const appliedSemesterRecord = computed(() =>
  findSemesterRecordByKey(appliedSemesterKey.value, initialSemesterRecords),
)

const calendarWeeks = computed(() => buildCalendarWeeks(appliedSemesterRecord.value))

const calendarTableRows = computed(() => buildCalendarTableRows(calendarWeeks.value))

const eventDateMap = computed(() => buildEventDateMap(events.value))

const remarksCount = computed(() => calendarRemarks.value.length)

const weekdayLabels = computed(() => [
  tr('Sunday'),
  tr('Monday'),
  tr('Tuesday'),
  tr('Wednesday'),
  tr('Thursday'),
  tr('Friday'),
  tr('Saturday'),
])

function cloneConfig(config) {
  return {
    calendarRemarks: config.calendarRemarks || '',
    attachments: (config.attachments || []).map((item) => ({ ...item })),
    events: (config.events || []).map((item) => ({ ...item })),
  }
}

function loadDraftForSemester(semesterKey) {
  const stored = loadCalendarConfig(semesterKey)
  const hasStored =
    stored.events.length > 0 || stored.calendarRemarks || stored.attachments.length > 0
  const config = hasStored ? stored : getDefaultCalendarConfig(semesterKey)
  const draft = cloneConfig(config)
  calendarRemarks.value = draft.calendarRemarks
  attachments.value = draft.attachments
  events.value = draft.events
  selectedDateKey.value = ''
  saveMessage.value = ''
  saveError.value = ''
}

watch(
  () => appliedSemesterKey.value,
  (key) => {
    if (key) loadDraftForSemester(key)
  },
  { immediate: true },
)

function handleSearch() {
  if (!searchSemesterKey.value) {
    saveError.value = tr('Academic Year & Semester is required')
    return
  }
  appliedSemesterKey.value = searchSemesterKey.value
  saveError.value = ''
}

function handleReset() {
  searchSemesterKey.value = '202509'
  appliedSemesterKey.value = '202509'
  loadDraftForSemester('202509')
}

function getEventsForDate(dateKey) {
  return eventDateMap.value.get(dateKey) || []
}

function selectDate(dateKey) {
  if (!dateKey) return
  selectedDateKey.value = dateKey
}

function openCreateEvent(dateKey) {
  eventModalMode.value = 'create'
  editingEvent.value = null
  selectedDateKey.value = dateKey
  eventModalVisible.value = true
}

function openEditEvent(event) {
  eventModalMode.value = 'edit'
  editingEvent.value = { ...event }
  eventModalVisible.value = true
}

function closeEventModal() {
  eventModalVisible.value = false
  editingEvent.value = null
}

function handleEventSave(formData) {
  if (eventModalMode.value === 'edit' && editingEvent.value) {
    const index = events.value.findIndex((item) => item.id === editingEvent.value.id)
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...formData }
    }
  } else {
    events.value.push({
      id: createCalendarEventId(events.value),
      ...formData,
    })
  }
  closeEventModal()
  saveMessage.value = ''
  saveError.value = ''
}

function handleDayClick(day) {
  if (!day.inRange) return
  selectDate(day.dateKey)
}

function handleDayBadgeClick(day) {
  if (!day.inRange) return
  selectDate(day.dateKey)
  const dayEvents = getEventsForDate(day.dateKey)
  if (dayEvents.length) {
    openEditEvent(dayEvents[0])
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

function handleFileChange(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return

  const invalid = files.find((file) => file.size > MAX_ATTACHMENT_SIZE)
  if (invalid) {
    saveError.value = tr('Each attachment must not exceed 50 MB')
    return
  }

  files.forEach((file) => {
    attachments.value.push({
      id: createAttachmentId(attachments.value),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    })
  })
  saveError.value = ''
}

function removeAttachment(id) {
  requestDeleteConfirm(
    () => {
      attachments.value = attachments.value.filter((item) => item.id !== id)
    },
    tr('Are you sure you want to delete this record?'),
  )
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function handleSave() {
  saveMessage.value = ''
  saveError.value = ''

  const payload = buildCalendarSavePayload(appliedSemesterKey.value, appliedSemesterRecord.value, {
    calendarRemarks: calendarRemarks.value,
    attachments: attachments.value,
    events: events.value,
  })

  const errors = validateCalendarSave(payload)
  if (errors.length) {
    saveError.value = errors
      .map((item) => {
        if (typeof item === 'string') return tr(item)
        if (item.type === 'event') return `${tr('Activity')} ${item.index}: ${tr(item.message)}`
        if (item.type === 'attachment') {
          return `${tr('Attachment')} ${item.index}: ${tr(item.message)}`
        }
        return tr(item.message)
      })
      .join('\n')
    return
  }

  saveCalendarConfig(appliedSemesterKey.value, payload)
  saveMessage.value = t('pages.calendar.saveSuccess')
}

function handleExport() {
  saveMessage.value = ''
  saveError.value = ''

  if (!appliedSemesterKey.value) {
    saveError.value = tr('Academic Year & Semester is required')
    return
  }
  if (!appliedSemesterRecord.value || !calendarWeeks.value.length) {
    saveError.value = tr('Selected Academic Year & Semester is not configured')
    return
  }

  const ok = exportCalendarToExcel({
    semesterKey: appliedSemesterKey.value,
    semesterRecord: appliedSemesterRecord.value,
    calendarRemarks: calendarRemarks.value,
    attachments: attachments.value,
    events: events.value,
    weeks: calendarWeeks.value,
    weekdayLabels: weekdayLabels.value,
    tr,
    filename: `calendar-${appliedSemesterKey.value}.xlsx`,
  })

  if (ok) {
    saveMessage.value = t('pages.calendar.exportSuccess')
  } else {
    saveError.value = tr('Calendar export failed')
  }
}
</script>

<template>
  <div class="calendar-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ tr('Academic Year & Semester:') }}</label>
              <select
                v-model="searchSemesterKey"
                class="search-select"
                :class="{ 'is-empty': !searchSemesterKey }"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in semesterOptions" :key="opt.key" :value="opt.key">
                  {{ opt.key }}
                </option>
              </select>
            </div>
          </div>

          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {{ t('common.reset') }}
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
        <button type="button" class="btn btn-default" @click="handleExport">{{ t('common.export') }}</button>
        <p v-if="saveMessage" class="save-message success">{{ saveMessage }}</p>
        <p v-if="saveError" class="save-message error">{{ saveError }}</p>
      </div>

      <div class="calendar-section">
        <div class="calendar-wrap">
          <table class="calendar-table">
            <thead>
              <tr>
                <th class="col-month">{{ tr('Year/Month') }}</th>
                <th class="col-week">{{ tr('Teaching Week') }}</th>
                <th v-for="label in weekdayLabels" :key="label" class="col-day">{{ label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!calendarTableRows.length">
                <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr
                v-for="row in calendarTableRows"
                :key="row.week.id"
                :class="{ 'month-group-end': row.isLastInMonthGroup }"
              >
                <td
                  v-if="row.showMonthCell"
                  class="month-cell"
                  :rowspan="row.monthRowspan"
                >
                  <div class="month-cell-inner">
                    <span class="month-label">{{ row.monthKey }}</span>
                  </div>
                </td>
                <td class="week-cell">{{ row.week.teachingWeek }}</td>
                <td
                  v-for="(day, dayIndex) in row.week.days"
                  :key="`${row.week.id}-${dayIndex}`"
                  class="day-cell"
                  :class="{
                    'is-selected': day.inRange && selectedDateKey === day.dateKey,
                    'is-out-range': !day.inRange,
                  }"
                  @click="handleDayClick(day)"
                  @mouseenter="day.inRange && (hoveredDateKey = day.dateKey)"
                  @mouseleave="hoveredDateKey = ''"
                >
                  <span
                    v-if="day.inRange"
                    class="day-badge"
                    :class="{ 'has-event': getEventsForDate(day.dateKey).length }"
                    @click.stop="handleDayBadgeClick(day)"
                  >
                    {{ day.day }}
                  </span>
                  <span v-else class="day-out">{{ day.day }}</span>

                  <button
                    v-if="
                      day.inRange &&
                      selectedDateKey === day.dateKey &&
                      !getEventsForDate(day.dateKey).length
                    "
                    type="button"
                    class="add-event-btn"
                    :aria-label="t('pages.calendar.addEvent')"
                    @click.stop="openCreateEvent(day.dateKey)"
                  >
                    +
                  </button>

                  <div
                    v-if="
                      day.inRange &&
                      hoveredDateKey === day.dateKey &&
                      getEventsForDate(day.dateKey).length
                    "
                    class="event-tooltip"
                  >
                    <div
                      v-for="event in getEventsForDate(day.dateKey)"
                      :key="event.id"
                      class="tooltip-block"
                    >
                      <p>
                        <span class="tooltip-label">{{ tr('Holiday Name:') }}</span>
                        {{ tr(event.holidayName) }}
                      </p>
                      <p v-if="event.remarks">
                        <span class="tooltip-label">{{ tr('Remark:') }}</span>
                        {{ event.remarks }}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="remark-section">
        <label class="section-label">{{ tr('Calendar Remarks:') }}</label>
        <div class="textarea-wrap">
          <textarea
            v-model="calendarRemarks"
            class="remark-textarea"
            :class="{ error: remarksCount > MAX_CALENDAR_REMARKS }"
            rows="4"
            :maxlength="MAX_CALENDAR_REMARKS"
            :placeholder="t('common.pleaseInput')"
          />
          <span class="char-count">{{ remarksCount }}/{{ MAX_CALENDAR_REMARKS }}</span>
        </div>
      </div>

      <div class="upload-section">
        <label class="section-label">{{ tr('Upload Attachment:') }}</label>
        <div class="upload-content">
          <button type="button" class="btn btn-default upload-btn" @click="triggerUpload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {{ tr('Upload File') }}
          </button>
          <p class="upload-hint">{{ tr('Supports single (≤50 MB) or batch upload.') }}</p>
          <ul v-if="attachments.length" class="file-list">
            <li v-for="file in attachments" :key="file.id" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <button type="button" class="link-btn delete" @click="removeAttachment(file.id)">
                {{ t('common.remove') }}
              </button>
            </li>
          </ul>
        </div>
        <input ref="fileInputRef" type="file" multiple class="hidden-input" @change="handleFileChange" />
      </div>
    </div>

    <CalendarEventModal
      :visible="eventModalVisible"
      :mode="eventModalMode"
      :initial-data="editingEvent"
      :all-events="events"
      :semester-record="appliedSemesterRecord"
      :default-date="selectedDateKey"
      @close="closeEventModal"
      @save="handleEventSave"
    />

    <ConfirmDialog
      :visible="deleteConfirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="deleteConfirmMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
.calendar-page {
  min-height: calc(100vh - 56px);
  padding: 24px 28px;
  box-sizing: border-box;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 20px 24px 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn svg {
  width: 14px;
  height: 14px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 16px;
}

.save-message {
  margin: 0;
  font-size: 13px;
}

.save-message.success {
  color: #059669;
}

.save-message.error {
  color: #ef4444;
  white-space: pre-line;
}

.calendar-section {
  margin-bottom: 20px;
}

.calendar-wrap {
  overflow: auto;
  border: 1px solid #e8e8e8;
  border-radius: 0;
  background: #fff;
}

.calendar-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
  color: #333;
}

.calendar-table thead th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 700;
  color: #333;
  background: #f7f7f7;
  border-bottom: 1px solid #e8e8e8;
  white-space: nowrap;
}

.calendar-table th.col-week,
.calendar-table th.col-day {
  text-align: center;
}

.calendar-table tbody td {
  padding: 0;
  height: 52px;
  vertical-align: middle;
  border-bottom: none;
  border-left: none;
  border-right: none;
  background: #fff;
}

.calendar-table tbody tr.month-group-end td {
  border-bottom: 1px solid #e8e8e8;
}

.month-cell {
  position: relative;
  width: 108px;
  padding: 0;
  text-align: left;
  font-weight: 700;
  font-size: 14px;
  color: #333;
  vertical-align: middle;
  background: #fff;
  border-bottom: none !important;
}

.month-cell-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  box-sizing: border-box;
}

.month-label {
  line-height: 1.2;
}

.week-cell {
  width: 88px;
  text-align: center;
  font-size: 14px;
  color: #333;
  background: #fff;
}

.day-cell {
  position: relative;
  text-align: center;
  cursor: default;
  min-width: 64px;
}

.day-cell.is-selected {
  background: #e8f2ff;
}

.day-cell.is-out-range {
  background: #fff;
}

.day-out {
  display: inline-block;
  font-size: 14px;
  color: #333;
  line-height: 1;
}

.day-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 4px;
  font-size: 14px;
  color: #333;
  line-height: 1;
  cursor: pointer;
}

.day-badge.has-event {
  background: #e53935;
  color: #fff;
  font-weight: 500;
  border-radius: 2px;
}

.add-event-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #397ef0;
  color: #fff;
  font-size: 18px;
  line-height: 20px;
  padding: 0;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(57, 126, 240, 0.35);
}

.event-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  z-index: 10;
  min-width: 200px;
  max-width: 280px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #333;
  text-align: left;
  pointer-events: none;
}

.event-tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  border-width: 6px 6px 0;
  border-style: solid;
  border-color: #fff transparent transparent;
}

.tooltip-block p {
  margin: 0 0 6px;
  line-height: 1.5;
}

.tooltip-block p:last-child {
  margin-bottom: 0;
}

.tooltip-label {
  color: #666;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 32px 16px;
}

.remark-section,
.upload-section {
  margin-top: 20px;
}

.section-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.textarea-wrap {
  position: relative;
}

.remark-textarea {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px 28px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  resize: vertical;
}

.remark-textarea.error {
  border-color: #ef4444;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-btn {
  align-self: flex-start;
}

.upload-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.file-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}

.file-name {
  flex: 1;
  color: #111827;
}

.file-size {
  color: #6b7280;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  background: none;
  border: none;
  padding: 0;
}

.link-btn.delete {
  color: #ef4444;
}

.hidden-input {
  display: none;
}
</style>
