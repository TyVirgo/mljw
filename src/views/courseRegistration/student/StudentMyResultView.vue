<script setup>
import { computed, ref } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import ExternalDataHint from '../../../components/courseRegistration/ExternalDataHint.vue'
import TablePagination from '../../../components/common/TablePagination.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { buildStudentRegistrationResults } from '../../../data/courseRegistration/registrationResult.js'
import { registrationMonitorQueue } from '../../../data/courseRegistration/registrationMonitorQueue.js'
import {
  getStudentProfileFields,
  studentConfirmedCourses,
  formatSelectedAt,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import { getBatchById } from '../../../data/courseRegistration/registrationBatches.js'
import '../../../styles/list-page-search.css'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const { t } = useAppI18n()
const syncMessage = ref('')

function emptySearch() {
  return {
    name: '',
    academicSession: '',
    credits: '',
    section: '',
    lecturer: '',
    weekRange: '',
    time: '',
    room: '',
    selectedAt: '',
  }
}

const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const currentPage = ref(1)
const pageSize = ref(20)

const studentFields = computed(() => getStudentProfileFields())

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

/**
 * 解析学年学期：优先课程字段，否则取批次
 * @param {object} item
 * @returns {string}
 */
function academicSessionOf(item) {
  const direct = String(item?.academicSession || '').trim()
  if (direct) return direct
  if (!item?.batchId) return ''
  return String(getBatchById(item.batchId)?.academicSession || '').trim()
}

function retakeLabel(item) {
  return item.isRetake ? t('common.yes') : t('common.no')
}

const allCourseRows = computed(() => {
  if (studentConfirmedCourses.value.length) {
    return studentConfirmedCourses.value.map((item) => {
      const isAdmin = item.sourceType === 'admin' || Boolean(item.operatorName)
      const academicSession = academicSessionOf(item)
      return {
        courseId: item.courseId,
        code: item.courseCode,
        name: item.courseName,
        academicSession: academicSession || '—',
        section: item.sectionCode || '—',
        lecturer: item.lecturer || '—',
        weekRange: item.weekRange || '—',
        time: item.classTime || item.time || '—',
        room: item.room || '—',
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
    time: '—',
    room: '—',
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
const timeOptions = computed(() => uniqueOptions((row) => row.time))
const roomOptions = computed(() => uniqueOptions((row) => row.room))
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
    if (f.time && String(row.time) !== String(f.time)) return false
    if (f.room && String(row.room) !== String(f.room)) return false
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

function handleSyncStudyPlan() {
  if (!resultRow.value) return
  if (!window.confirm(t('courseRegistration.result.syncConfirm'))) return
  syncMessage.value = t('courseRegistration.result.syncSuccess')
}
</script>

<template>
  <StudentPageShell>
    <div class="page-card">
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
              <label>{{ t('courseRegistration.courses.classTime') }}</label>
              <select v-model="searchForm.time" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in timeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.room') }}</label>
              <select v-model="searchForm.room" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in roomOptions" :key="opt" :value="opt">{{ opt }}</option>
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

      <div v-if="resultRow" class="toolbar">
        <button type="button" class="btn btn-outline" @click="handleSyncStudyPlan">
          {{ t('courseRegistration.result.syncStudyPlan') }}
        </button>
        <ExternalDataHint source-key="studyPlan" />
      </div>
      <p v-if="syncMessage" class="cr-student-message">{{ syncMessage }}</p>

      <div class="table-section">
        <div class="table-wrap history-table-wrap">
          <table class="data-table history-data-table">
            <thead>
              <tr>
                <th class="col-sticky-left col-no">{{ t('common.serialNo') }}</th>
                <th class="col-sticky-left col-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="col-sticky-left col-name">{{ t('courseRegistration.courses.name') }}</th>
                <th>{{ t('courseRegistration.batch.academicSession') }}</th>
                <th>{{ t('courseRegistration.courses.credits') }}</th>
                <th>{{ t('courseRegistration.courses.sectionCode') }}</th>
                <th>{{ t('courseRegistration.courses.lecturer') }}</th>
                <th>{{ t('courseRegistration.courses.weekRange') }}</th>
                <th>{{ t('courseRegistration.courses.classTime') }}</th>
                <th>{{ t('courseRegistration.courses.room') }}</th>
                <th>{{ t('courseRegistration.student.selectedAt') }}</th>
                <th class="col-batch-name">{{ t('courseRegistration.batch.name') }}</th>
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
                <td class="col-sticky-left col-code">{{ row.code }}</td>
                <td class="col-sticky-left col-name">{{ row.name }}</td>
                <td>{{ row.academicSession }}</td>
                <td>{{ row.credits }}</td>
                <td>{{ formatSectionName(row.section) }}</td>
                <td>{{ row.lecturer }}</td>
                <td>{{ row.weekRange }}</td>
                <td>{{ row.time }}</td>
                <td>{{ row.room }}</td>
                <td class="col-selected-at">{{ row.selectedAt }}</td>
                <td class="col-batch-name" :title="row.batchName !== '—' ? row.batchName : undefined">
                  <span class="col-batch-name-text">{{ row.batchName }}</span>
                </td>
                <td>{{ row.isRetakeLabel }}</td>
                <td>{{ row.sourceLabel }}</td>
                <td>{{ row.operatorName }}</td>
              </tr>
              <tr v-if="!courseRows.length">
                <td colspan="15" class="empty-cell">
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
  </StudentPageShell>
</template>

<style scoped>
.history-table-wrap {
  overflow-x: auto;
}

.history-data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.history-data-table th,
.history-data-table td {
  white-space: nowrap;
}

.history-data-table .empty-cell {
  white-space: normal;
}

.history-data-table .col-sticky-left {
  position: sticky;
  z-index: 2;
  background: #fff;
}

.history-data-table thead .col-sticky-left {
  z-index: 4;
  background: #f9fafb;
}

.history-data-table .col-no.col-sticky-left {
  left: 0;
  min-width: 56px;
}

.history-data-table .col-code.col-sticky-left {
  left: 56px;
  min-width: 110px;
}

.history-data-table .col-name.col-sticky-left {
  left: 166px;
  min-width: 160px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.12);
}

.col-selected-at {
  font-variant-numeric: tabular-nums;
}

.col-batch-name {
  max-width: 260px;
}

.col-batch-name-text {
  display: block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cr-operator-th {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cr-operator-th .hint-popover-trigger svg {
  width: 14px;
  height: 14px;
  color: #9ca3af;
}
</style>
