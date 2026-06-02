<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { departmentOptions } from '../../data/classrooms.js'

const { t, tr } = useAppI18n()

const props = defineProps({
  visible: Boolean,
  initialDepartments: {
    type: Array,
    default: () => [],
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'submit'])

const selectedDepartments = ref([])
const dropdownOpen = ref(false)
const error = ref('')

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedDepartments.value = [...props.initialDepartments]
    dropdownOpen.value = false
    error.value = ''
  },
)

const displayLabel = computed(() => {
  if (!selectedDepartments.value.length) return ''
  return selectedDepartments.value.join(', ')
})

function toggleDepartment(dept) {
  const index = selectedDepartments.value.indexOf(dept)
  if (index === -1) {
    selectedDepartments.value.push(dept)
  } else {
    selectedDepartments.value.splice(index, 1)
  }
  error.value = ''
}

function removeDepartment(dept) {
  const index = selectedDepartments.value.indexOf(dept)
  if (index !== -1) selectedDepartments.value.splice(index, 1)
}

function handleSubmit() {
  if (!selectedDepartments.value.length) {
    error.value = 'Please select at least one department.'
    return
  }
  emit('submit', [...selectedDepartments.value])
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
            <h2 class="modal-title">{{ t('common.userDepartment') }}</h2>
            <p class="modal-desc">{{ tr('Set usage department permissions for') }} {{ selectedCount }} {{ tr('selected classroom(s).') }}</p>
          </div>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-form">
          <div class="form-row">
            <label class="form-label">{{ tr('User Department:') }}</label>
            <div class="select-field">
              <button
                type="button"
                class="form-select"
                :class="{ error: error, open: dropdownOpen }"
                @click="dropdownOpen = !dropdownOpen"
              >
                <span :class="{ placeholder: !selectedDepartments.length }">
                  {{ displayLabel || t('common.pleaseSelect') }}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div v-if="dropdownOpen" class="dropdown-panel">
                <label v-for="dept in departmentOptions" :key="dept" class="dropdown-option">
                  <input
                    type="checkbox"
                    :checked="selectedDepartments.includes(dept)"
                    @change="toggleDepartment(dept)"
                  />
                  <span>{{ dept }}</span>
                </label>
              </div>

              <div v-if="selectedDepartments.length" class="selected-tags">
                <span v-for="dept in selectedDepartments" :key="dept" class="dept-tag">
                  {{ dept }}
                  <button type="button" class="tag-remove" @click="removeDepartment(dept)">×</button>
                </span>
              </div>

              <p v-if="error" class="field-error">{{ tr(error) }}</p>
            </div>
          </div>
        </div>

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
  max-width: 640px;
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
  margin-bottom: 24px;
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

.form-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.form-label {
  flex-shrink: 0;
  width: 130px;
  text-align: right;
  font-size: 14px;
  color: #374151;
  padding-top: 8px;
}

.select-field {
  flex: 1;
  position: relative;
  min-width: 0;
}

.form-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-select.error {
  border-color: #ef4444;
}

.form-select.open svg {
  transform: rotate(180deg);
}

.form-select .placeholder {
  color: #9ca3af;
}

.form-select span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-select svg {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: transform 0.2s;
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
  max-height: 220px;
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

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.dept-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  font-size: 13px;
}

.tag-remove {
  font-size: 14px;
  line-height: 1;
  color: #2563eb;
  padding: 0 2px;
}

.field-error {
  margin-top: 8px;
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
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
