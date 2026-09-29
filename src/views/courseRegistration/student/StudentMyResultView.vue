<script setup>
/**
 * 我的选课：展示在线选课最终选上的课程；不含加退课/重修申请课程
 */
import { computed, onMounted, ref } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import TablePagination from '../../../components/common/TablePagination.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import {
  studentConfirmedCourses,
  studentRequiredCourses,
  formatSelectedAt,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { syncAllVolunteerHitsToHistory } from '../../../data/courseRegistration/studentRegistrationContext.js'
import { getBatchById } from '../../../data/courseRegistration/registrationBatches.js'
import { displayClassTimeVenueLines } from '../../../data/courseRegistration/sectionScheduleFields.js'
import { resolveSchoolElectiveCategory } from '../../../data/courseRegistration/selectableCourses.js'
import { hydrateSelectedCourseDisplay } from '../../../data/courseRegistration/resolveSelectedCourseDisplay.js'
import { getSchoolElectiveCategoryLabel } from '../../../data/departments.js'
import StudentSchedulePreviewPanel from '../../../components/courseRegistration/StudentSchedulePreviewPanel.vue'
import ApplicationDetailDrawer from '../../../components/common/ApplicationDetailDrawer.vue'
import { buildPreviewSchedule } from '../../../data/courseRegistration/studentSchedulePreview.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const emit = defineEmits(['navigate'])
void emit

const { t, isZh } = useAppI18n()

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
const currentPage = ref(1)
const pageSize = ref(20)
const scheduleDrawerVisible = ref(false)

/**
 * 本页只展示：在线轮次确认 + 管理员代选 + 已公示 R1 成功；排除加退课/重修/培养方案必修底图
 * @param {object} item
 * @returns {boolean}
 */
function isOnlineConfirmedCourse(item) {
  if (!item) return false
  if (item.isRetake) return false
  const source = String(item.sourceType || '')
    .trim()
    .toLowerCase()
  const roundKey = String(item.roundKey || '')
    .trim()
    .toLowerCase()
  if (source === 'adddrop' || source === 'add_drop' || roundKey === 'adddrop') return false
  if (source === 'required') return false
  if (source === 'admin') return true
  if (!source || source === 'round' || source === 'preselect') return true
  return false
}

onMounted(() => {
  syncAllVolunteerHitsToHistory()
})

const onlineConfirmedCourses = computed(() =>
  studentConfirmedCourses.value.filter((item) => isOnlineConfirmedCourse(item)),
)

/**
 * 课表 = 必修底图 ∪ 主表确认集（选修部分与主表同源；不含全量 schedule fallback）
 */
const finalScheduleSlots = computed(() =>
  buildPreviewSchedule({
    required: studentRequiredCourses.value,
    confirmed: onlineConfirmedCourses.value,
  }),
)

const scheduleSlotCount = computed(() => finalScheduleSlots.value.length)
const scheduleToolbarLabel = computed(() => t('courseRegistration.student.scheduleToolbarButton'))

function openScheduleDrawer() {
  scheduleDrawerVisible.value = true
}

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

const allCourseRows = computed(() =>
  onlineConfirmedCourses.value.map((raw) => {
    const item = hydrateSelectedCourseDisplay(raw, { locale: isZh.value ? 'zh' : 'en' })
    const academicSession = academicSessionOf(item)
    const timeVenueLines = timeVenueLinesOf(item)
    return {
      courseId: item.courseId,
      code: item.courseCode,
      name: item.courseName || '—',
      schoolElectiveCategory: resolveSchoolElectiveCategory({
        type: item.type,
        code: item.courseCode,
        id: item.courseId || item.courseCode,
        schoolElectiveCategory: item.schoolElectiveCategory,
      }),
      academicSession: academicSession || '—',
      section: item.sectionCode || '—',
      lecturer: item.lecturer || '—',
      weekRange: item.weekRange || '—',
      timeVenueLines,
      timeVenueText: timeVenueLines.join('\n') || '—',
      credits: item.credits,
      selectedAt: formatSelectedAt(item.selectedAt),
      batchName: batchNameOf(item),
    }
  }),
)

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
    <div class="page-card">
      <p class="cr-my-result-hint">{{ t('courseRegistration.student.myResultHint') }}</p>

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
                <th>{{ t('courseRegistration.courses.schoolElectiveCategory') }}</th>
                <th>{{ t('courseRegistration.batch.academicSession') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th>{{ t('courseRegistration.student.selectedAt') }}</th>
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
                <td>{{ getSchoolElectiveCategoryLabel(row.schoolElectiveCategory, isZh) }}</td>
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
              </tr>
              <tr v-if="!courseRows.length">
                <td colspan="12" class="empty-cell">
                  {{
                    allCourseRows.length
                      ? t('courseRegistration.student.resultSearchEmpty')
                      : t('courseRegistration.student.myResultEmpty')
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
.cr-my-result-hint {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
}

.history-table-wrap {
  overflow: auto;
}

.cr-compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.cr-compact-table th,
.cr-compact-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
  vertical-align: middle;
}

.cr-compact-table td.cr-time-venue {
  white-space: normal;
}

.cr-compact-table .col-sticky-left {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 1;
}

.cr-compact-table thead .col-sticky-left {
  background: #f9fafb;
  z-index: 2;
}

.cr-compact-table tbody tr:hover .col-sticky-left {
  background: #f8fafc;
}

.cr-compact-table .col-no {
  left: 0;
  min-width: 48px;
}

.cr-compact-table .col-batch-name {
  left: 48px;
  min-width: 160px;
  max-width: 220px;
}

.cr-compact-table .col-code {
  left: 208px;
  min-width: 96px;
}

.cr-compact-table .col-name {
  left: 304px;
  min-width: 140px;
}

.cr-compact-table .col-batch-name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.cr-compact-table .col-selected-at {
  font-variant-numeric: tabular-nums;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 28px !important;
  white-space: normal !important;
}

.toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}
</style>
