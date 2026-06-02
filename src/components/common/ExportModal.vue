<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const { t } = useAppI18n()

const props = defineProps({
  visible: Boolean,
  fields: {
    type: Array,
    default: () => [],
  },
  hasSelectedRows: {
    type: Boolean,
    default: false,
  },
  scopeOnly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'confirm'])

const availableFields = ref([])
const selectedFields = ref([])
const availableChecked = ref([])
const selectedChecked = ref([])
const exportScope = ref('currentPage')
const toastVisible = ref(false)
let toastTimer = null

function showToast(message) {
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

const availableAllChecked = computed({
  get() {
    return availableFields.value.length > 0 && availableChecked.value.length === availableFields.value.length
  },
  set(checked) {
    availableChecked.value = checked ? availableFields.value.map((item) => item.key) : []
  },
})

const selectedAllChecked = computed({
  get() {
    return selectedFields.value.length > 0 && selectedChecked.value.length === selectedFields.value.length
  },
  set(checked) {
    selectedChecked.value = checked ? selectedFields.value.map((item) => item.key) : []
  },
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedFields.value = props.fields.map((item) => ({ ...item }))
    availableFields.value = []
    availableChecked.value = []
    selectedChecked.value = []
    exportScope.value = 'currentPage'
  },
)

function toggleAvailable(key) {
  const index = availableChecked.value.indexOf(key)
  if (index === -1) availableChecked.value.push(key)
  else availableChecked.value.splice(index, 1)
}

function toggleSelected(key) {
  const index = selectedChecked.value.indexOf(key)
  if (index === -1) selectedChecked.value.push(key)
  else selectedChecked.value.splice(index, 1)
}

function moveToSelected() {
  if (!availableChecked.value.length) return
  const moving = availableFields.value.filter((item) => availableChecked.value.includes(item.key))
  selectedFields.value = [...selectedFields.value, ...moving]
  availableFields.value = availableFields.value.filter((item) => !availableChecked.value.includes(item.key))
  availableChecked.value = []
}

function moveToAvailable() {
  if (!selectedChecked.value.length) return
  const moving = selectedFields.value.filter((item) => selectedChecked.value.includes(item.key))
  availableFields.value = [...availableFields.value, ...moving]
  selectedFields.value = selectedFields.value.filter((item) => !selectedChecked.value.includes(item.key))
  selectedChecked.value = []
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

function handleConfirm() {
  if (props.scopeOnly) {
    emit('confirm', {
      selectedFields: props.fields.map((item) => item.key),
      exportScope: exportScope.value,
    })
    return
  }
  if (!selectedFields.value.length) {
    window.alert(t('common.selectExportField'))
    return
  }
  if (exportScope.value === 'selectedRows' && !props.hasSelectedRows) {
    showToast(t('exportModal.selectRowsToast'))
    return
  }
  emit('confirm', {
    selectedFields: selectedFields.value.map((item) => item.key),
    exportScope: exportScope.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="export-toast">
      <div v-if="toastVisible" class="export-toast" role="alert">
        <span class="export-toast-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#e6a23c" />
            <path d="M12 7v7" stroke="#fff" stroke-width="2" stroke-linecap="round" />
            <circle cx="12" cy="17" r="1" fill="#fff" />
          </svg>
        </span>
        <span class="export-toast-text">{{ t('exportModal.selectRowsToast') }}</span>
      </div>
    </Transition>
    <div v-if="visible" class="export-overlay" @click="handleOverlayClick">
      <div class="export-panel" :class="{ 'export-panel-scope-only': scopeOnly }" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <div class="export-header">
          <h2 id="export-title" class="export-title">{{ t('exportModal.title') }}</h2>
          <button type="button" class="export-close" :aria-label="t('common.close')" @click="emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div v-if="!scopeOnly" class="transfer-wrap">
          <div class="transfer-panel">
            <div class="transfer-head">
              <label class="transfer-check">
                <input v-model="availableAllChecked" type="checkbox" :disabled="!availableFields.length" />
              </label>
              <span class="transfer-count">{{ availableChecked.length }} {{ t('exportModal.item') }}</span>
              <span class="transfer-label">{{ t('exportModal.availableFields') }}</span>
            </div>
            <div class="transfer-body">
              <div v-if="!availableFields.length" class="transfer-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span>{{ t('exportModal.noData') }}</span>
              </div>
              <label
                v-for="item in availableFields"
                :key="item.key"
                class="transfer-item"
              >
                <input
                  type="checkbox"
                  :checked="availableChecked.includes(item.key)"
                  @change="toggleAvailable(item.key)"
                />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>

          <div class="transfer-actions">
            <button type="button" class="transfer-btn" :disabled="!availableChecked.length" @click="moveToSelected">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button type="button" class="transfer-btn" :disabled="!selectedChecked.length" @click="moveToAvailable">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          <div class="transfer-panel">
            <div class="transfer-head">
              <label class="transfer-check">
                <input v-model="selectedAllChecked" type="checkbox" :disabled="!selectedFields.length" />
              </label>
              <span class="transfer-count">{{ selectedChecked.length }} {{ t('exportModal.items') }}</span>
              <span class="transfer-label">{{ t('exportModal.selectedFields') }}</span>
            </div>
            <div class="transfer-body">
              <div v-if="!selectedFields.length" class="transfer-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span>{{ t('exportModal.noData') }}</span>
              </div>
              <label
                v-for="item in selectedFields"
                :key="item.key"
                class="transfer-item"
              >
                <input
                  type="checkbox"
                  :checked="selectedChecked.includes(item.key)"
                  @change="toggleSelected(item.key)"
                />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="export-setting" :class="{ 'export-setting-scope-only': scopeOnly }">
          <span class="setting-label"><span class="required">*</span> {{ t('exportModal.exportSetting') }}</span>
          <div class="setting-options" :class="{ 'setting-options-column': scopeOnly }">
            <label class="setting-option">
              <input v-model="exportScope" type="radio" value="currentPage" />
              <span>{{ t('exportModal.currentPage') }}</span>
            </label>
            <label class="setting-option">
              <input v-model="exportScope" type="radio" value="allResults" />
              <span>{{ scopeOnly ? t('exportModal.allData') : t('exportModal.allResults') }}</span>
            </label>
            <label v-if="!scopeOnly" class="setting-option">
              <input v-model="exportScope" type="radio" value="selectedRows" />
              <span>{{ t('exportModal.selectedRows') }}</span>
            </label>
          </div>
        </div>

        <div class="export-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">{{ t('exportModal.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">{{ t('exportModal.confirm') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.export-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}

.export-panel {
  width: 100%;
  max-width: 760px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 20px 24px 24px;
}

.export-panel-scope-only {
  max-width: 520px;
}

.export-setting-scope-only {
  margin-bottom: 8px;
}

.setting-options-column {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.export-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.export-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}

.export-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.export-close svg {
  width: 18px;
  height: 18px;
}

.transfer-wrap {
  display: flex;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 20px;
}

.transfer-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.transfer-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  color: #374151;
}

.transfer-check {
  display: flex;
  align-items: center;
}

.transfer-check input {
  width: 14px;
  height: 14px;
  accent-color: #2563eb;
}

.transfer-count {
  color: #6b7280;
}

.transfer-label {
  margin-left: auto;
  font-weight: 500;
}

.transfer-body {
  height: 220px;
  overflow-y: auto;
  padding: 8px 0;
}

.transfer-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.transfer-empty svg {
  width: 40px;
  height: 40px;
}

.transfer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.transfer-item:hover {
  background: #f9fafb;
}

.transfer-item input {
  width: 14px;
  height: 14px;
  accent-color: #2563eb;
  flex-shrink: 0;
}

.transfer-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.transfer-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  background: #fff;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.transfer-btn:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.transfer-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.transfer-btn svg {
  width: 16px;
  height: 16px;
}

.export-setting {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-bottom: 24px;
}

.setting-label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.setting-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}

.setting-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.setting-option input {
  accent-color: #2563eb;
}

.export-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  min-width: 96px;
  height: 36px;
  padding: 0 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.btn-default {
  color: #2563eb;
  background: #fff;
  border: 1px solid #2563eb;
}

.btn-default:hover {
  background: #eff6ff;
}

.btn-primary {
  color: #fff;
  background: #2563eb;
  border: 1px solid #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.export-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 14px;
  color: #303133;
}

.export-toast-icon {
  display: flex;
  flex-shrink: 0;
}

.export-toast-icon svg {
  width: 20px;
  height: 20px;
}

.export-toast-text {
  line-height: 1.4;
}

.export-toast-enter-active,
.export-toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.export-toast-enter-from,
.export-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
</style>
