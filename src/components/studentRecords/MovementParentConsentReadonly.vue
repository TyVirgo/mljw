<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { resolveParentContacts } from '../../data/movementParentContacts.js'

const props = defineProps({
  sourceKey: {
    type: String,
    required: true,
    validator: (value) => ['deferment', 'withdrawal'].includes(value),
  },
  item: {
    type: Object,
    required: true,
  },
  displayPassport: {
    type: Function,
    default: (value) => value || '—',
  },
})

const { t, tr } = useAppI18n()

const contacts = computed(() => resolveParentContacts(props.item))

const showContactMarkers = computed(() => contacts.value.length > 1)

function fieldLabel(key) {
  return t(`${props.sourceKey}.fields.${key}`)
}

function contactMarker(index) {
  return `${tr('Parent/Guardian')} ${index + 1}`
}
</script>

<template>
  <div v-if="!contacts.length" class="empty-hint">—</div>
  <div
    v-for="(contact, index) in contacts"
    :key="contact.id ?? index"
    class="parent-contact-block"
    :class="{ 'parent-contact-block--separated': showContactMarkers && index > 0 }"
  >
    <p v-if="showContactMarkers" class="contact-marker">{{ contactMarker(index) }}</p>
    <dl class="detail-grid">
      <div>
        <dt>{{ fieldLabel('parentGuardianName') }}</dt>
        <dd>{{ contact.name || '—' }}</dd>
      </div>
      <div>
        <dt>{{ fieldLabel('parentRelationship') }}</dt>
        <dd>{{ contact.relationship || '—' }}</dd>
      </div>
      <div>
        <dt>{{ fieldLabel('parentNricPassport') }}</dt>
        <dd>{{ displayPassport(contact.icPassport) }}</dd>
      </div>
      <div>
        <dt>{{ fieldLabel('parentContactNo') }}</dt>
        <dd>{{ contact.mobilePhone || '—' }}</dd>
      </div>
      <div class="span-2">
        <dt>{{ fieldLabel('parentEmail') }}</dt>
        <dd>{{ contact.email || '—' }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.empty-hint {
  color: #6b7280;
}

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

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 0;
}

.detail-grid .span-2 {
  grid-column: span 2;
}

.detail-grid dt {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.detail-grid dd {
  margin: 0;
  font-size: 14px;
  color: #111827;
}
</style>
