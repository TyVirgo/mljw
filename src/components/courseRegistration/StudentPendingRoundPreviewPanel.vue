<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import CourseCodeSourcePopover from './CourseCodeSourcePopover.vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getSelectableCoursesForStudent, normalizeCartRoundKey } from '../../data/courseRegistration/studentRegistrationStore.js'
import {
  filterStudentCourseList,
  filterCoursesByRound,
} from '../../data/courseRegistration/studentRegistrationContext.js'
import { courseTypeOptions, getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import { displayWeekRange, displayClassTimeVenueLines } from '../../data/courseRegistration/sectionScheduleFields.js'
import { getSchoolElectiveCategoryLabel } from '../../data/departments.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'
import '../../styles/course-registration-student.css'

const props = defineProps({
  batchId: { type: String, required: true },
  roundKey: { type: String, required: true },
})

const { t, isZh } = useAppI18n()

function emptySearch() {
  return { keyword: '', type: '', availability: '', credits: '', prerequisites: '' }
}

const searchState = ref({ form: emptySearch(), applied: emptySearch() })
const currentPage = ref(1)
const pageSize = ref(20)
const creditsFilterOpen = ref(false)

const previewRoundKey = computed(() => normalizeCartRoundKey(props.roundKey))

const allCourses = computed(() => {
  void props.batchId
  void props.roundKey
  return getSelectableCoursesForStudent(previewRoundKey.value, { batchId: props.batchId })
})

const roundFilteredCourses = computed(() =>
  filterCoursesByRound(allCourses.value, previewRoundKey.value),
)

const courses = computed(() =>
  filterStudentCourseList(roundFilteredCourses.value, searchState.value.applied),
)

const isPreselectRound = computed(() => previewRoundKey.value === 'preselect')

const sectionRows = computed(() => {
  const rows = []
  for (const course of courses.value) {
    const sections = course.sections?.length ? course.sections : [null]
    for (const section of sections) {
      rows.push({ course, section })
    }
  }
  const availability = searchState.value.applied.availability
  if (availability === 'open') {
    return rows.filter((row) => row.section && Number(row.section.capacity) > 0)
  }
  if (availability === 'full') {
    return rows.filter((row) => !row.section || Number(row.section.capacity) <= 0)
  }
  return rows
})

const totalCourseCount = computed(() => sectionRows.value.length)
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sectionRows.value.slice(start, start + pageSize.value)
})

const emptyTableColspan = 12

const creditFilterOptions = computed(() => {
  const set = new Set(
    roundFilteredCourses.value.map((item) => Number(item.credits)).filter((n) => Number.isFinite(n)),
  )
  return [...set].sort((a, b) => a - b)
})

