<script setup>
/**
 * 我的课程：一级全量进页；二级筛只过滤表格；课表始终全量；搜索可收放
 */
import { computed, onMounted, ref, watch } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import TablePagination from '../../../components/common/TablePagination.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { formatSelectedAt } from '../../../data/courseRegistration/studentRegistrationStore.js'
import { syncAllVolunteerHitsToHistory } from '../../../data/courseRegistration/studentRegistrationContext.js'
import { getBatchById } from '../../../data/courseRegistration/registrationBatches.js'
import { displayClassTimeVenueLines } from '../../../data/courseRegistration/sectionScheduleFields.js'
import { resolveSchoolElectiveCategory } from '../../../data/courseRegistration/selectableCourses.js'
import { hydrateSelectedCourseDisplay } from '../../../data/courseRegistration/resolveSelectedCourseDisplay.js'
import { formatUnifiedCourseCategoryLabel } from '../../../data/courseRegistration/unifiedCourseCategory.js'
import StudentSchedulePreviewPanel from '../../../components/courseRegistration/StudentSchedulePreviewPanel.vue'
import ApplicationDetailDrawer from '../../../components/common/ApplicationDetailDrawer.vue'
import {
  MY_RESULT_TYPE_TABS,
  listMyResultCoursesByType,
  listUntimedMyResultCourses,
  buildMyResultSchedule,
} from '../../../data/courseRegistration/studentMyResultCourses.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const emit = defineEmits(['navigate'])
void emit

const { t, isZh } = useAppI18n()

function emptySearch() {
  return {
    name: '',
    code: '',
    academicSession: '',
    credits: '',
    section: '',
    lecturer: '',
    weekFrom: '',
    weekTo: '',
    weekday: '',
    selectedAtStart: '',
    selectedAtEnd: '',
  }
}

const WEEKDAY_FILTER_OPTIONS = [
  { value: 'Mon', labelKey: 'courseRegistration.student.weekdayMon' },
  { value: 'Tue', labelKey: 'courseRegistration.student.weekdayTue' },
  { value: 'Wed', labelKey: 'courseRegistration.student.weekdayWed' },
  { value: 'Thu', labelKey: 'courseRegistration.student.weekdayThu' },
  { value: 'Fri', labelKey: 'courseRegistration.student.weekdayFri' },
  { value: 'Sat', labelKey: 'courseRegistration.student.weekdaySat' },
  { value: 'Sun', labelKey: 'courseRegistration.student.weekdaySun' },
]

/** 二级分类筛：默认全部（一级页即全量） */
const activeTypeTab = ref('all')
const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const searchExpanded = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)
const scheduleDrawerVisible = ref(false)

const typeTabs = computed(() =>
  MY_RESULT_TYPE_TABS.map((key) => ({
    key,
    label:
      key === 'all'
        ? t('common.all')
        : t(`courseRegistration.student.myResultType.${key}`),
  })),
)

onMounted(() => {
  syncAllVolunteerHitsToHistory()
})

watch(activeTypeTab, () => {
  currentPage.value = 1
})

/** 表格：随二级分类筛 */
const scopedRawCourses = computed(() => listMyResultCoursesByType(activeTypeTab.value))

/** 课表：始终全部课程（必修/选修两色；与二级筛无关） */
const allRawCoursesForSchedule = computed(() => listMyResultCoursesByType('all'))

const finalScheduleSlots = computed(() =>
  buildMyResultSchedule(allRawCoursesForSchedule.value, {
    locale: isZh.value ? 'zh' : 'en',
  }),
)

const scheduleSlotCount = computed(() => finalScheduleSlots.value.length)
const scheduleToolbarLabel = computed(() => t('courseRegistration.student.scheduleToolbarButton'))
const schedulePreviewSubtitle = computed(() =>
  t('courseRegistration.student.schedulePreviewFinalHintAll'),
)

/** 无排课时段已选课（如 INT300 实习）→ 课表 footer 提示 */
const untimedMyResultCourses = computed(() => listUntimedMyResultCourses())

const untimedScheduleTipText = computed(() => {
  const rows = untimedMyResultCourses.value
  if (!rows.length) return ''
  const labels = rows
    .map((row) => {
      const code = String(row.courseCode || row.code || '').trim()
      const name = isZh.value
        ? row.courseName || row.courseNameEn || ''
        : row.courseNameEn || row.courseName || ''
      if (code && name) return `${code} ${name}`
      return code || name
    })
    .filter(Boolean)
  if (!labels.length) return ''
  return t('courseRegistration.student.scheduleUntimedCoursesTip', {
    courses: labels.join(isZh.value ? '、' : ', '),
  })
})

