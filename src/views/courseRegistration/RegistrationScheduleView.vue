<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import YnSwitch from '../../components/common/YnSwitch.vue'
import SessionScheduleEditDrawer from '../../components/courseRegistration/SessionScheduleEditDrawer.vue'
import UnitScheduleOverridePanel from '../../components/courseRegistration/UnitScheduleOverridePanel.vue'
import AudienceRoundDualCell from '../../components/courseRegistration/AudienceRoundDualCell.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  formatRoundRangeCompact,
  formatRoundRangeTitle,
} from '../../data/courseRegistration/registrationBatches.js'
import {
  batchDateToPicker,
  registrationAcademicSessionOptions,
} from '../../data/courseRegistration/registrationBatchFormUtils.js'
import {
  listSessionSchedules,
  listUsedAcademicSessions,
  upsertSessionSchedule,
  removeSessionSchedule,
  setSessionScheduleEnabled,
} from '../../data/courseRegistration/sessionRegistrationSchedules.js'
import '../../data/courseRegistration/sessionRegistrationSchedules.js'
import '../../styles/course-registration-list.css'

const { t } = useAppI18n()

const searchForm = ref({ academicSession: '' })
const appliedSearch = ref({ academicSession: '' })
const currentPage = ref(1)
const pageSize = ref(20)
const selectedSessions = ref([])

const editDrawerVisible = ref(false)
const editingSchedule = ref(null)
const editingSession = ref('')

const overridePanelVisible = ref(false)
const overrideSession = ref('')

const rows = computed(() => {
  let list = listSessionSchedules()
  if (appliedSearch.value.academicSession) {
    list = list.filter((r) => r.academicSession.includes(appliedSearch.value.academicSession))
  }
  return list.sort((a, b) => String(b.academicSession).localeCompare(String(a.academicSession)))
})

const usedSessionSet = computed(() => new Set(listUsedAcademicSessions()))

const availableSessionOptions = computed(() =>
  registrationAcademicSessionOptions.filter((opt) => !usedSessionSet.value.has(opt)),
)

const totalCount = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedRows.value.length) return false
  return paginatedRows.value.every((row) => selectedSessions.value.includes(row.academicSession))
})

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
  currentPage.value = 1
  selectedSessions.value = []
}

function handleReset() {
  searchForm.value = { academicSession: '' }
  appliedSearch.value = { academicSession: '' }
  currentPage.value = 1
  selectedSessions.value = []
}

function toggleSelectAll(checked) {
  const pageKeys = paginatedRows.value.map((r) => r.academicSession)
  if (checked) {
    selectedSessions.value = [...new Set([...selectedSessions.value, ...pageKeys])]
  } else {
    selectedSessions.value = selectedSessions.value.filter((k) => !pageKeys.includes(k))
  }
}

function toggleRow(session, checked) {
  if (checked) {
    if (!selectedSessions.value.includes(session)) {
      selectedSessions.value = [...selectedSessions.value, session]
    }
  } else {
    selectedSessions.value = selectedSessions.value.filter((k) => k !== session)
  }
}

function openCreate() {
  if (!availableSessionOptions.value.length) {
    window.alert(t('courseRegistration.schedule.noSessionAvailable'))
    return
  }
  editingSchedule.value = null
  editingSession.value = availableSessionOptions.value[0]
  editDrawerVisible.value = true
}

function openEdit(row) {
  editingSchedule.value = { ...row }
  editingSession.value = row.academicSession
  editDrawerVisible.value = true
}

function openOverridePanel(row) {
  overrideSession.value = row.academicSession
  overridePanelVisible.value = true
}

function handleDeleteSelected() {
  if (!selectedSessions.value.length) return
  const label = selectedSessions.value.join(', ')
  if (!window.confirm(t('courseRegistration.schedule.deleteConfirm', { sessions: label }))) return
  selectedSessions.value.forEach((session) => removeSessionSchedule(session))
  selectedSessions.value = []
}

function handleSave(payload) {
  if (!editingSchedule.value && usedSessionSet.value.has(payload.academicSession)) {
    window.alert(t('courseRegistration.schedule.sessionAlreadyExists'))
    return
  }
  upsertSessionSchedule(payload)
  editDrawerVisible.value = false
  editingSchedule.value = null
}

function toggleEnabled(row, enabled) {
  setSessionScheduleEnabled(row.academicSession, enabled)
}

function resultReleaseSummary(row) {
  const at = row.roundsByAudience?.senior?.resultReleaseAt
  if (!at) return t('courseRegistration.batch.roundNotConfigured')
  const picker = batchDateToPicker(at) || at
  return String(picker).replace(/(\d{2}:\d{2}):\d{2}/g, '$1')
}

function addDropSummary(row) {
  return formatRoundRangeCompact(row.addDropWindow)
}

function addDropTitle(row) {
  return formatRoundRangeTitle(row.addDropWindow)
}
</script>