const prerequisiteFilterOptions = computed(() => {
  const set = new Set()
  for (const course of roundFilteredCourses.value) {
    for (const code of course.prerequisites || []) {
      if (code) set.add(String(code))
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
})

const creditsFilterActive = computed(() => Boolean(searchState.value.applied.credits))

const capacityColumnLabel = computed(() =>
  isPreselectRound.value
    ? t('courseRegistration.courses.volunteerVsCapacity')
    : t('courseRegistration.courses.enrolled'),
)

watch(
  [() => searchState.value.applied, () => props.batchId, () => props.roundKey, pageSize],
  () => {
    currentPage.value = 1
  },
)

function patchSearchForm(patch) {
  searchState.value = {
    ...searchState.value,
    form: { ...searchState.value.form, ...patch },
  }
}

function handleSearch() {
  searchState.value = {
    ...searchState.value,
    applied: { ...searchState.value.form },
  }
}

function handleReset() {
  searchState.value = { form: emptySearch(), applied: emptySearch() }
}

function toggleCreditsFilter(event) {
  event?.stopPropagation?.()
  creditsFilterOpen.value = !creditsFilterOpen.value
}

function closeCreditsFilter() {
  creditsFilterOpen.value = false
}

function onDocumentClick() {
  if (creditsFilterOpen.value) closeCreditsFilter()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

function applyCreditsFilter(value) {
  const nextForm = { ...searchState.value.form, credits: value }
  searchState.value = {
    form: nextForm,
    applied: { ...searchState.value.applied, credits: value },
  }
  closeCreditsFilter()
}

function isSectionFull(section) {
  if (!section) return true
  return false
}

function sectionCapacityLabel(_course, section) {
  if (!section) return '—'
  return `0/${section.capacity}`
}

function sectionCapacityClass(_course, section) {
  if (!section) return ''
  return 'capacity-open'
}

function sectionGroupName(section) {
  if (!section) return '—'
  return t('courseRegistration.courses.sectionNameDisplay', { code: section.code })
}
</script>

<template>
  <div class="cr-pending-preview">
    <CourseRegistrationCallout variant="info">
      <p>{{ t('courseRegistration.student.typeEntry.previewHint') }}</p>
    </CourseRegistrationCallout>

    <div class="search-bar">
      <div class="search-row">
        <div class="search-fields">
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.code') }}</label>
            <input
              :value="searchState.form.keyword"
              type="text"
              class="search-input"
              :placeholder="t('courseRegistration.student.searchPlaceholder')"
              @input="patchSearchForm({ keyword: $event.target.value })"
            />
          </div>
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.type') }}</label>
            <select
              :value="searchState.form.type"
              class="search-select"
              @change="patchSearchForm({ type: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="opt in courseTypeOptions" :key="opt.value" :value="opt.value">
                {{ t(opt.labelKey) }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.enrolled') }}</label>
            <select
              :value="searchState.form.availability"
              class="search-select"
              @change="patchSearchForm({ availability: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option value="open">{{ t('courseRegistration.waitlist.courseStatus.open') }}</option>
              <option value="full">{{ t('courseRegistration.waitlist.courseStatus.full') }}</option>
            </select>
          </div>
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.credits') }}</label>
            <select
              :value="searchState.form.credits"
              class="search-select"
              @change="patchSearchForm({ credits: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="credit in creditFilterOptions" :key="credit" :value="String(credit)">
                {{ credit }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>{{ t('courseRegistration.courses.prerequisites') }}</label>
            <select
              :value="searchState.form.prerequisites"
              class="search-select"
              @change="patchSearchForm({ prerequisites: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option value="none">{{ t('courseRegistration.student.prerequisiteNone') }}</option>
              <option v-for="code in prerequisiteFilterOptions" :key="code" :value="code">
                {{ code }}
              </option>
            </select>
          </div>
        </div>
        <div class="search-actions">
          <button type="button" class="btn btn-primary btn-primary--vivid" @click="handleSearch">
            {{ t('common.search') }}
          </button>
          <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="table-scroll">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th>{{ t('courseRegistration.courses.type') }}</th>
                <th class="th-with-tip">
                  <span class="th-label-with-tip">
                    {{ t('courseRegistration.courses.schoolElectiveCategory') }}
                    <span
                      class="hint-popover-wrap"
                      :title="t('courseRegistration.courses.schoolElectiveCategoryTip')"
                    >
                      <span
                        class="hint-popover-trigger"
                        tabindex="0"
                        role="button"
                        :aria-label="t('courseRegistration.courses.schoolElectiveCategoryTip')"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path
                            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm-1.25 3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5z"
                          />
                        </svg>
                      </span>
                      <span class="hint-popover-content hint-popover-content--sm" role="tooltip">
                        {{ t('courseRegistration.courses.schoolElectiveCategoryTip') }}
                      </span>
                    </span>
                  </span>
                </th>
                <th class="th-credits-filter">
                  <span>{{ t('courseRegistration.courses.credits') }}</span>
                  <span
                    class="hint-popover-wrap th-funnel-wrap"
                    :class="{ 'is-active': creditsFilterActive, 'is-open': creditsFilterOpen }"
                    @click.stop
                  >
                    <button
                      type="button"
                      class="th-funnel-btn"
                      :aria-expanded="creditsFilterOpen"
                      :aria-label="t('courseRegistration.student.creditsFilter')"
                      :title="t('courseRegistration.student.creditsFilter')"
                      @click="toggleCreditsFilter"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path
                          d="M1.5 2h13a.5.5 0 0 1 .4.8L10 8.2V13a.5.5 0 0 1-.8.4l-2-1.5A.5.5 0 0 1 7 11.5V8.2L1.1 2.8A.5.5 0 0 1 1.5 2z"
                        />
                      </svg>
                    </button>
                    <span class="hint-popover-content hint-popover-content--sm th-funnel-panel" role="menu">
                      <button
                        type="button"
                        class="th-funnel-option"
                        :class="{ active: !searchState.applied.credits }"
                        @click="applyCreditsFilter('')"
                      >
                        {{ t('common.all') }}
                      </button>
                      <button
                        v-for="credit in creditFilterOptions"
                        :key="credit"
                        type="button"
                        class="th-funnel-option"
                        :class="{ active: String(searchState.applied.credits) === String(credit) }"
                        @click="applyCreditsFilter(String(credit))"
                      >
                        {{ credit }}
                      </button>
                    </span>
                  </span>
                </th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th>{{ t('courseRegistration.courses.prerequisites') }}</th>
                <th class="th-capacity">{{ capacityColumnLabel }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in pagedRows" :key="`${row.course.id}-${row.section?.id || 'none'}`">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="nowrap">
                  <CourseCodeSourcePopover :code="row.course.code" :course="row.course" />
                </td>
                <td class="nowrap">{{ row.course.name }}</td>
                <td class="nowrap">{{ sectionGroupName(row.section) }}</td>
                <td class="nowrap">{{ getRegistrationTypeLabel(row.course.type, t) }}</td>
                <td class="nowrap">
                  {{ getSchoolElectiveCategoryLabel(row.course.schoolElectiveCategory, isZh) }}
                </td>
                <td>{{ row.course.credits }}</td>
                <td class="nowrap">{{ row.section?.lecturer || '—' }}</td>
                <td class="nowrap">{{ row.section ? displayWeekRange(row.section) : '—' }}</td>
                <td class="cr-time-venue">
                  <template v-if="row.section">
                    <div
                      v-for="(line, li) in displayClassTimeVenueLines(row.section, isZh ? 'zh' : 'en')"
                      :key="li"
                      class="cr-time-venue-line"
                    >
                      {{ line }}
                    </div>
                  </template>
                  <template v-else>—</template>
                </td>
                <td class="nowrap">{{ row.course.prerequisites?.join(', ') || '—' }}</td>
                <td class="nowrap td-capacity">
                  <span
                    v-if="row.section"
                    class="capacity-pill"
                    :class="sectionCapacityClass(row.course, row.section)"
                  >
                    {{ sectionCapacityLabel(row.course, row.section) }}
                  </span>
                  <template v-else>—</template>
                </td>
              </tr>
              <tr v-if="!pagedRows.length">
                <td :colspan="emptyTableColspan" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <TablePagination v-model="currentPage" v-model:page-size="pageSize" :total="totalCourseCount" />
    </div>
  </div>
</template>

<style scoped>
.cr-pending-preview {
  padding: 0;
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
}

.th-label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.table-section .table-wrap {
  overflow: visible;
  border: none;
  border-radius: 0;
}

.table-section .data-table {
  min-width: 1280px;
}

.table-section .data-table th {
  white-space: nowrap;
}

.table-section .data-table th,
.table-section .data-table td {
  padding: 5px 10px;
  line-height: 1.35;
  vertical-align: middle;
}

.nowrap {
  white-space: nowrap;
}

.th-capacity {
  background: #f1f5f9 !important;
  min-width: 7.5em;
}

.td-capacity {
  text-align: center;
}

.capacity-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.cr-time-venue {
  min-width: 200px;
  max-width: 320px;
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.capacity-open {
  color: #047857;
  background: #d1fae5;
}

.capacity-full {
  color: #b91c1c;
  background: #fee2e2;
}

.th-credits-filter {
  position: relative;
  z-index: 5;
  white-space: nowrap;
}

.th-funnel-wrap {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 4px;
  z-index: 6;
}

.th-funnel-wrap.is-open {
  z-index: 30;
}

.th-funnel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
}

.th-funnel-wrap.is-active .th-funnel-btn,
.th-funnel-wrap.is-open .th-funnel-btn,
.th-funnel-btn:hover {
  color: #1d4ed8;
  background: #eff6ff;
}

.th-funnel-btn svg {
  width: 14px;
  height: 14px;
}

.th-funnel-panel {
  display: none;
  flex-direction: column;
  gap: 2px;
  min-width: 88px;
  padding: 6px !important;
  top: calc(100% + 4px);
  left: 0;
  transform: none;
  z-index: 40;
}

.th-funnel-wrap.hint-popover-wrap:hover .th-funnel-panel,
.th-funnel-wrap.hint-popover-wrap:focus-within .th-funnel-panel {
  display: none;
}

.th-funnel-wrap.is-open .th-funnel-panel,
.th-funnel-wrap.is-open.hint-popover-wrap:hover .th-funnel-panel,
.th-funnel-wrap.is-open.hint-popover-wrap:focus-within .th-funnel-panel {
  display: flex;
}

.th-funnel-option {
  appearance: none;
  border: none;
  background: transparent;
  text-align: left;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.th-funnel-option:hover,
.th-funnel-option.active {
  background: #eff6ff;
  color: #1d4ed8;
}
</style>
