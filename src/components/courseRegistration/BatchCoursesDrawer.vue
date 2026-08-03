<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import TablePagination from '../common/TablePagination.vue'
import CourseLibraryImportModal from './CourseLibraryImportModal.vue'
import BatchCourseOptionalSettingsModal from './BatchCourseOptionalSettingsModal.vue'
import BatchCourseCapacitySettingsModal from './BatchCourseCapacitySettingsModal.vue'
import BatchCourseProgrammeScopeModal from './BatchCourseProgrammeScopeModal.vue'
import CourseSectionsModal from './CourseSectionsModal.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'
import {
  getCourseAudienceCapacity,
  getCourseEnrolledTotal,
  getCourseProgrammeScopeCodes,
  getCoursesByBatch,
  importCoursesFromLibrary,
  selectableCourses,
} from '../../data/courseRegistration/selectableCourses.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const keyword = ref('')
const appliedKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const sectionsCourse = ref(null)
const importVisible = ref(false)
const optionalSettingsVisible = ref(false)
const capacitySettingsVisible = ref(false)
const programmeScopeVisible = ref(false)
/** @type {import('vue').Ref<string[]>} */
const selectedIds = ref([])

const batchId = computed(() => props.batch?.id || '')
const batchName = computed(() => props.batch?.name || '')
const batchReadOnly = computed(() => props.batch?.status === 'active')
const showSelection = computed(() => !batchReadOnly.value)

const title = computed(() =>
  batchName.value
    ? t('courseRegistration.courses.manageForBatch', { name: batchName.value })
    : t('courseRegistration.courses.manageCourses'),
)

const subtitle = computed(() => {
  if (!props.batch) return ''
  const session = props.batch.academicSession || props.batch.semester || ''
  const typeLabel = props.batch.type ? getRegistrationTypeLabel(props.batch.type, t) : ''
  return session ? `${session} · ${typeLabel}` : typeLabel
})

const allBatchCourses = computed(() => {
  void selectableCourses.value
  return getCoursesByBatch(batchId.value)
})

const rows = computed(() => {
  let list = allBatchCourses.value
  if (appliedKeyword.value) {
    const kw = appliedKeyword.value.toLowerCase()
    list = list.filter(
      (r) => r.code.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw),
    )
  }
  return list
})

const importedCodes = computed(() => allBatchCourses.value.map((c) => c.code))
const batchTotal = computed(() => allBatchCourses.value.length)
const totalCount = computed(() => rows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})
const selectedCourses = computed(() =>
  allBatchCourses.value.filter((c) => selectedIds.value.includes(c.id)),
)
const pageIds = computed(() => paginatedRows.value.map((r) => r.id))
const allPageSelected = computed(
  () => pageIds.value.length > 0 && pageIds.value.every((id) => selectedIds.value.includes(id)),
)

watch(
  () => [props.visible, props.batch?.id],
  () => {
    if (!props.visible) return
    keyword.value = ''
    appliedKeyword.value = ''
    currentPage.value = 1
    sectionsCourse.value = null
    importVisible.value = false
    optionalSettingsVisible.value = false
    capacitySettingsVisible.value = false
    programmeScopeVisible.value = false
    selectedIds.value = []
  },
)

function handleSearch() {
  appliedKeyword.value = keyword.value
  currentPage.value = 1
}

function handleReset() {
  keyword.value = ''
  appliedKeyword.value = ''
  currentPage.value = 1
}

function openSections(row) {
  sectionsCourse.value = row
}

function openImport() {
  if (batchReadOnly.value) return
  importVisible.value = true
}

function openOptionalSettings() {
  if (batchReadOnly.value || !selectedIds.value.length) return
  optionalSettingsVisible.value = true
}

function openCapacitySettings() {
  if (batchReadOnly.value || !selectedIds.value.length) return
  capacitySettingsVisible.value = true
}

function openProgrammeScopeSettings() {
  if (batchReadOnly.value || !selectedIds.value.length) return
  programmeScopeVisible.value = true
}

function selectableLabel(value) {
  return value === false
    ? t('courseRegistration.courses.isSelectableNo')
    : t('courseRegistration.courses.isSelectableYes')
}

