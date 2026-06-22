<script setup>
import { ref, watch, computed } from 'vue'
import YnSwitch from '../common/YnSwitch.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createEmptyMovementCategoryForm,
  studentStatusOptions,
  movementCategoryStudentTypes,
  getCategoriesForStatus,
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
const categoryOptions = computed(() => getCategoriesForStatus(form.value.studentStatus))
const modalTitle = computed(() =>
  isEditMode.value ? t('movementCategory.form.editTitle') : t('movementCategory.form.createTitle'),
)

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        categoryCode: props.initialData.categoryCode || '',
        categoryName: props.initialData.categoryName || '',
        studentStatus: props.initialData.studentStatus || '',
        category: props.initialData.category || '',
        studentType: props.initialData.studentType || '',
        allowStudentApply: props.initialData.allowStudentApply !== false,
        modifyStudentStatus: props.initialData.modifyStudentStatus === true,
        modifyStudentType: props.initialData.modifyStudentType === true,
        autoImplement: props.initialData.autoImplement === true,
      }
    } else {
      form.value = createEmptyMovementCategoryForm()
    }
  },
)

function onStudentStatusChange() {
  const allowed = getCategoriesForStatus(form.value.studentStatus)
  if (form.value.category && !allowed.includes(form.value.category)) {
    form.value.category = ''
  }
}

function fieldError(key) {
  return errors.value[key] ? 'is-error' : ''
}

function studentTypeLabel(type) {
  const key = `movementCategory.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
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
              <label class="field-label required">{{ t('movementCategory.fields.studentStatus') }}:</label>
              <div class="field-control">
                <select
                  v-model="form.studentStatus"
                  :class="['control-input', fieldError('studentStatus'), { 'is-empty': !form.studentStatus }]"
                  @change="onStudentStatusChange"
                >
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in studentStatusOptions" :key="opt" :value="opt">
                    {{ t(`movementCategory.studentStatus.${opt}`) }}
                  </option>
                </select>
                <p v-if="errors.studentStatus" class="field-error">{{ tr(errors.studentStatus) }}</p>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('movementCategory.fields.category') }}:</label>
              <div class="field-control">
                <select
                  v-model="form.category"
                  :class="['control-input', fieldError('category'), { 'is-empty': !form.category }]"
                  :disabled="!form.studentStatus"
                >
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in categoryOptions" :key="opt" :value="opt">
                    {{ t(`movementCategory.trackCategory.${opt}`) }}
                  </option>
                </select>
                <p v-if="errors.category" class="field-error">{{ tr(errors.category) }}</p>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('movementCategory.fields.studentType') }}:</label>
              <div class="field-control">
                <select
                  v-model="form.studentType"
                  :class="['control-input', fieldError('studentType'), { 'is-empty': !form.studentType }]"
                  :disabled="isEditMode"
                >
                  <option value="">{{ t('common.pleaseSelect') }}</option>
                  <option v-for="opt in movementCategoryStudentTypes" :key="opt" :value="opt">
                    {{ studentTypeLabel(opt) }}
                  </option>
                </select>
                <p v-if="errors.studentType" class="field-error">{{ tr(errors.studentType) }}</p>
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
          </div>

          <div class="switch-section">
            <div class="form-field form-field-switch">
              <label class="field-label">{{ t('movementCategory.fields.modifyStudentStatus') }}:</label>
              <div class="field-control switch-control">
                <YnSwitch v-model="form.modifyStudentStatus" />
                <p class="field-hint">{{ t('movementCategory.fields.modifyStudentStatusHint') }}</p>
              </div>
            </div>

            <div class="form-field form-field-switch">
              <label class="field-label">{{ t('movementCategory.fields.modifyStudentType') }}:</label>
              <div class="field-control switch-control">
                <YnSwitch v-model="form.modifyStudentType" />
                <p class="field-hint">{{ t('movementCategory.fields.modifyStudentTypeHint') }}</p>
              </div>
            </div>

            <div class="form-field form-field-switch">
              <label class="field-label">{{ t('movementCategory.fields.autoImplement') }}:</label>
              <div class="field-control switch-control">
                <YnSwitch v-model="form.autoImplement" />
                <p class="field-hint">{{ t('movementCategory.fields.autoImplementHint') }}</p>
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
  max-width: 820px;
  max-height: 90vh;
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
  padding: 20px 24px;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;
}

.form-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.field-label {
  flex-shrink: 0;
  width: 132px;
  padding-top: 7px;
  font-size: 13px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
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

.control-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
}

.control-input.is-empty {
  color: #9ca3af;
}

.control-input:disabled {
  background: #f9fafb;
  color: #6b7280;
}

.control-input.is-error {
  border-color: #ef4444;
}

.field-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #ef4444;
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
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
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

.switch-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field-switch {
  align-items: center;
}

.switch-control {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  min-height: 32px;
  flex: 1;
  min-width: 0;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}
</style>
