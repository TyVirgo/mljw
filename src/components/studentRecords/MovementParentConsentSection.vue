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

defineEmits(['update:contacts'])

const { t, tr } = useAppI18n()

const strict = props.sourceKey === 'withdrawal'

const contactList = computed(() =>
  Array.isArray(props.contacts) && props.contacts.length
    ? props.contacts
    : [createEmptyParentContact()],
)

const showContactMarkers = computed(() => contactList.value.length > 1)

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
</script>

<template>
  <div class="parent-consent-section">
    <p v-if="listError()" class="field-error">{{ tr(listError()) }}</p>

    <div
      v-for="(contact, index) in contactList"
      :key="contact.id ?? index"
      class="parent-contact-block"
      :class="{ 'parent-contact-block--separated': showContactMarkers && index > 0 }"
    >
      <p v-if="showContactMarkers" class="contact-marker">{{ contactMarker(index) }}</p>

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
  </div>
</template>

<style scoped>
.parent-contact-block--separated {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.contact-marker {
  margin: 0 0 10px;
  padding: 6px 10px;
  background: #f9fafb;
  border-left: 3px solid #d1d5db;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
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
