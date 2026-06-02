<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  sltHourKeys,
  createEmptySLTHours,
  sumOutlineRowSLT,
  MAX_OUTLINE_CONTENT_LENGTH,
  validateOutlineForm,
} from '../../data/courses.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  clos: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})
const cloOpen = ref(false)

const isEditMode = computed(() => props.mode === 'edit')
const modalTitle = computed(() =>
  isEditMode.value
    ? tr('Edit Course Content Outline and Subtopics')
    : tr('Create Course Content Outline and Subtopics'),
)
const contentCount = computed(() => form.value.courseContent.length)
const totalSLT = computed(() =>
  sumOutlineRowSLT({
    physical: form.value.physical,
    online: form.value.online,
    nf2f: form.value.nf2f,
  }),
)
const cloDisplay = computed(() => (form.value.cloCodes.length ? form.value.cloCodes.join(',') : ''))

function createEmptyForm() {
  return {
    courseContent: '',
    cloCodes: [],
    physical: createEmptySLTHours(),
    online: createEmptySLTHours(),
    nf2f: 0,
  }
}

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    errors.value = {}
    cloOpen.value = false
    if (isEditMode.value && props.initialData) {
      form.value = {
        courseContent: props.initialData.courseContent,
        cloCodes: [...(props.initialData.cloCodes || [])],
        physical: { ...createEmptySLTHours(), ...(props.initialData.physical || {}) },
        online: { ...createEmptySLTHours(), ...(props.initialData.online || {}) },
        nf2f: Number(props.initialData.nf2f) || 0,
      }
    } else {
      form.value = createEmptyForm()
    }
  },
)

function toggleCLO(code) {
  if (form.value.cloCodes.includes(code)) {
    form.value.cloCodes = form.value.cloCodes.filter((item) => item !== code)
  } else {
    form.value.cloCodes = [...form.value.cloCodes, code]
  }
}

function closeDropdowns() {
  cloOpen.value = false
}

function handleSave() {
  const validationErrors = validateOutlineForm(form.value, props.clos)
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return
  emit('save', {
    courseContent: form.value.courseContent.trim(),
    cloCodes: [...form.value.cloCodes],
    physical: { ...form.value.physical },
    online: { ...form.value.online },
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

        <div class="modal-form" @click="closeDropdowns">
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Course Content:') }}</label>
            <div class="textarea-wrap">
              <textarea
                v-model="form.courseContent"
                class="form-textarea"
                :class="{ error: errors.courseContent }"
                rows="4"
                :maxlength="MAX_OUTLINE_CONTENT_LENGTH"
                :placeholder="t('common.pleaseInput')"
              />
              <span class="char-count">{{ contentCount }}/{{ MAX_OUTLINE_CONTENT_LENGTH }}</span>
            </div>
          </div>
          <p v-if="errors.courseContent" class="field-error">{{ tr(errors.courseContent) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('CLO:') }}</label>
            <div class="multi-select" :class="{ error: errors.cloCodes }" @click.stop>
              <button
                type="button"
                class="multi-select-trigger"
                :class="{ placeholder: !form.cloCodes.length }"
                @click.stop="cloOpen = !cloOpen"
              >
                <span>{{ cloDisplay || t('common.pleaseSelect') }}</span>
              </button>
              <div v-if="cloOpen" class="multi-select-panel">
                <p v-if="!clos.length" class="panel-empty">{{ t('common.noData') }}</p>
                <label v-for="item in clos" :key="item.id" class="multi-select-option">
                  <input type="checkbox" :checked="form.cloCodes.includes(item.cloCode)" @change="toggleCLO(item.cloCode)" />
                  <span>{{ item.cloCode }}</span>
                </label>
              </div>
            </div>
          </div>
          <p v-if="errors.cloCodes" class="field-error">{{ tr(errors.cloCodes) }}</p>

          <div class="section-head">
            <span class="section-bar"></span>
            <span class="section-title">{{ tr('Learning Time') }}</span>
            <span class="section-total">{{ tr('Total SLT:') }} <strong>{{ totalSLT }}</strong></span>
          </div>

          <div class="slt-block">
            <p class="slt-group-label">{{ tr('F2F:') }}</p>
            <div class="slt-grid">
              <div class="slt-col">
                <p class="slt-subtitle">{{ tr('Physical:') }}</p>
                <div v-for="key in sltHourKeys" :key="`p-${key}`" class="slt-field">
                  <label>{{ key === 'L' ? tr('Lecture:') : key === 'T' ? tr('Tutorial:') : key === 'P' ? tr('Practical:') : tr('Others:') }}</label>
                  <input v-model.number="form.physical[key]" type="number" min="0" step="1" class="form-input num-input" />
                </div>
              </div>
              <div class="slt-col">
                <p class="slt-subtitle">{{ tr('Online/ Technology-mediated:') }}</p>
                <div v-for="key in sltHourKeys" :key="`o-${key}`" class="slt-field">
                  <label>{{ key === 'L' ? tr('Lecture:') : key === 'T' ? tr('Tutorial:') : key === 'P' ? tr('Practical:') : tr('Others:') }}</label>
                  <input v-model.number="form.online[key]" type="number" min="0" step="1" class="form-input num-input" />
                </div>
              </div>
            </div>
          </div>

          <div class="form-row nf2f-row">
            <label class="form-label">{{ tr('NF2F:') }}</label>
            <input v-model.number="form.nf2f" type="number" min="0" step="1" class="form-input num-input" />
          </div>
          <p v-if="errors.sltHours" class="field-error">{{ tr(errors.sltHours) }}</p>
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
  max-width: 760px;
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
}

.form-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 12px;
  margin-bottom: 16px;
  align-items: start;
}

.form-label {
  font-size: 13px;
  color: #374151;
  text-align: right;
  padding-top: 8px;
}

.required {
  color: #ef4444;
}

.form-textarea,
.form-input {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-textarea {
  min-height: 96px;
  padding: 10px 12px 28px;
}

.form-input {
  height: 36px;
  padding: 0 12px;
}

.num-input {
  max-width: 120px;
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

.multi-select {
  position: relative;
}

.multi-select-trigger {
  width: 100%;
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  text-align: left;
  font-size: 13px;
}

.multi-select-trigger.placeholder {
  color: #bfbfbf;
}

.multi-select-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 10;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 6px 0;
  max-height: 180px;
  overflow: auto;
}

.multi-select-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
}

.panel-empty {
  margin: 0;
  padding: 8px 12px;
  color: #9ca3af;
  font-size: 13px;
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
  border-radius: 2px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.section-total {
  margin-left: auto;
  font-size: 13px;
  color: #374151;
}

.section-total strong {
  color: #2563eb;
}

.slt-block {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.slt-group-label {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.slt-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.slt-subtitle {
  margin: 0 0 10px;
  font-size: 13px;
  color: #374151;
}

.slt-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.nf2f-row {
  align-items: center;
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
  border-radius: 4px;
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

.error .multi-select-trigger,
.form-textarea.error {
  border-color: #ef4444;
}
</style>
