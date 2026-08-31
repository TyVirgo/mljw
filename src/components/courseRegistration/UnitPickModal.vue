<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { listUnitScheduleSchoolOptions } from '../../data/courseRegistration/sessionRegistrationSchedules.js'

const props = defineProps({
  visible: Boolean,
  disabledUnitCodes: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'confirm'])

const { t, locale } = useAppI18n()

const selected = ref([])
const error = ref('')

const disabledSet = computed(() => new Set(props.disabledUnitCodes.map(String)))

const options = computed(() => listUnitScheduleSchoolOptions(locale.value === 'zh'))

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selected.value = []
    error.value = ''
  },
)

function toggle(code) {
  if (disabledSet.value.has(code)) return
  const idx = selected.value.indexOf(code)
  if (idx === -1) {
    selected.value.push(code)
  } else {
    selected.value.splice(idx, 1)
  }
  error.value = ''
}

function handleConfirm() {
  if (!selected.value.length) {
    error.value = t('courseRegistration.schedule.pickUnitRequired')
    return
  }
  emit('confirm', [...selected.value])
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
          <h2 class="modal-title">{{ t('courseRegistration.schedule.pickUnitTitle') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.schedule.pickUnitField') }}
          </label>
          <div class="unit-list">
            <label
              v-for="opt in options"
              :key="opt.code"
              class="unit-option"
              :class="{ disabled: disabledSet.has(opt.code) }"
            >
              <input
                type="checkbox"
                :checked="selected.includes(opt.code)"
                :disabled="disabledSet.has(opt.code)"
                @change="toggle(opt.code)"
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>
          <p class="field-hint">{{ t('courseRegistration.schedule.pickUnitHint') }}</p>
          <p v-if="error" class="field-error">{{ error }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">{{ t('common.confirm') }}</button>
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
  z-index: 1100;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 22px;
  color: #6b7280;
  flex-shrink: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.modal-close:hover {
  background: #f3f4f6;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 10px;
}

.req {
  color: #ef4444;
  margin-right: 2px;
}

.unit-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 0;
}

.unit-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  line-height: 1.4;
}

.unit-option:hover:not(.disabled) {
  background: #f9fafb;
}

.unit-option.disabled {
  color: #9ca3af;
  cursor: not-allowed;
  background: #fafafa;
}

.field-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

.field-error {
  margin: 8px 0 0;
  font-size: 12px;
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
  height: 36px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}
</style>