function openScheduleDrawer() {
  scheduleDrawerVisible.value = true
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
  scopedRawCourses.value.map((raw) => {
    // 时段以结果项为准，与课表同源；禁止课库合成 meetings 覆盖 list
    const item = hydrateSelectedCourseDisplay(raw, {
      locale: isZh.value ? 'zh' : 'en',
      preserveSchedule: true,
    })
    const academicSession = academicSessionOf(item)
    const timeVenueLines = timeVenueLinesOf(item)
    return {
      courseId: item.courseId,
      code: item.courseCode,
      name: item.courseName || '—',
      type: item.type,
      resultType: raw.resultType || 'elective',
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
      selectedAtRaw: item.selectedAt || '',
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

/** @param {string} raw */
function parseWeekSpan(raw) {
  const text = String(raw || '').trim()
  if (!text || text === '—') return null
  const range = text.match(/(\d+)\s*[-–~到至]\s*(\d+)/)
  if (range) {
    const from = Number(range[1])
    const to = Number(range[2])
    if (!Number.isFinite(from) || !Number.isFinite(to)) return null
    return { from: Math.min(from, to), to: Math.max(from, to) }
  }
  const single = text.match(/(\d+)/)
  if (!single) return null
  const n = Number(single[1])
  if (!Number.isFinite(n)) return null
  return { from: n, to: n }
}

/**
 * @param {{ from: number, to: number }|null} span
 * @param {string|number} fromRaw
 * @param {string|number} toRaw
 */
function weekSpanOverlaps(span, fromRaw, toRaw) {
  const fromStr = String(fromRaw ?? '').trim()
  const toStr = String(toRaw ?? '').trim()
  if (!fromStr && !toStr) return true
  if (!span) return false
  const qFrom = fromStr ? Number(fromStr) : 1
  const qTo = toStr ? Number(toStr) : 99
  if (!Number.isFinite(qFrom) || !Number.isFinite(qTo)) return true
  const a = Math.min(qFrom, qTo)
  const b = Math.max(qFrom, qTo)
  return span.from <= b && span.to >= a
}

/** @param {string} value */
function parseSelectedAtDay(value) {
  const raw = String(value || '').trim()
  if (!raw || raw === '—') return null
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/**
 * @param {string} displayAt
 * @param {string} rawAt
 * @param {string} startYmd
 * @param {string} endYmd
 */
function selectedAtInRange(displayAt, rawAt, startYmd, endYmd) {
  if (!startYmd && !endYmd) return true
  const day = parseSelectedAtDay(displayAt) || parseSelectedAtDay(rawAt)
  if (!day) return false
  if (startYmd) {
    const start = parseSelectedAtDay(startYmd)
    if (start && dayKey(day) < dayKey(start)) return false
  }
  if (endYmd) {
    const end = parseSelectedAtDay(endYmd)
    if (end && dayKey(day) > dayKey(end)) return false
  }
  return true
}

const WEEKDAY_MATCHERS = {
  Mon: ['mon', 'monday', '星期一', '周一'],
  Tue: ['tue', 'tuesday', '星期二', '周二'],
  Wed: ['wed', 'wednesday', '星期三', '周三'],
  Thu: ['thu', 'thursday', '星期四', '周四'],
  Fri: ['fri', 'friday', '星期五', '周五'],
  Sat: ['sat', 'saturday', '星期六', '周六'],
  Sun: ['sun', 'sunday', '星期日', '周日'],
}

/** @param {string} text @param {string} weekday */
function textHasWeekday(text, weekday) {
  const hay = String(text || '').toLowerCase()
  if (!hay || !weekday) return false
  const needles = WEEKDAY_MATCHERS[weekday] || [String(weekday).toLowerCase()]
  return needles.some((n) => hay.includes(n))
}

const filteredCourseRows = computed(() => {
  const f = appliedSearch.value
  const nameKw = String(f.name || '').trim().toLowerCase()
  const codeKw = String(f.code || '').trim().toLowerCase()
  const lecturerKw = String(f.lecturer || '').trim().toLowerCase()
  return allCourseRows.value.filter((row) => {
    if (nameKw && !String(row.name || '').toLowerCase().includes(nameKw)) return false
    if (codeKw && !String(row.code || '').toLowerCase().includes(codeKw)) return false
    if (f.academicSession && String(row.academicSession) !== String(f.academicSession)) return false
    if (f.credits !== '' && String(row.credits) !== String(f.credits)) return false
    if (f.section && String(row.section) !== String(f.section)) return false
    if (lecturerKw && !String(row.lecturer || '').toLowerCase().includes(lecturerKw)) return false
    if (f.weekFrom || f.weekTo) {
      if (!weekSpanOverlaps(parseWeekSpan(row.weekRange), f.weekFrom, f.weekTo)) return false
    }
    if (f.weekday && !textHasWeekday(row.timeVenueText, f.weekday)) return false
    if (
      !selectedAtInRange(row.selectedAt, row.selectedAtRaw, f.selectedAtStart, f.selectedAtEnd)
    ) {
      return false
    }
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

function selectTypeTab(key) {
  activeTypeTab.value = key
}
</script>

<template>
  <StudentPageShell>
    <div class="page-card">
      <p class="cr-my-result-hint">{{ t('courseRegistration.student.myResultHint') }}</p>

      <div
        class="adddrop-type-tabs cr-my-result-type-tabs"
        role="tablist"
        :aria-label="t('courseRegistration.student.myResultTypeFilterLabel')"
      >
        <button
          v-for="tab in typeTabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="adddrop-type-tab"
          :class="{ active: activeTypeTab === tab.key }"
          :aria-selected="activeTypeTab === tab.key"
          @click="selectTypeTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.name') }}</label>
              <input
                v-model="searchForm.name"
                type="text"
                class="search-input"
                :placeholder="t('courseRegistration.student.searchNamePlaceholder')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.code') }}</label>
              <input
                v-model="searchForm.code"
                type="text"
                class="search-input"
                :placeholder="t('courseRegistration.student.searchCodePlaceholder')"
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
            <template v-if="searchExpanded">
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.lecturer') }}</label>
                <input
                  v-model="searchForm.lecturer"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.courses.lecturer')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item search-item-range">
                <label>{{ t('courseRegistration.student.weekRangeFromTo') }}</label>
                <input
                  v-model="searchForm.weekFrom"
                  type="number"
                  min="1"
                  class="search-input"
                  placeholder="1"
                  @keyup.enter="handleSearch"
                />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input
                  v-model="searchForm.weekTo"
                  type="number"
                  min="1"
                  class="search-input"
                  placeholder="14"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.student.weekdayClassFilter') }}</label>
                <select v-model="searchForm.weekday" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option
                    v-for="opt in WEEKDAY_FILTER_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ t(opt.labelKey) }}
                  </option>
                </select>
              </div>
              <div class="search-item search-item-range">
                <label>{{ t('courseRegistration.student.selectedAtRange') }}</label>
                <input v-model="searchForm.selectedAtStart" type="date" class="search-input" />
                <span class="range-sep">{{ t('common.to') }}</span>
                <input v-model="searchForm.selectedAtEnd" type="date" class="search-input" />
              </div>
            </template>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">
              {{ t('common.search') }}
            </button>
            <button type="button" class="btn btn-default" @click="handleReset">
              {{ t('common.reset') }}
            </button>
            <button type="button" class="toggle-link" @click="searchExpanded = !searchExpanded">
              {{ searchExpanded ? t('common.collapse') : t('common.more') }}
              <svg
                :class="{ up: searchExpanded }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
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
                <th class="col-sticky-left col-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="col-sticky-left col-name">{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.category') }}</th>
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
                <td class="col-sticky-left col-code">{{ row.code }}</td>
                <td class="col-sticky-left col-name">{{ row.name }}</td>
                <td>{{ formatUnifiedCourseCategoryLabel(row, t) }}</td>
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
                <td colspan="11" class="empty-cell">
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
      :subtitle="schedulePreviewSubtitle"
      @close="scheduleDrawerVisible = false"
    >
      <StudentSchedulePreviewPanel
        embedded
        show-legend
        legend-mode="myResult"
        :schedule="finalScheduleSlots"
      />
      <template #footer>
        <div class="schedule-drawer-footer">
          <p v-if="untimedScheduleTipText" class="schedule-untimed-tip" role="note">
            <span class="schedule-untimed-tip-badge">{{ t('courseRegistration.student.scheduleUntimedTipBadge') }}</span>
            <span class="schedule-untimed-tip-text">{{ untimedScheduleTipText }}</span>
          </p>
          <button type="button" class="btn btn-primary" @click="scheduleDrawerVisible = false">
            {{ t('common.close') }}
          </button>
        </div>
      </template>
    </ApplicationDetailDrawer>
  </StudentPageShell>
</template>

<style scoped>
.schedule-drawer-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.schedule-untimed-tip {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 8px 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  font-size: 12px;
  line-height: 1.5;
  color: #1e40af;
  text-align: left;
}

.schedule-untimed-tip-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.schedule-untimed-tip-text {
  flex: 1;
  min-width: 0;
}

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

.cr-my-result-type-tabs {
  margin-bottom: 12px;
}

.adddrop-type-tabs {
  display: flex;
  gap: 0;
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.adddrop-type-tab {
  padding: 12px 20px;
  font-size: 14px;
  color: #6b7280;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  cursor: pointer;
}

.adddrop-type-tab:hover {
  color: #2563eb;
}

.adddrop-type-tab.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
}

.toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.history-table-wrap {
  overflow-x: auto;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.empty-cell {
  text-align: center;
  color: #6b7280;
  padding: 24px 12px;
}
</style>
