<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  bloomTaxonomyOptions,
  cloTeachingMethodOptions,
  cloAssessmentMethodOptions,
  MAX_CLO_OUTCOME_LENGTH,
  validateCLOForm,
  formatMethodList,
  generateNextCLOCode,
} from '../../data/courses.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  allClos: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})
const teachingOpen = ref(false)
const assessmentOpen = ref(false)

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() => (isEditMode.value ? t('common.edit') : t('common.create')))
const outcomeCount = computed(() => form.value.outcome.length)
const teachingDisplay = computed(() => formatMethodList(form.value.teachingMethods, tr))
const assessmentDisplay = computed(() => formatMethodList(form.value.assessmentMethods, tr))

function createEmptyForm() {
  return {
    cloCode: '',
    outcome: '',
    bloomLevel: '',
    teachingMethods: [],
    assessmentMethods: [],
  }
}

watch(
  () => [props.visible, props.mode, props.initialData, props.allClos],
  () => {
    if (!props.visible) return
    errors.value = {}
    teachingOpen.value = false
    assessmentOpen.value = false
    if (isEditMode.value && props.initialData) {
      form.value = {
        cloCode: props.initialData.cloCode,
        outcome: props.initialData.outcome,
        bloomLevel: props.initialData.bloomLevel,
        teachingMethods: [...(props.initialData.teachingMethods || [])],
        assessmentMethods: [...(props.initialData.assessmentMethods || [])],
      }
    } else {
      form.value = {
        ...createEmptyForm(),
        cloCode: generateNextCLOCode(props.allClos),
      }
    }
  },
)

function toggleMethod(listKey, value) {
  const list = form.value[listKey]
  if (list.includes(value)) {
    form.value[listKey] = list.filter((item) => item !== value)
  } else {
    form.value[listKey] = [...list, value]
  }
}

function closeDropdowns() {
  teachingOpen.value = false
  assessmentOpen.value = false
}

function handleSave() {
  const validationErrors = validateCLOForm(
    form.value,
    props.allClos,
    isEditMode.value ? props.initialData?.id : null,
  )
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return
  emit('save', {
    cloCode: form.value.cloCode.trim(),
    outcome: form.value.outcome.trim(),
    bloomLevel: form.value.bloomLevel,
    teachingMethods: [...form.value.teachingMethods],
    assessmentMethods: [...form.value.assessmentMethods],
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
      <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-form" @click="closeDropdowns">
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('CLO:') }}</label>
            <input
              v-model="form.cloCode"
              type="text"
              class="form-input readonly"
              :class="{ error: errors.cloCode }"
              readonly
              tabindex="-1"
            />
          </div>
          <p v-if="errors.cloCode" class="field-error">{{ tr(errors.cloCode) }}</p>

          <div class="form-row form-row-top">
            <label class="form-label"><span class="required">*</span> {{ tr('Outcome:') }}</label>
            <div class="textarea-wrap">
              <textarea
                v-model="form.outcome"
                class="form-textarea"
                :class="{ error: errors.outcome }"
                rows="4"
                :maxlength="MAX_CLO_OUTCOME_LENGTH"
                :placeholder="t('common.pleaseInput')"
              />
              <span class="char-count">{{ outcomeCount }}/{{ MAX_CLO_OUTCOME_LENGTH }}</span>
            </div>
          </div>
          <p v-if="errors.outcome" class="field-error">{{ tr(errors.outcome) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr("Bloom's Taxonomy Level:") }}</label>
            <select
              v-model="form.bloomLevel"
              class="form-select"
              :class="{ error: errors.bloomLevel, 'is-empty': !form.bloomLevel }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in bloomTaxonomyOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <p v-if="errors.bloomLevel" class="field-error">{{ tr(errors.bloomLevel) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Teaching Methods:') }}</label>
            <div class="multi-select" :class="{ error: errors.teachingMethods }" @click.stop>
              <button
                type="button"
                class="multi-select-trigger"
                :class="{ placeholder: !form.teachingMethods.length }"
                @click.stop="assessmentOpen = false; teachingOpen = !teachingOpen"
              >
                <span class="multi-select-text">{{ teachingDisplay === '--' ? t('common.pleaseSelect') : teachingDisplay }}</span>
                <svg class="multi-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div v-if="teachingOpen" class="multi-select-panel">
                <label v-for="opt in cloTeachingMethodOptions" :key="opt" class="multi-select-option">
                  <input
                    type="checkbox"
                    :checked="form.teachingMethods.includes(opt)"
                    @change="toggleMethod('teachingMethods', opt)"
                  />
                  <span>{{ tr(opt) }}</span>
                </label>
              </div>
            </div>
          </div>
          <p v-if="errors.teachingMethods" class="field-error">{{ tr(errors.teachingMethods) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Assessment Methods:') }}</label>
            <div class="multi-select" :class="{ error: errors.assessmentMethods }" @click.stop>
              <button
                type="button"
                class="multi-select-trigger"
                :class="{ placeholder: !form.assessmentMethods.length }"
                @click.stop="teachingOpen = false; assessmentOpen = !assessmentOpen"
              >
                <span class="multi-select-text">{{ assessmentDisplay === '--' ? t('common.pleaseSelect') : assessmentDisplay }}</span>
                <svg class="multi-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div v-if="assessmentOpen" class="multi-select-panel">
                <label v-for="opt in cloAssessmentMethodOptions" :key="opt" class="multi-select-option">
                  <input
                    type="checkbox"
                    :checked="form.assessmentMethods.includes(opt)"
                    @change="toggleMethod('assessmentMethods', opt)"
                  />
                  <span>{{ tr(opt) }}</span>
                </label>
              </div>
            </div>
          </div>
          <p v-if="errors.assessmentMethods" class="field-error">{{ tr(errors.assessmentMethods) }}</p>
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
  max-width: 720px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
  color: #111827;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  line-height: 1;
}

.modal-form {
  padding: 20px 24px 8px;
  overflow: auto;
}

.form-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.form-row-top {
  align-items: start;
}

.form-label {
  font-size: 13px;
  color: #374151;
  text-align: right;
  padding-right: 4px;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
  color: #111827;
}

.form-input,
.form-select {
  height: 36px;
  padding: 0 12px;
}

.form-textarea {
  min-height: 96px;
  padding: 10px 12px 28px;
  resize: vertical;
}

.form-input.error,
.form-select.error,
.form-textarea.error,
.multi-select.error .multi-select-trigger {
  border-color: #ef4444;
}

.form-input.readonly {
  background: #f5f5f5;
  color: #6b7280;
  cursor: not-allowed;
}

.form-select.is-empty {
  color: #bfbfbf;
}

.multi-select {
  position: relative;
}

.multi-select-trigger {
  width: 100%;
  min-height: 36px;
  padding: 6px 32px 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  text-align: left;
  display: flex;
  align-items: center;
  position: relative;
}

.multi-select-trigger.placeholder .multi-select-text {
  color: #bfbfbf;
}

.multi-select-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}

.multi-select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #9ca3af;
  pointer-events: none;
}

.multi-select-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 20;
  max-height: 220px;
  overflow: auto;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 6px 0;
}

.multi-select-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.multi-select-option:hover {
  background: #f5f5f5;
}

.textarea-wrap {
  position: relative;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.field-error {
  margin: -8px 0 12px 212px;
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
  font-weight: 500;
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
