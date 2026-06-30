<script setup>
import { ref, watch, computed } from 'vue'
import YnSwitch from '../common/YnSwitch.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createEmptyMovementCategoryForm,
  validateMovementCategoryForm,
} from '../../data/movementCategories.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyMovementCategoryForm())
const errors = ref({})

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() =>
  isEditMode.value ? t('movementCategory.form.editTitle') : t('movementCategory.form.createTitle'),
)

function applyInitialForm(data) {
  return {
    categoryCode: data.categoryCode || '',
    categoryName: data.categoryName || '',
    allowStudentApply: data.allowStudentApply !== false,
    autoImplement: data.autoImplement === true,
    deleteOriginalCourseList: data.deleteOriginalCourseList === true,
    presetNewProgrammeBatchList: data.presetNewProgrammeBatchList === true,
    excludeGradedFromPreset: data.excludeGradedFromPreset === true,
  }
}

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = applyInitialForm(props.initialData)
    } else {
      form.value = createEmptyMovementCategoryForm()
    }
  },
)

function fieldError(key) {
  return errors.value[key] ? 'is-error' : ''
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  const result = validateMovementCategoryForm(
    form.value,
    isEditMode.value ? 'edit' : 'create',
    props.initialData?.id ?? null,
  )
  errors.value = result.errors
  if (!result.valid) return
  emit('save', { ...form.value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label class="field-label required">{{ t('movementCategory.fields.categoryCode') }}:</label>
              <div class="field-control">
                <input
                  v-model="form.categoryCode"
                  type="text"
                  :class="['control-input', fieldError('categoryCode')]"
                  :placeholder="t('common.pleaseInput')"
                  :readonly="isEditMode"
                  :disabled="isEditMode"
                />
                <p v-if="errors.categoryCode" class="field-error">{{ tr(errors.categoryCode) }}</p>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('movementCategory.fields.categoryName') }}:</label>
              <div class="field-control">
                <input
                  v-model="form.categoryName"
                  type="text"
                  :class="['control-input', fieldError('categoryName')]"
                  :placeholder="t('common.pleaseInput')"
                />
                <p v-if="errors.categoryName" class="field-error">{{ tr(errors.categoryName) }}</p>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label">
                {{ t('movementCategory.fields.autoImplement') }}
                <span class="field-hint-tip-wrap" tabindex="0">
                  <span class="field-hint-icon" aria-hidden="true">?</span>
                  <span class="field-hint-tooltip" role="tooltip">
                    {{ t('movementCategory.fields.autoImplementHint') }}
                  </span>
                </span>:
              </label>
              <div class="field-control">
                <div class="switch-value-row">
                  <YnSwitch v-model="form.autoImplement" />
                </div>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('movementCategory.fields.allowStudentApply') }}:</label>
              <div class="field-control">
                <div class="radio-group">
                  <label class="radio-item">
                    <input v-model="form.allowStudentApply" type="radio" :value="true" />
                    {{ t('common.yes') }}
                  </label>
                  <label class="radio-item">
                    <input v-model="form.allowStudentApply" type="radio" :value="false" />
                    {{ t('common.no') }}
                  </label>
                </div>
              </div>
            </div>

            <div class="course-handling-block">
              <div class="course-handling-first-row">
                <span class="course-handling-label">{{ t('movementCategory.fields.courseHandling') }}:</span>
                <label class="checkbox-row">
                  <input v-model="form.deleteOriginalCourseList" type="checkbox" />
                  <span>{{ t('movementCategory.fields.deleteOriginalCourseList') }}</span>
                </label>
              </div>
              <div class="course-handling-follow-rows">
                <label class="checkbox-row">
                  <input v-model="form.presetNewProgrammeBatchList" type="checkbox" />
                  <span>{{ t('movementCategory.fields.presetNewProgrammeBatchList') }}</span>
                </label>
                <label class="checkbox-row">
                  <input v-model="form.excludeGradedFromPreset" type="checkbox" />
                  <span>{{ t('movementCategory.fields.excludeGradedFromPreset') }}</span>
                </label>
              </div>
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
  max-width: 960px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
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
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  padding: 20px 28px 16px;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 40px;
}

.form-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  position: relative;
  z-index: 0;
}

.form-field:has(.field-hint-tip-wrap:hover),
.form-field:has(.field-hint-tip-wrap:focus-within) {
  z-index: 2;
}

.form-field-full {
  grid-column: 1 / -1;
}

.course-handling-block {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.course-handling-first-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.course-handling-label {
  flex-shrink: 0;
  width: 176px;
  padding-top: 2px;
  font-size: 13px;
  color: #374151;
  text-align: right;
  line-height: 1.4;
}

.course-handling-follow-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 184px;
}

.field-label {
  flex-shrink: 0;
  width: 176px;
  padding-top: 7px;
  font-size: 13px;
  color: #374151;
  text-align: right;
  line-height: 1.4;
  display: inline-flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 4px;
}

.field-label.required::before {
  content: '*';
  color: #ef4444;
  margin-right: 2px;
}

.field-control {
  flex: 1;
  min-width: 0;
}

.field-control-stacked {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-hint-tip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  outline: none;
  margin-top: 1px;
}

.field-hint-icon {
  width: 14px;
  height: 14px;
  border: 1px solid #9ca3af;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: help;
}

.field-hint-tooltip {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  width: 288px;
  max-width: min(288px, calc(100vw - 48px));
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  color: #374151;
  text-align: left;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  z-index: 10;
}

.field-hint-tip-wrap--end .field-hint-tooltip {
  left: auto;
  right: 0;
}

.field-hint-tip-wrap:hover .field-hint-tooltip,
.field-hint-tip-wrap:focus-within .field-hint-tooltip {
  opacity: 1;
  visibility: visible;
}

.switch-value-row {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.control-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
}

.control-input:disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.control-input.is-empty {
  color: #9ca3af;
}

.control-input.is-error {
  border-color: #ef4444;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #ef4444;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  cursor: pointer;
  min-width: 0;
}

.checkbox-row span {
  flex: 1;
  min-width: 0;
}

.checkbox-row input[type='checkbox'] {
  flex-shrink: 0;
  margin-top: 3px;
}

.radio-group {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 32px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px 14px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.btn-default {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-primary {
  border: none;
  background: #2563eb;
  color: #fff;
}
</style>
