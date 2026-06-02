<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { initialBlocks } from '../../data/blocks.js'

const { t, tr } = useAppI18n()
import {
  classroomTypeOptions,
  deskChairTypeOptions,
  equipmentOptions,
  softwareOptions,
  departmentOptions,
  joinMultiSelectValue,
} from '../../data/classrooms.js'

const props = defineProps({
  visible: Boolean,
  selectedCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'submit'])

const blockOptions = initialBlocks.map((b) => b.blockNo)

const enabled = ref({
  block: false,
  floor: false,
  classroomType: false,
  deskChairType: false,
  capacity: false,
  availableSeats: false,
  examSeats: false,
  classroomEquipment: false,
  software: false,
  activation: false,
  commonArea: false,
  borrowingAvailability: false,
  userDepartment: false,
})

const values = ref({
  block: '',
  floor: '',
  classroomType: '',
  deskChairType: '',
  capacity: '',
  availableSeats: '',
  examSeats: '',
  classroomEquipment: [],
  software: [],
  activation: true,
  commonArea: false,
  borrowingAvailability: false,
  userDepartments: [],
})

const userDeptDropdownOpen = ref(false)
const equipmentDropdownOpen = ref(false)
const softwareDropdownOpen = ref(false)
const error = ref('')

const floorOptions = computed(() => {
  const block = initialBlocks.find((b) => b.blockNo === values.value.block)
  return block ? block.floors : []
})

const userDeptLabel = computed(() => {
  if (!values.value.userDepartments.length) return ''
  return values.value.userDepartments.join(', ')
})

const equipmentLabel = computed(() => {
  if (!values.value.classroomEquipment.length) return ''
  return joinMultiSelectValue(values.value.classroomEquipment)
})

const softwareLabel = computed(() => {
  if (!values.value.software.length) return ''
  return joinMultiSelectValue(values.value.software)
})

function resetForm() {
  Object.keys(enabled.value).forEach((key) => {
    enabled.value[key] = false
  })
  values.value = {
    block: '',
    floor: '',
    classroomType: '',
    deskChairType: '',
    capacity: '',
    availableSeats: '',
    examSeats: '',
    classroomEquipment: [],
    software: [],
    activation: true,
    commonArea: false,
    borrowingAvailability: false,
    userDepartments: [],
  }
  userDeptDropdownOpen.value = false
  equipmentDropdownOpen.value = false
  softwareDropdownOpen.value = false
  error.value = ''
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) resetForm()
  },
)

watch(
  () => values.value.block,
  () => {
    if (values.value.floor && !floorOptions.value.includes(values.value.floor)) {
      values.value.floor = ''
    }
  },
)

function toggleUserDepartment(dept) {
  const index = values.value.userDepartments.indexOf(dept)
  if (index === -1) values.value.userDepartments.push(dept)
  else values.value.userDepartments.splice(index, 1)
}

function toggleEquipment(item) {
  const index = values.value.classroomEquipment.indexOf(item)
  if (index === -1) values.value.classroomEquipment.push(item)
  else values.value.classroomEquipment.splice(index, 1)
}

function toggleSoftware(item) {
  const index = values.value.software.indexOf(item)
  if (index === -1) values.value.software.push(item)
  else values.value.software.splice(index, 1)
}

function validate() {
  const checkedFields = Object.entries(enabled.value).filter(([, on]) => on)
  if (!checkedFields.length) {
    error.value = 'Please select at least one field to update.'
    return false
  }

  for (const [key] of checkedFields) {
    if (['capacity', 'availableSeats', 'examSeats'].includes(key) && values.value[key] === '') {
      error.value = 'Please fill in values for all checked fields.'
      return false
    }
    if (key === 'classroomEquipment' && !values.value.classroomEquipment.length) {
      error.value = 'Please fill in values for all checked fields.'
      return false
    }
    if (key === 'software' && !values.value.software.length) {
      error.value = 'Please fill in values for all checked fields.'
      return false
    }
    if (['block', 'floor', 'classroomType', 'deskChairType'].includes(key) && !values.value[key]) {
      error.value = 'Please fill in values for all checked fields.'
      return false
    }
    if (key === 'userDepartment' && !values.value.userDepartments.length) {
      error.value = 'Please select at least one department.'
      return false
    }
  }

  error.value = ''
  return true
}

