<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createEmptyConsentForm,
  movementTypeKeys,
  consentFormStudentTypes,
  consentStudentScopeOptions,
  getConsentProgrammeLevelOptions,
  validateConsentFormForm,
} from '../../data/consentForms.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const programmeLevelOptions = getConsentProgrammeLevelOptions()

const form = ref(createEmptyConsentForm())
const errors = ref({})

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() =>
  isEditMode.value ? t('consentForm.form.editTitle') : t('consentForm.form.createTitle'),
)

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        formName: props.initialData.formName || '',
        applicableStudentScope: props.initialData.applicableStudentScope || '',
        remark: props.initialData.remark || '',
      }
    } else {
      form.value = createEmptyConsentForm()
    }
  },
)

function fieldError(key) {
  return errors.value[key] ? 'is-error' : ''
}

function programmeLevelLabel(level) {
  const key = `consentForm.programmeLevel.${level}`
  const translated = t(key)
  return translated !== key ? translated : tr(level)
}

function studentTypeLabel(type) {
  const key = `consentForm.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : tr(type)
}

function studentScopeLabel(scope) {
  if (!scope) return ''
  const key = `consentForm.applicableStudentScope.${scope}`
  const translated = t(key)
  return translated !== key ? translated : scope
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  const result = validateConsentFormForm(
    form.value,
    props.initialData?.id ?? null,
    isEditMode.value ? 'edit' : 'create',
  )
  errors.value = result.errors
  if (!result.valid) return
  emit('save', { ...form.value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div
        class="modal-panel"
        :class="{ 'modal-panel-wide': !isEditMode }"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div v-if="isEditMode" class="form-stack">
            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.formName') }}</label>
              <input
                v-model="form.formName"
                type="text"
                :class="['control-input', fieldError('formName')]"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.formName" class="field-error">{{ tr(errors.formName) }}</p>
            </div>
            <div class="form-field">
              <label class="field-label">{{ t('consentForm.fields.applicableStudentScope') }}</label>
              <select
                v-model="form.applicableStudentScope"
                :class="['control-input', { 'is-empty': !form.applicableStudentScope }]"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in consentStudentScopeOptions" :key="opt" :value="opt">
                  {{ studentScopeLabel(opt) }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label class="field-label">{{ t('consentForm.fields.remark') }}</label>
              <textarea v-model="form.remark" rows="3" class="control-textarea" :placeholder="t('common.pleaseInput')" />
            </div>
          </div>

          <div v-else class="form-grid">
            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.formName') }}</label>
              <input
                v-model="form.formName"
                type="text"
                :class="['control-input', fieldError('formName')]"
                :placeholder="t('common.pleaseInput')"
              />
              <p v-if="errors.formName" class="field-error">{{ tr(errors.formName) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.movementType') }}</label>
              <select
                v-model="form.movementType"
                :class="['control-input', fieldError('movementType'), { 'is-empty': !form.movementType }]"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="key in movementTypeKeys" :key="key" :value="key">
                  {{ t(`consentForm.movementType.${key}`) }}
                </option>
              </select>
              <p v-if="errors.movementType" class="field-error">{{ tr(errors.movementType) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.studentType') }}</label>
              <select
                v-model="form.studentType"
                :class="['control-input', fieldError('studentType'), { 'is-empty': !form.studentType }]"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in consentFormStudentTypes" :key="opt" :value="opt">
                  {{ studentTypeLabel(opt) }}
                </option>
              </select>
              <p v-if="errors.studentType" class="field-error">{{ tr(errors.studentType) }}</p>
            </div>

            <div class="form-field">
              <label class="field-label required">{{ t('consentForm.fields.programmeLevel') }}</label>
              <select
                v-model="form.programmeLevel"
                :class="['control-input', fieldError('programmeLevel'), { 'is-empty': !form.programmeLevel }]"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in programmeLevelOptions" :key="opt.value" :value="opt.value">
                  {{ programmeLevelLabel(opt.label) }}
                </option>
              </select>
              <p v-if="errors.programmeLevel" class="field-error">{{ tr(errors.programmeLevel) }}</p>
            </div>

            <div class="form-field form-field-full">
              <label class="field-label">{{ t('consentForm.fields.applicableStudentScope') }}</label>
              <select
                v-model="form.applicableStudentScope"
                :class="['control-input', { 'is-empty': !form.applicableStudentScope }]"
              >
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in consentStudentScopeOptions" :key="opt" :value="opt">
                  {{ studentScopeLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="form-field form-field-full">
              <label class="field-label">{{ t('consentForm.fields.remark') }}</label>
              <textarea v-model="form.remark" rows="3" class="control-textarea" :placeholder="t('common.pleaseInput')" />
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
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.modal-panel-wide {
  max-width: 720px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title { margin: 0; font-size: 16px; font-weight: 600; }
.modal-close { border: none; background: transparent; font-size: 22px; color: #6b7280; cursor: pointer; }
.modal-body { padding: 20px; overflow-y: auto; }
.form-stack { display: flex; flex-direction: column; gap: 16px; }
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field-full { grid-column: 1 / -1; }
.field-label { font-size: 13px; font-weight: 500; color: #374151; }
.field-label.required::before { content: '* '; color: #ef4444; }
.control-input, .control-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
}
.control-input { height: 32px; padding: 0 10px; }
.control-input.is-empty { color: #9ca3af; }
.control-input.is-error { border-color: #ef4444; }
.control-textarea { padding: 8px 10px; resize: vertical; min-height: 72px; }
.field-error { margin: 0; font-size: 12px; color: #ef4444; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}
.btn { height: 32px; padding: 0 16px; border-radius: 4px; font-size: 13px; cursor: pointer; }
.btn-default { border: 1px solid #d1d5db; background: #fff; color: #374151; }
.btn-primary { border: none; background: #2563eb; color: #fff; }
</style>
