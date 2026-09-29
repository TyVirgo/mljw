<script setup>
import { ref, computed } from 'vue'
import ExportModal from '../../components/common/ExportModal.vue'
import TablePagination from '../../components/common/TablePagination.vue'
import SupplementEntryDrawer from '../../components/courseRegistration/SupplementEntryDrawer.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import MonitorRemindModal from '../../components/courseRegistration/MonitorRemindModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  supplementListQueue,
  filterSupplementList,
  removeSupplementEntry,
  sendSupplementInvite,
  reopenSupplementInvite,
  getSupplementDoorStatus,
  formatSupplementInviteCountdown,
  formatPermissionSummary,
  formatWhitelistAddedAt,
  normalizeWhitelistEntry,
  buildWhitelistNotifyDraft,
  buildWhitelistReopenDraft,
} from '../../data/courseRegistration/supplementListQueue.js'
import { supplementExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatSupplementExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const searchForm = ref({ programme: '', keyword: '' })
const appliedSearch = ref({ programme: '', keyword: '' })
const currentPage = ref(1)
const pageSize = ref(20)
const drawerVisible = ref(false)
const detailEntry = ref(null)
const exportModalVisible = ref(false)
const emailMockBanner = ref('')
/** @type {import('vue').Ref<'notify' | 'reopen' | null>} */
const notifyMode = ref(null)
const notifyRow = ref(null)

const notifyTitleKey = computed(() =>
  notifyMode.value === 'reopen'
    ? 'courseRegistration.whitelist.reopenModalTitle'
    : 'courseRegistration.whitelist.notifyModalTitle',
)
const notifyConfirmKey = computed(() =>
  notifyMode.value === 'reopen'
    ? 'courseRegistration.whitelist.reopenConfirmSend'
    : 'courseRegistration.monitor.remindConfirmSend',
)
const notifyDraftBuilder = computed(() =>
  notifyMode.value === 'reopen' ? buildWhitelistReopenDraft : buildWhitelistNotifyDraft,
)

const rows = computed(() =>
  filterSupplementList(supplementListQueue.value, appliedSearch.value).map((r) =>
    normalizeWhitelistEntry(r),
  ),
)
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
  searchForm.value = { programme: '', keyword: '' }
  appliedSearch.value = { programme: '', keyword: '' }
  currentPage.value = 1
}

function openCreate() {
  detailEntry.value = null
  drawerVisible.value = true
}

function openDetail(row) {
  detailEntry.value = { ...row }
  drawerVisible.value = true
}

function closeDrawer() {
  drawerVisible.value = false
  detailEntry.value = null
}

function handleDrawerSaved() {
  closeDrawer()
}

function handleRemove(row) {
  if (window.confirm(t('courseRegistration.supplement.removeConfirm'))) {
    removeSupplementEntry(row.id)
  }
}

/** 发送通知次数 */
function notifyCountText(row) {
  const attempt = Number(row.inviteAttempt) || 0
  if (attempt <= 0) return t('courseRegistration.supplement.notifyCountZero')
  return t('courseRegistration.supplement.notifyCountTimes', { n: attempt })
}

/** 生效剩余时间 */
function remainTimeText(row) {
  const attempt = Number(row.inviteAttempt) || 0
  if (attempt <= 0) return t('courseRegistration.supplement.remainNotSent')
  const door = getSupplementDoorStatus(row.studentId)
  if (!door.ok) return t('courseRegistration.supplement.inviteExpiredShort')
  const cd = formatSupplementInviteCountdown(row)
  return cd?.label || '—'
}

function openNotifyModal(row) {
  notifyMode.value = 'notify'
  notifyRow.value = row
}

function openReopenModal(row) {
  notifyMode.value = 'reopen'
  notifyRow.value = row
}

function closeNotifyModal() {
  notifyMode.value = null
  notifyRow.value = null
}

function handleNotifyConfirm() {
  const row = notifyRow.value
  const mode = notifyMode.value
  if (!row?.id || !mode) return
  const result =
    mode === 'reopen' ? reopenSupplementInvite(row.id) : sendSupplementInvite(row.id)
  if (!result.ok) {
    window.alert(t(result.errorKey || 'courseRegistration.supplement.inviteSendFirst'))
    return
  }
  emailMockBanner.value = t(
    mode === 'reopen'
      ? 'courseRegistration.supplement.emailMockReopened'
      : 'courseRegistration.supplement.emailMockSent',
    {
      name: row.studentName,
      deadline: result.item.deadlineAt,
    },
  )
  closeNotifyModal()
}

