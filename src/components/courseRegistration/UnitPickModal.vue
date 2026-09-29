<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  listUnitScheduleSchoolOptions,
  UNIT_SCHEDULE_COURSE_TYPES,
  normalizeUnitCourseType,
} from '../../data/courseRegistration/sessionRegistrationSchedules.js'

const props = defineProps({
  visible: Boolean,
  /** 已配置的「单位|课程类型」键，如 CAMS|GE */
  disabledUnitTypeKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'confirm'])

const { t, locale } = useAppI18n()

const selected = ref([])
const courseType = ref('GE')
const error = ref('')

const disabledSet = computed(() => new Set(props.disabledUnitTypeKeys.map(String)))

const options = computed(() => listUnitScheduleSchoolOptions(locale.value === 'zh'))

const courseTypeOptions = computed(() =>
  UNIT_SCHEDULE_COURSE_TYPES.map((type) => ({
    value: type,
    label: t(`courseRegistration.schedule.courseType.${type}`),
  })),
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selected.value = []
    courseType.value = 'GE'
    error.value = ''
  },
)

watch(courseType, () => {
  selected.value = selected.value.filter((code) => !isUnitDisabled(code))
  error.value = ''
})

function unitTypeKey(code, type = courseType.value) {
  return `${code}|${normalizeUnitCourseType(type)}`
}

function isUnitDisabled(code) {
  return disabledSet.value.has(unitTypeKey(code))
}

function toggle(code) {
  if (isUnitDisabled(code)) return
  const idx = selected.value.indexOf(code)
  if (idx === -1) {
    selected.value.push(code)
  } else {
    selected.value.splice(idx, 1)
  }
  error.value = ''
}

function handleConfirm() {
  if (!courseType.value) {
    error.value = t('courseRegistration.schedule.pickCourseTypeRequired')
    return
  }
  if (!selected.value.length) {
    error.value = t('courseRegistration.schedule.pickUnitRequired')
    return
  }
  emit('confirm', {
    unitCodes: [...selected.value],
    courseType: normalizeUnitCourseType(courseType.value),
  })
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
            <span class="req">*</span> {{ t('courseRegistration.schedule.pickCourseTypeField') }}
          </label>
          <div class="type-radios">
            <label v-for="opt in courseTypeOptions" :key="opt.value" class="type-option">
              <input v-model="courseType" type="radio" :value="opt.value" />
              <span>{{ opt.label }}</span>
            </label>
          </div>

          <label class="field-label field-label--spaced">
            <span class="req">*</span> {{ t('courseRegistration.schedule.pickUnitField') }}
          </label>
          <div class="unit-list">
            <label
              v-for="opt in options"
              :key="opt.code"
              class="unit-option"
              :class="{ disabled: isUnitDisabled(opt.code) }"
            >
              <input
                type="checkbox"
                :checked="selected.includes(opt.code)"
                :disabled="isUnitDisabled(opt.code)"
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
  z-index: 1100;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-panel {
  width: min(520px, 96vw);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 0 2px;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 18px;
  overflow: auto;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.field-label--spaced {
  margin-top: 14px;
}

.req {
  color: #dc2626;
  margin-right: 2px;
}

.type-radios {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.type-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.unit-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 2px 0;
  background: #fff;
}

.unit-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
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
  font-size: 13px;
  color: #dc2626;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
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
  border-color: #2563eb;
}
</style>
