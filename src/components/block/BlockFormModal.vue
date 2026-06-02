<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { floorOptions } from '../../data/blocks.js'

const { t, tr } = useAppI18n()

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

const blockNo = ref('')
const blockName = ref('')
const selectedFloors = ref([])
const floorDropdownOpen = ref(false)
const errors = ref({})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    errors.value = {}
    floorDropdownOpen.value = false
    if (props.mode === 'edit' && props.initialData) {
      blockNo.value = props.initialData.blockNo
      blockName.value = props.initialData.blockName
      selectedFloors.value = [...props.initialData.floors]
    } else {
      blockNo.value = ''
      blockName.value = ''
      selectedFloors.value = []
    }
  },
)

const modalTitle = computed(() =>
  props.mode === 'edit' ? t('modal.editBlock') : t('modal.createBlock'),
)

const floorLabel = computed(() => {
  if (!selectedFloors.value.length) return ''
  return selectedFloors.value.join(', ')
})

function toggleFloor(floor) {
  const index = selectedFloors.value.indexOf(floor)
  if (index === -1) {
    selectedFloors.value.push(floor)
  } else {
    selectedFloors.value.splice(index, 1)
  }
}

function validate() {
  const nextErrors = {}
  if (!blockNo.value.trim()) nextErrors.blockNo = 'Block No. is required'
  if (!blockName.value.trim()) nextErrors.blockName = 'Block Name is required'
  if (!selectedFloors.value.length) nextErrors.floors = 'Floor is required'
  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

function handleSave() {
  if (!validate()) return
  emit('save', {
    blockNo: blockNo.value.trim(),
    blockName: blockName.value.trim(),
    floors: [...selectedFloors.value],
  })
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <p class="modal-desc">{{ t('modal.blockDesc') }}</p>

        <div class="modal-form">
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Block No.') }}</label>
            <div class="form-field">
              <input
                v-model="blockNo"
                type="text"
                class="form-input"
                :class="{ error: errors.blockNo }"
                :placeholder="tr('Block No., e.g. A1')"
              />
              <p v-if="errors.blockNo" class="field-error">{{ tr(errors.blockNo) }}</p>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Block Name') }}</label>
            <div class="form-field">
              <input
                v-model="blockName"
                type="text"
                class="form-input"
                :class="{ error: errors.blockName }"
                :placeholder="tr('Block Name, e.g. A1 Teaching Building')"
              />
              <p v-if="errors.blockName" class="field-error">{{ tr(errors.blockName) }}</p>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Floor') }}</label>
            <div class="form-field">
              <div class="select-wrap">
                <button
                  type="button"
                  class="form-select"
                  :class="{ error: errors.floors, open: floorDropdownOpen }"
                  @click="floorDropdownOpen = !floorDropdownOpen"
                >
                  <span :class="{ placeholder: !selectedFloors.length }">
                    {{ floorLabel || t('modal.selectFloors') }}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div v-if="floorDropdownOpen" class="floor-dropdown">
                  <label
                    v-for="floor in floorOptions"
                    :key="floor"
                    class="floor-option"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedFloors.includes(floor)"
                      @change="toggleFloor(floor)"
                    />
                    <span>{{ floor }}</span>
                  </label>
                </div>
              </div>
              <p v-if="errors.floors" class="field-error">{{ tr(errors.floors) }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
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
  max-width: 560px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 24px 28px 20px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
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

.modal-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 24px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 16px;
  align-items: start;
}

.form-label {
  font-size: 14px;
  color: #374151;
  text-align: right;
  padding-top: 10px;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-field {
  min-width: 0;
}

.form-input,
.form-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-input.error,
.form-select.error {
  border-color: #ef4444;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.form-select span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-select .placeholder {
  color: #9ca3af;
}

.form-select svg {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.form-select.open svg {
  transform: rotate(180deg);
}

.select-wrap {
  position: relative;
}

.floor-dropdown {
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
  max-height: 200px;
  overflow-y: auto;
}

.floor-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.floor-option:hover {
  background: #f9fafb;
}

.field-error {
  margin-top: 6px;
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}

.btn {
  height: 38px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, border-color 0.15s;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
