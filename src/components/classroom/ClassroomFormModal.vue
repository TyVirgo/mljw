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
  buildClassroomCode,
  parseMultiSelectValue,
  joinMultiSelectValue,
} from '../../data/classrooms.js'

const props = defineProps({
  visible: Boolean,
  mode: {
    type: String,
    default: 'create',
  },
  initialData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'save'])

const form = ref(createEmptyForm())
const errors = ref({})
const equipmentDropdownOpen = ref(false)
const softwareDropdownOpen = ref(false)

const blockOptions = initialBlocks.map((b) => b.blockNo)

const floorOptions = computed(() => {
  const block = initialBlocks.find((b) => b.blockNo === form.value.block)
  return block ? block.floors : []
})

const modalTitle = computed(() => (props.mode === 'edit' ? t('common.edit') : t('common.create')))

function createEmptyForm() {
  return {
    block: '',
    classroomNo: '',
    classroom: '',
    classroomName: '',
    classroomNameEn: '',
    classroomNameMal: '',
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
    userDepartment: '',
    remark: '',
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    errors.value = {}
    equipmentDropdownOpen.value = false
    softwareDropdownOpen.value = false
    if (props.initialData) {
      form.value = {
        block: props.initialData.block,
        classroomNo: props.initialData.classroomNo,
        classroom: props.initialData.classroom,
        classroomName: props.initialData.classroomName,
        classroomNameEn: props.initialData.classroomNameEn,
        classroomNameMal: props.initialData.classroomNameMal,
        floor: props.initialData.floor,
        classroomType: props.initialData.classroomType,
        deskChairType: props.initialData.deskChairType,
        capacity: String(props.initialData.capacity),
        availableSeats: String(props.initialData.availableSeats),
        examSeats: String(props.initialData.examSeats),
        classroomEquipment: parseMultiSelectValue(props.initialData.classroomEquipment),
        software: parseMultiSelectValue(props.initialData.software),
        activation: props.initialData.activation,
        commonArea: props.initialData.commonArea,
        borrowingAvailability: props.initialData.borrowingAvailability,
        userDepartment: props.initialData.userDepartment || '',
        remark: props.initialData.remark || '',
      }
    } else {
      form.value = createEmptyForm()
    }
  },
)

watch(
  () => [form.value.block, form.value.classroomNo],
  () => {
    if (form.value.block && form.value.classroomNo) {
      form.value.classroom = buildClassroomCode(form.value.block, form.value.classroomNo)
    }
  },
)