<template>
  <div class="cr-list-page cr-schedule-page">
    <div class="page-card">
      <div class="search-bar">
        <div class="search-row">
          <div class="search-fields">
            <div class="search-item">
              <label>{{ t('courseRegistration.batch.academicSession') }}</label>
              <select
                v-model="searchForm.academicSession"
                class="search-select"
                :class="{ 'is-empty': !searchForm.academicSession }"
              >
                <option value="">{{ t('common.all') }}</option>
                <option v-for="opt in registrationAcademicSessionOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
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

      <div class="toolbar">
        <button type="button" class="btn btn-primary" @click="openCreate">
          + {{ t('courseRegistration.schedule.new') }}
        </button>
        <button
          type="button"
          class="btn btn-default"
          :disabled="!selectedSessions.length"
          @click="handleDeleteSelected"
        >
          {{ t('common.delete') }}
        </button>
      </div>

      <div class="table-section">
        <div class="table-wrap">
          <table class="data-table schedule-data-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input
                    type="checkbox"
                    :checked="allPageSelected"
                    @change="toggleSelectAll($event.target.checked)"
                  />
                </th>
                <th class="col-session">{{ t('courseRegistration.batch.academicSession') }}</th>
                <th class="col-round">{{ t('courseRegistration.batch.roundColPreselect') }}</th>
                <th class="col-round">{{ t('courseRegistration.batch.roundColMain') }}</th>
                <th class="col-round">{{ t('courseRegistration.batch.roundColSupplement') }}</th>
                <th class="col-result-release">{{ t('courseRegistration.schedule.colResultRelease') }}</th>
                <th class="col-compact">{{ t('courseRegistration.batch.roundColAddDrop') }}</th>
                <th class="col-enabled">{{ t('courseRegistration.schedule.colEnabled') }}</th>
                <th class="col-actions col-sticky-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paginatedRows"
                :key="row.id"
                :class="{ 'row-disabled': row.enabled === false }"
              >
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedSessions.includes(row.academicSession)"
                    @change="toggleRow(row.academicSession, $event.target.checked)"
                  />
                </td>
                <td class="col-session">{{ row.academicSession }}</td>
                <td class="col-round">
                  <AudienceRoundDualCell
                    compact
                    :rounds-by-audience="row.roundsByAudience"
                    round-key="preselect"
                  />
                </td>
                <td class="col-round">
                  <AudienceRoundDualCell
                    compact
                    :rounds-by-audience="row.roundsByAudience"
                    round-key="main"
                  />
                </td>
                <td class="col-round">
                  <AudienceRoundDualCell
                    compact
                    :rounds-by-audience="row.roundsByAudience"
                    round-key="supplement"
                  />
                </td>
                <td class="col-result-release" :title="resultReleaseSummary(row)">
                  {{ resultReleaseSummary(row) }}
                </td>
                <td class="col-compact" :title="addDropTitle(row)">{{ addDropSummary(row) }}</td>
                <td class="col-enabled">
                  <YnSwitch
                    :model-value="row.enabled !== false"
                    @update:model-value="(v) => toggleEnabled(row, v)"
                  />
                </td>
                <td class="col-actions col-sticky-right">
                  <div class="actions-inner">
                    <button type="button" class="link-btn" @click="openEdit(row)">
                      {{ t('common.edit') }}
                    </button>
                    <button type="button" class="link-btn" @click="openOverridePanel(row)">
                      {{ t('courseRegistration.schedule.batchOverrides') }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
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

    <SessionScheduleEditDrawer
      :visible="editDrawerVisible"
      mode="session"
      :academic-session="editingSession"
      :schedule="editingSchedule"
      :session-options="availableSessionOptions"
      @close="editDrawerVisible = false"
      @save="handleSave"
    />

    <UnitScheduleOverridePanel
      :visible="overridePanelVisible"
      :academic-session="overrideSession"
      @close="overridePanelVisible = false"
    />
  </div>
</template>

<style scoped>
.cr-schedule-page .table-wrap {
  overflow-x: auto;
}

.schedule-data-table {
  width: 100%;
  min-width: 1320px;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: auto;
}

.schedule-data-table th,
.schedule-data-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.schedule-data-table td {
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedule-data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.schedule-data-table tbody tr:last-child td {
  border-bottom: none;
}

.schedule-data-table tbody tr.row-disabled td:not(.col-enabled):not(.col-actions) {
  color: #9ca3af;
}

.schedule-data-table .col-check {
  width: 40px;
  min-width: 40px;
  text-align: center;
  white-space: nowrap;
}

.schedule-data-table .col-session {
  min-width: 76px;
  white-space: nowrap;
  font-weight: 600;
}

.schedule-data-table .col-round {
  min-width: 200px;
  max-width: 240px;
  white-space: nowrap;
}

.schedule-data-table .col-result-release {
  min-width: 128px;
  max-width: 148px;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.schedule-data-table .col-compact {
  min-width: 200px;
  max-width: 240px;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.schedule-data-table .col-enabled {
  min-width: 72px;
  width: 72px;
  white-space: nowrap;
  text-align: center;
  overflow: visible;
}

.schedule-data-table .col-actions {
  min-width: 200px;
  white-space: nowrap;
  overflow: visible;
}

.schedule-data-table .actions-inner {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}

.schedule-data-table .col-actions .link-btn {
  font-size: 12px;
  flex-shrink: 0;
}

.schedule-data-table .col-sticky-right {
  position: sticky;
  right: 0;
  z-index: 2;
  background: #fff;
  border-left: 1px solid #f3f4f6;
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.08);
}

.schedule-data-table thead .col-sticky-right {
  background: #f9fafb;
  z-index: 3;
}

.schedule-data-table tbody tr:hover .col-sticky-right {
  background: #fafafa;
}

.schedule-data-table tbody tr.row-disabled:hover .col-sticky-right {
  background: #f5f5f5;
}

.schedule-data-table .empty-cell {
  text-align: center;
  color: #9ca3af;
  white-space: normal;
  overflow: visible;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
}
</style>
