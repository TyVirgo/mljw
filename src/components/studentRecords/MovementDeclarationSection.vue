<script setup>
import '../../styles/movement-form.css'
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  sectionTitle: { type: String, required: true },
  items: { type: Array, default: () => [] },
  checkboxes: {
    type: Array,
    required: true,
    // { field: string, labelKey?: string }
  },
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  agreeLabelKey: { type: String, default: 'programmeTransfer.fields.declarationAgree' },
  readOnly: { type: Boolean, default: false },
})

const { t, tr } = useAppI18n()
</script>

<template>
  <div class="movement-declaration-section">
    <div class="section-bar">{{ sectionTitle }}</div>
    <div class="declaration-box">
      <ol v-if="items.length" class="declaration-items">
        <li v-for="key in items" :key="key">{{ t(key) }}</li>
      </ol>
      <template v-for="checkbox in checkboxes" :key="checkbox.field">
        <label
          class="checkbox-row"
          :class="{ 'checkbox-row--readonly': readOnly }"
        >
          <input
            v-if="readOnly"
            type="checkbox"
            class="declaration-checkbox declaration-checkbox--locked"
            :checked="!!form[checkbox.field]"
            tabindex="-1"
            @click.prevent
          />
          <input
            v-else
            v-model="form[checkbox.field]"
            type="checkbox"
          />
          <span>
            {{ checkbox.labelKey ? t(checkbox.labelKey) : t(agreeLabelKey) }}
            <span v-if="!readOnly" class="required">*</span>
          </span>
        </label>
        <p v-if="!readOnly && errors[checkbox.field]" class="field-error">
          {{ tr(errors[checkbox.field]) }}
        </p>
      </template>
    </div>
  </div>
</template>
