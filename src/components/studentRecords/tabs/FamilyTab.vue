<script setup>
import { onMounted, ref } from 'vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import StudentFormField from '../StudentFormField.vue'
import { createEmptyFamilyMember, normalizeFamilyContacts } from '../../../data/students.js'

const props = defineProps({
  form: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  nationalitySelected: { type: Boolean, default: true },
})

const { t, tr } = useAppI18n()
const expandedIds = ref(new Set())

onMounted(() => {
  if (!Array.isArray(props.form.family)) {
    props.form.family = normalizeFamilyContacts(props.form.family)
  }
  syncExpandedIds()
})

function ensureFamilyArray() {
  if (!Array.isArray(props.form.family)) {
    props.form.family = normalizeFamilyContacts(props.form.family)
  }
}

function syncExpandedIds() {
  ensureFamilyArray()
  expandedIds.value = new Set(props.form.family.map((contact) => contact.id))
}

function isExpanded(contact) {
  return expandedIds.value.has(contact.id)
}

function toggleExpanded(contact) {
  const next = new Set(expandedIds.value)
  if (next.has(contact.id)) next.delete(contact.id)
  else next.add(contact.id)
  expandedIds.value = next
}

function addContact() {
  ensureFamilyArray()
  const member = createEmptyFamilyMember()
  props.form.family.push(member)
  expandedIds.value = new Set([...expandedIds.value, member.id])
}

function removeContact(index) {
  ensureFamilyArray()
  const contact = props.form.family[index]
  props.form.family.splice(index, 1)
  if (contact?.id) {
    const next = new Set(expandedIds.value)
    next.delete(contact.id)
    expandedIds.value = next
  }
}

function contactSubtitle(contact) {
  const relationship = String(contact.relationship || '').trim()
  const name = String(contact.name || '').trim()
  if (relationship && name) return `${relationship} — ${name}`
  return relationship || name
}
</script>

<template>
  <div class="family-tab">
    <button v-if="!readOnly" type="button" class="btn-add" @click="addContact">
      {{ tr('+ Add Family Contact') }}
    </button>

    <div v-if="!form.family?.length" class="empty-hint">{{ tr('No family contacts added yet.') }}</div>

    <article
      v-for="(contact, index) in form.family"
      :key="contact.id ?? index"
      class="family-card"
      :class="{ collapsed: !isExpanded(contact) }"
    >
      <header class="card-header">
        <button
          type="button"
          class="card-toggle"
          :aria-expanded="isExpanded(contact)"
          @click="toggleExpanded(contact)"
        >
          <svg
            class="chevron"
            :class="{ collapsed: !isExpanded(contact) }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h3 class="card-title">
            <span class="bar" />
            {{ tr('Family Contact') }} {{ index + 1 }}
            <span v-if="contact.relationship || contact.name" class="card-subtitle">
              {{ contactSubtitle(contact) }}
            </span>
          </h3>
        </button>
        <button
          v-if="!readOnly"
          type="button"
          class="btn-remove"
          :title="t('common.delete')"
          @click="removeContact(index)"
        >
          {{ tr('Remove') }}
        </button>
      </header>

      <div v-show="isExpanded(contact)" class="card-body">
        <div class="form-grid">
        <StudentFormField label="Name" :read-only="readOnly" :display-value="contact.name">
          <input v-model="contact.name" type="text" />
        </StudentFormField>
        <StudentFormField label="Relationship" :read-only="readOnly" :display-value="contact.relationship">
          <input v-model="contact.relationship" type="text" />
        </StudentFormField>
        <StudentFormField label="Occupation" :read-only="readOnly" :display-value="contact.occupation">
          <input v-model="contact.occupation" type="text" />
        </StudentFormField>
        <StudentFormField label="IC / Passport" :read-only="readOnly" :display-value="contact.icPassport">
          <input v-model="contact.icPassport" type="text" />
        </StudentFormField>
        <StudentFormField label="Race" :read-only="readOnly" :display-value="contact.race">
          <input v-model="contact.race" type="text" />
        </StudentFormField>
        <StudentFormField label="Mobile Phone" :read-only="readOnly" :display-value="contact.mobilePhone">
          <input v-model="contact.mobilePhone" type="text" />
        </StudentFormField>
        <StudentFormField label="Office Phone" :read-only="readOnly" :display-value="contact.officePhone">
          <input v-model="contact.officePhone" type="text" />
        </StudentFormField>
        <StudentFormField label="Fax" :read-only="readOnly" :display-value="contact.fax">
          <input v-model="contact.fax" type="text" />
        </StudentFormField>
        <StudentFormField label="Email" :read-only="readOnly" :display-value="contact.email">
          <input v-model="contact.email" type="email" />
        </StudentFormField>
        <StudentFormField label="Income" :read-only="readOnly" :display-value="contact.income">
          <input v-model="contact.income" type="text" />
        </StudentFormField>
        <StudentFormField label="Total Liabilities" :read-only="readOnly" :display-value="contact.totalLiabilities">
          <input v-model="contact.totalLiabilities" type="text" />
        </StudentFormField>
        <StudentFormField label="Mailing Address" full-width :read-only="readOnly" :display-value="contact.mailingAddress">
          <textarea v-model="contact.mailingAddress" rows="3" />
        </StudentFormField>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.family-tab {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.btn-add {
  align-self: flex-start;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: #2563eb;
  color: #fff;
  margin-bottom: 16px;
}

.empty-hint {
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 12px;
}

.family-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 20px 16px;
  margin-bottom: 16px;
  background: #fff;
}

.family-card.collapsed {
  padding-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-toggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  text-align: left;
  color: inherit;
  background: transparent;
  border: none;
  cursor: pointer;
}

.card-toggle:hover .card-title {
  color: #2563eb;
}

.chevron {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.card-body {
  margin-top: 16px;
}

.card-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  transition: color 0.15s ease;
}

.card-subtitle {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.bar {
  width: 3px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
}

.btn-remove {
  flex-shrink: 0;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.btn-remove:hover {
  background: #fee2e2;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 20px;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
