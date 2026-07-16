<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
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
</script>

<template>
  <div class="parent-consent-section">
    <p v-if="listError()" class="field-error">{{ tr(listError()) }}</p>

    <div v-if="!contactList.length" class="empty-hint">
      {{ t('movementCommon.parentConsent.emptyFromProfile') }}
    </div>

    <div
      v-for="(contact, index) in contactList"
      :key="contact.id ?? index"
      class="parent-contact-block"
      :class="{ 'parent-contact-block--separated': showSeparators && index > 0 }"
    >
      <div class="contact-marker-row">
        <p class="contact-marker">{{ contactMarker(index) }}</p>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label>{{ fieldLabel('parentGuardianName') }} <span class="required">*</span></label>
          <input
            type="text"
            readonly
            :value="contact.name"
            :class="['form-control', 'is-readonly', fieldError(index, 'name')]"
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
            type="text"
            readonly
            :value="contact.relationship"
            :class="['form-control', 'is-readonly', fieldError(index, 'relationship')]"
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
            type="text"
            readonly
            :value="contact.icPassport"
            :class="['form-control', 'is-readonly', fieldError(index, 'icPassport')]"
          />
          <p v-if="errors[`parentContacts.${index}.icPassport`]" class="field-error">
            {{ tr(errors[`parentContacts.${index}.icPassport`]) }}
          </p>
        </div>
        <div class="form-field">
          <label>{{ fieldLabel('parentContactNo') }} <span class="required">*</span></label>
          <input
            type="text"
            readonly
            :value="contact.mobilePhone"
            :class="['form-control', 'is-readonly', fieldError(index, 'mobilePhone')]"
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
            type="text"
            readonly
            :value="contact.email"
            :class="['form-control', 'is-readonly', fieldError(index, 'email')]"
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

.form-control.is-readonly {
  background: #f9fafb;
  color: #4b5563;
  cursor: default;
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
