<script setup>
import { ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createEmptyQualification,
  createAttachmentId,
  countryOptions,
  formatAttachmentSize,
  formatUploadTimestamp,
} from '../../data/lecturers.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const { t, tr } = useAppI18n()

const editingId = ref(null)
const draft = ref(null)
const fileInputRef = ref(null)
const pendingQualId = ref(null)

const yearOptions = Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() - i))

function updateList(list) {
  emit('update:modelValue', list)
}

function startAdd() {
  if (editingId.value !== null) return
  const item = createEmptyQualification()
  draft.value = { ...item }
  editingId.value = item.id
  pendingQualId.value = item.id
  updateList([...props.modelValue, item])
}

function startEdit(item) {
  if (editingId.value !== null && editingId.value !== item.id) return
  editingId.value = item.id
  draft.value = {
    ...item,
    attachments: (item.attachments || []).map((a) => ({ ...a })),
  }
}

function cancelEdit() {
  if (pendingQualId.value) {
    updateList(props.modelValue.filter((q) => q.id !== pendingQualId.value))
  }
  editingId.value = null
  draft.value = null
  pendingQualId.value = null
}

function saveEdit() {
  if (!draft.value) return
  if (!draft.value.name.trim()) {
    window.alert(tr('Please enter Name of Qualification.'))
    return
  }
  updateList(
    props.modelValue.map((q) =>
      q.id === editingId.value
        ? {
            ...draft.value,
            name: draft.value.name.trim(),
            institution: draft.value.institution.trim(),
            country: draft.value.country,
            year: draft.value.year,
            remarks: draft.value.remarks.trim(),
          }
        : q,
    ),
  )
  editingId.value = null
  draft.value = null
  pendingQualId.value = null
}

function removeItem(id) {
  if (!window.confirm(tr('Delete this qualification?'))) return
  updateList(props.modelValue.filter((q) => q.id !== id))
  if (editingId.value === id) cancelEdit()
}

function triggerUpload() {
  fileInputRef.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file || !draft.value) return
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    window.alert(tr('Supported file extensions: .pdf'))
    event.target.value = ''
    return
  }
  draft.value.attachments = [
    ...(draft.value.attachments || []),
    {
      id: createAttachmentId(),
      fileName: file.name,
      size: file.size,
      uploadedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.'),
    },
  ]
  event.target.value = ''
}

function removeAttachment(attachId) {
  if (!draft.value) return
  draft.value.attachments = draft.value.attachments.filter((a) => a.id !== attachId)
}

function isEditing(id) {
  return editingId.value === id
}
</script>

