<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  continuousAssessmentOptions,
  finalAssessmentOptions,
  sumSimpleAssessmentSLT,
  validateContinuousAssessmentForm,
  validateFinalAssessmentForm,
} from '../../data/courses.js'

const props = defineProps({
  visible: Boolean,
  kind: { type: String, default: 'continuous' },
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})

const isContinuous = computed(() => props.kind === 'continuous')
const options = computed(() => (isContinuous.value ? continuousAssessmentOptions : finalAssessmentOptions))
const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() => {
  if (isContinuous.value) {
    return isEditMode.value ? tr('Edit Continuous Assessment') : tr('Create Continuous Assessment')
  }
  return isEditMode.value ? tr('Edit Final Assessment') : tr('Create Final Assessment')
})
const assessmentLabel = computed(() =>
  isContinuous.value ? tr('Continuous Assessment:') : tr('Final Assessment:'),
)
const totalSLT = computed(() => sumSimpleAssessmentSLT(form.value))

function createEmptyForm() {
  return {
    assessmentType: '',
    percentage: '',
    physical: 0,
    online: 0,
    nf2f: 0,
  }
}

watch(
  () => [props.visible, props.mode, props.initialData, props.kind],
  () => {
    if (!props.visible) return
    errors.value = {}
    if (isEditMode.value && props.initialData) {
      form.value = {
        assessmentType: props.initialData.assessmentType,
        percentage: String(props.initialData.percentage ?? ''),
        physical: Number(props.initialData.physical) || 0,
        online: Number(props.initialData.online) || 0,
        nf2f: Number(props.initialData.nf2f) || 0,
      }
    } else {
      form.value = createEmptyForm()
    }
  },
)

function handleSave() {
  const validationErrors = isContinuous.value
    ? validateContinuousAssessmentForm(form.value)
    : validateFinalAssessmentForm(form.value)
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return
  emit('save', {
    assessmentType: form.value.assessmentType,
    percentage: Number(form.value.percentage),
    physical: Number(form.value.physical) || 0,
    online: Number(form.value.online) || 0,
    nf2f: Number(form.value.nf2f) || 0,
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
      <div class="modal-panel" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-form">
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ assessmentLabel }}</label>
            <select
              v-model="form.assessmentType"
              class="form-select"
              :class="{ error: errors.assessmentType, 'is-empty': !form.assessmentType }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in options" :key="opt" :value="opt">{{ tr(opt) }}</option>
            </select>
          </div>
          <p v-if="errors.assessmentType" class="field-error">{{ tr(errors.assessmentType) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Percentage:') }}</label>
            <div class="percent-wrap">
              <input
                v-model="form.percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                class="form-input num-input"
                :class="{ error: errors.percentage }"
              />
              <span class="percent-suffix">%</span>
            </div>
          </div>
          <p v-if="errors.percentage" class="field-error">{{ tr(errors.percentage) }}</p>

          <div class="section-head">
            <span class="section-bar"></span>
            <span class="section-title">{{ tr('Learning Time') }}</span>
            <span class="section-total">{{ tr('Total SLT:') }} <strong>{{ totalSLT }}</strong></span>
          </div>

          <div class="slt-learning">
            <div class="slt-group">
              <p class="slt-group-label">{{ tr('F2F:') }}</p>
              <div class="slt-block f2f-block">
                <div class="slt-field-grid">
                  <div class="slt-field">
                    <label>{{ tr('Physical:') }}</label>
                    <input v-model.number="form.physical" type="number" min="0" step="1" class="form-input num-input" />
                  </div>
                  <div class="slt-field">
                    <label>{{ tr('Online/ Technology-mediated:') }}</label>
                    <input v-model.number="form.online" type="number" min="0" step="1" class="form-input num-input" />
                  </div>
                </div>
              </div>
            </div>

            <div class="slt-group nf2f-group">
              <p class="slt-group-label">{{ tr('NF2F:') }}</p>
              <div class="slt-field">
                <input v-model.number="form.nf2f" type="number" min="0" step="1" class="form-input num-input" />
              </div>
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
  z-index: 1100;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
}

.modal-form {
  padding: 20px 24px;
  overflow: auto;
  --form-label-width: 168px;
}

.form-row {
  display: grid;
  grid-template-columns: var(--form-label-width) 1fr;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.form-label {
  font-size: 13px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
}

.required {
  color: #ef4444;
}

.form-select,
.form-input {
  width: 100%;
  height: 36px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  padding: 0 12px;
  box-sizing: border-box;
}

.percent-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.percent-suffix {
  font-size: 13px;
  color: #374151;
}

.form-select.is-empty {
  color: #bfbfbf;
}

.form-input.error,
.form-select.error {
  border-color: #ef4444;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 12px;
}

.section-bar {
  width: 3px;
  height: 16px;
  background: #2563eb;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
}

.section-total {
  margin-left: auto;
  font-size: 13px;
}

.section-total strong {
  color: #2563eb;
}

.slt-learning {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.slt-group {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.slt-group-label {
  margin: 0;
  width: 48px;
  flex-shrink: 0;
  padding-top: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.nf2f-group {
  align-items: center;
}

.nf2f-group .slt-group-label {
  padding-top: 0;
}

.slt-block {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px 20px;
}

.f2f-block {
  flex: 1;
  min-width: 0;
}

.slt-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, max-content));
  gap: 10px 40px;
}

.slt-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.slt-field label {
  min-width: 68px;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
  color: #374151;
}

.num-input {
  width: 100px;
  max-width: 100px;
  flex-shrink: 0;
  text-align: left;
  background: #fff;
}

.field-error {
  margin: -8px 0 12px calc(var(--form-label-width) + 8px);
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px 16px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  min-width: 72px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d9d9d9;
}
</style>
