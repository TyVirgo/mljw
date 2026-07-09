<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import YnSwitch from '../common/YnSwitch.vue'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialName: { type: String, default: '' },
  initialAllowStudentApply: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const { t } = useAppI18n()

const reasonName = ref('')
const allowStudentApply = ref(false)
const error = ref('')

const modalTitle = computed(() =>
  props.mode === 'edit' ? t('movementCategory.reason.editTitle') : t('movementCategory.reason.createTitle'),
)

const switchOnLabel = computed(() => t('common.yes'))
const switchOffLabel = computed(() => t('common.no'))

watch(
  () => [props.visible, props.mode, props.initialName, props.initialAllowStudentApply],
  () => {
    if (!props.visible) return
    reasonName.value = props.initialName || ''
    allowStudentApply.value = Boolean(props.initialAllowStudentApply)
    error.value = ''
  },
)

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleSave() {
  if (!reasonName.value.trim()) {
    error.value = t('movementCategory.reason.nameRequired')
    return
  }
  emit('save', {
    reasonName: reasonName.value.trim(),
    allowStudentApply: allowStudentApply.value,
  })
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
          <label class="field-label required">{{ t('movementCategory.reason.nameLabel') }}</label>
          <input
            v-model="reasonName"
            type="text"
            :class="['field-input', { 'is-error': error && !reasonName.trim() }]"
            :placeholder="t('common.pleaseInput')"
            @keyup.enter="handleSave"
          />

          <label class="field-label allow-student-label">{{ t('movementCategory.reason.allowStudentApply') }}</label>
          <div class="switch-row">
            <YnSwitch
              v-model="allowStudentApply"
              :on-label="switchOnLabel"
              :off-label="switchOffLabel"
            />
          </div>

          <p v-if="error" class="field-error">{{ error }}</p>
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
  z-index: 1200;
  padding: 24px;
}
.modal-panel {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: visible;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
  background: #fff;
}
.modal-title { margin: 0; font-size: 15px; font-weight: 600; }
.modal-close { border: none; background: transparent; font-size: 22px; color: #6b7280; cursor: pointer; }
.modal-body {
  padding: 18px;
  overflow: visible;
}
.field-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
.field-label.required::before { content: '* '; color: #ef4444; }
.allow-student-label { margin-top: 16px; }
.switch-row {
  display: flex;
  align-items: center;
  min-height: 36px;
}
.field-input {
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}
.field-input.is-error { border-color: #ef4444; }
.field-error { margin: 10px 0 0; font-size: 12px; color: #ef4444; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 8px 8px;
  background: #fff;
}
.btn { height: 32px; padding: 0 14px; border-radius: 6px; font-size: 13px; cursor: pointer; }
.btn-default { border: 1px solid #d1d5db; background: #fff; }
.btn-primary { border: none; background: #2563eb; color: #fff; }
</style>
