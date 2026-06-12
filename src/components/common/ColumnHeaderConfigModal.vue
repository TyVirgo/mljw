<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { validateColumnHeaderRows } from '../../utils/columnHeaderConfig.js'

const props = defineProps({
  visible: Boolean,
  rows: {
    type: Array,
    default: () => [],
  },
  sections: {
    type: Array,
    default: () => [],
  },
  defaultRows: {
    type: Array,
    default: () => [],
  },
  hintKey: {
    type: String,
    default: 'pages.common.columnHeaderConfigHint',
  },
  titleKey: {
    type: String,
    default: 'pages.common.columnHeaderConfigTitle',
  },
})

const emit = defineEmits(['close', 'save'])

const { t } = useAppI18n()

const draftRows = ref([])
const fieldErrors = ref({})
const validationMessage = ref('')

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    draftRows.value = props.rows.map((item) => ({ ...item }))
    fieldErrors.value = {}
    validationMessage.value = ''
  },
)

const sectionBlocks = computed(() =>
  props.sections.map((section) => ({
    ...section,
    rows: draftRows.value.filter((item) => item.group === section.id),
  })),
)

function fieldErrorKey(id, field) {
  return `${id}:${field}`
}

function hasFieldError(id, field) {
  return Boolean(fieldErrors.value[fieldErrorKey(id, field)])
}

function clearFieldError(id, field) {
  const key = fieldErrorKey(id, field)
  if (!fieldErrors.value[key]) return
  const next = { ...fieldErrors.value }
  delete next[key]
  fieldErrors.value = next
  if (!Object.keys(next).length) {
    validationMessage.value = ''
  }
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function handleReset() {
  draftRows.value = props.defaultRows.map((item) => ({ ...item }))
  fieldErrors.value = {}
  validationMessage.value = ''
}

function handleSave() {
  const errors = validateColumnHeaderRows(draftRows.value)
  if (errors.length) {
    const nextErrors = {}
    errors.forEach(({ id, field }) => {
      nextErrors[fieldErrorKey(id, field)] = true
    })
    fieldErrors.value = nextErrors
    validationMessage.value = t('pages.common.columnHeaderValidationFailed')
    return
  }

  fieldErrors.value = {}
  validationMessage.value = ''
  emit(
    'save',
    draftRows.value.map((item) => ({
      ...item,
      nameZh: String(item.nameZh ?? '').trim(),
      nameEn: String(item.nameEn ?? '').trim(),
      nameMs: String(item.nameMs ?? '').trim(),
    })),
  )
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t(titleKey) }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p class="intro-text">{{ t(hintKey) }}</p>
          <p v-if="validationMessage" class="validation-banner" role="alert">{{ validationMessage }}</p>

          <section v-for="section in sectionBlocks" :key="section.id" class="table-group">
            <h3 class="group-title">{{ t(section.labelKey) }}</h3>
            <div class="table-scroll">
              <table class="config-table">
                <thead>
                  <tr>
                    <th class="col-id">{{ t('pages.common.columnHeaderFieldId') }}</th>
                    <th>{{ t('pages.common.columnHeaderNameZh') }}</th>
                    <th>{{ t('pages.common.columnHeaderNameEn') }}</th>
                    <th>{{ t('pages.common.columnHeaderNameMs') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in section.rows" :key="row.id">
                    <td class="col-id"><code>{{ row.id }}</code></td>
                    <td v-for="field in ['nameZh', 'nameEn', 'nameMs']" :key="`${row.id}-${field}`" class="cell-wrap">
                      <input
                        v-model="row[field]"
                        type="text"
                        class="cell-input"
                        :class="{ error: hasFieldError(row.id, field) }"
                        @input="clearFieldError(row.id, field)"
                      />
                      <span v-if="hasFieldError(row.id, field)" class="cell-error">
                        {{ t('pages.common.columnHeaderFieldRequired') }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleReset">
            {{ t('pages.common.columnHeaderResetDefault') }}
          </button>
          <div class="footer-actions">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
          </div>
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
  max-width: 920px;
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
  padding: 12px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
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
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 24px 20px;
}

.intro-text {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.validation-banner {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  line-height: 1.5;
}

.table-group + .table-group {
  margin-top: 20px;
}

.group-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.table-scroll {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.config-table th,
.config-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: top;
}

.config-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.config-table tbody tr:last-child td {
  border-bottom: none;
}

.col-id {
  width: 168px;
  white-space: nowrap;
}

.col-id code {
  font-size: 12px;
  color: #6b7280;
}

.cell-wrap {
  min-width: 120px;
}

.cell-input {
  width: 100%;
  min-width: 120px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  box-sizing: border-box;
}

.cell-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.cell-input.error {
  border-color: #ef4444;
}

.cell-input.error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
}

.cell-error {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover {
  background: #f9fafb;
}
</style>
