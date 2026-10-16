<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
  formatWhitelistAddedAt,
  normalizeWhitelistEntry,
  buildWhitelistNotifyDraft,
  buildWhitelistReopenDraft,
  WHITELIST_PERMISSION_KEYS,
} from '../../data/courseRegistration/supplementListQueue.js'
import {
  PAYMENT_REMIND_WITHIN_MS,
  PAYMENT_URGENT_WITHIN_MS,
} from '../../data/courseRegistration/adminAddDropPaymentInsight.js'
import { supplementExportFields } from '../../data/courseRegistration/courseRegistrationExportFields.js'
import {
  exportCourseRegistrationData,
  formatSupplementExportRow,
} from '../../utils/exportCourseRegistrationExcel.js'
import { formatIntakeBatch, intakeOptions } from '../../data/intakeSets.js'
import '../../styles/list-page-search.css'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const nowTick = ref(Date.now())
let tickTimer = null

onMounted(() => {
  tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 30_000)
})

onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
})

function emptySearch() {
  return {
    programme: '',
    intake: '',
    studentId: '',
    studentName: '',
    permission: '',
    doorStatus: '',
  }
}

const searchExpanded = ref(true)
const searchForm = ref(emptySearch())
const appliedSearch = ref(emptySearch())
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

const whitelistIntakeOptions = computed(() => {
  const set = new Set(intakeOptions)
  for (const row of supplementListQueue.value) {
    const formatted = formatIntakeBatch(row.intake)
    if (formatted) set.add(formatted)
  }
  return [...set].sort().reverse()
})

const permissionFilterKeys = WHITELIST_PERMISSION_KEYS

const rows = computed(() => {
  void nowTick.value
  return filterSupplementList(
    supplementListQueue.value,
    appliedSearch.value,
    new Date(nowTick.value),
  ).map((r) => normalizeWhitelistEntry(r))
})
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
  searchForm.value = emptySearch()
  appliedSearch.value = emptySearch()
  currentPage.value = 1
}

function permissionFilterLabel(key) {
  return t(`courseRegistration.whitelist.perm.${key}`)
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

/**
 * 生效剩余时间展示（格式/色阶对齐缴费剩余）
 * @returns {{ text: string, className: string }}
 */
function remainTimeDisplay(row) {
  void nowTick.value
  const attempt = Number(row.inviteAttempt) || 0
  if (attempt <= 0) {
    return { text: t('courseRegistration.supplement.remainNotSent'), className: '' }
  }
  const door = getSupplementDoorStatus(row.studentId)
  if (!door.ok) {
    return {
      text: t('courseRegistration.supplement.inviteExpiredShort'),
      className: 'pay-remain is-overdue',
    }
  }
  const cd = formatSupplementInviteCountdown(row, nowTick.value, t)
  if (!cd || cd.expired) {
    return {
      text: t('courseRegistration.supplement.inviteExpiredShort'),
      className: 'pay-remain is-overdue',
    }
  }
  const ms = cd.remainingMs
  if (ms != null && ms < PAYMENT_URGENT_WITHIN_MS) {
    return { text: cd.label, className: 'pay-remain is-urgent' }
  }
  if (ms != null && ms < PAYMENT_REMIND_WITHIN_MS) {
    return { text: cd.label, className: 'pay-remain is-warn' }
  }
  return { text: cd.label, className: 'pay-remain' }
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

function handleNotifyConfirm(payload = {}) {
  const row = notifyRow.value || payload.row
  const mode = notifyMode.value
  if (!row?.id || !mode) return
  const result =
    mode === 'reopen'
      ? reopenSupplementInvite(row.id, new Date(), { deadlineAt: payload.deadlineAt })
      : sendSupplementInvite(row.id)
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
              <label>{{ t('courseRegistration.monitor.intake') }}</label>
              <select v-model="searchForm.intake" class="search-select">
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in whitelistIntakeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.studentId') }}</label>
              <input v-model="searchForm.studentId" type="text" class="search-input" />
            </div>
            <div class="search-item">
              <label>{{ t('courseRegistration.monitor.studentName') }}</label>
              <input v-model="searchForm.studentName" type="text" class="search-input" />
            </div>
            <template v-if="searchExpanded">
              <div class="search-item">
                <label>{{ t('courseRegistration.whitelist.permissions') }}</label>
                <select v-model="searchForm.permission" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="key in permissionFilterKeys" :key="key" :value="key">
                    {{ permissionFilterLabel(key) }}
                  </option>
                </select>
              </div>
              <div class="search-item">
                <label>{{ t('courseRegistration.whitelist.filterDoorStatus') }}</label>
                <select v-model="searchForm.doorStatus" class="search-select">
                  <option value="">{{ t('common.all') }}</option>
                  <option value="notSent">{{ t('courseRegistration.whitelist.doorStatusNotSent') }}</option>
                  <option value="active">{{ t('courseRegistration.whitelist.doorStatusActive') }}</option>
                  <option value="expired">{{ t('courseRegistration.whitelist.doorStatusExpired') }}</option>
                </select>
              </div>
            </template>
          </div>
          <div class="search-actions">
            <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
            <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
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
                <td class="invite-cell">{{ notifyCountText(row) }}</td>
                <td class="invite-cell">
                  <span :class="remainTimeDisplay(row).className">{{
                    remainTimeDisplay(row).text
                  }}</span>
                </td>
                <td class="remark-cell">{{ row.remark || '—' }}</td>
                <td class="invite-cell">{{ formatWhitelistAddedAt(row.addedAt) || '—' }}</td>
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
                    :title="t('courseRegistration.supplement.reopenInviteHint')"
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
                <td colspan="10" class="empty-cell">{{ t('common.noData') }}</td>
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
      :show-deadline-picker="notifyMode === 'reopen'"
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
.link-btn.danger {
  color: #dc2626;
}
.invite-cell {
  font-size: 12px;
  white-space: nowrap;
}
.remark-cell {
  font-size: 12px;
  color: #374151;
  max-width: 280px;
  line-height: 1.4;
}

.pay-remain.is-warn {
  color: #b45309;
  font-weight: 600;
}

.pay-remain.is-urgent,
.pay-remain.is-overdue {
  color: #b91c1c;
  font-weight: 600;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  white-space: nowrap;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cr-supplement-page .search-fields {
  flex: 1;
  gap: 12px 16px;
}

.cr-supplement-page .search-item {
  flex: 1 1 140px;
  min-width: 120px;
  max-width: 220px;
}

.cr-supplement-page :deep(.data-table th) {
  white-space: nowrap;
  padding: 8px 10px;
}

.cr-supplement-page :deep(.data-table td) {
  padding: 8px 10px;
  vertical-align: top;
}
</style>
