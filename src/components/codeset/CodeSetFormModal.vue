<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { flattenCodeSetLeaves, getCodeSetById, getParentCodeOptions, validateCodeEntry } from '../../data/codeSets.js'

const { t, tr } = useAppI18n()

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  allEntries: { type: Array, default: () => [] },
  defaultCodeSetId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  codeSetId: '',
  code: '',
  codeName: '',
  parentCode: '',
})
const errors = ref({})

const modalTitle = computed(() => (props.mode === 'edit' ? t('common.edit') : t('common.create')))
const codeSetOptions = computed(() => flattenCodeSetLeaves())

const parentOptions = computed(() =>
  getParentCodeOptions(props.allEntries, form.value.codeSetId, form.value.code.trim()),
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    errors.value = {}
    if (props.mode === 'edit' && props.initialData) {
      form.value = {
        codeSetId: props.initialData.codeSetId,
        code: props.initialData.code,
        codeName: props.initialData.codeName,
        parentCode: props.initialData.parentCode || '',
      }
    } else {
      form.value = {
        codeSetId: props.defaultCodeSetId || '',
        code: '',
        codeName: '',
        parentCode: '',
      }
    }
  },
)

function handleSave() {
  const payload = {
    codeSetId: form.value.codeSetId,
    code: form.value.code.trim(),
    codeName: form.value.codeName.trim(),
    parentCode: form.value.parentCode || '',
  }
  const validationErrors = validateCodeEntry(
    payload,
    props.allEntries,
    props.mode === 'edit' ? props.initialData?.id : null,
  )
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return

  const meta = getCodeSetById(payload.codeSetId)
  emit('save', {
    ...payload,
    nodeCode: meta?.nodeCode || '',
    nodeName: meta?.nodeName || '',
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
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-form">
          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ t('modal.codeSet') }}</label>
            <select
              v-model="form.codeSetId"
              class="form-input"
              :class="{ error: errors.codeSetId, 'is-empty': !form.codeSetId }"
            >
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in codeSetOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
            </select>
          </div>
          <p v-if="errors.codeSetId" class="field-error">{{ tr(errors.codeSetId) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Code:') }}</label>
            <input
              v-model="form.code"
              type="text"
              class="form-input"
              :class="{ error: errors.code }"
              :placeholder="t('common.pleaseInput')"
            />
          </div>
          <p v-if="errors.code" class="field-error">{{ tr(errors.code) }}</p>

          <div class="form-row">
            <label class="form-label"><span class="required">*</span> {{ tr('Code Name:') }}</label>
            <input
              v-model="form.codeName"
              type="text"
              class="form-input"
              :class="{ error: errors.codeName }"
              :placeholder="t('common.pleaseInput')"
            />
          </div>
          <p v-if="errors.codeName" class="field-error">{{ tr(errors.codeName) }}</p>

          <div class="form-row">
            <label class="form-label">{{ tr('Parent Code') }}:</label>
            <select v-model="form.parentCode" class="form-input" :class="{ 'is-empty': !form.parentCode }">
              <option value="">{{ t('common.pleaseSelect') }}</option>
              <option v-for="opt in parentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
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
  z-index: 1000;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding-bottom: 20px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-form {
  padding: 20px 24px 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.form-label {
  font-size: 14px;
  color: #374151;
  text-align: right;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
}

.form-input::placeholder {
  color: #9ca3af;
}

select.form-input.is-empty {
  color: #9ca3af;
}

select.form-input option {
  color: #111827;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.field-error {
  margin: -8px 0 10px 132px;
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 24px 0;
}

.btn {
  min-width: 88px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
