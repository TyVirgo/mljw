<script setup>
import { ref } from 'vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import { createEmptyExperience } from '../../data/lecturers.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const editingId = ref(null)
const draft = ref(null)
const pendingExpId = ref(null)

function updateList(list) {
  emit('update:modelValue', list)
}

function startAdd() {
  if (editingId.value !== null) return
  const item = createEmptyExperience()
  draft.value = { ...item }
  editingId.value = item.id
  pendingExpId.value = item.id
  updateList([...props.modelValue, item])
}

function startEdit(item) {
  if (editingId.value !== null && editingId.value !== item.id) return
  editingId.value = item.id
  draft.value = { ...item }
}

function cancelEdit() {
  if (pendingExpId.value) {
    updateList(props.modelValue.filter((e) => e.id !== pendingExpId.value))
  }
  editingId.value = null
  draft.value = null
  pendingExpId.value = null
}

function saveEdit() {
  if (!draft.value) return
  updateList(
    props.modelValue.map((e) =>
      e.id === editingId.value
        ? {
            ...draft.value,
            academicPosition: draft.value.academicPosition.trim(),
            employer: draft.value.employer.trim(),
            educationYears: draft.value.educationYears.trim(),
            industryYears: draft.value.industryYears.trim(),
          }
        : e,
    ),
  )
  editingId.value = null
  draft.value = null
  pendingExpId.value = null
}

function removeItem(id) {
  if (!window.confirm('Delete this working experience?')) return
  updateList(props.modelValue.filter((e) => e.id !== id))
  if (editingId.value === id) cancelEdit()
}

function isEditing(id) {
  return editingId.value === id
}

function formatMonthDisplay(value) {
  if (!value) return '--'
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[Number(match[2]) - 1]} ${match[3]}`
  }
  const iso = String(value).match(/^(\d{4})-(\d{2})$/)
  if (iso) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[Number(iso[2]) - 1]} ${iso[1]}`
  }
  return value
}
</script>

<template>
  <div class="exp-section">
    <button type="button" class="btn-add" @click="startAdd">+ Create</button>

    <div v-if="!modelValue.length && editingId === null" class="empty-hint">No working experience added yet.</div>

    <div v-for="(item, index) in modelValue" :key="item.id" class="exp-card">
      <div class="card-header">
        <h3 class="card-title"><span class="bar" />Working Experience {{ index + 1 }}</h3>
        <div v-if="isEditing(item.id)" class="card-actions">
          <button type="button" class="btn-save" @click="saveEdit">Save</button>
        </div>
        <div v-else class="card-actions">
          <button type="button" class="icon-btn" title="Edit" @click="startEdit(item)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button type="button" class="icon-btn" title="Delete" @click="removeItem(item.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
      </div>

      <template v-if="isEditing(item.id) && draft">
        <div class="form-grid">
          <div class="form-item">
            <label>Academic Position:</label>
            <input v-model="draft.academicPosition" type="text" placeholder="please input" />
          </div>
          <div class="form-item">
            <label>Employer:</label>
            <input v-model="draft.employer" type="text" placeholder="please input" />
          </div>
          <div class="form-item">
            <label>Start of Service:</label>
            <DatePickerEn v-model="draft.startDate" placeholder="please select date" />
          </div>
          <div class="form-item">
            <label>End of Service:</label>
            <DatePickerEn v-model="draft.endDate" placeholder="please select date" />
          </div>
          <div class="form-item">
            <label>Experience in Education (Years):</label>
            <input v-model="draft.educationYears" type="text" placeholder="please input" />
          </div>
          <div class="form-item">
            <label>Experience in Industry (Relevant Fields) (Years):</label>
            <input v-model="draft.industryYears" type="text" placeholder="please input" />
          </div>
        </div>
        <div class="card-footer">
          <button type="button" class="icon-btn" title="Cancel" @click="cancelEdit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="detail-grid">
          <div class="detail-row"><span class="label">Academic Position:</span><span>{{ item.academicPosition || '--' }}</span></div>
          <div class="detail-row"><span class="label">Employer:</span><span>{{ item.employer || '--' }}</span></div>
          <div class="detail-row"><span class="label">Start of Service:</span><span>{{ formatMonthDisplay(item.startDate) }}</span></div>
          <div class="detail-row"><span class="label">End of Service:</span><span>{{ formatMonthDisplay(item.endDate) }}</span></div>
          <div class="detail-row"><span class="label">Experience in Education (Years):</span><span>{{ item.educationYears || '--' }}</span></div>
          <div class="detail-row"><span class="label">Experience in Industry (Relevant Fields) (Years):</span><span>{{ item.industryYears || '--' }}</span></div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.exp-section { padding: 0 4px; }
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
.exp-card {
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
  grid-template-columns: 220px 1fr;
  gap: 8px;
  align-items: center;
}
.form-item label {
  text-align: right;
  font-size: 13px;
  color: #374151;
}
.form-item input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  padding: 8px 10px;
  height: 36px;
}
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
.detail-row .label {
  color: #6b7280;
  min-width: 200px;
  text-align: right;
  flex-shrink: 0;
}
</style>
