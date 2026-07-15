<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { createEmptyParentContact } from '../../data/movementParentContacts.js'
import '../../styles/movement-form.css'

const props = defineProps({
  sourceKey: {
    type: String,
    required: true,
    validator: (value) => ['deferment', 'withdrawal'].includes(value),
  },
  contacts: {
    type: Array,
    required: true,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:contacts'])

const { t, tr } = useAppI18n()

const strict = props.sourceKey === 'withdrawal'

const contactList = computed(() => (Array.isArray(props.contacts) ? props.contacts : []))

const showSeparators = computed(() => contactList.value.length > 1)

function fieldLabel(key) {
  return t(`${props.sourceKey}.fields.${key}`)
}

function contactMarker(index) {
  return `${tr('Parent/Guardian')} ${index + 1}`
}

function fieldError(index, field) {
  return props.errors[`parentContacts.${index}.${field}`] ? 'error' : ''
}

function listError() {
  return props.errors.parentContacts || ''
}

function emitContacts(next) {
  emit('update:contacts', next)
}

function addContact() {
  emitContacts([...contactList.value, createEmptyParentContact()])
}

function removeContact(index) {
  emitContacts(contactList.value.filter((_, i) => i !== index))
}
</script>

<template>
  <div class="parent-consent-section">
    <p v-if="listError()" class="field-error">{{ tr(listError()) }}</p>

    <div v-if="!contactList.length" class="empty-hint">
      {{ tr('No parent/guardian contacts yet. Click below to add.') }}
    </div>

    <div
      v-for="(contact, index) in contactList"
      :key="contact.id ?? index"
      class="parent-contact-block"
      :class="{ 'parent-contact-block--separated': showSeparators && index > 0 }"
    >
      <div class="contact-marker-row">
        <p class="contact-marker">{{ contactMarker(index) }}</p>
        <button
          type="button"
          class="btn-remove-contact"
          :aria-label="t('common.delete')"
          :title="t('common.delete')"
          @click="removeContact(index)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label>{{ fieldLabel('parentGuardianName') }} <span class="required">*</span></label>
          <input
            v-model="contact.name"
            type="text"
            :class="['form-control', fieldError(index, 'name')]"
          />
          <p v-if="errors[`parentContacts.${index}.name`]" class="field-error">
            {{ tr(errors[`parentContacts.${index}.name`]) }}
          </p>
        </div>
        <div class="form-field">
          <label>
            {{ fieldLabel('parentRelationship') }}
            <span v-if="strict" class="required">*</span>
          </label>
          <input
            v-model="contact.relationship"
            type="text"
            :class="['form-control', fieldError(index, 'relationship')]"
          />
          <p v-if="errors[`parentContacts.${index}.relationship`]" class="field-error">
            {{ tr(errors[`parentContacts.${index}.relationship`]) }}
          </p>
        </div>
        <div class="form-field">
          <label>
            {{ fieldLabel('parentNricPassport') }}
            <span v-if="strict" class="required">*</span>
          </label>
          <input
            v-model="contact.icPassport"
            type="text"
            :class="['form-control', fieldError(index, 'icPassport')]"
          />
          <p v-if="errors[`parentContacts.${index}.icPassport`]" class="field-error">
            {{ tr(errors[`parentContacts.${index}.icPassport`]) }}
          </p>
        </div>
        <div class="form-field">
          <label>{{ fieldLabel('parentContactNo') }} <span class="required">*</span></label>
          <input
            v-model="contact.mobilePhone"
            type="text"
            :class="['form-control', fieldError(index, 'mobilePhone')]"
          />
          <p v-if="errors[`parentContacts.${index}.mobilePhone`]" class="field-error">
            {{ tr(errors[`parentContacts.${index}.mobilePhone`]) }}
          </p>
        </div>
        <div class="form-field span-2">
          <label>
            {{ fieldLabel('parentEmail') }}
            <span v-if="strict" class="required">*</span>
          </label>
          <input
            v-model="contact.email"
            type="text"
            :class="['form-control', fieldError(index, 'email')]"
          />
          <p v-if="errors[`parentContacts.${index}.email`]" class="field-error">
            {{ tr(errors[`parentContacts.${index}.email`]) }}
          </p>
        </div>
      </div>
    </div>

    <button type="button" class="btn-add-contact" @click="addContact">
      {{ tr('+ Add Parent/Guardian') }}
    </button>
  </div>
</template>

<style scoped>
.parent-contact-block--separated {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.contact-marker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

.contact-marker {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 6px 10px;
  background: #f9fafb;
  border-left: 3px solid #d1d5db;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #6b7280;
}

.btn-remove-contact {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.btn-remove-contact:hover {
  color: #ef4444;
  background: #fee2e2;
}

.btn-remove-contact svg {
  width: 16px;
  height: 16px;
}

.btn-add-contact {
  width: 100%;
  margin-top: 12px;
  height: 36px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.btn-add-contact:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.empty-hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.span-2 {
  grid-column: span 2;
}

.form-field label {
  font-size: 13px;
  color: #374151;
  font-weight: 600;
}

.required {
  color: #ef4444;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #ef4444;
}
</style>
