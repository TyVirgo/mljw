<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import TablePagination from '../common/TablePagination.vue'
import AddStudentRegistrationModal from './AddStudentRegistrationModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import { listAdminAddStudentCandidates } from '../../data/courseRegistration/registrationResult.js'
import {
  getVolunteerSectionState,
  getDraftVolunteers,
  saveVolunteerCourseRoster,
  markVolunteerDraft,
  discardVolunteerCourseDraft,
  buildVolunteerDraftAfterAdd,
  computeDraftDirty,
  isVolunteerPageReadonly,
  isVolunteerDraftFull,
  listStudentIdsOnCourse,
  usesSelectedRoster,
} from '../../data/courseRegistration/preselectVolunteerConfirm.js'
import { isGraduateStudent } from '../../data/courseRegistration/studentAudience.js'

const props = defineProps({
  visible: Boolean,
  courseId: { type: String, default: '' },
  sectionId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const draftVolunteers = ref([])
const searchForm = ref({ studentId: '', studentName: '' })
const appliedSearch = ref({ studentId: '', studentName: '' })
const currentPage = ref(1)
const pageSize = ref(50)
const saveError = ref('')
const addModalVisible = ref(false)
const removeConfirmVisible = ref(false)
/** 待移出学号列表（单行 1 个，批量多个） */
const pendingRemoveStudentIds = ref([])
/** 跨页累加勾选的学号 */
const selectedStudentIds = ref([])
// 原单行移出：pendingRemoveStudentId

const sectionState = computed(() => getVolunteerSectionState(props.courseId, props.sectionId))
/** 按所属批次判断只读（已最终确认则不可再调） */
const readonly = computed(() => isVolunteerPageReadonly(sectionState.value?.batchId))

const title = computed(() => t('courseRegistration.result.volunteerRosterTitle'))

const subtitle = computed(() => {
  const row = sectionState.value
  if (!row) return ''
  const group = t('courseRegistration.courses.sectionNameDisplay', { code: row.sectionCode })
  return `${row.courseCode} ${row.courseName} · ${group}`
})

const isDirty = computed(() =>
  computeDraftDirty(props.courseId, props.sectionId, draftVolunteers.value),
)
const isFull = computed(() =>
  isVolunteerDraftFull(props.courseId, props.sectionId, draftVolunteers.value),
)
const listCap = computed(() => {
  const row = sectionState.value
  if (!row) return 0
  if (usesSelectedRoster(row)) return Number(row.seniorCapacity) || Number(row.capacity) || 0
  return Number(row.capacity) || 0
})
const capacityLabel = computed(() => `${draftVolunteers.value.length}/${listCap.value}`)
const emptyColspan = computed(() => {
  const extra = readonly.value ? 0 : 2
  return 8 + extra
})

const filteredVolunteers = computed(() => {
  const sid = appliedSearch.value.studentId.trim().toLowerCase()
  const sname = appliedSearch.value.studentName.trim().toLowerCase()
  return draftVolunteers.value.filter((r) => {
    if (sid && !r.studentId.toLowerCase().includes(sid)) return false
    if (sname && !r.studentName.toLowerCase().includes(sname)) return false
    return true
  })
})

const totalCount = computed(() => filteredVolunteers.value.length)

const paginatedVolunteers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredVolunteers.value.slice(start, start + pageSize.value)
})

const hasSelection = computed(() => selectedStudentIds.value.length > 0)
const allPageSelected = computed(() => {
  if (!paginatedVolunteers.value.length || readonly.value) return false
  return paginatedVolunteers.value.every((row) => selectedStudentIds.value.includes(row.studentId))
})

const removeConfirmMessage = computed(() => {
  const count = pendingRemoveStudentIds.value.length
  if (count <= 1) return t('courseRegistration.result.volunteerRemoveConfirm')
  return t('courseRegistration.result.volunteerBatchRemoveConfirm', { count })
})

const excludedStudentIds = computed(() => {
  if (!props.courseId) return []
  // 同课任一分组（含当前草稿）均不可再选
  const onCourse = listStudentIdsOnCourse(props.courseId, { includeDraft: true })
  const draftIds = draftVolunteers.value.map((v) => v.studentId)
  return [...new Set([...onCourse, ...draftIds])]
})

watch(
  () => [props.visible, props.courseId, props.sectionId],
  () => {
    if (!props.visible || !props.courseId || !props.sectionId) return
    draftVolunteers.value = getDraftVolunteers(props.courseId, props.sectionId)
    searchForm.value = { studentId: '', studentName: '' }
    appliedSearch.value = { studentId: '', studentName: '' }
    currentPage.value = 1
    saveError.value = ''
    addModalVisible.value = false
    removeConfirmVisible.value = false
    pendingRemoveStudentIds.value = []
    selectedStudentIds.value = []
  },
)

/**
 * GE/ME 抽签名单：选上浅绿、未选上无底色
 * @param {string} studentId 学号
 * @returns {''|'row-within-cap'|'row-over-cap'}
 */