/** 未发送，或已发送且仍在有效期内 → 发送通知（可多次） */
function canSendInvite(row) {
  const attempt = Number(row.inviteAttempt) || 0
  if (attempt <= 0) return true
  return getSupplementDoorStatus(row.studentId).ok
}

/** 已发送且已逾期 → 再次开放（与发送通知分开） */
function canReopen(row) {
  const attempt = Number(row.inviteAttempt) || 0
  if (attempt < 1) return false
  return !getSupplementDoorStatus(row.studentId).ok
}

function handleExportConfirm({ selectedFields }) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const columns = supplementExportFields.filter((col) => selectedFields.includes(col.key))
  exportCourseRegistrationData({
    rows: rows.value,
    columns,
    formatRow: formatSupplementExportRow,
    filename: `whitelist-${timestamp}.xlsx`,
    sheetName: 'Whitelist',
    i18n: { t },
  })
  exportModalVisible.value = false
}
</script>

<template>
  <div class="cr-list-page cr-supplement-page">
    <div class="page-card">
      <CourseRegistrationCallout variant="warning">
        <p>{{ t('courseRegistration.whitelist.doorHint') }}</p>
        <p>{{ t('courseRegistration.whitelist.inviteHint') }}</p>
      </CourseRegistrationCallout>

      <CourseRegistrationCallout v-if="emailMockBanner" variant="info">
        <p>{{ emailMockBanner }}</p>
      </CourseRegistrationCallout>

      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.programme') }}</label>
              <input v-model="searchForm.programme" type="text" class="search-input" />
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
        <button type="button" class="btn btn-primary" @click="openCreate">
          {{ t('common.create') }}
        </button>
        <button type="button" class="btn btn-outline" @click="exportModalVisible = true">
          {{ t('common.export') }}
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
                <th>{{ t('courseRegistration.monitor.programme') }}</th>
                <th>{{ t('courseRegistration.monitor.intake') }}</th>
                <th>{{ t('courseRegistration.whitelist.permissions') }}</th>
                <th>{{ t('courseRegistration.supplement.notifyCount') }}</th>
                <th>{{ t('courseRegistration.supplement.remainTime') }}</th>
                <th>{{ t('courseRegistration.supplement.remark') }}</th>
                <th>{{ t('courseRegistration.supplement.addedAt') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="row.id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.studentId }}</td>
                <td>{{ row.studentName }}</td>
                <td>{{ row.programme }}</td>
                <td>{{ formatIntakeBatch(row.intake) }}</td>
                <td class="perm-cell">{{ formatPermissionSummary(row, t) }}</td>
                <td class="invite-cell">{{ notifyCountText(row) }}</td>
                <td class="invite-cell">{{ remainTimeText(row) }}</td>
                <td>{{ row.remark || '—' }}</td>
                <td>{{ formatWhitelistAddedAt(row.addedAt) || '—' }}</td>
                <td class="actions-cell">
                  <button type="button" class="link-btn" @click="openDetail(row)">
                    {{ t('common.edit') }}
                  </button>
                  <button
                    v-if="canSendInvite(row)"
                    type="button"
                    class="link-btn"
                    @click="openNotifyModal(row)"
                  >
                    {{ t('courseRegistration.supplement.sendInvite') }}
                  </button>
                  <button
                    v-if="canReopen(row)"
                    type="button"
                    class="link-btn"
                    @click="openReopenModal(row)"
                  >
                    {{ t('courseRegistration.supplement.reopenInvite') }}
                  </button>
                  <button type="button" class="link-btn danger" @click="handleRemove(row)">
                    {{ t('common.delete') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="11" class="empty-cell">{{ t('common.noData') }}</td>
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

    <SupplementEntryDrawer
      :visible="drawerVisible"
      :entry="detailEntry"
      @close="closeDrawer"
      @saved="handleDrawerSaved"
    />

    <MonitorRemindModal
      :visible="!!notifyRow"
      :row="notifyRow"
      :draft-builder="notifyDraftBuilder"
      :title-key="notifyTitleKey"
      :confirm-key="notifyConfirmKey"
      @close="closeNotifyModal"
      @confirm="handleNotifyConfirm"
    />

    <ExportModal
      :visible="exportModalVisible"
      :fields="supplementExportFields.map((f) => ({ key: f.key, label: t(f.labelKey) }))"
      @close="exportModalVisible = false"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.perm-cell {
  font-size: 12px;
  max-width: 240px;
  color: #374151;
}
.link-btn.danger {
  color: #dc2626;
}
.invite-cell {
  font-size: 12px;
  max-width: 140px;
  white-space: nowrap;
}
.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
