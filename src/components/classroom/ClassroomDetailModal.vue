<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getUserDepartments } from '../../data/classrooms.js'

const { t, tr } = useAppI18n()

const props = defineProps({
  visible: Boolean,
  data: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const activeTab = ref('info')

watch(
  () => props.visible,
  (visible) => {
    if (visible) activeTab.value = 'info'
  },
)

function yesNo(value) {
  return value ? tr('Yes') : tr('No')
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function getChangeRecords(item) {
  if (!item) return []
  const dept = getUserDepartments(item).join(', ') || 'SCF'
  return [
    {
      id: 1,
      datetime: '09.09.2024 15:03',
      modifiedBy: 'Mohd Arif Bin Abdullah',
      details: `Change the "Classroom Type" from "NA" to "${item.classroomType}"`,
    },
    {
      id: 2,
      datetime: '08.09.2024 11:20',
      modifiedBy: 'Admin User',
      details: `Newly added using department: ${dept}`,
    },
    {
      id: 3,
      datetime: '05.09.2024 09:45',
      modifiedBy: 'Mohd Arif Bin Abdullah',
      details: `Change the "Capacity" from "200" to "${item.capacity}"`,
    },
    {
      id: 4,
      datetime: '01.09.2024 14:12',
      modifiedBy: 'Admin User',
      details: `Change the "Activation" from "No" to "${yesNo(item.activation)}"`,
    },
    {
      id: 5,
      datetime: '28.08.2024 10:30',
      modifiedBy: 'Mohd Arif Bin Abdullah',
      details: `Change the "Borrowing Availability" from "Yes" to "${yesNo(item.borrowingAvailability)}"`,
    },
  ]
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && data" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Details') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="emit('close')">×</button>
        </div>

        <div class="tab-bar">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'info' }"
            @click="activeTab = 'info'"
          >
            {{ tr('Classroom Info') }}
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'changes' }"
            @click="activeTab = 'changes'"
          >
            {{ tr('Changes Record') }}
          </button>
        </div>

        <div v-if="activeTab === 'info'" class="tab-content">
          <div class="detail-columns">
            <div class="detail-col">
              <div class="detail-row">
                <span class="label">{{ tr('Classroom No.') }}</span>
                <span class="value">{{ data.classroomNo }}</span>
              </div>
              <div class="detail-row">
                <span class="label">{{ tr('Classroom Name') }}</span>
                <span class="value">{{ data.classroomName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">{{ tr('Classroom Name (MAL)') }}</span>
                <span class="value">{{ data.classroomNameMal }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Floor</span>
                <span class="value">{{ data.floor }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Desk/Chair Type</span>
                <span class="value">{{ data.deskChairType }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Available Seats</span>
                <span class="value">{{ data.availableSeats }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Classroom Equipment</span>
                <span class="value">{{ displayValue(data.classroomEquipment) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Activation</span>
                <span class="value">{{ yesNo(data.activation) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Borrowing Availability</span>
                <span class="value">{{ yesNo(data.borrowingAvailability) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">User Department</span>
                <span class="value">{{ getUserDepartments(data).join(', ') || '--' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Remark</span>
                <span class="value">{{ displayValue(data.remark) }}</span>
              </div>
            </div>

            <div class="detail-col">
              <div class="detail-row">
                <span class="label">Classroom</span>
                <span class="value">{{ data.classroom }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Classroom Name (Chinese)</span>
                <span class="value">{{ data.classroomNameEn }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Block</span>
                <span class="value">{{ data.block }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Classroom Type</span>
                <span class="value">{{ data.classroomType }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Capacity</span>
                <span class="value">{{ data.capacity }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Exam Seats</span>
                <span class="value">{{ data.examSeats }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Software</span>
                <span class="value">{{ displayValue(data.software) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Common Area</span>
                <span class="value">{{ yesNo(data.commonArea) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tab-content">
          <div class="changes-table-wrap">
            <table class="changes-table">
              <thead>
                <tr>
                  <th>Modified Date and Time</th>
                  <th>Modified by</th>
                  <th>Modification Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in getChangeRecords(data)" :key="record.id">
                  <td>{{ record.datetime }}</td>
                  <td>{{ record.modifiedBy }}</td>
                  <td>{{ record.details }}</td>
                </tr>
              </tbody>
            </table>
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
  z-index: 1000;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: 920px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 24px 28px 28px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.tab-bar {
  display: inline-flex;
  gap: 4px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.tab-btn.active {
  background: #fff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tab-btn:hover:not(.active) {
  color: #374151;
}

.tab-content {
  min-height: 320px;
}

.detail-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 48px;
}

.detail-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: start;
  font-size: 14px;
  line-height: 1.6;
}

.detail-row .label {
  color: #6b7280;
  text-align: right;
}

.detail-row .value {
  color: #111827;
  word-break: break-word;
}

.changes-table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.changes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.changes-table th {
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.changes-table td {
  padding: 14px 16px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
  line-height: 1.5;
}

.changes-table tbody tr:last-child td {
  border-bottom: none;
}

.changes-table tbody tr:hover {
  background: #fafafa;
}

.changes-table td:first-child {
  white-space: nowrap;
  color: #64748b;
}

@media (max-width: 768px) {
  .detail-columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