function volunteerRowTone(studentId) {
  const row = draftVolunteers.value.find((v) => v.studentId === studentId)
  if (!row) return ''
  if (usesSelectedRoster(sectionState.value)) return row.selected ? 'row-within-cap' : ''
  const cap = sectionState.value?.capacity || 0
  const idx = draftVolunteers.value.findIndex((v) => v.studentId === studentId)
  if (idx < 0) return ''
  return idx < cap ? 'row-within-cap' : 'row-over-cap'
}

function graduateYesNo(row) {
  const yes = row?.isGraduate || isGraduateStudent(row?.studentId)
  return yes ? t('common.yes') : t('common.no')
}

function handleSearch() {
  appliedSearch.value = {
    studentId: searchForm.value.studentId,
    studentName: searchForm.value.studentName,
  }
  currentPage.value = 1
}

function handleReset() {
  searchForm.value = { studentId: '', studentName: '' }
  appliedSearch.value = { studentId: '', studentName: '' }
  currentPage.value = 1
}

watch(
  draftVolunteers,
  () => {
    if (!props.visible || !props.courseId || !props.sectionId || readonly.value) return
    markVolunteerDraft(props.courseId, props.sectionId, draftVolunteers.value)
  },
  { deep: true },
)

function requestAddStudents() {
  if (readonly.value) return
  saveError.value = ''
  if (isFull.value) {
    saveError.value = t('courseRegistration.result.volunteerFullHint', {
      count: listCap.value,
      cap: listCap.value,
    })
    return
  }
  addModalVisible.value = true
}

function handleAddSuccess(payload) {
  const studentIds = payload?.studentIds || []
  const candidates = listAdminAddStudentCandidates()
  const profiles = studentIds
    .map((id) => candidates.find((s) => s.studentId === id))
    .filter(Boolean)
  const result = buildVolunteerDraftAfterAdd(
    props.courseId,
    props.sectionId,
    draftVolunteers.value,
    profiles,
  )
  if (!result.ok) {
    saveError.value = t(result.errorKey, result.errorParams || {})
    return
  }
  draftVolunteers.value = result.draft
  saveError.value = ''
}

function requestRemove(studentId) {
  if (readonly.value) return
  pendingRemoveStudentIds.value = studentId ? [studentId] : []
  removeConfirmVisible.value = true
}

/**
 * 请求批量移出：须已勾选
 */
function requestBatchRemove() {
  if (readonly.value || !selectedStudentIds.value.length) return
  pendingRemoveStudentIds.value = [...selectedStudentIds.value]
  removeConfirmVisible.value = true
}

/** 确认移出（单行或批量） */
function confirmRemove() {
  const ids = new Set(pendingRemoveStudentIds.value)
  removeConfirmVisible.value = false
  pendingRemoveStudentIds.value = []
  if (!ids.size) return
  draftVolunteers.value = draftVolunteers.value.filter((v) => !ids.has(v.studentId))
  selectedStudentIds.value = selectedStudentIds.value.filter((id) => !ids.has(id))
  saveError.value = ''
}

/** 取消移出确认 */
function cancelRemoveConfirm() {
  removeConfirmVisible.value = false
  pendingRemoveStudentIds.value = []
}

/**
 * 当前页全选/取消
 * @param {Event} event
 */
function toggleSelectAll(event) {
  const pageIds = paginatedVolunteers.value.map((row) => row.studentId)
  if (event.target.checked) {
    selectedStudentIds.value = [...new Set([...selectedStudentIds.value, ...pageIds])]
  } else {
    selectedStudentIds.value = selectedStudentIds.value.filter((id) => !pageIds.includes(id))
  }
}

/**
 * 切换单行勾选
 * @param {string} studentId
 */
function toggleSelect(studentId) {
  const index = selectedStudentIds.value.indexOf(studentId)
  if (index === -1) selectedStudentIds.value.push(studentId)
  else selectedStudentIds.value.splice(index, 1)
}

function handleSave() {
  if (readonly.value) return
  saveError.value = ''
  const result = saveVolunteerCourseRoster(props.courseId, props.sectionId, draftVolunteers.value)
  if (!result.ok) {
    saveError.value = t(result.errorKey, result.errorParams || {})
    return
  }
  emit('saved')
}

