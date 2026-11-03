<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ExportModal from '../../components/common/ExportModal.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  sectionStudentRosterQueue,
  filterSectionStudentRoster,
  listSectionRosterSessions,
  listSectionRosterIntakes,
  listSectionRosterProgrammes,
  listSectionRosterStudyModes,
  formatSectionStudentRosterExportRow,
  formatRosterClassTimeVenue,
  rosterClassTimeVenueLines,
} from '../../data/courseRegistration/sectionStudentRoster.js'
import { studyModeLabel } from '../../data/courseRegistration/studyMode.js'
import { sectionStudentRosterExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import { exportCourseRegistrationData } from '../../utils/exportCourseRegistrationExcel.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t, isZh } = useAppI18n()

const scheduleLocale = computed(() => (isZh.value ? 'zh' : 'en'))
const exportModalVisible = ref(false)

/** ExportModal 字段列表（已翻译 label） */
const exportModalFields = computed(() =>
  sectionStudentRosterExportFields.map((f) => ({
    key: f.key,
    label: t(f.labelKey),
  })),
)

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
const studyModeOptions = computed(() => listSectionRosterStudyModes())

/**
 * 修读方式列展示
 * @param {string} key
 */
function formatStudyMode(key) {
  return studyModeLabel(key, t)
}

const rows = computed(() =>
  filterSectionStudentRoster(sectionStudentRosterQueue.value, { ...applied.value }),
)
const totalCount = computed(() => rows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

/** 本页查询结果学分合计（按当前页行 credits 求和） */
const pageCreditsSum = computed(() =>
  paginatedRows.value.reduce((sum, row) => sum + (Number(row.credits) || 0), 0),
)

function handleSearch() {
  applied.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptyFilters()
  applied.value = emptyFilters()
  currentPage.value = 1
}

/** 导出/悬停全文：单行拼接 */
function classTimeVenueText(row) {
  return formatRosterClassTimeVenue(row, scheduleLocale.value) || '—'
}

/** 表格展示：按时段分行 */
function classTimeVenueLines(row) {
  return rosterClassTimeVenueLines(row, scheduleLocale.value)
}

/** 打开导出弹框（字段 + 范围） */
function openExportModal() {
  if (!rows.value.length) {
    window.alert(t('common.noData'))
    return
  }
  exportModalVisible.value = true
}

/**
 * 按导出范围取行
 * @param {string} exportScope currentPage | allResults | selectedRows
 */
function resolveExportRows(exportScope) {
  if (exportScope === 'currentPage') return paginatedRows.value
  return rows.value
}

/**
 * 确认导出：按所选字段与范围写 Excel
 * @param {{ selectedFields: string[], exportScope: string }} payload
 */
function handleExportConfirm({ selectedFields, exportScope }) {
  const columns = sectionStudentRosterExportFields.filter((col) =>
    selectedFields.includes(col.key),
  )
  if (!columns.length) {
    window.alert(t('common.selectExportField'))
    return
  }
  const exportRows = resolveExportRows(exportScope)
  if (!exportRows.length) {
    window.alert(t('common.noData'))
    return
  }
  const locale = scheduleLocale.value
  const timestamp = new Date().toISOString().slice(0, 10)
  exportCourseRegistrationData({
    rows: exportRows,
    columns,
    formatRow: (row, translate) => formatSectionStudentRosterExportRow(row, translate, locale),
    filename: `section-student-roster-${timestamp}.xlsx`,
    sheetName: t('courseRegistration.sectionRoster.sheetName'),
    i18n: { t },
  })
  exportModalVisible.value = false
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
                <select v-model="searchForm.studyMode" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="mode in studyModeOptions" :key="mode" :value="mode">
                    {{ formatStudyMode(mode) }}
                  </option>
                </select>
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
            @click="openExportModal"
          >
            {{ t('common.export') }}
          </button>
          <span class="page-credits-hint">
            <span>{{ t('courseRegistration.sectionRoster.pageCreditsSumPrefix') }}</span>
            <span class="page-credits-hint__score">{{ pageCreditsSum }}</span>
          </span>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrap table-wrap--no-hscroll">
          <table class="data-table data-table--roster">
            <thead>
              <tr>
                <th class="col-serial">{{ t('common.serialNo') }}</th>
                <th class="col-term">{{ t('courseRegistration.sectionRoster.term') }}</th>
                <th class="col-code">{{ t('courseRegistration.courses.code') }}</th>
                <th class="col-section">{{ t('courseRegistration.sectionRoster.sectionName') }}</th>
                <th class="col-credits">{{ t('courseRegistration.monitor.credits') }}</th>
                <th class="col-sid">{{ t('courseRegistration.monitor.studentId') }}</th>
                <th class="col-sname">{{ t('courseRegistration.monitor.studentName') }}</th>
                <th class="col-intake">{{ t('courseRegistration.monitor.intake') }}</th>
                <th class="col-prog">{{ t('courseRegistration.monitor.programme') }}</th>
                <th class="col-move">{{ t('courseRegistration.sectionRoster.movementStatus') }}</th>
                <th class="col-mode">{{ t('courseRegistration.sectionRoster.studyMode') }}</th>
                <th class="col-lecturer">{{ t('courseRegistration.courses.lecturer') }}</th>
                <th class="col-time">{{ t('courseRegistration.courses.classTimeVenue') }}</th>
                <th class="col-owner">{{ t('courseRegistration.sectionRoster.owner') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!paginatedRows.length">
                <td colspan="14" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td class="col-serial">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="col-term">{{ row.academicSession || '—' }}</td>
                <td class="col-code">{{ row.courseCode || '—' }}</td>
                <td class="cell-ellipsis col-section" :title="row.sectionName || undefined">
                  {{ row.sectionName || '—' }}
                </td>
                <td class="col-credits">{{ row.credits ?? '—' }}</td>
                <td class="col-sid">{{ row.studentId || '—' }}</td>
                <td class="cell-ellipsis col-sname" :title="row.studentName || undefined">
                  {{ row.studentName || '—' }}
                </td>
                <td class="col-intake">{{ row.intakeCompact || '—' }}</td>
                <td class="col-prog">{{ row.programme || '—' }}</td>
                <td class="col-move">{{ row.movementStatus || '—' }}</td>
                <td
                  class="cell-ellipsis col-mode"
                  :title="formatStudyMode(row.studyMode) || undefined"
                >
                  {{ formatStudyMode(row.studyMode) }}
                </td>
                <td class="cell-ellipsis col-lecturer" :title="row.lecturers || undefined">
                  {{ row.lecturers || '—' }}
                </td>
                <td
                  class="col-time cr-time-venue"
                  :title="classTimeVenueText(row) !== '—' ? classTimeVenueText(row) : undefined"
                >
                  <template v-if="classTimeVenueLines(row).length">
                    <div
                      v-for="(line, lineIndex) in classTimeVenueLines(row)"
                      :key="lineIndex"
                      class="cr-time-venue-line"
                      :title="line"
                    >
                      {{ line }}
                    </div>
                  </template>
                  <template v-else>—</template>
                </td>
                <td class="cell-ellipsis col-owner" :title="row.owner || undefined">
                  {{ row.owner || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination v-model="currentPage" v-model:page-size="pageSize" :total="totalCount" />
      </div>
    </div>

    <ExportModal
      :visible="exportModalVisible"
      :fields="exportModalFields"
      :has-selected-rows="false"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

/* 对齐「我的课程」累计学分强调：前缀深色，数字红色 */
.page-credits-hint {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.page-credits-hint__score {
  color: #dc2626;
}

/* 本页禁止左右横滑；长列缩略/分行 */
.cr-section-roster-page :deep(.table-wrap--no-hscroll) {
  overflow-x: hidden;
}

.cr-section-roster-page :deep(.data-table--roster) {
  table-layout: fixed;
  width: 100%;
}

.cr-section-roster-page :deep(.data-table--roster th) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-section-roster-page :deep(.data-table--roster th),
.cr-section-roster-page :deep(.data-table--roster td) {
  vertical-align: top;
  padding: 8px 6px;
}

.col-serial {
  width: 3%;
}
.col-term {
  width: 5.5%;
}
.col-code {
  width: 5.5%;
}
.col-section {
  width: 11%;
}
.col-credits {
  width: 3.5%;
}
.col-sid {
  width: 8%;
}
.col-sname {
  width: 7%;
}
.col-intake {
  width: 5.5%;
}
.col-prog {
  width: 4%;
}
.col-move {
  width: 5%;
}
.col-mode {
  width: 8%;
}
.col-lecturer {
  width: 6%;
}
.col-time {
  width: 18%;
}
.col-owner {
  width: 7%;
}

.cell-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 0;
}

.cr-time-venue {
  white-space: normal;
  word-break: break-word;
}

.cr-time-venue-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
}

.cr-time-venue-line + .cr-time-venue-line {
  margin-top: 2px;
}

.empty-cell {
  text-align: center;
  color: var(--text-secondary, #666);
  padding: 24px 12px;
}
</style>
