<script setup>
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import {
  listTargetCourseSectionOptions,
  listAdminAddStudentCandidates,
  getAdminAddStudentFilterOptions,
  filterAdminAddStudentCandidates,
  addAdminStudentRegistrations,
} from '../../data/courseRegistration/registrationResult.js'
import { addRoundCourseStudents } from '../../data/courseRegistration/registrationResultByRound.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  visible: Boolean,
  /** 从按课程行传入；提交时自动取该课第一教学分组 */
  courseId: { type: String, default: '' },
  /** 有值时写入该轮次本轮名单，而非终态按课程池 */
  roundKey: { type: String, default: '' },
  /** 第一轮志愿名单添加：仅回传所选学号，由调用方写入草稿 */
  volunteerMode: { type: Boolean, default: false },
  /** 不可再勾选的学号（如已在同课志愿名单） */
  excludedStudentIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'success'])

const { t } = useAppI18n()

const filtersExpanded = ref(false)
const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const errorKey = ref('')

const filterOptions = computed(() => getAdminAddStudentFilterOptions())

const allCandidates = computed(() => listAdminAddStudentCandidates())
const filteredRows = computed(() =>
  filterAdminAddStudentCandidates(allCandidates.value, appliedSearch.value),
)
const totalCount = computed(() => filteredRows.value.length)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const pageSelectableIds = computed(() =>
  paginatedRows.value.filter((r) => !isExcluded(r.studentId)).map((r) => r.studentId),
)
const allPageSelected = computed(() => {
  if (!pageSelectableIds.value.length) return false
  return pageSelectableIds.value.every((id) => selectedIds.value.includes(id))
})

const excludedSet = computed(() => new Set((props.excludedStudentIds || []).map(String)))

function isExcluded(studentId) {
  return excludedSet.value.has(String(studentId))
}

watch(
  () => [props.visible, props.courseId, props.excludedStudentIds],
  ([visible]) => {
    if (!visible) return
    searchForm.value = emptySearch()
    appliedSearch.value = emptySearch()
    selectedIds.value = []
    currentPage.value = 1
    pageSize.value = 10
    filtersExpanded.value = false
    errorKey.value = ''
  },
)

