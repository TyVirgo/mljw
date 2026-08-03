<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import TablePagination from '../common/TablePagination.vue'
import { initialStudents } from '../../data/students.js'

const props = defineProps({
  visible: Boolean,
  students: { type: Array, default: () => initialStudents },
  selectedStudentId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr } = useAppI18n()

const pickedStudentId = ref('')
const searchDraft = ref('')
const searchApplied = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const normalizedStudents = computed(() =>
  props.students.map((item) => {
    const enrollment = item.enrollment ?? {}
    const basicInfo = item.basicInfo ?? {}
    return {
      studentId: item.studentId ?? basicInfo.studentId ?? '',
      name: item.name ?? basicInfo.fullName ?? '',
      nameCn: item.nameCn ?? basicInfo.chineseName ?? '',
      // 国籍：学籍 basicInfo，供选择列表展示（中文经 tr 映射）
      nationality: basicInfo.nationality ?? item.nationality ?? '',
      programme: enrollment.programme ?? item.programme ?? '',
      faculty: enrollment.faculty ?? item.faculty ?? '',
      raw: item,
    }
  }),
)

/**
 * 单元格展示：空值用 —；有值原样返回（国籍另走 formatNationality）
 * @param {unknown} value 单元格原始值
 */
function displayCell(value) {
  const text = String(value ?? '').trim()
  return text || '—'
}

/**
 * 国籍展示：中文界面用 tr 映射国家中文名，英文界面保留英文国名
 * @param {string} nationality 学籍存储的英文国名
 */
function formatNationality(nationality) {
  const text = String(nationality ?? '').trim()
  if (!text) return '—'
  return tr(text)
}

function matchKeyword(item, keyword) {
  if (!keyword) return true
  const q = keyword.trim().toLowerCase()
  return (
    String(item.studentId || '').toLowerCase().includes(q) ||
    String(item.name || '').toLowerCase().includes(q) ||
    String(item.nameCn || '').toLowerCase().includes(q)
  )
}

const filteredStudents = computed(() =>
  normalizedStudents.value.filter((item) => matchKeyword(item, searchApplied.value)),
)

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

watch(
  () => [props.visible, props.selectedStudentId],
  () => {
    if (!props.visible) return
    pickedStudentId.value = props.selectedStudentId || ''
    searchDraft.value = ''
    searchApplied.value = ''
    currentPage.value = 1
    pageSize.value = 10
  },
)

watch(filteredStudents, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

function handleSearch() {
  searchApplied.value = searchDraft.value
  currentPage.value = 1
}

function handleReset() {
  searchDraft.value = ''
  searchApplied.value = ''
  currentPage.value = 1
}

function selectRow(studentId) {
  pickedStudentId.value = studentId
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function handleConfirm() {
  if (!pickedStudentId.value) return
  const row = normalizedStudents.value.find((item) => item.studentId === pickedStudentId.value)
  if (!row) return
  emit('confirm', row.raw)
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ t('studentSelect.title') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="search-bar">
            <div class="search-row">
              <div class="search-field">
                <label class="search-label">{{ t('studentSelect.searchLabel') }}</label>
                <input
                  v-model="searchDraft"
                  type="text"
                  class="search-input"
                  :placeholder="t('studentSelect.searchPlaceholder')"
                  @keyup.enter="handleSearch"
                />
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

          <div class="table-section">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-radio" />
                    <th class="col-no">{{ t('common.serialNo') }}</th>
                    <th>{{ t('studentSelect.columns.studentId') }}</th>
                    <th>{{ t('studentSelect.columns.name') }}</th>
                    <!-- 国籍：置于姓名与专业之间，四类异动共用 -->
                    <th>{{ t('studentSelect.columns.nationality') }}</th>
                    <th>{{ t('studentSelect.columns.programme') }}</th>
                    <!-- 专业层次：四类异动共用弹框，策略 B 统一展示「本科」 -->
                    <th>{{ t('studentSelect.columns.programmeLevel') }}</th>
                    <th>{{ t('studentSelect.columns.faculty') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!paginatedStudents.length">
                    <td colspan="8" class="empty-cell">{{ t('common.noData') }}</td>
                  </tr>
                  <tr
                    v-for="(item, index) in paginatedStudents"
                    :key="item.studentId"
                    :class="{ selected: pickedStudentId === item.studentId }"
                    @click="selectRow(item.studentId)"
                  >
                    <td class="col-radio">
                      <input
                        v-model="pickedStudentId"
                        type="radio"
                        :value="item.studentId"
                        @click.stop
                      />
                    </td>
                    <td class="col-no">{{ getRowNumber(index) }}</td>
                    <td>{{ displayCell(item.studentId) }}</td>
                    <td>{{ displayCell(item.name) }}</td>
                    <td>{{ formatNationality(item.nationality) }}</td>
                    <td class="col-programme">{{ displayCell(item.programme) }}</td>
                    <!-- 不读 enrollment.programmeLevel，固定展示默认「本科」文案 -->
                    <td class="col-programme-level">{{ t('studentSelect.defaultProgrammeLevel') }}</td>
                    <td class="col-faculty">{{ displayCell(item.faculty) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-pagination">
            <TablePagination
              :total="filteredStudents.length"
              v-model="currentPage"
              v-model:page-size="pageSize"
            />
          </div>
          <div class="footer-actions">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!pickedStudentId"
              @click="handleConfirm"
            >
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: min(960px, calc(100vw - 48px));
  min-height: 520px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  line-height: 1;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 28px 16px;
  overflow: hidden;
}

.search-bar {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-width: 0;
}

.search-field {
  display: grid;
  grid-template-columns: 100px 280px;
  gap: 8px;
  align-items: center;
}

.search-label {
  font-size: 13px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.search-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-wrap {
  flex: 1;
  min-height: 280px;
  /* 内容超出时出现横向/纵向滚动条，便于看全长专业名等字段 */
  overflow: auto;
  border: 1px solid #f3f4f6;
  border-radius: 4px;
}

.data-table {
  width: 100%;
  /* 保证列完整展示时总宽可撑开容器，从而触发横向滚动 */
  min-width: 1080px;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  /* 不换行、不截断，避免省略号藏字 */
  white-space: nowrap;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
}

.data-table tbody tr {
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tbody tr.selected {
  background: #eff6ff;
}

.col-radio {
  width: 48px;
}

.col-no {
  width: 56px;
}

/* 原 max-width + ellipsis 会阻止表格撑宽，改为不截断以便横向滑动看全
.col-programme {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
*/

.col-programme-level {
  white-space: nowrap;
}

/* 原学院列截断样式同上原因注释保留
.col-faculty {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
*/

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 28px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.footer-pagination {
  flex: 1;
  min-width: 0;
}

.footer-pagination :deep(.table-pagination) {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.footer-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d9d9d9;
}
</style>
