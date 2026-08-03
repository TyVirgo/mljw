<script setup>
import { computed, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { updateCoursesCapacityPercent } from '../../data/courseRegistration/selectableCourses.js'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()
const percentInput = ref('100')

function defaultPercent(courses) {
  const first = courses?.[0]
  const p = Number(first?.capacityPercent)
  return Number.isFinite(p) && p > 0 ? String(Math.round(p)) : '100'
}

watch(
  () => [props.visible, props.courses],
  () => {
    if (!props.visible) return
    percentInput.value = defaultPercent(props.courses)
  },
)

const hasCourses = computed(() => props.courses.length > 0)

const parsedPercent = computed(() => {
  const n = Number(String(percentInput.value).trim())
  return Number.isFinite(n) && n > 0 ? n : null
})

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!hasCourses.value || !parsedPercent.value) return
  updateCoursesCapacityPercent(
    props.courses.map((c) => c.id),
    parsedPercent.value,
  )
  emit('saved')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('courseRegistration.courses.capacitySettings') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <template v-if="hasCourses">
            <p class="hint">
              {{ t('courseRegistration.courses.capacitySettingsHint', { count: courses.length }) }}
            </p>
            <div class="field-row">
              <span class="field-label">
                <span class="req">*</span>
                {{ t('courseRegistration.courses.capacityPercentLabel') }}:
              </span>
              <div class="percent-row">
                <input
                  v-model="percentInput"
                  type="number"
                  min="1"
                  step="1"
                  class="percent-input"
                  :placeholder="t('courseRegistration.courses.capacityPercentPlaceholder')"
                />
                <span class="percent-suffix">%</span>
              </div>
            </div>
            <p class="help">{{ t('courseRegistration.courses.capacityPercentHelp') }}</p>
          </template>
          <p v-else class="empty-hint">{{ t('courseRegistration.courses.optionalSettingsNeedSelect') }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!hasCourses || !parsedPercent"
            @click="handleConfirm"
          >
            {{ t('common.confirm') }}
          </button>
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
  z-index: 1300;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: min(420px, calc(100vw - 48px));
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
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
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 24px 20px;
}

.hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b7280;
}

.help {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.field-label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.req {
  color: #ef4444;
  margin-right: 2px;
}

.percent-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.percent-input {
  width: 120px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  outline: none;
}

.percent-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.percent-suffix {
  font-size: 13px;
  color: #6b7280;
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #0284c7;
  border-color: #0284c7;
  color: #fff;
}
</style>