function emptySearch() {
  return {
    studentId: '',
    studentName: '',
    faculty: '',
  }
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function toggleSelectAllPage() {
  if (allPageSelected.value) {
    const pageSet = new Set(pageSelectableIds.value)
    selectedIds.value = selectedIds.value.filter((id) => !pageSet.has(id))
    return
  }
  const merged = new Set([...selectedIds.value, ...pageSelectableIds.value])
  selectedIds.value = [...merged]
}

function toggleRow(studentId) {
  if (isExcluded(studentId)) return
  if (selectedIds.value.includes(studentId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== studentId)
  } else {
    selectedIds.value = [...selectedIds.value, studentId]
  }
}

function genderLabel(gender) {
  if (gender === 'M') return t('courseRegistration.result.genderMale')
  if (gender === 'F') return t('courseRegistration.result.genderFemale')
  return gender || '—'
}

function resolveTargetValue() {
  const options = listTargetCourseSectionOptions(props.courseId)
  return options[0]?.value || ''
}

function handleConfirm() {
  errorKey.value = ''
  if (!selectedIds.value.length) {
    errorKey.value = 'courseRegistration.result.addStudentRequired'
    return
  }
  if (props.volunteerMode) {
    emit('success', { studentIds: [...selectedIds.value] })
    emit('close')
    return
  }
  if (props.roundKey && props.courseId) {
    const result = addRoundCourseStudents(props.roundKey, props.courseId, selectedIds.value)
    if (!result.ok) {
      errorKey.value = result.errorKey
      return
    }
    emit('success', result)
    emit('close')
    return
  }
  const targetValue = resolveTargetValue()
  if (!targetValue) {
    errorKey.value = 'courseRegistration.result.addTargetRequired'
    return
  }
  const result = addAdminStudentRegistrations({
    targetValue,
    studentIds: selectedIds.value,
  })
  if (!result.ok) {
    errorKey.value = result.errorKey
    return
  }
  emit('success', result)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="add-reg-overlay" @click="handleOverlayClick">
      <div class="add-reg-panel" role="dialog" aria-modal="true">
        <div class="add-reg-header">
          <h2 class="add-reg-title">{{ t('courseRegistration.result.addStudentTitle') }}</h2>
          <button type="button" class="add-reg-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="add-reg-body">
          <div class="search-bar add-reg-search">
            <div class="search-row">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                  <input v-model="searchForm.studentId" type="text" class="search-input" @keyup.enter="handleSearch" />
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                  <input v-model="searchForm.studentName" type="text" class="search-input" @keyup.enter="handleSearch" />
                </div>
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
                <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
                <button type="button" class="link-btn" @click="filtersExpanded = !filtersExpanded">
                  {{ filtersExpanded ? t('courseRegistration.result.collapseFilters') : t('courseRegistration.result.expandFilters') }}
                </button>
              </div>
            </div>
            <div v-if="filtersExpanded" class="search-row search-row-secondary">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ t('courseRegistration.batch.scopeFaculty') }}</label>
                  <select v-model="searchForm.faculty" class="search-select">
                    <option value="">{{ t('common.pleaseSelect') }}</option>
                    <option v-for="opt in filterOptions.faculties" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      :disabled="!pageSelectableIds.length"
                      @change="toggleSelectAllPage"
                    />
                  </th>
                  <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                  <th>{{ t('courseRegistration.result.gender') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeFaculty') }}</th>
                  <th>{{ t('courseRegistration.monitor.intake') }}</th>
                  <th>{{ t('courseRegistration.result.volunteerRelativeSemester') }}</th>
                  <th>{{ t('courseRegistration.result.studentCategory') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.studentId"
                  :class="{ 'row-excluded': isExcluded(row.studentId) }"
                >
                  <td class="col-check">
                    <input
                      type="checkbox"
                      :checked="selectedIds.includes(row.studentId)"
                      :disabled="isExcluded(row.studentId)"
                      :title="isExcluded(row.studentId) ? t('courseRegistration.result.volunteerAlreadyInRoster') : ''"
                      @change="toggleRow(row.studentId)"
                    />
                  </td>
                  <td>{{ row.studentId }}</td>
                  <td>{{ row.studentName }}</td>
                  <td>{{ genderLabel(row.gender) }}</td>
                  <td>{{ row.faculty }}</td>
                  <td>{{ formatIntakeBatch(row.intake) }}</td>
                  <td>{{ row.relativeSemester ?? '—' }}</td>
                  <td>{{ row.studentCategory }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-model="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
          />

          <p v-if="errorKey" class="field-error">{{ t(errorKey) }}</p>
          <p v-if="selectedIds.length" class="selected-hint">
            {{ t('courseRegistration.result.selectedStudents', { count: selectedIds.length }) }}
          </p>
        </div>

        <div class="add-reg-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.add-reg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 24px;
}

.add-reg-panel {
  width: min(1100px, 96vw);
  max-height: min(92vh, 860px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.add-reg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.add-reg-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.add-reg-close {
  appearance: none;
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}

.add-reg-body {
  padding: 16px 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.req {
  color: #ef4444;
}

.form-input,
.search-input,
.search-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input.has-error {
  border-color: #f87171;
}

.add-reg-search {
  margin: 0;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.search-row-secondary {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: auto;
  max-height: 360px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  z-index: 1;
}

.col-check {
  width: 36px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 28px 12px !important;
}

.row-excluded {
  color: #9ca3af;
  background: #f9fafb;
}

.row-excluded input:disabled {
  cursor: not-allowed;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
}

.selected-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.add-reg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
}
</style>
