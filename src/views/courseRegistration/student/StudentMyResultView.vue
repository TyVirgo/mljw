<script setup>
import { computed, ref, watch } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import TablePagination from '../../../components/common/TablePagination.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { buildStudentRegistrationResults } from '../../../data/courseRegistration/registrationResult.js'
import { registrationMonitorQueue } from '../../../data/courseRegistration/registrationMonitorQueue.js'
import {
  getStudentProfileFields,
  studentConfirmedCourses,
  studentRequiredCourses,
  studentSchedule,
  formatSelectedAt,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { getBatchById } from '../../../data/courseRegistration/registrationBatches.js'
import {
  buildVolunteerResultRows,
  getResultReleaseAt,
  getVolunteerSheet,
  isVolunteerResultReleased,
  listVolunteerResultBatches,
  seedVolunteerResultSheetsDemo,
} from '../../../data/courseRegistration/studentVolunteerSheet.js'
import {
  displayClassTimeVenueLines,
} from '../../../data/courseRegistration/sectionScheduleFields.js'
import StudentSchedulePreviewPanel from '../../../components/courseRegistration/StudentSchedulePreviewPanel.vue'
import ApplicationDetailDrawer from '../../../components/common/ApplicationDetailDrawer.vue'
import { buildPreviewSchedule } from '../../../data/courseRegistration/studentSchedulePreview.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'
import '../../../styles/movement-status-badge.css'

const emit = defineEmits(['navigate'])

const { t, isZh } = useAppI18n()
/** @type {import('vue').Ref<'termSummary' | 'history'>} */
const activeTab = ref('termSummary')

function emptySearch() {
  return {
    name: '',
    academicSession: '',
    credits: '',
    section: '',
    lecturer: '',
    weekRange: '',
    classTimeVenue: '',
    selectedAt: '',
  }
}

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
/** 第一轮志愿结果独立筛选项，避免与历史 Tab 互相覆盖 */
const volunteerSearchForm = ref(emptySearch())
const volunteerApplied = ref(emptySearch())
const currentPage = ref(1)
const pageSize = ref(20)

const studentFields = computed(() => getStudentProfileFields())
const scheduleDrawerVisible = ref(false)

const finalScheduleSlots = computed(() => {
  const fromConfirmed = buildPreviewSchedule({
    required: studentRequiredCourses.value,
    confirmed: studentConfirmedCourses.value,
  })
  return fromConfirmed.length ? fromConfirmed : studentSchedule.value
})

const scheduleSlotCount = computed(() => finalScheduleSlots.value.length)

const scheduleToolbarLabel = computed(() => t('courseRegistration.student.scheduleToolbarButton'))

function openScheduleDrawer() {
  scheduleDrawerVisible.value = true
}

const resultRow = computed(() => {
  const all = buildStudentRegistrationResults(registrationMonitorQueue.value)
  const fromMonitor = all.find((row) => row.studentId === studentFields.value.studentId)
  if (fromMonitor) return fromMonitor
  if (studentConfirmedCourses.value.length) {
    const credits = studentConfirmedCourses.value.reduce((sum, item) => sum + item.credits, 0)
    return {
      studentId: studentFields.value.studentId,
      studentName: studentFields.value.studentName,
      programme: studentFields.value.programme,
      intake: studentFields.value.intake,
      credits,
      courseCount: studentConfirmedCourses.value.length,
      courses: studentConfirmedCourses.value.map((item) => item.courseCode).join(', '),
      status: 'confirmed',
    }
  }
  return null
})

function batchNameOf(item) {
  if (item.batchName) return item.batchName
  if (!item.batchId) return '—'
  return getBatchById(item.batchId)?.name || '—'
}

function academicSessionOf(item) {
  const direct = String(item?.academicSession || '').trim()
  if (direct) return direct
  if (!item?.batchId) return ''
  return String(getBatchById(item.batchId)?.academicSession || '').trim()
}

function retakeLabel(item) {
  return item.isRetake ? t('common.yes') : t('common.no')
}

/** 与在线选课一致的「上课时间地点」多行 */
function timeVenueLinesOf(item) {
  const locale = isZh.value ? 'zh' : 'en'
  const lines = displayClassTimeVenueLines(
    {
      time: item.time,
      room: item.room || item.venue,
      weekRange: item.weekRange,
      meetings: item.meetings,
    },
    locale,
  )
  return lines.length ? lines : []
}

function summaryStatusLabel(status) {
  const map = {
    inCart: 'courseRegistration.student.termSummary.statusInCart',
    waitlist: 'courseRegistration.student.termSummary.statusWaitlist',
    pendingAssign: 'courseRegistration.student.termSummary.statusPendingAssign',
    success: 'courseRegistration.student.termSummary.statusHit',
    submitted: 'courseRegistration.student.termSummary.statusSubmitted',
    waiting: 'courseRegistration.student.termSummary.statusWaiting',
    hit: 'courseRegistration.student.termSummary.statusHit',
    miss: 'courseRegistration.student.termSummary.statusMiss',
  }
  return t(map[status] || map.waiting)
}

/** 成功绿 / 失败红 / 等待灰 */
function summaryStatusBadgeClass(status) {
  if (status === 'hit' || status === 'success') return 'status-approved'
  if (status === 'miss') return 'status-rejected'
  return 'status-pending'
}

function preferenceOrderLabel(order) {
  const n = Number(order)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return t('courseRegistration.student.volunteerSheet.slotLabel', { n })
}

const volunteerBatchOptions = computed(() => listVolunteerResultBatches())
const selectedVolunteerBatchId = ref('')

watch(
  volunteerBatchOptions,
  (opts) => {
    let list = opts
    if (!list.length) {
      seedVolunteerResultSheetsDemo()
      list = listVolunteerResultBatches()
    }
    if (!list.length) {
      selectedVolunteerBatchId.value = ''
      return
    }
    if (!list.some((b) => b.id === selectedVolunteerBatchId.value)) {
      selectedVolunteerBatchId.value = list[0].id
    }
  },
  { immediate: true },
)

const selectedVolunteerBatch = computed(() => getBatchById(selectedVolunteerBatchId.value))

const volunteerNotReleasedTip = computed(() => {
  const batch = selectedVolunteerBatch.value
  if (!batch) return ''
  const sheet = getVolunteerSheet(batch.id)
  if (!sheet?.snapshot?.slots?.length) return ''
  if (isVolunteerResultReleased(batch)) return ''
  const at = getResultReleaseAt(batch)
  return at
    ? t('courseRegistration.student.termSummary.resultNotReleasedAt', { at })
    : t('courseRegistration.student.termSummary.resultNotReleased')
})

const allVolunteerRows = computed(() =>
  buildVolunteerResultRows(selectedVolunteerBatch.value || undefined).map((row) => {
    const academicSession = academicSessionOf(row) || '—'
    const timeVenueLines = timeVenueLinesOf(row)
    const selectedRaw = row.selectedAt
    const selectedAt =
      selectedRaw && selectedRaw !== '—'
        ? formatSelectedAt(selectedRaw) || String(selectedRaw)
        : '—'
    return {
      ...row,
      academicSession,
      timeVenueLines,
      timeVenueText: timeVenueLines.length
        ? timeVenueLines.join('\n')
        : row.time && row.time !== '—'
          ? [row.time, row.room && row.room !== '—' ? row.room : null].filter(Boolean).join(' · ')
          : '—',
      selectedAt,
    }
  }),
)

function uniqueVolunteerOptions(getter) {
  const set = new Set()
  for (const row of allVolunteerRows.value) {
    const value = getter(row)
    if (value == null || value === '' || value === '—') continue
    set.add(String(value))
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

const volunteerCreditOptions = computed(() => uniqueVolunteerOptions((row) => row.credits))
const volunteerAcademicSessionOptions = computed(() =>
  uniqueVolunteerOptions((row) => row.academicSession),
)
const volunteerSectionOptions = computed(() => uniqueVolunteerOptions((row) => row.section))
const volunteerLecturerOptions = computed(() => uniqueVolunteerOptions((row) => row.lecturer))
const volunteerWeekRangeOptions = computed(() => uniqueVolunteerOptions((row) => row.weekRange))
const volunteerClassTimeVenueOptions = computed(() =>
  uniqueVolunteerOptions((row) => row.timeVenueText),
)
const volunteerSelectedAtOptions = computed(() => uniqueVolunteerOptions((row) => row.selectedAt))

const filteredVolunteerRows = computed(() => {
  const f = volunteerApplied.value
  const keyword = String(f.name || '').trim().toLowerCase()
  return allVolunteerRows.value.filter((row) => {
    if (keyword) {
      const name = String(row.name || '').toLowerCase()
      const code = String(row.code || '').toLowerCase()
      if (!name.includes(keyword) && !code.includes(keyword)) return false
    }
    if (f.academicSession && String(row.academicSession) !== String(f.academicSession)) return false
    if (f.credits !== '' && String(row.credits) !== String(f.credits)) return false
    if (f.section && String(row.section) !== String(f.section)) return false
    if (f.lecturer && String(row.lecturer) !== String(f.lecturer)) return false
    if (f.weekRange && String(row.weekRange) !== String(f.weekRange)) return false
    if (f.classTimeVenue && String(row.timeVenueText) !== String(f.classTimeVenue)) return false
    if (f.selectedAt && String(row.selectedAt) !== String(f.selectedAt)) return false
    return true
  })
})

function handleVolunteerSearch() {
  volunteerApplied.value = { ...volunteerSearchForm.value }
}

function handleVolunteerReset() {
  volunteerSearchForm.value = emptySearch()
  volunteerApplied.value = emptySearch()
}

const allCourseRows = computed(() => {
  if (studentConfirmedCourses.value.length) {
    return studentConfirmedCourses.value.map((item) => {
      const isAdmin = item.sourceType === 'admin' || Boolean(item.operatorName)
      const academicSession = academicSessionOf(item)
      const timeVenueLines = timeVenueLinesOf(item)
      return {
        courseId: item.courseId,
        code: item.courseCode,
        name: item.courseName,
        academicSession: academicSession || '—',
        section: item.sectionCode || '—',
        lecturer: item.lecturer || '—',
        weekRange: item.weekRange || '—',
        timeVenueLines,
        timeVenueText: timeVenueLines.join('\n') || '—',
        credits: item.credits,
        selectedAt: formatSelectedAt(item.selectedAt),
        batchName: batchNameOf(item),
        isRetakeLabel: retakeLabel(item),
        sourceLabel: courseSourceLabel(item),
        isAdmin,
        operatorName: isAdmin
          ? item.operatorName || '—'
          : studentFields.value.studentName || '—',
      }
    })
  }
  if (!resultRow.value?.courses) return []
  return resultRow.value.courses.split(',').map((code) => ({
    courseId: '',
    code: code.trim(),
    name: code.trim(),
    academicSession: '—',
    section: '—',
    lecturer: '—',
    weekRange: '—',
    timeVenueLines: [],
    timeVenueText: '—',
    credits: '—',
    selectedAt: '—',
    batchName: '—',
    isRetakeLabel: '—',
    sourceLabel: '—',
    isAdmin: false,
    operatorName: studentFields.value.studentName || '—',
  }))
})

function courseSourceLabel(item) {
  if (item.sourceType === 'admin' || item.operatorName) {
    return t('courseRegistration.student.courseSourceAdmin')
  }
  const roundKey = item.roundKey || 'main'
  const map = {
    preselect: 'courseRegistration.batch.roundPreselect',
    main: 'courseRegistration.batch.roundMain',
    supplement: 'courseRegistration.batch.roundSupplement',
  }
  return t(map[roundKey] || map.main)
}

function uniqueOptions(getter) {
  const set = new Set()
  for (const row of allCourseRows.value) {
    const value = getter(row)
    if (value == null || value === '' || value === '—') continue
    set.add(String(value))
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

const creditOptions = computed(() => uniqueOptions((row) => row.credits))
const academicSessionOptions = computed(() => uniqueOptions((row) => row.academicSession))
const sectionOptions = computed(() => uniqueOptions((row) => row.section))
const lecturerOptions = computed(() => uniqueOptions((row) => row.lecturer))
const weekRangeOptions = computed(() => uniqueOptions((row) => row.weekRange))
const classTimeVenueOptions = computed(() => uniqueOptions((row) => row.timeVenueText))
const selectedAtOptions = computed(() => uniqueOptions((row) => row.selectedAt))

const filteredCourseRows = computed(() => {
  const f = appliedSearch.value
  const keyword = String(f.name || '').trim().toLowerCase()
  return allCourseRows.value.filter((row) => {
    if (keyword) {
      const name = String(row.name || '').toLowerCase()
      const code = String(row.code || '').toLowerCase()
      if (!name.includes(keyword) && !code.includes(keyword)) return false
    }
    if (f.academicSession && String(row.academicSession) !== String(f.academicSession)) return false
    if (f.credits !== '' && String(row.credits) !== String(f.credits)) return false
    if (f.section && String(row.section) !== String(f.section)) return false
    if (f.lecturer && String(row.lecturer) !== String(f.lecturer)) return false
    if (f.weekRange && String(row.weekRange) !== String(f.weekRange)) return false
    if (f.classTimeVenue && String(row.timeVenueText) !== String(f.classTimeVenue)) return false
    if (f.selectedAt && String(row.selectedAt) !== String(f.selectedAt)) return false
    return true
  })
})

const totalCount = computed(() => filteredCourseRows.value.length)
const courseRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCourseRows.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function formatSectionName(code) {
  if (code == null || code === '' || code === '—') return code || '—'
  return t('courseRegistration.courses.sectionNameDisplay', { code })
}
</script>

<template>
  <StudentPageShell>
    <div class="cr-result-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class="cr-result-tab"
        :class="{ 'is-active': activeTab === 'termSummary' }"
        :aria-selected="activeTab === 'termSummary'"
        @click="activeTab = 'termSummary'"
      >
        {{ t('courseRegistration.student.termSummary.tabSummary') }}
      </button>
      <button
        type="button"
        role="tab"
        class="cr-result-tab"
        :class="{ 'is-active': activeTab === 'history' }"
        :aria-selected="activeTab === 'history'"
        @click="activeTab = 'history'"
      >
        {{ t('courseRegistration.student.termSummary.tabHistory') }}
      </button>
    </div>

    <!-- 第一轮志愿结果 -->
    <div v-if="activeTab === 'termSummary'" class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.name') }}</label>
              <input
                v-model="volunteerSearchForm.name"
                type="text"
                class="search-input"
                :placeholder="t('courseRegistration.student.resultSearchPlaceholder')"
                @keyup.enter="handleVolunteerSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.batch.academicSession') }}</label>
              <select v-model="volunteerSearchForm.academicSession" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option
                  v-for="opt in volunteerAcademicSessionOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.credits') }}</label>
              <select v-model="volunteerSearchForm.credits" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in volunteerCreditOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.sectionCode') }}</label>
              <select v-model="volunteerSearchForm.section" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in volunteerSectionOptions" :key="opt" :value="opt">
                  {{ formatSectionName(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.lecturer') }}</label>
              <select v-model="volunteerSearchForm.lecturer" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in volunteerLecturerOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.weekRange') }}</label>
              <select v-model="volunteerSearchForm.weekRange" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in volunteerWeekRangeOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.classTimeVenue') }}</label>
              <select v-model="volunteerSearchForm.classTimeVenue" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option
                  v-for="opt in volunteerClassTimeVenueOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.student.selectedAt') }}</label>
              <select v-model="volunteerSearchForm.selectedAt" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in volunteerSelectedAtOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleVolunteerSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleVolunteerReset">
              {{ t('common.reset') }}
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar cr-volunteer-result-toolbar">
        <div class="cr-volunteer-batch-field">
          <label for="volunteer-batch-select">{{ t('courseRegistration.batch.name') }}</label>
          <select
            id="volunteer-batch-select"
            v-model="selectedVolunteerBatchId"
            class="cr-type-entry-batch-select cr-list-context-select cr-volunteer-batch-select"
          >
            <option v-if="!volunteerBatchOptions.length" value="">
              {{ t('courseRegistration.student.termSummary.noBatch') }}
            </option>
            <option v-for="batch in volunteerBatchOptions" :key="batch.id" :value="batch.id">
              {{ batch.name }}
            </option>
          </select>
        </div>
        <button
          type="button"
          class="btn btn-default cr-schedule-trigger"
          :class="{ 'has-slots': scheduleSlotCount > 0 }"
          @click="openScheduleDrawer"
        >
          {{ scheduleToolbarLabel }}
        </button>
      </div>

      <p v-if="volunteerNotReleasedTip" class="cr-volunteer-not-released-tip">
        {{ volunteerNotReleasedTip }}
      </p>

      <div class="table-section">
        <div class="table-wrap history-table-wrap">
          <table class="data-table cr-compact-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th>{{ t('courseRegistration.student.termSummary.preferenceOrder') }}</th>
                <th>{{ t('common.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in filteredVolunteerRows" :key="row.courseId || index">
                <td>{{ index + 1 }}</td>
                <td>{{ row.code }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.credits }}</td>
                <td>{{ row.weekRange }}</td>
                <td>{{ row.lecturer }}</td>
                <td class="cr-time-venue">
                  <template v-if="row.timeVenueLines.length">
                    <div
                      v-for="(line, li) in row.timeVenueLines"
                      :key="li"
                      class="cr-time-venue-line"
                    >
                      {{ line }}
                    </div>
                  </template>
                  <template v-else>{{ row.timeVenueText || '—' }}</template>
                </td>
                <td>{{ preferenceOrderLabel(row.preferenceOrder) }}</td>
                <td>
                  <span class="status-badge" :class="summaryStatusBadgeClass(row.status)">
                    {{ summaryStatusLabel(row.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!filteredVolunteerRows.length">
                <td colspan="9" class="empty-cell">
                  {{
                    allVolunteerRows.length
                      ? t('courseRegistration.student.resultSearchEmpty')
                      : t('courseRegistration.student.termSummary.empty')
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="cr-term-summary-hint">{{ t('courseRegistration.student.termSummary.hint') }}</p>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-else class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.name') }}</label>
              <input
                v-model="searchForm.name"
                type="text"
                class="search-input"
                :placeholder="t('courseRegistration.student.resultSearchPlaceholder')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.batch.academicSession') }}</label>
              <select v-model="searchForm.academicSession" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in academicSessionOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.credits') }}</label>
              <select v-model="searchForm.credits" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in creditOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.sectionCode') }}</label>
              <select v-model="searchForm.section" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in sectionOptions" :key="opt" :value="opt">
                  {{ formatSectionName(opt) }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.lecturer') }}</label>
              <select v-model="searchForm.lecturer" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in lecturerOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.weekRange') }}</label>
              <select v-model="searchForm.weekRange" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in weekRangeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.classTimeVenue') }}</label>
              <select v-model="searchForm.classTimeVenue" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in classTimeVenueOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.student.selectedAt') }}</label>
              <select v-model="searchForm.selectedAt" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in selectedAtOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              {{ t('common.reset') }}
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button
          type="button"
          class="btn btn-default cr-schedule-trigger"
          :class="{ 'has-slots': scheduleSlotCount > 0 }"
          @click="openScheduleDrawer"
        >
          {{ scheduleToolbarLabel }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap history-table-wrap">
          <table class="data-table history-data-table cr-compact-table">
            <thead>
              <tr>
                <th class="col-sticky-left col-no">{{ t('common.serialNo') }}</th>
                <th class="col-sticky-left col-batch-name">{{ t('courseRegistration.batch.name') }}</th>
                <th class="col-sticky-left col-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="col-sticky-left col-name">{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.batch.academicSession') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th>{{ t('courseRegistration.student.selectedAt') }}</th>
                <th>{{ t('courseRegistration.student.isRetake') }}</th>
                <th>{{ t('courseRegistration.student.courseSource') }}</th>
                <th>
                  <span class="cr-operator-th">
                    {{ t('courseRegistration.student.operator') }}
                    <span
                      class="hint-popover-wrap"
                      :title="t('courseRegistration.student.operatorHint')"
                    >
                      <span
                        class="hint-popover-trigger"
                        tabindex="0"
                        role="button"
                        :aria-label="t('courseRegistration.student.operatorHint')"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path
                            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                          />
                        </svg>
                      </span>
                      <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                        {{ t('courseRegistration.student.operatorHint') }}
                      </span>
                    </span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in courseRows" :key="row.courseId || `${row.code}-${index}`">
                <td class="col-sticky-left col-no">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td
                  class="col-sticky-left col-batch-name"
                  :title="row.batchName !== '—' ? row.batchName : undefined"
                >
                  <span class="col-batch-name-text">{{ row.batchName }}</span>
                </td>
                <td class="col-sticky-left col-code">{{ row.code }}</td>
                <td class="col-sticky-left col-name">{{ row.name }}</td>
                <td>{{ row.academicSession }}</td>
                <td>{{ row.credits }}</td>
                <td>{{ formatSectionName(row.section) }}</td>
                <td>{{ row.lecturer }}</td>
                <td>{{ row.weekRange }}</td>
                <td class="cr-time-venue">
                  <template v-if="row.timeVenueLines.length">
                    <div
                      v-for="(line, li) in row.timeVenueLines"
                      :key="li"
                      class="cr-time-venue-line"
                    >
                      {{ line }}
                    </div>
                  </template>
                  <template v-else>—</template>
                </td>
                <td class="col-selected-at">{{ row.selectedAt }}</td>
                <td>{{ row.isRetakeLabel }}</td>
                <td>{{ row.sourceLabel }}</td>
                <td>{{ row.operatorName }}</td>
              </tr>
              <tr v-if="!courseRows.length">
                <td colspan="14" class="empty-cell">
                  {{
                    allCourseRows.length
                      ? t('courseRegistration.student.resultSearchEmpty')
                      : t('courseRegistration.student.noResult')
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          v-model="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
        />
      </div>
    </div>

    <ApplicationDetailDrawer
      :visible="scheduleDrawerVisible"
      :title="t('courseRegistration.student.schedulePreviewTitle')"
      :subtitle="t('courseRegistration.student.schedulePreviewFinalHint')"
      @close="scheduleDrawerVisible = false"
    >
      <StudentSchedulePreviewPanel embedded :schedule="finalScheduleSlots" />
      <template #footer>
        <button type="button" class="btn btn-primary" @click="scheduleDrawerVisible = false">
          {{ t('common.close') }}
        </button>
      </template>
    </ApplicationDetailDrawer>
  </StudentPageShell>
</template>

<style scoped>
.cr-result-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.cr-result-tab {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  padding: 8px 16px;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 14px;
}

.cr-result-tab.is-active {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

.cr-term-summary-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.cr-volunteer-result-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.cr-volunteer-batch-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cr-volunteer-batch-field label {
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
}

/* 与在线选课列表顶栏批次下拉同视觉 */
.cr-volunteer-batch-select.cr-type-entry-batch-select {
  width: 460px;
  max-width: min(460px, 100%);
  flex: 0 0 auto;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #374151;
}

.cr-volunteer-not-released-tip {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 13px;
  line-height: 1.45;
}

.cr-schedule-trigger.has-slots {
  border-color: #93c5fd;
  color: #1d4ed8;
}

.history-table-wrap {
  overflow-x: auto;
  width: 100%;
}

.cr-compact-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.cr-compact-table th,
.cr-compact-table td {
  padding: 6px 10px;
  white-space: nowrap;
  line-height: 1.35;
  vertical-align: middle;
}

.cr-compact-table .col-sticky-left {
  position: sticky;
  z-index: 2;
  background: #fff;
}

.cr-compact-table thead .col-sticky-left {
  z-index: 4;
  background: #f9fafb;
}

.cr-compact-table tbody tr:hover .col-sticky-left {
  background: #fafafa;
}

.cr-compact-table .col-no {
  left: 0;
  min-width: 48px;
}

.cr-compact-table .col-batch-name {
  left: 48px;
  min-width: 200px;
  max-width: 280px;
}

.cr-compact-table .col-code {
  left: 248px;
  min-width: 96px;
}

.cr-compact-table .col-name {
  left: 344px;
  min-width: 140px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.1);
}

.cr-compact-table .col-batch-name-text {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.cr-compact-table .col-selected-at {
  white-space: nowrap;
}

.cr-time-venue {
  min-width: 200px;
  max-width: 320px;
  font-size: 12px;
  line-height: 1.3;
  white-space: normal;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 0;
}
</style>
