<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import WaitlistDetailDrawer from '../../components/courseRegistration/WaitlistDetailDrawer.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { waitlistCourses, filterWaitlistCourses } from '../../data/courseRegistration/waitlistQueue.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const searchForm = ref({ status: '', keyword: '' })
const appliedSearch = ref({ status: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const detailCourse = ref(null)

const rows = computed(() => filterWaitlistCourses(waitlistCourses.value, appliedSearch.value))
const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = { status: '', keyword: '' }
  appliedSearch.value = { status: '', keyword: '' }
  currentPage.value = 1
}

function statusLabel(status) {
  return t(`courseRegistration.waitlist.courseStatus.${status}`)
}

function openDetail(row) {
  detailCourse.value = row
}
</script>

<template>
  <div class="cr-list-page cr-waitlist-page">
    <ModuleBriefPanel page-id="cr-waitlist" />

    <div class="page-card">
      <CourseRegistrationCallout variant="warning">
        <p>{{ t('courseRegistration.waitlist.hint') }}</p>
      </CourseRegistrationCallout>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('common.status') }}</label>
              <select v-model="searchForm.status" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="open">{{ t('courseRegistration.waitlist.courseStatus.open') }}</option>
                <option value="full">{{ t('courseRegistration.waitlist.courseStatus.full') }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.courses.code') }}</label>
              <input v-model="searchForm.keyword" type="text" class="search-input" />
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.courses.code') }}</th>
              <th>{{ t('courseRegistration.courses.name') }}</th>
              <th>{{ t('courseRegistration.waitlist.section') }}</th>
              <th>{{ t('courseRegistration.waitlist.enrolled') }}</th>
              <th>{{ t('courseRegistration.waitlist.waitlistCount') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.courseCode }}</td>
              <td>{{ row.courseName }}</td>
              <td>{{ row.section }}</td>
              <td>{{ row.enrolled }}/{{ row.capacity }}</td>
              <td>{{ row.waitlistCount }}</td>
              <td>
                <span class="status-tag" :class="row.status">{{ statusLabel(row.status) }}</span>
              </td>
              <td>
                <button type="button" class="link-btn" @click="openDetail(row)">{{ t('common.details') }}</button>
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

    <WaitlistDetailDrawer :visible="!!detailCourse" :course="detailCourse" @close="detailCourse = null" />
  </div>
</template>

<style scoped>
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.open { background: #d1fae5; color: #047857; }
.status-tag.full { background: #fee2e2; color: #b91c1c; }
</style>