/** 关闭未保存：丢弃草稿，不写已保存名单 */
function handleClose() {
  if (!readonly.value && props.courseId && props.sectionId) {
    discardVolunteerCourseDraft(props.courseId, props.sectionId)
  }
  emit('close')
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="volunteer-roster-drawer"
    @close="handleClose"
  >
    <div class="volunteer-roster">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
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
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.studentName') }}</label>
              <input
                v-model="searchForm.studentName"
                type="text"
                class="search-input"
                :placeholder="t('common.pleaseInput')"
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
        <div v-if="!readonly" class="toolbar-actions">
          <button type="button" class="btn btn-primary" @click="requestAddStudents">
            {{ t('courseRegistration.result.addStudentRowAction') }}
          </button>
          <button
            type="button"
            class="btn btn-default"
            :disabled="!hasSelection"
            @click="requestBatchRemove"
          >
            {{ t('courseRegistration.result.volunteerBatchRemove') }}
          </button>
        </div>
        <span v-else class="toolbar-spacer" />
        <p class="meta">
          {{ t('courseRegistration.result.volunteerCapacityLabel') }}：{{ capacityLabel }}
          <span v-if="isDirty" class="dirty-tag">{{ t('courseRegistration.result.volunteerDirty') }}</span>
        </p>
      </div>
      <p v-if="saveError" class="error-text">{{ saveError }}</p>
      <p v-if="readonly" class="hint-text">{{ t('courseRegistration.result.volunteerReadonly') }}</p>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th v-if="!readonly" class="col-check">
                  <input
                    type="checkbox"
                    :checked="allPageSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ t('courseRegistration.monitor.studentId') }}</th>
                <th>{{ t('courseRegistration.monitor.studentName') }}</th>
                <th>{{ t('courseRegistration.monitor.programme') }}</th>
                <th>{{ t('courseRegistration.monitor.intake') }}</th>
                <th>{{ t('courseRegistration.result.volunteerRelativeSemester') }}</th>
                <th>{{ t('courseRegistration.result.volunteerSubmittedAt') }}</th>
                <th>
                  <span
                    class="th-with-tip"
                    :title="t('courseRegistration.result.volunteerIsGraduateTip')"
                  >
                    {{ t('courseRegistration.result.volunteerIsGraduate') }}
                    <span class="tip-icon" aria-hidden="true">?</span>
                  </span>
                </th>
                <th v-if="!readonly">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in paginatedVolunteers"
                :key="row.id"
                :class="volunteerRowTone(row.studentId)"
              >
                <td v-if="!readonly" class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedStudentIds.includes(row.studentId)"
                    @change="toggleSelect(row.studentId)"
                  />
                </td>
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.studentId }}</td>
                <td>{{ row.studentName }}</td>
                <td>{{ row.programme }}</td>
                <td>{{ formatIntakeBatch(row.intake) }}</td>
                <td>{{ row.relativeSemester }}</td>
                <td>{{ row.submittedAt }}</td>
                <td>{{ graduateYesNo(row) }}</td>
                <td v-if="!readonly" class="col-actions">
                  <button type="button" class="link-btn" @click="requestRemove(row.studentId)">
                    {{ t('courseRegistration.result.volunteerRemove') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedVolunteers.length">
                <td :colspan="emptyColspan" class="empty-cell">{{ t('common.noData') }}</td>
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

    <template #footer>
      <button type="button" class="btn btn-default" @click="handleClose">
        {{ t('common.close') }}
      </button>
      <button
        v-if="!readonly"
        type="button"
        class="btn btn-primary"
        :disabled="!isDirty"
        @click="handleSave"
      >
        {{ t('common.save') }}
      </button>
    </template>
  </ApplicationDetailDrawer>

  <AddStudentRegistrationModal
    :visible="addModalVisible"
    :course-id="courseId"
    volunteer-mode
    :excluded-student-ids="excludedStudentIds"
    @close="addModalVisible = false"
    @success="handleAddSuccess"
  />

  <ConfirmDialog
    :visible="removeConfirmVisible"
    :title="t('courseRegistration.result.volunteerRemove')"
    :message="removeConfirmMessage"
    :confirm-text="t('courseRegistration.result.volunteerRemove')"
    confirm-variant="danger"
    @confirm="confirmRemove"
    @cancel="cancelRemoveConfirm"
  />
</template>

<style scoped>
.volunteer-roster-drawer :deep(.drawer-scroll) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.volunteer-roster {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  gap: 0;
}

.search-bar {
  flex-shrink: 0;
  margin: 0;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  flex: 1;
}

.search-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.search-item label {
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.search-input {
  width: 180px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-spacer {
  flex: 0;
}

.col-check {
  width: 44px;
  min-width: 44px;
  text-align: center;
}

.meta {
  margin: 0 0 0 auto;
  font-size: 13px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dirty-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
}

.error-text,
.hint-text {
  flex-shrink: 0;
  margin: 0;
  padding: 8px 16px 0;
  font-size: 13px;
}

.error-text {
  color: #dc2626;
}

.hint-text {
  color: #6b7280;
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
  overflow-y: auto;
  overflow-x: hidden;
  background: #fff;
}

.pagination-bar {
  flex-shrink: 0;
  padding: 8px 16px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.data-table {
  width: 100%;
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
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
  z-index: 1;
}

/* GE 选上 / ME 容量内：浅绿；ME 容量外：浅黄；GE 未选上无底色 */
.row-within-cap td {
  background: #ecfdf5;
}

.row-over-cap td {
  background: #fffbeb;
}

.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
  cursor: help;
}

.col-actions {
  white-space: nowrap;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px !important;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.link-btn:hover {
  text-decoration: underline;
}

.btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