<template>
  <div class="qual-section">
    <button type="button" class="btn-add" @click="startAdd">{{ tr('+ Add') }}</button>
    <input ref="fileInputRef" type="file" accept=".pdf" hidden @change="handleFileChange" />

    <div v-if="!modelValue.length && editingId === null" class="empty-hint">{{ tr('No qualifications added yet.') }}</div>

    <div v-for="(item, index) in modelValue" :key="item.id" class="qual-card">
      <div class="card-header">
        <h3 class="card-title"><span class="bar" />{{ tr('Qualification') }} {{ index + 1 }}</h3>
        <div v-if="isEditing(item.id)" class="card-actions">
          <button type="button" class="btn-save" @click="saveEdit">{{ t('common.save') }}</button>
        </div>
        <div v-else class="card-actions">
          <button type="button" class="icon-btn" :title="t('common.edit')" @click="startEdit(item)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button type="button" class="icon-btn" :title="t('common.delete')" @click="removeItem(item.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
      </div>

      <template v-if="isEditing(item.id) && draft">
        <div class="form-grid">
          <div class="form-item">
            <label>{{ tr('Name of Qualification:') }}</label>
            <input v-model="draft.name" type="text" :placeholder="t('common.pleaseInput')" />
          </div>
          <div class="form-item">
            <label>{{ tr('Name of Awarding Institution:') }}</label>
            <input v-model="draft.institution" type="text" :placeholder="t('common.pleaseInput')" />
          </div>
          <div class="form-item">
            <label>{{ tr('Awarding country:') }}</label>
            <select v-model="draft.country">
              <option value="">{{ tr('please select') }}</option>
              <option v-for="opt in countryOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
            </select>
          </div>
          <div class="form-item">
            <label>{{ tr('Year of Award:') }}</label>
            <select v-model="draft.year">
              <option value="">{{ tr('please select') }}</option>
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="form-item full">
            <label>{{ tr('Remarks') }}:</label>
            <div class="textarea-wrap">
              <textarea v-model="draft.remarks" maxlength="100" rows="3" :placeholder="t('common.pleaseInput')" />
              <span class="char-count">{{ draft.remarks.length }}/100</span>
            </div>
          </div>
          <div class="form-item full">
            <label>{{ tr('Attachment') }}:</label>
            <div>
              <button type="button" class="btn-upload" @click="triggerUpload">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                {{ tr('Upload File') }}
              </button>
              <p class="upload-hint">{{ tr('Upload scroll and transcript. Supported file extensions: .pdf') }}</p>
              <div v-for="att in draft.attachments" :key="att.id" class="file-row">
                <span>{{ att.fileName }} ({{ formatAttachmentSize(att.size) }})</span>
                <button type="button" class="link-remove" @click="removeAttachment(att.id)">{{ tr('Remove') }}</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button type="button" class="icon-btn" :title="t('common.cancel')" @click="cancelEdit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="detail-grid">
          <div class="detail-row"><span class="label">{{ tr('Name of Qualification:') }}</span><span>{{ item.name || tr('--') }}</span></div>
          <div class="detail-row"><span class="label">{{ tr('Name of Awarding Institution:') }}</span><span>{{ item.institution || tr('--') }}</span></div>
          <div class="detail-row"><span class="label">{{ tr('Awarding country:') }}</span><span>{{ item.country ? tr(item.country) : tr('--') }}</span></div>
          <div class="detail-row"><span class="label">{{ tr('Year of Award:') }}</span><span>{{ item.year || tr('--') }}</span></div>
          <div class="detail-row full"><span class="label">{{ tr('Remarks') }}:</span><span>{{ item.remarks || tr('--') }}</span></div>
        </div>
        <div v-if="item.attachments?.length" class="attachments">
          <div v-for="att in item.attachments" :key="att.id" class="file-card">
            <span class="file-icon">DOC</span>
            <div class="file-info">
              <span class="file-name">{{ att.fileName }}</span>
              <span class="file-meta">{{ formatAttachmentSize(att.size) }}, {{ tr('Uploaded at:') }} {{ formatUploadTimestamp(att.uploadedAt) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.qual-section { padding: 0 4px; }
.btn-add {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: #2563eb;
  color: #fff;
  margin-bottom: 16px;
}
.empty-hint { color: #9ca3af; font-size: 14px; margin-bottom: 12px; }
.qual-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: #fff;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}
.bar {
  width: 3px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
}
.card-actions { display: flex; gap: 8px; align-items: center; }
.icon-btn {
  width: 32px;
  height: 32px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
.icon-btn:hover { background: #f3f4f6; }
.icon-btn svg { width: 16px; height: 16px; }
.btn-save {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 30px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: #2563eb;
  color: #fff;
}
.btn-save:hover {
  background: #1d4ed8;
}
.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 32px;
}
.form-item {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 8px;
  align-items: start;
}
.form-item.full { grid-column: 1 / -1; }
.form-item label {
  text-align: right;
  font-size: 13px;
  color: #374151;
  padding-top: 8px;
}
.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  padding: 8px 10px;
}
.textarea-wrap { position: relative; }
.char-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 12px;
  color: #9ca3af;
}
.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #fff;
}
.btn-upload svg { width: 14px; height: 14px; }
.upload-hint { font-size: 12px; color: #9ca3af; margin-top: 6px; }
.file-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-top: 8px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}
.link-remove { color: #ef4444; font-size: 12px; }
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}
.detail-row {
  display: flex;
  gap: 8px;
  font-size: 14px;
}
.detail-row.full { grid-column: 1 / -1; }
.detail-row .label { color: #6b7280; min-width: 180px; text-align: right; flex-shrink: 0; }
.attachments { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.file-icon {
  width: 36px;
  height: 36px;
  background: #dbeafe;
  color: #2563eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}
.file-info { display: flex; flex-direction: column; gap: 2px; }
.file-name { font-size: 13px; color: #111827; }
.file-meta { font-size: 12px; color: #9ca3af; }
</style>
