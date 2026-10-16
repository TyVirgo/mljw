<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  sectionStudentRosterQueue,
  filterSectionStudentRoster,
  listSectionRosterSessions,
  listSectionRosterIntakes,
  listSectionRosterProgrammes,
  formatSectionStudentRosterExportRow,
  formatRosterClassTimeVenue,
} from '../../data/courseRegistration/sectionStudentRoster.js'
import { sectionStudentRosterExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import { exportCourseRegistrationData } from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t, isZh } = useAppI18n()

const scheduleLocale = computed(() => (isZh.value ? 'zh' : 'en'))

const emptyFilters = () => ({
  academicSession: '',
  courseCode: '',
  sectionName: '',
  studentId: '',
  studentName: '',
  intake: '',
  owner: '',
  programme: '',
  studyMode: '',
})

const searchExpanded = ref(true)
const searchForm = ref(emptyFilters())
const applied = ref(emptyFilters())
const currentPage = ref(1)
const pageSize = ref(20)

const sessionOptions = computed(() => listSectionRosterSessions())
const intakeOptions = computed(() => listSectionRosterIntakes())
const programmeOptions = computed(() => listSectionRosterProgrammes())

const rows = computed(() =>
  filterSectionStudentRoster(sectionStudentRosterQueue.value, { ...applied.value }),
)
const totalCount = computed(() => rows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  applied.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptyFilters()
  applied.value = emptyFilters()
  currentPage.value = 1
}

function classTimeVenueText(row) {
  return formatRosterClassTimeVenue(row, scheduleLocale.value) || '—'
}

function handleExport() {
  if (!rows.value.length) {
    window.alert(t('common.noData'))
    return
  }
  const locale = scheduleLocale.value
  const timestamp = new Date().toISOString().slice(0, 10)
  exportCourseRegistrationData({
    rows: rows.value,
    columns: sectionStudentRosterExportFields,
    formatRow: (row, translate) => formatSectionStudentRosterExportRow(row, translate, locale),
    filename: `section-student-roster-${timestamp}.xlsx`,
    sheetName: t('courseRegistration.sectionRoster.sheetName'),
    i18n: { t },
  })
}
</script>

<template>
  <div class="cr-list-page cr-section-roster-page">
    <div class="page-card">
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.sectionRoster.hint') }}</p>
      </CourseRegistrationCallout>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.sectionRoster.term') }}</label>
              <select v-model="searchForm.academicSession" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="s in sessionOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.code') }}</label>
              <input
                v-model="searchForm.courseCode"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.sectionRoster.sectionName') }}</label>
              <input
                v-model="searchForm.sectionName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.studentId') }}</label>
              <input
                v-model="searchForm.studentId"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
                @keyup.enter="handleSearch"
              />
            </div>
            <template v-if="searchExpanded">
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                <input
                  v-model="searchForm.studentName"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.monitor.studentNamePlaceholder')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.intake') }}</label>
                <select v-model="searchForm.intake" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="i in intakeOptions" :key="i" :value="i">{{ i }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.sectionRoster.owner') }}</label>
                <input
                  v-model="searchForm.owner"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.sectionRoster.ownerPh')"
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.monitor.programme') }}</label>
                <select v-model="searchForm.programme" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="p in programmeOptions" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.sectionRoster.studyMode') }}</label>
                <input
                  v-model="searchForm.studyMode"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.sectionRoster.studyModePh')"
                  @keyup.enter="handleSearch"
                />
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

      <div class="toolbar-row">
        <div class="toolbar-actions">
          <button
            type="button"
            class="btn btn-outline"
            :disabled="!rows.length"
            @click="handleExport"
          >
            {{ t('common.export') }}
          </button>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.sectionRoster.term') }}</th>
                <th>{{ t('courseRegistration.courses.code') }}</th>
                <th>{{ t('courseRegistration.sectionRoster.sectionName') }}</th>
                <th>{{ t('courseRegistration.monitor.credits') }}</th>
                <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                <th>{{ t('courseRegistration.monitor.intake') }}</th>
                <th>{{ t('courseRegistration.monitor.programme') }}</th>
                <th>{{ t('courseRegistration.sectionRoster.movementStatus') }}</th>
                <th>{{ t('courseRegistration.sectionRoster.studyMode') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th>{{ t('courseRegistration.sectionRoster.owner') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedRows.length">
                <td colspan="14" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.academicSession || '—' }}</td>
                <td>{{ row.courseCode || '—' }}</td>
                <td :title="row.sectionName">{{ row.sectionName || '—' }}</td>
                <td>{{ row.credits ?? '—' }}</td>
                <td>{{ row.studentId || '—' }}</td>
                <td>{{ row.studentName || '—' }}</td>
                <td>{{ row.intakeCompact || '—' }}</td>
                <td>{{ row.programme || '—' }}</td>
                <td>{{ row.movementStatus || '—' }}</td>
                <td>{{ row.studyMode || '—' }}</td>
                <td :title="row.lecturers">{{ row.lecturers || '—' }}</td>
                <td :title="classTimeVenueText(row)">{{ classTimeVenueText(row) }}</td>
                <td>{{ row.owner || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination v-model="currentPage" v-model:page-size="pageSize" :total="totalCount" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cr-section-roster-page :deep(.data-table th) {
  white-space: nowrap;
}

.empty-cell {
  text-align: center;
  color: var(--text-secondary, #666);
  padding: 24px 12px;
}
</style>