function prerequisitesLabel(list) {
  const items = Array.isArray(list) ? list.filter(Boolean) : []
  return items.length ? items.join(', ') : '—'
}

function audienceCapacityLabel(row, audience) {
  if (audience === 'freshman') {
    const enrolled = Number(row?.enrolledFreshman)
    const cap = Number(row?.quota?.freshman)
    const safeEnrolled = Number.isFinite(enrolled) ? enrolled : getCourseAudienceCapacity(row).enrolledFreshman
    const safeCap = Number.isFinite(cap) ? cap : getCourseAudienceCapacity(row).freshmanCap
    return `${safeEnrolled}/${safeCap}`
  }
  const enrolled = Number(row?.enrolledSenior)
  const cap = Number(row?.quota?.senior)
  const safeEnrolled = Number.isFinite(enrolled) ? enrolled : getCourseAudienceCapacity(row).enrolledSenior
  const safeCap = Number.isFinite(cap) ? cap : getCourseAudienceCapacity(row).seniorCap
  return `${safeEnrolled}/${safeCap}`
}

/** 已选（新老生合计）/ 有效最大容量（随容量设置变化） */
function effectiveCapacityLabel(row) {
  const enrolledFresh = Number(row?.enrolledFreshman)
  const enrolledSenior = Number(row?.enrolledSenior)
  const enrolled =
    Number.isFinite(enrolledFresh) && Number.isFinite(enrolledSenior)
      ? enrolledFresh + enrolledSenior
      : getCourseEnrolledTotal(row)
  const total = Number(row?.totalCapacity) || 0
  return `${enrolled}/${total}`
}

function sourceCapacityLabel(row) {
  const source = Number(row?.sourceCapacity)
  if (Number.isFinite(source) && source > 0) return String(source)
  return String(getCourseAudienceCapacity(row).sourceCapacity || 0)
}

function capacityPercentLabel(row) {
  const p = Number(row?.capacityPercent)
  const percent = Number.isFinite(p) && p > 0 ? Math.round(p) : 100
  return `${percent}%`
}

function programmeScopeLabel(row) {
  const codes = getCourseProgrammeScopeCodes(row)
  if (!codes.length) return t('courseRegistration.courses.programmeScopeUnlimited')
  return codes.join('、')
}

function toggleRow(id, checked) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
    return
  }
  selectedIds.value = selectedIds.value.filter((item) => item !== id)
}

function togglePage(checked) {
  if (checked) {
    const merged = new Set([...selectedIds.value, ...pageIds.value])
    selectedIds.value = [...merged]
    return
  }
  const drop = new Set(pageIds.value)
  selectedIds.value = selectedIds.value.filter((id) => !drop.has(id))
}

function handleImportConfirm(codes) {
  if (!batchId.value) return
  importCoursesFromLibrary(batchId.value, codes)
  importVisible.value = false
  currentPage.value = 1
}

function handleOptionalSaved() {
  selectedIds.value = []
}

function handleCapacitySaved() {
  selectedIds.value = []
}

