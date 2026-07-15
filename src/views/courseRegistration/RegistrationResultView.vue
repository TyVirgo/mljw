<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ExternalDataHint from '../../components/courseRegistration/ExternalDataHint.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { registrationBatches } from '../../data/courseRegistration/registrationBatches.js'
import {
  buildStudentRegistrationResults,
  buildCourseRegistrationResults,
  filterStudentResults,
  filterCourseResults,
  syncStudyPlanDemo,
} from '../../data/courseRegistration/registrationResult.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const activeTab = ref('student')
const searchForm = ref({ programme: '', status: '', batchId: '', keyword: '' })
const appliedSearch = ref({ programme: '', status: '', batchId: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)

const studentRows = computed(() => buildStudentRegistrationResults())
const courseRows = computed(() => buildCourseRegistrationResults())

const rows = computed(() => {
  if (activeTab.value === 'student') {
    return filterStudentResults(studentRows.value, appliedSearch.value)
  }
  return filterCourseResults(courseRows.value, appliedSearch.value)
})

const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

const batchOptions = computed(() => registrationBatches.value)

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = { programme: '', status: '', batchId: '', keyword: '' }
  appliedSearch.value = { programme: '', status: '', batchId: '', keyword: '' }
  currentPage.value = 1
}

function handleSyncStudyPlan() {
  const msg = t('courseRegistration.result.syncConfirm')
  if (!window.confirm(msg)) return
  const result = syncStudyPlanDemo()
  if (result.ok) window.alert(t(result.messageKey))
}

function statusLabel(status) {
  return t(`courseRegistration.result.status.${status}`)
}
</script>

<template>
  <div class="cr-list-page cr-result-page">
    <ModuleBriefPanel page-id="cr-result" />

    <div class="page-card">
      <CourseRegistrationCallout variant="warning">
        <p>{{ t('courseRegistration.result.syncConfirm') }}</p>
      </CourseRegistrationCallout>

      <div class="tab-bar">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'student' }"
          @click="activeTab = 'student'; currentPage = 1"
        >
          {{ t('courseRegistration.result.tabStudent') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'course' }"
          @click="activeTab = 'course'; currentPage = 1"
        >
          {{ t('courseRegistration.result.tabCourse') }}
        </button>
      </div>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div v-if="activeTab === 'student'" class="search-item">
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input v-model="searchForm.programme" type="text" class="search-input" />
            </div>
            <div v-if="activeTab === 'student'" class="search-item">
              <label>{{ t('common.status') }}</label>
              <select v-model="searchForm.status" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="confirmed">{{ t('courseRegistration.result.status.confirmed') }}</option>
                <option value="warning">{{ t('courseRegistration.result.status.warning') }}</option>
              </select>
            </div>
            <div v-if="activeTab === 'course'" class="search-item">
              <label>{{ t('courseRegistration.batch.name') }}</label>
              <select v-model="searchForm.batchId" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="batch in batchOptions" :key="batch.id" :value="batch.id">{{ batch.name }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('common.search') }}</label>
              <input v-model="searchForm.keyword" type="text" class="search-input" />
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="handleSyncStudyPlan">
          {{ t('courseRegistration.result.syncStudyPlan') }}
          <ExternalDataHint source-key="studyPlan" />
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
        <table v-if="activeTab === 'student'" class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.monitor.studentId') }}</th>
              <th>{{ t('courseRegistration.monitor.studentName') }}</th>
              <th>{{ t('courseRegistration.monitor.programme') }}</th>
              <th>Intake</th>
              <th>{{ t('courseRegistration.monitor.credits') }}</th>
              <th>{{ t('courseRegistration.result.courseCount') }}</th>
              <th>{{ t('courseRegistration.result.courses') }}</th>
              <th>{{ t('common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.studentId }}</td>
              <td>{{ row.studentName }}</td>
              <td>{{ row.programme }}</td>
              <td>{{ row.intake }}</td>
              <td>{{ row.credits }}</td>
              <td>{{ row.courseCount }}</td>
              <td class="col-courses">{{ row.courses }}</td>
              <td>
                <span class="status-tag" :class="row.status">{{ statusLabel(row.status) }}</span>
              </td>
            </tr>
            <tr v-if="!paginatedRows.length">
              <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.courses.code') }}</th>
              <th>{{ t('courseRegistration.courses.name') }}</th>
              <th>{{ t('courseRegistration.courses.credits') }}</th>
              <th>{{ t('courseRegistration.courses.capacity') }}</th>
              <th>{{ t('courseRegistration.result.enrolled') }}</th>
              <th>{{ t('courseRegistration.result.remaining') }}</th>
              <th>{{ t('courseRegistration.result.utilization') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.courseCode }}</td>
              <td>{{ row.courseName }}</td>
              <td>{{ row.credits }}</td>
              <td>{{ row.totalCapacity }}</td>
              <td>{{ row.enrolled }}</td>
              <td>{{ row.remaining }}</td>
              <td>
                <div class="util-bar">
                  <div class="util-fill" :style="{ width: `${row.utilization}%` }" />
                  <span>{{ row.utilization }}%</span>
                </div>
              </td>
            </tr>
            <tr v-if="!paginatedRows.length">
              <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <TablePagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
          :total-pages="totalPages"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.col-courses { max-width: 180px; font-size: 12px; color: #6b7280; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.confirmed { background: #d1fae5; color: #047857; }
.status-tag.warning { background: #fef3c7; color: #b45309; }
.util-bar { display: flex; align-items: center; gap: 8px; min-width: 100px; }
.util-fill { height: 8px; background: #2563eb; border-radius: 4px; max-width: 80px; }
</style>
