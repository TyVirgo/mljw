<script setup>
import { ref, computed, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import AudienceRoundDualCell from './AudienceRoundDualCell.vue'
import SessionScheduleEditDrawer from './SessionScheduleEditDrawer.vue'
import UnitPickModal from './UnitPickModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { batchDateToPicker } from '../../data/courseRegistration/registrationBatchFormUtils.js'
import {
  listUnitOverridesForSession,
  upsertUnitScheduleOverride,
  removeUnitScheduleOverride,
  formatUnitLabel,
} from '../../data/courseRegistration/sessionRegistrationSchedules.js'

const props = defineProps({
  visible: Boolean,
  academicSession: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { t, locale } = useAppI18n()

const pickModalVisible = ref(false)
const editUnitCode = ref('')
const editUnitCodes = ref([])
const editSchedule = ref(null)
const editDrawerVisible = ref(false)

const sessionKey = computed(() => String(props.academicSession || '').trim())

const title = computed(() =>
  t('courseRegistration.schedule.unitOverridePanelTitle', { session: sessionKey.value || '—' }),
)

const overrides = computed(() => listUnitOverridesForSession(sessionKey.value))

const configuredUnitCodes = computed(() => overrides.value.map((o) => o.unitCode))

const tableRows = computed(() =>
  overrides.value.map((ov) => ({
    ...ov,
    unitLabel: formatUnitLabel(ov.unitCode, locale.value === 'zh'),
  })),
)

watch(
  () => [props.visible, props.academicSession],
  () => {
    if (!props.visible) return
    pickModalVisible.value = false
    editUnitCode.value = ''
    editUnitCodes.value = []
    editSchedule.value = null
    editDrawerVisible.value = false
  },
)

function openPickModal() {
  pickModalVisible.value = true
}

function handleUnitsPicked(codes) {
  pickModalVisible.value = false
  editUnitCode.value = ''
  editUnitCodes.value = codes
  editSchedule.value = null
  editDrawerVisible.value = true
}

function openEditOverride(row) {
  editUnitCode.value = row.unitCode
  editUnitCodes.value = []
  editSchedule.value = { ...row }
  editDrawerVisible.value = true
}

function handleDelete(row) {
  const name = row.unitLabel || row.unitCode
  if (!window.confirm(t('courseRegistration.schedule.deleteUnitOverrideConfirm', { name }))) return
  removeUnitScheduleOverride(row.unitCode, sessionKey.value)
}

function resultReleaseSummary(row) {
  const at = row.roundsByAudience?.senior?.resultReleaseAt
  if (!at) return t('courseRegistration.batch.roundNotConfigured')
  const picker = batchDateToPicker(at) || at
  return String(picker).replace(/(\d{2}:\d{2}):\d{2}/g, '$1')
}

function handleSave(payload) {
  const codes =
    payload.unitCodes?.length > 0
      ? payload.unitCodes
      : payload.unitCode
        ? [payload.unitCode]
        : editUnitCodes.value.length
          ? editUnitCodes.value
          : editUnitCode.value
            ? [editUnitCode.value]
            : []

  for (const unitCode of codes) {
    upsertUnitScheduleOverride({
      unitCode,
      academicSession: sessionKey.value,
      id: unitCode === editUnitCode.value ? editSchedule.value?.id : undefined,
      roundsByAudience: payload.roundsByAudience,
    })
  }

  editDrawerVisible.value = false
  editUnitCode.value = ''
  editUnitCodes.value = []
  editSchedule.value = null
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" @close="emit('close')">
    <CourseRegistrationCallout variant="info">
      <p>{{ t('courseRegistration.schedule.unitOverridePanelHint') }}{{ t('common.prototypeOnlySuffix') }}</p>
    </CourseRegistrationCallout>

    <div class="panel-toolbar">
      <button type="button" class="btn btn-primary" @click="openPickModal">
        + {{ t('courseRegistration.schedule.addUnit') }}
      </button>
    </div>

    <div class="table-wrap">
      <table class="data-table unit-override-table">
        <thead>
          <tr>
            <th class="col-unit">{{ t('courseRegistration.schedule.colUnit') }}</th>
            <th class="col-round">{{ t('courseRegistration.batch.roundColPreselect') }}</th>
            <th class="col-round">{{ t('courseRegistration.batch.roundColMain') }}</th>
            <th class="col-round">{{ t('courseRegistration.batch.roundColSupplement') }}</th>
            <th class="col-result-release">{{ t('courseRegistration.schedule.colResultRelease') }}</th>
            <th class="col-actions col-sticky-right">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.id">
            <td class="col-unit" :title="row.unitLabel">{{ row.unitCode }}</td>
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
            <td class="col-actions col-sticky-right">
              <button type="button" class="link-btn" @click="openEditOverride(row)">
                {{ t('common.edit') }}
              </button>
              <button type="button" class="link-btn danger" @click="handleDelete(row)">
                {{ t('common.delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="!tableRows.length">
            <td colspan="6" class="empty-cell">{{ t('courseRegistration.schedule.noUnitOverrides') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UnitPickModal
      :visible="pickModalVisible"
      :disabled-unit-codes="configuredUnitCodes"
      @close="pickModalVisible = false"
      @confirm="handleUnitsPicked"
    />

    <SessionScheduleEditDrawer
      :visible="editDrawerVisible"
      mode="unit"
      :academic-session="sessionKey"
      :schedule="editSchedule"
      :unit-code="editUnitCode"
      :unit-codes="editUnitCodes"
      @close="editDrawerVisible = false"
      @save="handleSave"
    />
  </ApplicationDetailDrawer>
</template>

<style scoped>
.panel-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.unit-override-table {
  table-layout: auto;
  font-size: 12px;
}

.unit-override-table th,
.unit-override-table td {
  padding: 6px 6px;
}

.unit-override-table .col-unit {
  width: 1%;
  white-space: nowrap;
  font-weight: 600;
  color: #374151;
}

.unit-override-table .col-round {
  white-space: nowrap;
}

.unit-override-table .col-result-release {
  min-width: 128px;
  white-space: nowrap;
  font-size: 12px;
  color: #6b7280;
}

.unit-override-table .col-actions {
  width: 1%;
  white-space: nowrap;
}

.unit-override-table .link-btn {
  font-size: 12px;
}

.col-sticky-right {
  position: sticky;
  right: 0;
  z-index: 2;
  background: #fff;
  border-left: 1px solid #f3f4f6;
}

.unit-override-table thead .col-sticky-right {
  background: #f9fafb;
  z-index: 3;
}

.unit-override-table tbody tr:hover .col-sticky-right {
  background: #fafafa;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table .col-actions .link-btn + .link-btn {
  margin-left: 8px;
}

.data-table .col-actions {
  white-space: nowrap;
}

.data-table .empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px 12px !important;
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

.link-btn.danger {
  color: #dc2626;
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
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
</style>
