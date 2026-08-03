<script setup>
/**
 * 学生维度「新增」代选弹窗：一次一名学生 + 当前批次未满员教学分组
 */
import { ref, computed, watch } from 'vue'
import TablePagination from '../common/TablePagination.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import { getBatchById } from '../../data/courseRegistration/registrationBatches.js'
import {
  listTargetCourseSectionOptions,
  listAdminAddStudentCandidates,
  getAdminAddStudentFilterOptions,
  filterAdminAddStudentCandidates,
  addAdminStudentRegistrations,
} from '../../data/courseRegistration/registrationResult.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  /** 是否显示弹窗 */
  visible: Boolean,
  /** 页顶当前选课批次，限制可选教学分组范围 */
  batchId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'success'])

const { t } = useAppI18n()

const filtersExpanded = ref(false)
const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
/** 单选学号 */
const selectedStudentId = ref('')
/** 目标课×分组 value：courseId::sectionId */
const targetValue = ref('')
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

/** 当前批次下未满员教学分组选项（批次取页顶只读） */
const sectionOptions = computed(() =>
  listTargetCourseSectionOptions('', {
    batchId: props.batchId || '',
    onlyAvailable: true,
  }),
)

/** 页顶批次只读展示名 */
const batchDisplayName = computed(() => {
  const id = String(props.batchId || '').trim()
  if (!id) return '—'
  const batch = getBatchById(id)
  return batch?.name || id
})

watch(
  () => [props.visible, props.batchId],
  ([visible]) => {
    if (!visible) return
    searchForm.value = emptySearch()
    appliedSearch.value = emptySearch()
    selectedStudentId.value = ''
    targetValue.value = ''
    currentPage.value = 1
    pageSize.value = 10
    filtersExpanded.value = false
    errorKey.value = ''
  },
)

/** 批次变更时清空已选课程班（页顶切换后重新打开也会走 reset） */
watch(
  () => props.batchId,
  () => {
    targetValue.value = ''
  },
)

/** 空搜索条件 */
function emptySearch() {
  return {
    studentId: '',
    studentName: '',
    faculty: '',
  }
}

/**
 * 点击遮罩关闭
 * @param {MouseEvent} event
 */
function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

/** 应用搜索 */
function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
}

/** 重置搜索 */
function handleReset() {
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

/**
 * 单选学生
 * @param {string} studentId
 */
function selectStudent(studentId) {
  selectedStudentId.value = studentId
}

/**
 * 性别文案
 * @param {string} gender
 */
function genderLabel(gender) {
  if (gender === 'M') return t('courseRegistration.result.genderMale')
  if (gender === 'F') return t('courseRegistration.result.genderFemale')
  return gender || '—'
}

/** 确认代选提交 */
function handleConfirm() {
  errorKey.value = ''
  if (!selectedStudentId.value) {
    errorKey.value = 'courseRegistration.result.addStudentOneRequired'
    return
  }
  if (!targetValue.value) {
    errorKey.value = 'courseRegistration.result.addSectionRequired'
    return
  }
  const result = addAdminStudentRegistrations({
    targetValue: targetValue.value,
    studentIds: [selectedStudentId.value],
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
          <h2 class="add-reg-title">{{ t('courseRegistration.result.addCourseForStudentTitle') }}</h2>
          <button type="button" class="add-reg-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="add-reg-body">
          <!-- 先确认页顶批次（只读），再选该批次下课×分组 -->
          <div class="target-block">
            <div class="search-item target-item">
              <label>{{ t('courseRegistration.batch.name') }}</label>
              <div class="readonly-field" :title="batchDisplayName">{{ batchDisplayName }}</div>
            </div>
            <div class="search-item target-item">
              <label>{{ t('courseRegistration.result.targetSection') }}</label>
              <select
                v-model="targetValue"
                class="search-select"
                :disabled="!batchId || !sectionOptions.length"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in sectionOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <p v-if="batchId && !sectionOptions.length" class="field-hint">
                {{ t('courseRegistration.result.addNoAvailableSection') }}
              </p>
            </div>
          </div>

          <div class="search-bar add-reg-search">
            <div class="search-row">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ t('courseRegistration.monitor.studentId') }}</label>
                  <input
                    v-model="searchForm.studentId"
                    type="text"
                    class="search-input"
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.monitor.studentName') }}</label>
                  <input
                    v-model="searchForm.studentName"
                    type="text"
                    class="search-input"
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
                <button type="button" class="link-btn" @click="filtersExpanded = !filtersExpanded">
                  {{
                    filtersExpanded
                      ? t('courseRegistration.result.collapseFilters')
                      : t('courseRegistration.result.expandFilters')
                  }}
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

          <p class="field-hint">{{ t('courseRegistration.result.addStudentOneHint') }}</p>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check"></th>
                  <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                  <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                  <th>{{ t('courseRegistration.result.gender') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeFaculty') }}</th>
                  <th>{{ t('courseRegistration.monitor.intake') }}</th>
                  <th>{{ t('courseRegistration.result.studentCategory') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in paginatedRows"
                  :key="row.studentId"
                  class="row-clickable"
                  @click="selectStudent(row.studentId)"
                >
                  <td class="col-check">
                    <input
                      type="radio"
                      name="admin-add-student"
                      :checked="selectedStudentId === row.studentId"
                      @change="selectStudent(row.studentId)"
                      @click.stop
                    />
                  </td>
                  <td>{{ row.studentId }}</td>
                  <td>{{ row.studentName }}</td>
                  <td>{{ genderLabel(row.gender) }}</td>
                  <td>{{ row.faculty }}</td>
                  <td>{{ formatIntakeBatch(row.intake) }}</td>
                  <td>{{ row.studentCategory }}</td>
                </tr>
                <tr v-if="!paginatedRows.length">
                  <td colspan="7" class="empty-cell">{{ t('common.noData') }}</td>
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
  width: min(960px, 96vw);
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

.form-field label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.target-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.target-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  max-width: none;
  width: 100%;
}

.target-item label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.target-item .search-select {
  width: 100%;
  max-width: none;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #111827;
}

.target-item .search-select:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.readonly-field {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.field-error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}

.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
  z-index: 1;
}

.col-check {
  width: 48px;
  text-align: center;
}

.row-clickable {
  cursor: pointer;
}

.row-clickable:hover {
  background: #f8fafc;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px 10px !important;
}

.add-reg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

/* 页脚按钮：不在 search-bar 内，需自带样式 */
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
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
}
</style>