function handleProgrammeScopeSaved() {
  selectedIds.value = []
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="batch-courses-drawer"
    @close="emit('close')"
  >
    <template v-if="batch">
      <div class="batch-courses-body">
        <div class="search-bar">
          <div class="search-row">
            <div class="search-fields">
              <div class="search-item">
                <label>{{ t('courseRegistration.courses.filterLabel') }}</label>
                <input
                  v-model="keyword"
                  type="text"
                  class="search-input"
                  :placeholder="t('courseRegistration.courses.librarySearchPlaceholder')"
                  @keyup.enter="handleSearch"
                />
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

        <div class="drawer-toolbar">
          <div class="toolbar-left">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="batchReadOnly"
              :title="batchReadOnly ? t('courseRegistration.batch.activeReadOnlyHint') : undefined"
              @click="openImport"
            >
              + {{ t('courseRegistration.courses.import') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly || selectedIds.length === 0"
              :title="
                batchReadOnly
                  ? t('courseRegistration.batch.activeReadOnlyHint')
                  : selectedIds.length === 0
                    ? t('courseRegistration.courses.optionalSettingsNeedSelect')
                    : undefined
              "
              @click="openOptionalSettings"
            >
              {{ t('courseRegistration.courses.optionalSettings') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly || selectedIds.length === 0"
              :title="
                batchReadOnly
                  ? t('courseRegistration.batch.activeReadOnlyHint')
                  : selectedIds.length === 0
                    ? t('courseRegistration.courses.optionalSettingsNeedSelect')
                    : undefined
              "
              @click="openCapacitySettings"
            >
              {{ t('courseRegistration.courses.capacitySettings') }}
            </button>
            <button
              type="button"
              class="btn btn-default"
              :disabled="batchReadOnly || selectedIds.length === 0"
              :title="
                batchReadOnly
                  ? t('courseRegistration.batch.activeReadOnlyHint')
                  : selectedIds.length === 0
                    ? t('courseRegistration.courses.optionalSettingsNeedSelect')
                    : undefined
              "
              @click="openProgrammeScopeSettings"
            >
              {{ t('courseRegistration.courses.programmeScopeSettings') }}
            </button>
          </div>
          <span class="drawer-meta">
            {{ t('courseRegistration.courses.batchCourseMeta', { count: batchTotal }) }}
            <ExternalDataHint source-key="courseLibrary" />
          </span>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table" :class="{ 'no-selection': !showSelection }">
              <thead>
                <tr>
                  <th v-if="showSelection" class="col-check col-sticky-left col-sticky-check">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      :disabled="paginatedRows.length === 0"
                      @change="togglePage($event.target.checked)"
                    />
                  </th>
                  <th class="col-no col-sticky-left col-sticky-no">{{ t('common.serialNo') }}</th>
                  <th class="col-code col-sticky-left col-sticky-code">{{ t('courseRegistration.courses.code') }}</th>
                  <th class="col-name col-sticky-left col-sticky-name">{{ t('courseRegistration.courses.name') }}</th>
                  <th>{{ t('courseRegistration.courses.credits') }}</th>
                  <th>{{ t('courseRegistration.courses.category') }}</th>
                  <th>{{ t('courseRegistration.courses.sectionCount') }}</th>
                  <th>
                    <span
                      class="th-with-tip"
                      :title="t('courseRegistration.courses.effectiveCapacityTip')"
                    >
                      {{ t('courseRegistration.courses.effectiveCapacity') }}
                      <span class="tip-icon" aria-hidden="true">?</span>
                    </span>
                  </th>
                  <th>{{ t('courseRegistration.courses.enrolledFreshman') }}</th>
                  <th>{{ t('courseRegistration.courses.enrolledSenior') }}</th>
                  <th>
                    <span
                      class="th-with-tip"
                      :title="t('courseRegistration.courses.sourceCapacityTip')"
                    >
                      {{ t('courseRegistration.courses.sourceCapacity') }}
                      <span class="tip-icon" aria-hidden="true">?</span>
                    </span>
                  </th>
                  <th>{{ t('courseRegistration.courses.capacityPercentCol') }}</th>
                  <th>{{ t('courseRegistration.courses.programmeScope') }}</th>
                  <th>{{ t('courseRegistration.courses.prerequisites') }}</th>
                  <th>{{ t('courseRegistration.courses.isSelectable') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in paginatedRows"
                  :key="`${row.id}-${row.totalCapacity}-${row.capacityPercent}-${programmeScopeLabel(row)}`"
                >
                  <td v-if="showSelection" class="col-check col-sticky-left col-sticky-check">
                    <input
                      type="checkbox"
                      :checked="selectedIds.includes(row.id)"
                      @change="toggleRow(row.id, $event.target.checked)"
                    />
                  </td>
                  <td class="col-no col-sticky-left col-sticky-no">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="col-code col-sticky-left col-sticky-code">{{ row.code }}</td>
                  <td class="col-name col-sticky-left col-sticky-name">{{ row.name }}</td>
                  <td>{{ row.credits }}</td>
                  <td>{{ getRegistrationTypeLabel(row.type, t) }}</td>
                  <td>
                    <button type="button" class="link-btn" @click="openSections(row)">
                      {{ row.sectionCount }}
                    </button>
                  </td>
                  <td>{{ effectiveCapacityLabel(row) }}</td>
                  <td>{{ audienceCapacityLabel(row, 'freshman') }}</td>
                  <td>{{ audienceCapacityLabel(row, 'senior') }}</td>
                  <td>{{ sourceCapacityLabel(row) }}</td>
                  <td>{{ capacityPercentLabel(row) }}</td>
                  <td>{{ programmeScopeLabel(row) }}</td>
                  <td class="col-prereq">{{ prerequisitesLabel(row.prerequisites) }}</td>
                  <td>{{ selectableLabel(row.isSelectable) }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td :colspan="showSelection ? 15 : 14" class="empty-cell">
                    <div class="empty-block">
                      <p class="empty-title">
                        {{
                          batchTotal === 0
                            ? t('courseRegistration.courses.emptyBatch')
                            : t('common.noData')
                        }}
                      </p>
                      <p v-if="batchTotal === 0" class="empty-desc">
                        {{ t('courseRegistration.courses.emptyBatchHint') }}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="totalCount > 0" class="pagination-bar">
            <TablePagination
              v-model="currentPage"
              v-model:page-size="pageSize"
              :total="totalCount"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.close') }}</button>
    </template>
  </ApplicationDetailDrawer>

  <CourseSectionsModal
    :visible="!!sectionsCourse"
    :course="sectionsCourse"
    @close="sectionsCourse = null"
  />

  <CourseLibraryImportModal
    :visible="importVisible"
    :batch-name="batchName"
    :imported-codes="importedCodes"
    @close="importVisible = false"
    @confirm="handleImportConfirm"
  />

  <BatchCourseOptionalSettingsModal
    :visible="optionalSettingsVisible"
    :courses="selectedCourses"
    @close="optionalSettingsVisible = false"
    @saved="handleOptionalSaved"
  />

  <BatchCourseCapacitySettingsModal
    :visible="capacitySettingsVisible"
    :courses="selectedCourses"
    @close="capacitySettingsVisible = false"
    @saved="handleCapacitySaved"
  />

  <BatchCourseProgrammeScopeModal
    :visible="programmeScopeVisible"
    :courses="selectedCourses"
    @close="programmeScopeVisible = false"
    @saved="handleProgrammeScopeSaved"
  />
</template>

<style scoped>
.batch-courses-drawer :deep(.drawer-panel) {
  width: min(1200px, 96vw);
}

.batch-courses-drawer :deep(.drawer-scroll) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.batch-courses-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  gap: 0;
}

.batch-courses-body .search-bar {
  flex-shrink: 0;
  margin: 0;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  background: #fff;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: help;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #9ca3af;
  font-size: 10px;
  line-height: 1;
  color: #6b7280;
}

.btn:disabled,
.btn:disabled:hover {
  opacity: 0.5;
  cursor: not-allowed;
}

.drawer-meta {
  font-size: 13px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fff;
}

.pagination-bar {
  flex-shrink: 0;
  padding: 8px 16px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.data-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f9fafb;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.col-prereq {
  font-size: 12px;
  color: #6b7280;
}

.col-check {
  width: 40px;
  min-width: 40px;
  text-align: center;
}

.col-no {
  width: 56px;
  min-width: 56px;
}

.col-code {
  min-width: 100px;
}

.col-name {
  min-width: 180px;
}

.col-sticky-left {
  position: sticky;
  z-index: 2;
  background: #fff;
}

.data-table thead .col-sticky-left {
  z-index: 4;
  background: #f9fafb;
}

.data-table tbody tr:hover .col-sticky-left {
  background: #fafafa;
}

.col-sticky-check {
  left: 0;
}

.col-sticky-no {
  left: 40px;
}

.col-sticky-code {
  left: 96px;
}

.col-sticky-name {
  left: 196px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.1);
}

/* 进行中隐藏勾选列后，冻结列贴左对齐原勾选位置 */
.data-table.no-selection .col-sticky-no {
  left: 0;
}

.data-table.no-selection .col-sticky-code {
  left: 56px;
}

.data-table.no-selection .col-sticky-name {
  left: 156px;
}

.empty-cell {
  text-align: center;
  padding: 48px 16px !important;
  border-bottom: none;
}

.empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-title {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.empty-desc {
  margin: 0 0 8px;
  font-size: 13px;
  color: #9ca3af;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-default:hover {
  border-color: #9ca3af;
  color: #111827;
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