function validate() {
  const nextErrors = {}
  const required = [
    ['block', 'Block'],
    ['classroomNo', 'Classroom No.'],
    ['classroom', 'Classroom'],
    ['classroomName', 'Classroom Name'],
    ['classroomNameEn', 'Classroom Name (Chinese)'],
    ['classroomNameMal', 'Classroom Name (MAL)'],
    ['floor', 'Floor'],
    ['classroomType', 'Classroom Type'],
    ['deskChairType', 'Desk/Chair Type'],
    ['capacity', 'Capacity'],
    ['availableSeats', 'Available Seats'],
    ['examSeats', 'Exam Seats'],
  ]
  required.forEach(([key, label]) => {
    if (!String(form.value[key]).trim()) nextErrors[key] = `${label} is required`
  })
  if (form.value.remark.length > 100) nextErrors.remark = 'Remark must be within 100 characters'
  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

function handleSave() {
  if (!validate()) return
  emit('save', {
    block: form.value.block,
    floor: form.value.floor,
    classroomNo: form.value.classroomNo.trim(),
    classroom: form.value.classroom.trim(),
    classroomName: form.value.classroomName.trim(),
    classroomNameEn: form.value.classroomNameEn.trim(),
    classroomNameMal: form.value.classroomNameMal.trim(),
    classroomType: form.value.classroomType,
    deskChairType: form.value.deskChairType,
    capacity: Number(form.value.capacity),
    availableSeats: Number(form.value.availableSeats),
    examSeats: Number(form.value.examSeats),
    classroomEquipment: joinMultiSelectValue(form.value.classroomEquipment),
    software: joinMultiSelectValue(form.value.software),
    activation: form.value.activation,
    commonArea: form.value.commonArea,
    borrowingAvailability: form.value.borrowingAvailability,
    userDepartment: form.value.userDepartment,
    remark: form.value.remark.trim(),
  })
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function toggleEquipment(item) {
  const index = form.value.classroomEquipment.indexOf(item)
  if (index === -1) form.value.classroomEquipment.push(item)
  else form.value.classroomEquipment.splice(index, 1)
}

function toggleSoftware(item) {
  const index = form.value.software.indexOf(item)
  if (index === -1) form.value.software.push(item)
  else form.value.software.splice(index, 1)
}

const equipmentLabel = computed(() => joinMultiSelectValue(form.value.classroomEquipment))
const softwareLabel = computed(() => joinMultiSelectValue(form.value.software))
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ modalTitle }}</h2>
            <p class="modal-desc">{{ t('modal.classroomDesc') }}</p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-form">
          <div class="form-grid">
            <div class="form-col">
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Block') }}:</label>
                <select v-model="form.block" class="form-input" :class="{ error: errors.block }">
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in blockOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Classroom Name:') }}</label>
                <input v-model="form.classroomName" type="text" class="form-input" :class="{ error: errors.classroomName }" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Classroom Name (Chinese):') }}</label>
                <input v-model="form.classroomNameEn" type="text" class="form-input" :class="{ error: errors.classroomNameEn }" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Floor') }}:</label>
                <select v-model="form.floor" class="form-input" :class="{ error: errors.floor }">
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in floorOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Desk/Chair Type:') }}</label>
                <select v-model="form.deskChairType" class="form-input" :class="{ error: errors.deskChairType }">
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in deskChairTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Available Seats:') }}</label>
                <input v-model="form.availableSeats" type="number" class="form-input" :class="{ error: errors.availableSeats }" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Classroom Equipment') }}:</label>
                <div class="select-wrap">
                  <button type="button" class="form-input select-btn" @click="equipmentDropdownOpen = !equipmentDropdownOpen">
                    <span :class="{ placeholder: !form.classroomEquipment.length }">{{ equipmentLabel || t('common.pleaseSelect') }}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  <div v-if="equipmentDropdownOpen" class="dropdown-panel">
                    <label v-for="opt in equipmentOptions" :key="opt" class="dropdown-option">
                      <input type="checkbox" :checked="form.classroomEquipment.includes(opt)" @change="toggleEquipment(opt)" />
                      <span>{{ opt }}</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Activation:') }}</label>
                <div class="radio-group">
                  <label><input v-model="form.activation" type="radio" :value="true" /> {{ tr('Yes') }}</label>
                  <label><input v-model="form.activation" type="radio" :value="false" /> {{ tr('No') }}</label>
                </div>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Borrowing Availability:') }}</label>
                <div class="radio-group">
                  <label><input v-model="form.borrowingAvailability" type="radio" :value="true" /> {{ tr('Yes') }}</label>
                  <label><input v-model="form.borrowingAvailability" type="radio" :value="false" /> {{ tr('No') }}</label>
                </div>
              </div>
            </div>

            <div class="form-col">
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Classroom No.:') }}</label>
                <input v-model="form.classroomNo" type="text" class="form-input" :class="{ error: errors.classroomNo }" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Classroom:') }}</label>
                <input v-model="form.classroom" type="text" class="form-input readonly" :class="{ error: errors.classroom }" :placeholder="tr('Auto-generated from block...')" readonly />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Classroom Name (MAL):') }}</label>
                <input v-model="form.classroomNameMal" type="text" class="form-input" :class="{ error: errors.classroomNameMal }" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Classroom Type:') }}</label>
                <select v-model="form.classroomType" class="form-input" :class="{ error: errors.classroomType }">
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in classroomTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Capacity:') }}</label>
                <input v-model="form.capacity" type="number" class="form-input" :class="{ error: errors.capacity }" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Exam Seats:') }}</label>
                <input v-model="form.examSeats" type="number" class="form-input" :class="{ error: errors.examSeats }" :placeholder="t('common.pleaseInput')" />
              </div>
              <div class="form-row">
                <label class="form-label">{{ tr('Software') }}:</label>
                <div class="select-wrap">
                  <button type="button" class="form-input select-btn" @click="softwareDropdownOpen = !softwareDropdownOpen">
                    <span :class="{ placeholder: !form.software.length }">{{ softwareLabel || t('common.pleaseSelect') }}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  <div v-if="softwareDropdownOpen" class="dropdown-panel">
                    <label v-for="opt in softwareOptions" :key="opt" class="dropdown-option">
                      <input type="checkbox" :checked="form.software.includes(opt)" @change="toggleSoftware(opt)" />
                      <span>{{ opt }}</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <label class="form-label"><span class="required">*</span> {{ tr('Common Area:') }}</label>
                <div class="radio-group">
                  <label><input v-model="form.commonArea" type="radio" :value="true" /> {{ tr('Yes') }}</label>
                  <label><input v-model="form.commonArea" type="radio" :value="false" /> {{ tr('No') }}</label>
                </div>
              </div>
            </div>
          </div>

          <div class="form-row full">
            <label class="form-label">{{ tr('User Department:') }}</label>
            <select v-model="form.userDepartment" class="form-input">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in departmentOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div class="form-row full textarea-row">
            <label class="form-label">{{ tr('Remark:') }}</label>
            <div class="textarea-wrap">
              <textarea v-model="form.remark" class="form-textarea" maxlength="100" :placeholder="t('common.pleaseInput')" />
              <span class="char-count">{{ form.remark.length }}/100</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.confirm') }}</button>
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
  line-height: 1;
  color: #6b7280;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f3f4f6;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 32px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  align-items: center;
}

.form-row.full {
  margin-top: 14px;
}

.form-row.textarea-row {
  align-items: start;
}

.form-label {
  font-size: 13px;
  color: #374151;
  text-align: right;
}

.textarea-row .form-label {
  padding-top: 10px;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
}

.form-input {
  height: 36px;
  padding: 0 12px;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input.readonly {
  background: #f9fafb;
  color: #6b7280;
}

.form-textarea {
  min-height: 80px;
  padding: 10px 12px;
  resize: vertical;
}

.textarea-wrap {
  position: relative;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.radio-group {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #374151;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
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

.btn-default:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.select-wrap {
  position: relative;
}

.select-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
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
</style>