function handleSubmit() {
  if (!validate()) return

  const updates = {}
  if (enabled.value.block) updates.block = values.value.block
  if (enabled.value.floor) updates.floor = values.value.floor
  if (enabled.value.classroomType) updates.classroomType = values.value.classroomType
  if (enabled.value.deskChairType) updates.deskChairType = values.value.deskChairType
  if (enabled.value.capacity) updates.capacity = Number(values.value.capacity)
  if (enabled.value.availableSeats) updates.availableSeats = Number(values.value.availableSeats)
  if (enabled.value.examSeats) updates.examSeats = Number(values.value.examSeats)
  if (enabled.value.classroomEquipment) updates.classroomEquipment = joinMultiSelectValue(values.value.classroomEquipment)
  if (enabled.value.software) updates.software = joinMultiSelectValue(values.value.software)
  if (enabled.value.activation) updates.activation = values.value.activation
  if (enabled.value.commonArea) updates.commonArea = values.value.commonArea
  if (enabled.value.borrowingAvailability) updates.borrowingAvailability = values.value.borrowingAvailability
  if (enabled.value.userDepartment) updates.userDepartments = [...values.value.userDepartments]

  emit('submit', updates)
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
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ t('modal.batchEdit') }}</h2>
            <p class="modal-desc">Select fields to update for {{ selectedCount }} selected classroom(s).</p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="field-list">
          <div class="field-row">
            <input v-model="enabled.block" type="checkbox" class="field-check" />
            <label class="field-label">Block:</label>
            <select v-model="values.block" class="field-control" :disabled="!enabled.block">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in blockOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div class="field-row">
            <input v-model="enabled.floor" type="checkbox" class="field-check" />
            <label class="field-label">Floor:</label>
            <select v-model="values.floor" class="field-control" :disabled="!enabled.floor">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in floorOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div class="field-row">
            <input v-model="enabled.classroomType" type="checkbox" class="field-check" />
            <label class="field-label">Classroom Type:</label>
            <select v-model="values.classroomType" class="field-control" :disabled="!enabled.classroomType">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in classroomTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div class="field-row">
            <input v-model="enabled.deskChairType" type="checkbox" class="field-check" />
            <label class="field-label">Desk/Chair Type:</label>
            <select v-model="values.deskChairType" class="field-control" :disabled="!enabled.deskChairType">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in deskChairTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div class="field-row">
            <input v-model="enabled.capacity" type="checkbox" class="field-check" />
            <label class="field-label">Capacity:</label>
            <input v-model="values.capacity" type="number" class="field-control" :disabled="!enabled.capacity" :placeholder="t('common.pleaseInput')" />
          </div>

          <div class="field-row">
            <input v-model="enabled.availableSeats" type="checkbox" class="field-check" />
            <label class="field-label">Available Seats:</label>
            <input v-model="values.availableSeats" type="number" class="field-control" :disabled="!enabled.availableSeats" :placeholder="t('common.pleaseInput')" />
          </div>

          <div class="field-row">
            <input v-model="enabled.examSeats" type="checkbox" class="field-check" />
            <label class="field-label">Exam Seats:</label>
            <input v-model="values.examSeats" type="number" class="field-control" :disabled="!enabled.examSeats" :placeholder="t('common.pleaseInput')" />
          </div>

          <div class="field-row">
            <input v-model="enabled.classroomEquipment" type="checkbox" class="field-check" />
            <label class="field-label">Classroom Equipment:</label>
            <div class="select-wrap">
              <button
                type="button"
                class="field-control select-btn"
                :disabled="!enabled.classroomEquipment"
                @click="enabled.classroomEquipment && (equipmentDropdownOpen = !equipmentDropdownOpen)"
              >
                <span :class="{ placeholder: !values.classroomEquipment.length }">{{ equipmentLabel || t('common.pleaseSelect') }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div v-if="equipmentDropdownOpen && enabled.classroomEquipment" class="dropdown-panel">
                <label v-for="opt in equipmentOptions" :key="opt" class="dropdown-option">
                  <input type="checkbox" :checked="values.classroomEquipment.includes(opt)" @change="toggleEquipment(opt)" />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="field-row">
            <input v-model="enabled.software" type="checkbox" class="field-check" />
            <label class="field-label">Software:</label>
            <div class="select-wrap">
              <button
                type="button"
                class="field-control select-btn"
                :disabled="!enabled.software"
                @click="enabled.software && (softwareDropdownOpen = !softwareDropdownOpen)"
              >
                <span :class="{ placeholder: !values.software.length }">{{ softwareLabel || t('common.pleaseSelect') }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div v-if="softwareDropdownOpen && enabled.software" class="dropdown-panel">
                <label v-for="opt in softwareOptions" :key="opt" class="dropdown-option">
                  <input type="checkbox" :checked="values.software.includes(opt)" @change="toggleSoftware(opt)" />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="field-row">
            <input v-model="enabled.activation" type="checkbox" class="field-check" />
            <label class="field-label">Activation:</label>
            <div class="radio-group" :class="{ disabled: !enabled.activation }">
              <label><input v-model="values.activation" type="radio" :value="true" :disabled="!enabled.activation" /> Yes</label>
              <label><input v-model="values.activation" type="radio" :value="false" :disabled="!enabled.activation" /> No</label>
            </div>
          </div>

          <div class="field-row">
            <input v-model="enabled.commonArea" type="checkbox" class="field-check" />
            <label class="field-label">Common Area:</label>
            <div class="radio-group" :class="{ disabled: !enabled.commonArea }">
              <label><input v-model="values.commonArea" type="radio" :value="true" :disabled="!enabled.commonArea" /> Yes</label>
              <label><input v-model="values.commonArea" type="radio" :value="false" :disabled="!enabled.commonArea" /> No</label>
            </div>
          </div>

          <div class="field-row">
            <input v-model="enabled.borrowingAvailability" type="checkbox" class="field-check" />
            <label class="field-label">Borrowing Availability:</label>
            <div class="radio-group" :class="{ disabled: !enabled.borrowingAvailability }">
              <label><input v-model="values.borrowingAvailability" type="radio" :value="true" :disabled="!enabled.borrowingAvailability" /> Yes</label>
              <label><input v-model="values.borrowingAvailability" type="radio" :value="false" :disabled="!enabled.borrowingAvailability" /> No</label>
            </div>
          </div>

          <div class="field-row">
            <input v-model="enabled.userDepartment" type="checkbox" class="field-check" />
            <label class="field-label">User Department:</label>
            <div class="select-wrap">
              <button
                type="button"
                class="field-control select-btn"
                :disabled="!enabled.userDepartment"
                @click="enabled.userDepartment && (userDeptDropdownOpen = !userDeptDropdownOpen)"
              >
                <span :class="{ placeholder: !values.userDepartments.length }">{{ userDeptLabel || t('common.pleaseSelect') }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div v-if="userDeptDropdownOpen && enabled.userDepartment" class="dropdown-panel">
                <label v-for="dept in departmentOptions" :key="dept" class="dropdown-option">
                  <input type="checkbox" :checked="values.userDepartments.includes(dept)" @change="toggleUserDepartment(dept)" />
                  <span>{{ dept }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <p v-if="error" class="form-error">{{ tr(error) }}</p>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSubmit">{{ t('common.confirm') }}</button>
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
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 24px 28px 20px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.modal-desc {
  font-size: 13px;
  color: #6b7280;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 22px;
  color: #6b7280;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f3f4f6;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-row {
  display: grid;
  grid-template-columns: 20px 160px 1fr;
  gap: 12px;
  align-items: center;
}

.field-check {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
}

.field-label {
  font-size: 14px;
  color: #374151;
  text-align: right;
}

.field-control {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
}

.field-control:disabled,
.select-btn:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.field-control:focus:not(:disabled) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.select-wrap {
  position: relative;
}

.select-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.select-btn .placeholder {
  color: #9ca3af;
}

.select-btn svg {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  z-index: 10;
  max-height: 180px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.dropdown-option:hover {
  background: #f9fafb;
}

.radio-group {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #374151;
  height: 36px;
  align-items: center;
}

.radio-group.disabled {
  opacity: 0.5;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-error {
  margin-top: 12px;
  font-size: 13px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  height: 38px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}
</style>
