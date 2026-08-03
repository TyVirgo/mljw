<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { updateCoursesSelectable } from '../../data/courseRegistration/selectableCourses.js'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

/** @type {import('vue').Ref<boolean>} */
const draftSelectable = ref(true)

watch(
  () => [props.visible, props.courses],
  () => {
    if (!props.visible) return
    const allYes = props.courses.length > 0 && props.courses.every((c) => c.isSelectable !== false)
    draftSelectable.value = allYes
  },
  { immediate: true, deep: true },
)

const hasCourses = computed(() => props.courses.length > 0)

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!hasCourses.value) return
  updateCoursesSelectable(
    props.courses.map((c) => c.id),
    draftSelectable.value,
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
          <h2 class="modal-title">{{ t('courseRegistration.courses.optionalSettings') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <template v-if="hasCourses">
            <p class="hint">
              {{ t('courseRegistration.courses.optionalSettingsHint', { count: courses.length }) }}
            </p>
            <div class="field-row">
              <span class="field-label">
                <span class="req">*</span>
                {{ t('courseRegistration.courses.isSelectable') }}:
              </span>
              <div class="radio-row" role="radiogroup">
                <label class="radio-item">
                  <input v-model="draftSelectable" type="radio" :value="true" />
                  {{ t('courseRegistration.courses.isSelectableYes') }}
                </label>
                <label class="radio-item">
                  <input v-model="draftSelectable" type="radio" :value="false" />
                  {{ t('courseRegistration.courses.isSelectableNo') }}
                </label>
              </div>
            </div>
            <p class="help">{{ t('courseRegistration.courses.optionalSettingsHelp') }}</p>
          </template>
          <p v-else class="empty-hint">{{ t('courseRegistration.courses.optionalSettingsNeedSelect') }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" :disabled="!hasCourses" @click="handleConfirm">
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
  line-height: 1.5;
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

.radio-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #111827;
  cursor: pointer;
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px 16px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d9d9d9;
}
</style>
