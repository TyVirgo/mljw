<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import WhitelistDetailDrawer from '../../components/courseRegistration/WhitelistDetailDrawer.vue'
import WhitelistFormDrawer from '../../components/courseRegistration/WhitelistFormDrawer.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { whitelistQueue, whitelistTypes, filterWhitelist } from '../../data/courseRegistration/whitelistQueue.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const searchForm = ref({ type: '', status: '', keyword: '' })
const appliedSearch = ref({ type: '', status: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(20)
const detailItem = ref(null)
const formVisible = ref(false)

const rows = computed(() => filterWhitelist(whitelistQueue.value, appliedSearch.value))
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
  searchForm.value = { type: '', status: '', keyword: '' }
  appliedSearch.value = { type: '', status: '', keyword: '' }
  currentPage.value = 1
}

function typeLabel(type) {
  return t(`courseRegistration.whitelistBoa.types.${type}`)
}

function statusLabel(status) {
  return t(`courseRegistration.whitelistBoa.status.${status}`)
}

function statusClass(status) {
  const map = {
    draft: 'tag-gray',
    acReview: 'tag-blue',
    hopReview: 'tag-amber',
    boaApproved: 'tag-green',
    rejected: 'tag-red',
  }
  return map[status] || 'tag-gray'
}

function openDetail(row) {
  detailItem.value = row
}
</script>

<template>
  <div class="cr-list-page cr-whitelist-page">
    <div class="page-card">
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.whitelistBoa.hint') }}{{ t('common.prototypeOnlySuffix') }}</p>
      </CourseRegistrationCallout>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.whitelistBoa.type') }}</label>
              <select v-model="searchForm.type" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in whitelistTypes" :key="opt" :value="opt">{{ typeLabel(opt) }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('common.status') }}</label>
              <select v-model="searchForm.status" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option value="draft">{{ t('courseRegistration.whitelistBoa.status.draft') }}</option>
                <option value="acReview">{{ t('courseRegistration.whitelistBoa.status.acReview') }}</option>
                <option value="hopReview">{{ t('courseRegistration.whitelistBoa.status.hopReview') }}</option>
                <option value="boaApproved">{{ t('courseRegistration.whitelistBoa.status.boaApproved') }}</option>
                <option value="rejected">{{ t('courseRegistration.whitelistBoa.status.rejected') }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.student') }}</label>
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
        <button type="button" class="btn btn-primary" @click="formVisible = true">
          + {{ t('courseRegistration.whitelistBoa.new') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.serialNo') }}</th>
              <th>{{ t('courseRegistration.monitor.studentId') }}</th>
              <th>{{ t('courseRegistration.monitor.studentName') }}</th>
              <th>{{ t('courseRegistration.whitelistBoa.type') }}</th>
              <th>{{ t('courseRegistration.courses.code') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('courseRegistration.whitelistBoa.stage') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.studentId }}</td>
              <td>{{ row.studentName }}</td>
              <td>{{ typeLabel(row.type) }}</td>
              <td>{{ row.courseCode }}</td>
              <td><span class="status-tag" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span></td>
              <td>{{ t(`courseRegistration.whitelistBoa.stages.${row.currentStage}`) }}</td>
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

    <WhitelistFormDrawer :visible="formVisible" @close="formVisible = false" @saved="formVisible = false" />

    <WhitelistDetailDrawer
      :visible="!!detailItem"
      :item="detailItem"
      @close="detailItem = null"
      @updated="detailItem = detailItem ? { ...detailItem } : null"
    />
  </div>
</template>

<style scoped>
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.tag-gray { background: #f3f4f6; color: #6b7280; }
.tag-blue { background: #dbeafe; color: #1d4ed8; }
.tag-amber { background: #fef3c7; color: #b45309; }
.tag-green { background: #d1fae5; color: #047857; }
.tag-red { background: #fee2e2; color: #b91c1c; }
</style>
